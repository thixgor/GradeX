'use client'

/**
 * Envio da mídia do anúncio a partir do navegador.
 *
 * Concentra num só lugar as regras de tipo, tamanho e nome de arquivo que a
 * rota `/api/admin/anuncios/upload` aplica do outro lado — validar aqui evita
 * gastar um round-trip para descobrir que o arquivo tem 30 MB.
 *
 * Todo arquivo passa por `lib/anuncio-midia-otimizar.ts` ANTES de subir: o
 * Blob só recebe a versão comprimida, e o original fica no computador de quem
 * enviou.
 */

import { upload } from '@vercel/blob/client'
import type { AnuncioMidia } from '@/lib/anuncio-midia'
import {
  ehVideo,
  otimizarImagem,
  otimizarVideo,
  type MidiaOtimizada,
  type OpcoesOtimizacao,
} from '@/lib/anuncio-midia-otimizar'

/** Limites DEPOIS da otimização — os mesmos da rota de upload. */
export const ANUNCIO_IMAGE_MAX_BYTES = 8 * 1024 * 1024
export const ANUNCIO_VIDEO_MAX_BYTES = 80 * 1024 * 1024

/** Limites do arquivo escolhido. Maiores porque ele ainda vai ser comprimido. */
const IMAGEM_ORIGINAL_MAX_BYTES = 40 * 1024 * 1024
const VIDEO_ORIGINAL_MAX_BYTES = 2 * 1024 * 1024 * 1024

export const ANUNCIO_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif'
export const ANUNCIO_MIDIA_ACCEPT = `${ANUNCIO_IMAGE_ACCEPT},video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm`

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export function validateAnuncioImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Selecione um arquivo de imagem'
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return 'Formato não suportado (use JPG, PNG, WEBP, GIF ou AVIF)'
  if (file.size > IMAGEM_ORIGINAL_MAX_BYTES) return 'Imagem muito grande (máximo de 40 MB)'
  return null
}

export function validateAnuncioMidia(file: File, aceitaVideo: boolean): string | null {
  if (ehVideo(file)) {
    if (!aceitaVideo) return 'Este campo aceita só imagem'
    if (file.size > VIDEO_ORIGINAL_MAX_BYTES) return 'Vídeo muito grande (máximo de 2 GB antes da compressão)'
    return null
  }
  return validateAnuncioImage(file)
}

function novoId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

/** Sobe um arquivo já pronto para o store público e devolve a URL. */
async function enviarArquivo(
  pathname: string,
  arquivo: Blob,
  contentType: string,
  onProgress?: (percentual: number) => void,
): Promise<string> {
  try {
    const blob = await upload(pathname, arquivo, {
      access: 'public',
      contentType,
      handleUploadUrl: '/api/admin/anuncios/upload',
      // Vídeo grande sobe em partes: uma queda de rede não perde o envio inteiro.
      multipart: arquivo.size > 20 * 1024 * 1024,
      onUploadProgress: onProgress ? ({ percentage }) => onProgress(Math.round(percentage)) : undefined,
    })
    return blob.url
  } catch (error) {
    // Quando a API do Blob recusa o envio ela responde sem cabeçalho de CORS e
    // o navegador troca a mensagem real por "blocked by CORS policy", que não
    // ajuda ninguém a resolver. Vale mais dizer o que fazer.
    const raw = error instanceof Error ? error.message : ''
    if (!raw || /failed to fetch|networkerror|load failed|cors/i.test(raw)) {
      throw new Error(
        'O servidor de imagens recusou o envio. Recarregue a página e tente de novo; se persistir, confira o token do Blob de mídia.',
      )
    }
    throw new Error(raw)
  }
}

export type EtapaEnvio = 'lendo' | 'comprimindo' | 'capa' | 'enviando' | 'pronto'

export interface OpcoesEnvio {
  aceitaVideo?: boolean
  onEtapa?: (etapa: EtapaEnvio) => void
  /** 0–100 da etapa atual (compressão ou envio). */
  onProgresso?: (percentual: number) => void
}

export interface MidiaEnviada {
  midia: AnuncioMidia
  otimizada: MidiaOtimizada
}

/**
 * Otimiza e envia. Devolve a mídia pronta para gravar no anúncio e o relatório
 * da otimização (antes/depois), que o painel mostra a quem enviou.
 */
export async function enviarMidiaDoAnuncio(file: File, opcoes: OpcoesEnvio = {}): Promise<MidiaEnviada> {
  const invalido = validateAnuncioMidia(file, opcoes.aceitaVideo ?? true)
  if (invalido) throw new Error(invalido)

  const otimizacao: OpcoesOtimizacao = {
    onEtapa: (etapa) => opcoes.onEtapa?.(etapa === 'pronto' ? 'enviando' : etapa),
    onProgresso: (fracao) => opcoes.onProgresso?.(Math.round(fracao * 100)),
  }
  const otimizada = ehVideo(file) ? await otimizarVideo(file, otimizacao) : await otimizarImagem(file, otimizacao)

  const limite = otimizada.tipo === 'video' ? ANUNCIO_VIDEO_MAX_BYTES : ANUNCIO_IMAGE_MAX_BYTES
  if (otimizada.bytesFinais > limite) {
    throw new Error(
      otimizada.tipo === 'video'
        ? 'Mesmo comprimido, o vídeo passou de 80 MB. Corte-o para menos de ~2 minutos.'
        : 'Mesmo comprimida, a imagem passou de 8 MB.',
    )
  }

  opcoes.onEtapa?.('enviando')
  opcoes.onProgresso?.(0)
  const base = `anuncios/${otimizada.tipo === 'video' ? 'videos/' : ''}${Date.now()}-${novoId()}`

  // Pôster (pequeno) e vídeo sobem juntos; o progresso mostrado é o do vídeo.
  const [url, posterUrl] = await Promise.all([
    enviarArquivo(`${base}.${otimizada.extensao}`, otimizada.arquivo, otimizada.contentType, opcoes.onProgresso),
    otimizada.poster
      ? enviarArquivo(`${base.replace('videos/', '')}-poster.webp`, otimizada.poster, otimizada.poster.type || 'image/webp')
      : Promise.resolve(undefined),
  ])

  opcoes.onEtapa?.('pronto')
  return {
    otimizada,
    midia: {
      tipo: otimizada.tipo,
      url,
      posterUrl,
      largura: otimizada.largura,
      altura: otimizada.altura,
      duracao: otimizada.duracao,
      bytes: otimizada.bytesFinais,
    },
  }
}

/**
 * Banner flutuante: só imagem, também otimizada antes de subir.
 *
 * `onProgress` recebe a porcentagem enviada — uma arte grande em conexão de
 * celular leva segundos, e sem esse retorno a tela parece travada.
 */
export async function uploadAnuncioImage(
  file: File,
  onProgress?: (percentual: number) => void,
): Promise<{ url: string; otimizada: MidiaOtimizada }> {
  const { midia, otimizada } = await enviarMidiaDoAnuncio(file, {
    aceitaVideo: false,
    onProgresso: onProgress,
  })
  return { url: midia.url, otimizada }
}
