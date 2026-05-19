import React, { forwardRef, useEffect, useState, useImperativeHandle, useRef } from 'react'
import './PreviewArea.css'

export interface PageContent {
  lines: Array<{
    text: string
    lineHeightOffset: number // 行间距随机偏移
    letterSpacing: number // 字间距
    rotation: number // 倾斜角度
  }>
}

interface PreviewAreaProps {
  text: string
  font: { name: string; file: string }
  fontSize: number
  margins: {
    marginTop: number
    marginBottom: number
    marginLeft: number
    marginRight: number
  }
  onPageCountChange: (count: number) => void
}

interface PreviewAreaRef {
  current: HTMLDivElement | null
}

// A4 dimensions
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const MM_TO_PX = 3.7795275591 // 1mm = 3.7795px at 96 DPI

const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX
const A4_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_PX

// Common word groups that should not be broken (2-4 characters)
// These are frequently used in meeting records and should stay together
const WORD_GROUPS = [
  // 会议相关 (2 chars)
  '会议', '议题', '议程', '主持', '记录', '出席', '缺席', '表决', '通过', '否决',
  '讨论', '决定', '决议', '建议', '意见', '发言', '总结', '部署', '落实',
  // 时间相关 (2 chars)
  '上午', '下午', '晚上', '今天', '明天', '本周', '本月', '年度',
  // 单位相关 (2-3 chars)
  '支部', '委員', '支部书', '党委', '党组', '村委', '居委',
  // 地名相关 (2-3 chars)
  '会议室', '办公室', '活动室', '接待室',
  // 会议常用词组 (3-4 chars)
  '会议地点', '会议时间', '会议内容', '会议纪要', '会议主题',
  '参会人员', '列席人员', '主持人', '记录人',
  '一致通过', '集体讨论', '民主决策', '举手表决',
  '无记名', '投票表', '决结果',
  // 其他常用 (2-3 chars)
  '通知', '方案', '报告', '总结', '计划', '安排', '部署',
]

// Helper function to create page config based on font size and margins
const createPageConfig = (fontSize: number, margins: { marginTop: number; marginBottom: number; marginLeft: number; marginRight: number }) => {
  // Fixed line height optimized for 24px font
  const lineHeight = 52.8 // 24 * 2.2

  // Pre-calculate margins in pixels
  const marginTopPx = margins.marginTop * MM_TO_PX
  const marginBottomPx = margins.marginBottom * MM_TO_PX
  const marginLeftPx = margins.marginLeft * MM_TO_PX
  const marginRightPx = margins.marginRight * MM_TO_PX

  // Control first line offset - prevents first line from being too close to top
  const firstLineOffset = 5

  // Control text baseline relative to line
  const textBaselineOffset = 48 // Text position (can be fine-tuned)

  return {
    pageWidth: A4_WIDTH_PX,
    pageHeight: A4_HEIGHT_PX,
    marginTop: marginTopPx,
    marginBottom: marginBottomPx,
    marginLeft: marginLeftPx,
    marginRight: marginRightPx,
    lineHeight,
    fontSize,
    firstLineOffset,
    textBaselineOffset,

    get writableWidth() {
      return this.pageWidth - this.marginLeft - this.marginRight
    },
    get writableHeight() {
      return this.pageHeight - this.marginTop - this.marginBottom
    },
    get linesPerPage() {
      return Math.floor(this.writableHeight / this.lineHeight)
    },
    get contentStartX() {
      return this.marginLeft
    },

    // Unified: get Y position for line i
    getLineY: (i: number) => {
      return marginTopPx + firstLineOffset + i * lineHeight
    },

    // Unified: get Y position for text baseline in line i
    getTextY: (i: number) => {
      return marginTopPx + firstLineOffset + i * lineHeight - textBaselineOffset
    },
  }
}

// Check if adding a character would break a word group
const wouldBreakWord = (currentLine: string, nextChar: string): boolean => {
  // Get last 1-3 characters from current line to check if adding nextChar completes a word group
  const maxLookback = Math.min(3, currentLine.length)
  for (let i = 0; i < maxLookback; i++) {
    const suffix = currentLine.slice(-maxLookback + i)
    const testWord = suffix + nextChar

    // Check if this completes any word group
    for (const group of WORD_GROUPS) {
      if (group === testWord) {
        return true // This would break a word group
      }
      // Also check if the word group would be split (e.g., current line ends with "会议", next is "地点")
      if (group.startsWith(suffix) && suffix.length > 0) {
        // Check if adding nextChar would complete the group later
        const remaining = group.slice(suffix.length)
        if (remaining.startsWith(nextChar)) {
          return true
        }
      }
    }
  }
  return false
}

const PreviewArea = forwardRef<PreviewAreaRef, PreviewAreaProps>(
  ({ text, font, fontSize, margins, onPageCountChange }, ref) => {
    const localRef = useRef<HTMLDivElement>(null)
    const [pages, setPages] = useState<PageContent[]>([])

    useImperativeHandle(ref, () => localRef.current)

    // Process text into pages
    useEffect(() => {
      const processText = async () => {
        // Create dynamic config based on current font size and margins
        const config = createPageConfig(fontSize, margins)

        if (!text.trim()) {
          setPages([{ lines: [] }])
          onPageCountChange(1)
          return
        }

        // Ensure font is loaded before measuring
        try {
          await document.fonts.load(`${config.fontSize}px "${font.name}"`)
          await document.fonts.ready
        } catch (e) {
          console.warn('Font loading warning:', e)
        }

        // Split text into lines that fit within the page width
        // Using DOM measurement for more accurate results
        const measureElement = document.createElement('div')
        measureElement.style.position = 'absolute'
        measureElement.style.visibility = 'hidden'
        measureElement.style.whiteSpace = 'pre'
        measureElement.style.fontFamily = `"${font.name}", "KaiTi", "楷体", serif`
        measureElement.style.fontSize = `${config.fontSize}px`
        measureElement.style.lineHeight = '1'
        document.body.appendChild(measureElement)

        const MAX_WIDTH = config.writableWidth
        // Lines per page minus 1 (since we skip first line for top thick border)
        const LINES_PER_PAGE = config.linesPerPage - 1

        // Punctuation that cannot start a line (Chinese typography rule)
        const CANNOT_START_LINE = '。！？：；，、》《】））〕"'
        // Punctuation that cannot end a line (Chinese typography rule)
        const CANNOT_END_LINE = '《【（〔("'

        // Check if a character is punctuation that cannot start a line
        const cannotStartLine = (char: string) => CANNOT_START_LINE.includes(char)
        // Check if a character is punctuation that cannot end a line
        const cannotEndLine = (char: string) => CANNOT_END_LINE.includes(char)

        // First split by newlines to preserve paragraphs
        const paragraphs = text.split('\n')
        const allLines: string[] = []

        for (const paragraph of paragraphs) {
          if (!paragraph) {
            // Empty line - preserve it
            allLines.push('')
            continue
          }

          const chars = paragraph.split('')
          const lines: string[] = []
          let currentLine = ''

          for (const char of chars) {
            const testLine = currentLine + char
            measureElement.textContent = testLine
            const width = measureElement.offsetWidth

            // Check if we need to break the line
            if (width > MAX_WIDTH && currentLine) {
              // Check if breaking here would split a word group
              const wouldBreakGroup = wouldBreakWord(currentLine, char)
              // Check if the next character would be problematic at line start
              // OR if breaking here would split a word group
              if (cannotStartLine(char) || wouldBreakGroup) {
                // Try to keep this punctuation with the previous line
                // Look for a good breakpoint from the end of the line
                let foundBreakpoint = false
                const searchStart = Math.max(0, currentLine.length - 10)

                for (let i = currentLine.length - 1; i >= searchStart; i--) {
                  const testChar = currentLine[i]
                  if (!cannotEndLine(testChar)) {
                    // Break after this character
                    // Put testChar and everything before on current line
                    // Put everything after + the new char on next line
                    lines.push(currentLine.slice(0, i + 1))
                    currentLine = currentLine.slice(i + 1) + char
                    foundBreakpoint = true
                    break
                  }
                }

                if (!foundBreakpoint && currentLine.length > 1) {
                  // Last resort: break at first character if line is long enough
                  lines.push(currentLine.slice(0, 1))
                  currentLine = currentLine.slice(1) + char
                } else if (!foundBreakpoint) {
                  // Line too short, force overflow
                  lines.push(currentLine)
                  currentLine = char
                }
              } else {
                // Normal break, but check if it would leave a problematic char at start
                const nextLineStart = char
                if (cannotStartLine(nextLineStart)) {
                  // The new line would start with problematic punctuation
                  // Find a better breakpoint
                  let foundBreakpoint = false
                  const searchStart = Math.max(0, currentLine.length - 10)

                  for (let i = currentLine.length - 1; i >= searchStart; i--) {
                    const testChar = currentLine[i]
                    if (!cannotEndLine(testChar)) {
                      lines.push(currentLine.slice(0, i + 1))
                      currentLine = currentLine.slice(i + 1) + char
                      foundBreakpoint = true
                      break
                    }
                  }

                  if (!foundBreakpoint && currentLine.length > 1) {
                    lines.push(currentLine.slice(0, 1))
                    currentLine = currentLine.slice(1) + char
                  } else if (!foundBreakpoint) {
                    // Force overflow
                    lines.push(currentLine)
                    currentLine = char
                  }
                } else {
                  // Safe to break normally
                  lines.push(currentLine)
                  currentLine = char
                }
              }
            } else {
              currentLine = testLine
            }
          }

          // Add the last line of this paragraph
          if (currentLine) {
            lines.push(currentLine)
          }

          // Post-process: fix any lines that start with problematic punctuation
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            if (line && cannotStartLine(line[0])) {
              // This line starts with punctuation that shouldn't be here
              // Try to move it to the end of the previous line
              const prevLine = lines[i - 1]

              if (prevLine && prevLine.length > 0) {
                // Check if we can safely take a character from the end of previous line
                const lastChar = prevLine[prevLine.length - 1]
                if (!cannotEndLine(lastChar)) {
                  // Move the punctuation to the previous line
                  lines[i - 1] = prevLine + line[0]
                  lines[i] = line.slice(1)
                } else if (prevLine.length > 1) {
                  // Take the last character(s) from previous line
                  // Find a good split point in previous line
                  let foundSplit = false
                  for (let j = prevLine.length - 2; j >= Math.max(0, prevLine.length - 5); j--) {
                    if (!cannotEndLine(prevLine[j])) {
                      lines[i - 1] = prevLine.slice(0, j + 1) + line[0]
                      lines[i] = prevLine.slice(j + 1) + line.slice(1)
                      foundSplit = true
                      break
                    }
                  }
                  if (!foundSplit) {
                    // Last resort: just append
                    lines[i - 1] = prevLine + line[0]
                    lines[i] = line.slice(1)
                  }
                }
              }
            }
          }

          // Post-process: fix broken word groups
          // Check if a line starts with a character that completes a word group from previous line
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            const prevLine = lines[i - 1]

            if (!line || !prevLine || line.length === 0 || prevLine.length === 0) continue

            // Check if first character of current line combines with end of previous line to form a word group
            const maxLookback = Math.min(3, prevLine.length)
            for (let lookback = 1; lookback <= maxLookback; lookback++) {
              const suffix = prevLine.slice(-lookback)
              const testWord = suffix + line[0]

              // Check if this forms a word group
              for (const group of WORD_GROUPS) {
                if (group === testWord) {
                  // Found a broken word group! Move the character to previous line
                  lines[i - 1] = prevLine + line[0]
                  lines[i] = line.slice(1)

                  // Check if the modified previous line now exceeds width
                  measureElement.textContent = lines[i - 1]
                  if (measureElement.offsetWidth > MAX_WIDTH) {
                    // Revert: can't fit, leave it broken
                    lines[i - 1] = prevLine
                    lines[i] = line
                  }
                  break
                }
              }
            }
          }

          allLines.push(...lines)
        }

        document.body.removeChild(measureElement)

        // 伪随机函数，基于索引生成稳定的"随机"值
        const pseudoRandom = (index: number) => {
          const x = Math.sin(index * 12.9898) * 43758.5453
          return x - Math.floor(x)
        }

        // 为每一行添加随机参数
        const linesWithRandomParams = allLines.map((text, index) => ({
          text,
          lineHeightOffset: (pseudoRandom(index) - 0.5) * 4, // ±2px 行间距偏移
          letterSpacing: (pseudoRandom(index + 1000) - 0.5) * 3, // ±1.5px 字间距
          rotation: (pseudoRandom(index + 2000) - 0.5) * 0.8, // ±0.4° 倾斜角度
        }))

        // Split into pages
        const newPages: PageContent[] = []
        for (let i = 0; i < linesWithRandomParams.length; i += LINES_PER_PAGE) {
          newPages.push({
            lines: linesWithRandomParams.slice(i, i + LINES_PER_PAGE),
          })
        }

        setPages(newPages)
        onPageCountChange(newPages.length)
      }

      processText()
    }, [text, font, fontSize, margins, onPageCountChange])

    return (
      <div ref={localRef} className="preview-area">
        {(() => {
          const config = createPageConfig(fontSize, margins)
          return pages.map((page, pageIndex) => (
            <div
              key={pageIndex}
              className="a4-page"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 0, 0, 0.04) 3px, rgba(0, 0, 0, 0.04) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0, 0, 0, 0.035) 3px, rgba(0, 0, 0, 0.035) 4px), #fffcf5',
              }}
            >
              <svg className="paper-lines" width="100%" height="100%" style={{ zIndex: 1 }}>
                <defs>
                  {/* Paper texture with fiber effect */}
                  <pattern
                    id={`texture-${pageIndex}`}
                    x="0"
                    y="0"
                    width="100"
                    height="100"
                    patternUnits="userSpaceOnUse"
                  >
                    {/* Base paper color */}
                    <rect width="100" height="100" fill="#fffcf5"/>
                    {/* Fine fiber texture */}
                    <rect x="0" y="0" width="100" height="100" fill="url(#fibers)"/>
                  </pattern>

                  {/* Fiber pattern - enhanced visibility */}
                  <pattern
                    id="fibers"
                    x="0"
                    y="0"
                    width="25"
                    height="25"
                    patternUnits="userSpaceOnUse"
                  >
                    {/* Random fiber marks - much more visible */}
                    <rect x="2" y="3" width="3" height="0.3" fill="rgba(0,0,0,0.08)"/>
                    <rect x="8" y="7" width="4" height="0.2" fill="rgba(0,0,0,0.06)"/>
                    <rect x="15" y="2" width="2" height="0.4" fill="rgba(0,0,0,0.07)"/>
                    <rect x="1" y="12" width="5" height="0.2" fill="rgba(0,0,0,0.05)"/>
                    <rect x="10" y="15" width="3" height="0.3" fill="rgba(0,0,0,0.08)"/>
                    <rect x="17" y="18" width="2" height="0.2" fill="rgba(0,0,0,0.06)"/>
                    <rect x="5" y="17" width="4" height="0.3" fill="rgba(0,0,0,0.07)"/>
                    <rect x="12" y="9" width="2" height="0.2" fill="rgba(0,0,0,0.05)"/>
                    <rect x="19" y="12" width="3" height="0.25" fill="rgba(0,0,0,0.06)"/>
                    <rect x="4" y="21" width="4" height="0.2" fill="rgba(0,0,0,0.055)"/>
                    <rect x="13" y="4" width="2" height="0.35" fill="rgba(0,0,0,0.075)"/>
                    <rect x="21" y="22" width="3" height="0.2" fill="rgba(0,0,0,0.065)"/>
                    <rect x="0" y="8" width="2" height="0.25" fill="rgba(0,0,0,0.07)"/>
                    <rect x="6" y="19" width="3" height="0.3" fill="rgba(0,0,0,0.058)"/>
                    <rect x="16" y="14" width="2" height="0.2" fill="rgba(0,0,0,0.068)"/>
                    {/* Dots for grain - more visible */}
                    <circle cx="6" cy="6" r="0.5" fill="rgba(0,0,0,0.04)"/>
                    <circle cx="14" cy="11" r="0.4" fill="rgba(0,0,0,0.05)"/>
                    <circle cx="3" cy="16" r="0.6" fill="rgba(0,0,0,0.035)"/>
                    <circle cx="18" cy="5" r="0.5" fill="rgba(0,0,0,0.045)"/>
                    <circle cx="9" cy="20" r="0.45" fill="rgba(0,0,0,0.042)"/>
                    <circle cx="22" cy="15" r="0.55" fill="rgba(0,0,0,0.038)"/>
                    <circle cx="11" cy="2" r="0.4" fill="rgba(0,0,0,0.048)"/>
                    <circle cx="2" cy="23" r="0.5" fill="rgba(0,0,0,0.041)"/>
                    <circle cx="20" cy="0" r="0.45" fill="rgba(0,0,0,0.044)"/>
                    {/* Irregular aging spots - more visible */}
                    <circle cx="7" cy="13" r="1.2" fill="rgba(139,90,43,0.03)"/>
                    <circle cx="20" cy="8" r="0.8" fill="rgba(139,90,43,0.025)"/>
                    <circle cx="15" cy="22" r="1" fill="rgba(139,90,43,0.028)"/>
                    <circle cx="1" cy="4" r="0.9" fill="rgba(139,90,43,0.022)"/>
                    <circle cx="23" cy="19" r="1.1" fill="rgba(139,90,43,0.026)"/>
                  </pattern>

                  {/* Traditional Chinese double red line pattern */}
                  <pattern
                    id={`lines-${pageIndex}`}
                    x="0"
                    y="0"
                    width="100%"
                    height={config.lineHeight}
                    patternUnits="userSpaceOnUse"
                  >
                    {/* Double red lines at bottom - dashed + solid */}
                    {/* Upper red line - dashed */}
                    <line
                      x1={config.contentStartX}
                      y1={config.lineHeight - 4}
                      x2={config.pageWidth - config.marginRight}
                      y2={config.lineHeight - 4}
                      stroke="#cc4444"
                      strokeWidth="0.8"
                      strokeDasharray="8, 4"
                    />
                    {/* Lower red line - solid */}
                    <line
                      x1={config.contentStartX}
                      y1={config.lineHeight - 1}
                      x2={config.pageWidth - config.marginRight}
                      y2={config.lineHeight - 1}
                      stroke="#cc4444"
                      strokeWidth="0.8"
                    />
                  </pattern>
                </defs>

                {/* Paper texture background */}
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill={`url(#texture-${pageIndex})`}
                />

                {/* Double red lines pattern - exclude first and last line */}
                <rect
                  x="0"
                  y={config.getLineY(1)}
                  width="100%"
                  height={config.getLineY(config.linesPerPage - 1) - config.getLineY(1)}
                  fill={`url(#lines-${pageIndex})`}
                />

                {/* Top thick border line - with 5px visual adjustment */}
                <line
                  x1={config.contentStartX}
                  y1={config.getLineY(0) + 5}
                  x2={config.pageWidth - config.marginRight}
                  y2={config.getLineY(0) + 5}
                  stroke="#cc4444"
                  strokeWidth="3.5"
                />

                {/* Bottom thick border line - with 5px visual adjustment */}
                <line
                  x1={config.contentStartX}
                  y1={config.getLineY(config.linesPerPage - 1) + 5}
                  x2={config.pageWidth - config.marginRight}
                  y2={config.getLineY(config.linesPerPage - 1) + 5}
                  stroke="#cc4444"
                  strokeWidth="3"
                />
              </svg>

              <div
                className="page-content"
                style={{
                  fontFamily: `"${font.name}", "KaiTi", "楷体", serif`,
                  fontSize: `${config.fontSize}px`,
                  color: '#2c2c2c', // 深灰色，接近钢笔墨色
                  filter: 'blur(0.3px)', // 轻微模糊，模拟墨水晕染
                  height: `${config.writableHeight}px`,
                  marginTop: `${config.marginTop}px`,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  zIndex: 2,
                }}
              >
                {page.lines.map((line, lineIndex) => {
                  // Text should start from first double line (lineIndex 1), not top thick border (lineIndex 0)
                  const textLineIndex = lineIndex + 1

                  const baseTextY = config.getTextY(textLineIndex) - config.marginTop
                  // 应用行间距随机偏移
                  const textY = baseTextY + line.lineHeightOffset

                  return (
                    <div
                      key={lineIndex}
                      className="text-line"
                      style={{
                        position: 'absolute',
                        top: `${textY}px`,
                        left: `${config.contentStartX}px`,
                        height: `${config.lineHeight}px`,
                        display: 'flex',
                        alignItems: 'flex-end',
                        letterSpacing: `${line.letterSpacing}px`, // 字间距
                        transform: `rotate(${line.rotation}deg)`, // 倾斜角度
                        transformOrigin: 'left bottom',
                      }}
                    >
                      {line.text}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        })()}
      </div>
    )
  }
)

PreviewArea.displayName = 'PreviewArea'

export default PreviewArea
