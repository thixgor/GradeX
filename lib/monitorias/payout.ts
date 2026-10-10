import 'server-only'

/**
 * Pagamento ao monitor (repasse dos 90%).
 *
 * Hoje é MANUAL: o admin vê a fila, faz o PIX pelo banco, anexa o comprovante
 * e informa o identificador E2E. A interface `ProvedorDePayout` existe para
 * plugar depois um PIX automático (Asaas, Efí...) sem mexer no resto: troca-se
 * o `enviar` e o fluxo de estados continua o mesmo.
 *
 * Segurança:
 *  - repasses entram no pagamento por compare-and-set (`liberado → em_pagamento`):
 *    o mesmo repasse nunca entra em dois pagamentos;
 *  - o E2E tem índice único: o mesmo comprovante não "paga" duas vezes;
 *  - a chave PIX completa só é revelada ao admin por ação explícita, auditada.
 */

import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { audit } from '@/lib/payments/audit'
import { maskCpf } from '@/lib/cpf'
import { colecoes, ehDuplicada, idDe } from './db'
import { lancar } from './financeiro'
import { avisar } from './avisos'
import { formatarCentavos } from './dinheiro'
import { ErroMonitoria } from './reservas'
import type { Payout } from './tipos'

/** Formato do identificador fim-a-fim do PIX (BACEN): E + ISPB(8) + AAAAMMDDHHmm(12) + 11 alfanuméricos. */
export const E2E_PIX = /^E\d{8}\d{12}[A-Za-z0-9]{11}$/

export interface ProvedorDePayout {
  id: 'manual'
  /** No manual não faz nada: quem envia é o admin, pelo banco. */
  enviar(payout: Payout): Promise<{ automatico: boolean }>
}

const MANUAL: ProvedorDePayout = {
  id: 'manual',
  async enviar() {
    return { automatico: false }
  },
}

export function provedorDePayout(): ProvedorDePayout {
  // MONITORIAS_PAYOUT_PROVIDER=asaas|efi entra aqui quando existir.
  return MANUAL
}

export async function criarPayout(input: { tutorId: string; adminId: string; ip: string }): Promise<Payout> {
  const c = colecoes(await getDb())
  if (!ObjectId.isValid(input.tutorId)) throw new ErroMonitoria(404, 'Monitor não encontrado.')
  const tutor = await c.tutores.findOne({ _id: new ObjectId(input.tutorId) } as any)
  if (!tutor) throw new ErroMonitoria(404, 'Monitor não encontrado.')
  if (!tutor.pix) throw new ErroMonitoria(409, 'O monitor não tem chave PIX ativa.')
  const [aberto, titular] = await Promise.all([
    c.payouts.findOne({ tutorId: input.tutorId, status: 'aberto' }),
    c.users.findOne({ _id: new ObjectId(tutor.userId) } as any, { projection: { cpf: 1 } }),
  ])
  if (aberto) throw new ErroMonitoria(409, 'Já existe um pagamento em aberto para este monitor. Conclua ou cancele antes.')

  const liberados = await c.repasses.find({ tutorId: input.tutorId, status: 'liberado' }).toArray()
  if (!liberados.length) throw new ErroMonitoria(409, 'Nada liberado para pagar.')
  const soma = liberados.reduce((t, r) => t + r.liquidoTutorCentavos, 0)
  const abatido = Math.min(soma, Math.max(0, tutor.saldoDevedorCentavos || 0))
  const total = soma - abatido
  if (total <= 0) throw new ErroMonitoria(409, 'O saldo devedor do monitor cobre todo o valor liberado.')

  const agora = new Date()
  const payout: Payout = {
    tutorId: input.tutorId,
    tutorUserId: tutor.userId,
    repasseIds: liberados.map((r) => idDe(r)),
    totalCentavos: total,
    abatidoCentavos: abatido,
    pix: { tipo: tutor.pix.tipo, mascarada: tutor.pix.mascarada, titularCpfMascarado: maskCpf(titular?.cpf) },
    provider: provedorDePayout().id,
    status: 'aberto',
    criadoPor: input.adminId,
    createdAt: agora,
    updatedAt: agora,
  }
  const res = await c.payouts.insertOne(payout as any)
  payout._id = res.insertedId
  const payoutId = String(res.insertedId)
  const travados = await c.repasses.updateMany(
    { _id: { $in: liberados.map((r) => r._id as ObjectId) }, status: 'liberado' } as any,
    { $set: { status: 'em_pagamento', payoutId, updatedAt: agora } },
  )
  if (travados.modifiedCount !== liberados.length) {
    // Outro admin agiu ao mesmo tempo: desfaz tudo em vez de pagar parcial.
    await c.repasses.updateMany({ payoutId, status: 'em_pagamento' }, { $set: { status: 'liberado', updatedAt: new Date() }, $unset: { payoutId: '' } })
    await c.payouts.updateOne({ _id: res.insertedId } as any, { $set: { status: 'cancelado', updatedAt: new Date() } })
    throw new ErroMonitoria(409, 'Os repasses mudaram enquanto o pagamento era criado. Tente de novo.')
  }
  // Um estorno parcial pode ter mudado algum valor entre a leitura e a trava:
  // o total vem dos repasses JÁ travados (agora ninguém mais mexe neles).
  const travadosAgora = await c.repasses.find({ payoutId, status: 'em_pagamento' }).toArray()
  const somaReal = travadosAgora.reduce((t, r) => t + r.liquidoTutorCentavos, 0)
  if (somaReal !== soma) {
    const abatidoReal = Math.min(somaReal, Math.max(0, tutor.saldoDevedorCentavos || 0))
    payout.totalCentavos = somaReal - abatidoReal
    payout.abatidoCentavos = abatidoReal
    await c.payouts.updateOne({ _id: res.insertedId } as any, { $set: { totalCentavos: payout.totalCentavos, abatidoCentavos: abatidoReal, updatedAt: new Date() } })
  }
  await provedorDePayout().enviar(payout)
  await audit({ action: 'monitoria_payout_criado', actorUserId: input.adminId, targetUserId: tutor.userId, resourceType: 'monitoria_payout', resourceId: payoutId, metadata: { totalCentavos: total, abatido, repasses: payout.repasseIds.length }, ip: input.ip })
  return payout
}

export async function anexarComprovante(input: { payoutId: string; path: string; tipo: string }): Promise<void> {
  const c = colecoes(await getDb())
  const res = await c.payouts.updateOne(
    { _id: new ObjectId(input.payoutId), status: 'aberto' } as any,
    { $set: { comprovantePath: input.path, comprovanteTipo: input.tipo, updatedAt: new Date() } },
  )
  if (res.matchedCount === 0) throw new ErroMonitoria(409, 'Pagamento não está em aberto.')
}

export async function confirmarPayout(input: { payoutId: string; e2eId: string; adminId: string; ip: string }): Promise<Payout> {
  const c = colecoes(await getDb())
  const e2e = input.e2eId.trim()
  if (!E2E_PIX.test(e2e)) throw new ErroMonitoria(400, 'Identificador E2E inválido (32 caracteres começando com "E").')
  if (!ObjectId.isValid(input.payoutId)) throw new ErroMonitoria(404, 'Não encontrado.')
  const payout = await c.payouts.findOne({ _id: new ObjectId(input.payoutId) } as any)
  if (!payout || payout.status !== 'aberto') throw new ErroMonitoria(409, 'Pagamento não está em aberto.')
  if (!payout.comprovantePath) throw new ErroMonitoria(409, 'Anexe o comprovante do PIX antes de confirmar.')
  const limite = Number(process.env.MONITORIAS_PAYOUT_DUPLA_ACIMA_CENTAVOS || 0)
  if (limite > 0 && payout.totalCentavos > limite && payout.criadoPor === input.adminId) {
    throw new ErroMonitoria(403, `Pagamentos acima de ${formatarCentavos(limite)} precisam ser confirmados por outro administrador.`)
  }
  const agora = new Date()
  let atualizado: Payout | null
  try {
    atualizado = await c.payouts.findOneAndUpdate(
      { _id: payout._id as any, status: 'aberto' },
      { $set: { status: 'pago', e2eId: e2e, pagoPor: input.adminId, pagoEm: agora, updatedAt: agora } },
      { returnDocument: 'after' },
    )
  } catch (err) {
    if (ehDuplicada(err)) throw new ErroMonitoria(409, 'Este E2E já foi usado em outro pagamento.')
    throw err
  }
  if (!atualizado) throw new ErroMonitoria(409, 'Pagamento não está em aberto.')
  await c.repasses.updateMany({ payoutId: input.payoutId, status: 'em_pagamento' }, { $set: { status: 'pago', updatedAt: agora } })
  const lancamentos = [
    {
      tutorId: payout.tutorId,
      payoutId: input.payoutId,
      tipo: 'repasse' as const,
      valorCentavos: -payout.totalCentavos,
      descricao: `PIX enviado ao monitor (E2E ${e2e})`,
      por: input.adminId,
    },
  ]
  if (payout.abatidoCentavos > 0) {
    // Só informativo (valor 0): a dívida já entrou no extrato quando nasceu
    // (lançamento 'saldo_devedor' negativo) e o PIX acima já veio menor.
    // Lançar −abatido de novo descontaria a mesma dívida duas vezes.
    lancamentos.push({
      tutorId: payout.tutorId,
      payoutId: input.payoutId,
      tipo: 'repasse' as const,
      valorCentavos: 0,
      descricao: `Saldo devedor de ${formatarCentavos(payout.abatidoCentavos)} quitado neste pagamento (descontado do PIX)`,
      por: input.adminId,
    })
    await c.tutores.updateOne({ _id: new ObjectId(payout.tutorId) } as any, { $inc: { saldoDevedorCentavos: -payout.abatidoCentavos } })
  }
  await lancar(lancamentos)
  await audit({ action: 'monitoria_payout_pago', actorUserId: input.adminId, targetUserId: payout.tutorUserId, resourceType: 'monitoria_payout', resourceId: input.payoutId, metadata: { e2e, totalCentavos: payout.totalCentavos }, ip: input.ip })
  await avisar([
    {
      userId: payout.tutorUserId,
      titulo: 'Você recebeu um repasse 💸',
      mensagem: `${formatarCentavos(payout.totalCentavos)} enviados por PIX para ${payout.pix.mascarada}.`,
      url: '/monitorias/painel/financeiro',
      email: {
        assunto: `Repasse enviado: ${formatarCentavos(payout.totalCentavos)}`,
        paragrafos: ['Enviamos por PIX o valor das suas monitorias liberadas. O comprovante e o demonstrativo em PDF estão no seu painel financeiro.'],
        linhas: [
          ['Valor', formatarCentavos(payout.totalCentavos)],
          ...(payout.abatidoCentavos ? ([['Saldo devedor abatido', formatarCentavos(payout.abatidoCentavos)]] as Array<[string, string]>) : []),
          ['Chave PIX', payout.pix.mascarada],
          ['Identificador E2E', e2e],
          ['Monitorias incluídas', String(payout.repasseIds.length)],
        ],
        botao: 'Ver no painel financeiro',
      },
    },
  ])
  return atualizado
}

export async function cancelarPayout(input: { payoutId: string; adminId: string }): Promise<void> {
  const c = colecoes(await getDb())
  if (!ObjectId.isValid(input.payoutId)) throw new ErroMonitoria(404, 'Não encontrado.')
  const res = await c.payouts.updateOne(
    { _id: new ObjectId(input.payoutId), status: 'aberto' } as any,
    { $set: { status: 'cancelado', updatedAt: new Date() } },
  )
  if (res.matchedCount === 0) throw new ErroMonitoria(409, 'Pagamento não está em aberto.')
  await c.repasses.updateMany(
    { payoutId: input.payoutId, status: 'em_pagamento' },
    { $set: { status: 'liberado', updatedAt: new Date() }, $unset: { payoutId: '' } },
  )
  await audit({ action: 'monitoria_payout_cancelado', actorUserId: input.adminId, resourceType: 'monitoria_payout', resourceId: input.payoutId })
}
