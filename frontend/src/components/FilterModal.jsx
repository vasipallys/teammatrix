import React, { useState } from 'react'
import { X } from 'lucide-react'

const FilterModal = ({ orgData, filters, colorBy, colorScheme, onClose, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters)
  const [localColorBy, setLocalColorBy] = useState(colorBy)
  const [localColorScheme, setLocalColorScheme] = useState(colorScheme)

  const colorOptions = [
    'Job Function',
    'Squad 1 (where applicable)',
    'Sub-platform',
    'Rank'
  ]

  const colorSchemes = [
    'Viridis',
    'Set3',
    'Rainbow',
    'Blues',
    'Reds',
    'Greens',
    'Plasma',
    'Turbo'
  ]

  const getUniqueValues = (column) => {
    if (!orgData?.data) return []
    return [...new Set(orgData.data.map(row => row[column]).filter(Boolean))]
  }

  const handleFilterChange = (column, values) => {
    setLocalFilters({
      ...localFilters,
      [column]: values
    })
  }

  const handleApply = () => {
    onApply(localFilters, localColorBy, localColorScheme)
  }

  const handleClearFilters = () => {
    setLocalFilters({})
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>🎛️ Advanced Filters & Color Configuration</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          <div className="filter-section">
            <h4>🎨 Color Configuration</h4>
            <div className="color-config">
              <div className="config-item">
                <label>Color charts by:</label>
                <select
                  value={localColorBy}
                  onChange={(e) => setLocalColorBy(e.target.value)}
                >
                  {colorOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="config-item">
                <label>Color Scheme:</label>
                <select
                  value={localColorScheme}
                  onChange={(e) => setLocalColorScheme(e.target.value)}
                >
                  {colorSchemes.map(scheme => (
                    <option key={scheme} value={scheme}>{scheme}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="filter-section">
            <h4>🔍 Multi-Select Filters</h4>
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              🗑️ Clear All Filters
            </button>

            {colorOptions.map(column => (
              <div key={column} className="filter-item">
                <label>{column} Filter:</label>
                <select
                  multiple
                  value={localFilters[column] || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value)
                    handleFilterChange(column, values)
                  }}
                >
                  {getUniqueValues(column).map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="apply-btn" onClick={handleApply}>
            ✅ Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterModal