import { NextRequest } from 'next/server'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, idDe, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarReserva, excluirMonitoriaPeloSuporte, restaurarMonitoria } from '@/lib/monitorias/reservas'
import { limparTexto } from '@/lib/monitorias/validacao'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const Corpo = z.object({ motivo: z.string().min(5).max(1000) }).strict()

/**
 * POST {motivo} — o suporte exclui a monitoria. Antes da aula, cancela primeiro
 * (reembolso de quem pagou). Sem dinheiro nenhum, apaga de vez; com dinheiro,
 * some de todas as telas e o registro financeiro e o contrato ficam guardados.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Escreva o motivo da exclusão (fica no registro).')
    const reserva = await carregarReserva(params.id, { incluirExcluida: true })
    if (reserva.excluidaEm) return erro(409, 'Esta monitoria já foi excluída.')
    const motivo = limparTexto(corpo.data.motivo)
    const r = await excluirMonitoriaPeloSuporte({ reserva, adminId: sessao.userId, motivo })
    await audit({
      action: 'monitoria_excluida_suporte',
      actorUserId: sessao.userId,
      resourceType: 'monitoria_reserva',
      resourceId: idDe(reserva),
      metadata: { motivo, statusAnterior: reserva.status, titulo: reserva.anuncioTitulo, ...r },
      ip,
    })
    return ok(r)
  })
}

/** DELETE — desfaz a exclusão (só das que ficaram guardadas). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const reserva = await carregarReserva(params.id, { incluirExcluida: true })
    await restaurarMonitoria(reserva)
    await audit({ action: 'monitoria_restaurada_suporte', actorUserId: sessao.userId, resourceType: 'monitoria_reserva', resourceId: idDe(reserva), metadata: { status: reserva.status }, ip })
    return ok({ restaurada: true })
  })
}
