import { describe, it, expect } from 'vitest'

import {
  MAX_LEMBRETES_POR_AVALIACAO,
  descreverLembrete,
  deveEnviarHoje,
  diasDeLembrete,
  montarLembrete,
  normalizarConfigLembrete,
  passoEmDias,
  proximosLembretes,
} from '@/lib/cronogramas/lembretes'
import { LEMBRETE_PADRAO, type Avaliacao } from '@/lib/cronogramas/tipos'

function avaliacao(overrides: Partial<Avaliacao> = {}): Avaliacao {
  return {
    secao: 'medicina',
    periodo: 1,
    titulo: 'P1 de SOI I',
    tipo: 'prova',
    data: '2026-04-10',
    lembrete: { ...LEMBRETE_PADRAO },
    publicada: true,
    ...overrides,
  }
}

describe('agenda de lembretes', () => {
  it('conta a partir do dia da prova para trás, e o último lembrete cai no dia dela', () => {
    const dias = diasDeLembrete(avaliacao({ lembrete: { ...LEMBRETE_PADRAO, iniciarDiasAntes: 14, frequencia: 3, unidade: 'dias' } }))

    expect(dias[dias.length - 1]).toBe('2026-04-10')
    expect(dias).toEqual(['2026-03-29', '2026-04-01', '2026-04-04', '2026-04-07', '2026-04-10'])
  })

  it('entende frequência em semanas', () => {
    expect(passoEmDias({ frequencia: 2, unidade: 'semanas' })).toBe(14)

    const dias = diasDeLembrete(
      avaliacao({ lembrete: { ...LEMBRETE_PADRAO, iniciarDiasAntes: 28, frequencia: 1, unidade: 'semanas' } }),
    )
    expect(dias).toEqual(['2026-03-13', '2026-03-20', '2026-03-27', '2026-04-03', '2026-04-10'])
  })

  it('lembrete desligado não gera nenhum dia', () => {
    expect(diasDeLembrete(avaliacao({ lembrete: { ...LEMBRETE_PADRAO, ativo: false } }))).toEqual([])
  })

  it('antecedência zero avisa só no dia da prova', () => {
    expect(diasDeLembrete(avaliacao({ lembrete: { ...LEMBRETE_PADRAO, iniciarDiasAntes: 0 } }))).toEqual(['2026-04-10'])
  })

  it('uma janela longa com passo curto ainda respeita o teto de envios', () => {
    const dias = diasDeLembrete(
      avaliacao({ lembrete: { ...LEMBRETE_PADRAO, iniciarDiasAntes: 120, frequencia: 1, unidade: 'dias' } }),
    )
    expect(dias.length).toBe(MAX_LEMBRETES_POR_AVALIACAO)
  })

  it('lista os próximos lembretes com quantos dias faltarão em cada um', () => {
    const proximos = proximosLembretes(avaliacao(), '2026-04-01', 3)

    expect(proximos).toEqual([
      { dia: '2026-04-01', diasRestantes: 9 },
      { dia: '2026-04-04', diasRestantes: 6 },
      { dia: '2026-04-07', diasRestantes: 3 },
    ])
  })
})

describe('gatilho de envio', () => {
  const alvo = avaliacao({ lembrete: { ...LEMBRETE_PADRAO, horario: '19:00' } })

  it('não envia antes do horário configurado', () => {
    expect(deveEnviarHoje(alvo, '2026-04-07', 18 * 60 + 59)).toBe(false)
    expect(deveEnviarHoje(alvo, '2026-04-07', 19 * 60)).toBe(true)
    expect(deveEnviarHoje(alvo, '2026-04-07', 23 * 60)).toBe(true)
  })

  it('não envia num dia que não está na agenda', () => {
    expect(deveEnviarHoje(alvo, '2026-04-06', 20 * 60)).toBe(false)
  })
})

describe('texto do lembrete', () => {
  it('informa quanto falta e nunca inventa urgência', () => {
    const texto = montarLembrete({ avaliacao: avaliacao(), nome: 'Ana Paula', diasRestantes: 9 })

    expect(texto.titulo).toContain('faltam 9 dias')
    expect(texto.titulo).toContain('Ana')
    expect(texto.corpo.join(' ')).toContain('P1 de SOI I')
    expect(texto.cta.length).toBeGreaterThan(0)
  })

  it('muda o pedido conforme a distância, do "comece" ao "hoje é véspera"', () => {
    const longe = montarLembrete({ avaliacao: avaliacao(), nome: 'Ana', diasRestantes: 30 })
    const perto = montarLembrete({ avaliacao: avaliacao(), nome: 'Ana', diasRestantes: 2 })
    const hoje = montarLembrete({ avaliacao: avaliacao(), nome: 'Ana', diasRestantes: 0 })

    expect(longe.cta).not.toBe(perto.cta)
    expect(hoje.titulo.toLowerCase()).toContain('hoje')
    expect(hoje.assunto.toLowerCase()).toContain('hoje')
  })

  it('leva o conteúdo cobrado e o recado do admin para dentro do corpo', () => {
    const texto = montarLembrete({
      avaliacao: avaliacao({
        conteudo: 'Ciclo cardíaco e ECG',
        lembrete: { ...LEMBRETE_PADRAO, observacao: 'Levar jaleco.' },
      }),
      nome: 'Ana',
      diasRestantes: 5,
    })

    const corpo = texto.corpo.join(' ')
    expect(corpo).toContain('Ciclo cardíaco e ECG')
    expect(corpo).toContain('Levar jaleco.')
  })
})

describe('normalização da configuração', () => {
  it('cai no padrão em vez de recusar campo digitado torto', () => {
    const config = normalizarConfigLembrete({ horario: '25:99', frequencia: 0, unidade: 'meses', iniciarDiasAntes: -5 })

    expect(config.horario).toBe('19:00')
    expect(config.frequencia).toBe(1)
    expect(config.unidade).toBe('dias')
    expect(config.iniciarDiasAntes).toBe(0)
    expect(config.ativo).toBe(true)
  })

  it('respeita o teto de antecedência', () => {
    expect(normalizarConfigLembrete({ iniciarDiasAntes: 900 }).iniciarDiasAntes).toBe(120)
  })

  it('preserva desligado explícito', () => {
    expect(normalizarConfigLembrete({ ativo: false }).ativo).toBe(false)
  })

  it('descreve a configuração numa linha', () => {
    expect(descreverLembrete({ ...LEMBRETE_PADRAO })).toBe('a partir de 14 dias antes, a cada 3 dias, às 19:00')
    expect(descreverLembrete({ ...LEMBRETE_PADRAO, ativo: false })).toBe('Lembretes desligados')
    expect(descreverLembrete({ ...LEMBRETE_PADRAO, frequencia: 1, unidade: 'semanas' })).toContain('toda semana')
  })
})
