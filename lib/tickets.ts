import type {
  Ticket,
  TicketCategory,
  TicketMessage,
  TicketPriority,
  TicketStatus,
} from '@/lib/types'

/**
 * Regras do sistema de suporte que valem para os dois lados do balcão.
 *
 * Antes cada rota montava sua própria mensagem, seu próprio id e sua própria
 * ideia do que é "não lida" — e as três divergiram. Isto aqui é a fonte única:
 * a API usa para gravar, o painel e o chat usam para exibir, e o e-mail usa
 * para descrever. Nada aqui toca o banco, então pode ser importado tanto do
 * servidor quanto do cliente.
 */

// ── Limites de entrada ────────────────────────────────────────────────────
export const TICKET_TITULO_MAX = 120
export const TICKET_MENSAGEM_MAX = 4000
export const TICKET_TITULO_MIN = 3

/** Quantos tickets sem resposta uma mesma pessoa pode manter em aberto. */
export const TICKET_ABERTOS_POR_USUARIO = 5

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'financeiro', label: 'Pagamento e assinatura' },
  { value: 'acesso', label: 'Acesso e conta' },
  { value: 'conteudo', label: 'Conteúdo e materiais' },
  { value: 'bug', label: 'Erro na plataforma' },
  { value: 'sugestao', label: 'Sugestão' },
  { value: 'outro', label: 'Outro assunto' },
]

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Aguardando atendimento',
  assigned: 'Em atendimento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

export function rotuloDaCategoria(categoria?: TicketCategory | null): string {
  return TICKET_CATEGORIES.find((c) => c.value === categoria)?.label || 'Outro assunto'
}

export function rotuloDaPrioridade(prioridade?: TicketPriority | null): string {
  return TICKET_PRIORITIES.find((p) => p.value === prioridade)?.label || 'Normal'
}

export function ehCategoriaValida(valor: unknown): valor is TicketCategory {
  return TICKET_CATEGORIES.some((c) => c.value === valor)
}

export function ehPrioridadeValida(valor: unknown): valor is TicketPriority {
  return TICKET_PRIORITIES.some((p) => p.value === valor)
}

/**
 * Protocolo curto e estável mostrado ao usuário (e no assunto do e-mail).
 * É o fim do ObjectId: identifica sem expor o documento inteiro e é curto o
 * bastante para alguém ditar por telefone.
 */
export function protocoloDoTicket(id: unknown): string {
  return String(id || '').slice(-8).toUpperCase()
}

/**
 * Normaliza texto vindo do formulário: tira espaço nas pontas, corta o excesso
 * e colapsa sequências absurdas de quebras de linha (o "enter infinito" que
 * esticava o balão da conversa até o rodapé sumir).
 */
export function normalizarTexto(valor: unknown, max: number): string {
  if (typeof valor !== 'string') return ''
  return valor
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
    .slice(0, max)
}

/** Erro de validação legível — a rota devolve a mensagem direto ao usuário. */
export function validarAberturaDeTicket(input: { title: unknown; message: unknown }):
  | { ok: true; title: string; message: string }
  | { ok: false; erro: string } {
  const title = normalizarTexto(input.title, TICKET_TITULO_MAX)
  const message = normalizarTexto(input.message, TICKET_MENSAGEM_MAX)

  if (title.length < TICKET_TITULO_MIN) {
    return { ok: false, erro: `O título precisa ter pelo menos ${TICKET_TITULO_MIN} caracteres.` }
  }
  if (!message) {
    return { ok: false, erro: 'Escreva a sua mensagem antes de enviar.' }
  }
  return { ok: true, title, message }
}

// ── Mensagens ─────────────────────────────────────────────────────────────

/**
 * Identificador de mensagem.
 *
 * `msg_${Date.now()}` colidia: a abertura de um ticket criava duas mensagens no
 * mesmo milissegundo, e como o "marcar como lida" casa por id, marcar uma
 * marcava a outra junto. UUID acaba com a classe inteira do problema.
 *
 * Vem do `crypto` global (existe no Node moderno e no navegador) em vez do
 * módulo `node:crypto`: este arquivo também é importado pelo chat, que roda no
 * cliente, e um import de módulo nativo quebraria o bundle.
 */
function novoId(): string {
  const webcrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (webcrypto?.randomUUID) return webcrypto.randomUUID()
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function novaMensagem(input: {
  senderId: string
  senderName: string
  senderRole: 'admin' | 'user' | 'system'
  text: string
  sentAt?: Date
}): TicketMessage {
  return {
    id: novoId(),
    senderId: input.senderId,
    senderName: input.senderName,
    senderRole: input.senderRole,
    text: input.text,
    sentAt: input.sentAt || new Date(),
  }
}

export function mensagemDoSistema(text: string): TicketMessage {
  return novaMensagem({
    senderId: 'system',
    senderName: 'Sistema',
    senderRole: 'system',
    text,
  })
}

/** Documentos antigos gravavam o aviso automático como senderRole 'user'. */
export function ehMensagemDoSistema(msg: Pick<TicketMessage, 'senderId' | 'senderRole'>): boolean {
  return msg.senderId === 'system' || msg.senderRole === 'system'
}

/** Prévia de uma linha para a lista de tickets. */
export function previaDaMensagem(texto: string | undefined, max = 90): string {
  const limpo = (texto || '').replace(/\s+/g, ' ').trim()
  if (limpo.length <= max) return limpo
  return `${limpo.slice(0, max - 1)}…`
}

// ── Não lidas ─────────────────────────────────────────────────────────────

/**
 * Quem "conta" como remetente do outro lado depende de quem está olhando: para
 * o usuário só a fala do admin é novidade; para o admin, só a do usuário. Aviso
 * do sistema nunca conta — ele foi disparado por uma ação que a pessoa já viu.
 */
export function contarNaoLidas(
  mensagens: Pick<TicketMessage, 'senderId' | 'senderRole' | 'readAt'>[],
  para: 'admin' | 'user',
): number {
  return mensagens.filter((msg) => {
    if (msg.readAt) return false
    if (ehMensagemDoSistema(msg)) return false
    return para === 'admin' ? msg.senderRole !== 'admin' : msg.senderRole === 'admin'
  }).length
}

// ── Política de e-mail ────────────────────────────────────────────────────

/**
 * Intervalo mínimo entre dois e-mails do mesmo ticket.
 *
 * Só existe para o caso do atendente que manda três mensagens seguidas
 * ("oi", "achei o problema", "resolvido"): vira um e-mail, não três.
 */
export const TICKET_INTERVALO_EMAIL_MS = 5 * 60 * 1000

/**
 * Resposta do admin avisa por e-mail. Ponto.
 *
 * A primeira versão disto era mais esperta e por isso não funcionava: ela
 * pulava o e-mail quando `userLastSeenAt` era recente, na ideia de não
 * incomodar quem já estava lendo a resposta no chat. Só que esse carimbo vem
 * do *polling* do painel de suporte, que bate na API a cada 12s enquanto a
 * janelinha estiver aberta — mesmo com a aba em segundo plano, mesmo com a
 * pessoa longe do computador. Ou seja: "chat aberto" nunca foi sinônimo de
 * "pessoa olhando", e o efeito prático foi o oposto do pedido — no fluxo mais
 * comum de todos (abrir o ticket e deixar a aba aberta) o aviso nunca saía, e
 * saía calado, sem nada no log dizendo por quê.
 *
 * Agora a única razão para segurar um e-mail é ter mandado outro há pouco.
 * Mudanças de situação (resolvido/reaberto/fechado) furam até esse intervalo:
 * são eventos únicos e é a mensagem que a pessoa guarda.
 */
export function devoAvisarPorEmail(
  ticket: Pick<Ticket, 'lastEmailAt'>,
  opcoes: { agora?: Date; ignorarIntervalo?: boolean } = {},
): boolean {
  if (opcoes.ignorarIntervalo) return true

  const agora = (opcoes.agora || new Date()).getTime()
  const ultimo = ticket.lastEmailAt ? new Date(ticket.lastEmailAt).getTime() : 0

  return !(ultimo && agora - ultimo < TICKET_INTERVALO_EMAIL_MS)
}

/**
 * Respostas do admin que ainda não saíram por e-mail.
 *
 * `lastEmailAt` é o corte: tudo que o atendente escreveu depois do último aviso
 * enviado entra no próximo. É isto que faz a trava de rajada AGRUPAR em vez de
 * DESCARTAR — a primeira versão simplesmente pulava o envio, e as mensagens
 * seguradas nunca chegavam à caixa de entrada de ninguém.
 */
export function respostasPendentes(
  mensagens: Pick<TicketMessage, 'senderId' | 'senderRole' | 'text' | 'sentAt'>[],
  desde?: Date | string | null,
): { texto: string; data: Date }[] {
  const corte = desde ? new Date(desde).getTime() : 0

  return mensagens
    .filter((msg) => {
      if (msg.senderRole !== 'admin' || ehMensagemDoSistema(msg)) return false
      return new Date(msg.sentAt).getTime() > corte
    })
    .map((msg) => ({ texto: msg.text, data: new Date(msg.sentAt) }))
}

/** Link que abre o chat de suporte já com o ticket selecionado. */
export function urlDoTicket(ticketId: unknown): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || ''
  return `${base}/?suporte=${String(ticketId || '')}`
}

/** "há 2 h", "há 3 dias" — usado nas duas telas para mostrar espera/atividade. */
export function tempoRelativo(data: Date | string | undefined | null): string {
  if (!data) return ''
  const ms = Date.now() - new Date(data).getTime()
  if (Number.isNaN(ms)) return ''
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 30) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  const meses = Math.floor(dias / 30)
  return `há ${meses} ${meses === 1 ? 'mês' : 'meses'}`
}
