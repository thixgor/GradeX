'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  ExternalLink,
  Flame,
  GraduationCap,
  EyeOff,
  History,
  MessageSquarePlus,
  Trash2,
  Layers,
  Library,
  Maximize2,
  MessageCircle,
  Minimize2,
  RotateCcw,
  Send,
  ShoppingBag,
  Sparkles,
  Square,
  Stethoscope,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type { DestinoDoDom, EtapaSocratica, FonteDoDom, ModoDoDom, RespostaDoDom, StatusDoDom } from '@/lib/dom/config'
import { ETAPAS_SOCRATICAS, MAX_CARACTERES_MENSAGEM, MAX_HISTORICO, ROTULO_DA_ETAPA } from '@/lib/dom/config'
import { DomMascote, type EstadoDoDom } from './dom-mascote'
import { DomLogo } from './dom-logo'
import { TextoDoDom } from './texto-do-dom'
import { EscolhaDeTema, IntroSocratica, ProgressoSocratico, type TemaEscolhido } from './dom-socratico'
import { falaDe, momentoDaSaudacao, textoDaFala, type Fala, type MomentoDaFala } from './falas'
import { bipe, definirMudo, falar, pararDeFalar, silenciarComCena, type PrioridadeDaFala } from './voz'
import { useMudo } from './use-mudo'
import {
  grupoDaData,
  gravarConversas,
  lerConversas,
  novoIdDeConversa,
  removerDaLista,
  salvarNaLista,
  tituloDe,
  type ConversaSalva,
  type GrupoDeData,
} from './arquivo-de-conversas'

/**
 * O painel do Dom. Baixado só quando o aluno abre o Dom pela primeira vez
 * (`next/dynamic` no lançador).
 *
 * Dois tamanhos: no canto (o Dom acompanha a navegação) e EXPANDIDO, uma
 * mesa de estudo em duas colunas — o Dom grande no pedestal, o status do
 * aluno e a escada socrática à esquerda; a conversa à direita. A sessão
 * socrática abre expandida no computador: é estudo, não consulta rápida.
 *
 * A conversa fica na sessão do navegador (`sessionStorage`): o aluno pode
 * navegar ("vou te levar lá") e o papo continua aberto do outro lado, sem o
 * servidor guardar nada. As falas do Dom levam a assinatura que o servidor
 * deu, e é ela que prova na mensagem seguinte que a fala é dele mesmo.
 */

export interface ContextoDoMaterial {
  id: string
  pagina?: number | null
  titulo?: string
}

interface Mensagem {
  id: string
  papel: 'aluno' | 'dom'
  texto: string
  assinatura?: string
  fontes?: FonteDoDom[]
  destino?: DestinoDoDom | null
  sugestoes?: string[]
  tom?: 'erro'
  /** Destino já usado (ou cancelado): não navega de novo ao remontar. */
  destinoResolvido?: boolean
  hora?: string
}

interface EstadoSocratico {
  fase: 'intro' | 'tema' | 'sessao'
  tema?: TemaEscolhido
  etapa: EtapaSocratica | null
  progresso: number
}

interface Guardado {
  modo: ModoDoDom
  conversas: Partial<Record<ModoDoDom, Mensagem[]>>
  socratico: EstadoSocratico
  expandido?: boolean
  /** Qual conversa salva está aberta em cada modo. */
  idAtual?: Partial<Record<ModoDoDom, string>>
}

const CHAVE = 'dom:conversa:v1'
const CHAVE_INTRO = 'dom:viu-intro-socratica'
const CHAVE_CONHECEU = 'dom:conheceu'
const SOCRATICO_INICIAL: EstadoSocratico = { fase: 'intro', etapa: null, progresso: 0 }
const AVATAR = '/dom/v1/dom-rosto.webp'

function ler<T>(chave: string, armazenamento: 'local' | 'sessao'): T | null {
  try {
    const s = (armazenamento === 'local' ? localStorage : sessionStorage).getItem(chave)
    return s ? (JSON.parse(s) as T) : null
  } catch {
    return null
  }
}
function gravar(chave: string, valor: unknown, armazenamento: 'local' | 'sessao') {
  try {
    ;(armazenamento === 'local' ? localStorage : sessionStorage).setItem(chave, JSON.stringify(valor))
  } catch {
    /* sem armazenamento: a conversa vive só nesta tela */
  }
}

let contador = 0
const novoId = () => `${Date.now().toString(36)}-${(contador++).toString(36)}`
const horaAgora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const telaLarga = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches

const ESTADO_DO_HUMOR: Record<string, EstadoDoDom> = {
  feliz: 'feliz',
  pensando: 'pensando',
  explicando: 'explicando',
  animado: 'animado',
  preocupado: 'preocupado',
  orgulhoso: 'orgulhoso',
}

/** Prioridade da voz pelo prefixo do id da fala (ver a parcimônia em `voz.ts`). */
const PRIORIDADE_DO_MOMENTO: Record<string, PrioridadeDaFala> = {
  pensando: 'baixa',
  'pensando-saude': 'baixa',
  achou: 'baixa',
  navegando: 'baixa',
  'socratico-vestir': 'alta',
  'socratico-fim': 'alta',
  'som-ligado': 'alta',
}

const PASSOS_DO_RACIOCINIO: Record<ModoDoDom, string[]> = {
  geral: ['Entendendo sua pergunta', 'Procurando nas melhores fontes', 'Montando uma explicação didática'],
  material: ['Lendo o contexto do material', 'Conectando com a sua dúvida', 'Escrevendo a explicação'],
  socratico: ['Lendo o seu raciocínio', 'Encontrando o próximo degrau', 'Preparando a pergunta'],
}

/** Último status lido nesta visita: na troca de página o painel já nasce pronto. */
let statusEmMemoria: StatusDoDom | null = null
/** E a última frase do balão, para ele não ficar vazio (nem falar de novo) na troca de página. */
let falaEmMemoria: { texto: string; tom?: 'erro' } = { texto: '' }

export function DomAssistente({
  nome,
  material,
  rota,
  aoFechar,
  continuacao = false,
  aoEsconder,
  ondeEsconder = 'aqui',
}: {
  nome: string
  material?: ContextoDoMaterial | null
  rota: string
  aoFechar: () => void
  /** Já estava aberto na página anterior: sem entrada, bipe nem saudação nova. */
  continuacao?: boolean
  /** Esconde o Dom nesta seção (volta em Perfil › Ajustes). */
  aoEsconder?: () => void
  ondeEsconder?: string
}) {
  const router = useRouter()
  const guardado = useRef<Guardado | null>(null)
  if (guardado.current === null && typeof window !== 'undefined') guardado.current = ler<Guardado>(CHAVE, 'sessao')

  const [modo, setModo] = useState<ModoDoDom>(() => (material ? 'material' : guardado.current?.modo === 'material' ? 'geral' : guardado.current?.modo || 'geral'))
  const [conversas, setConversas] = useState<Partial<Record<ModoDoDom, Mensagem[]>>>(() => guardado.current?.conversas || {})
  const [socratico, setSocratico] = useState<EstadoSocratico>(() => guardado.current?.socratico || SOCRATICO_INICIAL)
  const [expandido, setExpandido] = useState<boolean>(() => !!guardado.current?.expandido && telaLarga())
  const [idAtual, setIdAtual] = useState<Partial<Record<ModoDoDom, string>>>(() => guardado.current?.idAtual || {})
  const [arquivo, setArquivo] = useState<ConversaSalva<Mensagem, EstadoSocratico>[]>([])
  const [verHistorico, setVerHistorico] = useState(false)
  const [status, setStatus] = useState<StatusDoDom | null>(() => (continuacao ? statusEmMemoria : null))
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [passo, setPasso] = useState(0)
  const [novaId, setNovaId] = useState<string | null>(null)
  const [fala, setFala] = useState<{ texto: string; tom?: 'erro' }>(() => (continuacao ? falaEmMemoria : { texto: '' }))
  useEffect(() => {
    falaEmMemoria = fala
  }, [fala])
  const [estado, setEstado] = useState<EstadoDoDom>(continuacao ? 'feliz' : 'acenando')
  const [falando, setFalando] = useState(false)
  const [boca, setBoca] = useState(false)
  const mudo = useMudo()
  const [saindo, setSaindo] = useState(false)
  const [confete, setConfete] = useState(false)
  const conversaRef = useRef<HTMLDivElement>(null)
  const entradaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const conversouRef = useRef(false)
  const primeiroNome = status?.primeiroNome || nome

  const mensagens = conversas[modo] || []
  const traje = modo === 'socratico' && socratico.fase !== 'intro' ? 'socrates' : 'normal'

  useEffect(() => {
    gravar(CHAVE, { modo, conversas, socratico, expandido, idAtual } satisfies Guardado, 'sessao')
  }, [modo, conversas, socratico, expandido, idAtual])

  // Arquivo de conversas da conta (chega com o status, que traz a `conta`).
  const conta = status?.conta || ''
  useEffect(() => {
    if (status?.liberado) setArquivo(lerConversas<Mensagem, EstadoSocratico>(conta))
  }, [conta, status?.liberado])

  // Toda mudança na conversa aberta é salva no arquivo (a vazia não entra).
  useEffect(() => {
    if (!status?.liberado) return
    const msgs = conversas[modo] || []
    if (!msgs.length) return
    let id = idAtual[modo]
    if (!id) {
      id = novoIdDeConversa()
      setIdAtual((a) => ({ ...a, [modo]: id }))
    }
    const conversa: ConversaSalva<Mensagem, EstadoSocratico> = {
      id,
      modo,
      titulo: modo === 'socratico' && socratico.tema ? `Socrático: ${socratico.tema.titulo}` : tituloDe(msgs),
      atualizadaEm: Date.now(),
      mensagens: msgs.filter((m) => !m.tom),
      socratico: modo === 'socratico' ? socratico : undefined,
    }
    setArquivo((lista) => {
      const nova = salvarNaLista(lista, conversa)
      gravarConversas(conta, nova)
      return nova
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversas, socratico, modo, status?.liberado])

  /**
   * Mostra no balão e fala com a voz gravada do Dom (ou mexe a boca em
   * silêncio, se ainda não há áudio para a fala). Texto solto — a mensagem de
   * erro que veio da API — só aparece no balão.
   */
  const dizer = useCallback((conteudo: Fala | string, opcoes: { tom?: 'erro'; voz?: boolean; prioridade?: PrioridadeDaFala } = {}) => {
    if (typeof conteudo === 'string') {
      setFala({ texto: conteudo, tom: opcoes.tom })
      return
    }
    setFala({ texto: textoDaFala(conteudo), tom: opcoes.tom })
    if (opcoes.voz === false) return
    falar(
      conteudo,
      {
        aoComecar: () => setFalando(true),
        aoTerminar: () => setFalando(false),
        aoBoca: setBoca,
      },
      { prioridade: opcoes.prioridade ?? PRIORIDADE_DO_MOMENTO[conteudo.id.replace(/-\d+b?$/, '')] ?? 'normal' },
    )
  }, [])
  const dizerMomento = useCallback((m: MomentoDaFala, opcoes?: { tom?: 'erro'; voz?: boolean; prioridade?: PrioridadeDaFala }) => dizer(falaDe(m), opcoes), [dizer])

  // Abertura: status + saudação pela hora (apresentação na primeira vez da vida).
  useEffect(() => {
    let vivo = true
    if (!continuacao) bipe('abrir')
    fetch('/api/dom/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((s: StatusDoDom) => {
        if (!vivo) return
        statusEmMemoria = s
        setStatus(s)
        // Troca de página com o painel aberto: só atualiza o status, em silêncio.
        if (continuacao && s.liberado) {
          setEstado('feliz')
          return
        }
        if (!s.liberado) {
          dizer(falaDe('bloqueado'))
          return
        }
        if (!ler<boolean>(CHAVE_CONHECEU, 'local')) {
          gravar(CHAVE_CONHECEU, true, 'local')
          dizer(falaDe('primeiraVez'))
        } else if (material) {
          dizer(falaDe('material'))
        } else {
          dizer(falaDe(momentoDaSaudacao()))
        }
        setTimeout(() => vivo && setEstado('feliz'), 1800)
      })
      .catch(() => {
        if (!vivo) return
        setEstado('erro')
        dizer(falaDe('erro'), { tom: 'erro' })
      })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rola até o fim depois de o navegador montar o que entrou (resposta nova ou
  // o cartão de raciocínio crescendo a cada passo).
  useEffect(() => {
    const quadro = requestAnimationFrame(() => {
      const el = conversaRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
    return () => cancelAnimationFrame(quadro)
  }, [mensagens.length, carregando, passo])

  useEffect(() => {
    const t = setTimeout(() => entradaRef.current?.focus({ preventScroll: true }), 450)
    return () => clearTimeout(t)
  }, [modo])

  const fechar = useCallback(() => {
    abortRef.current?.abort()
    if (conversouRef.current) dizerMomento('tchau')
    else pararDeFalar()
    bipe('fechar')
    setSaindo(true)
    setTimeout(aoFechar, 190)
  }, [aoFechar, dizerMomento])
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (expandido) setExpandido(false)
      else fechar()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [fechar, expandido])

  // Enquanto espera: o balão troca de frase e o cartão de raciocínio avança.
  // É uma ilusão de trabalho honesta — o servidor está mesmo montando o contexto e chamando a IA.
  useEffect(() => {
    if (!carregando) return
    const ultimo = (conversas[modo] || []).at(-1)?.texto || ''
    const saude = /\b(fisiolog|patolog|anatom|farmac|doen|tratament|diagn|sintom|mecanism|receptor|horm|celul)/i.test(ultimo)
    let i = 0
    setPasso(0)
    const girar = () => {
      // Só a primeira frase sai em voz; as seguintes trocam no balão (falar a cada 1,7 s cansaria).
      dizer(falaDe(i > 0 && saude ? 'pensandoSaude' : 'pensando'), { voz: i === 0 })
      setPasso(Math.min(i, 2))
      i++
    }
    girar()
    const t = setInterval(girar, 1700)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando])

  const acrescentar = useCallback((m: ModoDoDom, msg: Mensagem) => {
    setConversas((c) => ({ ...c, [m]: [...(c[m] || []), { ...msg, hora: horaAgora() }].slice(-40) }))
  }, [])

  const enviar = useCallback(
    async (conteudo: string, extra?: { tema?: TemaEscolhido }) => {
      const limpo = conteudo.trim().slice(0, MAX_CARACTERES_MENSAGEM)
      if (!limpo || carregando || !status?.liberado) return
      const modoAtual = modo
      const historico = (conversas[modoAtual] || [])
        .filter((m) => !m.tom)
        .slice(-MAX_HISTORICO)
        .map((m) => ({ papel: m.papel, texto: m.texto, assinatura: m.assinatura }))
      // A conversa ganha id já na primeira mensagem: o servidor guarda o
      // histórico por ele (o mesmo do arquivo do aparelho).
      const conversaId = idAtual[modoAtual] || novoIdDeConversa()
      if (!idAtual[modoAtual]) setIdAtual((a) => ({ ...a, [modoAtual]: conversaId }))
      acrescentar(modoAtual, { id: novoId(), papel: 'aluno', texto: limpo })
      setTexto('')
      if (entradaRef.current) entradaRef.current.style.height = 'auto'
      setCarregando(true)
      setEstado('pensando')
      conversouRef.current = true
      bipe('enviar')

      const temaAtual = extra?.tema || socratico.tema
      const tema =
        modoAtual === 'socratico' && temaAtual
          ? temaAtual.tipo === 'grade'
            ? { curso: temaAtual.curso, periodo: temaAtual.periodo, id: temaAtual.id }
            : { livre: temaAtual.titulo }
          : undefined

      const controle = new AbortController()
      abortRef.current = controle
      try {
        const r = await fetch('/api/dom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modo: modoAtual,
            mensagem: limpo,
            conversaId,
            historico,
            contexto: { rota, materialId: material?.id, pagina: material?.pagina ?? undefined, tema },
          }),
          signal: controle.signal,
        })
        const dados = await r.json().catch(() => ({}))
        if (!r.ok) {
          const motivo = dados?.motivo
          acrescentar(modoAtual, { id: novoId(), papel: 'dom', texto: dados?.error || textoDaFala(falaDe('erro')), tom: 'erro' })
          setEstado(r.status === 429 ? 'preocupado' : 'erro')
          bipe('erro')
          const momento: MomentoDaFala = r.status === 429 ? (motivo === 'minuto' ? 'calma' : 'limite') : r.status === 503 ? 'semSinal' : 'erro'
          dizerMomento(momento, { tom: 'erro' })
          if (motivo === 'dia') setStatus((s) => (s ? { ...s, restantes: 0 } : s))
          return
        }
        const resposta = dados as RespostaDoDom & { assinatura?: string }
        const id = novoId()
        acrescentar(modoAtual, {
          id,
          papel: 'dom',
          texto: resposta.texto,
          assinatura: resposta.assinatura,
          fontes: resposta.fontes,
          destino: resposta.destino,
          sugestoes: resposta.sugestoes,
        })
        setNovaId(id)
        setStatus((s) => (s ? { ...s, restantes: resposta.restantes } : s))
        setEstado(ESTADO_DO_HUMOR[resposta.humor] || 'feliz')
        bipe('resposta')
        if (resposta.destino && !resposta.destino.exclusivo) dizerMomento('navegando')
        else dizerMomento('achou', { voz: false })
        if (modoAtual === 'socratico' && resposta.socratico) {
          const { etapa, progresso } = resposta.socratico
          setSocratico((s) => ({ ...s, etapa, progresso: Math.max(s.progresso, progresso) }))
          if (etapa === 'sintese' && progresso >= 90) {
            setConfete(true)
            setEstado('orgulhoso')
            bipe('magia')
            dizerMomento('socraticoFim')
            setTimeout(() => setConfete(false), 2300)
          }
        }
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return
        acrescentar(modoAtual, { id: novoId(), papel: 'dom', texto: textoDaFala(falaDe('erro')), tom: 'erro' })
        setEstado('erro')
        bipe('erro')
        dizerMomento('erro', { tom: 'erro' })
      } finally {
        setCarregando(false)
        abortRef.current = null
      }
    },
    [acrescentar, carregando, conversas, dizerMomento, idAtual, material, modo, rota, socratico.tema, status?.liberado],
  )

  const irPara = useCallback(
    (destino: DestinoDoDom, idMsg: string) => {
      setConversas((c) => ({ ...c, [modo]: (c[modo] || []).map((m) => (m.id === idMsg ? { ...m, destinoResolvido: true } : m)) }))
      setExpandido(false)
      router.push(destino.href)
      // No celular o painel cobre a tela inteira: fecha para mostrar a página.
      if (window.matchMedia('(max-width: 639px)').matches) setTimeout(aoFechar, 250)
    },
    [aoFechar, modo, router],
  )

  const trocarModo = (m: ModoDoDom) => {
    if (m === modo || carregando) return
    setModo(m)
    setNovaId(null)
    if (m === 'socratico') {
      const viu = ler<boolean>(CHAVE_INTRO, 'local')
      if (telaLarga()) setExpandido(true)
      if (viu && socratico.fase === 'intro') setSocratico((s) => ({ ...s, fase: 'tema' }))
      if (viu || socratico.fase !== 'intro') {
        bipe('magia')
        dizerMomento('socraticoVestir')
        setEstado('animado')
      } else {
        dizerMomento('socraticoInicio')
      }
    } else if (modo === 'socratico' && socratico.fase !== 'intro') {
      dizerMomento('socraticoTirar')
      setEstado('feliz')
    }
  }

  const comecarSocratico = () => {
    gravar(CHAVE_INTRO, true, 'local')
    setSocratico((s) => ({ ...s, fase: 'tema' }))
    bipe('magia')
    setEstado('animado')
    dizerMomento('socraticoVestir')
  }

  const escolherTema = (t: TemaEscolhido) => {
    setIdAtual((a) => ({ ...a, socratico: novoIdDeConversa() }))
    setSocratico({ fase: 'sessao', tema: t, etapa: 'diagnostico', progresso: 0 })
    setConversas((c) => ({ ...c, socratico: [] }))
    void enviar(`Quero estudar pelo método socrático: ${t.titulo}`, { tema: t })
  }

  const novoTema = () => {
    abortRef.current?.abort()
    setSocratico({ fase: 'tema', etapa: null, progresso: 0 })
    setConversas((c) => ({ ...c, socratico: [] }))
    dizerMomento('socraticoInicio', { voz: false })
  }

  /** Silenciar tem cena (o Dom reclama e leva a fita); religar tira a fita e ele comemora. */
  /** Começa do zero no modo atual; a conversa anterior fica no arquivo. */
  const novaConversa = () => {
    abortRef.current?.abort()
    setVerHistorico(false)
    setNovaId(null)
    setIdAtual((a) => ({ ...a, [modo]: novoIdDeConversa() }))
    setConversas((c) => ({ ...c, [modo]: [] }))
    if (modo === 'socratico') setSocratico((s) => ({ fase: s.fase === 'intro' ? 'intro' : 'tema', etapa: null, progresso: 0 }))
    setEstado('feliz')
    entradaRef.current?.focus()
  }

  const abrirConversa = (c: ConversaSalva<Mensagem, EstadoSocratico>) => {
    abortRef.current?.abort()
    setVerHistorico(false)
    setNovaId(null)
    setModo(c.modo === 'material' && !material ? 'geral' : c.modo)
    const destino = c.modo === 'material' && !material ? 'geral' : c.modo
    setIdAtual((a) => ({ ...a, [destino]: c.id }))
    setConversas((atual) => ({ ...atual, [destino]: c.mensagens.map((m) => ({ ...m, destinoResolvido: true })) }))
    if (c.modo === 'socratico' && c.socratico) setSocratico({ ...c.socratico, fase: 'sessao' })
  }

  const apagarConversa = (id: string) => {
    setArquivo((lista) => {
      const nova = removerDaLista(lista, id)
      gravarConversas(conta, nova)
      return nova
    })
    if (idAtual[modo] === id) {
      setIdAtual((a) => ({ ...a, [modo]: novoIdDeConversa() }))
      setConversas((c) => ({ ...c, [modo]: [] }))
    }
  }

  const alternarMudo = () => {
    if (mudo) {
      definirMudo(false)
      dizer(falaDe('somLigado'))
      setEstado('animado')
      return
    }
    const fala = falaDe('somDesligado')
    setFala({ texto: textoDaFala(fala) })
    setEstado('preocupado')
    silenciarComCena(fala, { aoComecar: () => setFalando(true), aoTerminar: () => setFalando(false), aoBoca: setBoca })
  }

  const comecarFrase = (frase: string) => {
    setTexto(frase)
    requestAnimationFrame(() => {
      const el = entradaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(frase.length, frase.length)
    })
  }

  const liberado = status?.liberado
  const restantes = status?.restantes ?? 0
  const limite = status?.limiteDiario || 1
  const ultima = mensagens.at(-1)
  const sugestoes = ultima?.papel === 'dom' ? ultima.sugestoes || [] : []
  const mostraEntrada = liberado && (modo !== 'socratico' || socratico.fase === 'sessao')
  const abas: Array<{ id: ModoDoDom; rotulo: string; icone: typeof MessageCircle }> = [
    ...(material ? [{ id: 'material' as const, rotulo: 'Este material', icone: BookOpen }] : []),
    { id: 'geral', rotulo: 'Conversar', icone: MessageCircle },
    { id: 'socratico', rotulo: 'Método Socrático', icone: GraduationCap },
  ]
  const indiceDaAba = Math.max(0, abas.findIndex((a) => a.id === modo))
  const saudacao = { bomDia: 'Bom dia', boaTarde: 'Boa tarde', boaNoite: 'Boa noite', madrugada: 'Boa madrugada' }[momentoDaSaudacao() as 'bomDia'] || 'Olá'

  return (
    <>
      {expandido && <div className="dom-veu" onClick={() => setExpandido(false)} aria-hidden />}
      <div
        className="dom-escopo dom-painel"
        role="dialog"
        aria-label="Dom, assistente de IA da DomineAqui"
        data-modo={modo}
        data-expandido={expandido || undefined}
        data-saindo={saindo || undefined}
        data-continuacao={continuacao || undefined}
      >
        <div className="dom-aurora" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="dom-friso" aria-hidden />

        <header className="dom-cabeca">
          <DomLogo className="dom-cabeca__logo" pensando={carregando} soSelo />
          <div className="dom-cabeca__nome">
            <strong>{modo === 'socratico' && socratico.fase !== 'intro' ? 'Dom Sócrates' : 'Dom'}</strong>
            <span>{carregando ? 'pensando…' : 'DomineAqui AI · online'}</span>
          </div>
          <div className="ml-auto flex items-center gap-0.5">
            {liberado && (
              <>
                <button type="button" className="dom-icone-botao" onClick={novaConversa} aria-label="Nova conversa" title="Nova conversa">
                  <MessageSquarePlus className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  className="dom-icone-botao"
                  onClick={() => setVerHistorico((v) => !v)}
                  aria-label="Conversas salvas"
                  aria-pressed={verHistorico}
                  title="Conversas"
                >
                  <History className="h-[18px] w-[18px]" />
                </button>
              </>
            )}
            <button
              type="button"
              className="dom-icone-botao hidden sm:inline-flex"
              onClick={() => setExpandido((e) => !e)}
              aria-label={expandido ? 'Voltar para o canto' : 'Expandir (modo estudo)'}
              title={expandido ? 'Voltar para o canto' : 'Modo estudo'}
            >
              {expandido ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
            </button>
            {aoEsconder && (
              <button
                type="button"
                className="dom-icone-botao"
                onClick={aoEsconder}
                aria-label={`Esconder o Dom ${ondeEsconder}`}
                title={`Esconder o Dom ${ondeEsconder} (volta em Perfil › Ajustes)`}
              >
                <EyeOff className="h-[18px] w-[18px]" />
              </button>
            )}
            <button type="button" className="dom-icone-botao" onClick={alternarMudo} aria-label={mudo ? 'Ligar o som do Dom' : 'Silenciar o Dom'} aria-pressed={!mudo}>
              {mudo ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
            </button>
            <button type="button" className="dom-icone-botao" onClick={fechar} aria-label="Fechar o Dom">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {liberado && (
          <div className="dom-abas" role="tablist" aria-label="Modos do Dom" style={{ ['--n' as string]: abas.length, ['--i' as string]: indiceDaAba } as CSSProperties}>
            <span className="dom-abas__pilula" aria-hidden />
            {abas.map(({ id, rotulo, icone: Icone }) => (
              <button key={id} type="button" role="tab" aria-selected={modo === id} className="dom-aba" onClick={() => trocarModo(id)}>
                <Icone className="h-4 w-4" aria-hidden />
                {rotulo}
              </button>
            ))}
          </div>
        )}

        {verHistorico && liberado && (
          <Historico
            conversas={arquivo}
            atual={idAtual[modo]}
            aoAbrir={abrirConversa}
            aoApagar={apagarConversa}
            aoNova={novaConversa}
            aoFechar={() => setVerHistorico(false)}
          />
        )}

        <div className="dom-corpo">
          {/* Lateral: no canto vira só o palco; expandido ganha status e escada. */}
          <aside className="dom-lateral">
            <div className="dom-palco">
              <div className="dom-palco__mascote">
                <DomMascote estado={estado} traje={traje} falando={falando} boca={boca} calado={mudo && !falando} />
              </div>
              <div className="dom-palco__fala" data-tom={fala.tom} aria-live="polite">
                <p key={fala.texto} className="dom-palco__fala-texto">
                  {fala.texto || '…'}
                </p>
              </div>
              {confete && <Confete />}
            </div>

            {liberado && (
              <div className="dom-so-expandido space-y-3">
                {status?.xp && !(modo === 'socratico' && socratico.fase === 'sessao') && <CartaoDeStatus status={status} />}
                {modo === 'socratico' && socratico.fase === 'sessao' ? (
                  <EscadaVertical etapa={socratico.etapa} />
                ) : (
                  <div className="dom-lateral-cartao">
                    <h4>Sua cota de hoje</h4>
                    <Cota restantes={restantes} limite={limite} grande />
                  </div>
                )}
              </div>
            )}
          </aside>

          <main className="dom-principal">
            {status === null ? (
              <div className="flex flex-1 items-center justify-center">
                <Raciocinio passos={['Acordando o Dom', 'Lendo seu perfil', 'Quase lá']} atual={1} />
              </div>
            ) : !liberado ? (
              <Vitrine status={status} />
            ) : modo === 'socratico' && socratico.fase === 'intro' ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <IntroSocratica aoComecar={comecarSocratico} />
              </div>
            ) : modo === 'socratico' && socratico.fase === 'tema' ? (
              <EscolhaDeTema periodoDoAluno={status.periodo} aoEscolher={escolherTema} aoVoltar={() => setSocratico((s) => ({ ...s, fase: 'intro' }))} />
            ) : (
              <>
                {modo === 'socratico' && socratico.tema && (
                  <div className="flex items-center gap-1 pr-2">
                    <div className="min-w-0 flex-1">
                      <ProgressoSocratico etapa={socratico.etapa} progresso={socratico.progresso} tema={socratico.tema.titulo} />
                    </div>
                    <button type="button" className="dom-icone-botao" onClick={novoTema} aria-label="Escolher outro tema" title="Outro tema">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div ref={conversaRef} className="dom-conversa" aria-live="polite">
                  {!mensagens.length && modo !== 'socratico' && (
                    <BoasVindas
                      saudacao={saudacao}
                      nome={primeiroNome}
                      material={modo === 'material' ? material : null}
                      aoFrase={comecarFrase}
                      aoEnviar={(f) => void enviar(f)}
                      aoSocratico={() => trocarModo('socratico')}
                    />
                  )}
                  {mensagens.map((m) => (
                    <MensagemDoDom
                      key={m.id}
                      m={m}
                      nova={m.id === novaId}
                      automatico={m.id === ultima?.id && !m.destinoResolvido}
                      aoIr={irPara}
                      aoCancelar={(id) => setConversas((c) => ({ ...c, [modo]: (c[modo] || []).map((x) => (x.id === id ? { ...x, destinoResolvido: true } : x)) }))}
                    />
                  ))}
                  {carregando && <Raciocinio passos={PASSOS_DO_RACIOCINIO[modo]} atual={passo} />}
                </div>

                {!carregando && sugestoes.length > 0 && (
                  <div className="dom-sugestoes">
                    {sugestoes.map((s) => (
                      <button key={s} type="button" className="dom-chip" onClick={() => void enviar(s)}>
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {mostraEntrada && (
              <>
                <form
                  className="dom-compositor"
                  data-pensando={carregando || undefined}
                  onSubmit={(e) => {
                    e.preventDefault()
                    void enviar(texto)
                  }}
                >
                  <div className="dom-entrada">
                    <textarea
                      ref={entradaRef}
                      rows={1}
                      value={texto}
                      maxLength={MAX_CARACTERES_MENSAGEM}
                      placeholder={
                        restantes <= 0
                          ? 'Seu limite de hoje acabou — volto amanhã!'
                          : modo === 'socratico'
                            ? 'Sua resposta (vale "não sei")…'
                            : modo === 'material'
                              ? 'Sua dúvida sobre o material…'
                              : `Pergunte qualquer coisa, ${primeiroNome || 'futuro doutor'}…`
                      }
                      disabled={restantes <= 0}
                      onChange={(e) => {
                        setTexto(e.target.value)
                        const el = e.target
                        el.style.height = 'auto'
                        el.style.height = `${Math.min(el.scrollHeight, 120)}px`
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void enviar(texto)
                        }
                      }}
                      aria-label="Mensagem para o Dom"
                    />
                    {carregando ? (
                      <button type="button" className="dom-enviar" onClick={() => abortRef.current?.abort()} aria-label="Parar">
                        <Square className="h-4 w-4" />
                      </button>
                    ) : (
                      <button type="submit" className="dom-enviar" disabled={!texto.trim() || restantes <= 0} aria-label="Enviar">
                        <Send className="h-[18px] w-[18px]" />
                      </button>
                    )}
                  </div>
                </form>
                <div className="dom-rodape">
                  <span className={modo === 'socratico' ? undefined : 'dom-so-lado'}>
                    <Cota restantes={restantes} limite={limite} />
                  </span>
                  <span>Conteúdo educacional · confira as fontes</span>
                  {texto.length > MAX_CARACTERES_MENSAGEM * 0.8 && (
                    <span>
                      {texto.length}/{MAX_CARACTERES_MENSAGEM}
                    </span>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

const ICONE_DO_MODO: Record<ModoDoDom, typeof MessageCircle> = { geral: MessageCircle, socratico: GraduationCap, material: BookOpen }

/** Gaveta das conversas salvas no aparelho (até 25; as mais antigas saem sozinhas). */
function Historico({
  conversas,
  atual,
  aoAbrir,
  aoApagar,
  aoNova,
  aoFechar,
}: {
  conversas: ConversaSalva<Mensagem, EstadoSocratico>[]
  atual?: string
  aoAbrir: (c: ConversaSalva<Mensagem, EstadoSocratico>) => void
  aoApagar: (id: string) => void
  aoNova: () => void
  aoFechar: () => void
}) {
  const grupos = new Map<GrupoDeData, ConversaSalva<Mensagem, EstadoSocratico>[]>()
  for (const c of conversas) {
    const g = grupoDaData(c.atualizadaEm)
    if (!grupos.has(g)) grupos.set(g, [])
    grupos.get(g)!.push(c)
  }
  return (
    <div className="dom-historico" role="dialog" aria-label="Conversas salvas">
      <div className="dom-historico__topo">
        <strong>Conversas</strong>
        <span className="dom-texto-3 text-[0.7rem]">{conversas.length} de 25 · as mais antigas saem sozinhas</span>
        <button type="button" className="dom-icone-botao ml-auto" onClick={aoFechar} aria-label="Fechar conversas">
          <X className="h-4 w-4" />
        </button>
      </div>
      <button type="button" className="dom-botao dom-botao--principal mx-3 mb-2 py-2 text-[0.82rem]" onClick={aoNova}>
        <MessageSquarePlus className="h-4 w-4" aria-hidden /> Nova conversa
      </button>
      <div className="dom-historico__lista">
        {!conversas.length && <p className="dom-texto-3 px-4 py-6 text-center text-[0.82rem]">Suas conversas com o Dom aparecem aqui.</p>}
        {[...grupos.entries()].map(([grupo, lista]) => (
          <div key={grupo}>
            <p className="dom-historico__grupo">{grupo}</p>
            {lista.map((c) => {
              const Icone = ICONE_DO_MODO[c.modo] || MessageCircle
              return (
                <div key={c.id} className="dom-historico__item" data-atual={c.id === atual || undefined}>
                  <button type="button" className="dom-historico__abrir" onClick={() => aoAbrir(c)}>
                    <Icone className="h-4 w-4 flex-none text-[var(--dom-laranja-forte)]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.84rem] font-semibold text-[var(--dom-texto)]">{c.titulo}</span>
                      <span className="block text-[0.68rem] text-[var(--dom-texto-3)]">
                        {new Date(c.atualizadaEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {c.mensagens.length} mensagens
                      </span>
                    </span>
                  </button>
                  <button type="button" className="dom-icone-botao" onClick={() => aoApagar(c.id)} aria-label={`Apagar a conversa ${c.titulo}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <p className="dom-historico__aviso">
        Apagar tira a conversa só deste aparelho. A DomineAqui guarda as suas 25 conversas mais recentes para segurança e qualidade do Dom.
      </p>
    </div>
  )
}

function BoasVindas({
  saudacao,
  nome,
  material,
  aoFrase,
  aoEnviar,
  aoSocratico,
}: {
  saudacao: string
  nome: string
  material?: ContextoDoMaterial | null
  aoFrase: (f: string) => void
  aoEnviar: (f: string) => void
  aoSocratico: () => void
}) {
  const itens = material
    ? [
        { icone: Layers, cor: 'laranja', titulo: 'Resumir esta parte', texto: 'O essencial da página em tópicos', acao: () => aoEnviar(`Resume o que provavelmente está na página ${material.pagina || 'atual'} deste material`) },
        { icone: Stethoscope, cor: 'verde', titulo: 'Explicar um conceito', texto: 'Cole um trecho e eu destrincho', acao: () => aoFrase('Me explica este trecho: ') },
        { icone: Target, cor: 'ouro', titulo: 'Me testar', texto: 'Uma pergunta para fixar', acao: () => aoEnviar('Me faz uma pergunta para testar se entendi este material') },
        { icone: Sparkles, cor: 'azul', titulo: 'Flashcards deste tema', texto: 'Revisão espaçada do que você leu', largo: true, acao: () => aoEnviar('Quero fazer flashcards deste material') },
      ]
    : [
        { icone: Stethoscope, cor: 'laranja', titulo: 'Tirar uma dúvida', texto: 'Mecanismo, porquê e fontes atuais', acao: () => aoFrase('Me explica ') },
        { icone: GraduationCap, cor: 'ouro', titulo: 'Método Socrático', texto: 'Aprender pensando, degrau a degrau', acao: aoSocratico },
        { icone: Compass, cor: 'verde', titulo: 'Me leve a…', texto: 'Simulados, APGs, cronogramas, loja', acao: () => aoFrase('Quero ir para ') },
        { icone: Target, cor: 'azul', titulo: 'Montar meu estudo de hoje', texto: 'Um plano rápido para o seu período', largo: true, acao: () => aoEnviar('Monta um plano de estudo para hoje, pensando no meu período') },
      ]
  return (
    <div className="dom-boas-vindas">
      <p className="dom-boas-vindas__ola">
        {saudacao}
        {nome ? (
          <>
            , <span>{nome}</span>.
          </>
        ) : (
          '.'
        )}
      </p>
      <p className="dom-boas-vindas__sub">
        {material ? 'Estou lendo com você. O que ficou nebuloso nesta parte?' : 'Sou o Dom, sua IA de estudos em saúde. Por onde a gente começa?'}
      </p>
      <div className="dom-bento">
        {itens.map(({ icone: Icone, cor, titulo, texto, acao, largo }) => (
          <button key={titulo} type="button" className={`dom-bento__item${largo ? ' dom-bento__item--largo' : ''}`} onClick={acao}>
            <span className={`dom-bento__icone dom-bento__icone--${cor}`}>
              <Icone className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span>
              <span className="dom-bento__titulo block">{titulo}</span>
              <span className="dom-bento__texto block">{texto}</span>
            </span>
            <ArrowUpRight className="dom-bento__seta h-4 w-4" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  )
}

function Raciocinio({ passos, atual }: { passos: string[]; atual: number }) {
  return (
    <div className="dom-raciocinio" role="status" aria-label="O Dom está pensando">
      <div className="dom-msg__autor">
        <span className="dom-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AVATAR} alt="" width={64} height={64} />
        </span>
        Dom <small>está pensando…</small>
      </div>
      {passos.map((p, i) => (
        <div key={p} className="dom-raciocinio__passo" data-estado={i < atual ? 'feito' : i === atual ? 'agora' : 'depois'}>
          <span className="dom-raciocinio__marca">{i < atual && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}</span>
          {p}
        </div>
      ))}
    </div>
  )
}

const SELO_DA_BASE: Record<string, string> = { pubmed: 'PM', scielo: 'SciE', diretriz: 'DIR', livro: 'LIV', web: 'WEB' }

function MensagemDoDom({
  m,
  nova,
  automatico,
  aoIr,
  aoCancelar,
}: {
  m: Mensagem
  nova: boolean
  automatico: boolean
  aoIr: (d: DestinoDoDom, id: string) => void
  aoCancelar: (id: string) => void
}) {
  const [copiado, setCopiado] = useState(false)
  if (m.papel === 'aluno') return <div className="dom-msg" data-papel="aluno">{m.texto}</div>
  return (
    <div className="dom-msg" data-papel="dom">
      <div className="dom-msg__autor">
        <span className="dom-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AVATAR} alt="" width={64} height={64} />
        </span>
        Dom {m.hora && <small>{m.hora}</small>}
      </div>
      <div className="dom-msg__bolha" data-tom={m.tom} data-nova={nova || undefined}>
        <TextoDoDom texto={m.texto} escalonar={nova} />
        {!!m.fontes?.length && (
          <div className="dom-fontes">
            <p className="dom-fontes__titulo">
              <Library className="h-3.5 w-3.5" aria-hidden />
              Fontes para conferir
            </p>
            <div className="dom-fontes__lista">
              {m.fontes.map((f, i) => (
                <a key={i} className="dom-fonte" href={f.url} target="_blank" rel="noopener noreferrer" style={{ animationDelay: `${300 + i * 80}ms` }}>
                  <span className="dom-fonte__selo" data-base={f.origem}>
                    {SELO_DA_BASE[f.origem] || 'REF'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block font-semibold">{f.titulo}</span>
                    {f.detalhe && <span className="dom-fonte__detalhe">{f.detalhe}</span>}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 flex-none opacity-50" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        )}
        {m.destino && <CartaoDeDestino destino={m.destino} automatico={automatico} aoIr={() => aoIr(m.destino!, m.id)} aoCancelar={() => aoCancelar(m.id)} />}
      </div>
      {!m.tom && (
        <div className="dom-msg__rodape">
          <button
            type="button"
            className="dom-msg__mini"
            onClick={() => {
              void navigator.clipboard?.writeText(m.texto).then(() => {
                setCopiado(true)
                setTimeout(() => setCopiado(false), 1500)
              })
            }}
          >
            {copiado ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Layers className="h-3.5 w-3.5" aria-hidden />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
    </div>
  )
}

/** "Vou te levar lá" com anel de contagem (2,6 s) — dá para ir já ou ficar. Área exclusiva não navega sozinha. */
function CartaoDeDestino({ destino, automatico, aoIr, aoCancelar }: { destino: DestinoDoDom; automatico: boolean; aoIr: () => void; aoCancelar: () => void }) {
  const auto = automatico && !destino.exclusivo
  useEffect(() => {
    if (!auto) return
    const t = setTimeout(aoIr, 2600)
    return () => clearTimeout(t)
  }, [auto, aoIr])
  return (
    <div className="dom-destino" data-exclusivo={destino.exclusivo || undefined}>
      <button type="button" className="dom-destino__icone" onClick={aoIr} aria-label={`Ir para ${destino.titulo}`}>
        {auto && (
          <svg className="dom-destino__anel" viewBox="0 0 56 56" aria-hidden>
            <circle cx="28" cy="28" r="26" />
          </svg>
        )}
        {destino.exclusivo ? <Sparkles className="h-5 w-5" aria-hidden /> : <ArrowRight className="h-5 w-5" aria-hidden />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[0.7rem] font-semibold text-[var(--dom-texto-3)]">{destino.exclusivo ? 'Exclusivo Plus+ e Quest+' : auto ? 'Vou te levar lá…' : 'Destino'}</p>
        <p className="truncate text-[0.9rem] font-bold text-[var(--dom-texto)]">{destino.titulo}</p>
      </div>
      {auto ? (
        <button type="button" className="dom-msg__mini" onClick={aoCancelar}>
          Ficar aqui
        </button>
      ) : (
        <button type="button" className="dom-botao dom-botao--principal px-3 py-2 text-[0.78rem]" onClick={aoIr}>
          {destino.exclusivo ? 'Ver como liberar' : 'Ir'}
        </button>
      )}
    </div>
  )
}

function CartaoDeStatus({ status }: { status: StatusDoDom }) {
  const xp = status.xp!
  return (
    <div className="dom-lateral-cartao">
      <h4>
        {status.primeiroNome ? `${status.primeiroNome} · ` : ''}
        {status.plano}
        {status.periodo ? ` · ${status.periodo}º período` : ''}
      </h4>
      <div className="dom-status">
        <div className="dom-status__item">
          <span className="dom-status__valor">{xp.nivel}</span>
          <span className="dom-status__rotulo">Nível · {xp.liga}</span>
        </div>
        <div className="dom-status__item">
          <span className="dom-status__valor">
            <Flame className="h-4 w-4 text-[var(--dom-laranja)]" aria-hidden />
            {xp.sequencia}
          </span>
          <span className="dom-status__rotulo">dias seguidos</span>
        </div>
        <div className="dom-status__item">
          <span className="dom-status__valor">
            <Trophy className="h-4 w-4 text-[var(--dom-ouro)]" aria-hidden />
            {xp.posicaoSemana ? `${xp.posicaoSemana}º` : '—'}
          </span>
          <span className="dom-status__rotulo">na semana</span>
        </div>
      </div>
    </div>
  )
}

function EscadaVertical({ etapa }: { etapa: EtapaSocratica | null }) {
  const atual = etapa ? ETAPAS_SOCRATICAS.indexOf(etapa) : 0
  return (
    <div className="dom-lateral-cartao">
      <h4>A escada de hoje</h4>
      <div className="dom-degraus">
        {ETAPAS_SOCRATICAS.map((e, i) => (
          <div key={e} className="dom-degrau" data-atual={i === atual ? '1' : '0'} data-feito={i < atual ? '1' : '0'}>
            <span className="dom-degrau__ponto">{i < atual ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : i + 1}</span>
            {ROTULO_DA_ETAPA[e]}
          </div>
        ))}
      </div>
    </div>
  )
}

function Cota({ restantes, limite, grande = false }: { restantes: number; limite: number; grande?: boolean }) {
  const fracao = Math.max(0, Math.min(1, restantes / limite))
  const r = grande ? 22 : 7
  const c = 2 * Math.PI * r
  const tamanho = (r + 3) * 2
  const cor = fracao <= 0.15 ? 'var(--dom-vermelho)' : fracao <= 0.4 ? 'var(--dom-ouro)' : 'var(--dom-verde)'
  return (
    <span className="dom-cota">
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--dom-trilho)" strokeWidth={grande ? 5 : 3} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth={grande ? 5 : 3}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fracao)}
        />
      </svg>
      <span>
        {grande ? (
          <>
            <strong className="block text-[1.1rem] text-[var(--dom-texto)]">
              {restantes} de {limite}
            </strong>
            <span>mensagens até a meia-noite</span>
          </>
        ) : (
          `${restantes}/${limite} hoje`
        )}
      </span>
    </span>
  )
}

/**
 * Para quem ainda não tem o Dom. Persuasão ética: valor concreto primeiro
 * (reciprocidade), três caminhos claros (sem paradoxo da escolha), nada de
 * escassez inventada nem culpa.
 */
function Vitrine({ status }: { status: StatusDoDom }) {
  if (status.motivo === 'suspenso') {
    return (
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="dom-cartao">
          <h3 className="dom-titulo">Vamos dar uma pausa</h3>
          <p className="dom-texto-2 mt-1 text-[0.85rem] leading-relaxed">
            Percebi pedidos fora do que eu posso fazer e pausei nossas conversas
            {status.suspensoAte ? ` até ${new Date(status.suspensoAte).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}.
            Se acha que foi engano, fale com o suporte.
          </p>
        </div>
        <Link className="dom-botao dom-botao--suave w-full" href="/suporte">
          Falar com o suporte
        </Link>
      </div>
    )
  }
  const beneficios = [
    { icone: Stethoscope, cor: 'laranja', titulo: 'Dúvidas explicadas a fundo', texto: 'O mecanismo e o porquê, com fontes atualizadas em botões.' },
    { icone: GraduationCap, cor: 'ouro', titulo: 'Método Socrático', texto: 'Perguntas em degraus nos temas do seu cronograma.' },
    { icone: Compass, cor: 'verde', titulo: 'Seu guia na plataforma', texto: '"Quero um simulado" — e eu te levo lá.' },
  ]
  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-1">
      <div className="dom-placa">
        <DomLogo />
      </div>
      <div className="dom-boas-vindas">
        <p className="dom-boas-vindas__ola">
          Estude com <span>o Dom</span>.
        </p>
        <p className="dom-boas-vindas__sub">Sua IA de estudos em saúde, que conhece a DomineAqui por dentro.</p>
      </div>
      <div className="grid gap-2">
        {beneficios.map(({ icone: Icone, cor, titulo, texto }, i) => (
          <div key={titulo} className="dom-bento__item dom-bento__item--largo" style={{ animationDelay: `${i * 70}ms` }}>
            <span className={`dom-bento__icone dom-bento__icone--${cor}`}>
              <Icone className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span>
              <span className="dom-bento__titulo block">{titulo}</span>
              <span className="dom-bento__texto block">{texto}</span>
            </span>
          </div>
        ))}
      </div>
      <Link className="dom-botao dom-botao--principal w-full" href="/buy">
        <Sparkles className="h-4 w-4" aria-hidden />
        Liberar o Dom com o Plus+
      </Link>
      <p className="dom-texto-3 text-center text-[0.76rem] leading-relaxed">
        O <strong>Quest+</strong> também libera o Dom, junto com o Banco de Questões completo.
      </p>
      <Link className="dom-botao dom-botao--suave w-full text-[0.8rem]" href="/materiais">
        <ShoppingBag className="h-4 w-4" aria-hidden />
        Comprou um material? O Dom fica liberado por 3 dias
      </Link>
    </div>
  )
}

function Confete() {
  const cores = ['#ef8a3c', '#e8b44a', '#2f7a5b', '#9fd8bf', '#e5484d']
  return (
    <div className="dom-confete" aria-hidden>
      {Array.from({ length: 30 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: cores[i % cores.length],
            animationDelay: `${(i % 7) * 60}ms`,
            ['--dx' as string]: `${((i * 53) % 120) - 60}px`,
            ['--rot' as string]: `${(i * 97) % 720}deg`,
          }}
        />
      ))}
    </div>
  )
}
