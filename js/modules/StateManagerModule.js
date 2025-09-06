/**
 * StateManagerModule.js - Complete state management module for ZX Spectrum canvas
 * Manages pixel data, attributes, zoom levels, grids, and history
 * @module StateManagerModule
 */

class StateManagerModule extends BaseModule {
    constructor(platform, config = {}) {
        super('stateManager', '2.0.0', ['eventBus', 'historyManager']);
        
        this.platform = platform;
        this.config = {
            width: 256,
            height: 192,
            attributeBlockSize: 8,
            maxZoom: 16,
            minZoom: 1,
            defaultZoom: 2,
            enableHistory: true,
            historyLimit: 100,
            compressionEnabled: true,
            ...config
        };

        // Core state
        this.state = null;
        this.pixels = null;
        this.attributes = null;
        this.zoom = this.config.defaultZoom;
        this.grids = {
            '1x1': false,
            '8x8': false, 
            '16x16': false
        };

        // State change tracking
        this.stateVersion = 0;
        this.lastModified = Date.now();
        this.isDirty = false;
        
        // Performance optimization
        this.pixelCache = new Map();
        this.attributeCache = new Map();
        this.compressionWorker = null;
        
        // Validation
        this.validationEnabled = true;
        this.constraints = {
            maxInkValue: 7,
            maxPaperValue: 7,
            attributeWidth: 32,
            attributeHeight: 24
        };
    }

    /**
     * Initialize the module
     * @override
     * @returns {Promise<void>}
     */
    async onInitialize() {
        // Initialize state arrays
        this.initializeState();
        
        // Get history manager if available
        this.historyManager = this.getDependency('historyManager');
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Initialize compression worker if supported
        if (this.config.compressionEnabled && typeof Worker !== 'undefined') {
            try {
                this.initializeCompressionWorker();
            } catch (error) {
                console.warn('Compression worker not available:', error);
            }
        }
    }

    /**
     * Initialize state arrays with ZX Spectrum constraints
     * @private
     */
    initializeState() {
        const { width, height } = this.config;
        const { attributeWidth, attributeHeight } = this.constraints;
        
        // Pre-allocate pixel array for performance
        this.pixels = new Array(height);
        for (let row = 0; row < height; row++) {
            this.pixels[row] = new Uint8Array(width);
        }
        
        // Pre-allocate attribute array
        this.attributes = new Array(attributeHeight);
        for (let blockRow = 0; blockRow < attributeHeight; blockRow++) {
            this.attributes[blockRow] = new Array(attributeWidth);
            for (let blockCol = 0; blockCol < attributeWidth; blockCol++) {
                this.attributes[blockRow][blockCol] = this.createDefaultAttribute();
            }
        }
        
        // Create state object
        this.state = {
            pixels: this.pixels,
            attributes: this.attributes,
            zoom: this.zoom,
            grids: { ...this.grids }
        };
        
        this.stateVersion++;
        this.lastModified = Date.now();
    }

    /**
     * Create default attribute object
     * @private
     * @returns {Object} Default attribute
     */
    createDefaultAttribute() {
        return {
            ink: 0,      // Black ink
            paper: 7,    // White paper
            bright: false,
            flash: false
        };
    }

    /**
     * Setup event handlers
     * @private
     */
    setupEventHandlers() {
        // Register for external state changes
        this.registerEventHandler('state:set', (data) => this.handleExternalStateChange(data));
        this.registerEventHandler('state:reset', () => this.resetState());
        this.registerEventHandler('state:validate', () => this.validateState());
        
        // Register for history events
        if (this.historyManager) {
            this.registerEventHandler('history:restored', (data) => this.handleHistoryRestore(data));
        }
    }

    /**
     * Get complete state copy
     * @returns {Object} State copy
     */
    getState() {
        return {
            pixels: this.clonePixels(this.pixels),
            attributes: this.cloneAttributes(this.attributes),
            zoom: this.zoom,
            grids: { ...this.grids },
            version: this.stateVersion,
            lastModified: this.lastModified
        };
    }

    /**
     * Get state reference (no cloning for performance)
     * @returns {Object} State reference
     */
    getStateReference() {
        return this.state;
    }

    /**
     * Set pixels without emitting events
     * @param {Array} pixels - Pixel data
     * @param {boolean} validate - Whether to validate
     */
    setPixels(pixels, validate = true) {
        if (validate && this.validationEnabled) {
            this.validatePixels(pixels);
        }
        
        // Update pixels efficiently
        for (let row = 0; row < this.config.height; row++) {
            if (pixels[row]) {
                for (let col = 0; col < this.config.width; col++) {
                    this.pixels[row][col] = pixels[row][col] || 0;
                }
            }
        }
        
        this.isDirty = true;
        this.stateVersion++;
        this.lastModified = Date.now();
        
        // Clear pixel cache
        this.pixelCache.clear();
    }

    /**
     * Set attributes without emitting events
     * @param {Array} attributes - Attribute data
     * @param {boolean} validate - Whether to validate
     */
    setAttributes(attributes, validate = true) {
        if (validate && this.validationEnabled) {
            this.validateAttributes(attributes);
        }
        
        const { attributeWidth, attributeHeight } = this.constraints;
        
        for (let row = 0; row < attributeHeight; row++) {
            if (attributes[row]) {
                for (let col = 0; col < attributeWidth; col++) {
                    if (attributes[row][col]) {
                        this.attributes[row][col] = this.cloneAttribute(attributes[row][col]);
                    }
                }
            }
        }
        
        this.isDirty = true;
        this.stateVersion++;
        this.lastModified = Date.now();
        
        // Clear attribute cache
        this.attributeCache.clear();
    }

    /**
     * Update pixels and emit state change
     * @param {Array} pixels - Pixel data
     */
    updatePixels(pixels) {
        this.setPixels(pixels);
        
        if (this.eventBus) {
            this.eventBus.emit('state-changed', {
                pixels: this.pixels,
                version: this.stateVersion
            });
        }
    }

    /**
     * Update attributes and emit state change
     * @param {Array} attributes - Attribute data
     */
    updateAttributes(attributes) {
        this.setAttributes(attributes);
        
        if (this.eventBus) {
            this.eventBus.emit('state-changed', {
                attributes: this.attributes,
                version: this.stateVersion
            });
        }
    }

    /**
     * Set a single pixel value
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} value - Pixel value (0 or 1)
     */
    setPixel(x, y, value) {
        if (x >= 0 && x < this.config.width && y >= 0 && y < this.config.height) {
            this.pixels[y][x] = value ? 1 : 0;
            this.isDirty = true;
            this.stateVersion++;
            
            // Update cache
            const key = `${x},${y}`;
            this.pixelCache.set(key, this.pixels[y][x]);
        }
    }

    /**
     * Get a single pixel value
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Pixel value
     */
    getPixel(x, y) {
        if (x >= 0 && x < this.config.width && y >= 0 && y < this.config.height) {
            // Check cache first
            const key = `${x},${y}`;
            if (this.pixelCache.has(key)) {
                return this.pixelCache.get(key);
            }
            
            const value = this.pixels[y][x];
            this.pixelCache.set(key, value);
            return value;
        }
        return 0;
    }

    /**
     * Set attribute for a block
     * @param {number} blockX - Block X coordinate
     * @param {number} blockY - Block Y coordinate
     * @param {Object} attribute - Attribute object
     */
    setAttribute(blockX, blockY, attribute) {
        const { attributeWidth, attributeHeight } = this.constraints;
        
        if (blockX >= 0 && blockX < attributeWidth && blockY >= 0 && blockY < attributeHeight) {
            this.attributes[blockY][blockX] = this.cloneAttribute(attribute);
            this.isDirty = true;
            this.stateVersion++;
            
            // Update cache
            const key = `${blockX},${blockY}`;
            this.attributeCache.set(key, this.attributes[blockY][blockX]);
        }
    }

    /**
     * Get attribute for a block
     * @param {number} blockX - Block X coordinate
     * @param {number} blockY - Block Y coordinate
     * @returns {Object} Attribute object
     */
    getAttribute(blockX, blockY) {
        const { attributeWidth, attributeHeight } = this.constraints;
        
        if (blockX >= 0 && blockX < attributeWidth && blockY >= 0 && blockY < attributeHeight) {
            // Check cache first
            const key = `${blockX},${blockY}`;
            if (this.attributeCache.has(key)) {
                return this.attributeCache.get(key);
            }
            
            const attribute = this.attributes[blockY][blockX];
            this.attributeCache.set(key, attribute);
            return attribute;
        }
        return this.createDefaultAttribute();
    }

    /**
     * Set zoom level
     * @param {number} zoom - Zoom level
     */
    setZoom(zoom) {
        const newZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
        
        if (newZoom !== this.zoom) {
            this.zoom = newZoom;
            this.state.zoom = newZoom;
            
            if (this.eventBus) {
                this.eventBus.emit('zoom-changed', newZoom);
            }
        }
    }

    /**
     * Get current zoom level
     * @returns {number} Zoom level
     */
    getZoom() {
        return this.zoom;
    }

    /**
     * Toggle grid visibility
     * @param {string} type - Grid type
     */
    toggleGrid(type) {
        if (this.grids.hasOwnProperty(type)) {
            this.grids[type] = !this.grids[type];
            this.state.grids[type] = this.grids[type];
            
            if (this.eventBus) {
                this.eventBus.emit('grid-changed', {
                    type,
                    enabled: this.grids[type]
                });
            }
        }
    }

    /**
     * Get grid state
     * @param {string} type - Grid type
     * @returns {boolean} Grid enabled state
     */
    getGridState(type) {
        return this.grids[type] || false;
    }

    /**
     * Save state to history
     * @param {string} actionType - Type of action
     */
    saveState(actionType = 'draw') {
        if (this.historyManager && this.config.enableHistory) {
            this.historyManager.saveState(
                this.pixels,
                this.attributes,
                actionType
            );
            
            if (this.eventBus) {
                this.eventBus.emit('history-saved', {
                    actionType,
                    version: this.stateVersion
                });
            }
        }
    }

    /**
     * Undo last action
     */
    undo() {
        if (!this.historyManager || !this.historyManager.canUndo()) {
            if (this.eventBus) {
                this.eventBus.emit('status', {
                    message: 'Nothing to undo',
                    type: 'warning'
                });
            }
            return;
        }

        const result = this.historyManager.undo();
        if (result) {
            this.applyHistoryState(result);
            
            const info = result.info;
            let message = `↶ Undo (${info.undoCount} more`;
            if (info.redoCount > 0) message += `, ${info.redoCount} redo`;
            message += ')';
            
            if (this.eventBus) {
                this.eventBus.emit('status', {
                    message,
                    type: 'success'
                });
            }
        }
    }

    /**
     * Redo last undone action
     */
    redo() {
        if (!this.historyManager || !this.historyManager.canRedo()) {
            if (this.eventBus) {
                this.eventBus.emit('status', {
                    message: 'Nothing to redo',
                    type: 'warning'
                });
            }
            return;
        }

        const result = this.historyManager.redo();
        if (result) {
            this.applyHistoryState(result);
            
            const info = result.info;
            let message = `↷ Redo (${info.undoCount} undo`;
            if (info.redoCount > 0) message += `, ${info.redoCount} more redo`;
            message += ')';
            
            if (this.eventBus) {
                this.eventBus.emit('status', {
                    message,
                    type: 'success'
                });
            }
        }
    }

    /**
     * Apply history state
     * @private
     * @param {Object} historyState - History state
     */
    applyHistoryState(historyState) {
        this.pixels = historyState.pixels;
        this.attributes = historyState.attributes;
        this.state.pixels = this.pixels;
        this.state.attributes = this.attributes;
        
        this.isDirty = true;
        this.stateVersion++;
        this.lastModified = Date.now();
        
        // Clear caches
        this.pixelCache.clear();
        this.attributeCache.clear();
        
        if (this.eventBus) {
            this.eventBus.emit('clear-preview');
            this.eventBus.emit('state-changed', {
                pixels: this.pixels,
                attributes: this.attributes,
                version: this.stateVersion
            });
        }
    }

    /**
     * Clear canvas
     */
    clearCanvas() {
        // Save current state before clearing
        this.saveState('clear');
        
        // Clear pixels
        for (let row = 0; row < this.config.height; row++) {
            this.pixels[row].fill(0);
        }
        
        // Reset attributes
        const { attributeWidth, attributeHeight } = this.constraints;
        for (let row = 0; row < attributeHeight; row++) {
            for (let col = 0; col < attributeWidth; col++) {
                this.attributes[row][col] = this.createDefaultAttribute();
            }
        }
        
        this.isDirty = true;
        this.stateVersion++;
        this.lastModified = Date.now();
        
        // Clear caches
        this.pixelCache.clear();
        this.attributeCache.clear();
        
        if (this.eventBus) {
            this.eventBus.emit('state-changed', {
                pixels: this.pixels,
                attributes: this.attributes,
                version: this.stateVersion
            });
            
            this.eventBus.emit('status', {
                message: 'Canvas cleared',
                type: 'success'
            });
        }
    }

    /**
     * Reset state to initial
     */
    resetState() {
        this.initializeState();
        
        // Clear caches
        this.pixelCache.clear();
        this.attributeCache.clear();
        
        if (this.eventBus) {
            this.eventBus.emit('state-changed', {
                pixels: this.pixels,
                attributes: this.attributes,
                version: this.stateVersion
            });
        }
    }

    /**
     * Validate pixel data
     * @private
     * @param {Array} pixels - Pixel data to validate
     */
    validatePixels(pixels) {
        if (!Array.isArray(pixels)) {
            throw new TypeError('Pixels must be an array');
        }
        
        if (pixels.length !== this.config.height) {
            throw new RangeError(`Pixel array must have ${this.config.height} rows`);
        }
        
        for (let row = 0; row < pixels.length; row++) {
            if (!pixels[row] || pixels[row].length !== this.config.width) {
                throw new RangeError(`Pixel row ${row} must have ${this.config.width} columns`);
            }
        }
    }

    /**
     * Validate attribute data
     * @private
     * @param {Array} attributes - Attribute data to validate
     */
    validateAttributes(attributes) {
        if (!Array.isArray(attributes)) {
            throw new TypeError('Attributes must be an array');
        }
        
        const { attributeWidth, attributeHeight, maxInkValue, maxPaperValue } = this.constraints;
        
        if (attributes.length !== attributeHeight) {
            throw new RangeError(`Attribute array must have ${attributeHeight} rows`);
        }
        
        for (let row = 0; row < attributes.length; row++) {
            if (!attributes[row] || attributes[row].length !== attributeWidth) {
                throw new RangeError(`Attribute row ${row} must have ${attributeWidth} columns`);
            }
            
            for (let col = 0; col < attributes[row].length; col++) {
                const attr = attributes[row][col];
                if (attr) {
                    if (attr.ink < 0 || attr.ink > maxInkValue) {
                        throw new RangeError(`Invalid ink value: ${attr.ink}`);
                    }
                    if (attr.paper < 0 || attr.paper > maxPaperValue) {
                        throw new RangeError(`Invalid paper value: ${attr.paper}`);
                    }
                }
            }
        }
    }

    /**
     * Validate complete state
     * @returns {Object} Validation result
     */
    validateState() {
        const errors = [];
        
        try {
            this.validatePixels(this.pixels);
        } catch (error) {
            errors.push(`Pixel validation: ${error.message}`);
        }
        
        try {
            this.validateAttributes(this.attributes);
        } catch (error) {
            errors.push(`Attribute validation: ${error.message}`);
        }
        
        const isValid = errors.length === 0;
        
        if (this.eventBus) {
            this.eventBus.emit('state:validated', {
                isValid,
                errors,
                version: this.stateVersion
            });
        }
        
        return { isValid, errors };
    }

    /**
     * Clone pixel data
     * @private
     * @param {Array} pixels - Pixel data
     * @returns {Array} Cloned pixels
     */
    clonePixels(pixels) {
        return pixels.map(row => new Uint8Array(row));
    }

    /**
     * Clone attribute data
     * @private
     * @param {Array} attributes - Attribute data
     * @returns {Array} Cloned attributes
     */
    cloneAttributes(attributes) {
        return attributes.map(row => row.map(attr => this.cloneAttribute(attr)));
    }

    /**
     * Clone single attribute
     * @private
     * @param {Object} attr - Attribute
     * @returns {Object} Cloned attribute
     */
    cloneAttribute(attr) {
        return {
            ink: attr.ink,
            paper: attr.paper,
            bright: attr.bright,
            flash: attr.flash
        };
    }

    /**
     * Handle external state change
     * @private
     * @param {Object} data - State data
     */
    handleExternalStateChange(data) {
        if (data.pixels) {
            this.setPixels(data.pixels);
        }
        
        if (data.attributes) {
            this.setAttributes(data.attributes);
        }
        
        if (data.zoom !== undefined) {
            this.setZoom(data.zoom);
        }
        
        if (data.grids) {
            Object.keys(data.grids).forEach(type => {
                if (this.grids.hasOwnProperty(type)) {
                    this.grids[type] = data.grids[type];
                }
            });
        }
    }

    /**
     * Handle history restore
     * @private
     * @param {Object} data - History data
     */
    handleHistoryRestore(data) {
        this.applyHistoryState(data);
    }

    /**
     * Initialize compression worker
     * @private
     */
    initializeCompressionWorker() {
        // Compression worker would be initialized here if available
        // This is a placeholder for future implementation
    }

    /**
     * Compress state for storage
     * @returns {Promise<ArrayBuffer>} Compressed state
     */
    async compressState() {
        // Simple RLE compression for pixel data
        const compressed = [];
        
        for (let row = 0; row < this.config.height; row++) {
            let count = 1;
            let value = this.pixels[row][0];
            
            for (let col = 1; col < this.config.width; col++) {
                if (this.pixels[row][col] === value && count < 255) {
                    count++;
                } else {
                    compressed.push(count, value);
                    count = 1;
                    value = this.pixels[row][col];
                }
            }
            compressed.push(count, value);
        }
        
        return new Uint8Array(compressed).buffer;
    }

    /**
     * Get module API
     * @override
     * @returns {Object} Module API
     */
    getAPI() {
        return {
            // State management
            getState: () => this.getState(),
            getStateReference: () => this.getStateReference(),
            setPixels: (pixels, validate) => this.setPixels(pixels, validate),
            setAttributes: (attributes, validate) => this.setAttributes(attributes, validate),
            updatePixels: (pixels) => this.updatePixels(pixels),
            updateAttributes: (attributes) => this.updateAttributes(attributes),
            
            // Pixel operations
            setPixel: (x, y, value) => this.setPixel(x, y, value),
            getPixel: (x, y) => this.getPixel(x, y),
            
            // Attribute operations
            setAttribute: (blockX, blockY, attribute) => this.setAttribute(blockX, blockY, attribute),
            getAttribute: (blockX, blockY) => this.getAttribute(blockX, blockY),
            
            // View controls
            setZoom: (zoom) => this.setZoom(zoom),
            getZoom: () => this.getZoom(),
            toggleGrid: (type) => this.toggleGrid(type),
            getGridState: (type) => this.getGridState(type),
            
            // History
            saveState: (actionType) => this.saveState(actionType),
            undo: () => this.undo(),
            redo: () => this.redo(),
            
            // Utilities
            clearCanvas: () => this.clearCanvas(),
            resetState: () => this.resetState(),
            validateState: () => this.validateState(),
            compressState: () => this.compressState(),
            
            // Metadata
            getStateVersion: () => this.stateVersion,
            getLastModified: () => this.lastModified,
            isDirty: () => this.isDirty
        };
    }

    /**
     * Get event handlers
     * @override
     * @returns {Object} Event handlers
     */
    getEventHandlers() {
        return {
            'state:set': (data) => this.handleExternalStateChange(data),
            'state:reset': () => this.resetState(),
            'state:validate': () => this.validateState(),
            'state:clear': () => this.clearCanvas()
        };
    }

    /**
     * Perform health check
     * @override
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        const baseHealth = await super.healthCheck();
        const validation = this.validateState();
        
        return {
            ...baseHealth,
            stateValid: validation.isValid,
            stateVersion: this.stateVersion,
            pixelCacheSize: this.pixelCache.size,
            attributeCacheSize: this.attributeCache.size,
            historyAvailable: !!this.historyManager
        };
    }

    /**
     * Dispose of the module
     * @override
     * @returns {Promise<void>}
     */
    async onDispose() {
        // Clear caches
        this.pixelCache.clear();
        this.attributeCache.clear();
        
        // Clear state
        this.pixels = null;
        this.attributes = null;
        this.state = null;
        
        // Cleanup compression worker if exists
        if (this.compressionWorker) {
            this.compressionWorker.terminate();
            this.compressionWorker = null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManagerModule;
} else if (typeof window !== 'undefined') {
    window.StateManagerModule = StateManagerModule;
}