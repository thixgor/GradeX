'use client'

import { useState } from 'react'

interface StarRatingDisplayProps {
  value: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_PX: Record<NonNullable<StarRatingDisplayProps['size']>, number> = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
}

function StarShape({ size, fillId }: { size: number; fillId: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="block irish-star"
    >
      <defs>
        <linearGradient id={fillId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7DE9C" />
          <stop offset="55%" stopColor="#F0C563" />
          <stop offset="100%" stopColor="#C99837" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.4l2.94 6.06 6.66.97-4.82 4.72 1.14 6.66L12 17.74l-5.92 3.07 1.14-6.66L2.4 9.43l6.66-.97L12 2.4z"
        fill={`url(#${fillId})`}
        stroke="#B98726"
        strokeWidth="0.65"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EmptyStarShape({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="block"
    >
      <path
        d="M12 2.4l2.94 6.06 6.66.97-4.82 4.72 1.14 6.66L12 17.74l-5.92 3.07 1.14-6.66L2.4 9.43l6.66-.97L12 2.4z"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Estrelas de exibição (somente leitura) — suporta meia estrela via clip-path.
 */
export function StarRatingDisplay({ value, size = 'md', className = '' }: StarRatingDisplayProps) {
  const px = SIZE_PX[size]
  const safe = Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0))

  return (
    <div
      className={`inline-flex items-center gap-0.5 text-irish-forest dark:text-irish-gold ${className}`}
      role="img"
      aria-label={`Avaliação: ${safe.toFixed(1)} de 5`}
    >
      {[0, 1, 2, 3, 4].map(i => {
        const fillAmount = Math.max(0, Math.min(1, safe - i))
        const id = `irishstar-${i}-${px}-${Math.round(fillAmount * 100)}`
        if (fillAmount <= 0) return <EmptyStarShape key={i} size={px} />
        if (fillAmount >= 1) return <StarShape key={i} size={px} fillId={id} />
        // estrela parcial: empilha vazia + recorte da cheia
        return (
          <span key={i} className="relative inline-block" style={{ width: px, height: px }}>
            <span className="absolute inset-0">
              <EmptyStarShape size={px} />
            </span>
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillAmount * 100}%` }}
            >
              <StarShape size={px} fillId={id} />
            </span>
          </span>
        )
      })}
    </div>
  )
}

interface StarRatingInputProps {
  value: number
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void
  size?: 'md' | 'lg' | 'xl'
  disabled?: boolean
}

/**
 * Estrelas interativas (1 a 5).
 */
export function StarRatingInput({ value, onChange, size = 'lg', disabled }: StarRatingInputProps) {
  const [hover, setHover] = useState(0)
  const px = SIZE_PX[size]
  const active = hover || value

  return (
    <div
      className="inline-flex items-center gap-1.5"
      role="radiogroup"
      aria-label="Sua nota"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= active
        const id = `irishstar-input-${i}-${px}-${filled ? 1 : 0}`
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && setHover(i)}
            onFocus={() => !disabled && setHover(i)}
            onClick={() => !disabled && onChange(i as 1 | 2 | 3 | 4 | 5)}
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
            className={`p-1 rounded-md transition-transform ${
              disabled ? 'cursor-not-allowed opacity-60' : 'hover:scale-110 active:scale-95'
            }`}
          >
            {filled ? <StarShape size={px} fillId={id} /> : <EmptyStarShape size={px} />}
          </button>
        )
      })}
    </div>
  )
}
