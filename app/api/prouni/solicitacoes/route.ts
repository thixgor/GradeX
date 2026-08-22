import { NextRequest, NextResponse } from 'next/server'
import { ObjectId, type Db } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import { isValidBrazilPhone } from '@/lib/phone'
import { audit } from '@/lib/payments/audit'
import { sendProuniRequestAdminAlert, sendProuniRequestReceivedEmail } from '@/lib/mail'
import { resolveProuniProduto } from '@/lib/prouni-catalogo'
import { apagarAnexos, prouniBlobPrefix, verificarAnexos } from '@/lib/prouni-anexos'
import {
  assertProuniRequestAllowed,
  ensureProuniIndexes,
  getLiveProuniBenefit,
  ProuniError,
  PROUNI_MAX_ATTACHMENTS,
  PROUNI_PROGRAMS,
  PROUNI_REQUESTS_COLLECTION,
  PROUNI_TERMS_VERSION,
  serializeProuniRequestForUser,
  type ProuniItemType,
  type ProuniRequest,
} from '@/lib/prouni-fies'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Solicitação de desconto PROUNI/FIES.
 *
 * O corpo é pequeno de propósito: os arquivos já estão no Blob (subiram diretos
 * do navegador), e o que chega aqui são referências. Isso mantém esta Function
 * com um JSON de alguns kilobytes mesmo quando a pessoa anexou 16 MB de
 * comprovante — o oposto de um `multipart` de 16 MB por requisição, que sob
 * concorrência é memória de sobra para derrubar a instância.
 *
 * A ordem das checagens é a defesa: o que é barato e recusa muita gente vem
 * primeiro (sessão, formato, limites por conta) e só no fim vem o que custa
 * rede (ler metadados e o cabeçalho de cada arquivo). Quem está inundando o
 * endpoint nunca chega na parte cara.
 */

const AnexoSchema = z.object({
  url: z.string().url().max(600),
  pathname: z.string().min(1).max(400),
  filename: z.string().max(180).optional(),
})

const Schema = z.object({
  itemType: z.enum(['material', 'package', 'manual_clinico', 'plus']),
  itemId: z.string().min(1).max(80),
  program: z.enum(['prouni', 'fies']),
  fullName: z.string().min(5).max(120),
  cpf: z.string().min(11).max(20),
  email: z.string().email().max(160),
  phone: z.string().min(8).max(24),
  dateOfBirth: z.string().min(8).max(30),
  institution: z.string().min(2).max(140),
  courseName: z.string().max(120).optional(),
  acceptProgramTerms: z.literal(true),
  acceptPlatformTerms: z.literal(true),
  attachments: z.array(AnexoSchema).min(1).max(PROUNI_MAX_ATTACHMENTS),
})

/** Idade plausível para estudante com bolsa. Barra data digitada errada. */
function validarNascimento(valor: string): Date {
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) throw new ProuniError('Data de nascimento inválida.', 400)
  const agora = new Date()
  const anos = (agora.getTime() - data.getTime()) / (365.25 * 86_400_000)
  if (anos < 15 || anos > 100) throw new ProuniError('Data de nascimento inválida.', 400)
  return data
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Dois limites, dois alvos: a conta (quem reenvia sem parar) e a rede (quem
  // cria contas descartáveis para entupir a fila de análise).
  const [porConta, porIp] = await Promise.all([
    checkRateLimit(session.userId, 'prouni_solicitacao_user', 5, 3_600_000),
    checkRateLimit(ip, 'prouni_solicitacao_ip', 15, 3_600_000),
  ])
  if (!porConta.success || !porIp.success) {
    return NextResponse.json({ error: 'Muitas solicitações. Tente novamente mais tarde.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Preencha todos os campos e aceite os termos.' }, { status: 400 })
  }
  const data = parsed.data

  // Os arquivos já estão no Blob. Se qualquer coisa abaixo recusar a
  // solicitação, eles precisam sair de lá — senão cada tentativa recusada
  // deixaria lixo pago para trás.
  const urlsEnviadas = data.attachments.map((file) => file.url)
  const abortar = async (mensagem: string, status: number) => {
    await apagarAnexos(urlsEnviadas)
    return NextResponse.json({ error: mensagem }, { status })
  }

  try {
    const cpf = onlyCpfDigits(data.cpf)
    if (!isValidCpf(cpf)) return await abortar('CPF inválido.', 400)
    if (!isValidBrazilPhone(data.phone)) return await abortar('Telefone inválido. Informe com DDD.', 400)
    const dateOfBirth = validarNascimento(data.dateOfBirth)

    const db = await getDb()
    void ensureProuniIndexes(db)

    const itemType = data.itemType as ProuniItemType
    const benefit = await getLiveProuniBenefit(db, itemType, data.itemId)
    if (!benefit) return await abortar('Este item não oferece desconto PROUNI/FIES.', 404)

    const produto = await resolveProuniProduto(db, itemType, data.itemId)
    if (!produto || produto.isUnavailable) {
      return await abortar('Este item não está disponível no momento.', 404)
    }

    await assertProuniRequestAllowed(db, {
      userId: session.userId,
      itemType,
      itemId: data.itemId,
    })

    const anexos = await verificarAnexos(data.attachments, {
      userId: session.userId,
      prefixoPermitido: prouniBlobPrefix(session.userId),
    })

    const agora = new Date()
    const doc: Omit<ProuniRequest, '_id'> = {
      userId: session.userId,
      userName: session.name || '',
      userEmail: session.email || '',
      itemType,
      itemId: data.itemId,
      itemTitle: produto.title,
      program: PROUNI_PROGRAMS.includes(data.program) ? data.program : 'prouni',
      applicant: {
        fullName: data.fullName.trim().replace(/\s+/g, ' '),
        cpf,
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        dateOfBirth,
        institution: data.institution.trim(),
        courseName: data.courseName?.trim() || undefined,
      },
      attachments: anexos,
      terms: {
        programTerms: true,
        platformTerms: true,
        version: PROUNI_TERMS_VERSION,
        acceptedAt: agora,
        ip,
        userAgent: (request.headers.get('user-agent') || '').slice(0, 300),
      },
      status: 'pending',
      grant: null,
      requestIp: ip,
      createdAt: agora,
      updatedAt: agora,
    }

    let inserido
    try {
      inserido = await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).insertOne(doc as any)
    } catch (error: any) {
      // Índice único parcial: duas abas enviando ao mesmo tempo. A segunda
      // perde, e o certo é dizer isso — não criar a fila em duplicata.
      if (error?.code === 11000) {
        return await abortar('Você já tem uma solicitação em análise para este item.', 409)
      }
      throw error
    }

    await preencherPerfilVazio(db, session.userId, {
      fullName: doc.applicant.fullName,
      cpf,
      phone: doc.applicant.phone,
      dateOfBirth,
      institution: doc.applicant.institution,
    })

    // Avisos por e-mail. Disparados sem `await` de propósito: a solicitação já
    // está gravada, e o SMTP da Hostinger costuma ser o passo mais lento aqui —
    // segurar a resposta por causa dele faria a pessoa achar que o envio falhou
    // e clicar de novo. As próprias funções engolem o erro e registram no log.
    void (async () => {
      const pendentes = await db
        .collection(PROUNI_REQUESTS_COLLECTION)
        .countDocuments({ status: 'pending' })
        .catch(() => undefined)

      await Promise.allSettled([
        session.email
          ? sendProuniRequestReceivedEmail({
              email: session.email,
              name: doc.applicant.fullName || session.name,
              itemTitle: produto.title,
              itemType,
              itemId: data.itemId,
              program: doc.program,
              attachments: anexos.length,
            })
          : Promise.resolve(),
        sendProuniRequestAdminAlert({
          requestId: String(inserido.insertedId),
          userName: session.name,
          userEmail: session.email,
          applicantName: doc.applicant.fullName,
          applicantCpf: doc.applicant.cpf,
          institution: doc.applicant.institution,
          itemTitle: produto.title,
          program: doc.program,
          attachments: anexos.length,
          pendingCount: typeof pendentes === 'number' ? pendentes : undefined,
        }),
      ])
    })()

    await audit({
      action: 'prouni_request_created',
      actorUserId: session.userId,
      targetUserId: session.userId,
      resourceType: 'prouni_request',
      resourceId: String(inserido.insertedId),
      metadata: {
        itemType,
        itemId: data.itemId,
        program: doc.program,
        attachments: anexos.length,
      },
      ip,
    })

    return NextResponse.json({
      success: true,
      request: serializeProuniRequestForUser({ ...doc, _id: inserido.insertedId } as ProuniRequest),
    })
  } catch (error: any) {
    if (error instanceof ProuniError) {
      return await abortar(error.message, error.status)
    }
    console.error('[prouni/solicitacoes] erro:', error)
    return await abortar('Não foi possível registrar sua solicitação. Tente novamente.', 500)
  }
}

/**
 * Aproveita o que a pessoa acabou de digitar para completar o perfil.
 *
 * Só preenche o que está VAZIO. O formulário do benefício não é lugar de
 * corrigir cadastro: sobrescrever um CPF já verificado pela Receita com o que
 * veio de um campo de texto seria trocar dado conferido por dado digitado.
 */
async function preencherPerfilVazio(
  db: Db,
  userId: string,
  dados: { fullName: string; cpf: string; phone: string; dateOfBirth: Date; institution: string }
) {
  if (!ObjectId.isValid(userId)) return
  try {
    const users = db.collection<User>('users')
    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { fullName: 1, cpf: 1, phone: 1, dateOfBirth: 1, afyaUnit: 1, institution: 1 } }
    )
    if (!user) return

    const set: Record<string, any> = {}
    if (!user.fullName) set.fullName = dados.fullName
    if (!user.phone) set.phone = dados.phone
    if (!user.dateOfBirth) set.dateOfBirth = dados.dateOfBirth
    if (!user.institution && !user.afyaUnit) set.institution = dados.institution

    // CPF é único entre contas. Se outra já usa esse número, o certo é NÃO
    // gravar e deixar a análise humana decidir — a alternativa seria estourar
    // um erro de chave duplicada no meio de uma solicitação legítima.
    if (!user.cpf) {
      const emUso = await users.findOne({ cpf: dados.cpf, _id: { $ne: new ObjectId(userId) } }, { projection: { _id: 1 } })
      if (!emUso) set.cpf = dados.cpf
    }

    if (Object.keys(set).length > 0) {
      await users.updateOne({ _id: new ObjectId(userId) }, { $set: set })
    }
  } catch (error) {
    // Completar perfil é bônus: nunca pode fazer a solicitação falhar.
    console.warn('[prouni/solicitacoes] falha ao completar perfil:', error)
  }
}

/** Minhas solicitações (para a página exclusiva e o perfil). */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const rl = await checkRateLimit(session.userId, 'prouni_minhas_solicitacoes', 60, 60_000)
    if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

    const db = await getDb()
    const solicitacoes = await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION)
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({ requests: solicitacoes.map(serializeProuniRequestForUser) })
  } catch (error) {
    console.error('[prouni/solicitacoes] erro ao listar:', error)
    return NextResponse.json({ error: 'Erro ao carregar solicitações' }, { status: 500 })
  }
}
