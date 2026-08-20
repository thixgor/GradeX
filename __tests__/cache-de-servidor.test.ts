import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  invalidarCacheDeServidor,
  invalidarPrefixo,
  memoizarPorTempo,
} from '@/lib/cache-de-servidor'

/**
 * A memória curta que as rotas de /aulas, /banco-questoes e /provas usam para
 * não repetir a mesma consulta impessoal a cada abertura de tela.
 *
 * Cada teste usa uma chave própria: o cache vive em escopo de módulo, então
 * chaves compartilhadas fariam um teste enxergar o resultado do outro — que é
 * exatamente o comportamento em produção, e o motivo pelo qual nada pessoal
 * pode entrar aqui.
 */
afterEach(() => {
  invalidarPrefixo('teste:')
  vi.useRealTimers()
})

describe('memoizarPorTempo', () => {
  it('calcula uma vez dentro da janela', async () => {
    let chamadas = 0
    const calcular = async () => {
      chamadas++
      return 'valor'
    }

    expect(await memoizarPorTempo('teste:a', 1000, calcular)).toBe('valor')
    expect(await memoizarPorTempo('teste:a', 1000, calcular)).toBe('valor')
    expect(chamadas).toBe(1)
  })

  it('recalcula depois que a janela expira', async () => {
    vi.useFakeTimers()
    let chamadas = 0
    const calcular = async () => {
      chamadas++
      return chamadas
    }

    expect(await memoizarPorTempo('teste:b', 1000, calcular)).toBe(1)
    vi.advanceTimersByTime(1001)
    expect(await memoizarPorTempo('teste:b', 1000, calcular)).toBe(2)
  })

  it('duas chamadas simultâneas compartilham a mesma ida ao banco', async () => {
    // É o caso da instância fria recebendo a rajada de uma abertura de tela:
    // guardar a promessa (e não o valor) é o que impede N consultas iguais.
    let chamadas = 0
    const calcular = () => {
      chamadas++
      return new Promise<string>((resolve) => setTimeout(() => resolve('ok'), 5))
    }

    const [um, dois] = await Promise.all([
      memoizarPorTempo('teste:c', 1000, calcular),
      memoizarPorTempo('teste:c', 1000, calcular),
    ])

    expect(um).toBe('ok')
    expect(dois).toBe('ok')
    expect(chamadas).toBe(1)
  })

  it('não guarda a falha — o banco voltar conserta a tela sozinho', async () => {
    let chamadas = 0
    const calcular = async () => {
      chamadas++
      if (chamadas === 1) throw new Error('Atlas fora do ar')
      return 'recuperado'
    }

    await expect(memoizarPorTempo('teste:d', 1000, calcular)).rejects.toThrow('Atlas fora do ar')
    expect(await memoizarPorTempo('teste:d', 1000, calcular)).toBe('recuperado')
  })

  it('invalidar força o próximo cálculo', async () => {
    let chamadas = 0
    const calcular = async () => ++chamadas

    expect(await memoizarPorTempo('teste:e', 60_000, calcular)).toBe(1)
    invalidarCacheDeServidor('teste:e')
    expect(await memoizarPorTempo('teste:e', 60_000, calcular)).toBe(2)
  })

  it('chaves diferentes não se misturam', async () => {
    expect(await memoizarPorTempo('teste:f1', 1000, async () => 'um')).toBe('um')
    expect(await memoizarPorTempo('teste:f2', 1000, async () => 'dois')).toBe('dois')
  })
})
