import { invalidarCacheDeServidor, memoizarPorTempo } from '@/lib/cache-de-servidor'
import { colecaoDeGrupos } from './colecoes'
import { idsDeGruposOcultos } from './grupos-ocultos'

/**
 * Os grupos fora do ar agora — ver `grupos-ocultos.ts` para a regra.
 *
 * O conjunto é o mesmo para todo mundo (é sobre os grupos, não sobre quem
 * pergunta), então cabe na memória curta do servidor: a tela da prova salva o
 * progresso de tempos em tempos, e cada salvamento perguntando ao Atlas pela
 * árvore inteira seria uma consulta por aluno por minuto para uma resposta que
 * quase nunca muda.
 *
 * Quando nenhum grupo está marcado, não se carrega a árvore: a consulta pelos
 * marcados usa o filtro e volta vazia, e é esse o caso de quase sempre.
 */
const TTL_MS = 15_000
const CHAVE = 'provas:grupos-ocultos'

/**
 * Chamado por quem muda a árvore (ocultar, reexibir, mover, apagar).
 *
 * Descarta a memória desta instância — as outras seguem o TTL, que é curto de
 * propósito.
 */
export function esquecerGruposOcultos(): void {
  invalidarCacheDeServidor(CHAVE)
}

export function carregarIdsDeGruposOcultos(): Promise<Set<string>> {
  return memoizarPorTempo(CHAVE, TTL_MS, async () => {
    const colecao = await colecaoDeGrupos()
    const algumMarcado = await colecao.findOne({ isHidden: true, type: { $ne: 'personal' } }, { projection: { _id: 1 } })
    if (!algumMarcado) return new Set<string>()

    const grupos = await colecao
      .find({}, { projection: { _id: 1, parentGroupId: 1, isHidden: 1, type: 1 } })
      .toArray()
    return idsDeGruposOcultos(grupos)
  })
}

/** A prova mora num grupo (ou subgrupo) oculto? */
export async function provaEstaEmGrupoOculto(groupId: unknown): Promise<boolean> {
  if (!groupId) return false
  const ocultos = await carregarIdsDeGruposOcultos()
  return ocultos.has(String(groupId))
}
