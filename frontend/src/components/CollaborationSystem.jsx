import React, { useState, useEffect, useRef } from 'react'
import {
  Users,
  MessageCircle,
  Share2,
  Eye,
  Edit3,
  Clock,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Settings,
  UserPlus,
  Crown,
  Shield
} from 'lucide-react'
import { useNotifications } from './NotificationSystem'

const CollaborationSystem = ({
  isOpen,
  onClose,
  currentUser = { id: 'user1', name: 'Current User', avatar: '👤' },
  className = ''
}) => {
  const [activeUsers, setActiveUsers] = useState([
    { id: 'user1', name: 'Alice Johnson', avatar: '👩‍💼', status: 'online', role: 'admin', cursor: { x: 0, y: 0 } },
    { id: 'user2', name: 'Bob Smith', avatar: '👨‍💻', status: 'online', role: 'editor', cursor: { x: 100, y: 50 } },
    { id: 'user3', name: 'Carol Davis', avatar: '👩‍🔬', status: 'away', role: 'viewer', cursor: null }
  ])

  const [messages, setMessages] = useState([
    { id: 1, userId: 'user2', message: 'The org chart looks great!', timestamp: new Date(Date.now() - 300000) },
    { id: 2, userId: 'user1', message: 'Thanks! Should we add the new team structure?', timestamp: new Date(Date.now() - 240000) },
    { id: 3, userId: 'user3', message: 'I can help with the data validation', timestamp: new Date(Date.now() - 180000) }
  ])

  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState('users')
  const [isCallActive, setIsCallActive] = useState(false)
  const [callSettings, setCallSettings] = useState({ video: false, audio: false })
  const [permissions, setPermissions] = useState({})

  const messagesEndRef = useRef(null)
  const { success, info } = useNotifications()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simulate real-time cursor tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev.map(user => ({
        ...user,
        cursor: user.status === 'online' && user.id !== currentUser.id ? {
          x: Math.random() * 300,
          y: Math.random() * 200
        } : user.cursor
      })))
    }, 3000)

    return () => clearInterval(interval)
  }, [currentUser.id])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: Date.now(),
      userId: currentUser.id,
      message: newMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Simulate message broadcast
    info(`Message sent to ${activeUsers.length - 1} collaborators`)
  }

  const handleInviteUser = () => {
    const inviteLink = `${window.location.origin}/collaborate/${Math.random().toString(36).substring(2, 11)}`
    navigator.clipboard.writeText(inviteLink)
    success('Collaboration link copied to clipboard!')
  }

  const handleStartCall = () => {
    setIsCallActive(true)
    info('Video call started')
  }

  const handleEndCall = () => {
    setIsCallActive(false)
    setCallSettings({ video: false, audio: false })
    info('Video call ended')
  }

  const togglePermission = (userId, permission) => {
    setPermissions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [permission]: !prev[userId]?.[permission]
      }
    }))
    success(`Permission ${permission} ${permissions[userId]?.[permission] ? 'revoked' : 'granted'} for user`)
  }

  const getUserColor = (userId) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    return colors[userId.charCodeAt(userId.length - 1) % colors.length]
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, count: activeUsers.length },
    { id: 'chat', label: 'Chat', icon: MessageCircle, count: messages.length },
    { id: 'activity', label: 'Activity', icon: Clock, count: 5 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  if (!isOpen) return null

  return (
    <div className={`collaboration-system ${className}`}>
      <div className="collaboration-overlay" onClick={onClose} />

      <div className="collaboration-panel">
        <div className="panel-header">
          <h3>Collaboration</h3>
          <div className="header-actions">
            <button
              className="action-btn invite-btn"
              onClick={handleInviteUser}
              title="Invite collaborators"
            >
              <UserPlus size={16} />
            </button>

            {!isCallActive ? (
              <button
                className="action-btn call-btn"
                onClick={handleStartCall}
                title="Start video call"
              >
                <Video size={16} />
              </button>
            ) : (
              <button
                className="action-btn end-call-btn"
                onClick={handleEndCall}
                title="End call"
              >
                <PhoneOff size={16} />
              </button>
            )}

            <button
              className="close-btn"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        {isCallActive && (
          <div className="call-controls">
            <div className="call-info">
              <div className="call-indicator">
                <div className="pulse-dot"></div>
                Live Call - {activeUsers.filter(u => u.status === 'online').length} participants
              </div>
            </div>

            <div className="call-buttons">
              <button
                className={`call-control-btn ${callSettings.audio ? 'active' : ''}`}
                onClick={() => setCallSettings(prev => ({ ...prev, audio: !prev.audio }))}
              >
                {callSettings.audio ? <Mic size={16} /> : <MicOff size={16} />}
              </button>

              <button
                className={`call-control-btn ${callSettings.video ? 'active' : ''}`}
                onClick={() => setCallSettings(prev => ({ ...prev, video: !prev.video }))}
              >
                {callSettings.video ? <Video size={16} /> : <VideoOff size={16} />}
              </button>
            </div>
          </div>
        )}

        <div className="panel-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count && <span className="tab-count">{tab.count}</span>}
              </button>
            )
          })}
        </div>

        <div className="panel-content">
          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="users-list">
                {activeUsers.map(user => (
                  <div key={user.id} className="user-item">
                    <div className="user-avatar">
                      <span>{user.avatar}</span>
                      <div className={`status-dot ${user.status}`}></div>
                    </div>

                    <div className="user-info">
                      <div className="user-name">
                        {user.name}
                        {user.role === 'admin' && <Crown size={12} />}
                        {user.role === 'editor' && <Edit3 size={12} />}
                        {user.role === 'viewer' && <Eye size={12} />}
                      </div>
                      <div className="user-status">{user.status}</div>
                    </div>

                    <div className="user-actions">
                      <button
                        className="permission-btn"
                        onClick={() => togglePermission(user.id, 'edit')}
                        title="Toggle edit permission"
                      >
                        <Shield size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cursors-preview">
                <h4>Live Cursors</h4>
                <div className="cursor-container">
                  {activeUsers
                    .filter(user => user.cursor && user.status === 'online' && user.id !== currentUser.id)
                    .map(user => (
                      <div
                        key={user.id}
                        className="live-cursor"
                        style={{
                          left: user.cursor.x,
                          top: user.cursor.y,
                          borderColor: getUserColor(user.id)
                        }}
                      >
                        <div className="cursor-label" style={{ backgroundColor: getUserColor(user.id) }}>
                          {user.name}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="chat-tab">
              <div className="messages-container">
                {messages.map(message => {
                  const user = activeUsers.find(u => u.id === message.userId)
                  return (
                    <div key={message.id} className="message">
                      <div className="message-avatar">
                        <span>{user?.avatar || '👤'}</span>
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-author">{user?.name || 'Unknown'}</span>
                          <span className="message-time">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="message-text">{message.message}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-container">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-tab">
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">
                    <Edit3 size={16} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>Bob Smith</strong> edited the organization chart
                    </div>
                    <div className="activity-time">2 minutes ago</div>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-icon">
                    <Users size={16} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>Carol Davis</strong> joined the session
                    </div>
                    <div className="activity-time">5 minutes ago</div>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-icon">
                    <Share2 size={16} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>Alice Johnson</strong> shared the work plan
                    </div>
                    <div className="activity-time">10 minutes ago</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="settings-section">
                <h4>Collaboration Settings</h4>

                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Show live cursors
                  </label>
                </div>

                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Enable real-time chat
                  </label>
                </div>

                <div className="setting-item">
                  <label>
                    <input type="checkbox" />
                    Auto-save changes
                  </label>
                </div>

                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Show activity notifications
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h4>Privacy Settings</h4>

                <div className="setting-item">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Allow screen sharing
                  </label>
                </div>

                <div className="setting-item">
                  <label>
                    <input type="checkbox" />
                    Anonymous mode
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .collaboration-system {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          align-items: stretch;
        }

        .collaboration-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(4px);
        }

        .collaboration-panel {
          width: 400px;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border-left: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .panel-header h3 {
          color: var(--theme-text);
          font-family: var(--font-display);
          margin: 0;
          font-size: 1.25rem;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 0.5rem;
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: var(--theme-text);
        }

        .invite-btn:hover {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .call-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        .end-call-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .end-call-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--theme-textSecondary);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .call-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: rgba(59, 130, 246, 0.1);
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
        }

        .call-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .call-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #3b82f6;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .call-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .call-control-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          padding: 0.5rem;
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .call-control-btn.active {
          background: rgba(59, 130, 246, 0.3);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.5);
        }

        .panel-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--glass-border);
        }

        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 0.5rem;
          background: none;
          border: none;
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          border-bottom: 2px solid transparent;
          font-size: 0.875rem;
        }

        .tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--theme-text);
        }

        .tab.active {
          color: var(--theme-primary);
          border-bottom-color: var(--theme-primary);
          background: rgba(59, 130, 246, 0.05);
        }

        .tab-count {
          background: var(--theme-primary);
          color: white;
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 18px;
          text-align: center;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .user-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
        }

        .user-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .user-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--theme-background);
        }

        .status-dot.online { background: #10b981; }
        .status-dot.away { background: #f59e0b; }
        .status-dot.offline { background: #6b7280; }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--theme-text);
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .user-status {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          text-transform: capitalize;
        }

        .user-actions {
          display: flex;
          gap: 0.5rem;
        }

        .permission-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          padding: 0.375rem;
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .permission-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: var(--theme-text);
        }

        .cursors-preview {
          margin-top: 2rem;
        }

        .cursors-preview h4 {
          color: var(--theme-text);
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }

        .cursor-container {
          position: relative;
          height: 150px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .live-cursor {
          position: absolute;
          width: 20px;
          height: 20px;
          pointer-events: none;
          transition: all 0.3s ease;
        }

        .live-cursor::before {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border-left: 10px solid;
          border-right: 10px solid transparent;
          border-bottom: 15px solid transparent;
          border-top: 15px solid;
          border-color: inherit;
        }

        .cursor-label {
          position: absolute;
          top: 20px;
          left: 0;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .messages-container {
          flex: 1;
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message {
          display: flex;
          gap: 0.75rem;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--theme-gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .message-author {
          color: var(--theme-text);
          font-weight: 500;
          font-size: 0.875rem;
        }

        .message-time {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .message-text {
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .message-input-container {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .message-input {
          flex: 1;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          color: var(--theme-text);
          font-size: 0.875rem;
          outline: none;
          transition: all var(--transition-normal);
        }

        .message-input:focus {
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .send-btn {
          background: var(--theme-gradient-primary);
          border: none;
          border-radius: var(--radius-lg);
          padding: 0.75rem;
          color: white;
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
        }

        .activity-text {
          color: var(--theme-text);
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .activity-time {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
        }

        .settings-section {
          margin-bottom: 2rem;
        }

        .settings-section h4 {
          color: var(--theme-text);
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }

        .setting-item {
          margin-bottom: 1rem;
        }

        .setting-item label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
          cursor: pointer;
        }

        .setting-item input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: var(--theme-primary);
        }

        @media (max-width: 768px) {
          .collaboration-panel {
            width: 100vw;
          }
        }
      `}</style>
    </div>
  )
}

export default CollaborationSystem