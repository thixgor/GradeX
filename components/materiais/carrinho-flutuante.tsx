'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import { useMaterialCart } from '@/context/MaterialCartContext'
import { abrirCarrinho } from '@/lib/abrir-carrinho'
import { formatBRL } from './shared'

/**
 * A barra do carrinho na loja: aparece assim que entra o primeiro item e fica
 * flutuando embaixo enquanto a pessoa continua escolhendo. É o lembrete de que
 * dá para juntar vários materiais e pagar tudo de uma vez — o botão do
 * cabeçalho, sozinho, some de vista na rolagem.
 *
 * `acimaDoAviso`: sobe um degrau quando o aviso de visitante (fixo no rodapé
 * do AppShell) está na tela.
 */
export function CarrinhoFlutuante({ acimaDoAviso = false }: { acimaDoAviso?: boolean }) {
  const { itemCount, subtotal, items } = useMaterialCart()
  // O carrinho mora no localStorage: o servidor não o conhece, então a barra
  // só decide se aparece depois da montagem (sem divergir na hidratação).
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  const visivel = itemCount > 0
  const capas = items.filter(item => item.coverImage).slice(-3)

  if (!montado) return null

  return (
    <div
      className="ios-barra-inferior pointer-events-none flex justify-center"
      data-degrau={acimaDoAviso ? 'true' : undefined}
      data-visivel={visivel ? 'true' : 'false'}
      aria-hidden={!visivel}
    >
      <button
        type="button"
        onClick={abrirCarrinho}
        tabIndex={visivel ? 0 : -1}
        className="ios-vidro ios-toque pointer-events-auto flex w-full max-w-md items-center sm:max-w-lg gap-3 rounded-[22px] py-2 pl-2 pr-3 text-left"
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--ios-tinta)] text-white">
          <ShoppingBag className="h-5 w-5" />
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ios-rotulo)] px-1 text-[11px] font-bold tabular-nums text-[var(--ios-chao)] ring-2 ring-[var(--ios-cartao-solido)]">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold tracking-[-0.01em]">
            {itemCount} {itemCount === 1 ? 'item' : 'itens'} no carrinho
          </span>
          <span className="ios-rotulo-2 block truncate text-[13px]">
            <span className="font-semibold tabular-nums text-[var(--ios-rotulo)]">{formatBRL(subtotal)}</span>
            {' · '}pague tudo de uma vez
          </span>
        </span>
        {capas.length > 0 && (
          <span className="hidden shrink-0 -space-x-3 sm:flex" aria-hidden>
            {capas.map(item => (
              <span
                key={`${item.itemType}:${item.itemId}`}
                className="relative h-9 w-9 overflow-hidden rounded-[10px] ring-2 ring-[var(--ios-cartao-solido)]"
              >
                <Image src={item.coverImage as string} alt="" fill sizes="36px" className="object-cover" />
              </span>
            ))}
          </span>
        )}
        <span className="ios-tinta flex shrink-0 items-center text-[15px] font-semibold">
          Ver <ChevronRight className="h-5 w-5" />
        </span>
      </button>
    </div>
  )
}
