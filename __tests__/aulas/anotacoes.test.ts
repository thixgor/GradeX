import { describe, expect, it } from 'vitest'

import {
  ANOTACAO_TAMANHO_MAX,
  filtrarAnotacoes,
  normalizarAnotacao,
  ordenarAnotacoes,
} from '@/lib/aulas/anotacoes'

/**
 * O que estes testes protegem: o caderno do aluno.
 *
 * Anotação é conteúdo que a pessoa produziu — perder, embaralhar ou não achar
 * é pior do que a funcionalidade não existir, porque ela já confiou o estudo
 * dela à plataforma.
 */

describe('normalizarAnotacao', () => {
  it('aceita anotação livre, sem momento do vídeo', () => {
    const a = normalizarAnotacao({ conteudo: 'Revisar antes da prova' })
    expect(a?.conteudo).toBe('Revisar antes da prova')
    expect(a?.segundo).toBeNull()
  })

  it('aceita anotação vinculada a um segundo do vídeo', () => {
    expect(normalizarAnotacao({ conteudo: 'Critérios de FA', segundo: 768 })?.segundo).toBe(768)
  })

  it('recusa anotação vazia — caderno em branco só vira lixo para apagar', () => {
    expect(normalizarAnotacao({ conteudo: '' })).toBeNull()
    expect(normalizarAnotacao({ conteudo: '    ' })).toBeNull()
  })

  it('corta texto absurdamente longo em vez de recusar o que a pessoa escreveu', () => {
    const a = normalizarAnotacao({ conteudo: 'x'.repeat(5000) })
    expect(a?.conteudo).toHaveLength(ANOTACAO_TAMANHO_MAX)
  })

  it('trata segundo inválido como anotação livre, sem perder o texto', () => {
    for (const lixo of [NaN, -5, 'abc' as any, undefined, null]) {
      const a = normalizarAnotacao({ conteudo: 'nota', segundo: lixo as any })
      expect(a?.conteudo).toBe('nota')
      expect(a?.segundo).toBeNull()
    }
  })

  it('arredonda fração de segundo (o player entrega decimais)', () => {
    expect(normalizarAnotacao({ conteudo: 'n', segundo: 42.87 })?.segundo).toBe(42)
  })
})

describe('ordenarAnotacoes', () => {
  const base = (over: any) => ({ conteudo: 'x', criadoEm: new Date('2026-01-01'), segundo: null, ...over })

  it('as com timestamp vêm primeiro, em ordem de vídeo — viram o sumário da aula', () => {
    const ordenadas = ordenarAnotacoes([
      base({ segundo: 300, conteudo: 'c' }),
      base({ segundo: 60, conteudo: 'a' }),
      base({ segundo: 120, conteudo: 'b' }),
    ])
    expect(ordenadas.map((a) => a.conteudo)).toEqual(['a', 'b', 'c'])
  })

  it('as livres vêm depois, da mais recente para a mais antiga', () => {
    const ordenadas = ordenarAnotacoes([
      base({ conteudo: 'antiga', criadoEm: new Date('2026-01-01') }),
      base({ conteudo: 'nova', criadoEm: new Date('2026-06-01') }),
    ])
    expect(ordenadas.map((a) => a.conteudo)).toEqual(['nova', 'antiga'])
  })

  it('não mistura os dois critérios numa lista só', () => {
    const ordenadas = ordenarAnotacoes([
      base({ conteudo: 'livre', criadoEm: new Date('2026-06-01') }),
      base({ conteudo: 'aos 60s', segundo: 60 }),
    ])
    expect(ordenadas.map((a) => a.conteudo)).toEqual(['aos 60s', 'livre'])
  })

  it('lida com lista vazia', () => {
    expect(ordenarAnotacoes([])).toEqual([])
  })
})

describe('filtrarAnotacoes', () => {
  const anotacoes = [
    { conteudo: 'Critérios da fibrilação atrial' },
    { conteudo: 'Revisar átrio esquerdo' },
    { conteudo: 'Bloqueio de ramo' },
  ]

  it('acha por trecho do texto', () => {
    expect(filtrarAnotacoes(anotacoes, 'bloqueio')).toHaveLength(1)
  })

  it('ignora acento e caixa — digitar sem acento acha o texto acentuado', () => {
    // "atrio" casa com "átrio", mas não com "atrial": a busca é por trecho, e
    // ignorar acento não pode virar ignorar o resto da palavra.
    expect(filtrarAnotacoes(anotacoes, 'atrio').map((a) => a.conteudo)).toEqual([
      'Revisar átrio esquerdo',
    ])
    expect(filtrarAnotacoes(anotacoes, 'FIBRILACAO').map((a) => a.conteudo)).toEqual([
      'Critérios da fibrilação atrial',
    ])
  })

  it('busca vazia devolve tudo, em vez de esconder o caderno', () => {
    expect(filtrarAnotacoes(anotacoes, '   ')).toHaveLength(3)
  })

  it('busca sem resultado devolve lista vazia', () => {
    expect(filtrarAnotacoes(anotacoes, 'pneumonia')).toHaveLength(0)
  })
})
