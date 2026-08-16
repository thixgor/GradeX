import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { secureApiEndpoint } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import { avaliarAcessoAula, ocultarConteudoRestrito } from '@/lib/aulas/acesso'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { aplicarVinculo, resolverVinculosEmLote } from '@/lib/aulas/resolver-vinculo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Histórico do aluno (§22).
 *
 * Sem coleção nova: o histórico JÁ existe em `aulas_progresso`, que guarda um
 * registro por (aluno, aula) com `atualizadoEm`. Criar uma segunda coleção de
 * "visualizações" duplicaria a mesma informação e abriria a possibilidade de as
 * duas discordarem — a aula apareceria no histórico com um percentual e na
 * biblioteca com outro.
 *
 * A diferença para "Continue estudando" (§35) é o recorte, não a fonte:
 * a retomada mostra só o que está em andamento, porque aula concluída não é
 * "continuar". O histórico mostra tudo, concluídas inclusive — é justamente
 * onde se procura aquela aula que já foi vista.
 *
 * Cada item passa pelo motor de acesso antes de sair. Ter assistido ontem não
 * garante acesso hoje: assinatura expira, turma muda, janela de aula temporária
 * fecha. Devolver o embed porque "já viu antes" seria uma porta dos fundos.
 */

const LIMITE_PADRAO = 40
const LIMITE_MAX = 100

export async function GET(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'READ',
    auth: { requireAuth: true },
  })
  if (!security.success || security.errorResponse) return security.errorResponse

  try {
    const db = await getDb()
    const sessao = security.session!
    const params = new URL(request.url).searchParams

    const limite = Math.min(
      LIMITE_MAX,
      Math.max(1, Number(params.get('limite')) || LIMITE_PADRAO),
    )
    // `favoritos=1` reaproveita esta rota para a estante de salvos (§21): as
    // duas telas mostram a mesma coisa — uma lista de aulas com progresso — e
    // só mudam de onde vem a lista de ids.
    const soFavoritos = params.get('favoritos') === '1'

    let progresso: any[] = []
    let ids: string[] = []

    if (soFavoritos) {
      const favoritos = await db
        .collection('aulas_favoritos')
        .find({ usuarioId: sessao.userId }, { projection: { aulaId: 1, criadoEm: 1 } })
        .sort({ criadoEm: -1 })
        .limit(limite)
        .toArray()
      ids = favoritos.map((f) => String(f.aulaId))
      progresso = await db
        .collection('aulas_progresso')
        .find({ usuarioId: sessao.userId, aulaId: { $in: ids } })
        .toArray()
    } else {
      progresso = await db
        .collection('aulas_progresso')
        .find({ usuarioId: sessao.userId })
        .sort({ atualizadoEm: -1 })
        .limit(limite)
        .toArray()
      ids = progresso.map((p) => String(p.aulaId))
    }

    if (ids.length === 0) return NextResponse.json({ itens: [] }, { headers: semCache() })

    const validos = ids.filter((id) => ObjectId.isValid(id))
    const [aulas, usuario] = await Promise.all([
      db
        .collection('aulas_postagens')
        .find({ _id: { $in: validos.map((id) => new ObjectId(id)) } as any })
        .toArray(),
      montarContextoDoUsuario(db, sessao),
    ])

    const vinculos = await resolverVinculosEmLote(db, aulas as any)
    const porId = new Map(aulas.map((a) => [String(a._id), a]))
    const progressoPorAula = new Map(progresso.map((p) => [String(p.aulaId), p]))
    const agora = new Date()

    // A ordem vem dos ids, não das aulas: é ela que carrega "mais recente
    // primeiro" (ou "favoritado por último primeiro"), e o `$in` do Mongo não
    // preserva ordem nenhuma.
    const itens: any[] = []
    for (const id of ids) {
      const aula = porId.get(id)
      // Aula apagada some do histórico em silêncio: mostrar um item que não
      // abre é pior do que não mostrar.
      if (!aula) continue

      const resolvida = aplicarVinculo(aula as any, vinculos)
      const veredito = avaliarAcessoAula(resolvida, usuario, agora)
      if (veredito.invisivel) continue

      const p = progressoPorAula.get(id)
      itens.push({
        ...ocultarConteudoRestrito(resolvida, veredito),
        _id: id,
        acesso: {
          liberado: veredito.liberado,
          porAmostra: veredito.porAmostra,
          requisito: veredito.requisito,
        },
        progresso: p
          ? {
              percentual: p.percentual,
              concluida: p.concluida === true,
              posicaoSegundos: p.posicaoSegundos,
            }
          : null,
        vistaEm: p?.atualizadoEm ?? null,
      })
    }

    return NextResponse.json({ itens }, { headers: semCache() })
  } catch (error) {
    console.error('[aulas/historico] erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar o histórico' }, { status: 500 })
  }
}

function semCache() {
  return { 'Cache-Control': 'private, no-store' }
}
