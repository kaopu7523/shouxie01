import html2canvas from 'html2canvas'

const EXPORT_SCALE = 3.125 // 300 DPI (96 DPI * 3.125)

// html2canvas 1.4.1 量字体基线时硬编码了 +2 修正，画出的文字比浏览器真实排版低 1px
const HTML2CANVAS_BASELINE_ERROR_PX = 1

interface HandwrittenFont {
  name: string
  file: string
}

// 把预览中的一页 A4 渲染成 300 DPI 的 canvas，文字位置与预览保持一致
export const renderPageToCanvas = (page: HTMLElement, font: HandwrittenFont) =>
  html2canvas(page, {
    scale: EXPORT_SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: null,
    allowTaint: true,
    onclone: async (clonedDocument, clonedPage) => {
      // 手写字体是用 FontFace API 加到主文档的，html2canvas 的克隆文档里没有它，
      // 不补上的话克隆文档会按后备字体排版，文字的垂直位置就和预览不一样
      const clonedWindow = clonedDocument.defaultView
      if (!clonedWindow) {
        throw new Error('html2canvas 的克隆文档没有关联的 window，无法加载字体')
      }
      const fontFace = new clonedWindow.FontFace(font.name, `url(/fonts/${font.file})`)
      await fontFace.load()
      clonedDocument.fonts.add(fontFace)

      clonedPage.querySelectorAll<HTMLElement>('.text-line').forEach((textLine) => {
        const top = parseFloat(textLine.style.top)
        if (Number.isNaN(top)) {
          throw new Error(`文字行的 top 不是像素值: "${textLine.style.top}"`)
        }
        textLine.style.top = `${top - HTML2CANVAS_BASELINE_ERROR_PX}px`
      })
    },
  })
