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

// Não há cota por tempo entre convites: cada DESFECHO já traz o seu silêncio
// (enviar cala por dois dias, recusar por três), e é o desfecho que diz se a
// pessoa quer ser convidada — não o relógio. Uma cota fixa por cima disso só
// engolia o convite de quem estuda vários materiais numa tarde e teria
// respondido a todos.
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

/**
 * Estudo mínimo para o convite fazer sentido (segundos com a aba à vista).
 *
 * Começou em 45s e era alto demais: um PDF leva alguns segundos só para abrir,
 * e uma consulta rápida — que é leitura de verdade — terminava antes da conta
 * fechar. O convite simplesmente não existia para quem usa o material como
 * referência, que é boa parte das pessoas.
 */
export const SEGUNDOS_MINIMOS_PADRAO = 25
/** Piso de tempo quando o conteúdo sinaliza progresso (páginas, cards…). */
const SEGUNDOS_MINIMOS_COM_SINAL = 8
const SINAIS_MINIMOS_PADRAO = 3

// ─── Diagnóstico: "por que o convite não apareceu?" ─────────────────────────
//
// Tudo o que decide o convite é local e invisível: o relógio de estudo, a cota
// do dia, o adiamento por material. Quando ele não aparece não há o que olhar —
// nem log de servidor, nem tela de admin. Então cada porta fechada tem um nome,
// e `?avaliacao=debug` na URL faz o caminho inteiro sair no console.
//
// `?avaliacao=forcar` vai além e ignora relógio e histórico local, para conferir
// a folha na hora. O veredito do SERVIDOR continua valendo — forçar uma folha
// que o servidor recusaria só produziria um erro no envio.

const CHAVE_DIAGNOSTICO = 'domineaqui:avaliacao-diagnostico'
const PREFIXO = '[avaliação]'

/**
 * Lê o modo do diagnóstico. A URL manda, e o que vier por ela GRUDA no
 * armazenamento: o convite aparece depois de navegar, e a query string se perde
 * no caminho — sem grudar, ligar o diagnóstico o desligaria junto.
 */
function modoDoDiagnostico(): 'off' | 'debug' | 'forcar' {
  if (typeof window === 'undefined') return 'off'
  try {
    const daUrl = new URLSearchParams(window.location.search).get('avaliacao')
    if (daUrl === 'debug' || daUrl === 'forcar') {
      window.localStorage.setItem(CHAVE_DIAGNOSTICO, daUrl)
      return daUrl
    }
    if (daUrl === 'off') {
      window.localStorage.removeItem(CHAVE_DIAGNOSTICO)
      return 'off'
    }
    const guardado = window.localStorage.getItem(CHAVE_DIAGNOSTICO)
    return guardado === 'debug' || guardado === 'forcar' ? guardado : 'off'
  } catch {
    return 'off'
  }
}

/** `true` quando o caminho do convite deve narrar cada passo no console. */
export function diagnosticoLigado(): boolean {
  return modoDoDiagnostico() !== 'off'
}

/** `true` quando relógio de estudo e histórico local devem ser ignorados. */
export function modoForcado(): boolean {
  return modoDoDiagnostico() === 'forcar'
}

/** Uma linha do diagnóstico. Silenciosa quando ele está desligado. */
export function relatar(etapa: string, dados?: Record<string, unknown>) {
  if (!diagnosticoLigado()) return
  if (dados) console.info(`${PREFIXO} ${etapa}`, dados)
  else console.info(`${PREFIXO} ${etapa}`)
}

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
  /** Recusas seguidas ("agora não"). Zera a cada envio. */
  recusas: number
  porAlvo: Record<string, EstadoDoAlvo>
}

const ESTADO_VAZIO: EstadoLocal = { silenciadoAte: 0, recusas: 0, porAlvo: {} }

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

/** Por que o convite não pode aparecer agora. Cada porta tem um nome. */
export type MotivoLocal =
  | 'ok'
  | 'sem_navegador'
  | 'silenciado'
  | 'ja_avaliado'
  | 'alvo_adiado'
  | 'teto_do_alvo'

export interface VeredictoLocal {
  permitido: boolean
  motivo: MotivoLocal
  /** Frase pronta para o diagnóstico — sem ela o motivo é um código solto. */
  explicacao: string
  /** Quando a porta volta a abrir, se for o caso. */
  liberaEm?: string
}

function emTexto(quando: number): string {
  try {
    return new Date(quando).toLocaleString('pt-BR')
  } catch {
    return String(quando)
  }
}

/**
 * O material pode ser oferecido agora? Roda antes de qualquer chamada de rede —
 * a maior parte dos convites morre aqui, de graça.
 *
 * Devolve o MOTIVO, não só um `false`: era exatamente essa informação que
 * faltava quando "fechei o material e não apareceu nada".
 */
export function examinarRegrasLocais(
  targetType: ReviewTargetType,
  targetId: string,
): VeredictoLocal {
  if (typeof window === 'undefined') {
    return { permitido: false, motivo: 'sem_navegador', explicacao: 'Sem navegador (renderização no servidor).' }
  }

  // Em modo forçado o histórico local inteiro é ignorado — é o que permite
  // conferir a folha duas vezes seguidas no mesmo material.
  if (modoForcado()) {
    return { permitido: true, motivo: 'ok', explicacao: 'Regras locais ignoradas (?avaliacao=forcar).' }
  }

  const agora = Date.now()
  const estado = lerEstado()

  if (estado.silenciadoAte > agora) {
    return {
      permitido: false,
      motivo: 'silenciado',
      explicacao: 'Convites silenciados — houve uma recusa recente ou um "não quero avaliar".',
      liberaEm: emTexto(estado.silenciadoAte),
    }
  }

  const alvo = estado.porAlvo[chaveDoAlvo(targetType, targetId)]
  if (!alvo) return { permitido: true, motivo: 'ok', explicacao: 'Liberado.' }

  if (alvo.avaliadoEm) {
    return {
      permitido: false,
      motivo: 'ja_avaliado',
      explicacao: 'Este item já foi avaliado (ou o servidor já disse que não cabe convite por ele).',
    }
  }
  if (numero(alvo.adiadoAte) > agora) {
    return {
      permitido: false,
      motivo: 'alvo_adiado',
      explicacao: 'Este item foi adiado por um "agora não".',
      liberaEm: emTexto(numero(alvo.adiadoAte)),
    }
  }
  if (numero(alvo.vezes) >= MAX_CONVITES_POR_ALVO) {
    return {
      permitido: false,
      motivo: 'teto_do_alvo',
      explicacao: `Este item já foi oferecido ${MAX_CONVITES_POR_ALVO} vezes — o teto de uma vida.`,
    }
  }

  return { permitido: true, motivo: 'ok', explicacao: 'Liberado.' }
}

export function podeConvidar(targetType: ReviewTargetType, targetId: string): boolean {
  return examinarRegrasLocais(targetType, targetId).permitido
}

/** Houve estudo suficiente para o convite se justificar? */
export function examinarEstudo(leitura: {
  segundos: number
  sinais: number
  minimoDeSegundos: number
  minimoDeSinais: number
}): { suficiente: boolean; explicacao: string } {
  const { segundos, sinais, minimoDeSegundos, minimoDeSinais } = leitura

  // Duas portas para o mesmo lugar: tempo de leitura OU progresso concreto.
  // Quem virou dez páginas em quinze segundos estudou; quem deixou a tela
  // aberta meio minuto sem tocar em nada, também vale — mas nenhum dos dois
  // passa com um toque acidental que abriu e fechou.
  if (segundos >= minimoDeSegundos) {
    return { suficiente: true, explicacao: `${segundos}s de estudo (mínimo ${minimoDeSegundos}s).` }
  }
  if (sinais >= minimoDeSinais && segundos >= SEGUNDOS_MINIMOS_COM_SINAL) {
    return {
      suficiente: true,
      explicacao: `${sinais} sinais de progresso em ${segundos}s (mínimo ${minimoDeSinais} sinais + ${SEGUNDOS_MINIMOS_COM_SINAL}s).`,
    }
  }
  return {
    suficiente: false,
    explicacao:
      `Estudo curto demais: ${segundos}s e ${sinais} sinais. ` +
      `Precisa de ${minimoDeSegundos}s, ou ${minimoDeSinais} sinais com ao menos ${SEGUNDOS_MINIMOS_COM_SINAL}s.`,
  }
}

/**
 * Convite exibido: conta a aparição para o teto por material. O silêncio global
 * não nasce aqui — quem o define é o desfecho (`registrarEnvio`,
 * `registrarRecusa`), porque é ele que diz se a pessoa quer ser convidada.
 */
export function registrarExibicao(targetType: ReviewTargetType, targetId: string) {
  const chave = chaveDoAlvo(targetType, targetId)
  alterarEstado(estado => {
    const alvo = estado.porAlvo[chave] || { vezes: 0 }
    return {
      ...estado,
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

  const veredicto = examinarRegrasLocais(convite.targetType, convite.targetId)
  if (!veredicto.permitido) {
    relatar('convite descartado pelas regras locais', {
      item: convite.titulo,
      motivo: veredicto.motivo,
      porque: veredicto.explicacao,
      liberaEm: veredicto.liberaEm,
    })
    return
  }

  relatar('convite enfileirado', {
    item: convite.titulo,
    origem: convite.origem,
    segundosDeEstudo: convite.segundos,
  })

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
    const estudo = examinarEstudo({
      segundos,
      sinais,
      minimoDeSegundos: atual.segundosMinimos ?? SEGUNDOS_MINIMOS_PADRAO,
      minimoDeSinais: atual.sinaisMinimos ?? SINAIS_MINIMOS_PADRAO,
    })

    if (!estudo.suficiente && !modoForcado()) {
      relatar('convite não nasceu', { item: atual.titulo, porque: estudo.explicacao })
      return
    }

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
