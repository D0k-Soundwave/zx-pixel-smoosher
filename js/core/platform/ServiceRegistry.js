/**
 * ServiceRegistry.js - Enterprise-grade dependency injection container
 * Manages service lifecycle, dependencies, and provides singleton pattern
 * @module ServiceRegistry
 */

class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
        this.dependencies = new Map();
        this.initializationOrder = [];
        this.circularDependencyCheck = new Set();
        this.serviceMetadata = new Map();
        this.healthChecks = new Map();
        this.disposed = false;
    }

    /**
     * Register a service with full validation and dependency tracking
     * @param {string} name - Service identifier
     * @param {Function|Object} service - Service constructor or instance
     * @param {Object} options - Registration options
     * @returns {ServiceRegistry} Fluent interface
     */
    register(name, service, options = {}) {
        if (this.disposed) {
            throw new Error('ServiceRegistry has been disposed');
        }

        if (!name || typeof name !== 'string') {
            throw new TypeError(`Invalid service name: ${name}`);
        }

        if (!service) {
            throw new TypeError(`Invalid service for ${name}`);
        }

        const config = {
            singleton: options.singleton !== false,
            dependencies: options.dependencies || [],
            lazy: options.lazy === true,
            factory: typeof service === 'function',
            metadata: options.metadata || {},
            healthCheck: options.healthCheck || null,
            dispose: options.dispose || null,
            initialize: options.initialize || null
        };

        // Validate circular dependencies
        this.validateDependencies(name, config.dependencies);

        // Store service and configuration
        this.services.set(name, service);
        this.dependencies.set(name, config.dependencies);
        this.serviceMetadata.set(name, config);

        if (config.healthCheck) {
            this.healthChecks.set(name, config.healthCheck);
        }

        // Initialize non-lazy singletons immediately
        if (config.singleton && !config.lazy && config.factory) {
            this.createSingleton(name);
        }

        this.updateInitializationOrder();
        
        return this;
    }

    /**
     * Get a service instance with automatic dependency injection
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    get(name) {
        if (this.disposed) {
            throw new Error('ServiceRegistry has been disposed');
        }

        if (!this.services.has(name)) {
            throw new Error(`Service '${name}' not found. Available services: ${Array.from(this.services.keys()).join(', ')}`);
        }

        const metadata = this.serviceMetadata.get(name);

        if (metadata.singleton) {
            if (!this.singletons.has(name)) {
                this.createSingleton(name);
            }
            return this.singletons.get(name);
        }

        return this.createInstance(name);
    }

    /**
     * Check if a service is registered
     * @param {string} name - Service name
     * @returns {boolean} True if service exists
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Create a singleton instance with dependency injection
     * @private
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    createSingleton(name) {
        if (this.circularDependencyCheck.has(name)) {
            throw new Error(`Circular dependency detected: ${Array.from(this.circularDependencyCheck).join(' -> ')} -> ${name}`);
        }

        this.circularDependencyCheck.add(name);

        try {
            const instance = this.createInstance(name);
            this.singletons.set(name, instance);
            
            const metadata = this.serviceMetadata.get(name);
            if (metadata.initialize) {
                metadata.initialize.call(instance);
            }

            return instance;
        } finally {
            this.circularDependencyCheck.delete(name);
        }
    }

    /**
     * Create a new service instance with dependency injection
     * @private
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    createInstance(name) {
        const service = this.services.get(name);
        const metadata = this.serviceMetadata.get(name);
        const dependencies = this.dependencies.get(name) || [];

        if (!metadata.factory) {
            return service;
        }

        const resolvedDeps = this.resolveDependencies(dependencies);

        try {
            if (service.prototype) {
                const instance = new service(...resolvedDeps);
                this.injectProperties(instance, dependencies);
                return instance;
            } else {
                return service(...resolvedDeps);
            }
        } catch (error) {
            throw new Error(`Failed to create service '${name}': ${error.message}`);
        }
    }

    /**
     * Resolve all dependencies for a service
     * @private
     * @param {string[]} dependencies - Dependency names
     * @returns {Array} Resolved dependencies
     */
    resolveDependencies(dependencies) {
        return dependencies.map(dep => {
            if (typeof dep === 'string') {
                return this.get(dep);
            } else if (dep && dep.service) {
                return this.get(dep.service);
            }
            return dep;
        });
    }

    /**
     * Inject properties into an instance
     * @private
     * @param {Object} instance - Target instance
     * @param {Array} dependencies - Dependencies to inject
     */
    injectProperties(instance, dependencies) {
        dependencies.forEach(dep => {
            if (dep && typeof dep === 'object' && dep.property && dep.service) {
                instance[dep.property] = this.get(dep.service);
            }
        });
    }

    /**
     * Validate dependencies for circular references
     * @private
     * @param {string} name - Service name
     * @param {string[]} dependencies - Service dependencies
     */
    validateDependencies(name, dependencies) {
        const visited = new Set();
        const stack = new Set();

        const checkCircular = (serviceName) => {
            if (stack.has(serviceName)) {
                throw new Error(`Circular dependency detected: ${Array.from(stack).join(' -> ')} -> ${serviceName}`);
            }

            if (visited.has(serviceName)) {
                return;
            }

            visited.add(serviceName);
            stack.add(serviceName);

            const deps = this.dependencies.get(serviceName) || [];
            deps.forEach(dep => {
                const depName = typeof dep === 'string' ? dep : dep.service;
                if (depName) {
                    checkCircular(depName);
                }
            });

            stack.delete(serviceName);
        };

        dependencies.forEach(dep => {
            const depName = typeof dep === 'string' ? dep : dep.service;
            if (depName) {
                checkCircular(depName);
            }
        });
    }

    /**
     * Update initialization order based on dependencies
     * @private
     */
    updateInitializationOrder() {
        const visited = new Set();
        const order = [];

        const visit = (name) => {
            if (visited.has(name)) return;
            visited.add(name);

            const deps = this.dependencies.get(name) || [];
            deps.forEach(dep => {
                const depName = typeof dep === 'string' ? dep : dep.service;
                if (depName && this.services.has(depName)) {
                    visit(depName);
                }
            });

            order.push(name);
        };

        this.services.forEach((_, name) => visit(name));
        this.initializationOrder = order;
    }

    /**
     * Get all services in dependency order
     * @returns {string[]} Ordered service names
     */
    getInitializationOrder() {
        return [...this.initializationOrder];
    }

    /**
     * Perform health checks on all registered services
     * @returns {Promise<Object>} Health check results
     */
    async performHealthChecks() {
        const results = {};
        
        for (const [name, check] of this.healthChecks) {
            try {
                const instance = this.get(name);
                const healthy = await check.call(instance);
                results[name] = { healthy, error: null };
            } catch (error) {
                results[name] = { healthy: false, error: error.message };
            }
        }

        return results;
    }

    /**
     * Dispose of all services and clear registry
     */
    async dispose() {
        if (this.disposed) return;

        // Dispose in reverse initialization order
        const reverseOrder = [...this.initializationOrder].reverse();

        for (const name of reverseOrder) {
            const metadata = this.serviceMetadata.get(name);
            if (metadata && metadata.dispose) {
                try {
                    const instance = this.singletons.get(name);
                    if (instance) {
                        await metadata.dispose.call(instance);
                    }
                } catch (error) {
                    console.error(`Error disposing service '${name}':`, error);
                }
            }
        }

        this.services.clear();
        this.singletons.clear();
        this.dependencies.clear();
        this.serviceMetadata.clear();
        this.healthChecks.clear();
        this.initializationOrder = [];
        this.disposed = true;
    }

    /**
     * Create a scoped registry inheriting from this one
     * @returns {ServiceRegistry} Scoped registry
     */
    createScope() {
        const scope = new ServiceRegistry();
        
        // Copy service definitions but not singletons
        this.services.forEach((service, name) => {
            const metadata = this.serviceMetadata.get(name);
            scope.services.set(name, service);
            scope.dependencies.set(name, this.dependencies.get(name));
            scope.serviceMetadata.set(name, { ...metadata, singleton: false });
        });

        scope.updateInitializationOrder();
        return scope;
    }

    /**
     * Get service metadata
     * @param {string} name - Service name
     * @returns {Object} Service metadata
     */
    getMetadata(name) {
        return this.serviceMetadata.get(name);
    }

    /**
     * List all registered services
     * @returns {string[]} Service names
     */
    list() {
        return Array.from(this.services.keys());
    }

    /**
     * Get dependency graph for visualization
     * @returns {Object} Dependency graph
     */
    getDependencyGraph() {
        const graph = {};
        
        this.services.forEach((_, name) => {
            const deps = this.dependencies.get(name) || [];
            graph[name] = deps.map(dep => 
                typeof dep === 'string' ? dep : dep.service
            ).filter(Boolean);
        });

        return graph;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceRegistry;
} else if (typeof window !== 'undefined') {
    window.ServiceRegistry = ServiceRegistry;
}