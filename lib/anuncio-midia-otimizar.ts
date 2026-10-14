'use client'

/**
 * Otimização da mídia do anúncio NO NAVEGADOR de quem envia, antes do upload.
 *
 * ## Por que aqui e não numa função do servidor
 *
 * Comprimir no servidor exigiria subir o arquivo bruto para o Blob, baixá-lo de
 * novo numa função, transcodificar (ffmpeg numa função serverless: binário de
 * ~70 MB, minutos de CPU e memória provisionada cobrados por segundo) e só
 * então apagar o original. Feito aqui, o arquivo bruto nunca sai do computador
 * do admin: o "apagar a versão não comprimida" acontece por construção — ela
 * jamais chega ao armazenamento — e a conta da Vercel não vê um byte disso.
 *
 * ## "Sem perda de qualidade"
 *
 * Compressão sem NENHUMA perda (lossless) não diminui vídeo nem foto de forma
 * útil. O alvo aqui é perda imperceptível na tela onde o anúncio aparece:
 *
 *  - Resolução limitada ao que a tela usa. O anúncio nunca ocupa mais que
 *    ~1200 px de CSS de largura; com tela retina (2×) isso pede no máximo
 *    ~2400 px de imagem. Um 4K de 3840 px gasta 2,5× os pixels para ficar
 *    idêntico depois de reduzido pelo próprio navegador.
 *  - Imagem em WebP com qualidade 0,9 — visualmente igual ao original.
 *  - Vídeo em H.264 (toca em TODO aparelho: iPhone, Android, Windows, Mac),
 *    taxa de bits de referência de streaming em 1080p, nunca acima da do
 *    próprio arquivo de origem, e no máximo 30 quadros por segundo.
 *  - Se a versão "otimizada" sair maior que o original e o original já puder
 *    ser exibido como está, fica o original. Otimizar nunca piora o arquivo.
 *
 * A biblioteca de vídeo (mediabunny, WebCodecs) só é carregada quando um vídeo
 * é escolhido, e só existe no painel do admin — não entra no pacote do aluno.
 */

export type EtapaOtimizacao = 'lendo' | 'comprimindo' | 'capa' | 'pronto'

export interface MidiaOtimizada {
  tipo: 'imagem' | 'video'
  arquivo: Blob
  contentType: string
  extensao: string
  /** Capa do vídeo (WebP). */
  poster?: Blob
  largura: number
  altura: number
  duracao?: number
  bytesOriginais: number
  bytesFinais: number
  /** Explica uma decisão fora do comum ("o original já era menor"). */
  observacao?: string
}

export interface OpcoesOtimizacao {
  onEtapa?: (etapa: EtapaOtimizacao) => void
  /** 0 a 1. */
  onProgresso?: (fracao: number) => void
}

/** Maior lado da imagem final. Ver o cabeçalho: ~1200 px CSS × 2. */
const IMAGEM_LADO_MAX = 2400
const IMAGEM_QUALIDADE = 0.9
/** Vídeo: 1080p é o teto (lado maior 1920, lado menor 1080). */
const VIDEO_LADO_MAIOR_MAX = 1920
const VIDEO_LADO_MENOR_MAX = 1080
const VIDEO_FPS_MAX = 30
/** Taxa de referência para 1920×1080 a 30 fps em H.264. */
const VIDEO_BITRATE_1080P = 4_000_000
const AUDIO_BITRATE = 128_000
const POSTER_QUALIDADE = 0.85

export const MIDIA_IMAGEM_TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
export const MIDIA_VIDEO_TIPOS = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/x-m4v']

export function ehVideo(file: File): boolean {
  return file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|mkv)$/i.test(file.name)
}

// ---------------------------------------------------------------------------
// Imagem
// ---------------------------------------------------------------------------

function canvasParaBlob(canvas: HTMLCanvasElement | OffscreenCanvas, tipo: string, qualidade: number): Promise<Blob | null> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: tipo, quality: qualidade }).catch(() => null)
  }
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), tipo, qualidade))
}

function escala(largura: number, altura: number, ladoMaior: number, ladoMenor = Infinity) {
  const maior = Math.max(largura, altura)
  const menor = Math.min(largura, altura)
  return Math.min(1, ladoMaior / maior, ladoMenor / menor)
}

export async function otimizarImagem(file: File, opcoes: OpcoesOtimizacao = {}): Promise<MidiaOtimizada> {
  opcoes.onEtapa?.('lendo')

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null)
  if (!bitmap) throw new Error('Não foi possível ler esta imagem. Tente outro arquivo (JPG, PNG ou WEBP).')

  const larguraOriginal = bitmap.width
  const alturaOriginal = bitmap.height

  // GIF animado: o canvas guardaria só o primeiro quadro. Vai como veio — e a
  // tela do admin sugere MP4, que costuma ser 5 a 10× menor para a mesma animação.
  if (file.type === 'image/gif') {
    bitmap.close()
    return {
      tipo: 'imagem',
      arquivo: file,
      contentType: 'image/gif',
      extensao: 'gif',
      largura: larguraOriginal,
      altura: alturaOriginal,
      bytesOriginais: file.size,
      bytesFinais: file.size,
      observacao: 'GIF enviado como está. Para animação, um vídeo MP4 fica bem menor.',
    }
  }

  opcoes.onEtapa?.('comprimindo')
  const fator = escala(larguraOriginal, alturaOriginal, IMAGEM_LADO_MAX)
  const largura = Math.max(1, Math.round(larguraOriginal * fator))
  const altura = Math.max(1, Math.round(alturaOriginal * fator))

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Este navegador não conseguiu processar a imagem.')
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, largura, altura)
  bitmap.close()

  // O Safari antigo devolve PNG quando não sabe gerar WebP: confere o tipo.
  let otimizada = await canvasParaBlob(canvas, 'image/webp', IMAGEM_QUALIDADE)
  if (!otimizada || otimizada.type !== 'image/webp') {
    otimizada = file.type === 'image/png' ? null : await canvasParaBlob(canvas, 'image/jpeg', 0.92)
  }

  // O original serve tal como está se já cabe no tamanho e é formato de web.
  const originalAproveitavel = fator === 1 && MIDIA_IMAGEM_TIPOS.includes(file.type)
  if (!otimizada || (originalAproveitavel && otimizada.size >= file.size)) {
    if (!originalAproveitavel) throw new Error('Não foi possível comprimir esta imagem neste navegador.')
    opcoes.onEtapa?.('pronto')
    return {
      tipo: 'imagem',
      arquivo: file,
      contentType: file.type,
      extensao: extensaoDoTipo(file.type),
      largura,
      altura,
      bytesOriginais: file.size,
      bytesFinais: file.size,
      observacao: 'O arquivo original já era o menor possível — mantido sem alteração.',
    }
  }

  opcoes.onEtapa?.('pronto')
  return {
    tipo: 'imagem',
    arquivo: otimizada,
    contentType: otimizada.type,
    extensao: extensaoDoTipo(otimizada.type),
    largura,
    altura,
    bytesOriginais: file.size,
    bytesFinais: otimizada.size,
  }
}

function extensaoDoTipo(tipo: string): string {
  const mapa: Record<string, string> = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'video/mp4': 'mp4',
  }
  return mapa[tipo] ?? 'bin'
}

// ---------------------------------------------------------------------------
// Vídeo
// ---------------------------------------------------------------------------

/** Lados pares: o H.264 trabalha em blocos e recusa dimensão ímpar em vários aparelhos. */
function par(n: number) {
  return Math.max(2, Math.round(n / 2) * 2)
}

/** Taxa de bits proporcional à área (mesma curva usada pelo mediabunny). */
function bitrateDeReferencia(largura: number, altura: number, fps: number) {
  const area = (largura * altura) / (1920 * 1080)
  const porFps = Math.min(1, Math.max(0.5, fps / 30))
  return Math.round(VIDEO_BITRATE_1080P * Math.pow(area, 0.95) * porFps)
}

export async function otimizarVideo(file: File, opcoes: OpcoesOtimizacao = {}): Promise<MidiaOtimizada> {
  if (typeof window === 'undefined' || typeof (window as any).VideoEncoder === 'undefined') {
    throw new Error(
      'Este navegador não sabe comprimir vídeo. Use o Chrome, o Edge ou o Safari atualizados no computador.',
    )
  }

  opcoes.onEtapa?.('lendo')
  const mb = await import('mediabunny')

  const input = new mb.Input({ formats: mb.ALL_FORMATS, source: new mb.BlobSource(file) })
  try {
    const trilhaVideo = await input.getPrimaryVideoTrack()
    if (!trilhaVideo) throw new Error('Este arquivo não tem vídeo.')
    const trilhaAudio = await input.getPrimaryAudioTrack()

    const [codecVideo, codecAudio, duracao, estatisticas] = await Promise.all([
      trilhaVideo.getCodec(),
      trilhaAudio ? trilhaAudio.getCodec() : Promise.resolve(null),
      input.computeDuration(),
      trilhaVideo.computePacketStats(120).catch(() => null),
    ])

    const larguraOriginal = trilhaVideo.displayWidth
    const alturaOriginal = trilhaVideo.displayHeight
    const fpsOriginal = estatisticas?.averagePacketRate || 30
    const bitrateOriginal = estatisticas?.averageBitrate || 0

    const fator = escala(larguraOriginal, alturaOriginal, VIDEO_LADO_MAIOR_MAX, VIDEO_LADO_MENOR_MAX)
    const largura = par(larguraOriginal * fator)
    const altura = par(alturaOriginal * fator)
    const fps = Math.min(fpsOriginal, VIDEO_FPS_MAX)

    // Nunca acima da taxa do próprio arquivo: re-codificar com mais bits que a
    // origem não recupera nada e só engorda o resultado.
    const referencia = bitrateDeReferencia(largura, altura, fps)
    const alvo = bitrateOriginal > 0 ? Math.min(referencia, Math.round(bitrateOriginal)) : referencia
    const bitrate = Math.max(300_000, alvo)

    // Sem AAC nativo (Chromium no Linux, Firefox), entra o codificador em WASM.
    const precisaCodificarAudio = !!trilhaAudio && codecAudio !== 'aac'
    if (precisaCodificarAudio && !(await mb.canEncodeAudio('aac'))) {
      const { registerAacEncoder } = await import('@mediabunny/aac-encoder')
      registerAacEncoder()
    }

    opcoes.onEtapa?.('comprimindo')
    const saida = new mb.Output({
      format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new mb.BufferTarget(),
    })

    const conversao = await mb.Conversion.init({
      input,
      output: saida,
      tracks: 'primary',
      showWarnings: false,
      video: {
        codec: 'avc',
        width: largura,
        height: altura,
        fit: 'fill',
        frameRate: fpsOriginal > VIDEO_FPS_MAX + 1 ? VIDEO_FPS_MAX : undefined,
        quality: new mb.Quality({ bitrate, bitrateMode: 'variable' }),
        // Quadro-chave a cada 2 s: o vídeo começa a tocar rápido e o "voltar ao
        // início" do botão de som não espera um GOP inteiro.
        keyFrameInterval: 2,
        forceTranscode: true,
      },
      // AAC de origem é copiado como está (zero perda). Outro codec vira AAC.
      audio: precisaCodificarAudio
        ? { codec: 'aac', numberOfChannels: 2, quality: new mb.Quality({ bitrate: AUDIO_BITRATE }) }
        : {},
      tags: {},
    })

    if (!conversao.isValid) {
      const motivo = conversao.discardedTracks.map((t) => t.reason).join(', ')
      throw new Error(`Este navegador não conseguiu converter o vídeo (${motivo || 'formato não suportado'}).`)
    }
    if (trilhaAudio && conversao.discardedTracks.some((t) => t.track.type === 'audio')) {
      throw new Error('O áudio deste vídeo não pôde ser convertido neste navegador. Tente o Chrome atualizado.')
    }

    conversao.onProgress = (fracao) => opcoes.onProgresso?.(Math.min(0.99, fracao))
    await conversao.execute()

    const buffer = saida.target.buffer
    if (!buffer) throw new Error('A conversão do vídeo não produziu arquivo.')
    let arquivo: Blob = new Blob([buffer], { type: 'video/mp4' })
    let observacao: string | undefined

    // Otimizar nunca piora: se a origem já era H.264 em MP4, no tamanho certo
    // e menor que o resultado, ela só é reorganizada (início rápido), sem
    // re-codificar um quadro sequer.
    const origemTocaEmTudo =
      codecVideo === 'avc' && (!trilhaAudio || codecAudio === 'aac') && fator === 1 && fpsOriginal <= VIDEO_FPS_MAX + 1
    if (origemTocaEmTudo && arquivo.size >= file.size * 0.97) {
      const remux = await remuxarSemPerda(mb, file)
      if (remux) {
        arquivo = remux
        observacao = 'O vídeo original já era eficiente: mantido sem re-codificar (só preparado para começar a tocar mais rápido).'
      }
    }

    opcoes.onEtapa?.('capa')
    const poster = await gerarCapa(mb, arquivo, duracao).catch(() => undefined)

    opcoes.onProgresso?.(1)
    opcoes.onEtapa?.('pronto')
    return {
      tipo: 'video',
      arquivo,
      contentType: 'video/mp4',
      extensao: 'mp4',
      poster,
      largura,
      altura,
      duracao,
      bytesOriginais: file.size,
      bytesFinais: arquivo.size,
      observacao,
    }
  } finally {
    input.dispose()
  }
}

type Mediabunny = typeof import('mediabunny')

async function remuxarSemPerda(mb: Mediabunny, file: File): Promise<Blob | null> {
  const input = new mb.Input({ formats: mb.ALL_FORMATS, source: new mb.BlobSource(file) })
  try {
    const saida = new mb.Output({
      format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new mb.BufferTarget(),
    })
    const conversao = await mb.Conversion.init({
      input,
      output: saida,
      tracks: 'primary',
      showWarnings: false,
      copy: { mode: 'forced' },
      tags: {},
    })
    if (!conversao.isValid || conversao.discardedTracks.length > 0) return null
    await conversao.execute()
    return saida.target.buffer ? new Blob([saida.target.buffer], { type: 'video/mp4' }) : null
  } catch {
    return null
  } finally {
    input.dispose()
  }
}

/**
 * Capa do vídeo: um quadro de logo depois do começo (o primeiro costuma ser
 * preto, por causa do fade-in). É o que aparece antes de o vídeo tocar e o que
 * a pessoa com economia de dados vê — então vai em WebP, leve.
 */
async function gerarCapa(mb: Mediabunny, video: Blob, duracao: number): Promise<Blob | undefined> {
  const input = new mb.Input({ formats: mb.ALL_FORMATS, source: new mb.BlobSource(video) })
  try {
    const trilha = await input.getPrimaryVideoTrack()
    if (!trilha) return undefined
    const sink = new mb.CanvasSink(trilha, { poolSize: 1 })
    const instante = Math.max(0, Math.min(1, duracao * 0.2))
    const quadro = (await sink.getCanvas(instante)) ?? (await sink.getCanvas(0))
    if (!quadro) return undefined
    const blob = await canvasParaBlob(quadro.canvas, 'image/webp', POSTER_QUALIDADE)
    if (blob && blob.type === 'image/webp') return blob
    return (await canvasParaBlob(quadro.canvas, 'image/jpeg', 0.88)) ?? undefined
  } finally {
    input.dispose()
  }
}
