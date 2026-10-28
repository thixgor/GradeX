import { jsPDF } from 'jspdf'
import type { FlashcardManualCard, FlashcardManualDeck } from './types'
import {
  type Folha,
  type LinhaDoGrupo,
  criarFolha,
  desenharCabecalhoDaQuestao,
  desenharCartaoDeTitulo,
  desenharGrupo,
  desenharListaDeItens,
  escreverNota,
  finalizarFolha,
  garantirEspaco,
  novaPagina,
} from './pdf/folha'
import { desenharImagemEmoldurada } from './pdf/imagens-de-questao'
import { FLORESTA, TINTA_SUAVE, VERDE, carregarLogo, fonte, registrarFontes } from './pdf/marca'
import { prepararAssetsDePdfNoServidor } from './pdf/marca-servidor'
import { desenharCaixaDeTexto } from './pdf/questao-na-folha'

type PdfUser = {
  id: string
  name: string
  email: string
}

type ImageData = {
  dataUrl: string
  format: 'PNG' | 'JPEG' | 'WEBP'
}

const imageCache = new Map<string, Promise<ImageData | null>>()

/**
 * Largura em que as imagens entram no PDF.
 *
 * Uma figura é desenhada em no máximo ~178 x 82 mm (ver `renderImage`), o que
 * a 150 dpi dá pouco mais de 1000 px de largura. Embutir o arquivo original —
 * uma foto de 3 MB tirada no celular, por exemplo — era jogar megabytes num
 * espaço de sete centímetros de altura: o PDF ficava pesado, a geração ficava
 * cara e a resposta estourava o teto de corpo da função.
 *
 * 1080 é um valor de `deviceSizes` (next.config.js) de propósito: o otimizador
 * do Next recusa larguras fora dessa lista, e usar uma que a plataforma já
 * serve para o `next/image` do próprio deck faz a transformação cair no cache
 * em vez de ser refeita.
 */
const PDF_IMAGE_WIDTH = 1080
const PDF_IMAGE_QUALITY = 70

function cleanText(value: unknown): string {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\nl/g, '\n')
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '')
    .trim()
}

function safeFileName(value: string): string {
  const cleaned = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return cleaned || 'flashcards'
}

export function flashcardPdfFileName(deckTitle: string): string {
  return `${safeFileName(deckTitle)}-DomineAqui.pdf`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function frontTextForCard(card: FlashcardManualCard): string {
  if (card.kind !== 'hidden_word' || !card.hiddenWord) return cleanText(card.front?.text)
  const phrase = cleanText(card.hiddenWord.phrase)
  const word = cleanText(card.hiddenWord.word)
  if (!word) return phrase
  return phrase.replace(new RegExp(`\\*\\*${escapeRegExp(word)}\\*\\*|${escapeRegExp(word)}`, 'gi'), '________')
}

function backTextForCard(card: FlashcardManualCard): string {
  if (card.kind !== 'hidden_word' || !card.hiddenWord) return cleanText(card.back?.text)
  const answer = cleanText(card.hiddenWord.word)
  const extra = cleanText(card.back?.text)
  return [answer ? `Palavra: **${answer}**` : '', extra].filter(Boolean).join('\n\n')
}

async function fetchImageAsDataUrl(url: string, origin: string): Promise<ImageData | null> {
  const cacheKey = `${origin}|${url}`
  const cached = imageCache.get(cacheKey)
  if (cached) return cached

  const task = fetchImageAsDataUrlUncached(url, origin)
  imageCache.set(cacheKey, task)
  if (imageCache.size > 120) {
    const firstKey = imageCache.keys().next().value
    if (firstKey) imageCache.delete(firstKey)
  }
  return task
}

/**
 * Endereço da imagem já redimensionada pelo otimizador do próprio Next.
 *
 * Não pedimos WebP: o formato PDF não tem filtro para ele, e o jsPDF teria de
 * decodificar por conta própria. Com um `Accept` sem webp, o otimizador
 * devolve a imagem no formato de origem — só que redimensionada e recomprimida,
 * que é tudo o que precisamos aqui.
 */
function optimizedImageUrl(url: string, origin: string): string {
  return `${origin}/_next/image?url=${encodeURIComponent(url)}&w=${PDF_IMAGE_WIDTH}&q=${PDF_IMAGE_QUALITY}`
}

async function fetchImageBytes(
  target: string,
  timeoutMs: number
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(target, {
      signal: controller.signal,
      headers: {
        // Sem webp/avif de propósito — ver `optimizedImageUrl`.
        Accept: 'image/jpeg,image/png,image/*;q=0.8',
        'User-Agent': 'Domine-Aqui-Flashcard-PDF/1.0',
      },
    })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) return null
    if (contentType.includes('svg') || contentType.includes('gif')) return null
    return { bytes: Buffer.from(await response.arrayBuffer()), contentType }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchImageAsDataUrlUncached(url: string, origin: string): Promise<ImageData | null> {
  try {
    if (!url) return null
    if (url.startsWith('data:image/')) {
      const mime = url.slice(5, url.indexOf(';')).toLowerCase()
      const format = mime.includes('png') ? 'PNG' : mime.includes('webp') ? 'WEBP' : 'JPEG'
      return { dataUrl: url, format }
    }

    const absoluteUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : new URL(url, origin).toString()

    // Primeiro a versão redimensionada; o original só se ela falhar. O
    // otimizador recusa host fora de `remotePatterns` e não existe fora da
    // Vercel, então o plano B precisa existir — mas buscar os dois sempre
    // dobraria a transferência de origem para descartar metade.
    const escolhida =
      (await fetchImageBytes(optimizedImageUrl(url, origin), 7000)) ||
      (await fetchImageBytes(absoluteUrl, 6000))
    if (!escolhida) return null

    const format = escolhida.contentType.includes('png')
      ? 'PNG'
      : escolhida.contentType.includes('webp')
      ? 'WEBP'
      : 'JPEG'
    return {
      dataUrl: `data:${escolhida.contentType};base64,${escolhida.bytes.toString('base64')}`,
      format,
    }
  } catch {
    return null
  }
}

export async function generateFlashcardManualPdf(
  deck: FlashcardManualDeck & { _id?: unknown },
  cards: FlashcardManualCard[],
  user: PdfUser,
  origin: string
): Promise<ArrayBuffer> {
  // `compress: true` liga o filtro Flate nos content streams. O documento é
  // quase todo operação de texto e vetor — duas páginas por card, fundo,
  // cabeçalho e rodapé em cada uma —, e esse é o tipo de conteúdo que comprime
  // muito bem. Custa alguns milissegundos de CPU e derruba boa parte do
  // arquivo que sai da função.
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })

  const imageUrls = new Set<string>()
  if (deck.coverImage) imageUrls.add(deck.coverImage)
  for (const card of cards) {
    if (card.front?.image) imageUrls.add(card.front.image)
    if (card.back?.image) imageUrls.add(card.back.image)
  }

  // A fonte Inter e o logo vêm do disco (ver `lib/pdf/marca-servidor.ts`), em
  // paralelo com as imagens dos cards.
  const [imageEntries] = await Promise.all([
    Promise.all(Array.from(imageUrls).map(async url => [url, await fetchImageAsDataUrl(url, origin)] as const)),
    prepararAssetsDePdfNoServidor(),
  ])
  const images = new Map<string, ImageData | null>(imageEntries)

  // Dimensões medidas UMA vez por imagem.
  //
  // `doc.getImageProperties()` decodifica o arquivo a cada chamada, e a mesma
  // figura costuma aparecer em vários cards: num deck de 60 cards com 5 imagens
  // eram 60 decodificações para descobrir 5 pares de largura e altura — mais
  // tempo do que a montagem inteira do resto do documento. Uma imagem que não
  // decodifica fica de fora aqui e cai no aviso de "não pôde ser inserida".
  const imageSizes = new Map<string, { width: number; height: number }>()
  for (const [url, image] of images) {
    if (!image) continue
    try {
      const props = doc.getImageProperties(image.dataUrl)
      imageSizes.set(url, { width: props.width, height: props.height })
    } catch {
      // Segue sem tamanho: o `renderImage` avisa que a figura não entrou.
    }
  }

  const familia = await registrarFontes(doc)
  const folha: Folha = criarFolha(doc, familia, await carregarLogo(), 'Flashcards')

  /**
   * A figura de um card, centrada numa moldura de vidro.
   *
   * Sem `alias` nem nível de compressão explícitos: o jsPDF já deriva o alias
   * do conteúdo (a mesma figura em vários cards vira um XObject só) e o seu
   * padrão comprime o PNG melhor do que 'FAST' — medido, passar os dois à mão
   * engordava o arquivo em vez de enxugá-lo.
   */
  function renderImage(url: string | undefined, label: string, maxHeight = 92) {
    if (!url) return
    const image = images.get(url)
    const props = imageSizes.get(url)
    if (!image || !props) {
      escreverNota(folha, image ? `${label} não pôde ser inserida.` : `${label} indisponível.`)
      return
    }
    const maxWidth = folha.larguraUtil - 10
    const ratio = Math.min(maxWidth / props.width, maxHeight / props.height, 1)
    const width = props.width * ratio
    const height = props.height * ratio
    garantirEspaco(folha, height + 6)
    const x = folha.margem + (folha.larguraUtil - width) / 2
    desenharImagemEmoldurada(doc, image.dataUrl, x, folha.y + 1.5, width, height)
    folha.y += height + 7
  }

  /** As três caixinhas de dificuldade, para o aluno marcar a caneta. */
  function renderRatingBoxes() {
    const labels = [
      { title: 'Fácil', detail: 'acertei sem esforço' },
      { title: 'Médio', detail: 'acertei com dúvida' },
      { title: 'Difícil', detail: 'errei ou travei' },
    ]
    const gap = 3.5
    const boxWidth = (folha.larguraUtil - gap * 2) / 3
    const linha: LinhaDoGrupo = {
      altura: 14,
      desenhar: (x, y) => {
        labels.forEach((item, index) => {
          const cx = x + index * (boxWidth + gap)
          if (index > 0) {
            doc.setDrawColor(226, 234, 229)
            doc.setLineWidth(0.22)
            doc.line(cx - gap / 2, y + 2.5, cx - gap / 2, y + 11.5)
          }
          doc.setFillColor(255, 255, 255)
          doc.setDrawColor(VERDE[0], VERDE[1], VERDE[2])
          doc.setLineWidth(0.35)
          doc.roundedRect(cx + 4.5, y + 4.5, 5, 5, 1.2, 1.2, 'FD')
          fonte(doc, 'bold', 9, FLORESTA)
          doc.text(item.title, cx + 12.5, y + 6.6)
          fonte(doc, 'normal', 7.2, TINTA_SUAVE)
          doc.text(item.detail, cx + 12.5, y + 10.6)
        })
      },
    }
    desenharGrupo(folha, [linha], { titulo: 'Como foi?', semFios: true, respiro: 0.5, depois: 4 })
  }

  // ── A primeira página: capa, título e o jeito de estudar ──────────
  // A capa é uma faixa, não a página: alta demais, ela empurrava as
  // orientações para uma segunda página quase vazia.
  if (deck.coverImage) renderImage(deck.coverImage, 'Capa', 62)

  desenharCartaoDeTitulo(folha, {
    titulo: cleanText(deck.title) || 'Flashcards',
    chips: [`${cards.length} ${cards.length === 1 ? 'cartão' : 'cartões'}`, cleanText(user.name)].filter(Boolean),
  })

  desenharListaDeItens(
    folha,
    [
      'Leia a frente do card e responda **antes** de olhar o verso.',
      'Confira a resposta e leia a resposta comentada quando existir.',
      'Marque uma dificuldade em cada card para montar sua revisão.',
      '**Modo normal:** percorra o deck na ordem.',
      '**Fixação intensa:** priorize cards novos, vencidos ou marcados como difíceis.',
      '**Palavra oculta:** descubra a palavra escondida antes de ver o verso.',
    ],
    { titulo: 'Como estudar' },
  )
  desenharListaDeItens(
    folha,
    [
      '**Fácil:** revise depois de mais tempo.',
      '**Médio:** revise em breve.',
      '**Difícil:** volte nesse card hoje ou amanhã.',
    ],
    { titulo: 'Depois de marcar' },
  )

  // A frente de um card é lida de longe, como no app: corpo maior.
  const MEDIDAS_DA_FRENTE = { corpoDoTexto: 12, alturaDaLinha: 6.6, corpoDoTitulo: 9.5 }

  // ── Os cards: frente numa página, verso na seguinte ───────────────
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index]
    const oculta = card.kind === 'hidden_word'
    const rotulo = `Cartão ${index + 1} de ${cards.length}`

    novaPagina(folha)
    desenharCabecalhoDaQuestao(folha, rotulo, [
      ...(oculta ? [{ texto: 'Palavra oculta', tom: 'laranja' as const }] : []),
      { texto: 'Frente', tom: 'verde' },
    ])
    renderRatingBoxes()
    desenharCaixaDeTexto(folha, frontTextForCard(card) || '(sem texto)', 'Frente', {
      tom: 'claro',
      medidas: MEDIDAS_DA_FRENTE,
    })
    renderImage(card.front?.image, 'Imagem da frente')

    if (oculta && card.hiddenWord?.hint) {
      desenharCaixaDeTexto(folha, cleanText(card.hiddenWord.hint), 'Dica', { tom: 'laranja' })
    }
    escreverNota(folha, 'Vire a página para conferir o verso.')

    novaPagina(folha)
    desenharCabecalhoDaQuestao(folha, rotulo, [
      ...(oculta ? [{ texto: 'Palavra oculta', tom: 'laranja' as const }] : []),
      { texto: 'Verso', tom: 'escuro' },
    ])
    desenharCaixaDeTexto(folha, backTextForCard(card) || '(sem resposta)', 'Verso', {
      tom: 'verde',
      medidas: MEDIDAS_DA_FRENTE,
    })
    renderImage(card.back?.image, 'Imagem do verso')

    if (card.comment) {
      desenharCaixaDeTexto(folha, cleanText(card.comment), 'Resposta comentada', { tom: 'claro' })
    }
  }

  finalizarFolha(folha, cleanText(deck.title), 'Flashcards')
  return doc.output('arraybuffer')
}
