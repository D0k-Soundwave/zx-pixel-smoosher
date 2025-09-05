(function() {
    'use strict';

    // Performance optimization: Reduce console logging to essential errors only
    const DEBUG_MODE = false; // Set to true only for development
    const log = DEBUG_MODE ? console.log : () => {};
    const warn = console.warn; // Keep warnings
    const error = console.error; // Keep errors

    /**
     * ZX Spectrum color management service
     * @class ColorManager
     */
    class ColorManager {
        constructor(eventBus) {
            this.eventBus = eventBus;
            this.initializeColors();
            this.setupState();
        }

        initializeColors() {
            this.ZX_COLORS = [
                { name: 'Black', normal: '#000000', bright: '#000000' },
                { name: 'Blue', normal: '#0000D7', bright: '#0000FF' },
                { name: 'Red', normal: '#D70000', bright: '#FF0000' },
                { name: 'Magenta', normal: '#D700D7', bright: '#FF00FF' },
                { name: 'Green', normal: '#00D700', bright: '#00FF00' },
                { name: 'Cyan', normal: '#00D7D7', bright: '#00FFFF' },
                { name: 'Yellow', normal: '#D7D700', bright: '#FFFF00' },
                { name: 'White', normal: '#E8E8E8', bright: '#FFFFFF' }
            ];

            this.rgbCache = {
                normal: this.ZX_COLORS.map(c => this.hexToRgb(c.normal)),
                bright: this.ZX_COLORS.map(c => this.hexToRgb(c.bright))
            };
        }

        setupState() {
            this.state = {
                ink: 0,
                paper: 7,
                bright: false,
                flash: false,
                inkEnabled: true,
                paperEnabled: true
            };
        }

        hexToRgb(hex) {
            return {
                r: parseInt(hex.slice(1, 3), 16),
                g: parseInt(hex.slice(3, 5), 16),
                b: parseInt(hex.slice(5, 7), 16)
            };
        }

        setInk(colorIndex) {
            // Bounds check for color index
            if (colorIndex < 0 || colorIndex >= this.ZX_COLORS.length) {
                warn('Invalid color index for ink:', colorIndex);
                return;
            }

            const currentInk = this.state.ink;
            const currentInkEnabled = this.state.inkEnabled;
            const selectedColorName = this.ZX_COLORS[colorIndex].name;

            if (currentInk === colorIndex && currentInkEnabled) {
                this.state.inkEnabled = false;
                this.eventBus.emit('status', { 
                    message: `◐ Ink: ${selectedColorName} - DISABLED (preserving existing)`, 
                    type: 'warning' 
                });
            } else if (currentInk === colorIndex && !currentInkEnabled) {
                this.state.inkEnabled = true;
                this.eventBus.emit('status', { 
                    message: `◐ Ink: ${selectedColorName} - ENABLED`, 
                    type: 'success' 
                });
            } else {
                this.state.ink = colorIndex;
                this.state.inkEnabled = true;
                this.eventBus.emit('status', { 
                    message: `◐ Ink: ${selectedColorName}`, 
                    type: 'success' 
                });
            }

            this.eventBus.emit('color-changed', this.state);
        }

        setPaper(colorIndex) {
            // Bounds check for color index
            if (colorIndex < 0 || colorIndex >= this.ZX_COLORS.length) {
                warn('Invalid color index for paper:', colorIndex);
                return;
            }

            const currentPaper = this.state.paper;
            const currentPaperEnabled = this.state.paperEnabled;
            const selectedColorName = this.ZX_COLORS[colorIndex].name;

            if (currentPaper === colorIndex && currentPaperEnabled) {
                this.state.paperEnabled = false;
                this.eventBus.emit('status', { 
                    message: `◑ Paper: ${selectedColorName} - DISABLED (preserving existing)`, 
                    type: 'warning' 
                });
            } else if (currentPaper === colorIndex && !currentPaperEnabled) {
                this.state.paperEnabled = true;
                this.eventBus.emit('status', { 
                    message: `◑ Paper: ${selectedColorName} - ENABLED`, 
                    type: 'success' 
                });
            } else {
                this.state.paper = colorIndex;
                this.state.paperEnabled = true;
                this.eventBus.emit('status', { 
                    message: `◑ Paper: ${selectedColorName}`, 
                    type: 'success' 
                });
            }

            this.eventBus.emit('color-changed', this.state);
        }

        toggleBright() {
            this.state.bright = !this.state.bright;
            this.eventBus.emit('color-changed', this.state);
            this.eventBus.emit('status', { 
                message: this.state.bright ? '☀ Bright ON' : 'Bright OFF', 
                type: 'success' 
            });
        }

        toggleFlash() {
            this.state.flash = !this.state.flash;
            this.eventBus.emit('color-changed', this.state);
            this.eventBus.emit('status', { 
                message: this.state.flash ? '∿ Flash ON' : 'Flash OFF', 
                type: 'success' 
            });
        }

        getState() {
            return { ...this.state };
        }

        getRgbCache() {
            return this.state.bright ? this.rgbCache.bright : this.rgbCache.normal;
        }

        getAllRgbCache() {
            return this.rgbCache;
        }

        getColorHex(index, bright = null) {
            // Bounds check
            if (index < 0 || index >= this.ZX_COLORS.length) {
                warn('Invalid color index:', index);
                return '#000000'; // Default to black
            }
            const useBright = bright !== null ? bright : this.state.bright;
            return this.ZX_COLORS[index][useBright ? 'bright' : 'normal'];
        }

        reset() {
            this.setupState();
            this.eventBus.emit('color-changed', this.state);
        }
    }

    /**
     * Canvas rendering service - FIXED VERSION
     * @class CanvasService
     */
    class CanvasService {
        constructor(eventBus, colorManager) {
            this.eventBus = eventBus;
            this.colorManager = colorManager;
            this.canvasInitialized = false;
            this.initializeConstants();
            this.setupCanvases();
            this.setupFlashAnimation();
        }

        ensureCanvasInitialized() {
            if (!this.canvasInitialized) {
                log('Retrying canvas initialization');
                this.setupCanvases();
            }
            return this.canvasInitialized;
        }

        initializeConstants() {
            this.SCREEN = {
                WIDTH: 256,
                HEIGHT: 192,
                CHAR_WIDTH: 32,
                CHAR_HEIGHT: 24,
                CELL_SIZE: 8
            };
        }

        setupCanvases() {
            try {
                this.canvas = document.getElementById('canvas');
                this.previewCanvas = document.getElementById('preview-canvas');
                
                if (!this.canvas || !this.previewCanvas) {
                    warn('Canvas elements not found, deferring initialization');
                    this.canvasInitialized = false;
                    return;
                }
                
                this.ctx = this.canvas.getContext('2d');
                this.previewCtx = this.previewCanvas.getContext('2d');

                if (!this.ctx || !this.previewCtx) {
                    throw new Error('Canvas contexts not available');
                }

                this.ctx.globalAlpha = 1.0;
                this.previewCtx.globalAlpha = 1.0;
                
                this.ctx.imageSmoothingEnabled = false;
                this.ctx.webkitImageSmoothingEnabled = false;
                this.ctx.mozImageSmoothingEnabled = false;
                this.ctx.msImageSmoothingEnabled = false;

                this.setupPreviewCanvas();
                this.renderScheduled = false;
                this.canvasInitialized = true;
                log('Canvas initialized successfully');
            } catch (error) {
                error('Error setting up canvases:', error);
                this.canvasInitialized = false;
            }
        }

        setupPreviewCanvas() {
            this.previewCanvas.style.imageRendering = 'pixelated';
            this.previewCanvas.style.imageRendering = '-moz-crisp-edges';
            this.previewCanvas.style.imageRendering = 'crisp-edges';
            this.previewCanvas.style.opacity = '1.0';
            
            this.previewCtx.imageSmoothingEnabled = false;
            this.previewCtx.webkitImageSmoothingEnabled = false;
            this.previewCtx.mozImageSmoothingEnabled = false;
            this.previewCtx.msImageSmoothingEnabled = false;
        }

        setupFlashAnimation() {
            this.flashPhase = false;
            this.flashInterval = setInterval(() => {
                this.flashPhase = !this.flashPhase;
                this.scheduleRender();
            }, 500);
        }

        scheduleRender() {
            if (this.renderScheduled) return;
            this.renderScheduled = true;
            
            requestAnimationFrame(() => {
                this.renderScheduled = false;
                this.render();
            });
        }

        render(pixelData, attributeData) {
            if (!this.ensureCanvasInitialized()) {
                warn('Cannot render - canvas not initialized');
                return;
            }

            try {
                const imageData = this.ctx.createImageData(this.SCREEN.WIDTH, this.SCREEN.HEIGHT);
                const data = imageData.data;
                
                if (!pixelData || !attributeData) {
                    this.renderBlackScreen(data);
                } else {
                    this.renderScreen(data, pixelData, attributeData);
                }
                
                this.ctx.putImageData(imageData, 0, 0);
            } catch (error) {
                error('Render error:', error);
            }
        }

        renderBlackScreen(data) {
            data.fill(0);
            for (let i = 3; i < data.length; i += 4) {
                data[i] = 255; // Alpha
            }
        }

        renderScreen(data, pixelData, attributeData) {
            const rgbCache = this.colorManager.getAllRgbCache();
            
            for (let y = 0; y < this.SCREEN.HEIGHT; y++) {
                for (let x = 0; x < this.SCREEN.WIDTH; x++) {
                    const pixelIndex = (y * this.SCREEN.WIDTH + x) * 4;
                    const cellX = Math.floor(x / this.SCREEN.CELL_SIZE);
                    const cellY = Math.floor(y / this.SCREEN.CELL_SIZE);
                    
                    // Bounds check for attribute data
                    if (cellY < 0 || cellY >= this.SCREEN.CHAR_HEIGHT || 
                        cellX < 0 || cellX >= this.SCREEN.CHAR_WIDTH) {
                        // Fill with black if out of bounds
                        data[pixelIndex] = 0;
                        data[pixelIndex + 1] = 0;
                        data[pixelIndex + 2] = 0;
                        data[pixelIndex + 3] = 255;
                        continue;
                    }
                    
                    const attr = attributeData[cellY][cellX];
                    const pixel = pixelData[y][x];
                    
                    let colorIndex, isFlashActive;
                    
                    if (attr.flash && this.flashPhase) {
                        colorIndex = pixel ? attr.paper : attr.ink;
                    } else {
                        colorIndex = pixel ? attr.ink : attr.paper;
                    }
                    
                    // Bounds check for color index
                    if (colorIndex < 0 || colorIndex >= 8) {
                        colorIndex = 0; // Default to black
                    }
                    
                    const colorData = attr.bright ? rgbCache.bright[colorIndex] : rgbCache.normal[colorIndex];
                    
                    data[pixelIndex] = colorData.r;
                    data[pixelIndex + 1] = colorData.g;
                    data[pixelIndex + 2] = colorData.b;
                    data[pixelIndex + 3] = 255;
                }
            }
        }

        // Rest of the rendering methods with minimal logging...
        
        clearPreview() {
            if (!this.ensureCanvasInitialized()) {
                warn('Preview context not available for clearing');
                return;
            }
            
            try {
                this.previewCtx.clearRect(0, 0, this.SCREEN.WIDTH, this.SCREEN.HEIGHT);
            } catch (error) {
                error('Error clearing preview canvas:', error);
            }
        }

        renderPreview(state) {
            if (!this.previewCtx) return;
            this.clearPreview();
            this.render.call({ ctx: this.previewCtx, ensureCanvasInitialized: () => true }, state.pixels, state.attributes);
        }

        destroy() {
            if (this.flashInterval) {
                clearInterval(this.flashInterval);
                this.flashInterval = null;
            }
        }
    }

    // Continue with rest of classes but with reduced logging and fixed issues...

}());