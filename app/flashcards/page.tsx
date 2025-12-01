'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Sparkles,
  Flame,
  Wand2,
  Target,
  CheckCircle,
  Loader2,
  Brain,
  Layers,
  BookMarked,
  CircleDot,
  PlayCircle,
  Trophy,
  Zap,
  BarChart3,
  Feather,
  ShieldCheck,
  Trash2,
  Plus,
  ChevronDown,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { AccountType, FlashcardDeck, FlashcardCard, FlashcardDifficultyFeedback } from '@/lib/types'
import { TopicItem, MedicinaAFYAPeriodo, TEMPLATES } from '@/lib/cronograma-types'
import { getMedicinaAFYATopicos } from '@/lib/medicina-afya-periodos-helper'
import jsPDF from 'jspdf'

interface DeckWithId extends FlashcardDeck {
  _id: string
}

interface FlashcardSessionEntryPayload {
  cardId: string
  difficulty: FlashcardDifficultyFeedback
  objectivesStruggled: string[]
  completedAt: Date
}

interface ThemeWithId {
  _id: string
  title: string
  description?: string
  tags?: string[]
  defaultDifficulty?: number
  suggestedCardCount?: number
  contextHint?: string
}

const tierLimits: Record<AccountType | 'admin', { daily: number | string; active: string; cards: number | string; summary: string }> = {
  gratuito: {
    daily: 3,
    active: '10 decks ativos',
    cards: 5,
    summary: 'Modo sobrevivência: 3 decks por dia, 5 cartões cada. Gestão cirúrgica.',
  },
  trial: {
    daily: 10,
    active: '10 decks ativos',
    cards: 10,
    summary: 'Test drive com nitro: 10 decks por dia, 10 cartões cada, 10 decks ativos.',
  },
  premium: {
    daily: 25,
    active: 'Ilimitado',
    cards: 20,
    summary: 'Regime de elite: 25 decks/dia, 20 cartões cada e arsenal ilimitado.',
  },
  admin: {
    daily: '∞',
    active: 'Ilimitado',
    cards: '∞',
    summary: 'Modo deus: decks ilimitados, cartões ilimitados, sem restrições.',
  },
}

const difficultyLegend = [
  { label: 'Suave', description: 'Aqueci com facilidade', value: 'facil' as FlashcardDifficultyFeedback, color: 'from-emerald-400 to-emerald-600' },
  { label: 'No ponto', description: 'Peguei, mas precisei insistir', value: 'equilibrado' as FlashcardDifficultyFeedback, color: 'from-amber-400 to-amber-600' },
  { label: 'Porrete', description: 'Me deu trabalho e precisa voltar', value: 'porrada' as FlashcardDifficultyFeedback, color: 'from-rose-500 to-orange-600' },
]

function LiquidGlassPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 backdrop-blur-xl shadow-[0_25px_80px_-35px_rgba(15,23,42,0.1)] dark:shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)]',
        'transition-all hover:shadow-[0_35px_100px_-40px_rgba(15,23,42,0.15)] dark:hover:shadow-[0_35px_100px_-40px_rgba(15,23,42,0.65)]',
        className
      )}
    >
      {children}
    </div>
  )
}

export default function FlashcardsPage() {
  const router = useRouter()
  const [decks, setDecks] = useState<DeckWithId[]>([])
  const [themes, setThemes] = useState<ThemeWithId[]>([])
  const [loadingDecks, setLoadingDecks] = useState(true)
  const [loadingThemes, setLoadingThemes] = useState(true)
  const [creating, setCreating] = useState(false)
  const [accountType, setAccountType] = useState<AccountType>('gratuito')
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [realLimits, setRealLimits] = useState({ daily: 3, active: 10, cards: 5 })
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ open: false, message: '' })
  const [showCreationForm, setShowCreationForm] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ open: boolean; deckId: string; deckTitle: string }>({ open: false, deckId: '', deckTitle: '' })
  const [deleting, setDeleting] = useState(false)
  const [criticalObjectives, setCriticalObjectives] = useState<string[]>([])
  const [showCreateFromObjectives, setShowCreateFromObjectives] = useState(false)
  
  // Cronograma states
  const [showCronogramaSelector, setShowCronogramaSelector] = useState(false)
  const [selectedCronogramaType, setSelectedCronogramaType] = useState<'enem' | 'medicina-afya' | 'uerj' | null>(null)
  const [selectedMedicinaAFYAPeriodo, setSelectedMedicinaAFYAPeriodo] = useState<MedicinaAFYAPeriodo>(1)
  const [cronogramaTopicos, setCronogramaTopicos] = useState<TopicItem[]>([])
  const [selectedTopicos, setSelectedTopicos] = useState<string[]>([])
  const [selectedSubtopicos, setSelectedSubtopicos] = useState<string[]>([])
  const [showPeriodoSelector, setShowPeriodoSelector] = useState(false)

  // Creation form state
  const [title, setTitle] = useState('')
  const [theme, setTheme] = useState('')
  const [difficulty, setDifficulty] = useState(0.65)
  const [randomDifficulty, setRandomDifficulty] = useState(false)
  const [cardsRequested, setCardsRequested] = useState(5)
  const [notes, setNotes] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  // Study modal
  const [studyOpen, setStudyOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [selectedDeck, setSelectedDeck] = useState<DeckWithId | null>(null)
  const [cards, setCards] = useState<FlashcardCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [entries, setEntries] = useState<Record<string, FlashcardSessionEntryPayload>>({})
  const [sessionSaving, setSessionSaving] = useState(false)
  const [sessionResult, setSessionResult] = useState<string[]>([])

  useEffect(() => {
    loadDecks()
    loadThemes()
    loadAccountType()
  }, [])

  useEffect(() => {
    const limits = tierLimits[accountType]
    const maxCards = typeof limits.cards === 'number' ? limits.cards : Infinity
    setCardsRequested(Math.min(cardsRequested, maxCards))
  }, [accountType])

  const isAdmin = userRole === 'admin'
  const currentLimits = tierLimits[isAdmin ? 'admin' : accountType]
  
  const displayAccountType = isAdmin ? 'admin' : accountType

  async function loadAccountType() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserRole(data.user?.role || 'user')
        setAccountType(data.user?.accountType || 'gratuito')
      }
    } catch (error) {
      console.error('Erro ao buscar conta:', error)
    }
  }

  async function loadThemes() {
    try {
      setLoadingThemes(true)
      const res = await fetch('/api/flashcards/themes')
      if (!res.ok) throw new Error('Erro ao listar temas')
      const data = await res.json()
      setThemes((data.themes || []).map((t: any) => ({ ...t, _id: t._id })))
    } catch (error: any) {
      console.error('Erro ao carregar temas:', error)
    } finally {
      setLoadingThemes(false)
    }
  }

  async function loadDecks() {
    try {
      setLoadingDecks(true)
      const res = await fetch('/api/flashcards')
      if (!res.ok) {
        throw new Error('Erro ao listar flashcards')
      }
      const data = await res.json()
      setDecks((data.decks || []).map((deck: FlashcardDeck & { _id: string }) => ({ ...deck, _id: deck._id })))
    } catch (error: any) {
      setToast({ open: true, message: error.message || 'Erro ao carregar flashcards', type: 'error' })
    } finally {
      setLoadingDecks(false)
    }
  }

  function applyTemplate(tmpl: ThemeWithId) {
    setSelectedTemplateId(tmpl._id)
    setTheme(tmpl.title)
    if (tmpl.defaultDifficulty) setDifficulty(tmpl.defaultDifficulty)
    if (tmpl.suggestedCardCount) setCardsRequested(Math.min(tmpl.suggestedCardCount, realLimits.cards))
    if (tmpl.contextHint) setNotes(tmpl.contextHint)
  }

  async function handleCreateDeck() {
    if (!title.trim() || !theme.trim()) {
      setToast({ open: true, message: 'Título e tema são obrigatórios', type: 'error' })
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          theme: `${theme.trim()}${notes ? ` | ${notes.trim()}` : ''}`,
          difficulty,
          randomDifficulty,
          cardsRequested,
          templateId: selectedTemplateId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar flashcards')
      }

      setToast({ open: true, message: 'Deck criado com sucesso! 💥', type: 'success' })
      setTitle('')
      setTheme('')
      setNotes('')
      setDifficulty(0.65)
      setRandomDifficulty(false)
      const maxCards = typeof currentLimits.cards === 'number' ? currentLimits.cards : Infinity
      setCardsRequested(Math.min(5, maxCards))
      setShowCreationForm(false)
      loadDecks()
    } catch (error: any) {
      setToast({ open: true, message: error.message || 'Erro ao criar deck', type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  function handleCronogramaTypeSelect(type: 'enem' | 'medicina-afya' | 'uerj') {
    setSelectedCronogramaType(type as any)
    if (type === 'medicina-afya') {
      setShowPeriodoSelector(true)
    } else if (type === 'enem' || type === 'uerj') {
      const topicos = TEMPLATES[type].topicos
      setCronogramaTopicos(topicos)
    }
  }

  function handleMedicinaAFYAPeriodoChange(periodo: MedicinaAFYAPeriodo) {
    setSelectedMedicinaAFYAPeriodo(periodo)
    const topicos = getMedicinaAFYATopicos(periodo)
    setCronogramaTopicos(topicos)
    setShowPeriodoSelector(false)
  }

  function handleTopicoSelect(topicoId: string) {
    setSelectedTopicos(prev => 
      prev.includes(topicoId) 
        ? prev.filter(id => id !== topicoId)
        : [...prev, topicoId]
    )
  }

  function handleSubtopicoSelect(subtopicId: string) {
    setSelectedSubtopicos(prev => 
      prev.includes(subtopicId) 
        ? prev.filter(id => id !== subtopicId)
        : [...prev, subtopicId]
    )
  }

  function applySelectedTopicos() {
    // Coletar tópicos e subtópicos selecionados
    const selectedTopicosData = cronogramaTopicos.filter(t => selectedTopicos.includes(t.id))
    const selectedSubtopicosData: any[] = []
    
    selectedTopicosData.forEach(topico => {
      topico.subtopicos.forEach(subtopico => {
        if (selectedSubtopicos.includes(subtopico.id)) {
          selectedSubtopicosData.push({ topico: topico.nome, subtopico: subtopico.nome })
        }
      })
    })
    
    // Se nenhum subtópico foi selecionado, usar todos os subtópicos dos tópicos selecionados
    let itemsText = ''
    if (selectedSubtopicosData.length === 0) {
      itemsText = selectedTopicosData.map(t => t.nome).join(', ')
    } else {
      itemsText = selectedSubtopicosData.map(s => `${s.topico} - ${s.subtopico}`).join(', ')
    }
    
    // Coletar todos os submódulos dos tópicos/subtópicos selecionados
    const submodulos: string[] = []
    if (selectedSubtopicosData.length === 0) {
      // Se nenhum subtópico foi selecionado, usar todos os submódulos dos tópicos
      selectedTopicosData.forEach(topico => {
        topico.subtopicos.forEach(subtopico => {
          subtopico.modulos.forEach(modulo => {
            const moduloWithSubmodules = modulo as any
            if (moduloWithSubmodules.submodulos) {
              moduloWithSubmodules.submodulos.forEach((submod: any) => {
                submodulos.push(submod.nome)
              })
            }
          })
        })
      })
    } else {
      // Usar apenas os submódulos dos subtópicos selecionados
      selectedSubtopicosData.forEach(item => {
        const topico = cronogramaTopicos.find(t => t.nome === item.topico)
        if (topico) {
          const subtopico = topico.subtopicos.find(s => s.nome === item.subtopico)
          if (subtopico) {
            subtopico.modulos.forEach(modulo => {
              const moduloWithSubmodules = modulo as any
              if (moduloWithSubmodules.submodulos) {
                moduloWithSubmodules.submodulos.forEach((submod: any) => {
                  submodulos.push(submod.nome)
                })
              }
            })
          }
        }
      })
    }
    
    const submodulosText = submodulos.length > 0 ? submodulos.join('; ') : ''
    
    setTheme(itemsText)
    setNotes(submodulosText)
    setShowCronogramaSelector(false)
    setSelectedTopicos([])
    setSelectedSubtopicos([])
  }

  function downloadDeckPDF() {
    if (!selectedDeck || cards.length === 0) return

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - 2 * margin
    let yPosition = margin

    // Cores
    const primaryColor = [59, 130, 246] // Azul
    const accentColor = [168, 85, 247] // Roxo
    const textColor = [30, 30, 30]
    const lightGray = [240, 240, 240]

    // Logo/Header
    pdf.setFontSize(28)
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.setFont('helvetica', 'bold')
    pdf.text('DomineAqui', margin, yPosition)
    yPosition += 10

    // Subtítulo
    pdf.setFontSize(10)
    pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2])
    pdf.setFont('helvetica', 'normal')
    pdf.text('Flashcards de Estudo', margin, yPosition)
    yPosition += 12

    // Linha divisória colorida
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Título do deck
    pdf.setFontSize(20)
    pdf.setTextColor(textColor[0], textColor[1], textColor[2])
    pdf.setFont('helvetica', 'bold')
    const titleLines = pdf.splitTextToSize(selectedDeck.title, contentWidth)
    pdf.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 6 + 4

    // Tema
    pdf.setFontSize(11)
    pdf.setTextColor(100, 100, 100)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`📚 Tema: ${selectedDeck.theme}`, margin, yPosition)
    yPosition += 6

    // Data
    pdf.setFontSize(9)
    pdf.setTextColor(150, 150, 150)
    pdf.text(`📅 Gerado em: ${new Date().toLocaleDateString('pt-BR')} • Total: ${cards.length} cartões`, margin, yPosition)
    yPosition += 10

    // Linha divisória
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.setLineWidth(0.3)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Cards
    cards.forEach((card, index) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 50) {
        pdf.addPage()
        yPosition = margin
        
        // Header na nova página
        pdf.setFontSize(12)
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.setFont('helvetica', 'bold')
        pdf.text('DomineAqui', margin, yPosition)
        yPosition += 8
        
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
        pdf.setLineWidth(0.3)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 8
      }

      // Background do card
      pdf.setFillColor(240, 248, 255) // Azul muito claro
      pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, 1, 'F')

      // Número do card
      pdf.setFontSize(11)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFont('helvetica', 'bold')
      pdf.text(`🎯 Cartão ${index + 1} de ${cards.length}`, margin, yPosition)
      yPosition += 7

      // Pergunta
      pdf.setFontSize(11)
      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      pdf.setFont('helvetica', 'bold')
      const questionLines = pdf.splitTextToSize(`❓ ${card.front}`, contentWidth)
      pdf.text(questionLines, margin, yPosition)
      yPosition += questionLines.length * 5 + 3

      // Resposta
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.setTextColor(80, 80, 80)
      const answerLines = pdf.splitTextToSize(`✅ ${card.back}`, contentWidth)
      pdf.text(answerLines, margin, yPosition)
      yPosition += answerLines.length * 5 + 4

      // Objetivos
      if (card.objectives && card.objectives.length > 0) {
        pdf.setFontSize(9)
        pdf.setTextColor(100, 100, 100)
        const objectivesText = `🎓 Objetivos: ${card.objectives.map(o => o.text).join(', ')}`
        const objectivesLines = pdf.splitTextToSize(objectivesText, contentWidth)
        pdf.text(objectivesLines, margin, yPosition)
        yPosition += objectivesLines.length * 4 + 2
      }

      // Dica
      if (card.hint) {
        pdf.setFontSize(9)
        pdf.setTextColor(150, 100, 0)
        const hintText = `💡 Dica: ${card.hint}`
        const hintLines = pdf.splitTextToSize(hintText, contentWidth)
        pdf.text(hintLines, margin, yPosition)
        yPosition += hintLines.length * 4 + 4
      }

      // Separador entre cards
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.2)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 6
    })

    // Footer
    yPosition = pageHeight - 15
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text('DomineAqui • Plataforma de Estudo Inteligente', margin, yPosition)
    pdf.text(`Página 1 de ${pdf.internal.pages.length - 1}`, pageWidth - margin - 20, yPosition)

    // Salvar PDF
    pdf.save(`DomineAqui_${selectedDeck.title}.pdf`)
    setToast({ open: true, message: 'PDF baixado com sucesso!', type: 'success' })
  }

  function openDeleteConfirmation(deckId: string, deckTitle: string) {
    setDeleteConfirmation({ open: true, deckId, deckTitle })
  }

  async function confirmDeleteDeck() {
    if (!deleteConfirmation.deckId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/flashcards/${deleteConfirmation.deckId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar deck')
      setToast({ open: true, message: 'Deck deletado com sucesso!', type: 'success' })
      setDeleteConfirmation({ open: false, deckId: '', deckTitle: '' })
      loadDecks()
    } catch (error: any) {
      setToast({ open: true, message: error.message || 'Erro ao deletar deck', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  async function openDeck(deck: DeckWithId) {
    setSelectedDeck(deck)
    setStudyOpen(true)
    setFlipped(false)
    setShowHint(false)
    setCurrentIndex(0)
    setSessionResult([])
    setEntries({})

    try {
      const res = await fetch(`/api/flashcards/${deck._id}/cards`)
      if (!res.ok) throw new Error('Erro ao carregar cartões')
      const data = await res.json()
      setCards(data.cards || [])
    } catch (error: any) {
      setToast({ open: true, message: error.message || 'Erro ao carregar cartões', type: 'error' })
    }
  }

  function handleDifficultySelect(cardId: string, difficulty: FlashcardDifficultyFeedback, objectivesStruggled: string[]) {
    setEntries(prev => ({
      ...prev,
      [cardId]: {
        cardId,
        difficulty,
        objectivesStruggled,
        completedAt: new Date(),
      },
    }))
  }

  async function handleCompleteDeck() {
    if (!selectedDeck) return
    const payload = Object.values(entries)
    if (payload.length !== cards.length) {
      setToast({ open: true, message: 'Marca a dificuldade de todos os cartões antes de finalizar', type: 'error' })
      return
    }

    setSessionSaving(true)
    try {
      const res = await fetch(`/api/flashcards/${selectedDeck._id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar sessão')

      const objectives = data.dominantObjectives || []
      setSessionResult(objectives)
      setCriticalObjectives(objectives)
      setReportOpen(true)
      loadDecks()
      setStudyOpen(false)
    } catch (error: any) {
      setToast({ open: true, message: error.message || 'Erro ao salvar sessão', type: 'error' })
    } finally {
      setSessionSaving(false)
    }
  }

  const currentCard = cards[currentIndex]
  const currentEntry = currentCard ? entries[currentCard.id] : undefined

  const objectivesSelection = currentCard
    ? (currentEntry?.objectivesStruggled || [])
    : []

  function toggleObjective(objId: string) {
    if (!currentCard) return
    const cardId = currentCard.id
    const prev = entries[cardId]
    const nextObjectives = objectivesSelection.includes(objId)
      ? objectivesSelection.filter(o => o !== objId)
      : [...objectivesSelection, objId]
    handleDifficultySelect(cardId, prev?.difficulty || 'equilibrado', nextObjectives)
  }

  function handleDifficultyChange(value: FlashcardDifficultyFeedback) {
    if (!currentCard) return
    
    // Se nenhum objetivo foi selecionado, seleciona todos automaticamente
    let objectivesToUse = objectivesSelection
    if (objectivesSelection.length === 0 && currentCard.objectives.length > 0) {
      objectivesToUse = currentCard.objectives.map(obj => obj.id)
    }
    
    handleDifficultySelect(currentCard.id, value, objectivesToUse)
  }

  function goNextCard() {
    if (!currentCard) return
    if (!entries[currentCard.id]) {
      setToast({ open: true, message: 'Escolha a dificuldade antes de avançar', type: 'error' })
      return
    }
    if (currentIndex === cards.length - 1) {
      handleCompleteDeck()
      return
    }
    setCurrentIndex(prev => prev + 1)
    setFlipped(false)
    setShowHint(false)
  }

  const gradientBackground = useMemo(() => {
    return 'bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_50%),_linear-gradient(135deg,_#020617,_#0f172a,_#020617)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_50%),_linear-gradient(135deg,_#020617,_#0f172a,_#020617)] bg-white dark:bg-slate-950'
  }, [])

  const slogan = 'Enquanto os outros repetem como papagaio, tu martela com nossos flashcards até a matéria virar reflexo.'

  return (
    <div className={cn('min-h-screen text-slate-900 dark:text-white', gradientBackground)}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4 min-h-[56px] sm:min-h-[64px]">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-slate-600 hover:text-slate-900 dark:text-white/80 dark:hover:text-white h-8 w-8 sm:h-9 sm:w-9 shrink-0" 
              onClick={() => router.push('/')}
            > 
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-semibold text-slate-900 dark:text-white min-w-0 flex-1">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="hidden sm:inline">Flashcards</span>
              <span className="sm:hidden">Flashcards</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button 
                variant="ghost"
                size="icon"
                className="text-slate-600 dark:text-white/80 border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex"
                onClick={() => router.push('/cronogramas')}
                title="Cronogramas"
              >
                <BookMarked className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-white/70 hidden md:block whitespace-nowrap">
                <span className="font-semibold text-slate-900 dark:text-white">{displayAccountType.toUpperCase()}</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <LiquidGlassPanel className="p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200 dark:bg-white/20 text-slate-700 dark:text-white text-sm uppercase tracking-wide">
                <Sparkles className="h-4 w-4" /> Novo laboratório de Flashcards
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
                Flashcards
              </h1>
              <p className="text-lg text-slate-700 dark:text-white/80 max-w-3xl">
                {slogan}
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 p-4">
                  <p className="text-sm text-slate-600 dark:text-white/70">Decks hoje</p>
                  <p className="text-3xl font-semibold text-slate-900 dark:text-white">{tierLimits[accountType].daily}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 p-4">
                  <p className="text-sm text-slate-600 dark:text-white/70">Cartões por deck</p>
                  <p className="text-3xl font-semibold text-slate-900 dark:text-white">{tierLimits[accountType].cards}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 p-4">
                  <p className="text-sm text-slate-600 dark:text-white/70">Decks ativos</p>
                  <p className="text-3xl font-semibold text-slate-900 dark:text-white">{tierLimits[accountType].active}</p>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                onClick={() => setShowCreationForm(!showCreationForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {showCreationForm ? 'Cancelar' : 'Criar novo deck'}
              </Button>
            </div>
            {showCreationForm && (
            <div className="flex-1 w-full">
              <LiquidGlassPanel className="p-6 bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/30">
                <div className="flex items-center gap-3 mb-4">
                  <Wand2 className="h-6 w-6 text-slate-900 dark:text-white" />
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold">Criar flashcards com IA</p>
                    <p className="text-slate-600 dark:text-white/70 text-sm">Escolha o tema, definimos o resto</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-white/80">Título do deck</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Neurocirurgia de Guerra" className="bg-white dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-white/80">Tema foco</Label>
                    <div className="flex gap-2">
                      <Input value={theme} onChange={e => setTheme(e.target.value)} placeholder="Tema específico" className="flex-1 bg-white dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40" />
                      <Button 
                        type="button"
                        className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-10"
                        onClick={() => setShowCronogramaSelector(true)}
                      >
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Cronograma
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-white/80">Briefing agressivo (opcional)</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contexto ou instruções específicas para a IA" rows={3} className="bg-white dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label className="text-slate-700 dark:text-white/80 flex items-center justify-between">
                        <span>Dificuldade alvo</span>
                        <span className="text-slate-900 dark:text-white font-semibold">{Math.round(difficulty * 100)}%</span>
                      </Label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={difficulty}
                        onChange={e => setDifficulty(parseFloat(e.target.value))}
                        disabled={randomDifficulty}
                        className="w-full"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <Switch checked={randomDifficulty} onCheckedChange={setRandomDifficulty} />
                        <span className="text-sm text-slate-600 dark:text-white/70">Misturar níveis automaticamente</span>
                      </div>
                    </div>
                    <div className="w-full sm:w-36">
                      <Label className="text-slate-700 dark:text-white/80">Cartões</Label>
                      <Input
                        type="number"
                        min={1}
                        max={currentLimits.cards}
                        value={cardsRequested}
                        onChange={e => setCardsRequested(Number(e.target.value))}
                        className="bg-white dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white"
                      />
                      <p className="text-xs text-slate-600 dark:text-white/60 mt-1">{currentLimits.cards} máx por deck</p>
                    </div>
                  </div>
                  <Button className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-white/20 dark:hover:bg-white/30 text-slate-900 dark:text-white" onClick={handleCreateDeck} disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {creating ? 'Gerando...' : 'Gerar flashcards agora'}
                  </Button>
                </div>
              </LiquidGlassPanel>
            </div>
            )}
          </div>
        </LiquidGlassPanel>

        {!loadingThemes && themes.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Templates Disponíveis
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto pb-2">
              {themes.map(tmpl => (
                <button
                  key={tmpl._id}
                  onClick={() => applyTemplate(tmpl)}
                  className={cn(
                    'rounded-3xl border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5 backdrop-blur-xl shadow-[0_25px_80px_-35px_rgba(15,23,42,0.1)] dark:shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)]',
                    'transition-all hover:shadow-[0_35px_100px_-40px_rgba(15,23,42,0.15)] dark:hover:shadow-[0_35px_100px_-40px_rgba(15,23,42,0.65)] hover:bg-slate-200 dark:hover:bg-white/15',
                    'p-4 cursor-pointer flex flex-col justify-between min-w-[200px] text-left'
                  )}
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{tmpl.title}</p>
                    {tmpl.description && <p className="text-xs text-slate-600 dark:text-white/70 line-clamp-2 mt-1">{tmpl.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tmpl.defaultDifficulty && (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80">
                        {Math.round(tmpl.defaultDifficulty * 100)}%
                      </span>
                    )}
                    {tmpl.suggestedCardCount && (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80">
                        {tmpl.suggestedCardCount} cards
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <LiquidGlassPanel className="p-6 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <BookMarked className="h-5 w-5 text-slate-900 dark:text-white" />
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Modo estudo hardcore</h3>
              <p className="text-sm text-slate-600 dark:text-white/70">Registra o peso de cada cartão e rastreia objetivos críticos</p>
            </div>
          </div>
          <div className="space-y-4">
            {difficultyLegend.map(option => (
              <div key={option.value} className="flex items-center justify-between rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{option.label}</p>
                  <p className="text-sm text-slate-600 dark:text-white/70">{option.description}</p>
                </div>
                <div className={cn('px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r', option.color)}>
                  {option.label}
                </div>
              </div>
            ))}
          </div>
        </LiquidGlassPanel>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Meus decks</h2>
          <Button variant="outline" className="bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/30 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20" onClick={loadDecks}>
            <Loader2 className={cn('h-4 w-4 mr-2', loadingDecks && 'animate-spin')} /> Atualizar
          </Button>
        </div>

        {loadingDecks ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-white" />
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-16 text-slate-600 dark:text-white/70">
            Nenhum deck ainda. Clique em "Criar novo deck" para começar.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {decks.map(deck => (
              <LiquidGlassPanel key={deck._id} className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-400/40 to-blue-500/50 dark:from-cyan-400/40 dark:to-blue-500/50">
                    <Brain className="h-5 w-5 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-white/80 text-sm">{new Date(deck.createdAt).toLocaleDateString('pt-BR')}</p>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{deck.title}</h3>
                  </div>
                </div>
                <p className="text-slate-700 dark:text-white/70">{deck.theme}</p>
                <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-white/70">
                  <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20">{Math.round(deck.difficultyPercentage * 100)}% alvo</span>
                  <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20">{deck.cardsGenerated} cartões</span>
                  <span className={cn('px-3 py-1 rounded-full border', deck.status === 'ativo' ? 'border-emerald-300 text-emerald-700 dark:text-emerald-200' : 'border-slate-300 dark:border-white/40 text-slate-600 dark:text-white/70')}>
                    {deck.status === 'ativo' ? 'Ativo' : 'Concluído'}
                  </span>
                </div>
                <div className="flex gap-2 mt-auto">
                  <Button
                    className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-white/20 dark:hover:bg-white/30 text-white dark:text-white"
                    onClick={() => openDeck(deck)}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {deck.status === 'ativo' ? 'Estudo' : 'Revisar'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                    onClick={() => openDeleteConfirmation(deck._id, deck.title)}
                    title="Deletar deck"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {deck.status === 'ativo' && (
                    <Button
                      variant="ghost"
                      className="text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/flashcards/${deck._id}/archive`, { method: 'POST' })
                          if (!res.ok) throw new Error('Erro ao arquivar')
                          setToast({ open: true, message: 'Deck arquivado!', type: 'success' })
                          loadDecks()
                        } catch (error: any) {
                          setToast({ open: true, message: error.message, type: 'error' })
                        }
                      }}
                      title="Arquivar deck para liberar slot"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </LiquidGlassPanel>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCronogramaSelector} onOpenChange={setShowCronogramaSelector}>
        <DialogContent className="w-[95vw] max-w-2xl h-[85vh] max-h-[85vh] rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 backdrop-blur-xl text-white border border-white/10 shadow-2xl animate-in fade-in duration-300 flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white flex items-center gap-2 text-xl sm:text-2xl">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 flex-shrink-0" />
              <span className="truncate">Tópicos do Cronograma</span>
            </DialogTitle>
            <DialogDescription className="text-white/70 text-xs sm:text-sm line-clamp-2">
              Selecione o tipo e os tópicos que deseja estudar
            </DialogDescription>
          </DialogHeader>

          {!selectedCronogramaType ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md">
                <button
                  onClick={() => handleCronogramaTypeSelect('enem')}
                  className="p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center"
                >
                  <p className="font-semibold text-white text-sm sm:text-base">ENEM</p>
                  <p className="text-xs text-white/70 mt-1">Preparação</p>
                </button>
                <button
                  onClick={() => handleCronogramaTypeSelect('medicina-afya')}
                  className="p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center"
                >
                  <p className="font-semibold text-white text-sm sm:text-base">Medicina AFYA</p>
                  <p className="text-xs text-white/70 mt-1">Medicina</p>
                </button>
                <button
                  onClick={() => handleCronogramaTypeSelect('uerj')}
                  className="p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center"
                >
                  <p className="font-semibold text-white text-sm sm:text-base">UERJ</p>
                  <p className="text-xs text-white/70 mt-1">Vestibular</p>
                </button>
              </div>
            </div>
          ) : showPeriodoSelector ? (
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div>
                <Label className="text-white/80 text-sm sm:text-base">Selecione o Período</Label>
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {[1, 2, 3, 4, 5].map(p => (
                    <button
                      key={p}
                      onClick={() => handleMedicinaAFYAPeriodoChange(p as MedicinaAFYAPeriodo)}
                      className={cn(
                        'p-3 rounded-xl border-2 transition-all font-semibold text-sm',
                        selectedMedicinaAFYAPeriodo === p
                          ? 'border-blue-500 bg-blue-500/30 text-blue-200'
                          : 'border-white/20 bg-white/5 text-white hover:border-blue-500'
                      )}
                    >
                      {p}º
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-2">
              <Label className="text-white/80 text-sm sm:text-base">Selecione Tópicos e Subtópicos</Label>
              {cronogramaTopicos.map(topico => (
                <div key={topico.id} className="space-y-2">
                  <button
                    onClick={() => handleTopicoSelect(topico.id)}
                    className={cn(
                      'w-full p-3 sm:p-4 rounded-2xl border-2 transition-all text-left',
                      selectedTopicos.includes(topico.id)
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-white hover:border-blue-500'
                    )}
                  >
                    <p className="font-semibold text-sm sm:text-base">{topico.nome}</p>
                    <p className="text-xs sm:text-sm text-white/70 mt-1">
                      {topico.subtopicos.length} subtópicos
                    </p>
                  </button>
                  
                  {selectedTopicos.includes(topico.id) && (
                    <div className="ml-4 space-y-1 border-l-2 border-blue-500/30 pl-3">
                      {topico.subtopicos.map(subtopico => (
                        <button
                          key={subtopico.id}
                          onClick={() => handleSubtopicoSelect(subtopico.id)}
                          className={cn(
                            'w-full p-2 rounded-lg border-2 transition-all text-left text-xs sm:text-sm',
                            selectedSubtopicos.includes(subtopico.id)
                              ? 'border-purple-500 bg-purple-500/20 text-white'
                              : 'border-white/10 bg-white/5 text-white/80 hover:border-purple-500'
                          )}
                        >
                          {subtopico.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex-shrink-0 flex gap-2 mt-4">
            {selectedCronogramaType && !showPeriodoSelector && (
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 sm:h-12 text-xs sm:text-sm"
                onClick={() => {
                  setSelectedCronogramaType(null)
                  setCronogramaTopicos([])
                  setSelectedTopicos([])
                  setSelectedSubtopicos([])
                  setShowPeriodoSelector(false)
                }}
              >
                Voltar
              </Button>
            )}
            {showPeriodoSelector && (
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 sm:h-12 text-xs sm:text-sm"
                onClick={() => {
                  setSelectedCronogramaType(null)
                  setShowPeriodoSelector(false)
                }}
              >
                Voltar
              </Button>
            )}
            {(selectedTopicos.length > 0 || selectedSubtopicos.length > 0) && (
              <Button
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-10 sm:h-12 text-xs sm:text-sm"
                onClick={applySelectedTopicos}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Aplicar
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 sm:h-12 text-xs sm:text-sm"
              onClick={() => setShowCronogramaSelector(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmation.open} onOpenChange={(open) => !open && setDeleteConfirmation({ open: false, deckId: '', deckTitle: '' })}>
        <DialogContent className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Deletar deck?</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-white/70">
              Tem certeza que deseja deletar o deck <span className="font-semibold">"{deleteConfirmation.deckTitle}"</span>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="bg-white dark:bg-slate-900 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setDeleteConfirmation({ open: false, deckId: '', deckTitle: '' })}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={confirmDeleteDeck}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {deleting ? 'Deletando...' : 'Deletar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={studyOpen} onOpenChange={setStudyOpen}>
        <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 backdrop-blur-xl text-white border border-white/10 shadow-2xl animate-in fade-in duration-300 flex flex-col p-4 sm:p-6">
          <div className="flex-shrink-0 flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white text-xl sm:text-2xl line-clamp-2">
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 animate-pulse flex-shrink-0" /> 
                  <span className="truncate">{selectedDeck?.title}</span>
                </DialogTitle>
                <DialogDescription className="text-white/70 text-sm sm:text-base line-clamp-2">
                  {selectedDeck?.theme}
                </DialogDescription>
              </DialogHeader>
            </div>
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 h-10 px-3 flex-shrink-0"
              onClick={downloadDeckPDF}
              title="Baixar PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {currentCard ? (
            <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-2">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs sm:text-sm text-white/60">
                  <span>Cartão {currentIndex + 1} / {cards.length}</span>
                  <span>{Math.round((currentIndex + 1) * 100 / cards.length)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${(currentIndex + 1) * 100 / cards.length}%` }}
                  />
                </div>
              </div>
              <div
                className={cn(
                  'rounded-2xl border p-4 sm:p-6 min-h-[200px] sm:min-h-[240px] cursor-pointer transition-all duration-300 flex flex-col justify-center',
                  flipped 
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/50 shadow-lg shadow-blue-500/20' 
                    : 'bg-gradient-to-br from-white/5 to-white/10 border-white/20 shadow-lg shadow-white/10'
                )}
                onClick={() => setFlipped(prev => !prev)}
              >
                <p className="text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">{flipped ? '← RESPOSTA' : 'PERGUNTA →'}</p>
                <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed break-words">
                  {flipped ? currentCard.back : currentCard.front}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
                <Button variant="ghost" className="text-white/80 h-8 px-2" onClick={() => setShowHint(prev => !prev)}>
                  <Feather className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Dica
                </Button>
                <div className="text-white/60 text-center">Clique no card para virar</div>
              </div>

              {showHint && (
                <div className="rounded-2xl border border-orange-400/40 bg-orange-500/10 p-3 text-xs sm:text-sm text-orange-100 break-words">
                  {currentCard.hint}
                </div>
              )}

              {flipped && (
                <div className="space-y-2">
                  <p className="text-white font-semibold text-sm sm:text-base">Objetivos</p>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {currentCard.objectives.map(obj => (
                      <button
                        key={obj.id}
                        onClick={() => toggleObjective(obj.id)}
                        className={cn(
                          'px-2 py-1 rounded-full border text-xs sm:text-sm transition-all',
                          objectivesSelection.includes(obj.id)
                            ? 'border-orange-400 bg-orange-500/20 text-orange-100'
                            : 'border-white/20 text-white/70'
                        )}
                      >
                        {obj.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-white font-semibold text-sm sm:text-base">Impacto?</p>
                <div className="grid grid-cols-3 gap-2">
                  {difficultyLegend.map(option => (
                    <button
                      key={option.value}
                      className={cn(
                        'rounded-xl border p-2 sm:p-3 text-left transition-all duration-300',
                        currentEntry?.difficulty === option.value
                          ? `border-white bg-gradient-to-br ${option.color} shadow-lg`
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      )}
                      onClick={() => handleDifficultyChange(option.value)}
                    >
                      <p className="font-bold text-white text-xs sm:text-sm">{option.label}</p>
                      <p className="text-xs text-white/80 mt-0.5 line-clamp-2">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:opacity-90 h-10 sm:h-12 text-sm sm:text-base flex-shrink-0"
                onClick={goNextCard}
                disabled={sessionSaving}
              >
                {currentIndex === cards.length - 1 ? 'Encerrar' : 'Próximo'}
              </Button>
            </div>
          ) : (
            <div className="flex justify-center items-center flex-1">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="w-[95vw] max-w-2xl h-[85vh] max-h-[85vh] rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 backdrop-blur-xl text-white border border-white/10 shadow-2xl animate-in fade-in duration-300 flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white flex items-center gap-2 text-xl sm:text-2xl">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 flex-shrink-0" /> 
              <span className="truncate">Relatório</span>
            </DialogTitle>
            <DialogDescription className="text-white/70 text-xs sm:text-sm line-clamp-2">
              {sessionResult.length === 0 
                ? 'Parabéns! Você dominou todos os objetivos.' 
                : 'Objetivos que exigiram repetição.'}
            </DialogDescription>
          </DialogHeader>
          
          {sessionResult.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-4">
              <div className="text-5xl sm:text-6xl">🎉</div>
              <p className="text-white/70 text-center text-sm sm:text-base">Nenhum objetivo crítico!</p>
              <p className="text-white/50 text-xs sm:text-sm text-center">Você está indo muito bem!</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-2">
              {sessionResult.map((objective, idx) => (
                <div 
                  key={objective} 
                  className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-orange-500/10 p-3 sm:p-4 hover:border-red-500/50 transition-all"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-sm sm:text-lg font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm sm:text-base break-words">{objective}</p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1">Criar novo deck focado</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex-shrink-0 flex gap-2 mt-4">
            {sessionResult.length > 0 && (
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-10 sm:h-12 text-xs sm:text-sm"
                onClick={() => {
                  setNotes(`Foque nos seguintes objetivos: ${sessionResult.join(', ')}`)
                  setReportOpen(false)
                  setShowCreationForm(true)
                }}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Criar Deck</span>
                <span className="sm:hidden">Criar</span>
              </Button>
            )}
            <Button 
              className="flex-1 bg-white/20 hover:bg-white/30 text-white h-10 sm:h-12 text-xs sm:text-sm" 
              onClick={() => setReportOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ToastAlert open={toast.open} onOpenChange={open => setToast(prev => ({ ...prev, open }))} message={toast.message} type={toast.type} />
    </div>
  )
}
