'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Columns2,
  Contrast,
  Crosshair,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Ruler,
  RotateCcw,
  ScanLine,
  X,
} from 'lucide-react'
import type { ImagemCasoRaioX } from '@/lib/radiologia/casos-raio-x'
import type { AchadoMarcado, TipoMarcacao } from '@/lib/radiologia/casos-raio-x-detalhes'

type Modo = 'limpa' | 'marcada' | 'comparar'

/**
 * Negatoscópio interativo de um filme do caso.
 *
 * O modo "Com marcações" não troca só o frame do sprite: ele *acende* a lista
 * de alterações no topo do painel, uma a uma, com a mesma varredura de luz que
 * revela a imagem. É a diferença entre ver uma seta colorida e saber o que a
 * seta está apontando — que é o ponto inteiro de um atlas de estudo.
 */
export function CasoRaioXImagem({
  imagem,
  marcacoes = [],
  prioridade = false,
}: {
  imagem: ImagemCasoRaioX
  marcacoes?: AchadoMarcado[]
  prioridade?: boolean
}) {
  const [modo, setModo] = useState<Modo>('limpa')
  const [zoom, setZoom] = useState(1)
  const [divisao, setDivisao] = useState(50)
  const [ampliada, setAmpliada] = useState(false)
  const [inverter, setInverter] = useState(false)
  const [realce, setRealce] = useState(false)
  const [painelAberto, setPainelAberto] = useState(true)
  const [carregada, setCarregada] = useState(false)
  const [revelacao, setRevelacao] = useState(0)
  const tituloId = useId()
  const painelId = useId()
  const filme = useRef<HTMLDivElement | null>(null)
  const rolagem = useRef<HTMLDivElement | null>(null)
  const visor = useRef<HTMLElement | null>(null)

  const temMarcacoes = marcacoes.length > 0
  const marcado = modo === 'marcada'

  const alterarZoom = useCallback((delta: number) => {
    setZoom((atual) => Math.min(4, Math.max(1, Number((atual + delta).toFixed(2)))))
  }, [])

  const trocarModo = useCallback((proximo: Modo) => {
    setModo((atual) => {
      if (proximo !== atual && proximo !== 'limpa') setRevelacao((n) => n + 1)
      return proximo
    })
    if (proximo === 'limpa') return
    setPainelAberto(true)
    // As alterações aparecem no topo do visor. Se esse topo estiver acima da
    // dobra — ou escondido sob o sumário fixo —, a lista acenderia fora da
    // vista. Trazemos o visor para a tela antes que a revelação comece.
    requestAnimationFrame(() => {
      const alvo = visor.current
      if (!alvo) return
      // A régua é a barra fixa da página: abaixo dela é o que está de fato
      // visível, e ela já desce o quanto os botões flutuantes do shell pedem.
      const barra = document.querySelector('[data-rx-barra]')
      const folga = (barra ? barra.getBoundingClientRect().bottom : 0) + 12
      const topo = alvo.getBoundingClientRect().top
      if (topo >= folga && topo < window.innerHeight * 0.55) return
      window.scrollTo({ top: window.scrollY + topo - folga, behavior: 'smooth' })
    })
  }, [])

  const alternarMarcacao = useCallback(() => {
    trocarModo(modo === 'marcada' ? 'limpa' : 'marcada')
  }, [modo, trocarModo])

  const resetar = useCallback(() => {
    setZoom(1)
    setDivisao(50)
    setInverter(false)
    setRealce(false)
    const alvo = rolagem.current
    if (alvo) alvo.scrollTo({ left: 0, top: 0 })
  }, [])

  // Pré-carrega o sprite para trocar o esqueleto por imagem só quando ela existe.
  useEffect(() => {
    let vivo = true
    setCarregada(false)
    const img = new window.Image()
    img.onload = () => { if (vivo) setCarregada(true) }
    img.onerror = () => { if (vivo) setCarregada(true) }
    img.src = imagem.sprite
    return () => { vivo = false }
  }, [imagem.sprite])

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null
      if (alvo && (/^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName) || alvo.isContentEditable)) return
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return
      const tecla = evento.key.toLowerCase()
      if (tecla === 'm') { evento.preventDefault(); alternarMarcacao() }
      else if (tecla === 'c') { evento.preventDefault(); trocarModo(modo === 'comparar' ? 'limpa' : 'comparar') }
      else if (tecla === 'i') { evento.preventDefault(); setInverter((v) => !v) }
      else if (evento.key === '+' || evento.key === '=') { evento.preventDefault(); alterarZoom(0.25) }
      else if (evento.key === '-') { evento.preventDefault(); alterarZoom(-0.25) }
      else if (evento.key === '0') { evento.preventDefault(); resetar() }
      else if (evento.key === 'Escape' && ampliada) setAmpliada(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [alterarZoom, alternarMarcacao, ampliada, modo, resetar, trocarModo])

  useEffect(() => {
    if (!ampliada) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = anterior }
  }, [ampliada])

  /** Em "Comparar", arrastar sobre o filme move o divisor; com zoom, arrasta a imagem. */
  const aoArrastar = useCallback((evento: React.PointerEvent<HTMLDivElement>) => {
    const alvo = filme.current
    const scroll = rolagem.current
    if (!alvo) return
    if (modo === 'comparar') {
      evento.currentTarget.setPointerCapture(evento.pointerId)
      const mover = (x: number) => {
        const caixa = alvo.getBoundingClientRect()
        const pct = ((x - caixa.left) / caixa.width) * 100
        setDivisao(Math.min(94, Math.max(6, pct)))
      }
      mover(evento.clientX)
      const aoMover = (e: PointerEvent) => mover(e.clientX)
      const aoSoltar = () => {
        window.removeEventListener('pointermove', aoMover)
        window.removeEventListener('pointerup', aoSoltar)
      }
      window.addEventListener('pointermove', aoMover)
      window.addEventListener('pointerup', aoSoltar)
      return
    }
    if (zoom <= 1 || !scroll || evento.pointerType === 'touch') return
    const x0 = evento.clientX
    const y0 = evento.clientY
    const l0 = scroll.scrollLeft
    const t0 = scroll.scrollTop
    const aoMover = (e: PointerEvent) => {
      scroll.scrollLeft = l0 - (e.clientX - x0)
      scroll.scrollTop = t0 - (e.clientY - y0)
    }
    const aoSoltar = () => {
      window.removeEventListener('pointermove', aoMover)
      window.removeEventListener('pointerup', aoSoltar)
    }
    window.addEventListener('pointermove', aoMover)
    window.addEventListener('pointerup', aoSoltar)
  }, [modo, zoom])

  const filtro = useMemo(() => {
    const partes: string[] = []
    if (inverter) partes.push('invert(1)')
    if (realce) partes.push('contrast(1.45) brightness(1.12)')
    return partes.length ? partes.join(' ') : undefined
  }, [inverter, realce])

  const etiqueta = modo === 'limpa' ? 'Sem marcações' : modo === 'marcada' ? 'Com marcações' : 'Marcada · Limpa'

  const painel = (
    <section
      ref={visor}
      aria-labelledby={tituloId}
      className={`rx-visor relative rx-ancora flex flex-col overflow-hidden border border-white/10 bg-[#05070d] text-white shadow-2xl ${
        ampliada ? 'h-full w-full rounded-none' : 'rounded-2xl'
      }`}
    >
      {/* ── Barra superior ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/[0.02] px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg border border-sky-400/25 bg-sky-400/10 font-clinical text-[11px] font-black text-sky-200 sm:grid">
            {String(imagem.indice).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <p className="font-clinical text-[9px] font-bold uppercase tracking-[0.18em] text-sky-300/60 sm:hidden">
              Imagem {String(imagem.indice).padStart(2, '0')}
            </p>
            <h3 id={tituloId} className="truncate text-xs font-bold text-white/90 sm:text-sm">{imagem.titulo}</h3>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5" aria-label="Ferramentas do negatoscópio">
          <Ferramenta rotulo="Inverter densidades (I)" ativo={inverter} onClick={() => setInverter((v) => !v)}><Contrast /></Ferramenta>
          <Ferramenta rotulo="Realçar contraste" ativo={realce} onClick={() => setRealce((v) => !v)}><ScanLine /></Ferramenta>
          <span aria-hidden className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
          <Ferramenta rotulo="Diminuir zoom (−)" onClick={() => alterarZoom(-0.25)} desabilitado={zoom <= 1}><Minus /></Ferramenta>
          <span className="hidden w-10 text-center font-clinical text-[10px] tabular-nums text-white/50 sm:block">{Math.round(zoom * 100)}%</span>
          <Ferramenta rotulo="Aumentar zoom (+)" onClick={() => alterarZoom(0.25)} desabilitado={zoom >= 4}><Plus /></Ferramenta>
          <Ferramenta rotulo="Restaurar visualização (0)" onClick={resetar}><RotateCcw /></Ferramenta>
          <Ferramenta rotulo={ampliada ? 'Sair da tela cheia (Esc)' : 'Abrir em tela cheia'} onClick={() => setAmpliada((v) => !v)}>
            {ampliada ? <Minimize2 /> : <Maximize2 />}
          </Ferramenta>
        </div>
      </div>

      {/* ── Alterações marcadas: aparecem no topo quando o modo é ligado ── */}
      {temMarcacoes && modo !== 'limpa' && (
        <div key={`achados-${revelacao}`} className="rx-achados border-b border-sky-400/20 bg-sky-500/[0.07]">
          <button
            type="button"
            onClick={() => setPainelAberto((v) => !v)}
            aria-expanded={painelAberto}
            aria-controls={painelId}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left sm:px-4"
          >
            <Crosshair className="h-3.5 w-3.5 shrink-0 text-sky-300" />
            <span className="font-clinical text-[10px] font-black uppercase tracking-[0.16em] text-sky-200">
              {marcacoes.length} alteraç{marcacoes.length === 1 ? 'ão marcada' : 'ões marcadas'}
            </span>
            <span className="ml-auto text-[10px] font-bold text-sky-200/60">{painelAberto ? 'ocultar' : 'mostrar'}</span>
          </button>
          {painelAberto && (
            <ul id={painelId} className="rx-rolagem max-h-52 space-y-1.5 overflow-y-auto px-3 pb-3 sm:max-h-none sm:overflow-visible sm:px-4">
              {marcacoes.map((achado, i) => (
                <li
                  key={achado.titulo}
                  style={{ ['--rx-i' as string]: i }}
                  className="rx-achado flex gap-2.5 rounded-xl border border-white/10 bg-black/35 p-2.5"
                >
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md font-clinical text-[10px] font-black ${corDoTipo(achado.tipo)}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold leading-snug text-white/90 sm:text-xs">
                      {achado.titulo}
                      <IconeTipo tipo={achado.tipo} />
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-white/55">{achado.descricao}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Filme ────────────────────────────────────────────────────── */}
      <div
        ref={rolagem}
        className={`rx-rolagem relative overflow-auto bg-black ${ampliada ? 'min-h-0 flex-1' : 'max-h-[74vh]'}`}
      >
        <div
          ref={filme}
          onPointerDown={aoArrastar}
          data-imagem-clinica
          className={`relative mx-auto select-none overflow-hidden ${
            modo === 'comparar' ? 'cursor-ew-resize' : zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{
            aspectRatio: `${imagem.largura} / ${imagem.altura}`,
            width: `${zoom * 100}%`,
            minWidth: zoom > 1 ? `${zoom * 100}%` : '100%',
            filter: filtro,
          }}
          role="img"
          aria-label={`${imagem.titulo}. Visualização ${etiqueta.toLowerCase()}.`}
        >
          {!carregada && <span aria-hidden className="rx-esqueleto absolute inset-0" />}

          <Camada imagem={imagem} marcada={false} prioridade={prioridade} />

          {marcado && <Camada key={`marcada-${revelacao}`} imagem={imagem} marcada classe="rx-revela" />}

          {modo === 'comparar' && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${divisao}%` }}>
                <Camada imagem={imagem} marcada largura={`${(100 / divisao) * 100}%`} />
              </div>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,.95)]"
                style={{ left: `${divisao}%` }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-sky-200/60 bg-black/70 backdrop-blur"
                style={{ left: `${divisao}%` }}
              >
                <Columns2 className="h-4 w-4 text-sky-200" />
              </span>
            </>
          )}

          {/* Varredura de disparo: a lâmina de luz que revela o filme marcado. */}
          {modo !== 'limpa' && <span key={`disparo-${revelacao}`} aria-hidden className="rx-disparo" />}

          <span aria-hidden className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/65 px-2 py-1 font-clinical text-[9px] font-black uppercase tracking-widest text-white/75 backdrop-blur">
            {etiqueta}
          </span>
          {inverter && (
            <span aria-hidden className="pointer-events-none absolute right-2 top-2 rounded-md bg-black/65 px-2 py-1 font-clinical text-[9px] font-black uppercase tracking-widest text-sky-200 backdrop-blur">
              Invertido
            </span>
          )}
          <span aria-hidden className="rx-canto left-2 bottom-2 border-b border-l" />
          <span aria-hidden className="rx-canto right-2 bottom-2 border-b border-r" />
        </div>
      </div>

      {/* ── Divisor de comparação ────────────────────────────────────── */}
      {modo === 'comparar' && (
        <div className="border-t border-white/10 px-4 py-2">
          <label className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-white/50">
            <span className="shrink-0 text-sky-300">Marcada</span>
            <input
              type="range"
              min="6"
              max="94"
              value={Math.round(divisao)}
              onChange={(evento) => setDivisao(Number(evento.target.value))}
              className="h-8 min-w-0 flex-1 accent-sky-400"
              aria-label="Divisão entre imagem marcada e limpa"
            />
            <span className="shrink-0">Limpa</span>
          </label>
        </div>
      )}

      {/* ── Modos ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-1 border-t border-white/10 bg-white/[0.02] p-2" role="group" aria-label="Modo de visualização">
        <BotaoModo ativo={modo === 'limpa'} onClick={() => trocarModo('limpa')} icone={<EyeOff />} titulo="Limpa" descricao="Sem marcações" />
        <BotaoModo ativo={marcado} onClick={() => trocarModo('marcada')} icone={<Eye />} titulo="Marcadores" descricao="Revela alterações" destaque />
        <BotaoModo ativo={modo === 'comparar'} onClick={() => trocarModo('comparar')} icone={<Columns2 />} titulo="Comparar" descricao="Arraste o divisor" />
      </div>

      <p className="sr-only" aria-live="polite">
        {`Modo ${etiqueta}. Zoom ${Math.round(zoom * 100)}%.`}
        {modo !== 'limpa' && temMarcacoes ? ` ${marcacoes.length} alterações marcadas: ${marcacoes.map((a) => a.titulo).join('; ')}.` : ''}
      </p>
    </section>
  )

  if (!ampliada) return painel

  return (
    <div className="fixed inset-0 z-[100] bg-black p-0 sm:p-3">
      <button
        type="button"
        onClick={() => setAmpliada(false)}
        aria-label="Fechar tela cheia"
        className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/70 text-white/70 backdrop-blur transition hover:bg-white/10 hover:text-white sm:right-6 sm:top-6"
      >
        <X className="h-4 w-4" />
      </button>
      {painel}
    </div>
  )
}

function corDoTipo(tipo: TipoMarcacao) {
  if (tipo === 'armadilha') return 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/30'
  if (tipo === 'medida') return 'bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/30'
  if (tipo === 'referencia') return 'bg-white/10 text-white/60 ring-1 ring-white/15'
  return 'bg-sky-400/25 text-sky-100 ring-1 ring-sky-300/35'
}

function IconeTipo({ tipo }: { tipo: TipoMarcacao }) {
  if (tipo === 'armadilha') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-200"><AlertTriangle className="h-2.5 w-2.5" />armadilha</span>
  }
  if (tipo === 'medida') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-cyan-200"><Ruler className="h-2.5 w-2.5" />medida</span>
  }
  if (tipo === 'referencia') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white/50">referência</span>
  }
  return null
}

function Camada({
  imagem,
  marcada,
  largura = '100%',
  prioridade = false,
  classe = '',
}: {
  imagem: ImagemCasoRaioX
  marcada: boolean
  largura?: string
  prioridade?: boolean
  classe?: string
}) {
  return (
    <div
      aria-hidden
      data-imagem-clinica
      className={`absolute inset-0 bg-black bg-no-repeat ${classe}`}
      style={{
        width: largura,
        backgroundImage: `url("${imagem.sprite}")`,
        backgroundSize: '200% 100%',
        backgroundPosition: marcada ? '100% 0' : '0 0',
        // Faz o navegador priorizar apenas a primeira imagem sem alterar o sprite.
        contentVisibility: prioridade ? 'visible' : 'auto',
      }}
    />
  )
}

function Ferramenta({
  rotulo,
  onClick,
  ativo = false,
  desabilitado = false,
  children,
}: {
  rotulo: string
  onClick: () => void
  ativo?: boolean
  desabilitado?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      aria-pressed={ativo}
      title={rotulo}
      onClick={onClick}
      disabled={desabilitado}
      className={`grid h-9 w-9 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-25 [&_svg]:h-3.5 [&_svg]:w-3.5 ${
        ativo ? 'bg-sky-400/20 text-sky-200 ring-1 ring-sky-300/35' : 'text-white/55 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function BotaoModo({
  ativo,
  onClick,
  icone,
  titulo,
  descricao,
  destaque = false,
}: {
  ativo: boolean
  onClick: () => void
  icone: React.ReactNode
  titulo: string
  descricao: string
  destaque?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`group relative flex min-h-[46px] flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-1.5 transition [&_svg]:h-3.5 [&_svg]:w-3.5 ${
        ativo
          ? 'bg-sky-400/20 text-sky-100 ring-1 ring-sky-300/40'
          : `text-white/45 hover:bg-white/[0.07] hover:text-white ${destaque ? 'ring-1 ring-inset ring-sky-400/20' : ''}`
      }`}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-bold sm:text-xs">{icone}{titulo}</span>
      <span className="hidden text-[9px] font-medium uppercase tracking-wider opacity-60 sm:block">{descricao}</span>
    </button>
  )
}

/** Miniatura sem interação usada no catálogo. */
export function MiniaturaCasoRaioX({
  imagem,
  marcada = false,
  className = '',
}: {
  imagem: ImagemCasoRaioX
  marcada?: boolean
  className?: string
}) {
  return (
    <span
      role={marcada ? 'presentation' : 'img'}
      aria-label={marcada ? undefined : imagem.titulo}
      aria-hidden={marcada || undefined}
      data-imagem-clinica
      className={`block bg-black bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url("${imagem.sprite}")`,
        backgroundSize: '200% 100%',
        backgroundPosition: marcada ? '100% 0' : '0 0',
      }}
    />
  )
}
