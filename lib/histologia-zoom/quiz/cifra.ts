/**
 * Tokens opacos do quiz de identificação.
 *
 * O aluno não pode descobrir a lâmina pelo endereço: as URLs dos tiles do
 * HistoViewer trazem o nome do órgão ("Kidney/Sample7/"), e o id de cada
 * questão aponta para a marcação. Tudo o que vai ao navegador passa por aqui,
 * cifrado com AES-GCM (Web Crypto — funciona no Node e no runtime Edge).
 *
 * O IV é derivado do próprio conteúdo: o mesmo texto gera sempre o mesmo
 * token, o que deixa os tiles cacheáveis na CDN. Como o IV muda sempre que o
 * texto muda, não há reuso de IV entre mensagens diferentes.
 */

const SEGREDO = process.env.HISTOLOGIA_QUIZ_SEGREDO || process.env.JWT_SECRET || 'domineaqui-histologia-quiz'

const codificador = new TextEncoder()
const decodificador = new TextDecoder()

let chave: Promise<CryptoKey> | null = null

function obterChave(): Promise<CryptoKey> {
  if (!chave) {
    chave = crypto.subtle
      .digest('SHA-256', codificador.encode(`quiz::${SEGREDO}`))
      .then((bruta) => crypto.subtle.importKey('raw', bruta, 'AES-GCM', false, ['encrypt', 'decrypt']))
  }
  return chave
}

function paraBase64Url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64Url(texto: string): Uint8Array {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((texto.length + 3) % 4)
  const s = atob(b64)
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i)
  return bytes
}

export async function cifrar(texto: string): Promise<string> {
  const k = await obterChave()
  const dados = codificador.encode(texto)
  const iv = new Uint8Array(await crypto.subtle.digest('SHA-256', codificador.encode(`iv::${SEGREDO}::${texto}`))).slice(0, 12)
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, dados))
  const tudo = new Uint8Array(iv.length + cifrado.length)
  tudo.set(iv)
  tudo.set(cifrado, iv.length)
  return paraBase64Url(tudo)
}

/** `null` se o token foi adulterado ou não é nosso. */
export async function decifrar(token: string): Promise<string | null> {
  try {
    const tudo = deBase64Url(token)
    if (tudo.length < 13) return null
    const k = await obterChave()
    const aberto = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: tudo.slice(0, 12) }, k, tudo.slice(12))
    return decodificador.decode(aberto)
  } catch {
    return null
  }
}

/** Hosts que o proxy de tiles aceita buscar — nunca um proxy aberto. */
export const HOSTS_DE_TILES = new Set([
  'histoviewer.biomed.au.dk',
  'gtexportal.org',
  'upload.wikimedia.org',
  'images.proteinatlas.org',
])

export const ROTA_DOS_TILES = '/api/manual-clinico/histologia-zoom/tile'
