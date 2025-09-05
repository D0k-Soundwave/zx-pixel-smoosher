/**
 * Aggressive Memory Auto-Free Manager
 * Proactively reclaims resources at every opportunity for maximum efficiency
 * @class MemoryManager
 */
class MemoryManager {
    constructor(eventBus, options = {}) {
        this.eventBus = eventBus;
        this.options = {
            // Aggressive cleanup thresholds
            memoryThreshold: options.memoryThreshold || 50 * 1024 * 1024, // 50MB
            cleanupInterval: options.cleanupInterval || 5000, // 5 seconds
            aggressiveMode: options.aggressiveMode !== false, // Default ON
            forceGCInterval: options.forceGCInterval || 10000, // 10 seconds
            objectPoolSize: options.objectPoolSize || 1000,
            cacheLimit: options.cacheLimit || 100,
            ...options
        };

        // Resource tracking
        this.resources = {
            canvasContexts: new Set(),
            imageData: new WeakSet(),
            eventListeners: new Map(),
            timers: new Set(),
            workers: new Set(),
            objectPools: new Map(),
            caches: new Map(),
            tempArrays: new Set(),
            observers: new Set()
        };

        // Performance metrics
        this.metrics = {
            cleanupCount: 0,
            memoryFreed: 0,
            lastCleanup: Date.now(),
            gcForced: 0,
            resourcesReclaimed: 0
        };

        // Memory pressure detection
        this.memoryPressure = {
            level: 'normal', // normal, moderate, high, critical
            lastCheck: Date.now(),
            consecutiveHighReadings: 0
        };

        this.initializeAutoCleanup();
        this.setupEventListeners();
        this.startMonitoring();
    }

    /**
     * Initialize aggressive auto-cleanup system
     */
    initializeAutoCleanup() {
        // Primary cleanup interval - very aggressive
        this.cleanupTimer = setInterval(() => {
            this.performAutoCleanup();
        }, this.options.cleanupInterval);

        // Force garbage collection interval
        if (this.options.aggressiveMode) {
            this.gcTimer = setInterval(() => {
                this.forceGarbageCollection();
            }, this.options.forceGCInterval);
        }

        // Memory pressure monitoring
        this.pressureTimer = setInterval(() => {
            this.checkMemoryPressure();
        }, 2000);

        // Idle cleanup - when user is inactive
        this.idleTimer = null;
        this.lastActivity = Date.now();
        this.setupIdleDetection();
    }

    /**
     * Setup event listeners for automatic cleanup triggers
     */
    setupEventListeners() {
        // Cleanup after major operations
        this.eventBus.on('state-changed', () => this.scheduleCleanup('state-change'));
        this.eventBus.on('canvas-updated', () => this.scheduleCleanup('canvas-update'));
        this.eventBus.on('file-loaded', () => this.scheduleCleanup('file-load'));
        this.eventBus.on('operation-complete', () => this.scheduleCleanup('operation'));
        this.eventBus.on('tool-changed', () => this.scheduleCleanup('tool-change'));
        this.eventBus.on('zoom-changed', () => this.scheduleCleanup('zoom'));
        
        // Emergency cleanup triggers
        this.eventBus.on('memory-warning', () => this.performEmergencyCleanup());
        this.eventBus.on('performance-warning', () => this.performEmergencyCleanup());
        
        // Browser events - store bound functions for proper cleanup
        this.boundCompleteCleanup = () => this.performCompleteCleanup();
        this.boundVisibilityChange = () => {
            if (document.hidden) {
                this.performAggressiveCleanup();
            }
        };
        this.boundTrackActivity = () => this.trackActivity();
        
        window.addEventListener('beforeunload', this.boundCompleteCleanup);
        window.addEventListener('visibilitychange', this.boundVisibilityChange);
        
        // User activity tracking for idle cleanup
        ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            // Check if passive listeners are supported
            const supportsPassive = this.checkPassiveSupport();
            const options = supportsPassive ? { passive: true } : false;
            document.addEventListener(event, this.boundTrackActivity, options);
        });
    }

    /**
     * Check if passive event listeners are supported
     * @returns {boolean} True if passive listeners are supported
     */
    checkPassiveSupport() {
        let supportsPassive = false;
        try {
            const opts = Object.defineProperty({}, 'passive', {
                get: () => {
                    supportsPassive = true;
                    return true;
                }
            });
            window.addEventListener('test', null, opts);
            window.removeEventListener('test', null, opts);
        } catch (e) {
            // Passive not supported
        }
        return supportsPassive;
    }
    
    /**
     * Track user activity for idle-based cleanup
     */
    trackActivity() {
        this.lastActivity = Date.now();
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
        }
        
        // Schedule idle cleanup after 30 seconds of inactivity
        this.idleTimer = setTimeout(() => {
            this.performIdleCleanup();
        }, 30000);
    }

    /**
     * Schedule cleanup with debouncing to prevent excessive calls
     */
    scheduleCleanup(trigger, delay = 100) {
        if (this.scheduledCleanup) {
            clearTimeout(this.scheduledCleanup);
        }
        
        this.scheduledCleanup = setTimeout(() => {
            this.performAutoCleanup(trigger);
            this.scheduledCleanup = null;
        }, delay);
    }

    /**
     * Main auto-cleanup routine - called frequently
     */
    performAutoCleanup(trigger = 'interval') {
        const startTime = performance.now();
        let resourcesFreed = 0;

        try {
            // 1. Clean up temporary objects and arrays
            resourcesFreed += this.cleanupTemporaryResources();
            
            // 2. Purge stale caches
            resourcesFreed += this.purgeStaleCaches();
            
            // 3. Clean up event listeners
            resourcesFreed += this.cleanupEventListeners();
            
            // 4. Release unused canvas contexts
            resourcesFreed += this.cleanupCanvasContexts();
            
            // 5. Clear object pools of excess objects
            resourcesFreed += this.optimizeObjectPools();
            
            // 6. Force immediate garbage collection if needed
            if (this.shouldForceGC()) {
                this.forceGarbageCollection();
            }

            // Update metrics
            this.metrics.cleanupCount++;
            this.metrics.resourcesReclaimed += resourcesFreed;
            this.metrics.lastCleanup = Date.now();

            // Emit cleanup event
            this.eventBus.emit('memory-cleaned', {
                trigger,
                resourcesFreed,
                duration: performance.now() - startTime,
                memoryPressure: this.memoryPressure.level
            });

        } catch (error) {
            console.warn('Auto-cleanup error:', error);
        }
    }

    /**
     * Emergency cleanup for critical memory situations
     */
    performEmergencyCleanup() {
        console.warn('Performing emergency memory cleanup');
        
        // Aggressive resource cleanup
        this.clearAllCaches();
        this.cleanupAllTemporaryResources();
        this.forceGarbageCollection();
        this.compactObjectPools();
        
        // Reset any large data structures
        this.eventBus.emit('emergency-memory-cleanup');
        
        this.eventBus.emit('status', { 
            message: '🔥 Emergency memory cleanup performed', 
            type: 'warning' 
        });
    }

    /**
     * Aggressive cleanup when app becomes hidden/inactive
     */
    performAggressiveCleanup() {
        this.clearAllCaches();
        this.cleanupAllTemporaryResources();
        this.cleanupCanvasContexts();
        this.compactObjectPools();
        this.forceGarbageCollection();
        
        this.eventBus.emit('status', { 
            message: '💤 Aggressive cleanup - app inactive', 
            type: 'info' 
        });
    }

    /**
     * Idle cleanup when user hasn't interacted recently
     */
    performIdleCleanup() {
        if (Date.now() - this.lastActivity < 25000) return; // User became active
        
        this.purgeStaleCaches();
        this.optimizeObjectPools();
        this.cleanupTemporaryResources();
        
        // Schedule another idle cleanup
        this.idleTimer = setTimeout(() => this.performIdleCleanup(), 30000);
    }

    /**
     * Complete cleanup on app shutdown
     */
    performCompleteCleanup() {
        // Clear all timers to prevent memory leaks
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        if (this.gcTimer) {
            clearInterval(this.gcTimer);
            this.gcTimer = null;
        }
        if (this.pressureTimer) {
            clearInterval(this.pressureTimer);
            this.pressureTimer = null;
        }
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
        if (this.scheduledCleanup) {
            clearTimeout(this.scheduledCleanup);
            this.scheduledCleanup = null;
        }
        
        this.clearAllCaches();
        this.cleanupAllResources();
        this.resources.timers.forEach(timer => {
            clearTimeout(timer);
            clearInterval(timer);
        });
        this.resources.timers.clear();
        this.resources.workers.forEach(worker => {
            try {
                worker.terminate();
            } catch (error) {
                console.warn('Error terminating worker:', error);
            }
        });
        this.resources.workers.clear();
        
        // Remove event listeners to prevent leaks
        if (this.boundTrackActivity) {
            ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
                document.removeEventListener(event, this.boundTrackActivity);
            });
        }
        if (this.boundCompleteCleanup) {
            window.removeEventListener('beforeunload', this.boundCompleteCleanup);
        }
        if (this.boundVisibilityChange) {
            window.removeEventListener('visibilitychange', this.boundVisibilityChange);
        }
    }

    /**
     * Clean up temporary resources like arrays and objects
     */
    cleanupTemporaryResources() {
        let freed = 0;
        
        // Clear temporary arrays
        this.resources.tempArrays.forEach(array => {
            if (Array.isArray(array)) {
                array.length = 0;
                freed++;
            }
        });
        this.resources.tempArrays.clear();
        
        return freed;
    }

    cleanupAllTemporaryResources() {
        this.cleanupTemporaryResources();
        
        // Force nullify any tracked objects
        this.resources.tempArrays.clear();
        
        // Clear shape generator caches if they exist
        this.eventBus.emit('clear-shape-caches');
    }

    /**
     * Purge stale cache entries
     */
    purgeStaleCaches() {
        let freed = 0;
        const now = Date.now();
        const maxAge = 300000; // 5 minutes
        
        this.resources.caches.forEach((cache, name) => {
            if (cache.lastAccess && now - cache.lastAccess > maxAge) {
                if (cache.clear) {
                    cache.clear();
                    freed++;
                } else if (cache instanceof Map) {
                    cache.clear();
                    freed++;
                }
            }
        });
        
        return freed;
    }

    clearAllCaches() {
        this.resources.caches.forEach(cache => {
            if (cache.clear) cache.clear();
            else if (cache instanceof Map) cache.clear();
        });
        this.eventBus.emit('clear-all-caches');
    }

    /**
     * Clean up unused event listeners
     */
    cleanupEventListeners() {
        let freed = 0;
        
        this.resources.eventListeners.forEach((listeners, element) => {
            try {
                // Check if element is a valid Node before calling contains()
                const isValidNode = element && 
                                   typeof element === 'object' && 
                                   element.nodeType !== undefined &&
                                   element instanceof Node;
                
                if (!isValidNode || !document.contains(element) || (isValidNode && !element.isConnected)) {
                    // Handle different types of listener tracking
                    if (Array.isArray(listeners)) {
                        // Individual DOM event listeners format
                        listeners.forEach(({ event, handler }) => {
                            try {
                                if (isValidNode && typeof element.removeEventListener === 'function') {
                                    element.removeEventListener(event, handler);
                                }
                                freed++;
                            } catch (removeError) {
                                console.warn('Failed to remove event listener:', removeError);
                                freed++; // Still count as freed since we're removing the reference
                            }
                        });
                    } else if (listeners && typeof listeners === 'object') {
                        // Service metadata format (e.g., eventBus tracking)
                        // Service listener tracking cleanup
                        freed++; // Count as freed since we're removing the service reference
                    } else {
                        console.warn('Invalid listeners format found during cleanup:', typeof listeners, listeners);
                        freed++; // Count as freed since we're removing the invalid entry
                    }
                    this.resources.eventListeners.delete(element);
                }
            } catch (error) {
                console.warn('Error during event listener cleanup:', error);
                // Remove the problematic entry
                this.resources.eventListeners.delete(element);
            }
        });
        
        return freed;
    }

    /**
     * Clean up unused canvas contexts
     */
    cleanupCanvasContexts() {
        let freed = 0;
        
        this.resources.canvasContexts.forEach(ctx => {
            try {
                // Check if canvas is a valid Node before calling contains()
                const isValidCanvas = ctx.canvas && 
                                     typeof ctx.canvas === 'object' && 
                                     ctx.canvas.nodeType !== undefined &&
                                     ctx.canvas instanceof Node;
                
                if (!isValidCanvas || !document.contains(ctx.canvas)) {
                    // Clear the context safely
                    try {
                        if (ctx.canvas && typeof ctx.clearRect === 'function') {
                            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                        }
                    } catch (clearError) {
                        console.warn('Failed to clear canvas context:', clearError);
                    }
                    this.resources.canvasContexts.delete(ctx);
                    freed++;
                }
            } catch (error) {
                console.warn('Error during canvas context cleanup:', error);
                // Remove the problematic entry
                this.resources.canvasContexts.delete(ctx);
                freed++;
            }
        });
        
        return freed;
    }

    /**
     * Optimize object pools by removing excess objects
     */
    optimizeObjectPools() {
        let freed = 0;
        
        this.resources.objectPools.forEach((pool, name) => {
            if (Array.isArray(pool) && pool.length > this.options.objectPoolSize) {
                const excess = pool.length - this.options.objectPoolSize;
                pool.splice(this.options.objectPoolSize);
                freed += excess;
            }
        });
        
        return freed;
    }

    compactObjectPools() {
        this.resources.objectPools.forEach(pool => {
            if (Array.isArray(pool)) {
                pool.length = Math.min(pool.length, Math.floor(this.options.objectPoolSize / 2));
            }
        });
    }

    /**
     * Force garbage collection if available
     */
    forceGarbageCollection() {
        if (window.gc) {
            try {
                window.gc();
                this.metrics.gcForced++;
            } catch (e) {
                // Ignore errors
            }
        }
        
        // Alternative: Create memory pressure to encourage GC
        if (this.options.aggressiveMode) {
            const temp = new Array(1000).fill(null);
            temp.length = 0;
        }
    }

    /**
     * Check if we should force garbage collection
     */
    shouldForceGC() {
        return this.memoryPressure.level === 'high' || 
               this.memoryPressure.level === 'critical' ||
               this.metrics.cleanupCount % 10 === 0;
    }

    /**
     * Monitor memory pressure
     */
    checkMemoryPressure() {
        try {
            // Use performance.memory if available (Chrome)
            if (performance.memory) {
                const used = performance.memory.usedJSHeapSize;
                const limit = performance.memory.jsHeapSizeLimit;
                const pressure = used / limit;
                
                if (pressure > 0.9) {
                    this.memoryPressure.level = 'critical';
                    this.performEmergencyCleanup();
                } else if (pressure > 0.7) {
                    this.memoryPressure.level = 'high';
                } else if (pressure > 0.5) {
                    this.memoryPressure.level = 'moderate';
                } else {
                    this.memoryPressure.level = 'normal';
                }
                
                this.memoryPressure.lastCheck = Date.now();
            }
        } catch (error) {
            throw new Error(`Memory pressure check failed: ${error.message}`);
        }
    }

    /**
     * Start monitoring system
     */
    startMonitoring() {
        this.setupIdleDetection();
        this.eventBus.emit('memory-manager-started');
    }

    setupIdleDetection() {
        this.trackActivity(); // Initialize
    }

    /**
     * Register resource for tracking
     */
    registerResource(type, resource, metadata = {}) {
        if (this.resources[type]) {
            if (this.resources[type] instanceof Set) {
                this.resources[type].add(resource);
            } else if (this.resources[type] instanceof Map) {
                this.resources[type].set(resource, metadata);
            }
        }
    }

    /**
     * Unregister resource
     */
    unregisterResource(type, resource) {
        if (this.resources[type]) {
            if (this.resources[type] instanceof Set) {
                this.resources[type].delete(resource);
            } else if (this.resources[type] instanceof Map) {
                this.resources[type].delete(resource);
            }
        }
    }

    /**
     * Get memory statistics
     */
    getMemoryStats() {
        const stats = {
            ...this.metrics,
            memoryPressure: this.memoryPressure.level,
            trackedResources: {},
            performance: {}
        };

        // Count tracked resources
        Object.keys(this.resources).forEach(type => {
            stats.trackedResources[type] = this.resources[type].size || 0;
        });

        // Performance memory if available
        if (performance.memory) {
            stats.performance = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                pressure: performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit
            };
        }

        return stats;
    }

    /**
     * Cleanup all resources
     */
    cleanupAllResources() {
        Object.keys(this.resources).forEach(type => {
            if (this.resources[type].clear) {
                this.resources[type].clear();
            }
        });
    }

    /**
     * Destroy memory manager
     */
    destroy() {
        this.performCompleteCleanup();
        this.cleanupAllResources();
        this.eventBus.emit('memory-manager-destroyed');
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryManager;
} else if (typeof window !== 'undefined') {
    window.MemoryManager = MemoryManager;
}