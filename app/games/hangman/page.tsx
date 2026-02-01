'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Target,
    Heart,
    RefreshCw,
    Trophy,
    Timer,
    Lightbulb,
    ChevronRight,
    BookOpen,
    Sparkles,
    Skull,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { AppShell as LayoutShell } from '@/components/app-shell'
import { cn } from '@/lib/utils'

interface HangmanWord {
    _id: string
    word: string
    theme: string
    description?: string
    hint?: string
    explanation?: string
    difficulty: 'facil' | 'medio' | 'dificil'
}

interface Topic {
    _id: string
    name: string
    description?: string
    wordCount: number
}

function LiquidGlassPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            'rounded-3xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 backdrop-blur-xl shadow-lg',
            className
        )}>
            {children}
        </div>
    )
}

const DEMO_WORDS: HangmanWord[] = [
    { _id: 'demo-1', word: 'ESTETOSCOPIO', theme: 'Equipamentos', description: 'Instrumento para ausculta', hint: 'Usado para ouvir sons internos', explanation: 'Instrumento médico acústico para auscultar sons internos do corpo.', difficulty: 'facil' },
    { _id: 'demo-2', word: 'CARDIOMEGALIA', theme: 'Patologias', description: 'Aumento do coração', hint: 'Cardio = coração', explanation: 'Aumento anormal do tamanho do coração.', difficulty: 'medio' },
    { _id: 'demo-3', word: 'HEMOGLOBINA', theme: 'Bioquímica', description: 'Proteína do sangue', hint: 'Transporta oxigênio', explanation: 'Proteína nas hemácias responsável pelo transporte de O2.', difficulty: 'facil' },
]

function AnatomicalHangman({ errors }: { errors: number }) {
    return (
        <div className="relative w-full max-w-[280px] mx-auto h-[300px]">
            <svg viewBox="0 0 200 250" className="w-full h-full">
                <g className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="3" fill="none">
                    <line x1="20" y1="230" x2="100" y2="230" />
                    <line x1="60" y1="230" x2="60" y2="20" />
                    <line x1="60" y1="20" x2="140" y2="20" />
                    <line x1="140" y1="20" x2="140" y2="50" />
                </g>
                <g className={cn('transition-opacity duration-500', errors >= 1 ? 'opacity-100' : 'opacity-0')}>
                    <circle cx="140" cy="70" r="20" className="fill-slate-200 dark:fill-slate-700 stroke-slate-400" strokeWidth="2" />
                </g>
                <line x1="140" y1="90" x2="140" y2="150" className={cn('stroke-slate-400', errors >= 2 ? 'opacity-100' : 'opacity-0')} strokeWidth="3" />
                <line x1="140" y1="100" x2="110" y2="130" className={cn('stroke-slate-400', errors >= 3 ? 'opacity-100' : 'opacity-0')} strokeWidth="3" />
                <line x1="140" y1="100" x2="170" y2="130" className={cn('stroke-slate-400', errors >= 4 ? 'opacity-100' : 'opacity-0')} strokeWidth="3" />
                <line x1="140" y1="150" x2="115" y2="200" className={cn('stroke-slate-400', errors >= 5 ? 'opacity-100' : 'opacity-0')} strokeWidth="3" />
                <line x1="140" y1="150" x2="165" y2="200" className={cn('stroke-slate-400', errors >= 6 ? 'opacity-100' : 'opacity-0')} strokeWidth="3" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Heart key={i} className={cn('h-5 w-5', i < 6 - errors ? 'text-red-500 fill-red-500' : 'text-slate-300')} />
                ))}
            </div>
        </div>
    )
}

function Keyboard({ guessedLetters, correctLetters, onGuess, disabled }: { guessedLetters: Set<string>; correctLetters: Set<string>; onGuess: (letter: string) => void; disabled: boolean }) {
    const rows = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['Z', 'X', 'C', 'V', 'B', 'N', 'M']]
    return (
        <div className="space-y-2">
            {rows.map((row, i) => (
                <div key={i} className="flex justify-center gap-1 sm:gap-2">
                    {row.map((letter) => (
                        <button key={letter} onClick={() => onGuess(letter)} disabled={guessedLetters.has(letter) || disabled}
                            className={cn('w-8 h-10 sm:w-10 sm:h-12 rounded-lg font-bold text-sm border shadow-sm transition-all',
                                !guessedLetters.has(letter) && 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-slate-50',
                                guessedLetters.has(letter) && correctLetters.has(letter) && 'bg-emerald-500 text-white',
                                guessedLetters.has(letter) && !correctLetters.has(letter) && 'bg-slate-200 text-slate-400')}>
                            {letter}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    )
}

function HangmanGame({ word, onBack, onPlayAgain }: { word: HangmanWord; onBack: () => void; onPlayAgain: () => void }) {
    const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set())
    const [timer, setTimer] = useState(0)
    const [showHint, setShowHint] = useState(false)
    const [showResult, setShowResult] = useState(false)
    const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })

    const normalizedWord = word.word.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const wordLetters = new Set(normalizedWord.split(''))
    const correctLetters = new Set([...guessedLetters].filter(l => wordLetters.has(l)))
    const errors = [...guessedLetters].filter(l => !wordLetters.has(l)).length
    const isWon = [...wordLetters].every(l => guessedLetters.has(l))
    const isLost = errors >= 6
    const isGameOver = isWon || isLost

    useEffect(() => { if (isGameOver) return; const i = setInterval(() => setTimer(t => t + 1), 1000); return () => clearInterval(i) }, [isGameOver])
    useEffect(() => { if (isGameOver && !showResult) setTimeout(() => setShowResult(true), 500) }, [isGameOver, showResult])
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (isGameOver) return; const l = e.key.toUpperCase(); if (/^[A-Z]$/.test(l) && !guessedLetters.has(l)) handleGuess(l) }
        window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey)
    }, [guessedLetters, isGameOver])

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    function handleGuess(letter: string) {
        if (guessedLetters.has(letter) || isGameOver) return
        setGuessedLetters(new Set([...guessedLetters, letter]))
        setToast({ open: true, message: wordLetters.has(letter) ? 'Correto!' : 'Incorreta!', type: wordLetters.has(letter) ? 'success' : 'error' })
    }

    const resetGame = () => { setGuessedLetters(new Set()); setTimer(0); setShowResult(false); onPlayAgain() }

    return (
        <div className="space-y-6">
            <ToastAlert open={toast.open} onOpenChange={() => setToast({ ...toast, open: false })} message={toast.message} type={toast.type} />
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
                    <div><h1 className="text-xl font-bold text-slate-900 dark:text-white">{word.theme}</h1></div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/10"><Timer className="h-4 w-4" /><span className="font-mono">{formatTime(timer)}</span></div>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <LiquidGlassPanel className="p-6">
                    <AnatomicalHangman errors={errors} />
                    <div className="mt-8 flex justify-center gap-2 flex-wrap">
                        {word.word.toUpperCase().split('').map((letter, i) => {
                            const nl = letter.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            const revealed = guessedLetters.has(nl) || isGameOver
                            return (<div key={i} className={cn('w-10 h-12 flex items-center justify-center text-xl font-bold rounded-lg border-b-4', revealed ? 'bg-white dark:bg-slate-800 border-slate-300' : 'bg-slate-100 border-slate-200')}>{revealed ? letter : ''}</div>)
                        })}
                    </div>
                </LiquidGlassPanel>
                <LiquidGlassPanel className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Escolha uma letra</h3>
                        {word.hint && <Button variant="ghost" size="sm" onClick={() => setShowHint(true)}><Lightbulb className="h-4 w-4 mr-1" />Dica</Button>}
                    </div>
                    <Keyboard guessedLetters={guessedLetters} correctLetters={correctLetters} onGuess={handleGuess} disabled={isGameOver} />
                    {isGameOver && <Button onClick={resetGame} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white"><RefreshCw className="h-4 w-4 mr-2" />Jogar Novamente</Button>}
                </LiquidGlassPanel>
            </div>
            <Dialog open={showHint} onOpenChange={setShowHint}><DialogContent><DialogHeader><DialogTitle><Lightbulb className="h-5 w-5 text-amber-500 inline mr-2" />Dica</DialogTitle></DialogHeader><p>{word.hint}</p><DialogFooter><Button onClick={() => setShowHint(false)}>Entendi</Button></DialogFooter></DialogContent></Dialog>
            <Dialog open={showResult} onOpenChange={setShowResult}><DialogContent className="text-center"><div className="space-y-4 py-4"><div className={cn('mx-auto w-20 h-20 rounded-full flex items-center justify-center', isWon ? 'bg-emerald-500' : 'bg-red-500')}>{isWon ? <Trophy className="h-10 w-10 text-white" /> : <Skull className="h-10 w-10 text-white" />}</div><h2 className="text-2xl font-bold">{isWon ? 'Parabéns!' : 'Você perdeu!'}</h2><p className="text-slate-600 dark:text-slate-400">{isWon ? `Tempo: ${formatTime(timer)}` : `A palavra era: ${word.word.toUpperCase()}`}</p>{word.explanation && <div className="text-left p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20"><p className="text-sm">{word.explanation}</p></div>}<div className="flex gap-4 justify-center pt-4"><Button variant="outline" onClick={onBack}>Voltar</Button><Button onClick={resetGame}>Jogar novamente</Button></div></div></DialogContent></Dialog>
        </div>
    )
}

function TopicSelector({ onSelectWord }: { onSelectWord: (word: HangmanWord) => void }) {
    const [topics, setTopics] = useState<Topic[]>([])
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
    const [topicWords, setTopicWords] = useState<HangmanWord[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/games/hangman/topics')
            .then(res => res.json())
            .then(data => {
                if (data.topics && data.topics.length > 0) {
                    setTopics(data.topics)
                } else {
                    // Fallback demo if API empty
                    setTopics([{ _id: 'demo', name: 'Demonstração', description: 'Modo de teste', wordCount: DEMO_WORDS.length }])
                }
            })
            .catch(() => setTopics([{ _id: 'demo', name: 'Demonstração', description: 'Modo de teste', wordCount: DEMO_WORDS.length }]))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (selectedTopic) {
            if (selectedTopic._id === 'demo') {
                setTopicWords(DEMO_WORDS)
            } else {
                fetch(`/api/games/hangman/topics/${selectedTopic._id}/words`)
                    .then(res => res.json())
                    .then(data => setTopicWords(data.words || []))
            }
        }
    }, [selectedTopic])

    const handleStart = () => {
        if (topicWords.length > 0) {
            const randomWord = topicWords[Math.floor(Math.random() * topicWords.length)]
            onSelectWord(randomWord)
        }
    }

    if (loading) return <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" /></div>

    if (selectedTopic) {
        return (
            <div className="space-y-6 text-center">
                <Button variant="ghost" onClick={() => setSelectedTopic(null)}><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
                <h2 className="text-2xl font-bold">Tema: {selectedTopic.name}</h2>
                <p className="text-slate-500">{topicWords.length} palavras disponíveis</p>

                {topicWords.length > 0 ? (
                    <Button onClick={handleStart} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                        <Sparkles className="h-5 w-5 mr-2" />Iniciar Jogo
                    </Button>
                ) : (
                    <p className="text-amber-500">Nenhuma palavra neste tema.</p>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Escolha um Tema</h2>
                <p className="text-slate-500">Selecione a especialidade médica</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((t) => (
                    <div key={t._id} onClick={() => setSelectedTopic(t)} className="p-6 rounded-2xl border hover:border-blue-500 cursor-pointer transition-all group bg-white dark:bg-slate-900/50 hover:shadow-lg">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 w-fit mb-4"><Target className="h-6 w-6" /></div>
                        <h3 className="font-bold mb-2 group-hover:text-blue-500 text-lg">{t.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{t.description || 'Sem descrição'}</p>
                        <div className="flex justify-between text-xs text-slate-500 font-medium"><span>{t.wordCount || 0} palavras</span><ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function HangmanPage() {
    const router = useRouter()
    const [selectedWord, setSelectedWord] = useState<HangmanWord | null>(null)

    return (
        <LayoutShell showHeader={false}>
            <div className="min-h-screen bg-white dark:bg-slate-950">
                <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between min-h-[56px]">
                            <Button variant="ghost" size="icon" onClick={() => router.push('/games')}><ArrowLeft className="h-5 w-5" /></Button>
                            <div className="flex items-center gap-2 font-semibold"><Target className="h-5 w-5 text-blue-500" />Forca Médica</div>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>
                <div className="container mx-auto px-4 py-6">
                    {selectedWord ? <HangmanGame word={selectedWord} onBack={() => setSelectedWord(null)} onPlayAgain={() => setSelectedWord(DEMO_WORDS[Math.floor(Math.random() * DEMO_WORDS.length)])} /> : <LiquidGlassPanel className="p-6"><TopicSelector onSelectWord={setSelectedWord} /></LiquidGlassPanel>}
                </div>
            </div>
        </LayoutShell>
    )
}
