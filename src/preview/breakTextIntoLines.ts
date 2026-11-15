import { cannotStartLine, cannotEndLine } from './lineBreakRules'

export interface TextLine {
  text: string
  endsParagraph: boolean // 段落的最后一行，不需要写满
}

// 行尾不能留前引号、前括号：把它们连同后面的字一起挪到下一行
const splitOffTrailingOpeningPunctuation = (line: string): [string, string] => {
  let keptLength = line.length
  while (keptLength > 1 && cannotEndLine(line[keptLength - 1])) keptLength--
  return [line.slice(0, keptLength), line.slice(keptLength)]
}

// 把整段文字拆成行；fitsOnLine 判断一段文字能否写进第 lineIndex 行（各行可写宽度可以不同）
export const breakTextIntoLines = (
  text: string,
  fitsOnLine: (text: string, lineIndex: number) => boolean,
): TextLine[] => {
  const allLines: TextLine[] = []

  for (const paragraph of text.split('\n')) {
    const lines: string[] = []
    let currentLine = ''

    for (const char of paragraph.split('')) {
      const fits = fitsOnLine(currentLine + char, allLines.length + lines.length)

      // 逗号、句号等不能出现在行首：写不下也挂在本行行尾，由调用方压缩字间距消化
      if (fits || !currentLine || cannotStartLine(char)) {
        currentLine += char
        continue
      }

      const [keptOnLine, movedToNextLine] = splitOffTrailingOpeningPunctuation(currentLine)
      lines.push(keptOnLine)
      currentLine = movedToNextLine + char
    }

    lines.push(currentLine) // 空段落也占一行，保留原文的空行

    lines.forEach((lineText, i) => {
      allLines.push({ text: lineText, endsParagraph: i === lines.length - 1 })
    })
  }

  return allLines
}
