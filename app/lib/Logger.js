/**
 * Logger.js
 * Ported from Ghost Team Strategy (Python -> JS)
 * Provides centralized logging with levels and timestamps.
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

class Logger {
    constructor(serviceName) {
        this.serviceName = serviceName;
        this.level = LOG_LEVELS.INFO;
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        return JSON.stringify({
            timestamp,
            service: this.serviceName,
            level,
            message,
            ...meta
        });
    }

    debug(message, meta) {
        if (this.level <= LOG_LEVELS.DEBUG) {
            console.debug(this.formatMessage('DEBUG', message, meta));
        }
    }

    info(message, meta) {
        if (this.level <= LOG_LEVELS.INFO) {
            console.info(this.formatMessage('INFO', message, meta));
        }
    }

    warn(message, meta) {
        if (this.level <= LOG_LEVELS.WARN) {
            console.warn(this.formatMessage('WARN', message, meta));
        }
    }

    error(message, error) {
        if (this.level <= LOG_LEVELS.ERROR) {
            console.error(this.formatMessage('ERROR', message, { error: error?.message, stack: error?.stack }));
        }
    }
}

export const logger = new Logger('MotoAsistan-Core');
