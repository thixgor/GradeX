'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Gamepad2,
    Puzzle,
    Target,
    AlertTriangle,
    Sparkles,
    Trophy,
    Zap,
    Brain,
    Play,
    Lock,
    ChevronRight,
    Star,
    Timer,
    Medal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { AppShell as LayoutShell } from '@/components/app-shell'
import { cn } from '@/lib/utils'
import { isPlusAccount } from '@/lib/account-tier'

interface GameCardProps {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    gradient: string
    features: string[]
    isNew?: boolean
    isLocked?: boolean
    href: string
    stats?: {
        played: number
        bestScore?: number
    }
}

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

function GameCard({
    id,
    title,
    description,
    icon,
    gradient,
    features,
    isNew,
    isLocked,
    href,
    stats,
}: GameCardProps) {
    const router = useRouter()

    return (
        <div
            onClick={() => !isLocked && router.push(href)}
            className={cn(
                'group relative rounded-3xl overflow-hidden border transition-all duration-500 cursor-pointer',
                'border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900/50',
                'hover:border-transparent hover:shadow-2xl hover:-translate-y-2',
                isLocked && 'opacity-60 cursor-not-allowed'
            )}
        >
            {/* Background gradient on hover */}
            <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                gradient
            )} />

            {/* Content */}
            <div className="relative p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className={cn(
                        'p-4 rounded-2xl transition-all duration-300',
                        gradient,
                        'text-white shadow-lg group-hover:scale-110 group-hover:rotate-3'
                    )}>
                        {icon}
                    </div>

                    <div className="flex items-center gap-2">
                        {isNew && (
                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold uppercase tracking-wider animate-pulse">
                                Novo
                            </span>
                        )}
                        {isLocked && (
                            <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                        )}
                    </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-white transition-colors duration-300">
                        {title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 group-hover:text-white/80 transition-colors duration-300 line-clamp-2">
                        {description}
                    </p>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                    {features.map((feature, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 group-hover:bg-white/20 group-hover:text-white transition-colors duration-300"
                        >
                            {feature}
                        </span>
                    ))}
                </div>

                {/* Stats */}
                {stats && (
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-white/10 group-hover:border-white/20 transition-colors duration-300">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:text-white/70 transition-colors duration-300">
                            <Play className="h-4 w-4" />
                            <span className="text-sm">{stats.played} jogados</span>
                        </div>
                        {stats.bestScore !== undefined && (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:text-white/70 transition-colors duration-300">
                                <Trophy className="h-4 w-4" />
                                <span className="text-sm">{stats.bestScore}% melhor</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Play button */}
                <Button
                    className={cn(
                        'w-full py-6 text-lg font-semibold transition-all duration-300',
                        'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-white/90',
                        'text-white dark:text-slate-900',
                        'group-hover:bg-white group-hover:text-slate-900',
                        isLocked && 'opacity-50'
                    )}
                    disabled={isLocked}
                >
                    {isLocked ? (
                        <>
                            <Lock className="h-5 w-5 mr-2" />
                            Em breve
                        </>
                    ) : (
                        <>
                            <Play className="h-5 w-5 mr-2" />
                            Jogar Agora
                            <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

// Stats Card Component
function StatsCard({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: string | number; gradient: string }) {
    return (
        <div className={cn(
            'relative overflow-hidden rounded-2xl p-6 text-white',
            gradient
        )}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative space-y-2">
                <div className="flex items-center gap-2 text-white/80">
                    {icon}
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="text-3xl font-bold">{value}</p>
            </div>
        </div>
    )
}

export default function GamesPage() {
    const router = useRouter()
    const [accountType, setAccountType] = useState<'gratuito' | 'trial' | 'premium'>('gratuito')
    const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
    const [totalGamesPlayed, setTotalGamesPlayed] = useState(0)
    const [bestStreak, setBestStreak] = useState(0)
    const [totalPoints, setTotalPoints] = useState(0)

    useEffect(() => {
        loadUserData()
        loadStats()
    }, [])

    async function loadUserData() {
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

    async function loadStats() {
        try {
            const res = await fetch('/api/games/stats')
            if (res.ok) {
                const data = await res.json()
                setTotalGamesPlayed(data.totalGamesPlayed || 0)
                setBestStreak(data.bestStreak || 0)
                setTotalPoints(data.totalPoints || 0)
            }
        } catch (error) {
            // Stats endpoint may not exist yet, use defaults
            setTotalGamesPlayed(0)
            setBestStreak(0)
            setTotalPoints(0)
        }
    }

    const isAdmin = userRole === 'admin'
    const isPremium = isPlusAccount(accountType, isAdmin)

    const games: GameCardProps[] = [
        {
            id: 'crossword',
            title: 'Palavras Cruzadas',
            description: 'Desvende termos médicos complexos em grades interativas. Reforce nomenclaturas de Anatomia, Fisiologia, Patologia e muito mais.',
            icon: <Puzzle className="h-8 w-8" />,
            gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
            features: ['Anatomia', 'Fisiologia', 'Patologia', 'Farmacologia'],
            isNew: true,
            href: '/games/crossword',
            stats: { played: 0 },
        },
        {
            id: 'hangman',
            title: 'Forca Médica',
            description: 'A clássica forca com toque profissional. Descubra termos médicos antes que seu boneco anatômico perca todas as partes.',
            icon: <Target className="h-8 w-8" />,
            gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
            features: ['Termos Médicos', 'Medicamentos', 'Estruturas', 'Patologias'],
            isNew: true,
            href: '/games/hangman',
            stats: { played: 0 },
        },
        {
            id: 'error-hunt',
            title: 'Caça aos Erros',
            description: 'Identifique e corrija erros clássicos de prova. O jogo que combate conceitos mal consolidados e vícios de estudo.',
            icon: <AlertTriangle className="h-8 w-8" />,
            gradient: 'bg-gradient-to-br from-orange-500 to-red-600',
            features: ['Erros Clássicos', 'Correção', 'Feedback', 'Alta Retenção'],
            isNew: true,
            href: '/games/error-hunt',
            stats: { played: 0 },
        },
    ]

    return (
        <LayoutShell showHeader={false}>
            <div className="min-h-screen text-slate-900 dark:text-white bg-white dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_50%),_linear-gradient(135deg,_#020617,_#0f172a,_#020617)]">
                {/* Header */}
                <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10">
                    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center justify-between gap-2 sm:gap-4 min-h-[56px] sm:min-h-[64px]">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-600 hover:text-slate-900 dark:text-white/80 dark:hover:text-white h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                                onClick={() => router.push('/dashboard')}
                            >
                                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>

                            <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-semibold text-slate-900 dark:text-white min-w-0 flex-1">
                                <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                <span>Games</span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-6 space-y-8">
                    {/* Hero Section */}
                    <LiquidGlassPanel className="p-6 sm:p-10">
                        <div className="flex flex-col lg:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wide border border-emerald-500/30">
                                    <Sparkles className="h-4 w-4" />
                                    Gamificação Médica
                                </div>

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-slate-900 dark:text-white">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500">
                                        Games
                                    </span>
                                    <br />
                                    <span className="text-slate-700 dark:text-slate-300 text-3xl sm:text-4xl">
                                        Aprenda jogando
                                    </span>
                                </h1>

                                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                                    Transforme seu estudo em diversão. Jogos educativos desenvolvidos especificamente para estudantes de Medicina,
                                    focados em <strong className="text-slate-900 dark:text-white">fixação cognitiva</strong> e <strong className="text-slate-900 dark:text-white">treino para provas</strong>.
                                </p>

                                {/* Quick stats */}
                                <div className="grid grid-cols-3 gap-4 pt-4">
                                    <StatsCard
                                        icon={<Play className="h-4 w-4" />}
                                        label="Jogos"
                                        value={totalGamesPlayed}
                                        gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                                    />
                                    <StatsCard
                                        icon={<Zap className="h-4 w-4" />}
                                        label="Streak"
                                        value={bestStreak}
                                        gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                                    />
                                    <StatsCard
                                        icon={<Trophy className="h-4 w-4" />}
                                        label="Pontos"
                                        value={totalPoints}
                                        gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Decorative illustration */}
                            <div className="hidden lg:flex relative w-80 h-80">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full blur-3xl" />
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute w-64 h-64 rounded-full border-4 border-dashed border-emerald-500/30 animate-[spin_30s_linear_infinite]" />
                                    <div className="absolute w-48 h-48 rounded-full border-4 border-dashed border-blue-500/30 animate-[spin_20s_linear_infinite_reverse]" />
                                    <div className="relative z-10 p-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500">
                                        <Brain className="h-24 w-24 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </LiquidGlassPanel>

                    {/* Games Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Escolha seu jogo
                            </h2>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                {games.filter(g => !g.isLocked).length} jogos disponíveis
                            </span>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {games.map((game) => (
                                <GameCard key={game.id} {...game} />
                            ))}
                        </div>
                    </div>

                    {/* Educational Benefits */}
                    <LiquidGlassPanel className="p-6 sm:p-8">
                        <div className="text-center space-y-4 mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Por que jogos educativos?
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                                A gamificação potencializa a retenção de conteúdo e torna o estudo mais prazeroso
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    icon: <Brain className="h-6 w-6" />,
                                    title: 'Memória Ativa',
                                    description: 'Reforço de conceitos através de repetição espaçada e recall ativo',
                                    color: 'text-emerald-500',
                                },
                                {
                                    icon: <Target className="h-6 w-6" />,
                                    title: 'Foco em Provas',
                                    description: 'Conteúdo direcionado para erros comuns em avaliações médicas',
                                    color: 'text-blue-500',
                                },
                                {
                                    icon: <Zap className="h-6 w-6" />,
                                    title: 'Feedback Imediato',
                                    description: 'Correção instantânea com explicações pedagógicas claras',
                                    color: 'text-amber-500',
                                },
                                {
                                    icon: <Trophy className="h-6 w-6" />,
                                    title: 'Motivação',
                                    description: 'Sistema de pontos e conquistas para manter o engajamento',
                                    color: 'text-purple-500',
                                },
                            ].map((benefit, index) => (
                                <div key={index} className="text-center space-y-3 p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                    <div className={cn('inline-flex p-3 rounded-xl bg-slate-100 dark:bg-white/10', benefit.color)}>
                                        {benefit.icon}
                                    </div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">{benefit.title}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{benefit.description}</p>
                                </div>
                            ))}
                        </div>
                    </LiquidGlassPanel>
                </div>
            </div>
        </LayoutShell>
    )
}
