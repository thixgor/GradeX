import { describe, expect, it } from 'vitest'
import {
  agruparPorCurso,
  levantarAlertas,
  numerosDaAula,
  resumirGeral,
  MINIMO_PARA_JULGAR,
  type AulaParaAnalytics,
  type BrutoDoProgresso,
  type NumerosDaAula,
} from '@/lib/aulas/analytics'

function aula(id: string, extras: Partial<AulaParaAnalytics> = {}): AulaParaAnalytics {
  return { _id: id, titulo: `Aula ${id}`, videoEmbed: '<iframe/>', ...extras }
}

function bruto(id: string, extras: Partial<BrutoDoProgresso> = {}): BrutoDoProgresso {
  return {
    aulaId: id,
    iniciaramNovo: 0,
    concluiramNovo: 0,
    somaPercentual: 0,
    registros: 0,
    paradaSoma: 0,
    paradaN: 0,
    ...extras,
  }
}

describe('numerosDaAula — as conclusões antigas', () => {
  it('conta quem concluiu antes da reformulação', () => {
    // Sem isto, o painel mostraria um colapso de engajamento no dia do deploy:
    // conclusão antiga vivia num array dentro da aula, não em aulas_progresso.
    const n = numerosDaAula(aula('a1', { usuariosConcluidos: ['u1', 'u2', 'u3'] }), undefined)
    expect(n.concluiram).toBe(3)
  })

  it('não soma duas vezes quem está nas duas fontes', () => {
    // As escritas de hoje alimentam as duas, então somar dobraria o número.
    const n = numerosDaAula(
      aula('a1', { usuariosConcluidos: ['u1', 'u2'] }),
      bruto('a1', { concluiramNovo: 2, iniciaramNovo: 5, registros: 5, somaPercentual: 400 }),
    )
    expect(n.concluiram).toBe(2)
  })

  it('erra para menos, nunca para mais, se uma das fontes atrasar', () => {
    const n = numerosDaAula(
      aula('a1', { usuariosConcluidos: ['u1'] }),
      bruto('a1', { concluiramNovo: 4, iniciaramNovo: 10, registros: 10 }),
    )
    expect(n.concluiram).toBe(4)
  })
})

describe('numerosDaAula — taxa de conclusão', () => {
  it('nunca passa de 100%, mesmo com histórico anterior aos inícios', () => {
    // A armadilha: conclusões incluem o histórico, inícios não. Dividir um pelo
    // outro daria 300%.
    const n = numerosDaAula(
      aula('a1', { usuariosConcluidos: ['u1', 'u2', 'u3'] }),
      bruto('a1', { iniciaramNovo: 1, registros: 1, somaPercentual: 50 }),
    )
    expect(n.iniciaram).toBe(3)
    expect(n.taxaConclusao).toBe(100)
  })

  it('calcula a taxa normalmente quando há dado dos dois lados', () => {
    const n = numerosDaAula(
      aula('a1'),
      bruto('a1', { iniciaramNovo: 10, concluiramNovo: 4, registros: 10, somaPercentual: 620 }),
    )
    expect(n.taxaConclusao).toBe(40)
    expect(n.percentualMedio).toBe(62)
  })

  it('devolve null — não zero — quando ninguém começou', () => {
    // Zero significaria "todos abandonaram"; null significa "sem dado". O
    // painel precisa dizer coisas diferentes nos dois casos.
    const n = numerosDaAula(aula('a1'), undefined)
    expect(n.taxaConclusao).toBeNull()
    expect(n.percentualMedio).toBeNull()
    expect(n.paradaMediaSegundos).toBeNull()
  })
})

describe('numerosDaAula — parada média', () => {
  it('faz a média só sobre quem parou no meio', () => {
    const n = numerosDaAula(
      aula('a1'),
      bruto('a1', { iniciaramNovo: 6, concluiramNovo: 2, registros: 6, paradaSoma: 1200, paradaN: 4 }),
    )
    expect(n.paradaMediaSegundos).toBe(300)
  })
})

describe('numerosDaAula — sem conteúdo', () => {
  it('acusa aula publicada sem nada dentro', () => {
    const n = numerosDaAula({ _id: 'a1', titulo: 'Vazia' }, undefined)
    expect(n.semConteudo).toBe(true)
  })

  it('não acusa quem busca o vídeo de um material', () => {
    const n = numerosDaAula(
      { _id: 'a1', titulo: 'X', vinculoMaterial: { materialId: 'm1' } },
      undefined,
    )
    expect(n.semConteudo).toBe(false)
  })
})

describe('resumirGeral', () => {
  const agora = new Date('2026-08-16T12:00:00Z')
  const amanha = new Date('2026-08-17T12:00:00Z').toISOString()
  const ontem = new Date('2026-08-15T12:00:00Z').toISOString()

  const aulas = [
    aula('a1', { dataLiberacao: ontem }),
    aula('a2', { dataLiberacao: amanha }),
    aula('a3', { oculta: true }),
    { _id: 'a4', titulo: 'Vazia', dataLiberacao: ontem },
  ]
  const numeros = new Map(
    aulas.map((a) => [
      String(a._id),
      numerosDaAula(a, bruto(String(a._id), { iniciaramNovo: 10, concluiramNovo: 5, registros: 10, somaPercentual: 500 })),
    ]),
  )

  it('separa publicada, agendada e oculta', () => {
    const r = resumirGeral(aulas, numeros, agora)
    expect(r.publicadas).toBe(2)
    expect(r.agendadas).toBe(1)
    expect(r.ocultas).toBe(1)
    expect(r.semConteudo).toBe(1)
  })

  it('usa a média das taxas por aula, não o total global', () => {
    // Uma aula com 3 alunos e 100% não pode sumir atrás de uma com 3000 e 10%:
    // a pergunta é "as aulas estão sendo terminadas?".
    const pequena = numerosDaAula(aula('p'), bruto('p', { iniciaramNovo: 3, concluiramNovo: 3, registros: 3, somaPercentual: 300 }))
    const grande = numerosDaAula(aula('g'), bruto('g', { iniciaramNovo: 3000, concluiramNovo: 300, registros: 3000, somaPercentual: 30000 }))
    const r = resumirGeral([aula('p'), aula('g')], new Map([['p', pequena], ['g', grande]]))
    expect(r.taxaMedia).toBe(55) // (100 + 10) / 2
  })
})

describe('levantarAlertas', () => {
  function num(id: string, extras: Partial<NumerosDaAula> = {}): NumerosDaAula {
    return {
      aulaId: id,
      titulo: `Aula ${id}`,
      oculta: false,
      iniciaram: 0,
      concluiram: 0,
      taxaConclusao: null,
      percentualMedio: null,
      paradaMediaSegundos: null,
      ultimaAtividade: null,
      semConteudo: false,
      ...extras,
    }
  }

  it('põe aula publicada e vazia acima de tudo', () => {
    const alertas = levantarAlertas([
      num('a1', { iniciaram: 50, concluiram: 1, taxaConclusao: 2 }),
      num('a2', { semConteudo: true }),
    ])
    expect(alertas[0].tipo).toBe('sem-conteudo')
  })

  it('não acusa aula oculta e vazia', () => {
    // Rascunho vazio é normal; o problema é estar no ar assim.
    expect(levantarAlertas([num('a1', { semConteudo: true, oculta: true })])).toEqual([])
  })

  it('ignora aula sem amostra suficiente', () => {
    // 2 alunos e 0 conclusões não é problema de conteúdo, é falta de dado —
    // e mandar o admin investigar isso gasta a confiança dele no painel.
    const poucos = num('a1', { iniciaram: MINIMO_PARA_JULGAR - 1, concluiram: 0, taxaConclusao: 0 })
    expect(levantarAlertas([poucos])).toEqual([])
  })

  it('acusa quando ninguém termina', () => {
    const alertas = levantarAlertas([num('a1', { iniciaram: 20, concluiram: 0, taxaConclusao: 0 })])
    expect(alertas[0].tipo).toBe('ninguem-concluiu')
    expect(alertas[0].detalhe).toContain('20')
  })

  it('acusa abandono alto sem repetir o alerta anterior', () => {
    const alertas = levantarAlertas([num('a1', { iniciaram: 100, concluiram: 12, taxaConclusao: 12 })])
    expect(alertas).toHaveLength(1)
    expect(alertas[0].tipo).toBe('abandono')
  })

  it('não acusa aula com taxa saudável', () => {
    expect(levantarAlertas([num('a1', { iniciaram: 100, concluiram: 80, taxaConclusao: 80 })])).toEqual([])
  })
})

describe('agruparPorCurso', () => {
  it('soma por curso e nomeia os órfãos', () => {
    const numeros: NumerosDaAula[] = [
      { aulaId: 'a1', titulo: 'A', setorId: 's1', oculta: false, iniciaram: 10, concluiram: 5, taxaConclusao: 50, percentualMedio: 50, paradaMediaSegundos: null, ultimaAtividade: null, semConteudo: false },
      { aulaId: 'a2', titulo: 'B', setorId: 's1', oculta: false, iniciaram: 30, concluiram: 9, taxaConclusao: 30, percentualMedio: 40, paradaMediaSegundos: null, ultimaAtividade: null, semConteudo: false },
      { aulaId: 'a3', titulo: 'C', oculta: false, iniciaram: 1, concluiram: 0, taxaConclusao: 0, percentualMedio: 10, paradaMediaSegundos: null, ultimaAtividade: null, semConteudo: false },
    ]

    const cursos = agruparPorCurso(numeros, new Map([['s1', 'Clínica Médica']]))
    expect(cursos[0]).toMatchObject({ nome: 'Clínica Médica', aulas: 2, inicios: 40, conclusoes: 14, taxaMedia: 40 })
    // Aula sem curso não é descartada — ela existe e alguém a assistiu.
    expect(cursos[1].nome).toBe('Fora de qualquer curso')
  })
})
