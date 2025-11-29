'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Trash2, Edit2 } from 'lucide-react'
import { Exam } from '@/lib/types'

interface ExamGroupProps {
  group: {
    _id: string
    name: string
    description?: string
    color?: string
    icon?: string
    type: 'personal' | 'general'
    createdBy: string
  }
  exams: Exam[]
  currentUserId: string
  userRole: 'admin' | 'user'
  onExamClick: (exam: Exam) => void
  onExamContextMenu: (exam: Exam, e: React.MouseEvent) => void
  onDeleteGroup?: (groupId: string) => Promise<void>
  onEditGroup?: (group: any) => void
}

export function ExamGroup({
  group,
  exams,
  currentUserId,
  userRole,
  onExamClick,
  onExamContextMenu,
  onDeleteGroup,
  onEditGroup,
}: ExamGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const isCreator = group.createdBy === currentUserId
  const isAdmin = userRole === 'admin'
  const canManageGroup = isAdmin || (isCreator && group.type === 'personal')

  const handleDelete = async () => {
    if (!onDeleteGroup) return
    if (!confirm(`Tem certeza que deseja deletar o grupo "${group.name}"?`)) return

    setIsDeleting(true)
    try {
      await onDeleteGroup(group._id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="overflow-hidden">
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
            </div>
            {group.description && (
              <CardDescription className="text-xs mt-1">{group.description}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
              {exams.length}
            </span>

            {canManageGroup && (
              <>
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

      {isExpanded && exams.length > 0 && (
        <CardContent className="space-y-2 pt-0">
          {exams.map((exam) => (
            <div
              key={exam._id?.toString()}
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
                    <p className="text-xs text-muted-foreground truncate">
                      {exam.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {exam.numberOfQuestions} questões
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      )}

      {isExpanded && exams.length === 0 && (
        <CardContent className="text-center py-6">
          <p className="text-sm text-muted-foreground">Nenhuma prova neste grupo</p>
        </CardContent>
      )}
    </Card>
  )
}
