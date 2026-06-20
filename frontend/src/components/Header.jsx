import React, { useState } from 'react'
import {
  Activity,
  Download,
  HelpCircle,
  Keyboard,
  MessageCircle,
  Monitor,
  Sparkles
} from 'lucide-react'
import ThemeSelector from './ThemeSelector'
import StatusIndicator from './StatusIndicator'
import PerformanceDashboard from './PerformanceDashboard'
import SystemStatus from './SystemStatus'
import FeatureShowcase from './FeatureShowcase'

const Header = ({
  onShowCollaboration,
  onShowExport,
  onShowKeyboardShortcuts,
  onShowHelp
}) => {
  const [showPerformance, setShowPerformance] = useState(false)
  const [showSystemStatus, setShowSystemStatus] = useState(false)
  const [showFeatureShowcase, setShowFeatureShowcase] = useState(false)

  return (
    <>
      <header className="main-header-modern">
        <button
          className="brand-button"
          onClick={() => setShowFeatureShowcase(true)}
          aria-label="Open product feature overview"
        >
          <span className="logo-icon" aria-hidden="true">
            <Sparkles size={19} />
          </span>
          <span className="logo-text">
            <strong>TeamMatrix</strong>
            <span>Organization intelligence</span>
          </span>
        </button>

        <div className="header-right">
          <div className="header-utility-group" aria-label="Application utilities">
            <button
              className="header-action-btn header-secondary-action"
              onClick={onShowHelp}
              aria-label="Help and documentation"
              title="Help and documentation (Ctrl+H)"
            >
              <HelpCircle size={17} />
            </button>

            <button
              className="header-action-btn header-secondary-action"
              onClick={onShowKeyboardShortcuts}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (Ctrl+?)"
            >
              <Keyboard size={17} />
            </button>

            <button
              className="header-action-btn header-secondary-action"
              onClick={onShowCollaboration}
              aria-label="Open collaboration"
              title="Collaboration (Ctrl+Shift+C)"
            >
              <MessageCircle size={17} />
            </button>

            <button
              className="header-action-btn header-monitor-action"
              onClick={() => setShowPerformance(true)}
              aria-label="Performance monitor"
              title="Performance monitor"
            >
              <Monitor size={17} />
            </button>

            <button
              className="header-action-btn header-monitor-action"
              onClick={() => setShowSystemStatus(true)}
              aria-label="System status"
              title="System status"
            >
              <Activity size={17} />
            </button>
          </div>

          <div className="header-status">
            <StatusIndicator
              isConnected={true}
              activeUsers={3}
              lastSync={new Date()}
            />
          </div>

          <button
            className="header-export-btn"
            onClick={onShowExport}
            aria-label="Export current workspace"
          >
            <Download size={16} />
            <span>Export</span>
          </button>

          <ThemeSelector />
        </div>
      </header>

      <PerformanceDashboard
        isOpen={showPerformance}
        onClose={() => setShowPerformance(false)}
      />

      <SystemStatus
        isOpen={showSystemStatus}
        onClose={() => setShowSystemStatus(false)}
      />

      <FeatureShowcase
        isOpen={showFeatureShowcase}
        onClose={() => setShowFeatureShowcase(false)}
      />
    </>
  )
}

export default Header
