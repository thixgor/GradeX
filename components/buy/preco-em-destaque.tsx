'use client'

import { cn } from '@/lib/utils'
import { formatarBRL, linhaDeApoio, type PrecoApresentado } from '@/lib/buy/pricing'

/**
 * O bloco de preço de /buy, em três tamanhos.
 *
 * A ordem de leitura é sempre a mesma e é ela que faz o trabalho: primeiro o
 * menor número honesto (o mês), depois o dia, depois — sem escapatória — o
 * total que vai ser cobrado de fato e o preço "de", quando existe. Inverter
 * essa ordem é o que deixava "R$ 327,00" batendo na cara de quem abria a
 * página semestral.
 *
 * `escala`:
 *   'card'   — dentro do seletor de planos, onde vários preços convivem;
 *   'painel' — o preço principal da oferta aberta;
 *   'ficha'  — a vitrine do topo da página ("a partir de").
 */

export type EscalaDePreco = 'card' | 'painel' | 'ficha'

const TAMANHO_DO_NUMERO: Record<EscalaDePreco, string> = {
  card: 'text-[1.75rem] sm:text-[2rem]',
  painel: 'text-[2.75rem] sm:text-[3.5rem]',
  ficha: 'text-[2.5rem] sm:text-[3rem]',
}

export function PrecoEmDestaque({
  preco,
  escala = 'painel',
  className,
}: {
  preco: PrecoApresentado
  escala?: EscalaDePreco
  className?: string
}) {
  const compacto = escala === 'card'

  return (
    <div className={cn('min-w-0', className)}>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={cn(
            'font-heading font-semibold leading-[0.95] tracking-tight tabular-nums text-foreground',
            TAMANHO_DO_NUMERO[escala]
          )}
        >
          <span className="mr-1 align-baseline text-[0.44em] font-semibold text-muted-foreground">
            R$
          </span>
          {formatarBRL(preco.chamada.valor)}
        </span>
        <span className="font-clinical text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {preco.chamada.unidade === 'unico' ? 'pagamento único' : 'por mês'}
        </span>
      </p>

      {preco.diario !== null && (
        <p
          className={cn(
            'mt-1 font-clinical tabular-nums text-primary',
            compacto ? 'text-[11px]' : 'text-xs sm:text-[13px]'
          )}
        >
          equivale a R$ {formatarBRL(preco.diario)} por dia
        </p>
      )}

      <p
        className={cn(
          'mt-2 leading-snug text-muted-foreground',
          compacto ? 'text-[11px]' : 'text-xs sm:text-sm'
        )}
      >
        {linhaDeApoio(preco)}
      </p>

      {preco.ancora !== null && preco.economia !== null && (
        <p
          className={cn(
            'mt-1.5 leading-snug text-muted-foreground',
            compacto ? 'text-[11px]' : 'text-xs sm:text-sm'
          )}
        >
          De <s className="tabular-nums">R$ {formatarBRL(preco.ancora)}</s>
          {' · '}
          <strong className="font-semibold tabular-nums text-secondary">
            você deixa de pagar R$ {formatarBRL(preco.economia)}
          </strong>
        </p>
      )}
    </div>
  )
}
