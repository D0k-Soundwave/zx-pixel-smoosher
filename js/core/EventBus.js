/**
 * Event bus for decoupled component communication
 * @class EventBus
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            // Create snapshot of listeners to avoid race conditions
            const callbacks = Array.from(this.listeners.get(event));
            callbacks.forEach(callback => {
                try {
                    // Use setTimeout for async safety on critical events
                    if (['state-changed', 'canvas-updated', 'memory-warning'].includes(event)) {
                        setTimeout(() => {
                            try {
                                callback(data);
                            } catch (error) {
                                console.error(`Async error in event handler for ${event}:`, error);
                            }
                        }, 0);
                    } else {
                        callback(data);
                    }
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Clear all event listeners
     */
    clear() {
        this.listeners.clear();
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
} else if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
}