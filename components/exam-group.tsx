'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Trash2, Edit2, FolderPlus, MoreHorizontal, ArrowUp, ArrowDown, Share2, Download, FileDown } from 'lucide-react'
import { Exam } from '@/lib/types'

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
  onDownloadPDF?: (exam: Exam) => void
  onGroupDownloadPDF?: (exams: Exam[], type: 'exam' | 'with-answers' | 'gabarito', groupName: string) => void
  depth?: number
  highlightGroupId?: string | null
}

/** Returns true if `targetId` is `groupId` OR a descendant of `groupId` */
function isInSubtree(groupId: string, targetId: string, allGroups: GroupData[]): boolean {
  if (groupId === targetId) return true
  const children = allGroups.filter(g => g.parentGroupId === groupId)
  return children.some(c => isInSubtree(c._id, targetId, allGroups))
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
  onDownloadPDF,
  onGroupDownloadPDF,
  depth = 0,
  highlightGroupId,
}: ExamGroupProps) {
  const isTarget = highlightGroupId === group._id
  const isAncestorOfTarget = !!highlightGroupId && !isTarget && isInSubtree(group._id, highlightGroupId, allGroups)

  // Expand if: root depth, OR this group IS the target, OR it's an ancestor of the target
  const [isExpanded, setIsExpanded] = useState(
    depth === 0 || isTarget || isAncestorOfTarget
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [highlighted, setHighlighted] = useState(isTarget)
  const [showGroupDownload, setShowGroupDownload] = useState(false)

  // Re-evaluate expansion when highlightGroupId changes (e.g. after groups load)
  useEffect(() => {
    const target = !!highlightGroupId && highlightGroupId === group._id
    const ancestor = !!highlightGroupId && !target && isInSubtree(group._id, highlightGroupId, allGroups)
    if (target || ancestor) setIsExpanded(true)
    setHighlighted(target)
    if (target) {
      const timer = setTimeout(() => setHighlighted(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightGroupId, group._id, allGroups])

  const isCreator = group.createdBy === currentUserId
  const isAdmin = userRole === 'admin'
  const canManageGroup = isAdmin || (isCreator && group.type === 'personal')

  const childGroups = allGroups.filter(g => g.parentGroupId === group._id)

  function countExamsRecursive(groupId: string): number {
    const directExams = allExams.filter(e => e.groupId === groupId).length
    const childGroupsOfThis = allGroups.filter(g => g.parentGroupId === groupId)
    const childExams = childGroupsOfThis.reduce((sum, cg) => sum + countExamsRecursive(cg._id), 0)
    return directExams + childExams
  }

  const totalExamCount = countExamsRecursive(group._id)

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

  const handleShareLink = () => {
    const url = `${window.location.origin}/provas?grupo=${group._id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  const accentColor = group.color || '#3B82F6'

  // Collect all practice exams recursively from this group and all descendant groups,
  // sorted by their orderInGroup so the merge order is consistent with what the user sees.
  function collectPracticeExamsRecursive(groupId: string): Exam[] {
    const direct = allExams
      .filter(e => e.groupId === groupId && e.isPracticeExam)
      .sort((a, b) => ((a as any).orderInGroup ?? 999) - ((b as any).orderInGroup ?? 999))
    const children = allGroups.filter(g => g.parentGroupId === groupId)
    const nested = children.flatMap(c => collectPracticeExamsRecursive(c._id))
    return [...direct, ...nested]
  }

  const allPracticeExams = collectPracticeExamsRecursive(group._id)

  // Sort exams by orderInGroup
  const sortedExams = [...exams].sort((a, b) => {
    const oa = (a as any).orderInGroup ?? 999
    const ob = (b as any).orderInGroup ?? 999
    if (oa !== ob) return oa - ob
    return 0
  })

  return (
    <div className={`${depth > 0 ? 'ml-3' : ''}`}>
      {/* ─── Group Header ─── */}
      <div
        className={`flex items-center gap-3 py-3 px-4 rounded-2xl cursor-pointer select-none transition-all duration-300 group/header
          ${highlighted
            ? 'bg-primary/10 border-2 border-primary/40 shadow-md shadow-primary/10 ring-2 ring-primary/20'
            : 'hover:bg-muted/50 border-2 border-transparent'
          }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Expand icon */}
        <div className="text-muted-foreground/50 group-hover/header:text-muted-foreground transition-colors">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>

        {/* Group image or color dot */}
        {group.imageUrl ? (
          <div className={`w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border ${highlighted ? 'border-primary/50' : 'border-border/50'}`}>
            <img src={group.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: accentColor }}
          >
            {group.icon && group.icon !== '📁' ? group.icon : group.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold truncate ${highlighted ? 'text-primary' : ''}`}>{group.name}</span>
            {highlighted && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold flex-shrink-0 animate-pulse">
                ← aqui
              </span>
            )}
            {group.type === 'general' && !highlighted && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium flex-shrink-0">
                Geral
              </span>
            )}
            {group.category === 'faculdade' && !highlighted && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium flex-shrink-0">
                Faculdade
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-[11px] text-muted-foreground/70 truncate">{group.description}</p>
          )}
        </div>

        {/* Count */}
        <span className="text-xs text-muted-foreground/60 tabular-nums bg-muted/50 px-2 py-0.5 rounded-full">
          {totalExamCount} {totalExamCount === 1 ? 'prova' : 'provas'}
        </span>

        {/* Group PDF download button — visible whenever this group has practice exams */}
        {allPracticeExams.length > 0 && onGroupDownloadPDF && (
          <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowGroupDownload(v => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40"
              title={`Baixar PDFs (${allPracticeExams.length} provas)`}
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            {showGroupDownload && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowGroupDownload(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl border border-border bg-popover shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-2 border-b border-border/50">
                  <p className="text-xs font-semibold text-foreground">{group.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{allPracticeExams.length} provas · ordem de baixo pra cima</p>
                </div>
                {([
                  { type: 'exam', label: 'PDF da Prova', desc: 'Apenas as questões', icon: '📄' },
                  { type: 'with-answers', label: 'Prova + Gabarito Comentado', desc: 'Com respostas e explicações', icon: '📚' },
                  { type: 'gabarito', label: 'Só o Gabarito', desc: 'Gabarito de todas as provas', icon: '✅' },
                ] as const).map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      setShowGroupDownload(false)
                      // allPracticeExams is already sorted top→bottom; reverse for bottom→top PDF order
                      onGroupDownloadPDF([...allPracticeExams].reverse(), opt.type, group.name)
                    }}
                    className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                  >
                    <span className="text-base leading-none mt-0.5 flex-shrink-0">{opt.icon}</span>
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

        {/* Actions toggle */}
        {canManageGroup && (
          <div
            className="opacity-0 group-hover/header:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Actions Bar ─── */}
      {showActions && canManageGroup && (
        <div className="ml-12 mb-2 flex flex-wrap items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {onCreateSubgroup && (
            <Button variant="ghost" size="sm" onClick={() => { onCreateSubgroup(group._id); setShowActions(false) }}
              disabled={isDeleting} className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground rounded-lg">
              <FolderPlus className="h-3 w-3" /> Subgrupo
            </Button>
          )}
          {onEditGroup && (
            <Button variant="ghost" size="sm" onClick={() => { onEditGroup(group); setShowActions(false) }}
              disabled={isDeleting} className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground rounded-lg">
              <Edit2 className="h-3 w-3" /> Editar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => { handleShareLink(); setShowActions(false) }}
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground rounded-lg">
            <Share2 className="h-3 w-3" /> {copiedLink ? 'Copiado!' : 'Link'}
          </Button>
          {onDeleteGroup && (
            <Button variant="ghost" size="sm" onClick={() => { handleDelete(); setShowActions(false) }}
              disabled={isDeleting} className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive rounded-lg">
              <Trash2 className="h-3 w-3" /> Deletar
            </Button>
          )}
        </div>
      )}

      {/* ─── Expanded Content ─── */}
      {isExpanded && (
        <div className={`${depth === 0 ? 'ml-6 pl-5 border-l-2' : 'ml-5 pl-4 border-l'} ${highlighted ? 'border-primary/30' : 'border-border/30'} space-y-1 pb-2 mt-1`}>
          {/* Exams */}
          {sortedExams.map((exam, examIdx) => {
            const examId = exam._id?.toString() || ''
            return (
              <div
                key={examId}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/40 cursor-pointer transition-all group/exam"
              >
                {/* Admin reorder buttons */}
                {isAdmin && group.type === 'general' && onReorderExam && (
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover/exam:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onReorderExam(examId, 'up')}
                      disabled={examIdx === 0}
                      className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition-colors"
                    >
                      <ArrowUp className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => onReorderExam(examId, 'down')}
                      disabled={examIdx === sortedExams.length - 1}
                      className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition-colors"
                    >
                      <ArrowDown className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                )}

                <div
                  className="flex items-center gap-3 flex-1 min-w-0"
                  onContextMenu={(e) => onExamContextMenu(exam, e)}
                  onClick={() => onExamClick(exam)}
                >
                  {/* Type indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    exam.isPracticeExam ? 'bg-emerald-500' : exam.isPersonalExam ? 'bg-violet-500' : 'bg-blue-500'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate group-hover/exam:text-primary transition-colors font-medium">
                      {exam.title}
                    </p>
                    {exam.description && (
                      <p className="text-[11px] text-muted-foreground/60 truncate">{exam.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {exam.isPracticeExam && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                        Treino
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                      {exam.numberOfQuestions}q
                    </span>
                    {exam.isPracticeExam && onDownloadPDF && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDownloadPDF(exam) }}
                        className="opacity-0 group-hover/exam:opacity-100 transition-opacity p-1 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                        title="Baixar PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Child Groups */}
          {childGroups.map((childGroup) => {
            const childExams = allExams.filter(e => e.groupId === childGroup._id)
            return (
              <ExamGroup
                key={childGroup._id}
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
                onDownloadPDF={onDownloadPDF}
                onGroupDownloadPDF={onGroupDownloadPDF}
                depth={depth + 1}
                highlightGroupId={highlightGroupId}
              />
            )
          })}

          {/* Empty state */}
          {exams.length === 0 && childGroups.length === 0 && (
            <p className="text-xs text-muted-foreground/40 py-3 pl-3 italic">Nenhuma prova neste grupo</p>
          )}
        </div>
      )}
    </div>
  )
}
