import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { montarIndiceEstatico } from '@/lib/manual-clinico/integracao/fontes-estaticas'
import { compactar, expandir, type ItemCompacto } from '@/lib/manual-clinico/integracao/item'

/**
 * O índice estático do Estudo Integrado é gerado a partir dos acervos e
 * versionado em `indice-estatico.gerado.json`. Este teste é ao mesmo tempo o
 * gerador e a guarda:
 *
 * - `npm run integracao:indice` roda com `GERAR_INDICE_INTEGRACAO=1` e grava
 *   o arquivo;
 * - no `npm test` normal ele reconstrói em memória e falha se o JSON
 *   versionado estiver atrasado em relação ao acervo — quem acrescentou um
 *   caso de TC fica sabendo que precisa regerar, em vez de o caso simplesmente
 *   não aparecer nas conexões.
 */

const ARQUIVO = path.resolve(__dirname, '../../../lib/manual-clinico/integracao/indice-estatico.gerado.json')

describe('índice estático do Estudo Integrado', () => {
  it('está em dia com os acervos', async () => {
    const itens = await montarIndiceEstatico()
    const compactos = itens.map(compactar)
    // A forma compacta precisa voltar exatamente ao item original.
    expect(compactos.map(expandir)).toEqual(itens)
    const texto = `${JSON.stringify(compactos)}\n`

    if (process.env.GERAR_INDICE_INTEGRACAO === '1') {
      writeFileSync(ARQUIVO, texto)
      return
    }

    const versionado = JSON.parse(readFileSync(ARQUIVO, 'utf8')) as ItemCompacto[]
    expect(versionado.length).toBe(compactos.length)
    expect(versionado).toEqual(compactos)
  }, 60_000)

  it('tem refs únicas e endereços internos', async () => {
    const itens = await montarIndiceEstatico()
    const refs = new Set<string>()
    for (const item of itens) {
      expect(refs.has(item.ref), `ref repetida: ${item.ref}`).toBe(false)
      refs.add(item.ref)
      expect(item.href.startsWith('/manual-clinico/'), item.href).toBe(true)
      expect(item.titulo.trim().length).toBeGreaterThan(0)
    }
  }, 60_000)
})
