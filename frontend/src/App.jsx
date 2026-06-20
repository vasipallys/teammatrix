import React, { Suspense, lazy, useRef, useState, useEffect } from 'react'
import Header from './components/Header'
import FilterModal from './components/FilterModal'
import LoadingSpinner from './components/LoadingSpinner'
import { NotificationProvider, useNotifications } from './components/NotificationSystem'
import ThemeProvider, { useTheme } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import { getOrgData, getWorkData } from './api'
import { Settings, Users, Calendar, Database, Activity, Zap, Brain, Shield, Target, GitBranch, Server, BarChart3, Eye, Layers, Code } from 'lucide-react'
import NavigationSummary from './components/NavigationSummary'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import CollaborationSystem from './components/CollaborationSystem'
import AdvancedExportSystem from './components/AdvancedExportSystem'
import CommandPalette from './components/CommandPalette'
import AutomationSystem from './components/AutomationSystem'
import HelpSystem from './components/HelpSystem'
import FeatureShowcase from './components/FeatureShowcase'
import SystemStatus from './components/SystemStatus'
import PerformanceDashboard from './components/PerformanceDashboard'

const OrgChart = lazy(() => import('./components/OrgChart'))
const WorkPlan = lazy(() => import('./components/WorkPlan'))
const DataManagement = lazy(() => import('./components/DataManagement'))
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'))
const LDAPSyncInterface = lazy(() => import('./components/LDAPSyncInterface'))
const JiraIntegrationPanel = lazy(() => import('./components/JiraIntegrationPanel'))
const DataQualityDashboard = lazy(() => import('./components/DataQualityDashboard'))
const GitRepositoryManager = lazy(() => import('./components/GitRepositoryManager'))
const DeveloperProfileAnalytics = lazy(() => import('./components/DeveloperProfileAnalytics'))
const PlanVsActualTracker = lazy(() => import('./components/PlanVsActualTracker'))
const ETLPipelineMonitor = lazy(() => import('./components/ETLPipelineMonitor'))

function AppContent() {
  const { currentTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('org')
  const [dataSubTab, setDataSubTab] = useState('data-import-export')
  const [orgData, setOrgData] = useState(null)
  const [workData, setWorkData] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({})
  const [colorBy, setColorBy] = useState('Job Function')
  const [colorScheme, setColorScheme] = useState('Set3')
  const [initialLoading, setInitialLoading] = useState(true)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [showExportSystem, setShowExportSystem] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showAutomationSystem, setShowAutomationSystem] = useState(false)
  const [showHelpSystem, setShowHelpSystem] = useState(false)
  const [showFeatureShowcase, setShowFeatureShowcase] = useState(false)
  const [showSystemStatus, setShowSystemStatus] = useState(false)
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false)
  const [showNavigationSummary, setShowNavigationSummary] = useState(false)
  const initialLoadStarted = useRef(false)
  
  const { success, error, info } = useNotifications()

  // Apply theme class to body when theme changes
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`
  }, [currentTheme])

  useEffect(() => {
    // Global keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            setActiveTab('org')
            break
          case '2':
            e.preventDefault()
            setActiveTab('work')
            break
          case '3':
            e.preventDefault()
            setActiveTab('analytics')
            break
          case '4':
            e.preventDefault()
            setActiveTab('data')
            break
          case '5':
            e.preventDefault()
            setActiveTab('developer')
            break
          case '6':
            e.preventDefault()
            setActiveTab('planning')
            break
          case '7':
            e.preventDefault()
            setActiveTab('etl')
            break
          case '/':
            e.preventDefault()
            // Focus search if available
            break
          case 'k':
            e.preventDefault()
            setShowCommandPalette(true)
            break
          case '?':
            e.preventDefault()
            setShowKeyboardShortcuts(true)
            break
          case 'h':
            e.preventDefault()
            setShowHelpSystem(true)
            break
          case 'f':
            e.preventDefault()
            setShowFeatureShowcase(true)
            break
          case 's':
            e.preventDefault()
            setShowSystemStatus(true)
            break
          case 'p':
            e.preventDefault()
            setShowPerformanceDashboard(true)
            break
          case 'n':
            e.preventDefault()
            setShowNavigationSummary(true)
            break
        }
      }
      
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'C':
            e.preventDefault()
            setShowCollaboration(true)
            break
          case 'E':
            e.preventDefault()
            setShowExportSystem(true)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (initialLoadStarted.current) return
    initialLoadStarted.current = true
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load organization data
      try {
        const orgResponse = await getOrgData()
        if (orgResponse.data.success && orgResponse.data.data.length > 0) {
          setOrgData(orgResponse.data)
          success(`Loaded ${orgResponse.data.data.length} organization records`)
          console.log('Loaded org data:', orgResponse.data)
        }
      } catch (orgError) {
        console.log('No existing org data')
      }

      // Load work data
      try {
        const workResponse = await getWorkData()
        if (workResponse.data.success && workResponse.data.data.length > 0) {
          setWorkData(workResponse.data)
          success(`Loaded ${workResponse.data.data.length} work plan items`)
          console.log('Loaded work data:', workResponse.data)
        }
      } catch (workError) {
        console.log('No existing work data')
      }
    } catch (error) {
      console.error('Unexpected error loading data:', error)
      error('Failed to load application data')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleOrgDataLoad = (data) => {
    console.log('Organization data loaded:', data)
    setOrgData(data)
    success(`Organization data updated - ${data.data?.length || 0} records`)
  }

  const handleWorkDataLoad = (data) => {
    console.log('Work data loaded:', data)
    setWorkData(data)
    success(`Work plan data updated - ${data.data?.length || 0} items`)
  }

  const handleNavigate = (tab) => {
    setActiveTab(tab)
    info(`Switched to ${tab} tab`)
  }

  const handleAction = (action) => {
    switch (action) {
      case 'focus-search':
        // Focus search input if available
        const searchInput = document.querySelector('input[type="text"]')
        searchInput?.focus()
        break
      case 'export':
        setShowExportSystem(true)
        break
      case 'collaboration':
        setShowCollaboration(true)
        break
      case 'shortcuts':
        setShowKeyboardShortcuts(true)
        break
      case 'command-palette':
        setShowCommandPalette(true)
        break
      case 'automation':
        setShowAutomationSystem(true)
        break
      case 'help':
        setShowHelpSystem(true)
        break
      case 'feature-showcase':
        setShowFeatureShowcase(true)
        break
      case 'system-status':
        setShowSystemStatus(true)
        break
      case 'performance':
        setShowPerformanceDashboard(true)
        break
      case 'refresh':
        loadData()
        info('Data refreshed')
        break
      case 'fullscreen':
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          document.documentElement.requestFullscreen()
        }
        break
      default:
        info(`Action: ${action}`)
    }
  }

  if (initialLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        text="Initializing NextGen Org Visualizer..."
      />
    )
  }

  return (
    <div className="app-modern">
      <Header 
        onShowCollaboration={() => setShowCollaboration(true)}
        onShowExport={() => setShowExportSystem(true)}
        onShowKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
        onShowHelp={() => setShowHelpSystem(true)}
      />

      <main className="main-content-modern">
        <nav className="tabs-modern" aria-label="Primary navigation">
          <div className="nav-section-label">Workspace</div>
          <button
            className={`tab-modern ${activeTab === 'org' ? 'active' : ''}`}
            onClick={() => setActiveTab('org')}
            aria-current={activeTab === 'org' ? 'page' : undefined}
          >
            <div className="tab-icon">
              <Users size={16} />
            </div>
            <div className="tab-content">
              <div className="tab-title">Organization</div>
              <div className="tab-subtitle">Structure</div>
            </div>
            {orgData?.data?.length > 0 && (
              <div className="tab-badge">{orgData.data.length}</div>
            )}
          </button>
          
          <button
            className={`tab-modern ${activeTab === 'work' ? 'active' : ''}`}
            onClick={() => setActiveTab('work')}
            aria-current={activeTab === 'work' ? 'page' : undefined}
          >
            <div className="tab-icon">
              <Calendar size={16} />
            </div>
            <div className="tab-content">
              <div className="tab-title">Work Plans</div>
              <div className="tab-subtitle">Timeline</div>
            </div>
            {workData?.data?.length > 0 && (
              <div className="tab-badge">{workData.data.length}</div>
            )}
          </button>
          
          <button
            className={`tab-modern ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            aria-current={activeTab === 'analytics' ? 'page' : undefined}
          >
            <div className="tab-icon">
              <Brain size={16} />
            </div>
            <div className="tab-content">
              <div className="tab-title">AI Analytics</div>
              <div className="tab-subtitle">Insights</div>
            </div>
            <div className="tab-status">
              <Zap size={12} />
            </div>
          </button>
          
          <button
            className={`tab-modern ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
            aria-current={activeTab === 'data' ? 'page' : undefined}
          >
            <div className="tab-icon">
              <Database size={16} />
            </div>
            <div className="tab-content">
              <div className="tab-title">Data Center</div>
              <div className="tab-subtitle">Manage</div>
            </div>
            <div className="tab-status">
              <Activity size={12} />
            </div>
          </button>
          
          
          <button
            className={`tab-modern ${activeTab === 'developer' ? 'active' : ''}`}
            onClick={() => setActiveTab('developer')}
            aria-current={activeTab === 'developer' ? 'page' : undefined}
          >
            <div className="tab-icon">
              <GitBranch size={16} />
            </div>
            <div className="tab-content">
              <div className="tab-title">Developer Analytics</div>
              <div className="tab-subtitle">AI Insights</div>
            </div>
            <div className="tab-status">
              <Brain size={12} />
            </div>
          </button>
          
          <button
            className={`tab-modern ${activeTab === 'planning' ? 'active' : ''}`}
            onClick={() => setActiveTab('planning')}
            aria-current={activeTab === 'planning' ? 'page' : undefined}
          >
            <div className="tab-icon">
              <Target size={16} />
            </div>
            <div className="tab-content">
              <div className="tab-title">Plan vs Actual</div>
              <div className="tab-subtitle">Strategic</div>
            </div>
            <div className="tab-status">
              <BarChart3 size={12} />
            </div>
          </button>
          
          <button
            className={`tab-modern ${activeTab === 'etl' ? 'active' : ''}`}
            onClick={() => setActiveTab('etl')}
            aria-current={activeTab === 'etl' ? 'page' : undefined}
          >
            <div className="tab-icon">
              <Activity size={16} />
            </div>
            <div className="tab-content">
              <div className="tab-title">ETL Pipeline</div>
              <div className="tab-subtitle">Monitor</div>
            </div>
            <div className="tab-status">
              <Activity size={12} />
            </div>
          </button>

          <div className="quick-access-panel">
            <div className="quick-access-header">
              <h4>Quick tools</h4>
            </div>
            <div className="quick-access-buttons">
              <button
                className="quick-btn navigation-overview-btn"
                onClick={() => setShowNavigationSummary(true)}
                aria-label="Navigation overview"
                title="Navigation overview (Ctrl+N)"
              >
                <Eye size={16} />
              </button>
              <button
                className="quick-btn"
                onClick={() => { setActiveTab('data'); setDataSubTab('ldap-integration') }}
                aria-label="LDAP integration"
                title="LDAP integration"
              >
                <Server size={16} />
              </button>
              <button
                className="quick-btn"
                onClick={() => { setActiveTab('data'); setDataSubTab('jira-integration') }}
                aria-label="Jira integration"
                title="Jira integration"
              >
                <Layers size={16} />
              </button>
              <button
                className="quick-btn"
                onClick={() => { setActiveTab('data'); setDataSubTab('git-repository') }}
                aria-label="Git repository"
                title="Git repository"
              >
                <Code size={16} />
              </button>
              <button
                className="quick-btn"
                onClick={() => { setActiveTab('data'); setDataSubTab('data-quality') }}
                aria-label="Data quality"
                title="Data quality"
              >
                <Shield size={16} />
              </button>
            </div>
          </div>
        </nav>

        <section className="workspace-modern" aria-live="polite">
          <div className="tab-content-modern">
            <Suspense
              fallback={(
                <div className="route-loading">
                  <LoadingSpinner text="Loading workspace..." />
                </div>
              )}
            >
          {activeTab === 'org' && (
            <div className="org-tab-content-modern">
              <div className="tab-header-modern">
                <div className="header-left">
                  <h2 className="text-gradient">
                    <Users size={18} />
                    Organization Structure Data
                  </h2>
                  <p className="header-description">
                    Interactive organizational hierarchy charts with advanced filtering and navigation
                  </p>
                </div>
                <div className="header-actions">
                  <button
                    className="btn-modern btn-glass"
                    onClick={() => setShowFilters(true)}
                  >
                    <Settings size={14} />
                    Filters
                  </button>
                </div>
              </div>

              {orgData && orgData.data && orgData.data.length > 0 ? (
                <OrgChart
                  data={orgData}
                  filters={filters}
                  colorBy={colorBy}
                  colorScheme={colorScheme}
                />
              ) : (
                <div className="empty-state-modern">
                  <div className="empty-icon">
                    <Users size={64} />
                  </div>
                  <h3>Ready to Visualize Your Organization</h3>
                  <p>Upload your organization data to unlock powerful insights and interactive visualizations.</p>
                  <button 
                    className="btn-modern btn-primary"
                    onClick={() => setActiveTab('data')}
                  >
                    <Database size={18} />
                    Get Started
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'work' && (
            <div className="work-tab-content-modern">
              {workData && workData.data && workData.data.length > 0 ? (
                <>
                  <div className="tab-header-modern">
                    <div className="header-left">
                      <h2 className="text-gradient">
                        <Calendar size={24} />
                        Work Plan Analytics
                      </h2>
                      <p className="header-description">
                        Timeline visualization and project management insights
                      </p>
                    </div>
                  </div>
                  <WorkPlan data={workData} />
                </>
              ) : (
                <div className="empty-state-modern">
                  <div className="empty-icon">
                    <Calendar size={64} />
                  </div>
                  <h3>Project Timeline Awaits</h3>
                  <p>Import your work plan data to create interactive Gantt charts and project analytics.</p>
                  <button 
                    className="btn-modern btn-primary"
                    onClick={() => setActiveTab('data')}
                  >
                    <Database size={18} />
                    Import Data
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-tab-content-modern">
              <div className="tab-header-modern">
                <div className="header-left">
                  <h2 className="text-gradient">
                    <Brain size={24} />
                    AI-Powered Analytics
                  </h2>
                  <p className="header-description">
                    Advanced insights, predictions, and recommendations powered by machine learning
                  </p>
                </div>
              </div>
              <AnalyticsDashboard 
                orgData={orgData} 
                workData={workData}
              />
            </div>
          )}

          {activeTab === 'data' && (
            <div className="data-tab-content-modern">
              <div className="tab-header-modern">
                <div className="header-left">
                  <h2 className="text-gradient">
                    <Database size={18} />
                    Data Management Center
                  </h2>
                  <p className="header-description">
                    Complete data management center with integrations, quality monitoring, and import/export capabilities
                  </p>
                </div>
              </div>

              {/* Sub-navigation */}
              <div className="sub-nav-modern">
                <button
                  className={`sub-nav-btn ${dataSubTab === 'data-import-export' ? 'active' : ''}`}
                  onClick={() => setDataSubTab('data-import-export')}
                >
                  <Database size={16} />
                  <span>Import/Export</span>
                </button>
                <button
                  className={`sub-nav-btn ${dataSubTab === 'ldap-integration' ? 'active' : ''}`}
                  onClick={() => setDataSubTab('ldap-integration')}
                >
                  <Server size={16} />
                  <span>LDAP Directory</span>
                </button>
                <button
                  className={`sub-nav-btn ${dataSubTab === 'jira-integration' ? 'active' : ''}`}
                  onClick={() => setDataSubTab('jira-integration')}
                >
                  <Layers size={16} />
                  <span>Jira Projects</span>
                </button>
                <button
                  className={`sub-nav-btn ${dataSubTab === 'git-repository' ? 'active' : ''}`}
                  onClick={() => setDataSubTab('git-repository')}
                >
                  <GitBranch size={16} />
                  <span>Git Repository</span>
                </button>
                <button
                  className={`sub-nav-btn ${dataSubTab === 'data-quality' ? 'active' : ''}`}
                  onClick={() => setDataSubTab('data-quality')}
                >
                  <Shield size={16} />
                  <span>Data Quality</span>
                </button>
              </div>

              {/* Sub-tab content */}
              {dataSubTab === 'data-import-export' && (
                <DataManagement
                  onOrgDataLoad={handleOrgDataLoad}
                  onWorkDataLoad={handleWorkDataLoad}
                />
              )}

              {dataSubTab === 'ldap-integration' && (
                <LDAPSyncInterface 
                  onEmployeeDataLoad={handleOrgDataLoad}
                />
              )}

              {dataSubTab === 'jira-integration' && (
                <JiraIntegrationPanel />
              )}

              {dataSubTab === 'git-repository' && (
                <GitRepositoryManager 
                  onRepositoryDataLoad={handleOrgDataLoad}
                />
              )}

              {dataSubTab === 'data-quality' && (
                <DataQualityDashboard />
              )}
            </div>
          )}
          
          {activeTab === 'developer' && (
            <div className="developer-tab-content-modern">
              <div className="tab-header-modern">
                <div className="header-left">
                  <h2 className="text-gradient">
                    <GitBranch size={24} />
                    AI-Powered Developer Analytics
                  </h2>
                  <p className="header-description">
                    Advanced developer profiling with intelligent insights
                  </p>
                </div>
              </div>
              <DeveloperProfileAnalytics />
            </div>
          )}
          
          {activeTab === 'planning' && (
            <div className="planning-tab-content-modern">
              <div className="tab-header-modern">
                <div className="header-left">
                  <h2 className="text-gradient">
                    <Target size={24} />
                    Plan vs Actual Tracking
                  </h2>
                  <p className="header-description">
                    Strategic alignment monitoring and variance analysis
                  </p>
                </div>
              </div>
              <PlanVsActualTracker />
            </div>
          )}
          
          {activeTab === 'etl' && (
            <div className="etl-tab-content-modern">
              <div className="tab-header-modern">
                <div className="header-left">
                  <h2 className="text-gradient">
                    <Activity size={24} />
                    ETL Pipeline Monitor
                  </h2>
                  <p className="header-description">
                    Complete data pipeline orchestration and monitoring
                  </p>
                </div>
              </div>
              <ETLPipelineMonitor />
            </div>
          )}
            </Suspense>
          </div>
        </section>
      </main>

      {showFilters && orgData && (
        <FilterModal
          orgData={orgData}
          filters={filters}
          colorBy={colorBy}
          colorScheme={colorScheme}
          onClose={() => setShowFilters(false)}
          onApply={(newFilters, newColorBy, newColorScheme) => {
            setFilters(newFilters)
            setColorBy(newColorBy)
            setColorScheme(newColorScheme)
            setShowFilters(false)
            success('Filters applied successfully')
          }}
        />
      )}

      <KeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        onNavigate={handleNavigate}
        onAction={handleAction}
      />

      <CollaborationSystem
        isOpen={showCollaboration}
        onClose={() => setShowCollaboration(false)}
      />

      <AdvancedExportSystem
        isOpen={showExportSystem}
        onClose={() => setShowExportSystem(false)}
        data={{ org: orgData?.data, work: workData?.data }}
        currentView={activeTab}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={handleNavigate}
        onAction={handleAction}
        currentTab={activeTab}
      />

      <AutomationSystem
        isOpen={showAutomationSystem}
        onClose={() => setShowAutomationSystem(false)}
      />

      <HelpSystem
        isOpen={showHelpSystem}
        onClose={() => setShowHelpSystem(false)}
      />

      <FeatureShowcase
        isOpen={showFeatureShowcase}
        onClose={() => setShowFeatureShowcase(false)}
      />

      <SystemStatus
        isOpen={showSystemStatus}
        onClose={() => setShowSystemStatus(false)}
      />

      <PerformanceDashboard
        isOpen={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
      />

      <NavigationSummary
        isOpen={showNavigationSummary}
        onClose={() => setShowNavigationSummary(false)}
        currentTab={activeTab}
        onNavigate={setActiveTab}
      />

      <style jsx="true">{`
        @media (max-width: 0px) {
        .app-modern {
          min-height: 100vh;
          background: var(--theme-background);
          color: var(--theme-text);
          display: flex;
          flex-direction: column;
        }

        .main-content-modern {
          flex: 1;
          height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .quick-access-panel {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border-bottom: 1px solid var(--glass-border);
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          min-height: 40px;
        }

        .quick-access-header h4 {
          color: var(--theme-text);
          font-size: 0.75rem;
          font-weight: 600;
          margin: 0;
          opacity: 0.8;
        }

        .quick-access-buttons {
          display: flex;
          gap: 0.5rem;
          flex: 1;
        }

        .quick-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-lg);
          background: transparent;
          border: 1px solid var(--glass-border);
          color: var(--theme-textSecondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-normal);
        }

        .quick-btn:hover {
          background: var(--theme-gradient-primary);
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .navigation-overview-btn {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
          border-color: rgba(59, 130, 246, 0.3);
          font-size: 14px;
        }

        .navigation-overview-btn:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8));
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }

        .tabs-modern {
          display: flex;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border-bottom: 1px solid var(--glass-border);
          padding: 0.5rem 1rem;
          gap: 0.25rem;
          overflow-x: auto;
          overflow-y: hidden;
          height: 50px;
          align-items: center;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .tabs-modern::-webkit-scrollbar {
          display: none;
        }

        .tab-modern {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
          color: var(--theme-textSecondary);
          min-width: 120px;
          position: relative;
          overflow: hidden;
          height: 38px;
          flex-shrink: 0;
        }

        .tab-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left var(--transition-slow);
        }

        .tab-modern:hover::before {
          left: 100%;
        }

        .tab-modern:hover {
          background: var(--glass-bg);
          border-color: var(--glass-border);
          color: var(--theme-text);
          transform: translateY(-2px);
        }

        .tab-modern.active {
          background: var(--theme-gradient-primary);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
        }

        .tab-icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-normal);
        }

        .tab-modern.active .tab-icon {
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .tab-content {
          flex: 1;
          text-align: left;
        }

        .tab-title {
          font-weight: 600;
          font-size: 0.8rem;
          margin-bottom: 0.125rem;
        }

        .tab-subtitle {
          font-size: 0.65rem;
          opacity: 0.8;
        }

        .tab-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 24px;
          text-align: center;
        }

        .tab-status {
          color: var(--theme-accent);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .tab-content-modern {
          flex: 1;
          padding: 1rem;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
          height: calc(90vh - 50px);
          overflow-y: auto;
        }

        .tab-header-modern {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .header-left h2 {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-description {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          margin: 0;
          opacity: 0.9;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .empty-state-modern {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 2rem;
          min-height: 400px;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          position: relative;
          overflow: hidden;
        }

        .empty-state-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--theme-gradient-mesh);
          opacity: 0.3;
          z-index: 0;
        }

        .empty-state-modern > * {
          position: relative;
          z-index: 1;
        }

        .empty-icon {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 2rem;
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.3);
          animation: float 6s ease-in-out infinite;
        }

        .empty-state-modern h3 {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          color: var(--theme-text);
        }

        .empty-state-modern p {
          font-size: 1.1rem;
          color: var(--theme-textSecondary);
          margin: 0 0 2rem 0;
          max-width: 500px;
          line-height: 1.6;
        }

        @media (max-width: 1024px) {
          .tab-content-modern {
            padding: 1.5rem;
          }
          
          .tab-header-modern {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }

        @media (max-width: 768px) {
          .quick-access-panel {
            padding: 0.5rem;
            min-height: 35px;
          }

          .quick-access-header h4 {
            font-size: 0.7rem;
          }

          .quick-btn {
            width: 28px;
            height: 28px;
          }

          .tabs-modern {
            padding: 0.5rem;
            gap: 0.25rem;
            height: 45px;
          }

          .tab-modern {
            min-width: 110px;
            padding: 0.5rem 0.5rem;
            height: 35px;
          }

          .tab-title {
            font-size: 0.8rem;
          }

          .tab-subtitle {
            font-size: 0.7rem;
          }

          .tab-icon {
            width: 24px;
            height: 24px;
          }

          .tab-content-modern {
            height: calc(90vh - 85px);
          }

          .header-left h2 {
            font-size: 1.2rem;
          }

          .header-description {
            font-size: 0.85rem;
          }
        }
        }
      `}</style>
    </div>
  )
}

// Main App component with providers
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
