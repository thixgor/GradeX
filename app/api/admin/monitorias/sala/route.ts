import { NextRequest } from 'next/server'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { configDaSala, mesDoUso, salvarConfigSala, usoDoMes } from '@/lib/monitorias/sala/config'
import { BYTES_POR_GB, LIMITE_MALHA_MAX, LIMITE_MALHA_MIN, LIMITES_DE_VIDEO, normalizarConfigVideo, presente, situacaoDoTurn } from '@/lib/monitorias/sala/regras'
import { revogarCredencialTurn, turnConfigurado } from '@/lib/monitorias/sala/turn'

export const dynamic = 'force-dynamic'

const L = LIMITES_DE_VIDEO
const Video = z
  .object({
    perfil: z.enum(['fluido', 'equilibrado', 'nitido', 'economico', 'personalizado']),
    fpsMax: z.number().int().min(L.fpsMax[0]).max(L.fpsMax[1]),
    bitrateIndividualKbps: z.number().int().min(L.bitrateIndividualKbps[0]).max(L.bitrateIndividualKbps[1]),
    bitrateGrupoKbps: z.number().int().min(L.bitrateGrupoKbps[0]).max(L.bitrateGrupoKbps[1]),
    resolucao: z.union([z.literal(360), z.literal(480)]),
    adaptativo: z.boolean(),
    telaFps: z.number().int().min(L.telaFps[0]).max(L.telaFps[1]),
    telaBitrateKbps: z.number().int().min(L.telaBitrateKbps[0]).max(L.telaBitrateKbps[1]),
  })
  .partial()
  .strict()

const Config = z
  .object({
    salaNativaAtiva: z.boolean(),
    linkExternoPermitido: z.boolean(),
    turnAtivo: z.boolean(),
    turnOrcamentoGbMes: z.number().int().min(0).max(1_000_000).nullable(),
    turnCorteAutomaticoPct: z.number().int().min(10).max(100),
    limiteMalha: z.number().int().min(LIMITE_MALHA_MIN).max(LIMITE_MALHA_MAX),
    compartilharTela: z.boolean(),
    chatNaSala: z.boolean(),
    video: Video,
  })
  .partial()
  .strict()

const Acao = z.object({ acao: z.literal('cortar_turn') }).strict()

/** GET — chaves da sala, situação do TURN, consumo estimado do mês e aulas acontecendo agora. */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const agora = new Date()
    const c = await obterColecoes()
    const [config, uso, recentes] = await Promise.all([
      configDaSala(),
      usoDoMes(agora),
      c.salas.find({ fim: { $gt: new Date(agora.getTime() - 30 * 60_000) } }, { projection: { participantes: 1 } }).limit(500).toArray(),
    ])
    const bytes = uso?.bytesRelay || 0
    const pessoasAgora = recentes.reduce((t, s) => t + Object.values(s.participantes || {}).filter((p) => presente(p, agora)).length, 0)
    const salasAgora = recentes.filter((s) => Object.values(s.participantes || {}).some((p) => presente(p, agora))).length
    return ok({
      config,
      turn: { configurado: turnConfigurado(), situacao: situacaoDoTurn({ config, configurado: turnConfigurado(), bytesNoMes: bytes }) },
      uso: {
        mes: mesDoUso(agora),
        gbRelay: bytes / BYTES_POR_GB,
        horasRelay: (uso?.segundosRelay || 0) / 3600,
        horasDireta: (uso?.segundosDireta || 0) / 3600,
        atualizadoEm: uso?.atualizadoEm || null,
      },
      agora: { salas: salasAgora, pessoas: pessoasAgora },
    })
  })
}

/** PUT — muda as chaves (vale em até 1 min em todas as instâncias). */
export async function PUT(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const parsed = Config.safeParse(await lerJson(request))
    if (!parsed.success) return erro(400, parsed.error.issues[0]?.message || 'Configuração inválida.')
    const antes = await configDaSala()
    const { video, ...resto } = parsed.data
    const depois = await salvarConfigSala({ ...antes, ...resto, video: normalizarConfigVideo({ ...antes.video, ...video }) })
    await audit({ action: 'monitoria_sala_config', actorUserId: sessao.userId, resourceType: 'monitorias_sala', metadata: { antes, depois }, ip })
    return ok({ config: depois })
  })
}

/**
 * POST {acao:'cortar_turn'} — desliga o TURN e revoga as credenciais já
 * entregues nas aulas de agora (melhor esforço). Quem estava em conexão direta
 * não percebe nada; quem dependia do relé cai e vê a mensagem de reconexão.
 */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const parsed = Acao.safeParse(await lerJson(request))
    if (!parsed.success) return erro(400, 'Ação inválida.')
    const antes = await configDaSala()
    await salvarConfigSala({ ...antes, turnAtivo: false })
    const c = await obterColecoes()
    const agora = new Date()
    const salas = await c.salas.find({ fim: { $gt: new Date(agora.getTime() - 30 * 60_000) } }, { projection: { participantes: 1 } }).limit(500).toArray()
    const usuarios = Array.from(new Set(salas.flatMap((s) => Object.values(s.participantes || {}).map((p) => p.turnUsuario).filter((u): u is string => !!u))))
    let revogadas = 0
    // Em lotes de 10 para caber no tempo da função.
    for (let i = 0; i < usuarios.length; i += 10) {
      const lote = await Promise.all(usuarios.slice(i, i + 10).map((u) => revogarCredencialTurn(u)))
      revogadas += lote.filter(Boolean).length
    }
    await audit({ action: 'monitoria_sala_turn_cortado', actorUserId: sessao.userId, resourceType: 'monitorias_sala', metadata: { credenciais: usuarios.length, revogadas }, ip })
    return ok({ revogadas, total: usuarios.length })
  })
}
