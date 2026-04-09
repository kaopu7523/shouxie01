import React from 'react'
import './BindingMarginSelector.css'

interface BindingMarginSelectorProps {
  bindingMargin: number
  onBindingMarginChange: (margin: number) => void
}

const BindingMarginSelector: React.FC<BindingMarginSelectorProps> = ({
  bindingMargin,
  onBindingMarginChange,
}) => {
  const presets = [0, 10, 15, 20, 25, 30]

  return (
    <div className="binding-margin-selector">
      <label className="binding-margin-label">
        装订边距: {bindingMargin}mm
      </label>
      <div className="binding-margin-presets">
        {presets.map(mm => (
          <button
            key={mm}
            className={`binding-margin-button ${bindingMargin === mm ? 'active' : ''}`}
            onClick={() => onBindingMarginChange(mm)}
          >
            {mm}mm
          </button>
        ))}
      </div>
      <input
        type="range"
        className="binding-margin-slider"
        min="0"
        max="50"
        step="1"
        value={bindingMargin}
        onChange={(e) => onBindingMarginChange(Number(e.target.value))}
      />
    </div>
  )
}

export default BindingMarginSelector
