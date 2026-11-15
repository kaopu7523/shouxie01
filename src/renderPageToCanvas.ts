import html2canvas from 'html2canvas'
import { INK_BLUR_PX } from './preview/handwritingVariation'

const EXPORT_SCALE = 3.125 // 300 DPI (96 DPI * 3.125)

// html2canvas 1.4.1 量字体基线时硬编码了 +2 修正，画出的文字比浏览器真实排版低 1px
const HTML2CANVAS_BASELINE_ERROR_PX = 1

interface HandwrittenFont {
  name: string
  file: string
}

const html2canvasOptions = {
  scale: EXPORT_SCALE,
  useCORS: true,
  logging: false,
  backgroundColor: null,
  allowTaint: true,
}

// 只渲染纸张底色、纹理和红线
const renderPaperLayer = (page: HTMLElement) =>
  html2canvas(page, {
    ...html2canvasOptions,
    ignoreElements: (element) => element.classList.contains('page-content'),
  })

// 只渲染文字，背景透明
const renderTextLayer = (page: HTMLElement, font: HandwrittenFont) =>
  html2canvas(page, {
    ...html2canvasOptions,
    ignoreElements: (element) => element.classList.contains('paper-lines'),
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

      clonedPage.style.background = 'none'
      clonedPage.querySelectorAll<HTMLElement>('.text-line').forEach((textLine) => {
        const top = parseFloat(textLine.style.top)
        if (Number.isNaN(top)) {
          throw new Error(`文字行的 top 不是像素值: "${textLine.style.top}"`)
        }
        textLine.style.top = `${top - HTML2CANVAS_BASELINE_ERROR_PX}px`
      })
    },
  })

// 把预览中的一页 A4 渲染成 300 DPI 的 canvas，文字位置和墨迹晕染与预览保持一致
export const renderPageToCanvas = async (page: HTMLElement, font: HandwrittenFont) => {
  const pageCanvas = await renderPaperLayer(page)
  const textCanvas = await renderTextLayer(page, font)

  const context = pageCanvas.getContext('2d')
  if (!context) {
    throw new Error('无法获取导出 canvas 的 2D 绘图上下文')
  }
  // html2canvas 不支持 CSS filter，预览里的墨迹模糊要在这里补上
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.filter = `blur(${INK_BLUR_PX * EXPORT_SCALE}px)`
  context.drawImage(textCanvas, 0, 0)

  return pageCanvas
}
