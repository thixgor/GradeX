'use client'

import { useEffect, useState } from 'react'

import type { AreaDoCatalogo } from './catalogo-tipos'

/**
 * Lâminas e doenças abertas recentemente — alimenta o "Continue estudando".
 *
 * O progresso do atlas por assunto (`progresso.ts`) só conhece as páginas do
 * currículo. As lâminas com zoom e as doenças não deixavam rastro, então a
 * fileira de retomada esquecia metade do que o aluno estudou. Este registro é
 * deliberadamente pequeno: o que é preciso para desenhar o cartão de volta, e
 * nada mais. Fica no navegador, como o resto do progresso do módulo; nada sai
 * daqui para o servidor.
 */

const CHAVE = 'histologia-vistos'
const MAXIMO = 16

export interface Visto {
  href: string
  titulo: string
  categoria: string
  area: AreaDoCatalogo
  imagem: string | null
  zoom: boolean
  em: number
}

function ler(): Visto[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return []
    const lista = JSON.parse(bruto)
    return Array.isArray(lista)
      ? lista.filter((v) => v && typeof v.href === 'string' && typeof v.titulo === 'string').slice(0, MAXIMO)
      : []
  } catch {
    return []
  }
}

export function registrarVisto(visto: Omit<Visto, 'em'>) {
  try {
    const lista = [{ ...visto, em: Date.now() }, ...ler().filter((v) => v.href !== visto.href)].slice(0, MAXIMO)
    window.localStorage.setItem(CHAVE, JSON.stringify(lista))
  } catch {
    // Navegação privada ou cota cheia: a retomada só deixa de lembrar.
  }
}

export function useVistos() {
  const [vistos, setVistos] = useState<Visto[]>([])
  const [carregado, setCarregado] = useState(false)
  useEffect(() => {
    setVistos(ler())
    setCarregado(true)
  }, [])
  return { vistos, carregado }
}
