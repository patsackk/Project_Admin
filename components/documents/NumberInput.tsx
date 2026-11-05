"use client"

import { useEffect, useState } from "react"

// Number inputs keep what's typed as text while editing, so "0." or an empty
// box doesn't snap back to 0 mid-typing.
export default function NumberInput({
  value,
  onChange,
  className = "",
  placeholder,
}: {
  value: number
  onChange: (n: number) => void
  className?: string
  placeholder?: string
}) {
  const [text, setText] = useState(value ? String(value) : "")
  useEffect(() => {
    if (Number(text) !== value) setText(value ? String(value) : "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <input
      type="number"
      inputMode="decimal"
      step="any"
      value={text}
      placeholder={placeholder ?? "0"}
      onChange={(e) => {
        setText(e.target.value)
        onChange(Number(e.target.value) || 0)
      }}
      className={`input px-2 py-1 text-right ${className}`}
    />
  )
}
