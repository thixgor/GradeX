/**
 * Classificação e reescrita das URLs de imagem do acervo.
 *
 * O site nasceu apontando para o Imgur: capa de prova, imagem de questão,
 * figura de patologia, ícone de tópico — tudo gravado no Mongo como uma URL
 * `https://i.imgur.com/…`. São milhares de documentos, e a consequência é dupla:
 * cada imagem custa um DNS + TLS + round-trip a um host de terceiros no meio da
 * renderização, e o dia em que esse host sair do ar leva o acervo inteiro junto.
 *
 * Este módulo é a metade pura do conserto — só string, sem rede e sem banco,
 * para poder ser testado em Node e reaproveitado tanto pelo script de migração
 * (`scripts/midia/sincronizar-imagens.mjs`) quanto pelas rotas de escrita do
 * admin, que internalizam a URL colada na hora de salvar.
 *
 * ## O endereço canônico é nosso, não do fornecedor
 *
 * O destino gravado no banco é `/midia/<aa>/<sha256>.<ext>` — caminho relativo,
 * servido pelo próprio site. Ele não é a URL do Vercel Blob: o Blob é apenas
 * onde os bytes moram hoje, e `next.config.js` reescreve `/midia/*` para lá.
 *
 * Gravar a URL do fornecedor no banco seria repetir exatamente o erro que esta
 * migração existe para desfazer — trocar o Imgur pelo Blob e continuar com um
 * domínio de terceiro embutido em milhares de documentos. Com o caminho
 * relativo, mudar de armazenamento é editar uma variável de ambiente, não varrer
 * a base de novo.
 *
 * O nome do arquivo é o SHA-256 do conteúdo. Isso dá deduplicação de graça (a
 * mesma capa reaproveitada em 40 provas é um arquivo só) e torna o endereço
 * imutável, o que libera `Cache-Control: immutable` no CDN.
 */

/** Prefixo público dos assets internalizados. */
export const PREFIXO_MIDIA = '/midia'

/**
 * Hosts que já são nossos. Uma URL aqui não é migrada — ou o arquivo já está no
 * nosso armazenamento, ou é um caminho servido pelo próprio site.
 */
export const HOSTS_INTERNOS = ['localhost', '127.0.0.1', 'domineaqui.com.br', 'www.domineaqui.com.br'] as const

/** Sufixos de host que também são nossos (o Blob usa um subdomínio por store). */
export const SUFIXOS_INTERNOS = ['.public.blob.vercel-storage.com', '.vercel.app'] as const

/**
 * Hosts que servem imagem mesmo quando o caminho não tem extensão.
 *
 * O Imgur é o caso principal (`/a1b2c3` devolve PNG), mas os colegas de
 * pastebin de imagem se comportam igual e apareceram no acervo pela mesma via:
 * alguém colou o link direto no admin.
 */
export const HOSTS_DE_IMAGEM = [
  'i.imgur.com',
  'imgur.com',
  'm.imgur.com',
  'i.ibb.co',
  'ibb.co',
  'i.postimg.cc',
  'postimg.cc',
  'cdn.discordapp.com',
  'media.discordapp.net',
  'pbs.twimg.com',
] as const

/*
 * Fora da lista de propósito: `lh3.googleusercontent.com`.
 *
 * É de onde vêm as fotos de perfil de quem entra com Google, e elas não são
 * acervo: pertencem à conta do aluno, mudam quando ele troca a foto, e
 * internalizá-las congelaria a foto no dia da migração além de encher o
 * armazenamento com milhares de miniaturas. Essas URLs não têm extensão no
 * caminho, então ficam de fora sozinhas. Quem quiser mesmo pode pedir com
 * `--incluir-host=lh3.googleusercontent.com`.
 */

/**
 * Hosts de mídia embutida que nunca devem ser baixados.
 *
 * Um `!video[](https://youtu.be/…)` dentro do texto de uma patologia é um
 * player, não um arquivo. A regra de extensão abaixo já barraria a maioria
 * deles; esta lista existe para o caso de um link terminar em `.gif` ou
 * `.jpg` por acaso de rota e virar um download inútil.
 */
export const HOSTS_NAO_MIDIA = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'vimeo.com',
  'player.vimeo.com',
  'open.spotify.com',
  'spotify.com',
  'soundcloud.com',
  'drive.google.com',
  'docs.google.com',
  'forms.gle',
] as const

/**
 * Extensões tratadas como imagem quando aparecem no fim do caminho.
 *
 * SVG está fora, e a razão é de segurança, não de formato. O acervo aceita URL
 * de origem externa, e SVG é documento executável: internalizar um traria script
 * de terceiro para dentro de `/midia/…`, servido pelo **nosso** domínio, onde
 * abrir o link direto rodaria esse script na nossa origem. Fora daqui, uma URL
 * `.svg` simplesmente não é migrada e continua onde está.
 */
export const EXTENSOES_DE_IMAGEM = [
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'avif',
  'bmp',
  'tif',
  'tiff',
  'heic',
  'heif',
] as const

/** Tipos recusados na ingestão mesmo sendo `image/*`. Ver acima. */
export const CONTENT_TYPES_RECUSADOS = ['image/svg+xml', 'image/svg'] as const

/** Content-types aceitos na ingestão, e a extensão que cada um recebe. */
const EXTENSAO_POR_TIPO: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
}

function hostEhInterno(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if ((HOSTS_INTERNOS as readonly string[]).includes(host)) return true
  return (SUFIXOS_INTERNOS as readonly string[]).some((sufixo) => host.endsWith(sufixo))
}

function hostEhDeImagem(hostname: string): boolean {
  return (HOSTS_DE_IMAGEM as readonly string[]).includes(hostname.toLowerCase())
}

function hostEhDeEmbed(hostname: string): boolean {
  return (HOSTS_NAO_MIDIA as readonly string[]).includes(hostname.toLowerCase())
}

/** Extensão do caminho da URL, sem ponto e em minúsculas. `''` se não houver. */
export function extensaoDoCaminho(url: string): string {
  try {
    const caminho = new URL(url).pathname
    const ponto = caminho.lastIndexOf('.')
    if (ponto === -1) return ''
    const ext = caminho.slice(ponto + 1).toLowerCase()
    return /^[a-z0-9]{1,5}$/.test(ext) ? ext : ''
  } catch {
    return ''
  }
}

export interface OpcoesDeClassificacao {
  /** Hosts extras a tratar como acervo migrável (ex.: um site de onde copiamos figuras). */
  hostsExtras?: readonly string[]
  /** Quando definido, só estes hosts são considerados — usado por `--somente-imgur`. */
  somenteHosts?: readonly string[]
}

/**
 * `true` quando a URL aponta para um arquivo de imagem hospedado fora daqui.
 *
 * Deliberadamente conservador: na dúvida devolve `false`. Um falso negativo
 * deixa uma imagem no Imgur e a próxima execução do script a pega; um falso
 * positivo baixa um HTML de 200 KB e o grava como se fosse figura. A ingestão
 * ainda confere o `Content-Type` da resposta, mas errar aqui já custa a
 * requisição.
 */
export function ehImagemExterna(valor: string, opcoes: OpcoesDeClassificacao = {}): boolean {
  if (typeof valor !== 'string') return false
  const bruto = valor.trim()
  if (!/^https?:\/\//i.test(bruto)) return false

  let url: URL
  try {
    url = new URL(bruto)
  } catch {
    return false
  }

  const host = url.hostname.toLowerCase()
  if (hostEhInterno(host)) return false
  if (hostEhDeEmbed(host)) return false

  if (opcoes.somenteHosts && opcoes.somenteHosts.length > 0) {
    return opcoes.somenteHosts.some((h) => host === h.toLowerCase())
  }

  if (hostEhDeImagem(host)) return true
  if ((opcoes.hostsExtras || []).some((h) => host === h.toLowerCase())) return true

  const ext = extensaoDoCaminho(bruto)
  return (EXTENSOES_DE_IMAGEM as readonly string[]).includes(ext)
}

/** `true` para os endereços que esta migração já produziu. */
export function ehCaminhoInternalizado(valor: string): boolean {
  return typeof valor === 'string' && valor.startsWith(`${PREFIXO_MIDIA}/`)
}

/**
 * Pontuação que costuma encostar numa URL sem fazer parte dela.
 *
 * A mesma URL aparece de três formas no acervo: sozinha num campo
 * (`imagemUrl`), dentro de um embed em markdown (`!image[legenda](url)`) e
 * dentro de HTML (`<img src="url">`). Extrair por regex de URL e depois aparar
 * o que sobrou cobre as três sem um parser por formato.
 */
const CAUDA_APARAVEL = new Set([')', ']', '}', '>', '"', "'", '`', ',', ';', ':', '.', '!', '?', '|', '\\'])

function apararCauda(url: string): string {
  let fim = url.length
  while (fim > 0 && CAUDA_APARAVEL.has(url[fim - 1])) {
    // Um `)` só é cauda quando não fecha um `(` que a própria URL abriu —
    // algumas rotas legítimas usam parênteses no caminho.
    if (url[fim - 1] === ')') {
      const trecho = url.slice(0, fim)
      const abertos = (trecho.match(/\(/g) || []).length
      const fechados = (trecho.match(/\)/g) || []).length
      if (abertos >= fechados) break
    }
    fim -= 1
  }
  return url.slice(0, fim)
}

const REGEX_URL = /https?:\/\/[^\s<>"'`\\]+/gi

/**
 * Toda URL de imagem externa dentro de uma string, na ordem em que aparecem e
 * sem repetição. Funciona tanto para o campo que contém só a URL quanto para um
 * texto longo com embeds e HTML no meio.
 */
export function encontrarImagensExternas(texto: string, opcoes: OpcoesDeClassificacao = {}): string[] {
  if (typeof texto !== 'string' || texto.length === 0) return []
  if (!texto.includes('http')) return []

  const achados: string[] = []
  const vistos = new Set<string>()
  const regex = new RegExp(REGEX_URL.source, 'gi')
  let m: RegExpExecArray | null

  while ((m = regex.exec(texto)) !== null) {
    const url = apararCauda(m[0])
    if (!url || vistos.has(url)) continue
    if (!ehImagemExterna(url, opcoes)) continue
    vistos.add(url)
    achados.push(url)
  }

  return achados
}

/**
 * Substitui cada URL pelo caminho interno correspondente.
 *
 * A substituição é literal (nada de regex montada com a URL, que traria
 * problema de escape), e as chaves são aplicadas da mais longa para a mais
 * curta: sem isso, uma URL que é prefixo de outra — `…/a.png` e
 * `…/a.png?w=800` — corromperia a segunda.
 */
export function substituirUrls(texto: string, mapa: Map<string, string> | Record<string, string>): string {
  if (typeof texto !== 'string' || texto.length === 0) return texto
  const pares = mapa instanceof Map ? Array.from(mapa.entries()) : Object.entries(mapa)
  if (pares.length === 0) return texto

  let saida = texto
  for (const [de, para] of pares.sort((a, b) => b[0].length - a[0].length)) {
    if (!de || !para || !saida.includes(de)) continue
    saida = saida.split(de).join(para)
  }
  return saida
}

/** Extensão a usar no arquivo internalizado, a partir do content-type e da URL. */
export function extensaoPara(contentType: string | null | undefined, urlOriginal: string): string {
  const tipo = (contentType || '').split(';')[0].trim().toLowerCase()
  const porTipo = EXTENSAO_POR_TIPO[tipo]
  if (porTipo) return porTipo

  const porUrl = extensaoDoCaminho(urlOriginal)
  if ((EXTENSOES_DE_IMAGEM as readonly string[]).includes(porUrl)) {
    return porUrl === 'jpeg' ? 'jpg' : porUrl
  }

  // Sem pista nenhuma, `bin` é honesto: o arquivo continua servível (o
  // Content-Type vem do próprio Blob), e o relatório mostra o caso para
  // inspeção em vez de fingir que era PNG.
  return 'bin'
}

/** `true` quando o content-type declarado é de imagem que aceitamos hospedar. */
export function ehContentTypeDeImagem(contentType: string | null | undefined): boolean {
  const tipo = (contentType || '').split(';')[0].trim().toLowerCase()
  if ((CONTENT_TYPES_RECUSADOS as readonly string[]).includes(tipo)) return false
  return tipo.startsWith('image/')
}

/** Caminho público gravado no banco: `/midia/<aa>/<sha256>.<ext>`. */
export function caminhoCanonico(sha256: string, extensao: string): string {
  return `${PREFIXO_MIDIA}/${sha256.slice(0, 2)}/${sha256}.${extensao}`
}

/** Caminho dentro do store de blobs — o mesmo, sem a barra inicial. */
export function caminhoNoBlob(sha256: string, extensao: string): string {
  return caminhoCanonico(sha256, extensao).slice(1)
}
