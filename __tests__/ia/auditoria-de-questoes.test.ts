import { describe, expect, it } from 'vitest'

import {
  auditarQuestao,
  normalizarComando,
  ordemComCorretaEm,
  precisaDescartar,
  precisaReparar,
  resumirLote,
  sequenciaDeGabarito,
  sorteador,
  type QuestaoAuditavel,
} from '@/lib/ia/estudo/auditoria-de-questoes'
import { planejarProva, sanitizarVaga, formatosPossiveis } from '@/lib/ia/estudo/plano-da-prova'
import { sanitizarRecurso, escalaDoEixo } from '@/lib/ia/estudo/recursos-visuais'
import { iaDeEstudoLiberada } from '@/lib/ia/estudo/acesso'

const base = (alternativas: { texto: string; correta: boolean }[], extra: Partial<QuestaoAuditavel> = {}): QuestaoAuditavel => ({
  formato: 'standard',
  enunciado: 'Paciente de 54 anos com dispneia progressiva e estertores bibasais.',
  comando: 'Qual é o mecanismo mais provável?',
  alternativas,
  ...extra,
})

const codigos = (q: QuestaoAuditavel, n = 4) => auditarQuestao(q, n).map((a) => a.codigo)

describe('auditoria das questões geradas', () => {
  it('aprova uma questão equilibrada', () => {
    const q = base([
      { texto: 'Aumento da pressão hidrostática capilar pulmonar', correta: true },
      { texto: 'Redução da pressão oncótica por perda renal de albumina', correta: false },
      { texto: 'Aumento da permeabilidade capilar por lesão alveolar difusa', correta: false },
      { texto: 'Obstrução da drenagem linfática por infiltração neoplásica', correta: false },
    ])
    expect(auditarQuestao(q, 4)).toEqual([])
  })

  it('pega a correta que é a mais longa', () => {
    const q = base([
      { texto: 'Aumento da pressão hidrostática capilar pulmonar secundário à disfunção sistólica do ventrículo esquerdo', correta: true },
      { texto: 'Hipoalbuminemia', correta: false },
      { texto: 'Lesão alveolar difusa', correta: false },
      { texto: 'Obstrução linfática', correta: false },
    ])
    const alertas = codigos(q)
    expect(alertas).toContain('correta-mais-longa')
    expect(alertas).toContain('distratoras-curtas')
    expect(precisaReparar(auditarQuestao(q, 4))).toBe(true)
  })

  it('pega parênteses e travessão só na correta', () => {
    const q = base([
      { texto: 'Congestão venosa pulmonar (por falência do VE)', correta: true },
      { texto: 'Redução da pressão oncótica do plasma sanguíneo', correta: false },
      { texto: 'Aumento da permeabilidade por lesão alveolar', correta: false },
      { texto: 'Obstrução da drenagem linfática do pulmão', correta: false },
    ])
    expect(codigos(q)).toContain('marcas-so-na-correta')
  })

  it('pega distratoras absolutas (sempre, exclusivamente…) com a correta sem nenhuma', () => {
    const q = base([
      { texto: 'Pode ocorrer por aumento da pressão hidrostática', correta: true },
      { texto: 'Ocorre exclusivamente por hipoalbuminemia grave', correta: false },
      { texto: 'É sempre causado por lesão da membrana alveolar', correta: false },
      { texto: 'Depende totalmente da obstrução da drenagem linfática', correta: false },
    ])
    expect(codigos(q)).toContain('termos-absolutos')
  })

  it('descarta gabarito com zero ou duas corretas', () => {
    const q = base([
      { texto: 'A primeira opção do item', correta: true },
      { texto: 'A segunda opção do item', correta: true },
      { texto: 'A terceira opção do item', correta: false },
      { texto: 'A quarta opção do item', correta: false },
    ])
    expect(precisaDescartar(auditarQuestao(q, 4))).toBe(true)
  })

  it('descarta afirmativas sem I, II e III e enunciado que cita tabela ausente', () => {
    const alts = ['I e II, apenas', 'II e III, apenas', 'I, III e IV, apenas', 'I, II, III e IV'].map((texto, i) => ({ texto, correta: i === 1 }))
    expect(codigos(base(alts, { formato: 'multiple-affirmative' }))).toContain('formato-incoerente')
    const ok = base(alts, { formato: 'multiple-affirmative', enunciado: 'Julgue:\nI. a\nII. b\nIII. c\nIV. d' })
    expect(codigos(ok)).not.toContain('formato-incoerente')

    const semTabela = base(
      [
        { texto: 'Hipocalemia por perda gastrointestinal', correta: true },
        { texto: 'Hipercalemia por acidose metabólica', correta: false },
        { texto: 'Hiponatremia por secreção inapropriada', correta: false },
        { texto: 'Hipercalcemia por hiperparatireoidismo', correta: false },
      ],
      { enunciado: 'Analise a tabela a seguir com os eletrólitos do paciente.' },
    )
    expect(precisaDescartar(auditarQuestao(semTabela, 4))).toBe(true)
    expect(precisaDescartar(auditarQuestao({ ...semTabela, temRecurso: true }, 4))).toBe(false)
  })

  it('não aceita "todas as anteriores"', () => {
    const q = base([
      { texto: 'Aumento da pressão hidrostática capilar', correta: false },
      { texto: 'Redução da pressão oncótica plasmática', correta: false },
      { texto: 'Lesão da membrana alveolocapilar', correta: false },
      { texto: 'Todas as anteriores estão corretas', correta: true },
    ])
    expect(codigos(q)).toContain('referencia-a-alternativas')
  })

  it('põe a palavra negativa do comando em caixa alta', () => {
    expect(normalizarComando('Assinale a alternativa incorreta')).toBe('Assinale a alternativa INCORRETA:')
    expect(normalizarComando('Todas são indicações, exceto:')).toBe('Todas são indicações, EXCETO:')
    expect(normalizarComando('Qual o diagnóstico?')).toBe('Qual o diagnóstico?')
  })
})

describe('gabarito equilibrado', () => {
  it('distribui as letras por igual e nunca repete três seguidas', () => {
    for (let semente = 1; semente < 40; semente++) {
      const seq = sequenciaDeGabarito(20, 5, sorteador(semente))
      const contagem = [0, 0, 0, 0, 0]
      seq.forEach((p) => contagem[p]++)
      expect(Math.max(...contagem) - Math.min(...contagem)).toBeLessThanOrEqual(1)
      for (let i = 2; i < seq.length; i++) {
        expect(seq[i] === seq[i - 1] && seq[i] === seq[i - 2]).toBe(false)
      }
    }
  })

  it('põe a correta na posição pedida, levando junto o índice original', () => {
    const alts = [
      { texto: 'a', correta: false },
      { texto: 'b', correta: true },
      { texto: 'c', correta: false },
      { texto: 'd', correta: false },
    ]
    for (let alvo = 0; alvo < 4; alvo++) {
      const ordem = ordemComCorretaEm(alts, alvo, sorteador(alvo + 7))
      expect(ordem[alvo]).toBe(1)
      expect([...ordem].sort()).toEqual([0, 1, 2, 3])
    }
  })

  it('o resumo conta em quantas a correta é a mais longa', () => {
    const r = resumirLote([
      { formato: 'standard', alternativas: [{ texto: 'longa demais aqui', correta: true }, { texto: 'curta', correta: false }] },
      { formato: 'standard', alternativas: [{ texto: 'curta', correta: false }, { texto: 'ok', correta: true }] },
    ])
    expect(r.corretaMaisLonga).toBe(1)
    expect(r.posicoes).toEqual({ A: 1, B: 1 })
  })
})

describe('plano da prova', () => {
  it('reparte temas, respeita formatos possíveis e equilibra o gabarito', () => {
    const vagas = planejarProva(
      {
        temas: ['Insuficiência cardíaca', 'Asma', 'Diabetes'],
        quantidade: 12,
        alternativas: 4,
        nivel: 'misto',
        estilo: 'misto',
        formatos: ['standard', 'assertion-reason'],
        recursos: ['tabela', 'grafico'],
      },
      42,
    )
    expect(vagas).toHaveLength(12)
    const porTema = vagas.reduce<Record<string, number>>((acc, v) => ((acc[v.tema] = (acc[v.tema] || 0) + 1), acc), {})
    expect(Object.values(porTema)).toEqual([4, 4, 4])
    // Asserção-razão exige 5 alternativas: com 4, sai do plano.
    expect(vagas.every((v) => v.formato === 'standard')).toBe(true)
    expect(vagas.some((v) => v.recurso !== null)).toBe(true)
    expect(vagas.every((v) => v.posicaoCorreta >= 0 && v.posicaoCorreta < 4)).toBe(true)
  })

  it('não confia na vaga que chega do navegador', () => {
    expect(sanitizarVaga({ tema: '  ', formato: 'standard' }, 5)).toBeNull()
    const v = sanitizarVaga({ tema: 'Asma', formato: 'hack', nivel: 'impossivel', recurso: 'video', posicaoCorreta: 99 }, 5)!
    expect(v).toMatchObject({ tema: 'Asma', formato: 'standard', nivel: 'medio', recurso: null, posicaoCorreta: 4 })
    expect(formatosPossiveis(['assertion-reason'], 4)).toEqual(['standard'])
  })
})

describe('recursos visuais', () => {
  it('aceita tabela coerente e descarta o que não desenha', () => {
    const t = sanitizarRecurso({ tipo: 'tabela', cabecalho: ['Exame', 'Valor'], linhas: [['Na', '128'], ['K', '3,1', 'extra']] })
    expect(t).toMatchObject({ tipo: 'tabela', linhas: [['Na', '128'], ['K', '3,1']] })
    expect(sanitizarRecurso({ tipo: 'tabela', cabecalho: ['Só uma'], linhas: [['x']] })).toBeNull()
    expect(sanitizarRecurso({ tipo: 'grafico', rotulos: ['a', 'b'], series: [{ nome: 's', valores: [1] }] })).toBeNull()
    expect(sanitizarRecurso({ tipo: 'grafico', rotulos: ['a', 'b'], series: [{ nome: 's', valores: ['1,5', 2] }] })).toMatchObject({
      series: [{ valores: [1.5, 2] }],
    })
    expect(sanitizarRecurso({ tipo: 'nenhum' })).toBeNull()
  })

  it('escala do eixo em números redondos', () => {
    expect(escalaDoEixo(87)).toEqual({ min: 0, max: 100, passo: 25 })
    expect(escalaDoEixo(3.2).max).toBeGreaterThanOrEqual(3.2)
  })
})

describe('acesso à IA de estudo', () => {
  it('só Quest+, Plus+ e admin', () => {
    expect(iaDeEstudoLiberada('plus')).toBe(true)
    expect(iaDeEstudoLiberada('premium')).toBe(true)
    expect(iaDeEstudoLiberada('quest')).toBe(true)
    expect(iaDeEstudoLiberada('gratuito')).toBe(false)
    expect(iaDeEstudoLiberada('trial')).toBe(false)
    expect(iaDeEstudoLiberada(null, true)).toBe(true)
  })
})
