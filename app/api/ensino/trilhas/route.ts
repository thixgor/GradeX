import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { avaliarAcessoAula } from '@/lib/aulas/acesso'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import {
  garantirIndicesDeEnsino,
  lerNos,
  lerTrilhas,
  podeEditarEnsino,
  progressoDeTrilhas,
} from '@/lib/ensino/repositorio'
import { gerarSlug, slugUnico } from '@/lib/ensino/taxonomia'
import { normalizarEtapas, resumirTrilha, type TrilhaDeEnsino } from '@/lib/ensino/trilha'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * A vitrine de Trilhas (§1, §13).
 *
 * O QUE SAI DAQUI
 *
 * Cartões, não conteúdo: título, capa, nível, número de aulas, duração e o
 * progresso de quem pergunta. Nenhum vídeo, nenhum embed — a Trilha é uma
 * lista de referências, e o cadeado de cada aula é decidido quando ela é
 * aberta, pelo mesmo motor de sempre.
 *
 * Uma Trilha bloqueada continua aparecendo na vitrine, com o requisito: é assim
 * que ela vira convite ("Você possui acesso a esta Trilha" ou "Faz parte do
 * Combo X" — §25) em vez de sumir e deixar o aluno sem saber que existe.
 *
 * Rascunho só aparece para quem edita. Sem isso, montar uma Trilha ao longo de
 * uma semana significaria expor a montagem inacabada aos alunos.
 */
export async function GET(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    const parametros = new URL(request.url).searchParams

    const editor = await podeEditarEnsino(db, sessao as any)
    const querRascunhos = parametros.get('rascunhos') === '1' && editor

    const filtro: Record<string, any> = querRascunhos ? {} : { situacao: 'publicada' }
    // `no` é o nome usado pelo Catálogo de aulas; `topico` continua aceito
    // por compatibilidade com quem já monta o link com o nome antigo. Os dois
    // casam contra QUALQUER nível — a Trilha pode estar amarrada a uma Área
    // inteira ou a um Subtópico específico, e a busca não sabe qual de
    // antemão.
    const noId = parametros.get('no') || parametros.get('topico')
    if (noId) {
      filtro.$or = [{ areaId: noId }, { moduloId: noId }, { topicoId: noId }, { subtopicoId: noId }]
    }

    const trilhas = await lerTrilhas(db, filtro)
    const usuario = await montarContextoDoUsuario(db, sessao as any)

    // A localização só entra na resposta para quem administra — a vitrine
    // pública não precisa baixar a taxonomia inteira para desenhar um cartão.
    const nomeDoNo = querRascunhos
      ? new Map((await lerNos(db)).map((n) => [String(n._id), n.nome]))
      : null

    // Duração somada das aulas, quando o admin não deu estimativa. Uma consulta
    // para todas as Trilhas da vitrine, não uma por Trilha.
    const aulaIds = new Set<string>()
    for (const trilha of trilhas) {
      for (const etapa of trilha.etapas || []) {
        for (const item of etapa.itens || []) {
          if (item.tipo === 'aula' && item.refId) aulaIds.add(item.refId)
        }
      }
    }

    const { ObjectId } = await import('mongodb')
    const aulas = aulaIds.size
      ? await db
          .collection(COLECOES.aulas)
          .find(
            {
              _id: {
                $in: Array.from(aulaIds)
                  .filter(ObjectId.isValid)
                  .map((id) => new ObjectId(id)),
              } as any,
            },
            { projection: { ensino: 1, visibilidade: 1, regrasAcesso: 1, oculta: 1, dataLiberacao: 1 } },
          )
          .toArray()
      : []

    const duracaoPorAula = new Map<string, number>(
      aulas.map((a: any) => [String(a._id), Number(a.ensino?.duracaoSegundos) || 0]),
    )

    const progresso = await progressoDeTrilhas(db, trilhas, sessao?.userId)
    const agora = new Date()

    const itens = trilhas.map((trilha) => {
      const resumo = resumirTrilha(trilha, duracaoPorAula)
      // O acesso da Trilha usa o MESMO motor das aulas, com as regras dela.
      // Uma segunda implementação aqui divergiria da primeira no primeiro
      // ajuste, e o cadeado da vitrine deixaria de bater com o da aula.
      const veredito = avaliarAcessoAula(
        {
          visibilidade: 'gratuita',
          regrasAcesso: trilha.regrasAcesso || null,
          oculta: false,
          dataLiberacao: new Date('2000-01-01'),
        } as any,
        usuario,
        agora,
      )

      return {
        _id: String(trilha._id),
        slug: trilha.slug,
        titulo: trilha.titulo,
        subtitulo: trilha.subtitulo,
        descricao: trilha.descricao,
        capa: trilha.capa || null,
        nivel: trilha.nivel,
        publico: trilha.publico,
        tags: trilha.tags || [],
        destaque: trilha.destaque === true,
        situacao: trilha.situacao,
        certificado: trilha.certificado?.ativo === true,
        criadoEm: trilha.criadoEm,
        publicadaEm: trilha.publicadaEm || null,
        ...resumo,
        ...(nomeDoNo
          ? {
              areaId: trilha.areaId || null,
              moduloId: trilha.moduloId || null,
              topicoId: trilha.topicoId || null,
              subtopicoId: trilha.subtopicoId || null,
              localizacao: [trilha.areaId, trilha.moduloId, trilha.topicoId, trilha.subtopicoId]
                .filter(Boolean)
                .map((id) => nomeDoNo.get(String(id)))
                .filter(Boolean)
                .join(' · '),
            }
          : {}),
        progresso: progresso.get(String(trilha._id)) || null,
        acesso: { liberado: veredito.liberado, requisito: veredito.requisito },
      }
    })

    return NextResponse.json(
      { trilhas: itens },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('[ensino/trilhas] GET:', erro)
    return NextResponse.json({ error: 'Erro ao carregar Trilhas' }, { status: 500 })
  }
}

/**
 * Cria uma Trilha.
 *
 * Nasce como RASCUNHO, sempre, e com o mínimo: um título. A montagem é
 * incremental por decisão de produto (§30) — obrigar o admin a preencher
 * objetivo, público e capa antes de poder arrastar a primeira aula seria pedir
 * decisões que só ficam claras depois de ver o caminho montado.
 */
export async function POST(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const corpo = await request.json().catch(() => ({}))
    const titulo = String(corpo?.titulo || '').trim().slice(0, 180) || 'Nova Trilha'

    const usados = await db
      .collection(COLECOES.trilhas)
      .find({}, { projection: { slug: 1 } })
      .toArray()

    const documento: Omit<TrilhaDeEnsino, '_id'> = {
      slug: slugUnico(gerarSlug(titulo), usados.map((u: any) => u.slug)),
      titulo,
      etapas: normalizarEtapas(corpo?.etapas),
      situacao: 'rascunho',
      ordem: 0,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      publicadaEm: null,
    }

    const resultado = await db.collection(COLECOES.trilhas).insertOne(documento as any)
    await garantirIndicesDeEnsino(db)

    return NextResponse.json({ trilha: { ...documento, _id: String(resultado.insertedId) } })
  } catch (erro) {
    console.error('[ensino/trilhas] POST:', erro)
    return NextResponse.json({ error: 'Erro ao criar a Trilha' }, { status: 500 })
  }
}
