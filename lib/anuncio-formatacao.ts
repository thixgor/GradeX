/**
 * Formatação do conteúdo do modal de anúncio.
 *
 * O campo do admin era HTML puro: quebra de linha no editor não virava quebra
 * na tela (HTML ignora `\n`) e todo negrito exigia digitar `<strong>`. Agora o
 * texto aceita uma marcação leve, no estilo Markdown/WhatsApp:
 *
 *   **negrito**   *itálico* ou _itálico_   ++sublinhado++   ~~riscado~~
 *   ==destaque==  [texto do link](https://...)   URL solta vira link
 *   # Título      ### Subtítulo     - item     1. item     > citação
 *   -# letra miúda     --- (linha divisória)
 *
 * Enter quebra a linha; linha em branco começa outro parágrafo.
 *
 * HTML continua valendo — anúncios antigos e quem prefere tags não quebram.
 * Uma linha que começa com tag de bloco (`<p>`, `<ul>`, ...) é repassada como
 * está, até a tag fechar. O resultado ainda passa por `sanitizeModalHtml` antes
 * de ir para a tela: esta função só FORMATA, quem garante segurança é o saneamento.
 *
 * Fica fora do componente, sem depender de DOM, para rodar igual no painel, na
 * exibição pública e nos testes.
 */

/** Linha que começa com tag de bloco: é HTML escrito à mão, não texto. */
const INICIO_BLOCO_HTML = /^<\/?(p|ul|ol|li|h[1-6]|blockquote|hr|div|table|section|pre)\b/i

/** Linha que termina fechando/abrindo um bloco — não pede `<br>` depois dela. */
const FIM_BLOCO_HTML = /<\/?(p|ul|ol|li|h[1-6]|blockquote|hr|div|table|section|pre|br)\b[^>]*>$/i

const ABRE_BLOCO = /<(p|ul|ol|li|h[1-6]|blockquote|div|table|section|pre)(\s[^>]*)?>/gi
const FECHA_BLOCO = /<\/(p|ul|ol|li|h[1-6]|blockquote|div|table|section|pre)\s*>/gi

/** Quantos blocos HTML a linha deixa abertos (negativo se fecha mais do que abre). */
function saldoDeBlocos(linha: string) {
  return (linha.match(ABRE_BLOCO)?.length ?? 0) - (linha.match(FECHA_BLOCO)?.length ?? 0)
}

function atributo(valor: string) {
  return valor.replace(/&(?!amp;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** `[texto](url)` — aceita `<url>` entre sinais também. */
const LINK_MARKDOWN = /\[([^\]\n]+)\]\(\s*<?([^\s()<>]+)>?\s*\)/g

/**
 * URL solta no texto. Só depois de espaço, parêntese, marcação ou início — o
 * que exclui endereços já dentro de uma tag — e sem levar pontuação final nem
 * marcação (`**https://x.com**` para no `.com`).
 */
const URL_SOLTA =
  /(^|[\s(*_~=+])((?:https?:\/\/|www\.)[^\s<>]*[^\s<>.,;:!?)\]'"*_~=+])/gi

/** Negrito, sublinhado, riscado, destaque e itálico, nesta ordem. */
function enfatizar(texto: string) {
  return texto
    .replace(/\*\*(?=\S)([^\n]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/\+\+(?=\S)([^\n]*?\S)\+\+/g, '<u>$1</u>')
    .replace(/~~(?=\S)([^\n]*?\S)~~/g, '<del>$1</del>')
    .replace(/==(?=\S)([^\n]*?\S)==/g, '<mark>$1</mark>')
    .replace(/(^|[^\p{L}\p{N}*])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![\p{L}\p{N}*])/gu, '$1<em>$2</em>')
    // `_` só vale fora de palavra: nome_de_arquivo e snake_case ficam como estão.
    .replace(/(^|[^\p{L}\p{N}_])_(?=[^\s_])([^_\n]*?[^\s_])_(?![\p{L}\p{N}_])/gu, '$1<em>$2</em>')
}

/**
 * Formata uma linha de texto: escapes, links e ênfases.
 *
 * Tudo que não pode ser tocado pelas ênfases (tags já escritas, links, URLs,
 * caracteres escapados com `\`) é trocado por uma ficha antes e devolvido no
 * fim — é o que impede `https://site.com/a_b_c` de virar itálico.
 */
export function formatarLinhaAnuncio(texto: string): string {
  const guardados: string[] = []
  const guardar = (html: string) => `${guardados.push(html) - 1}`
  const restaurar = (valor: string): string =>
    valor.replace(/(\d+)/g, (_, indice: string) => restaurar(guardados[Number(indice)] ?? ''))

  let saida = texto
    .replace(/\\([\\*_~=+\[\]()#>`-])/g, (_, caractere: string) => guardar(caractere))
    .replace(/<\/?[a-zA-Z][^>]*>/g, (tag) => guardar(tag))
    .replace(LINK_MARKDOWN, (_, rotulo: string, url: string) =>
      guardar(`<a href="${atributo(url)}">${enfatizar(rotulo)}</a>`),
    )
    .replace(URL_SOLTA, (_, antes: string, url: string) => {
      const href = /^www\./i.test(url) ? `https://${url}` : url
      return antes + guardar(`<a href="${atributo(href)}">${url}</a>`)
    })

  saida = enfatizar(saida)
  return restaurar(saida)
}

/**
 * Converte o texto do editor em HTML (ainda NÃO saneado).
 *
 * Linha a linha: título, lista, citação e divisória viram o bloco próprio; o
 * resto se junta em parágrafos, com `<br>` onde houve Enter. Linhas de HTML de
 * bloco passam como estão.
 */
export function formatarConteudoAnuncio(texto: string | null | undefined): string {
  if (!texto) return ''

  const linhas = texto.replace(/\r\n?/g, '\n').split('\n')
  const saida: string[] = []

  let paragrafo: string[] = []
  let citacao: string[] = []
  let lista: { tag: 'ul' | 'ol'; itens: string[] } | null = null
  let html: string[] = []
  let htmlAberto = 0

  const fecharParagrafo = () => {
    if (paragrafo.length) saida.push(`<p>${paragrafo.map(formatarLinhaAnuncio).join('<br>')}</p>`)
    paragrafo = []
  }
  const fecharCitacao = () => {
    if (citacao.length) saida.push(`<blockquote>${citacao.map(formatarLinhaAnuncio).join('<br>')}</blockquote>`)
    citacao = []
  }
  const fecharLista = () => {
    if (lista) {
      const itens = lista.itens.map((item) => `<li>${formatarLinhaAnuncio(item)}</li>`).join('')
      saida.push(`<${lista.tag}>${itens}</${lista.tag}>`)
    }
    lista = null
  }
  const fecharHtml = () => {
    if (html.length) saida.push(html.join(''))
    html = []
  }
  const fecharTudo = () => {
    fecharParagrafo()
    fecharCitacao()
    fecharLista()
    fecharHtml()
  }
  const adicionarItem = (tag: 'ul' | 'ol', item: string) => {
    fecharParagrafo()
    fecharCitacao()
    fecharHtml()
    if (lista?.tag !== tag) fecharLista()
    lista ??= { tag, itens: [] }
    lista.itens.push(item)
  }

  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trim()

    // HTML escrito à mão: repassa até a tag fechar. Enter entre dois trechos
    // de texto dentro do bloco (ex.: um <p> em várias linhas) ainda vira <br>.
    if (htmlAberto > 0 || INICIO_BLOCO_HTML.test(linha)) {
      if (!html.length) {
        fecharParagrafo()
        fecharCitacao()
        fecharLista()
      }
      if (linha) {
        const anterior = html[html.length - 1]
        if (anterior !== undefined) {
          html.push(FIM_BLOCO_HTML.test(anterior) || INICIO_BLOCO_HTML.test(linha) ? '\n' : '<br>')
        }
        html.push(formatarLinhaAnuncio(linha))
      }
      htmlAberto = Math.max(0, htmlAberto + saldoDeBlocos(linha))
      if (htmlAberto === 0) fecharHtml()
      continue
    }

    if (!linha) {
      fecharTudo()
      continue
    }

    let partes: RegExpMatchArray | null

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(linha)) {
      fecharTudo()
      saida.push('<hr>')
    } else if ((partes = linha.match(/^(#{1,3})\s+(.+)$/))) {
      fecharTudo()
      const tag = partes[1].length === 3 ? 'h4' : 'h3'
      saida.push(`<${tag}>${formatarLinhaAnuncio(partes[2])}</${tag}>`)
    } else if ((partes = linha.match(/^-#\s+(.+)$/))) {
      fecharTudo()
      saida.push(`<p><small>${formatarLinhaAnuncio(partes[1])}</small></p>`)
    } else if ((partes = linha.match(/^>\s?(.*)$/))) {
      fecharParagrafo()
      fecharLista()
      fecharHtml()
      citacao.push(partes[1])
    } else if ((partes = linha.match(/^[-*+•]\s+(.+)$/))) {
      adicionarItem('ul', partes[1])
    } else if ((partes = linha.match(/^\d{1,3}[.)]\s+(.+)$/))) {
      adicionarItem('ol', partes[1])
    } else {
      fecharCitacao()
      fecharLista()
      fecharHtml()
      paragrafo.push(linha)
    }
  }

  fecharTudo()
  return saida.join('')
}

/** Texto corrido, sem marcação — para resumos de uma linha (lista do admin). */
export function resumirConteudoAnuncio(texto: string | null | undefined): string {
  return formatarConteudoAnuncio(texto)
    .replace(/<br\s*\/?>|<\/(p|li|h3|h4|blockquote)>|<hr\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
