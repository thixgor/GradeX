'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { HistoricoDeUso } from '@/lib/busca-plataforma/motor'

/**
 * Memória local da busca: o que você procurou e o que você costuma abrir.
 *
 * Fica só neste aparelho, em `localStorage`. Mandar isso para o servidor seria
 * um perfil de navegação por usuário para ganhar uma reordenação de lista — o
 * ganho não paga o dado. E como é local, funciona offline e não custa
 * requisição nenhuma.
 */

const CHAVE_RECENTES = 'gradex:busca:recentes'
const CHAVE_USO = 'gradex:busca:uso'
const MAX_RECENTES = 6
/** Guardamos poucos itens: a cauda longa não muda ranking e só ocupa espaço. */
const MAX_USO = 40

interface RegistroDeUso {
  n: number
  t: number
}

function lerJson<T>(chave: string, padrao: T): T {
  if (typeof window === 'undefined') return padrao
  try {
    const cru = window.localStorage.getItem(chave)
    if (!cru) return padrao
    const valor = JSON.parse(cru)
    return valor ?? padrao
  } catch {
    return padrao
  }
}

function gravarJson(chave: string, valor: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // Cota cheia ou modo privativo: a busca funciona sem memória.
  }
}

export interface HistoricoBusca {
  /** Consultas recentes, da mais nova para a mais antiga. */
  recentes: string[]
  /** Formato que o motor entende, para o bônus de personalização. */
  historico: HistoricoDeUso
  /** Muda a cada gravação — serve de chave de cache do buscador. */
  versao: number
  registrarAbertura: (id: string) => void
  registrarConsulta: (consulta: string) => void
  esquecerRecentes: () => void
}

export function useHistoricoBusca(): HistoricoBusca {
  const [recentes, setRecentes] = useState<string[]>([])
  const [uso, setUso] = useState<Record<string, RegistroDeUso>>({})
  const [versao, setVersao] = useState(0)

  // Lido depois da montagem, não no `useState` inicial: `localStorage` não
  // existe no servidor e ler ali causaria divergência de hidratação.
  const carregado = useRef(false)
  useEffect(() => {
    if (carregado.current) return
    carregado.current = true
    setRecentes(lerJson<string[]>(CHAVE_RECENTES, []).slice(0, MAX_RECENTES))
    setUso(lerJson<Record<string, RegistroDeUso>>(CHAVE_USO, {}))
    setVersao(v => v + 1)
  }, [])

  const registrarAbertura = useCallback((id: string) => {
    setUso(anterior => {
      const registro = anterior[id]
      const proximo: Record<string, RegistroDeUso> = {
        ...anterior,
        [id]: { n: (registro?.n ?? 0) + 1, t: Date.now() },
      }

      // Poda pelos menos usados e mais antigos quando passa do teto.
      const chaves = Object.keys(proximo)
      if (chaves.length > MAX_USO) {
        chaves
          .sort((a, b) => proximo[a].n - proximo[b].n || proximo[a].t - proximo[b].t)
          .slice(0, chaves.length - MAX_USO)
          .forEach(chave => delete proximo[chave])
      }

      gravarJson(CHAVE_USO, proximo)
      return proximo
    })
    setVersao(v => v + 1)
  }, [])

  const registrarConsulta = useCallback((consulta: string) => {
    const limpa = consulta.trim()
    if (limpa.length < 2) return
    setRecentes(anterior => {
      const proximo = [limpa, ...anterior.filter(c => c.toLowerCase() !== limpa.toLowerCase())].slice(
        0,
        MAX_RECENTES,
      )
      gravarJson(CHAVE_RECENTES, proximo)
      return proximo
    })
  }, [])

  const esquecerRecentes = useCallback(() => {
    setRecentes([])
    gravarJson(CHAVE_RECENTES, [])
  }, [])

  // Memorizado: sem isto o objeto nasceria de novo a cada tecla digitada e
  // invalidaria todo `useMemo` da interface que depende dele.
  const historico = useMemo<HistoricoDeUso>(
    () => ({
      aberturas: Object.fromEntries(Object.entries(uso).map(([id, r]) => [id, r.n])),
      ultimaAbertura: Object.fromEntries(Object.entries(uso).map(([id, r]) => [id, r.t])),
    }),
    [uso],
  )

  return { recentes, historico, versao, registrarAbertura, registrarConsulta, esquecerRecentes }
}
