import { describe, expect, it } from 'vitest'

import {
  agregarCarga,
  resumirPlano,
  resumirTudo,
  type PlanoBruto,
} from '@/lib/cronogramas/progresso'

const HOJE = '2026-03-10'

function atividade(id: string, horas: number, concluido: boolean, tipo?: 'estudo' | 'revisao') {
  return { id, horas, concluido, tipo }
}

const PLANO: PlanoBruto = {
  _id: 'a',
  titulo: 'Fisiologia',
  cronograma: [
    { data: '2026-03-08', atividades: [atividade('1', 2, true), atividade('2', 1, false)] },
    { data: '2026-03-09', atividades: [atividade('3', 1.5, false, 'revisao')] },
    { data: HOJE, atividades: [atividade('4', 2, false), atividade('5', 1, true)] },
    { data: '2026-03-12', atividades: [atividade('6', 3, false)] },
  ],
}

describe('resumirPlano', () => {
  it('conta o que venceu sem ser feito, e só isso, como atraso', () => {
    const resumo = resumirPlano(PLANO, HOJE)
    // As de hoje e as futuras não entram no atraso, mesmo abertas.
    expect(resumo.atrasadas).toBe(2)
    expect(resumo.horasAtrasadas).toBe(2.5)
    expect(resumo.emDia).toBe(false)
  })

  it('separa o que é de hoje do resto do plano', () => {
    const resumo = resumirPlano(PLANO, HOJE)
    expect(resumo.hojeTotal).toBe(2)
    expect(resumo.hojeFeitas).toBe(1)
    expect(resumo.hojeHoras).toBe(3)
  })

  it('mede o percentual sobre o plano inteiro', () => {
    const resumo = resumirPlano(PLANO, HOJE)
    expect(resumo.total).toBe(6)
    expect(resumo.feitas).toBe(2)
    expect(resumo.percentual).toBe(33)
    expect(resumo.revisoes).toBe(1)
  })

  it('acha as pontas e o próximo dia com trabalho em aberto', () => {
    const resumo = resumirPlano(PLANO, HOJE)
    expect(resumo.inicio).toBe('2026-03-08')
    expect(resumo.fim).toBe('2026-03-12')
    expect(resumo.proximoDia).toBe(HOJE)
  })

  it('reconhece o plano que ainda não começou', () => {
    const futuro: PlanoBruto = {
      cronograma: [{ data: '2026-04-01', atividades: [atividade('1', 2, false)] }],
    }
    const resumo = resumirPlano(futuro, HOJE)
    expect(resumo.naoComecou).toBe(true)
    expect(resumo.atrasadas).toBe(0)
    expect(resumo.terminado).toBe(false)
  })

  it('reconhece o plano terminado', () => {
    const pronto: PlanoBruto = {
      cronograma: [{ data: '2026-03-01', atividades: [atividade('1', 2, true)] }],
    }
    const resumo = resumirPlano(pronto, HOJE)
    expect(resumo.terminado).toBe(true)
    expect(resumo.percentual).toBe(100)
    expect(resumo.proximoDia).toBeUndefined()
  })

  it('não quebra com plano vazio ou ausente', () => {
    expect(resumirPlano(null, HOJE).total).toBe(0)
    expect(resumirPlano({ cronograma: [] }, HOJE).percentual).toBe(0)
  })
})

describe('agregarCarga', () => {
  it('soma a carga de todos os planos no mesmo dia', () => {
    const outro: PlanoBruto = {
      _id: 'b',
      cronograma: [{ data: HOJE, atividades: [atividade('7', 1.5, true)] }],
    }
    const mapa = agregarCarga([PLANO, outro])
    expect(mapa[HOJE]).toEqual({ horas: 4.5, itens: 3, concluidos: 2 })
  })
})

describe('resumirTudo', () => {
  it('manda o foco para o plano mais atrasado, não para o com mais tarefa hoje', () => {
    const soHoje: PlanoBruto = {
      _id: 'b',
      titulo: 'Anatomia',
      cronograma: [
        {
          data: HOJE,
          atividades: [atividade('7', 1, false), atividade('8', 1, false), atividade('9', 1, false)],
        },
      ],
    }
    const geral = resumirTudo([soHoje, PLANO], HOJE)
    expect(geral.planoEmFoco?.titulo).toBe('Fisiologia')
    expect(geral.atrasadas).toBe(2)
    expect(geral.ativos).toBe(2)
  })

  it('sem atraso nenhum, o foco vai para quem tem tarefa aberta hoje', () => {
    const emDia: PlanoBruto = {
      _id: 'c',
      titulo: 'Bioquímica',
      cronograma: [{ data: HOJE, atividades: [atividade('1', 1, false)] }],
    }
    const geral = resumirTudo([emDia], HOJE)
    expect(geral.atrasadas).toBe(0)
    expect(geral.planoEmFoco?.titulo).toBe('Bioquímica')
    expect(geral.hojeHoras).toBe(1)
  })

  it('soma o percentual sobre todas as atividades, não a média dos planos', () => {
    const grande: PlanoBruto = {
      _id: 'd',
      cronograma: [
        {
          data: '2026-03-01',
          atividades: [atividade('1', 1, true), atividade('2', 1, true), atividade('3', 1, true)],
        },
      ],
    }
    const pequeno: PlanoBruto = {
      _id: 'e',
      cronograma: [{ data: '2026-03-01', atividades: [atividade('4', 1, false)] }],
    }
    expect(resumirTudo([grande, pequeno], HOJE).percentual).toBe(75)
  })
})
