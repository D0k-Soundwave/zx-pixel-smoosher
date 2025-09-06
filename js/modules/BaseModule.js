/**
 * BaseModule.js - Base class for all modules in the plugin architecture
 * Provides standard lifecycle, dependency management, and API exposure
 * @module BaseModule
 */

class BaseModule {
    constructor(name, version, dependencies = []) {
        if (!name) {
            throw new Error('Module name is required');
        }
        
        if (typeof name !== 'string') {
            throw new Error(`Module name must be a string, got ${typeof name}: ${name}`);
        }
        
        if (!version) {
            throw new Error('Module version is required');
        }
        
        if (typeof version !== 'string') {
            throw new Error(`Module version must be a string, got ${typeof version}: ${JSON.stringify(version)}`);
        }
        
        if (!/^\d+\.\d+\.\d+/.test(version)) {
            throw new Error(`Invalid module version format: ${version}. Use semantic versioning (e.g., 1.0.0)`);
        }
        
        if (!Array.isArray(dependencies)) {
            throw new Error(`Dependencies must be an array, got ${typeof dependencies}: ${JSON.stringify(dependencies)}`);
        }

        this.name = name;
        this.version = version;
        this.dependencies = dependencies;
        this.platform = null;
        this.eventBus = null;
        this.config = {};
        this.state = {};
        this.initialized = false;
        this.active = false;
        this.disposed = false;
        
        // Module metadata
        this.metadata = {
            createdAt: Date.now(),
            initCount: 0,
            activationCount: 0,
            errorCount: 0,
            lastError: null
        };

        // Dependency injection container
        this.injectedDependencies = new Map();
        
        // Event handler cleanup registry
        this.eventHandlers = [];
        
        // Resource cleanup registry
        this.resources = new Set();
        
        // Performance metrics
        this.metrics = {
            initTime: 0,
            activationTime: 0,
            deactivationTime: 0,
            memoryUsage: 0
        };
    }

    /**
     * Initialize the module
     * Override this method in derived classes
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            console.warn(`Module ${this.name} is already initialized`);
            return;
        }

        if (this.disposed) {
            throw new Error(`Cannot initialize disposed module ${this.name}`);
        }

        const startTime = performance.now();

        try {
            // Set platform reference
            if (!this.platform) {
                throw new Error(`Platform not set for module ${this.name}`);
            }

            // Get EventBus from platform
            this.eventBus = this.platform.eventBus;
            if (!this.eventBus) {
                throw new Error(`EventBus not available for module ${this.name}`);
            }

            // Validate dependencies are available
            await this.validateDependencies();

            // Call module-specific initialization
            await this.onInitialize();

            this.initialized = true;
            this.metadata.initCount++;
            this.metrics.initTime = performance.now() - startTime;

            // Emit initialization event
            this.emitModuleEvent('initialized');

        } catch (error) {
            this.metadata.errorCount++;
            this.metadata.lastError = error.message;
            throw new Error(`Failed to initialize module ${this.name}: ${error.message}`);
        }
    }

    /**
     * Module-specific initialization logic
     * Override this in derived classes
     * @protected
     * @returns {Promise<void>}
     */
    async onInitialize() {
        // Override in derived classes
    }

    /**
     * Activate the module
     * @returns {Promise<void>}
     */
    async activate() {
        if (!this.initialized) {
            throw new Error(`Module ${this.name} must be initialized before activation`);
        }

        if (this.active) {
            console.warn(`Module ${this.name} is already active`);
            return;
        }

        if (this.disposed) {
            throw new Error(`Cannot activate disposed module ${this.name}`);
        }

        const startTime = performance.now();

        try {
            // Call module-specific activation
            await this.onActivate();

            this.active = true;
            this.metadata.activationCount++;
            this.metrics.activationTime = performance.now() - startTime;

            // Emit activation event
            this.emitModuleEvent('activated');

        } catch (error) {
            this.metadata.errorCount++;
            this.metadata.lastError = error.message;
            throw new Error(`Failed to activate module ${this.name}: ${error.message}`);
        }
    }

    /**
     * Module-specific activation logic
     * Override this in derived classes
     * @protected
     * @returns {Promise<void>}
     */
    async onActivate() {
        // Override in derived classes
    }

    /**
     * Deactivate the module
     * @returns {Promise<void>}
     */
    async deactivate() {
        if (!this.active) {
            return;
        }

        const startTime = performance.now();

        try {
            // Call module-specific deactivation
            await this.onDeactivate();

            this.active = false;
            this.metrics.deactivationTime = performance.now() - startTime;

            // Emit deactivation event
            this.emitModuleEvent('deactivated');

        } catch (error) {
            this.metadata.errorCount++;
            this.metadata.lastError = error.message;
            throw new Error(`Failed to deactivate module ${this.name}: ${error.message}`);
        }
    }

    /**
     * Module-specific deactivation logic
     * Override this in derived classes
     * @protected
     * @returns {Promise<void>}
     */
    async onDeactivate() {
        // Override in derived classes
    }

    /**
     * Dispose of the module and cleanup resources
     * @returns {Promise<void>}
     */
    async dispose() {
        if (this.disposed) {
            return;
        }

        try {
            // Deactivate if still active
            if (this.active) {
                await this.deactivate();
            }

            // Call module-specific disposal
            await this.onDispose();

            // Cleanup event handlers
            this.cleanupEventHandlers();

            // Cleanup resources
            this.cleanupResources();

            // Clear dependencies
            this.injectedDependencies.clear();

            this.disposed = true;

            // Emit disposal event
            this.emitModuleEvent('disposed');

        } catch (error) {
            console.error(`Error disposing module ${this.name}:`, error);
        }
    }

    /**
     * Module-specific disposal logic
     * Override this in derived classes
     * @protected
     * @returns {Promise<void>}
     */
    async onDispose() {
        // Override in derived classes
    }

    /**
     * Inject dependencies into the module
     * @param {Map<string, Object>} dependencies - Resolved dependencies
     * @returns {Promise<void>}
     */
    async injectDependencies(dependencies) {
        this.injectedDependencies = dependencies;
        
        // Make dependencies available as properties
        for (const [name, dependency] of dependencies) {
            if (!this[name]) {
                this[name] = dependency;
            }
        }
    }

    /**
     * Validate that all required dependencies are available
     * @private
     * @returns {Promise<void>}
     */
    async validateDependencies() {
        for (const dep of this.dependencies) {
            const depName = typeof dep === 'string' ? dep : dep.name;
            const required = typeof dep === 'object' ? !dep.optional : true;

            if (required) {
                // Check in injected dependencies
                if (!this.injectedDependencies.has(depName)) {
                    // Check in platform services
                    if (!this.platform.serviceRegistry.has(depName)) {
                        throw new Error(`Required dependency '${depName}' not found for module '${this.name}'`);
                    }
                }
            }
        }
    }

    /**
     * Get the module's public API
     * Override this to expose module functionality
     * @returns {Object} Public API
     */
    getAPI() {
        return {
            name: this.name,
            version: this.version,
            isActive: () => this.active,
            getState: () => this.getState(),
            setState: (state) => this.setState(state)
        };
    }

    /**
     * Get event handlers for registration
     * Override this to register event handlers
     * @returns {Object} Event handlers map
     */
    getEventHandlers() {
        return {};
    }

    /**
     * Get the module's current state
     * @returns {Object} Module state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Set the module's state
     * @param {Object} newState - New state
     * @returns {Promise<void>}
     */
    async setState(newState) {
        const oldState = this.state;
        this.state = { ...this.state, ...newState };
        
        // Emit state change event
        this.emitModuleEvent('state-changed', {
            oldState,
            newState: this.state
        });
    }

    /**
     * Update module configuration
     * @param {Object} config - New configuration
     * @returns {Promise<void>}
     */
    async updateConfig(config) {
        const oldConfig = this.config;
        this.config = { ...this.config, ...config };
        
        // Call configuration update handler
        await this.onConfigUpdate(oldConfig, this.config);
        
        // Emit config change event
        this.emitModuleEvent('config-changed', {
            oldConfig,
            newConfig: this.config
        });
    }

    /**
     * Handle configuration updates
     * Override this in derived classes
     * @protected
     * @param {Object} oldConfig - Previous configuration
     * @param {Object} newConfig - New configuration
     * @returns {Promise<void>}
     */
    async onConfigUpdate(oldConfig, newConfig) {
        // Override in derived classes
    }

    /**
     * Perform health check
     * Override this to implement custom health checks
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        const memoryUsage = this.calculateMemoryUsage();
        
        return {
            healthy: !this.disposed && this.initialized,
            active: this.active,
            metrics: this.metrics,
            metadata: this.metadata,
            memoryUsage,
            dependencies: Array.from(this.injectedDependencies.keys())
        };
    }

    /**
     * Calculate approximate memory usage
     * @private
     * @returns {number} Memory usage in bytes
     */
    calculateMemoryUsage() {
        // This is an approximation
        let size = 0;
        
        const calculateSize = (obj, visited = new WeakSet()) => {
            if (obj === null || obj === undefined) return 0;
            if (typeof obj !== 'object') return 8; // Rough estimate for primitives
            if (visited.has(obj)) return 0;
            
            visited.add(obj);
            
            let objSize = 0;
            if (Array.isArray(obj)) {
                objSize = obj.length * 8;
                obj.forEach(item => objSize += calculateSize(item, visited));
            } else {
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        objSize += key.length * 2; // String size
                        objSize += calculateSize(obj[key], visited);
                    }
                }
            }
            
            return objSize;
        };
        
        size = calculateSize(this.state);
        this.metrics.memoryUsage = size;
        
        return size;
    }

    /**
     * Register an event handler
     * @protected
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} options - Handler options
     */
    registerEventHandler(event, handler, options = {}) {
        if (!this.eventBus) {
            throw new Error(`EventBus not available for module ${this.name}`);
        }

        const wrappedHandler = (...args) => {
            try {
                return handler.apply(this, args);
            } catch (error) {
                this.handleError(error, { event, args });
            }
        };

        if (options.once) {
            this.eventBus.once(event, wrappedHandler);
        } else {
            this.eventBus.on(event, wrappedHandler);
        }

        this.eventHandlers.push({ event, handler: wrappedHandler, once: options.once });
    }

    /**
     * Cleanup all registered event handlers
     * @private
     */
    cleanupEventHandlers() {
        if (!this.eventBus) return;

        for (const { event, handler } of this.eventHandlers) {
            this.eventBus.off(event, handler);
        }

        this.eventHandlers = [];
    }

    /**
     * Register a resource for cleanup
     * @protected
     * @param {Object} resource - Resource to track
     * @param {Function} cleanup - Cleanup function
     */
    registerResource(resource, cleanup) {
        this.resources.add({ resource, cleanup });
    }

    /**
     * Cleanup all registered resources
     * @private
     */
    cleanupResources() {
        for (const { resource, cleanup } of this.resources) {
            try {
                if (cleanup) {
                    cleanup(resource);
                }
            } catch (error) {
                console.error(`Error cleaning up resource in module ${this.name}:`, error);
            }
        }

        this.resources.clear();
    }

    /**
     * Emit a module-specific event
     * @protected
     * @param {string} eventType - Event type
     * @param {*} data - Event data
     */
    emitModuleEvent(eventType, data = {}) {
        if (!this.eventBus) return;

        this.eventBus.emit(`module:${this.name}:${eventType}`, {
            module: this.name,
            version: this.version,
            timestamp: Date.now(),
            ...data
        });
    }

    /**
     * Handle module errors
     * @protected
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     */
    handleError(error, context = {}) {
        this.metadata.errorCount++;
        this.metadata.lastError = error.message;

        if (this.platform && this.platform.handleError) {
            this.platform.handleError(error, {
                module: this.name,
                ...context
            });
        } else {
            console.error(`Error in module ${this.name}:`, error, context);
        }

        this.emitModuleEvent('error', { error: error.message, context });
    }

    /**
     * Get a dependency by name
     * @protected
     * @param {string} name - Dependency name
     * @returns {*} Dependency instance
     */
    getDependency(name) {
        // Check injected dependencies first
        if (this.injectedDependencies.has(name)) {
            return this.injectedDependencies.get(name);
        }

        // Fall back to platform services
        if (this.platform && this.platform.serviceRegistry) {
            return this.platform.getService(name);
        }

        return null;
    }

    /**
     * Check if module has a dependency
     * @protected
     * @param {string} name - Dependency name
     * @returns {boolean} True if dependency exists
     */
    hasDependency(name) {
        return this.injectedDependencies.has(name) || 
               (this.platform && this.platform.serviceRegistry && this.platform.serviceRegistry.has(name));
    }

    /**
     * Get module information
     * @returns {Object} Module information
     */
    getInfo() {
        return {
            name: this.name,
            version: this.version,
            dependencies: this.dependencies,
            initialized: this.initialized,
            active: this.active,
            disposed: this.disposed,
            metadata: this.metadata,
            metrics: this.metrics
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseModule;
} else if (typeof window !== 'undefined') {
    window.BaseModule = BaseModule;
}