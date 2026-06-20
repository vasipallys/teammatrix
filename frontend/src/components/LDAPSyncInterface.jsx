import React, { useState, useEffect } from 'react'
import { 
  Server, 
  Users, 
  RefreshCw,
  CheckCircle, 
  AlertTriangle, 
  Settings,
  Eye,
  EyeOff,
  TestTube,
  Activity,
  Database,
  Clock
} from 'lucide-react'
import { 
  testLDAPConnection, 
  syncLDAPData, 
  getLDAPEmployees, 
  getLDAPSyncStatus 
} from '../api'
import { useNotifications } from './NotificationSystem'

const LDAPSyncInterface = ({ onEmployeeDataLoad }) => {
  const [config, setConfig] = useState({
    server: '',
    port: 389,
    baseDN: '',
    bindDN: '',
    bindPassword: '',
    userFilter: '(objectClass=person)',
    attributes: [
      'mail',
      'displayName',
      'mailNickname',
      'manager',
      'title',
      'department',
      'physicalDeliveryOfficeName'
    ]
  })
  
  const [status, setStatus] = useState({
    connected: false,
    lastSync: null,
    employeeCount: 0,
    isLoading: false,
    error: null
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [syncHistory, setSyncHistory] = useState([])
  const [employees, setEmployees] = useState([])
  
  const { success, error, info } = useNotifications()

  useEffect(() => {
    loadSyncStatus()
    loadEmployees()
  }, [])

  const loadSyncStatus = async () => {
    try {
      const response = await getLDAPSyncStatus()
      if (response.data.success) {
        setStatus(prev => ({
          ...prev,
          ...response.data.status,
          lastSync: response.data.status.lastSync ? new Date(response.data.status.lastSync) : null
        }))
        setSyncHistory(response.data.history || [])
      }
    } catch (err) {
      console.warn('Could not load LDAP sync status:', err)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await getLDAPEmployees()
      if (response.data.success) {
        setEmployees(response.data.employees || [])
        setStatus(prev => ({
          ...prev,
          employeeCount: response.data.employees?.length || 0
        }))
      }
    } catch (err) {
      console.warn('Could not load LDAP employees:', err)
    }
  }

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear test results when config changes
    setTestResults(null)
  }

  const handleTestConnection = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }))
    setTestResults(null)
    
    try {
      info('Testing LDAP connection...')
      const response = await testLDAPConnection(config)
      
      if (response.data.success) {
        setTestResults({
          success: true,
          message: response.data.message,
          userCount: response.data.userCount || 0,
          sampleUsers: response.data.sampleUsers || []
        })
        setStatus(prev => ({ ...prev, connected: true }))
        success(`LDAP connection successful! Found ${response.data.userCount} users`)
      } else {
        throw new Error(response.data.message || 'Connection test failed')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Connection test failed'
      setTestResults({
        success: false,
        message: errorMsg
      })
      setStatus(prev => ({ 
        ...prev, 
        connected: false, 
        error: errorMsg 
      }))
      error(`LDAP connection failed: ${errorMsg}`)
    } finally {
      setStatus(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleSyncData = async () => {
    if (!status.connected && !testResults?.success) {
      error('Please test the connection first')
      return
    }
    
    setStatus(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      info('RefreshCwing LDAP data...')
      const response = await syncLDAPData(config)
      
      if (response.data.success) {
        const newStatus = {
          ...status,
          lastSync: new Date(),
          employeeCount: response.data.employeeCount || 0,
          isLoading: false
        }
        setStatus(newStatus)
        
        // Update sync history
        const newSyncRecord = {
          timestamp: new Date(),
          employeeCount: response.data.employeeCount,
          duration: response.data.duration,
          success: true
        }
        setSyncHistory(prev => [newSyncRecord, ...prev.slice(0, 9)]) // Keep last 10
        
        // Load updated employees
        await loadEmployees()
        
        // Notify parent component
        if (onEmployeeDataLoad && response.data.employees) {
          onEmployeeDataLoad(response.data.employees)
        }
        
        success(`Successfully synced ${response.data.employeeCount} employees`)
      } else {
        throw new Error(response.data.message || 'RefreshCw failed')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'RefreshCw failed'
      setStatus(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMsg 
      }))
      error(`LDAP sync failed: ${errorMsg}`)
    }
  }

  const formatLastSync = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div className="ldap-sync-interface">
      <div className="ldap-header">
        <div className="ldap-title">
          <Server size={24} />
          <h3>LDAP Directory Integration</h3>
        </div>
        <div className="ldap-status">
          <div className={`status-indicator ${status.connected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span>{status.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="ldap-grid">
        {/* Configuration Panel */}
        <div className="ldap-config-panel">
          <h4>
            <Settings size={18} />
            Connection Configuration
          </h4>
          
          <div className="config-form">
            <div className="form-row">
              <div className="form-group">
                <label>LDAP Server</label>
                <input
                  type="text"
                  value={config.server}
                  onChange={(e) => handleConfigChange('server', e.target.value)}
                  placeholder="ldap://your-domain-controller.com"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Port</label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  className="form-input port-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Base DN</label>
              <input
                type="text"
                value={config.baseDN}
                onChange={(e) => handleConfigChange('baseDN', e.target.value)}
                placeholder="DC=company,DC=com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Bind DN (Service Account)</label>
              <input
                type="text"
                value={config.bindDN}
                onChange={(e) => handleConfigChange('bindDN', e.target.value)}
                placeholder="CN=ldap-service,OU=Service Accounts,DC=company,DC=com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.bindPassword}
                  onChange={(e) => handleConfigChange('bindPassword', e.target.value)}
                  placeholder="Service account password"
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>User Filter</label>
              <input
                type="text"
                value={config.userFilter}
                onChange={(e) => handleConfigChange('userFilter', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <button
                className="btn-test"
                onClick={handleTestConnection}
                disabled={status.isLoading || !config.server || !config.baseDN}
              >
                <TestTube size={16} />
                {status.isLoading ? 'Testing...' : 'Test Connection'}
              </button>
              
              <button
                className="btn-sync"
                onClick={handleSyncData}
                disabled={status.isLoading || (!status.connected && !testResults?.success)}
              >
                <RefreshCw size={16} className={status.isLoading ? 'spin' : ''} />
                {status.isLoading ? 'Syncing...' : 'Sync Data'}
              </button>
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className={`test-results ${testResults.success ? 'success' : 'error'}`}>
              {testResults.success ? (
                <CheckCircle size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              <div className="test-message">
                <strong>{testResults.success ? 'Connection Successful' : 'Connection Failed'}</strong>
                <p>{testResults.message}</p>
                {testResults.success && testResults.userCount > 0 && (
                  <p>Found {testResults.userCount} users in directory</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status & Metrics Panel */}
        <div className="ldap-status-panel">
          <h4>
            <Activity size={18} />
            RefreshCw Status & Metrics
          </h4>

          <div className="status-metrics">
            <div className="metric-card">
              <div className="metric-icon">
                <Users size={20} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{status.employeeCount.toLocaleString()}</div>
                <div className="metric-label">Total Employees</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <Clock size={20} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{formatLastSync(status.lastSync)}</div>
                <div className="metric-label">Last RefreshCw</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <Database size={20} />
              </div>
              <div className="metric-info">
                <div className="metric-value">{syncHistory.length}</div>
                <div className="metric-label">RefreshCw History</div>
              </div>
            </div>
          </div>

          {/* RefreshCw History */}
          {syncHistory.length > 0 && (
            <div className="sync-history">
              <h5>Recent RefreshCw History</h5>
              <div className="history-list">
                {syncHistory.slice(0, 5).map((sync, index) => (
                  <div key={index} className="history-item">
                    <div className="history-time">
                      {new Date(sync.timestamp).toLocaleString()}
                    </div>
                    <div className="history-details">
                      <span className="history-count">{sync.employeeCount} employees</span>
                      {sync.duration && (
                        <span className="history-duration">{sync.duration}ms</span>
                      )}
                    </div>
                    <div className={`history-status ${sync.success ? 'success' : 'failed'}`}>
                      {sync.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee Preview */}
          {employees.length > 0 && (
            <div className="employee-preview">
              <h5>Employee Data Preview</h5>
              <div className="preview-list">
                {employees.slice(0, 5).map((employee, index) => (
                  <div key={index} className="preview-item">
                    <div className="employee-avatar">
                      {employee.displayName ? employee.displayName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="employee-info">
                      <div className="employee-name">{employee.displayName || 'Unknown'}</div>
                      <div className="employee-email">{employee.mail || 'No email'}</div>
                    </div>
                    <div className="employee-department">
                      {employee.department || employee.title || 'No department'}
                    </div>
                  </div>
                ))}
                {employees.length > 5 && (
                  <div className="preview-more">
                    +{employees.length - 5} more employees
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .ldap-sync-interface {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
        }

        .ldap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .ldap-title {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .ldap-title h3 {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .ldap-status {
          display: flex;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
        }

        .status-indicator.connected {
          border-color: var(--accent-green);
          background: rgba(16, 185, 129, 0.1);
        }

        .status-indicator.disconnected {
          border-color: var(--accent-red);
          background: rgba(239, 68, 68, 0.1);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-red);
        }

        .status-indicator.connected .status-dot {
          background: var(--accent-green);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-indicator span {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .ldap-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-xl);
        }

        .ldap-config-panel,
        .ldap-status-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .ldap-config-panel h4,
        .ldap-status-panel h4 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-lg) 0;
        }

        .config-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: var(--space-md);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .form-group label {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .form-input {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          color: var(--theme-text);
          font-family: var(--font-primary);
          transition: all var(--transition-normal);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .port-input {
          width: 80px;
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: var(--space-sm);
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--theme-textSecondary);
          cursor: pointer;
          padding: var(--space-xs);
          border-radius: var(--radius-sm);
          transition: all var(--transition-normal);
        }

        .password-toggle:hover {
          color: var(--theme-text);
          background: rgba(255, 255, 255, 0.1);
        }

        .form-actions {
          display: flex;
          gap: var(--space-md);
          margin-top: var(--space-md);
        }

        .btn-test,
        .btn-sync {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md) var(--space-lg);
          border: none;
          border-radius: var(--radius-lg);
          font-family: var(--font-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .btn-test {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--theme-text);
        }

        .btn-test:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .btn-sync {
          background: var(--theme-gradient-primary);
          color: white;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-sync:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
        }

        .btn-test:disabled,
        .btn-sync:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .test-results {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          margin-top: var(--space-lg);
        }

        .test-results.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--accent-green);
        }

        .test-results.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--accent-red);
        }

        .test-message strong {
          display: block;
          margin-bottom: var(--space-sm);
        }

        .test-message p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .status-metrics {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-lg);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
        }

        .metric-card:hover {
          transform: translateY(-2px);
          border-color: var(--theme-primary);
        }

        .metric-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .metric-info {
          flex: 1;
        }

        .metric-value {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--theme-text);
          margin-bottom: var(--space-xs);
        }

        .metric-label {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .sync-history,
        .employee-preview {
          margin-top: var(--space-xl);
        }

        .sync-history h5,
        .employee-preview h5 {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 var(--space-md) 0;
        }

        .history-list,
        .preview-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-sm) var(--space-md);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
        }

        .history-time {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .history-details {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xs);
        }

        .history-count {
          color: var(--theme-text);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .history-duration {
          color: var(--theme-textSecondary);
          font-size: 0.7rem;
        }

        .history-status.success {
          color: var(--accent-green);
        }

        .history-status.failed {
          color: var(--accent-red);
        }

        .preview-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-sm);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
        }

        .employee-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .employee-info {
          flex: 1;
        }

        .employee-name {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .employee-email {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .employee-department {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          font-style: italic;
        }

        .preview-more {
          text-align: center;
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          padding: var(--space-sm);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .ldap-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-test,
          .btn-sync {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default LDAPSyncInterface