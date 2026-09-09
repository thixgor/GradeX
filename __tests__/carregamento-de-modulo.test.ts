import { describe, expect, it, vi } from 'vitest'

import {
  ATRASO_BASE_MS,
  TENTATIVAS_DE_IMPORTACAO,
  atrasoDaTentativa,
  ehFalhaDeCarregamentoDeModulo,
  importarComRetentativa,
} from '@/lib/carregamento-de-modulo'

/**
 * O caso real que motivou este módulo: um iPad abrindo um material e recebendo
 * "Loading chunk 9980 failed" no lugar do PDF. O leitor só baixa o pdf.js
 * quando alguém abre um material, e essa única requisição não tinha nenhuma
 * rede de proteção — falhou, acabou.
 *
 * O que estes testes protegem:
 *   1. a falha é RECONHECIDA em todas as formas que os navegadores lhe dão —
 *      é esse reconhecimento que faz o leitor trocar para a segunda porta
 *      (`lib/pdfjs-do-publico.ts`) em vez de desistir;
 *   2. uma falha de rede ganha nova tentativa (a segunda quase sempre passa);
 *   3. um erro que não é de carregamento NÃO é repetido três vezes nem manda
 *      trocar de endereço — código com defeito não melhora de endereço.
 */

/** Erro do webpack, como ele chega: nome próprio e mensagem em inglês. */
function erroDeChunk(numero = 9980) {
  const erro = new Error(
    `Loading chunk ${numero} failed.\n(error: https://www.domineaqui.com.br/_next/static/chunks/${numero}-abc.js)`,
  )
  erro.name = 'ChunkLoadError'
  return erro
}

describe('ehFalhaDeCarregamentoDeModulo', () => {
  it('reconhece o erro exato que o usuário do iPad viu', () => {
    expect(ehFalhaDeCarregamentoDeModulo(erroDeChunk(9980))).toBe(true)
  })

  it('reconhece as outras formas da mesma falha', () => {
    const variantes = [
      new Error('Loading CSS chunk 412 failed.'),
      new Error('Failed to fetch dynamically imported module: /_next/static/chunks/x.js'),
      new Error('error loading dynamically imported module'),
      // Safari, com o módulo nativo:
      new Error('Importing a module script failed.'),
      // 404 que devolveu HTML no lugar do JavaScript:
      new SyntaxError("Unexpected token '<'"),
    ]
    for (const erro of variantes) {
      expect(ehFalhaDeCarregamentoDeModulo(erro)).toBe(true)
    }
  })

  it('não confunde com erro de outra natureza', () => {
    const outros: unknown[] = [
      null,
      undefined,
      {},
      new Error(''),
      new Error('Pagina indisponivel'),
      new Error('Failed to fetch'),
      new TypeError('undefined is not an object'),
      new Error('RenderingCancelledException'),
    ]
    for (const erro of outros) {
      expect(ehFalhaDeCarregamentoDeModulo(erro)).toBe(false)
    }
  })
})

describe('atrasoDaTentativa', () => {
  it('cresce entre as tentativas e tem teto', () => {
    expect(atrasoDaTentativa(0)).toBe(0)
    expect(atrasoDaTentativa(1)).toBe(ATRASO_BASE_MS)
    expect(atrasoDaTentativa(2)).toBe(ATRASO_BASE_MS * 2)
    expect(atrasoDaTentativa(9)).toBeLessThanOrEqual(4000)
  })

  it('as tentativas somadas não fazem ninguém esperar muito', () => {
    let total = 0
    for (let i = 1; i < TENTATIVAS_DE_IMPORTACAO; i += 1) total += atrasoDaTentativa(i)
    expect(total).toBeLessThanOrEqual(2000)
  })
})

describe('importarComRetentativa', () => {
  const semEspera = { esperar: async () => {} }

  it('devolve o módulo quando a primeira tentativa passa', async () => {
    const importar = vi.fn(async () => ({ ok: true }))
    await expect(importarComRetentativa(importar, semEspera)).resolves.toEqual({ ok: true })
    expect(importar).toHaveBeenCalledTimes(1)
  })

  it('a segunda tentativa salva a rede que oscilou', async () => {
    const importar = vi
      .fn()
      .mockRejectedValueOnce(erroDeChunk())
      .mockResolvedValueOnce({ ok: true })
    await expect(importarComRetentativa(importar, semEspera)).resolves.toEqual({ ok: true })
    expect(importar).toHaveBeenCalledTimes(2)
  })

  it('desiste depois do limite e devolve o último erro', async () => {
    const importar = vi.fn(async () => {
      throw erroDeChunk(9980)
    })
    await expect(importarComRetentativa(importar, semEspera)).rejects.toThrow(/Loading chunk 9980/)
    expect(importar).toHaveBeenCalledTimes(TENTATIVAS_DE_IMPORTACAO)
  })

  it('não repete erro que veio de dentro do módulo', async () => {
    // Repetir aqui daria o mesmo erro três vezes e só atrasaria a mensagem.
    const importar = vi.fn(async () => {
      throw new TypeError('x is not a function')
    })
    await expect(importarComRetentativa(importar, semEspera)).rejects.toThrow(TypeError)
    expect(importar).toHaveBeenCalledTimes(1)
  })

  it('espera entre as tentativas, em ordem crescente', async () => {
    const esperas: number[] = []
    const importar = vi.fn(async () => {
      throw erroDeChunk()
    })
    await expect(
      importarComRetentativa(importar, {
        esperar: async (ms) => {
          esperas.push(ms)
        },
      }),
    ).rejects.toThrow()
    expect(esperas).toEqual([atrasoDaTentativa(1), atrasoDaTentativa(2)])
  })
})
