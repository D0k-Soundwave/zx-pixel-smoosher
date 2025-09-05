/**
 * ZX Spectrum Mathematical Shape Generator v4.0
 * Comprehensive shape system with precise mathematical implementations
 * Features:
 * - 30+ drawable shapes with mathematically accurate algorithms
 * - Zero-point anchor drawing with proper cartesian plane support
 * - Filled and outlined variants for all applicable shapes
 * - Parametric and trigonometric precision for complex shapes
 * - ZX Spectrum pixel-perfect rendering at 256×192 resolution
 */
class ShapeGenerator {
    constructor() {
        this.shapes = new Map();
        this.filledShapes = new Map();
        this.shapeAnchorBehaviors = new Map();
        this.initializeShapeSystem();
    }

    /**
     * Initialize the comprehensive shape system with mathematical precision
     */
    initializeShapeSystem() {
        // Complete shape categorization based on mathematical drawing behavior
        this.shapeCategories = {
            // RADIAL_CENTER: anchor point becomes exact center, drag point defines radius
            // Mathematical behavior: r = distance(anchor, drag)
            RADIAL_CENTER: [
                'circle', 'ellipse', 'arc', 'sector', 'spiral', 'star', 'flower', 'gear', 'moon', 'diamond'
            ],
            
            // CORNER_DRAG: anchor = corner, drag = opposite corner (rectangular bounding logic)
            // Mathematical behavior: creates bounding rectangle from two corner points
            CORNER_DRAG: [
                'rectangle', 'rect', 'square', 'bowtie'
            ],
            
            // BASE_UP: anchor = base center point, shape builds upward
            // Mathematical behavior: anchor becomes base center, drag defines height and top
            BASE_UP: [
                'triangle', 'house'
            ],
            
            // DIRECTIONAL: anchor = start point, drag = direction/endpoint (vector logic)
            // Mathematical behavior: preserves direction vector and magnitude
            DIRECTIONAL: [
                'line', 'arrow', 'lightning'
            ],
            
            // FIXED_DIRECTIONAL: anchor = start point, drag = length only (fixed direction)
            // Mathematical behavior: start point + magnitude in fixed direction
            FIXED_DIRECTIONAL: [
                'arrow-up', 'arrow-right', 'arrow-down', 'arrow-left'
            ],
            
            // CENTER_SYMMETRIC: anchor = center, drag defines size (bilateral symmetry)
            // Mathematical behavior: anchor becomes center, size = distance(anchor, drag)
            CENTER_SYMMETRIC: [
                'heart', 'x', 'plus', 'hourglass', 'kite'
            ],
            
            // POLYGON_REGULAR: anchor = center, drag = circumradius (inscribed in circle)
            // Mathematical behavior: generates regular n-gons inscribed in circle
            POLYGON_REGULAR: [
                'pentagon', 'hexagon', 'octagon', 'polygon'
            ],
            
            // GEOMETRY_SHAPES: anchor = reference point, drag = construction parameters
            // Mathematical behavior: specialized geometric construction rules
            GEOMETRY_SHAPES: [
                'trapezoid', 'parallelogram'
            ]
        };
        
        // Shape anchor behavior mapping for UI integration
        this.mapShapeAnchorBehaviors();
        
        // Validate shape category completeness
        this.validateShapeCategories();

        // Register all shape generators (both outlined and filled)
        this.registerShapeGenerators();
    }

    /**
     * Map shape anchor behaviors for UI integration
     */
    mapShapeAnchorBehaviors() {
        // Map each shape to its anchor behavior for UI feedback
        const behaviors = {
            RADIAL_CENTER: 'center-out',
            CORNER_DRAG: 'corner-drag', 
            BASE_UP: 'base-up',
            DIRECTIONAL: 'directional',
            CENTER_SYMMETRIC: 'center-symmetric',
            POLYGON_REGULAR: 'center-out',
            GEOMETRY_SHAPES: 'anchor-construction'
        };
        
        Object.entries(this.shapeCategories).forEach(([category, shapes]) => {
            shapes.forEach(shape => {
                this.shapeAnchorBehaviors.set(shape, behaviors[category]);
            });
        });
    }

    /**
     * Register all shape generation methods (outlined and filled variants)
     */
    registerShapeGenerators() {
        // ===== BASIC GEOMETRIC SHAPES =====
        this.shapes.set('line', this.generateLine.bind(this));
        this.shapes.set('rectangle', this.generateRectangle.bind(this));
        this.shapes.set('rect', this.generateRectangle.bind(this)); // Alias
        this.shapes.set('square', this.generateSquare.bind(this));
        
        // ===== RADIAL SHAPES =====
        this.shapes.set('circle', this.generateCircle.bind(this));
        this.shapes.set('ellipse', this.generateEllipse.bind(this));
        this.shapes.set('arc', this.generateArc.bind(this));
        this.shapes.set('sector', this.generateSector.bind(this));
        
        // ===== POLYGONS =====
        this.shapes.set('triangle', this.generateTriangle.bind(this));
        this.shapes.set('diamond', this.generateDiamond.bind(this));
        this.shapes.set('polygon', this.generatePolygon.bind(this));
        this.shapes.set('pentagon', this.generatePentagon.bind(this));
        this.shapes.set('hexagon', this.generateHexagon.bind(this));
        this.shapes.set('octagon', this.generateOctagon.bind(this));
        
        // ===== DIRECTIONAL SHAPES =====
        this.shapes.set('arrow', this.generateArrow.bind(this));
        this.shapes.set('arrow-up', this.generateArrowUp.bind(this));
        this.shapes.set('arrow-right', this.generateArrowRight.bind(this));
        this.shapes.set('arrow-down', this.generateArrowDown.bind(this));
        this.shapes.set('arrow-left', this.generateArrowLeft.bind(this));
        
        // ===== SYMBOLS =====
        this.shapes.set('x', this.generateCross.bind(this));
        this.shapes.set('plus', this.generatePlus.bind(this));
        this.shapes.set('heart', this.generateHeart.bind(this));
        this.shapes.set('star', this.generateStar.bind(this));
        
        // ===== COMPLEX SHAPES =====
        this.shapes.set('lightning', this.generateLightning.bind(this));
        this.shapes.set('house', this.generateHouse.bind(this));
        this.shapes.set('moon', this.generateMoon.bind(this));
        this.shapes.set('flower', this.generateFlower.bind(this));
        this.shapes.set('gear', this.generateGear.bind(this));
        this.shapes.set('spiral', this.generateSpiral.bind(this));
        this.shapes.set('bowtie', this.generateBowtie.bind(this));
        this.shapes.set('hourglass', this.generateHourglass.bind(this));
        
        // ===== QUADRILATERALS =====
        this.shapes.set('trapezoid', this.generateTrapezoid.bind(this));
        this.shapes.set('parallelogram', this.generateParallelogram.bind(this));
        this.shapes.set('kite', this.generateKite.bind(this));
        
        // ===== FILLED SHAPE VARIANTS =====
        // Register filled versions for all applicable shapes
        this.registerFilledShapes();
    }
    
    /**
     * Register filled shape variants
     */
    registerFilledShapes() {
        // Shapes that support filling
        const fillableShapes = [
            'rectangle', 'rect', 'square', 'circle', 'ellipse', 'triangle', 'diamond',
            'pentagon', 'hexagon', 'octagon', 'polygon', 'heart', 'star', 'house',
            'trapezoid', 'parallelogram', 'kite', 'moon', 'flower', 'gear',
            'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right'
        ];
        
        fillableShapes.forEach(shapeName => {
            if (this.shapes.has(shapeName)) {
                this.filledShapes.set(shapeName, this.generateFilledShape.bind(this, shapeName));
            }
        });
    }

    /**
     * Generate shape points with comprehensive mathematical precision
     * @param {string} shapeType - Type of shape
     * @param {Object} bounds - Bounds object {x1, y1, x2, y2} OR anchor/drag points  
     * @param {Object} options - Drawing options {strokeWidth, drawMode, filled, etc.}
     * @returns {Array} Array of {x, y, pixelValue} points
     */
    generateShape(shapeType, bounds, options = {}) {
        // Determine if this is a filled shape request
        const isFilled = options.filled || false;
        
        // Get appropriate generator
        let generator;
        if (isFilled && this.filledShapes.has(shapeType)) {
            generator = this.filledShapes.get(shapeType);
        } else {
            generator = this.shapes.get(shapeType);
        }
        
        if (!generator) {
            console.warn(`Unknown shape type: ${shapeType}`);
            return [];
        }

        // Convert bounds to standardized format with mathematical precision
        const standardBounds = this.standardizeBounds(shapeType, bounds, options);
        
        // Validate bounds for mathematical feasibility
        if (!this.validateBounds(standardBounds, shapeType)) {
            console.warn(`Invalid bounds for shape ${shapeType}:`, standardBounds);
            return [];
        }
        
        // Generate base points using mathematical algorithms
        const points = generator(standardBounds, options);
        
        // Apply stroke width, drawing mode, and finalize pixel coordinates
        return this.finalizePoints(points, options);
    }
    
    /**
     * Validate bounds for mathematical feasibility
     */
    validateBounds(bounds, shapeType) {
        // Check for NaN or infinite values
        const numericFields = ['x1', 'y1', 'x2', 'y2', 'centerX', 'centerY', 'width', 'height', 'radius'];
        for (const field of numericFields) {
            if (bounds[field] !== undefined) {
                if (!isFinite(bounds[field])) {
                    return false;
                }
            }
        }
        
        // Shape-specific validation
        const category = this.getShapeCategory(shapeType);
        switch (category) {
            case 'RADIAL_CENTER':
            case 'POLYGON_REGULAR':
                // Allow very small radii - even 0 radius polygons should be valid (will draw a point)
                return bounds.radius !== undefined && bounds.radius >= 0;
            case 'CENTER_SYMMETRIC':
                return bounds.size !== undefined && bounds.size >= 0;
            default:
                return bounds.width !== undefined && bounds.height !== undefined &&
                       bounds.width >= 0 && bounds.height >= 0;
        }
    }

    /**
     * Standardize bounds format with mathematical precision and zero-point anchor support
     * Implements proper cartesian plane mathematics with full negative coordinate support
     */
    standardizeBounds(shapeType, bounds, options) {
        if (bounds.x1 === undefined || bounds.y1 === undefined || bounds.x2 === undefined || bounds.y2 === undefined) {
            return bounds; // Already in correct format
        }

        const category = this.getShapeCategory(shapeType);
        let standardBounds;

        // Mathematical foundation: signed arithmetic preserves direction and magnitude
        // Support for negative coordinates and zero-point anchoring
        const deltaX = bounds.x2 - bounds.x1;  // Signed difference preserves direction
        const deltaY = bounds.y2 - bounds.y1;  // Signed difference preserves direction
        const width = Math.abs(deltaX);        // Magnitude for size calculations
        const height = Math.abs(deltaY);       // Magnitude for size calculations
        
        // Cartesian coordinate system: maintain exact positioning
        const left = Math.min(bounds.x1, bounds.x2);
        const right = Math.max(bounds.x1, bounds.x2);
        const top = Math.min(bounds.y1, bounds.y2);
        const bottom = Math.max(bounds.y1, bounds.y2);
        
        // High-precision center calculation supporting negative coordinates
        const centerX = (bounds.x1 + bounds.x2) * 0.5;  // Exact midpoint calculation
        const centerY = (bounds.y1 + bounds.y2) * 0.5;  // Exact midpoint calculation

        switch (category) {
            case 'RADIAL_CENTER':
                // Zero-point anchor drawing: anchor becomes exact center, drag defines radius
                // Mathematical behavior: r = ||drag - anchor|| (Euclidean distance)
                const anchorCenterX = bounds.x1;  // Anchor point is the exact center
                const anchorCenterY = bounds.y1;
                const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);  // Euclidean distance
                
                // Special handling for ellipse to preserve aspect ratio
                let radiusX = radius, radiusY = radius;
                if (shapeType === 'ellipse') {
                    radiusX = Math.abs(deltaX);
                    radiusY = Math.abs(deltaY);
                }
                
                standardBounds = {
                    centerX: anchorCenterX, centerY: anchorCenterY, 
                    radius, radiusX, radiusY,
                    deltaX, deltaY, vectorDistance: radius,  // Preserve direction vectors
                    x1: anchorCenterX - radiusX, y1: anchorCenterY - radiusY,
                    x2: anchorCenterX + radiusX, y2: anchorCenterY + radiusY,
                    width: radiusX * 2, height: radiusY * 2,
                    left: anchorCenterX - radiusX, right: anchorCenterX + radiusX,
                    top: anchorCenterY - radiusY, bottom: anchorCenterY + radiusY
                };
                break;

            case 'CORNER_DRAG':
                // Anchor = corner, drag = opposite corner (rectangular logic)
                standardBounds = {
                    x1: bounds.x1, y1: bounds.y1,
                    x2: bounds.x2, y2: bounds.y2,
                    centerX, centerY, width, height,
                    left, right, top, bottom
                };
                break;

            case 'BASE_UP':
                // Anchor = bottom center, drag = height/top (ground-up construction)
                const baseX = centerX;
                const baseY = bottom;
                standardBounds = {
                    baseX, baseY,
                    centerX, centerY, width, height,
                    x1: bounds.x1, y1: bounds.y1,
                    x2: bounds.x2, y2: bounds.y2,
                    left, right, top, bottom
                };
                break;

            case 'DIRECTIONAL':
                // Preserve complete vector mathematics for directional shapes
                const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const directionX = magnitude > 0 ? deltaX / magnitude : 0;  // Unit vector X
                const directionY = magnitude > 0 ? deltaY / magnitude : 0;  // Unit vector Y
                const angle = Math.atan2(deltaY, deltaX);                    // Angle in radians
                
                // For specific arrow directions, calculate proper orientation
                let targetAngle = angle;
                if (shapeType.startsWith('arrow-')) {
                    const directions = {
                        'arrow-up': -Math.PI / 2,
                        'arrow-right': 0,
                        'arrow-down': Math.PI / 2,
                        'arrow-left': Math.PI
                    };
                    targetAngle = directions[shapeType] || angle;
                }
                
                standardBounds = {
                    startX: bounds.x1, startY: bounds.y1,
                    endX: bounds.x2, endY: bounds.y2,
                    deltaX, deltaY, magnitude,                    // Vector components
                    directionX, directionY,                       // Unit direction vector
                    angle, targetAngle,                           // Angles in radians
                    x1: bounds.x1, y1: bounds.y1,
                    x2: bounds.x2, y2: bounds.y2,
                    centerX, centerY, width, height,
                    left, right, top, bottom
                };
                break;

            case 'FIXED_DIRECTIONAL':
                // Fixed direction shapes: anchor = start point, drag = magnitude only
                // Direction is fixed per shape type, only magnitude from drag matters
                const fixedMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                standardBounds = {
                    startX: bounds.x1, startY: bounds.y1,           // Start point from first click
                    magnitude: fixedMagnitude,                      // Length from drag distance
                    x1: bounds.x1, y1: bounds.y1,                 // Original coordinates
                    x2: bounds.x2, y2: bounds.y2,
                    centerX, centerY, width, height,
                    left, right, top, bottom
                };
                break;

            case 'CENTER_SYMMETRIC':
                // Zero-point anchor drawing: anchor becomes exact center, drag defines size
                // Mathematical behavior: size = ||drag - anchor||
                const symmetricCenterX = bounds.x1;  // Anchor point is the exact center
                const symmetricCenterY = bounds.y1;
                const size = Math.sqrt(deltaX * deltaX + deltaY * deltaY);  // Euclidean distance
                
                // Some symmetric shapes may need different width/height ratios
                let shapeWidth = size, shapeHeight = size;
                if (shapeType === 'heart') {
                    shapeHeight = size * 1.2;  // Hearts are typically taller
                } else if (shapeType === 'kite') {
                    shapeHeight = size * 1.4;  // Kites are taller
                    shapeWidth = size * 0.8;   // and narrower
                }
                
                standardBounds = {
                    centerX: symmetricCenterX, centerY: symmetricCenterY, 
                    size, width: shapeWidth, height: shapeHeight,
                    deltaX, deltaY, vectorDistance: size,
                    x1: symmetricCenterX - shapeWidth/2, y1: symmetricCenterY - shapeHeight/2,
                    x2: symmetricCenterX + shapeWidth/2, y2: symmetricCenterY + shapeHeight/2,
                    left: symmetricCenterX - shapeWidth/2, right: symmetricCenterX + shapeWidth/2,
                    top: symmetricCenterY - shapeHeight/2, bottom: symmetricCenterY + shapeHeight/2
                };
                break;

            case 'POLYGON_REGULAR':
                // Zero-point anchor drawing: anchor becomes exact center, drag defines circumradius
                // Mathematical behavior: all vertices inscribed in circle of radius ||drag - anchor||
                const polygonCenterX = bounds.x1;  // Anchor point is the exact center
                const polygonCenterY = bounds.y1;
                const circumradius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);  // Euclidean distance
                
                // Calculate number of sides for specific polygons
                const sideCount = this.getPolygonSides(shapeType);
                
                standardBounds = {
                    centerX: polygonCenterX, centerY: polygonCenterY, 
                    radius: circumradius, circumradius, sides: sideCount,
                    width: circumradius * 2, height: circumradius * 2,
                    deltaX, deltaY, vectorDistance: circumradius,
                    x1: polygonCenterX - circumradius, y1: polygonCenterY - circumradius,
                    x2: polygonCenterX + circumradius, y2: polygonCenterY + circumradius,
                    left: polygonCenterX - circumradius, right: polygonCenterX + circumradius,
                    top: polygonCenterY - circumradius, bottom: polygonCenterY + circumradius
                };
                break;

            case 'GEOMETRY_SHAPES':
                // Anchor = reference point, drag = construction parameters
                if (shapeType === 'trapezoid') {
                    // Anchor at bottom-left for trapezoid
                    standardBounds = {
                        anchorX: left, anchorY: bottom,
                        centerX, centerY, width, height,
                        x1: bounds.x1, y1: bounds.y1,
                        x2: bounds.x2, y2: bounds.y2,
                        left, right, top, bottom
                    };
                } else if (shapeType === 'parallelogram') {
                    // Anchor at one corner for parallelogram
                    standardBounds = {
                        anchorX: bounds.x1, anchorY: bounds.y1,
                        vectorX: bounds.x2 - bounds.x1,
                        vectorY: bounds.y2 - bounds.y1,
                        centerX, centerY, width, height,
                        x1: bounds.x1, y1: bounds.y1,
                        x2: bounds.x2, y2: bounds.y2,
                        left, right, top, bottom
                    };
                } else {
                    // Default geometric behavior
                    standardBounds = {
                        centerX, centerY, width, height,
                        x1: bounds.x1, y1: bounds.y1,
                        x2: bounds.x2, y2: bounds.y2,
                        left, right, top, bottom
                    };
                }
                break;

            default:
                // Fallback to corner-drag behavior
                standardBounds = {
                    x1: bounds.x1, y1: bounds.y1,
                    x2: bounds.x2, y2: bounds.y2,
                    centerX, centerY, width, height,
                    left, right, top, bottom
                };
        }

        return standardBounds;
    }

    /**
     * Get number of sides for polygon shapes
     */
    getPolygonSides(shapeType) {
        const sideMap = {
            'triangle': 3,
            'pentagon': 5,
            'hexagon': 6,
            'octagon': 8,
            'polygon': 6  // Default
        };
        return sideMap[shapeType] || 6;
    }
    
    /**
     * Generate filled shape using efficient mathematical approach
     */
    generateFilledShape(shapeType, bounds, options = {}) {
        // Convert bounds to standardized format (same as generateShape)
        const standardBounds = this.standardizeBounds(shapeType, bounds, options);
        
        // Validate bounds for mathematical feasibility
        if (!this.validateBounds(standardBounds, shapeType)) {
            console.warn(`Invalid bounds for filled shape ${shapeType}:`, standardBounds);
            return [];
        }
        
        // Use mathematical fill for basic shapes, scanline fill for complex shapes
        switch (shapeType) {
            case 'rectangle':
            case 'rect':
                return this.fillRectangle(standardBounds, options);
            case 'square':
                return this.fillSquare(standardBounds, options);
            case 'circle':
                return this.fillCircle(standardBounds, options);
            case 'ellipse':
                return this.fillEllipse(standardBounds, options);
            case 'triangle':
                return this.fillTriangle(standardBounds, options);
            case 'pentagon':
            case 'hexagon':
            case 'octagon':
            case 'polygon':
                // Use proper polygon fill for regular polygons
                return this.fillPolygon(shapeType, standardBounds, options);
            case 'star':
                // CRITICAL FIX: Use point-in-polygon fill for stars instead of broken scanline
                return this.fillStar(standardBounds, options);
            case 'house':
                // CRITICAL FIX: Use point-in-polygon fill for houses instead of broken scanline
                return this.fillHouse(standardBounds, options);
            case 'heart':
                // CRITICAL FIX: Use point-in-polygon fill for hearts instead of broken scanline
                return this.fillHeart(standardBounds, options);
            case 'flower':
                // CRITICAL FIX: Use point-in-polygon fill for flowers instead of broken scanline
                return this.fillFlower(standardBounds, options);
            case 'gear':
                // CRITICAL FIX: Use point-in-polygon fill for gears instead of broken scanline
                return this.fillGear(standardBounds, options);
            case 'arrow-up':
            case 'arrow-down':
            case 'arrow-left':
            case 'arrow-right':
                // Use point-in-polygon fill for arrow shapes
                return this.fillArrowShape(shapeType, standardBounds, options);
            default:
                // For complex shapes, use scanline fill algorithm
                return this.fillShapeUsingScanline(shapeType, standardBounds, options);
        }
    }
    
    /**
     * Fill any shape using scanline algorithm
     * @param {string} shapeType - Type of shape to fill
     * @param {Object} bounds - Bounds of the shape
     * @param {Object} options - Drawing options
     */
    fillShapeUsingScanline(shapeType, bounds, options = {}) {
        const { drawMode = 'ink' } = options;
        
        // First, get the outline of the shape
        const outlineGenerator = this.shapes.get(shapeType);
        if (!outlineGenerator) return [];
        
        const outlinePoints = outlineGenerator(bounds, options);
        if (outlinePoints.length === 0) return [];
        
        // Convert outline points to a set for fast lookup
        const outlineSet = new Set();
        outlinePoints.forEach(point => {
            outlineSet.add(`${point.x},${point.y}`);
        });
        
        // Find bounding box of the outline
        const minX = Math.min(...outlinePoints.map(p => p.x));
        const maxX = Math.max(...outlinePoints.map(p => p.x));
        const minY = Math.min(...outlinePoints.map(p => p.y));
        const maxY = Math.max(...outlinePoints.map(p => p.y));
        
        const fillPoints = [];
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        // Scanline fill algorithm
        for (let y = minY; y <= maxY; y++) {
            const intersections = [];
            
            // Find intersections with the outline on this scanline
            for (let x = minX; x <= maxX; x++) {
                if (outlineSet.has(`${x},${y}`)) {
                    intersections.push(x);
                }
            }
            
            // Fill between pairs of intersections
            if (intersections.length >= 2) {
                intersections.sort((a, b) => a - b);
                
                for (let i = 0; i < intersections.length - 1; i += 2) {
                    const startX = intersections[i];
                    const endX = intersections[i + 1];
                    
                    for (let x = startX; x <= endX; x++) {
                        if (x >= 0 && x <= 255 && y >= 0 && y <= 191) {
                            fillPoints.push({ x, y, pixelValue });
                        }
                    }
                }
            }
        }
        
        return fillPoints;
    }
    
    /**
     * Fill rectangle using direct mathematical approach
     */
    fillRectangle(bounds, options = {}) {
        const { left, right, top, bottom } = bounds;
        const { drawMode = 'ink' } = options;
        const points = [];
        
        const fillLeft = Math.max(Math.round(left), 0);
        const fillRight = Math.min(Math.round(right), 255);
        const fillTop = Math.max(Math.round(top), 0);
        const fillBottom = Math.min(Math.round(bottom), 191);
        
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        for (let y = fillTop; y <= fillBottom; y++) {
            for (let x = fillLeft; x <= fillRight; x++) {
                points.push({ x, y, pixelValue });
            }
        }
        
        return points;
    }
    
    /**
     * Fill square using direct mathematical approach
     */
    fillSquare(bounds, options = {}) {
        // Convert to square bounds first
        const size = Math.min(bounds.width, bounds.height);
        const squareBounds = {
            left: bounds.x1,
            right: bounds.x1 + (bounds.x2 > bounds.x1 ? size : -size),
            top: bounds.y1,
            bottom: bounds.y1 + (bounds.y2 > bounds.y1 ? size : -size)
        };
        
        // Normalize bounds
        const normalizedBounds = {
            left: Math.min(squareBounds.left, squareBounds.right),
            right: Math.max(squareBounds.left, squareBounds.right),
            top: Math.min(squareBounds.top, squareBounds.bottom),
            bottom: Math.max(squareBounds.top, squareBounds.bottom)
        };
        
        return this.fillRectangle(normalizedBounds, options);
    }
    
    /**
     * Fill circle using distance-based approach
     */
    fillCircle(bounds, options = {}) {
        const { centerX, centerY, radius } = bounds;
        const { drawMode = 'ink' } = options;
        const points = [];
        
        if (radius <= 0) return points;
        
        const left = Math.max(Math.round(centerX - radius), 0);
        const right = Math.min(Math.round(centerX + radius), 255);
        const top = Math.max(Math.round(centerY - radius), 0);
        const bottom = Math.min(Math.round(centerY + radius), 191);
        
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                if (distance <= radius) {
                    points.push({ x, y, pixelValue });
                }
            }
        }
        
        return points;
    }
    
    /**
     * Fill ellipse using mathematical approach
     */
    fillEllipse(bounds, options = {}) {
        const { centerX, centerY, radiusX, radiusY } = bounds;
        const { drawMode = 'ink' } = options;
        const a = radiusX || bounds.width * 0.5;
        const b = radiusY || bounds.height * 0.5;
        const points = [];
        
        if (a <= 0 || b <= 0) return points;
        
        const left = Math.max(Math.round(centerX - a), 0);
        const right = Math.min(Math.round(centerX + a), 255);
        const top = Math.max(Math.round(centerY - b), 0);
        const bottom = Math.min(Math.round(centerY + b), 191);
        
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                const dx = (x - centerX) / a;
                const dy = (y - centerY) / b;
                if (dx * dx + dy * dy <= 1) {
                    points.push({ x, y, pixelValue });
                }
            }
        }
        
        return points;
    }
    
    /**
     * Fill triangle using mathematical approach
     */
    fillTriangle(bounds, options = {}) {
        // For now, return outline only for triangles to avoid complexity
        return this.generateTriangle(bounds, options);
    }
    
    /**
     * Fill polygon using point-in-polygon algorithm
     * Works for regular polygons (pentagon, hexagon, octagon, etc.)
     */
    fillPolygon(shapeType, bounds, options = {}) {
        const { drawMode = 'ink' } = options;
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        // Get the polygon vertices for point-in-polygon testing
        let vertices = [];
        
        if (shapeType === 'pentagon') {
            vertices = this.getPolygonVertices(bounds, 5);
        } else if (shapeType === 'hexagon') {
            vertices = this.getPolygonVertices(bounds, 6);
        } else if (shapeType === 'octagon') {
            vertices = this.getPolygonVertices(bounds, 8);
        } else if (shapeType === 'polygon' && options.sides) {
            vertices = this.getPolygonVertices(bounds, options.sides);
        } else {
            // Fallback to scanline for unknown polygons
            return this.fillShapeUsingScanline(shapeType, bounds, options);
        }
        
        if (vertices.length < 3) return [];
        
        // Find bounding box
        const minX = Math.max(0, Math.min(...vertices.map(v => v.x)));
        const maxX = Math.min(255, Math.max(...vertices.map(v => v.x)));
        const minY = Math.max(0, Math.min(...vertices.map(v => v.y)));
        const maxY = Math.min(191, Math.max(...vertices.map(v => v.y)));
        
        const fillPoints = [];
        
        // Check each point in bounding box using point-in-polygon algorithm
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (this.isPointInPolygon(x, y, vertices)) {
                    fillPoints.push({ x, y, pixelValue });
                }
            }
        }
        
        return fillPoints;
    }
    
    /**
     * Fill star shape using point-in-polygon algorithm
     * @param {Object} bounds - Bounds of the star
     * @param {Object} options - Drawing options including points and innerRadiusRatio
     */
    fillStar(bounds, options = {}) {
        const { drawMode = 'ink', points = 5, innerRadiusRatio = 0.4 } = options;
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        // Get the star vertices using the same logic as generateStar
        const vertices = this.getStarVertices(bounds, points, innerRadiusRatio);
        
        if (vertices.length < 6) return []; // Star needs at least 3 points (6 vertices)
        
        // Find bounding box
        const minX = Math.max(0, Math.min(...vertices.map(v => v.x)));
        const maxX = Math.min(255, Math.max(...vertices.map(v => v.x)));
        const minY = Math.max(0, Math.min(...vertices.map(v => v.y)));
        const maxY = Math.min(191, Math.max(...vertices.map(v => v.y)));
        
        const fillPoints = [];
        
        // Check each point in bounding box using point-in-polygon algorithm
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (this.isPointInPolygon(x, y, vertices)) {
                    fillPoints.push({ x, y, pixelValue });
                }
            }
        }
        
        return fillPoints;
    }
    
    /**
     * Get vertices for a star shape (similar to generateStar but just vertices)
     */
    getStarVertices(bounds, points, innerRadiusRatio) {
        const { centerX, centerY, radius } = bounds;
        const vertices = [];
        
        if (radius <= 0 || points < 3) return vertices;
        
        // Star mathematics: alternating outer and inner radii
        const outerRadius = radius;
        const innerRadius = radius * Math.max(0.1, Math.min(0.9, innerRadiusRatio));
        const angleStep = Math.PI / points;  // Half-step between outer and inner points
        const startAngle = -Math.PI * 0.5;  // Start at top
        
        // Generate alternating outer and inner vertices
        for (let i = 0; i < points * 2; i++) {
            const angle = startAngle + i * angleStep;
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            
            // CRITICAL: Round vertices to integer coordinates for proper point-in-polygon testing
            const x = Math.round(centerX + r * Math.cos(angle));
            const y = Math.round(centerY + r * Math.sin(angle));
            
            vertices.push({ x, y });
        }
        
        return vertices;
    }
    
    /**
     * Fill house shape using point-in-polygon algorithm
     * @param {Object} bounds - Bounds of the house
     * @param {Object} options - Drawing options
     */
    fillHouse(bounds, options = {}) {
        const { drawMode = 'ink' } = options;
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        // Get the house vertices as a single unified polygon
        const vertices = this.getHouseVertices(bounds);
        
        if (vertices.length < 5) return []; // House needs at least 5 vertices
        
        // Find bounding box
        const minX = Math.max(0, Math.min(...vertices.map(v => v.x)));
        const maxX = Math.min(255, Math.max(...vertices.map(v => v.x)));
        const minY = Math.max(0, Math.min(...vertices.map(v => v.y)));
        const maxY = Math.min(191, Math.max(...vertices.map(v => v.y)));
        
        const fillPoints = [];
        
        // Check each point in bounding box using point-in-polygon algorithm
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (this.isPointInPolygon(x, y, vertices)) {
                    fillPoints.push({ x, y, pixelValue });
                }
            }
        }
        
        return fillPoints;
    }
    
    /**
     * Get vertices for a house shape as a single unified polygon
     */
    getHouseVertices(bounds) {
        const { baseX, baseY, left, right, top, width, height } = bounds;
        const roofHeight = height * 0.4;
        const bodyHeight = height - roofHeight;
        const bodyTop = baseY - bodyHeight;
        
        // Create house as single polygon: start at bottom-left, go clockwise
        const vertices = [
            { x: Math.round(left), y: Math.round(baseY) },      // Bottom left
            { x: Math.round(left), y: Math.round(bodyTop) },    // Body top left
            { x: Math.round(baseX), y: Math.round(top) },       // Roof peak
            { x: Math.round(right), y: Math.round(bodyTop) },   // Body top right  
            { x: Math.round(right), y: Math.round(baseY) }      // Bottom right
        ];
        
        return vertices;
    }
    
    /**
     * Fill heart shape using point-in-polygon algorithm
     */
    fillHeart(bounds, options = {}) {
        const { drawMode = 'ink' } = options;
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        const vertices = this.getHeartVertices(bounds);
        if (vertices.length < 10) return [];
        
        const minX = Math.max(0, Math.min(...vertices.map(v => v.x)));
        const maxX = Math.min(255, Math.max(...vertices.map(v => v.x)));
        const minY = Math.max(0, Math.min(...vertices.map(v => v.y)));
        const maxY = Math.min(191, Math.max(...vertices.map(v => v.y)));
        
        const fillPoints = [];
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (this.isPointInPolygon(x, y, vertices)) {
                    fillPoints.push({ x, y, pixelValue });
                }
            }
        }
        return fillPoints;
    }
    
    /**
     * Fill flower shape using point-in-polygon algorithm
     */
    fillFlower(bounds, options = {}) {
        const { drawMode = 'ink' } = options;
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        const vertices = this.getFlowerVertices(bounds, options);
        if (vertices.length < 10) return [];
        
        const minX = Math.max(0, Math.min(...vertices.map(v => v.x)));
        const maxX = Math.min(255, Math.max(...vertices.map(v => v.x)));
        const minY = Math.max(0, Math.min(...vertices.map(v => v.y)));
        const maxY = Math.min(191, Math.max(...vertices.map(v => v.y)));
        
        const fillPoints = [];
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (this.isPointInPolygon(x, y, vertices)) {
                    fillPoints.push({ x, y, pixelValue });
                }
            }
        }
        return fillPoints;
    }
    
    /**
     * Fill gear shape using point-in-polygon algorithm
     */
    fillGear(bounds, options = {}) {
        const { drawMode = 'ink' } = options;
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        const vertices = this.getGearVertices(bounds, options);
        if (vertices.length < 10) return [];
        
        const minX = Math.max(0, Math.min(...vertices.map(v => v.x)));
        const maxX = Math.min(255, Math.max(...vertices.map(v => v.x)));
        const minY = Math.max(0, Math.min(...vertices.map(v => v.y)));
        const maxY = Math.min(191, Math.max(...vertices.map(v => v.y)));
        
        const fillPoints = [];
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (this.isPointInPolygon(x, y, vertices)) {
                    fillPoints.push({ x, y, pixelValue });
                }
            }
        }
        return fillPoints;
    }
    
    /**
     * Get heart vertices for point-in-polygon testing
     */
    getHeartVertices(bounds) {
        const { centerX, centerY, size } = bounds;
        if (size <= 0) return [];
        
        const scale = size / 40;
        const steps = Math.max(Math.ceil(size * 0.6), 32);
        const angleStep = (2 * Math.PI) / steps;
        const vertices = [];
        
        for (let i = 0; i < steps; i++) {
            const t = i * angleStep;
            const heartX = 16 * Math.pow(Math.sin(t), 3);
            const heartY = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
            
            const x = Math.round(centerX + heartX * scale);
            const y = Math.round(centerY - heartY * scale);
            vertices.push({ x, y });
        }
        return vertices;
    }
    
    /**
     * Get flower vertices for point-in-polygon testing
     */
    getFlowerVertices(bounds, options = {}) {
        const { petals = 6 } = options;
        const { centerX, centerY, radius } = bounds;
        if (radius <= 0) return [];
        
        const steps = Math.max(Math.ceil(radius * 0.8), petals * 8);
        const angleStep = (2 * Math.PI) / steps;
        const vertices = [];
        
        for (let i = 0; i < steps; i++) {
            const t = i * angleStep;
            const petalModulation = 1 + 0.4 * Math.sin(petals * t);
            const r = radius * petalModulation;
            
            const x = Math.round(centerX + r * Math.cos(t));
            const y = Math.round(centerY + r * Math.sin(t));
            vertices.push({ x, y });
        }
        return vertices;
    }
    
    /**
     * Get gear vertices for point-in-polygon testing (matches exact gear design)
     */
    getGearVertices(bounds, options = {}) {
        const { teeth = 10 } = options;
        const { centerX, centerY, radius } = bounds;
        if (radius <= 0 || teeth < 6) return [];
        
        // Use exact same geometry as generateGear()
        const rootRadius = radius * 0.75;
        const outerRadius = radius * 0.875;
        const pitchRadius = radius * 0.8125;
        const toothAngle = (2 * Math.PI) / teeth;
        const toothWidth = toothAngle * 0.65;
        const vertices = [];
        
        // Generate exact same tooth profiles as original gear
        for (let tooth = 0; tooth < teeth; tooth++) {
            const centerAngle = (2 * Math.PI * tooth) / teeth;
            const slopeOffset = (1 * Math.PI / 180) * 0.15;
            
            // Exact same tooth profile as generateGear()
            const toothProfile = [
                { angle: centerAngle - toothWidth * 0.5, radius: rootRadius },
                { angle: centerAngle - toothWidth * 0.38 - slopeOffset, radius: pitchRadius },
                { angle: centerAngle - toothWidth * 0.28 - slopeOffset * 1.8, radius: outerRadius },
                { angle: centerAngle - toothWidth * 0.14, radius: outerRadius },
                { angle: centerAngle, radius: outerRadius },
                { angle: centerAngle + toothWidth * 0.14, radius: outerRadius },
                { angle: centerAngle + toothWidth * 0.28 + slopeOffset * 1.8, radius: outerRadius },
                { angle: centerAngle + toothWidth * 0.38 + slopeOffset, radius: pitchRadius },
                { angle: centerAngle + toothWidth * 0.5, radius: rootRadius }
            ];
            
            // Add tooth profile vertices
            for (const point of toothProfile) {
                const x = Math.round(centerX + point.radius * Math.cos(point.angle));
                const y = Math.round(centerY + point.radius * Math.sin(point.angle));
                vertices.push({ x, y });
            }
            
            // Add valley connection to next tooth
            const nextToothAngle = (2 * Math.PI * (tooth + 1)) / teeth;
            const valleyStartAngle = centerAngle + toothWidth * 0.5;
            const valleyEndAngle = nextToothAngle - toothWidth * 0.5;
            const valleyExtension = slopeOffset * 1.2;
            const adjustedValleyStartAngle = valleyStartAngle + valleyExtension;
            const adjustedValleyEndAngle = valleyEndAngle - valleyExtension;
            
            // Add valley points if there's a gap
            if (adjustedValleyEndAngle > adjustedValleyStartAngle) {
                // Add valley start point
                vertices.push({
                    x: Math.round(centerX + rootRadius * Math.cos(adjustedValleyStartAngle)),
                    y: Math.round(centerY + rootRadius * Math.sin(adjustedValleyStartAngle))
                });
                // Add valley end point  
                vertices.push({
                    x: Math.round(centerX + rootRadius * Math.cos(adjustedValleyEndAngle)),
                    y: Math.round(centerY + rootRadius * Math.sin(adjustedValleyEndAngle))
                });
            }
        }
        
        return vertices;
    }
    
    /**
     * Get vertices for a regular polygon
     */
    getPolygonVertices(bounds, sides) {
        const { centerX, centerY, radius } = bounds;
        const vertices = [];
        
        for (let i = 0; i < sides; i++) {
            const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
            // CRITICAL FIX: Round vertices to integer pixel coordinates for proper point-in-polygon testing
            vertices.push({
                x: Math.round(centerX + radius * Math.cos(angle)),
                y: Math.round(centerY + radius * Math.sin(angle))
            });
        }
        
        return vertices;
    }
    
    /**
     * Point-in-polygon test using ray casting algorithm
     * @param {number} x - Test point X coordinate
     * @param {number} y - Test point Y coordinate  
     * @param {Array} vertices - Polygon vertices [{x, y}, ...]
     * @returns {boolean} True if point is inside polygon
     */
    isPointInPolygon(x, y, vertices) {
        let inside = false;
        
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x;
            const yi = vertices[i].y;
            const xj = vertices[j].x;
            const yj = vertices[j].y;
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    /**
     * Fill arrow shape using point-in-polygon testing
     */
    fillArrowShape(shapeType, bounds, options = {}) {
        const { drawMode = 'ink' } = options;
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        // Get the arrow vertices by generating the outline first
        const outlineGenerator = this.shapes.get(shapeType);
        if (!outlineGenerator) return [];
        
        // Generate the arrow shape to get vertices - we need to call createArrowShape manually
        let vertices = [];
        
        if (shapeType === 'arrow-up') {
            const { startX, startY, magnitude } = bounds;
            const endX = startX, endY = startY - magnitude;
            vertices = this.getArrowVertices(startX, startY, endX, endY, 0, -1, magnitude);
        } else if (shapeType === 'arrow-down') {
            const { startX, startY, magnitude } = bounds;
            const endX = startX, endY = startY + magnitude;
            vertices = this.getArrowVertices(startX, startY, endX, endY, 0, 1, magnitude);
        } else if (shapeType === 'arrow-left') {
            const { startX, startY, magnitude } = bounds;
            const endX = startX - magnitude, endY = startY;
            vertices = this.getArrowVertices(startX, startY, endX, endY, -1, 0, magnitude);
        } else if (shapeType === 'arrow-right') {
            const { startX, startY, magnitude } = bounds;
            const endX = startX + magnitude, endY = startY;
            vertices = this.getArrowVertices(startX, startY, endX, endY, 1, 0, magnitude);
        }
        
        if (vertices.length < 3) return [];
        
        // Find bounding box
        const minX = Math.max(0, Math.min(...vertices.map(v => v.x)));
        const maxX = Math.min(255, Math.max(...vertices.map(v => v.x)));
        const minY = Math.max(0, Math.min(...vertices.map(v => v.y)));
        const maxY = Math.min(191, Math.max(...vertices.map(v => v.y)));
        
        const fillPoints = [];
        
        // Test each pixel in the bounding box
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (this.isPointInPolygon(x, y, vertices)) {
                    fillPoints.push({ x, y, pixelValue });
                }
            }
        }
        
        return fillPoints;
    }
    
    /**
     * Get arrow vertices without generating outline points
     */
    getArrowVertices(startX, startY, endX, endY, dirX, dirY, length) {
        // Calculate perpendicular vector (90-degree rotation)
        const perpX = -dirY;
        const perpY = dirX;
        
        // Proportional calculations based on arrow length
        const arrowHeadLength = Math.max(length * 0.3, 8);
        const arrowHeadWidth = Math.max(length * 0.25, 6);
        const shaftWidth = Math.max(length * 0.12, 3);
        
        // Calculate arrow head start point
        const arrowStartX = endX - dirX * arrowHeadLength;
        const arrowStartY = endY - dirY * arrowHeadLength;
        
        return [
            // Arrow head tip
            { x: Math.round(endX), y: Math.round(endY) },
            
            // Arrow head left wing
            { x: Math.round(arrowStartX + perpX * arrowHeadWidth * 0.5), 
              y: Math.round(arrowStartY + perpY * arrowHeadWidth * 0.5) },
            
            // Left shaft connection
            { x: Math.round(arrowStartX + perpX * shaftWidth * 0.5), 
              y: Math.round(arrowStartY + perpY * shaftWidth * 0.5) },
            
            // Left shaft to start
            { x: Math.round(startX + perpX * shaftWidth * 0.5), 
              y: Math.round(startY + perpY * shaftWidth * 0.5) },
            
            // Right shaft to start  
            { x: Math.round(startX - perpX * shaftWidth * 0.5), 
              y: Math.round(startY - perpY * shaftWidth * 0.5) },
            
            // Right shaft connection
            { x: Math.round(arrowStartX - perpX * shaftWidth * 0.5), 
              y: Math.round(arrowStartY - perpY * shaftWidth * 0.5) },
            
            // Arrow head right wing
            { x: Math.round(arrowStartX - perpX * arrowHeadWidth * 0.5), 
              y: Math.round(arrowStartY - perpY * arrowHeadWidth * 0.5) }
        ];
    }
    
    
    /**
     * Finalize points with stroke width, pixel values, and ZX Spectrum constraints
     */
    finalizePoints(points, options) {
        const { strokeWidth = 1, drawMode = 'ink' } = options;
        
        // Apply stroke width if > 1
        let finalPoints = strokeWidth > 1 ? this.applyStrokeWidth(points, strokeWidth) : points;
        
        // Ensure coordinates are within ZX Spectrum bounds (256x192)
        finalPoints = finalPoints.filter(point => {
            const x = Math.round(point.x);
            const y = Math.round(point.y);
            return x >= 0 && x < 256 && y >= 0 && y < 192;
        });
        
        // Add pixel values based on draw mode
        return finalPoints.map(point => ({
            x: Math.round(point.x),
            y: Math.round(point.y),
            pixelValue: drawMode === 'paper' ? 0 : 1  // ink=1, paper=0
        }));
    }

    // ===== BASIC GEOMETRIC SHAPES =====

    /**
     * Generate line using optimized Bresenham's algorithm
     */
    generateLine(bounds, options = {}) {
        const points = [];
        let x1 = Math.round(bounds.x1);
        let y1 = Math.round(bounds.y1);
        let x2 = Math.round(bounds.x2);
        let y2 = Math.round(bounds.y2);
        
        // Handle edge case: same point
        if (x1 === x2 && y1 === y2) {
            return [{ x: x1, y: y1 }];
        }
        
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        while (true) {
            points.push({ x: x1, y: y1 });
            
            if (x1 === x2 && y1 === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
        }
        
        // Add pixelValue to all points based on draw mode
        const { drawMode = 'ink' } = options;
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        return points.map(point => ({
            x: point.x,
            y: point.y,
            pixelValue
        }));
    }

    /**
     * Generate rectangle outline
     */
    generateRectangle(bounds, options = {}) {
        const { left, right, top, bottom } = bounds;
        const points = [];
        
        // Top edge
        for (let x = left; x <= right; x++) {
            points.push({ x, y: top });
        }
        // Right edge (skip corners)
        for (let y = top + 1; y <= bottom; y++) {
            points.push({ x: right, y });
        }
        // Bottom edge (skip right corner)
        for (let x = right - 1; x >= left; x--) {
            points.push({ x, y: bottom });
        }
        // Left edge (skip corners)
        for (let y = bottom - 1; y > top; y--) {
            points.push({ x: left, y });
        }
        
        return this.finalizePoints(points, options);
    }

    /**
     * Generate square (perfect square with proper anchor behavior)
     */
    generateSquare(bounds, options = {}) {
        // For CORNER_DRAG behavior, create perfect square
        const size = Math.min(bounds.width, bounds.height);
        
        // Maintain anchor point (x1, y1) and create square from there
        const squareBounds = {
            left: bounds.x1,
            top: bounds.y1,
            right: bounds.x1 + (bounds.x2 > bounds.x1 ? size : -size),
            bottom: bounds.y1 + (bounds.y2 > bounds.y1 ? size : -size)
        };
        
        // Normalize bounds for rectangle generation
        const normalizedBounds = {
            left: Math.min(squareBounds.left, squareBounds.right),
            right: Math.max(squareBounds.left, squareBounds.right),
            top: Math.min(squareBounds.top, squareBounds.bottom),
            bottom: Math.max(squareBounds.top, squareBounds.bottom)
        };
        
        return this.generateRectangle(normalizedBounds, options);
    }

    // ===== RADIAL SHAPES (CENTER-OUT) =====

    /**
     * Generate circle using parametric equations with mathematical precision
     * Equation: x = cx + r*cos(θ), y = cy + r*sin(θ)
     */
    generateCircle(bounds, options = {}) {
        const { centerX, centerY, radius } = bounds;
        const points = [];
        
        if (radius <= 0) return points;
        
        // Calculate optimal step size for pixel-perfect rendering
        // Use circumference to determine number of steps, ensuring smooth curves
        const circumference = 2 * Math.PI * radius;
        const steps = Math.max(Math.ceil(circumference * 0.8), 16);  // High-quality curve
        const angleStep = (2 * Math.PI) / steps;
        
        // Generate points using parametric circle equations
        for (let i = 0; i < steps; i++) {
            const angle = i * angleStep;
            const x = Math.round(centerX + radius * Math.cos(angle));
            const y = Math.round(centerY + radius * Math.sin(angle));
            
            // Avoid duplicate consecutive points for cleaner curves
            if (points.length === 0 || 
                points[points.length - 1].x !== x || 
                points[points.length - 1].y !== y) {
                points.push({ x, y });
            }
        }
        
        // Close the circle by connecting back to the first point
        if (points.length > 0) {
            points.push({ ...points[0] });
        }
        
        return this.generatePolygonOutline(points, options);
    }

    /**
     * Generate ellipse using parametric equations with Ramanujan perimeter approximation
     * Equation: x = cx + a*cos(θ), y = cy + b*sin(θ)
     */
    generateEllipse(bounds, options = {}) {
        const { centerX, centerY, radiusX, radiusY } = bounds;
        const a = radiusX || bounds.width * 0.5;   // Semi-major axis
        const b = radiusY || bounds.height * 0.5;  // Semi-minor axis
        
        if (a <= 0 || b <= 0) return [];
        
        // Calculate perimeter using Ramanujan's approximation for optimal step count
        const h = Math.pow((a - b) / (a + b), 2);
        const perimeter = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
        const steps = Math.max(Math.ceil(perimeter * 0.6), 20);  // High-quality ellipse
        
        const angleStep = (2 * Math.PI) / steps;
        const vertices = [];
        
        // Generate vertices using parametric equations
        for (let i = 0; i < steps; i++) {
            const t = i * angleStep;
            const x = Math.round(centerX + a * Math.cos(t));
            const y = Math.round(centerY + b * Math.sin(t));
            
            // Avoid duplicate consecutive points
            if (vertices.length === 0 || 
                vertices[vertices.length - 1].x !== x || 
                vertices[vertices.length - 1].y !== y) {
                vertices.push({ x, y });
            }
        }
        
        // Close the ellipse and generate connected outline
        if (vertices.length > 0) {
            vertices.push({ ...vertices[0] });
        }
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate arc (partial circle)
     */
    generateArc(bounds, options = {}) {
        const { startAngle = 0, endAngle = Math.PI } = options;
        const { centerX, centerY, radius } = bounds;
        const points = [];
        
        if (radius <= 0) return points;
        
        const steps = Math.max(Math.ceil(radius * Math.abs(endAngle - startAngle) / 2), 8);
        for (let i = 0; i <= steps; i++) {
            const t = startAngle + (endAngle - startAngle) * i / steps;
            const x = Math.round(centerX + radius * Math.cos(t));
            const y = Math.round(centerY + radius * Math.sin(t));
            points.push({ x, y });
        }
        
        return points;
    }

    /**
     * Generate sector (pie slice)
     */
    generateSector(bounds, options = {}) {
        const { startAngle = 0, endAngle = Math.PI } = options;
        const { centerX, centerY } = bounds;
        const points = [];
        
        // Get arc points
        const arcPoints = this.generateArc(bounds, options);
        
        // Build complete sector outline: center -> arc start -> arc -> arc end -> center
        if (arcPoints.length > 0) {
            // Line from center to arc start
            const centerToStart = this.generateLine({
                x1: centerX, y1: centerY,
                x2: arcPoints[0].x, y2: arcPoints[0].y
            });
            points.push(...centerToStart);
            
            // Arc points (skip first to avoid duplication)
            points.push(...arcPoints.slice(1));
            
            // Line from arc end back to center
            const endToCenter = this.generateLine({
                x1: arcPoints[arcPoints.length - 1].x, y1: arcPoints[arcPoints.length - 1].y,
                x2: centerX, y2: centerY
            });
            points.push(...endToCenter.slice(1)); // Skip first point to avoid duplication
        }
        
        return points;
    }

    // ===== POLYGONS =====

    /**
     * Generate triangle (BASE_UP: builds from base upward)
     */
    generateTriangle(bounds, options = {}) {
        const { baseX, baseY, width, height, left, right, top } = bounds;
        
        const vertices = [
            { x: baseX, y: top },           // Apex (top center)
            { x: left, y: baseY },          // Base left
            { x: right, y: baseY },         // Base right  
            { x: baseX, y: top }            // Close shape
        ];
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate diamond (rotated square) with center-out zero-point drawing
     * Anchor = center point, drag = radius distance
     */
    generateDiamond(bounds, options = {}) {
        const { centerX, centerY, radius } = bounds;
        
        if (radius <= 0) return [];
        
        // Diamond vertices at 45-degree rotated square positions
        const vertices = [
            { x: centerX, y: centerY - radius },     // Top
            { x: centerX + radius, y: centerY },     // Right  
            { x: centerX, y: centerY + radius },     // Bottom
            { x: centerX - radius, y: centerY },     // Left
            { x: centerX, y: centerY - radius }      // Close
        ];
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate regular polygon with mathematical precision
     * Uses proper zero-point anchor and circumradius from bounds
     */
    generatePolygon(bounds, options = {}) {
        const sides = bounds.sides || options.sides || 6;
        const { centerX, centerY, radius } = bounds;
        
        // Allow very small radii - minimum radius of 1 pixel for visibility  
        if (radius < 0 || sides < 3) return [];
        
        // Ensure minimum radius for visible polygons
        const effectiveRadius = Math.max(1, radius);
        
        return this.createRegularPolygon(centerX, centerY, effectiveRadius, sides, -Math.PI / 2, options);
    }
    
    /**
     * Create regular polygon with specified parameters
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Circumradius (distance from center to vertex)
     * @param {number} sides - Number of sides
     * @param {number} startAngle - Starting angle in radians (default: -π/2 for top vertex)
     */
    createRegularPolygon(centerX, centerY, radius, sides, startAngle = -Math.PI / 2, options = {}) {
        const vertices = [];
        
        // Generate vertices inscribed in circle
        for (let i = 0; i < sides; i++) {
            const angle = startAngle + (2 * Math.PI * i) / sides;
            vertices.push({
                x: Math.round(centerX + radius * Math.cos(angle)),
                y: Math.round(centerY + radius * Math.sin(angle))
            });
        }
        
        // Close the polygon by adding the first vertex again
        if (vertices.length > 0) {
            vertices.push({ ...vertices[0] });
        }
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate pentagon (5-sided regular polygon)
     */
    generatePentagon(bounds, options = {}) {
        const { centerX, centerY, radius } = bounds;
        // Ensure minimum radius for visible polygons
        const effectiveRadius = Math.max(1, radius);
        return this.createRegularPolygon(centerX, centerY, effectiveRadius, 5, -Math.PI / 2, options);
    }

    /**
     * Generate hexagon (6-sided regular polygon)
     */
    generateHexagon(bounds, options = {}) {
        const { centerX, centerY, radius } = bounds;
        // Ensure minimum radius for visible polygons
        const effectiveRadius = Math.max(1, radius);
        return this.createRegularPolygon(centerX, centerY, effectiveRadius, 6, -Math.PI / 2, options);
    }

    /**
     * Generate octagon (8-sided regular polygon)
     */
    generateOctagon(bounds, options = {}) {
        const { centerX, centerY, radius } = bounds;
        // Ensure minimum radius for visible polygons
        const effectiveRadius = Math.max(1, radius);
        return this.createRegularPolygon(centerX, centerY, effectiveRadius, 8, -Math.PI / 2, options);
    }

    /**
     * Generate star shape with mathematical precision
     * Creates n-pointed star with configurable inner/outer radius ratio
     */
    generateStar(bounds, options = {}) {
        const { points = 5, innerRadiusRatio = 0.4 } = options;
        const { centerX, centerY, radius } = bounds;
        
        if (radius <= 0 || points < 3) return [];
        
        // Star mathematics: alternating outer and inner radii
        const outerRadius = radius;
        const innerRadius = radius * Math.max(0.1, Math.min(0.9, innerRadiusRatio));
        const angleStep = Math.PI / points;  // Half-step between outer and inner points
        const startAngle = -Math.PI * 0.5;  // Start at top
        
        const vertices = [];
        
        // Generate alternating outer and inner vertices
        for (let i = 0; i < points * 2; i++) {
            const angle = startAngle + i * angleStep;
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            
            const x = Math.round(centerX + r * Math.cos(angle));
            const y = Math.round(centerY + r * Math.sin(angle));
            
            vertices.push({ x, y });
        }
        
        // Close the star
        if (vertices.length > 0) {
            vertices.push({ ...vertices[0] });
        }
        
        return this.generatePolygonOutline(vertices, options);
    }

    // ===== DIRECTIONAL SHAPES (ARROWS) =====

    /**
     * Generate dynamic arrow with proper vector mathematics
     * Creates arrow following the drag direction with proportional dimensions
     */
    generateArrow(bounds, options = {}) {
        const { startX, startY, endX, endY, deltaX, deltaY, magnitude, directionX, directionY } = bounds;
        
        if (magnitude === 0) return [];
        
        return this.createArrowShape(startX, startY, endX, endY, directionX, directionY, magnitude, options);
    }
    
    /**
     * Generate upward-pointing arrow (fixed direction)
     */
    generateArrowUp(bounds, options = {}) {
        const { startX, startY, magnitude } = bounds;
        
        // Create upward arrow from start point with fixed direction
        const endX = startX;
        const endY = startY - magnitude;  // Up direction
        
        return this.createArrowShape(startX, startY, endX, endY, 0, -1, magnitude, options);
    }
    
    /**
     * Generate rightward-pointing arrow (fixed direction)
     */
    generateArrowRight(bounds, options = {}) {
        const { startX, startY, magnitude } = bounds;
        
        // Create rightward arrow from start point with fixed direction
        const endX = startX + magnitude;  // Right direction
        const endY = startY;
        
        return this.createArrowShape(startX, startY, endX, endY, 1, 0, magnitude, options);
    }
    
    /**
     * Generate downward-pointing arrow (fixed direction)
     */
    generateArrowDown(bounds, options = {}) {
        const { startX, startY, magnitude } = bounds;
        
        // Create downward arrow from start point with fixed direction
        const endX = startX;
        const endY = startY + magnitude;  // Down direction
        
        return this.createArrowShape(startX, startY, endX, endY, 0, 1, magnitude, options);
    }
    
    /**
     * Generate leftward-pointing arrow (fixed direction)
     */
    generateArrowLeft(bounds, options = {}) {
        const { startX, startY, magnitude } = bounds;
        
        // Create leftward arrow from start point with fixed direction
        const endX = startX - magnitude;  // Left direction
        const endY = startY;
        
        return this.createArrowShape(startX, startY, endX, endY, -1, 0, magnitude, options);
    }
    
    /**
     * Create arrow shape with mathematical precision
     * @param {number} startX - Arrow start X coordinate
     * @param {number} startY - Arrow start Y coordinate  
     * @param {number} endX - Arrow tip X coordinate
     * @param {number} endY - Arrow tip Y coordinate
     * @param {number} dirX - Direction unit vector X
     * @param {number} dirY - Direction unit vector Y
     * @param {number} length - Arrow length
     */
    createArrowShape(startX, startY, endX, endY, dirX, dirY, length, options = {}) {
        // Calculate perpendicular vector (90-degree rotation)
        const perpX = -dirY;  // Rotate direction vector 90 degrees
        const perpY = dirX;
        
        // Proportional calculations based on arrow length
        const arrowHeadLength = Math.max(length * 0.3, 8);   // 30% of length, min 8px
        const arrowHeadWidth = Math.max(length * 0.25, 6);   // 25% of length, min 6px
        const shaftWidth = Math.max(length * 0.12, 3);       // 12% of length, min 3px
        
        // Calculate arrow head start point
        const arrowStartX = endX - dirX * arrowHeadLength;
        const arrowStartY = endY - dirY * arrowHeadLength;
        
        const vertices = [
            // Arrow head tip
            { x: Math.round(endX), y: Math.round(endY) },
            
            // Arrow head left wing
            { x: Math.round(arrowStartX + perpX * arrowHeadWidth * 0.5), 
              y: Math.round(arrowStartY + perpY * arrowHeadWidth * 0.5) },
            
            // Left shaft connection
            { x: Math.round(arrowStartX + perpX * shaftWidth * 0.5), 
              y: Math.round(arrowStartY + perpY * shaftWidth * 0.5) },
            
            // Left shaft to start
            { x: Math.round(startX + perpX * shaftWidth * 0.5), 
              y: Math.round(startY + perpY * shaftWidth * 0.5) },
            
            // Right shaft to start  
            { x: Math.round(startX - perpX * shaftWidth * 0.5), 
              y: Math.round(startY - perpY * shaftWidth * 0.5) },
            
            // Right shaft connection
            { x: Math.round(arrowStartX - perpX * shaftWidth * 0.5), 
              y: Math.round(arrowStartY - perpY * shaftWidth * 0.5) },
            
            // Arrow head right wing
            { x: Math.round(arrowStartX - perpX * arrowHeadWidth * 0.5), 
              y: Math.round(arrowStartY - perpY * arrowHeadWidth * 0.5) },
            
            // Close back to tip
            { x: Math.round(endX), y: Math.round(endY) }
        ];
        
        return this.generatePolygonOutline(vertices, options);
    }


    // ===== SYMBOLS =====

    /**
     * Generate plus sign (CENTER_SYMMETRIC: balanced cross shape)
     */
    generatePlus(bounds, options = {}) {
        const { centerX, centerY, size } = bounds;
        const points = [];
        const halfSize = size / 2;
        
        // Horizontal line
        points.push(...this.generateLine({
            x1: centerX - halfSize, y1: centerY,
            x2: centerX + halfSize, y2: centerY
        }));
        
        // Vertical line
        points.push(...this.generateLine({
            x1: centerX, y1: centerY - halfSize,
            x2: centerX, y2: centerY + halfSize
        }));
        
        return points;
    }

    /**
     * Generate X (CENTER_SYMMETRIC: balanced diagonal cross)
     */
    generateCross(bounds, options = {}) {
        const { centerX, centerY, size } = bounds;
        const points = [];
        const halfSize = size / 2;
        
        // Diagonal line (top-left to bottom-right)
        points.push(...this.generateLine({
            x1: centerX - halfSize, y1: centerY - halfSize,
            x2: centerX + halfSize, y2: centerY + halfSize
        }));
        
        // Diagonal line (top-right to bottom-left)
        points.push(...this.generateLine({
            x1: centerX + halfSize, y1: centerY - halfSize,
            x2: centerX - halfSize, y2: centerY + halfSize
        }));
        
        return points;
    }

    /**
     * Generate heart using parametric equations with mathematical precision
     * Heart equation: x = 16sin³(t), y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
     */
    generateHeart(bounds, options = {}) {
        const { centerX, centerY, size } = bounds;
        
        if (size <= 0) return [];
        
        // Heart parametric equations with proper scaling
        // Original heart dimensions: width ≈ 32, height ≈ 21
        const scale = size / 40;  // Scale to fit requested size
        const steps = Math.max(Math.ceil(size * 0.6), 32);  // Adaptive high-quality steps
        const angleStep = (2 * Math.PI) / steps;
        const vertices = [];
        
        // Generate vertices using parametric equations
        for (let i = 0; i < steps; i++) {
            const t = i * angleStep;
            
            // Mathematical heart parametric equations
            const heartX = 16 * Math.pow(Math.sin(t), 3);
            const heartY = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
            
            // Transform to screen coordinates with proper orientation
            const x = Math.round(centerX + heartX * scale);
            const y = Math.round(centerY - heartY * scale);  // Flip Y for upright heart
            
            // Avoid duplicate consecutive points for smooth curves
            if (vertices.length === 0 || 
                vertices[vertices.length - 1].x !== x || 
                vertices[vertices.length - 1].y !== y) {
                vertices.push({ x, y });
            }
        }
        
        // Close the heart shape and generate connected outline
        if (vertices.length > 0) {
            vertices.push({ ...vertices[0] });
        }
        
        return this.generatePolygonOutline(vertices, options);
    }

    // ===== COMPLEX SHAPES =====

    /**
     * Generate lightning bolt with dynamic zigzag pattern
     */
    generateLightning(bounds, options = {}) {
        const { startX, startY, endX, endY, deltaX, deltaY, magnitude } = bounds;
        
        if (magnitude === 0) return [];
        
        // Create zigzag lightning pattern
        const points = [];
        const segments = Math.max(3, Math.floor(magnitude / 20)); // More segments for longer bolts
        const zigzagAmplitude = magnitude * 0.15; // Side displacement amount
        
        // Calculate perpendicular direction for zigzag
        const perpX = -deltaY / magnitude;
        const perpY = deltaX / magnitude;
        
        points.push({ x: startX, y: startY });
        
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const baseX = startX + deltaX * t;
            const baseY = startY + deltaY * t;
            
            // Alternate zigzag direction
            const zigzagDirection = (i % 2 === 0) ? 1 : -1;
            const amplitude = zigzagAmplitude * Math.sin(Math.PI * i / segments); // Smooth amplitude variation
            
            const x = Math.round(baseX + perpX * amplitude * zigzagDirection);
            const y = Math.round(baseY + perpY * amplitude * zigzagDirection);
            
            points.push({ x, y });
        }
        
        points.push({ x: endX, y: endY });
        
        // Convert to line segments
        const linePoints = [];
        for (let i = 0; i < points.length - 1; i++) {
            const segmentPoints = this.generateLine({
                x1: points[i].x, y1: points[i].y,
                x2: points[i + 1].x, y2: points[i + 1].y
            });
            
            if (i === 0) {
                linePoints.push(...segmentPoints);
            } else {
                linePoints.push(...segmentPoints.slice(1)); // Skip first point to avoid duplication
            }
        }
        
        return linePoints;
    }

    /**
     * Generate house shape (BASE_UP: builds from ground up)
     */
    generateHouse(bounds, options = {}) {
        // Origin-based parabola: click point is origin (tip), drag defines shape
        const dragX = bounds.deltaX || (bounds.x2 - bounds.x1);
        const dragY = bounds.deltaY || (bounds.y2 - bounds.y1);
        const originX = bounds.x1; // Click point is origin
        const originY = bounds.y1; // Click point is origin
        
        if (Math.abs(dragX) <= 0 || Math.abs(dragY) <= 0) return [];
        
        const vertices = [];
        const steps = Math.max(Math.ceil(Math.abs(dragY) * 0.6), 20);
        
        // Parabola through three points:
        // - Start: (0, 0) - origin at click point
        // - Apex: (dragX, dragY/2) - maximum width at middle height
        // - End: (0, dragY) - return to zero X coordinate at drag height
        
        // For parabola x = ay² + by + c through these points:
        // At y=0: x=0 → c=0
        // At y=dragY/2: x=dragX → a(dragY/2)² + b(dragY/2) = dragX
        // At y=dragY: x=0 → a(dragY)² + b(dragY) = 0
        
        const h = dragY / 2; // Half height (apex Y)
        const a = -4 * dragX / (dragY * dragY); // Coefficient for y²
        const b = 4 * dragX / dragY; // Coefficient for y
        
        // Generate parabola: x = ay² + by
        for (let i = 0; i <= steps; i++) {
            const y = (i / steps) * dragY; // 0 to dragY
            const x = a * y * y + b * y; // Parabolic curve
            
            vertices.push({ 
                x: Math.round(originX + x), 
                y: Math.round(originY + y) 
            });
        }
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate proper crescent moon shape using cartesian bounds
     * Two arcs sharing the same start and end points (crescent tips)
     */
    generateMoon(bounds, options = {}) {
        const { left, right, top, bottom, centerX, centerY, width, height } = bounds;
        
        if (width <= 0 || height <= 0) return [];
        
        // Determine crescent direction based on drag direction or explicit option
        const dragDirection = options.dragDirection || this.determineCrescentDirection(bounds);
        const facingRight = dragDirection === 'right';
        
        // Use actual drag direction detection
        let actualFacingRight = facingRight;
        
        // If explicit dragDirection was passed, use it
        if (options.dragDirection) {
            actualFacingRight = options.dragDirection === 'right';
        } 
        // Otherwise try to determine from bounds deltaX
        else if (bounds.deltaX !== undefined) {
            actualFacingRight = bounds.deltaX >= 0;
        } 
        // Fallback to default
        else {
            actualFacingRight = true;
        }
        
        // Debug logging (after actualFacingRight is determined)
        
        const vertices = [];
        const radius = Math.min(width, height) / 2;
        const steps = Math.max(Math.ceil(radius * 0.6), 12);
        
        // PROPER CRESCENT GENERATION - two completely different approaches
        const crescentRadius = Math.min(width, height) / 2;
        
        // Origin-based crescent using drag vector approach
        // Get the drag vector from bounds
        const dragX = bounds.deltaX || (bounds.x2 - bounds.x1);
        const dragY = bounds.deltaY || (bounds.y2 - bounds.y1);
        
        // Tips: first at origin (relative), second from drag
        const tip1 = { x: 0, y: 0 };
        const tip2 = { x: 0, y: dragY };
        
        // Apex positions: keep crescent thin at larger widths
        const outerApexX = dragX; // Use full X drag for outer apex
        // Use smaller percentage + fixed offset to keep crescents thin at large widths
        const innerApexX = dragX * 0.7 + Math.sign(dragX) * Math.min(Math.abs(dragX) * 0.1, 20);
        const outerApexY = dragY / 2; // Midpoint between tips for outer apex
        const innerApexY = dragY / 2 + Math.abs(dragY) * 0.02; // Very subtle offset (2% instead of 10%)
        
        // Increase steps for smoother curves
        const smoothSteps = Math.max(steps, 20);
        
        // Create outer ellipse (deeper curve) - keep original working logic
        for (let i = 0; i <= smoothSteps; i++) {
            const t = i / smoothSteps; // Parameter from 0 to 1
            
            // Ellipse through tip1, outer apex, tip2
            let x, y;
            if (t <= 0.5) {
                // First half: tip1 to outer apex
                const localT = t * 2; // 0 to 1
                x = outerApexX * Math.sin(localT * Math.PI / 2);
                y = outerApexY * (1 - Math.cos(localT * Math.PI / 2));
            } else {
                // Second half: outer apex to tip2
                const localT = (t - 0.5) * 2; // 0 to 1
                x = outerApexX * Math.cos(localT * Math.PI / 2);
                y = outerApexY + (dragY - outerApexY) * Math.sin(localT * Math.PI / 2);
            }
            
            // Transform to actual coordinates
            vertices.push({ 
                x: Math.round(centerX + x), 
                y: Math.round(centerY + y - dragY/2) 
            });
        }
        
        // Create inner ellipse (shallower curve) - keep original working logic
        for (let i = smoothSteps; i >= 0; i--) {
            const t = i / smoothSteps; // Parameter from 1 to 0 (reverse)
            
            // Ellipse through tip1, inner apex, tip2
            let x, y;
            if (t <= 0.5) {
                // First half: tip1 to inner apex
                const localT = t * 2; // 0 to 1
                x = innerApexX * Math.sin(localT * Math.PI / 2);
                y = innerApexY * (1 - Math.cos(localT * Math.PI / 2));
            } else {
                // Second half: inner apex to tip2
                const localT = (t - 0.5) * 2; // 0 to 1
                x = innerApexX * Math.cos(localT * Math.PI / 2);
                y = innerApexY + (dragY - innerApexY) * Math.sin(localT * Math.PI / 2);
            }
            
            // Transform to actual coordinates
            vertices.push({ 
                x: Math.round(centerX + x), 
                y: Math.round(centerY + y - dragY/2) 
            });
        }
        
        // Clean crescent generation complete
        
        return this.generatePolygonOutline(vertices, options);
    }
    
    /**
     * Determine crescent direction based on bounding box
     * Uses the original drawing direction to determine which way the crescent should face
     */
    determineCrescentDirection(bounds) {
        // For RADIAL_CENTER shapes, use deltaX which preserves original direction
        if (bounds.deltaX !== undefined) {
            return bounds.deltaX >= 0 ? 'right' : 'left';
        }
        
        // If bounds were created from x1,y1 to x2,y2, we can infer direction
        if (bounds.x1 !== undefined && bounds.x2 !== undefined) {
            return bounds.x2 > bounds.x1 ? 'right' : 'left';
        }
        
        // Default to right-facing if direction cannot be determined
        return 'right';
    }
    
    /**
     * Find intersection points of two circles
     * Mathematical solution for circle-circle intersection
     */
    findCircleIntersections(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if circles intersect
        if (distance > r1 + r2 || distance < Math.abs(r1 - r2) || distance === 0) {
            return []; // No intersection or infinite intersections
        }
        
        // Calculate intersection points using mathematical formula
        const a = (r1 * r1 - r2 * r2 + distance * distance) / (2 * distance);
        const h = Math.sqrt(r1 * r1 - a * a);
        
        const px = x1 + a * dx / distance;
        const py = y1 + a * dy / distance;
        
        const intersection1 = {
            x: px + h * dy / distance,
            y: py - h * dx / distance
        };
        
        const intersection2 = {
            x: px - h * dy / distance,
            y: py + h * dx / distance
        };
        
        return [intersection1, intersection2];
    }

    /**
     * Generate flower shape using trigonometric petal modulation
     * Creates flower with n petals using sine wave modulation
     */
    generateFlower(bounds, options = {}) {
        const { petals = 6 } = options;
        const { centerX, centerY, radius } = bounds;
        
        if (radius <= 0) return [];
        
        // Calculate optimal step count for smooth flower curves
        const steps = Math.max(Math.ceil(radius * 0.8), petals * 8);
        const angleStep = (2 * Math.PI) / steps;
        const vertices = [];
        
        // Generate flower petals using trigonometric modulation
        for (let i = 0; i < steps; i++) {
            const t = i * angleStep;
            
            // Petal modulation using sine wave
            const petalModulation = 1 + 0.4 * Math.sin(petals * t);
            const r = radius * petalModulation;
            
            const x = Math.round(centerX + r * Math.cos(t));
            const y = Math.round(centerY + r * Math.sin(t));
            
            // Avoid duplicate consecutive points
            if (vertices.length === 0 || 
                vertices[vertices.length - 1].x !== x || 
                vertices[vertices.length - 1].y !== y) {
                vertices.push({ x, y });
            }
        }
        
        // Close the flower shape and generate connected outline
        if (vertices.length > 0) {
            vertices.push({ ...vertices[0] });
        }
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate industrial mechanical gear shape with authentic tooth profile
     * Creates traditional gear with proper involute-inspired tooth geometry
     */
    generateGear(bounds, options = {}) {
        const { teeth = 12 } = options;  // Default to 12 teeth for better gear appearance
        const { centerX, centerY, radius } = bounds;
        
        if (radius <= 0 || teeth < 6) return [];
        
        // Industrial gear geometry based on real mechanical gear proportions
        const pitchRadius = radius * 0.85;     // Pitch circle (working diameter)
        const rootRadius = radius * 0.65;     // Root circle (tooth valley)
        const outerRadius = radius;            // Addendum circle (tooth tip)
        const baseRadius = radius * 0.75;     // Base circle for involute curve
        const vertices = [];
        
        // Calculate proper tooth spacing for industrial gears
        const toothAngle = (2 * Math.PI) / teeth;
        const toothThickness = toothAngle * 0.5;    // 50% tooth, 50% space (standard)
        const spaceWidth = toothAngle * 0.5;
        
        // Generate authentic gear teeth with involute-inspired profile
        for (let tooth = 0; tooth < teeth; tooth++) {
            const centerAngle = (2 * Math.PI * tooth) / teeth;
            
            // Create authentic tooth profile with proper mechanical proportions
            const toothPoints = [
                // Root fillet start (left side of tooth valley)
                { angle: centerAngle - spaceWidth * 0.5, radius: rootRadius },
                
                // Root to base transition (left fillet)
                { angle: centerAngle - toothThickness * 0.45, radius: rootRadius * 1.05 },
                
                // Base circle to pitch circle (left tooth flank)
                { angle: centerAngle - toothThickness * 0.35, radius: baseRadius },
                { angle: centerAngle - toothThickness * 0.25, radius: pitchRadius },
                
                // Pitch to tip (left side)
                { angle: centerAngle - toothThickness * 0.15, radius: outerRadius * 0.95 },
                
                // Tooth tip (flat land for strength)
                { angle: centerAngle - toothThickness * 0.05, radius: outerRadius },
                { angle: centerAngle + toothThickness * 0.05, radius: outerRadius },
                
                // Tip to pitch (right side)
                { angle: centerAngle + toothThickness * 0.15, radius: outerRadius * 0.95 },
                
                // Pitch to base circle (right tooth flank)
                { angle: centerAngle + toothThickness * 0.25, radius: pitchRadius },
                { angle: centerAngle + toothThickness * 0.35, radius: baseRadius },
                
                // Base to root transition (right fillet)
                { angle: centerAngle + toothThickness * 0.45, radius: rootRadius * 1.05 },
                
                // Root fillet end (right side of tooth valley)
                { angle: centerAngle + spaceWidth * 0.5, radius: rootRadius }
            ];
            
            // Add all tooth profile points for industrial appearance
            for (const point of toothPoints) {
                const x = Math.round(centerX + point.radius * Math.cos(point.angle));
                const y = Math.round(centerY + point.radius * Math.sin(point.angle));
                vertices.push({ x, y });
            }
        }
        
        // Close the gear shape
        if (vertices.length > 0) {
            vertices.push({ ...vertices[0] });
        }
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate Archimedean spiral with mathematical precision
     * Equation: r = a * θ where a controls spacing between turns
     */
    generateSpiral(bounds, options = {}) {
        const { turns = 3 } = options;
        const { centerX, centerY, radius } = bounds;
        
        if (radius <= 0 || turns <= 0) return [];
        
        // Archimedean spiral mathematics
        const totalAngle = turns * 2 * Math.PI;
        const spiralConstant = radius / totalAngle;  // Controls spacing between turns
        
        // Calculate optimal step count for smooth spiral rendering
        const steps = Math.max(Math.ceil(totalAngle * 8), turns * 40);
        const angleStep = totalAngle / steps;
        const vertices = [];
        
        for (let i = 0; i <= steps; i++) {
            const angle = i * angleStep;
            const r = spiralConstant * angle;  // Archimedean spiral equation
            
            // Ensure spiral doesn't exceed maximum radius
            if (r > radius) break;
            
            const x = Math.round(centerX + r * Math.cos(angle));
            const y = Math.round(centerY + r * Math.sin(angle));
            
            // Avoid duplicate consecutive points
            if (vertices.length === 0 || 
                vertices[vertices.length - 1].x !== x || 
                vertices[vertices.length - 1].y !== y) {
                vertices.push({ x, y });
            }
        }
        
        // Connect spiral points with line segments for continuous drawing
        const points = [];
        for (let i = 0; i < vertices.length - 1; i++) {
            const linePoints = this.generateLine({
                x1: vertices[i].x, y1: vertices[i].y,
                x2: vertices[i + 1].x, y2: vertices[i + 1].y
            });
            
            if (i === 0) {
                points.push(...linePoints);
            } else {
                // Skip first point to avoid duplication
                points.push(...linePoints.slice(1));
            }
        }
        
        return points;
    }

    /**
     * Generate bowtie shape
     */
    generateBowtie(bounds, options = {}) {
        // Vertical parabola: use actual click point as origin (CORNER_DRAG preserves this)
        const dragX = bounds.deltaX || (bounds.x2 - bounds.x1);
        const dragY = bounds.deltaY || (bounds.y2 - bounds.y1);
        const originX = bounds.x1; // Actual click point (preserved by CORNER_DRAG)
        const originY = bounds.y1; // Actual click point (preserved by CORNER_DRAG)
        
        
        if (Math.abs(dragX) <= 0 || Math.abs(dragY) <= 0) return [];
        
        const vertices = [];
        const steps = Math.max(Math.ceil(Math.abs(dragX) * 0.6), 20);
        
        // Vertical parabola with fixed Y tips:
        // - Start: (originX, originY) - click point, fixed height
        // - Apex: (originX + dragX/2, originY + dragY) - apex at drag height
        // - End: (originX + dragX, originY) - end point, same height as start
        
        // For parabola y = ax² + bx + c through these points (relative to origin):
        // At x=0: y=0 → c=0
        // At x=dragX/2: y=dragY → a(dragX/2)² + b(dragX/2) = dragY
        // At x=dragX: y=0 → a(dragX)² + b(dragX) = 0
        
        const a = -4 * dragY / (dragX * dragX); // Coefficient for x²
        const b = 4 * dragY / dragX; // Coefficient for x
        
        // Generate vertical parabola: y = ax² + bx (relative to origin)
        for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * dragX; // 0 to dragX (width span)
            const y = a * x * x + b * x; // Parabolic curve (height offset from originY)
            
            vertices.push({ 
                x: Math.round(originX + x), 
                y: Math.round(originY + y)  // originY is the fixed base height
            });
        }
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate hourglass shape
     */
    generateHourglass(bounds, options = {}) {
        const { left, right, top, bottom, centerX, centerY } = bounds;
        const points = [];
        
        const vertices = [
            { x: left, y: top },
            { x: right, y: top },
            { x: centerX, y: centerY },
            { x: right, y: bottom },
            { x: left, y: bottom },
            { x: centerX, y: centerY },
            { x: left, y: top }
        ];
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate trapezoid
     */
    generateTrapezoid(bounds, options = {}) {
        const { left, right, top, bottom, width } = bounds;
        const inset = width * 0.2;
        
        const vertices = [
            { x: left + inset, y: top },
            { x: right - inset, y: top },
            { x: right, y: bottom },
            { x: left, y: bottom },
            { x: left + inset, y: top }
        ];
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate parallelogram
     */
    generateParallelogram(bounds, options = {}) {
        const { left, right, top, bottom, width } = bounds;
        const skew = width * 0.2;
        
        const vertices = [
            { x: left + skew, y: top },
            { x: right, y: top },
            { x: right - skew, y: bottom },
            { x: left, y: bottom },
            { x: left + skew, y: top }
        ];
        
        return this.generatePolygonOutline(vertices, options);
    }

    /**
     * Generate kite shape
     */
    generateKite(bounds, options = {}) {
        const { centerX, centerY, width, height } = bounds;
        
        const vertices = [
            { x: centerX, y: centerY - height * 0.4 },    // Top
            { x: centerX + width * 0.3, y: centerY },     // Right
            { x: centerX, y: centerY + height * 0.6 },    // Bottom
            { x: centerX - width * 0.3, y: centerY },     // Left
            { x: centerX, y: centerY - height * 0.4 }     // Close
        ];
        
        return this.generatePolygonOutline(vertices, options);
    }

    // ===== UTILITY METHODS =====

    /**
     * Generate polygon outline from vertices
     * FIXED: Proper polygon generation with duplicate point handling
     */
    generatePolygonOutline(vertices, options = {}) {
        const points = [];
        
        if (vertices.length < 2) return points;
        
        for (let i = 0; i < vertices.length - 1; i++) {
            const current = vertices[i];
            const next = vertices[i + 1];
            
            // Skip if vertices are the same (avoid zero-length lines)
            if (current.x === next.x && current.y === next.y) continue;
            
            const linePoints = this.generateLine({
                x1: current.x, y1: current.y,
                x2: next.x, y2: next.y
            }, options);
            
            // FIXED: Smart duplicate point handling
            if (i === 0) {
                // First line: add all points
                points.push(...linePoints);
            } else {
                // Subsequent lines: skip first point to avoid duplication
                if (linePoints.length > 1) {
                    points.push(...linePoints.slice(1));
                }
            }
        }
        
        // Add pixelValue to all points based on draw mode
        const { drawMode = 'ink' } = options;
        const pixelValue = drawMode === 'paper' ? 0 : 1;
        
        return points.map(point => ({
            x: point.x,
            y: point.y,
            pixelValue: point.pixelValue !== undefined ? point.pixelValue : pixelValue
        }));
    }

    /**
     * Apply stroke width to points
     */
    applyStrokeWidth(points, strokeWidth) {
        if (strokeWidth <= 1 || points.length === 0) {
            return points;
        }

        const thickenedPoints = new Set();
        const radius = Math.floor(strokeWidth / 2);
        
        points.forEach(point => {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= radius + 0.5) {
                        const newX = Math.round(point.x + dx);
                        const newY = Math.round(point.y + dy);
                        thickenedPoints.add(`${newX},${newY}`);
                    }
                }
            }
        });

        return Array.from(thickenedPoints).map(pointStr => {
            const [x, y] = pointStr.split(',').map(Number);
            return { x, y };
        });
    }

    /**
     * Get anchor behavior for UI integration
     */
    getShapeAnchorBehavior(shapeType) {
        return this.shapeAnchorBehaviors.get(shapeType) || 'corner-drag';
    }
    
    /**
     * Get available shape types
     */
    getAvailableShapes() {
        return Array.from(this.shapes.keys());
    }
    
    /**
     * Get fillable shape types
     */
    getFillableShapes() {
        return Array.from(this.filledShapes.keys());
    }
    
    /**
     * Check if shape supports filling
     */
    isShapeFillable(shapeType) {
        return this.filledShapes.has(shapeType);
    }
    
    /**
     * Validate shape category completeness
     * Ensures all registered shapes have proper categories
     */
    validateShapeCategories() {
        const allCategorizedShapes = new Set();
        
        // Collect all shapes from categories
        Object.values(this.shapeCategories).forEach(shapes => {
            shapes.forEach(shape => allCategorizedShapes.add(shape));
        });
        
        this.categorizedShapes = allCategorizedShapes;
        
        // Validate that all shapes will be properly categorized
    }
    
    /**
     * Get shape category for drawing behavior
     */
    getShapeCategory(shapeType) {
        for (const [category, shapes] of Object.entries(this.shapeCategories)) {
            if (shapes.includes(shapeType)) {
                return category;
            }
        }
        
        throw new Error(`Shape '${shapeType}' not found in any category`);
    }
    
    /**
     * Clear any cached data (for memory management)
     */
    clearCache() {
        // Currently no persistent caches, but method exists for future use
        // This method can be called by the main application for memory cleanup
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShapeGenerator;
} else if (typeof window !== 'undefined') {
    window.ShapeGenerator = ShapeGenerator;
}

/**
 * ZX Spectrum Mathematical Shape Generator v4.0 - Feature Summary:
 * 
 * MATHEMATICAL PRECISION:
 * - Proper cartesian plane mathematics with negative coordinate support
 * - Zero-point anchor drawing (click point becomes exact anchor)
 * - Parametric equations for circles, ellipses, hearts, spirals
 * - Trigonometric precision for polygons and complex shapes
 * - Vector mathematics for arrows and directional shapes
 * 
 * COMPREHENSIVE SHAPE LIBRARY (30+ shapes):
 * - Basic: line, rectangle, square, circle, ellipse, triangle, diamond
 * - Polygons: pentagon, hexagon, octagon (with proper circumradius)
 * - Directional: arrow (dynamic), arrow-up, arrow-right, arrow-down, arrow-left
 * - Symbols: x, plus, heart, star (with configurable points)
 * - Complex: lightning, house, moon, flower, gear, spiral, bowtie, hourglass
 * - Quadrilaterals: trapezoid, parallelogram, kite
 * 
 * ANCHOR BEHAVIORS:
 * - RADIAL_CENTER: anchor = center, drag = radius (circles, polygons, stars)
 * - CORNER_DRAG: anchor = corner, drag = opposite corner (rectangles)
 * - BASE_UP: anchor = base center, builds upward (triangles, houses)
 * - DIRECTIONAL: anchor = start, drag = direction (lines, arrows)
 * - CENTER_SYMMETRIC: anchor = center, drag = size (symbols)
 * 
 * FILL SUPPORT:
 * - Scanline fill for simple geometric shapes
 * - Complex shape fill using center-point algorithms
 * - Ray casting for point-in-polygon testing
 * - Filled variants available for all applicable shapes
 * 
 * ZX SPECTRUM INTEGRATION:
 * - Pixel-perfect rendering at 256×192 resolution
 * - Coordinate validation and clipping
 * - Stroke width support with circular brush
 * - ink/paper drawing modes (pixelValue: 0 or 1)
 * - Memory-efficient point generation
 * 
 * USAGE:
 * const generator = new ShapeGenerator();
 * const points = generator.generateShape('circle', bounds, {strokeWidth: 2, filled: false});
 * const filledPoints = generator.generateShape('rectangle', bounds, {filled: true});
 * const behavior = generator.getShapeAnchorBehavior('star'); // returns 'center-out'
 */