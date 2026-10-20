import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/mongodb', () => ({
  // Sem banco: as chaves do Gemini caem no ambiente.
  getDb: async () => {
    throw new Error('sem banco no teste')
  },
}))

import {
  analisarComprovantesComIA,
  interpretarResposta,
  montarInstrucoes,
  PROUNI_IA_MAX_BYTES,
} from '@/lib/prouni-analise-ia'
import { montarConcessao } from '@/lib/prouni-fies'

/**
 * O que estes testes protegem: a IA só ter poder de APROVAR.
 *
 * Qualquer coisa fora do caminho feliz — resposta torta, Google fora do ar,
 * arquivo grande, blob sumido — precisa virar `failed`, que deixa a
 * solicitação na fila manual. E a política tolerante precisa estar escrita no
 * pedido: é ela que faz a foto torta de um bolsista de verdade passar.
 */

const ENTRADA = {
  program: 'prouni' as const,
  applicant: { fullName: 'Maria Souza Lima', institution: 'Afya Itabuna', courseName: 'Medicina' },
  itemTitle: 'Manual de Cardiologia',
  attachments: [
    {
      blobUrl: 'https://blob.example.com/prouni-comprovantes/u1/termo.pdf',
      contentType: 'application/pdf',
      sizeBytes: 4,
      filename: 'termo.pdf',
    },
  ],
}

function respostaDoGemini(corpo: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(corpo) }] } }] }),
  } as unknown as Response
}

function blob(bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])) {
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as Response
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'chave-de-teste'
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete process.env.GEMINI_API_KEY
})

describe('interpretarResposta', () => {
  it('APROVAR vira aprovado, com as anotações para o admin', () => {
    const r = interpretarResposta(
      JSON.stringify({
        decisao: 'APROVAR',
        categoria: 'nenhuma',
        motivo: 'Termo de concessão do ProUni identificado.',
        observacoes_admin: 'Foto um pouco escura.',
        tipo_documento: 'Termo de concessão ProUni',
        nome_confere: 'sim',
        programa_identificado: 'prouni',
      })
    )
    expect(r.outcome).toBe('approved')
    expect(r.adminNotes).toBe('Foto um pouco escura.')
    expect(r.nameMatches).toBe('sim')
  })

  it('REPROVAR vira reprovado com o motivo para o aluno e a categoria para o admin', () => {
    const r = interpretarResposta(
      JSON.stringify({ decisao: 'REPROVAR', categoria: 'nada_a_ver', motivo: 'O arquivo é uma selfie.' })
    )
    expect(r.outcome).toBe('rejected')
    expect(r.reason).toBe('O arquivo é uma selfie.')
    expect(r.adminNotes).toContain('nada_a_ver')
  })

  it('reprovação sem motivo ganha um texto padrão (o e-mail nunca sai vazio)', () => {
    const r = interpretarResposta(JSON.stringify({ decisao: 'REPROVAR', categoria: 'ilegivel', motivo: '' }))
    expect(r.outcome).toBe('rejected')
    expect(r.reason).toBeTruthy()
  })

  it('aceita a decisão em minúsculas e JSON cercado de crases', () => {
    const r = interpretarResposta('```json\n{"decisao":"aprovar","motivo":"ok"}\n```')
    expect(r.outcome).toBe('approved')
  })

  it('resposta fora do formato é falha — fila manual, nunca recusa', () => {
    expect(interpretarResposta('não sei').outcome).toBe('failed')
    expect(interpretarResposta('{"decisao":"TALVEZ","motivo":"x"}').outcome).toBe('failed')
  })

  it('nome_confere inválido é descartado em vez de derrubar o parecer', () => {
    const r = interpretarResposta('{"decisao":"APROVAR","motivo":"ok","nome_confere":"talvez"}')
    expect(r.outcome).toBe('approved')
    expect(r.nameMatches).toBeUndefined()
  })
})

describe('montarInstrucoes', () => {
  it('leva a política tolerante e os dados do formulário', () => {
    const texto = montarInstrucoes(ENTRADA)
    expect(texto).toContain('NA DÚVIDA, APROVE')
    expect(texto).toContain('Maria Souza Lima')
    expect(texto).toContain('Afya Itabuna')
    // Os quatro únicos motivos de reprovação.
    for (const categoria of ['nada_a_ver', 'falsificacao', 'ilegivel', 'outra_pessoa']) {
      expect(texto).toContain(categoria)
    }
    // O documento é de terceiro: texto dentro dele não é instrução.
    expect(texto).toMatch(/nunca instrução/)
  })

  it('não leva CPF nem e-mail (minimização de dados)', () => {
    const texto = montarInstrucoes({ ...ENTRADA, applicant: { ...ENTRADA.applicant, cpf: '12345678909' } as any })
    expect(texto).not.toContain('12345678909')
  })
})

describe('analisarComprovantesComIA', () => {
  it('baixa o comprovante privado e manda inline para o modelo', async () => {
    const chamada = vi.fn(async (url: string) =>
      url.startsWith('https://blob.example.com') ? blob() : respostaDoGemini({ decisao: 'APROVAR', motivo: 'ok' })
    )
    process.env.BLOB_READ_WRITE_TOKEN = 'token-blob'
    vi.stubGlobal('fetch', chamada)

    const parecer = await analisarComprovantesComIA(ENTRADA)
    expect(parecer.outcome).toBe('approved')
    expect(parecer.model).toBe('gemini-3.8-flash')

    const [urlDoBlob, opcoesDoBlob] = chamada.mock.calls[0] as unknown as [string, RequestInit]
    expect(urlDoBlob).toBe(ENTRADA.attachments[0].blobUrl)
    expect((opcoesDoBlob.headers as Record<string, string>).Authorization).toBe('Bearer token-blob')

    const [, opcoes] = chamada.mock.calls[1] as unknown as [string, RequestInit]
    const corpo = JSON.parse(String(opcoes.body))
    expect(corpo.contents[0].parts[1].inline_data).toEqual({ mime_type: 'application/pdf', data: 'JVBERg==' })
    expect(corpo.generationConfig.responseMimeType).toBe('application/json')
    delete process.env.BLOB_READ_WRITE_TOKEN
  })

  it('Gemini fora do ar vira falha, sem lançar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.startsWith('https://blob.example.com')
          ? blob()
          : ({ ok: false, status: 503, json: async () => ({ error: { message: 'high demand' } }) } as unknown as Response)
      )
    )
    const parecer = await analisarComprovantesComIA(ENTRADA)
    expect(parecer.outcome).toBe('failed')
  })

  it('sem chave configurada vira falha', async () => {
    delete process.env.GEMINI_API_KEY
    vi.stubGlobal('fetch', vi.fn(async () => blob()))
    const parecer = await analisarComprovantesComIA(ENTRADA)
    expect(parecer.outcome).toBe('failed')
  })

  it('arquivos grandes demais nem são baixados', async () => {
    const chamada = vi.fn()
    vi.stubGlobal('fetch', chamada)
    const parecer = await analisarComprovantesComIA({
      ...ENTRADA,
      attachments: [{ ...ENTRADA.attachments[0], sizeBytes: PROUNI_IA_MAX_BYTES + 1 }],
    })
    expect(parecer.outcome).toBe('failed')
    expect(chamada).not.toHaveBeenCalled()
  })

  it('blob indisponível vira falha e o modelo não é chamado', async () => {
    const chamada = vi.fn(async () => ({ ok: false, status: 404 }) as unknown as Response)
    vi.stubGlobal('fetch', chamada)
    const parecer = await analisarComprovantesComIA(ENTRADA)
    expect(parecer.outcome).toBe('failed')
    expect(chamada).toHaveBeenCalledTimes(1)
  })
})

describe('montarConcessao', () => {
  const agora = new Date('2026-10-20T12:00:00Z')
  const oferta = { discountType: 'percentage' as const, discountValue: 40, stackWithTier: true, grantValidityDays: 30 }

  it('fotografa as condições da oferta', () => {
    const g = montarConcessao(oferta, { id: 'ia', nome: 'IA' }, agora)!
    expect(g.discountValue).toBe(40)
    expect(g.stackWithTier).toBe(true)
    expect(g.usage).toBe('available')
    expect(g.approvedBy).toBe('ia')
    expect(g.expiresAt?.toISOString()).toBe('2026-11-19T12:00:00.000Z')
  })

  it('os ajustes do admin vencem a oferta', () => {
    const g = montarConcessao(oferta, { id: 'adm', nome: 'Admin' }, agora, {
      discountType: 'fixed',
      discountValue: 25,
      stackWithTier: false,
      validityDays: null,
    })!
    expect(g.discountType).toBe('fixed')
    expect(g.discountValue).toBe(25)
    expect(g.stackWithTier).toBe(false)
    expect(g.expiresAt).toBeNull()
  })

  it('sem desconto definível não concede nada', () => {
    expect(montarConcessao(null, { id: 'ia', nome: 'IA' }, agora)).toBeNull()
    expect(montarConcessao({ ...oferta, discountValue: 0 }, { id: 'ia', nome: 'IA' }, agora)).toBeNull()
    expect(montarConcessao({ ...oferta, discountValue: 120 }, { id: 'ia', nome: 'IA' }, agora)).toBeNull()
  })
})
