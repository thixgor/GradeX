/**
 * O relógio da plataforma. Um só, e é o de Brasília.
 *
 * ## O problema
 *
 * O código roda em três lugares com três relógios diferentes:
 *
 *  - **O servidor** (funções da Vercel) roda em **UTC**. Nenhuma variável `TZ`
 *    é configurada, e não adianta configurar: a região do deploy pode mudar.
 *  - **O navegador do aluno** roda no fuso do aparelho dele — quase sempre
 *    Brasília, mas não quando ele viaja, usa VPN ou tem o relógio errado.
 *  - **O banco** guarda instantes em UTC, que é o certo.
 *
 * `new Date().getDate()`, `toLocaleDateString()` e `setHours(0,0,0,0)` usam o
 * fuso de QUEM EXECUTA. No servidor, isso é UTC — três horas à frente de
 * Brasília. As consequências não são cosméticas:
 *
 *  - A cota diária do aluno virava às 21h, não à meia-noite: entre 21h e 00h
 *    ele ganhava um dia novo que, para ele, ainda era o mesmo dia.
 *  - Um PDF gerado às 22h saía datado do dia seguinte.
 *  - Um gráfico agrupado por dia jogava tudo o que aconteceu depois das 21h
 *    no dia errado.
 *  - "Abriu o checkout às 14h" era, para o admin, 11h.
 *
 * ## A regra
 *
 * Data que uma PESSOA lê ou sobre a qual o sistema decide ("hoje", "este mês",
 * "o dia da entrega") passa por aqui. Instante guardado no banco continua em
 * UTC — o fuso é da leitura, não do armazenamento.
 *
 * O `Intl` faz o trabalho, com `timeZone` fixo: o Brasil não observa horário de
 * verão desde 2019, mas se voltar, tudo aqui continua certo sem ninguém
 * lembrar deste arquivo.
 */

export const FUSO_BRASILIA = 'America/Sao_Paulo'

const MS_POR_DIA = 24 * 60 * 60 * 1000

const partesDoRelogio = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_BRASILIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export interface RelogioBrasilia {
  /** "AAAA-MM-DD" */
  dia: string
  /** "HH:MM" */
  hora: string
  /** Minutos desde a meia-noite de Brasília. */
  minutos: number
}

/** Data e hora de Brasília no instante dado (padrão: agora). */
export function relogioBrasilia(instante: Date = new Date()): RelogioBrasilia {
  const partes = partesDoRelogio.formatToParts(instante)
  const pegar = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '00'

  // `en-CA` já entrega o dia em ISO; `hour` aparece como 24 à meia-noite em
  // alguns runtimes e precisa virar 00 para o "HH:MM" continuar comparável
  // como texto.
  const horas = pegar('hour') === '24' ? '00' : pegar('hour')
  const minutos = pegar('minute')

  return {
    dia: `${pegar('year')}-${pegar('month')}-${pegar('day')}`,
    hora: `${horas}:${minutos}`,
    minutos: Number(horas) * 60 + Number(minutos),
  }
}

/** O dia de calendário em Brasília, "AAAA-MM-DD". */
export function diaEmBrasilia(instante: Date = new Date()): string {
  return relogioBrasilia(instante).dia
}

/** Dois instantes caem no mesmo dia de Brasília? */
export function mesmoDiaEmBrasilia(a: Date, b: Date): boolean {
  return diaEmBrasilia(a) === diaEmBrasilia(b)
}

/**
 * O instante em que começou o dia de Brasília que contém `instante`.
 *
 * Substitui o `setHours(0, 0, 0, 0)`, que no servidor devolve a meia-noite de
 * UTC — 21h do dia anterior em Brasília. Como o resultado é um `Date` (um
 * instante), ele serve direto num filtro `{ $gte: ... }` do Mongo.
 */
export function inicioDoDiaEmBrasilia(instante: Date = new Date()): Date {
  const { dia } = relogioBrasilia(instante)
  return new Date(`${dia}T00:00:00${offsetDeBrasilia(instante)}`)
}

/** O começo do dia seguinte — o fim exclusivo de "hoje". */
export function inicioDoDiaSeguinteEmBrasilia(instante: Date = new Date()): Date {
  return inicioDoDiaEmBrasilia(new Date(inicioDoDiaEmBrasilia(instante).getTime() + MS_POR_DIA + 60_000))
}

/**
 * O deslocamento de Brasília naquele instante, como "-03:00".
 *
 * Calculado do `Intl` em vez de fixo em `-03:00` porque é o que mantém a conta
 * certa se o horário de verão voltar — e é barato: uma formatação por chamada.
 */
export function offsetDeBrasilia(instante: Date = new Date()): string {
  const nome = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO_BRASILIA,
    timeZoneName: 'longOffset',
  })
    .formatToParts(instante)
    .find((p) => p.type === 'timeZoneName')?.value

  // "GMT-03:00" → "-03:00". Sem o nome (runtime antigo), cai no offset do
  // Brasil sem horário de verão, que é o vigente desde 2019.
  const encontrado = nome?.replace('GMT', '').trim()
  return encontrado && /^[+-]\d{2}:\d{2}$/.test(encontrado) ? encontrado : '-03:00'
}

/**
 * Uma data-hora escrita para gente, no fuso de Brasília.
 *
 * É o substituto de `toLocaleString('pt-BR', …)` sem `timeZone`: aquele usa o
 * fuso de quem executa, que no servidor é UTC.
 */
export function formatarEmBrasilia(
  instante: Date | string | number | null | undefined,
  opcoes: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' },
): string {
  if (instante === null || instante === undefined) return '—'
  const data = instante instanceof Date ? instante : new Date(instante)
  if (!Number.isFinite(data.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { ...opcoes, timeZone: FUSO_BRASILIA }).format(data)
}

/** Só a data: "10/05/2026". */
export function dataEmBrasilia(instante: Date | string | number | null | undefined): string {
  return formatarEmBrasilia(instante, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Só a hora: "14:05". */
export function horaEmBrasilia(instante: Date | string | number | null | undefined): string {
  return formatarEmBrasilia(instante, { hour: '2-digit', minute: '2-digit' })
}
