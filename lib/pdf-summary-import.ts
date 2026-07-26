/**
 * Importação de sumário de PDF a partir de texto/markdown.
 *
 * Fluxo pensado para o admin: em vez de cadastrar entrada por entrada no
 * editor do viewer, o admin manda o PDF para uma IA junto com o prompt gerado
 * por `buildSummaryPrompt()`, cola o markdown de volta e importa tudo de uma vez.
 *
 * O parser é propositalmente tolerante: modelos diferentes devolvem o sumário
 * em formatos levemente diferentes, então aceitamos heading (`#`), bullets
 * indentados, numeração (1.2.3) e tabela markdown, com a página no fim da linha
 * em várias notações (`:: 12`, `— 12`, `... 12`, `p. 12`, `(12)`, `| 12 |`).
 */

export interface ParsedSummaryEntry {
  title: string
  page: number
  level: number
}

export interface SummaryParseIssue {
  line: number
  text: string
  reason: string
}

export interface SummaryParseResult {
  entries: ParsedSummaryEntry[]
  /** Linhas que pareciam entradas mas não puderam ser lidas. */
  issues: SummaryParseIssue[]
  /** Avisos não bloqueantes (ex.: página fora do intervalo do PDF). */
  warnings: string[]
}

export const MAX_SUMMARY_LEVEL = 2

/** Formato canônico que pedimos à IA — também serve de exemplo no editor. */
export const SUMMARY_MARKDOWN_EXAMPLE = `# Capítulo 1 — Introdução :: 1
## 1.1 Conceitos básicos :: 3
### Glossário :: 5
## 1.2 Aplicações clínicas :: 8
# Capítulo 2 — Diagnóstico :: 14`

/**
 * Prompt em markdown para colar na IA junto com o PDF.
 * `pageCount` entra no texto quando conhecido para a IA validar as páginas.
 */
export function buildSummaryPrompt(options?: { pageCount?: number; materialTitle?: string }): string {
  const pageCount = options?.pageCount && options.pageCount > 0 ? options.pageCount : null
  const title = options?.materialTitle?.trim()

  return `# Tarefa: gerar o sumário do PDF em anexo

Você vai ler o PDF anexado${title ? ` (\`${title}\`)` : ''} e devolver **apenas** o sumário dele no formato definido abaixo. Nada de introdução, comentários ou blocos de código extras.

## Formato de saída (obrigatório)

Uma entrada por linha, sempre:

\`\`\`
<nível> <título> :: <página>
\`\`\`

- \`<nível>\`: \`#\` para título principal, \`##\` para subtítulo e \`###\` para sub-subtítulo. Não use mais de 3 níveis.
- \`<título>\`: o texto do tópico exatamente como aparece no PDF, sem numeração inventada e sem pontilhados de preenchimento.
- \`::\` separa o título da página (dois-pontos duplos, com espaço antes e depois).
- \`<página>\`: número **inteiro** da página **física do arquivo PDF** (a 1ª página do arquivo é a página 1), e **não** o número impresso no rodapé, quando os dois divergirem.

## Regras

1. Cubra o documento inteiro, na ordem em que os tópicos aparecem.
2. Se o PDF já tiver uma página de sumário, use-a como base, mas **confira** as páginas no corpo do documento — sumários impressos costumam estar deslocados.
3. Não repita a própria página de sumário nem a capa como entradas.
4. Uma página pode ter vários tópicos; tópicos diferentes podem apontar para a mesma página.
5. As páginas devem ser não decrescentes de cima para baixo.${pageCount ? `\n6. O PDF tem **${pageCount} páginas**. Nenhuma página pode ser menor que 1 nem maior que ${pageCount}.` : ''}

## Exemplo de saída

\`\`\`
${SUMMARY_MARKDOWN_EXAMPLE}
\`\`\`

Responda somente com as linhas do sumário.`
}

/** Remove cercas de bloco de código que os modelos costumam devolver junto. */
function stripCodeFences(raw: string): string {
  const lines = raw.split(/\r?\n/)
  const out: string[] = []
  let inFence = false
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    out.push(line)
  }
  // Se a contagem de cercas foi ímpar, o conteúdo ainda está todo aqui — ok.
  return out.join('\n')
}

/** Limpa marcações inline (negrito, itálico, links, código) do título. */
function cleanTitle(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [texto](link)
    .replace(/\*\*|__|\*|_|`/g, '')
    .replace(/\.{2,}/g, ' ') // pontilhados de sumário impresso
    .replace(/[–—-]\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Extrai a página do fim da linha. Aceita `:: 12`, `— 12`, `- 12`, `... 12`,
 * `p. 12`, `pág 12`, `(12)`, `[12]` e número solto no fim.
 * Retorna null quando não há número de página reconhecível.
 */
function extractPage(text: string): { title: string; page: number } | null {
  const patterns: RegExp[] = [
    /^(.*?)\s*::\s*(\d{1,5})\s*$/,
    /^(.*?)\s*[\[(]\s*(?:p\.?|pág\.?|pag\.?|página)?\s*(\d{1,5})\s*[\])]\s*$/i,
    /^(.*?)\s*(?:[–—|-]|\.{2,}|\s)\s*(?:p\.?|pág\.?|pag\.?|página)\s*(\d{1,5})\s*$/i,
    /^(.*?)\s*(?:[–—|:-]|\.{2,})\s*(\d{1,5})\s*$/,
    /^(.*?)\s+(\d{1,5})\s*$/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue
    const title = match[1].trim()
    const page = parseInt(match[2], 10)
    if (!title || !Number.isFinite(page) || page < 1) continue
    return { title, page }
  }
  return null
}

/** Descobre o nível a partir de heading, indentação e/ou numeração (1.2.3). */
function detectLevel(rawLine: string, body: string): number | null {
  const heading = rawLine.match(/^\s*(#{1,6})\s+/)
  if (heading) return Math.min(MAX_SUMMARY_LEVEL, heading[1].length - 1)

  const numbering = body.match(/^(\d+(?:\.\d+)*)\.?\s+\S/)
  if (numbering) {
    const depth = numbering[1].split('.').length - 1
    return Math.min(MAX_SUMMARY_LEVEL, depth)
  }

  const indentMatch = rawLine.match(/^([ \t]*)/)
  const indent = indentMatch ? indentMatch[1].replace(/\t/g, '  ').length : 0
  if (indent > 0) return Math.min(MAX_SUMMARY_LEVEL, Math.floor(indent / 2))

  return null
}

/**
 * Converte texto/markdown em entradas de sumário.
 * `pageCount > 0` faz o clamp das páginas ao total real do PDF.
 */
export function parseSummaryMarkdown(raw: string, pageCount = 0): SummaryParseResult {
  const entries: ParsedSummaryEntry[] = []
  const issues: SummaryParseIssue[] = []
  const warnings: string[] = []

  if (!raw || !raw.trim()) {
    return { entries, issues, warnings }
  }

  const maxPage = pageCount > 0 ? pageCount : Number.MAX_SAFE_INTEGER
  const lines = stripCodeFences(raw).split(/\r?\n/)
  let clampedCount = 0

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1
    const trimmed = rawLine.trim()
    if (!trimmed) return
    // Separadores markdown e a linha de traços do cabeçalho de tabela.
    if (/^[-=*_|:\s]+$/.test(trimmed)) return

    let body = trimmed

    // Linha de tabela markdown: | Título | 12 |
    const isTableRow = body.startsWith('|') && body.endsWith('|')
    if (isTableRow) {
      const cells = body.slice(1, -1).split('|').map(c => c.trim()).filter(c => c.length > 0)
      if (cells.length === 0) return
      // Cabeçalho da tabela ("Título | Página") não vira entrada.
      if (cells.length >= 2 && /^(página|pagina|page|pág\.?)$/i.test(cells[cells.length - 1])) return
      body = cells.join(' :: ')
    }

    const level = detectLevel(rawLine, body.replace(/^\s*#{1,6}\s+/, '').replace(/^\s*[-*+•]\s+/, ''))

    // Tira o marcador de heading/bullet antes de procurar a página.
    body = body.replace(/^\s*#{1,6}\s+/, '').replace(/^\s*[-*+•]\s+/, '').trim()
    if (!body) return

    const extracted = extractPage(body)
    if (!extracted) {
      issues.push({ line: lineNumber, text: trimmed, reason: 'Sem número de página no fim da linha' })
      return
    }

    const title = cleanTitle(extracted.title)
    if (!title) {
      issues.push({ line: lineNumber, text: trimmed, reason: 'Título vazio' })
      return
    }

    let page = extracted.page
    if (page > maxPage) {
      page = maxPage
      clampedCount++
    }

    entries.push({ title, page, level: Math.max(0, Math.min(MAX_SUMMARY_LEVEL, level ?? 0)) })
  })

  if (clampedCount > 0 && pageCount > 0) {
    warnings.push(
      `${clampedCount} ${clampedCount === 1 ? 'entrada apontava' : 'entradas apontavam'} para além da última página (${pageCount}) e ${clampedCount === 1 ? 'foi ajustada' : 'foram ajustadas'}.`
    )
  }

  const outOfOrder = entries.some((entry, i) => i > 0 && entry.page < entries[i - 1].page)
  if (outOfOrder) {
    warnings.push('As páginas não estão em ordem crescente — confira antes de salvar.')
  }

  return { entries, issues, warnings }
}
