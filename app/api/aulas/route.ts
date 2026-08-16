import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem, AulaSetor, AulaTopic, AulaSubtopic, AulaModulo, AulaSubmodulo } from '@/lib/types'
import { avaliarAcessoAula, ocultarConteudoRestrito } from '@/lib/aulas/acesso'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { aplicarVinculo, resolverVinculosEmLote } from '@/lib/aulas/resolver-vinculo'
import { lerProgressoEmLote } from '@/lib/aulas/repositorio-progresso'

export const dynamic = 'force-dynamic'

/**
 * Árvore de aulas already filtrada pelo que esta pessoa pode ver.
 *
 * Duas correções de segurança moram aqui:
 *
 *  1. A rota devolvia todos os documentos completos — `videoEmbed` incluído —
 *     sem sessão. O cadeado ficava no navegador (`app/aulas/page.tsx`), então
 *     o embed de qualquer aula paga saía por esta rota.
 *  2. A resposta era `Cache-Control: public, s-maxage=300`. Agora que ela varia
 *     por usuário, um cache compartilhado entregaria a árvore de um assinante
 *     para um visitante. Passa a ser privada e sem armazenamento.
 *
 * Aula bloqueada continua na lista, mas sem conteúdo: é ela que desenha o
 * cadeado com o motivo e o botão certo (§17). Rascunho, aula encerrada e
 * agendada-com-ocultar somem de vez.
 */
export async function GET() {
  try {
    const db = await getDb()

    const setoresCollection = db.collection<AulaSetor>('aulas_setores')
    const topicosCollection = db.collection<AulaTopic>('aulas_topicos')
    const subtopicosCollection = db.collection<AulaSubtopic>('aulas_subtopicos')
    const modulosCollection = db.collection<AulaModulo>('aulas_modulos')
    const submodulosCollection = db.collection<AulaSubmodulo>('aulas_submodulos')
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    const session = await getSession()

    const [setores, topicos, subtopicos, modulos, submodulos, aulas, usuario] = await Promise.all([
      setoresCollection.find({}).sort({ ordem: 1 }).toArray(),
      topicosCollection.find({}).sort({ ordem: 1 }).toArray(),
      subtopicosCollection.find({}).sort({ ordem: 1 }).toArray(),
      modulosCollection.find({}).sort({ ordem: 1 }).toArray(),
      submodulosCollection.find({}).sort({ ordem: 1 }).toArray(),
      aulasCollection.find({}).sort({ criadoEm: -1 }).toArray(),
      montarContextoDoUsuario(db, session),
    ])

    // Vínculos com /materiais resolvidos em lote — uma consulta para a
    // listagem inteira, não uma por aula.
    const vinculos = await resolverVinculosEmLote(db, aulas as any)

    const agora = new Date()
    const aulasVisiveis: any[] = []
    for (const aula of aulas) {
      const resolvida = aplicarVinculo(aula as any, vinculos)
      const veredito = avaliarAcessoAula(resolvida, usuario, agora)
      if (veredito.invisivel) continue
      aulasVisiveis.push({
        ...ocultarConteudoRestrito(resolvida, veredito),
        acesso: {
          liberado: veredito.liberado,
          porAmostra: veredito.porAmostra,
          requisito: veredito.requisito,
        },
      })
    }

    // Progresso vem junto, em lote. Sem isso a biblioteca precisaria de uma
    // requisição por aula só para desenhar as barrinhas — dezenas de idas ao
    // servidor para montar uma tela.
    if (session?.userId && aulasVisiveis.length > 0) {
      const progresso = await lerProgressoEmLote(
        db,
        session.userId,
        aulasVisiveis.map((a) => String(a._id)),
      )
      for (const aula of aulasVisiveis) {
        const p = progresso.get(String(aula._id))
        aula.progresso = p
          ? { percentual: p.percentual, concluida: p.concluida, posicaoSegundos: p.posicaoSegundos }
          : null
      }
    }

    const headers = new Headers({
      // A resposta agora depende de quem pergunta — cache compartilhado aqui
      // seria vazamento entre contas.
      'Cache-Control': 'private, no-store',
      'Content-Type': 'application/json',
    })

    return NextResponse.json({
      setores,
      topicos,
      subtopicos,
      modulos,
      submodulos,
      aulas: aulasVisiveis
    }, { headers })
  } catch (error) {
    console.error('Erro ao buscar aulas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar aulas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin ou monitor
    const db = await getDb()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })

    const isAdmin = session.role === 'admin'
    const isMonitor = user?.secondaryRole === 'monitor'

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      titulo,
      descricao,
      tipo,
      visibilidade,
      setorId,
      topicoId,
      subtopicoId,
      moduloId,
      submoduloId,
      linkOuEmbed,
      videoEmbed,
      pdfs,
      dataLiberacao,
      ocultarAteLiberacao,
      capa,
      botoesAcesso
    } = body

    if (!titulo) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      )
    }

    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    const novaAula: AulaPostagem = {
      titulo,
      descricao,
      tipo,
      visibilidade,
      setorId,
      topicoId,
      subtopicoId,
      moduloId,
      submoduloId,
      linkOuEmbed,
      videoEmbed,
      pdfs: pdfs || [],
      dataLiberacao: dataLiberacao ? new Date(dataLiberacao) : new Date('2000-01-01'),
      capa,
      botoesAcesso: botoesAcesso || [],
      ordem: 0,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      ocultarAteLiberacao: !!ocultarAteLiberacao,
      oculta: false,
      comentarios: []
    }

    const result = await aulasCollection.insertOne(novaAula)

    return NextResponse.json({
      aula: {
        ...novaAula,
        _id: result.insertedId
      }
    })
  } catch (error) {
    console.error('Erro ao criar aula:', error)
    return NextResponse.json(
      { error: 'Erro ao criar aula' },
      { status: 500 }
    )
  }
}
