'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BadgePercent, Check, Copy, Flame, PiggyBank, Sparkles } from 'lucide-react'
import type { CouponPromoPayload, CouponPromoTone } from '@/lib/coupons'
import { cn } from '@/lib/utils'

/**
 * Faixa de campanha no checkout: "existe um cupom para este item, aqui está".
 *
 * O texto vem do cupom (admin → /admin/cupons), e quem decide se aparece é o
 * servidor: campanha inativa, vencida, esgotada ou fora do escopo do item
 * simplesmente não volta de /api/coupons/promo. A tela nunca inventa promoção.
 *
 * Falha em silêncio de propósito. Isto é enfeite de conversão dentro de uma
 * tela de pagamento — se a busca cair, o checkout continua exatamente como era
 * antes de a faixa existir.
 */

export type AparenciaPromo = 'app' | 'dark'

export interface ItemDoChamativo {
  itemType: 'material' | 'package' | 'manual_clinico' | 'plus'
  itemId: string
  /** `flashcard_deck` faz o item casar com cupons de escopo "Flashcards". */
  materialType?: string
}

interface Props {
  itens: ItemDoChamativo[]
  /** Plano do Manual Clínico em foco (restringe cupons por plano). */
  planKey?: string
  aparencia?: AparenciaPromo
  /**
   * Aplica o cupom direto na tela. Quando ausente, a faixa só oferece copiar o
   * código — que é o que funciona em qualquer checkout, sem acoplamento.
   */
  onAplicar?: (code: string) => void
  /** Código já aplicado, para a faixa não insistir no que já está valendo. */
  codigoAplicado?: string | null
  className?: string
}

interface Pele {
  cartao: string
  titulo: string
  texto: string
  codigo: string
  botao: string
  botaoSecundario: string
  miudo: string
}

const PELES: Record<AparenciaPromo, Record<CouponPromoTone, Pele>> = {
  app: {
    destaque: {
      cartao: 'border-primary/30 bg-primary/10',
      titulo: 'text-foreground',
      texto: 'text-muted-foreground',
      codigo: 'border-primary/35 bg-background/70 text-primary',
      botao: 'bg-primary text-primary-foreground hover:brightness-110',
      botaoSecundario: 'border border-primary/30 text-primary hover:bg-primary/10',
      miudo: 'text-muted-foreground',
    },
    urgencia: {
      cartao: 'border-orange-500/35 bg-orange-500/10',
      titulo: 'text-orange-900 dark:text-orange-100',
      texto: 'text-orange-800/80 dark:text-orange-200/75',
      codigo: 'border-orange-500/40 bg-background/70 text-orange-700 dark:text-orange-200',
      botao: 'bg-orange-500 text-white hover:brightness-110',
      botaoSecundario: 'border border-orange-500/35 text-orange-700 hover:bg-orange-500/10 dark:text-orange-200',
      miudo: 'text-orange-800/70 dark:text-orange-200/65',
    },
    economia: {
      cartao: 'border-emerald-500/30 bg-emerald-500/10',
      titulo: 'text-emerald-900 dark:text-emerald-100',
      texto: 'text-emerald-800/80 dark:text-emerald-200/75',
      codigo: 'border-emerald-500/40 bg-background/70 text-emerald-700 dark:text-emerald-200',
      botao: 'bg-emerald-600 text-white hover:brightness-110',
      botaoSecundario: 'border border-emerald-500/35 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-200',
      miudo: 'text-emerald-800/70 dark:text-emerald-200/65',
    },
  },
  dark: {
    destaque: {
      cartao: 'border-emerald-300/25 bg-emerald-300/10',
      titulo: 'text-white',
      texto: 'text-white/65',
      codigo: 'border-emerald-300/35 bg-black/30 text-emerald-200',
      botao: 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200',
      botaoSecundario: 'border border-emerald-300/30 text-emerald-200 hover:bg-emerald-300/10',
      miudo: 'text-white/45',
    },
    urgencia: {
      cartao: 'border-amber-300/30 bg-amber-300/10',
      titulo: 'text-white',
      texto: 'text-amber-100/75',
      codigo: 'border-amber-300/35 bg-black/30 text-amber-200',
      botao: 'bg-amber-300 text-amber-950 hover:bg-amber-200',
      botaoSecundario: 'border border-amber-300/30 text-amber-200 hover:bg-amber-300/10',
      miudo: 'text-amber-100/55',
    },
    economia: {
      cartao: 'border-emerald-300/25 bg-emerald-400/10',
      titulo: 'text-white',
      texto: 'text-emerald-100/75',
      codigo: 'border-emerald-300/35 bg-black/30 text-emerald-200',
      botao: 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200',
      botaoSecundario: 'border border-emerald-300/30 text-emerald-200 hover:bg-emerald-300/10',
      miudo: 'text-emerald-100/55',
    },
  },
}

const ICONES: Record<CouponPromoTone, typeof Sparkles> = {
  destaque: Sparkles,
  urgencia: Flame,
  economia: PiggyBank,
}

/** "termina em 2 dias" / "termina em 3 h". Só aparece quando há prazo real. */
function prazoRestante(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  const fim = new Date(expiresAt).getTime()
  if (Number.isNaN(fim)) return null
  const restante = fim - Date.now()
  if (restante <= 0) return null
  const horas = Math.floor(restante / 3_600_000)
  if (horas < 1) return `termina em ${Math.max(1, Math.floor(restante / 60_000))} min`
  if (horas < 24) return `termina em ${horas} h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'termina amanhã' : `termina em ${dias} dias`
}

export function CouponPromo({
  itens,
  planKey,
  aparencia = 'app',
  onAplicar,
  codigoAplicado,
  className,
}: Props) {
  const [promo, setPromo] = useState<CouponPromoPayload | null>(null)
  const [copiado, setCopiado] = useState(false)

  // A string estabiliza o efeito: sem ela, o array de itens é uma referência
  // nova a cada render e a busca entraria em laço.
  const chaveDosItens = useMemo(
    () => itens.map((item) => `${item.itemType}:${item.itemId}:${item.materialType || ''}`).join('|'),
    [itens],
  )

  const cancelado = useRef(false)
  useEffect(() => {
    cancelado.current = false
    if (!chaveDosItens) {
      setPromo(null)
      return
    }
    const params = new URLSearchParams()
    for (const parte of chaveDosItens.split('|')) {
      // O terceiro campo (materialType) sai da chave quando está vazio, para
      // não mandar "material:id:" com dois-pontos solto.
      params.append('item', parte.replace(/:$/, ''))
    }
    if (planKey) params.set('planKey', planKey)

    fetch(`/api/coupons/promo?${params.toString()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { promos: [] }))
      .then((data) => {
        if (cancelado.current) return
        setPromo(data?.promos?.[0] || null)
      })
      .catch(() => {
        if (!cancelado.current) setPromo(null)
      })

    return () => {
      cancelado.current = true
    }
  }, [chaveDosItens, planKey])

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(t)
  }, [copiado])

  if (!promo) return null
  // Já aplicado: a faixa cumpriu o papel e sai de cena em vez de repetir o
  // convite ao lado do desconto que já está na tela.
  if (promo.code && codigoAplicado && promo.code === codigoAplicado.toUpperCase()) return null

  const pele = PELES[aparencia][promo.tone] || PELES[aparencia].destaque
  const Icone = ICONES[promo.tone] || Sparkles
  const prazo = prazoRestante(promo.expiresAt)

  const copiar = async () => {
    if (!promo.code) return
    try {
      await navigator.clipboard.writeText(promo.code)
      setCopiado(true)
    } catch {
      /* clipboard bloqueado: o código está escrito na tela para digitar */
    }
  }

  return (
    <div className={cn('rounded-lg border p-3.5', pele.cartao, className)}>
      <div className="flex items-start gap-2.5">
        <Icone className={cn('mt-0.5 h-4 w-4 flex-none', pele.titulo)} strokeWidth={2.4} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className={cn('text-sm font-bold leading-snug', pele.titulo)}>{promo.headline}</p>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-black',
                pele.codigo,
              )}
            >
              <BadgePercent className="h-3 w-3" aria-hidden />
              {promo.discountLabel}
            </span>
          </div>

          {promo.subtext ? (
            <p className={cn('mt-1 text-xs leading-relaxed', pele.texto)}>{promo.subtext}</p>
          ) : null}

          {promo.code ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex h-8 items-center rounded-md border px-2.5 font-mono text-sm font-black tracking-wider',
                  pele.codigo,
                )}
              >
                {promo.code}
              </span>
              {onAplicar ? (
                <button
                  type="button"
                  onClick={() => onAplicar(promo.code as string)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-black transition active:scale-95',
                    pele.botao,
                  )}
                >
                  Aplicar cupom
                </button>
              ) : null}
              <button
                type="button"
                onClick={copiar}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition active:scale-95',
                  pele.botaoSecundario,
                )}
              >
                {copiado ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          ) : null}

          {promo.conditions.length > 0 || prazo ? (
            <p className={cn('mt-2 text-[11px] leading-relaxed', pele.miudo)}>
              {[...promo.conditions, prazo].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
