import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import { BancoQuestao, BancoResolucao, BancoAlternativaLetra } from '@/lib/types/banco-questoes'
import { isPlusAccount } from '@/lib/account-tier'
import { areaLiberada, resolverPermissoes } from '@/lib/plan-entitlements-server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()

    // Verificar se usuário é premium ou admin
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const isAdmin = user.role === 'admin'
    // Assinar não basta: o plano precisa incluir o Banco. Quem tem um plano
    // sem a seção cai no mesmo caminho do gratuito — resolve as questões que
    // já desbloqueou e nada além disso.
    const permissoes = await resolverPermissoes(db, {
      userId: session.userId,
      role: user.role,
      accountType: user.accountType,
      premiumPlanType: user.premiumPlanType as string | null,
    })
    const isPremiumOrTrial =
      (isPlusAccount(user.accountType) || user.accountType === 'trial') &&
      areaLiberada(permissoes, 'bancoQuestoes')
    const isFreeUser = !isAdmin && !isPremiumOrTrial

    // Verificar acesso para usuários gratuitos
    if (isFreeUser) {
      // Verificar se a questão está na lista de questões permitidas para o usuário
      const freeQuestions = user.freeQuestionsByPeriod || {}
      const allAllowedQuestionIds = Object.values(freeQuestions).flat()

      if (!allAllowedQuestionIds.includes(id)) {
        return NextResponse.json({
          error: 'Acesso restrito a assinantes Plus+',
          requiresPlus: true
        }, { status: 403 })
      }
    }

    // Buscar questão
    const questao = await db.collection<BancoQuestao>('banco_questoes')
      .findOne({ _id: new ObjectId(id) })

    if (!questao) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    const body = await request.json()

    // Validar resposta baseado no tipo
    if (questao.tipo === 'objetiva') {
      if (!body.alternativaSelecionada) {
        return NextResponse.json({ error: 'Alternativa não selecionada' }, { status: 400 })
      }

      const alternativaCorreta = questao.alternativas?.find(alt => alt.correta)
      const correta = alternativaCorreta?.letra === body.alternativaSelecionada

      // Criar resolução
      const resolucao: Omit<BancoResolucao, '_id'> = {
        userId: new ObjectId(session.userId),
        questaoId: new ObjectId(id),
        tipo: 'objetiva',
        alternativaSelecionada: body.alternativaSelecionada as BancoAlternativaLetra,
        correta,
        tempoGasto: body.tempoGasto || undefined,
        createdAt: new Date()
      }

      await db.collection('banco_resolucoes').insertOne(resolucao)

      // Atualizar estatísticas da questão
      await db.collection('banco_questoes').updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: {
            totalRespostas: 1,
            totalAcertos: correta ? 1 : 0
          }
        }
      )

      return NextResponse.json({
        sucesso: true,
        correta,
        alternativaCorreta: alternativaCorreta?.letra,
        explicacao: questao.explicacao
      })

    } else if (questao.tipo === 'discursiva') {
      if (!body.respostaUsuario) {
        return NextResponse.json({ error: 'Resposta não fornecida' }, { status: 400 })
      }

      // Criar resolução para discursiva
      const resolucao: Omit<BancoResolucao, '_id'> = {
        userId: new ObjectId(session.userId),
        questaoId: new ObjectId(id),
        tipo: 'discursiva',
        respostaUsuario: body.respostaUsuario,
        tempoGasto: body.tempoGasto || undefined,
        createdAt: new Date()
      }

      await db.collection('banco_resolucoes').insertOne(resolucao)

      // Atualizar estatísticas da questão
      await db.collection('banco_questoes').updateOne(
        { _id: new ObjectId(id) },
        { $inc: { totalRespostas: 1 } }
      )

      return NextResponse.json({
        sucesso: true,
        respostaModelo: questao.respostaModelo,
        explicacao: questao.explicacao
      })
    }

    return NextResponse.json({ error: 'Tipo de questão inválido' }, { status: 400 })

  } catch (error) {
    console.error('Erro ao resolver questão:', error)
    return NextResponse.json({ error: 'Erro ao resolver questão' }, { status: 500 })
  }
}
