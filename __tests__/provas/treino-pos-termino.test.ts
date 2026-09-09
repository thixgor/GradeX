import { describe, expect, it } from 'vitest'
import {
  PARAMETRO_DE_TREINO,
  enderecoDoTreino,
  pediuTreino,
  permiteTreinoAposTermino,
  provaAceitaTreinoPosTermino,
} from '@/lib/provas/treino-pos-termino'
import { resolverAcaoDoAluno } from '@/lib/provas/acao-do-aluno'

/*
 * A prova que motivou tudo isto: planejada com portões, início e término —
 * não uma prova de treino —, aplicada e encerrada.
 */
const provaAplicada = {
  gatesOpen: new Date('2026-09-06T13:00:00-03:00'),
  gatesClose: new Date('2026-09-06T13:50:00-03:00'),
  startTime: new Date('2026-09-06T14:00:00-03:00'),
  endTime: new Date('2026-09-06T16:00:00-03:00'),
} as any

const DURANTE = new Date('2026-09-06T15:00:00-03:00')
const DEPOIS = new Date('2026-09-07T10:00:00-03:00')

describe('provaAceitaTreinoPosTermino', () => {
  it('nasce desligado: a prova sem o campo não libera treino nenhum', () => {
    expect(provaAceitaTreinoPosTermino(provaAplicada)).toBe(false)
  })

  it('só o booleano `true` liga — nem "true" em texto nem 1', () => {
    expect(provaAceitaTreinoPosTermino({ ...provaAplicada, practiceAfterEnd: true })).toBe(true)
    expect(provaAceitaTreinoPosTermino({ ...provaAplicada, practiceAfterEnd: 'true' } as any)).toBe(false)
    expect(provaAceitaTreinoPosTermino({ ...provaAplicada, practiceAfterEnd: 1 } as any)).toBe(false)
  })

  it('prova de treino e prova pessoal ficam de fora: elas já são refeitas à vontade', () => {
    expect(
      provaAceitaTreinoPosTermino({ isPracticeExam: true, practiceAfterEnd: true } as any),
    ).toBe(false)
    expect(
      provaAceitaTreinoPosTermino({ isPersonalExam: true, practiceAfterEnd: true } as any),
    ).toBe(false)
  })

  it('sem prova nenhuma, não libera', () => {
    expect(provaAceitaTreinoPosTermino(null)).toBe(false)
    expect(provaAceitaTreinoPosTermino(undefined)).toBe(false)
  })
})

describe('permiteTreinoAposTermino — as duas condições', () => {
  const liberada = { ...provaAplicada, practiceAfterEnd: true }

  it('marcado e encerrado: libera', () => {
    expect(permiteTreinoAposTermino(liberada, DEPOIS)).toBe(true)
  })

  it('marcado, mas a prova ainda está acontecendo: NÃO libera', () => {
    /*
     * Esta é a linha que não pode cair. O modo treino corrige na hora — abri-lo
     * às 15h numa prova que vai até as 16h é publicar o gabarito com outro
     * nome, para a turma que ainda está respondendo.
     */
    expect(permiteTreinoAposTermino(liberada, DURANTE)).toBe(false)
  })

  it('encerrado, mas o admin não marcou: NÃO libera', () => {
    expect(permiteTreinoAposTermino(provaAplicada, DEPOIS)).toBe(false)
  })

  it('a virada é o instante do término, o mesmo que libera os downloads', () => {
    // `provaJaEncerrou` — a mesma função que decide o gabarito — trata o
    // instante exato do fim como encerrado. O treino segue esse relógio para
    // não haver um segundo em que o gabarito saiu e o treino ainda não.
    expect(permiteTreinoAposTermino(liberada, new Date('2026-09-06T15:59:59-03:00'))).toBe(false)
    expect(permiteTreinoAposTermino(liberada, new Date('2026-09-06T16:00:00-03:00'))).toBe(true)
  })
})

describe('o parâmetro de endereço', () => {
  it('entra no modo treino com 1 ou true, e só com eles', () => {
    expect(pediuTreino(new URLSearchParams(`${PARAMETRO_DE_TREINO}=1`))).toBe(true)
    expect(pediuTreino(new URLSearchParams(`${PARAMETRO_DE_TREINO}=true`))).toBe(true)
    expect(pediuTreino(new URLSearchParams(`${PARAMETRO_DE_TREINO}=0`))).toBe(false)
    expect(pediuTreino(new URLSearchParams(''))).toBe(false)
    expect(pediuTreino(null)).toBe(false)
  })

  it('o endereço gerado é o que a tela lê de volta', () => {
    const url = new URL(enderecoDoTreino('abc123'), 'https://exemplo.test')
    expect(url.pathname).toBe('/exam/abc123')
    expect(pediuTreino(url.searchParams)).toBe(true)
  })
})

describe('o veredito do aluno carrega o treino', () => {
  const liberada = { ...provaAplicada, practiceAfterEnd: true }

  it('prova encerrada e liberada: ver resultado continua sendo a ação principal', () => {
    const v = resolverAcaoDoAluno(liberada, {}, DEPOIS)
    // O botão principal não muda: quem abre uma prova terminada quer a nota
    // primeiro. O treino é uma ação a MAIS.
    expect(v.acao).toBe('ver-resultado')
    expect(v.podePraticar).toBe(true)
  })

  it('quem entregou também pode praticar depois do término', () => {
    const v = resolverAcaoDoAluno(liberada, { jaEntrou: true, jaEntregou: true }, DEPOIS)
    expect(v.acao).toBe('ver-resultado')
    expect(v.podePraticar).toBe(true)
  })

  it('com a prova ainda aberta, quem entregou NÃO recebe o botão de praticar', () => {
    const v = resolverAcaoDoAluno(liberada, { jaEntrou: true, jaEntregou: true }, DURANTE)
    expect(v.podePraticar).toBe(false)
  })

  it('prova encerrada sem a liberação: nada de praticar', () => {
    expect(resolverAcaoDoAluno(provaAplicada, {}, DEPOIS).podePraticar).toBe(false)
  })

  it('prova de treino: o campo existe e é falso — o "segundo tempo" não se aplica', () => {
    const v = resolverAcaoDoAluno({ isPracticeExam: true } as any, {}, DEPOIS)
    expect(v.acao).toBe('praticar')
    expect(v.podePraticar).toBe(false)
  })
})
