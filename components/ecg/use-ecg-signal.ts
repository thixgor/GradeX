'use client'

import { useMemo } from 'react'
import { synthesizeLead, LEADS, type EcgPattern, type LeadName } from '@/lib/ecg/engine'

/** Sintetiza (e memoiza) o sinal de todas as 12 derivações para um padrão. */
export function useEcg12(pattern: EcgPattern, durationMs = 10000, fs = 250) {
  return useMemo(() => {
    const map = {} as Record<LeadName, Float32Array>
    for (const lead of LEADS) map[lead] = synthesizeLead(pattern, lead, { durationMs, fs, seed: 7 })
    return { map, fs, durationMs }
  }, [pattern, durationMs, fs])
}

/** Sintetiza (e memoiza) o sinal de uma única derivação. */
export function useEcgLead(pattern: EcgPattern, lead: LeadName, durationMs = 10000, fs = 250) {
  return useMemo(
    () => ({ signal: synthesizeLead(pattern, lead, { durationMs, fs, seed: 7 }), fs, durationMs }),
    [pattern, lead, durationMs, fs],
  )
}
