// Cálculo de streak (dias de estudo consecutivos) a partir das datas de
// atividade do usuário. Puro e sem I/O, para ser fácil de testar e reutilizar
// tanto na API de estatísticas quanto no cron de retenção.
//
// Regras:
// - O dia é considerado no fuso de São Paulo (o público é brasileiro).
// - O streak continua "vivo" enquanto o usuário estudou hoje ou ontem. Só
//   quebra quando passa um dia inteiro sem atividade.

const SP_TIMEZONE = 'America/Sao_Paulo'

// Dia no fuso de São Paulo, no formato YYYY-MM-DD.
export function dayKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: SP_TIMEZONE })
}

// Desloca uma chave de dia (YYYY-MM-DD) por N dias, usando aritmética de
// calendário em UTC (seguro porque a chave já é só data, sem hora/fuso).
function shiftDay(key: string, deltaDays: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1, d))
  base.setUTCDate(base.getUTCDate() + deltaDays)
  return base.toISOString().slice(0, 10)
}

export interface StreakResult {
  current: number
  longest: number
  activeToday: boolean
  lastActiveDay: string | null
}

export function computeStreak(dates: Array<Date | null | undefined>, now: Date = new Date()): StreakResult {
  const days = new Set<string>()
  for (const dt of dates) {
    if (dt instanceof Date && !Number.isNaN(dt.getTime())) days.add(dayKey(dt))
  }

  if (days.size === 0) {
    return { current: 0, longest: 0, activeToday: false, lastActiveDay: null }
  }

  const today = dayKey(now)
  const yesterday = shiftDay(today, -1)
  const activeToday = days.has(today)

  // Streak atual: começa em hoje (se estudou hoje) ou em ontem (streak ainda
  // vivo). Se não estudou nem hoje nem ontem, o streak zerou.
  let current = 0
  let cursor: string | null = activeToday ? today : days.has(yesterday) ? yesterday : null
  while (cursor && days.has(cursor)) {
    current++
    cursor = shiftDay(cursor, -1)
  }

  // Maior streak histórico.
  const sorted = Array.from(days).sort()
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === shiftDay(sorted[i - 1], 1)) run++
    else run = 1
    if (run > longest) longest = run
  }
  longest = Math.max(longest, current)

  return { current, longest, activeToday, lastActiveDay: sorted[sorted.length - 1] }
}
