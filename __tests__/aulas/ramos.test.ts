import { describe, expect, it } from 'vitest'
import {
  achatarAulas,
  contarAulas,
  montarRamos,
  temConteudo,
  type NosDoCurso,
} from '@/lib/aulas/ramos'

/**
 * A árvore do aluno esteve errada duas vezes nesta reformulação: primeiro
 * agrupando só por módulo (e descartando tópico, subtópico e submódulo), depois
 * empilhando os quatro níveis numa coluna só. Os casos abaixo travam o que a
 * versão certa faz — e, principalmente, o que ela não pode fazer: mostrar a
 * mesma aula em dois lugares ou perder uma pelo caminho.
 */

const nos: NosDoCurso = {
  topicos: [
    { _id: 't1', setorId: 's1', nome: 'Cardiologia', ordem: 0 },
    { _id: 't2', setorId: 's1', nome: 'Pneumologia', ordem: 1 },
    { _id: 'tx', setorId: 'outro', nome: 'De outro curso', ordem: 0 },
  ],
  subtopicos: [{ _id: 'st1', setorId: 's1', topicoId: 't1', nome: 'Arritmias', ordem: 0 }],
  modulos: [
    { _id: 'm1', setorId: 's1', topicoId: 't1', subtopicoId: 'st1', nome: 'FA', ordem: 0 },
    { _id: 'm2', setorId: 's1', topicoId: 't2', nome: 'Asma', ordem: 0 },
    { _id: 'm3', setorId: 's1', nome: 'Módulo solto no curso', ordem: 1 },
  ],
  submodulos: [{ _id: 'sm1', moduloId: 'm1', nome: 'Anticoagulação', ordem: 0 }],
}

function aula(id: string, v: Record<string, any> = {}) {
  return { _id: id, titulo: id, ordem: 0, ...v }
}

describe('montarRamos', () => {
  it('preserva os quatro níveis da hierarquia', () => {
    const ramos = montarRamos(
      's1',
      [aula('a1', { topicoId: 't1', subtopicoId: 'st1', moduloId: 'm1', submoduloId: 'sm1' })],
      nos,
    )

    const topico = ramos.find((r) => r.id === 't1')!
    expect(topico.nivel).toBe(1)
    const subtopico = topico.filhos.find((r) => r.id === 'st1')!
    expect(subtopico.nivel).toBe(2)
    const modulo = subtopico.filhos.find((r) => r.id === 'm1')!
    expect(modulo.nivel).toBe(3)
    const submodulo = modulo.filhos.find((r) => r.id === 'sm1')!
    expect(submodulo.nivel).toBe(4)
    expect(submodulo.aulas.map((a) => a._id)).toEqual(['a1'])
  })

  it('não mostra a mesma aula em dois níveis', () => {
    // Aula com módulo E submódulo pertence ao submódulo. Sem essa regra ela
    // apareceria duas vezes na mesma tela.
    const ramos = montarRamos(
      's1',
      [aula('a1', { topicoId: 't1', subtopicoId: 'st1', moduloId: 'm1', submoduloId: 'sm1' })],
      nos,
    )
    expect(achatarAulas(ramos).map((a: any) => a._id)).toEqual(['a1'])
  })

  it('aceita módulo pendurado direto no curso, sem tópico', () => {
    const ramos = montarRamos('s1', [aula('a1', { moduloId: 'm3' })], nos)
    const solto = ramos.find((r) => r.id === 'm3')!
    expect(solto.aulas.map((a) => a._id)).toEqual(['a1'])
  })

  it('recolhe aula sem nível nenhum em vez de perdê-la', () => {
    const ramos = montarRamos('s1', [aula('a9')], nos)
    const soltas = ramos.find((r) => r.id === '__soltas__')!
    expect(soltas.aulas.map((a) => a._id)).toEqual(['a9'])
  })

  it('ignora tópicos de outro curso', () => {
    const ramos = montarRamos('s1', [], nos)
    expect(ramos.some((r) => r.id === 'tx')).toBe(false)
  })

  it('respeita a ordem definida pelo admin', () => {
    const ramos = montarRamos(
      's1',
      [
        aula('segunda', { topicoId: 't2', moduloId: 'm2', ordem: 1 }),
        aula('primeira', { topicoId: 't2', moduloId: 'm2', ordem: 0 }),
      ],
      nos,
    )
    const modulo = ramos.find((r) => r.id === 't2')!.filhos.find((r) => r.id === 'm2')!
    expect(modulo.aulas.map((a) => a._id)).toEqual(['primeira', 'segunda'])
  })
})

describe('temConteudo', () => {
  it('descarta ramo vazio, mesmo com filhos', () => {
    // Nível vazio não pode virar título vazio na tela do aluno.
    const ramos = montarRamos('s1', [], nos)
    expect(ramos.every((r) => !temConteudo(r))).toBe(true)
  })

  it('mantém ramo cujo conteúdo está lá no fundo', () => {
    const ramos = montarRamos(
      's1',
      [aula('a1', { topicoId: 't1', subtopicoId: 'st1', moduloId: 'm1', submoduloId: 'sm1' })],
      nos,
    )
    expect(temConteudo(ramos.find((r) => r.id === 't1')!)).toBe(true)
  })
})

describe('contarAulas', () => {
  it('soma a descendência inteira, com as concluídas', () => {
    const ramos = montarRamos(
      's1',
      [
        { ...aula('a1', { topicoId: 't1', subtopicoId: 'st1', moduloId: 'm1' }), progresso: { concluida: true } },
        { ...aula('a2', { topicoId: 't1', subtopicoId: 'st1', moduloId: 'm1', submoduloId: 'sm1' }), progresso: { concluida: false } },
        { ...aula('a3', { topicoId: 't1', subtopicoId: 'st1', moduloId: 'm1', submoduloId: 'sm1' }), progresso: null },
      ],
      nos,
    )
    expect(contarAulas(ramos.find((r) => r.id === 't1')!)).toEqual({ total: 3, concluidas: 1 })
  })
})

describe('achatarAulas', () => {
  it('devolve as aulas em ordem de leitura da árvore', () => {
    const ramos = montarRamos(
      's1',
      [
        aula('doModulo', { topicoId: 't1', subtopicoId: 'st1', moduloId: 'm1' }),
        aula('doSubmodulo', { topicoId: 't1', subtopicoId: 'st1', moduloId: 'm1', submoduloId: 'sm1' }),
        aula('dePneumo', { topicoId: 't2', moduloId: 'm2' }),
      ],
      nos,
    )
    // É esta ordem que "próxima aula" segue.
    expect(achatarAulas(ramos).map((a: any) => a._id)).toEqual([
      'doModulo',
      'doSubmodulo',
      'dePneumo',
    ])
  })
})
