'use client'

import { useCallback, useEffect, useState } from 'react'

const FAV_KEY = 'ecg:favorites'
const NOTES_KEY = 'ecg:notes'

/** Favoritos e anotações pessoais do Manual do Eletrocardiograma (localStorage). */
export function useEcgFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const f = JSON.parse(localStorage.getItem(FAV_KEY) || '[]')
      const n = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}')
      if (Array.isArray(f)) setFavorites(f.filter((x) => typeof x === 'string'))
      if (n && typeof n === 'object') setNotes(n)
    } catch { /* ignore */ }
    setReady(true)
  }, [])

  const persistFav = useCallback((next: string[]) => {
    setFavorites(next)
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    persistFav(favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id])
  }, [favorites, persistFav])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  const setNote = useCallback((id: string, value: string) => {
    setNotes((prev) => {
      const next = { ...prev }
      if (value.trim()) next[id] = value; else delete next[id]
      try { localStorage.setItem(NOTES_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  return { favorites, notes, ready, toggleFavorite, isFavorite, setNote }
}
