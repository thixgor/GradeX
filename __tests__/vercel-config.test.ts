import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * O `vercel.json` é validado pela Vercel só na hora do deploy — e um erro ali
 * derruba o build de produção inteiro. Já aconteceu: a 51ª entrada em
 * `functions` passou por todos os testes e falhou na Vercel ("`functions`
 * should NOT have more than 50 properties"). Estas checagens trazem o erro
 * para o `vitest`.
 */
const raiz = join(__dirname, '..')
const config = JSON.parse(readFileSync(join(raiz, 'vercel.json'), 'utf8'))

describe('vercel.json', () => {
  it('tem no máximo 50 entradas em `functions` (limite do schema da Vercel)', () => {
    // Rota nova que só precisa de `maxDuration`: declare na própria rota
    // (`export const maxDuration = 60`) em vez de somar uma entrada aqui.
    expect(Object.keys(config.functions || {}).length).toBeLessThanOrEqual(50)
  })

  it('toda entrada de `functions` aponta para um arquivo que existe', () => {
    for (const chave of Object.keys(config.functions || {})) {
      if (chave.includes('*')) continue
      expect(existsSync(join(raiz, chave)), chave).toBe(true)
    }
  })

  it('todo cron aponta para uma rota que existe', () => {
    for (const cron of config.crons || []) {
      const rota = join(raiz, 'app', cron.path, 'route.ts')
      expect(existsSync(rota), cron.path).toBe(true)
    }
  })
})
