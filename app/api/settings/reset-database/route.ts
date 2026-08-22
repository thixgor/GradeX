import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { safeCompare } from '@/lib/admin-gate'
import { logAdminSecurityEvent } from '@/lib/admin-audit'
import { getClientIp, parseDeviceName, revokeAllAdminSessions } from '@/lib/sessions'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendDatabaseResetCodeEmail } from '@/lib/mail'
import { generateLoginCode, hashLoginCode, verifyLoginCode } from '@/lib/login-code'

export const dynamic = 'force-dynamic'

/**
 * Esvaziar o banco de dados inteiro.
 *
 * ## Como esta rota estava
 *
 * ```ts
 * const RESET_PASSWORD = '<quatro dígitos, escritos aqui mesmo>'
 * ...
 * for (const collection of collections) {
 *   await db.collection(collection.name).drop()
 * }
 * ```
 *
 * A senha estava escrita no código-fonte, versionada, visível para qualquer
 * pessoa com acesso ao repositório — e era o mesmo valor do código padrão do
 * painel, então quem descobrisse um descobria o outro. Bastava uma sessão de admin (um
 * notebook esquecido aberto, um cookie roubado por XSS, um ex-colaborador com
 * acesso ao repo) e uma requisição para apagar TUDO: usuários, provas,
 * submissões, o Banco de Questões inteiro, os manuais. Sem confirmação, sem
 * registro de quem fez, sem backup e sem volta.
 *
 * É o cenário exato que o dono descreveu: um concorrente que destrói o acervo
 * em vez de copiá-lo.
 *
 * ## Como está agora
 *
 * Sete fatores independentes, e a operação deixou de ser destrutiva.
 *
 * 1. **`ALLOW_DB_RESET=true`** — sem essa variável a rota responde 404 e se
 *    comporta como se não existisse. Em operação normal ela fica desligada, o
 *    que significa que na maior parte do tempo o exploit não tem alvo.
 * 2. **Produção exige `ALLOW_DB_RESET_IN_PRODUCTION=true` além disso** — ligar
 *    por engano em homologação não abre a porta no ambiente que importa.
 * 3. **Sessão de admin + código do painel** — o `admin-gate` já cobre
 *    `/api/settings` (ver `lib/admin-gate.ts`), então a segunda senha do painel
 *    é cobrada antes de o handler rodar.
 * 4. **Allowlist de e-mail (`DB_RESET_ALLOWED_EMAILS`)** — ser admin não basta;
 *    é preciso ser um dos administradores nomeados.
 * 5. **`DB_RESET_CODE`** — segredo próprio, distinto do código do painel e sem
 *    valor padrão. Não configurado, a rota recusa.
 * 6. **Código de 6 dígitos por e-mail** — vai para o endereço do admin. Quem
 *    tem só o cookie, sem a caixa de entrada, para aqui.
 * 7. **Frase de confirmação gerada pelo servidor** — uso único, 5 minutos,
 *    amarrada ao par (usuário, sessão). Copiar a requisição não a reaproveita.
 *
 * ## E a destruição virou reversível
 *
 * As coleções são **renomeadas** para `_lixeira_<timestamp>_<nome>`, não
 * apagadas. Mesmo que os sete fatores caiam, nada se perde: um `renameCollection`
 * de volta restaura o estado. A limpeza definitiva é feita por quem tem acesso
 * ao Atlas, fora do alcance de qualquer requisição HTTP.
 *
 * `admin_security_events` é preservada de propósito — sem ela o próprio registro
 * de quem apagou o banco seria apagado junto.
 */

/** Coleções que sobrevivem ao reset. A trilha de auditoria não pode sumir com o resto. */
const COLECOES_PRESERVADAS = new Set(['admin_security_events'])

/** Prefixo das coleções já enviadas para a lixeira — não são movidas de novo. */
const PREFIXO_DA_LIXEIRA = '_lixeira_'

const COLECAO_DE_DESAFIOS = 'db_reset_challenges'

/** Validade da frase de confirmação. Curta de propósito: é para digitar agora. */
const VALIDADE_DO_DESAFIO_MS = 5 * 60 * 1000

/** Tentativas de código errado antes de o desafio ser queimado. */
const MAXIMO_DE_TENTATIVAS = 3

interface Veredito {
  ok: boolean
  status?: number
  erro?: string
}

/** Fatores 1 e 2: a rota existe neste ambiente? */
function resetHabilitado(): boolean {
  if (process.env.ALLOW_DB_RESET !== 'true') return false
  if (process.env.NODE_ENV === 'production') {
    return process.env.ALLOW_DB_RESET_IN_PRODUCTION === 'true'
  }
  return true
}

/** Fator 4: este admin em específico pode pedir o reset? */
function emailAutorizado(email: string): boolean {
  const lista = (process.env.DB_RESET_ALLOWED_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (lista.length === 0) return false
  return lista.includes(email.trim().toLowerCase())
}

/** Fator 5: o segredo próprio desta operação, sem valor padrão. */
function codigoDoCofreValido(entrada: unknown): Veredito {
  const configurado = (process.env.DB_RESET_CODE || '').trim()
  if (!configurado) {
    return {
      ok: false,
      status: 503,
      erro: 'DB_RESET_CODE não está configurado no ambiente. A operação está indisponível.',
    }
  }
  if (typeof entrada !== 'string' || !entrada.trim()) {
    return { ok: false, status: 400, erro: 'Código do cofre é obrigatório' }
  }
  if (!safeCompare(entrada.trim(), configurado)) {
    return { ok: false, status: 401, erro: 'Código do cofre incorreto' }
  }
  return { ok: true }
}

/**
 * Frase que o admin vai digitar.
 *
 * Legível e específica desta tentativa: não dá para deixar pronta numa macro,
 * e o sufixo aleatório impede que a frase de ontem sirva hoje.
 */
function gerarFrase(): string {
  const dia = new Date().toISOString().slice(0, 10)
  const sufixo = crypto.randomBytes(3).toString('hex')
  return `APAGAR BANCO ${dia} ${sufixo}`
}

/** Fatores 1 a 5, comuns às duas etapas. */
async function validarFatoresBase(
  request: NextRequest,
  corpo: any,
): Promise<Veredito & { session?: any }> {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { ok: false, status: 403, erro: 'Não autorizado' }
  }

  if (!emailAutorizado(session.email || '')) {
    return {
      ok: false,
      status: 403,
      erro: 'Esta conta não está na lista de administradores autorizados a resetar o banco.',
    }
  }

  const cofre = codigoDoCofreValido(corpo?.codigoDoCofre)
  if (!cofre.ok) return cofre

  return { ok: true, session }
}

export async function POST(request: NextRequest) {
  // Fatores 1 e 2 antes de tudo: desligada, a rota não admite nem que existe.
  if (!resetHabilitado()) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const ip = getClientIp(request)

    // Rate limit durável (MongoDB, não memória do lambda): três tentativas por
    // hora. Serve tanto contra força bruta no código do cofre quanto contra
    // alguém tentando esgotar o envio de e-mails.
    const limite = await checkRateLimit(ip, 'db-reset', 3, 60 * 60 * 1000)
    if (!limite.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde uma hora.' },
        { status: 429 },
      )
    }

    const corpo = await request.json().catch(() => ({}))
    const etapa = corpo?.etapa === 'executar' ? 'executar' : 'desafio'

    const base = await validarFatoresBase(request, corpo)
    if (!base.ok) {
      await logAdminSecurityEvent({
        type: 'database_reset_failed',
        ip,
        deviceName: parseDeviceName(request.headers.get('user-agent')),
        meta: { etapa, motivo: base.erro },
      })
      return NextResponse.json({ error: base.erro }, { status: base.status || 403 })
    }

    const session = base.session
    const db = await getDb()
    const desafios = db.collection(COLECAO_DE_DESAFIOS)

    // TTL: um desafio não usado desaparece sozinho.
    await desafios
      .createIndex({ expiraEm: 1 }, { expireAfterSeconds: 0 })
      .catch(() => {})

    // ─── Etapa 1: emitir o desafio e mandar o código por e-mail ──────────────
    if (etapa === 'desafio') {
      const frase = gerarFrase()
      const codigo = generateLoginCode()
      const desafioId = crypto.randomUUID()

      await desafios.insertOne({
        desafioId,
        userId: session.userId,
        sessionJti: session.jti || '',
        frase,
        codigoHash: hashLoginCode(codigo),
        tentativas: 0,
        usadoEm: null,
        criadoEm: new Date(),
        expiraEm: new Date(Date.now() + VALIDADE_DO_DESAFIO_MS),
      })

      // Se o e-mail não sai, a operação não avança: o fator 6 deixaria de
      // existir e o desafio viraria uma formalidade.
      try {
        await sendDatabaseResetCodeEmail({
          email: session.email,
          nome: session.name || '',
          codigo,
          ip,
          dispositivo: parseDeviceName(request.headers.get('user-agent')),
        })
      } catch (err) {
        console.error('[db-reset] falha ao enviar o código:', err)
        await desafios.deleteOne({ desafioId })
        return NextResponse.json(
          { error: 'Não foi possível enviar o código de confirmação. Operação cancelada.' },
          { status: 502 },
        )
      }

      await logAdminSecurityEvent({
        type: 'database_reset_challenged',
        userId: session.userId,
        userName: session.name,
        userEmail: session.email,
        ip,
        deviceName: parseDeviceName(request.headers.get('user-agent')),
        meta: { desafioId },
      })

      return NextResponse.json({
        etapa: 'desafio',
        desafioId,
        frase,
        expiraEm: new Date(Date.now() + VALIDADE_DO_DESAFIO_MS).toISOString(),
        mensagem: `Um código de 6 dígitos foi enviado para ${session.email}. Digite-o junto da frase de confirmação.`,
      })
    }

    // ─── Etapa 2: conferir os fatores 6 e 7 e executar ───────────────────────
    const desafioId = String(corpo?.desafioId || '')
    const desafio = await desafios.findOne({ desafioId })

    const negar = async (erro: string, status: number) => {
      await logAdminSecurityEvent({
        type: 'database_reset_failed',
        userId: session.userId,
        userName: session.name,
        userEmail: session.email,
        ip,
        deviceName: parseDeviceName(request.headers.get('user-agent')),
        meta: { etapa: 'executar', motivo: erro, desafioId },
      })
      return NextResponse.json({ error: erro }, { status })
    }

    if (!desafio) return negar('Desafio inválido ou expirado. Comece de novo.', 400)
    if (desafio.usadoEm) return negar('Este desafio já foi usado. Comece de novo.', 400)
    if (new Date(desafio.expiraEm).getTime() < Date.now()) {
      return negar('Desafio expirado. Comece de novo.', 400)
    }

    // O desafio pertence a esta pessoa E a esta sessão: copiar o corpo da
    // requisição para outro navegador não o reaproveita.
    if (desafio.userId !== session.userId || desafio.sessionJti !== (session.jti || '')) {
      return negar('Desafio não pertence a esta sessão.', 403)
    }

    if (desafio.tentativas >= MAXIMO_DE_TENTATIVAS) {
      await desafios.deleteOne({ desafioId })
      return negar('Tentativas esgotadas. Comece de novo.', 429)
    }

    if (String(corpo?.frase || '').trim() !== desafio.frase) {
      await desafios.updateOne({ desafioId }, { $inc: { tentativas: 1 } })
      return negar('Frase de confirmação incorreta.', 400)
    }

    if (!verifyLoginCode(String(corpo?.codigo || '').trim(), desafio.codigoHash)) {
      await desafios.updateOne({ desafioId }, { $inc: { tentativas: 1 } })
      return negar('Código de confirmação incorreto.', 401)
    }

    // Queima o desafio ANTES de agir: duas requisições simultâneas com o mesmo
    // desafio não executam duas vezes.
    const queimado = await desafios.findOneAndUpdate(
      { desafioId, usadoEm: null },
      { $set: { usadoEm: new Date() } },
    )
    if (!queimado) return negar('Este desafio já foi usado. Comece de novo.', 409)

    // ─── Execução: renomear, nunca dropar ────────────────────────────────────
    const marca = new Date().toISOString().replace(/[:.]/g, '-')
    const colecoes = await db.listCollections().toArray()

    const movidas: string[] = []
    const falhas: { colecao: string; erro: string }[] = []

    for (const colecao of colecoes) {
      const nome = colecao.name
      if (COLECOES_PRESERVADAS.has(nome)) continue
      if (nome.startsWith(PREFIXO_DA_LIXEIRA)) continue
      if (nome.startsWith('system.')) continue
      if (nome === COLECAO_DE_DESAFIOS) continue

      try {
        await db.collection(nome).rename(`${PREFIXO_DA_LIXEIRA}${marca}_${nome}`)
        movidas.push(nome)
      } catch (err: any) {
        falhas.push({ colecao: nome, erro: err?.message || 'erro desconhecido' })
      }
    }

    await logAdminSecurityEvent({
      type: 'database_reset',
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      ip,
      deviceName: parseDeviceName(request.headers.get('user-agent')),
      meta: {
        marca,
        prefixoDaLixeira: `${PREFIXO_DA_LIXEIRA}${marca}_`,
        colecoesMovidas: movidas.length,
        colecoes: movidas,
        falhas,
      },
    })

    // Todas as sessões de admin caem: o banco de usuários acabou de sair do
    // lugar e qualquer sessão viva aponta para um estado que não existe mais.
    await revokeAllAdminSessions({}).catch(() => {})

    const resposta = NextResponse.json({
      success: true,
      reversivel: true,
      prefixoDaLixeira: `${PREFIXO_DA_LIXEIRA}${marca}_`,
      colecoesMovidas: movidas.length,
      colecoes: movidas,
      falhas,
      message:
        `${movidas.length} coleções foram movidas para a lixeira com o prefixo ` +
        `"${PREFIXO_DA_LIXEIRA}${marca}_". Nada foi apagado: para desfazer, renomeie ` +
        `as coleções de volta pelo Atlas. A trilha de auditoria foi preservada.`,
    })
    resposta.cookies.delete('auth-token')
    return resposta
  } catch (error: any) {
    console.error('[db-reset] erro:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a operação' },
      { status: 500 },
    )
  }
}
