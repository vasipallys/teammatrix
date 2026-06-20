import React, { useState } from 'react'
import { Activity, Zap, Clock, Wifi, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import { usePerformanceMonitor, useResourceMonitor, useErrorMonitor, useWebVitals } from '../hooks/usePerformanceMonitor'
import EnhancedDataCard from './EnhancedDataCard'

const PerformanceDashboard = ({ isOpen, onClose }) => {
  const { metrics } = usePerformanceMonitor()
  const resources = useResourceMonitor()
  const errors = useErrorMonitor()
  const vitals = useWebVitals()
  const [activeTab, setActiveTab] = useState('overview')

  if (!isOpen) return null

  const getPerformanceScore = () => {
    let score = 100
    
    // FPS penalty
    if (metrics.fps < 30) score -= 20
    else if (metrics.fps < 45) score -= 10
    
    // Memory penalty
    if (metrics.memory > 100) score -= 15
    else if (metrics.memory > 50) score -= 5
    
    // Network penalty
    if (metrics.networkLatency > 1000) score -= 20
    else if (metrics.networkLatency > 500) score -= 10
    
    // Error penalty
    score -= errors.length * 5
    
    return Math.max(0, score)
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'green'
    if (score >= 70) return 'orange'
    return 'red'
  }

  const performanceScore = getPerformanceScore()
  const scoreColor = getScoreColor(performanceScore)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'vitals', label: 'Web Vitals', icon: Zap },
    { id: 'resources', label: 'Resources', icon: Clock },
    { id: 'errors', label: 'Errors', icon: AlertTriangle }
  ]

  return (
    <div className="performance-dashboard-overlay">
      <div className="performance-dashboard">
        <div className="dashboard-header">
          <h2>Performance Monitor</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dashboard-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
                {tab.id === 'errors' && errors.length > 0 && (
                  <span className="error-badge">{errors.length}</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="performance-score">
                <div className={`score-circle ${scoreColor}`}>
                  <span className="score-value">{performanceScore}</span>
                  <span className="score-label">Score</span>
                </div>
                <div className="score-details">
                  <h3>Performance Health</h3>
                  <p>
                    {performanceScore >= 90 ? 'Excellent' : 
                     performanceScore >= 70 ? 'Good' : 'Needs Improvement'}
                  </p>
                </div>
              </div>

              <div className="metrics-grid">
                <EnhancedDataCard
                  title="FPS"
                  value={metrics.fps}
                  icon={Activity}
                  color={metrics.fps >= 45 ? 'green' : metrics.fps >= 30 ? 'orange' : 'red'}
                  subtitle="Frames per second"
                />
                
                <EnhancedDataCard
                  title="Memory"
                  value={`${metrics.memory}MB`}
                  icon={Zap}
                  color={metrics.memory <= 50 ? 'green' : metrics.memory <= 100 ? 'orange' : 'red'}
                  subtitle="JavaScript heap"
                />
                
                <EnhancedDataCard
                  title="Network"
                  value={`${metrics.networkLatency}ms`}
                  icon={Wifi}
                  color={metrics.networkLatency <= 200 ? 'green' : metrics.networkLatency <= 500 ? 'orange' : 'red'}
                  subtitle="API latency"
                />
                
                <EnhancedDataCard
                  title="Load Time"
                  value={`${(metrics.loadTime / 1000).toFixed(1)}s`}
                  icon={Clock}
                  color={metrics.loadTime <= 2000 ? 'green' : metrics.loadTime <= 4000 ? 'orange' : 'red'}
                  subtitle="Page load time"
                />
              </div>
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="vitals-tab">
              <div className="vitals-grid">
                <div className="vital-card">
                  <div className="vital-header">
                    <h4>Largest Contentful Paint</h4>
                    <span className={`vital-score ${vitals.LCP <= 2500 ? 'good' : vitals.LCP <= 4000 ? 'needs-improvement' : 'poor'}`}>
                      {vitals.LCP ? `${(vitals.LCP / 1000).toFixed(2)}s` : 'N/A'}
                    </span>
                  </div>
                  <p>Time until the largest content element is rendered</p>
                </div>

                <div className="vital-card">
                  <div className="vital-header">
                    <h4>First Input Delay</h4>
                    <span className={`vital-score ${vitals.FID <= 100 ? 'good' : vitals.FID <= 300 ? 'needs-improvement' : 'poor'}`}>
                      {vitals.FID ? `${vitals.FID.toFixed(0)}ms` : 'N/A'}
                    </span>
                  </div>
                  <p>Time from first user interaction to browser response</p>
                </div>

                <div className="vital-card">
                  <div className="vital-header">
                    <h4>Cumulative Layout Shift</h4>
                    <span className={`vital-score ${vitals.CLS <= 0.1 ? 'good' : vitals.CLS <= 0.25 ? 'needs-improvement' : 'poor'}`}>
                      {vitals.CLS ? vitals.CLS.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                  <p>Measure of visual stability during page load</p>
                </div>

                <div className="vital-card">
                  <div className="vital-header">
                    <h4>First Contentful Paint</h4>
                    <span className={`vital-score ${vitals.FCP <= 1800 ? 'good' : vitals.FCP <= 3000 ? 'needs-improvement' : 'poor'}`}>
                      {vitals.FCP ? `${(vitals.FCP / 1000).toFixed(2)}s` : 'N/A'}
                    </span>
                  </div>
                  <p>Time until first content is painted</p>
                </div>

                <div className="vital-card">
                  <div className="vital-header">
                    <h4>Time to First Byte</h4>
                    <span className={`vital-score ${vitals.TTFB <= 800 ? 'good' : vitals.TTFB <= 1800 ? 'needs-improvement' : 'poor'}`}>
                      {vitals.TTFB ? `${vitals.TTFB.toFixed(0)}ms` : 'N/A'}
                    </span>
                  </div>
                  <p>Time until first byte is received from server</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="resources-tab">
              <div className="resources-header">
                <h3>Resource Loading ({resources.length} resources)</h3>
              </div>
              <div className="resources-list">
                {resources.slice(0, 20).map((resource, index) => (
                  <div key={index} className="resource-item">
                    <div className="resource-info">
                      <div className="resource-name">{resource.name.split('/').pop()}</div>
                      <div className="resource-details">
                        <span className="resource-type">{resource.type}</span>
                        <span className="resource-size">{(resource.size / 1024).toFixed(1)}KB</span>
                        <span className="resource-duration">{resource.duration}ms</span>
                      </div>
                    </div>
                    <div className={`resource-status ${resource.duration > 1000 ? 'slow' : resource.duration > 500 ? 'medium' : 'fast'}`}>
                      {resource.duration > 1000 ? 'Slow' : resource.duration > 500 ? 'Medium' : 'Fast'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="errors-tab">
              {errors.length === 0 ? (
                <div className="no-errors">
                  <CheckCircle size={48} />
                  <h3>No Errors Detected</h3>
                  <p>Your application is running smoothly!</p>
                </div>
              ) : (
                <div className="errors-list">
                  {errors.map((error, index) => (
                    <div key={index} className="error-item">
                      <div className="error-header">
                        <AlertTriangle size={16} />
                        <span className="error-time">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="error-message">{error.message}</div>
                      {error.filename && (
                        <div className="error-location">
                          {error.filename}:{error.lineno}:{error.colno}
                        </div>
                      )}
                      {error.stack && (
                        <details className="error-stack">
                          <summary>Stack Trace</summary>
                          <pre>{error.stack}</pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .performance-dashboard-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 2rem;
        }

        .performance-dashboard {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .dashboard-header h2 {
          color: var(--theme-text);
          font-family: var(--font-display);
          margin: 0;
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

        .dashboard-tabs {
          display: flex;
          padding: 0 2rem;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          border-bottom: 2px solid transparent;
          position: relative;
        }

        .tab:hover {
          color: var(--theme-text);
          background: rgba(255, 255, 255, 0.05);
        }

        .tab.active {
          color: var(--theme-primary);
          border-bottom-color: var(--theme-primary);
        }

        .error-badge {
          background: #ef4444;
          color: white;
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 18px;
          text-align: center;
        }

        .dashboard-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .performance-score {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-xl);
          border: 1px solid var(--glass-border);
        }

        .score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          background: conic-gradient(from 0deg, currentColor 0%, currentColor ${performanceScore}%, rgba(255, 255, 255, 0.1) ${performanceScore}%);
          padding: 8px;
        }

        .score-circle::before {
          content: '';
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: var(--theme-background);
        }

        .score-circle.green { color: #10b981; }
        .score-circle.orange { color: #f59e0b; }
        .score-circle.red { color: #ef4444; }

        .score-value {
          position: relative;
          z-index: 1;
          font-size: 2rem;
          font-weight: 700;
          color: var(--theme-text);
          font-family: var(--font-display);
        }

        .score-label {
          position: relative;
          z-index: 1;
          font-size: 0.875rem;
          color: var(--theme-textSecondary);
        }

        .score-details h3 {
          color: var(--theme-text);
          margin: 0 0 0.5rem 0;
        }

        .score-details p {
          color: var(--theme-textSecondary);
          margin: 0;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .vitals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .vital-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
        }

        .vital-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .vital-header h4 {
          color: var(--theme-text);
          margin: 0;
          font-size: 1rem;
        }

        .vital-score {
          font-weight: 700;
          font-family: var(--font-display);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.875rem;
        }

        .vital-score.good {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .vital-score.needs-improvement {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .vital-score.poor {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .vital-card p {
          color: var(--theme-textSecondary);
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .resources-header {
          margin-bottom: 1.5rem;
        }

        .resources-header h3 {
          color: var(--theme-text);
          margin: 0;
        }

        .resources-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .resource-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
        }

        .resource-info {
          flex: 1;
          min-width: 0;
        }

        .resource-name {
          color: var(--theme-text);
          font-weight: 500;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .resource-details {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: var(--theme-textSecondary);
        }

        .resource-status {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .resource-status.fast {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .resource-status.medium {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .resource-status.slow {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .no-errors {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4rem 2rem;
          color: var(--theme-textSecondary);
        }

        .no-errors h3 {
          color: var(--theme-text);
          margin: 1rem 0 0.5rem 0;
        }

        .errors-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .error-item {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .error-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #ef4444;
        }

        .error-time {
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .error-message {
          color: var(--theme-text);
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .error-location {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-family: var(--font-mono);
          margin-bottom: 0.5rem;
        }

        .error-stack {
          margin-top: 1rem;
        }

        .error-stack summary {
          color: var(--theme-textSecondary);
          cursor: pointer;
          font-size: 0.875rem;
        }

        .error-stack pre {
          margin-top: 0.5rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          overflow-x: auto;
          color: var(--theme-textSecondary);
        }

        @media (max-width: 768px) {
          .performance-dashboard-overlay {
            padding: 1rem;
          }

          .dashboard-header {
            padding: 1rem;
          }

          .dashboard-tabs {
            padding: 0 1rem;
            overflow-x: auto;
          }

          .dashboard-content {
            padding: 1rem;
          }

          .performance-score {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .metrics-grid,
          .vitals-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default PerformanceDashboard