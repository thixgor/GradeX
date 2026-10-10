/**
 * Validação de entrada das monitorias (zod).
 *
 * Regra: nenhum texto do usuário vira HTML. Tudo passa por `limparTexto`
 * (tira tags, normaliza espaços) e é exibido como texto puro no React.
 */

import { z } from 'zod'
import { stripHtml } from '@/lib/api-security'
import { VALOR_MAXIMO_CENTAVOS, VALOR_MINIMO_CENTAVOS } from './dinheiro'
import { validarFaixas } from './precos'
import { interpretarUrlDeVideo, videoValido } from './videos'
import { validarLinkExterno } from './links'
import { validarJanelas } from './agenda'
import { mascararContato } from './contato'
import type { ConteudoAnuncio, Disponibilidade, VideoAnuncio } from './tipos'

/** Remove HTML e espaços duplicados, preservando quebras de parágrafo. */
export function limparTexto(texto: string): string {
  // Teto antes de qualquer regex: entrada gigante ("<<<<…" com 1 MB) não pode
  // prender a função por segundos. Nenhum campo das monitorias passa de 5.000.
  return String(texto || '')
    .slice(0, 20_000)
    .split(/\n{2,}/)
    .map((p) => stripHtml(p))
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

const texto = (min: number, max: number, campo: string) =>
  z
    .string({ required_error: `${campo} é obrigatório` })
    .max(max * 2 + 200, `${campo}: máximo de ${max} caracteres`)
    .transform(limparTexto)
    .refine((v) => v.length >= min, `${campo}: mínimo de ${min} caracteres`)
    .refine((v) => v.length <= max, `${campo}: máximo de ${max} caracteres`)

const centavos = z.number().int().min(0).max(VALOR_MAXIMO_CENTAVOS)

const duracao = z.number().int().min(30).max(480).refine((v) => v % 30 === 0, 'Duração em blocos de 30 min')

export const SchemaPerfilTutor = z
  .object({
    titulo: texto(5, 90, 'Título do perfil'),
    bio: texto(20, 600, 'Sobre você'),
    historia: texto(0, 3000, 'Sua história'),
  })
  .strict()

export const SchemaDisponibilidade = z
  .object({
    semanal: z
      .array(
        z.object({
          dia: z.number().int().min(0).max(6),
          inicio: z.string().regex(/^\d{2}:\d{2}$/),
          fim: z.string().regex(/^\d{2}:\d{2}$/),
        }).strict(),
      )
      .max(42),
    diasBloqueados: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(120),
    intervaloMin: z.union([z.literal(0), z.literal(15), z.literal(30)]),
  })
  .strict()
  .superRefine((v, ctx) => {
    const erro = validarJanelas(v.semanal)
    if (erro) ctx.addIssue({ code: z.ZodIssueCode.custom, message: erro, path: ['semanal'] })
  })

export function normalizarDisponibilidade(v: z.infer<typeof SchemaDisponibilidade>): Disponibilidade {
  return {
    semanal: [...v.semanal].sort((a, b) => a.dia - b.dia || a.inicio.localeCompare(b.inicio)),
    diasBloqueados: Array.from(new Set(v.diasBloqueados)).sort(),
    intervaloMin: v.intervaloMin,
  }
}

export const SchemaConteudoAnuncio = z
  .object({
    titulo: texto(8, 90, 'Título'),
    materia: texto(2, 60, 'Matéria'),
    conteudos: z.array(texto(2, 60, 'Conteúdo')).min(1, 'Informe ao menos um conteúdo/módulo').max(20),
    descricao: texto(40, 4000, 'Descrição'),
    /** Aceita URL (do formulário) ou {provider,id} (já normalizado). */
    videos: z.array(z.union([z.string().max(300), z.object({ provider: z.string(), id: z.string(), tipo: z.string().optional() })])).max(6),
    preco: z
      .object({
        modo: z.enum(['aula', 'hora']),
        valorCentavos: centavos,
        duracaoPadraoMin: duracao,
      })
      .strict(),
    grupo: z
      .object({
        ativo: z.boolean(),
        maxAlunos: z.number().int().min(2).max(30),
        faixas: z
          .array(z.object({ minAlunos: z.number().int().min(2).max(30), valorPorPessoaCentavos: centavos }).strict())
          .max(6),
      })
      .strict(),
    aulaGratis: z.object({ ativa: z.boolean(), duracaoMin: z.number().int().min(15).max(60) }).strict(),
    modos: z
      .object({
        direto: z
          .object({
            duracaoMinMin: duracao,
            duracaoMaxMin: duracao,
            passoMin: z.union([z.literal(30), z.literal(60)]),
            antecedenciaMinHoras: z.number().int().min(2).max(24 * 14),
          })
          .strict()
          .optional()
          .nullable(),
        negociacao: z.boolean().optional(),
        aCombinar: z.boolean().optional(),
      })
      .strict(),
    faq: z
      .array(z.object({ pergunta: texto(5, 200, 'Pergunta do FAQ'), resposta: texto(2, 1500, 'Resposta do FAQ') }).strict())
      .max(20),
    materiais: z.array(z.object({ titulo: texto(2, 100, 'Título do material'), url: z.string().max(500) }).strict()).max(15),
    temMateriais: z.boolean(),
  })
  .strict()

export type EntradaAnuncio = z.input<typeof SchemaConteudoAnuncio>

/**
 * Valida as regras que cruzam campos e devolve o conteúdo normalizado (vídeos
 * como {provider,id}, links com domínio), ou a lista de erros legíveis.
 */
export function normalizarAnuncio(
  bruto: unknown,
): { ok: true; conteudo: ConteudoAnuncio } | { ok: false; erros: string[] } {
  const parsed = SchemaConteudoAnuncio.safeParse(bruto)
  if (!parsed.success) {
    return { ok: false, erros: parsed.error.issues.map((i) => i.message) }
  }
  const v = parsed.data
  const erros: string[] = []

  const videos: VideoAnuncio[] = []
  for (const item of v.videos) {
    const video = typeof item === 'string' ? interpretarUrlDeVideo(item) : videoValido(item) ? (item as VideoAnuncio) : null
    if (!video) erros.push(`Vídeo inválido: use links do YouTube ou do Instagram (post/reel).`)
    else if (!videos.some((x) => x.provider === video.provider && x.id === video.id)) videos.push(video)
  }

  const materiais: ConteudoAnuncio['materiais'] = []
  for (const m of v.materiais) {
    const link = validarLinkExterno(m.url)
    if (!link) erros.push(`Link de material inválido ("${m.titulo}"): use um endereço https completo.`)
    else materiais.push({ titulo: m.titulo, url: link.url, dominio: link.dominio })
  }

  const modos = {
    direto: v.modos.direto || undefined,
    negociacao: !!v.modos.negociacao,
    aCombinar: !!v.modos.aCombinar,
  }
  if (!modos.direto && !modos.negociacao && !modos.aCombinar) {
    erros.push('Escolha ao menos uma forma de contratação (agendamento direto, negociação ou a combinar).')
  }
  if (modos.direto) {
    if (modos.direto.duracaoMinMin > modos.direto.duracaoMaxMin) erros.push('No agendamento direto, a duração mínima passa da máxima.')
    if ((modos.direto.duracaoMaxMin - modos.direto.duracaoMinMin) % modos.direto.passoMin !== 0) {
      erros.push('No agendamento direto, a diferença entre duração mínima e máxima precisa ser múltipla do passo.')
    }
  }

  const precoObrigatorio = !!modos.direto || !!modos.negociacao
  if (precoObrigatorio && v.preco.valorCentavos < VALOR_MINIMO_CENTAVOS) {
    erros.push('O preço mínimo de uma monitoria paga é R$ 10,00.')
  }

  const conteudos = Array.from(new Set(v.conteudos))
  if (v.grupo.ativo) {
    const erroFaixa = validarFaixas(v.grupo.faixas, v.preco.valorCentavos, v.grupo.maxAlunos)
    if (erroFaixa) erros.push(erroFaixa)
    if (v.grupo.faixas.some((f) => f.valorPorPessoaCentavos < VALOR_MINIMO_CENTAVOS)) {
      erros.push('Cada faixa de grupo precisa custar ao menos R$ 10,00 por pessoa.')
    }
  }

  if (erros.length) return { ok: false, erros: Array.from(new Set(erros)) }
  return {
    ok: true,
    // Contato pessoal no anúncio público (WhatsApp, e-mail, @) seria convite ao
    // pagamento por fora — mascarado aqui, como no chat antes do pagamento.
    conteudo: {
      titulo: semContato(v.titulo),
      materia: v.materia,
      conteudos: conteudos.map(semContato),
      descricao: semContato(v.descricao),
      videos,
      preco: v.preco,
      grupo: v.grupo.ativo
        ? { ativo: true, maxAlunos: v.grupo.maxAlunos, faixas: [...v.grupo.faixas].sort((a, b) => a.minAlunos - b.minAlunos) }
        : { ativo: false, maxAlunos: 1, faixas: [] },
      aulaGratis: v.aulaGratis,
      modos,
      faq: v.faq.map((f) => ({ pergunta: semContato(f.pergunta), resposta: semContato(f.resposta) })),
      materiais,
      temMateriais: v.temMateriais || materiais.length > 0,
    },
  }
}

export const SchemaProposta = z
  .object({
    inicio: z.string().datetime(),
    duracaoMin: duracao,
    conteudos: z.array(texto(2, 60, 'Conteúdo')).max(20),
    vagas: z.number().int().min(1).max(30),
    /** Só o monitor define valor numa proposta; do aluno, o servidor ignora. */
    valorPorPessoaCentavos: centavos.optional(),
    observacao: texto(0, 500, 'Observação').optional(),
  })
  .strict()

export const SchemaMensagem = z.object({ texto: texto(1, 2000, 'Mensagem') }).strict()

export const SchemaPergunta = z.object({ texto: texto(5, 1000, 'Pergunta') }).strict()
export const SchemaResposta = z.object({ texto: texto(2, 2000, 'Resposta') }).strict()

export const SchemaMotivo = z.object({ motivo: texto(5, 1000, 'Motivo') }).strict()

/** Slug legível e único: "fisiologia-cardiovascular-com-ana-3f9c". */
export function gerarSlug(titulo: string, sufixo: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return `${base || 'monitoria'}-${sufixo}`
}

export const SLUG_VALIDO = /^[a-z0-9-]{3,80}$/

/** Texto público (anúncio, perfil): sem telefone, e-mail, WhatsApp ou @. */
export function semContato(texto: string): string {
  return mascararContato(texto).texto
}
