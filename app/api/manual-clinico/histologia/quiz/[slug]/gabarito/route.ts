import { NextResponse } from 'next/server'

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
 * responder. **Não** protege contra quem chama esta rota direto — e não tem
 * como proteger, num módulo gratuito e sem login, sem sessão para amarrar a
 * tentativa. Não fingimos o contrário: estes quizzes são de autoavaliação, não
 * de avaliação com nota, e blindá-los custaria a gratuidade que a licença
 * NãoComercial nos obriga a manter.
 */

export const runtime = 'nodejs'
export const revalidate = 86400

export async function GET(_requisicao: Request, { params }: { params: { slug: string } }) {
  if (!histologiaHabilitada()) {
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
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
  )
}
