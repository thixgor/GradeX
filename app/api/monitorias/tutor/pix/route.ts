import { NextRequest } from 'next/server'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import { erro, lerJson, obterColecoes, userAgentDe } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarUsuario, obterOuCriarTutor } from '@/lib/monitorias/servidor'
import { conferirCodigo, mensagemDoCodigo } from '@/lib/monitorias/codigos'
import { cifrar, hmac, mascararChavePix, normalizarChavePix, segredoConfigurado } from '@/lib/monitorias/cripto'
import { avisar } from '@/lib/monitorias/avisos'
import type { ChavePixArmazenada } from '@/lib/monitorias/tipos'

export const dynamic = 'force-dynamic'

const Corpo = z
  .object({
    tipo: z.enum(['cpf', 'email', 'telefone', 'aleatoria']),
    chave: z.string().min(3).max(120),
    titularCpf: z.string().max(20),
    codigo: z.string().max(10),
  })
  .strict()

const CARENCIA_MS = 48 * 3_600_000

/**
 * PUT — cadastra/troca a chave PIX de recebimento.
 *
 * Três travas contra quem invadiu a conta e quer desviar os repasses:
 *  1. código de 6 dígitos no e-mail da conta;
 *  2. o titular da chave tem de ser o próprio monitor (mesmo CPF da conta);
 *  3. TROCA (não o primeiro cadastro) só vale depois de 48h, com e-mail de alerta
 *     — tempo para o dono de verdade perceber e travar pelo suporte.
 */
export async function PUT(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'AUTH', emailVerificado: true }, async ({ sessao, ip }) => {
    if (!segredoConfigurado()) return erro(503, 'Cadastro de chave PIX indisponível no momento (configuração do servidor).')
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Dados inválidos.')
    const { tipo, chave, titularCpf, codigo } = corpo.data
    const normalizada = normalizarChavePix(tipo, chave)
    if (!normalizada) return erro(400, 'Chave PIX inválida para o tipo escolhido.')
    const titular = onlyCpfDigits(titularCpf)
    const user = await carregarUsuario(sessao.userId)
    if (!user || user.banned) return erro(403, 'Conta indisponível.')
    if (!user.cpf || !isValidCpf(user.cpf)) return erro(400, 'Cadastre seu CPF no perfil antes da chave PIX.')
    if (!isValidCpf(titular) || titular !== onlyCpfDigits(user.cpf)) {
      return erro(400, 'A chave precisa ser sua: o CPF do titular deve ser o mesmo do seu cadastro.')
    }
    if (tipo === 'cpf' && normalizada !== titular) return erro(400, 'Chave do tipo CPF precisa ser o seu próprio CPF.')

    const conferido = await conferirCodigo(sessao.userId, 'pix', codigo)
    if (conferido !== 'ok') return erro(400, mensagemDoCodigo(conferido))

    const tutor = await obterOuCriarTutor(user)
    const agora = new Date()
    const nova: ChavePixArmazenada = {
      tipo,
      cifrada: cifrar(normalizada),
      mascarada: mascararChavePix(tipo, normalizada),
      hmac: hmac(normalizada),
      titularConferido: true,
      atualizadaEm: agora,
    }
    const c = await obterColecoes()
    const primeira = !tutor.pix
    if (primeira) {
      await c.tutores.updateOne({ _id: tutor._id as any }, { $set: { pix: nova, updatedAt: agora }, $unset: { pixPendente: '' } })
    } else {
      await c.tutores.updateOne({ _id: tutor._id as any }, { $set: { pixPendente: { ...nova, liberaEm: new Date(agora.getTime() + CARENCIA_MS) }, updatedAt: agora } })
    }
    await audit({
      action: 'monitoria_pix_alterado',
      actorUserId: sessao.userId,
      targetUserId: sessao.userId,
      resourceType: 'monitoria_tutor',
      resourceId: String(tutor._id),
      metadata: { tipo, mascarada: nova.mascarada, primeira, userAgent: userAgentDe(request) },
      ip,
    })
    await avisar([
      {
        userId: sessao.userId,
        titulo: primeira ? 'Chave PIX cadastrada' : 'Troca de chave PIX agendada',
        mensagem: primeira ? `Repasses irão para ${nova.mascarada}.` : `A nova chave ${nova.mascarada} passa a valer em 48h.`,
        url: '/monitorias/painel/perfil',
        email: {
          assunto: primeira ? 'Chave PIX de monitor cadastrada' : 'ALERTA: sua chave PIX de monitor vai mudar',
          paragrafos: primeira
            ? [`Sua chave PIX de recebimento foi cadastrada: ${nova.mascarada}.`]
            : [
                `Pediram a troca da chave PIX que recebe seus repasses para ${nova.mascarada}.`,
                'Por segurança, a nova chave só passa a valer em 48 horas. Se não foi você, troque sua senha e abra um ticket no suporte AGORA — a troca será cancelada.',
              ],
          linhas: [['IP', ip], ['Quando', agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })]],
        },
      },
    ])
    return ok({ salvo: true, pendente: !primeira, mascarada: nova.mascarada })
  })
}
