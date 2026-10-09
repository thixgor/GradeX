import { NextRequest } from 'next/server'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'

export const dynamic = 'force-dynamic'

/** GET — perguntas denunciadas (para ocultar/mostrar pela rota de perguntas). */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const c = await obterColecoes()
    const perguntas = await c.perguntas.find({ 'denuncias.0': { $exists: true } }).sort({ createdAt: -1 }).limit(100).toArray()
    return ok({
      perguntas: perguntas.map((p) => ({
        id: idDe(p),
        anuncioId: p.anuncioId,
        autorNome: p.autorNome,
        texto: p.texto,
        resposta: p.resposta || null,
        status: p.status,
        denuncias: p.denuncias.length,
        createdAt: p.createdAt,
      })),
    })
  })
}
