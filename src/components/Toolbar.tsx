import React from 'react'
import './Toolbar.css'

interface ToolbarProps {
  onExportPDF: () => void
  onExportImage: () => void
  onPrint: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  onExportPDF,
  onExportImage,
  onPrint,
}) => {
  return (
    <div className="toolbar">
      <button className="toolbar-btn primary" onClick={onExportPDF}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M12 18v-6" />
          <path d="M9 15l3 3 3-3" />
        </svg>
        导出 PDF
      </button>
      <button className="toolbar-btn secondary" onClick={onExportImage}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        导出图片
      </button>
      <button className="toolbar-btn secondary" onClick={onPrint}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        打印
      </button>
    </div>
  )
}

export default Toolbar
