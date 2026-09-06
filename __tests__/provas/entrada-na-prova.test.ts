import { describe, expect, it } from 'vitest'
import { janelaMudou, registrarEntrada } from '@/lib/provas/entrada-na-prova'

/**
 * Um Mongo de mentira, com o suficiente para o `upsert` deste módulo: guarda
 * as chaves gravadas e conta as inserções, que é o que distingue "entrou
 * agora" de "já estava dentro".
 */
function bancoFalso(existentes: string[] = []) {
  const guardadas = new Set(existentes)
  const gravacoes: { chave: string; entrouEm: Date }[] = []

  return {
    gravacoes,
    guardadas,
    collection: () => ({
      findOne: async (filtro: any) =>
        guardadas.has(`${filtro.examId}:${filtro.userId}`) ? { _id: 'x' } : null,
      updateOne: async (filtro: any, update: any) => {
        const chave = `${filtro.examId}:${filtro.userId}`
        if (guardadas.has(chave)) return { upsertedCount: 0 }
        guardadas.add(chave)
        gravacoes.push({ chave, entrouEm: update.$setOnInsert.entrouEm })
        return { upsertedCount: 1 }
      },
    }),
  } as any
}

const PROVA = {
  startTime: new Date('2026-05-10T14:00:00Z'),
  endTime: new Date('2026-05-10T18:00:00Z'),
  gatesOpen: new Date('2026-05-10T13:00:00Z'),
  gatesClose: new Date('2026-05-10T13:50:00Z'),
} as any

describe('registrarEntrada', () => {
  it('com o portão aberto, grava a passagem', async () => {
    const db = bancoFalso()
    const r = await registrarEntrada(db, PROVA, 'e1', 'u1', new Date('2026-05-10T13:30:00Z'))
    expect(r).toEqual({ dentro: true, registrouAgora: true, motivo: null })
    expect(db.gravacoes).toHaveLength(1)
  })

  it('com o portão fechado, recusa — e explica', async () => {
    const db = bancoFalso()
    const r = await registrarEntrada(db, PROVA, 'e1', 'u1', new Date('2026-05-10T14:05:00Z'))
    expect(r.dentro).toBe(false)
    expect(r.motivo).toMatch(/portões/i)
    expect(db.gravacoes).toHaveLength(0)
  })

  it('antes de o portão abrir também não entra', async () => {
    const db = bancoFalso()
    const r = await registrarEntrada(db, PROVA, 'e1', 'u1', new Date('2026-05-10T12:30:00Z'))
    expect(r.dentro).toBe(false)
    expect(db.gravacoes).toHaveLength(0)
  })

  it('quem já entrou continua dentro DEPOIS de o portão fechar', async () => {
    // O ponto inteiro do registro: às 14h05 o portão está fechado, mas esta
    // pessoa chegou às 13h30 e a prova é dela.
    const db = bancoFalso(['e1:u1'])
    const r = await registrarEntrada(db, PROVA, 'e1', 'u1', new Date('2026-05-10T14:05:00Z'))
    expect(r).toEqual({ dentro: true, registrouAgora: false, motivo: null })
    expect(db.gravacoes).toHaveLength(0)
  })

  it('recarregar a página não regrava a entrada', async () => {
    const db = bancoFalso()
    await registrarEntrada(db, PROVA, 'e1', 'u1', new Date('2026-05-10T13:10:00Z'))
    const segunda = await registrarEntrada(db, PROVA, 'e1', 'u1', new Date('2026-05-10T13:45:00Z'))
    expect(segunda.registrouAgora).toBe(false)
    // O horário guardado é o da PRIMEIRA vez: reescrevê-lo transformaria o
    // registro num "última vez que apareceu", e o portão passaria a fechar
    // para quem já estava dentro.
    expect(db.gravacoes).toHaveLength(1)
    expect(db.gravacoes[0].entrouEm.toISOString()).toBe('2026-05-10T13:10:00.000Z')
  })

  it('prova de treino não tem portão — está sempre dentro, sem gravar nada', async () => {
    const db = bancoFalso()
    const r = await registrarEntrada(db, { ...PROVA, isPracticeExam: true }, 'e1', 'u1', new Date())
    expect(r.dentro).toBe(true)
    expect(db.gravacoes).toHaveLength(0)
  })

  it('prova encerrada não recebe mais ninguém', async () => {
    const db = bancoFalso()
    const r = await registrarEntrada(db, PROVA, 'e1', 'u1', new Date('2026-05-10T19:00:00Z'))
    expect(r.dentro).toBe(false)
  })
})

describe('janelaMudou', () => {
  const janela = {
    gatesOpen: new Date('2026-09-06T01:23:00-03:00'),
    gatesClose: new Date('2026-09-06T02:08:00-03:00'),
    startTime: new Date('2026-09-06T02:46:00-03:00'),
    endTime: new Date('2026-09-06T04:06:00-03:00'),
  } as any

  it('remarcar a prova conta como mudança', () => {
    /*
     * O registro de entrada diz "passei pelo portão desta prova" e não guarda
     * qual era o portão. Remarcada a prova, ele autoriza uma entrada que nunca
     * aconteceu — a prova adiada começaria com meia turma já dentro.
     */
    expect(janelaMudou(janela, { startTime: new Date('2026-09-13T02:46:00-03:00') })).toBe(true)
    expect(janelaMudou(janela, { gatesClose: new Date('2026-09-06T03:00:00-03:00') })).toBe(true)
  })

  it('salvar sem mexer na janela não expulsa ninguém', () => {
    /*
     * O painel reenvia os quatro campos a cada salvamento. Comparar por
     * referência (ou reagir à simples presença do campo) apagaria as entradas
     * de uma prova EM ANDAMENTO porque alguém corrigiu o título — a turma
     * inteira seria posta para fora da sala.
     */
    expect(
      janelaMudou(janela, {
        gatesOpen: new Date('2026-09-06T01:23:00-03:00'),
        gatesClose: new Date('2026-09-06T02:08:00-03:00'),
        startTime: new Date('2026-09-06T02:46:00-03:00'),
        endTime: new Date('2026-09-06T04:06:00-03:00'),
      }),
    ).toBe(false)
    expect(janelaMudou(janela, {})).toBe(false)
  })

  it('aceita texto ISO no lugar de Date', () => {
    // O corpo da requisição chega como JSON: as datas são strings.
    expect(janelaMudou(janela, { startTime: '2026-09-06T02:46:00-03:00' as any })).toBe(false)
    expect(janelaMudou(janela, { startTime: '2026-09-07T02:46:00-03:00' as any })).toBe(true)
  })

  it('tirar ou pôr um portão é mudança', () => {
    expect(janelaMudou(janela, { gatesClose: null as any })).toBe(true)
    expect(janelaMudou({ ...janela, gatesOpen: undefined }, { gatesOpen: new Date() })).toBe(true)
  })
})
