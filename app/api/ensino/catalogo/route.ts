import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import {
  contarAulasPorNo,
  lerNos,
  lerTrilhas,
  montarCartoes,
  podeEditarEnsino,
} from '@/lib/ensino/repositorio'
import { idsDoRamo, montarArvore } from '@/lib/ensino/taxonomia'
import { paraBusca } from '@/lib/ensino/busca'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const LIMITE_PADRAO = 60
const LIMITE_MAXIMO = 300

/**
 * O catálogo de aulas — uma rota, três consumidores.
 *
 * Ela serve à navegação do aluno (§14), ao painel administrativo (§22) e ao
 * seletor de aulas do construtor de Trilhas (§6). São três telas com o mesmo
 * pedido: "me dê as aulas que casam com estes filtros, com o que eu preciso
 * mostrar em cada linha". Escrever três rotas para isso significaria três
 * lugares onde o filtro por tópico pode divergir — e, pior, três lugares onde
 * o cadeado pode ser esquecido.
 *
 * A diferença entre os consumidores é de PERMISSÃO, não de forma: `admin=1` só
 * é aceito de quem pode editar, e é o único jeito de ver rascunho. Para o
 * aluno, tudo passa por `montarCartoes` e nada que ele não pode ver sai daqui.
 *
 * A busca acontece em memória de propósito: o acervo de aulas de uma
 * plataforma de conteúdo próprio é da ordem de milhares, não de milhões, e o
 * casamento sem acento que o português exige (`atrio` achar `átrio`) não sai
 * de graça em índice de texto do Mongo.
 */
export async function GET(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    const p = new URL(request.url).searchParams

    const editor = await podeEditarEnsino(db, sessao as any)
    const modoAdmin = p.get('admin') === '1' && editor

    const filtro: Record<string, any> = {}

    // Aula Resumo não aparece na navegação normal (§3): ela é uma face da aula
    // principal, e listá-la ao lado produziria duas entradas quase iguais.
    const tipo = p.get('tipo')
    if (tipo === 'resumo') filtro['ensino.tipo'] = 'resumo'
    else if (tipo !== 'todos') filtro['ensino.tipo'] = { $ne: 'resumo' }

    if (!modoAdmin) filtro.oculta = { $ne: true }
    else if (p.get('situacao') === 'rascunho') filtro.oculta = true
    else if (p.get('situacao') === 'publicada') filtro.oculta = { $ne: true }

    const nos = await lerNos(db)

    // Filtrar por um nó significa filtrar por ele E por tudo abaixo: quem abre
    // "Cardiologia" espera ver as aulas dos subtópicos dela, não uma lista
    // vazia porque cada aula declarou o nível mais fundo.
    const noId = p.get('no')
    if (noId) {
      const ramo = idsDoRamo(nos, noId)
      filtro.$or = [
        { 'ensino.areaId': { $in: ramo } },
        { 'ensino.moduloId': { $in: ramo } },
        { 'ensino.topicoId': { $in: ramo } },
        { 'ensino.subtopicoId': { $in: ramo } },
      ]
    }

    const profundidade = p.get('profundidade')
    if (profundidade) filtro['ensino.profundidade'] = profundidade

    const professor = p.get('professor')
    if (professor) filtro['ensino.professorIds'] = professor

    // "Sem classificação" é o filtro que o painel usa para mostrar a fila de
    // pendências — aulas antigas que ainda não entraram na taxonomia nova.
    if (p.get('semClassificacao') === '1') {
      filtro['ensino.areaId'] = null
      filtro['ensino.moduloId'] = null
      filtro['ensino.topicoId'] = null
      filtro['ensino.subtopicoId'] = null
    }

    const documentos = await db
      .collection(COLECOES.aulas)
      .find(filtro)
      .sort({ criadoEm: -1 })
      .limit(LIMITE_MAXIMO * 2)
      .toArray()

    const usuario = await montarContextoDoUsuario(db, sessao as any)
    let cartoes = await montarCartoes(db, documentos as any, usuario, {
      usuarioId: sessao?.userId,
      nos,
    })

    const termo = paraBusca(p.get('q') || '')
    if (termo.length >= 2) {
      cartoes = cartoes.filter((c) => {
        const alvo = [c.titulo, c.descricao || '', c.localizacao, (c.tags || []).join(' ')]
          .map(paraBusca)
          .join(' ')
        return alvo.includes(termo)
      })
    }

    const situacaoDoAluno = p.get('progresso')
    if (situacaoDoAluno === 'andamento') {
      cartoes = cartoes.filter((c) => c.progresso && c.progresso.percentual > 0 && !c.progresso.concluida)
    } else if (situacaoDoAluno === 'concluidas') {
      cartoes = cartoes.filter((c) => c.progresso?.concluida)
    } else if (situacaoDoAluno === 'nao-iniciadas') {
      cartoes = cartoes.filter((c) => !c.progresso || c.progresso.percentual === 0)
    }

    /*
     * Em quantas Trilhas cada aula aparece (§22).
     *
     * É o número que responde à pergunta central do painel — "posso mexer nesta
     * aula?" — e o que torna visível o reuso: uma aula em três Trilhas é uma
     * peça de infraestrutura, não um vídeo qualquer.
     */
    const trilhasPorAula = new Map<string, Array<{ slug: string; titulo: string }>>()
    if (modoAdmin || p.get('comTrilhas') === '1') {
      for (const trilha of await lerTrilhas(db, {})) {
        const vistas = new Set<string>()
        for (const etapa of trilha.etapas || []) {
          for (const item of etapa.itens || []) {
            if (item.tipo !== 'aula' || vistas.has(item.refId)) continue
            vistas.add(item.refId)
            const lista = trilhasPorAula.get(item.refId) || []
            lista.push({ slug: trilha.slug, titulo: trilha.titulo })
            trilhasPorAula.set(item.refId, lista)
          }
        }
      }
    }

    const trilhaFiltrada = p.get('trilha')
    if (trilhaFiltrada) {
      cartoes = cartoes.filter((c) =>
        (trilhasPorAula.get(c._id) || []).some((t) => t.slug === trilhaFiltrada),
      )
    }

    const limite = Math.min(LIMITE_MAXIMO, Math.max(1, Number(p.get('limite')) || LIMITE_PADRAO))
    const total = cartoes.length

    /*
     * "Selecionar todas" precisa de todas — inclusive as que a página não
     * mostrou.
     *
     * Devolver os cartões completos só para o admin marcar caixas seria pagar
     * o preço de montar centenas deles à toa. Este modo devolve a lista crua de
     * ids que passaram pelos MESMOS filtros e pelo MESMO motor de acesso, e
     * nada além disso.
     */
    if (p.get('soIds') === '1') {
      return NextResponse.json(
        { ids: cartoes.map((c) => c._id), total },
        { headers: { 'Cache-Control': 'private, no-store' } },
      )
    }

    const rascunhos = new Set(
      documentos.filter((d: any) => d.oculta).map((d: any) => String(d._id)),
    )

    const itens = cartoes.slice(0, limite).map((cartao) => ({
      ...cartao,
      trilhas: trilhasPorAula.get(cartao._id) || [],
      // O painel precisa saber o que está em rascunho; o aluno nunca vê essa
      // aula, então o campo é inofensivo na resposta pública.
      publicada: !rascunhos.has(cartao._id),
      // O bloco cru alimenta o painel de classificação rápida, que edita
      // exatamente estes campos. Sem ele o painel abriria vazio e sobrescreveria
      // a organização já cadastrada com nada.
      ensino: modoAdmin
        ? documentos.find((d: any) => String(d._id) === cartao._id)?.ensino || null
        : undefined,
    }))

    return NextResponse.json(
      {
        aulas: itens,
        total,
        arvore: p.get('arvore') === '1'
          ? montarArvore(nos, contarAulasPorNo(documentos as any))
          : undefined,
        nos: p.get('nos') === '1' ? nos : undefined,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('[ensino/catalogo] GET:', erro)
    return NextResponse.json({ error: 'Erro ao carregar o catálogo' }, { status: 500 })
  }
}
