import 'server-only'

import { getDb } from '@/lib/mongodb'

import estatico from './indice-estatico.gerado.json'
import { itensDoBanco } from './itens-do-banco'
import { prepararIndice, type IndicePreparado } from './relacionar'
import type { ItemDoManual } from './tipos'

/**
 * O índice completo do Estudo Integrado, como a rota o usa.
 *
 * Duas metades:
 * - **estática** — os manuais em código, gerados para `indice-estatico.gerado.json`
 *   (ver `fontes-estaticas.ts`). Vem pronta no bundle da função.
 * - **do banco** — as fichas do Manual Clínico e da Farmacologia, que mudam
 *   quando o admin publica. Lidas com projeção mínima, as duas coleções no
 *   mesmo `Promise.all`, e guardadas por dez minutos por instância.
 *
 * A promessa fica guardada (não só o resultado) para que requisições
 * concorrentes na mesma lambda esperem a MESMA leitura em vez de dispararem
 * uma cada uma — o mesmo arranjo das calculadoras em `app/api/busca/route.ts`.
 */

const VALIDADE_MS = 10 * 60 * 1000
const TEMPO_MAXIMO_MS = 4000

let emCache: { em: number; promessa: Promise<IndicePreparado> } | null = null

async function lerDoBanco(): Promise<ItemDoManual[]> {
  const db = await getDb()
  const [patologias, medicamentos] = await Promise.all([
    db
      .collection('patologias')
      .find({})
      .project({
        nome: 1,
        slug: 1,
        sinonimos: 1,
        sistema: 1,
        cid10: 1,
        'farmacologia.primeira_linha.medicamento': 1,
        'farmacologia.segunda_linha.medicamento': 1,
        'farmacologia.terceira_linha.medicamento': 1,
      })
      .maxTimeMS(TEMPO_MAXIMO_MS)
      .toArray(),
    db
      .collection('medicamentos')
      .find({})
      .project({ nome: 1, slug: 1, sinonimos: 1, classe_principal: 1, subclasse: 1 })
      .maxTimeMS(TEMPO_MAXIMO_MS)
      .toArray(),
  ])
  return itensDoBanco(patologias, medicamentos)
}

async function montar(): Promise<IndicePreparado> {
  const doBanco = await lerDoBanco()
  const itens = [...(estatico as ItemDoManual[]), ...doBanco]
  return prepararIndice(descartarLigacoesQuebradas(itens))
}

/**
 * O acervo cita fichas por slug (um sinal aponta "insuficiencia-cardiaca").
 * Se a ficha foi renomeada ou ainda não existe, a ligação some aqui em vez de
 * virar um link para página inexistente.
 */
function descartarLigacoesQuebradas(itens: ItemDoManual[]): ItemDoManual[] {
  const refs = new Set(itens.map((i) => i.ref))
  return itens.map((item) => {
    if (!item.ligados) return item
    const validos = item.ligados.filter((r) => refs.has(r))
    if (validos.length === item.ligados.length) return item
    const { ligados: _descartado, ...resto } = item
    return validos.length > 0 ? { ...resto, ligados: validos } : resto
  })
}

export function obterIndice(): Promise<IndicePreparado> {
  const agora = Date.now()
  if (emCache && agora - emCache.em < VALIDADE_MS) return emCache.promessa

  const promessa = montar().catch((erro) => {
    // Uma falha não pode fossilizar no cache: a próxima requisição tenta de novo.
    emCache = null
    throw erro
  })
  emCache = { em: agora, promessa }
  return promessa
}
