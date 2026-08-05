/**
 * Trilha de ensino do Manual do Eletrocardiograma.
 *
 * A ordem dos módulos é a ordem pedagógica: primeiro de onde vem a
 * eletricidade, depois como a célula responde, depois como isso vira desenho no
 * papel, depois como se mede, como se olha de vários ângulos e, por fim, o que
 * cada anormalidade significa.
 */
import type { CourseModule, Lesson, Step } from './types'
import { MODULO_CONDUCAO, MODULO_CELULA } from './modules/fundamentos'
import { MODULO_ONDAS, MODULO_PAPEL, MODULO_INTERVALOS } from './modules/tracado'
import { MODULO_DERIVACOES, MODULO_FREQUENCIA } from './modules/derivacoes'
import { MODULO_ALTERACOES, MODULO_BLOQUEIOS, MODULO_METABOLICO, MODULO_LAUDO } from './modules/alteracoes'

export const COURSE: CourseModule[] = [
  MODULO_CONDUCAO,
  MODULO_CELULA,
  MODULO_ONDAS,
  MODULO_PAPEL,
  MODULO_INTERVALOS,
  MODULO_DERIVACOES,
  MODULO_FREQUENCIA,
  MODULO_ALTERACOES,
  MODULO_BLOQUEIOS,
  MODULO_METABOLICO,
  MODULO_LAUDO,
]

/** Todas as lições, achatadas na ordem em que devem ser feitas. */
export const ALL_LESSONS: { lesson: Lesson; module: CourseModule; index: number }[] = COURSE.flatMap(
  (module) => module.lessons.map((lesson) => ({ lesson, module, index: 0 })),
).map((item, index) => ({ ...item, index }))

export const LESSON_ORDER: string[] = ALL_LESSONS.map((l) => l.lesson.id)

export function findLesson(id: string) {
  return ALL_LESSONS.find((l) => l.lesson.id === id) ?? null
}

export function lessonAfter(id: string) {
  const i = LESSON_ORDER.indexOf(id)
  if (i < 0 || i >= LESSON_ORDER.length - 1) return null
  return LESSON_ORDER[i + 1]
}

/** Número de passos avaliados (questões) de uma lição. */
export function gradedCount(lesson: Lesson) {
  return lesson.steps.filter((s: Step) => s.kind !== 'teach' && s.kind !== 'lab').length
}

export const COURSE_TOTALS = {
  modules: COURSE.length,
  lessons: LESSON_ORDER.length,
  minutes: ALL_LESSONS.reduce((sum, l) => sum + l.lesson.minutes, 0),
  xp: ALL_LESSONS.reduce((sum, l) => sum + l.lesson.xp, 0),
  questions: ALL_LESSONS.reduce((sum, l) => sum + gradedCount(l.lesson), 0),
}
