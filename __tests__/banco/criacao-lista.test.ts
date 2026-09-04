import { describe, it, expect } from 'vitest'
import {
  FILTROS_VAZIOS,
  QUANTIDADE_MAXIMA,
  avaliarConfiguracao,
  contarFiltros,
  corpoDaRequisicao,
  descreverLista,
  nomeSugerido,
  parametrosDasFacetas,
  parametrosDeContagem,
  podeExcluirJaResolvidas,
  reconciliarComAsFacetas,
  temAssuntoEscolhido,
  type ConfiguracaoDaLista,
  type FacetasDoRecorte,
} from '@/lib/banco/criacao-lista'

function config(extra: Partial<ConfiguracaoDaLista> = {}): ConfiguracaoDaLista {
  return {
    ...FILTROS_VAZIOS,
    nome: 'Minha lista',
    quantidade: 10,
    modoResposta: 'imediato',
    ...extra,
  }
}

describe('descreverLista', () => {
  it('descreve a lista mais simples', () => {
    expect(descreverLista(config())).toBe('10 questões de todo o banco, corrigidas na hora.')
  })

  it('soma os fatores numa frase só', () => {
    const texto = descreverLista(
      config({
        quantidade: 20,
        tipo: 'objetiva',
        dificuldade: 'dificil',
        modoResposta: 'final',
        topicoIds: ['t1'],
        excluirJaResolvidas: true,
      }),
      ['Arritmias'],
    )
    expect(texto).toBe(
      '20 questões objetivas difíceis de Arritmias que você ainda não resolveu, com a resposta só no final.',
    )
  })

  it('nomeia dois assuntos e resume a partir de três', () => {
    expect(descreverLista(config({ topicoIds: ['a', 'b'] }), ['Arritmias', 'Anatomia'])).toContain(
      'de Arritmias e Anatomia',
    )
    expect(descreverLista(config({ topicoIds: ['a', 'b', 'c'] }), ['A', 'B', 'C'])).toContain(
      'de 3 assuntos',
    )
  })

  it('não diz "de todo o banco" quando há assunto escolhido sem nome à mão', () => {
    expect(descreverLista(config({ moduloIds: ['m1'] }), [])).not.toContain('todo o banco')
  })

  it('concorda no singular', () => {
    expect(descreverLista(config({ quantidade: 1 }))).toContain('1 questão ')
  })

  it('descreve o conteúdo da questão', () => {
    expect(descreverLista(config({ comImagem: true }))).toContain('com imagem')
    expect(descreverLista(config({ comExplicacao: true }))).toContain('com resposta comentada')
  })

  it('"só as que errei" fala por si, mesmo se excluirJaResolvidas vier junto', () => {
    // A tela nunca manda os dois juntos, mas a frase não pode dizer as duas
    // coisas contraditórias se algum dia vierem.
    const texto = descreverLista(config({ apenasErradas: true, excluirJaResolvidas: true }))
    expect(texto).toContain('que você errou')
    expect(texto).not.toContain('ainda não resolveu')
  })
})

describe('nomeSugerido', () => {
  it('usa o assunto quando há um só', () => {
    expect(nomeSugerido({ quantidade: 20 }, ['Arritmias'])).toBe('Arritmias — 20 questões')
  })

  it('resume vários assuntos sem ficar quilométrico', () => {
    expect(nomeSugerido({ quantidade: 10 }, ['Arritmias', 'Anatomia', 'Renal'])).toBe(
      'Arritmias +2 — 10 questões',
    )
  })

  it('cai na dificuldade, no tipo e por fim em aleatórias', () => {
    expect(nomeSugerido({ quantidade: 30, dificuldade: 'dificil' })).toBe('30 questões difíceis')
    expect(nomeSugerido({ quantidade: 15, tipo: 'discursiva' })).toBe('15 questões discursivas')
    expect(nomeSugerido({ quantidade: 5 })).toBe('Aleatórias — 5 questões')
  })

  it('"só as que errei" vira "Revisão", mesmo com assunto escolhido', () => {
    expect(nomeSugerido({ quantidade: 20, apenasErradas: true })).toBe('Revisão de erros — 20 questões')
    expect(nomeSugerido({ quantidade: 20, apenasErradas: true }, ['Arritmias'])).toBe(
      'Revisão: Arritmias — 20 questões',
    )
  })
})

describe('avaliarConfiguracao', () => {
  it('exige nome e quantidade sensata', () => {
    expect(avaliarConfiguracao(config({ nome: '  ' }), 100).ok).toBe(false)
    expect(avaliarConfiguracao(config({ quantidade: 0 }), 100).ok).toBe(false)
    expect(avaliarConfiguracao(config({ quantidade: QUANTIDADE_MAXIMA + 1 }), 500).ok).toBe(false)
  })

  it('recusa quando nada casa com os filtros', () => {
    const v = avaliarConfiguracao(config(), 0)
    expect(v.ok).toBe(false)
    expect(v.motivo).toContain('Tire um filtro')
  })

  it('aceita pedir mais do que existe, avisando', () => {
    // Recusar mandaria a pessoa adivinhar qual número cabe.
    const v = avaliarConfiguracao(config({ quantidade: 50 }), 12)
    expect(v.ok).toBe(true)
    expect(v.aviso).toContain('12')
  })

  it('não avisa quando há de sobra', () => {
    expect(avaliarConfiguracao(config({ quantidade: 10 }), 400)).toEqual({ ok: true })
  })

  it('sem contagem ainda, deixa seguir', () => {
    expect(avaliarConfiguracao(config(), null).ok).toBe(true)
  })
})

describe('filtros', () => {
  it('sabe quando há assunto escolhido', () => {
    expect(temAssuntoEscolhido(FILTROS_VAZIOS)).toBe(false)
    expect(temAssuntoEscolhido({ ...FILTROS_VAZIOS, subtopicoIds: ['s1'] })).toBe(true)
  })

  it('conta os fatores além do assunto', () => {
    expect(contarFiltros(FILTROS_VAZIOS)).toBe(0)
    expect(
      contarFiltros({ ...FILTROS_VAZIOS, tipo: 'objetiva', anos: [2023], excluirJaResolvidas: true }),
    ).toBe(3)
    expect(
      contarFiltros({
        ...FILTROS_VAZIOS,
        apenasErradas: true,
        comImagem: true,
        comExplicacao: true,
      }),
    ).toBe(3)
  })

  it('monta o corpo da requisição sem campos vazios', () => {
    const corpo = corpoDaRequisicao(config({ topicoIds: ['t1', 't2'], tipo: 'objetiva' }))
    expect(corpo.topicoId).toBe('t1,t2')
    expect(corpo.tipo).toBe('objetiva')
    expect(corpo.moduloId).toBeUndefined()
    expect(corpo.dificuldade).toBeUndefined()
  })

  it('leva o conteúdo da questão e "só as que errei" para a rota de sorteio', () => {
    const corpo = corpoDaRequisicao(config({ apenasErradas: true, comImagem: true, comExplicacao: true }))
    expect(corpo.apenasErradas).toBe(true)
    expect(corpo.comImagem).toBe(true)
    expect(corpo.comExplicacao).toBe(true)
  })

  it('monta os parâmetros de contagem iguais aos do filtro da lista', () => {
    const p = parametrosDeContagem({
      ...FILTROS_VAZIOS,
      moduloIds: ['m1'],
      dificuldade: 'facil',
      anos: [2023, 2022],
      excluirJaResolvidas: true,
    })
    expect(p.get('moduloId')).toBe('m1')
    expect(p.get('dificuldade')).toBe('facil')
    expect(p.get('anos')).toBe('2023,2022')
    expect(p.get('apenasNaoResolvidas')).toBe('true')
    expect(p.get('limit')).toBe('1')
  })

  it('"só as que errei" manda apenasErradas, não apenasNaoResolvidas — mesmo se os dois vierem marcados', () => {
    const p = parametrosDeContagem({
      ...FILTROS_VAZIOS,
      apenasErradas: true,
      excluirJaResolvidas: true,
    })
    expect(p.get('apenasErradas')).toBe('true')
    expect(p.get('apenasNaoResolvidas')).toBeNull()
  })

  it('conteúdo da questão vira parâmetro próprio', () => {
    const p = parametrosDeContagem({ ...FILTROS_VAZIOS, comImagem: true, comExplicacao: true })
    expect(p.get('comImagem')).toBe('true')
    expect(p.get('comExplicacao')).toBe('true')
  })
})

/* ═══════════════════════════════════════════════════════════════════════
   O QUE EXISTE NO RECORTE

   O criador oferecia sempre os mesmos filtros, viesse a questão do acervo
   inteiro ou de um subtópico com três questões. Marcar "só com imagem" num
   módulo sem nenhuma imagem só dava erro no fim, depois dos três passos. Estas
   provas fixam as duas metades da correção: o que não tem, some da tela — e o
   filtro correspondente é apagado junto, para não ficar zerando a contagem de
   um jeito invisível.
   ═══════════════════════════════════════════════════════════════════════ */

function facetas(extra: Partial<FacetasDoRecorte> = {}): FacetasDoRecorte {
  return {
    total: 100,
    tipos: { objetiva: 100, discursiva: 0 },
    dificuldades: { facil: 30, medio: 70, dificil: 0 },
    anos: [{ ano: 2026, total: 100 }],
    periodos: [{ periodo: '2026.2', total: 100 }],
    comImagem: 0,
    comExplicacao: 40,
    jaResolvidas: 10,
    erradas: 0,
    ...extra,
  }
}

describe('parametrosDasFacetas', () => {
  it('leva só o recorte de assunto — os outros filtros não entram', () => {
    const p = parametrosDasFacetas({
      ...FILTROS_VAZIOS,
      moduloIds: ['m1'],
      topicoIds: ['t1', 't2'],
      subtopicoIds: ['s1'],
      dificuldade: 'dificil',
      comImagem: true,
      anos: [2026],
    })
    expect(p.get('moduloId')).toBe('m1')
    expect(p.get('topicoId')).toBe('t1,t2')
    expect(p.get('subtopicoId')).toBe('s1')
    // Se a dificuldade entrasse, a resposta só conheceria as difíceis e a tela
    // apagaria "fácil" e "média" no instante em que alguém escolhesse uma.
    expect(p.get('dificuldade')).toBeNull()
    expect(p.get('comImagem')).toBeNull()
    expect(p.get('anos')).toBeNull()
  })

  it('sem assunto escolhido, não manda parâmetro nenhum', () => {
    expect(parametrosDasFacetas(FILTROS_VAZIOS).toString()).toBe('')
  })
})

describe('podeExcluirJaResolvidas', () => {
  it('não oferece quando a pessoa não resolveu nada — o filtro não tiraria nada', () => {
    expect(podeExcluirJaResolvidas(facetas({ jaResolvidas: 0 }))).toBe(false)
  })

  it('não oferece quando já resolveu todas — o filtro devolveria lista vazia', () => {
    expect(podeExcluirJaResolvidas(facetas({ total: 40, jaResolvidas: 40 }))).toBe(false)
  })

  it('oferece quando há resolvidas e sobra o que sortear', () => {
    expect(podeExcluirJaResolvidas(facetas({ total: 40, jaResolvidas: 10 }))).toBe(true)
  })
})

describe('reconciliarComAsFacetas', () => {
  it('sem facetas, não mexe em nada — apagar por desconhecimento é pior', () => {
    const filtros = { ...FILTROS_VAZIOS, dificuldade: 'dificil' as const, comImagem: true }
    expect(reconciliarComAsFacetas(filtros, null)).toBe(filtros)
  })

  it('apaga a dificuldade que o recorte não tem', () => {
    const saida = reconciliarComAsFacetas(
      { ...FILTROS_VAZIOS, dificuldade: 'dificil' },
      facetas(),
    )
    expect(saida.dificuldade).toBe('')
  })

  it('mantém a dificuldade que o recorte tem', () => {
    const saida = reconciliarComAsFacetas({ ...FILTROS_VAZIOS, dificuldade: 'facil' }, facetas())
    expect(saida.dificuldade).toBe('facil')
  })

  it('apaga o tipo sem nenhuma questão no recorte', () => {
    const saida = reconciliarComAsFacetas({ ...FILTROS_VAZIOS, tipo: 'discursiva' }, facetas())
    expect(saida.tipo).toBe('')
  })

  it('apaga "só com imagem" quando o recorte não tem imagem, e mantém "com comentário"', () => {
    const saida = reconciliarComAsFacetas(
      { ...FILTROS_VAZIOS, comImagem: true, comExplicacao: true },
      facetas(),
    )
    expect(saida.comImagem).toBe(false)
    expect(saida.comExplicacao).toBe(true)
  })

  it('descarta anos e períodos que o recorte não tem, preservando os que tem', () => {
    const saida = reconciliarComAsFacetas(
      { ...FILTROS_VAZIOS, anos: [2019, 2026], periodos: ['2019.1', '2026.2'] },
      facetas(),
    )
    expect(saida.anos).toEqual([2026])
    expect(saida.periodos).toEqual(['2026.2'])
  })

  it('apaga "só as que errei" quando não há erro nenhum no recorte', () => {
    const saida = reconciliarComAsFacetas({ ...FILTROS_VAZIOS, apenasErradas: true }, facetas())
    expect(saida.apenasErradas).toBe(false)
  })

  it('apaga "ainda não resolvi" quando a pessoa já resolveu tudo do recorte', () => {
    const saida = reconciliarComAsFacetas(
      { ...FILTROS_VAZIOS, excluirJaResolvidas: true },
      facetas({ total: 12, jaResolvidas: 12 }),
    )
    expect(saida.excluirJaResolvidas).toBe(false)
  })

  it('devolve o MESMO objeto quando nada muda — senão o efeito que grava o resultado se realimenta', () => {
    const filtros = { ...FILTROS_VAZIOS, dificuldade: 'facil' as const, anos: [2026] }
    expect(reconciliarComAsFacetas(filtros, facetas())).toBe(filtros)
  })
})
