import { describe, expect, it } from 'vitest'
import { decidirCancelamento, planoDaMulta, prazosDoCancelamento } from '@/lib/monitorias/politica'
import { presencaNaJanela, TOLERANCIA_FALTA_MS } from '@/lib/monitorias/sala/regras'
import { contatosNaFala, limparContatoDoResumo } from '@/lib/monitorias/resumo/contato-na-fala'
import { contratoComPoliticaV5, secoesDoContrato, VERSAO_CONTRATO } from '@/lib/monitorias/documentos/contrato'
import { secoesDosTermos, termosAutorizamResumo, VERSAO_TERMOS } from '@/lib/monitorias/documentos/termos'
import { textoAditivoResumo, VERSAO_ADITIVO_RESUMO } from '@/lib/monitorias/resumo/regras'
import type { ResumoGerado } from '@/lib/monitorias/resumo/tipos'
import type { DadosContrato } from '@/lib/monitorias/tipos'

const H = 3_600_000
const MIN = 60_000
const agora = new Date('2026-10-18T15:00:00.000Z')
const em = (horas: number) => new Date(agora.getTime() + horas * H)

describe('política v5 (contrato 2026.10-v5): aluno cancela', () => {
  const base = { ator: 'aluno' as const, status: 'confirmada' as const, agora, haPagamento: true, politica: 'v5' as const }

  it('24h ou mais: 100%, mesmo dentro do arrependimento', () => {
    expect(decidirCancelamento({ ...base, inicio: em(24) })).toEqual({ tipo: 'reembolso_total', arrependimento: false })
    expect(decidirCancelamento({ ...base, inicio: em(48), pagoEm: em(-1) })).toEqual({ tipo: 'reembolso_total', arrependimento: true })
  })

  it('entre 24h e 2h: 50% de volta (o arrependimento não vale mais)', () => {
    const r = decidirCancelamento({ ...base, inicio: em(23.9), pagoEm: em(-1) })
    expect(r).toMatchObject({ tipo: 'reembolso_parcial', pctDevolvido: 50 })
    expect(decidirCancelamento({ ...base, inicio: em(2) })).toMatchObject({ tipo: 'reembolso_parcial', pctDevolvido: 50 })
  })

  it('menos de 2h: 0% de volta', () => {
    expect(decidirCancelamento({ ...base, inicio: em(1.99) })).toMatchObject({ tipo: 'reembolso_parcial', pctDevolvido: 0 })
    expect(decidirCancelamento({ ...base, inicio: new Date(agora.getTime() + MIN) })).toMatchObject({ tipo: 'reembolso_parcial', pctDevolvido: 0 })
  })

  it('o monitor que cancela devolve 100% a qualquer tempo; sem pagamento só cancela', () => {
    expect(decidirCancelamento({ ...base, ator: 'monitor', inicio: em(1) })).toEqual({ tipo: 'reembolso_total' })
    expect(decidirCancelamento({ ...base, haPagamento: false, inicio: em(1) })).toEqual({ tipo: 'sem_pagamento' })
  })

  it('aula começada continua proibida (vira falta ou "Reportar problema")', () => {
    expect(decidirCancelamento({ ...base, inicio: em(-0.1) }).tipo).toBe('proibido')
  })
})

describe('política legada (assento sem a marca): nada mudou', () => {
  const base = { ator: 'aluno' as const, status: 'confirmada' as const, agora, haPagamento: true }
  it('arrependimento de 7 dias devolve tudo até antes da aula', () => {
    expect(decidirCancelamento({ ...base, inicio: em(1), pagoEm: em(-24) })).toEqual({ tipo: 'reembolso_total', arrependimento: true })
  })
  it('fora dos 7 dias: 24h+ devolve, menos de 24h vai ao suporte', () => {
    const pagoEm = em(-24 * 10)
    expect(decidirCancelamento({ ...base, inicio: em(30), pagoEm })).toEqual({ tipo: 'reembolso_total' })
    expect(decidirCancelamento({ ...base, inicio: em(5), pagoEm })).toEqual({ tipo: 'suporte' })
  })
})

describe('planoDaMulta e prazos', () => {
  it('50% de uma aula de R$ 100 com taxa de 10%: R$ 50 ao aluno, R$ 45 ao monitor', () => {
    expect(planoDaMulta({ valorCentavos: 10_000, taxaPercent: 10 }, 50)).toEqual({ devolvidoCentavos: 5_000, retidoCentavos: 5_000, taxaCentavos: 500, liquidoMonitorCentavos: 4_500 })
  })
  it('0% com material (taxa 0%): tudo ao monitor', () => {
    expect(planoDaMulta({ valorCentavos: 10_000, taxaPercent: 0 }, 0)).toEqual({ devolvidoCentavos: 0, retidoCentavos: 10_000, taxaCentavos: 0, liquidoMonitorCentavos: 10_000 })
  })
  it('centavos ímpares não somem: devolvido + retido = valor', () => {
    const p = planoDaMulta({ valorCentavos: 4_501 }, 50)
    expect(p.devolvidoCentavos + p.retidoCentavos).toBe(4_501)
  })
  it('prazos: 100% até 24h antes, 50% até 2h antes', () => {
    const inicio = em(72)
    const { integralAte, metadeAte } = prazosDoCancelamento(inicio)
    expect(inicio.getTime() - integralAte.getTime()).toBe(24 * H)
    expect(inicio.getTime() - metadeAte.getTime()).toBe(2 * H)
  })
})

describe('presencaNaJanela (falta pela sala)', () => {
  const inicio = new Date('2026-10-18T22:00:00.000Z')
  const fim = new Date(inicio.getTime() + 60 * MIN)
  const t = (min: number) => new Date(inicio.getTime() + min * MIN)
  const reg = (pid: string, papel: 'monitor' | 'aluno', de: number, ate: number, saiu = true) => ({ pid, papel, entrou: t(de), ate: t(ate), ...(saiu ? { saiu: t(ate) } : {}) })

  it('monitor esperou 15 min e o aluno não veio → aluno ausente, monitor esperou', () => {
    const p = presencaNaJanela([reg('mon', 'monitor', -2, 25)], { inicio, fim }, ['alu'])
    expect(p.monitor.esperou).toBe(true)
    expect(p.monitor.minutos).toBe(25)
    expect(p.alunos.alu.compareceu).toBe(false)
  })

  it('monitor saiu cedo (10 min): não esperou', () => {
    const p = presencaNaJanela([reg('mon', 'monitor', 0, 10)], { inicio, fim }, ['alu'])
    expect(p.monitor.esperou).toBe(false)
  })

  it('monitor chegou depois da tolerância: não esperou, mesmo ficando muito', () => {
    const p = presencaNaJanela([reg('mon', 'monitor', 20, 60)], { inicio, fim }, ['alu'])
    expect(p.monitor.esperou).toBe(false)
  })

  it('aluno que entrou e saiu em 1 minuto não "compareceu" (mas entrou: o botão do monitor não vale contra ele)', () => {
    const p = presencaNaJanela([reg('mon', 'monitor', 0, 40), reg('alu', 'aluno', 30, 31)], { inicio, fim }, ['alu'])
    expect(p.alunos.alu.entrou).toBe(true)
    expect(p.alunos.alu.compareceu).toBe(false)
  })

  it('aluno com 5 min ou mais compareceu, mesmo somando reconexões (rede ruim não vira falta)', () => {
    const p = presencaNaJanela([reg('mon', 'monitor', 0, 40), reg('alu', 'aluno', 10, 13), reg('alu', 'aluno', 20, 22)], { inicio, fim }, ['alu'])
    expect(p.alunos.alu.minutos).toBe(5)
    expect(p.alunos.alu.compareceu).toBe(true)
    const cedo = presencaNaJanela([reg('alu', 'aluno', -10, -4)], { inicio, fim }, ['alu'])
    expect(cedo.alunos.alu.compareceu).toBe(true) // chegou antes e esperou: conta
  })

  it('monitor que entrou e saiu (5 min) não esperou, e soma menos de 15 min (base da disputa)', () => {
    const p = presencaNaJanela([reg('mon', 'monitor', 1, 6), reg('alu', 'aluno', 0, 30)], { inicio, fim }, ['alu'])
    expect(p.monitor.esperou).toBe(false)
    expect(p.monitor.minutos).toBe(5)
    expect(p.alunos.alu.minutos).toBe(30)
  })

  it('entradas de antes de um reagendamento não contam', () => {
    const p = presencaNaJanela([reg('alu', 'aluno', -24 * 60, -24 * 60 + 50), reg('mon', 'monitor', 0, 30)], { inicio, fim }, ['alu'])
    expect(p.alunos.alu.compareceu).toBe(false)
  })

  it('reconexões curtas (pulso, recarga da aba) emendam', () => {
    const p = presencaNaJanela([reg('mon', 'monitor', 0, 7), reg('mon', 'monitor', 8, 16)], { inicio, fim }, [])
    expect(p.monitor.minutos).toBeGreaterThanOrEqual(15)
    expect(p.monitor.esperou).toBe(true)
  })

  it('o botão no meio da aula conta só até agora', () => {
    const p = presencaNaJanela([reg('mon', 'monitor', 0, 60, false)], { inicio, fim, ate: t(10) }, [])
    expect(p.monitor.minutos).toBe(10)
    expect(p.monitor.esperou).toBe(false)
    expect(TOLERANCIA_FALTA_MS).toBe(15 * MIN)
  })

  it('monitor que nunca entrou: entrouEm nulo (base da disputa por falta do monitor)', () => {
    const p = presencaNaJanela([reg('alu', 'aluno', 0, 25)], { inicio, fim }, ['alu'])
    expect(p.monitor.entrouEm).toBeNull()
    expect(p.alunos.alu.minutos).toBe(25)
    expect(p.alunos.alu.compareceu).toBe(true)
  })
})

describe('contato por fora dito na aula (Resumo por IA)', () => {
  const tempos = { inicioDoTrecho: new Date('2026-10-18T22:10:00.000Z'), inicioDaAula: new Date('2026-10-18T22:00:00.000Z') }

  it('telefone ditado vira achado com a frase e o minuto da aula', () => {
    const r = contatosNaFala(
      [
        { t: 0, texto: 'Então a onda P representa a despolarização atrial.' },
        { t: 125_000, texto: 'Me chama no zap, é 21 98765-4321.' },
      ],
      tempos,
    )
    expect(r).toHaveLength(1)
    expect(r[0].minuto).toBe(12)
    expect(r[0].texto).toContain('98765')
    expect(r[0].deteccao.categorias).toContain('telefone')
  })

  it('número ditado em pedaços também é achado', () => {
    const r = contatosNaFala(
      [
        { t: 0, texto: 'Anota aí:' },
        { t: 2_000, texto: '21 9876' },
        { t: 4_000, texto: '54321' },
      ],
      tempos,
    )
    expect(r.length).toBeGreaterThanOrEqual(1)
  })

  it('pagamento por fora é achado', () => {
    const r = contatosNaFala([{ t: 0, texto: 'Se quiser, a próxima você me paga por fora no pix, sem a taxa da plataforma.' }], tempos)
    expect(r).toHaveLength(1)
  })

  it('conteúdo médico com números não é achado', () => {
    const r = contatosNaFala(
      [
        { t: 0, texto: 'A pressão de 120 por 80 é o alvo; amoxicilina 500 mg de 8 em 8 horas por 7 dias.' },
        { t: 5_000, texto: 'O tumor cresce por fora da cápsula.' },
        { t: 9_000, texto: 'O zap caiu ontem, mas voltando ao QT longo.' },
      ],
      tempos,
    )
    expect(r).toHaveLength(0)
  })

  it('a limpeza tira do resumo a frase com contato e a questão que trouxer contato', () => {
    const resumo: ResumoGerado = {
      titulo: 'ECG básico',
      sintese: 'A aula cobriu o eixo elétrico. Contato do monitor: 21 98765-4321.',
      topicos: [{ titulo: 'Eixo', explicacao: 'D1 e aVF definem o quadrante.', conceitos: [], mecanismos: [], raciocinioDoMonitor: '' }],
      duvidas: [],
      comparacoes: [],
      pontosDeAtencao: ['Siga o instagram @monitor.ecg para mais dicas', 'QT longo predispõe a torsades.'],
      revisaoRapida: [],
      questoes: [
        { enunciado: 'Qual derivação?', alternativas: ['D1', 'D2', 'D3', 'aVF'], correta: 0, comentario: 'D1.' },
        { enunciado: 'Ligue para 21 98765-4321?', alternativas: ['a', 'b', 'c', 'd'], correta: 0, comentario: '' },
      ],
      lacunas: [],
      aVerificar: [],
    }
    const limpo = limparContatoDoResumo(resumo)
    expect(limpo.sintese).toBe('A aula cobriu o eixo elétrico.')
    expect(limpo.pontosDeAtencao).toEqual(['QT longo predispõe a torsades.'])
    expect(limpo.questoes).toHaveLength(1)
    expect(limpo.topicos).toHaveLength(1)
  })
})

describe('documentos v5', () => {
  const dados = (modeloVersao: string): DadosContrato => ({
    numero: 'DA-MON-2026-000099',
    modeloVersao,
    contratante: { userId: 'a', nome: 'Aluna', cpf: '52998224725', email: 'a@x.com' },
    contratado: { userId: 'm', nome: 'Monitor', cpf: '11144477735', email: 'm@x.com' },
    anuncio: { id: 'an', titulo: 'ECG', materia: 'Cardiologia' },
    conteudos: [],
    inicio: '2026-10-25T22:00:00.000Z',
    fim: '2026-10-25T23:00:00.000Z',
    duracaoMin: 60,
    vagas: 1,
    valorCentavos: 10_000,
    taxaPlataformaCentavos: 1_000,
    gratis: false,
    origem: 'direto',
    emitidoEm: '2026-10-18T12:00:00.000Z',
  })
  const texto = (d: DadosContrato) => secoesDoContrato(d).flatMap((s) => s.paragrafos).join('\n')

  it('versões: contrato e Termos v5, aditivo r2', () => {
    expect(VERSAO_CONTRATO).toBe('2026.10-v5')
    expect(VERSAO_TERMOS).toBe('2026.10-v5')
    expect(VERSAO_ADITIVO_RESUMO).toBe('2026.10-r2')
  })

  it('contratoComPoliticaV5 / termosAutorizamResumo comparam a versão por número', () => {
    expect(contratoComPoliticaV5('2026.10-v4')).toBe(false)
    expect(contratoComPoliticaV5('2026.10-v5')).toBe(true)
    expect(contratoComPoliticaV5('2026.11-v1')).toBe(true)
    expect(contratoComPoliticaV5('2026.10-v10')).toBe(true)
    expect(contratoComPoliticaV5(undefined)).toBe(false)
    expect(termosAutorizamResumo('2026.10-v4')).toBe(false)
    expect(termosAutorizamResumo('2026.10-v5')).toBe(true)
    expect(termosAutorizamResumo('2027.01-v1')).toBe(true)
  })

  it('o contrato v5 traz a tabela 100/50/0 e a falta; o v4 continua como era', () => {
    const v5 = texto(dados('2026.10-v5'))
    expect(v5).toContain('50%')
    expect(v5).toMatch(/15 minutos/)
    const v4 = texto(dados('2026.10-v4'))
    expect(v4).not.toBe(v5)
    expect(v4).not.toContain('4.9.')
  })

  it('os Termos do Monitor autorizam o Resumo (5.4 a 5.7) e numeram sem buracos', () => {
    const monitor = secoesDosTermos('monitor')
    const todos = monitor.flatMap((s) => s.paragrafos).join('\n')
    for (const item of ['5.4.', '5.5.', '5.6.', '5.7.', '7.1.', '7.2.', '7.3.']) expect(todos).toContain(item)
    expect(todos).toMatch(/sem possibilidade de pausá-la/)
    for (const papel of ['monitor', 'aluno'] as const) {
      for (const s of secoesDosTermos(papel)) {
        const numeros = s.paragrafos.map((p) => /^(\d+)\.(\d+)\./.exec(p)).filter(Boolean).map((m) => Number(m![2]))
        numeros.forEach((n, i) => expect(n).toBe(numeros[0] + i))
      }
    }
  })

  it('o aditivo r2 não promete reembolso por recusa do monitor e fala da verificação de contato', () => {
    const t = textoAditivoResumo(30)
    expect(t).not.toMatch(/se (?:o monitor )?não autorizar/i)
    expect(t).toMatch(/contato/i)
  })
})
