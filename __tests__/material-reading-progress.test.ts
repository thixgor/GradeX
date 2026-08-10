import { beforeEach, describe, expect, it } from 'vitest'

/**
 * O módulo é client-side (guarda tudo em localStorage) e só é exercitado no
 * navegador, então aqui montamos o mínimo de `window` que ele consome antes de
 * importá-lo. O ambiente do vitest neste repo é `node`, sem jsdom.
 */
class MemoryStorage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null
  }
  getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value))
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  clear() {
    this.data.clear()
  }
}

const storage = new MemoryStorage()
;(globalThis as any).window = {
  localStorage: storage,
  dispatchEvent: () => true,
}

const {
  clearReadingProgress,
  readRecentReadings,
  readSavedPosition,
  readingPercent,
  recordReadingProgress,
  removeReadingProgress,
  writeSavedPosition,
} = await import('@/lib/material-reading-progress')

const RECENT_KEY = 'domineaqui:pdf-viewer:recent:v1'

function entry(id: string, page = 10, updatedAt = Date.now()) {
  return {
    materialId: id,
    title: `Material ${id}`,
    page,
    totalPages: 100,
    mode: 'continuous' as const,
    updatedAt,
  }
}

describe('material-reading-progress', () => {
  beforeEach(() => {
    storage.clear()
  })

  it('devolve lista vazia quando nunca houve leitura', () => {
    expect(readRecentReadings()).toEqual([])
  })

  it('ignora conteúdo corrompido em vez de estourar', () => {
    storage.setItem(RECENT_KEY, '{isto nao e json')
    expect(readRecentReadings()).toEqual([])

    storage.setItem(RECENT_KEY, JSON.stringify({ nao: 'array' }))
    expect(readRecentReadings()).toEqual([])

    storage.setItem(RECENT_KEY, JSON.stringify([{ title: 'sem id' }, null, 42]))
    expect(readRecentReadings()).toEqual([])
  })

  it('ordena da leitura mais recente para a mais antiga', () => {
    recordReadingProgress(entry('a', 5, 1_000))
    recordReadingProgress(entry('b', 5, 3_000))
    recordReadingProgress(entry('c', 5, 2_000))

    expect(readRecentReadings().map((item) => item.materialId)).toEqual(['b', 'c', 'a'])
  })

  it('atualiza o material em vez de duplicá-lo', () => {
    recordReadingProgress(entry('a', 5, 1_000))
    recordReadingProgress(entry('a', 42, 2_000))

    const recent = readRecentReadings()
    expect(recent).toHaveLength(1)
    expect(recent[0].page).toBe(42)
  })

  it('respeita o limite pedido e o teto do índice', () => {
    for (let i = 0; i < 12; i += 1) {
      recordReadingProgress(entry(`m${i}`, 1, 1_000 + i))
    }
    expect(readRecentReadings()).toHaveLength(8)
    expect(readRecentReadings(3).map((item) => item.materialId)).toEqual(['m11', 'm10', 'm9'])
  })

  it('remove um material da lista sem apagar a posição salva', () => {
    recordReadingProgress(entry('a'))
    writeSavedPosition('a', { page: 33, mode: 'single' })

    removeReadingProgress('a')

    expect(readRecentReadings()).toEqual([])
    expect(readSavedPosition('a')).toEqual({ page: 33, mode: 'single' })
  })

  it('limpa recentes e posições no logout', () => {
    recordReadingProgress(entry('a'))
    writeSavedPosition('a', { page: 33, mode: 'single' })

    clearReadingProgress()

    expect(readRecentReadings()).toEqual([])
    expect(readSavedPosition('a')).toBeNull()
  })

  it('descarta modo e página inválidos ao ler a posição', () => {
    storage.setItem(
      'domineaqui:pdf-viewer:last-position:a',
      JSON.stringify({ page: -3, mode: 'zoom' })
    )
    expect(readSavedPosition('a')).toEqual({ page: undefined, mode: undefined })
  })

  it('calcula o percentual lido e omite quando o total é desconhecido', () => {
    expect(readingPercent({ ...entry('a'), page: 50, totalPages: 200 })).toBe(25)
    expect(readingPercent({ ...entry('a'), page: 5, totalPages: 0 })).toBeNull()
    // Página além do total (PDF trocado) não passa de 100%.
    expect(readingPercent({ ...entry('a'), page: 500, totalPages: 100 })).toBe(100)
  })
})
