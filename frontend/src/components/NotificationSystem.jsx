import React, { createContext, useContext, useState, useCallback } from 'react'
import { Check, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addNotification({ ...options, type: 'success', message })
  }, [addNotification])

  const error = useCallback((message, options = {}) => {
    return addNotification({ ...options, type: 'error', message, duration: 8000 })
  }, [addNotification])

  const warning = useCallback((message, options = {}) => {
    return addNotification({ ...options, type: 'warning', message })
  }, [addNotification])

  const info = useCallback((message, options = {}) => {
    return addNotification({ ...options, type: 'info', message })
  }, [addNotification])

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}

      <style jsx="true">{`
        .notification-container {
          position: fixed;
          bottom: 1.5rem;
          right: 2rem;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 400px;
          width: 100%;
        }

        @media (max-width: 768px) {
          .notification-container {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            max-width: none;
          }
        }
      `}</style>
    </div>
  )
}

const Notification = ({ notification, onRemove }) => {
  const { type, message, title, action } = notification

  const icons = {
    success: Check,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const Icon = icons[type]

  const typeStyles = {
    success: {
      background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      iconColor: '#10b981'
    },
    error: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      iconColor: '#ef4444'
    },
    warning: {
      background: 'rgba(245, 158, 11, 0.1)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      iconColor: '#f59e0b'
    },
    info: {
      background: 'rgba(59, 130, 246, 0.1)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      iconColor: '#3b82f6'
    }
  }

  const style = typeStyles[type]

  return (
    <div
      className="notification"
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="notification-content">
        <div className="notification-icon">
          <Icon size={20} />
        </div>
        
        <div className="notification-text">
          {title && <div className="notification-title">{title}</div>}
          <div className="notification-message">{message}</div>
        </div>

        {action && (
          <button 
            className="notification-action"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>

      <button 
        className="notification-close"
        onClick={onRemove}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>

      <div className="notification-progress"></div>

      <style jsx="true">{`
        .notification {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: ${style.border};
          border-radius: var(--radius-xl);
          padding: 1rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
          animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          transition: all var(--transition-normal);
        }

        .notification:hover {
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .notification-content {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding-right: 2rem;
        }

        .notification-icon {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${style.background};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${style.iconColor};
        }

        .notification-text {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-weight: 600;
          color: var(--theme-text);
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }

        .notification-message {
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .notification-action {
          background: ${style.iconColor};
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          margin-top: 0.5rem;
        }

        .notification-action:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .notification-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: none;
          border: none;
          color: var(--theme-textSecondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .notification-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: ${style.iconColor};
          animation: progress ${notification.duration}ms linear;
          border-radius: 0 0 var(--radius-xl) var(--radius-xl);
        }

        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

export default NotificationProvider
export { NotificationProvider }
