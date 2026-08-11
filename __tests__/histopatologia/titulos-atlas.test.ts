import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { tituloEditorialDaEntrada } from '@/lib/histopatologia/catalogacao'

type EntradaCatalogada = {
  id: string
  nomeCatalogado: string
  descricaoCatalogada?: string
  paginasFonte: string[]
}

const catalogo = JSON.parse(
  readFileSync(
    new URL('../../public/patologia/catalogo/patologias.json', import.meta.url),
    'utf8',
  ),
) as EntradaCatalogada[]

const FRASE_DE_INTERFACE =
  /^(?:o mesmo|os tumores|a peça|cortes?|peça:|amostra|sobre|mais sobre|texto(?:\s|:)|this |click |see )\b/i
const INGLES_ADMINISTRATIVO =
  /\b(?:pathology|case studies|pediatric autopsy|click for|full screen)\b/i
const CODIGO_ISOLADO = /^(?:l[aâ]m(?:ina)?\s*)?[a-z]{1,5}-?\d+[a-z0-9-]*$/i
const IDENTIFICACAO_DE_PACIENTE = /^(?:fem|masc|homem|mulher)[.,]?\s*\d+/i

describe('auditoria integral dos títulos do atlas', () => {
  it('mantém todas as 2.917 entradas com título editorial útil e conciso', () => {
    expect(catalogo).toHaveLength(2_917)

    const problemas = catalogo.flatMap((entrada) => {
      const titulo = tituloEditorialDaEntrada(
        entrada.nomeCatalogado,
        entrada.descricaoCatalogada,
        entrada.paginasFonte,
      )
      const motivos = [
        !titulo && 'vazio',
        titulo.length > 110 && 'longo',
        titulo.includes('…') && 'truncado',
        FRASE_DE_INTERFACE.test(titulo) && 'frase de interface',
        INGLES_ADMINISTRATIVO.test(titulo) && 'inglês administrativo',
        CODIGO_ISOLADO.test(titulo) && 'código isolado',
        IDENTIFICACAO_DE_PACIENTE.test(titulo) && 'identificação demográfica',
      ].filter(Boolean)

      return motivos.length > 0
        ? [{ id: entrada.id, original: entrada.nomeCatalogado, titulo, motivos }]
        : []
    })

    expect(problemas).toEqual([])
  })
})
