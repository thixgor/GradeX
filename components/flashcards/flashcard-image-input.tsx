'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlashcardImageInputProps {
  value?: string
  onChange: (url: string | undefined) => void
  className?: string
  label?: string
}

export function FlashcardImageInput({ value, onChange, className, label = 'Adicionar imagem' }: FlashcardImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(file: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Imagem muito grande (máx 8 MB)')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha no upload')
      onChange(data.url)
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  if (value) {
    return (
      <div className={cn('relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10', className)}>
        <Image src={value} alt="Imagem do cartão" width={800} height={400} className="w-full h-auto object-contain max-h-72 bg-slate-50 dark:bg-slate-900" />
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
    </div>
  )
}
