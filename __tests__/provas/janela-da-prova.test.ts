import { describe, expect, it } from 'vitest'
import {
  fimDaProva,
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
