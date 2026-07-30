'use client'

/**
 * Lista expansível com "tudo que o pacote cobre" — os materiais incluídos.
 *
 * Usada no checkout (compra sem login em /comprar e no carrinho) para que o
 * comprador veja exatamente o que está levando antes de pagar. Busca os itens
 * no endpoint público do pacote (funciona para visitante) uma única vez.
 *
 * Dois temas:
 *  - variant="light": tokens de tema (páginas com AppShell/checkout claro).
 *  - variant="dark":  vidro esmeralda do checkout de carrinho (fundo escuro).
 */

import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Package,
  FileText,
  Video,
  Play,
  Link2,
  Image as ImageIcon,
  File,
  Sparkles,
  Gift,
  Loader2,
} from 'lucide-react'

interface PackageContentMaterial {
  _id: string
  title: string
  type: string
  coverImage?: string
  pricing?: 'free' | 'paid'
  price?: number
  _pageCount?: number
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-3.5 w-3.5" />,
  video: <Video className="h-3.5 w-3.5" />,
  video_embed: <Play className="h-3.5 w-3.5" />,
  link: <Link2 className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
  document: <File className="h-3.5 w-3.5" />,
  flashcard_deck: <Sparkles className="h-3.5 w-3.5" />,
  other: <File className="h-3.5 w-3.5" />,
}

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  video: 'Vídeo',
  video_embed: 'Vídeo',
  link: 'Link',
  image: 'Imagem',
  document: 'Documento',
  flashcard_deck: 'Flashcard',
  other: 'Arquivo',
}

function typeLabel(type: string): string {
  return TYPE_LABELS[type] || 'Arquivo'
}

interface PackageContentsProps {
  packageId: string
  variant?: 'light' | 'dark'
  /** Começa expandido (ex.: destaque na página /comprar). */
  defaultOpen?: boolean
  className?: string
}

export function PackageContents({
  packageId,
  variant = 'light',
  defaultOpen = false,
  className,
}: PackageContentsProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [materials, setMaterials] = useState<PackageContentMaterial[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current || !packageId) return
    fetchedRef.current = true
    let cancelled = false
    fetch(`/api/materiais/packages/${packageId}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        if (cancelled) return
        setMaterials(Array.isArray(json?.materials) ? json.materials : [])
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [packageId])

  // Enquanto carrega a contagem inicial, não ocupa espaço na tela.
  if (loading && !materials) {
    return variant === 'dark' ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.45)', fontSize: '12px', padding: '4px 2px' }}>
        <Loader2 size={13} className="animate-spin" /> Carregando o que está incluído...
      </div>
    ) : (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando o que está incluído...
      </div>
    )
  }

  if (error || !materials || materials.length === 0) return null

  const count = materials.length
  const countLabel = `${count} ${count === 1 ? 'item incluído' : 'itens incluídos'}`

  if (variant === 'dark') {
    return (
      <div
        className={className}
        style={{
          borderRadius: '12px',
          border: '1px solid rgba(52,211,153,0.16)',
          background: 'rgba(255,255,255,0.035)',
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 13px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.82)',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Package size={14} style={{ color: '#34d399', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Tudo que este pacote cobre · {countLabel}</span>
          <ChevronDown
            size={15}
            style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
          />
        </button>
        {open && (
          <ul style={{ listStyle: 'none', margin: 0, padding: '0 13px 12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {materials.map((m) => (
              <li
                key={m._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.22)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ color: '#34d399', display: 'inline-flex', flexShrink: 0 }}>
                  {TYPE_ICONS[m.type] || <File className="h-3.5 w-3.5" />}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: '12.5px', color: 'white', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.title}
                </span>
                <span style={{ flexShrink: 0, fontSize: '10.5px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {m.type === 'pdf' && m._pageCount ? `${m._pageCount}p` : typeLabel(m.type)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // variant === 'light'
  return (
    <div className={`rounded-lg border border-border bg-background overflow-hidden ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3.5 py-3 text-left text-sm font-bold text-foreground transition hover:bg-muted/40"
      >
        <Package className="h-4 w-4 flex-none text-primary" />
        <span className="flex-1">Tudo que este pacote cobre · {countLabel}</span>
        <ChevronDown className={`h-4 w-4 flex-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="flex flex-col gap-1.5 px-3.5 pb-3">
          {materials.map((m) => (
            <li
              key={m._id}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span className="inline-flex flex-none text-primary">
                {TYPE_ICONS[m.type] || <File className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-foreground">
                {m.title}
              </span>
              {m.pricing === 'free' ? (
                <span className="inline-flex flex-none items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  <Gift className="h-3 w-3" /> Grátis
                </span>
              ) : (
                <span className="flex-none text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {m.type === 'pdf' && m._pageCount ? `${m._pageCount} pág.` : typeLabel(m.type)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
