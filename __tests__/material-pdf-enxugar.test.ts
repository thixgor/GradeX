import { describe, expect, it } from 'vitest'
import { inflateSync } from 'node:zlib'
import sharp from 'sharp'
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  decodePDFRawStream,
} from 'pdf-lib'

import {
  enxugarPaginaPdf,
  perfilDeLeitura,
  perfilDeMiniatura,
} from '@/lib/material-pdf-enxugar'

/**
 * O enxugamento mexe no que o aluno vê, então o que estes testes fixam é:
 *   1. a página continua com as figuras dela (nenhuma referência quebra);
 *   2. só sai o que a página não usa, e só encolhe o que passou do teto;
 *   3. o que não dá para tratar com segurança fica exatamente como veio.
 */

const A4: [number, number] = [595.28, 841.89]

/** JPEG com conteúdo de verdade (gradiente + texto), para comprimir como foto. */
async function jpeg(largura: number, altura: number, qualidade = 90, canais: 1 | 3 = 3) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}">
    <defs><linearGradient id="g"><stop offset="0" stop-color="#e8dcc8"/><stop offset="1" stop-color="#8a5a6a"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    ${Array.from({ length: 30 }, (_, i) => `<text x="40" y="${(i + 1) * (altura / 31)}" font-size="${altura / 45}" fill="#222">Linha ${i} do néfron e do glomérulo</text>`).join('')}
  </svg>`
  let imagem = sharp(Buffer.from(svg))
  if (canais === 1) imagem = imagem.toColourspace('b-w')
  return imagem.jpeg({ quality: qualidade }).toBuffer()
}

/** Bytes do PDF de uma página só, como `copyPages` entrega para a derivada. */
async function fatia(doc: PDFDocument, indice: number): Promise<Uint8Array> {
  const bytes = await doc.save({ useObjectStreams: false })
  const origem = await PDFDocument.load(bytes)
  const destino = await PDFDocument.create()
  const [pagina] = await destino.copyPages(origem, [indice])
  destino.addPage(pagina)
  return destino.save({ useObjectStreams: false })
}

/** As imagens da página: nome no recurso, largura, altura, filtro. */
async function imagensDe(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes)
  const recursos = doc.getPage(0).node.Resources()
  const xobjects = recursos?.lookupMaybe(PDFName.of('XObject'), PDFDict)
  const lista: Array<{ nome: string; largura: number; altura: number; filtro: string; stream: PDFRawStream }> = []
  if (!xobjects) return lista
  for (const [nome, valor] of xobjects.entries()) {
    const stream = doc.context.lookup(valor) as PDFRawStream
    if (stream.dict.get(PDFName.of('Subtype')) !== PDFName.of('Image')) continue
    lista.push({
      nome: nome.asString(),
      largura: (stream.dict.get(PDFName.of('Width')) as PDFNumber).asNumber(),
      altura: (stream.dict.get(PDFName.of('Height')) as PDFNumber).asNumber(),
      filtro: String(stream.dict.get(PDFName.of('Filter'))),
      stream,
    })
  }
  return lista
}

/** O texto do conteúdo da página, já descomprimido. */
async function conteudoDe(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes)
  const contents = doc.getPage(0).node.get(PDFName.of('Contents'))
  const alvo = contents instanceof PDFRef ? doc.context.lookup(contents) : contents
  const streams = alvo instanceof PDFArray ? alvo.asArray().map((r) => doc.context.lookup(r)) : [alvo]
  return streams
    .map((s) => Buffer.from(decodePDFRawStream(s as PDFRawStream).decode()).toString('latin1'))
    .join('\n')
}

describe('enxugarPaginaPdf', { timeout: 60_000 }, () => {
  it('tira da página as imagens das outras páginas quando o /Resources é compartilhado', async () => {
    const doc = await PDFDocument.create()
    const imagens = []
    for (let i = 0; i < 4; i += 1) imagens.push(await doc.embedJpg(await jpeg(400, 560, 80)))
    const paginas = imagens.map((imagem) => {
      const pagina = doc.addPage(A4)
      pagina.drawImage(imagem, { x: 0, y: 0, width: A4[0], height: A4[1] })
      return pagina
    })
    await doc.flush()
    // O que o jsPDF e vários exportadores fazem: um /Resources só, com tudo.
    const xobjectsDeTodas = doc.context.obj({}) as PDFDict
    for (const pagina of paginas) {
      const xo = pagina.node.Resources()!.lookup(PDFName.of('XObject'), PDFDict)
      for (const [nome, valor] of xo.entries()) xobjectsDeTodas.set(nome, valor)
    }
    const compartilhado = doc.context.register(doc.context.obj({ XObject: xobjectsDeTodas }))
    for (const pagina of paginas) pagina.node.set(PDFName.of('Resources'), compartilhado)

    const bruta = await fatia(doc, 2)
    expect(await imagensDe(bruta)).toHaveLength(4)

    const resultado = await enxugarPaginaPdf(bruta, perfilDeLeitura())
    const restantes = await imagensDe(resultado.bytes)
    expect(restantes).toHaveLength(1)
    // A que ficou é justamente a que o conteúdo chama.
    expect(await conteudoDe(resultado.bytes)).toContain(`${restantes[0].nome} Do`)
    expect(resultado.recursosPodados).toBe(3)
    expect(resultado.depois).toBeLessThan(resultado.antes / 2)
  })

  it('reduz a imagem que passa do teto de DPI e mantém a página desenhando a mesma figura', async () => {
    const doc = await PDFDocument.create()
    // 600 DPI numa A4: muito acima do que qualquer tela do leitor mostra.
    const imagem = await doc.embedJpg(await jpeg(4960, 7016, 90))
    doc.addPage(A4).drawImage(imagem, { x: 0, y: 0, width: A4[0], height: A4[1] })
    const bruta = await fatia(doc, 0)

    const resultado = await enxugarPaginaPdf(bruta, perfilDeLeitura())
    const [antes] = await imagensDe(bruta)
    const [depois] = await imagensDe(resultado.bytes)
    const teto = Math.ceil((A4[1] * 240) / 72)

    expect(resultado.imagensReduzidas).toBe(1)
    expect(depois.nome).toBe(antes.nome)
    expect(Math.max(depois.largura, depois.altura)).toBeLessThanOrEqual(teto)
    // Proporção preservada (sem esticar a figura).
    expect(depois.largura / depois.altura).toBeCloseTo(antes.largura / antes.altura, 2)
    expect(depois.filtro).toBe('/DCTDecode')
    expect(resultado.depois).toBeLessThan(resultado.antes * 0.6)
    // O JPEG regravado abre e tem o tamanho que o dicionário declara.
    const meta = await sharp(Buffer.from(depois.stream.contents)).metadata()
    expect([meta.width, meta.height]).toEqual([depois.largura, depois.altura])
  })

  it('cinza continua cinza', async () => {
    const doc = await PDFDocument.create()
    const imagem = await doc.embedJpg(await jpeg(4000, 5600, 90, 1))
    doc.addPage(A4).drawImage(imagem, { x: 0, y: 0, width: A4[0], height: A4[1] })
    const resultado = await enxugarPaginaPdf(await fatia(doc, 0), perfilDeLeitura())
    const [depois] = await imagensDe(resultado.bytes)
    expect(resultado.imagensReduzidas).toBe(1)
    expect((await sharp(Buffer.from(depois.stream.contents)).metadata()).channels).toBe(1)
  })

  it('imagem dentro do teto e já enxuta fica exatamente como veio', async () => {
    const doc = await PDFDocument.create()
    const original = await jpeg(1200, 1700, 70)
    const imagem = await doc.embedJpg(original)
    doc.addPage(A4).drawImage(imagem, { x: 0, y: 0, width: A4[0], height: A4[1] })
    const resultado = await enxugarPaginaPdf(await fatia(doc, 0), perfilDeLeitura())
    const [depois] = await imagensDe(resultado.bytes)
    expect(resultado.imagensReduzidas).toBe(0)
    expect(Buffer.from(depois.stream.contents).equals(original)).toBe(true)
  })

  it('imagem com máscara (transparência) não é tocada', async () => {
    const doc = await PDFDocument.create()
    const png = await sharp({
      create: { width: 3600, height: 5000, channels: 4, background: { r: 200, g: 40, b: 80, alpha: 0.5 } },
    })
      .png()
      .toBuffer()
    const imagem = await doc.embedPng(png)
    doc.addPage(A4).drawImage(imagem, { x: 0, y: 0, width: A4[0], height: A4[1] })
    const bruta = await fatia(doc, 0)
    const resultado = await enxugarPaginaPdf(bruta, perfilDeLeitura())
    const [antes] = await imagensDe(bruta)
    const [depois] = await imagensDe(resultado.bytes)
    expect(depois.stream.dict.has(PDFName.of('SMask'))).toBe(true)
    expect([depois.largura, depois.altura]).toEqual([antes.largura, antes.altura])
  })

  it('não poda o nome que um formulário sem /Resources próprio herda da página', async () => {
    const doc = await PDFDocument.create()
    const imagem = await doc.embedJpg(await jpeg(300, 400, 80))
    const pagina = doc.addPage(A4)
    await doc.flush()
    // Formulário SEM /Resources que desenha /ImHerdada: o nome só existe no
    // /Resources da página, e o conteúdo da página nunca o cita.
    const formulario = doc.context.register(
      doc.context.flateStream('q 100 0 0 100 0 0 cm /ImHerdada Do Q', {
        Type: 'XObject',
        Subtype: 'Form',
        BBox: [0, 0, 100, 100],
      })
    )
    const conteudo = doc.context.register(doc.context.flateStream('q /Fm0 Do Q'))
    pagina.node.set(PDFName.of('Contents'), conteudo)
    pagina.node.set(
      PDFName.of('Resources'),
      doc.context.obj({ XObject: { Fm0: formulario, ImHerdada: imagem.ref } })
    )

    const resultado = await enxugarPaginaPdf(await fatia(doc, 0), perfilDeLeitura())
    const final = await PDFDocument.load(resultado.bytes)
    const xo = final.getPage(0).node.Resources()!.lookup(PDFName.of('XObject'), PDFDict)
    expect(xo.has(PDFName.of('Fm0'))).toBe(true)
    expect(xo.has(PDFName.of('ImHerdada'))).toBe(true)
  })

  it('PDF que não abre volta como veio', async () => {
    const lixo = new TextEncoder().encode('%PDF-1.7\nisto não é um pdf de verdade')
    const resultado = await enxugarPaginaPdf(lixo, perfilDeLeitura())
    expect(resultado.bytes).toBe(lixo)
  })

  it('nunca devolve algo maior que o original', async () => {
    const doc = await PDFDocument.create()
    doc.addPage(A4).drawText('Só texto, nada para enxugar.', { x: 40, y: 400, size: 14 })
    const bruta = await fatia(doc, 0)
    const resultado = await enxugarPaginaPdf(bruta, perfilDeLeitura())
    expect(resultado.depois).toBeLessThanOrEqual(resultado.antes)
  })

  it('comprime conteúdo gravado sem filtro', async () => {
    const doc = await PDFDocument.create()
    const pagina = doc.addPage(A4)
    const texto = Array.from({ length: 300 }, (_, i) => `BT /F1 10 Tf 40 ${800 - i} Td (linha ${i}) Tj ET`).join('\n')
    pagina.node.set(PDFName.of('Contents'), doc.context.register(doc.context.stream(texto)))
    const bruta = await fatia(doc, 0)
    const resultado = await enxugarPaginaPdf(bruta, perfilDeLeitura())
    expect(resultado.depois).toBeLessThan(resultado.antes / 2)
    expect(await conteudoDe(resultado.bytes)).toBe(texto)
  })

  it('miniatura: imagens no tamanho do painel, inclusive as sem perda', async () => {
    const doc = await PDFDocument.create()
    const png = await sharp(await jpeg(2400, 3400, 90)).png().toBuffer()
    const imagem = await doc.embedPng(png)
    doc.addPage(A4).drawImage(imagem, { x: 0, y: 0, width: A4[0], height: A4[1] })
    const leitura = await enxugarPaginaPdf(await fatia(doc, 0), perfilDeLeitura())
    const miniatura = await enxugarPaginaPdf(leitura.bytes, perfilDeMiniatura())
    const [depois] = await imagensDe(miniatura.bytes)
    expect(Math.max(depois.largura, depois.altura)).toBeLessThanOrEqual(Math.ceil((A4[1] * 48) / 72))
    expect(depois.filtro).toBe('/DCTDecode')
    expect(miniatura.depois).toBeLessThan(80 * 1024)
  })

  it('leitura: imagem sem perda grande demais é reduzida e continua sem perda', async () => {
    const doc = await PDFDocument.create()
    const png = await sharp(await jpeg(4800, 6800, 90)).png().toBuffer()
    const imagem = await doc.embedPng(png)
    doc.addPage(A4).drawImage(imagem, { x: 0, y: 0, width: A4[0], height: A4[1] })
    const resultado = await enxugarPaginaPdf(await fatia(doc, 0), perfilDeLeitura())
    const [depois] = await imagensDe(resultado.bytes)
    expect(depois.filtro).toBe('/FlateDecode')
    expect(Math.max(depois.largura, depois.altura)).toBeLessThanOrEqual(Math.ceil((A4[1] * 240) / 72))
    // Os pixels batem com o tamanho declarado.
    expect(inflateSync(Buffer.from(depois.stream.contents)).byteLength).toBe(depois.largura * depois.altura * 3)
  })
})
