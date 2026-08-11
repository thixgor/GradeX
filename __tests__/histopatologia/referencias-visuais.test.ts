import { describe, expect, it } from 'vitest'

import { FONTES, hostPermitido } from '@/lib/histopatologia/direitos'
import { DOENCAS } from '@/lib/histopatologia/editorial'
import {
  REFERENCIAS_VISUAIS_EXTERNAS,
  referenciasVisuaisDaDoenca,
} from '@/lib/histopatologia/editorial/referencias-visuais'

describe('referências visuais externas', () => {
  const entradas = Object.entries(REFERENCIAS_VISUAIS_EXTERNAS).flatMap(([slug, referencias]) =>
    referencias.map((referencia) => ({ slug, referencia })),
  )

  it('representa as três fontes complementares solicitadas', () => {
    const fontes = new Set(entradas.map(({ referencia }) => referencia.fonteId))
    expect(fontes).toEqual(new Set(['pathology-outlines', 'webpathology', 'webpath-utah']))
  })

  it('vincula cada conjunto a um capítulo aprofundado existente', () => {
    const slugs = new Set(DOENCAS.map((doenca) => doenca.slug))
    for (const slug of Object.keys(REFERENCIAS_VISUAIS_EXTERNAS)) {
      expect(slugs.has(slug), slug).toBe(true)
      expect(referenciasVisuaisDaDoenca(slug).length, slug).toBeGreaterThan(0)
    }
  })

  it('mantém títulos traduzidos, descrição aprofundada e roteiro de leitura', () => {
    for (const { referencia } of entradas) {
      expect(referencia.titulo.length, referencia.id).toBeGreaterThan(20)
      expect(referencia.tituloOriginal.length, referencia.id).toBeGreaterThan(5)
      expect(referencia.descricaoDidatica.length, referencia.id).toBeGreaterThan(120)
      expect(referencia.oQueObservar.length, referencia.id).toBeGreaterThanOrEqual(3)
      expect(referencia.oQueObservar.every((item) => item.length > 15), referencia.id).toBe(true)
    }
  })

  it('incorpora somente imagens WebPath autorizadas e mantém as demais como links', () => {
    for (const { referencia } of entradas) {
      expect(referencia.urlPaginaFonte).toMatch(/^https:\/\//)
      expect(hostPermitido(referencia.fonteId, referencia.urlPaginaFonte), referencia.id).toBe(true)
      expect(FONTES[referencia.fonteId]).toBeDefined()
      if (referencia.fonteId === 'webpath-utah') {
        expect(referencia.urlImagem, referencia.id).toMatch(/^https:\/\/webpath\.med\.utah\.edu\/jpeg\d+\/.+\.jpg$/i)
        expect(hostPermitido(referencia.fonteId, referencia.urlImagem), referencia.id).toBe(true)
      } else {
        expect(referencia).not.toHaveProperty('urlImagem')
      }
      expect(referencia).not.toHaveProperty('urlVisualizador')
    }
  })

  it('não duplica identificadores nem páginas', () => {
    const ids = entradas.map(({ referencia }) => referencia.id)
    const urls = entradas.map(({ referencia }) => referencia.urlPaginaFonte)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(urls).size).toBe(urls.length)
  })
})
