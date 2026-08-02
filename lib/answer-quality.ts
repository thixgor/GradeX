/**
 * Detecção de respostas "lixo" em campos de texto livre (formulários públicos).
 *
 * O problema: gente que só quer o material do outro lado do formulário digita
 * "ajwisajsjiawji" / "aiwjdjaidjaiwji" / "asdfasdf" e envia. Isso polui o banco
 * de respostas e não tem valor nenhum pra quem lê depois.
 *
 * A abordagem é heurística e propositalmente CONSERVADORA: é muito pior barrar
 * uma resposta legítima do que deixar passar uma bagunça. Por isso nenhum sinal
 * isolado reprova uma palavra — é preciso somar evidências (ver GIBBERISH_SCORE).
 *
 * O módulo é isomórfico (sem dependência de Node/DOM) de propósito: o cliente
 * usa pra avisar em tempo real e a API usa como validação de verdade, os dois
 * com exatamente o mesmo resultado.
 */

export type AnswerQualityIssue =
  | 'gibberish'     // parece teclado amassado / letras aleatórias
  | 'repeated'      // "aaaaaa", "abcabcabc", mesma palavra repetida
  | 'no-content'    // só pontuação/símbolos

export interface AnswerQualityResult {
  ok: boolean
  issue: AnswerQualityIssue | null
  message: string | null
  /** 0..1 — confiança de que a resposta é lixo (útil pra sinalizar no admin). */
  score: number
}

const OK: AnswerQualityResult = { ok: true, issue: null, message: null, score: 0 }

const MESSAGES: Record<AnswerQualityIssue, string> = {
  gibberish: 'Essa resposta parece aleatória. Escreva com suas palavras — nem que seja curtinho.',
  repeated: 'Essa resposta parece só repetição. Escreva algo de verdade, por favor.',
  'no-content': 'Escreva uma resposta com palavras, não só símbolos.',
}

/** `y` entra como vogal pra não penalizar nomes (Yasmin, Kelly, Wesley...). */
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y'])

/** Letras que praticamente só aparecem em estrangeirismos e nomes próprios. */
const NON_NATIVE = new Set(['k', 'w', 'y', 'j'])

const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

/**
 * Estrangeirismos comuns que a heurística acusaria (encontros consonantais que
 * não existem em português). Sem essa lista, "whatsapp" e "workshop" viram
 * falso positivo.
 */
const LOANWORDS = new Set([
  'whatsapp', 'zap', 'workshop', 'work', 'know', 'howto', 'skill', 'skills',
  'link', 'links', 'kit', 'kits', 'show', 'shows', 'shopping', 'shop',
  'site', 'sites', 'website', 'browser', 'download', 'upload', 'backup',
  'software', 'hardware', 'notebook', 'smartphone', 'tablet', 'wifi',
  'feedback', 'briefing', 'coach', 'coaching', 'mindset', 'brainstorm',
  'insight', 'insights', 'checklist', 'deadline', 'budget', 'cashback',
  'delivery', 'drive', 'cloud', 'chat', 'chatbot', 'spam', 'click', 'clicks',
  'print', 'prints', 'screenshot', 'stories', 'story', 'reels', 'post', 'posts',
  'blog', 'podcast', 'live', 'lives', 'stream', 'streaming', 'playlist',
  'youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'google', 'gmail',
  'outlook', 'hotmail', 'netflix', 'spotify', 'discord', 'telegram', 'linkedin',
  'marketing', 'network', 'networking', 'startup', 'freelance', 'freelancer',
  'hobby', 'hobbies', 'happy', 'hour', 'coffee', 'break', 'crossfit',
  'dashboard', 'layout', 'login', 'logout', 'flyer', 'banner', 'hashtag',
  'trend', 'trends', 'target', 'ranking', 'ranks', 'review', 'reviews',
])

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function maxRunOf(word: string, predicate: (ch: string) => boolean): number {
  let best = 0
  let run = 0
  for (const ch of word) {
    if (predicate(ch)) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

function maxSameCharRun(word: string): number {
  let best = 0
  let run = 0
  for (let i = 0; i < word.length; i++) {
    run = i > 0 && word[i] === word[i - 1] ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}

/**
 * Maior sequência de teclas vizinhas na mesma fileira (asdf, qwert, lkjh...).
 * Só conta a sequência que percorre 3+ teclas DIFERENTES: "asas" também é uma
 * cadeia de vizinhas, mas é uma palavra de verdade — quem amassa o teclado
 * varre a fileira, não fica oscilando entre duas letras.
 */
function maxKeyboardRun(word: string): number {
  let best = 1
  let start = 0
  for (let i = 1; i <= word.length; i++) {
    const prev = word[i - 1]
    const cur = word[i]
    const row = cur ? KEYBOARD_ROWS.find(r => r.includes(prev) && r.includes(cur)) : undefined
    const adjacent = !!row && Math.abs(row.indexOf(cur) - row.indexOf(prev)) === 1
    if (!adjacent) {
      const slice = word.slice(start, i)
      if (new Set(slice).size >= 3 && slice.length > best) best = slice.length
      start = i
    }
  }
  return best
}

/**
 * "asdasdasd" / "abababab" / "asdfasdf": a palavra inteira é uma unidade curta
 * repetida. Unidades de 1-2 letras precisam de 3 repetições pra não pegar
 * palavras reais tipo "papa" e "coco"; de 3-4 letras, 2 já bastam.
 */
function isRepeatedUnit(word: string): boolean {
  for (let size = 1; size <= 4; size++) {
    const minRepeats = size >= 3 ? 2 : 3
    if (word.length < size * minRepeats || word.length % size !== 0) continue
    const unit = word.slice(0, size)
    let all = true
    for (let i = size; i < word.length; i += size) {
      if (word.slice(i, i + size) !== unit) { all = false; break }
    }
    if (all) return true
  }
  return false
}

/**
 * Pontuação de suspeita de uma palavra. Nenhum sinal sozinho chega no limite —
 * é preciso combinar pelo menos dois. Palavras com menos de 4 letras nunca são
 * avaliadas ("sim", "não", "ok", "nda", nomes curtos).
 */
const GIBBERISH_SCORE = 3

function wordSuspicion(word: string): number {
  if (word.length < 4 || LOANWORDS.has(word)) return 0

  let score = 0

  const isVowel = (ch: string) => VOWELS.has(ch)
  const vowelCount = [...word].filter(isVowel).length

  // Sem nenhuma vogal — nenhuma palavra do português passa disso.
  if (vowelCount === 0) score += 2

  const consonantRun = maxRunOf(word, ch => !isVowel(ch))
  if (consonantRun >= 5) score += 3
  else if (consonantRun >= 4) score += 2

  const vowelRun = maxRunOf(word, isVowel)
  if (vowelRun >= 4) score += 2

  const sameRun = maxSameCharRun(word)
  if (sameRun >= 4) score += 2.5
  else if (sameRun === 3) score += 1.5

  // Encontros consonantais com j/k/w (e "q" sem "u"): impossíveis em português.
  // O `j` é o sinal mais forte — em português ele SEMPRE vem antes de vogal.
  let clusterPenalty = 0
  for (let i = 1; i < word.length; i++) {
    const a = word[i - 1]
    const b = word[i]
    if (isVowel(a) || isVowel(b)) continue
    if (a === 'j' || b === 'j') clusterPenalty += 1.5
    else if (NON_NATIVE.has(a) || NON_NATIVE.has(b)) clusterPenalty += 0.75
  }
  for (let i = 0; i < word.length; i++) {
    if (word[i] === 'q' && word[i + 1] !== 'u') clusterPenalty += 1.5
  }
  score += Math.min(clusterPenalty, 3)

  // Densidade de letras não nativas (k, w, y, j) muito acima do normal.
  const foreign = [...word].filter(ch => NON_NATIVE.has(ch)).length
  if (foreign / word.length > 0.25) score += 1

  // Teclado amassado: "asdf", "qwert", "lkjh". Uma sequência de 3 teclas
  // vizinhas ainda acontece por acaso, então só soma peso de verdade a partir
  // de 4 — e ganha um extra quando a fileira domina a palavra inteira.
  const keyboardRun = maxKeyboardRun(word)
  if (keyboardRun >= 4) {
    score += 2.5
    if (keyboardRun / word.length >= 0.8) score += 1.5
  } else if (keyboardRun === 3) {
    score += 1.5
  }

  if (isRepeatedUnit(word)) score += 2.5

  return score
}

/** Exportado só pra testes/depuração: diz se UMA palavra parece aleatória. */
export function looksLikeGibberishWord(word: string): boolean {
  return wordSuspicion(stripAccents(word.toLowerCase())) >= GIBBERISH_SCORE
}

export interface CheckTextAnswerOptions {
  /** Ignora a verificação (ex.: campos que não são texto livre). */
  skip?: boolean
}

/**
 * Avalia uma resposta de texto livre. Retorna `ok: true` sempre que houver
 * qualquer dúvida razoável — a ideia é barrar só o que é obviamente lixo.
 */
export function checkTextAnswer(raw: unknown, options: CheckTextAnswerOptions = {}): AnswerQualityResult {
  if (options.skip) return OK
  if (typeof raw !== 'string') return OK

  const text = raw.trim()
  if (!text) return OK

  // URLs e e-mails têm forma própria (e sequências "estranhas" legítimas).
  if (/https?:\/\/|www\.|@\S+\.\w/i.test(text)) return OK

  const normalized = stripAccents(text.toLowerCase())
  const letters = normalized.replace(/[^a-z]/g, '')

  // Só pontuação/símbolos: "...", "---", "??".
  if (!letters && !/\d/.test(text)) {
    return { ok: false, issue: 'no-content', message: MESSAGES['no-content'], score: 1 }
  }

  // Respostas muito curtas (ou numéricas) passam direto: "42", "sim", "R$ 300".
  if (letters.length < 4) return OK

  const distinct = new Set(letters).size
  if ((distinct === 1 && letters.length >= 3) || (distinct <= 2 && letters.length >= 5)) {
    return { ok: false, issue: 'repeated', message: MESSAGES.repeated, score: 1 }
  }

  const words = normalized.match(/[a-z]+/g) || []

  // Mesma palavra repetida ("teste teste teste teste").
  if (words.length >= 4) {
    const counts = new Map<string, number>()
    for (const w of words) counts.set(w, (counts.get(w) || 0) + 1)
    const [, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    if (counts.size <= 2 && topCount >= 4) {
      return { ok: false, issue: 'repeated', message: MESSAGES.repeated, score: 0.9 }
    }
  }

  // Proporção do texto (em letras) que caiu na régua de "aleatório".
  const evaluated = words.filter(w => w.length >= 4)
  if (evaluated.length === 0) return OK

  let suspectLetters = 0
  let totalLetters = 0
  for (const word of evaluated) {
    totalLetters += word.length
    if (wordSuspicion(word) >= GIBBERISH_SCORE) suspectLetters += word.length
  }

  const ratio = totalLetters ? suspectLetters / totalLetters : 0
  if (ratio >= 0.6 && suspectLetters >= 4) {
    return { ok: false, issue: 'gibberish', message: MESSAGES.gibberish, score: Math.min(1, ratio) }
  }

  return { ...OK, score: ratio }
}

/** Tipos de pergunta em que a checagem de texto livre faz sentido. */
export function isFreeTextQuestion(questionType?: string): boolean {
  return questionType === 'short-text' || questionType === 'long-text'
}
