# Drawing Functions & Tools Reference

## Core Drawing Functions Overview

ZX Pixel Smoosher provides sophisticated drawing tools that combine modern usability with authentic ZX Spectrum constraints. Each tool implements pixel-perfect algorithms while respecting the original hardware limitations.

## Primary Drawing Tools

### 1. Brush Tool - Pixel-Perfect Drawing

**Function**: `brushTool(x, y, size, color, mode)`

**Purpose**: Free-form pixel drawing with variable brush sizes
**Activation**: Click brush icon, press 'B', or default tool
**Brush Sizes**: 1-8 pixels with circular brush pattern

**Technical Implementation:**
```javascript
// Core brush algorithm
function applyBrush(centerX, centerY, size, pixelValue) {
    const radius = Math.floor(size / 2);
    
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius + 0.5) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                if (isValidPixel(x, y)) {
                    setPixel(x, y, pixelValue);
                    updateAttribute(x, y);
                }
            }
        }
    }
}
```

**Drawing Modes:**
- **INK Mode** (Left Click): Draws with selected INK color
- **PAPER Mode** (Right Click): Draws with PAPER color (erases)
- **Continuous Drawing**: Mouse drag for smooth lines
- **Single Pixels**: Click for individual pixel placement

**ZX Spectrum Integration:**
- Respects 8×8 attribute block constraints
- Updates both pixel and attribute data
- Maintains INK/PAPER color relationships
- Handles disabled color states

### 2. Fill Tool - Intelligent Flood Fill

**Function**: `floodFill(startX, startY, targetColor, replacementColor)`

**Purpose**: Fill connected areas with color, respecting ZX Spectrum constraints
**Activation**: Click bucket icon, press 'F'
**Algorithm**: Optimized flood fill with boundary detection

**Technical Implementation:**
```javascript
function floodFill(startX, startY, newColor) {
    const originalColor = getPixel(startX, startY);
    
    if (originalColor === newColor) return;
    
    const stack = [{x: startX, y: startY}];
    const visited = new Set();
    
    while (stack.length > 0) {
        const {x, y} = stack.pop();
        const key = `${x},${y}`;
        
        if (visited.has(key) || !isValidPixel(x, y)) continue;
        if (getPixel(x, y) !== originalColor) continue;
        
        visited.add(key);
        setPixel(x, y, newColor);
        updateAttribute(x, y);
        
        // Add adjacent pixels
        stack.push(
            {x: x + 1, y: y},
            {x: x - 1, y: y},
            {x: x, y: y + 1},
            {x: x, y: y - 1}
        );
    }
}
```

**Fill Logic:**
- **Paper Fill**: Clicking PAPER pixels fills with INK color
- **Ink Erase**: Clicking INK pixels fills with PAPER color (erases)
- **Boundary Respect**: Stops at different colored pixels
- **Attribute Awareness**: Respects 8×8 block color constraints

**Performance Optimizations:**
- Stack-based algorithm (prevents recursion overflow)
- Visited pixel tracking (prevents infinite loops)
- Boundary pre-checking (improves efficiency)
- Real-time progress feedback for large fills

### 3. Shape Tool - Mathematical Shape Generation

**Function**: `generateShape(shapeType, bounds, options)`

**Purpose**: Create mathematically precise geometric shapes
**Activation**: Click shapes icon, press 'S'
**Available Shapes**: 25+ shapes with unified behavior

**Shape Categories & Behaviors:**

#### Radial Shapes (Center-Out Expansion)
**Shapes**: Circle, Ellipse, Star, Flower, Gear, Moon, Spiral
**Behavior**: Anchor = center point, drag = radius/size
**Usage**: Click center, drag outward to define size

```javascript
// Circle generation using Bresenham's algorithm
function generateCircle(centerX, centerY, radius) {
    const points = [];
    let x = 0, y = radius;
    let d = 3 - 2 * radius;
    
    while (x <= y) {
        // Add 8 symmetric points
        addCirclePoints(centerX, centerY, x, y, points);
        x++;
        
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
    }
    return points;
}
```

#### Corner-Drag Shapes (Rectangular Logic)
**Shapes**: Rectangle, Square, Diamond
**Behavior**: Anchor = corner, drag = opposite corner
**Usage**: Click one corner, drag to opposite corner

#### Base-Up Shapes (Ground Construction)
**Shapes**: Triangle, House
**Behavior**: Anchor = base center, drag = height/top
**Usage**: Click base point, drag upward to define height

#### Directional Shapes (Flow Logic)
**Shapes**: Line, Arrow, Lightning
**Behavior**: Anchor = start point, drag = end point/direction
**Usage**: Click start point, drag to define direction and length

**Advanced Shape Features:**
- **Stroke Width**: 1-8 pixel thickness support
- **Mathematical Precision**: Pixel-perfect algorithms
- **Preview Mode**: Real-time shape preview during creation
- **Unified Interface**: Consistent behavior across all shapes

### 4. Selection Tool - Area Selection & Manipulation

**Function**: `selectionTool(x1, y1, x2, y2, operation)`

**Purpose**: Select rectangular areas for copy/paste/move operations
**Activation**: Click selection icon, press 'N'
**Selection Types**: Rectangular selection with resize handles

**Technical Implementation:**
```javascript
function createSelection(startX, startY, endX, endY) {
    const selection = {
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
        pixels: null,
        attributes: null
    };
    
    // Extract pixel and attribute data
    selection.pixels = extractPixelData(selection);
    selection.attributes = extractAttributeData(selection);
    
    return selection;
}
```

**Selection Operations:**
- **Select**: Click and drag to define rectangular area
- **Move**: Drag selection to new location
- **Copy**: Duplicate selection contents
- **Delete**: Clear selected area
- **Resize**: Use corner handles to modify selection size

## Secondary Drawing Functions

### 5. Grid System - Visual Alignment Aids

**Function**: `toggleGrid(gridType, visibility)`

**Grid Types Available:**

#### 1×1 Pixel Grid
**Purpose**: Pixel-level precision alignment
**Appearance**: Blue grid lines, adaptive opacity
**Behavior**: Auto-hides at low zoom levels
**Usage**: Fine detail work, pixel counting

#### 8×8 Character Grid  
**Purpose**: ZX Spectrum attribute block visualization
**Appearance**: Yellow grid lines
**Behavior**: Shows authentic ZX Spectrum character boundaries
**Usage**: Understanding color constraints, sprite alignment

#### 16×16 Structure Grid
**Purpose**: Layout and structure planning
**Appearance**: Purple grid lines  
**Behavior**: Larger structural divisions
**Usage**: Game sprite planning, layout design

**Grid Implementation:**
```javascript
function updateGridDisplay(zoomLevel) {
    const pixelGridSize = zoomLevel; // 1×1 scales with zoom
    const charGridSize = zoomLevel * 8; // 8×8 character blocks
    const structGridSize = zoomLevel * 16; // 16×16 structure blocks
    
    // Adaptive opacity based on zoom
    const pixelOpacity = zoomLevel >= 4 ? 0.4 : 0.1;
    
    updateCSSGridProperties(pixelGridSize, charGridSize, structGridSize, pixelOpacity);
}
```

### 6. Zoom Control - Multi-Level Magnification

**Function**: `setZoom(zoomLevel)`

**Zoom Levels**: 100%, 200%, 400%, 800%, 1600%
**Methods**: Buttons, slider, keyboard (+/- keys)
**Rendering**: Pixel-perfect scaling with nearest-neighbor

**Zoom Implementation:**
```javascript
function setZoom(level) {
    canvas.style.width = (256 * level) + 'px';
    canvas.style.height = (192 * level) + 'px';
    canvas.style.imageRendering = 'pixelated'; // Crisp pixels
    
    updateGridSizes(level);
    updateCursorSize(level);
    centerCanvasInViewport();
}
```

### 7. Color Management System

**Function**: `colorManager.setInk(colorIndex)` / `colorManager.setPaper(colorIndex)`

**Color Features:**
- **INK/PAPER System**: Dual-color ZX Spectrum model
- **Enable/Disable**: Individual color control
- **Bright/Flash Modes**: Authentic ZX Spectrum attributes
- **Visual Indicators**: Diagonal split color indicator

**Color State Management:**
```javascript
function setInk(colorIndex) {
    const currentInk = this.state.ink;
    const currentInkEnabled = this.state.inkEnabled;
    
    if (currentInk === colorIndex && currentInkEnabled) {
        // Disable ink color (preserve existing)
        this.state.inkEnabled = false;
    } else if (currentInk === colorIndex && !currentInkEnabled) {
        // Re-enable ink color
        this.state.inkEnabled = true;
    } else {
        // Select new ink color
        this.state.ink = colorIndex;
        this.state.inkEnabled = true;
    }
    
    updateColorIndicator();
    emitColorChanged();
}
```

## Tool Workflows

### Brush Tool Workflow

```
1. Tool Selection
   ├─ Click brush icon OR press 'B'
   ├─ Brush tool activated
   └─ Cursor changes to crosshair

2. Size Configuration  
   ├─ Adjust brush size slider (1-8px)
   ├─ Size preview updates
   └─ Size display shows current value

3. Color Setup
   ├─ Left-click palette for INK color
   ├─ Right-click palette for PAPER color
   ├─ Toggle Bright/Flash if needed
   └─ Color indicator updates

4. Drawing Operation
   ├─ Left-click/drag = draw with INK
   ├─ Right-click/drag = draw with PAPER (erase)
   ├─ Real-time canvas update
   └─ Continuous stroke support

5. Automatic Processing
   ├─ Attribute blocks updated
   ├─ History state saved
   ├─ Memory cleanup triggered
   └─ Status feedback provided
```

### Fill Tool Workflow

```
1. Tool Activation
   ├─ Click bucket icon OR press 'F'
   ├─ Fill tool selected
   └─ Instructions displayed

2. Color Preparation
   ├─ Set INK color (fill color)
   ├─ Set PAPER color (background)
   └─ Confirm color indicator

3. Fill Operation
   ├─ Click on target area
   ├─ Algorithm identifies connected pixels
   ├─ Color constraint checking
   └─ Fill execution

4. Fill Logic
   ├─ If click on PAPER → fill with INK
   ├─ If click on INK → fill with PAPER (erase)
   ├─ Stop at color boundaries
   └─ Respect attribute constraints

5. Completion
   ├─ Progress feedback (large fills)
   ├─ History state saved
   ├─ Canvas refreshed
   └─ Ready for next operation
```

### Shape Tool Workflow

```
1. Shape Tool Selection
   ├─ Click shapes icon OR press 'S'
   ├─ Shape palette displayed
   └─ Tool mode activated

2. Shape Selection
   ├─ Click desired shape from palette
   ├─ Shape type confirmed
   ├─ Shape-specific cursor appears
   └─ Instructions displayed

3. Anchor Point Setting
   ├─ Click on canvas for anchor point
   ├─ Anchor behavior varies by shape:
   │  ├─ Radial: center point
   │  ├─ Corner: corner point
   │  ├─ Base-up: base center
   │  └─ Directional: start point

4. Size Definition
   ├─ Drag from anchor point
   ├─ Real-time preview displayed
   ├─ Size/direction feedback
   └─ Shape mathematics calculated

5. Shape Generation
   ├─ Release mouse to confirm
   ├─ Mathematical algorithm executed
   ├─ Pixel-perfect rendering
   ├─ Canvas updated
   └─ History saved
```

### Selection Tool Workflow

```
1. Selection Activation
   ├─ Click selection icon
   ├─ Selection mode enabled
   └─ Selection cursor active

2. Area Selection
   ├─ Click and drag on canvas
   ├─ Selection rectangle appears
   ├─ Real-time size feedback
   └─ Marching ants border

3. Selection Refinement
   ├─ Drag corner handles to resize
   ├─ Move selection by dragging center
   ├─ Cancel with Escape key
   └─ Confirm with Enter key

4. Selection Operations
   ├─ Copy: Ctrl+C
   ├─ Cut: Ctrl+X
   ├─ Paste: Ctrl+V
   ├─ Delete: Delete key
   └─ Move: Drag selection

5. Data Management
   ├─ Pixel data extracted
   ├─ Attribute data preserved
   ├─ Clipboard management
   └─ History integration
```

### Color Management Workflow

```
1. Color Understanding
   ├─ INK = foreground/drawing color
   ├─ PAPER = background/erase color
   ├─ 8×8 block = only 2 colors allowed
   └─ Bright/Flash = display attributes

2. Color Selection
   ├─ Left-click = select INK color
   ├─ Right-click = select PAPER color
   ├─ Double-click = disable color
   └─ Visual feedback immediate

3. Color States
   ├─ Enabled: normal palette color
   ├─ Disabled: checkerboard + red slash
   ├─ Bright: enhanced intensity
   └─ Flash: alternating display

4. Color Application
   ├─ Drawing uses current INK
   ├─ Erasing uses current PAPER
   ├─ Attribute blocks updated
   └─ Constraints enforced

5. Advanced Features
   ├─ Color indicator shows INK/PAPER split
   ├─ Disabled colors preserve existing
   ├─ Bright/Flash affect whole palette
   └─ Real-time constraint feedback
```

### Grid Workflow

```
1. Grid Selection
   ├─ Click grid button (1×1, 8×8, or 16×16)
   ├─ Grid type selected
   └─ Grid overlay activated

2. Grid Display
   ├─ Overlay appears on canvas
   ├─ Non-destructive visual aid
   ├─ Scales with zoom level
   └─ Adaptive opacity

3. Grid Usage
   ├─ 1×1: Pixel-precise alignment
   ├─ 8×8: ZX Spectrum character blocks
   ├─ 16×16: Structural layout
   └─ Multiple grids can be active

4. Grid Benefits
   ├─ Precise positioning
   ├─ Understanding constraints
   ├─ Layout planning
   └─ Professional accuracy
```

This comprehensive drawing system provides professional-grade tools while maintaining perfect ZX Spectrum authenticity, enabling users to create pixel-perfect graphics with modern convenience and precision.