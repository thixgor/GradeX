import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { expandirLinhas } from '@/lib/cronogramas/extracao'
import { lerCalendarios } from '@/lib/cronogramas/extrair-imagem'

/**
 * Teste da ponta que fala com o Gemini.
 *
 * O modelo não é chamado de verdade — o `fetch` é trocado por um dublê que
 * devolve a resposta no formato do Gemini. O que está sob teste é o encanamento
 * em volta: chave, queda de modelo, JSON malformado, um arquivo ilegível no
 * meio do lote, e a passagem da transcrição para a expansão em avaliações.
 *
 * A transcrição em si (ler pixels de uma tabela) é do modelo e só pode ser
 * verificada em execução real, com a chave do painel.
 */

const IMAGEM = {
  nome: 'n3-especifica.png',
  mime: 'image/png',
  // 1x1 PNG — o conteúdo não importa, o dublê nunca olha.
  base64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
}

/** O que o modelo devolve ao transcrever a tabela da N3 Específica. */
const TRANSCRICAO = {
  linhas: [
    {
      curso: 'Medicina',
      categoria: 'N3 Específica',
      data: '24/11',
      diaDaSemana: 'Terça-feira',
      turno: 'manhã',
      denominacao: 'Aluno Regular',
      horario: '10h – 11h20',
      horarioCasosEspeciais: '10h – 11h45',
      horarioOutrosFusos: 'Rondônia 09h–10h20; CZS–AC 08h–09h20',
      periodos: ['1º Período', '2º Período', '3º Período', '4º Período'],
      duracao: '1 hora e 20 minutos',
    },
    {
      curso: 'Medicina',
      categoria: 'N3 Específica',
      data: '24/11',
      diaDaSemana: 'Terça-feira',
      turno: 'tarde',
      denominacao: 'Aluno Regular',
      horario: '14h30 – 15h50',
      periodos: ['5º ao 8º Período'],
    },
  ],
}

function respostaDoGemini(corpo: unknown) {
  return {
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(corpo) }] } }],
    }),
  } as unknown as Response
}

function falhaDoGemini(status: number, mensagem: string) {
  return {
    ok: false,
    status,
    json: async () => ({ error: { message: mensagem } }),
  } as unknown as Response
}

vi.mock('@/lib/mongodb', () => ({
  // Sem banco no teste: a busca de chaves cai no ambiente, como em produção
  // quando o painel ainda não tem chave gravada.
  getDb: async () => {
    throw new Error('sem banco no teste')
  },
}))

vi.mock('@/lib/ai-keys', () => ({ getAllAIKeys: async () => ({}) }))

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'chave-de-teste'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete process.env.GEMINI_API_KEY
})

describe('leitura das imagens', () => {
  it('transcreve a tabela e a expansão vira a agenda das oito turmas', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaDoGemini(TRANSCRICAO)))

    const [leitura] = await lerCalendarios([IMAGEM])
    expect(leitura.erro).toBeUndefined()
    expect(leitura.linhas).toHaveLength(2)

    const propostas = expandirLinhas(leitura.linhas, {
      origem: leitura.nome,
      secaoPadrao: 'medicina',
      hoje: '2026-08-28',
      anoReferencia: 2026,
    })

    expect(propostas).toHaveLength(8)
    expect(propostas.map(p => p.periodo)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(propostas.find(p => p.periodo === 2)?.hora).toBe('10:00')
    expect(propostas.find(p => p.periodo === 6)?.hora).toBe('14:30')
    expect(propostas.every(p => p.data === '2026-11-24')).toBe(true)
  })

  it('manda a imagem e o pedido de JSON para o modelo', async () => {
    const chamada = vi.fn(async () => respostaDoGemini(TRANSCRICAO))
    vi.stubGlobal('fetch', chamada)

    await lerCalendarios([IMAGEM])

    const [url, opcoes] = chamada.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('gemini-3.6-flash')
    expect((opcoes.headers as Record<string, string>)['X-goog-api-key']).toBe('chave-de-teste')

    const corpo = JSON.parse(String(opcoes.body))
    expect(corpo.contents[0].parts[1].inline_data).toEqual({
      mime_type: 'image/png',
      data: IMAGEM.base64,
    })
    expect(corpo.generationConfig.responseMimeType).toBe('application/json')
    expect(corpo.generationConfig.temperature).toBe(0)
    // A regra do fuso precisa estar no pedido: sem ela o modelo escolhe sozinho
    // entre as três colunas de horário.
    expect(corpo.contents[0].parts[0].text).toContain('Brasília')
  })

  it('desliga o raciocínio só no 2.5, que é quem conhece o campo', async () => {
    const chamada = vi
      .fn()
      .mockResolvedValueOnce(falhaDoGemini(400, 'unsupported'))
      .mockResolvedValueOnce(respostaDoGemini(TRANSCRICAO))
    vi.stubGlobal('fetch', chamada)

    await lerCalendarios([IMAGEM])

    const primeira = JSON.parse(String((chamada.mock.calls[0] as any)[1].body))
    const segunda = JSON.parse(String((chamada.mock.calls[1] as any)[1].body))

    // O 3.6 não recebe `thinkingConfig`; o 2.5 recebe com orçamento zero,
    // porque o "pensar" antes de responder é o que estourava o tempo.
    expect(String((chamada.mock.calls[0] as any)[0])).toContain('gemini-3.6-flash')
    expect(primeira.generationConfig.thinkingConfig).toBeUndefined()
    expect(String((chamada.mock.calls[1] as any)[0])).toContain('gemini-2.5-flash')
    expect(segunda.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 })
  })

  it('insiste no mesmo modelo enquanto a sobrecarga for temporária', async () => {
    const chamada = vi
      .fn()
      // A mensagem que o Gemini devolve quando está congestionado — e que na
      // primeira vez derrubou a leitura logo na primeira tentativa.
      .mockResolvedValueOnce(falhaDoGemini(429, 'This model is currently experiencing high demand.'))
      .mockResolvedValueOnce(falhaDoGemini(500, 'high demand. Please try again later.'))
      .mockResolvedValueOnce(respostaDoGemini(TRANSCRICAO))
    vi.stubGlobal('fetch', chamada)

    const [leitura] = await lerCalendarios([IMAGEM])

    expect(leitura.linhas).toHaveLength(2)
    expect(chamada).toHaveBeenCalledTimes(3)
    for (const chamado of chamada.mock.calls) {
      expect(String((chamado as any)[0])).toContain('gemini-3.6-flash')
    }
    // As esperas são reais (1,5s + 4s), então este caso precisa de mais que o
    // limite padrão do vitest.
  }, 20_000)

  it('a escada de modelos é configurável por ambiente', async () => {
    vi.resetModules()
    process.env.GEMINI_MODELOS = 'modelo-a, modelo-b'

    const chamada = vi.fn(async () => falhaDoGemini(400, 'ruim'))
    vi.stubGlobal('fetch', chamada)

    // Reimporta com a variável no lugar: a lista é lida na carga do módulo.
    const { lerCalendarios: lerComOutraEscada } = await import('@/lib/cronogramas/extrair-imagem')
    await lerComOutraEscada([IMAGEM])

    const modelos = chamada.mock.calls.map(chamado => String((chamado as any)[0]))
    expect(modelos[0]).toContain('modelo-a')
    expect(modelos.some(url => url.includes('modelo-b'))).toBe(true)

    delete process.env.GEMINI_MODELOS
    vi.resetModules()
  })

  it('sem tempo para outra tentativa, devolve o erro real — não só "tempo esgotado"', async () => {
    const inicio = Date.now()
    let tentativas = 0

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        tentativas += 1
        return falhaDoGemini(429, 'quota exceeded')
      }),
    )
    // O relógio pula o orçamento inteiro depois da primeira tentativa.
    vi.spyOn(Date, 'now').mockImplementation(() =>
      tentativas === 0 ? inicio : inicio + 239_000,
    )

    const [leitura] = await lerCalendarios([IMAGEM])

    expect(tentativas).toBe(1)
    expect(leitura.erro).toContain('quota exceeded')
    expect(leitura.erro).toContain('tempo')
  })

  it('insiste uma vez quando a fila do Gemini está cheia (429)', async () => {
    const chamada = vi
      .fn()
      .mockResolvedValueOnce(falhaDoGemini(429, 'rate limit exceeded'))
      .mockResolvedValueOnce(respostaDoGemini(TRANSCRICAO))
    vi.stubGlobal('fetch', chamada)

    const [leitura] = await lerCalendarios([IMAGEM])

    // Segunda tentativa no MESMO modelo: cair para um pior por causa de fila
    // trocaria qualidade de transcrição por nada.
    expect(leitura.linhas).toHaveLength(2)
    expect(chamada).toHaveBeenCalledTimes(2)
    expect(String((chamada.mock.calls[1] as any)[0])).toContain('gemini-3.6-flash')
  })

  it('a falha traz o motivo de todos os modelos, não o do último', async () => {
    const chamada = vi
      .fn()
      .mockResolvedValueOnce(falhaDoGemini(400, 'imagem ilegível'))
      .mockResolvedValueOnce(falhaDoGemini(404, 'model not found'))
    vi.stubGlobal('fetch', chamada)

    const [leitura] = await lerCalendarios([IMAGEM])

    expect(leitura.erro).toContain('gemini-3.6-flash: imagem ilegível')
    expect(leitura.erro).toContain('gemini-2.5-flash: model not found')
  })

  it('não tenta mais os modelos aposentados', async () => {
    const chamada = vi.fn(async () => falhaDoGemini(400, 'ruim'))
    vi.stubGlobal('fetch', chamada)

    const [leitura] = await lerCalendarios([IMAGEM])

    // 1.5 sumiu do v1beta; 2.0 respondeu "no longer available". Manter
    // qualquer um dos dois na escada é gastar orçamento com falha certa.
    const modelos = chamada.mock.calls.map(chamado => String((chamado as any)[0]))
    expect(modelos.some(url => /1\.5|2\.0/.test(url))).toBe(false)
    expect(leitura.erro).not.toContain('1.5')
  })

  it('não começa tentativa que não caberia no orçamento', async () => {
    const inicio = Date.now()
    const chamada = vi.fn(async () => respostaDoGemini(TRANSCRICAO))
    vi.stubGlobal('fetch', chamada)

    // O relógio já gastou quase tudo antes da primeira tentativa: começar uma
    // leitura de 90s aqui era o que fazia a função morrer em 504.
    let leituras = 0
    vi.spyOn(Date, 'now').mockImplementation(() => {
      leituras += 1
      return leituras <= 1 ? inicio : inicio + 239_000
    })

    const [leitura] = await lerCalendarios([IMAGEM])

    expect(chamada).not.toHaveBeenCalled()
    expect(leitura.erro).toContain('demorou')
  })

  it('encurta o corte da tentativa ao tempo que ainda resta', async () => {
    const inicio = Date.now()
    let chamadas = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, opcoes: RequestInit) => {
        chamadas += 1
        // O sinal precisa existir: é ele que corta a chamada travada.
        expect(opcoes.signal).toBeTruthy()
        return respostaDoGemini(TRANSCRICAO)
      }),
    )
    vi.spyOn(Date, 'now').mockImplementation(() =>
      chamadas === 0 ? inicio : inicio + 200_000,
    )

    const [leitura] = await lerCalendarios([IMAGEM])
    expect(leitura.linhas).toHaveLength(2)
  })

  it('cai para o próximo modelo quando o primeiro recusa', async () => {
    const chamada = vi
      .fn()
      .mockResolvedValueOnce(falhaDoGemini(404, 'model not found'))
      .mockResolvedValueOnce(respostaDoGemini(TRANSCRICAO))
    vi.stubGlobal('fetch', chamada)

    const [leitura] = await lerCalendarios([IMAGEM])

    expect(leitura.linhas).toHaveLength(2)
    expect(chamada).toHaveBeenCalledTimes(2)
    expect(String((chamada.mock.calls[1] as any)[0])).toContain('gemini-2.5-flash')
  })

  it('um arquivo ilegível não derruba o resto do lote', async () => {
    const chamada = vi.fn(async (url: string, opcoes: RequestInit) =>
      String(opcoes.body).includes('rasurada')
        ? respostaDoGemini({ linhas: [] })
        : respostaDoGemini(TRANSCRICAO),
    )
    // A imagem "rasurada" é reconhecida pelo base64 que o dublê vê no corpo.
    vi.stubGlobal('fetch', chamada)

    const leituras = await lerCalendarios([
      IMAGEM,
      { nome: 'rasurada.png', mime: 'image/png', base64: 'rasurada' },
    ])

    expect(leituras).toHaveLength(2)
    expect(leituras[0].linhas).toHaveLength(2)
    expect(leituras[1].linhas).toHaveLength(0)
  })

  it('resposta cortada diz por que veio vazia', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ candidates: [{ finishReason: 'MAX_TOKENS', content: {} }] }),
      })) as unknown as typeof fetch,
    )

    const [leitura] = await lerCalendarios([IMAGEM])

    expect(leitura.erro).toContain('MAX_TOKENS')
  })

  it('resposta sem JSON válido vira erro do arquivo, não exceção', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'não é json' }] } }] }),
      })) as unknown as typeof fetch,
    )

    const [leitura] = await lerCalendarios([IMAGEM])

    expect(leitura.linhas).toEqual([])
    expect(leitura.erro).toBeTruthy()
  })

  it('sem chave configurada, avisa em vez de chamar o modelo', async () => {
    delete process.env.GEMINI_API_KEY
    const chamada = vi.fn()
    vi.stubGlobal('fetch', chamada)

    await expect(lerCalendarios([IMAGEM])).rejects.toThrow(/API Key do Gemini/)
    expect(chamada).not.toHaveBeenCalled()
  })
})
