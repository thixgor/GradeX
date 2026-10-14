'use client'

/**
 * Os lugares onde o anúncio na página pode aparecer.
 *
 * ## Dois tipos de lugar
 *
 * - No AppShell: dentro do `<main>` do AppShell, no topo e no fim do conteúdo. É
 *   onde ficam o dashboard, o manual clínico e quase todo o app logado — o
 *   anúncio entra abaixo do cabeçalho e ao lado da barra lateral, como parte
 *   da página.
 * - Global: no layout raiz, logo depois da página. Cobre as páginas que não
 *   usam o AppShell (monitorias, rifas, páginas públicas). Ali não há como
 *   saber onde termina o "cabeçalho" de cada página, então o anúncio aparece
 *   no fim, qualquer que seja a posição escolhida.
 *
 * Para os dois nunca aparecerem juntos, o AppShell se registra enquanto está
 * montado (`useShellComAnuncio`), e o `global` fica quieto nesse tempo.
 *
 * ## Custo
 *
 * O componente de verdade vem por `next/dynamic` (fora do pacote inicial) e só
 * depois que o navegador fica ocioso: o anúncio não disputa a primeira pintura
 * com o conteúdo que a pessoa veio ver.
 */

import dynamic from 'next/dynamic'
import { useEffect, useState, useSyncExternalStore } from 'react'

import type { AnuncioPosicao } from '@/lib/anuncio-midia'

const AnuncioNaPagina = dynamic(
  () => import('@/components/anuncio-na-pagina').then((m) => m.AnuncioNaPagina),
  { ssr: false },
)

let slotsDoShell = 0
const ouvintes = new Set<() => void>()

function avisar() {
  ouvintes.forEach((ouvinte) => ouvinte())
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

function useShellPresente(): boolean {
  return useSyncExternalStore(
    assinar,
    () => slotsDoShell > 0,
    () => false,
  )
}

/** Espera o navegador ficar ocioso (com teto), como o resto do "chrome". */
function useOcioso(tetoMs = 1500): boolean {
  const [pronto, setPronto] = useState(false)
  useEffect(() => {
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined
    if (typeof ric === 'function') {
      const id = ric(() => setPronto(true), { timeout: tetoMs })
      return () => (window as any).cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(() => setPronto(true), 600)
    return () => window.clearTimeout(id)
  }, [tetoMs])
  return pronto
}

/** Chamado no topo do AppShell: enquanto ele existe, o lugar global se cala. */
export function useShellComAnuncio() {
  useEffect(() => {
    slotsDoShell += 1
    avisar()
    return () => {
      slotsDoShell -= 1
      avisar()
    }
  }, [])
}

type SlotDeAnuncioProps = { posicao: AnuncioPosicao; global?: never } | { global: true; posicao?: never }

export function SlotDeAnuncio(props: SlotDeAnuncioProps) {
  const shellPresente = useShellPresente()
  const pronto = useOcioso()

  if (!pronto) return null
  if (props.global) {
    return shellPresente ? null : <AnuncioNaPagina posicao="todas" />
  }
  return <AnuncioNaPagina posicao={props.posicao} />
}
