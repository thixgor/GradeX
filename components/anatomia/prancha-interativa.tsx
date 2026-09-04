'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Maximize2, Minus, Move, Plus, RotateCcw, Shrink } from 'lucide-react'
import type { AtlasMarker } from '@/lib/atlas-anatomia/estrutura'
import { MarcaDaguaDoAcervo } from '@/components/anatomia/marca-dagua'
import {
  criarControladorDeGestos,
  limitarTransformacao,
  TRANSFORMACAO_INICIAL,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_PASSO,
  type Transformacao,
} from '@/lib/anatomia/gestos-prancha'

/**
 * Visualizador da prancha anatômica.
 *
 * Prancha de anatomia é imagem densa: numa tela de celular, um marcador cobre
 * três estruturas vizinhas. Por isso o palco tem zoom (roda, pinça e botões),
 * arraste, tela cheia e um modo de estudo que esconde os números para o aluno
 * tentar nomear a estrutura antes de conferir.
 *
 * O zoom é aplicado num contêiner que envolve imagem e marcadores juntos, de
 * modo que os pinos acompanhem a peça; a escala inversa aplicada a cada pino
 * mantém o alfinete do mesmo tamanho na tela em qualquer nível de aproximação.
 */

export interface PranchaInterativaProps {
  imagem: string
  alt: string
  marcadores: AtlasMarker[]
  indiceAtivo: number | null
  onSelecionar: (indice: number | null) => void
  /** Esconde os números até o aluno tocar no pino. */
  modoEstudo: boolean
  /** Chave que reinicia o zoom quando a prancha muda. */
  chaveDaPeca: string
  /** Rótulo com o nome ao lado do pino ativo. O quiz o desliga até responder. */
  mostrarRotulos?: boolean
  prioridade?: boolean
}

/**
 * Acima desta altura o alfinete é desenhado de cabeça para baixo.
 *
 * O alfinete aponta para baixo: a ponta fica na estrutura e a cabeça sobe uns
 * 30 px. Para os poucos marcadores colados no topo da prancha (38 dos 2.382),
 * essa cabeça sairia da moldura e seria cortada — então eles são desenhados
 * espelhados, com a ponta em cima e a cabeça pendurada abaixo dela.
 */
const LIMITE_DE_TOPO = 0.075

export function PranchaInterativa({
  imagem,
  alt,
  marcadores,
  indiceAtivo,
  onSelecionar,
  modoEstudo,
  chaveDaPeca,
  mostrarRotulos = true,
  prioridade,
}: PranchaInterativaProps) {
  const palcoRef = useRef<HTMLDivElement>(null)
  // A moldura do gesto é o filme, não o palco: é sobre a largura dele que o
  // arraste é convertido em porcentagem, e é ele que a transformação move.
  const filmeRef = useRef<HTMLDivElement>(null)
  const [transformacao, setTransformacao] = useState<Transformacao>(TRANSFORMACAO_INICIAL)
  const [arrastando, setArrastando] = useState(false)
  const [telaCheia, setTelaCheia] = useState(false)
  const [revelados, setRevelados] = useState<Set<number>>(new Set())

  const gestos = useRef(criarControladorDeGestos())
  // Espelho da transformação para os manipuladores de ponteiro, que precisam do
  // valor corrente sem depender do fechamento da renderização.
  const transformacaoRef = useRef(TRANSFORMACAO_INICIAL)
  transformacaoRef.current = transformacao

  // Cada prancha começa do zero: manter o zoom da anterior desorienta.
  useEffect(() => {
    setTransformacao(TRANSFORMACAO_INICIAL)
    setRevelados(new Set())
    gestos.current.cancelarTudo()
  }, [chaveDaPeca])

  useEffect(() => {
    const aoMudar = () => setTelaCheia(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', aoMudar)
    return () => document.removeEventListener('fullscreenchange', aoMudar)
  }, [])

  const aplicarZoom = useCallback(
    (delta: number) => setTransformacao(atual => limitarTransformacao({ ...atual, escala: atual.escala + delta })),
    [],
  )

  const reiniciar = useCallback(() => setTransformacao(TRANSFORMACAO_INICIAL), [])

  // Zoom pela roda só com Ctrl/⌘ (que é também o que a pinça do trackpad envia).
  // Sem isso, passar o mouse sobre uma prancha de tela cheia sequestraria a
  // rolagem da página. O listener é nativo e não passivo porque o React
  // registra `wheel` como passivo e `preventDefault` seria ignorado.
  useEffect(() => {
    const palco = palcoRef.current
    if (!palco) return
    const aoRolar = (evento: WheelEvent) => {
      if (!evento.ctrlKey && !evento.metaKey) return
      evento.preventDefault()
      setTransformacao(atual =>
        limitarTransformacao({ ...atual, escala: atual.escala - Math.sign(evento.deltaY) * ZOOM_PASSO }),
      )
    }
    palco.addEventListener('wheel', aoRolar, { passive: false })
    return () => palco.removeEventListener('wheel', aoRolar)
  }, [])

  function aoPressionar(evento: React.PointerEvent) {
    const reacao = gestos.current.pressionar(
      { id: evento.pointerId, x: evento.clientX, y: evento.clientY },
      transformacaoRef.current,
    )
    if (reacao !== 'arraste') return

    // A captura garante que o arraste continue recebendo eventos mesmo quando o
    // dedo escorrega para fora do palco.
    ;(evento.currentTarget as Element).setPointerCapture?.(evento.pointerId)
    setArrastando(true)
  }

  function aoMover(evento: React.PointerEvent) {
    const ajuste = gestos.current.mover(
      { id: evento.pointerId, x: evento.clientX, y: evento.clientY },
      { largura: filmeRef.current?.clientWidth || 1, altura: filmeRef.current?.clientHeight || 1 },
    )
    // `ajuste` já carrega os números do gesto: pode ser executado pelo React
    // quando ele quiser, sem depender de nada que ainda esteja vivo aqui.
    if (ajuste) setTransformacao(ajuste)
  }

  function aoSoltar(evento: React.PointerEvent) {
    const reacao = gestos.current.soltar({ id: evento.pointerId }, transformacaoRef.current)
    if (reacao === 'fim') setArrastando(false)
    else if (reacao === 'arraste') setArrastando(true)
  }

  async function alternarTelaCheia() {
    if (!palcoRef.current) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await palcoRef.current.requestFullscreen?.()
  }

  function selecionar(indice: number) {
    if (modoEstudo) setRevelados(atual => new Set(atual).add(indice))
    onSelecionar(indiceAtivo === indice ? null : indice)
  }

  return (
    <div
      ref={palcoRef}
      className={`group/palco anatomia-mesa relative isolate overflow-hidden ${
        telaCheia ? 'flex h-full w-full items-center justify-center !rounded-none !border-0' : 'rounded-[22px]'
      }`}
    >
      {/* `pb-14` reserva a faixa dos controles: sem ela, um marcador no rodapé
          da prancha ficaria escondido atrás dos botões de zoom.

          Sobre o `touch-action`: ele era `none` sempre, e isso prendia a página.
          Uma prancha ocupa quase toda a altura de um iPad, então o dedo que
          tenta rolar quase sempre pousa em cima dela — e `none` diz ao
          navegador "eu cuido de todo gesto aqui", inclusive do que o
          componente não faz nada com. Sem zoom, um dedo só é literalmente um
          no-op (`gestos-prancha` devolve 'nada' quando `escala === 1`): a
          página simplesmente travava, e não havia como descer até o resto da
          lâmina.

          Agora o palco só toma o gesto quando tem o que fazer com ele — com
          zoom aplicado, em que arrastar move a peça, e em tela cheia, onde não
          existe página atrás para rolar. Em repouso vale `pan-y`: a rolagem
          vertical volta a ser do navegador e a pinça de dois dedos continua
          sendo nossa, que é o que abre o zoom. */}
      <div
        className={`relative mx-auto flex w-full select-none items-center justify-center pb-14 ${
          telaCheia || transformacao.escala > 1 ? 'touch-none' : 'touch-pan-y'
        } ${
          telaCheia ? 'h-full max-h-full' : 'max-w-[900px]'
        } ${transformacao.escala > 1 ? (arrastando ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onDoubleClick={() => (transformacao.escala > 1 ? reiniciar() : aplicarZoom(ZOOM_PASSO * 3))}
      >
        {/*
          O filme é quadrado, sempre — e essa é a única forma de o marcador cair
          onde deve. As coordenadas do acervo são normalizadas sobre a prancha,
          que é quadrada (900×900) nas 418 peças; se a moldura dos marcadores
          fosse a área do palco, o `object-contain` centralizaria a imagem
          dentro dela e sobrariam faixas laterais que os marcadores ignorariam.
          O erro chegava a 3% da prancha fora da tela cheia — o suficiente para
          o pino apontar a estrutura vizinha — e a muito mais dentro dela, onde
          a área é larga e a peça continua quadrada. Com a moldura quadrada, a
          imagem preenche o quadro inteiro e os dois sistemas de coordenadas
          passam a ser o mesmo.
        */}
        <div
          ref={filmeRef}
          className={`relative aspect-square origin-center transition-transform duration-100 ease-out ${
            telaCheia ? 'landscape:h-full landscape:w-auto portrait:h-auto portrait:w-full' : 'w-full'
          }`}
          style={{ transform: `translate(${transformacao.x}%, ${transformacao.y}%) scale(${transformacao.escala})` }}
        >
          <Image
            key={imagem}
            src={imagem}
            alt={alt}
            fill
            priority={prioridade}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 900px"
            className="pointer-events-none object-contain"
            draggable={false}
          />

          {marcadores.map((marcador, indice) => {
            const ativo = indiceAtivo === indice
            const oculto = modoEstudo && !revelados.has(indice) && !ativo
            const invertido = marcador.y < LIMITE_DE_TOPO
            return (
              <button
                key={`${marcador.title}-${indice}`}
                type="button"
                onClick={event => {
                  event.stopPropagation()
                  selecionar(indice)
                }}
                aria-label={`${indice + 1}. ${marcador.title}`}
                aria-pressed={ativo}
                style={{
                  left: `${marcador.x * 100}%`,
                  top: `${marcador.y * 100}%`,
                  // A origem é a ponta do alfinete. Assim tanto o recuo de
                  // metade da largura quanto a escala inversa do zoom giram em
                  // torno dela, e a ponta permanece cravada na estrutura em
                  // qualquer aproximação.
                  transformOrigin: invertido ? 'top center' : 'bottom center',
                  transform: `translate(-50%, ${invertido ? '0' : '-100%'}) scale(${1 / transformacao.escala})`,
                }}
                /* O `after` é a área de toque: o alfinete é estreito de
                   propósito, e o dedo não é. Ele cresce a região clicável sem
                   mexer na caixa que ancora a ponta. */
                className={`absolute focus:outline-none after:absolute after:-inset-1.5 after:content-[''] ${
                  ativo ? 'z-20' : 'z-10'
                }`}
              >
                {/* Halo na ponta, e não em volta da cabeça: o que o aluno
                    procura ao voltar para a peça é o ponto apontado. */}
                {ativo && (
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute left-1/2 h-3 w-3 -translate-x-1/2 animate-ping rounded-full bg-amber-400/50 ${
                      invertido ? '-top-1.5' : '-bottom-1.5'
                    }`}
                  />
                )}

                <Alfinete numero={indice + 1} estado={ativo ? 'ativo' : oculto ? 'oculto' : 'normal'} invertido={invertido} />

                {/* O nome sai junto do pino, do lado oposto à ponta: na maior
                    parte das vezes a pergunta é só "que estrutura é essa?", e a
                    resposta não deveria exigir procurar o painel do lado — nem
                    o rótulo deveria cobrir justamente o que o pino aponta. */}
                {ativo && !oculto && mostrarRotulos && (
                  <span
                    className={`pointer-events-none absolute left-1/2 max-w-[42vw] -translate-x-1/2 whitespace-nowrap rounded-lg border border-amber-300/50 bg-amber-400 px-2 py-1 text-[11px] font-bold text-amber-950 shadow-lg sm:max-w-[260px] ${
                      invertido ? 'top-[calc(100%+4px)]' : 'bottom-[calc(100%+4px)]'
                    }`}
                  >
                    <span className="block overflow-hidden text-ellipsis">{marcador.title}</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* A marca fica sobre tudo o que é acervo e por baixo só dos controles:
          é o print que ela precisa alcançar, e um print pega o palco inteiro,
          com zoom ou em tela cheia. */}
      <MarcaDaguaDoAcervo className="z-20" />

      {/* Controles: discretos no desktop, sempre visíveis no toque. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-2 p-2.5 sm:p-3">
        <span className="anatomia-controles pointer-events-none hidden items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-white/75 sm:inline-flex">
          <Move className="h-3.5 w-3.5" />
          {transformacao.escala > 1 ? 'Arraste para navegar' : 'Duplo clique, pinça ou Ctrl + roda para aproximar'}
        </span>
        <div className="anatomia-controles pointer-events-auto ml-auto flex items-center gap-1 rounded-2xl p-1">
          <BotaoPalco titulo="Afastar" onClick={() => aplicarZoom(-ZOOM_PASSO)} desabilitado={transformacao.escala <= ZOOM_MIN}>
            <Minus className="h-4 w-4" />
          </BotaoPalco>
          <span className="min-w-[3ch] text-center text-[11px] font-bold tabular-nums text-white/70">
            {Math.round(transformacao.escala * 100)}%
          </span>
          <BotaoPalco titulo="Aproximar" onClick={() => aplicarZoom(ZOOM_PASSO)} desabilitado={transformacao.escala >= ZOOM_MAX}>
            <Plus className="h-4 w-4" />
          </BotaoPalco>
          <BotaoPalco titulo="Enquadrar" onClick={reiniciar} desabilitado={transformacao.escala === 1}>
            <RotateCcw className="h-4 w-4" />
          </BotaoPalco>
          <BotaoPalco titulo={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'} onClick={alternarTelaCheia}>
            {telaCheia ? <Shrink className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </BotaoPalco>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────── Alfinete ─────────────────────────────── */

/**
 * O marcador é um alfinete numerado, não uma bolha.
 *
 * A diferença não é de gosto: a bolha ficava *sobre* a estrutura, e numa
 * prancha densa isso significa esconder o que ela deveria indicar. O alfinete
 * separa as duas funções — a ponta crava no ponto exato, a cabeça com o número
 * fica um pouco acima, fora do caminho — e por isso ele também pode ser menor.
 *
 * O contorno claro em volta do corpo é o que faz o mesmo pino ser legível sobre
 * osso quase branco e sobre a sombra escura da mesa. Sem ele, era só olhar uma
 * prancha escura para perder metade dos marcadores.
 */

const CORPO_DO_ALFINETE =
  'M11 29.4C11 29.4 1.8 17.6 1.8 10.5a9.2 9.2 0 1 1 18.4 0c0 7.1-9.2 18.9-9.2 18.9Z'

const PALETA = {
  normal: { corpo: '#0369a1', contorno: '#f8fafc', texto: '#ffffff' },
  ativo: { corpo: '#f59e0b', contorno: '#fffbeb', texto: '#431407' },
  oculto: { corpo: '#475569', contorno: '#f1f5f9', texto: '#f8fafc' },
} as const

function Alfinete({
  numero,
  estado,
  invertido,
}: {
  numero: number
  estado: keyof typeof PALETA
  invertido: boolean
}) {
  const cores = PALETA[estado]
  const rotulo = estado === 'oculto' ? '?' : String(numero)
  const largura = estado === 'ativo' ? 27 : 22
  const altura = estado === 'ativo' ? 37 : 30
  // Três dígitos ainda cabem na cabeça; o corpo da fonte é que cede.
  const corpoDaFonte = rotulo.length >= 3 ? 7.5 : rotulo.length === 2 ? 9.2 : 11

  return (
    <svg
      width={largura}
      height={altura}
      viewBox="0 0 22 30"
      aria-hidden
      className="block overflow-visible drop-shadow-[0_2px_3px_rgba(2,6,23,0.55)] transition-[width,height] duration-150"
    >
      <g transform={invertido ? 'translate(0,30) scale(1,-1)' : undefined}>
        <path d={CORPO_DO_ALFINETE} fill={cores.corpo} stroke={cores.contorno} strokeWidth={1.7} strokeLinejoin="round" />
      </g>
      <text
        x={11}
        y={invertido ? 19.5 : 10.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={corpoDaFonte}
        fontWeight={800}
        fill={cores.texto}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {rotulo}
      </text>
    </svg>
  )
}

function BotaoPalco({
  children,
  titulo,
  onClick,
  desabilitado,
}: {
  children: React.ReactNode
  titulo: string
  onClick: () => void
  desabilitado?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      title={titulo}
      aria-label={titulo}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}
