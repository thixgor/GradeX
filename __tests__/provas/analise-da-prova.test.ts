import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  OPCOES_PADRAO,
  formatarDuracao,
  gerarAnaliseDaProvaPDF,
  questaoMaisAcertada,
  questaoMaisErrada,
  type DadosDaAnalise,
} from '@/lib/pdf/analise-da-prova'

function questao(campos: Partial<DadosDaAnalise['questoes'][number]>): DadosDaAnalise['questoes'][number] {
  return {
    questionId: 'q',
    number: 1,
    type: 'multiple-choice',
    enunciadoCompleto: 'Enunciado da questão',
    comando: null,
    imageUrl: null,
    imageSource: null,
    respostaComentada: null,
    respondidas: 10,
    acertos: 5,
    percentualDeAcerto: 50,
    porAlternativa: [
      { id: 'a', letter: 'A', text: 'primeira', isCorrect: true, escolhas: 5 },
      { id: 'b', letter: 'B', text: 'segunda', isCorrect: false, escolhas: 5 },
    ],
    emBranco: 0,
    ...campos,
  }
}

function dados(campos: Partial<DadosDaAnalise> = {}): DadosDaAnalise {
  return {
    prova: {
      id: 'p1',
      title: 'Anatomia I — Avaliação Somativa',
      description: 'Prova do módulo de anatomia do 2º período.',
      coverImage: null,
      notaMaxima: 100,
      scoringMethod: 'normal',
      numberOfQuestions: 3,
      startTime: '2026-05-10T14:00:00Z',
      endTime: '2026-05-10T18:00:00Z',
      publico: { rotulo: '2º período' },
    },
    presenca: { convocados: 40, presentes: 32, entregaram: 30 },
    notas: {
      total: 30,
      media: 62.5,
      mediana: 64,
      maior: 96,
      menor: 18,
      distribuicao: [
        { rotulo: '0–20%', quantidade: 1 },
        { rotulo: '20–40%', quantidade: 4 },
        { rotulo: '40–60%', quantidade: 9 },
        { rotulo: '60–80%', quantidade: 11 },
        { rotulo: '80–100%', quantidade: 5 },
      ],
    },
    tempos: { comRegistro: 28, media: 107, mediana: 112, menor: 41, maior: 178, duracaoDaProva: 180 },
    questoes: [
      questao({ questionId: 'q1', number: 1, percentualDeAcerto: 92, acertos: 23, respondidas: 25 }),
      questao({
        questionId: 'q2',
        number: 2,
        percentualDeAcerto: 18,
        acertos: 5,
        respondidas: 28,
        respostaComentada: 'A alternativa correta é a C porque o volume diastólico final…',
      }),
      questao({ questionId: 'q3', number: 3, type: 'discursive', percentualDeAcerto: null, porAlternativa: [] }),
    ],
    participantes: Array.from({ length: 12 }, (_, i) => ({
      userId: `u${i}`,
      userName: `Aluno ${i + 1}`,
      score: 96 - i * 6,
      acertos: 20 - i,
      duracaoMin: 90 + i,
    })),
    ...campos,
  }
}

describe('formatarDuracao', () => {
  it('abaixo de uma hora não inventa hora', () => {
    expect(formatarDuracao(47)).toBe('47 min')
    expect(formatarDuracao(0)).toBe('0 min')
  })

  it('acima de uma hora lê de relance, sem obrigar a dividir por 60', () => {
    expect(formatarDuracao(107)).toBe('1h 47min')
    expect(formatarDuracao(178)).toBe('2h 58min')
  })

  it('hora cheia não carrega um "00min" que não informa nada', () => {
    expect(formatarDuracao(120)).toBe('2h')
    expect(formatarDuracao(60)).toBe('1h')
  })

  it('sem medição, um travessão — nunca um zero inventado', () => {
    expect(formatarDuracao(null)).toBe('—')
    expect(formatarDuracao(undefined)).toBe('—')
    expect(formatarDuracao(Number.NaN)).toBe('—')
  })
})

describe('questões em destaque', () => {
  it('a mais errada é a de menor acerto; a mais acertada, a de maior', () => {
    const d = dados()
    expect(questaoMaisErrada(d)?.number).toBe(2)
    expect(questaoMaisAcertada(d)?.number).toBe(1)
  })

  it('discursiva não concorre — ela não tem percentual de acerto', () => {
    const d = dados({ questoes: [questao({ type: 'discursive', percentualDeAcerto: null })] })
    expect(questaoMaisErrada(d)).toBeNull()
  })

  it('empate desempata pela mais respondida: errar com 40 diz mais que errar com 3', () => {
    const d = dados({
      questoes: [
        questao({ questionId: 'a', number: 7, percentualDeAcerto: 20, respondidas: 3 }),
        questao({ questionId: 'b', number: 9, percentualDeAcerto: 20, respondidas: 40 }),
      ],
    })
    expect(questaoMaisErrada(d)?.number).toBe(9)
  })

  it('prova sem entrega nenhuma não tem destaque a apontar', () => {
    expect(questaoMaisErrada(dados({ questoes: [] }))).toBeNull()
    expect(questaoMaisAcertada(dados({ questoes: [] }))).toBeNull()
  })
})

/*
 * O documento inteiro, desenhado de verdade.
 *
 * Vale mais que a soma dos testes de unidade acima: são ~400 linhas de
 * coordenadas e chamadas do jsPDF, e o jeito de um PDF quebrar é lançar no meio
 * do desenho — não devolver um número errado. As fontes e as imagens são
 * deixadas falhar de propósito, que é o caminho de fallback (helvetica + sem
 * capa) e o mais frágil dos dois.
 */
describe('gerarAnaliseDaProvaPDF', () => {
  const originais = {
    fetch: (globalThis as any).fetch,
    Image: (globalThis as any).Image,
    document: (globalThis as any).document,
  }

  beforeEach(() => {
    ;(globalThis as any).fetch = async () => {
      throw new Error('sem rede no teste')
    }
    // Toda imagem falha: exercita o caminho sem logo e sem capa.
    ;(globalThis as any).Image = class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      crossOrigin = ''
      naturalWidth = 0
      naturalHeight = 0
      set src(_valor: string) {
        setTimeout(() => this.onerror?.(), 0)
      }
    }
    ;(globalThis as any).document = { createElement: () => ({ getContext: () => null }) }
  })

  afterEach(() => {
    ;(globalThis as any).fetch = originais.fetch
    ;(globalThis as any).Image = originais.Image
    ;(globalThis as any).document = originais.document
  })

  it('monta o documento completo sem lançar', async () => {
    const blob = await gerarAnaliseDaProvaPDF(dados(), {
      ...OPCOES_PADRAO,
      recado: 'A parte de fisiologia foi mais difícil do que eu esperava.',
      questaoMaisErrada: { incluir: true, enunciado: true, imagem: true, respostaComentada: true },
      questaoMaisAcertada: { incluir: true, enunciado: true, imagem: true, respostaComentada: true },
    })
    expect(blob.size).toBeGreaterThan(1000)
  })

  it('com tudo desmarcado, ainda sai um PDF válido — não um arquivo vazio', async () => {
    const blob = await gerarAnaliseDaProvaPDF(dados(), {
      capa: false,
      resultadosGerais: false,
      classificacao: { incluir: false, top: 10, comNome: false, comAcertos: false },
      maiorNota: false,
      mediaDeAcertos: false,
      questaoMaisErrada: { incluir: false, enunciado: false, imagem: false, respostaComentada: false },
      questaoMaisAcertada: { incluir: false, enunciado: false, imagem: false, respostaComentada: false },
      tempoMedio: false,
      recado: '',
    })
    expect(blob.size).toBeGreaterThan(500)
  })

  it('prova sem entregas gera a capa e nada mais, sem quebrar', async () => {
    const vazia = dados({
      presenca: { convocados: 40, presentes: 0, entregaram: 0 },
      notas: {
        total: 0,
        media: null,
        mediana: null,
        maior: null,
        menor: null,
        distribuicao: [
          { rotulo: '0–20%', quantidade: 0 },
          { rotulo: '20–40%', quantidade: 0 },
        ],
      },
      tempos: { comRegistro: 0, media: null, mediana: null, menor: null, maior: null, duracaoDaProva: 180 },
      participantes: [],
      questoes: [questao({ percentualDeAcerto: null, respondidas: 0, porAlternativa: [] })],
    })
    const blob = await gerarAnaliseDaProvaPDF(vazia, OPCOES_PADRAO)
    expect(blob.size).toBeGreaterThan(500)
  })

  it('um top maior que a turma não estoura a lista', async () => {
    const blob = await gerarAnaliseDaProvaPDF(dados(), {
      ...OPCOES_PADRAO,
      classificacao: { incluir: true, top: 500, comNome: false, comAcertos: true },
    })
    expect(blob.size).toBeGreaterThan(1000)
  })
})
