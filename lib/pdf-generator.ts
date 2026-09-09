import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Exam, Question, UserAnswer, QuestionAnnotation, Form, FormBlock } from './types'
import { decodeHtmlEntities } from './html-entities'

// ── Base da marca (fontes, logo, cabeçalho e rodapé) ─────────────
// Tudo isto morava aqui e havia sido reescrito pela metade em
// `lib/user-report-generator.ts` — com `helvetica` no lugar da Roboto, o que
// soletrava qualquer linha com um caractere fora do WinAnsi. Agora é um lugar
// só; ver `lib/pdf/marca.ts`.
import {
  CINZA_CLARO,
  CINZA_TEXTO,
  LARANJA,
  LARANJA_CLARO,
  VERDE_ESCURO,
  VERDE_MEDIO,
  aquecerAssetsDePdf,
  aquecerFontes as prewarmFontsCache,
  carregarLogo as loadLogo,
  desenharCabecalho,
  desenharRodape,
  registrarFontes,
  sanitizarParaPdf as sanitizeForPdf,
} from './pdf/marca'
import { ALTURA_MAXIMA_DA_IMAGEM, desenharImagensNoPdf } from './pdf/imagens-de-questao'
import type { ImagemDeQuestao, LayoutDeImagens } from './questoes/imagens'
import { desenharLinhaRica, quebrarTexto } from './pdf/texto'
// Reexportado: o módulo saiu daqui (ver lib/provas/resposta-comentada.ts), e
// os testes e o relatório do aluno continuam encontrando o nome no lugar de
// sempre.
export { montarRespostaComentada } from './provas/resposta-comentada'
import { montarRespostaComentada } from './provas/resposta-comentada'
import {
  blocoDaQuestaoDoBanco,
  blocoDaResposta,
  blocoDoEnunciado,
  imagensDaExplicacaoDoBanco,
  layoutDaExplicacaoDoBanco,
  urlsDaQuestao,
} from './questoes/imagens-da-questao'

/**
 * A família ativa neste arquivo.
 *
 * Continua sendo uma variável de módulo porque as centenas de
 * `doc.setFont(FONT, ...)` daqui dependem dela; quem a mantém em dia é
 * `registerFonts`, logo abaixo.
 */
let FONT = 'helvetica'

async function registerFonts(doc: jsPDF): Promise<void> {
  FONT = await registrarFontes(doc)
}

/**
 * Export for pages to call on mount so fonts+logo are hot by the time
 * the user clicks a PDF button.
 */
export function prewarmPDFAssets(): void {
  aquecerAssetsDePdf()
}

// A quebra de linha e o negrito inline moram em `lib/pdf/texto.ts` — eram duas
// cópias divergentes (esta e a do relatório do aluno). Os nomes locais ficam
// para não reescrever as centenas de chamadas deste arquivo.
const wrapText = quebrarTexto

// Render a line with inline **bold** and *italic* markdown support.
function drawRichLine(
  doc: jsPDF,
  line: string,
  x: number,
  y: number,
  baseStyle: 'normal' | 'bold' | 'italic' = 'normal'
): void {
  desenharLinhaRica(doc, FONT, line, x, y, baseStyle)
}

// ── Session-level image cache — persists across all PDF calls in one tab ──
type ImgData = { dataUrl: string; width: number; height: number }
const _sessionImageCache = new Map<string, ImgData | null>()
// Per-URL in-flight promises to avoid duplicate fetches
const _imageInFlight = new Map<string, Promise<ImgData | null>>()

async function fetchImageAsBase64(url: string): Promise<ImgData | null> {
  // Cache hit
  if (_sessionImageCache.has(url)) return _sessionImageCache.get(url) ?? null
  // Deduplicate concurrent fetches for the same URL
  if (_imageInFlight.has(url)) return _imageInFlight.get(url)!

  const promise = (async (): Promise<ImgData | null> => {
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
            if (!ctx) { resolve(null); return }
            ctx.drawImage(img, 0, 0)
            // JPEG is 3-5× faster to encode than PNG and produces 60-80% smaller strings
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
            resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight })
          } catch { resolve(null) }
        }
        img.onerror = () => resolve(null)
        setTimeout(() => resolve(null), 8000)
        img.src = url
      })
    } catch { return null }
  })()

  _imageInFlight.set(url, promise)
  const result = await promise
  _sessionImageCache.set(url, result)
  _imageInFlight.delete(url)
  return result
}

/**
 * As questões da prova — sempre um array.
 *
 * A lista de /provas vem sem `questions` de propósito (`campos=lista`), e um
 * caminho que chegue aqui sem ter buscado a prova completa quebrava em
 * `undefined.filter`: uma exceção no console e nenhum arquivo. O PDF sai com o
 * que a prova tiver; quem precisa das questões as busca antes (ver
 * `carregarProvasCompletas` em app/provas/page.tsx).
 */
function questoesDaProva(exam: Partial<Exam>): Question[] {
  return Array.isArray(exam.questions) ? exam.questions : []
}

/**
 * Baixa TODAS as imagens da prova de uma vez — enunciado e resposta comentada.
 *
 * Antes só `imageUrl` era buscado, então uma segunda imagem do enunciado ou
 * qualquer imagem do gabarito comentado chegava na hora de desenhar sem bytes
 * nenhum e era pulada em silêncio. A deduplicação por URL continua valendo (o
 * `Set`), e o cache de sessão de `fetchImageAsBase64` garante que a mesma
 * imagem usada em duas questões desça uma vez só.
 */
async function prefetchExamImages(questions: Question[] | undefined): Promise<Map<string, ImgData>> {
  const imageMap = new Map<string, ImgData>()
  const urls = Array.from(new Set((questions || []).flatMap((q) => urlsDaQuestao(q))))
  await Promise.all(
    urls.map(async (url) => {
      const result = await fetchImageAsBase64(url)
      if (result) imageMap.set(url, result)
    })
  )
  return imageMap
}

/**
 * O desenhador de imagens deste documento.
 *
 * Cada gerador tem o seu `y`, o seu subtítulo de cabeçalho e a sua margem; o
 * que é IGUAL entre eles — a conta do tamanho, a quebra de página que não
 * separa a figura do crédito, o lado a lado — mora em
 * `lib/pdf/imagens-de-questao.ts`. Esta fábrica só amarra os dois.
 */
function criarDesenhoDeImagens(
  doc: jsPDF,
  imageMap: Map<string, ImgData>,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  logo: string | null,
) {
  return (
    bloco: { imagens: ImagemDeQuestao[]; layout: LayoutDeImagens },
    y: number,
    subtitulo: string,
    opcoes: { recuo?: number; alturaMaxima?: number } = {},
  ): number => {
    if (bloco.imagens.length === 0) return y
    const recuo = opcoes.recuo ?? 0
    return desenharImagensNoPdf(doc, bloco.imagens, bloco.layout, imageMap, {
      x: margin + recuo,
      largura: pageWidth - 2 * margin - recuo,
      y,
      limiteY: pageHeight - 25,
      alturaMaxima: opcoes.alturaMaxima,
      fonte: FONT,
      novaPagina: () => {
        doc.addPage()
        return addDomineAquiHeader(doc, pageWidth, margin, subtitulo, logo)
      },
    })
  }
}

// Adiciona header padrão DomineAqui (com logo se disponível)
function addDomineAquiHeader(doc: jsPDF, pageWidth: number, margin: number, subtitle?: string, logoData?: string | null) {
  return desenharCabecalho(doc, pageWidth, margin, subtitle, logoData)
}

// Adiciona footer padrão DomineAqui
function addDomineAquiFooter(doc: jsPDF, pageNum: number, totalPages: number, pageWidth: number, pageHeight: number, margin: number, extraText?: string) {
  desenharRodape(doc, pageNum, totalPages, pageWidth, pageHeight, margin, extraText)
}

export async function generateGabaritoPDF(exam: Exam): Promise<Blob> {
  const questoes = questoesDaProva(exam)
  // `numberOfQuestions` é o número declarado na prova; quando ele falta, o que
  // está escrito no documento é a contagem real do que foi impresso.
  const totalDeQuestoes = exam.numberOfQuestions ?? questoes.length
  const doc = new jsPDF()
  await registerFonts(doc)
  const logo = await loadLogo()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Gabarito Oficial', logo)
      return true
    }
    return false
  }

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Gabarito Oficial', logo)

  // === INFORMAÇÕES DA PROVA ===
  // Box com título da prova
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setFillColor(...CINZA_CLARO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont(FONT, 'bold')
  doc.text(exam.title, pageWidth / 2, y + 13, { align: 'center' })

  y += 28

  // Descrição se existir
  if (exam.description) {
    doc.setFontSize(10)
    doc.setFont(FONT, 'normal')
    doc.setTextColor(100, 100, 100)
    const descLines = wrapText(doc, exam.description, pageWidth - 2 * margin)
    doc.text(descLines, pageWidth / 2, y, { align: 'center' })
    y += descLines.length * 5 + 8
  }

  // Informações em duas colunas
  const colWidth = (pageWidth - 2 * margin - 10) / 2

  // Coluna 1 - Total de questões
  doc.setFillColor(...LARANJA_CLARO)
  doc.roundedRect(margin, y, colWidth, 25, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFont(FONT, 'normal')
  doc.text('TOTAL DE QUESTÕES', margin + 5, y + 8)
  doc.setFontSize(16)
  doc.setFont(FONT, 'bold')
  doc.text(totalDeQuestoes.toString(), margin + 5, y + 19)

  // Coluna 2 - Pontuação
  doc.setFillColor(...LARANJA_CLARO)
  doc.roundedRect(margin + colWidth + 10, y, colWidth, 25, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFont(FONT, 'normal')
  doc.text('PONTUAÇÃO', margin + colWidth + 15, y + 8)
  doc.setFontSize(16)
  doc.setFont(FONT, 'bold')
  // `exam.totalPoints` pode não existir (prova discursiva, prova antiga): o
  // texto dizia "undefined pontos" no gabarito oficial, impresso.
  doc.text(
    exam.scoringMethod === 'tri'
      ? '1000 pontos (TRI)'
      : exam.totalPoints
        ? `${exam.totalPoints} pontos`
        : '—',
    margin + colWidth + 15,
    y + 19
  )

  y += 35

  // === RESPOSTAS ===
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont(FONT, 'bold')
  doc.text('GABARITO', pageWidth / 2, y + 7, { align: 'center' })

  y += 18

  // Grid de respostas (5 colunas)
  const columns = 5
  const columnWidth = (pageWidth - 2 * margin) / columns
  let currentCol = 0
  let currentRow = 0
  const rowHeight = 12
  const cellPadding = 2

  questoes.forEach((question: Question, index: number) => {
    // Verifica se precisa de nova página
    if (checkPage(rowHeight + 5)) {
      currentRow = 0
      currentCol = 0
    }

    // `|| []` porque discursiva e redação podem chegar sem o array: o gabarito
    // delas é um traço, não uma exceção que derruba o arquivo inteiro.
    const correctAlternative = (question.alternatives || []).find(alt => alt.isCorrect)
    const answerLetter = correctAlternative?.letter || '-'

    const x = margin + currentCol * columnWidth
    const cellY = y + currentRow * rowHeight

    // Alternar cores de fundo
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250)
    } else {
      doc.setFillColor(...LARANJA_CLARO)
    }
    doc.rect(x, cellY - 7, columnWidth - 2, rowHeight, 'F')

    // Número da questão
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    doc.setFont(FONT, 'normal')
    doc.text(`${question.number}.`, x + cellPadding, cellY)

    // Resposta
    doc.setTextColor(...VERDE_ESCURO)
    doc.setFontSize(11)
    doc.setFont(FONT, 'bold')
    doc.text(answerLetter, x + cellPadding + 12, cellY)

    currentCol++
    if (currentCol >= columns) {
      currentCol = 0
      currentRow++
    }
  })

  // Ajusta y para após o grid
  y += Math.ceil(questoes.length / columns) * rowHeight + 15

  // === INFORMAÇÕES ADICIONAIS ===
  checkPage(60)

  // Separador
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Informações de pontuação
  doc.setFillColor(...CINZA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 45, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(11)
  doc.setFont(FONT, 'bold')

  if (exam.scoringMethod === 'tri') {
    doc.text('SISTEMA DE PONTUAÇÃO: TRI (Teoria de Resposta ao Item)', margin + 5, y + 10)
    doc.setFontSize(9)
    doc.setFont(FONT, 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    doc.text('A pontuação será calculada considerando:', margin + 5, y + 20)
    doc.text('• Dificuldade de cada questão (parâmetro b)', margin + 10, y + 27)
    doc.text('• Discriminação da questão (parâmetro a)', margin + 10, y + 33)
    doc.text('• Probabilidade de acerto ao acaso (parâmetro c)', margin + 10, y + 39)
  } else {
    doc.text(`SISTEMA DE PONTUAÇÃO: Normal`, margin + 5, y + 10)
    doc.setFontSize(9)
    doc.setFont(FONT, 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    const pointsPerQuestion = (exam.totalPoints || 100) / (totalDeQuestoes || 1)
    doc.text(`Pontuação máxima: ${exam.totalPoints || 100} pontos`, margin + 5, y + 20)
    doc.text(`Cada questão vale: ${pointsPerQuestion.toFixed(2)} pontos`, margin + 5, y + 27)
    doc.text(`Total de questões: ${totalDeQuestoes}`, margin + 5, y + 34)
  }

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin)
  }

  return doc.output('blob')
}

/**
 * A folha de respostas do aluno — só as letras que ele marcou.
 *
 * ## Por que este arquivo existe
 *
 * Os PDFs que a prova produzia eram todos pesados: o caderno inteiro em
 * branco, o caderno com as respostas dele, o gabarito comentado. Nenhum deles
 * atende o que o aluno quer nos cinco minutos depois de entregar — conferir
 * com os colegas o que cada um marcou. Para isso ele precisa de uma coluna de
 * letras, e recebia trinta páginas de enunciado.
 *
 * Como não tem enunciado nem gabarito, esta folha pode sair antes de a prova
 * terminar sem antecipar nada para ninguém: ela só devolve à pessoa o que a
 * própria pessoa acabou de escrever. É por isso que ela segue a ENTREGA, e não
 * o término (ver `lib/provas/downloads-da-prova.ts`).
 *
 * ## As duas versões
 *
 * `comparar: false` — só as letras dele. É a versão que sai enquanto a turma
 * ainda responde.
 *
 * `comparar: true` — as letras dele ao lado do gabarito oficial, com o acerto
 * marcado. Isto é gabarito, então só sai depois do término, e quem decide isso
 * é a regra de download, não esta função: aqui `comparar` apenas desenha o que
 * mandarem desenhar.
 */
export async function generateCompactAnswersPDF(
  exam: Exam,
  answers: UserAnswer[],
  userName: string,
  opcoes: { comparar?: boolean } = {},
): Promise<Blob> {
  const comparar = opcoes.comparar === true
  const questoes = questoesDaProva(exam)
  const doc = new jsPDF()
  await registerFonts(doc)
  const logo = await loadLogo()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const subtitulo = comparar ? 'Folha de Respostas — Comparada' : 'Folha de Respostas'

  let y = addDomineAquiHeader(doc, pageWidth, margin, subtitulo, logo)

  // === CABEÇALHO DA PROVA ===
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setFillColor(...CINZA_CLARO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(13)
  doc.setFont(FONT, 'bold')
  doc.text(sanitizeForPdf(exam.title), pageWidth / 2, y + 13, { align: 'center' })
  y += 26

  doc.setFontSize(10)
  doc.setFont(FONT, 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  doc.text(sanitizeForPdf(userName || 'Aluno'), margin, y)
  doc.text(
    new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    pageWidth - margin,
    y,
    { align: 'right' },
  )
  y += 10

  /*
   * A resposta é procurada por `questionId`.
   *
   * Com `shuffleQuestions` ligada, a ordem em que o aluno viu as questões não é
   * a ordem do documento — casar por índice trocaria as letras de lugar e
   * entregaria uma folha errada com cara de certa. O número impresso é o
   * `question.number`, o mesmo que o resto dos PDFs usa.
   */
  const porQuestao = new Map((answers || []).map((r) => [r.questionId, r]))

  const apenasObjetivas = questoes.filter((q) => Array.isArray(q.alternatives) && q.alternatives.length > 0)
  let acertos = 0
  let respondidas = 0

  const linhas = apenasObjetivas.map((questao) => {
    const resposta = porQuestao.get(questao.id)
    const marcada = questao.alternatives.find((alt) => alt.id === resposta?.selectedAlternative)
    const correta = questao.alternatives.find((alt) => alt.isCorrect)
    const letraMarcada = marcada?.letter || '—'
    if (marcada) respondidas++
    const acertou = !!marcada && !!correta && marcada.id === correta.id
    if (acertou) acertos++
    return {
      numero: questao.number,
      minha: letraMarcada,
      certa: correta?.letter || '—',
      acertou,
      respondida: !!marcada,
    }
  })

  // === RESUMO (só na versão comparada: sem gabarito não há acerto a contar) ===
  if (comparar && linhas.length > 0) {
    const larguraCaixa = (pageWidth - 2 * margin - 10) / 2
    doc.setFillColor(...LARANJA_CLARO)
    doc.roundedRect(margin, y, larguraCaixa, 22, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...VERDE_ESCURO)
    doc.setFont(FONT, 'normal')
    doc.text('ACERTOS', margin + 5, y + 8)
    doc.setFontSize(14)
    doc.setFont(FONT, 'bold')
    doc.text(`${acertos} de ${linhas.length}`, margin + 5, y + 18)

    doc.setFillColor(...LARANJA_CLARO)
    doc.roundedRect(margin + larguraCaixa + 10, y, larguraCaixa, 22, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...VERDE_ESCURO)
    doc.setFont(FONT, 'normal')
    doc.text('RESPONDIDAS', margin + larguraCaixa + 15, y + 8)
    doc.setFontSize(14)
    doc.setFont(FONT, 'bold')
    doc.text(`${respondidas} de ${linhas.length}`, margin + larguraCaixa + 15, y + 18)
    y += 30
  } else {
    y += 4
  }

  // === A GRADE DE LETRAS ===
  // Quatro colunas na versão simples, três na comparada (que precisa de duas
  // letras e do sinal por linha).
  const colunas = comparar ? 3 : 4
  const larguraColuna = (pageWidth - 2 * margin) / colunas
  const alturaLinha = 9
  let coluna = 0

  const cabecalhoDaGrade = () => {
    doc.setFontSize(8)
    doc.setFont(FONT, 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    for (let c = 0; c < colunas; c++) {
      const x = margin + c * larguraColuna
      doc.text('Nº', x + 3, y)
      doc.text('Sua', x + 16, y)
      if (comparar) doc.text('Gabarito', x + 32, y)
    }
    y += 4
    doc.setDrawColor(...VERDE_MEDIO)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
  }

  cabecalhoDaGrade()

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]

    if (coluna === 0 && y + alturaLinha > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, subtitulo, logo)
      y += 4
      cabecalhoDaGrade()
    }

    const x = margin + coluna * larguraColuna

    // Faixa alternada para o olho não pular de linha numa coluna de números.
    if (Math.floor(i / colunas) % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(x, y - 6, larguraColuna - 2, alturaLinha, 'F')
    }

    doc.setFontSize(9)
    doc.setFont(FONT, 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    doc.text(`${linha.numero}.`, x + 3, y)

    // A letra marcada. Em branco fica com o travessão, e não vazio: uma célula
    // vazia numa folha de respostas parece falha de impressão.
    doc.setFontSize(11)
    doc.setFont(FONT, 'bold')
    doc.setTextColor(linha.respondida ? 0 : 150, linha.respondida ? 0 : 150, linha.respondida ? 0 : 150)
    doc.text(linha.minha, x + 17, y)

    if (comparar) {
      doc.setFontSize(11)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      doc.text(linha.certa, x + 35, y)

      // O sinal, e não só a cor: daltonismo e impressão em preto e branco
      // apagariam a única informação que esta coluna carrega.
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      // Pelo sanitizador: sem a Roboto embutida, `✓` está fora do WinAnsi e o
      // jsPDF reescreve a LINHA INTEIRA em UTF-16 com uma fonte de um byte —
      // a folha sai soletrada. `sanitizeForPdf` o troca por `V` nesse caso e o
      // deixa em paz quando a Roboto carregou.
      if (linha.acertou) {
        doc.setTextColor(22, 128, 61)
        doc.text(sanitizeForPdf('✓'), x + 48, y)
      } else if (linha.respondida) {
        doc.setTextColor(190, 30, 45)
        doc.text(sanitizeForPdf('✗'), x + 48, y)
      }
    }

    coluna++
    if (coluna >= colunas) {
      coluna = 0
      y += alturaLinha
    }
  }

  if (coluna !== 0) y += alturaLinha

  // === QUESTÕES SEM ALTERNATIVA ===
  // Discursiva não tem letra para marcar. Dizer isso é melhor do que deixar a
  // pessoa contar por que a folha tem menos linhas do que a prova tem questões.
  const semAlternativa = questoes.length - apenasObjetivas.length
  if (semAlternativa > 0) {
    y += 6
    doc.setFontSize(9)
    doc.setFont(FONT, 'normal')
    doc.setTextColor(...CINZA_TEXTO)
    doc.text(
      semAlternativa === 1
        ? '1 questão discursiva não aparece nesta folha: ela não tem alternativa para marcar.'
        : `${semAlternativa} questões discursivas não aparecem nesta folha: elas não têm alternativa para marcar.`,
      margin,
      y,
    )
  }

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin)
  }

  return doc.output('blob')
}

export function downloadPDF(
  blob: Blob,
  filename: string,
  trackData?: { type: string; resourceId?: string; resourceTitle?: string }
) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  // Fire-and-forget download tracking
  if (trackData) {
    fetch('/api/track/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackData),
    }).catch(() => {})
  }
}

/**
 * Gera PDF da prova com gabarito e respostas comentadas (para provas práticas/treino)
 * Mostra cada questão com a alternativa correta destacada em verde e a explicação abaixo.
 */
export async function generateExamWithAnswersPDF(exam: Exam): Promise<Blob> {
  const questoes = questoesDaProva(exam)
  const [imageMap, logo] = await Promise.all([prefetchExamImages(questoes), loadLogo()])

  const doc = new jsPDF()
  await registerFonts(doc)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Prova com Gabarito', logo)
      return true
    }
    return false
  }

  const desenharImagens = criarDesenhoDeImagens(doc, imageMap, pageWidth, pageHeight, margin, logo)

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Prova com Gabarito', logo)

  // Título
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'FD')
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(16)
  doc.setFont(FONT, 'bold')
  doc.text(exam.title, pageWidth / 2, y + 10, { align: 'center' })
  if (exam.description) {
    doc.setFontSize(10)
    doc.setFont(FONT, 'normal')
    doc.text(exam.description, pageWidth / 2, y + 18, { align: 'center' })
  }
  y += 33

  // Badge "com gabarito"
  doc.setFillColor(26, 71, 42)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 9, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont(FONT, 'bold')
  doc.text(
    sanitizeForPdf('✓  GABARITO COMENTADO  —  Alternativas corretas destacadas em verde'),
    pageWidth / 2,
    y + 6,
    { align: 'center' },
  )
  y += 16

  // Questões
  questoes.forEach((question, idx) => {
    checkPage(50)

    // Header da questão
    doc.setFillColor(...VERDE_MEDIO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont(FONT, 'bold')
    doc.text(`Questão ${question.number ?? idx + 1}`, margin + 5, y + 7)

    // Tipo
    const typeLabel = question.type === 'discursive' ? 'Discursiva' : question.type === 'essay' ? 'Redação' : 'Múltipla Escolha'
    doc.setFontSize(8)
    doc.setFont(FONT, 'normal')
    doc.text(typeLabel, pageWidth - margin - 2, y + 7, { align: 'right' })
    y += 15

    // Reset color after header (prevents white text leaking into body)
    doc.setTextColor(...CINZA_TEXTO)
    doc.setFont(FONT, 'normal')

    // Enunciado
    if (question.statement) {
      checkPage(15)
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(8)
        // Re-apply color/font after possible page break
        doc.setFontSize(10)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        drawRichLine(doc, line, margin, y)
        y += 6
      })
      y += 2
    }

    // Fonte do enunciado
    if (question.statementSource) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Fonte: ${question.statementSource}`, margin, y)
      y += 6
    }

    // Imagens do enunciado
    y = desenharImagens(blocoDoEnunciado(question), y, 'Prova com Gabarito')

    // Comando
    if (question.command) {
      checkPage(12)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const commandLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      commandLines.forEach((line: string) => {
        checkPage(8)
        doc.setFont(FONT, 'bold')
        doc.setTextColor(...VERDE_ESCURO)
        drawRichLine(doc, line, margin, y, 'bold')
        y += 6
      })
      y += 3
    }

    if (question.type === 'multiple-choice') {
      y += 2
      question.alternatives.forEach((alt) => {
        const isCorrect = alt.isCorrect
        const altText = `${alt.letter}) ${alt.text}`
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 12)
        // rect height: covers text lines with top/bottom padding (3+2), no bleed into gap
        const rectH = altLines.length * 6 + 3
        checkPage(rectH + 3)

        // Fundo verde claro dinâmico para alternativa correta
        if (isCorrect) {
          doc.setFillColor(220, 245, 225)
          doc.setDrawColor(70, 129, 82)
          doc.setLineWidth(0.5)
          doc.roundedRect(margin + 1, y - 3, pageWidth - 2 * margin - 2, rectH, 1.5, 1.5, 'FD')
        }

        doc.setFont(FONT, isCorrect ? 'bold' : 'normal')
        doc.setFontSize(10)
        doc.setTextColor(isCorrect ? 26 : CINZA_TEXTO[0], isCorrect ? 71 : CINZA_TEXTO[1], isCorrect ? 42 : CINZA_TEXTO[2])

        // Ícone: checkmark desenhado com linhas (correto) ou checkbox vazio (errado)
        if (isCorrect) {
          // Círculo verde preenchido com checkmark via linhas
          doc.setFillColor(70, 129, 82)
          doc.setDrawColor(70, 129, 82)
          doc.circle(margin + 4.5, y - 1.5, 3, 'F')
          doc.setDrawColor(255, 255, 255)
          doc.setLineWidth(0.7)
          doc.line(margin + 3.2, y - 1.5, margin + 4.3, y - 0.3)
          doc.line(margin + 4.3, y - 0.3, margin + 6, y - 3)
        } else {
          doc.setDrawColor(...VERDE_MEDIO)
          doc.setLineWidth(0.4)
          doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1)
        }

        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) {
            doc.setFontSize(10)
            doc.setTextColor(isCorrect ? 26 : CINZA_TEXTO[0], isCorrect ? 71 : CINZA_TEXTO[1], isCorrect ? 42 : CINZA_TEXTO[2])
          }
          drawRichLine(doc, line, margin + 10, y, isCorrect ? 'bold' : 'normal')
          y += 6
        })
        y += 3
      })
    } else if (question.type === 'discursive') {
      checkPage(20)
      doc.setFontSize(9)
      doc.setFont(FONT, 'italic')
      doc.setTextColor(100, 100, 100)
      doc.text('(Questão discursiva — ver gabarito/pontos-chave abaixo)', margin + 2, y)
      y += 8
    }

    // Resposta comentada: explicação avulsa + comentário por alternativa +
    // pontos-chave, na ordem de `montarRespostaComentada`. Ler só
    // `question.explanation` aqui era o que fazia este PDF sair sem comentário
    // nenhum nas provas cujo feedback está por alternativa.
    const respostaComentada = montarRespostaComentada(question)
    if (respostaComentada) {
      // Set font matching rendering before wrapText so line widths are calculated correctly
      doc.setFontSize(9)
      doc.setFont(FONT, 'normal')
      const expLines = wrapText(doc, respostaComentada, pageWidth - 2 * margin - 14)
      if (expLines.length > 0) {
        const lineH = 6
        const headerH = 14
        const paddingBot = 5
        const boxW = pageWidth - 2 * margin

        let remaining = [...expLines]
        let isFirst = true

        while (remaining.length > 0) {
          // Ensure at least header (first chunk) or small top pad + 1 line + bottom fits
          checkPage((isFirst ? headerH : 4) + lineH + paddingBot)

          // Calculate how many lines fit in the available space
          const avail = pageHeight - 25 - y
          const linesHere = Math.max(1, Math.floor((avail - (isFirst ? headerH : 4) - paddingBot) / lineH))
          const batch = remaining.splice(0, linesHere)
          const batchH = (isFirst ? headerH : 4) + batch.length * lineH + paddingBot

          doc.setFillColor(245, 250, 246)
          doc.setDrawColor(70, 129, 82)
          doc.setLineWidth(0.5)
          doc.roundedRect(margin, y, boxW, batchH, 2, 2, 'FD')

          if (isFirst) {
            doc.setFontSize(8.5)
            doc.setFont(FONT, 'bold')
            doc.setTextColor(...VERDE_ESCURO)
            doc.text('Resposta Comentada:', margin + 4, y + 9)
            y += headerH
          } else {
            y += 4
          }

          doc.setFont(FONT, 'normal')
          doc.setFontSize(9)
          doc.setTextColor(...CINZA_TEXTO)
          batch.forEach((line: string) => {
            drawRichLine(doc, line, margin + 4, y)
            y += lineH
          })
          y += paddingBot
          isFirst = false
        }
        y += 2
      }
    }

    // As imagens da resposta comentada — o fluxograma, o esquema, a lâmina que
    // o comentário descreve. Ficam DEPOIS do texto, com o mesmo recuo da caixa
    // verde, para não flutuarem soltas entre uma questão e a seguinte.
    const imagensDoComentario = blocoDaResposta(question)
    if (imagensDoComentario.imagens.length > 0) {
      y = desenharImagens(imagensDoComentario, y + 1, 'Prova com Gabarito', {
        recuo: 4,
        alturaMaxima: ALTURA_MAXIMA_DA_IMAGEM * 0.8,
      })
    }

    // Separador entre questões, igual ao da prova em branco e ao do Banco.
    y += 5
    if (idx < questoes.length - 1) {
      checkPage(6)
      doc.setDrawColor(...LARANJA)
      doc.setLineWidth(0.4)
      doc.line(margin + 15, y, pageWidth - margin - 15, y)
      y += 8
    }
  })

  // Rodapé
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, exam.title)
  }

  return doc.output('blob')
}

// Gerar PDF da prova para alunos preencherem (client-side com jsPDF)
export async function generateExamPDF(exam: Exam, userId?: string): Promise<Blob> {
  const questoes = questoesDaProva(exam)
  const totalDeQuestoes = exam.numberOfQuestions ?? questoes.length
  const [imageMap, logo] = await Promise.all([prefetchExamImages(questoes), loadLogo()])

  const doc = new jsPDF()
  await registerFonts(doc)

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Prova', logo)
      return true
    }
    return false
  }

  const desenharImagens = criarDesenhoDeImagens(doc, imageMap, pageWidth, pageHeight, margin, logo)

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Prova', logo)

  // === TÍTULO DA PROVA ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(16)
  doc.setFont(FONT, 'bold')
  doc.text(exam.title, pageWidth / 2, y + 10, { align: 'center' })

  if (exam.description) {
    doc.setFontSize(10)
    doc.setFont(FONT, 'normal')
    doc.text(exam.description, pageWidth / 2, y + 18, { align: 'center' })
  }

  y += 35

  // === INFORMAÇÕES DA PROVA ===
  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(9)
  doc.setFont(FONT, 'normal')
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, y, { align: 'right' })
  y += 5
  // Sem duração o texto saía "Duração: undefined minutos" no cabeçalho da
  // prova impressa — prova de treino não tem prazo, e isso é comum.
  doc.text(
    exam.duration
      ? `Duração: ${exam.duration} minutos | Questões: ${totalDeQuestoes}`
      : `Questões: ${totalDeQuestoes}`,
    pageWidth - margin,
    y,
    { align: 'right' },
  )
  y += 10

  // === IDENTIFICAÇÃO DO CANDIDATO ===
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont(FONT, 'bold')
  doc.text('IDENTIFICAÇÃO DO CANDIDATO', margin + 5, y + 5.5)
  y += 15

  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(10)
  doc.setFont(FONT, 'normal')
  doc.text('Nome: _____________________________________________________________', margin, y)
  y += 10

  // Código de barras (se tiver userId)
  if (userId) {
    try {
      // Criar canvas temporário para gerar barcode
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, userId, {
        format: 'CODE128',
        width: 2,
        height: 40,
        displayValue: true,
        fontSize: 12,
      })

      const barcodeImage = canvas.toDataURL('image/png')
      doc.text('Código de Barras:', margin, y)
      y += 5
      doc.addImage(barcodeImage, 'PNG', margin, y, 80, 20)
      y += 25
    } catch (error) {
      console.error('Erro ao gerar barcode:', error)
      doc.text(`Código: ${userId}`, margin, y)
      y += 8
    }
  } else {
    doc.text('Código: ___________________________________________________________', margin, y)
    y += 10
  }

  doc.text('Assinatura: ________________________________________________________', margin, y)
  y += 12

  // === INSTRUÇÕES ===
  doc.setFillColor(...LARANJA)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont(FONT, 'bold')
  doc.text('INSTRUÇÕES', margin + 5, y + 5.5)
  y += 12

  doc.setFontSize(9)
  doc.setFont(FONT, 'normal')
  doc.setTextColor(...CINZA_TEXTO)
  const instructions = [
    '• Preencha todos os campos de identificação acima.',
    '• Leia atentamente cada questão antes de responder.',
    '• Para questões objetivas, marque apenas UMA alternativa.',
    '• Para questões discursivas, escreva de forma clara e legível.',
    '• Não é permitido rasuras nas respostas.',
  ]

  instructions.forEach(instruction => {
    doc.text(instruction, margin + 2, y)
    y += 5
  })

  y += 8

  // === QUESTÕES ===
  questoes.forEach((question, idx) => {
    checkPage(50)

    // Header da questão
    doc.setFillColor(...VERDE_MEDIO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont(FONT, 'bold')
    // `question.number` e não o índice: o gabarito e a folha de respostas
    // imprimem o número da questão, e os três documentos precisam concordar.
    doc.text(`Questão ${question.number ?? idx + 1}`, margin + 5, y + 7)

    // O tipo, à direita, como no gabarito comentado. Na prova em branco ele
    // não existia, e quem folheia não sabia que a questão seguinte é uma
    // discursiva de dez linhas até virar a página.
    const rotuloDoTipo =
      question.type === 'discursive' ? 'Discursiva' : question.type === 'essay' ? 'Redação' : 'Múltipla Escolha'
    doc.setFontSize(8)
    doc.setFont(FONT, 'normal')
    doc.text(rotuloDoTipo, pageWidth - margin - 5, y + 7, { align: 'right' })

    y += 15

    // Reset depois do cabeçalho branco sobre verde: sem isto o corpo herda o
    // branco e a questão sai invisível quando algum ramo esquece de repintar.
    doc.setTextColor(...CINZA_TEXTO)
    doc.setFont(FONT, 'normal')

    // Enunciado
    if (question.statement) {
      checkPage(15)
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(8)
        doc.setFontSize(10)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        drawRichLine(doc, line, margin, y)
        y += 6
      })
      y += 3
    }

    // Fonte do enunciado
    if (question.statementSource) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Fonte: ${question.statementSource}`, margin, y)
      y += 6
    }

    // Imagens do enunciado
    y = desenharImagens(blocoDoEnunciado(question), y, 'Prova')

    // Comando
    if (question.command) {
      checkPage(12)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const commandLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      commandLines.forEach((line: string) => {
        checkPage(8)
        doc.setFont(FONT, 'bold')
        doc.setTextColor(...VERDE_ESCURO)
        drawRichLine(doc, line, margin, y, 'bold')
        y += 6
      })
      y += 4
    }

    if (question.type === 'multiple-choice') {
      // Alternativas com checkboxes
      y += 3

      question.alternatives.forEach((alt) => {
        checkPage(12)

        // Reset font for each alternative to prevent color/size leaks
        doc.setFont(FONT, 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...CINZA_TEXTO)

        // Checkbox estilizado
        doc.setDrawColor(...VERDE_MEDIO)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1)

        // Alternativa - use alt.letter from data instead of hardcoded array
        const altText = `${alt.letter}) ${alt.text}`
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 12)
        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) {
            checkPage(6)
            // Re-set after potential page break
            doc.setFontSize(10)
            doc.setTextColor(...CINZA_TEXTO)
          }
          drawRichLine(doc, line, margin + 10, y)
          y += 6
        })
        y += 3
      })
    } else if (question.type === 'discursive') {
      // Espaço para resposta discursiva
      checkPage(60)

      doc.setFontSize(9)
      doc.setTextColor(...LARANJA)
      doc.setFont(FONT, 'bold')
      doc.text(
        question.maxScore
          ? `Espaço para resposta (máximo ${question.maxScore} pontos):`
          : 'Espaço para resposta:',
        margin,
        y,
      )
      y += 6

      /*
       * As linhas para escrever.
       *
       * O `checkPage` por LINHA quebrava o bloco em qualquer ponto: o rótulo
       * "Espaço para resposta" ficava no pé de uma página com uma ou duas
       * linhas, e as outras oito na seguinte. Aqui a quebra acontece antes do
       * bloco, e só se não couberem pelo menos quatro linhas — abaixo disso o
       * espaço no pé da página não serve para escrever nada.
       */
      const numeroDeLinhas = 10
      const alturaDaLinha = 6
      const linhasQueCabem = Math.floor((pageHeight - 25 - y) / alturaDaLinha)
      if (linhasQueCabem < Math.min(4, numeroDeLinhas)) checkPage(pageHeight)

      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      for (let i = 0; i < numeroDeLinhas; i++) {
        checkPage(alturaDaLinha + 2)
        doc.line(margin, y, pageWidth - margin, y)
        y += alturaDaLinha
      }
    }

    // Separador entre questões — o mesmo do PDF do Banco de Questões. Sem ele,
    // o fim de uma questão e o começo da próxima ficam a dez milímetros de
    // distância e nada mais, e numa prova de vinte questões o olho se perde.
    y += 6
    if (idx < questoes.length - 1) {
      checkPage(6)
      doc.setDrawColor(...LARANJA)
      doc.setLineWidth(0.4)
      doc.line(margin + 15, y, pageWidth - margin - 15, y)
      y += 8
    }
  })

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `${exam.title}`)
  }

  return doc.output('blob')
}

/**
 * Gera PDF da prova com as respostas do aluno marcadas (sem mostrar gabarito)
 */
export async function generateStudentAnswersPDF(exam: Exam, answers: UserAnswer[], userName: string): Promise<Blob> {
  const questoes = questoesDaProva(exam)
  const [imageMap, logo] = await Promise.all([prefetchExamImages(questoes), loadLogo()])
  const doc = new jsPDF()
  await registerFonts(doc)

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Relatório de Respostas', logo)
      return true
    }
    return false
  }

  const desenharImagens = criarDesenhoDeImagens(doc, imageMap, pageWidth, pageHeight, margin, logo)

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Relatório de Respostas', logo)

  // === TÍTULO DA PROVA ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont(FONT, 'bold')
  doc.text(exam.title, pageWidth / 2, y + 12, { align: 'center' })

  y += 25

  // === INFORMAÇÕES DO ALUNO ===
  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(10)
  doc.setFont(FONT, 'bold')
  doc.text('Aluno: ' + userName, margin, y)
  y += 5
  doc.setFont(FONT, 'normal')
  doc.text('Data: ' + new Date().toLocaleDateString('pt-BR'), margin, y)
  y += 10

  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // === QUESTÕES ===
  questoes.forEach((question, idx) => {
    checkPage(40)

    // Header da questão
    doc.setFillColor(...VERDE_MEDIO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(FONT, 'bold')
    doc.text('Questão ' + (question.number ?? idx + 1), margin + 5, y + 5.5)
    y += 12

    if (question.statement) {
      checkPage(15)
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, question.statement, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(8)
        // `drawRichLine` e não `doc.text`: este era o único PDF de prova que
        // imprimia os `**` do enunciado em vez de pôr o trecho em negrito.
        doc.setFontSize(10)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        drawRichLine(doc, line, margin, y)
        y += 6
      })
      y += 3
    }

    if (question.statementSource) {
      checkPage(8)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Fonte: ' + question.statementSource, margin, y)
      y += 6
    }

    // Imagens do enunciado
    y = desenharImagens(blocoDoEnunciado(question), y, 'Relatório de Respostas')

    if (question.command) {
      checkPage(12)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      const commandLines = wrapText(doc, question.command, pageWidth - 2 * margin)
      commandLines.forEach((line: string) => {
        checkPage(8)
        doc.setFont(FONT, 'bold')
        doc.setTextColor(...VERDE_ESCURO)
        drawRichLine(doc, line, margin, y, 'bold')
        y += 6
      })
      y += 4
    }

    const answer = answers.find(a => a.questionId === question.id)

    if (question.type === 'multiple-choice') {
      y += 3

      question.alternatives.forEach((alt) => {
        checkPage(12)

        const isSelected = answer?.selectedAlternative === alt.id

        // Checkbox
        doc.setDrawColor(...VERDE_MEDIO)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1)

        if (isSelected) {
          doc.setFillColor(...VERDE_MEDIO)
          doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1, 'F')
        }

        // Reset font/color explicitly per alternative
        if (isSelected) {
          doc.setFont(FONT, 'bold')
          doc.setTextColor(...VERDE_ESCURO)
        } else {
          doc.setFont(FONT, 'normal')
          doc.setTextColor(...CINZA_TEXTO)
        }
        doc.setFontSize(10)

        const altText = alt.letter + ') ' + alt.text
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 12)
        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) {
            checkPage(6)
            // Re-set after potential page break
            doc.setFontSize(10)
            if (isSelected) {
              doc.setFont(FONT, 'bold')
              doc.setTextColor(...VERDE_ESCURO)
            } else {
              doc.setFont(FONT, 'normal')
              doc.setTextColor(...CINZA_TEXTO)
            }
          }
          drawRichLine(doc, line, margin + 10, y, isSelected ? 'bold' : 'normal')
          y += 6
        })
        y += 3
      })
    } else if (question.type === 'discursive') {
      checkPage(20)

      doc.setFontSize(9)
      doc.setTextColor(...LARANJA)
      doc.setFont(FONT, 'bold')
      doc.text('Sua resposta:', margin, y)
      y += 6

      if (answer?.discursiveText) {
        doc.setFontSize(10)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        const answerLines = wrapText(doc, answer.discursiveText, pageWidth - 2 * margin - 4)
        answerLines.forEach((line: string) => {
          checkPage(8)
          doc.setFontSize(10)
          doc.setFont(FONT, 'normal')
          doc.setTextColor(...CINZA_TEXTO)
          doc.text(line, margin + 2, y)
          y += 6
        })
      } else {
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text('(Não respondida)', margin + 2, y)
        y += 6
      }
    }

    // Separador entre questões, igual ao dos outros documentos da prova.
    y += 6
    if (idx < questoes.length - 1) {
      checkPage(6)
      doc.setDrawColor(...LARANJA)
      doc.setLineWidth(0.4)
      doc.line(margin + 15, y, pageWidth - margin - 15, y)
      y += 8
    }
  })

  // === RODAPÉ ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `Respostas de ${userName}`)
  }

  return doc.output('blob')
}

/**
 * Gera PDF com as anotações feitas pelo aluno durante a prova
 */
export async function generateAnnotationsPDF(
  examTitle: string,
  annotations: QuestionAnnotation[]
): Promise<Blob> {
  const doc = new jsPDF()
  await registerFonts(doc)
  const logo = await loadLogo()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Anotações da Prova', logo)
      return true
    }
    return false
  }

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Anotações da Prova', logo)

  // === TÍTULO DA PROVA ===
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setFillColor(...CINZA_CLARO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont(FONT, 'bold')
  doc.text(examTitle, pageWidth / 2, y + 13, { align: 'center' })

  y += 30

  // Se não há anotações
  if (annotations.length === 0) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text('Nenhuma anotação foi feita durante esta prova.', pageWidth / 2, y, {
      align: 'center',
    })
  } else {
    // === ANOTAÇÕES ===
    // Ordenar por número da questão
    const sortedAnnotations = [...annotations].sort(
      (a, b) => a.questionNumber - b.questionNumber
    )

    for (const annotation of sortedAnnotations) {
      // Verificar se há espaço para o título da questão
      checkPage(30)

      // Título da questão
      doc.setFillColor(...VERDE_MEDIO)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont(FONT, 'bold')
      doc.text(`Questão ${annotation.questionNumber}`, margin + 5, y + 8)

      y += 20

      // Verificar se há canvas data URL
      if (annotation.canvasDataUrl) {
        const maxImageWidth = pageWidth - 2 * margin
        const maxImageHeight = 150 // Altura máxima para cada anotação

        try {
          /*
           * A anotação entrava esticada até 170×150mm, fosse qual fosse o
           * formato do canvas.
           *
           * O canvas de uma questão é largo e baixo (a largura do enunciado
           * por uns poucos centímetros de traço); forçá-lo num retângulo
           * quase quadrado achatava a letra de quem escreveu à mão — o único
           * conteúdo deste PDF — e deixava metade da caixa vazia.
           *
           * `getImageProperties` lê o tamanho real do dataUrl, e a escala
           * passa a ser a mesma que o resto dos PDFs usa: o que couber na
           * largura, sem nunca ampliar.
           */
          const propriedades = doc.getImageProperties(annotation.canvasDataUrl)
          const escala = Math.min(
            maxImageWidth / propriedades.width,
            maxImageHeight / propriedades.height,
            1,
          )
          const largura = propriedades.width * escala
          const altura = propriedades.height * escala

          checkPage(altura + 10)

          doc.addImage(annotation.canvasDataUrl, 'PNG', margin, y, largura, altura)

          y += altura + 15
        } catch (error) {
          // Se houver erro ao adicionar a imagem, mostrar mensagem
          doc.setFontSize(10)
          doc.setTextColor(200, 0, 0)
          doc.text('Erro ao carregar anotação', margin, y)
          y += 15
        }
      } else {
        // Se não houver canvas data URL, mostrar apenas os textos
        if (annotation.texts && annotation.texts.length > 0) {
          doc.setFontSize(10)
          doc.setTextColor(...CINZA_TEXTO)
          doc.text('Anotações de texto:', margin, y)
          y += 8

          for (const text of annotation.texts) {
            checkPage(10)
            const lines = wrapText(doc, text.text, pageWidth - 2 * margin - 10)
            for (const line of lines) {
              checkPage(6)
              doc.text(`• ${line}`, margin + 5, y)
              y += 6
            }
          }
          y += 10
        } else {
          // Sem anotações
          doc.setFontSize(10)
          doc.setTextColor(150, 150, 150)
          doc.text('(Sem anotações para esta questão)', margin, y)
          y += 15
        }
      }

      // Linha separadora entre questões
      checkPage(5)
      doc.setDrawColor(...LARANJA)
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      y += 10
    }
  }

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, `Anotações - ${examTitle}`)
  }

  return doc.output('blob')
}

/**
 * Gera PDF com o resumo dos dados de uma pesquisa submetida
 */
export async function generateFormResponsePDF(
  form: Form,
  answers: Record<string, string | string[]>
): Promise<Blob> {
  const doc = new jsPDF()
  await registerFonts(doc)
  const logo = await loadLogo()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, 'Resumo da Pesquisa', logo)
      return true
    }
    return false
  }

  y = addDomineAquiHeader(doc, pageWidth, margin, 'Resumo da Pesquisa', logo)

  // Form Title
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 2, 2, 'FD')

  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(14)
  doc.setFont(FONT, 'bold')
  doc.text(decodeHtmlEntities(form.title), pageWidth / 2, y + 13, { align: 'center' })

  y += 30

  doc.setTextColor(...CINZA_TEXTO)
  doc.setFontSize(10)
  const dateStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const timeStr = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  doc.text(`Submetido em: ${dateStr} às ${timeStr} (Horário de Brasília)`, margin, y)
  y += 15

  // Questions and Answers
  form.blocks.forEach((block: FormBlock) => {
    if (block.type === 'question') {
      checkPage(30)

      // Question Title Wrapper
      doc.setFillColor(...VERDE_MEDIO)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont(FONT, 'bold')
      doc.text('PERGUNTA', margin + 5, y + 7)
      y += 15

      // Question Content
      doc.setTextColor(...VERDE_ESCURO)
      doc.setFontSize(11)
      doc.setFont(FONT, 'bold')
      const titleText = decodeHtmlEntities(block.title || 'Sem título')
      const titleLines = wrapText(doc, titleText, pageWidth - 2 * margin)
      titleLines.forEach(line => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })
      y += 2

      // Answer Text
      doc.setTextColor(...CINZA_TEXTO)
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')

      const answer = answers[block.id]
      let answerText = ''

      if (Array.isArray(answer)) {
        answerText = answer.map(a => decodeHtmlEntities(String(a))).join(', ')
      } else if (answer) {
        answerText = decodeHtmlEntities(String(answer))
      } else {
        answerText = '(Sem resposta)'
      }

      const answerLines = wrapText(doc, String(answerText), pageWidth - 2 * margin)
      answerLines.forEach(line => {
        checkPage(8)
        doc.text(line, margin, y)
        y += 6
      })

      y += 10
    }
  })

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, form.title)
  }

  return doc.output('blob')
}

// ─────────────────────────────────────────────────────────────────────────────
// Group PDF: cover pages + merge using pdf-lib
// ─────────────────────────────────────────────────────────────────────────────

export type GroupPDFType = 'exam' | 'with-answers' | 'gabarito'

const TYPE_LABELS: Record<GroupPDFType, { title: string; subtitle: string; accent: readonly [number, number, number] }> = {
  'exam':         { title: 'CADERNO DE PROVAS',          subtitle: 'Questões',                        accent: VERDE_MEDIO },
  'with-answers': { title: 'CADERNO COM GABARITO',       subtitle: 'Questões + Respostas Comentadas', accent: [70, 110, 180] as const },
  'gabarito':     { title: 'CADERNO DE GABARITOS',       subtitle: 'Gabarito Oficial',                accent: [180, 120, 30] as const },
}

/**
 * Generates a single full-page cover for one exam inside the group PDF.
 */
async function generateExamCoverBlob(
  exam: Exam,
  index: number,
  total: number,
  type: GroupPDFType
): Promise<Blob> {
  const doc = new jsPDF()
  await registerFonts(doc)

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const { accent } = TYPE_LABELS[type]

  // ── Dark header band ──────────────────────────────────────────
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, W, 52, 'F')

  // ── Accent stripe ─────────────────────────────────────────────
  doc.setFillColor(...accent)
  doc.rect(0, 52, W, 6, 'F')

  // ── Logo area ─────────────────────────────────────────────────
  const logo = await loadLogo()
  if (logo) {
    try { doc.addImage(logo, 'PNG', 10, 8, 34, 34) } catch {}
  }

  // ── DomineAqui wordmark ───────────────────────────────────────
  doc.setFont(FONT, 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('DomineAqui', 50, 26, { baseline: 'middle' })

  doc.setFont(FONT, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 210, 190)
  doc.text('Plataforma de Estudos Médicos', 50, 36, { baseline: 'middle' })

  // ── Type badge ────────────────────────────────────────────────
  const { title: typeTitle, subtitle: typeSub } = TYPE_LABELS[type]
  doc.setFont(FONT, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...accent)
  doc.text(typeTitle, W - 10, 20, { align: 'right', baseline: 'middle' })
  doc.setFont(FONT, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(180, 210, 190)
  doc.text(typeSub, W - 10, 32, { align: 'right', baseline: 'middle' })

  // ── Center card ───────────────────────────────────────────────
  const cardTop = 80
  const cardH = 110
  const mx = 20

  doc.setFillColor(248, 250, 248)
  doc.roundedRect(mx, cardTop, W - mx * 2, cardH, 4, 4, 'F')
  doc.setDrawColor(...accent)
  doc.setLineWidth(0.6)
  doc.roundedRect(mx, cardTop, W - mx * 2, cardH, 4, 4, 'S')

  // Left accent bar
  doc.setFillColor(...accent)
  doc.roundedRect(mx, cardTop, 4, cardH, 2, 2, 'F')

  // Exam number pill
  const pillX = mx + 12
  const pillY = cardTop + 14
  doc.setFillColor(...accent)
  doc.roundedRect(pillX, pillY - 5, 36, 10, 3, 3, 'F')
  doc.setFont(FONT, 'bold')
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.text(`PROVA ${index + 1} DE ${total}`, pillX + 18, pillY, { align: 'center', baseline: 'middle' })

  /*
   * Título e descrição, presos ao cartão.
   *
   * O cartão tem 110mm fixos, e o título saía inteiro: uma prova com nome
   * longo ("N1 SOI I — Sistema Cardiovascular e Respiratório — Turma B
   * 2026/2") gastava quatro ou cinco linhas, escrevia por cima da descrição e
   * transbordava a borda do cartão, na CAPA do pacote.
   *
   * Três linhas de título, e a descrição começa DEPOIS delas — não numa
   * coordenada fixa que só funcionava com títulos curtos.
   */
  doc.setFont(FONT, 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...VERDE_ESCURO)
  const todasAsLinhasDoTitulo = doc.splitTextToSize(sanitizeForPdf(exam.title), W - mx * 2 - 24) as string[]
  const linhasDoTitulo = todasAsLinhasDoTitulo.slice(0, 3)
  if (todasAsLinhasDoTitulo.length > 3) {
    linhasDoTitulo[2] = `${linhasDoTitulo[2].replace(/\s+\S*$/, '')}...`
  }
  const alturaDaLinhaDoTitulo = 7
  linhasDoTitulo.forEach((linha, i) => {
    doc.text(linha, mx + 12, cardTop + 34 + i * alturaDaLinhaDoTitulo)
  })

  // Description
  if (exam.description) {
    const descLines = doc.splitTextToSize(sanitizeForPdf(exam.description), W - mx * 2 - 24) as string[]
    doc.setFont(FONT, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    const yDaDescricao = cardTop + 34 + linhasDoTitulo.length * alturaDaLinhaDoTitulo + 6
    // O que couber entre o título e o divisor do rodapé do cartão.
    const linhasQueCabem = Math.max(0, Math.floor((cardTop + cardH - 32 - yDaDescricao) / 5))
    descLines.slice(0, Math.min(3, linhasQueCabem)).forEach((linha, i) => {
      doc.text(linha, mx + 12, yDaDescricao + i * 5)
    })
  }

  // Divider
  doc.setDrawColor(220, 230, 220)
  doc.setLineWidth(0.4)
  doc.line(mx + 10, cardTop + cardH - 26, W - mx - 10, cardTop + cardH - 26)

  // Meta row
  doc.setFont(FONT, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  const meta: string[] = []
  if (exam.numberOfQuestions) meta.push(`${exam.numberOfQuestions} questões`)
  if (exam.totalPoints)       meta.push(`${exam.totalPoints} pts`)
  if (exam.scoringMethod === 'tri') meta.push('TRI')
  if (meta.length) doc.text(meta.join('  ·  '), mx + 12, cardTop + cardH - 13)

  // ── Bottom bar ────────────────────────────────────────────────
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, H - 18, W, 18, 'F')
  doc.setFont(FONT, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(150, 200, 160)
  doc.text('domineaqui.com.br', W / 2, H - 9, { align: 'center', baseline: 'middle' })

  return doc.output('blob')
}

/**
 * Merges an interleaved array of [cover, exam, cover, exam, …] Blobs into one PDF.
 */
async function mergeBlobs(blobs: Blob[]): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib')
  const merged = await PDFDocument.create()
  for (const blob of blobs) {
    const arrayBuffer = await blob.arrayBuffer()
    const src = await PDFDocument.load(arrayBuffer)
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }
  const bytes = await merged.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

/**
 * Generates a combined PDF for all practice exams in a group.
 * Each exam is preceded by a cover page. Order: as provided (caller reverses for bottom→top).
 *
 * Parallelism: up to CONCURRENCY exams generated simultaneously, dramatically
 * reducing wall-clock time (e.g. 10 exams: ~50s sequential → ~15s parallel).
 */
export async function generateGroupPDF(
  exams: Exam[],
  type: GroupPDFType,
  onProgress?: (done: number, total: number) => void
): Promise<Blob> {
  // Pre-warm fonts + logo once so all parallel workers share the cache
  await Promise.all([prewarmFontsCache(), loadLogo()])

  const CONCURRENCY = 3
  const results: [Blob, Blob][] = new Array(exams.length)
  let nextIdx = 0
  let completed = 0

  // Worker function — grabs the next exam index until all are done
  async function worker() {
    while (true) {
      const i = nextIdx++
      if (i >= exams.length) break
      const exam = exams[i]
      // Generate cover and content in parallel for each exam
      const [cover, content] = await Promise.all([
        generateExamCoverBlob(exam, i, exams.length, type),
        gerarPorTipo(exam, type),
      ])
      results[i] = [cover, content]
      completed++
      onProgress?.(completed, exams.length)
    }
  }

  // Launch CONCURRENCY workers in parallel
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  // Flatten in order: [cover1, content1, cover2, content2, …]
  const blobs = results.flatMap(([cover, content]) => [cover, content])
  return mergeBlobs(blobs)
}

/**
 * Vários formatos da MESMA prova num arquivo só.
 *
 * O caderno em branco, o caderno com gabarito comentado e a folha de gabarito
 * são três documentos completos e independentes — cada um com o seu cabeçalho.
 * Quem aplica a prova costuma querer os três, e baixá-los em três cliques
 * produz três arquivos soltos na pasta de Downloads, com nomes parecidos, para
 * juntar depois na mão.
 *
 * A ordem segue `tipos`, sem repetição: quem pedir duas vezes o mesmo formato
 * recebe uma. Um `tipos` vazio não existe — a tela sempre manda pelo menos um,
 * e o caderno em branco é o padrão razoável se algum dia mandar nada.
 */
export async function generateExamPackagePDF(
  exam: Exam,
  tipos: GroupPDFType[],
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const pedidos = tipos.filter((tipo, indice) => tipos.indexOf(tipo) === indice)
  const ordem: GroupPDFType[] = pedidos.length > 0 ? pedidos : ['exam']

  if (ordem.length === 1) {
    onProgress?.(0, 1)
    const unico = await gerarPorTipo(exam, ordem[0])
    onProgress?.(1, 1)
    return unico
  }

  // Fontes e logo aquecidos uma vez: os três documentos compartilham o cache.
  await Promise.all([prewarmFontsCache(), loadLogo()])

  let prontos = 0
  onProgress?.(0, ordem.length)
  const blobs = await Promise.all(
    ordem.map(async (tipo) => {
      const blob = await gerarPorTipo(exam, tipo)
      prontos++
      onProgress?.(prontos, ordem.length)
      return blob
    }),
  )

  return mergeBlobs(blobs)
}

/** O documento de um tipo. É o mesmo mapa que o PDF de grupo usa. */
function gerarPorTipo(exam: Exam, tipo: GroupPDFType): Promise<Blob> {
  if (tipo === 'gabarito') return generateGabaritoPDF(exam)
  if (tipo === 'with-answers') return generateExamWithAnswersPDF(exam)
  return generateExamPDF(exam)
}

// ── Purchase Receipt PDF ──────────────────────────────────────────

export interface PurchaseReceiptItem {
  _id: string
  itemTitle: string
  itemType: 'material' | 'package' | 'manual_clinico'
  price: number
  purchasedAt: string | Date
  status: string
}

export interface PurchaseReceiptUser {
  id: string
  name: string
  email: string
}

export async function generatePurchaseReceiptPDF(
  purchases: PurchaseReceiptItem[],
  user: PurchaseReceiptUser
): Promise<Blob> {
  await Promise.all([prewarmFontsCache(), loadLogo()])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  await registerFonts(doc)

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const mx = 18

  // ── Header band ──────────────────────────────────────────────────
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, 0, W, 38, 'F')

  const logo = await loadLogo()
  if (logo) {
    doc.addImage(logo, 'JPEG', mx, 7, 28, 24)
  } else {
    doc.setFont(FONT, 'bold')
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.text('DomineAqui', mx, 22)
  }

  doc.setFont(FONT, 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('Comprovante de Compras', W - mx, 18, { align: 'right' })
  doc.setFont(FONT, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 220, 185)
  doc.text('domineaqui.com.br', W - mx, 26, { align: 'right' })

  let y = 52

  // ── Document metadata ────────────────────────────────────────────
  const emitDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const docId = `REC-${user.id.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

  doc.setFillColor(245, 248, 245)
  doc.roundedRect(mx, y, W - mx * 2, 36, 3, 3, 'F')
  doc.setDrawColor(210, 228, 212)
  doc.setLineWidth(0.4)
  doc.roundedRect(mx, y, W - mx * 2, 36, 3, 3, 'S')

  doc.setFont(FONT, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('DADOS DO DOCUMENTO', mx + 10, y + 10)

  doc.setFont(FONT, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...CINZA_TEXTO)
  doc.text(`Emitido em:  ${emitDate}`, mx + 10, y + 20)
  doc.text(`Código:  ${docId}`, mx + 10, y + 28)
  doc.text(`Versão:  1.0`, W - mx - 10, y + 20, { align: 'right' })
  doc.text(`Plataforma:  DomineAqui`, W - mx - 10, y + 28, { align: 'right' })

  y += 46

  // ── User info ────────────────────────────────────────────────────
  doc.setFont(FONT, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('DADOS DO TITULAR', mx, y)
  y += 6

  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.6)
  doc.line(mx, y, W - mx, y)
  y += 8

  doc.setFont(FONT, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...CINZA_TEXTO)
  doc.text(`Nome:`, mx, y)
  doc.setFont(FONT, 'bold')
  doc.text(sanitizeForPdf(user.name), mx + 24, y)

  doc.setFont(FONT, 'normal')
  doc.text(`E-mail:`, mx + 100, y)
  doc.setFont(FONT, 'bold')
  doc.text(sanitizeForPdf(user.email), mx + 124, y)

  y += 8
  doc.setFont(FONT, 'normal')
  doc.text(`ID da Conta:`, mx, y)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.text(user.id, mx + 28, y)

  y += 16

  // ── Purchase table ───────────────────────────────────────────────
  doc.setFont(FONT, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('HISTÓRICO DE COMPRAS', mx, y)
  y += 6

  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.6)
  doc.line(mx, y, W - mx, y)
  y += 2

  // Table header
  const colX = [mx, mx + 80, mx + 110, mx + 138]
  const colW = W - mx * 2
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(mx, y, colW, 9, 'F')
  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('Produto', colX[0] + 3, y + 6)
  doc.text('Tipo', colX[1] + 3, y + 6)
  doc.text('Data', colX[2] + 3, y + 6)
  doc.text('Valor', colX[3] + 3, y + 6)
  y += 9

  // Table rows
  purchases.forEach((p, i) => {
    if (y > H - 40) {
      doc.addPage()
      y = 20
    }
    const rowH = 10
    doc.setFillColor(i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255, i % 2 === 0 ? 250 : 255)
    doc.rect(mx, y, colW, rowH, 'F')
    doc.setDrawColor(225, 235, 225)
    doc.setLineWidth(0.2)
    doc.rect(mx, y, colW, rowH, 'S')

    const title = sanitizeForPdf(p.itemTitle)
    const titleLines = doc.splitTextToSize(title, 74)
    const typeLabel = p.itemType === 'manual_clinico' ? 'Produto' : p.itemType === 'package' ? 'Pacote' : 'Material'
    const dateStr = new Date(p.purchasedAt).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
    const priceStr = p.price === 0 ? 'Gratuito' : `R$ ${p.price.toFixed(2)}`

    doc.setFont(FONT, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...CINZA_TEXTO)
    doc.text(titleLines[0] || '', colX[0] + 3, y + 6.5)
    doc.text(typeLabel, colX[1] + 3, y + 6.5)
    doc.text(dateStr, colX[2] + 3, y + 6.5)
    doc.setFont(FONT, 'bold')
    const priceColor: readonly [number, number, number] = p.price === 0 ? [70, 129, 82] : CINZA_TEXTO
    doc.setTextColor(...priceColor)
    doc.text(priceStr, colX[3] + 3, y + 6.5)
    y += rowH
  })

  y += 4

  // ── Totals ───────────────────────────────────────────────────────
  const totalPaid = purchases.reduce((s, p) => s + (p.price || 0), 0)
  const totalItems = purchases.length

  doc.setFillColor(235, 245, 236)
  doc.roundedRect(mx, y, colW, 18, 2, 2, 'F')
  doc.setDrawColor(...VERDE_MEDIO)
  doc.setLineWidth(0.5)
  doc.roundedRect(mx, y, colW, 18, 2, 2, 'S')

  doc.setFont(FONT, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...CINZA_TEXTO)
  doc.text(`Total de itens: ${totalItems}`, mx + 8, y + 11)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text(`Total investido: R$ ${totalPaid.toFixed(2)}`, W - mx - 8, y + 11, { align: 'right' })

  y += 28

  // ── Terms declaration ────────────────────────────────────────────
  doc.setFillColor(248, 250, 248)
  doc.setDrawColor(210, 228, 212)
  doc.setLineWidth(0.4)
  const termsText = [
    `O titular acima identificado declara ter lido, compreendido e aceito os Termos de Uso e a Política de`,
    `Privacidade da plataforma DomineAqui (domineaqui.com.br) no momento da realização de cada compra`,
    `listada neste documento. Os materiais adquiridos destinam-se a uso pessoal e intransferível, sendo`,
    `vedada a reprodução, revenda ou distribuição sem autorização prévia e expressa da plataforma.`,
  ]
  const termsH = termsText.length * 5.5 + 16
  doc.roundedRect(mx, y, colW, termsH, 2, 2, 'FD')

  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...VERDE_ESCURO)
  doc.text('DECLARAÇÃO DE ACEITE DOS TERMOS', mx + 8, y + 9)

  doc.setFont(FONT, 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(90, 90, 90)
  termsText.forEach((line, i) => {
    doc.text(line, mx + 8, y + 16 + i * 5.5)
  })

  // ── Footer ───────────────────────────────────────────────────────
  doc.setFillColor(...VERDE_ESCURO)
  doc.rect(0, H - 16, W, 16, 'F')
  doc.setFont(FONT, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(150, 200, 160)
  doc.text('DomineAqui · domineaqui.com.br · Documento gerado automaticamente pela plataforma', W / 2, H - 8, { align: 'center', baseline: 'middle' })

  return doc.output('blob')
}

// ─────────────────────────────────────────────────────────────────
// BANCO DE QUESTÕES — Lista (mesma engine das Provas: Roboto + wrapText)
// ─────────────────────────────────────────────────────────────────

interface BancoAlternativaPDF {
  letra: string
  texto: string
  correta?: boolean
}

interface BancoQuestaoPDF {
  tipo: 'objetiva' | 'discursiva'
  enunciado: string
  alternativas?: BancoAlternativaPDF[]
  imagemUrl?: string
  /** Ver `lib/questoes/imagens.ts`; `imagemUrl` continua valendo sozinho. */
  imagens?: ImagemDeQuestao[]
  layoutImagens?: LayoutDeImagens
  imagensExplicacao?: ImagemDeQuestao[]
  layoutImagensExplicacao?: LayoutDeImagens
  explicacao?: string
  respostaModelo?: string
  dificuldade?: string
  ano?: number
  fonte?: string
  periodoNome?: string
  moduloNome?: string
  topicoNome?: string
}

/**
 * Gera o PDF de uma lista do Banco de Questões usando exatamente a mesma
 * engine das Provas (fontes Roboto com Unicode completo, wrapText próprio e
 * markdown inline). Isso elimina o truncamento de letras/acentos do gerador
 * server-side antigo baseado em Helvetica.
 *
 * @param incluirRespostas  quando true, destaca a alternativa correta em verde,
 *                          mostra resposta modelo/explicação e adiciona o gabarito.
 */
export async function generateBancoListaPDF(
  listaNome: string,
  questoes: BancoQuestaoPDF[],
  incluirRespostas: boolean = false
): Promise<Blob> {
  const doc = new jsPDF()
  await registerFonts(doc)
  const logo = await loadLogo()

  // Pré-carregar imagens das questões (mesma cache de sessão das provas).
  // Enunciado e explicação juntos: uma imagem que só aparece no comentário
  // também precisa dos bytes antes da hora de desenhar.
  const imageMap = new Map<string, ImgData>()
  const urlsDasQuestoes = Array.from(
    new Set(
      questoes.flatMap((q) => [
        ...blocoDaQuestaoDoBanco(q).imagens.map((i) => i.url),
        ...imagensDaExplicacaoDoBanco(q).map((i) => i.url),
      ]),
    ),
  )
  await Promise.all(
    urlsDasQuestoes.map(async (url) => {
      const result = await fetchImageAsBase64(url)
      if (result) imageMap.set(url, result)
    })
  )

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const subtitle = incluirRespostas ? 'Banco de Questões · Gabarito' : 'Banco de Questões'

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage()
      y = addDomineAquiHeader(doc, pageWidth, margin, subtitle, logo)
      return true
    }
    return false
  }

  const desenharImagens = criarDesenhoDeImagens(doc, imageMap, pageWidth, pageHeight, margin, logo)

  y = addDomineAquiHeader(doc, pageWidth, margin, subtitle, logo)

  // === TÍTULO DA LISTA ===
  doc.setFillColor(...LARANJA_CLARO)
  doc.setDrawColor(...VERDE_MEDIO)
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 22, 3, 3, 'FD')
  doc.setTextColor(...VERDE_ESCURO)
  doc.setFontSize(16)
  doc.setFont(FONT, 'bold')
  const tituloLines = wrapText(doc, listaNome, pageWidth - 2 * margin - 10)
  doc.text(tituloLines[0] || listaNome, pageWidth / 2, y + 10, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont(FONT, 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`${questoes.length} ${questoes.length === 1 ? 'questão' : 'questões'}`, pageWidth / 2, y + 17, { align: 'center' })
  y += 30

  if (incluirRespostas) {
    doc.setFillColor(...VERDE_ESCURO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 9, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont(FONT, 'bold')
    doc.text('GABARITO COMENTADO  —  Alternativas corretas destacadas em verde', pageWidth / 2, y + 6, { align: 'center' })
    y += 16
  }

  // === QUESTÕES ===
  questoes.forEach((questao, idx) => {
    // Garantir estado limpo no início de cada questão (evita vazamento de cor verde das alternativas)
    doc.setTextColor(...CINZA_TEXTO)
    doc.setFontSize(10)
    doc.setFont(FONT, 'normal')

    checkPage(45)

    // Header da questão
    doc.setFillColor(...VERDE_MEDIO)
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont(FONT, 'bold')
    doc.text(`Questão ${idx + 1}`, margin + 5, y + 7)

    // Metadados à direita (tipo · dificuldade · ano)
    const tipoLabel = questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'
    const meta: string[] = [tipoLabel]
    if (questao.dificuldade) {
      meta.push(questao.dificuldade === 'facil' ? 'Fácil' : questao.dificuldade === 'medio' ? 'Médio' : 'Difícil')
    }
    if (questao.ano) meta.push(String(questao.ano))
    doc.setFontSize(8)
    doc.setFont(FONT, 'normal')
    doc.text(meta.join('  ·  '), pageWidth - margin - 2, y + 7, { align: 'right' })
    y += 14

    // Reset cor após header
    doc.setTextColor(...CINZA_TEXTO)
    doc.setFont(FONT, 'normal')

    // Hierarquia (período > módulo > tópico)
    const hierarquia = [questao.periodoNome, questao.moduloNome, questao.topicoNome].filter(Boolean).join(' > ')
    if (hierarquia) {
      checkPage(7)
      doc.setFontSize(8)
      doc.setFont(FONT, 'italic')
      doc.setTextColor(120, 120, 120)
      doc.text(sanitizeForPdf(hierarquia), margin, y)
      y += 6
    }

    // Enunciado
    if (questao.enunciado) {
      checkPage(12)
      doc.setFontSize(10)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      const lines = wrapText(doc, questao.enunciado, pageWidth - 2 * margin)
      lines.forEach((line: string) => {
        checkPage(8)
        doc.setFontSize(10)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        drawRichLine(doc, line, margin, y)
        y += 6
      })
      y += 2
    }

    // Imagens do enunciado
    y = desenharImagens(blocoDaQuestaoDoBanco(questao), y, subtitle)

    // Alternativas (objetiva)
    if (questao.tipo === 'objetiva' && questao.alternativas) {
      y += 2
      questao.alternativas.forEach((alt) => {
        const isCorrect = incluirRespostas && !!alt.correta
        const altText = `${alt.letra}) ${alt.texto}`
        const altLines = wrapText(doc, altText, pageWidth - 2 * margin - 12)
        const rectH = altLines.length * 6 + 3
        checkPage(rectH + 3)

        if (isCorrect) {
          doc.setFillColor(220, 245, 225)
          doc.setDrawColor(70, 129, 82)
          doc.setLineWidth(0.5)
          doc.roundedRect(margin + 1, y - 3, pageWidth - 2 * margin - 2, rectH, 1.5, 1.5, 'FD')
        }

        doc.setFont(FONT, isCorrect ? 'bold' : 'normal')
        doc.setFontSize(10)
        doc.setTextColor(isCorrect ? 26 : CINZA_TEXTO[0], isCorrect ? 71 : CINZA_TEXTO[1], isCorrect ? 42 : CINZA_TEXTO[2])

        // Ícone: check verde (correta) ou checkbox vazio
        if (isCorrect) {
          doc.setFillColor(70, 129, 82)
          doc.setDrawColor(70, 129, 82)
          doc.circle(margin + 4.5, y - 1.5, 3, 'F')
          doc.setDrawColor(255, 255, 255)
          doc.setLineWidth(0.7)
          doc.line(margin + 3.2, y - 1.5, margin + 4.3, y - 0.3)
          doc.line(margin + 4.3, y - 0.3, margin + 6, y - 3)
        } else {
          doc.setDrawColor(...VERDE_MEDIO)
          doc.setLineWidth(0.4)
          doc.roundedRect(margin + 2, y - 3.5, 5, 5, 1, 1)
        }

        altLines.forEach((line: string, lineIdx: number) => {
          if (lineIdx > 0) {
            doc.setFontSize(10)
            doc.setTextColor(isCorrect ? 26 : CINZA_TEXTO[0], isCorrect ? 71 : CINZA_TEXTO[1], isCorrect ? 42 : CINZA_TEXTO[2])
          }
          drawRichLine(doc, line, margin + 10, y, isCorrect ? 'bold' : 'normal')
          y += 6
        })
        // Reset após alternativa verde para não vazar para o bloco seguinte
        doc.setTextColor(...CINZA_TEXTO)
        doc.setFont(FONT, 'normal')
        y += 3
      })
    } else if (questao.tipo === 'discursiva' && !incluirRespostas) {
      // Espaço para resposta
      checkPage(20)
      doc.setFontSize(9)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...LARANJA)
      doc.text('Espaço para resposta:', margin, y)
      y += 6
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      for (let i = 0; i < 6; i++) {
        checkPage(8)
        doc.line(margin, y, pageWidth - margin, y)
        y += 7
      }
    }

    // Resposta modelo (discursiva, com respostas)
    if (incluirRespostas && questao.tipo === 'discursiva' && questao.respostaModelo) {
      checkPage(14)
      doc.setFontSize(8.5)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...VERDE_ESCURO)
      doc.text('Resposta Modelo:', margin, y)
      y += 6
      doc.setFontSize(9)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      wrapText(doc, questao.respostaModelo, pageWidth - 2 * margin - 4).forEach((line: string) => {
        checkPage(8)
        doc.setFontSize(9)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        drawRichLine(doc, line, margin + 4, y)
        y += 6
      })
      y += 3
    }

    // Explicação / comentário (com respostas)
    if (incluirRespostas && questao.explicacao) {
      checkPage(14)
      doc.setFontSize(8.5)
      doc.setFont(FONT, 'bold')
      doc.setTextColor(...LARANJA)
      doc.text('Resposta Comentada:', margin, y)
      y += 6
      doc.setFontSize(9)
      doc.setFont(FONT, 'normal')
      doc.setTextColor(...CINZA_TEXTO)
      wrapText(doc, questao.explicacao, pageWidth - 2 * margin - 4).forEach((line: string) => {
        checkPage(8)
        doc.setFontSize(9)
        doc.setFont(FONT, 'normal')
        doc.setTextColor(...CINZA_TEXTO)
        drawRichLine(doc, line, margin + 4, y)
        y += 6
      })
      y += 3
    }

    // Imagens da resposta comentada
    if (incluirRespostas) {
      y = desenharImagens(
        { imagens: imagensDaExplicacaoDoBanco(questao), layout: layoutDaExplicacaoDoBanco(questao) },
        y,
        subtitle,
        { recuo: 4, alturaMaxima: ALTURA_MAXIMA_DA_IMAGEM * 0.8 },
      )
    }

    // Fonte
    if (questao.fonte) {
      checkPage(8)
      doc.setFontSize(7.5)
      doc.setFont(FONT, 'italic')
      doc.setTextColor(120, 120, 120)
      const fonteLines = wrapText(doc, `Fonte: ${questao.fonte}`, pageWidth - 2 * margin)
      fonteLines.forEach((line: string) => {
        doc.text(line, margin, y)
        y += 4.5
      })
    }

    // Separador entre questões
    y += 6
    checkPage(4)
    doc.setDrawColor(...LARANJA)
    doc.setLineWidth(0.4)
    doc.line(margin + 15, y, pageWidth - margin - 15, y)
    y += 8
  })

  // === GABARITO RÁPIDO (objetivas) ===
  if (incluirRespostas) {
    const objetivas = questoes.filter(q => q.tipo === 'objetiva')
    if (objetivas.length > 0) {
      checkPage(40)
      doc.setFillColor(...VERDE_ESCURO)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont(FONT, 'bold')
      doc.text('GABARITO RÁPIDO', pageWidth / 2, y + 7, { align: 'center' })
      y += 16

      const columns = 5
      const columnWidth = (pageWidth - 2 * margin) / columns
      const rowHeight = 11
      let col = 0
      questoes.forEach((q, i) => {
        if (q.tipo !== 'objetiva') return
        const correta = q.alternativas?.find(a => a.correta)?.letra || '-'
        const x = margin + col * columnWidth
        doc.setFillColor(...LARANJA_CLARO)
        doc.roundedRect(x, y - 6, columnWidth - 3, rowHeight, 2, 2, 'F')
        doc.setTextColor(...VERDE_ESCURO)
        doc.setFontSize(9)
        doc.setFont(FONT, 'bold')
        doc.text(`Q${i + 1}: ${correta}`, x + 4, y + 1)
        col++
        if (col >= columns) {
          col = 0
          y += rowHeight + 2
          checkPage(rowHeight + 4)
        }
      })
    }
  }

  // === RODAPÉ EM TODAS AS PÁGINAS ===
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addDomineAquiFooter(doc, i, totalPages, pageWidth, pageHeight, margin, listaNome)
  }

  return doc.output('blob')
}
