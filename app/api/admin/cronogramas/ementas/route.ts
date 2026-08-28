import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { analisarEmenta, montarEmenta, resumirBruto, type TopicoBruto } from '@/lib/cronogramas/analisar-ementa'
import {
  COLECAO_EMENTAS,
  garantirIndicesDaEmenta,
  invalidarCacheDaEmenta,
  type DocumentoEmenta,
} from '@/lib/cronogramas/ementa'
import { contarEmenta, normalizarSecao, type EmentaTopico } from '@/lib/cronogramas/tipos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Importação da ementa pelo painel.
 *
 * O markdown é analisado AQUI, no servidor, mesmo que a tela já tenha mostrado
 * a prévia com o mesmo parser: a prévia é conveniência, não autorização. O que
 * vale é o que o servidor leu do texto que chegou.
 *
 * Um período pode vir de vários arquivos — em Medicina, SOI I e HAM I são o
 * mesmo 1º período —, então o corpo aceita uma lista e agrupa por destino
 * antes de gravar.
 */

/** Teto por requisição. Dez períodos de um curso inteiro cabem folgados. */
const MAX_ARQUIVOS = 30
const MAX_CARACTERES = 400_000

interface EntradaImportacao {
  secao: string
  periodo: number
  markdown: string
  nome?: string
}

/** O que já está importado, para a tela listar sem baixar as árvores inteiras. */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const db = await getDb()
  await garantirIndicesDaEmenta(db)

  const docs = await db
    .collection<DocumentoEmenta>(COLECAO_EMENTAS)
    .find({})
    .sort({ secao: 1, periodo: 1 })
    .toArray()

  const ementas = docs.map(doc => {
    const contagem = contarEmenta(doc.topicos ?? [])
    return {
      secao: doc.secao,
      periodo: doc.periodo,
      origem: doc.origem ?? [],
      importadaEm: doc.importadaEm instanceof Date ? doc.importadaEm.toISOString() : doc.importadaEm,
      topicos: contagem.topicos,
      subtopicos: contagem.subtopicos,
      modulos: contagem.modulos,
      submodulos: contagem.submodulos,
      horas: Math.round(contagem.horas),
      porPrioridade: contagem.porPrioridade,
      // Só os nomes dos tópicos: é o que a lista mostra, e a árvore inteira de
      // um período de Medicina passa de 300 KB.
      nomesDosTopicos: (doc.topicos ?? []).map(t => t.nome),
    }
  })

  return NextResponse.json({ ementas })
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let corpo: any
  try {
    corpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const itens: EntradaImportacao[] = Array.isArray(corpo?.itens) ? corpo.itens : [corpo]
  if (itens.length === 0 || itens.length > MAX_ARQUIVOS) {
    return NextResponse.json({ error: `Envie de 1 a ${MAX_ARQUIVOS} arquivos por vez.` }, { status: 400 })
  }

  /**
   * `adicionar` mantém os tópicos que já estavam no período e substitui só os
   * homônimos. É o que permite subir HAM I hoje sem apagar o SOI I de ontem —
   * e reimportar um SOI I corrigido sem duplicá-lo.
   */
  const adicionar = corpo?.adicionar === true

  // Agrupa por destino: vários arquivos podem alimentar o mesmo período.
  const porDestino = new Map<string, { secao: any; periodo: number; brutos: TopicoBruto[]; origem: string[] }>()

  for (const item of itens) {
    const secao = normalizarSecao(item?.secao)
    if (!secao) return NextResponse.json({ error: 'Escolha uma seção válida.' }, { status: 400 })

    const periodo = Math.round(Number(item?.periodo))
    if (!Number.isFinite(periodo) || periodo < 1 || periodo > 12) {
      return NextResponse.json({ error: 'Escolha um período entre 1 e 12.' }, { status: 400 })
    }

    const markdown = typeof item?.markdown === 'string' ? item.markdown : ''
    if (markdown.length === 0) {
      return NextResponse.json({ error: 'Cole ou envie o conteúdo da ementa.' }, { status: 400 })
    }
    if (markdown.length > MAX_CARACTERES) {
      return NextResponse.json({ error: 'Arquivo grande demais para uma importação.' }, { status: 400 })
    }

    const { topicos } = analisarEmenta(markdown)
    if (topicos.length === 0) {
      return NextResponse.json(
        {
          error: `Não encontrei nenhum tópico em "${item?.nome || 'texto colado'}". Confira se as linhas começam com TÓPICO:, Subtópico:, Módulo: e Submódulo:.`,
        },
        { status: 400 },
      )
    }

    const chave = `${secao}:${periodo}`
    const grupo = porDestino.get(chave) ?? { secao, periodo, brutos: [], origem: [] }
    grupo.brutos.push(...topicos)
    if (item?.nome) grupo.origem.push(String(item.nome).slice(0, 120))
    porDestino.set(chave, grupo)
  }

  const db = await getDb()
  await garantirIndicesDaEmenta(db)

  const agora = new Date()
  const resultado: any[] = []

  for (const grupo of porDestino.values()) {
    let topicos: EmentaTopico[] = montarEmenta(grupo.secao, grupo.periodo, grupo.brutos)
    let origem = grupo.origem

    if (adicionar) {
      const anterior = await db
        .collection<DocumentoEmenta>(COLECAO_EMENTAS)
        .findOne({ secao: grupo.secao, periodo: grupo.periodo })

      if (anterior?.topicos?.length) {
        const chegando = new Set(topicos.map(t => t.nome.toLowerCase()))
        const preservados = anterior.topicos.filter(t => !chegando.has(t.nome.toLowerCase()))
        topicos = [...preservados, ...topicos]
        origem = [...new Set([...(anterior.origem ?? []), ...origem])]
      }
    }

    await db.collection<DocumentoEmenta>(COLECAO_EMENTAS).updateOne(
      { secao: grupo.secao, periodo: grupo.periodo },
      {
        $set: {
          secao: grupo.secao,
          periodo: grupo.periodo,
          topicos,
          origem,
          importadaEm: agora,
          importadaPor: session.userId,
        },
      },
      { upsert: true },
    )

    const contagem = contarEmenta(topicos)
    resultado.push({
      secao: grupo.secao,
      periodo: grupo.periodo,
      topicos: contagem.topicos,
      subtopicos: contagem.subtopicos,
      modulos: contagem.modulos,
      submodulos: contagem.submodulos,
      horas: Math.round(contagem.horas),
      comPrioridade: resumirBruto(grupo.brutos).comPrioridade,
    })
  }

  invalidarCacheDaEmenta()

  return NextResponse.json({ importadas: resultado })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const secao = normalizarSecao(params.get('secao'))
  const periodo = Math.round(Number(params.get('periodo')))

  if (!secao || !Number.isFinite(periodo)) {
    return NextResponse.json({ error: 'Informe seção e período.' }, { status: 400 })
  }

  const db = await getDb()
  const resultado = await db.collection(COLECAO_EMENTAS).deleteOne({ secao, periodo })
  invalidarCacheDaEmenta()

  if (resultado.deletedCount === 0) {
    return NextResponse.json({ error: 'Ementa não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
