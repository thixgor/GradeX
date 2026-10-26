import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { corpoDeIaBloqueada, iaDeEstudoLiberada } from '@/lib/ia/estudo/acesso'
import { gerarLoteDeQuestoes } from '@/lib/ia/estudo/gerador-de-provas'
import { planejarProva, sanitizarVaga, type VagaDaQuestao } from '@/lib/ia/estudo/plano-da-prova'
import { ErroGemini } from '@/lib/ia/gemini'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Vagas por requisição: um lote de até seis cabe com folga nos 120 s. */
const MAXIMO_DE_VAGAS = 6

/**
 * POST — gera as questões de um lote da prova pessoal.
 *
 * A tela (`/exams/create-personal`) monta o plano da prova inteira e manda as
 * vagas aos poucos, três por vez, mostrando o progresso; cada requisição é uma
 * chamada à IA, não quarenta. Para quem ainda manda o corpo antigo (`themes`,
 * `numberOfQuestions`…), o plano é montado aqui com o mesmo `planejarProva`.
 *
 * Só Quest+ e Plus+ (e admin) geram — ver `lib/ia/estudo/acesso.ts`.
 */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let corpo: any
  try {
    corpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const db = await getDb()
  const isAdmin = session.role === 'admin'
  const isTemporaryId = params.id.startsWith('temp-')

  const [user, exam] = await Promise.all([
    db.collection('users').findOne({ _id: new ObjectId(session.userId) }, { projection: { accountType: 1 } }),
    isTemporaryId || !ObjectId.isValid(params.id)
      ? Promise.resolve(null)
      : db.collection('exams').findOne(
          { _id: new ObjectId(params.id), createdBy: session.userId, isPersonalExam: true },
          { projection: { _id: 1 } },
        ),
  ])
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  if (!isTemporaryId && !exam) return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })

  if (!iaDeEstudoLiberada(user.accountType, isAdmin)) {
    return NextResponse.json(corpoDeIaBloqueada('provas'), { status: 403 })
  }

  const limite = await checkRateLimit(session.userId, 'provas_ia_lote', 20, 60_000)
  if (!limite.success) {
    return NextResponse.json({ error: 'Muitas gerações seguidas. Aguarde um minuto e tente de novo.' }, { status: 429 })
  }

  const alternativas = Number(corpo.alternativas ?? corpo.numberOfAlternatives) >= 5 ? 5 : 4
  const contexto = String(corpo.contexto ?? corpo.context ?? 'Prova de estudo').replace(/\s+/g, ' ').trim().slice(0, 240)
  const evitar: string[] = (Array.isArray(corpo.evitar) ? corpo.evitar : [])
    .map((f: unknown) => String(f || '').replace(/\s+/g, ' ').trim().slice(0, 100))
    .filter(Boolean)
    .slice(-30)

  let vagas: VagaDaQuestao[]
  if (Array.isArray(corpo.vagas)) {
    vagas = corpo.vagas
      .slice(0, MAXIMO_DE_VAGAS)
      .map((v: unknown) => sanitizarVaga(v, alternativas))
      .filter((v: VagaDaQuestao | null): v is VagaDaQuestao => v !== null)
  } else {
    // Corpo antigo: monta o plano aqui.
    const temas: string[] = Array.isArray(corpo.themes) ? corpo.themes : []
    const dificuldade = Number(corpo.difficulty)
    vagas = planejarProva({
      temas,
      quantidade: Math.min(MAXIMO_DE_VAGAS, Number(corpo.numberOfQuestions) || 1),
      alternativas,
      nivel: corpo.randomDifficulty ? 'misto' : dificuldade < 0.35 ? 'facil' : dificuldade < 0.7 ? 'medio' : 'dificil',
      estilo: corpo.mixedStyles ? 'misto' : corpo.style === 'rapida' ? 'direta' : 'contextualizada',
      formatos:
        corpo.alternativeType && corpo.alternativeType !== 'mixed'
          ? [corpo.alternativeType]
          : ['standard', 'multiple-affirmative', 'assertion-reason', 'comparison'],
      recursos: [],
    })
  }
  if (vagas.length === 0) return NextResponse.json({ error: 'Escolha pelo menos um tema' }, { status: 400 })

  try {
    const resultado = await gerarLoteDeQuestoes({ vagas, alternativas, contexto, evitar }, 100_000)
    if (resultado.questoes.length === 0) {
      return NextResponse.json(
        { error: 'A IA não devolveu nenhuma questão aprovada na revisão. Tente de novo.', faltaram: resultado.faltaram },
        { status: 502 },
      )
    }
    return NextResponse.json(resultado)
  } catch (erro) {
    const temporario = erro instanceof ErroGemini ? erro.temporario : true
    console.error('[provas/ia] falha ao gerar lote:', erro instanceof Error ? erro.message.slice(0, 300) : erro)
    return NextResponse.json(
      {
        error: temporario
          ? 'A IA está sobrecarregada agora. Tente de novo em instantes.'
          : 'Não foi possível gerar as questões. Verifique a configuração da IA.',
        temporario,
      },
      { status: temporario ? 503 : 500 },
    )
  }
}
