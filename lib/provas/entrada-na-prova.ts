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
