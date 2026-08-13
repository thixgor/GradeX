import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ATLAS_SYSTEMS,
  ATLAS_TOTALS,
  flattenCollections,
} from '@/lib/atlas-anatomia/catalogo'

describe('catálogo do Atlas de Anatomia', () => {
  it('contém o acervo completo sincronizado da UFJF', () => {
    expect(ATLAS_SYSTEMS).toHaveLength(10)
    expect(ATLAS_TOTALS).toEqual({ pieces: 418, markers: 2382 })
  })

  it('toda prancha aponta para um arquivo local e todo marcador tem coordenadas válidas', () => {
    for (const system of ATLAS_SYSTEMS) {
      expect(existsSync(join(process.cwd(), 'public', system.cover))).toBe(true)

      for (const collection of flattenCollections(system.collections)) {
        for (const piece of collection.pieces || []) {
          expect(piece.image.startsWith('/atlas-anatomia/acervo/')).toBe(true)
          expect(existsSync(join(process.cwd(), 'public', piece.image))).toBe(true)

          for (const marker of piece.markers) {
            expect(marker.title.trim().length).toBeGreaterThan(0)
            expect(marker.x).toBeGreaterThanOrEqual(0)
            expect(marker.x).toBeLessThanOrEqual(1)
            expect(marker.y).toBeGreaterThanOrEqual(0)
            expect(marker.y).toBeLessThanOrEqual(1)
          }
        }
      }
    }
  })
})
