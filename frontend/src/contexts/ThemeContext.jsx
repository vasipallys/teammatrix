import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

const themes = {
  dark: {
    name: 'Dark',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#06b6d4',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#cbd5e1',
      border: 'rgba(255, 255, 255, 0.1)',
      glass: 'rgba(255, 255, 255, 0.05)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
      secondary: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
      mesh: `radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.3) 0%, transparent 50%),
             radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)`,
    }
  },
  light: {
    name: 'Light',
    colors: {
      primary: '#2563eb',
      secondary: '#475569',
      accent: '#0891b2',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#475569',
      border: 'rgba(0, 0, 0, 0.1)',
      glass: 'rgba(255, 255, 255, 0.8)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      secondary: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      mesh: `radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.2) 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(8, 145, 178, 0.2) 0%, transparent 50%),
             radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)`,
    }
  },
  cyberpunk: {
    name: 'Cyberpunk',
    colors: {
      primary: '#ff0080',
      secondary: '#00ff80',
      accent: '#80ff00',
      background: '#000011',
      surface: '#110022',
      text: '#ffffff',
      textSecondary: '#cccccc',
      border: 'rgba(255, 0, 128, 0.3)',
      glass: 'rgba(255, 0, 128, 0.1)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #ff0080 0%, #8000ff 100%)',
      secondary: 'linear-gradient(135deg, #00ff80 0%, #0080ff 100%)',
      mesh: `radial-gradient(circle at 20% 80%, rgba(255, 0, 128, 0.4) 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(0, 255, 128, 0.4) 0%, transparent 50%),
             radial-gradient(circle at 40% 40%, rgba(128, 255, 0, 0.4) 0%, transparent 50%)`,
    }
  },
  ocean: {
    name: 'Ocean',
    colors: {
      primary: '#0ea5e9',
      secondary: '#0f766e',
      accent: '#06b6d4',
      background: '#0c1821',
      surface: '#1e3a5f',
      text: '#f0f9ff',
      textSecondary: '#bae6fd',
      border: 'rgba(14, 165, 233, 0.2)',
      glass: 'rgba(14, 165, 233, 0.1)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
      secondary: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
      mesh: `radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.3) 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(15, 118, 110, 0.3) 0%, transparent 50%),
             radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)`,
    }
  },
  forest: {
    name: 'Forest',
    colors: {
      primary: '#059669',
      secondary: '#0f766e',
      accent: '#84cc16',
      background: '#0c1f0c',
      surface: '#1a3d1a',
      text: '#f0fdf4',
      textSecondary: '#bbf7d0',
      border: 'rgba(5, 150, 105, 0.2)',
      glass: 'rgba(5, 150, 105, 0.1)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      secondary: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
      mesh: `radial-gradient(circle at 20% 80%, rgba(5, 150, 105, 0.3) 0%, transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(132, 204, 22, 0.3) 0%, transparent 50%),
             radial-gradient(circle at 40% 40%, rgba(15, 118, 110, 0.3) 0%, transparent 50%)`,
    }
  }
}

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('dark')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme')
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const theme = themes[currentTheme]
    const root = document.documentElement

    // Apply theme colors as CSS custom properties with proper fallbacks
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })

    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--theme-gradient-${key}`, value)
    })

    // Apply glass morphism properties based on theme
    const isLightTheme = currentTheme === 'light'
    root.style.setProperty('--glass-bg', isLightTheme ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.05)')
    root.style.setProperty('--glass-border', isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)')
    root.style.setProperty('--glass-backdrop', 'blur(16px)')
    root.style.setProperty('--glass-shadow', isLightTheme ? '0 8px 32px rgba(0, 0, 0, 0.1)' : '0 8px 32px rgba(0, 0, 0, 0.3)')

    // Apply radius variables
    root.style.setProperty('--radius-sm', '0.375rem')
    root.style.setProperty('--radius-md', '0.5rem')
    root.style.setProperty('--radius-lg', '0.75rem')
    root.style.setProperty('--radius-xl', '1rem')
    root.style.setProperty('--radius-2xl', '1.5rem')
    root.style.setProperty('--radius-full', '9999px')

    // Apply transition variables
    root.style.setProperty('--transition-fast', '150ms cubic-bezier(0.4, 0, 0.2, 1)')
    root.style.setProperty('--transition-normal', '300ms cubic-bezier(0.4, 0, 0.2, 1)')
    root.style.setProperty('--transition-slow', '500ms cubic-bezier(0.4, 0, 0.2, 1)')

    // Apply font variables
    root.style.setProperty('--font-primary', "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
    root.style.setProperty('--font-display', 'var(--font-primary)')
    root.style.setProperty('--font-mono', "'SFMono-Regular', Consolas, 'Liberation Mono', monospace")

    // Force re-render of all components by adding a class to body
    document.body.className = `theme-${currentTheme}`

    // Save to localStorage
    localStorage.setItem('app-theme', currentTheme)
  }, [currentTheme])

  const changeTheme = async (themeName) => {
    if (themeName === currentTheme || isAnimating) return

    setIsAnimating(true)
    
    // Add transition class to body
    document.body.classList.add('theme-transitioning')
    
    // Small delay for smooth transition
    setTimeout(() => {
      setCurrentTheme(themeName)
      
      setTimeout(() => {
        document.body.classList.remove('theme-transitioning')
        setIsAnimating(false)
      }, 300)
    }, 50)
  }

  const value = {
    currentTheme,
    theme: themes[currentTheme],
    themes: Object.keys(themes),
    changeTheme,
    isAnimating
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
