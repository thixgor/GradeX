import type { Exam } from '@/lib/types'
import { canDownloadExamPdf } from '@/lib/tier-limits'
import { eProvaSemJanela, fimDaProva } from './janela-da-prova'

/**
 * Quem pode baixar o quê, nesta prova, agora.
 *
 * ## As duas perguntas que se misturavam
 *
 * Baixar o PDF de uma prova esbarrava em duas regras diferentes que nunca
 * estiveram no mesmo lugar:
 *
 *  1. **Cargo** — `canDownloadExamPdf()`: PDF de prova é o que o Quest+ vende.
 *     Estava aplicada na tela inicial da prova e em `/provas`, e **não estava**
 *     nos botões da tela de resultado ("Relatório", "Relatório + Gabarito") nem
 *     na página de relatório. A mesma conta gratuita ouvia "assine para baixar"
 *     antes da prova e baixava dois PDFs depois dela.
 *  2. **Tempo** — o gabarito não pode sair antes do fim da prova. Isso existia
 *     em três lugares com três critérios: um modal olhava `endTime`, o
 *     sanitizador olhava `gatesClose ?? endTime` **ou** "já entregou", e a
 *     página de resultados não olhava nada.
 *
 * O "já entregou" era o mais caro dos três. Numa prova aplicada ao mesmo tempo
 * para uma turma inteira, quem entrega às 14h05 recebia o gabarito enquanto a
 * turma responde até as 16h — e o gabarito é um arquivo, que se manda no grupo.
 * Entregar cedo não pode virar acesso antecipado à resposta.
 *
 * ## A exceção do admin
 *
 * `freeDownloads` é a liberação por prova: o admin marca, naquela prova, que os
 * PDFs saem para qualquer conta — inclusive gratuita. Nasce desligada e é
 * decidida prova a prova, do mesmo jeito que `pdfDownloadEnabled` funciona nos
 * materiais (ver `lib/material-download-permission.ts`).
 *
 * A exceção vale para o **cargo**, nunca para o **tempo**: liberar o download
 * de uma prova não antecipa o gabarito dela. As duas regras continuam
 * independentes, e a de tempo é a que não tem exceção.
 */

/** Os três arquivos que uma prova produz para o aluno. */
export interface LiberacoesDeDownload {
  /** O PDF da prova em branco (enunciados e alternativas, sem gabarito). */
  prova: boolean
  /** O relatório do aluno: a prova dele com as respostas marcadas. */
  relatorio: boolean
  /** Gabarito e resposta comentada — só depois do fim da prova. */
  gabarito: boolean
}

export const LIBERACOES_PADRAO: LiberacoesDeDownload = {
  prova: false,
  relatorio: false,
  gabarito: false,
}

/** Normaliza o bloco vindo do formulário/banco (ausente = tudo desligado). */
export function normalizarLiberacoes(valor: unknown): LiberacoesDeDownload {
  const bruto = (valor || {}) as Partial<Record<keyof LiberacoesDeDownload, unknown>>
  return {
    prova: bruto.prova === true,
    relatorio: bruto.relatorio === true,
    gabarito: bruto.gabarito === true,
  }
}

export function algumaLiberacaoLigada(liberacoes: LiberacoesDeDownload): boolean {
  return liberacoes.prova || liberacoes.relatorio || liberacoes.gabarito
}

/**
 * A prova, vista de uma submissão.
 *
 * A lista de provas feitas (`/profile` e o diálogo de `/provas`) não carrega o
 * documento da prova — ela tem a submissão, com alguns campos da prova
 * anexados. Este mapeamento é o que permite aplicar o mesmo veredito ali, e
 * mora aqui porque é ele que quebra em silêncio: esquecer `freeDownloads`
 * derruba a exceção do admin sem erro nenhum, e esquecer `isPersonalExam` faz
 * uma prova pessoal esperar um término que nunca chega.
 */
export interface ProvaDeUmaSubmissao {
  examEndTime?: Date | string | null
  isPracticeExam?: boolean
  isPersonalExam?: boolean
  freeDownloads?: { prova?: boolean; relatorio?: boolean; gabarito?: boolean } | null
}

export function provaDaSubmissao(submissao: ProvaDeUmaSubmissao): Partial<Exam> {
  return {
    endTime: (submissao.examEndTime ?? undefined) as Exam['endTime'],
    isPracticeExam: !!submissao.isPracticeExam,
    isPersonalExam: !!submissao.isPersonalExam,
    freeDownloads: submissao.freeDownloads || undefined,
  } as Partial<Exam>
}

export interface ContextoDeDownload {
  accountType?: string | null
  isAdmin?: boolean
  /** O aluno já entregou esta prova? */
  jaEnviou?: boolean
  agora?: Date
}

export interface VereditoDeDownload {
  permitido: boolean
  /** Por que não — pronto para a tela. `null` quando permitido. */
  motivo: string | null
  /** `true` quando a recusa é de tempo (some sozinha) e não de plano. */
  esperandoOFim: boolean
}

const MOTIVO_PLANO =
  'O download de PDFs das provas é um recurso das contas assinantes. Assine para baixar e imprimir.'
const MOTIVO_TEMPO =
  'O gabarito só é liberado depois que a prova termina, para não circular enquanto a turma ainda responde.'
const MOTIVO_SEM_ENTREGA =
  'O relatório fica disponível depois que você entregar a prova.'

/**
 * A prova já acabou para todo mundo?
 *
 * Treino e prova pessoal não têm turma esperando: acabam quando o dono entrega.
 */
export function provaJaEncerrou(prova: Partial<Exam> | null | undefined, agora: Date = new Date()): boolean {
  if (!prova) return false
  if (eProvaSemJanela(prova)) return true
  const fim = fimDaProva(prova)
  if (!fim) return false
  return fim.getTime() <= agora.getTime()
}

/** O cargo (ou a exceção da prova) libera downloads desta prova? */
export function cargoLiberaDownloads(
  prova: Partial<Exam> | null | undefined,
  contexto: ContextoDeDownload,
): boolean {
  if (canDownloadExamPdf(contexto.accountType, contexto.isAdmin)) return true
  const liberacoes = normalizarLiberacoes((prova as any)?.freeDownloads)
  return algumaLiberacaoLigada(liberacoes)
}

/**
 * O veredito completo, por arquivo.
 *
 * O admin passa por cima das duas regras: ele monta a prova, precisa conferir o
 * que os alunos vão receber antes de a prova existir para eles.
 */
export function resolverDownloadsDaProva(
  prova: Partial<Exam> | null | undefined,
  contexto: ContextoDeDownload,
): Record<keyof LiberacoesDeDownload, VereditoDeDownload> {
  const agora = contexto.agora ?? new Date()
  const isAdmin = !!contexto.isAdmin
  const liberacoes = normalizarLiberacoes((prova as any)?.freeDownloads)
  const temCargo = canDownloadExamPdf(contexto.accountType, isAdmin)
  const encerrou = provaJaEncerrou(prova, agora)
  const semJanela = eProvaSemJanela(prova)

  function veredito(
    arquivo: keyof LiberacoesDeDownload,
    exigeFim: boolean,
    exigeEntrega: boolean,
  ): VereditoDeDownload {
    if (isAdmin) return { permitido: true, motivo: null, esperandoOFim: false }

    if (exigeFim && !encerrou) {
      return { permitido: false, motivo: MOTIVO_TEMPO, esperandoOFim: true }
    }
    // Numa prova avaliativa o relatório é da prova entregue; no treino a pessoa
    // é dona do conteúdo e não depende de entrega nenhuma.
    if (exigeEntrega && !semJanela && !contexto.jaEnviou) {
      return { permitido: false, motivo: MOTIVO_SEM_ENTREGA, esperandoOFim: true }
    }
    if (!temCargo && !liberacoes[arquivo]) {
      return { permitido: false, motivo: MOTIVO_PLANO, esperandoOFim: false }
    }
    return { permitido: true, motivo: null, esperandoOFim: false }
  }

  return {
    prova: veredito('prova', false, false),
    relatorio: veredito('relatorio', false, true),
    gabarito: veredito('gabarito', true, false),
  }
}
