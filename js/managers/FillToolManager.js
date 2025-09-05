/**
 * Fill Tool Manager - UI integration and tool state management for advanced fills
 * Handles tool selection, options, and UI updates for all fill types
 * Integrates with existing tool system and maintains ZX Spectrum constraints
 * 
 * @class FillToolManager
 */
class FillToolManager {
    constructor(eventBus, fillManager, colorManager) {
        this.eventBus = eventBus;
        this.fillManager = fillManager;
        this.colorManager = colorManager;
        
        // Check if FillManager is available
        if (!this.fillManager) {
            console.error('FillToolManager requires FillManager but received null');
            throw new Error('FillManager is required for FillToolManager');
        }
        
        // Current fill tool state
        this.currentTool = {
            type: 'flood', // Default to flood fill for backward compatibility
            options: {},
            enabled: true
        };
        
        // UI element references (populated after DOM is ready)
        this.ui = {
            fillTypeSelect: null,
            optionsPanel: null,
            patternSelect: null,
            gradientControls: null,
            fractalControls: null,
            smartControls: null,
            textureControls: null
        };
        
        // Fill type definitions with UI configurations
        this.fillTypes = this.initializeFillTypes();
        
        // Initialize after DOM is ready
        this.setupEventListeners();
    }
    
    /**
     * Initialize fill type definitions with default options and UI configs
     * @returns {Object} Fill type definitions
     */
    initializeFillTypes() {
        return {
            flood: {
                name: 'Flood Fill',
                description: 'Standard flood fill - fills connected areas of same color',
                icon: '🌊',
                options: {},
                uiElements: []
            },
            pattern: {
                name: 'Pattern Fill',
                description: 'Fill with repeating patterns',
                icon: '🔲',
                options: {
                    patternName: 'dots',
                    scale: 1
                },
                uiElements: ['patternSelect', 'scaleSlider']
            },
            gradient: {
                name: 'Gradient Fill',
                description: 'Fill with color gradients',
                icon: '🌅',
                options: {
                    gradientType: 'linear',
                    direction: 0,
                    radius: 100
                },
                uiElements: ['gradientTypeSelect', 'directionSlider', 'radiusSlider']
            },
            fractal: {
                name: 'Fractal Fill',
                description: 'Fill with mathematical fractals',
                icon: '🌀',
                options: {
                    fractalType: 'mandelbrot',
                    iterations: 50,
                    zoom: 1
                },
                uiElements: ['fractalTypeSelect', 'iterationsSlider', 'zoomSlider']
            },
            smart: {
                name: 'Smart Fill',
                description: 'Intelligent fill with tolerance and edge detection',
                icon: '🧠',
                options: {
                    tolerance: 0,
                    edgeAware: false,
                    regionConstrained: true
                },
                uiElements: ['toleranceSlider', 'edgeAwareToggle', 'regionConstrainedToggle']
            },
            texture: {
                name: 'Texture Fill',
                description: 'Fill with procedural textures',
                icon: '🧱',
                options: {
                    textureType: 'brick',
                    scale: 1,
                    rotation: 0
                },
                uiElements: ['textureTypeSelect', 'scaleSlider', 'rotationSlider']
            }
        };
    }
    
    /**
     * Setup event listeners for fill tool management
     */
    setupEventListeners() {
        // Listen for fill tool activation
        this.eventBus.on('tool-changed', (data) => {
            if (data.tool === 'fill' || data.tool === 'flood-fill') {
                this.activateFillTool();
            }
        });
        
        // Listen for fill type changes
        this.eventBus.on('fill-type-selected', (data) => {
            this.setFillType(data.type, data.options);
        });
        
        // Listen for fill option changes
        this.eventBus.on('fill-option-changed', (data) => {
            this.updateFillOption(data.option, data.value);
        });
        
        // Listen for DOM ready to initialize UI
        this.eventBus.on('dom-ready', () => {
            this.initializeUI();
        });
        
        // Listen for canvas clicks when fill tool is active
        this.eventBus.on('canvas-click', (data) => {
            if (this.currentTool.enabled && this.isCurrentTool()) {
                this.performFill(data);
            }
        });
    }
    
    /**
     * Check if fill tool is currently active
     * @returns {boolean} Is current tool
     */
    isCurrentTool() {
        // This would integrate with the existing tool manager
        // For now, we'll assume fill tool is active when enabled
        return this.currentTool.enabled;
    }
    
    /**
     * Activate the fill tool
     */
    activateFillTool() {
        this.currentTool.enabled = true;
        this.showFillUI();
        this.updateFillManagerConfig();
        
        this.eventBus.emit('status', {
            message: `🎨 Fill tool active: ${this.fillTypes[this.currentTool.type].name}`,
            type: 'info'
        });
    }
    
    /**
     * Deactivate the fill tool
     */
    deactivateFillTool() {
        this.currentTool.enabled = false;
        this.hideFillUI();
    }
    
    /**
     * Set current fill type and options
     * @param {string} type - Fill type
     * @param {Object} options - Fill options (optional)
     */
    setFillType(type, options = {}) {
        if (!this.fillTypes[type]) {
            console.warn(`Unknown fill type: ${type}`);
            return;
        }
        
        // Merge with default options
        const defaultOptions = { ...this.fillTypes[type].options };
        this.currentTool.type = type;
        this.currentTool.options = { ...defaultOptions, ...options };
        
        // Update fill manager
        this.updateFillManagerConfig();
        
        // Update UI
        this.updateFillTypeUI();
        this.updateOptionsUI();
        
        this.eventBus.emit('status', {
            message: `🔧 Fill type: ${this.fillTypes[type].name}`,
            type: 'info'
        });
    }
    
    /**
     * Update a specific fill option
     * @param {string} option - Option name
     * @param {*} value - Option value
     */
    updateFillOption(option, value) {
        this.currentTool.options[option] = value;
        this.updateFillManagerConfig();
        this.updateOptionsUI();
        
        // Show live preview if enabled
        this.showOptionPreview(option, value);
    }
    
    /**
     * Update fill manager configuration
     */
    updateFillManagerConfig() {
        this.fillManager.setFillType(this.currentTool.type, this.currentTool.options);
    }
    
    /**
     * Perform fill operation
     * @param {Object} data - Click data { x, y, button, etc. }
     */
    performFill(data) {
        const { x, y, button } = data;
        
        // Check if this is an erase operation (right click or specific button)
        const erase = button === 2 || data.erase === true;
        
        // Prepare fill data
        const fillData = {
            x: Math.floor(x),
            y: Math.floor(y),
            erase,
            type: this.currentTool.type,
            options: { ...this.currentTool.options }
        };
        
        // Emit fill event
        this.eventBus.emit('fill-operation', fillData);
        
        // Update fill statistics
        this.updateFillStats();
    }
    
    /**
     * Initialize UI elements after DOM is ready
     */
    initializeUI() {
        this.createFillUI();
        this.bindUIEvents();
        this.updateFillTypeUI();
        this.updateOptionsUI();
    }
    
    /**
     * Create fill UI elements
     */
    createFillUI() {
        // Find the existing tools container
        const toolsContainer = document.querySelector('.tools-container') || 
                              document.querySelector('.tool-bar') ||
                              document.createElement('div');
        
        // Create fill tools section if it doesn't exist
        let fillSection = document.getElementById('fill-tools-section');
        if (!fillSection) {
            fillSection = this.createFillToolsSection();
            toolsContainer.appendChild(fillSection);
        }
        
        // Store UI references
        this.ui.fillTypeSelect = document.getElementById('fill-type-select');
        this.ui.optionsPanel = document.getElementById('fill-options-panel');
        
        // Create specific option controls
        this.createOptionControls();
    }
    
    /**
     * Create fill tools section HTML
     * @returns {HTMLElement} Fill tools section
     */
    createFillToolsSection() {
        const section = document.createElement('div');
        section.id = 'fill-tools-section';
        section.className = 'tool-section fill-tools';
        
        section.innerHTML = `
            <div class="tool-header">
                <h3>🎨 Advanced Fills</h3>
                <button id="fill-help-btn" class="btn-help" title="Fill Tool Help">?</button>
            </div>
            
            <div class="tool-controls">
                <!-- Fill Type Selector -->
                <div class="control-group">
                    <label for="fill-type-select">Fill Type:</label>
                    <select id="fill-type-select" class="control-select">
                        ${Object.entries(this.fillTypes).map(([key, type]) => 
                            `<option value="${key}">${type.icon} ${type.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <!-- Fill Options Panel -->
                <div id="fill-options-panel" class="options-panel">
                    <!-- Options will be populated dynamically -->
                </div>
                
                <!-- Fill Actions -->
                <div class="control-group fill-actions">
                    <button id="fill-preview-btn" class="btn" title="Preview Fill">👁 Preview</button>
                    <button id="fill-reset-btn" class="btn" title="Reset Options">🔄 Reset</button>
                </div>
            </div>
        `;
        
        return section;
    }
    
    /**
     * Create option controls for each fill type
     */
    createOptionControls() {
        const optionsPanel = this.ui.optionsPanel;
        if (!optionsPanel) return;
        
        // Clear existing options
        optionsPanel.innerHTML = '';
        
        // Create options for current fill type
        const fillType = this.fillTypes[this.currentTool.type];
        const options = this.currentTool.options;
        
        fillType.uiElements.forEach(elementType => {
            const control = this.createOptionControl(elementType, options);
            if (control) {
                optionsPanel.appendChild(control);
            }
        });
        
        // Show fill type description
        const description = document.createElement('div');
        description.className = 'fill-description';
        description.textContent = fillType.description;
        optionsPanel.insertBefore(description, optionsPanel.firstChild);
    }
    
    /**
     * Create a specific option control
     * @param {string} elementType - Type of control to create
     * @param {Object} options - Current options
     * @returns {HTMLElement} Control element
     */
    createOptionControl(elementType, options) {
        const group = document.createElement('div');
        group.className = 'control-group';
        
        switch (elementType) {
            case 'patternSelect':
                group.innerHTML = `
                    <label for="pattern-select">Pattern:</label>
                    <select id="pattern-select" class="control-select">
                        ${this.fillManager.getAvailablePatterns().map(pattern => 
                            `<option value="${pattern}" ${options.patternName === pattern ? 'selected' : ''}>
                                ${pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                            </option>`
                        ).join('')}
                    </select>
                `;
                break;
                
            case 'scaleSlider':
                group.innerHTML = `
                    <label for="scale-slider">Scale: <span id="scale-value">${options.scale || 1}</span></label>
                    <input type="range" id="scale-slider" class="control-slider" 
                           min="0.1" max="5" step="0.1" value="${options.scale || 1}">
                `;
                break;
                
            case 'gradientTypeSelect':
                group.innerHTML = `
                    <label for="gradient-type-select">Gradient:</label>
                    <select id="gradient-type-select" class="control-select">
                        <option value="linear" ${options.gradientType === 'linear' ? 'selected' : ''}>Linear</option>
                        <option value="radial" ${options.gradientType === 'radial' ? 'selected' : ''}>Radial</option>
                        <option value="angular" ${options.gradientType === 'angular' ? 'selected' : ''}>Angular</option>
                        <option value="diamond" ${options.gradientType === 'diamond' ? 'selected' : ''}>Diamond</option>
                    </select>
                `;
                break;
                
            case 'directionSlider':
                group.innerHTML = `
                    <label for="direction-slider">Direction: <span id="direction-value">${options.direction || 0}°</span></label>
                    <input type="range" id="direction-slider" class="control-slider" 
                           min="0" max="360" step="1" value="${options.direction || 0}">
                `;
                break;
                
            case 'radiusSlider':
                group.innerHTML = `
                    <label for="radius-slider">Radius: <span id="radius-value">${options.radius || 100}</span></label>
                    <input type="range" id="radius-slider" class="control-slider" 
                           min="10" max="300" step="10" value="${options.radius || 100}">
                `;
                break;
                
            case 'fractalTypeSelect':
                group.innerHTML = `
                    <label for="fractal-type-select">Fractal:</label>
                    <select id="fractal-type-select" class="control-select">
                        <option value="mandelbrot" ${options.fractalType === 'mandelbrot' ? 'selected' : ''}>Mandelbrot</option>
                        <option value="julia" ${options.fractalType === 'julia' ? 'selected' : ''}>Julia</option>
                        <option value="sierpinski" ${options.fractalType === 'sierpinski' ? 'selected' : ''}>Sierpinski</option>
                        <option value="dragon" ${options.fractalType === 'dragon' ? 'selected' : ''}>Dragon</option>
                        <option value="plasma" ${options.fractalType === 'plasma' ? 'selected' : ''}>Plasma</option>
                        <option value="perlin" ${options.fractalType === 'perlin' ? 'selected' : ''}>Perlin</option>
                    </select>
                `;
                break;
                
            case 'iterationsSlider':
                group.innerHTML = `
                    <label for="iterations-slider">Iterations: <span id="iterations-value">${options.iterations || 50}</span></label>
                    <input type="range" id="iterations-slider" class="control-slider" 
                           min="10" max="200" step="10" value="${options.iterations || 50}">
                `;
                break;
                
            case 'zoomSlider':
                group.innerHTML = `
                    <label for="zoom-slider">Zoom: <span id="zoom-value">${options.zoom || 1}</span></label>
                    <input type="range" id="zoom-slider" class="control-slider" 
                           min="0.1" max="10" step="0.1" value="${options.zoom || 1}">
                `;
                break;
                
            case 'toleranceSlider':
                group.innerHTML = `
                    <label for="tolerance-slider">Tolerance: <span id="tolerance-value">${options.tolerance || 0}</span></label>
                    <input type="range" id="tolerance-slider" class="control-slider" 
                           min="0" max="1" step="0.1" value="${options.tolerance || 0}">
                `;
                break;
                
            case 'edgeAwareToggle':
                group.innerHTML = `
                    <label class="control-checkbox">
                        <input type="checkbox" id="edge-aware-toggle" ${options.edgeAware ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Edge Aware Fill
                    </label>
                `;
                break;
                
            case 'regionConstrainedToggle':
                group.innerHTML = `
                    <label class="control-checkbox">
                        <input type="checkbox" id="region-constrained-toggle" ${options.regionConstrained ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Constrain to Region
                    </label>
                `;
                break;
                
            case 'textureTypeSelect':
                group.innerHTML = `
                    <label for="texture-type-select">Texture:</label>
                    <select id="texture-type-select" class="control-select">
                        <option value="brick" ${options.textureType === 'brick' ? 'selected' : ''}>Brick</option>
                        <option value="wood" ${options.textureType === 'wood' ? 'selected' : ''}>Wood</option>
                        <option value="fabric" ${options.textureType === 'fabric' ? 'selected' : ''}>Fabric</option>
                        <option value="organic" ${options.textureType === 'organic' ? 'selected' : ''}>Organic</option>
                    </select>
                `;
                break;
                
            case 'rotationSlider':
                group.innerHTML = `
                    <label for="rotation-slider">Rotation: <span id="rotation-value">${options.rotation || 0}°</span></label>
                    <input type="range" id="rotation-slider" class="control-slider" 
                           min="0" max="360" step="15" value="${options.rotation || 0}">
                `;
                break;
                
            default:
                return null;
        }
        
        return group;
    }
    
    /**
     * Bind UI events
     */
    bindUIEvents() {
        // Fill type selection
        const fillTypeSelect = this.ui.fillTypeSelect;
        if (fillTypeSelect) {
            fillTypeSelect.addEventListener('change', (e) => {
                this.setFillType(e.target.value);
            });
        }
        
        // Options panel event delegation
        const optionsPanel = this.ui.optionsPanel;
        if (optionsPanel) {
            optionsPanel.addEventListener('change', (e) => {
                this.handleOptionChange(e);
            });
            
            optionsPanel.addEventListener('input', (e) => {
                this.handleOptionInput(e);
            });
        }
        
        // Action buttons
        this.bindActionButtons();
    }
    
    /**
     * Handle option change events
     * @param {Event} e - Change event
     */
    handleOptionChange(e) {
        const { id, value, type, checked } = e.target;
        
        let optionName, optionValue;
        
        switch (id) {
            case 'pattern-select':
                optionName = 'patternName';
                optionValue = value;
                break;
            case 'gradient-type-select':
                optionName = 'gradientType';
                optionValue = value;
                break;
            case 'fractal-type-select':
                optionName = 'fractalType';
                optionValue = value;
                break;
            case 'texture-type-select':
                optionName = 'textureType';
                optionValue = value;
                break;
            case 'edge-aware-toggle':
                optionName = 'edgeAware';
                optionValue = checked;
                break;
            case 'region-constrained-toggle':
                optionName = 'regionConstrained';
                optionValue = checked;
                break;
        }
        
        if (optionName) {
            this.updateFillOption(optionName, optionValue);
        }
    }
    
    /**
     * Handle option input events (sliders)
     * @param {Event} e - Input event
     */
    handleOptionInput(e) {
        const { id, value } = e.target;
        
        let optionName, optionValue, displayValue;
        
        switch (id) {
            case 'scale-slider':
                optionName = 'scale';
                optionValue = parseFloat(value);
                displayValue = optionValue;
                break;
            case 'direction-slider':
                optionName = 'direction';
                optionValue = parseInt(value);
                displayValue = `${optionValue}°`;
                break;
            case 'radius-slider':
                optionName = 'radius';
                optionValue = parseInt(value);
                displayValue = optionValue;
                break;
            case 'iterations-slider':
                optionName = 'iterations';
                optionValue = parseInt(value);
                displayValue = optionValue;
                break;
            case 'zoom-slider':
                optionName = 'zoom';
                optionValue = parseFloat(value);
                displayValue = optionValue;
                break;
            case 'tolerance-slider':
                optionName = 'tolerance';
                optionValue = parseFloat(value);
                displayValue = optionValue;
                break;
            case 'rotation-slider':
                optionName = 'rotation';
                optionValue = parseInt(value);
                displayValue = `${optionValue}°`;
                break;
        }
        
        if (optionName) {
            // Update display value
            const valueDisplay = document.getElementById(id.replace('-slider', '-value'));
            if (valueDisplay) {
                valueDisplay.textContent = displayValue;
            }
            
            this.updateFillOption(optionName, optionValue);
        }
    }
    
    /**
     * Bind action button events
     */
    bindActionButtons() {
        const previewBtn = document.getElementById('fill-preview-btn');
        const resetBtn = document.getElementById('fill-reset-btn');
        const helpBtn = document.getElementById('fill-help-btn');
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.showFillPreview();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFillOptions();
            });
        }
        
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showFillHelp();
            });
        }
    }
    
    /**
     * Show fill UI
     */
    showFillUI() {
        const fillSection = document.getElementById('fill-tools-section');
        if (fillSection) {
            fillSection.style.display = 'block';
            fillSection.classList.add('active');
        }
    }
    
    /**
     * Hide fill UI
     */
    hideFillUI() {
        const fillSection = document.getElementById('fill-tools-section');
        if (fillSection) {
            fillSection.style.display = 'none';
            fillSection.classList.remove('active');
        }
    }
    
    /**
     * Update fill type UI
     */
    updateFillTypeUI() {
        if (this.ui.fillTypeSelect) {
            this.ui.fillTypeSelect.value = this.currentTool.type;
        }
    }
    
    /**
     * Update options UI
     */
    updateOptionsUI() {
        this.createOptionControls();
        this.bindUIEvents();
    }
    
    /**
     * Show option preview
     * @param {string} option - Option name
     * @param {*} value - Option value
     */
    showOptionPreview(option, value) {
        // Emit preview event for canvas to show preview
        this.eventBus.emit('fill-preview', {
            type: this.currentTool.type,
            option,
            value,
            options: this.currentTool.options
        });
    }
    
    /**
     * Show fill preview
     */
    showFillPreview() {
        this.eventBus.emit('status', {
            message: '👁 Preview mode: Click to see fill result',
            type: 'info'
        });
        
        // Emit preview event
        this.eventBus.emit('fill-preview-mode', {
            type: this.currentTool.type,
            options: this.currentTool.options
        });
    }
    
    /**
     * Reset fill options to defaults
     */
    resetFillOptions() {
        const fillType = this.fillTypes[this.currentTool.type];
        this.currentTool.options = { ...fillType.options };
        
        this.updateFillManagerConfig();
        this.updateOptionsUI();
        
        this.eventBus.emit('status', {
            message: '🔄 Fill options reset to defaults',
            type: 'info'
        });
    }
    
    /**
     * Show fill help
     */
    showFillHelp() {
        const fillType = this.fillTypes[this.currentTool.type];
        
        this.eventBus.emit('show-help', {
            title: `${fillType.icon} ${fillType.name} Help`,
            content: this.getFillHelpContent(this.currentTool.type)
        });
    }
    
    /**
     * Get help content for fill type
     * @param {string} type - Fill type
     * @returns {string} Help content
     */
    getFillHelpContent(type) {
        const helpContent = {
            flood: `
                <h4>Flood Fill</h4>
                <p>Standard flood fill operation that fills all connected pixels of the same color.</p>
                <ul>
                    <li><strong>Left click:</strong> Fill with INK color</li>
                    <li><strong>Right click:</strong> Fill with PAPER color (erase)</li>
                    <li><strong>Limit:</strong> 50,000 pixels for performance</li>
                </ul>
                <p><em>Respects ZX Spectrum 8×8 attribute constraints.</em></p>
            `,
            pattern: `
                <h4>Pattern Fill</h4>
                <p>Fill areas with repeating patterns like dots, lines, checkerboard, etc.</p>
                <ul>
                    <li><strong>Pattern:</strong> Choose from predefined patterns</li>
                    <li><strong>Scale:</strong> Adjust pattern size (0.1x to 5x)</li>
                    <li><strong>Available:</strong> Dots, Lines, Checkerboard, Crosshatch, Grid, Noise</li>
                </ul>
                <p><em>Perfect for ZX Spectrum-style texturing.</em></p>
            `,
            gradient: `
                <h4>Gradient Fill</h4>
                <p>Fill areas with smooth color transitions.</p>
                <ul>
                    <li><strong>Linear:</strong> Straight line gradient</li>
                    <li><strong>Radial:</strong> Circular gradient from center</li>
                    <li><strong>Angular:</strong> Rotational gradient</li>
                    <li><strong>Diamond:</strong> Diamond-shaped gradient</li>
                </ul>
                <p><em>Creates dithering effects on ZX Spectrum hardware.</em></p>
            `,
            fractal: `
                <h4>Fractal Fill</h4>
                <p>Fill with mathematical fractal patterns.</p>
                <ul>
                    <li><strong>Mandelbrot:</strong> Classic fractal set</li>
                    <li><strong>Julia:</strong> Julia set variations</li>
                    <li><strong>Sierpinski:</strong> Triangle fractal</li>
                    <li><strong>Dragon:</strong> Dragon curve</li>
                    <li><strong>Plasma:</strong> Organic plasma effect</li>
                    <li><strong>Perlin:</strong> Natural noise patterns</li>
                </ul>
                <p><em>Iterations and zoom control detail level.</em></p>
            `,
            smart: `
                <h4>Smart Fill</h4>
                <p>Intelligent fill with advanced options.</p>
                <ul>
                    <li><strong>Tolerance:</strong> Fill similar colors (0-1)</li>
                    <li><strong>Edge Aware:</strong> Avoid edge pixels</li>
                    <li><strong>Region Constrained:</strong> Stay within boundaries</li>
                </ul>
                <p><em>Great for complex selections and careful editing.</em></p>
            `,
            texture: `
                <h4>Texture Fill</h4>
                <p>Fill with procedural texture patterns.</p>
                <ul>
                    <li><strong>Brick:</strong> Brick wall pattern</li>
                    <li><strong>Wood:</strong> Wood grain texture</li>
                    <li><strong>Fabric:</strong> Woven fabric pattern</li>
                    <li><strong>Organic:</strong> Natural organic shapes</li>
                </ul>
                <p><em>Scale and rotation controls available.</em></p>
            `
        };
        
        return helpContent[type] || '<p>No help available for this fill type.</p>';
    }
    
    /**
     * Update fill statistics
     */
    updateFillStats() {
        // Track fill usage statistics
        this.eventBus.emit('fill-stats-updated', {
            type: this.currentTool.type,
            timestamp: Date.now()
        });
    }
    
    /**
     * Get current fill tool state
     * @returns {Object} Current tool state
     */
    getCurrentState() {
        return {
            type: this.currentTool.type,
            options: { ...this.currentTool.options },
            enabled: this.currentTool.enabled
        };
    }
    
    /**
     * Get available fill types
     * @returns {Array} Available fill types
     */
    getAvailableFillTypes() {
        return Object.keys(this.fillTypes);
    }
    
    /**
     * Get fill type info
     * @param {string} type - Fill type
     * @returns {Object} Fill type info
     */
    getFillTypeInfo(type) {
        return this.fillTypes[type] || null;
    }
    
    /**
     * Update fill type selector UI to reflect current selection
     */
    updateFillTypeSelector() {
        try {
            const fillTypeSelect = document.querySelector('.fill-type-select');
            if (fillTypeSelect) {
                fillTypeSelect.value = this.currentTool.type;
            }
            
            // Update any fill type buttons
            const fillTypeButtons = document.querySelectorAll('.fill-type-btn');
            fillTypeButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.fillType === this.currentTool.type) {
                    btn.classList.add('active');
                }
            });
            
        } catch (error) {
            console.error('Error updating fill type selector:', error);
        }
    }
    
    /**
     * Get the current fill type
     * @returns {string} Current fill type
     */
    getCurrentFillType() {
        return this.currentTool.type;
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FillToolManager;
} else if (typeof window !== 'undefined') {
    window.FillToolManager = FillToolManager;
}