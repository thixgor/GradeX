import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'

/**
 * Resumo por IA das monitorias — regras puras (preço, reembolso, cobertura,
 * linha do tempo, validação), a cifra das chaves de IA, o ajuste do pedido ao
 * modelo do Gemini e o fechamento do vazamento de `aiKeys` no GET público.
 */

import {
  arredondarPara90,
  CONFIG_RESUMO_PADRAO,
  coberturaDaAula,
  diaDaVigencia,
  janelasDaTranscricao,
  lacunasDaAula,
  linhaDoTempo,
  normalizarConfigResumo,
  planoDoAdicionalNoReembolso,
  precoDoResumo,
  tabelaVigente,
  taxaProporcional,
  tempoReal,
  textoAditivoResumo,
  transcricaoParaPrompt,
  valorSemOAdicional,
  vendaLiberada,
  vozTranscrita,
} from '@/lib/monitorias/resumo/regras'
import { lerJson, validarResumo, validarTranscricao } from '@/lib/monitorias/resumo/esquema'
import { cifrarSegredoDeConfig, decifrarSegredoDeConfig, ehMascara, mascararSegredo, proximoSegredo } from '@/lib/ia/cripto-config'
import { configDeGeracao, modeloDesligado, textoDaInteracao } from '@/lib/ia/gemini'
import { contadoresDaReserva } from '@/lib/monitorias/politica'

const sessao = vi.hoisted(() => ({ atual: null as null | { role: string; userId: string } }))
const landing = vi.hoisted(() => ({ doc: null as any }))
vi.mock('@/lib/auth', () => ({ getSession: async () => sessao.atual }))
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (nome: string) => ({
      findOne: async () => (nome === 'landing_settings' ? landing.doc : null),
    }),
  }),
}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

const ANTES_DA_VIRADA = new Date('2026-11-10T15:00:00Z')
const DEPOIS_DA_VIRADA = new Date('2027-02-10T15:00:00Z')

describe('preço do Resumo por IA', () => {
  it('aula individual de 60 min em 2026 sai no preço mínimo (R$ 4,90)', () => {
    const p = precoDoResumo({ duracaoMin: 60, individual: true, config: CONFIG_RESUMO_PADRAO, brlPorUsd: 5.5, dataDaAula: ANTES_DA_VIRADA })!
    expect(p.custoUsd).toBeCloseTo(0.205, 3)
    expect(p.precoCentavos).toBe(490)
    expect(p.tabelaDesde).toBe('2026-09-02')
  })

  it('usa a tabela vigente NA DATA DA AULA (preço padrão do 3.8 a partir de 2027)', () => {
    const p = precoDoResumo({ duracaoMin: 60, individual: true, config: CONFIG_RESUMO_PADRAO, brlPorUsd: 5.5, dataDaAula: DEPOIS_DA_VIRADA })!
    expect(p.custoUsd).toBeCloseTo(0.41, 2)
    expect(p.precoCentavos).toBe(790)
    expect(p.tabelaDesde).toBe('2027-01-01')
  })

  it('grupo custa menos (só a voz do monitor) e o máximo do admin limita', () => {
    const individual = precoDoResumo({ duracaoMin: 240, individual: true, config: CONFIG_RESUMO_PADRAO, brlPorUsd: 5.5, dataDaAula: DEPOIS_DA_VIRADA })!
    const grupo = precoDoResumo({ duracaoMin: 240, individual: false, config: CONFIG_RESUMO_PADRAO, brlPorUsd: 5.5, dataDaAula: DEPOIS_DA_VIRADA })!
    expect(grupo.custoUsd).toBeLessThan(individual.custoUsd)
    const limitado = precoDoResumo({ duracaoMin: 240, individual: true, config: { ...CONFIG_RESUMO_PADRAO, precoMaximoCentavos: 1000 }, brlPorUsd: 5.5, dataDaAula: DEPOIS_DA_VIRADA })!
    expect(limitado.precoCentavos).toBe(1000)
    expect(limitado.limitado).toBe('maximo')
  })

  it('modelo sem preço cadastrado não vende (null), e câmbio inválido também não', () => {
    expect(precoDoResumo({ duracaoMin: 60, individual: true, config: { ...CONFIG_RESUMO_PADRAO, modeloResumo: 'gemini-9-ultra' }, brlPorUsd: 5.5, dataDaAula: ANTES_DA_VIRADA })).toBeNull()
    expect(precoDoResumo({ duracaoMin: 60, individual: true, config: CONFIG_RESUMO_PADRAO, brlPorUsd: 0, dataDaAula: ANTES_DA_VIRADA })).toBeNull()
  })

  it('arredonda para cima até o próximo ",90"', () => {
    expect(arredondarPara90(412)).toBe(490)
    expect(arredondarPara90(490)).toBe(490)
    expect(arredondarPara90(491)).toBe(590)
    expect(arredondarPara90(0)).toBe(90)
  })

  it('vigência pelo dia de Brasília: 31/12 às 23h ainda é o preço introdutório', () => {
    const virada = new Date('2027-01-01T02:00:00Z') // 31/12 23h em Brasília
    expect(diaDaVigencia(virada)).toBe('2026-12-31')
    expect(tabelaVigente(CONFIG_RESUMO_PADRAO.precos, 'gemini-3.8-flash', virada)?.saida).toBe(3.75)
    expect(tabelaVigente(CONFIG_RESUMO_PADRAO.precos, 'gemini-3.8-flash', new Date('2027-01-01T04:00:00Z'))?.saida).toBe(7.5)
  })
})

describe('configuração do Resumo por IA', () => {
  it('lixo vira o padrão; modelos desligados e faixas absurdas são corrigidos', () => {
    expect(normalizarConfigResumo(null)).toEqual(CONFIG_RESUMO_PADRAO)
    const c = normalizarConfigResumo({ modeloResumo: 'gemini-2.0-flash', precoMinimoCentavos: 900, precoMaximoCentavos: 100, margemSegurancaPct: -5, precos: [{ modelo: '', desde: 'x' }] })
    expect(c.modeloResumo).toBe('gemini-3.8-flash')
    expect(c.precoMaximoCentavos).toBe(900)
    expect(c.margemSegurancaPct).toBe(0)
    expect(c.precos).toEqual(CONFIG_RESUMO_PADRAO.precos)
  })

  it('a venda só liga com a confirmação do nível pago', () => {
    expect(vendaLiberada(normalizarConfigResumo({ vendaAtiva: true }))).toBe(false)
    expect(vendaLiberada(normalizarConfigResumo({ vendaAtiva: true, nivelPagoConfirmado: true }))).toBe(true)
  })

  it('o aditivo mostra o prazo de retenção configurado', () => {
    expect(textoAditivoResumo(3)).toContain('até 3 dia(s)')
    expect(textoAditivoResumo(3)).toContain('Em aula em grupo, só a voz do monitor é transcrita')
  })
})

describe('quem tem a voz transcrita', () => {
  it('monitor sempre; aluno só na individual e se comprou; grupo só o monitor', () => {
    expect(vozTranscrita({ papel: 'monitor', individual: false, comprou: false })).toBe(true)
    expect(vozTranscrita({ papel: 'aluno', individual: false, comprou: true })).toBe(false)
    expect(vozTranscrita({ papel: 'aluno', individual: true, comprou: true })).toBe(true)
    expect(vozTranscrita({ papel: 'aluno', individual: true, comprou: false })).toBe(false)
  })
})

describe('dinheiro do adicional', () => {
  it('reembolso integral: não entregue vai junto; entregue (ou com reembolso próprio) fica fora; parcial não mexe', () => {
    expect(planoDoAdicionalNoReembolso(null, true)).toBe('sem_adicional')
    expect(planoDoAdicionalNoReembolso({ status: 'pago' }, true)).toBe('incluir')
    expect(planoDoAdicionalNoReembolso({ status: 'entregue' }, true)).toBe('excluir')
    expect(planoDoAdicionalNoReembolso({ status: 'reembolsado' }, true)).toBe('excluir')
    expect(planoDoAdicionalNoReembolso({ status: 'reembolso_processando' }, true)).toBe('excluir')
    expect(planoDoAdicionalNoReembolso({ status: 'pago' }, false)).toBe('sem_adicional')
    expect(planoDoAdicionalNoReembolso({ status: 'pago', teste: true }, true)).toBe('sem_adicional')
  })

  it('valor explícito do integral sem o adicional (R$ 100 de aula + R$ 5 de resumo + taxa)', () => {
    // base 10500, taxa PIX 104 → pago 10604; parte da taxa do resumo = round(104 * 500 / 10500) = 5
    const taxaDoResumo = taxaProporcional(104, 500, 10500)
    expect(taxaDoResumo).toBe(5)
    expect(valorSemOAdicional({ pagoCentavos: 10604, jaDevolvidoAulaCentavos: 0, adicionalCentavos: 500 + taxaDoResumo })).toBe(10099)
    // Depois de um parcial de R$ 30 da aula, o integral devolve o resto menos o adicional.
    expect(valorSemOAdicional({ pagoCentavos: 10604, jaDevolvidoAulaCentavos: 3000, adicionalCentavos: 505 })).toBe(7099)
    expect(valorSemOAdicional({ pagoCentavos: 500, jaDevolvidoAulaCentavos: 0, adicionalCentavos: 505 })).toBe(0)
  })

  it('taxa proporcional nunca passa da taxa inteira nem divide por zero', () => {
    expect(taxaProporcional(0, 500, 10500)).toBe(0)
    expect(taxaProporcional(100, 500, 0)).toBe(0)
    expect(taxaProporcional(100, 99999, 100)).toBe(100)
  })
})

describe('cobertura e linha do tempo', () => {
  const inicio = new Date('2026-11-10T13:00:00Z')
  const fim = new Date('2026-11-10T14:00:00Z')
  const min = 60_000

  it('as marcas de pausa devolvem cada fala ao minuto real', () => {
    const marcas: Array<[number, number]> = [[0, 0], [5000, 20000], [9000, 60000]]
    expect(tempoReal(marcas, 3000)).toBe(3000)
    expect(tempoReal(marcas, 6000)).toBe(21000)
    expect(tempoReal(marcas, 9500)).toBe(60500)
  })

  it('cobertura = união dos trechos transcritos de todas as vozes (falhou não conta)', () => {
    const segs = [
      { inicio, duracaoRealMs: 20 * min, status: 'transcrito' as const },
      { inicio: new Date(inicio.getTime() + 10 * min), duracaoRealMs: 20 * min, status: 'transcrito' as const },
      { inicio: new Date(inicio.getTime() + 40 * min), duracaoRealMs: 10 * min, status: 'falhou' as const },
    ]
    expect(coberturaDaAula(segs, inicio, fim)).toEqual({ aulaMs: 60 * min, gravadoMs: 30 * min, pct: 50 })
  })

  it('lacunas de 5 min ou mais viram aviso no prompt', () => {
    const segs = [
      { inicio, duracaoRealMs: 20 * min, status: 'transcrito' as const },
      { inicio: new Date(inicio.getTime() + 30 * min), duracaoRealMs: 30 * min, status: 'transcrito' as const },
    ]
    expect(lacunasDaAula(segs, inicio, fim)).toEqual([[20 * min, 30 * min]])
  })

  it('a fala é atribuída pelo trecho de onde veio, em ordem real', () => {
    const linhas = linhaDoTempo(
      [
        { inicio, marcas: [[0, 0]], papel: 'monitor', nome: 'Carla', status: 'transcrito', frases: [{ t: 0, texto: 'Vamos à ICC.' }, { t: 120_000, texto: 'Pense na pré-carga.' }] },
        { inicio: new Date(inicio.getTime() + 60_000), marcas: [[0, 0]], papel: 'aluno', nome: 'Bruno', status: 'transcrito', frases: [{ t: 0, texto: 'E a FE?', incerto: true }] },
        { inicio, marcas: [[0, 0]], papel: 'aluno', nome: 'X', status: 'falhou', frases: [{ t: 0, texto: 'não entra' }] },
      ],
      inicio,
    )
    expect(linhas.map((l) => `${l.papel}:${l.texto}`)).toEqual(['monitor:Vamos à ICC.', 'aluno:E a FE?', 'monitor:Pense na pré-carga.'])
    const texto = transcricaoParaPrompt(linhas, [[30 * min, 40 * min]])
    expect(texto).toContain('[01:00] ALUNO (Bruno): E a FE? [trecho incerto]')
    expect(texto).toContain('[LACUNA: sem áudio gravado neste intervalo]')
  })

  it('transcrição curta é uma janela; longa é dividida em janelas sobrepostas', () => {
    const curta = [{ t: 0, papel: 'monitor' as const, nome: 'C', texto: 'oi', incerto: false }]
    expect(janelasDaTranscricao(curta, { limiteTokens: 150_000, janelaMin: 40, sobreposicaoMin: 3 })).toHaveLength(1)
    const longa = Array.from({ length: 300 }, (_, i) => ({ t: i * 30_000, papel: 'monitor' as const, nome: 'C', texto: 'x'.repeat(4000), incerto: false }))
    const janelas = janelasDaTranscricao(longa, { limiteTokens: 150_000, janelaMin: 40, sobreposicaoMin: 3 })
    expect(janelas).toHaveLength(4)
    // A segunda janela começa 3 min antes dos 40 min (sobreposição).
    expect(janelas[1][0].t).toBe(37 * 60_000)
  })
})

describe('validação do que o Gemini devolve', () => {
  it('transcrição: converte para ms, apara e corta o que passa do áudio', () => {
    const f = validarTranscricao({ frases: [{ inicio_s: 1.5, texto: ' oi ', incerto: false }, { inicio_s: 999, texto: 'fora' }] }, 10_000)
    expect(f).toEqual([{ t: 1500, texto: 'oi' }])
    expect(validarTranscricao({ frases: 'x' }, 10_000)).toBeNull()
  })

  const minimo = {
    titulo: 'ICC',
    sintese: 'Síntese.',
    topicos: [{ titulo: 'Fisiopatologia', explicacao: 'Texto.', conceitos: [], mecanismos: [], raciocinioDoMonitor: '' }],
    duvidas: [{ pergunta: 'P?', resposta: 'R.', quemPerguntou: 'qualquer' }],
    comparacoes: [],
    pontosDeAtencao: [],
    revisaoRapida: [],
    questoes: [
      { enunciado: 'Q1', alternativas: ['a', 'b', 'c', 'd'], correta: 1, comentario: 'c1' },
      { enunciado: 'Q2', alternativas: ['a', 'b', 'c', 'd'], correta: 7, comentario: 'c2' },
    ],
    lacunas: [],
    aVerificar: [],
  }

  it('resumo válido passa; gabarito fora das alternativas é descartado; quem perguntou inválido vira "incerto"', () => {
    const r = validarResumo(minimo)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.resumo.questoes).toHaveLength(1)
    expect(r.resumo.duvidas[0].quemPerguntou).toBe('incerto')
  })

  it('resumo sem tópicos não passa (vai para o reparo)', () => {
    const r = validarResumo({ ...minimo, topicos: [] })
    expect(r.ok).toBe(false)
  })

  it('lerJson tolera cercas de código e recusa lixo', () => {
    expect(lerJson('```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(lerJson('nada aqui')).toBeNull()
  })
})

describe('cifra das chaves de IA', () => {
  const antes = { ...process.env }
  afterEach(() => {
    process.env = { ...antes }
  })

  it('sem segredo grava como veio (comportamento antigo) e lê texto puro', () => {
    delete process.env.CONFIG_SECRET
    delete process.env.MONITORIAS_PIX_SECRET
    expect(cifrarSegredoDeConfig('AIzaSyTESTE123456')).toBe('AIzaSyTESTE123456')
    expect(decifrarSegredoDeConfig('AIzaSyTESTE123456')).toBe('AIzaSyTESTE123456')
  })

  it('com CONFIG_SECRET cifra (enc:v1:), decifra, e byte mexido vira "sem chave"', () => {
    process.env.CONFIG_SECRET = randomBytes(32).toString('base64')
    const g = cifrarSegredoDeConfig('AIzaSyTESTE123456')
    expect(g.startsWith('enc:v1:')).toBe(true)
    expect(g).not.toContain('AIzaSy')
    expect(decifrarSegredoDeConfig(g)).toBe('AIzaSyTESTE123456')
    expect(cifrarSegredoDeConfig(g)).toBe(g)
    const mexido = g.slice(0, -2) + (g.endsWith('A') ? 'BB' : 'AA')
    expect(decifrarSegredoDeConfig(mexido)).toBe('')
  })

  it('o painel recebe só a máscara, e o PUT com a máscara mantém a chave', () => {
    process.env.CONFIG_SECRET = randomBytes(32).toString('base64')
    const g = cifrarSegredoDeConfig('AIzaSyTESTE1a2b')
    const m = mascararSegredo(g)
    expect(m).toBe('••••1a2b')
    expect(ehMascara(m)).toBe(true)
    expect(proximoSegredo(m, g)).toBe(g)
    expect(proximoSegredo(undefined, g)).toBe(g)
    expect(proximoSegredo('', g)).toBe('')
    expect(decifrarSegredoDeConfig(proximoSegredo('AIzaNOVA9999', g))).toBe('AIzaNOVA9999')
    expect(mascararSegredo('')).toBe('')
    // Chave antiga em texto puro: o próximo salvar (mesmo sem mexer no campo) já grava cifrada.
    const migrada = proximoSegredo('••••1a2b', 'AIzaSyANTIGA1a2b')
    expect(migrada.startsWith('enc:v1:')).toBe(true)
    expect(decifrarSegredoDeConfig(migrada)).toBe('AIzaSyANTIGA1a2b')
  })
})

describe('pedido ao Gemini ajustado ao modelo', () => {
  it('3.x: tira a amostragem, usa thinkingLevel e dá folga ao teto de saída', () => {
    const c = configDeGeracao('gemini-3.8-flash', { temperature: 0.3, topK: 40, topP: 0.95, maxOutputTokens: 1024 })
    expect(c).toEqual({ maxOutputTokens: 8192, thinkingConfig: { thinkingLevel: 'low' } })
    expect((configDeGeracao('gemini-3.8-flash', {}, 'medio').thinkingConfig as any).thinkingLevel).toBe('medium')
  })

  it('2.5: mantém a amostragem e usa thinkingBudget (0 desliga)', () => {
    const c = configDeGeracao('gemini-2.5-flash', { temperature: 0.3, maxOutputTokens: 1024 })
    expect(c).toEqual({ temperature: 0.3, maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 } })
  })

  it('quem já mandou thinkingConfig manda nele', () => {
    expect(configDeGeracao('gemini-3.8-flash', { thinkingConfig: undefined, temperature: 0 })).toEqual({ thinkingConfig: undefined, temperature: 0 })
  })

  it('modelos desligados pelo Google ficam de fora', () => {
    expect(modeloDesligado('gemini-2.0-flash')).toBe(true)
    expect(modeloDesligado('gemini-1.5-flash')).toBe(true)
    expect(modeloDesligado('gemini-2.5-flash')).toBe(false)
    expect(modeloDesligado('gemini-3.8-flash')).toBe(false)
  })

  it('texto da Interactions API = só a saída do modelo depois da última entrada', () => {
    const texto = textoDaInteracao({
      steps: [
        { type: 'model_output', content: [{ type: 'text', text: 'antigo' }] },
        { type: 'user_input', content: [{ type: 'text', text: 'pergunta' }] },
        { type: 'thought' } as any,
        { type: 'model_output', content: [{ type: 'text', text: '{"a":' }, { type: 'text', text: '1}' }] },
      ] as any,
    })
    expect(texto).toBe('{"a":1}')
  })
})

describe('contadores públicos na exclusão de aula', () => {
  it('desconta o que a reserva somou (marca nova ou regra das antigas)', () => {
    expect(contadoresDaReserva({ status: 'concluida', contouNaVitrine: true, teveAprovacao: true })).toEqual({ reservas: true, aulasDadas: true })
    expect(contadoresDaReserva({ status: 'cancelada_suporte', teveAprovacao: true })).toEqual({ reservas: true, aulasDadas: false })
    expect(contadoresDaReserva({ status: 'expirada', teveAprovacao: true })).toEqual({ reservas: false, aulasDadas: false })
    expect(contadoresDaReserva({ status: 'confirmada', contouNaVitrine: false, teveAprovacao: true })).toEqual({ reservas: false, aulasDadas: false })
  })
})

describe('GET /api/admin/settings não vaza chaves de IA', () => {
  beforeEach(() => {
    landing.doc = { landingPageEnabled: true, aiKeys: { generalExams: 'AIzaSySEGREDO1234', personalExams: '', flashcards: '' }, iaModelos: { principal: 'gemini-3.8-flash' } }
  })

  it('visitante não recebe aiKeys nem iaModelos', async () => {
    sessao.atual = null
    const { GET } = await import('@/app/api/admin/settings/route')
    const r = await GET(new NextRequest('http://localhost/api/admin/settings'))
    const corpo = await r.json()
    expect(corpo.aiKeys).toBeUndefined()
    expect(corpo.iaModelos).toBeUndefined()
    expect(JSON.stringify(corpo)).not.toContain('SEGREDO')
    expect(corpo.landingPageEnabled).toBe(true)
  })

  it('admin recebe a chave mascarada (nunca inteira)', async () => {
    sessao.atual = { role: 'admin', userId: 'a1' }
    const { GET } = await import('@/app/api/admin/settings/route')
    const r = await GET(new NextRequest('http://localhost/api/admin/settings'))
    const corpo = await r.json()
    expect(corpo.aiKeys.generalExams).toBe('••••1234')
    expect(corpo.aiKeys.personalExams).toBe('')
    expect(JSON.stringify(corpo)).not.toContain('SEGREDO')
    expect(corpo.iaModelos.principal).toBe('gemini-3.8-flash')
  })
})
