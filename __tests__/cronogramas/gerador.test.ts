import { describe, it, expect } from 'vitest'

import ementaMedicina from '@/data/cronogramas/ementas/medicina.json'
import { achatarSelecao, estimar, gerarCronograma } from '@/lib/cronogramas/gerador'
import type { EmentaTopico } from '@/lib/cronogramas/tipos'
import type { StudyTime } from '@/lib/cronograma-types'

const TEMPO: StudyTime = {
  segunda: 2, terca: 2, quarta: 2, quinta: 2, sexta: 2, sabado: 3, domingo: 1,
}

/** 1º período de Medicina com os dois primeiros subtópicos marcados. */
function selecao(): EmentaTopico[] {
  const topicos = JSON.parse(JSON.stringify((ementaMedicina as any)['1'])) as EmentaTopico[]
  topicos[0].incluido = true
  for (const sub of topicos[0].subtopicos.slice(0, 2)) {
    sub.incluido = true
    for (const modulo of sub.modulos) modulo.incluido = true
  }
  return topicos
}

describe('gerador de cronograma', () => {
  it('nunca aloca mais horas num dia do que o aluno disse ter', () => {
    const plano = gerarCronograma({ topicos: selecao(), tempoEstudo: TEMPO, dataInicio: '2026-03-02' })

    expect(plano.dias.length).toBeGreaterThan(0)
    for (const dia of plano.dias) {
      const somaDoDia = dia.atividades.reduce((soma, a) => soma + a.horas, 0)
      expect(somaDoDia).toBeLessThanOrEqual(dia.horasDisponivel + 1e-9)
    }
  })

  it('agenda revisões depois do estudo que as originou, nunca antes', () => {
    const plano = gerarCronograma({ topicos: selecao(), tempoEstudo: TEMPO, dataInicio: '2026-03-02' })

    const primeiroEstudo = new Map<string, string>()
    for (const dia of plano.dias) {
      for (const atividade of dia.atividades) {
        if (atividade.tipo !== 'estudo') continue
        if (!primeiroEstudo.has(atividade.moduloId)) primeiroEstudo.set(atividade.moduloId, dia.data)
      }
    }

    let revisoes = 0
    for (const dia of plano.dias) {
      for (const atividade of dia.atividades) {
        if (atividade.tipo !== 'revisao') continue
        revisoes += 1
        expect(dia.data > (primeiroEstudo.get(atividade.moduloId) ?? '9999-12-31')).toBe(true)
      }
    }
    expect(revisoes).toBeGreaterThan(0)
    expect(plano.horasRevisao).toBeGreaterThan(0)
  })

  it('desligar a repetição espaçada deixa só conteúdo novo', () => {
    const plano = gerarCronograma({
      topicos: selecao(), tempoEstudo: TEMPO, dataInicio: '2026-03-02', revisaoEspacada: false,
    })

    expect(plano.horasRevisao).toBe(0)
    for (const dia of plano.dias) {
      expect(dia.atividades.every(a => a.tipo === 'estudo')).toBe(true)
    }
  })

  it('estuda antes o conteúdo cobrado na avaliação mais próxima', () => {
    const topicos = selecao()
    const cobrado = topicos[0].subtopicos[1]

    const plano = gerarCronograma({
      topicos,
      tempoEstudo: TEMPO,
      dataInicio: '2026-03-02',
      avaliacoes: [{ titulo: 'P1 de SOI I', data: '2026-04-10', itensEmenta: [cobrado.id] }],
    })

    const nomesCobrados = new Set(cobrado.modulos.map(m => m.nome))
    const primeiroEstudo = plano.dias
      .flatMap(d => d.atividades)
      .find(a => a.tipo === 'estudo')

    expect(primeiroEstudo && nomesCobrados.has(primeiroEstudo.modulo)).toBe(true)
  })

  it('reserva a véspera da avaliação para revisão geral', () => {
    const plano = gerarCronograma({
      topicos: selecao(),
      tempoEstudo: TEMPO,
      dataInicio: '2026-03-02',
      avaliacoes: [{ titulo: 'P1 de SOI I', data: '2026-04-10' }],
    })

    const vespera = plano.dias.find(d => d.data === '2026-04-09')
    expect(vespera?.atividades.some(a => a.tipo === 'reta-final')).toBe(true)
  })

  it('respeita a data de término para conteúdo novo e reporta o que sobrou', () => {
    const plano = gerarCronograma({
      topicos: selecao(), tempoEstudo: TEMPO, dataInicio: '2026-03-02', dataTermino: '2026-03-16',
    })

    expect(plano.horasNaoAlocadas).toBeGreaterThan(0)
    expect(plano.modulosNaoAlocados).toBeGreaterThan(0)
    for (const dia of plano.dias) {
      if (dia.data > '2026-03-16') {
        expect(dia.atividades.every(a => a.tipo !== 'estudo')).toBe(true)
      }
    }
  })

  it('semana inteira zerada devolve plano vazio em vez de travar', () => {
    const plano = gerarCronograma({
      topicos: selecao(),
      tempoEstudo: { segunda: 0, terca: 0, quarta: 0, quinta: 0, sexta: 0, sabado: 0, domingo: 0 },
      dataInicio: '2026-03-02',
    })

    expect(plano.dias).toHaveLength(0)
    expect(plano.horasNaoAlocadas).toBeGreaterThan(0)
  })

  it('sem módulo marcado não gera nada', () => {
    const topicos = JSON.parse(JSON.stringify((ementaMedicina as any)['1'])) as EmentaTopico[]
    const plano = gerarCronograma({ topicos, tempoEstudo: TEMPO, dataInicio: '2026-03-02' })

    expect(plano.dias).toHaveLength(0)
    expect(plano.totalModulos).toBe(0)
  })

  it('a estimativa da tela concorda com a seleção real', () => {
    const topicos = selecao()
    const prevista = estimar(topicos, TEMPO, '2026-03-02')

    expect(prevista.modulos).toBe(achatarSelecao(topicos).length)
    expect(prevista.horasSemana).toBe(14)
    expect(prevista.terminoPrevisto).not.toBeNull()
  })
})
