# 🎨 ZX Pixel Smoosher

**Authentic ZX Spectrum Graphics Editor** - Create pixel-perfect retro graphics with authentic hardware constraints

[![Deploy to GitHub Pages](https://github.com/D0k-Soundwave/zx-pixel-smoosher/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/D0k-Soundwave/zx-pixel-smoosher/actions/workflows/deploy-pages.yml)
[![Security Audit](https://github.com/D0k-Soundwave/zx-pixel-smoosher/actions/workflows/security-audit.yml/badge.svg)](https://github.com/D0k-Soundwave/zx-pixel-smoosher/actions/workflows/security-audit.yml)
[![Cross-Browser Testing](https://github.com/D0k-Soundwave/zx-pixel-smoosher/actions/workflows/cross-browser-testing.yml/badge.svg)](https://github.com/D0k-Soundwave/zx-pixel-smoosher/actions/workflows/cross-browser-testing.yml)

> Experience authentic ZX Spectrum graphics creation with modern web technology. No installation required - runs directly in your browser!

## ✨ Features

### 🖼️ **Authentic ZX Spectrum Graphics**
- **256×192 resolution** - Exactly matches original ZX Spectrum display
- **16-color palette** - 8 normal + 8 bright colors with authentic hex values
- **Attribute constraints** - Maximum 2 colors per 8×8 pixel block (INK and PAPER)
- **FLASH support** - Animated color effects just like the original

### 🎨 **Professional Drawing Tools**
- **Variable brush sizes** - Pixel-perfect drawing with multiple brush options
- **30+ shapes** - Lines, circles, rectangles, polygons, arrows, and geometric patterns
- **Advanced fill tools** - Flood fill, pattern fill, and gradient options
- **Mathematical precision** - All shapes use parametric equations for accuracy

### 💾 **Export & Compatibility**
- **PNG Export** - Modern format with authentic color representation
- **SCR Export** - Native ZX Spectrum format (6912 bytes: 6144 pixels + 768 attributes)
- **ASM Export** - Z80 assembly data for retro development workflows
- **Perfect compatibility** - Files work with real ZX Spectrum systems and emulators

### 🔧 **Advanced Features**
- **Undo/Redo system** - Branching history with memory optimization
- **Real-time memory management** - Automatic cleanup prevents memory leaks
- **Performance monitoring** - Built-in metrics for smooth operation
- **Mobile support** - Touch-friendly interface for tablets and phones

## 🚀 Getting Started

### **Instant Use - No Installation Required**

1. **Option 1: Use Online (Recommended)**
   - Visit the [live demo](https://d0k-soundwave.github.io/zx-pixel-smoosher/) (auto-deployed from this repo)
   - Start creating immediately!

2. **Option 2: Download & Run Locally**
   ```bash
   # Download the latest release
   curl -L https://github.com/D0k-Soundwave/zx-pixel-smoosher/releases/latest/download/zx-pixel-smoosher-v*.zip -o zx-pixel-smoosher.zip
   
   # Extract and open
   unzip zx-pixel-smoosher.zip
   open index.html  # Or double-click index.html
   ```

3. **Option 3: Clone Repository**
   ```bash
   git clone https://github.com/D0k-Soundwave/zx-pixel-smoosher.git
   cd zx-pixel-smoosher
   open index.html  # Works from file:// protocol
   ```

### **System Requirements**
- Any modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- No installation, build process, or server required
- Works completely offline once loaded

## 🎯 Quick Start Guide

1. **Choose Colors** - Select INK and PAPER colors from the authentic ZX Spectrum palette
2. **Select Tool** - Pick from brush, shapes, or fill tools
3. **Draw** - Click and drag on the 256×192 canvas
4. **Export** - Save as PNG for modern use, or SCR for authentic ZX Spectrum format

### **ZX Spectrum Tips**
- Remember the **8×8 attribute constraint** - only 2 colors per block
- Use **BRIGHT** variants for vivid colors
- **FLASH** creates animated color effects
- **SCR files** can be loaded on real ZX Spectrum hardware

## 🏗️ Technical Architecture

### **Pure Web Technologies**
```
ZX Pixel Smoosher/
├── index.html          # Main application (single file entry)
├── css/                # Stylesheets
├── js/                 # Core application code
│   ├── core/          # EventBus, ErrorHandler, MemoryManager
│   ├── managers/      # HistoryManager, FillManager, FillToolManager
│   └── shapes/        # ShapeGenerator with 30+ mathematical shapes
└── workflows/         # 12 GitHub Actions for automation
```

### **Key Technologies**
- **Vanilla JavaScript** - No frameworks or dependencies
- **HTML5 Canvas** - High-performance graphics rendering  
- **CSS Grid/Flexbox** - Responsive layout system
- **Web APIs** - File API, Canvas API, Performance API
- **Event-driven architecture** - Modular component communication

### **Performance Features**
- **Memory management** - Automatic cleanup and garbage collection
- **Object pooling** - Efficient resource reuse
- **RequestAnimationFrame** - Smooth animations and rendering
- **Compressed history** - Efficient undo/redo with minimal memory usage

## 🎨 ZX Spectrum Technical Details

### **Hardware Authenticity**
- **Resolution**: Exactly 256×192 pixels (authentic ZX Spectrum)
- **Memory Layout**: 6912 bytes total (6144 pixel data + 768 attribute data)
- **Color System**: 16 colors with NORMAL/BRIGHT variants
- **Attribute Blocks**: 32×24 grid of 8×8 pixel blocks

### **Color Palette**
```
NORMAL COLORS:    BRIGHT COLORS:
Black   #000000   Black   #000000
Blue    #0000CD   Blue    #0000FF  
Red     #CD0000   Red     #FF0000
Magenta #CD00CD   Magenta #FF00FF
Green   #00CD00   Green   #00FF00
Cyan    #00CDCD   Cyan    #00FFFF
Yellow  #CDCD00   Yellow  #FFFF00
White   #E8E8E8   White   #FFFFFF
```

## 🔧 Development & Contributions

### **Development Setup**
```bash
git clone https://github.com/D0k-Soundwave/zx-pixel-smoosher.git
cd zx-pixel-smoosher

# No build process needed - just open index.html
python3 -m http.server 8080  # Optional: local server
```

### **Testing**
The project includes comprehensive automated testing:
- **Visual regression testing** with Playwright
- **Cross-browser compatibility** (Chrome, Firefox, Safari, Edge)
- **Mobile device testing** (5+ devices)
- **Performance monitoring** with Lighthouse
- **ZX Spectrum constraint validation**

```bash
# Workflows run automatically on push/PR
# Check Actions tab for test results
```

### **Code Quality**
- **ESLint** with ZX Spectrum-specific rules
- **Prettier** code formatting
- **JSDoc** documentation validation
- **Security auditing** with multiple scanners
- **Performance benchmarking**

## 📦 Release System

ZX Pixel Smoosher uses automated semantic versioning:

- **Patch** releases (1.0.1) - Bug fixes
- **Minor** releases (1.1.0) - New features  
- **Major** releases (2.0.0) - Breaking changes
- **Prerelease** versions - Alpha/beta testing

Each release includes:
- Distributable ZIP file
- Complete source code
- Comprehensive changelog
- SHA256/MD5 checksums

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes following our coding standards
4. **Test** your changes (workflows run automatically)
5. **Commit** using conventional commits (`feat:`, `fix:`, `docs:`, etc.)
6. **Push** to your branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### **Contribution Guidelines**
- Follow existing code style and architecture
- Maintain ZX Spectrum hardware authenticity
- Add tests for new features
- Update documentation as needed
- Use semantic commit messages

## 🐛 Bug Reports & Support

- **Bug reports**: [Open an issue](https://github.com/D0k-Soundwave/zx-pixel-smoosher/issues)
- **Feature requests**: [Start a discussion](https://github.com/D0k-Soundwave/zx-pixel-smoosher/discussions)
- **Security issues**: See [SECURITY.md](SECURITY.md)

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🌟 Acknowledgments

- **Sinclair Research** - Original ZX Spectrum hardware and design
- **ZX Spectrum Community** - Preservation of technical specifications
- **Retro Computing Enthusiasts** - Keeping the spirit alive

---

<div align="center">

**Made with ❤️ for the ZX Spectrum community**

[🎮 Try It Live](https://d0k-soundwave.github.io/zx-pixel-smoosher/) | [📥 Download Latest](https://github.com/D0k-Soundwave/zx-pixel-smoosher/releases/latest) | [🐛 Report Issues](https://github.com/D0k-Soundwave/zx-pixel-smoosher/issues)

</div>