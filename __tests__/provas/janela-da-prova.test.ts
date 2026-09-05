import { describe, expect, it } from 'vitest'
import {
  fimDaProva,
  indiceDoProximoMarco,
  marcosDaJanela,
  prazoDeEntrega,
  resolverJanelaDaProva,
} from '@/lib/provas/janela-da-prova'

const HORA = 60 * 60 * 1000

function prova(campos: Record<string, any> = {}) {
  return {
    startTime: new Date('2026-05-10T14:00:00Z'),
    endTime: new Date('2026-05-10T18:00:00Z'),
    ...campos,
  } as any
}

describe('resolverJanelaDaProva', () => {
  it('trata prova de treino e prova pessoal como sem janela', () => {
    const treino = resolverJanelaDaProva(prova({ isPracticeExam: true }), new Date('2030-01-01T00:00:00Z'))
    expect(treino.fase).toBe('livre')
    expect(treino.podeIniciar).toBe(true)

    const pessoal = resolverJanelaDaProva(prova({ isPersonalExam: true }), new Date('2030-01-01T00:00:00Z'))
    expect(pessoal.fase).toBe('livre')
  })

  it('sem portões, a entrada segue a própria prova', () => {
    const antes = resolverJanelaDaProva(prova(), new Date('2026-05-10T13:59:00Z'))
    expect(antes.fase).toBe('antes-do-portao')
    expect(antes.podeEntrar).toBe(false)
    expect(antes.podeIniciar).toBe(false)

    const durante = resolverJanelaDaProva(prova(), new Date('2026-05-10T15:00:00Z'))
    expect(durante.fase).toBe('em-andamento')
    expect(durante.podeIniciar).toBe(true)
  })

  it('portão que fecha antes do início fecha a entrada, mesmo com a prova por começar', () => {
    /*
     * O vestibular: portão 13h–13h50, prova às 14h. Das 13h50 às 14h a fase
     * era 'sala-de-espera' — rótulo "Portões abertos" — para quem tinha
     * acabado de perder a entrada. O cartão convidava a entrar e a tela da
     * prova recusava.
     */
    const campos = {
      gatesOpen: new Date('2026-05-10T13:00:00Z'),
      gatesClose: new Date('2026-05-10T13:50:00Z'),
    }
    const deFora = resolverJanelaDaProva(prova(campos), new Date('2026-05-10T13:51:00Z'))
    expect(deFora.fase).toBe('portao-fechado')
    expect(deFora.podeEntrar).toBe(false)
    expect(deFora.motivo).toBe('Os portões desta prova já fecharam — não é mais possível entrar.')

    // Quem já entrou continua esperando na sala: o portão fechado é um fato
    // sobre os outros.
    const deDentro = resolverJanelaDaProva(
      prova(campos),
      new Date('2026-05-10T13:51:00Z'),
      { jaEntrou: true },
    )
    expect(deDentro.fase).toBe('sala-de-espera')
    // Continua sem poder iniciar: a prova é que ainda não começou.
    expect(deDentro.podeIniciar).toBe(false)

    // E às 14h a prova começa normalmente para ele.
    const asDuas = resolverJanelaDaProva(
      prova(campos),
      new Date('2026-05-10T14:00:00Z'),
      { jaEntrou: true },
    )
    expect(asDuas.fase).toBe('em-andamento')
    expect(asDuas.podeIniciar).toBe(true)
  })

  it('portão aberto antes do início abre a sala de espera, não a prova', () => {
    const janela = resolverJanelaDaProva(
      prova({ gatesOpen: new Date('2026-05-10T13:00:00Z'), gatesClose: new Date('2026-05-10T14:30:00Z') }),
      new Date('2026-05-10T13:30:00Z'),
    )
    expect(janela.fase).toBe('sala-de-espera')
    expect(janela.podeEntrar).toBe(true)
    expect(janela.podeIniciar).toBe(false)
  })

  /*
   * O vestibular: portão das 13h às 13h50, prova das 14h às 18h.
   *
   * `podeIniciar` era `podeEntrar && comecou`, e nessa montagem — a mais comum
   * que existe — ninguém começava: às 14h o portão já tinha fechado, e a sala
   * de espera inteira ficava olhando um botão travado. O portão limita a
   * CHEGADA; quem chegou faz a prova.
   */
  describe('o portão limita a chegada, não o começo', () => {
    const vestibular = () =>
      prova({
        gatesOpen: new Date('2026-05-10T13:00:00Z'),
        gatesClose: new Date('2026-05-10T13:50:00Z'),
      })

    it('quem entrou na sala às 13h30 começa às 14h, com o portão já fechado', () => {
      const janela = resolverJanelaDaProva(vestibular(), new Date('2026-05-10T14:05:00Z'), {
        jaEntrou: true,
      })
      expect(janela.podeIniciar).toBe(true)
      // Para quem está dentro, o portão fechado é um fato sobre os outros.
      expect(janela.fase).toBe('em-andamento')
      expect(janela.jaEntrou).toBe(true)
    })

    it('quem NÃO entrou continua barrado às 14h05', () => {
      const janela = resolverJanelaDaProva(vestibular(), new Date('2026-05-10T14:05:00Z'), {
        jaEntrou: false,
      })
      expect(janela.podeIniciar).toBe(false)
      expect(janela.podeEntrar).toBe(false)
      expect(janela.fase).toBe('portao-fechado')
    })

    it('sem contexto, o veredito é o de quem está do lado de fora', () => {
      const janela = resolverJanelaDaProva(vestibular(), new Date('2026-05-10T14:05:00Z'))
      expect(janela.jaEntrou).toBe(false)
      expect(janela.podeIniciar).toBe(false)
    })

    it('ter entrado não adianta a prova: às 13h30 ainda é sala de espera', () => {
      const janela = resolverJanelaDaProva(vestibular(), new Date('2026-05-10T13:30:00Z'), {
        jaEntrou: true,
      })
      expect(janela.fase).toBe('sala-de-espera')
      expect(janela.podeIniciar).toBe(false)
    })

    it('ter entrado não ressuscita a prova encerrada', () => {
      const janela = resolverJanelaDaProva(vestibular(), new Date('2026-05-10T18:30:00Z'), {
        jaEntrou: true,
      })
      expect(janela.fase).toBe('encerrada')
      expect(janela.podeIniciar).toBe(false)
      expect(janela.podeEnviar).toBe(false)
    })

    it('prova sem janela ignora o portão e conta todo mundo como dentro', () => {
      const janela = resolverJanelaDaProva(prova({ isPracticeExam: true }), new Date())
      expect(janela.jaEntrou).toBe(true)
      expect(janela.podeIniciar).toBe(true)
    })
  })

  it('portão fechado impede entrar, mas não impede quem já está dentro de entregar', () => {
    const janela = resolverJanelaDaProva(
      prova({ gatesOpen: new Date('2026-05-10T13:00:00Z'), gatesClose: new Date('2026-05-10T14:30:00Z') }),
      new Date('2026-05-10T16:00:00Z'),
    )
    expect(janela.fase).toBe('portao-fechado')
    expect(janela.podeEntrar).toBe(false)
    expect(janela.podeIniciar).toBe(false)
    expect(janela.podeEnviar).toBe(true)
    expect(janela.encerrada).toBe(false)
  })

  it('depois do término tudo fecha, mesmo com o portão configurado adiante', () => {
    const janela = resolverJanelaDaProva(
      prova({ gatesClose: new Date('2026-05-10T23:00:00Z') }),
      new Date('2026-05-10T18:00:01Z'),
    )
    expect(janela.fase).toBe('encerrada')
    expect(janela.podeEnviar).toBe(false)
    expect(janela.encerrada).toBe(true)
  })

  it('o fim da prova é endTime, nunca gatesClose', () => {
    const p = prova({ gatesClose: new Date('2026-05-10T14:30:00Z') })
    expect(fimDaProva(p)?.toISOString()).toBe('2026-05-10T18:00:00.000Z')
  })

  it('prova avaliativa sem datas não vira prova trancada', () => {
    const janela = resolverJanelaDaProva({ title: 'legado' } as any, new Date())
    expect(janela.fase).toBe('livre')
    expect(janela.podeIniciar).toBe(true)
  })
})

describe('prazoDeEntrega', () => {
  it('sem duração própria, o prazo é o fim da prova', () => {
    expect(prazoDeEntrega(prova(), new Date('2026-05-10T14:00:00Z'))?.toISOString()).toBe(
      '2026-05-10T18:00:00.000Z',
    )
  })

  it('com duração menor que a janela, cada aluno tem o próprio prazo', () => {
    const prazo = prazoDeEntrega(prova({ duration: 90 }), new Date('2026-05-10T14:10:00Z'))
    expect(prazo?.toISOString()).toBe('2026-05-10T15:40:00.000Z')
  })

  it('a duração individual nunca ultrapassa o fim da prova', () => {
    const prazo = prazoDeEntrega(prova({ duration: 600 }), new Date('2026-05-10T17:00:00Z'))
    expect(prazo?.toISOString()).toBe('2026-05-10T18:00:00.000Z')
  })

  it('sem início conhecido, cai para o fim da prova', () => {
    expect(prazoDeEntrega(prova({ duration: 90 }), null)?.getTime()).toBe(
      new Date('2026-05-10T18:00:00Z').getTime(),
    )
  })

  it('a janela de 4h continua sendo o teto quando a duração cabe nela', () => {
    const inicio = new Date('2026-05-10T14:00:00Z')
    const prazo = prazoDeEntrega(prova({ duration: 120 }), inicio)
    expect(prazo!.getTime() - inicio.getTime()).toBe(2 * HORA)
  })
})


/*
 * A linha do tempo que se contradizia.
 *
 * Ela era uma lista fixa (abre, começa, termina, fecha) e o "já passou" vinha
 * de uma CONTAGEM: `passados` contava quantos marcos tinham acontecido e os
 * primeiros dessa quantidade eram pintados de verde. Só funciona se a lista
 * estiver em ordem cronológica — e o vestibular, que a correção do portão
 * tornou válido, é exatamente o caso em que ela não está.
 *
 * Com portão fechando às 00:12 e prova começando às 00:15, às 00:45 a tela
 * marcava "Prova termina 01:35" como concluída e deixava "Portão fecha 00:12"
 * em negrito, como se ainda fosse acontecer.
 */
describe('marcosDaJanela', () => {
  const vestibular = resolverJanelaDaProva(
    {
      startTime: new Date('2026-09-05T00:15:00Z'),
      endTime: new Date('2026-09-05T01:35:00Z'),
      gatesOpen: new Date('2026-09-05T00:09:00Z'),
      gatesClose: new Date('2026-09-05T00:12:00Z'),
    } as any,
    new Date('2026-09-05T00:45:00Z'),
    { jaEntrou: true },
  )

  const agora = new Date('2026-09-05T00:45:00Z')

  it('ordena pelo relógio, não pela ordem em que os campos foram escritos', () => {
    expect(marcosDaJanela(vestibular, agora).map((m) => m.rotulo)).toEqual([
      'Portão abre',
      'Portão fecha',
      'Prova começa',
      'Prova termina',
    ])
  })

  it('cada marco responde pelo próprio horário', () => {
    const marcos = marcosDaJanela(vestibular, agora)
    const porRotulo = Object.fromEntries(marcos.map((m) => [m.rotulo, m.jaPassou]))
    expect(porRotulo['Portão abre']).toBe(true)
    expect(porRotulo['Portão fecha']).toBe(true)
    expect(porRotulo['Prova começa']).toBe(true)
    // O defeito: às 00:45 a contagem marcava o término das 01:35 como passado.
    expect(porRotulo['Prova termina']).toBe(false)
  })

  it('o destaque vai para o PRÓXIMO marco, não para o último que passou', () => {
    const marcos = marcosDaJanela(vestibular, agora)
    expect(marcos[indiceDoProximoMarco(marcos)].rotulo).toBe('Prova termina')
  })

  it('depois do último marco não há próximo', () => {
    const marcos = marcosDaJanela(vestibular, new Date('2026-09-05T02:00:00Z'))
    expect(marcos.every((m) => m.jaPassou)).toBe(true)
    expect(indiceDoProximoMarco(marcos)).toBe(-1)
  })

  it('na ordem clássica (portão fecha por último) nada muda', () => {
    const classico = resolverJanelaDaProva(
      {
        startTime: new Date('2026-05-10T14:00:00Z'),
        endTime: new Date('2026-05-10T18:00:00Z'),
        gatesOpen: new Date('2026-05-10T13:00:00Z'),
        gatesClose: new Date('2026-05-10T18:30:00Z'),
      } as any,
      new Date('2026-05-10T15:00:00Z'),
    )
    expect(marcosDaJanela(classico, new Date('2026-05-10T15:00:00Z')).map((m) => m.rotulo)).toEqual([
      'Portão abre',
      'Prova começa',
      'Prova termina',
      'Portão fecha',
    ])
  })

  it('prova sem portões cai para as datas da própria prova, sem duplicar rótulo', () => {
    const semPortoes = resolverJanelaDaProva(
      { startTime: new Date('2026-05-10T14:00:00Z'), endTime: new Date('2026-05-10T18:00:00Z') } as any,
      new Date('2026-05-10T13:00:00Z'),
    )
    const marcos = marcosDaJanela(semPortoes, new Date('2026-05-10T13:00:00Z'))
    expect(marcos).toHaveLength(4)
    expect(marcos.every((m) => m.quando !== null)).toBe(true)
    // Sem portão, "abre" coincide com o início e "fecha" com o término.
    expect(marcos[0].ms).toBe(marcos[1].ms)
    expect(marcos[2].ms).toBe(marcos[3].ms)
  })
})
