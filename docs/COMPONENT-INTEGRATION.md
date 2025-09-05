# Component Integration & System Interactions

## System Integration Overview

ZX Pixel Smoosher uses a sophisticated event-driven architecture where all components communicate through a central EventBus, creating a loosely coupled, highly maintainable system. This document details how components interact and integrate to create the complete application.

## Core Integration Patterns

### 1. EventBus Communication Hub

**Central Communication Pattern:**
```
Component A → EventBus → Component B
Component B → EventBus → Component C  
Component C → EventBus → Component A
```

**Key Integration Events:**
```javascript
// Core application events
'app-ready'              // Application initialization complete
'state-changed'          // Canvas or application state updates
'canvas-updated'         // Canvas pixel data modified
'tool-changed'           // Drawing tool selection changed
'color-changed'          // INK/PAPER color modifications

// Memory and performance events  
'memory-cleaned'         // Memory optimization completed
'memory-warning'         // Memory pressure detected
'performance-warning'    // Performance issues detected
'emergency-save'         // Critical error, save work

// User interaction events
'file-loaded'           // File import completed
'operation-complete'    // Major operation finished
'zoom-changed'          // Canvas zoom level modified
'grid-toggled'          // Grid display toggled
```

### 2. Component Dependency Graph

```
EventBus (Foundation)
    ↓
ErrorHandler → MemoryManager → HistoryManager
    ↓              ↓              ↓
ShapeGenerator → ColorManager → CanvasManager
    ↓              ↓              ↓
    ZXSpectrumPixelSmasher (Main Controller)
              ↓
         User Interface
```

## Detailed Component Interactions

### 3. Main Application Integration (ZXSpectrumPixelSmasher.js)

**Role**: Central orchestrator that coordinates all other components

**Integration Pattern:**
```javascript
class ZXSpectrumPixelSmasher {
    constructor() {
        // Initialize core systems in dependency order
        this.eventBus = new EventBus();
        this.errorHandler = new ErrorHandler(this.eventBus);
        this.memoryManager = new MemoryManager(this.eventBus);
        this.historyManager = new OptimizedHistoryManager();
        this.shapeGenerator = new ShapeGenerator();
        
        // Initialize application-specific managers
        this.colorManager = new ColorManager(this.eventBus);
        this.canvasManager = new CanvasManager(this.eventBus);
        
        // Connect all systems
        this.connectEventHandlers();
        this.initializeUI();
    }
}
```

**Key Integrations:**
- **EventBus**: Provides to all other components for communication
- **ErrorHandler**: Catches and processes all application errors
- **MemoryManager**: Tracks all created resources and manages cleanup
- **HistoryManager**: Receives state changes and manages undo/redo
- **ShapeGenerator**: Called for shape tool operations
- **UI Elements**: Binds DOM events to application logic

### 4. Memory Manager Integration

**Integration Points:**
```javascript
// Automatic resource registration
memoryManager.registerResource('canvasContexts', context);
memoryManager.registerResource('eventListeners', element, {event, handler});
memoryManager.registerResource('timers', timerId);

// Event-driven cleanup triggers
eventBus.on('canvas-updated', () => memoryManager.scheduleCleanup());
eventBus.on('tool-changed', () => memoryManager.scheduleCleanup());
eventBus.on('file-loaded', () => memoryManager.scheduleCleanup());

// Emergency memory management
eventBus.on('memory-warning', () => memoryManager.performEmergencyCleanup());
```

**Cross-Component Memory Optimization:**
- **Canvas Manager**: Registers canvas contexts for cleanup
- **Event Handlers**: Tracks all DOM event listeners
- **Shape Generator**: Clears generation caches on demand
- **History Manager**: Coordinates with memory cleanup
- **Error Handler**: Triggers emergency cleanup during critical errors

### 5. Error Handler Integration

**Error Propagation Flow:**
```
Component Error → ErrorHandler → EventBus → Other Components
                                    ↓
                              Emergency Save → HistoryManager
                                    ↓
                              Memory Cleanup → MemoryManager
                                    ↓
                              User Notification → UI
```

**Integration Examples:**
```javascript
// Automatic global error catching
window.addEventListener('error', errorHandler.handleCriticalError);
window.addEventListener('unhandledrejection', errorHandler.handleCriticalError);

// Component-specific error handling
canvasManager.drawPixel = errorHandler.safe(() => {
    // Drawing logic that might fail
});

// Cross-component error recovery
eventBus.on('error', (errorData) => {
    if (errorData.critical) {
        historyManager.emergencySave();
        memoryManager.performEmergencyCleanup();
    }
});
```

### 6. History Manager Integration

**State Synchronization:**
```javascript
// Automatic state capture
eventBus.on('canvas-updated', () => {
    const state = canvasManager.getState();
    historyManager.saveState(state.pixels, state.attributes);
});

// Undo/Redo integration
historyManager.on('undo-performed', (state) => {
    canvasManager.setState(state);
    eventBus.emit('state-restored', state);
});

// Memory coordination
historyManager.on('memory-pressure', () => {
    memoryManager.performEmergencyCleanup();
});
```

**Cross-Component History Events:**
- **Canvas Changes**: Automatically saved to history
- **Tool Operations**: Create history checkpoints  
- **Color Changes**: Significant color changes saved
- **Import Operations**: File loads create history points

### 7. Shape Generator Integration

**Tool Integration Pattern:**
```javascript
// Shape tool selection
eventBus.on('tool-changed', (tool) => {
    if (tool === 'shapes') {
        UI.showShapeLibrary();
        shapeGenerator.prepareForShapeDrawing();
    }
});

// Shape generation workflow
shapeGenerator.generateShape(shapeType, bounds, options)
    ↓
canvasManager.applyShapePoints(points)
    ↓
historyManager.saveState(newPixelData, newAttributeData)
    ↓
eventBus.emit('canvas-updated');
```

**Mathematical Integration:**
- **Bresenham Algorithms**: Pixel-perfect line and circle generation
- **Parametric Equations**: Complex shapes like hearts and spirals
- **Anchor/Drag Logic**: Unified interaction model across all shapes
- **Stroke Width**: Integrated thickness calculation
- **Color Integration**: Respects current INK/PAPER settings

### 8. Canvas Manager Integration

**Rendering Pipeline:**
```
User Input → Tool Validation → Canvas Update → 
Attribute Check → History Save → UI Update → Memory Cleanup
```

**Integration Flow:**
```javascript
// Input processing
document.addEventListener('mousedown', (e) => {
    const tool = getCurrentTool();
    const colors = colorManager.getCurrentColors();
    
    if (tool === 'brush') {
        canvasManager.startBrushStroke(e.offsetX, e.offsetY, colors);
    } else if (tool === 'shapes') {
        canvasManager.startShapePreview(e.offsetX, e.offsetY);
    }
});

// Canvas updates trigger system-wide events
canvasManager.updatePixel = (x, y, value) => {
    // Update pixel data
    this.pixels[y * 256 + x] = value;
    
    // Update attributes if needed
    this.updateAttribute(x, y, colorManager.getCurrentColors());
    
    // Trigger events
    eventBus.emit('canvas-updated', {x, y, value});
    eventBus.emit('state-changed');
};
```

### 9. Color Manager Integration

**Color System Workflow:**
```
User Color Selection → Color Validation → 
ZX Spectrum Constraint Check → Canvas Update → 
Attribute System Update → UI Feedback
```

**Integration Points:**
```javascript
// Color changes affect multiple systems
colorManager.setInk = (colorIndex) => {
    this.state.ink = colorIndex;
    
    // Update UI indicator
    UI.updateColorIndicator(this.state);
    
    // Inform other systems
    eventBus.emit('color-changed', this.state);
    
    // Update canvas cursor if needed
    canvasManager.updateCursor(this.state);
};

// Attribute system integration
colorManager.getAttributeForBlock = (blockX, blockY) => {
    return {
        ink: this.state.ink,
        paper: this.state.paper,
        bright: this.state.bright,
        flash: this.state.flash
    };
};
```

### 10. UI Integration Layer

**DOM Event Integration:**
```javascript
// Tool selection integration
document.querySelectorAll('.tool').forEach(button => {
    button.addEventListener('click', (e) => {
        const tool = e.target.dataset.tool;
        eventBus.emit('tool-changed', tool);
        UI.updateToolSelection(tool);
    });
});

// Responsive integration
window.addEventListener('resize', () => {
    canvasManager.handleResize();
    UI.updateLayout();
    memoryManager.scheduleCleanup('resize');
});

// Keyboard shortcuts integration
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        historyManager.undo();
    } else if (e.key === 'b') {
        eventBus.emit('tool-changed', 'brush');
    }
});
```

## Data Flow Integration

### 11. Complete Operation Flow

**Example: Brush Drawing Operation**
```
1. Mouse Down Event (DOM)
    ↓
2. Tool Manager validates current tool
    ↓  
3. Color Manager provides current INK/PAPER
    ↓
4. Canvas Manager updates pixel data
    ↓
5. Attribute Manager checks 8×8 constraints
    ↓
6. History Manager saves state
    ↓
7. EventBus emits 'canvas-updated'
    ↓
8. Memory Manager schedules cleanup
    ↓
9. UI updates status and indicators
    ↓
10. Error Handler monitors for issues
```

### 12. File Operation Integration

**Import/Export Flow:**
```
File Selection (UI) → 
File Validation (ErrorHandler) → 
Format Detection (FileManager) → 
Data Processing (CanvasManager) → 
State Update (HistoryManager) → 
Memory Cleanup (MemoryManager) → 
UI Feedback (EventBus)
```

### 13. Performance Integration

**Performance Monitoring Flow:**
```
Operation Start → Performance Timer Start →
Memory Usage Check → Resource Tracking →
Operation Complete → Cleanup Trigger →
Performance Metrics Update → User Feedback
```

## System Resilience

### 14. Error Recovery Integration

**Multi-Layer Error Handling:**
```
Component Error → Local Recovery Attempt →
Error Handler Notification → Emergency Save →
Memory Cleanup → User Notification →
Graceful Degradation → Continue Operation
```

### 15. Memory Pressure Integration

**Coordinated Memory Management:**
```
Memory Pressure Detected → Emergency Cleanup →
History Compression → Cache Clearing →
Resource Release → Performance Adjustment →
User Warning (if needed) → Continue Operation
```

This integration architecture ensures that all components work together seamlessly while maintaining loose coupling, enabling easy maintenance, testing, and future enhancements to the ZX Pixel Smoosher application.