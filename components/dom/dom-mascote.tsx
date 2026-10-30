'use client'

import { memo, useEffect, useId, useRef, useState } from 'react'
import { carregarDesenho, type Desenho, type NomeDoDesenho } from './desenhos'

/**
 * O Dom, vivo: pisca, respira, abana a cauda, mexe a boca quando fala, olha
 * para o celular (que ilumina o rosto e reflete nos óculos) quando pensa — em
 * vermelho quando dá erro — e veste a toga de Sócrates no modo socrático.
 *
 * As coordenadas abaixo são as do desenho original (viewBox `150 0 954 1254`):
 * olhos, lentes, boca e celular foram medidos sobre ele.
 */

export type EstadoDoDom = 'parado' | 'feliz' | 'pensando' | 'explicando' | 'animado' | 'preocupado' | 'orgulhoso' | 'erro' | 'acenando'
export type TrajeDoDom = 'normal' | 'socrates'

interface Props {
  estado?: EstadoDoDom
  traje?: TrajeDoDom
  falando?: boolean
  /** Boca aberta agora (segue a amplitude do áudio gravado). */
  boca?: boolean
  /** Silenciado: fita adesiva na boca. */
  calado?: boolean
  className?: string
  /** Sem os enfeites (luz, pensamento, brilhos) — para o lançador pequeno. */
  simples?: boolean
}

const VIEWBOX = '150 0 954 1254'

// Olhos (elipse que a pálpebra cobre) e lentes, medidos sobre o desenho.
const OLHOS = [
  { cx: 547, cy: 322, rx: 56, ry: 64 },
  { cx: 775, cy: 281, rx: 66, ry: 60 },
]
const LENTES = [
  { cx: 548, cy: 318, rx: 92, ry: 80, rot: -9 },
  { cx: 818, cy: 268, rx: 84, ry: 72, rot: -6 },
]
// Onde a luz da tela nasce em cada traje (o celular muda de lugar).
const TELA: Record<TrajeDoDom, { x: number; y: number }> = {
  normal: { x: 880, y: 660 },
  socrates: { x: 880, y: 600 },
}

function useDesenho(nome: NomeDoDesenho, ligado = true): Desenho | null {
  const [d, setD] = useState<Desenho | null>(null)
  useEffect(() => {
    if (!ligado) return
    let vivo = true
    carregarDesenho(nome)
      .then((x) => vivo && setD(x))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [nome, ligado])
  return d
}

/** Uma parte do desenho num `<svg>` próprio (camada composta). */
const Camada = memo(function Camada({ html, className }: { html: string; className?: string }) {
  return (
    <div className={`dom-mascote__camada ${className || ''}`}>
      <svg viewBox={VIEWBOX} preserveAspectRatio="xMidYMid meet" aria-hidden dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
})

function Traje({ desenho, qual }: { desenho: Desenho | null; qual: TrajeDoDom }) {
  if (!desenho) return null
  const p = desenho.partes
  return (
    <div className="dom-mascote__traje" data-qual={qual}>
      {p.cauda && <Camada html={p.cauda} className="dom-mascote__cauda" />}
      {p.resto && <Camada html={p.resto} />}
      {p.celular && <Camada html={p.celular} className="dom-mascote__celular" />}
    </div>
  )
}

/** Piscadas com intervalo variável (às vezes dupla). Para com a aba oculta. */
function usePiscar(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let vivo = true
    const piscar = (depois?: () => void) => {
      const el = ref.current
      if (!el) return
      el.dataset.piscando = '1'
      setTimeout(() => {
        if (el) el.dataset.piscando = '0'
        depois?.()
      }, 130)
    }
    const agendar = () => {
      timer = setTimeout(() => {
        if (!vivo) return
        if (document.visibilityState === 'visible') {
          if (Math.random() < 0.22) piscar(() => setTimeout(() => piscar(), 160))
          else piscar()
        }
        agendar()
      }, 2200 + Math.random() * 3800)
    }
    agendar()
    return () => {
      vivo = false
      clearTimeout(timer)
    }
  }, [ref])
}

export function DomMascote({ estado = 'parado', traje = 'normal', falando = false, boca = false, calado = false, className, simples = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const normal = useDesenho('dom')
  // A toga só baixa quando alguém entra no modo socrático (400 KB).
  const [querSocrates, setQuerSocrates] = useState(traje === 'socrates')
  useEffect(() => {
    if (traje === 'socrates') setQuerSocrates(true)
  }, [traje])
  const socrates = useDesenho('dom-socrates', querSocrates)

  // Troca de traje: guarda o traje mostrado e anima a passagem.
  const [mostrado, setMostrado] = useState<TrajeDoDom>(traje)
  const [trocando, setTrocando] = useState<TrajeDoDom | null>(null)
  useEffect(() => {
    if (traje === mostrado) return
    if (traje === 'socrates' && !socrates) return // espera a toga chegar
    setTrocando(traje)
    const t = setTimeout(() => {
      setMostrado(traje)
      setTrocando(null)
    }, 1650)
    return () => clearTimeout(t)
  }, [traje, mostrado, socrates])

  usePiscar(ref)
  // ids de gradiente únicos por instância: com dois Doms na tela (lançador e
  // painel), o segundo herdaria a cor da luz do primeiro.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = (nome: string) => `${nome}-${uid}`

  const tela = TELA[trocando || mostrado]
  const corLuz = estado === 'erro' ? '#ff3b3b' : '#cfeaff'
  const pronto = !!normal

  return (
    <div
      ref={ref}
      className={`dom-mascote ${className || ''}`}
      data-estado={estado}
      data-traje={mostrado}
      data-trocando={trocando || undefined}
      data-falando={falando ? '1' : '0'}
      data-boca={boca ? '1' : '0'}
      data-calado={calado ? '1' : '0'}
      aria-hidden
    >
      {!pronto && <div className="dom-mascote__silhueta" />}
      <div className="dom-mascote__corpo">
        <Traje desenho={normal} qual="normal" />
        <Traje desenho={socrates} qual="socrates" />

        {pronto && (
          <svg className="dom-mascote__extras" viewBox={VIEWBOX} aria-hidden>
            <defs>
              <linearGradient id={id('dom-pele')} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#e47f35" />
                <stop offset="1" stopColor="#f19a4c" />
              </linearGradient>
              <radialGradient id={id('dom-luz-rosto')} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor={corLuz} stopOpacity="0.75" />
                <stop offset="0.6" stopColor={corLuz} stopOpacity="0.22" />
                <stop offset="1" stopColor={corLuz} stopOpacity="0" />
              </radialGradient>
              <linearGradient id={id('dom-lente')} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={corLuz} stopOpacity="0.6" />
                <stop offset="0.55" stopColor={corLuz} stopOpacity="0.16" />
                <stop offset="1" stopColor={corLuz} stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id={id('dom-feixe')} x1="1" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor={corLuz} stopOpacity="0.55" />
                <stop offset="1" stopColor={corLuz} stopOpacity="0" />
              </linearGradient>
              {LENTES.map((l, i) => (
                <clipPath key={i} id={id(`dom-lente-${i}`)}>
                  <ellipse cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} transform={`rotate(${l.rot} ${l.cx} ${l.cy})`} />
                </clipPath>
              ))}
            </defs>

            {/* Bochechas */}
            <ellipse className="dom-bochecha" cx="500" cy="420" rx="46" ry="22" fill="#ff7a7a" />
            <ellipse className="dom-bochecha" cx="842" cy="372" rx="40" ry="20" fill="#ff7a7a" />

            {/* Pálpebras (cor do pelo, com a linha dos cílios) */}
            {OLHOS.map((o, i) => (
              <g key={i} className="dom-palpebra">
                <ellipse cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry} fill={`url(#${id('dom-pele')})`} />
                <path
                  d={`M${o.cx - o.rx * 0.95} ${o.cy + o.ry * 0.25} Q${o.cx} ${o.cy + o.ry * 1.05} ${o.cx + o.rx * 0.95} ${o.cy + o.ry * 0.25}`}
                  fill="none"
                  stroke="#3a1a08"
                  strokeWidth="7"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}

            {/* Boca aberta (fala) logo abaixo do sorriso */}
            <g className="dom-boca">
              <ellipse cx="704" cy="446" rx="30" ry="22" fill="#3b120a" />
              <ellipse cx="704" cy="458" rx="18" ry="9" fill="#e86a6a" />
            </g>

            {/* Fita adesiva na boca (som desligado): duas tiras cruzadas, pontas rasgadas. */}
            <g className="dom-fita" aria-hidden>
              <g transform="rotate(-9 705 428)">
                <path d="M600 410 l6 -6 l6 6 l6 -6 l6 6 h162 l6 -6 l6 6 l6 -6 l6 6 v38 l-6 6 l-6 -6 l-6 6 l-6 -6 h-162 l-6 6 l-6 -6 l-6 6 l-6 -6 z" fill="#ece5d2" stroke="#c9bf9f" strokeWidth="3" />
                <rect x="618" y="414" width="170" height="8" rx="4" fill="#ffffff" opacity="0.55" />
              </g>
              <g transform="rotate(11 705 432)">
                <path d="M622 414 l6 -6 l6 6 l6 -6 l6 6 h118 l6 -6 l6 6 l6 -6 l6 6 v36 l-6 6 l-6 -6 l-6 6 l-6 -6 h-118 l-6 6 l-6 -6 l-6 6 l-6 -6 z" fill="#f3edde" stroke="#c9bf9f" strokeWidth="3" />
                <rect x="640" y="418" width="128" height="7" rx="3.5" fill="#ffffff" opacity="0.5" />
              </g>
            </g>

            {!simples && (
              <>
                {/* Feixe da tela até o rosto, luz no rosto e reflexo nas lentes */}
                <path
                  className="dom-feixe"
                  d={`M${tela.x} ${tela.y} L${tela.x - 40} ${tela.y - 30} L470 300 L640 230 L${tela.x + 30} ${tela.y - 40} Z`}
                  fill={`url(#${id('dom-feixe')})`}
                />
                <ellipse className="dom-luz" cx="660" cy="330" rx="260" ry="210" fill={`url(#${id('dom-luz-rosto')})`} />
                {LENTES.map((l, i) => (
                  <g key={i} className="dom-reflexo" clipPath={`url(#${id(`dom-lente-${i}`)})`}>
                    <rect x={l.cx - l.rx} y={l.cy - l.ry} width={l.rx * 2} height={l.ry * 2} fill={`url(#${id('dom-lente')})`} />
                    <g className="dom-reflexo__linhas" opacity="0.32">
                      {Array.from({ length: 9 }, (_, k) => (
                        <rect
                          key={k}
                          x={l.cx - l.rx * 0.55}
                          y={l.cy - l.ry * 0.6 + k * 18}
                          width={l.rx * (0.6 + ((k * 37) % 40) / 100)}
                          height="4"
                          rx="2"
                          fill={estado === 'erro' ? '#ffd0d0' : '#ffffff'}
                          transform={`rotate(${l.rot} ${l.cx} ${l.cy})`}
                        />
                      ))}
                    </g>
                  </g>
                ))}

                {/* Gotinha de preocupação */}
                <path className="dom-gota" d="M935 210c0 0-26 34-26 52a26 26 0 0 0 52 0c0-18-26-52-26-52z" fill="#8fd3ff" stroke="#3d8fc4" strokeWidth="4" />

                {/* Pensamento */}
                <g className="dom-pensamento" fill="#ffffff" stroke="#c9d6cf" strokeWidth="4">
                  <circle cx="990" cy="190" r="16" />
                  <circle cx="1030" cy="130" r="24" />
                  <circle cx="1070" cy="60" r="34" />
                </g>

                {/* Brilhos */}
                <g fill="#ffd36b">
                  <path className="dom-brilho" d="M300 160l10 28 28 10-28 10-10 28-10-28-28-10 28-10z" />
                  <path className="dom-brilho" d="M1010 420l8 22 22 8-22 8-8 22-8-22-22-8 22-8z" />
                  <path className="dom-brilho" d="M250 520l7 18 18 7-18 7-7 18-7-18-18-7 18-7z" />
                </g>
              </>
            )}
          </svg>
        )}
      </div>

      {trocando && <EfeitoDeTroca para={trocando} />}
    </div>
  )
}

/** Luz dourada que varre, coroa de louros desenhando e poeira de mármore. */
function EfeitoDeTroca({ para }: { para: TrajeDoDom }) {
  const particulas = Array.from({ length: 18 }, (_, i) => {
    const ang = (i / 18) * Math.PI * 2
    const raio = 260 + (i % 4) * 70
    return {
      x: 627 + Math.cos(ang) * 120,
      y: 560 + Math.sin(ang) * 160,
      dx: `${Math.round(Math.cos(ang) * raio)}px`,
      dy: `${Math.round(Math.sin(ang) * raio)}px`,
      cor: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#e8b44a' : '#f6e3b0',
      r: 6 + (i % 3) * 4,
      atraso: `${(i % 6) * 40 + 280}ms`,
    }
  })
  return (
    <svg className="dom-troca" viewBox="-20 -150 1300 1560" aria-hidden>
      <defs>
        <linearGradient id="dom-linha-ouro" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e8b44a" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff3c4" />
          <stop offset="1" stopColor="#e8b44a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="dom-troca__linha">
        <rect x="120" y="0" width="1020" height="10" rx="5" fill="url(#dom-linha-ouro)" />
        <rect x="200" y="-24" width="860" height="58" fill="url(#dom-linha-ouro)" opacity="0.25" />
      </g>
      {/* Coroa de louros: dois ramos que se desenham em volta da cabeça */}
      <g fill="none" stroke="#e8b44a" strokeWidth="9" strokeLinecap="round">
        <path className="dom-troca__louro" d="M640 600 C420 600 300 440 330 230 M360 520 q-60 -10 -80 -60 M335 420 q-62 -2 -88 -50 M330 320 q-58 6 -88 -36 M345 230 q-50 10 -80 -24" />
        <path className="dom-troca__louro" d="M640 600 C860 600 980 440 950 230 M920 520 q60 -10 80 -60 M945 420 q62 -2 88 -50 M950 320 q58 6 88 -36 M935 230 q50 10 80 -24" />
      </g>
      {particulas.map((p, i) => (
        <circle
          key={i}
          className="dom-troca__particula"
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill={p.cor}
          style={{ ['--dx' as string]: p.dx, ['--dy' as string]: p.dy, animationDelay: p.atraso }}
        />
      ))}
      <text className="dom-troca__nome" x="640" y="-60" textAnchor="middle">
        {para === 'socrates' ? 'ΣΩΚΡΑΤΗΣ' : 'DOM'}
      </text>
    </svg>
  )
}
