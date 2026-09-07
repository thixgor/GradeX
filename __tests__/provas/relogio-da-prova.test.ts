import { describe, expect, it } from 'vitest'
import {
  agoraDoServidor,
  medirDesvio,
  partesDaContagem,
  prazoVencido,
  tempoRestante,
} from '@/lib/provas/relogio-da-prova'

const MINUTO = 60_000

describe('medirDesvio', () => {
  it('mede pelo meio da viagem, não pela chegada', () => {
    // Pedido às 1000, resposta às 3000: o servidor respondeu, em média, às
    // 2000. Se ele disse "2000", os relógios estão iguais — mesmo com dois
    // segundos de rede no meio.
    expect(
      medirDesvio({ pedidoEm: 1000, respondidoEm: 3000, servidorEm: new Date(2000).toISOString() }),
    ).toBe(0)
  })

  it('acha o aparelho adiantado — o caso que encerrava a prova antes da hora', () => {
    // O relógio local marca 10:00; o servidor, 9:50. O desvio é de -10 minutos:
    // toda conta feita aqui dentro precisa VOLTAR dez minutos.
    const local = new Date('2026-05-10T10:00:00Z').getTime()
    const servidor = new Date('2026-05-10T09:50:00Z').toISOString()

    const desvio = medirDesvio({ pedidoEm: local, respondidoEm: local, servidorEm: servidor })
    expect(desvio).toBe(-10 * MINUTO)
    expect(agoraDoServidor(desvio, local)).toBe(new Date('2026-05-10T09:50:00Z').getTime())
  })

  it('recusa medida sem instante do servidor ou com data inválida', () => {
    expect(medirDesvio({ pedidoEm: 1000, respondidoEm: 2000, servidorEm: undefined })).toBeNull()
    expect(medirDesvio({ pedidoEm: 1000, respondidoEm: 2000, servidorEm: 'ontem' })).toBeNull()
  })

  it('recusa a viagem impossível — resposta que chega antes do pedido', () => {
    // O relógio local mudou no meio da requisição. Medida estragada não vira
    // correção: quem chamou fica com o desvio que já tinha.
    expect(medirDesvio({ pedidoEm: 5000, respondidoEm: 1000, servidorEm: new Date(3000) })).toBeNull()
  })

  it('sem desvio medido, o relógio é o local — o comportamento antigo', () => {
    expect(agoraDoServidor(null, 1234)).toBe(1234)
    expect(agoraDoServidor(undefined, 1234)).toBe(1234)
  })
})

describe('tempoRestante e prazoVencido', () => {
  const prazo = new Date('2026-05-10T16:00:00Z')

  it('conta o que falta e para no zero', () => {
    expect(tempoRestante(prazo, new Date('2026-05-10T15:30:00Z').getTime())).toBe(30 * MINUTO)
    expect(tempoRestante(prazo, new Date('2026-05-10T16:10:00Z').getTime())).toBe(0)
  })

  it('prova sem prazo nunca vence', () => {
    // Treino "sem limite" e prova pessoal caem aqui: `null` é ausência de
    // prazo, e não prazo zerado.
    expect(tempoRestante(null, Date.now())).toBeNull()
    expect(prazoVencido(null, Date.now())).toBe(false)
    expect(prazoVencido(undefined, Date.now())).toBe(false)
  })

  it('o aparelho adiantado deixa de encerrar a prova sozinho', () => {
    /*
     * O caso real: são 15h50 no servidor, mas o celular marca 16h05. Pelo
     * relógio do aparelho a prova acabou; pelo do servidor ainda faltam dez
     * minutos — e é o do servidor que vale.
     */
    const local = new Date('2026-05-10T16:05:00Z').getTime()
    const desvio = medirDesvio({
      pedidoEm: local,
      respondidoEm: local,
      servidorEm: '2026-05-10T15:50:00Z',
    })

    expect(prazoVencido(prazo, local)).toBe(true)
    expect(prazoVencido(prazo, agoraDoServidor(desvio, local))).toBe(false)
    expect(tempoRestante(prazo, agoraDoServidor(desvio, local))).toBe(10 * MINUTO)
  })
})

describe('partesDaContagem', () => {
  it('quebra o tempo em horas, minutos e segundos', () => {
    expect(partesDaContagem(2 * 3_600_000 + 5 * MINUTO + 9000)).toEqual({
      horas: 2,
      minutos: 5,
      segundos: 9,
      total: 2 * 3_600_000 + 5 * MINUTO + 9000,
    })
  })

  it('não conta hora negativa depois do fim', () => {
    expect(partesDaContagem(-5000)).toEqual({ horas: 0, minutos: 0, segundos: 0, total: 0 })
  })

  it('passando de 24 h, as horas continuam somando', () => {
    // A conta antiga usava `% 24` e mostrava "01:00:00 restante" para uma prova
    // que ainda tinha 25 horas.
    expect(partesDaContagem(25 * 3_600_000).horas).toBe(25)
  })
})
