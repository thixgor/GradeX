import type { UserAnswer } from '@/lib/types'

/**
 * A prova que sobrevive à queda de conexão.
 *
 * ## O que acontecia antes
 *
 * Nada da prova era gravado em lugar nenhum até o aluno clicar em "Entregar".
 * O `localStorage` guardava exatamente um dado — o instante de início — e as
 * respostas viviam só no estado do React. Fechar a aba sem querer, o navegador
 * do celular recolher a página, a energia cair, o Chrome descartar a aba por
 * memória: qualquer um desses apagava duas horas de prova, e a pessoa voltava
 * para a tela inicial como se nunca tivesse começado.
 *
 * ## O acordo
 *
 * O progresso é gravado no servidor enquanto a pessoa responde. Se ela cair,
 * pode voltar e continuar de onde parou — **uma vez**. A retomada é contada e
 * gravada; a segunda queda não devolve a prova.
 *
 * O limite existe porque "continuar" é poderoso demais para ser ilimitado: sem
 * teto, sair e voltar vira uma ferramenta — pausar a prova para consultar
 * material, esperar o colega terminar, escolher a hora de responder. Uma
 * retomada cobre o acidente; duas já são um padrão.
 *
 * ## O que a retomada NÃO faz
 *
 * Ela devolve o que foi respondido, e só. Não estica a prova nem reabre porta:
 *
 *  - `startedAt` é o do início original, não o da volta — o cronômetro
 *    individual (`duration`) continua correndo desde a primeira vez;
 *  - a janela da prova manda: passou do término, não há o que retomar;
 *  - o portão fechado impede a ENTRADA de quem nunca entrou, mas não a volta de
 *    quem já estava dentro e caiu — é justamente o caso que a retomada existe
 *    para cobrir, e o término continua sendo o limite de todos.
 *
 * O servidor decide as três coisas com o próprio relógio
 * (`lib/provas/janela-da-prova.ts`); o cliente só desenha o veredito.
 */

export const COLECAO_DE_PROGRESSO = 'exam_progress'

/** Quantas vezes a prova pode ser retomada depois de uma queda. */
export const RETOMADAS_PERMITIDAS = 1

/** Intervalo mínimo entre gravações automáticas de progresso. */
export const INTERVALO_DE_GRAVACAO_MS = 12_000

export interface ProgressoDaProva {
  examId: string
  userId: string
  answers: UserAnswer[]
  /** Índice da questão em que a pessoa estava (modo paginado). */
  currentQuestionIndex: number
  /** Ordem em que as questões foram apresentadas a esta pessoa. */
  questionOrder?: string[]
  userName?: string
  themeTranscription?: string
  signature?: string
  /** Início da PRIMEIRA vez. Nunca é reescrito por uma retomada. */
  startedAt: Date
  /** Quantas retomadas já foram consumidas. */
  resumesUsed: number
  lastResumedAt?: Date | null
  updatedAt: Date
}

export type MotivoSemRetomada =
  | 'sem-progresso'
  | 'ja-entregou'
  | 'prova-encerrada'
  /** A janela está fechada porque a prova ainda NÃO começou. */
  | 'prova-nao-comecou'
  | 'retomadas-esgotadas'

export interface VereditoDeRetomada {
  /** Existe progresso gravado para mostrar/entregar. */
  temProgresso: boolean
  /** A pessoa pode voltar a responder. */
  podeRetomar: boolean
  /** Quantas retomadas ainda restam (0 ou 1). */
  retomadasRestantes: number
  /**
   * Dá para entregar o que já estava gravado, mesmo sem poder continuar
   * respondendo. É o que impede a segunda queda de virar nota zero.
   */
  podeEntregarOSalvo: boolean
  motivo: MotivoSemRetomada | null
  mensagem: string | null
}

export interface EntradaDoVeredito {
  progresso: Pick<ProgressoDaProva, 'resumesUsed'> | null | undefined
  jaEntregou: boolean
  /** Da janela da prova: ainda dá para enviar respostas? */
  janelaAberta: boolean
  /**
   * Da janela da prova: já passou do término?
   *
   * `janelaAberta` é falso nos DOIS extremos — antes do início e depois do
   * término —, e sem este segundo dado o veredito tratava os dois como o
   * mesmo: quem abria a prova antes de ela começar (uma correção de horário
   * pelo admin, um `force-time` para trás) lia "A prova já terminou" sobre uma
   * prova cujo portão nem tinha aberto. Ausente = trata como encerrada, que é
   * o comportamento antigo.
   */
  jaEncerrou?: boolean
  respostasGravadas: number
}

export function avaliarRetomada(entrada: EntradaDoVeredito): VereditoDeRetomada {
  const { progresso, jaEntregou, janelaAberta, respostasGravadas } = entrada

  const base = {
    temProgresso: !!progresso,
    retomadasRestantes: Math.max(0, RETOMADAS_PERMITIDAS - (progresso?.resumesUsed ?? 0)),
  }

  if (jaEntregou) {
    return {
      ...base,
      podeRetomar: false,
      podeEntregarOSalvo: false,
      motivo: 'ja-entregou',
      mensagem: 'Esta prova já foi entregue.',
    }
  }

  if (!progresso) {
    return {
      ...base,
      podeRetomar: false,
      podeEntregarOSalvo: false,
      motivo: 'sem-progresso',
      mensagem: null,
    }
  }

  if (!janelaAberta) {
    // Antes do início a prova não acabou — ela ainda vai acontecer, e o
    // rascunho continua esperando. Dizer "já terminou" aqui é assustar quem
    // chegou cedo com a notícia errada.
    const jaEncerrou = entrada.jaEncerrou ?? true

    return {
      ...base,
      podeRetomar: false,
      podeEntregarOSalvo: false,
      motivo: jaEncerrou ? 'prova-encerrada' : 'prova-nao-comecou',
      mensagem: jaEncerrou
        ? 'A prova já terminou. Não é possível continuar — o que você respondeu ficou registrado até o encerramento.'
        : 'A prova ainda não começou. O que você já respondeu está guardado e volta assim que ela abrir.',
    }
  }

  if (base.retomadasRestantes <= 0) {
    return {
      ...base,
      podeRetomar: false,
      // O que estava salvo continua entregável: a regra é "não continua
      // respondendo", não "perde tudo".
      podeEntregarOSalvo: respostasGravadas > 0,
      motivo: 'retomadas-esgotadas',
      mensagem:
        'Você já usou a sua única retomada nesta prova. Ainda dá para entregar as respostas que ficaram gravadas.',
    }
  }

  return {
    ...base,
    podeRetomar: true,
    podeEntregarOSalvo: respostasGravadas > 0,
    motivo: null,
    mensagem: null,
  }
}

/**
 * A prova acabou para esta pessoa — e o que ela respondeu precisa ser entregue.
 *
 * ## Por que a entrega é automática
 *
 * Sem retomada e com respostas gravadas, a pessoa está num limbo: não pode
 * continuar respondendo, e o que ela já fez só vira nota se ela clicar num
 * botão. Quem caiu duas vezes — a conexão do celular, a bateria, a aba
 * descartada — é justamente quem pode não voltar para clicar. O rascunho ficava
 * esperando um gesto que talvez nunca acontecesse, e a prova terminava zerada
 * com as respostas guardadas no banco.
 *
 * A entrega não perde nada: é o mesmo conteúdo que o botão mandaria, pelo
 * mesmo caminho (`POST /submit`), com as mesmas conferências do servidor. O
 * que muda é quem toma a iniciativa.
 */
export function exigeEntregaAutomatica(veredito: VereditoDeRetomada): boolean {
  return veredito.motivo === 'retomadas-esgotadas' && veredito.podeEntregarOSalvo
}

/**
 * Começar do zero apagaria uma prova que existe.
 *
 * O botão "Iniciar Prova" olhava só a janela e a assinatura — nunca a
 * retomada. Quem tinha esgotado a retomada lia "Você já usou a sua única
 * retomada" e, logo abaixo, um botão que começava a prova de novo: a gravação
 * automática seguinte passava por cima do rascunho com o estado vazio, e as
 * respostas que a mensagem prometia preservar sumiam.
 *
 * Havendo progresso que não pode ser retomado, não há prova nova para começar
 * — há uma prova para entregar.
 */
export function inicioBloqueadoPorProgresso(veredito: VereditoDeRetomada | null | undefined): boolean {
  if (!veredito) return false
  if (veredito.motivo === 'ja-entregou') return false
  return veredito.temProgresso && !veredito.podeRetomar
}

/**
 * Mescla o que voltou do servidor com o esqueleto de respostas da prova.
 *
 * O esqueleto (uma entrada por questão, na ordem em que a pessoa a vê) manda na
 * forma; o progresso manda no conteúdo. Assim uma questão adicionada à prova
 * depois da queda aparece em branco em vez de sumir, e uma resposta gravada
 * para uma questão que não existe mais é descartada em silêncio.
 */
export function mesclarRespostas(
  esqueleto: readonly UserAnswer[],
  gravadas: readonly UserAnswer[] | null | undefined,
): UserAnswer[] {
  if (!gravadas || gravadas.length === 0) return [...esqueleto]
  const porQuestao = new Map(gravadas.map((a) => [a.questionId, a]))
  return esqueleto.map((vazia) => {
    const gravada = porQuestao.get(vazia.questionId)
    return gravada ? { ...vazia, ...gravada } : vazia
  })
}

/** Quantas das respostas gravadas têm de fato conteúdo. */
export function contarRespondidas(respostas: readonly UserAnswer[] | null | undefined): number {
  if (!respostas) return 0
  return respostas.filter(
    (a) =>
      !!a.selectedAlternative ||
      !!a.discursiveText?.trim() ||
      !!a.essayText?.trim() ||
      a.discursiveSelfScore !== undefined,
  ).length
}
