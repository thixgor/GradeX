'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, FileText, X } from 'lucide-react'
import {
  READING_PROGRESS_EVENT,
  readRecentReadings,
  readingPercent,
  removeReadingProgress,
  type ReadingProgressEntry,
} from '@/lib/material-reading-progress'

/**
 * "Continuar lendo" — atalho para o PDF Viewer no material em que a pessoa
 * parou. Some por completo quando não há leitura registrada (nunca mostra
 * estado vazio) e sai do caminho com um X quando o usuário não quer o lembrete.
 *
 * A origem dos dados é o localStorage escrito pelo próprio leitor
 * (lib/material-reading-progress), então a área só aparece no aparelho onde a
 * leitura aconteceu — exatamente o mesmo alcance da retomada de página que o
 * leitor já fazia.
 */

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return ''
  const diffMs = Date.now() - timestamp
  if (diffMs < 0) return 'agora mesmo'
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

interface ContinueReadingProps {
  /** Quantos cartões mostrar. A área é um atalho, não um histórico. */
  limit?: number
  className?: string
}

export function ContinueReading({ limit = 3, className = '' }: ContinueReadingProps) {
  // `null` = ainda não lemos o localStorage. Renderizar só depois da montagem
  // evita divergência de hidratação (no servidor não existe localStorage).
  const [entries, setEntries] = useState<ReadingProgressEntry[] | null>(null)

  const refresh = useCallback(() => {
    setEntries(readRecentReadings(limit))
  }, [limit])

  useEffect(() => {
    refresh()
    // `storage` cobre outras abas; o evento próprio cobre esta aba (fechar o
    // leitor e voltar para o dashboard sem recarregar, por exemplo).
    window.addEventListener(READING_PROGRESS_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(READING_PROGRESS_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])

  if (!entries || entries.length === 0) return null

  return (
    <section
      aria-label="Continuar lendo"
      className={`rounded-2xl border border-border bg-card p-4 sm:p-5 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-tight">Continuar lendo</h2>
            <p className="truncate text-xs text-muted-foreground">
              Volte de onde você parou no leitor
            </p>
          </div>
        </div>
        <Link
          href="/materiais"
          className="hidden flex-shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary sm:inline-flex"
        >
          Materiais
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => {
          const percent = readingPercent(entry)
          const relative = formatRelativeTime(entry.updatedAt)
          return (
            <li key={entry.materialId} className="group relative">
              <Link
                href={`/materiais/${entry.materialId}/viewer`}
                className="flex h-full items-center gap-3 rounded-xl border border-border bg-background p-2.5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {entry.coverImage ? (
                    <Image
                      src={entry.coverImage}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-primary/70">
                      <FileText className="h-5 w-5" />
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate pr-5 text-sm font-semibold leading-snug">
                    {entry.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {entry.totalPages > 0
                      ? `Página ${entry.page} de ${entry.totalPages}`
                      : `Página ${entry.page}`}
                    {relative ? ` · ${relative}` : ''}
                  </span>

                  {percent !== null && (
                    <span className="mt-2 flex items-center gap-2">
                      <span
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progresso de leitura de ${entry.title}`}
                      >
                        <span
                          className="block h-full rounded-full bg-primary transition-[width] duration-500"
                          style={{ width: `${Math.max(percent, 2)}%` }}
                        />
                      </span>
                      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                        {percent}%
                      </span>
                    </span>
                  )}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  removeReadingProgress(entry.materialId)
                  refresh()
                }}
                title="Remover de Continuar lendo"
                aria-label={`Remover ${entry.title} de Continuar lendo`}
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
