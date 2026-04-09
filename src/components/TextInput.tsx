import React from 'react'
import './TextInput.css'

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const TextInput: React.FC<TextInputProps> = ({ value, onChange, placeholder }) => {
  return (
    <div className="text-input">
      <label className="text-input-label">输入内容</label>
      <textarea
        className="text-input-area"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  )
}

export default TextInput
