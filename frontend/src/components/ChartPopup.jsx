import React, { useState, useEffect, useRef } from 'react'
import Plot from 'react-plotly.js'
import { X, Maximize2, Minimize2, Palette, Download, Settings } from 'lucide-react'
import ColorPicker from './ColorPicker'

const ChartPopup = ({ isOpen, onClose, chartType, data, title }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showColorPanel, setShowColorPanel] = useState(false)
  const [colorScheme, setColorScheme] = useState('default')
  const [customColors, setCustomColors] = useState({})
  const [colorBy, setColorBy] = useState('Job Function')
  const [chartView, setChartView] = useState(chartType === 'org' ? 'sunburst' : 'gantt')
  const [chartKey, setChartKey] = useState(0)
  const popupRef = useRef(null)

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isFullscreen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose, isFullscreen])

  useEffect(() => {
    if (isOpen) {
      // Force a slight delay to ensure CSS variables are computed
      setTimeout(() => {
        setChartKey(prev => prev + 1)
      }, 100)
    }
  }, [isOpen, chartView, colorBy, customColors])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      popupRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const getTreeLayout = (hierarchy) => {
    const nodes = []
    const edges = []
    let nodeId = 0

    // Calculate tree layout positions
    const levelWidth = 200
    const nodeHeight = 80
    const marginTop = 50

    const calculateNodePositions = (node, x = 0, y = 0, level = 0, parentId = null) => {
      const currentId = nodeId++

      // Add node
      nodes.push({
        id: currentId,
        x: x,
        y: y,
        name: node.name,
        data: node,
        level: level
      })

      // Add edge to parent
      if (parentId !== null) {
        edges.push({
          from: parentId,
          to: currentId
        })
      }

      // Process children
      if (node.children && node.children.length > 0) {
        const childWidth = levelWidth / node.children.length
        const startX = x - (levelWidth / 2) + (childWidth / 2)

        node.children.forEach((child, index) => {
          const childX = startX + (index * childWidth)
          const childY = y + nodeHeight + marginTop
          calculateNodePositions(child, childX, childY, level + 1, currentId)
        })
      }
    }

    // Process all root nodes
    const rootSpacing = 400
    hierarchy.forEach((root, index) => {
      const rootX = index * rootSpacing
      calculateNodePositions(root, rootX, 0)
    })

    return { nodes, edges }
  }

  const getOrgChartData = () => {
    if (!data || !data.hierarchy || data.hierarchy.length === 0) {
      console.warn('No hierarchy data available')
      return null
    }

    const flattenHierarchy = (hierarchy) => {
      const flat = []
      const processNode = (node, parent = '') => {
        flat.push({
          name: node.name || 'Unknown',
          parent: parent,
          staff_id: node.staff_id || 'N/A',
          job_function: node.job_function || 'N/A',
          rank: node.rank || 'N/A',
          squad1: node.squad1 || 'N/A',
          sub_platform: node.sub_platform || 'N/A',
          level: node.level || 0
        })
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => processNode(child, node.name))
        }
      }
      hierarchy.forEach(root => processNode(root))
      return flat
    }

    const colorMapping = {}
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach(employee => {
        const name = employee['Staff Name'] || employee['staff name'] || employee['Name'] || 'Unknown'
        const colorValue = employee[colorBy] || 'Unknown'
        colorMapping[name] = colorValue
      })
    }

    const uniqueValues = [...new Set(Object.values(colorMapping))]
    const defaultColors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#e91e63', '#00bcd4', '#ff9800', '#795548'
    ]

    // Handle different chart views
    if (chartView === 'tree') {
      const { nodes, edges } = getTreeLayout(data.hierarchy)

      // Create node trace
      const nodeTrace = {
        type: 'scatter',
        mode: 'markers+text',
        x: nodes.map(n => n.x),
        y: nodes.map(n => -n.y), // Negative to make tree grow downward
        text: nodes.map(n => n.name),
        textposition: 'bottom center',
        marker: {
          size: 40,
          color: nodes.map(n => {
            const value = colorMapping[n.name] || 'Unknown'
            if (customColors[value]) return customColors[value]
            const index = uniqueValues.indexOf(value)
            return defaultColors[index % defaultColors.length]
          }),
          line: {
            color: 'white',
            width: 2
          }
        },
        hoverinfo: 'text',
        hovertext: nodes.map(n =>
          `<b>${n.name}</b><br>` +
          `${colorBy}: ${colorMapping[n.name] || 'Unknown'}<br>` +
          `Staff ID: ${n.data.staff_id}<br>` +
          `Job Function: ${n.data.job_function}<br>` +
          `Rank: ${n.data.rank}<br>` +
          `Squad: ${n.data.squad1}`
        )
      }

      // Create edge traces
      const edgeTraces = edges.map(edge => {
        const fromNode = nodes.find(n => n.id === edge.from)
        const toNode = nodes.find(n => n.id === edge.to)

        return {
          type: 'scatter',
          mode: 'lines',
          x: [fromNode.x, toNode.x],
          y: [-fromNode.y, -toNode.y],
          line: {
            color: 'rgba(125, 125, 125, 0.5)',
            width: 2
          },
          hoverinfo: 'skip',
          showlegend: false
        }
      })

      return [...edgeTraces, nodeTrace]
    }

    // Original sunburst/treemap logic
    const flatData = flattenHierarchy(data.hierarchy)
    const colors = flatData.map(d => {
      const value = colorMapping[d.name] || 'Unknown'
      if (customColors[value]) {
        return customColors[value]
      }
      const index = uniqueValues.indexOf(value)
      return defaultColors[index % defaultColors.length]
    })

    const labels = flatData.map(d => d.name)
    const parents = flatData.map(d => d.parent)

    if (chartView === 'sunburst') {
      return [{
        type: 'sunburst',
        labels: labels,
        parents: parents,
        marker: {
          colors: colors,
          line: {
            color: 'white',
            width: 2
          }
        },
        text: labels,
        textinfo: 'label',
        hoverinfo: 'text',
        hovertext: flatData.map(d =>
          `<b>${d.name}</b><br>` +
          `${colorBy}: ${colorMapping[d.name] || 'Unknown'}<br>` +
          `Staff ID: ${d.staff_id}<br>` +
          `Job Function: ${d.job_function}<br>` +
          `Rank: ${d.rank}<br>` +
          `Squad: ${d.squad1}`
        )
      }]
    } else if (chartView === 'treemap') {
      return [{
        type: 'treemap',
        labels: labels,
        parents: parents,
        values: flatData.map(() => 1),
        marker: {
          colors: colors,
          line: {
            color: 'white',
            width: 2
          }
        },
        text: labels,
        textinfo: 'label',
        textposition: 'middle center',
        hoverinfo: 'text',
        hovertext: flatData.map(d =>
          `<b>${d.name}</b><br>` +
          `${colorBy}: ${colorMapping[d.name] || 'Unknown'}<br>` +
          `Staff ID: ${d.staff_id}<br>` +
          `Job Function: ${d.job_function}<br>` +
          `Rank: ${d.rank}<br>` +
          `Squad: ${d.squad1}`
        )
      }]
    }

    return null
  }

  const getWorkChartData = () => {
    if (!data || !data.data || data.data.length === 0) return []

    const tasks = [...data.data]
    tasks.sort((a, b) => new Date(a['start date']) - new Date(b['start date']))

    const squadGroups = {}
    tasks.forEach(task => {
      const squad = task['Squad name']
      if (!squadGroups[squad]) squadGroups[squad] = []
      squadGroups[squad].push(task)
    })

    const getThemeAwareColors = () => ({
      'Backend Team': getCSSVariable('--theme-primary') || '#3498db',
      'Frontend Team': getCSSVariable('--accent-red') || '#e74c3c',
      'Mobile Team': getCSSVariable('--accent-green') || '#2ecc71',
      'DevOps Team': getCSSVariable('--accent-orange') || '#f39c12',
      'Product Team': getCSSVariable('--accent-purple') || '#9b59b6',
      'Data Team': getCSSVariable('--accent-cyan') || '#1abc9c',
      'Design Team': getCSSVariable('--accent-pink') || '#e91e63'
    })
    
    const themeAwareColors = getThemeAwareColors()

    const traces = []
    Object.entries(squadGroups).forEach(([squad, tasks]) => {
      const color = customColors[squad] || themeAwareColors[squad] || getCSSVariable('--theme-textSecondary') || '#95a5a6'

      traces.push({
        type: 'scatter',
        mode: 'lines',
        name: squad,
        x: tasks.flatMap(task => [
          new Date(task['start date']),
          new Date(task['end date']),
          null
        ]),
        y: tasks.flatMap(task => [
          task['Squad name'],
          task['Squad name'],
          null
        ]),
        line: {
          width: 25,
          color: color
        },
        marker: {
          color: color,
          size: 8
        },
        hoverinfo: 'text',
        hovertext: tasks.flatMap(task => {
          const text = `<b>${task['Book of work']}</b><br>` +
                      `Squad: ${task['Squad name']}<br>` +
                      `Start: ${new Date(task['start date']).toLocaleDateString()}<br>` +
                      `End: ${new Date(task['end date']).toLocaleDateString()}<br>` +
                      `${task['description if any'] || ''}`
          return [text, text, null]
        })
      })
    })

    return traces
  }

  const getDefaultColor = (value, index) => {
    const defaultColors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#e91e63', '#00bcd4', '#ff9800', '#795548',
      '#607d8b', '#8bc34a', '#ffc107', '#009688', '#673ab7'
    ]
    return defaultColors[index % defaultColors.length]
  }

  const handleColorChange = (category, color) => {
    setCustomColors(prev => ({
      ...prev,
      [category]: color
    }))
    setChartKey(prev => prev + 1)
  }

  const getCategories = () => {
    if (chartType === 'org') {
      const categories = new Set()
      if (data && data.data) {
        data.data.forEach(emp => {
          const value = emp[colorBy]
          if (value) categories.add(value)
        })
      }
      return Array.from(categories)
    } else {
      if (data && data.data) {
        return [...new Set(data.data.map(task => task['Squad name']))]
      }
      return []
    }
  }

  const downloadChart = () => {
    const filename = chartType === 'org' ? 'organization_chart' : 'work_plan_timeline'
    const format = 'png'

    const plotElement = document.querySelector('.popup-content .js-plotly-plot')
    if (plotElement && window.Plotly) {
      window.Plotly.downloadImage(plotElement, {
        format: format,
        width: 1920,
        height: 1080,
        filename: filename
      })
    }
  }

  // Helper function to get actual CSS variable values
  const getCSSVariable = (variable) => {
    if (typeof window !== 'undefined') {
      const styles = getComputedStyle(document.documentElement)
      const value = styles.getPropertyValue(variable).trim()
      return value || '#1a1f2e' // fallback
    }
    return '#1a1f2e'
  }

  const getLayout = () => {
    const baseLayout = {
      paper_bgcolor: getCSSVariable('--theme-surface') || 'rgba(26, 31, 46, 0.95)',
      plot_bgcolor: getCSSVariable('--theme-surface') || 'rgba(26, 31, 46, 0.95)',
      font: {
        color: getCSSVariable('--theme-text') || '#ecf0f1',
        family: getCSSVariable('--font-primary') || 'Inter, sans-serif'
      },
      height: isFullscreen ? window.innerHeight - 120 : 650,
      margin: { l: 60, r: 60, t: 60, b: 60 },
      autosize: true
    }

    if (chartType === 'work') {
      return {
        ...baseLayout,
        xaxis: {
          title: 'Timeline',
          type: 'date',
          showgrid: true,
          gridcolor: getCSSVariable('--glass-border') || 'rgba(255, 255, 255, 0.1)',
          tickfont: { 
            color: getCSSVariable('--theme-text') || '#ecf0f1',
            size: 12
          },
          titlefont: { 
            color: getCSSVariable('--theme-primary') || '#3b82f6',
            size: 14,
            family: getCSSVariable('--font-display') || 'Orbitron, monospace'
          }
        },
        yaxis: {
          title: 'Squads',
          showgrid: true,
          gridcolor: getCSSVariable('--glass-border') || 'rgba(255, 255, 255, 0.1)',
          autorange: 'reversed',
          tickfont: { 
            color: getCSSVariable('--theme-text') || '#ecf0f1',
            size: 12
          },
          titlefont: { 
            color: getCSSVariable('--theme-primary') || '#3b82f6',
            size: 14,
            family: getCSSVariable('--font-display') || 'Orbitron, monospace'
          }
        },
        showlegend: true,
        legend: {
          orientation: 'v',
          x: 1.02,
          y: 1,
          font: { 
            color: getCSSVariable('--theme-text') || '#ecf0f1',
            size: 12
          },
          bgcolor: getCSSVariable('--glass-bg') || 'rgba(44, 62, 80, 0.8)',
          bordercolor: getCSSVariable('--glass-border') || 'rgba(255, 255, 255, 0.1)',
          borderwidth: 1
        },
        dragmode: 'zoom'
      }
    }

    // Tree view layout
    if (chartView === 'tree') {
      return {
        ...baseLayout,
        xaxis: {
          showgrid: false,
          zeroline: false,
          showticklabels: false,
          showline: false
        },
        yaxis: {
          showgrid: false,
          zeroline: false,
          showticklabels: false,
          showline: false
        },
        showlegend: false,
        dragmode: 'pan',
        hovermode: 'closest'
      }
    }

    return baseLayout
  }

  if (!isOpen) return null

  // Get the correct chart data based on chartType
  const chartData = chartType === 'org' ? getOrgChartData() : getWorkChartData()
  const layout = getLayout()

  console.log('Chart type:', chartType)
  console.log('Chart view:', chartView)
  console.log('Chart data:', chartData)

  return (
    <div className="chart-popup-overlay">
      <div className="chart-popup" ref={popupRef}>
        <div className="popup-header">
          <h2>{title}</h2>
          <div className="popup-controls">
            <button
              className="popup-btn"
              onClick={() => setShowColorPanel(!showColorPanel)}
              title="Color Settings"
            >
              <Palette size={20} />
            </button>
            <button
              className="popup-btn"
              onClick={downloadChart}
              title="Download Chart"
            >
              <Download size={20} />
            </button>
            <button
              className="popup-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              className="popup-btn close"
              onClick={onClose}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="popup-content">
          {showColorPanel && (
            <div className="color-panel">
              <h3>🎨 Color Configuration</h3>

              {chartType === 'org' && (
                <div className="color-by-selector">
                  <label>Color By:</label>
                  <select
                    value={colorBy}
                    onChange={(e) => {
                      setColorBy(e.target.value)
                      setChartKey(prev => prev + 1)
                    }}
                  >
                    <option value="Job Function">Job Function</option>
                    <option value="Squad 1 (where applicable)">Squad</option>
                    <option value="Sub-platform">Sub-platform</option>
                    <option value="Rank">Rank</option>
                  </select>
                </div>
              )}

              {chartType === 'org' && (
                <div className="chart-view-selector">
                  <label>Chart Type:</label>
                  <button
                    className={`view-btn ${chartView === 'sunburst' ? 'active' : ''}`}
                    onClick={() => {
                      setChartView('sunburst')
                      setChartKey(prev => prev + 1)
                    }}
                  >
                    🌅 Sunburst
                  </button>
                  <button
                    className={`view-btn ${chartView === 'treemap' ? 'active' : ''}`}
                    onClick={() => {
                      setChartView('treemap')
                      setChartKey(prev => prev + 1)
                    }}
                  >
                    🗺️ Treemap
                  </button>
                  <button
                    className={`view-btn ${chartView === 'tree' ? 'active' : ''}`}
                    onClick={() => {
                      setChartView('tree')
                      setChartKey(prev => prev + 1)
                    }}
                  >
                    🌳 Tree View
                  </button>
                </div>
              )}

              <div className="color-scheme-selector">
                <label>Color Scheme:</label>
                <select
                  value={colorScheme}
                  onChange={(e) => {
                    setColorScheme(e.target.value)
                    setChartKey(prev => prev + 1)
                  }}
                >
                  <option value="default">Default</option>
                  <option value="rainbow">Rainbow</option>
                  <option value="ocean">Ocean</option>
                  <option value="forest">Forest</option>
                  <option value="sunset">Sunset</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {colorScheme === 'custom' && (
                <div className="custom-colors">
                  <h4>Custom Colors</h4>
                  <div className="color-list">
                    {getCategories().map(category => (
                      <ColorPicker
                        key={category}
                        label={category}
                        color={customColors[category] || getDefaultColor(category, getCategories().indexOf(category))}
                        onChange={(color) => handleColorChange(category, color)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="chart-container">
            {chartData && chartData.length > 0 ? (
              <Plot
                key={chartKey}
                data={chartData}
                layout={layout}
                config={{
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToAdd: ['zoom2d', 'pan2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                  responsive: true,
                  toImageButtonOptions: {
                    format: 'png',
                    filename: chartType === 'org' ? `organization_${chartView}` : 'work_plan_timeline',
                    height: 1080,
                    width: 1920,
                    scale: 2
                  },
                  staticPlot: false,
                  editable: false,
                  autosizable: true
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            ) : (
              <div className="no-chart-data">
                <p>No data available to display chart</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx="true">{`
        .chart-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: var(--space-lg);
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .chart-popup {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          width: 95vw;
          height: 90vh;
          max-width: 1400px;
          max-height: 900px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
          animation: slideInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideInScale {
          from {
            transform: scale(0.9) translateY(20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-xl);
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.02);
        }

        .popup-header h2 {
          color: var(--theme-text);
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          background: var(--theme-gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .popup-controls {
          display: flex;
          gap: var(--space-sm);
        }

        .popup-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .popup-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left var(--transition-slow);
        }

        .popup-btn:hover::before {
          left: 100%;
        }

        .popup-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
          transform: translateY(-2px);
          border-color: var(--theme-primary);
        }

        .popup-btn.close {
          background: linear-gradient(135deg, var(--accent-red), #dc2626);
          color: white;
        }

        .popup-btn.close:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-2px) rotate(90deg);
        }

        .popup-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .color-panel {
          width: 320px;
          background: rgba(255, 255, 255, 0.02);
          border-right: 1px solid var(--glass-border);
          padding: var(--space-xl);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .color-panel h3 {
          color: var(--theme-text);
          font-weight: 600;
          margin: 0 0 var(--space-md) 0;
          font-size: 1.1rem;
        }

        .color-panel h4 {
          color: var(--theme-text);
          font-weight: 600;
          margin: var(--space-md) 0 var(--space-sm) 0;
          font-size: 1rem;
        }

        .color-by-selector,
        .color-scheme-selector {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .color-by-selector label,
        .color-scheme-selector label {
          color: var(--theme-text);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .color-by-selector select,
        .color-scheme-selector select {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          color: var(--theme-text);
          font-family: var(--font-primary);
          transition: all var(--transition-normal);
        }

        .color-by-selector select:focus,
        .color-scheme-selector select:focus {
          outline: none;
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .chart-view-selector {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .chart-view-selector label {
          color: var(--theme-text);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .view-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.85rem;
          margin-bottom: var(--space-xs);
          position: relative;
          overflow: hidden;
        }

        .view-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left var(--transition-slow);
        }

        .view-btn:hover::before {
          left: 100%;
        }

        .view-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
        }

        .view-btn.active {
          background: var(--theme-gradient-primary);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .custom-colors {
          margin-top: var(--space-md);
        }

        .color-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          max-height: 300px;
          overflow-y: auto;
        }

        .chart-container {
          flex: 1;
          padding: var(--space-xl);
          background: var(--theme-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        /* Ensure Plotly text is visible */
        .chart-container :global(.plotly .main-svg) {
          background: var(--theme-surface) !important;
        }

        .chart-container :global(.plotly text) {
          fill: var(--theme-text) !important;
        }

        .chart-container :global(.plotly .xtick text),
        .chart-container :global(.plotly .ytick text) {
          fill: var(--theme-text) !important;
        }

        .chart-container :global(.plotly .xtitle),
        .chart-container :global(.plotly .ytitle) {
          fill: var(--theme-primary) !important;
        }

        .no-chart-data {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--theme-textSecondary);
          font-size: 1.1rem;
        }

        /* Fullscreen styles */
        .chart-popup:fullscreen {
          width: 100vw;
          height: 100vh;
          max-width: none;
          max-height: none;
          border-radius: 0;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .chart-popup-overlay {
            padding: var(--space-md);
          }

          .chart-popup {
            width: 100%;
            height: 100%;
            max-width: none;
            max-height: none;
          }

          .popup-header {
            padding: var(--space-lg);
          }

          .popup-header h2 {
            font-size: 1.2rem;
          }

          .popup-controls {
            gap: var(--space-xs);
          }

          .popup-btn {
            width: 36px;
            height: 36px;
          }

          .popup-content {
            flex-direction: column;
          }

          .color-panel {
            width: 100%;
            max-height: 200px;
            border-right: none;
            border-bottom: 1px solid var(--glass-border);
          }

          .chart-container {
            padding: var(--space-lg);
          }
        }

        /* Scrollbar styling for color panel */
        .color-panel::-webkit-scrollbar,
        .color-list::-webkit-scrollbar {
          width: 6px;
        }

        .color-panel::-webkit-scrollbar-track,
        .color-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
        }

        .color-panel::-webkit-scrollbar-thumb,
        .color-list::-webkit-scrollbar-thumb {
          background: var(--theme-primary);
          border-radius: var(--radius-sm);
        }

        .color-panel::-webkit-scrollbar-thumb:hover,
        .color-list::-webkit-scrollbar-thumb:hover {
          background: var(--theme-accent);
        }

        /* Animation for color panel toggle */
        .color-panel {
          animation: slideInLeft 0.3s ease;
        }

        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default ChartPopup