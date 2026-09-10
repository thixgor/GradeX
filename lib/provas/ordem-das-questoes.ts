import type { Question } from '@/lib/types'

/**
 * A ordem das questões dentro do editor de provas — e como reconhecer uma
 * questão sem abrir uma por uma.
 *
 * ## O problema das setinhas
 *
 * O editor movia questão com dois botões: uma seta para cima e uma para baixo,
 * que TROCAVAM a questão atual com a vizinha. Funciona, mas exige do admin uma
 * conta que ele não tem como fazer: para levar a questão 12 para o lugar da 3
 * são nove cliques, e a cada clique a única coisa que a tela diz é "12/40" —
 * um número que não conta o que tem lá dentro. Ele empurra às cegas e confere
 * no fim.
 *
 * Daí as duas peças deste arquivo:
 *
 * - `moverQuestao` INSERE a questão na posição de destino em vez de trocar com
 *   ela. É o que "arrastar a questão 12 e soltar na frente da 3" significa: as
 *   do meio descem um lugar, ninguém é catapultado para o outro extremo da
 *   prova. (Entre vizinhas, inserir e trocar dão no mesmo — por isso as setas
 *   podem usar a mesma função sem mudar de comportamento.)
 * - `resumoDaQuestao` responde "de que trata a questão 12?" com a FONTE do
 *   enunciado ("ENEM 2023", "APG 4 — Cardio"), que é como o admin nomeia as
 *   questões dele. Quando não há fonte, o começo do próprio enunciado serve:
 *   qualquer texto é melhor do que um número solto.
 *
 * ## Numeração
 *
 * `question.number` é sempre a posição na prova, começando em 1 — é o que a
 * prova mostra ao aluno e o que as validações citam ("Questão 7: preencha o
 * enunciado"). Qualquer função daqui que mexe na ordem devolve a lista já
 * renumerada, em objetos novos: renumerar mutando os objetos do estado é como
 * o React perde o rastro de uma mudança.
 */

/** Move a questão de `de` para a posição `para`, renumerando a prova inteira. */
export function moverQuestao<T extends { number: number }>(questoes: T[], de: number, para: number): T[] {
  if (de === para) return questoes
  if (de < 0 || de >= questoes.length) return questoes
  if (para < 0 || para >= questoes.length) return questoes

  const nova = [...questoes]
  const [movida] = nova.splice(de, 1)
  nova.splice(para, 0, movida)

  return nova.map((q, i) => (q.number === i + 1 ? q : { ...q, number: i + 1 }))
}

/**
 * O índice final de uma questão solta ANTES da questão de índice `insercao`.
 *
 * Arrastar fala em "entre a 3 e a 4" (uma fenda, que vai de 0 a n), mas
 * `moverQuestao` fala em índice de questão (0 a n-1). A conversão tem uma
 * pegadinha: ao arrastar para a frente, a própria questão sai da lista antes
 * de voltar, então toda fenda depois dela vale um a menos. Sem isso, arrastar
 * a questão 2 para "entre a 5 e a 6" a deixa entre a 4 e a 5.
 */
export function destinoDoArraste(de: number, insercao: number): number {
  return insercao > de ? insercao - 1 : insercao
}

/**
 * Onde foi parar a questão que estava aberta, depois de um arraste.
 *
 * O editor mostra uma questão de cada vez (`currentQuestionIndex`), e mover
 * QUALQUER questão pode mudar o índice da que está na tela. Sem isto, arrastar
 * a questão 12 para o começo trocaria o que está sendo editado por baixo dos
 * dedos de quem arrastou — o pior momento possível para trocar de questão.
 */
export function indiceDepoisDeMover(atual: number, de: number, para: number): number {
  if (de === para) return atual
  // Quem foi arrastada é quem manda: ela vai para onde foi solta.
  if (atual === de) return para
  // As outras só andam se o trecho remexido passou por cima delas.
  if (de < atual && atual <= para) return atual - 1
  if (para <= atual && atual < de) return atual + 1
  return atual
}

/** De onde saiu o texto que identifica a questão na lista. */
export type OrigemDoResumo = 'fonte' | 'enunciado' | 'tema' | 'comando' | 'vazia'

export interface ResumoDaQuestao {
  /** A fonte do enunciado, quando a questão tem uma. */
  fonte: string
  /** O texto a mostrar na lista: a fonte, ou o começo do enunciado. */
  texto: string
  origem: OrigemDoResumo
}

/** Junta as quebras de linha e os espaços repetidos numa linha só. */
function numaLinha(texto: string | undefined | null): string {
  return (texto || '').replace(/\s+/g, ' ').trim()
}

/** Corta sem partir palavra no meio — cortar em "cardiovascul" não ajuda ninguém. */
export function trecho(texto: string | undefined | null, limite = 60): string {
  const limpo = numaLinha(texto)
  if (limpo.length <= limite) return limpo

  const cortado = limpo.slice(0, limite)
  const ultimoEspaco = cortado.lastIndexOf(' ')
  // Só respeita a palavra se sobrar texto suficiente para valer a pena.
  const base = ultimoEspaco > limite * 0.6 ? cortado.slice(0, ultimoEspaco) : cortado
  return `${base.replace(/[.,;:\-–—]+$/, '')}…`
}

/**
 * Como esta questão se apresenta numa lista.
 *
 * A ordem das tentativas é a ordem em que o admin reconhece a própria questão:
 * a fonte que ele escreveu, o enunciado, o tema da redação e — só para questão
 * recém-criada, ainda sem enunciado — o comando.
 */
export function resumoDaQuestao(questao: Pick<Question, 'statement' | 'statementSource' | 'command' | 'essayTheme'>, limite = 60): ResumoDaQuestao {
  const fonte = numaLinha(questao.statementSource)
  if (fonte) return { fonte, texto: trecho(fonte, limite), origem: 'fonte' }

  const enunciado = numaLinha(questao.statement)
  if (enunciado) return { fonte: '', texto: trecho(enunciado, limite), origem: 'enunciado' }

  const tema = numaLinha(questao.essayTheme)
  if (tema) return { fonte: '', texto: trecho(tema, limite), origem: 'tema' }

  const comando = numaLinha(questao.command)
  if (comando) return { fonte: '', texto: trecho(comando, limite), origem: 'comando' }

  return { fonte: '', texto: '', origem: 'vazia' }
}
