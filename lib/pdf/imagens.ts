/**
 * Imagens em base64 para o jsPDF, com cache de sessão.
 *
 * O `addImage` do jsPDF não busca URL — ele quer os bytes. Todo gerador acabava
 * com a sua própria cópia deste vai-e-volta por `<img>` + `<canvas>`, e a
 * terceira cópia é sempre a que esquece o timeout ou o `crossOrigin`.
 *
 * O cache é por aba: um relatório que reimprime a mesma capa três vezes baixa
 * a imagem uma vez. `_emVoo` cobre o caso de dois botões clicados quase juntos,
 * que sem ele disparariam dois downloads da mesma URL.
 */

export type ImagemParaPdf = { dataUrl: string; width: number; height: number }

const _cache = new Map<string, ImagemParaPdf | null>()
const _emVoo = new Map<string, Promise<ImagemParaPdf | null>>()

export async function carregarImagem(url: string): Promise<ImagemParaPdf | null> {
  if (_cache.has(url)) return _cache.get(url) ?? null
  if (_emVoo.has(url)) return _emVoo.get(url)!

  const promessa = (async (): Promise<ImagemParaPdf | null> => {
    try {
      return await new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              resolve(null)
              return
            }
            // Fundo branco antes de desenhar: o JPEG não tem transparência, e
            // um PNG vazado sairia com os buracos pretos.
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            resolve({
              dataUrl: canvas.toDataURL('image/jpeg', 0.88),
              width: img.naturalWidth,
              height: img.naturalHeight,
            })
          } catch {
            resolve(null)
          }
        }
        img.onerror = () => resolve(null)
        // Uma imagem que não responde não pode travar o PDF inteiro: passados
        // 8s ela simplesmente não entra.
        setTimeout(() => resolve(null), 8000)
        img.src = url
      })
    } catch {
      return null
    }
  })()

  _emVoo.set(url, promessa)
  const resultado = await promessa
  _cache.set(url, resultado)
  _emVoo.delete(url)
  return resultado
}

/** Baixa várias de uma vez e devolve o mapa `url → imagem` do que deu certo. */
export async function carregarImagens(urls: (string | null | undefined)[]): Promise<Map<string, ImagemParaPdf>> {
  const mapa = new Map<string, ImagemParaPdf>()
  const unicas = Array.from(new Set(urls.filter((u): u is string => !!u)))
  await Promise.all(
    unicas.map(async (url) => {
      const img = await carregarImagem(url)
      if (img) mapa.set(url, img)
    }),
  )
  return mapa
}

/** Escala uma imagem para caber numa caixa, sem nunca ampliá-la. */
export function encaixar(
  img: ImagemParaPdf,
  larguraMax: number,
  alturaMax: number,
): { largura: number; altura: number } {
  const escala = Math.min(larguraMax / img.width, alturaMax / img.height, 1)
  return { largura: img.width * escala, altura: img.height * escala }
}
