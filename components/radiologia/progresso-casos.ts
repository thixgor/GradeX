'use client'

import type { Modalidade } from '@/lib/radiologia/casos-imagem-tipos'

/**
 * Progresso e preferência de modo dos casos com apontamentos.
 *
 * Fica no navegador de quem estuda: é conveniência pessoal, não registro. Toda
 * leitura e escrita é protegida — em janela anônima ou com armazenamento
 * bloqueado, a página funciona como se fosse a primeira visita.
 */

export type ModoCaso = 'prova' | 'estudo'
export type Resultado = 'certo' | 'errado'

const CHAVE_MODO = 'radiologia:casos:modo'
const chaveResultado = (m: Modalidade) => `radiologia:casos:${m}:resultados`

export function lerModo(): ModoCaso {
  try {
    return localStorage.getItem(CHAVE_MODO) === 'estudo' ? 'estudo' : 'prova'
  } catch {
    return 'prova'
  }
}

export function gravarModo(modo: ModoCaso) {
  try {
    localStorage.setItem(CHAVE_MODO, modo)
  } catch {}
}

export function lerResultados(m: Modalidade): Record<string, Resultado> {
  try {
    return JSON.parse(localStorage.getItem(chaveResultado(m)) ?? '{}')
  } catch {
    return {}
  }
}

export function gravarResultado(m: Modalidade, slug: string, certo: boolean) {
  try {
    const atual = lerResultados(m)
    atual[slug] = certo ? 'certo' : 'errado'
    localStorage.setItem(chaveResultado(m), JSON.stringify(atual))
  } catch {}
}
