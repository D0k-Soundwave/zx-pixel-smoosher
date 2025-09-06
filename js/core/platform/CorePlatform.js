/**
 * CorePlatform.js - Central platform coordinator for the modular architecture
 * Manages services, modules, events, and provides the core infrastructure
 * @module CorePlatform
 */

class CorePlatform {
    constructor(config = {}) {
        this.config = this.validateConfig(config);
        this.initialized = false;
        this.disposed = false;
        this.startTime = performance.now();
        
        // Core components
        this.eventBus = null;
        this.serviceRegistry = null;
        this.moduleLoader = null;
        this.errorHandler = null;
        this.memoryManager = null;
        
        // API registry for module interfaces
        this.apis = new Map();
        
        // Platform metadata
        this.metadata = {
            version: '2.0.0',
            environment: this.detectEnvironment(),
            capabilities: this.detectCapabilities(),
            startTime: new Date().toISOString()
        };

        // Performance monitoring
        this.performance = {
            frameTime: 16.67, // Target 60 FPS
            lastFrame: 0,
            fps: 0,
            memory: {}
        };

        // Initialize core components
        this.initializeCore();
    }

    /**
     * Validate and merge configuration
     * @private
     */
    validateConfig(config) {
        const defaults = {
            debug: false,
            strict: true,
            maxMemory: 512 * 1024 * 1024, // 512MB
            eventQueueSize: 1000,
            autoCleanup: true,
            cleanupInterval: 30000, // 30 seconds
            performanceMonitoring: true,
            errorRecovery: true,
            compatibility: {
                legacy: true,
                experimental: false
            }
        };

        // Deep merge configuration
        const merged = this.deepMerge(defaults, config);

        // Validate required fields
        if (typeof merged.debug !== 'boolean') {
            throw new TypeError('Config.debug must be a boolean');
        }

        if (typeof merged.maxMemory !== 'number' || merged.maxMemory <= 0) {
            throw new TypeError('Config.maxMemory must be a positive number');
        }

        return merged;
    }

    /**
     * Deep merge objects
     * @private
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    /**
     * Initialize core components
     * @private
     */
    initializeCore() {
        try {
            // Initialize EventBus
            if (typeof EventBus !== 'undefined') {
                this.eventBus = window.app?.eventBus || new EventBus();
            } else {
                console.warn('EventBus not found, creating minimal implementation');
                this.eventBus = this.createMinimalEventBus();
            }

            // Initialize ServiceRegistry
            if (typeof ServiceRegistry !== 'undefined') {
                this.serviceRegistry = new ServiceRegistry();
            } else {
                throw new Error('ServiceRegistry is required but not found');
            }

            // Initialize ModuleLoader
            if (typeof ModuleLoader !== 'undefined') {
                this.moduleLoader = new ModuleLoader(this);
            } else {
                throw new Error('ModuleLoader is required but not found');
            }

            // Initialize ErrorHandler
            if (typeof ErrorHandler !== 'undefined') {
                this.errorHandler = window.app?.errorHandler || new ErrorHandler(this.eventBus);
                this.serviceRegistry.register('errorHandler', this.errorHandler, { singleton: true });
            }

            // Initialize MemoryManager
            if (typeof MemoryManager !== 'undefined') {
                this.memoryManager = window.app?.memoryManager || new MemoryManager(this.eventBus);
                this.serviceRegistry.register('memoryManager', this.memoryManager, { singleton: true });
            }

            // Register core services
            this.serviceRegistry.register('eventBus', this.eventBus, { singleton: true });
            this.serviceRegistry.register('platform', this, { singleton: true });

            // Setup error handling
            this.setupErrorHandling();

            // Setup performance monitoring
            if (this.config.performanceMonitoring) {
                this.startPerformanceMonitoring();
            }

            // Setup auto cleanup
            if (this.config.autoCleanup) {
                this.startAutoCleanup();
            }

            this.initialized = true;

        } catch (error) {
            console.error('Failed to initialize CorePlatform:', error);
            throw error;
        }
    }

    /**
     * Create minimal EventBus implementation if not available
     * @private
     */
    createMinimalEventBus() {
        return {
            listeners: new Map(),
            on(event, handler) {
                if (!this.listeners.has(event)) {
                    this.listeners.set(event, new Set());
                }
                this.listeners.get(event).add(handler);
            },
            off(event, handler) {
                if (this.listeners.has(event)) {
                    this.listeners.get(event).delete(handler);
                }
            },
            emit(event, data) {
                if (this.listeners.has(event)) {
                    this.listeners.get(event).forEach(handler => {
                        try {
                            handler(data);
                        } catch (error) {
                            console.error(`Error in event handler for ${event}:`, error);
                        }
                    });
                }
            },
            once(event, handler) {
                const wrapper = (data) => {
                    handler(data);
                    this.off(event, wrapper);
                };
                this.on(event, wrapper);
            }
        };
    }

    /**
     * Detect environment capabilities
     * @private
     */
    detectEnvironment() {
        return {
            browser: typeof window !== 'undefined',
            node: typeof process !== 'undefined' && process.versions && process.versions.node,
            worker: typeof WorkerGlobalScope !== 'undefined' && typeof importScripts === 'function',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
        };
    }

    /**
     * Detect platform capabilities
     * @private
     */
    detectCapabilities() {
        const caps = {
            webgl: false,
            webgl2: false,
            webworkers: false,
            serviceworker: false,
            indexeddb: false,
            localstorage: false,
            canvas: false,
            touch: false,
            deviceOrientation: false,
            geolocation: false,
            notifications: false,
            fullscreen: false
        };

        if (typeof window !== 'undefined') {
            // Canvas and WebGL
            try {
                const canvas = document.createElement('canvas');
                caps.canvas = !!canvas;
                if (canvas) {
                    caps.webgl = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                    caps.webgl2 = !!canvas.getContext('webgl2');
                }
            } catch (e) {}

            // Web Workers
            caps.webworkers = typeof Worker !== 'undefined';

            // Service Workers
            caps.serviceworker = 'serviceWorker' in navigator;

            // Storage
            caps.indexeddb = 'indexedDB' in window;
            caps.localstorage = 'localStorage' in window;

            // Touch
            caps.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            // Other APIs
            caps.deviceOrientation = 'DeviceOrientationEvent' in window;
            caps.geolocation = 'geolocation' in navigator;
            caps.notifications = 'Notification' in window;
            caps.fullscreen = document.fullscreenEnabled || 
                            document.webkitFullscreenEnabled || 
                            document.mozFullScreenEnabled || 
                            document.msFullscreenEnabled;
        }

        return caps;
    }

    /**
     * Setup global error handling
     * @private
     */
    setupErrorHandling() {
        if (typeof window !== 'undefined') {
            // Handle uncaught errors
            window.addEventListener('error', (event) => {
                this.handleError(new Error(event.message), {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });

            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError(new Error(`Unhandled promise rejection: ${event.reason}`), {
                    promise: event.promise
                });
            });
        }
    }

    /**
     * Handle platform errors
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     */
    handleError(error, context = {}) {
        if (this.config.debug) {
            console.error('Platform error:', error, context);
        }

        if (this.errorHandler) {
            this.errorHandler.handleError('Platform Error', error);
        }

        if (this.eventBus) {
            this.eventBus.emit('platform:error', { error, context });
        }

        // Attempt recovery if enabled
        if (this.config.errorRecovery) {
            this.attemptErrorRecovery(error, context);
        }
    }

    /**
     * Attempt to recover from errors
     * @private
     */
    attemptErrorRecovery(error, context) {
        // Module-specific recovery
        if (context.module) {
            const moduleState = this.moduleLoader?.getModuleState(context.module);
            if (moduleState === 'error') {
                console.log(`Attempting to reload module: ${context.module}`);
                // Module reload logic would go here
            }
        }

        // Memory-related recovery
        if (error.message.includes('memory') || error.message.includes('heap')) {
            if (this.memoryManager) {
                console.log('Attempting memory cleanup...');
                this.memoryManager.forceCleanup();
            }
        }
    }

    /**
     * Start performance monitoring
     * @private
     */
    startPerformanceMonitoring() {
        let lastTime = performance.now();
        let frames = 0;

        const monitor = () => {
            if (this.disposed) return;

            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;

            frames++;
            if (deltaTime >= 1000) {
                this.performance.fps = Math.round((frames * 1000) / deltaTime);
                frames = 0;
                lastTime = currentTime;

                // Update memory stats
                if (performance.memory) {
                    this.performance.memory = {
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit
                    };
                }

                // Emit performance update
                if (this.eventBus) {
                    this.eventBus.emit('platform:performance', this.performance);
                }
            }

            requestAnimationFrame(monitor);
        };

        requestAnimationFrame(monitor);
    }

    /**
     * Start automatic cleanup
     * @private
     */
    startAutoCleanup() {
        this.cleanupInterval = setInterval(() => {
            if (this.disposed) {
                clearInterval(this.cleanupInterval);
                return;
            }

            // Memory cleanup
            if (this.memoryManager) {
                this.memoryManager.scheduleCleanup();
            }

            // Module health checks
            this.performHealthChecks();

        }, this.config.cleanupInterval);
    }

    /**
     * Perform health checks on all components
     * @private
     */
    async performHealthChecks() {
        const results = {
            services: {},
            modules: {},
            platform: {
                uptime: performance.now() - this.startTime,
                memory: this.performance.memory,
                fps: this.performance.fps
            }
        };

        // Check services
        if (this.serviceRegistry) {
            results.services = await this.serviceRegistry.performHealthChecks();
        }

        // Check modules
        if (this.moduleLoader) {
            const modules = this.moduleLoader.getAllModules();
            for (const [name, module] of modules) {
                if (module.healthCheck) {
                    try {
                        results.modules[name] = await module.healthCheck();
                    } catch (error) {
                        results.modules[name] = { healthy: false, error: error.message };
                    }
                }
            }
        }

        if (this.eventBus) {
            this.eventBus.emit('platform:health', results);
        }

        return results;
    }

    /**
     * Register a module API
     * @param {string} name - API name
     * @param {Object} api - API interface
     */
    registerAPI(name, api) {
        if (!name || !api) {
            throw new Error('Name and API are required');
        }

        if (this.apis.has(name)) {
            console.warn(`API '${name}' is being overwritten`);
        }

        this.apis.set(name, api);

        if (this.eventBus) {
            this.eventBus.emit('platform:api:registered', { name, api });
        }
    }

    /**
     * Get a registered API
     * @param {string} name - API name
     * @returns {Object|null} API interface
     */
    getAPI(name) {
        return this.apis.get(name) || null;
    }

    /**
     * Get a service from the registry
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    getService(name) {
        if (!this.serviceRegistry) {
            throw new Error('ServiceRegistry not initialized');
        }
        return this.serviceRegistry.get(name);
    }

    /**
     * Get a module from the loader
     * @param {string} name - Module name
     * @returns {Object|null} Module instance
     */
    getModule(name) {
        if (!this.moduleLoader) {
            throw new Error('ModuleLoader not initialized');
        }
        return this.moduleLoader.getModule(name);
    }

    /**
     * Load a module
     * @param {Function|Object} ModuleClass - Module class or instance
     * @param {Object} config - Module configuration
     * @returns {Promise<Object>} Loaded module
     */
    async loadModule(ModuleClass, config = {}) {
        if (!this.moduleLoader) {
            throw new Error('ModuleLoader not initialized');
        }
        return await this.moduleLoader.loadModule(ModuleClass, config);
    }

    /**
     * Register existing services from legacy app
     */
    registerExistingServices() {
        if (typeof window !== 'undefined' && window.app) {
            const services = [
                'stateManager',
                'colorManager',
                'canvasService',
                'fillManager',
                'historyManager',
                'toolManager',
                'uiController',
                'drawingService',
                'fileManager'
            ];

            const registeredServices = [];
            const pendingServices = [];

            services.forEach(serviceName => {
                if (window.app[serviceName]) {
                    this.serviceRegistry.register(serviceName, window.app[serviceName], {
                        singleton: true,
                        metadata: { source: 'legacy' }
                    });
                    registeredServices.push(serviceName);
                } else {
                    pendingServices.push(serviceName);
                }
            });

            if (registeredServices.length > 0) {
                console.log(`✓ Registered ${registeredServices.length} legacy services:`, registeredServices);
            }

            if (pendingServices.length > 0) {
                console.log(`⏳ ${pendingServices.length} services pending registration:`, pendingServices);
                this.setupDeferredServiceRegistration(pendingServices);
            }
        }
    }

    /**
     * Setup deferred registration for services that aren't ready yet
     * @param {string[]} pendingServices - Services to register when available
     */
    setupDeferredServiceRegistration(pendingServices) {
        if (!this.deferredRegistrationTimer) {
            this.deferredRegistrationAttempts = 0;
            this.maxDeferredAttempts = 50; // 5 seconds max (100ms intervals)
            
            this.deferredRegistrationTimer = setInterval(() => {
                this.deferredRegistrationAttempts++;
                
                const stillPending = pendingServices.filter(serviceName => {
                    if (window.app && window.app[serviceName]) {
                        // Service is now available, register it
                        this.serviceRegistry.register(serviceName, window.app[serviceName], {
                            singleton: true,
                            metadata: { source: 'legacy-deferred' }
                        });
                        console.log(`✓ Deferred registration successful: ${serviceName}`);
                        return false; // Remove from pending list
                    }
                    return true; // Still pending
                });

                // Update the pending list
                pendingServices.splice(0, pendingServices.length, ...stillPending);

                // Stop if all services registered or max attempts reached
                if (stillPending.length === 0 || this.deferredRegistrationAttempts >= this.maxDeferredAttempts) {
                    clearInterval(this.deferredRegistrationTimer);
                    this.deferredRegistrationTimer = null;
                    
                    if (stillPending.length > 0) {
                        console.warn(`⚠️ Failed to register ${stillPending.length} services after ${this.deferredRegistrationAttempts} attempts:`, stillPending);
                    } else {
                        console.log(`✅ All deferred services registered after ${this.deferredRegistrationAttempts} attempts`);
                    }
                }
            }, 100); // Check every 100ms
        }
    }

    /**
     * Initialize the platform
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            // Register existing services if in compatibility mode
            if (this.config.compatibility.legacy) {
                this.registerExistingServices();
            }

            // Load core modules
            // These would be loaded here

            this.initialized = true;

            if (this.eventBus) {
                this.eventBus.emit('platform:initialized', {
                    metadata: this.metadata,
                    config: this.config
                });
            }

        } catch (error) {
            this.handleError(error, { phase: 'initialization' });
            throw error;
        }
    }

    /**
     * Get platform status
     * @returns {Object} Platform status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            disposed: this.disposed,
            uptime: performance.now() - this.startTime,
            metadata: this.metadata,
            config: this.config,
            performance: this.performance,
            services: this.serviceRegistry ? this.serviceRegistry.list() : [],
            modules: this.moduleLoader ? Array.from(this.moduleLoader.getAllModules().keys()) : [],
            apis: Array.from(this.apis.keys())
        };
    }

    /**
     * Dispose of the platform
     * @returns {Promise<void>}
     */
    async dispose() {
        if (this.disposed) {
            return;
        }

        try {
            // Stop monitoring
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
            }

            // Clear deferred registration timer
            if (this.deferredRegistrationTimer) {
                clearInterval(this.deferredRegistrationTimer);
                this.deferredRegistrationTimer = null;
            }

            // Dispose modules
            if (this.moduleLoader) {
                await this.moduleLoader.dispose();
            }

            // Dispose services
            if (this.serviceRegistry) {
                await this.serviceRegistry.dispose();
            }

            // Clear APIs
            this.apis.clear();

            // Emit disposal event
            if (this.eventBus) {
                this.eventBus.emit('platform:disposed');
            }

            this.disposed = true;

        } catch (error) {
            console.error('Error disposing platform:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CorePlatform;
} else if (typeof window !== 'undefined') {
    window.CorePlatform = CorePlatform;
}