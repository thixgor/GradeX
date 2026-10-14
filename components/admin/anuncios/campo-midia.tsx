'use client'

/**
 * Campo de mídia do anúncio: imagem OU vídeo, otimizados antes de subir.
 *
 * O admin escolhe o arquivo do jeito que ele saiu do editor (um MP4 de 25 MB,
 * um PNG de 6000 px) e o campo cuida do resto: comprime aqui no navegador,
 * gera a capa do vídeo e envia só a versão final. O cartão do resultado mostra
 * o antes e o depois — é a prova de que o arquivo pesado não foi para o ar.
 */

import { useCallback, useRef, useState, type DragEvent } from 'react'
import { Film, Image as ImageIcon, Loader2, Sparkles, Trash2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  ANUNCIO_IMAGE_ACCEPT,
  ANUNCIO_MIDIA_ACCEPT,
  enviarMidiaDoAnuncio,
  validateAnuncioMidia,
  type EtapaEnvio,
} from '@/lib/anuncio-image-upload'
import { formatarBytes, rotuloDaProporcao, type AnuncioMidia } from '@/lib/anuncio-midia'
import { cn } from '@/lib/utils'

interface CampoMidiaProps {
  label: string
  helper?: string
  value?: AnuncioMidia
  onChange: (midia: AnuncioMidia | undefined) => void
  onError: (message: string) => void
  onSuccess?: (message: string) => void
  aceitaVideo?: boolean
  obrigatorio?: boolean
}

const ETAPA_TEXTO: Record<EtapaEnvio, string> = {
  lendo: 'Lendo o arquivo...',
  comprimindo: 'Comprimindo sem perder qualidade...',
  capa: 'Gerando a capa do vídeo...',
  enviando: 'Enviando a versão otimizada...',
  pronto: 'Pronto',
}

function formatarDuracao(segundos?: number) {
  if (!segundos) return ''
  const total = Math.round(segundos)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function CampoMidia({
  label,
  helper,
  value,
  onChange,
  onError,
  onSuccess,
  aceitaVideo = true,
  obrigatorio = false,
}: CampoMidiaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)
  const [etapa, setEtapa] = useState<EtapaEnvio | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [economia, setEconomia] = useState<{ antes: number; depois: number; nota?: string } | null>(null)

  const ocupado = etapa !== null && etapa !== 'pronto'

  const enviar = useCallback(
    async (file: File) => {
      const invalido = validateAnuncioMidia(file, aceitaVideo)
      if (invalido) {
        onError(invalido)
        return
      }

      setEtapa('lendo')
      setProgresso(0)
      setEconomia(null)
      try {
        const { midia, otimizada } = await enviarMidiaDoAnuncio(file, {
          aceitaVideo,
          onEtapa: (nova) => {
            setEtapa(nova)
            setProgresso(0)
          },
          onProgresso: setProgresso,
        })
        onChange(midia)
        setEconomia({ antes: otimizada.bytesOriginais, depois: otimizada.bytesFinais, nota: otimizada.observacao })
        onSuccess?.(
          `${midia.tipo === 'video' ? 'Vídeo' : 'Imagem'} otimizado e enviado: ${formatarBytes(
            otimizada.bytesOriginais,
          )} → ${formatarBytes(otimizada.bytesFinais)}`,
        )
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Erro ao enviar o arquivo')
      } finally {
        setEtapa(null)
        setProgresso(0)
      }
    },
    [aceitaVideo, onChange, onError, onSuccess],
  )

  const soltar = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setArrastando(false)
      const file = event.dataTransfer.files?.[0]
      if (file) void enviar(file)
    },
    [enviar],
  )

  const reducao =
    economia && economia.antes > 0 && economia.depois < economia.antes
      ? Math.round((1 - economia.depois / economia.antes) * 100)
      : 0

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {obrigatorio && ' *'}
      </Label>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}

      {value && !ocupado ? (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-start">
          <div
            className="relative mx-auto w-full max-w-[220px] shrink-0 overflow-hidden rounded-lg border bg-black sm:mx-0 sm:w-40"
            style={{ aspectRatio: `${value.largura} / ${value.altura}`, maxHeight: 220 }}
          >
            {value.tipo === 'video' ? (
              <video
                src={value.url}
                poster={value.posterUrl}
                className="absolute inset-0 h-full w-full object-contain"
                muted
                playsInline
                controls
                preload="none"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.url} alt="Prévia" className="absolute inset-0 h-full w-full object-contain" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1 text-xs">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              {value.tipo === 'video' ? <Film className="h-4 w-4 text-[#468152]" /> : <ImageIcon className="h-4 w-4 text-[#468152]" />}
              {value.tipo === 'video' ? 'Vídeo' : 'Imagem'} · {rotuloDaProporcao(value.largura, value.altura)}
            </p>
            <p className="text-muted-foreground">
              {value.largura}×{value.altura} px
              {value.duracao ? ` · ${formatarDuracao(value.duracao)}` : ''}
              {value.bytes ? ` · ${formatarBytes(value.bytes)}` : ''}
            </p>
            {economia && (
              <p className="flex items-start gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {reducao > 0
                  ? `Otimizado: ${formatarBytes(economia.antes)} → ${formatarBytes(economia.depois)} (−${reducao}%). O original não foi enviado.`
                  : economia.nota || 'Enviado sem alteração.'}
              </p>
            )}
            {economia?.nota && reducao > 0 && <p className="text-muted-foreground">{economia.nota}</p>}
            {value.tipo === 'video' && !value.posterUrl && (
              <p className="font-semibold text-amber-600">Sem capa: o vídeo aparece preto até começar a tocar.</p>
            )}
            <p className="truncate text-muted-foreground">{value.url}</p>
          </div>
          <div className="flex gap-2 sm:flex-col">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Trocar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-500/10"
              onClick={() => {
                setEconomia(null)
                onChange(undefined)
              }}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !ocupado && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              if (!ocupado) inputRef.current?.click()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setArrastando(true)
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={soltar}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center transition',
            arrastando
              ? 'border-[#468152] bg-[#468152]/10'
              : 'border-border bg-muted/20 hover:border-[#468152]/60 hover:bg-muted/40',
            ocupado && 'pointer-events-none opacity-90',
          )}
        >
          {ocupado ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-[#468152]" />
              <p className="text-sm font-semibold">
                {ETAPA_TEXTO[etapa!]} {progresso > 0 ? `${progresso}%` : ''}
              </p>
              <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#468152] transition-all"
                  style={{ width: `${Math.max(progresso, 4)}%` }}
                />
              </div>
              {etapa === 'comprimindo' && (
                <p className="text-xs text-muted-foreground">
                  Vídeo longo leva alguns minutos. Não feche esta janela.
                </p>
              )}
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-[#468152]" />
              <p className="text-sm font-bold">
                Arraste {aceitaVideo ? 'a imagem ou o vídeo' : 'a imagem'} ou clique para escolher
              </p>
              <p className="text-xs text-muted-foreground">
                {aceitaVideo ? 'MP4, MOV ou WEBM; ' : ''}JPG, PNG, WEBP ou AVIF. Formatos 16:9, 4:5, 9:16, 4:1 ou
                qualquer outro. A compressão acontece aqui, antes de enviar.
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={aceitaVideo ? ANUNCIO_MIDIA_ACCEPT : ANUNCIO_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Zerar o valor permite reenviar o MESMO arquivo depois de um erro.
          event.target.value = ''
          if (file) void enviar(file)
        }}
      />
    </div>
  )
}
