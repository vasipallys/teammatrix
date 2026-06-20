import React, { useState, useEffect } from 'react'
import { 
  Zap, 
  Play, 
  Pause, 
  Settings, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Database,
  Mail,
  Webhook,
  Filter,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react'
import { useNotifications } from './NotificationSystem'

const AutomationSystem = ({ isOpen, onClose, className = '' }) => {
  const [automations, setAutomations] = useState([
    {
      id: 1,
      name: 'Daily Data Sync',
      description: 'Automatically sync LDAP data every morning at 9 AM',
      trigger: { type: 'schedule', value: '0 9 * * *' },
      actions: [
        { type: 'ldap_sync', config: {} },
        { type: 'notification', config: { message: 'Daily sync completed' } }
      ],
      status: 'active',
      lastRun: new Date(Date.now() - 86400000),
      nextRun: new Date(Date.now() + 3600000),
      runCount: 45,
      successRate: 98.5
    },
    {
      id: 2,
      name: 'Weekly Report Generation',
      description: 'Generate and email weekly analytics report',
      trigger: { type: 'schedule', value: '0 8 * * 1' },
      actions: [
        { type: 'generate_report', config: { type: 'weekly' } },
        { type: 'email', config: { recipients: ['team@company.com'] } }
      ],
      status: 'active',
      lastRun: new Date(Date.now() - 604800000),
      nextRun: new Date(Date.now() + 86400000),
      runCount: 12,
      successRate: 100
    },
    {
      id: 3,
      name: 'Data Quality Check',
      description: 'Validate data integrity after uploads',
      trigger: { type: 'event', value: 'data_uploaded' },
      actions: [
        { type: 'validate_data', config: {} },
        { type: 'notification', config: { message: 'Data validation completed' } }
      ],
      status: 'paused',
      lastRun: new Date(Date.now() - 172800000),
      nextRun: null,
      runCount: 23,
      successRate: 95.7
    }
  ])

  const [selectedAutomation, setSelectedAutomation] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('list')

  const { success, error, info } = useNotifications()

  const triggerTypes = [
    { id: 'schedule', name: 'Schedule', icon: Clock, description: 'Run on a time schedule' },
    { id: 'event', name: 'Event', icon: Zap, description: 'Trigger on system events' },
    { id: 'webhook', name: 'Webhook', icon: Webhook, description: 'External API trigger' },
    { id: 'manual', name: 'Manual', icon: Play, description: 'Run manually only' }
  ]

  const actionTypes = [
    { id: 'ldap_sync', name: 'LDAP Sync', icon: Database, description: 'Synchronize LDAP data' },
    { id: 'generate_report', name: 'Generate Report', icon: Calendar, description: 'Create analytics report' },
    { id: 'email', name: 'Send Email', icon: Mail, description: 'Send email notification' },
    { id: 'notification', name: 'Show Notification', icon: AlertTriangle, description: 'Display system notification' },
    { id: 'validate_data', name: 'Validate Data', icon: CheckCircle, description: 'Check data integrity' },
    { id: 'export_data', name: 'Export Data', icon: Database, description: 'Export data to file' }
  ]

  const toggleAutomation = (id) => {
    setAutomations(prev => prev.map(automation => 
      automation.id === id 
        ? { ...automation, status: automation.status === 'active' ? 'paused' : 'active' }
        : automation
    ))
    
    const automation = automations.find(a => a.id === id)
    const newStatus = automation.status === 'active' ? 'paused' : 'active'
    success(`Automation "${automation.name}" ${newStatus}`)
  }

  const runAutomation = (id) => {
    const automation = automations.find(a => a.id === id)
    info(`Running automation: ${automation.name}`)
    
    // Simulate automation run
    setTimeout(() => {
      setAutomations(prev => prev.map(a => 
        a.id === id 
          ? { ...a, lastRun: new Date(), runCount: a.runCount + 1 }
          : a
      ))
      success(`Automation "${automation.name}" completed successfully`)
    }, 2000)
  }

  const deleteAutomation = (id) => {
    const automation = automations.find(a => a.id === id)
    setAutomations(prev => prev.filter(a => a.id !== id))
    success(`Automation "${automation.name}" deleted`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green'
      case 'paused': return 'orange'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const formatNextRun = (date) => {
    if (!date) return 'Not scheduled'
    const now = new Date()
    const diff = date - now
    
    if (diff < 0) return 'Overdue'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours`
    return `${Math.floor(diff / 86400000)} days`
  }

  if (!isOpen) return null

  return (
    <div className={`automation-system ${className}`}>
      <div className="automation-overlay" onClick={onClose} />
      
      <div className="automation-panel">
        <div className="panel-header">
          <div className="header-title">
            <Zap size={24} />
            <h2>Automation Center</h2>
          </div>
          <div className="header-actions">
            <button 
              className="create-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Create Automation
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="automation-tabs">
          <button 
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Automations ({automations.length})
          </button>
          <button 
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Execution Logs
          </button>
          <button 
            className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
        </div>

        <div className="automation-content">
          {activeTab === 'list' && (
            <div className="automations-list">
              {automations.map(automation => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  onToggle={() => toggleAutomation(automation.id)}
                  onRun={() => runAutomation(automation.id)}
                  onEdit={() => setSelectedAutomation(automation)}
                  onDelete={() => deleteAutomation(automation.id)}
                  getStatusColor={getStatusColor}
                  formatNextRun={formatNextRun}
                />
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="logs-section">
              <div className="logs-header">
                <h3>Recent Executions</h3>
                <button className="refresh-btn">
                  <Settings size={16} />
                  Refresh
                </button>
              </div>
              <div className="logs-list">
                {/* Execution logs would go here */}
                <div className="log-item">
                  <div className="log-status success">
                    <CheckCircle size={16} />
                  </div>
                  <div className="log-content">
                    <div className="log-title">Daily Data Sync</div>
                    <div className="log-time">2 hours ago • Completed in 1.2s</div>
                  </div>
                </div>
                <div className="log-item">
                  <div className="log-status success">
                    <CheckCircle size={16} />
                  </div>
                  <div className="log-content">
                    <div className="log-title">Data Quality Check</div>
                    <div className="log-time">1 day ago • Completed in 0.8s</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="templates-section">
              <h3>Automation Templates</h3>
              <div className="templates-grid">
                <div className="template-card">
                  <h4>Data Backup</h4>
                  <p>Automatically backup data daily</p>
                  <button className="use-template-btn">Use Template</button>
                </div>
                <div className="template-card">
                  <h4>Error Monitoring</h4>
                  <p>Monitor and alert on system errors</p>
                  <button className="use-template-btn">Use Template</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .automation-system {
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

        .automation-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
        }

        .automation-panel {
          position: relative;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          width: 100%;
          max-width: 1000px;
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

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .create-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--theme-gradient-primary);
          border: none;
          border-radius: var(--radius-lg);
          color: white;
          cursor: pointer;
          transition: all var(--transition-normal);
          font-weight: 500;
        }

        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
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

        .automation-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--glass-border);
        }

        .tab {
          flex: 1;
          padding: 1rem 2rem;
          background: none;
          border: none;
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          border-bottom: 2px solid transparent;
        }

        .tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--theme-text);
        }

        .tab.active {
          color: var(--theme-primary);
          border-bottom-color: var(--theme-primary);
          background: rgba(59, 130, 246, 0.05);
        }

        .automation-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .automations-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .logs-section,
        .templates-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logs-header h3,
        .templates-section h3 {
          color: var(--theme-text);
          margin: 0;
          font-size: 1.25rem;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .logs-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .log-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
        }

        .log-status {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .log-status.success {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .log-content {
          flex: 1;
        }

        .log-title {
          color: var(--theme-text);
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .log-time {
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .template-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          transition: all var(--transition-normal);
        }

        .template-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .template-card h4 {
          color: var(--theme-text);
          margin: 0 0 0.5rem 0;
        }

        .template-card p {
          color: var(--theme-textSecondary);
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
        }

        .use-template-btn {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--radius-md);
          padding: 0.5rem 1rem;
          color: #3b82f6;
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.875rem;
        }

        .use-template-btn:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        @media (max-width: 768px) {
          .automation-system {
            padding: 1rem;
          }

          .panel-header {
            padding: 1.5rem;
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .automation-content {
            padding: 1.5rem;
          }

          .templates-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

const AutomationCard = ({ 
  automation, 
  onToggle, 
  onRun, 
  onEdit, 
  onDelete, 
  getStatusColor, 
  formatNextRun 
}) => {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="automation-card">
      <div className="card-header">
        <div className="automation-info">
          <div className="automation-name">{automation.name}</div>
          <div className="automation-description">{automation.description}</div>
        </div>
        
        <div className="automation-status">
          <div className={`status-indicator ${getStatusColor(automation.status)}`}>
            {automation.status}
          </div>
          <button 
            className="actions-btn"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="card-content">
        <div className="automation-stats">
          <div className="stat">
            <div className="stat-label">Runs</div>
            <div className="stat-value">{automation.runCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Success Rate</div>
            <div className="stat-value">{automation.successRate}%</div>
          </div>
          <div className="stat">
            <div className="stat-label">Next Run</div>
            <div className="stat-value">{formatNextRun(automation.nextRun)}</div>
          </div>
        </div>

        <div className="automation-actions">
          <button 
            className={`toggle-btn ${automation.status === 'active' ? 'pause' : 'play'}`}
            onClick={onToggle}
          >
            {automation.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
            {automation.status === 'active' ? 'Pause' : 'Start'}
          </button>
          
          <button className="run-btn" onClick={onRun}>
            <Play size={16} />
            Run Now
          </button>
        </div>
      </div>

      {showActions && (
        <div className="actions-dropdown">
          <button onClick={onEdit}>
            <Edit3 size={14} />
            Edit
          </button>
          <button onClick={onDelete} className="delete-action">
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      <style jsx="true">{`
        .automation-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          transition: all var(--transition-normal);
          position: relative;
        }

        .automation-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .automation-info {
          flex: 1;
        }

        .automation-name {
          color: var(--theme-text);
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .automation-description {
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .automation-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-indicator {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-indicator.green {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .status-indicator.orange {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .status-indicator.red {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .actions-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 0.5rem;
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .actions-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .card-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }

        .automation-stats {
          display: flex;
          gap: 2rem;
        }

        .stat {
          text-align: center;
        }

        .stat-label {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          color: var(--theme-text);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .automation-actions {
          display: flex;
          gap: 0.75rem;
        }

        .toggle-btn,
        .run-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.875rem;
        }

        .toggle-btn.pause {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border-color: rgba(245, 158, 11, 0.3);
        }

        .toggle-btn.play {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
        }

        .run-btn {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.3);
        }

        .toggle-btn:hover,
        .run-btn:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }

        .actions-dropdown {
          position: absolute;
          top: 4rem;
          right: 1.5rem;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 0.5rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          z-index: 10;
          min-width: 120px;
        }

        .actions-dropdown button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: none;
          border: none;
          border-radius: var(--radius-md);
          color: var(--theme-text);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.875rem;
          text-align: left;
        }

        .actions-dropdown button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .actions-dropdown button.delete-action {
          color: #ef4444;
        }

        .actions-dropdown button.delete-action:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        @media (max-width: 768px) {
          .card-content {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .automation-stats {
            justify-content: space-around;
          }

          .automation-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default AutomationSystem