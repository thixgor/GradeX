import { describe, expect, it } from 'vitest'
import {
  CREDITO_CLINICAL_ANATOMY,
  ESTUDOS_RAIO_X,
  GUIAS_RAIO_X,
  TOTAL_ESTRUTURAS_RAIO_X,
  buscarEstudosRaioX,
  getEstudoRaioX,
} from '@/lib/radiologia/raio-x'

describe('catálogo de Raio-X', () => {
  it('cataloga todas as 28 incidências solicitadas', () => {
    expect(ESTUDOS_RAIO_X).toHaveLength(28)
    expect(new Set(ESTUDOS_RAIO_X.map((estudo) => estudo.id)).size).toBe(28)
  })

  it('mantém fonte, imagem e sobreposição para cada estrutura', () => {
    expect(TOTAL_ESTRUTURAS_RAIO_X).toBeGreaterThan(150)
    for (const estudo of ESTUDOS_RAIO_X) {
      expect(estudo.fonte).toBe(`https://www.clinicalanatomy.ca/radiology/${estudo.id}.html`)
      expect(estudo.imagem).toMatch(/^https:\/\/www\.clinicalanatomy\.ca\/radiology\//)
      expect(estudo.estruturas.length).toBeGreaterThan(1)
      for (const estrutura of estudo.estruturas) {
        expect(estrutura.nome.trim()).not.toBe('')
        expect(estrutura.original.trim()).not.toBe('')
        expect(estrutura.sobreposicao).toMatch(/^https:\/\/www\.clinicalanatomy\.ca\/radiology\//)
      }
    }
  })

  it('oferece guia aprofundado para todas as regiões', () => {
    for (const estudo of ESTUDOS_RAIO_X) {
      const guia = GUIAS_RAIO_X[estudo.regiao]
      expect(guia.contexto.length).toBeGreaterThan(80)
      expect(guia.tecnica.length).toBeGreaterThan(80)
      expect(guia.roteiro.length).toBeGreaterThanOrEqual(5)
      expect(guia.armadilhas.length).toBeGreaterThanOrEqual(3)
      expect(guia.perolas.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('busca em português e no termo anatômico original', () => {
    expect(buscarEstudosRaioX('clavícula').some((estudo) => estudo.id === 'thoraxBones')).toBe(true)
    expect(buscarEstudosRaioX('costophrenic').some((estudo) => estudo.id === 'thoraxBones')).toBe(true)
    expect(buscarEstudosRaioX('odontoide').some((estudo) => estudo.id === 'neckOdon')).toBe(true)
    expect(getEstudoRaioX('handAP')?.titulo).toBe('Mão e punho')
  })

  it('expõe a referência formal da autorização', () => {
    expect(CREDITO_CLINICAL_ANATOMY.autorizacao).toBe('AUTH-CA-RA-2026-0811')
  })
})
