import { NextRequest } from 'next/server'
import { audit } from '@/lib/payments/audit'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada } from '@/lib/monitorias/rota'
import { carregarReserva } from '@/lib/monitorias/reservas'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

const POR_PAGINA = 200

/**
 * GET ?antes=<ISO> — a conversa inteira de uma monitoria para o suporte, sem
 * máscara, com quem escreveu e as tentativas de contato bloqueadas (que não
 * entraram no chat). Abrir a conversa fica no registro de auditoria.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const reserva = await carregarReserva(params.id, { incluirExcluida: true })
    const id = idDe(reserva)
    const antes = new URL(request.url).searchParams.get('antes')
    const c = await obterColecoes()
    const filtro: Record<string, unknown> = { reservaId: id }
    if (antes && !Number.isNaN(Date.parse(antes))) filtro.createdAt = { $lt: new Date(antes) }
    const [mensagens, assentos, tutor, infracoes] = await Promise.all([
      c.mensagens.find(filtro as any).sort({ createdAt: -1 }).limit(POR_PAGINA).toArray(),
      c.participacoes.find({ reservaId: id }, { projection: { alunoId: 1, alunoNome: 1 } }).toArray(),
      c.tutores.findOne({ userId: reserva.tutorUserId }, { projection: { nome: 1 } }),
      antes ? Promise.resolve([]) : c.infracoes.find({ reservaId: id }).sort({ createdAt: -1 }).limit(100).toArray(),
    ])
    if (!antes) {
      await audit({ action: 'monitoria_chat_lido', actorUserId: sessao.userId, resourceType: 'monitoria_reserva', resourceId: id, ip })
    }
    const nomes = new Map<string, string>([[reserva.tutorUserId, `${tutor?.nome || 'Monitor'} (monitor)`], ...assentos.map((a) => [a.alunoId, a.alunoNome] as [string, string])])
    return jsonComprimido(request, {
      titulo: reserva.anuncioTitulo,
      maisAntigas: mensagens.length === POR_PAGINA,
      mensagens: mensagens.reverse().map((m) => ({
        id: idDe(m),
        autor: m.autorId === 'sistema' ? 'Sistema' : nomes.get(m.autorId) || 'Participante',
        papel: m.autorId === 'sistema' ? 'sistema' : m.autorId === reserva.tutorUserId ? 'monitor' : 'aluno',
        tipo: m.tipo,
        texto: m.texto,
        createdAt: m.createdAt,
      })),
      infracoes: infracoes.map((i) => ({
        id: idDe(i),
        nome: i.nome,
        papel: i.papel,
        origem: i.origem,
        nivel: i.nivel,
        categorias: i.categorias,
        texto: i.texto,
        createdAt: i.createdAt,
      })),
    })
  })
}
