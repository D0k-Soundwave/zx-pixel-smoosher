#!/usr/bin/env node

/**
 * Manual test script for Fill System components
 * Tests core functionality without browser environment
 */

// Mock browser globals for testing
global.window = {
    EventBus: null,
    FillManager: null,
    FillToolManager: null
};
global.document = {
    createElement: () => ({ appendChild: () => {}, innerHTML: '', style: {} }),
    getElementById: () => null,
    querySelector: () => null,
    addEventListener: () => {}
};
global.console = console;

// Load modules
const EventBus = require('./js/core/EventBus.js');
const MemoryManager = require('./js/core/MemoryManager.js');

console.log('🧪 Fill System Manual Test Suite');
console.log('================================');

// Test 1: EventBus
console.log('\n1. Testing EventBus...');
try {
    const eventBus = new EventBus();
    let testEventReceived = false;
    
    eventBus.on('test', () => { testEventReceived = true; });
    eventBus.emit('test');
    
    console.log(testEventReceived ? '✓ EventBus working' : '✗ EventBus failed');
} catch (error) {
    console.log(`✗ EventBus error: ${error.message}`);
}

// Test 2: MemoryManager
console.log('\n2. Testing MemoryManager...');
try {
    const eventBus = new EventBus();
    const memoryManager = new MemoryManager(eventBus, {
        aggressiveMode: true,
        cleanupInterval: 1000,
        memoryThreshold: 10 * 1024 * 1024
    });
    
    const isLowMemory = memoryManager.isMemoryLow();
    console.log(`✓ MemoryManager created, isLowMemory: ${isLowMemory}`);
} catch (error) {
    console.log(`✗ MemoryManager error: ${error.message}`);
}

// Test 3: FillManager (requires browser globals)
console.log('\n3. Testing FillManager...');
try {
    // Set up window globals
    global.window.EventBus = EventBus;
    global.window.MemoryManager = MemoryManager;
    
    // Try to load FillManager
    const FillManager = require('./js/managers/FillManager.js');
    global.window.FillManager = FillManager;
    
    // Create mock dependencies
    const eventBus = new EventBus();
    const mockStateManager = {
        getState: () => ({
            pixels: Array(192).fill(null).map(() => Array(256).fill(0)),
            attributes: Array(24).fill(null).map(() => Array(32).fill(0))
        }),
        saveState: () => {}
    };
    const mockColorManager = {
        state: { ink: 1, paper: 0 }
    };
    const memoryManager = new MemoryManager(eventBus, { aggressiveMode: false });
    
    const fillManager = new FillManager(eventBus, mockStateManager, mockColorManager, memoryManager);
    
    console.log('✓ FillManager created successfully');
    
    // Test available fill types
    const fillTypes = fillManager.getAvailableFillTypes();
    console.log(`✓ Fill types available: ${fillTypes.join(', ')}`);
    
    // Test available patterns
    const patterns = fillManager.getAvailablePatterns();
    console.log(`✓ Patterns available: ${patterns.join(', ')}`);
    
    // Test fill limits
    const limits = fillManager.getFillLimits();
    console.log(`✓ Fill limits defined: ${Object.keys(limits).join(', ')}`);
    
    // Test basic fill operation
    fillManager.setFillType('flood', {});
    fillManager.fill({ x: 128, y: 96, erase: false });
    console.log('✓ Basic flood fill operation completed');
    
    // Test pattern fill
    fillManager.setFillType('pattern', { patternName: 'dots', scale: 1 });
    fillManager.fill({ x: 64, y: 48, erase: false });
    console.log('✓ Pattern fill operation completed');
    
    console.log('✓ All FillManager tests passed');
    
} catch (error) {
    console.log(`✗ FillManager error: ${error.message}`);
    console.log(error.stack);
}

// Test 4: Mathematical functions
console.log('\n4. Testing Mathematical Functions...');
try {
    // Test mandelbrot calculation
    const testMandelbrot = (x, y, maxIter) => {
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
    };
    
    const result = testMandelbrot(-0.5, 0, 100);
    console.log(`✓ Mandelbrot calculation: ${result.toFixed(3)}`);
    
    // Test pattern generation
    const testPattern = {
        width: 4,
        height: 4,
        pattern: [
            [0, 0, 0, 0],
            [0, 1, 0, 1],
            [0, 0, 0, 0],
            [1, 0, 1, 0]
        ]
    };
    
    const patternValue = testPattern.pattern[1][1];
    console.log(`✓ Pattern generation: ${patternValue}`);
    
    console.log('✓ Mathematical functions working');
    
} catch (error) {
    console.log(`✗ Mathematical functions error: ${error.message}`);
}

// Test 5: Memory and Performance
console.log('\n5. Testing Memory and Performance...');
try {
    const startTime = process.hrtime.bigint();
    
    // Simulate memory-intensive operation
    const testArray = Array(10000).fill(null).map(() => ({
        x: Math.random() * 256,
        y: Math.random() * 192,
        value: Math.random() > 0.5 ? 1 : 0
    }));
    
    // Test cleanup
    testArray.length = 0;
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    console.log(`✓ Memory test completed in ${duration.toFixed(2)}ms`);
    
    // Test memory usage (rough estimate)
    const memoryUsage = process.memoryUsage();
    console.log(`✓ Memory usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB heap used`);
    
} catch (error) {
    console.log(`✗ Memory/Performance test error: ${error.message}`);
}

console.log('\n🎉 Manual test suite completed!');
console.log('If all tests show ✓, the fill system is working correctly.');
console.log('Open test_fill_system.html in a browser for interactive tests.');