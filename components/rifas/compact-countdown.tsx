'use client'

import { useEffect, useState } from 'react'

/** Contagem regressiva compacta em uma linha (00d 00h 00m 00s). */
export function CompactCountdown({ targetDate, onComplete }: { targetDate: Date | string; onComplete?: () => void }) {
  const [text, setText] = useState<string>('')

  useEffect(() => {
    let done = false
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) {
        setText('agora')
        if (!done) {
          done = true
          onComplete?.()
        }
        return
      }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      const parts = []
      if (d > 0) parts.push(`${d}d`)
      parts.push(`${String(h).padStart(2, '0')}h`)
      parts.push(`${String(m).padStart(2, '0')}m`)
      parts.push(`${String(s).padStart(2, '0')}s`)
      setText(parts.join(' '))
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate, onComplete])

  return <span className="font-mono tabular-nums">{text}</span>
}
