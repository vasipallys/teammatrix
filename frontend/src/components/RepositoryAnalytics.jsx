import React, { useState, useEffect } from 'react'
import { 
  GitBranch, 
  GitPullRequest, 
  GitCommit, 
  Users, 
  TrendingUp, 
  Calendar, 
  Code,
  Activity,
  RefreshCw,
  BarChart3,
  PieChart
} from 'lucide-react'

const RepositoryAnalytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/repositories/analytics')
      const result = await response.json()
      
      if (result.success) {
        setAnalytics(result.analytics)
      } else {
        setError(result.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError('Network error: Unable to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !analytics) {
    return (
      <div className="analytics-loading">
        <RefreshCw size={32} className="spin" />
        <p>Loading repository analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-error">
        <p>❌ {error}</p>
        <button onClick={fetchAnalytics} className="btn-primary">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="analytics-empty">
        <GitBranch size={48} />
        <h3>No Repository Data</h3>
        <p>Pull data from Git repositories to see analytics</p>
      </div>
    )
  }

  const { overview, project_types, recent_activity, top_contributors } = analytics

  return (
    <div className="repository-analytics">
      <div className="analytics-header">
        <h2>
          <BarChart3 size={24} />
          Repository Analytics Dashboard
        </h2>
        <button 
          onClick={fetchAnalytics} 
          className="refresh-btn"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="analytics-overview">
        <div className="metric-card">
          <div className="metric-icon repositories">
            <GitBranch size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-number">{overview.total_repositories}</div>
            <div className="metric-label">Repositories</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon pull-requests">
            <GitPullRequest size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-number">{overview.total_pull_requests}</div>
            <div className="metric-label">Pull Requests</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon commits">
            <GitCommit size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-number">{overview.total_commits}</div>
            <div className="metric-label">Commits</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon branches">
            <Code size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-number">{overview.total_branches}</div>
            <div className="metric-label">Branches</div>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Project Types */}
        <div className="analytics-section">
          <h3>
            <PieChart size={20} />
            Project Type Distribution
          </h3>
          <div className="project-types-list">
            {project_types.map((type, index) => (
              <div key={index} className="project-type-item">
                <div className="project-type-bar">
                  <div 
                    className={`project-type-fill ${type.type}`}
                    style={{
                      width: `${(type.count / overview.total_repositories) * 100}%`
                    }}
                  />
                </div>
                <div className="project-type-info">
                  <span className={`project-type-badge ${type.type}`}>
                    {type.type}
                  </span>
                  <span className="project-type-count">{type.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="analytics-section">
          <h3>
            <Activity size={20} />
            Recent Activity (30 Days)
          </h3>
          <div className="activity-stats">
            <div className="activity-item">
              <GitCommit size={16} />
              <span>{recent_activity.commits_last_30_days} commits</span>
            </div>
            <div className="activity-item">
              <GitPullRequest size={16} />
              <span>{recent_activity.prs_last_30_days} pull requests</span>
            </div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="analytics-section full-width">
          <h3>
            <Users size={20} />
            Top Contributors
          </h3>
          <div className="contributors-list">
            {top_contributors.slice(0, 10).map((contributor, index) => (
              <div key={index} className="contributor-item">
                <div className="contributor-rank">#{index + 1}</div>
                <div className="contributor-info">
                  <div className="contributor-name">{contributor.author}</div>
                  <div className="contributor-stats">
                    <GitCommit size={14} />
                    {contributor.commits} commits
                  </div>
                </div>
                <div className="contributor-bar">
                  <div 
                    className="contributor-fill"
                    style={{
                      width: `${(contributor.commits / top_contributors[0].commits) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .repository-analytics {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .analytics-header h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0;
          color: var(--theme-text);
          font-family: var(--font-display);
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--theme-primary);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover:not(:disabled) {
          background: var(--theme-primary);
          transform: translateY(-1px);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .analytics-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .metric-icon.repositories {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .metric-icon.pull-requests {
          background: linear-gradient(135deg, #10b981, #047857);
        }

        .metric-icon.commits {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        }

        .metric-icon.branches {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .metric-number {
          font-size: 2rem;
          font-weight: 700;
          color: var(--theme-text);
          line-height: 1;
        }

        .metric-label {
          font-size: 0.9rem;
          color: var(--theme-textSecondary);
          margin-top: 0.25rem;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .analytics-section {
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .analytics-section.full-width {
          grid-column: 1 / -1;
        }

        .analytics-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 1rem 0;
          color: var(--theme-text);
          font-size: 1.1rem;
        }

        .project-types-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .project-type-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .project-type-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .project-type-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .project-type-fill.spring-boot {
          background: #6cbf3c;
        }

        .project-type-fill.react {
          background: #61dafb;
        }

        .project-type-fill.angular {
          background: #dd4444;
        }

        .project-type-fill.vue {
          background: #4db276;
        }

        .project-type-fill.node {
          background: #68a063;
        }

        .project-type-fill.java {
          background: #ed9121;
        }

        .project-type-fill.python {
          background: #3490dc;
        }

        .project-type-fill.unknown {
          background: #9ca3af;
        }

        .project-type-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 120px;
        }

        .project-type-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .project-type-badge.spring-boot {
          background: rgba(108, 191, 60, 0.2);
          color: #6cbf3c;
        }

        .project-type-badge.react {
          background: rgba(97, 218, 251, 0.2);
          color: #61dafb;
        }

        .project-type-badge.angular {
          background: rgba(221, 68, 68, 0.2);
          color: #dd4444;
        }

        .project-type-badge.vue {
          background: rgba(77, 178, 118, 0.2);
          color: #4db276;
        }

        .project-type-badge.node {
          background: rgba(104, 160, 99, 0.2);
          color: #68a063;
        }

        .project-type-badge.java {
          background: rgba(237, 145, 33, 0.2);
          color: #ed9121;
        }

        .project-type-badge.python {
          background: rgba(52, 144, 220, 0.2);
          color: #3490dc;
        }

        .project-type-badge.unknown {
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
        }

        .project-type-count {
          font-weight: 600;
          color: var(--theme-text);
        }

        .activity-stats {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: var(--theme-text);
        }

        .contributors-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .contributor-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .contributor-rank {
          font-weight: 600;
          color: var(--theme-primary);
          min-width: 30px;
        }

        .contributor-info {
          flex: 1;
        }

        .contributor-name {
          font-weight: 500;
          color: var(--theme-text);
          margin-bottom: 0.25rem;
        }

        .contributor-stats {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--theme-textSecondary);
        }

        .contributor-bar {
          width: 100px;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .contributor-fill {
          height: 100%;
          background: var(--theme-primary);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .analytics-loading, .analytics-error, .analytics-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          text-align: center;
          color: var(--theme-textSecondary);
        }

        .analytics-loading .spin {
          color: var(--theme-primary);
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .repository-analytics {
            padding: 1rem;
          }

          .analytics-overview {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .metric-card {
            padding: 1rem;
          }

          .metric-number {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default RepositoryAnalytics