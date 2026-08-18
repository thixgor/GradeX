import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { dayKey } from '@/lib/streak'

export const dynamic = 'force-dynamic'

// Hash determinístico simples (FNV-1a) para escolher a questão do dia de forma
// estável: a mesma data sempre cai na mesma questão, sem precisar guardar nada.
function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Alguns registros do banco trazem quebras de linha escapadas como texto
// literal ("\n", "\r\n", "\nl") em vez de caracteres de quebra de linha
// reais — normaliza para que `whitespace-pre-line` no front exiba
// corretamente.
function normalizarQuebrasDeLinha(texto: string): string {
  return texto.replace(/\\r\\n|\\nl|\\n|\\r/g, '\n')
}

// Questão do dia: mecânica de retorno (gatilho para o usuário voltar todo dia).
// Determinística por data, autenticada.
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const col = db.collection('banco_questoes')
    const filtro: any = {
      tipo: 'objetiva',
      alternativas: { $exists: true, $ne: [] },
      explicacao: { $exists: true, $nin: [null, ''] },
    }

    const total = await col.countDocuments(filtro)
    if (total === 0) {
      return NextResponse.json({ questao: null })
    }

    const hoje = dayKey(new Date())
    const index = hashString(hoje) % total

    const doc = await col
      .find(filtro, {
        projection: {
          _id: 1,
          enunciado: 1,
          explicacao: 1,
          imagemUrl: 1,
          alternativas: 1,
          dificuldade: 1,
          fonte: 1,
          ano: 1,
        },
      })
      .sort({ _id: 1 })
      .skip(index)
      .limit(1)
      .next()

    if (!doc) {
      return NextResponse.json({ questao: null })
    }

    const q = doc as any
    return NextResponse.json(
      {
        data: hoje,
        questao: {
          id: String(q._id),
          enunciado: normalizarQuebrasDeLinha(q.enunciado || ''),
          explicacao: normalizarQuebrasDeLinha(q.explicacao || ''),
          imagemUrl: q.imagemUrl || null,
          alternativas: (q.alternativas || []).map((a: any) => ({
            letra: a.letra,
            texto: a.texto,
            correta: !!a.correta,
          })),
          dificuldade: q.dificuldade || null,
          fonte: q.fonte || null,
          ano: q.ano || null,
        },
      },
      { headers: { 'Cache-Control': 'private, max-age=300' } },
    )
  } catch (error) {
    console.error('[questao-do-dia] erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar a questão do dia' }, { status: 500 })
  }
}
