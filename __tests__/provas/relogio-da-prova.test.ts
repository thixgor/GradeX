import { describe, expect, it } from 'vitest'
import {
  DESVIO_QUE_MERECE_AVISO,
  agoraEmBrasilia,
  descreverDesvio,
  horaDeBrasilia,
  lerHorarioDaResposta,
  medirDesvio,
  partesDaContagem,
  prazoVencido,
  tempoRestante,
} from '@/lib/provas/relogio-da-prova'

const MINUTO = 60_000

/** Uma resposta HTTP, do ponto de vista de quem só lê cabeçalho. */
function resposta(cabecalhos: Record<string, string>) {
  return { get: (nome: string) => cabecalhos[nome.toLowerCase()] ?? null }
}

describe('lerHorarioDaResposta', () => {
  it('lê o carimbo que toda resposta HTTP já traz', () => {
    // Nenhuma rota nova, nenhum campo novo no corpo: o `Date` é obrigatório no
    // HTTP e vem de graça em qualquer resposta que a tela já ia buscar.
    const cabecalhos = resposta({ date: 'Sun, 10 May 2026 17:00:00 GMT' })
    expect(lerHorarioDaResposta(cabecalhos)).toBe(new Date('2026-05-10T17:00:00Z').getTime())
  })

  it('soma a idade de uma resposta que veio da prateleira', () => {
    // Sem isso, uma resposta de cache com 5 minutos faria o aparelho parecer
    // cinco minutos adiantado — e encurtaria a prova de quem está certo.
    const cabecalhos = resposta({ date: 'Sun, 10 May 2026 17:00:00 GMT', age: '300' })
    expect(lerHorarioDaResposta(cabecalhos)).toBe(new Date('2026-05-10T17:05:00Z').getTime())
  })

  it('sem carimbo legível, não há o que corrigir', () => {
    expect(lerHorarioDaResposta(resposta({}))).toBeNull()
    expect(lerHorarioDaResposta(resposta({ date: 'ontem à tarde' }))).toBeNull()
    expect(lerHorarioDaResposta(null)).toBeNull()
    expect(lerHorarioDaResposta(undefined)).toBeNull()
  })
})

describe('medirDesvio', () => {
  it('mede pelo meio da viagem, não pela chegada', () => {
    // Dez segundos de rede numa conexão ruim: o carimbo foi escrito, em média,
    // no meio da viagem. Aqui os relógios concordam de fato — e medir contra a
    // CHEGADA acusaria cinco segundos de atraso que não existem.
    expect(medirDesvio({ pedidoEm: 0, respondidoEm: 10_000, referenciaEm: 5000 })).toBeNull()

    // E quando o desvio é real, ele sai limpo da mesma conta: um minuto.
    expect(medirDesvio({ pedidoEm: 0, respondidoEm: 10_000, referenciaEm: 65_000 })).toBe(60_000)
  })

  it('acha o aparelho adiantado — o caso que encerrava a prova antes da hora', () => {
    // O relógio local marca 10:00; Brasília, 09:50. O desvio é de -10 minutos:
    // toda conta feita aqui dentro precisa VOLTAR dez minutos.
    const local = new Date('2026-05-10T10:00:00Z').getTime()

    const desvio = medirDesvio({
      pedidoEm: local,
      respondidoEm: local,
      referenciaEm: lerHorarioDaResposta(resposta({ date: 'Sun, 10 May 2026 09:50:00 GMT' })),
    })

    expect(desvio).toBe(-10 * MINUTO)
    expect(agoraEmBrasilia(desvio, local)).toBe(new Date('2026-05-10T09:50:00Z').getTime())
  })

  it('não corrige por ruído: o `Date` do HTTP não tem milissegundos', () => {
    // Meio segundo de diferença é a resolução do cabeçalho, não um relógio
    // errado. Corrigir aí seria trocar um relógio bom por um palpite.
    expect(medirDesvio({ pedidoEm: 1000, respondidoEm: 1000, referenciaEm: 1500 })).toBeNull()
    expect(medirDesvio({ pedidoEm: 1000, respondidoEm: 1000, referenciaEm: 4000 })).toBe(3000)
  })

  it('recusa medida sem carimbo ou com data inválida', () => {
    expect(medirDesvio({ pedidoEm: 1000, respondidoEm: 2000, referenciaEm: undefined })).toBeNull()
    expect(medirDesvio({ pedidoEm: 1000, respondidoEm: 2000, referenciaEm: 'ontem' })).toBeNull()
  })

  it('recusa a viagem impossível — resposta que chega antes do pedido', () => {
    // O relógio local mudou no meio da requisição. Medida estragada não vira
    // correção: quem chamou fica com o desvio que já tinha.
    expect(medirDesvio({ pedidoEm: 5000, respondidoEm: 1000, referenciaEm: 3_000_000 })).toBeNull()
  })

  it('sem desvio medido, o relógio é o local — o comportamento antigo', () => {
    expect(agoraEmBrasilia(null, 1234)).toBe(1234)
    expect(agoraEmBrasilia(undefined, 1234)).toBe(1234)
  })
})

describe('horaDeBrasilia', () => {
  it('diz a hora de parede em Brasília, não a do aparelho', () => {
    // 17:00 UTC é 14:00 em Brasília — e é 14:00 que o admin digitou no
    // formulário da prova.
    expect(horaDeBrasilia(new Date('2026-05-10T17:00:00Z'))).toBe('14:00')
    expect(horaDeBrasilia('2026-05-10T20:35:00Z')).toBe('17:35')
  })

  it('atravessa a meia-noite sem inventar hora', () => {
    expect(horaDeBrasilia('2026-05-11T01:30:00Z')).toBe('22:30')
  })

  it('sem instante, não inventa nada', () => {
    expect(horaDeBrasilia('' as any)).toBe('—')
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
     * O caso real: são 15h50 em Brasília, mas o celular marca 16h05. Pelo
     * relógio do aparelho a prova acabou; pelo de Brasília ainda faltam dez
     * minutos — e é o de Brasília que vale.
     */
    const local = new Date('2026-05-10T16:05:00Z').getTime()
    const desvio = medirDesvio({
      pedidoEm: local,
      respondidoEm: local,
      referenciaEm: '2026-05-10T15:50:00Z',
    })

    expect(prazoVencido(prazo, local)).toBe(true)
    expect(prazoVencido(prazo, agoraEmBrasilia(desvio, local))).toBe(false)
    expect(tempoRestante(prazo, agoraEmBrasilia(desvio, local))).toBe(10 * MINUTO)
  })
})

describe('descreverDesvio', () => {
  it('diz para que lado e quanto', () => {
    expect(descreverDesvio(-12 * MINUTO)).toContain('12 min adiantado')
    expect(descreverDesvio(3 * MINUTO)).toContain('3 min atrasado')
    expect(descreverDesvio(-5000)).toContain('5 s adiantado')
    expect(descreverDesvio(-2 * 60 * MINUTO)).toContain('2 h adiantado')
    expect(descreverDesvio(-12 * MINUTO)).toContain('horário de Brasília')
  })

  it('cala a boca quando não há o que contar', () => {
    // Três segundos de correção não interessam a ninguém; um minuto já aparece
    // na tela e merece explicação.
    expect(descreverDesvio(null)).toBeNull()
    expect(descreverDesvio(500)).toBeNull()
    expect(descreverDesvio(3000, DESVIO_QUE_MERECE_AVISO)).toBeNull()
    expect(descreverDesvio(2 * MINUTO, DESVIO_QUE_MERECE_AVISO)).toBeTruthy()
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
