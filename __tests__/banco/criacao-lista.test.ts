import { describe, it, expect } from 'vitest'
import {
  FILTROS_VAZIOS,
  QUANTIDADE_MAXIMA,
  avaliarConfiguracao,
  contarFiltros,
  corpoDaRequisicao,
  descreverLista,
  nomeSugerido,
  parametrosDeContagem,
  temAssuntoEscolhido,
  type ConfiguracaoDaLista,
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
