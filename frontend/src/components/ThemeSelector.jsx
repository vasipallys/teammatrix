import React, { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Palette, Check, Moon, Sun, Zap, Waves, TreePine, X } from 'lucide-react'

const ThemeSelector = () => {
  const { currentTheme, themes, changeTheme, isAnimating } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themeIcons = {
    dark: Moon,
    light: Sun,
    cyberpunk: Zap,
    ocean: Waves,
    forest: TreePine
  }

  const themeColors = {
    dark: '#3b82f6',
    light: '#2563eb',
    cyberpunk: '#ff0080',
    ocean: '#0ea5e9',
    forest: '#059669'
  }

  const themeDescriptions = {
    dark: 'Classic dark theme with blue accents',
    light: 'Clean light theme for bright environments',
    cyberpunk: 'Neon colors with futuristic vibes',
    ocean: 'Calming blues inspired by the sea',
    forest: 'Natural greens for a peaceful feel'
  }

  return (
    <div className="theme-selector">
      <button
        className="theme-toggle"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isAnimating}
        aria-label="Choose application theme"
        aria-expanded={isOpen}
      >
        <Palette size={18} />
        <span>Theme</span>
        {isAnimating && <div className="loading-spinner" />}
      </button>

      {isOpen && (
        <>
          <div 
            className="theme-overlay" 
            onClick={() => setIsOpen(false)}
          />
          <div className="theme-dropdown glass">
            <div className="theme-dropdown-header">
              <h3>Choose Theme</h3>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close theme picker"
              >
                <X size={17} />
              </button>
            </div>
            
            <div className="theme-options">
              {themes.map((themeName) => {
                const Icon = themeIcons[themeName]
                const isActive = currentTheme === themeName
                
                return (
                  <button
                    key={themeName}
                    className={`theme-option ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      changeTheme(themeName)
                      setIsOpen(false)
                    }}
                    disabled={isAnimating}
                  >
                    <div className="theme-option-visual">
                      <div 
                        className="theme-preview"
                        style={{ 
                          background: `linear-gradient(135deg, ${themeColors[themeName]}, ${themeColors[themeName]}80)`
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      {isActive && (
                        <div className="active-indicator">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                    
                    <div className="theme-option-info">
                      <div className="theme-name">
                        {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                      </div>
                      <div className="theme-description">
                        {themeDescriptions[themeName]}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      <style jsx="true">{`
        .theme-selector {
          position: relative;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.8rem;
          font-weight: 500;
          min-height: 36px;
          position: relative;
          overflow: hidden;
        }

        .theme-toggle::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left var(--transition-slow);
        }

        .theme-toggle:hover::before {
          left: 100%;
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .theme-toggle:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid var(--theme-textSecondary);
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .theme-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }

        .theme-dropdown {
          position: absolute;
          top: calc(100% + var(--space-sm));
          right: 0;
          min-width: 320px;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          z-index: 1000;
          overflow: hidden;
        }

        .theme-dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .theme-dropdown-header h3 {
          color: var(--theme-text);
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--theme-textSecondary);
          font-size: 1.5rem;
          cursor: pointer;
          transition: color var(--transition-normal);
          padding: var(--space-xs);
          border-radius: var(--radius-md);
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: var(--theme-text);
          background: rgba(255, 255, 255, 0.1);
        }

        .theme-options {
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .theme-option {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .theme-option::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          transition: left var(--transition-slow);
        }

        .theme-option:hover::before {
          left: 100%;
        }

        .theme-option:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .theme-option.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
        }

        .theme-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .theme-option-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .theme-preview {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .active-indicator {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 20px;
          height: 20px;
          background: var(--theme-primary);
          border: 2px solid var(--theme-surface);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
        }

        .theme-option-info {
          flex: 1;
        }

        .theme-name {
          color: var(--theme-text);
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: var(--space-xs);
        }

        .theme-description {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          line-height: 1.4;
        }

        @media (max-width: 480px) {
          .theme-dropdown {
            left: 0;
            right: 0;
            min-width: auto;
            margin: 0 var(--space-md);
          }

          .theme-option {
            flex-direction: column;
            text-align: center;
            gap: var(--space-sm);
          }
        }
      `}</style>
    </div>
  )
}

export default ThemeSelector
