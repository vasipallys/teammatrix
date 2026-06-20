import React, { useState, useEffect } from 'react'
import { 
  Layers, 
  Target, 
  Calendar, 
  Users, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  BarChart3,
  Settings,
  Plus,
  Eye,
  EyeOff,
  TestTube,
  RefreshCw,
  FileText,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react'
import { 
  connectJira,
  testJiraConnection,
  getJiraProjects,
  syncJiraData,
  getEpics,
  getStories,
  getSprints,
  getJiraConfigs,
  createJiraConfig,
  updateJiraConfig,
  deleteJiraConfig,
  testJiraConfig,
  activateJiraConfig
} from '../api'
import { useNotifications } from './NotificationSystem'

const JiraIntegrationPanel = ({ onJiraDataLoad }) => {
  const [jiraConfig, setJiraConfig] = useState({
    configName: '',
    serverUrl: '',
    username: '',
    apiToken: '',
    projectKey: '',
    description: ''
  })

  const [showApiToken, setShowApiToken] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    tested: false,
    lastSync: null
  })

  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [epics, setEpics] = useState([])
  const [stories, setStories] = useState([])
  const [sprints, setSprints] = useState([])
  
  // Configuration management state
  const [savedConfigs, setSavedConfigs] = useState([])
  const [activeConfig, setActiveConfig] = useState(null)
  const [editingConfigId, setEditingConfigId] = useState(null)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  
  const [loading, setLoading] = useState({
    test: false,
    connect: false,
    projects: false,
    sync: false,
    epics: false,
    stories: false,
    sprints: false,
    configs: false,
    save: false,
    delete: false
  })

  const [testResults, setTestResults] = useState(null)
  const [syncStats, setSyncStats] = useState(null)
  const [showConfigForm, setShowConfigForm] = useState(false)

  const { success, error, info } = useNotifications()

  useEffect(() => {
    loadJiraConfigs()
    loadJiraProjects()
  }, [])

  // Configuration management functions
  const loadJiraConfigs = async () => {
    setLoading(prev => ({ ...prev, configs: true }))
    try {
      const response = await getJiraConfigs()
      if (response.data.success) {
        setSavedConfigs(response.data.configs || [])
        const active = response.data.configs?.find(config => config.is_active)
        if (active) {
          setActiveConfig(active)
          setConnectionStatus(prev => ({ ...prev, connected: true }))
        }
      }
    } catch (err) {
      console.warn('Could not load Jira configurations:', err)
    } finally {
      setLoading(prev => ({ ...prev, configs: false }))
    }
  }

  const handleSaveConfig = async () => {
    if (!jiraConfig.configName || !jiraConfig.serverUrl || !jiraConfig.username || !jiraConfig.apiToken) {
      error('Please fill in all required fields')
      return
    }

    setLoading(prev => ({ ...prev, save: true }))
    try {
      const configData = {
        config_name: jiraConfig.configName,
        server_url: jiraConfig.serverUrl,
        username: jiraConfig.username,
        credentials: jiraConfig.apiToken,
        additional_config: JSON.stringify({
          default_project_key: jiraConfig.projectKey,
          description: jiraConfig.description
        })
      }

      let response
      if (editingConfigId) {
        response = await updateJiraConfig(editingConfigId, configData)
        success('Configuration updated successfully')
      } else {
        response = await createJiraConfig(configData)
        success('Configuration saved successfully')
      }

      if (response.data.success) {
        await loadJiraConfigs()
        setShowConfigForm(false)
        setEditingConfigId(null)
        setJiraConfig({
          configName: '',
          serverUrl: '',
          username: '',
          apiToken: '',
          projectKey: '',
          description: ''
        })
      }
    } catch (err) {
      error(`Failed to save configuration: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(prev => ({ ...prev, save: false }))
    }
  }

  const handleDeleteConfig = async (configId) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return
    }

    setLoading(prev => ({ ...prev, delete: true }))
    try {
      await deleteJiraConfig(configId)
      success('Configuration deleted successfully')
      await loadJiraConfigs()
      
      if (activeConfig?.id === configId) {
        setActiveConfig(null)
        setConnectionStatus({ connected: false, tested: false, lastSync: null })
      }
    } catch (err) {
      error(`Failed to delete configuration: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(prev => ({ ...prev, delete: false }))
    }
  }

  const handleTestConfig = async (configId) => {
    setLoading(prev => ({ ...prev, test: true }))
    setTestResults(null)

    try {
      info('Testing Jira configuration...')
      const response = await testJiraConfig(configId)
      
      if (response.data.success) {
        setTestResults({
          success: true,
          configId: configId,
          message: response.data.message,
          projectCount: response.data.project_count || 0,
          userInfo: response.data.user_info
        })
        success(`Configuration test successful! Found ${response.data.project_count} accessible projects`)
      } else {
        throw new Error(response.data.message || 'Configuration test failed')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Configuration test failed'
      setTestResults({
        success: false,
        configId: configId,
        message: errorMsg
      })
      error(`Configuration test failed: ${errorMsg}`)
    } finally {
      setLoading(prev => ({ ...prev, test: false }))
    }
  }

  const handleActivateConfig = async (configId) => {
    setLoading(prev => ({ ...prev, connect: true }))
    try {
      info('Activating Jira configuration...')
      const response = await activateJiraConfig(configId)
      
      if (response.data.success) {
        await loadJiraConfigs()
        await loadJiraProjects()
        success('Configuration activated successfully!')
      } else {
        throw new Error(response.data.message || 'Activation failed')
      }
    } catch (err) {
      error(`Failed to activate configuration: ${err.response?.data?.message || err.message}`)
    } finally {
      setLoading(prev => ({ ...prev, connect: false }))
    }
  }

  const handleEditConfig = (config) => {
    setJiraConfig({
      configName: config.config_name,
      serverUrl: config.server_url,
      username: config.username,
      apiToken: '', // Don't populate for security
      projectKey: config.additional_config?.default_project_key || '',
      description: config.additional_config?.description || ''
    })
    setEditingConfigId(config.id)
    setShowConfigForm(true)
  }

  const loadJiraProjects = async () => {
    setLoading(prev => ({ ...prev, projects: true }))
    try {
      const response = await getJiraProjects()
      if (response.data.success) {
        setProjects(response.data.projects || [])
        setConnectionStatus(prev => ({ 
          ...prev, 
          connected: response.data.projects?.length > 0 
        }))
      }
    } catch (err) {
      console.warn('Could not load Jira projects:', err)
    } finally {
      setLoading(prev => ({ ...prev, projects: false }))
    }
  }

  const handleTestConnection = async () => {
    setLoading(prev => ({ ...prev, test: true }))
    setTestResults(null)

    try {
      info('Testing Jira connection...')
      const response = await testJiraConnection(jiraConfig)
      
      if (response.data.success) {
        setTestResults({
          success: true,
          message: response.data.message,
          projectCount: response.data.projectCount || 0,
          userInfo: response.data.userInfo
        })
        setConnectionStatus(prev => ({ ...prev, tested: true }))
        success(`Jira connection successful! Found ${response.data.projectCount} accessible projects`)
      } else {
        throw new Error(response.data.message || 'Connection test failed')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Connection test failed'
      setTestResults({
        success: false,
        message: errorMsg
      })
      setConnectionStatus(prev => ({ ...prev, tested: false }))
      error(`Jira connection failed: ${errorMsg}`)
    } finally {
      setLoading(prev => ({ ...prev, test: false }))
    }
  }

  const handleConnectJira = async () => {
    setLoading(prev => ({ ...prev, connect: true }))
    
    try {
      info('Connecting to Jira...')
      const response = await connectJira(jiraConfig)
      
      if (response.data.success) {
        setConnectionStatus({
          connected: true,
          tested: true,
          lastSync: null
        })
        setShowConfigForm(false)
        await loadJiraProjects()
        success('Successfully connected to Jira!')
      } else {
        throw new Error(response.data.message || 'Connection failed')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Connection failed'
      error(`Jira connection failed: ${errorMsg}`)
    } finally {
      setLoading(prev => ({ ...prev, connect: false }))
    }
  }

  const handleSyncProject = async (projectKey) => {
    setLoading(prev => ({ ...prev, sync: true }))
    
    try {
      info(`Syncing Jira project: ${projectKey}`)
      const response = await syncJiraData(projectKey)
      
      if (response.data.success) {
        setSyncStats(response.data.stats)
        setConnectionStatus(prev => ({ 
          ...prev, 
          lastSync: new Date() 
        }))
        
        if (onJiraDataLoad) {
          onJiraDataLoad(response.data)
        }
        
        success(`Project sync completed! ${response.data.stats.epics} epics, ${response.data.stats.stories} stories`)
        
        // Reload project data if this is the selected project
        if (selectedProject?.key === projectKey) {
          await loadProjectDetails(selectedProject)
        }
      } else {
        throw new Error(response.data.message || 'Sync failed')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Sync failed'
      error(`Project sync failed: ${errorMsg}`)
    } finally {
      setLoading(prev => ({ ...prev, sync: false }))
    }
  }

  const loadProjectDetails = async (project) => {
    setSelectedProject(project)
    setLoading(prev => ({ 
      ...prev, 
      epics: true, 
      stories: true, 
      sprints: true 
    }))

    try {
      // Load epics
      const epicsResponse = await getEpics(project.key)
      if (epicsResponse.data.success) {
        setEpics(epicsResponse.data.epics || [])
      }
      setLoading(prev => ({ ...prev, epics: false }))

      // Load stories
      const storiesResponse = await getStories()
      if (storiesResponse.data.success) {
        const projectStories = storiesResponse.data.stories?.filter(
          story => story.project_key === project.key
        ) || []
        setStories(projectStories)
      }
      setLoading(prev => ({ ...prev, stories: false }))

      // Load sprints
      const sprintsResponse = await getSprints(project.key)
      if (sprintsResponse.data.success) {
        setSprints(sprintsResponse.data.sprints || [])
      }
      setLoading(prev => ({ ...prev, sprints: false }))

    } catch (err) {
      error('Failed to load project details')
      setLoading(prev => ({ 
        ...prev, 
        epics: false, 
        stories: false, 
        sprints: false 
      }))
    }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      'to do': '#6b7280',
      'in progress': '#3b82f6',
      'done': '#10b981',
      'closed': '#6b7280',
      'resolved': '#10b981',
      'blocked': '#ef4444'
    }
    return statusColors[status?.toLowerCase()] || '#6b7280'
  }

  const getPriorityColor = (priority) => {
    const priorityColors = {
      'highest': '#dc2626',
      'high': '#ea580c',
      'medium': '#ca8a04',
      'low': '#16a34a',
      'lowest': '#0891b2'
    }
    return priorityColors[priority?.toLowerCase()] || '#6b7280'
  }

  const formatLastSync = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const syncDate = new Date(date)
    const diffMs = now - syncDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return syncDate.toLocaleDateString()
  }

  return (
    <div className="jira-integration-panel">
      <div className="jira-header">
        <div className="jira-title">
          <Layers size={24} />
          <h3>Jira Integration</h3>
        </div>
        <div className="header-actions">
          <div className={`connection-status ${connectionStatus.connected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span>
              {connectionStatus.connected && activeConfig 
                ? `Connected: ${activeConfig.config_name}` 
                : 'Disconnected'
              }
            </span>
          </div>
          <button 
            className="btn-settings" 
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
          >
            <Settings size={16} />
            Settings
          </button>
          {!connectionStatus.connected && (
            <button 
              className="btn-configure" 
              onClick={() => {
                setEditingConfigId(null)
                setJiraConfig({
                  configName: '',
                  serverUrl: '',
                  username: '',
                  apiToken: '',
                  projectKey: '',
                  description: ''
                })
                setShowConfigForm(!showConfigForm)
              }}
            >
              <Plus size={16} />
              Add Configuration
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettingsPanel && (
        <div className="settings-panel">
          <div className="settings-header">
            <h4>Jira Configuration Settings</h4>
            <button 
              className="btn-close" 
              onClick={() => setShowSettingsPanel(false)}
            >
              ×
            </button>
          </div>

          <div className="settings-content">
            {/* Add New Configuration Button */}
            <div className="settings-section">
              <div className="section-title">
                <h5>Manage Configurations</h5>
                <button
                  className="btn-add-config"
                  onClick={() => {
                    setEditingConfigId(null)
                    setJiraConfig({
                      configName: '',
                      serverUrl: '',
                      username: '',
                      apiToken: '',
                      projectKey: '',
                      description: ''
                    })
                    setShowConfigForm(true)
                  }}
                >
                  <Plus size={14} />
                  Add New
                </button>
              </div>

              {/* Configuration List */}
              {loading.configs ? (
                <div className="loading-configs">
                  <div className="loading-spinner"></div>
                  <p>Loading configurations...</p>
                </div>
              ) : savedConfigs.length === 0 ? (
                <div className="no-configs">
                  <Settings size={32} />
                  <p>No configurations found</p>
                  <button
                    className="btn-create-first"
                    onClick={() => {
                      setEditingConfigId(null)
                      setJiraConfig({
                        configName: '',
                        serverUrl: '',
                        username: '',
                        apiToken: '',
                        projectKey: '',
                        description: ''
                      })
                      setShowConfigForm(true)
                    }}
                  >
                    Create Your First Configuration
                  </button>
                </div>
              ) : (
                <div className="config-list">
                  {savedConfigs.map((config) => (
                    <div key={config.id} className={`config-item ${config.is_active ? 'active' : ''}`}>
                      <div className="config-info">
                        <div className="config-main">
                          <div className="config-name">{config.config_name}</div>
                          <div className="config-url">{config.server_url}</div>
                          <div className="config-user">{config.username}</div>
                        </div>
                        {config.additional_config?.description && (
                          <div className="config-description">{config.additional_config.description}</div>
                        )}
                        <div className="config-meta">
                          <span className={`status-badge ${config.is_active ? 'active' : 'inactive'}`}>
                            {config.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {config.last_tested && (
                            <span className="last-tested">
                              Last tested: {new Date(config.last_tested).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="config-actions">
                        <button
                          className="btn-test-config"
                          onClick={() => handleTestConfig(config.id)}
                          disabled={loading.test}
                          title="Test connection"
                        >
                          <TestTube size={14} />
                        </button>
                        
                        {!config.is_active && (
                          <button
                            className="btn-activate"
                            onClick={() => handleActivateConfig(config.id)}
                            disabled={loading.connect}
                            title="Activate configuration"
                          >
                            <Play size={14} />
                          </button>
                        )}
                        
                        <button
                          className="btn-edit-config"
                          onClick={() => handleEditConfig(config)}
                          title="Edit configuration"
                        >
                          <Settings size={14} />
                        </button>
                        
                        <button
                          className="btn-delete-config"
                          onClick={() => handleDeleteConfig(config.id)}
                          disabled={loading.delete || config.is_active}
                          title="Delete configuration"
                        >
                          <AlertTriangle size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Results */}
            {testResults && (
              <div className="settings-section">
                <h5>Connection Test Results</h5>
                <div className={`test-results ${testResults.success ? 'success' : 'error'}`}>
                  {testResults.success ? (
                    <CheckCircle size={16} />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                  <div className="test-message">
                    <strong>{testResults.success ? 'Connection Successful' : 'Connection Failed'}</strong>
                    <p>{testResults.message}</p>
                    {testResults.success && testResults.projectCount && (
                      <p>Found {testResults.projectCount} accessible projects</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Form */}
      {showConfigForm && (
        <div className="jira-config-form">
          <div className="config-header">
            <h4>{editingConfigId ? 'Edit Configuration' : 'Add New Configuration'}</h4>
            <button 
              className="btn-close" 
              onClick={() => {
                setShowConfigForm(false)
                setEditingConfigId(null)
                setTestResults(null)
              }}
            >
              ×
            </button>
          </div>

          <div className="config-grid">
            <div className="form-group full-width">
              <label>Configuration Name *</label>
              <input
                type="text"
                value={jiraConfig.configName}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, configName: e.target.value }))}
                placeholder="My Jira Server"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Jira Server URL *</label>
              <input
                type="url"
                value={jiraConfig.serverUrl}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, serverUrl: e.target.value }))}
                placeholder="https://company.atlassian.net"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Username/Email *</label>
              <input
                type="email"
                value={jiraConfig.username}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="your.email@company.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>API Token *</label>
              <div className="password-input-wrapper">
                <input
                  type={showApiToken ? 'text' : 'password'}
                  value={jiraConfig.apiToken}
                  onChange={(e) => setJiraConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                  placeholder={editingConfigId ? "Leave empty to keep current token" : "Your Jira API token"}
                  className="form-input"
                  required={!editingConfigId}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowApiToken(!showApiToken)}
                >
                  {showApiToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Default Project Key</label>
              <input
                type="text"
                value={jiraConfig.projectKey}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, projectKey: e.target.value }))}
                placeholder="PROJ"
                className="form-input"
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={jiraConfig.description}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this configuration"
                className="form-textarea"
                rows={2}
              />
            </div>
          </div>

          <div className="config-actions">
            <button
              className="btn-test"
              onClick={() => {
                if (!jiraConfig.serverUrl || !jiraConfig.username || !jiraConfig.apiToken) {
                  error('Please fill in required fields before testing')
                  return
                }
                handleTestConnection()
              }}
              disabled={loading.test}
            >
              <TestTube size={16} />
              {loading.test ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              className="btn-save"
              onClick={handleSaveConfig}
              disabled={loading.save}
            >
              <CheckCircle size={16} />
              {loading.save ? 'Saving...' : editingConfigId ? 'Update' : 'Save'}
            </button>
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
                {testResults.success && testResults.projectCount && (
                  <p>Found {testResults.projectCount} accessible projects</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="jira-content">
        {/* Projects Overview */}
        <div className="projects-section">
          <div className="section-header">
            <h4>
              <Target size={18} />
              Jira Projects ({projects.length})
            </h4>
            {connectionStatus.lastSync && (
              <div className="last-sync">
                <Clock size={14} />
                Last sync: {formatLastSync(connectionStatus.lastSync)}
              </div>
            )}
          </div>

          {loading.projects ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <Target size={48} />
              <h5>No projects found</h5>
              <p>Configure your Jira connection to start tracking project data</p>
            </div>
          ) : (
            <div className="project-cards">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                  onClick={() => loadProjectDetails(project)}
                >
                  <div className="project-header">
                    <div className="project-info">
                      <div className="project-key">{project.key}</div>
                      <div className="project-name">{project.name}</div>
                    </div>
                    <button
                      className="btn-sync-project"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSyncProject(project.key)
                      }}
                      disabled={loading.sync}
                      title="Sync project data"
                    >
                      <RefreshCw size={14} className={loading.sync ? 'spin' : ''} />
                    </button>
                  </div>

                  <div className="project-stats">
                    <div className="stat">
                      <FileText size={12} />
                      <span>{project.issueCount || 0} issues</span>
                    </div>
                    <div className="stat">
                      <Zap size={12} />
                      <span>{project.epicCount || 0} epics</span>
                    </div>
                    <div className="stat">
                      <Users size={12} />
                      <span>{project.teamSize || 0} members</span>
                    </div>
                  </div>

                  {project.lead && (
                    <div className="project-lead">
                      Lead: {project.lead.displayName || project.lead.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Details */}
        {selectedProject && (
          <div className="project-details">
            <div className="details-header">
              <div className="project-title">
                <h4>{selectedProject.key} - {selectedProject.name}</h4>
                <p>{selectedProject.description}</p>
              </div>
            </div>

            {/* Sync Stats */}
            {syncStats && (
              <div className="sync-stats">
                <h5>
                  <Activity size={16} />
                  Last Sync Results
                </h5>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{syncStats.epics}</div>
                    <div className="stat-label">Epics</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{syncStats.stories}</div>
                    <div className="stat-label">Stories</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{syncStats.sprints}</div>
                    <div className="stat-label">Sprints</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{syncStats.duration}ms</div>
                    <div className="stat-label">Duration</div>
                  </div>
                </div>
              </div>
            )}

            {/* Epics */}
            <div className="epics-section">
              <h5>
                <Zap size={16} />
                Epics ({epics.length})
              </h5>
              {loading.epics ? (
                <div className="loading-inline">Loading epics...</div>
              ) : epics.length === 0 ? (
                <div className="empty-inline">No epics found</div>
              ) : (
                <div className="epic-list">
                  {epics.slice(0, 5).map((epic) => (
                    <div key={epic.epic_id} className="epic-item">
                      <div className="epic-info">
                        <div className="epic-key">{epic.epic_key}</div>
                        <div className="epic-name">{epic.epic_name}</div>
                        <div className="epic-meta">
                          <span 
                            className="epic-status"
                            style={{ color: getStatusColor(epic.epic_status) }}
                          >
                            {epic.epic_status}
                          </span>
                          <span className="epic-assignee">{epic.assignee}</span>
                        </div>
                      </div>
                      <div className="epic-progress">
                        <div className="story-points">{epic.story_points || 0} SP</div>
                        <div className="completion-badge">{epic.completion_percentage || 0}%</div>
                      </div>
                    </div>
                  ))}
                  {epics.length > 5 && (
                    <div className="show-more">+{epics.length - 5} more epics</div>
                  )}
                </div>
              )}
            </div>

            {/* Stories */}
            <div className="stories-section">
              <h5>
                <FileText size={16} />
                Stories ({stories.length})
              </h5>
              {loading.stories ? (
                <div className="loading-inline">Loading stories...</div>
              ) : stories.length === 0 ? (
                <div className="empty-inline">No stories found</div>
              ) : (
                <div className="story-list">
                  {stories.slice(0, 5).map((story) => (
                    <div key={story.story_id} className="story-item">
                      <div className="story-info">
                        <div className="story-key">{story.story_key}</div>
                        <div className="story-summary">{story.summary}</div>
                        <div className="story-meta">
                          <span 
                            className="story-status"
                            style={{ color: getStatusColor(story.status) }}
                          >
                            {story.status}
                          </span>
                          <span 
                            className="story-priority"
                            style={{ color: getPriorityColor(story.priority) }}
                          >
                            {story.priority}
                          </span>
                          <span className="story-assignee">{story.assignee_id}</span>
                        </div>
                      </div>
                      <div className="story-points">
                        {story.story_points || 0} SP
                      </div>
                    </div>
                  ))}
                  {stories.length > 5 && (
                    <div className="show-more">+{stories.length - 5} more stories</div>
                  )}
                </div>
              )}
            </div>

            {/* Sprints */}
            <div className="sprints-section">
              <h5>
                <Calendar size={16} />
                Sprints ({sprints.length})
              </h5>
              {loading.sprints ? (
                <div className="loading-inline">Loading sprints...</div>
              ) : sprints.length === 0 ? (
                <div className="empty-inline">No sprints found</div>
              ) : (
                <div className="sprint-list">
                  {sprints.slice(0, 3).map((sprint) => (
                    <div key={sprint.sprint_id} className="sprint-item">
                      <div className="sprint-info">
                        <div className="sprint-name">{sprint.sprint_name}</div>
                        <div className="sprint-dates">
                          {new Date(sprint.start_date).toLocaleDateString()} - 
                          {new Date(sprint.end_date).toLocaleDateString()}
                        </div>
                        <div className="sprint-goal">{sprint.goal}</div>
                      </div>
                      <div className="sprint-stats">
                        <div className="sprint-velocity">
                          <BarChart3 size={14} />
                          <span>{sprint.velocity || 0} velocity</span>
                        </div>
                        <div className="sprint-completion">
                          {sprint.completed_points || 0} / {sprint.commitment || 0} SP
                        </div>
                      </div>
                    </div>
                  ))}
                  {sprints.length > 3 && (
                    <div className="show-more">+{sprints.length - 3} more sprints</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .jira-integration-panel {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
        }

        .jira-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .jira-title {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .jira-title h3 {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
        }

        .connection-status.connected {
          border-color: var(--accent-green);
          background: rgba(16, 185, 129, 0.1);
        }

        .connection-status.disconnected {
          border-color: var(--accent-red);
          background: rgba(239, 68, 68, 0.1);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-red);
        }

        .connection-status.connected .status-dot {
          background: var(--accent-green);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .connection-status span {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .btn-configure {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--theme-gradient-primary);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-family: var(--font-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-configure:hover {
          transform: translateY(-2px);
        }

        .btn-settings {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--theme-text);
          border-radius: var(--radius-lg);
          font-family: var(--font-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-settings:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .settings-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 600px;
          height: 100vh;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border-left: 1px solid var(--glass-border);
          z-index: 1000;
          overflow-y: auto;
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-xl);
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .settings-header h4 {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .settings-content {
          padding: var(--space-xl);
        }

        .settings-section {
          margin-bottom: var(--space-2xl);
        }

        .settings-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .section-title h5 {
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .btn-add-config {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-sm) var(--space-md);
          background: var(--theme-gradient-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-add-config:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .loading-configs,
        .no-configs {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl);
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-lg);
        }

        .no-configs svg {
          color: var(--theme-textSecondary);
          margin-bottom: var(--space-md);
        }

        .no-configs p {
          color: var(--theme-textSecondary);
          margin: 0 0 var(--space-lg) 0;
        }

        .btn-create-first {
          padding: var(--space-md) var(--space-lg);
          background: var(--theme-gradient-primary);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-create-first:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .config-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .config-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
        }

        .config-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--theme-primary);
        }

        .config-item.active {
          border-color: var(--accent-green);
          background: rgba(16, 185, 129, 0.1);
        }

        .config-info {
          flex: 1;
        }

        .config-main {
          margin-bottom: var(--space-sm);
        }

        .config-name {
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .config-url {
          color: var(--theme-primary);
          font-family: var(--font-mono);
          font-size: 0.85rem;
          margin-bottom: var(--space-xs);
        }

        .config-user {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .config-description {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          font-style: italic;
          margin: var(--space-sm) 0;
        }

        .config-meta {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-top: var(--space-sm);
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.active {
          background: var(--accent-green);
          color: white;
        }

        .status-badge.inactive {
          background: rgba(107, 114, 128, 0.2);
          color: var(--theme-textSecondary);
        }

        .last-tested {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .config-actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .btn-test-config,
        .btn-activate,
        .btn-edit-config,
        .btn-delete-config {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          background: transparent;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-test-config {
          color: var(--theme-textSecondary);
        }

        .btn-test-config:hover:not(:disabled) {
          color: var(--theme-primary);
          border-color: var(--theme-primary);
          background: rgba(59, 130, 246, 0.1);
        }

        .btn-activate {
          color: var(--accent-green);
        }

        .btn-activate:hover:not(:disabled) {
          border-color: var(--accent-green);
          background: rgba(16, 185, 129, 0.1);
        }

        .btn-edit-config {
          color: var(--theme-textSecondary);
        }

        .btn-edit-config:hover {
          color: var(--theme-text);
          border-color: var(--theme-text);
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-delete-config {
          color: var(--accent-red);
        }

        .btn-delete-config:hover:not(:disabled) {
          border-color: var(--accent-red);
          background: rgba(239, 68, 68, 0.1);
        }

        .btn-test-config:disabled,
        .btn-activate:disabled,
        .btn-delete-config:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .jira-config-form {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-xl);
        }

        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .config-header h4 {
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
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

        .config-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .form-group.full-width {
          grid-column: 1 / -1;
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

        .form-textarea {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          color: var(--theme-text);
          font-family: var(--font-primary);
          resize: vertical;
          min-height: 60px;
          transition: all var(--transition-normal);
        }

        .form-textarea:focus {
          outline: none;
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
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

        .config-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-md);
        }

        .btn-test,
        .btn-connect,
        .btn-save {
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

        .btn-connect,
        .btn-save {
          background: var(--theme-gradient-primary);
          color: white;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-connect:hover:not(:disabled),
        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
        }

        .btn-test:disabled,
        .btn-connect:disabled,
        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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

        .jira-content {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: var(--space-xl);
          min-height: 600px;
        }

        .projects-section,
        .project-details {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .section-header h4 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .last-sync {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl);
          text-align: center;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--glass-border);
          border-top: 3px solid var(--theme-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--space-md);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .empty-state svg {
          color: var(--theme-textSecondary);
          margin-bottom: var(--space-md);
        }

        .empty-state h5 {
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-sm) 0;
        }

        .empty-state p {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          margin: 0;
        }

        .project-cards {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .project-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .project-card:hover {
          transform: translateY(-2px);
          border-color: var(--theme-primary);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .project-card.selected {
          border-color: var(--theme-primary);
          background: rgba(59, 130, 246, 0.05);
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-md);
        }

        .project-key {
          color: var(--theme-primary);
          font-family: var(--font-mono);
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .project-name {
          color: var(--theme-text);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .btn-sync-project {
          background: transparent;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-xs);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-sync-project:hover:not(:disabled) {
          color: var(--theme-text);
          border-color: var(--theme-primary);
        }

        .btn-sync-project:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        .project-stats {
          display: flex;
          gap: var(--space-lg);
          margin-bottom: var(--space-md);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .project-lead {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          font-style: italic;
        }

        .project-details {
          overflow-y: auto;
        }

        .details-header {
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .project-title h4 {
          color: var(--theme-text);
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 var(--space-sm) 0;
        }

        .project-title p {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          margin: 0;
          line-height: 1.5;
        }

        .sync-stats,
        .epics-section,
        .stories-section,
        .sprints-section {
          margin-bottom: var(--space-xl);
        }

        .sync-stats h5,
        .epics-section h5,
        .stories-section h5,
        .sprints-section h5 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 var(--space-md) 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-md);
        }

        .stat-item {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          text-align: center;
        }

        .stat-value {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: var(--space-xs);
        }

        .stat-label {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .epic-list,
        .story-list,
        .sprint-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .epic-item,
        .story-item,
        .sprint-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
        }

        .epic-info,
        .story-info,
        .sprint-info {
          flex: 1;
        }

        .epic-key,
        .story-key {
          color: var(--theme-primary);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .epic-name,
        .story-summary,
        .sprint-name {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: var(--space-xs);
          line-height: 1.4;
        }

        .epic-meta,
        .story-meta,
        .sprint-dates {
          display: flex;
          gap: var(--space-md);
          font-size: 0.75rem;
          color: var(--theme-textSecondary);
        }

        .epic-status,
        .story-status {
          font-weight: 600;
        }

        .epic-progress,
        .story-points {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--space-xs);
        }

        .story-points {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .completion-badge {
          background: var(--theme-gradient-primary);
          color: white;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 600;
        }

        .sprint-goal {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          font-style: italic;
          margin-top: var(--space-xs);
        }

        .sprint-stats {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--space-xs);
        }

        .sprint-velocity {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .sprint-completion {
          color: var(--theme-text);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .loading-inline,
        .empty-inline {
          text-align: center;
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          padding: var(--space-lg);
          font-style: italic;
        }

        .show-more {
          text-align: center;
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          padding: var(--space-sm);
          font-style: italic;
          border-top: 1px solid var(--glass-border);
          margin-top: var(--space-sm);
          padding-top: var(--space-md);
        }

        @media (max-width: 1200px) {
          .jira-content {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .config-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .project-stats {
            flex-wrap: wrap;
          }

          .config-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default JiraIntegrationPanel