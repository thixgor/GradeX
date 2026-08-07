'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CategoriaId, Ferramenta } from '@/lib/ferramentas-clinicas/tipos'

const CHAVE = 'ferramentas-clinicas:favoritos'
const LIMITE = 60

/**
 * O que fica salvo de cada favorito.
 *
 * Guardamos um retrato da ferramenta — nome, sigla, resumo, área — e não apenas
 * o id. O motivo está na página inicial: ela não carrega nenhum dos 15 módulos
 * de conteúdo, e é isso que a mantém em 4 kB. Se o favorito fosse só um id, a
 * página precisaria baixar o catálogo inteiro para descobrir como se chama a
 * ferramenta salva — trocaríamos a lista de favoritos pelo carregamento que a
 * arquitetura toda foi desenhada para evitar.
 *
 * O id continua sendo a chave de verdade: o retrato é rótulo, e o link é
 * montado a partir do id e da categoria. Se o texto de uma ferramenta mudar, o
 * rótulo fica velho até `sincronizar` reencontrá-la — o que acontece sozinho na
 * próxima vez que a área dela for aberta.
 */
export interface FavoritoSalvo {
  id: string
  nome: string
  sigla?: string
  resumo: string
  categoria: CategoriaId
  em: number
}

/**
 * Cache de módulo com lista de ouvintes.
 *
 * Existe porque a mesma lista é lida por vários componentes ao mesmo tempo — a
 * estrela de cada painel, o contador do cabeçalho, a seção da página inicial.
 * Sem um ponto único de verdade, marcar um favorito atualizaria a estrela mas
 * deixaria o contador para trás até a próxima navegação.
 */
let cache: FavoritoSalvo[] | null = null
const ouvintes = new Set<() => void>()

function ehValido(x: unknown): x is FavoritoSalvo {
  if (!x || typeof x !== 'object') return false
  const f = x as Record<string, unknown>
  return typeof f.id === 'string' && typeof f.nome === 'string' && typeof f.categoria === 'string'
}

function ler(): FavoritoSalvo[] {
  if (cache) return cache
  if (typeof window === 'undefined') return []
  let lista: FavoritoSalvo[] = []
  try {
    const bruto: unknown = JSON.parse(localStorage.getItem(CHAVE) || '[]')
    if (Array.isArray(bruto)) {
      lista = bruto.filter(ehValido).map((f) => ({
        id: f.id,
        nome: f.nome,
        sigla: typeof f.sigla === 'string' ? f.sigla : undefined,
        resumo: typeof f.resumo === 'string' ? f.resumo : '',
        categoria: f.categoria,
        em: typeof f.em === 'number' ? f.em : 0,
      }))
    }
  } catch {
    /* armazenamento corrompido ou indisponível — começa vazio */
  }
  cache = lista
  return lista
}

function escrever(prox: FavoritoSalvo[]) {
  const cortado = prox.slice(0, LIMITE)
  cache = cortado
  try {
    localStorage.setItem(CHAVE, JSON.stringify(cortado))
  } catch {
    /* modo privado ou cota estourada — a sessão continua funcionando em memória */
  }
  ouvintes.forEach((avisar) => avisar())
}

function retratar(f: Ferramenta): FavoritoSalvo {
  return {
    id: f.id,
    nome: f.nome,
    sigla: f.sigla,
    resumo: f.resumo,
    categoria: f.categorias[0],
    em: Date.now(),
  }
}

/** Favoritos das Ferramentas Clínicas, guardados no navegador. */
export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<FavoritoSalvo[]>([])
  const [pronto, setPronto] = useState(false)

  // A leitura só acontece depois da montagem: no servidor a lista é vazia, e
  // manter o primeiro render do cliente igual ao do servidor evita divergência
  // de hidratação. O `pronto` deixa a interface distinguir "ainda não li" de
  // "li e não há nada", que pedem telas diferentes.
  useEffect(() => {
    const atualizar = () => setFavoritos(ler())
    atualizar()
    setPronto(true)
    ouvintes.add(atualizar)

    // Outra aba mexeu na mesma chave: invalida o cache e relê.
    const aoStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== CHAVE) return
      cache = null
      atualizar()
    }
    window.addEventListener('storage', aoStorage)
    return () => {
      ouvintes.delete(atualizar)
      window.removeEventListener('storage', aoStorage)
    }
  }, [])

  const alternar = useCallback((f: Ferramenta) => {
    const atual = ler()
    const jaTem = atual.some((x) => x.id === f.id)
    escrever(jaTem ? atual.filter((x) => x.id !== f.id) : [retratar(f), ...atual])
  }, [])

  const remover = useCallback((id: string) => {
    escrever(ler().filter((x) => x.id !== id))
  }, [])

  const limpar = useCallback(() => escrever([]), [])

  const ehFavorito = useCallback((id: string) => favoritos.some((x) => x.id === id), [favoritos])

  /**
   * Atualiza os rótulos salvos a partir das ferramentas reais.
   *
   * Chamada pelas páginas de área, que já têm as ferramentas carregadas. Só
   * grava quando algo mudou de fato — gravar sempre dispararia os ouvintes e o
   * efeito que chama esta função voltaria a rodar, em laço.
   */
  const sincronizar = useCallback((ferramentas: Ferramenta[]) => {
    const atual = ler()
    if (atual.length === 0) return
    const porId = new Map(ferramentas.map((f) => [f.id, f]))
    let mudou = false
    const prox = atual.map((fav) => {
      const f = porId.get(fav.id)
      if (!f) return fav
      const categoria = f.categorias[0]
      if (f.nome === fav.nome && f.sigla === fav.sigla && f.resumo === fav.resumo && categoria === fav.categoria) {
        return fav
      }
      mudou = true
      return { ...fav, nome: f.nome, sigla: f.sigla, resumo: f.resumo, categoria }
    })
    if (mudou) escrever(prox)
  }, [])

  return { favoritos, pronto, alternar, remover, limpar, ehFavorito, sincronizar }
}
