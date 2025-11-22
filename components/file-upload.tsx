'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, Link as LinkIcon } from 'lucide-react'

interface FileUploadProps {
  label: string
  accept?: string
  value: string
  onChange: (url: string) => void
  supportPaste?: boolean
  placeholder?: string
}

export function FileUpload({
  label,
  accept = 'image/*',
  value,
  onChange,
  supportPaste = false,
  placeholder = 'Cole uma URL ou faça upload'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [useUrl, setUseUrl] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)

  // Suporte a CTRL+V
  useEffect(() => {
    if (!supportPaste) return

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        // Se for imagem
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (blob) {
            await uploadFile(blob)
          }
          return
        }
      }
    }

    const pasteArea = pasteAreaRef.current
    if (pasteArea) {
      pasteArea.addEventListener('paste', handlePaste as any)
      return () => pasteArea.removeEventListener('paste', handlePaste as any)
    }
  }, [supportPaste])

  async function uploadFile(file: File) {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      onChange(data.url)
      setUseUrl(false)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadFile(file)
  }

  function handleClear() {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex space-x-2 mb-2">
        <Button
          type="button"
          variant={useUrl ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUseUrl(true)}
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          URL
        </Button>
        <Button
          type="button"
          variant={!useUrl ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUseUrl(false)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {useUrl ? (
        <div className="flex space-x-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div ref={pasteAreaRef} className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              id={`file-upload-${label}`}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </>
              )}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {supportPaste && (
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
              💡 Dica: Você pode pressionar <kbd className="px-1 py-0.5 bg-background border rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-background border rounded">V</kbd> para colar uma imagem diretamente
            </div>
          )}
        </div>
      )}

      {value && (
        <div className="mt-2">
          {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <img
              src={value}
              alt="Preview"
              className="max-w-full h-auto max-h-48 rounded-lg border object-contain"
            />
          ) : (
            <div className="text-xs text-muted-foreground truncate">
              📄 {value}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
