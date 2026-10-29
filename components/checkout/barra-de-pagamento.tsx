'use client'

import { useCallback, type RefObject } from 'react'
import { ArrowDown, ShieldCheck } from 'lucide-react'
import { BarraInferior } from '@/components/ui/barra-inferior'
import { rolarAte } from '@/components/banco/rolagem-guiada'
import { useEstaNaTela } from '@/components/banco/use-esta-na-tela'

/**
 * "Ir para o pagamento" — a ponte entre a vitrine e o formulário, no celular.
 *
 * ## O problema que ela resolve
 *
 * As telas de compra são de duas colunas: o produto à esquerda (capa,
 * descrição, preço, desconto PROUNI, cupom) e os dados de pagamento à direita.
 * No desktop as duas ficam lado a lado e a pessoa vê as duas de uma vez. No
 * celular não existe "ao lado": a grade desempilha, e a coluna da direita cai
 * INTEIRA embaixo da esquerda.
 *
 * O resultado é que quem já decidiu comprar — que é a pessoa que mais importa
 * nesta tela — precisa rolar por uma capa de 400px, um parágrafo de descrição,
 * o cartão de preço, o chamativo do ProUni e a caixa de cupom antes de
 * encontrar o primeiro campo. Nada nesse caminho é dispensável (é o que
 * convence quem ainda não decidiu), mas nada nele também avisa que existe um
 * formulário depois. A tela parece uma página de produto sem botão de comprar.
 *
 * ## Por que uma barra, e não reordenar a grade
 *
 * Porque as duas pessoas usam a mesma tela. Quem ainda está decidindo precisa
 * do produto primeiro; quem já decidiu precisa do formulário primeiro. Subir o
 * formulário resolveria a segunda e quebraria a primeira. A barra atende as
 * duas: o conteúdo continua na ordem que convence, e quem já está convencido
 * pula direto.
 *
 * ## Por que ela some sozinha
 *
 * Assim que o formulário entra na tela, a barra sai. Ela é um atalho para
 * chegar lá — mantê-la depois só cobriria os campos que ela mesma foi buscar,
 * bem na hora de preenchê-los. Quem rolou de volta para reler o produto a
 * recebe de volta.
 *
 * Ela usa `BarraInferior`, então publica a própria altura em
 * `--gx-barra-inferior-h`: o "voltar" flutuante do iOS e a doca de ações sobem
 * junto, em vez de brigar por este canto (ver components/ui/barra-inferior.tsx).
 */
export function BarraDePagamento({
  alvo,
  valor,
  rotulo = 'Ir para o pagamento',
  apoio,
  ativa = true,
}: {
  /** O bloco do formulário — destino da rolagem e gatilho para a barra sumir. */
  alvo: RefObject<HTMLElement | null>
  /** O total, já formatado. `null` esconde o preço e mantém só a ação. */
  valor: string | null
  rotulo?: string
  /** Linha de apoio sob o valor. Sem ela, entra o selo de pagamento seguro. */
  apoio?: string
  /**
   * `false` desliga a barra por inteiro — para os momentos em que ela não faz
   * sentido (o produto indisponível, ou a pessoa já no passo do pagamento, em
   * que o "formulário" É a tela).
   */
  ativa?: boolean
}) {
  const formularioNaTela = useEstaNaTela(alvo, ativa)

  const irParaOFormulario = useCallback(() => {
    const destino = alvo.current
    if (!destino) return
    rolarAte(destino, {
      margemTopo: 24,
      aoChegar: () => {
        // O foco vai para o primeiro campo: no celular isso já abre o teclado,
        // e a pessoa começa a digitar sem um toque a mais. Se o bloco não tiver
        // campo nenhum (passo de pagamento), não há o que focar e nada acontece.
        const campo = destino.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), textarea:not([disabled])',
        )
        campo?.focus({ preventScroll: true })
      },
    })
  }, [alvo])

  if (!ativa || formularioNaTela) return null

  return (
    // `BarraInferior` já entrega os filhos dentro de um flex com folga própria
    // (ver o `<div className="mx-auto flex …">` no fim daquele arquivo), então
    // aqui entram os itens direto — um wrapper a mais só dobraria o padding.
    <BarraInferior apenasMobile>
      {valor ? (
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-muted-foreground">
            {apoio ?? 'Total a pagar'}
          </p>
          <p className="font-heading text-xl font-semibold leading-tight tabular-nums tracking-tight text-foreground">{valor}</p>
        </div>
      ) : (
        <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Pagamento seguro
        </p>
      )}

      <button
        type="button"
        onClick={irParaOFormulario}
        className="ml-auto inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-[#dc6a3a] to-[#c0501e] px-5 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_22px_-12px_rgba(192,80,30,0.8)] transition active:scale-[0.98]"
      >
        {rotulo}
        <ArrowDown className="h-4 w-4" />
      </button>
    </BarraInferior>
  )
}
