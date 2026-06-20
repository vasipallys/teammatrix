/**
 * Integration Service - Coordinates all system components
 * Handles cross-component communication and state management
 */

class IntegrationService {
  constructor() {
    this.subscribers = new Map()
    this.state = {
      activeUsers: [],
      systemHealth: 'healthy',
      performanceMetrics: {},
      automationTasks: [],
      exportQueue: [],
      collaborationSessions: []
    }
  }

  // Event subscription system
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, [])
    }
    this.subscribers.get(event).push(callback)
    
    return () => {
      const callbacks = this.subscribers.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    const callbacks = this.subscribers.get(event) || []
    callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in event callback for ${event}:`, error)
      }
    })
  }

  // User management
  addUser(user) {
    this.state.activeUsers.push(user)
    this.emit('user:joined', user)
    this.emit('users:updated', this.state.activeUsers)
  }

  removeUser(userId) {
    this.state.activeUsers = this.state.activeUsers.filter(u => u.id !== userId)
    this.emit('user:left', userId)
    this.emit('users:updated', this.state.activeUsers)
  }

  updateUserStatus(userId, status) {
    const user = this.state.activeUsers.find(u => u.id === userId)
    if (user) {
      user.status = status
      this.emit('user:status_changed', { userId, status })
      this.emit('users:updated', this.state.activeUsers)
    }
  }

  // Performance monitoring
  updatePerformanceMetrics(metrics) {
    this.state.performanceMetrics = { ...this.state.performanceMetrics, ...metrics }
    this.emit('performance:updated', this.state.performanceMetrics)
    
    // Check for performance issues
    if (metrics.fps && metrics.fps < 30) {
      this.emit('performance:warning', { type: 'low_fps', value: metrics.fps })
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage > 80) {
      this.emit('performance:warning', { type: 'high_memory', value: metrics.memoryUsage })
    }
  }

  // Automation system
  addAutomationTask(task) {
    const taskWithId = { ...task, id: Date.now(), status: 'pending', createdAt: new Date() }
    this.state.automationTasks.push(taskWithId)
    this.emit('automation:task_added', taskWithId)
    return taskWithId.id
  }

  updateTaskStatus(taskId, status, result = null) {
    const task = this.state.automationTasks.find(t => t.id === taskId)
    if (task) {
      task.status = status
      task.updatedAt = new Date()
      if (result) task.result = result
      this.emit('automation:task_updated', task)
    }
  }

  // Export system
  addExportJob(exportConfig) {
    const job = {
      id: Date.now(),
      ...exportConfig,
      status: 'queued',
      progress: 0,
      createdAt: new Date()
    }
    this.state.exportQueue.push(job)
    this.emit('export:job_added', job)
    return job.id
  }

  updateExportProgress(jobId, progress, status = 'processing') {
    const job = this.state.exportQueue.find(j => j.id === jobId)
    if (job) {
      job.progress = progress
      job.status = status
      job.updatedAt = new Date()
      this.emit('export:progress_updated', job)
    }
  }

  completeExportJob(jobId, downloadUrl) {
    const job = this.state.exportQueue.find(j => j.id === jobId)
    if (job) {
      job.status = 'completed'
      job.downloadUrl = downloadUrl
      job.completedAt = new Date()
      this.emit('export:job_completed', job)
    }
  }

  // Collaboration system
  startCollaborationSession(sessionConfig) {
    const session = {
      id: Date.now(),
      ...sessionConfig,
      participants: [],
      startedAt: new Date(),
      status: 'active'
    }
    this.state.collaborationSessions.push(session)
    this.emit('collaboration:session_started', session)
    return session.id
  }

  joinCollaborationSession(sessionId, user) {
    const session = this.state.collaborationSessions.find(s => s.id === sessionId)
    if (session) {
      session.participants.push(user)
      this.emit('collaboration:user_joined', { sessionId, user })
    }
  }

  // Analytics integration
  trackUserAction(action, data = {}) {
    const event = {
      action,
      data,
      timestamp: new Date(),
      userId: this.getCurrentUserId()
    }
    this.emit('analytics:action_tracked', event)
  }

  // System health monitoring
  updateSystemHealth(status, details = {}) {
    this.state.systemHealth = status
    this.emit('system:health_updated', { status, details, timestamp: new Date() })
  }

  // Data synchronization
  syncData(dataType, data) {
    this.emit('data:sync_started', { dataType })
    
    // Simulate sync process
    setTimeout(() => {
      this.emit('data:sync_completed', { dataType, data, timestamp: new Date() })
    }, 1000)
  }

  // Command palette integration
  registerCommand(command) {
    this.emit('commands:registered', command)
  }

  executeCommand(commandId, args = {}) {
    this.emit('commands:execute', { commandId, args })
  }

  // Notification system integration
  showNotification(type, message, options = {}) {
    this.emit('notifications:show', { type, message, options, timestamp: new Date() })
  }

  // Keyboard shortcuts
  registerShortcut(shortcut, handler) {
    this.emit('shortcuts:registered', { shortcut, handler })
  }

  // Theme system integration
  updateTheme(theme) {
    this.emit('theme:changed', theme)
  }

  // Search integration
  performSearch(query, filters = {}) {
    this.emit('search:started', { query, filters })
    
    // This would integrate with your search service
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = this.mockSearchResults(query)
        this.emit('search:completed', { query, results })
        resolve(results)
      }, 500)
    })
  }

  mockSearchResults(query) {
    // Mock search results for demonstration
    return [
      { type: 'user', title: `User: ${query}`, description: 'Organization member' },
      { type: 'document', title: `Document: ${query}`, description: 'Related document' },
      { type: 'action', title: `Action: ${query}`, description: 'Available action' }
    ]
  }

  // Utility methods
  getCurrentUserId() {
    return 'current-user-id' // This would come from your auth system
  }

  getState() {
    return { ...this.state }
  }

  reset() {
    this.state = {
      activeUsers: [],
      systemHealth: 'healthy',
      performanceMetrics: {},
      automationTasks: [],
      exportQueue: [],
      collaborationSessions: []
    }
    this.emit('system:reset')
  }

  // Advanced features
  
  // Plugin system
  registerPlugin(pluginName, plugin) {
    if (!this.plugins) this.plugins = new Map()
    this.plugins.set(pluginName, plugin)
    this.emit('plugin:registered', { pluginName, plugin })
  }

  executePlugin(pluginName, method, args = {}) {
    if (!this.plugins || !this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} not found`)
    }
    
    const plugin = this.plugins.get(pluginName)
    if (typeof plugin[method] !== 'function') {
      throw new Error(`Method ${method} not found in plugin ${pluginName}`)
    }
    
    return plugin[method](args)
  }

  // Workflow automation
  createWorkflow(workflowConfig) {
    const workflow = {
      id: Date.now(),
      ...workflowConfig,
      status: 'active',
      createdAt: new Date(),
      executionCount: 0
    }
    
    if (!this.workflows) this.workflows = new Map()
    this.workflows.set(workflow.id, workflow)
    this.emit('workflow:created', workflow)
    return workflow.id
  }

  executeWorkflow(workflowId, context = {}) {
    if (!this.workflows || !this.workflows.has(workflowId)) {
      throw new Error(`Workflow ${workflowId} not found`)
    }
    
    const workflow = this.workflows.get(workflowId)
    workflow.executionCount++
    workflow.lastExecuted = new Date()
    
    this.emit('workflow:started', { workflowId, context })
    
    // Execute workflow steps
    return this.processWorkflowSteps(workflow, context)
  }

  async processWorkflowSteps(workflow, context) {
    const results = []
    
    for (const step of workflow.steps) {
      try {
        const result = await this.executeWorkflowStep(step, context)
        results.push({ step: step.id, result, status: 'success' })
        
        // Update context with step result
        context[step.outputKey || step.id] = result
        
      } catch (error) {
        results.push({ step: step.id, error: error.message, status: 'error' })
        
        if (step.required) {
          this.emit('workflow:failed', { workflowId: workflow.id, error, results })
          throw error
        }
      }
    }
    
    this.emit('workflow:completed', { workflowId: workflow.id, results })
    return results
  }

  async executeWorkflowStep(step, context) {
    switch (step.type) {
      case 'api_call':
        return await this.executeApiCall(step.config, context)
      case 'data_transform':
        return this.executeDataTransform(step.config, context)
      case 'notification':
        return this.executeNotification(step.config, context)
      case 'condition':
        return this.executeCondition(step.config, context)
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }

  async executeApiCall(config, context) {
    const url = this.interpolateString(config.url, context)
    const options = {
      method: config.method || 'GET',
      headers: config.headers || {},
      ...(config.body && { body: JSON.stringify(this.interpolateObject(config.body, context)) })
    }
    
    const response = await fetch(url, options)
    return await response.json()
  }

  executeDataTransform(config, context) {
    const data = this.getValueFromContext(config.input, context)
    
    switch (config.operation) {
      case 'filter':
        return data.filter(item => this.evaluateCondition(config.condition, item))
      case 'map':
        return data.map(item => this.transformItem(config.mapping, item))
      case 'reduce':
        return data.reduce((acc, item) => this.executeReducer(config.reducer, acc, item), config.initialValue)
      default:
        return data
    }
  }

  executeNotification(config, context) {
    const message = this.interpolateString(config.message, context)
    this.showNotification(config.type || 'info', message, config.options || {})
    return { sent: true, message }
  }

  executeCondition(config, context) {
    return this.evaluateCondition(config.condition, context)
  }

  // Utility methods for workflow execution
  interpolateString(template, context) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.getValueFromContext(key, context) || match
    })
  }

  interpolateObject(obj, context) {
    const result = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateString(value, context)
      } else if (typeof value === 'object') {
        result[key] = this.interpolateObject(value, context)
      } else {
        result[key] = value
      }
    }
    return result
  }

  getValueFromContext(path, context) {
    return path.split('.').reduce((obj, key) => obj?.[key], context)
  }

  evaluateCondition(condition, context) {
    const { field, operator, value } = condition
    const fieldValue = this.getValueFromContext(field, context)
    
    switch (operator) {
      case 'equals': return fieldValue === value
      case 'not_equals': return fieldValue !== value
      case 'greater_than': return fieldValue > value
      case 'less_than': return fieldValue < value
      case 'contains': return fieldValue?.includes?.(value)
      case 'exists': return fieldValue !== undefined && fieldValue !== null
      default: return false
    }
  }

  // Advanced analytics integration
  trackAdvancedMetrics(metrics) {
    if (!this.advancedMetrics) this.advancedMetrics = []
    
    const metricEntry = {
      ...metrics,
      timestamp: new Date(),
      sessionId: this.getSessionId()
    }
    
    this.advancedMetrics.push(metricEntry)
    
    // Keep only last 1000 metrics
    if (this.advancedMetrics.length > 1000) {
      this.advancedMetrics = this.advancedMetrics.slice(-1000)
    }
    
    this.emit('metrics:tracked', metricEntry)
    
    // Analyze metrics for patterns
    this.analyzeMetricPatterns()
  }

  analyzeMetricPatterns() {
    if (!this.advancedMetrics || this.advancedMetrics.length < 10) return
    
    const recentMetrics = this.advancedMetrics.slice(-10)
    
    // Detect performance degradation
    const performanceMetrics = recentMetrics.filter(m => m.type === 'performance')
    if (performanceMetrics.length >= 5) {
      const avgPerformance = performanceMetrics.reduce((sum, m) => sum + m.value, 0) / performanceMetrics.length
      if (avgPerformance < 60) { // Performance score below 60
        this.emit('pattern:performance_degradation', { avgPerformance, metrics: performanceMetrics })
      }
    }
    
    // Detect usage spikes
    const usageMetrics = recentMetrics.filter(m => m.type === 'usage')
    if (usageMetrics.length >= 3) {
      const isSpike = usageMetrics.every((m, i) => i === 0 || m.value > usageMetrics[i-1].value * 1.5)
      if (isSpike) {
        this.emit('pattern:usage_spike', { metrics: usageMetrics })
      }
    }
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    return this.sessionId
  }

  // Machine learning integration
  trainModel(modelConfig) {
    // Placeholder for ML model training
    const model = {
      id: Date.now(),
      type: modelConfig.type,
      status: 'training',
      accuracy: 0,
      createdAt: new Date()
    }
    
    if (!this.mlModels) this.mlModels = new Map()
    this.mlModels.set(model.id, model)
    
    // Simulate training
    setTimeout(() => {
      model.status = 'trained'
      model.accuracy = Math.random() * 0.3 + 0.7 // 70-100% accuracy
      this.emit('ml:model_trained', model)
    }, 2000)
    
    return model.id
  }

  predictWithModel(modelId, inputData) {
    if (!this.mlModels || !this.mlModels.has(modelId)) {
      throw new Error(`Model ${modelId} not found`)
    }
    
    const model = this.mlModels.get(modelId)
    if (model.status !== 'trained') {
      throw new Error(`Model ${modelId} is not trained`)
    }
    
    // Simulate prediction
    const prediction = {
      confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
      result: this.generateMockPrediction(model.type, inputData),
      modelId,
      timestamp: new Date()
    }
    
    this.emit('ml:prediction_made', prediction)
    return prediction
  }

  generateMockPrediction(modelType, inputData) {
    switch (modelType) {
      case 'turnover_prediction':
        return { risk: Math.random() > 0.7 ? 'high' : 'low', probability: Math.random() }
      case 'skill_recommendation':
        return { skills: ['React', 'Python', 'AWS'], priority: 'high' }
      case 'team_optimization':
        return { recommendation: 'Add 2 developers to Team A', impact: 'high' }
      default:
        return { value: Math.random() }
    }
  }

  // Cleanup
  destroy() {
    this.subscribers.clear()
    this.workflows?.clear()
    this.plugins?.clear()
    this.mlModels?.clear()
    this.state = null
    this.advancedMetrics = null
  }
}

// Create singleton instance
const integrationService = new IntegrationService()

// Auto-initialize with mock data for demonstration
setTimeout(() => {
  integrationService.addUser({
    id: 'user1',
    name: 'Alice Johnson',
    avatar: '👩‍💼',
    status: 'online',
    role: 'admin'
  })
  
  integrationService.addUser({
    id: 'user2',
    name: 'Bob Smith',
    avatar: '👨‍💻',
    status: 'online',
    role: 'editor'
  })

  integrationService.updatePerformanceMetrics({
    fps: 60,
    memoryUsage: 45,
    loadTime: 1200,
    apiLatency: 150
  })

  integrationService.updateSystemHealth('healthy', {
    uptime: '99.9%',
    lastBackup: new Date(Date.now() - 3600000),
    activeConnections: 12
  })
}, 1000)

export default integrationService

// Export specific service methods for convenience
export const {
  subscribe,
  emit,
  addUser,
  removeUser,
  updateUserStatus,
  updatePerformanceMetrics,
  addAutomationTask,
  updateTaskStatus,
  addExportJob,
  updateExportProgress,
  completeExportJob,
  startCollaborationSession,
  joinCollaborationSession,
  trackUserAction,
  updateSystemHealth,
  syncData,
  registerCommand,
  executeCommand,
  showNotification,
  registerShortcut,
  updateTheme,
  performSearch,
  getState,
  reset
} = integrationService