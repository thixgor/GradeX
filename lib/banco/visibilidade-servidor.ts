import { ObjectId, type Db } from 'mongodb'
import { invalidarCacheDeServidor, memoizarPorTempo } from '@/lib/cache-de-servidor'
import type { QuemPedeAcesso } from '@/lib/restricao-por-cargo'
import {
  NADA_BARRADO,
  algoBarrado,
  nosBarradosPara,
  type ModuloComMarcacao,
  type NosBarrados,
  type TopicoComMarcacao,
} from './visibilidade'

/**
 * Módulos e tópicos ocultos/restritos do Banco — o lado do servidor.
 * A regra está em `visibilidade.ts`.
 *
 * O que fica na memória curta é a lista de nós com as marcações, que é a
 * mesma para todo mundo; quem está barrado é calculado por pedido, a partir do
 * cargo de quem pergunta. Quando nada está marcado (o caso de quase sempre),
 * a consulta pelos marcados volta vazia e nenhuma lista é carregada.
 */
const TTL_MS = 30_000
const CHAVE = 'banco:visibilidade'

const FILTRO_DE_MARCADOS = {
  $or: [{ isHidden: true }, { 'allowedGroups.0': { $exists: true } }],
}

interface Marcacoes {
  modulos: ModuloComMarcacao[]
  topicos: TopicoComMarcacao[]
}

const SEM_MARCACOES: Marcacoes = { modulos: [], topicos: [] }

/** Chamado por quem muda uma marcação, move ou renomeia um tópico. */
export function esquecerVisibilidadeDoBanco(): void {
  invalidarCacheDeServidor(CHAVE)
}

export function carregarMarcacoes(db: Db): Promise<Marcacoes> {
  return memoizarPorTempo(CHAVE, TTL_MS, async () => {
    const [moduloMarcado, topicoMarcado] = await Promise.all([
      db.collection('banco_modulos').findOne(FILTRO_DE_MARCADOS, { projection: { _id: 1 } }),
      db.collection('banco_topicos').findOne(FILTRO_DE_MARCADOS, { projection: { _id: 1 } }),
    ])
    if (!moduloMarcado && !topicoMarcado) return SEM_MARCACOES

    // Todos os tópicos (só nome e módulo) porque a barreira de um tópico desce
    // para os que moram abaixo dele no caminho, e esses não têm marcação.
    const [modulos, topicos] = await Promise.all([
      db
        .collection('banco_modulos')
        .find(FILTRO_DE_MARCADOS, { projection: { _id: 1, isHidden: 1, allowedGroups: 1 } })
        .toArray(),
      topicoMarcado
        ? db
            .collection('banco_topicos')
            .find({}, { projection: { _id: 1, moduloId: 1, nome: 1, isHidden: 1, allowedGroups: 1 } })
            .toArray()
        : [],
    ])

    return {
      modulos: modulos.map((m: any) => ({ ...m, _id: String(m._id) })),
      topicos: topicos.map((t: any) => ({ ...t, _id: String(t._id), moduloId: String(t.moduloId) })),
    }
  })
}

/** Há alguma marcação no Banco? Sem nenhuma, ninguém precisa ler o cargo de ninguém. */
export function temMarcacoes(marcacoes: Marcacoes): boolean {
  return marcacoes.modulos.length > 0 || marcacoes.topicos.some((t) => t.isHidden || (t.allowedGroups?.length ?? 0) > 0)
}

/**
 * Os nós barrados para esta pessoa. `quem` nulo = admin.
 *
 * Quem já tem o cargo em mãos (as rotas que chamam `lerAcessoAoBanco`) passa
 * direto; as demais usam `nosBarradosDoUsuario`.
 */
export async function nosBarrados(db: Db, quem: QuemPedeAcesso | null): Promise<NosBarrados> {
  if (!quem) return NADA_BARRADO
  const marcacoes = await carregarMarcacoes(db)
  if (!temMarcacoes(marcacoes)) return NADA_BARRADO
  return nosBarradosPara(marcacoes.modulos, marcacoes.topicos, quem)
}

/** Para as rotas que já leram o documento do usuário. */
export function nosBarradosDoDocumento(
  db: Db,
  usuario: { role?: string; accountType?: string | null; secondaryRole?: string | null },
): Promise<NosBarrados> {
  return nosBarrados(
    db,
    usuario.role === 'admin'
      ? null
      : { accountType: usuario.accountType ?? null, secondaryRole: usuario.secondaryRole ?? null },
  )
}

/** Para as rotas que só têm a sessão: lê o cargo só se houver alguma marcação. */
export async function nosBarradosDoUsuario(
  db: Db,
  session: { userId: string; role?: string },
): Promise<NosBarrados> {
  if (session.role === 'admin') return NADA_BARRADO
  const marcacoes = await carregarMarcacoes(db)
  if (!temMarcacoes(marcacoes)) return NADA_BARRADO

  const usuario = ObjectId.isValid(session.userId)
    ? await db
        .collection('users')
        .findOne(
          { _id: new ObjectId(session.userId) },
          { projection: { role: 1, accountType: 1, secondaryRole: 1 } },
        )
    : null
  if (usuario?.role === 'admin') return NADA_BARRADO
  return nosBarradosPara(marcacoes.modulos, marcacoes.topicos, {
    accountType: usuario?.accountType ?? null,
    secondaryRole: usuario?.secondaryRole ?? null,
  })
}

/**
 * Os ids nas duas formas: as questões gravam `moduloId`/`topicoId` como
 * ObjectId, mas um documento antigo com string não pode escapar do filtro.
 */
function ambasAsFormas(ids: Set<string>): Array<ObjectId | string> {
  const lista: Array<ObjectId | string> = []
  for (const id of ids) {
    lista.push(id)
    if (ObjectId.isValid(id)) lista.push(new ObjectId(id))
  }
  return lista
}

/**
 * O pedaço de `$match` que tira das questões os nós barrados.
 *
 * Devolve `{}` quando nada está barrado, para que a rota possa espalhar o
 * resultado no filtro sem condicional. Vai para um `$and` de quem chama
 * quando o filtro já tem `moduloId`/`topicoId` — um `{ moduloId: X }` vindo da
 * tela e um `{ moduloId: { $nin } }` daqui não cabem na mesma chave.
 */
export function filtroDeBloqueio(barrados: NosBarrados): Record<string, unknown> {
  if (!algoBarrado(barrados)) return {}
  const condicoes: Record<string, unknown>[] = []
  if (barrados.modulos.size > 0) condicoes.push({ moduloId: { $nin: ambasAsFormas(barrados.modulos) } })
  if (barrados.topicos.size > 0) condicoes.push({ topicoId: { $nin: ambasAsFormas(barrados.topicos) } })
  return { $and: condicoes }
}

/** Junta o bloqueio a um filtro existente sem sobrescrever chave nenhuma. */
export function comBloqueio<T extends Record<string, any>>(filtro: T, barrados: NosBarrados): T {
  const bloqueio = filtroDeBloqueio(barrados)
  if (!bloqueio.$and) return filtro
  const condicoes = bloqueio.$and as Record<string, unknown>[]
  return { ...filtro, $and: [...(Array.isArray(filtro.$and) ? filtro.$and : []), ...condicoes] } as T
}
