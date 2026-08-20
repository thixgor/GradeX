import { describe, expect, it } from 'vitest'
import { buscar, pontuar, sugerir, type Candidato } from '@/lib/ensino/busca'
import {
  calcularPrioridade,
  ferramentasDe,
  ordenarParaRevisao,
  reforcoAposConcluir,
  tempoLegivel,
  type AulaRevisavel,
} from '@/lib/ensino/revisao'

const candidato = (over: Partial<Candidato>): Candidato => ({
  id: 'x',
  tipo: 'aula',
  titulo: 'Aula',
  href: '/aulas/x',
  ...over,
})

const ACERVO: Candidato[] = [
  candidato({ id: 't1', tipo: 'trilha', titulo: 'Insuficiência Cardíaca do Zero', href: '/t/1' }),
  candidato({ id: 'a1', titulo: 'Fisiopatologia da Insuficiência Cardíaca' }),
  candidato({ id: 'a2', titulo: 'Tratamento da ICFEr', termos: ['insuficiência cardíaca'] }),
  candidato({ id: 'a3', titulo: 'Hipercalemia', detalhe: 'Distúrbios do potássio' }),
  candidato({ id: 'r1', tipo: 'resumo', titulo: 'IC em 6 minutos', termos: ['insuficiência cardíaca'] }),
  candidato({ id: 'p1', tipo: 'pdf', titulo: 'Resumo de Insuficiência Cardíaca' }),
  candidato({ id: 'f1', tipo: 'flashcards', titulo: 'Insuficiência Cardíaca — 38 cards' }),
]

describe('pontuar', () => {
  it('privilegia título exato sobre começo e sobre meio', () => {
    const exato = pontuar(candidato({ titulo: 'Hipercalemia' }), 'hipercalemia')
    const comeco = pontuar(candidato({ titulo: 'Hipercalemia grave' }), 'hipercalemia')
    const meio = pontuar(candidato({ titulo: 'Manejo da hipercalemia' }), 'hipercalemia')
    expect(exato).toBeGreaterThan(comeco)
    expect(comeco).toBeGreaterThan(meio)
  })

  it('ignora acento e caixa', () => {
    expect(pontuar(candidato({ titulo: 'Insuficiência Cardíaca' }), 'insuficiencia')).toBeGreaterThan(0)
  })

  it('casa por tag mesmo sem o termo no título', () => {
    expect(pontuar(candidato({ titulo: 'ICFEr', termos: ['insuficiência cardíaca'] }), 'insuficiencia cardiaca')).toBeGreaterThan(0)
  })

  it('acha por palavras soltas fora de ordem', () => {
    expect(pontuar(candidato({ titulo: 'Tratamento da ICFEr' }), 'icfer tratamento')).toBeGreaterThan(0)
  })

  it('devolve zero para termo curto demais', () => {
    expect(pontuar(candidato({ titulo: 'Hipercalemia' }), 'h')).toBe(0)
  })
})

describe('buscar', () => {
  const { grupos, total } = buscar(ACERVO, 'insuficiência cardíaca')

  it('separa por tipo em vez de achatar', () => {
    expect(grupos.map((g) => g.tipo)).toEqual(['trilha', 'aula', 'resumo', 'pdf', 'flashcards'])
    expect(total).toBe(6)
  })

  it('põe Trilha em primeiro — quem busca assunto grande quer o caminho', () => {
    expect(grupos[0].rotulo).toBe('Trilhas')
    expect(grupos[0].itens[0].id).toBe('t1')
  })

  it('não devolve o que não casou', () => {
    expect(grupos.flatMap((g) => g.itens.map((i) => i.id))).not.toContain('a3')
  })

  it('respeita o filtro por tipo', () => {
    const so = buscar(ACERVO, 'insuficiência', { tipos: ['aula'] })
    expect(so.grupos).toHaveLength(1)
    expect(so.grupos[0].tipo).toBe('aula')
  })

  it('limita cada grupo', () => {
    const limitado = buscar(ACERVO, 'insuficiência', { limitePorGrupo: 1 })
    for (const grupo of limitado.grupos) expect(grupo.itens.length).toBeLessThanOrEqual(1)
  })
})

describe('sugerir', () => {
  it('devolve os melhores, sem agrupar', () => {
    const s = sugerir(ACERVO, 'insuficiência cardíaca', 3)
    expect(s).toHaveLength(3)
    expect(s[0].pontos).toBeGreaterThanOrEqual(s[1].pontos)
  })
})

/* =================== REVISÃO =================== */

const HOJE = new Date('2026-08-20T12:00:00Z').getTime()
const diasAtras = (d: number) => new Date(HOJE - d * 24 * 60 * 60 * 1000)

const revisavel = (over: Partial<AulaRevisavel>): AulaRevisavel => ({
  aulaId: 'a',
  titulo: 'Aula',
  concluida: true,
  percentual: 100,
  atualizadoEm: diasAtras(10),
  concluidaEm: diasAtras(10),
  temResumo: true,
  temPdf: true,
  temFlashcards: true,
  ...over,
})

describe('tempoLegivel', () => {
  it('usa a escala certa em cada faixa', () => {
    expect(tempoLegivel(0)).toBe('hoje')
    expect(tempoLegivel(1)).toBe('ontem')
    expect(tempoLegivel(12)).toBe('há 12 dias')
    expect(tempoLegivel(60)).toBe('há 2 meses')
    expect(tempoLegivel(400)).toBe('há 1 ano')
  })
})

describe('calcularPrioridade', () => {
  it('cresce com o tempo parado', () => {
    const recente = calcularPrioridade(revisavel({ concluidaEm: diasAtras(3) }), HOJE)
    const antiga = calcularPrioridade(revisavel({ concluidaEm: diasAtras(80) }), HOJE)
    expect(antiga.prioridade).toBeGreaterThan(recente.prioridade)
  })

  it('satura: oito meses não pede mais que três', () => {
    const tres = calcularPrioridade(revisavel({ concluidaEm: diasAtras(90) }), HOJE)
    const oito = calcularPrioridade(revisavel({ concluidaEm: diasAtras(240) }), HOJE)
    expect(oito.prioridade).toBe(tres.prioridade)
  })

  it('sobe o que ficou pela metade e diz onde parou', () => {
    const item = calcularPrioridade(
      revisavel({ concluida: false, percentual: 42, concluidaEm: null, atualizadoEm: diasAtras(10) }),
      HOJE,
    )
    expect(item.motivo).toContain('42%')
    expect(item.prioridade).toBeGreaterThan(
      calcularPrioridade(revisavel({ concluidaEm: diasAtras(10) }), HOJE).prioridade,
    )
  })

  it('desce o que não tem material de revisão', () => {
    const com = calcularPrioridade(revisavel({}), HOJE)
    const sem = calcularPrioridade(
      revisavel({ temResumo: false, temPdf: false, temFlashcards: false }),
      HOJE,
    )
    expect(sem.prioridade).toBeLessThan(com.prioridade)
  })

  it('usa desempenho quando ele existe', () => {
    const ruim = calcularPrioridade(revisavel({ desempenho: 0.2 }), HOJE)
    expect(ruim.motivo).toContain('errando')
    expect(ruim.prioridade).toBeGreaterThan(calcularPrioridade(revisavel({ desempenho: 1 }), HOJE).prioridade)
  })
})

describe('ordenarParaRevisao', () => {
  it('deixa de fora o que nunca foi aberto — isso é a Trilha, não revisão', () => {
    const fila = ordenarParaRevisao(
      [revisavel({ aulaId: 'nova', concluida: false, percentual: 0 }), revisavel({ aulaId: 'vista' })],
      { agora: HOJE },
    )
    expect(fila.map((i) => i.aulaId)).toEqual(['vista'])
  })

  it('ordena por prioridade', () => {
    const fila = ordenarParaRevisao(
      [
        revisavel({ aulaId: 'recente', titulo: 'Recente', concluidaEm: diasAtras(1) }),
        revisavel({ aulaId: 'antiga', titulo: 'Antiga', concluidaEm: diasAtras(120) }),
      ],
      { agora: HOJE },
    )
    expect(fila[0].aulaId).toBe('antiga')
  })
})

describe('ferramentas e reforço', () => {
  it('ordena da revisão mais barata para a mais cara', () => {
    expect(ferramentasDe(revisavel({}))).toEqual(['resumo', 'flashcards', 'pdf', 'aula'])
    expect(ferramentasDe(revisavel({ temResumo: false, temFlashcards: false, temPdf: false }))).toEqual(['aula'])
  })

  it('não oferece nada quando não há material de revisão', () => {
    expect(
      reforcoAposConcluir({
        aulaId: 'a',
        temResumo: false,
        temPdf: false,
        temFlashcards: false,
      }),
    ).toEqual([])
  })

  it('oferece no máximo três atalhos', () => {
    const atalhos = reforcoAposConcluir({
      aulaId: 'a',
      temResumo: true,
      temPdf: true,
      temFlashcards: true,
      resumoId: 'r',
    })
    expect(atalhos).toHaveLength(3)
    expect(atalhos[0].href).toBe('/aulas/r')
  })
})
