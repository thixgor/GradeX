import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { ehDuplicada, erro, idDe, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { acessoDeLeitura, carregarReserva } from '@/lib/monitorias/reservas'
import { ANOTACOES_MAX } from '@/lib/monitorias/anotacoes'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

const Corpo = z.object({ texto: z.string().max(ANOTACOES_MAX), versaoBase: z.number().int().min(0) }).strict()

/**
 * Anotações pessoais de uma monitoria (só quem escreveu lê).
 *
 * O navegador é a fonte principal (guarda a cada pausa na digitação) e manda
 * para cá com folga — no máximo a cada 30 s, ao fechar o painel e ao sair —
 * para a pessoa reencontrar o texto em outro aparelho. O PDF é feito no
 * navegador: nada de servidor para gerar arquivo.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const reserva = await carregarReserva(params.id)
    const acesso = await acessoDeLeitura(reserva, sessao.userId)
    if (!acesso) return naoEncontrado()
    const c = await obterColecoes()
    const id = idDe(reserva)
    const [nota, tutor] = await Promise.all([
      c.anotacoes.findOne({ userId: sessao.userId, reservaId: id }, { projection: { texto: 1, versao: 1, updatedAt: 1 } }),
      c.tutores.findOne({ _id: new ObjectId(reserva.tutorId) } as any, { projection: { nome: 1 } }),
    ])
    // Até ~50 KB de texto: comprimido (o Next não comprime dentro da função na Vercel).
    return jsonComprimido(request, {
      texto: nota?.texto || '',
      versao: nota?.versao || 0,
      atualizadoEm: nota?.updatedAt || null,
      // Separa o rascunho local de contas diferentes no mesmo navegador.
      chave: createHash('sha256').update(`anotacoes:${sessao.userId}`).digest('hex').slice(0, 12),
      // Para o cabeçalho do PDF.
      reserva: {
        id,
        curto: id.slice(-6).toUpperCase(),
        titulo: reserva.anuncioTitulo,
        inicio: reserva.inicio || null,
        fim: reserva.fim || null,
        monitor: tutor?.nome || 'Monitor',
        autor: sessao.name || 'Você',
        papel: reserva.tutorUserId === sessao.userId ? 'monitor' : 'aluno',
      },
    })
  })
}

/**
 * PUT {texto, versaoBase} — grava se ninguém gravou depois (outro aparelho).
 * Conflito devolve 409 com o texto do servidor; o navegador junta os dois.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE' }, async ({ sessao }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, `As anotações passam do limite de ${ANOTACOES_MAX.toLocaleString('pt-BR')} caracteres.`)
    const reserva = await carregarReserva(params.id)
    const acesso = await acessoDeLeitura(reserva, sessao.userId)
    if (!acesso) return naoEncontrado()
    const c = await obterColecoes()
    const id = idDe(reserva)
    const agora = new Date()
    const { texto, versaoBase } = corpo.data
    try {
      const doc = await c.anotacoes.findOneAndUpdate(
        { userId: sessao.userId, reservaId: id, ...(versaoBase > 0 ? { versao: versaoBase } : {}) },
        versaoBase > 0
          ? { $set: { texto, updatedAt: agora }, $inc: { versao: 1 } }
          : { $setOnInsert: { userId: sessao.userId, reservaId: id, texto, versao: 1, createdAt: agora, updatedAt: agora } },
        { upsert: versaoBase === 0, returnDocument: 'after', projection: { versao: 1, texto: 1 } },
      )
      // versaoBase 0 com documento já existente: o upsert não grava; é conflito.
      if (doc && (versaoBase > 0 || doc.texto === texto)) return ok({ versao: doc.versao, atualizadoEm: agora })
    } catch (err) {
      if (!ehDuplicada(err)) throw err
    }
    const atual = await c.anotacoes.findOne({ userId: sessao.userId, reservaId: id }, { projection: { texto: 1, versao: 1 } })
    return erro(409, 'As anotações mudaram em outro aparelho.', { texto: atual?.texto || '', versao: atual?.versao || 0 })
  })
}
