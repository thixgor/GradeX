import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/**
 * A sessão que sobrevive a sair da tela.
 *
 * O que estes testes seguram é o relato que originou o módulo: "fiz 50 e tal,
 * voltei na tela, atualizou, e perdi tudo". As três garantias que não podem
 * regredir são:
 *
 * 1. o que foi respondido volta igual depois de sair e voltar;
 * 2. mexer na lista (remover uma questão) NÃO desloca respostas de lugar —
 *    tudo é guardado por id, nunca por posição;
 * 3. nada aqui derruba a página: `localStorage` indisponível, JSON corrompido
 *    ou versão antiga apenas desligam a retomada.
 */

/** `localStorage` de mentira — o ambiente dos testes é `node`, sem `window`. */
function montarJanela(opcoes: { quebrado?: boolean } = {}) {
  const dados = new Map<string, string>()
  const janela = {
    localStorage: {
      getItem: (k: string) => {
        if (opcoes.quebrado) throw new Error('acesso negado')
        return dados.has(k) ? dados.get(k)! : null
      },
      setItem: (k: string, v: string) => {
        if (opcoes.quebrado) throw new Error('cota estourada')
        dados.set(k, v)
      },
      removeItem: (k: string) => {
        if (opcoes.quebrado) throw new Error('acesso negado')
        dados.delete(k)
      },
    },
  }
  ;(globalThis as any).window = janela
  return dados
}

let armazem: Map<string, string>

beforeEach(() => {
  armazem = montarJanela()
})

afterEach(() => {
  delete (globalThis as any).window
})

async function carregarModulo() {
  return await import('@/lib/banco/sessao-de-lista')
}

const SESSAO_BASE = {
  modoCorrecao: 'imediato' as const,
  questaoIdAtual: 'q3',
  respostas: [
    { questaoId: 'q1', tipo: 'objetiva' as const, alternativaSelecionada: 'B' },
    { questaoId: 'q2', tipo: 'discursiva' as const, respostaDiscursiva: 'a resposta' },
  ],
  conferidas: ['q1'],
  riscadas: { q1: ['C', 'D'] },
  notas: { q2: 70 },
  registradas: ['q1'],
  destaques: {},
  finalizado: false,
}

describe('sessão de lista — ida e volta', () => {
  it('devolve intacto o que a pessoa tinha feito', async () => {
    const { salvarSessao, lerSessao } = await carregarModulo()

    salvarSessao('lista-1', SESSAO_BASE)
    const lida = lerSessao('lista-1')

    expect(lida).not.toBeNull()
    expect(lida!.respostas).toEqual(SESSAO_BASE.respostas)
    expect(lida!.conferidas).toEqual(['q1'])
    expect(lida!.riscadas).toEqual({ q1: ['C', 'D'] })
    expect(lida!.notas).toEqual({ q2: 70 })
    expect(lida!.registradas).toEqual(['q1'])
    expect(lida!.questaoIdAtual).toBe('q3')
    expect(lida!.modoCorrecao).toBe('imediato')
  })

  it('separa as sessões por lista — retomar uma não contamina a outra', async () => {
    const { salvarSessao, lerSessao, apagarSessao } = await carregarModulo()

    salvarSessao('lista-1', SESSAO_BASE)
    salvarSessao('lista-2', { ...SESSAO_BASE, questaoIdAtual: 'z9', respostas: [] })

    expect(lerSessao('lista-1')!.questaoIdAtual).toBe('q3')
    expect(lerSessao('lista-2')!.questaoIdAtual).toBe('z9')

    apagarSessao('lista-1')
    expect(lerSessao('lista-1')).toBeNull()
    expect(lerSessao('lista-2')).not.toBeNull()
  })

  it('descarta sessão de outra versão de schema em vez de restaurar pela metade', async () => {
    const { lerSessao } = await carregarModulo()

    armazem.set(
      'gradex:banco:sessao-de-lista:lista-1',
      JSON.stringify({ ...SESSAO_BASE, versao: 0, atualizadoEm: Date.now() }),
    )

    expect(lerSessao('lista-1')).toBeNull()
  })

  it('descarta sessão velha demais para ser "onde eu parei"', async () => {
    const { lerSessao, VERSAO_DA_SESSAO } = await carregarModulo()

    const quinzeDias = 15 * 24 * 60 * 60 * 1000
    armazem.set(
      'gradex:banco:sessao-de-lista:lista-1',
      JSON.stringify({
        ...SESSAO_BASE,
        versao: VERSAO_DA_SESSAO,
        atualizadoEm: Date.now() - quinzeDias,
      }),
    )

    expect(lerSessao('lista-1')).toBeNull()
  })

  it('engole JSON corrompido sem derrubar a tela', async () => {
    const { lerSessao } = await carregarModulo()

    armazem.set('gradex:banco:sessao-de-lista:lista-1', '{isso não é json')

    expect(() => lerSessao('lista-1')).not.toThrow()
    expect(lerSessao('lista-1')).toBeNull()
  })

  it('engole `localStorage` bloqueado — modo privado não pode quebrar o estudo', async () => {
    const { lerSessao, salvarSessao, apagarSessao } = await carregarModulo()

    montarJanela({ quebrado: true })

    expect(() => salvarSessao('lista-1', SESSAO_BASE)).not.toThrow()
    expect(() => apagarSessao('lista-1')).not.toThrow()
    expect(lerSessao('lista-1')).toBeNull()
  })

  it('joga fora resposta sem forma de resposta em vez de restaurar lixo', async () => {
    const { lerSessao, VERSAO_DA_SESSAO } = await carregarModulo()

    armazem.set(
      'gradex:banco:sessao-de-lista:lista-1',
      JSON.stringify({
        ...SESSAO_BASE,
        versao: VERSAO_DA_SESSAO,
        atualizadoEm: Date.now(),
        respostas: [
          { questaoId: 'q1', tipo: 'objetiva', alternativaSelecionada: 'B' },
          { questaoId: 'q1', tipo: 'objetiva', alternativaSelecionada: 'E' }, // duplicada
          { tipo: 'objetiva', alternativaSelecionada: 'A' }, // sem id
          { questaoId: 'q9', tipo: 'sei-la' }, // tipo inexistente
          'não é objeto',
        ],
      }),
    )

    expect(lerSessao('lista-1')!.respostas).toEqual([
      { questaoId: 'q1', tipo: 'objetiva', alternativaSelecionada: 'B', respostaDiscursiva: undefined },
    ])
  })
})

describe('sessão de lista — o resumo que a tela mostra', () => {
  it('conta contra a lista como ela está HOJE, não como estava quando salvou', async () => {
    const { resumoDaSessao } = await carregarModulo()
    const sessao = { ...SESSAO_BASE, versao: 1, atualizadoEm: Date.now() }

    // A q2 saiu da lista depois que a sessão foi salva: a resposta dela não
    // conta como progresso de uma lista que não a tem mais.
    const resumo = resumoDaSessao(sessao as any, ['q1', 'q3', 'q4'])

    expect(resumo.respondidas).toBe(1)
    expect(resumo.total).toBe(3)
    expect(resumo.indiceAtual).toBe(1) // q3 é a segunda questão agora
  })

  it('cai na primeira questão quando a questão salva sumiu da lista', async () => {
    const { resumoDaSessao } = await carregarModulo()
    const sessao = { ...SESSAO_BASE, versao: 1, atualizadoEm: Date.now() }

    expect(resumoDaSessao(sessao as any, ['q1', 'q2']).indiceAtual).toBe(0)
  })

  it('não oferece retomada para quem abriu e saiu sem fazer nada', async () => {
    const { vaiPelaPenaRetomar } = await carregarModulo()

    const zerada = {
      ...SESSAO_BASE,
      versao: 1,
      atualizadoEm: Date.now(),
      questaoIdAtual: 'q1',
      respostas: [],
      conferidas: [],
    }

    expect(vaiPelaPenaRetomar(zerada as any, ['q1', 'q2', 'q3'])).toBe(false)
  })

  it('oferece retomada para quem respondeu, para quem avançou e para quem terminou', async () => {
    const { vaiPelaPenaRetomar } = await carregarModulo()
    const base = { ...SESSAO_BASE, versao: 1, atualizadoEm: Date.now() }
    const ids = ['q1', 'q2', 'q3']

    expect(vaiPelaPenaRetomar(base as any, ids)).toBe(true)
    expect(
      vaiPelaPenaRetomar({ ...base, respostas: [], questaoIdAtual: 'q2' } as any, ids),
    ).toBe(true)
    expect(
      vaiPelaPenaRetomar(
        { ...base, respostas: [], questaoIdAtual: 'q1', finalizado: true } as any,
        ids,
      ),
    ).toBe(true)
  })
})
