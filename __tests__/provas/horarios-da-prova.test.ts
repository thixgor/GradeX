import { describe, expect, it } from 'vitest'
import {
  descreverEspera,
  formatarDiaEHora,
  horariosDaProva,
  proximoInstanteDaJanela,
} from '@/lib/provas/horarios-da-prova'

const MINUTO = 60 * 1000
const HORA = 60 * MINUTO
const DIA = 24 * HORA

/** Datas em horário local: o que a tela formata é o relógio de quem lê. */
function local(ano: number, mes: number, dia: number, hora: number, min = 0) {
  return new Date(ano, mes - 1, dia, hora, min, 0, 0)
}

function prova(campos: Record<string, any> = {}) {
  return {
    startTime: local(2026, 5, 10, 14),
    endTime: local(2026, 5, 10, 18),
    ...campos,
  } as any
}

describe('formatarDiaEHora', () => {
  const agora = local(2026, 5, 10, 12)

  it('fala o dia por extenso quando ele é hoje, amanhã ou ontem', () => {
    expect(formatarDiaEHora(local(2026, 5, 10, 14), agora)).toBe('hoje, 14:00')
    expect(formatarDiaEHora(local(2026, 5, 11, 8, 30), agora)).toBe('amanhã, 08:30')
    expect(formatarDiaEHora(local(2026, 5, 9, 22), agora)).toBe('ontem, 22:00')
  })

  it('vira data quando está longe, e só então mostra o ano de outro ano', () => {
    expect(formatarDiaEHora(local(2026, 9, 7, 13), agora)).toBe('07/09, 13:00')
    expect(formatarDiaEHora(local(2027, 9, 7, 13), agora)).toBe('07/09/2027, 13:00')
  })

  it('não inventa horário quando não há data', () => {
    expect(formatarDiaEHora(null, agora)).toBe('—')
    expect(formatarDiaEHora('não é data', agora)).toBe('—')
  })
})

describe('descreverEspera', () => {
  it('conta em minutos, horas e dias', () => {
    expect(descreverEspera(30 * 1000)).toBe('em instantes')
    expect(descreverEspera(12 * MINUTO)).toBe('em 12 min')
    expect(descreverEspera(2 * HORA)).toBe('em 2 h')
    expect(descreverEspera(2 * HORA + 15 * MINUTO)).toBe('em 2 h 15 min')
    expect(descreverEspera(3 * DIA)).toBe('em 3 dias')
  })

  it('não engole as horas que sobram de um dia inteiro', () => {
    // Truncar aqui não é arredondar, é dizer outro dia: às 23h de segunda,
    // "em 1 dia" para uma prova de quarta às 11h manda a pessoa se preparar
    // para terça.
    expect(descreverEspera(DIA + 12 * HORA)).toBe('em 1 dia e 12 h')
    expect(descreverEspera(2 * DIA + 3 * HORA)).toBe('em 2 dias e 3 h')
    // A unidade menor só some quando não tem nada a corrigir.
    expect(descreverEspera(2 * DIA)).toBe('em 2 dias')
    expect(descreverEspera(DIA + 30 * MINUTO)).toBe('em 1 dia')
  })

  it('cala quando a contagem não decide mais nada', () => {
    // Passado: quem lê já sabe.
    expect(descreverEspera(-1)).toBeNull()
    // Longe demais: "em 43 dias" é a data por escrito de novo.
    expect(descreverEspera(43 * DIA)).toBeNull()
  })
})

describe('horariosDaProva', () => {
  it('não mostra agenda de prova de treino nem de prova pessoal', () => {
    expect(horariosDaProva(prova({ isPracticeExam: true }), local(2026, 5, 10, 12))).toEqual([])
    expect(horariosDaProva(prova({ isPersonalExam: true }), local(2026, 5, 10, 12))).toEqual([])
  })

  it('prova sem portão próprio mostra só início e término', () => {
    const marcos = horariosDaProva(prova(), local(2026, 5, 10, 12))
    // O portão normalizado repete `startTime`/`endTime` — repetido na tela ele
    // só faria a prova parecer mais complicada do que é.
    expect(marcos.map((m) => m.rotulo)).toEqual(['Prova começa', 'Prova termina'])
    expect(marcos[0].texto).toBe('hoje, 14:00')
  })

  it('vestibular clássico mostra os quatro marcos em ordem de relógio', () => {
    const marcos = horariosDaProva(
      prova({ gatesOpen: local(2026, 5, 10, 13), gatesClose: local(2026, 5, 10, 13, 50) }),
      local(2026, 5, 10, 12),
    )
    // O portão fecha ANTES de a prova começar: na ordem cronológica ele vem em
    // segundo, e não no fim da lista.
    expect(marcos.map((m) => m.rotulo)).toEqual([
      'Portão abre',
      'Portão fecha',
      'Prova começa',
      'Prova termina',
    ])
  })

  it('marca o que já passou e destaca só o próximo', () => {
    const marcos = horariosDaProva(
      prova({ gatesOpen: local(2026, 5, 10, 13), gatesClose: local(2026, 5, 10, 13, 50) }),
      local(2026, 5, 10, 13, 30),
    )
    expect(marcos.map((m) => m.jaPassou)).toEqual([true, false, false, false])
    expect(marcos.filter((m) => m.eOProximo).map((m) => m.rotulo)).toEqual(['Portão fecha'])
    expect(marcos[1].espera).toBe('em 20 min')
    // A espera acompanha só o próximo: nos outros ela viraria ruído.
    expect(marcos[2].espera).toBe('em 30 min')
  })

  it('prova encerrada não tem próximo marco, mas continua com a agenda', () => {
    const marcos = horariosDaProva(prova(), local(2026, 5, 11, 9))
    expect(marcos.every((m) => m.jaPassou)).toBe(true)
    expect(marcos.some((m) => m.eOProximo)).toBe(false)
  })

  it('prova antiga sem datas não vira uma agenda inventada', () => {
    expect(horariosDaProva({ title: 'antiga' } as any, local(2026, 5, 10, 12))).toEqual([])
  })
})

describe('proximoInstanteDaJanela', () => {
  it('aponta a próxima virada de fase, e não a próxima data qualquer', () => {
    const prova13h = prova({
      gatesOpen: local(2026, 5, 10, 13),
      gatesClose: local(2026, 5, 10, 13, 50),
    })

    // Esperando o portão abrir: a tela precisa acordar às 13h em ponto.
    expect(proximoInstanteDaJanela(prova13h, local(2026, 5, 10, 12, 30))).toBe(
      local(2026, 5, 10, 13).getTime(),
    )
    // Na sala de espera: o próximo é o portão fechando, não a prova começando.
    expect(proximoInstanteDaJanela(prova13h, local(2026, 5, 10, 13, 30))).toBe(
      local(2026, 5, 10, 13, 50).getTime(),
    )
  })

  it('devolve null quando não há mais nada para acordar', () => {
    // Encerrada: nenhum marco à frente.
    expect(proximoInstanteDaJanela(prova(), local(2026, 5, 11, 9))).toBeNull()
    // Sem janela: um timer aqui seria um despertador para um evento que não existe.
    expect(proximoInstanteDaJanela(prova({ isPracticeExam: true }), local(2026, 5, 10, 12))).toBeNull()
  })
})
