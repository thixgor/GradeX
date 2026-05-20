'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { PageLoading } from '@/components/page-loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExamContextMenu } from '@/components/exam-context-menu'
import { ExamGroup } from '@/components/exam-group'
import { Exam } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import {
  Clock,
  Calendar,
  FileText,
  Info,
  Sparkles,
  Users,
  Plus,
  Trophy,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Play,
  Eye,
  GraduationCap,
  BookOpen,
  Layers,
  ArrowLeft,
  Edit2,
  Download,
  FileDown,
  BookOpenCheck,
  ListChecks,
  Search,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Group {
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

const COURSE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  'medicina': { label: 'Ciências Médicas', color: '#DC2626', icon: '🩺' },
  'psicologia': { label: 'Ciências Psicossociais', color: '#7C3AED', icon: '🧠' },
  'biomedicina': { label: 'Ciências Biomédicas', color: '#059669', icon: '🔬' },
  'odontologia': { label: 'Ciências Odontológicas', color: '#2563EB', icon: '🦷' },
}

// TODO: remove legacy course-key normalization once DB migration is run
const normalizeCourseKey = (key: string | undefined | null): string => {
  if (!key) return ''
  return key.replace(/-afya$/, '')
}

// ─── Skeleton Loader ──────────────────────────────────────────
function ExamSkeleton() {
  return (
    <div className="glass-page-card rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-5 w-16 rounded-full skeleton-pulse" />
        <div className="h-4 w-20 rounded-full skeleton-pulse" />
      </div>
      <div className="h-5 w-3/4 rounded skeleton-pulse" />
      <div className="h-4 w-1/2 rounded skeleton-pulse" />
      <div className="flex gap-4">
        <div className="h-4 w-24 rounded skeleton-pulse" />
        <div className="h-4 w-20 rounded skeleton-pulse" />
      </div>
      <div className="h-10 w-full rounded-xl skeleton-pulse" />
    </div>
  )
}

type ViewMode = 'home' | 'faculdade' | 'plataforma'

function ProvasContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, handleCreateExam, tierLimitExceeded } = useAppShell()

  const [exams, setExams] = useState<Exam[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ examId: string; examTitle: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showExamsInfo, setShowExamsInfo] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('home')
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editGroupForm, setEditGroupForm] = useState({ name: '', description: '', color: '#3B82F6', icon: '', imageUrl: '', category: '', course: '' })
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [highlightGroupId, setHighlightGroupId] = useState<string | null>(null)
  const [pdfModalExam, setPdfModalExam] = useState<Exam | null>(null)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [groupPdfProgress, setGroupPdfProgress] = useState<{ done: number; total: number; label: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'finished' | 'personal' | 'general'>('all')

  // Handle ?view=faculdade|plataforma direct entry
  useEffect(() => {
    const viewParam = searchParams.get('view')
    if (viewParam === 'faculdade' || viewParam === 'plataforma') {
      setViewMode(viewParam)
    }
  }, [searchParams])

  // Handle ?grupo=xxx shareable links
  useEffect(() => {
    const grupoParam = searchParams.get('grupo')
    if (grupoParam && groups.length > 0) {
      const targetGroup = groups.find(g => g._id === grupoParam)
      if (targetGroup) {
        // Walk up parent chain to find root group and determine category
        let rootGroup = targetGroup
        let safety = 0
        while (rootGroup.parentGroupId && safety < 20) {
          const parent = groups.find(g => g._id === rootGroup.parentGroupId)
          if (parent) rootGroup = parent
          else break
          safety++
        }
        // Use root group's category, or the target's own category
        const effectiveCategory = rootGroup.category || targetGroup.category
        if (effectiveCategory === 'faculdade') {
          setViewMode('faculdade')
        } else {
          setViewMode('plataforma')
        }
        setHighlightGroupId(grupoParam)
        setTimeout(() => setHighlightGroupId(null), 3000)
      }
    }
  }, [searchParams, groups])

  useEffect(() => {
    loadExamsAndGroups()
    // Pre-warm fonts + logo so they're cached before user clicks a PDF button
    import('@/lib/pdf-generator').then(m => m.prewarmPDFAssets()).catch(() => {})
  }, [])

  async function loadExamsAndGroups() {
    try {
      const [examsRes, groupsRes] = await Promise.all([
        fetch('/api/exams'),
        fetch('/api/groups'),
      ])

      const examsData = await examsRes.json()
      const groupsData = await groupsRes.json()

      setExams(examsData.exams || [])
      setGroups(groupsData.groups || [])
    } catch (error) {
      console.error('Erro ao carregar provas e grupos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleMoveExamToGroup(examId: string, groupId: string | null) {
    try {
      const res = await fetch(`/api/exams/${examId}/move-group`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      })

      if (res.ok) {
        setExams(exams.map(e =>
          e._id?.toString() === examId
            ? { ...e, groupId: groupId || undefined }
            : e
        ))
      } else {
        const error = await res.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao mover prova:', error)
      alert('Erro ao mover prova')
    }
  }

  function handleExamContextMenu(exam: Exam, e: React.MouseEvent) {
    e.preventDefault()
    setSelectedExam(exam)
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  async function handleCreateGroup(name: string, type: 'personal' | 'general', parentGroupId?: string | null, category?: string, course?: string) {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          description: '',
          color: '#3B82F6',
          icon: '',
          parentGroupId: parentGroupId || null,
          ...(category && { category }),
          ...(course && { course }),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setGroups([...groups, data.group])
        return
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error)
      throw new Error(error.message || 'Erro ao criar grupo')
    }
  }

  async function handleDeleteGroup(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        const deletedGroup = groups.find(g => g._id === groupId)
        const parentGroupId = deletedGroup?.parentGroupId || null
        setGroups(groups
          .filter(g => g._id !== groupId)
          .map(g => g.parentGroupId === groupId
            ? { ...g, parentGroupId: parentGroupId }
            : g
          )
        )
        setExams(exams.map(e =>
          e.groupId === groupId
            ? { ...e, groupId: undefined }
            : e
        ))
        return
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error: any) {
      console.error('Erro ao deletar grupo:', error)
      throw new Error(error.message || 'Erro ao deletar grupo')
    }
  }

  async function handleDeleteExam(examId: string) {
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        setExams(exams.filter(e => e._id?.toString() !== examId))
        setDeleteConfirmation(null)
        router.refresh()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao deletar prova')
      }
    } catch (error: any) {
      console.error('Erro ao deletar prova:', error)
      alert('Erro ao deletar prova: ' + error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleEditGroup(group: Group) {
    setEditingGroup(group)
    setEditGroupForm({
      name: group.name,
      description: group.description || '',
      color: group.color || '#3B82F6',
      icon: group.icon || '',
      imageUrl: (group as any).imageUrl || '',
      category: group.category || '',
      course: group.course || '',
    })
  }

  async function handleSaveGroup() {
    if (!editingGroup) return
    setIsSavingGroup(true)
    try {
      const res = await fetch(`/api/groups/${editingGroup._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editGroupForm.name,
          description: editGroupForm.description,
          color: editGroupForm.color,
          icon: editGroupForm.icon,
          imageUrl: editGroupForm.imageUrl || null,
          category: editGroupForm.category || undefined,
          course: editGroupForm.course || undefined,
        }),
      })
      if (res.ok) {
        setGroups(groups.map(g => g._id === editingGroup._id ? {
          ...g,
          name: editGroupForm.name,
          description: editGroupForm.description,
          color: editGroupForm.color,
          icon: editGroupForm.icon,
          imageUrl: editGroupForm.imageUrl || null,
          category: (editGroupForm.category || undefined) as any,
          course: editGroupForm.course || undefined,
        } : g))
        setEditingGroup(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao salvar grupo')
      }
    } catch (error) {
      alert('Erro ao salvar grupo')
    } finally {
      setIsSavingGroup(false)
    }
  }

  function handleSortGroup(_groupId: string) {
    loadExamsAndGroups()
  }

  async function handleReorderExam(examId: string, direction: 'up' | 'down') {
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      })
      if (res.ok) {
        // Reload to get updated order
        loadExamsAndGroups()
      }
    } catch (error) {
      console.error('Erro ao reordenar:', error)
    }
  }

  async function handleGroupDownloadPDF(
    groupExams: Exam[],
    type: 'exam' | 'with-answers' | 'gabarito',
    groupName: string
  ) {
    const labels = { exam: 'Provas', 'with-answers': 'Provas + Gabarito Comentado', gabarito: 'Gabaritos' }
    setGroupPdfProgress({ done: 0, total: groupExams.length, label: labels[type] })
    try {
      const { generateGroupPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const slug = groupName.replace(/\s+/g, '-').toLowerCase()
      const suffixes = { exam: 'provas', 'with-answers': 'provas-gabarito', gabarito: 'gabaritos' }
      const blob = await generateGroupPDF(groupExams, type, (done, total) => {
        setGroupPdfProgress({ done, total, label: labels[type] })
      })
      downloadPDF(blob, `${slug}-${suffixes[type]}.pdf`, { type: 'group_pdf', resourceId: groupName, resourceTitle: `${groupName} (${labels[type]})` })
    } catch (err) {
      console.error('Erro ao gerar PDF do grupo:', err)
    } finally {
      setGroupPdfProgress(null)
    }
  }

  async function handleDownloadPDF(exam: Exam, type: 'exam' | 'with-answers' | 'gabarito') {
    setPdfLoading(type)
    try {
      const { generateExamPDF, generateExamWithAnswersPDF, generateGabaritoPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const slug = exam.title.replace(/\s+/g, '-').toLowerCase()

      if (type === 'exam') {
        const blob = await generateExamPDF(exam)
        downloadPDF(blob, `prova-${slug}.pdf`, { type: 'exam_pdf', resourceId: (exam as any)._id, resourceTitle: exam.title })
      } else if (type === 'with-answers') {
        const blob = await generateExamWithAnswersPDF(exam)
        downloadPDF(blob, `prova-gabarito-comentado-${slug}.pdf`, { type: 'exam_answers_pdf', resourceId: (exam as any)._id, resourceTitle: exam.title })
      } else {
        const blob = await generateGabaritoPDF(exam)
        downloadPDF(blob, `gabarito-${slug}.pdf`, { type: 'gabarito_pdf', resourceId: (exam as any)._id, resourceTitle: exam.title })
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
    } finally {
      setPdfLoading(null)
    }
  }

  function getExamStatus(exam: Exam) {
    const now = new Date()
    const startTime = new Date(exam.startTime)
    const endTime = new Date(exam.endTime)

    if (exam.isPracticeExam) {
      return { text: 'Praticar', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-500', canTake: true }
    }

    if (now > endTime) {
      return { text: 'Finalizada', color: 'text-red-500', bgColor: 'bg-red-500/10', dotColor: 'bg-red-500', canTake: false }
    }

    if (exam.gatesOpen && exam.gatesClose) {
      const gatesOpen = new Date(exam.gatesOpen)
      const gatesClose = new Date(exam.gatesClose)

      if (now < gatesOpen) {
        return { text: 'Portoes fechados', color: 'text-muted-foreground', bgColor: 'bg-muted', dotColor: 'bg-gray-400', canTake: false }
      }

      if (now > gatesClose) {
        return { text: 'Portoes fechados', color: 'text-muted-foreground', bgColor: 'bg-muted', dotColor: 'bg-gray-400', canTake: false }
      }

      if (now >= startTime && now <= endTime) {
        return { text: 'Disponivel', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-500', canTake: true }
      } else if (now < startTime) {
        return { text: 'Aguardando', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', dotColor: 'bg-blue-500', canTake: true }
      }
    }

    if (now < startTime) {
      return { text: 'Aguardando', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', dotColor: 'bg-amber-500', canTake: false }
    }

    if (now >= startTime && now <= endTime) {
      return { text: 'Disponivel', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-500', canTake: true }
    }

    return { text: 'Indisponivel', color: 'text-muted-foreground', bgColor: 'bg-muted', dotColor: 'bg-gray-400', canTake: false }
  }

  // ─── Computed Data ──────────────────────────────────────────
  const faculdadeGroups = groups.filter(g => g.category === 'faculdade' && !g.parentGroupId)
  const plataformaGroups = groups.filter(g => g.category !== 'faculdade' && g.type === 'general' && !g.parentGroupId)
  const personalGroups = groups.filter(g => g.type === 'personal' && !g.parentGroupId)
  const ungroupedExams = exams.filter(e => !e.groupId)
  const personalExams = ungroupedExams.filter(e => e.isPersonalExam)
  const generalUngroupedExams = ungroupedExams.filter(e => !e.isPersonalExam)

  // ─── Search & Filter ─────────────────────────────────────────
  const normalizedQuery = searchQuery.trim().toLowerCase()
  function examMatchesQuery(exam: Exam, query = normalizedQuery): boolean {
    if (!query) return true
    const haystack = `${exam.title || ''} ${exam.description || ''}`.toLowerCase()
    return haystack.includes(query)
  }
  function matchesSearch(exam: Exam): boolean {
    return examMatchesQuery(exam)
  }
  function groupSelfMatchesSearch(group: Group, query = normalizedQuery): boolean {
    if (!query) return true
    const normalizedCourse = normalizeCourseKey(group.course)
    const courseInfo = normalizedCourse ? COURSE_LABELS[normalizedCourse] : null
    const groupHaystack = [
      group.name,
      group.description,
      group.course,
      courseInfo?.label,
    ].filter(Boolean).join(' ').toLowerCase()

    return groupHaystack.includes(query)
  }
  function groupMatchesSearchTree(group: Group, query = normalizedQuery): boolean {
    if (!query) return true
    if (groupSelfMatchesSearch(group, query)) return true
    if (exams.some(e => e.groupId === group._id && examMatchesQuery(e, query))) return true

    return groups
      .filter(child => child.parentGroupId === group._id)
      .some(child => groupMatchesSearchTree(child, query))
  }
  function matchesStatus(exam: Exam): boolean {
    if (statusFilter === 'all') return true
    const s = getExamStatus(exam)
    if (statusFilter === 'available') return s.canTake
    if (statusFilter === 'finished') return !exam.isPracticeExam && new Date() > new Date(exam.endTime)
    if (statusFilter === 'personal') return !!exam.isPersonalExam
    if (statusFilter === 'general') return !exam.isPersonalExam
    return true
  }
  const filteredUngrouped = ungroupedExams.filter(e => matchesSearch(e) && matchesStatus(e))

  function countGroupExams(groupId: string): number {
    function countRec(gid: string): number {
      const direct = exams.filter(e => e.groupId === gid).length
      const children = groups.filter(c => c.parentGroupId === gid)
      return direct + children.reduce((s, c) => s + countRec(c._id), 0)
    }
    return countRec(groupId)
  }

  function countGroupExamsForSearch(groupId: string, query = normalizedQuery, ancestorMatched = false): number {
    if (!query) return countGroupExams(groupId)

    const currentGroup = groups.find(g => g._id === groupId)
    const currentMatched = ancestorMatched || (currentGroup ? groupSelfMatchesSearch(currentGroup, query) : false)
    const direct = exams.filter(e =>
      e.groupId === groupId && (currentMatched || examMatchesQuery(e, query))
    ).length
    const children = groups.filter(c => c.parentGroupId === groupId)

    return direct + children.reduce((sum, child) => {
      if (!currentMatched && !groupMatchesSearchTree(child, query)) return sum
      return sum + countGroupExamsForSearch(child._id, query, currentMatched)
    }, 0)
  }

  // Contadores
  const faculdadeExamCount = faculdadeGroups.reduce((sum, g) => sum + countGroupExams(g._id), 0)

  const plataformaExamCount = exams.length - faculdadeExamCount

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="h-20 rounded-2xl skeleton-pulse" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-48 rounded-2xl skeleton-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── EXAM CARD (reusable) ──────────────────────────────────
  function ExamCard({ exam, index = 0 }: { exam: Exam; index?: number }) {
    const status = getExamStatus(exam)
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 + index * 0.04 }}
        className={cn(
          "glass-page-card rounded-2xl overflow-hidden group cursor-pointer",
          "hover-glow-green hover-lift transition-all duration-300",
          "border-l-[3px]",
          exam.isPersonalExam ? 'border-l-violet-500' : 'border-l-[#468152]'
        )}
        onContextMenu={(e) => handleExamContextMenu(exam, e)}
        onClick={() => {
          if (status.canTake) {
            router.push(`/exam/${exam._id}`)
          } else if (new Date() > new Date(exam.endTime)) {
            router.push(`/exam/${exam._id}/results`)
          }
        }}
      >
        {exam.coverImage && (
          <div className="h-32 overflow-hidden">
            <img
              src={exam.coverImage}
              alt={exam.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <div className="p-4 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
              exam.isPersonalExam
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                : 'bg-[#468152]/10 text-[#468152]'
            )}>
              {exam.isPersonalExam ? (
                <><Sparkles className="h-2.5 w-2.5" /> Pessoal</>
              ) : (
                <><Users className="h-2.5 w-2.5" /> Geral</>
              )}
            </span>
            <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full", status.bgColor)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dotColor)} />
              <span className={status.color}>{status.text}</span>
            </span>
          </div>

          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {exam.title}
          </h3>

          {exam.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{exam.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{exam.numberOfQuestions} questoes</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              <span>{exam.scoringMethod === 'tri' ? 'TRI' : `${exam.totalPoints} pts`}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {status.canTake ? (
              <Button className="flex-1 btn-brand-glow text-white rounded-xl text-xs font-semibold h-9" size="sm">
                <Play className="h-3.5 w-3.5 mr-1.5" />
                {exam.isPracticeExam ? 'Praticar' : status.text.includes('Aguardando') ? 'Entrar na Sala' : 'Realizar Prova'}
              </Button>
            ) : new Date() > new Date(exam.endTime) ? (
              <Button className="flex-1 rounded-xl text-xs h-9" variant="outline" size="sm">
                <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver Resultados
              </Button>
            ) : (
              <Button className="flex-1 rounded-xl text-xs h-9" variant="secondary" size="sm" disabled>
                {status.text}
              </Button>
            )}

            {exam.isPracticeExam && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs h-9 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                onClick={(e) => { e.stopPropagation(); setPdfModalExam(exam) }}
              >
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            )}

            {exam.isPersonalExam && exam.createdBy === user?.id && (
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl text-xs h-9"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteConfirmation({ examId: exam._id?.toString() || '', examTitle: exam.title })
                }}
              >
                Deletar
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════
  // HOME VIEW - Seletor principal
  // ═══════════════════════════════════════════════════
  if (viewMode === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-2 pt-4"
          >
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Provas</h1>
            <p className="text-muted-foreground">O que voce quer treinar hoje?</p>
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {exams.filter(e => getExamStatus(e).canTake).length} disponíveis agora
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                <Layers className="h-3 w-3" />
                {exams.length} totais
              </span>
            </div>
          </motion.div>

          {/* Dois cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card Provas da Faculdade */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <button
                onClick={() => setViewMode('faculdade')}
                className="w-full text-left group"
              >
                <div className="relative overflow-hidden rounded-2xl border-2 border-transparent hover:border-[#DC2626]/30 bg-gradient-to-br from-red-50/80 via-background to-orange-50/50 dark:from-red-950/20 dark:via-background dark:to-orange-950/10 p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 hover:scale-[1.01]">
                  {/* Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full" />

                  <div className="relative space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <GraduationCap className="h-7 w-7 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold">Provas da Faculdade</h2>
                        <p className="text-xs text-muted-foreground">
                          Provas antigas para treinar e melhorar
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Cursos disponíveis */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(COURSE_LABELS).map(([key, val]) => {
                        const courseGroupCount = groups.filter(g => normalizeCourseKey(g.course) === key).length
                        return (
                          <span key={key} className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-background/80 border border-border/50">
                            <span>{val.icon}</span>
                            <span>{val.label}</span>
                          </span>
                        )
                      })}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{faculdadeExamCount} provas</span>
                      <span>{faculdadeGroups.length} grupos</span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>

            {/* Card Provas da Plataforma */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <button
                onClick={() => setViewMode('plataforma')}
                className="w-full text-left group"
              >
                <div className="relative overflow-hidden rounded-2xl border-2 border-transparent hover:border-[#468152]/30 bg-gradient-to-br from-emerald-50/80 via-background to-amber-50/50 dark:from-emerald-950/20 dark:via-background dark:to-amber-950/10 p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.01]">
                  {/* Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />

                  <div className="relative space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-[#468152]/10 group-hover:bg-[#468152]/20 transition-colors">
                        <BookOpen className="h-7 w-7 text-[#468152]" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold">Provas da Plataforma</h2>
                        <p className="text-xs text-muted-foreground">
                          Provas gerais, pessoais e simulados
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-[#468152] group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#468152]/10 text-[#468152]">
                        <Users className="h-3 w-3" /> Gerais
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        <Sparkles className="h-3 w-3" /> Pessoais
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{plataformaExamCount} provas</span>
                      <span>{personalExams.length} pessoais</span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="flex justify-center gap-3"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExamsInfo(true)}
              className="rounded-xl text-xs"
            >
              <Info className="h-3.5 w-3.5 mr-1.5" />
              Sobre as Provas
            </Button>
            <Button
              onClick={handleCreateExam}
              disabled={tierLimitExceeded}
              size="sm"
              className="btn-brand-glow text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nova Prova
            </Button>
          </motion.div>
        </div>

        {/* Dialogs */}
        {renderInfoDialog()}
        {renderEditGroupModal()}
        {renderPdfModal()}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  // FACULDADE VIEW
  // ═══════════════════════════════════════════════════
  if (viewMode === 'faculdade') {
    // Agrupar por curso
    const courseMap = new Map<string, Group[]>()
    const uncategorizedFacGroups: Group[] = []

    faculdadeGroups.filter(g => groupMatchesSearchTree(g)).forEach(g => {
      const normalizedCourse = normalizeCourseKey(g.course)
      if (normalizedCourse && COURSE_LABELS[normalizedCourse]) {
        if (!courseMap.has(normalizedCourse)) courseMap.set(normalizedCourse, [])
        courseMap.get(normalizedCourse)!.push(g)
      } else {
        uncategorizedFacGroups.push(g)
      }
    })
    const hasFaculdadeResults = courseMap.size > 0 || uncategorizedFacGroups.length > 0
    const visibleFaculdadeGroupCount = Array.from(courseMap.values()).reduce((sum, list) => sum + list.length, 0) + uncategorizedFacGroups.length
    const visibleFaculdadeExamCount = [
      ...Array.from(courseMap.values()).flat(),
      ...uncategorizedFacGroups,
    ].reduce((sum, group) => sum + countGroupExamsForSearch(group._id), 0)
    const orderedCourseEntries = Object.keys(COURSE_LABELS)
      .filter(key => courseMap.has(key))
      .map(key => [key, courseMap.get(key)!] as [string, Group[]])

    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-4"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('home')}
              className="rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <GraduationCap className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Provas da Faculdade</h1>
                  <p className="text-xs text-muted-foreground">{faculdadeExamCount} provas disponiveis para treino</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl border border-border/50 bg-background/70 p-3 shadow-sm backdrop-blur-md"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por curso, período, grupo ou nome da prova…"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border/50 bg-background/80 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-red-500/10 px-2.5 py-1 font-medium text-red-600 dark:text-red-400">
                  {visibleFaculdadeExamCount} provas em {visibleFaculdadeGroupCount} grupos
                </span>
                <span>Resultados para “{searchQuery}”</span>
              </div>
            )}
          </motion.section>

          {/* Grupos por curso */}
          {orderedCourseEntries.map(([courseKey, courseGroups], idx) => {
            const courseInfo = COURSE_LABELS[courseKey]
            const courseExamCount = courseGroups.reduce((sum, group) => sum + countGroupExamsForSearch(group._id), 0)
            return (
              <motion.section
                key={courseKey}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
                className="rounded-2xl border border-border/40 bg-background/45 p-3 sm:p-4"
              >
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{courseInfo.icon}</span>
                    <h2 className="text-lg font-semibold" style={{ color: courseInfo.color }}>
                      {courseInfo.label}
                    </h2>
                  </div>
                  <span className="text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                    {courseExamCount} provas
                  </span>
                  <span className="text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                    {courseGroups.length} grupos
                  </span>
                  <div className="flex-1 h-px bg-border/50 min-w-8" />
                </div>

                <div className="space-y-1">
                  {courseGroups.map((group) => {
                    const groupExams = exams.filter(e => e.groupId === group._id)
                    return (
                      <ExamGroup
                        key={group._id}
                        group={group}
                        exams={groupExams}
                        allGroups={groups}
                        allExams={exams}
                        currentUserId={user?.id || ''}
                        userRole={user?.role || 'user'}
                        highlightGroupId={highlightGroupId}
                        onExamClick={(exam) => {
                          const status = getExamStatus(exam)
                          if (status.canTake) router.push(`/exam/${exam._id}`)
                          else if (new Date() > new Date(exam.endTime)) router.push(`/exam/${exam._id}/results`)
                        }}
                        onExamContextMenu={handleExamContextMenu}
                        onDeleteGroup={handleDeleteGroup}
                        onEditGroup={handleEditGroup}
                        onReorderExam={handleReorderExam}
                        onSortGroup={handleSortGroup}
                        onDownloadPDF={setPdfModalExam}
                        onGroupDownloadPDF={handleGroupDownloadPDF}
                        filterQuery={groupSelfMatchesSearch(group) ? '' : searchQuery}
                        onCreateSubgroup={(parentGroupId) => {
                          const name = prompt('Nome do subgrupo:')
                          if (name) handleCreateGroup(name, 'general', parentGroupId)
                        }}
                      />
                    )
                  })}
                </div>
              </motion.section>
            )
          })}

          {/* Grupos de faculdade sem curso */}
          {uncategorizedFacGroups.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-2xl border border-border/40 bg-background/45 p-3 sm:p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Outros</h2>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              <div className="space-y-1">
                {uncategorizedFacGroups.map((group) => {
                  const groupExams = exams.filter(e => e.groupId === group._id)
                  return (
                    <ExamGroup
                      key={group._id}
                      group={group}
                      exams={groupExams}
                      allGroups={groups}
                      allExams={exams}
                      currentUserId={user?.id || ''}
                      userRole={user?.role || 'user'}
                      highlightGroupId={highlightGroupId}
                      onExamClick={(exam) => {
                        const status = getExamStatus(exam)
                        if (status.canTake) router.push(`/exam/${exam._id}`)
                        else if (new Date() > new Date(exam.endTime)) router.push(`/exam/${exam._id}/results`)
                      }}
                      onExamContextMenu={handleExamContextMenu}
                      onDeleteGroup={handleDeleteGroup}
                      onEditGroup={handleEditGroup}
                      onReorderExam={handleReorderExam}
                      onDownloadPDF={setPdfModalExam}
                      onGroupDownloadPDF={handleGroupDownloadPDF}
                      filterQuery={groupSelfMatchesSearch(group) ? '' : searchQuery}
                      onCreateSubgroup={(parentGroupId) => {
                        const name = prompt('Nome do subgrupo:')
                        if (name) handleCreateGroup(name, 'general', parentGroupId)
                      }}
                    />
                  )
                })}
              </div>
            </motion.section>
          )}

          {/* Empty */}
          {!hasFaculdadeResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 mb-4">
                <GraduationCap className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma prova da faculdade</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? 'Nenhum curso, grupo ou prova corresponde a sua busca.'
                  : 'Provas antigas da faculdade serao adicionadas aqui pelo administrador.'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Context Menu & Modals */}
        {renderContextMenu()}
        {renderDeleteModal()}
        {renderEditGroupModal()}
        {renderPdfModal()}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  // PLATAFORMA VIEW
  // ═══════════════════════════════════════════════════
  const filteredPlatformGroups = [...plataformaGroups, ...personalGroups].filter(group => groupMatchesSearchTree(group))
  const hasPlatformResults = filteredUngrouped.length > 0 || filteredPlatformGroups.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('home')}
              className="rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#468152]/10">
                  <BookOpen className="h-5 w-5 text-[#468152]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Provas da Plataforma</h1>
                  <p className="text-xs text-muted-foreground">{plataformaExamCount} provas</p>
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={handleCreateExam}
            disabled={tierLimitExceeded}
            size="sm"
            className="btn-brand-glow text-white rounded-xl text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nova Prova
          </Button>
        </motion.div>

        {/* Stats — clickable filters */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            { key: 'all' as const, label: 'Total', value: exams.length, icon: Layers, color: '#64748b', iconBg: 'bg-slate-500/10 dark:bg-slate-500/20' },
            { key: 'available' as const, label: 'Disponíveis', value: exams.filter(e => getExamStatus(e).canTake).length, icon: Play, color: '#468152', iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
            { key: 'personal' as const, label: 'Pessoais', value: personalExams.length, icon: Sparkles, color: '#8b5cf6', iconBg: 'bg-violet-500/10 dark:bg-violet-500/20' },
            { key: 'general' as const, label: 'Gerais', value: generalUngroupedExams.length + plataformaGroups.length, icon: Users, color: '#3b82f6', iconBg: 'bg-blue-500/10 dark:bg-blue-500/20' },
          ]).map((stat, index) => {
            const Icon = stat.icon
            const active = statusFilter === stat.key
            return (
              <motion.button
                key={stat.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 + index * 0.06 }}
                onClick={() => setStatusFilter(prev => prev === stat.key ? 'all' : stat.key)}
                className={cn(
                  "glass-stat rounded-2xl p-4 hover-glow-brand hover-lift transition-all duration-300 group text-left cursor-pointer",
                  active && "ring-2 ring-primary/40 shadow-lg shadow-primary/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl group-hover:scale-110 transition-transform duration-300", stat.iconBg)}>
                    <Icon className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  </div>
                  {active && <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />}
                </div>
              </motion.button>
            )
          })}
        </section>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar provas por nome ou descrição…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-border/50 bg-background/60 backdrop-blur-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {(searchQuery || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
              className="rounded-xl text-xs text-muted-foreground"
            >
              Limpar filtros
            </Button>
          )}
        </motion.div>

        {/* Ungrouped exams */}
        {filteredUngrouped.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">Suas Provas</h2>
              </div>
              {(searchQuery || statusFilter !== 'all') && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {filteredUngrouped.length} de {ungroupedExams.length}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredUngrouped.map((exam, index) => (
                <ExamCard key={exam._id?.toString()} exam={exam} index={index} />
              ))}
            </div>
          </motion.section>
        )}

        {/* No results from filter */}
        {(searchQuery || statusFilter !== 'all') && !hasPlatformResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 rounded-2xl border border-dashed border-border/50"
          >
            <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma prova corresponde aos filtros.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
              className="rounded-xl text-xs mt-2"
            >
              Limpar filtros
            </Button>
          </motion.div>
        )}

        {/* Plataforma groups + Personal groups */}
        {filteredPlatformGroups.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">Grupos</h2>
              </div>
              {(searchQuery || statusFilter !== 'all') && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {filteredPlatformGroups.length} grupo{filteredPlatformGroups.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {filteredPlatformGroups.map((group) => {
                const groupExams = exams.filter(e => e.groupId === group._id)
                return (
                  <ExamGroup
                    key={group._id}
                    group={group}
                    exams={groupExams}
                    allGroups={groups}
                    allExams={exams}
                    currentUserId={user?.id || ''}
                    userRole={user?.role || 'user'}
                    highlightGroupId={highlightGroupId}
                    onExamClick={(exam) => {
                      const status = getExamStatus(exam)
                      if (status.canTake) router.push(`/exam/${exam._id}`)
                      else if (new Date() > new Date(exam.endTime)) router.push(`/exam/${exam._id}/results`)
                    }}
                    onExamContextMenu={handleExamContextMenu}
                    onDeleteGroup={handleDeleteGroup}
                    onEditGroup={handleEditGroup}
                    onReorderExam={handleReorderExam}
                    onDownloadPDF={setPdfModalExam}
                    onGroupDownloadPDF={handleGroupDownloadPDF}
                    filterQuery={groupSelfMatchesSearch(group) ? '' : searchQuery}
                    onCreateSubgroup={(parentGroupId) => {
                      const name = prompt('Nome do subgrupo:')
                      if (name) {
                        const parentGroup = groups.find(g => g._id === parentGroupId)
                        handleCreateGroup(name, parentGroup?.type || 'personal', parentGroupId)
                      }
                    }}
                  />
                )
              })}
            </div>
          </motion.section>
        )}

        {/* Empty state */}
        {ungroupedExams.length === 0 && plataformaGroups.length === 0 && personalGroups.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#468152]/10 mb-4">
              <FileText className="h-8 w-8 text-[#468152]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma prova ainda</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Crie sua primeira prova pessoal com questoes geradas por IA ou aguarde provas gerais.
            </p>
            <Button
              onClick={handleCreateExam}
              disabled={tierLimitExceeded}
              className="btn-brand-glow text-white rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Prova
            </Button>
          </motion.div>
        )}
      </div>

      {/* Context Menu & Modals */}
      {renderContextMenu()}
      {renderDeleteModal()}
      {renderInfoDialog()}
      {renderEditGroupModal()}
      {renderPdfModal()}

      {/* Single PDF generation toast */}
      {pdfLoading && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-card border border-border animate-in slide-in-from-bottom-4 duration-300">
          <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-emerald-500 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Gerando PDF…</p>
            <p className="text-xs text-muted-foreground">
              {pdfLoading === 'exam' ? 'Prova sem gabarito' : pdfLoading === 'with-answers' ? 'Prova com gabarito comentado' : 'Gabarito'}
            </p>
          </div>
        </div>
      )}

      {/* Group PDF generation progress toast */}
      {groupPdfProgress && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-card border border-border animate-in slide-in-from-bottom-4 duration-300">
          <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">{groupPdfProgress.label}</p>
            <p className="text-xs text-muted-foreground">
              Gerando {groupPdfProgress.done} de {groupPdfProgress.total} provas…
            </p>
          </div>
        </div>
      )}
    </div>
  )

  // ─── Shared Modals ──────────────────────────────────────────
  function renderPdfModal() {
    if (!pdfModalExam) return null
    const exam = pdfModalExam

    const options = [
      {
        key: 'exam' as const,
        icon: <FileText className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />,
        title: 'PDF da Prova',
        description: 'Questões em branco para imprimir e resolver no papel.',
        badge: null,
        gradient: 'from-emerald-500/10 to-emerald-600/5',
        border: 'border-emerald-500/20 hover:border-emerald-500/50',
      },
      {
        key: 'with-answers' as const,
        icon: <BookOpenCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />,
        title: 'Prova com Gabarito e Resposta Comentada',
        description: 'Questões completas com alternativa correta destacada e explicações.',
        badge: 'Completo',
        gradient: 'from-blue-500/10 to-blue-600/5',
        border: 'border-blue-500/20 hover:border-blue-500/50',
      },
      {
        key: 'gabarito' as const,
        icon: <ListChecks className="h-7 w-7 text-amber-600 dark:text-amber-400" />,
        title: 'Somente o Gabarito',
        description: 'Tabela compacta com as letras das respostas corretas.',
        badge: null,
        gradient: 'from-amber-500/10 to-amber-600/5',
        border: 'border-amber-500/20 hover:border-amber-500/50',
      },
    ]

    return (
      <Dialog open={!!pdfModalExam} onOpenChange={(open) => { if (!open && !pdfLoading) setPdfModalExam(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Baixar PDF
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{exam.title}</p>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {options.map((opt) => {
              const isLoading = pdfLoading === opt.key
              return (
                <button
                  key={opt.key}
                  disabled={!!pdfLoading}
                  onClick={() => handleDownloadPDF(exam, opt.key)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 bg-gradient-to-br ${opt.gradient} ${opt.border}
                    ${!!pdfLoading && !isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
                    ${isLoading ? 'ring-2 ring-primary/30' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {isLoading ? (
                        <div className="h-7 w-7 rounded-full border-2 border-current border-t-transparent animate-spin opacity-60" />
                      ) : opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{opt.title}</span>
                        {opt.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    </div>
                    {!isLoading && (
                      <Download className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setPdfModalExam(null)} disabled={!!pdfLoading}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  function renderContextMenu() {
    if (!selectedExam) return null
    return (
      <ExamContextMenu
        examId={selectedExam._id?.toString() || ''}
        examGroupId={selectedExam.groupId || null}
        isPersonalExam={selectedExam.isPersonalExam || false}
        createdBy={selectedExam.createdBy}
        currentUserId={user?.id || ''}
        userRole={user?.role || 'user'}
        groups={groups}
        onMoveToGroup={(groupId) => handleMoveExamToGroup(selectedExam._id?.toString() || '', groupId)}
        onCreateGroup={handleCreateGroup}
        position={contextMenu}
        onClose={() => {
          setContextMenu(null)
          setSelectedExam(null)
        }}
      />
    )
  }

  function renderDeleteModal() {
    if (!deleteConfirmation) return null
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-page-card rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-red-600 dark:text-red-400">Deletar Prova</h3>
                <p className="text-xs text-muted-foreground">Esta acao e irreversivel</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="font-semibold text-sm">{deleteConfirmation.examTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">Todas as submissoes tambem serao deletadas.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setDeleteConfirmation(null)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => handleDeleteExam(deleteConfirmation.examId)} disabled={isDeleting}>
                {isDeleting ? 'Deletando...' : 'Deletar'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  function renderEditGroupModal() {
    if (!editingGroup) return null
    const isAdmin = user?.role === 'admin'
    return (
      <Dialog open={!!editingGroup} onOpenChange={(open) => { if (!open) setEditingGroup(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Editar Grupo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
              <input
                type="text"
                value={editGroupForm.name}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Descricao</label>
              <input
                type="text"
                value={editGroupForm.description}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Descricao opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Cor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editGroupForm.color}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, color: e.target.value })}
                    className="w-8 h-8 rounded-lg border cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">{editGroupForm.color}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Icone (emoji)</label>
                <input
                  type="text"
                  value={editGroupForm.icon}
                  onChange={(e) => setEditGroupForm({ ...editGroupForm, icon: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="📁"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">URL da Imagem (opcional)</label>
              <input
                type="url"
                value={editGroupForm.imageUrl}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, imageUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="https://..."
              />
              {editGroupForm.imageUrl && (
                <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border">
                  <img src={editGroupForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            {isAdmin && editingGroup.type === 'general' && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
                  <select
                    value={editGroupForm.category}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Plataforma (padrao)</option>
                    <option value="faculdade">Faculdade</option>
                  </select>
                </div>
                {editGroupForm.category === 'faculdade' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Curso</label>
                    <select
                      value={editGroupForm.course}
                      onChange={(e) => setEditGroupForm({ ...editGroupForm, course: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Selecione o curso</option>
                      {Object.entries(COURSE_LABELS).map(([key, val]) => (
                        <option key={key} value={key}>{val.icon} {val.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEditingGroup(null)} disabled={isSavingGroup}>
              Cancelar
            </Button>
            <Button size="sm" className="rounded-xl btn-brand-glow text-white" onClick={handleSaveGroup} disabled={isSavingGroup || !editGroupForm.name.trim()}>
              {isSavingGroup ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  function renderInfoDialog() {
    return (
      <Dialog open={showExamsInfo} onOpenChange={setShowExamsInfo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#468152]/10">
                <Info className="h-5 w-5 text-[#468152]" />
              </div>
              O que sao essas Provas?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">Na DomineAqui, voce treina do jeito certo.</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                <GraduationCap className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300">Provas da Faculdade</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Provas antigas organizadas por curso. Treine com questoes reais para se preparar melhor.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#468152]/5 border border-[#468152]/15">
                <Users className="h-5 w-5 text-[#468152] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#468152]">Provas Gerais</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Elaboradas pela equipe DomineAqui, seguindo o padrao das provas reais.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/5 border border-violet-500/15">
                <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-violet-700 dark:text-violet-300">Provas Pessoais</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Crie suas proprias provas com IA, focando nos conteudos que voce precisa dominar.
                  </p>
                </div>
              </div>
            </div>
            <p className="font-semibold text-primary text-xs">DomineAqui — Seja o Foco, Seja a Referencia</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowExamsInfo(false)} className="rounded-xl">Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
}

export default function ProvasPage() {
  return (
    <AppShell headerTitle="Provas" headerSubtitle="Simulados e provas">
      <Suspense fallback={<PageLoading />}>
        <ProvasContent />
      </Suspense>
    </AppShell>
  )
}
