import React, { useState, useRef, useEffect } from 'react'
import TextInput from './components/TextInput'
import FontSelector from './components/FontSelector'
import { MARGIN_PRESETS } from './components/MarginSelector'
import PreviewArea from './components/PreviewArea'
import Toolbar from './components/Toolbar'
import './App.css'

const HANDWRITTEN_FONTS = [
  { name: '阿美手写体', file: '阿美手写体.ttf' },
  { name: '北风钢笔楷书', file: '北风钢笔楷书.ttf' },
  { name: '博洋行书二', file: '博洋行书二.ttf' },
  { name: '陈继世硬笔行书', file: '陈继世-硬笔行书.ttf' },
  { name: '戴锦好字体', file: '戴锦好字体X.ttf' },
  { name: '德彪钢笔行书', file: '德彪钢笔行书字体.ttf' },
  { name: '方正静蕾简体', file: '方正静蕾简体.ttf' },
  { name: '方正莎儿硬笔', file: '方正莎儿硬笔简体.ttf' },
  { name: '方正硬笔行书', file: '方正硬笔行书简体.ttf' },
  { name: '方正字迹朱涛简', file: '方正字迹-朱涛钢笔行书简体.ttf' },
  { name: '哈天随性体', file: '哈天随性体.ttf' },
  { name: '汉仪春然繁', file: '汉仪春然手书繁.ttf' },
  { name: '黄彦文行书', file: '黄彦文行书字体.ttf' },
  { name: '吉力手写简体', file: '吉力手写简体.ttf' },
  { name: '井柏然体', file: '井柏然体.ttf' },
  { name: '墨八岁简体', file: '墨八岁简体.ttf' },
  { name: 'SNOWREN建刚体', file: 'SNOWREN建刚体.ttf' },
  { name: '书体坊赵九江', file: '书体坊赵九江钢笔行书.ttf' },
  { name: '我的手写体', file: '我的手写体.ttf' },
  { name: '新蒂下午茶', file: '新蒂下午茶白金体.ttf' },
  { name: '星眷行草', file: '星眷硬笔书法初行草++.ttf' },
  { name: '叶根友行书', file: '叶根友钢笔行书升级版.ttf' },
]

function App() {
  const [text, setText] = useState('')
  const [selectedFont, setSelectedFont] = useState(HANDWRITTEN_FONTS[0])
  const fontSize = 24 // Fixed font size
  const marginPreset = MARGIN_PRESETS[0] // Fixed to "普通"
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  const previewRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)

  // Load font dynamically
  useEffect(() => {
    const loadFont = async (font: typeof HANDWRITTEN_FONTS[0]) => {
      if (loadedFonts.has(font.file)) return

      try {
        const fontFace = new FontFace(
          font.name,
          `url(/fonts/${font.file})`
        )
        await fontFace.load()
        document.fonts.add(fontFace)
        setLoadedFonts(prev => new Set(prev).add(font.file))
      } catch (error) {
        console.error('Failed to load font:', font.name, error)
      }
    }

    loadFont(selectedFont)
  }, [selectedFont, loadedFonts])

  const showPrintTips = () => {
    const tips = `📄 打印优化建议：

1. 纸张选择：建议使用米白色或象牙白纸张，效果更接近真实手写稿

2. 打印对比度：激光打印时可将对比度调至 85-90%，避免笔画过于黑亮

3. 已为您设置 300 DPI 高分辨率导出，打印效果更清晰自然`

    alert(tips)
  }

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const { renderPageToCanvas } = await import('./renderPageToCanvas')

    if (!previewRef.current) return

    const pages = previewRef.current.querySelectorAll('.a4-page')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement
      const canvas = await renderPageToCanvas(page, selectedFont)

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (i > 0) {
        pdf.addPage()
      }
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    }

    // Browser download
    pdf.save('会议记录.pdf')

    // Show print tips
    showPrintTips()
  }

  const handleExportImage = async () => {
    const { renderPageToCanvas } = await import('./renderPageToCanvas')

    if (!previewRef.current) return

    const pages = previewRef.current.querySelectorAll('.a4-page')

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement
      const canvas = await renderPageToCanvas(page, selectedFont)

      // Browser download
      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `会议记录_第${i + 1}页.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }

    // Show print tips
    showPrintTips()
  }

  const handlePrint = () => {
    // Show print tips before printing
    showPrintTips()

    if (!(window as any).electronAPI?.showPrintDialog) {
      // Fallback for web preview
      window.print()
      return
    }
    ;(window as any).electronAPI.showPrintDialog()
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>手写会议记录生成器</h1>
        </div>

        <Toolbar
          onExportPDF={handleExportPDF}
          onExportImage={handleExportImage}
          onPrint={handlePrint}
        />

        <div className="sidebar-content">
          <FontSelector
            fonts={HANDWRITTEN_FONTS}
            selectedFont={selectedFont}
            onFontChange={setSelectedFont}
            loadedFonts={loadedFonts}
          />

          <TextInput
            value={text}
            onChange={setText}
            placeholder="在此粘贴会议记录内容..."
          />

          <div className="stats">
            <p>字符数: {text.length}</p>
            <p>页数: {pageCount}</p>
          </div>
        </div>
      </div>

      <div className="main-content">
        <PreviewArea
          ref={previewRef}
          text={text}
          font={selectedFont}
          isFontLoaded={loadedFonts.has(selectedFont.file)}
          fontSize={fontSize}
          margins={marginPreset}
          onPageCountChange={setPageCount}
        />
      </div>
    </div>
  )
}

export default App
