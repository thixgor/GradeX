'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Trash2, Edit2, FolderPlus, ChevronsRight } from 'lucide-react'
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
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())

  const isCreator = group.createdBy === currentUserId
  const isAdmin = userRole === 'admin'
  const canManageGroup = isAdmin || (isCreator && group.type === 'personal')

  // Encontrar subgrupos diretos deste grupo
  const childGroups = allGroups.filter(g => g.parentGroupId === group._id)

  // Contar total de provas recursivamente (grupo + subgrupos)
  function countExamsRecursive(groupId: string): number {
    const directExams = allExams.filter(e => e.groupId === groupId).length
    const childGroupsOfThis = allGroups.filter(g => g.parentGroupId === groupId)
    const childExams = childGroupsOfThis.reduce((sum, cg) => sum + countExamsRecursive(cg._id), 0)
    return directExams + childExams
  }

  const totalExamCount = countExamsRecursive(group._id)

  const handleDelete = async () => {
    if (!onDeleteGroup) return
    if (!confirm(`Tem certeza que deseja deletar o grupo "${group.name}"? Os subgrupos serão movidos para o nível acima.`)) return

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
      if (next.has(examId)) {
        next.delete(examId)
      } else {
        next.add(examId)
      }
      return next
    })
  }

  return (
    <Card className={`overflow-hidden ${depth > 0 ? 'border-l-4' : ''}`} style={depth > 0 ? { borderLeftColor: group.color || '#3B82F6' } : {}}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>

          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: group.color || '#3B82F6' }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{group.icon || '📁'} {group.name}</CardTitle>
              {group.type === 'general' && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Geral
                </span>
              )}
              {depth > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  Subgrupo
                </span>
              )}
            </div>
            {group.description && (
              <CardDescription className="text-xs mt-1">{group.description}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
              {totalExamCount}
            </span>

            {canManageGroup && (
              <>
                {onCreateSubgroup && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCreateSubgroup(group._id)}
                    disabled={isDeleting}
                    title="Criar subgrupo"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                )}
                {onEditGroup && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditGroup(group)}
                    disabled={isDeleting}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {onDeleteGroup && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2 pt-0">
          {/* Provas diretas deste grupo */}
          {exams.length > 0 && exams.map((exam) => {
            const examId = exam._id?.toString() || ''
            const isDescExpanded = expandedDescriptions.has(examId)

            return (
              <div
                key={examId}
                onContextMenu={(e) => onExamContextMenu(exam, e)}
                onClick={() => onExamClick(exam)}
                className={`p-3 rounded-lg border-l-4 hover:bg-muted/50 cursor-pointer transition-colors group ${
                  exam.isPersonalExam
                    ? 'border-l-purple-500 dark:border-l-purple-400 border border-muted'
                    : 'border-l-blue-500 dark:border-l-blue-400 border border-muted'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {exam.title}
                      </p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        exam.isPersonalExam
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {exam.isPersonalExam ? 'Pessoal' : 'Geral'}
                      </span>
                    </div>
                    {exam.description && (
                      <div>
                        <p className={`text-xs text-muted-foreground ${isDescExpanded ? 'whitespace-pre-wrap' : 'truncate'}`}>
                          {exam.description}
                        </p>
                        {exam.description.length > 80 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleDescription(examId)
                            }}
                            className="text-xs text-primary hover:underline mt-0.5"
                          >
                            {isDescExpanded ? 'Ver menos' : 'Ver mais'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {exam.numberOfQuestions} questoes
                  </span>
                </div>
              </div>
            )
          })}

          {/* Subgrupos */}
          {childGroups.length > 0 && (
            <div className={`space-y-2 ${exams.length > 0 ? 'pt-2 border-t border-border/50' : ''}`}>
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
            </div>
          )}

          {/* Estado vazio */}
          {exams.length === 0 && childGroups.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Nenhuma prova neste grupo</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
