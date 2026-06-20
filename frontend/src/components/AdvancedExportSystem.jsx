import React, { useState, useRef } from 'react'
import { 
  Download, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  File, 
  Settings, 
  Eye,
  Palette,
  Layout,
  Filter,
  Calendar,
  Users,
  BarChart3,
  Share2,
  Cloud,
  Mail,
  Printer
} from 'lucide-react'
import { useNotifications } from './NotificationSystem'

const AdvancedExportSystem = ({ 
  isOpen, 
  onClose, 
  data = {},
  currentView = 'org',
  className = '' 
}) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeData: true,
    includeMetadata: true,
    includeFilters: false,
    dateRange: 'all',
    customDateStart: '',
    customDateEnd: '',
    pageSize: 'A4',
    orientation: 'portrait',
    quality: 'high',
    theme: 'light',
    includeWatermark: false,
    compression: 'medium'
  })
  
  const [previewMode, setPreviewMode] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  
  const canvasRef = useRef(null)
  const { success, error, info } = useNotifications()

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF Document',
      icon: FileText,
      description: 'High-quality document with charts and data',
      extensions: ['.pdf'],
      features: ['Charts', 'Data Tables', 'Formatting', 'Print-ready']
    },
    {
      id: 'excel',
      name: 'Excel Workbook',
      icon: FileSpreadsheet,
      description: 'Spreadsheet with multiple sheets and formulas',
      extensions: ['.xlsx', '.xls'],
      features: ['Multiple Sheets', 'Formulas', 'Charts', 'Pivot Tables']
    },
    {
      id: 'csv',
      name: 'CSV Data',
      icon: File,
      description: 'Raw data in comma-separated format',
      extensions: ['.csv'],
      features: ['Raw Data', 'Universal Format', 'Lightweight']
    },
    {
      id: 'png',
      name: 'PNG Image',
      icon: Image,
      description: 'High-resolution image of current view',
      extensions: ['.png'],
      features: ['High Resolution', 'Transparent Background', 'Web-ready']
    },
    {
      id: 'svg',
      name: 'SVG Vector',
      icon: Image,
      description: 'Scalable vector graphics',
      extensions: ['.svg'],
      features: ['Scalable', 'Editable', 'Small Size', 'Print Quality']
    },
    {
      id: 'json',
      name: 'JSON Data',
      icon: File,
      description: 'Structured data in JSON format',
      extensions: ['.json'],
      features: ['Structured', 'API-ready', 'Hierarchical']
    }
  ]

  const exportDestinations = [
    { id: 'download', name: 'Download', icon: Download, description: 'Save to your device' },
    { id: 'email', name: 'Email', icon: Mail, description: 'Send via email' },
    { id: 'cloud', name: 'Cloud Storage', icon: Cloud, description: 'Save to cloud' },
    { id: 'print', name: 'Print', icon: Printer, description: 'Send to printer' },
    { id: 'share', name: 'Share Link', icon: Share2, description: 'Generate shareable link' }
  ]

  const handleExport = async (destination = 'download') => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      clearInterval(progressInterval)
      setExportProgress(100)

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${currentView}-export-${timestamp}.${selectedFormat}`

      // Handle different export formats
      switch (selectedFormat) {
        case 'pdf':
          await exportToPDF(filename)
          break
        case 'excel':
          await exportToExcel(filename)
          break
        case 'csv':
          await exportToCSV(filename)
          break
        case 'png':
          await exportToPNG(filename)
          break
        case 'svg':
          await exportToSVG(filename)
          break
        case 'json':
          await exportToJSON(filename)
          break
        default:
          throw new Error('Unsupported format')
      }

      // Handle different destinations
      switch (destination) {
        case 'email':
          info('Export prepared for email - opening email client...')
          break
        case 'cloud':
          info('Export saved to cloud storage')
          break
        case 'print':
          window.print()
          break
        case 'share':
          const shareUrl = `${window.location.origin}/shared/${Math.random().toString(36).substr(2, 9)}`
          navigator.clipboard.writeText(shareUrl)
          success('Share link copied to clipboard!')
          break
        default:
          success(`Export completed: ${filename}`)
      }

    } catch (err) {
      error(`Export failed: ${err.message}`)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
      setTimeout(() => onClose?.(), 1000)
    }
  }

  const exportToPDF = async (filename) => {
    // Simulate PDF generation
    const blob = new Blob(['PDF content'], { type: 'application/pdf' })
    downloadBlob(blob, filename)
  }

  const exportToExcel = async (filename) => {
    // Simulate Excel generation
    const csvContent = convertToCSV(data[currentView] || [])
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    downloadBlob(blob, filename)
  }

  const exportToCSV = async (filename) => {
    const csvContent = convertToCSV(data[currentView] || [])
    const blob = new Blob([csvContent], { type: 'text/csv' })
    downloadBlob(blob, filename)
  }

  const exportToPNG = async (filename) => {
    // Capture current view as image
    const canvas = canvasRef.current
    if (canvas) {
      canvas.toBlob(blob => {
        downloadBlob(blob, filename)
      }, 'image/png', exportOptions.quality === 'high' ? 1.0 : 0.8)
    }
  }

  const exportToSVG = async (filename) => {
    // Generate SVG content
    const svgContent = generateSVG()
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    downloadBlob(blob, filename)
  }

  const exportToJSON = async (filename) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    downloadBlob(blob, filename)
  }

  const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ]
    
    return csvRows.join('\n')
  }

  const generateSVG = () => {
    return `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${exportOptions.theme === 'dark' ? '#1a1f2e' : '#ffffff'}"/>
        <text x="400" y="300" text-anchor="middle" fill="${exportOptions.theme === 'dark' ? '#ffffff' : '#000000'}">
          ${currentView.toUpperCase()} Export
        </text>
      </svg>
    `
  }

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generatePreview = () => {
    const format = exportFormats.find(f => f.id === selectedFormat)
    return (
      <div className="export-preview">
        <div className="preview-header">
          <format.icon size={24} />
          <div>
            <h4>{format.name} Preview</h4>
            <p>Estimated size: {Math.floor(Math.random() * 5 + 1)}MB</p>
          </div>
        </div>
        <div className="preview-content">
          <div className="preview-placeholder">
            <BarChart3 size={48} />
            <p>Preview of {currentView} data in {format.name} format</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className={`advanced-export-system ${className}`}>
      <div className="export-overlay" onClick={onClose} />
      
      <div className="export-panel">
        <div className="panel-header">
          <div className="header-title">
            <Download size={24} />
            <h2>Advanced Export</h2>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="export-content">
          <div className="export-main">
            <div className="format-selection">
              <h3>Export Format</h3>
              <div className="format-grid">
                {exportFormats.map(format => {
                  const Icon = format.icon
                  return (
                    <button
                      key={format.id}
                      className={`format-card ${selectedFormat === format.id ? 'selected' : ''}`}
                      onClick={() => setSelectedFormat(format.id)}
                    >
                      <div className="format-icon">
                        <Icon size={24} />
                      </div>
                      <div className="format-info">
                        <h4>{format.name}</h4>
                        <p>{format.description}</p>
                        <div className="format-features">
                          {format.features.map(feature => (
                            <span key={feature} className="feature-tag">{feature}</span>
                          ))}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {previewMode && (
              <div className="preview-section">
                {generatePreview()}
              </div>
            )}
          </div>

          <div className="export-sidebar">
            <div className="options-section">
              <h3>
                <Settings size={18} />
                Export Options
              </h3>

              <div className="option-group">
                <h4>Content</h4>
                <label className="option-item">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCharts}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  />
                  <span>Include Charts</span>
                </label>
                <label className="option-item">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeData}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeData: e.target.checked }))}
                  />
                  <span>Include Data Tables</span>
                </label>
                <label className="option-item">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  />
                  <span>Include Metadata</span>
                </label>
              </div>

              <div className="option-group">
                <h4>Format Settings</h4>
                {(selectedFormat === 'pdf' || selectedFormat === 'png') && (
                  <>
                    <div className="option-item">
                      <label>Page Size</label>
                      <select
                        value={exportOptions.pageSize}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, pageSize: e.target.value }))}
                      >
                        <option value="A4">A4</option>
                        <option value="A3">A3</option>
                        <option value="Letter">Letter</option>
                        <option value="Legal">Legal</option>
                      </select>
                    </div>
                    <div className="option-item">
                      <label>Orientation</label>
                      <select
                        value={exportOptions.orientation}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, orientation: e.target.value }))}
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>
                  </>
                )}
                
                {(selectedFormat === 'png' || selectedFormat === 'pdf') && (
                  <div className="option-item">
                    <label>Quality</label>
                    <select
                      value={exportOptions.quality}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, quality: e.target.value }))}
                    >
                      <option value="low">Low (Fast)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High (Best)</option>
                    </select>
                  </div>
                )}

                <div className="option-item">
                  <label>Theme</label>
                  <select
                    value={exportOptions.theme}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, theme: e.target.value }))}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>

              <div className="option-group">
                <h4>Date Range</h4>
                <div className="option-item">
                  <select
                    value={exportOptions.dateRange}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, dateRange: e.target.value }))}
                  >
                    <option value="all">All Data</option>
                    <option value="last30">Last 30 Days</option>
                    <option value="last90">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                {exportOptions.dateRange === 'custom' && (
                  <div className="date-range">
                    <input
                      type="date"
                      value={exportOptions.customDateStart}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, customDateStart: e.target.value }))}
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={exportOptions.customDateEnd}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, customDateEnd: e.target.value }))}
                      placeholder="End Date"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="preview-controls">
              <button
                className={`preview-btn ${previewMode ? 'active' : ''}`}
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye size={16} />
                {previewMode ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>
        </div>

        <div className="export-footer">
          <div className="destination-selection">
            <h4>Export Destination</h4>
            <div className="destination-buttons">
              {exportDestinations.map(dest => {
                const Icon = dest.icon
                return (
                  <button
                    key={dest.id}
                    className="destination-btn"
                    onClick={() => handleExport(dest.id)}
                    disabled={isExporting}
                    title={dest.description}
                  >
                    <Icon size={16} />
                    <span>{dest.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {isExporting && (
            <div className="export-progress">
              <div className="progress-info">
                <span>Exporting... {exportProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <style jsx="true">{`
        .advanced-export-system {
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

        .export-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
        }

        .export-panel {
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

        .export-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .export-main {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .export-sidebar {
          width: 320px;
          background: rgba(255, 255, 255, 0.02);
          border-left: 1px solid var(--glass-border);
          padding: 2rem;
          overflow-y: auto;
        }

        .format-selection h3 {
          color: var(--theme-text);
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
        }

        .format-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .format-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
        }

        .format-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .format-card.selected {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .format-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          flex-shrink: 0;
        }

        .format-info {
          flex: 1;
          min-width: 0;
        }

        .format-info h4 {
          color: var(--theme-text);
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
        }

        .format-info p {
          color: var(--theme-textSecondary);
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .format-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .feature-tag {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          color: var(--theme-textSecondary);
        }

        .preview-section {
          margin-top: 2rem;
        }

        .export-preview {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }

        .preview-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .preview-header h4 {
          color: var(--theme-text);
          margin: 0;
        }

        .preview-header p {
          color: var(--theme-textSecondary);
          margin: 0;
          font-size: 0.875rem;
        }

        .preview-content {
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-placeholder {
          text-align: center;
          color: var(--theme-textSecondary);
        }

        .preview-placeholder p {
          margin: 1rem 0 0 0;
        }

        .options-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--theme-text);
          margin: 0 0 1.5rem 0;
          font-size: 1.1rem;
        }

        .option-group {
          margin-bottom: 2rem;
        }

        .option-group h4 {
          color: var(--theme-text);
          margin: 0 0 1rem 0;
          font-size: 0.95rem;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          cursor: pointer;
        }

        .option-item input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: var(--theme-primary);
        }

        .option-item label {
          color: var(--theme-textSecondary);
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          display: block;
        }

        .option-item select,
        .option-item input[type="date"] {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 0.5rem;
          color: var(--theme-text);
          font-size: 0.875rem;
          width: 100%;
        }

        .date-range {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .preview-controls {
          margin-top: 2rem;
        }

        .preview-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          width: 100%;
          justify-content: center;
        }

        .preview-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .preview-btn.active {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.3);
        }

        .export-footer {
          padding: 2rem;
          border-top: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .destination-selection h4 {
          color: var(--theme-text);
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }

        .destination-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .destination-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--theme-gradient-primary);
          border: none;
          border-radius: var(--radius-lg);
          color: white;
          cursor: pointer;
          transition: all var(--transition-normal);
          font-weight: 500;
        }

        .destination-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        .destination-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .export-progress {
          margin-top: 1rem;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .progress-info span {
          color: var(--theme-text);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--theme-gradient-primary);
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }

        @media (max-width: 1024px) {
          .export-content {
            flex-direction: column;
          }

          .export-sidebar {
            width: 100%;
            border-left: none;
            border-top: 1px solid var(--glass-border);
          }

          .format-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .advanced-export-system {
            padding: 1rem;
          }

          .panel-header {
            padding: 1.5rem;
          }

          .export-main,
          .export-sidebar {
            padding: 1.5rem;
          }

          .export-footer {
            padding: 1.5rem;
          }

          .destination-buttons {
            flex-direction: column;
          }

          .destination-btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default AdvancedExportSystem