import { describe, expect, it } from 'vitest'
import {
  grupoMarcadoComoOculto,
  idsDeGruposOcultos,
  ocultoPorHeranca,
} from '@/lib/provas/grupos-ocultos'
import { provaApareceNoCatalogo, provaExisteParaPessoa } from '@/lib/provas/visibilidade-da-prova'

function grupo(_id: string, campos: Record<string, any> = {}) {
  return { _id, type: 'general', parentGroupId: null, ...campos }
}

/*
 * Medicina
 * ├── P1 (oculto)
 * │   └── Cardio
 * │       └── Arritmias
 * └── P2
 *     └── Neuro (oculto)
 */
const arvore = [
  grupo('med'),
  grupo('p1', { parentGroupId: 'med', isHidden: true }),
  grupo('cardio', { parentGroupId: 'p1' }),
  grupo('arritmias', { parentGroupId: 'cardio' }),
  grupo('p2', { parentGroupId: 'med' }),
  grupo('neuro', { parentGroupId: 'p2', isHidden: true }),
]

describe('idsDeGruposOcultos', () => {
  it('o grupo marcado e tudo abaixo dele, em qualquer profundidade', () => {
    const ocultos = idsDeGruposOcultos(arvore)
    expect([...ocultos].sort()).toEqual(['arritmias', 'cardio', 'neuro', 'p1'])
  })

  it('não sobe: o pai e os irmãos de um grupo oculto continuam visíveis', () => {
    const ocultos = idsDeGruposOcultos(arvore)
    expect(ocultos.has('med')).toBe(false)
    expect(ocultos.has('p2')).toBe(false)
  })

  it('reexibir o pai devolve o ramo inteiro, sem marcação em cascata para desfazer', () => {
    const reexibido = arvore.map((g) => (g._id === 'p1' ? { ...g, isHidden: false } : g))
    const ocultos = idsDeGruposOcultos(reexibido)
    expect(ocultos.has('cardio')).toBe(false)
    expect(ocultos.has('arritmias')).toBe(false)
  })

  it('grupo pessoal não é ocultável: seria esconder a pasta do próprio dono', () => {
    const ocultos = idsDeGruposOcultos([grupo('meu', { type: 'personal', isHidden: true })])
    expect(ocultos.size).toBe(0)
    expect(grupoMarcadoComoOculto({ _id: 'x', type: 'personal', isHidden: true })).toBe(false)
  })

  it('pai apagado por fora: o órfão vale como raiz, não quebra', () => {
    const ocultos = idsDeGruposOcultos([grupo('orfao', { parentGroupId: 'sumiu' })])
    expect(ocultos.size).toBe(0)
  })

  it('ciclo em dado antigo não trava', () => {
    const ciclo = [grupo('a', { parentGroupId: 'b' }), grupo('b', { parentGroupId: 'a' })]
    expect(idsDeGruposOcultos(ciclo).size).toBe(0)
    const cicloOculto = [grupo('a', { parentGroupId: 'b', isHidden: true }), grupo('b', { parentGroupId: 'a' })]
    expect([...idsDeGruposOcultos(cicloOculto)].sort()).toEqual(['a', 'b'])
  })

  it('aceita ids que chegam como ObjectId (qualquer coisa com toString)', () => {
    const comoObjeto = (id: string) => ({ toString: () => id })
    const ocultos = idsDeGruposOcultos([
      { _id: comoObjeto('pai'), isHidden: true, type: 'general' },
      { _id: comoObjeto('filho'), parentGroupId: 'pai', type: 'general' },
    ])
    expect([...ocultos].sort()).toEqual(['filho', 'pai'])
  })
})

describe('ocultoPorHeranca', () => {
  it('distingue quem foi marcado de quem só está embaixo de um marcado', () => {
    const ocultos = idsDeGruposOcultos(arvore)
    expect(ocultoPorHeranca(arvore[1], ocultos)).toBe(false) // p1: marcado
    expect(ocultoPorHeranca(arvore[2], ocultos)).toBe(true) // cardio: herdou
    expect(ocultoPorHeranca(arvore[4], ocultos)).toBe(false) // p2: visível
  })
})

describe('provaExisteParaPessoa com grupo oculto', () => {
  const provaVisivel = { createdBy: 'autor', isHidden: false } as any
  const aluno = { userId: 'aluno', isAdmin: false, periodo: 3 }
  const admin = { userId: 'admin', isAdmin: true, periodo: null }

  it('some para o aluno, mesmo a prova em si estando visível', () => {
    expect(provaExisteParaPessoa(provaVisivel, aluno)).toBe(true)
    expect(provaExisteParaPessoa(provaVisivel, { ...aluno, grupoOculto: true })).toBe(false)
  })

  it('o admin continua vendo — no catálogo inclusive', () => {
    expect(provaExisteParaPessoa(provaVisivel, { ...admin, grupoOculto: true })).toBe(true)
    expect(provaApareceNoCatalogo(provaVisivel, { ...admin, grupoOculto: true })).toBe(true)
  })

  it('o convite é para a prova: não reabre um grupo que o admin tirou do ar', () => {
    const provaComConvidado = {
      createdBy: 'autor',
      isHidden: true,
      hiddenExcept: { admins: true, usuarios: ['aluno'] },
    } as any
    expect(provaExisteParaPessoa(provaComConvidado, aluno)).toBe(true)
    expect(provaExisteParaPessoa(provaComConvidado, { ...aluno, grupoOculto: true })).toBe(false)
  })

  it('quem criou não se tranca fora da própria prova', () => {
    expect(provaExisteParaPessoa(provaVisivel, { userId: 'autor', grupoOculto: true })).toBe(true)
  })
})
