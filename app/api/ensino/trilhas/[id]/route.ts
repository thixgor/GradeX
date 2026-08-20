import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { avaliarAcessoAula } from '@/lib/aulas/acesso'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { normalizarRegras } from '@/lib/aulas/regras-edicao'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import {
  lerNos,
  lerTrilhaPorSlug,
  montarCartoes,
  podeEditarEnsino,
} from '@/lib/ensino/repositorio'
import { gerarSlug, slugUnico } from '@/lib/ensino/taxonomia'
import {
  calcularProgressoDaTrilha,
  normalizarEtapas,
  resumirTrilha,
  validarPublicacao,
  type ItemDaEtapa,
} from '@/lib/ensino/trilha'
import { lerProgressoEmLote } from '@/lib/aulas/repositorio-progresso'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * A página de uma Trilha (§8).
 *
 * COMO A REFERÊNCIA VIRA CONTEÚDO
 *
 * A Trilha guarda `{ tipo, refId }`. É aqui que esses ids viram títulos,
 * durações, cadeados e progresso — uma consulta para TODAS as aulas do
 * caminho, e o mesmo `montarCartoes` que a home e a busca usam. Resolver isso
 * na tela exigiria uma requisição por item e faria a página piscar item a item;
 * resolver aqui com um caminho próprio faria a Trilha ter um cadeado diferente
 * do resto da plataforma.
 *
 * Aula referenciada que não existe mais simplesmente não aparece. Ela não é
 * removida do documento: a Trilha pode estar apontando para uma aula que o
 * admin despublicou por uma semana, e apagar a referência transformaria uma
 * ausência temporária em perda permanente da montagem.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    const trilha = await lerTrilhaPorSlug(db, params.id)

    if (!trilha) return NextResponse.json({ error: 'Trilha não encontrada' }, { status: 404 })

    const editor = await podeEditarEnsino(db, sessao as any)
    if (trilha.situacao !== 'publicada' && !editor) {
      return NextResponse.json({ error: 'Trilha não encontrada' }, { status: 404 })
    }

    const usuario = await montarContextoDoUsuario(db, sessao as any)

    const aulaIds = new Set<string>()
    for (const etapa of trilha.etapas || []) {
      for (const item of etapa.itens || []) {
        if (item.tipo === 'aula' && ObjectId.isValid(item.refId)) aulaIds.add(item.refId)
      }
    }

    const documentos = aulaIds.size
      ? await db
          .collection(COLECOES.aulas)
          .find({ _id: { $in: Array.from(aulaIds).map((id) => new ObjectId(id)) } as any })
          .toArray()
      : []

    const nos = await lerNos(db)
    const cartoes = await montarCartoes(db, documentos as any, usuario, {
      usuarioId: sessao?.userId,
      nos,
      trilhaSlug: trilha.slug,
    })
    const porId = new Map(cartoes.map((c) => [c._id, c]))

    const etapas = (trilha.etapas || []).map((etapa) => ({
      id: etapa.id,
      titulo: etapa.titulo,
      descricao: etapa.descricao,
      itens: (etapa.itens || [])
        .map((item: ItemDaEtapa) => {
          if (item.tipo === 'aula') {
            const cartao = porId.get(item.refId)
            if (!cartao) return null
            return { ...item, aula: cartao }
          }
          // Complementares ainda não têm cartão resolvido; a tela desenha o
          // rótulo e o link. A forma já é a definitiva, então ligar material e
          // deck depois não muda esta resposta.
          return { ...item, aula: null }
        })
        .filter(Boolean),
    }))

    const progressoPorAula = sessao?.userId
      ? await lerProgressoEmLote(db, sessao.userId, Array.from(aulaIds))
      : new Map()

    const progresso = calcularProgressoDaTrilha(trilha, progressoPorAula as any)
    const duracaoPorAula = new Map(
      cartoes.map((c) => [c._id, Number(c.duracaoSegundos) || 0]),
    )

    const veredito = avaliarAcessoAula(
      {
        visibilidade: 'gratuita',
        regrasAcesso: trilha.regrasAcesso || null,
        oculta: false,
        dataLiberacao: new Date('2000-01-01'),
      } as any,
      usuario,
    )

    const estado = sessao?.userId
      ? await db
          .collection(COLECOES.trilhaEstado)
          .findOne({ usuarioId: sessao.userId, trilhaId: String(trilha._id) })
      : null

    return NextResponse.json(
      {
        trilha: {
          ...trilha,
          _id: String(trilha._id),
          etapas,
          // `resumo` é objeto, e não campos soltos, porque aqui `etapas` já é
          // a lista de etapas resolvida — dois significados para o mesmo nome
          // na mesma resposta seria erro garantido na tela.
          resumo: resumirTrilha(trilha, duracaoPorAula),
        },
        progresso,
        estado: estado ? { iniciadaEm: estado.iniciadaEm, concluidaEm: estado.concluidaEm } : null,
        acesso: { liberado: veredito.liberado, requisito: veredito.requisito },
        podeEditar: editor,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('[ensino/trilhas/id] GET:', erro)
    return NextResponse.json({ error: 'Erro ao carregar a Trilha' }, { status: 500 })
  }
}

/**
 * Salva a Trilha.
 *
 * Recebe o documento inteiro (é o que o construtor visual produz depois de
 * arrastar e soltar) e normaliza tudo aqui: um PATCH por campo tornaria
 * impossível salvar uma reordenação, que é uma mudança de estrutura e não de
 * campo.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const trilha = await lerTrilhaPorSlug(db, params.id)
    if (!trilha) return NextResponse.json({ error: 'Trilha não encontrada' }, { status: 404 })

    const corpo = await request.json()
    const mudanca: Record<string, any> = { atualizadoEm: new Date() }

    const texto = (valor: unknown, max: number) => String(valor ?? '').trim().slice(0, max)

    if ('titulo' in corpo && texto(corpo.titulo, 180)) mudanca.titulo = texto(corpo.titulo, 180)
    if ('subtitulo' in corpo) mudanca.subtitulo = texto(corpo.subtitulo, 200) || null
    if ('descricao' in corpo) mudanca.descricao = texto(corpo.descricao, 4000) || null
    if ('objetivo' in corpo) mudanca.objetivo = texto(corpo.objetivo, 1000) || null
    if ('publico' in corpo) mudanca.publico = texto(corpo.publico, 160) || null
    if ('nivel' in corpo) mudanca.nivel = corpo.nivel || null
    if ('capa' in corpo) mudanca.capa = corpo.capa || null
    if ('destaque' in corpo) mudanca.destaque = corpo.destaque === true
    if (Number.isFinite(Number(corpo.ordem))) mudanca.ordem = Number(corpo.ordem)
    if (Number.isFinite(Number(corpo.duracaoEstimadaMin))) {
      mudanca.duracaoEstimadaMin = Math.max(0, Math.round(Number(corpo.duracaoEstimadaMin)))
    }
    if ('aprendizados' in corpo) {
      mudanca.aprendizados = (Array.isArray(corpo.aprendizados) ? corpo.aprendizados : [])
        .map((a: unknown) => texto(a, 240))
        .filter(Boolean)
        .slice(0, 20)
    }
    if ('tags' in corpo) {
      mudanca.tags = (Array.isArray(corpo.tags) ? corpo.tags : [])
        .map((t: unknown) => texto(t, 48))
        .filter(Boolean)
        .slice(0, 24)
    }
    for (const campo of ['areaId', 'moduloId', 'topicoId'] as const) {
      if (campo in corpo) {
        mudanca[campo] = ObjectId.isValid(String(corpo[campo])) ? String(corpo[campo]) : null
      }
    }
    if ('etapas' in corpo) mudanca.etapas = normalizarEtapas(corpo.etapas)
    if ('regrasAcesso' in corpo) mudanca.regrasAcesso = normalizarRegras(corpo.regrasAcesso)
    if ('certificado' in corpo) {
      mudanca.certificado = corpo.certificado?.ativo
        ? {
            ativo: true,
            cargaHoraria: Math.max(0, Math.round(Number(corpo.certificado.cargaHoraria) || 0)),
          }
        : // Certificado nunca é obrigatório (§28): a ausência é o padrão, e
          // desligar é `null` e não um objeto com `ativo: false`.
          null
    }

    if (typeof corpo.slug === 'string' && corpo.slug.trim()) {
      const usados = await db
        .collection(COLECOES.trilhas)
        .find({ _id: { $ne: new ObjectId(String(trilha._id)) } }, { projection: { slug: 1 } })
        .toArray()
      mudanca.slug = slugUnico(gerarSlug(corpo.slug), usados.map((u: any) => u.slug))
    }

    // Publicar é a única transição com validação: rascunho aceita qualquer
    // estado intermediário, publicado precisa ter o que o aluno vai abrir.
    if ('situacao' in corpo) {
      const alvo = corpo.situacao
      if (alvo === 'publicada') {
        const candidata = { ...trilha, ...mudanca }
        const problemas = validarPublicacao(candidata as any)
        if (problemas.length > 0) {
          return NextResponse.json({ error: problemas[0].mensagem, problemas }, { status: 400 })
        }
        mudanca.situacao = 'publicada'
        mudanca.publicadaEm = trilha.publicadaEm || new Date()
      } else if (alvo === 'rascunho' || alvo === 'arquivada') {
        mudanca.situacao = alvo
      }
    }

    await db
      .collection(COLECOES.trilhas)
      .updateOne({ _id: new ObjectId(String(trilha._id)) }, { $set: mudanca })

    return NextResponse.json({ ok: true, trilha: { ...trilha, ...mudanca } })
  } catch (erro) {
    console.error('[ensino/trilhas/id] PATCH:', erro)
    return NextResponse.json({ error: 'Erro ao salvar a Trilha' }, { status: 500 })
  }
}

/**
 * Apaga a Trilha — e SÓ a Trilha.
 *
 * As aulas continuam existindo, em todas as outras Trilhas e na navegação. É
 * a consequência direta de a Trilha ser um caminho e não um pacote: desmontar
 * o caminho não destrói o terreno (§1).
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const trilha = await lerTrilhaPorSlug(db, params.id)
    if (!trilha) return NextResponse.json({ error: 'Trilha não encontrada' }, { status: 404 })

    await db.collection(COLECOES.trilhas).deleteOne({ _id: new ObjectId(String(trilha._id)) })
    await db.collection(COLECOES.trilhaEstado).deleteMany({ trilhaId: String(trilha._id) })

    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error('[ensino/trilhas/id] DELETE:', erro)
    return NextResponse.json({ error: 'Erro ao excluir a Trilha' }, { status: 500 })
  }
}

/**
 * Marca a Trilha como iniciada / concluída pelo aluno.
 *
 * O progresso continua sendo derivado das aulas — este registro guarda só o que
 * NÃO dá para derivar: quando a pessoa entrou na Trilha (para "Continue
 * estudando" saber qual caminho ela escolheu, e não só qual aula abriu) e
 * quando ela concluiu (para a tela de conclusão e o certificado aparecerem uma
 * vez, e não a cada visita).
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!sessao?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const trilha = await lerTrilhaPorSlug(db, params.id)
    if (!trilha) return NextResponse.json({ error: 'Trilha não encontrada' }, { status: 404 })

    const corpo = await request.json().catch(() => ({}))
    const agora = new Date()

    const mudanca: Record<string, any> = { atualizadoEm: agora }
    if (corpo?.acao === 'concluir') mudanca.concluidaEm = agora
    if (corpo?.aulaId && ObjectId.isValid(String(corpo.aulaId))) {
      mudanca.ultimaAulaId = String(corpo.aulaId)
    }

    await db.collection(COLECOES.trilhaEstado).updateOne(
      { usuarioId: sessao.userId, trilhaId: String(trilha._id) },
      {
        $set: mudanca,
        $setOnInsert: {
          usuarioId: sessao.userId,
          trilhaId: String(trilha._id),
          trilhaSlug: trilha.slug,
          iniciadaEm: agora,
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error('[ensino/trilhas/id] POST:', erro)
    return NextResponse.json({ error: 'Erro ao registrar' }, { status: 500 })
  }
}
