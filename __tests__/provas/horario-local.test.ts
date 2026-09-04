import { describe, expect, it } from 'vitest'
import {
  deCampoLocal,
  interpretarInstante,
  paraCampoLocal,
  paraInstanteLocal,
} from '@/lib/provas/horario-local'
import { validarJanelaDoFormulario } from '@/lib/provas/janela-da-prova'

/**
 * O defeito que estes testes travam: os portões da prova iam para o banco três
 * horas antes do que o admin digitou, porque o texto do `<input
 * datetime-local>` era enviado cru e lido por um `new Date` que rodava em UTC.
 *
 * Quase tudo aqui é escrito para não depender do fuso da máquina que roda o
 * teste: ou é ida-e-volta (`paraCampoLocal` desfaz `deCampoLocal`), ou é
 * `interpretarInstante`, que tem um fuso fixo escrito nele.
 */
describe('campos de data do formulário de prova', () => {
  it('ida e volta preserva a hora de parede que o admin digitou', () => {
    for (const digitado of ['2026-05-10T14:00', '2026-01-01T00:00', '2026-12-31T23:59']) {
      const enviado = deCampoLocal(digitado)
      expect(enviado).toBeTruthy()
      // O que volta para o campo é exatamente o que a pessoa digitou — em
      // qualquer fuso. Era aqui que o par `toISOString().slice(0,16)` +
      // envio-cru se cancelava por acidente e escondia o defeito.
      expect(paraCampoLocal(new Date(enviado!))).toBe(digitado)
    }
  })

  it('o texto enviado é ISO com fuso, não a hora de parede', () => {
    const enviado = deCampoLocal('2026-05-10T14:00')
    expect(enviado).toMatch(/Z$/)
    expect(enviado).toBe(paraInstanteLocal('2026-05-10T14:00')!.toISOString())
  })

  it('campo vazio vira null — que é como se TIRA um portão', () => {
    expect(deCampoLocal('')).toBeNull()
    expect(deCampoLocal(null)).toBeNull()
    expect(deCampoLocal(undefined)).toBeNull()
    expect(paraCampoLocal(null)).toBe('')
    expect(paraCampoLocal('')).toBe('')
    expect(paraCampoLocal('não é data')).toBe('')
  })
})

describe('interpretarInstante (lado do servidor)', () => {
  it('lê hora de parede sem fuso no fuso da plataforma, não no UTC do datacenter', () => {
    // O defeito: 14h em Brasília virava 14h UTC — 11h para quem marcou a prova.
    expect(interpretarInstante('2026-05-10T14:00')!.toISOString()).toBe('2026-05-10T17:00:00.000Z')
    expect(interpretarInstante('2026-05-10T14:00:00')!.toISOString()).toBe('2026-05-10T17:00:00.000Z')
  })

  it('respeita o fuso quando ele vem escrito', () => {
    expect(interpretarInstante('2026-05-10T17:00:00.000Z')!.toISOString()).toBe('2026-05-10T17:00:00.000Z')
    expect(interpretarInstante('2026-05-10T14:00:00-03:00')!.toISOString()).toBe('2026-05-10T17:00:00.000Z')
    expect(interpretarInstante('2026-05-10T14:00:00+00:00')!.toISOString()).toBe('2026-05-10T14:00:00.000Z')
  })

  it('aceita Date e número, e recusa o resto', () => {
    const agora = new Date('2026-05-10T17:00:00.000Z')
    expect(interpretarInstante(agora)).toBe(agora)
    expect(interpretarInstante(agora.getTime())!.toISOString()).toBe(agora.toISOString())
    expect(interpretarInstante(null)).toBeNull()
    expect(interpretarInstante(undefined)).toBeNull()
    expect(interpretarInstante('')).toBeNull()
    expect(interpretarInstante('   ')).toBeNull()
    expect(interpretarInstante('amanhã de manhã')).toBeNull()
    expect(interpretarInstante(new Date('inválida'))).toBeNull()
    expect(interpretarInstante({})).toBeNull()
  })
})

describe('validarJanelaDoFormulario', () => {
  const base = {
    startTime: '2026-05-10T14:00:00Z',
    endTime: '2026-05-10T18:00:00Z',
  }

  it('aceita a configuração de vestibular', () => {
    expect(
      validarJanelaDoFormulario({
        ...base,
        gatesOpen: '2026-05-10T13:00:00Z',
        gatesClose: '2026-05-10T14:30:00Z',
      }),
    ).toBeNull()
  })

  it('aceita prova sem portões', () => {
    expect(validarJanelaDoFormulario(base)).toBeNull()
    expect(validarJanelaDoFormulario({})).toBeNull()
  })

  it('recusa portão que fecha antes de abrir', () => {
    expect(
      validarJanelaDoFormulario({
        ...base,
        gatesOpen: '2026-05-10T14:30:00Z',
        gatesClose: '2026-05-10T13:00:00Z',
      }),
    ).toMatch(/fecham antes/)
  })

  it('recusa portão que fecha antes de a prova começar — ninguém conseguiria iniciar', () => {
    // `podeIniciar` exige o portão ainda aberto: com o portão fechado às 13h30
    // e a prova começando às 14h, o botão nunca destravaria para ninguém.
    expect(
      validarJanelaDoFormulario({
        ...base,
        gatesOpen: '2026-05-10T13:00:00Z',
        gatesClose: '2026-05-10T13:30:00Z',
      }),
    ).toMatch(/antes de a prova começar/)
  })

  it('recusa portão que abre depois do término', () => {
    expect(
      validarJanelaDoFormulario({
        ...base,
        gatesOpen: '2026-05-10T19:00:00Z',
        gatesClose: '2026-05-10T20:00:00Z',
      }),
    ).toMatch(/depois de a prova terminar/)
  })
})
