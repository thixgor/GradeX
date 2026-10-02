import { SINAIS } from './sinais'
import { midiasDoSinal } from './acervo'
import type { MidiaClinica } from './midia'
import type { QuestaoSemiologia, QuizSemiologia } from './quiz-tipos'
import { QUIZ_GENETICO } from './quiz-genetico'
import { QUIZ_PELE } from './quiz-pele'
import { QUIZ_CARDIORRESPIRATORIO } from './quiz-cardiorrespiratorio'
import { QUIZ_NEURO } from './quiz-neuro'
import { QUIZ_ABDOME_ENDOCRINO } from './quiz-abdome-endocrino'

export type { QuestaoSemiologia, QuizSemiologia } from './quiz-tipos'

/**
 * Quizzes do Manual de Semiologia: casos clínicos com a consulta inteira e a
 * mídia real da ficha — foto, clipe, vídeo ou ausculta. A resposta comentada
 * devolve o diagnóstico, o apontamento do que olhar na mídia, o mecanismo e a
 * conduta, e o porquê de cada alternativa errada.
 */
export const QUIZZES_SEMIOLOGIA: QuizSemiologia[] = [
  {
    id: 'sindromes-geneticas',
    titulo: 'Síndromes genéticas',
    descricao: 'Fácies, pele e corpo que contam uma herança: trissomias, facomatoses, distúrbios do tecido conjuntivo, de imprinting e de depósito.',
    questoes: QUIZ_GENETICO,
  },
  {
    id: 'pele-e-mucosas',
    titulo: 'Pele e mucosas',
    descricao: 'Lesões que decidem conduta: melanoma, púrpura febril, farmacodermia grave, zóster, hanseníase e pé diabético.',
    questoes: QUIZ_PELE,
  },
  {
    id: 'cardiorrespiratorio',
    titulo: 'Coração, vasos e pulmão',
    descricao: 'Ausculta gravada, jugulares, baqueteamento, estigmas de endocardite e sinais vasculares periféricos.',
    questoes: QUIZ_CARDIORRESPIRATORIO,
  },
  {
    id: 'neurologia',
    titulo: 'Neurologia',
    descricao: 'Face, pupila, tremor, flapping, Babinski, miastenia, tetania e o anel de cobre na córnea.',
    questoes: QUIZ_NEURO,
  },
  {
    id: 'abdome-e-endocrino',
    titulo: 'Abdome e endocrinologia',
    descricao: 'Sinais da parede abdominal, estigmas hepáticos e a pele das doenças endócrinas.',
    questoes: QUIZ_ABDOME_ENDOCRINO,
  },
]

export const QUESTOES_SEMIOLOGIA: QuestaoSemiologia[] = QUIZZES_SEMIOLOGIA.flatMap((quiz) => quiz.questoes)
export const TOTAL_QUESTOES_SEMIOLOGIA = QUESTOES_SEMIOLOGIA.length

export function quizPorId(id: string): QuizSemiologia | undefined {
  return QUIZZES_SEMIOLOGIA.find((quiz) => quiz.id === id)
}

/** A mídia que ilustra a questão, do acervo da ficha. `null` se a ficha não tiver. */
export function midiaDaQuestao(questao: QuestaoSemiologia): MidiaClinica | null {
  const sinal = SINAIS.find((item) => item.slug === questao.sinal)
  if (!sinal) return null
  return midiasDoSinal(sinal)[questao.midia ?? 0] ?? null
}

/** Nome da ficha, para o link de estudo depois da resposta. */
export function nomeDaFicha(questao: QuestaoSemiologia): string | null {
  return SINAIS.find((item) => item.slug === questao.sinal)?.nome ?? null
}
