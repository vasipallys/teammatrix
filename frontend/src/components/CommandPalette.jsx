import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Search, 
  Command, 
  Users, 
  Calendar, 
  Database, 
  Brain,
  Settings,
  Download,
  MessageCircle,
  Keyboard,
  Monitor,
  Palette,
  Zap,
  FileText,
  BarChart3,
  Filter,
  RefreshCw,
  Upload,
  Share2,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Save,
  Plus,
  ArrowRight
} from 'lucide-react'
import { useNotifications } from './NotificationSystem'

const CommandPalette = ({ 
  isOpen, 
  onClose, 
  onNavigate,
  onAction,
  currentTab = 'org',
  className = '' 
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentCommands, setRecentCommands] = useState([])
  
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const { success, info } = useNotifications()

  // Command definitions with categories
  const commands = useMemo(() => [
    // Navigation Commands
    {
      id: 'nav-org',
      title: 'Go to Organization',
      description: 'Switch to organization structure view',
      category: 'Navigation',
      icon: Users,
      shortcut: 'Ctrl+1',
      action: () => onNavigate?.('org'),
      keywords: ['org', 'organization', 'structure', 'hierarchy', 'team']
    },
    {
      id: 'nav-work',
      title: 'Go to Work Plans',
      description: 'Switch to work plan timeline view',
      category: 'Navigation',
      icon: Calendar,
      shortcut: 'Ctrl+2',
      action: () => onNavigate?.('work'),
      keywords: ['work', 'plans', 'timeline', 'gantt', 'projects']
    },
    {
      id: 'nav-analytics',
      title: 'Go to Analytics',
      description: 'Switch to AI analytics dashboard',
      category: 'Navigation',
      icon: Brain,
      shortcut: 'Ctrl+3',
      action: () => onNavigate?.('analytics'),
      keywords: ['analytics', 'ai', 'insights', 'predictions', 'dashboard']
    },
    {
      id: 'nav-data',
      title: 'Go to Data Hub',
      description: 'Switch to data management center',
      category: 'Navigation',
      icon: Database,
      shortcut: 'Ctrl+4',
      action: () => onNavigate?.('data'),
      keywords: ['data', 'hub', 'management', 'import', 'export']
    },

    // Data Operations
    {
      id: 'data-refresh',
      title: 'Refresh Data',
      description: 'Reload all data from sources',
      category: 'Data',
      icon: RefreshCw,
      shortcut: 'Ctrl+R',
      action: () => onAction?.('refresh'),
      keywords: ['refresh', 'reload', 'sync', 'update']
    },
    {
      id: 'data-import',
      title: 'Import Data',
      description: 'Upload new data files',
      category: 'Data',
      icon: Upload,
      shortcut: 'Ctrl+I',
      action: () => onAction?.('import'),
      keywords: ['import', 'upload', 'file', 'csv', 'excel']
    },
    {
      id: 'data-export',
      title: 'Export Data',
      description: 'Download data in various formats',
      category: 'Data',
      icon: Download,
      shortcut: 'Ctrl+E',
      action: () => onAction?.('export'),
      keywords: ['export', 'download', 'pdf', 'excel', 'csv']
    },
    {
      id: 'data-save',
      title: 'Save Changes',
      description: 'Save current modifications',
      category: 'Data',
      icon: Save,
      shortcut: 'Ctrl+S',
      action: () => onAction?.('save'),
      keywords: ['save', 'persist', 'commit', 'changes']
    },

    // View Commands
    {
      id: 'view-fullscreen',
      title: 'Toggle Fullscreen',
      description: 'Enter or exit fullscreen mode',
      category: 'View',
      icon: Monitor,
      shortcut: 'F11',
      action: () => onAction?.('fullscreen'),
      keywords: ['fullscreen', 'maximize', 'expand', 'focus']
    },
    {
      id: 'view-theme',
      title: 'Change Theme',
      description: 'Switch between available themes',
      category: 'View',
      icon: Palette,
      shortcut: 'Ctrl+T',
      action: () => onAction?.('theme'),
      keywords: ['theme', 'dark', 'light', 'color', 'appearance']
    },
    {
      id: 'view-filters',
      title: 'Open Filters',
      description: 'Configure data filters and views',
      category: 'View',
      icon: Filter,
      action: () => onAction?.('filters'),
      keywords: ['filter', 'search', 'criteria', 'view', 'customize']
    },

    // Collaboration
    {
      id: 'collab-open',
      title: 'Open Collaboration',
      description: 'Start collaborating with team members',
      category: 'Collaboration',
      icon: MessageCircle,
      shortcut: 'Ctrl+Shift+C',
      action: () => onAction?.('collaboration'),
      keywords: ['collaborate', 'chat', 'team', 'share', 'work together']
    },
    {
      id: 'collab-share',
      title: 'Share Link',
      description: 'Generate shareable collaboration link',
      category: 'Collaboration',
      icon: Share2,
      action: () => onAction?.('share'),
      keywords: ['share', 'link', 'invite', 'collaborate', 'team']
    },

    // Tools
    {
      id: 'tools-shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'View all available keyboard shortcuts',
      category: 'Tools',
      icon: Keyboard,
      shortcut: 'Ctrl+?',
      action: () => onAction?.('shortcuts'),
      keywords: ['shortcuts', 'keyboard', 'hotkeys', 'commands']
    },
    {
      id: 'tools-performance',
      title: 'Performance Monitor',
      description: 'View system performance metrics',
      category: 'Tools',
      icon: Monitor,
      shortcut: 'Ctrl+Shift+P',
      action: () => onAction?.('performance'),
      keywords: ['performance', 'monitor', 'metrics', 'speed', 'memory']
    },
    {
      id: 'tools-settings',
      title: 'Settings',
      description: 'Configure application preferences',
      category: 'Tools',
      icon: Settings,
      action: () => onAction?.('settings'),
      keywords: ['settings', 'preferences', 'config', 'options']
    },

    // Current View Actions (dynamic based on currentTab)
    ...(currentTab === 'org' ? [
      {
        id: 'org-add-employee',
        title: 'Add Employee',
        description: 'Add new employee to organization',
        category: 'Organization',
        icon: Plus,
        action: () => onAction?.('add-employee'),
        keywords: ['add', 'employee', 'person', 'staff', 'new']
      },
      {
        id: 'org-edit-structure',
        title: 'Edit Structure',
        description: 'Modify organization hierarchy',
        category: 'Organization',
        icon: Edit3,
        action: () => onAction?.('edit-structure'),
        keywords: ['edit', 'structure', 'hierarchy', 'modify', 'change']
      }
    ] : []),

    ...(currentTab === 'work' ? [
      {
        id: 'work-add-project',
        title: 'Add Project',
        description: 'Create new work plan item',
        category: 'Work Plans',
        icon: Plus,
        action: () => onAction?.('add-project'),
        keywords: ['add', 'project', 'task', 'work', 'plan', 'new']
      },
      {
        id: 'work-timeline-view',
        title: 'Timeline View',
        description: 'Switch to timeline visualization',
        category: 'Work Plans',
        icon: BarChart3,
        action: () => onAction?.('timeline-view'),
        keywords: ['timeline', 'gantt', 'view', 'schedule']
      }
    ] : []),

    ...(currentTab === 'analytics' ? [
      {
        id: 'analytics-generate-report',
        title: 'Generate Report',
        description: 'Create analytics report',
        category: 'Analytics',
        icon: FileText,
        action: () => onAction?.('generate-report'),
        keywords: ['report', 'analytics', 'generate', 'insights']
      },
      {
        id: 'analytics-predictions',
        title: 'View Predictions',
        description: 'Show AI-powered predictions',
        category: 'Analytics',
        icon: Zap,
        action: () => onAction?.('predictions'),
        keywords: ['predictions', 'ai', 'forecast', 'future']
      }
    ] : [])
  ], [currentTab, onNavigate, onAction])

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show recent commands first, then popular commands
      const recent = recentCommands.slice(0, 5)
      const popular = commands.filter(cmd => 
        !recent.some(r => r.id === cmd.id) && 
        ['nav-org', 'nav-work', 'data-refresh', 'data-export', 'collab-open'].includes(cmd.id)
      )
      return [...recent, ...popular].slice(0, 8)
    }

    const queryLower = query.toLowerCase()
    return commands
      .filter(command => 
        command.title.toLowerCase().includes(queryLower) ||
        command.description.toLowerCase().includes(queryLower) ||
        command.category.toLowerCase().includes(queryLower) ||
        command.keywords.some(keyword => keyword.includes(queryLower))
      )
      .sort((a, b) => {
        // Prioritize title matches
        const aTitle = a.title.toLowerCase().includes(queryLower)
        const bTitle = b.title.toLowerCase().includes(queryLower)
        if (aTitle && !bTitle) return -1
        if (!aTitle && bTitle) return 1
        
        // Then category matches
        const aCategory = a.category.toLowerCase().includes(queryLower)
        const bCategory = b.category.toLowerCase().includes(queryLower)
        if (aCategory && !bCategory) return -1
        if (!aCategory && bCategory) return 1
        
        return 0
      })
      .slice(0, 10)
  }, [query, commands, recentCommands])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose?.()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedIndex])

  const executeCommand = (command) => {
    // Add to recent commands
    setRecentCommands(prev => {
      const filtered = prev.filter(cmd => cmd.id !== command.id)
      return [command, ...filtered].slice(0, 10)
    })

    // Execute the command
    command.action?.()
    
    // Show feedback
    success(`Executed: ${command.title}`)
    
    // Close palette
    onClose?.()
  }

  const groupedCommands = useMemo(() => {
    const groups = {}
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = []
      }
      groups[command.category].push(command)
    })
    return groups
  }, [filteredCommands])

  if (!isOpen) return null

  return (
    <div className={`command-palette ${className}`}>
      <div className="palette-overlay" onClick={onClose} />
      
      <div className="palette-container">
        <div className="palette-header">
          <div className="search-container">
            <Search size={20} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="command-input"
            />
            <div className="search-hint">
              <Command size={14} />
            </div>
          </div>
        </div>

        <div className="palette-content" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="no-results">
              <Search size={48} />
              <h3>No commands found</h3>
              <p>Try different keywords or check your spelling</p>
            </div>
          ) : (
            <div className="commands-list">
              {query.trim() ? (
                // Show flat list when searching
                filteredCommands.map((command, index) => (
                  <CommandItem
                    key={command.id}
                    command={command}
                    isSelected={index === selectedIndex}
                    onClick={() => executeCommand(command)}
                  />
                ))
              ) : (
                // Show grouped list when not searching
                Object.entries(groupedCommands).map(([category, commands]) => (
                  <div key={category} className="command-group">
                    <div className="group-header">{category}</div>
                    {commands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command)
                      return (
                        <CommandItem
                          key={command.id}
                          command={command}
                          isSelected={globalIndex === selectedIndex}
                          onClick={() => executeCommand(command)}
                        />
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="palette-footer">
          <div className="footer-hints">
            <span className="hint">
              <kbd>↑↓</kbd> Navigate
            </span>
            <span className="hint">
              <kbd>Enter</kbd> Execute
            </span>
            <span className="hint">
              <kbd>Esc</kbd> Close
            </span>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .command-palette {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 10vh;
        }

        .palette-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
        }

        .palette-container {
          position: relative;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          width: 100%;
          max-width: 600px;
          max-height: 70vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .palette-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .search-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 1rem;
          transition: all var(--transition-normal);
        }

        .search-container:focus-within {
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .command-input {
          flex: 1;
          background: none;
          border: none;
          color: var(--theme-text);
          font-size: 1.1rem;
          outline: none;
          font-weight: 500;
        }

        .command-input::placeholder {
          color: var(--theme-textSecondary);
        }

        .search-hint {
          color: var(--theme-textSecondary);
          opacity: 0.6;
        }

        .palette-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 0;
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 3rem 2rem;
          color: var(--theme-textSecondary);
        }

        .no-results h3 {
          color: var(--theme-text);
          margin: 1rem 0 0.5rem 0;
        }

        .commands-list {
          display: flex;
          flex-direction: column;
        }

        .command-group {
          margin-bottom: 1rem;
        }

        .group-header {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0.5rem 1.5rem;
          margin-bottom: 0.25rem;
        }

        .palette-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .footer-hints {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
        }

        .hint {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        .hint kbd {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-sm);
          padding: 0.25rem 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--theme-text);
        }

        @media (max-width: 768px) {
          .command-palette {
            padding: 2rem 1rem;
            padding-top: 5vh;
          }

          .palette-container {
            max-height: 80vh;
          }

          .palette-header {
            padding: 1rem;
          }

          .search-container {
            padding: 0.75rem;
          }

          .command-input {
            font-size: 1rem;
          }

          .footer-hints {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

const CommandItem = ({ command, isSelected, onClick }) => {
  const Icon = command.icon

  return (
    <div
      className={`command-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="command-icon">
        <Icon size={18} />
      </div>
      
      <div className="command-content">
        <div className="command-title">{command.title}</div>
        <div className="command-description">{command.description}</div>
      </div>

      <div className="command-meta">
        {command.shortcut && (
          <div className="command-shortcut">
            {command.shortcut.split('+').map((key, index) => (
              <React.Fragment key={index}>
                <kbd>{key}</kbd>
                {index < command.shortcut.split('+').length - 1 && <span>+</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <ArrowRight size={14} className="command-arrow" />
      </div>

      <style jsx="true">{`
        .command-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          border-radius: 0;
        }

        .command-item:hover,
        .command-item.selected {
          background: rgba(59, 130, 246, 0.1);
          border-left: 3px solid var(--theme-primary);
          padding-left: calc(1.5rem - 3px);
        }

        .command-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--theme-primary);
          flex-shrink: 0;
        }

        .command-content {
          flex: 1;
          min-width: 0;
        }

        .command-title {
          color: var(--theme-text);
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .command-description {
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
          line-height: 1.3;
        }

        .command-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .command-shortcut {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .command-shortcut kbd {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-sm);
          padding: 0.125rem 0.375rem;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--theme-textSecondary);
        }

        .command-shortcut span {
          color: var(--theme-textSecondary);
          font-size: 0.7rem;
        }

        .command-arrow {
          color: var(--theme-textSecondary);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .command-item:hover .command-arrow,
        .command-item.selected .command-arrow {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}

export default CommandPalette