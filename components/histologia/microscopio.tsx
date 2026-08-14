'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
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
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import type { Midia, Overlay } from '@/lib/histologia/esquemas'
import {
  AVISO_MIDIA_INDISPONIVEL,
  LARGURA_LAMINA,
  LARGURA_MINIATURA,
  LARGURA_PREVIA,
  urlDaMidia,
  urlOtimizada,
} from '@/lib/histologia/midia'
import {
  OBJETIVOS,
  type Campo,
  type Dimensoes,
  type Objetivo,
  acaoDeToqueDoPalco,
  aplicarObjetivo,
  aplicarZoom,
  campoDeAjuste,
  deslocar,
  enquadrar,
  folgaDeArrasto,
  janelaVisivel,
  limitesDeEscala,
  objetivoAtual,
  transformCss,
} from '@/lib/histologia/viewport'
import { dossieDaEstrutura } from '@/lib/histologia/dossies'
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
 *
 * ## Onde ficam as camadas de marcação
 *
 * O seletor de estruturas fica **colado ao palco**, imediatamente abaixo da
 * imagem. Destacar uma estrutura é o gesto mais repetido do módulo — numa aula,
 * dezenas de vezes seguidas — e enterrá-lo no fim de uma coluna de controles
 * obrigava a rolar a tela para trás e para frente a cada troca, com a lâmina
 * saindo do campo de visão justamente no instante em que se quer olhar para
 * ela.
 *
 * O que está destacado é dito **em texto**, em dois lugares: uma tarja sobre o
 * palco (visível na tela cheia e em qualquer projeção) e o cabeçalho do
 * seletor. Cor sozinha não informa: a camada vermelha do acervo pode cair sobre
 * um campo eosinofílico e desaparecer, e quem chega depois na sala não tem como
 * saber o que o professor ligou. Uma região `aria-live` anuncia a mesma troca
 * para leitor de tela.
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

  const [filtroDeEstrutura, setFiltroDeEstrutura] = useState('')
  const [listaExpandida, setListaExpandida] = useState(false)
  const [transbordo, setTransbordo] = useState(false)
  const listaRef = useRef<HTMLUListElement | null>(null)

  const estruturas = useMemo(
    () => lamina.overlays.filter((o) => o.classe === 'estrutura'),
    [lamina.overlays],
  )
  const creditosEmCamada = useMemo(
    () => lamina.overlays.filter((o) => o.classe === 'credito'),
    [lamina.overlays],
  )

  const urlOriginal = lamina.base ? urlDaMidia(lamina.base) : null
  /*
   * Duas resoluções da mesma lâmina.
   *
   * `urlPrevia` tem 640 px e qualidade baixa — cerca de 60 KB em AVIF, contra
   * 1 MB do JPEG original. Ela chega quase imediatamente e é exibida desfocada
   * enquanto a definitiva não termina, de modo que o aluno vê a lâmina desde o
   * primeiro instante em vez de um retângulo preto se preenchendo aos poucos.
   *
   * `urlBase` mantém os 1920 px do original, porque é sobre ela que o zoom do
   * microscópio opera: reduzir aqui destruiria o detalhe no uso principal.
   */
  const urlBase = urlOtimizada(urlOriginal, LARGURA_LAMINA)
  const urlPrevia = urlOtimizada(urlOriginal, LARGURA_PREVIA, 45)

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
    setFiltroDeEstrutura('')
    setListaExpandida(false)
  }, [lamina.rota])

  /*
   * Espelho de `ativos` para leitura dentro de efeitos.
   *
   * A sincronização com o pai precisa saber o que já está ligado sem depender
   * de `ativos`: colocá-lo no array de dependências faria o efeito rodar a cada
   * clique numa camada e desfazer o acúmulo com Shift.
   */
  const ativosRef = useRef(ativos)
  ativosRef.current = ativos

  /**
   * A estrutura destacada pode vir de fora — da busca, ou da lista lateral da
   * página da lâmina — e muda sem trocar de lâmina.
   *
   * Além de selecionar, **acende a camada**: pedir destaque e receber só um
   * dossiê aberto, com a lâmina intocada, era a queixa mais direta de quem
   * usava a lista lateral. Quando a camada já está acesa (caso do eco de volta
   * do próprio microscópio, inclusive com Shift), nada é reescrito — é o que
   * impede o acúmulo de ser desfeito no retorno.
   */
  useEffect(() => {
    const id = overlayInicial ?? null
    setSelecionado(id)
    if (!id || ativosRef.current.has(id)) return
    setAtivos(new Set([id]))
    setModoOverlay('individual')
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

  /* ────────────────── arrasto do mouse e da caneta ────────────────── */

  /**
   * Mouse e caneta ficam no modelo de ponteiro; o toque tem manipulador próprio,
   * logo abaixo. Não é duplicação: no celular a pergunta não é "arrastar ou
   * não", é **de quem é o gesto** — do microscópio ou da página. Um único
   * caminho para os dois obrigava a responder essa pergunta com `touch-action:
   * none` fixo, que é justamente o que prendia o dedo na lâmina.
   */
  const arrasto = useRef<{ x: number; y: number } | null>(null)

  const aoPressionar = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (!imagem || evento.pointerType === 'touch' || evento.button !== 0) return
    evento.currentTarget.setPointerCapture?.(evento.pointerId)
    arrasto.current = { x: evento.clientX, y: evento.clientY }
  }

  const aoMover = (evento: React.PointerEvent<HTMLDivElement>) => {
    const anterior = arrasto.current
    if (!imagem || !anterior || evento.pointerType === 'touch') return
    arrasto.current = { x: evento.clientX, y: evento.clientY }
    setCampo((c) =>
      deslocar(
        c,
        { x: evento.clientX - anterior.x, y: evento.clientY - anterior.y },
        imagem,
        container,
      ),
    )
  }

  const aoSoltar = (evento: React.PointerEvent<HTMLDivElement>) => {
    arrasto.current = null
    if (evento.currentTarget.hasPointerCapture?.(evento.pointerId)) {
      evento.currentTarget.releasePointerCapture(evento.pointerId)
    }
  }

  /* ────────────────── gestos de toque ────────────────── */

  /**
   * De quem é o gesto: do microscópio ou da página.
   *
   * A regra inteira mora em `lib/histologia/viewport.ts`, junto com o resto da
   * matemática do campo e coberta por teste — é uma decisão de comportamento
   * fina demais para ser reencontrada por tentativa dentro de um componente de
   * 1.500 linhas. Aqui só se calcula a folga a cada quadro e se pergunta.
   */
  const folga = useMemo(
    () => (imagem ? folgaDeArrasto(campo, imagem, container) : { x: false, y: false }),
    [campo, imagem, container],
  )
  const acaoDeToque = acaoDeToqueDoPalco(folga)

  // Espelhos para os ouvintes nativos, que são registrados uma vez e não podem
  // fechar sobre o estado de um render antigo.
  const campoRef = useRef(campo)
  campoRef.current = campo
  const folgaRef = useRef(folga)
  folgaRef.current = folga

  /** Publica o campo no estado e no espelho, na mesma linha. */
  const aplicarCampo = useCallback((proximo: Campo) => {
    campoRef.current = proximo
    setCampo(proximo)
  }, [])

  useEffect(() => {
    const palco = palcoRef.current
    if (!palco || !imagem) return

    let modo: 'nenhum' | 'arrasto' | 'pinca' = 'nenhum'
    let ultimo = { x: 0, y: 0 }
    let distanciaInicial = 1
    let escalaInicial = 1
    let inicioDoToque = 0
    let percorrido = 0
    let toqueAnteriorEm = 0
    let pontoDoToqueAnterior = { x: 0, y: 0 }

    const distancia = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)

    const centroNoPalco = (a: Touch, b: Touch) => {
      const caixa = palco.getBoundingClientRect()
      return {
        x: (a.clientX + b.clientX) / 2 - caixa.left,
        y: (a.clientY + b.clientY) / 2 - caixa.top,
      }
    }

    const aoTocar = (evento: TouchEvent) => {
      if (evento.touches.length >= 2) {
        /*
         * Dois dedos são sempre do microscópio. `preventDefault` logo no início
         * do gesto tira dele a rolagem e o zoom do navegador mesmo quando o
         * `touch-action` da vez os permitiria — é o que deixa a pinça funcionar
         * sem ter de trancar o dedo único junto.
         */
        if (evento.cancelable) evento.preventDefault()
        distanciaInicial = Math.max(1, distancia(evento.touches[0], evento.touches[1]))
        escalaInicial = campoRef.current.escala
        modo = 'pinca'
        return
      }

      // Toque que começa num controle sobreposto ao palco (o "apagar destaque")
      // é do controle, não da lâmina.
      if ((evento.target as Element | null)?.closest?.('button')) {
        modo = 'nenhum'
        return
      }

      modo = 'arrasto'
      ultimo = { x: evento.touches[0].clientX, y: evento.touches[0].clientY }
      inicioDoToque = evento.timeStamp
      percorrido = 0
    }

    const aoArrastarComToque = (evento: TouchEvent) => {
      if (modo === 'pinca') {
        if (evento.touches.length < 2) return
        if (evento.cancelable) evento.preventDefault()
        const [a, b] = [evento.touches[0], evento.touches[1]]
        const razao = distancia(a, b) / distanciaInicial
        const centro = centroNoPalco(a, b)
        // Escrever o espelho **antes** do `setCampo` não é zelo: `touchmove`
        // chega mais rápido do que o React re-renderiza, e dois eventos no mesmo
        // quadro leriam o mesmo campo velho — a lâmina tremeria e o ponto sob os
        // dedos escaparia.
        aplicarCampo(aplicarZoom(campoRef.current, centro, escalaInicial * razao, imagem, container))
        return
      }

      if (modo !== 'arrasto' || evento.touches.length !== 1) return

      const toque = evento.touches[0]
      const delta = { x: toque.clientX - ultimo.x, y: toque.clientY - ultimo.y }
      percorrido += Math.abs(delta.x) + Math.abs(delta.y)
      ultimo = { x: toque.clientX, y: toque.clientY }

      const { x: folgaX, y: folgaY } = folgaRef.current
      // Lâmina inteira à vista: não há o que arrastar e o dedo é da página.
      if (!folgaX && !folgaY) return

      const antes = campoRef.current
      const depois = deslocar(antes, delta, imagem, container)
      aplicarCampo(depois)

      // Com folga em um eixo só, o `touch-action` já entregou o outro ao
      // navegador: cancelar o gesto aqui tiraria dele a rolagem que ele está
      // fazendo certo.
      if (!(folgaX && folgaY)) return
      if (evento.cancelable) evento.preventDefault()

      /*
       * A lâmina encostou na borda e o dedo continuou: o que sobrou do gesto
       * volta a ser da página. Sem isto, uma lâmina ampliada vira uma armadilha
       * de rolagem no meio do artigo — o aluno chega ao fim da imagem e a tela
       * simplesmente para de responder.
       */
      const sobra = delta.y - (depois.y - antes.y)
      if (!telaCheia && Math.abs(sobra) > 0.5 && Math.abs(delta.y) > Math.abs(delta.x)) {
        window.scrollBy(0, -sobra)
      }
    }

    const aoLevantar = (evento: TouchEvent) => {
      // Sobrou um dedo depois da pinça: vira arrasto a partir de onde ele está,
      // senão a lâmina salta no primeiro milímetro.
      if (modo === 'pinca' && evento.touches.length === 1) {
        modo = 'arrasto'
        ultimo = { x: evento.touches[0].clientX, y: evento.touches[0].clientY }
        percorrido = Infinity
        return
      }
      if (evento.touches.length > 0) return

      const foiToqueSeco =
        modo === 'arrasto' && percorrido < 12 && evento.timeStamp - inicioDoToque < 320
      modo = 'nenhum'
      if (!foiToqueSeco) return

      const perto =
        evento.timeStamp - toqueAnteriorEm < 320 &&
        Math.hypot(ultimo.x - pontoDoToqueAnterior.x, ultimo.y - pontoDoToqueAnterior.y) < 40

      if (!perto) {
        toqueAnteriorEm = evento.timeStamp
        pontoDoToqueAnterior = ultimo
        return
      }

      // Duplo toque: alterna entre a lâmina inteira e o aumento de trabalho,
      // ancorado onde o dedo tocou. É o gesto que substitui a roda do mouse em
      // quem estuda no celular.
      toqueAnteriorEm = 0
      const caixa = palco.getBoundingClientRect()
      const foco = { x: ultimo.x - caixa.left, y: ultimo.y - caixa.top }
      const { ajuste } = limitesDeEscala(imagem, container)
      const ampliada = campoRef.current.escala > ajuste * 1.05
      aplicarCampo(
        aplicarZoom(
          campoRef.current,
          foco,
          ampliada ? ajuste : ajuste * OBJETIVOS[1].fator,
          imagem,
          container,
        ),
      )
    }

    const aoCancelar = () => {
      modo = 'nenhum'
    }

    palco.addEventListener('touchstart', aoTocar, { passive: false })
    palco.addEventListener('touchmove', aoArrastarComToque, { passive: false })
    palco.addEventListener('touchend', aoLevantar)
    palco.addEventListener('touchcancel', aoCancelar)
    return () => {
      palco.removeEventListener('touchstart', aoTocar)
      palco.removeEventListener('touchmove', aoArrastarComToque)
      palco.removeEventListener('touchend', aoLevantar)
      palco.removeEventListener('touchcancel', aoCancelar)
    }
  }, [imagem, container, telaCheia, aplicarCampo])

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
      case 'n':
      case 'N':
        evento.preventDefault()
        return percorrerEstruturas(1)
      case 'p':
      case 'P':
        evento.preventDefault()
        return percorrerEstruturas(-1)
      case 'Escape':
        // Com o painel de atalhos aberto, Esc é dele: fechar o diálogo vem
        // antes de qualquer outra coisa.
        if (atalhosVisiveis) return
        // Primeiro apaga as camadas; só sai da tela cheia quando não há mais o
        // que apagar. Assim Esc nunca tira a lâmina da tela por engano no meio
        // de uma demonstração.
        if (ativos.size > 0) {
          evento.preventDefault()
          return limparDestaque()
        }
        if (telaCheia) {
          evento.preventDefault()
          return setTelaCheia(false)
        }
        return
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

  /** Apaga todas as camadas de uma vez, sem caçar o botão que está aceso. */
  const limparDestaque = useCallback(() => {
    setModoOverlay('nenhum')
    setAtivos(new Set())
    setSelecionado(null)
    onSelecionarOverlay?.(null)
  }, [onSelecionarOverlay])

  /**
   * Percorre as estruturas uma a uma, isolando cada uma.
   *
   * É o gesto de aula: com a lâmina projetada, passar por todas as marcações em
   * sequência sem tirar a mão do teclado nem a lâmina do enquadramento.
   */
  const percorrerEstruturas = useCallback(
    (passo: 1 | -1) => {
      if (estruturas.length === 0) return
      const atual = estruturas.findIndex((o) => o.id === selecionado)
      const indice =
        atual < 0
          ? passo > 0
            ? 0
            : estruturas.length - 1
          : (atual + passo + estruturas.length) % estruturas.length
      const alvo = estruturas[indice]
      setModoOverlay('individual')
      setAtivos(new Set([alvo.id]))
      setSelecionado(alvo.id)
      onSelecionarOverlay?.(alvo.id)
    },
    [estruturas, selecionado, onSelecionarOverlay],
  )

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

  /*
   * No modo prova a estrutura é anônima — dizer o nome na tarja entregaria a
   * resposta que a questão está pedindo. O número da marcação continua ali,
   * porque é ele que a questão cita.
   */
  const nomeDaEstrutura = useCallback(
    (overlay: Overlay) => (modo === 'prova' ? `Estrutura ${overlay.ordem}` : overlay.rotulo),
    [modo],
  )

  const destacadas = useMemo(
    () => estruturas.filter((o) => ativos.has(o.id)),
    [estruturas, ativos],
  )

  /** Frase única do que está aceso, para a tarja, o cabeçalho e o `aria-live`. */
  const resumoDoDestaque = useMemo(() => {
    if (destacadas.length === 0) return null
    if (destacadas.length === estruturas.length && estruturas.length > 1) {
      return `Todas as ${estruturas.length} estruturas`
    }
    const nomes = destacadas.map(nomeDaEstrutura)
    if (nomes.length === 1) return nomes[0]
    if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`
    return `${nomes[0]}, ${nomes[1]} e mais ${nomes.length - 2}`
  }, [destacadas, estruturas.length, nomeDaEstrutura])

  const estruturasFiltradas = useMemo(() => {
    const termo = filtroDeEstrutura.trim()
    if (!termo) return estruturas
    // Busca sem acento e sem caixa: "epitelio" precisa achar "epitélio", porque
    // ninguém digita acento com uma das mãos no mouse.
    const semAcento = (v: string) =>
      v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const alvo = semAcento(termo)
    return estruturas.filter(
      (o) =>
        semAcento(o.rotulo).includes(alvo) ||
        semAcento(o.rotuloOriginal).includes(alvo) ||
        String(o.ordem) === termo,
    )
  }, [estruturas, filtroDeEstrutura])

  /**
   * Descobre se a lista de estruturas está cortada pela altura máxima.
   *
   * Medir é a única forma honesta: o número de linhas depende do comprimento
   * dos rótulos e da largura da tela, e "mais de N estruturas" acerta no
   * desktop e erra no celular, onde três nomes longos já transbordam.
   */
  useEffect(() => {
    const alvo = listaRef.current
    if (!alvo || listaExpandida) return
    const medir = () => setTransbordo(alvo.scrollHeight > alvo.clientHeight + 2)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [listaExpandida, estruturasFiltradas])

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
      /*
       * Na tela cheia o fundo é `bg-card`, não o preto do palco: só o palco é
       * escuro. Com o preto no contêiner inteiro, a barra de instrumentos e o
       * painel de estruturas ficavam com texto escuro sobre fundo escuro no
       * tema claro — ilegíveis exatamente no modo usado para projetar em sala.
       * `overflow-y-auto` garante que bandeja e créditos continuem alcançáveis
       * quando não cabem na altura da tela.
       */
      className={
        telaCheia
          ? 'fixed inset-0 z-50 flex flex-col overflow-y-auto bg-card'
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
      <div className={telaCheia ? 'relative min-h-[55vh] flex-1' : 'relative'}>
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
          // Calculado a cada quadro a partir da folga da lâmina — ver
          // `acaoDeToque`. Fixá-lo em `none` é o que trancava a rolagem da
          // página no celular sobre uma lâmina que nem tinha para onde ir.
          style={{ touchAction: acaoDeToque, cursor: 'grab' }}
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
              // A lâmina é o elemento principal da página: pedir prioridade
              // alta a tira da fila das imagens decorativas.
              fetchPriority="high"
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

          {/*
            Tarja do destaque.
            Fica sobre o palco porque é ali que o olho está, e porque na tela
            cheia e na projeção em sala o painel de baixo simplesmente não
            existe no campo de visão. `pointer-events-none` no contêiner
            preserva o arrasto da lâmina sob ela; só o botão de limpar volta a
            receber o ponteiro.
          */}
          {resumoDoDestaque && (
            <div className="pointer-events-none absolute left-3 top-3 z-[2] flex max-w-[min(85%,28rem)] items-start gap-2 rounded-lg border border-violet-400/45 bg-black/65 py-1.5 pl-2.5 pr-1.5 backdrop-blur-sm">
              <span
                aria-hidden
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-400 ring-2 ring-violet-400/30"
              />
              <span className="min-w-0">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-white/60">
                  Destacando agora
                </span>
                <span className="block truncate text-[11px] font-semibold leading-snug text-white">
                  {resumoDoDestaque}
                </span>
              </span>
              <button
                type="button"
                onClick={limparDestaque}
                title="Apagar o destaque (Esc)"
                aria-label="Apagar o destaque"
                className="pointer-events-auto -mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}

          {carregandoBase && !erroDeMidia && (
            <div className="absolute inset-0 overflow-hidden bg-[#0d1210]">
              {/*
                A prévia de 640 px entra aqui, desfocada e fora da matemática do
                zoom — ela é placeholder, não conteúdo. Ficar de fora do
                contêiner transformado é o que permite mostrá-la antes de
                `imagem` existir, já que as dimensões do palco vêm da lâmina
                definitiva.
              */}
              {urlPrevia && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={urlPrevia}
                  alt=""
                  aria-hidden
                  draggable={false}
                  decoding="async"
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full scale-110 object-contain opacity-70 blur-lg"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 rounded-lg bg-black/45 px-3 py-2 text-white/70 backdrop-blur-sm">
                  <Layers className="h-6 w-6 animate-pulse" aria-hidden />
                  <p className="text-xs">Iluminando a lâmina…</p>
                </div>
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
              <img
                src={urlPrevia ?? urlBase}
                alt=""
                className="h-full w-full object-cover opacity-55"
              />
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
        Arraste para deslocar a lâmina, use a roda do mouse ou o gesto de pinça para o zoom. No
        celular e no tablet, um dedo rola a página enquanto a lâmina inteira está enquadrada e
        passa a deslocá-la depois que ela é ampliada; dois dedos aproximam e afastam; dois toques
        seguidos alternam entre a lâmina inteira e o aumento de trabalho. Pelo teclado: setas
        deslocam, mais e menos aproximam e afastam, zero enquadra a lâmina inteira,
        teclas 1 a 4 trocam de objetivo, L alterna todas as camadas, N e P passam de uma estrutura
        marcada para a seguinte ou a anterior, Esc apaga o destaque, F alterna a tela cheia e ponto
        de interrogação abre a lista de atalhos.
      </p>

      {/*
        O mesmo estado dito para quem não vê a tarja. `polite` porque a troca de
        camada não interrompe o que o leitor de tela estiver dizendo.
      */}
      <p aria-live="polite" className="sr-only">
        {resumoDoDestaque
          ? `Destacando na lâmina: ${resumoDoDestaque}.`
          : 'Nenhuma estrutura destacada na lâmina.'}
      </p>

      {/* ══════════ Estruturas marcadas — coladas ao palco ══════════ */}
      {estruturas.length > 0 && (
        <div className="border-t border-border bg-muted/25 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Estruturas marcadas
            </p>

            {/* O estado em texto, na altura dos olhos de quem acabou de clicar. */}
            <p
              className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${
                resumoDoDestaque
                  ? 'border-violet-500/45 bg-violet-500/10 font-semibold text-violet-800 dark:text-violet-200'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <span aria-hidden className="font-mono text-[10px]">
                {resumoDoDestaque ? '●' : '○'}
              </span>
              <span className="truncate">
                {resumoDoDestaque
                  ? `Destacando: ${resumoDoDestaque}`
                  : 'Nenhuma estrutura destacada'}
              </span>
            </p>

            <div className="ml-auto flex items-center gap-1.5">
              <span className="hidden text-[11px] text-muted-foreground sm:inline">
                {ativos.size} de {estruturas.length}
              </span>
              <button
                type="button"
                onClick={alternarTodos}
                aria-pressed={modoOverlay === 'todos'}
                title="Mostrar ou ocultar todas as camadas (L)"
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-2.5 text-xs font-bold transition-colors ${
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
                {modoOverlay === 'todos' ? 'Ocultar todas' : 'Mostrar todas'}
                <span className="sr-only"> — atalho L</span>
              </button>
              {ativos.size > 0 && (
                <button
                  type="button"
                  onClick={limparDestaque}
                  title="Apagar o destaque (Esc)"
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/*
            O filtro só aparece quando a lista deixa de caber na varredura
            visual. Em lâmina de seis marcações ele seria mobília.
          */}
          {estruturas.length > 8 && (
            <div className="mt-2">
              <label htmlFor={`${idBase}-filtro`} className="sr-only">
                Filtrar estruturas desta lâmina
              </label>
              <input
                id={`${idBase}-filtro`}
                type="search"
                value={filtroDeEstrutura}
                onChange={(e) => setFiltroDeEstrutura(e.target.value)}
                placeholder={`Filtrar entre ${estruturas.length} estruturas (sem acento também funciona)`}
                className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              />
            </div>
          )}

          {/*
            Altura limitada por padrão: a lista não pode empurrar a lâmina para
            fora da tela, que é justamente o problema que este painel resolve.
            O botão abaixo devolve a lista inteira a quem precisar dela.
          */}
          <ul
            ref={listaRef}
            className={`mt-2 flex flex-wrap gap-1.5 ${
              listaExpandida ? '' : 'max-h-[6.75rem] overflow-y-auto overscroll-contain'
            } ${
              // A máscara esfuma a última linha só quando há mesmo mais lista
              // abaixo: sem ela o corte parece o fim, e metade das estruturas
              // some sem deixar rastro. Aplicá-la numa lista que cabe inteira
              // apagaria a borda inferior de chips perfeitamente visíveis.
              !listaExpandida && transbordo
                ? '[mask-image:linear-gradient(to_bottom,#000_calc(100%-1.5rem),transparent)]'
                : ''
            }`}
          >
            {estruturasFiltradas.map((overlay) => {
              const ativo = ativos.has(overlay.id)
              return (
                <li key={overlay.id}>
                  <button
                    type="button"
                    onClick={(e) => alternarUm(overlay.id, !e.shiftKey)}
                    aria-pressed={ativo}
                    title={
                      modo === 'prova'
                        ? `Estrutura ${overlay.ordem}`
                        : `${overlay.rotulo} — clique para isolar, Shift+clique para somar`
                    }
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
            {estruturasFiltradas.length === 0 && (
              <li className="px-1 py-2 text-[11px] text-muted-foreground">
                Nenhuma estrutura corresponde a “{filtroDeEstrutura}”.
              </li>
            )}
          </ul>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[10px] text-muted-foreground">
              Clique para isolar uma estrutura; Shift+clique soma camadas; N e P percorrem a lista.
            </p>
            {(transbordo || listaExpandida) && (
              <button
                type="button"
                onClick={() => setListaExpandida((v) => !v)}
                aria-expanded={listaExpandida}
                className="ml-auto inline-flex min-h-[36px] items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {listaExpandida ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                )}
                {listaExpandida ? 'Recolher lista' : `Ver todas as ${estruturas.length}`}
              </button>
            )}
          </div>

          {ativos.size > 0 && (
            <div className="mt-2 max-w-sm">
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
            </div>
          )}
        </div>
      )}

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
          {modo === 'estudo' && overlaySelecionado ? (
            <DossieDaEstrutura overlay={overlaySelecionado} />
          ) : (
            estruturas.length > 0 && (
              <p className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
                Destaque uma estrutura acima para ver aqui o que ela é, como reconhecê-la e o que
                muda quando ela adoece.
              </p>
            )
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
              // A bandeja mostra as lâminas a 56 px; baixar o original de 1 MB
              // para cada uma delas era o que fazia a barra inteira travar.
              const miniatura = urlOtimizada(
                item.miniatura ? urlDaMidia(item.miniatura) : null,
                LARGURA_MINIATURA,
                60,
              )
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

/* ────────────────────────── dossiê ────────────────────────── */

/**
 * Aprofundamento da estrutura selecionada.
 *
 * Combina três fontes distintas, e a distinção importa: o rótulo e a explicação
 * vêm do acervo; a origem embriológica, a função, os critérios de
 * reconhecimento e as correlações clínicas são conteúdo próprio
 * (`lib/histologia/dossies.ts`). Estrutura sem dossiê escrito mostra só o que o
 * acervo traz — a lacuna aparece, não é preenchida.
 */
function DossieDaEstrutura({ overlay }: { overlay: Overlay }) {
  const dossie = dossieDaEstrutura(overlay.rotuloOriginal)

  return (
    <div className="rounded-lg border border-violet-500/25 bg-violet-500/[0.06] p-3">
      <p className="text-sm font-bold leading-snug">{overlay.rotulo}</p>
      {!overlay.traduzido && (
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
          termo ainda no original
        </p>
      )}

      {dossie?.funcao && (
        <BlocoDoDossie titulo="Função">{dossie.funcao}</BlocoDoDossie>
      )}
      {dossie?.origemEmbrionaria && (
        <BlocoDoDossie titulo="Origem embriológica">{dossie.origemEmbrionaria}</BlocoDoDossie>
      )}
      {dossie?.comoReconhecer && (
        <BlocoDoDossie titulo="Como reconhecer">{dossie.comoReconhecer}</BlocoDoDossie>
      )}

      {dossie?.relacoesClinicas && dossie.relacoesClinicas.length > 0 && (
        <div className="mt-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Relações clínicas
          </p>
          <dl className="mt-1 space-y-1.5">
            {dossie.relacoesClinicas.map((relacao) => (
              <div key={relacao.situacao} className="border-l-2 border-rose-500/40 pl-2">
                <dt className="text-xs font-semibold">{relacao.situacao}</dt>
                <dd className="text-xs leading-relaxed text-muted-foreground">
                  {relacao.consequencia}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {dossie?.armadilha && (
        <p className="mt-2.5 rounded border border-amber-500/30 bg-amber-500/[0.07] px-2 py-1.5 text-xs leading-relaxed">
          <span className="font-semibold">Armadilha: </span>
          {dossie.armadilha}
        </p>
      )}

      {/* Traduzida, ela é o conteúdo principal da lupa e fica aberta; ainda em
          inglês, continua dobrada atrás do resumo — o aluno escolhe se quer
          encarar o original em vez de topar com ele no meio da leitura. */}
      {overlay.explicacao ? (
        <p className="mt-2.5 text-xs leading-relaxed">{overlay.explicacao}</p>
      ) : (
        overlay.explicacaoOriginal && (
          <details className="mt-2.5">
            <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Descrição do acervo (em inglês)
            </summary>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {overlay.explicacaoOriginal}
            </p>
          </details>
        )
      )}

      {!dossie && (
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          Esta estrutura ainda não tem aprofundamento escrito.
        </p>
      )}
    </div>
  )
}

function BlocoDoDossie({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <p className="mt-0.5 text-xs leading-relaxed">{children}</p>
    </div>
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
  ['N / P', 'Próxima e anterior estrutura marcada'],
  ['Esc', 'Apagar o destaque (e sair da tela cheia)'],
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
