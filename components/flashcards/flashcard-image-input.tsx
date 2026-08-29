'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Loader2, Link as LinkIcon, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  FLASHCARD_IMAGE_ACCEPT,
  uploadFlashcardImage,
  validateFlashcardImage,
} from '@/lib/flashcard-image-upload'

interface FlashcardImageInputProps {
  value?: string
  onChange: (url: string | undefined) => void
  className?: string
  label?: string
}

type InputMode = 'upload' | 'url'

export function FlashcardImageInput({ value, onChange, className, label = 'Adicionar imagem' }: FlashcardImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<InputMode>('upload')
  const [urlDraft, setUrlDraft] = useState('')

  async function handleSelect(file: File) {
    if (!file) return
    const invalid = validateFlashcardImage(file)
    if (invalid) {
      setError(invalid)
      return
    }
    setError(null)
    setUploading(true)
    try {
      onChange(await uploadFlashcardImage(file))
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  function handleUrlSubmit() {
    const trimmed = urlDraft.trim()
    if (!trimmed) return
    try {
      const u = new URL(trimmed)
      if (!['http:', 'https:'].includes(u.protocol)) {
        setError('Use uma URL com http:// ou https://')
        return
      }
    } catch {
      setError('URL invalida')
      return
    }
    setError(null)
    onChange(trimmed)
    setUrlDraft('')
  }

  if (value) {
    return (
      <div className={cn('relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10', className)}>
        <Image
          src={value}
          alt="Imagem do cartao"
          width={800}
          height={400}
          className="w-full h-auto object-contain max-h-72 bg-slate-50 dark:bg-slate-900"
          unoptimized={value.startsWith('http')}
        />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="absolute top-2 right-2 rounded-full bg-black/70 hover:bg-black p-1.5 text-white opacity-0 group-hover:opacity-100 transition"
          aria-label="Remover imagem"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          onClick={() => { setMode('upload'); setError(null) }}
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition',
            mode === 'upload'
              ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200'
              : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-violet-400'
          )}
        >
          <Upload className="h-3 w-3" /> Upload
        </button>
        <button
          type="button"
          onClick={() => { setMode('url'); setError(null) }}
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition',
            mode === 'url'
              ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200'
              : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-violet-400'
          )}
        >
          <LinkIcon className="h-3 w-3" /> URL
        </button>
      </div>

      {mode === 'upload' ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={FLASHCARD_IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleSelect(file)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed py-3 px-4 text-sm font-medium transition',
              'border-slate-300 hover:border-violet-400 hover:bg-violet-50 text-slate-600',
              'dark:border-white/15 dark:hover:border-violet-400/60 dark:hover:bg-violet-500/10 dark:text-slate-300',
              uploading && 'opacity-60 pointer-events-none'
            )}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? 'Enviando...' : label}
          </button>
        </>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={e => { setUrlDraft(e.target.value); setError(null) }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleUrlSubmit() } }}
            placeholder="https://exemplo.com/imagem.jpg"
            className={cn(
              'flex-1 min-w-0 rounded-xl border px-3 py-2 text-sm outline-none transition',
              'border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20',
              'dark:border-white/15 dark:bg-slate-800 dark:focus:border-violet-400/60 dark:text-slate-100',
            )}
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlDraft.trim()}
            className={cn(
              'shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition',
              'bg-violet-600 hover:bg-violet-700 text-white',
              'disabled:opacity-40 disabled:pointer-events-none',
            )}
          >
            <ImagePlus className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
    </div>
  )
}
