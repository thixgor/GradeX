'use client'

import { cn } from '@/lib/utils'
import { formatarBRL, linhaDeApoio, type PrecoApresentado } from '@/lib/buy/pricing'

/**
 * O bloco de preço de /buy.
 *
 * A ordem de leitura é sempre a mesma e é ela que faz o trabalho: primeiro o
 * menor número honesto (o mês), depois — sem escapatória — o total que vai ser
 * cobrado de fato, e só então o preço "de", quando existe. Inverter essa ordem
 * é o que deixava "R$ 327,00" batendo na cara de quem abria a página semestral.
 *
 * A leitura diária deixou de ser uma linha própria: virou o fim da linha de
 * apoio. Eram quatro linhas de texto embaixo do número, e num bloco de preço a
 * quarta linha já não é argumento, é ruído.
 *
 * `escala`:
 *   'painel'   — o preço principal da oferta;
 *   'compacto' — o mesmo bloco onde o espaço é curto (aviso de plano ativo,
 *                telas estreitas em que o painel precisa caber inteiro).
 */

export type EscalaDePreco = 'painel' | 'compacto'

const TAMANHO_DO_NUMERO: Record<EscalaDePreco, string> = {
  painel: 'text-[2.5rem] sm:text-[3.25rem]',
  compacto: 'text-[1.75rem] sm:text-[2rem]',
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
  const compacto = escala === 'compacto'
  const apoio =
    preco.diario !== null
      ? `${linhaDeApoio(preco)} Dá R$ ${formatarBRL(preco.diario)} por dia.`
      : linhaDeApoio(preco)

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

      <p
        className={cn(
          'mt-2 leading-snug text-muted-foreground',
          compacto ? 'text-[11px]' : 'text-[13px] sm:text-sm'
        )}
      >
        {apoio}
      </p>

      {preco.ancora !== null && preco.economia !== null && (
        <p
          className={cn(
            'mt-1.5 leading-snug text-muted-foreground',
            compacto ? 'text-[11px]' : 'text-[13px] sm:text-sm'
          )}
        >
          De <s className="tabular-nums">R$ {formatarBRL(preco.ancora)}</s>
          {' · '}
          <strong className="font-semibold tabular-nums text-secondary">
            economia de R$ {formatarBRL(preco.economia)}
          </strong>
        </p>
      )}
    </div>
  )
}
