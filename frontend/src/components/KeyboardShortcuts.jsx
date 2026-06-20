import React, { useState, useEffect, useCallback } from 'react'
import { Keyboard, Command, Search, Settings, Users, Calendar, Database, Zap, Eye, Download, Share2, Maximize2, Minimize2 } from 'lucide-react'

const KeyboardShortcuts = ({
    isOpen,
    onClose,
    onNavigate,
    onAction,
    className = ''
}) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState('navigation')

    const shortcuts = {
        navigation: [
            { key: '1', combo: 'Ctrl+1', description: 'Switch to Organization tab', action: () => onNavigate?.('org') },
            { key: '2', combo: 'Ctrl+2', description: 'Switch to Work Plans tab', action: () => onNavigate?.('work') },
            { key: '3', combo: 'Ctrl+3', description: 'Switch to Analytics tab', action: () => onNavigate?.('analytics') },
            { key: '4', combo: 'Ctrl+4', description: 'Switch to Data Hub tab', action: () => onNavigate?.('data') },
            { key: 'Tab', combo: 'Tab', description: 'Navigate between elements', action: null },
            { key: 'Escape', combo: 'Escape', description: 'Close modals and panels', action: null }
        ],
        search: [
            { key: '/', combo: 'Ctrl+/', description: 'Focus search bar', action: () => onAction?.('focus-search') },
            { key: 'k', combo: 'Ctrl+K', description: 'Open command palette', action: () => onAction?.('command-palette') },
            { key: 'f', combo: 'Ctrl+F', description: 'Find in current view', action: () => onAction?.('find') },
            { key: 'g', combo: 'Ctrl+G', description: 'Find next', action: () => onAction?.('find-next') }
        ],
        data: [
            { key: 'n', combo: 'Ctrl+N', description: 'Create new record', action: () => onAction?.('new-record') },
            { key: 's', combo: 'Ctrl+S', description: 'Save current changes', action: () => onAction?.('save') },
            { key: 'e', combo: 'Ctrl+E', description: 'Export current data', action: () => onAction?.('export') },
            { key: 'i', combo: 'Ctrl+I', description: 'Import data', action: () => onAction?.('import') },
            { key: 'r', combo: 'Ctrl+R', description: 'Refresh data', action: () => onAction?.('refresh') },
            { key: 'z', combo: 'Ctrl+Z', description: 'Undo last action', action: () => onAction?.('undo') },
            { key: 'y', combo: 'Ctrl+Y', description: 'Redo last action', action: () => onAction?.('redo') }
        ],
        view: [
            { key: 'F11', combo: 'F11', description: 'Toggle fullscreen', action: () => onAction?.('fullscreen') },
            { key: 't', combo: 'Ctrl+T', description: 'Toggle theme selector', action: () => onAction?.('theme') },
            { key: 'h', combo: 'Ctrl+H', description: 'Toggle sidebar', action: () => onAction?.('sidebar') },
            { key: 'b', combo: 'Ctrl+B', description: 'Toggle bottom panel', action: () => onAction?.('bottom-panel') },
            { key: '+', combo: 'Ctrl++', description: 'Zoom in', action: () => onAction?.('zoom-in') },
            { key: '-', combo: 'Ctrl+-', description: 'Zoom out', action: () => onAction?.('zoom-out') },
            { key: '0', combo: 'Ctrl+0', description: 'Reset zoom', action: () => onAction?.('zoom-reset') }
        ],
        collaboration: [
            { key: 'c', combo: 'Ctrl+Shift+C', description: 'Open collaboration panel', action: () => onAction?.('collaboration') },
            { key: 'm', combo: 'Ctrl+Shift+M', description: 'Send message', action: () => onAction?.('message') },
            { key: 'v', combo: 'Ctrl+Shift+V', description: 'Start video call', action: () => onAction?.('video-call') },
            { key: 'u', combo: 'Ctrl+Shift+U', description: 'Invite users', action: () => onAction?.('invite') }
        ],
        advanced: [
            { key: 'p', combo: 'Ctrl+Shift+P', description: 'Open performance monitor', action: () => onAction?.('performance') },
            { key: 'd', combo: 'Ctrl+Shift+D', description: 'Toggle developer tools', action: () => onAction?.('dev-tools') },
            { key: 'l', combo: 'Ctrl+Shift+L', description: 'View logs', action: () => onAction?.('logs') },
            { key: '?', combo: 'Ctrl+?', description: 'Show keyboard shortcuts', action: () => onAction?.('shortcuts') }
        ]
    }

    const categories = [
        { id: 'navigation', label: 'Navigation', icon: Command },
        { id: 'search', label: 'Search', icon: Search },
        { id: 'data', label: 'Data', icon: Database },
        { id: 'view', label: 'View', icon: Eye },
        { id: 'collaboration', label: 'Collaboration', icon: Users },
        { id: 'advanced', label: 'Advanced', icon: Settings }
    ]

    // Filter shortcuts based on search term
    const filteredShortcuts = searchTerm
        ? Object.entries(shortcuts).reduce((acc, [category, items]) => {
            const filtered = items.filter(item =>
                item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.combo.toLowerCase().includes(searchTerm.toLowerCase())
            )
            if (filtered.length > 0) {
                acc[category] = filtered
            }
            return acc
        }, {})
        : { [activeCategory]: shortcuts[activeCategory] }

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((event) => {
        const { ctrlKey, shiftKey, key, metaKey } = event
        const modifier = ctrlKey || metaKey

        // Don't handle shortcuts when typing in inputs
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return
        }

        // Find matching shortcut
        Object.values(shortcuts).flat().forEach(shortcut => {
            const parts = shortcut.combo.split('+')
            const hasCtrl = parts.includes('Ctrl')
            const hasShift = parts.includes('Shift')
            const mainKey = parts[parts.length - 1]

            if (
                (hasCtrl === modifier) &&
                (hasShift === shiftKey) &&
                (key === mainKey || key.toLowerCase() === mainKey.toLowerCase())
            ) {
                event.preventDefault()
                shortcut.action?.()
            }
        })
    }, [shortcuts])

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            return () => document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, handleKeyDown])

    const executeShortcut = (shortcut) => {
        shortcut.action?.()
        onClose?.()
    }

    if (!isOpen) return null

    return (
        <div className={`keyboard-shortcuts ${className}`}>
            <div className="shortcuts-overlay" onClick={onClose} />

            <div className="shortcuts-panel">
                <div className="panel-header">
                    <div className="header-title">
                        <Keyboard size={24} />
                        <h2>Keyboard Shortcuts</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="search-section">
                    <div className="search-input-container">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search shortcuts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="shortcuts-content">
                    {!searchTerm && (
                        <div className="categories">
                            {categories.map(category => {
                                const Icon = category.icon
                                return (
                                    <button
                                        key={category.id}
                                        className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                                        onClick={() => setActiveCategory(category.id)}
                                    >
                                        <Icon size={16} />
                                        <span>{category.label}</span>
                                        <span className="shortcut-count">
                                            {shortcuts[category.id].length}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    <div className="shortcuts-list">
                        {Object.entries(filteredShortcuts).map(([category, items]) => (
                            <div key={category} className="shortcut-category">
                                {searchTerm && (
                                    <h3 className="category-title">
                                        {categories.find(c => c.id === category)?.label}
                                    </h3>
                                )}

                                <div className="shortcuts-grid">
                                    {items.map((shortcut, index) => (
                                        <div
                                            key={index}
                                            className={`shortcut-item ${shortcut.action ? 'clickable' : ''}`}
                                            onClick={() => shortcut.action && executeShortcut(shortcut)}
                                        >
                                            <div className="shortcut-combo">
                                                {shortcut.combo.split('+').map((key, keyIndex) => (
                                                    <React.Fragment key={keyIndex}>
                                                        <kbd className="key">{key}</kbd>
                                                        {keyIndex < shortcut.combo.split('+').length - 1 && (
                                                            <span className="plus">+</span>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            <div className="shortcut-description">
                                                {shortcut.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="panel-footer">
                    <div className="footer-tip">
                        <span className="tip-icon">💡</span>
                        <span>Press <kbd>Ctrl+?</kbd> anytime to open this panel</span>
                    </div>
                </div>
            </div>

            <style jsx="true">{`
        .keyboard-shortcuts {
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

        .shortcuts-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
        }

        .shortcuts-panel {
          position: relative;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          width: 100%;
          max-width: 900px;
          max-height: 80vh;
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

        .search-section {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 0.75rem 1rem;
        }

        .search-input-container svg {
          color: var(--theme-textSecondary);
        }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          color: var(--theme-text);
          font-size: 1rem;
          outline: none;
        }

        .search-input::placeholder {
          color: var(--theme-textSecondary);
        }

        .shortcuts-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .categories {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .category-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
        }

        .category-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--theme-text);
          transform: translateY(-1px);
        }

        .category-btn.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }

        .category-btn span:first-of-type {
          flex: 1;
          font-weight: 500;
        }

        .shortcut-count {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 24px;
          text-align: center;
        }

        .shortcut-category {
          margin-bottom: 2rem;
        }

        .category-title {
          color: var(--theme-text);
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .shortcuts-grid {
          display: grid;
          gap: 0.75rem;
        }

        .shortcut-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
        }

        .shortcut-item.clickable {
          cursor: pointer;
        }

        .shortcut-item.clickable:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .shortcut-combo {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-shrink: 0;
        }

        .key {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-sm);
          padding: 0.25rem 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--theme-text);
          min-width: 24px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .plus {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          margin: 0 0.25rem;
        }

        .shortcut-description {
          flex: 1;
          color: var(--theme-textSecondary);
          font-size: 0.9rem;
          margin-left: 1rem;
          text-align: left;
        }

        .panel-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .footer-tip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
        }

        .tip-icon {
          font-size: 1rem;
        }

        .footer-tip kbd {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-sm);
          padding: 0.125rem 0.375rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--theme-text);
        }

        @media (max-width: 768px) {
          .keyboard-shortcuts {
            padding: 1rem;
          }

          .panel-header {
            padding: 1.5rem;
          }

          .search-section {
            padding: 1rem 1.5rem;
          }

          .shortcuts-content {
            padding: 1.5rem;
          }

          .categories {
            grid-template-columns: 1fr;
          }

          .shortcut-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .shortcut-description {
            margin-left: 0;
          }
        }

        /* Scrollbar styling */
        .shortcuts-content::-webkit-scrollbar {
          width: 6px;
        }

        .shortcuts-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .shortcuts-content::-webkit-scrollbar-thumb {
          background: var(--theme-primary);
          border-radius: 3px;
        }

        .shortcuts-content::-webkit-scrollbar-thumb:hover {
          background: var(--theme-accent);
        }
      `}</style>
        </div>
    )
}

export default KeyboardShortcuts