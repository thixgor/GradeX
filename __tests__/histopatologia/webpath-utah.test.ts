import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  CAPITULOS_WEBPATH_UTAH,
  modalidadeDaEntradaWebPathUtah,
  TOTAL_ENTRADAS_WEBPATH_UTAH,
  type CapituloWebPathUtahBruto,
} from '@/lib/histopatologia/webpath-utah/catalogo'
import {
  leituraDidaticaWebPathUtah,
  traduzirTituloWebPathUtah,
} from '@/lib/histopatologia/webpath-utah/traducao'

const RAIZ = path.resolve(__dirname, '../..')
const DIRETORIO = path.join(RAIZ, 'data/histopatologia/webpath-utah')
const CAPITULOS = readdirSync(DIRETORIO)
  .filter((nome) => nome.endsWith('.json'))
  .map((nome) => JSON.parse(readFileSync(path.join(DIRETORIO, nome), 'utf8')) as CapituloWebPathUtahBruto)

describe('catálogo WebPath/Utah', () => {
  it('materializa os 19 índices solicitados em fragmentos separados', () => {
    expect(CAPITULOS).toHaveLength(19)
    expect(new Set(CAPITULOS.map((capitulo) => capitulo.id))).toEqual(
      new Set(CAPITULOS_WEBPATH_UTAH.map((capitulo) => capitulo.id)),
    )
  })

  it('contém as 1.325 referências patológicas auditadas', () => {
    const total = CAPITULOS.reduce((soma, capitulo) => soma + capitulo.entradas.length, 0)
    expect(TOTAL_ENTRADAS_WEBPATH_UTAH).toBe(1325)
    expect(total).toBe(TOTAL_ENTRADAS_WEBPATH_UTAH)
    for (const capitulo of CAPITULOS) {
      expect(capitulo.entradas).toHaveLength(
        CAPITULOS_WEBPATH_UTAH.find((resumo) => resumo.id === capitulo.id)!.total,
      )
    }
  })

  it('mantém apenas macroscopia ou microscopia patológica', () => {
    for (const capitulo of CAPITULOS) {
      for (const entrada of capitulo.entradas) {
        expect(entrada.tituloOriginal, entrada.url).toMatch(/\b(gross|microscopic)\b/i)
        if (/\bnormal\b/i.test(entrada.tituloOriginal)) {
          expect(entrada.tituloOriginal, entrada.url).toMatch(
            /hemorrhage|necrotizing|nuchal cord|parkinson|addison|cushing|dysplastic|celiac|adenomatous|atrophic/i,
          )
        }
        expect(modalidadeDaEntradaWebPathUtah(entrada.tituloOriginal)).toMatch(
          /^(macroscopia|microscopia)$/,
        )
      }
    }
  })

  it('usa páginas HTTPS da fonte e não armazena arquivo de imagem', () => {
    for (const capitulo of CAPITULOS) {
      const urls = new Set<string>()
      for (const entrada of capitulo.entradas) {
        const url = new URL(entrada.url)
        expect(url.protocol).toBe('https:')
        expect(url.host).toBe('webpath.med.utah.edu')
        expect(entrada).not.toHaveProperty('urlImagem')
        expect(entrada).not.toHaveProperty('urlVisualizador')
        expect(urls.has(entrada.url), entrada.url).toBe(false)
        urls.add(entrada.url)
      }
    }
  })

  it('produz título em português e leitura aprofundada para toda entrada', () => {
    for (const capitulo of CAPITULOS) {
      for (const entrada of capitulo.entradas) {
        const titulo = traduzirTituloWebPathUtah(entrada.tituloOriginal)
        const leitura = leituraDidaticaWebPathUtah(entrada.tituloOriginal)
        expect(titulo, entrada.url).not.toBe(entrada.tituloOriginal)
        expect(titulo, entrada.url).not.toMatch(/\b(gross|microscopic|high power|low power)\b/i)
        expect(titulo, entrada.url).not.toMatch(
          /\b(with|without|and|from|into|following|seen|compared)\b/i,
        )
        expect(titulo, entrada.url).not.toMatch(/\[[A-Z]/)
        expect(titulo.length, entrada.url).toBeGreaterThan(8)
        expect(leitura.descricao.length, entrada.url).toBeGreaterThan(500)
        expect(leitura.observacoes, entrada.url).toHaveLength(3)
        expect(leitura.observacoes.every((item) => item.length > 15), entrada.url).toBe(true)
      }
    }
  })
})
