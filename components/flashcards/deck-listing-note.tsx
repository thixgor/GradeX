'use client'

import { Globe, EyeOff, Link as LinkIcon, Lock, ShoppingCart, AlertTriangle } from 'lucide-react'
import type { DeckListingStatus, DeckListingBlocker } from '@/lib/flashcard-manual'
import { cn } from '@/lib/utils'

/**
 * "Está público, por que não aparece em /flashcards?"
 *
 * Porque "Público" é um campo e a listagem depende de quatro. Um deck oculto
 * por um administrador, ou um deck pago, continua estampando o selo verde de
 * público — e nunca chega à Comunidade. Esta linha, visível só para quem
 * administra o deck, diz qual é o caso em vez de deixar o dono conferindo a
 * aba de novo.
 */

const MOTIVO: Record<DeckListingBlocker, { icon: typeof Globe; texto: string }> = {
  private: {
    icon: Lock,
    texto: 'Só você vê este deck. Mude a visibilidade para Público.',
  },
  unlisted: {
    icon: LinkIcon,
    texto: 'Não-listado abre para quem tem o link, mas não entra na Comunidade. Mude para Público.',
  },
  hidden: {
    icon: EyeOff,
    texto: 'Um administrador ocultou este deck. Ele fica fora da Comunidade e da Loja até ser reexibido.',
  },
  paid: {
    icon: ShoppingCart,
    texto: 'Deck pago não entra na Comunidade (que é a prateleira gratuita) — ele aparece na Loja e em /materiais.',
  },
  paid_personal: {
    icon: AlertTriangle,
    texto: 'Deck pago só entra na Loja quando é Oficial, e este está como Pessoal — então ele não aparece em lugar nenhum. Mude o tipo para Oficial nas configurações de admin, ou deixe o deck gratuito.',
  },
}

export function DeckListingNote({ listing, className, onHero = false }: {
  listing: DeckListingStatus | null | undefined
  className?: string
  /** Sobre a capa do deck, onde o texto disputa com a foto de fundo. */
  onHero?: boolean
}) {
  if (!listing) return null

  // Na capa não dá para contar com a cor do texto: o fundo é uma imagem.
  const base = onHero
    ? 'inline-flex items-start gap-1.5 rounded-xl bg-black/45 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm'
    : 'inline-flex items-start gap-1.5 text-[11px]'

  if (listing.listedInCommunity) {
    return (
      <p className={cn(base, !onHero && 'text-emerald-700 dark:text-emerald-400', className)}>
        <Globe className="mt-px h-3.5 w-3.5 shrink-0" />
        Aparece na Comunidade em /flashcards.
      </p>
    )
  }

  // O primeiro impedimento é o que resolve o caso; listar os quatro só faria
  // o dono escolher qual ler.
  const blocker = listing.blockers[0]
  if (!blocker) return null
  const { icon: Icon, texto } = MOTIVO[blocker]

  return (
    <p className={cn(base, !onHero && 'text-amber-700 dark:text-amber-400', className)}>
      <Icon className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>
        <span className="font-semibold">Não aparece na Comunidade.</span>{' '}
        {texto}
        {listing.listedInStore && blocker !== 'paid' && ' Continua visível na Loja.'}
      </span>
    </p>
  )
}
