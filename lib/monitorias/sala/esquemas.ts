import 'server-only'

/**
 * Schemas do servidor para o que chega da sala. Tudo `.strict()`: campo a mais
 * é recusado, e nenhum valor vindo do navegador vira operador do Mongo (o
 * servidor ainda embrulha o sinal em `$literal` ao gravar).
 */

import { z } from 'zod'
import { CANDIDATO_MAX, CANDIDATOS_POR_MENSAGEM, sdpValido } from './mensagens'

const Pid = z.string().regex(/^[A-Za-z0-9_-]{16}$/)
const Neg = z.string().min(1).max(40)

const Candidato = z
  .object({
    candidate: z.string().max(CANDIDATO_MAX),
    sdpMid: z.string().max(32).nullable().optional(),
    sdpMLineIndex: z.number().int().min(0).max(16).nullable().optional(),
    usernameFragment: z.string().max(64).nullable().optional(),
  })
  .strict()

const Sdp = z.string().refine(sdpValido, 'SDP inválido.')

export const EsquemaUso = z
  .object({
    tipo: z.enum(['direta', 'retransmitida']).nullable(),
    bytesRelay: z.number().int().min(0).max(50_000_000_000),
    segundos: z.number().int().min(0).max(6 * 3600),
  })
  .strict()

export const EsquemaEnvio = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('oferta'), para: Pid, dados: z.object({ sdp: Sdp, neg: Neg }).strict() }).strict(),
  z.object({ tipo: z.literal('resposta'), para: Pid, dados: z.object({ sdp: Sdp, neg: Neg }).strict() }).strict(),
  z.object({ tipo: z.literal('candidatos'), para: Pid, dados: z.object({ lista: z.array(Candidato).min(1).max(CANDIDATOS_POR_MENSAGEM), neg: Neg }).strict() }).strict(),
  z.object({ tipo: z.literal('reiniciar'), para: Pid, dados: z.object({ neg: Neg.optional() }).strict() }).strict(),
  // A saída pelo beacon leva o token no corpo (beacon não envia header).
  z.object({ tipo: z.literal('sair'), uso: EsquemaUso.optional(), token: z.string().max(2_000).optional() }).strict(),
  z.object({ tipo: z.literal('encerrar') }).strict(),
  z.object({ tipo: z.literal('reabrir') }).strict(),
  // Controles do anfitrião que valem no servidor (só o monitor).
  z.object({ tipo: z.literal('remover'), alvo: Pid }).strict(),
  z.object({ tipo: z.literal('readmitir'), alvo: Pid }).strict(),
  z.object({ tipo: z.literal('permissoes'), telaAlunos: z.boolean().optional(), chatAlunos: z.boolean().optional() }).strict(),
])

export type EnvioValidado = z.infer<typeof EsquemaEnvio>

export const EsquemaAcaoDaSala = z.discriminatedUnion('acao', [
  z.object({ acao: z.literal('entrar') }).strict(),
  z.object({ acao: z.literal('renovar'), uso: EsquemaUso.optional() }).strict(),
])
