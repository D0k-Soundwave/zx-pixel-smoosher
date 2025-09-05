# Technical Architecture Documentation

## System Overview

ZX Pixel Smoosher employs a sophisticated modular architecture designed for maintainability, performance, and extensibility while respecting the unique constraints of ZX Spectrum graphics programming.

## Core Architecture Patterns

### 1. Event-Driven Component Architecture
All system components communicate through a central EventBus, ensuring loose coupling and high maintainability.

```javascript
// Central communication hub
EventBus → Component A
       → Component B  
       → Component C
```

**Benefits:**
- Components can be added/removed without affecting others
- Error isolation prevents cascading failures
- Easy testing and debugging
- Real-time performance monitoring

### 2. Modular File Structure
```
/js/
├── core/                    # Foundation systems
│   ├── EventBus.js         # Central communication
│   ├── ErrorHandler.js     # Error management & recovery
│   └── MemoryManager.js    # Aggressive memory optimization
├── managers/               # Business logic
│   └── HistoryManager.js   # Undo/redo with branching
├── shapes/                 # Shape generation
│   └── ShapeGenerator.js   # Mathematical shape algorithms
└── ZXSpectrumPixelSmasher.js # Main application controller
```

## Core Components Deep Dive

### EventBus (js/core/EventBus.js)
**Purpose**: Decoupled inter-component communication
**Pattern**: Observer/Publisher-Subscriber

```javascript
class EventBus {
    on(event, callback)     // Subscribe to events
    off(event, callback)    // Unsubscribe
    emit(event, data)       // Publish events
    clear()                 // Clean all listeners
}
```

**Key Events:**
- `state-changed`: Canvas or application state updates
- `color-changed`: INK/PAPER color modifications
- `tool-changed`: Drawing tool selection
- `error`: Error conditions with recovery options
- `memory-cleaned`: Memory optimization events

### ErrorHandler (js/core/ErrorHandler.js)
**Purpose**: Comprehensive error management with user-friendly recovery
**Pattern**: Centralized Exception Handling

**Features:**
- Global error catching (JavaScript errors, Promise rejections)
- User-friendly error translation
- Emergency save functionality
- Graceful degradation

```javascript
class ErrorHandler {
    handleError(title, error, critical)     // Standard error processing
    handleCriticalError(title, error)       // Emergency procedures
    safe(fn)                                // Execute with error protection
    getUserFriendlyMessage(error)           // Translate technical errors
}
```

### MemoryManager (js/core/MemoryManager.js)
**Purpose**: Aggressive automatic memory optimization
**Pattern**: Resource Management with Monitoring

**Capabilities:**
- **Auto-cleanup**: Every 5 seconds + event-triggered
- **Resource Tracking**: Canvas contexts, event listeners, timers, workers
- **Memory Pressure Detection**: Uses performance.memory API
- **Emergency Cleanup**: Critical memory situations
- **Idle Optimization**: Cleanup during user inactivity

```javascript
class MemoryManager {
    performAutoCleanup()           // Regular maintenance
    performEmergencyCleanup()      // Critical memory recovery
    registerResource(type, resource) // Track resource usage
    getMemoryStats()               // Performance metrics
}
```

**Cleanup Triggers:**
- Time-based (5s intervals)
- Event-based (after operations)
- Memory pressure detection
- User inactivity (30s idle)
- Browser visibility changes

### HistoryManager (js/managers/HistoryManager.js)
**Purpose**: Advanced undo/redo with branching support
**Pattern**: Command Pattern with Branch Management

**Features:**
- **Branching**: Creates branches when undoing then making new changes
- **Compression**: Optimizes pixel and attribute data storage
- **Memory Management**: Auto-cleanup with configurable limits
- **Smart Storage**: Efficient Uint8Array compression

```javascript
class OptimizedHistoryManager {
    saveState(pixelData, attributeData)  // Create history point
    undo()                               // Go back one step
    redo()                               // Go forward one step
    compact()                            // Manual memory optimization
    getMemoryUsage()                     // Statistics and metrics
}
```

## Application Flow Architecture

### Initialization Sequence
1. **Core Systems**: EventBus → ErrorHandler → MemoryManager
2. **Managers**: HistoryManager initialization with event connections
3. **Generators**: ShapeGenerator with 25+ mathematical algorithms
4. **Main Controller**: ZXSpectrumPixelSmasher orchestrates all systems
5. **UI Binding**: DOM elements connected to application events

### Drawing Operation Flow
```
User Input (mouse/touch)
    ↓
Tool Validation & Input Processing
    ↓
ZX Spectrum Constraint Checking
    ↓
Canvas Pixel Manipulation
    ↓
Attribute System Update (8x8 blocks)
    ↓
History State Save
    ↓
UI Feedback & Status Update
    ↓
Memory Cleanup Trigger
```

### Memory Management Flow
```
Operation Complete
    ↓
Auto-Cleanup Timer (5s) OR Event Trigger
    ↓
Resource Scanning (canvas, listeners, timers)
    ↓
Garbage Collection (if memory pressure)
    ↓
Performance Metrics Update
    ↓
User Status Feedback
```

## Data Structures & Storage

### Canvas Data Structure
```javascript
{
    pixels: Uint8Array[256 * 192],      // Pixel data (0/1 values)
    attributes: Array[32][24],          // Color attributes per 8x8 block
    zoom: Number,                       // Current zoom level (1-16)
    gridMode: String                    // '1x1', '8x8', '16x16'
}
```

### Color Attribute Structure
```javascript
{
    ink: Number,        // 0-15 (ZX color index)
    paper: Number,      // 0-15 (ZX color index)  
    bright: Boolean,    // Bright mode flag
    flash: Boolean      // Flash mode flag
}
```

### History State Structure
```javascript
{
    timestamp: Number,
    actionType: String,
    pixels: CompressedUint8Array,
    attributes: CompressedAttributeData,
    branchId: String
}
```

## Performance Optimization Strategies

### 1. Canvas Rendering
- **Pixel-level manipulation**: Direct ImageData access
- **Regional updates**: Only redraw changed areas
- **Double buffering**: Preview canvas for smooth operations
- **Zoom optimization**: Efficient scaling algorithms

### 2. Memory Management
- **Automatic cleanup**: Prevents memory leaks
- **Object pooling**: Reuse objects instead of creating new ones
- **Compressed storage**: Efficient history state compression
- **Weak references**: Allow garbage collection of unused resources

### 3. Event Optimization
- **Event delegation**: Minimal DOM event listeners
- **Debounced operations**: Prevent excessive function calls
- **Passive listeners**: Improve scroll/touch performance
- **Cleanup tracking**: Automatic removal of stale listeners

## Security & Error Handling

### Security Measures
- **Input validation**: All user inputs validated before processing
- **File type checking**: Secure file upload/download handling
- **XSS prevention**: No dynamic HTML generation from user input
- **Memory bounds**: All array access bounds-checked

### Error Recovery
- **Emergency save**: Automatic save during critical errors
- **Graceful degradation**: Continue operation despite component failures
- **User feedback**: Clear, actionable error messages
- **State recovery**: Restore application state after errors

## Scalability & Extensibility

### Adding New Tools
1. Create tool class implementing standard interface
2. Register with EventBus for tool events
3. Add UI elements and event bindings
4. Tool automatically integrates with history and memory systems

### Adding New Shapes
1. Implement shape generation function in ShapeGenerator
2. Add to shape registry with category classification
3. UI automatically displays new shape in palette
4. Inherits all standard behaviors (anchor/drag, stroke width, etc.)

### Adding New File Formats
1. Implement format parser/writer
2. Register with file manager
3. Add UI controls for new format
4. Automatic integration with error handling and validation

This architecture provides a robust foundation for a high-quality graphics application while maintaining the specific constraints and authenticity required for ZX Spectrum graphics creation.