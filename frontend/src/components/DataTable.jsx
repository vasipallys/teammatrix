import React, { useState } from 'react'
import { Edit2, Save, X, Trash2, Plus } from 'lucide-react'

const DataTable = ({ data, columns, onUpdate, onDelete, onAdd, type, maxHeight, showActions = true }) => {
  const [editingId, setEditingId] = useState(null)
  const [editedData, setEditedData] = useState({})
  const [showAddRow, setShowAddRow] = useState(false)
  const [newRowData, setNewRowData] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 10

  // Filter data based on search term
  const filteredData = data.filter(item => {
    return Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handleEdit = (item) => {
    setEditingId(item.id)
    setEditedData(item)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditedData({})
  }

  const handleSave = async () => {
    await onUpdate(editingId, editedData)
    setEditingId(null)
    setEditedData({})
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      await onDelete(id)
    }
  }

  const handleAddNew = async () => {
    if (onAdd) {
      await onAdd(newRowData)
      setShowAddRow(false)
      setNewRowData({})
    }
  }

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }

  const handleNewFieldChange = (field, value) => {
    setNewRowData(prev => ({ ...prev, [field]: value }))
  }

  const renderCell = (item, column) => {
    if (editingId === item.id) {
      const value = editedData[column.key] || ''

      if (column.type === 'date') {
        return (
          <input
            type="date"
            value={value ? value.split('T')[0] : ''}
            onChange={(e) => handleFieldChange(column.key, e.target.value)}
            className="table-input"
          />
        )
      }

      if (column.type === 'select' && column.options) {
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(column.key, e.target.value)}
            className="table-select"
          >
            <option value="">Select...</option>
            {column.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      }

      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleFieldChange(column.key, e.target.value)}
          className="table-input"
        />
      )
    }

    const value = item[column.key]
    
    // Handle different column types for display
    if (column.type === 'clickable' && column.onClick) {
      return (
        <button 
          className="clickable-cell"
          onClick={() => column.onClick(value, item)}
          disabled={!value || value === 0}
        >
          {value || 0}
        </button>
      )
    }
    
    if (column.type === 'datetime') {
      return <span>{value ? new Date(value).toLocaleString() : '-'}</span>
    }
    
    if (column.type === 'hash') {
      return <span className="hash-cell">{value ? value.substring(0, 7) : '-'}</span>
    }
    
    if (column.type === 'message') {
      return <span className="message-cell" title={value}>{value ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : '-'}</span>
    }
    
    if (column.type === 'positive') {
      return <span className="positive-number">+{value || 0}</span>
    }
    
    if (column.type === 'negative') {
      return <span className="negative-number">-{value || 0}</span>
    }
    
    if (column.type === 'pr-state') {
      return <span className={`pr-state ${value}`}>{value || '-'}</span>
    }
    
    if (column.type === 'pr-number') {
      return <span className="pr-number">#{value}</span>
    }
    
    if (column.type === 'boolean') {
      return <span className={`boolean-cell ${value}`}>{value ? '✓' : '✗'}</span>
    }
    
    return <span>{value || '-'}</span>
  }

  const renderNewCell = (column) => {
    const value = newRowData[column.key] || ''

    if (column.type === 'date') {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => handleNewFieldChange(column.key, e.target.value)}
          className="table-input"
          placeholder={column.label}
        />
      )
    }

    if (column.type === 'select' && column.options) {
      return (
        <select
          value={value}
          onChange={(e) => handleNewFieldChange(column.key, e.target.value)}
          className="table-select"
        >
          <option value="">Select {column.label}...</option>
          {column.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleNewFieldChange(column.key, e.target.value)}
        className="table-input"
        placeholder={column.label}
      />
    )
  }

  return (
    <div className="data-table-container">
      <div className="table-header">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="table-search"
          />
        </div>
        <div className="table-stats">
          {filteredData.length} records
        </div>
        {onAdd && (
          <button
            className="add-btn"
            onClick={() => setShowAddRow(!showAddRow)}
          >
            <Plus size={16} />
            Add New {type}
          </button>
        )}
      </div>

      <div className="table-wrapper" style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
              {showActions && <th className="actions-col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {showAddRow && (
              <tr className="add-row">
                {columns.map(col => (
                  <td key={col.key}>
                    {renderNewCell(col)}
                  </td>
                ))}
                {showActions && (
                  <td className="actions-cell">
                    <button
                      className="action-btn save"
                      onClick={handleAddNew}
                      title="Save"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      className="action-btn cancel"
                      onClick={() => {
                        setShowAddRow(false)
                        setNewRowData({})
                      }}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </td>
                )}
              </tr>
            )}

            {paginatedData.map(item => (
              <tr key={item.id} className={editingId === item.id ? 'editing' : ''}>
                {columns.map(col => (
                  <td key={col.key}>
                    {renderCell(item, col)}
                  </td>
                ))}
                {showActions && (
                  <td className="actions-cell">
                    {editingId === item.id ? (
                      <>
                        <button
                          className="action-btn save"
                          onClick={handleSave}
                          title="Save"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          className="action-btn cancel"
                          onClick={handleCancel}
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="page-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default DataTable