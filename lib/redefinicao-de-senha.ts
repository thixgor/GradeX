import crypto from 'crypto'
import { ObjectId, type Db } from 'mongodb'
import { hashPassword, normalizeEmail } from './auth'
import { sendPasswordResetEmail } from './mail'
import { revokeAllUserSessions } from './sessions'
import type { User } from './types'

/**
 * Redefinição de senha — o link por e-mail, a troca pelo perfil e a senha
 * provisória gerada pelo admin passam todos por aqui.
 *
 * O que estava quebrando o "Esqueci minha senha":
 *  - Cada pedido sobrescrevia o link anterior. Quem não via o e-mail chegar e
 *    pedia de novo invalidava o primeiro — que então chegava atrasado e abria
 *    em "Link inválido ou expirado". Agora os últimos links seguem válidos.
 *  - 15 minutos era menos que o atraso de entrega em dia ruim de SMTP.
 *  - A falha de envio era engolida e a tela dizia "verifique sua caixa".
 */

/** Quanto tempo o link do e-mail vale. */
export const VALIDADE_DO_LINK_MIN = Number(process.env.RESET_PASSWORD_LINK_MINUTES) || 60

/** Links simultâneos aceitos: o pedido novo não mata o que ainda está a caminho. */
const LINKS_ATIVOS = 3

/**
 * Intervalo mínimo entre dois e-mails para a mesma conta. Impede que alguém
 * use o formulário para inundar a caixa de outra pessoa — e quem clicou duas
 * vezes recebe um e-mail só.
 */
export const INTERVALO_ENTRE_ENVIOS_MS = 45_000

export const SENHA_MIN = 6
export const SENHA_MAX = 128

export function hashDoTokenDeRedefinicao(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Acha a conta pelo e-mail. A busca exata usa o índice; a sem diferenciar
 * maiúsculas só roda quando a exata não acha nada — cobre contas antigas
 * gravadas como "Fulano@Gmail.com", que antes nunca recebiam o link.
 */
export async function buscarContaPorEmail(db: Db, email: string) {
  const normalizado = normalizeEmail(email)
  if (!normalizado) return null
  const users = db.collection<User>('users')
  const exata = await users.findOne({ email: normalizado })
  if (exata) return exata
  return users.findOne({ email: { $regex: `^${escaparRegex(normalizado)}$`, $options: 'i' } })
}

export type ResultadoDoLink =
  | { status: 'enviado' }
  /** Já saiu um e-mail há poucos segundos; este pedido não manda outro. */
  | { status: 'aguarde'; segundos: number }
  | { status: 'falhou'; erro: string }

/**
 * Gera um link novo, grava o hash e manda o e-mail — esperando o envio de
 * verdade, para a tela poder dizer a verdade.
 */
export async function enviarLinkDeRedefinicao(
  db: Db,
  user: Pick<User, '_id' | 'email' | 'name' | 'resetPasswordTokens' | 'resetPasswordRequestedAt'>,
  opcoes: { origem?: 'esqueci' | 'perfil' | 'admin' } = {}
): Promise<ResultadoDoLink> {
  const agora = Date.now()
  const ultimo = user.resetPasswordRequestedAt ? new Date(user.resetPasswordRequestedAt).getTime() : 0
  if (agora - ultimo < INTERVALO_ENTRE_ENVIOS_MS) {
    return { status: 'aguarde', segundos: Math.ceil((INTERVALO_ENTRE_ENVIOS_MS - (agora - ultimo)) / 1000) }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const hash = hashDoTokenDeRedefinicao(token)
  const novo = { hash, expiresAt: new Date(agora + VALIDADE_DO_LINK_MIN * 60_000), createdAt: new Date(agora) }
  const aindaValidos = (user.resetPasswordTokens || [])
    .filter((t) => t?.hash && new Date(t.expiresAt).getTime() > agora)
    .slice(-(LINKS_ATIVOS - 1))

  const filtro = { _id: new ObjectId(String(user._id)) }
  const users = db.collection<User>('users')
  await users.updateOne(filtro, {
    $set: { resetPasswordTokens: [...aindaValidos, novo], resetPasswordRequestedAt: new Date(agora) },
    // O link no formato antigo, se houver, segue valendo até expirar: não é
    // apagado aqui para não invalidar um e-mail que ainda está chegando.
  })

  try {
    await sendPasswordResetEmail(user.email, token, {
      nome: user.name,
      validadeMin: VALIDADE_DO_LINK_MIN,
      origem: opcoes.origem,
    })
    return { status: 'enviado' }
  } catch (err: any) {
    // O link não saiu: tira o hash e libera um novo pedido na hora, em vez de
    // prender a pessoa no intervalo mínimo por um e-mail que não existe.
    await users
      .updateOne(filtro, { $pull: { resetPasswordTokens: { hash } }, $unset: { resetPasswordRequestedAt: '' } })
      .catch(() => undefined)
    return { status: 'falhou', erro: String(err?.message || err) }
  }
}

/** Encontra a conta dona de um link ainda válido (formato novo ou antigo). */
export async function buscarContaPeloToken(db: Db, token: string) {
  if (!token) return null
  const hash = hashDoTokenDeRedefinicao(token)
  const agora = new Date()
  return db.collection<User>('users').findOne({
    $or: [
      { resetPasswordTokens: { $elemMatch: { hash, expiresAt: { $gt: agora } } } },
      { resetPasswordToken: hash, resetPasswordExpires: { $gt: agora } },
    ],
  })
}

/**
 * Grava a senha nova e fecha a porta para tudo o que valia antes: os links de
 * redefinição pendentes e as sessões abertas em outros aparelhos (quem troca a
 * senha porque alguém descobriu a antiga precisa que esse alguém saia).
 */
export async function gravarNovaSenha(
  db: Db,
  userId: string | ObjectId,
  senha: string,
  opcoes: {
    por: 'user' | 'reset' | 'admin'
    /** Sessão que continua aberta (a de quem trocou pelo perfil). */
    manterSessaoJti?: string
    /** O link chegou ao e-mail e foi aberto: o e-mail está confirmado. */
    confirmarEmail?: boolean
  }
): Promise<{ sessoesEncerradas: number }> {
  const id = String(userId)
  const set: Partial<User> = {
    password: await hashPassword(senha),
    passwordChangedAt: new Date(),
    passwordChangedBy: opcoes.por,
  }
  const unset: Record<string, ''> = {
    resetPasswordToken: '',
    resetPasswordExpires: '',
    resetPasswordTokens: '',
    resetPasswordRequestedAt: '',
  }
  if (opcoes.confirmarEmail) {
    set.emailVerified = true
    unset.verificationToken = ''
  }

  await db.collection<User>('users').updateOne({ _id: new ObjectId(id) }, { $set: set, $unset: unset })

  const sessoesEncerradas = await revokeAllUserSessions(id, {
    exceptJti: opcoes.manterSessaoJti,
    revokedBy: opcoes.por === 'admin' ? 'admin' : 'user',
  }).catch((err) => {
    console.error('[senha] falha ao encerrar as sessões após troca de senha:', err)
    return 0
  })

  return { sessoesEncerradas }
}

/** Valida tamanho; devolve a mensagem de erro ou null. */
export function problemaNaSenha(senha: unknown): string | null {
  if (typeof senha !== 'string' || senha.length < SENHA_MIN) {
    return `A senha deve ter no mínimo ${SENHA_MIN} caracteres`
  }
  if (senha.length > SENHA_MAX) return `A senha deve ter no máximo ${SENHA_MAX} caracteres`
  return null
}

// Sem 0/O, 1/l/I: a senha vai ser ditada ou copiada de uma mensagem.
const MINUSCULAS = 'abcdefghjkmnpqrstuvwxyz'
const MAIUSCULAS = 'ABCDEFGHJKMNPQRSTUVWXYZ'
const DIGITOS = '23456789'
const TODOS = MINUSCULAS + MAIUSCULAS + DIGITOS

/**
 * Senha provisória legível ("Kp7m-x3Qa-9vRt"): 12 caracteres sorteados com
 * `crypto.randomInt` (~68 bits), em blocos de 4 para ditar sem errar, com ao
 * menos uma minúscula, uma maiúscula e um dígito.
 */
export function gerarSenhaAleatoria(): string {
  const sorteia = (alfabeto: string) => alfabeto[crypto.randomInt(alfabeto.length)]
  const chars = [sorteia(MINUSCULAS), sorteia(MAIUSCULAS), sorteia(DIGITOS)]
  while (chars.length < 12) chars.push(sorteia(TODOS))
  // Fisher–Yates para as classes obrigatórias não ficarem sempre no começo.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12)].map((g) => g.join('')).join('-')
}
