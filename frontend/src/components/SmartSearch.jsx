import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Filter, X, Users, Calendar, Zap, TrendingUp } from 'lucide-react'

const SmartSearch = ({ 
  data = [], 
  onResults, 
  placeholder = "Search with AI...",
  searchFields = [],
  className = ""
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchHistory, setSearchHistory] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  // Smart search suggestions based on query patterns
  const smartSuggestions = useMemo(() => {
    if (!query || query.length < 2) return []

    const suggestions = []
    const lowerQuery = query.toLowerCase()

    // Natural language patterns
    const patterns = [
      {
        pattern: /show me|find|get|list/i,
        type: 'command',
        suggestions: [
          'Show me all managers',
          'Find backend developers',
          'List active projects',
          'Get team structure'
        ]
      },
      {
        pattern: /who|what|when|where|how/i,
        type: 'question',
        suggestions: [
          'Who reports to John?',
          'What projects are due this month?',
          'When does the sprint end?',
          'Where is the team located?'
        ]
      },
      {
        pattern: /team|squad|group/i,
        type: 'team',
        suggestions: [
          'Backend Team members',
          'Frontend Squad projects',
          'DevOps Group capacity'
        ]
      }
    ]

    // Add pattern-based suggestions
    patterns.forEach(({ pattern, type, suggestions: patternSuggestions }) => {
      if (pattern.test(query)) {
        patternSuggestions.forEach(suggestion => {
          if (suggestion.toLowerCase().includes(lowerQuery)) {
            suggestions.push({
              text: suggestion,
              type,
              icon: type === 'command' ? Zap : type === 'question' ? Search : Users
            })
          }
        })
      }
    })

    // Add field-based suggestions
    if (data.length > 0) {
      const sampleItem = data[0]
      Object.keys(sampleItem).forEach(field => {
        if (field.toLowerCase().includes(lowerQuery)) {
          suggestions.push({
            text: `Search by ${field}`,
            type: 'field',
            icon: Filter,
            field
          })
        }
      })

      // Add value-based suggestions
      const uniqueValues = new Set()
      data.forEach(item => {
        Object.values(item).forEach(value => {
          if (typeof value === 'string' && 
              value.toLowerCase().includes(lowerQuery) && 
              value.length < 50) {
            uniqueValues.add(value)
          }
        })
      })

      Array.from(uniqueValues).slice(0, 5).forEach(value => {
        suggestions.push({
          text: value,
          type: 'value',
          icon: Search
        })
      })
    }

    return suggestions.slice(0, 8)
  }, [query, data])

  // Perform smart search
  const performSearch = useMemo(() => {
    if (!query.trim()) return data

    setIsLoading(true)
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
    
    const results = data.filter(item => {
      // Convert item to searchable text
      const searchableText = Object.values(item)
        .filter(value => value != null)
        .join(' ')
        .toLowerCase()

      // Check if all search terms are present (AND logic)
      return searchTerms.every(term => {
        // Fuzzy matching for typos
        return searchableText.includes(term) || 
               searchableText.includes(term.slice(0, -1)) || // Remove last char
               searchableText.includes(term + 's') || // Add plural
               searchableText.includes(term.slice(1)) // Remove first char
      })
    })

    // Score and sort results by relevance
    const scoredResults = results.map(item => {
      let score = 0
      const itemText = Object.values(item).join(' ').toLowerCase()
      
      searchTerms.forEach(term => {
        // Exact matches get higher score
        if (itemText.includes(term)) score += 10
        // Partial matches get lower score
        if (itemText.includes(term.slice(0, -1))) score += 5
      })

      return { ...item, _searchScore: score }
    })

    setTimeout(() => setIsLoading(false), 300) // Simulate AI processing

    return scoredResults.sort((a, b) => b._searchScore - a._searchScore)
  }, [query, data])

  useEffect(() => {
    onResults?.(performSearch)
  }, [performSearch, onResults])

  useEffect(() => {
    // Load search history from localStorage
    const history = JSON.parse(localStorage.getItem('search-history') || '[]')
    setSearchHistory(history.slice(0, 5))
  }, [])

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery)
    
    // Add to search history
    if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
      const newHistory = [searchQuery, ...searchHistory].slice(0, 5)
      setSearchHistory(newHistory)
      localStorage.setItem('search-history', JSON.stringify(newHistory))
    }
    
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e) => {
    const totalItems = smartSuggestions.length + searchHistory.length
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          const allItems = [...smartSuggestions, ...searchHistory.map(h => ({ text: h, type: 'history' }))]
          handleSearch(allItems[selectedIndex].text)
        } else {
          handleSearch(query)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const clearSearch = () => {
    setQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div className={`smart-search ${className}`}>
      <div className="search-input-container">
        <div className="search-icon">
          <Search size={20} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
        />

        {query && (
          <button 
            className="clear-button"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-dot"></div>
          </div>
        )}
      </div>

      {isOpen && (smartSuggestions.length > 0 || searchHistory.length > 0) && (
        <>
          <div 
            className="search-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="search-dropdown" ref={resultsRef}>
            {smartSuggestions.length > 0 && (
              <div className="suggestion-group">
                <div className="suggestion-header">
                  <Zap size={14} />
                  AI Suggestions
                </div>
                {smartSuggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon
                  return (
                    <button
                      key={`suggestion-${index}`}
                      className={`suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
                      onClick={() => handleSearch(suggestion.text)}
                    >
                      <div className="suggestion-icon">
                        <Icon size={16} />
                      </div>
                      <div className="suggestion-content">
                        <div className="suggestion-text">{suggestion.text}</div>
                        <div className="suggestion-type">{suggestion.type}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {searchHistory.length > 0 && (
              <div className="suggestion-group">
                <div className="suggestion-header">
                  <TrendingUp size={14} />
                  Recent Searches
                </div>
                {searchHistory.map((historyItem, index) => (
                  <button
                    key={`history-${index}`}
                    className={`suggestion-item ${selectedIndex === smartSuggestions.length + index ? 'selected' : ''}`}
                    onClick={() => handleSearch(historyItem)}
                  >
                    <div className="suggestion-icon">
                      <Search size={16} />
                    </div>
                    <div className="suggestion-content">
                      <div className="suggestion-text">{historyItem}</div>
                      <div className="suggestion-type">history</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style jsx="true">{`
        .smart-search {
          position: relative;
          width: 100%;
          max-width: 500px;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--theme-textSecondary);
          z-index: 1;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          color: var(--theme-text);
          font-size: 1rem;
          transition: all var(--transition-normal);
          outline: none;
          position: relative;
        }

        .search-input:focus {
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 8px 32px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        .search-input::placeholder {
          color: var(--theme-textSecondary);
        }

        .clear-button {
          position: absolute;
          right: 3rem;
          background: none;
          border: none;
          color: var(--theme-textSecondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .clear-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .loading-indicator {
          position: absolute;
          right: 1rem;
        }

        .loading-dot {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid var(--theme-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .search-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 998;
        }

        .search-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          right: 0;
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          z-index: 999;
          max-height: 400px;
          overflow-y: auto;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .suggestion-group {
          padding: 0.5rem;
        }

        .suggestion-group:not(:last-child) {
          border-bottom: 1px solid var(--glass-border);
        }

        .suggestion-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          color: var(--theme-textSecondary);
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem;
          background: none;
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .suggestion-item:hover,
        .suggestion-item.selected {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-1px);
        }

        .suggestion-item.selected {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .suggestion-icon {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--theme-primary);
        }

        .suggestion-content {
          flex: 1;
          min-width: 0;
        }

        .suggestion-text {
          color: var(--theme-text);
          font-weight: 500;
          margin-bottom: 0.25rem;
          word-wrap: break-word;
        }

        .suggestion-type {
          color: var(--theme-textSecondary);
          font-size: 0.75rem;
          text-transform: capitalize;
        }

        @media (max-width: 768px) {
          .search-dropdown {
            left: -1rem;
            right: -1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default SmartSearch