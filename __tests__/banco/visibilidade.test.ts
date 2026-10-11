import { describe, expect, it } from 'vitest'
import {
  marcacaoHerdadaDoTopico,
  nosBarradosPara,
  questaoBarrada,
} from '@/lib/banco/visibilidade'
import { comBloqueio, filtroDeBloqueio } from '@/lib/banco/visibilidade-servidor'

const modulos = [
  { _id: 'm1', allowedGroups: ['plus'] },
  { _id: 'm2' },
  { _id: 'm3', isHidden: true },
]

const topicos = [
  { _id: 't1', moduloId: 'm1', nome: 'Período 1' },
  { _id: 't2', moduloId: 'm2', nome: 'Período 1', allowedGroups: ['quest'] },
  { _id: 't3', moduloId: 'm2', nome: 'Período 1 › Módulo I' },
  { _id: 't4', moduloId: 'm2', nome: 'Período 10' },
  { _id: 't5', moduloId: 'm2', nome: 'Período 2' },
  { _id: 't6', moduloId: 'm3', nome: 'Geral' },
]

const ordenar = (s: Set<string>) => [...s].sort()

describe('nosBarradosPara', () => {
  it('admin (quem nulo) não tem nada barrado', () => {
    const b = nosBarradosPara(modulos, topicos, null)
    expect(b.modulos.size + b.topicos.size).toBe(0)
  })

  it('gratuito: módulo restrito e oculto caem com os tópicos; tópico restrito leva os de baixo no caminho', () => {
    const b = nosBarradosPara(modulos, topicos, { accountType: 'gratuito' })
    expect(ordenar(b.modulos)).toEqual(['m1', 'm3'])
    // "Período 10" não mora abaixo de "Período 1" — o separador é o caminho, não o prefixo.
    expect(ordenar(b.topicos)).toEqual(['t1', 't2', 't3', 't6'])
  })

  it('Plus+ vê o módulo dele, mas não o tópico só do Quest+', () => {
    const b = nosBarradosPara(modulos, topicos, { accountType: 'plus' })
    expect(ordenar(b.modulos)).toEqual(['m3'])
    expect(ordenar(b.topicos)).toEqual(['t2', 't3', 't6'])
  })

  it('Quest+ vê o tópico dele, mas não o módulo só do Plus+', () => {
    const b = nosBarradosPara(modulos, topicos, { accountType: 'quest' })
    expect(ordenar(b.modulos)).toEqual(['m1', 'm3'])
    expect(ordenar(b.topicos)).toEqual(['t1', 't6'])
  })
})

describe('questaoBarrada e filtros', () => {
  const b = nosBarradosPara(modulos, topicos, { accountType: 'plus' })

  it('questão em nó barrado, por módulo ou por tópico', () => {
    expect(questaoBarrada({ moduloId: 'm3', topicoId: 'x' }, b)).toBe(true)
    expect(questaoBarrada({ moduloId: 'm2', topicoId: 't3' }, b)).toBe(true)
    expect(questaoBarrada({ moduloId: 'm2', topicoId: 't5' }, b)).toBe(false)
  })

  it('nada barrado não mexe no filtro', () => {
    const vazio = nosBarradosPara(modulos, topicos, null)
    expect(filtroDeBloqueio(vazio)).toEqual({})
    const filtro = { moduloId: 'm2' }
    expect(comBloqueio(filtro, vazio)).toBe(filtro)
  })

  it('o bloqueio entra num $and e não sobrescreve o filtro da tela', () => {
    const filtro = comBloqueio({ moduloId: 'm2', $and: [{ ano: 2024 }] }, b) as any
    expect(filtro.moduloId).toBe('m2')
    expect(filtro.$and[0]).toEqual({ ano: 2024 })
    expect(filtro.$and).toHaveLength(3)
  })
})

describe('marcacaoHerdadaDoTopico', () => {
  it('aponta o tópico de cima que marca este', () => {
    expect(marcacaoHerdadaDoTopico(topicos[2], topicos)?._id).toBe('t2')
    expect(marcacaoHerdadaDoTopico(topicos[3], topicos)).toBeNull()
  })
})
