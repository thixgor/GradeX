import { describe, expect, it } from 'vitest'

import { buscar, fatiarParaRealce, sugerir } from '@/lib/histologia/busca'
import type { EntradaBusca } from '@/lib/histologia/esquemas'
import { chaveDeBusca } from '@/lib/histologia/texto'

/** Constrói uma entrada com a chave normalizada como o pipeline faria. */
function entrada(
  t: EntradaBusca['t'],
  n: string,
  b: string,
  u: string,
  extra = '',
): EntradaBusca {
  return { t, n, b, u, k: chaveDeBusca(`${n} ${b} ${extra}`) }
}

const INDICE: EntradaBusca[] = [
  entrada('l', 'Osso compacto', 'Tecidos › Osso', 'tecidos/osso/compacto'),
  entrada('l', 'Osso esponjoso', 'Tecidos › Osso', 'tecidos/osso/esponjoso'),
  entrada('s', 'Osso', 'Tecidos', 'tecidos/osso'),
  entrada('e', 'Lâmina própria', 'Duodeno › Tecidos', 'orgaos-e-sistemas/duodeno'),
  entrada('e', 'Cólon ascendente', 'Intestino grosso', 'orgaos-e-sistemas/colon'),
  entrada('q', 'Quiz: Osso', 'Quizzes', 'quizzes/osso'),
  entrada(
    'l',
    'Traqueia',
    'Órgãos e Sistemas › Sistema Respiratório',
    'orgaos-e-sistemas/sistema-respiratorio/traqueia',
    'epitélio pseudoestratificado ciliado com células caliciformes',
  ),
]

describe('normalização da consulta', () => {
  it('encontra o mesmo item com e sem acento', () => {
    const comAcento = buscar(INDICE, 'cólon')
    const semAcento = buscar(INDICE, 'colon')
    expect(comAcento.map((r) => r.url)).toEqual(semAcento.map((r) => r.url))
    expect(comAcento[0].titulo).toBe('Cólon ascendente')
  })

  it('ignora caixa e pontuação', () => {
    expect(buscar(INDICE, 'LÂMINA PRÓPRIA')[0].titulo).toBe('Lâmina própria')
    expect(buscar(INDICE, 'lamina, propria')[0].titulo).toBe('Lâmina própria')
  })

  it('exige pelo menos dois caracteres', () => {
    expect(buscar(INDICE, 'o')).toEqual([])
    expect(buscar(INDICE, ' ')).toEqual([])
  })
})

describe('ordenação', () => {
  /**
   * Sem peso por tipo de casamento, buscar "osso" traria primeiro qualquer
   * lâmina que mencione osso, e não a seção chamada "Osso". A ordem é a parte
   * da busca que o aluno percebe.
   */
  it('põe correspondência exata antes de prefixo, e prefixo antes de conteúdo', () => {
    const resultados = buscar(INDICE, 'osso')
    expect(resultados[0].titulo).toBe('Osso')
    expect(resultados[0].razao).toBe('Correspondência exata')
    const titulos = resultados.map((r) => r.titulo)
    expect(titulos.indexOf('Osso compacto')).toBeLessThan(titulos.indexOf('Quiz: Osso'))
  })

  it('encontra pelo conteúdo indexado, com peso menor', () => {
    const resultados = buscar(INDICE, 'caliciformes')
    expect(resultados).toHaveLength(1)
    expect(resultados[0].titulo).toBe('Traqueia')
    expect(resultados[0].razao).toBe('Aparece no conteúdo')
  })

  it('casa quando todos os termos aparecem, mesmo separados', () => {
    const resultados = buscar(INDICE, 'epitelio caliciformes')
    expect(resultados.map((r) => r.titulo)).toContain('Traqueia')
  })
})

describe('filtros', () => {
  it('filtra por tipo', () => {
    const so = buscar(INDICE, 'osso', { filtros: { tipos: ['quiz'] } })
    expect(so).toHaveLength(1)
    expect(so[0].tipo).toBe('quiz')
  })

  it('filtra por setor pelo prefixo da rota', () => {
    const resultados = buscar(INDICE, 'osso', { filtros: { setor: 'tecidos' } })
    expect(resultados.length).toBeGreaterThan(0)
    expect(resultados.every((r) => r.url.startsWith('tecidos'))).toBe(true)
  })

  it('combina filtros', () => {
    expect(buscar(INDICE, 'osso', { filtros: { tipos: ['quiz'], setor: 'tecidos' } })).toEqual([])
  })
})

describe('sugestões', () => {
  it('não repete o mesmo título', () => {
    const indice = [...INDICE, entrada('e', 'Osso compacto', 'Outra lâmina', 'outra/rota')]
    const sugestoes = sugerir(indice, 'osso')
    const textos = sugestoes.map((s) => s.texto)
    expect(new Set(textos).size).toBe(textos.length)
  })

  it('respeita o limite', () => {
    expect(sugerir(INDICE, 'osso', 2)).toHaveLength(2)
  })
})

describe('realce do termo', () => {
  it('marca as ocorrências preservando o texto original', () => {
    const partes = fatiarParaRealce('Osso compacto e osso esponjoso', 'osso')
    expect(partes.map((p) => p.texto).join('')).toBe('Osso compacto e osso esponjoso')
    expect(partes.filter((p) => p.realce)).toHaveLength(2)
    // O recorte vem do texto original, com a capitalização preservada.
    expect(partes.filter((p) => p.realce).map((p) => p.texto)).toEqual(['Osso', 'osso'])
  })

  it('não desloca o realce quando a normalização mudaria o comprimento', () => {
    // "Lâmina própria" normaliza para "lamina propria": mesmo comprimento, então
    // realça. Já "H&E" vira "h e" — comprimento igual aqui, mas o caso geral de
    // colapso (pontuação múltipla) precisa devolver o texto inteiro sem realce.
    const partes = fatiarParaRealce('Ducto — intercalar', 'ducto')
    expect(partes.map((p) => p.texto).join('')).toBe('Ducto — intercalar')
  })

  it('devolve o texto inteiro quando o termo é curto demais', () => {
    expect(fatiarParaRealce('Osso', 'o')).toEqual([{ texto: 'Osso', realce: false }])
  })
})
