'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  exitAppFullscreen,
  getFullscreenElement,
  onFullscreenChange,
  requestAppFullscreen,
} from '@/lib/fullscreen'

interface HtmlMaterialViewerProps {
  materialId: string
}

interface MaterialMeta {
  title: string
  hasAccess: boolean
  hasHtml: boolean
  viewerEnabled: boolean
}

type LoadState = 'loading' | 'ready' | 'denied' | 'error'

/**
 * Leitor HTML de materiais — abre um arquivo .html (experiência) com fidelidade
 * total dentro de um <iframe sandbox> (origem opaca: JS/CSS rodam, mas o
 * conteúdo não acessa a sessão do usuário). O HTML é servido pela rota
 * `/api/materiais/[id]/html-viewer/content`, que injeta a watermark indexada.
 *
 * Chrome com estética glassmorphism 3D do restante da plataforma. Renderização
 * nativa do navegador = sem lag em PC / mobile / tablet.
 */
export function HtmlMaterialViewer({ materialId }: HtmlMaterialViewerProps) {
  const router = useRouter()
  const shellRef = useRef<HTMLDivElement>(null)
  const [meta, setMeta] = useState<MaterialMeta | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const contentUrl = `/api/materiais/${materialId}/html-viewer/content`

  // ─── Carrega metadados do material (título + acesso) ───────────────────────
  useEffect(() => {
    let cancelled = false
    setState('loading')
    fetch(`/api/materiais/${materialId}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Não foi possível carregar o material')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const m = data?.material || {}
        const info: MaterialMeta = {
          title: m.title || 'Experiência',
          hasAccess: !!data?.hasAccess,
          hasHtml: !!m._hasHtml,
          viewerEnabled: m.htmlViewerEnabled === true,
        }
        setMeta(info)
        if (!info.hasAccess || !info.hasHtml || !info.viewerEnabled) {
          setState('denied')
        } else {
          setState('ready')
        }
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMsg(err?.message || 'Erro ao carregar')
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [materialId, reloadKey])

  // ─── Fullscreen ────────────────────────────────────────────────────────────
  // `el.requestFullscreen?.().catch(...)` parecia seguro, mas o `?.` cobre só a
  // chamada: no Safari do iOS o método não existe, a expressão vira `undefined`
  // e ler `.catch` dela estoura um TypeError — o botão não fazia nada no
  // celular. O util centraliza os prefixos e nunca lança.
  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current
    if (!el) return
    if (getFullscreenElement()) {
      exitAppFullscreen()
    } else {
      requestAppFullscreen(el)
    }
  }, [])

  useEffect(() => onFullscreenChange(setIsFullscreen), [])

  const goBack = useCallback(() => {
    router.push(`/materiais/${materialId}`)
  }, [router, materialId])

  return (
    <div
      ref={shellRef}
      className="relative flex flex-col bg-background"
      // height com fallbacks: navegadores antigos/in-app usam 100vh; modernos
      // sobrescrevem para 100dvh (barra de endereço dinâmica no mobile).
      style={{ height: '100vh', maxHeight: '100dvh', minHeight: '100svh' }}
    >
      {/* Ambient glow blobs (3D depth) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[360px] w-[360px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      {/* ─── Toolbar (glassmorphism) ─── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-20 flex items-center gap-3 px-3 sm:px-5 py-2.5 glass-card border-b border-border/40 shadow-lg shadow-primary/5"
      >
        <button
          onClick={goBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-button glow-green transition-transform hover:scale-105 active:scale-95"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-heading font-bold text-foreground">
              {meta?.title || 'Leitor de Experiência'}
            </p>
            <p className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-primary" />
              Protegido por marca d&apos;água
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIframeLoaded(false)
            setReloadKey((k) => k + 1)
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-button transition-transform hover:scale-105 active:scale-95"
          aria-label="Recarregar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-button transition-transform hover:scale-105 active:scale-95"
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </motion.header>

      {/* ─── Conteúdo ─── */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden p-2 sm:p-4">
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/40 bg-white shadow-2xl shadow-primary/10">
          {state === 'ready' && (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Carregando experiência…</p>
                </div>
              )}
              {/* iframe com posicionamento absoluto para preencher o container de
                  forma confiável em mobile (evita colapso de altura percentual do
                  iOS Safari que resultava em tela branca). */}
              <iframe
                key={reloadKey}
                src={contentUrl}
                title={meta?.title || 'Experiência'}
                onLoad={() => setIframeLoaded(true)}
                loading="eager"
                // Origem opaca: JS/CSS da experiência rodam, mas sem acesso a
                // cookies/sessão do pai. allow-same-origin PROPOSITALMENTE ausente.
                sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads allow-presentation"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full border-0 bg-white"
                style={{ width: '100%', height: '100%' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
              />
            </>
          )}

          {state === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Preparando leitor…</p>
            </div>
          )}

          {state === 'denied' && (
            <LockedState onBack={goBack} title={meta?.title} />
          )}

          {state === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <p className="font-heading font-bold text-foreground">Não foi possível abrir</p>
                <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
              </div>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="rounded-xl glass-button glow-green px-4 py-2 text-sm font-medium"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LockedState({ onBack, title }: { onBack: () => void; title?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 scale-150 rounded-full bg-primary/20 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md">
          <Lock className="h-8 w-8 text-primary" />
        </div>
      </motion.div>
      <div>
        <p className="font-heading text-lg font-bold text-foreground">Conteúdo bloqueado</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Adquira {title ? `“${title}”` : 'este material'} para abrir a experiência completa.
        </p>
      </div>
      <button
        onClick={onBack}
        className="rounded-xl glass-button glow-green px-5 py-2.5 text-sm font-medium"
      >
        Ver detalhes do material
      </button>
    </div>
  )
}
