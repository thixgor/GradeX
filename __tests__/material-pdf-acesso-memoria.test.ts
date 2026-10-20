import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'

/**
 * A memória de acesso das rotas de página (`validateMaterialPdfAccessComMemoria`):
 * o leitor pede uma página por requisição, e a checagem de compra não precisa
 * ir ao banco a cada uma delas.
 */

const banco = vi.hoisted(() => ({
  consultas: 0,
  compra: null as Record<string, unknown> | null,
}))

const materialId = new ObjectId().toHexString()

vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (nome: string) => ({
      findOne: async () => {
        banco.consultas += 1
        if (nome === 'users') return { name: 'Ana', email: 'ana@x.com' }
        if (nome === 'materials') {
          return {
            _id: new ObjectId(materialId),
            title: 'Apostila',
            pricing: 'paid',
            pdfViewerEnabled: true,
            pdfFile: { blobUrl: 'https://blob/x.pdf' },
          }
        }
        if (nome === 'material_purchases') return banco.compra
        return null
      },
      find: () => ({
        project: () => ({
          toArray: async () => {
            banco.consultas += 1
            return []
          },
        }),
      }),
    }),
  }),
}))

const { validateMaterialPdfAccessComMemoria, _esquecerAcessosEmMemoria } = await import(
  '@/lib/material-pdf-viewer'
)

const opcoes = { requireViewerEnabled: true, requirePdf: true, allowPreview: true }
const ids: Record<string, string> = { a: new ObjectId().toHexString(), b: new ObjectId().toHexString() }
const sessao = (quem: 'a' | 'b') => ({ userId: ids[quem], email: `${quem}@x.com`, role: 'user' }) as any

beforeEach(() => {
  banco.consultas = 0
  banco.compra = { _id: new ObjectId(), status: 'completed' }
  _esquecerAcessosEmMemoria()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('memória de acesso do leitor de PDF', () => {
  it('a segunda página do mesmo material não volta ao banco', async () => {
    const primeira = await validateMaterialPdfAccessComMemoria(materialId, sessao('a'), opcoes)
    const depoisDaPrimeira = banco.consultas
    const segunda = await validateMaterialPdfAccessComMemoria(materialId, sessao('a'), opcoes)
    expect(primeira.ok && segunda.ok).toBe(true)
    expect(banco.consultas).toBe(depoisDaPrimeira)
  })

  it('outra pessoa não herda o acesso de ninguém', async () => {
    await validateMaterialPdfAccessComMemoria(materialId, sessao('a'), opcoes)
    banco.compra = null
    const outra = await validateMaterialPdfAccessComMemoria(materialId, sessao('b'), opcoes)
    expect(outra.ok).toBe(false)
  })

  it('acesso negado não fica guardado: quem acabou de comprar entra na hora', async () => {
    banco.compra = null
    expect((await validateMaterialPdfAccessComMemoria(materialId, sessao('a'), opcoes)).ok).toBe(false)
    banco.compra = { _id: new ObjectId(), status: 'completed' }
    expect((await validateMaterialPdfAccessComMemoria(materialId, sessao('a'), opcoes)).ok).toBe(true)
  })

  it('vence em um minuto', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'))
    await validateMaterialPdfAccessComMemoria(materialId, sessao('a'), opcoes)
    banco.compra = null
    vi.setSystemTime(new Date('2026-10-20T12:01:01Z'))
    expect((await validateMaterialPdfAccessComMemoria(materialId, sessao('a'), opcoes)).ok).toBe(false)
  })

  it('acesso por tempo nunca é guardado além do próprio fim', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'))
    banco.compra = {
      _id: new ObjectId(),
      status: 'completed',
      accessMode: 'timed',
      accessExpiresAt: new Date('2026-10-20T12:00:10Z'),
    }
    expect((await validateMaterialPdfAccessComMemoria(materialId, sessao('a'), opcoes)).ok).toBe(true)
    banco.compra = null
    vi.setSystemTime(new Date('2026-10-20T12:00:11Z'))
    expect((await validateMaterialPdfAccessComMemoria(materialId, sessao('a'), opcoes)).ok).toBe(false)
  })
})
