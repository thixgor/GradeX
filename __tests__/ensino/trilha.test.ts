import { describe, expect, it } from 'vitest'
import {
  achatarItens,
  aulaIdsDaTrilha,
  calcularProgressoDaTrilha,
  minutosLegiveis,
  normalizarEtapas,
  posicaoNaTrilha,
  resumirTrilha,
  rotuloDoBotao,
  validarPublicacao,
  type EtapaDaTrilha,
  type ProgressoConhecido,
} from '@/lib/ensino/trilha'

const id = (n: number) => String(n).padStart(24, 'a')

const TRILHA: { etapas: EtapaDaTrilha[] } = {
  etapas: [
    {
      id: 'e1',
      titulo: 'Antes da doença',
      itens: [
        { id: 'i1', tipo: 'aula', refId: id(1), obrigatorio: true },
        { id: 'i2', tipo: 'aula', refId: id(2), obrigatorio: true },
      ],
    },
    {
      id: 'e2',
      titulo: 'Entenda a doença',
      itens: [
        { id: 'i3', tipo: 'aula', refId: id(3), obrigatorio: true },
        { id: 'i4', tipo: 'material', refId: id(4), obrigatorio: true },
        { id: 'i5', tipo: 'aula', refId: id(5), obrigatorio: false },
      ],
    },
  ],
}

const progresso = (pares: Array<[string, ProgressoConhecido]>) => new Map(pares)

describe('normalizarEtapas', () => {
  it('descarta item sem referência válida em vez de guardá-lo pela metade', () => {
    const etapas = normalizarEtapas([
      { titulo: 'E1', itens: [{ tipo: 'aula', refId: 'não-é-id' }, { tipo: 'aula', refId: id(1) }] },
    ])
    expect(etapas[0].itens).toHaveLength(1)
    expect(etapas[0].itens[0].refId).toBe(id(1))
  })

  it('aceita link só com URL http', () => {
    const etapas = normalizarEtapas([
      {
        titulo: 'E1',
        itens: [
          { tipo: 'link', url: 'https://exemplo.com/artigo' },
          { tipo: 'link', url: 'javascript:alert(1)' },
        ],
      },
    ])
    expect(etapas[0].itens).toHaveLength(1)
    expect(etapas[0].itens[0].url).toBe('https://exemplo.com/artigo')
  })

  it('remove a mesma aula repetida DENTRO da etapa, mas permite entre etapas', () => {
    const etapas = normalizarEtapas([
      { titulo: 'E1', itens: [{ tipo: 'aula', refId: id(1) }, { tipo: 'aula', refId: id(1) }] },
      { titulo: 'E2', itens: [{ tipo: 'aula', refId: id(1) }] },
    ])
    expect(etapas[0].itens).toHaveLength(1)
    expect(etapas[1].itens).toHaveLength(1)
  })

  it('trata item como obrigatório por padrão', () => {
    const etapas = normalizarEtapas([{ titulo: 'E1', itens: [{ tipo: 'aula', refId: id(1) }] }])
    expect(etapas[0].itens[0].obrigatorio).toBe(true)
  })

  it('nomeia etapa sem título', () => {
    expect(normalizarEtapas([{ itens: [] }])[0].titulo).toBe('Etapa 1')
  })
})

describe('validarPublicacao', () => {
  it('exige título e ao menos uma aula', () => {
    const problemas = validarPublicacao({ titulo: '', etapas: [] })
    expect(problemas.map((p) => p.campo).sort()).toEqual(['etapas', 'titulo'])
  })

  it('aprova trilha montada', () => {
    expect(validarPublicacao({ titulo: 'IC do Zero', etapas: TRILHA.etapas })).toEqual([])
  })
})

describe('calcularProgressoDaTrilha', () => {
  it('conta só aulas obrigatórias', () => {
    // 3 aulas obrigatórias (i1, i2, i3). O material e a aula complementar ficam
    // fora da conta — senão a barra nunca chegaria a 100%.
    const p = calcularProgressoDaTrilha(TRILHA, new Map())
    expect(p.total).toBe(3)
  })

  it('aponta a primeira pendente como próximo passo', () => {
    const p = calcularProgressoDaTrilha(
      TRILHA,
      progresso([[id(1), { concluida: true, percentual: 100 }]]),
    )
    expect(p.concluidos).toBe(1)
    expect(p.percentual).toBe(33)
    expect(p.proximo?.item.refId).toBe(id(2))
    expect(p.iniciada).toBe(true)
    expect(p.concluida).toBe(false)
  })

  it('conclui a trilha quando todas as obrigatórias terminam', () => {
    const p = calcularProgressoDaTrilha(
      TRILHA,
      progresso([
        [id(1), { concluida: true }],
        [id(2), { concluida: true }],
        [id(3), { concluida: true }],
      ]),
    )
    expect(p.percentual).toBe(100)
    expect(p.concluida).toBe(true)
    expect(p.proximo).toBeNull()
  })

  it('marca como iniciada quem só assistiu um pedaço', () => {
    const p = calcularProgressoDaTrilha(
      TRILHA,
      progresso([[id(1), { percentual: 12, posicaoSegundos: 110 }]]),
    )
    expect(p.iniciada).toBe(true)
    expect(p.concluidos).toBe(0)
  })

  it('não marca como iniciada por causa de alguns segundos acidentais', () => {
    // O player grava ao sair da aula. Dois segundos de vídeo curto viram 1%, e
    // 1% bastava para a Trilha inteira se dizer começada em "Suas Trilhas".
    const p = calcularProgressoDaTrilha(
      TRILHA,
      progresso([[id(1), { percentual: 1, posicaoSegundos: 2 }]]),
    )
    expect(p.iniciada).toBe(false)
  })

  it('aula concluída sem posição conta como iniciada', () => {
    // Conclusão manual (§34) e vídeo em iframe param em `posicaoSegundos: 0` —
    // o corte por segundos não pode apagar uma conclusão real.
    const p = calcularProgressoDaTrilha(
      TRILHA,
      progresso([[id(1), { concluida: true, posicaoSegundos: 0 }]]),
    )
    expect(p.iniciada).toBe(true)
  })

  it('não inventa barra em trilha sem aula obrigatória', () => {
    const p = calcularProgressoDaTrilha(
      { etapas: [{ id: 'e', titulo: 'E', itens: [{ id: 'i', tipo: 'material', refId: id(9) }] }] },
      new Map(),
    )
    expect(p.total).toBe(0)
    expect(p.percentual).toBe(0)
    expect(p.concluida).toBe(false)
  })

  it('resume cada etapa separadamente', () => {
    const p = calcularProgressoDaTrilha(TRILHA, progresso([[id(1), { concluida: true }]]))
    expect(p.etapas[0]).toMatchObject({ total: 2, concluidos: 1, percentual: 50, completa: false })
    expect(p.etapas[1]).toMatchObject({ total: 1, concluidos: 0 })
  })
})

describe('posição na trilha', () => {
  it('atravessa a fronteira da etapa para achar a próxima', () => {
    const pos = posicaoNaTrilha(TRILHA, id(2))!
    expect(pos.etapaTitulo).toBe('Antes da doença')
    expect(pos.anterior?.refId).toBe(id(1))
    // A próxima é a primeira da etapa seguinte — o aluno não volta ao índice.
    expect(pos.proxima?.refId).toBe(id(3))
  })

  it('devolve null para aula avulsa', () => {
    expect(posicaoNaTrilha(TRILHA, id(99))).toBeNull()
  })
})

describe('leitura', () => {
  it('achata na ordem do caminho', () => {
    expect(achatarItens(TRILHA).map((p) => p.item.id)).toEqual(['i1', 'i2', 'i3', 'i4', 'i5'])
  })

  it('lista aulas únicas', () => {
    expect(aulaIdsDaTrilha(TRILHA)).toEqual([id(1), id(2), id(3), id(5)])
  })

  it('soma duração das aulas quando não há estimativa manual', () => {
    const resumo = resumirTrilha(TRILHA, new Map([[id(1), 720], [id(2), 600]]))
    expect(resumo).toMatchObject({ aulas: 4, etapas: 2, minutos: 22 })
  })

  it('prefere a estimativa do admin à soma dos vídeos', () => {
    const resumo = resumirTrilha({ ...TRILHA, duracaoEstimadaMin: 360 }, new Map([[id(1), 720]]))
    expect(resumo.minutos).toBe(360)
  })

  it('formata minutos', () => {
    expect(minutosLegiveis(45)).toBe('45 min')
    expect(minutosLegiveis(375)).toBe('6h15')
    expect(minutosLegiveis(120)).toBe('2h')
    expect(minutosLegiveis(0)).toBe('')
  })

  it('escolhe o rótulo do botão pelo estado', () => {
    expect(rotuloDoBotao({ iniciada: false, concluida: false })).toBe('Começar Trilha')
    expect(rotuloDoBotao({ iniciada: true, concluida: false })).toBe('Continuar de onde parei')
    expect(rotuloDoBotao({ iniciada: true, concluida: true })).toBe('Revisar a Trilha')
  })
})
