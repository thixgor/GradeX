import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { acervoArredondado } from '@/lib/banco/acervo-publico'

export const dynamic = 'force-dynamic'

/**
 * Quantas questões o Banco tem — arredondado, para as telas de venda.
 *
 * Existe para que a frase "+15 mil questões" do modal de assinatura
 * (`components/premium-pdf-cta-modal.tsx`) acompanhe o acervo sozinha, em vez
 * de ser uma string que alguém precisa lembrar de trocar depois de cada
 * importação — e que vira mentira no dia em que esquecerem.
 *
 * Três decisões que valem o comentário:
 *
 *  - **Devolve só o número redondo.** A contagem exata nem sai daqui: quem
 *    arredonda é o servidor, então não há como o número cru vazar para a tela
 *    por descuido de quem for consumir a rota depois (ver
 *    `lib/banco/acervo-publico.ts`).
 *  - **`estimatedDocumentCount`, não `countDocuments`.** É lido dos metadados
 *    da coleção, em tempo constante, sem varrer nada. Para um número que ainda
 *    vai ser arredondado para o milhar de baixo, a diferença entre a estimativa
 *    e a contagem exata desaparece no arredondamento — e um `countDocuments`
 *    numa rota pública seria uma varredura de coleção oferecida de graça.
 *  - **Erro não quebra a tela.** Falha do banco responde `0`, que o modal já
 *    sabe ler como "não fale número nenhum". Uma tela de venda a menos de um
 *    número é melhor do que uma tela de venda quebrada.
 *
 * Pública de propósito: o número aparece para quem ainda não assinou (e, se um
 * dia for para a vitrine, para quem nem tem conta). O cache de borda absorve o
 * volume — o acervo não muda de minuto em minuto.
 */
export async function GET() {
  try {
    const db = await getDb()
    const total = await db.collection('banco_questoes').estimatedDocumentCount()

    return NextResponse.json(
      { aproximado: acervoArredondado(total) },
      {
        headers: {
          'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    )
  } catch (error) {
    console.error('[banco/contagem] erro:', error)
    return NextResponse.json({ aproximado: 0 })
  }
}
