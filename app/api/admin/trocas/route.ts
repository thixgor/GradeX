/**
 * Troca de produto: o admin troca um material/pacote que a pessoa tem por
 * outro. Regras e motivos em lib/trocas-de-produto.ts.
 *
 * GET  /api/admin/trocas?userId=…         → histórico (as 50 mais recentes)
 * POST /api/admin/trocas
 *   Body: {
 *     purchaseId, novoItemType, novoItemId,
 *     tratamento?, observacao?, enviarEmail? (padrão true),
 *     simular? — true só devolve a comparação de preços, sem trocar nada
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { deliverTransactionalEmails, sendTrocaDeProdutoEmail } from '@/lib/mail'
import { materialItemUrl } from '@/lib/admin-material-delivery'
import {
  TROCAS_COLLECTION,
  compararPrecos,
  fraseDaDiferenca,
  jaPossuiFora,
  montarCompraDaTroca,
  normalizarTratamento,
  precoDeCatalogo,
  type RegistroDeTroca,
} from '@/lib/trocas-de-produto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Schema = z.object({
  purchaseId: z.string().refine(ObjectId.isValid, 'purchaseId inválido'),
  novoItemType: z.enum(['material', 'package']),
  novoItemId: z.string().refine(ObjectId.isValid, 'Item inválido'),
  tratamento: z.enum(['cortesia', 'diferenca_paga', 'sem_reembolso', 'reembolso_combinado']).nullable().optional(),
  observacao: z.string().max(500).optional(),
  enviarEmail: z.boolean().default(true),
  simular: z.boolean().default(false),
})

type ItemDoCatalogo = { title?: string; pricing?: string; price?: number }

function colecaoDoItem(itemType: 'material' | 'package') {
  return itemType === 'package' ? 'material_packages' : 'materials'
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const userId = request.nextUrl.searchParams.get('userId') || ''
  const db = await getDb()
  const trocas = await db
    .collection<RegistroDeTroca>(TROCAS_COLLECTION)
    .find(userId ? { userId } : {})
    .sort({ criadoEm: -1 })
    .limit(50)
    .toArray()

  return NextResponse.json({
    trocas: trocas.map((t) => ({ ...t, _id: String(t._id) })),
  })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 })
  }
  const data = parsed.data

  try {
    const db = await getDb()
    const compra = await db.collection('material_purchases').findOne({ _id: new ObjectId(data.purchaseId) })
    if (!compra || compra.status !== 'completed') {
      return NextResponse.json({ error: 'Compra não encontrada ou sem acesso ativo.' }, { status: 404 })
    }
    if (compra.itemType !== 'material' && compra.itemType !== 'package') {
      return NextResponse.json({ error: 'Só materiais e pacotes podem ser trocados.' }, { status: 422 })
    }
    if (compra.source === 'plus') {
      return NextResponse.json(
        { error: 'Este item foi resgatado pela assinatura Plus+ — não é uma compra para trocar.' },
        { status: 422 }
      )
    }
    if (!compra.userId || !ObjectId.isValid(String(compra.userId))) {
      return NextResponse.json({ error: 'Compra sem conta vinculada.' }, { status: 422 })
    }
    if (compra.itemType === data.novoItemType && String(compra.itemId) === data.novoItemId) {
      return NextResponse.json({ error: 'Escolha um produto diferente do atual.' }, { status: 400 })
    }

    const userId = String(compra.userId)
    const [itemAntigo, itemNovo, usuario, jaTem] = await Promise.all([
      ObjectId.isValid(String(compra.itemId))
        ? db.collection<ItemDoCatalogo>(colecaoDoItem(compra.itemType)).findOne(
            { _id: new ObjectId(String(compra.itemId)) },
            { projection: { title: 1, pricing: 1, price: 1 } }
          )
        : Promise.resolve(null),
      db.collection<ItemDoCatalogo>(colecaoDoItem(data.novoItemType)).findOne(
        { _id: new ObjectId(data.novoItemId) },
        { projection: { title: 1, pricing: 1, price: 1 } }
      ),
      db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { name: 1, email: 1 } }),
      jaPossuiFora(db, {
        userId,
        ignorarCompraId: data.purchaseId,
        itemType: data.novoItemType,
        itemId: data.novoItemId,
      }),
    ])

    if (!itemNovo) {
      return NextResponse.json({ error: 'Produto novo não encontrado.' }, { status: 404 })
    }
    if (jaTem) {
      return NextResponse.json(
        { error: 'Esta pessoa já tem acesso ao produto novo por outra compra ou pacote.' },
        { status: 409 }
      )
    }

    const comparacao = compararPrecos({
      // Item antigo apagado do catálogo: o que foi pago é a melhor referência.
      precoAntigo: itemAntigo ? precoDeCatalogo(itemAntigo) : Number(compra.price || 0),
      precoNovo: precoDeCatalogo(itemNovo),
      valorPago: Number(compra.price || 0),
    })
    const tratamento = normalizarTratamento(comparacao.relacao, data.tratamento)
    const de = {
      itemType: compra.itemType as 'material' | 'package',
      itemId: String(compra.itemId),
      itemTitle: itemAntigo?.title || compra.itemTitle || 'Produto anterior',
    }
    const para = {
      itemType: data.novoItemType,
      itemId: data.novoItemId,
      itemTitle: itemNovo.title || (data.novoItemType === 'package' ? 'Pacote' : 'Material'),
    }

    if (data.simular) {
      return NextResponse.json({
        simulacao: true,
        de,
        para,
        comparacao,
        tratamento,
        fraseDoEmail: fraseDaDiferenca(comparacao, tratamento),
      })
    }

    const agora = new Date()
    const nomeDaPessoa = usuario?.name || compra.userName || ''
    const emailDaPessoa = usuario?.email || compra.userEmail || ''
    const novaCompra = montarCompraDaTroca(
      { ...compra, userName: nomeDaPessoa, userEmail: emailDaPessoa } as any,
      para,
      { userId: session.userId, name: session.name },
      agora
    )

    // Condicionado ao status: dois cliques (ou duas abas) não trocam duas vezes.
    const saida = await db.collection('material_purchases').updateOne(
      { _id: compra._id, status: 'completed' },
      {
        $set: {
          status: 'swapped',
          swappedAt: agora,
          swappedBy: session.userId,
          swappedByName: session.name,
          swappedToItem: para,
        },
      }
    )
    if (saida.matchedCount === 0) {
      return NextResponse.json({ error: 'Esta compra acabou de ser alterada. Recarregue e tente de novo.' }, { status: 409 })
    }

    let compraNovaId: string
    try {
      const inserida = await db.collection('material_purchases').insertOne(novaCompra as any)
      compraNovaId = String(inserida.insertedId)
    } catch (erro) {
      // Sem a compra nova a pessoa ficaria sem nada: devolve o acesso antigo.
      await db.collection('material_purchases').updateOne(
        { _id: compra._id, status: 'swapped' },
        { $set: { status: 'completed' }, $unset: { swappedAt: '', swappedBy: '', swappedByName: '', swappedToItem: '' } }
      )
      throw erro
    }

    await db.collection('material_purchases').updateOne(
      { _id: compra._id },
      { $set: { swappedToPurchaseId: compraNovaId } }
    )

    const observacao = data.observacao?.trim() || ''
    const registro: RegistroDeTroca = {
      userId,
      userName: nomeDaPessoa,
      userEmail: emailDaPessoa,
      compraAntigaId: data.purchaseId,
      compraNovaId,
      de,
      para,
      comparacao,
      tratamento,
      ...(observacao ? { observacao } : {}),
      emailEnviado: false,
      adminId: session.userId,
      adminName: session.name,
      criadoEm: agora,
    }

    const linkDoItem = materialItemUrl(para.itemType, para.itemId)
    let emailErro = ''
    if (data.enviarEmail && emailDaPessoa) {
      await deliverTransactionalEmails([
        sendTrocaDeProdutoEmail({
          email: emailDaPessoa,
          name: nomeDaPessoa,
          de: de.itemTitle,
          para: para.itemTitle,
          precoAntigo: comparacao.precoAntigo,
          precoNovo: comparacao.precoNovo,
          fraseDaDiferenca: fraseDaDiferenca(comparacao, tratamento),
          observacao,
          link: linkDoItem,
        }).then(
          () => { registro.emailEnviado = true },
          (err: any) => {
            console.error('[admin/trocas] e-mail da troca não saiu:', err)
            emailErro = err?.message || 'Falha no envio'
          }
        ),
      ])
    } else if (data.enviarEmail) {
      emailErro = 'Conta sem e-mail cadastrado'
    }
    if (emailErro) registro.emailErro = emailErro

    const caminhoDoItem = para.itemType === 'package'
      ? `/materiais?tab=packages&package=${para.itemId}`
      : `/materiais/${para.itemId}`

    await Promise.all([
      db.collection<RegistroDeTroca>(TROCAS_COLLECTION).insertOne(registro),
      db.collection('notifications').insertOne({
        userId,
        type: 'troca_de_produto',
        title: 'Seu produto foi trocado',
        message: `Trocamos ${de.itemTitle} por ${para.itemTitle}. Já está liberado na sua conta.`,
        actionUrl: caminhoDoItem,
        read: false,
        createdAt: agora,
      }),
      db.collection('audit_logs').insertOne({
        action: 'material_purchase_swapped',
        adminId: session.userId,
        adminName: session.name,
        userId,
        userEmail: emailDaPessoa,
        compraAntigaId: data.purchaseId,
        compraNovaId,
        de,
        para,
        comparacao,
        tratamento,
        createdAt: agora,
      }),
    ])

    return NextResponse.json({
      success: true,
      compraNovaId,
      comparacao,
      tratamento,
      emailEnviado: registro.emailEnviado,
      emailErro: emailErro || null,
    })
  } catch (error: any) {
    console.error('[admin/trocas] erro:', error)
    return NextResponse.json({ error: 'Erro ao trocar o produto.' }, { status: 500 })
  }
}
