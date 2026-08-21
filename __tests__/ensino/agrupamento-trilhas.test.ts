import { describe, expect, it } from 'vitest'
import { assuntoDaTrilha, noDaAula } from '@/lib/ensino/agrupamento-trilhas'
import type { NoDeEnsino } from '@/lib/ensino/taxonomia'

/**
 * A árvore usada por todos os casos:
 *
 *   Medicina (área)
 *   └── Ciclo Clínico (módulo)
 *       ├── Cardiologia (tópico)
 *       │   ├── Fisiologia Cardiovascular (subtópico)
 *       │   └── Semiologia Cardíaca (subtópico)
 *       └── Pneumologia (tópico)
 */
const no = (id: string, nivel: string, nome: string, paiId: string | null): NoDeEnsino =>
  ({ _id: id, nivel, nome, paiId, slug: id, ordem: 0 }) as NoDeEnsino

const NOS: NoDeEnsino[] = [
  no('area', 'area', 'Medicina', null),
  no('clinico', 'modulo', 'Ciclo Clínico', 'area'),
  no('cardio', 'topico', 'Cardiologia', 'clinico'),
  no('fisio', 'subtopico', 'Fisiologia Cardiovascular', 'cardio'),
  no('semio', 'subtopico', 'Semiologia Cardíaca', 'cardio'),
  no('pneumo', 'topico', 'Pneumologia', 'clinico'),
]

const SEM_CURADORIA = { areaId: null, moduloId: null, topicoId: null, subtopicoId: null }

describe('noDaAula', () => {
  it('usa o nó mais específico que a aula declara', () => {
    expect(noDaAula({ areaId: 'area', moduloId: 'clinico', topicoId: 'cardio', subtopicoId: 'fisio' })).toBe('fisio')
    expect(noDaAula({ areaId: 'area', moduloId: 'clinico', topicoId: 'cardio' })).toBe('cardio')
    expect(noDaAula({ areaId: 'area' })).toBe('area')
  })

  it('devolve null quando a aula não está classificada', () => {
    expect(noDaAula(null)).toBeNull()
    expect(noDaAula({})).toBeNull()
  })
})

describe('assuntoDaTrilha', () => {
  it('curadoria explícita ganha do cálculo', () => {
    const assunto = assuntoDaTrilha({ topicoId: 'pneumo' }, ['fisio', 'fisio', 'fisio'], NOS)
    expect(assunto).toEqual({ id: 'pneumo', nome: 'Pneumologia', nivel: 'topico', explicito: true })
  })

  it('entre os campos explícitos, o mais específico ganha', () => {
    const assunto = assuntoDaTrilha({ areaId: 'area', moduloId: 'clinico', topicoId: 'cardio' }, [], NOS)
    expect(assunto?.id).toBe('cardio')
  })

  it('subtopicoId é o mais específico dos campos explícitos', () => {
    // O campo entrou depois (paridade com os 4 níveis das aulas) e precisa
    // ganhar de todos os outros, senão a curadoria mais fina seria ignorada.
    const assunto = assuntoDaTrilha(
      { areaId: 'area', moduloId: 'clinico', topicoId: 'cardio', subtopicoId: 'semio' },
      [],
      NOS,
    )
    expect(assunto?.id).toBe('semio')
    expect(assunto?.explicito).toBe(true)
  })

  it('campo explícito apontando para nó inexistente cai no cálculo', () => {
    const assunto = assuntoDaTrilha({ topicoId: 'apagado' }, ['pneumo', 'pneumo'], NOS)
    expect(assunto?.id).toBe('pneumo')
    expect(assunto?.explicito).toBe(false)
  })

  it('não desce abaixo de tópico, mesmo com todas as aulas no mesmo subtópico', () => {
    // Subtópico é preciso demais para virar prateleira — ver NIVEL_MAXIMO.
    const assunto = assuntoDaTrilha(SEM_CURADORIA, ['fisio', 'fisio', 'fisio'], NOS)
    expect(assunto).toEqual({
      id: 'cardio',
      nome: 'Cardiologia',
      nivel: 'topico',
      explicito: false,
    })
  })

  it('aulas em dois subtópicos irmãos sobem para o tópico que os contém', () => {
    const assunto = assuntoDaTrilha(SEM_CURADORIA, ['fisio', 'fisio', 'semio', 'semio'], NOS)
    expect(assunto?.id).toBe('cardio')
  })

  it('aulas em dois tópicos irmãos sobem para o módulo', () => {
    const assunto = assuntoDaTrilha(SEM_CURADORIA, ['cardio', 'cardio', 'pneumo', 'pneumo'], NOS)
    expect(assunto?.id).toBe('clinico')
  })

  it('o nó mais fundo que ainda cobre a maioria ganha do ancestral que cobre tudo', () => {
    // 3 de 4 aulas em Cardiologia: Cardiologia cobre 3 (maioria) e Ciclo
    // Clínico cobre 4. Vence o mais específico dos dois.
    const assunto = assuntoDaTrilha(SEM_CURADORIA, ['fisio', 'semio', 'cardio', 'pneumo'], NOS)
    expect(assunto?.id).toBe('cardio')
  })

  it('aulas sem classificação contam no denominador e podem impedir o rótulo fino', () => {
    // 2 de 5 em Cardiologia não é maioria; nada cobre a maioria, nem a Área.
    const assunto = assuntoDaTrilha(SEM_CURADORIA, ['fisio', 'semio', null, null, null], NOS)
    expect(assunto).toBeNull()
  })

  it('devolve null para uma Trilha sem aulas', () => {
    expect(assuntoDaTrilha(SEM_CURADORIA, [], NOS)).toBeNull()
  })

  it('devolve null quando nenhuma aula da Trilha está classificada', () => {
    expect(assuntoDaTrilha(SEM_CURADORIA, [null, null], NOS)).toBeNull()
  })

  it('uma aula só basta para definir o assunto', () => {
    expect(assuntoDaTrilha(SEM_CURADORIA, ['semio'], NOS)?.id).toBe('cardio')
    expect(assuntoDaTrilha(SEM_CURADORIA, ['pneumo'], NOS)?.id).toBe('pneumo')
  })

  it('o teto de nível vale para o cálculo, não para a curadoria explícita', () => {
    // Se alguém apontar a Trilha para um subtópico de propósito, é isso que
    // vale: o teto existe para o palpite, não para a decisão de uma pessoa.
    const assunto = assuntoDaTrilha({ subtopicoId: 'fisio' }, [], NOS)
    expect(assunto).toEqual({
      id: 'fisio',
      nome: 'Fisiologia Cardiovascular',
      nivel: 'subtopico',
      explicito: true,
    })
  })

  it('metade exata não é maioria: dois irmãos empatados sobem para o pai', () => {
    // O caso que a maioria estrita existe para resolver. Com "metade ou mais",
    // `fisio` e `semio` passariam os dois no corte e o rótulo da Trilha seria
    // decidido pela ordem de iteração do Map.
    const assunto = assuntoDaTrilha(SEM_CURADORIA, ['fisio', 'fisio', 'semio', 'semio'], NOS)
    expect(assunto?.nivel).toBe('topico')
    expect(assunto?.id).toBe('cardio')
  })

  it('a mesma entrada devolve sempre o mesmo assunto', () => {
    const entrada: Array<string | null> = ['fisio', 'semio', 'cardio', 'pneumo', null]
    const primeiro = assuntoDaTrilha(SEM_CURADORIA, entrada, NOS)
    for (let i = 0; i < 5; i++) {
      expect(assuntoDaTrilha(SEM_CURADORIA, entrada, NOS)).toEqual(primeiro)
    }
  })
})
