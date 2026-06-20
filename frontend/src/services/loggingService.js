/**
 * Advanced Logging Service
 * Provides structured logging with multiple levels, filtering, and remote reporting
 */

class LoggingService {
    constructor() {
        this.logs = []
        this.maxLogs = 1000
        this.logLevel = this.getLogLevel()
        this.remoteEndpoint = null
        this.batchSize = 10
        this.batchTimeout = 5000
        this.pendingLogs = []
        this.loggers = new Map()
        this.filters = []
        this.formatters = new Map()

        this.setupDefaultFormatters()
        this.startBatchProcessor()
    }

    // Log levels
    static LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        TRACE: 4
    }

    getLogLevel() {
        const envLevel = process.env.REACT_APP_LOG_LEVEL || 'INFO'
        return LoggingService.LEVELS[envLevel.toUpperCase()] || LoggingService.LEVELS.INFO
    }

    // Core logging methods
    error(message, meta = {}) {
        this.log('ERROR', message, meta)
    }

    warn(message, meta = {}) {
        this.log('WARN', message, meta)
    }

    info(message, meta = {}) {
        this.log('INFO', message, meta)
    }

    debug(message, meta = {}) {
        this.log('DEBUG', message, meta)
    }

    trace(message, meta = {}) {
        this.log('TRACE', message, meta)
    }

    log(level, message, meta = {}) {
        const levelValue = LoggingService.LEVELS[level]

        if (levelValue > this.logLevel) {
            return // Skip if below current log level
        }

        const logEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            level,
            message,
            meta: this.sanitizeMeta(meta),
            source: this.getSource(),
            sessionId: this.getSessionId(),
            userId: this.getUserId(),
            url: window.location.href,
            userAgent: navigator.userAgent
        }

        // Apply filters
        if (!this.shouldLog(logEntry)) {
            return
        }

        // Store locally
        this.addToLocalStorage(logEntry)

        // Add to memory
        this.logs.push(logEntry)
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs)
        }

        // Console output
        this.outputToConsole(logEntry)

        // Queue for remote logging
        if (this.remoteEndpoint) {
            this.queueForRemote(logEntry)
        }

        // Notify subscribers
        this.notifyLoggers(logEntry)
    }

    // Performance logging
    logPerformance(operation, duration, meta = {}) {
        this.log('INFO', `Performance: ${operation}`, {
            ...meta,
            type: 'performance',
            operation,
            duration,
            timestamp: Date.now()
        })
    }

    // User action logging
    logUserAction(action, target, meta = {}) {
        this.log('INFO', `User Action: ${action}`, {
            ...meta,
            type: 'user_action',
            action,
            target,
            timestamp: Date.now()
        })
    }

    // API call logging
    logApiCall(method, url, status, duration, meta = {}) {
        const level = status >= 400 ? 'ERROR' : 'INFO'
        this.log(level, `API Call: ${method} ${url}`, {
            ...meta,
            type: 'api_call',
            method,
            url,
            status,
            duration,
            timestamp: Date.now()
        })
    }

    // Error logging with stack trace
    logError(error, context = {}) {
        this.log('ERROR', error.message, {
            ...context,
            type: 'error',
            stack: error.stack,
            name: error.name,
            timestamp: Date.now()
        })
    }

    // Component lifecycle logging
    logComponentLifecycle(componentName, lifecycle, props = {}) {
        this.log('DEBUG', `Component ${lifecycle}: ${componentName}`, {
            type: 'component_lifecycle',
            componentName,
            lifecycle,
            props: this.sanitizeProps(props),
            timestamp: Date.now()
        })
    }

    // State change logging
    logStateChange(component, oldState, newState, action = null) {
        this.log('DEBUG', `State Change: ${component}`, {
            type: 'state_change',
            component,
            oldState: this.sanitizeState(oldState),
            newState: this.sanitizeState(newState),
            action,
            timestamp: Date.now()
        })
    }

    // Navigation logging
    logNavigation(from, to, method = 'unknown') {
        this.log('INFO', `Navigation: ${from} -> ${to}`, {
            type: 'navigation',
            from,
            to,
            method,
            timestamp: Date.now()
        })
    }

    // Feature usage logging
    logFeatureUsage(feature, action, meta = {}) {
        this.log('INFO', `Feature Usage: ${feature} - ${action}`, {
            ...meta,
            type: 'feature_usage',
            feature,
            action,
            timestamp: Date.now()
        })
    }

    // Utility methods
    generateId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    getSource() {
        const stack = new Error().stack
        const lines = stack.split('\n')
        // Find the first line that's not from this logging service
        for (let i = 3; i < lines.length; i++) {
            const line = lines[i]
            if (line && !line.includes('loggingService') && !line.includes('LoggingService')) {
                const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/)
                if (match) {
                    return {
                        function: match[1],
                        file: match[2],
                        line: parseInt(match[3]),
                        column: parseInt(match[4])
                    }
                }
            }
        }
        return { function: 'unknown', file: 'unknown', line: 0, column: 0 }
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('log_session_id')
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            sessionStorage.setItem('log_session_id', sessionId)
        }
        return sessionId
    }

    getUserId() {
        return localStorage.getItem('user_session_id') || 'anonymous'
    }

    sanitizeMeta(meta) {
        // Remove sensitive information
        const sanitized = { ...meta }
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth']

        const sanitizeObject = (obj) => {
            if (typeof obj !== 'object' || obj === null) return obj

            const result = {}
            for (const [key, value] of Object.entries(obj)) {
                if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                    result[key] = '[REDACTED]'
                } else if (typeof value === 'object') {
                    result[key] = sanitizeObject(value)
                } else {
                    result[key] = value
                }
            }
            return result
        }

        return sanitizeObject(sanitized)
    }

    sanitizeProps(props) {
        // Limit prop size and remove functions
        const sanitized = {}
        for (const [key, value] of Object.entries(props)) {
            if (typeof value === 'function') {
                sanitized[key] = '[Function]'
            } else if (typeof value === 'object' && value !== null) {
                const str = JSON.stringify(value)
                sanitized[key] = str.length > 1000 ? '[Large Object]' : value
            } else {
                sanitized[key] = value
            }
        }
        return sanitized
    }

    sanitizeState(state) {
        if (typeof state !== 'object' || state === null) return state

        const str = JSON.stringify(state)
        return str.length > 2000 ? '[Large State Object]' : state
    }

    shouldLog(logEntry) {
        return this.filters.every(filter => filter(logEntry))
    }

    addFilter(filterFn) {
        this.filters.push(filterFn)
        return () => {
            const index = this.filters.indexOf(filterFn)
            if (index > -1) {
                this.filters.splice(index, 1)
            }
        }
    }

    // Console output
    outputToConsole(logEntry) {
        const formatter = this.formatters.get('console') || this.formatters.get('default')
        const formatted = formatter(logEntry)

        switch (logEntry.level) {
            case 'ERROR':
                console.error(formatted)
                break
            case 'WARN':
                console.warn(formatted)
                break
            case 'DEBUG':
                console.debug(formatted)
                break
            case 'TRACE':
                console.trace(formatted)
                break
            default:
                console.log(formatted)
        }
    }

    setupDefaultFormatters() {
        // Console formatter
        this.formatters.set('console', (logEntry) => {
            const { timestamp, level, message, meta } = logEntry
            const time = new Date(timestamp).toLocaleTimeString()
            return `[${time}] ${level}: ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`
        })

        // JSON formatter
        this.formatters.set('json', (logEntry) => {
            return JSON.stringify(logEntry)
        })

        // Structured formatter
        this.formatters.set('structured', (logEntry) => {
            return {
                '@timestamp': logEntry.timestamp,
                level: logEntry.level.toLowerCase(),
                message: logEntry.message,
                fields: logEntry.meta,
                source: logEntry.source,
                session_id: logEntry.sessionId,
                user_id: logEntry.userId
            }
        })

        this.formatters.set('default', this.formatters.get('console'))
    }

    addFormatter(name, formatter) {
        this.formatters.set(name, formatter)
    }

    // Local storage
    addToLocalStorage(logEntry) {
        try {
            const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
            logs.push(logEntry)

            // Keep only last 100 logs in localStorage
            const trimmedLogs = logs.slice(-100)
            localStorage.setItem('app_logs', JSON.stringify(trimmedLogs))
        } catch (error) {
            console.error('Failed to store log in localStorage:', error)
        }
    }

    // Remote logging
    setRemoteEndpoint(endpoint) {
        this.remoteEndpoint = endpoint
    }

    queueForRemote(logEntry) {
        this.pendingLogs.push(logEntry)
    }

    startBatchProcessor() {
        setInterval(() => {
            if (this.pendingLogs.length >= this.batchSize) {
                this.sendBatch()
            }
        }, this.batchTimeout)

        // Send remaining logs on page unload
        window.addEventListener('beforeunload', () => {
            if (this.pendingLogs.length > 0) {
                this.sendBatch(true)
            }
        })
    }

    async sendBatch(sync = false) {
        if (this.pendingLogs.length === 0 || !this.remoteEndpoint) return

        const batch = this.pendingLogs.splice(0, this.batchSize)
        const payload = {
            logs: batch,
            metadata: {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            }
        }

        try {
            if (sync && navigator.sendBeacon) {
                // Use sendBeacon for synchronous sending on page unload
                navigator.sendBeacon(this.remoteEndpoint, JSON.stringify(payload))
            } else {
                await fetch(this.remoteEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
            }
        } catch (error) {
            console.error('Failed to send log batch:', error)
            // Re-queue failed logs
            this.pendingLogs.unshift(...batch)
        }
    }

    // Logger subscription
    subscribe(callback) {
        const id = this.generateId()
        this.loggers.set(id, callback)

        return () => {
            this.loggers.delete(id)
        }
    }

    notifyLoggers(logEntry) {
        this.loggers.forEach(callback => {
            try {
                callback(logEntry)
            } catch (error) {
                console.error('Error in log subscriber:', error)
            }
        })
    }

    // Query methods
    getLogs(filters = {}) {
        let filtered = [...this.logs]

        if (filters.level) {
            const levelValue = LoggingService.LEVELS[filters.level]
            filtered = filtered.filter(log => LoggingService.LEVELS[log.level] <= levelValue)
        }

        if (filters.type) {
            filtered = filtered.filter(log => log.meta.type === filters.type)
        }

        if (filters.component) {
            filtered = filtered.filter(log =>
                log.meta.component === filters.component ||
                log.meta.componentName === filters.component
            )
        }

        if (filters.since) {
            const since = new Date(filters.since)
            filtered = filtered.filter(log => new Date(log.timestamp) >= since)
        }

        if (filters.search) {
            const search = filters.search.toLowerCase()
            filtered = filtered.filter(log =>
                log.message.toLowerCase().includes(search) ||
                JSON.stringify(log.meta).toLowerCase().includes(search)
            )
        }

        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }

    // Statistics
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            byType: {},
            recentErrors: 0,
            avgLogsPerMinute: 0
        }

        // Count by level
        Object.keys(LoggingService.LEVELS).forEach(level => {
            stats.byLevel[level] = this.logs.filter(log => log.level === level).length
        })

        // Count by type
        this.logs.forEach(log => {
            const type = log.meta.type || 'general'
            stats.byType[type] = (stats.byType[type] || 0) + 1
        })

        // Recent errors (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        stats.recentErrors = this.logs.filter(log =>
            log.level === 'ERROR' && new Date(log.timestamp) >= fiveMinutesAgo
        ).length

        // Average logs per minute (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const recentLogs = this.logs.filter(log => new Date(log.timestamp) >= oneHourAgo)
        stats.avgLogsPerMinute = Math.round(recentLogs.length / 60 * 100) / 100

        return stats
    }

    // Export logs
    exportLogs(format = 'json') {
        const formatter = this.formatters.get(format) || this.formatters.get('json')

        if (format === 'json') {
            return JSON.stringify(this.logs, null, 2)
        } else if (format === 'csv') {
            return this.exportToCsv()
        } else {
            return this.logs.map(formatter).join('\n')
        }
    }

    exportToCsv() {
        const headers = ['timestamp', 'level', 'message', 'type', 'component', 'source']
        const rows = this.logs.map(log => [
            log.timestamp,
            log.level,
            log.message,
            log.meta.type || '',
            log.meta.component || log.meta.componentName || '',
            `${log.source.function}:${log.source.line}`
        ])

        return [headers, ...rows].map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n')
    }

    // Clear logs
    clear() {
        this.logs = []
        localStorage.removeItem('app_logs')
    }
}

// Create singleton instance
const loggingService = new LoggingService()

// React hook for logging
export const useLogging = (component) => {
    const logger = {
        error: (message, meta = {}) => loggingService.error(message, { ...meta, component }),
        warn: (message, meta = {}) => loggingService.warn(message, { ...meta, component }),
        info: (message, meta = {}) => loggingService.info(message, { ...meta, component }),
        debug: (message, meta = {}) => loggingService.debug(message, { ...meta, component }),
        trace: (message, meta = {}) => loggingService.trace(message, { ...meta, component }),

        logPerformance: (operation, duration, meta = {}) =>
            loggingService.logPerformance(operation, duration, { ...meta, component }),

        logUserAction: (action, target, meta = {}) =>
            loggingService.logUserAction(action, target, { ...meta, component }),

        logError: (error, context = {}) =>
            loggingService.logError(error, { ...context, component }),

        logLifecycle: (lifecycle, props = {}) =>
            loggingService.logComponentLifecycle(component, lifecycle, props),

        logStateChange: (oldState, newState, action = null) =>
            loggingService.logStateChange(component, oldState, newState, action),

        logFeatureUsage: (feature, action, meta = {}) =>
            loggingService.logFeatureUsage(feature, action, { ...meta, component })
    }

    return logger
}

export default loggingService
export { LoggingService }