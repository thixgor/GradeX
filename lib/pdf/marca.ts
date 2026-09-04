import type jsPDF from 'jspdf'

/**
 * A base compartilhada dos PDFs da plataforma: fontes, marca, cabeçalho e rodapé.
 *
 * ## Por que este arquivo existe
 *
 * Havia duas implementações da mesma coisa. `lib/pdf-generator.ts` (os PDFs de
 * `/provas`) registrava a Roboto embutida, tinha um sanitizador de fallback,
 * carregava o logo e desenhava o cabeçalho verde com ele. `lib/user-report-generator.ts`
 * (o relatório do aluno) tinha um cabeçalho parecido de longe, sem logo, e
 * escrevia tudo em `helvetica` — a fonte padrão do jsPDF.
 *
 * E "helvetica" no jsPDF não é um detalhe de estilo. As 14 fontes padrão do PDF
 * usam WinAnsiEncoding, que não tem `✓`. Quando o jsPDF encontra um caractere
 * fora dessa tabela, ele reescreve a **linha inteira** em UTF-16BE e continua
 * declarando a fonte WinAnsi — cada letra ASCII vira dois bytes, e o byte nulo
 * da frente é desenhado como um espaço:
 *
 *     (✓ A) O aumento do volume…)   →   ('   A \)   O   a u m e n t o …) Tj
 *
 * É exatamente o defeito da alternativa correta no relatório: o `✓` saía como
 * `'`, o texto saía soletrado e vazava para fora da tarja verde — porque
 * `getTextWidth`, usado para quebrar a linha, media a versão de um byte
 * enquanto a página desenhava a de dois. Uma linha "que cabe" com o dobro da
 * largura.
 *
 * A Roboto embutida resolve as duas pontas (glifo real e métrica coerente), e o
 * fallback textual cobre o caso de o TTF não carregar. Ter isso em UM lugar é o
 * ponto: a correção não pode valer só para o gerador que alguém lembrou de
 * arrumar.
 */

// ── Cores da paleta DomineAqui ───────────────────────────────────
export const VERDE_ESCURO: [number, number, number] = [26, 71, 42]
export const VERDE_MEDIO: [number, number, number] = [70, 129, 82]
export const LARANJA: [number, number, number] = [226, 164, 62]
export const LARANJA_CLARO: [number, number, number] = [245, 216, 154]
export const CINZA_TEXTO: [number, number, number] = [51, 51, 51]
export const CINZA_CLARO: [number, number, number] = [245, 245, 245]

// ── Registro das fontes (Roboto TTF, Unicode completo/PT-BR) ─────
export type EstiloDeFonte = 'normal' | 'bold' | 'italic' | 'bolditalic'

let FAMILIA = 'helvetica'
const cacheDeFontes: { file: string; style: EstiloDeFonte; b64: string }[] = []
let promessaDeAquecimento: Promise<void> | null = null

/** A família ativa: `'Roboto'` quando o TTF carregou, `'helvetica'` no fallback. */
export function fonteAtiva(): string {
  return FAMILIA
}

function bufferParaBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const pedacos: string[] = []
  const tamanho = 8192
  for (let i = 0; i < bytes.length; i += tamanho) {
    pedacos.push(String.fromCharCode(...bytes.subarray(i, i + tamanho)))
  }
  return btoa(pedacos.join(''))
}

/** Baixa e guarda os TTFs sem precisar de um documento. Seguro chamar cedo. */
export async function aquecerFontes(): Promise<void> {
  if (cacheDeFontes.length > 0) return
  if (promessaDeAquecimento) return promessaDeAquecimento
  promessaDeAquecimento = (async () => {
    try {
      const variantes: { file: string; style: EstiloDeFonte }[] = [
        { file: 'Roboto-Regular.ttf', style: 'normal' },
        { file: 'Roboto-Bold.ttf', style: 'bold' },
        { file: 'Roboto-Italic.ttf', style: 'italic' },
        { file: 'Roboto-BoldItalic.ttf', style: 'bolditalic' },
      ]
      const resultados = await Promise.all(
        variantes.map(async (v) => {
          const res = await fetch(`/fonts/${v.file}`)
          if (!res.ok) throw new Error(`Font not found: ${v.file}`)
          return { ...v, data: await res.arrayBuffer() }
        }),
      )
      for (const r of resultados) {
        cacheDeFontes.push({ file: r.file, style: r.style, b64: bufferParaBase64(r.data) })
      }
      FAMILIA = 'Roboto'
    } catch {
      FAMILIA = 'helvetica'
    }
  })()
  return promessaDeAquecimento
}

/**
 * Embute as fontes NESTE documento e devolve a família a usar.
 *
 * O registro é por documento (`addFileToVFS`/`addFont`), então todo gerador
 * precisa chamar isto no seu próprio `new jsPDF()` — aquecer o cache não basta.
 */
export async function registrarFontes(doc: jsPDF): Promise<string> {
  await aquecerFontes()
  if (cacheDeFontes.length > 0) {
    for (const f of cacheDeFontes) {
      doc.addFileToVFS(f.file, f.b64)
      doc.addFont(f.file, 'Roboto', f.style)
    }
    FAMILIA = 'Roboto'
    doc.setFont('Roboto')
  }
  return FAMILIA
}

/**
 * Prepara o texto para a fonte que está de fato ativa.
 *
 * Com a Roboto embutida não há o que trocar — ela tem os glifos. Sem ela, cada
 * caractere fora do WinAnsi que passar daqui reescreve a linha inteira em
 * UTF-16 (ver o cabeçalho deste arquivo), então eles viram equivalentes ASCII.
 */
export function sanitizarParaPdf(texto: string): string {
  if (!texto) return texto
  // Invisíveis por escape, não pelo caractere: um zero-width colado no
  // arquivo é indistinguível de um erro de digitação na próxima leitura.
  const t = texto.replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '')
  if (FAMILIA === 'Roboto') return t
  return t
    .replace(/₀/g, '0').replace(/₁/g, '1').replace(/₂/g, '2').replace(/₃/g, '3')
    .replace(/₄/g, '4').replace(/₅/g, '5').replace(/₆/g, '6').replace(/₇/g, '7')
    .replace(/₈/g, '8').replace(/₉/g, '9')
    .replace(/⁰/g, '0').replace(/⁴/g, '4').replace(/⁵/g, '5').replace(/⁶/g, '6')
    .replace(/⁷/g, '7').replace(/⁸/g, '8').replace(/⁹/g, '9')
    .replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/≠/g, '!=').replace(/≈/g, '~')
    .replace(/→/g, '->').replace(/←/g, '<-').replace(/↑/g, '^').replace(/↓/g, 'v')
    .replace(/↔/g, '<->').replace(/∞/g, 'inf')
    .replace(/α/g, 'alfa').replace(/β/g, 'beta').replace(/γ/g, 'gama')
    .replace(/δ/g, 'delta').replace(/Δ/g, 'Delta').replace(/μ/g, 'u')
    .replace(/✓/g, 'V').replace(/✔/g, 'V').replace(/✗/g, 'X').replace(/✘/g, 'X')
}

// ── Logo (cache de /logo.png) ────────────────────────────────────
let cacheDoLogo: string | null | undefined = undefined

export async function carregarLogo(): Promise<string | null> {
  if (cacheDoLogo !== undefined) return cacheDoLogo
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      const limite = setTimeout(() => {
        cacheDoLogo = null
        resolve(null)
      }, 6000)
      img.onload = () => {
        clearTimeout(limite)
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            cacheDoLogo = null
            resolve(null)
            return
          }
          // O fundo do cabeçalho é pintado antes: em JPEG não há transparência,
          // e sem isto os pixels vazados do logo sairiam pretos.
          ctx.fillStyle = 'rgb(26, 71, 41)'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          cacheDoLogo = canvas.toDataURL('image/jpeg', 0.92)
          resolve(cacheDoLogo)
        } catch {
          cacheDoLogo = null
          resolve(null)
        }
      }
      img.onerror = () => {
        clearTimeout(limite)
        cacheDoLogo = null
        resolve(null)
      }
      img.src = '/logo.png'
    })
  } catch {
    cacheDoLogo = null
    return null
  }
}

/** Deixa fontes e logo quentes antes de alguém clicar num botão de PDF. */
export function aquecerAssetsDePdf(): void {
  if (typeof window === 'undefined') return
  aquecerFontes().catch(() => {})
  carregarLogo().catch(() => {})
}

// ── Cabeçalho e rodapé ───────────────────────────────────────────

/**
 * A faixa verde com o logo. Devolve o `y` em que o conteúdo pode começar.
 *
 * É a mesma dos PDFs de `/provas` — o relatório do aluno tinha uma faixa
 * parecida, mas com o nome escrito à mão e sem imagem nenhuma: o único PDF da
 * plataforma que saía sem a marca.
 */
export function desenharCabecalho(
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  subtitulo?: string,
  logo?: string | null,
): number {
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, pageWidth, 30, 'F')

  doc.setFillColor(...LARANJA)
  doc.rect(pageWidth - 65, 0, 65, 30, 'F')

  let temLogo = !!logo
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, 4, 22, 22)
    } catch {
      temLogo = false
    }
  }
  const textoX = temLogo ? margin + 26 : margin

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont(FAMILIA, 'bold')
  doc.text('DomineAqui', textoX, subtitulo ? 12 : 18)

  if (subtitulo) {
    doc.setFontSize(9)
    doc.setFont(FAMILIA, 'normal')
    doc.text(sanitizarParaPdf(subtitulo), textoX, 22)
  }

  doc.setFontSize(7.5)
  doc.setTextColor(255, 255, 255)
  doc.text('www.domineaqui.com.br', pageWidth - 62, 19, { align: 'left' })

  // Devolve o estado de texto ao padrão do corpo: sem isto o primeiro
  // parágrafo depois do cabeçalho sai branco sobre branco.
  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(10)
  doc.setFont(FAMILIA, 'normal')

  return 40
}

export function desenharRodape(
  doc: jsPDF,
  pagina: number,
  totalDePaginas: number,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  textoExtra?: string,
  legenda = 'Manual / Provas',
): void {
  const rodapeY = pageHeight - 12

  doc.setFillColor(...CINZA_CLARO)
  doc.rect(0, rodapeY - 6, pageWidth, 18, 'F')

  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(1)
  doc.line(0, rodapeY - 6, pageWidth * 0.7, rodapeY - 6)
  doc.setDrawColor(...LARANJA)
  doc.line(pageWidth * 0.7, rodapeY - 6, pageWidth, rodapeY - 6)

  doc.setFontSize(8)
  doc.setTextColor(70, 70, 70)
  doc.setFont(FAMILIA, 'bold')
  doc.text('DomineAqui', margin, rodapeY + 1)
  doc.setFont(FAMILIA, 'normal')
  const larguraDoNome = doc.getTextWidth('DomineAqui')
  doc.text(` - ${legenda}`, margin + larguraDoNome + 1, rodapeY + 1)
  doc.text(`Página ${pagina} de ${totalDePaginas}`, pageWidth - margin, rodapeY + 1, { align: 'right' })

  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  doc.setFontSize(6.5)
  doc.setTextColor(100, 100, 100)
  doc.text(sanitizarParaPdf(textoExtra || `Gerado em ${dataGeracao}`), pageWidth / 2, rodapeY - 1, {
    align: 'center',
  })
  doc.setFont(FAMILIA, 'italic')
  doc.text('Criado por Thiago Rodrigues', pageWidth / 2, rodapeY + 4, { align: 'center' })
}

// ── Marcas de certo/errado, desenhadas em vetor ──────────────────

/**
 * O "certo" é desenhado, não escrito.
 *
 * Mesmo com a Roboto embutida, um `✓` no meio do texto muda a largura da linha
 * e depende do glifo existir na fonte que estiver valendo. Um círculo com dois
 * traços não depende de fonte nenhuma, imprime igual em qualquer leitor e é o
 * que os PDFs de `/provas` já faziam.
 */
export function marcarCerto(doc: jsPDF, x: number, y: number): void {
  doc.setFillColor(...VERDE_MEDIO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.circle(x, y, 3, 'F')
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.7)
  doc.line(x - 1.3, y, x - 0.2, y + 1.2)
  doc.line(x - 0.2, y + 1.2, x + 1.5, y - 1.5)
}

/** O "errado": círculo vermelho com um X branco. */
export function marcarErrado(doc: jsPDF, x: number, y: number): void {
  doc.setFillColor(220, 38, 38)
  doc.setDrawColor(220, 38, 38)
  doc.circle(x, y, 3, 'F')
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.7)
  doc.line(x - 1.3, y - 1.3, x + 1.3, y + 1.3)
  doc.line(x + 1.3, y - 1.3, x - 1.3, y + 1.3)
}

/** A caixinha vazia das alternativas que não foram marcadas nem são a certa. */
export function marcarNeutro(doc: jsPDF, x: number, y: number): void {
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.4)
  doc.roundedRect(x - 2.5, y - 2.5, 5, 5, 1, 1)
}
