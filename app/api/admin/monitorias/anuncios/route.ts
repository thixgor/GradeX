import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada } from '@/lib/monitorias/rota'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { carregarUsuario, requisitosDoMonitorDe } from '@/lib/monitorias/servidor'
import { maskCpf } from '@/lib/cpf'

export const dynamic = 'force-dynamic'

/** GET ?fila=analise|revisoes|todos — anúncios para moderação, com dados do monitor para conferência. */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const fila = new URL(request.url).searchParams.get('fila') || 'analise'
    const c = await obterColecoes()
    const filtro =
      fila === 'analise' ? { status: 'em_analise' } : fila === 'revisoes' ? { revisaoPendente: { $exists: true } } : {}
    const anuncios = await c.anuncios.find(filtro as any).sort({ updatedAt: -1 }).limit(100).toArray()
    const tutores = await c.tutores
      .find({ _id: { $in: Array.from(new Set(anuncios.map((a) => a.tutorId))).filter(ObjectId.isValid).map((x) => new ObjectId(x)) } } as any)
      .toArray()
    const porTutor = new Map(tutores.map((t) => [idDe(t), t]))
    // Uma consulta por MONITOR (não por anúncio): 100 anúncios de 30 monitores = 30, não 100.
    const userIds = Array.from(new Set(anuncios.map((a) => a.userId)))
    const dados = new Map(
      await Promise.all(
        userIds.map(async (id) => [id, await Promise.all([carregarUsuario(id), requisitosDoMonitorDe(id)])] as const),
      ),
    )
    const itens = await Promise.all(
      anuncios.map(async (a) => {
        const t = porTutor.get(a.tutorId)
        const [user, req] = dados.get(a.userId)!
        return {
          id: idDe(a),
          slug: a.slug,
          status: a.status,
          conteudo: { titulo: a.titulo, materia: a.materia, conteudos: a.conteudos, descricao: a.descricao, videos: a.videos, preco: a.preco, grupo: a.grupo, aulaGratis: a.aulaGratis, modos: a.modos, faq: a.faq, materiais: a.materiais, temMateriais: a.temMateriais },
          revisaoPendente: a.revisaoPendente || null,
          moderacao: a.moderacao || null,
          updatedAt: a.updatedAt,
          monitor: {
            tutorId: a.tutorId,
            nome: t?.nome || user?.name || '',
            nomeCivil: user?.fullName || '',
            email: user?.email || '',
            cpf: maskCpf(user?.cpf),
            cpfVerificado: !!user?.cpfVerified,
            fotoUrl: t?.fotoUrl || null,
            titulo: t?.titulo || '',
            bio: t?.bio || '',
            historia: t?.historia || '',
            status: t?.status || 'ativo',
            strikes: t?.strikes.length || 0,
            requisitos: req.itens,
          },
        }
      }),
    )
    return jsonComprimido(request, { itens }, { headers: { 'Cache-Control': 'private, no-store' } })
  })
}
