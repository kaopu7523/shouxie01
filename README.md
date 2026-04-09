# 手写会议记录生成器

一个用于生成手写风格会议记录的 Windows 桌面应用程序。

## 功能特点

- **内容输入**: 支持粘贴文本内容，所见即所得
- **49种手写字体**: 内置49种精选手写字体，无需联网
- **A4横线纸背景**: 模拟真实的A4横线笔记本
- **自动分页**: 根据内容自动分页，固定行距
- **导出功能**:
  - 导出为 PDF
  - 导出为 JPG/PNG 图片
  - 系统打印对话框

## 技术栈

- Electron (桌面应用框架)
- React (前端框架)
- TypeScript (类型安全)
- Vite (构建工具)
- html2canvas (截图)
- jsPDF (PDF 生成)

## 安装依赖

```bash
npm install
```

## 开发模式运行

### Web 版（推荐用于开发）

```bash
npm run dev:vite
```

或者直接运行 `dev.bat` 文件。

应用将在 http://localhost:5173 打开。

### Electron 版

```bash
npm run dev
```

## 构建生产版本

### 构建 Web 版

```bash
npm run build:vite
```

### 构建 Electron 版

```bash
npm run build:win
```

## 使用说明

1. **输入内容**: 在左侧文本框中粘贴会议记录内容
2. **选择字体**: 从字体选择器中选择合适的手写字体
3. **预览**: 右侧实时预览效果
4. **导出**:
   - 点击"导出 PDF" 生成 PDF 文件
   - 点击"导出图片" 生成 PNG/JPG 图片
   - 点击"打印"打开系统打印对话框

## 注意事项

- 字体文件位于 `public/fonts/` 目录
- 所有字体均为离线使用
- A4 纸张尺寸: 210mm × 297mm
- 行距固定为 35px (约 1cm)

## 项目结构

```
shouxie/
├── electron/           # Electron 主进程
├── public/            # 静态资源
│   └── fonts/        # 49种手写字体
├── src/              # React 源代码
│   ├── components/   # 组件
│   ├── App.tsx       # 主应用
│   └── main.tsx      # 入口文件
├── index.html        # HTML 模板
├── vite.config.ts    # Vite 配置
└── package.json      # 项目配置
```

## 许可证

ISC
