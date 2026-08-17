/**
 * A árvore de grupos de /provas.
 *
 * Grupos guardam apenas `parentGroupId`, e as provas apenas `groupId`. Isso
 * significa que mover um grupo para dentro de outro é **uma escrita só**: as
 * provas continuam apontando para os mesmos grupos e vão junto sem que nada
 * seja copiado. É também por isso que a validação importa tanto — um pai que
 * aponta para um descendente cria um ciclo que some da tela inteira, porque
 * nenhum dos dois grupos volta a ser alcançável a partir da raiz.
 *
 * Este arquivo não importa nada: é lido pelas telas e pelas rotas, e é onde
 * moram as regras que as duas precisam concordar.
 */

export interface GrupoNaArvore {
  _id: string
  name: string
  parentGroupId?: string | null
  type?: 'personal' | 'general'
  category?: string
  course?: string
  createdBy?: string
  icon?: string
  color?: string
}

export interface ProvaNaArvore {
  _id?: unknown
  groupId?: string | null
  numberOfQuestions?: number
}

/** Profundidade máxima percorrida. Existe para que um ciclo em dado antigo trave um laço, não a página. */
const LIMITE_DE_PROFUNDIDADE = 30

export function filhosDe(grupos: GrupoNaArvore[], paiId: string | null): GrupoNaArvore[] {
  return grupos.filter((g) => (g.parentGroupId || null) === (paiId || null))
}

/**
 * O caminho da raiz até o grupo — o que a trilha de navegação mostra.
 *
 * Para de subir ao encontrar um pai que não existe: um grupo órfão (pai
 * apagado por fora) aparece como raiz em vez de sumir da tela.
 */
export function caminhoAte(grupos: GrupoNaArvore[], grupoId: string): GrupoNaArvore[] {
  const porId = new Map(grupos.map((g) => [g._id, g]))
  const caminho: GrupoNaArvore[] = []
  const vistos = new Set<string>()
  let atual = porId.get(grupoId)

  while (atual && !vistos.has(atual._id) && caminho.length < LIMITE_DE_PROFUNDIDADE) {
    vistos.add(atual._id)
    caminho.unshift(atual)
    atual = atual.parentGroupId ? porId.get(atual.parentGroupId) : undefined
  }
  return caminho
}

/** `candidato` está em algum lugar abaixo de `ancestral`? */
export function ehDescendente(
  grupos: GrupoNaArvore[],
  candidatoId: string,
  ancestralId: string,
): boolean {
  if (candidatoId === ancestralId) return false
  return caminhoAte(grupos, candidatoId).some((g) => g._id === ancestralId)
}

export interface Veredito {
  ok: boolean
  motivo?: string
}

/**
 * Pode mover `movidoId` para dentro de `destinoId`?
 *
 * `destinoId` nulo significa "virar grupo raiz", que é sempre permitido para
 * quem já pode mexer no grupo.
 *
 * As três recusas são de natureza diferente:
 * - o ciclo destruiria a árvore (o grupo e tudo abaixo dele somem da tela);
 * - misturar pessoal com geral publicaria conteúdo de uma pessoa só;
 * - grupo pessoal de outra pessoa não é destino de ninguém.
 */
export function podeMoverGrupo(
  grupos: GrupoNaArvore[],
  movidoId: string,
  destinoId: string | null,
  usuario: { id: string; ehAdmin: boolean },
): Veredito {
  const movido = grupos.find((g) => g._id === movidoId)
  if (!movido) return { ok: false, motivo: 'Grupo não encontrado' }

  if (movido.type === 'general' && !usuario.ehAdmin) {
    return { ok: false, motivo: 'Apenas administradores movem grupos gerais' }
  }
  if (movido.type === 'personal' && movido.createdBy && movido.createdBy !== usuario.id) {
    return { ok: false, motivo: 'Este grupo é de outra pessoa' }
  }

  if (!destinoId) return { ok: true }

  if (destinoId === movidoId) {
    return { ok: false, motivo: 'Um grupo não pode ficar dentro de si mesmo' }
  }

  const destino = grupos.find((g) => g._id === destinoId)
  if (!destino) return { ok: false, motivo: 'Grupo de destino não encontrado' }

  if (ehDescendente(grupos, destinoId, movidoId)) {
    return { ok: false, motivo: 'O destino está dentro do grupo que você está movendo' }
  }

  if ((destino.type || 'personal') !== (movido.type || 'personal')) {
    return destino.type === 'general'
      ? { ok: false, motivo: 'Um grupo pessoal não pode entrar num grupo geral' }
      : { ok: false, motivo: 'Um grupo geral não pode entrar num grupo pessoal' }
  }

  if (destino.type === 'personal' && destino.createdBy && destino.createdBy !== usuario.id) {
    return { ok: false, motivo: 'Este grupo é de outra pessoa' }
  }

  if ((destino.parentGroupId || null) === (movido.parentGroupId || null) && destinoId === movido.parentGroupId) {
    return { ok: false, motivo: 'O grupo já está aqui' }
  }
  if (movido.parentGroupId === destinoId) {
    return { ok: false, motivo: 'O grupo já está aqui' }
  }

  return { ok: true }
}

/** Provas em todo o ramo — as do grupo e as de tudo abaixo dele. */
export function contarProvas(
  grupos: GrupoNaArvore[],
  provas: ProvaNaArvore[],
  grupoId: string,
): number {
  return somarRamo(grupos, provas, grupoId, () => 1)
}

/**
 * Questões em todo o ramo.
 *
 * O que o aluno quer saber ao escolher um grupo é quanto tem para treinar, e
 * "12 provas" não responde isso: doze provas de 5 questões e doze de 90 são
 * coisas muito diferentes. Prova sem o campo preenchido conta zero em vez de
 * quebrar a soma.
 */
export function contarQuestoes(
  grupos: GrupoNaArvore[],
  provas: ProvaNaArvore[],
  grupoId: string,
): number {
  return somarRamo(grupos, provas, grupoId, (p) => Math.max(0, Number(p.numberOfQuestions) || 0))
}

function somarRamo(
  grupos: GrupoNaArvore[],
  provas: ProvaNaArvore[],
  grupoId: string,
  valor: (prova: ProvaNaArvore) => number,
  visitados = new Set<string>(),
): number {
  if (visitados.has(grupoId)) return 0
  visitados.add(grupoId)

  const direto = provas
    .filter((p) => (p.groupId || null) === grupoId)
    .reduce((soma, p) => soma + valor(p), 0)

  return filhosDe(grupos, grupoId).reduce(
    (soma, filho) => soma + somarRamo(grupos, provas, filho._id, valor, visitados),
    direto,
  )
}

/** Remove acentos e caixa para a busca de destino. "Módulo I" casa com "modulo i". */
export function paraBusca(valor: string): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Grupos que casam com o termo, cada um com o caminho até ele.
 *
 * O caminho vem junto porque dois grupos chamados "P1" em cursos diferentes são
 * indistinguíveis pelo nome — e escolher o destino errado é justamente o erro
 * que o seletor precisa evitar.
 */
export function buscarDestinos(
  grupos: GrupoNaArvore[],
  termo: string,
  limite = 20,
): Array<{ grupo: GrupoNaArvore; caminho: GrupoNaArvore[] }> {
  const alvo = paraBusca(termo)
  if (alvo.length < 2) return []

  return grupos
    .filter((g) => paraBusca(g.name).includes(alvo))
    .slice(0, limite)
    .map((g) => ({ grupo: g, caminho: caminhoAte(grupos, g._id).slice(0, -1) }))
}
