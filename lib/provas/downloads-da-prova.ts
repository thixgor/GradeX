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

/** Os arquivos que uma prova produz para o aluno. */
export interface LiberacoesDeDownload {
  /** O PDF da prova em branco (enunciados e alternativas, sem gabarito). */
  prova: boolean
  /** O relatório do aluno: a prova dele com as respostas marcadas. */
  relatorio: boolean
  /** Gabarito e resposta comentada — só depois do fim da prova. */
  gabarito: boolean
  /**
   * A folha de respostas: só as letras que o aluno marcou, uma por linha.
   *
   * É o arquivo que o aluno quer nos minutos seguintes à entrega — conferir o
   * que marcou com os colegas. Não é o gabarito: não diz o que era certo, só o
   * que ELE respondeu, e por isso pode sair antes de a prova terminar sem
   * antecipar resposta nenhuma para ninguém.
   */
  compacto: boolean
}

export const LIBERACOES_PADRAO: LiberacoesDeDownload = {
  prova: false,
  relatorio: false,
  gabarito: false,
  compacto: false,
}

/** Normaliza o bloco vindo do formulário/banco (ausente = tudo desligado). */
export function normalizarLiberacoes(valor: unknown): LiberacoesDeDownload {
  const bruto = (valor || {}) as Partial<Record<keyof LiberacoesDeDownload, unknown>>
  return {
    prova: bruto.prova === true,
    relatorio: bruto.relatorio === true,
    gabarito: bruto.gabarito === true,
    compacto: bruto.compacto === true,
  }
}

export function algumaLiberacaoLigada(liberacoes: LiberacoesDeDownload): boolean {
  return liberacoes.prova || liberacoes.relatorio || liberacoes.gabarito || liberacoes.compacto
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

/**
 * Quando cada arquivo é liberado para o aluno.
 *
 * ## O que estava confuso
 *
 * Isto eram dois blocos de caixinhas: um dizia quem pode baixar (o plano),
 * outro dizia o que espera o término (o tempo). Os dois listavam os MESMOS
 * arquivos, então "PDF da prova (em branco)" aparecia duas vezes na mesma
 * tela, com significados diferentes — e havia uma terceira caixinha, "só
 * depois que o aluno entregar", que falava daquele mesmo arquivo por um
 * terceiro ângulo. Marcá-la junto com a primeira gerava uma combinação que só
 * o código sabia resolver ("vale o que vier por último"), e que ninguém
 * conseguia ler na tela.
 *
 * O eixo do tempo não é uma lista de coisas a segurar: é UMA pergunta por
 * arquivo, com respostas que se excluem. Por isso agora é uma escolha, e não
 * caixinhas que se somam.
 *
 * ## Os três momentos
 *
 *  - `imediato` — sai enquanto a prova acontece.
 *  - `apos-entrega` — sai quando ESTA pessoa entrega a dela. Olha o aluno, não
 *    a turma: quem terminou às 14h30 leva o caderno para casa sem que isso
 *    alcance quem só vai fazer às 17h.
 *  - `apos-termino` — sai quando a prova acaba para todo mundo.
 *
 * Nem todo arquivo aceita os três. A folha de respostas é sempre
 * `apos-entrega` (antes disso não existe resposta para imprimir) e o gabarito
 * é sempre `apos-termino` (é a regra que não tem exceção). Só a prova em
 * branco e o relatório têm escolha — e é por isso que só eles aparecem como
 * pergunta na tela do admin.
 */
export type QuandoLibera = 'imediato' | 'apos-entrega' | 'apos-termino'

export interface EsperasDeDownload {
  /** A prova em branco: os três momentos são possíveis. */
  prova: QuandoLibera
  /**
   * O relatório do aluno. Nunca é `imediato`: ele mostra as respostas dele, e
   * antes de entregar não há o que mostrar.
   */
  relatorio: Exclude<QuandoLibera, 'imediato'>
}

export const ESPERAS_PADRAO: EsperasDeDownload = {
  prova: 'imediato',
  relatorio: 'apos-entrega',
}

const MOMENTOS: QuandoLibera[] = ['imediato', 'apos-entrega', 'apos-termino']

/**
 * Normaliza — inclusive o formato antigo.
 *
 * A primeira versão gravava três booleanos (`prova`, `relatorio`, `entrega`).
 * As provas configuradas naquele formato continuam no banco, e uma leitura que
 * as ignorasse destravaria em silêncio um download que o admin tinha travado.
 * A conversão é direta: quem esperava o término continua esperando o término;
 * o antigo `entrega` vira `apos-entrega` na prova em branco.
 */
export function normalizarEsperas(valor: unknown): EsperasDeDownload {
  const bruto = (valor || {}) as Record<string, unknown>

  const prova: QuandoLibera = MOMENTOS.includes(bruto.prova as QuandoLibera)
    ? (bruto.prova as QuandoLibera)
    : bruto.prova === true
      ? 'apos-termino'
      : bruto.entrega === true
        ? 'apos-entrega'
        : 'imediato'

  const relatorio: EsperasDeDownload['relatorio'] =
    bruto.relatorio === 'apos-termino' || bruto.relatorio === true ? 'apos-termino' : 'apos-entrega'

  return { prova, relatorio }
}

export function esperasDaProva(prova: Partial<Exam> | null | undefined): EsperasDeDownload {
  return normalizarEsperas((prova as any)?.holdDownloads)
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
  'Este arquivo é liberado depois que a prova termina, para não circular enquanto a turma ainda responde.'
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

  /*
   * A espera que o admin escolheu entra AQUI, e não como um quarto motivo de
   * recusa: para quem está esperando, "o arquivo sai quando a prova terminar" é
   * a mesma frase, tenha ela vindo da regra fixa do gabarito ou da opção da
   * prova. O que muda é só quais arquivos a exigem.
   */
  const esperas = normalizarEsperas((prova as any)?.holdDownloads)

  return {
    prova: veredito(
      'prova',
      esperas.prova === 'apos-termino',
      esperas.prova === 'apos-entrega',
    ),
    // O relatório sempre exige a entrega — é a prova respondida por ele.
    relatorio: veredito('relatorio', esperas.relatorio === 'apos-termino', true),
    gabarito: veredito('gabarito', true, false),
    /*
     * A folha de respostas segue a entrega, nunca o término.
     *
     * É o único arquivo cujo conteúdo é apenas o que a própria pessoa marcou —
     * não tem enunciado nem gabarito. Prendê-lo até o fim seria esconder de
     * alguém aquilo que ela mesma acabou de escrever.
     */
    compacto: veredito('compacto', false, true),
  }
}
