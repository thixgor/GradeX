'use client'

/**
 * Campo da imagem do anúncio: arquivo do computador ou URL.
 *
 * O envio direto é o caminho padrão — antes daqui a única opção era hospedar a
 * arte fora (Imgur) e colar o link, o que deixava o banner refém de um serviço
 * de terceiros. O campo de URL continua existindo para os anúncios antigos e
 * para quem já tem a imagem em um CDN próprio, mas em segundo plano.
 */

import { useCallback, useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import { Image as ImageIcon, Link2, Loader2, Trash2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ANUNCIO_IMAGE_ACCEPT,
  uploadAnuncioImage,
  validateAnuncioImage,
} from '@/lib/anuncio-image-upload'
import { isValidImageUrl } from '@/lib/anuncio-destinos'
import { cn } from '@/lib/utils'

interface CampoImagemProps {
  value: string
  onChange: (url: string) => void
  onError: (message: string) => void
  onSuccess?: (message: string) => void
}

export function CampoImagem({ value, onChange, onError, onSuccess }: CampoImagemProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showUrlField, setShowUrlField] = useState(false)

  const enviar = useCallback(
    async (file: File) => {
      const invalid = validateAnuncioImage(file)
      if (invalid) {
        onError(invalid)
        return
      }

      setUploading(true)
      setProgress(0)
      try {
        const url = await uploadAnuncioImage(file, setProgress)
        onChange(url)
        onSuccess?.('Imagem enviada')
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Erro ao enviar a imagem')
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [onChange, onError, onSuccess],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragging(false)
      const file = event.dataTransfer.files?.[0]
      if (file) void enviar(file)
    },
    [enviar],
  )

  /** Print colado (Ctrl+V) vira upload — é como a maioria das artes chega. */
  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const file = Array.from(event.clipboardData?.files ?? [])[0]
      if (file) {
        event.preventDefault()
        void enviar(file)
      }
    },
    [enviar],
  )

  const temImagem = value.trim().length > 0
  const urlInvalida = temImagem && !isValidImageUrl(value)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Imagem do anúncio *</Label>
        <button
          type="button"
          onClick={() => setShowUrlField((current) => !current)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          <Link2 className="h-3.5 w-3.5" />
          {showUrlField ? 'Ocultar campo de URL' : 'Usar uma URL'}
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (!uploading) inputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center transition',
          dragging
            ? 'border-[#468152] bg-[#468152]/10'
            : 'border-border bg-muted/20 hover:border-[#468152]/60 hover:bg-muted/40',
          uploading && 'pointer-events-none opacity-80',
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-[#468152]" />
            <p className="text-sm font-semibold">Enviando... {progress}%</p>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#468152] transition-all"
                style={{ width: `${Math.max(progress, 4)}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-[#468152]" />
            <p className="text-sm font-bold">Arraste a imagem ou clique para escolher</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WEBP, GIF ou AVIF — até 8 MB. Também dá para colar (Ctrl+V).
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ANUNCIO_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Zerar o valor permite reenviar o MESMO arquivo depois de um erro —
          // sem isso o `change` não dispara na segunda tentativa.
          event.target.value = ''
          if (file) void enviar(file)
        }}
      />

      {showUrlField && (
        <div className="space-y-1.5">
          <Input
            id="imagemUrl"
            placeholder="https://exemplo.com/banner.jpg ou /uploads/banner.jpg"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Aceita http(s) ou caminhos internos iniciados por /.
          </p>
        </div>
      )}

      {temImagem && (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
            {urlInvalida ? (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="Prévia da imagem" className="max-h-full max-w-full object-contain" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{value}</p>
            {urlInvalida && (
              <p className="mt-1 text-xs font-semibold text-red-500">
                Endereço de imagem inválido.
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
            onClick={() => onChange('')}
            aria-label="Remover imagem"
            title="Remover imagem"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
