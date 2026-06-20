import React from 'react'
import { 
  Users, 
  Calendar, 
  Brain, 
  Database, 
  Server, 
  Layers, 
  Shield, 
  GitBranch, 
  Target, 
  Activity,
  Keyboard,
  MousePointer,
  Compass,
  X
} from 'lucide-react'

const NavigationSummary = ({ isOpen, currentTab, onNavigate, onClose }) => {
  if (!isOpen) return null
  const navigationItems = [
    {
      id: 'org',
      title: 'Organization Structure Data',
      subtitle: 'Hierarchy visualization',
      icon: Users,
      shortcut: 'Ctrl+1',
      color: 'var(--accent-blue)',
      description: 'Interactive organizational hierarchy charts with advanced filtering and navigation'
    },
    {
      id: 'work',
      title: 'Work Plans Timeline',
      subtitle: 'Project management insights',
      icon: Calendar,
      shortcut: 'Ctrl+2',
      color: 'var(--accent-green)',
      description: 'Interactive Gantt charts and project timeline visualization'
    },
    {
      id: 'analytics',
      title: 'AI Analytics Dashboard',
      subtitle: 'Machine learning insights',
      icon: Brain,
      shortcut: 'Ctrl+3',
      color: 'var(--accent-purple)',
      description: 'Advanced analytics powered by AI with predictions and recommendations'
    },
    {
      id: 'data',
      title: 'Data Management Center',
      subtitle: 'Centralized data operations',
      icon: Database,
      shortcut: 'Ctrl+4',
      color: 'var(--accent-orange)',
      description: 'Complete data management center with integrations, quality monitoring, and import/export capabilities',
      hasSubItems: true,
      subItems: [
        {
          id: 'data-import-export',
          title: 'Data Import/Export',
          description: 'Upload, process, and export organizational data'
        },
        {
          id: 'ldap-integration',
          title: 'LDAP Directory Integration',
          description: 'Active Directory integration and synchronization'
        },
        {
          id: 'jira-integration',
          title: 'Jira Project Integration',
          description: 'Atlassian project management integration'
        },
        {
          id: 'git-repository',
          title: 'Git Repository Manager',
          description: 'Pull data from Git repositories (GitHub, GitLab, Bitbucket)'
        },
        {
          id: 'data-quality',
          title: 'Data Quality Dashboard',
          description: 'Comprehensive data monitoring and validation'
        }
      ]
    },
    {
      id: 'developer',
      title: 'Developer Analytics',
      subtitle: 'AI-powered profiling',
      icon: GitBranch,
      shortcut: 'Ctrl+5',
      color: 'var(--accent-purple)',
      description: 'Advanced developer profiling with intelligent insights'
    },
    {
      id: 'planning',
      title: 'Plan vs Actual Tracking',
      subtitle: 'Strategic alignment',
      icon: Target,
      shortcut: 'Ctrl+6',
      color: 'var(--accent-red)',
      description: 'Strategic alignment monitoring and variance analysis'
    },
    {
      id: 'etl',
      title: 'ETL Pipeline Monitor',
      subtitle: 'Data orchestration',
      icon: Activity,
      shortcut: 'Ctrl+7',
      color: 'var(--accent-orange)',
      description: 'Complete data pipeline orchestration and monitoring'
    }
  ]

  const handleItemClick = (itemId) => {
    onNavigate(itemId)
    onClose()
  }

  return (
    <div className="navigation-summary-overlay" onClick={onClose}>
      <div className="navigation-summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Compass size={20} /> Navigation Overview</h3>
          <button className="btn-close" onClick={onClose} aria-label="Close navigation overview"><X size={18} /></button>
        </div>

        <div className="modal-content">
          <div className="navigation-grid">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              return (
                <div 
                  key={item.id}
                  className={`nav-card ${currentTab === item.id ? 'active' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="nav-card-header">
                    <div className="nav-icon" style={{ backgroundColor: item.color }}>
                      <IconComponent size={20} />
                    </div>
                    <div className="nav-shortcut">
                      <Keyboard size={12} />
                      <span>{item.shortcut}</span>
                    </div>
                  </div>
                  
                  <div className="nav-card-content">
                    <h4>{item.title}</h4>
                    <p className="nav-subtitle">{item.subtitle}</p>
                    <p className="nav-description">{item.description}</p>
                    
                    {item.hasSubItems && (
                      <div className="sub-items">
                        <h5>Includes:</h5>
                        <div className="sub-items-list">
                          {item.subItems.map((subItem) => (
                            <div key={subItem.id} className="sub-item">
                              <span className="sub-item-title">{subItem.title}</span>
                              <span className="sub-item-desc">{subItem.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="nav-card-footer">
                    <button className="nav-btn">
                      <MousePointer size={14} />
                      Navigate
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="keyboard-hints">
            <h4><Keyboard size={18} /> Keyboard Shortcuts</h4>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <kbd>Ctrl + K</kbd>
                <span>Command Palette</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl + ?</kbd>
                <span>Keyboard Shortcuts</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl + H</kbd>
                <span>Help System</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl + Shift + C</kbd>
                <span>Collaboration</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl + Shift + E</kbd>
                <span>Export System</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl + F</kbd>
                <span>Feature Showcase</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .navigation-summary-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .navigation-summary-modal {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          width: 95%;
          max-width: 1200px;
          max-height: 90vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg) var(--space-xl);
          border-bottom: 1px solid var(--glass-border);
        }

        .modal-header h3 {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .btn-close {
          background: transparent;
          border: none;
          color: var(--theme-textSecondary);
          font-size: 1.5rem;
          cursor: pointer;
          padding: var(--space-xs);
          border-radius: var(--radius-sm);
          transition: all var(--transition-normal);
        }

        .btn-close:hover {
          color: var(--theme-text);
          background: rgba(255, 255, 255, 0.1);
        }

        .modal-content {
          padding: var(--space-xl);
          max-height: calc(90vh - 80px);
          overflow-y: auto;
        }

        .navigation-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .nav-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .nav-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          transition: left var(--transition-slow);
        }

        .nav-card:hover::before {
          left: 100%;
        }

        .nav-card:hover {
          transform: translateY(-4px);
          border-color: var(--theme-primary);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2);
        }

        .nav-card.active {
          border-color: var(--theme-primary);
          background: rgba(59, 130, 246, 0.05);
        }

        .nav-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        }

        .nav-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .nav-shortcut {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-xs) var(--space-sm);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .nav-card-content h4 {
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 700;
          margin: 0 0 var(--space-xs) 0;
        }

        .nav-subtitle {
          color: var(--theme-primary);
          font-size: 0.8rem;
          font-weight: 600;
          margin: 0 0 var(--space-sm) 0;
        }

        .nav-description {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0 0 var(--space-md) 0;
        }

        .nav-card-footer {
          display: flex;
          justify-content: flex-end;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-sm) var(--space-md);
          background: var(--theme-gradient-primary);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .nav-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .keyboard-hints {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
        }

        .keyboard-hints h4 {
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-md) 0;
        }

        .shortcuts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-sm);
        }

        .shortcut-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
        }

        .shortcut-item kbd {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          padding: 2px 6px;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--theme-text);
        }

        .shortcut-item span {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .sub-items {
          margin-top: var(--space-md);
          padding-top: var(--space-md);
          border-top: 1px solid var(--glass-border);
        }

        .sub-items h5 {
          color: var(--theme-text);
          font-size: 0.8rem;
          font-weight: 600;
          margin: 0 0 var(--space-sm) 0;
        }

        .sub-items-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .sub-item {
          display: flex;
          flex-direction: column;
          padding: var(--space-xs);
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-sm);
          border-left: 2px solid var(--theme-primary);
        }

        .sub-item-title {
          color: var(--theme-text);
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .sub-item-desc {
          color: var(--theme-textSecondary);
          font-size: 0.7rem;
          line-height: 1.3;
        }

        @media (max-width: 768px) {
          .navigation-grid {
            grid-template-columns: 1fr;
          }

          .shortcuts-grid {
            grid-template-columns: 1fr;
          }

          .navigation-summary-modal {
            width: 95%;
            margin: var(--space-md);
          }

          .modal-content {
            padding: var(--space-md);
          }
        }
      `}</style>
    </div>
  )
}

export default NavigationSummary
