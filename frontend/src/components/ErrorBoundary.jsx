import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorId: Date.now().toString(36)
    }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service
    this.logError(error, errorInfo)
  }

  logError = (error, errorInfo) => {
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId()
    }

    // Send to error tracking service
    this.sendErrorReport(errorReport)
  }

  sendErrorReport = async (errorReport) => {
    try {
      // In a real app, send to error tracking service like Sentry
      console.error('Error Report:', errorReport)
      
      // Store locally for debugging
      const errors = JSON.parse(localStorage.getItem('errorReports') || '[]')
      errors.push(errorReport)
      localStorage.setItem('errorReports', JSON.stringify(errors.slice(-10)))
      
    } catch (e) {
      console.error('Failed to send error report:', e)
    }
  }

  getUserId = () => {
    return localStorage.getItem('user_session_id') || 'anonymous'
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state
      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">
              <AlertTriangle size={64} />
            </div>
            
            <div className="error-content">
              <h1>Oops! Something went wrong</h1>
              <p className="error-message">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              
              <div className="error-id">
                Error ID: <code>{this.state.errorId}</code>
              </div>
              
              <div className="error-actions">
                <button className="btn-primary" onClick={this.handleRetry}>
                  <RefreshCw size={16} />
                  Try Again
                </button>
                
                <button className="btn-secondary" onClick={this.handleReload}>
                  <RefreshCw size={16} />
                  Reload Page
                </button>
                
                <button className="btn-secondary" onClick={this.handleGoHome}>
                  <Home size={16} />
                  Go Home
                </button>
              </div>
              
              {isDevelopment && (
                <details className="error-details">
                  <summary>
                    <Bug size={16} />
                    Technical Details (Development)
                  </summary>
                  
                  <div className="error-stack">
                    <h4>Error Message:</h4>
                    <pre>{error?.message}</pre>
                    
                    <h4>Stack Trace:</h4>
                    <pre>{error?.stack}</pre>
                    
                    <h4>Component Stack:</h4>
                    <pre>{errorInfo?.componentStack}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>

          <style jsx="true">{`
            .error-boundary {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--theme-background);
              color: var(--theme-text);
              padding: 2rem;
            }

            .error-container {
              max-width: 600px;
              text-align: center;
              background: var(--glass-bg);
              backdrop-filter: var(--glass-backdrop);
              border: 1px solid var(--glass-border);
              border-radius: var(--radius-2xl);
              padding: 3rem;
            }

            .error-icon {
              color: #ef4444;
              margin-bottom: 2rem;
            }

            .error-content h1 {
              font-family: var(--font-display);
              font-size: 2rem;
              margin: 0 0 1rem 0;
              color: var(--theme-text);
            }

            .error-message {
              font-size: 1.1rem;
              color: var(--theme-textSecondary);
              margin-bottom: 2rem;
              line-height: 1.6;
            }

            .error-id {
              background: rgba(255, 255, 255, 0.05);
              padding: 0.75rem;
              border-radius: var(--radius-lg);
              margin-bottom: 2rem;
              font-size: 0.9rem;
              color: var(--theme-textSecondary);
            }

            .error-id code {
              background: rgba(255, 255, 255, 0.1);
              padding: 0.25rem 0.5rem;
              border-radius: var(--radius-sm);
              font-family: monospace;
              color: var(--theme-text);
            }

            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              flex-wrap: wrap;
              margin-bottom: 2rem;
            }

            .btn-primary, .btn-secondary {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: var(--radius-lg);
              cursor: pointer;
              font-weight: 500;
              transition: all var(--transition-normal);
            }

            .btn-primary {
              background: var(--theme-gradient-primary);
              color: white;
            }

            .btn-primary:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
            }

            .btn-secondary {
              background: rgba(255, 255, 255, 0.1);
              color: var(--theme-text);
              border: 1px solid var(--glass-border);
            }

            .btn-secondary:hover {
              background: rgba(255, 255, 255, 0.2);
              transform: translateY(-1px);
            }

            .error-details {
              text-align: left;
              margin-top: 2rem;
              background: rgba(255, 255, 255, 0.02);
              border: 1px solid var(--glass-border);
              border-radius: var(--radius-lg);
              padding: 1rem;
            }

            .error-details summary {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;
              font-weight: 500;
              color: var(--theme-text);
              margin-bottom: 1rem;
            }

            .error-stack {
              font-size: 0.8rem;
            }

            .error-stack h4 {
              color: var(--theme-text);
              margin: 1rem 0 0.5rem 0;
              font-size: 0.9rem;
            }

            .error-stack pre {
              background: rgba(0, 0, 0, 0.3);
              padding: 1rem;
              border-radius: var(--radius-md);
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-word;
              color: #ff6b6b;
              font-family: 'Courier New', monospace;
              font-size: 0.75rem;
              line-height: 1.4;
            }

            @media (max-width: 768px) {
              .error-container {
                padding: 2rem;
              }

              .error-content h1 {
                font-size: 1.5rem;
              }

              .error-actions {
                flex-direction: column;
              }

              .btn-primary, .btn-secondary {
                width: 100%;
                justify-content: center;
              }
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for error reporting
export const useErrorReporting = () => {
  const reportError = (error, context = {}) => {
    const errorReport = {
      id: Date.now().toString(36),
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.error('Manual Error Report:', errorReport)
    
    // Store locally
    try {
      const errors = JSON.parse(localStorage.getItem('errorReports') || '[]')
      errors.push(errorReport)
      localStorage.setItem('errorReports', JSON.stringify(errors.slice(-10)))
    } catch (e) {
      console.error('Failed to store error report:', e)
    }
  }

  return { reportError }
}