'use client'

/**
 * Envio em lote das imagens de uma importação.
 *
 * A ordem é a informação principal aqui: cada miniatura mostra o número que o
 * usuário usa nos marcadores (`{{img3}}`) e que define para qual lado de qual
 * cartão a imagem vai na distribuição automática. Por isso as miniaturas são
 * reordenáveis e o número é grande.
 */

import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  FLASHCARD_IMAGE_ACCEPT,
  uploadFlashcardImage,
  validateFlashcardImage,
} from '@/lib/flashcard-image-upload'

export interface BulkImageItem {
  id: string
  url?: string
  name: string
  preview: string
  status: 'uploading' | 'done' | 'error'
  error?: string
}

interface FlashcardBulkImagesProps {
  items: BulkImageItem[]
  onChange: (items: BulkImageItem[]) => void
  /** Rótulo curto de para onde cada posição vai (ex.: "Cartão 2 · verso"). */
  describeSlot?: (index: number) => string | undefined
  /**
   * Controles que precisam ficar acima da grade. Com uma centena de imagens a
   * grade fica alta demais para caber na tela, e qualquer coisa depois dela é
   * na prática inalcançável.
   */
  toolbar?: ReactNode
  disabled?: boolean
  className?: string
}

function makeId() {
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function FlashcardBulkImages({
  items,
  onChange,
  describeSlot,
  toolbar,
  disabled,
  className,
}: FlashcardBulkImagesProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  // `items` muda a cada upload concluído; a ref evita que um lote grande
  // sobrescreva o resultado de outro que terminou no meio do caminho.
  const itemsRef = useRef(items)
  itemsRef.current = items

  const patchItem = useCallback((id: string, patch: Partial<BulkImageItem>) => {
    const next = itemsRef.current.map(item => (item.id === id ? { ...item, ...patch } : item))
    itemsRef.current = next
    onChange(next)
  }, [onChange])

  const addFiles = useCallback(async (files: File[]) => {
    // Ordem alfabética do nome: é assim que "imagem-01, imagem-02..." sai de
    // uma pasta, e é a ordem que o usuário enxerga no seletor do sistema.
    const sorted = [...files].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { numeric: true, sensitivity: 'base' }),
    )

    const pending: BulkImageItem[] = sorted.map(file => ({
      id: makeId(),
      name: file.name,
      preview: URL.createObjectURL(file),
      status: 'uploading' as const,
    }))

    const next = [...itemsRef.current, ...pending]
    itemsRef.current = next
    onChange(next)

    // Sobe de três em três: rápido o bastante para 30 imagens e leve o
    // suficiente para não estrangular a conexão de quem está no celular.
    const queue = sorted.map((file, idx) => ({ file, item: pending[idx] }))
    const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (queue.length) {
        const job = queue.shift()
        if (!job) break
        const invalid = validateFlashcardImage(job.file)
        if (invalid) {
          patchItem(job.item.id, { status: 'error', error: invalid })
          continue
        }
        try {
          const url = await uploadFlashcardImage(job.file)
          patchItem(job.item.id, { status: 'done', url })
        } catch (err: any) {
          patchItem(job.item.id, { status: 'error', error: err?.message || 'Falha no envio' })
        }
      }
    })
    await Promise.all(workers)
  }, [onChange, patchItem])

  function remove(id: string) {
    const target = items.find(i => i.id === id)
    if (target?.preview.startsWith('blob:')) URL.revokeObjectURL(target.preview)
    onChange(items.filter(i => i.id !== id))
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange(next)
  }

  function clearAll() {
    items.forEach(i => { if (i.preview.startsWith('blob:')) URL.revokeObjectURL(i.preview) })
    onChange([])
  }

  const uploading = items.some(i => i.status === 'uploading')
  const failed = items.filter(i => i.status === 'error').length

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={FLASHCARD_IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files || [])
          if (files.length) addFiles(files)
          e.target.value = ''
        }}
      />

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          if (disabled) return
          const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
          if (files.length) addFiles(files)
        }}
        onPaste={e => {
          if (disabled) return
          const files = Array.from(e.clipboardData?.files || []).filter(f => f.type.startsWith('image/'))
          if (files.length) { e.preventDefault(); addFiles(files) }
        }}
        onClick={() => { if (!disabled) inputRef.current?.click() }}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
        className={cn(
          'w-full cursor-pointer rounded-2xl border border-dashed px-4 py-5 text-center transition',
          dragOver
            ? 'border-violet-500 bg-violet-500/10'
            : 'border-slate-300 hover:border-violet-400 hover:bg-violet-50 dark:border-white/15 dark:hover:border-violet-400/60 dark:hover:bg-violet-500/10',
          disabled && 'opacity-60 pointer-events-none',
        )}
      >
        <ImagePlus className="mx-auto h-5 w-5 text-violet-500" />
        <p className="mt-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          Arraste as imagens aqui ou clique para escolher
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Pode mandar todas de uma vez (também aceita colar com Ctrl+V). Máx. 8 MB cada.
        </p>
      </div>

      {items.length > 0 && toolbar}

      {items.length > 0 && (
        <>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              {items.length} {items.length === 1 ? 'imagem' : 'imagens'}
              {uploading && <span className="ml-1 text-violet-600 dark:text-violet-300">· enviando...</span>}
              {!uploading && failed > 0 && <span className="ml-1 text-rose-500">· {failed} com erro</span>}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-rose-500 hover:bg-rose-500/10"
            >
              <Trash2 className="h-3 w-3" /> Limpar
            </button>
          </div>

          <ul className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[22rem] overflow-y-auto pr-1">
            {items.map((item, index) => {
              const slot = describeSlot?.(index)
              return (
                <li
                  key={item.id}
                  className={cn(
                    'relative group rounded-xl overflow-hidden border bg-slate-50 dark:bg-slate-800',
                    item.status === 'error'
                      ? 'border-rose-400'
                      : 'border-slate-200 dark:border-white/10',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt={item.name}
                    className="h-20 w-full object-cover"
                  />

                  <span className="absolute top-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {index + 1}
                  </span>

                  {item.status === 'uploading' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                    aria-label={`Remover imagem ${index + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </button>

                  <div className="absolute bottom-0 inset-x-0 flex items-center justify-between bg-black/60 px-1 py-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="text-white disabled:opacity-30"
                      aria-label={`Mover imagem ${index + 1} para trás`}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                      className="text-white disabled:opacity-30"
                      aria-label={`Mover imagem ${index + 1} para frente`}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  {slot && (
                    <p className="truncate bg-white/90 dark:bg-slate-900/90 px-1.5 py-1 text-[10px] text-slate-600 dark:text-slate-300">
                      {slot}
                    </p>
                  )}
                  {item.status === 'error' && (
                    <p className="truncate bg-rose-500/10 px-1.5 py-1 text-[10px] text-rose-600 dark:text-rose-300" title={item.error}>
                      {item.error}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
