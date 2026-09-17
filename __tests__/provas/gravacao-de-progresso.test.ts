import { describe, expect, it } from 'vitest'

import {
  INTERVALO_DE_BATIMENTO_MS,
  INTERVALO_DE_GRAVACAO_MS,
  deveGravarProgresso,
} from '@/lib/provas/retomada'
import { LIMIAR_ATIVO_MS } from '@/lib/provas/acompanhamento-ao-vivo'

/**
 * A prova gravava o rascunho a cada 12 segundos por toda a sua duração, mesmo
 * quando nada tinha mudado — quem lê um enunciado longo sem tocar em nada
 * gastava uma requisição a cada 12s para reenviar bytes idênticos. Numa prova
 * de duas horas são 600 requisições por aluno.
 *
 * Cortar isso tem dois riscos, e os testes existem para os dois:
 *
 *   1. perder rascunho — é o que protege a prova de quem cai no meio;
 *   2. o aluno sumir do painel ao vivo do admin, que usa a mesma gravação
 *      como sinal de vida.
 */

const RASCUNHO = '{"answers":[{"q":1,"a":"b"}]}'
const OUTRO = '{"answers":[{"q":1,"a":"c"}]}'

/** Estado-base: já houve uma gravação no instante 0, e estamos em `agora`. */
function estado(parcial: Partial<Parameters<typeof deveGravarProgresso>[0]> = {}) {
  return {
    forcar: false,
    agora: INTERVALO_DE_GRAVACAO_MS,
    ultimaGravacaoEm: 0,
    rascunhoAtual: RASCUNHO,
    ultimoRascunhoGravado: RASCUNHO,
    ...parcial,
  }
}

describe('quando a prova fala com o servidor', () => {
  it('grava assim que o rascunho muda', () => {
    expect(deveGravarProgresso(estado({ rascunhoAtual: OUTRO }))).toBe(true)
  })

  it('não grava antes do piso de 12s, nem com rascunho novo', () => {
    // O piso existia antes e continua: a rajada de quem responde rápido não
    // vira uma requisição por clique.
    expect(
      deveGravarProgresso(
        estado({ agora: INTERVALO_DE_GRAVACAO_MS - 1, rascunhoAtual: OUTRO })
      )
    ).toBe(false)
  })

  it('com nada novo, espera o batimento em vez de reenviar os mesmos bytes', () => {
    // Este é o corte: antes, isto era `true` e gastava uma requisição.
    expect(deveGravarProgresso(estado())).toBe(false)
    expect(
      deveGravarProgresso(estado({ agora: INTERVALO_DE_BATIMENTO_MS - 1 }))
    ).toBe(false)
  })

  it('com nada novo, o batimento acontece assim que vence', () => {
    expect(deveGravarProgresso(estado({ agora: INTERVALO_DE_BATIMENTO_MS }))).toBe(true)
  })

  it('gravação forçada passa sempre, mesmo repetida e fora do piso', () => {
    // Aba sumindo e entrega não podem depender de intervalo nenhum.
    expect(deveGravarProgresso(estado({ forcar: true, agora: 0 }))).toBe(true)
    expect(
      deveGravarProgresso(estado({ forcar: true, agora: 1, ultimaGravacaoEm: 0 }))
    ).toBe(true)
  })

  it('a primeira gravação da prova acontece (nada gravado ainda)', () => {
    expect(
      deveGravarProgresso(estado({ ultimoRascunhoGravado: null }))
    ).toBe(true)
  })

  it('o batimento cabe dentro do limiar que mantém o aluno "respondendo"', () => {
    /*
     * A trava que sustenta a escolha do número: acima de `LIMIAR_ATIVO_MS` o
     * painel do admin classifica o participante como "parado". O batimento
     * precisa caber embaixo com folga para a latência da requisição, senão
     * quem está com a prova aberta piscaria entre "respondendo" e "parado".
     */
    expect(INTERVALO_DE_BATIMENTO_MS).toBeLessThan(LIMIAR_ATIVO_MS)
    expect(LIMIAR_ATIVO_MS - INTERVALO_DE_BATIMENTO_MS).toBeGreaterThanOrEqual(10_000)
  })

  it('o silêncio máximo de quem está parado nunca passa do limiar de ativo', () => {
    // Simula a prova inteira de alguém que não toca em nada: o maior intervalo
    // entre duas requisições é o batimento, e ele mantém o sinal fresco.
    let ultima = 0
    let maiorSilencio = 0
    for (let agora = 0; agora <= 2 * 60 * 60 * 1000; agora += 1000) {
      const grava = deveGravarProgresso({
        forcar: false,
        agora,
        ultimaGravacaoEm: ultima,
        rascunhoAtual: RASCUNHO,
        ultimoRascunhoGravado: RASCUNHO,
      })
      if (grava) {
        maiorSilencio = Math.max(maiorSilencio, agora - ultima)
        ultima = agora
      }
    }
    expect(maiorSilencio).toBeLessThan(LIMIAR_ATIVO_MS)
  })

  it('quem responde de verdade grava no ritmo de sempre', () => {
    // Uma mudança a cada volta: o comportamento é idêntico ao de antes.
    let ultima = 0
    let gravadas = 0
    let gravado = RASCUNHO
    for (let agora = INTERVALO_DE_GRAVACAO_MS; agora <= 120_000; agora += INTERVALO_DE_GRAVACAO_MS) {
      const atual = `{"answers":[{"q":${agora},"a":"b"}]}`
      if (
        deveGravarProgresso({
          forcar: false,
          agora,
          ultimaGravacaoEm: ultima,
          rascunhoAtual: atual,
          ultimoRascunhoGravado: gravado,
        })
      ) {
        gravadas += 1
        ultima = agora
        gravado = atual
      }
    }
    expect(gravadas).toBe(10)
  })
})
