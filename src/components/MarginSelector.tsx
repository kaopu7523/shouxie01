import React, { useState, useEffect } from 'react'
import './MarginSelector.css'

export interface MarginPreset {
  name: string
  description: string
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
}

const MARGIN_PRESETS: MarginPreset[] = [
  {
    name: '普通',
    description: '默认，2.54cm',
    marginTop: 25.4,
    marginBottom: 25.4,
    marginLeft: 25.4,
    marginRight: 25.4,
  },
  {
    name: '窄',
    description: '省纸，1.27/1.91cm',
    marginTop: 12.7,
    marginBottom: 12.7,
    marginLeft: 19.1,
    marginRight: 19.1,
  },
  {
    name: '适中',
    description: '文字多，2.54/1.91cm',
    marginTop: 25.4,
    marginBottom: 25.4,
    marginLeft: 19.1,
    marginRight: 19.1,
  },
  {
    name: '宽',
    description: '留白多，3.18cm',
    marginTop: 31.8,
    marginBottom: 31.8,
    marginLeft: 31.8,
    marginRight: 31.8,
  },
  {
    name: '镜像',
    description: '双面打印，25.4/19.1cm',
    marginTop: 25.4,
    marginBottom: 25.4,
    marginLeft: 25.4,
    marginRight: 19.1,
  },
]

const STORAGE_KEY = 'selectedMarginPreset'

const getStoredPreset = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseInt(stored, 10) : 0
  } catch {
    return 0
  }
}

interface MarginSelectorProps {
  selectedPreset: MarginPreset
  onPresetChange: (preset: MarginPreset) => void
}

const MarginSelector: React.FC<MarginSelectorProps> = ({
  selectedPreset,
  onPresetChange,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    MARGIN_PRESETS.findIndex(p => p.name === selectedPreset.name)
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeIndex.toString())
    } catch (e) {
      console.error('Failed to save margin preset:', e)
    }
  }, [activeIndex])

  const handleSelect = (preset: MarginPreset, index: number) => {
    setActiveIndex(index)
    onPresetChange(preset)
  }

  return (
    <div className="margin-selector">
      <label className="margin-selector-label">页边距</label>
      <div className="margin-presets">
        {MARGIN_PRESETS.map((preset, index) => {
          const isActive = index === activeIndex
          return (
            <button
              key={preset.name}
              className={`margin-preset-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(preset, index)}
              title={preset.description}
            >
              <span className="preset-name">{preset.name}</span>
              <span className="preset-desc">{preset.description}</span>
            </button>
          )
        })}
      </div>
      <div className="margin-details">
        <span>上: {selectedPreset.marginTop}mm</span>
        <span>下: {selectedPreset.marginBottom}mm</span>
        <span>左: {selectedPreset.marginLeft}mm</span>
        <span>右: {selectedPreset.marginRight}mm</span>
      </div>
    </div>
  )
}

export default MarginSelector
export { MARGIN_PRESETS }
