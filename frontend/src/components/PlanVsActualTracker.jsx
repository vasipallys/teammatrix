import React, { useState, useEffect } from 'react'
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Zap,
  Award,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react'
import {
  getPlanVsActualAnalysis,
  getSquadAnalysis,
  getStrategicAlignment,
  exportPlanVsActual
} from '../api'
import { useNotifications } from './NotificationSystem'

const PlanVsActualTracker = ({ selectedSquads, timeRange = '90d' }) => {
  const [analysisData, setAnalysisData] = useState(null)
  const [squadAnalytics, setSquadAnalytics] = useState([])
  const [strategicAlignment, setStrategicAlignment] = useState(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [selectedView, setSelectedView] = useState('overview') // overview, squads, timeline, risks
  const [selectedSquad, setSelectedSquad] = useState(null)

  const [filters, setFilters] = useState({
    status: 'all', // all, on-track, at-risk, delayed
    priority: 'all', // all, high, medium, low
    completion: 'all' // all, 0-25, 26-50, 51-75, 76-100
  })

  const [loading, setLoading] = useState({
    analysis: false,
    squads: false,
    alignment: false,
    export: false
  })

  const { success, error, info } = useNotifications()

  useEffect(() => {
    loadPlanVsActualData()
    loadStrategicAlignment()
    if (selectedSquads && selectedSquads.length > 0) {
      loadSquadAnalytics()
    }
  }, [selectedTimeRange, selectedSquads])

  const loadPlanVsActualData = async () => {
    setLoading(prev => ({ ...prev, analysis: true }))
    try {
      const response = await getPlanVsActualAnalysis({
        timeRange: selectedTimeRange,
        filters: filters
      })
      
      if (response.data.success) {
        setAnalysisData(response.data.analysis)
      } else {
        throw new Error(response.data.message || 'Failed to load analysis')
      }
    } catch (err) {
      error('Failed to load plan vs actual analysis')
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }))
    }
  }

  const loadSquadAnalytics = async () => {
    setLoading(prev => ({ ...prev, squads: true }))
    try {
      const analyticsPromises = selectedSquads.map(squad =>
        getSquadAnalysis(squad.name)
      )
      const responses = await Promise.all(analyticsPromises)
      
      const validAnalytics = responses
        .filter(response => response.data.success)
        .map(response => response.data.analysis)

      setSquadAnalytics(validAnalytics)
    } catch (err) {
      error('Failed to load squad analytics')
    } finally {
      setLoading(prev => ({ ...prev, squads: false }))
    }
  }

  const loadStrategicAlignment = async () => {
    setLoading(prev => ({ ...prev, alignment: true }))
    try {
      const response = await getStrategicAlignment()
      if (response.data.success) {
        setStrategicAlignment(response.data.alignment)
      }
    } catch (err) {
      console.warn('Could not load strategic alignment:', err)
    } finally {
      setLoading(prev => ({ ...prev, alignment: false }))
    }
  }

  const handleExportReport = async () => {
    setLoading(prev => ({ ...prev, export: true }))
    try {
      const response = await exportPlanVsActual('excel')
      
      // Create and trigger download
      const url = URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `plan-vs-actual-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      success('Plan vs Actual report exported successfully')
    } catch (err) {
      error('Failed to export report')
    } finally {
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'on-track':
      case 'completed': return 'var(--accent-green)'
      case 'at-risk': return 'var(--accent-yellow)'
      case 'delayed':
      case 'overdue': return 'var(--accent-red)'
      case 'paused': return 'var(--accent-gray)'
      default: return 'var(--theme-textSecondary)'
    }
  }

  const getStatusIcon = (status, size = 16) => {
    switch (status?.toLowerCase()) {
      case 'on-track': return <CheckCircle size={size} />
      case 'completed': return <CheckCircle size={size} />
      case 'at-risk': return <AlertTriangle size={size} />
      case 'delayed': return <XCircle size={size} />
      case 'paused': return <PauseCircle size={size} />
      default: return <Clock size={size} />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'var(--accent-red)'
      case 'medium': return 'var(--accent-yellow)'
      case 'low': return 'var(--accent-blue)'
      default: return 'var(--theme-textSecondary)'
    }
  }

  const calculateVariance = (planned, actual) => {
    if (!planned || planned === 0) return 0
    return ((actual - planned) / planned) * 100
  }

  const getVarianceIcon = (variance) => {
    if (variance > 5) return <ArrowUpRight size={14} />
    if (variance < -5) return <ArrowDownRight size={14} />
    return <Minus size={14} />
  }

  const getVarianceColor = (variance) => {
    if (variance > 10) return 'var(--accent-red)'
    if (variance > 5) return 'var(--accent-yellow)'
    if (variance < -10) return 'var(--accent-red)'
    if (variance < -5) return 'var(--accent-yellow)'
    return 'var(--accent-green)'
  }

  const filteredWorkPlans = analysisData?.workPlans?.filter(plan => {
    const matchesStatus = filters.status === 'all' || plan.status?.toLowerCase() === filters.status
    const matchesPriority = filters.priority === 'all' || plan.priority?.toLowerCase() === filters.priority
    const completion = plan.completion_percentage || 0
    const matchesCompletion = filters.completion === 'all' ||
      (filters.completion === '0-25' && completion <= 25) ||
      (filters.completion === '26-50' && completion > 25 && completion <= 50) ||
      (filters.completion === '51-75' && completion > 50 && completion <= 75) ||
      (filters.completion === '76-100' && completion > 75)
    
    return matchesStatus && matchesPriority && matchesCompletion
  }) || []

  return (
    <div className="plan-vs-actual-tracker">
      <div className="tracker-header">
        <div className="tracker-title">
          <Target size={24} />
          <h3>Plan vs Actual Tracking</h3>
        </div>
        <div className="header-actions">
          <div className="time-range-selector">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="time-select"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="180d">Last 6 Months</option>
              <option value="365d">Last Year</option>
            </select>
          </div>
          <button 
            className="btn-export" 
            onClick={handleExportReport}
            disabled={loading.export || !analysisData}
          >
            <Download size={16} />
            {loading.export ? 'Exporting...' : 'Export Report'}
          </button>
          <button 
            className="btn-refresh" 
            onClick={loadPlanVsActualData}
            disabled={loading.analysis}
          >
            <RefreshCw size={16} className={loading.analysis ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* View Navigation */}
      <div className="view-navigation">
        <button 
          className={`nav-btn ${selectedView === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedView('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button 
          className={`nav-btn ${selectedView === 'squads' ? 'active' : ''}`}
          onClick={() => setSelectedView('squads')}
        >
          <Users size={16} />
          Squad Analysis
        </button>
        <button 
          className={`nav-btn ${selectedView === 'timeline' ? 'active' : ''}`}
          onClick={() => setSelectedView('timeline')}
        >
          <Calendar size={16} />
          Timeline View
        </button>
        <button 
          className={`nav-btn ${selectedView === 'risks' ? 'active' : ''}`}
          onClick={() => setSelectedView('risks')}
        >
          <AlertTriangle size={16} />
          Risk Analysis
        </button>
      </div>

      {loading.analysis && !analysisData ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading plan vs actual analysis...</p>
        </div>
      ) : (
        <div className="tracker-content">
          {selectedView === 'overview' && (
            <div className="overview-view">
              {/* Key Metrics */}
              {analysisData && (
                <div className="key-metrics">
                  <div className="metric-card">
                    <div className="metric-icon">
                      <Target size={24} />
                    </div>
                    <div className="metric-info">
                      <div className="metric-value">{analysisData.totalWorkPlans || 0}</div>
                      <div className="metric-label">Total Work Plans</div>
                      <div className="metric-trend">
                        <span className="trend-value">
                          {analysisData.activeWorkPlans || 0} active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon">
                      <CheckCircle size={24} />
                    </div>
                    <div className="metric-info">
                      <div className="metric-value">
                        {analysisData.overallCompletionRate || 0}%
                      </div>
                      <div className="metric-label">Overall Completion</div>
                      <div className="metric-trend">
                        {getVarianceIcon(analysisData.completionVariance || 0)}
                        <span 
                          className="trend-value"
                          style={{ color: getVarianceColor(analysisData.completionVariance || 0) }}
                        >
                          {Math.abs(analysisData.completionVariance || 0).toFixed(1)}% vs target
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon">
                      <Clock size={24} />
                    </div>
                    <div className="metric-info">
                      <div className="metric-value">
                        {analysisData.onTimeDeliveryRate || 0}%
                      </div>
                      <div className="metric-label">On-Time Delivery</div>
                      <div className="metric-trend">
                        <span className="trend-value">
                          {analysisData.delayedWorkPlans || 0} delayed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon">
                      <AlertTriangle size={24} />
                    </div>
                    <div className="metric-info">
                      <div className="metric-value">{analysisData.atRiskWorkPlans || 0}</div>
                      <div className="metric-label">At Risk</div>
                      <div className="metric-trend">
                        <span 
                          className="trend-value"
                          style={{ color: getStatusColor('at-risk') }}
                        >
                          {((analysisData.atRiskWorkPlans || 0) / (analysisData.totalWorkPlans || 1) * 100).toFixed(1)}% of total
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Strategic Alignment */}
              {strategicAlignment && (
                <div className="strategic-alignment">
                  <h4>
                    <Award size={18} />
                    Strategic Alignment
                  </h4>
                  <div className="alignment-metrics">
                    <div className="alignment-score">
                      <div className="score-circle">
                        <div 
                          className="score-value"
                          style={{ color: getVarianceColor(strategicAlignment.overallScore - 80) }}
                        >
                          {strategicAlignment.overallScore || 0}%
                        </div>
                        <div className="score-label">Alignment Score</div>
                      </div>
                    </div>
                    <div className="alignment-breakdown">
                      {strategicAlignment.categories?.map((category, index) => (
                        <div key={index} className="alignment-category">
                          <div className="category-info">
                            <div className="category-name">{category.name}</div>
                            <div className="category-weight">{category.weight}% weight</div>
                          </div>
                          <div className="category-score">
                            <div 
                              className="score-bar"
                              style={{ 
                                width: `${category.score}%`,
                                backgroundColor: getVarianceColor(category.score - 75)
                              }}
                            ></div>
                            <span className="score-text">{category.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="filters-section">
                <h4>
                  <Filter size={18} />
                  Filter Work Plans
                </h4>
                <div className="filter-controls">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="all">All Statuses</option>
                    <option value="on-track">On Track</option>
                    <option value="at-risk">At Risk</option>
                    <option value="delayed">Delayed</option>
                    <option value="completed">Completed</option>
                  </select>

                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>

                  <select
                    value={filters.completion}
                    onChange={(e) => setFilters(prev => ({ ...prev, completion: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="all">All Completion Levels</option>
                    <option value="0-25">0-25% Complete</option>
                    <option value="26-50">26-50% Complete</option>
                    <option value="51-75">51-75% Complete</option>
                    <option value="76-100">76-100% Complete</option>
                  </select>
                </div>
              </div>

              {/* Work Plans Table */}
              <div className="work-plans-section">
                <h4>
                  <Activity size={18} />
                  Work Plans ({filteredWorkPlans.length})
                </h4>
                <div className="plans-table">
                  <div className="table-header">
                    <div className="header-cell">Work Plan</div>
                    <div className="header-cell">Squad</div>
                    <div className="header-cell">Status</div>
                    <div className="header-cell">Progress</div>
                    <div className="header-cell">Timeline</div>
                    <div className="header-cell">Variance</div>
                  </div>
                  <div className="table-body">
                    {filteredWorkPlans.map((plan, index) => (
                      <div key={index} className="table-row">
                        <div className="cell plan-info">
                          <div className="plan-name">{plan.book_of_work || plan.plan_id}</div>
                          <div className="plan-description">{plan.description}</div>
                        </div>
                        <div className="cell">
                          <div className="squad-tag">{plan.squad_name}</div>
                        </div>
                        <div className="cell">
                          <div 
                            className="status-badge"
                            style={{ 
                              color: getStatusColor(plan.status),
                              borderColor: getStatusColor(plan.status)
                            }}
                          >
                            {getStatusIcon(plan.status, 12)}
                            <span>{plan.status || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="cell">
                          <div className="progress-info">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ 
                                  width: `${plan.completion_percentage || 0}%`,
                                  backgroundColor: getStatusColor(plan.status)
                                }}
                              ></div>
                            </div>
                            <span className="progress-text">{plan.completion_percentage || 0}%</span>
                          </div>
                        </div>
                        <div className="cell">
                          <div className="timeline-info">
                            <div className="timeline-dates">
                              {new Date(plan.start_date).toLocaleDateString()} - 
                              {new Date(plan.end_date).toLocaleDateString()}
                            </div>
                            <div className="timeline-status">
                              {plan.is_overdue ? (
                                <span style={{ color: getStatusColor('delayed') }}>Overdue</span>
                              ) : (
                                <span>{Math.max(0, Math.ceil((new Date(plan.end_date) - new Date()) / (24 * 60 * 60 * 1000)))} days left</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="cell">
                          <div className="variance-info">
                            <div 
                              className="variance-value"
                              style={{ color: getVarianceColor(plan.schedule_variance || 0) }}
                            >
                              {getVarianceIcon(plan.schedule_variance || 0)}
                              <span>{Math.abs(plan.schedule_variance || 0).toFixed(1)}%</span>
                            </div>
                            <div className="variance-label">
                              {plan.schedule_variance > 0 ? 'Behind' : plan.schedule_variance < 0 ? 'Ahead' : 'On Track'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedView === 'squads' && (
            <div className="squads-view">
              <div className="squad-analytics">
                {squadAnalytics.map((squad, index) => (
                  <div key={index} className="squad-card">
                    <div className="squad-header">
                      <div className="squad-info">
                        <h4>{squad.squadron}</h4>
                        <p>{squad.totalWorkPlans} work plans • {squad.totalFTE} FTE</p>
                      </div>
                      <div 
                        className="squad-health"
                        style={{ color: getVarianceColor(squad.metrics?.epicCompletionRate - 70) }}
                      >
                        {squad.metrics?.epicCompletionRate || 0}% completion
                      </div>
                    </div>

                    <div className="squad-metrics">
                      <div className="squad-metric">
                        <div className="metric-icon">
                          <Target size={16} />
                        </div>
                        <div className="metric-info">
                          <div className="metric-value">{squad.activeWorkPlans}</div>
                          <div className="metric-label">Active Plans</div>
                        </div>
                      </div>

                      <div className="squad-metric">
                        <div className="metric-icon">
                          <Activity size={16} />
                        </div>
                        <div className="metric-info">
                          <div className="metric-value">{squad.metrics?.utilizationRate || 0}%</div>
                          <div className="metric-label">Utilization</div>
                        </div>
                      </div>

                      <div className="squad-metric">
                        <div className="metric-icon">
                          <AlertTriangle size={16} />
                        </div>
                        <div className="metric-info">
                          <div className="metric-value">{squad.metrics?.riskIndicators || 0}</div>
                          <div className="metric-label">Risk Items</div>
                        </div>
                      </div>
                    </div>

                    <div className="squad-plans">
                      <h5>Plan vs Actual Analysis</h5>
                      {squad.planVsActual?.slice(0, 3).map((plan, planIndex) => (
                        <div key={planIndex} className="plan-summary">
                          <div className="plan-header">
                            <div className="plan-title">{plan.bookOfWork}</div>
                            <div 
                              className="plan-status"
                              style={{ color: getStatusColor(plan.riskLevel) }}
                            >
                              {plan.riskLevel} risk
                            </div>
                          </div>
                          <div className="plan-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ 
                                  width: `${plan.actualProgress}%`,
                                  backgroundColor: getStatusColor(plan.isOnTrack ? 'on-track' : 'at-risk')
                                }}
                              ></div>
                            </div>
                            <span className="progress-text">{plan.actualProgress}% complete</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedView === 'timeline' && (
            <div className="timeline-view">
              <div className="timeline-header">
                <h4>Timeline Analysis</h4>
                <p>Visual representation of planned vs actual delivery timelines</p>
              </div>
              
              <div className="timeline-chart">
                {filteredWorkPlans.map((plan, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-info">
                      <div className="timeline-title">{plan.book_of_work || plan.plan_id}</div>
                      <div className="timeline-squad">{plan.squad_name}</div>
                    </div>
                    
                    <div className="timeline-bars">
                      <div className="timeline-planned">
                        <div className="bar-label">Planned</div>
                        <div className="timeline-bar planned">
                          <div className="bar-segment"></div>
                        </div>
                        <div className="bar-dates">
                          {new Date(plan.start_date).toLocaleDateString()} - 
                          {new Date(plan.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="timeline-actual">
                        <div className="bar-label">Actual</div>
                        <div className="timeline-bar actual">
                          <div 
                            className="bar-segment"
                            style={{ 
                              width: `${plan.completion_percentage || 0}%`,
                              backgroundColor: getStatusColor(plan.status)
                            }}
                          ></div>
                        </div>
                        <div className="bar-status">
                          {plan.completion_percentage || 0}% complete
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedView === 'risks' && (
            <div className="risks-view">
              <div className="risk-summary">
                <h4>Risk Analysis</h4>
                <div className="risk-metrics">
                  <div className="risk-metric high">
                    <div className="risk-count">{analysisData?.riskBreakdown?.high || 0}</div>
                    <div className="risk-label">High Risk</div>
                  </div>
                  <div className="risk-metric medium">
                    <div className="risk-count">{analysisData?.riskBreakdown?.medium || 0}</div>
                    <div className="risk-label">Medium Risk</div>
                  </div>
                  <div className="risk-metric low">
                    <div className="risk-count">{analysisData?.riskBreakdown?.low || 0}</div>
                    <div className="risk-label">Low Risk</div>
                  </div>
                </div>
              </div>

              <div className="risk-factors">
                <h5>Key Risk Factors</h5>
                <div className="risk-list">
                  {analysisData?.riskFactors?.map((risk, index) => (
                    <div key={index} className={`risk-item ${risk.severity}`}>
                      <div className="risk-icon">
                        {getStatusIcon('at-risk', 18)}
                      </div>
                      <div className="risk-content">
                        <div className="risk-title">{risk.title}</div>
                        <div className="risk-description">{risk.description}</div>
                        <div className="risk-impact">
                          Impact: {risk.impact} • Probability: {risk.probability}%
                        </div>
                      </div>
                      <div className={`risk-severity ${risk.severity}`}>
                        {risk.severity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mitigation-strategies">
                <h5>Recommended Mitigation Strategies</h5>
                <div className="strategy-list">
                  {analysisData?.mitigationStrategies?.map((strategy, index) => (
                    <div key={index} className="strategy-item">
                      <div className="strategy-header">
                        <div className="strategy-title">{strategy.title}</div>
                        <div className={`strategy-priority ${strategy.priority}`}>
                          {strategy.priority} priority
                        </div>
                      </div>
                      <div className="strategy-description">{strategy.description}</div>
                      <div className="strategy-timeline">
                        Expected timeline: {strategy.timeline}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx="true">{`
        .plan-vs-actual-tracker {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
        }

        .tracker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .tracker-title {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .tracker-title h3 {
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

        .time-select {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-sm) var(--space-md);
          color: var(--theme-text);
          font-family: var(--font-primary);
        }

        .btn-export,
        .btn-refresh {
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

        .btn-export {
          background: var(--theme-gradient-primary);
          color: white;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-export:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
        }

        .btn-refresh {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--theme-text);
        }

        .btn-refresh:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-export:disabled,
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

        .view-navigation {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-xl);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-sm);
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--theme-textSecondary);
          font-family: var(--font-primary);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .nav-btn:hover {
          color: var(--theme-text);
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-btn.active {
          color: var(--theme-primary);
          background: rgba(59, 130, 246, 0.1);
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

        .key-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          padding: var(--space-xl);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
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
          font-size: 2rem;
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
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .trend-value {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .strategic-alignment {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-xl);
        }

        .strategic-alignment h4 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-lg) 0;
        }

        .alignment-metrics {
          display: flex;
          gap: var(--space-xl);
          align-items: center;
        }

        .alignment-score {
          text-align: center;
        }

        .score-circle .score-value {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 900;
        }

        .score-circle .score-label {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          margin-top: var(--space-sm);
        }

        .alignment-breakdown {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .alignment-category {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category-info .category-name {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .category-info .category-weight {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .category-score {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          min-width: 120px;
        }

        .score-bar {
          height: 6px;
          border-radius: 3px;
          transition: width var(--transition-normal);
        }

        .score-text {
          color: var(--theme-text);
          font-size: 0.8rem;
          font-weight: 600;
          min-width: 35px;
        }

        .filters-section,
        .work-plans-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-xl);
        }

        .filters-section h4,
        .work-plans-section h4 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-lg) 0;
        }

        .filter-controls {
          display: flex;
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        .filter-select {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-sm) var(--space-md);
          color: var(--theme-text);
          font-family: var(--font-primary);
          min-width: 150px;
        }

        .plans-table {
          overflow-x: auto;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 1fr;
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

        .table-body {
          max-height: 400px;
          overflow-y: auto;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 1fr;
          gap: var(--space-md);
          padding: var(--space-md);
          border-bottom: 1px solid var(--glass-border);
          transition: background-color var(--transition-normal);
        }

        .table-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .cell {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .plan-info {
          flex-direction: column;
          align-items: flex-start;
        }

        .plan-name {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .plan-description {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .squad-tag {
          background: rgba(59, 130, 246, 0.1);
          color: var(--theme-primary);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
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

        .progress-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          width: 100%;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: var(--glass-border);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width var(--transition-normal);
        }

        .progress-text {
          color: var(--theme-text);
          font-size: 0.8rem;
          font-weight: 600;
          min-width: 40px;
        }

        .timeline-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .timeline-dates {
          color: var(--theme-text);
          font-size: 0.8rem;
        }

        .timeline-status {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .variance-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xs);
        }

        .variance-value {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .variance-label {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .squad-analytics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--space-xl);
        }

        .squad-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .squad-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-lg);
        }

        .squad-info h4 {
          color: var(--theme-text);
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 var(--space-xs) 0;
        }

        .squad-info p {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          margin: 0;
        }

        .squad-health {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .squad-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .squad-metric {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
        }

        .squad-metric .metric-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .squad-metric .metric-value {
          color: var(--theme-text);
          font-size: 1.2rem;
          font-weight: 700;
        }

        .squad-metric .metric-label {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .squad-plans h5 {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 var(--space-md) 0;
        }

        .plan-summary {
          padding: var(--space-md);
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-sm);
        }

        .plan-summary:last-child {
          margin-bottom: 0;
        }

        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }

        .plan-title {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .plan-status {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .plan-progress {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .plan-progress .progress-bar {
          flex: 1;
          height: 6px;
        }

        .plan-progress .progress-text {
          font-size: 0.75rem;
        }

        .timeline-view {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .timeline-header {
          margin-bottom: var(--space-xl);
        }

        .timeline-header h4 {
          color: var(--theme-text);
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 var(--space-sm) 0;
        }

        .timeline-header p {
          color: var(--theme-textSecondary);
          margin: 0;
        }

        .timeline-chart {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .timeline-item {
          display: flex;
          gap: var(--space-xl);
          padding: var(--space-lg);
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
        }

        .timeline-info {
          min-width: 200px;
        }

        .timeline-title {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .timeline-squad {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .timeline-bars {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .timeline-planned,
        .timeline-actual {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: var(--space-md);
          align-items: center;
        }

        .bar-label {
          color: var(--theme-text);
          font-size: 0.8rem;
          font-weight: 600;
          min-width: 60px;
        }

        .timeline-bar {
          height: 20px;
          background: var(--glass-border);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .timeline-bar.planned .bar-segment {
          height: 100%;
          background: var(--theme-primary);
          width: 100%;
        }

        .timeline-bar.actual .bar-segment {
          height: 100%;
        }

        .bar-dates,
        .bar-status {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          min-width: 120px;
        }

        .risks-view {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .risk-summary {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .risk-summary h4 {
          color: var(--theme-text);
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 var(--space-lg) 0;
        }

        .risk-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-lg);
        }

        .risk-metric {
          text-align: center;
          padding: var(--space-lg);
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
        }

        .risk-metric.high {
          border-left: 4px solid var(--accent-red);
        }

        .risk-metric.medium {
          border-left: 4px solid var(--accent-yellow);
        }

        .risk-metric.low {
          border-left: 4px solid var(--accent-green);
        }

        .risk-count {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 900;
          color: var(--theme-text);
          margin-bottom: var(--space-xs);
        }

        .risk-label {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .risk-factors,
        .mitigation-strategies {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .risk-factors h5,
        .mitigation-strategies h5 {
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-lg) 0;
        }

        .risk-list,
        .strategy-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .risk-item,
        .strategy-item {
          padding: var(--space-lg);
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
        }

        .risk-item {
          display: flex;
          gap: var(--space-md);
        }

        .risk-item.high {
          border-left: 4px solid var(--accent-red);
        }

        .risk-item.medium {
          border-left: 4px solid var(--accent-yellow);
        }

        .risk-item.low {
          border-left: 4px solid var(--accent-green);
        }

        .risk-content {
          flex: 1;
        }

        .risk-title {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .risk-description {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: var(--space-sm);
        }

        .risk-impact {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .risk-severity {
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .risk-severity.high {
          background: rgba(239, 68, 68, 0.2);
          color: var(--accent-red);
        }

        .risk-severity.medium {
          background: rgba(245, 158, 11, 0.2);
          color: var(--accent-yellow);
        }

        .risk-severity.low {
          background: rgba(34, 197, 94, 0.2);
          color: var(--accent-green);
        }

        .strategy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }

        .strategy-title {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .strategy-priority {
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .strategy-priority.high {
          background: rgba(239, 68, 68, 0.2);
          color: var(--accent-red);
        }

        .strategy-priority.medium {
          background: rgba(245, 158, 11, 0.2);
          color: var(--accent-yellow);
        }

        .strategy-priority.low {
          background: rgba(59, 130, 246, 0.2);
          color: var(--theme-primary);
        }

        .strategy-description {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: var(--space-sm);
        }

        .strategy-timeline {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          font-style: italic;
        }

        @media (max-width: 1200px) {
          .key-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .alignment-metrics {
            flex-direction: column;
          }

          .squad-analytics {
            grid-template-columns: 1fr;
          }

          .plans-table {
            font-size: 0.8rem;
          }

          .table-header,
          .table-row {
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .header-actions {
            flex-direction: column;
            gap: var(--space-sm);
          }

          .view-navigation {
            flex-wrap: wrap;
          }

          .key-metrics {
            grid-template-columns: 1fr;
          }

          .filter-controls {
            flex-direction: column;
          }

          .risk-metrics {
            grid-template-columns: 1fr;
          }

          .squad-metrics {
            grid-template-columns: 1fr;
          }

          .timeline-item {
            flex-direction: column;
          }

          .timeline-planned,
          .timeline-actual {
            grid-template-columns: 1fr;
            gap: var(--space-sm);
          }
        }
      `}</style>
    </div>
  )
}

export default PlanVsActualTracker