import type { Exam } from '@/lib/types'
import { eProvaSemJanela, type FaseDaProva } from '@/lib/provas/janela-da-prova'

/**
 * O relógio da prova pode mudar embaixo de quem está esperando.
 *
 * ## O buraco que isto fecha
 *
 * A tela da prova busca o documento UMA vez (`GET /api/exams/[id]`, no
 * `loadExam`) e, a partir dele, recalcula a janela a cada segundo com o
 * relógio do navegador. Isso é certo enquanto os horários da prova são fixos —
 * e eles não são: `/admin/exams` tem "Forçar Início", que grava `startTime` e
 * `gatesOpen` como AGORA (ver `app/api/exams/[id]/force-time/route.ts`).
 *
 * O admin clicava, o banco mudava, e a sala de espera continuava contando para
 * o horário antigo: a contagem regressiva do aluno era a de uma prova que já
 * tinha começado. A única saída era o F5 — e "recarregue a página" é
 * exatamente o que uma sala de espera não pode pedir, porque a pessoa está ali
 * justamente para não precisar ficar conferindo.
 *
 * Nada disso é culpa do relógio local: ele acerta a passagem do TEMPO; o que
 * ele não tem como saber é que a prova trocou de horário. Por isso a tela
 * pergunta ao servidor de tempos em tempos — e só os horários, não a prova
 * inteira com as questões dentro.
 *
 * Este módulo é a decisão, separada da tela e do fetch: o que comparar, quando
 * vale a pena perguntar, e o que fazer com a resposta.
 */

/** Os quatro instantes da janela, em texto ISO (ou `null` quando não existem). */
export interface InstantesDaJanela {
  gatesOpen: string | null
  startTime: string | null
  endTime: string | null
  gatesClose: string | null
}

/** Os campos que a comparação lê — `Date` no servidor, texto depois do JSON. */
export type HorariosCrus = {
  gatesOpen?: Date | string | null
  startTime?: Date | string | null
  endTime?: Date | string | null
  gatesClose?: Date | string | null
}

function paraIso(valor: Date | string | null | undefined): string | null {
  if (!valor) return null
  const data = valor instanceof Date ? valor : new Date(valor)
  return Number.isFinite(data.getTime()) ? data.toISOString() : null
}

/**
 * Normaliza os horários para comparar maçã com maçã.
 *
 * O documento que veio do banco traz `Date`; o mesmo documento depois de uma
 * volta pelo JSON traz `string`. Comparar os dois direto (`!==`) acusaria
 * mudança em toda resposta, e a tela se reconstruiria a cada 15 segundos sem
 * nada ter mudado.
 */
export function instantesDaJanela(prova: HorariosCrus | null | undefined): InstantesDaJanela {
  return {
    gatesOpen: paraIso(prova?.gatesOpen),
    startTime: paraIso(prova?.startTime),
    endTime: paraIso(prova?.endTime),
    gatesClose: paraIso(prova?.gatesClose),
  }
}

/** Algum dos quatro instantes mudou? */
export function instantesMudaram(antes: InstantesDaJanela, depois: InstantesDaJanela): boolean {
  return (
    antes.gatesOpen !== depois.gatesOpen ||
    antes.startTime !== depois.startTime ||
    antes.endTime !== depois.endTime ||
    antes.gatesClose !== depois.gatesClose
  )
}

/** O que a tela sabe sobre esta pessoa nesta prova, na hora de decidir. */
export interface SituacaoDaTela {
  prova: (HorariosCrus & Partial<Exam>) | null | undefined
  /** Esta pessoa já está respondendo. */
  emAndamento: boolean
  /** Esta pessoa já entregou (agora ou numa visita anterior). */
  jaEntregou: boolean
}

/**
 * Vale a pena perguntar ao servidor?
 *
 * Só antes de começar, e é de propósito.
 *
 * - **Antes de iniciar** — na sala de espera ou na tela de entrada — os
 *   horários decidem o que a pessoa vê e quando o botão destrava. É aqui que
 *   "Forçar Início" precisa chegar.
 * - **Durante a prova** a tela deixa de perguntar — e não por desinteresse pelo
 *   término, mas porque ali existe um aviso melhor e de graça: a gravação do
 *   rascunho já bate de 12 em 12 segundos, e a recusa dela diz que a prova
 *   fechou (ver `encerradaPeloServidor` em `app/exam/[id]/page.tsx`). Repetir
 *   essa pergunta numa fase que dura horas, para toda a turma, seria pagar
 *   duas vezes pela mesma notícia.
 * - **Prova de treino e prova pessoal** não têm janela nenhuma
 *   (`fase: 'livre'`): não há horário para sincronizar.
 * - **Quem já entregou** não tem mais nada esperando por um horário.
 */
export function deveSincronizarAJanela(situacao: SituacaoDaTela): boolean {
  if (!situacao.prova) return false
  if (eProvaSemJanela(situacao.prova)) return false
  if (situacao.emAndamento || situacao.jaEntregou) return false
  return true
}

/**
 * Os horários novos, prontos para entrar no documento que a tela guarda.
 *
 * `Date` e não texto: o resto da tela (`resolverJanelaDaProva`, `Countdown`,
 * `prazoDeEntrega`) trabalha com datas, e um campo que às vezes é `string` e
 * às vezes é `Date` é uma armadilha esperando a próxima comparação.
 *
 * Um campo ausente na resposta volta como `undefined` — apagar `gatesOpen` no
 * editor tem de apagar também na tela de quem está esperando, senão o portão
 * continuaria abrindo num horário que não existe mais.
 */
export function aplicarInstantes(instantes: InstantesDaJanela): Partial<Exam> {
  const data = (valor: string | null) => (valor ? new Date(valor) : undefined)
  return {
    gatesOpen: data(instantes.gatesOpen),
    startTime: data(instantes.startTime),
    endTime: data(instantes.endTime),
    gatesClose: data(instantes.gatesClose),
  } as Partial<Exam>
}

/** De quanto em quanto tempo a tela pergunta, enquanto a aba está à vista. */
export const CADENCIA_DA_ESPERA = 15_000
/** O ritmo de quem já viu a prova encerrar — perguntar, mas de longe. */
export const CADENCIA_DA_PROVA_ENCERRADA = 60_000

/**
 * O ritmo da pergunta, pela fase.
 *
 * Quinze segundos é o atraso máximo entre o admin clicar em "Forçar Início" e
 * a sala de espera saber — perto do que uma pessoa esperando já toleraria como
 * "foi na hora", e longe do desperdício de perguntar a cada segundo por uma
 * data que muda uma vez por prova (ou nenhuma).
 *
 * Numa prova encerrada quase nada resta para mudar: o ciclo continua, porque o
 * admin ainda pode esticar o `endTime` de uma prova que ele terminou cedo
 * demais, mas de minuto em minuto. A aba esquecida numa prova que acabou não
 * pode custar o mesmo que a sala cheia esperando o início.
 */
export function cadenciaDaSincronizacao(fase: FaseDaProva | null | undefined): number {
  return fase === 'encerrada' ? CADENCIA_DA_PROVA_ENCERRADA : CADENCIA_DA_ESPERA
}
