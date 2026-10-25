import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getDb } from '@/lib/mongodb'
import { exigirAdmin } from '@/lib/embaixadores/admin'
import {
  COLECAO_EMBAIXADORES,
  COLECAO_REPASSES,
  type Embaixador,
  type RepasseDoEmbaixador,
} from '@/lib/embaixadores/servidor'
import { centavos, formatarChavePix, validarIdDaTransacao } from '@/lib/embaixadores/regras'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Contexto = { params: Promise<{ id: string }> }

const Repasse = z.object({
  valor: z.number().positive('Informe o valor do repasse.').max(1_000_000),
  pagoEm: z.string().optional(),
  idTransacao: z.string().max(60),
  referencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Escolha o mês das comissões.'),
  observacao: z.string().max(300).optional().default(''),
})

/**
 * Registra um PIX feito à mão ao embaixador. O sistema não transfere nada:
 * este registro é o que tira o valor do "a repassar". O comprovante é o ID da
 * transação PIX (E2E), que o embaixador vê no painel e confere no extrato; um
 * mesmo ID não entra duas vezes. A chave usada fica gravada junto, para o
 * comprovante bater mesmo se ele trocar de chave depois.
 */
export async function POST(request: NextRequest, { params }: Contexto) {
  const { session, recusa } = await exigirAdmin()
  if (recusa) return recusa
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Embaixador não encontrado' }, { status: 404 })

  let dados: z.infer<typeof Repasse>
  try {
    dados = Repasse.parse(await request.json())
  } catch (erro: any) {
    return NextResponse.json({ error: erro?.issues?.[0]?.message || 'Dados inválidos' }, { status: 400 })
  }
  const idDaTransacao = validarIdDaTransacao(dados.idTransacao)
  if (!idDaTransacao.ok) return NextResponse.json({ error: idDaTransacao.erro }, { status: 400 })
  const pagoEm = dados.pagoEm ? new Date(dados.pagoEm) : new Date()
  if (Number.isNaN(pagoEm.getTime()) || pagoEm.getTime() > Date.now() + 86_400_000) {
    return NextResponse.json({ error: 'Data do pagamento inválida.' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const [embaixador, repetido] = await Promise.all([
      db.collection<Embaixador>(COLECAO_EMBAIXADORES).findOne({ _id: new ObjectId(id) }),
      db.collection(COLECAO_REPASSES).findOne({ idTransacao: idDaTransacao.id }, { projection: { _id: 1 } }),
    ])
    if (!embaixador) return NextResponse.json({ error: 'Embaixador não encontrado' }, { status: 404 })
    if (repetido) return NextResponse.json({ error: 'Este ID de transação já foi registrado em outro repasse.' }, { status: 409 })

    const repasse: RepasseDoEmbaixador = {
      embaixadorId: id,
      valor: centavos(dados.valor),
      pagoEm,
      observacao: dados.observacao.trim(),
      idTransacao: idDaTransacao.id,
      referencia: dados.referencia,
      chavePix: embaixador.pix ? `${formatarChavePix(embaixador.pix)} (${embaixador.pix.titular})` : '',
      registradoPor: session!.userId,
      registradoPorNome: session!.name || '',
      criadoEm: new Date(),
    }
    const inserido = await db.collection<RepasseDoEmbaixador>(COLECAO_REPASSES).insertOne(repasse)
    return NextResponse.json({ id: inserido.insertedId.toString() }, { status: 201 })
  } catch (erro: any) {
    if (erro?.code === 11000) {
      return NextResponse.json({ error: 'Este ID de transação já foi registrado em outro repasse.' }, { status: 409 })
    }
    console.error('[admin/embaixadores/repasses] POST', erro)
    return NextResponse.json({ error: 'Erro ao registrar o repasse' }, { status: 500 })
  }
}

/** Desfaz um repasse lançado por engano (`?repasseId=`). */
export async function DELETE(request: NextRequest, { params }: Contexto) {
  const { recusa } = await exigirAdmin()
  if (recusa) return recusa
  const { id } = await params
  const repasseId = request.nextUrl.searchParams.get('repasseId') || ''
  if (!ObjectId.isValid(id) || !ObjectId.isValid(repasseId)) {
    return NextResponse.json({ error: 'Repasse não encontrado' }, { status: 404 })
  }
  try {
    const db = await getDb()
    const r = await db.collection(COLECAO_REPASSES).deleteOne({ _id: new ObjectId(repasseId), embaixadorId: id })
    if (r.deletedCount === 0) return NextResponse.json({ error: 'Repasse não encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error('[admin/embaixadores/repasses] DELETE', erro)
    return NextResponse.json({ error: 'Erro ao desfazer o repasse' }, { status: 500 })
  }
}
