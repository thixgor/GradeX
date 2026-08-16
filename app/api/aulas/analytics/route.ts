import { NextRequest, NextResponse } from 'next/server'
import { secureApiEndpoint } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import {
  agruparPorCurso,
  levantarAlertas,
  numerosDaAula,
  resumirGeral,
  type AulaParaAnalytics,
  type BrutoDoProgresso,
  type NumerosDaAula,
} from '@/lib/aulas/analytics'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Números das aulas (§26, §27).
 *
 * Uma requisição devolve a tela inteira — resumo, cursos, alertas e a tabela por
 * aula. Fatiar isso em quatro rotas faria a página abrir em quatro tempos, com
 * quatro varreduras da mesma coleção de progresso; e como os quatro blocos
 * vêm do mesmo par de consultas, separá-los só multiplicaria o custo.
 *
 * A agregação roda no Mongo, não em Node: `aulas_progresso` tem um registro por
 * (aluno, aula) e cresce com o produto dos dois. Trazer tudo para somar aqui
 * seria carregar a plataforma inteira na memória do servidor a cada abertura do
 * painel.
 */

/** Teto de aulas por resposta. Acima disso a tabela deixa de ser lida. */
const MAX_AULAS = 1000

export async function GET(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'READ',
    auth: {
      requireAuth: true,
      allowedRoles: ['admin'],
      allowSecondaryRoles: ['monitor'],
    },
  })
  if (!security.success || security.errorResponse) return security.errorResponse

  try {
    const db = await getDb()
    const curso = new URL(request.url).searchParams.get('curso')

    const filtro = curso ? { setorId: curso } : {}

    const [aulas, setores] = await Promise.all([
      db
        .collection('aulas_postagens')
        .find(filtro, {
          projection: {
            titulo: 1,
            setorId: 1,
            moduloId: 1,
            oculta: 1,
            dataLiberacao: 1,
            videoEmbed: 1,
            linkOuEmbed: 1,
            vinculoMaterial: 1,
            // Só o tamanho interessa, mas o Mongo não projeta comprimento de
            // array sem `$expr`; o array vem e é medido aqui.
            usuariosConcluidos: 1,
          },
        })
        .limit(MAX_AULAS)
        .toArray(),
      db.collection('aulas_setores').find({}, { projection: { nome: 1 } }).toArray(),
    ])

    const ids = aulas.map((a) => String(a._id))

    /*
     * Uma passada agregando o progresso.
     *
     * O `$match` por `aulaId` mantém o custo proporcional ao que a tela mostra
     * quando o painel está filtrado por curso — sem ele, filtrar um curso
     * varreria a coleção inteira do mesmo jeito.
     */
    const brutos = ids.length
      ? await db
          .collection('aulas_progresso')
          .aggregate<BrutoDoProgresso & { _id: string }>(
            [
              { $match: { aulaId: { $in: ids } } },
              {
                $group: {
                  _id: '$aulaId',
                  iniciaramNovo: { $sum: { $cond: [{ $gt: ['$percentual', 0] }, 1, 0] } },
                  concluiramNovo: { $sum: { $cond: [{ $eq: ['$concluida', true] }, 1, 0] } },
                  somaPercentual: { $sum: { $ifNull: ['$percentual', 0] } },
                  registros: { $sum: 1 },
                  // Parada média só entre quem começou e NÃO terminou: incluir
                  // quem concluiu puxaria a média para o fim do vídeo e
                  // esconderia exatamente o ponto de desistência.
                  paradaSoma: {
                    $sum: {
                      $cond: [
                        { $and: [{ $ne: ['$concluida', true] }, { $gt: ['$percentual', 0] }] },
                        { $ifNull: ['$posicaoSegundos', 0] },
                        0,
                      ],
                    },
                  },
                  paradaN: {
                    $sum: {
                      $cond: [
                        { $and: [{ $ne: ['$concluida', true] }, { $gt: ['$percentual', 0] }] },
                        1,
                        0,
                      ],
                    },
                  },
                  ultimaAtividade: { $max: '$atualizadoEm' },
                },
              },
            ],
            { allowDiskUse: true },
          )
          .toArray()
      : []

    const porAula = new Map<string, BrutoDoProgresso>()
    for (const b of brutos) porAula.set(String(b._id), { ...b, aulaId: String(b._id) })

    const lista = aulas as unknown as AulaParaAnalytics[]
    const numeros: NumerosDaAula[] = lista.map((a) =>
      numerosDaAula(a, porAula.get(String(a._id))),
    )
    const indice = new Map(numeros.map((n) => [n.aulaId, n]))

    const nomeDoCurso = new Map(setores.map((s) => [String(s._id), String(s.nome || '')]))

    return NextResponse.json(
      {
        resumo: resumirGeral(lista, indice),
        cursos: agruparPorCurso(numeros, nomeDoCurso),
        alertas: levantarAlertas(numeros),
        aulas: numeros
          .slice()
          .sort((a, b) => b.iniciaram - a.iniciaram || a.titulo.localeCompare(b.titulo, 'pt-BR')),
        truncado: aulas.length >= MAX_AULAS,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[aulas/analytics] erro:', error)
    return NextResponse.json({ error: 'Erro ao calcular os números' }, { status: 500 })
  }
}
