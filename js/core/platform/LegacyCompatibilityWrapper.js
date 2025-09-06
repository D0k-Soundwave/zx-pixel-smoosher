/**
 * LegacyCompatibilityWrapper.js - Backwards compatibility layer for existing code
 * Maintains existing global window.app interface while routing to modular system
 * @module LegacyCompatibilityWrapper
 */

class LegacyCompatibilityWrapper {
    constructor(modernPlatform) {
        if (!modernPlatform) {
            throw new Error('Modern platform instance is required');
        }

        this.modernPlatform = modernPlatform;
        this.legacyServices = new Map();
        this.eventBridge = new Map();
        this.initialized = false;
        this.disposed = false;
        
        // Track original window.app if it exists
        this.originalApp = typeof window !== 'undefined' ? window.app : null;
        
        this.setupLegacyAPI();
    }

    /**
     * Setup the legacy API interface
     * @private
     */
    setupLegacyAPI() {
        if (typeof window === 'undefined') {
            throw new Error('Window object is REQUIRED for legacy compatibility but not available');
        }

        // Create legacy app interface
        const legacyApp = {
            // Platform reference
            platform: this.modernPlatform,
            
            // Core services (legacy proxies)
            eventBus: this.createEventBusProxy(),
            errorHandler: this.createServiceProxy('errorHandler'),
            memoryManager: this.createServiceProxy('memoryManager'),
            
            // State management services
            stateManager: this.createStateManagerProxy(),
            colorManager: this.createColorManagerProxy(),
            historyManager: this.createServiceProxy('historyManager'),
            
            // Canvas and drawing services
            canvasService: this.createServiceProxy('canvasService'),
            drawingService: this.createServiceProxy('drawingService'),
            
            // Tool services
            toolManager: this.createServiceProxy('toolManager'),
            fillManager: this.createServiceProxy('fillManager'),
            
            // UI services
            uiController: this.createServiceProxy('uiController'),
            
            // File services
            fileManager: this.createServiceProxy('fileManager'),
            
            // Legacy methods that need special handling
            initializeApplication: () => this.initializeLegacyApp(),
            dispose: () => this.disposeLegacyApp(),
            
            // Direct method proxies for common operations (CRITICAL for canvas functionality)
            drawPixel: (...args) => this.proxyDrawPixel(...args),
            floodFill: (...args) => this.proxyFloodFill(...args),
            drawLine: (...args) => this.proxyDrawLine(...args),
            drawShape: (...args) => this.proxyDrawShape(...args),
            clearCanvas: (...args) => this.proxyClearCanvas(...args),
            loadFile: (...args) => this.proxyLoadFile(...args),
            saveFile: (...args) => this.proxySaveFile(...args),
            exportAs: (...args) => this.proxyExportAs(...args),
            setZoom: (...args) => this.proxySetZoom(...args),
            toggleGrid: (...args) => this.proxyToggleGrid(...args),
            getState: () => this.proxyGetState(),
            setState: (...args) => this.proxySetState(...args),
            
            // Event emission helpers
            emit: (event, data) => this.proxyEventEmission(event, data),
            on: (event, handler) => this.proxyEventSubscription(event, handler),
            off: (event, handler) => this.proxyEventUnsubscription(event, handler),
            
            // Configuration proxy
            config: this.createConfigProxy(),
            
            // Version information
            version: '2.0.0-legacy-compatible',
            modernPlatform: this.modernPlatform,
            
            // Compatibility flags
            isModularSystem: true,
            hasLegacySupport: true,
            compatibilityVersion: '1.0.0',
            
            // Canvas specific properties
            canvas: null,
            previewCanvas: null,
            canvasInitialized: false
        };

        // Setup property getters for lazy service resolution
        this.setupLazyServiceGetters(legacyApp);
        
        // Bridge events between old and new systems
        this.setupEventBridges();
        
        // Set global app reference
        window.app = legacyApp;
        
        this.initialized = true;
    }

    /**
     * Create EventBus proxy for legacy compatibility
     * @private
     * @returns {Object} EventBus proxy
     */
    createEventBusProxy() {
        const eventBus = this.modernPlatform.eventBus;
        
        return {
            on: (event, handler) => {
                const wrappedHandler = this.wrapLegacyEventHandler(handler, event);
                eventBus.on(event, wrappedHandler);
                return wrappedHandler;
            },
            
            off: (event, handler) => {
                eventBus.off(event, handler);
            },
            
            once: (event, handler) => {
                const wrappedHandler = this.wrapLegacyEventHandler(handler, event);
                eventBus.once(event, wrappedHandler);
                return wrappedHandler;
            },
            
            emit: (event, data) => {
                eventBus.emit(event, data);
            },
            
            // Legacy compatibility methods
            addEventListener: (event, handler) => eventBus.on(event, handler),
            removeEventListener: (event, handler) => eventBus.off(event, handler),
            dispatchEvent: (event, data) => eventBus.emit(event, data)
        };
    }

    /**
     * Create StateManager proxy with legacy method compatibility
     * @private
     * @returns {Object} StateManager proxy
     */
    createStateManagerProxy() {
        return new Proxy({}, {
            get: (target, prop) => {
                const stateManager = this.getModernService('stateManager');
                
                if (!stateManager) {
                    throw new Error(`StateManager is REQUIRED but not available for property: ${prop}`);
                }
                
                const api = stateManager.getAPI ? stateManager.getAPI() : stateManager;
                
                // Handle special legacy methods
                switch (prop) {
                    case 'getState':
                        return () => api.getState();
                    
                    case 'setPixels':
                        return (pixels) => api.setPixels(pixels);
                    
                    case 'setAttributes':
                        return (attributes) => api.setAttributes(attributes);
                    
                    case 'updatePixels':
                        return (pixels) => api.updatePixels(pixels);
                    
                    case 'updateAttributes':
                        return (attributes) => api.updateAttributes(attributes);
                    
                    case 'saveState':
                        return (actionType) => api.saveState(actionType);
                    
                    case 'undo':
                        return () => api.undo();
                    
                    case 'redo':
                        return () => api.redo();
                    
                    case 'setZoom':
                        return (zoom) => api.setZoom(zoom);
                    
                    case 'toggleGrid':
                        return (type) => api.toggleGrid(type);
                    
                    default:
                        return api[prop];
                }
            }
        });
    }

    /**
     * Create ColorManager proxy with legacy method compatibility
     * @private
     * @returns {Object} ColorManager proxy
     */
    createColorManagerProxy() {
        return new Proxy({}, {
            get: (target, prop) => {
                const colorManager = this.getModernService('colorManager');
                
                if (!colorManager) {
                    throw new Error(`ColorManager is REQUIRED but not available for property: ${prop}`);
                }
                
                const api = colorManager.getAPI ? colorManager.getAPI() : colorManager;
                
                // Handle special legacy methods
                switch (prop) {
                    case 'setInk':
                        return (colorIndex) => api.setInk(colorIndex);
                    
                    case 'setPaper':
                        return (colorIndex) => api.setPaper(colorIndex);
                    
                    case 'toggleBright':
                        return () => api.toggleBright();
                    
                    case 'toggleFlash':
                        return () => api.toggleFlash();
                    
                    case 'getColor':
                        return (index, bright) => api.getColor(index, bright);
                    
                    case 'getState':
                        return () => api.getState();
                    
                    default:
                        return api[prop];
                }
            }
        });
    }

    /**
     * Create generic service proxy
     * @private
     * @param {string} serviceName - Service name
     * @returns {Proxy} Service proxy
     */
    createServiceProxy(serviceName) {
        return new Proxy({}, {
            get: (target, prop) => {
                const service = this.getModernService(serviceName);
                
                if (!service) {
                    // For critical services, provide better error handling
                    if (this.isCriticalService(serviceName)) {
                        // Try to get the service one more time with a short delay
                        return this.createDeferredServiceAccess(serviceName, prop);
                    }
                    
                    throw new Error(`Service '${serviceName}' is REQUIRED but not available for property: ${prop}`);
                }
                
                // Try API first, then direct service access
                const api = service.getAPI ? service.getAPI() : service;
                const value = api[prop] !== undefined ? api[prop] : service[prop];
                
                // Bind functions to preserve context
                if (typeof value === 'function') {
                    return value.bind(service);
                }
                
                return value;
            },
            
            set: (target, prop, value) => {
                const service = this.getModernService(serviceName);
                
                if (!service) {
                    throw new Error(`Cannot set property '${prop}' on REQUIRED but unavailable service '${serviceName}'`);
                }
                
                service[prop] = value;
                return true;
            }
        });
    }

    /**
     * Check if a service is critical for application functionality
     * @param {string} serviceName - Service name
     * @returns {boolean} True if critical service
     */
    isCriticalService(serviceName) {
        const criticalServices = ['toolManager', 'drawingService', 'canvasService'];
        return criticalServices.includes(serviceName);
    }

    /**
     * Create deferred service access for critical services
     * @param {string} serviceName - Service name
     * @param {string} prop - Property being accessed
     * @returns {*} Property value or error function
     */
    createDeferredServiceAccess(serviceName, prop) {
        // If it's a function call, return a function that will retry
        if (typeof prop === 'string' && prop !== 'constructor') {
            return (...args) => {
                // Try to get the service again
                const service = this.getModernService(serviceName);
                
                if (!service) {
                    console.warn(`⚠️ Service '${serviceName}' still not available for method '${prop}'. This may be a timing issue.`);
                    
                    // Return a promise that resolves when service becomes available
                    return new Promise((resolve, reject) => {
                        const maxRetries = 10;
                        let retryCount = 0;
                        
                        const retryInterval = setInterval(() => {
                            retryCount++;
                            const retryService = this.getModernService(serviceName);
                            
                            if (retryService) {
                                clearInterval(retryInterval);
                                try {
                                    const api = retryService.getAPI ? retryService.getAPI() : retryService;
                                    const method = api[prop] || retryService[prop];
                                    
                                    if (typeof method === 'function') {
                                        const result = method.apply(retryService, args);
                                        resolve(result);
                                    } else {
                                        resolve(method);
                                    }
                                } catch (error) {
                                    reject(error);
                                }
                            } else if (retryCount >= maxRetries) {
                                clearInterval(retryInterval);
                                reject(new Error(`Service '${serviceName}' not available after ${maxRetries} retries for method '${prop}'`));
                            }
                        }, 50); // Retry every 50ms
                    });
                }
                
                // Service is available, execute normally
                const api = service.getAPI ? service.getAPI() : service;
                const method = api[prop] || service[prop];
                
                if (typeof method === 'function') {
                    return method.apply(service, args);
                }
                
                return method;
            };
        }
        
        // For property access, try one more immediate check
        const service = this.getModernService(serviceName);
        if (service) {
            const api = service.getAPI ? service.getAPI() : service;
            return api[prop] !== undefined ? api[prop] : service[prop];
        }
        
        return undefined;
    }

    /**
     * Setup lazy service getters for dynamic service resolution
     * @private
     * @param {Object} legacyApp - Legacy app object
     */
    setupLazyServiceGetters(legacyApp) {
        const serviceNames = [
            'fillToolManager',
            'shapeGenerator', 
            'texturePatternManager'
        ];
        
        serviceNames.forEach(serviceName => {
            Object.defineProperty(legacyApp, serviceName, {
                get: () => this.getModernService(serviceName) || this.createServiceProxy(serviceName),
                configurable: true,
                enumerable: true
            });
        });
    }

    /**
     * Setup event bridges between legacy and modern systems
     * @private
     */
    setupEventBridges() {
        if (!this.modernPlatform.eventBus) return;
        
        const eventBus = this.modernPlatform.eventBus;
        
        // Map legacy events to modern events
        const eventMappings = {
            'flood-fill': 'tool.flood-fill.execute',
            'draw-brush': 'tool.brush.draw',
            'draw-shape': 'tool.shape.draw',
            'draw-line': 'tool.line.draw',
            'state-changed': 'canvas.state.changed',
            'color-changed': 'color.state.changed',
            'zoom-changed': 'canvas.zoom.changed',
            'grid-changed': 'canvas.grid.changed'
        };
        
        // Setup bidirectional event bridging
        Object.entries(eventMappings).forEach(([legacyEvent, modernEvent]) => {
            // Legacy to modern
            eventBus.on(legacyEvent, (data) => {
                eventBus.emit(modernEvent, data);
            });
            
            // Modern to legacy (if different)
            if (legacyEvent !== modernEvent) {
                eventBus.on(modernEvent, (data) => {
                    eventBus.emit(legacyEvent, data);
                });
            }
        });
    }

    /**
     * Wrap legacy event handlers with error handling
     * @private
     * @param {Function} handler - Original handler
     * @param {string} event - Event name
     * @returns {Function} Wrapped handler
     */
    wrapLegacyEventHandler(handler, event) {
        return (...args) => {
            try {
                return handler(...args);
            } catch (error) {
                console.error(`Error in legacy event handler for '${event}':`, error);
                
                if (this.modernPlatform.handleError) {
                    this.modernPlatform.handleError(error, {
                        source: 'legacy-event-handler',
                        event: event
                    });
                }
            }
        };
    }

    /**
     * Get modern service with fallback
     * @private
     * @param {string} serviceName - Service name
     * @returns {*} Service instance or null
     */
    getModernService(serviceName) {
        try {
            // Try modern platform services first
            if (this.modernPlatform.serviceRegistry && this.modernPlatform.serviceRegistry.has(serviceName)) {
                return this.modernPlatform.getService(serviceName);
            }
            
            // Try modules
            if (this.modernPlatform.moduleLoader) {
                const module = this.modernPlatform.getModule(serviceName);
                if (module) return module;
            }
            
            // Fallback to original app if available
            if (this.originalApp && this.originalApp[serviceName]) {
                return this.originalApp[serviceName];
            }
            
            return null;
        } catch (error) {
            console.warn(`Error getting service '${serviceName}':`, error);
            return null;
        }
    }

    /**
     * Create configuration proxy
     * @private
     * @returns {Object} Config proxy
     */
    createConfigProxy() {
        return new Proxy({}, {
            get: (target, prop) => {
                return this.modernPlatform.config?.[prop];
            },
            
            set: (target, prop, value) => {
                if (this.modernPlatform.config) {
                    this.modernPlatform.config[prop] = value;
                    return true;
                }
                return false;
            }
        });
    }

    /**
     * Proxy for drawPixel method (critical legacy function)
     * @private
     */
    proxyDrawPixel(x, y, value, state) {
        // Try canvas service first (most direct)
        const canvasService = this.getModernService('canvasService');
        if (canvasService && canvasService.drawPixel) {
            return canvasService.drawPixel(x, y, value, state);
        }
        
        // Try state manager API
        const stateManager = this.getModernService('stateManager');
        if (stateManager && stateManager.getAPI) {
            const api = stateManager.getAPI();
            return api.setPixel(x, y, value);
        }
        
        // MANDATORY: drawPixel MUST be available
        if (this.originalApp && this.originalApp.drawPixel) {
            return this.originalApp.drawPixel(x, y, value, state);
        }
        
        throw new Error('CRITICAL: drawPixel functionality is REQUIRED but not available in system');
    }

    /**
     * Proxy for floodFill method (critical legacy function)
     * @private
     */
    proxyFloodFill(data) {
        // Try canvas service first (most direct)
        const canvasService = this.getModernService('canvasService');
        if (canvasService && canvasService.floodFill) {
            return canvasService.floodFill(data);
        }
        
        // Try modern fill manager
        const fillManager = this.getModernService('fillManager');
        if (fillManager && fillManager.fill) {
            return fillManager.fill({ ...data, type: 'flood' });
        }
        
        // Try drawing service
        const drawingService = this.getModernService('drawingService');
        if (drawingService && drawingService.floodFill) {
            return drawingService.floodFill(data);
        }
        
        // MANDATORY: floodFill MUST be available
        if (this.originalApp && this.originalApp.floodFill) {
            return this.originalApp.floodFill(data);
        }
        
        throw new Error('CRITICAL: floodFill functionality is REQUIRED but not available in system');
    }

    /**
     * Proxy for drawLine method
     * @private
     */
    proxyDrawLine(x1, y1, x2, y2, options) {
        const canvasService = this.getModernService('canvasService');
        if (canvasService && canvasService.drawLine) {
            return canvasService.drawLine(x1, y1, x2, y2, options);
        }
        
        if (this.originalApp && this.originalApp.drawLine) {
            return this.originalApp.drawLine(x1, y1, x2, y2, options);
        }
        
        throw new Error('CRITICAL: drawLine functionality is REQUIRED but not available in system');
    }

    /**
     * Proxy for drawShape method
     * @private
     */
    proxyDrawShape(shapeData) {
        const canvasService = this.getModernService('canvasService');
        if (canvasService && canvasService.drawShape) {
            return canvasService.drawShape(shapeData);
        }
        
        if (this.originalApp && this.originalApp.drawShape) {
            return this.originalApp.drawShape(shapeData);
        }
        
        throw new Error('CRITICAL: drawShape functionality is REQUIRED but not available in system');
    }

    /**
     * Proxy for clearCanvas method
     * @private
     */
    proxyClearCanvas() {
        const canvasService = this.getModernService('canvasService');
        if (canvasService && canvasService.clearCanvas) {
            return canvasService.clearCanvas();
        }
        
        if (this.originalApp && this.originalApp.clearCanvas) {
            return this.originalApp.clearCanvas();
        }
        
        throw new Error('CRITICAL: clearCanvas functionality is REQUIRED but not available in system');
    }

    /**
     * Proxy for loadFile method
     * @private
     */
    proxyLoadFile(file) {
        const canvasService = this.getModernService('canvasService');
        if (canvasService && canvasService.loadFile) {
            return canvasService.loadFile(file);
        }
        
        if (this.originalApp && this.originalApp.loadFile) {
            return this.originalApp.loadFile(file);
        }
        
        throw new Error('CRITICAL: loadFile functionality is REQUIRED but not available in system');
    }

    /**
     * Proxy for saveFile method
     * @private
     */
    proxySaveFile(format) {
        const canvasService = this.getModernService('canvasService');
        if (canvasService && canvasService.saveFile) {
            return canvasService.saveFile(format);
        }
        
        if (this.originalApp && this.originalApp.saveFile) {
            return this.originalApp.saveFile(format);
        }
        
        throw new Error('CRITICAL: saveFile functionality is REQUIRED but not available in system');
    }

    /**
     * Proxy for exportAs method
     * @private
     */
    proxyExportAs(format, options) {
        const canvasService = this.getModernService('canvasService');
        if (canvasService && canvasService.exportAs) {
            return canvasService.exportAs(format, options);
        }
        
        if (this.originalApp && this.originalApp.exportAs) {
            return this.originalApp.exportAs(format, options);
        }
        
        throw new Error('CRITICAL: exportAs functionality is REQUIRED but not available in system');
    }

    /**
     * Proxy for setZoom method
     * @private
     */
    proxySetZoom(zoom) {
        const canvasService = this.getModernService('canvasService');
        if (canvasService && canvasService.setZoom) {
            return canvasService.setZoom(zoom);
        }
        
        if (this.originalApp && this.originalApp.setZoom) {
            return this.originalApp.setZoom(zoom);
        }
        
        console.warn('setZoom method not available in current system');
    }

    /**
     * Proxy for toggleGrid method
     * @private
     */
    proxyToggleGrid(type) {
        const canvasService = this.getModernService('canvasService');
        if (canvasService && canvasService.toggleGrid) {
            return canvasService.toggleGrid(type);
        }
        
        if (this.originalApp && this.originalApp.toggleGrid) {
            return this.originalApp.toggleGrid(type);
        }
        
        console.warn('toggleGrid method not available in current system');
    }

    /**
     * Proxy for getState method
     * @private
     */
    proxyGetState() {
        const stateManager = this.getModernService('stateManager');
        
        if (stateManager) {
            const api = stateManager.getAPI ? stateManager.getAPI() : stateManager;
            return api.getState();
        }
        
        console.warn('getState not available in modern system');
        return null;
    }

    /**
     * Proxy for setState method
     * @private
     */
    proxySetState(state) {
        const stateManager = this.getModernService('stateManager');
        
        if (stateManager) {
            const api = stateManager.getAPI ? stateManager.getAPI() : stateManager;
            if (api.setState) {
                return api.setState(state);
            }
        }
        
        console.warn('setState not available in modern system');
    }

    /**
     * Proxy for event emission
     * @private
     */
    proxyEventEmission(event, data) {
        if (this.modernPlatform.eventBus) {
            this.modernPlatform.eventBus.emit(event, data);
        }
    }

    /**
     * Proxy for event subscription
     * @private
     */
    proxyEventSubscription(event, handler) {
        if (this.modernPlatform.eventBus) {
            return this.modernPlatform.eventBus.on(event, handler);
        }
    }

    /**
     * Proxy for event unsubscription
     * @private
     */
    proxyEventUnsubscription(event, handler) {
        if (this.modernPlatform.eventBus) {
            this.modernPlatform.eventBus.off(event, handler);
        }
    }

    /**
     * Initialize legacy app (for backwards compatibility)
     * @private
     */
    initializeLegacyApp() {
        if (!this.modernPlatform.initialized) {
            return this.modernPlatform.initialize();
        }
        return Promise.resolve();
    }

    /**
     * Dispose legacy app
     * @private
     */
    disposeLegacyApp() {
        return this.dispose();
    }

    /**
     * Check if a service is available
     * @param {string} serviceName - Service name
     * @returns {boolean} Service availability
     */
    hasService(serviceName) {
        return !!this.getModernService(serviceName);
    }

    /**
     * Get all available services
     * @returns {string[]} Service names
     */
    getAvailableServices() {
        const services = [];
        
        if (this.modernPlatform.serviceRegistry) {
            services.push(...this.modernPlatform.serviceRegistry.list());
        }
        
        if (this.modernPlatform.moduleLoader) {
            const modules = this.modernPlatform.moduleLoader.getAllModules();
            services.push(...Array.from(modules.keys()));
        }
        
        return [...new Set(services)];
    }

    /**
     * Check compatibility status
     * @returns {Object} Compatibility status
     */
    getCompatibilityStatus() {
        return {
            initialized: this.initialized,
            disposed: this.disposed,
            modernPlatformAvailable: !!this.modernPlatform,
            originalAppPreserved: !!this.originalApp,
            availableServices: this.getAvailableServices(),
            eventBridgesActive: this.eventBridge.size > 0
        };
    }

    /**
     * Migrate legacy code patterns
     * @param {Object} options - Migration options
     * @returns {Promise<Object>} Migration results
     */
    async migrateLegacyCode(options = {}) {
        const results = {
            migratedServices: [],
            warnings: [],
            errors: []
        };
        
        // Migrate service references
        const servicesToMigrate = options.services || this.getAvailableServices();
        
        for (const serviceName of servicesToMigrate) {
            try {
                const modernService = this.getModernService(serviceName);
                if (modernService) {
                    results.migratedServices.push(serviceName);
                } else {
                    results.warnings.push(`Service '${serviceName}' not available in modern system`);
                }
            } catch (error) {
                results.errors.push(`Error migrating service '${serviceName}': ${error.message}`);
            }
        }
        
        return results;
    }

    /**
     * Dispose of the compatibility wrapper
     * @returns {Promise<void>}
     */
    async dispose() {
        if (this.disposed) return;
        
        try {
            // Clear event bridges
            this.eventBridge.clear();
            
            // Clear service references
            this.legacyServices.clear();
            
            // Restore original app if it existed
            if (typeof window !== 'undefined') {
                if (this.originalApp) {
                    window.app = this.originalApp;
                } else {
                    delete window.app;
                }
            }
            
            this.disposed = true;
            
        } catch (error) {
            console.error('Error disposing legacy compatibility wrapper:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LegacyCompatibilityWrapper;
} else if (typeof window !== 'undefined') {
    window.LegacyCompatibilityWrapper = LegacyCompatibilityWrapper;
}