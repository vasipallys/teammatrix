import React, { useState, useRef, useEffect } from 'react'
import { Upload, Download, Database, Users, Calendar, RefreshCw, Check, AlertCircle, AlertTriangle, Eye, EyeOff, Trash2, GitBranch, Info, X } from 'lucide-react'
import DataTable from './DataTable'
import {
  uploadOrgFile,
  uploadWorkFile,
  loadSampleOrg,
  loadSampleWork,
  connectLDAP,
  downloadOrgData,
  downloadWorkData,
  updateOrgRecord,
  deleteOrgRecord,
  updateWorkRecord,
  deleteWorkRecord,
  getOrgData,
  getWorkData,
  clearAllData
} from '../api'

const DataManagement = ({ onOrgDataLoad, onWorkDataLoad }) => {
  const [loading, setLoading] = useState({
    orgUpload: false,
    workUpload: false,
    orgSample: false,
    workSample: false,
    ldap: false,
    orgDownload: false,
    workDownload: false,
    clearAll: false,
    gitPull: false
  })
  const [messages, setMessages] = useState({})
  const [showOrgTable, setShowOrgTable] = useState(false)
  const [showWorkTable, setShowWorkTable] = useState(false)
  const [orgData, setOrgData] = useState([])
  const [workData, setWorkData] = useState([])
  const [showRepoModal, setShowRepoModal] = useState(false)
  const [repoConfig, setRepoConfig] = useState({
    type: 'github', // github, bitbucket, gitlab
    url: '',
    username: '',
    token: '',
    projectKey: '',
    timeline: '30' // days
  })
  const [repositories, setRepositories] = useState([])
  const [selectedRepos, setSelectedRepos] = useState([])
  const [repoStep, setRepoStep] = useState('config') // config, repos, processing
  const [viewDataType, setViewDataType] = useState('') // '', 'organization', 'repositories', 'workplan'
  const [repoData, setRepoData] = useState([])
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailData, setDetailData] = useState({ type: '', repository: null, items: [] })
  const [loadingDetail, setLoadingDetail] = useState(false)

  const orgFileRef = useRef(null)
  const workFileRef = useRef(null)
  const dataLoadStarted = useRef(false)

  // Load data on component mount
  useEffect(() => {
    if (dataLoadStarted.current) return
    dataLoadStarted.current = true
    loadCurrentData()
  }, [])

  const loadCurrentData = async () => {
    try {
      const orgResponse = await getOrgData()
      if (orgResponse.data.success) {
        setOrgData(orgResponse.data.data)
      }

      const workResponse = await getWorkData()
      if (workResponse.data.success) {
        setWorkData(workResponse.data.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const showMessage = (key, message, type = 'success') => {
    setMessages(prev => ({ ...prev, [key]: { message, type } }))
    setTimeout(() => {
      setMessages(prev => {
        const { [key]: _, ...rest } = prev
        return rest
      })
    }, 5000)
  }

  const handleOrgFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(prev => ({ ...prev, orgUpload: true }))
    try {
      const response = await uploadOrgFile(file)
      if (response.data.success) {
        onOrgDataLoad(response.data)
        setOrgData(response.data.data)
        showMessage('orgUpload', 'Organization data uploaded successfully!')
      } else {
        showMessage('orgUpload', `Error: ${response.data.error}`, 'error')
      }
    } catch (error) {
      showMessage('orgUpload', `Upload failed: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, orgUpload: false }))
      if (orgFileRef.current) orgFileRef.current.value = ''
    }
  }

  const handleWorkFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(prev => ({ ...prev, workUpload: true }))
    try {
      const response = await uploadWorkFile(file)
      if (response.data.success) {
        onWorkDataLoad(response.data)
        setWorkData(response.data.data)
        showMessage('workUpload', 'Work plan data uploaded successfully!')
      } else {
        showMessage('workUpload', `Error: ${response.data.error}`, 'error')
      }
    } catch (error) {
      showMessage('workUpload', `Upload failed: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, workUpload: false }))
      if (workFileRef.current) workFileRef.current.value = ''
    }
  }

  const handleLoadSampleOrg = async () => {
    setLoading(prev => ({ ...prev, orgSample: true }))
    try {
      const response = await loadSampleOrg()
      if (response.data.success) {
        onOrgDataLoad(response.data)
        setOrgData(response.data.data)
        showMessage('orgSample', 'Sample organization data loaded!')
      }
    } catch (error) {
      showMessage('orgSample', 'Failed to load sample data', 'error')
    } finally {
      setLoading(prev => ({ ...prev, orgSample: false }))
    }
  }

  const handleLoadSampleWork = async () => {
    setLoading(prev => ({ ...prev, workSample: true }))
    try {
      const response = await loadSampleWork()
      if (response.data.success) {
        onWorkDataLoad(response.data)
        setWorkData(response.data.data)
        showMessage('workSample', 'Sample work plan data loaded!')
      }
    } catch (error) {
      showMessage('workSample', 'Failed to load sample data', 'error')
    } finally {
      setLoading(prev => ({ ...prev, workSample: false }))
    }
  }

  const handleLDAPConnect = async () => {
    setLoading(prev => ({ ...prev, ldap: true }))
    try {
      const response = await connectLDAP({})
      if (response.data.success) {
        onOrgDataLoad(response.data)
        setOrgData(response.data.data)
        showMessage('ldap', response.data.message || 'LDAP data synchronized successfully!')
      }
    } catch (error) {
      showMessage('ldap', 'Failed to connect to LDAP', 'error')
    } finally {
      setLoading(prev => ({ ...prev, ldap: false }))
    }
  }

  const handleDownloadOrg = async () => {
    setLoading(prev => ({ ...prev, orgDownload: true }))
    try {
      const response = await downloadOrgData()
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'organization_data.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showMessage('orgDownload', 'Organization data downloaded!')
    } catch (error) {
      showMessage('orgDownload', 'Failed to download data', 'error')
    } finally {
      setLoading(prev => ({ ...prev, orgDownload: false }))
    }
  }

  const handleDownloadWork = async () => {
    setLoading(prev => ({ ...prev, workDownload: true }))
    try {
      const response = await downloadWorkData()
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'work_plan_data.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showMessage('workDownload', 'Work plan data downloaded!')
    } catch (error) {
      showMessage('workDownload', 'Failed to download data', 'error')
    } finally {
      setLoading(prev => ({ ...prev, workDownload: false }))
    }
  }

  const handleUpdateOrgRecord = async (id, data) => {
    try {
      const response = await updateOrgRecord(id, data)
      if (response.data.success) {
        setOrgData(response.data.data)
        onOrgDataLoad(response.data)
        showMessage('orgUpdate', 'Record updated successfully!')
      }
    } catch (error) {
      showMessage('orgUpdate', 'Failed to update record', 'error')
    }
  }

  const handleDeleteOrgRecord = async (id) => {
    try {
      const response = await deleteOrgRecord(id)
      if (response.data.success) {
        setOrgData(response.data.data)
        onOrgDataLoad(response.data)
        showMessage('orgDelete', 'Record deleted successfully!')
      }
    } catch (error) {
      showMessage('orgDelete', 'Failed to delete record', 'error')
    }
  }

  const handleUpdateWorkRecord = async (id, data) => {
    try {
      const response = await updateWorkRecord(id, data)
      if (response.data.success) {
        setWorkData(response.data.data)
        onWorkDataLoad(response.data)
        showMessage('workUpdate', 'Record updated successfully!')
      }
    } catch (error) {
      showMessage('workUpdate', 'Failed to update record', 'error')
    }
  }

  const handleDeleteWorkRecord = async (id) => {
    try {
      const response = await deleteWorkRecord(id)
      if (response.data.success) {
        setWorkData(response.data.data)
        onWorkDataLoad(response.data)
        showMessage('workDelete', 'Record deleted successfully!')
      }
    } catch (error) {
      showMessage('workDelete', 'Failed to delete record', 'error')
    }
  }

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      'WARNING: This will permanently delete ALL data in both Organization and Work Plan tables.\n\nThis action cannot be undone. Are you sure you want to continue?'
    )
    
    if (!confirmed) return

    setLoading(prev => ({ ...prev, clearAll: true }))
    try {
      const response = await clearAllData()
      if (response.data.success) {
        setOrgData([])
        setWorkData([])
        onOrgDataLoad({ data: [], success: true })
        onWorkDataLoad({ data: [], success: true })
        showMessage('clearAll', 'All data cleared successfully!')
      } else {
        showMessage('clearAll', `Error: ${response.data.error}`, 'error')
      }
    } catch (error) {
      showMessage('clearAll', `Failed to clear data: ${error.message}`, 'error')
    } finally {
      setLoading(prev => ({ ...prev, clearAll: false }))
    }
  }

  const handleGitPullClick = () => {
    setShowRepoModal(true)
    setRepoStep('config')
    setRepositories([])
    setSelectedRepos([])
  }

  const handleRepoConfigSubmit = async () => {
    // Enhanced validation
    if (!repoConfig.url.trim()) {
      showMessage('gitPull', 'Repository URL is required', 'error')
      return
    }
    
    if (!repoConfig.username.trim()) {
      showMessage('gitPull', 'Username is required', 'error')
      return
    }
    
    if (!repoConfig.token.trim()) {
      showMessage('gitPull', 'Access token/password is required', 'error')
      return
    }

    // URL validation
    try {
      new URL(repoConfig.url)
    } catch {
      showMessage('gitPull', 'Invalid URL format. Please enter a valid repository URL', 'error')
      return
    }

    setLoading(prev => ({ ...prev, gitPull: true }))
    
    try {
      const response = await fetch('/api/git/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repoConfig)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        if (result.repositories && result.repositories.length > 0) {
          setRepositories(result.repositories)
          setRepoStep('repos')
          showMessage('gitPull', `Connected successfully. Found ${result.repositories.length} repositories`)
        } else {
          showMessage('gitPull', 'Connection successful, but no repositories found. Check your permissions or project key.', 'warning')
          setRepositories([])
          setRepoStep('repos')
        }
      } else {
        let errorMessage = 'Connection failed: '
        
        if (result.error.includes('401') || result.error.includes('Unauthorized')) {
          errorMessage += 'Invalid credentials. Please check your username and token/password.'
        } else if (result.error.includes('403') || result.error.includes('Forbidden')) {
          errorMessage += 'Access denied. Please check your token permissions.'
        } else if (result.error.includes('404')) {
          errorMessage += 'Repository URL not found. Please verify the URL is correct.'
        } else if (result.error.includes('timeout')) {
          errorMessage += 'Connection timeout. Please check your network and try again.'
        } else {
          errorMessage += result.error
        }
        
        showMessage('gitPull', errorMessage, 'error')
      }
    } catch (error) {
      let errorMessage = 'Connection failed: '
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage += 'Network error. Please check your internet connection and server status.'
      } else if (error.message.includes('CORS')) {
        errorMessage += 'Cross-origin request blocked. Please check server CORS configuration.'
      } else {
        errorMessage += error.message
      }
      
      showMessage('gitPull', errorMessage, 'error')
    } finally {
      setLoading(prev => ({ ...prev, gitPull: false }))
    }
  }

  const handleRepoSelection = (repoSlug) => {
    setSelectedRepos(prev => 
      prev.includes(repoSlug) 
        ? prev.filter(r => r !== repoSlug)
        : [...prev, repoSlug]
    )
  }

  const handleDataExtraction = async () => {
    if (selectedRepos.length === 0) {
      showMessage('gitPull', 'Please select at least one repository', 'error')
      return
    }

    setRepoStep('processing')
    setLoading(prev => ({ ...prev, gitPull: true }))
    
    try {
      const response = await fetch('/api/git/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...repoConfig,
          repositories: selectedRepos
        })
      })
      
      const result = await response.json()
      if (result.success) {
        const stats = result.statistics || {}
        const successMessage = `Data extracted successfully.

Processing summary:
- Repositories: ${stats.processed_repositories}/${stats.total_selected}
- Pull requests: ${stats.pull_requests_stored || 0}
- Commits: ${stats.commits_stored || 0}
- Branches: ${stats.branches_stored || 0}

${selectedRepos.length} repositories processed with advanced project type detection.`
        
        showMessage('gitPull', successMessage)
        setShowRepoModal(false)
        
        // Refresh current data if available
        if (typeof loadCurrentData === 'function') {
          loadCurrentData()
        }
      } else {
        showMessage('gitPull', `Extraction failed: ${result.error}`, 'error')
        setRepoStep('repos') // Go back to selection
      }
    } catch (error) {
      showMessage('gitPull', `Network error during extraction: ${error.message}`, 'error')
      setRepoStep('repos') // Go back to selection
    } finally {
      setLoading(prev => ({ ...prev, gitPull: false }))
    }
  }

  const handleViewData = async (dataType) => {
    setViewDataType(dataType)
    setShowViewModal(true)
    
    try {
      if (dataType === 'organization') {
        const response = await getOrgData()
        if (response.data.success) {
          setOrgData(response.data.data)
        }
      } else if (dataType === 'workplan') {
        const response = await getWorkData()
        if (response.data.success) {
          setWorkData(response.data.data)
        }
      } else if (dataType === 'repositories') {
        const response = await fetch('/api/repositories')
        const result = await response.json()
        if (result.success) {
          setRepoData(result.repositories)
        }
      }
    } catch (error) {
      showMessage('viewData', `Failed to load ${dataType} data: ${error.message}`, 'error')
    }
  }

  const getViewDataColumns = () => {
    if (viewDataType === 'organization') {
      return orgColumns
    } else if (viewDataType === 'workplan') {
      return workColumns
    } else if (viewDataType === 'repositories') {
      return [
        { key: 'name', label: 'Repository Name' },
        { key: 'project_type', label: 'Project Type' },
        { key: 'language', label: 'Language' },
        { key: 'repo_type', label: 'Source' },
        { key: 'pull_request_count', label: 'PRs', type: 'clickable', onClick: (value, row) => handleDetailClick('pull_requests', row) },
        { key: 'commit_count', label: 'Commits', type: 'clickable', onClick: (value, row) => handleDetailClick('commits', row) },
        { key: 'branch_count', label: 'Branches', type: 'clickable', onClick: (value, row) => handleDetailClick('branches', row) },
        { key: 'last_activity', label: 'Last Activity', type: 'datetime' }
      ]
    }
    return []
  }

  const getViewData = () => {
    if (viewDataType === 'organization') return orgData
    if (viewDataType === 'workplan') return workData
    if (viewDataType === 'repositories') return repoData
    return []
  }

  const getViewDataTitle = () => {
    if (viewDataType === 'organization') return 'Organization Data Records'
    if (viewDataType === 'workplan') return 'Work Plan Data Records'
    if (viewDataType === 'repositories') return 'Git Repository Data Records'
    return 'Data Records'
  }

  const handleDetailClick = async (detailType, repository) => {
    if (!repository.id || (
      (detailType === 'commits' && !repository.commit_count) ||
      (detailType === 'pull_requests' && !repository.pull_request_count) ||
      (detailType === 'branches' && !repository.branch_count)
    )) {
      showMessage('repoDetail', 'No data available to display', 'warning')
      return
    }

    setDetailData({ type: detailType, repository, items: [] })
    setShowDetailModal(true)
    setLoadingDetail(true)

    try {
      const endpoint = detailType === 'pull_requests' 
        ? 'pull-requests' 
        : detailType

      const response = await fetch(`/api/repositories/${repository.id}/${endpoint}`)
      const result = await response.json()

      if (result.success) {
        setDetailData({
          type: detailType,
          repository: result.repository,
          items: result[detailType] || result.commits || result.pull_requests || result.branches || []
        })
      } else {
        showMessage('repoDetail', `Failed to load ${detailType}: ${result.error}`, 'error')
        setShowDetailModal(false)
      }
    } catch (error) {
      showMessage('repoDetail', `Network error loading ${detailType}: ${error.message}`, 'error')
      setShowDetailModal(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const getDetailTitle = () => {
    if (!detailData.repository) return 'Details'
    
    const typeMap = {
      commits: 'Commits',
      pull_requests: 'Pull Requests', 
      branches: 'Branches'
    }
    
    return `${typeMap[detailData.type] || detailData.type} - ${detailData.repository.name}`
  }

  const getDetailColumns = () => {
    if (detailData.type === 'commits') {
      return [
        { key: 'commit_hash', label: 'Hash', type: 'hash' },
        { key: 'author', label: 'Author' },
        { key: 'message', label: 'Message', type: 'message' },
        { key: 'committed_at', label: 'Date', type: 'datetime' },
        { key: 'files_changed', label: 'Files' },
        { key: 'lines_added', label: '+Lines', type: 'positive' },
        { key: 'lines_deleted', label: '-Lines', type: 'negative' }
      ]
    } else if (detailData.type === 'pull_requests') {
      return [
        { key: 'pr_id', label: 'PR #', type: 'pr-number' },
        { key: 'title', label: 'Title' },
        { key: 'author', label: 'Author' },
        { key: 'state', label: 'State', type: 'pr-state' },
        { key: 'source_branch', label: 'From' },
        { key: 'target_branch', label: 'To' },
        { key: 'created_at', label: 'Created', type: 'datetime' },
        { key: 'files_changed', label: 'Files' },
        { key: 'lines_added', label: '+Lines', type: 'positive' },
        { key: 'lines_deleted', label: '-Lines', type: 'negative' }
      ]
    } else if (detailData.type === 'branches') {
      return [
        { key: 'name', label: 'Branch Name' },
        { key: 'is_default', label: 'Default', type: 'boolean' },
        { key: 'last_commit_hash', label: 'Last Commit', type: 'hash' },
        { key: 'last_commit_date', label: 'Last Activity', type: 'datetime' },
        { key: 'ahead_count', label: 'Ahead' },
        { key: 'behind_count', label: 'Behind' }
      ]
    }
    return []
  }

  // Column definitions for org table
  const orgColumns = [
    { key: 'Staff Name', label: 'Staff Name' },
    { key: 'Staff Id', label: 'Staff ID' },
    { key: 'Reporting Manager Name', label: 'Manager' },
    { key: 'Job Function', label: 'Job Function' },
    { key: 'Rank', label: 'Rank', type: 'select', options: ['VP', 'Director', 'Manager', 'Senior', 'Junior'] },
    { key: 'Squad 1 (where applicable)', label: 'Squad' },
    { key: 'Sub-platform', label: 'Sub-platform' },
    { key: 'Work Location', label: 'Location' }
  ]

  // Column definitions for work table
  const workColumns = [
    { key: 'Squad name', label: 'Squad Name' },
    { key: 'Book of work', label: 'Work Item' },
    { key: 'start date', label: 'Start Date', type: 'date' },
    { key: 'end date', label: 'End Date', type: 'date' },
    { key: 'description if any', label: 'Description' }
  ]

  return (
    <div className="data-management">
      <div className="data-management-header">
        <div className="data-management-context">
          <Database size={20} />
          <div>
            <strong>Import and export</strong>
            <span>Manage source files and existing records</span>
          </div>
        </div>
        
        <div className="view-data-dropdown">
          <label htmlFor="viewDataSelect">View Data:</label>
          <select 
            id="viewDataSelect"
            className="view-data-select"
            onChange={(e) => e.target.value && handleViewData(e.target.value)}
            value=""
          >
            <option value="">Select Data Type</option>
            <option value="organization">Organization data records</option>
            <option value="repositories">Git repository data</option>
            <option value="workplan">Work plan data records</option>
          </select>
        </div>
      </div>

      <div className="data-management-grid">
        {/* Organization Data Section */}
        <div className="data-section">
          <div className="section-header">
            <h3>
              <Users size={24} />
              Organization Structure Data
            </h3>
            <button
              className="view-toggle-btn"
              onClick={() => setShowOrgTable(!showOrgTable)}
            >
              {showOrgTable ? <EyeOff size={18} /> : <Eye size={18} />}
              {showOrgTable ? 'Hide' : 'View'} Data
            </button>
          </div>

          <div className="data-actions">
            <input
              ref={orgFileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleOrgFileUpload}
              style={{ display: 'none' }}
              disabled={loading.orgUpload}
            />

            <button
              className="data-action-btn primary"
              onClick={() => orgFileRef.current.click()}
              disabled={loading.orgUpload}
            >
              <Upload size={18} />
              {loading.orgUpload ? 'Uploading...' : 'Upload File'}
            </button>

            <button
              className="data-action-btn secondary"
              onClick={handleDownloadOrg}
              disabled={loading.orgDownload}
            >
              <Download size={18} />
              {loading.orgDownload ? 'Downloading...' : 'Download Data'}
            </button>

            <button
              className="data-action-btn accent"
              onClick={handleLoadSampleOrg}
              disabled={loading.orgSample}
            >
              <Database size={18} />
              {loading.orgSample ? 'Loading...' : 'Load Sample'}
            </button>

          </div>

          {messages.orgUpload && (
            <div className={`message ${messages.orgUpload.type}`}>
              {messages.orgUpload.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.orgUpload.message}
            </div>
          )}
          {messages.orgDownload && (
            <div className={`message ${messages.orgDownload.type}`}>
              {messages.orgDownload.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.orgDownload.message}
            </div>
          )}
          {messages.orgSample && (
            <div className={`message ${messages.orgSample.type}`}>
              {messages.orgSample.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.orgSample.message}
            </div>
          )}
          {messages.ldap && (
            <div className={`message ${messages.ldap.type}`}>
              {messages.ldap.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.ldap.message}
            </div>
          )}
          {messages.orgUpdate && (
            <div className={`message ${messages.orgUpdate.type}`}>
              {messages.orgUpdate.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.orgUpdate.message}
            </div>
          )}
          {messages.orgDelete && (
            <div className={`message ${messages.orgDelete.type}`}>
              {messages.orgDelete.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.orgDelete.message}
            </div>
          )}
          {messages.gitPull && (
            <div className={`message ${messages.gitPull.type}`}>
              {messages.gitPull.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.gitPull.message}
            </div>
          )}
          {messages.repoDetail && (
            <div className={`message ${messages.repoDetail.type}`}>
              {messages.repoDetail.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.repoDetail.message}
            </div>
          )}
        </div>

        {/* Work Plan Data Section */}
        <div className="data-section">
          <div className="section-header">
            <h3>
              <Calendar size={24} />
              Work Plan Data
            </h3>
            <button
              className="view-toggle-btn"
              onClick={() => setShowWorkTable(!showWorkTable)}
            >
              {showWorkTable ? <EyeOff size={18} /> : <Eye size={18} />}
              {showWorkTable ? 'Hide' : 'View'} Data
            </button>
          </div>

          <div className="data-actions">
            <input
              ref={workFileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleWorkFileUpload}
              style={{ display: 'none' }}
              disabled={loading.workUpload}
            />

            <button
              className="data-action-btn primary"
              onClick={() => workFileRef.current.click()}
              disabled={loading.workUpload}
            >
              <Upload size={18} />
              {loading.workUpload ? 'Uploading...' : 'Upload File'}
            </button>

            <button
              className="data-action-btn secondary"
              onClick={handleDownloadWork}
              disabled={loading.workDownload}
            >
              <Download size={18} />
              {loading.workDownload ? 'Downloading...' : 'Download Data'}
            </button>

            <button
              className="data-action-btn accent"
              onClick={handleLoadSampleWork}
              disabled={loading.workSample}
            >
              <Database size={18} />
              {loading.workSample ? 'Loading...' : 'Load Sample'}
            </button>
          </div>

          {messages.workUpload && (
            <div className={`message ${messages.workUpload.type}`}>
              {messages.workUpload.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.workUpload.message}
            </div>
          )}
          {messages.workDownload && (
            <div className={`message ${messages.workDownload.type}`}>
              {messages.workDownload.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.workDownload.message}
            </div>
          )}
          {messages.workSample && (
            <div className={`message ${messages.workSample.type}`}>
              {messages.workSample.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.workSample.message}
            </div>
          )}
          {messages.workUpdate && (
            <div className={`message ${messages.workUpdate.type}`}>
              {messages.workUpdate.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.workUpdate.message}
            </div>
          )}
          {messages.workDelete && (
            <div className={`message ${messages.workDelete.type}`}>
              {messages.workDelete.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.workDelete.message}
            </div>
          )}
        </div>

        {/* Clear All Data Section */}
        <div className="data-section danger-section">
          <div className="section-header">
            <h3>
              <Trash2 size={24} />
              Danger Zone
            </h3>
          </div>

          <div className="data-actions">
            <button
              className="data-action-btn danger"
              onClick={handleClearAll}
              disabled={loading.clearAll}
            >
              <Trash2 size={18} />
              {loading.clearAll ? 'Clearing...' : 'Clear All Data'}
            </button>
          </div>

          <p className="danger-warning">
            <AlertTriangle size={16} />
            This permanently deletes all organization and work plan data. This action cannot be undone.
          </p>

          {messages.clearAll && (
            <div className={`message ${messages.clearAll.type}`}>
              {messages.clearAll.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {messages.clearAll.message}
            </div>
          )}
        </div>
      </div>

      {/* Organization Data Table */}
      {showOrgTable && orgData.length > 0 && (
        <div className="data-table-section">
          <h3><Users size={18} /> Organization Data Records</h3>
          <DataTable
            data={orgData}
            columns={orgColumns}
            onUpdate={handleUpdateOrgRecord}
            onDelete={handleDeleteOrgRecord}
            type="Employee"
          />
        </div>
      )}

      {/* Work Plan Data Table */}
      {showWorkTable && workData.length > 0 && (
        <div className="data-table-section">
          <h3><Calendar size={18} /> Work Plan Records</h3>
          <DataTable
            data={workData}
            columns={workColumns}
            onUpdate={handleUpdateWorkRecord}
            onDelete={handleDeleteWorkRecord}
            type="Work Item"
          />
        </div>
      )}

      <div className="data-info-panel">
        <h3><Info size={18} /> How to Use</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4><Upload size={17} /> Upload Data</h4>
            <p>Upload Excel or CSV files with your organization structure or work plan data. The system will replace existing data with the new upload.</p>
          </div>
          <div className="info-card">
            <h4><Eye size={17} /> View and Edit</h4>
            <p>Click "View Data" to see all records. You can edit individual records inline by clicking the edit button, or delete records as needed.</p>
          </div>
          <div className="info-card">
            <h4><Download size={17} /> Download and Edit</h4>
            <p>Download current data as Excel files, make bulk changes, and re-upload to update the system.</p>
          </div>
          <div className="info-card">
            <h4><RefreshCw size={17} /> LDAP Sync</h4>
            <p>Connect to your LDAP server to automatically sync employee data. Updates existing records or creates new ones.</p>
          </div>
        </div>
      </div>

      <div className="data-format-info">
        <h3><Database size={18} /> Data Format Requirements</h3>
        <div className="format-grid">
          <div className="format-card">
            <h4>Organization Data Format</h4>
            <p><strong>Required columns:</strong></p>
            <ul>
              <li><code>Staff Name</code> - Employee full name</li>
              <li><code>Reporting Manager Name</code> - Manager's name</li>
            </ul>
            <p><strong>Optional columns:</strong></p>
            <ul>
              <li><code>Staff Id</code>, <code>Job Function</code>, <code>Rank</code></li>
              <li><code>Squad 1 (where applicable)</code>, <code>Sub-platform</code></li>
              <li><code>Work Location</code>, <code>Tech Skills</code>, <code>Domain Knowledge</code></li>
            </ul>
          </div>
          <div className="format-card">
            <h4>Work Plan Data Format</h4>
            <p><strong>Required columns:</strong></p>
            <ul>
              <li><code>Squad name</code> - Team identifier</li>
              <li><code>Book of work</code> - Task name</li>
              <li><code>start date</code> - Task start date (YYYY-MM-DD)</li>
              <li><code>end date</code> - Task end date (YYYY-MM-DD)</li>
            </ul>
            <p><strong>Optional columns:</strong></p>
            <ul>
              <li><code>description if any</code> - Task details</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Repository Data Pull Modal */}
      {showRepoModal && (
        <div className="modal-overlay" onClick={() => setShowRepoModal(false)}>
          <div className="modal-content git-repo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <GitBranch size={20} />
                Pull Data from Git Repository
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowRepoModal(false)}
                aria-label="Close repository dialog"
              >
                <X size={18} />
              </button>
            </div>

            {repoStep === 'config' && (
              <div className="modal-body">
                <div className="repo-config-form">
                  <div className="form-section">
                    <h4>Repository Configuration</h4>
                    
                    <div className="form-group">
                      <label>Repository Type</label>
                      <select 
                        value={repoConfig.type}
                        onChange={(e) => setRepoConfig(prev => ({ ...prev, type: e.target.value }))}
                        className="form-input"
                      >
                        <option value="github">GitHub</option>
                        <option value="bitbucket">Bitbucket Server</option>
                        <option value="gitlab">GitLab</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Repository URL</label>
                      <input
                        type="url"
                        value={repoConfig.url}
                        onChange={(e) => setRepoConfig(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://api.github.com or https://your-bitbucket.com"
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        value={repoConfig.username}
                        onChange={(e) => setRepoConfig(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Your username"
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Access Token / Password</label>
                      <input
                        type="password"
                        value={repoConfig.token}
                        onChange={(e) => setRepoConfig(prev => ({ ...prev, token: e.target.value }))}
                        placeholder="Personal Access Token or Password"
                        className="form-input"
                        required
                      />
                      <small className="form-hint">
                        {repoConfig.type === 'github' && 'GitHub Personal Access Token with repo and user scopes'}
                        {repoConfig.type === 'bitbucket' && 'App password or personal password for Bitbucket'}
                        {repoConfig.type === 'gitlab' && 'GitLab Personal Access Token with API scope'}
                      </small>
                    </div>

                    {repoConfig.type === 'bitbucket' && (
                      <div className="form-group">
                        <label>Project Key (Optional)</label>
                        <input
                          type="text"
                          value={repoConfig.projectKey}
                          onChange={(e) => setRepoConfig(prev => ({ ...prev, projectKey: e.target.value }))}
                          placeholder="PROJECT_KEY"
                          className="form-input"
                        />
                        <small className="form-hint">Leave empty to fetch all accessible repositories</small>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Data Timeline (Days)</label>
                      <select
                        value={repoConfig.timeline}
                        onChange={(e) => setRepoConfig(prev => ({ ...prev, timeline: e.target.value }))}
                        className="form-input"
                      >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="180">Last 6 months</option>
                        <option value="365">Last year</option>
                        <option value="all">All time</option>
                      </select>
                    </div>
                  </div>

                  <div className="auth-info">
                    <h4>Authentication Requirements</h4>
                    <div className="auth-details">
                      <p><strong>GitHub:</strong> Personal Access Token with <code>repo</code>, <code>read:user</code>, <code>read:org</code> scopes</p>
                      <p><strong>Bitbucket:</strong> App password or personal password with repository read access</p>
                      <p><strong>GitLab:</strong> Personal Access Token with <code>api</code> scope for full access</p>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowRepoModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleRepoConfigSubmit}
                    disabled={loading.gitPull || !repoConfig.url || !repoConfig.username || !repoConfig.token}
                  >
                    {loading.gitPull ? 'Connecting...' : 'Connect & Fetch Repositories'}
                  </button>
                </div>
              </div>
            )}

            {repoStep === 'repos' && (
              <div className="modal-body">
                <div className="repo-selection">
                  <h4>Select Repositories ({repositories.length} found)</h4>
                  <p className="selection-info">
                    Selected: {selectedRepos.length} repositories
                  </p>

                  <div className="repo-list">
                    {repositories.map((repo, index) => (
                      <div 
                        key={repo.slug || index}
                        className={`repo-item ${selectedRepos.includes(repo.slug) ? 'selected' : ''}`}
                        onClick={() => handleRepoSelection(repo.slug)}
                      >
                        <div className="repo-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedRepos.includes(repo.slug)}
                            onChange={() => handleRepoSelection(repo.slug)}
                          />
                        </div>
                        <div className="repo-info">
                          <div className="repo-header">
                            <h5>{repo.name || repo.slug}</h5>
                            <span className={`project-type ${repo.projectType || 'unknown'}`}>
                              {repo.projectType || 'Unknown'}
                            </span>
                          </div>
                          <p className="repo-description">{repo.description || 'No description'}</p>
                          <div className="repo-meta">
                            <span>{repo.slug}</span>
                            {repo.language && <span>{repo.language}</span>}
                            {repo.lastUpdate && <span>{new Date(repo.lastUpdate).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setRepoStep('config')}
                  >
                    Back to Config
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleDataExtraction}
                    disabled={selectedRepos.length === 0}
                  >
                    Extract Data from {selectedRepos.length} Repository{selectedRepos.length !== 1 ? 'ies' : ''}
                  </button>
                </div>
              </div>
            )}

            {repoStep === 'processing' && (
              <div className="modal-body">
                <div className="processing-status">
                  <div className="loading-spinner-large">
                    <RefreshCw size={48} className="spin" />
                  </div>
                  <h4>Extracting Repository Data</h4>
                  <p>Processing {selectedRepos.length} repositories...</p>
                  <div className="extraction-details">
                    <p>Collecting pull requests, commits, branches, and project metadata</p>
                    <p>Analyzing project types and frameworks</p>
                    <p>Storing data with duplicate detection</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Data Modal */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{getViewDataTitle()}</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowViewModal(false)}
                aria-label="Close data dialog"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              {getViewData().length > 0 ? (
                <div className="data-table-container">
                  <div className="data-stats">
                    <p><strong>Total Records:</strong> {getViewData().length}</p>
                    {viewDataType === 'repositories' && (
                      <div className="repo-stats">
                        <p><strong>Project Types:</strong> {new Set(repoData.map(r => r.project_type)).size}</p>
                        <p><strong>Languages:</strong> {new Set(repoData.filter(r => r.language).map(r => r.language)).size}</p>
                      </div>
                    )}
                  </div>
                  
                  <DataTable
                    columns={getViewDataColumns()}
                    data={getViewData()}
                    onUpdate={viewDataType === 'organization' ? handleUpdateOrgRecord : viewDataType === 'workplan' ? handleUpdateWorkRecord : null}
                    onDelete={viewDataType === 'organization' ? handleDeleteOrgRecord : viewDataType === 'workplan' ? handleDeleteWorkRecord : null}
                    maxHeight="60vh"
                  />
                </div>
              ) : (
                <div className="no-data">
                  <Database size={48} />
                  <h4>No Data Available</h4>
                  <p>
                    {viewDataType === 'organization' && 'No organization data found. Upload a file or load sample data.'}
                    {viewDataType === 'workplan' && 'No work plan data found. Upload a file or load sample data.'}
                    {viewDataType === 'repositories' && 'No repository data found. Use Git Pull to extract repository data.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Repository Detail Modal */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{getDetailTitle()}</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowDetailModal(false)}
                aria-label="Close details dialog"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              {loadingDetail ? (
                <div className="detail-loading">
                  <RefreshCw size={32} className="spin" />
                  <p>Loading {detailData.type}...</p>
                </div>
              ) : detailData.items.length > 0 ? (
                <div className="detail-container">
                  <div className="detail-stats">
                    <div className="detail-info">
                      <strong>Repository:</strong> {detailData.repository?.name}
                      <span className="repo-type">{detailData.repository?.repo_type}</span>
                    </div>
                    <div className="detail-count">
                      <strong>Total {detailData.type === 'pull_requests' ? 'Pull Requests' : detailData.type}:</strong> {detailData.items.length}
                    </div>
                  </div>
                  
                  <div className="detail-table">
                    <DataTable
                      columns={getDetailColumns()}
                      data={detailData.items}
                      maxHeight="60vh"
                      showActions={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  <Database size={48} />
                  <h4>No {detailData.type === 'pull_requests' ? 'Pull Requests' : detailData.type} Found</h4>
                  <p>This repository doesn't have any {detailData.type} data.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataManagement
