/**
 * Pedidos de monitoria ("demandas"): o aluno diz o que precisa e os monitores
 * vêm até ele. Regras puras (sem banco), usadas no servidor e no navegador.
 *
 * Desenho: o pedido é só um anúncio ao contrário. Quando um monitor responde,
 * nasce uma reserva de NEGOCIAÇÃO comum, com o pedido copiado nela; dali em
 * diante valem o chat, a proposta, o contrato, o PIX, a garantia e o
 * reembolso que já existem. Nenhum dinheiro passa pelo pedido.
 */

import { z } from 'zod'
import { formatarCentavos } from './dinheiro'
import { formatarDuracao } from './agenda'

export const QUANDO_DEMANDA = {
  logo: 'O quanto antes',
  esta_semana: 'Esta semana',
  proxima_semana: 'Próxima semana',
  sem_pressa: 'Sem pressa',
} as const
export type QuandoDemanda = keyof typeof QUANDO_DEMANDA

export const PERIODOS_DEMANDA = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' } as const
export type PeriodoDemanda = keyof typeof PERIODOS_DEMANDA

/** Atalhos de valor por pessoa (aula inteira), em centavos. */
export const VALORES_SUGERIDOS_CENTAVOS = [3000, 4000, 5000, 6000, 8000]
export const DURACOES_DEMANDA = [60, 90, 120]
export const MAX_PESSOAS_DEMANDA = 10

/** Pedidos abertos ao mesmo tempo por aluno. */
export const MAX_DEMANDAS_ABERTAS = 3
/** Respostas por pedido: o aluno escolhe entre poucos, sem virar spam. */
export const MAX_RESPOSTAS_POR_DEMANDA = 8

/** Matérias que sempre aparecem como atalho, além das que já têm anúncio. */
export const MATERIAS_COMUNS = [
  'Anatomia',
  'Fisiologia',
  'Bioquímica',
  'Histologia',
  'Farmacologia',
  'Patologia',
  'Microbiologia',
  'Imunologia',
  'Semiologia',
  'Clínica Médica',
]

export const CorpoDemanda = z
  .object({
    materia: z.string().trim().min(2).max(60),
    assunto: z.string().trim().max(120).optional().default(''),
    pessoas: z.number().int().min(1).max(MAX_PESSOAS_DEMANDA),
    /** null = "o monitor propõe". */
    valorPorPessoaCentavos: z.number().int().min(1000).max(500_000).nullable(),
    duracaoMin: z.number().int().refine((m) => DURACOES_DEMANDA.includes(m), 'Duração inválida.'),
    quando: z.enum(Object.keys(QUANDO_DEMANDA) as [QuandoDemanda, ...QuandoDemanda[]]),
    periodos: z.array(z.enum(Object.keys(PERIODOS_DEMANDA) as [PeriodoDemanda, ...PeriodoDemanda[]])).max(3).default([]),
  })
  .strict()
export type EntradaDemanda = z.infer<typeof CorpoDemanda>

/** Por quanto tempo o pedido fica no mural. "O quanto antes" não faz sentido por um mês. */
export function expiracaoDaDemanda(quando: QuandoDemanda, agora: Date): Date {
  const dias = quando === 'logo' ? 3 : quando === 'esta_semana' ? 7 : quando === 'proxima_semana' ? 14 : 21
  return new Date(agora.getTime() + dias * 86_400_000)
}

/** Chave de comparação de matéria: sem acento, minúscula, espaços simples. */
export function chaveDaMateria(materia: string): string {
  return materia
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Primeira letra maiúscula, resto como veio ("fisiologia" → "Fisiologia"). */
export function materiaApresentavel(materia: string): string {
  const m = materia.replace(/\s+/g, ' ').trim()
  return m ? m[0].toLocaleUpperCase('pt-BR') + m.slice(1) : m
}

export interface ResumoDemanda {
  materia: string
  assunto?: string
  pessoas: number
  valorPorPessoaCentavos: number | null
  duracaoMin: number
  quando: QuandoDemanda
  periodos: PeriodoDemanda[]
}

/** Uma linha legível: "Fisiologia (ECG) · 3 pessoas · 1h30 · até R$ 40,00 por pessoa · Esta semana, à noite". */
export function resumoDaDemanda(d: ResumoDemanda): string {
  const periodos = d.periodos.length ? `, ${d.periodos.map((p) => PERIODOS_DEMANDA[p].toLowerCase()).join('/')}` : ''
  return [
    d.assunto ? `${d.materia} (${d.assunto})` : d.materia,
    d.pessoas > 1 ? `${d.pessoas} pessoas` : 'Individual',
    formatarDuracao(d.duracaoMin),
    d.valorPorPessoaCentavos ? `até ${formatarCentavos(d.valorPorPessoaCentavos)} por pessoa` : 'valor a propor',
    `${QUANDO_DEMANDA[d.quando]}${periodos}`,
  ].join(' · ')
}

/**
 * O anúncio comporta o pedido? Grupo maior que o anúncio aceita não fecha
 * (a proposta seria recusada lá na frente), então avisamos já na escolha.
 */
export function anuncioAtendeDemanda(
  anuncio: { grupo: { ativo: boolean; maxAlunos: number } },
  demanda: { pessoas: number },
): { ok: true } | { ok: false; motivo: string } {
  const max = anuncio.grupo.ativo ? anuncio.grupo.maxAlunos : 1
  if (demanda.pessoas > max) {
    return {
      ok: false,
      motivo: max === 1 ? `É para ${demanda.pessoas} pessoas: ative "Aula em grupo" neste anúncio.` : `Este anúncio aceita até ${max} alunos; o pedido é para ${demanda.pessoas}.`,
    }
  }
  return { ok: true }
}

/** "há 5 min", "há 3 h", "há 2 dias". */
export function haQuantoTempo(desde: Date, agora: Date): string {
  const min = Math.max(0, Math.floor((agora.getTime() - desde.getTime()) / 60_000))
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
}
