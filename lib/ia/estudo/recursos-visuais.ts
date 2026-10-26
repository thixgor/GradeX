/**
 * O material de apoio de uma questão gerada por IA: tabela, gráfico, esquema
 * ou citação — o que uma prova de verdade põe entre o enunciado e o comando.
 *
 * Vive como DADO, não como imagem: a IA devolve linhas e números, a tela
 * desenha em HTML/SVG (`components/provas/recurso-visual.tsx`) e o PDF com
 * primitivas do jsPDF (`lib/pdf/recurso-visual-pdf.ts`). Nada de gerar imagem
 * — custaria tokens de imagem, Blob e transferência para mostrar uma tabela de
 * quatro linhas.
 *
 * Puro e client-safe: a tela, o PDF e o servidor leem daqui. Tudo que vem da
 * IA passa por `sanitizarRecurso`, que corta tamanho e descarta o que não
 * desenha (um gráfico sem número, uma tabela sem linha).
 */

export type TipoDeRecurso = 'tabela' | 'grafico' | 'esquema' | 'citacao'

export const TIPOS_DE_RECURSO: { id: TipoDeRecurso; rotulo: string; descricao: string }[] = [
  { id: 'tabela', rotulo: 'Tabelas', descricao: 'Dados laboratoriais, comparações, achados' },
  { id: 'grafico', rotulo: 'Gráficos', descricao: 'Curvas, séries e barras para interpretar' },
  { id: 'esquema', rotulo: 'Esquemas', descricao: 'Fluxos, vias e sequências de eventos' },
  { id: 'citacao', rotulo: 'Citações', descricao: 'Trecho de diretriz, artigo ou autor' },
]

export interface RecursoTabela {
  tipo: 'tabela'
  titulo?: string
  cabecalho: string[]
  linhas: string[][]
  fonte?: string
}

export interface SerieDoGrafico {
  nome: string
  valores: number[]
}

export interface RecursoGrafico {
  tipo: 'grafico'
  titulo?: string
  forma: 'barras' | 'linha'
  /** Rótulos do eixo X, um por ponto. */
  rotulos: string[]
  series: SerieDoGrafico[]
  eixoY?: string
  fonte?: string
}

export interface RecursoEsquema {
  tipo: 'esquema'
  titulo?: string
  /** Fluxo de cima para baixo (ou ciclo, que volta ao primeiro). */
  forma: 'fluxo' | 'ciclo'
  etapas: string[]
  fonte?: string
}

export interface RecursoCitacao {
  tipo: 'citacao'
  texto: string
  autor?: string
  fonte?: string
}

export type RecursoVisual = RecursoTabela | RecursoGrafico | RecursoEsquema | RecursoCitacao

const texto = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : typeof v === 'number' ? String(v) : ''

const opcional = (v: unknown, max: number): string | undefined => texto(v, max) || undefined

function numero(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(',', '.')) : NaN
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null
}

/**
 * Lê o recurso que a IA mandou (formato achatado do esquema JSON, ver
 * `ESQUEMA_RECURSO` no gerador) e devolve um recurso desenhável — ou `null`.
 */
export function sanitizarRecurso(bruto: unknown): RecursoVisual | null {
  if (!bruto || typeof bruto !== 'object') return null
  const r = bruto as Record<string, unknown>
  const tipo = texto(r.tipo, 20).toLowerCase()
  const titulo = opcional(r.titulo, 140)
  const fonte = opcional(r.fonte, 200)

  if (tipo === 'tabela') {
    const cabecalho = (Array.isArray(r.cabecalho) ? r.cabecalho : []).map((c) => texto(c, 60)).slice(0, 6)
    const colunas = cabecalho.length
    if (colunas < 2) return null
    const linhas = (Array.isArray(r.linhas) ? r.linhas : [])
      .filter(Array.isArray)
      .slice(0, 10)
      .map((linha) => {
        const celulas = (linha as unknown[]).map((c) => texto(c, 80)).slice(0, colunas)
        while (celulas.length < colunas) celulas.push('')
        return celulas
      })
      .filter((linha) => linha.some(Boolean))
    if (linhas.length === 0) return null
    return { tipo: 'tabela', titulo, cabecalho, linhas, fonte }
  }

  if (tipo === 'grafico') {
    const rotulos = (Array.isArray(r.rotulos) ? r.rotulos : []).map((c) => texto(c, 24)).slice(0, 12)
    if (rotulos.length < 2) return null
    const series = (Array.isArray(r.series) ? r.series : [])
      .slice(0, 3)
      .map((s, i): SerieDoGrafico | null => {
        const serie = (s || {}) as Record<string, unknown>
        const valores = (Array.isArray(serie.valores) ? serie.valores : []).slice(0, rotulos.length).map(numero)
        if (valores.length !== rotulos.length || valores.some((v) => v === null)) return null
        return { nome: texto(serie.nome, 40) || `Série ${i + 1}`, valores: valores as number[] }
      })
      .filter((s): s is SerieDoGrafico => s !== null)
    if (series.length === 0) return null
    const forma = texto(r.forma, 10) === 'linha' ? 'linha' : 'barras'
    return { tipo: 'grafico', titulo, forma, rotulos, series, eixoY: opcional(r.eixoY, 40), fonte }
  }

  if (tipo === 'esquema') {
    const etapas = (Array.isArray(r.etapas) ? r.etapas : []).map((c) => texto(c, 90)).filter(Boolean).slice(0, 7)
    if (etapas.length < 2) return null
    const forma = texto(r.forma, 10) === 'ciclo' ? 'ciclo' : 'fluxo'
    return { tipo: 'esquema', titulo, forma, etapas, fonte }
  }

  if (tipo === 'citacao') {
    const corpo = texto(r.texto, 700)
    if (corpo.length < 20) return null
    return { tipo: 'citacao', texto: corpo, autor: opcional(r.autor, 120), fonte }
  }

  return null
}

/** O recurso em texto corrido — para quem não desenha (busca, cópia, leitor de tela). */
export function recursoEmTexto(recurso: RecursoVisual): string {
  switch (recurso.tipo) {
    case 'tabela':
      return [
        recurso.titulo,
        recurso.cabecalho.join(' | '),
        ...recurso.linhas.map((l) => l.join(' | ')),
      ]
        .filter(Boolean)
        .join('\n')
    case 'grafico':
      return [
        recurso.titulo,
        ...recurso.series.map(
          (s) => `${s.nome}: ${recurso.rotulos.map((r, i) => `${r} = ${s.valores[i]}`).join('; ')}`,
        ),
      ]
        .filter(Boolean)
        .join('\n')
    case 'esquema':
      return [recurso.titulo, recurso.etapas.join(recurso.forma === 'ciclo' ? ' → … → ' : ' → ')].filter(Boolean).join('\n')
    case 'citacao':
      return `“${recurso.texto}”${recurso.autor ? ` — ${recurso.autor}` : ''}`
  }
}

/**
 * Escala "bonita" para o eixo Y: o máximo arredondado para 1, 2, 2,5 ou 5 × 10ⁿ.
 * Barras começam no zero (o comprimento é o dado); linhas podem começar perto
 * do menor valor — senão uma PA que vai de 150 a 128 vira uma reta.
 */
export function escalaDoEixo(maximo: number, minimo = 0, incluirZero = true): { min: number; max: number; passo: number } {
  const piso = incluirZero ? Math.min(0, minimo) : minimo
  const amplitude = Math.max(maximo - piso, Math.abs(maximo) * 0.1 || 1)
  const bruto = amplitude / 4
  const potencia = Math.pow(10, Math.floor(Math.log10(bruto)))
  const fator = [1, 2, 2.5, 5, 10].find((f) => f * potencia >= bruto) ?? 10
  const passo = fator * potencia
  return { min: Math.floor(piso / passo) * passo, max: Math.ceil(maximo / passo) * passo || passo, passo }
}

/** Número em português, sem casas inúteis. */
export function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}
