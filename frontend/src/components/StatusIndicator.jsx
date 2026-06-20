import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const StatusIndicator = ({ 
  isConnected = true, 
  lastSync = null, 
  activeUsers = 0,
  className = '' 
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle')

  useEffect(() => {
    if (lastSync) {
      setSyncStatus('synced')
      const timer = setTimeout(() => setSyncStatus('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [lastSync])

  const getStatusColor = () => {
    if (!isConnected) return 'red'
    if (syncStatus === 'syncing') return 'orange'
    if (syncStatus === 'synced') return 'green'
    return 'blue'
  }

  const getStatusIcon = () => {
    if (!isConnected) return WifiOff
    if (syncStatus === 'syncing') return Clock
    if (syncStatus === 'synced') return CheckCircle
    return Activity
  }

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected'
    if (syncStatus === 'syncing') return 'Syncing...'
    if (syncStatus === 'synced') return 'Synced'
    return 'Connected'
  }

  const StatusIcon = getStatusIcon()
  const statusColor = getStatusColor()

  return (
    <div className={`status-indicator ${className}`}>
      <button
        className={`status-button ${statusColor}`}
        onClick={() => setShowDetails(!showDetails)}
        title={getStatusText()}
      >
        <StatusIcon size={16} />
        <span className="status-text">{getStatusText()}</span>
        {activeUsers > 0 && (
          <span className="user-count">{activeUsers}</span>
        )}
      </button>

      {showDetails && (
        <>
          <div 
            className="status-overlay"
            onClick={() => setShowDetails(false)}
          />
          <div className="status-details">
            <div className="status-header">
              <h4>System Status</h4>
              <button 
                className="close-btn"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="status-items">
              <div className="status-item">
                <div className="status-item-icon">
                  {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                </div>
                <div className="status-item-content">
                  <div className="status-item-title">Connection</div>
                  <div className={`status-item-value ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              </div>

              <div className="status-item">
                <div className="status-item-icon">
                  <Activity size={16} />
                </div>
                <div className="status-item-content">
                  <div className="status-item-title">Active Users</div>
                  <div className="status-item-value">
                    {activeUsers} {activeUsers === 1 ? 'user' : 'users'}
                  </div>
                </div>
              </div>

              {lastSync && (
                <div className="status-item">
                  <div className="status-item-icon">
                    <CheckCircle size={16} />
                  </div>
                  <div className="status-item-content">
                    <div className="status-item-title">Last Sync</div>
                    <div className="status-item-value">
                      {new Date(lastSync).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}

              <div className="status-item">
                <div className="status-item-icon">
                  <AlertCircle size={16} />
                </div>
                <div className="status-item-content">
                  <div className="status-item-title">Health</div>
                  <div className="status-item-value healthy">
                    All systems operational
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx="true">{`
        .status-indicator {
          position: relative;
          z-index: 1000;
        }

        .status-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-full);
          color: var(--theme-text);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.875rem;
          font-weight: 500;
          position: relative;
          overflow: hidden;
        }

        .status-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: currentColor;
          opacity: 0.6;
          transition: all var(--transition-normal);
        }

        .status-button.red {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .status-button.orange {
          color: #f59e0b;
          border-color: rgba(245, 158, 11, 0.3);
        }

        .status-button.green {
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
        }

        .status-button.blue {
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.3);
        }

        .status-button:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .status-text {
          font-weight: 600;
        }

        .user-count {
          background: currentColor;
          color: var(--theme-background);
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          min-width: 20px;
          text-align: center;
        }

        .status-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(4px);
          z-index: 998;
        }

        .status-details {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 280px;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          animation: slideIn 0.2s ease-out;
          z-index: 999;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .status-header h4 {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.1rem;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--theme-textSecondary);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .status-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
        }

        .status-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .status-item-icon {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--theme-primary);
        }

        .status-item-content {
          flex: 1;
          min-width: 0;
        }

        .status-item-title {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .status-item-value {
          color: var(--theme-text);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .status-item-value.connected {
          color: #10b981;
        }

        .status-item-value.disconnected {
          color: #ef4444;
        }

        .status-item-value.healthy {
          color: #10b981;
        }

        @media (max-width: 768px) {
          .status-details {
            right: -1rem;
            left: -1rem;
            min-width: auto;
          }
        }
      `}</style>
    </div>
  )
}

export default StatusIndicator