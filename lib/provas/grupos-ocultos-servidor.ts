import { ObjectId, type Db } from 'mongodb'
import { invalidarCacheDeServidor, memoizarPorTempo } from '@/lib/cache-de-servidor'
import { colecaoDeGrupos } from './colecoes'
import {
  algumGrupoRestrito,
  idsDeGruposComAlgumaBarreira,
  idsDeGruposOcultos,
  type GrupoComOcultacao,
  type QuemVeOGrupo,
} from './grupos-ocultos'

/**
 * Os grupos fora do ar agora — ver `grupos-ocultos.ts` para a regra.
 *
 * O que fica na memória curta do servidor é a ÁRVORE marcada, e não a
 * resposta: a árvore é a mesma para todo mundo (é sobre os grupos), enquanto a
 * resposta depende do cargo de quem pergunta desde que um grupo pode ser "só
 * Plus+". A tela da prova salva o progresso de tempos em tempos, e cada
 * salvamento perguntando ao Atlas pela árvore inteira seria uma consulta por
 * aluno por minuto para uma resposta que quase nunca muda.
 *
 * Quando nenhum grupo está marcado (nem oculto nem restrito), não se carrega a
 * árvore: a consulta pelos marcados usa o filtro e volta vazia, e é esse o caso
 * de quase sempre. E quando há grupos ocultos mas nenhum restrito, o cargo de
 * quem pergunta nem é lido.
 */
const TTL_MS = 15_000
const CHAVE = 'provas:grupos-ocultos'

/** Marcado = oculto ou restrito a cargos. Só grupo geral entra na regra. */
const FILTRO_DE_MARCADOS = {
  type: { $ne: 'personal' },
  $or: [{ isHidden: true }, { 'allowedGroups.0': { $exists: true } }],
}

/**
 * Chamado por quem muda a árvore (ocultar, reexibir, restringir, mover, apagar).
 *
 * Descarta a memória desta instância — as outras seguem o TTL, que é curto de
 * propósito.
 */
export function esquecerGruposOcultos(): void {
  invalidarCacheDeServidor(CHAVE)
}

function carregarArvoreMarcada(): Promise<GrupoComOcultacao[]> {
  return memoizarPorTempo(CHAVE, TTL_MS, async () => {
    const colecao = await colecaoDeGrupos()
    const algumMarcado = await colecao.findOne(FILTRO_DE_MARCADOS, { projection: { _id: 1 } })
    if (!algumMarcado) return []

    return colecao
      .find({}, { projection: { _id: 1, parentGroupId: 1, isHidden: 1, type: 1, allowedGroups: 1 } })
      .toArray() as Promise<GrupoComOcultacao[]>
  })
}

/** O cargo de quem pergunta — só o que a restrição por cargo usa. */
export async function lerCargoDoAluno(db: Db, userId: string): Promise<QuemVeOGrupo> {
  if (!userId || !ObjectId.isValid(userId)) return {}
  const usuario = await db
    .collection('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: { accountType: 1, secondaryRole: 1 } })
  return { accountType: usuario?.accountType ?? null, secondaryRole: usuario?.secondaryRole ?? null }
}

/**
 * Os ids dos grupos fora do ar para esta pessoa.
 *
 * Sem `db`/`userId`, vale só a ocultação (o que todo mundo deixa de ver). Com
 * eles, entram também os grupos restritos a cargos que a pessoa não tem — e o
 * cargo só é lido quando a árvore tem alguma restrição.
 */
export async function carregarIdsDeGruposOcultos(db?: Db, userId?: string): Promise<Set<string>> {
  const arvore = await carregarArvoreMarcada()
  if (arvore.length === 0) return new Set<string>()

  if (!algumGrupoRestrito(arvore)) return idsDeGruposOcultos(arvore)

  // Sem quem perguntar, a restrição ainda precisa barrar: vale como uma conta
  // gratuita, sem cargo secundário.
  const quem = db && userId ? await lerCargoDoAluno(db, userId) : {}
  return idsDeGruposOcultos(arvore, quem)
}

/** A prova mora num grupo (ou subgrupo) oculto ou restrito a cargos que esta pessoa não tem? */
export async function provaEstaEmGrupoOculto(groupId: unknown, db?: Db, userId?: string): Promise<boolean> {
  if (!groupId) return false
  const arvore = await carregarArvoreMarcada()
  if (arvore.length === 0) return false

  // A prova que não tem barreira nenhuma no caminho é a de quase sempre, e para
  // ela o cargo de quem pergunta não muda nada — não vale uma ida ao Atlas.
  const id = String(groupId)
  if (!idsDeGruposComAlgumaBarreira(arvore).has(id)) return false

  const quem = db && userId ? await lerCargoDoAluno(db, userId) : {}
  return idsDeGruposOcultos(arvore, quem).has(id)
}
