import React, { useState } from 'react'
import { 
  HelpCircle, 
  Book, 
  Video, 
  MessageCircle, 
  Search, 
  Lightbulb,
  Keyboard,
  Users,
  Download,
  Settings,
  Zap,
  ChevronRight,
  ExternalLink,
  Database,
  BarChart3
} from 'lucide-react'

const HelpSystem = ({ isOpen, onClose, className = '' }) => {
  const [activeCategory, setActiveCategory] = useState('getting-started')
  const [searchTerm, setSearchTerm] = useState('')

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Lightbulb,
      articles: [
        {
          title: 'Welcome to NextGen Org Visualizer',
          content: 'Learn the basics of navigating and using the application.',
          tags: ['basics', 'introduction']
        },
        {
          title: 'Uploading Your First Dataset',
          content: 'Step-by-step guide to importing organization and work plan data.',
          tags: ['data', 'upload', 'import']
        },
        {
          title: 'Understanding the Dashboard',
          content: 'Overview of the main interface and navigation.',
          tags: ['dashboard', 'navigation']
        }
      ]
    },
    {
      id: 'data-management',
      title: 'Data Management',
      icon: Database,
      articles: [
        {
          title: 'Supported File Formats',
          content: 'CSV, Excel, and JSON formats with required column structures.',
          tags: ['formats', 'csv', 'excel']
        },
        {
          title: 'LDAP Integration',
          content: 'Connect to your LDAP server for automatic data synchronization.',
          tags: ['ldap', 'sync', 'integration']
        },
        {
          title: 'Data Validation and Cleanup',
          content: 'Ensure data quality with built-in validation tools.',
          tags: ['validation', 'cleanup', 'quality']
        }
      ]
    },
    {
      id: 'visualizations',
      title: 'Visualizations',
      icon: BarChart3,
      articles: [
        {
          title: 'Organization Chart Types',
          content: 'Sunburst, treemap, and tree view options for hierarchy visualization.',
          tags: ['charts', 'hierarchy', 'visualization']
        },
        {
          title: 'Work Plan Timeline',
          content: 'Interactive Gantt charts for project planning and tracking.',
          tags: ['gantt', 'timeline', 'projects']
        },
        {
          title: 'Customizing Colors and Themes',
          content: 'Personalize your visualizations with custom color schemes.',
          tags: ['colors', 'themes', 'customization']
        }
      ]
    },
    {
      id: 'collaboration',
      title: 'Collaboration',
      icon: Users,
      articles: [
        {
          title: 'Real-time Collaboration',
          content: 'Work together with live cursors, chat, and video calls.',
          tags: ['collaboration', 'real-time', 'chat']
        },
        {
          title: 'Sharing and Permissions',
          content: 'Control who can view and edit your data.',
          tags: ['sharing', 'permissions', 'access']
        },
        {
          title: 'Video Conferencing',
          content: 'Built-in video calls for team discussions.',
          tags: ['video', 'calls', 'meetings']
        }
      ]
    },
    {
      id: 'export-sharing',
      title: 'Export & Sharing',
      icon: Download,
      articles: [
        {
          title: 'Export Formats',
          content: 'PDF, Excel, CSV, PNG, SVG, and JSON export options.',
          tags: ['export', 'pdf', 'excel', 'formats']
        },
        {
          title: 'Advanced Export Settings',
          content: 'Customize page size, quality, and content inclusion.',
          tags: ['export', 'settings', 'customization']
        },
        {
          title: 'Sharing Links',
          content: 'Generate secure links for external sharing.',
          tags: ['sharing', 'links', 'security']
        }
      ]
    },
    {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts',
      icon: Keyboard,
      articles: [
        {
          title: 'Navigation Shortcuts',
          content: 'Quickly switch between tabs and views.',
          tags: ['shortcuts', 'navigation', 'productivity']
        },
        {
          title: 'Data Operations',
          content: 'Keyboard shortcuts for common data operations.',
          tags: ['shortcuts', 'data', 'operations']
        },
        {
          title: 'Advanced Shortcuts',
          content: 'Power user shortcuts for maximum efficiency.',
          tags: ['shortcuts', 'advanced', 'power-user']
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: Settings,
      articles: [
        {
          title: 'Common Issues',
          content: 'Solutions to frequently encountered problems.',
          tags: ['troubleshooting', 'issues', 'problems']
        },
        {
          title: 'Performance Optimization',
          content: 'Tips for better performance with large datasets.',
          tags: ['performance', 'optimization', 'speed']
        },
        {
          title: 'Browser Compatibility',
          content: 'Supported browsers and known limitations.',
          tags: ['browser', 'compatibility', 'support']
        }
      ]
    }
  ]

  const quickActions = [
    {
      title: 'Watch Tutorial Videos',
      description: 'Step-by-step video guides',
      icon: Video,
      action: () => window.open('https://example.com/tutorials', '_blank')
    },
    {
      title: 'Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      icon: Keyboard,
      action: () => {
        onClose()
        // Trigger keyboard shortcuts modal
      }
    },
    {
      title: 'Contact Support',
      description: 'Get help from our team',
      icon: MessageCircle,
      action: () => window.open('mailto:support@example.com', '_blank')
    },
    {
      title: 'Feature Requests',
      description: 'Suggest new features',
      icon: Lightbulb,
      action: () => window.open('https://example.com/feedback', '_blank')
    }
  ]

  const filteredArticles = searchTerm
    ? helpCategories.flatMap(category =>
        category.articles
          .filter(article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map(article => ({ ...article, category: category.title }))
      )
    : helpCategories.find(cat => cat.id === activeCategory)?.articles || []

  if (!isOpen) return null

  return (
    <div className={`help-system ${className}`}>
      <div className="help-overlay" onClick={onClose} />
      
      <div className="help-panel">
        <div className="panel-header">
          <div className="header-title">
            <HelpCircle size={24} />
            <h2>Help & Documentation</h2>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="search-section">
          <div className="search-container">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="help-content">
          {!searchTerm && (
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={index}
                      className="action-card"
                      onClick={action.action}
                    >
                      <div className="action-icon">
                        <Icon size={20} />
                      </div>
                      <div className="action-content">
                        <h4>{action.title}</h4>
                        <p>{action.description}</p>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="help-main">
            {!searchTerm && (
              <div className="categories-sidebar">
                <h3>Categories</h3>
                <div className="categories-list">
                  {helpCategories.map(category => {
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(category.id)}
                      >
                        <Icon size={18} />
                        <span>{category.title}</span>
                        <span className="article-count">{category.articles.length}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="articles-content">
              {searchTerm && (
                <div className="search-results-header">
                  <h3>Search Results ({filteredArticles.length})</h3>
                </div>
              )}

              <div className="articles-list">
                {filteredArticles.map((article, index) => (
                  <div key={index} className="article-card">
                    <div className="article-header">
                      <h4>{article.title}</h4>
                      {searchTerm && (
                        <span className="article-category">{article.category}</span>
                      )}
                    </div>
                    <p className="article-content">{article.content}</p>
                    <div className="article-tags">
                      {article.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                    <button className="read-more-btn">
                      Read More <ExternalLink size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {filteredArticles.length === 0 && searchTerm && (
                <div className="no-results">
                  <Search size={48} />
                  <h3>No Results Found</h3>
                  <p>Try different keywords or browse categories</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="help-footer">
          <div className="footer-links">
            <a href="#" className="footer-link">
              <Book size={14} />
              Documentation
            </a>
            <a href="#" className="footer-link">
              <Video size={14} />
              Video Tutorials
            </a>
            <a href="#" className="footer-link">
              <MessageCircle size={14} />
              Community Forum
            </a>
          </div>
          <div className="version-info">
            Version 2.0.0 • Last updated: Today
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .help-system {
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

        .help-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
        }

        .help-panel {
          position: relative;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          width: 100%;
          max-width: 1200px;
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

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 0.75rem 1rem;
        }

        .search-container svg {
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

        .help-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .quick-actions {
          margin-bottom: 2rem;
        }

        .quick-actions h3 {
          color: var(--theme-text);
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
        }

        .action-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .action-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          background: rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .action-content {
          flex: 1;
          min-width: 0;
        }

        .action-content h4 {
          color: var(--theme-text);
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
        }

        .action-content p {
          color: var(--theme-textSecondary);
          margin: 0;
          font-size: 0.875rem;
        }

        .help-main {
          display: flex;
          gap: 2rem;
        }

        .categories-sidebar {
          width: 250px;
          flex-shrink: 0;
        }

        .categories-sidebar h3 {
          color: var(--theme-text);
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
        }

        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .category-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
          border-radius: var(--radius-lg);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
        }

        .category-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--theme-text);
        }

        .category-item.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }

        .category-item span:first-of-type {
          flex: 1;
          font-weight: 500;
        }

        .article-count {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 24px;
          text-align: center;
        }

        .articles-content {
          flex: 1;
          min-width: 0;
        }

        .search-results-header h3 {
          color: var(--theme-text);
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
        }

        .articles-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .article-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          transition: all var(--transition-normal);
        }

        .article-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .article-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .article-header h4 {
          color: var(--theme-text);
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .article-category {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .article-content {
          color: var(--theme-textSecondary);
          margin: 0 0 1rem 0;
          line-height: 1.5;
        }

        .article-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .tag {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: var(--theme-textSecondary);
        }

        .read-more-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--theme-primary);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all var(--transition-normal);
        }

        .read-more-btn:hover {
          color: var(--theme-accent);
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4rem 2rem;
          color: var(--theme-textSecondary);
        }

        .no-results h3 {
          color: var(--theme-text);
          margin: 1rem 0 0.5rem 0;
        }

        .help-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-top: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .footer-links {
          display: flex;
          gap: 2rem;
        }

        .footer-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--theme-textSecondary);
          text-decoration: none;
          font-size: 0.875rem;
          transition: all var(--transition-normal);
        }

        .footer-link:hover {
          color: var(--theme-text);
        }

        .version-info {
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
        }

        @media (max-width: 1024px) {
          .help-main {
            flex-direction: column;
          }

          .categories-sidebar {
            width: 100%;
          }

          .categories-list {
            flex-direction: row;
            overflow-x: auto;
            gap: 1rem;
          }

          .category-item {
            min-width: 150px;
          }
        }

        @media (max-width: 768px) {
          .help-system {
            padding: 1rem;
          }

          .panel-header {
            padding: 1.5rem;
          }

          .search-section {
            padding: 1rem 1.5rem;
          }

          .help-content {
            padding: 1.5rem;
          }

          .help-footer {
            padding: 1rem 1.5rem;
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .footer-links {
            flex-direction: column;
            gap: 1rem;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default HelpSystem