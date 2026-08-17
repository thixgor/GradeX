import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

/**
 * A árvore inteira do banco numa requisição só.
 *
 * A tela antiga montava a hierarquia com quatro chamadas encadeadas: pedia os
 * períodos, esperava a escolha, pedia os módulos daquele período, esperava,
 * pedia os tópicos… Cada nível só existia depois do clique no anterior, então
 * era impossível VER o catálogo — só navegá-lo às cegas, um select de cada vez.
 *
 * A árvore inteira é pequena (dezenas de módulos, centenas de tópicos): cabe
 * numa resposta e permite desenhar tudo aberto, com contagem, e filtrar sem ir
 * ao servidor a cada tecla.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    // Uma agregação por nível, com a contagem já somada pelo banco. Contar no
    // Node exigiria trazer as questões inteiras só para medir o tamanho delas.
    const contar = (colecao: string, campo: string) =>
      db
        .collection(colecao)
        .aggregate([
          {
            $lookup: {
              from: 'banco_questoes',
              localField: '_id',
              foreignField: campo,
              as: 'q',
            },
          },
          { $addFields: { totalQuestoes: { $size: '$q' } } },
          { $project: { q: 0 } },
        ])
        .toArray()

    const [modulos, topicos, subtopicos] = await Promise.all([
      contar('banco_modulos', 'moduloId'),
      contar('banco_topicos', 'topicoId'),
      contar('banco_subtopicos', 'subtopicoid'),
    ])

    const paraTexto = (v: unknown) => (v == null ? undefined : String(v))

    return NextResponse.json(
      {
        modulos: modulos.map((m: any) => ({
          _id: String(m._id),
          nome: m.nome,
          ordem: m.ordem ?? 0,
          totalQuestoes: m.totalQuestoes || 0,
        })),
        topicos: topicos.map((t: any) => ({
          _id: String(t._id),
          moduloId: paraTexto(t.moduloId) || '',
          nome: t.nome,
          ordem: t.ordem ?? 0,
          totalQuestoes: t.totalQuestoes || 0,
        })),
        subtopicos: subtopicos.map((s: any) => ({
          _id: String(s._id),
          topicoId: paraTexto(s.topicoId) || '',
          nome: s.nome,
          ordem: s.ordem ?? 0,
          totalQuestoes: s.totalQuestoes || 0,
        })),
      },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } },
    )
  } catch (error) {
    console.error('Erro ao montar hierarquia do banco:', error)
    return NextResponse.json({ error: 'Erro ao carregar a hierarquia' }, { status: 500 })
  }
}
