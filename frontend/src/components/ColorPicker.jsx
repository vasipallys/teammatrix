import React, { useState } from 'react'

const ColorPicker = ({ label, color, onChange }) => {
  const [showPicker, setShowPicker] = useState(false)

  const presetColors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e91e63', '#00bcd4', '#ff9800', '#795548',
    '#607d8b', '#8bc34a', '#ffc107', '#009688', '#673ab7',
    '#ff5722', '#03a9f4', '#4caf50', '#ff9800', '#9c27b0'
  ]

  return (
    <div className="color-picker-item">
      <span className="color-label">{label}</span>
      <div className="color-input-group">
        <div
          className="color-preview"
          style={{ backgroundColor: color }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="color-hex-input"
          placeholder="#000000"
        />
      </div>

      {showPicker && (
        <div className="color-picker-dropdown">
          <div className="preset-colors">
            {presetColors.map((presetColor) => (
              <div
                key={presetColor}
                className="preset-color"
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  onChange(presetColor)
                  setShowPicker(false)
                }}
              />
            ))}
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="color-input"
          />
        </div>
      )}
    </div>
  )
}

export default ColorPicker