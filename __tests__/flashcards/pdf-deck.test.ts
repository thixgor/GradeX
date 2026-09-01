import { readFileSync } from 'node:fs'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsPDF } from 'jspdf'

import { generateFlashcardManualPdf } from '@/lib/flashcard-manual-pdf'

/**
 * O PDF do deck é a operação mais cara do app em CPU, e o arquivo que ela
 * produz é entregue por uma função com teto de resposta. Os dois motivos pelos
 * quais ele engordava e demorava estão cobertos aqui: a figura embutida em
 * tamanho original e a mesma figura sendo decodificada uma vez por card.
 */

// PNG real: precisa decodificar de verdade para o jsPDF medir e embutir.
const PNG = readFileSync('public/img/badges/mercado-pago.png')

const USER = { id: 'u1', name: 'Aluno Teste', email: 'aluno@exemplo.com' }
const DECK = { _id: 'd1', title: 'Coração', slug: 'coracao' } as any

function cards(quantidade: number, imagem?: string) {
  return Array.from({ length: quantidade }, (_, i) => ({
    _id: String(i),
    deckId: 'd1',
    index: i,
    kind: 'basic',
    front: { text: `Pergunta ${i}`, image: imagem },
    back: { text: `Resposta ${i}` },
  })) as any
}

function stubFetch(responder: (url: string) => Response) {
  const spy = vi.fn(async (url: string) => responder(String(url)))
  vi.stubGlobal('fetch', spy)
  return spy
}

function imagemOk() {
  return new Response(new Uint8Array(PNG).buffer as ArrayBuffer, {
    status: 200,
    headers: { 'content-type': 'image/png' },
  })
}

describe('generateFlashcardManualPdf', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('embute a versão redimensionada da figura, não o arquivo original', async () => {
    const fetchSpy = stubFetch(() => imagemOk())

    await generateFlashcardManualPdf(DECK, cards(2, '/midia/aa/figura.png'), USER, 'https://exemplo')

    const [primeira] = fetchSpy.mock.calls.map(call => String(call[0]))
    expect(primeira).toContain('/_next/image')
    expect(primeira).toContain('w=1080')
    // O original não chega a ser buscado quando o otimizador responde.
    expect(fetchSpy.mock.calls).toHaveLength(1)
  })

  it('cai no arquivo original quando o otimizador recusa a imagem', async () => {
    // Host fora de `remotePatterns`, por exemplo: o otimizador devolve 400.
    const fetchSpy = stubFetch(url =>
      url.includes('/_next/image') ? new Response(null, { status: 400 }) : imagemOk()
    )

    await generateFlashcardManualPdf(DECK, cards(2, 'https://outro.site/figura.png'), USER, 'https://exemplo')

    const urls = fetchSpy.mock.calls.map(call => String(call[0]))
    expect(urls).toHaveLength(2)
    expect(urls[1]).toBe('https://outro.site/figura.png')
  })

  it('mede a figura uma vez por imagem, e não uma vez por card', async () => {
    stubFetch(() => imagemOk())
    // O jsPDF copia os métodos de `jsPDF.API` para cada instância no
    // construtor, então o espião precisa estar no lugar antes da geração.
    const medir = vi.spyOn(jsPDF.API as any, 'getImageProperties')

    await generateFlashcardManualPdf(DECK, cards(30, '/midia/aa/figura.png'), USER, 'https://exemplo')

    // Uma única imagem distinta em 30 cards: decodificar por ocorrência
    // custava mais do que montar todo o resto do documento.
    expect(medir).toHaveBeenCalledTimes(1)
  })

  it('não interrompe a geração quando a figura não pode ser buscada', async () => {
    stubFetch(() => new Response(null, { status: 404 }))

    const pdf = await generateFlashcardManualPdf(DECK, cards(3, '/midia/aa/sumiu.png'), USER, 'https://exemplo')

    expect(pdf.byteLength).toBeGreaterThan(0)
    expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe('%PDF')
  })
})
