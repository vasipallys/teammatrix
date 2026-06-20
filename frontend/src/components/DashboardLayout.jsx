import React, { useState, useEffect } from 'react'
import { Grid, List, BarChart3, Settings, Maximize2, Minimize2 } from 'lucide-react'
import EnhancedDataCard from './EnhancedDataCard'

const DashboardLayout = ({ 
  children, 
  title, 
  subtitle,
  metrics = [],
  actions = [],
  className = '' 
}) => {
  const [viewMode, setViewMode] = useState('grid')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMetrics, setShowMetrics] = useState(true)

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        setIsFullscreen(!isFullscreen)
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isFullscreen])

  const viewModes = [
    { id: 'grid', icon: Grid, label: 'Grid View' },
    { id: 'list', icon: List, label: 'List View' },
    { id: 'chart', icon: BarChart3, label: 'Chart View' }
  ]

  return (
    <div className={`dashboard-layout ${isFullscreen ? 'fullscreen' : ''} ${className}`}>
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="dashboard-title">{title}</h1>
            {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
          </div>
          
          <div className="header-controls">
            <div className="view-mode-selector">
              {viewModes.map(mode => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.id}
                    className={`view-mode-btn ${viewMode === mode.id ? 'active' : ''}`}
                    onClick={() => setViewMode(mode.id)}
                    title={mode.label}
                  >
                    <Icon size={18} />
                  </button>
                )
              })}
            </div>

            <div className="dashboard-actions">
              <button
                className="action-btn"
                onClick={() => setShowMetrics(!showMetrics)}
                title="Toggle Metrics"
              >
                <BarChart3 size={18} />
              </button>
              
              <button
                className="action-btn"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>

              {actions.map((action, index) => (
                <button
                  key={index}
                  className="action-btn"
                  onClick={action.onClick}
                  title={action.label}
                >
                  <action.icon size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {showMetrics && metrics.length > 0 && (
          <div className="metrics-section">
            <div className="metrics-grid">
              {metrics.map((metric, index) => (
                <EnhancedDataCard
                  key={index}
                  {...metric}
                  className="dashboard-metric"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`dashboard-content ${viewMode}`}>
        {children}
      </div>

      <style jsx="true">{`
        .dashboard-layout {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--theme-background);
          transition: all var(--transition-normal);
        }

        .dashboard-layout.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          background: var(--theme-background);
        }

        .dashboard-header {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border-bottom: 1px solid var(--glass-border);
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .dashboard-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--theme-gradient-mesh);
          opacity: 0.3;
          z-index: 0;
        }

        .header-content {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .header-text {
          flex: 1;
        }

        .dashboard-title {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, var(--theme-primary), var(--theme-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dashboard-subtitle {
          color: var(--theme-textSecondary);
          font-size: 1.1rem;
          margin: 0;
          opacity: 0.9;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .view-mode-selector {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg);
          padding: 0.25rem;
          border: 1px solid var(--glass-border);
        }

        .view-mode-btn {
          background: none;
          border: none;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .view-mode-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .view-mode-btn.active {
          background: var(--theme-gradient-primary);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .dashboard-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 0.75rem;
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
          transform: translateY(-1px);
        }

        .metrics-section {
          position: relative;
          z-index: 1;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .dashboard-content {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          position: relative;
        }

        .dashboard-content.grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          align-content: start;
        }

        .dashboard-content.list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .dashboard-content.chart {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        :global(.dashboard-metric) {
          min-height: 140px;
        }

        @media (max-width: 1024px) {
          .dashboard-header {
            padding: 1.5rem;
          }

          .header-content {
            flex-direction: column;
            gap: 1.5rem;
            align-items: stretch;
          }

          .header-controls {
            justify-content: space-between;
          }

          .dashboard-title {
            font-size: 2rem;
          }

          .metrics-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }
        }

        @media (max-width: 768px) {
          .dashboard-content {
            padding: 1rem;
          }

          .dashboard-content.grid {
            grid-template-columns: 1fr;
          }

          .view-mode-selector {
            order: 1;
          }

          .dashboard-actions {
            order: 2;
          }

          .dashboard-title {
            font-size: 1.75rem;
          }

          .dashboard-subtitle {
            font-size: 1rem;
          }
        }

        /* Fullscreen specific styles */
        .dashboard-layout.fullscreen .dashboard-header {
          padding: 1rem 2rem;
        }

        .dashboard-layout.fullscreen .header-content {
          margin-bottom: 1rem;
        }

        .dashboard-layout.fullscreen .dashboard-title {
          font-size: 2rem;
        }

        /* Animation for layout changes */
        .dashboard-content > * {
          animation: fadeInUp 0.3s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Scroll indicators */
        .dashboard-content::-webkit-scrollbar {
          width: 6px;
        }

        .dashboard-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .dashboard-content::-webkit-scrollbar-thumb {
          background: var(--theme-primary);
          border-radius: 3px;
        }

        .dashboard-content::-webkit-scrollbar-thumb:hover {
          background: var(--theme-accent);
        }
      `}</style>
    </div>
  )
}

export default DashboardLayout