'use client'

import { useEffect, useState } from 'react'
import type { PlanoResumo, ResumoAtlas } from '@/components/radiologia/vitrine'

export interface AcessoTomografia {
  isAuthenticated: boolean
  access: { hasFullAccess: boolean; reason: string; includedPlan: string | null }
  product: {
    isActive: boolean
    currentPrice: number
    price: number
    plans?: PlanoResumo[]
    pricingEventId?: string | null
  }
  resumo?: ResumoAtlas
}

const CHAVE_SESSAO = 'radiologia:acesso:v1'

/**
 * Uma consulta por sessão, e não uma por página.
 *
 * O veredito de acesso é o mesmo para as quatro rotas do Manual de Radiologia
 * (home, tomografia, série, atlas de Raio-X e cada incidência). Antes, cada
 * navegação remontava o hook, disparava outro `fetch` e devolvia a tela ao
 * spinner enquanto o servidor repetia a mesma resposta — era o "carregando"
 * que aparecia de novo a cada clique.
 *
 * Agora há dois níveis de memória. A promessa em escopo de módulo dedupa as
 * chamadas simultâneas e sobrevive à navegação client-side; o `sessionStorage`
 * sobrevive ao recarregamento da página, então a segunda visita já nasce com o
 * veredito e nunca pisca. Uma sessão nova (aba nova, login, logout) recomeça do
 * zero — que é exatamente quando o acesso pode ter mudado.
 */
let promessa: Promise<AcessoTomografia | null> | null = null

function lerCache(): AcessoTomografia | null {
  if (typeof window === 'undefined') return null
  try {
    const bruto = window.sessionStorage.getItem(CHAVE_SESSAO)
    return bruto ? (JSON.parse(bruto) as AcessoTomografia) : null
  } catch {
    return null
  }
}

function gravarCache(dados: AcessoTomografia) {
  try {
    window.sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados))
  } catch {
    /* modo privado / cota cheia: seguir sem cache é aceitável */
  }
}

function buscarAcesso(): Promise<AcessoTomografia | null> {
  if (promessa) return promessa
  promessa = fetch('/api/manual-clinico/tomografia')
    .then((resposta) => (resposta.ok ? resposta.json() : null))
    .then((dados: AcessoTomografia | null) => {
      if (dados) gravarCache(dados)
      return dados
    })
    .catch(() => {
      // Falha de rede não deve congelar o veredito: a próxima montagem tenta
      // de novo em vez de reusar uma promessa já rejeitada.
      promessa = null
      return null
    })
  return promessa
}

/** Invalida o veredito — usado após checkout/ativação mudarem o acesso. */
export function limparAcessoRadiologia() {
  promessa = null
  try {
    window.sessionStorage.removeItem(CHAVE_SESSAO)
  } catch {
    /* nada a fazer */
  }
}

/**
 * Estado de acesso ao Manual de Radiologia.
 *
 * A checagem é feita no servidor (a rota consulta compra ativa, plano Plus+ e
 * admin) e nunca no cliente — o que chega aqui é só o veredito. Todas as
 * páginas do atlas compartilham este hook para que a regra viva num lugar só.
 */
export function useAcessoTomografia() {
  const [dados, setDados] = useState<AcessoTomografia | null>(() => lerCache())
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    let vivo = true
    const emCache = lerCache()
    if (emCache) {
      // Já se sabe o veredito: renderiza sem intervalo nenhum e revalida em
      // segundo plano, sem devolver a página ao estado de carregamento.
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
