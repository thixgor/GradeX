import { NextRequest, NextResponse } from 'next/server'
import { ObjectId, type Db } from 'mongodb'
import { randomInt } from 'crypto'
import { z } from 'zod'
import { secureApiEndpoint, isValidObjectId } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { avaliarAcessoAula } from '@/lib/aulas/acesso'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { lerProgressoEmLote } from '@/lib/aulas/repositorio-progresso'
import {
  avaliarCertificado,
  gerarCodigo,
  normalizarCodigo,
  regrasDoCertificado,
  TAMANHO_DO_CODIGO,
  type CertificadoEmitido,
} from '@/lib/aulas/certificado'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Emissão e verificação de certificados (§38).
 *
 * A elegibilidade é recalculada AQUI, do zero, a cada emissão. A tela também
 * calcula — para mostrar o quanto falta — mas nada do que ela diz é aceito: um
 * certificado é um documento que a pessoa mostra a terceiros, e confiar no
 * cliente seria publicar um botão de "declarar-se aprovado".
 *
 * O progresso é apurado sobre as aulas que a pessoa PODE VER, e não sobre todas
 * as do curso. Uma aula trancada atrás de outra compra não pode impedir o
 * certificado de quem terminou tudo que comprou — nem contar como concluída.
 */

const COLECAO = 'aulas_certificados'

const EmitirSchema = z.object({ setorId: z.string().min(1) })

/**
 * Aulas visíveis do curso e quantas estão concluídas.
 *
 * Reaproveita o mesmo motor de acesso e o mesmo repositório de progresso que a
 * biblioteca usa — se o número daqui divergisse do que a tela mostra, o aluno
 * veria "curso 100%" e um botão recusando emitir.
 */
async function apurarProgresso(db: Db, sessao: any, setorId: string) {
  const [aulas, usuario] = await Promise.all([
    db.collection('aulas_postagens').find({ setorId }).limit(2000).toArray(),
    montarContextoDoUsuario(db, sessao),
  ])

  const agora = new Date()
  const visiveis = aulas.filter((a) => !avaliarAcessoAula(a as any, usuario, agora).invisivel)
  const ids = visiveis.map((a) => String(a._id))

  const progresso = await lerProgressoEmLote(db, sessao.userId, ids)
  const concluidas = ids.filter((id) => progresso.get(id)?.concluida).length

  return { concluidas, total: visiveis.length }
}

/** GET sem código: meus certificados. Com código: verificação pública. */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const codigoBruto = new URL(request.url).searchParams.get('codigo')

    if (codigoBruto) {
      const codigo = normalizarCodigo(codigoBruto)
      if (codigo.length !== TAMANHO_DO_CODIGO) {
        return NextResponse.json({ certificado: null }, { status: 404 })
      }

      /*
       * Verificação é pública, e de propósito: um certificado só vale se um
       * terceiro — a instituição, o empregador — puder conferi-lo sem ter
       * conta aqui.
       *
       * A resposta traz o mínimo que sustenta a conferência: nome, curso, data
       * e quanto foi concluído. Nada de e-mail ou id de usuário, que não
       * ajudam a verificar e expõem quem estudou.
       */
      const doc = await db.collection<CertificadoEmitido>(COLECAO).findOne({ codigo })
      if (!doc) return NextResponse.json({ certificado: null }, { status: 404 })

      return NextResponse.json(
        {
          certificado: {
            codigo: doc.codigo,
            nomeDoAluno: doc.nomeDoAluno,
            nomeDoCurso: doc.nomeDoCurso,
            aulasConcluidas: doc.aulasConcluidas,
            aulasTotais: doc.aulasTotais,
            percentual: doc.percentual,
            emitidoEm: doc.emitidoEm,
          },
        },
        { headers: { 'Cache-Control': 'public, max-age=300' } },
      )
    }

    const sessao = await getSession()
    if (!sessao?.userId) return NextResponse.json({ certificados: [] })

    const meus = await db
      .collection<CertificadoEmitido>(COLECAO)
      .find({ usuarioId: sessao.userId })
      .sort({ emitidoEm: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json(
      { certificados: meus.map((c) => ({ ...c, _id: String(c._id) })) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[aulas/certificado] erro ao ler:', error)
    return NextResponse.json({ error: 'Erro ao carregar certificados' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'WRITE',
    auth: { requireAuth: true },
  })
  if (!security.success || security.errorResponse) return security.errorResponse

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = EmitirSchema.safeParse(body)
  if (!parsed.success || !isValidObjectId(parsed.data.setorId)) {
    return NextResponse.json({ error: 'Curso inválido' }, { status: 400 })
  }

  const { setorId } = parsed.data
  const sessao = security.session!

  try {
    const db = await getDb()

    const curso = await db.collection('aulas_setores').findOne({ _id: new ObjectId(setorId) })
    if (!curso) return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })

    const regras = regrasDoCertificado(curso as any)
    if (!regras.habilitado) {
      return NextResponse.json({ error: 'Este curso não emite certificado.' }, { status: 409 })
    }

    // Um certificado por pessoa por curso. Reemitir devolve o mesmo — o código
    // já foi mostrado a alguém, e trocá-lo invalidaria uma verificação que
    // pode estar num currículo.
    const existente = await db
      .collection<CertificadoEmitido>(COLECAO)
      .findOne({ usuarioId: sessao.userId, setorId })
    if (existente) {
      return NextResponse.json({ success: true, certificado: { ...existente, _id: String(existente._id) } })
    }

    const progresso = await apurarProgresso(db, sessao, setorId)
    const veredito = avaliarCertificado(regras, progresso)

    if (!veredito.elegivel) {
      return NextResponse.json(
        {
          error:
            veredito.faltam > 0
              ? `Faltam ${veredito.faltam} aula(s) para o certificado.`
              : 'Ainda não é possível emitir o certificado.',
          faltam: veredito.faltam,
        },
        { status: 409 },
      )
    }

    const usuario = await db
      .collection('users')
      .findOne({ _id: new ObjectId(sessao.userId) }, { projection: { name: 1 } })

    // `randomInt` do módulo crypto, e não `Math.random`: o código é o que
    // sustenta a verificação, e um gerador previsível permitiria forjar
    // códigos que "existem" sem ninguém ter concluído nada.
    const codigo = normalizarCodigo(gerarCodigo(() => randomInt(0, 1_000_000) / 1_000_000))

    const novo: CertificadoEmitido = {
      codigo,
      usuarioId: sessao.userId,
      nomeDoAluno: String(usuario?.name || sessao.name || 'Aluno'),
      setorId,
      nomeDoCurso: String(curso.nome || 'Curso'),
      // Retrato do momento: o curso pode crescer depois, e o documento não pode
      // passar a dizer que a pessoa concluiu menos do que concluiu.
      aulasConcluidas: veredito.concluidas,
      aulasTotais: veredito.total,
      percentual: veredito.percentual,
      emitidoEm: new Date(),
    }

    const r = await db.collection<CertificadoEmitido>(COLECAO).insertOne(novo as any)
    return NextResponse.json({ success: true, certificado: { ...novo, _id: String(r.insertedId) } })
  } catch (error) {
    console.error('[aulas/certificado] erro ao emitir:', error)
    return NextResponse.json({ error: 'Erro ao emitir o certificado' }, { status: 500 })
  }
}
