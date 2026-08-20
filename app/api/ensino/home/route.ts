import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { lerEmAndamento } from '@/lib/aulas/repositorio-progresso'
import { formatarTempo, podeRetomar } from '@/lib/aulas/progresso'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import {
  contarAulasPorNo,
  lerNos,
  lerTrilhas,
  montarCartoes,
  progressoDeTrilhas,
} from '@/lib/ensino/repositorio'
import { montarArvore, podarVazios } from '@/lib/ensino/taxonomia'
import { resumirTrilha } from '@/lib/ensino/trilha'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Quantos itens cada faixa da home leva. Poucos e bons — a home não é acervo. */
const POR_FAIXA = 8

/**
 * A home da Área de Ensino (§12, §13).
 *
 * A TELA RESPONDE PERGUNTAS, NÃO LISTA TABELAS
 *
 * A home antiga abria com "todas as aulas". Esta abre com o que a pessoa
 * precisa decidir, na ordem em que ela decide:
 *
 *   1. "onde eu parei?"        → continuar (aula + a Trilha em que ela estava)
 *   2. "o que eu quero aprender?" → Trilhas em andamento, recomendadas, novas
 *   3. "onde fica tal assunto?" → navegação por Módulo → Tópico
 *   4. "e o que eu já vi?"      → revisão e aulas recentes
 *
 * Tudo numa requisição só. Seis faixas com seis requisições fariam a home
 * montar em cascata, com o conteúdo pulando na tela enquanto cada uma chega —
 * e a primeira faixa, que é a mais importante, esperaria a rede inteira.
 *
 * A CONTINUIDADE SABE DA TRILHA (§12)
 *
 * O "Continue estudando" da área antiga só sabia da aula. Aqui, quando a aula
 * pertence a uma Trilha que a pessoa começou, a faixa mostra a Trilha, a etapa
 * e o percentual — que é a informação que faz o aluno voltar, e não só o nome
 * de um vídeo solto.
 */
export async function GET() {
  try {
    const db = await getDb()
    const sessao = await getSession()
    const usuario = await montarContextoDoUsuario(db, sessao as any)
    const usuarioId = sessao?.userId || null

    const [nos, trilhas, emAndamento, estadosDeTrilha] = await Promise.all([
      lerNos(db),
      lerTrilhas(db, { situacao: 'publicada' }),
      usuarioId ? lerEmAndamento(db, usuarioId, 12) : Promise.resolve([]),
      usuarioId
        ? db
            .collection(COLECOES.trilhaEstado)
            .find({ usuarioId })
            .sort({ atualizadoEm: -1 })
            .limit(12)
            .toArray()
        : Promise.resolve([]),
    ])

    /* ── Aulas que alimentam as faixas ──────────────────────────────── */

    const idsEmAndamento = emAndamento.map((p) => p.aulaId).filter(ObjectId.isValid)

    const [documentosEmAndamento, recentes, catalogo] = await Promise.all([
      idsEmAndamento.length
        ? db
            .collection(COLECOES.aulas)
            .find({ _id: { $in: idsEmAndamento.map((id) => new ObjectId(id)) } as any })
            .toArray()
        : Promise.resolve([]),
      db
        .collection(COLECOES.aulas)
        .find({ oculta: { $ne: true }, 'ensino.tipo': { $ne: 'resumo' } })
        .sort({ criadoEm: -1 })
        .limit(POR_FAIXA * 2)
        .toArray(),
      // Só o bloco `ensino` — é tudo que a contagem da navegação precisa, e
      // baixar o acervo inteiro para contar tópicos custaria caro à toa.
      db
        .collection(COLECOES.aulas)
        .find(
          { oculta: { $ne: true }, 'ensino.tipo': { $ne: 'resumo' } },
          { projection: { ensino: 1 } },
        )
        .toArray(),
    ])

    const [cartoesEmAndamento, cartoesRecentes] = await Promise.all([
      montarCartoes(db, documentosEmAndamento as any, usuario, { usuarioId, nos }),
      montarCartoes(db, recentes as any, usuario, { usuarioId, nos }),
    ])

    /* ── Continuar estudando, com o contexto da Trilha ───────────────── */

    const trilhaDaAula = new Map<string, { slug: string; titulo: string; etapa: string }>()
    for (const trilha of trilhas) {
      ;(trilha.etapas || []).forEach((etapa) => {
        for (const item of etapa.itens || []) {
          if (item.tipo !== 'aula' || trilhaDaAula.has(item.refId)) continue
          trilhaDaAula.set(item.refId, {
            slug: trilha.slug,
            titulo: trilha.titulo,
            etapa: etapa.titulo,
          })
        }
      })
    }

    const progressoDasTrilhas = await progressoDeTrilhas(db, trilhas, usuarioId)
    const porCartao = new Map(cartoesEmAndamento.map((c) => [c._id, c]))

    const continuar = emAndamento
      .map((progresso) => {
        const cartao = porCartao.get(progresso.aulaId)
        if (!cartao || !cartao.acesso.liberado) return null
        const contexto = trilhaDaAula.get(progresso.aulaId) || null
        const trilha = contexto ? trilhas.find((t) => t.slug === contexto.slug) : null
        const progressoTrilha = trilha ? progressoDasTrilhas.get(String(trilha._id)) : null

        return {
          aulaId: progresso.aulaId,
          titulo: cartao.titulo,
          capa: cartao.capa,
          href: contexto ? `${cartao.href}?trilha=${contexto.slug}` : cartao.href,
          percentual: progresso.percentual,
          posicaoSegundos: progresso.posicaoSegundos,
          retomarLabel: podeRetomar(progresso)
            ? `Continuar de ${formatarTempo(progresso.posicaoSegundos)}`
            : 'Continuar aula',
          localizacao: cartao.localizacao,
          trilha: contexto
            ? {
                slug: contexto.slug,
                titulo: contexto.titulo,
                etapa: contexto.etapa,
                percentual: progressoTrilha?.percentual ?? 0,
                concluidos: progressoTrilha?.concluidos ?? 0,
                total: progressoTrilha?.total ?? 0,
              }
            : null,
          atualizadoEm: progresso.atualizadoEm,
        }
      })
      .filter(Boolean)
      .slice(0, 6)

    /* ── Trilhas: em andamento, recomendadas, novas ──────────────────── */

    const duracaoPorAula = new Map<string, number>(
      catalogo.map((a: any) => [String(a._id), Number(a.ensino?.duracaoSegundos) || 0]),
    )

    const cartaoDeTrilha = (trilha: (typeof trilhas)[number]) => ({
      _id: String(trilha._id),
      slug: trilha.slug,
      titulo: trilha.titulo,
      subtitulo: trilha.subtitulo,
      capa: trilha.capa || null,
      nivel: trilha.nivel,
      publico: trilha.publico,
      destaque: trilha.destaque === true,
      ...resumirTrilha(trilha, duracaoPorAula),
      progresso: progressoDasTrilhas.get(String(trilha._id)) || null,
    })

    const iniciadas = new Set(estadosDeTrilha.map((e: any) => String(e.trilhaId)))
    const emCurso = trilhas
      .filter((t) => {
        const p = progressoDasTrilhas.get(String(t._id))
        return (iniciadas.has(String(t._id)) || p?.iniciada) && !p?.concluida
      })
      .slice(0, POR_FAIXA)

    const naoIniciadas = trilhas.filter((t) => !progressoDasTrilhas.get(String(t._id))?.iniciada)

    const recomendadas = [
      // Destaque é curadoria explícita do admin e ganha de qualquer heurística:
      // é o lugar onde a equipe diz "comece por aqui".
      ...naoIniciadas.filter((t) => t.destaque),
      ...naoIniciadas.filter((t) => !t.destaque),
    ].slice(0, POR_FAIXA)

    const novas = [...trilhas]
      .sort(
        (a, b) =>
          new Date(b.publicadaEm || b.criadoEm || 0).getTime() -
          new Date(a.publicadaEm || a.criadoEm || 0).getTime(),
      )
      .slice(0, POR_FAIXA)

    /* ── Navegação por etapa da Medicina (§13) ───────────────────────── */

    const arvore = podarVazios(montarArvore(nos, contarAulasPorNo(catalogo as any)))

    return NextResponse.json(
      {
        logado: Boolean(usuarioId),
        continuar,
        trilhas: {
          emCurso: emCurso.map(cartaoDeTrilha),
          recomendadas: recomendadas.map(cartaoDeTrilha),
          novas: novas.map(cartaoDeTrilha),
          total: trilhas.length,
        },
        arvore,
        aulasRecentes: cartoesRecentes.slice(0, POR_FAIXA),
        // "Revisar o que você estudou" é só um contador aqui: a fila completa
        // mora em /aulas/revisar, e calculá-la na home custaria uma varredura
        // de progresso que a maioria dos visitantes nunca usa.
        revisar: {
          concluidas: usuarioId
            ? await db
                .collection(COLECOES.progresso)
                .countDocuments({ usuarioId, concluida: true })
            : 0,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('[ensino/home] GET:', erro)
    return NextResponse.json({ error: 'Erro ao carregar a área de ensino' }, { status: 500 })
  }
}
