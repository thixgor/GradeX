import { deflateSync, inflateSync } from 'node:zlib'
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFStream,
  decodePDFRawStream,
  type PDFObject,
  type PDFPage,
} from 'pdf-lib'

/**
 * Enxuga o PDF de UMA página antes de ele virar derivada no Blob.
 *
 * ## Por que isto existe
 *
 * Cada página que o leitor entrega sai da função e conta como Fast Origin
 * Transfer, que em São Paulo (gru1) custa US$ 0,41 por GB — quase seis vezes o
 * preço de servir o mesmo byte pelo Blob. A rota `/pdf-viewer/page` respondia
 * por ~69% desse tráfego, e quase tudo era o conteúdo da própria página: a
 * marca d'água já tinha sido reduzida a ~5 KB.
 *
 * A página derivada nasce de `copyPages`, que leva tudo o que a página
 * referencia. Três coisas engordavam esse arquivo sem que o aluno visse
 * diferença nenhuma:
 *
 * 1. **Recursos que a página não usa.** Muitos geradores (jsPDF, alguns
 *    scanners, exportadores de slide) põem um dicionário `/Resources` único,
 *    com TODAS as imagens e fontes do documento, e o penduram em cada página.
 *    O `copyPages` copia o dicionário inteiro: a página 7 chegava ao aluno
 *    levando as figuras das outras 200.
 * 2. **Imagens com mais pixels do que qualquer tela mostra.** Um escaneado a
 *    300–600 DPI tem detalhe que o leitor nunca chega a desenhar: o orçamento
 *    de canvas do celular é ~2–4 megapixels por página, e o do desktop fica
 *    perto de 6. Acima de ~240 DPI o byte a mais só viaja.
 * 3. **Streams sem compressão**, que alguns geradores gravam em texto puro.
 *
 * ## O que muda para o aluno
 *
 * Nada que se veja. A imagem só é reduzida até o teto de DPI medido pelo
 * tamanho da PÁGINA (uma figura nunca é reduzida abaixo do que a página
 * inteira pediria naquela resolução) e só é trocada quando a economia passa de
 * um mínimo — regravar um JPEG que já está enxuto pioraria a imagem à toa.
 *
 * ## Falha para o lado seguro
 *
 * Qualquer surpresa (filtro desconhecido, imagem que o decodificador recusa,
 * PDF estranho) devolve o arquivo ORIGINAL. O pior caso é a página sair do
 * tamanho que já saía, nunca uma página quebrada. E o resultado é recarregado
 * e conferido antes de ser aceito.
 */

export interface PerfilDeEnxugamento {
  /** Nome curto, para log. */
  nome: string
  /**
   * Teto de resolução das imagens, em pontos por polegada, medido pela maior
   * dimensão da página. `0` desliga a redução de imagens.
   */
  dpi: number
  /** Qualidade do JPEG regravado (1–100). */
  qualidadeJpeg: number
  /** Economia mínima (0–1) para uma imagem regravada substituir a original. */
  economiaMinima: number
  /**
   * Converte imagens sem perda (Flate) em JPEG. Só a miniatura faz isso: na
   * leitura, um diagrama com texto miúdo ganharia borrões de compressão.
   */
  flateParaJpeg: boolean
}

function numeroDoAmbiente(nome: string, padrao: number, min: number, max: number): number {
  const valor = Number(process.env[nome])
  if (!Number.isFinite(valor) || process.env[nome] === '') return padrao
  return Math.min(max, Math.max(min, valor))
}

/**
 * Perfil da página de leitura.
 *
 * 240 DPI numa folha A4 são 1985 × 2806 px, ~5,6 MP: acima do que o leitor
 * desenha no celular (orçamento de ~2–4 MP por página) e no limite do que ele
 * desenha no desktop sem ampliação. Só quem amplia muito no desktop chega
 * perto dessa resolução — e continua vendo uma imagem nítida.
 */
export function perfilDeLeitura(): PerfilDeEnxugamento {
  return {
    nome: 'leitura',
    dpi: numeroDoAmbiente('PDF_VIEWER_IMAGEM_DPI', 240, 0, 1200),
    qualidadeJpeg: numeroDoAmbiente('PDF_VIEWER_IMAGEM_QUALIDADE', 82, 40, 95),
    economiaMinima: 0.15,
    flateParaJpeg: false,
  }
}

/**
 * Perfil da miniatura do painel lateral: 150 px de largura em tela, o dobro em
 * telas densas. 48 DPI numa A4 são ~400 × 560 px — sobra.
 */
export function perfilDeMiniatura(): PerfilDeEnxugamento {
  return {
    nome: 'miniatura',
    dpi: numeroDoAmbiente('PDF_VIEWER_MINIATURA_DPI', 48, 24, 150),
    qualidadeJpeg: 70,
    economiaMinima: 0.05,
    flateParaJpeg: true,
  }
}

export interface ResultadoDoEnxugamento {
  bytes: Uint8Array
  antes: number
  depois: number
  imagensReduzidas: number
  recursosPodados: number
  objetosRemovidos: number
}

const N = {
  Resources: PDFName.of('Resources'),
  Contents: PDFName.of('Contents'),
  XObject: PDFName.of('XObject'),
  Font: PDFName.of('Font'),
  ExtGState: PDFName.of('ExtGState'),
  Pattern: PDFName.of('Pattern'),
  Shading: PDFName.of('Shading'),
  ColorSpace: PDFName.of('ColorSpace'),
  Subtype: PDFName.of('Subtype'),
  Image: PDFName.of('Image'),
  Form: PDFName.of('Form'),
  Filter: PDFName.of('Filter'),
  DecodeParms: PDFName.of('DecodeParms'),
  FlateDecode: PDFName.of('FlateDecode'),
  DCTDecode: PDFName.of('DCTDecode'),
  Width: PDFName.of('Width'),
  Height: PDFName.of('Height'),
  BitsPerComponent: PDFName.of('BitsPerComponent'),
  ImageMask: PDFName.of('ImageMask'),
  Mask: PDFName.of('Mask'),
  SMask: PDFName.of('SMask'),
  SMaskInData: PDFName.of('SMaskInData'),
  Decode: PDFName.of('Decode'),
  DeviceRGB: PDFName.of('DeviceRGB'),
  DeviceGray: PDFName.of('DeviceGray'),
  ICCBased: PDFName.of('ICCBased'),
  N: PDFName.of('N'),
  Predictor: PDFName.of('Predictor'),
  Type: PDFName.of('Type'),
  Metadata: PDFName.of('Metadata'),
  XRef: PDFName.of('XRef'),
  Annots: PDFName.of('Annots'),
  AP: PDFName.of('AP'),
  CharProcs: PDFName.of('CharProcs'),
  PatternType: PDFName.of('PatternType'),
  UserUnit: PDFName.of('UserUnit'),
  Length: PDFName.of('Length'),
}

/** Categorias de recurso que a poda pode enxugar. */
const CATEGORIAS_PODAVEIS = [N.XObject, N.Font, N.ExtGState, N.Pattern, N.Shading, N.ColorSpace]

/** Bytes de um stream já sem filtros, ou `null` se o filtro não for suportado. */
function conteudoDecodificado(stream: PDFStream): Uint8Array | null {
  if (!(stream instanceof PDFRawStream)) {
    // Stream criado pelo próprio pdf-lib nesta sessão (não acontece aqui, mas
    // não custa): `getContents` já devolve o conteúdo cru.
    try {
      return stream.getContents()
    } catch {
      return null
    }
  }
  try {
    if (!stream.dict.has(N.Filter)) return stream.contents
    // Flate puro (o caso de quase todo conteúdo e imagem sem perda): o zlib do
    // Node é nativo e bem mais rápido que o decodificador em JS do pdf-lib.
    if (filtroUnico(stream.dict) === N.FlateDecode && !stream.dict.has(N.DecodeParms)) {
      try {
        return inflateSync(stream.contents)
      } catch {
        // Stream truncado ou com lixo no fim: o decodificador do pdf-lib é
        // mais tolerante e tenta de novo abaixo.
      }
    }
    return decodePDFRawStream(stream).decode()
  } catch {
    return null
  }
}

/** `/Im#201` → `Im 1`: o mesmo nome escrito de dois jeitos compara igual. */
function nomeNormalizado(bruto: string): string {
  return bruto.replace(/#([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

/**
 * Todos os nomes que aparecem num conteúdo de página. Inclui falsos positivos
 * (uma barra dentro de um texto vira "nome"), o que só faz a poda manter MAIS
 * do que precisava — nunca menos.
 */
function adicionarNomes(conteudo: Uint8Array, nomes: Set<string>) {
  const texto = Buffer.from(conteudo.buffer, conteudo.byteOffset, conteudo.byteLength).toString('latin1')
  const padrao = /\/([^\s/[\]()<>{}%]*)/g
  let achado: RegExpExecArray | null
  while ((achado = padrao.exec(texto))) nomes.add(nomeNormalizado(achado[1]))
}

/**
 * Nomes de recurso que a página pode chamar.
 *
 * Não basta ler o conteúdo da página: um Form XObject, um padrão ladrilhado,
 * um glifo de fonte Type3 ou a aparência de uma anotação SEM `/Resources`
 * próprio herda os recursos da página (é o que o pdf.js faz). Os nomes que
 * eles usam também precisam ficar. Os que têm `/Resources` próprio são
 * autossuficientes e não entram na conta.
 *
 * Devolve `null` quando algum conteúdo não pôde ser lido — sem a lista
 * completa não dá para podar com segurança.
 */
function nomesUsadosPelaPagina(page: PDFPage): Set<string> | null {
  const context = page.doc.context
  const nomes = new Set<string>()
  const visitados = new Set<PDFObject>()
  let incompleto = false

  const lerStream = (alvo: PDFObject | undefined) => {
    const stream = alvo instanceof PDFRef ? context.lookup(alvo) : alvo
    if (!(stream instanceof PDFStream) || visitados.has(stream)) return
    visitados.add(stream)
    const conteudo = conteudoDecodificado(stream)
    if (!conteudo) {
      incompleto = true
      return
    }
    adicionarNomes(conteudo, nomes)
  }

  const contents = page.node.get(N.Contents)
  const resolvido = contents instanceof PDFRef ? context.lookup(contents) : contents
  if (resolvido instanceof PDFArray) {
    for (let i = 0; i < resolvido.size(); i += 1) lerStream(resolvido.get(i))
  } else {
    lerStream(resolvido)
  }

  // Herdeiros: formulários e padrões sem recursos próprios, alcançados pelo
  // dicionário da página. Imagem não entra: o conteúdo dela é pixel, não
  // operador, e nem dá para decodificar um JPEG por aqui.
  const herdeirosVistos = new Set<PDFObject>()
  const visitarHerdeiro = (alvo: PDFObject | undefined) => {
    const objeto = alvo instanceof PDFRef ? context.lookup(alvo) : alvo
    if (!(objeto instanceof PDFStream) || herdeirosVistos.has(objeto)) return
    herdeirosVistos.add(objeto)
    if (objeto.dict.lookup(N.Subtype) === N.Image) return
    if (objeto.dict.has(N.Resources)) return
    lerStream(objeto)
  }

  const recursos = page.node.Resources()
  if (recursos) {
    for (const categoria of [N.XObject, N.Pattern]) {
      const dict = recursos.lookupMaybe(categoria, PDFDict)
      if (!dict) continue
      for (const [, valor] of dict.entries()) visitarHerdeiro(valor)
    }
    const fontes = recursos.lookupMaybe(N.Font, PDFDict)
    if (fontes) {
      for (const [, valor] of fontes.entries()) {
        const fonte = valor instanceof PDFRef ? context.lookup(valor) : valor
        if (!(fonte instanceof PDFDict) || fonte.has(N.Resources)) continue
        const glifos = fonte.lookupMaybe(N.CharProcs, PDFDict)
        if (glifos) for (const [, glifo] of glifos.entries()) lerStream(glifo)
      }
    }
  }

  const anotacoes = page.node.lookupMaybe(N.Annots, PDFArray)
  if (anotacoes) {
    for (let i = 0; i < anotacoes.size(); i += 1) {
      const anotacao = anotacoes.lookup(i)
      if (!(anotacao instanceof PDFDict)) continue
      const aparencia = anotacao.lookupMaybe(N.AP, PDFDict)
      if (!aparencia) continue
      for (const [, estado] of aparencia.entries()) {
        const resolvidoEstado = estado instanceof PDFRef ? context.lookup(estado) : estado
        if (resolvidoEstado instanceof PDFStream) visitarHerdeiro(estado)
        else if (resolvidoEstado instanceof PDFDict) {
          for (const [, variante] of resolvidoEstado.entries()) visitarHerdeiro(variante)
        }
      }
    }
  }

  return incompleto ? null : nomes
}

/**
 * Tira do `/Resources` da página o que nada nela chama.
 *
 * O dicionário original NÃO é editado: ele pode ser compartilhado com um
 * formulário que ainda precisa dele. A página recebe uma cópia enxuta, e o que
 * ficar órfão sai na coleta de lixo.
 */
function podarRecursos(page: PDFPage): number {
  const recursos = page.node.Resources()
  if (!recursos) return 0
  const usados = nomesUsadosPelaPagina(page)
  if (!usados) return 0

  const context = page.doc.context
  const novos = recursos.clone(context)
  let podados = 0

  for (const categoria of CATEGORIAS_PODAVEIS) {
    const dict = recursos.lookupMaybe(categoria, PDFDict)
    if (!dict) continue
    const enxuto = context.obj({}) as PDFDict
    for (const [nome, valor] of dict.entries()) {
      const legivel = nomeNormalizado(nome.asString().slice(1))
      // `/DefaultRGB` & cia. valem para a página inteira sem nunca serem
      // chamados pelo nome.
      const implicito = categoria === N.ColorSpace && legivel.startsWith('Default')
      if (implicito || usados.has(legivel)) enxuto.set(nome, valor)
      else podados += 1
    }
    novos.set(categoria, enxuto)
  }

  if (podados > 0) page.node.set(N.Resources, novos)
  return podados
}

/**
 * Apaga do arquivo todo objeto que ninguém alcança a partir do catálogo.
 *
 * O pdf-lib grava TODOS os objetos do contexto, alcançáveis ou não. Depois da
 * poda, as imagens das outras páginas continuariam no arquivo — só que sem
 * ninguém apontando para elas.
 */
function coletarLixo(doc: PDFDocument): number {
  const context = doc.context
  const alcancados = new Set<PDFRef>()
  const pilha: PDFObject[] = []
  const trailer = context.trailerInfo as Record<string, PDFObject | undefined>
  for (const chave of ['Root', 'Info', 'Encrypt', 'ID']) {
    const valor = trailer[chave]
    if (valor) pilha.push(valor)
  }

  while (pilha.length > 0) {
    const atual = pilha.pop()!
    if (atual instanceof PDFRef) {
      if (alcancados.has(atual)) continue
      alcancados.add(atual)
      const alvo = context.lookup(atual)
      if (alvo) pilha.push(alvo)
    } else if (atual instanceof PDFDict) {
      for (const [, valor] of atual.entries()) pilha.push(valor)
    } else if (atual instanceof PDFArray) {
      for (let i = 0; i < atual.size(); i += 1) pilha.push(atual.get(i))
    } else if (atual instanceof PDFStream) {
      pilha.push(atual.dict)
    }
  }

  let removidos = 0
  for (const [ref] of context.enumerateIndirectObjects()) {
    if (!alcancados.has(ref)) {
      context.delete(ref)
      removidos += 1
    }
  }
  return removidos
}

/** Filtro único do stream (`/DCTDecode` ou `[/DCTDecode]`), ou `null`. */
function filtroUnico(dict: PDFDict): PDFName | 'nenhum' | null {
  const filtro = dict.lookup(N.Filter)
  if (!filtro) return 'nenhum'
  if (filtro instanceof PDFName) return filtro
  if (filtro instanceof PDFArray && filtro.size() === 1) {
    const unico = filtro.lookup(0)
    return unico instanceof PDFName ? unico : null
  }
  return null
}

/** 1 (cinza) ou 3 (RGB) canais, ou `null` para espaço de cor que não mexemos. */
function canaisDoEspacoDeCor(dict: PDFDict): 1 | 3 | null {
  const espaco = dict.lookup(N.ColorSpace)
  if (espaco === N.DeviceRGB) return 3
  if (espaco === N.DeviceGray) return 1
  if (espaco instanceof PDFArray && espaco.size() === 2 && espaco.lookup(0) === N.ICCBased) {
    const perfil = espaco.lookup(1)
    const n = perfil instanceof PDFStream ? perfil.dict.lookup(N.N) : undefined
    const canais = n instanceof PDFNumber ? n.asNumber() : 0
    if (canais === 1 || canais === 3) return canais
  }
  return null
}

function numero(dict: PDFDict, nome: PDFName): number {
  const valor = dict.lookup(nome)
  return valor instanceof PDFNumber ? valor.asNumber() : 0
}

/** Imagens XObject alcançáveis pela página (e por formulários dentro dela). */
function imagensDaPagina(page: PDFPage): PDFRef[] {
  const context = page.doc.context
  const imagens = new Set<PDFRef>()
  const formulariosVistos = new Set<PDFObject>()

  const visitarRecursos = (recursos: PDFDict | undefined, profundidade: number) => {
    if (!recursos || profundidade > 6) return
    const xobjects = recursos.lookupMaybe(N.XObject, PDFDict)
    if (!xobjects) return
    for (const [, valor] of xobjects.entries()) {
      if (!(valor instanceof PDFRef)) continue
      const stream = context.lookup(valor)
      if (!(stream instanceof PDFStream)) continue
      const subtipo = stream.dict.lookup(N.Subtype)
      if (subtipo === N.Image) imagens.add(valor)
      else if (subtipo === N.Form && !formulariosVistos.has(stream)) {
        formulariosVistos.add(stream)
        visitarRecursos(stream.dict.lookupMaybe(N.Resources, PDFDict), profundidade + 1)
      }
    }
  }

  visitarRecursos(page.node.Resources(), 0)
  return Array.from(imagens)
}

type Sharp = typeof import('sharp')

let sharpCarregado: Promise<Sharp | null> | null = null

/**
 * O `sharp` só é carregado quando há imagem para regravar. Se o binário nativo
 * faltar no ambiente, a página segue sem a redução — com todo o resto.
 */
function carregarSharp(): Promise<Sharp | null> {
  if (!sharpCarregado) {
    sharpCarregado = import('sharp')
      .then((modulo) => ((modulo as any).default ?? modulo) as Sharp)
      .catch((erro) => {
        console.warn('[pdf-enxugar] sharp indisponível; imagens seguem como estão:', erro)
        return null
      })
  }
  return sharpCarregado
}

/**
 * Regrava uma imagem que passou do teto de resolução.
 *
 * Só entram os casos simples e que cobrem quase todo escaneado: JPEG ou Flate,
 * 8 bits, cinza ou RGB, sem máscara, sem `/Decode`, sem preditor. O resto
 * (CMYK, JPEG 2000, JBIG2, máscaras, paletas) fica exatamente como veio.
 */
async function reduzirImagem(
  sharp: Sharp,
  stream: PDFRawStream,
  limiteLongo: number,
  perfil: PerfilDeEnxugamento,
  rapido: boolean
): Promise<PDFRawStream | null> {
  const dict = stream.dict
  if (dict.has(N.ImageMask) || dict.has(N.Mask) || dict.has(N.SMask) || dict.has(N.SMaskInData)) return null
  if (dict.has(N.Decode)) return null
  if (numero(dict, N.BitsPerComponent) !== 8) return null
  const canais = canaisDoEspacoDeCor(dict)
  if (!canais) return null

  const largura = numero(dict, N.Width)
  const altura = numero(dict, N.Height)
  if (largura <= 0 || altura <= 0) return null

  const filtro = filtroUnico(dict)
  const ehJpeg = filtro === N.DCTDecode
  const ehFlate = filtro === N.FlateDecode
  if (!ehJpeg && !ehFlate) return null

  const longo = Math.max(largura, altura)
  // 10% de folga: não vale regravar uma imagem que mal passou do teto.
  const escala = longo > limiteLongo * 1.1 ? limiteLongo / longo : 1
  const bitsPorPixel = (stream.contents.byteLength * 8) / (largura * altura)

  // Sem redução de tamanho, só um JPEG muito "gordo" compensa ser regravado
  // (um original de qualidade 95+). Flate sem redução não muda nada.
  if (escala === 1 && !(ehJpeg && bitsPorPixel > 2.5)) return null
  if (escala === 1 && ehFlate) return null

  const novaLargura = Math.max(1, Math.round(largura * escala))
  const novaAltura = Math.max(1, Math.round(altura * escala))

  let entrada: import('sharp').Sharp
  if (ehJpeg) {
    const params = dict.lookup(N.DecodeParms)
    // `/ColorTransform` e afins mudam como o JPEG deve ser lido.
    if (params) return null
    entrada = sharp(Buffer.from(stream.contents), { failOn: 'none' })
    const meta = await entrada.metadata()
    if (meta.width !== largura || meta.height !== altura) return null
    if ((meta.channels ?? 0) !== canais) return null
    // O espaço de cor que vale é o do PDF. Um perfil embutido no JPEG faria o
    // sharp converter as cores, e a página ficaria com outro tom.
    if (meta.hasProfile) return null
  } else {
    const params = dict.lookup(N.DecodeParms)
    if (params instanceof PDFDict && numero(params, N.Predictor) > 1) return null
    if (params && !(params instanceof PDFDict)) return null
    const cru = conteudoDecodificado(stream)
    if (!cru || cru.byteLength !== largura * altura * canais) return null
    entrada = sharp(Buffer.from(cru.buffer, cru.byteOffset, cru.byteLength), {
      raw: { width: largura, height: altura, channels: canais },
    })
  }

  let pipeline = entrada
  if (escala < 1) {
    pipeline = pipeline.resize(novaLargura, novaAltura, { fit: 'fill', kernel: 'lanczos3' })
  }

  let novoConteudo: Buffer
  let novoFiltro: PDFName
  if (ehJpeg || perfil.flateParaJpeg) {
    pipeline = canais === 1 ? pipeline.toColourspace('b-w') : pipeline.removeAlpha()
    novoConteudo = await pipeline
      .jpeg({ quality: perfil.qualidadeJpeg, mozjpeg: !rapido, chromaSubsampling: '4:2:0' })
      .toBuffer()
    novoFiltro = N.DCTDecode
  } else {
    const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true })
    if (info.channels !== canais || info.width !== novaLargura || info.height !== novaAltura) return null
    novoConteudo = deflateSync(data, { level: 6 })
    novoFiltro = N.FlateDecode
  }

  if (novoConteudo.byteLength > stream.contents.byteLength * (1 - perfil.economiaMinima)) return null

  const novoDict = dict.clone(dict.context)
  novoDict.set(N.Width, PDFNumber.of(novaLargura))
  novoDict.set(N.Height, PDFNumber.of(novaAltura))
  novoDict.set(N.Filter, novoFiltro)
  novoDict.delete(N.DecodeParms)
  novoDict.delete(N.Length)
  return PDFRawStream.of(novoDict, new Uint8Array(novoConteudo))
}

async function reduzirImagens(page: PDFPage, perfil: PerfilDeEnxugamento): Promise<number> {
  if (perfil.dpi <= 0) return 0
  const imagens = imagensDaPagina(page)
  if (imagens.length === 0) return 0

  const context = page.doc.context
  const { width, height } = page.getSize()
  const unidade = page.node.lookupMaybe(N.UserUnit, PDFNumber)?.asNumber() || 1
  const limiteLongo = Math.ceil((Math.max(width, height) * unidade * perfil.dpi) / 72)
  if (!Number.isFinite(limiteLongo) || limiteLongo < 16) return 0

  // Só carrega o sharp se houver alguma imagem acima do teto ou "gorda".
  const candidatas = imagens.filter((ref) => {
    const stream = context.lookup(ref)
    if (!(stream instanceof PDFRawStream)) return false
    const largura = numero(stream.dict, N.Width)
    const altura = numero(stream.dict, N.Height)
    return Math.max(largura, altura) > limiteLongo * 1.1 || stream.contents.byteLength > 64 * 1024
  })
  if (candidatas.length === 0) return 0
  const sharp = await carregarSharp()
  if (!sharp) return 0

  // Orçamento de tempo. O mozjpeg dá JPEGs ~25% menores que o codificador
  // padrão, mas custa ~1 s numa página A4 a 300 DPI. Uma página com muitas
  // imagens grandes passa para o codificador rápido na metade do orçamento e
  // para de regravar quando ele acaba — o que sobrar segue como veio.
  const inicio = Date.now()
  const orcamentoMs = numeroDoAmbiente('PDF_VIEWER_IMAGEM_ORCAMENTO_MS', 8000, 0, 60_000)
  let reduzidas = 0
  for (const ref of candidatas) {
    const gasto = Date.now() - inicio
    if (gasto > orcamentoMs) break
    const stream = context.lookup(ref)
    if (!(stream instanceof PDFRawStream)) continue
    try {
      const nova = await reduzirImagem(sharp, stream, limiteLongo, perfil, gasto > orcamentoMs / 2)
      if (nova) {
        context.assign(ref, nova)
        reduzidas += 1
      }
    } catch (erro) {
      // Uma imagem que o decodificador recusa fica como veio; as outras seguem.
      console.warn('[pdf-enxugar] imagem mantida como estava:', erro)
    }
  }
  return reduzidas
}

/**
 * Comprime com Flate os streams gravados sem filtro nenhum. Sem perda: é a
 * mesma compressão que o próprio PDF já usa em quase tudo.
 */
function comprimirStreamsCrus(doc: PDFDocument) {
  const context = doc.context
  for (const [ref, objeto] of context.enumerateIndirectObjects()) {
    if (!(objeto instanceof PDFRawStream)) continue
    if (objeto.contents.byteLength < 512) continue
    const dict = objeto.dict
    if (dict.has(N.Filter) || dict.has(N.DecodeParms)) continue
    const tipo = dict.lookup(N.Type)
    // XMP fica legível por recomendação da norma; xref stream tem formato próprio.
    if (tipo === N.Metadata || tipo === N.XRef) continue
    const comprimido = deflateSync(objeto.contents, { level: 6 })
    if (comprimido.byteLength >= objeto.contents.byteLength * 0.9) continue
    const novoDict = dict.clone(context)
    novoDict.set(N.Filter, N.FlateDecode)
    novoDict.delete(N.Length)
    context.assign(ref, PDFRawStream.of(novoDict, new Uint8Array(comprimido)))
  }
}

function paraUint8(bytes: ArrayBuffer | Uint8Array): Uint8Array {
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
}

/**
 * Enxuga um PDF de uma página. Nunca lança e nunca devolve algo maior que o
 * original: na dúvida, devolve o original.
 */
export async function enxugarPaginaPdf(
  entrada: ArrayBuffer | Uint8Array,
  perfil: PerfilDeEnxugamento
): Promise<ResultadoDoEnxugamento> {
  const original = paraUint8(entrada)
  const semMudanca: ResultadoDoEnxugamento = {
    bytes: original,
    antes: original.byteLength,
    depois: original.byteLength,
    imagensReduzidas: 0,
    recursosPodados: 0,
    objetosRemovidos: 0,
  }

  try {
    const doc = await PDFDocument.load(original, { ignoreEncryption: true, updateMetadata: false })
    if (doc.getPageCount() !== 1) return semMudanca
    const page = doc.getPage(0)

    const recursosPodados = podarRecursos(page)
    const objetosRemovidos = coletarLixo(doc)
    const imagensReduzidas = await reduzirImagens(page, perfil)
    comprimirStreamsCrus(doc)

    const bytes = await doc.save({ useObjectStreams: false })
    if (bytes.byteLength >= original.byteLength) return semMudanca

    // Conferência: o resultado abre e continua tendo uma página.
    const conferido = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })
    if (conferido.getPageCount() !== 1) return semMudanca

    return {
      bytes,
      antes: original.byteLength,
      depois: bytes.byteLength,
      imagensReduzidas,
      recursosPodados,
      objetosRemovidos,
    }
  } catch (erro) {
    console.warn(`[pdf-enxugar] página mantida como estava (${perfil.nome}):`, erro)
    return semMudanca
  }
}
