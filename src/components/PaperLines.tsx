import type { PageLayout } from '../preview/pageLayout'

interface PaperLinesProps {
  layout: PageLayout
  pageIndex: number
}

// 一页信纸的纸张纹理和红色横线
const PaperLines = ({ layout, pageIndex }: PaperLinesProps) => {
  const lineStartX = layout.contentStartX
  const lineEndX = layout.pageWidth - layout.marginRight
  const topBorderY = layout.getLineY(0) + 5
  const bottomBorderY = layout.getLineY(layout.linesPerPage - 1) + 5

  return (
    <svg className="paper-lines" width="100%" height="100%" style={{ zIndex: 1 }}>
      <defs>
        <pattern id={`texture-${pageIndex}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="#fffcf5" />
          <rect x="0" y="0" width="100" height="100" fill="url(#fibers)" />
        </pattern>

        {/* 纸张纤维 */}
        <pattern id="fibers" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
          <rect x="2" y="3" width="3" height="0.3" fill="rgba(0,0,0,0.08)" />
          <rect x="8" y="7" width="4" height="0.2" fill="rgba(0,0,0,0.06)" />
          <rect x="15" y="2" width="2" height="0.4" fill="rgba(0,0,0,0.07)" />
          <rect x="1" y="12" width="5" height="0.2" fill="rgba(0,0,0,0.05)" />
          <rect x="10" y="15" width="3" height="0.3" fill="rgba(0,0,0,0.08)" />
          <rect x="17" y="18" width="2" height="0.2" fill="rgba(0,0,0,0.06)" />
          <rect x="5" y="17" width="4" height="0.3" fill="rgba(0,0,0,0.07)" />
          <rect x="12" y="9" width="2" height="0.2" fill="rgba(0,0,0,0.05)" />
          <rect x="19" y="12" width="3" height="0.25" fill="rgba(0,0,0,0.06)" />
          <rect x="4" y="21" width="4" height="0.2" fill="rgba(0,0,0,0.055)" />
          <rect x="13" y="4" width="2" height="0.35" fill="rgba(0,0,0,0.075)" />
          <rect x="21" y="22" width="3" height="0.2" fill="rgba(0,0,0,0.065)" />
          <rect x="0" y="8" width="2" height="0.25" fill="rgba(0,0,0,0.07)" />
          <rect x="6" y="19" width="3" height="0.3" fill="rgba(0,0,0,0.058)" />
          <rect x="16" y="14" width="2" height="0.2" fill="rgba(0,0,0,0.068)" />
          {/* 颗粒 */}
          <circle cx="6" cy="6" r="0.5" fill="rgba(0,0,0,0.04)" />
          <circle cx="14" cy="11" r="0.4" fill="rgba(0,0,0,0.05)" />
          <circle cx="3" cy="16" r="0.6" fill="rgba(0,0,0,0.035)" />
          <circle cx="18" cy="5" r="0.5" fill="rgba(0,0,0,0.045)" />
          <circle cx="9" cy="20" r="0.45" fill="rgba(0,0,0,0.042)" />
          <circle cx="22" cy="15" r="0.55" fill="rgba(0,0,0,0.038)" />
          <circle cx="11" cy="2" r="0.4" fill="rgba(0,0,0,0.048)" />
          <circle cx="2" cy="23" r="0.5" fill="rgba(0,0,0,0.041)" />
          <circle cx="20" cy="0" r="0.45" fill="rgba(0,0,0,0.044)" />
          {/* 泛黄斑点 */}
          <circle cx="7" cy="13" r="1.2" fill="rgba(139,90,43,0.03)" />
          <circle cx="20" cy="8" r="0.8" fill="rgba(139,90,43,0.025)" />
          <circle cx="15" cy="22" r="1" fill="rgba(139,90,43,0.028)" />
          <circle cx="1" cy="4" r="0.9" fill="rgba(139,90,43,0.022)" />
          <circle cx="23" cy="19" r="1.1" fill="rgba(139,90,43,0.026)" />
        </pattern>

        {/* 每行底部的双红线：上虚下实 */}
        <pattern
          id={`lines-${pageIndex}`}
          x="0"
          y="0"
          width="100%"
          height={layout.lineHeight}
          patternUnits="userSpaceOnUse"
        >
          <line
            x1={lineStartX}
            y1={layout.lineHeight - 4}
            x2={lineEndX}
            y2={layout.lineHeight - 4}
            stroke="#cc4444"
            strokeWidth="0.8"
            strokeDasharray="8, 4"
          />
          <line
            x1={lineStartX}
            y1={layout.lineHeight - 1}
            x2={lineEndX}
            y2={layout.lineHeight - 1}
            stroke="#cc4444"
            strokeWidth="0.8"
          />
        </pattern>
      </defs>

      <rect className="paper-texture" x="0" y="0" width="100%" height="100%" fill={`url(#texture-${pageIndex})`} />

      {/* 双红线区域，不含首尾两条粗线 */}
      <rect
        x="0"
        y={layout.getLineY(1)}
        width="100%"
        height={layout.getLineY(layout.linesPerPage - 1) - layout.getLineY(1)}
        fill={`url(#lines-${pageIndex})`}
      />

      <line x1={lineStartX} y1={topBorderY} x2={lineEndX} y2={topBorderY} stroke="#cc4444" strokeWidth="3.5" />
      <line x1={lineStartX} y1={bottomBorderY} x2={lineEndX} y2={bottomBorderY} stroke="#cc4444" strokeWidth="3" />
    </svg>
  )
}

export default PaperLines
