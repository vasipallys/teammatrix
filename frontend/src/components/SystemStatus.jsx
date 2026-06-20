import React, { useState, useEffect } from 'react'
import {
  Activity,
  Users,
  Database,
  Wifi,
  Server,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react'
import integrationService from '../services/integrationService'
import { useNotifications } from './NotificationSystem'

const SystemStatus = ({ isOpen, onClose, className = '' }) => {
  const [systemHealth, setSystemHealth] = useState('healthy')
  const [activeUsers, setActiveUsers] = useState([])
  const [performanceMetrics, setPerformanceMetrics] = useState({})
  const [services, setServices] = useState([
    { name: 'API Gateway', status: 'healthy', uptime: '99.9%', responseTime: '120ms' },
    { name: 'Database', status: 'healthy', uptime: '99.8%', responseTime: '45ms' },
    { name: 'WebSocket', status: 'healthy', uptime: '99.7%', responseTime: '25ms' },
    { name: 'Analytics Engine', status: 'healthy', uptime: '99.5%', responseTime: '200ms' },
    { name: 'Export Service', status: 'warning', uptime: '98.2%', responseTime: '350ms' },
    { name: 'Collaboration Hub', status: 'healthy', uptime: '99.9%', responseTime: '80ms' }
  ])
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const { info, warning, error } = useNotifications()

  useEffect(() => {
    if (!isOpen) return

    const unsubscribers = [
      integrationService.subscribe('system:health_updated', (data) => {
        setSystemHealth(data.status)
        setLastUpdated(new Date())
      }),
      
      integrationService.subscribe('users:updated', (users) => {
        setActiveUsers(users)
      }),
      
      integrationService.subscribe('performance:updated', (metrics) => {
        setPerformanceMetrics(metrics)
      }),
      
      integrationService.subscribe('performance:warning', (warning) => {
        if (warning.type === 'low_fps') {
          warning(`Low FPS detected: ${warning.value}`)
        } else if (warning.type === 'high_memory') {
          warning(`High memory usage: ${warning.value}%`)
        }
      })
    ]

    // Simulate service status updates
    const interval = setInterval(() => {
      setServices(prev => prev.map(service => ({
        ...service,
        responseTime: `${Math.floor(Math.random() * 200 + 50)}ms`,
        status: Math.random() > 0.9 ? 'warning' : 'healthy'
      })))
      setLastUpdated(new Date())
    }, 10000)

    return () => {
      unsubscribers.forEach(unsub => unsub())
      clearInterval(interval)
    }
  }, [isOpen])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={16} className="status-healthy" />
      case 'warning':
        return <AlertTriangle size={16} className="status-warning" />
      case 'error':
        return <XCircle size={16} className="status-error" />
      default:
        return <Minus size={16} className="status-unknown" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getTrendIcon = (value, threshold) => {
    if (value > threshold * 1.1) return <TrendingUp size={14} className="trend-up" />
    if (value < threshold * 0.9) return <TrendingDown size={14} className="trend-down" />
    return <Minus size={14} className="trend-stable" />
  }

  const refreshStatus = () => {
    info('Refreshing system status...')
    setLastUpdated(new Date())
    
    // Simulate refresh
    setTimeout(() => {
      integrationService.updateSystemHealth('healthy', {
        uptime: '99.9%',
        lastBackup: new Date(Date.now() - 3600000),
        activeConnections: Math.floor(Math.random() * 20 + 5)
      })
      info('System status refreshed')
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div className={`system-status ${className}`}>
      <div className="status-overlay" onClick={onClose} />
      
      <div className="status-panel">
        <div className="panel-header">
          <div className="header-title">
            <Activity size={24} />
            <h2>System Status</h2>
            <div className={`overall-status status-${systemHealth}`}>
              {getStatusIcon(systemHealth)}
              <span>{systemHealth.toUpperCase()}</span>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="refresh-btn" onClick={refreshStatus}>
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="status-content">
          <div className="status-grid">
            {/* System Overview */}
            <div className="status-card overview-card">
              <div className="card-header">
                <Server size={20} />
                <h3>System Overview</h3>
              </div>
              <div className="overview-stats">
                <div className="stat-item">
                  <div className="stat-label">Uptime</div>
                  <div className="stat-value">99.9%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Active Users</div>
                  <div className="stat-value">{activeUsers.length}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Total Requests</div>
                  <div className="stat-value">1.2M</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Avg Response</div>
                  <div className="stat-value">145ms</div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="status-card performance-card">
              <div className="card-header">
                <Zap size={20} />
                <h3>Performance</h3>
              </div>
              <div className="performance-metrics">
                <div className="metric-item">
                  <div className="metric-header">
                    <span>FPS</span>
                    {getTrendIcon(performanceMetrics.fps || 60, 60)}
                  </div>
                  <div className="metric-value">{performanceMetrics.fps || 60}</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ 
                        width: `${Math.min((performanceMetrics.fps || 60) / 60 * 100, 100)}%`,
                        backgroundColor: (performanceMetrics.fps || 60) > 30 ? '#10b981' : '#ef4444'
                      }}
                    />
                  </div>
                </div>

                <div className="metric-item">
                  <div className="metric-header">
                    <span>Memory</span>
                    {getTrendIcon(performanceMetrics.memoryUsage || 45, 50)}
                  </div>
                  <div className="metric-value">{performanceMetrics.memoryUsage || 45}%</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ 
                        width: `${performanceMetrics.memoryUsage || 45}%`,
                        backgroundColor: (performanceMetrics.memoryUsage || 45) < 80 ? '#10b981' : '#ef4444'
                      }}
                    />
                  </div>
                </div>

                <div className="metric-item">
                  <div className="metric-header">
                    <span>Load Time</span>
                    {getTrendIcon(performanceMetrics.loadTime || 1200, 1000)}
                  </div>
                  <div className="metric-value">{performanceMetrics.loadTime || 1200}ms</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ 
                        width: `${Math.min((2000 - (performanceMetrics.loadTime || 1200)) / 2000 * 100, 100)}%`,
                        backgroundColor: (performanceMetrics.loadTime || 1200) < 2000 ? '#10b981' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="status-card users-card">
              <div className="card-header">
                <Users size={20} />
                <h3>Active Users ({activeUsers.length})</h3>
              </div>
              <div className="users-list">
                {activeUsers.slice(0, 5).map(user => (
                  <div key={user.id} className="user-item">
                    <div className="user-avatar">{user.avatar}</div>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-role">{user.role}</div>
                    </div>
                    <div className={`user-status status-${user.status}`}>
                      <div className="status-dot" />
                    </div>
                  </div>
                ))}
                {activeUsers.length > 5 && (
                  <div className="more-users">
                    +{activeUsers.length - 5} more users
                  </div>
                )}
              </div>
            </div>

            {/* Services Status */}
            <div className="status-card services-card">
              <div className="card-header">
                <Database size={20} />
                <h3>Services</h3>
              </div>
              <div className="services-list">
                {services.map((service, index) => (
                  <div key={index} className="service-item">
                    <div className="service-info">
                      <div className="service-name">
                        {getStatusIcon(service.status)}
                        {service.name}
                      </div>
                      <div className="service-metrics">
                        <span className="uptime">↑ {service.uptime}</span>
                        <span className="response-time">⚡ {service.responseTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="status-footer">
          <div className="footer-info">
            <Wifi size={14} />
            <span>Connected</span>
            <span className="separator">•</span>
            <Clock size={14} />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .system-status {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .status-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
        }

        .status-panel {
          position: relative;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-title h2 {
          color: var(--theme-text);
          font-family: var(--font-display);
          margin: 0;
          font-size: 1.5rem;
        }

        .overall-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .overall-status.status-healthy {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .overall-status.status-warning {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .overall-status.status-error {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--radius-lg);
          color: #3b82f6;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .refresh-btn:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--theme-textSecondary);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .status-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .status-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          transition: all var(--transition-normal);
        }

        .status-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          color: var(--theme-text);
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .overview-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .stat-item {
          text-align: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg);
        }

        .stat-label {
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          color: var(--theme-text);
          font-size: 1.5rem;
          font-weight: 700;
        }

        .performance-metrics {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .metric-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
        }

        .metric-value {
          color: var(--theme-text);
          font-size: 1.25rem;
          font-weight: 600;
        }

        .metric-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .metric-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: all var(--transition-normal);
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .user-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          color: var(--theme-text);
          font-weight: 500;
          font-size: 0.875rem;
        }

        .user-role {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          text-transform: capitalize;
        }

        .user-status {
          display: flex;
          align-items: center;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .user-status.status-online .status-dot {
          background: #10b981;
        }

        .user-status.status-away .status-dot {
          background: #f59e0b;
        }

        .user-status.status-offline .status-dot {
          background: #6b7280;
        }

        .more-users {
          text-align: center;
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
          padding: 0.5rem;
        }

        .services-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .service-item {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg);
        }

        .service-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .service-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--theme-text);
          font-weight: 500;
        }

        .service-metrics {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--theme-textSecondary);
        }

        .status-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1.5rem 2rem;
          border-top: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .footer-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
        }

        .separator {
          opacity: 0.5;
        }

        .status-healthy { color: #10b981; }
        .status-warning { color: #f59e0b; }
        .status-error { color: #ef4444; }
        .status-unknown { color: #6b7280; }

        .trend-up { color: #ef4444; }
        .trend-down { color: #10b981; }
        .trend-stable { color: #6b7280; }

        @media (max-width: 768px) {
          .system-status {
            padding: 1rem;
          }

          .status-grid {
            grid-template-columns: 1fr;
          }

          .overview-stats {
            grid-template-columns: 1fr;
          }

          .panel-header {
            padding: 1.5rem;
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .header-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default SystemStatus