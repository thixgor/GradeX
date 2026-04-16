'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Play,
  Download,
  ShoppingCart,
  Lock,
  Clock,
  Eye,
  Tag,
  Shield,
  Gift,
  Crown,
  Zap,
  GraduationCap,
  FileText,
  Video,
  Link2,
  Image as ImageIcon,
  File,
  ChevronDown,
  ChevronUp,
  Package,
  ShieldAlert,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import { VideoWatermark } from '@/components/video-watermark'

// ─── Types ───────────────────────────────────────────────────
interface Material {
  _id: string
  title: string
  description: string
  coverImage: string
  type: string
  downloadUrl: string
  folderId: string | null
  tags: string[]
  allowedGroups: string[]
  videoDuration?: number
  pricing: 'free' | 'paid'
  price: number
  downloadCount: number
  viewCount: number
  createdAt: string
}

interface PageData {
  material: Material
  hasAccess: boolean
  isPurchased: boolean
  hasGroupAccess: boolean
  userGroups: string[]
  watermark: { name: string; cpf: string }
}

// ─── Constants ───────────────────────────────────────────────
const GROUP_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  gratuito:  { label: 'Gratuito',  color: '#6b7280', icon: <Gift className="h-3.5 w-3.5" /> },
  trial:     { label: 'Trial',     color: '#3b82f6', icon: <Clock className="h-3.5 w-3.5" /> },
  essential: { label: 'Essential', color: '#8b5cf6', icon: <Zap className="h-3.5 w-3.5" /> },
  premium:   { label: 'Premium',   color: '#f59e0b', icon: <Crown className="h-3.5 w-3.5" /> },
  monitor:   { label: 'Monitor',   color: '#10b981', icon: <GraduationCap className="h-3.5 w-3.5" /> },
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf:         <FileText className="h-4 w-4" />,
  video:       <Video className="h-4 w-4" />,
  video_embed: <Play className="h-4 w-4" />,
  link:        <Link2 className="h-4 w-4" />,
  image:       <ImageIcon className="h-4 w-4" />,
  document:    <File className="h-4 w-4" />,
  other:       <File className="h-4 w-4" />,
}

const TYPE_LABELS: Record<string, string> = {
  pdf:         'PDF',
  video:       'Vídeo',
  video_embed: 'Vídeo',
  link:        'Link',
  image:       'Imagem',
  document:    'Documento',
  other:       'Arquivo',
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m > 0 ? `${m}min` : ''}`.trim()
  if (m > 0) return `${m}min${s > 0 ? ` ${s}s` : ''}`
  return `${s}s`
}

// ─── Main Page ───────────────────────────────────────────────
export default function MaterialViewPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/materiais/${id}`, { cache: 'no-store' })
      if (res.status === 401) { router.push('/auth/login'); return }
      if (res.status === 404) { router.push('/materiais'); return }
      if (!res.ok) { setError('Erro ao carregar material'); return }
      const json = await res.json()
      setData(json)
    } catch {
      setError('Erro ao carregar material')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAcquire = async () => {
    if (!data) return
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/materiais/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'material', itemId: id }),
      })
      const json = await res.json()
      if (json.free) {
        await fetchData()
      } else if (json.url) {
        window.location.href = json.url
      } else {
        alert(json.error || 'Erro ao processar')
      }
    } catch {
      alert('Erro ao processar aquisição')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleDownload = () => {
    if (!data) return
    window.open(data.material.downloadUrl, '_blank')
  }

  if (loading) return <LoadingSkeleton />
  if (error || !data) return <ErrorState message={error} onBack={() => router.push('/materiais')} />

  const { material, hasAccess, hasGroupAccess, watermark } = data
  const isEmbed = material.type === 'video_embed'
  const isVideo = material.type === 'video' || isEmbed
  const isFree = material.pricing === 'free'
  const descLong = material.description && material.description.length > 180

  return (
    <AppShell headerTitle={material.title} headerSubtitle={TYPE_LABELS[material.type] || 'Material'}>
      <div className="min-h-full relative">

        {/* ── Ambient background blobs ── */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute top-1/2 -right-48 w-[400px] h-[400px] rounded-full bg-accent/6 blur-[100px]" />
          <div className="absolute -bottom-32 left-1/3 w-[350px] h-[350px] rounded-full bg-secondary/6 blur-[90px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* ── Back button ── */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <span className="h-8 w-8 rounded-xl glass-card flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </span>
              Voltar aos Materiais
            </button>
          </motion.div>

          {/* ── Main layout: video + sidebar ── */}
          <div className="flex flex-col xl:flex-row gap-6">

            {/* ── LEFT: Video / Cover panel ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 min-w-0"
            >
              {/* Video player or cover */}
              <div className="rounded-3xl overflow-hidden glass-card shadow-2xl shadow-primary/10 border border-primary/10">
                {isEmbed && hasAccess ? (
                  /* ── Real embed ── */
                  <VideoWatermark userName={watermark.name} userCpf={watermark.cpf}>
                    {material.downloadUrl.trim().startsWith('<') ? (
                      /* Full HTML embed code (Wistia, etc.) — same as /aulas */
                      <div
                        dangerouslySetInnerHTML={{ __html: material.downloadUrl }}
                        className="w-full h-full"
                      />
                    ) : (
                      /* Plain URL — render as iframe */
                      <iframe
                        src={material.downloadUrl}
                        title={material.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    )}
                  </VideoWatermark>
                ) : isEmbed && !hasAccess ? (
                  /* ── Fake / locked embed ── */
                  <div className="relative w-full bg-black/90" style={{ aspectRatio: '16/9' }}>
                    {material.coverImage && (
                      <img
                        src={material.coverImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-105"
                      />
                    )}
                    {/* Noise overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="relative"
                      >
                        {/* Glow ring */}
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
                        <div className="relative h-20 w-20 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center">
                          <Lock className="h-8 w-8 text-white/80" />
                        </div>
                      </motion.div>
                      <div className="text-center px-6">
                        <p className="text-white font-heading font-bold text-lg mb-1">Vídeo bloqueado</p>
                        <p className="text-white/60 text-sm">Adquira este material para assistir</p>
                      </div>
                      {isVideo && material.videoDuration ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/80 text-sm font-medium">
                          <Clock className="h-4 w-4" />
                          {formatDuration(material.videoDuration)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : material.coverImage ? (
                  /* ── Cover image for non-embed ── */
                  <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                    <img src={material.coverImage} alt={material.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl backdrop-blur-md bg-white/15 border border-white/20 text-white text-sm font-medium flex items-center gap-1.5">
                        {TYPE_ICONS[material.type]}
                        {TYPE_LABELS[material.type]}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ── Gradient placeholder ── */
                  <div className="w-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" style={{ aspectRatio: '16/9' }}>
                    <div className="h-24 w-24 rounded-3xl glass flex items-center justify-center">
                      {TYPE_ICONS[material.type] || <File className="h-12 w-12 text-primary" />}
                    </div>
                  </div>
                )}

                {/* ── Under-player info bar ── */}
                <div className="px-5 py-4 border-t border-border/40 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-1">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      {material.viewCount} visualizações
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      {material.downloadCount} downloads
                    </span>
                    {isVideo && material.videoDuration ? (
                      <span className="flex items-center gap-1.5 text-primary font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(material.videoDuration)}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(material.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* ── Description (desktop – below player) ── */}
              {material.description && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-4 glass-card rounded-2xl px-5 py-4 border border-border/40"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Descrição</h3>
                  <p className={`text-sm leading-relaxed text-foreground/90 ${descExpanded ? '' : 'line-clamp-4'}`}>
                    {material.description}
                  </p>
                  {descLong && (
                    <button
                      onClick={() => setDescExpanded(e => !e)}
                      className="mt-2 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                    >
                      {descExpanded ? <><ChevronUp className="h-3 w-3" /> Ver menos</> : <><ChevronDown className="h-3 w-3" /> Ver mais</>}
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* ── RIGHT: Info sidebar ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="xl:w-80 flex-shrink-0 space-y-4"
            >
              {/* Title & badges */}
              <div className="glass-card rounded-2xl p-5 border border-border/40">
                {/* Type + price badge row */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                    {TYPE_ICONS[material.type]}
                    {TYPE_LABELS[material.type]}
                  </span>
                  {isFree ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold border border-green-500/20">
                      <Gift className="h-3 w-3" /> Gratuito
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-accent/10 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/20">
                      R$ {material.price?.toFixed(2)}
                    </span>
                  )}
                  {hasAccess && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      <Check className="h-3 w-3" /> Acesso liberado
                    </span>
                  )}
                </div>

                <h1 className="font-heading font-bold text-lg leading-snug mb-4">{material.title}</h1>

                {/* Duration */}
                {isVideo && material.videoDuration ? (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duração</p>
                      <p className="text-sm font-semibold">{formatDuration(material.videoDuration)}</p>
                    </div>
                  </div>
                ) : null}

                {/* Tags */}
                {material.tags?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {material.tags.map(tag => (
                        <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <div className="space-y-2">
                  {hasAccess ? (
                    isEmbed ? (
                      <p className="text-xs text-center text-muted-foreground py-2">
                        O vídeo está disponível acima ↑
                      </p>
                    ) : (
                      <Button
                        onClick={handleDownload}
                        className="w-full h-11 rounded-2xl font-semibold text-white bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {material.type === 'link' ? 'Acessar Link' : 'Baixar Material'}
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={handleAcquire}
                      disabled={checkoutLoading}
                      className={`w-full h-11 rounded-2xl font-semibold text-white shadow-lg ${
                        isFree
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/25'
                          : 'bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 shadow-accent/25'
                      }`}
                    >
                      {checkoutLoading
                        ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        : isFree ? <Gift className="h-4 w-4 mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />
                      }
                      {isFree ? 'Adquirir Gratuitamente' : `Comprar – R$ ${material.price?.toFixed(2)}`}
                    </Button>
                  )}
                </div>
              </div>

              {/* Group restrictions */}
              {material.allowedGroups?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="glass-card rounded-2xl p-5 border border-violet-500/20 bg-violet-500/3"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                      <Shield className="h-3.5 w-3.5 text-violet-500" />
                    </div>
                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                      Acesso por plano
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {material.allowedGroups.map(g => {
                      const meta = GROUP_META[g]
                      if (!meta) return null
                      return (
                        <span
                          key={g}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                          style={{ color: meta.color, background: meta.color + '15', borderColor: meta.color + '35' }}
                        >
                          {meta.icon} {meta.label}
                        </span>
                      )
                    })}
                  </div>
                  {!hasGroupAccess && (
                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                      Seu plano atual não inclui acesso a este conteúdo. Faça upgrade para desbloquear.
                    </p>
                  )}
                </motion.div>
              )}

              {/* Security badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-muted/40 border border-border/30"
              >
                <ShieldAlert className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {hasAccess
                    ? 'Este conteúdo é protegido com marca d\'água personalizada.'
                    : 'O conteúdo é protegido e disponível somente após aquisição.'}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ─── Skeleton ───────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <AppShell headerTitle="Carregando...">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-9 w-40 rounded-xl bg-muted animate-pulse mb-6" />
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1">
            <div className="rounded-3xl bg-muted animate-pulse" style={{ aspectRatio: '16/9' }} />
          </div>
          <div className="xl:w-80 space-y-4">
            <div className="rounded-2xl glass-card p-5 space-y-3">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-6 w-full bg-muted rounded animate-pulse" />
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-11 w-full bg-muted rounded-2xl animate-pulse mt-4" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ─── Error ───────────────────────────────────────────────────
function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <AppShell headerTitle="Erro">
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-20 w-20 rounded-3xl glass-card flex items-center justify-center mb-2">
          <Package className="h-9 w-9 text-muted-foreground" />
        </div>
        <h2 className="font-heading font-bold text-xl">Material não encontrado</h2>
        <p className="text-muted-foreground text-sm">{message || 'Este material não existe ou foi removido.'}</p>
        <Button onClick={onBack} className="mt-2 rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar aos Materiais
        </Button>
      </div>
    </AppShell>
  )
}
