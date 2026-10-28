import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Exam, Question, UserAnswer, QuestionAnnotation, Form, FormBlock } from './types'
import { decodeHtmlEntities } from './html-entities'

// ── Base da marca (fontes, logo, fundo, vidro, cabeçalho e rodapé) ──
// Tudo isto morava aqui e havia sido reescrito pela metade em
// `lib/user-report-generator.ts` — com `helvetica` no lugar da fonte
// embutida, o que soletrava qualquer linha com um caractere fora do WinAnsi.
// Agora é um lugar só; ver `lib/pdf/marca.ts`. Os componentes de página
// (cartão de título, questão, alternativas, grade) moram em `lib/pdf/folha.ts`.
import {
  FLORESTA,
  LARANJA,
  TINTA,
  TINTA_SUAVE,
  VERDE_VIVO,
  Y_APOS_CABECALHO,
  aquecerAssetsDePdf,
  aquecerFontes as prewarmFontsCache,
  carregarLogo as loadLogo,
  desenharFundoDaPagina,
  desenharIconeDoApp,
  desenharMancha,
  desenharPilula,
  desenharVidro,
  encurtarParaLargura,
  fonte,
  quebrarComLimite,
  registrarFontes,
  sanitizarParaPdf as sanitizeForPdf,
} from './pdf/marca'
import {
  type Folha,
  type LinhaDoGrupo,
  criarFolha,
  desenharAlternativas,
  desenharCabecalhoDaQuestao,
  desenharCartaoDeTitulo,
  desenharGrupo,
  desenharListaDeItens,
  desenharNumeros,
  desenharPares,
  desenharPautas,
  escreverCredito,
  escreverNota,
  escreverTexto,
  finalizarFolha,
  garantirEspaco,
} from './pdf/folha'
import {
  type CelulaDaGrade,
  alternativasDa,
  desenharCaixaDeTexto,
  desenharEnunciado,
  desenharGrade,
  desenharImagensNaFolha,
  desenharRespostaComentada,
  fecharQuestao,
  rotuloDoTipo,
} from './pdf/questao-na-folha'
import { desenharImagemEmoldurada } from './pdf/imagens-de-questao'
import type { ImagemDeQuestao, LayoutDeImagens } from './questoes/imagens'
// Reexportado: o módulo saiu daqui (ver lib/provas/resposta-comentada.ts), e
// os testes e o relatório do aluno continuam encontrando o nome no lugar de
// sempre.
export { montarRespostaComentada } from './provas/resposta-comentada'
import {
  blocoDaQuestaoDoBanco,
  imagensDaExplicacaoDoBanco,
  layoutDaExplicacaoDoBanco,
  urlsDaQuestao,
} from './questoes/imagens-da-questao'

/**
 * A família ativa neste arquivo.
 *
 * Quem a mantém em dia é `registerFonts`, logo abaixo; ela vai para cada folha
 * (`criarFolha`) e dali para todo componente que escreve.
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

// ── Peças comuns aos documentos de prova ─────────────────────────

/** Um documento novo, com fontes embutidas, já com o cabeçalho da 1ª página. */
async function abrirFolha(subtitulo: string): Promise<Folha> {
  const doc = new jsPDF()
  await registerFonts(doc)
  const logo = await loadLogo()
  return criarFolha(doc, FONT, logo, subtitulo)
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

const hoje = () => new Date().toLocaleDateString('pt-BR')

/** Número no jeito brasileiro: 2,5 e não 2.5. */
const numeroBr = (n: number | string) => String(n).replace('.', ',')

/** Os números da prova, como pílulas do cartão de título. */
function chipsDaProva(exam: Exam, total: number, extras: (string | null | undefined)[] = []): string[] {
  return [
    plural(total, 'questão', 'questões'),
    exam.duration ? `${exam.duration} min` : null,
    exam.scoringMethod === 'tri' ? 'TRI · 1000 pontos' : exam.totalPoints ? `${exam.totalPoints} pontos` : null,
    ...extras,
  ].filter((chip): chip is string => !!chip)
}

// ── Gabarito oficial ─────────────────────────────────────────────

export async function generateGabaritoPDF(exam: Exam): Promise<Blob> {
  const questoes = questoesDaProva(exam)
  // `numberOfQuestions` é o número declarado na prova; quando ele falta, o que
  // está escrito no documento é a contagem real do que foi impresso.
  const totalDeQuestoes = exam.numberOfQuestions ?? questoes.length
  const folha = await abrirFolha('Gabarito oficial')

  desenharCartaoDeTitulo(folha, {
    titulo: exam.title,
    descricao: exam.description,
    chips: chipsDaProva(exam, totalDeQuestoes, ['Gabarito oficial']),
  })

  // `exam.totalPoints` pode não existir (prova discursiva, prova antiga): o
  // texto dizia "undefined pontos" no gabarito oficial, impresso.
  desenharNumeros(folha, [
    { valor: String(totalDeQuestoes), rotulo: 'Questões' },
    {
      valor: exam.scoringMethod === 'tri' ? '1000' : exam.totalPoints ? String(exam.totalPoints) : '—',
      rotulo: exam.scoringMethod === 'tri' ? 'Pontos (TRI)' : 'Pontos',
      tom: 'verde',
    },
    { valor: exam.scoringMethod === 'tri' ? 'TRI' : 'Normal', rotulo: 'Sistema de pontuação', tom: 'laranja' },
  ])

  // `|| []` porque discursiva e redação podem chegar sem o array: o gabarito
  // delas é um traço, não uma exceção que derruba o arquivo inteiro.
  desenharGrade(
    folha,
    questoes.map((q, i) => ({
      numero: q.number ?? i + 1,
      letra: (q.alternatives || []).find((alt) => alt.isCorrect)?.letter || '—',
    })),
    5,
    'Gabarito',
  )

  folha.y += 2
  if (exam.scoringMethod === 'tri') {
    desenharListaDeItens(
      folha,
      [
        '**TRI (Teoria de Resposta ao Item):** a nota considera o padrão de respostas, não só o número de acertos.',
        'Dificuldade de cada questão (parâmetro b).',
        'Discriminação da questão (parâmetro a).',
        'Probabilidade de acerto ao acaso (parâmetro c).',
      ],
      { titulo: 'Sistema de pontuação' },
    )
  } else {
    const pontos = exam.totalPoints || 100
    const porQuestao = pontos / (totalDeQuestoes || 1)
    desenharListaDeItens(
      folha,
      [
        `Pontuação máxima: **${pontos} pontos**`,
        `Cada questão vale: **${porQuestao.toFixed(2).replace('.', ',')} pontos**`,
        `Total de questões: **${totalDeQuestoes}**`,
      ],
      { titulo: 'Sistema de pontuação' },
    )
  }

  finalizarFolha(folha, exam.title)
  return folha.doc.output('blob')
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
  const folha = await abrirFolha(comparar ? 'Folha de respostas comparada' : 'Folha de respostas')

  desenharCartaoDeTitulo(folha, {
    titulo: exam.title,
    chips: [
      userName || 'Aluno',
      new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      comparar ? 'Comparada com o gabarito' : null,
    ].filter((chip): chip is string => !!chip),
  })

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

  const celulas: CelulaDaGrade[] = apenasObjetivas.map((questao, i) => {
    const resposta = porQuestao.get(questao.id)
    const marcada = questao.alternatives.find((alt) => alt.id === resposta?.selectedAlternative)
    const correta = questao.alternatives.find((alt) => alt.isCorrect)
    if (marcada) respondidas++
    const acertou = !!marcada && !!correta && marcada.id === correta.id
    if (acertou) acertos++
    // A letra marcada. Em branco fica com o travessão, e não vazio: uma célula
    // vazia numa folha de respostas parece falha de impressão.
    const celula: CelulaDaGrade = { numero: questao.number ?? i + 1, letra: marcada?.letter || '—' }
    if (comparar) {
      // O sinal, e não só a cor: daltonismo e impressão em preto e branco
      // apagariam a única informação que esta coluna carrega.
      celula.gabarito = correta?.letter || '—'
      celula.acerto = marcada ? acertou : null
    }
    return celula
  })

  // === RESUMO (só na versão comparada: sem gabarito não há acerto a contar) ===
  if (comparar && celulas.length > 0) {
    desenharNumeros(folha, [
      { valor: `${acertos} de ${celulas.length}`, rotulo: 'Acertos', tom: 'verde' },
      { valor: `${respondidas} de ${celulas.length}`, rotulo: 'Respondidas' },
      { valor: `${Math.round((acertos / celulas.length) * 100)}%`, rotulo: 'Aproveitamento', tom: 'laranja' },
    ])
    escreverNota(folha, 'Bolinha cheia: a sua resposta. Bolinha vazada: o gabarito oficial. A marca ao lado diz se você acertou.')
  }

  // Quatro colunas na versão simples, três na comparada (que precisa de duas
  // letras e do sinal por linha).
  desenharGrade(folha, celulas, comparar ? 4 : 5, comparar ? 'Sua resposta e o gabarito' : 'Suas respostas')

  // === QUESTÕES SEM ALTERNATIVA ===
  // Discursiva não tem letra para marcar. Dizer isso é melhor do que deixar a
  // pessoa contar por que a folha tem menos linhas do que a prova tem questões.
  const semAlternativa = questoes.length - apenasObjetivas.length
  if (semAlternativa > 0) {
    escreverNota(
      folha,
      semAlternativa === 1
        ? '1 questão discursiva não aparece nesta folha: ela não tem alternativa para marcar.'
        : `${semAlternativa} questões discursivas não aparecem nesta folha: elas não têm alternativa para marcar.`,
    )
  }

  finalizarFolha(folha, exam.title)
  return folha.doc.output('blob')
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
  const [imageMap] = await Promise.all([prefetchExamImages(questoes), loadLogo()])
  const folha = await abrirFolha('Prova com gabarito')

  desenharCartaoDeTitulo(folha, {
    titulo: exam.title,
    descricao: exam.description,
    chips: chipsDaProva(exam, exam.numberOfQuestions ?? questoes.length, ['Gabarito comentado']),
  })
  escreverNota(folha, 'As alternativas corretas aparecem em verde, com a marca de certo. O comentário de cada questão vem logo abaixo dela.')

  questoes.forEach((question, idx) => {
    const correta = (question.alternatives || []).find((alt) => alt.isCorrect)
    desenharCabecalhoDaQuestao(folha, `Questão ${question.number ?? idx + 1}`, [
      { texto: rotuloDoTipo(question) },
      ...(correta ? [{ texto: `Gabarito ${correta.letter}`, tom: 'verde' as const }] : []),
    ])
    desenharEnunciado(folha, question, imageMap)

    if (question.type === 'multiple-choice') {
      desenharAlternativas(
        folha,
        alternativasDa(question, (alt) => (alt.isCorrect ? 'certa' : 'vazia'), (alt) => (alt.isCorrect ? 'Correta' : undefined)),
      )
    } else if (question.type === 'discursive') {
      escreverNota(folha, 'Questão discursiva: os pontos-chave esperados estão na resposta comentada.')
    }

    // As imagens do comentário — o fluxograma, o esquema, a lâmina que ele
    // descreve — entram DENTRO da caixa. Desenhadas depois dela, como eram,
    // ficavam penduradas fora do retângulo.
    desenharRespostaComentada(folha, question, imageMap)
    fecharQuestao(folha)
  })

  finalizarFolha(folha, exam.title)
  return folha.doc.output('blob')
}

/**
 * A linha de identificação: rótulo à esquerda e o traço para escrever.
 * `imagem` troca o traço pelo código de barras do aluno.
 */
function linhaDeIdentificacao(folha: Folha, rotulo: string, imagem?: string | null, codigo?: string): LinhaDoGrupo {
  const { doc } = folha
  const altura = imagem ? 24 : 12
  return {
    altura,
    desenhar: (x, y, largura) => {
      fonte(doc, 'bold', 8.5, TINTA_SUAVE)
      doc.text(rotulo, x + 4.5, y + 7.6)
      if (imagem) {
        try {
          doc.addImage(imagem, 'PNG', x + 32, y + 2.5, 70, 19)
          return
        } catch {
          // Sem a imagem, o código vai escrito.
        }
      }
      if (codigo) {
        fonte(doc, 'normal', 10, TINTA)
        doc.text(encurtarParaLargura(doc, codigo, largura - 40), x + 32, y + 7.6)
        return
      }
      doc.setDrawColor(170, 186, 176)
      doc.setLineWidth(0.3)
      doc.line(x + 32, y + 8.4, x + largura - 5, y + 8.4)
    },
  }
}

// Gerar PDF da prova para alunos preencherem (client-side com jsPDF)
export async function generateExamPDF(exam: Exam, userId?: string): Promise<Blob> {
  const questoes = questoesDaProva(exam)
  const totalDeQuestoes = exam.numberOfQuestions ?? questoes.length
  const [imageMap] = await Promise.all([prefetchExamImages(questoes), loadLogo()])
  const folha = await abrirFolha('Prova')

  // Sem duração o texto saía "Duração: undefined minutos" no cabeçalho da
  // prova impressa — prova de treino não tem prazo, e isso é comum.
  desenharCartaoDeTitulo(folha, {
    titulo: exam.title,
    descricao: exam.description,
    chips: chipsDaProva(exam, totalDeQuestoes, [`Data: ${hoje()}`]),
  })

  // === IDENTIFICAÇÃO DO CANDIDATO ===
  let codigoDeBarras: string | null = null
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
        margin: 0,
      })
      codigoDeBarras = canvas.toDataURL('image/png') || null
    } catch (error) {
      console.error('Erro ao gerar barcode:', error)
    }
  }
  desenharGrupo(
    folha,
    [
      linhaDeIdentificacao(folha, 'Nome'),
      userId
        ? linhaDeIdentificacao(folha, 'Código', codigoDeBarras, userId)
        : linhaDeIdentificacao(folha, 'Código'),
      linhaDeIdentificacao(folha, 'Assinatura'),
    ],
    { titulo: 'Identificação do candidato', recuoDoFio: 4.5, depois: 4 },
  )

  // === INSTRUÇÕES ===
  desenharListaDeItens(
    folha,
    [
      'Preencha todos os campos de identificação acima.',
      'Leia atentamente cada questão antes de responder.',
      'Nas questões objetivas, pinte apenas **uma** bolinha.',
      'Nas questões discursivas, escreva de forma clara e legível.',
      'Não é permitido rasurar as respostas.',
    ],
    { titulo: 'Instruções' },
  )
  folha.y += 2

  // === QUESTÕES ===
  questoes.forEach((question, idx) => {
    // `question.number` e não o índice: o gabarito e a folha de respostas
    // imprimem o número da questão, e os três documentos precisam concordar.
    // O tipo vai à direita: quem folheia sabe que a seguinte é uma discursiva
    // de dez linhas antes de virar a página.
    desenharCabecalhoDaQuestao(folha, `Questão ${question.number ?? idx + 1}`, [
      { texto: rotuloDoTipo(question) },
      ...(question.maxScore ? [{ texto: `${numeroBr(question.maxScore)} pts`, tom: 'laranja' as const }] : []),
    ])
    desenharEnunciado(folha, question, imageMap)

    if (question.type === 'multiple-choice') {
      desenharAlternativas(folha, alternativasDa(question, () => 'vazia'))
    } else if (question.type === 'discursive') {
      desenharPautas(folha, 10, question.maxScore ? `Resposta · vale ${numeroBr(question.maxScore)} pontos` : 'Resposta')
    } else if (question.type === 'essay') {
      // A redação também precisa de onde ser escrita: impressa sem pauta
      // nenhuma, ela saía como um enunciado solto.
      desenharPautas(folha, 24, 'Redação')
    }

    fecharQuestao(folha)
  })

  finalizarFolha(folha, exam.title)
  return folha.doc.output('blob')
}

/**
 * Gera PDF da prova com as respostas do aluno marcadas (sem mostrar gabarito)
 */
export async function generateStudentAnswersPDF(exam: Exam, answers: UserAnswer[], userName: string): Promise<Blob> {
  const questoes = questoesDaProva(exam)
  const [imageMap] = await Promise.all([prefetchExamImages(questoes), loadLogo()])
  const folha = await abrirFolha('Relatório de respostas')

  desenharCartaoDeTitulo(folha, {
    titulo: exam.title,
    chips: [`Aluno: ${userName || 'Aluno'}`, `Data: ${hoje()}`],
  })

  questoes.forEach((question, idx) => {
    desenharCabecalhoDaQuestao(folha, `Questão ${question.number ?? idx + 1}`, [{ texto: rotuloDoTipo(question) }])
    desenharEnunciado(folha, question, imageMap)

    const answer = answers.find((a) => a.questionId === question.id)

    if (question.type === 'multiple-choice') {
      desenharAlternativas(
        folha,
        alternativasDa(
          question,
          (alt) => (answer?.selectedAlternative === alt.id ? 'marcada' : 'vazia'),
          (alt) => (answer?.selectedAlternative === alt.id ? 'Sua resposta' : undefined),
        ),
      )
      if (!answer?.selectedAlternative) escreverNota(folha, 'Você não marcou nenhuma alternativa nesta questão.')
    } else if (question.type === 'discursive' || question.type === 'essay') {
      if (answer?.discursiveText) {
        desenharCaixaDeTexto(folha, answer.discursiveText, 'Sua resposta', { tom: 'claro' })
      } else {
        escreverNota(folha, '(Não respondida)')
      }
    }

    fecharQuestao(folha)
  })

  finalizarFolha(folha, `Respostas de ${userName}`)
  return folha.doc.output('blob')
}

/**
 * Gera PDF com as anotações feitas pelo aluno durante a prova
 */
export async function generateAnnotationsPDF(
  examTitle: string,
  annotations: QuestionAnnotation[]
): Promise<Blob> {
  const folha = await abrirFolha('Anotações da prova')
  const { doc } = folha

  desenharCartaoDeTitulo(folha, {
    titulo: examTitle,
    chips: [plural(annotations.length, 'questão anotada', 'questões anotadas'), `Data: ${hoje()}`],
  })

  if (annotations.length === 0) {
    escreverNota(folha, 'Nenhuma anotação foi feita durante esta prova.')
  } else {
    const ordenadas = [...annotations].sort((a, b) => a.questionNumber - b.questionNumber)

    for (const annotation of ordenadas) {
      desenharCabecalhoDaQuestao(folha, `Questão ${annotation.questionNumber}`, [], 24)

      if (annotation.canvasDataUrl) {
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
          const larguraMaxima = folha.larguraUtil - 2
          const alturaMaxima = Math.min(150, folha.limite - Y_APOS_CABECALHO - 4)
          const escala = Math.min(larguraMaxima / propriedades.width, alturaMaxima / propriedades.height, 1)
          const largura = propriedades.width * escala
          const altura = propriedades.height * escala

          garantirEspaco(folha, altura + 4)
          desenharImagemEmoldurada(doc, annotation.canvasDataUrl, folha.margem + 1, folha.y + 1, largura, altura)
          folha.y += altura + 6
        } catch {
          escreverNota(folha, 'Não foi possível carregar esta anotação.')
        }
      } else if (annotation.texts && annotation.texts.length > 0) {
        desenharListaDeItens(
          folha,
          annotation.texts.map((t) => t.text),
          { titulo: 'Anotações de texto' },
        )
      } else {
        escreverNota(folha, '(Sem anotações para esta questão)')
      }

      fecharQuestao(folha)
    }
  }

  finalizarFolha(folha, `Anotações · ${examTitle}`)
  return doc.output('blob')
}

/**
 * Gera PDF com o resumo dos dados de uma pesquisa submetida
 */
export async function generateFormResponsePDF(
  form: Form,
  answers: Record<string, string | string[]>
): Promise<Blob> {
  const folha = await abrirFolha('Resumo da pesquisa')

  const dateStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const timeStr = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  desenharCartaoDeTitulo(folha, {
    titulo: decodeHtmlEntities(form.title),
    chips: [`Enviado em ${dateStr} às ${timeStr}`, 'Horário de Brasília'],
  })

  let numero = 0
  form.blocks.forEach((block: FormBlock) => {
    if (block.type !== 'question') return
    numero += 1

    const answer = answers[block.id]
    let answerText = ''
    if (Array.isArray(answer)) {
      answerText = answer.map((a) => decodeHtmlEntities(String(a))).join(', ')
    } else if (answer) {
      answerText = decodeHtmlEntities(String(answer))
    } else {
      answerText = '(Sem resposta)'
    }

    desenharCabecalhoDaQuestao(folha, `Pergunta ${numero}`, [], 24)
    escreverTexto(folha, decodeHtmlEntities(block.title || 'Sem título'), {
      estilo: 'bold',
      cor: FLORESTA,
      corpo: 10.5,
      depois: 2.5,
    })
    desenharCaixaDeTexto(folha, answerText, 'Resposta', { tom: 'claro' })
    folha.y += 2
  })

  finalizarFolha(folha, decodeHtmlEntities(form.title))
  return folha.doc.output('blob')
}

// ─────────────────────────────────────────────────────────────────────────────
// Group PDF: cover pages + merge using pdf-lib
// ─────────────────────────────────────────────────────────────────────────────

export type GroupPDFType = 'exam' | 'with-answers' | 'gabarito' | 'respostas-comentadas'

const TYPE_LABELS: Record<GroupPDFType, { title: string; subtitle: string; tom: 'escuro' | 'verde' | 'laranja' }> = {
  'exam':         { title: 'Caderno de provas',     subtitle: 'Questões',                        tom: 'escuro' },
  'with-answers': { title: 'Caderno com gabarito',  subtitle: 'Questões e respostas comentadas', tom: 'verde' },
  'gabarito':     { title: 'Caderno de gabaritos',  subtitle: 'Gabarito oficial',                tom: 'laranja' },
  'respostas-comentadas': { title: 'Respostas comentadas', subtitle: 'A explicação de cada questão', tom: 'verde' },
}

/**
 * Generates a single full-page cover for one exam inside the group PDF.
 *
 * Um cartaz: o fundo de manchas mais forte, a marca no alto, e o cartão de
 * vidro escuro com o título no meio da folha. O título vai até quatro linhas
 * e a descrição até cinco — medidos antes, e o cartão cresce para os dois
 * (o cartão antigo tinha 110 mm fixos e um título longo escrevia por cima da
 * descrição).
 */
async function generateExamCoverBlob(
  exam: Exam,
  index: number,
  total: number,
  type: GroupPDFType
): Promise<Blob> {
  const doc = new jsPDF()
  await registerFonts(doc)
  const logo = await loadLogo()

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const mx = 18
  const { title: typeTitle, subtitle: typeSub, tom } = TYPE_LABELS[type]

  desenharFundoDaPagina(doc)
  desenharMancha(doc, W * 0.15, H * 0.62, 95, VERDE_VIVO, 0.16)
  desenharMancha(doc, W * 0.95, H * 0.42, 80, LARANJA, 0.2)

  // ── A marca no alto ───────────────────────────────────────────
  desenharIconeDoApp(doc, mx, 22, 20, logo)
  fonte(doc, 'bold', 20, FLORESTA)
  doc.text('DomineAqui', mx + 26, 31)
  fonte(doc, 'normal', 9, TINTA_SUAVE)
  doc.text('Plataforma de estudos médicos', mx + 26, 37.5)
  desenharPilula(doc, typeTitle, W - mx, 32, { tom, corpo: 8.5, altura: 8.6, alinhar: 'direita', larguraMaxima: 70 })

  // ── O cartão do título ────────────────────────────────────────
  const largura = W - 2 * mx
  const respiro = 11
  const larguraDoTexto = largura - 2 * respiro
  fonte(doc, 'bold', 23)
  const titulo = quebrarComLimite(doc, exam.title || 'Prova', larguraDoTexto, 4)
  fonte(doc, 'normal', 10.5)
  const descricao = exam.description ? quebrarComLimite(doc, exam.description, larguraDoTexto, 5) : []
  const meta: string[] = []
  if (exam.numberOfQuestions) meta.push(plural(exam.numberOfQuestions, 'questão', 'questões'))
  if (exam.totalPoints) meta.push(`${exam.totalPoints} pontos`)
  if (exam.scoringMethod === 'tri') meta.push('TRI')
  if (exam.duration) meta.push(`${exam.duration} min`)

  const altura =
    respiro + 9 + 6 + titulo.length * 10 + (descricao.length ? 3 + descricao.length * 5.4 : 0) + (meta.length ? 9 + 7 : 0) + respiro
  const topo = Math.max(62, (H - altura) / 2 - 6)
  desenharVidro(doc, mx, topo, largura, altura, { tom: 'escuro', raio: 7 })

  let y = topo + respiro
  desenharPilula(doc, `Prova ${index + 1} de ${total}`, mx + respiro, y + 4.5, { tom: 'translucido', corpo: 8, altura: 9 })
  y += 9 + 6
  fonte(doc, 'bold', 23, [255, 255, 255])
  for (const linha of titulo) {
    doc.text(linha, mx + respiro, y + 7.6)
    y += 10
  }
  if (descricao.length) {
    y += 3
    fonte(doc, 'normal', 10.5, [214, 234, 221])
    for (const linha of descricao) {
      doc.text(linha, mx + respiro, y + 4)
      y += 5.4
    }
  }
  if (meta.length) {
    y += 9
    let cx = mx + respiro
    for (const item of meta) {
      cx += desenharPilula(doc, item, cx, y + 3.5, { tom: 'translucido', corpo: 8, altura: 7 }) + 2.5
    }
  }

  // ── O rodapé do cartaz ────────────────────────────────────────
  fonte(doc, 'normal', 9, TINTA_SUAVE)
  doc.text(typeSub, W / 2, H - 26, { align: 'center' })
  fonte(doc, 'bold', 9, FLORESTA)
  doc.text('domineaqui.com.br', W / 2, H - 20, { align: 'center' })

  return doc.output('blob')
}

/**
 * As respostas comentadas, sozinhas, para ir no FIM do caderno: a pessoa faz a
 * prova no papel sem ver o gabarito e, ao virar a última página, encontra a
 * aula de cada questão — gabarito, por que a certa é certa, por que cada
 * errada erra e o "para fixar". É o caderno de estudo que a prova com IA
 * oferece (`generateExamStudyPDF`).
 */
export async function generateCommentedAnswersAppendixPDF(exam: Exam): Promise<Blob> {
  const questoes = questoesDaProva(exam)
  const [imageMap] = await Promise.all([prefetchExamImages(questoes), loadLogo()])
  const folha = await abrirFolha('Respostas comentadas')

  desenharCartaoDeTitulo(folha, {
    titulo: 'Respostas comentadas',
    descricao: `${exam.title} — leia depois de responder.`,
    chips: [plural(questoes.length, 'questão', 'questões')],
  })

  questoes.forEach((question, idx) => {
    const correta = (question.alternatives || []).find((a) => a.isCorrect)
    desenharCabecalhoDaQuestao(
      folha,
      `Questão ${question.number ?? idx + 1}`,
      correta ? [{ texto: `Gabarito ${correta.letter}`, tom: 'verde' }] : [{ texto: rotuloDoTipo(question) }],
    )

    if (correta) {
      desenharAlternativas(folha, [{ letra: correta.letter, texto: correta.text || '', estado: 'certa', etiqueta: 'Correta' }])
    }

    if (!desenharRespostaComentada(folha, question, imageMap)) {
      escreverNota(folha, 'Sem comentário cadastrado para esta questão.')
    }
    fecharQuestao(folha)
  })

  finalizarFolha(folha, exam.title)
  return folha.doc.output('blob')
}

/** Caderno de estudo: a prova em branco e, no fim, as respostas comentadas. */
export async function generateExamStudyPDF(exam: Exam): Promise<Blob> {
  await Promise.all([prewarmFontsCache(), loadLogo()])
  const [prova, respostas] = await Promise.all([generateExamPDF(exam), generateCommentedAnswersAppendixPDF(exam)])
  return mergeBlobs([prova, respostas])
}

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
  if (tipo === 'respostas-comentadas') return generateCommentedAnswersAppendixPDF(exam)
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

const reais = (valor: number) =>
  `R$ ${(Number(valor) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`

export async function generatePurchaseReceiptPDF(
  purchases: PurchaseReceiptItem[],
  user: PurchaseReceiptUser
): Promise<Blob> {
  await Promise.all([prewarmFontsCache(), loadLogo()])
  const folha = await abrirFolha('Comprovante de compras')
  const { doc } = folha

  const emitDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const docId = `REC-${user.id.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

  desenharCartaoDeTitulo(folha, {
    titulo: 'Comprovante de compras',
    descricao: 'Documento gerado automaticamente pela plataforma DomineAqui.',
    chips: [`Emitido em ${emitDate}`, docId, 'Versão 1.0'],
  })

  desenharPares(
    folha,
    [
      { rotulo: 'Nome', valor: sanitizeForPdf(user.name) },
      { rotulo: 'E-mail', valor: sanitizeForPdf(user.email) },
      { rotulo: 'ID da conta', valor: user.id },
    ],
    { titulo: 'Dados do titular', larguraDoRotulo: 30 },
  )

  // ── A tabela de compras ──────────────────────────────────────────
  // O nome do produto quebra em até duas linhas dentro da coluna dele: antes
  // ele era cortado na primeira, sem reticências.
  const colunas = { produto: 4.5, tipo: 92, data: 118, valor: folha.larguraUtil - 4.5 }
  const larguraDoProduto = colunas.tipo - colunas.produto - 4
  const linhas: LinhaDoGrupo[] = [
    {
      altura: 8,
      desenhar: (x, y) => {
        fonte(doc, 'bold', 7, TINTA_SUAVE)
        doc.text('PRODUTO', x + colunas.produto, y + 5.2, { charSpace: 0.3 })
        doc.text('TIPO', x + colunas.tipo, y + 5.2, { charSpace: 0.3 })
        doc.text('DATA', x + colunas.data, y + 5.2, { charSpace: 0.3 })
        doc.text('VALOR', x + colunas.valor, y + 5.2, { align: 'right', charSpace: 0.3 })
      },
    },
    ...purchases.map((p): LinhaDoGrupo => {
      fonte(doc, 'normal', 8.6, TINTA)
      const titulo = quebrarComLimite(doc, sanitizeForPdf(p.itemTitle), larguraDoProduto, 2)
      const altura = Math.max(1, titulo.length) * 4.4 + 4.4
      const typeLabel = p.itemType === 'manual_clinico' ? 'Produto' : p.itemType === 'package' ? 'Pacote' : 'Material'
      const dateStr = new Date(p.purchasedAt).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
      return {
        altura,
        desenhar: (x, y) => {
          fonte(doc, 'normal', 8.6, TINTA)
          titulo.forEach((linha, n) => doc.text(linha, x + colunas.produto, y + 5.2 + n * 4.4))
          fonte(doc, 'normal', 8.2, TINTA_SUAVE)
          doc.text(typeLabel, x + colunas.tipo, y + 5.2)
          doc.text(dateStr, x + colunas.data, y + 5.2)
          fonte(doc, 'bold', 8.6, p.price === 0 ? [27, 104, 64] : TINTA)
          doc.text(p.price === 0 ? 'Gratuito' : reais(p.price), x + colunas.valor, y + 5.2, { align: 'right' })
        },
      }
    }),
  ]
  desenharGrupo(folha, linhas, { titulo: 'Histórico de compras', recuoDoFio: 4.5, depois: 3 })

  // ── Totais ───────────────────────────────────────────────────────
  const totalPaid = purchases.reduce((s, p) => s + (p.price || 0), 0)
  desenharNumeros(folha, [
    { valor: String(purchases.length), rotulo: plural(purchases.length, 'item', 'itens') },
    { valor: reais(totalPaid), rotulo: 'Total investido', tom: 'verde' },
  ])

  // ── Declaração ───────────────────────────────────────────────────
  // Um parágrafo quebrado na largura, não quatro linhas fixas escritas à mão:
  // a fonte embutida é mais larga que a Helvetica, e as linhas fixas passavam
  // da borda da caixa.
  desenharCaixaDeTexto(
    folha,
    'O titular acima identificado declara ter lido, compreendido e aceito os Termos de Uso e a Política de Privacidade da plataforma DomineAqui (domineaqui.com.br) no momento da realização de cada compra listada neste documento. Os materiais adquiridos destinam-se a uso pessoal e intransferível, sendo vedada a reprodução, revenda ou distribuição sem autorização prévia e expressa da plataforma.',
    'Declaração de aceite dos termos',
    { tom: 'claro' },
  )

  finalizarFolha(folha, 'Documento gerado automaticamente pela plataforma', 'Comprovante')
  return doc.output('blob')
}

// ─────────────────────────────────────────────────────────────────
// BANCO DE QUESTÕES — Lista (mesma engine das Provas: fonte embutida e os mesmos componentes)
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
 * engine das Provas (fonte Inter com Unicode completo, `quebrarTexto` e
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

  const folha = await abrirFolha(incluirRespostas ? 'Banco de questões · Gabarito' : 'Banco de questões')

  desenharCartaoDeTitulo(folha, {
    titulo: listaNome,
    chips: [plural(questoes.length, 'questão', 'questões'), incluirRespostas ? 'Com gabarito comentado' : null].filter(
      (chip): chip is string => !!chip,
    ),
  })
  if (incluirRespostas) {
    escreverNota(folha, 'As alternativas corretas aparecem em verde, com a marca de certo. O gabarito rápido está no fim da lista.')
  }

  questoes.forEach((questao, idx) => {
    // Metadados à direita (tipo · dificuldade · ano)
    const pilulas: { texto: string; tom?: 'claro' | 'laranja' | 'verde' }[] = [
      { texto: questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva' },
    ]
    if (questao.dificuldade) {
      pilulas.push({
        texto: questao.dificuldade === 'facil' ? 'Fácil' : questao.dificuldade === 'medio' ? 'Médio' : 'Difícil',
        tom: questao.dificuldade === 'dificil' ? 'laranja' : questao.dificuldade === 'facil' ? 'verde' : 'claro',
      })
    }
    if (questao.ano) pilulas.push({ texto: String(questao.ano) })
    desenharCabecalhoDaQuestao(folha, `Questão ${idx + 1}`, pilulas)

    // Hierarquia (período › módulo › tópico)
    const hierarquia = [questao.periodoNome, questao.moduloNome, questao.topicoNome].filter(Boolean).join('  ›  ')
    if (hierarquia) {
      escreverTexto(folha, hierarquia.replace(/\*/g, ''), { corpo: 8, estilo: 'italic', cor: TINTA_SUAVE, entrelinha: 4.2, depois: 1.5 })
    }

    if (questao.enunciado) escreverTexto(folha, questao.enunciado, { depois: 2 })
    desenharImagensNaFolha(folha, imageMap, blocoDaQuestaoDoBanco(questao))
    folha.y += 1.5

    if (questao.tipo === 'objetiva' && questao.alternativas) {
      desenharAlternativas(
        folha,
        questao.alternativas.map((alt, i) => {
          const certa = incluirRespostas && !!alt.correta
          return {
            letra: alt.letra || String.fromCharCode(65 + i),
            texto: alt.texto || '',
            estado: certa ? 'certa' : 'vazia',
            etiqueta: certa ? 'Correta' : undefined,
          }
        }),
      )
    } else if (questao.tipo === 'discursiva' && !incluirRespostas) {
      desenharPautas(folha, 6, 'Resposta')
    }

    // Resposta modelo (discursiva, com respostas)
    if (incluirRespostas && questao.tipo === 'discursiva' && questao.respostaModelo) {
      desenharCaixaDeTexto(folha, questao.respostaModelo, 'Resposta modelo', { tom: 'claro' })
    }

    // Explicação / comentário (com respostas), com as imagens DENTRO da caixa.
    if (incluirRespostas) {
      desenharCaixaDeTexto(folha, questao.explicacao || '', 'Resposta comentada', {
        imagens: { imagens: imagensDaExplicacaoDoBanco(questao), layout: layoutDaExplicacaoDoBanco(questao) },
        imageMap,
      })
    }

    if (questao.fonte) escreverCredito(folha, questao.fonte)
    fecharQuestao(folha)
  })

  // === GABARITO RÁPIDO (objetivas) ===
  if (incluirRespostas) {
    const celulas: CelulaDaGrade[] = []
    questoes.forEach((q, i) => {
      if (q.tipo !== 'objetiva') return
      celulas.push({ numero: i + 1, letra: q.alternativas?.find((a) => a.correta)?.letra || '—' })
    })
    if (celulas.length > 0) {
      garantirEspaco(folha, 30)
      desenharGrade(folha, celulas, 5, 'Gabarito rápido')
    }
  }

  finalizarFolha(folha, listaNome)
  return folha.doc.output('blob')
}
