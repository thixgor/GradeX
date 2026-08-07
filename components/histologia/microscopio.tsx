'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Contrast,
  Crosshair,
  Eye,
  EyeOff,
  Keyboard,
  Layers,
  Maximize2,
  Minimize2,
  Move,
  RotateCcw,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import type { Midia, Overlay } from '@/lib/histologia/esquemas'
import { AVISO_MIDIA_INDISPONIVEL, urlDaMidia } from '@/lib/histologia/midia'
import {
  OBJETIVOS,
  type Campo,
  type Dimensoes,
  type Objetivo,
  aplicarObjetivo,
  aplicarZoom,
  campoDeAjuste,
  deslocar,
  enquadrar,
  janelaVisivel,
  limitesDeEscala,
  objetivoAtual,
  transformCss,
} from '@/lib/histologia/viewport'
import { PALETA, RETICULA } from './tema'

/**
 * Microscópio virtual.
 *
 * ## A invariante que sustenta tudo
 *
 * A imagem-base e todas as camadas de marcação são **irmãs em `inset-0` dentro
 * de um único contêiner transformado**. Existe uma variável `campo` e uma
 * chamada a `transformCss`; não há caminho de código em que uma camada receba
 * escala ou deslocamento diferente da outra. O desalinhamento clássico dos
 * visualizadores de lâmina — a seta apontando dois pixels ao lado da estrutura
 * — é impossível aqui por construção, não por cuidado. A matemática está em
 * `lib/histologia/viewport.ts` e é testada isoladamente.
 *
 * ## O que os "objetivos" são
 *
 * 4×, 10×, 40× e 100× são presets de **campo de visão**, com as proporções
 * reais entre objetivos (1 : 2,5 : 10 : 25). Não criam resolução: ampliar um
 * JPEG não inventa detalhe. O painel diz isso ao aluno, porque deixá-lo
 * acreditar que o 100× revela ultraestrutura ensina errado sobre o próprio
 * instrumento.
 *
 * ## Foco e iluminação
 *
 * O foco micrométrico aplica desfoque real ao *conjunto* das camadas — é uma
 * simulação declarada do que acontece quando o plano focal sai do corte, e o
 * rótulo diz "simulado". Iluminação e contraste são filtros CSS sobre a mesma
 * pilha. Nenhum deles finge ser óptica: são modelos, e a interface os nomeia.
 */

export interface LaminaDoMicroscopio {
  rota: string
  titulo: string
  base: Midia | null
  overlays: Overlay[]
}

type ModoDeOverlay = 'nenhum' | 'todos' | 'individual'

export interface MicroscopioProps {
  lamina: LaminaDoMicroscopio
  /** Outras lâminas do assunto, para a bandeja. */
  bandeja?: Array<{ rota: string; titulo: string; miniatura?: Midia | null }>
  /** Id do overlay a destacar na abertura (vindo da busca). */
  overlayInicial?: string
  modo?: 'estudo' | 'prova'
  onSelecionarLamina?: (rota: string) => void
  onSelecionarOverlay?: (id: string | null) => void
  /** Altura do palco. `auto` usa proporção 4:3; `tela` ocupa a viewport. */
  altura?: 'auto' | 'tela'
}

const PASSO_TECLADO = 60
const FATOR_RODA = 1.0015

export function Microscopio({
  lamina,
  bandeja = [],
  overlayInicial,
  modo = 'estudo',
  onSelecionarLamina,
  onSelecionarOverlay,
  altura = 'auto',
}: MicroscopioProps) {
  const palcoRef = useRef<HTMLDivElement | null>(null)
  const imagemRef = useRef<HTMLImageElement | null>(null)
  const idBase = useId()

  const [container, setContainer] = useState<Dimensoes>({ largura: 0, altura: 0 })
  const [imagem, setImagem] = useState<Dimensoes | null>(null)
  const [campo, setCampo] = useState<Campo>({ escala: 1, x: 0, y: 0 })
  const [carregandoBase, setCarregandoBase] = useState(true)
  const [erroDeMidia, setErroDeMidia] = useState(false)

  const [modoOverlay, setModoOverlay] = useState<ModoDeOverlay>('nenhum')
  const [ativos, setAtivos] = useState<Set<string>>(new Set())
  const [opacidade, setOpacidade] = useState(1)
  const [selecionado, setSelecionado] = useState<string | null>(overlayInicial ?? null)

  const [foco, setFoco] = useState(0)
  const [luz, setLuz] = useState(100)
  const [contraste, setContraste] = useState(100)
  const [campoCircular, setCampoCircular] = useState(false)
  const [telaCheia, setTelaCheia] = useState(false)
  const [atalhosVisiveis, setAtalhosVisiveis] = useState(false)

  const estruturas = useMemo(
    () => lamina.overlays.filter((o) => o.classe === 'estrutura'),
    [lamina.overlays],
  )
  const creditosEmCamada = useMemo(
    () => lamina.overlays.filter((o) => o.classe === 'credito'),
    [lamina.overlays],
  )

  const urlBase = lamina.base ? urlDaMidia(lamina.base) : null

  /* ────────────────── medição do contêiner ────────────────── */

  useEffect(() => {
    const alvo = palcoRef.current
    if (!alvo) return
    const observador = new ResizeObserver((entradas) => {
      const caixa = entradas[0]?.contentRect
      if (caixa) setContainer({ largura: caixa.width, altura: caixa.height })
    })
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [])

  /* ────────────────── ajuste inicial ────────────────── */

  const ajustar = useCallback(() => {
    if (!imagem || container.largura === 0) return
    setCampo(campoDeAjuste(imagem, container))
  }, [imagem, container])

  useEffect(() => {
    ajustar()
  }, [ajustar])

  /**
   * Troca de lâmina reinicia imagem, foco e camadas — mas preserva iluminação,
   * contraste e opacidade, que são preferência do usuário e não da lâmina.
   *
   * A dependência é **só** `lamina.rota`. Ter `overlayInicial` aqui zerava o
   * estado de carregamento ao escolher uma estrutura na busca, sem que a imagem
   * recarregasse — e como `onLoad` não dispara de novo para uma imagem já
   * carregada, o "Iluminando a lâmina…" ficava eterno.
   */
  useEffect(() => {
    setImagem(null)
    setCarregandoBase(true)
    setErroDeMidia(false)
    setAtivos(new Set())
    setModoOverlay('nenhum')
    setFoco(0)
  }, [lamina.rota])

  // A estrutura destacada vem da busca e muda sem trocar de lâmina.
  useEffect(() => {
    setSelecionado(overlayInicial ?? null)
  }, [overlayInicial])

  /**
   * Resolve o caso da imagem que já está no cache.
   *
   * Se o navegador já tem o arquivo, o `load` pode disparar antes de o React
   * anexar o manipulador — ou simplesmente não disparar de novo num elemento
   * reaproveitado. Conferir `complete` depois da renderização cobre os dois.
   */
  useEffect(() => {
    const img = imagemRef.current
    if (!img || !carregandoBase) return
    if (img.complete && img.naturalWidth > 0) {
      setImagem({ largura: img.naturalWidth, altura: img.naturalHeight })
      setCarregandoBase(false)
    }
  })

  /**
   * Prazo máximo de carregamento.
   *
   * As imagens vêm de um servidor de terceiros; uma requisição pendurada não
   * dispara `load` nem `error`, e o spinner ficaria girando para sempre. Vinte
   * segundos é folgado para uma lâmina de 1 MB em rede móvel e curto o
   * suficiente para o aluno não achar que a página morreu.
   */
  useEffect(() => {
    if (!carregandoBase || erroDeMidia) return
    const prazo = window.setTimeout(() => {
      const img = imagemRef.current
      if (img?.complete && img.naturalWidth > 0) {
        setImagem({ largura: img.naturalWidth, altura: img.naturalHeight })
        setCarregandoBase(false)
        return
      }
      setCarregandoBase(false)
      setErroDeMidia(true)
    }, 20000)
    return () => window.clearTimeout(prazo)
  }, [carregandoBase, erroDeMidia, lamina.rota])

  /* ────────────────── zoom pela roda ────────────────── */

  useEffect(() => {
    const palco = palcoRef.current
    if (!palco || !imagem) return

    /**
     * Registrado com `passive: false` e via `addEventListener` (não `onWheel`),
     * porque o React registra ouvintes passivos e `preventDefault` seria
     * ignorado. Sem isso, a roda rolaria a página *e* daria zoom.
     *
     * Ctrl+roda é o gesto de zoom do navegador e fica com ele: sequestrá-lo
     * quebraria o zoom de página, que é requisito de acessibilidade.
     */
    const aoRolar = (evento: WheelEvent) => {
      if (evento.ctrlKey) return
      evento.preventDefault()
      const caixa = palco.getBoundingClientRect()
      const ponto = { x: evento.clientX - caixa.left, y: evento.clientY - caixa.top }
      setCampo((atual) =>
        aplicarZoom(atual, ponto, atual.escala * Math.pow(FATOR_RODA, -evento.deltaY), imagem, container),
      )
    }

    palco.addEventListener('wheel', aoRolar, { passive: false })
    return () => palco.removeEventListener('wheel', aoRolar)
  }, [imagem, container])

  /* ────────────────── arrasto e pinça ────────────────── */

  const ponteiros = useRef(new Map<number, { x: number; y: number }>())
  const distanciaInicial = useRef<number | null>(null)
  const escalaInicial = useRef(1)

  const aoPressionar = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (!imagem) return
    ;(evento.target as Element).setPointerCapture?.(evento.pointerId)
    ponteiros.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY })
    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()]
      distanciaInicial.current = Math.hypot(a.x - b.x, a.y - b.y)
      escalaInicial.current = campo.escala
    }
  }

  const aoMover = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (!imagem) return
    const anterior = ponteiros.current.get(evento.pointerId)
    if (!anterior) return
    const atual = { x: evento.clientX, y: evento.clientY }
    ponteiros.current.set(evento.pointerId, atual)

    if (ponteiros.current.size >= 2 && distanciaInicial.current) {
      const [a, b] = [...ponteiros.current.values()]
      const distancia = Math.hypot(a.x - b.x, a.y - b.y)
      const caixa = palcoRef.current!.getBoundingClientRect()
      const centro = {
        x: (a.x + b.x) / 2 - caixa.left,
        y: (a.y + b.y) / 2 - caixa.top,
      }
      const razao = distancia / distanciaInicial.current
      setCampo((c) => aplicarZoom(c, centro, escalaInicial.current * razao, imagem, container))
      return
    }

    setCampo((c) =>
      deslocar(c, { x: atual.x - anterior.x, y: atual.y - anterior.y }, imagem, container),
    )
  }

  const aoSoltar = (evento: React.PointerEvent<HTMLDivElement>) => {
    ponteiros.current.delete(evento.pointerId)
    if (ponteiros.current.size < 2) distanciaInicial.current = null
  }

  /* ────────────────── teclado ────────────────── */

  const aoTeclar = (evento: React.KeyboardEvent<HTMLDivElement>) => {
    if (!imagem) return
    const centro = { x: container.largura / 2, y: container.altura / 2 }
    const mover = (dx: number, dy: number) => {
      evento.preventDefault()
      setCampo((c) => deslocar(c, { x: dx, y: dy }, imagem, container))
    }

    switch (evento.key) {
      case 'ArrowLeft':
        return mover(PASSO_TECLADO, 0)
      case 'ArrowRight':
        return mover(-PASSO_TECLADO, 0)
      case 'ArrowUp':
        return mover(0, PASSO_TECLADO)
      case 'ArrowDown':
        return mover(0, -PASSO_TECLADO)
      case '+':
      case '=':
        evento.preventDefault()
        return setCampo((c) => aplicarZoom(c, centro, c.escala * 1.4, imagem, container))
      case '-':
      case '_':
        evento.preventDefault()
        return setCampo((c) => aplicarZoom(c, centro, c.escala / 1.4, imagem, container))
      case '0':
        evento.preventDefault()
        return ajustar()
      case 'l':
      case 'L':
        evento.preventDefault()
        return alternarTodos()
      case 'f':
      case 'F':
        evento.preventDefault()
        return setTelaCheia((v) => !v)
      case '?':
        evento.preventDefault()
        return setAtalhosVisiveis((v) => !v)
      default:
        // 1–4 trocam de objetivo, espelhando o revólver do microscópio.
        if (['1', '2', '3', '4'].includes(evento.key)) {
          evento.preventDefault()
          trocarObjetivo(OBJETIVOS[Number(evento.key) - 1])
        }
    }
  }

  /* ────────────────── overlays ────────────────── */

  const alternarTodos = useCallback(() => {
    setModoOverlay((atual) => {
      if (atual === 'todos') {
        setAtivos(new Set())
        return 'nenhum'
      }
      setAtivos(new Set(estruturas.map((o) => o.id)))
      return 'todos'
    })
  }, [estruturas])

  const alternarUm = (id: string, exclusivo: boolean) => {
    setModoOverlay('individual')
    setAtivos((atual) => {
      if (exclusivo) return atual.has(id) && atual.size === 1 ? new Set() : new Set([id])
      const proximo = new Set(atual)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
    const novoSelecionado = selecionado === id ? null : id
    setSelecionado(novoSelecionado)
    onSelecionarOverlay?.(novoSelecionado)
  }

  const trocarObjetivo = (objetivo: Objetivo) => {
    if (!imagem) return
    setCampo((c) => aplicarObjetivo(c, objetivo, imagem, container))
  }

  /* ────────────────── derivados ────────────────── */

  const objetivo = imagem && container.largura > 0 ? objetivoAtual(campo, imagem, container) : OBJETIVOS[0]
  const janela = imagem && container.largura > 0 ? janelaVisivel(campo, imagem, container) : null
  const limite = imagem && container.largura > 0 ? limitesDeEscala(imagem, container) : null
  const fatorAtual = limite ? campo.escala / limite.ajuste : 1

  const overlaySelecionado = estruturas.find((o) => o.id === selecionado) ?? null

  /**
   * Filtro aplicado à pilha inteira. O desfoque do micrômetro é multiplicado
   * por uma constante pequena — passar de ~4 px transforma a lâmina em névoa e
   * deixa de ensinar qualquer coisa sobre plano focal.
   */
  const filtro = [
    foco !== 0 ? `blur(${(Math.abs(foco) / 100) * 3.5}px)` : '',
    luz !== 100 ? `brightness(${luz}%)` : '',
    contraste !== 100 ? `contrast(${contraste}%)` : '',
  ]
    .filter(Boolean)
    .join(' ')

  /* ────────────────── render ────────────────── */

  if (!lamina.base) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/25 p-8 text-center">
        <Layers className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" aria-hidden />
        <p className="text-sm font-semibold">Esta página não tem lâmina associada</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
          O acervo de origem não traz imagem-base para este item. O conteúdo abaixo continua
          disponível; o microscópio aparece nas páginas que têm lâmina.
        </p>
      </div>
    )
  }

  if (!urlBase) {
    return (
      <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-center">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          Mídia ainda não publicada
        </p>
        <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">
          {AVISO_MIDIA_INDISPONIVEL}
        </p>
      </div>
    )
  }

  return (
    <section
      className={
        telaCheia
          ? 'fixed inset-0 z-50 flex flex-col bg-[#0d1210]'
          : 'overflow-hidden rounded-xl border border-border bg-card'
      }
      aria-label={`Microscópio virtual: ${lamina.titulo}`}
    >
      {/* ══════════ Barra de instrumentos ══════════ */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/30 px-2.5 py-2">
        <div className="flex items-center gap-0.5" role="group" aria-label="Objetivo">
          {OBJETIVOS.map((o, i) => {
            const ativo = objetivo.id === o.id
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => trocarObjetivo(o)}
                aria-pressed={ativo}
                title={`${o.rotulo} — ${o.descricao} (tecla ${i + 1})`}
                className={`min-h-[36px] min-w-[44px] rounded-md border px-2 font-mono text-xs font-bold transition-colors ${
                  ativo
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-border bg-card text-muted-foreground hover:border-teal-600/50 hover:text-foreground'
                }`}
              >
                {o.rotulo}
              </button>
            )
          })}
        </div>

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />

        <BotaoDeFerramenta
          rotulo="Aproximar"
          onClick={() =>
            imagem &&
            setCampo((c) =>
              aplicarZoom(
                c,
                { x: container.largura / 2, y: container.altura / 2 },
                c.escala * 1.4,
                imagem,
                container,
              ),
            )
          }
        >
          <ZoomIn className="h-4 w-4" aria-hidden />
        </BotaoDeFerramenta>
        <BotaoDeFerramenta
          rotulo="Afastar"
          onClick={() =>
            imagem &&
            setCampo((c) =>
              aplicarZoom(
                c,
                { x: container.largura / 2, y: container.altura / 2 },
                c.escala / 1.4,
                imagem,
                container,
              ),
            )
          }
        >
          <ZoomOut className="h-4 w-4" aria-hidden />
        </BotaoDeFerramenta>
        <BotaoDeFerramenta rotulo="Enquadrar a lâmina inteira" onClick={ajustar}>
          <RotateCcw className="h-4 w-4" aria-hidden />
        </BotaoDeFerramenta>

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />

        <BotaoDeFerramenta
          rotulo={campoCircular ? 'Sair do campo circular' : 'Ver em campo circular'}
          ativo={campoCircular}
          onClick={() => setCampoCircular((v) => !v)}
        >
          <Crosshair className="h-4 w-4" aria-hidden />
        </BotaoDeFerramenta>
        <BotaoDeFerramenta
          rotulo={telaCheia ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
          ativo={telaCheia}
          onClick={() => setTelaCheia((v) => !v)}
        >
          {telaCheia ? (
            <Minimize2 className="h-4 w-4" aria-hidden />
          ) : (
            <Maximize2 className="h-4 w-4" aria-hidden />
          )}
        </BotaoDeFerramenta>
        <BotaoDeFerramenta
          rotulo="Atalhos de teclado (?)"
          ativo={atalhosVisiveis}
          onClick={() => setAtalhosVisiveis((v) => !v)}
        >
          <Keyboard className="h-4 w-4" aria-hidden />
        </BotaoDeFerramenta>

        <div className="ml-auto flex items-center gap-2 pr-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {fatorAtual.toFixed(1)}× campo
          </span>
        </div>
      </div>

      {/* ══════════ Palco ══════════ */}
      <div className={telaCheia ? 'relative flex-1' : 'relative'}>
        <div
          ref={palcoRef}
          tabIndex={0}
          role="application"
          aria-label={`Palco do microscópio. ${lamina.base.alt} Use as setas para deslocar, mais e menos para o zoom, 1 a 4 para trocar de objetivo e L para as camadas.`}
          aria-describedby={`${idBase}-instrucoes`}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onKeyDown={aoTeclar}
          className={`relative overflow-hidden bg-[#0d1210] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-400 ${
            telaCheia ? 'h-full' : altura === 'tela' ? 'h-[70vh]' : 'aspect-[4/3]'
          }`}
          // `touch-action: none` entrega os gestos ao visualizador. Sem isso, o
          // arrasto rolaria a página no celular e a lâmina ficaria intocável.
          style={{ touchAction: 'none', cursor: 'grab' }}
        >
          {/* Retícula do micrômetro, sob a lâmina */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: RETICULA,
              backgroundSize: '40px 40px',
              color: PALETA.petroleoClaro,
            }}
          />

          {/*
            A pilha transformada. Base e overlays recebem exatamente a mesma
            string de `transform`, calculada uma vez. É aqui que o alinhamento
            deixa de ser um cuidado e vira uma propriedade estrutural.
          */}
          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{
              transform: transformCss(campo),
              transformOrigin: '0 0',
              width: imagem?.largura ?? 0,
              height: imagem?.altura ?? 0,
              filter: filtro || undefined,
              transition: 'filter 160ms ease-out',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              // `key` força um nó novo a cada lâmina: sem isso o React
              // reaproveita o elemento e o navegador pode não emitir `load`
              // para a nova fonte já cacheada.
              key={urlBase}
              ref={imagemRef}
              src={urlBase}
              alt={lamina.base.alt}
              draggable={false}
              decoding="async"
              onLoad={(e) => {
                const alvo = e.currentTarget
                setImagem({ largura: alvo.naturalWidth, altura: alvo.naturalHeight })
                setCarregandoBase(false)
              }}
              onError={() => {
                setCarregandoBase(false)
                setErroDeMidia(true)
              }}
              className="block max-w-none select-none"
            />

            {estruturas.map((overlay) => {
              const visivel = ativos.has(overlay.id)
              const url = urlDaMidia(overlay.midia)
              if (!url) return null
              return (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={overlay.id}
                  src={visivel ? url : undefined}
                  data-src={url}
                  // O overlay é decorativo: o rótulo e a explicação vivem na
                  // lista lateral, que é navegável por teclado e lida por leitor
                  // de tela. Duplicar aqui só criaria eco.
                  alt=""
                  aria-hidden
                  draggable={false}
                  decoding="async"
                  loading="lazy"
                  className="pointer-events-none absolute inset-0 block h-full w-full max-w-none select-none transition-opacity duration-200"
                  style={{ opacity: visivel ? opacidade : 0 }}
                />
              )
            })}
          </div>

          {/* Vinheta do campo circular */}
          {campoCircular && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, transparent 0, transparent 44%, rgba(6,10,9,0.55) 52%, rgba(6,10,9,0.97) 62%)',
              }}
            />
          )}

          {carregandoBase && !erroDeMidia && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0d1210]">
              <div className="flex flex-col items-center gap-2 text-white/50">
                <Layers className="h-6 w-6 animate-pulse" aria-hidden />
                <p className="text-xs">Iluminando a lâmina…</p>
              </div>
            </div>
          )}

          {erroDeMidia && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d1210] p-6">
              <p className="max-w-sm text-center text-xs leading-relaxed text-white/70">
                A lâmina não carregou. Pode ser lentidão do servidor de imagens — tente de novo.
              </p>
              <button
                type="button"
                onClick={() => {
                  setErroDeMidia(false)
                  setCarregandoBase(true)
                  // Recarrega a mesma fonte: reatribuir `src` reinicia a busca
                  // mesmo quando a URL não mudou.
                  const img = imagemRef.current
                  if (img && urlBase) {
                    img.src = ''
                    img.src = urlBase
                  }
                }}
                className="min-h-[36px] rounded-md border border-white/25 px-3 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Minimapa */}
          {janela && imagem && janela.largura < 0.98 && (
            <div
              aria-hidden
              className="absolute bottom-3 right-3 hidden overflow-hidden rounded border border-white/20 bg-black/50 sm:block"
              style={{ width: 108, height: 108 * (imagem.altura / imagem.largura) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlBase} alt="" className="h-full w-full object-cover opacity-55" />
              <div
                className="absolute border-2"
                style={{
                  borderColor: PALETA.petroleoClaro,
                  left: `${janela.esquerda * 100}%`,
                  top: `${janela.topo * 100}%`,
                  width: `${janela.largura * 100}%`,
                  height: `${janela.altura * 100}%`,
                }}
              />
            </div>
          )}

          {/*
            Não existe barra de escala em µm porque o acervo não declara
            calibração, e derivá-la do objetivo nominal produziria uma medida
            plausível e falsa — o erro que o aluno não tem como detectar e
            levaria para a bancada real. Ver `larguraDaBarraEmMicrometros`.
          */}
          <p className="absolute bottom-3 left-3 rounded bg-black/45 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-white/60">
            sem calibração métrica no acervo
          </p>
        </div>

        {atalhosVisiveis && <PainelDeAtalhos onFechar={() => setAtalhosVisiveis(false)} />}
      </div>

      <p id={`${idBase}-instrucoes`} className="sr-only">
        Arraste para deslocar a lâmina, use a roda do mouse ou o gesto de pinça para o zoom. Pelo
        teclado: setas deslocam, mais e menos aproximam e afastam, zero enquadra a lâmina inteira,
        teclas 1 a 4 trocam de objetivo, L alterna todas as camadas, F alterna a tela cheia e ponto
        de interrogação abre a lista de atalhos.
      </p>

      {/* ══════════ Controles ══════════ */}
      <div className="grid gap-4 border-t border-border p-3 sm:grid-cols-2">
        <div className="space-y-3">
          <Deslizante
            id={`${idBase}-foco`}
            rotulo="Foco micrométrico"
            nota="simulado"
            icone={<Move className="h-3.5 w-3.5" aria-hidden />}
            valor={foco}
            minimo={-100}
            maximo={100}
            aoMudar={setFoco}
            formatar={(v) => (v === 0 ? 'em foco' : `${v > 0 ? '+' : ''}${v}`)}
          />
          <Deslizante
            id={`${idBase}-luz`}
            rotulo="Iluminação"
            icone={<Sun className="h-3.5 w-3.5" aria-hidden />}
            valor={luz}
            minimo={40}
            maximo={160}
            aoMudar={setLuz}
            formatar={(v) => `${v}%`}
          />
          <Deslizante
            id={`${idBase}-contraste`}
            rotulo="Contraste"
            icone={<Contrast className="h-3.5 w-3.5" aria-hidden />}
            valor={contraste}
            minimo={60}
            maximo={180}
            aoMudar={setContraste}
            formatar={(v) => `${v}%`}
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={alternarTodos}
              aria-pressed={modoOverlay === 'todos'}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-3 text-xs font-bold transition-colors ${
                modoOverlay === 'todos'
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-border bg-card hover:border-violet-500/50'
              }`}
            >
              {modoOverlay === 'todos' ? (
                <EyeOff className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Eye className="h-3.5 w-3.5" aria-hidden />
              )}
              {modoOverlay === 'todos' ? 'Ocultar camadas' : 'Mostrar todas'}
              <span className="sr-only"> — atalho L</span>
            </button>
            <span className="text-[11px] text-muted-foreground">
              {ativos.size} de {estruturas.length} camadas
            </span>
          </div>

          {ativos.size > 0 && (
            <Deslizante
              id={`${idBase}-opacidade`}
              rotulo="Opacidade das camadas"
              icone={<Layers className="h-3.5 w-3.5" aria-hidden />}
              valor={Math.round(opacidade * 100)}
              minimo={20}
              maximo={100}
              aoMudar={(v) => setOpacidade(v / 100)}
              formatar={(v) => `${v}%`}
            />
          )}

          {modo === 'estudo' && overlaySelecionado && (
            <div className="rounded-lg border border-violet-500/25 bg-violet-500/[0.06] p-3">
              <p className="text-sm font-bold leading-snug">{overlaySelecionado.rotulo}</p>
              {!overlaySelecionado.traduzido && (
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  termo ainda no original
                </p>
              )}
              {overlaySelecionado.explicacaoOriginal && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {overlaySelecionado.explicacaoOriginal}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ Bandeja de lâminas ══════════ */}
      {bandeja.length > 1 && onSelecionarLamina && (
        <div className="border-t border-border bg-muted/20 p-2.5">
          <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Bandeja · {bandeja.length} lâminas deste assunto
          </p>
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {bandeja.map((item) => {
              const atual = item.rota === lamina.rota
              const miniatura = item.miniatura ? urlDaMidia(item.miniatura) : null
              return (
                <li key={item.rota} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelecionarLamina(item.rota)}
                    aria-current={atual ? 'true' : undefined}
                    title={item.titulo}
                    className={`block w-24 overflow-hidden rounded-md border text-left transition-colors ${
                      atual ? 'border-teal-600 ring-1 ring-teal-600' : 'border-border hover:border-teal-500/50'
                    }`}
                  >
                    <span className="block aspect-[4/3] bg-black/80">
                      {miniatura && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={miniatura}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="block truncate px-1.5 py-1 text-[10px] font-medium">
                      {item.titulo}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* ══════════ Lista de estruturas ══════════ */}
      {estruturas.length > 0 && (
        <div className="border-t border-border p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Estruturas marcadas nesta lâmina
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {estruturas.map((overlay) => {
              const ativo = ativos.has(overlay.id)
              return (
                <li key={overlay.id}>
                  <button
                    type="button"
                    onClick={(e) => alternarUm(overlay.id, !e.shiftKey)}
                    aria-pressed={ativo}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                      ativo
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : 'border-border bg-card hover:border-violet-500/50'
                    }`}
                  >
                    {/* Marcador de estado que não depende só de cor. */}
                    <span aria-hidden className="font-mono text-[10px]">
                      {ativo ? '●' : '○'}
                    </span>
                    {modo === 'prova' ? `Estrutura ${overlay.ordem}` : overlay.rotulo}
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Clique para isolar uma estrutura; Shift+clique acumula camadas.
          </p>
        </div>
      )}

      {creditosEmCamada.length > 0 && (
        <p className="border-t border-border px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
          Esta lâmina traz {creditosEmCamada.length} camada
          {creditosEmCamada.length > 1 ? 's' : ''} de crédito de imagem no acervo original,
          preservada{creditosEmCamada.length > 1 ? 's' : ''} nos créditos da página.
        </p>
      )}
    </section>
  )
}

/* ────────────────────────── auxiliares ────────────────────────── */

function BotaoDeFerramenta({
  rotulo,
  ativo,
  onClick,
  children,
}: {
  rotulo: string
  ativo?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={rotulo}
      aria-label={rotulo}
      aria-pressed={ativo}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
        ativo
          ? 'border-teal-700 bg-teal-700 text-white'
          : 'border-border bg-card text-muted-foreground hover:border-teal-600/50 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function Deslizante({
  id,
  rotulo,
  nota,
  icone,
  valor,
  minimo,
  maximo,
  aoMudar,
  formatar,
}: {
  id: string
  rotulo: string
  nota?: string
  icone: React.ReactNode
  valor: number
  minimo: number
  maximo: number
  aoMudar: (v: number) => void
  formatar: (v: number) => string
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-[11px] font-semibold">
        <span className="text-muted-foreground">{icone}</span>
        {rotulo}
        {nota && (
          <span className="rounded bg-muted px-1 py-px font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            {nota}
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] font-normal text-muted-foreground">
          {formatar(valor)}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={minimo}
        max={maximo}
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="mt-1 h-6 w-full cursor-pointer accent-teal-700"
      />
    </div>
  )
}

const ATALHOS: Array<[string, string]> = [
  ['Setas', 'Deslocar a lâmina'],
  ['+ / −', 'Aproximar e afastar'],
  ['0', 'Enquadrar a lâmina inteira'],
  ['1 – 4', 'Trocar de objetivo (4×, 10×, 40×, 100×)'],
  ['L', 'Mostrar ou ocultar todas as camadas'],
  ['F', 'Tela cheia'],
  ['Shift + clique', 'Acumular camadas em vez de isolar'],
  ['?', 'Abrir e fechar esta lista'],
]

function PainelDeAtalhos({ onFechar }: { onFechar: () => void }) {
  const fecharRef = useRef<HTMLButtonElement | null>(null)

  // Diálogo: recebe o foco ao abrir, devolve ao fechar e fecha com Esc — as
  // três coisas que um painel flutuante precisa para não prender quem navega
  // por teclado.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    fecharRef.current?.focus()
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      anterior?.focus?.()
    }
  }, [onFechar])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Atalhos de teclado do microscópio"
      className="absolute right-3 top-3 z-10 w-64 rounded-lg border border-border bg-card p-3 shadow-lg"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold">Atalhos</p>
        <button
          ref={fecharRef}
          type="button"
          onClick={onFechar}
          className="-mr-1 inline-flex h-9 items-center rounded px-2 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Fechar
        </button>
      </div>
      <dl className="space-y-1">
        {ATALHOS.map(([tecla, acao]) => (
          <div key={tecla} className="flex items-baseline justify-between gap-3">
            <dt>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                {tecla}
              </kbd>
            </dt>
            <dd className="flex-1 text-right text-[11px] text-muted-foreground">{acao}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default Microscopio
