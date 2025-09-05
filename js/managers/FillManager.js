/**
 * Fill Manager - Comprehensive fill operations for ZX Spectrum constraints
 * Handles all fill types: flood, pattern, gradient, fractal, smart, texture
 * Maintains backward compatibility with existing flood fill functionality
 * 
 * @class FillManager
 */
class FillManager {
    constructor(eventBus, stateManager, colorManager, memoryManager) {
        console.log('FillManager constructor called');
        
        // Validate all required dependencies
        if (!eventBus) {
            throw new Error('FillManager: eventBus is required');
        }
        if (!stateManager) {
            throw new Error('FillManager: stateManager is required');
        }
        if (!colorManager) {
            throw new Error('FillManager: colorManager is required');
        }
        if (!memoryManager) {
            console.warn('FillManager: memoryManager is optional but recommended');
        }
        
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.colorManager = colorManager;
        this.memoryManager = memoryManager;
        console.log('FillManager dependencies assigned and validated');
        
        // Fill operation limits for performance
        this.FILL_LIMITS = {
            flood: 50000,
            pattern: 100000,
            gradient: 256 * 192, // Full canvas
            fractal: 50000,
            smart: 75000,
            texture: 100000
        };
        
        // ZX Spectrum constraints
        this.CANVAS_WIDTH = 256;
        this.CANVAS_HEIGHT = 192;
        this.ATTR_BLOCK_SIZE = 8;
        
        // Pattern definitions
        console.log('Initializing patterns...');
        try {
            this.patterns = this.initializePatterns();
            console.log('Patterns initialized successfully:', Object.keys(this.patterns));
        } catch (error) {
            console.error('Error initializing patterns:', error);
            throw error;
        }
        
        // Current fill configuration
        this.currentFill = {
            type: 'flood',
            options: {}
        };
        
        this.debug = false;
        console.log('FillManager constructor completed successfully');
    }
    
    /**
     * Initialize pattern definitions for pattern fills
     * @returns {Object} Pattern definitions
     */
    initializePatterns() {
        return {
            dots: {
                width: 4,
                height: 4,
                pattern: [
                    [0, 0, 0, 0],
                    [0, 1, 0, 1],
                    [0, 0, 0, 0],
                    [1, 0, 1, 0]
                ]
            },
            lines: {
                width: 2,
                height: 2,
                pattern: [
                    [1, 0],
                    [1, 0]
                ]
            },
            checkerboard: {
                width: 2,
                height: 2,
                pattern: [
                    [1, 0],
                    [0, 1]
                ]
            },
            crosshatch: {
                width: 4,
                height: 4,
                pattern: [
                    [1, 0, 0, 1],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                    [1, 0, 0, 1]
                ]
            },
            grid: {
                width: 8,
                height: 8,
                pattern: Array(8).fill(null).map((_, y) => 
                    Array(8).fill(null).map((_, x) => 
                        (x === 0 || y === 0) ? 1 : 0
                    )
                )
            },
            noise: {
                width: 1,
                height: 1,
                pattern: null, // Generated dynamically
                generator: () => Math.random() > 0.5 ? 1 : 0
            }
        };
    }
    
    /**
     * Set current fill type and options
     * @param {string} type - Fill type
     * @param {Object} options - Fill options
     */
    setFillType(type, options = {}) {
        this.currentFill = { type, options };
        this.eventBus.emit('fill-type-changed', { type, options });
    }
    
    /**
     * Main fill operation entry point - maintains backward compatibility
     * @param {Object} data - Fill data { x, y, erase, type?, options? }
     */
    fill(data) {
        const { x, y, erase, type = this.currentFill.type, options = this.currentFill.options } = data;
        
        // Bounds checking
        if (x < 0 || x >= this.CANVAS_WIDTH || y < 0 || y >= this.CANVAS_HEIGHT) {
            this.debug && console.log(`Fill bounds check failed: ${x}, ${y}`);
            return;
        }
        
        // Memory check before large operations
        if (this.memoryManager && this.memoryManager.isMemoryLow()) {
            this.eventBus.emit('status', { 
                message: '⚠ Memory low - fill operation limited', 
                type: 'warning' 
            });
        }
        
        try {
            // Route to appropriate fill method
            switch (type) {
                case 'flood':
                    this.floodFill({ x, y, erase, ...options });
                    break;
                case 'pattern':
                    this.patternFill({ x, y, erase, ...options });
                    break;
                case 'gradient':
                    this.gradientFill({ x, y, erase, ...options });
                    break;
                case 'fractal':
                    this.fractalFill({ x, y, erase, ...options });
                    break;
                case 'smart':
                    this.smartFill({ x, y, erase, ...options });
                    break;
                case 'texture':
                    this.textureFill({ x, y, erase, ...options });
                    break;
                default:
                    // Fallback to flood fill for backward compatibility
                    this.floodFill({ x, y, erase });
                    break;
            }
        } catch (error) {
            console.error(`Fill operation failed (${type}):`, error);
            this.eventBus.emit('status', { 
                message: `❌ Fill operation failed: ${error.message}`, 
                type: 'error' 
            });
        }
    }
    
    /**
     * Flood fill implementation - extracted from main application
     * Maintains exact compatibility with existing implementation
     * @param {Object} params - Fill parameters
     */
    floodFill({ x, y, erase }) {
        const state = this.stateManager.getState();
        
        if (x < 0 || x > 255 || y < 0 || y > 191) return;
        
        const target = state.pixels[y][x];
        const fill = erase ? 0 : 1;
        
        if (target === fill) return;
        
        const stack = [{ x, y }];
        const visited = new Set();
        let changed = 0;
        const FILL_LIMIT = this.FILL_LIMITS.flood;
        
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
        
        this.handleFillCompletion('flood', changed, FILL_LIMIT, erase, target);
    }
    
    /**
     * Pattern fill implementation
     * @param {Object} params - Fill parameters
     */
    patternFill({ x, y, erase, patternName = 'dots', scale = 1 }) {
        const state = this.stateManager.getState();
        const pattern = this.patterns[patternName];
        
        if (!pattern) {
            throw new Error(`Unknown pattern: ${patternName}`);
        }
        
        const target = state.pixels[y][x];
        const stack = [{ x, y }];
        const visited = new Set();
        let changed = 0;
        const FILL_LIMIT = this.FILL_LIMITS.pattern;
        
        while (stack.length > 0 && changed < FILL_LIMIT) {
            const { x: currentX, y: currentY } = stack.pop();
            const key = `${currentX},${currentY}`;
            
            if (visited.has(key)) continue;
            if (currentX < 0 || currentX >= this.CANVAS_WIDTH || 
                currentY < 0 || currentY >= this.CANVAS_HEIGHT) continue;
            if (state.pixels[currentY][currentX] !== target) continue;
            
            visited.add(key);
            
            // Calculate pattern value
            const patternValue = this.getPatternValue(pattern, currentX, currentY, scale);
            const fillValue = erase ? 0 : patternValue;
            
            this.drawPixel(currentX, currentY, fillValue, state);
            changed++;
            
            // Add neighbors
            stack.push({ x: currentX + 1, y: currentY });
            stack.push({ x: currentX - 1, y: currentY });
            stack.push({ x: currentX, y: currentY + 1 });
            stack.push({ x: currentX, y: currentY - 1 });
        }
        
        this.handleFillCompletion('pattern', changed, FILL_LIMIT, erase, target);
    }
    
    /**
     * Gradient fill implementation
     * @param {Object} params - Fill parameters
     */
    gradientFill({ x, y, erase, gradientType = 'linear', direction = 0, radius = 100 }) {
        const state = this.stateManager.getState();
        const target = state.pixels[y][x];
        const stack = [{ x, y }];
        const visited = new Set();
        let changed = 0;
        const FILL_LIMIT = this.FILL_LIMITS.gradient;
        
        // Center point for radial gradients
        const centerX = x;
        const centerY = y;
        
        while (stack.length > 0 && changed < FILL_LIMIT) {
            const { x: currentX, y: currentY } = stack.pop();
            const key = `${currentX},${currentY}`;
            
            if (visited.has(key)) continue;
            if (currentX < 0 || currentX >= this.CANVAS_WIDTH || 
                currentY < 0 || currentY >= this.CANVAS_HEIGHT) continue;
            if (state.pixels[currentY][currentX] !== target) continue;
            
            visited.add(key);
            
            // Calculate gradient value
            const gradientValue = this.getGradientValue(
                gradientType, currentX, currentY, centerX, centerY, direction, radius
            );
            const fillValue = erase ? 0 : gradientValue;
            
            this.drawPixel(currentX, currentY, fillValue, state);
            changed++;
            
            // Add neighbors
            stack.push({ x: currentX + 1, y: currentY });
            stack.push({ x: currentX - 1, y: currentY });
            stack.push({ x: currentX, y: currentY + 1 });
            stack.push({ x: currentX, y: currentY - 1 });
        }
        
        this.handleFillCompletion('gradient', changed, FILL_LIMIT, erase, target);
    }
    
    /**
     * Fractal fill implementation
     * @param {Object} params - Fill parameters
     */
    fractalFill({ x, y, erase, fractalType = 'mandelbrot', iterations = 50, zoom = 1 }) {
        const state = this.stateManager.getState();
        const target = state.pixels[y][x];
        const stack = [{ x, y }];
        const visited = new Set();
        let changed = 0;
        const FILL_LIMIT = this.FILL_LIMITS.fractal;
        
        while (stack.length > 0 && changed < FILL_LIMIT) {
            const { x: currentX, y: currentY } = stack.pop();
            const key = `${currentX},${currentY}`;
            
            if (visited.has(key)) continue;
            if (currentX < 0 || currentX >= this.CANVAS_WIDTH || 
                currentY < 0 || currentY >= this.CANVAS_HEIGHT) continue;
            if (state.pixels[currentY][currentX] !== target) continue;
            
            visited.add(key);
            
            // Calculate fractal value
            const fractalValue = this.getFractalValue(
                fractalType, currentX, currentY, iterations, zoom
            );
            const fillValue = erase ? 0 : fractalValue;
            
            this.drawPixel(currentX, currentY, fillValue, state);
            changed++;
            
            // Add neighbors
            stack.push({ x: currentX + 1, y: currentY });
            stack.push({ x: currentX - 1, y: currentY });
            stack.push({ x: currentX, y: currentY + 1 });
            stack.push({ x: currentX, y: currentY - 1 });
        }
        
        this.handleFillCompletion('fractal', changed, FILL_LIMIT, erase, target);
    }
    
    /**
     * Smart fill implementation with tolerance and edge detection
     * @param {Object} params - Fill parameters
     */
    smartFill({ x, y, erase, tolerance = 0, edgeAware = false, regionConstrained = true }) {
        const state = this.stateManager.getState();
        const target = state.pixels[y][x];
        const fill = erase ? 0 : 1;
        
        if (target === fill && tolerance === 0) return;
        
        const stack = [{ x, y }];
        const visited = new Set();
        let changed = 0;
        const FILL_LIMIT = this.FILL_LIMITS.smart;
        
        while (stack.length > 0 && changed < FILL_LIMIT) {
            const { x: currentX, y: currentY } = stack.pop();
            const key = `${currentX},${currentY}`;
            
            if (visited.has(key)) continue;
            if (currentX < 0 || currentX >= this.CANVAS_WIDTH || 
                currentY < 0 || currentY >= this.CANVAS_HEIGHT) continue;
            
            const currentPixel = state.pixels[currentY][currentX];
            
            // Smart tolerance check
            if (!this.isWithinTolerance(currentPixel, target, tolerance)) continue;
            
            // Edge awareness check
            if (edgeAware && this.isEdgePixel(state, currentX, currentY)) continue;
            
            visited.add(key);
            this.drawPixel(currentX, currentY, fill, state);
            changed++;
            
            // Add neighbors
            stack.push({ x: currentX + 1, y: currentY });
            stack.push({ x: currentX - 1, y: currentY });
            stack.push({ x: currentX, y: currentY + 1 });
            stack.push({ x: currentX, y: currentY - 1 });
        }
        
        this.handleFillCompletion('smart', changed, FILL_LIMIT, erase, target);
    }
    
    /**
     * Texture fill implementation
     * @param {Object} params - Fill parameters
     */
    textureFill({ x, y, erase, textureType = 'brick', scale = 1, rotation = 0 }) {
        const state = this.stateManager.getState();
        const target = state.pixels[y][x];
        const stack = [{ x, y }];
        const visited = new Set();
        let changed = 0;
        const FILL_LIMIT = this.FILL_LIMITS.texture;
        
        while (stack.length > 0 && changed < FILL_LIMIT) {
            const { x: currentX, y: currentY } = stack.pop();
            const key = `${currentX},${currentY}`;
            
            if (visited.has(key)) continue;
            if (currentX < 0 || currentX >= this.CANVAS_WIDTH || 
                currentY < 0 || currentY >= this.CANVAS_HEIGHT) continue;
            if (state.pixels[currentY][currentX] !== target) continue;
            
            visited.add(key);
            
            // Calculate texture value
            const textureValue = this.getTextureValue(
                textureType, currentX, currentY, scale, rotation
            );
            const fillValue = erase ? 0 : textureValue;
            
            this.drawPixel(currentX, currentY, fillValue, state);
            changed++;
            
            // Add neighbors
            stack.push({ x: currentX + 1, y: currentY });
            stack.push({ x: currentX - 1, y: currentY });
            stack.push({ x: currentX, y: currentY + 1 });
            stack.push({ x: currentX, y: currentY - 1 });
        }
        
        this.handleFillCompletion('texture', changed, FILL_LIMIT, erase, target);
    }
    
    /**
     * Get pattern value at specific coordinates
     * @param {Object} pattern - Pattern definition
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} scale - Scale factor
     * @returns {number} Pattern value (0 or 1)
     */
    getPatternValue(pattern, x, y, scale) {
        if (pattern.generator) {
            return pattern.generator();
        }
        
        const scaledX = Math.floor(x / scale) % pattern.width;
        const scaledY = Math.floor(y / scale) % pattern.height;
        return pattern.pattern[scaledY][scaledX];
    }
    
    /**
     * Get gradient value at specific coordinates
     * @param {string} type - Gradient type
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} centerX - Center X
     * @param {number} centerY - Center Y
     * @param {number} direction - Direction in degrees
     * @param {number} radius - Radius for radial gradients
     * @returns {number} Gradient value (0 or 1)
     */
    getGradientValue(type, x, y, centerX, centerY, direction, radius) {
        let value = 0;
        
        switch (type) {
            case 'linear':
                const angle = direction * Math.PI / 180;
                const distance = (x - centerX) * Math.cos(angle) + (y - centerY) * Math.sin(angle);
                value = (distance + radius) / (2 * radius);
                break;
                
            case 'radial':
                const radialDist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                value = Math.min(radialDist / radius, 1);
                break;
                
            case 'angular':
                const deltaX = x - centerX;
                const deltaY = y - centerY;
                const angleValue = (Math.atan2(deltaY, deltaX) + Math.PI) / (2 * Math.PI);
                value = angleValue;
                break;
                
            case 'diamond':
                const diamondDist = Math.abs(x - centerX) + Math.abs(y - centerY);
                value = Math.min(diamondDist / radius, 1);
                break;
        }
        
        return value > 0.5 ? 1 : 0;
    }
    
    /**
     * Get fractal value at specific coordinates
     * @param {string} type - Fractal type
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} iterations - Maximum iterations
     * @param {number} zoom - Zoom factor
     * @returns {number} Fractal value (0 or 1)
     */
    getFractalValue(type, x, y, iterations, zoom) {
        const scaledX = (x - this.CANVAS_WIDTH / 2) / (this.CANVAS_WIDTH / 4) / zoom;
        const scaledY = (y - this.CANVAS_HEIGHT / 2) / (this.CANVAS_HEIGHT / 4) / zoom;
        
        let value = 0;
        
        switch (type) {
            case 'mandelbrot':
                value = this.mandelbrot(scaledX, scaledY, iterations);
                break;
            case 'julia':
                value = this.julia(scaledX, scaledY, -0.7, 0.27015, iterations);
                break;
            case 'sierpinski':
                value = this.sierpinski(x, y);
                break;
            case 'dragon':
                value = this.dragon(x, y);
                break;
            case 'plasma':
                value = this.plasma(x, y);
                break;
            case 'perlin':
                value = this.perlin(scaledX, scaledY);
                break;
        }
        
        return value > 0.5 ? 1 : 0;
    }
    
    /**
     * Get texture value at specific coordinates
     * @param {string} type - Texture type
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} scale - Scale factor
     * @param {number} rotation - Rotation in degrees
     * @returns {number} Texture value (0 or 1)
     */
    getTextureValue(type, x, y, scale, rotation) {
        // Apply rotation if specified
        let rotX = x, rotY = y;
        if (rotation !== 0) {
            const angle = rotation * Math.PI / 180;
            const centerX = this.CANVAS_WIDTH / 2;
            const centerY = this.CANVAS_HEIGHT / 2;
            rotX = (x - centerX) * Math.cos(angle) - (y - centerY) * Math.sin(angle) + centerX;
            rotY = (x - centerX) * Math.sin(angle) + (y - centerY) * Math.cos(angle) + centerY;
        }
        
        const scaledX = rotX / scale;
        const scaledY = rotY / scale;
        
        switch (type) {
            case 'brick':
                const brickWidth = 16;
                const brickHeight = 8;
                const offsetX = (Math.floor(scaledY / brickHeight) % 2) * (brickWidth / 2);
                return ((Math.floor(scaledX + offsetX) % brickWidth) < 2 || 
                        (Math.floor(scaledY) % brickHeight) < 1) ? 1 : 0;
                
            case 'wood':
                const woodGrain = Math.sin(scaledY * 0.1) * 0.1;
                return (Math.floor(scaledX + woodGrain) % 4) < 2 ? 1 : 0;
                
            case 'fabric':
                return ((Math.floor(scaledX) + Math.floor(scaledY)) % 2) === 0 ? 1 : 0;
                
            case 'organic':
                const organicValue = (Math.sin(scaledX * 0.1) + Math.cos(scaledY * 0.1)) / 2;
                return organicValue > 0 ? 1 : 0;
                
            default:
                return Math.random() > 0.5 ? 1 : 0;
        }
    }
    
    /**
     * Check if pixel value is within tolerance of target
     * @param {number} current - Current pixel value
     * @param {number} target - Target pixel value
     * @param {number} tolerance - Tolerance level
     * @returns {boolean} Within tolerance
     */
    isWithinTolerance(current, target, tolerance) {
        if (tolerance === 0) return current === target;
        return Math.abs(current - target) <= tolerance;
    }
    
    /**
     * Check if pixel is an edge pixel
     * @param {Object} state - Canvas state
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Is edge pixel
     */
    isEdgePixel(state, x, y) {
        const current = state.pixels[y][x];
        const neighbors = [
            [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
        ];
        
        for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < this.CANVAS_WIDTH && ny >= 0 && ny < this.CANVAS_HEIGHT) {
                if (state.pixels[ny][nx] !== current) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Mandelbrot fractal calculation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} maxIter - Maximum iterations
     * @returns {number} Fractal value
     */
    mandelbrot(x, y, maxIter) {
        let zx = 0, zy = 0;
        let cx = x, cy = y;
        let iter = 0;
        
        while (zx * zx + zy * zy < 4 && iter < maxIter) {
            const tmp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = tmp;
            iter++;
        }
        
        return iter / maxIter;
    }
    
    /**
     * Julia fractal calculation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} cx - Complex constant X
     * @param {number} cy - Complex constant Y
     * @param {number} maxIter - Maximum iterations
     * @returns {number} Fractal value
     */
    julia(x, y, cx, cy, maxIter) {
        let zx = x, zy = y;
        let iter = 0;
        
        while (zx * zx + zy * zy < 4 && iter < maxIter) {
            const tmp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = tmp;
            iter++;
        }
        
        return iter / maxIter;
    }
    
    /**
     * Sierpinski triangle calculation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Fractal value
     */
    sierpinski(x, y) {
        return (x & y) === 0 ? 1 : 0;
    }
    
    /**
     * Dragon curve approximation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Fractal value
     */
    dragon(x, y) {
        const n = ((x ^ y) & 1) + ((x & y) & 1);
        return n % 2;
    }
    
    /**
     * Plasma fractal calculation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Fractal value
     */
    plasma(x, y) {
        const value = Math.sin(x * 0.1) + Math.sin(y * 0.1) + 
                     Math.sin((x + y) * 0.05) + Math.sin(Math.sqrt(x * x + y * y) * 0.1);
        return (value + 4) / 8;
    }
    
    /**
     * Simplified Perlin noise calculation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Noise value
     */
    perlin(x, y) {
        // Simplified Perlin-like noise
        const a = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (a - Math.floor(a));
    }
    
    /**
     * Draw pixel with ZX Spectrum constraints
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} value - Pixel value
     * @param {Object} state - Canvas state
     */
    drawPixel(x, y, value, state) {
        if (x < 0 || x >= this.CANVAS_WIDTH || y < 0 || y >= this.CANVAS_HEIGHT) return;
        
        state.pixels[y][x] = value;
        
        // Update attribute block if needed (ZX Spectrum constraint)
        const attrX = Math.floor(x / this.ATTR_BLOCK_SIZE);
        const attrY = Math.floor(y / this.ATTR_BLOCK_SIZE);
        
        if (attrX < 32 && attrY < 24) {
            // Simple attribute update - maintain existing logic
            const currentAttr = state.attributes[attrY][attrX];
            if (currentAttr !== undefined) {
                // Preserve existing attribute logic from main application
                state.attributes[attrY][attrX] = currentAttr;
            }
        }
    }
    
    /**
     * Handle fill operation completion
     * @param {string} type - Fill type
     * @param {number} changed - Pixels changed
     * @param {number} limit - Fill limit
     * @param {boolean} erase - Erase mode
     * @param {number} target - Target pixel value
     */
    handleFillCompletion(type, changed, limit, erase, target) {
        if (changed >= limit) {
            this.eventBus.emit('status', { 
                message: `⚠ ${type} fill limited for performance (${changed} pixels)`, 
                type: 'warning' 
            });
        } else {
            const fillType = erase ? 'erased' : 'filled';
            const targetType = target === 0 ? 'paper' : 'ink';
            this.eventBus.emit('status', { 
                message: `✓ ${targetType} area ${fillType} with ${type} (${changed} pixels)`, 
                type: 'success' 
            });
        }
        
        // Save to history for undo functionality
        this.stateManager.saveState(`${type}-fill`);
        
        // Emit state change event
        const state = this.stateManager.getState();
        this.eventBus.emit('state-changed', {
            pixels: state.pixels,
            attributes: state.attributes
        });
        
        // Memory cleanup if needed
        if (this.memoryManager) {
            this.memoryManager.requestCleanup();
        }
    }
    
    /**
     * Get available fill types
     * @returns {Array} Available fill types
     */
    getAvailableFillTypes() {
        return ['flood', 'pattern', 'gradient', 'fractal', 'smart', 'texture'];
    }
    
    /**
     * Get available patterns
     * @returns {Array} Available pattern names
     */
    getAvailablePatterns() {
        return Object.keys(this.patterns);
    }
    
    /**
     * Get fill type limits
     * @returns {Object} Fill limits
     */
    getFillLimits() {
        return { ...this.FILL_LIMITS };
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FillManager;
} else if (typeof window !== 'undefined') {
    window.FillManager = FillManager;
}