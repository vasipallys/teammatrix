import React, { useState, useEffect } from 'react'
import { 
  GitBranch, 
  Users, 
  Code, 
  Activity, 
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  TestTube,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  GitCommit,
  GitPullRequest,
  Star,
  Calendar,
  TrendingUp,
  Settings
} from 'lucide-react'
import { 
  connectGitRepository, 
  getRepositories, 
  syncRepositoryData, 
  getCommitHistory,
  getPullRequests,
  getRepositoryAnalytics
} from '../api'
import { useNotifications } from './NotificationSystem'

const GitRepositoryManager = ({ onRepositoryDataLoad }) => {
  const [repositories, setRepositories] = useState([])
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [repoAnalytics, setRepoAnalytics] = useState(null)
  const [commits, setCommits] = useState([])
  const [pullRequests, setPullRequests] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState({
    repos: false,
    sync: {},
    analytics: false,
    commits: false,
    pullRequests: false
  })

  const [newRepoConfig, setNewRepoConfig] = useState({
    name: '',
    provider: 'github', // github, bitbucket, gitlab
    url: '',
    accessToken: '',
    username: '',
    projectKey: '', // For Bitbucket
    namespace: '' // For GitLab
  })

  const [showToken, setShowToken] = useState(false)
  const { success, error, info } = useNotifications()

  useEffect(() => {
    loadRepositories()
  }, [])

  const loadRepositories = async () => {
    setLoading(prev => ({ ...prev, repos: true }))
    try {
      const response = await getRepositories()
      if (response.data.success) {
        setRepositories(response.data.repositories || [])
      }
    } catch (err) {
      error('Failed to load repositories')
    } finally {
      setLoading(prev => ({ ...prev, repos: false }))
    }
  }

  const handleAddRepository = async () => {
    try {
      setLoading(prev => ({ ...prev, repos: true }))
      const response = await connectGitRepository(newRepoConfig)
      
      if (response.data.success) {
        success(`Successfully connected to ${newRepoConfig.name}`)
        setShowAddForm(false)
        setNewRepoConfig({
          name: '',
          provider: 'github',
          url: '',
          accessToken: '',
          username: '',
          projectKey: '',
          namespace: ''
        })
        await loadRepositories()
      } else {
        throw new Error(response.data.message || 'Failed to connect repository')
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to connect repository')
    } finally {
      setLoading(prev => ({ ...prev, repos: false }))
    }
  }

  const handleSyncRepository = async (repoId) => {
    setLoading(prev => ({ ...prev, sync: { ...prev.sync, [repoId]: true } }))
    try {
      info(`Syncing repository data...`)
      const response = await syncRepositoryData(repoId)
      
      if (response.data.success) {
        success(`Repository synced successfully - ${response.data.stats.commits} commits, ${response.data.stats.pullRequests} PRs`)
        await loadRepositories()
        
        if (onRepositoryDataLoad) {
          onRepositoryDataLoad(response.data)
        }
      } else {
        throw new Error(response.data.message || 'Sync failed')
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Sync failed')
    } finally {
      setLoading(prev => ({ ...prev, sync: { ...prev.sync, [repoId]: false } }))
    }
  }

  const loadRepositoryDetails = async (repo) => {
    setSelectedRepo(repo)
    setLoading(prev => ({ ...prev, analytics: true, commits: true, pullRequests: true }))
    
    try {
      // Load analytics
      const analyticsResponse = await getRepositoryAnalytics(repo.id)
      if (analyticsResponse.data.success) {
        setRepoAnalytics(analyticsResponse.data.analytics)
      }
      setLoading(prev => ({ ...prev, analytics: false }))

      // Load recent commits
      const commitsResponse = await getCommitHistory(repo.id, { limit: 10 })
      if (commitsResponse.data.success) {
        setCommits(commitsResponse.data.commits || [])
      }
      setLoading(prev => ({ ...prev, commits: false }))

      // Load recent pull requests
      const prsResponse = await getPullRequests(repo.id, { limit: 10 })
      if (prsResponse.data.success) {
        setPullRequests(prsResponse.data.pullRequests || [])
      }
      setLoading(prev => ({ ...prev, pullRequests: false }))

    } catch (err) {
      error('Failed to load repository details')
      setLoading(prev => ({ 
        ...prev, 
        analytics: false, 
        commits: false, 
        pullRequests: false 
      }))
    }
  }

  const formatLastActivity = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const activityDate = new Date(date)
    const diffMs = now - activityDate
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}mo ago`
  }

  const getProviderIcon = (provider) => {
    switch (provider?.toLowerCase()) {
      case 'github': return '🐙'
      case 'bitbucket': return '🪣'
      case 'gitlab': return '🦊'
      default: return '📦'
    }
  }

  const getLanguageColor = (language) => {
    const colors = {
      javascript: '#f7df1e',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#ed8b00',
      csharp: '#239120',
      cpp: '#00599c',
      go: '#00add8',
      rust: '#000000',
      php: '#777bb4',
      ruby: '#cc342d',
      swift: '#fa7343',
      kotlin: '#7f52ff'
    }
    return colors[language?.toLowerCase()] || '#6b7280'
  }

  return (
    <div className="git-repository-manager">
      <div className="git-header">
        <div className="git-title">
          <GitBranch size={24} />
          <h3>Git Repository Integration</h3>
        </div>
        <button 
          className="btn-add-repo" 
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={loading.repos}
        >
          <Plus size={16} />
          Connect Repository
        </button>
      </div>

      {showAddForm && (
        <div className="add-repository-form">
          <div className="form-header">
            <h4>Connect New Repository</h4>
            <button 
              className="btn-close" 
              onClick={() => setShowAddForm(false)}
            >
              ×
            </button>
          </div>

          <div className="repo-form-grid">
            <div className="form-group">
              <label>Repository Name</label>
              <input
                type="text"
                value={newRepoConfig.name}
                onChange={(e) => setNewRepoConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Awesome Project"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Git Provider</label>
              <select
                value={newRepoConfig.provider}
                onChange={(e) => setNewRepoConfig(prev => ({ ...prev, provider: e.target.value }))}
                className="form-input"
              >
                <option value="github">GitHub</option>
                <option value="bitbucket">Bitbucket</option>
                <option value="gitlab">GitLab</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Repository URL</label>
              <input
                type="url"
                value={newRepoConfig.url}
                onChange={(e) => setNewRepoConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://github.com/username/repository"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={newRepoConfig.username}
                onChange={(e) => setNewRepoConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="github_username"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Access Token</label>
              <div className="password-input-wrapper">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={newRepoConfig.accessToken}
                  onChange={(e) => setNewRepoConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  placeholder="Personal access token"
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {newRepoConfig.provider === 'bitbucket' && (
              <div className="form-group">
                <label>Project Key</label>
                <input
                  type="text"
                  value={newRepoConfig.projectKey}
                  onChange={(e) => setNewRepoConfig(prev => ({ ...prev, projectKey: e.target.value }))}
                  placeholder="PROJ"
                  className="form-input"
                />
              </div>
            )}

            {newRepoConfig.provider === 'gitlab' && (
              <div className="form-group">
                <label>Namespace/Group</label>
                <input
                  type="text"
                  value={newRepoConfig.namespace}
                  onChange={(e) => setNewRepoConfig(prev => ({ ...prev, namespace: e.target.value }))}
                  placeholder="my-group"
                  className="form-input"
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              className="btn-cancel" 
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
            <button 
              className="btn-connect" 
              onClick={handleAddRepository}
              disabled={!newRepoConfig.name || !newRepoConfig.url || !newRepoConfig.accessToken}
            >
              <GitBranch size={16} />
              Connect Repository
            </button>
          </div>
        </div>
      )}

      <div className="repositories-grid">
        {/* Repository List */}
        <div className="repository-list">
          <h4>
            <GitBranch size={18} />
            Connected Repositories ({repositories.length})
          </h4>

          {loading.repos ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading repositories...</p>
            </div>
          ) : repositories.length === 0 ? (
            <div className="empty-state">
              <GitBranch size={48} />
              <h5>No repositories connected</h5>
              <p>Connect your Git repositories to start tracking development metrics</p>
            </div>
          ) : (
            <div className="repo-cards">
              {repositories.map((repo) => (
                <div 
                  key={repo.id} 
                  className={`repo-card ${selectedRepo?.id === repo.id ? 'selected' : ''}`}
                  onClick={() => loadRepositoryDetails(repo)}
                >
                  <div className="repo-header">
                    <div className="repo-name">
                      <span className="provider-icon">{getProviderIcon(repo.provider)}</span>
                      <span className="name">{repo.repo_name}</span>
                    </div>
                    <div className="repo-actions">
                      <button
                        className="btn-sync"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSyncRepository(repo.id)
                        }}
                        disabled={loading.sync[repo.id]}
                        title="Sync repository data"
                      >
                        <RefreshCw size={14} className={loading.sync[repo.id] ? 'spin' : ''} />
                      </button>
                    </div>
                  </div>

                  <div className="repo-stats">
                    <div className="stat">
                      <GitCommit size={14} />
                      <span>{repo.commit_count || 0}</span>
                    </div>
                    <div className="stat">
                      <GitPullRequest size={14} />
                      <span>{repo.pr_count || 0}</span>
                    </div>
                    <div className="stat">
                      <Users size={14} />
                      <span>{repo.contributors?.length || 0}</span>
                    </div>
                  </div>

                  {repo.primary_language && (
                    <div className="repo-language">
                      <div 
                        className="language-dot"
                        style={{ backgroundColor: getLanguageColor(repo.primary_language) }}
                      ></div>
                      <span>{repo.primary_language}</span>
                    </div>
                  )}

                  <div className="repo-activity">
                    <Clock size={12} />
                    <span>Last activity: {formatLastActivity(repo.last_activity)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repository Details */}
        {selectedRepo && (
          <div className="repository-details">
            <div className="details-header">
              <div className="repo-info">
                <h4>
                  <span className="provider-icon">{getProviderIcon(selectedRepo.provider)}</span>
                  {selectedRepo.repo_name}
                </h4>
                <div className="repo-meta">
                  <span className="repo-size">{(selectedRepo.size_kb / 1024).toFixed(1)} MB</span>
                  <span className="repo-status">{selectedRepo.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>

            {/* Analytics Summary */}
            {repoAnalytics && (
              <div className="analytics-summary">
                <h5>
                  <TrendingUp size={16} />
                  Repository Analytics
                </h5>
                <div className="analytics-grid">
                  <div className="metric-card">
                    <div className="metric-value">{repoAnalytics.totalCommits}</div>
                    <div className="metric-label">Total Commits</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">{repoAnalytics.activeContributors}</div>
                    <div className="metric-label">Active Contributors</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">{repoAnalytics.codeChurn}%</div>
                    <div className="metric-label">Code Churn</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">{repoAnalytics.avgPRSize}</div>
                    <div className="metric-label">Avg PR Size</div>
                  </div>
                </div>
              </div>
            )}

            {/* Language Distribution */}
            {selectedRepo.languages && Object.keys(selectedRepo.languages).length > 0 && (
              <div className="language-distribution">
                <h5>
                  <Code size={16} />
                  Language Distribution
                </h5>
                <div className="language-bars">
                  {Object.entries(selectedRepo.languages)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([language, percentage]) => (
                      <div key={language} className="language-bar">
                        <div className="language-info">
                          <div 
                            className="language-color"
                            style={{ backgroundColor: getLanguageColor(language) }}
                          ></div>
                          <span className="language-name">{language}</span>
                          <span className="language-percentage">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: getLanguageColor(language)
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Recent Commits */}
            <div className="recent-commits">
              <h5>
                <GitCommit size={16} />
                Recent Commits
              </h5>
              {loading.commits ? (
                <div className="loading-inline">Loading commits...</div>
              ) : commits.length === 0 ? (
                <div className="empty-inline">No commits found</div>
              ) : (
                <div className="commit-list">
                  {commits.slice(0, 5).map((commit) => (
                    <div key={commit.commit_hash} className="commit-item">
                      <div className="commit-info">
                        <div className="commit-message">{commit.message}</div>
                        <div className="commit-meta">
                          <span className="commit-author">{commit.author_name}</span>
                          <span className="commit-date">{formatLastActivity(commit.commit_date)}</span>
                        </div>
                      </div>
                      <div className="commit-stats">
                        <span className="additions">+{commit.lines_added}</span>
                        <span className="deletions">-{commit.lines_deleted}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Pull Requests */}
            <div className="recent-pull-requests">
              <h5>
                <GitPullRequest size={16} />
                Recent Pull Requests
              </h5>
              {loading.pullRequests ? (
                <div className="loading-inline">Loading pull requests...</div>
              ) : pullRequests.length === 0 ? (
                <div className="empty-inline">No pull requests found</div>
              ) : (
                <div className="pr-list">
                  {pullRequests.slice(0, 5).map((pr) => (
                    <div key={pr.pr_id} className="pr-item">
                      <div className="pr-info">
                        <div className="pr-title">{pr.title}</div>
                        <div className="pr-meta">
                          <span className="pr-author">{pr.author_id}</span>
                          <span className={`pr-state ${pr.state}`}>{pr.state}</span>
                          <span className="pr-date">{formatLastActivity(pr.created_date)}</span>
                        </div>
                      </div>
                      <div className="pr-stats">
                        <span className="pr-commits">{pr.commits_count} commits</span>
                        <span className="pr-files">{pr.files_changed} files</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx="true">{`
        .git-repository-manager {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
        }

        .git-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .git-title {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .git-title h3 {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .btn-add-repo {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md) var(--space-lg);
          background: var(--theme-gradient-primary);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-family: var(--font-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-add-repo:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
        }

        .btn-add-repo:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .add-repository-form {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-xl);
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .form-header h4 {
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

        .repo-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .form-group.full-width {
          grid-column: 1 / -1;
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
          justify-content: flex-end;
          gap: var(--space-md);
        }

        .btn-cancel,
        .btn-connect {
          padding: var(--space-md) var(--space-lg);
          border: none;
          border-radius: var(--radius-lg);
          font-family: var(--font-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-cancel {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--theme-text);
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-connect {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: var(--theme-gradient-primary);
          color: white;
        }

        .btn-connect:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-connect:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .repositories-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: var(--space-xl);
          min-height: 600px;
        }

        .repository-list {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .repository-list h4 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-lg) 0;
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

        .repo-cards {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .repo-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .repo-card:hover {
          transform: translateY(-2px);
          border-color: var(--theme-primary);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .repo-card.selected {
          border-color: var(--theme-primary);
          background: rgba(59, 130, 246, 0.05);
        }

        .repo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        }

        .repo-name {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .provider-icon {
          font-size: 1.2rem;
        }

        .repo-name .name {
          color: var(--theme-text);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .repo-actions {
          display: flex;
          gap: var(--space-sm);
        }

        .btn-sync {
          background: transparent;
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-xs);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .btn-sync:hover:not(:disabled) {
          color: var(--theme-text);
          border-color: var(--theme-primary);
        }

        .btn-sync:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        .repo-stats {
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

        .repo-language {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          margin-bottom: var(--space-sm);
          font-size: 0.8rem;
          color: var(--theme-text);
        }

        .language-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .repo-activity {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .repository-details {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          overflow-y: auto;
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .repo-info h4 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 var(--space-sm) 0;
        }

        .repo-meta {
          display: flex;
          gap: var(--space-md);
          font-size: 0.8rem;
          color: var(--theme-textSecondary);
        }

        .analytics-summary,
        .language-distribution,
        .recent-commits,
        .recent-pull-requests {
          margin-bottom: var(--space-xl);
        }

        .analytics-summary h5,
        .language-distribution h5,
        .recent-commits h5,
        .recent-pull-requests h5 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 var(--space-md) 0;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-md);
        }

        .metric-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          text-align: center;
        }

        .metric-value {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--space-xs);
        }

        .metric-label {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .language-bars {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .language-bar {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .language-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .language-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .language-name {
          color: var(--theme-text);
          font-size: 0.8rem;
          flex: 1;
        }

        .language-percentage {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .progress-bar {
          height: 4px;
          background: var(--glass-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width var(--transition-normal);
        }

        .commit-list,
        .pr-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .commit-item,
        .pr-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
        }

        .commit-info,
        .pr-info {
          flex: 1;
        }

        .commit-message,
        .pr-title {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: var(--space-xs);
          line-height: 1.4;
        }

        .commit-meta,
        .pr-meta {
          display: flex;
          gap: var(--space-md);
          font-size: 0.75rem;
          color: var(--theme-textSecondary);
        }

        .pr-state {
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 600;
        }

        .pr-state.open {
          background: rgba(34, 197, 94, 0.2);
          color: var(--accent-green);
        }

        .pr-state.merged {
          background: rgba(147, 51, 234, 0.2);
          color: var(--accent-purple);
        }

        .pr-state.closed {
          background: rgba(239, 68, 68, 0.2);
          color: var(--accent-red);
        }

        .commit-stats,
        .pr-stats {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--space-xs);
          font-size: 0.75rem;
        }

        .additions {
          color: var(--accent-green);
        }

        .deletions {
          color: var(--accent-red);
        }

        .pr-stats span {
          color: var(--theme-textSecondary);
        }

        .loading-inline,
        .empty-inline {
          text-align: center;
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
          padding: var(--space-lg);
          font-style: italic;
        }

        @media (max-width: 1200px) {
          .repositories-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .repo-form-grid {
            grid-template-columns: 1fr;
          }

          .analytics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default GitRepositoryManager