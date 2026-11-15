// 中文排版禁则：不能出现在行首 / 行尾的标点
const PUNCTUATION_BANNED_AT_LINE_START = '。！？：；，、》】）〕”’"'
const PUNCTUATION_BANNED_AT_LINE_END = '《【（〔“‘("'

export const cannotStartLine = (char: string) => PUNCTUATION_BANNED_AT_LINE_START.includes(char)
export const cannotEndLine = (char: string) => PUNCTUATION_BANNED_AT_LINE_END.includes(char)
