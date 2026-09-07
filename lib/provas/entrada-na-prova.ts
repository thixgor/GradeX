import type { Db } from 'mongodb'
import type { Exam } from '@/lib/types'
import { resolverJanelaDaProva } from './janela-da-prova'

/**
 * Quem passou pelo portão, e quando.
 *
 * ## Por que isto precisa existir
 *
 * O portão de uma prova é um limitador de CHEGADA: "dá para entrar das 13h às
 * 13h50; a prova é às 14h". Quem chegou a tempo faz a prova — o portão fechar
 * às 13h50 é um fato sobre quem ainda está na rua, não sobre quem já está
 * sentado na sala.
 *
 * Para o servidor honrar isso, ele precisa saber quem está sentado. Sem um
 * registro, as duas únicas opções eram péssimas: exigir o portão aberto no
 * instante do clique (e aí ninguém começa uma prova cujo portão fecha antes do
 * início — o vestibular inteiro trava) ou não exigir nada (e aí o portão não
 * existe: qualquer um digita o endereço às 15h e entra).
 *
 * Este arquivo é a terceira opção: um documento por pessoa por prova, gravado
 * pelo servidor no momento em que a entrada foi de fato permitida, com o
 * relógio do servidor.
 *
 * ## O que ele deliberadamente NÃO é
 *
 * Não é `exam_attempts`. Aquilo é telemetria: o cliente manda pings, e
 * `openedAt` marca "a página abriu" — inclusive antes de o portão abrir e
 * depois de ele fechar, porque a página abre de qualquer jeito. Um controle de
 * acesso não pode ser derivado de um dado que o próprio navegador declara.
 *
 * Não é `exam_progress` (o rascunho da retomada). Aquele só nasce quando a
 * pessoa já está RESPONDENDO — tarde demais para autorizar o começo.
 *
 * ## Uma entrada, para sempre
 *
 * `$setOnInsert`: quem entrou às 13h30 e recarregou a página às 13h55 continua
 * com 13h30. Reescrever o instante a cada visita transformaria o registro num
 * "última vez que apareceu", e o portão passaria a fechar para quem já estava
 * dentro na primeira vez que ele atualizasse a aba.
 */

export const COLECAO_DE_ENTRADAS = 'exam_entries'

export interface EntradaNaProva {
  examId: string
  userId: string
  /** Instante em que o servidor autorizou a passagem. Nunca reescrito. */
  entrouEm: Date
  /**
   * O que a pessoa preencheu na sala de espera — a "folha de presença".
   *
   * ## Por que isto mora AQUI e não no rascunho da prova
   *
   * Nome e assinatura são preenchidos ANTES de a prova começar: é o que a sala
   * de espera pede enquanto a contagem regressiva corre. O rascunho
   * (`exam_progress`) só nasce quando a pessoa já está respondendo, e a rota
   * que o grava recusa qualquer envio com a janela fechada (`podeEnviar` é
   * falso antes do início) — de propósito, porque gravar respostas antes da
   * hora seria responder antes da hora.
   *
   * Então, até esta funcionalidade existir, a assinatura feita na sala de
   * espera vivia só no estado do React: ela chegava ao servidor junto com a
   * primeira gravação do rascunho, isto é, depois do início. Quem assinou às
   * 13h20 aparecia como "não assinou" até as 14h — e o painel do admin, que
   * existe justamente para conferir a presença antes de a prova abrir, não
   * tinha o que mostrar.
   *
   * O registro de entrada é o lugar certo: ele já é o fato "esta pessoa está
   * na sala", gravado pelo servidor, e a folha de presença é um atributo desse
   * fato.
   */
  nomeDeclarado?: string
  /** A imagem da assinatura em base64 (`data:image/...`). */
  assinatura?: string
  /** Quando a assinatura foi gravada. Ausente = ainda não assinou. */
  assinadoEm?: Date | null
  /** A transcrição da frase-tema, quando a prova pede uma. */
  transcricaoDaFrase?: string
  /** Última vez que a folha de presença mudou. */
  atualizadoEm?: Date
}

/** Teto da imagem da assinatura — o mesmo do rascunho da prova. */
export const LIMITE_DA_ASSINATURA = 400_000

/** O que a sala de espera manda enquanto a pessoa espera. */
export interface FolhaDePresenca {
  nome?: string | null
  assinatura?: string | null
  transcricao?: string | null
}

export interface ResultadoDoCheckIn {
  /** Havia registro de entrada para atualizar. */
  gravou: boolean
  /** Há assinatura gravada depois desta chamada. */
  assinou: boolean
}

/**
 * Grava a folha de presença de quem está na sala.
 *
 * Sem `upsert`, e isso é a regra de acesso, não um detalhe: só quem já passou
 * pelo portão tem registro para atualizar. Um POST desta rota vindo de quem
 * nunca entrou não cria presença nenhuma — ele não encontra documento e volta
 * `gravou: false`.
 *
 * A assinatura só é gravada quando de fato parece uma imagem, e `assinadoEm`
 * acompanha o gesto: apagar a assinatura no campo apaga também a marca de
 * quando ela existiu, senão o painel continuaria dizendo "assinou às 13h20"
 * sobre um campo em branco.
 */
export async function registrarFolhaDePresenca(
  db: Db,
  examId: string,
  userId: string,
  folha: FolhaDePresenca,
  agora: Date = new Date(),
): Promise<ResultadoDoCheckIn> {
  const set: Record<string, unknown> = { atualizadoEm: agora }
  const unset: Record<string, unknown> = {}
  let assinou = false

  if (typeof folha.nome === 'string') set.nomeDeclarado = folha.nome.slice(0, 160)
  if (typeof folha.transcricao === 'string') {
    set.transcricaoDaFrase = folha.transcricao.slice(0, 2000)
  }

  if (typeof folha.assinatura === 'string' && folha.assinatura.startsWith('data:image/')) {
    set.assinatura = folha.assinatura.slice(0, LIMITE_DA_ASSINATURA)
    set.assinadoEm = agora
    assinou = true
  } else if (folha.assinatura === '' || folha.assinatura === null) {
    unset.assinatura = ''
    unset.assinadoEm = ''
  }

  const update: Record<string, unknown> = { $set: set }
  if (Object.keys(unset).length > 0) update.$unset = unset

  const resultado = await db
    .collection<EntradaNaProva>(COLECAO_DE_ENTRADAS)
    .updateOne({ examId, userId }, update as any)

  return { gravou: resultado.matchedCount > 0, assinou }
}

/** Esta pessoa já passou pelo portão desta prova? */
export async function jaEntrouNaProva(db: Db, examId: string, userId: string): Promise<boolean> {
  const registro = await db
    .collection<EntradaNaProva>(COLECAO_DE_ENTRADAS)
    .findOne({ examId, userId }, { projection: { _id: 1 } })
  return !!registro
}

export interface ResultadoDaEntrada {
  /** A pessoa está dentro — agora ou desde antes. */
  dentro: boolean
  /** Esta chamada foi a que registrou a passagem. */
  registrouAgora: boolean
  /** Frase pronta quando a entrada foi recusada. */
  motivo: string | null
}

/**
 * Tenta registrar a passagem pelo portão.
 *
 * A autorização é recalculada aqui, com `resolverJanelaDaProva` e o relógio do
 * servidor — o cliente pede, o servidor decide. Uma prova sem janela (treino,
 * prova pessoal) não tem portão e não gera registro: `jaEntrou` é irrelevante
 * quando `podeIniciar` já é verdadeiro sempre.
 */
export async function registrarEntrada(
  db: Db,
  prova: Pick<Exam, 'startTime' | 'endTime'> & Partial<Exam>,
  examId: string,
  userId: string,
  agora: Date = new Date(),
): Promise<ResultadoDaEntrada> {
  const janela = resolverJanelaDaProva(prova, agora)

  if (janela.fase === 'livre') {
    return { dentro: true, registrouAgora: false, motivo: null }
  }

  const jaEstava = await jaEntrouNaProva(db, examId, userId)
  if (jaEstava) return { dentro: true, registrouAgora: false, motivo: null }

  if (!janela.podeEntrar) {
    return { dentro: false, registrouAgora: false, motivo: janela.motivo }
  }

  const resultado = await db.collection<EntradaNaProva>(COLECAO_DE_ENTRADAS).updateOne(
    { examId, userId },
    { $setOnInsert: { examId, userId, entrouEm: agora } },
    { upsert: true },
  )

  return { dentro: true, registrouAgora: !!resultado.upsertedCount, motivo: null }
}

/**
 * Apaga os registros de entrada de uma prova.
 *
 * ## Por que uma entrada pode deixar de valer
 *
 * O registro diz "passei pelo portão DESTA prova". Ele não guarda qual era o
 * portão — e não precisava, enquanto a janela de uma prova fosse fixa. Quando
 * o admin remarca a prova, o portão pelo qual a pessoa passou deixa de
 * existir, e o registro passa a autorizar uma entrada que nunca aconteceu: a
 * prova adiada para a semana seguinte já começa com meia turma "dentro".
 *
 * O sintoma que trouxe isto à tona é o do próprio admin testando: ele abre a
 * prova enquanto o portão está aberto, remarca os horários para conferir o
 * portão fechado, e a tela continua dizendo "Você está dentro" — porque, para
 * o servidor, ele está mesmo.
 *
 * Apagar é o certo: quem for fazer a prova na janela nova passa pelo portão
 * novo, que é o que o portão existe para registrar.
 */
export async function limparEntradasDaProva(db: Db, examId: string): Promise<number> {
  const resultado = await db
    .collection<EntradaNaProva>(COLECAO_DE_ENTRADAS)
    .deleteMany({ examId })
  return resultado.deletedCount || 0
}

/**
 * A janela desta prova mudou de verdade?
 *
 * Comparar por instante, e não por referência ou texto: o painel reenvia os
 * quatro campos a cada salvamento, e um `Date` novo com o mesmo milissegundo
 * apagaria as entradas de uma prova em andamento só porque alguém corrigiu o
 * título. Ausente dos dois lados também conta como igual.
 */
export function janelaMudou(
  antes: Pick<Exam, 'gatesOpen' | 'gatesClose' | 'startTime' | 'endTime'> | null | undefined,
  depois: Partial<Pick<Exam, 'gatesOpen' | 'gatesClose' | 'startTime' | 'endTime'>>,
): boolean {
  const campos = ['gatesOpen', 'gatesClose', 'startTime', 'endTime'] as const

  return campos.some((campo) => {
    if (!(campo in depois)) return false
    const valorAntes = instanteDe(antes?.[campo])
    const valorDepois = instanteDe(depois[campo])
    return valorAntes !== valorDepois
  })
}

function instanteDe(valor: unknown): number | null {
  if (!valor) return null
  const data = valor instanceof Date ? valor : new Date(valor as string)
  const ms = data.getTime()
  return Number.isFinite(ms) ? ms : null
}
