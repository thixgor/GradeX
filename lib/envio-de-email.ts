import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import type SMTPPool from 'nodemailer/lib/smtp-pool'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import { isMessageTooLargeError } from './email-attachment-size'
import { registrarEnvio, type RegistroDeEnvio } from './registro-de-emails'

/**
 * Todo e-mail do site sai por aqui.
 *
 * Os sumiços tinham três causas, nenhuma delas visível para quem esperava o
 * e-mail:
 *
 *  1. **Conexão velha no pool.** O transporter era `pool: true` e vivia o
 *     tempo da instância. Em serverless a instância congela entre requisições;
 *     quando acorda, o socket que a Hostinger já fechou continua no pool, e o
 *     primeiro `sendMail` morre nele ("Connection closed", ECONNRESET, ou 20 s
 *     de socketTimeout). O "Esqueci minha senha" não tinha retentativa nenhuma:
 *     a falha era engolida e a tela dizia "verifique sua caixa de entrada".
 *  2. **Nenhuma segunda chance.** Um 421/451 (servidor ocupado), um "auth
 *     limit" sob rajada ou um timeout de rede eram tratados como definitivos.
 *  3. **Nenhum rastro.** Sem registro por destinatário, "saiu daqui?" não tinha
 *     resposta.
 *
 * Daí este módulo: o pool é descartado quando fica ocioso (e logo depois de um
 * erro de conexão), a falha passageira ganha novas tentativas com espera
 * crescente, um servidor SMTP de reserva entra se o principal não der conta
 * (opcional, `SMTP_FALLBACK_*`), e cada envio vira uma linha em
 * `email_envios` (ver `lib/registro-de-emails.ts`).
 *
 * O erro original do nodemailer é relançado intacto — quem trata 552
 * (`isMessageTooLargeError`) continua recebendo o `responseCode`.
 */

export type OpcoesDeEmail = Mail.Options
export type InfoDeEnvio = SMTPTransport.SentMessageInfo

type TransporteSmtp = {
  sendMail(opcoes: Mail.Options): Promise<InfoDeEnvio>
  close?: () => void
}

interface ConfigSmtp {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  /** Troca o endereço do remetente mantendo o nome ("DomineAqui - Suporte"). */
  enderecoRemetente?: string
}

const REMETENTE_PADRAO = process.env.SMTP_FROM || '"DomineAqui" <no-reply@domineaqui.com.br>'

/**
 * Para onde vão as respostas. Os e-mails dizem "responda com sua Serial Key" e
 * "responda a este e-mail", mas saíam de `no-reply@` sem Reply-To: a resposta
 * do aluno caía numa caixa que ninguém lê.
 */
const RESPONDER_PARA_PADRAO = process.env.SMTP_REPLY_TO || 'contato@domineaqui.com.br'

/** Pool parado há mais que isso é descartado antes de usar (ver item 1 acima). */
const OCIOSIDADE_MAXIMA_MS = Number(process.env.SMTP_POOL_IDLE_MS) || 20_000

/** Não começa nova tentativa depois disso — a função serverless tem teto. */
const PRAZO_PADRAO_MS = Number(process.env.SMTP_RETRY_BUDGET_MS) || 20_000

/** Espera antes da 2ª e da 3ª tentativa. */
const ESPERAS_MS = [600, 1_800, 3_000]

function portaSegura(port: number, valor: string | undefined): boolean {
  if (valor === 'true') return true
  if (valor === 'false') return false
  return port === 465
}

function configPrincipal(): ConfigSmtp {
  const port = Number(process.env.SMTP_PORT) || 465
  return {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port,
    // Antes era `secure: true` fixo: com SMTP_PORT=587 (STARTTLS) a conexão
    // nunca fechava o handshake.
    secure: portaSegura(port, process.env.SMTP_SECURE),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    enderecoRemetente: process.env.SMTP_FROM_ADDRESS || undefined,
  }
}

/** Servidor de reserva (ex.: Brevo, SendGrid, Amazon SES via SMTP). Opcional. */
function configReserva(): ConfigSmtp | null {
  const host = process.env.SMTP_FALLBACK_HOST
  if (!host) return null
  const port = Number(process.env.SMTP_FALLBACK_PORT) || 587
  return {
    host,
    port,
    secure: portaSegura(port, process.env.SMTP_FALLBACK_SECURE),
    user: process.env.SMTP_FALLBACK_USER,
    pass: process.env.SMTP_FALLBACK_PASS,
    // Provedores de envio só aceitam remetente verificado neles.
    enderecoRemetente: process.env.SMTP_FALLBACK_FROM_ADDRESS || undefined,
  }
}

function criarTransporte(config: ConfigSmtp): TransporteSmtp {
  // `maxRequeues` existe no nodemailer, mas falta nos tipos do @types.
  const opcoes: SMTPPool.Options & { maxRequeues: number } = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    // Pool reaproveita a conexão dentro de uma rajada (campanha, aviso para
    // vários admins). A Hostinger derruba conexões quando recebe muitos AUTH
    // seguidos — o "auth limit" — e o pool evita isso.
    pool: true,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS) || 2,
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES) || 50,
    // No máx. `rateLimit` mensagens por `rateDelta` ms (padrão: 3/seg).
    rateDelta: 1000,
    rateLimit: Number(process.env.SMTP_RATE_LIMIT) || 3,
    // O padrão do nodemailer é recolocar na fila PARA SEMPRE a mensagem cuja
    // conexão caiu. Com o servidor recusando, o envio girava até a função
    // estourar o maxDuration. Uma recolocação e depois erro: quem decide a
    // próxima tentativa é `enviarEmail`, já com um pool novo.
    maxRequeues: 1,
    // Timeouts explícitos: sem eles, quando a Hostinger segura a conexão, o
    // sendMail fica pendurado até o serverless estourar o maxDuration — o
    // gateway então responde 504 em texto, que o front tenta ler como JSON.
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT) || 10_000,
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT) || 10_000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT) || 20_000,
  }
  return nodemailer.createTransport(opcoes) as unknown as TransporteSmtp
}

/**
 * Um pool que se renova. Descarta a conexão quando ela ficou ociosa tempo
 * bastante para a instância ter congelado, ou quando um erro de conexão mostra
 * que ela morreu.
 */
class TransporteRenovavel {
  private atual: TransporteSmtp | null = null
  private chave = ''
  private ultimoUso = 0
  private emVoo = 0

  async enviar(config: ConfigSmtp, opcoes: Mail.Options): Promise<InfoDeEnvio> {
    const chave = `${config.host}:${config.port}:${config.secure}:${config.user || ''}`
    const ocioso = this.emVoo === 0 && Date.now() - this.ultimoUso > OCIOSIDADE_MAXIMA_MS
    if (this.atual && (chave !== this.chave || ocioso)) this.descartar()
    if (!this.atual) {
      this.atual = criarTransporte(config)
      this.chave = chave
    }
    const transporte = this.atual
    this.emVoo++
    try {
      return await transporte.sendMail(opcoes)
    } finally {
      this.emVoo--
      this.ultimoUso = Date.now()
    }
  }

  descartar() {
    const velho = this.atual
    this.atual = null
    try {
      velho?.close?.()
    } catch {
      // Fechar um pool já morto pode lançar; não há o que fazer.
    }
  }
}

const principal = new TransporteRenovavel()
const reserva = new TransporteRenovavel()

// ── Classificação de falhas ─────────────────────────────────────────────────

export type TipoDeFalha =
  /** O socket morreu ou não abriu: vale tentar de novo, com pool novo. */
  | 'conexao'
  /** O servidor pediu para tentar depois (4xx, "auth limit"). */
  | 'temporaria'
  /** Mensagem grande demais: nenhum servidor vai aceitar. */
  | 'tamanho'
  /** O endereço do destinatário não existe/foi recusado. */
  | 'destinatario'
  /** Recusa definitiva deste servidor (5xx). Outro servidor pode aceitar. */
  | 'permanente'

const CODIGOS_DE_CONEXAO = new Set([
  'ECONNECTION',
  'ETIMEDOUT',
  'ESOCKET',
  'EDNS',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'EAI_AGAIN',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPROTOCOL',
])

const TEXTO_DE_CONEXAO =
  /connection closed|connection lost|greeting never received|unexpected socket close|connection pool was closed|socket hang up|timed? ?out|after connection was closed|client network socket disconnected/

const TEXTO_DE_DESTINATARIO =
  /recipient|mailbox|user unknown|no such user|unknown user|does not exist|address rejected|invalid address|no recipients/

export function classificarFalhaSmtp(err: any): TipoDeFalha {
  const codigo = String(err?.code || '')
  const resposta = Number(err?.responseCode) || 0
  const texto = `${err?.response || ''} ${err?.message || ''}`.toLowerCase()

  if (isMessageTooLargeError(err)) return 'tamanho'

  // EENVELOPE vale tanto para o MAIL FROM quanto para o RCPT TO. Remetente
  // recusado ("sender address rejected: not owned by user") é problema deste
  // servidor — o de reserva pode aceitar.
  if (codigo === 'EENVELOPE' || (resposta >= 550 && resposta <= 553)) {
    if (/sender|mail from|mail command failed/.test(texto)) return 'permanente'
    if (codigo === 'EENVELOPE' || TEXTO_DE_DESTINATARIO.test(texto)) return 'destinatario'
  }

  if (CODIGOS_DE_CONEXAO.has(codigo) || (!resposta && TEXTO_DE_CONEXAO.test(texto))) return 'conexao'

  // A Hostinger responde ao excesso de logins com erro de autenticação. Com a
  // senha errada todas as tentativas falham do mesmo jeito, e é para isso que
  // existe o servidor de reserva.
  if (codigo === 'EAUTH') return 'temporaria'

  if (resposta >= 400 && resposta < 500) return 'temporaria'
  if (resposta >= 500) return 'permanente'
  return 'temporaria'
}

/** Vale tentar de novo no mesmo servidor? */
function repetivel(tipo: TipoDeFalha): boolean {
  return tipo === 'conexao' || tipo === 'temporaria'
}

/** Outro servidor resolveria? Tamanho e destinatário inexistente, não. */
function cabeNaReserva(tipo: TipoDeFalha): boolean {
  return tipo !== 'tamanho' && tipo !== 'destinatario'
}

// ── Montagem da mensagem ────────────────────────────────────────────────────

/** Troca só o endereço do remetente, mantendo o nome exibido. */
export function trocarEnderecoDoRemetente(
  from: Mail.Options['from'],
  endereco?: string
): Mail.Options['from'] {
  if (!endereco) return from
  if (!from) return endereco
  if (typeof from === 'object') return { ...from, address: endereco }
  const comNome = /^(.*)<[^>]*>\s*$/.exec(from)
  if (comNome) return `${comNome[1]}<${endereco}>`
  return endereco
}

const ENTIDADES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  copy: '©',
  reg: '®',
  bull: '•',
  middot: '·',
  ndash: '–',
  mdash: '—',
  hellip: '…',
}

function decodificarEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (inteiro, nome: string) => {
    if (nome[0] === '#') {
      const codigo = nome[1] === 'x' || nome[1] === 'X' ? parseInt(nome.slice(2), 16) : parseInt(nome.slice(1), 10)
      return Number.isFinite(codigo) && codigo > 0 ? String.fromCodePoint(codigo) : inteiro
    }
    return ENTIDADES[nome.toLowerCase()] ?? inteiro
  })
}

/**
 * Versão em texto puro do HTML. Mensagem só com HTML pontua como spam no
 * SpamAssassin (MIME_HTML_ONLY) e em boa parte dos filtros corporativos — e
 * quase todos os nossos e-mails saíam assim.
 */
export function htmlParaTexto(html: string): string {
  let s = String(html || '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  s = s.replace(/<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, dentro: string) => {
    const texto = decodificarEntidades(dentro.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
    const destino = decodificarEntidades(href.trim())
    if (/^cid:/i.test(destino)) return texto
    const visivel = destino.replace(/^mailto:/i, '')
    if (!texto) return visivel
    if (texto.includes(visivel)) return texto
    return `${texto} (${visivel})`
  })

  s = s
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<\/t[dh]>/gi, '  ')
    .replace(/<\/?(p|div|h[1-6]|li|tr|table|tbody|thead|ul|ol|blockquote|hr|section|header|footer)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')

  return decodificarEntidades(s)
    .split('\n')
    .map((linha) => linha.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function montarMensagem(opcoes: Mail.Options, config: ConfigSmtp): Mail.Options {
  const mensagem: Mail.Options = { ...opcoes }
  mensagem.from = trocarEnderecoDoRemetente(opcoes.from || REMETENTE_PADRAO, config.enderecoRemetente)
  if (!mensagem.replyTo && RESPONDER_PARA_PADRAO) mensagem.replyTo = RESPONDER_PARA_PADRAO
  if (!mensagem.text && typeof mensagem.html === 'string') mensagem.text = htmlParaTexto(mensagem.html)
  return mensagem
}

function destinatarios(opcoes: Mail.Options): string[] {
  const lista: string[] = []
  const coletar = (valor: unknown) => {
    if (!valor) return
    if (Array.isArray(valor)) return valor.forEach(coletar)
    if (typeof valor === 'object') {
      const endereco = (valor as { address?: string }).address
      if (endereco) lista.push(endereco)
      return
    }
    for (const parte of String(valor).split(',')) {
      const endereco = /<([^>]+)>/.exec(parte)?.[1] || parte
      if (endereco.trim()) lista.push(endereco.trim())
    }
  }
  coletar(opcoes.to)
  coletar(opcoes.cc)
  coletar(opcoes.bcc)
  return lista
}

function esperar(ms: number): Promise<void> {
  // ±20% para duas instâncias que falharam juntas não voltarem juntas.
  const comVariacao = ms * (0.8 + Math.random() * 0.4)
  return new Promise((resolve) => setTimeout(resolve, comVariacao))
}

/** O registro nunca segura o envio: no máximo 1,5 s, e o erro é engolido. */
async function registrarSemSegurar(registro: Omit<RegistroDeEnvio, 'createdAt'>): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      registrarEnvio(registro),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, 1_500)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

let avisouCredenciais = false

export interface AjustesDeEnvio {
  /** Rótulo que aparece no registro ("redefinicao-senha", "serial-key"…). */
  categoria?: string
  /** `false` para envios que já têm histórico próprio (campanhas da outbox). */
  registrar?: boolean
  /** Tentativas no servidor principal. Padrão: 3 (2 se houver reserva). */
  tentativas?: number
  /** Não começa nova tentativa depois deste tempo. */
  prazoMs?: number
}

/**
 * Envia com retentativa, pool renovado e servidor de reserva. Resolve com o
 * `info` do nodemailer ou rejeita com o erro original da última tentativa.
 */
export async function enviarEmail(opcoes: Mail.Options, ajustes: AjustesDeEnvio = {}): Promise<InfoDeEnvio> {
  const inicio = Date.now()
  const prazo = ajustes.prazoMs ?? PRAZO_PADRAO_MS
  const configDaReserva = configReserva()
  const tentativasNoPrincipal = Math.max(1, ajustes.tentativas ?? (configDaReserva ? 2 : 3))
  const configDoPrincipal = configPrincipal()

  if ((!configDoPrincipal.user || !configDoPrincipal.pass) && !avisouCredenciais) {
    avisouCredenciais = true
    console.error('[email] SMTP_USER/SMTP_PASS não configurados — o envio pelo servidor principal vai falhar.')
  }

  type Etapa = { nome: 'principal' | 'reserva'; config: ConfigSmtp; pool: TransporteRenovavel }
  const etapas: Etapa[] = Array.from({ length: tentativasNoPrincipal }, () => ({
    nome: 'principal' as const,
    config: configDoPrincipal,
    pool: principal,
  }))
  if (configDaReserva) {
    etapas.push(
      { nome: 'reserva', config: configDaReserva, pool: reserva },
      { nome: 'reserva', config: configDaReserva, pool: reserva }
    )
  }

  let ultimoErro: any
  let tipoDoUltimoErro: TipoDeFalha | null = null
  let tentativas = 0
  let etapaDoUltimoErro: Etapa['nome'] = 'principal'

  for (const etapa of etapas) {
    if (tipoDoUltimoErro) {
      const trocouDeServidor = etapa.nome !== etapaDoUltimoErro
      // No mesmo servidor só vale repetir falha passageira; na troca para a
      // reserva, qualquer falha que outro servidor possa resolver.
      if (trocouDeServidor ? !cabeNaReserva(tipoDoUltimoErro) : !repetivel(tipoDoUltimoErro)) continue
      if (Date.now() - inicio > prazo) break
      if (!trocouDeServidor) await esperar(ESPERAS_MS[Math.min(tentativas - 1, ESPERAS_MS.length - 1)])
    }

    tentativas++
    try {
      const info = await etapa.pool.enviar(etapa.config, montarMensagem(opcoes, etapa.config))
      if (tentativas > 1) {
        console.warn(`[email] "${opcoes.subject}" saiu na tentativa ${tentativas} (${etapa.nome}).`)
      }
      if (ajustes.registrar !== false) {
        await registrarSemSegurar({
          para: destinatarios(opcoes),
          assunto: String(opcoes.subject || ''),
          categoria: ajustes.categoria,
          status: 'enviado',
          tentativas,
          transporte: etapa.nome,
          messageId: info?.messageId,
          resposta: info?.response ? String(info.response).slice(0, 300) : undefined,
          aceitos: (info?.accepted || []).map(String),
          recusados: (info?.rejected || []).map(String),
          duracaoMs: Date.now() - inicio,
        })
      }
      return info
    } catch (err: any) {
      ultimoErro = err
      tipoDoUltimoErro = classificarFalhaSmtp(err)
      etapaDoUltimoErro = etapa.nome
      console.error(
        `[email] "${opcoes.subject}" falhou (tentativa ${tentativas}, ${etapa.nome}, ${tipoDoUltimoErro}):`,
        err?.message || err
      )
      // Socket morto: o próximo envio precisa de conexão nova, não da mesma.
      if (tipoDoUltimoErro === 'conexao' || tipoDoUltimoErro === 'temporaria') etapa.pool.descartar()
    }
  }

  if (ajustes.registrar !== false) {
    await registrarSemSegurar({
      para: destinatarios(opcoes),
      assunto: String(opcoes.subject || ''),
      categoria: ajustes.categoria,
      status: 'falhou',
      tentativas,
      transporte: etapaDoUltimoErro,
      erro: String(ultimoErro?.response || ultimoErro?.message || ultimoErro).slice(0, 500),
      codigo: ultimoErro?.code ? String(ultimoErro.code) : undefined,
      duracaoMs: Date.now() - inicio,
    })
  }
  throw ultimoErro
}

/** Descarta os pools — para testes. */
export function descartarConexoesSmtp() {
  principal.descartar()
  reserva.descartar()
}
