/**
 * Cache de dados de página que sobrevive à navegação (stale-while-revalidate).
 *
 * Por que existe: o `AppShell` é montado dentro de cada `page.tsx`, então toda
 * navegação desmonta e remonta a página inteira. Os caches que as páginas já
 * tinham viviam em `useRef` — ou seja, morriam no unmount — e voltar para uma
 * tela já visitada refazia todos os fetches do zero, com skeleton em tela.
 *
 * Este módulo guarda os dados em escopo de módulo (sobrevive a remontagens) e,
 * opcionalmente, em `sessionStorage` (sobrevive a reload da aba). A leitura é
 * SÍNCRONA, então a página pode renderizar o conteúdo da última visita no
 * primeiro frame e revalidar por baixo.
 *
 * IMPORTANTE — não use para dados sensíveis. Limites de plano, créditos,
 * pagamentos e status de assinatura devem continuar sendo buscados frescos:
 * mostrar um valor desatualizado ali confunde o usuário sobre o que ele pode
 * fazer ou já pagou.
 */

interface Entry<T> {
  data: T
  savedAt: number
}

const memory = new Map<string, Entry<unknown>>()

const STORAGE_PREFIX = 'da_pagecache_v1:'
/** Acima disso o dado é descartado — evita ressuscitar sessões antigas. */
const MAX_AGE_MS = 30 * 60 * 1000

function storageKey(key: string): string {
  return STORAGE_PREFIX + key
}

/**
 * Lê o valor em cache, se houver e ainda estiver dentro de `MAX_AGE_MS`.
 * Síncrono de propósito: serve para inicializar `useState` sem flash de vazio.
 */
export function readPageCache<T>(key: string): T | null {
  const hit = memory.get(key) as Entry<T> | undefined
  if (hit) {
    if (Date.now() - hit.savedAt > MAX_AGE_MS) {
      memory.delete(key)
      return null
    }
    return hit.data
  }

  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(storageKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Entry<T>
    if (!parsed || typeof parsed.savedAt !== 'number') return null
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.sessionStorage.removeItem(storageKey(key))
      return null
    }
    // Reidrata a memória para as próximas leituras não tocarem no storage.
    memory.set(key, parsed as Entry<unknown>)
    return parsed.data
  } catch {
    return null
  }
}

/** Grava o valor. Falhas de quota/modo privado são silenciosas por design. */
export function writePageCache<T>(key: string, data: T): void {
  const entry: Entry<T> = { data, savedAt: Date.now() }
  memory.set(key, entry as Entry<unknown>)

  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(storageKey(key), JSON.stringify(entry))
  } catch {
    // quota excedida — o cache em memória continua valendo
  }
}

/** Invalida uma chave (após criar/editar/excluir algo que a página lista). */
export function invalidatePageCache(key: string): void {
  memory.delete(key)
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(storageKey(key))
  } catch {
    // ignora
  }
}

/**
 * Limpa tudo. Chamado no logout — sem isso, o próximo usuário a entrar no
 * mesmo aparelho veria os dados em cache do anterior.
 */
export function clearPageCache(): void {
  memory.clear()
  if (typeof window === 'undefined') return
  try {
    const keys: string[] = []
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i)
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k)
    }
    keys.forEach((k) => window.sessionStorage.removeItem(k))
  } catch {
    // ignora
  }
}
