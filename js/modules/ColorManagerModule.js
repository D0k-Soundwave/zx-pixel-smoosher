/**
 * ColorManagerModule.js - ZX Spectrum color management module
 * Manages ink, paper, bright, and flash attributes with complete validation
 * @module ColorManagerModule
 */

class ColorManagerModule extends BaseModule {
    constructor(platform, config = {}) {
        super('colorManager', '2.0.0', ['eventBus']);
        
        this.platform = platform;
        this.config = {
            enableFlash: true,
            enableBright: true,
            defaultInk: 0,
            defaultPaper: 7,
            cacheRgbValues: true,
            validateColors: true,
            ...config
        };

        // ZX Spectrum color definitions
        this.ZX_COLORS = null;
        this.rgbCache = null;
        
        // Current color state
        this.state = null;
        
        // Color history for undo support
        this.colorHistory = [];
        this.maxHistorySize = 50;
        
        // Performance optimization
        this.colorLookupCache = new Map();
        this.lastAccessTime = new Map();
        
        // Validation constraints
        this.constraints = {
            minColorIndex: 0,
            maxColorIndex: 7,
            validAttributes: ['ink', 'paper', 'bright', 'flash']
        };
    }

    /**
     * Initialize the module
     * @override
     * @returns {Promise<void>}
     */
    async onInitialize() {
        this.initializeColors();
        this.setupState();
        this.setupEventHandlers();
        
        // Precompute color combinations if caching enabled
        if (this.config.cacheRgbValues) {
            this.precomputeColorCombinations();
        }
    }

    /**
     * Initialize ZX Spectrum color definitions
     * @private
     */
    initializeColors() {
        this.ZX_COLORS = [
            { name: 'Black', normal: '#000000', bright: '#000000', rgb: { r: 0, g: 0, b: 0 } },
            { name: 'Blue', normal: '#0000D7', bright: '#0000FF', rgb: { r: 0, g: 0, b: 215 } },
            { name: 'Red', normal: '#D70000', bright: '#FF0000', rgb: { r: 215, g: 0, b: 0 } },
            { name: 'Magenta', normal: '#D700D7', bright: '#FF00FF', rgb: { r: 215, g: 0, b: 215 } },
            { name: 'Green', normal: '#00D700', bright: '#00FF00', rgb: { r: 0, g: 215, b: 0 } },
            { name: 'Cyan', normal: '#00D7D7', bright: '#00FFFF', rgb: { r: 0, g: 215, b: 215 } },
            { name: 'Yellow', normal: '#D7D700', bright: '#FFFF00', rgb: { r: 215, g: 215, b: 0 } },
            { name: 'White', normal: '#E8E8E8', bright: '#FFFFFF', rgb: { r: 232, g: 232, b: 232 } }
        ];

        // Pre-calculate RGB values for performance
        this.rgbCache = {
            normal: this.ZX_COLORS.map(c => this.hexToRgb(c.normal)),
            bright: this.ZX_COLORS.map(c => this.hexToRgb(c.bright))
        };

        // Add computed properties
        this.ZX_COLORS.forEach((color, index) => {
            color.index = index;
            color.normalRgb = this.rgbCache.normal[index];
            color.brightRgb = this.rgbCache.bright[index];
        });
    }

    /**
     * Setup initial color state
     * @private
     */
    setupState() {
        this.state = {
            ink: this.config.defaultInk,
            paper: this.config.defaultPaper,
            bright: false,
            flash: false,
            inkEnabled: true,
            paperEnabled: true,
            lastModified: Date.now()
        };
        
        // Save initial state to history
        this.saveToHistory();
    }

    /**
     * Setup event handlers
     * @private
     */
    setupEventHandlers() {
        this.registerEventHandler('color:reset', () => this.resetColors());
        this.registerEventHandler('color:swap', () => this.swapInkAndPaper());
        this.registerEventHandler('color:randomize', () => this.randomizeColors());
        this.registerEventHandler('color:undo', () => this.undoColorChange());
    }

    /**
     * Convert hex color to RGB object with validation
     * @param {string} hex - Hex color string
     * @returns {Object} RGB object
     */
    hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') {
            throw new TypeError('Invalid hex color string');
        }
        
        // Remove # if present
        hex = hex.replace('#', '');
        
        if (hex.length !== 6) {
            throw new Error('Hex color must be 6 characters');
        }
        
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            throw new Error('Invalid hex color values');
        }
        
        return { r, g, b };
    }

    /**
     * Convert RGB to hex color
     * @param {Object} rgb - RGB object
     * @returns {string} Hex color string
     */
    rgbToHex(rgb) {
        const toHex = (n) => {
            const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    }

    /**
     * Set ink color with validation and toggle support
     * @param {number} colorIndex - Color index (0-7)
     * @returns {boolean} Success status
     */
    setInk(colorIndex) {
        if (!this.validateColorIndex(colorIndex)) {
            this.handleError(new Error(`Invalid ink color index: ${colorIndex}`));
            return false;
        }
        
        const currentInk = this.state.ink;
        const currentInkEnabled = this.state.inkEnabled;
        const selectedColor = this.ZX_COLORS[colorIndex];
        
        // Toggle enable/disable if same color selected
        if (currentInk === colorIndex && currentInkEnabled) {
            this.state.inkEnabled = false;
            this.emitStatus(`◐ Ink: ${selectedColor.name} - DISABLED (preserving existing)`, 'warning');
        } else if (currentInk === colorIndex && !currentInkEnabled) {
            this.state.inkEnabled = true;
            this.emitStatus(`◐ Ink: ${selectedColor.name} - ENABLED`, 'success');
        } else {
            this.state.ink = colorIndex;
            this.state.inkEnabled = true;
            this.emitStatus(`◐ Ink: ${selectedColor.name}`, 'success');
        }
        
        this.state.lastModified = Date.now();
        this.saveToHistory();
        this.emitColorChange();
        
        return true;
    }

    /**
     * Set paper color with validation and toggle support
     * @param {number} colorIndex - Color index (0-7)
     * @returns {boolean} Success status
     */
    setPaper(colorIndex) {
        if (!this.validateColorIndex(colorIndex)) {
            this.handleError(new Error(`Invalid paper color index: ${colorIndex}`));
            return false;
        }
        
        const currentPaper = this.state.paper;
        const currentPaperEnabled = this.state.paperEnabled;
        const selectedColor = this.ZX_COLORS[colorIndex];
        
        // Toggle enable/disable if same color selected
        if (currentPaper === colorIndex && currentPaperEnabled) {
            this.state.paperEnabled = false;
            this.emitStatus(`◑ Paper: ${selectedColor.name} - DISABLED (preserving existing)`, 'warning');
        } else if (currentPaper === colorIndex && !currentPaperEnabled) {
            this.state.paperEnabled = true;
            this.emitStatus(`◑ Paper: ${selectedColor.name} - ENABLED`, 'success');
        } else {
            this.state.paper = colorIndex;
            this.state.paperEnabled = true;
            this.emitStatus(`◑ Paper: ${selectedColor.name}`, 'success');
        }
        
        this.state.lastModified = Date.now();
        this.saveToHistory();
        this.emitColorChange();
        
        return true;
    }

    /**
     * Toggle bright mode
     * @returns {boolean} New bright state
     */
    toggleBright() {
        if (!this.config.enableBright) {
            this.emitStatus('Bright mode is disabled', 'warning');
            return this.state.bright;
        }
        
        this.state.bright = !this.state.bright;
        this.state.lastModified = Date.now();
        this.saveToHistory();
        this.emitColorChange();
        
        this.emitStatus(this.state.bright ? '☀ Bright ON' : 'Bright OFF', 'success');
        
        return this.state.bright;
    }

    /**
     * Toggle flash mode
     * @returns {boolean} New flash state
     */
    toggleFlash() {
        if (!this.config.enableFlash) {
            this.emitStatus('Flash mode is disabled', 'warning');
            return this.state.flash;
        }
        
        this.state.flash = !this.state.flash;
        this.state.lastModified = Date.now();
        this.saveToHistory();
        this.emitColorChange();
        
        this.emitStatus(this.state.flash ? '⚡ Flash ON' : 'Flash OFF', 'success');
        
        return this.state.flash;
    }

    /**
     * Set bright mode directly
     * @param {boolean} enabled - Bright state
     */
    setBright(enabled) {
        if (!this.config.enableBright) return;
        
        this.state.bright = !!enabled;
        this.state.lastModified = Date.now();
        this.saveToHistory();
        this.emitColorChange();
    }

    /**
     * Set flash mode directly
     * @param {boolean} enabled - Flash state
     */
    setFlash(enabled) {
        if (!this.config.enableFlash) return;
        
        this.state.flash = !!enabled;
        this.state.lastModified = Date.now();
        this.saveToHistory();
        this.emitColorChange();
    }

    /**
     * Swap ink and paper colors
     */
    swapInkAndPaper() {
        const tempInk = this.state.ink;
        const tempInkEnabled = this.state.inkEnabled;
        
        this.state.ink = this.state.paper;
        this.state.inkEnabled = this.state.paperEnabled;
        this.state.paper = tempInk;
        this.state.paperEnabled = tempInkEnabled;
        
        this.state.lastModified = Date.now();
        this.saveToHistory();
        this.emitColorChange();
        
        this.emitStatus('⇄ Swapped Ink and Paper', 'success');
    }

    /**
     * Reset colors to defaults
     */
    resetColors() {
        this.state.ink = this.config.defaultInk;
        this.state.paper = this.config.defaultPaper;
        this.state.bright = false;
        this.state.flash = false;
        this.state.inkEnabled = true;
        this.state.paperEnabled = true;
        this.state.lastModified = Date.now();
        
        this.saveToHistory();
        this.emitColorChange();
        
        this.emitStatus('↺ Colors reset to defaults', 'success');
    }

    /**
     * Randomize colors
     */
    randomizeColors() {
        const randomIndex = () => Math.floor(Math.random() * 8);
        
        let newInk = randomIndex();
        let newPaper = randomIndex();
        
        // Ensure ink and paper are different
        while (newInk === newPaper) {
            newPaper = randomIndex();
        }
        
        this.state.ink = newInk;
        this.state.paper = newPaper;
        this.state.bright = Math.random() > 0.5;
        this.state.inkEnabled = true;
        this.state.paperEnabled = true;
        this.state.lastModified = Date.now();
        
        this.saveToHistory();
        this.emitColorChange();
        
        this.emitStatus('🎲 Random colors applied', 'success');
    }

    /**
     * Get color by index and brightness
     * @param {number} index - Color index
     * @param {boolean} bright - Brightness flag
     * @returns {Object} Color object with hex and RGB values
     */
    getColor(index, bright = false) {
        if (!this.validateColorIndex(index)) {
            return this.ZX_COLORS[0]; // Return black as fallback
        }
        
        const cacheKey = `${index}-${bright}`;
        
        // Check cache first
        if (this.colorLookupCache.has(cacheKey)) {
            this.lastAccessTime.set(cacheKey, Date.now());
            return this.colorLookupCache.get(cacheKey);
        }
        
        const color = this.ZX_COLORS[index];
        const result = {
            name: color.name,
            hex: bright ? color.bright : color.normal,
            rgb: bright ? color.brightRgb : color.normalRgb,
            index: index,
            bright: bright
        };
        
        // Cache the result
        this.colorLookupCache.set(cacheKey, result);
        this.lastAccessTime.set(cacheKey, Date.now());
        
        // Clean cache if too large
        if (this.colorLookupCache.size > 100) {
            this.cleanColorCache();
        }
        
        return result;
    }

    /**
     * Get current ink color
     * @returns {Object} Ink color object
     */
    getInkColor() {
        return this.getColor(this.state.ink, this.state.bright);
    }

    /**
     * Get current paper color
     * @returns {Object} Paper color object
     */
    getPaperColor() {
        return this.getColor(this.state.paper, this.state.bright);
    }

    /**
     * Get complete color state
     * @returns {Object} Color state
     */
    getState() {
        return {
            ...this.state,
            inkColor: this.getInkColor(),
            paperColor: this.getPaperColor()
        };
    }

    /**
     * Set complete color state
     * @param {Object} newState - New color state
     */
    setState(newState) {
        if (newState.ink !== undefined && this.validateColorIndex(newState.ink)) {
            this.state.ink = newState.ink;
        }
        
        if (newState.paper !== undefined && this.validateColorIndex(newState.paper)) {
            this.state.paper = newState.paper;
        }
        
        if (newState.bright !== undefined) {
            this.state.bright = !!newState.bright;
        }
        
        if (newState.flash !== undefined) {
            this.state.flash = !!newState.flash;
        }
        
        if (newState.inkEnabled !== undefined) {
            this.state.inkEnabled = !!newState.inkEnabled;
        }
        
        if (newState.paperEnabled !== undefined) {
            this.state.paperEnabled = !!newState.paperEnabled;
        }
        
        this.state.lastModified = Date.now();
        this.saveToHistory();
        this.emitColorChange();
    }

    /**
     * Validate color index
     * @private
     * @param {number} index - Color index
     * @returns {boolean} Valid status
     */
    validateColorIndex(index) {
        if (!this.config.validateColors) {
            return true;
        }
        
        return Number.isInteger(index) && 
               index >= this.constraints.minColorIndex && 
               index <= this.constraints.maxColorIndex;
    }

    /**
     * Save current state to history
     * @private
     */
    saveToHistory() {
        const historyEntry = {
            ...this.state,
            timestamp: Date.now()
        };
        
        this.colorHistory.push(historyEntry);
        
        // Trim history if too large
        if (this.colorHistory.length > this.maxHistorySize) {
            this.colorHistory.shift();
        }
    }

    /**
     * Undo last color change
     */
    undoColorChange() {
        if (this.colorHistory.length <= 1) {
            this.emitStatus('No color history to undo', 'warning');
            return;
        }
        
        // Remove current state
        this.colorHistory.pop();
        
        // Restore previous state
        const previousState = this.colorHistory[this.colorHistory.length - 1];
        this.state = { ...previousState };
        
        this.emitColorChange();
        this.emitStatus('↶ Color change undone', 'success');
    }

    /**
     * Precompute common color combinations
     * @private
     */
    precomputeColorCombinations() {
        // Precompute all basic color combinations
        for (let i = 0; i < 8; i++) {
            this.getColor(i, false);
            this.getColor(i, true);
        }
    }

    /**
     * Clean color cache based on LRU
     * @private
     */
    cleanColorCache() {
        const now = Date.now();
        const maxAge = 60000; // 1 minute
        
        const entriesToDelete = [];
        
        for (const [key, time] of this.lastAccessTime) {
            if (now - time > maxAge) {
                entriesToDelete.push(key);
            }
        }
        
        for (const key of entriesToDelete) {
            this.colorLookupCache.delete(key);
            this.lastAccessTime.delete(key);
        }
    }

    /**
     * Emit color change event
     * @private
     */
    emitColorChange() {
        if (this.eventBus) {
            this.eventBus.emit('color-changed', this.getState());
        }
    }

    /**
     * Emit status message
     * @private
     * @param {string} message - Status message
     * @param {string} type - Message type
     */
    emitStatus(message, type = 'info') {
        if (this.eventBus) {
            this.eventBus.emit('status', { message, type });
        }
    }

    /**
     * Get all color definitions
     * @returns {Array} ZX Spectrum color definitions
     */
    getColorDefinitions() {
        return [...this.ZX_COLORS];
    }

    /**
     * Get color palette for UI
     * @returns {Object} Color palette
     */
    getColorPalette() {
        return {
            colors: this.ZX_COLORS.map(c => ({
                index: c.index,
                name: c.name,
                normal: c.normal,
                bright: c.bright
            })),
            currentInk: this.state.ink,
            currentPaper: this.state.paper,
            bright: this.state.bright,
            flash: this.state.flash
        };
    }

    /**
     * Convert attribute to CSS color
     * @param {Object} attribute - Attribute object
     * @param {boolean} useInk - Use ink color (true) or paper (false)
     * @returns {string} CSS color value
     */
    attributeToCSS(attribute, useInk = true) {
        const colorIndex = useInk ? attribute.ink : attribute.paper;
        const bright = attribute.bright || false;
        const color = this.getColor(colorIndex, bright);
        return color.hex;
    }

    /**
     * Get module API
     * @override
     * @returns {Object} Module API
     */
    getAPI() {
        return {
            // Color selection
            setInk: (index) => this.setInk(index),
            setPaper: (index) => this.setPaper(index),
            toggleBright: () => this.toggleBright(),
            toggleFlash: () => this.toggleFlash(),
            setBright: (enabled) => this.setBright(enabled),
            setFlash: (enabled) => this.setFlash(enabled),
            
            // Color operations
            swapInkAndPaper: () => this.swapInkAndPaper(),
            resetColors: () => this.resetColors(),
            randomizeColors: () => this.randomizeColors(),
            undoColorChange: () => this.undoColorChange(),
            
            // Color queries
            getColor: (index, bright) => this.getColor(index, bright),
            getInkColor: () => this.getInkColor(),
            getPaperColor: () => this.getPaperColor(),
            getState: () => this.getState(),
            setState: (state) => this.setState(state),
            
            // Utilities
            getColorDefinitions: () => this.getColorDefinitions(),
            getColorPalette: () => this.getColorPalette(),
            attributeToCSS: (attr, useInk) => this.attributeToCSS(attr, useInk),
            hexToRgb: (hex) => this.hexToRgb(hex),
            rgbToHex: (rgb) => this.rgbToHex(rgb)
        };
    }

    /**
     * Get event handlers
     * @override
     * @returns {Object} Event handlers
     */
    getEventHandlers() {
        return {
            'color:set-ink': (data) => this.setInk(data.index),
            'color:set-paper': (data) => this.setPaper(data.index),
            'color:toggle-bright': () => this.toggleBright(),
            'color:toggle-flash': () => this.toggleFlash(),
            'color:swap': () => this.swapInkAndPaper(),
            'color:reset': () => this.resetColors(),
            'color:randomize': () => this.randomizeColors(),
            'color:undo': () => this.undoColorChange()
        };
    }

    /**
     * Perform health check
     * @override
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        const baseHealth = await super.healthCheck();
        
        return {
            ...baseHealth,
            colorCacheSize: this.colorLookupCache.size,
            historySize: this.colorHistory.length,
            currentColors: {
                ink: this.state.ink,
                paper: this.state.paper,
                bright: this.state.bright,
                flash: this.state.flash
            }
        };
    }

    /**
     * Dispose of the module
     * @override
     * @returns {Promise<void>}
     */
    async onDispose() {
        // Clear caches
        this.colorLookupCache.clear();
        this.lastAccessTime.clear();
        
        // Clear history
        this.colorHistory = [];
        
        // Clear state
        this.state = null;
        this.ZX_COLORS = null;
        this.rgbCache = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorManagerModule;
} else if (typeof window !== 'undefined') {
    window.ColorManagerModule = ColorManagerModule;
}