import React, { useState, useEffect } from 'react'
import './FontSelector.css'

interface Font {
  name: string
  file: string
}

interface FontSelectorProps {
  fonts: Font[]
  selectedFont: Font
  onFontChange: (font: Font) => void
  loadedFonts: Set<string>
}

const STORAGE_KEY = 'favoriteFonts'

const getFavoriteFonts = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

const saveFavoriteFonts = (favorites: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]))
  } catch (e) {
    console.error('Failed to save favorite fonts:', e)
  }
}

const FontSelector: React.FC<FontSelectorProps> = ({
  fonts,
  selectedFont,
  onFontChange,
  loadedFonts,
}) => {
  const [favorites, setFavorites] = useState<Set<string>>(() => getFavoriteFonts())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Sync favorites with localStorage
  useEffect(() => {
    saveFavoriteFonts(favorites)
  }, [favorites])

  const toggleFavorite = (fontFile: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(fontFile)) {
        newFavorites.delete(fontFile)
      } else {
        newFavorites.add(fontFile)
      }
      return newFavorites
    })
  }

  // Sort fonts: favorites first, then others
  const sortedFonts = [...fonts].sort((a, b) => {
    const aFav = favorites.has(a.file)
    const bFav = favorites.has(b.file)
    if (aFav && !bFav) return -1
    if (!aFav && bFav) return 1
    return a.name.localeCompare(b.name, 'zh-CN')
  })

  // Filter by favorites if enabled
  const displayedFonts = showFavoritesOnly
    ? sortedFonts.filter((f) => favorites.has(f.file))
    : sortedFonts

  const favoriteCount = favorites.size

  return (
    <div className="font-selector">
      <div className="font-selector-header">
        <label className="font-selector-label">选择字体</label>
        {favoriteCount > 0 && (
          <button
            className={`favorites-filter-btn ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            title={showFavoritesOnly ? '显示全部字体' : '只显示收藏'}
          >
            {showFavoritesOnly ? `全部 (${fonts.length})` : `收藏 (${favoriteCount})`}
          </button>
        )}
      </div>

      <div className="font-list">
        {displayedFonts.map((font) => {
          const isFavorite = favorites.has(font.file)
          const isSelected = selectedFont.file === font.file

          return (
            <div
              key={font.file}
              className={`font-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onFontChange(font)}
            >
              <button
                className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
                onClick={(e) => toggleFavorite(font.file, e)}
                title={isFavorite ? '取消收藏' : '收藏'}
              >
                <span className="star-icon">{isFavorite ? '★' : '☆'}</span>
              </button>
              <span className="font-name">{font.name}</span>
              {isSelected && <span className="selected-indicator">✓</span>}
            </div>
          )
        })}
      </div>

      <div className="font-preview" style={{ fontFamily: selectedFont.name }}>
        {loadedFonts.has(selectedFont.file)
          ? '字体预览：这是一段示例文字'
          : '字体加载中...'}
      </div>
    </div>
  )
}

export default FontSelector
