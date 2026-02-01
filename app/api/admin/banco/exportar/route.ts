import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const periodoId = searchParams.get('periodoId')
    const moduloId = searchParams.get('moduloId')
    const topicoId = searchParams.get('topicoId')
    const tipo = searchParams.get('tipo')

    const db = await getDb()

    // Construir filtro
    const filter: any = {}
    if (periodoId && ObjectId.isValid(periodoId)) {
      filter.periodoId = new ObjectId(periodoId)
    }
    if (moduloId && ObjectId.isValid(moduloId)) {
      filter.moduloId = new ObjectId(moduloId)
    }
    if (topicoId && ObjectId.isValid(topicoId)) {
      filter.topicoId = new ObjectId(topicoId)
    }
    if (tipo && ['objetiva', 'discursiva'].includes(tipo)) {
      filter.tipo = tipo
    }

    // Buscar questões com hierarquia
    const questoes = await db.collection('banco_questoes')
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'banco_periodos',
            localField: 'periodoId',
            foreignField: '_id',
            as: 'periodo'
          }
        },
        {
          $lookup: {
            from: 'banco_modulos',
            localField: 'moduloId',
            foreignField: '_id',
            as: 'modulo'
          }
        },
        {
          $lookup: {
            from: 'banco_topicos',
            localField: 'topicoId',
            foreignField: '_id',
            as: 'topico'
          }
        },
        {
          $lookup: {
            from: 'banco_subtopicos',
            localField: 'subtopicoid',
            foreignField: '_id',
            as: 'subtopico'
          }
        },
        {
          $addFields: {
            periodoNome: { $arrayElemAt: ['$periodo.nome', 0] },
            moduloNome: { $arrayElemAt: ['$modulo.nome', 0] },
            topicoNome: { $arrayElemAt: ['$topico.nome', 0] },
            subtopicoNome: { $arrayElemAt: ['$subtopico.nome', 0] }
          }
        },
        {
          $project: {
            periodo: 0,
            modulo: 0,
            topico: 0,
            subtopico: 0
          }
        },
        { $sort: { periodoNome: 1, moduloNome: 1, topicoNome: 1, createdAt: 1 } }
      ])
      .toArray()

    // Função para escapar quebras de linha reais para \n literal
    function escapeLineBreaks(text: string): string {
      if (!text) return text
      return text.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n')
    }

    // Gerar TXT
    let txtContent = ''
    txtContent += '# EXPORTAÇÃO DO BANCO DE QUESTÕES - DOMINEAQUI\n'
    txtContent += `# Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`
    txtContent += `# Total de questões: ${questoes.length}\n`
    txtContent += '#\n'
    txtContent += '# Este arquivo pode ser reimportado na plataforma.\n'
    txtContent += '# Mantenha o formato exato para evitar erros.\n'
    txtContent += '# Use \\n no texto para criar quebras de linha.\n'
    txtContent += '# Separe as questões com uma linha em branco.\n'
    txtContent += '\n'

    for (let i = 0; i < questoes.length; i++) {
      const q = questoes[i]

      // Tipo da questão
      txtContent += `[${q.tipo.toUpperCase()}]\n`

      // Hierarquia
      if (q.periodoNome) {
        txtContent += `PERÍODO: ${q.periodoNome}\n`
      }
      if (q.moduloNome) {
        txtContent += `MÓDULO: ${q.moduloNome}\n`
      }
      if (q.topicoNome) {
        txtContent += `TÓPICO: ${q.topicoNome}\n`
      }
      if (q.subtopicoNome) {
        txtContent += `SUBTÓPICO: ${q.subtopicoNome}\n`
      }

      // Metadados opcionais
      if (q.dificuldade) {
        txtContent += `DIFICULDADE: ${q.dificuldade}\n`
      }
      if (q.ano) {
        txtContent += `ANO: ${q.ano}\n`
      }
      if (q.fonte) {
        txtContent += `FONTE: ${q.fonte}\n`
      }
      if (q.tags && q.tags.length > 0) {
        txtContent += `TAGS: ${q.tags.join(', ')}\n`
      }
      if (q.imagemUrl) {
        txtContent += `IMAGEM: ${q.imagemUrl}\n`
      }

      // Enunciado (escapar quebras de linha)
      txtContent += `ENUNCIADO: ${escapeLineBreaks(q.enunciado)}\n`

      // Alternativas para objetiva (escapar quebras de linha)
      if (q.tipo === 'objetiva' && q.alternativas && q.alternativas.length > 0) {
        for (const alt of q.alternativas) {
          txtContent += `${alt.letra}) ${escapeLineBreaks(alt.texto)}\n`
        }
        // Encontrar a correta
        const correta = q.alternativas.find((a: any) => a.correta)
        if (correta) {
          txtContent += `CORRETA: ${correta.letra}\n`
        }
      }

      // Resposta para discursiva (escapar quebras de linha)
      if (q.tipo === 'discursiva' && q.respostaModelo) {
        txtContent += `RESPOSTA: ${escapeLineBreaks(q.respostaModelo)}\n`
      }

      // Explicação (escapar quebras de linha)
      if (q.explicacao) {
        txtContent += `EXPLICAÇÃO: ${escapeLineBreaks(q.explicacao)}\n`
      }

      // Separador entre questões (linha em branco antes do próximo [TIPO])
      if (i < questoes.length - 1) {
        txtContent += '\n'
      }
    }

    // Retornar como arquivo TXT
    const blob = new Blob([txtContent], { type: 'text/plain; charset=utf-8' })
    const buffer = Buffer.from(await blob.arrayBuffer())

    const dataHora = new Date().toISOString().slice(0, 10)
    const filename = `banco_questoes_${dataHora}.txt`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Erro ao exportar questões:', error)
    return NextResponse.json({ error: 'Erro ao exportar questões' }, { status: 500 })
  }
}
