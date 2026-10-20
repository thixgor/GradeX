import { NextRequest } from 'next/server'
import { audit } from '@/lib/payments/audit'
import { naoEncontrado } from '@/lib/monitorias/db'
import { rotaAutenticada } from '@/lib/monitorias/rota'
import { acessoDeLeitura, carregarReserva } from '@/lib/monitorias/reservas'
import { estadoDoResumoParaComprador } from '@/lib/monitorias/resumo/tarefa'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

/**
 * GET — estado do Resumo por IA desta reserva para quem comprou (ou o admin):
 * o adicional, o andamento e, quando entregue, o resumo. A transcrição nunca
 * sai daqui. Lido do banco: abrir a página não chama o modelo.
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return rotaAutenticada(request, { limite: 'READ' }, async ({ sessao, ip }) => {
    const admin = sessao.role === 'admin'
    const reserva = await carregarReserva(params.id, { incluirExcluida: admin })
    if (!admin && !(await acessoDeLeitura(reserva, sessao.userId))) return naoEncontrado()
    const estado = await estadoDoResumoParaComprador(reserva, sessao.userId, admin)
    if (!admin && !estado.adicional) return naoEncontrado()
    if (admin && estado.resultado && !estado.adicional) {
      await audit({ action: 'monitoria_resumo_lido', actorUserId: sessao.userId, resourceType: 'monitoria_resumo', resourceId: params.id, ip })
    }
    // O resumo passa de dezenas de KB: comprimido (o Next não comprime dentro da função na Vercel).
    return jsonComprimido(request, { ...estado, reserva: { id: params.id, titulo: reserva.anuncioTitulo, inicio: reserva.inicio || null } }, { headers: { 'Cache-Control': 'private, no-store' } })
  })
}
