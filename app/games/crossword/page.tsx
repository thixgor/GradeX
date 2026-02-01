'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Puzzle,
    Lightbulb,
    RefreshCw,
    Check,
    X,
    Trophy,
    Timer,
    HelpCircle,
    ChevronRight,
    Sparkles,
    Volume2,
    Award,
    BookOpen,
    Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { AppShell as LayoutShell } from '@/components/app-shell'
import { cn } from '@/lib/utils'

interface CrosswordCell {
    letter: string
    userLetter: string
    isBlocked: boolean
    wordIds: number[]
    row: number
    col: number
    number?: number
}

interface CrosswordWord {
    id: number
    word: string
    clue: string
    hint?: string
    startRow: number
    startCol: number
    direction: 'across' | 'down'
    solved: boolean
}

interface CrosswordPuzzle {
    _id: string
    title: string
    description?: string
    topic: string
    difficulty: 'facil' | 'medio' | 'dificil'
    words: CrosswordWord[]
    grid: CrosswordCell[][]
    width: number
    height: number
    createdAt: string
}

interface Topic {
    _id: string
    name: string
    description?: string
    puzzleCount: number
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

// Helper function to normalize accented characters for comparison
function normalizeChar(char: string): string {
    return char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
}

// Demo puzzles for when no API data is available
const DEMO_PUZZLES: CrosswordPuzzle[] = [
    {
        _id: 'demo-1',
        title: 'Anatomia Básica',
        description: 'Teste seus conhecimentos sobre estruturas anatômicas fundamentais',
        topic: 'Anatomia',
        difficulty: 'facil',
        width: 10,
        height: 10,
        words: [
            { id: 1, word: 'FEMUR', clue: 'Maior osso do corpo humano', hint: 'Localizado na coxa', startRow: 0, startCol: 0, direction: 'across', solved: false },
            { id: 2, word: 'CORACAO', clue: 'Órgão responsável pelo bombeamento sanguíneo', hint: 'Possui 4 câmaras', startRow: 0, startCol: 0, direction: 'down', solved: false },
            { id: 3, word: 'ARTERIA', clue: 'Vaso que leva sangue do coração', hint: 'Geralmente transporta sangue oxigenado', startRow: 2, startCol: 2, direction: 'across', solved: false },
            { id: 4, word: 'TIBIA', clue: 'Osso da perna medialmente localizado', hint: 'Conhecida como "canela"', startRow: 1, startCol: 5, direction: 'down', solved: false },
            { id: 5, word: 'AORTA', clue: 'Principal artéria do corpo', hint: 'Sai do ventrículo esquerdo', startRow: 4, startCol: 0, direction: 'across', solved: false },
        ],
        grid: [],
        createdAt: new Date().toISOString(),
    },
]

// Helper function to generate grid from words
function generateGrid(words: CrosswordWord[], width: number, height: number): CrosswordCell[][] {
    const grid: CrosswordCell[][] = Array(height).fill(null).map((_, row) =>
        Array(width).fill(null).map((_, col) => ({
            letter: '',
            userLetter: '',
            isBlocked: true,
            wordIds: [],
            row,
            col,
        }))
    )

    let cellNumber = 1
    const numberedCells = new Set<string>()

    words.forEach((word) => {
        for (let i = 0; i < word.word.length; i++) {
            const row = word.direction === 'across' ? word.startRow : word.startRow + i
            const col = word.direction === 'across' ? word.startCol + i : word.startCol

            if (row < height && col < width) {
                const cell = grid[row][col]
                cell.letter = word.word[i]
                cell.isBlocked = false
                if (!cell.wordIds.includes(word.id)) {
                    cell.wordIds.push(word.id)
                }

                // Add number to first cell of each word
                if (i === 0) {
                    const key = `${row}-${col}`
                    if (!numberedCells.has(key)) {
                        cell.number = cellNumber++
                        numberedCells.add(key)
                    }
                }
            }
        }
    })

    return grid
}

// Topic Selection Component
function TopicSelector({ onSelectPuzzle }: { onSelectPuzzle: (puzzle: CrosswordPuzzle) => void }) {
    const [topics, setTopics] = useState<Topic[]>([])
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
    const [puzzles, setPuzzles] = useState<CrosswordPuzzle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTopics()
    }, [])

    async function loadTopics() {
        try {
            const res = await fetch('/api/games/crossword/topics')
            if (res.ok) {
                const data = await res.json()
                setTopics(data.topics || [])
            } else {
                // Use demo topics
                setTopics([
                    { _id: 'anatomia', name: 'Anatomia', description: 'Estruturas do corpo humano', puzzleCount: 1 },
                    { _id: 'fisiologia', name: 'Fisiologia', description: 'Funcionamento dos sistemas', puzzleCount: 0 },
                    { _id: 'patologia', name: 'Patologia', description: 'Doenças e alterações', puzzleCount: 0 },
                ])
            }
        } catch (error) {
            // Use demo topics on error
            setTopics([
                { _id: 'anatomia', name: 'Anatomia', description: 'Estruturas do corpo humano', puzzleCount: 1 },
            ])
        } finally {
            setLoading(false)
        }
    }

    async function loadPuzzles(topicId: string) {
        setSelectedTopic(topicId)
        try {
            const res = await fetch(`/api/games/crossword/topics/${topicId}/puzzles`)
            if (res.ok) {
                const data = await res.json()
                const puzzlesData = data.puzzles || []
                // Generate grids for puzzles that don't have them
                const puzzlesWithGrids = puzzlesData.map((p: CrosswordPuzzle) => ({
                    ...p,
                    grid: generateGrid(p.words, p.width, p.height)
                }))
                setPuzzles(puzzlesWithGrids)
            } else {
                // Use demo puzzles
                const demoWithGrid = DEMO_PUZZLES.map(p => ({
                    ...p,
                    grid: generateGrid(p.words, p.width, p.height)
                }))
                setPuzzles(demoWithGrid)
            }
        } catch (error) {
            // Use demo puzzles on error
            const demoWithGrid = DEMO_PUZZLES.map(p => ({
                ...p,
                grid: generateGrid(p.words, p.width, p.height)
            }))
            setPuzzles(demoWithGrid)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
        )
    }

    if (selectedTopic) {
        return (
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => { setSelectedTopic(null); setPuzzles([]) }}
                    className="text-slate-600 dark:text-slate-400"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar aos tópicos
                </Button>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {puzzles.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <BookOpen className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                            <p className="text-slate-600 dark:text-slate-400">Nenhuma palavra cruzada disponível neste tópico</p>
                        </div>
                    ) : (
                        puzzles.map((puzzle) => (
                            <div
                                key={puzzle._id}
                                onClick={() => onSelectPuzzle(puzzle)}
                                className="p-6 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900/50 hover:border-emerald-500 hover:shadow-lg cursor-pointer transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn(
                                        'p-3 rounded-xl',
                                        puzzle.difficulty === 'facil' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                                            puzzle.difficulty === 'medio' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                                'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                    )}>
                                        <Puzzle className="h-5 w-5" />
                                    </div>
                                    <span className={cn(
                                        'px-2 py-1 rounded-full text-xs font-medium',
                                        puzzle.difficulty === 'facil' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                            puzzle.difficulty === 'medio' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                    )}>
                                        {puzzle.difficulty === 'facil' ? 'Fácil' : puzzle.difficulty === 'medio' ? 'Médio' : 'Difícil'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {puzzle.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                                    {puzzle.description || 'Teste seus conhecimentos'}
                                </p>
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                                    <span>{puzzle.words.length} palavras</span>
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Escolha um Tópico</h2>
                <p className="text-slate-600 dark:text-slate-400">Selecione a área que deseja estudar</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((topic) => (
                    <div
                        key={topic._id}
                        onClick={() => loadPuzzles(topic._id)}
                        className="p-6 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900/50 hover:border-emerald-500 hover:shadow-lg cursor-pointer transition-all group"
                    >
                        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 w-fit mb-4">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {topic.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            {topic.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{topic.puzzleCount} palavras cruzadas</span>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Main Crossword Game Component
function CrosswordGame({ puzzle, onBack }: { puzzle: CrosswordPuzzle; onBack: () => void }) {
    const [grid, setGrid] = useState<CrosswordCell[][]>(puzzle.grid)
    const [words, setWords] = useState<CrosswordWord[]>(puzzle.words)
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
    const [selectedWord, setSelectedWord] = useState<CrosswordWord | null>(null)
    const [direction, setDirection] = useState<'across' | 'down'>('across')
    const [showHint, setShowHint] = useState(false)
    const [currentHint, setCurrentHint] = useState('')
    const [timer, setTimer] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [showComplete, setShowComplete] = useState(false)
    const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })

    // Timer
    useEffect(() => {
        if (isComplete) return
        const interval = setInterval(() => setTimer(t => t + 1), 1000)
        return () => clearInterval(interval)
    }, [isComplete])

    // Check completion
    useEffect(() => {
        checkCompletion()
    }, [grid])

    function formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    function checkCompletion() {
        let allCorrect = true
        const updatedWords = words.map(word => {
            let wordCorrect = true
            for (let i = 0; i < word.word.length; i++) {
                const row = word.direction === 'across' ? word.startRow : word.startRow + i
                const col = word.direction === 'across' ? word.startCol + i : word.startCol
                if (grid[row] && grid[row][col]) {
                    // Compare normalized characters to handle accents
                    const userNorm = normalizeChar(grid[row][col].userLetter)
                    const correctNorm = normalizeChar(word.word[i])
                    if (userNorm !== correctNorm) {
                        wordCorrect = false
                        allCorrect = false
                    }
                }
            }
            return { ...word, solved: wordCorrect }
        })
        setWords(updatedWords)

        if (allCorrect && words.length > 0) {
            setIsComplete(true)
            setShowComplete(true)
        }
    }

    function handleCellClick(row: number, col: number) {
        const cell = grid[row]?.[col]
        if (!cell || cell.isBlocked) return

        if (selectedCell?.row === row && selectedCell?.col === col) {
            // Toggle direction if clicking same cell
            setDirection(d => d === 'across' ? 'down' : 'across')
        } else {
            setSelectedCell({ row, col })
        }

        // Find word for this cell
        const wordId = cell.wordIds.find(id => {
            const word = words.find(w => w.id === id && w.direction === direction)
            return word !== undefined
        }) || cell.wordIds[0]

        const word = words.find(w => w.id === wordId)
        if (word) {
            setSelectedWord(word)
            setDirection(word.direction)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!selectedCell) return
        const { row, col } = selectedCell

        if (e.key === 'Backspace') {
            e.preventDefault()
            const newGrid = [...grid]
            newGrid[row][col] = { ...newGrid[row][col], userLetter: '' }
            setGrid(newGrid)
            // Move back
            moveCursor(-1)
            return
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault()
            moveToNextCell(row - 1, col)
            return
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            moveToNextCell(row + 1, col)
            return
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault()
            moveToNextCell(row, col - 1)
            return
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault()
            moveToNextCell(row, col + 1)
            return
        }

        if (/^[a-zA-ZÀ-ÿ]$/.test(e.key)) {
            e.preventDefault()
            const letter = e.key.toUpperCase()
            const newGrid = [...grid]
            newGrid[row][col] = { ...newGrid[row][col], userLetter: letter }
            setGrid(newGrid)
            moveCursor(1)
        }
    }

    function moveCursor(delta: number) {
        if (!selectedCell) return
        const { row, col } = selectedCell
        const newRow = direction === 'down' ? row + delta : row
        const newCol = direction === 'across' ? col + delta : col
        moveToNextCell(newRow, newCol)
    }

    function moveToNextCell(newRow: number, newCol: number) {
        if (
            newRow >= 0 && newRow < grid.length &&
            newCol >= 0 && newCol < grid[0].length &&
            !grid[newRow][newCol].isBlocked
        ) {
            setSelectedCell({ row: newRow, col: newCol })
        }
    }

    function showHintForWord() {
        if (selectedWord?.hint) {
            setCurrentHint(selectedWord.hint)
            setShowHint(true)
        } else {
            setToast({ open: true, message: 'Sem dica disponível para esta palavra', type: 'info' })
        }
    }

    function resetPuzzle() {
        const newGrid = grid.map(row => row.map(cell => ({ ...cell, userLetter: '' })))
        setGrid(newGrid)
        setWords(words.map(w => ({ ...w, solved: false })))
        setTimer(0)
        setIsComplete(false)
        setShowComplete(false)
        setSelectedCell(null)
        setSelectedWord(null)
    }

    const cellSize = 40

    return (
        <div className="space-y-6">
            <ToastAlert
                open={toast.open}
                onOpenChange={() => setToast({ ...toast, open: false })}
                message={toast.message}
                type={toast.type}
            />

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} className="text-slate-600 dark:text-slate-400">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{puzzle.title}</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{puzzle.topic}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        <Timer className="h-4 w-4" />
                        <span className="font-mono font-medium">{formatTime(timer)}</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={resetPuzzle}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_350px] gap-6">
                {/* Crossword Grid */}
                <LiquidGlassPanel className="p-4 sm:p-6 overflow-x-auto">
                    <div
                        className="mx-auto"
                        style={{ width: `${puzzle.width * cellSize}px` }}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                    >
                        {grid.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex">
                                {row.map((cell, colIndex) => {
                                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                                    const isInWord = selectedWord && cell.wordIds.includes(selectedWord.id)
                                    const isCorrect = !cell.isBlocked && cell.userLetter !== '' && normalizeChar(cell.userLetter) === normalizeChar(cell.letter)
                                    const isWrong = !cell.isBlocked && cell.userLetter !== '' && normalizeChar(cell.userLetter) !== normalizeChar(cell.letter)

                                    return (
                                        <div
                                            key={colIndex}
                                            onClick={() => handleCellClick(rowIndex, colIndex)}
                                            className={cn(
                                                'relative flex items-center justify-center border border-slate-300 dark:border-slate-600 font-bold text-lg transition-all cursor-pointer select-none',
                                                cell.isBlocked
                                                    ? 'bg-slate-800 dark:bg-slate-900'
                                                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700',
                                                isSelected && 'ring-2 ring-emerald-500 z-10',
                                                isInWord && !isSelected && 'bg-emerald-50 dark:bg-emerald-900/30',
                                                isCorrect && 'text-emerald-600 dark:text-emerald-400',
                                                isWrong && 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                                            )}
                                            style={{ width: cellSize, height: cellSize }}
                                        >
                                            {cell.number && (
                                                <span className="absolute top-0.5 left-1 text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                                    {cell.number}
                                                </span>
                                            )}
                                            {!cell.isBlocked && (
                                                <span>{cell.userLetter}</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </LiquidGlassPanel>

                {/* Clues Panel */}
                <div className="space-y-4">
                    {/* Current clue */}
                    {selectedWord && (
                        <LiquidGlassPanel className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    {selectedWord.direction === 'across' ? 'Horizontal' : 'Vertical'} #{selectedWord.id}
                                </span>
                                <Button variant="ghost" size="sm" onClick={showHintForWord} className="h-7 px-2">
                                    <Lightbulb className="h-4 w-4 mr-1" />
                                    Dica
                                </Button>
                            </div>
                            <p className="text-slate-900 dark:text-white font-medium">{selectedWord.clue}</p>
                        </LiquidGlassPanel>
                    )}

                    {/* All clues */}
                    <LiquidGlassPanel className="p-4 max-h-[500px] overflow-y-auto">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <ChevronRight className="h-4 w-4" />
                                    Horizontais
                                </h3>
                                <div className="space-y-2">
                                    {words.filter(w => w.direction === 'across').map(word => (
                                        <button
                                            key={word.id}
                                            onClick={() => {
                                                setSelectedWord(word)
                                                setDirection('across')
                                                setSelectedCell({ row: word.startRow, col: word.startCol })
                                            }}
                                            className={cn(
                                                'w-full text-left p-2 rounded-lg text-sm transition-colors',
                                                selectedWord?.id === word.id
                                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                                    : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300',
                                                word.solved && 'line-through opacity-50'
                                            )}
                                        >
                                            <span className="font-medium">{word.id}.</span> {word.clue}
                                            {word.solved && <Check className="inline h-4 w-4 ml-2 text-emerald-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <ChevronRight className="h-4 w-4 rotate-90" />
                                    Verticais
                                </h3>
                                <div className="space-y-2">
                                    {words.filter(w => w.direction === 'down').map(word => (
                                        <button
                                            key={word.id}
                                            onClick={() => {
                                                setSelectedWord(word)
                                                setDirection('down')
                                                setSelectedCell({ row: word.startRow, col: word.startCol })
                                            }}
                                            className={cn(
                                                'w-full text-left p-2 rounded-lg text-sm transition-colors',
                                                selectedWord?.id === word.id
                                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                                    : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300',
                                                word.solved && 'line-through opacity-50'
                                            )}
                                        >
                                            <span className="font-medium">{word.id}.</span> {word.clue}
                                            {word.solved && <Check className="inline h-4 w-4 ml-2 text-emerald-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </LiquidGlassPanel>
                </div>
            </div>

            {/* Hint Dialog */}
            <Dialog open={showHint} onOpenChange={setShowHint}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-amber-500" />
                            Dica
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-slate-700 dark:text-slate-300">{currentHint}</p>
                    <DialogFooter>
                        <Button onClick={() => setShowHint(false)}>Entendi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Completion Dialog */}
            <Dialog open={showComplete} onOpenChange={setShowComplete}>
                <DialogContent className="text-center">
                    <div className="space-y-4 py-4">
                        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                            <Trophy className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Parabéns!</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Você completou o crossword em <strong>{formatTime(timer)}</strong>!
                        </p>
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <Button variant="outline" onClick={onBack}>
                                Voltar aos tópicos
                            </Button>
                            <Button onClick={resetPuzzle} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                Jogar novamente
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function CrosswordPage() {
    const router = useRouter()
    const [selectedPuzzle, setSelectedPuzzle] = useState<CrosswordPuzzle | null>(null)

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
                                onClick={() => router.push('/games')}
                            >
                                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>

                            <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-semibold text-slate-900 dark:text-white min-w-0 flex-1">
                                <Puzzle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-emerald-500" />
                                <span>Palavras Cruzadas</span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-6">
                    {selectedPuzzle ? (
                        <CrosswordGame puzzle={selectedPuzzle} onBack={() => setSelectedPuzzle(null)} />
                    ) : (
                        <LiquidGlassPanel className="p-6 sm:p-8">
                            <TopicSelector onSelectPuzzle={setSelectedPuzzle} />
                        </LiquidGlassPanel>
                    )}
                </div>
            </div>
        </LayoutShell>
    )
}
