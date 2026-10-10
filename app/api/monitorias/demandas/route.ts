import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { erro, idDe, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { requisitosDoAlunoDe } from '@/lib/monitorias/servidor'
import { pendentes } from '@/lib/monitorias/requisitos'
import { CorpoDemanda } from '@/lib/monitorias/demandas-regras'
import { criarDemanda } from '@/lib/monitorias/demandas'
import { limparTexto } from '@/lib/monitorias/validacao'
import { mascararContato } from '@/lib/monitorias/contato'
import { checkRateLimit } from '@/lib/rate-limit'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

/** POST — o aluno publica um pedido de monitoria. Sem cadastro completo: só conta ativa e maioridade. */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'WRITE' }, async ({ sessao }) => {
    // Cada pedido avisa monitores (sino e, no máximo 1x/dia, e-mail): teto por pessoa.
    const lim = await checkRateLimit(`mon-demanda:${sessao.userId}`, 'monitorias_demanda', 6, 60 * 60_000)
    if (!lim.success) return erro(429, 'Muitos pedidos em pouco tempo. Tente de novo mais tarde.')
    const corpo = CorpoDemanda.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Confira o pedido: matéria, pessoas, duração e quando.')
    const req = await requisitosDoAlunoDe(sessao.userId)
    if (!req.ok || !req.user) {
      return erro(409, 'Sua conta não pode pedir monitorias agora.', { pendentes: pendentes(req.itens).filter((i) => i.chave !== 'termos') })
    }
    const materia = limparTexto(corpo.data.materia)
    const assunto = mascararContato(limparTexto(corpo.data.assunto || '')).texto
    if (materia.length < 2) return erro(400, 'Diga a matéria.')
    const { demanda, avisados } = await criarDemanda(req.user, { ...corpo.data, materia, assunto })
    return ok({ id: idDe(demanda), avisados }, 201)
  })
}

/** GET — meus pedidos, com os monitores que responderam a cada um. */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const c = await obterColecoes()
    const demandas = await c.demandas.find({ alunoId: sessao.userId }).sort({ createdAt: -1 }).limit(20).toArray()
    const ids = demandas.map(idDe)
    const respostas = ids.length
      ? await c.reservas
          .find({ 'demanda.id': { $in: ids }, solicitanteId: sessao.userId } as any, { projection: { 'demanda.id': 1, tutorId: 1, status: 1, anuncioTitulo: 1, createdAt: 1 } })
          .sort({ createdAt: 1 })
          .toArray()
      : []
    const tutorIds = Array.from(new Set(respostas.map((r) => r.tutorId))).filter((id) => ObjectId.isValid(id))
    const tutores = tutorIds.length
      ? await c.tutores.find({ _id: { $in: tutorIds.map((id) => new ObjectId(id)) } } as any, { projection: { nome: 1, fotoUrl: 1, stats: 1 } }).toArray()
      : []
    const porTutor = new Map(tutores.map((t) => [idDe(t), t]))
    const agora = new Date()
    return jsonComprimido(request, {
      itens: demandas.map((d) => ({
        id: idDe(d),
        materia: d.materia,
        assunto: d.assunto || null,
        pessoas: d.pessoas,
        valorPorPessoaCentavos: d.valorPorPessoaCentavos,
        duracaoMin: d.duracaoMin,
        quando: d.quando,
        periodos: d.periodos,
        status: d.status === 'aberta' && d.expiraEm <= agora ? 'expirada' : d.status,
        expiraEm: d.expiraEm,
        createdAt: d.createdAt,
        respostas: respostas
          .filter((r) => r.demanda?.id === idDe(d))
          .map((r) => {
            const t = porTutor.get(r.tutorId)
            return {
              reservaId: idDe(r),
              status: r.status,
              anuncioTitulo: r.anuncioTitulo,
              monitor: t ? { nome: t.nome, fotoUrl: t.fotoUrl || null, nota: t.stats?.nota || 0, avaliacoes: t.stats?.avaliacoes || 0 } : null,
            }
          }),
      })),
    })
  })
}
