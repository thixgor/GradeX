/**
 * Entrega da oferta exclusiva: e-mail e aviso no sino. Separado de
 * lib/ofertas-exclusivas.ts para que as regras puras não carreguem o SMTP.
 */

import type { Db } from 'mongodb'
import { deliverTransactionalEmails, sendOfertaExclusivaEmail } from './mail'
import { getAppUrl } from './serial-keys'
import { OFERTAS_COLLECTION, montarVitrine, type OfertaExclusiva, type VitrineDaOferta } from './ofertas-exclusivas'

export function caminhoDaOferta(id: string) {
  return `/oferta/${encodeURIComponent(id)}`
}

export async function enviarOferta(
  db: Db,
  oferta: OfertaExclusiva,
  canais: { email: boolean; notificacao: boolean }
): Promise<{ link: string; vitrine: VitrineDaOferta; emailEnviado: boolean; emailErro: string | null }> {
  const id = String(oferta._id)
  const link = `${getAppUrl()}${caminhoDaOferta(id)}`
  const vitrine = await montarVitrine(db, oferta)
  const agora = new Date()

  let emailEnviado = false
  let emailErro: string | null = null
  if (canais.email && oferta.userEmail) {
    const cupomVale = vitrine.cupom?.estado === 'ativo'
    await deliverTransactionalEmails([
      sendOfertaExclusivaEmail({
        email: oferta.userEmail,
        name: oferta.userName,
        titulo: oferta.titulo,
        mensagem: oferta.mensagem,
        itens: vitrine.itens.map((item) => ({ titulo: item.titulo, preco: item.preco, precoFinal: item.precoFinal })),
        subtotal: vitrine.subtotal,
        desconto: vitrine.desconto,
        total: vitrine.total,
        cupom: cupomVale && vitrine.cupom ? { codigo: vitrine.cupom.codigo, rotulo: vitrine.cupom.rotulo } : null,
        validoAte: cupomVale && vitrine.cupom?.validoAte ? new Date(vitrine.cupom.validoAte) : null,
        usosRestantes: cupomVale ? vitrine.cupom?.usosRestantes ?? null : null,
        link,
      }).then(
        () => { emailEnviado = true },
        (erro: any) => {
          console.error('[ofertas] e-mail da oferta não saiu:', erro)
          emailErro = erro?.message || 'Falha no envio'
        }
      ),
    ])
  } else if (canais.email) {
    emailErro = 'Conta sem e-mail cadastrado'
  }

  await Promise.all([
    db.collection<OfertaExclusiva>(OFERTAS_COLLECTION).updateOne(
      { _id: oferta._id },
      {
        $set: {
          ...(emailEnviado ? { emailEnviadoEm: agora } : {}),
          emailErro,
          updatedAt: agora,
        },
      }
    ),
    canais.notificacao
      ? db.collection('notifications').insertOne({
          userId: oferta.userId,
          type: 'oferta',
          title: oferta.titulo,
          message: vitrine.desconto > 0 && vitrine.cupom
            ? `Montamos um carrinho só para você, com ${vitrine.cupom.rotulo}. Toque para ver.`
            : 'Montamos um carrinho só para você. Toque para ver.',
          actionUrl: caminhoDaOferta(id),
          read: false,
          createdAt: agora,
        })
      : Promise.resolve(null),
  ])

  return { link, vitrine, emailEnviado, emailErro }
}
