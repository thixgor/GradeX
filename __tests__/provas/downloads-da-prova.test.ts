import { describe, expect, it } from 'vitest'
import {
  normalizarLiberacoes,
  provaDaSubmissao,
  provaJaEncerrou,
  resolverDownloadsDaProva,
} from '@/lib/provas/downloads-da-prova'

const AGORA = new Date('2026-05-10T15:00:00Z')

function agendada(campos: Record<string, any> = {}) {
  return {
    startTime: new Date('2026-05-10T14:00:00Z'),
    endTime: new Date('2026-05-10T18:00:00Z'),
    ...campos,
  } as any
}

const encerrada = agendada({ endTime: new Date('2026-05-10T14:30:00Z') })

describe('normalizarLiberacoes', () => {
  it('ausente vale como tudo desligado', () => {
    expect(normalizarLiberacoes(undefined)).toEqual({ prova: false, relatorio: false, gabarito: false })
  })

  it('só o booleano true liga', () => {
    expect(normalizarLiberacoes({ prova: 'true', relatorio: 1, gabarito: true })).toEqual({
      prova: false,
      relatorio: false,
      gabarito: true,
    })
  })
})

describe('resolverDownloadsDaProva', () => {
  it('conta gratuita não baixa nada por padrão', () => {
    const v = resolverDownloadsDaProva(agendada(), { accountType: 'gratuito', jaEnviou: true, agora: AGORA })
    expect(v.prova.permitido).toBe(false)
    expect(v.relatorio.permitido).toBe(false)
    expect(v.prova.esperandoOFim).toBe(false)
  })

  it('conta paga baixa prova e relatório durante a prova', () => {
    const v = resolverDownloadsDaProva(agendada(), { accountType: 'plus', jaEnviou: true, agora: AGORA })
    expect(v.prova.permitido).toBe(true)
    expect(v.relatorio.permitido).toBe(true)
  })

  it('o gabarito não sai antes do fim nem para conta paga', () => {
    const v = resolverDownloadsDaProva(agendada(), { accountType: 'plus', jaEnviou: true, agora: AGORA })
    expect(v.gabarito.permitido).toBe(false)
    expect(v.gabarito.esperandoOFim).toBe(true)
  })

  it('entregar cedo não antecipa o gabarito da turma', () => {
    const v = resolverDownloadsDaProva(agendada({ freeDownloads: { gabarito: true } }), {
      accountType: 'gratuito',
      jaEnviou: true,
      agora: AGORA,
    })
    expect(v.gabarito.permitido).toBe(false)
    expect(v.gabarito.esperandoOFim).toBe(true)
  })

  it('depois do fim, a conta paga baixa o gabarito', () => {
    const v = resolverDownloadsDaProva(encerrada, { accountType: 'quest', jaEnviou: true, agora: AGORA })
    expect(v.gabarito.permitido).toBe(true)
  })

  it('a liberação da prova é a exceção de plano: gratuito baixa o que o admin ligou', () => {
    const v = resolverDownloadsDaProva(agendada({ freeDownloads: { relatorio: true } }), {
      accountType: 'gratuito',
      jaEnviou: true,
      agora: AGORA,
    })
    expect(v.relatorio.permitido).toBe(true)
    expect(v.prova.permitido).toBe(false)
  })

  it('a liberação é por arquivo, não um interruptor geral', () => {
    const v = resolverDownloadsDaProva(encerrada, {
      accountType: 'gratuito',
      jaEnviou: true,
      agora: AGORA,
    })
    expect(v.gabarito.permitido).toBe(false)

    const comGabarito = resolverDownloadsDaProva(
      { ...encerrada, freeDownloads: { gabarito: true } } as any,
      { accountType: 'gratuito', jaEnviou: true, agora: AGORA },
    )
    expect(comGabarito.gabarito.permitido).toBe(true)
    expect(comGabarito.relatorio.permitido).toBe(false)
  })

  it('o relatório exige a entrega numa prova avaliativa', () => {
    const v = resolverDownloadsDaProva(agendada({ freeDownloads: { relatorio: true } }), {
      accountType: 'plus',
      jaEnviou: false,
      agora: AGORA,
    })
    expect(v.relatorio.permitido).toBe(false)
    expect(v.relatorio.esperandoOFim).toBe(true)
  })

  it('no treino não há entrega a esperar', () => {
    const v = resolverDownloadsDaProva(agendada({ isPracticeExam: true }), {
      accountType: 'plus',
      jaEnviou: false,
      agora: AGORA,
    })
    expect(v.relatorio.permitido).toBe(true)
    expect(v.gabarito.permitido).toBe(true)
  })

  it('admin passa por cima das duas regras', () => {
    const v = resolverDownloadsDaProva(agendada(), { accountType: 'gratuito', isAdmin: true, agora: AGORA })
    expect(v.prova.permitido).toBe(true)
    expect(v.gabarito.permitido).toBe(true)
  })
})

describe('provaJaEncerrou', () => {
  it('treino e prova pessoal não esperam relógio', () => {
    expect(provaJaEncerrou(agendada({ isPracticeExam: true }), AGORA)).toBe(true)
    expect(provaJaEncerrou(agendada({ isPersonalExam: true }), AGORA)).toBe(true)
  })

  it('usa endTime, não gatesClose', () => {
    expect(provaJaEncerrou(agendada({ gatesClose: new Date('2026-05-10T14:15:00Z') }), AGORA)).toBe(false)
  })
})


/**
 * A lista de provas feitas (`/profile` e o diálogo de `/provas`) gerava os três
 * PDFs — prova, respostas e gabarito — sem consultar portão nenhum. Uma conta
 * gratuita baixava os três por ali enquanto a mesma conta era barrada em
 * `/provas` e na tela da prova: a porta da frente trancada, a dos fundos não.
 *
 * O veredito é o mesmo de sempre; o que faltava era o caminho até ele. Estes
 * testes travam o mapeamento, que é a peça que quebra em silêncio.
 */
describe('provaDaSubmissao — o veredito a partir de uma prova já entregue', () => {
  const encerradaEm = new Date('2026-05-10T14:30:00Z')
  const terminaDepois = new Date('2026-05-10T23:00:00Z')

  it('conta gratuita não baixa nada de uma prova encerrada', () => {
    const v = resolverDownloadsDaProva(
      provaDaSubmissao({ examEndTime: encerradaEm }),
      { accountType: 'gratuito', jaEnviou: true, agora: AGORA },
    )
    expect(v.prova.permitido).toBe(false)
    expect(v.relatorio.permitido).toBe(false)
    expect(v.gabarito.permitido).toBe(false)
    // A recusa é de plano, não de tempo: assinar resolve.
    expect(v.prova.esperandoOFim).toBe(false)
  })

  it('conta paga baixa os três quando a prova encerrou', () => {
    const v = resolverDownloadsDaProva(
      provaDaSubmissao({ examEndTime: encerradaEm }),
      { accountType: 'quest', jaEnviou: true, agora: AGORA },
    )
    expect(v.prova.permitido).toBe(true)
    expect(v.relatorio.permitido).toBe(true)
    expect(v.gabarito.permitido).toBe(true)
  })

  it('o gabarito continua esperando o término mesmo para quem paga', () => {
    const v = resolverDownloadsDaProva(
      provaDaSubmissao({ examEndTime: terminaDepois }),
      { accountType: 'plus', jaEnviou: true, agora: AGORA },
    )
    expect(v.relatorio.permitido).toBe(true)
    expect(v.gabarito.permitido).toBe(false)
    expect(v.gabarito.esperandoOFim).toBe(true)
  })

  it('carrega a exceção que o admin abriu na prova', () => {
    const v = resolverDownloadsDaProva(
      provaDaSubmissao({ examEndTime: encerradaEm, freeDownloads: { relatorio: true } }),
      { accountType: 'gratuito', jaEnviou: true, agora: AGORA },
    )
    expect(v.relatorio.permitido).toBe(true)
    expect(v.prova.permitido).toBe(false)
  })

  it('prova de treino e prova pessoal não esperam término nenhum', () => {
    for (const campo of ['isPracticeExam', 'isPersonalExam'] as const) {
      const v = resolverDownloadsDaProva(
        provaDaSubmissao({ examEndTime: terminaDepois, [campo]: true }),
        { accountType: 'plus', jaEnviou: true, agora: AGORA },
      )
      expect(v.gabarito.permitido, campo).toBe(true)
    }
  })

  it('aceita a data em texto, que é como ela chega do JSON da API', () => {
    const v = resolverDownloadsDaProva(
      provaDaSubmissao({ examEndTime: encerradaEm.toISOString() }),
      { accountType: 'plus', jaEnviou: true, agora: AGORA },
    )
    expect(v.gabarito.permitido).toBe(true)
  })

  it('submissão sem fim conhecido não libera o gabarito por engano', () => {
    const v = resolverDownloadsDaProva(
      provaDaSubmissao({ examEndTime: null }),
      { accountType: 'plus', jaEnviou: true, agora: AGORA },
    )
    expect(v.gabarito.permitido).toBe(false)
  })

  it('admin passa por cima, como em todo lugar', () => {
    const v = resolverDownloadsDaProva(
      provaDaSubmissao({ examEndTime: terminaDepois }),
      { accountType: 'gratuito', isAdmin: true, agora: AGORA },
    )
    expect(v.gabarito.permitido).toBe(true)
  })
})
