'use client'

import { useEffect, useId, useRef } from 'react'
import { LETRAS, MARCA } from './marca-caminhos'

/** Fatias da espessura. Cada uma é um `<use>` da mesma silhueta: barato. */
const FATIAS = 10

type Tamanho = 'heroi' | 'compacto'

/**
 * A logo das telas de entrar, em 3D e montando-se sozinha.
 *
 * A sequência é toda em CSS (`app/auth/auth.css`, bloco "Logo 3D"), e por isso
 * começa na primeira pintura — o HTML é estático e chega antes do JS. Quem
 * espera a hidratação para ver a logo se mexer é o celular na rua, justamente
 * quem mais precisa de alguma coisa acontecendo na tela.
 *
 * 1. a marca gira como uma moeda, com espessura de verdade (`FATIAS` cópias da
 *    silhueta empilhadas em `translateZ`);
 * 2. os balões sobem da base, um depois do outro, e o lápis pousa por último —
 *    cada peça fica numa altura própria, como os ícones em camadas da Apple TV;
 * 3. a marca desliza para o lado e o nome surge letra a letra no lugar.
 *
 * Depois disso o JS só faz uma coisa: no computador, a marca inclina na direção
 * do ponteiro e o brilho escorre pela face. Sem ponteiro fino (celular) ou com
 * "reduzir movimento", não há laço nenhum rodando.
 */
export function LogoAnimada({
  tamanho = 'heroi',
  className = '',
}: {
  tamanho?: Tamanho
  className?: string
}) {
  const inclinaRef = useRef<HTMLDivElement>(null)
  // `useId` traz caracteres que não servem em `url(#…)`.
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const id = (nome: string) => `${base}-${nome}`

  useEffect(() => {
    const alvo = inclinaRef.current
    if (!alvo) return
    const fino = window.matchMedia('(hover: hover) and (pointer: fine)')
    const calmo = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fino.matches || calmo.matches) return

    // Persegue o ponteiro com amortecimento e para o laço quando alcança:
    // nada roda com o mouse parado.
    let alvoX = 0
    let alvoY = 0
    let x = 0
    let y = 0
    let quadro = 0

    const passo = () => {
      x += (alvoX - x) * 0.09
      y += (alvoY - y) * 0.09
      alvo.style.setProperty('--px', x.toFixed(4))
      alvo.style.setProperty('--py', y.toFixed(4))
      if (Math.abs(alvoX - x) > 0.001 || Math.abs(alvoY - y) > 0.001) {
        quadro = requestAnimationFrame(passo)
      } else {
        quadro = 0
      }
    }

    const mover = (e: PointerEvent) => {
      const r = alvo.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      // Normaliza pela metade da janela: a marca reage ao ponteiro na tela
      // toda, não só em cima dela.
      alvoX = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)))
      alvoY = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)))
      if (!quadro) quadro = requestAnimationFrame(passo)
    }

    const sair = () => {
      alvoX = 0
      alvoY = 0
      if (!quadro) quadro = requestAnimationFrame(passo)
    }

    window.addEventListener('pointermove', mover, { passive: true })
    document.documentElement.addEventListener('pointerleave', sair)
    return () => {
      window.removeEventListener('pointermove', mover)
      document.documentElement.removeEventListener('pointerleave', sair)
      cancelAnimationFrame(quadro)
    }
  }, [])

  return (
    <div
      className={`logo3d ${className}`}
      data-tamanho={tamanho}
      role="img"
      aria-label="DomineAqui"
    >
      {/* Definições compartilhadas pelas camadas — um SVG sem caixa. */}
      <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
        <defs>
          <path id={id('silhueta')} d={MARCA.silhueta} />
          <clipPath id={id('recorte')}>
            <use href={`#${id('silhueta')}`} />
          </clipPath>
          <linearGradient id={id('verde')} x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--logo-verde-claro)' }} />
            <stop offset="1" style={{ stopColor: 'var(--logo-verde-escuro)' }} />
          </linearGradient>
          <linearGradient id={id('balao-verde')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--logo-balao-verde-1)' }} />
            <stop offset="1" style={{ stopColor: 'var(--logo-balao-verde-2)' }} />
          </linearGradient>
          <linearGradient id={id('amarelo')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F0BD5E" />
            <stop offset="1" stopColor="#D8932F" />
          </linearGradient>
          <linearGradient id={id('lapis')} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--logo-lapis-1)' }} />
            <stop offset="1" style={{ stopColor: 'var(--logo-lapis-2)' }} />
          </linearGradient>
          <radialGradient id={id('reflexo')}>
            <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('brilho')} x1="0" y1="0" x2="1" y2="0.35">
            <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="logo3d-desliza">
        <div className="logo3d-sombra" aria-hidden />
        <div ref={inclinaRef} className="logo3d-inclina">
          <div className="logo3d-flutua">
            <div className="logo3d-gira">
              {Array.from({ length: FATIAS }, (_, i) => (
                <svg
                  key={i}
                  viewBox="0 0 180 195"
                  className={`logo3d-camada logo3d-fatia${i === FATIAS - 1 ? ' logo3d-fatia-fundo' : ''}`}
                  style={{ '--k': i + 1 } as React.CSSProperties}
                  aria-hidden
                  focusable="false"
                >
                  <use href={`#${id('silhueta')}`} />
                </svg>
              ))}

              <svg viewBox="0 0 180 195" className="logo3d-camada logo3d-face" aria-hidden focusable="false">
                <use href={`#${id('silhueta')}`} className="logo3d-adesivo" />
                <g className="logo3d-encaixe">
                  <path d={MARCA.balaoVerde} />
                  <path d={MARCA.balaoAmarelo} />
                  <path d={MARCA.lapis} />
                </g>
                <path d={MARCA.corpoD} fill={`url(#${id('verde')})`} />
                <g clipPath={`url(#${id('recorte')})`}>
                  <ellipse
                    className="logo3d-reflexo"
                    cx="62"
                    cy="52"
                    rx="78"
                    ry="64"
                    fill={`url(#${id('reflexo')})`}
                  />
                  <rect
                    className="logo3d-brilho"
                    x="-180"
                    y="-20"
                    width="360"
                    height="240"
                    fill={`url(#${id('brilho')})`}
                  />
                </g>
              </svg>

              <svg viewBox="0 0 180 195" className="logo3d-camada logo3d-peca logo3d-balao-verde" aria-hidden focusable="false">
                <path d={MARCA.balaoVerde} fill={`url(#${id('balao-verde')})`} className="logo3d-contornado" />
                <path d={MARCA.baseDoBalao} fill={`url(#${id('balao-verde')})`} />
                <path d={MARCA.pontosVerdes} className="logo3d-pontos" />
              </svg>

              <svg viewBox="0 0 180 195" className="logo3d-camada logo3d-peca logo3d-balao-amarelo" aria-hidden focusable="false">
                <path d={MARCA.balaoAmarelo} fill={`url(#${id('amarelo')})`} className="logo3d-contornado" />
                <path d={MARCA.pontosAmarelos} className="logo3d-pontos" />
              </svg>

              <svg viewBox="0 0 180 195" className="logo3d-camada logo3d-peca logo3d-lapis" aria-hidden focusable="false">
                <path d={MARCA.lapis} fill={`url(#${id('lapis')})`} className="logo3d-contornado" />
                <path d={MARCA.lapisFrisos} className="logo3d-pontos" />
                <path d={MARCA.lapisBrilho} fill="#9DBBA4" />
                <path d={MARCA.lapisMadeira} fill="#EBD9B4" />
                <path d={MARCA.lapisGrafite} fill="#0E1A12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <svg viewBox="12 16 484 242" className="logo3d-nome" aria-hidden focusable="false">
        {LETRAS.map(({ letra, d }, i) => (
          <path
            key={i}
            d={d}
            className="logo3d-letra"
            data-letra={letra}
            style={{ '--i': i } as React.CSSProperties}
          />
        ))}
      </svg>
    </div>
  )
}
