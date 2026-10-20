import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'
import { mongoDeMentira } from '../ajudantes/mongo-de-mentira'

/**
 * O fluxo inteiro do envio com a análise automática, de ponta a ponta na rota.
 * A análise roda depois da resposta (no `waitUntil`, aqui capturado): o envio
 * responde "analisando" e o parecer chega em seguida.
 *
 * - IA aprova → desconto liberado na hora, e-mail de aprovado para a pessoa e
 *   aviso informativo para o admin;
 * - IA reprova → continua na fila com o motivo, e-mail de "revisão manual"
 *   para a pessoa e de "precisa da sua decisão" para o admin — que pode
 *   aprovar mesmo assim;
 * - IA falha ou está desligada → exatamente o fluxo de antes.
 *
 * O Gemini e o Blob são dublês de `fetch`; o banco é o Mongo de mentira.
 */

const USER = '507f1f77bcf86cd799439011'
const ADMIN = '507f1f77bcf86cd799439099'
const ITEM = 'material-1'
const BLOB_URL = `https://blob.example.com/prouni-comprovantes/${USER}/termo.pdf`

let banco: ReturnType<typeof criarBanco>
let sessao: any

function criarBanco(extras: Record<string, any[]> = {}) {
  const base = mongoDeMentira({
    prouni_benefits: [
      {
        itemType: 'material',
        itemId: ITEM,
        itemTitle: 'Manual de Cardiologia',
        discountType: 'percentage',
        discountValue: 40,
        stackWithTier: false,
        grantValidityDays: null,
        isActive: true,
      },
    ],
    prouni_requests: [],
    users: [],
    ...extras,
  })
  return {
    dados: base.dados,
    collection(nome: string) {
      const c = base.collection(nome)
      return {
        ...c,
        createIndex: async () => 'ok',
        // O de mentira devolve o `_id` do próprio documento; o driver gera um.
        insertOne: async (doc: any) => {
          if (!doc._id) doc._id = new ObjectId()
          return c.insertOne(doc)
        },
      }
    },
  }
}

/** O que a rota entregou ao `waitUntil` — o teste espera como a Vercel esperaria. */
const segundoPlano = vi.hoisted(() => ({ tarefas: [] as Promise<unknown>[] }))
vi.mock('@vercel/functions', () => ({ waitUntil: (p: Promise<unknown>) => segundoPlano.tarefas.push(p) }))

async function terminarSegundoPlano() {
  await Promise.all(segundoPlano.tarefas.splice(0))
}

const mail = vi.hoisted(() => ({
  aprovado: vi.fn(async () => {}),
  revisao: vi.fn(async () => {}),
  recebido: vi.fn(async () => {}),
  recusado: vi.fn(async () => {}),
  admin: vi.fn(async () => {}),
}))

vi.mock('@/lib/mongodb', () => ({ getDb: async () => banco }))
vi.mock('@/lib/auth', () => ({ getSession: async () => sessao }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true }) }))
vi.mock('@/lib/payments/audit', () => ({ audit: async () => {} }))
vi.mock('@/lib/prouni-catalogo', () => ({
  resolveProuniProduto: async () => ({ title: 'Manual de Cardiologia', href: '/materiais/material-1', isUnavailable: false }),
}))
vi.mock('@/lib/prouni-anexos', () => ({
  prouniBlobPrefix: (id: string) => `prouni-comprovantes/${id}/`,
  apagarAnexos: async (urls: string[]) => ({ apagados: urls.length }),
  verificarAnexos: async () => [
    {
      id: 'anexo-1',
      blobUrl: BLOB_URL,
      blobPathname: `prouni-comprovantes/${USER}/termo.pdf`,
      filename: 'termo.pdf',
      contentType: 'application/pdf',
      sizeBytes: 4,
      uploadedAt: new Date(),
    },
  ],
}))
vi.mock('@/lib/mail', () => ({
  deliverTransactionalEmails: async (tarefas: Promise<unknown>[]) => {
    await Promise.all(tarefas)
  },
  sendProuniRequestApprovedEmail: mail.aprovado,
  sendProuniRequestAiFlaggedEmail: mail.revisao,
  sendProuniRequestReceivedEmail: mail.recebido,
  sendProuniRequestRejectedEmail: mail.recusado,
  sendProuniRequestAdminAlert: mail.admin,
}))

import { POST } from '@/app/api/prouni/solicitacoes/route'
import { PATCH } from '@/app/api/admin/prouni/solicitacoes/[id]/route'
import { POST as REANALISAR } from '@/app/api/admin/prouni/solicitacoes/[id]/reanalisar/route'
import { invalidarCacheDeServidor } from '@/lib/cache-de-servidor'
import { serializeProuniRequestForAdmin, serializeProuniRequestForUser } from '@/lib/prouni-fies'

function pedido() {
  return new NextRequest('http://localhost/api/prouni/solicitacoes', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
    body: JSON.stringify({
      itemType: 'material',
      itemId: ITEM,
      program: 'prouni',
      fullName: 'Maria Souza Lima',
      cpf: '529.982.247-25',
      email: 'maria@example.com',
      phone: '(21) 99999-9999',
      dateOfBirth: '2001-05-10',
      institution: 'Afya Itabuna',
      courseName: 'Medicina',
      acceptProgramTerms: true,
      acceptPlatformTerms: true,
      attachments: [{ url: BLOB_URL, pathname: `prouni-comprovantes/${USER}/termo.pdf`, filename: 'termo.pdf' }],
    }),
  })
}

/** Dublê do `fetch`: o Blob devolve um PDF de 4 bytes; o Gemini, o parecer pedido. */
function geminiResponde(resposta: unknown | 'erro') {
  const chamada = vi.fn(async (url: string) => {
    if (url.startsWith('https://blob.example.com')) {
      const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
      return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer } as unknown as Response
    }
    if (resposta === 'erro') {
      return { ok: false, status: 500, json: async () => ({ error: { message: 'internal' } }) } as unknown as Response
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(resposta) }] } }] }),
    } as unknown as Response
  })
  vi.stubGlobal('fetch', chamada)
  return chamada
}

const chamadasAoGemini = (chamada: ReturnType<typeof vi.fn>) =>
  chamada.mock.calls.filter(([url]) => !String(url).startsWith('https://blob.example.com')).length

beforeEach(() => {
  banco = criarBanco()
  segundoPlano.tarefas.length = 0
  // O liga/desliga da IA fica 60 s em memória; cada teste começa do banco.
  invalidarCacheDeServidor('prouni:ia-ativa')
  sessao = { userId: USER, name: 'Maria', email: 'maria@conta.com', role: 'user' }
  process.env.GEMINI_API_KEY = 'chave-de-teste'
  Object.values(mail).forEach((m) => m.mockClear())
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete process.env.GEMINI_API_KEY
})

describe('envio com análise automática', () => {
  it('IA aprova: desconto liberado na hora e e-mails de aprovado', async () => {
    geminiResponde({ decisao: 'APROVAR', categoria: 'nenhuma', motivo: 'Termo do ProUni.', tipo_documento: 'Termo de concessão' })

    const res = await POST(pedido())
    const json = await res.json()
    expect(res.status).toBe(200)
    // A resposta não espera a IA: sai "analisando", e nenhum e-mail saiu ainda.
    expect(json.request.status).toBe('pending')
    expect(json.request.aiReview.outcome).toBe('processing')
    expect(mail.admin).not.toHaveBeenCalled()

    await terminarSegundoPlano()
    const [doc] = banco.dados.prouni_requests
    const visto = serializeProuniRequestForUser(doc)
    expect(visto.status).toBe('approved')
    expect(visto.autoApproved).toBe(true)
    expect(visto.grant?.discountLabel).toBe('40% OFF')

    expect(doc.status).toBe('approved')
    expect(doc.reviewedBy).toBe('ia')
    expect(doc.grant).toMatchObject({ discountType: 'percentage', discountValue: 40, usage: 'available', approvedBy: 'ia' })
    expect(doc.aiReview.outcome).toBe('approved')

    // A pessoa recebe nas duas caixas (conta e formulário) o e-mail de aprovado.
    expect(mail.aprovado).toHaveBeenCalledTimes(2)
    expect(mail.recebido).not.toHaveBeenCalled()
    expect(mail.revisao).not.toHaveBeenCalled()
    expect(mail.admin).toHaveBeenCalledWith(
      expect.objectContaining({ aiReview: expect.objectContaining({ outcome: 'approved', discountLabel: '40% OFF' }) })
    )
  })

  it('IA reprova: fica na fila com o motivo, avisa a pessoa e o admin — e o admin pode aprovar', async () => {
    geminiResponde({ decisao: 'REPROVAR', categoria: 'nada_a_ver', motivo: 'O arquivo enviado é uma foto sem relação com ProUni ou FIES.' })

    await POST(pedido())
    await terminarSegundoPlano()

    const [doc] = banco.dados.prouni_requests
    expect(serializeProuniRequestForUser(doc).aiReview?.reason).toContain('sem relação')
    expect(doc.status).toBe('pending')
    expect(doc.grant).toBeNull()
    expect(doc.aiReview).toMatchObject({ outcome: 'rejected' })

    expect(mail.revisao).toHaveBeenCalledWith(expect.objectContaining({ reason: expect.stringContaining('sem relação') }))
    expect(mail.aprovado).not.toHaveBeenCalled()
    expect(mail.admin).toHaveBeenCalledWith(
      expect.objectContaining({ aiReview: expect.objectContaining({ outcome: 'rejected' }) })
    )

    // O admin discorda da IA e aprova manualmente.
    sessao = { userId: ADMIN, name: 'Admin', email: 'adm@x.com', role: 'admin' }
    const decisao = await PATCH(
      new NextRequest(`http://localhost/api/admin/prouni/solicitacoes/${doc._id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      }),
      { params: { id: String(doc._id) } }
    )
    expect(decisao.status).toBe(200)
    expect(doc.status).toBe('approved')
    expect(doc.grant).toMatchObject({ discountValue: 40, approvedBy: ADMIN })
    expect(mail.aprovado).toHaveBeenCalled()
  })

  it('IA falha: fila manual como antes, com o e-mail de "recebemos"', async () => {
    geminiResponde('erro')

    const res = await POST(pedido())
    expect(res.status).toBe(200)
    await terminarSegundoPlano()

    const [doc] = banco.dados.prouni_requests
    expect(doc.status).toBe('pending')
    expect(doc.aiReview.outcome).toBe('failed')
    // A falha nunca apaga anexo nem desfaz a solicitação.
    expect(doc.attachments).toHaveLength(1)
    expect(mail.recebido).toHaveBeenCalledTimes(2)
    expect(mail.admin).toHaveBeenCalledWith(
      expect.objectContaining({ aiReview: expect.objectContaining({ outcome: 'failed' }) })
    )
  })

  it('IA desligada no painel: nem chama o Gemini', async () => {
    banco = criarBanco({ prouni_config: [{ _id: 'analise_ia', ativa: false }] })
    const chamada = geminiResponde({ decisao: 'APROVAR', motivo: 'ok' })

    const res = await POST(pedido())
    const json = await res.json()
    expect(json.request.status).toBe('pending')
    expect(json.request.aiReview).toBeNull()
    expect(segundoPlano.tarefas).toHaveLength(0)
    expect(chamadasAoGemini(chamada)).toBe(0)
    expect(banco.dados.prouni_requests[0].aiReview).toBeUndefined()
    expect(mail.recebido).toHaveBeenCalledTimes(2)
    expect(mail.admin).toHaveBeenCalledTimes(1)
    expect((mail.admin.mock.calls[0] as any[])[0].aiReview).toBeUndefined()
  })

  it('admin reanalisa uma que falhou: a IA aprova e a pessoa recebe o aprovado', async () => {
    geminiResponde('erro')
    await POST(pedido())
    await terminarSegundoPlano()
    const [doc] = banco.dados.prouni_requests
    expect(doc.aiReview.outcome).toBe('failed')

    Object.values(mail).forEach((m) => m.mockClear())
    geminiResponde({ decisao: 'APROVAR', motivo: 'Contrato do FIES.' })
    sessao = { userId: ADMIN, name: 'Admin', email: 'adm@x.com', role: 'admin' }
    const res = await REANALISAR(new NextRequest('http://localhost/x', { method: 'POST' }), { params: { id: String(doc._id) } })
    expect(res.status).toBe(202)
    expect((await res.json()).request.aiReview.outcome).toBe('processing')

    // Um segundo clique com a análise em andamento não dispara outra.
    const repetido = await REANALISAR(new NextRequest('http://localhost/x', { method: 'POST' }), { params: { id: String(doc._id) } })
    expect(repetido.status).toBe(409)

    await terminarSegundoPlano()
    expect(doc.status).toBe('approved')
    expect(doc.grant).toMatchObject({ approvedBy: 'ia', discountValue: 40 })
    expect(mail.aprovado).toHaveBeenCalledTimes(2)
    // O admin pediu e está vendo a tela: sem alerta de fila.
    expect(mail.admin).not.toHaveBeenCalled()
  })

  it('"analisando" que passou do prazo aparece como falha e pode ser reanalisado', () => {
    const velho = {
      _id: new ObjectId(),
      status: 'pending',
      applicant: {},
      attachments: [],
      aiReview: { outcome: 'processing', reviewedAt: new Date(Date.now() - 10 * 60_000) },
    } as any
    expect(serializeProuniRequestForAdmin(velho).aiReview?.outcome).toBe('failed')
    expect(serializeProuniRequestForUser(velho).aiReview).toBeNull()

    const recente = { ...velho, aiReview: { outcome: 'processing', reviewedAt: new Date() } }
    expect(serializeProuniRequestForAdmin(recente).aiReview?.outcome).toBe('processing')
    expect(serializeProuniRequestForUser(recente).aiReview?.outcome).toBe('processing')
  })
})
