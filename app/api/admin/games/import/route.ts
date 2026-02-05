import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface ImportBlock {
    type: 'CROSSWORD' | 'HANGMAN' | 'ERROR_HUNT'
    data: Record<string, string>
}

async function ensureTopic(db: any, moduleName: string, topicName: string, gameType: string) {
    const query = {
        name: topicName,
        type: gameType
    }

    let topic = await db.collection('games_topics').findOne(query)

    if (!topic) {
        const res = await db.collection('games_topics').insertOne({
            ...query,
            module: moduleName,
            description: `Tópico: ${topicName} (Módulo: ${moduleName})`,
            createdAt: new Date()
        })
        return res.insertedId.toString()
    }
    return topic._id.toString()
}

// ==========================================
// GRID GENERATOR (Robust Backtracking)
// ==========================================

interface Cell {
    char: string
    x: number
    y: number
}

interface PlacedWord {
    word: string
    row: number
    col: number
    direction: 'across' | 'down'
}

function generateCrosswordLayout(words: string[]): { width: number; height: number; words: any[], grid: any[] } {
    try {
        console.log('Generating Layout for words:', words.length)

        // Sort by length desc and clean
        const sortedWords = [...words]
            .map(w => {
                // Remove content in parentheses e.g. "Veias (obs...)"
                let clean = w.replace(/\(.*?\)/g, '')
                // Normalize accents: Á -> A, Ç -> C
                clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                // Keep only A-Z
                return clean.toUpperCase().replace(/[^A-Z]/g, '')
            })
            .filter(w => w.length > 1) // Ignore single letters or empty
            .sort((a, b) => b.length - a.length)

        console.log('Cleaned Words:', sortedWords)

        if (sortedWords.length === 0) {
            console.error('No valid words after cleaning')
            return { width: 10, height: 10, words: [], grid: createEmptyGrid(10, 10) }
        }

        const placedWords: PlacedWord[] = []
        const gridMap = new Map<string, string>() // "row,col" -> char

        const size = 100
        const center = Math.floor(size / 2)

        // Place first word horizontally center
        const firstWord = sortedWords[0]
        const startCol = center - Math.floor(firstWord.length / 2)

        for (let i = 0; i < firstWord.length; i++) {
            gridMap.set(`${center},${startCol + i}`, firstWord[i])
        }
        placedWords.push({ word: firstWord, row: center, col: startCol, direction: 'across' })

        // Try to place remaining words
        for (let k = 1; k < sortedWords.length; k++) {
            const word = sortedWords[k]
            let placed = false

            // Try to intersect with existing characters
            for (let i = 0; i < word.length; i++) {
                const char = word[i]
                if (placed) break

                const entries = Array.from(gridMap.entries())
                for (const [pos, gridChar] of entries) {
                    if (gridChar === char && !placed) {
                        const [r, c] = pos.split(',').map(Number)

                        const hasHNeighbor = gridMap.has(`${r},${c - 1}`) || gridMap.has(`${r},${c + 1}`)
                        const hasVNeighbor = gridMap.has(`${r - 1},${c}`) || gridMap.has(`${r + 1},${c}`)

                        if (hasHNeighbor && !hasVNeighbor) {
                            // Place Vertical
                            const startRow = r - i
                            const startCol = c
                            if (canPlace(word, startRow, startCol, 'down', gridMap)) {
                                place(word, startRow, startCol, 'down', gridMap)
                                placedWords.push({ word, row: startRow, col: startCol, direction: 'down' })
                                placed = true
                            }
                        }
                        else if (hasVNeighbor && !hasHNeighbor) {
                            // Place Horizontal
                            const startRow = r
                            const startCol = c - i
                            if (canPlace(word, startRow, startCol, 'across', gridMap)) {
                                place(word, startRow, startCol, 'across', gridMap)
                                placedWords.push({ word, row: startRow, col: startCol, direction: 'across' })
                                placed = true
                            }
                        }
                    }
                }
            }

            // If could not intersect, try to place somewhere independent below everything
            if (!placed) {
                let maxRow = -Infinity
                for (const [pos] of gridMap.keys()) {
                    const r = parseInt(pos.split(',')[0])
                    if (r > maxRow) maxRow = r
                }
                if (maxRow === -Infinity) maxRow = center

                const newRow = maxRow + 2
                const newCol = center - Math.floor(word.length / 2)
                if (canPlace(word, newRow, newCol, 'across', gridMap)) {
                    place(word, newRow, newCol, 'across', gridMap)
                    placedWords.push({ word, row: newRow, col: newCol, direction: 'across' })
                    placed = true
                }
            }
        }

        // Normalize coordinates and calculate dimensions
        let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity

        if (gridMap.size === 0) {
            minR = 0; maxR = 9; minC = 0; maxC = 9;
        } else {
            for (const [pos] of gridMap.keys()) {
                const [r, c] = pos.split(',').map(Number)
                if (r < minR) minR = r
                if (r > maxR) maxR = r
                if (c < minC) minC = c
                if (c > maxC) maxC = c
            }
        }

        minR -= 1; maxR += 1; minC -= 1; maxC += 1

        let height = maxR - minR + 1
        let width = maxC - minC + 1

        if (width < 5) width = 5
        if (height < 5) height = 5
        if (width > 50) width = 50
        if (height > 50) height = 50

        if (isNaN(width) || isNaN(height)) { width = 10; height = 10; }

        const finalWords = placedWords.map((pw, idx) => ({
            id: idx + 1,
            word: pw.word,
            startRow: pw.row - minR,
            startCol: pw.col - minC,
            direction: pw.direction,
            hint: '',
            clue: '',
            solved: false
        })).filter(w => {
            const endRow = w.direction === 'across' ? w.startRow : w.startRow + w.word.length
            const endCol = w.direction === 'across' ? w.startCol + w.word.length : w.startCol
            return w.startRow >= 0 && w.startCol >= 0 && endRow <= height && endCol <= width
        })

        const grid: any[][] = createEmptyGrid(width, height)

        finalWords.forEach(w => {
            for (let i = 0; i < w.word.length; i++) {
                const r = w.direction === 'across' ? w.startRow : w.startRow + i
                const c = w.direction === 'across' ? w.startCol + i : w.startCol
                if (grid[r] && grid[r][c]) {
                    grid[r][c].letter = w.word[i]
                    grid[r][c].isBlocked = false
                    grid[r][c].wordIds.push(w.id)
                }
            }
        })

        console.log(`Generated Grid: ${finalWords.length} words`)
        return { width, height, words: finalWords, grid }

    } catch (error) {
        console.error("Layout Gen Error:", error)
        return { width: 10, height: 10, words: [], grid: createEmptyGrid(10, 10) }
    }
}

function createEmptyGrid(width: number, height: number) {
    return Array(Math.floor(height)).fill(null).map((_, r) =>
        Array(Math.floor(width)).fill(null).map((_, c) => ({
            letter: '', userLetter: '', isBlocked: true, wordIds: [], row: r, col: c
        }))
    )
}

function canPlace(word: string, row: number, col: number, direction: 'across' | 'down', gridMap: Map<string, string>): boolean {
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i
        const c = direction === 'across' ? col + i : col
        const char = word[i]
        const current = gridMap.get(`${r},${c}`)

        if (current && current !== char) return false

        if (!current) {
            const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]]
            for (const [dr, dc] of neighbors) {
                if (gridMap.has(`${r + dr},${c + dc}`)) return false
            }
        }
    }
    const rStart = direction === 'across' ? row : row - 1
    const cStart = direction === 'across' ? col - 1 : col
    if (gridMap.has(`${rStart},${cStart}`)) return false

    const rEnd = direction === 'across' ? row : row + word.length
    const cEnd = direction === 'across' ? col + word.length : col
    if (gridMap.has(`${rEnd},${cEnd}`)) return false

    return true
}

function place(word: string, row: number, col: number, direction: 'across' | 'down', gridMap: Map<string, string>) {
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i
        const c = direction === 'across' ? col + i : col
        gridMap.set(`${r},${c}`, word[i])
    }
}


// ==========================================
// PARSER
// ==========================================

function parseBlocks(text: string): ImportBlock[] {
    const lines = text.split('\n')
    const blocks: ImportBlock[] = []
    let currentBlock: ImportBlock | null = null

    for (let line of lines) {
        line = line.trim()
        if (!line) continue

        // Detect tags like [PALAVRAS-CRUZADAS] or [ Palavras Cruzadas ]
        const tagMatch = line.match(/^\[(.*?)\]/)
        if (tagMatch) {
            if (currentBlock) blocks.push(currentBlock)

            // Normalize tag: remove accents, spaces/dashes to underscore
            const rawTag = tagMatch[1].trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .toUpperCase()
            const tag = rawTag.replace(/[\s-]/g, '_')

            let type: ImportBlock['type'] | null = null
            if (tag === 'PALAVRAS_CRUZADAS') type = 'CROSSWORD'
            else if (tag === 'FORCA_MEDICA') type = 'HANGMAN'
            else if (tag === 'CACA_AOS_ERROS' || tag === 'CACA_ERROS') type = 'ERROR_HUNT'

            if (type) {
                currentBlock = { type, data: {} }
            } else {
                currentBlock = null
            }
        } else if (currentBlock) {
            const separatorIndex = line.indexOf(':')
            if (separatorIndex !== -1) {
                // Normalize key: remove accents, spaces/dashes to underscore
                const rawKey = line.substring(0, separatorIndex).trim()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .toUpperCase()
                const key = rawKey.replace(/[\s-]/g, '_')
                const value = line.substring(separatorIndex + 1).trim()
                currentBlock.data[key] = value
            }
        }
    }
    if (currentBlock) blocks.push(currentBlock)
    return blocks
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const content = body.content
        console.log('--- START IMPORT ---')

        if (!content) return NextResponse.json({ error: 'Conteúdo vazio' }, { status: 400 })

        const blocks = parseBlocks(content)
        console.log(`Parsed ${blocks.length} blocks`)

        const db = await getDb()
        const summary = { crossword: 0, hangman: 0, errorHunt: 0 }

        for (const block of blocks) {
            const d = block.data
            const moduleName = d['MODULO'] || 'Geral'
            const topicName = d['TOPICO'] || 'Geral'
            const difficulty = (d['DIFICULDADE'] || 'medio').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') as any

            if (block.type === 'CROSSWORD') {
                console.log('Processing Crossword Block...')
                const rawWords = d['PALAVRAS'] || ''
                console.log('Raw Words Input:', rawWords)

                const wordsList = rawWords.split(';').map(w => w.trim()).filter(w => w)
                const clue = d['DICA'] || 'Sem dica'

                if (wordsList.length > 0) {
                    const topicId = await ensureTopic(db, moduleName, topicName, 'crossword')

                    const { width, height, words, grid } = generateCrosswordLayout(wordsList)

                    if (words.length > 0) {
                        // Assign clues
                        words.forEach(w => {
                            // Normalized key for Dica-Word: DICA_WORD
                            w.clue = d[`DICA_${w.word}`] || clue
                        })

                        const puzzle = {
                            title: d['TITULO'] || `Cross: ${wordsList[0]}...`,
                            description: `Palavras cruzadas sobre ${topicName}`,
                            module: moduleName,
                            topic: topicName,
                            topicId: topicId,
                            difficulty: ['facil', 'medio', 'dificil'].includes(difficulty) ? difficulty : 'medio',
                            words,
                            grid,
                            width,
                            height,
                            createdAt: new Date()
                        }
                        await db.collection('games_crosswords').insertOne(puzzle)
                        summary.crossword++
                        console.log('Crossword Saved!')
                    } else {
                        console.error('FAILED: No words placed for crossword')
                    }
                } else {
                    console.error('FAILED: No words list extracted')
                }
            }

            if (block.type === 'HANGMAN') {
                const word = (d['RESPOSTA'] || '').toUpperCase()
                if (word) {
                    const topicId = await ensureTopic(db, moduleName, topicName, 'hangman')

                    const item = {
                        module: moduleName,
                        topic: topicName,
                        topicId: topicId,
                        theme: d['TEMA'] || topicName,
                        word: word,
                        hint: d['DICA'] || '',
                        description: d['DESCRICAO'] || '',
                        explanation: d['EXPLICACAO'] || '',
                        difficulty: ['facil', 'medio', 'dificil'].includes(difficulty) ? difficulty : 'medio',
                        createdAt: new Date()
                    }
                    await db.collection('games_hangman').insertOne(item)
                    summary.hangman++
                }
            }

            if (block.type === 'ERROR_HUNT') {
                const statement = d['FRASE']
                const correct = d['FRASE_CORRIGIDA'] || d['RESPOSTA'] || d['CORRECAO']

                const keywords = (d['PALAVRAS_CHAVE'] || '').split(';').map(k => k.trim())

                if (statement) {
                    const topicId = await ensureTopic(db, moduleName, topicName, 'error-hunt')

                    const item = {
                        module: moduleName,
                        topic: topicName,
                        topicId: topicId,
                        statement: statement,
                        correctAnswer: correct || 'Correção não fornecida',
                        keywords: keywords,
                        explanation: d['EXPLICACAO'] || '',
                        examTip: d['DICA_DE_PROVA'] || '',
                        hint: d['DICA'] || '',
                        difficulty: ['facil', 'medio', 'dificil'].includes(difficulty) ? difficulty : 'medio',
                        type: 'correction',
                        createdAt: new Date()
                    }
                    await db.collection('games_error_hunt').insertOne(item)
                    summary.errorHunt++
                }
            }
        }

        console.log('--- IMPORT END ---')
        return NextResponse.json({
            success: true,
            summary: `Importado: ${summary.crossword} puzzles, ${summary.hangman} palavras, ${summary.errorHunt} caça-erros.`
        })

    } catch (error: any) {
        console.error('Import error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
