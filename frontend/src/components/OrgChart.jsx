import React, { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import EmployeeCard from './EmployeeCard'
import ChartPopup from './ChartPopup'
import { filterOrgData } from '../api'
import { Maximize2, Settings } from 'lucide-react'

const OrgChart = ({ data, filters, colorBy, colorScheme }) => {
  const [chartType, setChartType] = useState('sunburst')
  const [filteredData, setFilteredData] = useState(data)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [chartKey, setChartKey] = useState(0) // Force re-render

  useEffect(() => {
    console.log('OrgChart received data:', data)
    if (data) {
      applyFilters()
      // Force chart re-render
      setChartKey(prev => prev + 1)
    }
  }, [filters, data])

  const applyFilters = async () => {
    if (!data) return

    if (Object.keys(filters).length === 0) {
      setFilteredData(data)
      return
    }

    try {
      const response = await filterOrgData(filters)
      if (response.data.success) {
        setFilteredData(response.data)
      }
    } catch (error) {
      console.error('Filter error:', error)
      setFilteredData(data)
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

  const flattenHierarchy = (hierarchy) => {
    if (!hierarchy || hierarchy.length === 0) {
      console.warn('No hierarchy data to flatten')
      return []
    }

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
    console.log('Flattened hierarchy:', flat)
    return flat
  }

  const getChartData = () => {
    if (!filteredData || !filteredData.hierarchy || filteredData.hierarchy.length === 0) {
      console.warn('No hierarchy data available for chart')
      return null
    }

    const colorMapping = {}

    if (filteredData.data && Array.isArray(filteredData.data)) {
      filteredData.data.forEach(employee => {
        const name = employee['Staff Name'] || employee['staff name'] || employee['Name'] || 'Unknown'
        const colorValue = employee[colorBy] || 'Unknown'
        colorMapping[name] = colorValue
      })
    }

    // Get unique color values
    const uniqueColorValues = [...new Set(Object.values(colorMapping))]
    const colorPalette = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#e91e63', '#00bcd4', '#ff9800', '#795548'
    ]

    // Handle tree view
    if (chartType === 'tree') {
      const { nodes, edges } = getTreeLayout(filteredData.hierarchy)

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
            const index = uniqueColorValues.indexOf(value)
            return colorPalette[index % colorPalette.length]
          }),
          line: {
            color: 'white',
            width: 2
          }
        },
        hoverinfo: 'text',
        hovertext: nodes.map(n =>
          `<b>${n.name}</b><br>` +
          `Staff ID: ${n.data.staff_id}<br>` +
          `Job Function: ${n.data.job_function}<br>` +
          `Rank: ${n.data.rank}<br>` +
          `Squad: ${n.data.squad1}<br>` +
          `Sub-platform: ${n.data.sub_platform}<br>` +
          `${colorBy}: ${colorMapping[n.name] || 'Unknown'}`
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
    const flatData = flattenHierarchy(filteredData.hierarchy)
    if (flatData.length === 0) return null

    const labels = flatData.map(d => d.name)
    const parents = flatData.map(d => d.parent)

    // Map values to colors
    const colors = flatData.map(d => {
      const value = colorMapping[d.name] || 'Unknown'
      const index = uniqueColorValues.indexOf(value)
      return colorPalette[index % colorPalette.length]
    })

    console.log('Chart data prepared:', { labels, parents, colors })

    const chartData = {
      type: chartType,
      labels: labels,
      parents: parents,
      text: labels,
      textinfo: 'label',
      hoverinfo: 'text',
      marker: {
        colors: colors,
        line: {
          color: 'white',
          width: 2
        }
      },
      hovertext: flatData.map(d =>
        `<b>${d.name}</b><br>` +
        `Staff ID: ${d.staff_id}<br>` +
        `Job Function: ${d.job_function}<br>` +
        `Rank: ${d.rank}<br>` +
        `Squad: ${d.squad1}<br>` +
        `Sub-platform: ${d.sub_platform}<br>` +
        `${colorBy}: ${colorMapping[d.name] || 'Unknown'}`
      )
    }

    if (chartType === 'treemap') {
      chartData.values = flatData.map(() => 1)
      chartData.textposition = 'middle center'
    }

    return [chartData]
  }

  const searchEmployees = () => {
    if (!filteredData || !filteredData.data) return []

    const employees = filteredData.data

    if (!searchTerm) return employees

    return employees.filter(emp =>
      Object.values(emp).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }

  const getLayout = () => {
    const baseLayout = {
      height: 600,
      width: undefined,
      margin: { l: 40, r: 40, t: 60, b: 40 },
      paper_bgcolor: 'var(--theme-surface)',
      plot_bgcolor: 'var(--theme-surface)',
      font: {
        color: 'var(--theme-text)',
        family: 'var(--font-primary)'
      },
      autosize: true
    }

    if (chartType === 'tree') {
      return {
        ...baseLayout,
        title: {
          text: `Organization Tree View - Colored by ${colorBy}`,
          font: {
            color: 'var(--theme-text)',
            size: 18,
            family: 'var(--font-primary)'
          }
        },
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

    return {
      ...baseLayout,
      title: {
        text: `Organization ${chartType === 'sunburst' ? 'Sunburst' : 'Treemap'} - Colored by ${colorBy}`,
        font: {
          color: 'var(--theme-text)',
          size: 18,
          family: 'var(--font-primary)'
        }
      },
      showlegend: false
    }
  }

  const chartData = getChartData()

  if (!filteredData || !filteredData.data || filteredData.data.length === 0) {
    return (
      <div className="empty-state">
        <p>No organization data available. Please upload a CSV file.</p>
      </div>
    )
  }

  return (
    <div className="org-chart-container">
      <div className="chart-controls">
        <button
          className={`chart-type-btn ${chartType === 'sunburst' ? 'active' : ''}`}
          onClick={() => {
            setChartType('sunburst')
            setChartKey(prev => prev + 1)
          }}
        >
          🌅 Sunburst
        </button>
        <button
          className={`chart-type-btn ${chartType === 'treemap' ? 'active' : ''}`}
          onClick={() => {
            setChartType('treemap')
            setChartKey(prev => prev + 1)
          }}
        >
          🗺️ Treemap
        </button>
        <button
          className={`chart-type-btn ${chartType === 'tree' ? 'active' : ''}`}
          onClick={() => {
            setChartType('tree')
            setChartKey(prev => prev + 1)
          }}
        >
          🌳 Tree View
        </button>
        <button
          className="chart-type-btn popup-btn"
          onClick={() => setShowPopup(true)}
          title="Open in Popup"
        >
          <Maximize2 size={16} />
          Expand View
        </button>
      </div>

      {chartData && (
        <div className="chart-wrapper">
          <Plot
            key={chartKey}
            data={chartData}
            layout={getLayout()}
            config={{
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToAdd: ['zoom2d', 'pan2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
              responsive: true
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>
      )}

      {!chartData && (
        <div className="no-chart-data">
          <p>Unable to generate chart. Please check if the data has proper hierarchy structure.</p>
        </div>
      )}

      <div className="employee-directory">
        <h3>👤 Employee Directory ({filteredData.data.length} employees)</h3>
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="employee-grid">
          {searchEmployees().map((employee, idx) => {
            const name = employee['Staff Name'] || employee['staff name'] || employee['Name'] || 'Unknown'
            return (
              <button
                key={idx}
                className="employee-btn"
                onClick={() => setSelectedEmployee(employee)}
              >
                👤 {name}
              </button>
            )
          })}
        </div>
      </div>

      {selectedEmployee && (
        <EmployeeCard
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      <ChartPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        chartType="org"
        data={filteredData}
        title="Organization Structure Visualization"
      />
      <style jsx="true">{`
        .org-chart-container {
          padding: var(--space-lg);
          background: var(--theme-background);
          color: var(--theme-text);
        }

        .chart-controls {
          display: flex;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
          flex-wrap: wrap;
        }

        .chart-type-btn {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-sm) var(--space-lg);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 0.9rem;
          font-weight: 500;
          position: relative;
          overflow: hidden;
        }

        .chart-type-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left var(--transition-slow);
        }

        .chart-type-btn:hover::before {
          left: 100%;
        }

        .chart-type-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--theme-text);
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .chart-type-btn.active {
          background: var(--theme-gradient-primary);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .popup-btn {
          background: var(--theme-gradient-secondary) !important;
          color: var(--theme-text) !important;
        }

        .chart-wrapper {
          background: var(--theme-surface);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          backdrop-filter: var(--glass-backdrop);
        }

        .no-chart-data {
          text-align: center;
          padding: var(--space-3xl);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl);
          color: var(--theme-textSecondary);
        }

        .employee-directory {
          margin-top: var(--space-2xl);
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
        }

        .employee-directory h3 {
          color: var(--theme-text);
          margin-bottom: var(--space-lg);
          font-weight: 600;
        }

        .search-input {
          width: 100%;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          color: var(--theme-text);
          font-family: var(--font-primary);
          transition: all var(--transition-normal);
          margin-bottom: var(--space-lg);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .search-input::placeholder {
          color: var(--theme-textSecondary);
        }

        .employee-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-sm);
          max-height: 300px;
          overflow-y: auto;
        }

        .employee-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          color: var(--theme-text);
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: left;
          font-size: 0.85rem;
          position: relative;
          overflow: hidden;
        }

        .employee-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left var(--transition-slow);
        }

        .employee-btn:hover::before {
          left: 100%;
        }

        .employee-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
          border-color: var(--theme-primary);
        }

        @media (max-width: 768px) {
          .chart-controls {
            flex-direction: column;
          }

          .chart-type-btn {
            width: 100%;
            justify-content: center;
          }

          .employee-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default OrgChart