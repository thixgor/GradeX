'use client'

interface DoacaoEcgAnimationProps {
  className?: string
  color?: string
  opacity?: number
}

/**
 * Traçado de ECG animado – SVG puro com CSS keyframes.
 * Representa uma linha de batimento cardíaco realista.
 */
export function DoacaoEcgAnimation({
  className = '',
  color = '#468152',
  opacity = 0.6,
}: DoacaoEcgAnimationProps) {
  return (
    <svg
      viewBox="0 0 800 80"
      preserveAspectRatio="none"
      className={`w-full pointer-events-none select-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Linha de base suave */}
      <polyline
        points="0,40 100,40 120,40 140,40 160,40"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.3"
      />
      {/* Traçado ECG: P, QRS, T */}
      <path
        className="ecg-path"
        d="
          M 0,40
          L 60,40
          L 70,36
          L 80,40
          L 110,40
          L 120,38
          L 130,20
          L 135,60
          L 140,15
          L 148,40
          L 160,40
          L 175,42
          L 190,32
          L 205,40
          L 240,40
          L 300,40
          L 310,36
          L 320,40
          L 350,40
          L 360,38
          L 370,20
          L 375,60
          L 380,15
          L 388,40
          L 400,40
          L 415,42
          L 430,32
          L 445,40
          L 480,40
          L 540,40
          L 550,36
          L 560,40
          L 590,40
          L 600,38
          L 610,20
          L 615,60
          L 620,15
          L 628,40
          L 640,40
          L 655,42
          L 670,32
          L 685,40
          L 800,40
        "
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: `drop-shadow(0 0 3px ${color})`,
        }}
      />
    </svg>
  )
}
