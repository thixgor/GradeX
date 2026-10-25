'use client'

import Link from 'next/link'
import { ChevronRight, Crown, Sparkles } from 'lucide-react'
import { ContagemRegressiva, useContagemDaOferta } from '@/components/upgrade/contagem'
import '@/components/upgrade/venda.css'
import { precoAnunciado, type OfertaDeUpgrade } from '@/hooks/use-oferta-de-upgrade'
import { formatarBRL } from '@/lib/buy/pricing'
import { cn } from '@/lib/utils'

/**
 * O convite para o Plus+ no perfil — o ponto de cor forte da página.
 *
 * Quem decide o que aparece é o cargo:
 *  - Quest+ com a oferta no ar → o upgrade com desconto, o preço riscado e o
 *    contador (os mesmos números da /upgrade, da mesma resposta);
 *  - Quest+ sem a oferta, gratuito e trial → "leve a plataforma inteira";
 *  - Plus+, admin e cargos pagos do admin → nada (quem chama não renderiza).
 *
 * Enquanto a oferta carrega, o cartão genérico já aparece: trocar o texto
 * depois é melhor que fazer o perfil pular quando ela chegar.
 */
export function CartaoDeUpgrade({
  oferta,
  quest,
  sufixoDoTeste,
  className,
}: {
  /** Resposta de `/api/upgrade` (undefined carregando, null se falhou). */
  oferta: OfertaDeUpgrade | null | undefined
  quest: boolean
  /** "2d 4h" — quanto falta no trial, quando é trial. */
  sufixoDoTeste?: string
  className?: string
}) {
  const falta = useContagemDaOferta(oferta?.restanteMs, oferta?.recebidaEm, oferta?.janelaHoras)
  const plano =
    oferta?.elegivel && oferta.planos?.length
      ? oferta.planos.find((p) => p.tipo === oferta.planoPadrao) || oferta.planos[0]
      : null
  const upgrade = quest && !!plano
  const periodo = plano?.periodo.replace(/^plano\s+/i, '').trim()
  // Bolsista PROUNI/FIES: o preço dele é o do benefício + o extra de upgrade.
  const anuncio = plano ? precoAnunciado(plano) : null
  const bolsista = !!anuncio?.bolsista

  return (
    <section
      aria-label={upgrade ? 'Oferta de upgrade para o Plus+' : 'Conheça o Plus+'}
      className={cn('venda-cartao p-4 sm:p-5', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] dark:bg-white/10">
          <Crown className="h-3.5 w-3.5" aria-hidden />
          {upgrade
            ? bolsista
              ? `Bolsista · PROUNI/FIES + ${oferta!.descontoExtraBolsista}% extra`
              : `Upgrade exclusivo · ${oferta!.descontoPercentual}% OFF`
            : sufixoDoTeste
              ? `Seu teste acaba em ${sufixoDoTeste}`
              : 'DomineAqui Plus+'}
        </span>
        {upgrade && falta !== null && <ContagemRegressiva faltaMs={falta} tamanho="compacto" />}
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.02em] sm:text-[24px]">
            {upgrade
              ? bolsista
                ? `Seu PROUNI/FIES vale +${oferta!.descontoExtraBolsista}% no upgrade`
                : `Leve o DomineAqui inteiro com ${oferta!.descontoPercentual}% de desconto`
              : quest
                ? 'Seu Quest+ é só o começo'
                : 'Desbloqueie a plataforma inteira'}
          </h2>
          <p className="venda-cartao-texto-2 mt-1.5 text-[14px] leading-relaxed">
            {upgrade ? (
              <>
                Plus+{periodo ? ` ${periodo}` : ''} de{' '}
                <s className="tabular-nums">R$ {formatarBRL(plano!.preco)}</s> por{' '}
                <strong className="tabular-nums text-[color:var(--vk-texto)]">R$ {formatarBRL(anuncio!.preco)}</strong>.
                Manuais, materiais, flashcards e IA — e o Banco de Questões continua.
              </>
            ) : quest ? (
              'Com o Plus+ você leva manuais, materiais, flashcards e IA — e o Banco de Questões continua com você.'
            ) : (
              'Manual Clínico, materiais, flashcards, provas e IA num plano só. Acesso na hora e 7 dias de garantia.'
            )}
          </p>
        </div>

        <Link
          href={upgrade ? '/upgrade' : '/buy'}
          className="buy-cta buy-cta-halo inline-flex h-12 items-center justify-center gap-1.5 rounded-full px-6 text-[15px] font-extrabold text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {upgrade ? <Sparkles className="h-4 w-4" aria-hidden /> : <Crown className="h-4 w-4" aria-hidden />}
          {upgrade ? 'Ver minha oferta' : quest ? 'Migrar para o Plus+' : 'Ver planos Plus+'}
          <ChevronRight className="buy-cta-seta h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
