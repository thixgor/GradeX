import { describe, it, expect } from 'vitest'
import {
  LETRAS,
  escaparRegex,
  ehObjectId,
  lerQuestao,
  normalizarAlternativas,
  questaoDoBanco,
  questaoVazia,
  type DadosDaQuestao,
} from '@/lib/banco/questao-admin'

const MODULO = '65b0c0000000000000000001'
const TOPICO = '65b0c0000000000000000002'
const SUBTOPICO = '65b0c0000000000000000003'

function objetiva(extra: Record<string, unknown> = {}) {
  return {
    tipo: 'objetiva',
    moduloId: MODULO,
    topicoId: TOPICO,
    enunciado: 'Qual é a principal causa de IC com fração de ejeção preservada?',
    alternativas: [
      { letra: 'A', texto: 'Hipertensão arterial', correta: true },
      { letra: 'B', texto: 'Estenose mitral', correta: false },
      { letra: 'C', texto: 'Miocardite', correta: false },
      { letra: 'D', texto: 'Pericardite', correta: false },
    ],
    ...extra,
  }
}

function gravada(extra: Partial<DadosDaQuestao> = {}): DadosDaQuestao {
  const leitura = lerQuestao(objetiva())
  if (!leitura.ok) throw new Error(leitura.erro)
  return { ...leitura.questao, ...extra }
}

describe('ehObjectId', () => {
  it('aceita só os 24 hexadecimais de um _id', () => {
    expect(ehObjectId(MODULO)).toBe(true)
    expect(ehObjectId(MODULO.toUpperCase())).toBe(true)
    expect(ehObjectId('')).toBe(false)
    expect(ehObjectId('65b0c000000000000000000')).toBe(false)
    expect(ehObjectId(null)).toBe(false)
  })

  // O caso que derrubava a edição: o formulário mandava `String(undefined)`
  // para uma questão sem período, e a rota construía ObjectId com isso.
  it('recusa a string "undefined"', () => {
    expect(ehObjectId('undefined')).toBe(false)
    expect(ehObjectId('null')).toBe(false)
  })
})

describe('escaparRegex', () => {
  it('trata o que a pessoa digitou como texto', () => {
    expect(escaparRegex('IC (FEr)')).toBe('IC \\(FEr\\)')
    expect(new RegExp(escaparRegex('IC (')).test('IC (FEr)')).toBe(true)
  })
})

describe('normalizarAlternativas', () => {
  it('renumera as letras pela posição', () => {
    const alts = normalizarAlternativas([
      { letra: 'A', texto: 'um', correta: false },
      { letra: 'C', texto: 'dois', correta: true },
      { letra: 'D', texto: 'três', correta: false },
    ])
    expect(alts.map((a) => a.letra)).toEqual(['A', 'B', 'C'])
    expect(alts[1].correta).toBe(true)
  })

  it('não passa de cinco alternativas', () => {
    const alts = normalizarAlternativas(Array.from({ length: 8 }, () => ({ texto: 'x' })))
    expect(alts).toHaveLength(LETRAS.length)
  })
})

describe('lerQuestao — criação', () => {
  it('aprova uma objetiva completa e devolve os dados limpos', () => {
    const leitura = lerQuestao(objetiva({ enunciado: '  Enunciado com espaço  ', fonte: ' ENADE ' }))
    expect(leitura.ok).toBe(true)
    if (!leitura.ok) return
    expect(leitura.questao.enunciado).toBe('Enunciado com espaço')
    expect(leitura.questao.fonte).toBe('ENADE')
    expect(leitura.questao.respostaModelo).toBeNull()
    expect(leitura.questao.subtopicoId).toBeNull()
  })

  it('exige módulo e tópico como id de verdade', () => {
    expect(lerQuestao(objetiva({ moduloId: 'undefined' }))).toMatchObject({ ok: false, campo: 'moduloId' })
    expect(lerQuestao(objetiva({ topicoId: '' }))).toMatchObject({ ok: false, campo: 'topicoId' })
  })

  it('exige enunciado', () => {
    expect(lerQuestao(objetiva({ enunciado: '   ' }))).toMatchObject({ ok: false, campo: 'enunciado' })
  })

  it('exige exatamente uma alternativa correta', () => {
    const semGabarito = objetiva({
      alternativas: [
        { letra: 'A', texto: 'um', correta: false },
        { letra: 'B', texto: 'dois', correta: false },
      ],
    })
    expect(lerQuestao(semGabarito)).toMatchObject({ ok: false, campo: 'alternativas' })

    const duasCorretas = objetiva({
      alternativas: [
        { letra: 'A', texto: 'um', correta: true },
        { letra: 'B', texto: 'dois', correta: true },
      ],
    })
    expect(lerQuestao(duasCorretas)).toMatchObject({ ok: false, campo: 'alternativas' })
  })

  it('aponta a alternativa que ficou sem texto pela letra certa', () => {
    const leitura = lerQuestao(
      objetiva({
        alternativas: [
          { letra: 'A', texto: 'um', correta: true },
          { letra: 'B', texto: '  ', correta: false },
          { letra: 'C', texto: 'três', correta: false },
        ],
      }),
    )
    expect(leitura.ok).toBe(false)
    if (leitura.ok) return
    expect(leitura.erro).toContain('alternativa B')
  })

  it('exige resposta modelo na discursiva', () => {
    const semResposta = { ...objetiva(), tipo: 'discursiva', alternativas: undefined }
    expect(lerQuestao(semResposta)).toMatchObject({ ok: false, campo: 'respostaModelo' })
  })

  it('recusa imagem que não é endereço de imagem', () => {
    expect(lerQuestao(objetiva({ imagemUrl: 'javascript:alert(1)' }))).toMatchObject({
      ok: false,
      campo: 'imagemUrl',
    })
    const boa = lerQuestao(objetiva({ imagemUrl: 'https://i.imgur.com/a.png' }))
    expect(boa.ok).toBe(true)
  })

  it('limpa tags repetidas e vazias', () => {
    const leitura = lerQuestao(objetiva({ tags: [' cardio ', 'cardio', '', 42] }))
    expect(leitura.ok).toBe(true)
    if (!leitura.ok) return
    expect(leitura.questao.tags).toEqual(['cardio'])
  })

  it('recusa ano impossível', () => {
    expect(lerQuestao(objetiva({ ano: 1500 }))).toMatchObject({ ok: false, campo: 'ano' })
    expect(lerQuestao(objetiva({ ano: 2020 }))).toMatchObject({ ok: true })
  })
})

describe('lerQuestao — edição', () => {
  it('mantém o que não veio no corpo', () => {
    const anterior = gravada({ fonte: 'ENADE 2023', dificuldade: 'medio' })
    const leitura = lerQuestao({ enunciado: 'Outro enunciado' }, anterior)
    expect(leitura.ok).toBe(true)
    if (!leitura.ok) return
    expect(leitura.questao.enunciado).toBe('Outro enunciado')
    expect(leitura.questao.fonte).toBe('ENADE 2023')
    expect(leitura.questao.dificuldade).toBe('medio')
    expect(leitura.questao.alternativas).toHaveLength(4)
  })

  it('apaga o campo quando o corpo manda vazio', () => {
    const anterior = gravada({ fonte: 'ENADE', explicacao: 'porque sim', subtopicoId: SUBTOPICO })
    const leitura = lerQuestao({ fonte: '', explicacao: '', subtopicoId: '' }, anterior)
    expect(leitura.ok).toBe(true)
    if (!leitura.ok) return
    expect(leitura.questao.fonte).toBeNull()
    expect(leitura.questao.explicacao).toBeNull()
    expect(leitura.questao.subtopicoId).toBeNull()
  })

  it('não deixa a objetiva perder o gabarito numa edição', () => {
    const anterior = gravada()
    const semGabarito = anterior.alternativas!.map((a) => ({ ...a, correta: false }))
    expect(lerQuestao({ alternativas: semGabarito }, anterior)).toMatchObject({
      ok: false,
      campo: 'alternativas',
    })
  })

  it('ao virar discursiva, cobra a resposta modelo e joga fora as alternativas', () => {
    const anterior = gravada()
    expect(lerQuestao({ tipo: 'discursiva' }, anterior)).toMatchObject({
      ok: false,
      campo: 'respostaModelo',
    })

    const leitura = lerQuestao({ tipo: 'discursiva', respostaModelo: 'Fala da HAS' }, anterior)
    expect(leitura.ok).toBe(true)
    if (!leitura.ok) return
    expect(leitura.questao.alternativas).toBeNull()
    expect(leitura.questao.respostaModelo).toBe('Fala da HAS')
  })

  it('ao virar objetiva, joga fora a resposta modelo', () => {
    const anterior = gravada({ tipo: 'discursiva', alternativas: null, respostaModelo: 'texto' })
    const leitura = lerQuestao({ tipo: 'objetiva', alternativas: objetiva().alternativas }, anterior)
    expect(leitura.ok).toBe(true)
    if (!leitura.ok) return
    expect(leitura.questao.respostaModelo).toBeNull()
    expect(leitura.questao.alternativas).toHaveLength(4)
  })

  it('recusa mudar de tópico para um id inválido', () => {
    expect(lerQuestao({ topicoId: 'undefined' }, gravada())).toMatchObject({
      ok: false,
      campo: 'topicoId',
    })
  })
})

describe('questaoDoBanco', () => {
  it('lê o documento antigo, com `subtopicoid` minúsculo e ids em ObjectId', () => {
    const doc = {
      tipo: 'objetiva',
      moduloId: { toString: () => MODULO },
      topicoId: { toString: () => TOPICO },
      subtopicoid: { toString: () => SUBTOPICO },
      enunciado: 'texto',
      alternativas: [{ letra: 'A', texto: 'um', correta: true }],
      periodoId: { toString: () => '65b0c0000000000000000009' },
    }
    const lida = questaoDoBanco(doc)
    expect(lida.moduloId).toBe(MODULO)
    expect(lida.subtopicoId).toBe(SUBTOPICO)
    expect(lida.alternativas).toHaveLength(1)
  })

  // Uma questão criada depois da remoção do período não tem `periodoId`: é
  // exatamente esse documento que a edição não conseguia salvar.
  it('lê questão sem período sem inventar campo nenhum', () => {
    const lida = questaoDoBanco({ tipo: 'discursiva', moduloId: MODULO, topicoId: TOPICO, enunciado: 'x', respostaModelo: 'y' })
    expect(lida.subtopicoId).toBeNull()
    expect(lida.alternativas).toBeNull()
    const leitura = lerQuestao({ enunciado: 'novo enunciado' }, lida)
    expect(leitura.ok).toBe(true)
  })
})

describe('questaoVazia', () => {
  it('nasce com quatro alternativas em branco e sem gabarito', () => {
    const vazia = questaoVazia()
    expect(vazia.alternativas).toHaveLength(4)
    expect(vazia.alternativas?.every((a) => !a.correta)).toBe(true)
    expect(lerQuestao(vazia)).toMatchObject({ ok: false })
  })
})
