import { describe, expect, it } from 'vitest'
import {
  CADENCIA_DA_ESPERA,
  CADENCIA_DA_PROVA_ENCERRADA,
  aplicarInstantes,
  cadenciaDaSincronizacao,
  deveSincronizarAJanela,
  instantesDaJanela,
  instantesMudaram,
} from '@/lib/provas/sincronizacao-da-janela'

const PORTAO = new Date('2025-09-07T16:00:00.000Z')
const INICIO = new Date('2025-09-07T17:00:00.000Z')
const FIM = new Date('2025-09-07T20:00:00.000Z')

const provaAgendada = {
  gatesOpen: PORTAO,
  startTime: INICIO,
  endTime: FIM,
  gatesClose: FIM,
}

describe('normalizar os instantes da janela', () => {
  it('trata `Date` e o mesmo horário em texto como a MESMA coisa', () => {
    /*
     * O documento vindo do banco traz `Date`; o mesmo documento depois da
     * volta pelo JSON traz `string`. Sem normalizar, toda resposta pareceria
     * uma mudança e a tela se reconstruiria a cada rodada do relógio.
     */
    const doBanco = instantesDaJanela(provaAgendada)
    const doJson = instantesDaJanela({
      gatesOpen: PORTAO.toISOString(),
      startTime: INICIO.toISOString(),
      endTime: FIM.toISOString(),
      gatesClose: FIM.toISOString(),
    })

    expect(instantesMudaram(doBanco, doJson)).toBe(false)
  })

  it('horário ausente ou inválido vira null, e não quebra a comparação', () => {
    const semPortoes = instantesDaJanela({ startTime: INICIO, endTime: FIM })
    expect(semPortoes.gatesOpen).toBeNull()
    expect(semPortoes.gatesClose).toBeNull()
    expect(instantesDaJanela({ startTime: 'nem data' }).startTime).toBeNull()
    expect(instantesMudaram(semPortoes, instantesDaJanela({ startTime: INICIO, endTime: FIM }))).toBe(
      false,
    )
  })

  it('acusa o "Forçar Início": começa agora e o portão abre junto', () => {
    const agora = new Date('2025-09-07T16:31:12.000Z')
    const forcada = instantesDaJanela({ ...provaAgendada, startTime: agora, gatesOpen: agora })

    expect(instantesMudaram(instantesDaJanela(provaAgendada), forcada)).toBe(true)
  })

  it('acusa o "Forçar Término": acaba agora', () => {
    const agora = new Date('2025-09-07T18:02:00.000Z')
    const encerrada = instantesDaJanela({ ...provaAgendada, endTime: agora, gatesClose: agora })

    expect(instantesMudaram(instantesDaJanela(provaAgendada), encerrada)).toBe(true)
  })

  it('apagar um portão no editor conta como mudança', () => {
    const semPortao = instantesDaJanela({ ...provaAgendada, gatesOpen: null })
    expect(instantesMudaram(instantesDaJanela(provaAgendada), semPortao)).toBe(true)
  })
})

describe('quando vale a pena perguntar ao servidor', () => {
  const esperando = { prova: provaAgendada, emAndamento: false, jaEntregou: false }

  it('quem espera o início pergunta — é o caso que o F5 resolvia', () => {
    expect(deveSincronizarAJanela(esperando)).toBe(true)
  })

  it('quem já está respondendo não pergunta mais', () => {
    /*
     * Mover o `endTime` de quem está no meio de uma questão zeraria o
     * cronômetro da tela e descartaria o que ainda não foi gravado. O término
     * de quem já começou é decidido na entrega, pelo servidor.
     */
    expect(deveSincronizarAJanela({ ...esperando, emAndamento: true })).toBe(false)
  })

  it('quem já entregou não tem horário nenhum para esperar', () => {
    expect(deveSincronizarAJanela({ ...esperando, jaEntregou: true })).toBe(false)
  })

  it('prova de treino e prova pessoal não têm janela para sincronizar', () => {
    expect(deveSincronizarAJanela({ ...esperando, prova: { ...provaAgendada, isPracticeExam: true } })).toBe(
      false,
    )
    expect(deveSincronizarAJanela({ ...esperando, prova: { ...provaAgendada, isPersonalExam: true } })).toBe(
      false,
    )
  })

  it('sem prova carregada não há o que comparar', () => {
    expect(deveSincronizarAJanela({ ...esperando, prova: null })).toBe(false)
  })
})

describe('o ritmo da pergunta', () => {
  it('é o da espera enquanto o início ainda importa', () => {
    expect(cadenciaDaSincronizacao('antes-do-portao')).toBe(CADENCIA_DA_ESPERA)
    expect(cadenciaDaSincronizacao('sala-de-espera')).toBe(CADENCIA_DA_ESPERA)
    expect(cadenciaDaSincronizacao('portao-fechado')).toBe(CADENCIA_DA_ESPERA)
    expect(cadenciaDaSincronizacao(null)).toBe(CADENCIA_DA_ESPERA)
  })

  it('afrouxa quando a prova já acabou — a aba esquecida não pode custar igual', () => {
    expect(cadenciaDaSincronizacao('encerrada')).toBe(CADENCIA_DA_PROVA_ENCERRADA)
  })
})

describe('os horários novos entrando no documento da tela', () => {
  it('voltam como Date, que é o que o resto da tela usa', () => {
    const aplicado = aplicarInstantes(instantesDaJanela(provaAgendada))
    expect(aplicado.startTime).toBeInstanceOf(Date)
    expect(aplicado.startTime?.getTime()).toBe(INICIO.getTime())
  })

  it('o que sumiu no servidor some na tela', () => {
    const aplicado = aplicarInstantes(instantesDaJanela({ startTime: INICIO, endTime: FIM }))
    expect(aplicado.gatesOpen).toBeUndefined()
    expect(aplicado.gatesClose).toBeUndefined()
  })
})
