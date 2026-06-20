import config from '../config.js'

class RealTimeService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = config.websocket.reconnectAttempts
    this.reconnectDelay = config.websocket.reconnectDelay
    this.listeners = new Map()
    this.isConnected = false
    this.heartbeatInterval = null
  }

  connect(url = config.websocket.getURL()) {
    try {
      this.ws = new WebSocket(url)
      this.setupEventHandlers()
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.scheduleReconnect()
    }
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.emit('connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.isConnected = false
      this.stopHeartbeat()
      this.emit('disconnected')
      
      if (!event.wasClean) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    }
  }

  handleMessage(data) {
    const { type, payload } = data

    switch (type) {
      case 'org_data_updated':
        this.emit('orgDataUpdated', payload)
        break
      case 'work_data_updated':
        this.emit('workDataUpdated', payload)
        break
      case 'user_activity':
        this.emit('userActivity', payload)
        break
      case 'system_notification':
        this.emit('systemNotification', payload)
        break
      case 'data_sync_status':
        this.emit('dataSyncStatus', payload)
        break
      case 'heartbeat':
        // Respond to server heartbeat
        this.send({ type: 'heartbeat_response' })
        break
      default:
        console.log('Unknown message type:', type)
    }
  }

  send(data) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not connected, message not sent:', data)
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'heartbeat' })
      }
    }, config.websocket.heartbeatInterval)
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
      console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)
      
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    } else {
      console.error('Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
    }
    this.stopHeartbeat()
    this.listeners.clear()
  }

  // Request specific data updates
  requestOrgDataUpdate() {
    this.send({ type: 'request_org_update' })
  }

  requestWorkDataUpdate() {
    this.send({ type: 'request_work_update' })
  }

  // Send user activity
  sendUserActivity(activity) {
    this.send({
      type: 'user_activity',
      payload: {
        ...activity,
        timestamp: Date.now(),
        userId: this.getUserId()
      }
    })
  }

  getUserId() {
    // Get or generate user ID for session tracking
    let userId = localStorage.getItem('user_session_id')
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('user_session_id', userId)
    }
    return userId
  }
}

// Singleton instance
const realTimeService = new RealTimeService()

// Auto-connect when service is imported
if (typeof window !== 'undefined') {
  // Only connect in browser environment
  realTimeService.connect()
}

export default realTimeService

import React from 'react'

// React hook for using real-time service
export const useRealTime = () => {
  const [isConnected, setIsConnected] = React.useState(realTimeService.isConnected)
  const [lastActivity, setLastActivity] = React.useState(null)

  React.useEffect(() => {
    const unsubscribeConnected = realTimeService.subscribe('connected', () => {
      setIsConnected(true)
    })

    const unsubscribeDisconnected = realTimeService.subscribe('disconnected', () => {
      setIsConnected(false)
    })

    const unsubscribeActivity = realTimeService.subscribe('userActivity', (activity) => {
      setLastActivity(activity)
    })

    return () => {
      unsubscribeConnected()
      unsubscribeDisconnected()
      unsubscribeActivity()
    }
  }, [])

  return {
    isConnected,
    lastActivity,
    service: realTimeService
  }
}

// Data synchronization service
export class DataSyncService {
  constructor() {
    this.syncQueue = []
    this.isSyncing = false
    this.lastSyncTime = null
    this.syncInterval = null
  }

  startAutoSync(intervalMs = config.sync.autoSyncInterval) {
    this.syncInterval = setInterval(() => {
      this.syncAll()
    }, intervalMs)
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async syncAll() {
    if (this.isSyncing) return

    this.isSyncing = true
    try {
      // Sync organization data
      await this.syncOrgData()
      
      // Sync work plan data
      await this.syncWorkData()
      
      // Sync LDAP data if configured
      await this.syncLDAPData()
      
      this.lastSyncTime = new Date()
      realTimeService.emit('syncCompleted', { timestamp: this.lastSyncTime })
      
    } catch (error) {
      console.error('Data sync failed:', error)
      realTimeService.emit('syncError', error)
    } finally {
      this.isSyncing = false
    }
  }

  async syncOrgData() {
    // Implementation for org data sync
    console.log('Syncing organization data...')
  }

  async syncWorkData() {
    // Implementation for work data sync
    console.log('Syncing work plan data...')
  }

  async syncLDAPData() {
    // Implementation for LDAP sync
    console.log('Syncing LDAP data...')
  }

  queueSync(type, data) {
    this.syncQueue.push({ type, data, timestamp: Date.now() })
  }

  async processSyncQueue() {
    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift()
      try {
        await this.processSync(item)
      } catch (error) {
        console.error('Failed to process sync item:', error)
      }
    }
  }

  async processSync(item) {
    const { type, data } = item
    
    switch (type) {
      case 'org_update':
        // Process organization update
        break
      case 'work_update':
        // Process work plan update
        break
      default:
        console.warn('Unknown sync type:', type)
    }
  }
}

export const dataSyncService = new DataSyncService()

// Advanced collaboration service
export class CollaborationService {
  constructor(realTimeService) {
    this.realTime = realTimeService
    this.cursors = new Map()
    this.selections = new Map()
    this.annotations = new Map()
    this.voiceChannels = new Map()
  }

  // Cursor tracking
  updateCursor(userId, position, element) {
    const cursorData = {
      userId,
      position,
      element,
      timestamp: Date.now()
    }
    
    this.cursors.set(userId, cursorData)
    this.realTime.send({
      type: 'cursor_update',
      payload: cursorData
    })
  }

  // Text selection sharing
  shareSelection(userId, selection, context) {
    const selectionData = {
      userId,
      selection,
      context,
      timestamp: Date.now()
    }
    
    this.selections.set(userId, selectionData)
    this.realTime.send({
      type: 'selection_update',
      payload: selectionData
    })
  }

  // Real-time annotations
  addAnnotation(userId, annotation) {
    const annotationData = {
      id: Date.now(),
      userId,
      ...annotation,
      timestamp: Date.now()
    }
    
    this.annotations.set(annotationData.id, annotationData)
    this.realTime.send({
      type: 'annotation_added',
      payload: annotationData
    })
    
    return annotationData.id
  }

  updateAnnotation(annotationId, updates) {
    if (this.annotations.has(annotationId)) {
      const annotation = this.annotations.get(annotationId)
      Object.assign(annotation, updates, { updatedAt: Date.now() })
      
      this.realTime.send({
        type: 'annotation_updated',
        payload: annotation
      })
    }
  }

  deleteAnnotation(annotationId) {
    if (this.annotations.has(annotationId)) {
      this.annotations.delete(annotationId)
      this.realTime.send({
        type: 'annotation_deleted',
        payload: { id: annotationId }
      })
    }
  }

  // Voice/Video channels
  createVoiceChannel(channelName, options = {}) {
    const channel = {
      id: Date.now(),
      name: channelName,
      participants: [],
      options,
      createdAt: Date.now()
    }
    
    this.voiceChannels.set(channel.id, channel)
    this.realTime.send({
      type: 'voice_channel_created',
      payload: channel
    })
    
    return channel.id
  }

  joinVoiceChannel(channelId, userId, mediaConfig = {}) {
    if (this.voiceChannels.has(channelId)) {
      const channel = this.voiceChannels.get(channelId)
      const participant = {
        userId,
        joinedAt: Date.now(),
        mediaConfig
      }
      
      channel.participants.push(participant)
      
      this.realTime.send({
        type: 'voice_channel_joined',
        payload: { channelId, participant }
      })
    }
  }

  leaveVoiceChannel(channelId, userId) {
    if (this.voiceChannels.has(channelId)) {
      const channel = this.voiceChannels.get(channelId)
      channel.participants = channel.participants.filter(p => p.userId !== userId)
      
      this.realTime.send({
        type: 'voice_channel_left',
        payload: { channelId, userId }
      })
    }
  }

  // Screen sharing
  startScreenShare(userId, streamConfig) {
    this.realTime.send({
      type: 'screen_share_started',
      payload: { userId, streamConfig, timestamp: Date.now() }
    })
  }

  stopScreenShare(userId) {
    this.realTime.send({
      type: 'screen_share_stopped',
      payload: { userId, timestamp: Date.now() }
    })
  }

  // Collaborative editing
  applyOperation(operation) {
    // Operational Transform for collaborative editing
    const transformedOp = this.transformOperation(operation)
    
    this.realTime.send({
      type: 'operation_applied',
      payload: transformedOp
    })
    
    return transformedOp
  }

  transformOperation(operation) {
    // Simple operational transform implementation
    return {
      ...operation,
      id: Date.now(),
      timestamp: Date.now()
    }
  }

  // Presence awareness
  updatePresence(userId, presence) {
    this.realTime.send({
      type: 'presence_update',
      payload: { userId, presence, timestamp: Date.now() }
    })
  }

  // Conflict resolution
  resolveConflict(conflictId, resolution) {
    this.realTime.send({
      type: 'conflict_resolved',
      payload: { conflictId, resolution, timestamp: Date.now() }
    })
  }
}

// Advanced notification service
export class AdvancedNotificationService {
  constructor() {
    this.notifications = new Map()
    this.channels = new Map()
    this.templates = new Map()
  }

  createChannel(channelName, config = {}) {
    const channel = {
      name: channelName,
      subscribers: new Set(),
      config,
      createdAt: Date.now()
    }
    
    this.channels.set(channelName, channel)
    return channelName
  }

  subscribe(channelName, callback) {
    if (!this.channels.has(channelName)) {
      this.createChannel(channelName)
    }
    
    const channel = this.channels.get(channelName)
    channel.subscribers.add(callback)
    
    return () => {
      channel.subscribers.delete(callback)
    }
  }

  publish(channelName, notification) {
    if (this.channels.has(channelName)) {
      const channel = this.channels.get(channelName)
      const processedNotification = this.processNotification(notification, channel.config)
      
      channel.subscribers.forEach(callback => {
        try {
          callback(processedNotification)
        } catch (error) {
          console.error('Error in notification callback:', error)
        }
      })
    }
  }

  processNotification(notification, config) {
    return {
      id: Date.now(),
      ...notification,
      timestamp: Date.now(),
      processed: true,
      config
    }
  }

  createTemplate(templateName, template) {
    this.templates.set(templateName, template)
  }

  sendFromTemplate(templateName, data, channels = []) {
    if (!this.templates.has(templateName)) {
      throw new Error(`Template ${templateName} not found`)
    }
    
    const template = this.templates.get(templateName)
    const notification = this.renderTemplate(template, data)
    
    channels.forEach(channel => {
      this.publish(channel, notification)
    })
  }

  renderTemplate(template, data) {
    const rendered = { ...template }
    
    // Simple template rendering
    if (template.title) {
      rendered.title = this.interpolateString(template.title, data)
    }
    if (template.message) {
      rendered.message = this.interpolateString(template.message, data)
    }
    
    return rendered
  }

  interpolateString(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match
    })
  }
}

export const collaborationService = new CollaborationService(realTimeService)
export const advancedNotificationService = new AdvancedNotificationService()