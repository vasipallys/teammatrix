import React, { useState, useEffect } from 'react'
import { 
  User, 
  Code, 
  GitBranch, 
  Target, 
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  Zap,
  Brain,
  Lightbulb,
  Users,
  Clock,
  CheckCircle,
  GitCommit,
  GitPullRequest,
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  getDeveloperProfile,
  getProductivityMetrics,
  getSquadAnalysis,
  exportDeveloperProfiles
} from '../api'
import { useNotifications } from './NotificationSystem'

const DeveloperProfileAnalytics = ({ selectedEmployees, onProfileSelect }) => {
  const [profiles, setProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [productivityMetrics, setProductivityMetrics] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCriteria, setFilterCriteria] = useState({
    performance: 'all', // high, medium, low
    techStack: 'all',
    squad: 'all',
    experience: 'all'
  })

  const [loading, setLoading] = useState({
    profiles: false,
    profile: false,
    metrics: false,
    export: false
  })

  const [aiInsights, setAiInsights] = useState(null)
  const [profileComparisons, setProfileComparisons] = useState([])

  const { success, error, info } = useNotifications()

  useEffect(() => {
    if (selectedEmployees && selectedEmployees.length > 0) {
      loadDeveloperProfiles()
    }
    loadProductivityMetrics()
  }, [selectedEmployees])

  const loadDeveloperProfiles = async () => {
    setLoading(prev => ({ ...prev, profiles: true }))
    try {
      const profilePromises = selectedEmployees.map(emp => 
        getDeveloperProfile(emp.employee_id)
      )
      const responses = await Promise.all(profilePromises)
      
      const validProfiles = responses
        .filter(response => response.data.success)
        .map(response => response.data.profile)
        .filter(profile => profile)

      setProfiles(validProfiles)
      generateAIInsights(validProfiles)
    } catch (err) {
      error('Failed to load developer profiles')
    } finally {
      setLoading(prev => ({ ...prev, profiles: false }))
    }
  }

  const loadProductivityMetrics = async () => {
    setLoading(prev => ({ ...prev, metrics: true }))
    try {
      const response = await getProductivityMetrics('30d')
      if (response.data.success) {
        setProductivityMetrics(response.data.metrics)
      }
    } catch (err) {
      console.warn('Could not load productivity metrics:', err)
    } finally {
      setLoading(prev => ({ ...prev, metrics: false }))
    }
  }

  const handleProfileSelect = async (profile) => {
    setLoading(prev => ({ ...prev, profile: true }))
    setSelectedProfile(profile)
    
    if (onProfileSelect) {
      onProfileSelect(profile)
    }

    // Load detailed profile data
    try {
      const response = await getDeveloperProfile(profile.employee.employee_id)
      if (response.data.success) {
        setSelectedProfile(response.data.profile)
      }
    } catch (err) {
      console.warn('Could not load detailed profile:', err)
    } finally {
      setLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const generateAIInsights = (profileData) => {
    // Simulate AI-powered insights generation
    const insights = {
      topPerformers: profileData
        .sort((a, b) => (b.metrics?.commitCount || 0) - (a.metrics?.commitCount || 0))
        .slice(0, 3),
      
      emergingTalents: profileData.filter(profile => 
        profile.metrics?.isFullStack && 
        (profile.metrics?.commitCount || 0) > 50
      ).slice(0, 3),
      
      techStackDiversity: calculateTechStackDiversity(profileData),
      
      collaborationPatterns: analyzeCollaborationPatterns(profileData),
      
      skillGaps: identifySkillGaps(profileData),
      
      recommendations: generateRecommendations(profileData)
    }
    
    setAiInsights(insights)
  }

  const calculateTechStackDiversity = (profiles) => {
    const allLanguages = new Set()
    profiles.forEach(profile => {
      profile.metrics?.techStackSpread?.forEach(lang => allLanguages.add(lang))
    })

    return {
      totalLanguages: allLanguages.size,
      averagePerDeveloper: profiles.length > 0 
        ? Array.from(allLanguages).length / profiles.length 
        : 0,
      mostCommon: Array.from(allLanguages).slice(0, 5),
      polyglots: profiles.filter(p => (p.metrics?.languageCount || 0) > 3)
    }
  }

  const analyzeCollaborationPatterns = (profiles) => {
    return {
      highCollaborators: profiles.filter(p => (p.metrics?.repositoryCount || 0) > 5),
      soloContributors: profiles.filter(p => (p.metrics?.repositoryCount || 0) <= 2),
      averageReposPerDeveloper: profiles.length > 0 
        ? profiles.reduce((sum, p) => sum + (p.metrics?.repositoryCount || 0), 0) / profiles.length
        : 0
    }
  }

  const identifySkillGaps = (profiles) => {
    const skillCoverage = {}
    profiles.forEach(profile => {
      profile.metrics?.techStackSpread?.forEach(skill => {
        skillCoverage[skill] = (skillCoverage[skill] || 0) + 1
      })
    })

    const totalProfiles = profiles.length
    const gaps = Object.entries(skillCoverage)
      .map(([skill, count]) => ({
        skill,
        coverage: (count / totalProfiles) * 100,
        gap: 100 - (count / totalProfiles) * 100
      }))
      .filter(item => item.coverage < 30)
      .sort((a, b) => b.gap - a.gap)

    return gaps.slice(0, 5)
  }

  const generateRecommendations = (profiles) => {
    const recommendations = []
    
    // Performance-based recommendations
    const lowPerformers = profiles.filter(p => (p.metrics?.commitCount || 0) < 10)
    if (lowPerformers.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Support Underperforming Developers',
        description: `${lowPerformers.length} developers show low activity. Consider pair programming or mentorship.`,
        affected: lowPerformers.length
      })
    }

    // Skill diversity recommendations
    const specialists = profiles.filter(p => (p.metrics?.languageCount || 0) === 1)
    if (specialists.length > profiles.length * 0.3) {
      recommendations.push({
        type: 'skills',
        priority: 'medium',
        title: 'Increase Tech Stack Diversity',
        description: 'Many developers work with single technologies. Consider cross-training initiatives.',
        affected: specialists.length
      })
    }

    // Collaboration recommendations
    const isolatedDevelopers = profiles.filter(p => (p.metrics?.repositoryCount || 0) <= 1)
    if (isolatedDevelopers.length > 0) {
      recommendations.push({
        type: 'collaboration',
        priority: 'medium',
        title: 'Improve Cross-team Collaboration',
        description: `${isolatedDevelopers.length} developers work in isolation. Encourage cross-repository contributions.`,
        affected: isolatedDevelopers.length
      })
    }

    return recommendations
  }

  const handleExportProfiles = async () => {
    setLoading(prev => ({ ...prev, export: true }))
    try {
      const response = await exportDeveloperProfiles('json')
      
      // Create and trigger download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `developer-profiles-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      success('Developer profiles exported successfully')
    } catch (err) {
      error('Failed to export profiles')
    } finally {
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !searchQuery || 
      profile.employee?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.employee?.mail?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPerformance = filterCriteria.performance === 'all' ||
      (filterCriteria.performance === 'high' && (profile.metrics?.commitCount || 0) > 50) ||
      (filterCriteria.performance === 'medium' && (profile.metrics?.commitCount || 0) > 20 && (profile.metrics?.commitCount || 0) <= 50) ||
      (filterCriteria.performance === 'low' && (profile.metrics?.commitCount || 0) <= 20)

    const matchesTechStack = filterCriteria.techStack === 'all' ||
      profile.metrics?.techStackSpread?.includes(filterCriteria.techStack)

    return matchesSearch && matchesPerformance && matchesTechStack
  })

  const getPerformanceLevel = (metrics) => {
    if (!metrics) return 'unknown'
    const commits = metrics.commitCount || 0
    if (commits > 50) return 'high'
    if (commits > 20) return 'medium'
    return 'low'
  }

  const getPerformanceColor = (level) => {
    switch (level) {
      case 'high': return 'var(--accent-green)'
      case 'medium': return 'var(--accent-yellow)'
      case 'low': return 'var(--accent-red)'
      default: return 'var(--theme-textSecondary)'
    }
  }

  return (
    <div className="developer-profile-analytics">
      <div className="analytics-header">
        <div className="analytics-title">
          <Brain size={24} />
          <h3>AI-Powered Developer Analytics</h3>
        </div>
        <div className="header-actions">
          <button 
            className="btn-export" 
            onClick={handleExportProfiles}
            disabled={loading.export || profiles.length === 0}
          >
            <Download size={16} />
            {loading.export ? 'Exporting...' : 'Export Profiles'}
          </button>
          <button 
            className="btn-refresh" 
            onClick={loadDeveloperProfiles}
            disabled={loading.profiles}
          >
            <RefreshCw size={16} className={loading.profiles ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {aiInsights && (
        <div className="ai-insights-panel">
          <div className="insights-header">
            <h4>
              <Lightbulb size={18} />
              AI-Generated Insights
            </h4>
          </div>

          <div className="insights-grid">
            {/* Top Performers */}
            <div className="insight-card performers">
              <div className="insight-title">
                <Award size={16} />
                Top Performers
              </div>
              <div className="performer-list">
                {aiInsights.topPerformers.map((profile, index) => (
                  <div key={index} className="performer-item">
                    <div className="performer-rank">#{index + 1}</div>
                    <div className="performer-info">
                      <div className="performer-name">{profile.employee?.display_name}</div>
                      <div className="performer-metric">
                        {profile.metrics?.commitCount || 0} commits
                      </div>
                    </div>
                    <div className="performer-badge">
                      <TrendingUp size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack Diversity */}
            <div className="insight-card diversity">
              <div className="insight-title">
                <Code size={16} />
                Tech Stack Analysis
              </div>
              <div className="diversity-stats">
                <div className="diversity-metric">
                  <div className="metric-value">{aiInsights.techStackDiversity.totalLanguages}</div>
                  <div className="metric-label">Total Languages</div>
                </div>
                <div className="diversity-metric">
                  <div className="metric-value">{aiInsights.techStackDiversity.polyglots.length}</div>
                  <div className="metric-label">Polyglot Developers</div>
                </div>
                <div className="diversity-metric">
                  <div className="metric-value">{aiInsights.techStackDiversity.averagePerDeveloper.toFixed(1)}</div>
                  <div className="metric-label">Avg Languages/Dev</div>
                </div>
              </div>
            </div>

            {/* Collaboration Patterns */}
            <div className="insight-card collaboration">
              <div className="insight-title">
                <Users size={16} />
                Collaboration Patterns
              </div>
              <div className="collaboration-stats">
                <div className="collab-item">
                  <span className="collab-label">High Collaborators</span>
                  <span className="collab-value">{aiInsights.collaborationPatterns.highCollaborators.length}</span>
                </div>
                <div className="collab-item">
                  <span className="collab-label">Solo Contributors</span>
                  <span className="collab-value">{aiInsights.collaborationPatterns.soloContributors.length}</span>
                </div>
                <div className="collab-item">
                  <span className="collab-label">Avg Repos/Dev</span>
                  <span className="collab-value">{aiInsights.collaborationPatterns.averageReposPerDeveloper.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="insight-card recommendations">
              <div className="insight-title">
                <Zap size={16} />
                AI Recommendations
              </div>
              <div className="recommendation-list">
                {aiInsights.recommendations.map((rec, index) => (
                  <div key={index} className={`recommendation-item ${rec.priority}`}>
                    <div className="recommendation-header">
                      <span className="recommendation-title">{rec.title}</span>
                      <span className={`priority-badge ${rec.priority}`}>{rec.priority}</span>
                    </div>
                    <div className="recommendation-description">{rec.description}</div>
                    <div className="recommendation-impact">
                      Affects {rec.affected} developer{rec.affected !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="analytics-content">
        {/* Filters and Search */}
        <div className="analytics-controls">
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search developers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select
              value={filterCriteria.performance}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, performance: e.target.value }))}
              className="filter-select"
            >
              <option value="all">All Performance Levels</option>
              <option value="high">High Performers</option>
              <option value="medium">Medium Performers</option>
              <option value="low">Low Performers</option>
            </select>

            <select
              value={filterCriteria.techStack}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, techStack: e.target.value }))}
              className="filter-select"
            >
              <option value="all">All Tech Stacks</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="TypeScript">TypeScript</option>
              <option value="C#">C#</option>
            </select>
          </div>
        </div>

        <div className="profiles-grid">
          {/* Profile List */}
          <div className="profiles-list">
            <h4>
              <Users size={18} />
              Developer Profiles ({filteredProfiles.length})
            </h4>

            {loading.profiles ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading profiles...</p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="empty-state">
                <User size={48} />
                <h5>No profiles found</h5>
                <p>Select employees to analyze developer profiles</p>
              </div>
            ) : (
              <div className="profile-cards">
                {filteredProfiles.map((profile) => (
                  <div 
                    key={profile.employee?.employee_id} 
                    className={`profile-card ${selectedProfile?.employee?.employee_id === profile.employee?.employee_id ? 'selected' : ''}`}
                    onClick={() => handleProfileSelect(profile)}
                  >
                    <div className="profile-header">
                      <div className="profile-avatar">
                        {profile.employee?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="profile-info">
                        <div className="profile-name">{profile.employee?.display_name || 'Unknown'}</div>
                        <div className="profile-role">{profile.employee?.title || 'Developer'}</div>
                        <div className="profile-email">{profile.employee?.mail}</div>
                      </div>
                      <div 
                        className="performance-indicator"
                        style={{ color: getPerformanceColor(getPerformanceLevel(profile.metrics)) }}
                      >
                        {getPerformanceLevel(profile.metrics)}
                      </div>
                    </div>

                    <div className="profile-metrics">
                      <div className="metric">
                        <GitCommit size={12} />
                        <span>{profile.metrics?.commitCount || 0} commits</span>
                      </div>
                      <div className="metric">
                        <FileText size={12} />
                        <span>{profile.metrics?.storiesCompleted || 0} stories</span>
                      </div>
                      <div className="metric">
                        <Code size={12} />
                        <span>{profile.metrics?.languageCount || 0} languages</span>
                      </div>
                      <div className="metric">
                        <GitBranch size={12} />
                        <span>{profile.metrics?.repositoryCount || 0} repos</span>
                      </div>
                    </div>

                    {profile.metrics?.techStackSpread && (
                      <div className="tech-stack">
                        {profile.metrics.techStackSpread.slice(0, 3).map((tech, index) => (
                          <div key={index} className="tech-tag">{tech}</div>
                        ))}
                        {profile.metrics.techStackSpread.length > 3 && (
                          <div className="tech-tag more">+{profile.metrics.techStackSpread.length - 3}</div>
                        )}
                      </div>
                    )}

                    <div className="profile-badges">
                      {profile.metrics?.isFullStack && (
                        <div className="badge fullstack">Full-stack</div>
                      )}
                      {(profile.metrics?.commitCount || 0) > 100 && (
                        <div className="badge active">Highly Active</div>
                      )}
                      {(profile.metrics?.storyPoints || 0) > 50 && (
                        <div className="badge productive">High Output</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Profile View */}
          {selectedProfile && (
            <div className="profile-details">
              <div className="details-header">
                <div className="profile-summary">
                  <div className="large-avatar">
                    {selectedProfile.employee?.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="summary-info">
                    <h4>{selectedProfile.employee?.display_name}</h4>
                    <p className="job-title">{selectedProfile.employee?.title}</p>
                    <p className="department">{selectedProfile.employee?.department}</p>
                    <div className="contact-info">
                      <span>{selectedProfile.employee?.mail}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Productivity Overview */}
              <div className="productivity-section">
                <h5>
                  <Activity size={16} />
                  Productivity Overview (Last 30 Days)
                </h5>
                <div className="productivity-grid">
                  <div className="productivity-metric">
                    <div className="metric-icon">
                      <GitCommit size={20} />
                    </div>
                    <div className="metric-data">
                      <div className="metric-value">{selectedProfile.metrics?.commitCount || 0}</div>
                      <div className="metric-label">Commits</div>
                      <div className="metric-trend">
                        <ArrowUpRight size={12} />
                        <span>+12% vs last month</span>
                      </div>
                    </div>
                  </div>

                  <div className="productivity-metric">
                    <div className="metric-icon">
                      <FileText size={20} />
                    </div>
                    <div className="metric-data">
                      <div className="metric-value">{selectedProfile.metrics?.storiesCompleted || 0}</div>
                      <div className="metric-label">Stories</div>
                      <div className="metric-detail">{selectedProfile.metrics?.storyPoints || 0} points</div>
                    </div>
                  </div>

                  <div className="productivity-metric">
                    <div className="metric-icon">
                      <Code size={20} />
                    </div>
                    <div className="metric-data">
                      <div className="metric-value">{selectedProfile.metrics?.linesAdded || 0}</div>
                      <div className="metric-label">Lines Added</div>
                      <div className="metric-detail">-{selectedProfile.metrics?.linesDeleted || 0} removed</div>
                    </div>
                  </div>

                  <div className="productivity-metric">
                    <div className="metric-icon">
                      <GitBranch size={20} />
                    </div>
                    <div className="metric-data">
                      <div className="metric-value">{selectedProfile.metrics?.repositoryCount || 0}</div>
                      <div className="metric-label">Active Repos</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Skills */}
              <div className="skills-section">
                <h5>
                  <Code size={16} />
                  Technical Skills & Languages
                </h5>
                <div className="skills-chart">
                  {selectedProfile.metrics?.techStackSpread?.map((skill, index) => (
                    <div key={index} className="skill-item">
                      <div className="skill-name">{skill}</div>
                      <div className="skill-level">
                        <div className="skill-bar">
                          <div 
                            className="skill-fill"
                            style={{ 
                              width: `${Math.min(100, (selectedProfile.metrics?.commitCount || 0) / 5)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="skill-percentage">
                          {Math.min(100, Math.floor((selectedProfile.metrics?.commitCount || 0) / 5))}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="activity-section">
                <h5>
                  <Clock size={16} />
                  Recent Contributions
                </h5>
                <div className="activity-list">
                  {selectedProfile.commits?.slice(0, 5).map((commit, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        <GitCommit size={14} />
                      </div>
                      <div className="activity-info">
                        <div className="activity-message">{commit.message}</div>
                        <div className="activity-meta">
                          <span className="activity-repo">{commit.repo_id}</span>
                          <span className="activity-date">
                            {new Date(commit.commit_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="activity-stats">
                        <span className="additions">+{commit.lines_added}</span>
                        <span className="deletions">-{commit.lines_deleted}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Insights */}
              <div className="insights-section">
                <h5>
                  <Brain size={16} />
                  AI Performance Insights
                </h5>
                <div className="performance-insights">
                  <div className="insight-item positive">
                    <CheckCircle size={16} />
                    <div className="insight-content">
                      <div className="insight-title">Consistent Contributor</div>
                      <div className="insight-description">
                        Shows steady commit patterns with {selectedProfile.metrics?.commitCount || 0} commits in the last 30 days
                      </div>
                    </div>
                  </div>

                  {selectedProfile.metrics?.isFullStack && (
                    <div className="insight-item positive">
                      <Star size={16} />
                      <div className="insight-content">
                        <div className="insight-title">Full-Stack Developer</div>
                        <div className="insight-description">
                          Demonstrates versatility across {selectedProfile.metrics?.languageCount || 0} programming languages
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedProfile.metrics?.repositoryCount || 0) > 5 && (
                    <div className="insight-item positive">
                      <Users size={16} />
                      <div className="insight-content">
                        <div className="insight-title">Cross-Team Collaborator</div>
                        <div className="insight-description">
                          Actively contributes to {selectedProfile.metrics?.repositoryCount} different repositories
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .developer-profile-analytics {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .analytics-title {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .analytics-title h3 {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: var(--space-md);
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

        .ai-insights-panel {
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.1) 0%,
            rgba(147, 51, 234, 0.05) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          margin-bottom: var(--space-xl);
        }

        .insights-header h4 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-lg) 0;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-lg);
        }

        .insight-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }

        .insight-title {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: var(--space-md);
        }

        .performer-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .performer-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-sm);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
        }

        .performer-rank {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--theme-gradient-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .performer-info {
          flex: 1;
        }

        .performer-name {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .performer-metric {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .performer-badge {
          color: var(--accent-green);
        }

        .diversity-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-md);
        }

        .diversity-metric {
          text-align: center;
        }

        .metric-value {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
        }

        .metric-label {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          margin-top: var(--space-xs);
        }

        .collaboration-stats {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .collab-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
        }

        .collab-label {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .collab-value {
          color: var(--theme-text);
          font-weight: 600;
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .recommendation-item {
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          padding: var(--space-md);
        }

        .recommendation-item.high {
          border-left: 3px solid var(--accent-red);
        }

        .recommendation-item.medium {
          border-left: 3px solid var(--accent-yellow);
        }

        .recommendation-item.low {
          border-left: 3px solid var(--accent-blue);
        }

        .recommendation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-sm);
        }

        .recommendation-title {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .priority-badge {
          padding: 2px 6px;
          border-radius: var(--radius-sm);
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
          font-size: 0.8rem;
          line-height: 1.4;
          margin-bottom: var(--space-xs);
        }

        .recommendation-impact {
          color: var(--accent-green);
          font-size: 0.75rem;
          font-style: italic;
        }

        .analytics-controls {
          display: flex;
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
          padding: var(--space-lg);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex: 1;
        }

        .search-input {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-sm) var(--space-md);
          color: var(--theme-text);
          font-family: var(--font-primary);
          width: 100%;
          transition: all var(--transition-normal);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .filter-controls {
          display: flex;
          gap: var(--space-md);
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

        .profiles-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: var(--space-xl);
          min-height: 600px;
        }

        .profiles-list {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }

        .profiles-list h4 {
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

        .profile-cards {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .profile-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .profile-card:hover {
          transform: translateY(-2px);
          border-color: var(--theme-primary);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .profile-card.selected {
          border-color: var(--theme-primary);
          background: rgba(59, 130, 246, 0.05);
        }

        .profile-header {
          display: flex;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }

        .profile-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .profile-info {
          flex: 1;
        }

        .profile-name {
          color: var(--theme-text);
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: var(--space-xs);
        }

        .profile-role {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          margin-bottom: var(--space-xs);
        }

        .profile-email {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .performance-indicator {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.1);
        }

        .profile-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .metric {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .tech-stack {
          display: flex;
          gap: var(--space-xs);
          flex-wrap: wrap;
          margin-bottom: var(--space-md);
        }

        .tech-tag {
          background: rgba(59, 130, 246, 0.1);
          color: var(--theme-primary);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 600;
        }

        .tech-tag.more {
          background: var(--glass-border);
          color: var(--theme-textSecondary);
        }

        .profile-badges {
          display: flex;
          gap: var(--space-xs);
          flex-wrap: wrap;
        }

        .badge {
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
          font-weight: 600;
        }

        .badge.fullstack {
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent-green);
        }

        .badge.active {
          background: rgba(59, 130, 246, 0.1);
          color: var(--theme-primary);
        }

        .badge.productive {
          background: rgba(245, 158, 11, 0.1);
          color: var(--accent-yellow);
        }

        .profile-details {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          overflow-y: auto;
        }

        .details-header {
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .profile-summary {
          display: flex;
          gap: var(--space-lg);
          align-items: center;
        }

        .large-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 2rem;
        }

        .summary-info h4 {
          color: var(--theme-text);
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0 0 var(--space-sm) 0;
        }

        .job-title {
          color: var(--theme-textSecondary);
          font-size: 1rem;
          font-weight: 500;
          margin: 0 0 var(--space-xs) 0;
        }

        .department {
          color: var(--theme-textSecondary);
          font-size: 0.9rem;
          margin: 0 0 var(--space-md) 0;
        }

        .contact-info {
          color: var(--theme-textSecondary);
          font-size: 0.85rem;
        }

        .productivity-section,
        .skills-section,
        .activity-section,
        .insights-section {
          margin-bottom: var(--space-xl);
        }

        .productivity-section h5,
        .skills-section h5,
        .activity-section h5,
        .insights-section h5 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--theme-text);
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-lg) 0;
        }

        .productivity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-lg);
        }

        .productivity-metric {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .productivity-metric .metric-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .productivity-metric .metric-data {
          flex: 1;
        }

        .productivity-metric .metric-value {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--theme-text);
          margin-bottom: var(--space-xs);
        }

        .productivity-metric .metric-label {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .metric-trend {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--accent-green);
          font-size: 0.75rem;
          margin-top: var(--space-xs);
        }

        .metric-detail {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          margin-top: var(--space-xs);
        }

        .skills-chart {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .skill-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .skill-name {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 500;
          min-width: 100px;
        }

        .skill-level {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex: 1;
        }

        .skill-bar {
          flex: 1;
          height: 6px;
          background: var(--glass-border);
          border-radius: 3px;
          overflow: hidden;
        }

        .skill-fill {
          height: 100%;
          background: var(--theme-gradient-primary);
          transition: width var(--transition-normal);
        }

        .skill-percentage {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-weight: 600;
          min-width: 40px;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .activity-item {
          display: flex;
          gap: var(--space-md);
          padding: var(--space-md);
          background: var(--glass-bg);
          border-radius: var(--radius-lg);
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .activity-info {
          flex: 1;
        }

        .activity-message {
          color: var(--theme-text);
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: var(--space-xs);
          line-height: 1.4;
        }

        .activity-meta {
          display: flex;
          gap: var(--space-md);
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .activity-stats {
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

        .performance-insights {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .insight-item {
          display: flex;
          gap: var(--space-md);
          padding: var(--space-md);
          border-radius: var(--radius-lg);
        }

        .insight-item.positive {
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--accent-green);
        }

        .insight-content {
          flex: 1;
        }

        .insight-item .insight-title {
          color: var(--theme-text);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .insight-item .insight-description {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          line-height: 1.4;
        }

        @media (max-width: 1200px) {
          .profiles-grid {
            grid-template-columns: 1fr;
          }

          .insights-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .analytics-controls {
            flex-direction: column;
          }

          .filter-controls {
            flex-wrap: wrap;
          }

          .productivity-grid {
            grid-template-columns: 1fr;
          }

          .profile-summary {
            flex-direction: column;
            text-align: center;
          }

          .diversity-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default DeveloperProfileAnalytics