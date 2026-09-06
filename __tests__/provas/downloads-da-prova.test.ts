import { describe, expect, it } from 'vitest'
import {
  esperasDaProva,
  normalizarEsperas,
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
    expect(normalizarLiberacoes(undefined)).toEqual({ prova: false, relatorio: false, gabarito: false, compacto: false })
  })

  it('só o booleano true liga', () => {
    expect(normalizarLiberacoes({ prova: 'true', relatorio: 1, gabarito: true })).toEqual({
      prova: false,
      relatorio: false,
      gabarito: true,
      compacto: false,
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

const ASSINANTE = { accountType: 'plus', jaEnviou: false, agora: AGORA }

describe('normalizarEsperas', () => {
  it('ausente é o comportamento de sempre: a prova em branco sai na hora', () => {
    expect(normalizarEsperas(undefined)).toEqual({ prova: 'imediato', relatorio: 'apos-entrega' })
    expect(esperasDaProva(agendada())).toEqual({ prova: 'imediato', relatorio: 'apos-entrega' })
  })

  it('aceita os três momentos', () => {
    expect(normalizarEsperas({ prova: 'apos-termino', relatorio: 'apos-termino' })).toEqual({
      prova: 'apos-termino',
      relatorio: 'apos-termino',
    })
    expect(normalizarEsperas({ prova: 'apos-entrega' }).prova).toBe('apos-entrega')
  })

  it('converte o formato antigo, em vez de destravar em silêncio', () => {
    /*
     * A primeira versão gravava três booleanos. As provas configuradas assim
     * continuam no banco: uma leitura que os ignorasse liberaria um download
     * que o admin tinha travado, sem ninguém notar.
     */
    expect(normalizarEsperas({ prova: true }).prova).toBe('apos-termino')
    expect(normalizarEsperas({ entrega: true }).prova).toBe('apos-entrega')
    expect(normalizarEsperas({ relatorio: true }).relatorio).toBe('apos-termino')
    expect(normalizarEsperas({ prova: false, relatorio: false }).prova).toBe('imediato')
  })

  it('valor estranho cai no padrão, e não numa trava acidental', () => {
    expect(normalizarEsperas({ prova: 'qualquer-coisa' }).prova).toBe('imediato')
    expect(normalizarEsperas({ relatorio: 'nunca' }).relatorio).toBe('apos-entrega')
  })
})

describe('segurar downloads até o término', () => {
  it('sem a opção, a prova em branco sai durante a prova', () => {
    const v = resolverDownloadsDaProva(agendada(), ASSINANTE)
    expect(v.prova.permitido).toBe(true)
  })

  it('com a opção, a prova em branco espera o término', () => {
    /*
     * O caso que a regra fixa não cobria: numa janela larga ou em duas
     * chamadas, quem faz às 14h baixa o caderno e manda no grupo; quem faz às
     * 17h chega tendo lido as questões. O arquivo não tem gabarito nenhum e
     * mesmo assim estraga a prova.
     */
    const presa = agendada({ holdDownloads: { prova: 'apos-termino' } })
    const durante = resolverDownloadsDaProva(presa, ASSINANTE)
    expect(durante.prova.permitido).toBe(false)
    expect(durante.prova.esperandoOFim).toBe(true)

    const depois = resolverDownloadsDaProva(
      agendada({ holdDownloads: { prova: 'apos-termino' }, endTime: new Date('2026-05-10T14:30:00Z') }),
      ASSINANTE,
    )
    expect(depois.prova.permitido).toBe(true)
  })

  it('o relatório preso continua exigindo a entrega depois do término', () => {
    const presa = { ...encerrada, holdDownloads: { relatorio: 'apos-termino' } }
    expect(resolverDownloadsDaProva(presa, { ...ASSINANTE, jaEnviou: false }).relatorio.permitido).toBe(false)
    expect(resolverDownloadsDaProva(presa, { ...ASSINANTE, jaEnviou: true }).relatorio.permitido).toBe(true)
  })

  it('a opção não alcança o admin', () => {
    const presa = agendada({ holdDownloads: { prova: 'apos-termino', relatorio: 'apos-termino' } })
    const v = resolverDownloadsDaProva(presa, { isAdmin: true, agora: AGORA })
    expect(v.prova.permitido).toBe(true)
    expect(v.relatorio.permitido).toBe(true)
  })
})

describe('folha de respostas (compacto)', () => {
  it('sai assim que o aluno entrega, sem esperar o término', () => {
    /*
     * Não é gabarito: só as letras que a própria pessoa marcou. Segurá-la até
     * o fim seria esconder de alguém o que ela mesma acabou de escrever.
     */
    const prova = agendada()
    expect(resolverDownloadsDaProva(prova, { ...ASSINANTE, jaEnviou: true }).compacto.permitido).toBe(true)
  })

  it('não sai antes da entrega', () => {
    const v = resolverDownloadsDaProva(agendada(), { ...ASSINANTE, jaEnviou: false })
    expect(v.compacto.permitido).toBe(false)
    expect(v.compacto.esperandoOFim).toBe(true)
  })

  it('a opção de segurar não a alcança: ela não tem enunciado nem gabarito', () => {
    const presa = agendada({ holdDownloads: { prova: 'apos-termino', relatorio: 'apos-termino' } })
    expect(resolverDownloadsDaProva(presa, { ...ASSINANTE, jaEnviou: true }).compacto.permitido).toBe(true)
  })

  it('numa prova de treino não depende de entrega nenhuma', () => {
    const treino = agendada({ isPracticeExam: true })
    expect(resolverDownloadsDaProva(treino, { ...ASSINANTE, jaEnviou: false }).compacto.permitido).toBe(true)
  })
})

describe('esperar a entrega DESTE aluno', () => {
  /*
   * Outra espera, não uma versão fraca da anterior: `prova` olha o relógio da
   * turma, `entrega` olha a pessoa. Numa janela larga, quem termina às 14h30
   * pode levar o caderno sem que isso alcance quem só vai fazer às 17h.
   */
  const soDepoisDeEntregar = agendada({ holdDownloads: { prova: 'apos-entrega' } })

  it('segura a prova em branco até o aluno entregar', () => {
    const antes = resolverDownloadsDaProva(soDepoisDeEntregar, { ...ASSINANTE, jaEnviou: false })
    expect(antes.prova.permitido).toBe(false)
    expect(antes.prova.esperandoOFim).toBe(true)

    const depois = resolverDownloadsDaProva(soDepoisDeEntregar, { ...ASSINANTE, jaEnviou: true })
    expect(depois.prova.permitido).toBe(true)
  })

  it('não espera o término da turma: quem entregou já leva', () => {
    // A prova continua aberta (AGORA < endTime) e mesmo assim o arquivo sai.
    const v = resolverDownloadsDaProva(soDepoisDeEntregar, { ...ASSINANTE, jaEnviou: true })
    expect(provaJaEncerrou(soDepoisDeEntregar, AGORA)).toBe(false)
    expect(v.prova.permitido).toBe(true)
  })

  it('os momentos se excluem: escolher um substitui o outro', () => {
    /*
     * No formato antigo dava para marcar "espera o término" E "espera a
     * entrega" ao mesmo tempo, e o resultado era uma regra que só o código
     * sabia resolver. Agora é uma escolha só, e ela diz exatamente o que
     * acontece.
     */
    const ateOTermino = agendada({ holdDownloads: { prova: 'apos-termino' } })
    expect(esperasDaProva(ateOTermino).prova).toBe('apos-termino')
    // Entregou, mas a turma ainda responde: continua esperando.
    expect(resolverDownloadsDaProva(ateOTermino, { ...ASSINANTE, jaEnviou: true }).prova.permitido).toBe(false)
  })
})

