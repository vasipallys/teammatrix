import axios from 'axios'
import config from './config.js'

const API_BASE = config.api.baseURL

// Configure axios defaults
axios.defaults.timeout = config.api.timeout

// Organization Data Operations
export const uploadOrgFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return axios.post(`${API_BASE}/upload/org`, formData)
}

export const getOrgData = () => {
  return axios.get(`${API_BASE}/org/data`)
}

export const downloadOrgData = () => {
  return axios.get(`${API_BASE}/org/download`, { responseType: 'blob' })
}

export const filterOrgData = (filters) => {
  return axios.post(`${API_BASE}/org/filter`, { filters })
}

export const loadSampleOrg = () => {
  return axios.get(`${API_BASE}/sample/org`)
}

export const updateOrgRecord = (id, data) => {
  return axios.put(`${API_BASE}/org/update/${id}`, data)
}

export const deleteOrgRecord = (id) => {
  return axios.delete(`${API_BASE}/org/delete/${id}`)
}

// Work Plan Data Operations
export const uploadWorkFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return axios.post(`${API_BASE}/upload/work`, formData)
}

export const getWorkData = () => {
  return axios.get(`${API_BASE}/work/data`)
}

export const downloadWorkData = () => {
  return axios.get(`${API_BASE}/work/download`, { responseType: 'blob' })
}

export const loadSampleWork = () => {
  return axios.get(`${API_BASE}/sample/work`)
}

export const updateWorkRecord = (id, data) => {
  return axios.put(`${API_BASE}/work/update/${id}`, data)
}

export const deleteWorkRecord = (id) => {
  return axios.delete(`${API_BASE}/work/delete/${id}`)
}

// LDAP Operations
export const connectLDAP = (config) => {
  return axios.post(`${API_BASE}/ldap/connect`, config)
}

// Export Operations
export const exportCSV = (data) => {
  return axios.post(`${API_BASE}/export/csv`, { data }, { responseType: 'blob' })
}

// Clear All Data Operations
export const clearAllData = () => {
  return axios.delete(`${API_BASE}/data/clear-all`)
}

// =====================================
// ENHANCED DATA MANAGEMENT CENTER APIs
// =====================================

// LDAP Integration APIs
export const testLDAPConnection = (config) => {
  return axios.post(`${API_BASE}/ldap/test`, config)
}

export const syncLDAPData = (config) => {
  return axios.post(`${API_BASE}/ldap/sync`, config)
}

export const getLDAPEmployees = () => {
  return axios.get(`${API_BASE}/ldap/employees`)
}

export const getLDAPSyncStatus = () => {
  return axios.get(`${API_BASE}/ldap/status`)
}

// Git Repository Integration APIs
export const connectGitRepository = (config) => {
  return axios.post(`${API_BASE}/git/connect`, config)
}

export const getRepositories = () => {
  return axios.get(`${API_BASE}/git/repositories`)
}

export const syncRepositoryData = (repoId) => {
  return axios.post(`${API_BASE}/git/sync/${repoId}`)
}

export const getCommitHistory = (repoId, options = {}) => {
  return axios.get(`${API_BASE}/git/commits/${repoId}`, { params: options })
}

export const getPullRequests = (repoId, options = {}) => {
  return axios.get(`${API_BASE}/git/pullrequests/${repoId}`, { params: options })
}

export const getRepositoryAnalytics = (repoId) => {
  return axios.get(`${API_BASE}/git/analytics/${repoId}`)
}

// Jira Integration APIs
export const connectJira = (config) => {
  return axios.post(`${API_BASE}/jira/connect`, config)
}

export const testJiraConnection = (config) => {
  return axios.post(`${API_BASE}/jira/test`, config)
}

export const getJiraProjects = () => {
  return axios.get(`${API_BASE}/jira/projects`)
}

export const syncJiraData = (projectKey) => {
  return axios.post(`${API_BASE}/jira/sync/${projectKey}`)
}

export const getEpics = (projectKey = null) => {
  const url = projectKey ? `${API_BASE}/jira/epics/${projectKey}` : `${API_BASE}/jira/epics`
  return axios.get(url)
}

export const getStories = (epicId = null) => {
  const url = epicId ? `${API_BASE}/jira/stories/${epicId}` : `${API_BASE}/jira/stories`
  return axios.get(url)
}

export const getSprints = (projectKey = null) => {
  const url = projectKey ? `${API_BASE}/jira/sprints/${projectKey}` : `${API_BASE}/jira/sprints`
  return axios.get(url)
}

// Jira Configuration Management APIs
export const getJiraConfigs = () => {
  return axios.get(`${API_BASE}/jira/configs`)
}

export const createJiraConfig = (config) => {
  return axios.post(`${API_BASE}/jira/configs`, config)
}

export const updateJiraConfig = (configId, config) => {
  return axios.put(`${API_BASE}/jira/configs/${configId}`, config)
}

export const deleteJiraConfig = (configId) => {
  return axios.delete(`${API_BASE}/jira/configs/${configId}`)
}

export const testJiraConfig = (configId) => {
  return axios.post(`${API_BASE}/jira/configs/${configId}/test`)
}

export const activateJiraConfig = (configId) => {
  return axios.post(`${API_BASE}/jira/configs/${configId}/activate`)
}

// Data Pipeline & ETL APIs
export const getPipelineStatus = () => {
  return axios.get(`${API_BASE}/pipeline/status`)
}

export const triggerETLJob = (jobType) => {
  return axios.post(`${API_BASE}/pipeline/trigger/${jobType}`)
}

export const getETLJobHistory = () => {
  return axios.get(`${API_BASE}/pipeline/jobs`)
}

export const getDataQualityReport = () => {
  return axios.get(`${API_BASE}/data/quality`)
}

// Advanced Analytics APIs
export const getDeveloperProfile = (employeeId) => {
  return axios.get(`${API_BASE}/analytics/developer/${employeeId}`)
}

export const getSquadAnalysis = (squadName) => {
  return axios.get(`${API_BASE}/analytics/squad/${squadName}`)
}

export const getPlanVsActualAnalysis = () => {
  return axios.get(`${API_BASE}/analytics/plan-vs-actual`)
}

export const getProductivityMetrics = (timeRange = '30d') => {
  return axios.get(`${API_BASE}/analytics/productivity`, { params: { range: timeRange } })
}

export const getStrategicAlignment = () => {
  return axios.get(`${API_BASE}/analytics/strategic-alignment`)
}

export const getPortfolioHealth = () => {
  return axios.get(`${API_BASE}/analytics/portfolio-health`)
}

// Data Correlation APIs
export const getDataRelationships = () => {
  return axios.get(`${API_BASE}/data/relationships`)
}

export const validateDataIntegrity = () => {
  return axios.post(`${API_BASE}/data/validate`)
}

export const getUnifiedDataModel = () => {
  return axios.get(`${API_BASE}/data/unified-model`)
}

// Configuration & Settings APIs
export const getIntegrationSettings = () => {
  return axios.get(`${API_BASE}/settings/integrations`)
}

export const updateIntegrationSettings = (settings) => {
  return axios.put(`${API_BASE}/settings/integrations`, settings)
}

export const getDataSourceStatus = () => {
  return axios.get(`${API_BASE}/status/datasources`)
}

// Advanced Export APIs
export const exportDeveloperProfiles = (format = 'json') => {
  return axios.get(`${API_BASE}/export/developer-profiles`, { 
    params: { format },
    responseType: format === 'pdf' ? 'blob' : 'json'
  })
}

export const exportSquadAnalytics = (format = 'json') => {
  return axios.get(`${API_BASE}/export/squad-analytics`, { 
    params: { format },
    responseType: format === 'pdf' ? 'blob' : 'json'
  })
}

export const exportPlanVsActual = (format = 'excel') => {
  return axios.get(`${API_BASE}/export/plan-vs-actual`, { 
    params: { format },
    responseType: 'blob'
  })
}

// Real-time Data APIs
export const subscribeToDataUpdates = (callback) => {
  // WebSocket connection for real-time updates
  const ws = new WebSocket(`${config.websocket.getURL()}/data-updates`)
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    callback(data)
  }
  
  return ws
}

export const getRealtimeMetrics = () => {
  return axios.get(`${API_BASE}/realtime/metrics`)
}