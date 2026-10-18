/**
 * Formatos que o Gemini devolve (JSON Schema enviado em `response_format`) e a
 * validação do que voltou (zod). O esquema guia o modelo; o zod é quem decide
 * — nada vai para o banco sem passar por ele.
 */

import { z } from 'zod'
import type { FraseTranscrita, ResumoGerado } from './tipos'

// ─── Transcrição de um trecho ───────────────────────────────────────────

export const ESQUEMA_TRANSCRICAO = {
  type: 'object',
  properties: {
    frases: {
      type: 'array',
      description: 'Falas em ordem, cada uma com até ~25 segundos.',
      items: {
        type: 'object',
        properties: {
          inicio_s: { type: 'number', description: 'Segundos desde o início deste áudio.' },
          texto: { type: 'string', description: 'O que foi dito, literalmente. Inaudível vira [inaudível].' },
          incerto: { type: 'boolean', description: 'true se algum termo ou trecho não ficou claro.' },
        },
        required: ['inicio_s', 'texto', 'incerto'],
      },
    },
  },
  required: ['frases'],
} as const

const Transcricao = z.object({
  frases: z
    .array(
      z.object({
        inicio_s: z.coerce.number().min(0).max(4 * 3600),
        texto: z.string().max(4000),
        incerto: z.boolean().optional().default(false),
      }),
    )
    .max(2000),
})

/** Valida a transcrição; `duracaoAudioMs` corta marcas absurdas além do áudio. */
export function validarTranscricao(bruto: unknown, duracaoAudioMs: number): FraseTranscrita[] | null {
  const r = Transcricao.safeParse(bruto)
  if (!r.success) return null
  const limite = duracaoAudioMs + 5_000
  return r.data.frases
    .map((f) => ({ t: Math.round(f.inicio_s * 1000), texto: f.texto.trim(), ...(f.incerto ? { incerto: true } : {}) }))
    .filter((f) => f.texto && f.t <= limite)
    .sort((a, b) => a.t - b.t)
}

// ─── Resumo ─────────────────────────────────────────────────────────────

const texto = (descricao: string) => ({ type: 'string', description: descricao })
const lista = (descricao: string) => ({ type: 'array', description: descricao, items: { type: 'string' } })

export const ESQUEMA_RESUMO = {
  type: 'object',
  properties: {
    titulo: texto('Título curto e específico do conteúdo da aula.'),
    sintese: texto('Síntese geral em 1 a 3 parágrafos.'),
    topicos: {
      type: 'array',
      description: 'Tópicos na ordem em que foram trabalhados.',
      items: {
        type: 'object',
        properties: {
          titulo: texto('Nome do tópico.'),
          explicacao: texto('Explicação fiel ao que foi dito, em prosa didática.'),
          conceitos: {
            type: 'array',
            items: { type: 'object', properties: { termo: texto('Termo.'), definicao: texto('Definição como apresentada na aula.') }, required: ['termo', 'definicao'] },
          },
          mecanismos: lista('Mecanismos fisiopatológicos/farmacológicos explicados, um por item.'),
          raciocinioDoMonitor: texto('Como o monitor encadeou o raciocínio (passo a passo), se houver; senão vazio.'),
        },
        required: ['titulo', 'explicacao', 'conceitos', 'mecanismos', 'raciocinioDoMonitor'],
      },
    },
    duvidas: {
      type: 'array',
      description: 'Dúvidas levantadas e as respostas dadas na aula.',
      items: {
        type: 'object',
        properties: {
          pergunta: texto('A dúvida.'),
          resposta: texto('A resposta dada na aula.'),
          quemPerguntou: { type: 'string', enum: ['aluno', 'monitor', 'incerto'] },
        },
        required: ['pergunta', 'resposta', 'quemPerguntou'],
      },
    },
    comparacoes: {
      type: 'array',
      description: 'Comparações e diagnósticos diferenciais discutidos.',
      items: { type: 'object', properties: { itens: texto('O que foi comparado.'), diferencas: texto('As diferenças apontadas.') }, required: ['itens', 'diferencas'] },
    },
    pontosDeAtencao: lista('Armadilhas, pegadinhas e alertas mencionados.'),
    revisaoRapida: lista('Frases curtas para revisão de véspera.'),
    questoes: {
      type: 'array',
      description: 'Questões originais de múltipla escolha SÓ sobre o que foi discutido.',
      items: {
        type: 'object',
        properties: {
          enunciado: texto('Enunciado.'),
          alternativas: lista('4 ou 5 alternativas, sem a letra.'),
          correta: { type: 'integer', description: 'Índice da correta (0 = primeira).' },
          comentario: texto('Gabarito comentado, ligado ao que foi dito na aula.'),
        },
        required: ['enunciado', 'alternativas', 'correta', 'comentario'],
      },
    },
    lacunas: lista('Partes sem áudio, inaudíveis ou cortadas que podem ter deixado buracos.'),
    aVerificar: lista('Afirmações incertas, possivelmente desatualizadas ou que merecem conferência em fonte oficial.'),
  },
  required: ['titulo', 'sintese', 'topicos', 'duvidas', 'comparacoes', 'pontosDeAtencao', 'revisaoRapida', 'questoes', 'lacunas', 'aVerificar'],
} as const

const curto = z.string().trim().max(400)
const longo = z.string().trim().max(12_000)
const itens = z.array(z.string().trim().min(1).max(2000)).max(80)

const Resumo = z.object({
  titulo: curto.min(1),
  sintese: longo.min(1),
  topicos: z
    .array(
      z.object({
        titulo: curto.min(1),
        explicacao: longo,
        conceitos: z.array(z.object({ termo: curto.min(1), definicao: z.string().trim().max(3000) })).max(60).default([]),
        mecanismos: itens.default([]),
        raciocinioDoMonitor: longo.default(''),
      }),
    )
    .min(1)
    .max(40),
  duvidas: z.array(z.object({ pergunta: z.string().trim().min(1).max(2000), resposta: z.string().trim().max(5000), quemPerguntou: z.enum(['aluno', 'monitor', 'incerto']).catch('incerto') })).max(80).default([]),
  comparacoes: z.array(z.object({ itens: z.string().trim().min(1).max(500), diferencas: z.string().trim().max(5000) })).max(40).default([]),
  pontosDeAtencao: itens.default([]),
  revisaoRapida: itens.default([]),
  questoes: z
    .array(
      z.object({
        enunciado: z.string().trim().min(1).max(4000),
        alternativas: z.array(z.string().trim().min(1).max(1000)).min(4).max(5),
        correta: z.coerce.number().int().min(0),
        comentario: z.string().trim().min(1).max(5000),
      }),
    )
    .max(20)
    .default([]),
  lacunas: itens.default([]),
  aVerificar: itens.default([]),
})

/** Valida o resumo. Questão com gabarito fora das alternativas é descartada, não "consertada". */
export function validarResumo(bruto: unknown): { ok: true; resumo: ResumoGerado } | { ok: false; erros: string[] } {
  const r = Resumo.safeParse(bruto)
  if (!r.success) return { ok: false, erros: r.error.issues.slice(0, 12).map((i) => `${i.path.join('.')}: ${i.message}`) }
  const resumo = r.data as ResumoGerado
  resumo.questoes = resumo.questoes.filter((q) => q.correta < q.alternativas.length)
  return { ok: true, resumo }
}

/** O JSON pode vir cercado de ``` mesmo com saída estruturada: tolera, sem inventar nada. */
export function lerJson(texto: string): unknown {
  const t = String(texto || '').trim()
  try {
    return JSON.parse(t)
  } catch {
    const ini = t.indexOf('{')
    const fim = t.lastIndexOf('}')
    if (ini < 0 || fim <= ini) return null
    try {
      return JSON.parse(t.slice(ini, fim + 1))
    } catch {
      return null
    }
  }
}
