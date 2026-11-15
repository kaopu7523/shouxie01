import { forwardRef, useEffect, useState } from 'react'
import PaperLines from './PaperLines'
import { breakTextIntoLines } from '../preview/breakTextIntoLines'
import { INK_BLUR_PX, lineEndSlack, lineLetterSpacing, toHandwrittenLine } from '../preview/handwritingVariation'
import type { HandwrittenLine } from '../preview/handwritingVariation'
import { createPageLayout } from '../preview/pageLayout'
import type { PageMargins } from '../preview/pageLayout'
import './PreviewArea.css'

interface PreviewAreaProps {
  text: string
  font: { name: string; file: string }
  isFontLoaded: boolean
  fontSize: number
  margins: PageMargins
  onPageCountChange: (count: number) => void
}

const INK_COLOR_RGB = '44, 44, 44' // 深灰，接近钢笔墨色

const PreviewArea = forwardRef<HTMLDivElement, PreviewAreaProps>(
  ({ text, font, isFontLoaded, fontSize, margins, onPageCountChange }, ref) => {
    const [pages, setPages] = useState<HandwrittenLine[][]>([])
    const layout = createPageLayout(fontSize, margins)
    const fontFamily = `"${font.name}", "KaiTi", "楷体", serif`

    // 把文字排成一页页的手写行
    useEffect(() => {
      const paginateText = () => {
        if (!text.trim()) {
          setPages([[]])
          onPageCountChange(1)
          return
        }

        // 字体没加载完就测量宽度，换行位置会按后备字体算错，行尾会空出一截；
        // 等 isFontLoaded 变为 true 时这里会重新执行
        if (!isFontLoaded) return

        const measureElement = document.createElement('div')
        measureElement.style.position = 'absolute'
        measureElement.style.visibility = 'hidden'
        measureElement.style.whiteSpace = 'pre'
        measureElement.style.fontFamily = fontFamily
        measureElement.style.fontSize = `${fontSize}px`
        measureElement.style.lineHeight = '1'
        document.body.appendChild(measureElement)

        const pageLayout = createPageLayout(fontSize, margins)
        // 第 lineIndex 行写完 lineText 后右侧还剩多少宽度（负数表示写不下）
        const widthLeftOnLine = (lineText: string, lineIndex: number) => {
          measureElement.textContent = lineText
          // 字间距也占宽度：不算进去的话，写得挤的行会在行尾空出两三个字
          const writtenWidth = measureElement.offsetWidth + lineText.length * lineLetterSpacing(lineIndex)
          return pageLayout.writableWidth - lineEndSlack(lineIndex) - writtenWidth
        }

        const textLines = breakTextIntoLines(text, (lineText, lineIndex) => widthLeftOnLine(lineText, lineIndex) >= 0)

        // 把行尾的零头摊进字间距，让每一行正好写到行尾；
        // 段落最后一行不拉宽，只在超宽（行尾挂了标点）时压缩
        const handwrittenLines = textLines.map(({ text: lineText, endsParagraph }, lineIndex) => {
          const widthLeft = widthLeftOnLine(lineText, lineIndex)
          const widthToAbsorb = endsParagraph ? Math.min(0, widthLeft) : widthLeft
          const gapCount = lineText.length - 1
          return toHandwrittenLine(lineText, lineIndex, gapCount > 0 ? widthToAbsorb / gapCount : 0)
        })
        document.body.removeChild(measureElement)

        // 每页第一条是顶部粗线，不写字
        const textLinesPerPage = pageLayout.linesPerPage - 1
        const newPages: HandwrittenLine[][] = []
        for (let i = 0; i < handwrittenLines.length; i += textLinesPerPage) {
          newPages.push(handwrittenLines.slice(i, i + textLinesPerPage))
        }

        setPages(newPages)
        onPageCountChange(newPages.length)
      }

      paginateText()
    }, [text, isFontLoaded, fontFamily, fontSize, margins, onPageCountChange])

    return (
      <div ref={ref} className="preview-area">
        {pages.map((pageLines, pageIndex) => (
          <div
            key={pageIndex}
            className="a4-page"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 0, 0, 0.04) 3px, rgba(0, 0, 0, 0.04) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0, 0, 0, 0.035) 3px, rgba(0, 0, 0, 0.035) 4px), #fffcf5',
            }}
          >
            <PaperLines layout={layout} pageIndex={pageIndex} />

            <div
              className="page-content"
              style={{
                fontFamily,
                fontSize: `${layout.fontSize}px`,
                filter: `blur(${INK_BLUR_PX}px)`, // 模拟墨水晕染
                height: `${layout.writableHeight}px`,
                marginTop: `${layout.marginTop}px`,
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 2,
              }}
            >
              {pageLines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className="text-line"
                  style={{
                    position: 'absolute',
                    // 文字从第一条双红线（第 1 行）开始写，第 0 行是顶部粗线
                    top: `${layout.getTextY(lineIndex + 1) - layout.marginTop + line.lineOffsetY}px`,
                    left: `${layout.contentStartX + line.startOffsetX}px`,
                    height: `${layout.lineHeight}px`,
                    transform: `rotate(${line.rotation}deg)`,
                    transformOrigin: 'left bottom',
                  }}
                >
                  {line.chars.map((handwrittenChar, charIndex) => (
                    <span
                      key={charIndex}
                      style={{
                        marginRight: `${handwrittenChar.gapAfter.toFixed(2)}px`,
                        color: `rgba(${INK_COLOR_RGB}, ${handwrittenChar.inkOpacity.toFixed(2)})`,
                        transform: `translateY(${handwrittenChar.offsetY.toFixed(2)}px) rotate(${handwrittenChar.rotation.toFixed(2)}deg) scale(${handwrittenChar.scale.toFixed(3)})`,
                        transformOrigin: 'center 75%',
                      }}
                    >
                      {handwrittenChar.char}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  },
)

PreviewArea.displayName = 'PreviewArea'

export default PreviewArea
