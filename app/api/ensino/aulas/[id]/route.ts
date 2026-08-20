import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { avaliarAcessoAula, ocultarConteudoRestrito } from '@/lib/aulas/acesso'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { aplicarVinculo, resolverVinculosEmLote } from '@/lib/aulas/resolver-vinculo'
import { lerProgressoEmLote } from '@/lib/aulas/repositorio-progresso'
import { FLASHCARD_MANUAL_COLLECTIONS } from '@/lib/flashcard-manual'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import { duracaoLegivel, recursosDaAula } from '@/lib/ensino/aula'
import { lerNos, lerTrilhaPorSlug, lerTrilhas, montarCartoes } from '@/lib/ensino/repositorio'
import { caminhoAte } from '@/lib/ensino/taxonomia'
import { calcularProgressoDaTrilha, posicaoNaTrilha } from '@/lib/ensino/trilha'
import { reforcoAposConcluir } from '@/lib/ensino/revisao'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Tudo que a tela de assistir precisa, numa requisição (§9, §10, §19, §20).
 *
 * POR QUE UMA ROTA NOVA, E NÃO UM CAMPO A MAIS NA ANTIGA
 *
 * `/api/aulas/[id]` continua existindo e respondendo exatamente como respondia
 * — o editor administrativo antigo e a página de curso legada dependem dela
 * (§36). O que a experiência nova pede é diferente em ESCOPO, não em detalhe:
 * a localização na taxonomia, a Aula Resumo vinculada, os decks de flashcards,
 * os pré-requisitos resolvidos, as Trilhas que contêm esta aula e, quando há
 * contexto de Trilha, a posição no caminho com a anterior e a próxima.
 *
 * Espalhar isso em seis requisições faria a tela montar em cascata — o vídeo
 * aparecendo antes de saber se existe uma próxima aula, e o botão "Próxima"
 * surgindo depois. Numa tela cujo propósito é sumir para o conteúdo aparecer,
 * isso é o oposto do que se quer.
 *
 * O CADEADO É O MESMO DE SEMPRE
 *
 * Nenhuma regra de acesso é reimplementada aqui: `avaliarAcessoAula` decide, e
 * `ocultarConteudoRestrito` limpa o documento antes de ele entrar na resposta.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const sessao = await getSession()
    const p = new URL(request.url).searchParams

    const documento: any = await db
      .collection(COLECOES.aulas)
      .findOne({ _id: new ObjectId(params.id) })

    if (!documento) return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })

    const usuario = await montarContextoDoUsuario(db, sessao as any)
    const vinculos = await resolverVinculosEmLote(db, [documento])
    const resolvida = aplicarVinculo(documento, vinculos)
    const veredito = avaliarAcessoAula(resolvida as any, usuario)

    if (veredito.invisivel && veredito.requisito?.motivo !== 'agendada') {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
    }

    const ensino = documento.ensino || {}
    const nos = await lerNos(db)

    /* ── Recursos vinculados ─────────────────────────────────────────── */

    const idsRelacionados: string[] = [
      ...(Array.isArray(ensino.prerequisitos) ? ensino.prerequisitos : []),
      ...(Array.isArray(documento.relacionadas) ? documento.relacionadas : []),
      ...(ensino.resumoId ? [String(ensino.resumoId)] : []),
      ...(ensino.aulaPrincipalId ? [String(ensino.aulaPrincipalId)] : []),
    ].filter((id) => ObjectId.isValid(id))

    const [vizinhas, decks, professores, todasAsTrilhas, progressos] = await Promise.all([
      idsRelacionados.length
        ? db
            .collection(COLECOES.aulas)
            .find({ _id: { $in: idsRelacionados.map((id) => new ObjectId(id)) } as any })
            .toArray()
        : Promise.resolve([]),
      Array.isArray(ensino.flashcardDeckIds) && ensino.flashcardDeckIds.length > 0
        ? db
            .collection(FLASHCARD_MANUAL_COLLECTIONS.decks)
            .find({
              _id: {
                $in: ensino.flashcardDeckIds
                  .filter((id: string) => ObjectId.isValid(id))
                  .map((id: string) => new ObjectId(id)),
              } as any,
            })
            .toArray()
        : Promise.resolve([]),
      Array.isArray(ensino.professorIds) && ensino.professorIds.length > 0
        ? db
            .collection(COLECOES.professores)
            .find({
              _id: {
                $in: ensino.professorIds
                  .filter((id: string) => ObjectId.isValid(id))
                  .map((id: string) => new ObjectId(id)),
              } as any,
            })
            .toArray()
        : Promise.resolve([]),
      lerTrilhas(db, { situacao: 'publicada' }),
      sessao?.userId
        ? lerProgressoEmLote(db, sessao.userId, [params.id])
        : Promise.resolve(new Map()),
    ])

    const cartoesVizinhos = await montarCartoes(db, vizinhas as any, usuario, {
      usuarioId: sessao?.userId,
      nos,
    })
    const porId = new Map(cartoesVizinhos.map((c) => [c._id, c]))

    const recursos = recursosDaAula(documento, { logado: Boolean(sessao?.userId) })
    const progresso = progressos.get(params.id) || null

    /* ── Contexto de Trilha ──────────────────────────────────────────── */

    /*
     * Em quais Trilhas esta aula aparece (§4, §5).
     *
     * A resposta certa é "em quantas ela quiser": a mesma aula é peça de vários
     * caminhos, e mostrar isso na tela é o que faz o aluno descobrir que existe
     * uma Trilha inteira sobre o assunto que ele abriu por acaso.
     */
    const trilhasQueContem = todasAsTrilhas
      .filter((t) =>
        (t.etapas || []).some((e) =>
          (e.itens || []).some((i) => i.tipo === 'aula' && i.refId === params.id),
        ),
      )
      .map((t) => ({ slug: t.slug, titulo: t.titulo, subtitulo: t.subtitulo }))

    const slugPedido = p.get('trilha')
    let contextoDaTrilha: any = null

    if (slugPedido) {
      const trilha = await lerTrilhaPorSlug(db, slugPedido)
      if (trilha && trilha.situacao === 'publicada') {
        const posicao = posicaoNaTrilha(trilha, params.id)
        if (posicao) {
          const aulaIds = new Set<string>()
          for (const etapa of trilha.etapas || []) {
            for (const item of etapa.itens || []) {
              if (item.tipo === 'aula' && ObjectId.isValid(item.refId)) aulaIds.add(item.refId)
            }
          }

          const [documentosDaTrilha, progressoDaTrilha] = await Promise.all([
            db
              .collection(COLECOES.aulas)
              .find({ _id: { $in: Array.from(aulaIds).map((id) => new ObjectId(id)) } as any })
              .toArray(),
            sessao?.userId
              ? lerProgressoEmLote(db, sessao.userId, Array.from(aulaIds))
              : Promise.resolve(new Map()),
          ])

          const cartoes = await montarCartoes(db, documentosDaTrilha as any, usuario, {
            usuarioId: sessao?.userId,
            nos,
            trilhaSlug: trilha.slug,
          })
          const cartaoPorId = new Map(cartoes.map((c) => [c._id, c]))

          const etapaAtual = (trilha.etapas || []).find((e) => e.id === posicao.etapaId)

          contextoDaTrilha = {
            slug: trilha.slug,
            titulo: trilha.titulo,
            etapa: {
              titulo: posicao.etapaTitulo,
              indice: posicao.etapaIndice + 1,
              total: posicao.totalDeEtapas,
              // O conteúdo da etapa atual, e não da Trilha inteira: é o
              // recorte que cabe numa lateral e o que responde "onde estou".
              itens: (etapaAtual?.itens || [])
                .filter((i) => i.tipo === 'aula')
                .map((i) => cartaoPorId.get(i.refId))
                .filter(Boolean),
            },
            anterior: posicao.anterior?.tipo === 'aula'
              ? cartaoPorId.get(posicao.anterior.refId) || null
              : null,
            proxima: posicao.proxima?.tipo === 'aula'
              ? cartaoPorId.get(posicao.proxima.refId) || null
              : null,
            progresso: calcularProgressoDaTrilha(trilha, progressoDaTrilha as any),
          }
        }
      }
    }

    return NextResponse.json(
      {
        aula: {
          ...ocultarConteudoRestrito(resolvida, veredito),
          _id: String(documento._id),
          duracaoLabel: duracaoLegivel(ensino.duracaoSegundos),
        },
        acesso: {
          liberado: veredito.liberado,
          porAmostra: veredito.porAmostra,
          requisito: veredito.requisito,
        },
        progresso: progresso
          ? {
              percentual: progresso.percentual,
              concluida: progresso.concluida,
              posicaoSegundos: progresso.posicaoSegundos,
            }
          : null,
        caminho: (() => {
          const folha = ensino.subtopicoId || ensino.topicoId || ensino.moduloId || ensino.areaId
          return folha
            ? caminhoAte(nos, String(folha)).map((n) => ({
                _id: n._id,
                nome: n.nome,
                nivel: n.nivel,
              }))
            : []
        })(),
        recursos: {
          ...recursos,
          resumo: ensino.resumoId ? porId.get(String(ensino.resumoId)) || null : null,
          // Um resumo aberto direto precisa saber voltar para a aula completa —
          // é a única forma de a versão condensada não virar um beco sem saída.
          aulaPrincipal: ensino.aulaPrincipalId
            ? porId.get(String(ensino.aulaPrincipalId)) || null
            : null,
          pdfs: veredito.liberado ? documento.pdfs || [] : [],
          flashcards: decks.map((d: any) => ({
            _id: String(d._id),
            titulo: d.title,
            cards: d.cardCount || 0,
            href: `/flashcards/d/${d.slug}`,
          })),
        },
        prerequisitos: (Array.isArray(ensino.prerequisitos) ? ensino.prerequisitos : [])
          .map((id: string) => porId.get(String(id)))
          .filter(Boolean),
        relacionadas: (Array.isArray(documento.relacionadas) ? documento.relacionadas : [])
          .map((id: string) => porId.get(String(id)))
          .filter(Boolean),
        professores: professores.map((prof: any) => ({
          _id: String(prof._id),
          nome: prof.nome,
          foto: prof.foto || null,
          titulacao: prof.titulacao || null,
        })),
        trilha: contextoDaTrilha,
        trilhasQueContem,
        reforco: reforcoAposConcluir({
          aulaId: params.id,
          temResumo: recursos.resumo,
          temPdf: recursos.pdf,
          temFlashcards: recursos.flashcards,
          resumoId: ensino.resumoId || null,
        }),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('[ensino/aulas/id] GET:', erro)
    return NextResponse.json({ error: 'Erro ao carregar a aula' }, { status: 500 })
  }
}

/**
 * Salva o bloco `ensino` da aula.
 *
 * Fica separado do PATCH antigo (`/api/aulas/[id]`) porque ele guarda uma regra
 * que aquele não tem: o vínculo com a Aula Resumo é de MÃO DUPLA. Gravar só a
 * ponta de cá deixaria o resumo sem saber de quem ele é — e a tela dele sem o
 * caminho de volta para a aula completa.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const sessao = await getSession()
    const { podeEditarEnsino } = await import('@/lib/ensino/repositorio')
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { normalizarBlocoDeEnsino } = await import('@/lib/ensino/aula')
    const corpo = await request.json()
    const bloco = normalizarBlocoDeEnsino(corpo?.ensino ?? corpo, { aulaId: params.id })

    const anterior: any = await db
      .collection(COLECOES.aulas)
      .findOne({ _id: new ObjectId(params.id) }, { projection: { ensino: 1 } })

    await db
      .collection(COLECOES.aulas)
      .updateOne({ _id: new ObjectId(params.id) }, { $set: { ensino: bloco, atualizadoEm: new Date() } })

    /* --- A outra ponta do vínculo com o resumo --------------------------- */

    const resumoAntigo = anterior?.ensino?.resumoId
    if (resumoAntigo && resumoAntigo !== bloco.resumoId && ObjectId.isValid(resumoAntigo)) {
      // O resumo desvinculado NÃO é apagado: ele é uma aula, com progresso e
      // anotações de gente que já o assistiu. Ele só deixa de ser resumo DESTA
      // aula e volta a ser uma aula comum.
      await db.collection(COLECOES.aulas).updateOne(
        { _id: new ObjectId(resumoAntigo) },
        { $set: { 'ensino.tipo': 'aula', 'ensino.aulaPrincipalId': null } },
      )
    }

    if (bloco.resumoId && ObjectId.isValid(bloco.resumoId)) {
      await db.collection(COLECOES.aulas).updateOne(
        { _id: new ObjectId(bloco.resumoId) },
        { $set: { 'ensino.tipo': 'resumo', 'ensino.aulaPrincipalId': params.id } },
      )
    }

    return NextResponse.json({ ok: true, ensino: bloco })
  } catch (erro) {
    console.error('[ensino/aulas/id] PATCH:', erro)
    return NextResponse.json({ error: 'Erro ao salvar a organização da aula' }, { status: 500 })
  }
}
