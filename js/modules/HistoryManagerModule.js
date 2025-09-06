/**
 * HistoryManagerModule.js - Modular wrapper for OptimizedHistoryManager
 * Provides history management services to the modular platform
 * @module HistoryManagerModule
 */

class HistoryManagerModule extends BaseModule {
    constructor(platform, config = {}) {
        super('historyManager', '2.0.0', ['eventBus']);
        
        this.platform = platform;
        this.config = {
            maxStates: 50,
            maxBranches: 10,
            compressionEnabled: true,
            cacheTimeout: 2000,
            cleanupThreshold: 0.8,
            autoCompact: true,
            ...config
        };
        
        this.historyManager = null;
        this.disposed = false;
    }

    /**
     * Initialize the history manager module
     * @returns {Promise<void>}
     */
    async initialize() {
        await super.initialize();
        
        try {
            // Create the OptimizedHistoryManager instance
            this.historyManager = new OptimizedHistoryManager(this.config);
            
            console.log('✓ HistoryManagerModule initialized with config:', this.config);
            
            // Set up event bridges
            this.setupEventBridges();
            
        } catch (error) {
            console.error('Failed to initialize HistoryManagerModule:', error);
            throw error;
        }
    }

    /**
     * Setup event bridges between history manager and platform
     * @private
     */
    setupEventBridges() {
        const eventBus = this.getDependency('eventBus');
        
        if (this.historyManager && eventBus) {
            // Bridge history manager events to platform event bus
            this.historyManager.on('state-saved', (data) => {
                eventBus.emit('history:state-saved', data);
            });
            
            this.historyManager.on('undo-performed', (data) => {
                eventBus.emit('history:undo-performed', data);
            });
            
            this.historyManager.on('redo-performed', (data) => {
                eventBus.emit('history:redo-performed', data);
            });
            
            this.historyManager.on('history-cleared', (data) => {
                eventBus.emit('history:cleared', data);
            });
            
            this.historyManager.on('compacted', (data) => {
                eventBus.emit('history:compacted', data);
            });
        }
    }

    /**
     * Get module API
     * @override
     * @returns {Object} Module API
     */
    getAPI() {
        return {
            // History management methods
            saveState: (pixelData, attributeData, actionType) => 
                this.historyManager?.saveState(pixelData, attributeData, actionType),
                
            undo: () => this.historyManager?.undo(),
            
            redo: () => this.historyManager?.redo(),
            
            canUndo: () => this.historyManager?.canUndo() || false,
            
            canRedo: () => this.historyManager?.canRedo() || false,
            
            getInfo: () => this.historyManager?.getInfo() || this.getDefaultInfo(),
            
            getMemoryUsage: () => this.historyManager?.getMemoryUsage() || this.getDefaultMemoryUsage(),
            
            clear: () => this.historyManager?.clear(),
            
            compact: () => this.historyManager?.compact() || { before: {}, after: {} },
            
            // Direct access to history manager instance
            getHistoryManager: () => this.historyManager
        };
    }

    /**
     * Get default info when history manager is not available
     * @private
     */
    getDefaultInfo() {
        return {
            undoCount: 0,
            redoCount: 0,
            totalStates: 0,
            currentIndex: -1,
            hasPendingRedo: false,
            branchCount: 0,
            canUndo: false,
            canRedo: false
        };
    }

    /**
     * Get default memory usage when history manager is not available
     * @private
     */
    getDefaultMemoryUsage() {
        return {
            mainStates: 0,
            branchStates: 0,
            totalStates: 0,
            totalMemoryMB: '0.00',
            branches: 0,
            efficiency: '100.0'
        };
    }

    /**
     * Get the underlying history manager instance
     * @returns {OptimizedHistoryManager} History manager instance
     */
    getHistoryManager() {
        return this.historyManager;
    }

    /**
     * Get module status
     * @returns {Object} Module status
     */
    getStatus() {
        const baseStatus = super.getStatus();
        
        return {
            ...baseStatus,
            historyManager: {
                initialized: !!this.historyManager,
                info: this.historyManager?.getInfo() || this.getDefaultInfo(),
                memoryUsage: this.historyManager?.getMemoryUsage() || this.getDefaultMemoryUsage()
            }
        };
    }

    /**
     * Dispose of the module
     * @returns {Promise<void>}
     */
    async dispose() {
        if (this.disposed) {
            return;
        }

        try {
            // Clean up history manager
            if (this.historyManager) {
                // OptimizedHistoryManager doesn't have a dispose method, just clear it
                this.historyManager.clear();
                this.historyManager = null;
            }
            
            await super.dispose();
            
            console.log('✓ HistoryManagerModule disposed');
            
        } catch (error) {
            console.error('Error disposing HistoryManagerModule:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManagerModule;
} else if (typeof window !== 'undefined') {
    window.HistoryManagerModule = HistoryManagerModule;
}