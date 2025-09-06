/**
 * OptimizedHistoryManager - Advanced undo/redo system with branching and memory optimization
 * Features: Smart compression, branch management, memory monitoring, auto-cleanup
 */

class OptimizedHistoryManager {
    constructor(options = {}) {
        // Configuration
        this.config = {
            maxStates: options.maxStates || 50,
            maxBranches: options.maxBranches || 10,
            compressionEnabled: options.compressionEnabled !== false,
            cacheTimeout: options.cacheTimeout || 2000,
            cleanupThreshold: options.cleanupThreshold || 0.8,
            autoCompact: options.autoCompact !== false,
        };

        // State management
        this.state = {
            states: [],
            currentIndex: -1,
            branches: new Map(),
            branchId: 'main',
            branchCounter: 0,
            lastUndo: false,
            pendingRedo: null,
        };

        // Performance optimization
        this.cache = {
            memory: { data: null, timestamp: 0 },
            compression: new Map(),
        };

        // Event system
        this.listeners = new Map();
        this.emit = this.emit.bind(this);
    }

    /**
     * Save a new state to history
     */
    saveState(pixelData, attributeData, actionType = 'draw') {
        const state = this._createState(pixelData, attributeData, actionType);

        this._handleStateInsertion(state);
        this._performCleanupIfNeeded();
        this.emit('state-saved', { state, totalStates: this.state.states.length });

        return state;
    }

    /**
     * Undo the last action
     */
    undo() {
        if (!this.canUndo()) {
            this.emit('undo-failed', { reason: 'no-states' });
            return null;
        }

        this.state.currentIndex--;
        this.state.lastUndo = true;
        this.state.pendingRedo = null;

        const state = this.state.states[this.state.currentIndex];
        const result = this._decompressState(state);

        this.emit('undo-performed', { state: result, info: this.getInfo() });
        return result;
    }

    /**
     * Redo the next action
     */
    redo() {
        // Handle pending redo from branch
        if (this.state.pendingRedo && this.state.lastUndo) {
            this.state.lastUndo = false;
            const result = this._decompressState(this.state.pendingRedo);
            this.emit('redo-performed', { state: result, info: this.getInfo() });
            return result;
        }

        if (!this.canRedo()) {
            this.emit('redo-failed', { reason: 'no-states' });
            return null;
        }

        this.state.currentIndex++;
        this.state.lastUndo = false;

        const state = this.state.states[this.state.currentIndex];
        const result = this._decompressState(state);

        this.emit('redo-performed', { state: result, info: this.getInfo() });
        return result;
    }

    /**
     * Check if undo is available
     */
    canUndo() {
        return this.state.currentIndex > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo() {
        return this.state.pendingRedo || this.state.currentIndex < this.state.states.length - 1;
    }

    /**
     * Get current history information
     */
    getInfo() {
        const undoCount = this.state.currentIndex;
        let redoCount = this.state.states.length - 1 - this.state.currentIndex;

        if (this.state.pendingRedo) {
            redoCount = Math.max(1, redoCount);
        }

        return {
            undoCount,
            redoCount,
            totalStates: this.state.states.length,
            currentIndex: this.state.currentIndex,
            hasPendingRedo: !!this.state.pendingRedo,
            branchCount: this.state.branches.size,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
        };
    }

    /**
     * Get memory usage statistics
     */
    getMemoryUsage() {
        const now = Date.now();
        const cached = this.cache.memory;

        // Return cached result if still valid
        if (cached.data && now - cached.timestamp < this.config.cacheTimeout) {
            return cached.data;
        }

        const stats = this._calculateMemoryUsage();
        this.cache.memory = { data: stats, timestamp: now };

        return stats;
    }

    /**
     * Clear all history
     */
    clear() {
        const oldLength = this.state.states.length;

        this.state.states = [];
        this.state.currentIndex = -1;
        this.state.branches.clear();
        this.state.branchId = 'main';
        this.state.branchCounter = 0;
        this.state.lastUndo = false;
        this.state.pendingRedo = null;

        this.cache.memory.data = null;
        this.cache.compression.clear();

        this.emit('history-cleared', { previousLength: oldLength });
    }

    /**
     * Manually trigger cleanup
     */
    compact() {
        const beforeStats = this.getMemoryUsage();
        this._performCleanup();
        const afterStats = this.getMemoryUsage();

        this.emit('compacted', { before: beforeStats, after: afterStats });
        return { before: beforeStats, after: afterStats };
    }

    /**
     * Event system - Add listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Event system - Remove listener
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;

        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Event system - Emit event
     */
    emit(event, data = {}) {
        if (!this.listeners.has(event)) return;

        this.listeners.get(event).forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn(`Error in history manager event listener for '${event}':`, error);
            }
        });
    }

    // Private methods

    /**
     * Create a compressed state object
     */
    _createState(pixelData, attributeData, actionType) {
        const state = {
            timestamp: Date.now(),
            actionType,
            branchId: this.state.branchId,
        };

        if (this.config.compressionEnabled) {
            state.pixels = this._compressPixelData(pixelData);
            state.attributes = this._compressAttributeData(attributeData);
        } else {
            state.pixels = pixelData;
            state.attributes = attributeData;
        }

        return state;
    }

    /**
     * Handle state insertion with branching logic
     */
    _handleStateInsertion(state) {
        // Clear pending redo if adding new state
        if (this.state.pendingRedo && state.actionType === 'draw') {
            this.state.pendingRedo = null;
        }

        // Handle branching if we're in the middle of history
        if (this._hasRedo() && this.state.lastUndo) {
            this._createBranch(state);
        } else {
            this._addToMainBranch(state);
        }

        this.state.lastUndo = false;
    }

    /**
     * Create a new branch from current state
     */
    _createBranch(state) {
        const futureStates = this.state.states.slice(this.state.currentIndex + 1);

        if (futureStates.length > 0) {
            const branchId = `branch_${++this.state.branchCounter}`;
            this.state.branches.set(branchId, {
                states: futureStates,
                parentIndex: this.state.currentIndex,
                createdAt: Date.now(),
                metadata: { originalBranchId: this.state.branchId },
            });
        }

        // Truncate main history and add new state
        this.state.states = this.state.states.slice(0, this.state.currentIndex + 1);
        this.state.states.push(state);
        this.state.currentIndex = this.state.states.length - 1;
        this.state.pendingRedo = state;
    }

    /**
     * Add state to main branch
     */
    _addToMainBranch(state) {
        // Truncate if we're in the middle
        if (this.state.currentIndex < this.state.states.length - 1) {
            this.state.states = this.state.states.slice(0, this.state.currentIndex + 1);
        }

        this.state.states.push(state);
        this.state.currentIndex = this.state.states.length - 1;

        if (this.state.lastUndo) {
            this.state.pendingRedo = state;
        }
    }

    /**
     * Check if redo states exist
     */
    _hasRedo() {
        return this.state.currentIndex < this.state.states.length - 1;
    }

    /**
     * Compress pixel data using Uint8Array
     */
    _compressPixelData(pixelData) {
        return pixelData.map((row) => new Uint8Array(row));
    }

    /**
     * Compress attribute data by extracting only needed properties
     */
    _compressAttributeData(attributeData) {
        return attributeData.map((row) =>
            row.map((attr) => ({
                ink: attr.ink,
                paper: attr.paper,
                bright: attr.bright,
                flash: attr.flash,
            }))
        );
    }

    /**
     * Decompress state for use
     */
    _decompressState(state) {
        return {
            pixels: state.pixels.map((row) => new Uint8Array(row)),
            attributes: state.attributes.map((row) =>
                row.map((attr) => ({ ...attr }))
            ),
            info: this.getInfo(),
            metadata: {
                timestamp: state.timestamp,
                actionType: state.actionType,
                branchId: state.branchId,
            },
        };
    }

    /**
     * Perform cleanup if threshold reached
     */
    _performCleanupIfNeeded() {
        if (!this.config.autoCompact) return;

        const threshold = this.config.maxStates * this.config.cleanupThreshold;
        if (this.state.states.length > threshold) {
            this._performCleanup();
        }
    }

    /**
     * Perform memory cleanup
     */
    _performCleanup() {
        this._cleanupStates();
        this._cleanupBranches();
        this._invalidateCaches();

        this.emit('cleanup-performed', {
            statesCount: this.state.states.length,
            branchesCount: this.state.branches.size,
        });
    }

    /**
     * Cleanup old states
     */
    _cleanupStates() {
        if (this.state.states.length <= this.config.maxStates) return;

        const excess = this.state.states.length - this.config.maxStates;
        this.state.states.splice(0, excess);
        this.state.currentIndex = Math.max(0, this.state.currentIndex - excess);
    }

    /**
     * Cleanup old branches
     */
    _cleanupBranches() {
        if (this.state.branches.size <= this.config.maxBranches) return;

        // Sort branches by creation time (newest first)
        const sortedBranches = Array.from(this.state.branches.entries()).sort(
            (a, b) => b[1].createdAt - a[1].createdAt
        );

        // Keep only the newest branches
        this.state.branches.clear();
        sortedBranches.slice(0, this.config.maxBranches).forEach(([id, branch]) => {
            this.state.branches.set(id, branch);
        });
    }

    /**
     * Invalidate all caches
     */
    _invalidateCaches() {
        this.cache.memory.data = null;
        this.cache.compression.clear();
    }

    /**
     * Calculate memory usage statistics
     */
    _calculateMemoryUsage() {
        const pixelSize = 256 * 192; // ZX Spectrum resolution
        const attributeSize = 32 * 24 * 4; // Attribute data size
        const stateSize = pixelSize + attributeSize;

        const mainStatesMemory = this.state.states.length * stateSize;
        const branchStatesMemory = Array.from(this.state.branches.values()).reduce(
            (total, branch) => total + branch.states.length * stateSize,
            0
        );

        const totalMemory = mainStatesMemory + branchStatesMemory;
        const totalStates =
            this.state.states.length +
            Array.from(this.state.branches.values()).reduce(
                (total, branch) => total + branch.states.length,
                0
            );

        return {
            mainStates: this.state.states.length,
            branchStates: Array.from(this.state.branches.values()).reduce(
                (total, branch) => total + branch.states.length,
                0
            ),
            totalStates,
            totalMemoryMB: (totalMemory / (1024 * 1024)).toFixed(2),
            branches: this.state.branches.size,
            efficiency:
                totalStates > 0
                    ? ((this.state.states.length / totalStates) * 100).toFixed(1)
                    : '100.0',
        };
    }

    /**
     * Get serializable state for debugging
     */
    _getDebugInfo() {
        return {
            config: this.config,
            state: {
                ...this.state,
                branches: Array.from(this.state.branches.entries()),
            },
            memory: this.getMemoryUsage(),
            info: this.getInfo(),
        };
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizedHistoryManager;
} else if (typeof window !== 'undefined') {
    window.OptimizedHistoryManager = OptimizedHistoryManager;
    window.HistoryManager = OptimizedHistoryManager; // Alias for backward compatibility
} else if (typeof global !== 'undefined') {
    global.OptimizedHistoryManager = OptimizedHistoryManager;
}