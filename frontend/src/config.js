// Frontend Configuration
// This file contains all configurable values for the frontend application

const isDevelopment = import.meta.env.DEV

export const config = {
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },

  // WebSocket Configuration
  websocket: {
    getURL: () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const hostname = import.meta.env.VITE_WS_HOSTNAME || window.location.hostname
      const port = import.meta.env.VITE_WS_PORT || 
                   (window.location.port === '3000' ? '5000' : window.location.port)
      return `${protocol}//${hostname}:${port}/ws`
    },
    reconnectAttempts: parseInt(import.meta.env.VITE_WS_RECONNECT_ATTEMPTS) || 5,
    reconnectDelay: parseInt(import.meta.env.VITE_WS_RECONNECT_DELAY) || 1000,
    heartbeatInterval: parseInt(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL) || 30000,
  },

  // Application Settings
  app: {
    title: import.meta.env.VITE_APP_TITLE || 'NextGen Organization Visualizer',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.VITE_APP_ENV || (isDevelopment ? 'development' : 'production'),
    debugMode: import.meta.env.VITE_DEBUG === 'true' || isDevelopment,
  },

  // Data Sync Configuration
  sync: {
    autoSyncInterval: parseInt(import.meta.env.VITE_SYNC_INTERVAL) || 300000, // 5 minutes
    enableAutoSync: import.meta.env.VITE_ENABLE_AUTO_SYNC !== 'false',
    maxRetries: parseInt(import.meta.env.VITE_SYNC_MAX_RETRIES) || 3,
  },

  // Performance Monitoring
  performance: {
    enableMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING !== 'false',
    sampleRate: parseFloat(import.meta.env.VITE_PERFORMANCE_SAMPLE_RATE) || 0.1,
    reportInterval: parseInt(import.meta.env.VITE_PERFORMANCE_REPORT_INTERVAL) || 60000,
  },

  // Theme Configuration
  theme: {
    defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'dark',
    availableThemes: ['dark', 'light', 'cyberpunk', 'ocean', 'forest'],
  },

  // Feature Flags
  features: {
    enableCollaboration: import.meta.env.VITE_ENABLE_COLLABORATION !== 'false',
    enableRealTimeSync: import.meta.env.VITE_ENABLE_REALTIME_SYNC !== 'false',
    enableAdvancedAnalytics: import.meta.env.VITE_ENABLE_ADVANCED_ANALYTICS !== 'false',
    enableExportFeatures: import.meta.env.VITE_ENABLE_EXPORT_FEATURES !== 'false',
  },

  // Security Configuration
  security: {
    enableCSP: import.meta.env.VITE_ENABLE_CSP !== 'false',
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000, // 1 hour
  },

  // Logging Configuration
  logging: {
    level: import.meta.env.VITE_LOG_LEVEL || (isDevelopment ? 'debug' : 'warn'),
    enableRemoteLogging: import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true',
    remoteLogEndpoint: import.meta.env.VITE_REMOTE_LOG_ENDPOINT,
  },

  // Analytics Configuration
  analytics: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    trackingId: import.meta.env.VITE_ANALYTICS_TRACKING_ID,
  },

  // Development Settings
  development: {
    enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true' || isDevelopment,
    enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS !== 'false' && isDevelopment,
    mockDelay: parseInt(import.meta.env.VITE_MOCK_DELAY) || 1000,
  }
}

// Environment validation
const validateConfig = () => {
  const requiredEnvVars = []
  
  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName])
  
  if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars)
  }

  if (config.app.debugMode) {
    console.log('Application Configuration:', config)
  }
}

// Validate configuration on load
validateConfig()

export default config