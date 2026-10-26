import { dayKey } from '@/lib/streak'

/**
 * Contas da sessão de foco feitas sobre o histórico do aparelho.
 *
 * Puras: recebem o histórico e o "agora" e devolvem números — o painel do
 * cabeçalho, o cartão do painel e o perfil leem das mesmas funções, então o
 * "hoje: 35 min" é o mesmo nos três lugares.
 */

export interface SessaoDoHistorico {
  objective: string
  startedAt: string
  totalTimeMs: number
}

/** As metas oferecidas. `0` é o cronômetro livre. */
export const METAS_DE_FOCO = [25, 50, 90, 0] as const

/** Objetivos de partida para quem nunca escreveu um. */
export const OBJETIVOS_SUGERIDOS = ['Revisar flashcards', 'Resolver questões', 'Ler um material'] as const

const DIA_MS = 86_400_000

/** Minutos de foco por dia nos últimos `dias` dias, do mais antigo para hoje. */
export function minutosPorDia(
  historico: SessaoDoHistorico[],
  agora: Date = new Date(),
  dias = 7,
): Array<{ date: string; minutos: number }> {
  const chaves = Array.from({ length: dias }, (_, i) => dayKey(new Date(agora.getTime() - (dias - 1 - i) * DIA_MS)))
  const soma = new Map(chaves.map(chave => [chave, 0]))
  for (const sessao of historico) {
    const inicio = new Date(sessao.startedAt)
    if (Number.isNaN(inicio.getTime())) continue
    const chave = dayKey(inicio)
    if (!soma.has(chave)) continue
    soma.set(chave, (soma.get(chave) || 0) + Math.max(0, sessao.totalTimeMs || 0) / 60_000)
  }
  return chaves.map(date => ({ date, minutos: Math.round(soma.get(date) || 0) }))
}

/** Dias seguidos com pelo menos uma sessão, terminando hoje ou ontem. */
export function sequenciaDeFoco(historico: SessaoDoHistorico[], agora: Date = new Date()): number {
  const dias = new Set<string>()
  for (const sessao of historico) {
    if ((sessao.totalTimeMs || 0) < 60_000) continue
    const inicio = new Date(sessao.startedAt)
    if (!Number.isNaN(inicio.getTime())) dias.add(dayKey(inicio))
  }
  let cursor = agora.getTime()
  if (!dias.has(dayKey(new Date(cursor)))) cursor -= DIA_MS
  let sequencia = 0
  while (dias.has(dayKey(new Date(cursor)))) {
    sequencia++
    cursor -= DIA_MS
  }
  return sequencia
}

/**
 * Os objetivos para tocar e começar: os últimos que a pessoa escreveu (sem
 * repetir, sem o nome genérico) e, para completar, os de partida.
 */
export function sugestoesDeObjetivo(historico: SessaoDoHistorico[], quantas = 3): string[] {
  const vistos = new Set<string>()
  const lista: string[] = []
  const genericos = /^sess(ã|a)o de foco$/i
  for (const sessao of historico) {
    const texto = (sessao.objective || '').trim()
    const chave = texto.toLowerCase()
    if (!texto || genericos.test(texto) || vistos.has(chave)) continue
    vistos.add(chave)
    lista.push(texto)
    if (lista.length >= quantas) return lista
  }
  for (const sugestao of OBJETIVOS_SUGERIDOS) {
    if (lista.length >= quantas) break
    if (!vistos.has(sugestao.toLowerCase())) lista.push(sugestao)
  }
  return lista
}

/** "42 min", "1h 05", "2h". */
export function formatarMinutos(minutos: number): string {
  const total = Math.max(0, Math.round(minutos))
  if (total < 60) return `${total} min`
  const horas = Math.floor(total / 60)
  const resto = total % 60
  return resto === 0 ? `${horas}h` : `${horas}h ${String(resto).padStart(2, '0')}`
}

/** 12:34 ou 1:02:34. */
export function formatarRelogio(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}
