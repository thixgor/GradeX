import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

/**
 * A frase que o admin precisa digitar. Confirmação por clique não basta aqui.
 *
 * Fica local ao arquivo porque um módulo de rota do App Router só pode exportar
 * handlers e a configuração de segmento — exportar a constante daqui quebra a
 * checagem de tipos gerada pelo Next.
 */
const FRASE_DE_CONFIRMACAO = 'APAGAR TUDO'

/**
 * Esvaziar o Banco de Questões.
 *
 * ## Por que isto existe
 *
 * A importação das provas traz o acervo inteiro de uma vez. Quando o
 * mapeamento sai errado — grupo errado escolhido, hierarquia mal montada,
 * período lido da data em vez do título — o conserto é reimportar do zero, e
 * até aqui a única forma de esvaziar era apagar questão por questão numa tabela
 * paginada de vinte em vinte. Com dezenas de milhares de questões isso não é
 * uma operação, é uma tarde perdida.
 *
 * ## O que vai junto
 *
 * Apagar só `banco_questoes` deixaria restos que ninguém vê e que quebram
 * silenciosamente:
 *
 * - **resoluções** apontando para questões inexistentes — o histórico do aluno
 *   mostraria linhas vazias e a estatística contaria acertos de questões que
 *   não existem mais;
 * - **listas** cheias de ids mortos, que abririam vazias;
 * - **o saldo gratuito**: `bancoQuestoesLiberadas` guarda os ids que a pessoa
 *   abriu. Se eles sumirem do banco mas ficarem no usuário, ela perde as
 *   questões gratuitas para sempre, gastas em conteúdo que não existe.
 *
 * Por isso a limpeza é do conjunto todo, e a tela diz exatamente isso antes de
 * pedir a frase.
 *
 * A hierarquia (módulos, tópicos, subtópicos) só cai se o admin pedir: quem
 * organizou a árvore à mão não quer perdê-la por reimportar as questões.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const confirmacao = String(body?.confirmacao || '').trim().toUpperCase()
    const apagarHierarquia = body?.apagarHierarquia === true

    if (confirmacao !== FRASE_DE_CONFIRMACAO) {
      return NextResponse.json(
        { error: `Digite "${FRASE_DE_CONFIRMACAO}" para confirmar` },
        { status: 400 },
      )
    }

    const db = await getDb()

    const questoes = await db.collection('banco_questoes').countDocuments()

    // A ordem importa: as referências caem ANTES das questões. Se a chamada
    // morrer no meio, o pior estado possível é "resolução apagada, questão de
    // pé" — recuperável. O contrário deixaria histórico órfão para sempre.
    const resolucoes = await db.collection('banco_resolucoes').deleteMany({})
    const listas = await db.collection('banco_listas_usuario').deleteMany({})

    // O saldo gratuito volta a zero para todo mundo: os ids abertos apontam
    // para questões que deixaram de existir, e mantê-los seria cobrar da pessoa
    // um consumo que ela não tem mais como usar.
    const usuarios = await db.collection('users').updateMany(
      {
        $or: [
          { bancoQuestoesLiberadas: { $exists: true, $ne: [] } },
          { freeQuestionsByPeriod: { $exists: true, $ne: null } },
        ],
      },
      { $set: { bancoQuestoesLiberadas: [] }, $unset: { freeQuestionsByPeriod: '' } },
    )

    const apagadas = await db.collection('banco_questoes').deleteMany({})

    let hierarquia = { modulos: 0, topicos: 0, subtopicos: 0 }
    if (apagarHierarquia) {
      const [subtopicos, topicos, modulos] = await Promise.all([
        db.collection('banco_subtopicos').deleteMany({}),
        db.collection('banco_topicos').deleteMany({}),
        db.collection('banco_modulos').deleteMany({}),
      ])
      hierarquia = {
        modulos: modulos.deletedCount || 0,
        topicos: topicos.deletedCount || 0,
        subtopicos: subtopicos.deletedCount || 0,
      }
    }

    console.warn(
      `[banco] Admin ${session.userId} esvaziou o banco: ${apagadas.deletedCount} questões, ` +
        `${resolucoes.deletedCount} resoluções, ${listas.deletedCount} listas` +
        (apagarHierarquia ? ', hierarquia incluída' : ''),
    )

    return NextResponse.json({
      sucesso: true,
      questoesAntes: questoes,
      questoes: apagadas.deletedCount || 0,
      resolucoes: resolucoes.deletedCount || 0,
      listas: listas.deletedCount || 0,
      usuariosComSaldoRestaurado: usuarios.modifiedCount || 0,
      hierarquia,
    })
  } catch (error) {
    console.error('Erro ao esvaziar o banco de questões:', error)
    return NextResponse.json({ error: 'Erro ao esvaziar o banco' }, { status: 500 })
  }
}
