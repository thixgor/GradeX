'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Gamepad2,
    Puzzle,
    Target,
    AlertTriangle,
    Plus,
    Trash2,
    Edit,
    Save,
    X,
    ChevronRight,
    BookOpen,
    Zap,
    Eye,
    MoreHorizontal,
    Sparkles,
    Database,
    HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToastAlert } from '@/components/ui/toast-alert'
import { AppShell as LayoutShell } from '@/components/app-shell'
import { cn } from '@/lib/utils'

type GameType = 'crossword' | 'hangman' | 'error-hunt'

interface GameConfig {
    id: GameType
    title: string
    icon: React.ReactNode
    color: string
    bgColor: string
    description: string
}

const GAME_CONFIGS: GameConfig[] = [
    {
        id: 'crossword',
        title: 'Palavras Cruzadas',
        icon: <Puzzle className="h-5 w-5" />,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
        description: 'Gerenciar tópicos e puzzles',
    },
    {
        id: 'hangman',
        title: 'Forca Médica',
        icon: <Target className="h-5 w-5" />,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-500/20',
        description: 'Gerenciar temas e palavras',
    },
    {
        id: 'error-hunt',
        title: 'Caça aos Erros',
        icon: <AlertTriangle className="h-5 w-5" />,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-500/20',
        description: 'Gerenciar questões e correções',
    },
]

function LiquidGlassPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            'rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900/50 shadow-lg',
            className
        )}>
            {children}
        </div>
    )
}

// ====================
// CROSSWORD MANAGEMENT
// ====================
// Note: Manual creation of Crosswords content is complex via UI. We encourage Import.
// But we can allow deleting and basic topic management.

interface CrosswordTopic { _id: string, name: string, module?: string, description?: string, puzzleCount: number }
interface CrosswordPuzzle { _id: string, title: string, description?: string, width: number, height: number, words: any[], difficulty: string }

function CrosswordManager() {
    const [topics, setTopics] = useState<CrosswordTopic[]>([])
    const [selectedTopic, setSelectedTopic] = useState<CrosswordTopic | null>(null)
    const [puzzles, setPuzzles] = useState<CrosswordPuzzle[]>([])
    const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })

    useEffect(() => {
        fetch('/api/admin/games/crossword/topics').then(res => res.json()).then(d => setTopics(d.topics || []))
    }, [])

    useEffect(() => {
        if (selectedTopic) fetch(`/api/admin/games/crossword/topics/${selectedTopic._id}/puzzles`).then(res => res.json()).then(d => setPuzzles(d.puzzles || []))
    }, [selectedTopic])

    async function handleDeletePuzzle(id: string) {
        if (!confirm('Apagar puzzle?')) return
        await fetch(`/api/admin/games/crossword/puzzles/${id}`, { method: 'DELETE' })
        setPuzzles(puzzles.filter(p => p._id !== id))
        setToast({ open: true, message: 'Removido', type: 'success' })
    }

    if (selectedTopic) {
        return (
            <div className="space-y-6">
                <ToastAlert open={toast.open} onOpenChange={() => setToast({ ...toast, open: false })} message={toast.message} type={toast.type} />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => setSelectedTopic(null)}> <ArrowLeft className="h-4 w-4 mr-2" /> Voltar </Button>
                        <div><h2 className="text-xl font-bold">{selectedTopic.name}</h2><p className="text-sm text-slate-500">Módulo: {selectedTopic.module}</p></div>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {puzzles.map(puzzle => (
                        <LiquidGlassPanel key={puzzle._id} className="p-4 relative">
                            <div className="absolute top-2 right-2"><Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeletePuzzle(puzzle._id)}><Trash2 className="h-3 w-3" /></Button></div>
                            <h3 className="font-bold">{puzzle.title}</h3>
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">{puzzle.difficulty}</span>
                            <div className="mt-2 text-slate-500 text-xs">{puzzle.width}x{puzzle.height} • {puzzle.words?.length} palavras</div>
                        </LiquidGlassPanel>
                    ))}
                    {puzzles.length === 0 && <div className="col-span-full text-center text-slate-500 py-10">Nenhum puzzle neste tópico. Use a Importação para criar puzzles.</div>}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Tópicos de Palavras Cruzadas</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map(t => (
                    <LiquidGlassPanel key={t._id} className="p-4 cursor-pointer hover:border-emerald-500 transition-all">
                        <div onClick={() => setSelectedTopic(t)}>
                            <h3 className="font-bold">{t.name}</h3>
                            <p className="text-sm text-slate-500">{t.module || 'Geral'}</p>
                            <p className="text-xs text-slate-400 mt-2">{t.puzzleCount} puzzles</p>
                        </div>
                    </LiquidGlassPanel>
                ))}
            </div>
        </div>
    )
}

// ====================
// HANGMAN MANAGEMENT
// ====================

interface HangmanTopic { _id: string, name: string, module?: string, wordCount: number }
interface HangmanWord { _id: string, word: string, theme: string, description: string, hint: string, explanation: string, difficulty: string }

function HangmanManager() {
    const [topics, setTopics] = useState<HangmanTopic[]>([])
    const [selectedTopic, setSelectedTopic] = useState<HangmanTopic | null>(null)
    const [words, setWords] = useState<HangmanWord[]>([])
    const [editing, setEditing] = useState<HangmanWord | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newWordData, setNewWordData] = useState<Partial<HangmanWord>>({})
    const [toast, setToast] = useState<any>({ open: false })

    useEffect(() => { fetch('/api/admin/games/hangman/topics').then(r => r.json()).then(d => setTopics(d.topics || [])) }, [])
    useEffect(() => { if (selectedTopic) fetch(`/api/admin/games/hangman/topics/${selectedTopic._id}/words`).then(r => r.json()).then(d => setWords(d.words || [])) }, [selectedTopic])

    async function handleSave(word: Partial<HangmanWord>) {
        if (!selectedTopic) return
        const isNew = !word._id
        const url = isNew ? `/api/admin/games/hangman/topics/${selectedTopic._id}/words` : `/api/admin/games/hangman/words/${word._id}`
        const method = isNew ? 'POST' : 'PUT'

        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...word, theme: selectedTopic.name, module: selectedTopic.module }) })

        // Refresh
        const res = await fetch(`/api/admin/games/hangman/topics/${selectedTopic._id}/words`)
        const data = await res.json()
        setWords(data.words || [])
        setEditing(null); setIsCreating(false)
        setToast({ open: true, message: 'Salvo com sucesso!', type: 'success' })
    }

    async function handleDelete(id: string) {
        if (!confirm('Apagar palavra?')) return
        await fetch(`/api/admin/games/hangman/words/${id}`, { method: 'DELETE' })
        setWords(words.filter(w => w._id !== id))
    }

    if (selectedTopic) {
        return (
            <div className="space-y-6">
                <ToastAlert open={toast.open} onOpenChange={() => setToast({ ...toast, open: false })} message={toast.message} type={toast.type} />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => setSelectedTopic(null)}> <ArrowLeft className="h-4 w-4 mr-2" /> Voltar </Button>
                        <div><h2 className="text-xl font-bold">{selectedTopic.name}</h2><p className="text-sm text-slate-500">Módulo: {selectedTopic.module}</p></div>
                    </div>
                    <Button onClick={() => { setIsCreating(true); setNewWordData({ difficulty: 'medio' }) }}> <Plus className="h-4 w-4 mr-2" /> Nova Palavra </Button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {words.map(w => (
                        <LiquidGlassPanel key={w._id} className="p-4 relative group">
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded">
                                <Button variant="ghost" size="icon" onClick={() => setEditing(w)}><Edit className="h-3 w-3 text-blue-500" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(w._id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                            </div>
                            <h3 className="font-mono text-lg font-bold text-blue-600">{w.word}</h3>
                            <p className="text-sm">{w.description}</p>
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded mt-2 inline-block">{w.difficulty}</span>
                        </LiquidGlassPanel>
                    ))}
                </div>

                <Dialog open={!!editing || isCreating} onOpenChange={(o) => { if (!o) { setEditing(null); setIsCreating(false) } }}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{isCreating ? 'Nova Palavra' : 'Editar Palavra'}</DialogTitle></DialogHeader>
                        {(() => {
                            const target = isCreating ? newWordData : editing
                            const setTarget = (data: Partial<HangmanWord>) => {
                                if (isCreating) {
                                    setNewWordData(data)
                                } else {
                                    setEditing(data as HangmanWord)
                                }
                            }
                            if (!target) return null
                            return (
                                <div className="space-y-3 py-2">
                                    <Input placeholder="Palavra" value={target.word || ''} onChange={e => setTarget({ ...target, word: e.target.value.toUpperCase() })} />
                                    <Input placeholder="Descrição" value={target.description || ''} onChange={e => setTarget({ ...target, description: e.target.value })} />
                                    <Input placeholder="Dica" value={target.hint || ''} onChange={e => setTarget({ ...target, hint: e.target.value })} />
                                    <Input placeholder="Explicação" value={target.explanation || ''} onChange={e => setTarget({ ...target, explanation: e.target.value })} />
                                    <select className="w-full p-2 border rounded" value={target.difficulty} onChange={e => setTarget({ ...target, difficulty: e.target.value })}>
                                        <option value="facil">Fácil</option><option value="medio">Médio</option><option value="dificil">Difícil</option>
                                    </select>
                                </div>
                            )
                        })()}
                        <DialogFooter><Button onClick={() => handleSave((isCreating ? newWordData : editing) as any)}>Salvar</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Temas da Forca</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map(t => (
                    <LiquidGlassPanel key={t._id} className="p-4 cursor-pointer hover:border-blue-500 transition-all">
                        <div onClick={() => setSelectedTopic(t)}>
                            <h3 className="font-bold">{t.name}</h3>
                            <p className="text-sm text-slate-500">{t.module || 'Geral'}</p>
                            <p className="text-xs text-slate-400 mt-2">{t.wordCount} palavras</p>
                        </div>
                    </LiquidGlassPanel>
                ))}
            </div>
        </div>
    )
}

// ====================
// ERROR HUNT MANAGEMENT
// ====================

interface ErrorTopic { _id: string, name: string, module?: string, questionCount: number }
interface ErrorQuestion { _id: string, statement: string, correctAnswer: string, explanation: string, topic: string, difficulty: string, hint?: string, examTip?: string, keywords?: string[] }

function ErrorHuntManager() {
    const [topics, setTopics] = useState<ErrorTopic[]>([])
    const [selectedTopic, setSelectedTopic] = useState<ErrorTopic | null>(null)
    const [questions, setQuestions] = useState<ErrorQuestion[]>([])
    const [editing, setEditing] = useState<ErrorQuestion | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newData, setNewData] = useState<Partial<ErrorQuestion>>({})
    const [toast, setToast] = useState<any>({ open: false })

    useEffect(() => { fetch('/api/admin/games/error-hunt/topics').then(r => r.json()).then(d => setTopics(d.topics || [])) }, [])
    useEffect(() => { if (selectedTopic) fetch(`/api/admin/games/error-hunt/topics/${selectedTopic._id}/questions`).then(r => r.json()).then(d => setQuestions(d.questions || [])) }, [selectedTopic])

    async function handleSave(q: Partial<ErrorQuestion>) {
        if (!selectedTopic) return
        const isNew = !q._id
        const url = isNew ? `/api/admin/games/error-hunt/questions` : `/api/admin/games/error-hunt/questions/${q._id}`
        const method = isNew ? 'POST' : 'PUT'

        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...q, topic: selectedTopic.name, module: selectedTopic.module, topicId: selectedTopic._id }) })

        const res = await fetch(`/api/admin/games/error-hunt/topics/${selectedTopic._id}/questions`)
        const data = await res.json()
        setQuestions(data.questions || [])
        setEditing(null); setIsCreating(false)
        setToast({ open: true, message: 'Salvo!', type: 'success' })
    }

    async function handleDelete(id: string) {
        if (!confirm('Apagar questão?')) return
        await fetch(`/api/admin/games/error-hunt/questions/${id}`, { method: 'DELETE' })
        setQuestions(questions.filter(q => q._id !== id))
    }

    if (selectedTopic) {
        return (
            <div className="space-y-6">
                <ToastAlert open={toast.open} onOpenChange={() => setToast({ ...toast, open: false })} message={toast.message} type={toast.type} />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => setSelectedTopic(null)}> <ArrowLeft className="h-4 w-4 mr-2" /> Voltar </Button>
                        <div><h2 className="text-xl font-bold">{selectedTopic.name}</h2><p className="text-sm text-slate-500">Módulo: {selectedTopic.module}</p></div>
                    </div>
                    <Button onClick={() => { setIsCreating(true); setNewData({ difficulty: 'medio', type: 'correction' } as any) }}> <Plus className="h-4 w-4 mr-2" /> Nova Questão </Button>
                </div>

                <div className="space-y-4">
                    {questions.map(q => (
                        <LiquidGlassPanel key={q._id} className="p-4 relative group">
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded">
                                <Button variant="ghost" size="icon" onClick={() => setEditing(q)}><Edit className="h-3 w-3 text-orange-500" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(q._id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                            </div>
                            <p className="font-serif text-lg">"{q.statement}"</p>
                            <div className="grid md:grid-cols-2 gap-4 mt-2 text-sm text-slate-600">
                                <div><strong className="text-emerald-600">Correto:</strong> {q.correctAnswer}</div>
                                <div><strong>Explicação:</strong> {q.explanation}</div>
                            </div>
                        </LiquidGlassPanel>
                    ))}
                </div>

                <Dialog open={!!editing || isCreating} onOpenChange={(o) => { if (!o) { setEditing(null); setIsCreating(false) } }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>{isCreating ? 'Nova Questão' : 'Editar Questão'}</DialogTitle></DialogHeader>
                        {(() => {
                            const target = isCreating ? newData : editing
                            const setTarget = (data: Partial<ErrorQuestion>) => {
                                if (isCreating) {
                                    setNewData(data)
                                } else {
                                    setEditing(data as ErrorQuestion)
                                }
                            }
                            if (!target) return null
                            return (
                                <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-2">
                                    <label className="text-xs font-bold">Frase com Erro</label>
                                    <Input value={target.statement || ''} onChange={e => setTarget({ ...target, statement: e.target.value })} />
                                    <label className="text-xs font-bold">Correção</label>
                                    <Input value={target.correctAnswer || ''} onChange={e => setTarget({ ...target, correctAnswer: e.target.value })} />
                                    <label className="text-xs font-bold">Explicação</label>
                                    <Input value={target.explanation || ''} onChange={e => setTarget({ ...target, explanation: e.target.value })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold">Dica</label><Input value={target.hint || ''} onChange={e => setTarget({ ...target, hint: e.target.value })} /></div>
                                        <div><label className="text-xs font-bold">Dica de Prova</label><Input value={target.examTip || ''} onChange={e => setTarget({ ...target, examTip: e.target.value })} /></div>
                                    </div>
                                    <label className="text-xs font-bold">Palavras-chave (separar por ;)</label>
                                    <Input value={target.keywords?.join(';') || ''} onChange={e => setTarget({ ...target, keywords: e.target.value.split(';') })} />
                                </div>
                            )
                        })()}
                        <DialogFooter><Button onClick={() => handleSave((isCreating ? newData : editing) as any)}>Salvar</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Tópicos de Caça aos Erros</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map(t => (
                    <LiquidGlassPanel key={t._id} className="p-4 cursor-pointer hover:border-orange-500 transition-all">
                        <div onClick={() => setSelectedTopic(t)}>
                            <h3 className="font-bold">{t.name}</h3>
                            <p className="text-sm text-slate-500">{t.module || 'Geral'}</p>
                            <p className="text-xs text-slate-400 mt-2">{t.questionCount} questões</p>
                        </div>
                    </LiquidGlassPanel>
                ))}
            </div>
        </div>
    )
}

// ====================
// MAIN PAGE
// ====================

export default function AdminGamesPage() {
    const router = useRouter()
    const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
    const [showImport, setShowImport] = useState(false)
    const [importText, setImportText] = useState('')
    const [importLoading, setImportLoading] = useState(false)
    const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })

    async function handleImport() {
        if (!importText.trim()) return
        setImportLoading(true)
        try {
            const res = await fetch('/api/admin/games/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: importText }),
            })
            const data = await res.json()
            if (res.ok) {
                setToast({ open: true, message: `Importação concluída! ${data.summary}`, type: 'success' })
                setShowImport(false)
                setImportText('')
                // Force reload of current view by briefly resetting
                if (selectedGame) {
                    const g = selectedGame; setSelectedGame(null); setTimeout(() => setSelectedGame(g), 10)
                }
            } else {
                setToast({ open: true, message: `Erro: ${data.error}`, type: 'error' })
            }
        } catch (error) {
            setToast({ open: true, message: 'Erro ao conectar com servidor', type: 'error' })
        } finally {
            setImportLoading(false)
        }
    }

    const EXAMPLE_TEXT = `[PALAVRAS-CRUZADAS]
Módulo: Cardiologia
Tópico: Anatomia Cardíaca
Dificuldade: Medio
Palavras: AORTA; VENTRICULO; ATRIO; MITRAL
Dica: Estruturas do coração
Dica-AORTA: Maior artéria do corpo

[FORCA-MÉDICA]
Módulo: Farmacologia
Tópico: Antibióticos
Tema: Classes de Antibióticos
Resposta: PENICILINA
Dica: Descoberta por Fleming
Descrição: Antibiótico beta-lactâmico
Dificuldade: Facil

[CAÇA AOS ERROS]
Módulo: Fisiologia
Tópico: Sistema Respiratório
Frase: O pulmão esquerdo possui três lobos e o direito possui dois.
Frase-corrigida: O pulmão direito possui três lobos e o esquerdo dois.
Palavras-chave: esquerdo; dois; direito; três
Explicação: O espaço do coração reduz o pulmão esquerdo.
Dica-de-Prova: Memorize a anatomia lobar.
Dica: Lembre-se do coração.
Dificuldade: Facil`

    return (
        <LayoutShell showHeader={false}>
            <ToastAlert open={toast.open} onOpenChange={() => setToast({ ...toast, open: false })} message={toast.message} type={toast.type} />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
                <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => selectedGame ? setSelectedGame(null) : router.push('/admin')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-2">
                                <Gamepad2 className="h-5 w-5 text-emerald-500" />
                                <h1 className="text-lg font-bold">{selectedGame ? GAME_CONFIGS.find(g => g.id === selectedGame)?.title : 'Gestão de Games'}</h1>
                            </div>
                        </div>
                        <Button onClick={() => setShowImport(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Database className="h-4 w-4 mr-2" /> Importar em Massa
                        </Button>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-6">
                    {selectedGame ? (
                        <>
                            {selectedGame === 'crossword' && <CrosswordManager />}
                            {selectedGame === 'hangman' && <HangmanManager />}
                            {selectedGame === 'error-hunt' && <ErrorHuntManager />}
                        </>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                            {GAME_CONFIGS.map((game) => (
                                <LiquidGlassPanel key={game.id} className="p-6 cursor-pointer hover:scale-[1.02] transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500">
                                    <div className="flex items-start gap-4" onClick={() => setSelectedGame(game.id)}>
                                        <div className={cn('p-3 rounded-xl', game.bgColor, game.color)}>{game.icon}</div>
                                        <div className="flex-1">
                                            <h3 className="font-bold mb-1 group-hover:text-emerald-600 text-lg">{game.title}</h3>
                                            <p className="text-sm text-slate-500">{game.description}</p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 mt-2" />
                                    </div>
                                </LiquidGlassPanel>
                            ))}
                        </div>
                    )}
                </div>

                <Dialog open={showImport} onOpenChange={setShowImport}>
                    <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
                        <div className="p-6 border-b bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                            <div>
                                <DialogTitle className="text-xl">Importação Inteligente</DialogTitle>
                                <DialogDescription>Crie conteúdo para múltiplos jogos de uma vez via texto.</DialogDescription>
                            </div>
                        </div>

                        <Tabs defaultValue="editor" className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 pt-2">
                                <TabsList>
                                    <TabsTrigger value="editor">Editor de Texto</TabsTrigger>
                                    <TabsTrigger value="examples">Exemplos e Ajuda</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="editor" className="flex-1 p-6 h-full overflow-hidden flex flex-col">
                                <textarea
                                    className="flex-1 w-full p-4 border rounded-lg font-mono text-sm bg-slate-50 dark:bg-slate-950 resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    placeholder="Cole aqui seu conteúdo formatado..."
                                    value={importText}
                                    onChange={e => setImportText(e.target.value)}
                                />
                            </TabsContent>

                            <TabsContent value="examples" className="flex-1 p-6 overflow-y-auto">
                                <div className="space-y-6">
                                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Como funciona</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            O sistema lê blocos de texto separados por colchetes como <code>[NOME-DO-JOGO]</code>.
                                            Cada linha dentro do bloco deve ser <code>Chave: Valor</code>.
                                        </p>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-bold text-sm mb-2">Exemplo Completo</h4>
                                            <pre className="text-xs bg-slate-900 text-slate-200 p-3 rounded overflow-x-auto border border-slate-700">
                                                {EXAMPLE_TEXT}
                                            </pre>
                                        </div>
                                        <div className="text-sm space-y-2">
                                            <h4 className="font-bold">Campos suportados</h4>
                                            <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                                                <li><strong>Módulo / Tópico</strong>: Obrigatórios para organização.</li>
                                                <li><strong>Dificuldade</strong>: Facil, Medio, Dificil.</li>
                                                <li><strong>[PALAVRAS-CRUZADAS]</strong>: Use <code>Palavras: A;B;C</code> separadas por ponto e vírgula. O sistema monta o grid automaticamente.</li>
                                                <li><strong>[FORCA-MÉDICA]</strong>: Exige <code>Resposta</code>.</li>
                                                <li><strong>[CAÇA AOS ERROS]</strong>: Exige <code>Frase</code> (incorreta) e <code>Resposta</code> (correção).</li>
                                            </ul>
                                            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setImportText(EXAMPLE_TEXT); }}>
                                                Copiar Exemplo para Editor
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="p-6 border-t bg-slate-50 dark:bg-slate-900">
                            <div className="flex justify-between w-full items-center">
                                <span className="text-xs text-slate-500">O conteúdo será validado e inserido no banco de dados.</span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => setShowImport(false)}>Cancelar</Button>
                                    <Button onClick={handleImport} disabled={importLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
                                        {importLoading ? 'Processando...' : 'Importar Conteúdo'}
                                    </Button>
                                </div>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </LayoutShell>
    )
}
