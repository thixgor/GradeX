import { describe, it, expect } from 'vitest'

import {
  chaveDaAvaliacao,
  dizTodosOsPeriodos,
  ehDoCursoInteiro,
  expandirLinhas,
  interpretarPeriodos,
  marcarDuplicadas,
  mesclarCasosEspeciais,
  normalizarData,
  normalizarHorario,
  periodoDoEixo,
  periodosDoPainel,
  tipoDaLinha,
  todosOsPeriodos,
  type LinhaExtraida,
} from '@/lib/cronogramas/extracao'
import { cobrePeriodo as cobre, descreverAlcance as descreve, type Avaliacao } from '@/lib/cronogramas/tipos'

/**
 * Testes da metade determinística da importação por imagem.
 *
 * As amostras não são inventadas: são as tabelas que a coordenação publica —
 * N1/N3 com a coluna "1º ao 8º Período" e as duas linhas de denominação, N2
 * com a coluna "Eixo" e nenhuma coluna de período. É contra esses três
 * formatos que o código precisa continuar acertando, porque são eles que
 * chegam no grupo da turma.
 *
 * O que a IA faz (transcrever a tabela) não é testado aqui de propósito: as
 * linhas cruas entram como fixture, exatamente como o modelo as devolve.
 */

const HOJE = '2026-08-28'

/** N3 Específica: um bloco de manhã e um de tarde, cada um com caso especial. */
const N3_ESPECIFICA: LinhaExtraida[] = [
  {
    curso: 'Medicina',
    categoria: 'N3 Específica',
    data: '24/11',
    diaDaSemana: 'Terça-feira',
    turno: 'manhã',
    denominacao: 'Aluno Regular',
    horario: '10h – 11h20',
    horarioCasosEspeciais: '10h – 11h45',
    horarioOutrosFusos: 'Rondônia 09h–10h20; CZS–AC 08h–09h20',
    periodos: ['1º Período', '2º Período', '3º Período', '4º Período'],
    duracao: '1 hora e 20 minutos',
  },
  {
    curso: 'Medicina',
    categoria: 'N3 Específica',
    data: '24/11',
    diaDaSemana: 'Terça-feira',
    turno: 'tarde',
    denominacao: 'Aluno Regular',
    horario: '14h30 – 15h50',
    horarioCasosEspeciais: '14h30 – 16h15',
    periodos: ['5º Período', '6º Período', '7º Período', '8º Período'],
  },
]

/** N2 Específica: sem coluna de período — ele está no eixo. */
const N2_POR_EIXO: LinhaExtraida[] = [
  {
    curso: 'Medicina',
    categoria: 'N2 Específica',
    data: '03/11',
    diaDaSemana: 'Terça-feira',
    horario: '09h – 11h',
    eixo: 'HAM 8',
  },
  {
    curso: 'Medicina',
    categoria: 'N2 Específica',
    data: '04/11',
    diaDaSemana: 'Quarta-feira',
    horario: '11h50 – 13h50',
    eixo: 'SOI 1',
  },
]

/**
 * TPI: a mesma prova para o curso inteiro, no mesmo dia e horário.
 * Copiado do calendário real ("TESTE DE PROGRESSO INSTITUCIONAL – TODOS OS
 * PERÍODOS – MEDICINA", 4 horas, 1ª chamada em 21/09).
 */
const TESTE_DE_PROGRESSO: LinhaExtraida[] = [
  {
    curso: 'Medicina',
    categoria: 'TPI',
    data: '21/09',
    diaDaSemana: 'Segunda-feira',
    horario: '14h – 18h',
    horarioOutrosFusos: 'Rondônia 13h–17h; CZS–AC 12h–16h',
    periodos: ['Todos os períodos'],
    duracao: '4 horas',
    chamada: '1ª Chamada Regular',
  },
]

function expandir(linhas: LinhaExtraida[], anoReferencia: number | null = 2026) {
  return expandirLinhas(linhas, {
    origem: 'calendario.png',
    secaoPadrao: 'medicina',
    hoje: HOJE,
    anoReferencia,
  })
}

describe('horário', () => {
  it('lê o intervalo escrito com "h"', () => {
    expect(normalizarHorario('10h – 11h20')).toEqual({ inicio: '10:00', fim: '11:20' })
    expect(normalizarHorario('14h30 - 15h50')).toEqual({ inicio: '14:30', fim: '15:50' })
    expect(normalizarHorario('09h – 11h')).toEqual({ inicio: '09:00', fim: '11:00' })
  })

  it('aceita o formato com dois-pontos e "às"', () => {
    expect(normalizarHorario('10:00 às 11:20')).toEqual({ inicio: '10:00', fim: '11:20' })
  })

  it('não inventa horário onde não há', () => {
    expect(normalizarHorario('')).toEqual({})
    expect(normalizarHorario('a definir')).toEqual({})
    expect(normalizarHorario(null)).toEqual({})
  })

  it('descarta relógio impossível', () => {
    expect(normalizarHorario('34h – 11h20').inicio).toBe('11:20')
  })
})

describe('data', () => {
  it('completa o ano que a tabela não traz, usando o ano letivo escolhido', () => {
    expect(normalizarData('24/11', { hoje: HOJE, anoReferencia: 2026 })).toEqual({
      dia: '2026-11-24',
      anoAssumido: false,
    })
  })

  it('sem ano letivo, deduz do calendário e avisa', () => {
    expect(normalizarData('24/11', { hoje: HOJE })).toEqual({
      dia: '2026-11-24',
      anoAssumido: true,
    })
  })

  it('data muito para trás é do ano que vem, não do que passou', () => {
    // Em dezembro, "05/02" é a prova de fevereiro que vem.
    expect(normalizarData('05/02', { hoje: '2026-12-10' }).dia).toBe('2027-02-05')
  })

  it('respeita o ano quando ele está escrito', () => {
    expect(normalizarData('24/11/2025', { hoje: HOJE, anoReferencia: 2026 })).toEqual({
      dia: '2025-11-24',
      anoAssumido: false,
    })
    expect(normalizarData('2025-11-24', { hoje: HOJE }).dia).toBe('2025-11-24')
  })

  it('lê data por extenso', () => {
    expect(normalizarData('24 de novembro de 2025', { hoje: HOJE }).dia).toBe('2025-11-24')
    expect(normalizarData('3 de março', { hoje: HOJE, anoReferencia: 2026 }).dia).toBe('2026-03-03')
  })

  it('recusa o que não é data', () => {
    expect(normalizarData('a combinar', { hoje: HOJE }).dia).toBeNull()
    expect(normalizarData('31/02', { hoje: HOJE, anoReferencia: 2026 }).dia).toBeNull()
  })
})

describe('períodos', () => {
  it('expande a faixa "1º ao 8º período"', () => {
    expect(interpretarPeriodos('1º ao 8º Período')).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(interpretarPeriodos('5º–8º')).toEqual([5, 6, 7, 8])
  })

  it('lê a lista de células, uma por período', () => {
    expect(interpretarPeriodos(['1º Período', '2º Período', '3º Período'])).toEqual([1, 2, 3])
  })

  it('lê número solto e algarismo romano', () => {
    expect(interpretarPeriodos(3)).toEqual([3])
    expect(interpretarPeriodos('IV')).toEqual([4])
  })

  it('ignora período fora da faixa', () => {
    expect(interpretarPeriodos('99º período')).toEqual([])
  })

  it('tira o período do eixo quando a tabela não tem a coluna', () => {
    expect(periodoDoEixo('SOI 1')).toBe(1)
    expect(periodoDoEixo('HAM 8')).toBe(8)
    expect(periodoDoEixo('IESC 5')).toBe(5)
    expect(periodoDoEixo('SOI IV')).toBe(4)
    expect(periodoDoEixo('Módulo eletivo')).toBeNull()
  })

  it('oferece no painel o período já preenchido, mesmo acima do curso', () => {
    expect(periodosDoPainel('biomedicina')).toHaveLength(7)
    expect(periodosDoPainel('biomedicina', 9)).toHaveLength(9)
    expect(periodosDoPainel('medicina', 30)).toHaveLength(12)
  })
})

describe('caso especial', () => {
  it('funde a linha de tempo estendido na linha regular', () => {
    const linhas: LinhaExtraida[] = [
      { data: '17/09', turno: 'manhã', denominacao: 'Aluno Regular', horario: '10h – 11h20', periodos: ['1º Período'] },
      { data: '17/09', turno: 'manhã', denominacao: 'Aluno Caso Especial', horario: '10h – 11h45', periodos: ['1º Período'] },
    ]

    const mescladas = mesclarCasosEspeciais(linhas)
    expect(mescladas).toHaveLength(1)
    expect(mescladas[0].horarioCasosEspeciais).toBe('10h – 11h45')
  })

  it('mantém a linha de caso especial órfã, para não perder a data', () => {
    const mescladas = mesclarCasosEspeciais([
      { data: '17/09', denominacao: 'Aluno Caso Especial', horario: '10h – 11h45' },
    ])
    expect(mescladas).toHaveLength(1)
  })
})

describe('expansão em avaliações', () => {
  it('vira uma avaliação por período coberto pela linha', () => {
    const propostas = expandir(N3_ESPECIFICA)

    expect(propostas).toHaveLength(8)
    expect(propostas.map(p => p.periodo)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(propostas.every(p => p.data === '2026-11-24')).toBe(true)
    expect(propostas.every(p => p.secao === 'medicina')).toBe(true)
  })

  it('usa o horário de Brasília e guarda o resto no recado do lembrete', () => {
    const [manha] = expandir(N3_ESPECIFICA)

    expect(manha.hora).toBe('10:00')
    expect(manha.lembrete.observacao).toContain('Horário de Brasília: 10:00 às 11:20')
    expect(manha.lembrete.observacao).toContain('Casos especiais: 10:00 às 11:45')
    expect(manha.lembrete.observacao).toContain('Rondônia')
    expect(manha.lembrete.observacao).toContain('Duração: 1 hora e 20 minutos')
  })

  it('deixa o conteúdo cobrado vazio — logística não é matéria', () => {
    const [manha] = expandir(N3_ESPECIFICA)

    expect(manha.conteudo).toBeUndefined()
    // E o recado cabe no teto que o servidor aplica.
    expect((manha.lembrete.observacao ?? '').length).toBeLessThanOrEqual(280)
  })

  it('separa manhã e tarde nos períodos certos', () => {
    const propostas = expandir(N3_ESPECIFICA)

    expect(propostas.find(p => p.periodo === 3)?.hora).toBe('10:00')
    expect(propostas.find(p => p.periodo === 7)?.hora).toBe('14:30')
  })

  it('deduz o período do eixo e diz que deduziu', () => {
    const propostas = expandir(N2_POR_EIXO)

    expect(propostas.map(p => p.periodo)).toEqual([8, 1])
    expect(propostas[0].titulo).toBe('N2 Específica — HAM 8')
    expect(propostas[0].avisos.some(aviso => aviso.includes('eixo HAM 8'))).toBe(true)
    // O eixo já está no título: repeti-lo no recado seria ruído.
    expect(propostas[0].lembrete.observacao).not.toContain('Eixo: HAM 8')
  })

  it('avisa quando o ano foi assumido', () => {
    const [proposta] = expandir(N2_POR_EIXO, null)
    expect(proposta.avisos).toContain('Ano assumido: 2026.')
  })

  it('marca a linha sem data para o admin resolver', () => {
    const [proposta] = expandir([{ categoria: 'N1', data: 'a definir', periodos: ['2º Período'] }])

    expect(proposta.data).toBe('')
    expect(proposta.confianca).toBe('baixa')
    expect(proposta.avisos[0]).toContain('Não consegui ler a data')
  })

  it('não repete a mesma prova quando a tabela reimprime o bloco', () => {
    const propostas = expandir([...N2_POR_EIXO, ...N2_POR_EIXO])
    expect(propostas).toHaveLength(2)
  })

  it('classifica o tipo pela categoria', () => {
    expect(tipoDaLinha({ categoria: 'N2 Específica' })).toBe('prova')
    expect(tipoDaLinha({ categoria: 'Simulado Nacional' })).toBe('simulado')
    expect(tipoDaLinha({ categoria: 'Avaliação Prática — OSCE' })).toBe('pratica')
    expect(tipoDaLinha({ categoria: 'Seminário integrador' })).toBe('apresentacao')
  })

  it('cai na seção escolhida quando a imagem não nomeia o curso', () => {
    const propostas = expandirLinhas([{ categoria: 'N1', data: '17/09', periodos: [2] }], {
      origem: 'x.png',
      secaoPadrao: 'odontologia',
      hoje: HOJE,
      anoReferencia: 2026,
    })
    expect(propostas[0].secao).toBe('odontologia')
  })

  it('entrega avaliações prontas para a rota de criação', () => {
    const [proposta] = expandir(N3_ESPECIFICA)

    expect(proposta.publicada).toBe(true)
    expect(proposta.lembrete.ativo).toBe(true)
    expect(proposta.itensEmenta).toEqual([])
    expect(proposta.titulo.length).toBeGreaterThan(1)
  })
})

describe('prova única do curso inteiro', () => {
  it('"todos os períodos" vira UMA avaliação, não uma por turma', () => {
    const propostas = expandir(TESTE_DE_PROGRESSO)

    // O TPI é a mesma prova para todo mundo: oito cópias teriam que ser
    // editadas e apagadas juntas.
    expect(propostas).toHaveLength(1)
    expect(propostas[0].todosOsPeriodos).toBe(true)
    expect(propostas[0].data).toBe('2026-09-21')
    expect(propostas[0].hora).toBe('14:00')
    expect(propostas[0].avisos.some(aviso => aviso.includes('todos os períodos'))).toBe(true)
    // A chamada entra no título: as três linhas do TPI (1ª, 2ª, PROUNI) são a
    // mesma prova em datas diferentes e precisam se distinguir na lista.
    expect(propostas[0].titulo).toBe('TPI — 1ª Chamada Regular')
  })

  it('reconhece o TPI mesmo quando a tabela não tem coluna de período', () => {
    expect(ehDoCursoInteiro({ categoria: 'TPI' })).toBe(true)
    expect(ehDoCursoInteiro({ titulo: 'Teste de Progresso 2026.2' })).toBe(true)
    expect(ehDoCursoInteiro({ categoria: 'N2 Específica' })).toBe(false)

    expect(dizTodosOsPeriodos(['Todos os períodos'])).toBe(true)
    expect(dizTodosOsPeriodos(['1º Período'])).toBe(false)

    const propostas = expandir([{ curso: 'Medicina', categoria: 'TPI', data: '20/09' }])
    expect(propostas).toHaveLength(1)
    expect(propostas[0].todosOsPeriodos).toBe(true)
  })

  it('vira prova única mesmo quando a transcrição lista as turmas uma a uma', () => {
    // A rede que não depende de palavra: se a MESMA prova, no mesmo dia e
    // horário, cobre o curso inteiro, é uma prova só — não importa se a
    // tabela escreveu "TPI", "todos os períodos" ou listou os oito.
    const propostas = expandir([
      {
        curso: 'Medicina',
        categoria: 'Teste institucional',
        data: '21/09',
        horario: '14h – 18h',
        periodos: ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º'],
      },
    ])

    expect(propostas).toHaveLength(1)
    expect(propostas[0].todosOsPeriodos).toBe(true)
    expect(propostas[0].avisos.some(aviso => aviso.includes('curso inteiro'))).toBe(true)
  })

  it('tabela que LISTA períodos continua virando uma avaliação por turma', () => {
    // A N3 tem horário próprio de manhã e de tarde: juntar tudo numa prova só
    // perderia a diferença de horário entre as turmas.
    const propostas = expandir(N3_ESPECIFICA)

    expect(propostas).toHaveLength(8)
    expect(propostas.every(p => p.todosOsPeriodos === false)).toBe(true)
  })

  it('a prova do curso inteiro alcança qualquer período', () => {
    const [tpi] = expandir(TESTE_DE_PROGRESSO)

    for (const periodo of todosOsPeriodos(8)) {
      expect(cobre(tpi, periodo)).toBe(true)
    }
    expect(descreve(tpi)).toBe('todos os períodos')
    expect(descreve({ periodo: 3, todosOsPeriodos: false })).toBe('3º período')
  })

  it('não se confunde com a prova do 1º período na hora de achar duplicata', () => {
    const [tpi] = expandir(TESTE_DE_PROGRESSO)
    const doPrimeiro = { ...tpi, todosOsPeriodos: false }

    expect(chaveDaAvaliacao(tpi)).not.toBe(chaveDaAvaliacao(doPrimeiro))
    expect(marcarDuplicadas([tpi], [doPrimeiro])[0].duplicada).toBe(false)
    expect(marcarDuplicadas([tpi], [tpi])[0].duplicada).toBe(true)
  })

  it('todosOsPeriodos não passa do teto que a rota valida', () => {
    expect(todosOsPeriodos(8)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(todosOsPeriodos(40)).toHaveLength(12)
    expect(todosOsPeriodos(0)).toEqual([1])
  })
})

describe('duplicatas', () => {
  const jaNaAgenda: Array<Pick<Avaliacao, 'secao' | 'periodo' | 'data' | 'titulo'>> = [
    { secao: 'medicina', periodo: 1, data: '2026-11-24', titulo: 'N3 Específica' },
  ]

  it('marca o que reimportar criaria de novo', () => {
    const marcadas = marcarDuplicadas(expandir(N3_ESPECIFICA), jaNaAgenda)

    expect(marcadas.filter(item => item.duplicada)).toHaveLength(1)
    expect(marcadas.find(item => item.periodo === 1)?.duplicada).toBe(true)
    expect(marcadas.find(item => item.periodo === 2)?.duplicada).toBe(false)
  })

  it('a chave ignora acento, caixa e pontuação do título', () => {
    expect(
      chaveDaAvaliacao({ secao: 'medicina', periodo: 1, data: '2026-11-24', titulo: 'N3 ESPECÍFICA!' }),
    ).toBe(
      chaveDaAvaliacao({ secao: 'medicina', periodo: 1, data: '2026-11-24', titulo: 'n3 especifica' }),
    )
  })
})
