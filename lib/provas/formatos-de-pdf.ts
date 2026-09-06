import type { GroupPDFType } from '@/lib/pdf-generator'
import type { Exam, Question } from '@/lib/types'

/**
 * Os formatos de PDF que uma prova pode virar — e o que cada um contém.
 *
 * ## Por que isto existe
 *
 * `/admin/exams` tinha um botão só: "Gerar PDF da Prova", que sempre chamava
 * `generateExamPDF` — o caderno EM BRANCO. Não havia, no painel de quem monta
 * a prova, nenhum caminho para o caderno com gabarito comentado nem para a
 * folha de gabarito, embora as duas funções existam há tempo e a tela do aluno
 * (`/provas`) já ofereça as três. O admin gerava o PDF, abria, e a prova vinha
 * sem resposta nenhuma: da cadeira dele, "não dá para gerar a prova com
 * resposta comentada".
 *
 * A lista mora aqui, e não dentro do componente, por dois motivos: `/provas` e
 * `/admin/exams` passam a poder falar dos mesmos formatos sem copiar rótulo e
 * sufixo de arquivo um do outro, e o que cada opção promete pode ser testado
 * sem montar tela nenhuma.
 */
export type FormatoDePdfDaProva = 'exam' | 'with-answers' | 'gabarito' | 'pacote'

export interface OpcaoDePdfDaProva {
  chave: FormatoDePdfDaProva
  titulo: string
  descricao: string
  /**
   * Os documentos que entram no arquivo, na ordem em que saem. Uma lista de um
   * item é um PDF direto; mais de um é o pacote, que os junta num arquivo só.
   */
  partes: GroupPDFType[]
  /** Vai para o nome do arquivo, depois do título da prova. */
  sufixo: string
  /** O `type` que o rastreio de download registra. */
  rastreio: string
  /**
   * O arquivo revela o gabarito?
   *
   * No painel do admin isto não bloqueia nada — ele pode ver a prova inteira a
   * qualquer momento. Serve para o aviso da tela: uma prova ainda em
   * andamento, com um arquivo destes na mão, é um arquivo que não pode circular
   * antes do término.
   */
  revelaGabarito: boolean
}

export const FORMATOS_DE_PDF_DA_PROVA: OpcaoDePdfDaProva[] = [
  {
    chave: 'exam',
    titulo: 'Prova em branco',
    descricao: 'Só os enunciados e as alternativas, para imprimir e aplicar.',
    partes: ['exam'],
    sufixo: 'prova',
    rastreio: 'exam_pdf',
    revelaGabarito: false,
  },
  {
    chave: 'with-answers',
    titulo: 'Prova com gabarito e resposta comentada',
    descricao:
      'A prova inteira com a alternativa correta destacada, o comentário de cada alternativa e os pontos-chave das discursivas.',
    partes: ['with-answers'],
    sufixo: 'gabarito-comentado',
    rastreio: 'exam_answers_pdf',
    revelaGabarito: true,
  },
  {
    chave: 'gabarito',
    titulo: 'Somente o gabarito',
    descricao: 'A folha compacta com a letra correta de cada questão, sem enunciado.',
    partes: ['gabarito'],
    sufixo: 'gabarito',
    rastreio: 'gabarito_pdf',
    revelaGabarito: true,
  },
  {
    chave: 'pacote',
    titulo: 'Pacote completo',
    descricao: 'Os três documentos num arquivo só: prova em branco, gabarito comentado e gabarito.',
    partes: ['exam', 'with-answers', 'gabarito'],
    sufixo: 'pacote-completo',
    rastreio: 'exam_package_pdf',
    revelaGabarito: true,
  },
]

export function opcaoDePdf(chave: FormatoDePdfDaProva): OpcaoDePdfDaProva {
  return FORMATOS_DE_PDF_DA_PROVA.find((opcao) => opcao.chave === chave) ?? FORMATOS_DE_PDF_DA_PROVA[0]
}

/**
 * O título da prova como nome de arquivo.
 *
 * O jeito antigo (`title.replace(/\s+/g, '-').toLowerCase()`) deixava passar
 * acento, barra e dois-pontos — e "N1 SOI I - 2026/2" vira um caminho, não um
 * nome: o navegador salva o arquivo com um nome truncado, ou não salva.
 */
export function nomeDoArquivoDePdf(titulo: string, chave: FormatoDePdfDaProva): string {
  const base = (titulo || 'prova')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return `${base || 'prova'}-${opcaoDePdf(chave).sufixo}.pdf`
}

/**
 * O que falta nesta prova para o gabarito comentado valer alguma coisa.
 *
 * Uma prova pode não ter comentário nenhum — nada impede de cadastrar questões
 * sem explicação. O arquivo sai do mesmo jeito (o gabarito continua marcado),
 * mas quem clicou em "resposta comentada" precisa saber ANTES que vai receber
 * um documento sem comentários; senão o arquivo vazio parece defeito do
 * gerador. Devolve `null` quando não há nada a avisar.
 */
export function avisoDoGabaritoComentado(prova: Pick<Exam, 'questions'>): string | null {
  // Sem o array não dá para afirmar nada: a listagem de /provas vem sem
  // `questions` de propósito, e um "esta prova não tem questões" ali seria uma
  // acusação falsa contra uma prova cheia delas.
  if (!Array.isArray(prova?.questions)) return null
  const questoes: Question[] = prova.questions
  if (questoes.length === 0) return 'Esta prova ainda não tem questões cadastradas.'

  const comComentario = questoes.filter((questao) => {
    if (String(questao?.explanation || '').trim()) return true
    const porAlternativa = questao?.commentedFeedback?.explanations
    if (porAlternativa && Object.values(porAlternativa).some((texto) => String(texto || '').trim())) {
      return true
    }
    return (questao?.keyPoints || []).some((ponto) => String(ponto?.description || '').trim())
  }).length

  if (comComentario === 0) {
    return 'Nenhuma questão desta prova tem resposta comentada — o PDF sai com o gabarito marcado, mas sem comentários.'
  }
  if (comComentario < questoes.length) {
    return `${comComentario} de ${questoes.length} questões têm resposta comentada; as demais saem só com o gabarito marcado.`
  }
  return null
}
