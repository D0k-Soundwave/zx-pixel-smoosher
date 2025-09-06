/**
 * ModularBootstrap.js - Bootstrap the modular architecture
 * Initializes the platform, loads modules, and sets up legacy compatibility
 * @module ModularBootstrap
 */

class ModularBootstrap {
    constructor(config = {}) {
        this.config = {
            enableLegacyCompatibility: true,
            enablePerformanceMonitoring: true,
            enableDebugMode: false,
            autoInitialize: config.autoInitialize !== false,
            modules: [],
            ...config
        };
        
        this.platform = null;
        this.legacyWrapper = null;
        this.initialized = false;
        this.startTime = performance.now();
        
        // Initialization steps
        this.initSteps = [
            'loadCoreClasses',
            'createPlatform', 
            'loadCoreModules',
            'setupLegacyCompatibility',
            'initializeApplication',
            'performHealthCheck'
        ];
        
        this.initProgress = new Map();
        
        if (this.config.autoInitialize) {
            this.initialize().catch(error => {
                console.error('Failed to auto-initialize modular system:', error);
            });
        }
    }

    /**
     * Initialize the modular system
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            console.warn('Modular system already initialized');
            return;
        }

        console.log('🚀 Initializing ZX Pixel Smoosher Modular Architecture...');
        
        try {
            for (const step of this.initSteps) {
                const stepStart = performance.now();
                
                await this[step]();
                
                const stepTime = performance.now() - stepStart;
                this.initProgress.set(step, stepTime);
                
                console.log(`✓ ${step} completed in ${stepTime.toFixed(2)}ms`);
            }
            
            this.initialized = true;
            const totalTime = performance.now() - this.startTime;
            
            console.log(`🎉 Modular system initialized successfully in ${totalTime.toFixed(2)}ms`);
            
            // Emit initialization complete event
            if (this.platform && this.platform.eventBus) {
                this.platform.eventBus.emit('modular:initialized', {
                    totalTime,
                    steps: Object.fromEntries(this.initProgress)
                });
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize modular system:', error);
            throw error;
        }
    }

    /**
     * Load core classes and check dependencies
     * @private
     */
    async loadCoreClasses() {
        const requiredClasses = [
            { name: 'EventBus', global: 'EventBus' },
            { name: 'ErrorHandler', global: 'ErrorHandler' },
            { name: 'MemoryManager', global: 'MemoryManager' },
            { name: 'HistoryManager', global: 'HistoryManager' }
        ];
        
        const missing = [];
        
        for (const cls of requiredClasses) {
            if (typeof window[cls.global] === 'undefined') {
                missing.push(cls.name);
            }
        }
        
        if (missing.length > 0) {
            throw new Error(`Missing required classes: ${missing.join(', ')}`);
        }
        
        // Check if modular classes are loaded
        const modularClasses = [
            'ServiceRegistry',
            'ModuleLoader',
            'CorePlatform',
            'BaseModule',
            'HistoryManagerModule',
            'StateManagerModule',
            'ColorManagerModule',
            'LegacyCompatibilityWrapper'
        ];
        
        for (const className of modularClasses) {
            if (typeof window[className] === 'undefined') {
                console.warn(`Modular class not found: ${className}`);
            }
        }
    }

    /**
     * Create the core platform
     * @private
     */
    async createPlatform() {
        if (typeof CorePlatform === 'undefined') {
            throw new Error('CorePlatform class not available');
        }
        
        this.platform = new CorePlatform({
            debug: this.config.enableDebugMode,
            performanceMonitoring: this.config.enablePerformanceMonitoring,
            compatibility: {
                legacy: this.config.enableLegacyCompatibility
            }
        });
        
        await this.platform.initialize();
    }

    /**
     * Load core modules
     * @private
     */
    async loadCoreModules() {
        const coreModules = [
            {
                name: 'historyManager',
                class: HistoryManagerModule,
                config: {
                    maxStates: 50,
                    maxBranches: 10,
                    compressionEnabled: true,
                    cacheTimeout: 2000,
                    cleanupThreshold: 0.8,
                    autoCompact: true
                }
            },
            {
                name: 'stateManager',
                class: StateManagerModule,
                config: {
                    enableHistory: true,
                    compressionEnabled: true
                }
            },
            {
                name: 'colorManager', 
                class: ColorManagerModule,
                config: {
                    enableFlash: true,
                    enableBright: true
                }
            },
            {
                name: 'canvasService',
                class: CanvasService,
                config: {
                    enableDeferredExecution: true,
                    maxDeferredCalls: 100,
                    canvasSelector: 'canvas',
                    previewCanvasSelector: 'preview-canvas'
                }
            }
        ];
        
        for (const moduleConfig of coreModules) {
            if (typeof moduleConfig.class === 'undefined') {
                throw new Error(`CRITICAL: Module class '${moduleConfig.name}' is REQUIRED but not available`);
            }
            
            const module = await this.platform.loadModule(
                moduleConfig.class,
                moduleConfig.config
            );
            
            console.log(`✓ Loaded mandatory module: ${moduleConfig.name}`);
        }
        
        // Load additional modules from config
        for (const moduleConfig of this.config.modules) {
            try {
                await this.platform.loadModule(
                    moduleConfig.class,
                    moduleConfig.config
                );
            } catch (error) {
                console.error(`Failed to load configured module:`, error);
            }
        }
    }

    /**
     * Setup legacy compatibility layer
     * @private
     */
    async setupLegacyCompatibility() {
        if (!this.config.enableLegacyCompatibility) {
            throw new Error('Legacy compatibility is MANDATORY and cannot be disabled');
        }
        
        if (typeof LegacyCompatibilityWrapper === 'undefined') {
            throw new Error('LegacyCompatibilityWrapper is REQUIRED but not available');
        }
        
        this.legacyWrapper = new LegacyCompatibilityWrapper(this.platform);
        
        console.log('✓ Legacy compatibility layer active');
    }

    /**
     * Initialize the application
     * @private
     */
    async initializeApplication() {
        // Debug: Show what services are available
        console.log('🔍 Checking available services...');
        if (this.platform.serviceRegistry) {
            const availableServices = this.platform.serviceRegistry.list();
            console.log('📋 Available services:', availableServices);
        }
        
        // Ensure all services are properly initialized
        const requiredServices = ['stateManager', 'colorManager', 'canvasService'];
        
        for (const serviceName of requiredServices) {
            const service = this.platform.getService(serviceName);
            if (!service) {
                // Try getting as module if service fails
                const module = this.platform.moduleLoader?.getModule(serviceName);
                if (module) {
                    console.warn(`⚠️ Module '${serviceName}' exists but not registered as service - registering now...`);
                    this.platform.serviceRegistry.register(serviceName, module, { 
                        singleton: true, 
                        metadata: { source: 'module-late-registration' } 
                    });
                } else {
                    throw new Error(`Required service not available: ${serviceName}`);
                }
            }
        }
        
        // Initialize canvas and UI if available
        if (typeof document !== 'undefined') {
            this.setupDOMIntegration();
        }
        
        console.log('✓ Application initialization complete');
    }

    /**
     * Setup DOM integration
     * @private
     */
    setupDOMIntegration() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.performDOMSetup();
            });
        } else {
            this.performDOMSetup();
        }
    }

    /**
     * Perform DOM setup
     * @private
     */
    performDOMSetup() {
        // Setup canvas if it exists
        const canvas = document.getElementById('zx-canvas');
        if (canvas) {
            console.log('✓ Found ZX canvas element');
            
            // Initialize canvas service if available
            const canvasService = this.platform.getService('canvasService');
            if (canvasService) {
                canvasService.setCanvas(canvas);
            }
        }
        
        // Setup color palette if it exists
        const colorPalette = document.getElementById('color-palette');
        if (colorPalette) {
            console.log('✓ Found color palette element');
        }
    }

    /**
     * Perform health check
     * @private
     */
    async performHealthCheck() {
        const health = await this.platform.performHealthChecks();
        
        console.log('🏥 System Health Check:', health);
        
        // Check for any critical issues
        const criticalIssues = [];
        
        // Check services
        for (const [serviceName, serviceHealth] of Object.entries(health.services)) {
            if (!serviceHealth.healthy) {
                criticalIssues.push(`Service ${serviceName}: ${serviceHealth.error}`);
            }
        }
        
        // Check modules
        for (const [moduleName, moduleHealth] of Object.entries(health.modules)) {
            if (!moduleHealth.healthy) {
                criticalIssues.push(`Module ${moduleName}: ${moduleHealth.error}`);
            }
        }
        
        if (criticalIssues.length > 0) {
            console.warn('⚠️ Health check found issues:', criticalIssues);
        } else {
            console.log('✅ All systems healthy');
        }
    }

    /**
     * Get platform instance
     * @returns {CorePlatform} Platform instance
     */
    getPlatform() {
        return this.platform;
    }

    /**
     * Get legacy wrapper
     * @returns {LegacyCompatibilityWrapper} Legacy wrapper
     */
    getLegacyWrapper() {
        return this.legacyWrapper;
    }

    /**
     * Check if system is initialized
     * @returns {boolean} Initialization status
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get initialization metrics
     * @returns {Object} Metrics
     */
    getMetrics() {
        return {
            totalTime: this.initialized ? performance.now() - this.startTime : null,
            stepTimes: Object.fromEntries(this.initProgress),
            initialized: this.initialized
        };
    }

    /**
     * Reload the system (development helper)
     * @returns {Promise<void>}
     */
    async reload() {
        console.log('🔄 Reloading modular system...');
        
        await this.dispose();
        
        // Reset state
        this.initialized = false;
        this.startTime = performance.now();
        this.initProgress.clear();
        
        await this.initialize();
    }

    /**
     * Dispose of the system
     * @returns {Promise<void>}
     */
    async dispose() {
        console.log('🗑️ Disposing modular system...');
        
        try {
            // Dispose legacy wrapper
            if (this.legacyWrapper) {
                await this.legacyWrapper.dispose();
                this.legacyWrapper = null;
            }
            
            // Dispose platform
            if (this.platform) {
                await this.platform.dispose();
                this.platform = null;
            }
            
            this.initialized = false;
            
            console.log('✓ Modular system disposed');
            
        } catch (error) {
            console.error('Error disposing modular system:', error);
        }
    }
}

// Export to window for manual initialization
if (typeof window !== 'undefined') {
    window.ModularBootstrap = ModularBootstrap;
    
    // Helper function for manual initialization
    window.initializeModularSystem = function(config = {}) {
        const defaultConfig = {
            enableDebugMode: window.DEBUG_MODE || false,
            enableLegacyCompatibility: true,
            ...config
        };
        
        console.log('🚀 Initializing modular system with config:', defaultConfig);
        
        if (window.modularSystem) {
            console.warn('Modular system already exists, disposing first...');
            window.modularSystem.dispose();
        }
        
        window.modularSystem = new ModularBootstrap(defaultConfig);
        return window.modularSystem;
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModularBootstrap;
}