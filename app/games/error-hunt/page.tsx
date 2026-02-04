'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    AlertTriangle,
    Check,
    X,
    Trophy,
    Timer,
    Lightbulb,
    ChevronRight,
    BookOpen,
    Sparkles,
    Zap,
    RefreshCw,
    Target,
    Award,
    Brain,
    TrendingUp,
    ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/page-loading'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { AppShell as LayoutShell } from '@/components/app-shell'
import { cn } from '@/lib/utils'

interface ErrorQuestion {
    _id: string
    statement: string
    correctAnswer: string
    explanation: string
    topic: string
    difficulty: 'facil' | 'medio' | 'dificil'
    hint?: string
    examTip?: string
    options?: string[]
    type: 'correction' | 'multiple-choice'
}

interface Topic {
    _id: string
    name: string
    description?: string
    questionCount: number
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

const DEMO_QUESTIONS: ErrorQuestion[] = [
    {
        _id: 'q1',
        statement: 'A veia pulmonar transporta sangue venoso.',
        correctAnswer: 'A veia pulmonar transporta sangue arterial (oxigenado).',
        explanation: 'A veia pulmonar é exceção à regra. Ela traz sangue oxigenado dos pulmões para o átrio esquerdo. Apesar de ser veia, carrega sangue arterial.',
        topic: 'Sistema Cardiovascular',
        difficulty: 'facil',
        hint: 'Pense na função pulmonar: hematose.',
        examTip: 'Erro clássico em provas! Memorize as exceções da circulação pulmonar.',
        type: 'correction',
    },
    {
        _id: 'q2',
        statement: 'O nervo frênico inerva o músculo trapézio.',
        correctAnswer: 'O nervo frênico inerva o diafragma.',
        explanation: 'O nervo frênico (C3-C5) é o principal nervo motor do diafragma. O trapézio é inervado pelo nervo acessório (XI par craniano).',
        topic: 'Neuroanatomia',
        difficulty: 'medio',
        hint: 'C3, 4, 5 keeps the diaphragm alive.',
        examTip: 'Mnemônico clássico para nunca esquecer!',
        type: 'correction',
    },
    {
        _id: 'q3',
        statement: 'A insulina aumenta os níveis de glicose no sangue.',
        correctAnswer: 'A insulina diminui os níveis de glicose no sangue.',
        explanation: 'A insulina é o hormônio hipoglicemiante, facilitando a entrada de glicose nas células. O glucagon é que aumenta a glicemia.',
        topic: 'Endocrinologia',
        difficulty: 'facil',
        hint: 'Insulina = hormônio do "armazenamento".',
        examTip: 'Confusão comum entre insulina e glucagon.',
        type: 'correction',
    },
    {
        _id: 'q4',
        statement: 'A artéria braquial é palpada na fossa poplítea.',
        correctAnswer: 'A artéria braquial é palpada no braço (região medial). Na fossa poplítea, palpa-se a artéria poplítea.',
        explanation: 'A artéria braquial corre pelo braço e é comumente usada para aferir PA. A fossa poplítea é posterior ao joelho.',
        topic: 'Anatomia',
        difficulty: 'medio',
        hint: 'Braquial vem de brachium = braço.',
        examTip: 'Saber os pontos de pulso é essencial para semiologia.',
        type: 'correction',
    },
    {
        _id: 'q5',
        statement: 'Qual hormônio é produzido pela glândula tireoide?',
        options: ['Cortisol', 'Tiroxina (T4)', 'Adrenalina', 'Melatonina'],
        correctAnswer: 'Tiroxina (T4)',
        explanation: 'A tireoide produz T3 e T4 (tiroxina). Cortisol é da adrenal, adrenalina da medula adrenal, e melatonina da pineal.',
        topic: 'Endocrinologia',
        difficulty: 'facil',
        type: 'multiple-choice',
    },
]

function TopicSelector({ onStartGame }: { onStartGame: (questions: ErrorQuestion[]) => void }) {
    const [topics, setTopics] = useState<Topic[]>([])
    const [difficulty, setDifficulty] = useState<'all' | 'facil' | 'medio' | 'dificil'>('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/games/error-hunt/topics')
            .then(res => res.json())
            .then(data => {
                if (data.topics && data.topics.length > 0) {
                    setTopics(data.topics)
                } else {
                    setTopics([{ _id: 'geral', name: 'Todos os Tópicos (Demo)', description: 'Nenhum tópico encontrado na API', questionCount: DEMO_QUESTIONS.length }])
                }
            })
            .catch(() => setTopics([{ _id: 'geral', name: 'Todos os Tópicos (Demo)', description: 'Erro ao carregar', questionCount: DEMO_QUESTIONS.length }]))
            .finally(() => setLoading(false))
    }, [])

    function startGame(topic: Topic) {
        if (topic._id === 'geral') {
            // Demo fallback
            let qs = [...DEMO_QUESTIONS]
            if (difficulty !== 'all') qs = qs.filter(q => q.difficulty === difficulty)
            onStartGame(qs.sort(() => Math.random() - 0.5))
            return
        }

        fetch(`/api/games/error-hunt/topics/${topic._id}/questions`)
            .then(res => res.json())
            .then(data => {
                let qs: ErrorQuestion[] = data.questions || []
                if (difficulty !== 'all') {
                    qs = qs.filter(q => q.difficulty === difficulty)
                }
                if (qs.length === 0) {
                    alert('Nenhuma questão encontrada com este filtro.')
                    // Fallback to demo if desired, but better strict
                    return
                }
                qs = qs.sort(() => Math.random() - 0.5)
                onStartGame(qs)
            })
            .catch(err => {
                console.error(err)
                alert('Erro ao iniciar jogo. Verifique conexão.')
            })
    }

    if (loading) return <PageLoading variant="minimal" background="transparent" />

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Alta Retenção Cognitiva
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Caça aos Erros</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                    Identifique e corrija afirmações incorretas. Selecione um Tópico para começar.
                </p>
            </div>

            <div className="flex justify-center gap-2">
                {(['all', 'facil', 'medio', 'dificil'] as const).map((d) => (
                    <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium transition-all',
                            difficulty === d
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20'
                        )}
                    >
                        {d === 'all' ? 'Todos' : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((topic) => (
                    <div
                        key={topic._id}
                        onClick={() => startGame(topic)}
                        className="p-6 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900/50 hover:border-orange-500 hover:shadow-lg cursor-pointer transition-all group"
                    >
                        <div className="p-3 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 w-fit mb-4">
                            <Target className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {topic.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                            {topic.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{topic.questionCount} questões</span>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function GameSession({ questions, onFinish }: { questions: ErrorQuestion[]; onFinish: (score: number, total: number) => void }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userAnswer, setUserAnswer] = useState('')
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [showResult, setShowResult] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [score, setScore] = useState(0)
    const [timer, setTimer] = useState(0)
    const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })

    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100

    useEffect(() => {
        const interval = setInterval(() => setTimer(t => t + 1), 1000)
        return () => clearInterval(interval)
    }, [])

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    function checkAnswer() {
        const q = currentQuestion
        let correct = false

        if (q.type === 'multiple-choice') {
            correct = selectedOption === q.correctAnswer
        } else {
            // For correction type, check if user mentioned key concepts
            const keywords = q.correctAnswer.toLowerCase().split(' ').filter(w => w.length > 4)
            const userWords = userAnswer.toLowerCase()
            correct = keywords.filter(k => userWords.includes(k)).length >= 2
        }

        setIsCorrect(correct)
        if (correct) setScore(s => s + 1)
        setShowResult(true)
    }

    function nextQuestion() {
        if (currentIndex >= questions.length - 1) {
            onFinish(score, questions.length)
        } else {
            setCurrentIndex(i => i + 1)
            setUserAnswer('')
            setSelectedOption(null)
            setShowResult(false)
            setShowHint(false)
        }
    }

    return (
        <div className="space-y-6">
            <ToastAlert open={toast.open} onOpenChange={() => setToast({ ...toast, open: false })} message={toast.message} type={toast.type} />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-orange-500" />
                        <span className="font-bold text-slate-900 dark:text-white">{score}/{currentIndex + (showResult ? 1 : 0)}</span>
                    </div>
                    <div className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        currentQuestion.difficulty === 'facil' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                            currentQuestion.difficulty === 'medio' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    )}>
                        {currentQuestion.difficulty === 'facil' ? 'Fácil' : currentQuestion.difficulty === 'medio' ? 'Médio' : 'Difícil'}
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/10">
                    <Timer className="h-4 w-4" />
                    <span className="font-mono">{formatTime(timer)}</span>
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Questão {currentIndex + 1} de {questions.length}</span>
                    <span>{currentQuestion.topic}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Question Card */}
            <LiquidGlassPanel className="p-6 sm:p-8">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 shrink-0">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                                {currentQuestion.type === 'correction' ? 'Identifique e corrija o erro' : 'Escolha a resposta correta'}
                            </span>
                            <p className="text-xl font-medium text-slate-900 dark:text-white leading-relaxed">
                                "{currentQuestion.statement}"
                            </p>
                        </div>
                    </div>

                    {!showResult && (
                        <>
                            {currentQuestion.type === 'multiple-choice' && currentQuestion.options ? (
                                <div className="grid gap-3">
                                    {currentQuestion.options.map((option, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedOption(option)}
                                            className={cn(
                                                'p-4 rounded-xl text-left font-medium transition-all border',
                                                selectedOption === option
                                                    ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/50'
                                            )}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sua correção:</label>
                                    <Input
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        placeholder="Digite a afirmação correta..."
                                        className="py-6 text-lg"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                {currentQuestion.hint && (
                                    <Button variant="ghost" size="sm" onClick={() => setShowHint(true)}>
                                        <Lightbulb className="h-4 w-4 mr-1" />
                                        Dica
                                    </Button>
                                )}
                                <Button
                                    onClick={checkAnswer}
                                    disabled={currentQuestion.type === 'multiple-choice' ? !selectedOption : !userAnswer.trim()}
                                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white ml-auto"
                                >
                                    Verificar
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </>
                    )}

                    {showResult && (
                        <div className="space-y-4 animate-fade-in">
                            <div className={cn(
                                'p-4 rounded-xl flex items-start gap-3',
                                isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            )}>
                                <div className={cn('p-2 rounded-full', isCorrect ? 'bg-emerald-500' : 'bg-red-500')}>
                                    {isCorrect ? <Check className="h-4 w-4 text-white" /> : <X className="h-4 w-4 text-white" />}
                                </div>
                                <div>
                                    <p className={cn('font-bold', isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400')}>
                                        {isCorrect ? 'Correto!' : 'Incorreto'}
                                    </p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                        <strong>Resposta correta:</strong> {currentQuestion.correctAnswer}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium mb-2">
                                    <BookOpen className="h-4 w-4" />
                                    Explicação
                                </div>
                                <p className="text-sm text-blue-800 dark:text-blue-300">{currentQuestion.explanation}</p>
                            </div>

                            {currentQuestion.examTip && (
                                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-2">
                                        <Zap className="h-4 w-4" />
                                        Dica de Prova
                                    </div>
                                    <p className="text-sm text-amber-800 dark:text-amber-300">{currentQuestion.examTip}</p>
                                </div>
                            )}

                            <Button onClick={nextQuestion} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white">
                                {currentIndex >= questions.length - 1 ? 'Ver Resultado Final' : 'Próxima Questão'}
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            </LiquidGlassPanel>

            {/* Hint Dialog */}
            <Dialog open={showHint} onOpenChange={setShowHint}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-amber-500" />
                            Dica
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-slate-700 dark:text-slate-300">{currentQuestion.hint}</p>
                    <DialogFooter>
                        <Button onClick={() => setShowHint(false)}>Entendi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ResultsScreen({ score, total, time, onPlayAgain, onBack }: { score: number; total: number; time: number; onPlayAgain: () => void; onBack: () => void }) {
    const percentage = Math.round((score / total) * 100)
    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    return (
        <LiquidGlassPanel className="p-8 text-center space-y-6 max-w-lg mx-auto">
            <div className={cn(
                'mx-auto w-24 h-24 rounded-full flex items-center justify-center',
                percentage >= 80 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' :
                    percentage >= 50 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                        'bg-gradient-to-br from-red-400 to-rose-500'
            )}>
                <Trophy className="h-12 w-12 text-white" />
            </div>

            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {percentage >= 80 ? 'Excelente!' : percentage >= 50 ? 'Bom trabalho!' : 'Continue praticando!'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">Você completou a sessão de caça aos erros</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/10">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{score}/{total}</p>
                    <p className="text-xs text-slate-500">Acertos</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/10">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{percentage}%</p>
                    <p className="text-xs text-slate-500">Aproveitamento</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/10">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatTime(time)}</p>
                    <p className="text-xs text-slate-500">Tempo</p>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={onBack} className="flex-1">Voltar</Button>
                <Button onClick={onPlayAgain} className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Jogar Novamente
                </Button>
            </div>
        </LiquidGlassPanel>
    )
}

export default function ErrorHuntPage() {
    const router = useRouter()
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'results'>('menu')
    const [questions, setQuestions] = useState<ErrorQuestion[]>([])
    const [finalScore, setFinalScore] = useState(0)
    const [finalTotal, setFinalTotal] = useState(0)
    const [finalTime, setFinalTime] = useState(0)

    function startGame(q: ErrorQuestion[]) {
        setQuestions(q)
        setGameState('playing')
    }

    function finishGame(score: number, total: number) {
        setFinalScore(score)
        setFinalTotal(total)
        setGameState('results')
    }

    function playAgain() {
        setQuestions(questions.sort(() => Math.random() - 0.5))
        setGameState('playing')
    }

    return (
        <LayoutShell showHeader={false}>
            <div className="min-h-screen bg-white dark:bg-slate-950">
                <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between min-h-[56px]">
                            <Button variant="ghost" size="icon" onClick={() => gameState === 'menu' ? router.push('/games') : setGameState('menu')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-2 font-semibold">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Caça aos Erros
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-6">
                    {gameState === 'menu' && (
                        <LiquidGlassPanel className="p-6 sm:p-8">
                            <TopicSelector onStartGame={startGame} />
                        </LiquidGlassPanel>
                    )}

                    {gameState === 'playing' && (
                        <GameSession questions={questions} onFinish={finishGame} />
                    )}

                    {gameState === 'results' && (
                        <ResultsScreen
                            score={finalScore}
                            total={finalTotal}
                            time={finalTime}
                            onPlayAgain={playAgain}
                            onBack={() => setGameState('menu')}
                        />
                    )}
                </div>
            </div>
        </LayoutShell>
    )
}
