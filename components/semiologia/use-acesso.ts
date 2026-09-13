'use client'

import { useEffect, useState } from 'react'

/**
 * Veredito de acesso ao Manual de Semiologia — uma consulta por sessão.
 *
 * Mesma mecânica do Manual de Radiologia (`components/tomografia/use-acesso`) e
 * pelo mesmo motivo: o veredito é idêntico para as sete rotas do módulo, e
 * refazer o `fetch` a cada navegação devolvia a tela ao esqueleto a cada
 * clique. A promessa em escopo de módulo dedupa chamadas simultâneas e
 * sobrevive à navegação client-side; o `sessionStorage` sobrevive ao recarregar.
 *
 * Chave de sessão própria (e não a da Radiologia) porque os dois módulos podem
 * divergir: o plano Plus+ pode incluir um e não o outro. Compartilhar a chave
 * faria um responder pelo outro.
 */
export interface PlanoResumo {
  key: string
  label: string
  price: number
  durationMonths: number | null
  enabled: boolean
}

export interface AcessoSemiologia {
  isAuthenticated: boolean
  access: { hasFullAccess: boolean; reason: string; includedPlan: string | null }
  product: { isActive: boolean; currentPrice: number; price: number; plans?: PlanoResumo[] }
  resumo?: {
    sinais: number
    vistas: number
    cenas: number
    estruturas: number
    janelas: number
    comparadores: number
    titulosVistas: string[]
    titulosJanelas: string[]
    titulosSinais: string[]
  }
}

const CHAVE_SESSAO = 'semiologia:acesso:v1'

let promessa: Promise<AcessoSemiologia | null> | null = null

function lerCache(): AcessoSemiologia | null {
  if (typeof window === 'undefined') return null
  try {
    const bruto = window.sessionStorage.getItem(CHAVE_SESSAO)
    return bruto ? (JSON.parse(bruto) as AcessoSemiologia) : null
  } catch {
    return null
  }
}

function gravarCache(dados: AcessoSemiologia) {
  try {
    window.sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados))
  } catch {
    /* modo privado ou cota cheia: seguir sem cache é aceitável */
  }
}

function buscarAcesso(): Promise<AcessoSemiologia | null> {
  if (promessa) return promessa
  promessa = fetch('/api/manual-clinico/semiologia')
    .then((resposta) => (resposta.ok ? resposta.json() : null))
    .then((dados: AcessoSemiologia | null) => {
      if (dados) gravarCache(dados)
      return dados
    })
    .catch(() => {
      // Falha de rede não congela o veredito: a próxima montagem tenta de novo
      // em vez de reusar uma promessa já rejeitada.
      promessa = null
      return null
    })
  return promessa
}

/** Invalida o veredito — usado após checkout ou ativação mudarem o acesso. */
export function limparAcessoSemiologia() {
  promessa = null
  try {
    window.sessionStorage.removeItem(CHAVE_SESSAO)
  } catch {
    /* nada a fazer */
  }
}

export function useAcessoSemiologia() {
  const [dados, setDados] = useState<AcessoSemiologia | null>(() => lerCache())
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    let vivo = true
    const emCache = lerCache()
    if (emCache) {
      setDados(emCache)
      setCarregado(true)
    }
    buscarAcesso().then((resposta) => {
      if (!vivo) return
      if (resposta) setDados(resposta)
      setCarregado(true)
    })
    return () => {
      vivo = false
    }
  }, [])

  return { dados, carregado }
}
