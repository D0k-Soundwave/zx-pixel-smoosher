(function() {
    'use strict';

    // Use external EventBus and ErrorHandler classes
    // These are loaded from separate modules in core/

    // Performance optimization: Reduce console logging to essential errors only
    const DEBUG_MODE = false; // Set to true only for development
    // Workflows test: This comment triggers GitHub Actions
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

        /**
         * Initialize ZX Spectrum color definitions
         */
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

        /**
         * Setup color state
         */
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

        /**
         * Convert hex color to RGB object
         * @param {string} hex - Hex color string
         * @returns {Object} RGB object
         */
        hexToRgb(hex) {
            return {
                r: parseInt(hex.slice(1, 3), 16),
                g: parseInt(hex.slice(3, 5), 16),
                b: parseInt(hex.slice(5, 7), 16)
            };
        }

        /**
         * Set ink color
         * @param {number} colorIndex - Color index
         */
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

        /**
         * Set paper color
         * @param {number} colorIndex - Color index
         */
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

        /**
         * Toggle bright mode
         */
        toggleBright() {
            this.state.bright = !this.state.bright;
            this.eventBus.emit('color-changed', this.state);
            this.eventBus.emit('status', { 
                message: this.state.bright ? '☀ Bright ON' : 'Bright OFF', 
                type: 'success' 
            });
        }

        /**
         * Toggle flash mode
         */
        toggleFlash() {
            this.state.flash = !this.state.flash;
            this.eventBus.emit('color-changed', this.state);
            this.eventBus.emit('status', { 
                message: this.state.flash ? '∿ Flash ON' : 'Flash OFF', 
                type: 'success' 
            });
        }

        /**
         * Get current color state
         * @returns {Object} Color state
         */
        getState() {
            return { ...this.state };
        }

        /**
         * Get RGB cache for current brightness
         * @returns {Array} RGB cache array
         */
        getRgbCache() {
            return this.state.bright ? this.rgbCache.bright : this.rgbCache.normal;
        }

        /**
         * Get RGB cache for both brightness levels
         * @returns {Object} RGB cache object with normal and bright arrays
         */
        getAllRgbCache() {
            return this.rgbCache;
        }

        /**
         * Get color by index and brightness
         * @param {number} index - Color index
         * @param {boolean} bright - Brightness flag
         * @returns {string} Color hex string
         */
        getColorHex(index, bright = null) {
            // Bounds check
            if (index < 0 || index >= this.ZX_COLORS.length) {
                warn('Invalid color index:', index);
                return '#000000'; // Default to black
            }
            const useBright = bright !== null ? bright : this.state.bright;
            return this.ZX_COLORS[index][useBright ? 'bright' : 'normal'];
        }

        /**
         * Reset colors to default
         */
        reset() {
            this.setupState();
            this.eventBus.emit('color-changed', this.state);
        }
    }

    /**
     * Canvas rendering service
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

        /**
         * Ensure canvas is initialized
         */
        ensureCanvasInitialized() {
            if (!this.canvasInitialized) {
                log('Retrying canvas initialization');
                this.setupCanvases();
            }
            return this.canvasInitialized;
        }

        /**
         * Initialize screen constants
         */
        initializeConstants() {
            this.SCREEN = {
                WIDTH: 256,
                HEIGHT: 192,
                CHAR_WIDTH: 32,
                CHAR_HEIGHT: 24,
                CELL_SIZE: 8
            };
        }

        /**
         * Setup canvas elements
         */
        setupCanvases() {
            try {
                this.canvas = document.getElementById('canvas');
                this.previewCanvas = document.getElementById('preview-canvas');
                
                if (!this.canvas || !this.previewCanvas) {
                    throw new Error('Required canvas elements not found in DOM');
                }
                
                this.ctx = this.canvas.getContext('2d');
                this.previewCtx = this.previewCanvas.getContext('2d');

                if (!this.ctx || !this.previewCtx) {
                    throw new Error('Canvas contexts not available');
                }

                // Ensure ink and paper opacity are always 100%
                this.ctx.globalAlpha = 1.0;
                this.previewCtx.globalAlpha = 1.0;
                
                // Set main canvas rendering properties for crisp pixels
                this.ctx.imageSmoothingEnabled = false;
                this.ctx.webkitImageSmoothingEnabled = false;
                this.ctx.mozImageSmoothingEnabled = false;
                this.ctx.msImageSmoothingEnabled = false;

                this.setupPreviewCanvas();
                this.renderScheduled = false;
                this.canvasInitialized = true;
                log('Canvas initialized successfully');
            } catch (err) {
                error('Error setting up canvases:', err);
                this.canvasInitialized = false;
            }
        }

        /**
         * Setup preview canvas properties
         */
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

        /**
         * Setup flash animation
         */
        setupFlashAnimation() {
            this.flashPhase = false;
            this.flashInterval = setInterval(() => {
                this.flashPhase = !this.flashPhase;
                this.eventBus.emit('flash-phase-changed', this.flashPhase);
            }, 333);
            
            // Register timer for cleanup
            if (this.eventBus && this.eventBus.emit) {
                this.eventBus.emit('register-timer', this.flashInterval);
            }
        }
        
        /**
         * Cleanup flash animation
         */
        destroyFlashAnimation() {
            if (this.flashInterval) {
                clearInterval(this.flashInterval);
                this.flashInterval = null;
            }
        }

        /**
         * Schedule a render operation
         */
        scheduleRender() {
            if (!this.renderScheduled) {
                this.renderScheduled = true;
                requestAnimationFrame(() => {
                    this.eventBus.emit('render-requested');
                    this.renderScheduled = false;
                });
            }
        }

        /**
         * Render the main canvas
         * @param {Array} pixels - Pixel data
         * @param {Array} attributes - Attribute data
         */
        render(pixels, attributes) {
            if (!this.ensureCanvasInitialized()) {
                warn('Cannot render - canvas not initialized');
                return;
            }
            if (!this.ctx) return;

            // Ensure ink and paper opacity are always 100%
            this.ctx.globalAlpha = 1.0;

            const imageData = this.ctx.createImageData(this.SCREEN.WIDTH, this.SCREEN.HEIGHT);
            const data = imageData.data;
            const colorCaches = this.colorManager.getAllRgbCache();

            this.renderPixels(data, pixels, attributes, colorCaches);
            this.ctx.putImageData(imageData, 0, 0);
        }

        /**
         * Render pixels to image data
         * @param {Uint8ClampedArray} data - Image data
         * @param {Array} pixels - Pixel data
         * @param {Array} attributes - Attribute data
         * @param {Array} colorCache - Color cache
         */
        renderPixels(data, pixels, attributes, colorCaches) {
            let dataIdx = 0;
            
            for (let y = 0; y < this.SCREEN.HEIGHT; y++) {
                const cellY = Math.floor(y / this.SCREEN.CELL_SIZE);
                if (cellY >= this.SCREEN.CHAR_HEIGHT) continue;

                for (let x = 0; x < this.SCREEN.WIDTH; x++) {
                    const cellX = Math.floor(x / this.SCREEN.CELL_SIZE);
                    if (cellX >= this.SCREEN.CHAR_WIDTH) continue;

                    const attr = attributes[cellY][cellX];
                    const pixVal = pixels[y][x];
                    
                    let ink = attr.ink;
                    let paper = attr.paper;
                    
                    if (attr.flash && this.flashPhase) {
                        [ink, paper] = [paper, ink];
                    }

                    let colIdx = pixVal ? ink : paper;
                    // Bounds check for color index
                    if (colIdx < 0 || colIdx >= 8) {
                        colIdx = 0; // Default to black
                    }
                    
                    const colorCache = attr.bright ? colorCaches.bright : colorCaches.normal;
                    const col = colorCache[colIdx];
                    
                    data[dataIdx++] = col.r;
                    data[dataIdx++] = col.g;
                    data[dataIdx++] = col.b;
                    data[dataIdx++] = 255;
                }
            }
        }

        /**
         * Render preview overlay
         * @param {Array} previewPixels - Preview pixel data
         * @param {Array} previewAttrs - Preview attribute data
         * @param {Array} originalPixels - Original pixel data
         * @param {Array} originalAttrs - Original attribute data
         */
        renderPreview(previewPixels, previewAttrs, originalPixels, originalAttrs, isEraseMode = false) {
            // Skip debug logging in production
            
            // Ensure ink and paper opacity are always 100%
            this.previewCtx.globalAlpha = 1.0;
            
            this.previewCtx.clearRect(0, 0, this.SCREEN.WIDTH, this.SCREEN.HEIGHT);
            
            const imageData = this.previewCtx.createImageData(this.SCREEN.WIDTH, this.SCREEN.HEIGHT);
            const data = imageData.data;
            const colorCache = {
                normal: this.colorManager.ZX_COLORS.map(c => this.colorManager.hexToRgb(c.normal)),
                bright: this.colorManager.ZX_COLORS.map(c => this.colorManager.hexToRgb(c.bright))
            };

            let dataIdx = 0;
            
            for (let y = 0; y < this.SCREEN.HEIGHT; y++) {
                for (let x = 0; x < this.SCREEN.WIDTH; x++) {
                    const cellX = Math.floor(x / this.SCREEN.CELL_SIZE);
                    const cellY = Math.floor(y / this.SCREEN.CELL_SIZE);
                    
                    const pixelChanged = previewPixels[y][x] !== originalPixels[y][x];
                    const attrChanged = JSON.stringify(previewAttrs[cellY][cellX]) !== JSON.stringify(originalAttrs[cellY][cellX]);
                    
                    if (pixelChanged || attrChanged) {
                        if (isEraseMode) {
                            // Preview for erase mode - show actual shape being drawn
                            const currentColorState = this.colorManager.getState();
                            const previewAttr = previewAttrs[cellY][cellX];
                            const previewPixVal = previewPixels[y][x];
                            const originalPixVal = originalPixels[y][x];
                            
                            // Determine colors to display based on the preview state
                            let displayInk, displayPaper, displayBright;
                            
                            if (!currentColorState.paperEnabled) {
                                // Paper disabled - preserve existing paper, but show shape changes
                                const originalAttr = originalAttrs[cellY][cellX];
                                displayInk = currentColorState.inkEnabled ? previewAttr.ink : originalAttr.ink;
                                displayPaper = originalAttr.paper; // Preserve existing paper
                                displayBright = previewAttr.bright;
                            } else {
                                // Paper enabled - use selected colors
                                displayInk = currentColorState.inkEnabled ? previewAttr.ink : originalAttrs[cellY][cellX].ink;
                                displayPaper = previewAttr.paper;
                                displayBright = previewAttr.bright;
                            }
                            
                            // Handle flash
                            if (previewAttr.flash && this.flashPhase) {
                                [displayInk, displayPaper] = [displayPaper, displayInk];
                            }

                            // Show the actual pixel value from the preview (shape outline)
                            const displayColIdx = previewPixVal ? displayInk : displayPaper;
                            const displayColorSet = displayBright ? colorCache.bright : colorCache.normal;
                            const displayCol = displayColorSet[displayColIdx];
                            
                            data[dataIdx++] = displayCol.r;
                            data[dataIdx++] = displayCol.g;
                            data[dataIdx++] = displayCol.b;
                            data[dataIdx++] = 255;
                        } else {
                            // Normal preview mode - respect disabled color settings
                            const currentColorState = this.colorManager.getState();
                            const originalAttr = originalAttrs[cellY][cellX];
                            
                            // Always show preview for shape changes, but respect color settings
                            if (pixelChanged || attrChanged) {
                                // For transparent mode, show the shape with preserved existing colors
                                const previewPixVal = previewPixels[y][x];
                                
                                // Determine which colors to use based on enabled state
                                let displayInk, displayPaper, displayBright;
                                
                                if (currentColorState.inkEnabled && currentColorState.paperEnabled) {
                                    // Both colors enabled - use new colors
                                    const attr = previewAttrs[cellY][cellX];
                                    displayInk = attr.ink;
                                    displayPaper = attr.paper;
                                    displayBright = attr.bright;
                                } else {
                                    // One or both colors disabled - preserve existing colors but show shape
                                    displayInk = currentColorState.inkEnabled ? previewAttrs[cellY][cellX].ink : originalAttr.ink;
                                    displayPaper = currentColorState.paperEnabled ? previewAttrs[cellY][cellX].paper : originalAttr.paper;
                                    displayBright = previewAttrs[cellY][cellX].bright; // Always use current bright setting
                                }
                                
                                // Handle flash
                                if (originalAttr.flash && this.flashPhase) {
                                    [displayInk, displayPaper] = [displayPaper, displayInk];
                                }

                                const displayColIdx = previewPixVal ? displayInk : displayPaper;
                                const displayColorSet = displayBright ? colorCache.bright : colorCache.normal;
                                const displayCol = displayColorSet[displayColIdx];
                                
                                data[dataIdx++] = displayCol.r;
                                data[dataIdx++] = displayCol.g;
                                data[dataIdx++] = displayCol.b;
                                data[dataIdx++] = 255;
                            }
                        }
                    } else {
                        data[dataIdx++] = 0;
                        data[dataIdx++] = 0;
                        data[dataIdx++] = 0;
                        data[dataIdx++] = 0;
                    }
                }
            }
            
            this.previewCtx.putImageData(imageData, 0, 0);
        }

        /**
         * Clear preview canvas
         */
        clearPreview() {
            if (!this.previewCtx) {
                throw new Error('Preview context not available for clearing');
            }
            try {
                this.previewCtx.clearRect(0, 0, this.SCREEN.WIDTH, this.SCREEN.HEIGHT);
            } catch (err) {
                error('Error clearing preview canvas:', err);
            }
        }

        /**
         * Update zoom level
         * @param {number} zoom - Zoom level
         */
        updateZoom(zoom) {
            const size = this.SCREEN.WIDTH * zoom;
            const height = this.SCREEN.HEIGHT * zoom;
            
            this.canvas.style.width = size + 'px';
            this.canvas.style.height = height + 'px';
            
            if (this.previewCanvas) {
                this.previewCanvas.style.width = size + 'px';
                this.previewCanvas.style.height = height + 'px';
            }

            this.eventBus.emit('zoom-updated', zoom);
        }

        /**
         * Get mouse position relative to canvas
         * @param {MouseEvent} e - Mouse event
         * @returns {Object|null} Mouse position or null
         */
        getMousePosition(e) {
            try {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.SCREEN.WIDTH / rect.width;
                const scaleY = this.SCREEN.HEIGHT / rect.height;
                
                const x = Math.floor((e.clientX - rect.left) * scaleX);
                const y = Math.floor((e.clientY - rect.top) * scaleY);
                
                const extendedBounds = x >= -256 && x <= 511 && y >= -192 && y <= 383;
                const originalBounds = x >= 0 && x <= 255 && y >= 0 && y <= 191;
                
                return {
                    x,
                    y,
                    inBounds: originalBounds,
                    inExtendedBounds: extendedBounds
                };
            } catch (error) {
                return null;
            }
        }

        /**
         * Check if any attributes have flash enabled
         * @param {Array} attributes - Attribute data
         * @returns {boolean} Whether any flash attributes exist
         */
        hasFlash(attributes) {
            return attributes.some(row => row.some(attr => attr.flash));
        }

        /**
         * Destroy canvas service
         */
        destroy() {
            if (this.flashInterval) {
                clearInterval(this.flashInterval);
                this.flashInterval = null;
            }
        }
    }

    /**
     * Drawing tool manager
     * @class ToolManager
     */
    class ToolManager {
        constructor(eventBus, colorManager, canvasService) {
            this.eventBus = eventBus;
            this.colorManager = colorManager;
            this.canvasService = canvasService;
            this.initializeTools();
            this.setupState();
        }

        /**
         * Initialize available tools
         */
        initializeTools() {
            this.tools = {
                brush: 'brush',
                fill: 'fill',
                shapes: 'shapes',
                select: 'select'
            };

            this.shapes = {
                line: 'line',
                rect: 'rect',
                circle: 'circle',
                triangle: 'triangle',
                diamond: 'diamond',
                star: 'star',
                ellipse: 'ellipse',
                pentagon: 'pentagon',
                hexagon: 'hexagon',
                octagon: 'octagon',
                'arrow-up': 'arrow-up',
                'arrow-right': 'arrow-right',
                'arrow-down': 'arrow-down',
                'arrow-left': 'arrow-left',
                x: 'x',
                plus: 'plus',
                heart: 'heart',
                lightning: 'lightning',
                house: 'house',
                moon: 'moon',
                flower: 'flower',
                gear: 'gear',
                spiral: 'spiral',
                bowtie: 'bowtie',
                hourglass: 'hourglass',
                trapezoid: 'trapezoid',
                parallelogram: 'parallelogram',
                kite: 'kite'
            };

            this.FILL_LIMIT = 50000;
        }

        /**
         * Setup tool state
         */
        setupState() {
            this.state = {
                currentTool: 'brush',
                currentShape: 'line',
                brushSize: 1,
                brushShape: 'round',
                drawing: false,
                preview: false,
                isRightClick: false,
                lastPos: null,
                startPos: null,
                previewStart: null,
                previewEnd: null
            };
        }

        /**
         * Select a tool
         * @param {string} tool - Tool name
         */
        selectTool(tool) {
            if (!this.tools[tool]) {
                warn('Tool not found:', tool);
                return;
            }

            try {
                // Clear any active preview/drawing state first
                this.clearActiveState();
                
                // Clear preview canvas when switching tools
                this.eventBus.emit('clear-preview');
                
                this.state.currentTool = tool;
                this.state.preview = false;
                
                // Show/hide fill tools UI based on tool selection
                if (tool === 'fill') {
                    if (this.fillToolManager) {
                        this.fillToolManager.activateFillTool();
                    }
                } else {
                    if (this.fillToolManager) {
                        this.fillToolManager.deactivateFillTool();
                    }
                }
                
                this.eventBus.emit('tool-changed', {
                    tool,
                    cursor: this.getToolCursor(tool)
                });
                
                this.eventBus.emit('status', {
                    message: `▶ ${tool.charAt(0).toUpperCase() + tool.slice(1)} selected`,
                    type: 'success'
                });
            } catch (err) {
                error('Error in selectTool:', err);
                throw err;
            }
        }

        /**
         * Clear any active drawing/preview state
         */
        clearActiveState() {
            this.state.drawing = false;
            this.state.preview = false;
            this.state.lastPos = null;
            this.state.startPos = null;
            this.state.previewStart = null;
            this.state.previewEnd = null;
            this.state.isRightClick = false;
        }

        /**
         * Select a shape
         * @param {string} shape - Shape name
         */
        selectShape(shape, options = {}) {
            if (!this.shapes[shape]) return;

            this.state.currentShape = shape;
            this.state.shapeFilled = options.filled || false;
            this.selectTool('shapes');
            
            this.eventBus.emit('shape-changed', { shape, filled: this.state.shapeFilled });
        }

        /**
         * Set brush size
         * @param {number} size - Brush size
         */
        setBrushSize(size) {
            this.state.brushSize = Math.max(1, Math.min(20, size));
            this.eventBus.emit('brush-size-changed', this.state.brushSize);
        }

        /**
         * Set brush shape
         * @param {string} shape - 'round' or 'square'
         */
        setBrushShape(shape) {
            if (shape === 'round' || shape === 'square') {
                this.state.brushShape = shape;
            }
        }

        /**
         * Get cursor for tool
         * @param {string} tool - Tool name
         * @returns {string} CSS cursor value
         */
        getToolCursor(tool) {
            const cursors = {
                brush: 'crosshair',
                fill: 'pointer',
                shapes: 'crosshair',
                select: 'crosshair'
            };
            return cursors[tool] || 'crosshair';
        }

        /**
         * Start drawing operation
         * @param {Object} position - Mouse position
         * @param {boolean} isRightClick - Whether it's a right click
         */
        startDrawing(position, isRightClick = false) {
            // Clear preview canvas at start of any drawing operation
            this.eventBus.emit('clear-preview');
            
            this.state.drawing = true;
            this.state.lastPos = position;
            this.state.startPos = position;
            this.state.isRightClick = isRightClick;

            if (['brush', 'fill', 'select'].includes(this.state.currentTool)) {
                this.performAction(position.x, position.y);
            } else if (this.state.currentTool === 'shapes') {
                this.state.preview = true;
                this.state.previewStart = position;
                this.state.previewEnd = position;
            }

            this.eventBus.emit('drawing-started', {
                tool: this.state.currentTool,
                position,
                isRightClick
            });
        }

        /**
         * Continue drawing operation
         * @param {Object} position - Mouse position
         */
        continueDrawing(position) {
            if (!this.state.drawing) return;

            if (['brush', 'select'].includes(this.state.currentTool)) {
                if (this.state.lastPos) {
                    this.eventBus.emit('draw-line', {
                        start: this.state.lastPos,
                        end: position,
                        erase: this.state.isRightClick
                    });
                }
                this.state.lastPos = position;
            } else if (this.state.currentTool === 'shapes' && this.state.preview) {
                this.state.previewEnd = position;
                this.eventBus.emit('preview-updated', {
                    start: this.state.previewStart,
                    end: this.state.previewEnd,
                    shape: this.state.currentShape,
                    filled: this.state.shapeFilled || false,
                    erase: this.state.isRightClick || false
                });
            }
        }

        /**
         * Stop drawing operation
         */
        stopDrawing() {
            if (!this.state.drawing) return;

            const wasDrawing = this.state.drawing;
            const tool = this.state.currentTool;
            const isRightClick = this.state.isRightClick;

            if (tool === 'shapes' && this.state.previewStart && this.state.previewEnd) {
                this.eventBus.emit('draw-shape', {
                    start: this.state.previewStart,
                    end: this.state.previewEnd,
                    shape: this.state.currentShape,
                    erase: this.state.isRightClick,
                    filled: this.state.shapeFilled || false
                });
            }

            this.state.drawing = false;
            this.state.lastPos = null;
            this.state.startPos = null;
            this.state.preview = false;
            this.state.previewStart = null;
            this.state.previewEnd = null;
            this.state.isRightClick = false;
            
            // Clear preview canvas at end of any drawing operation
            this.eventBus.emit('clear-preview');

            this.eventBus.emit('drawing-stopped', {
                tool,
                wasDrawing,
                isRightClick
            });
        }

        /**
         * Perform tool action at position
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         */
        performAction(x, y) {
            // Don't perform immediate action for shapes - they are handled in stopDrawing
            if (this.state.currentTool === 'shapes') {
                return;
            }

            if (this.state.isRightClick) {
                this.eventBus.emit('draw-brush', { x, y, value: 0, size: this.state.brushSize });
            } else {
                switch (this.state.currentTool) {
                    case 'brush':
                        this.eventBus.emit('draw-brush', { x, y, value: 1, size: this.state.brushSize });
                        break;
                    case 'fill':
                        if (x >= 0 && x <= 255 && y >= 0 && y <= 191) {
                            // Get current fill type from fill tool manager
                            let fillType = 'flood'; // Default
                            if (this.fillToolManager && typeof this.fillToolManager.getCurrentFillType === 'function') {
                                fillType = this.fillToolManager.getCurrentFillType();
                            }
                            
                            // Emit appropriate fill event based on type
                            const fillEvent = fillType === 'flood' ? 'flood-fill' : `${fillType}-fill`;
                            this.eventBus.emit(fillEvent, { x, y, erase: this.state.isRightClick, type: fillType });
                        }
                        break;
                    case 'select':
                        this.eventBus.emit('draw-brush', { x, y, value: 1, size: this.state.brushSize });
                        break;
                }
            }
        }

        /**
         * Get current tool state
         * @returns {Object} Tool state
         */
        getState() {
            return { ...this.state };
        }

        /**
         * Reset tool state
         */
        reset() {
            this.setupState();
            this.eventBus.emit('tool-changed', {
                tool: this.state.currentTool,
                cursor: this.getToolCursor(this.state.currentTool)
            });
        }
    }

    /**
     * File operations service
     * @class FileService
     */
    class FileService {
        constructor(eventBus) {
            this.eventBus = eventBus;
            this.setupLimits();
        }

        /**
         * Setup file size limits
         */
        setupLimits() {
            this.LIMITS = {
                MAX_FILE_SIZE: 50 * 1024 * 1024,
                PERF_WARNING_SIZE: 10 * 1024 * 1024
            };
        }

        /**
         * Save image as PNG
         * @param {HTMLCanvasElement} canvas - Canvas element
         */
        async saveImage(canvas) {
            try {
                const link = document.createElement('a');
                link.download = `zx_pixel_smoosher_${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
                
                this.eventBus.emit('status', { message: '⬇ PNG saved', type: 'success' });
            } catch (error) {
                this.eventBus.emit('error', { title: 'Save Image Failed', message: error.message });
            }
        }

        /**
         * Save SCR file
         * @param {Array} pixels - Pixel data
         * @param {Array} attributes - Attribute data
         */
        async saveSCR(pixels, attributes) {
            try {
                const scrData = this.generateSCRData(pixels, attributes);
                const blob = new Blob([scrData], { type: 'application/octet-stream' });
                const link = document.createElement('a');
                
                link.href = URL.createObjectURL(blob);
                link.download = `zx_pixel_smoosher_${Date.now()}.scr`;
                link.click();
                
                URL.revokeObjectURL(link.href);
                this.eventBus.emit('status', { message: '⬇ SCR saved', type: 'success' });
            } catch (error) {
                this.eventBus.emit('error', { title: 'Save SCR Failed', message: error.message });
            }
        }

        /**
         * Generate SCR data from pixels and attributes
         * @param {Array} pixels - Pixel data
         * @param {Array} attributes - Attribute data
         * @returns {Uint8Array} SCR data
         */
        generateSCRData(pixels, attributes) {
            const scrData = new Uint8Array(6912);
            
            // Encode pixel data
            for (let y = 0; y < 192; y++) {
                for (let charX = 0; charX < 32; charX++) {
                    const charY = Math.floor(y / 8);
                    const pixY = y % 8;
                    const addr = (charY * 256) + (pixY * 32) + charX;
                    
                    let byteVal = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        const pixX = charX * 8 + bit;
                        if (pixels[y] && pixels[y][pixX]) {
                            byteVal |= (1 << (7 - bit));
                        }
                    }
                    
                    if (addr < 6144) scrData[addr] = byteVal;
                }
            }
            
            // Encode attribute data
            for (let charY = 0; charY < 24; charY++) {
                for (let charX = 0; charX < 32; charX++) {
                    const attrAddr = 6144 + (charY * 32) + charX;
                    const attr = attributes[charY][charX];
                    
                    let attrByte = attr.ink | (attr.paper << 3);
                    if (attr.bright) attrByte |= 0x40;
                    if (attr.flash) attrByte |= 0x80;
                    
                    scrData[attrAddr] = attrByte;
                }
            }
            
            return scrData;
        }

        /**
         * Export assembly code
         * @param {Array} pixels - Pixel data
         * @param {Array} attributes - Attribute data
         */
        async exportASM(pixels, attributes) {
            try {
                const asmCode = this.generateASMCode(pixels, attributes);
                const blob = new Blob([asmCode], { type: 'text/plain' });
                const link = document.createElement('a');
                
                link.href = URL.createObjectURL(blob);
                link.download = `zx_pixel_smoosher_${Date.now()}.asm`;
                link.click();
                
                URL.revokeObjectURL(link.href);
                this.eventBus.emit('status', { message: '⬇ ASM exported', type: 'success' });
            } catch (error) {
                this.eventBus.emit('error', { title: 'Export ASM Failed', message: error.message });
            }
        }

        /**
         * Generate assembly code
         * @param {Array} pixels - Pixel data
         * @param {Array} attributes - Attribute data
         * @returns {string} Assembly code
         */
        generateASMCode(pixels, attributes) {
            let asm = `; ZX Spectrum Screen Data\n; Generated by ZX Pixel Smoosher\n; Created by D0k^RA - GPL v3.0\n\nSCREEN_DATA:\n`;
            
            // Generate screen data
            for (let y = 0; y < 192; y++) {
                for (let charX = 0; charX < 32; charX++) {
                    let byteVal = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        const pixX = charX * 8 + bit;
                        if (pixels[y] && pixels[y][pixX]) {
                            byteVal |= (1 << (7 - bit));
                        }
                    }
                    
                    if (charX === 0) asm += `    DB `;
                    asm += `${byteVal.toString(16).toUpperCase().padStart(2, '0')}`;
                    asm += charX < 31 ? `, ` : `;    ; Line ${y}\n`;
                }
            }
            
            // Generate attribute data
            asm += `\nATTRIBUTE_DATA:\n`;
            for (let charY = 0; charY < 24; charY++) {
                asm += `    DB `;
                for (let charX = 0; charX < 32; charX++) {
                    const attr = attributes[charY][charX];
                    let attrByte = attr.ink | (attr.paper << 3);
                    if (attr.bright) attrByte |= 0x40;
                    if (attr.flash) attrByte |= 0x80;
                    
                    asm += `${attrByte.toString(16).toUpperCase().padStart(2, '0')}`;
                    if (charX < 31) asm += `, `;
                }
                asm += `    ; Attr line ${charY}\n`;
            }
            
            return asm;
        }

        /**
         * Load file dialog
         */
        loadFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.scr,.png,.jpg,.jpeg,.gif,.bmp,.webp';
            input.style.display = 'none';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileLoad(file);
                }
                document.body.removeChild(input);
            };
            
            document.body.appendChild(input);
            input.click();
        }

        /**
         * Handle file loading
         * @param {File} file - File to load
         */
        async handleFileLoad(file) {
            try {
                this.validateFile(file);
                
                const isSCR = file.name.toLowerCase().endsWith('.scr');
                if (isSCR) {
                    await this.loadSCR(file);
                } else {
                    await this.loadImage(file);
                }
            } catch (error) {
                this.eventBus.emit('error', { title: 'File Load Failed', message: error.message });
            }
        }

        /**
         * Validate file
         * @param {File} file - File to validate
         */
        validateFile(file) {
            if (file.size > this.LIMITS.MAX_FILE_SIZE) {
                throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${this.LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB.`);
            }
            
            if (file.size > this.LIMITS.PERF_WARNING_SIZE) {
                this.eventBus.emit('performance-warning', file.size);
            }
            
            const validImg = /^image\/(png|jpe?g|gif|bmp|webp)$/i;
            const isSCR = file.name.toLowerCase().endsWith('.scr');
            const isValidImg = validImg.test(file.type);
            
            if (!isSCR && !isValidImg) {
                throw new Error('Invalid file type. Use SCR or image files.');
            }
        }

        /**
         * Load SCR file
         * @param {File} file - SCR file
         */
        async loadSCR(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        if (data.length !== 6912) {
                            throw new Error('Invalid SCR file size');
                        }
                        
                        const { pixels, attributes } = this.parseSCR(data);
                        this.eventBus.emit('file-loaded', { pixels, attributes, type: 'scr' });
                        this.eventBus.emit('status', { message: '⬆ SCR loaded', type: 'success' });
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = () => reject(new Error('Failed to read SCR file'));
                reader.readAsArrayBuffer(file);
            });
        }

        /**
         * Parse SCR data
         * @param {Uint8Array} data - SCR data
         * @returns {Object} Parsed pixels and attributes
         */
        parseSCR(data) {
            // Optimized array creation
            const pixels = new Array(192);
            for (let row = 0; row < 192; row++) {
                pixels[row] = new Uint8Array(256);
            }
            
            const attributes = new Array(24);
            for (let blockRow = 0; blockRow < 24; blockRow++) {
                attributes[blockRow] = new Array(32);
                for (let blockCol = 0; blockCol < 32; blockCol++) {
                    attributes[blockRow][blockCol] = {};
                }
            }
            
            // Parse pixel data
            for (let y = 0; y < 192; y++) {
                for (let charX = 0; charX < 32; charX++) {
                    const charY = Math.floor(y / 8);
                    const pixY = y % 8;
                    const addr = (charY * 256) + (pixY * 32) + charX;
                    
                    if (addr < 6144) {
                        const byteVal = data[addr];
                        for (let bit = 0; bit < 8; bit++) {
                            const pixX = charX * 8 + bit;
                            pixels[y][pixX] = (byteVal & (1 << (7 - bit))) ? 1 : 0;
                        }
                    }
                }
            }
            
            // Parse attribute data
            for (let charY = 0; charY < 24; charY++) {
                for (let charX = 0; charX < 32; charX++) {
                    const attrAddr = 6144 + (charY * 32) + charX;
                    const attrByte = data[attrAddr];
                    
                    attributes[charY][charX] = {
                        ink: attrByte & 0x07,
                        paper: (attrByte >> 3) & 0x07,
                        bright: (attrByte & 0x40) !== 0,
                        flash: (attrByte & 0x80) !== 0
                    };
                }
            }
            
            return { pixels, attributes };
        }

        /**
         * Load image file
         * @param {File} file - Image file
         */
        async loadImage(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const img = new Image();
                    
                    img.onload = () => {
                        try {
                            const { pixels, attributes } = this.convertImage(img);
                            this.eventBus.emit('file-loaded', { pixels, attributes, type: 'image' });
                            this.eventBus.emit('status', { message: '⬆ Image converted', type: 'success' });
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };
                    
                    img.onerror = () => reject(new Error('Failed to load image'));
                    img.src = e.target.result;
                };
                
                reader.onerror = () => reject(new Error('Failed to read image file'));
                reader.readAsDataURL(file);
            });
        }

        /**
         * Convert image to pixel data
         * @param {Image} img - Image element
         * @returns {Object} Converted pixels and attributes
         */
        convertImage(img) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 256;
            canvas.height = 192;
            ctx.drawImage(img, 0, 0, 256, 192);
            
            const imageData = ctx.getImageData(0, 0, 256, 192);
            
            // Optimized array creation
            const pixels = new Array(192);
            for (let row = 0; row < 192; row++) {
                pixels[row] = new Uint8Array(256);
            }
            
            const attributes = new Array(24);
            for (let blockRow = 0; blockRow < 24; blockRow++) {
                attributes[blockRow] = new Array(32);
                for (let blockCol = 0; blockCol < 32; blockCol++) {
                    attributes[blockRow][blockCol] = {
                        ink: 0,
                        paper: 7,
                        bright: false,
                        flash: false
                    };
                }
            }
            
            // Convert to monochrome
            for (let y = 0; y < 192; y++) {
                for (let x = 0; x < 256; x++) {
                    const i = (y * 256 + x) * 4;
                    const gray = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
                    pixels[y][x] = gray > 128 ? 1 : 0;
                }
            }
            
            return { pixels, attributes };
        }
    }

    /**
     * Application state manager
     * @class StateManager
     */
    class StateManager {
        constructor(eventBus, historyManager) {
            this.eventBus = eventBus;
            this.history = historyManager;
            this.initializeState();
        }

        /**
         * Initialize application state
         * Optimized array creation to reduce memory allocation overhead
         */
        initializeState() {
            // Pre-allocate pixel array efficiently
            const pixels = new Array(192);
            for (let row = 0; row < 192; row++) {
                pixels[row] = new Uint8Array(256);
            }
            
            // Pre-allocate attribute array efficiently
            const attributes = new Array(24);
            for (let blockRow = 0; blockRow < 24; blockRow++) {
                attributes[blockRow] = new Array(32);
                for (let blockCol = 0; blockCol < 32; blockCol++) {
                    attributes[blockRow][blockCol] = {
                        ink: 0,
                        paper: 7,
                        bright: false,
                        flash: false
                    };
                }
            }
            
            this.state = {
                pixels: pixels,
                attributes: attributes,
                zoom: 2,
                grids: {
                    '1x1': false,
                    '8x8': false,
                    '16x16': false
                }
            };
        }

        /**
         * Get current state
         * @returns {Object} Current state
         */
        getState() {
            return {
                pixels: this.state.pixels.map(row => new Uint8Array(row)),
                attributes: this.state.attributes.map(row => row.map(attr => ({ ...attr }))),
                zoom: this.state.zoom,
                grids: { ...this.state.grids }
            };
        }

        /**
         * Set pixels without emitting events (internal use)
         * @param {Array} pixels - Pixel data
         */
        setPixels(pixels) {
            this.state.pixels = pixels.map(row => new Uint8Array(row));
        }

        /**
         * Set attributes without emitting events (internal use)
         * @param {Array} attributes - Attribute data
         */
        setAttributes(attributes) {
            this.state.attributes = attributes.map(row => row.map(attr => ({ ...attr })));
        }

        /**
         * Update pixels and emit state change
         * @param {Array} pixels - Pixel data
         */
        updatePixels(pixels) {
            this.setPixels(pixels);
            this.eventBus.emit('state-changed', { pixels: this.state.pixels });
        }

        /**
         * Update attributes and emit state change
         * @param {Array} attributes - Attribute data
         */
        updateAttributes(attributes) {
            this.setAttributes(attributes);
            this.eventBus.emit('state-changed', { attributes: this.state.attributes });
        }

        /**
         * Set zoom level
         * @param {number} zoom - Zoom level
         */
        setZoom(zoom) {
            this.state.zoom = Math.max(1, Math.min(16, zoom));
            this.eventBus.emit('zoom-changed', this.state.zoom);
        }

        /**
         * Toggle grid
         * @param {string} type - Grid type
         */
        toggleGrid(type) {
            log('StateManager toggleGrid called with:', type);
            if (this.state.grids.hasOwnProperty(type)) {
                this.state.grids[type] = !this.state.grids[type];
                log(`Grid ${type} state changed to:`, this.state.grids[type]);
                this.eventBus.emit('grid-changed', { type, enabled: this.state.grids[type] });
                log('grid-changed event emitted');
            } else {
                error('Invalid grid type:', type, 'Available types:', Object.keys(this.state.grids));
            }
        }

        /**
         * Save state to history
         * @param {string} type - State type
         */
        saveState(type = 'draw') {
            if (this.history) {
                log('Saving state with type:', type);
                this.history.saveState(this.state.pixels, this.state.attributes, type);
                this.eventBus.emit('history-saved', type);
                log('State saved - history info:', this.history.getInfo());
            }
        }

        /**
         * Undo last action
         */
        undo() {
            if (!this.history || !this.history.canUndo()) {
                this.eventBus.emit('status', { message: 'Nothing to undo', type: 'warning' });
                return;
            }

            log('Undo called - current history info:', this.history.getInfo());
            const result = this.history.undo();
            if (result) {
                log('Undo successful - restored action type:', result.metadata?.actionType);
                this.state.pixels = result.pixels;
                this.state.attributes = result.attributes;
                
                log('Clearing preview canvas after undo...');
                this.eventBus.emit('clear-preview');
                
                log('Emitting state-changed event after undo...');
                this.eventBus.emit('state-changed', {
                    pixels: this.state.pixels,
                    attributes: this.state.attributes
                });
                log('State-changed event emitted');
                
                const info = result.info;
                let message = `↶ Undo (${info.undoCount} more`;
                if (info.redoCount > 0) message += `, ${info.redoCount} redo`;
                if (info.hasPendingRedo) message += `, smart redo`;
                message += ')';
                
                this.eventBus.emit('status', { message, type: 'success' });
            } else {
                log('Undo failed - no result returned');
            }
        }

        /**
         * Redo last undone action
         */
        redo() {
            if (!this.history || !this.history.canRedo()) {
                this.eventBus.emit('status', { message: 'Nothing to redo', type: 'warning' });
                return;
            }

            const result = this.history.redo();
            if (result) {
                this.state.pixels = result.pixels;
                this.state.attributes = result.attributes;
                
                this.eventBus.emit('state-changed', {
                    pixels: this.state.pixels,
                    attributes: this.state.attributes
                });
                
                const info = result.info;
                let message = `↷ Redo (${info.undoCount} undo`;
                if (info.redoCount > 0) message += `, ${info.redoCount} more redo`;
                message += ')';
                
                this.eventBus.emit('status', { message, type: 'success' });
            }
        }

        /**
         * Clear canvas
         */
        clearCanvas() {
            this.initializeState();
            this.eventBus.emit('state-changed', {
                pixels: this.state.pixels,
                attributes: this.state.attributes
            });
            this.eventBus.emit('status', { message: '+ Canvas cleared', type: 'success' });
        }

        /**
         * Reset to initial state
         */
        reset() {
            this.initializeState();
            if (this.history) {
                this.history.clear();
            }
            
            this.eventBus.emit('state-changed', {
                pixels: this.state.pixels,
                attributes: this.state.attributes,
                zoom: this.state.zoom,
                grids: this.state.grids
            });
            
            this.eventBus.emit('status', { message: '↻ Full Reset Complete', type: 'success' });
        }
    }

    /**
     * UI controller for DOM manipulation and event handling
     * @class UIController
     */
    class UIController {
        constructor(eventBus, colorManager, toolManager, canvasService) {
            this.eventBus = eventBus;
            this.colorManager = colorManager;
            this.toolManager = toolManager;
            this.canvasService = canvasService;
            this.setupEventListeners();
            this.setupTooltips();
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            this.eventBus.on('color-changed', (colorState) => {
                this.updateColorUI(colorState);
            });
            this.eventBus.on('tool-changed', (toolData) => this.updateToolUI(toolData));
            this.eventBus.on('shape-changed', (shape) => this.updateShapeUI(shape));
            this.eventBus.on('zoom-changed', (zoom) => this.updateZoomUI(zoom));
            this.eventBus.on('grid-changed', (gridData) => this.updateGridUI(gridData));
            this.eventBus.on('status', (statusData) => this.updateStatus(statusData));
            this.eventBus.on('error', (errorData) => this.showError(errorData));
            this.eventBus.on('brush-size-changed', (size) => this.updateBrushSizeUI(size));
            this.eventBus.on('zoom-updated', (zoom) => this.updateGridOverlaySizes(zoom));
            
            this.setupDOMEventListeners();
        }

        /**
         * Setup DOM event listeners
         */
        setupDOMEventListeners() {
            log('setupDOMEventListeners called');
            // Tool selection
            document.querySelectorAll('.tool').forEach(tool => {
                // Prevent duplicate event listeners
                if (tool.hasAttribute('data-listeners-attached')) return;
                tool.setAttribute('data-listeners-attached', 'true');
                
                const handler = (e) => {
                    try {
                        this.toolManager.selectTool(e.currentTarget.dataset.tool);
                    } catch (err) {
                        error('Error selecting tool:', err);
                        this.eventBus.emit('error', { 
                            title: 'Tool Selection Error', 
                            message: 'Failed to select tool: ' + error.message 
                        });
                    }
                };
                tool.addEventListener('click', handler);
                tool.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handler(e);
                    }
                });
                
                // Special handling for fill tool - right-click shows advanced fill options
                if (tool.dataset.tool === 'fill') {
                    tool.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        this.showFillContextMenu(e);
                    });
                }
            });

            // Shape selection
            document.querySelectorAll('.shape-tool').forEach(tool => {
                // Prevent duplicate event listeners
                if (tool.hasAttribute('data-shape-listeners-attached')) return;
                tool.setAttribute('data-shape-listeners-attached', 'true');
                
                const handler = (e) => {
                    try {
                        // Left-click selects outlined/normal shape
                        const shapeType = e.currentTarget.dataset.shape;
                        this.toolManager.selectShape(shapeType, { filled: false });
                        
                        // Update visual feedback for normal mode selection
                        document.querySelectorAll('.shape-tool').forEach(t => {
                            t.classList.remove('active', 'filled-mode');
                        });
                        e.currentTarget.classList.add('active');
                        
                    } catch (err) {
                        error('Error selecting shape:', err);
                        this.eventBus.emit('error', { 
                            title: 'Shape Selection Error', 
                            message: 'Failed to select shape: ' + error.message 
                        });
                    }
                };
                tool.addEventListener('click', handler);
                
                // Right-click for filled shape selection
                tool.addEventListener('contextmenu', (e) => {
                    e.preventDefault(); // Prevent context menu
                    try {
                        // Right-click selects filled/solid shape
                        const shapeType = e.currentTarget.dataset.shape;
                        this.toolManager.selectShape(shapeType, { filled: true });
                        
                        // Visual feedback for filled mode selection
                        document.querySelectorAll('.shape-tool').forEach(t => {
                            t.classList.remove('active', 'filled-mode');
                        });
                        e.currentTarget.classList.add('active', 'filled-mode');
                        
                        log(`Shape selected in filled mode: ${shapeType}`);
                    } catch (err) {
                        error('Error selecting filled shape:', err);
                        this.eventBus.emit('error', { 
                            title: 'Shape Filled Mode Error', 
                            message: 'Failed to select filled shape: ' + error.message 
                        });
                    }
                });
                
                tool.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handler(e);
                    }
                });
            });

            // Brush size
            const brushSize = document.getElementById('brush-size');
            if (brushSize) {
                brushSize.addEventListener('input', (e) => {
                    this.toolManager.setBrushSize(parseInt(e.target.value));
                });
            }

            // Brush shape toggle
            const brushShapeToggle = document.getElementById('brush-shape');
            if (brushShapeToggle) {
                brushShapeToggle.addEventListener('change', (e) => {
                    const brushShape = e.target.checked ? 'square' : 'round';
                    this.toolManager.setBrushShape(brushShape);
                });
            }

            // Zoom
            const zoomSlider = document.getElementById('zoom');
            if (zoomSlider) {
                zoomSlider.addEventListener('input', (e) => {
                    this.eventBus.emit('zoom-requested', parseFloat(e.target.value));
                });
            }

            // Canvas events and grid buttons - defer to allow DOM to be ready
            setTimeout(() => {
                this.setupCanvasEventListeners();
                this.setupGridButtonListeners();
            }, 100);
            
            // Keyboard events
            document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        }

        /**
         * Setup grid button event listeners
         */
        setupGridButtonListeners() {
            log('Setting up grid button event listeners...');
            const gridButtons = ['1x1', '8x8', '16x16'];
            gridButtons.forEach(gridType => {
                const btnEl = document.getElementById(`btn-grid-${gridType}`);
                log(`Looking for button: btn-grid-${gridType}`, btnEl);
                if (btnEl) {
                    // Prevent duplicate event listeners
                    if (btnEl.hasAttribute('data-grid-listeners-attached')) {
                        log(`Button btn-grid-${gridType} already has listeners attached`);
                        return;
                    }
                    btnEl.setAttribute('data-grid-listeners-attached', 'true');
                    
                    const handler = (e) => {
                        log(`Grid button ${gridType} clicked!`);
                        try {
                            e.preventDefault();
                            this.eventBus.emit('grid-toggle', gridType);
                        } catch (err) {
                            error('Error toggling grid:', err);
                            this.eventBus.emit('error', { 
                                title: 'Grid Toggle Error', 
                                message: 'Failed to toggle grid: ' + error.message 
                            });
                        }
                    };
                    
                    btnEl.addEventListener('click', handler);
                    btnEl.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handler(e);
                        }
                    });
                    log(`Event listeners attached to btn-grid-${gridType}`);
                } else {
                    error(`Button btn-grid-${gridType} not found in DOM`);
                }
            });
        }

        /**
         * Setup canvas event listeners
         */
        setupCanvasEventListeners() {
            if (!this.canvasService.ensureCanvasInitialized()) {
                warn('Cannot setup canvas event listeners - canvas not initialized');
                return;
            }
            
            const canvas = this.canvasService.canvas;
            if (!canvas) {
                throw new Error('Canvas not available for event listeners');
            }
            
            canvas.addEventListener('mousedown', (e) => {
                const pos = this.canvasService.getMousePosition(e);
                if (pos && pos.inExtendedBounds) {
                    this.toolManager.startDrawing(pos, e.button === 2);
                }
            });

            canvas.addEventListener('contextmenu', (e) => e.preventDefault());

            document.addEventListener('mousemove', (e) => {
                const pos = this.canvasService.getMousePosition(e);
                if (pos) {
                    this.updateCursor(pos);
                    this.toolManager.continueDrawing(pos);
                }
            });

            document.addEventListener('mouseup', () => {
                this.toolManager.stopDrawing();
            });
        }

        /**
         * Update color UI
         * @param {Object} colorState - Color state
         */
        updateColorUI(colorState) {
            this.createPalette();
            this.updateColorIndicator(colorState);
        }

        /**
         * Create color palette
         */
        createPalette() {
            const palette = document.getElementById('palette');
            if (!palette) {
                error('Palette element not found! Make sure the DOM is loaded.');
                return;
            }

            palette.innerHTML = '';
            const fragment = document.createDocumentFragment();

            this.colorManager.ZX_COLORS.forEach((color, index) => {
                const swatch = this.createColorSwatch(color, index);
                fragment.appendChild(swatch);
            });

            palette.appendChild(fragment);
        }

        /**
         * Create color swatch element
         * @param {Object} color - Color definition
         * @param {number} index - Color index
         * @returns {HTMLElement} Color swatch element
         */
        createColorSwatch(color, index) {
            const swatch = document.createElement('div');
            swatch.className = 'color';
            
            const colorState = this.colorManager.getState();
            swatch.style.backgroundColor = this.colorManager.getColorHex(index, false);
            
            swatch.setAttribute('role', 'button');
            swatch.setAttribute('aria-label', `${color.name} color`);
            swatch.setAttribute('tabindex', '0');

            const isInk = index === colorState.ink;
            const isPaper = index === colorState.paper;
            
            let tooltip = `${color.name} - Left click: INK, Right click: PAPER`;
            if (isInk && isPaper) {
                tooltip = `${color.name} - Currently both INK & PAPER`;
            } else if (isInk) {
                tooltip = `${color.name} - Currently INK`;
            } else if (isPaper) {
                tooltip = `${color.name} - Currently PAPER`;
            }
            
            swatch.title = tooltip;

            swatch.addEventListener('click', () => this.colorManager.setInk(index));
            swatch.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.colorManager.setPaper(index);
            });
            
            swatch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.colorManager.setPaper(index);
                    } else {
                        this.colorManager.setInk(index);
                    }
                }
            });

            return swatch;
        }

        /**
         * Unified UI update method - handles multiple UI update scenarios
         * @param {string} type - Update type: 'color', 'tool', 'shape', 'zoom', 'brush', 'grid'
         * @param {*} data - Data relevant to the update type
         * @param {Object} options - Additional options for the update
         */
        updateUI(type, data, options = {}) {
            try {
                const handlers = {
                    'color': (colorState) => this._updateColorHandler(colorState),
                    'tool': (toolData) => this._updateToolHandler(toolData),
                    'shape': (shape) => this._updateShapeHandler(shape),
                    'zoom': (zoom) => this._updateZoomHandler(zoom),
                    'brush': (size) => this._updateBrushHandler(size),
                    'grid': (gridData) => this._updateGridHandler(gridData)
                };
                
                const handler = handlers[type];
                if (handler) {
                    return handler(data, options);
                } else {
                    warn(`Unknown UI update type: ${type}`);
                    return false;
                }
            } catch (err) {
                error(`Error in updateUI(${type}):`, err);
                throw err;
            }
        }

        /**
         * Handle color UI updates
         * @private
         */
        _updateColorHandler(colorState) {
            const indicator = document.getElementById('color-indicator');
            if (!indicator) return false;

            const inkColor = this.colorManager.getColorHex(colorState.ink, false);
            const paperColor = this.colorManager.getColorHex(colorState.paper, false);

            indicator.style.setProperty('--ink-color', inkColor);
            indicator.style.setProperty('--paper-color', paperColor);
            
            indicator.classList.remove('ink-disabled', 'paper-disabled');
            
            if (!colorState.inkEnabled) indicator.classList.add('ink-disabled');
            if (!colorState.paperEnabled) indicator.classList.add('paper-disabled');

            const inkName = this.colorManager.ZX_COLORS[colorState.ink].name;
            const paperName = this.colorManager.ZX_COLORS[colorState.paper].name;
            indicator.title = `INK: ${inkName} • PAPER: ${paperName}`;
            return true;
        }

        /**
         * Handle tool UI updates
         * @private
         */
        _updateToolHandler(toolData) {
            document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
            
            const toolEl = document.querySelector(`[data-tool="${toolData.tool}"]`);
            if (toolEl) {
                toolEl.classList.add('active');
            } else {
                warn('Tool element not found for:', toolData.tool);
                return false;
            }

            if (this.canvasService.ensureCanvasInitialized()) {
                const canvas = this.canvasService.canvas;
                if (canvas) canvas.style.cursor = toolData.cursor;
            } else {
                warn('Failed to initialize canvas for cursor update');
            }
            return true;
        }

        /**
         * Handle shape UI updates
         * @private
         */
        _updateShapeHandler(shape) {
            document.querySelectorAll('.shape-tool').forEach(t => t.classList.remove('active'));
            const shapeEl = document.querySelector(`[data-shape="${shape}"]`);
            if (shapeEl) {
                shapeEl.classList.add('active');
                return true;
            }
            return false;
        }

        /**
         * Handle zoom UI updates
         * @private
         */
        _updateZoomHandler(zoom) {
            const zoomSlider = document.getElementById('zoom');
            const zoomDisplay = document.getElementById('zoom-display');
            
            if (zoomSlider) zoomSlider.value = zoom;
            if (zoomDisplay) zoomDisplay.textContent = Math.round(zoom * 100) + '%';
            return true;
        }

        /**
         * Handle brush size UI updates
         * @private
         */
        _updateBrushHandler(size) {
            const brushSlider = document.getElementById('brush-size');
            const sizeDisplay = document.getElementById('size-display');
            
            if (brushSlider) brushSlider.value = size;
            if (sizeDisplay) sizeDisplay.textContent = size + 'px';
            return true;
        }

        /**
         * Handle grid UI updates
         * @private
         */
        _updateGridHandler(gridData) {
            const gridEl = document.getElementById(`grid-${gridData.type}`);
            const btnEl = document.getElementById(`btn-grid-${gridData.type}`);
            
            if (gridEl) {
                gridEl.classList.toggle('active', gridData.enabled);
            }
            
            if (btnEl) {
                btnEl.classList.toggle('active', gridData.enabled);
            }
            return true;
        }

        // Backward compatibility methods (deprecated)
        updateColorIndicator(colorState) { return this.updateUI('color', colorState); }
        updateToolUI(toolData) { return this.updateUI('tool', toolData); }
        updateShapeUI(shape) { return this.updateUI('shape', shape); }
        updateZoomUI(zoom) { return this.updateUI('zoom', zoom); }
        updateBrushSizeUI(size) { return this.updateUI('brush', size); }
        updateGridUI(gridData) { return this.updateUI('grid', gridData); }

        /**
         * Light up button animation
         * @param {string|HTMLElement} target - Button selector or element
         * @param {string} type - Animation type: 'default', 'success', 'warning', 'danger'
         * @param {number} duration - Animation duration in milliseconds (default 600)
         */
        lightUp(target, type = 'default', duration = 600) {
            let element;
            
            // Handle both selector strings and direct element references
            if (typeof target === 'string') {
                element = document.querySelector(target);
            } else if (target instanceof HTMLElement) {
                element = target;
            }
            
            if (!element) {
                warn('LightUp: Target element not found:', target);
                return;
            }
            
            // Remove any existing light-up classes
            element.classList.remove('light-up', 'light-up-success', 'light-up-warning', 'light-up-danger');
            
            // Add the appropriate light-up class
            const classMap = {
                'default': 'light-up',
                'success': 'light-up-success', 
                'warning': 'light-up-warning',
                'danger': 'light-up-danger'
            };
            
            const lightUpClass = classMap[type] || 'light-up';
            element.classList.add(lightUpClass);
            
            // Remove the class after animation completes
            setTimeout(() => {
                element.classList.remove(lightUpClass);
            }, duration);
            
            // Emit event for potential listeners
            this.eventBus.emit('button-light-up', {
                element,
                type,
                duration,
                timestamp: Date.now()
            });
        }

        /**
         * Update grid sizes based on zoom level
         * @param {number} zoom - Current zoom level
         */
        updateGridOverlaySizes(zoom) {
            const root = document.documentElement;
            
            // Calculate grid sizes based on zoom
            // Use Math.round to ensure whole pixel values for better alignment
            const pixel1x1Size = Math.round(1 * zoom);
            const pixel8x8Size = Math.round(8 * zoom);
            const pixel16x16Size = Math.round(16 * zoom);
            
            // Update CSS variables for grid background sizes
            root.style.setProperty('--grid-1x1-size', `${pixel1x1Size}px`);
            root.style.setProperty('--grid-8x8-size', `${pixel8x8Size}px`);
            root.style.setProperty('--grid-16x16-size', `${pixel16x16Size}px`);
            
            // Adjust 1x1 grid opacity based on zoom for better visibility
            let opacity = 1.0;
            if (zoom <= 2) {
                opacity = 0.3;
            } else if (zoom <= 4) {
                opacity = 0.6;
            } else {
                opacity = 1.0;
            }
            root.style.setProperty('--grid-1x1-opacity', opacity);
        }

        /**
         * Update status display
         * @param {Object} statusData - Status data
         */
        updateStatus(statusData) {
            const statusEl = document.getElementById('status');
            const dotEl = document.getElementById('statusDot');
            
            if (statusEl) statusEl.textContent = statusData.message;
            if (dotEl) {
                dotEl.className = `status-dot ${statusData.type === 'error' ? 'error' : statusData.type === 'warning' ? 'warning' : ''}`;
            }
        }

        /**
         * Show error dialog
         * @param {Object} errorData - Error data
         */
        showError(errorData) {
            const modal = document.getElementById('errorModal');
            const titleEl = document.getElementById('errorTitle');
            const msgEl = document.getElementById('errorMessage');
            
            if (modal && titleEl && msgEl) {
                titleEl.textContent = errorData.title;
                msgEl.textContent = errorData.message;
                modal.style.display = 'flex';
            }
        }

        /**
         * Hide error dialog
         */
        hideError() {
            const modal = document.getElementById('errorModal');
            if (modal) modal.style.display = 'none';
        }

        /**
         * Update cursor position display
         * @param {Object} pos - Mouse position
         */
        updateCursor(pos) {
            const cursor = document.getElementById('cursor');
            if (cursor) cursor.textContent = `${pos.x}, ${pos.y}`;
        }

        /**
         * Handle keyboard events
         * @param {KeyboardEvent} e - Keyboard event
         */
        handleKeyboard(e) {
            if (e.target.tagName === 'INPUT') return;

            const keyMap = {
                'b': () => this.toolManager.selectTool('brush'),
                'f': () => this.toolManager.selectTool('fill'),
                's': () => this.toolManager.selectTool('shapes'),
                'g': () => this.eventBus.emit('grid-toggle', '8x8'),
                '1': () => this.eventBus.emit('grid-toggle', '1x1'),
                '2': () => this.eventBus.emit('grid-toggle', '16x16'),
                'z': () => {
                    if (e.ctrlKey && e.shiftKey) {
                        e.preventDefault();
                        this.eventBus.emit('redo');
                    } else if (e.ctrlKey) {
                        e.preventDefault();
                        this.eventBus.emit('undo');
                    }
                },
                '+': () => {
                    e.preventDefault();
                    this.eventBus.emit('zoom-adjust', 1);
                },
                '-': () => {
                    e.preventDefault();
                    this.eventBus.emit('zoom-adjust', -1);
                }
            };

            const handler = keyMap[e.key.toLowerCase()];
            if (handler) handler();
        }

        /**
         * Setup tooltip positioning
         */
        setupTooltips() {
            let tooltipPortal = document.getElementById('tooltip-portal');
            if (!tooltipPortal) {
                tooltipPortal = document.createElement('div');
                tooltipPortal.id = 'tooltip-portal';
                tooltipPortal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 999999;
                `;
                document.body.appendChild(tooltipPortal);
            }

            this.setupTooltipElements(tooltipPortal);
        }

        /**
         * Setup tooltip elements
         * @param {HTMLElement} tooltipPortal - Tooltip portal element
         */
        setupTooltipElements(tooltipPortal) {
            document.querySelectorAll('.tooltip').forEach(tooltip => {
                const tooltipText = tooltip.querySelector('.tooltiptext');
                if (!tooltipText) return;

                const portalTooltip = document.createElement('div');
                portalTooltip.className = 'portal-tooltip';
                portalTooltip.innerHTML = tooltipText.innerHTML;
                portalTooltip.style.cssText = `
                    position: fixed;
                    visibility: hidden;
                    opacity: 0;
                    width: clamp(180px, 50vw, 240px);
                    background: #1f2937;
                    color: #f9fafb;
                    text-align: left;
                    border-radius: 6px;
                    padding: 12px;
                    z-index: 999999;
                    transition: opacity 0.3s;
                    border: 1px solid #374151;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                    font-size: clamp(9px, 2vw, 11px);
                    line-height: 1.4;
                    pointer-events: none;
                `;
                
                tooltipPortal.appendChild(portalTooltip);

                tooltip.addEventListener('mouseenter', () => {
                    const rect = tooltip.getBoundingClientRect();
                    let left = rect.right + 10;
                    let top = rect.top - 5;
                    
                    const tooltipWidth = 240;
                    const tooltipHeight = 100;
                    
                    if (left + tooltipWidth > window.innerWidth) {
                        left = rect.left - tooltipWidth - 10;
                    }
                    if (top + tooltipHeight > window.innerHeight) {
                        top = window.innerHeight - tooltipHeight - 10;
                    }
                    if (top < 10) {
                        top = 10;
                    }
                    
                    portalTooltip.style.left = left + 'px';
                    portalTooltip.style.top = top + 'px';
                    portalTooltip.style.visibility = 'visible';
                    portalTooltip.style.opacity = '1';
                });

                tooltip.addEventListener('mouseleave', () => {
                    portalTooltip.style.visibility = 'hidden';
                    portalTooltip.style.opacity = '0';
                });

                tooltipText.style.display = 'none';
            });
        }

        /**
         * Reset UI to default state
         */
        reset() {
            // Reset tool selection
            document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
            const brushTool = document.querySelector('[data-tool="brush"]');
            if (brushTool) brushTool.classList.add('active');

            // Reset shape selection
            document.querySelectorAll('.shape-tool').forEach(t => t.classList.remove('active'));
            const lineTool = document.querySelector('[data-shape="line"]');
            if (lineTool) lineTool.classList.add('active');

            // Reset sliders
            const brushSize = document.getElementById('brush-size');
            const sizeDisplay = document.getElementById('size-display');
            const zoom = document.getElementById('zoom');
            const zoomDisplay = document.getElementById('zoom-display');

            if (brushSize) brushSize.value = 1;
            if (sizeDisplay) sizeDisplay.textContent = '1px';
            if (zoom) zoom.value = 2;
            if (zoomDisplay) zoomDisplay.textContent = '200%';

            // Reset toggles
            const toggles = ['bright-toggle', 'flash-toggle', 'btn-grid-1x1', 'btn-grid-8x8', 'btn-grid-16x16'];
            toggles.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('active');
            });

            // Reset grids
            ['grid-1x1', 'grid-8x8', 'grid-16x16'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('active');
            });

            // Reset cursor
            const cursor = document.getElementById('cursor');
            if (cursor) cursor.textContent = '0, 0';

            // Reset canvas cursor
            const canvas = this.canvasService.canvas;
            if (canvas) canvas.style.cursor = 'crosshair';
        }
        
        /**
         * Show fill context menu with all fill type options
         * @param {Event} e - Right-click event on fill tool
         */
        showFillContextMenu(e) {
            const menu = document.getElementById('fill-context-menu');
            if (!menu) return;
            
            // Position menu near cursor
            const x = e.clientX;
            const y = e.clientY;
            
            // Ensure menu doesn't go off screen
            const menuRect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let menuX = x;
            let menuY = y;
            
            if (x + menuRect.width > viewportWidth) {
                menuX = x - menuRect.width;
            }
            if (y + menuRect.height > viewportHeight) {
                menuY = y - menuRect.height;
            }
            
            menu.style.left = `${menuX}px`;
            menu.style.top = `${menuY}px`;
            menu.classList.add('active');
            
            // Set up menu item handlers if not already done
            if (!menu.hasAttribute('data-handlers-attached')) {
                this.setupFillContextMenuHandlers(menu);
                menu.setAttribute('data-handlers-attached', 'true');
            }
            
            // Update active state to show current selection
            this.updateFillContextMenuActiveState();
            
            // Hide menu when clicking outside
            const hideMenu = (event) => {
                if (!menu.contains(event.target)) {
                    menu.classList.remove('active');
                    document.removeEventListener('click', hideMenu);
                }
            };
            
            setTimeout(() => {
                document.addEventListener('click', hideMenu);
            }, 0);
        }
        
        /**
         * Set up fill context menu handlers
         * @param {HTMLElement} menu - Fill context menu element
         */
        setupFillContextMenuHandlers(menu) {
            const menuItems = menu.querySelectorAll('.fill-menu-item');
            
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const fillType = e.currentTarget.dataset.fillType;
                    
                    // Select fill tool and set fill type
                    this.toolManager.selectTool('fill');
                    
                    // Enhanced manager availability check with retry mechanism
                    const success = this.handleFillTypeSelection(fillType);
                    if (!success) {
                        // Attempt to reinitialize managers if they failed
                        console.warn('🔄 Attempting to reinitialize fill managers...');
                        throw new Error(`Fill type selection failed: ${fillType}`);
                    }
                    
                    // Update active state in menu
                    menuItems.forEach(mi => mi.classList.remove('active'));
                    item.classList.add('active');
                    
                    // Hide menu
                    menu.classList.remove('active');
                    
                    // Show status message
                    this.eventBus.emit('status', {
                        message: `✓ ${this.getFillTypeName(fillType)} selected`,
                        type: 'success'
                    });
                });
                
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        item.click();
                    }
                });
            });
        }
        
        /**
         * Verify fill managers are accessible and functional
         * @returns {Object} Status of fill managers
         */
        verifyFillManagers() {
            const status = {
                fillManager: {
                    exists: !!this.fillManager,
                    type: typeof this.fillManager,
                    hasSetFillType: this.fillManager && typeof this.fillManager.setFillType === 'function',
                    hasFillMethod: this.fillManager && typeof this.fillManager.fill === 'function'
                },
                fillToolManager: {
                    exists: !!this.fillToolManager,
                    type: typeof this.fillToolManager,
                    hasSetFillType: this.fillToolManager && typeof this.fillToolManager.setFillType === 'function',
                    hasGetCurrentFillType: this.fillToolManager && typeof this.fillToolManager.getCurrentFillType === 'function'
                },
                overall: {
                    ready: false,
                    message: ''
                }
            };
            
            if (status.fillManager.exists && status.fillToolManager.exists &&
                status.fillManager.hasSetFillType && status.fillToolManager.hasSetFillType) {
                status.overall.ready = true;
                status.overall.message = 'Fill system fully operational';
            } else {
                throw new Error('Fill system not operational - managers not properly initialized');
            }
            
            return status;
        }

        /**
         * Handle fill type selection
         * @param {string} fillType - The fill type to select
         */
        handleFillTypeSelection(fillType) {
            log('🔍 handleFillTypeSelection called with:', fillType);
            
            if (this.fillToolManager && typeof this.fillToolManager.setFillType === 'function') {
                this.fillToolManager.setFillType(fillType);
                log(`✅ Fill type set via FillToolManager: ${fillType}`);
                return true;
            }
            
            if (this.fillManager && typeof this.fillManager.setFillType === 'function') {
                this.fillManager.setFillType(fillType, {});
                log(`✅ Fill type set via FillManager: ${fillType}`);
                return true;
            }
            
            throw new Error(`Fill managers not properly initialized. Cannot set fill type: ${fillType}`);
        }
        
        
        /**
         * Update active state in fill context menu
         */
        updateFillContextMenuActiveState() {
            const menu = document.getElementById('fill-context-menu');
            if (!menu) return;
            
            let currentFillType;
            
            if (this.fillToolManager && typeof this.fillToolManager.getCurrentFillType === 'function') {
                currentFillType = this.fillToolManager.getCurrentFillType();
            } else if (this.fillManager && this.fillManager.currentFill) {
                currentFillType = this.fillManager.currentFill.type;
            } else {
                throw new Error('Fill managers not available to get current fill type');
            }
            
            const menuItems = menu.querySelectorAll('.fill-menu-item');
            
            menuItems.forEach(item => {
                item.classList.remove('active');
                if (item.dataset.fillType === currentFillType) {
                    item.classList.add('active');
                }
            });
        }
        
        /**
         * Get user-friendly fill type name
         * @param {string} fillType - Fill type ID
         * @returns {string} Display name
         */
        getFillTypeName(fillType) {
            const names = {
                flood: 'Flood Fill',
                pattern: 'Pattern Fill',
                gradient: 'Gradient Fill',
                fractal: 'Fractal Fill',
                smart: 'Smart Fill',
                texture: 'Texture Fill'
            };
            return names[fillType] || fillType;
        }
    }

    /**
     * Performance monitoring and optimization service
     * @class PerformanceService
     */
    class PerformanceService {
        constructor(eventBus) {
            this.eventBus = eventBus;
            this.setupCounters();
            this.setupAutoCompact();
            this.setupMemoryIntegration();
        }

        /**
         * Setup performance counters
         */
        setupCounters() {
            this.counters = {
                renders: 0,
                draws: 0
            };
            
            this.limits = {
                memoryMB: 50,
                inactiveTime: 30000,
                renderCount: 1000,
                historyStates: 25
            };
        }

        /**
         * Setup auto-compact system
         */
        setupAutoCompact() {
            this.autoCompactEnabled = true;
            this.lastCompactTime = Date.now();
            
            this.autoCompactInterval = setInterval(() => {
                this.checkAutoCompact();
            }, 15000);
            
            this.initialCompactTimeout = setTimeout(() => this.checkAutoCompact(), 30000);
            
            // Register timers for cleanup
            if (this.eventBus && this.eventBus.emit) {
                this.eventBus.emit('register-timer', this.autoCompactInterval);
                this.eventBus.emit('register-timer', this.initialCompactTimeout);
            }
        }
        
        /**
         * Cleanup auto-compact timers
         */
        destroyAutoCompact() {
            if (this.autoCompactInterval) {
                clearInterval(this.autoCompactInterval);
                this.autoCompactInterval = null;
            }
            if (this.initialCompactTimeout) {
                clearTimeout(this.initialCompactTimeout);
                this.initialCompactTimeout = null;
            }
        }

        /**
         * Setup memory manager integration
         */
        setupMemoryIntegration() {
            // Monitor memory pressure and trigger warnings
            this.memoryCheckInterval = setInterval(() => {
                this.checkMemoryPressure();
            }, 5000);
            
            // Register timer for cleanup
            if (this.eventBus && this.eventBus.emit) {
                this.eventBus.emit('register-timer', this.memoryCheckInterval);
            }
            
            // Listen for memory cleanup events
            this.eventBus.on('memory-cleaned', (data) => {
                // Update performance metrics
                this.lastMemoryCleanup = Date.now();
                this.memoryCleanupCount = (this.memoryCleanupCount || 0) + 1;
            });
            
            // Trigger auto-compact when memory pressure is high
            this.eventBus.on('memory-warning', () => {
                this.performEmergencyCompact();
            });
        }

        /**
         * Check memory pressure and emit warnings
         */
        checkMemoryPressure() {
            const memStats = this.getMemoryUsage();
            const memoryMB = memStats.totalMB;
            
            if (memoryMB > this.limits.memoryMB * 1.5) {
                this.eventBus.emit('memory-warning', {
                    currentMB: memoryMB,
                    limitMB: this.limits.memoryMB,
                    severity: 'critical'
                });
            } else if (memoryMB > this.limits.memoryMB) {
                this.eventBus.emit('memory-warning', {
                    currentMB: memoryMB,
                    limitMB: this.limits.memoryMB,
                    severity: 'high'
                });
            }
        }

        /**
         * Perform emergency compaction
         */
        performEmergencyCompact() {
            this.compact();
            this.eventBus.emit('operation-complete', 'emergency-compact');
            this.eventBus.emit('status', { 
                message: '🚨 Emergency memory compact performed', 
                type: 'warning' 
            });
        }

        /**
         * Increment performance counter
         * @param {string} counter - Counter name
         */
        incrementCounter(counter) {
            if (this.counters.hasOwnProperty(counter)) {
                this.counters[counter]++;
            }
        }

        /**
         * Get performance statistics
         * @returns {Object} Performance statistics
         */
        getStats() {
            return {
                ...this.counters,
                memoryUsage: this.getMemoryUsage(),
                lastCompact: this.lastCompactTime
            };
        }

        /**
         * Get memory usage estimation
         * @returns {Object} Memory usage data
         */
        getMemoryUsage() {
            const imgMem = 256 * 192 * 4; // Canvas image data
            const canvasMem = imgMem; // Canvas buffer
            const jsOverhead = 15000; // JavaScript objects
            
            let totalBytes = imgMem + canvasMem + jsOverhead;
            
            // Add history memory if available
            if (window.historyManager) {
                try {
                    const histMem = window.historyManager.getMemoryUsage();
                    totalBytes += parseFloat(histMem.totalMemoryMB) * 1024 * 1024;
                } catch (e) {
                    // Ignore errors
                }
            }
            
            return {
                totalMB: (totalBytes / (1024 * 1024)).toFixed(2),
                breakdown: {
                    canvas: (imgMem / (1024 * 1024)).toFixed(2),
                    buffer: (canvasMem / (1024 * 1024)).toFixed(2),
                    js: (jsOverhead / (1024 * 1024)).toFixed(2)
                }
            };
        }

        /**
         * Check if auto-compact should run
         */
        checkAutoCompact() {
            if (!this.autoCompactEnabled) return;

            try {
                const currentTime = Date.now();
                const inactiveTime = currentTime - this.lastCompactTime;
                const memStats = this.getMemoryUsage();
                
                const shouldCompact = 
                    parseFloat(memStats.totalMB) > this.limits.memoryMB ||
                    inactiveTime > this.limits.inactiveTime ||
                    this.counters.renders > this.limits.renderCount;
                
                if (shouldCompact) {
                    this.performAutoCompact();
                }
            } catch (err) {
                warn('Auto-compact check error:', err);
            }
        }

        /**
         * Perform auto-compact operation
         */
        performAutoCompact() {
            try {
                const startTime = Date.now();
                const memBefore = this.getMemoryUsage();
                
                // Reset counters
                this.counters.renders = 0;
                this.counters.draws = 0;
                
                // Trigger garbage collection if available
                if (window.gc && typeof window.gc === 'function') {
                    window.gc();
                }
                
                this.lastCompactTime = Date.now();
                
                const duration = Date.now() - startTime;
                const memAfter = this.getMemoryUsage();
                const memSaved = parseFloat(memBefore.totalMB) - parseFloat(memAfter.totalMB);
                
                log(`🧹 Auto-compact: ${memSaved.toFixed(2)}MB freed in ${duration}ms`);
                
                this.eventBus.emit('status', {
                    message: `🧹 Auto-compact: ${memSaved.toFixed(2)}MB freed`,
                    type: 'success'
                });
                
                setTimeout(() => {
                    this.eventBus.emit('status', {
                        message: 'System Ready',
                        type: 'info'
                    });
                }, 3000);
                
            } catch (err) {
                warn('Auto-compact error:', err);
            }
        }

        /**
         * Manual compact operation
         */
        compact() {
            this.performAutoCompact();
        }

        /**
         * Configure auto-compact settings
         * @param {Object} settings - Settings object
         */
        configure(settings) {
            if (settings.enabled !== undefined) {
                this.autoCompactEnabled = settings.enabled;
            }
            if (settings.limits) {
                Object.assign(this.limits, settings.limits);
            }
        }

        /**
         * Destroy performance service - with memory integration cleanup
         */
        destroy() {
            if (this.autoCompactInterval) {
                clearInterval(this.autoCompactInterval);
                this.autoCompactInterval = null;
            }
            
            if (this.memoryCheckInterval) {
                clearInterval(this.memoryCheckInterval);
                this.memoryCheckInterval = null;
            }
            
            // Clear performance counters
            this.counters = null;
            this.limits = null;
        }
    }

    /**
     * Drawing operations service
     * @class DrawingService
     */
    class DrawingService {
        constructor(eventBus, colorManager, stateManager, toolManager) {
            this.eventBus = eventBus;
            this.colorManager = colorManager;
            this.stateManager = stateManager;
            this.toolManager = toolManager;
            
            // Initialize ShapeGenerator with error handling
            try {
                if (typeof ShapeGenerator !== 'undefined') {
                    this.shapeGenerator = new ShapeGenerator();
                    log('✅ ShapeGenerator initialized successfully');
                } else {
                    throw new Error('ShapeGenerator class not available');
                }
            } catch (err) {
                throw new Error(`Failed to initialize ShapeGenerator: ${err.message}`);
            }
            
            // Temporary resource tracking for auto-cleanup
            this.tempArrays = new Set();
            this.tempObjects = new WeakSet();
            
            this.setupEventListeners();
            this.setupAutoCleanup();
        }

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            this.eventBus.on('draw-brush', (data) => this.drawBrush(data));
            this.eventBus.on('draw-line', (data) => this.drawLine(data));
            // Use unified shape system only - old drawShape disabled
            this.eventBus.on('draw-shape', (data) => this.drawShapeEnhanced(data));
            this.eventBus.on('draw-shape-unified', (data) => this.drawShapeEnhanced(data));
            // Route fill operations to FillManager
            this.eventBus.on('flood-fill', (data) => {
                this.fillManager.fill({ ...data, type: 'flood' });
            });
            this.eventBus.on('pattern-fill', (data) => {
                this.fillManager.fill({ ...data, type: 'pattern' });
            });
            this.eventBus.on('gradient-fill', (data) => {
                this.fillManager.fill({ ...data, type: 'gradient' });
            });
            this.eventBus.on('fractal-fill', (data) => {
                this.fillManager.fill({ ...data, type: 'fractal' });
            });
            this.eventBus.on('smart-fill', (data) => {
                this.fillManager.fill({ ...data, type: 'smart' });
            });
            this.eventBus.on('texture-fill', (data) => {
                this.fillManager.fill({ ...data, type: 'texture' });
            });
            this.eventBus.on('fill-operation', (data) => {
                this.fillManager.fill(data);
            });
        }

        /**
         * UNIFIED DRAWING ENGINE - Uses mathematical shape generation
         * This method replaces all individual shape drawing methods with a single
         * unified approach that leverages the ShapeGenerator for mathematical precision
         * @param {string} shapeType - Shape type (line, circle, star, etc.)
         * @param {Object} start - Start position {x, y}
         * @param {Object} end - End position {x, y} 
         * @param {Object} state - Drawing state
         * @param {Object} options - Shape-specific options
         */
        drawShapeUnified(shapeType, start, end, state, options = {}) {
            // Create bounds object for ShapeGenerator
            const bounds = this.trackTempObject({
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y
            });

            // Get current brush size from tool manager if not specified in options
            if (!options.strokeWidth) {
                // Try to get brush size from various sources
                const toolManager = this.getToolManager();
                if (toolManager && toolManager.state && toolManager.state.brushSize) {
                    options.strokeWidth = toolManager.state.brushSize;
                } else {
                    options.strokeWidth = 1; // Default to 1 pixel
                }
            }

            // Generate points using mathematical formulas with stroke width
            const points = this.trackTempArray(
                this.shapeGenerator.generateShape(shapeType, bounds, options)
            );
            
            // Draw all points to the state
            points.forEach(point => {
                this.drawPixel(point.x, point.y, 1, state);
            });

            // Emit state change event
            this.eventBus.emit('state-changed', {
                pixels: state.pixels,
                attributes: state.attributes
            });
            
            // Auto-cleanup after this operation
            this.performDrawingCleanup();
        }

        /**
         * Draw shape to state (compatible with main drawShapeToState method)
         */
        drawShapeToState(state, start, end, shape, options = {}) {
            const colorState = this.colorManager.getState();
            const { erase = false, filled = false } = options;
            
            // Helper method to draw pixel to state with ink/paper support
            const drawPixelToState = (x, y, pixelValue) => {
                if (x >= 0 && x <= 255 && y >= 0 && y <= 191) {
                    state.pixels[y][x] = pixelValue;
                    
                    const cellX = Math.floor(x / 8);
                    const cellY = Math.floor(y / 8);
                    
                    if (cellX >= 0 && cellX < 32 && cellY >= 0 && cellY < 24) {
                        const existingAttr = state.attributes[cellY][cellX];
                        
                        // Always update color attributes when drawing shapes
                        state.attributes[cellY][cellX] = {
                            ink: colorState.inkEnabled ? colorState.ink : existingAttr.ink,
                            paper: colorState.paperEnabled ? colorState.paper : existingAttr.paper,
                            bright: colorState.bright,
                            flash: colorState.flash
                        };
                    }
                }
            };

            try {
                // Ensure ShapeGenerator is properly initialized
                if (!this.shapeGenerator) {
                    warn('ShapeGenerator not initialized, creating new instance');
                    this.shapeGenerator = new ShapeGenerator();
                }

                // Map HTML shape names to generator shape names
                const shapeMap = {
                    'rect': 'rectangle'
                    // arrow-up, arrow-right, arrow-down, arrow-left use their own names
                };

                // Prepare drawing options
                const drawOptions = {
                    strokeWidth: 1,
                    drawMode: erase ? 'paper' : 'ink',
                    filled: filled
                };

                // Try to get brush size from tool manager safely
                try {
                    const toolManager = this.getToolManager();
                    if (toolManager && toolManager.state) {
                        if (toolManager.state.brushSize) {
                            drawOptions.strokeWidth = toolManager.state.brushSize;
                        }
                    }
                } catch (err) {
                    warn('Could not access tool manager for shape options');
                }

                const generatorShape = shapeMap[shape] || shape;

                // Create bounds object for ShapeGenerator
                const bounds = {
                    x1: start.x,
                    y1: start.y,
                    x2: end.x,
                    y2: end.y
                };

                // Generate points using unified system with bounds
                let points;
                if (drawOptions.filled && this.shapeGenerator.isShapeFillable(generatorShape)) {
                    points = this.shapeGenerator.generateFilledShape(generatorShape, bounds, drawOptions);
                } else {
                    points = this.shapeGenerator.generateShape(generatorShape, bounds, drawOptions);
                }
                
                // Draw all points to the state using their pixel values
                points.forEach(point => {
                    const pixelValue = point.pixelValue !== undefined ? point.pixelValue : (erase ? 0 : 1);
                    drawPixelToState(point.x, point.y, pixelValue);
                });

            } catch (err) {
                error(`Failed to draw shape ${shape}:`, err);
            }
        }

        /**
         * Get tool manager instance (helper method)
         */
        getToolManager() {
            // Access tool manager through the main application
            if (typeof window !== 'undefined' && window.app && window.app.toolManager) {
                return window.app.toolManager;
            }
            return null;
        }

        /**
         * Enhanced draw shape method that can use either unified engine or fallback
         * @param {Object} data - Drawing data with shape, start, end, and options
         */
        drawShapeEnhanced(data) {
            const { shape, start, end, erase = false, filled = false, options = {} } = data;
            const state = this.stateManager.getState();
            
            // Map HTML shape names to generator shape names
            const shapeMap = {
                'rect': 'rectangle'
                // arrow-up, arrow-right, arrow-down, arrow-left use their own names
                // pentagon, hexagon, octagon use their own names
            };

            // Direction is handled by specific arrow generation methods

            // Set sides for polygons
            if (shape === 'pentagon') options.sides = 5;
            if (shape === 'hexagon') options.sides = 6;
            if (shape === 'octagon') options.sides = 8;

            const generatorShape = shapeMap[shape] || shape;
            
            try {
                // Merge erase and filled parameters into options
                const drawOptions = { ...options, erase, filled };
                // Use unified drawing engine
                this.drawShapeUnified(generatorShape, start, end, state, drawOptions);
                
                // Update StateManager and emit state change
                this.stateManager.setPixels(state.pixels);
                this.stateManager.setAttributes(state.attributes);
                
                this.eventBus.emit('state-changed', {
                    pixels: state.pixels,
                    attributes: state.attributes
                });
                
                // Note: History saving handled by drawing-stopped event
                
                // Emit status update
                const drawMode = options.erase ? 'paper' : 'ink';
                this.eventBus.emit('status', { 
                    message: `✓ ${shape} drawn in ${drawMode} mode (enhanced)`, 
                    type: 'success' 
                });
                
            } catch (err) {
                warn(`Unified engine failed for ${shape}, falling back to legacy method:`, err);
                // Fallback to existing method
                this.drawShape(data);
            }
        }

        /**
         * BACKWARD COMPATIBILITY WRAPPERS
         * These wrapper methods maintain the existing API while routing to the unified engine
         */

        /**
         * Unified shape drawing method (replaces all individual drawShape* methods)
         * @param {Object} data - Drawing data {shape, start, end, state, options}
         */
        drawShapeGeneric(data) {
            return this.drawShapeEnhanced(data);
        }

        // Backward compatibility: Route all individual shape methods to unified engine
        drawShapeRect(start, end, state) {
            return this.drawShapeEnhanced({shape: 'rect', start, end, state});
        }

        drawShapeCircle(start, end, state) {
            return this.drawShapeEnhanced({shape: 'circle', start, end, state});
        }

        drawShapeEllipse(start, end, state) {
            return this.drawShapeEnhanced({shape: 'ellipse', start, end, state});
        }

        drawShapeTriangle(start, end, state) {
            return this.drawShapeEnhanced({shape: 'triangle', start, end, state});
        }

        drawShapeDiamond(start, end, state) {
            return this.drawShapeEnhanced({shape: 'diamond', start, end, state});
        }

        drawShapeStar(start, end, state) {
            return this.drawShapeEnhanced({shape: 'star', start, end, state});
        }

        drawShapePentagon(start, end, state) {
            return this.drawShapeEnhanced({shape: 'pentagon', start, end, state});
        }

        drawShapeHexagon(start, end, state) {
            return this.drawShapeEnhanced({shape: 'hexagon', start, end, state});
        }

        drawShapeOctagon(start, end, state) {
            return this.drawShapeEnhanced({shape: 'octagon', start, end, state});
        }

        drawShapeArrowUp(start, end, state) {
            return this.drawShapeEnhanced({shape: 'arrow-up', start, end, state});
        }

        drawShapeArrowRight(start, end, state) {
            return this.drawShapeEnhanced({shape: 'arrow-right', start, end, state});
        }

        drawShapeArrowDown(start, end, state) {
            return this.drawShapeEnhanced({shape: 'arrow-down', start, end, state});
        }

        drawShapeArrowLeft(start, end, state) {
            return this.drawShapeEnhanced({shape: 'arrow-left', start, end, state});
        }

        drawShapeCross(start, end, state) {
            return this.drawShapeEnhanced({shape: 'x', start, end, state});
        }

        drawShapePlus(start, end, state) {
            return this.drawShapeEnhanced({shape: 'plus', start, end, state});
        }

        drawShapeHeart(start, end, state) {
            return this.drawShapeEnhanced({shape: 'heart', start, end, state});
        }

        drawShapeLightning(start, end, state) {
            return this.drawShapeEnhanced({shape: 'lightning', start, end, state});
        }

        drawShapeHouse(start, end, state) {
            return this.drawShapeEnhanced({shape: 'house', start, end, state});
        }

        drawShapeMoon(start, end, state) {
            return this.drawShapeEnhanced({shape: 'moon', start, end, state});
        }

        drawShapeFlower(start, end, state) {
            return this.drawShapeEnhanced({shape: 'flower', start, end, state});
        }

        drawShapeGear(start, end, state) {
            return this.drawShapeEnhanced({shape: 'gear', start, end, state});
        }

        drawShapeSpiral(start, end, state) {
            return this.drawShapeEnhanced({shape: 'spiral', start, end, state});
        }

        drawShapeBowtie(start, end, state) {
            return this.drawShapeEnhanced({shape: 'bowtie', start, end, state});
        }

        drawShapeHourglass(start, end, state) {
            return this.drawShapeEnhanced({shape: 'hourglass', start, end, state});
        }

        drawShapeTrapezoid(start, end, state) {
            return this.drawShapeEnhanced({shape: 'trapezoid', start, end, state});
        }

        drawShapeParallelogram(start, end, state) {
            return this.drawShapeEnhanced({shape: 'parallelogram', start, end, state});
        }

        drawShapeKite(start, end, state) {
            return this.drawShapeEnhanced({shape: 'kite', start, end, state});
        }

        // Enhanced generic arrow method that routes to unified engine
        drawShapeArrow(start, end, direction, state) {
            const shape = `arrow-${direction}`;
            return this.drawShapeEnhanced({shape, start, end, state});
        }

        // Enhanced generic polygon method that routes to unified engine  
        drawRegularPolygon(start, end, state, sides) {
            return this.drawShapeEnhanced({
                shape: 'polygon', 
                start, 
                end, 
                state, 
                options: {sides}
            });
        }

        /**
         * Setup automatic memory cleanup for drawing operations
         */
        setupAutoCleanup() {
            // Auto-cleanup after drawing operations
            this.eventBus.on('state-changed', () => {
                this.performDrawingCleanup();
            });
            
            // Auto-cleanup after shape operations
            this.eventBus.on('draw-shape-unified', () => {
                this.performDrawingCleanup();
            });
            
            // Respond to memory manager cleanup requests
            this.eventBus.on('clear-shape-caches', () => {
                this.clearShapeGeneratorCaches();
            });
            
            this.eventBus.on('emergency-memory-cleanup', () => {
                this.performEmergencyDrawingCleanup();
            });
        }

        /**
         * Perform drawing-specific memory cleanup
         */
        performDrawingCleanup() {
            // Clear temporary arrays
            this.tempArrays.forEach(array => {
                if (Array.isArray(array)) {
                    array.length = 0;
                }
            });
            this.tempArrays.clear();
            
            // Clear any cached shape data
            if (this.shapeGenerator && typeof this.shapeGenerator.clearCache === 'function') {
                this.shapeGenerator.clearCache();
            }
        }

        /**
         * Clear shape generator caches
         */
        clearShapeGeneratorCaches() {
            if (this.shapeGenerator) {
                // Clear any internal caches if they exist
                if (this.shapeGenerator.shapes instanceof Map) {
                    // Don't clear the shape definitions, just any cached results
                }
            }
        }

        /**
         * Emergency cleanup for drawing service
         */
        performEmergencyDrawingCleanup() {
            this.performDrawingCleanup();
            
            // More aggressive cleanup if needed
            // Note: tempObjects already initialized in constructor
            
            // Force nullify temporary references
            if (this.lastDrawnPoints) {
                this.lastDrawnPoints = null;
            }
        }

        /**
         * Track temporary array for auto-cleanup
         */
        trackTempArray(array) {
            this.tempArrays.add(array);
            return array;
        }

        /**
         * Track temporary object for auto-cleanup
         */
        trackTempObject(obj) {
            this.tempObjects.add(obj);
            return obj;
        }

        /**
         * Draw with brush
         * @param {Object} data - Drawing data
         */
        drawBrush(data) {
            const { x, y, value, size } = data;
            const state = this.stateManager.getState();
            
            // Get brush shape from tool manager state for consistency during continuous drawing
            const brushShape = (this.toolManager && this.toolManager.state && this.toolManager.state.brushShape) ? this.toolManager.state.brushShape : 'round';
            
            if (brushShape === 'square') {
                // Square brush
                this.drawSquareBrush(x, y, value, size, state);
            } else if (size === 1) {
                // Single pixel round brush - fastest case
                this.drawPixel(x, y, value, state);
            } else {
                // Round brush (default)
                this.drawRoundBrush(x, y, value, size, state);
            }
            
            // Update StateManager's internal state directly
            this.stateManager.setPixels(state.pixels);
            this.stateManager.setAttributes(state.attributes);
            
            this.eventBus.emit('state-changed', {
                pixels: state.pixels,
                attributes: state.attributes
            });
        }

        /**
         * Draw round brush shape
         */
        drawRoundBrush(x, y, value, size, state) {
            // Multi-pixel circular brush with improved algorithm
            const centerRadius = size / 2;
            const brushRadius = Math.ceil(centerRadius);
            
            for (let deltaY = -brushRadius; deltaY <= brushRadius; deltaY++) {
                for (let deltaX = -brushRadius; deltaX <= brushRadius; deltaX++) {
                    const targetX = x + deltaX;
                    const targetY = y + deltaY;
                    const distanceFromCenter = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    
                    // Improved circular brush shape with anti-aliasing-like smoothing
                    if (distanceFromCenter <= centerRadius) {
                        this.drawPixel(targetX, targetY, value, state);
                    } else if (distanceFromCenter <= centerRadius + 0.5) {
                        // Edge pixels - only draw if they improve the circular appearance
                        const edgeWeight = centerRadius + 0.5 - distanceFromCenter;
                        if (edgeWeight > 0.25) {
                            this.drawPixel(targetX, targetY, value, state);
                        }
                    }
                }
            }
        }

        /**
         * Draw square brush shape
         */
        drawSquareBrush(x, y, value, size, state) {
            // For square brush, create a size x size square centered on the click point
            const halfSize = Math.floor(size / 2);
            const start = -halfSize;
            const end = halfSize;
            
            // For even sizes, adjust to ensure proper square shape
            const actualEnd = size % 2 === 0 ? end - 1 : end;
            
            for (let deltaY = start; deltaY <= actualEnd; deltaY++) {
                for (let deltaX = start; deltaX <= actualEnd; deltaX++) {
                    const targetX = x + deltaX;
                    const targetY = y + deltaY;
                    this.drawPixel(targetX, targetY, value, state);
                }
            }
        }

        /**
         * Draw a line with brush thickness support
         * @param {Object} data - Line data
         */
        drawLine(data) {
            const { start, end, erase } = data;
            const state = this.stateManager.getState();
            
            // Get brush size and shape from tool manager
            const toolManager = this.getToolManager();
            const brushSize = (toolManager && toolManager.state && toolManager.state.brushSize) ? toolManager.state.brushSize : 1;
            const brushShape = (toolManager && toolManager.state && toolManager.state.brushShape) ? toolManager.state.brushShape : 'round';
            
            if (brushSize === 1 && brushShape === 'round') {
                // Use fast single-pixel line drawing for size 1 round brush
                this.drawLineSinglePixel(start, end, state, erase);
            } else {
                // Use brush-aware line drawing for size > 1 or square brush
                this.drawLineWithBrush(start, end, state, erase, brushSize, brushShape);
            }
            
            // Update StateManager's internal state directly
            this.stateManager.setPixels(state.pixels);
            this.stateManager.setAttributes(state.attributes);
            
            this.eventBus.emit('state-changed', {
                pixels: state.pixels,
                attributes: state.attributes
            });
        }

        /**
         * Draw single-pixel line (optimized for brush size 1)
         */
        drawLineSinglePixel(start, end, state, erase) {
            const deltaX = Math.abs(end.x - start.x);
            const deltaY = Math.abs(end.y - start.y);
            const stepX = start.x < end.x ? 1 : -1;
            const stepY = start.y < end.y ? 1 : -1;
            
            let errorAccumulator = deltaX - deltaY;
            let currentX = start.x;
            let currentY = start.y;
            
            while (true) {
                this.drawPixel(currentX, currentY, erase ? 0 : 1, state);
                
                if (currentX === end.x && currentY === end.y) break;
                
                const doubleError = 2 * errorAccumulator;
                if (doubleError > -deltaY) {
                    errorAccumulator -= deltaY;
                    currentX += stepX;
                }
                if (doubleError < deltaX) {
                    errorAccumulator += deltaX;
                    currentY += stepY;
                }
            }
        }

        /**
         * Draw thick line using unified shape generator
         */
        drawLineThick(start, end, state, erase, brushSize) {
            const bounds = {
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y
            };
            
            const options = { 
                strokeWidth: brushSize,
                drawMode: erase ? 'paper' : 'ink'
            };
            const points = this.shapeGenerator.generateShape('line', bounds, options);
            
            points.forEach(point => {
                // Use pixelValue from unified system, or fallback to erase logic
                const pixelValue = point.pixelValue !== undefined ? point.pixelValue : (erase ? 0 : 1);
                this.drawPixel(point.x, point.y, pixelValue, state);
            });
        }

        /**
         * Draw a line by applying brush shape at each point along the line
         * @param {Object} start - Start position {x, y}
         * @param {Object} end - End position {x, y} 
         * @param {Object} state - Drawing state
         * @param {boolean} erase - Whether to erase (use paper color)
         * @param {number} brushSize - Size of brush
         * @param {string} brushShape - Shape of brush ('round' or 'square')
         */
        drawLineWithBrush(start, end, state, erase, brushSize, brushShape) {
            // Calculate line points using Bresenham's line algorithm
            const dx = Math.abs(end.x - start.x);
            const dy = Math.abs(end.y - start.y);
            const sx = start.x < end.x ? 1 : -1;
            const sy = start.y < end.y ? 1 : -1;
            let err = dx - dy;
            
            let x = start.x;
            let y = start.y;
            
            const value = erase ? 0 : 1;
            
            while (true) {
                // Apply brush shape at current point
                if (brushShape === 'square') {
                    this.drawSquareBrush(x, y, value, brushSize, state);
                } else {
                    this.drawRoundBrush(x, y, value, brushSize, state);
                }
                
                // Check if we've reached the end point
                if (x === end.x && y === end.y) break;
                
                // Bresenham's line algorithm step
                const e2 = 2 * err;
                if (e2 > -dy) {
                    err -= dy;
                    x += sx;
                }
                if (e2 < dx) {
                    err += dx;
                    y += sy;
                }
            }
        }

        /**
         * Draw a shape - UNIFIED VERSION v3.0
         * Uses advanced mathematical shape generation with unified behavior
         * @param {Object} data - Shape data {start, end, shape, erase}
         */
        drawShape(data) {
            const { start, end, shape, erase = false } = data;
            const state = this.stateManager.getState();
            
            try {
                // Use the same unified drawing method as preview
                this.drawShapeToState(state, start, end, shape, { erase });
                
                // CRITICAL FIX: Directly update StateManager's internal state
                // This ensures the state persists for subsequent operations
                this.stateManager.setPixels(state.pixels);
                this.stateManager.setAttributes(state.attributes);
                
                // Then emit the state change for rendering
                this.eventBus.emit('state-changed', {
                    pixels: state.pixels,
                    attributes: state.attributes
                });
                
                // Note: History saving handled by drawing-stopped event
                
                // Emit status update
                const shapeCategory = this.shapeGenerator.getShapeCategory(shape);
                const drawMode = erase ? 'paper' : 'ink';
                const anchorType = shapeCategory === 'CENTER_OUT' ? 'center-out' : 'anchor-drag';
                
                this.eventBus.emit('status', { 
                    message: `✓ ${shape} drawn in ${drawMode} mode (${anchorType})`, 
                    type: 'success' 
                });
                
            } catch (err) {
                error(`❌ Failed to draw shape ${shape}:`, err);
                this.eventBus.emit('status', { 
                    message: `❌ Failed to draw ${shape}`, 
                    type: 'error' 
                });
            }
        }

        /**
         * Unified shape drawing method with ink/paper support
         * @param {string} shapeType - Type of shape to draw
         * @param {Object} start - Start/anchor point {x, y}
         * @param {Object} end - End/drag point {x, y}
         * @param {Object} state - Drawing state
         * @param {Object} options - Drawing options {erase, strokeWidth}
         */
        drawShapeUnified(shapeType, start, end, state, options = {}) {
            const { erase = false, filled = false } = options;
            
            try {
                // Use the new unified shape generator
                this.drawShapeToState(state, start, end, shapeType, { erase, filled });
                
                log(`✓ Unified shape drawn: ${shapeType} (${erase ? 'paper' : 'ink'} mode)`);
                
            } catch (err) {
                error(`❌ Unified shape drawing failed for ${shapeType}:`, err);
                throw err;
            }
        }

        /**
         * DEPRECATED: Legacy flood fill operation - kept for backward compatibility
         * New fill operations are handled by FillManager (js/managers/FillManager.js)
         * This method is maintained as a fallback for any direct calls
         * @param {Object} data - Fill data
         */
        floodFill(data) {
            const { x, y, erase } = data;
            const state = this.stateManager.getState();
            
            if (x < 0 || x > 255 || y < 0 || y > 191) return;
            
            const target = state.pixels[y][x];
            const fill = erase ? 0 : 1;
            
            if (target === fill) return;
            
            const stack = [{ x, y }];
            const visited = new Set();
            let changed = 0;
            const FILL_LIMIT = 50000;
            
            while (stack.length > 0 && changed < FILL_LIMIT) {
                const { x: currentX, y: currentY } = stack.pop();
                const key = `${currentX},${currentY}`;
                
                if (visited.has(key)) continue;
                if (currentX < 0 || currentX > 255 || currentY < 0 || currentY > 191) continue;
                if (state.pixels[currentY][currentX] !== target) continue;
                
                visited.add(key);
                this.drawPixel(currentX, currentY, fill, state);
                changed++;
                
                // Add neighbors
                stack.push({ x: currentX + 1, y: currentY });
                stack.push({ x: currentX - 1, y: currentY });
                stack.push({ x: currentX, y: currentY + 1 });
                stack.push({ x: currentX, y: currentY - 1 });
            }
            
            if (changed >= FILL_LIMIT) {
                this.eventBus.emit('status', { message: '⚠ Fill limited for performance', type: 'warning' });
            } else {
                const fillType = erase ? 'erased' : 'filled';
                const targetType = target === 0 ? 'paper' : 'ink';
                this.eventBus.emit('status', { 
                    message: `✓ ${targetType} area ${fillType} (${changed} pixels)`, 
                    type: 'success' 
                });
            }
            
            // Save to history for undo functionality
            this.stateManager.saveState('flood-fill');
            
            this.eventBus.emit('state-changed', {
                pixels: state.pixels,
                attributes: state.attributes
            });
        }

        /**
         * Draw a single pixel
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {number} value - Pixel value
         * @param {Object} state - Current state
         */
        drawPixel(x, y, value, state) {
            if (x >= 0 && x <= 255 && y >= 0 && y <= 191) {
                state.pixels[y][x] = value;
                
                const cellX = Math.floor(x / 8);
                const cellY = Math.floor(y / 8);
                
                if (cellX >= 0 && cellX < 32 && cellY >= 0 && cellY < 24) {
                    const colorState = this.colorManager.getState();
                    const existingAttr = state.attributes[cellY][cellX];
                    
                    state.attributes[cellY][cellX] = {
                        ink: colorState.inkEnabled ? colorState.ink : existingAttr.ink,
                        paper: colorState.paperEnabled ? colorState.paper : existingAttr.paper,
                        bright: colorState.bright,
                        flash: colorState.flash
                    };
                }
            }
        }

        /**
         * Set a pixel (convenience method for shape drawing)
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {Object} state - Current state
         */
        setPixel(x, y, state) {
            this.drawPixel(x, y, 1, state);
        }

        /**
         * Clear a pixel (convenience method for shape drawing)
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {Object} state - Current state
         */
        clearPixel(x, y, state) {
            this.drawPixel(x, y, 0, state);
        }

        /**
         * Draw shape line
         * @param {Object} start - Start position
         * @param {Object} end - End position
         * @param {Object} state - Current state
         */
        drawShapeLine(start, end, state) {
            this.drawLine({ start, end, erase: false });
        }

        /**
         * Draw shape rectangle
         * @param {Object} start - Start position
         * @param {Object} end - End position
         * @param {Object} state - Current state
         */
        drawShapeRect(start, end, state) {
            const left = Math.min(start.x, end.x);
            const right = Math.max(start.x, end.x);
            const top = Math.min(start.y, end.y);
            const bottom = Math.max(start.y, end.y);
            
            // Draw rectangle outline
            for (let x = left; x <= right; x++) {
                this.drawPixel(x, top, 1, state);
                this.drawPixel(x, bottom, 1, state);
            }
            for (let y = top; y <= bottom; y++) {
                this.drawPixel(left, y, 1, state);
                this.drawPixel(right, y, 1, state);
            }
        }

        /**
         * Draw shape circle
         * @param {Object} start - Start position
         * @param {Object} end - End position
         * @param {Object} state - Current state
         */
        drawShapeCircle(start, end, state) {
            const centerX = Math.round(start.x);
            const centerY = Math.round(start.y);
            const radius = Math.round(Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2));
            
            if (radius > 0) {
                let x = 0;
                let y = radius;
                let d = 3 - 2 * radius;
                
                const plotCirclePoints = (cx, cy, px, py) => {
                    this.drawPixel(cx + px, cy + py, 1, state);
                    this.drawPixel(cx + px, cy - py, 1, state);
                    this.drawPixel(cx - px, cy + py, 1, state);
                    this.drawPixel(cx - px, cy - py, 1, state);
                    this.drawPixel(cx + py, cy + px, 1, state);
                    this.drawPixel(cx + py, cy - px, 1, state);
                    this.drawPixel(cx - py, cy + px, 1, state);
                    this.drawPixel(cx - py, cy - px, 1, state);
                };
                
                while (x <= y) {
                    plotCirclePoints(centerX, centerY, x, y);
                    x++;
                    if (d > 0) {
                        y--;
                        d = d + 4 * (x - y) + 10;
                    } else {
                        d = d + 4 * x + 6;
                    }
                }
            }
        }

        /**
         * Draw shape ellipse
         * @param {Object} start - Start position
         * @param {Object} end - End position
         * @param {Object} state - Current state
         */
        drawShapeEllipse(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const a = Math.abs(end.x - start.x) / 2; // Semi-major axis
            const b = Math.abs(end.y - start.y) / 2; // Semi-minor axis
            
            if (a === 0 && b === 0) return;
            
            // Use Bresenham's ellipse algorithm
            let x = 0;
            let y = Math.round(b);
            let a2 = a * a;
            let b2 = b * b;
            let crit1 = -(a2 / 4 + a % 2 + b2);
            let crit2 = -(b2 / 4 + b % 2 + a2);
            let crit3 = -(b2 / 4 + b % 2);
            let t = -a2 * y;
            let dxt = 2 * b2 * x;
            let dyt = -2 * a2 * y;
            let d2xt = 2 * b2;
            let d2yt = 2 * a2;

            const plotEllipsePoints = (cx, cy, x, y) => {
                this.drawPixel(cx + x, cy + y, 1, state);
                this.drawPixel(cx - x, cy + y, 1, state);
                this.drawPixel(cx + x, cy - y, 1, state);
                this.drawPixel(cx - x, cy - y, 1, state);
            };

            while (y >= 0 && x <= a) {
                plotEllipsePoints(centerX, centerY, Math.round(x), Math.round(y));
                
                if (t + b2 * x <= crit1 || t + a2 * y <= crit3) {
                    x++;
                    dxt += d2xt;
                    t += dxt;
                } else if (t - a2 * y > crit2) {
                    y--;
                    dyt += d2yt;
                    t += dyt;
                } else {
                    x++;
                    y--;
                    dxt += d2xt;
                    dyt += d2yt;
                    t += dxt;
                    t += dyt;
                }
            }
        }

        /**
         * Draw shape triangle
         */
        drawShapeTriangle(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            
            // Draw triangle: top vertex, bottom left, bottom right
            this.drawShapeLine({x: centerX, y: topY}, {x: leftX, y: bottomY}, state);
            this.drawShapeLine({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, state);
            this.drawShapeLine({x: rightX, y: bottomY}, {x: centerX, y: topY}, state);
        }

        /**
         * Draw shape diamond
         */
        drawShapeDiamond(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const halfWidth = Math.abs(end.x - start.x) / 2;
            const halfHeight = Math.abs(end.y - start.y) / 2;
            
            const top = {x: centerX, y: centerY - halfHeight};
            const right = {x: centerX + halfWidth, y: centerY};
            const bottom = {x: centerX, y: centerY + halfHeight};
            const left = {x: centerX - halfWidth, y: centerY};
            
            this.drawShapeLine(top, right, state);
            this.drawShapeLine(right, bottom, state);
            this.drawShapeLine(bottom, left, state);
            this.drawShapeLine(left, top, state);
        }

        /**
         * Draw shape star (5-pointed)
         */
        drawShapeStar(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            // Safety check for valid radius
            if (radius <= 0 || !isFinite(radius)) {
                warn('Invalid radius for star shape:', radius);
                return;
            }
            
            const points = [];
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI) / 5 - Math.PI / 2;
                const r = i % 2 === 0 ? radius : radius * 0.4;
                const x = Math.round(centerX + r * Math.cos(angle));
                const y = Math.round(centerY + r * Math.sin(angle));
                
                // Safety check for valid coordinates
                if (!isFinite(x) || !isFinite(y)) {
                    warn('Invalid star point coordinates:', {x, y, angle, r});
                    continue;
                }
                
                points.push({ x, y });
            }
            
            // Only draw if we have valid points
            if (points.length < 3) {
                warn('Insufficient points for star shape');
                return;
            }
            
            for (let i = 0; i < points.length; i++) {
                const next = (i + 1) % points.length;
                this.drawShapeLine(points[i], points[next], state);
            }
        }



        /**
         * Unified arrow drawing method - handles all directions
         * @param {Object} start - Start coordinates
         * @param {Object} end - End coordinates
         * @param {string} direction - Arrow direction: 'up', 'right', 'down', 'left'
         * @param {Object} state - Drawing state
         */
        drawShapeArrow(start, end, direction, state) {
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            
            // Direction-specific configuration
            const configs = {
                'up': {
                    arrowSize: Math.round(width * 0.6),
                    shaftSize: Math.round(width * 0.3),
                    headLength: Math.round(height * 0.4),
                    isVertical: true,
                    tipPos: { x: centerX, y: topY },
                    headBase: topY + Math.round(height * 0.4),
                    shaftStart: { x: centerX - Math.round(width * 0.15), y: topY + Math.round(height * 0.4) },
                    shaftEnd: { x: centerX + Math.round(width * 0.15), y: bottomY }
                },
                'right': {
                    arrowSize: Math.round(height * 0.6),
                    shaftSize: Math.round(height * 0.3),
                    headLength: Math.round(width * 0.4),
                    isVertical: false,
                    tipPos: { x: rightX, y: centerY },
                    headBase: rightX - Math.round(width * 0.4),
                    shaftStart: { x: leftX, y: centerY - Math.round(height * 0.15) },
                    shaftEnd: { x: rightX - Math.round(width * 0.4), y: centerY + Math.round(height * 0.15) }
                },
                'down': {
                    arrowSize: Math.round(width * 0.6),
                    shaftSize: Math.round(width * 0.3),
                    headLength: Math.round(height * 0.4),
                    isVertical: true,
                    tipPos: { x: centerX, y: bottomY },
                    headBase: bottomY - Math.round(height * 0.4),
                    shaftStart: { x: centerX - Math.round(width * 0.15), y: topY },
                    shaftEnd: { x: centerX + Math.round(width * 0.15), y: bottomY - Math.round(height * 0.4) }
                },
                'left': {
                    arrowSize: Math.round(height * 0.6),
                    shaftSize: Math.round(height * 0.3),
                    headLength: Math.round(width * 0.4),
                    isVertical: false,
                    tipPos: { x: leftX, y: centerY },
                    headBase: leftX + Math.round(width * 0.4),
                    shaftStart: { x: leftX + Math.round(width * 0.4), y: centerY - Math.round(height * 0.15) },
                    shaftEnd: { x: rightX, y: centerY + Math.round(height * 0.15) }
                }
            };
            
            const config = configs[direction];
            if (!config) {
                warn(`Invalid arrow direction: ${direction}`);
                return;
            }
            
            // Draw arrow head
            this._drawArrowHead(config, state);
            
            // Draw arrow shaft
            this._drawArrowShaft(config, state);
        }
        
        /**
         * Draw arrow head triangle
         * @private
         */
        _drawArrowHead(config, state) {
            const { tipPos, arrowSize, headLength, isVertical } = config;
            
            if (isVertical) {
                // Vertical arrows (up/down)
                const baseY = config.headBase;
                const leftHead = { x: tipPos.x - arrowSize/2, y: baseY };
                const rightHead = { x: tipPos.x + arrowSize/2, y: baseY };
                
                this.drawShapeLine(tipPos, leftHead, state);
                this.drawShapeLine(tipPos, rightHead, state);
                this.drawShapeLine(leftHead, rightHead, state);
            } else {
                // Horizontal arrows (left/right)
                const baseX = config.headBase;
                const topHead = { x: baseX, y: tipPos.y - arrowSize/2 };
                const bottomHead = { x: baseX, y: tipPos.y + arrowSize/2 };
                
                this.drawShapeLine(tipPos, topHead, state);
                this.drawShapeLine(tipPos, bottomHead, state);
                this.drawShapeLine(topHead, bottomHead, state);
            }
        }
        
        /**
         * Draw arrow shaft rectangle
         * @private
         */
        _drawArrowShaft(config, state) {
            const { shaftStart, shaftEnd, isVertical } = config;
            
            if (isVertical) {
                // Vertical shaft
                this.drawShapeLine(shaftStart, { x: shaftStart.x, y: shaftEnd.y }, state);
                this.drawShapeLine({ x: shaftEnd.x, y: shaftStart.y }, shaftEnd, state);
                this.drawShapeLine({ x: shaftStart.x, y: shaftEnd.y }, { x: shaftEnd.x, y: shaftEnd.y }, state);
            } else {
                // Horizontal shaft
                this.drawShapeLine(shaftStart, { x: shaftEnd.x, y: shaftStart.y }, state);
                this.drawShapeLine({ x: shaftStart.x, y: shaftEnd.y }, shaftEnd, state);
                this.drawShapeLine({ x: shaftStart.x, y: shaftStart.y }, { x: shaftStart.x, y: shaftEnd.y }, state);
            }
        }

        // Backward compatibility methods (deprecated)
        drawShapeArrowUp(start, end, state) { return this.drawShapeArrow(start, end, 'up', state); }
        drawShapeArrowRight(start, end, state) { return this.drawShapeArrow(start, end, 'right', state); }
        drawShapeArrowDown(start, end, state) { return this.drawShapeArrow(start, end, 'down', state); }
        drawShapeArrowLeft(start, end, state) { return this.drawShapeArrow(start, end, 'left', state); }

        /**
         * Draw X shape
         */
        drawShapeCross(start, end, state) {
            // Draw diagonal lines from corners
            this.drawShapeLine(start, end, state);
            this.drawShapeLine({x: start.x, y: end.y}, {x: end.x, y: start.y}, state);
        }

        /**
         * Draw plus (+) shape
         */
        drawShapePlus(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            
            // Horizontal line
            this.drawShapeLine({x: leftX, y: centerY}, {x: rightX, y: centerY}, state);
            // Vertical line
            this.drawShapeLine({x: centerX, y: topY}, {x: centerX, y: bottomY}, state);
        }

        /**
         * Draw heart shape
         */
        drawShapeHeart(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
            const scale = Math.min(width, height) / 16;
            
            if (scale <= 0 || !isFinite(scale)) return;
            
            // Heart shape using bezier-like curves approximated with lines
            const points = [];
            for (let t = 0; t <= Math.PI * 2; t += 0.1) {
                const x = 16 * Math.pow(Math.sin(t), 3) * scale;
                const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * scale;
                const px = Math.round(centerX + x);
                const py = Math.round(centerY + y);
                if (isFinite(px) && isFinite(py)) points.push({x: px, y: py});
            }
            
            // Draw heart outline
            for (let i = 0; i < points.length - 1; i++) {
                this.drawShapeLine(points[i], points[i + 1], state);
            }
        }

        /**
         * Draw lightning shape
         */
        drawShapeLightning(start, end, state) {
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
            const leftX = Math.min(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            
            if (width <= 0 || height <= 0) return;
            
            // Lightning bolt path
            const points = [
                {x: leftX + width * 0.3, y: topY},
                {x: leftX + width * 0.1, y: topY + height * 0.4},
                {x: leftX + width * 0.5, y: topY + height * 0.4},
                {x: leftX + width * 0.2, y: topY + height},
                {x: leftX + width * 0.7, y: topY + height * 0.6},
                {x: leftX + width * 0.4, y: topY + height * 0.6},
                {x: leftX + width * 0.7, y: topY}
            ];
            
            // Draw lightning path
            for (let i = 0; i < points.length - 1; i++) {
                this.drawShapeLine(points[i], points[i + 1], state);
            }
            this.drawShapeLine(points[points.length - 1], points[0], state);
        }

        /**
         * Draw house shape
         */
        drawShapeHouse(start, end, state) {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const width = rightX - leftX;
            const height = bottomY - topY;
            
            if (width <= 0 || height <= 0) return;
            
            const roofHeight = Math.round(height * 0.4);
            const wallTop = topY + roofHeight;
            const centerX = Math.round((leftX + rightX) / 2);
            
            // Roof triangle
            this.drawShapeLine({x: leftX, y: wallTop}, {x: centerX, y: topY}, state);
            this.drawShapeLine({x: centerX, y: topY}, {x: rightX, y: wallTop}, state);
            this.drawShapeLine({x: leftX, y: wallTop}, {x: rightX, y: wallTop}, state);
            
            // Walls
            this.drawShapeLine({x: leftX, y: wallTop}, {x: leftX, y: bottomY}, state);
            this.drawShapeLine({x: rightX, y: wallTop}, {x: rightX, y: bottomY}, state);
            this.drawShapeLine({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, state);
            
            // Door
            const doorWidth = Math.round(width * 0.25);
            const doorHeight = Math.round(height * 0.3);
            const doorX = centerX - doorWidth / 2;
            const doorY = bottomY - doorHeight;
            this.drawShapeRect({x: doorX, y: doorY}, {x: doorX + doorWidth, y: bottomY}, state);
        }

        /**
         * Draw moon shape (crescent)
         */
        drawShapeMoon(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            if (radius <= 0 || !isFinite(radius)) return;
            
            // Outer circle (full moon)
            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                const x = Math.round(centerX + radius * Math.cos(angle));
                const y = Math.round(centerY + radius * Math.sin(angle));
                if (isFinite(x) && isFinite(y)) {
                    this.setPixel(x, y, state);
                }
            }
            
            // Inner circle (to create crescent effect)
            const offsetX = radius * 0.3;
            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                const x = Math.round(centerX + offsetX + (radius * 0.8) * Math.cos(angle));
                const y = Math.round(centerY + (radius * 0.8) * Math.sin(angle));
                if (isFinite(x) && isFinite(y) && x < centerX + radius) {
                    this.clearPixel(x, y, state);
                }
            }
        }

        /**
         * Draw flower shape
         */
        drawShapeFlower(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            if (radius <= 0 || !isFinite(radius)) return;
            
            // Draw 6 petals
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6;
                const petalRadius = radius * 0.7;
                const petalCenterX = centerX + petalRadius * Math.cos(angle);
                const petalCenterY = centerY + petalRadius * Math.sin(angle);
                
                // Draw petal as small circle
                for (let petalAngle = 0; petalAngle < Math.PI * 2; petalAngle += 0.2) {
                    const x = Math.round(petalCenterX + (radius * 0.3) * Math.cos(petalAngle));
                    const y = Math.round(petalCenterY + (radius * 0.3) * Math.sin(petalAngle));
                    if (isFinite(x) && isFinite(y)) {
                        this.setPixel(x, y, state);
                    }
                }
            }
            
            // Center circle
            for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
                const x = Math.round(centerX + (radius * 0.2) * Math.cos(angle));
                const y = Math.round(centerY + (radius * 0.2) * Math.sin(angle));
                if (isFinite(x) && isFinite(y)) {
                    this.setPixel(x, y, state);
                }
            }
        }

        /**
         * Draw gear shape
         */
        drawShapeGear(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            if (radius <= 0 || !isFinite(radius)) return;
            
            const teeth = 8;
            const innerRadius = radius * 0.7;
            const outerRadius = radius;
            
            // Draw gear teeth
            for (let i = 0; i < teeth; i++) {
                const angle1 = (i * Math.PI * 2) / teeth;
                const angle2 = ((i + 0.3) * Math.PI * 2) / teeth;
                const angle3 = ((i + 0.7) * Math.PI * 2) / teeth;
                const angle4 = ((i + 1) * Math.PI * 2) / teeth;
                
                // Inner arc
                const x1 = Math.round(centerX + innerRadius * Math.cos(angle1));
                const y1 = Math.round(centerY + innerRadius * Math.sin(angle1));
                const x2 = Math.round(centerX + innerRadius * Math.cos(angle2));
                const y2 = Math.round(centerY + innerRadius * Math.sin(angle2));
                
                // Outer arc  
                const x3 = Math.round(centerX + outerRadius * Math.cos(angle2));
                const y3 = Math.round(centerY + outerRadius * Math.sin(angle2));
                const x4 = Math.round(centerX + outerRadius * Math.cos(angle3));
                const y4 = Math.round(centerY + outerRadius * Math.sin(angle3));
                
                // Inner arc
                const x5 = Math.round(centerX + innerRadius * Math.cos(angle3));
                const y5 = Math.round(centerY + innerRadius * Math.sin(angle3));
                const x6 = Math.round(centerX + innerRadius * Math.cos(angle4));
                const y6 = Math.round(centerY + innerRadius * Math.sin(angle4));
                
                // Draw tooth
                this.drawShapeLine({x: x1, y: y1}, {x: x2, y: y2}, state);
                this.drawShapeLine({x: x2, y: y2}, {x: x3, y: y3}, state);
                this.drawShapeLine({x: x3, y: y3}, {x: x4, y: y4}, state);
                this.drawShapeLine({x: x4, y: y4}, {x: x5, y: y5}, state);
                this.drawShapeLine({x: x5, y: y5}, {x: x6, y: y6}, state);
            }
        }

        /**
         * Draw spiral shape
         */
        drawShapeSpiral(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const maxRadius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            if (maxRadius <= 0 || !isFinite(maxRadius)) return;
            
            let prevX = centerX, prevY = centerY;
            
            // Draw spiral from center outward
            for (let angle = 0; angle < Math.PI * 6; angle += 0.1) {
                const radius = (angle / (Math.PI * 6)) * maxRadius;
                const x = Math.round(centerX + radius * Math.cos(angle));
                const y = Math.round(centerY + radius * Math.sin(angle));
                
                if (isFinite(x) && isFinite(y)) {
                    this.drawShapeLine({x: prevX, y: prevY}, {x: x, y: y}, state);
                    prevX = x;
                    prevY = y;
                }
            }
        }

        /**
         * Draw bowtie shape
         */
        drawShapeBowtie(start, end, state) {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const centerX = Math.round((leftX + rightX) / 2);
            const centerY = Math.round((topY + bottomY) / 2);
            
            // Draw bowtie as two triangles connected at center
            // Top triangle
            this.drawShapeLine({x: leftX, y: topY}, {x: rightX, y: topY}, state);
            this.drawShapeLine({x: leftX, y: topY}, {x: centerX, y: centerY}, state);
            this.drawShapeLine({x: rightX, y: topY}, {x: centerX, y: centerY}, state);
            
            // Bottom triangle
            this.drawShapeLine({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, state);
            this.drawShapeLine({x: leftX, y: bottomY}, {x: centerX, y: centerY}, state);
            this.drawShapeLine({x: rightX, y: bottomY}, {x: centerX, y: centerY}, state);
        }

        /**
         * Draw hourglass shape
         */
        drawShapeHourglass(start, end, state) {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const centerX = Math.round((leftX + rightX) / 2);
            const centerY = Math.round((topY + bottomY) / 2);
            
            // Top triangle (inverted)
            this.drawShapeLine({x: leftX, y: topY}, {x: rightX, y: topY}, state);
            this.drawShapeLine({x: leftX, y: topY}, {x: centerX, y: centerY}, state);
            this.drawShapeLine({x: rightX, y: topY}, {x: centerX, y: centerY}, state);
            
            // Bottom triangle
            this.drawShapeLine({x: centerX, y: centerY}, {x: leftX, y: bottomY}, state);
            this.drawShapeLine({x: centerX, y: centerY}, {x: rightX, y: bottomY}, state);
            this.drawShapeLine({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, state);
        }

        /**
         * Draw trapezoid shape
         */
        drawShapeTrapezoid(start, end, state) {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const width = rightX - leftX;
            const inset = Math.round(width * 0.2);
            
            // Trapezoid with narrower top
            this.drawShapeLine({x: leftX + inset, y: topY}, {x: rightX - inset, y: topY}, state);
            this.drawShapeLine({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, state);
            this.drawShapeLine({x: leftX + inset, y: topY}, {x: leftX, y: bottomY}, state);
            this.drawShapeLine({x: rightX - inset, y: topY}, {x: rightX, y: bottomY}, state);
        }

        /**
         * Draw parallelogram shape
         */
        drawShapeParallelogram(start, end, state) {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const width = rightX - leftX;
            const skew = Math.round(width * 0.2);
            
            // Parallelogram with skewed sides
            this.drawShapeLine({x: leftX + skew, y: topY}, {x: rightX + skew, y: topY}, state);
            this.drawShapeLine({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, state);
            this.drawShapeLine({x: leftX + skew, y: topY}, {x: leftX, y: bottomY}, state);
            this.drawShapeLine({x: rightX + skew, y: topY}, {x: rightX, y: bottomY}, state);
        }

        /**
         * Draw kite shape
         */
        drawShapeKite(start, end, state) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            
            // Kite as diamond with vertical emphasis
            const topPoint = {x: centerX, y: topY};
            const leftPoint = {x: leftX, y: centerY + Math.round((bottomY - topY) * 0.2)};
            const rightPoint = {x: rightX, y: centerY + Math.round((bottomY - topY) * 0.2)};
            const bottomPoint = {x: centerX, y: bottomY};
            
            this.drawShapeLine(topPoint, leftPoint, state);
            this.drawShapeLine(leftPoint, bottomPoint, state);
            this.drawShapeLine(bottomPoint, rightPoint, state);
            this.drawShapeLine(rightPoint, topPoint, state);
        }

        /**
         * Draw shape to a specific state (for preview) - UNIFIED VERSION v3.0
         * Uses advanced mathematical shape generation with ink/paper support
         * @param {Object} state - Target state object
         * @param {Object} start - Start position (anchor point)
         * @param {Object} end - End position (drag point)
         * @param {string} shape - Shape type
         * @param {Object} options - Drawing options (drawMode, erase, etc.)
         */
        drawShapeToState(state, start, end, shape, options = {}) {
            const colorState = this.colorManager.getState();
            const { erase = false, filled = false } = options;
            
            // Helper method to draw pixel to state with ink/paper support
            const drawPixelToState = (x, y, pixelValue) => {
                if (x >= 0 && x <= 255 && y >= 0 && y <= 191) {
                    state.pixels[y][x] = pixelValue;
                    
                    const cellX = Math.floor(x / 8);
                    const cellY = Math.floor(y / 8);
                    
                    if (cellX >= 0 && cellX < 32 && cellY >= 0 && cellY < 24) {
                        const existingAttr = state.attributes[cellY][cellX];
                        
                        // Always update color attributes when drawing shapes
                        // This ensures that even paper pixels (0) are visible with the selected colors
                        state.attributes[cellY][cellX] = {
                            ink: colorState.inkEnabled ? colorState.ink : existingAttr.ink,
                            paper: colorState.paperEnabled ? colorState.paper : existingAttr.paper,
                            bright: colorState.bright,
                            flash: colorState.flash
                        };
                    }
                }
            };

            // UNIFIED DRAWING ENGINE v3.0 - Advanced mathematical shape generation
            try {
                // Ensure ShapeGenerator is properly initialized
                if (!this.shapeGenerator) {
                    warn('ShapeGenerator not initialized, creating new instance');
                    this.shapeGenerator = new ShapeGenerator();
                }

                // Verify ShapeGenerator methods are available
                if (!this.shapeGenerator.generateShape || typeof this.shapeGenerator.generateShape !== 'function') {
                    throw new Error('ShapeGenerator.generateShape method not available');
                }

                // Map HTML shape names to generator shape names
                const shapeMap = {
                    'rect': 'rectangle'
                    // arrow-up, arrow-right, arrow-down, arrow-left use their own names
                    // pentagon, hexagon, octagon use their own names
                };

                // Prepare drawing options
                const drawOptions = {
                    strokeWidth: 1, // Default brush size - will be overridden by toolManager if available
                    drawMode: erase ? 'paper' : 'ink'  // Support ink/paper drawing modes
                };

                // Try to get brush size and filled mode from tool manager safely
                try {
                    const toolManager = window.app?.toolManager;
                    if (toolManager && toolManager.state) {
                        if (toolManager.state.brushSize) {
                            drawOptions.strokeWidth = toolManager.state.brushSize;
                        }
                        // Check if shape should be filled (prioritize passed option)
                        drawOptions.filled = filled || toolManager.state.shapeFilled || false;
                    }
                } catch (err) {
                    warn('Could not access tool manager for shape options');
                    // Use passed filled option as fallback
                    drawOptions.filled = filled;
                }

                // Set options for special shapes
                // Arrow direction is handled by specific arrow generation methods
                if (shape === 'pentagon') drawOptions.sides = 5;
                if (shape === 'hexagon') drawOptions.sides = 6;
                if (shape === 'octagon') drawOptions.sides = 8;
                if (shape === 'star') drawOptions.points = 5;
                if (shape === 'flower') drawOptions.petals = 6;
                if (shape === 'gear') drawOptions.teeth = 8;
                if (shape === 'spiral') drawOptions.turns = 3;
                if (shape === 'moon') {
                    // Determine crescent direction based on drag direction
                    drawOptions.dragDirection = end.x > start.x ? 'right' : 'left';
                }

                const generatorShape = shapeMap[shape] || shape;

                // Create bounds object for ShapeGenerator (compatible with existing system)
                const bounds = {
                    x1: start.x,
                    y1: start.y,
                    x2: end.x,
                    y2: end.y
                };

                // Generate points using unified system with bounds
                // Use filled shape if filled mode is enabled
                let points;
                if (drawOptions.filled && this.shapeGenerator.isShapeFillable(generatorShape)) {
                    points = this.shapeGenerator.generateFilledShape(generatorShape, bounds, drawOptions);
                } else {
                    points = this.shapeGenerator.generateShape(generatorShape, bounds, drawOptions);
                }
                
                // Draw all points to the state using their pixel values
                points.forEach(point => {
                    // Use pixelValue from point, or default based on erase mode
                    const pixelValue = point.pixelValue !== undefined ? point.pixelValue : (erase ? 0 : 1);
                    drawPixelToState(point.x, point.y, pixelValue);
                });

                log(`✓ Unified shape engine: ${shape} with ${points.length} points (${drawOptions.drawMode} mode)`);
                
                // Validate points format
                if (points.length > 0) {
                    const firstPoint = points[0];
                    log(`First point structure:`, firstPoint);
                    if (firstPoint.pixelValue === undefined) {
                        warn(`Points missing pixelValue property`);
                    }
                }

            } catch (err) {
                throw new Error(`Shape generation failed for ${shape}: ${err.message}`);
            }
        }

    }

    /**
     * Main ZX Pixel Smoosher application
     * @class ZXSpectrumPixelSmasher
     */
    class ZXSpectrumPixelSmasher {
        constructor() {
            this.initializeServices();
            this.setupEventListeners();
            this.initializeApplication();
        }

        /**
         * Initialize all services
         */
        initializeServices() {
            // Get OptimizedHistoryManager
            this.historyManager = this.getHistoryManager();
            
            // Core services
            this.eventBus = new EventBus();
            this.errorHandler = new ErrorHandler(this.eventBus);
            
            // Initialize aggressive memory management FIRST
            this.memoryManager = new MemoryManager(this.eventBus, {
                aggressiveMode: true,
                cleanupInterval: 3000,      // Clean every 3 seconds
                forceGCInterval: 8000,      // Force GC every 8 seconds  
                memoryThreshold: 30 * 1024 * 1024, // 30MB threshold
                objectPoolSize: 500,        // Smaller pools for aggressive cleanup
                cacheLimit: 50              // Limit cache sizes
            });
            
            this.colorManager = new ColorManager(this.eventBus);
            this.canvasService = new CanvasService(this.eventBus, this.colorManager);
            this.fileService = new FileService(this.eventBus);
            this.stateManager = new StateManager(this.eventBus, this.historyManager);
            
            // Initialize FillManager for advanced fill operations
            try {
                console.log('🔧 Attempting to create FillManager...');
                console.log('📦 FillManager class available:', typeof FillManager !== 'undefined');
                console.log('🔍 Dependencies check:', {
                    eventBus: !!this.eventBus && typeof this.eventBus === 'object',
                    stateManager: !!this.stateManager && typeof this.stateManager === 'object',
                    colorManager: !!this.colorManager && typeof this.colorManager === 'object',
                    memoryManager: !!this.memoryManager && typeof this.memoryManager === 'object'
                });
                console.log('🔍 Detailed dependency validation:', {
                    eventBusHasEmit: this.eventBus && typeof this.eventBus.emit === 'function',
                    stateManagerHasGetState: this.stateManager && typeof this.stateManager.getState === 'function',
                    colorManagerHasState: this.colorManager && !!this.colorManager.state,
                    memoryManagerHasIsMemoryLow: this.memoryManager && typeof this.memoryManager.isMemoryLow === 'function'
                });
                
                if (typeof FillManager === 'undefined') {
                    throw new Error('FillManager class is not defined - check if FillManager.js loaded correctly');
                }
                
                // Pre-validate dependencies before construction
                if (!this.eventBus || typeof this.eventBus.emit !== 'function') {
                    throw new Error('Invalid EventBus - missing emit method');
                }
                if (!this.stateManager || typeof this.stateManager.getState !== 'function') {
                    throw new Error('Invalid StateManager - missing getState method');
                }
                if (!this.colorManager || !this.colorManager.state) {
                    throw new Error('Invalid ColorManager - missing state property');
                }
                
                console.log('🚀 Creating FillManager instance...');
                this.fillManager = new FillManager(this.eventBus, this.stateManager, this.colorManager, this.memoryManager);
                console.log('✅ FillManager created successfully:', !!this.fillManager);
                console.log('🔍 FillManager validation:', {
                    hasSetFillType: typeof this.fillManager.setFillType === 'function',
                    hasFillMethod: typeof this.fillManager.fill === 'function',
                    hasGetAvailableFillTypes: typeof this.fillManager.getAvailableFillTypes === 'function'
                });
                console.log('🎨 Available fill types:', this.fillManager.getAvailableFillTypes());
                
            } catch (error) {
                console.error('❌ Error creating FillManager:', error.message);
                console.error('📍 Error details:', error);
                console.error('🔧 Stack trace:', error.stack);
                
                // Detailed diagnostics
                console.error('🔍 Initialization context:', {
                    fillManagerClass: typeof FillManager,
                    dependencies: {
                        eventBus: !!this.eventBus && typeof this.eventBus,
                        stateManager: !!this.stateManager && typeof this.stateManager,
                        colorManager: !!this.colorManager && typeof this.colorManager,
                        memoryManager: !!this.memoryManager && typeof this.memoryManager
                    },
                    errorType: error.constructor.name,
                    errorCause: error.cause
                });
                
                throw new Error(`Failed to initialize FillManager: ${error.message}`);
            }
            
            // Initialize FillToolManager for UI integration (only if FillManager is available)
            console.log('🔍 Pre-FillToolManager check:', {
                fillManagerExists: !!this.fillManager,
                fillManagerType: typeof this.fillManager,
                fillManagerHasSetFillType: this.fillManager && typeof this.fillManager.setFillType === 'function'
            });
            
            if (this.fillManager) {
                try {
                    this.fillToolManager = new FillToolManager(this.eventBus, this.fillManager, this.colorManager);
                    console.log('✅ FillToolManager created successfully:', !!this.fillToolManager);
                    
                    // CRITICAL: Protect managers from being nullified elsewhere
                    Object.defineProperty(this, 'fillManager', {
                        value: this.fillManager,
                        writable: false,  // Prevent accidental overwriting
                        configurable: true  // Allow for legitimate updates if needed
                    });
                    Object.defineProperty(this, 'fillToolManager', {
                        value: this.fillToolManager,
                        writable: false,  // Prevent accidental overwriting
                        configurable: true  // Allow for legitimate updates if needed
                    });
                    
                    console.log('🔒 Managers protected from accidental nullification');
                    
                    // Show success message
                    this.eventBus.emit('status', { 
                        message: '🎨 Advanced fill tools ready - right-click fill tool for options', 
                        type: 'success' 
                    });
                } catch (error) {
                    console.error('❌ Error creating FillToolManager:', error);
                    console.error('🔍 FillToolManager error context:', {
                        fillToolManagerClass: typeof FillToolManager,
                        fillManagerAvailable: !!this.fillManager,
                        errorType: error.constructor.name
                    });
                    this.fillToolManager = null;
                    this.fillToolManagerInitializationFailed = true;
                }
            } else {
                throw new Error('FillManager not available - cannot initialize FillToolManager');
            }
            
            // Initialize ToolManager after fill managers are ready
            this.toolManager = new ToolManager(this.eventBus, this.colorManager, this.canvasService);
            // Connect fill tool manager to tool manager (if available)
            if (this.fillToolManager) {
                this.toolManager.fillToolManager = this.fillToolManager;
                console.log('ToolManager connected to FillToolManager');
            } else {
                console.log('ToolManager operating without advanced fill tools');
            }
            
            this.uiController = new UIController(this.eventBus, this.colorManager, this.toolManager, this.canvasService);
            this.performanceService = new PerformanceService(this.eventBus);
            this.drawingService = new DrawingService(this.eventBus, this.colorManager, this.stateManager, this.toolManager);
            
            // Register all services with memory manager for tracking
            this.registerServicesWithMemoryManager();
            
            // Store reference globally for compatibility
            window.historyManager = this.historyManager;
        }

        /**
         * Get OptimizedHistoryManager instance
         * @returns {Object} History manager instance
         */
        getHistoryManager() {
            if (typeof window !== 'undefined' && window.OptimizedHistoryManager) {
                return new window.OptimizedHistoryManager(30);
            }
            throw new Error('OptimizedHistoryManager not found');
        }

        /**
         * Register all services with memory manager for aggressive tracking and cleanup
         */
        registerServicesWithMemoryManager() {
            // Register canvas contexts for cleanup
            if (this.canvasService.ctx) {
                this.memoryManager.registerResource('canvasContexts', this.canvasService.ctx);
            }
            if (this.canvasService.previewCtx) {
                this.memoryManager.registerResource('canvasContexts', this.canvasService.previewCtx);
            }
            
            // Register event listeners from all services
            this.memoryManager.registerResource('eventListeners', this.eventBus, {
                service: 'eventBus',
                listenersCount: this.eventBus.listeners.size
            });
            
            // Setup automatic cleanup hooks for all major operations
            this.setupAutoCleanupHooks();
        }

        /**
         * Setup automatic cleanup hooks for all major operations
         */
        setupAutoCleanupHooks() {
            // Auto-cleanup after drawing operations
            this.eventBus.on('state-changed', () => {
                this.memoryManager.scheduleCleanup('drawing-operation');
            });
            
            // Auto-cleanup after file operations
            this.eventBus.on('file-loaded', () => {
                this.memoryManager.scheduleCleanup('file-operation');
            });
            
            // Auto-cleanup after tool changes
            this.eventBus.on('tool-changed', () => {
                this.memoryManager.scheduleCleanup('tool-change');
            });
            
            // Auto-cleanup after zoom changes
            this.eventBus.on('zoom-changed', () => {
                this.memoryManager.scheduleCleanup('zoom-change');
            });
            
            // Auto-cleanup after canvas updates
            this.eventBus.on('canvas-updated', () => {
                this.memoryManager.scheduleCleanup('canvas-update');
            });
            
            // Emergency cleanup on memory warnings
            this.eventBus.on('memory-warning', () => {
                this.memoryManager.performEmergencyCleanup();
            });
            
            // Respond to memory manager cleanup events
            this.eventBus.on('memory-cleaned', (data) => {
                if (data.resourcesFreed > 0) {
                    this.eventBus.emit('status', { 
                        message: `🧹 Auto-cleanup: ${data.resourcesFreed} resources freed`, 
                        type: 'info' 
                    });
                }
            });
            
            // Auto-cleanup when shapes are drawn
            this.eventBus.on('shape-drawn', () => {
                this.memoryManager.scheduleCleanup('shape-operation');
            });
            
            // Auto-cleanup after history operations
            this.eventBus.on('history-changed', () => {
                this.memoryManager.scheduleCleanup('history-operation');
            });
        }

        /**
         * Setup application event listeners
         */
        setupEventListeners() {
            // Rendering
            this.eventBus.on('render-requested', () => {
                log('Render-requested event received');
                const state = this.stateManager.getState();
                log('Rendering canvas with state:', state ? 'state available' : 'no state');
                this.canvasService.render(state.pixels, state.attributes);
                this.performanceService.incrementCounter('renders');
                log('Canvas render completed');
            });

            // State management
            log('Setting up state-changed event listener...');
            this.eventBus.on('state-changed', (data) => {
                log('State-changed event received:', data ? 'with data' : 'no data');
                if (data.pixels) {
                    log('Updating pixels in state manager');
                    this.stateManager.setPixels(data.pixels);
                }
                if (data.attributes) {
                    log('Updating attributes in state manager');
                    this.stateManager.setAttributes(data.attributes);
                }
                log('Scheduling canvas render...');
                this.canvasService.scheduleRender();
            });

            // Preview canvas clearing
            this.eventBus.on('clear-preview', () => {
                log('Clear-preview event received - clearing preview canvas');
                this.canvasService.clearPreview();
            });

            // Zoom
            this.eventBus.on('zoom-requested', (zoom) => {
                this.stateManager.setZoom(zoom);
            });

            this.eventBus.on('zoom-changed', (zoom) => {
                this.canvasService.updateZoom(zoom);
            });

            this.eventBus.on('zoom-adjust', (delta) => {
                const currentZoom = this.stateManager.getState().zoom;
                this.stateManager.setZoom(currentZoom + delta);
            });

            // Grids
            this.eventBus.on('grid-toggle', (type) => {
                log('grid-toggle event received:', type);
                this.stateManager.toggleGrid(type);
            });

            // History
            this.eventBus.on('undo', () => {
                this.stateManager.undo();
            });

            this.eventBus.on('redo', () => {
                this.stateManager.redo();
            });

            // Drawing state changes
            this.eventBus.on('drawing-stopped', (data) => {
                if (data.wasDrawing) {
                    log('Drawing stopped - saving state for tool:', data.tool, 'wasDrawing:', data.wasDrawing);
                    this.stateManager.saveState('draw');
                    log('State saved for', data.tool, '- new history info:', this.stateManager.history.getInfo());
                }
            });

            // File operations
            this.eventBus.on('file-loaded', (data) => {
                this.stateManager.setPixels(data.pixels);
                this.stateManager.setAttributes(data.attributes);
                this.stateManager.saveState(`load-${data.type}`);
            });

            // Preview handling
            this.eventBus.on('preview-updated', (data) => {
                this.handlePreview(data);
            });

            // Flash animation
            this.eventBus.on('flash-phase-changed', (phase) => {
                const state = this.stateManager.getState();
                if (this.canvasService.hasFlash(state.attributes)) {
                    this.canvasService.scheduleRender();
                }
            });

            // Emergency save
            this.eventBus.on('emergency-save', () => {
                this.emergencySave();
            });

            // Memory monitoring
            this.setupMemoryMonitoring();
        }

        /**
         * Handle preview rendering
         * @param {Object} data - Preview data
         */
        handlePreview(data) {
            try {
                const startTime = performance.now();
                const PREVIEW_TIMEOUT = 100; // 100ms max for preview calculation
                
                // Skip debug logging in production
                
                const state = this.stateManager.getState();
                const originalPixels = state.pixels.map(row => new Uint8Array(row));
                const originalAttrs = state.attributes.map(row => row.map(attr => ({ ...attr })));
                
                // Create temporary state for preview
                const tempState = {
                    pixels: state.pixels.map(row => new Uint8Array(row)),
                    attributes: state.attributes.map(row => row.map(attr => ({ ...attr })))
                };
                
                // Apply preview changes to temporary state with timeout protection
                // Support ink/paper drawing modes for preview
                const previewOptions = {
                    erase: data.erase || false,  // Support both ink and paper preview modes
                    filled: data.filled || false  // Support filled shape previews
                };
                this.drawingService.drawShapeToState(tempState, data.start, data.end, data.shape, previewOptions);
                
                const elapsed = performance.now() - startTime;
                if (elapsed > PREVIEW_TIMEOUT) {
                    warn(`Preview calculation took too long: ${elapsed.toFixed(1)}ms for shape: ${data.shape}`);
                }
                
                // Render preview using original vs modified temporary state
                this.canvasService.renderPreview(
                    tempState.pixels,
                    tempState.attributes,
                    originalPixels,
                    originalAttrs,
                    data.erase || false  // Pass erase mode for XOR preview
                );
            } catch (err) {
                error('Error in handlePreview:', err);
                // Clear preview on error
                this.canvasService.clearPreview();
            }
        }

        /**
         * Draw line to state
         */
        drawLineToState(start, end, drawPixel) {
            const deltaX = Math.abs(end.x - start.x);
            const deltaY = Math.abs(end.y - start.y);
            const stepX = start.x < end.x ? 1 : -1;
            const stepY = start.y < end.y ? 1 : -1;
            
            let errorAccumulator = deltaX - deltaY;
            let currentX = start.x;
            let currentY = start.y;
            
            while (true) {
                drawPixel(currentX, currentY, 1);
                
                if (currentX === end.x && currentY === end.y) break;
                
                const doubleError = 2 * errorAccumulator;
                if (doubleError > -deltaY) {
                    errorAccumulator -= deltaY;
                    currentX += stepX;
                }
                if (doubleError < deltaX) {
                    errorAccumulator += deltaX;
                    currentY += stepY;
                }
            }
        }

        /**
         * Draw rectangle to state
         */
        drawRectToState(start, end, drawPixel) {
            const left = Math.min(start.x, end.x);
            const right = Math.max(start.x, end.x);
            const top = Math.min(start.y, end.y);
            const bottom = Math.max(start.y, end.y);
            
            for (let x = left; x <= right; x++) {
                drawPixel(x, top, 1);
                drawPixel(x, bottom, 1);
            }
            for (let y = top; y <= bottom; y++) {
                drawPixel(left, y, 1);
                drawPixel(right, y, 1);
            }
        }

        /**
         * Draw circle to state
         */
        drawCircleToState(start, end, drawPixel) {
            const centerX = Math.round(start.x);
            const centerY = Math.round(start.y);
            const radius = Math.round(Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2));
            
            if (radius > 0) {
                let x = 0;
                let y = radius;
                let d = 3 - 2 * radius;
                
                const plotCirclePoints = (cx, cy, px, py) => {
                    drawPixel(cx + px, cy + py, 1);
                    drawPixel(cx + px, cy - py, 1);
                    drawPixel(cx - px, cy + py, 1);
                    drawPixel(cx - px, cy - py, 1);
                    drawPixel(cx + py, cy + px, 1);
                    drawPixel(cx + py, cy - px, 1);
                    drawPixel(cx - py, cy + px, 1);
                    drawPixel(cx - py, cy - px, 1);
                };
                
                while (x <= y) {
                    plotCirclePoints(centerX, centerY, x, y);
                    x++;
                    if (d > 0) {
                        y--;
                        d = d + 4 * (x - y) + 10;
                    } else {
                        d = d + 4 * x + 6;
                    }
                }
            }
        }

        /**
         * Draw ellipse to state
         */
        drawEllipseToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const a = Math.abs(end.x - start.x) / 2; // Semi-major axis
            const b = Math.abs(end.y - start.y) / 2; // Semi-minor axis
            
            if (a === 0 && b === 0) return;
            
            // Use Bresenham's ellipse algorithm
            let x = 0;
            let y = Math.round(b);
            let a2 = a * a;
            let b2 = b * b;
            let crit1 = -(a2 / 4 + a % 2 + b2);
            let crit2 = -(b2 / 4 + b % 2 + a2);
            let crit3 = -(b2 / 4 + b % 2);
            let t = -a2 * y;
            let dxt = 2 * b2 * x;
            let dyt = -2 * a2 * y;
            let d2xt = 2 * b2;
            let d2yt = 2 * a2;

            const plotEllipsePoints = (cx, cy, x, y) => {
                drawPixel(cx + x, cy + y, 1);
                drawPixel(cx - x, cy + y, 1);
                drawPixel(cx + x, cy - y, 1);
                drawPixel(cx - x, cy - y, 1);
            };

            while (y >= 0 && x <= a) {
                plotEllipsePoints(centerX, centerY, Math.round(x), Math.round(y));
                
                if (t + b2 * x <= crit1 || t + a2 * y <= crit3) {
                    x++;
                    dxt += d2xt;
                    t += dxt;
                } else if (t - a2 * y > crit2) {
                    y--;
                    dyt += d2yt;
                    t += dyt;
                } else {
                    x++;
                    y--;
                    dxt += d2xt;
                    dyt += d2yt;
                    t += dxt;
                    t += dyt;
                }
            }
        }

        /**
         * Draw triangle to state
         */
        drawTriangleToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            
            this.drawLineToState({x: centerX, y: topY}, {x: leftX, y: bottomY}, drawPixel);
            this.drawLineToState({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, drawPixel);
            this.drawLineToState({x: rightX, y: bottomY}, {x: centerX, y: topY}, drawPixel);
        }

        /**
         * Draw diamond to state
         */
        drawDiamondToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const halfWidth = Math.abs(end.x - start.x) / 2;
            const halfHeight = Math.abs(end.y - start.y) / 2;
            
            const top = {x: centerX, y: centerY - halfHeight};
            const right = {x: centerX + halfWidth, y: centerY};
            const bottom = {x: centerX, y: centerY + halfHeight};
            const left = {x: centerX - halfWidth, y: centerY};
            
            this.drawLineToState(top, right, drawPixel);
            this.drawLineToState(right, bottom, drawPixel);
            this.drawLineToState(bottom, left, drawPixel);
            this.drawLineToState(left, top, drawPixel);
        }

        /**
         * Draw star to state
         */
        drawStarToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            // Safety check for valid radius
            if (radius <= 0 || !isFinite(radius)) {
                warn('Invalid radius for star preview:', radius);
                return;
            }
            
            const points = [];
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI) / 5 - Math.PI / 2;
                const r = i % 2 === 0 ? radius : radius * 0.4;
                const x = Math.round(centerX + r * Math.cos(angle));
                const y = Math.round(centerY + r * Math.sin(angle));
                
                // Safety check for valid coordinates
                if (!isFinite(x) || !isFinite(y)) {
                    warn('Invalid star preview point coordinates:', {x, y, angle, r});
                    continue;
                }
                
                points.push({ x, y });
            }
            
            // Only draw if we have valid points
            if (points.length < 3) {
                warn('Insufficient points for star preview');
                return;
            }
            
            for (let i = 0; i < points.length; i++) {
                const next = (i + 1) % points.length;
                this.drawLineToState(points[i], points[next], drawPixel);
            }
        }

        /**
         * Draw polygon to state
         */
        drawPolygonToState(start, end, drawPixel, sides) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            const points = [];
            for (let i = 0; i < sides; i++) {
                const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
                points.push({
                    x: Math.round(centerX + radius * Math.cos(angle)),
                    y: Math.round(centerY + radius * Math.sin(angle))
                });
            }
            
            for (let i = 0; i < points.length; i++) {
                const next = (i + 1) % points.length;
                this.drawLineToState(points[i], points[next], drawPixel);
            }
        }

        /**
         * Draw arrow up to state
         */
        drawArrowUpToState(start, end, drawPixel) {
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
            const centerX = Math.round((start.x + end.x) / 2);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            
            const arrowWidth = Math.round(width * 0.6);
            const shaftWidth = Math.round(width * 0.3);
            const arrowHeight = Math.round(height * 0.4);
            
            // Arrow head
            const tip = {x: centerX, y: topY};
            const leftHead = {x: centerX - arrowWidth/2, y: topY + arrowHeight};
            const rightHead = {x: centerX + arrowWidth/2, y: topY + arrowHeight};
            
            this.drawLineToState(tip, leftHead, drawPixel);
            this.drawLineToState(tip, rightHead, drawPixel);
            this.drawLineToState(leftHead, rightHead, drawPixel);
            
            // Arrow shaft
            const shaftTop = topY + arrowHeight;
            const leftShaft = centerX - shaftWidth/2;
            const rightShaft = centerX + shaftWidth/2;
            
            this.drawLineToState({x: leftShaft, y: shaftTop}, {x: leftShaft, y: bottomY}, drawPixel);
            this.drawLineToState({x: rightShaft, y: shaftTop}, {x: rightShaft, y: bottomY}, drawPixel);
            this.drawLineToState({x: leftShaft, y: bottomY}, {x: rightShaft, y: bottomY}, drawPixel);
        }

        /**
         * Draw arrow right to state
         */
        drawArrowRightToState(start, end, drawPixel) {
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
            const centerY = Math.round((start.y + end.y) / 2);
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            
            const arrowHeight = Math.round(height * 0.6);
            const shaftHeight = Math.round(height * 0.3);
            const arrowWidth = Math.round(width * 0.4);
            
            // Arrow head
            const tip = {x: rightX, y: centerY};
            const topHead = {x: rightX - arrowWidth, y: centerY - arrowHeight/2};
            const bottomHead = {x: rightX - arrowWidth, y: centerY + arrowHeight/2};
            
            this.drawLineToState(tip, topHead, drawPixel);
            this.drawLineToState(tip, bottomHead, drawPixel);
            this.drawLineToState(topHead, bottomHead, drawPixel);
            
            // Arrow shaft
            const shaftRight = rightX - arrowWidth;
            const topShaft = centerY - shaftHeight/2;
            const bottomShaft = centerY + shaftHeight/2;
            
            this.drawLineToState({x: leftX, y: topShaft}, {x: shaftRight, y: topShaft}, drawPixel);
            this.drawLineToState({x: leftX, y: bottomShaft}, {x: shaftRight, y: bottomShaft}, drawPixel);
            this.drawLineToState({x: leftX, y: topShaft}, {x: leftX, y: bottomShaft}, drawPixel);
        }

        /**
         * Draw arrow down to state
         */
        drawArrowDownToState(start, end, drawPixel) {
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
            const centerX = Math.round((start.x + end.x) / 2);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            
            const arrowWidth = Math.round(width * 0.6);
            const shaftWidth = Math.round(width * 0.3);
            const arrowHeight = Math.round(height * 0.4);
            
            // Arrow head
            const tip = {x: centerX, y: bottomY};
            const leftHead = {x: centerX - arrowWidth/2, y: bottomY - arrowHeight};
            const rightHead = {x: centerX + arrowWidth/2, y: bottomY - arrowHeight};
            
            this.drawLineToState(tip, leftHead, drawPixel);
            this.drawLineToState(tip, rightHead, drawPixel);
            this.drawLineToState(leftHead, rightHead, drawPixel);
            
            // Arrow shaft
            const shaftBottom = bottomY - arrowHeight;
            const leftShaft = centerX - shaftWidth/2;
            const rightShaft = centerX + shaftWidth/2;
            
            this.drawLineToState({x: leftShaft, y: topY}, {x: leftShaft, y: shaftBottom}, drawPixel);
            this.drawLineToState({x: rightShaft, y: topY}, {x: rightShaft, y: shaftBottom}, drawPixel);
            this.drawLineToState({x: leftShaft, y: topY}, {x: rightShaft, y: topY}, drawPixel);
        }

        /**
         * Draw arrow left to state
         */
        drawArrowLeftToState(start, end, drawPixel) {
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
            const centerY = Math.round((start.y + end.y) / 2);
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            
            const arrowHeight = Math.round(height * 0.6);
            const shaftHeight = Math.round(height * 0.3);
            const arrowWidth = Math.round(width * 0.4);
            
            // Arrow head
            const tip = {x: leftX, y: centerY};
            const topHead = {x: leftX + arrowWidth, y: centerY - arrowHeight/2};
            const bottomHead = {x: leftX + arrowWidth, y: centerY + arrowHeight/2};
            
            this.drawLineToState(tip, topHead, drawPixel);
            this.drawLineToState(tip, bottomHead, drawPixel);
            this.drawLineToState(topHead, bottomHead, drawPixel);
            
            // Arrow shaft
            const shaftLeft = leftX + arrowWidth;
            const topShaft = centerY - shaftHeight/2;
            const bottomShaft = centerY + shaftHeight/2;
            
            this.drawLineToState({x: shaftLeft, y: topShaft}, {x: rightX, y: topShaft}, drawPixel);
            this.drawLineToState({x: shaftLeft, y: bottomShaft}, {x: rightX, y: bottomShaft}, drawPixel);
            this.drawLineToState({x: rightX, y: topShaft}, {x: rightX, y: bottomShaft}, drawPixel);
        }

        /**
         * Draw X to state
         */
        drawCrossToState(start, end, drawPixel) {
            this.drawLineToState(start, end, drawPixel);
            this.drawLineToState({x: start.x, y: end.y}, {x: end.x, y: start.y}, drawPixel);
        }

        /**
         * Draw plus to state
         */
        drawPlusToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            
            // Horizontal line
            this.drawLineToState({x: leftX, y: centerY}, {x: rightX, y: centerY}, drawPixel);
            // Vertical line
            this.drawLineToState({x: centerX, y: topY}, {x: centerX, y: bottomY}, drawPixel);
        }

        /**
         * Draw heart shape to state
         */
        drawHeartToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
            const scale = Math.min(width, height) / 16;
            
            if (scale <= 0 || !isFinite(scale)) return;
            
            // Heart shape using bezier-like curves approximated with lines
            const points = [];
            for (let t = 0; t <= Math.PI * 2; t += 0.1) {
                const x = 16 * Math.pow(Math.sin(t), 3) * scale;
                const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * scale;
                const px = Math.round(centerX + x);
                const py = Math.round(centerY + y);
                if (isFinite(px) && isFinite(py)) points.push({x: px, y: py});
            }
            
            // Draw heart outline
            for (let i = 0; i < points.length - 1; i++) {
                this.drawLineToState(points[i], points[i + 1], drawPixel);
            }
        }

        /**
         * Draw lightning shape to state
         */
        drawLightningToState(start, end, drawPixel) {
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
            const leftX = Math.min(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            
            if (width <= 0 || height <= 0) return;
            
            // Lightning bolt path
            const points = [
                {x: leftX + width * 0.3, y: topY},
                {x: leftX + width * 0.1, y: topY + height * 0.4},
                {x: leftX + width * 0.5, y: topY + height * 0.4},
                {x: leftX + width * 0.2, y: topY + height},
                {x: leftX + width * 0.7, y: topY + height * 0.6},
                {x: leftX + width * 0.4, y: topY + height * 0.6},
                {x: leftX + width * 0.7, y: topY}
            ];
            
            // Draw lightning path
            for (let i = 0; i < points.length - 1; i++) {
                this.drawLineToState(points[i], points[i + 1], drawPixel);
            }
            this.drawLineToState(points[points.length - 1], points[0], drawPixel);
        }

        /**
         * Draw house shape to state
         */
        drawHouseToState(start, end, drawPixel) {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const width = rightX - leftX;
            const height = bottomY - topY;
            
            if (width <= 0 || height <= 0) return;
            
            const roofHeight = Math.round(height * 0.4);
            const wallTop = topY + roofHeight;
            const centerX = Math.round((leftX + rightX) / 2);
            
            // Roof triangle
            this.drawLineToState({x: leftX, y: wallTop}, {x: centerX, y: topY}, drawPixel);
            this.drawLineToState({x: centerX, y: topY}, {x: rightX, y: wallTop}, drawPixel);
            this.drawLineToState({x: leftX, y: wallTop}, {x: rightX, y: wallTop}, drawPixel);
            
            // Walls
            this.drawLineToState({x: leftX, y: wallTop}, {x: leftX, y: bottomY}, drawPixel);
            this.drawLineToState({x: rightX, y: wallTop}, {x: rightX, y: bottomY}, drawPixel);
            this.drawLineToState({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, drawPixel);
            
            // Door
            const doorWidth = Math.round(width * 0.25);
            const doorHeight = Math.round(height * 0.3);
            const doorX = centerX - doorWidth / 2;
            const doorY = bottomY - doorHeight;
            this.drawRectToState({x: doorX, y: doorY}, {x: doorX + doorWidth, y: bottomY}, drawPixel);
        }

        /**
         * Draw moon shape to state
         */
        drawMoonToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            if (radius <= 0 || !isFinite(radius)) return;
            
            // Outer circle (full moon)
            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                const x = Math.round(centerX + radius * Math.cos(angle));
                const y = Math.round(centerY + radius * Math.sin(angle));
                if (isFinite(x) && isFinite(y)) {
                    drawPixel(x, y);
                }
            }
        }

        /**
         * Draw flower shape to state
         */
        drawFlowerToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            if (radius <= 0 || !isFinite(radius)) return;
            
            // Draw 6 petals
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6;
                const petalRadius = radius * 0.7;
                const petalCenterX = centerX + petalRadius * Math.cos(angle);
                const petalCenterY = centerY + petalRadius * Math.sin(angle);
                
                // Draw petal as small circle
                for (let petalAngle = 0; petalAngle < Math.PI * 2; petalAngle += 0.2) {
                    const x = Math.round(petalCenterX + (radius * 0.3) * Math.cos(petalAngle));
                    const y = Math.round(petalCenterY + (radius * 0.3) * Math.sin(petalAngle));
                    if (isFinite(x) && isFinite(y)) {
                        drawPixel(x, y);
                    }
                }
            }
            
            // Center circle
            for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
                const x = Math.round(centerX + (radius * 0.2) * Math.cos(angle));
                const y = Math.round(centerY + (radius * 0.2) * Math.sin(angle));
                if (isFinite(x) && isFinite(y)) {
                    drawPixel(x, y);
                }
            }
        }

        /**
         * Draw gear shape to state
         */
        drawGearToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const radius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            if (radius <= 0 || !isFinite(radius)) return;
            
            const teeth = 8;
            const innerRadius = radius * 0.7;
            const outerRadius = radius;
            
            // Draw gear teeth
            for (let i = 0; i < teeth; i++) {
                const angle1 = (i * Math.PI * 2) / teeth;
                const angle2 = ((i + 0.3) * Math.PI * 2) / teeth;
                const angle3 = ((i + 0.7) * Math.PI * 2) / teeth;
                const angle4 = ((i + 1) * Math.PI * 2) / teeth;
                
                // Inner arc
                const x1 = Math.round(centerX + innerRadius * Math.cos(angle1));
                const y1 = Math.round(centerY + innerRadius * Math.sin(angle1));
                const x2 = Math.round(centerX + innerRadius * Math.cos(angle2));
                const y2 = Math.round(centerY + innerRadius * Math.sin(angle2));
                
                // Outer arc  
                const x3 = Math.round(centerX + outerRadius * Math.cos(angle2));
                const y3 = Math.round(centerY + outerRadius * Math.sin(angle2));
                const x4 = Math.round(centerX + outerRadius * Math.cos(angle3));
                const y4 = Math.round(centerY + outerRadius * Math.sin(angle3));
                
                // Inner arc
                const x5 = Math.round(centerX + innerRadius * Math.cos(angle3));
                const y5 = Math.round(centerY + innerRadius * Math.sin(angle3));
                const x6 = Math.round(centerX + innerRadius * Math.cos(angle4));
                const y6 = Math.round(centerY + innerRadius * Math.sin(angle4));
                
                // Draw tooth
                this.drawLineToState({x: x1, y: y1}, {x: x2, y: y2}, drawPixel);
                this.drawLineToState({x: x2, y: y2}, {x: x3, y: y3}, drawPixel);
                this.drawLineToState({x: x3, y: y3}, {x: x4, y: y4}, drawPixel);
                this.drawLineToState({x: x4, y: y4}, {x: x5, y: y5}, drawPixel);
                this.drawLineToState({x: x5, y: y5}, {x: x6, y: y6}, drawPixel);
            }
        }

        /**
         * Draw spiral shape to state
         */
        drawSpiralToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const maxRadius = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
            
            if (maxRadius <= 0 || !isFinite(maxRadius)) return;
            
            let prevX = centerX, prevY = centerY;
            
            // Draw spiral from center outward
            for (let angle = 0; angle < Math.PI * 6; angle += 0.1) {
                const radius = (angle / (Math.PI * 6)) * maxRadius;
                const x = Math.round(centerX + radius * Math.cos(angle));
                const y = Math.round(centerY + radius * Math.sin(angle));
                
                if (isFinite(x) && isFinite(y)) {
                    this.drawLineToState({x: prevX, y: prevY}, {x: x, y: y}, drawPixel);
                    prevX = x;
                    prevY = y;
                }
            }
        }

        /**
         * Draw bowtie shape to state
         */
        drawBowtieToState(start, end, drawPixel) {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const centerX = Math.round((leftX + rightX) / 2);
            const centerY = Math.round((topY + bottomY) / 2);
            
            // Draw bowtie as two triangles connected at center
            // Top triangle
            this.drawLineToState({x: leftX, y: topY}, {x: rightX, y: topY}, drawPixel);
            this.drawLineToState({x: leftX, y: topY}, {x: centerX, y: centerY}, drawPixel);
            this.drawLineToState({x: rightX, y: topY}, {x: centerX, y: centerY}, drawPixel);
            
            // Bottom triangle
            this.drawLineToState({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, drawPixel);
            this.drawLineToState({x: leftX, y: bottomY}, {x: centerX, y: centerY}, drawPixel);
            this.drawLineToState({x: rightX, y: bottomY}, {x: centerX, y: centerY}, drawPixel);
        }

        /**
         * Draw hourglass shape to state
         */
        drawHourglassToState(start, end, drawPixel) {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const centerX = Math.round((leftX + rightX) / 2);
            const centerY = Math.round((topY + bottomY) / 2);
            
            // Top triangle (inverted)
            this.drawLineToState({x: leftX, y: topY}, {x: rightX, y: topY}, drawPixel);
            this.drawLineToState({x: leftX, y: topY}, {x: centerX, y: centerY}, drawPixel);
            this.drawLineToState({x: rightX, y: topY}, {x: centerX, y: centerY}, drawPixel);
            
            // Bottom triangle
            this.drawLineToState({x: centerX, y: centerY}, {x: leftX, y: bottomY}, drawPixel);
            this.drawLineToState({x: centerX, y: centerY}, {x: rightX, y: bottomY}, drawPixel);
            this.drawLineToState({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, drawPixel);
        }

        /**
         * Draw trapezoid shape to state
         */
        drawTrapezoidToState(start, end, drawPixel) {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const width = rightX - leftX;
            const inset = Math.round(width * 0.2);
            
            // Trapezoid with narrower top
            this.drawLineToState({x: leftX + inset, y: topY}, {x: rightX - inset, y: topY}, drawPixel);
            this.drawLineToState({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, drawPixel);
            this.drawLineToState({x: leftX + inset, y: topY}, {x: leftX, y: bottomY}, drawPixel);
            this.drawLineToState({x: rightX - inset, y: topY}, {x: rightX, y: bottomY}, drawPixel);
        }

        /**
         * Draw parallelogram shape to state
         */
        drawParallelogramToState(start, end, drawPixel) {
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            const width = rightX - leftX;
            const skew = Math.round(width * 0.2);
            
            // Parallelogram with skewed sides
            this.drawLineToState({x: leftX + skew, y: topY}, {x: rightX + skew, y: topY}, drawPixel);
            this.drawLineToState({x: leftX, y: bottomY}, {x: rightX, y: bottomY}, drawPixel);
            this.drawLineToState({x: leftX + skew, y: topY}, {x: leftX, y: bottomY}, drawPixel);
            this.drawLineToState({x: rightX + skew, y: topY}, {x: rightX, y: bottomY}, drawPixel);
        }

        /**
         * Draw kite shape to state
         */
        drawKiteToState(start, end, drawPixel) {
            const centerX = Math.round((start.x + end.x) / 2);
            const centerY = Math.round((start.y + end.y) / 2);
            const leftX = Math.min(start.x, end.x);
            const rightX = Math.max(start.x, end.x);
            const topY = Math.min(start.y, end.y);
            const bottomY = Math.max(start.y, end.y);
            
            // Kite as diamond with vertical emphasis
            const topPoint = {x: centerX, y: topY};
            const leftPoint = {x: leftX, y: centerY + Math.round((bottomY - topY) * 0.2)};
            const rightPoint = {x: rightX, y: centerY + Math.round((bottomY - topY) * 0.2)};
            const bottomPoint = {x: centerX, y: bottomY};
            
            this.drawLineToState(topPoint, leftPoint, drawPixel);
            this.drawLineToState(leftPoint, bottomPoint, drawPixel);
            this.drawLineToState(bottomPoint, rightPoint, drawPixel);
            this.drawLineToState(rightPoint, topPoint, drawPixel);
        }

        /**
         * Setup memory monitoring
         */
        setupMemoryMonitoring() {
            this.memoryInterval = setInterval(() => {
                this.updateMemoryDisplay();
            }, 3000);
            
            // Register timer for cleanup
            if (this.eventBus && this.eventBus.emit) {
                this.eventBus.emit('register-timer', this.memoryInterval);
            }
        }
        
        /**
         * Cleanup memory monitoring
         */
        destroyMemoryMonitoring() {
            if (this.memoryInterval) {
                clearInterval(this.memoryInterval);
                this.memoryInterval = null;
            }
        }

        /**
         * Update memory display
         */
        updateMemoryDisplay() {
            const memoryDisplay = document.getElementById('memory-display');
            if (!memoryDisplay) return;

            try {
                const stats = this.performanceService.getStats();
                const historyInfo = this.historyManager ? this.historyManager.getInfo() : {};
                
                let display = `${stats.memoryUsage.totalMB} MB total<br>`;
                if (this.historyManager) {
                    const memUsage = this.historyManager.getMemoryUsage();
                    display += `${memUsage.mainStates} states (${memUsage.totalMemoryMB} MB)<br>`;
                    display += `Position: ${historyInfo.currentIndex + 1}/${historyInfo.totalStates}<br>`;
                }
                display += `Renders: ${stats.renders} | Draws: ${stats.draws}`;
                
                memoryDisplay.innerHTML = display;
            } catch (err) {
                warn('Memory display update error:', err);
            }
        }

        /**
         * Initialize application
         */
        initializeApplication() {
            this.errorHandler.safe(() => {
                // Initial render
                this.canvasService.scheduleRender();
                
                // Save initial state
                this.stateManager.saveState('initial-blank');
                
                // Update UI
                this.updateMemoryDisplay();
                
                // Auto-zoom to fit available area
                this.autoZoomToFit();
                
                // Initialize color palette by triggering color-changed event
                // Use setTimeout to ensure all components are fully initialized
                setTimeout(() => {
                    this.eventBus.emit('color-changed', this.colorManager.getState());
                    
                    // Force palette creation as backup in case event doesn't trigger
                    setTimeout(() => {
                        if (this.uiController && typeof this.uiController.createPalette === 'function') {
                            this.uiController.createPalette();
                        }
                    }, 200);
                }, 50);
                
                // Initialize grid overlay sizes with current zoom
                const currentZoom = this.stateManager.getState().zoom;
                this.uiController.updateGridOverlaySizes(currentZoom);
                
                // Setup initial tooltips
                setTimeout(() => {
                    this.uiController.setupTooltips();
                }, 100);
                
                // Set ready status
                this.eventBus.emit('status', {
                    message: '✓ System Ready',
                    type: 'success'
                });
            });
        }

        /**
         * Emergency save operation
         */
        emergencySave() {
            try {
                const state = this.stateManager.getState();
                if (state.pixels && state.pixels.length > 0) {
                    localStorage.setItem('zx_emergency', JSON.stringify({
                        pixels: state.pixels.map(row => Array.from(row)),
                        attributes: state.attributes,
                        timestamp: Date.now()
                    }));
                }
            } catch (err) {
                error('Emergency save failed:', err);
            }
        }

        // Public API methods for backward compatibility
        
        /**
         * Select a tool
         * @param {string} tool - Tool name
         */
        selectTool(tool) {
            this.toolManager.selectTool(tool);
        }

        /**
         * Select a shape
         * @param {string} shape - Shape name
         */
        selectShape(shape) {
            this.toolManager.selectShape(shape);
        }

        /**
         * Set ink color
         * @param {number} colorIndex - Color index
         */
        setInk(colorIndex) {
            this.colorManager.setInk(colorIndex);
        }

        /**
         * Set paper color
         * @param {number} colorIndex - Color index
         */
        setPaper(colorIndex) {
            this.colorManager.setPaper(colorIndex);
        }

        /**
         * Toggle bright mode
         */
        toggleBright() {
            this.colorManager.toggleBright();
        }

        /**
         * Toggle flash mode
         */
        toggleFlash() {
            this.colorManager.toggleFlash();
        }

        /**
         * Toggle grid
         * @param {string} type - Grid type
         */
        toggleGrid(type) {
            this.stateManager.toggleGrid(type);
        }

        /**
         * Set zoom level
         * @param {number} zoom - Zoom level
         */
        setZoom(zoom) {
            this.stateManager.setZoom(zoom);
        }

        /**
         * Auto-zoom canvas to fit available area at nearest 100% zoom level
         */
        autoZoomToFit() {
            try {
                // Get canvas container dimensions
                const canvasContainer = document.querySelector('.canvas-area');
                if (!canvasContainer) {
                    console.warn('Canvas container not found, using default zoom');
                    return;
                }

                // Get available area dimensions (subtract some padding/margins)
                const containerRect = canvasContainer.getBoundingClientRect();
                const availableWidth = containerRect.width - 100; // Leave some margin
                const availableHeight = containerRect.height - 150; // Leave room for toolbar and margins

                // ZX Spectrum canvas dimensions
                const canvasWidth = 256;
                const canvasHeight = 192;

                // Calculate zoom levels that would fit
                const maxZoomByWidth = Math.floor(availableWidth / canvasWidth);
                const maxZoomByHeight = Math.floor(availableHeight / canvasHeight);

                // Use the smaller zoom to ensure both dimensions fit
                let optimalZoom = Math.min(maxZoomByWidth, maxZoomByHeight);

                // Ensure zoom is within valid range (1-16) and at least 1
                optimalZoom = Math.max(1, Math.min(16, optimalZoom));

                // Apply the calculated zoom
                // Auto-zoom calculation complete
                this.setZoom(optimalZoom);

            } catch (error) {
                console.warn('Auto-zoom failed, using default zoom:', error);
                this.setZoom(2); // Fallback to 200% if auto-zoom fails
            }
        }

        /**
         * Auto-fit zoom - rounds to nearest 100% value
         * @param {boolean} roundToHundred - If true, rounds to nearest 100% increment
         */
        autoFitZoom(roundToHundred = false) {
            try {
                // Get canvas container dimensions
                const canvasContainer = document.querySelector('.canvas-area');
                if (!canvasContainer) {
                    console.warn('Canvas container not found, using default zoom');
                    return;
                }

                // Get available area dimensions (subtract some padding/margins)
                const containerRect = canvasContainer.getBoundingClientRect();
                const availableWidth = containerRect.width - 100; // Leave some margin
                const availableHeight = containerRect.height - 150; // Leave room for toolbar and margins

                // ZX Spectrum canvas dimensions
                const canvasWidth = 256;
                const canvasHeight = 192;

                // Calculate zoom levels that would fit
                const maxZoomByWidth = availableWidth / canvasWidth;
                const maxZoomByHeight = availableHeight / canvasHeight;

                // Use the smaller zoom to ensure both dimensions fit
                let optimalZoom = Math.min(maxZoomByWidth, maxZoomByHeight);

                // Round to nearest whole number if requested (for clean 100% increments)
                if (roundToHundred) {
                    optimalZoom = Math.round(optimalZoom);
                }

                // Ensure zoom is within valid range (1-16) and at least 1
                optimalZoom = Math.max(1, Math.min(16, optimalZoom));

                // Apply the calculated zoom
                this.setZoom(optimalZoom);
                
                // Update the dropdown to reflect the new zoom level
                const zoomSelect = document.getElementById('zoomSelect');
                if (zoomSelect) {
                    zoomSelect.value = optimalZoom.toString();
                }

            } catch (error) {
                console.warn('Auto-fit zoom failed, using default zoom:', error);
                this.setZoom(2); // Fallback to 200% if auto-fit fails
            }
        }

        /**
         * Undo last action
         */
        undo() {
            log('Main app undo() called - delegating to StateManager...');
            this.stateManager.undo();
        }

        /**
         * Redo last undone action
         */
        redo() {
            this.stateManager.redo();
        }

        /**
         * Clear canvas
         */
        clearCanvas() {
            try {
                // Clear all drawing state and preview
                this.toolManager.clearActiveState();
                this.canvasService.clearPreview();
                this.stateManager.clearCanvas();
                
                // Reset history and establish clean baseline
                log('Clearing history for new canvas...');
                this.stateManager.history.clear();
                
                // Immediately save the fresh baseline as State 0
                try {
                    log('Saving initial baseline state as State 0...');
                    this.stateManager.saveState('initial-blank');
                    log('✓ Canvas cleared and fresh baseline saved as State 0');
                    log('History after baseline save:', this.stateManager.history.getInfo());
                } catch (saveError) {
                    warn('Could not save baseline state to history:', saveError);
                }
                log('✓ Canvas cleared successfully');
            } catch (err) {
                error('❌ Error clearing canvas:', err);
                this.eventBus.emit('status', { message: '❌ Failed to clear canvas', type: 'error' });
            }
        }

        /**
         * Reset application
         */
        safeReset() {
            const historyInfo = this.historyManager ? this.historyManager.getInfo() : { totalStates: 0 };
            
            if (historyInfo.totalStates > 1) {
                if (confirm('Reset? This clears all work and reloads the tool.')) {
                    this.fullReset();
                }
            } else {
                this.fullReset();
            }
        }

        /**
         * Full reset
         */
        fullReset() {
            try {
                // Clear all drawing state and preview first
                this.toolManager.clearActiveState();
                this.canvasService.clearPreview();
                
                this.stateManager.reset();
                this.colorManager.reset();
                this.toolManager.reset();
                this.uiController.reset();
                
                // Clear emergency save
                try {
                    localStorage.removeItem('zx_emergency');
                } catch (e) {
                    // Ignore errors
                }
                
                // Reset history and establish clean baseline
                log('Clearing history for full reset...');
                this.stateManager.history.clear();
                
                // Re-render
                this.canvasService.scheduleRender();
                
                // Immediately save the fresh baseline as State 0
                try {
                    log('Saving initial baseline state as State 0...');
                    this.stateManager.saveState('initial-blank');
                    log('✓ Reset complete and fresh baseline saved as State 0');
                    log('History after baseline save:', this.stateManager.history.getInfo());
                } catch (saveError) {
                    warn('Could not save baseline state to history:', saveError);
                }
                
                this.eventBus.emit('status', {
                    message: 'System Ready',
                    type: 'info'
                });
                
                log('✓ System reset successfully');
            } catch (err) {
                error('❌ Error during system reset:', err);
                this.eventBus.emit('status', { message: '❌ Failed to reset system', type: 'error' });
            }
        }

        /**
         * Save image
         */
        saveImage() {
            this.fileService.saveImage(this.canvasService.canvas);
        }

        /**
         * Save SCR file
         */
        saveSCR() {
            const state = this.stateManager.getState();
            this.fileService.saveSCR(state.pixels, state.attributes);
        }

        /**
         * Export assembly
         */
        exportASM() {
            const state = this.stateManager.getState();
            this.fileService.exportASM(state.pixels, state.attributes);
        }

        /**
         * Load file
         */
        loadFile() {
            this.fileService.loadFile();
        }

        /**
         * Hide error dialog
         */
        hideError() {
            this.uiController.hideError();
        }

        /**
         * Recover from error
         */
        recoverFromError() {
            this.uiController.hideError();
            // Could implement state recovery here if needed
            this.eventBus.emit('status', { message: '✓ Recovered', type: 'success' });
        }

        /**
         * Manual compact
         */
        compact() {
            this.performanceService.compact();
        }

        /**
         * Light up button animation - Public interface
         * @param {string|HTMLElement} target - Button selector or element  
         * @param {string} type - Animation type: 'default', 'success', 'warning', 'danger'
         * @param {number} duration - Animation duration in milliseconds (default 600)
         */
        lightUp(target, type = 'default', duration = 600) {
            this.uiController.lightUp(target, type, duration);
        }

        /**
         * Cleanup and destroy - with aggressive memory reclamation
         */
        destroy() {
            if (this.memoryInterval) {
                clearInterval(this.memoryInterval);
                this.memoryInterval = null;
            }
            
            // Perform final aggressive memory cleanup
            if (this.memoryManager) {
                this.memoryManager.performCompleteCleanup();
                this.memoryManager.destroy();
                this.memoryManager = null;
            }
            
            this.canvasService.destroy();
            this.errorHandler.destroy();
            this.performanceService.destroy();
            this.eventBus.clear();
            
            // Aggressive cleanup of all services
            this.colorManager = null;
            this.toolManager = null;
            this.fileService = null;
            this.stateManager = null;
            this.uiController = null;
            this.drawingService = null;
            this.historyManager = null;
            
            // Clear global reference
            if (window.historyManager) {
                window.historyManager = null;
            }
            
            // Force final garbage collection if available
            if (window.gc) {
                try {
                    window.gc();
                } catch (e) {
                    // Ignore errors
                }
            }
        }
    }

    // Export for global use
    if (typeof window !== 'undefined') {
        window.ZXSpectrumPixelSmasher = ZXSpectrumPixelSmasher;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ZXSpectrumPixelSmasher;
    }
})();