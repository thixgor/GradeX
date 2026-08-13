import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import { obterQuiz } from '@/lib/histologia/repositorio'

/**
 * Gabarito de um quiz, entregue **só depois** que o aluno termina o modo prova.
 *
 * ## Por que existe
 *
 * No modo prova o quiz é serializado sem `correta` e sem `feedback`
 * (`quizParaCliente`), justamente para que "ver código-fonte" não entregue a
 * prova. Mas alguém precisa corrigir — e corrigir no cliente exige o gabarito.
 * Esta rota fecha o ciclo: o aluno responde sem o gabarito no HTML, pede a
 * correção, e só então o gabarito chega.
 *
 * ## O que isso protege, e o que não protege
 *
 * Protege contra o caminho fácil: abrir o inspetor e ler as respostas antes de
 * responder. **Não** protege contra o assinante que chama esta rota direto —
 * não há sessão de prova para amarrar a tentativa. Não fingimos o contrário:
 * estes quizzes são de autoavaliação, não de avaliação com nota.
 *
 * O que a rota protege desde que o módulo virou privativo é quem pode pedir:
 * sem assinatura, 404 — o mesmo que a licença desligada devolve.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_requisicao: Request, { params }: { params: { slug: string } }) {
  if (!histologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }
  if (!(await histologiaLiberadaNaRequisicao())) {
    return new NextResponse(null, { status: 404 })
  }

  const quiz = await obterQuiz(params.slug)
  if (!quiz) {
    return new NextResponse(null, { status: 404 })
  }

  // Só o necessário para corrigir e explicar — nada do resto do payload.
  return NextResponse.json(
    {
      slug: quiz.slug,
      questoes: quiz.questoes.map((questao) => ({
        id: questao.id,
        // A lâmina de origem viaja com o gabarito, e não com a questão: o
        // `estruturaId` nomeia a estrutura, então antes da correção ele seria
        // resposta. Depois dela, é o que leva o aluno de volta ao corte.
        lamina: questao.lamina ?? null,
        alternativas: questao.alternativas.map((alternativa) => ({
          id: alternativa.id,
          correta: alternativa.correta,
          feedback: alternativa.feedback,
          // Acompanha a devolutiva para que o modo prova também marque o que
          // ainda está em inglês, como já ocorre no modo prática.
          feedbackPendente: alternativa.feedbackPendente,
        })),
      })),
    },
    { headers: { 'Cache-Control': 'private, max-age=300, must-revalidate' } },
  )
}
