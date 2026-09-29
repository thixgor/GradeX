import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PDFDocument, StandardFonts } from 'pdf-lib'

const estado = vi.hoisted(() => ({ pdf: null as ArrayBuffer | null }))

// O PDF do material viria do Blob; aqui vem da memória. As derivadas de página
// também ficariam no Blob e são desligadas: todo pedido gera a página do zero.
vi.mock('@/lib/material-pdf-viewer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/material-pdf-viewer')>()),
  fetchMaterialPdfBytes: async () => estado.pdf!,
}))
vi.mock('@/lib/material-pdf-pages', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/material-pdf-pages')>()),
  buscarPaginaDerivada: async () => null,
  gravarPaginaDerivada: async () => {},
}))

const {
  cacheControlDaPagina,
  chaveDeLeitura,
  identidadeDoLeitor,
  responderPaginaMarcada,
  segundosAteVirarODia,
  tokenDeAuditoria,
  versaoDoPdf,
} = await import('@/lib/material-pdf-leitura')

/**
 * `/pdf-viewer/page` e `/pdf-viewer/thumb` entregam a página marcada por este
 * caminho. O que ele garante:
 *   - a página sai marcada com quem pediu, venha da leitura ou da miniatura,
 *     e com log;
 *   - o navegador só guarda a página quando a URL traz a chave de leitura
 *     certa para aquela pessoa, e até o fim do dia de Brasília;
 *   - duas pessoas nunca recebem a página uma da outra, nem quando o id delas
 *     termina igual.
 */

const MATERIAL = '64b7f1c2a9d4e5f60718293b'
const ANA = '64b7f1c2a9d4e5f600000001'
const BRUNO = '64b7f1c2a9d4e5f700000001' // mesmo final de 8 caracteres que ANA

const PDF_FILE = {
  blobUrl: 'https://blob.exemplo/material.pdf',
  sizeBytes: 12345,
  uploadedAt: new Date('2026-09-01T12:00:00Z'),
  pageCount: 5,
}

async function pdfDeTeste(paginas: number) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 1; i <= paginas; i += 1) {
    doc.addPage([300, 400 + i]).drawText(`PAGINA ${i}`, { x: 40, y: 200, size: 24, font })
  }
  const bytes = await doc.save({ useObjectStreams: false })
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

let logs: any[]

function acesso(pdfFile: any = PDF_FILE) {
  return {
    ok: true as const,
    db: {
      collection: () => ({
        insertOne: async (doc: any) => {
          logs.push(doc)
        },
        updateOne: async () => {},
      }),
    } as any,
    material: { title: 'Material de Teste', pdfFile },
    user: null,
    materialId: MATERIAL,
    isAdmin: false,
    hasAccess: true,
    accessLevel: 'full' as const,
    previewRanges: [],
    timedAccess: null,
    accessRecord: null,
  } as any
}

function sessao(userId: string, email: string) {
  return { userId, email, name: `Pessoa ${email}`, role: 'user' } as any
}

function pedido(pagina: number, c?: string) {
  const url = new URL(`http://localhost/api/materiais/${MATERIAL}/pdf-viewer/page`)
  url.searchParams.set('page', String(pagina))
  if (c !== undefined) url.searchParams.set('c', c)
  return new NextRequest(url, { headers: { 'user-agent': 'Navegador de Teste' } })
}

function chaveDe(userId: string, pdfFile: any = PDF_FILE) {
  return chaveDeLeitura(userId, MATERIAL, versaoDoPdf(pdfFile))
}

async function responder(opcoes: {
  userId: string
  email: string
  pagina?: number
  c?: string
  origem?: 'leitura' | 'miniatura'
}) {
  const pagina = opcoes.pagina ?? 2
  return responderPaginaMarcada({
    request: pedido(pagina, opcoes.c),
    session: sessao(opcoes.userId, opcoes.email),
    access: acesso(),
    ip: '203.0.113.7',
    pagina,
    origem: opcoes.origem ?? 'leitura',
  })
}

async function palavrasChave(resposta: Response) {
  const doc = await PDFDocument.load(new Uint8Array(await resposta.arrayBuffer()))
  expect(doc.getPageCount()).toBe(1)
  return doc.getKeywords() || ''
}

beforeEach(async () => {
  logs = []
  estado.pdf = await pdfDeTeste(5)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('responderPaginaMarcada', () => {
  it('entrega a página marcada com a identidade de quem pediu', async () => {
    const resposta = await responder({ userId: ANA, email: 'ana@exemplo.com' })
    expect(resposta.status).toBe(200)
    expect(resposta.headers.get('content-type')).toBe('application/pdf')
    expect(resposta.headers.get('x-domineaqui-page-count')).toBe('5')
    expect(await palavrasChave(resposta)).toContain(ANA)
  })

  it('a miniatura recebe a mesma página marcada, com log', async () => {
    const leitura = await responder({ userId: ANA, email: 'ana@exemplo.com', origem: 'leitura' })
    const miniatura = await responder({ userId: ANA, email: 'ana@exemplo.com', origem: 'miniatura' })

    expect(await palavrasChave(miniatura)).toContain(ANA)
    await palavrasChave(leitura)
    expect(logs.map((l) => l.origem)).toEqual(['leitura', 'miniatura'])
    expect(logs.every((l) => l.action === 'page_render' && l.userId === ANA)).toBe(true)
    // Mesmo token: são a mesma página, reaproveitável entre leitura e painel.
    expect(logs[0].auditToken).toBe(logs[1].auditToken)
  })

  it('com a chave certa, o navegador guarda a página até o fim do dia', async () => {
    const resposta = await responder({ userId: ANA, email: 'ana@exemplo.com', c: chaveDe(ANA) })
    const cache = resposta.headers.get('cache-control')!
    expect(cache).toMatch(/^private, max-age=\d+$/)
    const segundos = Number(cache.split('=')[1])
    expect(segundos).toBeGreaterThanOrEqual(60)
    expect(segundos).toBeLessThanOrEqual(86_400)
  })

  it.each([
    ['sem chave', undefined],
    ['com a chave de outra pessoa', 'de-outra-pessoa'],
    ['com chave vazia', ''],
  ])('%s, entrega sem deixar guardar', async (_nome, c) => {
    const valor = c === 'de-outra-pessoa' ? chaveDe(BRUNO) : c
    const resposta = await responder({ userId: ANA, email: 'ana@exemplo.com', c: valor })
    expect(resposta.status).toBe(200)
    expect(resposta.headers.get('cache-control')).toBe('private, no-store')
  })

  it('pessoas com o mesmo final de id não recebem a página uma da outra', async () => {
    // Com o cache de páginas renderizadas LIGADO: é ele que seria envenenado
    // se o token usasse só os 8 últimos caracteres do id.
    process.env.PDF_VIEWER_PAGE_CACHE_ENABLED = '1'
    try {
      const ana = await responder({ userId: ANA, email: 'ana@exemplo.com', pagina: 4 })
      const bruno = await responder({ userId: BRUNO, email: 'bruno@exemplo.com', pagina: 4 })
      expect(ANA.slice(-8)).toBe(BRUNO.slice(-8))
      expect(await palavrasChave(ana)).toContain(ANA)
      const deBruno = await palavrasChave(bruno)
      expect(deBruno).toContain(BRUNO)
      expect(deBruno).not.toContain(ANA)
    } finally {
      delete process.env.PDF_VIEWER_PAGE_CACHE_ENABLED
    }
  })
})

describe('chave de leitura e token', () => {
  it('a chave muda com a pessoa, o material e a versão do PDF', () => {
    const v1 = versaoDoPdf(PDF_FILE)
    const v2 = versaoDoPdf({ ...PDF_FILE, uploadedAt: new Date('2026-09-02T12:00:00Z') })
    expect(v1).not.toBe(v2)
    expect(chaveDeLeitura(ANA, MATERIAL, v1)).toBe(chaveDeLeitura(ANA, MATERIAL, v1))
    expect(chaveDeLeitura(ANA, MATERIAL, v1)).not.toBe(chaveDeLeitura(BRUNO, MATERIAL, v1))
    expect(chaveDeLeitura(ANA, MATERIAL, v1)).not.toBe(chaveDeLeitura(ANA, 'outro', v1))
    expect(chaveDeLeitura(ANA, MATERIAL, v1)).not.toBe(chaveDeLeitura(ANA, MATERIAL, v2))
    // Opaca: não expõe o id de quem lê.
    expect(chaveDeLeitura(ANA, MATERIAL, v1)).not.toContain(ANA.slice(-8))
  })

  it('o token leva o id completo, a página, o dia e a versão', () => {
    const token = tokenDeAuditoria({
      identidade: ANA,
      materialId: MATERIAL,
      pagina: 7,
      dia: '2026-09-29',
      versao: 'abcdef0123456789',
    })
    expect(token).toBe(`${ANA}-${MATERIAL.slice(-8)}-7-2026-09-29-abcdef01`)
  })

  it('visitante é identificado por IP e navegador', () => {
    const a = identidadeDoLeitor(null, '203.0.113.7', 'Navegador A')
    expect(a).toMatch(/^guest-/)
    expect(identidadeDoLeitor(null, '203.0.113.7', 'Navegador A')).toBe(a)
    expect(identidadeDoLeitor(null, '203.0.113.8', 'Navegador A')).not.toBe(a)
    expect(identidadeDoLeitor(sessao(ANA, 'ana@exemplo.com'), '203.0.113.7', 'Navegador A')).toBe(ANA)
  })
})

describe('validade no navegador', () => {
  it.each([
    ['meio-dia em Brasília', '2026-09-29T15:00:00Z', 12 * 3600],
    ['meia-noite em ponto', '2026-09-30T03:00:00Z', 86_400],
    ['30 s antes da meia-noite', '2026-09-30T02:59:30Z', 60],
  ])('%s', (_nome, instante, esperado) => {
    expect(segundosAteVirarODia(new Date(instante))).toBe(esperado)
  })

  it('só guarda quando pode', () => {
    const agora = new Date('2026-09-29T15:00:00Z')
    expect(cacheControlDaPagina(true, agora)).toBe('private, max-age=43200')
    expect(cacheControlDaPagina(false, agora)).toBe('private, no-store')
  })
})
