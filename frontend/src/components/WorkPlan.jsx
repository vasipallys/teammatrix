import React, { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import ChartPopup from './ChartPopup'
import { Download, Calendar, Users, Clock, TrendingUp, Maximize2 } from 'lucide-react'

const WorkPlan = ({ data }) => {
  const [filterSquad, setFilterSquad] = useState([])
  const [yAxis, setYAxis] = useState('Squad name')
  const [showPopup, setShowPopup] = useState(false)
  const [chartKey, setChartKey] = useState(0)
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    activeSquads: 0,
    projectSpan: 0,
    activeTasks: 0
  })

  useEffect(() => {
    if (data && data.data) {
      calculateMetrics()
      setChartKey(prev => prev + 1)
    }
  }, [data])

  const calculateMetrics = () => {
    const tasks = data.data || []
    const uniqueSquads = [...new Set(tasks.map(task => task['Squad name']))]
    const now = new Date()
    const activeTasks = tasks.filter(task => new Date(task['end date']) >= now)

    let minDate = new Date(tasks[0]?.['start date'] || now)
    let maxDate = new Date(tasks[0]?.['end date'] || now)

    tasks.forEach(task => {
      const start = new Date(task['start date'])
      const end = new Date(task['end date'])
      if (start < minDate) minDate = start
      if (end > maxDate) maxDate = end
    })

    const projectSpan = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24))

    setMetrics({
      totalTasks: tasks.length,
      activeSquads: uniqueSquads.length,
      projectSpan: projectSpan,
      activeTasks: activeTasks.length
    })
  }

  const getFilteredData = () => {
    let filtered = [...(data?.data || [])]

    if (filterSquad.length > 0 && !filterSquad.includes('All')) {
      filtered = filtered.filter(task => filterSquad.includes(task['Squad name']))
    }

    return filtered
  }

  const getGanttData = () => {
    const filtered = getFilteredData()
    if (filtered.length === 0) return []

    // Sort by start date for better visualization
    filtered.sort((a, b) => new Date(a['start date']) - new Date(b['start date']))

    const traces = []
    const squadColors = {
      'Backend Team': 'var(--theme-primary)',
      'Frontend Team': 'var(--accent-red)',
      'Mobile Team': 'var(--accent-green)',
      'DevOps Team': 'var(--accent-orange)',
      'Product Team': 'var(--accent-purple)',
      'Data Team': 'var(--accent-cyan)',
      'Design Team': 'var(--accent-pink)'
    }

    // Group by squad for better visualization
    const squadGroups = {}
    filtered.forEach(task => {
      const squad = task['Squad name']
      if (!squadGroups[squad]) squadGroups[squad] = []
      squadGroups[squad].push(task)
    })

    Object.entries(squadGroups).forEach(([squad, tasks]) => {
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
          yAxis === 'Squad name' ? task['Squad name'] : task['Book of work'],
          yAxis === 'Squad name' ? task['Squad name'] : task['Book of work'],
          null
        ]),
        line: {
          width: 20,
          color: squadColors[squad] || 'var(--theme-textSecondary)'
        },
        hoverinfo: 'text',
        hovertext: tasks.flatMap(task => {
          const text = `<b>${task['Book of work']}</b><br>` +
                      `Squad: ${task['Squad name']}<br>` +
                      `Start: ${new Date(task['start date']).toLocaleDateString()}<br>` +
                      `End: ${new Date(task['end date']).toLocaleDateString()}<br>` +
                      `${task['description if any'] ? `Description: ${task['description if any']}` : ''}`
          return [text, text, null]
        })
      })
    })

    return traces
  }

  const uniqueSquads = [...new Set((data?.data || []).map(task => task['Squad name']))]

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="work-plan-empty">
        <h3>📅 No Work Plan Data Available</h3>
        <p>Upload your work plan CSV to visualize project timelines</p>
      </div>
    )
  }

  return (
    <div className="work-plan-container">
      <div className="work-plan-metrics">
        <div className="metric-card">
          <div className="metric-value">{metrics.totalTasks}</div>
          <div className="metric-label">Total Tasks</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.activeSquads}</div>
          <div className="metric-label">Active Squads</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.projectSpan}</div>
          <div className="metric-label">Project Days</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.activeTasks}</div>
          <div className="metric-label">Active Tasks</div>
        </div>
      </div>

      <div className="work-filters">
        <div className="filter-group">
          <label>Filter by Squad:</label>
          <select
            multiple
            value={filterSquad}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value)
              setFilterSquad(values)
              setChartKey(prev => prev + 1)
            }}
          >
            <option value="All">All Squads</option>
            {uniqueSquads.map(squad => (
              <option key={squad} value={squad}>{squad}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Y-Axis Display:</label>
          <select
            value={yAxis}
            onChange={(e) => {
              setYAxis(e.target.value)
              setChartKey(prev => prev + 1)
            }}
          >
            <option value="Squad name">Group by Squads</option>
            <option value="Book of work">Show All Tasks</option>
          </select>
        </div>

        <div className="filter-info">
          <span className="filter-info-icon">💡</span>
          <span className="filter-info-text">
            Hold Ctrl/Cmd to select multiple squads. Use mouse wheel to zoom the timeline.
          </span>
        </div>
      </div>

      <div className="gantt-chart">
        <div className="gantt-chart-header">
          <h3 className="gantt-chart-title">
            <Calendar size={20} />
            Work Plan Timeline (Gantt Chart)
          </h3>
          <div className="chart-actions">
            <button
              className="chart-action-btn"
              onClick={() => setShowPopup(true)}
            >
              <Maximize2 size={16} />
              Expand View
            </button>
            <button className="chart-action-btn">
              <TrendingUp size={16} />
              Analytics
            </button>
          </div>
        </div>

        <Plot
          key={chartKey}
          data={getGanttData()}
          layout={{
            xaxis: {
              title: 'Timeline',
              type: 'date',
              showgrid: true,
              gridcolor: 'var(--glass-border)',
              zeroline: false,
              tickfont: {
                color: 'var(--theme-text)',
                size: 11
              },
              titlefont: {
                color: 'var(--theme-primary)',
                size: 14,
                family: 'var(--font-display)'
              }
            },
            yaxis: {
              title: yAxis,
              showgrid: true,
              gridcolor: 'var(--glass-border)',
              autorange: 'reversed',
              zeroline: false,
              tickfont: {
                color: 'var(--theme-text)',
                size: 11
              },
              titlefont: {
                color: 'var(--theme-primary)',
                size: 14,
                family: 'var(--font-display)'
              }
            },
            height: 500,
            dragmode: 'zoom',
            hovermode: 'closest',
            paper_bgcolor: 'var(--theme-surface)',
            plot_bgcolor: 'var(--theme-surface)',
            showlegend: true,
            legend: {
              orientation: 'v',
              x: 1.02,
              y: 1,
              font: {
                color: 'var(--theme-text)',
                size: 11
              },
              bgcolor: 'var(--glass-bg)',
              bordercolor: 'var(--glass-border)',
              borderwidth: 1
            },
            margin: {
              l: 150,
              r: 150,
              t: 30,
              b: 60
            },
            font: {
              family: 'var(--font-primary)',
              color: 'var(--theme-text)'
            },
            autosize: true
          }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToAdd: ['zoom2d', 'pan2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
            responsive: true,
            toImageButtonOptions: {
              format: 'png',
              filename: 'work_plan_timeline',
              height: 800,
              width: 1200,
              scale: 2
            }
          }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>

      <ChartPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        chartType="work"
        data={data}
        title="Work Plan Timeline Visualization"
      />

      <div className="export-section">
        <h4>💾 Export Options</h4>
        <div className="export-buttons">
          <button className="export-btn">
            <Download size={16} />
            Download Chart (PNG)
          </button>
          <button className="export-btn">
            <Download size={16} />
            Export Data (CSV)
          </button>
          <button className="export-btn">
            <Download size={16} />
            Generate Report (PDF)
          </button>
        </div>
      </div>
      <style jsx="true">{`
        .work-plan-container {
          padding: var(--space-lg);
          background: var(--theme-background);
          color: var(--theme-text);
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .work-plan-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--space-3xl);
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          margin: var(--space-xl);
          min-height: 400px;
        }

        .work-plan-empty h3 {
          color: var(--theme-text);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--space-lg);
        }

        .work-plan-empty p {
          color: var(--theme-textSecondary);
          font-size: 1.1rem;
          max-width: 400px;
        }

        .work-plan-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .metric-card {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
          text-align: center;
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          transition: left var(--transition-slow);
        }

        .metric-card:hover::before {
          left: 100%;
        }

        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          border-color: var(--theme-primary);
        }

        .metric-value {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 900;
          background: var(--theme-gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-sm);
        }

        .metric-label {
          color: var(--theme-textSecondary);
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .work-filters {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-lg);
          align-items: flex-end;
          padding: var(--space-xl);
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          min-width: 200px;
        }

        .filter-group label {
          color: var(--theme-text);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .filter-group select {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          color: var(--theme-text);
          font-family: var(--font-primary);
          transition: all var(--transition-normal);
          min-height: 42px;
        }

        .filter-group select[multiple] {
          min-height: 120px;
        }

        .filter-group select:focus {
          outline: none;
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .filter-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: var(--radius-lg);
          margin-left: auto;
          max-width: 300px;
        }

        .filter-info-icon {
          font-size: 1.2rem;
        }

        .filter-info-text {
          color: var(--theme-text);
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .gantt-chart {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
          transition: all var(--transition-normal);
        }

        .gantt-chart:hover {
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .gantt-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--glass-border);
        }

        .gantt-chart-title {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--theme-text);
          margin: 0;
        }

        .chart-actions {
          display: flex;
          gap: var(--space-sm);
        }

        .chart-action-btn {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-lg);
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.85rem;
          font-weight: 500;
          position: relative;
          overflow: hidden;
        }

        .chart-action-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left var(--transition-slow);
        }

        .chart-action-btn:hover::before {
          left: 100%;
        }

        .chart-action-btn:hover {
          background: var(--theme-gradient-secondary);
          color: var(--theme-text);
          transform: translateY(-2px);
          border-color: var(--theme-primary);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        .export-section {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-xl);
        }

        .export-section h4 {
          color: var(--theme-text);
          font-weight: 600;
          margin: 0 0 var(--space-lg) 0;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .export-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-md);
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md) var(--space-lg);
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          color: var(--theme-textSecondary);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.85rem;
          font-weight: 500;
          position: relative;
          overflow: hidden;
        }

        .export-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left var(--transition-slow);
        }

        .export-btn:hover::before {
          left: 100%;
        }

        .export-btn:hover {
          background: linear-gradient(135deg, var(--accent-green), var(--accent-cyan));
          color: white;
          transform: translateY(-2px);
          border-color: transparent;
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .work-plan-container {
            padding: var(--space-md);
            gap: var(--space-lg);
          }

          .work-plan-metrics {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: var(--space-md);
          }

          .metric-card {
            padding: var(--space-lg);
          }

          .metric-value {
            font-size: 2rem;
          }

          .work-filters {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-md);
            padding: var(--space-lg);
          }

          .filter-group {
            min-width: auto;
          }

          .filter-info {
            margin-left: 0;
            max-width: none;
          }

          .gantt-chart {
            padding: var(--space-lg);
          }

          .gantt-chart-header {
            flex-direction: column;
            gap: var(--space-md);
            align-items: stretch;
          }

          .chart-actions {
            justify-content: center;
          }

          .export-buttons {
            flex-direction: column;
          }

          .export-btn {
            justify-content: center;
          }
        }

        /* Plotly container styling */
        :global(.plotly) {
          border-radius: var(--radius-lg) !important;
          overflow: hidden !important;
        }

        /* Custom scrollbars */
        .work-plan-container::-webkit-scrollbar {
          width: 8px;
        }

        .work-plan-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
        }

        .work-plan-container::-webkit-scrollbar-thumb {
          background: var(--theme-primary);
          border-radius: var(--radius-sm);
        }

        .work-plan-container::-webkit-scrollbar-thumb:hover {
          background: var(--theme-accent);
        }
      `}</style>
    </div>
  )
}

export default WorkPlan