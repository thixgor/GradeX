import { describe, expect, it } from 'vitest'
import { avaliarEntrega } from '@/lib/provas/entrega-da-prova'
import { TOLERANCIA_DE_ENTREGA_MS, resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'

const PORTAO = new Date('2025-09-07T16:00:00.000Z')
const INICIO = new Date('2025-09-07T17:00:00.000Z')
const FIM = new Date('2025-09-07T20:00:00.000Z')

const prova = { gatesOpen: PORTAO, startTime: INICIO, endTime: FIM, gatesClose: FIM }

const pedido = (agora: Date, respostasGravadas = 8) => ({
  prova,
  // A mesma janela que o servidor resolveria naquele instante.
  janela: resolverJanelaDaProva(prova, agora, { jaEntrou: true }),
  agora,
  respostasGravadas,
})

describe('a entrega dentro da janela', () => {
  it('é aceita sem nenhuma marca de atraso', () => {
    expect(avaliarEntrega(pedido(new Date('2025-09-07T19:30:00.000Z')))).toEqual({
      aceita: true,
      origem: 'no-prazo',
      atrasoMs: 0,
    })
  })
})

describe('a folga de transporte, que já existia', () => {
  it('aceita a entrega que o próprio término disparou', () => {
    /*
     * Ela sai no milissegundo do prazo e chega depois da viagem de rede.
     * Quem decide isto é `podeEntregarNoLimite`, em janela-da-prova.ts;
     * `avaliarEntrega` só a coloca como primeira camada.
     */
    const veredito = avaliarEntrega(pedido(new Date(FIM.getTime() + 1_000)))
    expect(veredito).toEqual({ aceita: true, origem: 'tolerancia', atrasoMs: 1_000 })
  })

  it('vale até o limite da tolerância, e ali passa a bola para o rascunho', () => {
    const noLimite = avaliarEntrega(pedido(new Date(FIM.getTime() + TOLERANCIA_DE_ENTREGA_MS)))
    expect(noLimite).toMatchObject({ aceita: true, origem: 'tolerancia' })

    const depois = avaliarEntrega(pedido(new Date(FIM.getTime() + TOLERANCIA_DE_ENTREGA_MS + 1)))
    expect(depois).toMatchObject({ aceita: true, origem: 'rascunho' })
  })
})

describe('a camada nova: a entrega de quem estava fora do ar', () => {
  it('passa a valer o rascunho — e não o que o cliente mandar', () => {
    /*
     * A folga de transporte pressupõe alguém na frente da tela quando o sinal
     * toca. A aba escondida, o celular na mochila e o "Forçar Término" com a
     * sala respondendo não têm esse alguém. As respostas estão gravadas no
     * servidor; o que muda é de onde elas saem — e por isso segurar o POST não
     * compra tempo de prova nenhum.
     */
    const veredito = avaliarEntrega(pedido(new Date('2025-09-07T20:40:00.000Z')))
    expect(veredito).toMatchObject({ aceita: true, origem: 'rascunho', atrasoMs: 40 * 60_000 })
  })

  it('sem rascunho não há entrega atrasada: não existe o que entregar', () => {
    const veredito = avaliarEntrega(pedido(new Date('2025-09-07T20:40:00.000Z'), 0))
    expect(veredito.aceita).toBe(false)
  })
})

describe('a prova que ainda não começou', () => {
  it('é recusada antes de qualquer folga, e com a mensagem certa', () => {
    /*
     * `podeEnviar` é falso nos dois extremos da janela. Tratar "antes do
     * início" com as regras do término devolveria a mensagem errada — e uma
     * folga ANTES da prova seria tempo de prova adiantado.
     */
    const veredito = avaliarEntrega(pedido(new Date('2025-09-07T16:30:00.000Z')))
    expect(veredito.aceita).toBe(false)
    if (!veredito.aceita) expect(veredito.motivo).not.toMatch(/terminou/)
  })
})

describe('prova de treino e prova pessoal', () => {
  it('não têm janela, então entregam sempre no prazo', () => {
    const treino = { ...prova, isPracticeExam: true }
    const agora = new Date('2027-01-01T00:00:00.000Z')
    expect(
      avaliarEntrega({
        prova: treino,
        janela: resolverJanelaDaProva(treino, agora),
        agora,
        respostasGravadas: 0,
      }),
    ).toMatchObject({ aceita: true, origem: 'no-prazo' })
  })
})
