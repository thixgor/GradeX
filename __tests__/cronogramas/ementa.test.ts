import { describe, it, expect } from 'vitest'

import indice from '@/data/cronogramas/ementas/indice.json'
import medicina from '@/data/cronogramas/ementas/medicina.json'
import psicologia from '@/data/cronogramas/ementas/psicologia.json'
import biomedicina from '@/data/cronogramas/ementas/biomedicina.json'
import odontologia from '@/data/cronogramas/ementas/odontologia.json'
import { PRIORIDADES, SECOES, contarEmenta, type EmentaTopico } from '@/lib/cronogramas/tipos'

/**
 * Guarda da ementa gerada por `scripts/cronogramas/construir-ementas.mjs`.
 *
 * O parser lê markdown escrito à mão, em dois formatos, com indentação
 * inconsistente. É exatamente o tipo de coisa que quebra em silêncio: uma
 * edição no `.md` derruba um nível inteiro da árvore e ninguém percebe até um
 * aluno abrir um período vazio. Estes testes existem para isso doer aqui.
 */

const CURSOS: Record<string, any> = { medicina, psicologia, biomedicina, odontologia }

function todosOsTopicos(curso: any): EmentaTopico[] {
  return Object.values(curso).flat() as EmentaTopico[]
}

describe('ementa gerada', () => {
  it('cobre as quatro seções do seletor', () => {
    expect(indice.map((curso: any) => curso.id).sort()).toEqual(SECOES.map(s => s.id).sort())
  })

  it('todo período anunciado no índice existe no arquivo do curso', () => {
    for (const curso of indice as any[]) {
      for (const resumo of curso.periodos) {
        const topicos = CURSOS[curso.id][String(resumo.periodo)]
        expect(topicos, `${curso.id} p${resumo.periodo}`).toBeDefined()
        expect(topicos.length).toBe(resumo.topicos)
      }
    }
  })

  it('o índice bate com a contagem real de cada período', () => {
    for (const curso of indice as any[]) {
      for (const resumo of curso.periodos) {
        const contagem = contarEmenta(CURSOS[curso.id][String(resumo.periodo)])
        expect(contagem.subtopicos, `${curso.id} p${resumo.periodo} subtópicos`).toBe(resumo.subtopicos)
        expect(contagem.modulos, `${curso.id} p${resumo.periodo} módulos`).toBe(resumo.modulos)
        expect(contagem.submodulos, `${curso.id} p${resumo.periodo} submódulos`).toBe(resumo.submodulos)
      }
    }
  })

  it('nenhum período fica sem módulo — árvore vazia é parser quebrado', () => {
    for (const [nome, curso] of Object.entries(CURSOS)) {
      for (const [periodo, topicos] of Object.entries(curso)) {
        const contagem = contarEmenta(topicos as EmentaTopico[])
        expect(contagem.modulos, `${nome} p${periodo}`).toBeGreaterThan(0)
      }
    }
  })

  it('todo id é único dentro do curso', () => {
    for (const [nome, curso] of Object.entries(CURSOS)) {
      const vistos = new Set<string>()
      for (const topico of todosOsTopicos(curso)) {
        for (const id of [
          topico.id,
          ...topico.subtopicos.flatMap(sub => [
            sub.id,
            ...sub.modulos.flatMap(modulo => [modulo.id, ...modulo.submodulos.map(sm => sm.id)]),
          ]),
        ]) {
          expect(vistos.has(id), `${nome}: id repetido ${id}`).toBe(false)
          vistos.add(id)
        }
      }
    }
  })

  it('toda prioridade é um dos quatro valores conhecidos', () => {
    for (const curso of Object.values(CURSOS)) {
      for (const topico of todosOsTopicos(curso)) {
        expect(PRIORIDADES).toContain(topico.prioridade)
        for (const sub of topico.subtopicos) {
          expect(PRIORIDADES).toContain(sub.prioridade)
          for (const modulo of sub.modulos) {
            expect(PRIORIDADES).toContain(modulo.prioridade)
            expect(modulo.horasEstimadas).toBeGreaterThanOrEqual(2)
            for (const submodulo of modulo.submodulos) {
              expect(PRIORIDADES).toContain(submodulo.prioridade)
            }
          }
        }
      }
    }
  })

  it('as prioridades declaradas em SOI I e HAM I chegaram até o JSON', () => {
    const primeiroPeriodo = (medicina as any)['1'] as EmentaTopico[]
    const declaradas = primeiroPeriodo.flatMap(topico =>
      topico.subtopicos.flatMap(sub => sub.modulos.filter(modulo => modulo.prioridade !== 'normal')),
    )

    // Os dois documentos anotados somam centenas de itens com prioridade; se
    // esse número cair para zero, o parser parou de ler "(Prioridade: …)".
    expect(declaradas.length).toBeGreaterThan(50)
    expect(primeiroPeriodo.map(t => t.nome)).toEqual(['SOI I', 'HAM I'])
  })

  it('nome de item nunca carrega o rótulo do nível nem a marcação do markdown', () => {
    for (const curso of Object.values(CURSOS)) {
      for (const topico of todosOsTopicos(curso)) {
        const nomes = [
          topico.nome,
          ...topico.subtopicos.flatMap(sub => [
            sub.nome,
            ...sub.modulos.flatMap(modulo => [modulo.nome, ...modulo.submodulos.map(sm => sm.nome)]),
          ]),
        ]
        for (const nome of nomes) {
          expect(nome.length).toBeGreaterThan(0)
          expect(nome).not.toMatch(/\*\*/)
          expect(nome).not.toMatch(/^[>│├└─\s]/)
          expect(nome.toLowerCase()).not.toMatch(/^(sub)?(t[óo]pico|m[óo]dulo)\s*:/)
          expect(nome.toLowerCase()).not.toMatch(/prioridade\s*:/)
        }
      }
    }
  })
})
