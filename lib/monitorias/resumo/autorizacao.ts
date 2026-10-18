import 'server-only'

/**
 * A voz do monitor no Resumo por IA é autorizada nos Termos do Monitor (itens
 * 5.4 a 5.7, desde a versão 2026.10-v5): sem cartão na sala, sem pausa e sem
 * reembolso por recusa. Monitor que ainda não aceitou essa versão segue o fluxo
 * antigo (autoriza na sala), como o aditivo r1 prometeu a quem já comprou.
 */

import { getDb } from '@/lib/mongodb'
import { colecoes } from '../db'
import { termosAutorizamResumo } from '../documentos/termos'

export async function autorizacaoPelosTermos(userId: string): Promise<{ versao: string; em: Date } | null> {
  const c = colecoes(await getDb())
  const aceites = await c.termos.find({ userId, papel: 'monitor' }, { projection: { versao: 1, em: 1 } }).limit(20).toArray()
  const valido = aceites.filter((a) => termosAutorizamResumo(a.versao)).sort((a, b) => new Date(a.em).getTime() - new Date(b.em).getTime())[0]
  return valido ? { versao: valido.versao, em: new Date(valido.em) } : null
}
