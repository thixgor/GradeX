import { describe, expect, it } from 'vitest'
import {
  aplicarOrdem,
  escopoDaProva,
  filtroDoEscopo,
  moverNaLista,
  ordenarProvas,
  participaDaOrdem,
  provasDoEscopo,
  sequenciaFinal,
} from '@/lib/provas/ordem-das-provas'

function prova(id: string, campos: Record<string, any> = {}) {
  return { _id: id, createdAt: new Date('2026-01-01T00:00:00Z'), ...campos } as any
}

const ids = (lista: any[]) => lista.map((p) => String(p._id))

describe('escopoDaProva', () => {
  it('trata a prateleira das soltas como uma lista de verdade', () => {
    expect(escopoDaProva({ groupId: 'g1' })).toBe('g1')
    expect(escopoDaProva({})).toBeNull()
    expect(escopoDaProva({ groupId: null })).toBeNull()
  })
})

describe('ordenarProvas', () => {
  it('quem foi posicionada vem primeiro, na posição recebida', () => {
    const lista = [
      prova('c', { orderInGroup: 2 }),
      prova('a', { orderInGroup: 0 }),
      prova('b', { orderInGroup: 1 }),
    ]
    expect(ids(ordenarProvas(lista))).toEqual(['a', 'b', 'c'])
  })

  it('lista que ninguém organizou continua da mais nova para a mais antiga', () => {
    // É a ordem que a tela já mostrava (`createdAt: -1` do Mongo): quem nunca
    // usou a reordenação não vê nada mudar de lugar.
    const lista = [
      prova('velha', { createdAt: new Date('2026-01-01T00:00:00Z') }),
      prova('nova', { createdAt: new Date('2026-03-01T00:00:00Z') }),
      prova('media', { createdAt: new Date('2026-02-01T00:00:00Z') }),
    ]
    expect(ids(ordenarProvas(lista))).toEqual(['nova', 'media', 'velha'])
  })

  it('prova nova entra no fim de uma lista arrumada, não no meio dela', () => {
    const lista = [
      prova('recem-criada', { createdAt: new Date('2026-06-01T00:00:00Z') }),
      prova('primeira', { orderInGroup: 0 }),
      prova('segunda', { orderInGroup: 1 }),
    ]
    expect(ids(ordenarProvas(lista))).toEqual(['primeira', 'segunda', 'recem-criada'])
  })

  it('empate não deixa a ordem por conta do banco', () => {
    // Duas provas na mesma posição não deveriam existir, mas `sort` sem
    // desempate total devolveria a ordem que o Mongo tivesse mandado — e uma
    // lista que muda sozinha entre dois carregamentos é irreproduzível.
    const comoVeio = [prova('z', { orderInGroup: 1 }), prova('a', { orderInGroup: 1 })]
    const aoContrario = [prova('a', { orderInGroup: 1 }), prova('z', { orderInGroup: 1 })]
    expect(ids(ordenarProvas(comoVeio))).toEqual(ids(ordenarProvas(aoContrario)))
  })

  it('ignora posição que não é número', () => {
    const lista = [
      prova('quebrada', { orderInGroup: Number.NaN, createdAt: new Date('2026-01-01T00:00:00Z') }),
      prova('boa', { orderInGroup: 0 }),
    ]
    expect(ids(ordenarProvas(lista))).toEqual(['boa', 'quebrada'])
  })

  it('não muta o array recebido', () => {
    const lista = [prova('b', { orderInGroup: 1 }), prova('a', { orderInGroup: 0 })]
    const original = ids(lista)
    ordenarProvas(lista)
    expect(ids(lista)).toEqual(original)
  })
})

describe('moverNaLista', () => {
  const lista = ['a', 'b', 'c']

  it('troca com o vizinho', () => {
    expect(moverNaLista(lista, 'b', 'antes')).toEqual(['b', 'a', 'c'])
    expect(moverNaLista(lista, 'b', 'depois')).toEqual(['a', 'c', 'b'])
  })

  it('clique na ponta não é erro, é um clique sem efeito', () => {
    expect(moverNaLista(lista, 'a', 'antes')).toEqual(lista)
    expect(moverNaLista(lista, 'c', 'depois')).toEqual(lista)
    expect(moverNaLista(lista, 'fantasma', 'antes')).toEqual(lista)
  })

  it('devolve sempre uma lista nova', () => {
    const saida = moverNaLista(lista, 'a', 'antes')
    expect(saida).not.toBe(lista)
  })
})

describe('aplicarOrdem', () => {
  it('grava a posição nova no objeto, para o redesenho concordar', () => {
    // Sem isto, o cartão voltaria para o lugar antigo assim que a tela
    // reordenasse de novo — o clique pareceria não ter funcionado.
    const lista = [prova('a'), prova('b')]
    const depois = aplicarOrdem(lista, ['b', 'a'])
    expect(ids(ordenarProvas(depois))).toEqual(['b', 'a'])
    // Não muta os originais.
    expect(lista[0].orderInGroup).toBeUndefined()
  })

  it('deixa em paz quem não está na sequência', () => {
    const deOutroGrupo = prova('x', { orderInGroup: 7 })
    const [saida] = aplicarOrdem([deOutroGrupo], ['a', 'b'])
    expect(saida.orderInGroup).toBe(7)
  })
})

describe('participaDaOrdem', () => {
  it('prova pessoal fica de fora da ordem do catálogo', () => {
    expect(participaDaOrdem({ isPersonalExam: true })).toBe(false)
    expect(participaDaOrdem({})).toBe(true)
  })
})

describe('provasDoEscopo', () => {
  it('separa cada lista e ordena só ela', () => {
    const todas = [
      prova('g1-b', { groupId: 'g1', orderInGroup: 1 }),
      prova('solta-a', { orderInGroup: 0 }),
      prova('g1-a', { groupId: 'g1', orderInGroup: 0 }),
      prova('solta-b', { orderInGroup: 1 }),
    ]
    expect(ids(provasDoEscopo(todas, 'g1'))).toEqual(['g1-a', 'g1-b'])
    expect(ids(provasDoEscopo(todas, null))).toEqual(['solta-a', 'solta-b'])
  })

  it('deixa a prova pessoal de fora, como o filtro do servidor', () => {
    /*
     * A tela conta a lista para dizer "3 de 12" e para desabilitar a seta na
     * ponta; o servidor conta para gravar as posições. Se as duas contagens
     * discordarem sobre quem entra, a seta desabilita na prova errada.
     */
    const todas = [
      prova('geral', { orderInGroup: 0 }),
      prova('minha', { isPersonalExam: true, orderInGroup: 1 }),
    ]
    expect(ids(provasDoEscopo(todas, null))).toEqual(['geral'])
    expect(filtroDoEscopo(null)).toMatchObject({ isPersonalExam: { $ne: true } })
    expect(filtroDoEscopo('g1')).toMatchObject({ isPersonalExam: { $ne: true }, groupId: 'g1' })
  })
})

describe('filtroDoEscopo', () => {
  it('a prateleira das soltas cobre as três formas de "sem grupo"', () => {
    // Prova antiga nunca teve o campo; `move-group` grava null ao tirar do
    // grupo; string vazia também já apareceu. Ver só uma delas ordenaria meia
    // lista e deixaria a outra metade no fim, como se fosse recém-criada.
    expect(filtroDoEscopo(null)).toMatchObject({
      $or: [{ groupId: null }, { groupId: { $exists: false } }, { groupId: '' }],
    })
    expect(filtroDoEscopo('g1')).toMatchObject({ groupId: 'g1' })
  })
})

describe('sequenciaFinal', () => {
  const escopo = [
    prova('a', { orderInGroup: 0 }),
    prova('b', { orderInGroup: 1 }),
    prova('c', { orderInGroup: 2 }),
  ]

  it('honra o pedido do cliente', () => {
    expect(sequenciaFinal(escopo, ['c', 'a', 'b'])).toEqual(['c', 'a', 'b'])
  })

  it('acomoda no fim quem o cliente não mencionou', () => {
    // A corrida real: alguém publica uma prova enquanto o admin arruma a
    // página. Recusar com 400 seria punir o admin por algo que não é dele.
    const comProvaNova = [...escopo, prova('nova', { createdAt: new Date('2026-09-01T00:00:00Z') })]
    expect(sequenciaFinal(comProvaNova, ['c', 'a', 'b'])).toEqual(['c', 'a', 'b', 'nova'])
  })

  it('o resultado é sempre uma permutação exata do escopo', () => {
    // Ids repetidos ou de fora não podem gerar posição duplicada nem sumir
    // com uma prova da lista.
    const saida = sequenciaFinal(escopo, ['b', 'b', 'fantasma', 'a'])
    expect(saida).toEqual(['b', 'a', 'c'])
    expect([...saida].sort()).toEqual(['a', 'b', 'c'])
  })

  it('sem pedido nenhum, devolve a ordem padrão do escopo', () => {
    expect(sequenciaFinal(escopo, [])).toEqual(['a', 'b', 'c'])
  })
})

describe('ida e volta: clique na seta até a lista recarregada', () => {
  /*
   * As peças são testadas uma a uma acima; aqui é o encaixe delas, que é onde
   * a funcionalidade tinha se perdido antes. O caminho real é:
   *
   *   tela        moverNaLista   → a sequência que o admin quer ver
   *   tela        aplicarOrdem   → o cartão anda na hora (otimista)
   *   servidor    sequenciaFinal → o que vai para o banco
   *   tela        ordenarProvas  → o que aparece quando a lista recarrega
   *
   * Se qualquer um dos quatro discordar, o cartão volta para o lugar antigo no
   * próximo redesenho — o sintoma exato de "cliquei e não aconteceu nada".
   */
  function ciclo(escopo: any[], id: string, direcao: 'antes' | 'depois') {
    const listaAtual = ids(provasDoEscopo(escopo, null))
    const pedida = moverNaLista(listaAtual, id, direcao)

    const naTelaAgora = ids(ordenarProvas(aplicarOrdem(escopo, pedida)))

    // O servidor grava a sequência como posições 0..n-1.
    const gravada = sequenciaFinal(escopo, pedida)
    const comoVoltaDoBanco = escopo.map((p) => ({
      ...p,
      orderInGroup: gravada.indexOf(String(p._id)),
    }))
    const depoisDeRecarregar = ids(ordenarProvas(comoVoltaDoBanco))

    return { naTelaAgora, depoisDeRecarregar }
  }

  it('a prova fica onde o admin a colocou, antes e depois de recarregar', () => {
    const escopo = [prova('a'), prova('b'), prova('c')].map((p, i) => ({
      ...p,
      createdAt: new Date(2026, 0, 3 - i),
    }))
    // Sem posição nenhuma, a ordem é a da tela: mais nova primeiro (a, b, c).
    expect(ids(ordenarProvas(escopo))).toEqual(['a', 'b', 'c'])

    const { naTelaAgora, depoisDeRecarregar } = ciclo(escopo, 'c', 'antes')
    expect(naTelaAgora).toEqual(['a', 'c', 'b'])
    expect(depoisDeRecarregar).toEqual(naTelaAgora)
  })

  it('mover a mesma prova duas vezes a leva até a frente', () => {
    let escopo: any[] = [prova('a'), prova('b'), prova('c')].map((p, i) => ({
      ...p,
      createdAt: new Date(2026, 0, 3 - i),
    }))

    for (let i = 0; i < 2; i++) {
      const lista = ids(provasDoEscopo(escopo, null))
      const pedida = moverNaLista(lista, 'c', 'antes')
      escopo = aplicarOrdem(escopo, sequenciaFinal(escopo, pedida))
    }
    expect(ids(ordenarProvas(escopo))).toEqual(['c', 'a', 'b'])
  })

  it('uma prova publicada no meio da arrumação não desfaz a ordem', () => {
    const escopo = [
      prova('a', { orderInGroup: 0 }),
      prova('b', { orderInGroup: 1 }),
      prova('c', { orderInGroup: 2 }),
    ]
    const pedida = moverNaLista(ids(provasDoEscopo(escopo, null)), 'c', 'antes')

    // O servidor vê uma prova que a tela nem tinha carregado.
    const noBanco = [...escopo, prova('recem-publicada', { createdAt: new Date(2026, 8, 1) })]
    const gravada = sequenciaFinal(noBanco, pedida)

    expect(gravada).toEqual(['a', 'c', 'b', 'recem-publicada'])
  })
})

