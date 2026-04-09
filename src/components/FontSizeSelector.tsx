import React from 'react'
import './FontSizeSelector.css'

interface FontSizeSelectorProps {
  fontSize: number
  onFontSizeChange: (size: number) => void
}

const FONT_SIZES = [14, 16, 18, 20, 22, 24, 28, 32]

const FontSizeSelector: React.FC<FontSizeSelectorProps> = ({
  fontSize,
  onFontSizeChange,
}) => {
  return (
    <div className="font-size-selector">
      <label className="font-size-label">字号</label>
      <div className="font-size-buttons">
        {FONT_SIZES.map(size => (
          <button
            key={size}
            className={`font-size-button ${fontSize === size ? 'active' : ''}`}
            onClick={() => onFontSizeChange(size)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}

export default FontSizeSelector
