/**
 * CanvasService.js - Canvas management service for ZX Pixel Smoosher
 * Wraps ZXSpectrumPixelSmasher canvas functionality in modular architecture
 * @module CanvasService
 */

class CanvasService extends BaseModule {
    constructor(platform, config = {}) {
        super('canvasService', '1.0.0', ['eventBus']);
        
        this.platform = platform;
        this.moduleInfo = {
            name: 'CanvasService',
            version: '1.0.0',
            description: 'Canvas management and rendering service'
        };
        
        this.zxApp = null;
        this.canvasInitialized = false;
        this.deferredMethods = [];
        
        this.config = {
            enableDeferredExecution: true,
            maxDeferredCalls: 100,
            canvasSelector: 'canvas',
            previewCanvasSelector: 'preview-canvas',
            ...config
        };
    }

    /**
     * Initialize the canvas service
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            await super.initialize();
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve, { once: true });
                });
            }
            
            // Initialize ZXSpectrumPixelSmasher instance
            await this.initializeZXApp();
            
            // Register service methods
            this.registerServiceMethods();
            
            console.log(`[${this.name}] Canvas service initialized successfully`);
            
        } catch (error) {
            this.handleError(new Error(`Failed to initialize canvas service: ${error.message}`), { phase: 'initialization', originalError: error });
            throw error;
        }
    }

    /**
     * Initialize ZXSpectrumPixelSmasher application
     * @private
     */
    async initializeZXApp() {
        if (typeof ZXSpectrumPixelSmasher === 'undefined') {
            throw new Error('ZXSpectrumPixelSmasher class not available - ensure script is loaded');
        }

        try {
            // Create ZXSpectrumPixelSmasher instance
            this.zxApp = new ZXSpectrumPixelSmasher();
            
            // Verify canvas initialization
            if (!this.zxApp.canvasService || !this.zxApp.canvasService.canvasInitialized) {
                console.warn(`[${this.name}] Canvas not initialized in ZXSpectrumPixelSmasher, retrying...`);
                
                // Retry canvas setup if needed
                if (this.zxApp.canvasService && this.zxApp.canvasService.ensureCanvasInitialized) {
                    this.zxApp.canvasService.ensureCanvasInitialized();
                }
            }
            
            this.canvasInitialized = this.zxApp.canvasService?.canvasInitialized || false;
            
            if (!this.canvasInitialized) {
                throw new Error('Failed to initialize canvas elements');
            }
            
            // Execute deferred method calls
            this.executeDeferredMethods();
            
            console.log(`[${this.name}] ZXSpectrumPixelSmasher initialized with canvas support`);
            
        } catch (error) {
            this.handleError(new Error(`Failed to initialize ZXSpectrumPixelSmasher: ${error.message}`), { phase: 'zxAppInit', originalError: error });
            throw error;
        }
    }

    /**
     * Register service methods for external access
     * @private
     */
    registerServiceMethods() {
        // Canvas drawing methods
        this.api = {
            // Drawing operations
            drawPixel: (x, y, value, state) => this.drawPixel(x, y, value, state),
            floodFill: (data) => this.floodFill(data),
            drawLine: (x1, y1, x2, y2, options) => this.drawLine(x1, y1, x2, y2, options),
            drawShape: (shapeData) => this.drawShape(shapeData),
            
            // Canvas management
            clearCanvas: () => this.clearCanvas(),
            getCanvas: () => this.getCanvas(),
            getPreviewCanvas: () => this.getPreviewCanvas(),
            getCanvasContext: () => this.getCanvasContext(),
            
            // Rendering
            render: () => this.render(),
            scheduleRender: () => this.scheduleRender(),
            
            // State management
            getState: () => this.getState(),
            setState: (state) => this.setState(state),
            
            // Canvas properties
            isCanvasInitialized: () => this.canvasInitialized,
            getCanvasSize: () => ({ width: 256, height: 192 }),
            
            // ZX Spectrum specific
            setZoom: (zoom) => this.setZoom(zoom),
            toggleGrid: (type) => this.toggleGrid(type),
            
            // File operations
            loadFile: (file) => this.loadFile(file),
            saveFile: (format) => this.saveFile(format),
            exportAs: (format, options) => this.exportAs(format, options)
        };
    }

    /**
     * Execute deferred method calls
     * @private
     */
    executeDeferredMethods() {
        if (!this.config.enableDeferredExecution || !this.deferredMethods.length) {
            return;
        }
        
        console.log(`[${this.name}] Executing ${this.deferredMethods.length} deferred method calls`);
        
        for (const deferredCall of this.deferredMethods) {
            try {
                const result = this[deferredCall.method](...deferredCall.args);
                if (deferredCall.resolve) {
                    deferredCall.resolve(result);
                }
            } catch (error) {
                this.handleError(new Error(`Error executing deferred method ${deferredCall.method}: ${error.message}`), { phase: 'deferredExecution', method: deferredCall.method, originalError: error });
                if (deferredCall.reject) {
                    deferredCall.reject(error);
                }
            }
        }
        
        this.deferredMethods = [];
    }

    /**
     * Defer method call until canvas is initialized
     * @private
     */
    deferMethodCall(method, args) {
        return new Promise((resolve, reject) => {
            if (this.deferredMethods.length >= this.config.maxDeferredCalls) {
                reject(new Error('Too many deferred method calls'));
                return;
            }
            
            this.deferredMethods.push({
                method,
                args,
                resolve,
                reject,
                timestamp: Date.now()
            });
        });
    }

    /**
     * Draw a pixel on the canvas
     */
    drawPixel(x, y, value, state) {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('drawPixel', [x, y, value, state]);
        }
        
        if (!this.zxApp || !this.zxApp.drawPixel) {
            throw new Error('ZX app not available for drawPixel operation');
        }
        
        return this.zxApp.drawPixel(x, y, value, state);
    }

    /**
     * Perform flood fill operation
     */
    floodFill(data) {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('floodFill', [data]);
        }
        
        if (!this.zxApp || !this.zxApp.floodFill) {
            throw new Error('ZX app not available for floodFill operation');
        }
        
        return this.zxApp.floodFill(data);
    }

    /**
     * Draw a line on the canvas
     */
    drawLine(x1, y1, x2, y2, options = {}) {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('drawLine', [x1, y1, x2, y2, options]);
        }
        
        if (!this.zxApp || !this.zxApp.drawLine) {
            throw new Error('ZX app not available for drawLine operation');
        }
        
        return this.zxApp.drawLine(x1, y1, x2, y2, options);
    }

    /**
     * Draw a shape on the canvas
     */
    drawShape(shapeData) {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('drawShape', [shapeData]);
        }
        
        if (!this.zxApp || !this.zxApp.drawShape) {
            throw new Error('ZX app not available for drawShape operation');
        }
        
        return this.zxApp.drawShape(shapeData);
    }

    /**
     * Clear the canvas
     */
    clearCanvas() {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('clearCanvas', []);
        }
        
        if (!this.zxApp || !this.zxApp.clearCanvas) {
            throw new Error('ZX app not available for clearCanvas operation');
        }
        
        return this.zxApp.clearCanvas();
    }

    /**
     * Get canvas element
     */
    getCanvas() {
        if (!this.canvasInitialized) {
            return document.getElementById(this.config.canvasSelector);
        }
        
        return this.zxApp?.canvasService?.canvas || document.getElementById(this.config.canvasSelector);
    }

    /**
     * Get preview canvas element
     */
    getPreviewCanvas() {
        if (!this.canvasInitialized) {
            return document.getElementById(this.config.previewCanvasSelector);
        }
        
        return this.zxApp?.canvasService?.previewCanvas || document.getElementById(this.config.previewCanvasSelector);
    }

    /**
     * Get canvas rendering context
     */
    getCanvasContext() {
        const canvas = this.getCanvas();
        return canvas ? canvas.getContext('2d') : null;
    }

    /**
     * Render the canvas
     */
    render() {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('render', []);
        }
        
        if (this.zxApp && this.zxApp.canvasService && this.zxApp.canvasService.render) {
            return this.zxApp.canvasService.render();
        }
        
        console.warn(`[${this.name}] Render method not available in ZX app`);
    }

    /**
     * Schedule a render
     */
    scheduleRender() {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('scheduleRender', []);
        }
        
        if (this.zxApp && this.zxApp.canvasService && this.zxApp.canvasService.scheduleRender) {
            return this.zxApp.canvasService.scheduleRender();
        }
        
        console.warn(`[${this.name}] ScheduleRender method not available in ZX app`);
    }

    /**
     * Get current state
     */
    getState() {
        if (!this.canvasInitialized) {
            return null;
        }
        
        if (this.zxApp && this.zxApp.getState) {
            return this.zxApp.getState();
        }
        
        return null;
    }

    /**
     * Set state
     */
    setState(state) {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('setState', [state]);
        }
        
        if (this.zxApp && this.zxApp.setState) {
            return this.zxApp.setState(state);
        }
        
        console.warn(`[${this.name}] setState method not available in ZX app`);
    }

    /**
     * Set zoom level
     */
    setZoom(zoom) {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('setZoom', [zoom]);
        }
        
        if (this.zxApp && this.zxApp.setZoom) {
            return this.zxApp.setZoom(zoom);
        }
        
        console.warn(`[${this.name}] setZoom method not available in ZX app`);
    }

    /**
     * Toggle grid display
     */
    toggleGrid(type) {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('toggleGrid', [type]);
        }
        
        if (this.zxApp && this.zxApp.toggleGrid) {
            return this.zxApp.toggleGrid(type);
        }
        
        console.warn(`[${this.name}] toggleGrid method not available in ZX app`);
    }

    /**
     * Load a file
     */
    loadFile(file) {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('loadFile', [file]);
        }
        
        if (this.zxApp && this.zxApp.loadFile) {
            return this.zxApp.loadFile(file);
        }
        
        throw new Error('loadFile method not available in ZX app');
    }

    /**
     * Save file
     */
    saveFile(format) {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('saveFile', [format]);
        }
        
        if (this.zxApp && this.zxApp.saveFile) {
            return this.zxApp.saveFile(format);
        }
        
        throw new Error('saveFile method not available in ZX app');
    }

    /**
     * Export as specific format
     */
    exportAs(format, options = {}) {
        if (!this.canvasInitialized) {
            return this.deferMethodCall('exportAs', [format, options]);
        }
        
        if (this.zxApp && this.zxApp.exportAs) {
            return this.zxApp.exportAs(format, options);
        }
        
        throw new Error('exportAs method not available in ZX app');
    }

    /**
     * Get service API
     * @returns {Object} Service API methods
     */
    getAPI() {
        return this.api;
    }

    /**
     * Get ZXSpectrumPixelSmasher instance
     * @returns {Object} ZX app instance
     */
    getZXApp() {
        return this.zxApp;
    }

    /**
     * Perform health check
     * @returns {Object} Health check results
     */
    async healthCheck() {
        const health = await super.healthCheck();
        
        return {
            ...health,
            canvas: {
                initialized: this.canvasInitialized,
                zxAppAvailable: !!this.zxApp,
                canvasElement: !!this.getCanvas(),
                previewCanvasElement: !!this.getPreviewCanvas(),
                deferredMethods: this.deferredMethods.length
            }
        };
    }

    /**
     * Dispose of the service
     */
    async dispose() {
        try {
            // Clear deferred methods
            this.deferredMethods = [];
            
            // Dispose ZX app if available
            if (this.zxApp && typeof this.zxApp.dispose === 'function') {
                await this.zxApp.dispose();
            }
            
            this.zxApp = null;
            this.canvasInitialized = false;
            this.api = null;
            
            await super.dispose();
            
        } catch (error) {
            this.handleError(new Error(`Error disposing canvas service: ${error.message}`), { phase: 'disposal', originalError: error });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasService;
} else if (typeof window !== 'undefined') {
    window.CanvasService = CanvasService;
}