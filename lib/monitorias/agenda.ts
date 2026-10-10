/**
 * Agenda do monitor — tudo em horário de Brasília, tudo puro (sem banco).
 *
 * Como funciona, com um exemplo:
 *  - O monitor diz: "segunda, 19:00–22:00".
 *  - O aluno quer segunda 20/10 às 19:30, por 90 min.
 *  - `cabeNaDisponibilidade` confere que 19:30–21:00 está dentro de 19:00–22:00
 *    naquele dia da semana (em Brasília, não em UTC!).
 *  - `blocosDaAula` quebra 19:30–21:00 em blocos de 30 min: 19:30, 20:00, 20:30
 *    (+ o intervalo de folga antes/depois). Cada bloco vira um documento com
 *    índice único (tutorId, inicioBloco) — se outro aluno já pegou 20:00, o
 *    banco recusa o segundo, e não existe "agendamento duplo" nem com dois
 *    cliques no mesmo milissegundo.
 */

import { offsetDeBrasilia, relogioBrasilia } from '@/lib/fuso-brasilia'
import type { Disponibilidade, JanelaSemanal } from './tipos'

export const BLOCO_MIN = 30
const MS_MIN = 60_000

export const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const NOMES_DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function hhmmParaMinutos(hhmm: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!m) return NaN
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 24 || min > 59 || (h === 24 && min !== 0)) return NaN
  return h * 60 + min
}

export function minutosParaHhmm(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** "2026-10-20" + "19:30" (Brasília) → instante UTC. */
export function instanteDeBrasilia(dia: string, hhmm: string): Date {
  // O offset é o do meio-dia daquele dia: estável mesmo se o horário de verão voltar.
  const referencia = new Date(`${dia}T12:00:00-03:00`)
  return new Date(`${dia}T${hhmm}:00${offsetDeBrasilia(referencia)}`)
}

/** Dia da semana (0 = domingo) de um "AAAA-MM-DD" — calendário puro, sem fuso. */
export function diaDaSemana(dia: string): number {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay()
}

export function somarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split('-').map(Number)
  const data = new Date(Date.UTC(a, m - 1, d + n))
  return data.toISOString().slice(0, 10)
}

/** Janelas válidas: HH:MM em blocos de 30, início < fim, sem sobreposição no mesmo dia. */
export function validarJanelas(janelas: JanelaSemanal[]): string | null {
  const porDia = new Map<number, Array<[number, number]>>()
  for (const janela of janelas) {
    if (!Number.isInteger(janela.dia) || janela.dia < 0 || janela.dia > 6) return 'Dia da semana inválido.'
    const ini = hhmmParaMinutos(janela.inicio)
    const fim = hhmmParaMinutos(janela.fim)
    if (!Number.isFinite(ini) || !Number.isFinite(fim)) return 'Horário inválido (use HH:MM).'
    if (ini % BLOCO_MIN !== 0 || fim % BLOCO_MIN !== 0) return 'Use horários cheios ou meia hora (ex.: 19:00, 19:30).'
    if (ini >= fim) return `Em ${NOMES_DIAS[janela.dia]}, o início deve ser antes do fim.`
    const lista = porDia.get(janela.dia) || []
    if (lista.some(([a, b]) => ini < b && a < fim)) return `Há horários sobrepostos em ${NOMES_DIAS[janela.dia]}.`
    lista.push([ini, fim])
    porDia.set(janela.dia, lista)
  }
  return null
}

// ─── Grade do editor de agenda (células de 30 min) ──────────────────────

/** Chave de uma célula da grade: dia da semana + minuto de início ("1:1140" = seg 19:00). */
export function chaveCelula(dia: number, minuto: number): string {
  return `${dia}:${minuto}`
}

/** Janelas semanais → células de 30 min marcadas. */
export function janelasParaCelulas(janelas: JanelaSemanal[]): Set<string> {
  const celulas = new Set<string>()
  for (const j of janelas) {
    const ini = hhmmParaMinutos(j.inicio)
    const fim = hhmmParaMinutos(j.fim)
    if (!Number.isFinite(ini) || !Number.isFinite(fim)) continue
    for (let m = Math.floor(ini / BLOCO_MIN) * BLOCO_MIN; m < fim; m += BLOCO_MIN) celulas.add(chaveCelula(j.dia, m))
  }
  return celulas
}

/** Células marcadas → janelas contínuas, ordenadas (o formato que o servidor valida). */
export function celulasParaJanelas(celulas: Set<string>): JanelaSemanal[] {
  const janelas: JanelaSemanal[] = []
  for (let dia = 0; dia < 7; dia++) {
    let inicio: number | null = null
    for (let m = 0; m <= 24 * 60; m += BLOCO_MIN) {
      const marcada = m < 24 * 60 && celulas.has(chaveCelula(dia, m))
      if (marcada && inicio === null) inicio = m
      if (!marcada && inicio !== null) {
        janelas.push({ dia, inicio: minutosParaHhmm(inicio), fim: minutosParaHhmm(m) })
        inicio = null
      }
    }
  }
  return janelas
}

/** Horas por semana disponíveis (para o resumo do editor). */
export function horasPorSemana(celulas: Set<string>): number {
  return (celulas.size * BLOCO_MIN) / 60
}

/**
 * O intervalo [inicio, inicio+duracao) cabe numa janela do monitor naquele dia
 * de Brasília (e o dia não está bloqueado)? Aula atravessando a meia-noite não
 * é aceita — simplifica a agenda e quase ninguém dá aula assim.
 */
export function cabeNaDisponibilidade(disp: Disponibilidade, inicio: Date, duracaoMin: number): boolean {
  const relogio = relogioBrasilia(inicio)
  if (disp.diasBloqueados.includes(relogio.dia)) return false
  const ini = relogio.minutos
  const fim = ini + duracaoMin
  if (fim > 24 * 60) return false
  const dia = diaDaSemana(relogio.dia)
  return disp.semanal.some((j) => j.dia === dia && hhmmParaMinutos(j.inicio) <= ini && fim <= hhmmParaMinutos(j.fim))
}

/** Blocos de 30 min que a aula ocupa, incluindo a folga antes e depois. */
export function blocosDaAula(inicio: Date, duracaoMin: number, intervaloMin = 0): Date[] {
  const folga = Math.ceil(Math.max(0, intervaloMin) / BLOCO_MIN) * BLOCO_MIN
  // Sempre na grade de 30 min: um início "quebrado" (19:00:00.001) cobre o
  // bloco onde cai, em vez de gerar blocos deslocados que escapariam do
  // índice único e permitiriam duas aulas no mesmo horário.
  const passo = BLOCO_MIN * MS_MIN
  const de = Math.floor((inicio.getTime() - folga * MS_MIN) / passo) * passo
  const ate = Math.ceil((inicio.getTime() + (duracaoMin + folga) * MS_MIN) / passo) * passo
  const blocos: Date[] = []
  for (let t = de; t < ate; t += BLOCO_MIN * MS_MIN) blocos.push(new Date(t))
  return blocos
}

export interface HorarioLivre {
  /** Instante UTC (ISO) do início. */
  inicio: string
  /** "AAAA-MM-DD" em Brasília. */
  dia: string
  /** "HH:MM" em Brasília. */
  hora: string
}

/**
 * Horários de início possíveis nos próximos `dias`, para uma duração.
 *
 * `ocupados` são os blocos já tomados (hold ou firme). Um início só entra se
 * TODOS os blocos da aula (com folga) estiverem livres e dentro da janela.
 */
export function horariosLivres(input: {
  disp: Disponibilidade
  duracaoMin: number
  ocupados: Set<number>
  agora: Date
  antecedenciaMinHoras: number
  dias: number
  passoInicioMin?: number
}): HorarioLivre[] {
  const { disp, duracaoMin, ocupados, agora, antecedenciaMinHoras, dias } = input
  const passo = input.passoInicioMin ?? BLOCO_MIN
  const limite = agora.getTime() + antecedenciaMinHoras * 60 * MS_MIN
  const hoje = relogioBrasilia(agora).dia
  const livres: HorarioLivre[] = []

  for (let i = 0; i < dias; i++) {
    const dia = somarDias(hoje, i)
    if (disp.diasBloqueados.includes(dia)) continue
    const semana = diaDaSemana(dia)
    for (const janela of disp.semanal.filter((j) => j.dia === semana)) {
      const ini = hhmmParaMinutos(janela.inicio)
      const fim = hhmmParaMinutos(janela.fim)
      for (let m = ini; m + duracaoMin <= fim; m += passo) {
        const hora = minutosParaHhmm(m)
        const inicio = instanteDeBrasilia(dia, hora)
        if (inicio.getTime() < limite) continue
        const blocos = blocosDaAula(inicio, duracaoMin, disp.intervaloMin)
        if (blocos.some((b) => ocupados.has(b.getTime()))) continue
        livres.push({ inicio: inicio.toISOString(), dia, hora })
      }
    }
  }
  return livres.sort((a, b) => a.inicio.localeCompare(b.inicio))
}

/** Durações oferecidas no agendamento direto: min, min+passo, …, max. */
export function duracoesPermitidas(minMin: number, maxMin: number, passoMin: number): number[] {
  const lista: number[] = []
  for (let d = minMin; d <= maxMin; d += passoMin) lista.push(d)
  return lista
}

export function formatarDuracao(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h && m) return `${h}h${String(m).padStart(2, '0')}`
  if (h) return `${h}h`
  return `${m} min`
}

export const DISPONIBILIDADE_VAZIA: Disponibilidade = { semanal: [], diasBloqueados: [], intervaloMin: 0 }

/** Início válido para uma aula: na grade de 30 min (horário cheio ou meia hora). */
export function inicioNaGrade(inicio: Date): boolean {
  return Number.isFinite(inicio.getTime()) && inicio.getTime() % (BLOCO_MIN * MS_MIN) === 0
}

/** Até quantos dias à frente se pode marcar uma aula. */
export const DIAS_MAXIMOS_DE_ANTECEDENCIA = 90
