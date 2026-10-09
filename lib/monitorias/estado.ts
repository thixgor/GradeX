/**
 * Máquina de estados da reserva.
 *
 *   solicitada ─► em_negociacao ─► aguardando_assinaturas ─► aguardando_pagamento ─► confirmada
 *                                                                                       │
 *                     concluida ◄── (48h sem reclamação) ◄── realizada ◄── (aula acabou)┘
 *
 * Saídas laterais: recusada, expirada, cancelada_aluno, cancelada_monitor,
 * em_disputa → (admin decide) concluida | reembolsada.
 *
 * Esta tabela é a ÚNICA fonte de "pode ir de X para Y". As rotas a consultam
 * e, ao gravar, fazem compare-and-set (`{_id, status: de, versao}`): se outra
 * requisição mudou a reserva no meio do caminho, a gravação não casa e nada
 * acontece em dobro.
 */

import type { StatusReserva } from './tipos'

const TRANSICOES: Record<StatusReserva, StatusReserva[]> = {
  solicitada: ['em_negociacao', 'aguardando_assinaturas', 'recusada', 'expirada', 'cancelada_aluno'],
  em_negociacao: ['em_negociacao', 'aguardando_assinaturas', 'recusada', 'expirada', 'cancelada_aluno', 'cancelada_monitor'],
  aguardando_assinaturas: ['em_negociacao', 'aguardando_pagamento', 'confirmada', 'expirada', 'cancelada_aluno', 'cancelada_monitor'],
  aguardando_pagamento: ['confirmada', 'expirada', 'cancelada_aluno', 'cancelada_monitor', 'em_disputa'],
  confirmada: ['realizada', 'cancelada_aluno', 'cancelada_monitor', 'em_disputa'],
  realizada: ['concluida', 'em_disputa'],
  // `confirmada`: o suporte negou o cancelamento de última hora e a aula segue.
  em_disputa: ['confirmada', 'concluida', 'reembolsada'],
  concluida: [],
  cancelada_aluno: [],
  cancelada_monitor: [],
  recusada: [],
  expirada: [],
  reembolsada: [],
}

export function podeTransitar(de: StatusReserva, para: StatusReserva): boolean {
  return TRANSICOES[de]?.includes(para) ?? false
}

export const STATUS_EM_ABERTO: StatusReserva[] = [
  'solicitada',
  'em_negociacao',
  'aguardando_assinaturas',
  'aguardando_pagamento',
]

export const STATUS_ATIVOS: StatusReserva[] = [...STATUS_EM_ABERTO, 'confirmada', 'realizada', 'em_disputa']

export const STATUS_FINAIS: StatusReserva[] = [
  'concluida',
  'cancelada_aluno',
  'cancelada_monitor',
  'recusada',
  'expirada',
  'reembolsada',
]

/** Ainda dá para conversar/propor? */
export function negociavel(status: StatusReserva): boolean {
  return status === 'solicitada' || status === 'em_negociacao' || status === 'aguardando_assinaturas'
}

export const ROTULOS_STATUS: Record<StatusReserva, { rotulo: string; tom: 'neutro' | 'info' | 'alerta' | 'sucesso' | 'erro' }> = {
  solicitada: { rotulo: 'Solicitada', tom: 'info' },
  em_negociacao: { rotulo: 'Em negociação', tom: 'info' },
  aguardando_assinaturas: { rotulo: 'Aguardando assinaturas', tom: 'alerta' },
  aguardando_pagamento: { rotulo: 'Aguardando pagamento', tom: 'alerta' },
  confirmada: { rotulo: 'Confirmada', tom: 'sucesso' },
  realizada: { rotulo: 'Realizada', tom: 'sucesso' },
  concluida: { rotulo: 'Concluída', tom: 'sucesso' },
  em_disputa: { rotulo: 'Em análise pelo suporte', tom: 'alerta' },
  cancelada_aluno: { rotulo: 'Cancelada pelo aluno', tom: 'erro' },
  cancelada_monitor: { rotulo: 'Cancelada pelo monitor', tom: 'erro' },
  recusada: { rotulo: 'Recusada', tom: 'erro' },
  expirada: { rotulo: 'Expirada', tom: 'neutro' },
  reembolsada: { rotulo: 'Reembolsada', tom: 'neutro' },
}

/** Etapas mostradas na linha do tempo da reserva. */
export const ETAPAS_LINHA_DO_TEMPO: Array<{ chave: string; rotulo: string; status: StatusReserva[] }> = [
  { chave: 'pedido', rotulo: 'Pedido', status: ['solicitada'] },
  { chave: 'combinado', rotulo: 'Combinado', status: ['em_negociacao'] },
  { chave: 'contrato', rotulo: 'Contrato', status: ['aguardando_assinaturas'] },
  { chave: 'pagamento', rotulo: 'Pagamento', status: ['aguardando_pagamento'] },
  { chave: 'aula', rotulo: 'Aula', status: ['confirmada'] },
  { chave: 'concluida', rotulo: 'Concluída', status: ['realizada', 'concluida'] },
]
