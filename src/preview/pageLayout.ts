const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const MM_TO_PX = 3.7795275591 // 96 DPI 下 1mm 对应的像素

export interface PageMargins {
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
}

// 根据字号和页边距（mm）算出一页 A4 上横线与文字的位置（px）
export const createPageLayout = (fontSize: number, margins: PageMargins) => {
  const lineHeight = 52.8 // 针对 24px 字号调好的行高（24 * 2.2）
  const firstLineOffset = 5 // 避免第一条线太贴近上边距
  const textBaselineOffset = 48 // 文字相对横线的位置

  const pageWidth = A4_WIDTH_MM * MM_TO_PX
  const pageHeight = A4_HEIGHT_MM * MM_TO_PX
  const marginTop = margins.marginTop * MM_TO_PX
  const marginBottom = margins.marginBottom * MM_TO_PX
  const marginLeft = margins.marginLeft * MM_TO_PX
  const marginRight = margins.marginRight * MM_TO_PX
  const writableHeight = pageHeight - marginTop - marginBottom

  const getLineY = (i: number) => marginTop + firstLineOffset + i * lineHeight

  return {
    pageWidth,
    marginTop,
    marginRight,
    lineHeight,
    fontSize,
    writableWidth: pageWidth - marginLeft - marginRight,
    writableHeight,
    linesPerPage: Math.floor(writableHeight / lineHeight),
    contentStartX: marginLeft,
    getLineY,
    getTextY: (i: number) => getLineY(i) - textBaselineOffset,
  }
}

export type PageLayout = ReturnType<typeof createPageLayout>
