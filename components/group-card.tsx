'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TiltCard } from '@/components/tilt-card'
import { FloatingMenu } from '@/components/floating-menu'
import { CoverImage } from '@/components/cover-image'
import {
  MoreHorizontal,
  FolderPlus,
  Edit2,
  Trash2,
  Share2,
  ArrowDownAZ,
  FileDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Exam } from '@/lib/types'

interface GroupCardData {
  _id: string
  name: string
  description?: string
  color?: string
  icon?: string
  imageUrl?: string | null
  type: 'personal' | 'general'
  category?: 'faculdade' | 'plataforma'
  course?: string
  createdBy: string
  parentGroupId?: string | null
}

interface GroupCardProps {
  group: GroupCardData
  examCount: number
  subgroupCount: number
  directPracticeExams: Exam[]
  canManage: boolean
  isAdmin: boolean
  highlighted?: boolean
  index?: number
  onOpen: () => void
  onEditGroup?: (group: any) => void
  onDeleteGroup?: (groupId: string) => Promise<void>
  onCreateSubgroup?: (parentGroupId: string) => void
  onSortGroup?: (groupId: string) => void
  onGroupDownloadPDF?: (exams: Exam[], type: 'exam' | 'with-answers' | 'gabarito', groupName: string) => void
}

/** Folder-style card for a group/subgroup — used for the grid/drill-down presentation of /provas. */
export function GroupCard({
  group,
  examCount,
  subgroupCount,
  directPracticeExams,
  canManage,
  isAdmin,
  highlighted = false,
  index = 0,
  onOpen,
  onEditGroup,
  onDeleteGroup,
  onCreateSubgroup,
  onSortGroup,
  onGroupDownloadPDF,
}: GroupCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSorting, setIsSorting] = useState(false)
  const actionsButtonRef = useRef<HTMLButtonElement>(null)
  const downloadButtonRef = useRef<HTMLButtonElement>(null)

  const accentColor = group.color || '#3B82F6'

  const handleShareLink = () => {
    const url = `${window.location.origin}/provas?grupo=${group._id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  const handleDelete = async () => {
    if (!onDeleteGroup) return
    if (!confirm(`Deletar "${group.name}"? Subgrupos serão movidos para o nível acima.`)) return
    setIsDeleting(true)
    try {
      await onDeleteGroup(group._id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSortAlpha = async () => {
    if (!confirm(`Ordenar todas as provas de "${group.name}" em ordem alfanumérica reversa?\nIsso sobrescreve a ordem atual.`)) return
    setIsSorting(true)
    try {
      await fetch(`/api/groups/${group._id}/sort-exams`, { method: 'PATCH' })
      onSortGroup?.(group._id)
    } finally {
      setIsSorting(false)
      setShowActions(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.03 * index }}
      className="h-full"
    >
      <TiltCard maxTilt={4} scale={1.02} className="rounded-2xl h-full">
        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
          className={cn(
            'group/card relative isolate flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer',
            highlighted
              ? 'border-primary/50 ring-2 ring-primary/25 shadow-lg shadow-primary/10'
              : 'border-border/50 hover:border-border hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20'
          )}
        >
          {/* Cover */}
          <div className="relative h-24 sm:h-28 flex-shrink-0 overflow-hidden">
            <CoverImage
              src={group.imageUrl}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
              // Só a primeira fileira da grade nasce visível; o resto entra por
              // rolagem e é carregado sob demanda.
              priority={index < 4}
              className="transition-transform duration-500 group-hover/card:scale-105"
              fallback={
                <div
                  className="flex h-full w-full items-center justify-center text-4xl transition-transform duration-500 group-hover/card:scale-105"
                  style={{ background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}0d)` }}
                >
                  <span>{group.icon && group.icon !== '📁' ? group.icon : '📁'}</span>
                </div>
              }
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />

            {highlighted && (
              <span className="absolute left-2 top-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground animate-pulse">
                ← aqui
              </span>
            )}

            {group.category === 'faculdade' && !highlighted && (
              <span className="absolute left-2 top-2 rounded-full bg-red-500/90 px-1.5 py-0.5 text-[9px] font-medium text-white">
                Faculdade
              </span>
            )}

            {canManage && (
              <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
                <button
                  ref={actionsButtonRef}
                  onClick={() => setShowActions((v) => !v)}
                  className="rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                  aria-label="Ações do grupo"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
                <FloatingMenu open={showActions} onClose={() => setShowActions(false)} anchorRef={actionsButtonRef} width={192}>
                  {onCreateSubgroup && (
                    <button
                      onClick={() => { onCreateSubgroup(group._id); setShowActions(false) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/60"
                    >
                      <FolderPlus className="h-3.5 w-3.5" /> Subgrupo
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={handleSortAlpha}
                      disabled={isSorting}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/60 disabled:opacity-50"
                    >
                      <ArrowDownAZ className="h-3.5 w-3.5" /> {isSorting ? 'Ordenando…' : 'A→Z reverso'}
                    </button>
                  )}
                  {onEditGroup && (
                    <button
                      onClick={() => { onEditGroup(group); setShowActions(false) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/60"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Editar
                    </button>
                  )}
                  <button
                    onClick={() => { handleShareLink(); setShowActions(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted/60"
                  >
                    <Share2 className="h-3.5 w-3.5" /> {copiedLink ? 'Copiado!' : 'Link'}
                  </button>
                  {onDeleteGroup && (
                    <button
                      onClick={() => { handleDelete(); setShowActions(false) }}
                      disabled={isDeleting}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive hover:bg-muted/60 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {isDeleting ? 'Deletando…' : 'Deletar'}
                    </button>
                  )}
                </FloatingMenu>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-1.5 p-3.5">
            <div className="flex items-start gap-2">
              <span className="line-clamp-2 flex-1 text-sm font-semibold leading-snug">{group.name}</span>
              <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/50 transition-all group-hover/card:translate-x-0.5 group-hover/card:text-primary" />
            </div>
            {group.description && (
              <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/70">{group.description}</p>
            )}
            <div className="flex-1" />
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                <span className="tabular-nums">{examCount} {examCount === 1 ? 'prova' : 'provas'}</span>
                {subgroupCount > 0 && (
                  <>
                    <span className="opacity-40">·</span>
                    <span className="tabular-nums">{subgroupCount} {subgroupCount === 1 ? 'subgrupo' : 'subgrupos'}</span>
                  </>
                )}
              </div>
              {directPracticeExams.length > 0 && onGroupDownloadPDF && (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    ref={downloadButtonRef}
                    onClick={() => setShowDownload((v) => !v)}
                    className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
                    title={`Baixar PDFs (${directPracticeExams.length} provas)`}
                  >
                    <FileDown className="h-3.5 w-3.5" />
                  </button>
                  <FloatingMenu open={showDownload} onClose={() => setShowDownload(false)} anchorRef={downloadButtonRef} width={224}>
                    {([
                      { type: 'exam', label: 'PDF da Prova' },
                      { type: 'with-answers', label: 'Prova + Gabarito' },
                      { type: 'gabarito', label: 'Só o Gabarito' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.type}
                        onClick={() => {
                          setShowDownload(false)
                          onGroupDownloadPDF([...directPracticeExams].reverse(), opt.type, group.name)
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-muted/60"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </FloatingMenu>
                </div>
              )}
            </div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  )
}
