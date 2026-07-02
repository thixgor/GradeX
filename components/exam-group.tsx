'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TiltCard } from '@/components/tilt-card'
import { ChevronDown, Trash2, Edit2, FolderPlus, MoreHorizontal, ArrowUp, ArrowDown, Share2, Download, FileDown, ArrowDownAZ, BookOpen, ChevronRight } from 'lucide-react'
import { Exam } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GroupData {
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

interface ExamGroupProps {
  group: GroupData
  exams: Exam[]
  allGroups: GroupData[]
  allExams: Exam[]
  currentUserId: string
  userRole: 'admin' | 'user'
  onExamClick: (exam: Exam) => void
  onExamContextMenu: (exam: Exam, e: React.MouseEvent) => void
  onDeleteGroup?: (groupId: string) => Promise<void>
  onEditGroup?: (group: any) => void
  onCreateSubgroup?: (parentGroupId: string) => void
  onReorderExam?: (examId: string, direction: 'up' | 'down') => Promise<void>
  onSortGroup?: (groupId: string) => void
  onDownloadPDF?: (exam: Exam) => void
  onGroupDownloadPDF?: (exams: Exam[], type: 'exam' | 'with-answers' | 'gabarito', groupName: string) => void
  depth?: number
  highlightGroupId?: string | null
  filterQuery?: string
}

function isInSubtree(groupId: string, targetId: string, allGroups: GroupData[]): boolean {
  if (groupId === targetId) return true
  const children = allGroups.filter(g => g.parentGroupId === groupId)
  return children.some(c => isInSubtree(c._id, targetId, allGroups))
}

function ancestorChain(group: GroupData, allGroups: GroupData[]): GroupData[] {
  const chain: GroupData[] = []
  let current: GroupData | undefined = group
  let safety = 0
  while (current?.parentGroupId && safety < 20) {
    const parent = allGroups.find(g => g._id === current!.parentGroupId)
    if (!parent) break
    chain.unshift(parent)
    current = parent
    safety++
  }
  return chain
}

/** Tree "elbow" connector — the small L-shaped line linking a row to the parent's vertical guide. */
function TreeElbow({ isLast }: { isLast: boolean }) {
  return (
    <span
      aria-hidden
      className="absolute -left-3 sm:-left-4 top-0 w-3 sm:w-4 h-5 border-l border-b border-border/30 rounded-bl-md"
      style={isLast ? { borderLeftColor: 'transparent' } : undefined}
    />
  )
}

export function ExamGroup({
  group,
  exams,
  allGroups,
  allExams,
  currentUserId,
  userRole,
  onExamClick,
  onExamContextMenu,
  onDeleteGroup,
  onEditGroup,
  onCreateSubgroup,
  onReorderExam,
  onSortGroup,
  onDownloadPDF,
  onGroupDownloadPDF,
  depth = 0,
  highlightGroupId,
  filterQuery = '',
}: ExamGroupProps) {
  const isTarget = highlightGroupId === group._id
  const isAncestorOfTarget = !!highlightGroupId && !isTarget && isInSubtree(group._id, highlightGroupId, allGroups)

  const [isExpanded, setIsExpanded] = useState(depth === 0 || isTarget || isAncestorOfTarget || !!filterQuery.trim())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [highlighted, setHighlighted] = useState(isTarget)
  const [showGroupDownload, setShowGroupDownload] = useState(false)
  const [isSorting, setIsSorting] = useState(false)

  useEffect(() => {
    const target = !!highlightGroupId && highlightGroupId === group._id
    const ancestor = !!highlightGroupId && !target && isInSubtree(group._id, highlightGroupId, allGroups)
    if (target || ancestor || filterQuery.trim()) setIsExpanded(true)
    setHighlighted(target)
    if (target) {
      const timer = setTimeout(() => setHighlighted(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightGroupId, group._id, allGroups, filterQuery])

  const isCreator = group.createdBy === currentUserId
  const isAdmin = userRole === 'admin'
  const canManageGroup = isAdmin || (isCreator && group.type === 'personal')
  const normalizedFilter = filterQuery.trim().toLowerCase()

  function examMatchesFilter(exam: Exam): boolean {
    if (!normalizedFilter) return true
    const haystack = `${exam.title || ''} ${exam.description || ''}`.toLowerCase()
    return haystack.includes(normalizedFilter)
  }

  function groupMatchesSelf(g: GroupData): boolean {
    if (!normalizedFilter) return true
    const haystack = `${g.name || ''} ${g.description || ''} ${g.course || ''}`.toLowerCase()
    return haystack.includes(normalizedFilter)
  }

  function groupHasMatch(groupId: string): boolean {
    const current = allGroups.find(g => g._id === groupId)
    if (current && groupMatchesSelf(current)) return true
    if (allExams.some(e => e.groupId === groupId && examMatchesFilter(e))) return true
    return allGroups
      .filter(g => g.parentGroupId === groupId)
      .some(child => groupHasMatch(child._id))
  }

  const groupSelfMatches = !normalizedFilter || groupMatchesSelf(group)
  const directChildGroups = allGroups.filter(g => g.parentGroupId === group._id)
  const childGroups = groupSelfMatches
    ? directChildGroups
    : directChildGroups.filter(child => groupHasMatch(child._id))

  function countExamsRecursive(groupId: string, ancestorMatched = false): number {
    const current = allGroups.find(g => g._id === groupId)
    const currentMatched = ancestorMatched || !normalizedFilter || (current ? groupMatchesSelf(current) : false)
    const directExams = allExams.filter(e =>
      e.groupId === groupId && (currentMatched || examMatchesFilter(e))
    ).length
    const childGroupsOfThis = allGroups.filter(g => g.parentGroupId === groupId)
    const childExams = childGroupsOfThis.reduce((sum, cg) => {
      if (!currentMatched && !groupHasMatch(cg._id)) return sum
      return sum + countExamsRecursive(cg._id, currentMatched)
    }, 0)
    return directExams + childExams
  }

  const totalExamCount = countExamsRecursive(group._id)

  const handleDelete = async () => {
    if (!onDeleteGroup) return
    if (!confirm(`Deletar "${group.name}"? Subgrupos serão movidos para o nível acima.`)) return
    setIsDeleting(true)
    try { await onDeleteGroup(group._id) } finally { setIsDeleting(false) }
  }

  const handleShareLink = () => {
    const url = `${window.location.origin}/provas?grupo=${group._id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
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

  const accentColor = group.color || '#3B82F6'
  const ancestors = highlighted ? ancestorChain(group, allGroups) : []

  const sortedExams = [...exams]
    .filter(exam => groupSelfMatches || examMatchesFilter(exam))
    .sort((a, b) => {
      const oa = (a as any).orderInGroup ?? 999
      const ob = (b as any).orderInGroup ?? 999
      return oa !== ob ? oa - ob : 0
    })

  const directPracticeExams = sortedExams.filter(e => e.isPracticeExam)
  const totalRows = sortedExams.length + childGroups.length

  // Visual depth: cap indent so deep nesting doesn't destroy mobile space
  const indentClass = depth === 0 ? '' : depth === 1 ? 'ml-3.5 sm:ml-5' : 'ml-3 sm:ml-4'

  const header = (
    <div
      className={cn(
        'group/header relative flex items-start gap-2.5 rounded-2xl cursor-pointer select-none transition-colors duration-200',
        depth === 0 ? 'px-3 py-3.5' : 'px-2.5 py-3',
        highlighted
          ? 'bg-primary/10 ring-2 ring-primary/25 shadow-sm'
          : depth === 0
            ? 'glass-page-card glass-rim hover:shadow-md active:scale-[0.995]'
            : 'hover:bg-muted/50 active:bg-muted/70'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Expand chevron */}
      <motion.div
        animate={{ rotate: isExpanded ? 0 : -90 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="flex-shrink-0 mt-0.5 text-muted-foreground/60"
      >
        <ChevronDown className={depth === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      </motion.div>

      {/* Group avatar */}
      {group.imageUrl ? (
        <div className={cn(
          'flex-shrink-0 rounded-xl overflow-hidden border border-border/40 transition-transform duration-300 group-hover/header:scale-105',
          depth === 0 ? 'w-10 h-10' : 'w-8 h-8'
        )}>
          <img src={group.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className={cn(
            'flex-shrink-0 rounded-xl flex items-center justify-center text-white font-bold shadow-sm transition-transform duration-300 group-hover/header:scale-105 group-hover/header:-rotate-2',
            depth === 0 ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
          )}
          style={{ background: `linear-gradient(140deg, ${accentColor} 0%, ${accentColor}cc 100%)` }}
        >
          {group.icon && group.icon !== '📁' ? group.icon : group.name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Name + meta */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {ancestors.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap text-[10px] text-primary/70 font-medium pb-0.5">
            {ancestors.map((a, i) => (
              <span key={a._id} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-2.5 w-2.5 opacity-50" />}
                {a.name}
              </span>
            ))}
            <ChevronRight className="h-2.5 w-2.5 opacity-50" />
          </div>
        )}
        <div className="flex items-start gap-2 flex-wrap">
          <span className={cn(
            'font-semibold leading-snug break-words',
            depth === 0 ? 'text-sm sm:text-base' : 'text-sm',
            highlighted ? 'text-primary' : 'text-foreground'
          )}>
            {group.name}
          </span>
          {highlighted && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold animate-pulse flex-shrink-0 mt-0.5">
              ← aqui
            </span>
          )}
          {!highlighted && group.type === 'general' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium flex-shrink-0 mt-0.5">Geral</span>
          )}
          {!highlighted && group.category === 'faculdade' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium flex-shrink-0 mt-0.5">Faculdade</span>
          )}
        </div>
        {group.description && (
          <p className="text-[11px] text-muted-foreground/65 leading-relaxed line-clamp-2">{group.description}</p>
        )}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">
            {totalExamCount} {totalExamCount === 1 ? 'prova' : 'provas'}
          </span>
          {childGroups.length > 0 && (
            <span className="text-[10px] text-muted-foreground/40">· {childGroups.length} {childGroups.length === 1 ? 'subgrupo' : 'subgrupos'}</span>
          )}
        </div>
      </div>

      {/* Right-side actions — always visible on mobile, hover on desktop */}
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5" onClick={e => e.stopPropagation()}>
        {/* PDF download */}
        {directPracticeExams.length > 0 && onGroupDownloadPDF && (
          <div className="relative">
            <button
              onClick={() => setShowGroupDownload(v => !v)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-500/50 active:scale-95"
              title={`Baixar PDFs (${directPracticeExams.length} provas)`}
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-semibold">{directPracticeExams.length}</span>
            </button>
            {showGroupDownload && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowGroupDownload(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-border/50 bg-muted/30">
                    <p className="text-xs font-semibold text-foreground leading-snug">{group.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{directPracticeExams.length} provas · ordem de baixo pra cima</p>
                  </div>
                  {([
                    { type: 'exam',         label: 'PDF da Prova',              desc: 'Apenas as questões',          icon: '📄' },
                    { type: 'with-answers', label: 'Prova + Gabarito Comentado', desc: 'Com respostas e explicações', icon: '📚' },
                    { type: 'gabarito',     label: 'Só o Gabarito',             desc: 'Gabarito de todas as provas', icon: '✅' },
                  ] as const).map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => {
                        setShowGroupDownload(false)
                        onGroupDownloadPDF([...directPracticeExams].reverse(), opt.type, group.name)
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-muted/60 active:bg-muted transition-colors text-left"
                    >
                      <span className="text-lg leading-none flex-shrink-0">{opt.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Admin actions toggle — always visible */}
        {canManageGroup && (
          <button
            onClick={() => setShowActions(!showActions)}
            className={cn(
              'p-1.5 rounded-xl transition-colors',
              showActions ? 'bg-muted text-foreground' : 'text-muted-foreground/50 hover:bg-muted hover:text-foreground'
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className={indentClass}>
      {/* ─── Group Header — subtle 3D tilt only on top-level folders ─── */}
      {depth === 0 ? (
        <TiltCard maxTilt={2.5} scale={1.006} className="rounded-2xl">
          {header}
        </TiltCard>
      ) : header}

      {/* ─── Actions Bar ─── */}
      {showActions && canManageGroup && (
        <div className="mx-2 mb-2 mt-0.5 p-2 rounded-2xl border border-border/40 bg-muted/30 flex flex-wrap items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {onCreateSubgroup && (
            <Button variant="ghost" size="sm" onClick={() => { onCreateSubgroup(group._id); setShowActions(false) }}
              disabled={isDeleting} className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-xl">
              <FolderPlus className="h-3.5 w-3.5" /> Subgrupo
            </Button>
          )}
          {isAdmin && exams.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleSortAlpha}
              disabled={isSorting} className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-xl">
              <ArrowDownAZ className="h-3.5 w-3.5" />
              {isSorting ? 'Ordenando…' : 'A→Z reverso'}
            </Button>
          )}
          {onEditGroup && (
            <Button variant="ghost" size="sm" onClick={() => { onEditGroup(group); setShowActions(false) }}
              disabled={isDeleting} className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-xl">
              <Edit2 className="h-3.5 w-3.5" /> Editar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => { handleShareLink(); setShowActions(false) }}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-xl">
            <Share2 className="h-3.5 w-3.5" /> {copiedLink ? 'Copiado!' : 'Link'}
          </Button>
          {onDeleteGroup && (
            <Button variant="ghost" size="sm" onClick={() => { handleDelete(); setShowActions(false) }}
              disabled={isDeleting} className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive rounded-xl">
              <Trash2 className="h-3.5 w-3.5" /> Deletar
            </Button>
          )}
        </div>
      )}

      {/* ─── Expanded Content — animated via grid-template-rows (no JS height measuring) ─── */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className={cn(
            'mt-1 mb-1 space-y-0.5 relative',
            depth === 0 ? 'pl-4 sm:pl-5' : 'pl-3.5 sm:pl-4',
            'ml-3.5 sm:ml-5 border-l',
            highlighted ? 'border-primary/30' : 'border-border/25'
          )}>
            {/* Exams list */}
            {sortedExams.map((exam, examIdx) => {
              const examId = exam._id?.toString() || ''
              const typeColor = exam.isPracticeExam ? 'bg-emerald-500' : exam.isPersonalExam ? 'bg-violet-500' : 'bg-blue-500'
              const isLastRow = examIdx === sortedExams.length - 1 && childGroups.length === 0
              return (
                <div
                  key={examId}
                  className="group/exam relative flex items-start gap-3 py-3 px-3 rounded-xl hover:bg-muted/50 hover:translate-x-0.5 active:bg-muted/70 cursor-pointer transition-all duration-200"
                  onContextMenu={(e) => onExamContextMenu(exam, e)}
                  onClick={() => onExamClick(exam)}
                >
                  <TreeElbow isLast={isLastRow} />
                  {/* Admin reorder buttons */}
                  {isAdmin && group.type === 'general' && onReorderExam && (
                    <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5 opacity-0 group-hover/exam:opacity-100 sm:flex transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onReorderExam(examId, 'up')}
                        disabled={examIdx === 0}
                        className="p-1 rounded-lg hover:bg-muted disabled:opacity-20 transition-colors"
                      >
                        <ArrowUp className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => onReorderExam(examId, 'down')}
                        disabled={examIdx === sortedExams.length - 1}
                        className="p-1 rounded-lg hover:bg-muted disabled:opacity-20 transition-colors"
                      >
                        <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  {/* Type dot */}
                  <div className={cn('flex-shrink-0 w-2 h-2 rounded-full mt-2', typeColor)} />

                  {/* Title + description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug font-medium text-foreground group-hover/exam:text-primary transition-colors break-words">
                      {exam.title}
                    </p>
                    {exam.description && (
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-2 leading-relaxed">{exam.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {exam.isPracticeExam && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">Treino</span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50 tabular-nums">{exam.numberOfQuestions} questões</span>
                    </div>
                  </div>

                  {/* Download icon */}
                  {exam.isPracticeExam && onDownloadPDF && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownloadPDF(exam) }}
                      className="flex-shrink-0 mt-0.5 p-2 rounded-xl opacity-0 group-hover/exam:opacity-100 transition-opacity hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                      title="Baixar PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}

            {/* Child Groups */}
            {childGroups.map((childGroup, childIdx) => {
              const childExams = allExams.filter(e => e.groupId === childGroup._id)
              const isLastRow = childIdx === childGroups.length - 1
              return (
                <div key={childGroup._id} className="relative">
                  <TreeElbow isLast={isLastRow} />
                  <ExamGroup
                    group={childGroup}
                    exams={childExams}
                    allGroups={allGroups}
                    allExams={allExams}
                    currentUserId={currentUserId}
                    userRole={userRole}
                    onExamClick={onExamClick}
                    onExamContextMenu={onExamContextMenu}
                    onDeleteGroup={onDeleteGroup}
                    onEditGroup={onEditGroup}
                    onCreateSubgroup={onCreateSubgroup}
                    onReorderExam={onReorderExam}
                    onSortGroup={onSortGroup}
                    onDownloadPDF={onDownloadPDF}
                    onGroupDownloadPDF={onGroupDownloadPDF}
                    depth={depth + 1}
                    highlightGroupId={highlightGroupId}
                    filterQuery={filterQuery}
                  />
                </div>
              )
            })}

            {/* Empty state */}
            {totalRows === 0 && (
              <div className="flex items-center gap-2 py-4 px-3">
                <BookOpen className="h-4 w-4 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground/40 italic">Nenhuma prova neste grupo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
