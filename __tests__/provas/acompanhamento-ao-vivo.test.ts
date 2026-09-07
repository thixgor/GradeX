import { describe, expect, it } from 'vitest'
import {
  LIMIAR_ATIVO_MS,
  LIMIAR_SUMIU_MS,
  cadenciaDoRetrato,
  esperaComRecuo,
  estadoDoParticipante,
  ordenarParticipantes,
  provaAcompanhavel,
  resumoDoAcompanhamento,
  temSalaDeEspera,
  type ParticipanteAoVivo,
} from '@/lib/provas/acompanhamento-ao-vivo'

const AGORA = new Date('2026-05-10T14:30:00Z').getTime()

function participante(campos: Partial<ParticipanteAoVivo> = {}): ParticipanteAoVivo {
  return {
    userId: 'u1',
    nome: 'Aluno',
    email: 'aluno@exemplo.com',
    nomeDeclarado: null,
    entrouEm: '2026-05-10T13:10:00Z',
    assinou: false,
    assinadoEm: null,
    transcreveu: false,
    iniciouEm: null,
    ultimoSinalEm: null,
    entregouEm: null,
    respondidas: 0,
    totalQuestoes: 40,
    retomadasUsadas: 0,
    questaoAtual: null,
    ...campos,
  }
}

/** Um instante `segundos` antes do agora do teste. */
const atras = (segundos: number) => new Date(AGORA - segundos * 1000).toISOString()

describe('provaAcompanhavel', () => {
  const janela = {
    startTime: new Date('2026-05-10T14:00:00Z'),
    endTime: new Date('2026-05-10T18:00:00Z'),
  }

  it('recusa prova de treino e prova pessoal', () => {
    expect(provaAcompanhavel({ ...janela, isPracticeExam: true } as any)).toBe(false)
    expect(provaAcompanhavel({ ...janela, isPersonalExam: true } as any)).toBe(false)
  })

  it('recusa prova sem datas — não há janela para acompanhar', () => {
    expect(provaAcompanhavel({} as any)).toBe(false)
    expect(provaAcompanhavel(null)).toBe(false)
  })

  it('aceita prova com janela, com ou sem portão próprio', () => {
    expect(provaAcompanhavel(janela as any)).toBe(true)
    expect(
      provaAcompanhavel({ ...janela, gatesOpen: new Date('2026-05-10T13:00:00Z') } as any),
    ).toBe(true)
  })
})

describe('temSalaDeEspera', () => {
  it('só quando o portão abre ANTES do início', () => {
    const semPortao = {
      startTime: new Date('2026-05-10T14:00:00Z'),
      endTime: new Date('2026-05-10T18:00:00Z'),
    }
    expect(temSalaDeEspera(semPortao as any)).toBe(false)

    const vestibular = {
      ...semPortao,
      gatesOpen: new Date('2026-05-10T13:00:00Z'),
      gatesClose: new Date('2026-05-10T13:50:00Z'),
    }
    expect(temSalaDeEspera(vestibular as any)).toBe(true)
  })

  it('prova de treino nunca tem sala de espera', () => {
    expect(
      temSalaDeEspera({
        isPracticeExam: true,
        startTime: new Date('2026-05-10T14:00:00Z'),
        endTime: new Date('2027-05-10T18:00:00Z'),
        gatesOpen: new Date('2026-05-10T13:00:00Z'),
      } as any),
    ).toBe(false)
  })
})

describe('estadoDoParticipante', () => {
  it('quem entregou já não tem andamento, mesmo com sinal recente', () => {
    const p = participante({
      iniciouEm: atras(3600),
      ultimoSinalEm: atras(5),
      entregouEm: atras(10),
    })
    expect(estadoDoParticipante(p, AGORA)).toBe('entregou')
  })

  it('quem entrou e não começou está na sala — e não "sumiu"', () => {
    // Nada é gravado na sala de espera, então medir silêncio aqui marcaria a
    // sala inteira como sumida.
    const p = participante({ entrouEm: atras(3600) })
    expect(estadoDoParticipante(p, AGORA)).toBe('na-sala')
  })

  it('separa respondendo, parado e sem sinal pelo último sinal', () => {
    const respondendo = participante({ iniciouEm: atras(600), ultimoSinalEm: atras(10) })
    expect(estadoDoParticipante(respondendo, AGORA)).toBe('respondendo')

    const noLimite = participante({
      iniciouEm: atras(600),
      ultimoSinalEm: new Date(AGORA - LIMIAR_ATIVO_MS).toISOString(),
    })
    expect(estadoDoParticipante(noLimite, AGORA)).toBe('respondendo')

    const parado = participante({
      iniciouEm: atras(600),
      ultimoSinalEm: new Date(AGORA - LIMIAR_ATIVO_MS - 1000).toISOString(),
    })
    expect(estadoDoParticipante(parado, AGORA)).toBe('parado')

    const sumiu = participante({
      iniciouEm: atras(600),
      ultimoSinalEm: new Date(AGORA - LIMIAR_SUMIU_MS - 1000).toISOString(),
    })
    expect(estadoDoParticipante(sumiu, AGORA)).toBe('sumiu')
  })

  it('sem último sinal, o início serve de batimento', () => {
    const p = participante({ iniciouEm: atras(5), ultimoSinalEm: null })
    expect(estadoDoParticipante(p, AGORA)).toBe('respondendo')
  })
})

describe('resumoDoAcompanhamento', () => {
  it('conta cada pessoa uma vez, no estado em que ela está', () => {
    const lista = [
      participante({ userId: 'a', assinou: true }),
      participante({ userId: 'b', assinou: true, iniciouEm: atras(600), ultimoSinalEm: atras(5) }),
      participante({ userId: 'c', iniciouEm: atras(900), ultimoSinalEm: atras(200) }),
      participante({ userId: 'd', iniciouEm: atras(3000), ultimoSinalEm: atras(2000) }),
      participante({
        userId: 'e',
        assinou: true,
        iniciouEm: atras(4000),
        ultimoSinalEm: atras(120),
        entregouEm: atras(60),
      }),
    ]

    expect(resumoDoAcompanhamento(lista, AGORA)).toEqual({
      entraram: 5,
      assinaram: 3,
      comecaram: 4,
      respondendo: 1,
      parados: 1,
      sumiram: 1,
      entregaram: 1,
      naSala: 1,
    })
  })
})

describe('ordenarParticipantes', () => {
  it('põe quem exige atenção antes de quem já acabou', () => {
    const lista = [
      participante({ userId: 'entregou', nome: 'Ana', iniciouEm: atras(4000), entregouEm: atras(60) }),
      participante({ userId: 'sala', nome: 'Bruno' }),
      participante({ userId: 'sumiu', nome: 'Carla', iniciouEm: atras(4000), ultimoSinalEm: atras(2000) }),
      participante({ userId: 'ativo', nome: 'Diego', iniciouEm: atras(600), ultimoSinalEm: atras(5) }),
      participante({ userId: 'parado', nome: 'Elisa', iniciouEm: atras(900), ultimoSinalEm: atras(200) }),
    ]

    expect(ordenarParticipantes(lista, AGORA).map(p => p.userId)).toEqual([
      'ativo',
      'parado',
      'sumiu',
      'sala',
      'entregou',
    ])
  })

  it('dentro do mesmo estado, o nome desempata — a linha não pula de lugar', () => {
    const lista = [
      participante({ userId: '2', nome: 'Zeca', iniciouEm: atras(600), ultimoSinalEm: atras(5) }),
      participante({ userId: '1', nome: 'Ana', iniciouEm: atras(600), ultimoSinalEm: atras(8) }),
    ]
    expect(ordenarParticipantes(lista, AGORA).map(p => p.userId)).toEqual(['1', '2'])
  })

  it('o nome declarado manda na ordenação quando existe', () => {
    const lista = [
      participante({ userId: 'a', nome: 'Ana', nomeDeclarado: 'Zulmira' }),
      participante({ userId: 'b', nome: 'Zeca', nomeDeclarado: 'Alberto' }),
    ]
    expect(ordenarParticipantes(lista, AGORA).map(p => p.userId)).toEqual(['b', 'a'])
  })
})

describe('cadenciaDoRetrato', () => {
  it('não pergunta nada quando nada pode mudar', () => {
    // Antes do portão ninguém entra; depois do término ninguém responde.
    expect(cadenciaDoRetrato('antes-do-portao', false)).toBeNull()
    expect(cadenciaDoRetrato('encerrada', true)).toBeNull()
    expect(cadenciaDoRetrato('livre', true)).toBeNull()
  })

  it('acompanha o rascunho durante a prova e desacelera com a sala vazia', () => {
    expect(cadenciaDoRetrato('em-andamento', true)).toBe(15_000)
    expect(cadenciaDoRetrato('em-andamento', false)).toBe(20_000)
  })

  it('a espera tem ritmo de gente, não de rascunho', () => {
    expect(cadenciaDoRetrato('sala-de-espera', false)).toBe(20_000)
    expect(cadenciaDoRetrato('portao-fechado', false)).toBe(20_000)
  })
})

describe('esperaComRecuo', () => {
  it('dobra a cada falha e para no teto de dois minutos', () => {
    expect(esperaComRecuo(1, 15_000)).toBe(30_000)
    expect(esperaComRecuo(2, 15_000)).toBe(60_000)
    expect(esperaComRecuo(3, 15_000)).toBe(120_000)
    expect(esperaComRecuo(9, 15_000)).toBe(120_000)
  })

  it('nunca encurta o intervalo de sucesso', () => {
    expect(esperaComRecuo(1, 20_000)).toBeGreaterThan(20_000)
  })
})
