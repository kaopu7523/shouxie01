// ===== 手写随机程度，打印后觉得太假或太乱就调这里 =====
const CHAR_DRIFT_Y_PX = 2 // 一行内基线缓慢上飘/下沉的幅度
const CHAR_JITTER_Y_PX = 0.5 // 单个字额外的高低抖动
const CHAR_ROTATION_DEG = 2.5 // 单个字的歪斜幅度
const CHAR_SCALE_RANGE = 0.05 // 字的大小变化幅度（±5%）
const CHAR_GAP_JITTER_PX = 1 // 相邻两个字间距的出入
const INK_OPACITY_MIN = 0.7 // 最淡的墨色（1 为最浓）
const LINE_START_JITTER_PX = 3 // 每行起笔位置的左右出入
const LINE_END_SLACK_MAX_PX = 12 // 每行右侧最多提前留出的空白（半个字）
export const INK_BLUR_PX = 0.3 // 墨水晕染的模糊半径

export interface HandwrittenChar {
  char: string
  gapAfter: number
  offsetY: number
  rotation: number
  scale: number
  inkOpacity: number
}

export interface HandwrittenLine {
  chars: HandwrittenChar[]
  startOffsetX: number
  lineOffsetY: number
  rotation: number
}

// 由种子决定的伪随机数（0~1）：同一份文字每次生成的手写效果相同
const stableRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// -1 ~ 1
const stableRandomSigned = (seed: number) => stableRandom(seed) * 2 - 1

// 相邻值之间有惯性的缓慢漂移，取值始终在 ±amplitude 内
const driftSequence = (length: number, amplitude: number, seed: number) => {
  const INERTIA = 0.8
  const values: number[] = []
  let value = stableRandomSigned(seed) * amplitude
  for (let i = 0; i < length; i++) {
    value = value * INERTIA + stableRandomSigned(seed + i + 1) * amplitude * (1 - INERTIA)
    values.push(value)
  }
  return values
}

// 第 lineIndex 行右侧提前留出的空白，让各行行尾参差不齐
export const lineEndSlack = (lineIndex: number) => stableRandom(lineIndex + 4000) * LINE_END_SLACK_MAX_PX

// 第 lineIndex 行整体的字间距（±1.5px）：有的行写得松，有的行写得挤
export const lineLetterSpacing = (lineIndex: number) => (stableRandom(lineIndex + 1000) - 0.5) * 3

// extraLetterSpacing：在该行本身的字间距之外，每个字后面再加的间距
export const toHandwrittenLine = (text: string, lineIndex: number, extraLetterSpacing: number): HandwrittenLine => {
  const chars = text.split('')
  const charSeed = lineIndex * 10007
  const baselineDrift = driftSequence(chars.length, CHAR_DRIFT_Y_PX, charSeed)
  const rotationDrift = driftSequence(chars.length, CHAR_ROTATION_DEG / 2, charSeed + 2000)
  const scaleDrift = driftSequence(chars.length, CHAR_SCALE_RANGE, charSeed + 4000)
  const inkDrift = driftSequence(chars.length, 1, charSeed + 6000)

  return {
    chars: chars.map((char, i) => ({
      char,
      gapAfter: lineLetterSpacing(lineIndex) + extraLetterSpacing + stableRandomSigned(charSeed + 7000 + i) * CHAR_GAP_JITTER_PX,
      offsetY: baselineDrift[i] + stableRandomSigned(charSeed + 8000 + i) * CHAR_JITTER_Y_PX,
      rotation: rotationDrift[i] + stableRandomSigned(charSeed + 9000 + i) * (CHAR_ROTATION_DEG / 2),
      scale: 1 + scaleDrift[i],
      inkOpacity: INK_OPACITY_MIN + ((inkDrift[i] + 1) / 2) * (1 - INK_OPACITY_MIN),
    })),
    startOffsetX: stableRandomSigned(lineIndex + 3000) * (LINE_START_JITTER_PX / 2),
    lineOffsetY: (stableRandom(lineIndex) - 0.5) * 4, // ±2px 行间距偏移
    rotation: (stableRandom(lineIndex + 2000) - 0.5) * 0.8, // ±0.4° 整行倾斜
  }
}
