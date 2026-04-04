'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Trash2, Edit2, FolderPlus, MoreHorizontal, ArrowUp, ArrowDown, Share2, ExternalLink } from 'lucide-react'
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
  depth?: number
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
  depth = 0,
}: ExamGroupProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

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
        className="flex items-center gap-3 py-3 px-4 rounded-2xl cursor-pointer select-none hover:bg-muted/50 transition-all duration-200 group/header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Expand icon */}
        <div className="text-muted-foreground/50 group-hover/header:text-muted-foreground transition-colors">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>

        {/* Group image or color dot */}
        {group.imageUrl ? (
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-border/50">
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
            <span className="text-sm font-semibold truncate">{group.name}</span>
            {group.type === 'general' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium flex-shrink-0">
                Geral
              </span>
            )}
            {group.category === 'faculdade' && (
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
        <div className={`${depth === 0 ? 'ml-6 pl-5 border-l-2' : 'ml-5 pl-4 border-l'} border-border/30 space-y-1 pb-2 mt-1`}>
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
                depth={depth + 1}
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
