import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Zap,
  Users,
  Brain,
  Download,
  Keyboard,
  MessageCircle,
  Activity,
  Settings,
  HelpCircle,
  Command,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { useNotifications } from './NotificationSystem'
import integrationService from '../services/integrationService'

const FeatureShowcase = ({ isOpen, onClose, className = '' }) => {
  const [currentDemo, setCurrentDemo] = useState(null)
  const [demoProgress, setDemoProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const { success, info, warning } = useNotifications()

  const features = [
    {
      id: 'theme-system',
      title: 'Advanced Theme System',
      description: 'Multiple themes with glassmorphism effects and smooth transitions',
      icon: Sparkles,
      color: '#8b5cf6',
      demo: () => {
        info('Demonstrating theme system...')
        // Cycle through themes
        const themes = ['dark', 'light', 'cyberpunk', 'ocean', 'forest']
        let index = 0
        const interval = setInterval(() => {
          integrationService.updateTheme(themes[index])
          index = (index + 1) % themes.length
          setDemoProgress((index / themes.length) * 100)
          if (index === 0) {
            clearInterval(interval)
            success('Theme system demo completed!')
            setCurrentDemo(null)
            setIsRunning(false)
          }
        }, 1500)
      }
    },
    {
      id: 'ai-analytics',
      title: 'AI-Powered Analytics',
      description: 'Machine learning insights and predictive analytics',
      icon: Brain,
      color: '#3b82f6',
      demo: () => {
        info('Running AI analytics simulation...')
        let progress = 0
        const interval = setInterval(() => {
          progress += 20
          setDemoProgress(progress)
          if (progress >= 100) {
            clearInterval(interval)
            success('AI analysis complete! Generated 15 insights and 3 predictions.')
            setCurrentDemo(null)
            setIsRunning(false)
          }
        }, 800)
      }
    },
    {
      id: 'collaboration',
      title: 'Real-time Collaboration',
      description: 'Live cursors, chat, video calls, and user presence',
      icon: Users,
      color: '#10b981',
      demo: () => {
        info('Simulating collaboration features...')
        // Add mock users
        integrationService.addUser({
          id: 'demo-user-1',
          name: 'Demo User 1',
          avatar: '👨‍💼',
          status: 'online',
          role: 'editor'
        })
        
        setTimeout(() => {
          integrationService.addUser({
            id: 'demo-user-2',
            name: 'Demo User 2',
            avatar: '👩‍💻',
            status: 'online',
            role: 'viewer'
          })
          setDemoProgress(50)
        }, 1000)

        setTimeout(() => {
          success('Collaboration demo completed! 2 users joined the session.')
          setDemoProgress(100)
          setCurrentDemo(null)
          setIsRunning(false)
        }, 2000)
      }
    },
    {
      id: 'export-system',
      title: 'Advanced Export System',
      description: 'Multi-format exports with customizable options',
      icon: Download,
      color: '#f59e0b',
      demo: () => {
        info('Demonstrating export capabilities...')
        const formats = ['PDF', 'Excel', 'PNG', 'SVG', 'JSON']
        let index = 0
        const interval = setInterval(() => {
          const format = formats[index]
          const jobId = integrationService.addExportJob({
            format,
            data: { sample: 'data' },
            options: { quality: 'high' }
          })
          
          setTimeout(() => {
            integrationService.updateExportProgress(jobId, 100, 'completed')
            info(`${format} export completed!`)
          }, 500)

          index++
          setDemoProgress((index / formats.length) * 100)
          
          if (index >= formats.length) {
            clearInterval(interval)
            success('Export system demo completed! All formats exported.')
            setCurrentDemo(null)
            setIsRunning(false)
          }
        }, 1000)
      }
    },
    {
      id: 'automation',
      title: 'Workflow Automation',
      description: 'Scheduled tasks and event-driven automation',
      icon: Zap,
      color: '#ef4444',
      demo: () => {
        info('Running automation workflows...')
        const tasks = [
          'Data validation',
          'Report generation',
          'Backup creation',
          'Performance optimization',
          'Security scan'
        ]
        
        let index = 0
        const interval = setInterval(() => {
          const taskId = integrationService.addAutomationTask({
            name: tasks[index],
            type: 'scheduled',
            schedule: '0 9 * * *'
          })
          
          setTimeout(() => {
            integrationService.updateTaskStatus(taskId, 'completed', {
              duration: Math.floor(Math.random() * 5000 + 1000),
              success: true
            })
          }, 800)

          index++
          setDemoProgress((index / tasks.length) * 100)
          
          if (index >= tasks.length) {
            clearInterval(interval)
            success('Automation demo completed! All tasks executed successfully.')
            setCurrentDemo(null)
            setIsRunning(false)
          }
        }, 1200)
      }
    },
    {
      id: 'performance',
      title: 'Performance Monitoring',
      description: 'Real-time metrics and Web Vitals tracking',
      icon: Activity,
      color: '#06b6d4',
      demo: () => {
        info('Monitoring performance metrics...')
        let progress = 0
        const interval = setInterval(() => {
          progress += 25
          
          // Update mock performance metrics
          integrationService.updatePerformanceMetrics({
            fps: Math.floor(Math.random() * 20 + 50),
            memoryUsage: Math.floor(Math.random() * 30 + 40),
            loadTime: Math.floor(Math.random() * 500 + 800),
            apiLatency: Math.floor(Math.random() * 100 + 100)
          })
          
          setDemoProgress(progress)
          
          if (progress >= 100) {
            clearInterval(interval)
            success('Performance monitoring demo completed!')
            setCurrentDemo(null)
            setIsRunning(false)
          }
        }, 1000)
      }
    }
  ]

  const runDemo = (feature) => {
    if (isRunning) return
    
    setCurrentDemo(feature.id)
    setDemoProgress(0)
    setIsRunning(true)
    feature.demo()
  }

  const stopDemo = () => {
    setCurrentDemo(null)
    setDemoProgress(0)
    setIsRunning(false)
    info('Demo stopped')
  }

  const runAllDemos = async () => {
    if (isRunning) return
    
    info('Running complete feature showcase...')
    setIsRunning(true)
    
    for (const feature of features) {
      setCurrentDemo(feature.id)
      setDemoProgress(0)
      
      await new Promise((resolve) => {
        feature.demo()
        const checkComplete = setInterval(() => {
          if (!isRunning || currentDemo !== feature.id) {
            clearInterval(checkComplete)
            resolve()
          }
        }, 100)
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    success('Complete feature showcase finished!')
    setIsRunning(false)
    setCurrentDemo(null)
  }

  if (!isOpen) return null

  return (
    <div className={`feature-showcase ${className}`}>
      <div className="showcase-overlay" onClick={onClose} />
      
      <div className="showcase-panel">
        <div className="panel-header">
          <div className="header-title">
            <Sparkles size={24} />
            <h2>Feature Showcase</h2>
          </div>
          
          <div className="header-actions">
            <button 
              className="demo-control-btn run-all"
              onClick={runAllDemos}
              disabled={isRunning}
            >
              <Play size={16} />
              Run All Demos
            </button>
            
            {isRunning && (
              <button 
                className="demo-control-btn stop"
                onClick={stopDemo}
              >
                <Pause size={16} />
                Stop
              </button>
            )}
            
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="showcase-content">
          <div className="features-grid">
            {features.map(feature => {
              const Icon = feature.icon
              const isActive = currentDemo === feature.id
              
              return (
                <div 
                  key={feature.id} 
                  className={`feature-card ${isActive ? 'active' : ''}`}
                >
                  <div className="feature-header">
                    <div 
                      className="feature-icon"
                      style={{ backgroundColor: `${feature.color}20`, color: feature.color }}
                    >
                      <Icon size={24} />
                    </div>
                    <div className="feature-info">
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="demo-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${demoProgress}%`,
                            backgroundColor: feature.color
                          }}
                        />
                      </div>
                      <div className="progress-text">
                        {Math.round(demoProgress)}% Complete
                      </div>
                    </div>
                  )}

                  <div className="feature-actions">
                    <button
                      className="demo-btn"
                      onClick={() => runDemo(feature)}
                      disabled={isRunning}
                      style={{ borderColor: feature.color, color: feature.color }}
                    >
                      {isActive ? (
                        <>
                          <Activity size={16} />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          Demo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="showcase-info">
            <div className="info-card">
              <h4>🚀 NextGen Org Visualizer Features</h4>
              <ul>
                <li><strong>Modern UI/UX:</strong> Glassmorphism design with multiple themes</li>
                <li><strong>AI Analytics:</strong> Machine learning insights and predictions</li>
                <li><strong>Real-time Collaboration:</strong> Live cursors, chat, and video calls</li>
                <li><strong>Advanced Export:</strong> Multiple formats with customization</li>
                <li><strong>Automation:</strong> Workflow automation and scheduling</li>
                <li><strong>Performance Monitoring:</strong> Real-time metrics and optimization</li>
                <li><strong>Command Palette:</strong> Quick actions and keyboard shortcuts</li>
                <li><strong>Help System:</strong> Comprehensive documentation and tutorials</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .feature-showcase {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .showcase-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
        }

        .showcase-panel {
          position: relative;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          width: 100%;
          max-width: 1400px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-title h2 {
          color: var(--theme-text);
          font-family: var(--font-display);
          margin: 0;
          font-size: 1.5rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .demo-control-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: 1px solid;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-weight: 500;
        }

        .demo-control-btn.run-all {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
          color: #10b981;
        }

        .demo-control-btn.run-all:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.3);
        }

        .demo-control-btn.stop {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: #ef4444;
        }

        .demo-control-btn.stop:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .demo-control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--theme-textSecondary);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .showcase-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .feature-card.active {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2);
        }

        .feature-card.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .feature-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-info {
          flex: 1;
        }

        .feature-info h3 {
          color: var(--theme-text);
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .feature-info p {
          color: var(--theme-textSecondary);
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .demo-progress {
          margin: 1rem 0;
        }

        .progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width var(--transition-normal);
        }

        .progress-text {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          text-align: center;
        }

        .feature-actions {
          display: flex;
          justify-content: flex-end;
        }

        .demo-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .demo-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .demo-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .showcase-info {
          margin-top: 2rem;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: 2rem;
        }

        .info-card h4 {
          color: var(--theme-text);
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 0.75rem;
        }

        .info-card li {
          color: var(--theme-textSecondary);
          font-size: 0.9rem;
          line-height: 1.4;
          padding: 0.5rem 0;
        }

        .info-card strong {
          color: var(--theme-text);
        }

        @media (max-width: 768px) {
          .feature-showcase {
            padding: 1rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .panel-header {
            padding: 1.5rem;
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .info-card ul {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default FeatureShowcase