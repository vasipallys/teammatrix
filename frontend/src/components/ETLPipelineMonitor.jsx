import React, { useState, useEffect } from 'react'
import { 
  Database, 
  Activity, 
  Play, 
  Pause, 
  Square, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Zap,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Settings,
  Eye,
  Download,
  Upload,
  ArrowRight,
  AlertCircle,
  Info,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network
} from 'lucide-react'
import {
  getPipelineStatus,
  triggerETLJob,
  getETLJobHistory,
  getDataSourceStatus
} from '../api'
import { useNotifications } from './NotificationSystem'

const ETLPipelineMonitor = ({ onPipelineUpdate }) => {
  const [pipelineStatus, setPipelineStatus] = useState(null)
  const [jobHistory, setJobHistory] = useState([])
  const [dataSourceStatus, setDataSourceStatus] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [filterStatus, setFilterStatus] = useState('all') // all, running, success, failed

  const [loading, setLoading] = useState({
    pipeline: false,
    history: false,
    sources: false,
    trigger: {}
  })

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(null)

  const { success, error, info, warning } = useNotifications()

  useEffect(() => {
    loadPipelineData()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadPipelineStatus()
      }, 30000) // Refresh every 30 seconds
      
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [autoRefresh, selectedTimeRange])

  const loadPipelineData = async () => {
    await Promise.all([
      loadPipelineStatus(),
      loadJobHistory(),
      loadDataSourceStatus()
    ])
  }

  const loadPipelineStatus = async () => {
    setLoading(prev => ({ ...prev, pipeline: true }))
    try {
      const response = await getPipelineStatus()
      if (response.data.success) {
        setPipelineStatus(response.data.status)
        
        if (onPipelineUpdate) {
          onPipelineUpdate(response.data.status)
        }
      } else {
        throw new Error(response.data.message || 'Failed to load pipeline status')
      }
    } catch (err) {
      error('Failed to load pipeline status')
    } finally {
      setLoading(prev => ({ ...prev, pipeline: false }))
    }
  }

  const loadJobHistory = async () => {
    setLoading(prev => ({ ...prev, history: true }))
    try {
      const response = await getETLJobHistory({
        timeRange: selectedTimeRange,
        status: filterStatus !== 'all' ? filterStatus : undefined
      })
      if (response.data.success) {
        setJobHistory(response.data.jobs || [])
      }
    } catch (err) {
      console.warn('Could not load job history:', err)
    } finally {
      setLoading(prev => ({ ...prev, history: false }))
    }
  }

  const loadDataSourceStatus = async () => {
    setLoading(prev => ({ ...prev, sources: true }))
    try {
      const response = await getDataSourceStatus()
      if (response.data.success) {
        setDataSourceStatus(response.data.sources || [])
      }
    } catch (err) {
      console.warn('Could not load data source status:', err)
    } finally {
      setLoading(prev => ({ ...prev, sources: false }))
    }
  }

  const handleTriggerJob = async (jobType) => {
    setLoading(prev => ({ ...prev, trigger: { ...prev.trigger, [jobType]: true } }))
    try {
      info(`Starting ${jobType} job...`)
      const response = await triggerETLJob(jobType)
      
      if (response.data.success) {
        success(`${jobType} job started successfully`)
        // Refresh pipeline status and job history
        await loadPipelineData()
      } else {
        throw new Error(response.data.message || 'Failed to start job')
      }
    } catch (err) {
      error(`Failed to start ${jobType} job: ${err.message}`)
    } finally {
      setLoading(prev => ({ ...prev, trigger: { ...prev.trigger, [jobType]: false } }))
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'in_progress': return 'var(--accent-blue)'
      case 'success':
      case 'completed': return 'var(--accent-green)'
      case 'failed':
      case 'error': return 'var(--accent-red)'
      case 'paused':
      case 'stopped': return 'var(--accent-yellow)'
      case 'pending':
      case 'queued': return 'var(--accent-gray)'
      default: return 'var(--theme-textSecondary)'
    }
  }

  const getStatusIcon = (status, size = 16) => {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'in_progress': return <Play size={size} />
      case 'success':
      case 'completed': return <CheckCircle size={size} />
      case 'failed':
      case 'error': return <XCircle size={size} />
      case 'paused':
      case 'stopped': return <Pause size={size} />
      case 'pending':
      case 'queued': return <Clock size={size} />
      default: return <AlertCircle size={size} />
    }
  }

  const formatDuration = (milliseconds) => {
    if (!milliseconds) return 'N/A'
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const calculateThroughput = (recordsProcessed, durationMs) => {
    if (!recordsProcessed || !durationMs) return 0
    return Math.round((recordsProcessed / (durationMs / 1000)) * 100) / 100
  }

  const getHealthScore = (source) => {
    let score = 100
    if (source.status !== 'healthy') score -= 30
    if (source.lastSync && (new Date() - new Date(source.lastSync)) > 86400000) score -= 20 // 24h
    if (source.errorRate > 5) score -= 25
    if (source.latency > 1000) score -= 15
    return Math.max(0, score)
  }

  const filteredJobs = jobHistory.filter(job => {
    if (filterStatus === 'all') return true
    return job.status?.toLowerCase() === filterStatus.toLowerCase()
  })

  return (
    <div className="etl-pipeline-monitor">
      <div className="monitor-header">
        <div className="monitor-title">
          <Database size={24} />
          <h3>ETL Pipeline Monitor</h3>
        </div>
        <div className="header-actions">
          <div className="auto-refresh-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              Auto-refresh
            </label>
          </div>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button 
            className="btn-refresh" 
            onClick={loadPipelineData}
            disabled={loading.pipeline}
          >
            <RefreshCw size={16} className={loading.pipeline ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading.pipeline && !pipelineStatus ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading pipeline status...</p>
        </div>
      ) : (
        <div className="monitor-content">
          {/* Pipeline Overview */}
          {pipelineStatus && (
            <div className="pipeline-overview">
              <div className="overview-header">
                <h4>Pipeline Overview</h4>
                <div className="pipeline-health">
                  <div 
                    className="health-indicator"
                    style={{ color: getStatusColor(pipelineStatus.overallHealth) }}
                  >
                    {getStatusIcon(pipelineStatus.overallHealth, 18)}
                    <span>{pipelineStatus.overallHealth || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="pipeline-metrics">
                <div className="metric-card">
                  <div className="metric-icon">
                    <Activity size={24} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{pipelineStatus.activeJobs || 0}</div>
                    <div className="metric-label">Active Jobs</div>
                    <div className="metric-trend">
                      {pipelineStatus.queuedJobs || 0} queued
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <CheckCircle size={24} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{pipelineStatus.successRate || 0}%</div>
                    <div className="metric-label">Success Rate</div>
                    <div className="metric-trend">
                      Last 24h
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <Database size={24} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">
                      {(pipelineStatus.recordsProcessed || 0).toLocaleString()}
                    </div>
                    <div className="metric-label">Records Processed</div>
                    <div className="metric-trend">
                      {formatTimestamp(pipelineStatus.lastUpdate)}
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <Clock size={24} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">
                      {formatDuration(pipelineStatus.avgExecutionTime)}
                    </div>
                    <div className="metric-label">Avg Execution Time</div>
                    <div className="metric-trend">
                      {calculateThroughput(
                        pipelineStatus.recordsProcessed,
                        pipelineStatus.avgExecutionTime
                      )} rec/sec
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="monitor-grid">
            {/* Data Source Status */}
            <div className="data-sources-panel">
              <div className="panel-header">
                <h4>
                  <Server size={18} />
                  Data Source Health
                </h4>
              </div>

              {loading.sources ? (
                <div className="loading-inline">Loading data sources...</div>
              ) : dataSourceStatus.length === 0 ? (
                <div className="empty-inline">No data sources configured</div>
              ) : (
                <div className="source-list">
                  {dataSourceStatus.map((source, index) => (
                    <div key={index} className="source-item">
                      <div className="source-header">
                        <div className="source-info">
                          <div className="source-icon">
                            {source.type === 'ldap' ? <Server size={16} /> :
                             source.type === 'git' ? <HardDrive size={16} /> :
                             source.type === 'jira' ? <Zap size={16} /> :
                             <Database size={16} />}
                          </div>
                          <div className="source-details">
                            <div className="source-name">{source.name}</div>
                            <div className="source-type">{source.type.toUpperCase()}</div>
                          </div>
                        </div>
                        <div 
                          className="source-status"
                          style={{ color: getStatusColor(source.status) }}
                        >
                          {getStatusIcon(source.status, 14)}
                          <span>{source.status}</span>
                        </div>
                      </div>

                      <div className="source-metrics">
                        <div className="source-metric">
                          <div className="metric-name">Health Score</div>
                          <div 
                            className="metric-value"
                            style={{ color: getStatusColor(getHealthScore(source) > 80 ? 'success' : 'warning') }}
                          >
                            {getHealthScore(source)}%
                          </div>
                        </div>
                        <div className="source-metric">
                          <div className="metric-name">Last Sync</div>
                          <div className="metric-value">{formatTimestamp(source.lastSync)}</div>
                        </div>
                        <div className="source-metric">
                          <div className="metric-name">Records</div>
                          <div className="metric-value">{(source.recordCount || 0).toLocaleString()}</div>
                        </div>
                        <div className="source-metric">
                          <div className="metric-name">Error Rate</div>
                          <div 
                            className="metric-value"
                            style={{ color: getStatusColor(source.errorRate > 5 ? 'error' : 'success') }}
                          >
                            {source.errorRate || 0}%
                          </div>
                        </div>
                      </div>

                      {source.lastError && (
                        <div className="source-error">
                          <AlertCircle size={12} />
                          <span>{source.lastError}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Job Controls */}
            <div className="job-controls-panel">
              <div className="panel-header">
                <h4>
                  <Play size={18} />
                  Job Controls
                </h4>
              </div>

              <div className="job-triggers">
                <div className="job-trigger">
                  <div className="trigger-info">
                    <div className="trigger-name">Full Data Sync</div>
                    <div className="trigger-description">Complete synchronization of all data sources</div>
                  </div>
                  <button 
                    className="btn-trigger"
                    onClick={() => handleTriggerJob('full-sync')}
                    disabled={loading.trigger['full-sync']}
                  >
                    {loading.trigger['full-sync'] ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        Start
                      </>
                    )}
                  </button>
                </div>

                <div className="job-trigger">
                  <div className="trigger-info">
                    <div className="trigger-name">Incremental Sync</div>
                    <div className="trigger-description">Sync only recent changes and new records</div>
                  </div>
                  <button 
                    className="btn-trigger"
                    onClick={() => handleTriggerJob('incremental-sync')}
                    disabled={loading.trigger['incremental-sync']}
                  >
                    {loading.trigger['incremental-sync'] ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        Start
                      </>
                    )}
                  </button>
                </div>

                <div className="job-trigger">
                  <div className="trigger-info">
                    <div className="trigger-name">Data Validation</div>
                    <div className="trigger-description">Validate data integrity and relationships</div>
                  </div>
                  <button 
                    className="btn-trigger"
                    onClick={() => handleTriggerJob('validation')}
                    disabled={loading.trigger['validation']}
                  >
                    {loading.trigger['validation'] ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        Start
                      </>
                    )}
                  </button>
                </div>

                <div className="job-trigger">
                  <div className="trigger-info">
                    <div className="trigger-name">Analytics Refresh</div>
                    <div className="trigger-description">Rebuild analytics models and cache</div>
                  </div>
                  <button 
                    className="btn-trigger"
                    onClick={() => handleTriggerJob('analytics-refresh')}
                    disabled={loading.trigger['analytics-refresh']}
                  >
                    {loading.trigger['analytics-refresh'] ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <BarChart3 size={14} />
                        Start
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* System Resources */}
            {pipelineStatus?.systemResources && (
              <div className="system-resources-panel">
                <div className="panel-header">
                  <h4>
                    <Cpu size={18} />
                    System Resources
                  </h4>
                </div>

                <div className="resource-metrics">
                  <div className="resource-item">
                    <div className="resource-header">
                      <Cpu size={16} />
                      <span>CPU Usage</span>
                      <span className="resource-value">{pipelineStatus.systemResources.cpuUsage || 0}%</span>
                    </div>
                    <div className="resource-bar">
                      <div 
                        className="resource-fill"
                        style={{ 
                          width: `${pipelineStatus.systemResources.cpuUsage || 0}%`,
                          backgroundColor: getStatusColor(
                            pipelineStatus.systemResources.cpuUsage > 80 ? 'error' : 
                            pipelineStatus.systemResources.cpuUsage > 60 ? 'warning' : 'success'
                          )
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="resource-item">
                    <div className="resource-header">
                      <MemoryStick size={16} />
                      <span>Memory Usage</span>
                      <span className="resource-value">{pipelineStatus.systemResources.memoryUsage || 0}%</span>
                    </div>
                    <div className="resource-bar">
                      <div 
                        className="resource-fill"
                        style={{ 
                          width: `${pipelineStatus.systemResources.memoryUsage || 0}%`,
                          backgroundColor: getStatusColor(
                            pipelineStatus.systemResources.memoryUsage > 80 ? 'error' : 
                            pipelineStatus.systemResources.memoryUsage > 60 ? 'warning' : 'success'
                          )
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="resource-item">
                    <div className="resource-header">
                      <HardDrive size={16} />
                      <span>Disk Usage</span>
                      <span className="resource-value">{pipelineStatus.systemResources.diskUsage || 0}%</span>
                    </div>
                    <div className="resource-bar">
                      <div 
                        className="resource-fill"
                        style={{ 
                          width: `${pipelineStatus.systemResources.diskUsage || 0}%`,
                          backgroundColor: getStatusColor(
                            pipelineStatus.systemResources.diskUsage > 80 ? 'error' : 
                            pipelineStatus.systemResources.diskUsage > 60 ? 'warning' : 'success'
                          )
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="resource-item">
                    <div className="resource-header">
                      <Network size={16} />
                      <span>Network I/O</span>
                      <span className="resource-value">
                        {((pipelineStatus.systemResources.networkIO || 0) / 1024 / 1024).toFixed(1)} MB/s
                      </span>
                    </div>
                    <div className="network-details">
                      <div className="network-stat">
                        ↑ {((pipelineStatus.systemResources.networkOut || 0) / 1024 / 1024).toFixed(1)} MB/s
                      </div>
                      <div className="network-stat">
                        ↓ {((pipelineStatus.systemResources.networkIn || 0) / 1024 / 1024).toFixed(1)} MB/s
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Job History */}
          <div className="job-history-panel">
            <div className="panel-header">
              <h4>
                <Calendar size={18} />
                Job Execution History
              </h4>
              <div className="history-controls">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="status-filter"
                >
                  <option value="all">All Statuses</option>
                  <option value="running">Running</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            {loading.history ? (
              <div className="loading-inline">Loading job history...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="empty-inline">No jobs found for selected criteria</div>
            ) : (
              <div className="job-history-table">
                <div className="history-header">
                  <div className="header-cell">Job Type</div>
                  <div className="header-cell">Status</div>
                  <div className="header-cell">Started</div>
                  <div className="header-cell">Duration</div>
                  <div className="header-cell">Records</div>
                  <div className="header-cell">Throughput</div>
                  <div className="header-cell">Actions</div>
                </div>
                <div className="history-body">
                  {filteredJobs.map((job, index) => (
                    <div 
                      key={index} 
                      className={`history-row ${selectedJob?.id === job.id ? 'selected' : ''}`}
                      onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                    >
                      <div className="cell job-type">
                        <div className="job-icon">
                          {job.type === 'full-sync' && <Database size={16} />}
                          {job.type === 'incremental-sync' && <Upload size={16} />}
                          {job.type === 'validation' && <CheckCircle size={16} />}
                          {job.type === 'analytics-refresh' && <BarChart3 size={16} />}
                        </div>
                        <div className="job-info">
                          <div className="job-name">{job.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                          <div className="job-id">#{job.id}</div>
                        </div>
                      </div>
                      <div className="cell">
                        <div 
                          className="status-badge"
                          style={{ 
                            color: getStatusColor(job.status),
                            borderColor: getStatusColor(job.status)
                          }}
                        >
                          {getStatusIcon(job.status, 12)}
                          <span>{job.status}</span>
                        </div>
                      </div>
                      <div className="cell">
                        <div className="timestamp">
                          {new Date(job.startedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="cell">
                        <div className="duration">
                          {formatDuration(job.duration)}
                        </div>
                      </div>
                      <div className="cell">
                        <div className="records">
                          {(job.recordsProcessed || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="cell">
                        <div className="throughput">
                          {calculateThroughput(job.recordsProcessed, job.duration)} rec/sec
                        </div>
                      </div>
                      <div className="cell">
                        <button 
                          className="btn-view-details"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedJob(job)
                          }}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Job Details Modal */}
          {selectedJob && (
            <div className="job-details-overlay" onClick={() => setSelectedJob(null)}>
              <div className="job-details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h4>Job Details - #{selectedJob.id}</h4>
                  <button 
                    className="btn-close"
                    onClick={() => setSelectedJob(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="modal-content">
                  <div className="job-summary">
                    <div className="summary-item">
                      <div className="summary-label">Job Type</div>
                      <div className="summary-value">{selectedJob.type}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Status</div>
                      <div 
                        className="summary-value status"
                        style={{ color: getStatusColor(selectedJob.status) }}
                      >
                        {getStatusIcon(selectedJob.status, 16)}
                        {selectedJob.status}
                      </div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Duration</div>
                      <div className="summary-value">{formatDuration(selectedJob.duration)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Records Processed</div>
                      <div className="summary-value">{(selectedJob.recordsProcessed || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  {selectedJob.steps && (
                    <div className="job-steps">
                      <h5>Execution Steps</h5>
                      <div className="steps-list">
                        {selectedJob.steps.map((step, index) => (
                          <div key={index} className="step-item">
                            <div className="step-header">
                              <div 
                                className="step-status"
                                style={{ color: getStatusColor(step.status) }}
                              >
                                {getStatusIcon(step.status, 14)}
                              </div>
                              <div className="step-name">{step.name}</div>
                              <div className="step-duration">{formatDuration(step.duration)}</div>
                            </div>
                            {step.description && (
                              <div className="step-description">{step.description}</div>
                            )}
                            {step.error && (
                              <div className="step-error">
                                <AlertCircle size={12} />
                                {step.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedJob.logs && (
                    <div className="job-logs">
                      <h5>Execution Logs</h5>
                      <div className="logs-container">
                        {selectedJob.logs.map((log, index) => (
                          <div key={index} className={`log-entry ${log.level}`}>
                            <div className="log-timestamp">{new Date(log.timestamp).toLocaleString()}</div>
                            <div className="log-level">{log.level}</div>
                            <div className="log-message">{log.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx="true">{`
        .etl-pipeline-monitor {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
        }

        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .monitor-title {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .monitor-title h3 {
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

        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
        }

        .toggle-input {
          display: none;
        }

        .toggle-slider {
          width: 40px;
          height: 20px;
          background: var(--glass-border);
          border-radius: 10px;
          position: relative;
          transition: all var(--transition-normal);
        }

        .toggle-slider:before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          transition: transform var(--transition-normal);
        }

        .toggle-input:checked + .toggle-slider {
          background: var(--theme-primary);
        }

        .toggle-input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }

        .time-select {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-sm) var(--space-md);
          color: var(--theme-text);
          font-family: var(--font-primary);
        }

        .btn-refresh {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          color: var(--theme-text);
          font-family: var(--font-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-refresh:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .btn-refresh:disabled {
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

        .loading-state {
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

        .loading-state p {
          color: var(--theme-textSecondary);
          margin: 0;
        }

        .pipeline-overview {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-xl);
        }

        .overview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .overview-header h4 {
          color: var(--theme-text);
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
        }

        .health-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .pipeline-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-lg);
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          padding: var(--space-xl);
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
          width: 48px;
          height: 48px;
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
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--theme-text);
          margin-bottom: var(--space-xs);
        }

        .metric-label {
          color: var(--theme-textSecondary);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: var(--space-sm);
        }

        .metric-trend {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .monitor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: var(--space-xl);
          margin-bottom: var(--space-xl);
        }

        .data-sources-panel,
        .job-controls-panel,
        .system-resources-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .panel-header h4 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .loading-inline,
        .empty-inline {
          text-align: center;
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          padding: var(--space-lg);
          font-style: italic;
        }

        .source-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .source-item {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .source-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        }

        .source-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .source-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .source-details .source-name {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .source-details .source-type {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .source-status {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .source-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-md);
        }

        .source-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
        }

        .source-metric .metric-name {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .source-metric .metric-value {
          color: var(--theme-text);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .source-error {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          margin-top: var(--space-md);
          padding: var(--space-sm);
          background: rgba(239, 68, 68, 0.1);
          color: var(--accent-red);
          border-radius: var(--radius-md);
          font-size: 0.8rem;
        }

        .job-triggers {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .job-trigger {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
        }

        .trigger-info .trigger-name {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .trigger-info .trigger-description {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .btn-trigger {
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

        .btn-trigger:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
        }

        .btn-trigger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .resource-metrics {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .resource-item {
          padding: var(--space-md);
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
        }

        .resource-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .resource-header span:first-of-type {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 500;
          flex: 1;
        }

        .resource-value {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .resource-bar {
          height: 8px;
          background: var(--glass-border);
          border-radius: 4px;
          overflow: hidden;
        }

        .resource-fill {
          height: 100%;
          transition: width var(--transition-normal);
        }

        .network-details {
          display: flex;
          justify-content: space-between;
          margin-top: var(--space-sm);
        }

        .network-stat {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .job-history-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .history-controls {
          display: flex;
          gap: var(--space-md);
        }

        .status-filter {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-sm) var(--space-md);
          color: var(--theme-text);
          font-family: var(--font-primary);
        }

        .job-history-table {
          overflow-x: auto;
        }

        .history-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 1fr auto;
          gap: var(--space-md);
          padding: var(--space-md);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          border-bottom: 1px solid var(--glass-border);
        }

        .header-cell {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .history-body {
          max-height: 400px;
          overflow-y: auto;
        }

        .history-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 1fr auto;
          gap: var(--space-md);
          padding: var(--space-md);
          border-bottom: 1px solid var(--glass-border);
          cursor: pointer;
          transition: background-color var(--transition-normal);
        }

        .history-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .history-row.selected {
          background: rgba(59, 130, 246, 0.05);
          border-color: var(--theme-primary);
        }

        .cell {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .job-type {
          align-items: center;
        }

        .job-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .job-info .job-name {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .job-info .job-id {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          font-family: var(--font-mono);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-xs) var(--space-sm);
          border: 1px solid;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .timestamp,
        .duration,
        .records,
        .throughput {
          color: var(--theme-text);
          font-size: 0.8rem;
        }

        .btn-view-details {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-xs);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-view-details:hover {
          color: var(--theme-text);
          border-color: var(--theme-primary);
        }

        .job-details-overlay {
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

        .job-details-modal {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg) var(--space-xl);
          border-bottom: 1px solid var(--glass-border);
        }

        .modal-header h4 {
          color: var(--theme-text);
          font-size: 1.1rem;
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
          max-height: calc(80vh - 80px);
          overflow-y: auto;
        }

        .job-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
          padding: var(--space-lg);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-lg);
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .summary-label {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .summary-value {
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
        }

        .summary-value.status {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .job-steps,
        .job-logs {
          margin-bottom: var(--space-xl);
        }

        .job-steps h5,
        .job-logs h5 {
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-lg) 0;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .step-item {
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .step-name {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          flex: 1;
        }

        .step-duration {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .step-description {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          margin-top: var(--space-sm);
          line-height: 1.4;
        }

        .step-error {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          margin-top: var(--space-sm);
          padding: var(--space-sm);
          background: rgba(239, 68, 68, 0.1);
          color: var(--accent-red);
          border-radius: var(--radius-md);
          font-size: 0.8rem;
        }

        .logs-container {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          max-height: 300px;
          overflow-y: auto;
          font-family: var(--font-mono);
        }

        .log-entry {
          display: grid;
          grid-template-columns: auto auto 1fr;
          gap: var(--space-md);
          padding: var(--space-sm) var(--space-md);
          border-bottom: 1px solid var(--glass-border);
          font-size: 0.8rem;
        }

        .log-entry:last-child {
          border-bottom: none;
        }

        .log-entry.error {
          background: rgba(239, 68, 68, 0.05);
          color: var(--accent-red);
        }

        .log-entry.warning {
          background: rgba(245, 158, 11, 0.05);
          color: var(--accent-yellow);
        }

        .log-entry.info {
          color: var(--theme-textSecondary);
        }

        .log-timestamp {
          color: var(--theme-textSecondary);
          white-space: nowrap;
        }

        .log-level {
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .log-message {
          word-break: break-word;
        }

        @media (max-width: 1200px) {
          .monitor-grid {
            grid-template-columns: 1fr;
          }

          .pipeline-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .job-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .header-actions {
            flex-direction: column;
            gap: var(--space-sm);
          }

          .pipeline-metrics {
            grid-template-columns: 1fr;
          }

          .source-metrics {
            grid-template-columns: 1fr;
          }

          .history-header,
          .history-row {
            grid-template-columns: 1fr;
          }

          .cell {
            justify-content: space-between;
          }

          .job-summary {
            grid-template-columns: 1fr;
          }

          .job-details-modal {
            width: 95%;
            margin: var(--space-md);
          }
        }
      `}</style>
    </div>
  )
}

export default ETLPipelineMonitor