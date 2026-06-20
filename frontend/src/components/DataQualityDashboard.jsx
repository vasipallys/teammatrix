import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Database,
  Activity,
  Eye,
  RefreshCw,
  FileText,
  Users,
  GitBranch,
  Layers,
  Calendar,
  BarChart3,
  PieChart,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react'
import { 
  getDataQualityReport,
  validateDataIntegrity,
  getDataRelationships,
  getUnifiedDataModel
} from '../api'
import { useNotifications } from './NotificationSystem'

const DataQualityDashboard = ({ onQualityUpdate }) => {
  const [qualityReport, setQualityReport] = useState(null)
  const [dataRelationships, setDataRelationships] = useState(null)
  const [unifiedModel, setUnifiedModel] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  
  const [loading, setLoading] = useState({
    report: false,
    validation: false,
    relationships: false,
    model: false
  })

  const [selectedMetric, setSelectedMetric] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const { success, error, info } = useNotifications()

  useEffect(() => {
    loadAllData()
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadDataQualityReport()
    }, 5 * 60 * 1000)
    
    setRefreshInterval(interval)
    return () => clearInterval(interval)
  }, [])

  const loadAllData = async () => {
    await Promise.all([
      loadDataQualityReport(),
      loadDataRelationships(),
      loadUnifiedModel()
    ])
  }

  const loadDataQualityReport = async () => {
    setLoading(prev => ({ ...prev, report: true }))
    try {
      const response = await getDataQualityReport()
      if (response.data.success) {
        setQualityReport(response.data.report)
        setLastRefresh(new Date())
        
        if (onQualityUpdate) {
          onQualityUpdate(response.data.report)
        }
      } else {
        throw new Error(response.data.message || 'Failed to load quality report')
      }
    } catch (err) {
      error('Failed to load data quality report')
    } finally {
      setLoading(prev => ({ ...prev, report: false }))
    }
  }

  const loadDataRelationships = async () => {
    setLoading(prev => ({ ...prev, relationships: true }))
    try {
      const response = await getDataRelationships()
      if (response.data.success) {
        setDataRelationships(response.data.relationships)
      }
    } catch (err) {
      console.warn('Could not load data relationships:', err)
    } finally {
      setLoading(prev => ({ ...prev, relationships: false }))
    }
  }

  const loadUnifiedModel = async () => {
    setLoading(prev => ({ ...prev, model: true }))
    try {
      const response = await getUnifiedDataModel()
      if (response.data.success) {
        setUnifiedModel(response.data.model)
      }
    } catch (err) {
      console.warn('Could not load unified model:', err)
    } finally {
      setLoading(prev => ({ ...prev, model: false }))
    }
  }

  const handleValidateIntegrity = async () => {
    setLoading(prev => ({ ...prev, validation: true }))
    try {
      info('Running data integrity validation...')
      const response = await validateDataIntegrity()
      
      if (response.data.success) {
        setValidationResults(response.data.validation)
        success(`Validation completed - ${response.data.validation.issuesFound} issues found`)
      } else {
        throw new Error(response.data.message || 'Validation failed')
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Validation failed')
    } finally {
      setLoading(prev => ({ ...prev, validation: false }))
    }
  }

  const getQualityScoreColor = (score) => {
    if (score >= 90) return 'var(--accent-green)'
    if (score >= 70) return 'var(--accent-yellow)'
    if (score >= 50) return 'var(--accent-orange)'
    return 'var(--accent-red)'
  }

  const getQualityScoreIcon = (score) => {
    if (score >= 90) return <CheckCircle size={20} />
    if (score >= 70) return <AlertTriangle size={20} />
    return <XCircle size={20} />
  }

  const formatLastRefresh = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const getDataSourceIcon = (source) => {
    const icons = {
      employees: <Users size={16} />,
      repositories: <GitBranch size={16} />,
      epics: <Layers size={16} />,
      stories: <FileText size={16} />,
      sprints: <Calendar size={16} />,
      commits: <Activity size={16} />,
      pullRequests: <GitBranch size={16} />,
      allocations: <Users size={16} />
    }
    return icons[source] || <Database size={16} />
  }

  return (
    <div className="data-quality-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <Shield size={24} />
          <h3>Data Quality Dashboard</h3>
        </div>
        <div className="header-actions">
          {lastRefresh && (
            <div className="last-refresh">
              <Activity size={14} />
              <span>Updated {formatLastRefresh(lastRefresh)}</span>
            </div>
          )}
          <button 
            className="btn-refresh" 
            onClick={loadDataQualityReport}
            disabled={loading.report}
          >
            <RefreshCw size={16} className={loading.report ? 'spin' : ''} />
            Refresh
          </button>
          <button 
            className="btn-validate" 
            onClick={handleValidateIntegrity}
            disabled={loading.validation}
          >
            <Shield size={16} />
            {loading.validation ? 'Validating...' : 'Validate Integrity'}
          </button>
        </div>
      </div>

      {loading.report && !qualityReport ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading data quality report...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* Overall Quality Score */}
          {qualityReport && (
            <div className="quality-overview">
              <div className="overall-score">
                <div className="score-circle">
                  <div 
                    className="score-value"
                    style={{ color: getQualityScoreColor(qualityReport.overallScore) }}
                  >
                    {qualityReport.overallScore}
                    <span className="score-unit">%</span>
                  </div>
                  <div className="score-label">Overall Quality</div>
                </div>
                <div className="score-trend">
                  {qualityReport.trend > 0 ? (
                    <TrendingUp size={16} color="var(--accent-green)" />
                  ) : qualityReport.trend < 0 ? (
                    <TrendingDown size={16} color="var(--accent-red)" />
                  ) : null}
                  <span className={qualityReport.trend > 0 ? 'trend-up' : 'trend-down'}>
                    {Math.abs(qualityReport.trend)}% {qualityReport.trend > 0 ? 'increase' : 'decrease'}
                  </span>
                </div>
              </div>

              <div className="quality-metrics">
                <div className="metric-card">
                  <div className="metric-icon">
                    <Database size={20} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{qualityReport.totalRecords?.toLocaleString() || 0}</div>
                    <div className="metric-label">Total Records</div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <CheckCircle size={20} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{qualityReport.validRecords?.toLocaleString() || 0}</div>
                    <div className="metric-label">Valid Records</div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{qualityReport.issuesFound || 0}</div>
                    <div className="metric-label">Issues Found</div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <Activity size={20} />
                  </div>
                  <div className="metric-info">
                    <div className="metric-value">{qualityReport.dataSources || 0}</div>
                    <div className="metric-label">Data Sources</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-grid">
            {/* Data Source Quality */}
            {qualityReport?.dataSources && (
              <div className="data-sources-panel">
                <h4>
                  <Database size={18} />
                  Data Source Quality
                </h4>

                <div className="source-list">
                  {Object.entries(qualityReport.sourceQuality || {}).map(([source, data]) => (
                    <div 
                      key={source} 
                      className={`source-item ${selectedMetric === source ? 'selected' : ''}`}
                      onClick={() => setSelectedMetric(selectedMetric === source ? null : source)}
                    >
                      <div className="source-header">
                        <div className="source-info">
                          {getDataSourceIcon(source)}
                          <span className="source-name">{source}</span>
                        </div>
                        <div 
                          className="source-score"
                          style={{ color: getQualityScoreColor(data.score) }}
                        >
                          {data.score}%
                        </div>
                      </div>
                      
                      <div className="source-stats">
                        <div className="stat">
                          <span className="stat-value">{data.recordCount?.toLocaleString() || 0}</span>
                          <span className="stat-label">records</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{data.completeness || 0}%</span>
                          <span className="stat-label">complete</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{data.issues || 0}</span>
                          <span className="stat-label">issues</span>
                        </div>
                      </div>

                      {data.issues > 0 && (
                        <div className="issue-summary">
                          {data.issueTypes?.slice(0, 3).map((issue, index) => (
                            <div key={index} className="issue-tag">
                              {issue}
                            </div>
                          ))}
                          {data.issueTypes?.length > 3 && (
                            <div className="issue-tag more">+{data.issueTypes.length - 3}</div>
                          )}
                        </div>
                      )}

                      {data.lastSync && (
                        <div className="source-sync">
                          Last sync: {formatLastRefresh(new Date(data.lastSync))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Relationships */}
            {dataRelationships && (
              <div className="relationships-panel">
                <h4>
                  <Activity size={18} />
                  Data Relationships
                </h4>

                <div className="relationship-stats">
                  <div className="relationship-metric">
                    <div className="metric-value">{dataRelationships.totalRelationships || 0}</div>
                    <div className="metric-label">Total Relationships</div>
                  </div>
                  <div className="relationship-metric">
                    <div className="metric-value">{dataRelationships.validRelationships || 0}</div>
                    <div className="metric-label">Valid</div>
                  </div>
                  <div className="relationship-metric">
                    <div className="metric-value">{dataRelationships.brokenRelationships || 0}</div>
                    <div className="metric-label">Broken</div>
                  </div>
                  <div className="relationship-metric">
                    <div 
                      className="metric-value"
                      style={{ color: getQualityScoreColor(dataRelationships.relationshipHealth || 0) }}
                    >
                      {dataRelationships.relationshipHealth || 0}%
                    </div>
                    <div className="metric-label">Health Score</div>
                  </div>
                </div>

                {dataRelationships.relationships && (
                  <div className="relationship-list">
                    {dataRelationships.relationships.slice(0, 5).map((rel, index) => (
                      <div key={index} className="relationship-item">
                        <div className="relationship-info">
                          <div className="relationship-path">
                            <span className="entity">{rel.from}</span>
                            <span className="arrow">→</span>
                            <span className="entity">{rel.to}</span>
                          </div>
                          <div className="relationship-type">{rel.type}</div>
                        </div>
                        <div className={`relationship-status ${rel.isValid ? 'valid' : 'invalid'}`}>
                          {rel.isValid ? (
                            <CheckCircle size={14} />
                          ) : (
                            <AlertTriangle size={14} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Validation Results */}
            {validationResults && (
              <div className="validation-panel">
                <h4>
                  <Shield size={18} />
                  Data Integrity Validation
                </h4>

                <div className="validation-summary">
                  <div className="validation-result">
                    <div 
                      className="validation-icon"
                      style={{ color: getQualityScoreColor(validationResults.overallHealth) }}
                    >
                      {getQualityScoreIcon(validationResults.overallHealth)}
                    </div>
                    <div className="validation-info">
                      <div className="validation-score">
                        {validationResults.overallHealth}% Healthy
                      </div>
                      <div className="validation-message">
                        {validationResults.issuesFound} integrity issues detected
                      </div>
                    </div>
                  </div>
                </div>

                {validationResults.categories && (
                  <div className="validation-categories">
                    {Object.entries(validationResults.categories).map(([category, data]) => (
                      <div key={category} className="validation-category">
                        <div className="category-header">
                          <span className="category-name">{category}</span>
                          <span 
                            className="category-score"
                            style={{ color: getQualityScoreColor(data.score) }}
                          >
                            {data.score}%
                          </span>
                        </div>
                        {data.issues?.length > 0 && (
                          <div className="category-issues">
                            {data.issues.slice(0, 3).map((issue, index) => (
                              <div key={index} className="issue-item">
                                <AlertCircle size={12} />
                                <span>{issue.description}</span>
                                <span className="issue-severity">{issue.severity}</span>
                              </div>
                            ))}
                            {data.issues.length > 3 && (
                              <div className="issue-more">
                                +{data.issues.length - 3} more issues
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Data Coverage */}
            {qualityReport?.coverage && (
              <div className="coverage-panel">
                <h4>
                  <BarChart3 size={18} />
                  Data Coverage
                </h4>

                <div className="coverage-chart">
                  {Object.entries(qualityReport.coverage).map(([field, percentage]) => (
                    <div key={field} className="coverage-bar">
                      <div className="coverage-info">
                        <span className="field-name">{field}</span>
                        <span className="coverage-percentage">{percentage}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: getQualityScoreColor(percentage)
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Trends */}
            {qualityReport?.trends && (
              <div className="trends-panel">
                <h4>
                  <TrendingUp size={18} />
                  Quality Trends
                </h4>

                <div className="trend-metrics">
                  {qualityReport.trends.map((trend, index) => (
                    <div key={index} className="trend-item">
                      <div className="trend-period">{trend.period}</div>
                      <div className="trend-data">
                        <div 
                          className="trend-score"
                          style={{ color: getQualityScoreColor(trend.score) }}
                        >
                          {trend.score}%
                        </div>
                        <div className="trend-change">
                          {trend.change > 0 ? (
                            <TrendingUp size={12} color="var(--accent-green)" />
                          ) : trend.change < 0 ? (
                            <TrendingDown size={12} color="var(--accent-red)" />
                          ) : null}
                          <span className={trend.change > 0 ? 'positive' : 'negative'}>
                            {Math.abs(trend.change)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {qualityReport?.recommendations && (
              <div className="recommendations-panel">
                <h4>
                  <Zap size={18} />
                  Quality Recommendations
                </h4>

                <div className="recommendation-list">
                  {qualityReport.recommendations.map((rec, index) => (
                    <div key={index} className={`recommendation-item ${rec.priority}`}>
                      <div className="recommendation-header">
                        <div className="recommendation-icon">
                          {rec.priority === 'high' ? (
                            <AlertCircle size={16} />
                          ) : rec.priority === 'medium' ? (
                            <AlertTriangle size={16} />
                          ) : (
                            <Info size={16} />
                          )}
                        </div>
                        <div className="recommendation-title">{rec.title}</div>
                        <div className={`priority-badge ${rec.priority}`}>
                          {rec.priority}
                        </div>
                      </div>
                      <div className="recommendation-description">
                        {rec.description}
                      </div>
                      {rec.impact && (
                        <div className="recommendation-impact">
                          Expected improvement: {rec.impact}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx="true">{`
        .data-quality-dashboard {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .dashboard-title {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .dashboard-title h3 {
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

        .last-refresh {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .btn-refresh,
        .btn-validate {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          border: none;
          border-radius: var(--radius-lg);
          font-family: var(--font-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-refresh {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--theme-text);
        }

        .btn-refresh:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .btn-validate {
          background: var(--theme-gradient-primary);
          color: white;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-validate:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
        }

        .btn-refresh:disabled,
        .btn-validate:disabled {
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

        .quality-overview {
          display: flex;
          gap: var(--space-xl);
          margin-bottom: var(--space-xl);
          padding: var(--space-xl);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
        }

        .overall-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }

        .score-circle {
          text-align: center;
        }

        .score-value {
          font-family: var(--font-display);
          font-size: 3rem;
          font-weight: 900;
          line-height: 1;
        }

        .score-unit {
          font-size: 1.5rem;
          opacity: 0.7;
        }

        .score-label {
          color: var(--theme-textSecondary);
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: var(--space-sm);
        }

        .score-trend {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.8rem;
        }

        .trend-up {
          color: var(--accent-green);
        }

        .trend-down {
          color: var(--accent-red);
        }

        .quality-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--space-lg);
          flex: 1;
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

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--space-xl);
        }

        .data-sources-panel,
        .relationships-panel,
        .validation-panel,
        .coverage-panel,
        .trends-panel,
        .recommendations-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .data-sources-panel h4,
        .relationships-panel h4,
        .validation-panel h4,
        .coverage-panel h4,
        .trends-panel h4,
        .recommendations-panel h4 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-lg) 0;
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
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .source-item:hover {
          border-color: var(--theme-primary);
          transform: translateY(-2px);
        }

        .source-item.selected {
          border-color: var(--theme-primary);
          background: rgba(59, 130, 246, 0.05);
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

        .source-name {
          color: var(--theme-text);
          font-weight: 600;
          text-transform: capitalize;
        }

        .source-score {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
        }

        .source-stats {
          display: flex;
          gap: var(--space-lg);
          margin-bottom: var(--space-md);
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-value {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .stat-label {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .issue-summary {
          display: flex;
          gap: var(--space-sm);
          flex-wrap: wrap;
          margin-bottom: var(--space-sm);
        }

        .issue-tag {
          background: rgba(239, 68, 68, 0.1);
          color: var(--accent-red);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 600;
        }

        .issue-tag.more {
          background: var(--glass-border);
          color: var(--theme-textSecondary);
        }

        .source-sync {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .relationship-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .relationship-metric {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          text-align: center;
        }

        .relationship-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .relationship-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
        }

        .relationship-path {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .entity {
          color: var(--theme-text);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .arrow {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .relationship-type {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          margin-top: var(--space-xs);
        }

        .relationship-status.valid {
          color: var(--accent-green);
        }

        .relationship-status.invalid {
          color: var(--accent-red);
        }

        .validation-summary {
          margin-bottom: var(--space-lg);
        }

        .validation-result {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-lg);
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
        }

        .validation-score {
          color: var(--theme-text);
          font-size: 1.1rem;
          font-weight: 600;
        }

        .validation-message {
          color: var(--theme-textSecondary);
          font-size: 0.9rem;
        }

        .validation-categories {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .validation-category {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }

        .category-name {
          color: var(--theme-text);
          font-weight: 600;
          text-transform: capitalize;
        }

        .category-score {
          font-family: var(--font-display);
          font-weight: 700;
        }

        .category-issues {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .issue-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .issue-severity {
          margin-left: auto;
          padding: 2px 6px;
          background: rgba(239, 68, 68, 0.2);
          color: var(--accent-red);
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 600;
        }

        .issue-more {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-style: italic;
        }

        .coverage-chart {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .coverage-bar {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .coverage-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .field-name {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .coverage-percentage {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .progress-bar {
          height: 6px;
          background: var(--glass-border);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width var(--transition-normal);
        }

        .trend-metrics {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .trend-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
        }

        .trend-period {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .trend-data {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .trend-score {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
        }

        .trend-change {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.8rem;
        }

        .trend-change .positive {
          color: var(--accent-green);
        }

        .trend-change .negative {
          color: var(--accent-red);
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .recommendation-item {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .recommendation-item.high {
          border-left: 4px solid var(--accent-red);
        }

        .recommendation-item.medium {
          border-left: 4px solid var(--accent-yellow);
        }

        .recommendation-item.low {
          border-left: 4px solid var(--accent-blue);
        }

        .recommendation-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
        }

        .recommendation-icon {
          color: var(--theme-textSecondary);
        }

        .recommendation-item.high .recommendation-icon {
          color: var(--accent-red);
        }

        .recommendation-item.medium .recommendation-icon {
          color: var(--accent-yellow);
        }

        .recommendation-title {
          color: var(--theme-text);
          font-weight: 600;
          flex: 1;
        }

        .priority-badge {
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .priority-badge.high {
          background: rgba(239, 68, 68, 0.2);
          color: var(--accent-red);
        }

        .priority-badge.medium {
          background: rgba(245, 158, 11, 0.2);
          color: var(--accent-yellow);
        }

        .priority-badge.low {
          background: rgba(59, 130, 246, 0.2);
          color: var(--accent-blue);
        }

        .recommendation-description {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: var(--space-sm);
        }

        .recommendation-impact {
          color: var(--accent-green);
          font-size: 0.8rem;
          font-style: italic;
        }

        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .quality-overview {
            flex-direction: column;
            align-items: center;
          }

          .quality-metrics {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .header-actions {
            flex-direction: column;
            gap: var(--space-sm);
          }

          .quality-metrics {
            grid-template-columns: 1fr;
          }

          .relationship-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .source-stats {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  )
}

export default DataQualityDashboard