import { describe, expect, it } from 'vitest'
import { NOTAS_ESTRUTURAS } from '@/lib/radiologia/estruturas'
import {
  CREDITO_CLINICAL_ANATOMY,
  ESTUDOS_RAIO_X,
  GUIAS_RAIO_X,
  REGIOES_RAIO_X,
  TOTAL_ESTRUTURAS_RAIO_X,
  buscarEstruturasRaioX,
  buscarEstudosRaioX,
  estudosDaRegiao,
  getEstudoRaioX,
  notaEstrutura,
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
      expect(guia.qualidade.length).toBeGreaterThanOrEqual(4)
      expect(guia.medidas.length).toBeGreaterThanOrEqual(4)
      expect(guia.quandoAvancar.length).toBeGreaterThan(120)
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

describe('dossiê por estrutura', () => {
  it('cobre todas as estruturas demarcadas, sem cair no texto genérico', () => {
    const semDossie: string[] = []
    for (const estudo of ESTUDOS_RAIO_X) {
      for (const estrutura of estudo.estruturas) {
        if (!NOTAS_ESTRUTURAS[estrutura.nome]) semDossie.push(estrutura.nome)
      }
    }
    expect(semDossie).toEqual([])
  })

  it('entrega os três campos obrigatórios com conteúdo real', () => {
    for (const [nome, nota] of Object.entries(NOTAS_ESTRUTURAS)) {
      expect(nota.resumo.length, `resumo de ${nome}`).toBeGreaterThan(40)
      expect(nota.identificar.length, `identificar de ${nome}`).toBeGreaterThan(40)
      expect(nota.clinica.length, `clínica de ${nome}`).toBeGreaterThan(40)
    }
  })

  it('não deixa nenhuma entrada órfã no dicionário de notas', () => {
    const usados = new Set(
      ESTUDOS_RAIO_X.flatMap((estudo) => estudo.estruturas.map((estrutura) => estrutura.nome)),
    )
    const orfas = Object.keys(NOTAS_ESTRUTURAS).filter((nome) => !usados.has(nome))
    expect(orfas).toEqual([])
  })

  it('resolve a nota a partir do estudo e da estrutura', () => {
    const estudo = getEstudoRaioX('handAP')!
    const escafoide = estudo.estruturas.find((estrutura) => estrutura.nome === 'Escafoide')!
    expect(notaEstrutura(estudo, escafoide).alerta).toContain('tabaqueira')
  })
})

describe('navegação por região', () => {
  it('agrupa as 28 incidências em regiões sem perder nenhuma', () => {
    expect(REGIOES_RAIO_X).toHaveLength(9)
    const somaEstudos = REGIOES_RAIO_X.reduce((total, regiao) => total + regiao.totalEstudos, 0)
    const somaEstruturas = REGIOES_RAIO_X.reduce((total, regiao) => total + regiao.totalEstruturas, 0)
    expect(somaEstudos).toBe(ESTUDOS_RAIO_X.length)
    expect(somaEstruturas).toBe(TOTAL_ESTRUTURAS_RAIO_X)
    for (const regiao of REGIOES_RAIO_X) {
      expect(regiao.resumo.length).toBeGreaterThan(20)
      expect(regiao.capa).toMatch(/^https:\/\//)
      expect(estudosDaRegiao(regiao.id)).toHaveLength(regiao.totalEstudos)
    }
  })

  it('distingue as incidências de uma mesma região por camada e resumo', () => {
    for (const regiao of REGIOES_RAIO_X) {
      const estudos = estudosDaRegiao(regiao.id)
      const rotulos = estudos.map((estudo) => `${estudo.camada} · ${estudo.incidencia}`)
      expect(new Set(rotulos).size, `rótulos ambíguos em ${regiao.titulo}`).toBe(estudos.length)
      for (const estudo of estudos) {
        expect(estudo.camada.trim()).not.toBe('')
        expect(estudo.resumo.length).toBeGreaterThan(30)
      }
    }
  })

  it('dá a cada estrutura um slug único dentro do estudo', () => {
    for (const estudo of ESTUDOS_RAIO_X) {
      const slugs = estudo.estruturas.map((estrutura) => estrutura.slug)
      expect(new Set(slugs).size, `slugs repetidos em ${estudo.id}`).toBe(slugs.length)
      for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

describe('busca no nível da estrutura', () => {
  it('leva direto à demarcação certa', () => {
    const encontrados = buscarEstruturasRaioX('escafoide')
    expect(encontrados.length).toBeGreaterThan(0)
    const primeiro = encontrados[0]
    expect(primeiro.estrutura.nome).toBe('Escafoide')
    expect(primeiro.estudo.estruturas[primeiro.indice].slug).toBe(primeiro.estrutura.slug)
  })

  it('também encontra pelo termo original em inglês', () => {
    expect(buscarEstruturasRaioX('costophrenic').length).toBeGreaterThan(0)
  })

  it('ignora consultas curtas demais para serem úteis', () => {
    expect(buscarEstruturasRaioX('a')).toEqual([])
  })
})
