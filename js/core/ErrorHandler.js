/**
 * Comprehensive error handling service
 * @class ErrorHandler
 */
class ErrorHandler {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.errorCache = new Map();
        this.setupGlobalHandlers();
    }

    /**
     * Set up global error handlers
     */
    setupGlobalHandlers() {
        this.errorHandler = (e) => this.handleCriticalError('JavaScript Error', e.error);
        this.rejectionHandler = (e) => this.handleCriticalError('Promise Rejection', e.reason);
        
        window.addEventListener('error', this.errorHandler);
        window.addEventListener('unhandledrejection', this.rejectionHandler);
    }

    /**
     * Handle standard errors
     * @param {string} title - Error title
     * @param {Error} error - Error object
     * @param {boolean} critical - Whether error is critical
     */
    handleError(title, error, critical = false) {
        console.error(`${title}:`, error);
        
        const errorData = {
            title,
            message: this.getUserFriendlyMessage(error),
            critical,
            timestamp: Date.now()
        };

        if (critical) {
            this.handleCriticalError(title, error);
        } else {
            this.eventBus.emit('error', errorData);
            this.eventBus.emit('status', { message: `⚠ ${title}`, type: 'warning' });
        }
    }

    /**
     * Handle critical errors
     * @param {string} title - Error title
     * @param {Error} error - Error object
     */
    handleCriticalError(title, error) {
        console.error(`CRITICAL ${title}:`, error);
        
        this.eventBus.emit('emergency-save');
        
        const errorData = {
            title: `Critical Error: ${title}`,
            message: `${this.getUserFriendlyMessage(error)}\n\nWork emergency saved.`,
            critical: true,
            timestamp: Date.now()
        };

        this.eventBus.emit('error', errorData);
        this.eventBus.emit('status', { message: `⚠ Critical Error: ${title}`, type: 'error' });
    }

    /**
     * Get user-friendly error message
     * @param {Error} error - Error object
     * @returns {string} User-friendly message
     */
    getUserFriendlyMessage(error) {
        const message = error.message || error.toString();
        const messageMap = {
            'Out of memory': 'Low memory. Close other apps.',
            'File too large': 'File too large. Use smaller file.',
            'Invalid file': 'File format not supported or corrupted.',
            'Canvas not available': 'Browser graphics not supported.'
        };

        for (const [key, value] of Object.entries(messageMap)) {
            if (message.includes(key)) return value;
        }

        return 'Unexpected error. Try refreshing page.';
    }

    /**
     * Safe execution wrapper
     * @param {Function} fn - Function to execute safely
     * @returns {*} Function result or null on error
     */
    safe(fn) {
        try {
            return fn();
        } catch (error) {
            this.handleError('Operation Failed', error);
            return null;
        }
    }

    /**
     * Cleanup error handlers
     */
    destroy() {
        window.removeEventListener('error', this.errorHandler);
        window.removeEventListener('unhandledrejection', this.rejectionHandler);
        this.errorCache.clear();
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}