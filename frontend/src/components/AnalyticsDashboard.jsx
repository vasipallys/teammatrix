import React, { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  Brain,
  Zap,
  BarChart3,
  Activity,
  Lightbulb,
  GitBranch
} from 'lucide-react'
import analyticsService from '../services/analyticsService'
import { SkeletonLoader } from './LoadingSpinner'
import RepositoryAnalytics from './RepositoryAnalytics'

const AnalyticsDashboard = ({ orgData, workData, className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'predictions', label: 'Predictions', icon: Zap },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'repositories', label: 'Git Analytics', icon: GitBranch }
  ]

  // Compute analytics when data changes
  const computedAnalytics = useMemo(() => {
    if (!orgData && !workData) return null

    const result = {}
    
    if (orgData) {
      result.organization = analyticsService.analyzeOrganizationStructure(orgData)
    }
    
    if (workData) {
      result.workPlan = analyticsService.analyzeWorkPlan(workData)
    }

    return result
  }, [orgData, workData])

  useEffect(() => {
    if (computedAnalytics) {
      setAnalytics(computedAnalytics)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }, [computedAnalytics])

  if (loading) {
    return (
      <div className={`analytics-dashboard ${className}`}>
        <div className="dashboard-header">
          <SkeletonLoader lines={2} height="2rem" />
        </div>
        <div className="dashboard-content">
          <SkeletonLoader lines={8} />
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={`analytics-dashboard ${className}`}>
        <div className="empty-analytics">
          <Brain size={64} />
          <h3>Analytics Ready</h3>
          <p>Upload organization or work plan data to see AI-powered insights</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`analytics-dashboard ${className}`}>
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="text-gradient">
            <Brain size={28} />
            AI Analytics Dashboard
          </h2>
          <p className="header-description">
            Intelligent insights and predictions powered by advanced analytics
          </p>
        </div>
        
        <div className="dashboard-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab analytics={analytics} />
        )}
        
        {activeTab === 'insights' && (
          <InsightsTab analytics={analytics} />
        )}
        
        {activeTab === 'predictions' && (
          <PredictionsTab analytics={analytics} />
        )}
        
        {activeTab === 'recommendations' && (
          <RecommendationsTab analytics={analytics} />
        )}
        
        {activeTab === 'repositories' && (
          <RepositoryAnalytics />
        )}
      </div>

      <style jsx="true">{`
        .analytics-dashboard {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          overflow: hidden;
        }

        .dashboard-header {
          padding: 2rem;
          border-bottom: 1px solid var(--glass-border);
          background: var(--theme-gradient-mesh);
        }

        .header-content {
          margin-bottom: 2rem;
        }

        .header-content h2 {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-description {
          color: var(--theme-textSecondary);
          font-size: 1rem;
          margin: 0;
          opacity: 0.9;
        }

        .dashboard-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .dashboard-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-lg);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .dashboard-tab:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
          transform: translateY(-1px);
        }

        .dashboard-tab.active {
          background: var(--theme-gradient-primary);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .dashboard-content {
          padding: 2rem;
        }

        .empty-analytics {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 2rem;
          color: var(--theme-textSecondary);
        }

        .empty-analytics h3 {
          color: var(--theme-text);
          margin: 1rem 0 0.5rem 0;
          font-size: 1.5rem;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 1.5rem;
          }

          .dashboard-tabs {
            gap: 0.25rem;
          }

          .dashboard-tab {
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
          }

          .dashboard-content {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

const OverviewTab = ({ analytics }) => {
  const { organization, workPlan } = analytics

  return (
    <div className="overview-tab">
      {organization && (
        <div className="analytics-section">
          <h3>
            <Users size={20} />
            Organization Overview
          </h3>
          <div className="metrics-grid">
            <MetricCard
              title="Total Employees"
              value={organization.overview.totalEmployees}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Job Functions"
              value={organization.overview.uniqueJobFunctions}
              icon={Target}
              color="green"
            />
            <MetricCard
              title="Management Layers"
              value={organization.hierarchy.maxDepth}
              icon={BarChart3}
              color="purple"
            />
            <MetricCard
              title="Avg Span of Control"
              value={organization.hierarchy.avgSpanOfControl}
              icon={TrendingUp}
              color="orange"
            />
          </div>
        </div>
      )}

      {workPlan && (
        <div className="analytics-section">
          <h3>
            <Activity size={20} />
            Work Plan Overview
          </h3>
          <div className="metrics-grid">
            <MetricCard
              title="Total Projects"
              value={workPlan.overview.totalItems}
              icon={Target}
              color="blue"
            />
            <MetricCard
              title="Active Projects"
              value={workPlan.overview.activeProjects}
              icon={Clock}
              color="green"
            />
            <MetricCard
              title="Avg Duration"
              value={`${workPlan.overview.avgDuration} days`}
              icon={TrendingUp}
              color="purple"
            />
            <MetricCard
              title="Risk Score"
              value={`${workPlan.predictions?.riskScore || 0}/100`}
              icon={AlertTriangle}
              color="red"
            />
          </div>
        </div>
      )}

      <style jsx="true">{`
        .overview-tab {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .analytics-section h3 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--theme-text);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
      `}</style>
    </div>
  )
}

const InsightsTab = ({ analytics }) => {
  const { organization, workPlan } = analytics
  const allInsights = [
    ...(organization?.insights || []),
    ...(workPlan?.risks || [])
  ]

  return (
    <div className="insights-tab">
      <div className="insights-header">
        <h3>
          <Brain size={20} />
          AI-Generated Insights
        </h3>
        <p>Intelligent analysis of your organization and work patterns</p>
      </div>

      <div className="insights-grid">
        {allInsights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>

      {allInsights.length === 0 && (
        <div className="no-insights">
          <CheckCircle size={48} />
          <h4>All Good!</h4>
          <p>No critical insights detected. Your organization appears to be well-structured.</p>
        </div>
      )}

      <style jsx="true">{`
        .insights-tab {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .insights-header h3 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--theme-text);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .insights-header p {
          color: var(--theme-textSecondary);
          margin: 0;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .no-insights {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 3rem;
          color: var(--theme-textSecondary);
        }

        .no-insights h4 {
          color: var(--theme-text);
          margin: 1rem 0 0.5rem 0;
        }
      `}</style>
    </div>
  )
}

const PredictionsTab = ({ analytics }) => {
  const { workPlan } = analytics

  if (!workPlan?.predictions) {
    return (
      <div className="predictions-tab">
        <div className="no-predictions">
          <Zap size={48} />
          <h4>Predictions Unavailable</h4>
          <p>Upload work plan data to see AI-powered predictions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="predictions-tab">
      <div className="predictions-header">
        <h3>
          <Zap size={20} />
          AI Predictions
        </h3>
        <p>Data-driven forecasts and trend analysis</p>
      </div>

      <div className="predictions-content">
        <PredictionCard
          title="Project Completion"
          prediction={workPlan.predictions.completionDate}
          type="date"
          icon={Clock}
        />
        
        <PredictionCard
          title="Risk Assessment"
          prediction={`${workPlan.predictions.riskScore}/100`}
          type="score"
          icon={AlertTriangle}
        />

        {workPlan.predictions.bottlenecks?.length > 0 && (
          <div className="bottlenecks-section">
            <h4>Predicted Bottlenecks</h4>
            {workPlan.predictions.bottlenecks.map((bottleneck, index) => (
              <div key={index} className="bottleneck-item">
                <AlertTriangle size={16} />
                <div>
                  <strong>{bottleneck.squad}</strong>: {bottleneck.type}
                  <div className="bottleneck-details">
                    {bottleneck.projects?.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .predictions-tab {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .predictions-header h3 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--theme-text);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .predictions-header p {
          color: var(--theme-textSecondary);
          margin: 0;
        }

        .predictions-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .bottlenecks-section {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .bottlenecks-section h4 {
          color: var(--theme-text);
          margin: 0 0 1rem 0;
        }

        .bottleneck-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(239, 68, 68, 0.1);
        }

        .bottleneck-item:last-child {
          border-bottom: none;
        }

        .bottleneck-details {
          font-size: 0.875rem;
          color: var(--theme-textSecondary);
          margin-top: 0.25rem;
        }

        .no-predictions {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 3rem;
          color: var(--theme-textSecondary);
        }

        .no-predictions h4 {
          color: var(--theme-text);
          margin: 1rem 0 0.5rem 0;
        }
      `}</style>
    </div>
  )
}

const RecommendationsTab = ({ analytics }) => {
  const { organization, workPlan } = analytics
  const allRecommendations = [
    ...(organization?.recommendations || []),
    ...(workPlan?.recommendations || [])
  ]

  return (
    <div className="recommendations-tab">
      <div className="recommendations-header">
        <h3>
          <Lightbulb size={20} />
          Smart Recommendations
        </h3>
        <p>Actionable suggestions to optimize your organization</p>
      </div>

      <div className="recommendations-list">
        {allRecommendations.map((recommendation, index) => (
          <RecommendationCard key={index} recommendation={recommendation} />
        ))}
      </div>

      {allRecommendations.length === 0 && (
        <div className="no-recommendations">
          <CheckCircle size={48} />
          <h4>Optimized!</h4>
          <p>No immediate recommendations. Your current setup looks good.</p>
        </div>
      )}

      <style jsx="true">{`
        .recommendations-tab {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .recommendations-header h3 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--theme-text);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .recommendations-header p {
          color: var(--theme-textSecondary);
          margin: 0;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .no-recommendations {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 3rem;
          color: var(--theme-textSecondary);
        }

        .no-recommendations h4 {
          color: var(--theme-text);
          margin: 1rem 0 0.5rem 0;
        }
      `}</style>
    </div>
  )
}

// Helper Components
const MetricCard = ({ title, value, icon: Icon, color }) => (
  <div className="metric-card">
    <div className={`metric-icon ${color}`}>
      <Icon size={24} />
    </div>
    <div className="metric-content">
      <div className="metric-value">{value}</div>
      <div className="metric-title">{title}</div>
    </div>

    <style jsx="true">{`
      .metric-card {
        background: var(--glass-bg);
        backdrop-filter: var(--glass-backdrop);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-xl);
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: all var(--transition-normal);
      }

      .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      }

      .metric-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .metric-icon.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
      .metric-icon.green { background: linear-gradient(135deg, #10b981, #047857); }
      .metric-icon.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
      .metric-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
      .metric-icon.red { background: linear-gradient(135deg, #ef4444, #dc2626); }

      .metric-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--theme-text);
        font-family: var(--font-display);
      }

      .metric-title {
        font-size: 0.875rem;
        color: var(--theme-textSecondary);
        font-weight: 500;
      }
    `}</style>
  </div>
)

const InsightCard = ({ insight }) => {
  const getInsightColor = (type) => {
    switch (type) {
      case 'warning': return 'orange'
      case 'error': return 'red'
      case 'info': return 'blue'
      default: return 'blue'
    }
  }

  const color = getInsightColor(insight.type || insight.level)

  return (
    <div className={`insight-card ${color}`}>
      <div className="insight-header">
        <div className="insight-icon">
          {insight.type === 'warning' || insight.level === 'high' ? 
            <AlertTriangle size={20} /> : 
            <Brain size={20} />
          }
        </div>
        <div className="insight-title">{insight.title}</div>
      </div>
      <div className="insight-description">{insight.description}</div>
      {insight.recommendation && (
        <div className="insight-recommendation">
          <strong>Recommendation:</strong> {insight.recommendation}
        </div>
      )}

      <style jsx="true">{`
        .insight-card {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          transition: all var(--transition-normal);
        }

        .insight-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .insight-card.orange { border-left: 4px solid #f59e0b; }
        .insight-card.red { border-left: 4px solid #ef4444; }
        .insight-card.blue { border-left: 4px solid #3b82f6; }

        .insight-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .insight-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--theme-primary);
        }

        .insight-title {
          font-weight: 600;
          color: var(--theme-text);
          font-size: 1rem;
        }

        .insight-description {
          color: var(--theme-textSecondary);
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .insight-recommendation {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          color: var(--theme-text);
        }
      `}</style>
    </div>
  )
}

const PredictionCard = ({ title, prediction, type, icon: Icon }) => (
  <div className="prediction-card">
    <div className="prediction-header">
      <Icon size={20} />
      <h4>{title}</h4>
    </div>
    <div className="prediction-value">
      {type === 'date' ? new Date(prediction).toLocaleDateString() : prediction}
    </div>

    <style jsx="true">{`
      .prediction-card {
        background: var(--glass-bg);
        backdrop-filter: var(--glass-backdrop);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-xl);
        padding: 1.5rem;
      }

      .prediction-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        color: var(--theme-textSecondary);
      }

      .prediction-header h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }

      .prediction-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--theme-text);
        font-family: var(--font-display);
      }
    `}</style>
  </div>
)

const RecommendationCard = ({ recommendation }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'blue'
      default: return 'blue'
    }
  }

  const color = getPriorityColor(recommendation.priority)

  return (
    <div className={`recommendation-card ${color}`}>
      <div className="recommendation-header">
        <div className="recommendation-priority">{recommendation.priority} priority</div>
        <div className="recommendation-category">{recommendation.category}</div>
      </div>
      <h4 className="recommendation-title">{recommendation.title}</h4>
      <p className="recommendation-description">{recommendation.description}</p>
      {recommendation.actions && (
        <div className="recommendation-actions">
          <strong>Suggested Actions:</strong>
          <ul>
            {recommendation.actions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      <style jsx="true">{`
        .recommendation-card {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          transition: all var(--transition-normal);
        }

        .recommendation-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .recommendation-card.red { border-left: 4px solid #ef4444; }
        .recommendation-card.orange { border-left: 4px solid #f59e0b; }
        .recommendation-card.blue { border-left: 4px solid #3b82f6; }

        .recommendation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .recommendation-priority {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--theme-text);
        }

        .recommendation-category {
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .recommendation-title {
          color: var(--theme-text);
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
        }

        .recommendation-description {
          color: var(--theme-textSecondary);
          line-height: 1.5;
          margin: 0 0 1rem 0;
        }

        .recommendation-actions {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
        }

        .recommendation-actions strong {
          color: var(--theme-text);
          display: block;
          margin-bottom: 0.5rem;
        }

        .recommendation-actions ul {
          margin: 0;
          padding-left: 1.5rem;
          color: var(--theme-textSecondary);
        }

        .recommendation-actions li {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  )
}

export default AnalyticsDashboard