/**
 * Calendário de Brasília (America/Sao_Paulo) para avaliações e lembretes.
 *
 * Toda data de avaliação é uma data de CALENDÁRIO, não um instante: "a P1 é dia
 * 12" é a mesma coisa para o aluno em Manaus e para o servidor em `gru1`, e
 * teria que continuar sendo se um dia o deploy mudar de região. Por isso nada
 * aqui usa `new Date(...)` do fuso local do processo — tudo passa por
 * `Intl.DateTimeFormat` com `timeZone` fixo.
 *
 * O Brasil não observa horário de verão desde 2019, mas o `Intl` é usado assim
 * mesmo: se voltar, este arquivo continua certo sem ninguém lembrar dele.
 */

export const FUSO_BRASILIA = 'America/Sao_Paulo'

const MS_POR_DIA = 24 * 60 * 60 * 1000

const formatador = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_BRASILIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

interface RelogioBrasilia {
  /** "AAAA-MM-DD" */
  dia: string
  /** "HH:MM" */
  hora: string
  minutos: number
}

/** Data e hora de Brasília no instante dado (padrão: agora). */
export function relogioBrasilia(instante: Date = new Date()): RelogioBrasilia {
  const partes = formatador.formatToParts(instante)
  const pegar = (tipo: string) => partes.find(p => p.type === tipo)?.value ?? '00'

  // `en-CA` já entrega o dia em ISO; hour 24 aparece à meia-noite em alguns
  // runtimes e precisa virar 00 para o "HH:MM" continuar comparável por string.
  const horas = pegar('hour') === '24' ? '00' : pegar('hour')
  const minutos = pegar('minute')

  return {
    dia: `${pegar('year')}-${pegar('month')}-${pegar('day')}`,
    hora: `${horas}:${minutos}`,
    minutos: Number(horas) * 60 + Number(minutos),
  }
}

/** Só a data de hoje em Brasília, "AAAA-MM-DD". */
export function hojeBrasilia(instante: Date = new Date()): string {
  return relogioBrasilia(instante).dia
}

/** true quando "AAAA-MM-DD" é uma data de calendário real. */
export function isDiaValido(dia: unknown): dia is string {
  if (typeof dia !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return false
  const [ano, mes, diaDoMes] = dia.split('-').map(Number)
  if (mes < 1 || mes > 12 || diaDoMes < 1 || diaDoMes > 31) return false
  const data = new Date(Date.UTC(ano, mes - 1, diaDoMes))
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === diaDoMes
}

/** true quando "HH:MM" é um horário real do relógio de 24h. */
export function isHoraValida(hora: unknown): hora is string {
  if (typeof hora !== 'string' || !/^\d{2}:\d{2}$/.test(hora)) return false
  const [h, m] = hora.split(':').map(Number)
  return h >= 0 && h <= 23 && m >= 0 && m <= 59
}

/**
 * Diferença em dias de calendário entre dois dias ("AAAA-MM-DD").
 * Positivo quando `fim` é depois de `inicio`. Comparar em UTC evita que a
 * subtração caia em cima de uma virada de fuso.
 */
export function diasEntre(inicio: string, fim: string): number {
  const a = Date.parse(`${inicio}T00:00:00Z`)
  const b = Date.parse(`${fim}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.round((b - a) / MS_POR_DIA)
}

/** Quantos dias faltam, hoje em Brasília, para a data dada. Negativo = já passou. */
export function diasAte(dia: string, instante: Date = new Date()): number {
  return diasEntre(hojeBrasilia(instante), dia)
}

/** Soma dias a um "AAAA-MM-DD" e devolve outro "AAAA-MM-DD". */
export function somarDias(dia: string, dias: number): string {
  const base = Date.parse(`${dia}T00:00:00Z`)
  if (Number.isNaN(base)) return dia
  return new Date(base + dias * MS_POR_DIA).toISOString().slice(0, 10)
}

/** Dia da semana de um "AAAA-MM-DD": 0 = domingo … 6 = sábado. */
export function diaDaSemana(dia: string): number {
  const base = Date.parse(`${dia}T00:00:00Z`)
  return Number.isNaN(base) ? 0 : new Date(base).getUTCDay()
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export const DIAS_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const MESES_NOME = MESES.map(m => m.charAt(0).toUpperCase() + m.slice(1))

/** "12 de março" — o formato que cabe num card. */
export function formatarDiaCurto(dia: string): string {
  if (!isDiaValido(dia)) return dia
  const [, mes, diaDoMes] = dia.split('-').map(Number)
  return `${diaDoMes} de ${MESES[mes - 1]}`
}

/** "quarta, 12 de março de 2026" — para o cabeçalho de um dia. */
export function formatarDiaLongo(dia: string): string {
  if (!isDiaValido(dia)) return dia
  const [ano, mes, diaDoMes] = dia.split('-').map(Number)
  return `${DIAS_SEMANA[diaDaSemana(dia)]}, ${diaDoMes} de ${MESES[mes - 1]} de ${ano}`
}

/**
 * "faltam 12 dias", "é amanhã", "é hoje", "foi há 3 dias" — a frase que o aluno
 * lê antes de qualquer número. Sai daqui para o card do calendário e para o
 * corpo do lembrete usarem exatamente a mesma contagem.
 */
export function textoProximidade(dias: number): string {
  if (dias === 0) return 'é hoje'
  if (dias === 1) return 'é amanhã'
  if (dias === -1) return 'foi ontem'
  if (dias > 1) return `faltam ${dias} dias`
  return `foi há ${Math.abs(dias)} dias`
}

export type FaixaProximidade = 'passada' | 'hoje' | 'critica' | 'proxima' | 'distante'

/**
 * Faixa de urgência de uma avaliação. É o que decide a cor do card no
 * calendário e o tom do lembrete — os dois leem a mesma função para nunca
 * discordarem sobre o que é "urgente".
 */
export function faixaProximidade(dias: number): FaixaProximidade {
  if (dias < 0) return 'passada'
  if (dias === 0) return 'hoje'
  if (dias <= 3) return 'critica'
  if (dias <= 14) return 'proxima'
  return 'distante'
}
