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
import { PageLoading } from '@/components/page-loading'
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
import { TopicItem, MedicinaAFYAPeriodo, PsicologiaAFYAPeriodo, BiomedicinaAFYAPeriodo, OdontologiaAFYAPeriodo, TEMPLATES } from '@/lib/cronograma-types'
import { getMedicinaAFYATopicos } from '@/lib/medicina-afya-periodos-helper'
import { getPsicologiaAFYATopicos } from '@/lib/psicologia-afya-periodos-helper'
import { getBiomedicinaAFYATopicos } from '@/lib/biomedicina-afya-periodos-helper'
import { getOdontologiaAFYATopicos } from '@/lib/odontologia-afya-periodos-helper'
import { AppShell as LayoutShell } from '@/components/app-shell'
import { FocusSessionButton } from '@/components/focus-session-button'
import { NotificationsBell } from '@/components/notifications-bell'

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
    daily: 5,
    active: '10 decks ativos',
    cards: 5,
    summary: 'Modo sobrevivência: 5 decks no total da conta, 5 cartões cada. Gestão cirúrgica.',
  },
  trial: {
    daily: 10,
    active: '10 decks ativos',
    cards: 10,
    summary: 'Test drive com nitro: 10 decks por dia, 10 cartões cada, 10 decks ativos.',
  },
  essential: {
    daily: 15,
    active: '15 decks ativos',
    cards: 15,
    summary: 'Plano essencial: 15 decks por dia, 15 cartões cada, 15 decks ativos.',
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
  const [selectedCronogramaType, setSelectedCronogramaType] = useState<'enem' | 'medicina-afya' | 'psicologia-afya' | 'biomedicina-afya' | 'odontologia-afya' | 'uerj' | null>(null)
  const [selectedMedicinaAFYAPeriodo, setSelectedMedicinaAFYAPeriodo] = useState<MedicinaAFYAPeriodo>(1)
  const [selectedPsicologiaAFYAPeriodo, setSelectedPsicologiaAFYAPeriodo] = useState<PsicologiaAFYAPeriodo>(1)
  const [selectedBiomedicinaAFYAPeriodo, setSelectedBiomedicinaAFYAPeriodo] = useState<BiomedicinaAFYAPeriodo>(1)
  const [selectedOdontologiaAFYAPeriodo, setSelectedOdontologiaAFYAPeriodo] = useState<OdontologiaAFYAPeriodo>(1)
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

  function handleCronogramaTypeSelect(type: 'enem' | 'medicina-afya' | 'psicologia-afya' | 'biomedicina-afya' | 'odontologia-afya' | 'uerj') {
    setSelectedCronogramaType(type as any)
    if (type === 'medicina-afya' || type === 'psicologia-afya' || type === 'biomedicina-afya' || type === 'odontologia-afya') {
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

  function handlePsicologiaAFYAPeriodoChange(periodo: PsicologiaAFYAPeriodo) {
    setSelectedPsicologiaAFYAPeriodo(periodo)
    const topicos = getPsicologiaAFYATopicos(periodo)
    setCronogramaTopicos(topicos)
    setShowPeriodoSelector(false)
  }

  function handleBiomedicinaAFYAPeriodoChange(periodo: BiomedicinaAFYAPeriodo) {
    setSelectedBiomedicinaAFYAPeriodo(periodo)
    const topicos = getBiomedicinaAFYATopicos(periodo)
    setCronogramaTopicos(topicos)
    setShowPeriodoSelector(false)
  }

  function handleOdontologiaAFYAPeriodoChange(periodo: OdontologiaAFYAPeriodo) {
    setSelectedOdontologiaAFYAPeriodo(periodo)
    const topicos = getOdontologiaAFYATopicos(periodo)
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

    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) {
      alert('Por favor, desabilite o bloqueador de pop-ups')
      return
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${selectedDeck.title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              background: #f5f5f5;
              padding: 40px 20px;
            }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #468152; padding-bottom: 20px; }
            .header h1 { color: #333; font-size: 28px; margin-bottom: 10px; }
            .header p { color: #666; font-size: 14px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-box { background: linear-gradient(135deg, #468152 0%, #5a9a63 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-box .label { font-size: 12px; opacity: 0.9; margin-bottom: 5px; }
            .stat-box .value { font-size: 24px; font-weight: bold; }
            .cards-container { display: grid; grid-template-columns: 1fr; gap: 20px; }
            .card { 
              background: linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%);
              border: 2px solid #468152;
              border-radius: 8px;
              padding: 20px;
              page-break-inside: avoid;
            }
            .card-number { 
              color: #468152; 
              font-weight: 600; 
              font-size: 12px; 
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            .card-question { 
              background: white;
              border-left: 4px solid #468152;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 4px;
              font-weight: 600;
              color: #333;
              font-size: 14px;
              line-height: 1.5;
            }
            .card-answer { 
              background: #e8f5e9;
              border-left: 4px solid #2e7d32;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 4px;
              color: #1b5e20;
              font-size: 13px;
              line-height: 1.5;
            }
            .card-objectives { 
              background: #fff3e0;
              border-left: 4px solid #e65100;
              padding: 12px;
              margin-bottom: 10px;
              border-radius: 4px;
              font-size: 12px;
              color: #e65100;
              line-height: 1.4;
            }
            .card-hint { 
              background: #f3e5f5;
              border-left: 4px solid #7b1fa2;
              padding: 12px;
              border-radius: 4px;
              font-size: 12px;
              color: #4a148c;
              font-style: italic;
              line-height: 1.4;
            }
            .card-label { 
              font-weight: 600; 
              font-size: 11px; 
              text-transform: uppercase; 
              margin-bottom: 5px;
              opacity: 0.8;
            }
            @media print {
              body { padding: 0; background: white; }
              .container { box-shadow: none; padding: 20px; }
              .card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${selectedDeck.title}</h1>
              <p>Tema: ${selectedDeck.theme}</p>
            </div>
            
            <div class="stats">
              <div class="stat-box">
                <div class="label">Total de Cartões</div>
                <div class="value">${cards.length}</div>
              </div>
              <div class="stat-box">
                <div class="label">Tema</div>
                <div class="value">${selectedDeck.theme.substring(0, 15)}...</div>
              </div>
              <div class="stat-box">
                <div class="label">Data de Geração</div>
                <div class="value">${new Date().toLocaleDateString('pt-BR')}</div>
              </div>
            </div>

            <div class="cards-container">
              ${cards.map((card, index) => `
                <div class="card">
                  <div class="card-number">Cartão ${index + 1} de ${cards.length}</div>
                  
                  <div class="card-label">Pergunta</div>
                  <div class="card-question">${card.front}</div>
                  
                  <div class="card-label">Resposta</div>
                  <div class="card-answer">${card.back}</div>
                  
                  ${card.objectives && card.objectives.length > 0 ? `
                    <div class="card-label">Objetivos</div>
                    <div class="card-objectives">
                      ${card.objectives.map(o => `• ${o.text}`).join('<br>')}
                    </div>
                  ` : ''}
                  
                  ${card.hint ? `
                    <div class="card-label">Dica</div>
                    <div class="card-hint">${card.hint}</div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)
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
    return 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_50%),_linear-gradient(135deg,_#020617,_#0f172a,_#020617)] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_50%),_linear-gradient(135deg,_#020617,_#0f172a,_#020617)] bg-white dark:bg-slate-950'
  }, [])

  return (
    <LayoutShell showHeader={false}>
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
                <FocusSessionButton />
                <NotificationsBell />
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
                  Enquanto os outros repetem como papagaio, tu martela com nossos flashcards até a matéria virar reflexo.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 p-4">
                    <p className="text-sm text-slate-600 dark:text-white/70">
                      {accountType === 'gratuito' ? 'Decks totais' : 'Decks hoje'}
                    </p>
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
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
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
                            className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white h-10"
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


          {/* Meus Decks Section */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5" /> Meus Decks
            </h2>

            {loadingDecks ? (
              <PageLoading variant="minimal" message="Carregando seus decks..." />
            ) : decks.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck) => (
                  <div
                    key={deck._id}
                    className="group relative rounded-3xl border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 p-5 transition-all hover:shadow-lg hover:border-emerald-500/50 dark:hover:border-emerald-500/50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1 cursor-pointer flex-1" onClick={() => openDeck(deck)}>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {deck.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/60">
                          <span className="line-clamp-1">{deck.theme}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteConfirmation(deck._id, deck.title)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        className="flex-1 bg-white hover:bg-emerald-500 hover:text-white dark:bg-white/10 dark:hover:bg-emerald-600 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 transition-all h-9 text-sm shadow-sm"
                        onClick={() => openDeck(deck)}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Estudar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-3xl bg-slate-50/50 dark:bg-white/5">
                <Layers className="h-12 w-12 mx-auto text-slate-300 dark:text-white/20 mb-3" />
                <p className="text-slate-500 dark:text-white/50">Você ainda não criou nenhum deck.</p>
                <Button
                  variant="link"
                  className="text-emerald-600 dark:text-emerald-400"
                  onClick={() => setShowCreationForm(true)}
                >
                  Criar meu primeiro deck
                </Button>
              </div>
            )}
          </div>

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
          <div className="mb-20"></div> {/* Espaço extra no final */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
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
                    onClick={() => handleCronogramaTypeSelect('psicologia-afya')}
                    className="p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center"
                  >
                    <p className="font-semibold text-white text-sm sm:text-base">Psicologia AFYA</p>
                    <p className="text-xs text-white/70 mt-1">Psicologia</p>
                  </button>
                  <button
                    onClick={() => handleCronogramaTypeSelect('biomedicina-afya')}
                    className="p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center"
                  >
                    <p className="font-semibold text-white text-sm sm:text-base">Biomedicina AFYA</p>
                    <p className="text-xs text-white/70 mt-1">Biomedicina</p>
                  </button>
                  <button
                    onClick={() => handleCronogramaTypeSelect('odontologia-afya')}
                    className="p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center"
                  >
                    <p className="font-semibold text-white text-sm sm:text-base">Odontologia AFYA</p>
                    <p className="text-xs text-white/70 mt-1">Odontologia</p>
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
                    {(selectedCronogramaType === 'psicologia-afya' || selectedCronogramaType === 'odontologia-afya'
                      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                      : selectedCronogramaType === 'biomedicina-afya'
                      ? [1, 2, 3, 4, 5, 6, 7]
                      : [1, 2, 3, 4, 5]
                    ).map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          if (selectedCronogramaType === 'psicologia-afya') {
                            handlePsicologiaAFYAPeriodoChange(p as PsicologiaAFYAPeriodo)
                          } else if (selectedCronogramaType === 'biomedicina-afya') {
                            handleBiomedicinaAFYAPeriodoChange(p as BiomedicinaAFYAPeriodo)
                          } else if (selectedCronogramaType === 'odontologia-afya') {
                            handleOdontologiaAFYAPeriodoChange(p as OdontologiaAFYAPeriodo)
                          } else {
                            handleMedicinaAFYAPeriodoChange(p as MedicinaAFYAPeriodo)
                          }
                        }}
                        className={cn(
                          'p-3 rounded-xl border-2 transition-all font-semibold text-sm',
                          (selectedCronogramaType === 'psicologia-afya'
                            ? selectedPsicologiaAFYAPeriodo === p
                            : selectedCronogramaType === 'biomedicina-afya'
                            ? selectedBiomedicinaAFYAPeriodo === p
                            : selectedCronogramaType === 'odontologia-afya'
                            ? selectedOdontologiaAFYAPeriodo === p
                            : selectedMedicinaAFYAPeriodo === p)
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
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-10 sm:h-12 text-xs sm:text-sm"
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
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                      style={{ width: `${(currentIndex + 1) * 100 / cards.length}%` }}
                    />
                  </div>
                </div>
                <div
                  className={cn(
                    'rounded-2xl border p-4 sm:p-6 min-h-[200px] sm:min-h-[240px] cursor-pointer transition-all duration-300 flex flex-col justify-center',
                    flipped
                      ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/50 shadow-lg shadow-emerald-500/20'
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
                <PageLoading variant="minimal" background="transparent" />
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
      </div >
    </LayoutShell>
  )
}
