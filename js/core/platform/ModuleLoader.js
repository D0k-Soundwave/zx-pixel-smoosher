/**
 * ModuleLoader.js - Dynamic module loading and lifecycle management
 * Handles plugin loading, dependency resolution, and hot-swapping
 * @module ModuleLoader
 */

class ModuleLoader {
    constructor(platform) {
        if (!platform) {
            throw new Error('Platform is required for ModuleLoader');
        }

        this.platform = platform;
        this.modules = new Map();
        this.loadingQueue = new Map();
        this.moduleStates = new Map();
        this.dependencyGraph = new Map();
        this.loadOrder = [];
        this.eventHandlers = new Map();
        this.disposed = false;
        
        // Module states
        this.STATE = {
            UNLOADED: 'unloaded',
            LOADING: 'loading',
            LOADED: 'loaded',
            INITIALIZING: 'initializing',
            INITIALIZED: 'initialized',
            ACTIVATING: 'activating',
            ACTIVE: 'active',
            DEACTIVATING: 'deactivating',
            INACTIVE: 'inactive',
            ERROR: 'error',
            DISPOSED: 'disposed'
        };

        // Performance metrics
        this.metrics = {
            loadTimes: new Map(),
            initTimes: new Map(),
            activationTimes: new Map(),
            errorCounts: new Map()
        };
    }

    /**
     * Load a module with full lifecycle management
     * @param {Function|Object} ModuleClass - Module class or instance
     * @param {Object} config - Module configuration
     * @returns {Promise<Object>} Loaded module
     */
    async loadModule(ModuleClass, config = {}) {
        if (this.disposed) {
            throw new Error('ModuleLoader has been disposed');
        }

        const startTime = performance.now();
        let module;
        let moduleName;

        try {
            // Create module instance
            if (typeof ModuleClass === 'function') {
                module = new ModuleClass(this.platform, config);
            } else {
                module = ModuleClass;
            }

            moduleName = module.name || module.constructor.name;

            if (!moduleName) {
                throw new Error('Module must have a name property');
            }

            // Check if already loading
            if (this.loadingQueue.has(moduleName)) {
                return await this.loadingQueue.get(moduleName);
            }

            // Check if already loaded
            if (this.modules.has(moduleName) && !config.reload) {
                const existingModule = this.modules.get(moduleName);
                const state = this.moduleStates.get(moduleName);
                
                if (state === this.STATE.ACTIVE) {
                    return existingModule;
                }
            }

            // Mark as loading
            this.moduleStates.set(moduleName, this.STATE.LOADING);
            
            const loadPromise = this.performModuleLoad(module, moduleName, config);
            this.loadingQueue.set(moduleName, loadPromise);

            const loadedModule = await loadPromise;
            
            // Record metrics
            const loadTime = performance.now() - startTime;
            this.metrics.loadTimes.set(moduleName, loadTime);

            return loadedModule;

        } catch (error) {
            if (moduleName) {
                this.moduleStates.set(moduleName, this.STATE.ERROR);
                const errorCount = this.metrics.errorCounts.get(moduleName) || 0;
                this.metrics.errorCounts.set(moduleName, errorCount + 1);
            }
            
            throw new Error(`Failed to load module ${moduleName || 'unknown'}: ${error.message}`);
        } finally {
            if (moduleName) {
                this.loadingQueue.delete(moduleName);
            }
        }
    }

    /**
     * Perform the actual module loading
     * @private
     */
    async performModuleLoad(module, moduleName, config) {
        try {
            // Validate module interface
            this.validateModule(module);

            // Check and resolve dependencies
            await this.resolveDependencies(module, moduleName);

            // Store module
            this.modules.set(moduleName, module);
            this.moduleStates.set(moduleName, this.STATE.LOADED);

            // Initialize module
            await this.initializeModule(module, moduleName);

            // Activate if not lazy
            if (!config.lazy) {
                await this.activateModule(moduleName);
            }

            // Update load order
            this.updateLoadOrder();

            return module;

        } catch (error) {
            // Cleanup on failure
            await this.cleanupFailedModule(moduleName);
            throw error;
        }
    }

    /**
     * Validate module interface
     * @private
     */
    validateModule(module) {
        const required = ['name', 'version'];
        const methods = ['initialize', 'activate', 'deactivate', 'dispose'];

        required.forEach(prop => {
            if (!module[prop]) {
                throw new Error(`Module missing required property: ${prop}`);
            }
        });

        methods.forEach(method => {
            if (typeof module[method] !== 'function') {
                throw new Error(`Module missing required method: ${method}`);
            }
        });

        // Validate version format
        if (typeof module.version !== 'string') {
            throw new Error(`Invalid module version format: ${typeof module.version} (${JSON.stringify(module.version)}). Use semantic versioning (e.g., 1.0.0)`);
        }
        
        if (!/^\d+\.\d+\.\d+/.test(module.version)) {
            throw new Error(`Invalid module version format: ${module.version}. Use semantic versioning (e.g., 1.0.0)`);
        }
    }

    /**
     * Resolve module dependencies
     * @private
     */
    async resolveDependencies(module, moduleName) {
        const dependencies = module.dependencies || [];
        const resolved = new Map();

        for (const dep of dependencies) {
            const depName = typeof dep === 'string' ? dep : dep.name;
            const depVersion = typeof dep === 'string' ? '*' : dep.version;

            // Check for circular dependencies
            if (this.hasCircularDependency(moduleName, depName)) {
                throw new Error(`Circular dependency detected: ${moduleName} -> ${depName}`);
            }

            // Check if dependency is available
            if (!this.modules.has(depName) && !this.platform.serviceRegistry.has(depName)) {
                if (dep.optional) {
                    continue;
                }
                throw new Error(`Required dependency '${depName}' not found for module '${moduleName}'`);
            }

            // Get dependency
            let dependency;
            if (this.modules.has(depName)) {
                dependency = this.modules.get(depName);
                
                // Check version compatibility
                if (!this.isVersionCompatible(dependency.version, depVersion)) {
                    throw new Error(`Incompatible version for dependency '${depName}': required ${depVersion}, found ${dependency.version}`);
                }
            } else {
                dependency = this.platform.serviceRegistry.get(depName);
            }

            resolved.set(depName, dependency);
        }

        // Store dependency graph
        this.dependencyGraph.set(moduleName, Array.from(resolved.keys()));

        // Inject dependencies
        if (module.injectDependencies) {
            await module.injectDependencies(resolved);
        }

        return resolved;
    }

    /**
     * Check for circular dependencies
     * @private
     */
    hasCircularDependency(moduleName, depName, visited = new Set()) {
        if (depName === moduleName) {
            return true;
        }

        if (visited.has(depName)) {
            return false;
        }

        visited.add(depName);

        const deps = this.dependencyGraph.get(depName) || [];
        for (const dep of deps) {
            if (this.hasCircularDependency(moduleName, dep, visited)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check version compatibility
     * @private
     */
    isVersionCompatible(actualVersion, requiredVersion) {
        if (requiredVersion === '*' || requiredVersion === 'latest') {
            return true;
        }

        const actual = actualVersion.split('.').map(Number);
        const required = requiredVersion.replace(/[^0-9.]/g, '').split('.').map(Number);

        // Major version must match
        if (actual[0] !== required[0]) {
            return false;
        }

        // Minor version must be >= required
        if (actual[1] < required[1]) {
            return false;
        }

        return true;
    }

    /**
     * Initialize a module
     * @private
     */
    async initializeModule(module, moduleName) {
        const startTime = performance.now();
        
        try {
            this.moduleStates.set(moduleName, this.STATE.INITIALIZING);
            
            await module.initialize();
            
            this.moduleStates.set(moduleName, this.STATE.INITIALIZED);
            
            // Record metrics
            const initTime = performance.now() - startTime;
            this.metrics.initTimes.set(moduleName, initTime);

            // Register module API if available
            if (module.getAPI) {
                const api = module.getAPI();
                this.platform.registerAPI(moduleName, api);
            }

            // Register event handlers
            if (module.getEventHandlers) {
                const handlers = module.getEventHandlers();
                this.registerEventHandlers(moduleName, handlers);
            }

            // Register module instance as a service
            if (this.platform.serviceRegistry) {
                console.log(`📝 Registering module '${moduleName}' as a service...`);
                this.platform.serviceRegistry.register(moduleName, module, { 
                    singleton: true, 
                    metadata: { source: 'module', moduleState: this.STATE.INITIALIZED } 
                });
                console.log(`✅ Module '${moduleName}' registered as service`);
            } else {
                console.warn(`⚠️ Cannot register module '${moduleName}' as service - serviceRegistry not available`);
            }

        } catch (error) {
            this.moduleStates.set(moduleName, this.STATE.ERROR);
            throw new Error(`Failed to initialize module '${moduleName}': ${error.message}`);
        }
    }

    /**
     * Activate a module
     * @param {string} moduleName - Module name
     * @returns {Promise<void>}
     */
    async activateModule(moduleName) {
        const module = this.modules.get(moduleName);
        if (!module) {
            throw new Error(`Module '${moduleName}' not found`);
        }

        const currentState = this.moduleStates.get(moduleName);
        if (currentState === this.STATE.ACTIVE) {
            return;
        }

        if (currentState !== this.STATE.INITIALIZED && currentState !== this.STATE.INACTIVE) {
            throw new Error(`Cannot activate module '${moduleName}' from state '${currentState}'`);
        }

        const startTime = performance.now();

        try {
            this.moduleStates.set(moduleName, this.STATE.ACTIVATING);
            
            await module.activate();
            
            this.moduleStates.set(moduleName, this.STATE.ACTIVE);

            // Record metrics
            const activationTime = performance.now() - startTime;
            this.metrics.activationTimes.set(moduleName, activationTime);

            // Emit activation event
            if (this.platform.eventBus) {
                this.platform.eventBus.emit('module:activated', { name: moduleName });
            }

        } catch (error) {
            this.moduleStates.set(moduleName, this.STATE.ERROR);
            throw new Error(`Failed to activate module '${moduleName}': ${error.message}`);
        }
    }

    /**
     * Deactivate a module
     * @param {string} moduleName - Module name
     * @returns {Promise<void>}
     */
    async deactivateModule(moduleName) {
        const module = this.modules.get(moduleName);
        if (!module) {
            throw new Error(`Module '${moduleName}' not found`);
        }

        const currentState = this.moduleStates.get(moduleName);
        if (currentState !== this.STATE.ACTIVE) {
            return;
        }

        try {
            this.moduleStates.set(moduleName, this.STATE.DEACTIVATING);
            
            await module.deactivate();
            
            this.moduleStates.set(moduleName, this.STATE.INACTIVE);

            // Emit deactivation event
            if (this.platform.eventBus) {
                this.platform.eventBus.emit('module:deactivated', { name: moduleName });
            }

        } catch (error) {
            this.moduleStates.set(moduleName, this.STATE.ERROR);
            throw new Error(`Failed to deactivate module '${moduleName}': ${error.message}`);
        }
    }

    /**
     * Unload a module completely
     * @param {string} moduleName - Module name
     * @returns {Promise<void>}
     */
    async unloadModule(moduleName) {
        const module = this.modules.get(moduleName);
        if (!module) {
            return;
        }

        try {
            // Deactivate if active
            const state = this.moduleStates.get(moduleName);
            if (state === this.STATE.ACTIVE) {
                await this.deactivateModule(moduleName);
            }

            // Dispose module
            if (module.dispose) {
                await module.dispose();
            }

            // Unregister event handlers
            this.unregisterEventHandlers(moduleName);

            // Unregister from service registry
            if (this.platform.serviceRegistry && this.platform.serviceRegistry.has(moduleName)) {
                // Note: ServiceRegistry doesn't have an unregister method, so we'll need to handle this
                // For now, we'll leave the service registered but mark it as disposed in metadata
                const metadata = this.platform.serviceRegistry.getMetadata(moduleName);
                if (metadata) {
                    metadata.moduleState = this.STATE.DISPOSED;
                }
            }

            // Remove from registry
            this.modules.delete(moduleName);
            this.moduleStates.set(moduleName, this.STATE.DISPOSED);
            this.dependencyGraph.delete(moduleName);

            // Update load order
            this.updateLoadOrder();

            // Emit unload event
            if (this.platform.eventBus) {
                this.platform.eventBus.emit('module:unloaded', { name: moduleName });
            }

        } catch (error) {
            throw new Error(`Failed to unload module '${moduleName}': ${error.message}`);
        }
    }

    /**
     * Reload a module (hot-swap)
     * @param {string} moduleName - Module name
     * @param {Function|Object} NewModuleClass - New module class
     * @param {Object} config - Module configuration
     * @returns {Promise<Object>} Reloaded module
     */
    async reloadModule(moduleName, NewModuleClass, config = {}) {
        const oldModule = this.modules.get(moduleName);
        if (!oldModule) {
            return await this.loadModule(NewModuleClass, config);
        }

        // Save state if possible
        let savedState;
        if (oldModule.getState) {
            savedState = await oldModule.getState();
        }

        // Unload old module
        await this.unloadModule(moduleName);

        // Load new module
        const newModule = await this.loadModule(NewModuleClass, { ...config, reload: true });

        // Restore state if possible
        if (savedState && newModule.setState) {
            await newModule.setState(savedState);
        }

        return newModule;
    }

    /**
     * Register event handlers for a module
     * @private
     */
    registerEventHandlers(moduleName, handlers) {
        if (!this.platform.eventBus) return;

        const moduleHandlers = [];

        for (const [event, handler] of Object.entries(handlers)) {
            const wrappedHandler = (...args) => {
                try {
                    return handler(...args);
                } catch (error) {
                    console.error(`Error in module '${moduleName}' handler for event '${event}':`, error);
                }
            };

            this.platform.eventBus.on(event, wrappedHandler);
            moduleHandlers.push({ event, handler: wrappedHandler });
        }

        this.eventHandlers.set(moduleName, moduleHandlers);
    }

    /**
     * Unregister event handlers for a module
     * @private
     */
    unregisterEventHandlers(moduleName) {
        if (!this.platform.eventBus) return;

        const handlers = this.eventHandlers.get(moduleName);
        if (!handlers) return;

        for (const { event, handler } of handlers) {
            this.platform.eventBus.off(event, handler);
        }

        this.eventHandlers.delete(moduleName);
    }

    /**
     * Update module load order based on dependencies
     * @private
     */
    updateLoadOrder() {
        const visited = new Set();
        const order = [];

        const visit = (name) => {
            if (visited.has(name)) return;
            visited.add(name);

            const deps = this.dependencyGraph.get(name) || [];
            deps.forEach(dep => {
                if (this.modules.has(dep)) {
                    visit(dep);
                }
            });

            order.push(name);
        };

        this.modules.forEach((_, name) => visit(name));
        this.loadOrder = order;
    }

    /**
     * Cleanup a failed module
     * @private
     */
    async cleanupFailedModule(moduleName) {
        try {
            const module = this.modules.get(moduleName);
            if (module && module.dispose) {
                await module.dispose();
            }
        } catch (error) {
            console.error(`Error cleaning up failed module '${moduleName}':`, error);
        }

        this.modules.delete(moduleName);
        this.moduleStates.delete(moduleName);
        this.dependencyGraph.delete(moduleName);
        this.unregisterEventHandlers(moduleName);
    }

    /**
     * Get module by name
     * @param {string} moduleName - Module name
     * @returns {Object|null} Module instance
     */
    getModule(moduleName) {
        return this.modules.get(moduleName) || null;
    }

    /**
     * Get module state
     * @param {string} moduleName - Module name
     * @returns {string|null} Module state
     */
    getModuleState(moduleName) {
        return this.moduleStates.get(moduleName) || null;
    }

    /**
     * Get all loaded modules
     * @returns {Map<string, Object>} All modules
     */
    getAllModules() {
        return new Map(this.modules);
    }

    /**
     * Get module metrics
     * @param {string} moduleName - Module name
     * @returns {Object} Module metrics
     */
    getModuleMetrics(moduleName) {
        return {
            loadTime: this.metrics.loadTimes.get(moduleName),
            initTime: this.metrics.initTimes.get(moduleName),
            activationTime: this.metrics.activationTimes.get(moduleName),
            errorCount: this.metrics.errorCounts.get(moduleName) || 0,
            state: this.moduleStates.get(moduleName),
            dependencies: this.dependencyGraph.get(moduleName) || []
        };
    }

    /**
     * Get all metrics
     * @returns {Object} All metrics
     */
    getAllMetrics() {
        const metrics = {};
        
        this.modules.forEach((_, name) => {
            metrics[name] = this.getModuleMetrics(name);
        });

        return metrics;
    }

    /**
     * Dispose of the module loader
     * @returns {Promise<void>}
     */
    async dispose() {
        if (this.disposed) return;

        // Unload all modules in reverse order
        const reverseOrder = [...this.loadOrder].reverse();
        
        for (const moduleName of reverseOrder) {
            try {
                await this.unloadModule(moduleName);
            } catch (error) {
                console.error(`Error unloading module '${moduleName}':`, error);
            }
        }

        this.modules.clear();
        this.loadingQueue.clear();
        this.moduleStates.clear();
        this.dependencyGraph.clear();
        this.eventHandlers.clear();
        this.metrics.loadTimes.clear();
        this.metrics.initTimes.clear();
        this.metrics.activationTimes.clear();
        this.metrics.errorCounts.clear();
        this.loadOrder = [];
        this.disposed = true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleLoader;
} else if (typeof window !== 'undefined') {
    window.ModuleLoader = ModuleLoader;
}