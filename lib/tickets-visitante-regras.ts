import type { TicketCategory } from '@/lib/types'
import {
  TICKET_TITULO_MAX,
  TICKET_TITULO_MIN,
  ehCategoriaValida,
  normalizarTexto,
} from '@/lib/tickets'

/**
 * Regras do chamado aberto por quem NÃO tem sessão — a parte pura, sem banco
 * nem segredo, que roda igual no servidor e no formulário (e nos testes).
 *
 * O chamado de visitante é a superfície mais exposta do suporte: qualquer um,
 * de qualquer lugar, sem conta. As camadas de defesa ficam em
 * `lib/tickets-visitante.ts` e na rota; aqui mora o que decide se o CONTEÚDO
 * é aceitável — e tudo aqui é barato, para recusar lixo antes de gastar banco.
 */

// ── Limites ───────────────────────────────────────────────────────────────
/** Menor que o do ticket de conta: ninguém precisa de um livro para pedir ajuda. */
export const VISITANTE_MENSAGEM_MAX = 2000
export const VISITANTE_MENSAGEM_MIN = 10
export const VISITANTE_NOME_MAX = 80
export const VISITANTE_EMAIL_MAX = 254
export const VISITANTE_CONTEXTO_MAX = 160
/** Links demais numa mensagem de suporte é assinatura de spam, não de dúvida. */
export const VISITANTE_LINKS_MAX = 3
/** Corpo da requisição de abertura: o formulário inteiro cabe com folga em 16 KB. */
export const VISITANTE_CORPO_MAX_BYTES = 16 * 1024
/** Quantas falas do visitante uma conversa aceita antes de pedir outro chamado. */
export const VISITANTE_MENSAGENS_POR_TICKET = 40

/** Prefixo do `userId` dos chamados sem conta — nunca colide com um ObjectId. */
export const PREFIXO_VISITANTE = 'visitante:'

export function ehTicketDeVisitante(ticket: { userId?: string | null; origem?: string | null }): boolean {
  return ticket.origem === 'visitante' || String(ticket.userId || '').startsWith(PREFIXO_VISITANTE)
}

// ── Texto ─────────────────────────────────────────────────────────────────

/**
 * Tira caracteres de controle e invisíveis (exceto quebra de linha e tab).
 * Zero-width, bidi override e afins servem para esconder texto do atendente
 * ou bagunçar o layout do painel — não há uso legítimo num pedido de ajuda.
 */
export function limparInvisiveis(texto: string): string {
  return texto.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g, '')
}

/** Quantos links (http, www ou domínio.tld/caminho) o texto carrega. */
export function contarLinks(texto: string): number {
  const achados = texto.match(/\bhttps?:\/\/\S+|\bwww\.\S+/gi)
  return achados ? achados.length : 0
}

/** Um mesmo caractere repetido 25+ vezes ("aaaaaaa…", "!!!!!!…") é ruído. */
export function temRepeticaoAbsurda(texto: string): boolean {
  return /(.)\1{24,}/su.test(texto)
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/

export function normalizarEmail(valor: unknown): string {
  if (typeof valor !== 'string') return ''
  return valor.trim().toLowerCase().slice(0, VISITANTE_EMAIL_MAX)
}

export function ehEmailValido(email: string): boolean {
  if (!email || email.length > VISITANTE_EMAIL_MAX) return false
  if (!EMAIL_RE.test(email)) return false
  const tld = email.split('.').pop() || ''
  return tld.length >= 2 && /^[a-z]+$/i.test(tld)
}

/**
 * De onde o chamado veio (`/comprar?productType=material`): ajuda o atendente
 * a entender o caso sem perguntar. Só aceita caminho interno, sem esquema,
 * sem `//` (que viraria URL de outro site), sem controle, e curto.
 */
export function normalizarContexto(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined
  const limpo = limparInvisiveis(valor).replace(/\s+/g, '').slice(0, VISITANTE_CONTEXTO_MAX)
  if (!limpo.startsWith('/') || limpo.startsWith('//')) return undefined
  if (!/^\/[A-Za-z0-9\-._~/?&=%+:,]*$/.test(limpo)) return undefined
  return limpo
}

// ── Validação do formulário ───────────────────────────────────────────────

export interface ChamadoDeVisitante {
  nome: string
  email: string
  titulo: string
  mensagem: string
  categoria: TicketCategory
  contexto?: string
}

export type ResultadoDaValidacao =
  | { ok: true; chamado: ChamadoDeVisitante }
  | { ok: false; erro: string; campo?: keyof ChamadoDeVisitante }

/**
 * Valida e normaliza o que o visitante mandou. As mensagens de erro são
 * escritas para a pessoa (vão direto para a tela), e dizem qual campo corrigir.
 */
export function validarChamadoDeVisitante(corpo: Record<string, unknown>): ResultadoDaValidacao {
  const nome = limparInvisiveis(normalizarTexto(corpo.nome, VISITANTE_NOME_MAX)).replace(/\s+/g, ' ')
  const email = normalizarEmail(corpo.email)
  const titulo = limparInvisiveis(normalizarTexto(corpo.titulo, TICKET_TITULO_MAX)).replace(/\s+/g, ' ')
  const mensagem = limparInvisiveis(normalizarTexto(corpo.mensagem, VISITANTE_MENSAGEM_MAX))
  const categoria = ehCategoriaValida(corpo.categoria) ? corpo.categoria : 'outro'
  const contexto = normalizarContexto(corpo.contexto)

  if (nome.length < 2) return { ok: false, erro: 'Diga como podemos te chamar.', campo: 'nome' }
  if (/[<>]|https?:|www\./i.test(nome)) return { ok: false, erro: 'Use só o seu nome neste campo.', campo: 'nome' }
  if (!ehEmailValido(email)) return { ok: false, erro: 'Confira o seu e-mail — é por ele que a resposta chega.', campo: 'email' }
  if (titulo.length < TICKET_TITULO_MIN) {
    return { ok: false, erro: `Resuma o assunto em pelo menos ${TICKET_TITULO_MIN} letras.`, campo: 'titulo' }
  }
  if (mensagem.length < VISITANTE_MENSAGEM_MIN) {
    return { ok: false, erro: 'Conte um pouco mais sobre o que aconteceu.', campo: 'mensagem' }
  }
  if (contarLinks(`${titulo} ${mensagem}`) > VISITANTE_LINKS_MAX) {
    return { ok: false, erro: `Envie no máximo ${VISITANTE_LINKS_MAX} links por mensagem.`, campo: 'mensagem' }
  }
  if (temRepeticaoAbsurda(titulo) || temRepeticaoAbsurda(mensagem)) {
    return { ok: false, erro: 'A mensagem tem caracteres repetidos demais.', campo: 'mensagem' }
  }

  return { ok: true, chamado: { nome, email, titulo, mensagem, categoria, contexto } }
}

/** Resposta do visitante dentro de um chamado já aberto. */
export function validarRespostaDeVisitante(valor: unknown): { ok: true; texto: string } | { ok: false; erro: string } {
  const texto = limparInvisiveis(normalizarTexto(valor, VISITANTE_MENSAGEM_MAX))
  if (!texto) return { ok: false, erro: 'Escreva a mensagem antes de enviar.' }
  if (contarLinks(texto) > VISITANTE_LINKS_MAX) {
    return { ok: false, erro: `Envie no máximo ${VISITANTE_LINKS_MAX} links por mensagem.` }
  }
  if (temRepeticaoAbsurda(texto)) return { ok: false, erro: 'A mensagem tem caracteres repetidos demais.' }
  return { ok: true, texto }
}

/** Id de ticket no formato de ObjectId — recusa qualquer outra coisa antes do banco. */
export function ehIdDeTicket(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[a-f0-9]{24}$/i.test(valor)
}
