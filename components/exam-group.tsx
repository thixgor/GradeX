'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Trash2, Edit2, FolderPlus, MoreHorizontal } from 'lucide-react'
import { Exam } from '@/lib/types'

interface GroupData {
  _id: string
  name: string
  description?: string
  color?: string
  icon?: string
  type: 'personal' | 'general'
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
  depth = 0,
}: ExamGroupProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [showActions, setShowActions] = useState(false)

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
    if (!confirm(`Deletar "${group.name}"? Subgrupos serao movidos para o nivel acima.`)) return
    setIsDeleting(true)
    try {
      await onDeleteGroup(group._id)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleDescription = (examId: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev)
      if (next.has(examId)) next.delete(examId)
      else next.add(examId)
      return next
    })
  }

  const accentColor = group.color || '#3B82F6'

  return (
    <div className={`${depth > 0 ? 'ml-4' : ''}`}>
      {/* Header do grupo - limpo e minimalista */}
      <div
        className="flex items-center gap-2 py-2.5 px-3 rounded-xl cursor-pointer select-none hover:bg-muted/60 transition-colors group/header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Chevron */}
        <div className="text-muted-foreground/60 group-hover/header:text-muted-foreground transition-colors">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>

        {/* Dot de cor */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        />

        {/* Nome e badges */}
        <span className="text-sm font-medium truncate flex-1">
          {group.icon && group.icon !== '📁' ? `${group.icon} ` : ''}{group.name}
        </span>

        {group.type === 'general' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
            Geral
          </span>
        )}

        {/* Contagem */}
        <span className="text-[11px] text-muted-foreground/70 tabular-nums">
          {totalExamCount}
        </span>

        {/* Botão de ações - aparece no hover */}
        {canManageGroup && (
          <div
            className="opacity-0 group-hover/header:opacity-100 transition-opacity flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Menu de ações flutuante */}
      {showActions && canManageGroup && (
        <div className="ml-9 mb-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {onCreateSubgroup && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onCreateSubgroup(group._id); setShowActions(false) }}
              disabled={isDeleting}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <FolderPlus className="h-3 w-3" />
              Subgrupo
            </Button>
          )}
          {onEditGroup && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onEditGroup(group); setShowActions(false) }}
              disabled={isDeleting}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="h-3 w-3" />
              Editar
            </Button>
          )}
          {onDeleteGroup && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { handleDelete(); setShowActions(false) }}
              disabled={isDeleting}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              Deletar
            </Button>
          )}
        </div>
      )}

      {/* Descrição do grupo */}
      {isExpanded && group.description && (
        <p className="text-xs text-muted-foreground/70 ml-9 mb-2 leading-relaxed">{group.description}</p>
      )}

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className={`ml-5 ${depth === 0 ? 'border-l-2 border-border/40' : 'border-l border-border/30'} pl-4 space-y-1 pb-1`}>
          {/* Provas */}
          {exams.map((exam) => {
            const examId = exam._id?.toString() || ''
            const isDescExpanded = expandedDescriptions.has(examId)

            return (
              <div
                key={examId}
                onContextMenu={(e) => onExamContextMenu(exam, e)}
                onClick={() => onExamClick(exam)}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group/exam"
              >
                {/* Indicador tipo */}
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  exam.isPersonalExam ? 'bg-violet-500' : 'bg-emerald-500'
                }`} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate group-hover/exam:text-primary transition-colors">
                    {exam.title}
                  </p>
                  {exam.description && (
                    <div>
                      <p className={`text-[11px] text-muted-foreground/70 leading-relaxed ${isDescExpanded ? 'whitespace-pre-wrap' : 'truncate'}`}>
                        {exam.description}
                      </p>
                      {exam.description.length > 80 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleDescription(examId) }}
                          className="text-[11px] text-primary/70 hover:text-primary hover:underline"
                        >
                          {isDescExpanded ? 'menos' : 'mais...'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[11px] text-muted-foreground/50 flex-shrink-0 tabular-nums">
                  {exam.numberOfQuestions}q
                </span>
              </div>
            )
          })}

          {/* Subgrupos */}
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
                depth={depth + 1}
              />
            )
          })}

          {/* Vazio */}
          {exams.length === 0 && childGroups.length === 0 && (
            <p className="text-xs text-muted-foreground/50 py-3 pl-3">Vazio</p>
          )}
        </div>
      )}
    </div>
  )
}
