import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, it, expect } from 'vitest'

import {
  analisarEmenta,
  detectarAlvo,
  montarEmenta,
  resumirBruto,
} from '@/lib/cronogramas/analisar-ementa'
import { PRIORIDADES, contarEmenta, type EmentaTopico } from '@/lib/cronogramas/tipos'

/**
 * Testes do parser que o admin usa para importar a ementa.
 *
 * As amostras vêm dos arquivos reais em `public/` — os mesmos que a
 * coordenação escreve à mão e cola no painel. Testar contra eles, e não
 * contra um markdown de laboratório, é o que pega o caso que quebra de
 * verdade: documento com indentação inconsistente, `└─` no lugar de `├─`,
 * negrito no meio do rótulo, numeração antes do nível.
 */

function ler(arquivo: string): string {
  return readFileSync(join(process.cwd(), 'public', arquivo), 'utf8')
}

/** Formato em árvore, com prioridade declarada em quase todo item. */
const SOI_I = ler('MEDICINA SOI I.md')
/** Formato em citação, sem nenhuma prioridade declarada. */
const PSICO_1 = ler('PSICOLOGIA - 1° PERÍODO.md')
/** Árvore com o arquivo inteiro recuado em 4 espaços. */
const SOI_V = ler('MEDICINA - SOI V.md')

describe('formato em árvore', () => {
  it('lê a hierarquia inteira', () => {
    const { topicos } = analisarEmenta(SOI_I)
    const resumo = resumirBruto(topicos)

    expect(topicos).toHaveLength(1)
    expect(topicos[0].nome).toBe('SOI I')
    expect(resumo.subtopicos).toBeGreaterThan(5)
    expect(resumo.modulos).toBeGreaterThan(20)
    expect(resumo.submodulos).toBeGreaterThan(100)
  })

  it('captura a prioridade declarada entre parênteses', () => {
    const { topicos } = analisarEmenta(SOI_I)
    const resumo = resumirBruto(topicos)

    expect(resumo.comPrioridade).toBeGreaterThan(50)

    const primeiro = topicos[0].subtopicos[0]
    expect(primeiro.nome).toBe('FUNDAMENTOS DA FORMAÇÃO MÉDICA E DO MÉTODO DE ESTUDO')
    expect(primeiro.prioridade).toBe('baixa')
    expect(primeiro.modulos[2].prioridade).toBe('media')
  })

  it('não deixa a prioridade vazar para o nome do item', () => {
    const { topicos } = analisarEmenta(SOI_I)
    for (const topico of topicos) {
      for (const sub of topico.subtopicos) {
        expect(sub.nome).not.toMatch(/prioridade/i)
        for (const modulo of sub.modulos) {
          expect(modulo.nome).not.toMatch(/prioridade/i)
          for (const submodulo of modulo.submodulos) {
            expect(submodulo.nome).not.toMatch(/prioridade/i)
          }
        }
      }
    }
  })

  it('aguenta arquivo inteiro recuado e `└─` fora de lugar', () => {
    const { topicos } = analisarEmenta(SOI_V)
    const resumo = resumirBruto(topicos)

    expect(topicos.length).toBeGreaterThan(0)
    expect(resumo.modulos).toBeGreaterThan(10)
    expect(resumo.submodulos).toBeGreaterThan(20)
  })
})

describe('formato em citação', () => {
  it('lê a hierarquia e o período do cabeçalho', () => {
    const { topicos, periodoDetectado } = analisarEmenta(PSICO_1)
    const resumo = resumirBruto(topicos)

    expect(periodoDetectado).toBe(1)
    expect(topicos.length).toBeGreaterThan(3)
    expect(topicos[0].nome).toBe('Competência Relacional')
    expect(resumo.modulos).toBeGreaterThan(10)
  })

  it('tira o negrito do rótulo em vez de virar tópico "**TÓPICO"', () => {
    const { topicos } = analisarEmenta(PSICO_1)
    for (const topico of topicos) {
      expect(topico.nome).not.toMatch(/\*\*/)
      expect(topico.nome.toLowerCase()).not.toMatch(/^t[óo]pico/)
    }
  })

  it('sem prioridade declarada, tudo entra como normal', () => {
    const { topicos } = analisarEmenta(PSICO_1)
    expect(resumirBruto(topicos).comPrioridade).toBe(0)
  })
})

describe('entradas problemáticas', () => {
  it('texto vazio ou sem estrutura não gera tópico', () => {
    expect(analisarEmenta('').topicos).toHaveLength(0)
    expect(analisarEmenta('   \n\n---\n').topicos).toHaveLength(0)
    expect(analisarEmenta('Uma lista de compras\nleite\npão').topicos).toHaveLength(0)
  })

  it('documento que começa no subtópico ganha um tópico guarda-chuva', () => {
    const { topicos } = analisarEmenta('Subtópico: Avulso\n├─ Módulo: Um assunto')

    expect(topicos).toHaveLength(1)
    expect(topicos[0].nome).toBe('Conteúdo')
    expect(topicos[0].subtopicos[0].modulos[0].nome).toBe('Um assunto')
  })

  it('módulo antes de qualquer subtópico é ignorado, não derruba a leitura', () => {
    const { topicos, linhasIgnoradas } = analisarEmenta(
      'TÓPICO: Teste\n├─ Módulo: Órfão\n1. Subtópico: Real\n├─ Módulo: Válido',
    )

    expect(linhasIgnoradas).toBe(1)
    expect(topicos[0].subtopicos).toHaveLength(1)
    expect(topicos[0].subtopicos[0].modulos.map(m => m.nome)).toEqual(['Válido'])
  })
})

describe('montagem com ids', () => {
  const montar = (markdown: string) =>
    montarEmenta('medicina', 1, analisarEmenta(markdown).topicos)

  function todosOsIds(topicos: EmentaTopico[]): string[] {
    return topicos.flatMap(topico => [
      topico.id,
      ...topico.subtopicos.flatMap(sub => [
        sub.id,
        ...sub.modulos.flatMap(modulo => [modulo.id, ...modulo.submodulos.map(sm => sm.id)]),
      ]),
    ])
  }

  it('todo id é único', () => {
    const ids = todosOsIds(montar(SOI_I))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('irmãos de mesmo nome ganham sufixo em vez de colidir', () => {
    const topicos = montar('TÓPICO: T\n1. Subtópico: S\n├─ Módulo: Igual\n├─ Módulo: Igual')
    const modulos = topicos[0].subtopicos[0].modulos

    expect(modulos).toHaveLength(2)
    expect(modulos[0].id).not.toBe(modulos[1].id)
  })

  it('o id sai do nome, então inserir um tópico antes não renomeia os outros', () => {
    // Reimportar é rotina: se o id fosse posicional, acrescentar um tópico no
    // topo faria as avaliações apontarem para outro assunto.
    const antes = montar('TÓPICO: Segundo\n1. Subtópico: S\n├─ Módulo: M')
    const depois = montar('TÓPICO: Primeiro\n1. Subtópico: X\nTÓPICO: Segundo\n1. Subtópico: S\n├─ Módulo: M')

    const segundoAntes = antes[0]
    const segundoDepois = depois.find(t => t.nome === 'Segundo')!

    expect(segundoDepois.id).toBe(segundoAntes.id)
    expect(segundoDepois.subtopicos[0].modulos[0].id).toBe(segundoAntes.subtopicos[0].modulos[0].id)
  })

  it('prioridade e horas chegam no item montado', () => {
    const topicos = montar(SOI_I)
    const contagem = contarEmenta(topicos)

    expect(contagem.porPrioridade.alta).toBeGreaterThan(0)
    for (const topico of topicos) {
      for (const sub of topico.subtopicos) {
        for (const modulo of sub.modulos) {
          expect(PRIORIDADES).toContain(modulo.prioridade)
          expect(modulo.horasEstimadas).toBeGreaterThanOrEqual(2)
          expect(modulo.incluido).toBe(false)
        }
      }
    }
  })

  it('a contagem da prévia bate com a da ementa montada', () => {
    const { topicos } = analisarEmenta(SOI_I)
    const previa = resumirBruto(topicos)
    const montada = contarEmenta(montarEmenta('medicina', 1, topicos))

    expect(montada.topicos).toBe(previa.topicos)
    expect(montada.subtopicos).toBe(previa.subtopicos)
    expect(montada.modulos).toBe(previa.modulos)
    expect(montada.submodulos).toBe(previa.submodulos)
    expect(Math.round(montada.horas)).toBe(previa.horas)
  })
})

describe('detecção pelo nome do arquivo', () => {
  it('lê seção e período dos nomes reais', () => {
    expect(detectarAlvo('MEDICINA - SOI III.md')).toEqual({ secao: 'medicina', periodo: 3, bloco: 'SOI III' })
    expect(detectarAlvo('MEDICINA HAM I.md')).toEqual({ secao: 'medicina', periodo: 1, bloco: 'HAM I' })
    expect(detectarAlvo('PSICOLOGIA - 10° PERÍODO.md')).toEqual({ secao: 'psicologia', periodo: 10, bloco: null })
    expect(detectarAlvo('BIOMEDICINA - 7° PERÍODO.md')).toEqual({ secao: 'biomedicina', periodo: 7, bloco: null })
    expect(detectarAlvo('ODONTOLOGIA - 1° PERÍODO.md')).toEqual({ secao: 'odontologia', periodo: 1, bloco: null })
  })

  it('acha a seção mesmo sem período no nome', () => {
    expect(detectarAlvo('odontologia-extra.md')).toEqual({ secao: 'odontologia', periodo: null, bloco: null })
  })

  it('devolve null quando não dá para adivinhar a seção', () => {
    expect(detectarAlvo('ementa.md')).toBeNull()
    expect(detectarAlvo('')).toBeNull()
  })
})
