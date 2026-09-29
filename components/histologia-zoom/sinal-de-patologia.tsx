/**
 * Sinal de patologia: o mesmo triângulo de alerta desenhado sobre a lâmina
 * nos achados histopatológicos (ver `sinalDePatologiaSvg`). Usado na
 * interface para que a legenda, o catálogo e a lâmina falem a mesma língua.
 */
export function SinalDePatologia({ className = 'h-4 w-4', titulo }: { className?: string; titulo?: string }) {
  return (
    <svg viewBox="-12 -13 24 22" className={className} role={titulo ? 'img' : undefined} aria-hidden={titulo ? undefined : true}>
      {titulo && <title>{titulo}</title>}
      <polygon points="0 -12.3 11.9 7.5 -11.9 7.5" fill="#f43f5e" stroke="#0b0b0b" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="-1.4" y="-6" width="2.8" height="7.6" rx="1" fill="#fff" />
      <circle cx="0" cy="4" r="1.6" fill="#fff" />
    </svg>
  )
}
