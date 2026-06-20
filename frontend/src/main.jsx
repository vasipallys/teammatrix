import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/design-system.css'
import './styles/App.css'
import './styles/app-shell.css'

// Initialize theme on app start
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('app-theme') || 'dark'
  document.body.className = `theme-${savedTheme}`
}

initializeTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
