import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { paraCodigo } from '@/lib/banco/hierarquia'
import {
  BancoQuestao,
  BancoQuestaoImportacao,
  BancoImportacaoResult,
  BancoAlternativaLetra
} from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

// Função para processar \n literal como quebra de linha real
function processLineBreaks(text: string): string {
  return text.replace(/\\n/g, '\n')
}

function parseImportTxt(content: string): { questoes: BancoQuestaoImportacao[], erros: { linha: number, mensagem: string }[] } {
  const questoes: BancoQuestaoImportacao[] = []
  const erros: { linha: number, mensagem: string }[] = []

  // Dividir por blocos de questão:
  // 1. Primeiro tenta separador --- (compatibilidade)
  // 2. Se não encontrar, divide por linha em branco seguida de [OBJETIVA] ou [DISCURSIVA]
  let blocos: string[]

  if (content.includes('---')) {
    // Modo legado com ---
    blocos = content.split(/---+/).map(b => b.trim()).filter(b => b.length > 0)
  } else {
    // Novo modo: divide quando encontra linha em branco seguida de [OBJETIVA] ou [DISCURSIVA]
    // Primeiro, normaliza as quebras de linha
    const normalizado = content.replace(/\r\n/g, '\n')

    // Divide por padrão de nova questão (linha em branco + marcador de tipo)
    blocos = normalizado
      .split(/\n\s*\n(?=\s*\[(OBJETIVA|DISCURSIVA)\])/i)
      .map(b => b.trim())
      .filter(b => b.length > 0)
  }

  blocos.forEach((bloco, index) => {
    const linhas = bloco.split('\n').map(l => l.trim())
    const linhaBase = content.substring(0, content.indexOf(bloco)).split('\n').length

    try {
      let tipo: 'objetiva' | 'discursiva' | null = null
      let periodo = ''
      let modulo = ''
      let topico = ''
      let subtopico = ''
      let enunciado = ''
      let imagemUrl = ''
      const alternativas: { letra: string, texto: string }[] = []
      let correta = ''
      let respostaModelo = ''
      let explicacao = ''
      let dificuldade: 'facil' | 'medio' | 'dificil' | undefined
      const tags: string[] = []
      let fonte = ''
      let ano: number | undefined

      let enunciadoAtivo = false
      let respostaAtiva = false
      let explicacaoAtiva = false

      for (const linha of linhas) {
        if (linha.startsWith('[OBJETIVA]')) {
          tipo = 'objetiva'
          continue
        }
        if (linha.startsWith('[DISCURSIVA]')) {
          tipo = 'discursiva'
          continue
        }

        if (linha.startsWith('PERÍODO:') || linha.startsWith('PERIODO:')) {
          periodo = linha.replace(/PERÍODO:|PERIODO:/, '').trim()
          enunciadoAtivo = false
          respostaAtiva = false
          explicacaoAtiva = false
          continue
        }
        if (linha.startsWith('MÓDULO:') || linha.startsWith('MODULO:')) {
          modulo = linha.replace(/MÓDULO:|MODULO:/, '').trim()
          continue
        }
        if (linha.startsWith('TÓPICO:') || linha.startsWith('TOPICO:')) {
          topico = linha.replace(/TÓPICO:|TOPICO:/, '').trim()
          continue
        }
        if (linha.startsWith('SUBTÓPICO:') || linha.startsWith('SUBTOPICO:')) {
          subtopico = linha.replace(/SUBTÓPICO:|SUBTOPICO:/, '').trim()
          continue
        }
        if (linha.startsWith('DIFICULDADE:')) {
          const dif = linha.replace('DIFICULDADE:', '').trim().toLowerCase()
          if (['facil', 'medio', 'dificil'].includes(dif)) {
            dificuldade = dif as 'facil' | 'medio' | 'dificil'
          }
          continue
        }
        if (linha.startsWith('TAGS:')) {
          const tagStr = linha.replace('TAGS:', '').trim()
          tags.push(...tagStr.split(',').map(t => t.trim()).filter(t => t))
          continue
        }
        if (linha.startsWith('FONTE:')) {
          fonte = linha.replace('FONTE:', '').trim()
          continue
        }
        if (linha.startsWith('ANO:')) {
          const anoStr = linha.replace('ANO:', '').trim()
          const anoNum = parseInt(anoStr)
          if (!isNaN(anoNum)) {
            ano = anoNum
          }
          continue
        }

        if (linha.startsWith('IMAGEM:') || linha.startsWith('IMG:')) {
          imagemUrl = linha.replace(/IMAGEM:|IMG:/, '').trim()
          continue
        }

        if (linha.startsWith('ENUNCIADO:')) {
          enunciado = processLineBreaks(linha.replace('ENUNCIADO:', '').trim())
          enunciadoAtivo = true
          respostaAtiva = false
          explicacaoAtiva = false
          continue
        }

        if (linha.startsWith('CORRETA:')) {
          correta = linha.replace('CORRETA:', '').trim().toUpperCase()
          enunciadoAtivo = false
          continue
        }

        if (linha.startsWith('RESPOSTA:')) {
          respostaModelo = processLineBreaks(linha.replace('RESPOSTA:', '').trim())
          respostaAtiva = true
          enunciadoAtivo = false
          explicacaoAtiva = false
          continue
        }

        if (linha.startsWith('EXPLICAÇÃO:') || linha.startsWith('EXPLICACAO:')) {
          explicacao = processLineBreaks(linha.replace(/EXPLICAÇÃO:|EXPLICACAO:/, '').trim())
          explicacaoAtiva = true
          enunciadoAtivo = false
          respostaAtiva = false
          continue
        }

        // Alternativas (A), B), C), D), E))
        const altMatch = linha.match(/^([A-E])\)\s*(.+)$/)
        if (altMatch) {
          alternativas.push({
            letra: altMatch[1],
            texto: processLineBreaks(altMatch[2].trim())
          })
          enunciadoAtivo = false
          continue
        }

        // Continuação de campos multilinhas
        if (enunciadoAtivo && linha) {
          enunciado += '\n' + processLineBreaks(linha)
        } else if (respostaAtiva && linha) {
          respostaModelo += '\n' + processLineBreaks(linha)
        } else if (explicacaoAtiva && linha) {
          explicacao += '\n' + processLineBreaks(linha)
        }
      }

      // Validações
      if (!tipo) {
        erros.push({ linha: linhaBase, mensagem: 'Tipo não especificado ([OBJETIVA] ou [DISCURSIVA])' })
        return
      }

      // PERÍODO É OPCIONAL - será inferido do módulo se não fornecido
      // if (!periodo) {
      //   erros.push({ linha: linhaBase, mensagem: 'Período não especificado' })
      //   return
      // }

      if (!modulo) {
        erros.push({ linha: linhaBase, mensagem: 'Módulo não especificado' })
        return
      }

      if (!topico) {
        erros.push({ linha: linhaBase, mensagem: 'Tópico não especificado' })
        return
      }

      if (!enunciado) {
        erros.push({ linha: linhaBase, mensagem: 'Enunciado não especificado' })
        return
      }

      if (tipo === 'objetiva') {
        if (alternativas.length < 2) {
          erros.push({ linha: linhaBase, mensagem: 'Questão objetiva precisa de pelo menos 2 alternativas' })
          return
        }
        if (!correta || !['A', 'B', 'C', 'D', 'E'].includes(correta)) {
          erros.push({ linha: linhaBase, mensagem: 'Alternativa correta não especificada ou inválida' })
          return
        }
      }

      if (tipo === 'discursiva' && !respostaModelo) {
        erros.push({ linha: linhaBase, mensagem: 'Resposta modelo não especificada para questão discursiva' })
        return
      }

      questoes.push({
        tipo,
        periodo: periodo || undefined,
        modulo,
        topico,
        subtopico: subtopico || undefined,
        enunciado,
        imagemUrl: imagemUrl || undefined,
        alternativas: tipo === 'objetiva' ? alternativas : undefined,
        correta: tipo === 'objetiva' ? correta : undefined,
        respostaModelo: tipo === 'discursiva' ? respostaModelo : undefined,
        explicacao: explicacao || undefined,
        dificuldade,
        tags: tags.length > 0 ? tags : undefined,
        fonte: fonte || undefined,
        ano
      })

    } catch (e) {
      erros.push({ linha: linhaBase, mensagem: `Erro ao processar bloco: ${e}` })
    }
  })

  return { questoes, erros }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.conteudo || typeof body.conteudo !== 'string') {
      return NextResponse.json({ error: 'Conteúdo do arquivo é obrigatório' }, { status: 400 })
    }

    const { questoes: questoesParsed, erros } = parseImportTxt(body.conteudo)

    if (questoesParsed.length === 0) {
      return NextResponse.json({
        sucesso: false,
        totalImportadas: 0,
        erros: erros.length > 0 ? erros : [{ linha: 1, mensagem: 'Nenhuma questão encontrada no arquivo' }],
        questoesImportadas: []
      } as BancoImportacaoResult)
    }

    const db = await getDb()

    // Buscar/criar hierarquia e inserir questões
    const questoesImportadas: BancoQuestao[] = []
    const errosImportacao: { linha: number, mensagem: string }[] = [...erros]

    for (let i = 0; i < questoesParsed.length; i++) {
      const q = questoesParsed[i]

      try {
        /*
         * Hierarquia sem período (ver lib/banco/hierarquia.ts).
         *
         * Antes, um módulo novo só podia ser criado se a questão trouxesse
         * `PERÍODO:` — importar um arquivo sem essa linha falhava com "Módulo X
         * não existe e nenhum período foi especificado", que é um erro sobre um
         * nível que o produto nem mostra mais. Agora o módulo é criado direto.
         *
         * A linha `PERÍODO:` continua sendo aceita no arquivo e é ignorada, para
         * que material antigo não precise ser reescrito.
         */
        let modulo: any = await db.collection('banco_modulos').findOne({
          nome: { $regex: `^${q.modulo}$`, $options: 'i' }
        })

        if (!modulo) {
          const codigo = paraCodigo(q.modulo)
          const ultimoModulo = await db.collection('banco_modulos')
            .findOne({}, { sort: { ordem: -1 } })

          const result = await db.collection('banco_modulos').insertOne({
            nome: q.modulo,
            codigo,
            ordem: (ultimoModulo?.ordem ?? 0) + 1,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          modulo = { _id: result.insertedId, nome: q.modulo }
        }

        // Buscar ou criar tópico
        let topico = await db.collection('banco_topicos').findOne({
          moduloId: modulo._id,
          nome: { $regex: `^${q.topico}$`, $options: 'i' }
        })

        if (!topico) {
          const codigo = paraCodigo(q.topico)

          const ultimoTopico = await db.collection('banco_topicos')
            .findOne({ moduloId: modulo._id }, { sort: { ordem: -1 } })

          const result = await db.collection('banco_topicos').insertOne({
            moduloId: modulo._id,
            nome: q.topico,
            codigo,
            ordem: (ultimoTopico?.ordem ?? 0) + 1,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          topico = { _id: result.insertedId, nome: q.topico }
        }

        // Buscar ou criar subtópico (se fornecido)
        let subtopico = null
        if (q.subtopico) {
          subtopico = await db.collection('banco_subtopicos').findOne({
            topicoId: topico._id,
            nome: { $regex: `^${q.subtopico}$`, $options: 'i' }
          })

          if (!subtopico) {
            const codigo = paraCodigo(q.subtopico!)

            const ultimoSubtopico = await db.collection('banco_subtopicos')
              .findOne({ topicoId: topico._id }, { sort: { ordem: -1 } })

            const result = await db.collection('banco_subtopicos').insertOne({
              topicoId: topico._id,
              nome: q.subtopico,
              codigo,
              ordem: (ultimoSubtopico?.ordem ?? 0) + 1,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            subtopico = { _id: result.insertedId, nome: q.subtopico }
          }
        }

        // Criar questão
        const novaQuestao: Omit<BancoQuestao, '_id'> = {
          tipo: q.tipo,
          moduloId: modulo._id,
          topicoId: topico._id,
          subtopicoid: subtopico?._id,
          enunciado: q.enunciado,
          explicacao: q.explicacao,
          imagemUrl: q.imagemUrl,
          alternativas: q.tipo === 'objetiva' && q.alternativas
            ? q.alternativas.map(alt => ({
                letra: alt.letra as BancoAlternativaLetra,
                texto: alt.texto,
                correta: alt.letra === q.correta
              }))
            : undefined,
          respostaModelo: q.tipo === 'discursiva' ? q.respostaModelo : undefined,
          dificuldade: q.dificuldade,
          tags: q.tags,
          fonte: q.fonte,
          ano: q.ano,
          totalRespostas: 0,
          totalAcertos: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: new ObjectId(session.userId)
        }

        const result = await db.collection('banco_questoes').insertOne(novaQuestao)
        questoesImportadas.push({ ...novaQuestao, _id: result.insertedId } as BancoQuestao)

      } catch (e) {
        errosImportacao.push({ linha: i + 1, mensagem: `Erro ao importar questão: ${e}` })
      }
    }

    return NextResponse.json({
      sucesso: questoesImportadas.length > 0,
      totalImportadas: questoesImportadas.length,
      erros: errosImportacao,
      questoesImportadas
    } as BancoImportacaoResult)

  } catch (error) {
    console.error('Erro ao importar questões:', error)
    return NextResponse.json({ error: 'Erro ao importar questões' }, { status: 500 })
  }
}
