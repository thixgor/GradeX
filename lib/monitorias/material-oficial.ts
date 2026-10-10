import 'server-only'

/**
 * Material OFICIAL vendido junto com a monitoria (no mesmo PIX).
 *
 * Reaproveita o sistema de materiais em vez de criar outro:
 *  - "oficial" = documento da coleção `materials` (só admin cria), pago, com
 *    preço > 0 e visível na loja. Link externo, material do monitor ou id
 *    inventado nunca passam daqui;
 *  - o preço é `materials.price` (R$) lido NA HORA de gerar o PIX, em centavos;
 *    nada vem do navegador. Sem cupom, lote ou PROUNI: é o preço cheio;
 *  - "o aluno já tem?" é a mesma checagem do leitor de materiais
 *    (`hasAccessToTarget`) e do resgate do Plus+ (`contaResgataMateriaisComPlus`);
 *  - a entrega é uma compra em `material_purchases`, igual à da loja, ligada
 *    ao pedido da monitoria (`providerOrderId`), com `origem: 'monitoria'`.
 */

import { ObjectId, type Db } from 'mongodb'
import { hasAccessToTarget } from '@/lib/access'
import { contaResgataMateriaisComPlus } from '@/lib/plus-claims'
import type { TokenPayload } from '@/lib/auth'
import type { MaterialNaCompra } from './tipos'

export interface MaterialAVenda {
  id: string
  titulo: string
  capa: string | null
  precoCentavos: number
  /** O admin tirou este material da comissão do sócio (mesma regra da loja). */
  foraDaComissaoDoSocio: boolean
}

/** O material, se ele pode ser vendido agora (oficial, pago, visível, preço > 0). */
export async function materialOficialAVenda(db: Db, id: string | null | undefined): Promise<MaterialAVenda | null> {
  if (!id || !ObjectId.isValid(id)) return null
  const m = await db.collection('materials').findOne(
    { _id: new ObjectId(id), pricing: 'paid', isHidden: { $ne: true } },
    { projection: { title: 1, price: 1, coverImage: 1, excludeFromCommission: 1 } },
  )
  const preco = Number(m?.price)
  if (!m || !Number.isFinite(preco) || preco <= 0) return null
  return {
    id: String(m._id),
    titulo: String(m.title || 'Material'),
    capa: typeof m.coverImage === 'string' && m.coverImage ? m.coverImage : null,
    precoCentavos: Math.round(preco * 100),
    foraDaComissaoDoSocio: !!m.excludeFromCommission,
  }
}

/**
 * Ao salvar o anúncio: o material indicado precisa ser oficial e estar à venda.
 * Link externo, material grátis, escondido ou id inventado → mensagem de erro.
 */
export async function erroDoMaterialOficial(id: string | null | undefined): Promise<string | null> {
  if (!id) return null
  const { getDb } = await import('@/lib/mongodb')
  const material = await materialOficialAVenda(await getDb(), id)
  return material ? null : 'Escolha um material oficial pago da loja de Materiais (ou remova a indicação).'
}

/**
 * O aluno já tem acesso a este material (comprou, tem o pacote, é admin) ou
 * pode resgatá-lo de graça pelo Plus+? Então não vendemos de novo, e a
 * monitoria fica com a divisão normal (sem isenção).
 */
export async function alunoJaTemMaterial(
  db: Db,
  aluno: { _id: unknown; email?: string; name?: string; role?: string },
  materialId: string,
): Promise<boolean> {
  const userId = String(aluno._id)
  const sessao = { userId, email: aluno.email || '', name: aluno.name || '', role: aluno.role === 'admin' ? 'admin' : 'user', emailVerified: true } as TokenPayload
  const [acesso, plus] = await Promise.all([
    hasAccessToTarget({ session: sessao, targetType: 'material', targetId: materialId, db }),
    contaResgataMateriaisComPlus(db, userId),
  ])
  return acesso.allowed || plus
}

/**
 * Entrega o material comprado junto (idempotente: uma compra por pedido).
 * `$setOnInsert`: reprocessar a aprovação nunca "desfaz" um estorno já gravado.
 */
export async function concederMaterialDaMonitoria(
  db: Db,
  input: {
    material: MaterialNaCompra
    aluno: { id: string; nome: string; email: string }
    participacaoId: string
    providerPaymentId: string
  },
): Promise<void> {
  const agora = new Date()
  await db.collection('material_purchases').updateOne(
    { userId: input.aluno.id, itemType: 'material', itemId: input.material.id, providerOrderId: input.material.paymentOrderId },
    {
      $setOnInsert: {
        userId: input.aluno.id,
        userName: input.aluno.nome,
        userEmail: input.aluno.email,
        itemType: 'material',
        itemId: input.material.id,
        itemTitle: input.material.titulo,
        price: input.material.precoCentavos / 100,
        provider: 'mercado_pago',
        providerOrderId: input.material.paymentOrderId,
        providerPaymentId: input.providerPaymentId,
        status: 'completed',
        source: 'purchase',
        origem: 'monitoria',
        participacaoId: input.participacaoId,
        purchasedAt: agora,
        createdAt: agora,
      },
    },
    { upsert: true },
  )
}

/** Pagamento devolvido/contestado por inteiro: o material vendido nele sai junto. */
export async function revogarMaterialDaMonitoria(db: Db, paymentOrderId: string | null | undefined): Promise<number> {
  if (!paymentOrderId) return 0
  const res = await db.collection('material_purchases').updateMany(
    { providerOrderId: paymentOrderId, origem: 'monitoria', status: 'completed' },
    { $set: { status: 'refunded', refundedAt: new Date() } },
  )
  return res.modifiedCount
}

/** A venda do material que isentou a taxa continua de pé (não foi estornada)? */
export async function vendaDoMaterialValida(db: Db, material: MaterialNaCompra, alunoId: string): Promise<boolean> {
  const compra = await db.collection('material_purchases').findOne(
    { userId: alunoId, itemType: 'material', itemId: material.id, providerOrderId: material.paymentOrderId, status: 'completed' },
    { projection: { _id: 1 } },
  )
  return !!compra
}
