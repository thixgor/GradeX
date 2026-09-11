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
 * O DESCONTO É UM SELO, NÃO UM PARÁGRAFO. `descontoPercentual` já existia em
 * `apresentarPreco` e nunca tinha chegado à tela: a economia aparecia só como
 * texto cinza de 13px no fim do bloco, do mesmo peso do resto. É o número mais
 * recompensador daqui — ele agora encosta no preço, em pastilha, e a economia
 * em reais vira etiqueta verde em vez de mais uma linha de rodapé.
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
  const temDesconto = preco.descontoPercentual !== null && preco.descontoPercentual > 0
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
        {/* O selo é derivado do mesmo par preço/preço "de" que a linha de
            economia logo abaixo — não é um número novo, é o mesmo desconto
            dito na unidade que se lê de relance. */}
        {temDesconto && (
          <span
            className={cn(
              'buy-selo inline-flex items-center rounded-lg bg-secondary px-2 py-1 font-black leading-none tabular-nums text-secondary-foreground shadow-sm shadow-secondary/30',
              compacto ? 'text-[11px]' : 'text-xs sm:text-sm'
            )}
          >
            −{preco.descontoPercentual}%
          </span>
        )}
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
            'mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 leading-snug text-muted-foreground',
            compacto ? 'text-[11px]' : 'text-[13px] sm:text-sm'
          )}
        >
          De <s className="tabular-nums">R$ {formatarBRL(preco.ancora)}</s>
          <span
            className={cn(
              'inline-flex items-center rounded-full bg-emerald-500/15 font-bold tabular-nums text-emerald-700 ring-1 ring-emerald-600/25 dark:text-emerald-300 dark:ring-emerald-400/30',
              compacto ? 'px-2 py-0.5' : 'px-2.5 py-1'
            )}
          >
            você economiza R$ {formatarBRL(preco.economia)}
          </span>
        </p>
      )}
    </div>
  )
}
