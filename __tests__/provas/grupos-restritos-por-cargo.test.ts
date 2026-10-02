import { describe, expect, it } from 'vitest'
import {
  algumGrupoRestrito,
  idsDeGruposComAlgumaBarreira,
  idsDeGruposOcultos,
} from '@/lib/provas/grupos-ocultos'
import { normalizarCargosPermitidos } from '@/lib/restricao-por-cargo'

function grupo(_id: string, campos: Record<string, any> = {}) {
  return { _id, type: 'general', parentGroupId: null, ...campos }
}

/*
 * Medicina
 * ├── Plus (só plus)
 * │   └── Cardio
 * │       └── Só quest (só quest)  ← restringe mais que o pai
 * ├── Banco (plus, quest)
 * └── Livre
 */
const arvore = [
  grupo('med'),
  grupo('plus', { parentGroupId: 'med', allowedGroups: ['plus'] }),
  grupo('cardio', { parentGroupId: 'plus' }),
  grupo('soQuest', { parentGroupId: 'cardio', allowedGroups: ['quest'] }),
  grupo('banco', { parentGroupId: 'med', allowedGroups: ['plus', 'quest'] }),
  grupo('livre', { parentGroupId: 'med' }),
]

const ordenar = (s: Set<string>) => [...s].sort()

describe('grupos restritos a cargos', () => {
  it('a conta gratuita não vê nenhum ramo restrito', () => {
    expect(ordenar(idsDeGruposOcultos(arvore, { accountType: 'gratuito' }))).toEqual(
      ['banco', 'cardio', 'plus', 'soQuest'],
    )
  })

  it('Plus+ vê o ramo dele, mas não o subgrupo que restringe a Quest+', () => {
    expect(ordenar(idsDeGruposOcultos(arvore, { accountType: 'plus' }))).toEqual(['soQuest'])
  })

  it('o cargo legado (premium) vale como Plus+', () => {
    expect(ordenar(idsDeGruposOcultos(arvore, { accountType: 'premium' }))).toEqual(['soQuest'])
  })

  it('Quest+ vê o grupo do Banco, mas não o ramo do Plus+ — nem o subgrupo dele lá dentro', () => {
    expect(ordenar(idsDeGruposOcultos(arvore, { accountType: 'quest' }))).toEqual(
      ['cardio', 'plus', 'soQuest'],
    )
  })

  it('sem quem perguntar, só a ocultação conta (é o que o selo do admin usa)', () => {
    expect(idsDeGruposOcultos(arvore).size).toBe(0)
  })

  it('ocultar continua valendo para todos os cargos', () => {
    const comOculto = [...arvore, grupo('oculto', { parentGroupId: 'livre', isHidden: true })]
    expect(idsDeGruposOcultos(comOculto, { accountType: 'plus' }).has('oculto')).toBe(true)
  })

  it('grupo pessoal ignora a restrição', () => {
    const pessoal = [grupo('meu', { type: 'personal', allowedGroups: ['plus'] })]
    expect(algumGrupoRestrito(pessoal)).toBe(false)
    expect(idsDeGruposOcultos(pessoal, { accountType: 'gratuito' }).size).toBe(0)
  })

  it('o conjunto "com alguma barreira" é o que dispensa ler o cargo', () => {
    expect(ordenar(idsDeGruposComAlgumaBarreira(arvore))).toEqual(['banco', 'cardio', 'plus', 'soQuest'])
  })
})

describe('normalizarCargosPermitidos', () => {
  it('limpa, tira repetição e descarta o que não é id de cargo', () => {
    expect(normalizarCargosPermitidos(['Plus', 'plus', 'quest', '', 'a b', 42, null])).toEqual(['plus', 'quest', '42'])
  })

  it('o que não é lista vira "todo mundo"', () => {
    expect(normalizarCargosPermitidos('plus')).toEqual([])
    expect(normalizarCargosPermitidos(null)).toEqual([])
  })
})
