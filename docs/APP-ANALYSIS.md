# ZX Pixel Smoosher - Application Analysis

## Application Purpose

ZX Pixel Smoosher is a high-quality web-based graphics editor specifically designed for creating and editing graphics in the authentic ZX Spectrum format. It faithfully recreates the constraints and capabilities of the original 1982 ZX Spectrum computer, providing modern tools while maintaining historical accuracy.

### Core Functionality
- **Authentic ZX Spectrum Graphics Creation**: 256×192 resolution with original color palette
- **Historical Accuracy**: Respects ZX Spectrum attribute constraints (2 colors per 8×8 block)
- **Modern User Experience**: Contemporary interface with touch/mobile support
- **File Format Support**: Native SCR files, PNG export, Assembly export for retro development

## Technical Specifications

### Frontend Architecture
- **Type**: Single Page Application (SPA)
- **Framework**: Vanilla JavaScript (No external frameworks)
- **Architecture Pattern**: Modular Component-Based with Event-Driven Communication
- **UI Paradigm**: Desktop-class interface with responsive mobile support

### Core Technologies
- **Languages**: HTML5, CSS3, JavaScript ES6+
- **Graphics**: HTML5 Canvas API with 2D rendering context
- **Rendering**: Pixel-perfect graphics with customizable zoom (100%-1600%)
- **File Handling**: FileReader API, Blob API for export/import
- **Performance**: Web Workers (with fallback), requestAnimationFrame optimization

### Browser Compatibility
- **Minimum Requirements**: Modern browsers supporting ES6, Canvas API, FileReader
- **Tested On**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: iOS Safari, Android Chrome with touch optimization
- **No Dependencies**: Runs directly from file:// protocol

## System Architecture

### Modular Component Structure
```
Core System:
├── EventBus - Decoupled component communication
├── ErrorHandler - Comprehensive error management with recovery
├── MemoryManager - Aggressive automatic memory optimization
└── HistoryManager - Advanced undo/redo with branching support

Specialized Modules:
├── ShapeGenerator - Mathematical shape generation (25+ shapes)
├── ColorManager - ZX Spectrum palette and attribute management
├── CanvasManager - High-performance rendering engine
└── FileManager - Import/export with format validation
```

### Event-Driven Architecture
- **Central EventBus**: All components communicate through events
- **Loose Coupling**: Components can be added/removed without affecting others
- **Error Isolation**: Component failures don't cascade
- **Performance Events**: Real-time memory and performance monitoring

## Application Workflows

### Primary User Workflow
1. **Canvas Creation**: New 256×192 canvas with ZX Spectrum attributes
2. **Tool Selection**: Brush, Fill, Shapes, or Selection tools
3. **Color Management**: INK/PAPER color selection with enable/disable states
4. **Drawing Operations**: Pixel-level editing with authentic constraints
5. **Export/Save**: PNG, SCR, or Assembly format output

### Drawing Engine Workflow
```
User Input → Tool Validation → Color Constraint Check → 
Canvas Update → Attribute Management → History Save → 
Performance Monitor → Memory Cleanup
```

### Memory Management Workflow
```
Operation Complete → Auto-Cleanup Trigger → 
Resource Scanning → Garbage Collection → 
Performance Monitoring → User Feedback
```

## Core Constraints & Design Goals

### ZX Spectrum Authenticity
- **Resolution**: Fixed 256×192 pixels (no deviation)
- **Color Palette**: Exact 16-color ZX Spectrum palette with bright/normal variants
- **Attribute System**: 2 colors per 8×8 character block (INK + PAPER)
- **File Formats**: Native .SCR support for authentic retro development

### Performance Constraints
- **File Size**: All modules under 2000 lines for optimal processing
- **Memory**: Aggressive auto-cleanup every 5 seconds
- **Responsiveness**: 60fps rendering with zoom levels up to 1600%
- **Mobile**: Touch-optimized interface for tablets/phones

### User Experience Goals
- **High Quality**: Desktop-class interface and functionality
- **Accessibility**: Full ARIA support, keyboard navigation, screen readers
- **Error Recovery**: Comprehensive error handling with user-friendly messages
- **No Installation**: Runs directly in browser, no setup required

## Application Functions

### Drawing Tools
- **Brush Tool**: Variable size (1-8px) with pixel-perfect rendering
- **Fill Tool**: Standard paint bucket with ZX Spectrum attribute awareness
- **Shape Tool**: 25+ mathematically-generated shapes with unified anchor/drag behavior
- **Selection Tool**: Area selection for copy/paste operations

### Shape Library (25+ Shapes)
```
Basic Shapes: Line, Rectangle, Square, Circle, Ellipse
Polygons: Triangle, Diamond, Pentagon, Hexagon, Octagon
Stars & Complex: Star, Heart, Lightning, Moon, Flower, Gear, Spiral
Geometric: Trapezoid, Parallelogram, Kite, Cross, Plus
Arrows: Up, Down, Left, Right
Decorative: House, Bowtie, Hourglass
```

### Color Management
- **INK/PAPER System**: Authentic ZX Spectrum dual-color attribute system
- **Color Enable/Disable**: Individual control over INK and PAPER colors
- **Bright/Flash Modes**: Original ZX Spectrum display attributes
- **Visual Feedback**: Diagonal color indicator showing current INK/PAPER state

### File Operations
- **Import Formats**: PNG, JPEG, SCR (ZX Spectrum native format)
- **Export Formats**: 
  - PNG: High-quality raster export
  - SCR: Authentic ZX Spectrum screen file
  - ASM: Z80 Assembly data for retro development
- **File Validation**: Format checking and error handling

### Grid Systems
- **1×1 Pixel Grid**: Adaptive opacity based on zoom level
- **8×8 Character Grid**: Yellow overlay showing ZX Spectrum attribute blocks
- **16×16 Structure Grid**: Purple overlay for layout planning

### Advanced Features
- **Undo/Redo System**: Branch-aware history with 50 state capacity
- **Memory Optimization**: Real-time cleanup and performance monitoring  
- **Zoom Control**: 100% to 1600% with smooth scaling
- **Responsive Design**: Desktop-to-mobile adaptive interface
- **Error Recovery**: Emergency save and graceful failure handling

## Technical Implementation Details

### Canvas Rendering Engine
- **Pixel Buffer**: Uint8Array for efficient pixel manipulation
- **Attribute Buffer**: Separate array for ZX Spectrum color attributes
- **Double Buffering**: Preview canvas for smooth tool operations
- **Optimized Redraws**: Only updates changed regions

### Memory Management Strategy
- **Aggressive Cleanup**: Auto-cleanup every 5 seconds
- **Resource Tracking**: Monitors canvas contexts, event listeners, timers
- **Garbage Collection**: Forces GC when memory pressure detected
- **Performance Monitoring**: Real-time memory usage display

### Error Handling Philosophy
- **Root Cause Focus**: Addresses underlying problems, not symptoms
- **Graceful Degradation**: Continues operating despite component failures
- **User Communication**: Clear, actionable error messages
- **Recovery Mechanisms**: Emergency save and state restoration

### Shape Generation System
- **Mathematical Precision**: Bresenham algorithms for pixel-perfect lines/circles
- **Unified Behavior**: Consistent anchor/drag logic across all shapes
- **Category-Based Logic**: Different interaction patterns for different shape types
- **Stroke Width Support**: Configurable thickness with anti-aliased rendering

This application represents a sophisticated balance between historical authenticity and modern usability, providing professional-grade tools for ZX Spectrum graphics creation while maintaining the exact constraints and characteristics of the original 1982 hardware.