'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { ReviewTargetType } from './reviews-shared'

/**
 * Convite de avaliação no fim do estudo.
 *
 * ## O problema
 *
 * A seção de avaliações mora no rodapé da página do material. Quem abriu o PDF,
 * leu e fechou nunca chega lá — teria que voltar à página e rolar até o fim
 * justamente quando já terminou o que veio fazer. O resultado é uma vitrine de
 * materiais sem nota nenhuma.
 *
 * ## A ideia
 *
 * Pedir a nota no único instante em que a opinião existe e custa pouco: quando
 * a pessoa acaba de fechar o conteúdo. O leitor de PDF, o deck de flashcards, o
 * leitor de HTML e os itens complementares registram uma "sessão de estudo"
 * enquanto estão abertos; ao fechar, se houve estudo de verdade, o convite é
 * enfileirado e o `ReviewPromptHost` (montado no chrome do app, ver
 * `components/app-chrome.tsx`) mostra a folha/diálogo já na tela seguinte.
 *
 * ## Por que a fila passa pelo sessionStorage
 *
 * Fechar o material é navegar: o componente que sabia do estudo é desmontado no
 * mesmo quadro em que o pedido nasce. Guardar o pedido em memória o perderia.
 * O `sessionStorage` sobrevive à navegação (e a um recarregamento na mesma
 * aba), e o evento no `window` avisa o host que já está montado — quem chegar
 * depois lê a chave.
 *
 * ## Contrato com quem é convidado
 *
 * Insistência é o que mata a adesão. As regras abaixo são deliberadamente
 * conservadoras: no máximo um convite por dia, no máximo dois por material em
 * toda a vida da conta, silêncio crescente a cada recusa e um "não quero
 * avaliar" que vale por anos. Quem já avaliou nunca mais é convidado — o
 * servidor confirma isso antes de a folha aparecer (`/api/reviews/elegibilidade`).
 */

export type OrigemDoConvite = 'pdf' | 'flashcards' | 'html' | 'complementar' | 'material'

export interface ConviteDeAvaliacao {
  targetType: ReviewTargetType
  targetId: string
  titulo: string
  capa: string | null
  origem: OrigemDoConvite
  /** Rota do conteúdo — o convite oferece "voltar ao material" depois do envio. */
  href: string | null
  /** Segundos de estudo ativo que geraram o convite (só para ordenar/depurar). */
  segundos: number
  criadoEm: number
}

const CHAVE_ESTADO = 'domineaqui:avaliacao-convite:v1'
const CHAVE_PENDENTE = 'domineaqui:avaliacao-convite-pendente'
export const EVENTO_CONVITE = 'domineaqui:convite-de-avaliacao'

const MINUTO = 60_000
const HORA = 60 * MINUTO
const DIA = 24 * HORA

/** Um convite por dia, no máximo — mesmo quem estuda cinco materiais seguidos. */
const INTERVALO_ENTRE_CONVITES = 20 * HORA
/** Depois de "agora não": silêncio curto. */
const SILENCIO_APOS_RECUSA = 3 * DIA
/** Três recusas seguidas = a pessoa não quer avaliar. Some por dois meses. */
const SILENCIO_APOS_TRES_RECUSAS = 60 * DIA
/** "Não quero avaliar" — na prática, para sempre. */
const SILENCIO_DEFINITIVO = 5 * 365 * DIA
/** Acabou de avaliar: dá um respiro antes de convidar por outro material. */
const SILENCIO_APOS_ENVIO = 2 * DIA
/** O mesmo material só volta a ser oferecido depois de duas semanas. */
const ADIAMENTO_DO_ALVO = 14 * DIA
/** E, ainda assim, nunca mais de duas vezes no total. */
const MAX_CONVITES_POR_ALVO = 2

/** Estudo mínimo para o convite fazer sentido (segundos com a aba à vista). */
export const SEGUNDOS_MINIMOS_PADRAO = 45
/** Piso de tempo quando o conteúdo sinaliza progresso (páginas, cards…). */
const SEGUNDOS_MINIMOS_COM_SINAL = 15
const SINAIS_MINIMOS_PADRAO = 5

interface EstadoDoAlvo {
  /** Quantas vezes já convidamos por este material. */
  vezes: number
  /** Timestamp até quando este material fica fora da fila. */
  adiadoAte?: number
  /** Timestamp do envio — o alvo sai da fila para sempre. */
  avaliadoEm?: number
}

interface EstadoLocal {
  /** Silêncio global: nenhum convite até esta data. */
  silenciadoAte: number
  /** Último convite exibido. */
  ultimoConviteEm: number
  /** Recusas seguidas ("agora não"). Zera a cada envio. */
  recusas: number
  porAlvo: Record<string, EstadoDoAlvo>
}

const ESTADO_VAZIO: EstadoLocal = { silenciadoAte: 0, ultimoConviteEm: 0, recusas: 0, porAlvo: {} }

function numero(valor: unknown): number {
  const n = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(n) && n > 0 ? n : 0
}

// Navegação anônima, armazenamento bloqueado por política do navegador ou cota
// estourada fazem `localStorage` lançar no ACESSO, não só na escrita. Sem o
// try/catch, o convite derrubaria a árvore inteira de quem o chamou.
function lerEstado(): EstadoLocal {
  if (typeof window === 'undefined') return { ...ESTADO_VAZIO }
  try {
    const cru = window.localStorage.getItem(CHAVE_ESTADO)
    if (!cru) return { ...ESTADO_VAZIO }
    const bruto = JSON.parse(cru) as Partial<EstadoLocal>
    return {
      silenciadoAte: numero(bruto?.silenciadoAte),
      ultimoConviteEm: numero(bruto?.ultimoConviteEm),
      recusas: numero(bruto?.recusas),
      porAlvo: bruto?.porAlvo && typeof bruto.porAlvo === 'object' ? bruto.porAlvo : {},
    }
  } catch {
    return { ...ESTADO_VAZIO }
  }
}

function gravarEstado(estado: EstadoLocal) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado))
  } catch {
    /* sem armazenamento: o convite continua funcionando, só não lembra nada */
  }
}

function alterarEstado(mudanca: (estado: EstadoLocal) => EstadoLocal) {
  gravarEstado(mudanca(lerEstado()))
}

export function chaveDoAlvo(targetType: ReviewTargetType, targetId: string): string {
  return `${targetType}:${targetId}`
}

/**
 * O material pode ser oferecido agora? Roda antes de qualquer chamada de rede —
 * a maior parte dos convites morre aqui, de graça.
 */
export function podeConvidar(targetType: ReviewTargetType, targetId: string): boolean {
  if (typeof window === 'undefined') return false

  const agora = Date.now()
  const estado = lerEstado()

  if (estado.silenciadoAte > agora) return false
  if (agora - estado.ultimoConviteEm < INTERVALO_ENTRE_CONVITES) return false

  const alvo = estado.porAlvo[chaveDoAlvo(targetType, targetId)]
  if (!alvo) return true
  if (alvo.avaliadoEm) return false
  if (numero(alvo.adiadoAte) > agora) return false
  if (numero(alvo.vezes) >= MAX_CONVITES_POR_ALVO) return false

  return true
}

/** Convite exibido: conta a aparição e trava a cota diária. */
export function registrarExibicao(targetType: ReviewTargetType, targetId: string) {
  const chave = chaveDoAlvo(targetType, targetId)
  alterarEstado(estado => {
    const alvo = estado.porAlvo[chave] || { vezes: 0 }
    return {
      ...estado,
      ultimoConviteEm: Date.now(),
      porAlvo: { ...estado.porAlvo, [chave]: { ...alvo, vezes: numero(alvo.vezes) + 1 } },
    }
  })
}

/** "Agora não" (ou Esc, ou toque fora): adia o material e silencia um pouco. */
export function registrarRecusa(targetType: ReviewTargetType, targetId: string) {
  const chave = chaveDoAlvo(targetType, targetId)
  alterarEstado(estado => {
    const recusas = numero(estado.recusas) + 1
    const alvo = estado.porAlvo[chave] || { vezes: 0 }
    return {
      ...estado,
      recusas,
      silenciadoAte: Date.now() + (recusas >= 3 ? SILENCIO_APOS_TRES_RECUSAS : SILENCIO_APOS_RECUSA),
      porAlvo: {
        ...estado.porAlvo,
        [chave]: { ...alvo, adiadoAte: Date.now() + ADIAMENTO_DO_ALVO },
      },
    }
  })
}

/** "Não quero avaliar materiais": o convite some da vida da pessoa. */
export function registrarSilencioDefinitivo() {
  alterarEstado(estado => ({ ...estado, silenciadoAte: Date.now() + SILENCIO_DEFINITIVO }))
}

/** Avaliação enviada: o alvo sai da fila e as recusas zeram. */
export function registrarEnvio(targetType: ReviewTargetType, targetId: string) {
  const chave = chaveDoAlvo(targetType, targetId)
  alterarEstado(estado => {
    const alvo = estado.porAlvo[chave] || { vezes: 0 }
    return {
      ...estado,
      recusas: 0,
      silenciadoAte: Date.now() + SILENCIO_APOS_ENVIO,
      porAlvo: { ...estado.porAlvo, [chave]: { ...alvo, avaliadoEm: Date.now() } },
    }
  })
}

/**
 * O servidor respondeu que este alvo não pode ser avaliado (sem acesso,
 * avaliações travadas, já avaliado). Marca como resolvido para não gastar outra
 * chamada de rede na próxima vez.
 */
export function registrarInelegivel(targetType: ReviewTargetType, targetId: string) {
  const chave = chaveDoAlvo(targetType, targetId)
  alterarEstado(estado => {
    const alvo = estado.porAlvo[chave] || { vezes: 0 }
    return { ...estado, porAlvo: { ...estado.porAlvo, [chave]: { ...alvo, avaliadoEm: Date.now() } } }
  })
}

// ─── Fila (sessionStorage + evento) ─────────────────────────────────────────

export function enfileirarConvite(convite: ConviteDeAvaliacao) {
  if (typeof window === 'undefined') return
  if (!podeConvidar(convite.targetType, convite.targetId)) return
  try {
    window.sessionStorage.setItem(CHAVE_PENDENTE, JSON.stringify(convite))
  } catch {
    /* sem sessionStorage o evento abaixo ainda entrega ao host já montado */
  }
  window.dispatchEvent(new CustomEvent<ConviteDeAvaliacao>(EVENTO_CONVITE, { detail: convite }))
}

export function lerConvitePendente(): ConviteDeAvaliacao | null {
  if (typeof window === 'undefined') return null
  try {
    const cru = window.sessionStorage.getItem(CHAVE_PENDENTE)
    if (!cru) return null
    const convite = JSON.parse(cru) as ConviteDeAvaliacao
    if (!convite?.targetId || !convite?.targetType) return null
    // Convite velho é convite sem contexto: quem fechou o material há uma hora
    // não lembra mais dele. Vale por 30 minutos.
    if (Date.now() - numero(convite.criadoEm) > 30 * MINUTO) {
      limparConvitePendente()
      return null
    }
    return convite
  } catch {
    return null
  }
}

export function limparConvitePendente() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(CHAVE_PENDENTE)
  } catch {
    /* nada a limpar */
  }
}

// ─── Hook usado pelos leitores ──────────────────────────────────────────────

interface ConfigDoConvite {
  targetType: ReviewTargetType
  targetId: string | null | undefined
  titulo: string
  capa?: string | null
  origem: OrigemDoConvite
  href?: string | null
  /**
   * Liga o rastreio. Enquanto `false` (carregando, sem acesso, prévia) nada é
   * contado nem enfileirado.
   */
  habilitado?: boolean
  segundosMinimos?: number
  sinaisMinimos?: number
}

/**
 * Conta o estudo enquanto o leitor está aberto e convida ao fechar.
 *
 * O tempo só corre com a aba à vista: material aberto numa aba esquecida em
 * segundo plano não é estudo, e convidar por ele seria pedir nota de algo que a
 * pessoa não leu.
 *
 * Devolve `registrarSinal` (páginas viradas, cards respondidos — progresso real
 * que vale mais que o relógio), `convidar` (para o botão de fechar chamar na
 * hora certa) e `cancelar` (some com o convite desta sessão).
 */
export function useConviteDeAvaliacao(config: ConfigDoConvite) {
  const configRef = useRef(config)
  configRef.current = config

  const acumuladoRef = useRef(0)
  const desdeRef = useRef<number | null>(null)
  const sinaisRef = useRef(0)
  const convidadoRef = useRef(false)
  const canceladoRef = useRef(false)

  const habilitado = config.habilitado !== false && !!config.targetId

  // Relógio de estudo. Pausa quando a aba sai de vista e retoma quando volta.
  useEffect(() => {
    if (!habilitado || typeof document === 'undefined') return

    const visivel = () => document.visibilityState === 'visible'

    const retomar = () => {
      if (desdeRef.current === null) desdeRef.current = Date.now()
    }
    const pausar = () => {
      if (desdeRef.current !== null) {
        acumuladoRef.current += Date.now() - desdeRef.current
        desdeRef.current = null
      }
    }
    const aoMudarVisibilidade = () => (visivel() ? retomar() : pausar())

    if (visivel()) retomar()
    document.addEventListener('visibilitychange', aoMudarVisibilidade)

    return () => {
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
      pausar()
    }
  }, [habilitado])

  const segundosDeEstudo = useCallback(() => {
    const emAberto = desdeRef.current === null ? 0 : Date.now() - desdeRef.current
    return Math.round((acumuladoRef.current + emAberto) / 1000)
  }, [])

  const registrarSinal = useCallback((quantidade = 1) => {
    sinaisRef.current += quantidade
  }, [])

  const cancelar = useCallback(() => {
    canceladoRef.current = true
  }, [])

  const convidar = useCallback(() => {
    if (canceladoRef.current || convidadoRef.current) return
    const atual = configRef.current
    if (atual.habilitado === false || !atual.targetId) return

    const segundos = segundosDeEstudo()
    const sinais = sinaisRef.current
    const minimo = atual.segundosMinimos ?? SEGUNDOS_MINIMOS_PADRAO
    const minimoDeSinais = atual.sinaisMinimos ?? SINAIS_MINIMOS_PADRAO

    // Duas portas para o mesmo lugar: tempo de leitura OU progresso concreto.
    // Quem virou quinze páginas em quarenta segundos estudou; quem deixou a
    // tela aberta por um minuto sem tocar em nada, também vale — mas nenhum
    // dos dois passa com um toque acidental que abriu e fechou.
    const estudou = segundos >= minimo || (sinais >= minimoDeSinais && segundos >= SEGUNDOS_MINIMOS_COM_SINAL)
    if (!estudou) return

    convidadoRef.current = true
    enfileirarConvite({
      targetType: atual.targetType,
      targetId: atual.targetId,
      titulo: atual.titulo,
      capa: atual.capa ?? null,
      origem: atual.origem,
      href: atual.href ?? null,
      segundos,
      criadoEm: Date.now(),
    })
  }, [segundosDeEstudo])

  // Fechar o leitor quase sempre é navegar, e navegar desmonta este componente.
  // O desmonte é, portanto, o gatilho universal: cobre o botão "voltar", o
  // gesto do sistema, o link para outra página e o botão do navegador — sem
  // precisar instrumentar cada saída uma a uma.
  useEffect(() => {
    if (!habilitado) return
    return () => {
      convidar()
    }
  }, [habilitado, convidar])

  return { registrarSinal, convidar, cancelar, segundosDeEstudo }
}
