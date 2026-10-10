'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, Instagram, Youtube, ExternalLink } from 'lucide-react'
import { urlDeEmbed, urlDeMiniatura, urlOriginal } from '@/lib/monitorias/videos'
import type { VideoAnuncio } from '@/lib/monitorias/tipos'
import { cn } from '@/lib/utils'

/**
 * Vídeos de demonstração. Mostra a miniatura e só carrega o iframe no clique
 * (economiza dados de quem só está olhando). O `src` é montado a partir do ID —
 * nunca de uma URL digitada.
 */
export function GaleriaVideos({ videos }: { videos: VideoAnuncio[] }) {
  const [ativo, setAtivo] = useState(0)
  const [tocando, setTocando] = useState(false)
  if (!videos.length) return null
  const atual = videos[ativo]
  const mini = urlDeMiniatura(atual)
  const vertical = atual.provider === 'instagram'
  return (
    <div className="space-y-3">
      <div className={cn('relative mx-auto overflow-hidden rounded-2xl border border-border bg-black shadow-lg', vertical ? 'aspect-[9/14] max-w-sm' : 'aspect-video')}>
        <AnimatePresence mode="wait">
          {tocando ? (
            <motion.iframe
              key={`f-${ativo}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={urlDeEmbed(atual)}
              title="Vídeo de demonstração do monitor"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            />
          ) : (
            <motion.button
              key={`m-${ativo}`}
              type="button"
              onClick={() => setTocando(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="group absolute inset-0 flex items-center justify-center"
              aria-label="Assistir vídeo"
            >
              {mini ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mini} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-100" loading="lazy" />
              ) : (
                <div className="absolute inset-0 bg-foreground/80" />
              )}
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-primary shadow-xl transition group-hover:scale-110">
                <Play className="ml-1 h-7 w-7 fill-current" />
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {videos.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {videos.map((v, i) => (
            <button
              key={`${v.provider}-${v.id}`}
              type="button"
              onClick={() => {
                setAtivo(i)
                setTocando(false)
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition',
                i === ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40',
              )}
            >
              {v.provider === 'youtube' ? <Youtube className="h-3.5 w-3.5" /> : <Instagram className="h-3.5 w-3.5" />} Vídeo {i + 1}
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground">
        <a href={urlOriginal(atual)} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 hover:text-primary">
          Abrir no {atual.provider === 'youtube' ? 'YouTube' : 'Instagram'} <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  )
}
