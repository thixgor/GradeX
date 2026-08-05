'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { COURSE, LESSON_ORDER } from '@/lib/ecg/course/curriculum'

const KEY = 'ecg:course:v1'

export interface LessonResult {
  /** Acertos / total de questões avaliadas (0..1). 1 quando a lição não tem questões. */
  score: number
  /** Timestamp da última conclusão. */
  at: number
  /** Quantas vezes a lição foi concluída (revisões contam). */
  times: number
}

export interface CourseProgress {
  xp: number
  lessons: Record<string, LessonResult>
  /** Data (YYYY-MM-DD) do último dia com lição concluída. */
  lastDay: string | null
  /** Dias seguidos de estudo. */
  streak: number
  /** Recorde de ofensiva. */
  bestStreak: number
  /** Ignora o bloqueio sequencial da trilha. */
  freeMode: boolean
}

const EMPTY: CourseProgress = {
  xp: 0, lessons: {}, lastDay: null, streak: 0, bestStreak: 0, freeMode: false,
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayDiff(a: string, b: string) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const ta = Date.UTC(ay, am - 1, ad)
  const tb = Date.UTC(by, bm - 1, bd)
  return Math.round((tb - ta) / 86400000)
}

function read(): CourseProgress {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw)
    return { ...EMPTY, ...parsed, lessons: { ...(parsed?.lessons || {}) } }
  } catch {
    return EMPTY
  }
}

/**
 * Progresso da trilha guardado no aparelho (localStorage) — sem conta, sem
 * ida ao servidor. XP, ofensiva e desbloqueio sequencial das lições.
 */
export function useCourseProgress() {
  const [progress, setProgress] = useState<CourseProgress>(EMPTY)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = read()
    // A ofensiva expira se o último dia estudado não foi hoje nem ontem.
    if (loaded.lastDay && dayDiff(loaded.lastDay, today()) > 1) loaded.streak = 0
    setProgress(loaded)
    setHydrated(true)
  }, [])

  const persist = useCallback((next: CourseProgress) => {
    setProgress(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* cota cheia / modo privado */ }
  }, [])

  const completeLesson = useCallback((lessonId: string, score: number, xp: number) => {
    setProgress((prev) => {
      const day = today()
      const prevResult = prev.lessons[lessonId]
      // Revisão vale menos: XP cheio só na primeira conclusão.
      const gained = Math.round((prevResult ? xp * 0.3 : xp) * (0.5 + 0.5 * score))

      let streak = prev.streak
      if (prev.lastDay !== day) {
        streak = prev.lastDay && dayDiff(prev.lastDay, day) === 1 ? prev.streak + 1 : 1
      }
      if (streak === 0) streak = 1

      const next: CourseProgress = {
        ...prev,
        xp: prev.xp + gained,
        lessons: {
          ...prev.lessons,
          [lessonId]: {
            score: Math.max(score, prevResult?.score ?? 0),
            at: Date.now(),
            times: (prevResult?.times ?? 0) + 1,
          },
        },
        lastDay: day,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
      }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const setFreeMode = useCallback((v: boolean) => {
    setProgress((prev) => {
      const next = { ...prev, freeMode: v }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const reset = useCallback(() => persist(EMPTY), [persist])

  const isDone = useCallback((id: string) => !!progress.lessons[id], [progress.lessons])

  /** Uma lição abre quando a anterior da trilha foi concluída (ou no modo livre). */
  const isUnlocked = useCallback((id: string) => {
    if (progress.freeMode) return true
    const idx = LESSON_ORDER.indexOf(id)
    if (idx <= 0) return true
    return !!progress.lessons[LESSON_ORDER[idx - 1]]
  }, [progress.freeMode, progress.lessons])

  const stats = useMemo(() => {
    const total = LESSON_ORDER.length
    const done = LESSON_ORDER.filter((id) => progress.lessons[id]).length
    const modulesDone = COURSE.filter((m) => m.lessons.every((l) => progress.lessons[l.id])).length
    const scores = Object.values(progress.lessons).map((r) => r.score)
    const accuracy = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0, modulesDone, accuracy }
  }, [progress.lessons])

  /** Próxima lição não concluída, na ordem da trilha. */
  const nextLessonId = useMemo(
    () => LESSON_ORDER.find((id) => !progress.lessons[id]) ?? null,
    [progress.lessons],
  )

  return {
    progress, hydrated, stats, nextLessonId,
    completeLesson, isDone, isUnlocked, setFreeMode, reset,
  }
}
