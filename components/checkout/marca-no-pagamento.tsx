'use client'

import { LogoAnimada } from '@/components/marca/logo-animada'
import './checkout-vidro.css'

/**
 * Os dois momentos da marca no pagamento.
 *
 * - `QrDoPix`: enquanto o Pix é gerado, a moeda da DomineAqui gira no meio de
 *   um QR que "imprime" em laço; quando o código chega, a impressão termina,
 *   a moeda sai do caminho e o QR de verdade aparece sob uma passada de
 *   leitura. A espera vira o produto trabalhando, não uma tela parada.
 * - `SeloDePago`: a moeda gira de frente, o check verde pousa nela e dois aros
 *   se abrem com faíscas nas cores da marca. Uma vez, ~1,5 s.
 *
 * Tudo em CSS (`checkout-vidro.css`), com o caminho calmo para quem pede menos
 * movimento: o QR aparece pronto e o selo nasce parado.
 *
 * O QR real nunca leva a marca por cima: o código do Mercado Pago não reserva
 * área para logo, e cobrir módulos dele é arriscar a leitura no app do banco.
 */

const N = 25

/** Um QR de mentira, sempre o mesmo, com os três olhos e o miolo vazio. */
const ESQUELETO = (() => {
  const mods: { x: number; y: number; d: number }[] = []
  const olho = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)
  const miolo = (x: number, y: number) => Math.abs(x - 12) <= 4 && Math.abs(y - 12) <= 4
  let h = 2166136261
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      h = Math.imul(h ^ (x * 31 + y * 17 + 7), 16777619) >>> 0
      if (olho(x, y) || miolo(x, y)) continue
      if (h % 100 < 47) mods.push({ x, y, d: y * 60 + ((h >> 8) % 240) })
    }
  }
  return mods
})()

const OLHOS = [
  [0, 0],
  [N - 7, 0],
  [0, N - 7],
] as const

export function QrDoPix({ base64, className = '' }: { base64?: string | null; className?: string }) {
  const fase = base64 ? 'pronto' : 'gerando'
  return (
    <div className={`ck-qr ${className}`} data-fase={fase}>
      <span className="ck-qr-mira" aria-hidden />
      <svg viewBox={`0 0 ${N} ${N}`} className="ck-qr-esqueleto" aria-hidden focusable="false">
        {ESQUELETO.map((m) => (
          <rect
            key={`${m.x}-${m.y}`}
            className="ck-qr-mod"
            x={m.x + 0.08}
            y={m.y + 0.08}
            width={0.84}
            height={0.84}
            rx={0.22}
            style={{ '--d': m.d } as React.CSSProperties}
          />
        ))}
        {OLHOS.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect className="ck-qr-olho" x={x + 0.5} y={y + 0.5} width={6} height={6} rx={1.6} />
            <rect className="ck-qr-pupila" x={x + 2} y={y + 2} width={3} height={3} rx={0.8} />
          </g>
        ))}
      </svg>
      {base64 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`data:image/png;base64,${base64}`} alt="QR Code do Pix" className="ck-qr-real" />
      )}
      <span className="ck-qr-feixe" aria-hidden />
      <span className="ck-qr-logo" aria-hidden>
        <LogoAnimada tamanho="heroi" nome={false} modo="gerando" flutua={false} inclinacao="nenhuma" />
      </span>
    </div>
  )
}

const FAISCAS = [
  { a: 0, r: 78, cor: '#468152' },
  { a: 32, r: 66, cor: '#e8a944' },
  { a: 64, r: 82, cor: '#dc6a3a' },
  { a: 100, r: 70, cor: '#5aa66b' },
  { a: 136, r: 80, cor: '#f0bd5e' },
  { a: 172, r: 64, cor: '#468152' },
  { a: 208, r: 78, cor: '#dc6a3a' },
  { a: 244, r: 68, cor: '#e8a944' },
  { a: 280, r: 82, cor: '#5aa66b' },
  { a: 316, r: 66, cor: '#f0bd5e' },
]

export function SeloDePago({ className = '' }: { className?: string }) {
  return (
    <div className={`ck-pago ${className}`} role="img" aria-label="Pagamento aprovado">
      <span className="ck-pago-aro" aria-hidden />
      <span className="ck-pago-aro" aria-hidden />
      {FAISCAS.map((f, i) => (
        <span
          key={i}
          className="ck-pago-faisca"
          style={{ '--a': `${f.a}deg`, '--r': `${f.r}px`, '--cor': f.cor } as React.CSSProperties}
          aria-hidden
        />
      ))}
      <LogoAnimada tamanho="heroi" nome={false} flutua={false} inclinacao="nenhuma" />
      <span className="ck-pago-check" aria-hidden>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          <path d="M5.5 12.5l4.2 4.2 8.8-9.4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  )
}
