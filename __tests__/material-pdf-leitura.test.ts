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
  buscarPaginaEnxuta: async () => null,
  gravarDerivadasDaBruta: async () => undefined,
}))

const {
  cacheControlDaPagina,
  chaveDeLeitura,
  identidadeDoLeitor,
  janelaDeLeitura,
  responderPaginaMarcada,
  segundosAteFimDaJanela,
  tokenDeAuditoria,
  versaoDoPdf,
} = await import('@/lib/material-pdf-leitura')

/**
 * `/pdf-viewer/page` e `/pdf-viewer/thumb` entregam a página marcada por este
 * caminho. O que ele garante:
 *   - a página sai marcada com quem pediu, venha da leitura ou da miniatura,
 *     e com log;
 *   - o navegador só guarda a página quando a URL traz a chave de leitura
 *     certa para aquela pessoa, e até o fim da semana de Brasília (ou do
 *     acesso por tempo, se acabar antes);
 *   - a versão leve da miniatura só vai para quem a pede (`m=1`); o leitor
 *     antigo, que confunde miniatura e leitura na memória, recebe a página de
 *     leitura;
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

function pedido(pagina: number, c?: string, extra: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const url = new URL(`http://localhost/api/materiais/${MATERIAL}/pdf-viewer/page`)
  url.searchParams.set('page', String(pagina))
  if (c !== undefined) url.searchParams.set('c', c)
  for (const [nome, valor] of Object.entries(extra)) url.searchParams.set(nome, valor)
  return new NextRequest(url, { headers: { 'user-agent': 'Navegador de Teste', ...headers } })
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
  extra?: Record<string, string>
  headers?: Record<string, string>
  access?: any
}) {
  const pagina = opcoes.pagina ?? 2
  return responderPaginaMarcada({
    request: pedido(pagina, opcoes.c, opcoes.extra, opcoes.headers),
    session: sessao(opcoes.userId, opcoes.email),
    access: opcoes.access ?? acesso(),
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

  it('a miniatura sai marcada, com log e o mesmo token da leitura', async () => {
    const leitura = await responder({ userId: ANA, email: 'ana@exemplo.com', origem: 'leitura' })
    const miniatura = await responder({
      userId: ANA,
      email: 'ana@exemplo.com',
      origem: 'miniatura',
      extra: { m: '1' },
    })

    expect(await palavrasChave(miniatura)).toContain(ANA)
    await palavrasChave(leitura)
    expect(leitura.headers.get('x-domineaqui-variante')).toBe('leitura')
    expect(miniatura.headers.get('x-domineaqui-variante')).toBe('miniatura')
    expect(logs.map((l) => l.origem)).toEqual(['leitura', 'miniatura'])
    expect(logs.every((l) => l.action === 'page_render' && l.userId === ANA)).toBe(true)
    // Mesmo token: a mesma pessoa, a mesma página, a mesma janela.
    expect(logs[0].auditToken).toBe(logs[1].auditToken)
  })

  it('leitor antigo (sem m=1) recebe a página de leitura também na miniatura', async () => {
    const antiga = await responder({
      userId: ANA,
      email: 'ana@exemplo.com',
      origem: 'miniatura',
      c: chaveDe(ANA),
    })
    expect(antiga.headers.get('x-domineaqui-variante')).toBe('leitura')
    expect(antiga.headers.get('cache-control')).toMatch(/^private, max-age=\d+$/)

    const nova = await responder({
      userId: ANA,
      email: 'ana@exemplo.com',
      origem: 'miniatura',
      c: chaveDe(ANA),
      extra: { m: '1' },
    })
    expect(nova.headers.get('x-domineaqui-variante')).toBe('miniatura')
    expect(nova.headers.get('cache-control')).toMatch(/^private, max-age=\d+$/)
  })

  it('com a chave certa, o navegador guarda a página até o fim da semana', async () => {
    const resposta = await responder({ userId: ANA, email: 'ana@exemplo.com', c: chaveDe(ANA) })
    const cache = resposta.headers.get('cache-control')!
    expect(cache).toMatch(/^private, max-age=\d+$/)
    const segundos = Number(cache.split('=')[1])
    expect(segundos).toBeGreaterThanOrEqual(60)
    expect(segundos).toBeLessThanOrEqual(7 * 86_400)
  })

  it('acesso por tempo: o navegador não guarda a página além do fim do acesso', async () => {
    const fim = new Date(Date.now() + 2 * 3600 * 1000)
    const resposta = await responder({
      userId: ANA,
      email: 'ana@exemplo.com',
      c: chaveDe(ANA),
      access: { ...acesso(), timedAccess: { isTimed: true, expiresAt: fim.toISOString() } },
    })
    const segundos = Number(resposta.headers.get('cache-control')!.split('=')[1])
    expect(segundos).toBeLessThanOrEqual(2 * 3600)
    expect(segundos).toBeGreaterThan(2 * 3600 - 60)
  })

  it('comprime a página quando o navegador aceita e compensa', async () => {
    const resposta = await responder({
      userId: ANA,
      email: 'ana@exemplo.com',
      headers: { 'accept-encoding': 'gzip, deflate' },
    })
    expect(resposta.headers.get('content-encoding')).toBe('gzip')
    expect(resposta.headers.get('vary')).toBe('Accept-Encoding')
    const comprimido = Buffer.from(await resposta.arrayBuffer())
    expect(Number(resposta.headers.get('content-length'))).toBe(comprimido.byteLength)
    const { gunzipSync } = await import('node:zlib')
    const doc = await PDFDocument.load(gunzipSync(comprimido))
    expect(doc.getKeywords()).toContain(ANA)
  })

  it('sem Accept-Encoding, a página sai sem compressão', async () => {
    const resposta = await responder({ userId: ANA, email: 'ana@exemplo.com' })
    expect(resposta.headers.get('content-encoding')).toBeNull()
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
  afterEach(() => {
    delete process.env.PDF_VIEWER_JANELA
  })

  // 29/09/2026 é uma terça. A semana de Brasília vira na segunda 05/10 às
  // 00:00, que são 03:00 em UTC.
  it.each([
    ['terça ao meio-dia', '2026-09-29T15:00:00Z', 5 * 86_400 + 12 * 3600],
    ['domingo às 23h', '2026-10-05T02:00:00Z', 3600],
    ['segunda à meia-noite em ponto', '2026-10-05T03:00:00Z', 7 * 86_400],
    ['30 s antes de a semana virar', '2026-10-05T02:59:30Z', 60],
  ])('%s', (_nome, instante, esperado) => {
    expect(segundosAteFimDaJanela(new Date(instante))).toBe(esperado)
  })

  it('a janela é a mesma de segunda a domingo e muda na segunda', () => {
    const terca = janelaDeLeitura(new Date('2026-09-29T15:00:00Z'))
    const domingoTarde = janelaDeLeitura(new Date('2026-10-05T02:59:59Z'))
    const segunda = janelaDeLeitura(new Date('2026-10-05T03:00:00Z'))
    expect(terca.id).toBe(domingoTarde.id)
    expect(segunda.id).not.toBe(terca.id)
    expect(terca.fim.toISOString()).toBe('2026-10-05T03:00:00.000Z')
  })

  it('PDF_VIEWER_JANELA=dia volta à janela diária', () => {
    process.env.PDF_VIEWER_JANELA = 'dia'
    expect(segundosAteFimDaJanela(new Date('2026-09-29T15:00:00Z'))).toBe(12 * 3600)
    expect(janelaDeLeitura(new Date('2026-09-29T15:00:00Z')).id).toBe('2026-09-29')
  })

  it('o fim do acesso por tempo encurta a validade', () => {
    const agora = new Date('2026-09-29T15:00:00Z')
    expect(segundosAteFimDaJanela(agora, new Date('2026-09-29T16:00:00Z'))).toBe(3600)
    // Acesso que acaba depois da janela não muda nada.
    expect(segundosAteFimDaJanela(agora, new Date('2026-12-01T00:00:00Z'))).toBe(5 * 86_400 + 12 * 3600)
  })

  it('só guarda quando pode', () => {
    const agora = new Date('2026-09-29T15:00:00Z')
    expect(cacheControlDaPagina(true, agora)).toBe('private, max-age=475200')
    expect(cacheControlDaPagina(false, agora)).toBe('private, no-store')
  })
})
