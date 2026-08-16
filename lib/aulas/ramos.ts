/**
 * A árvore do curso como o ALUNO a vê (§2, §7, §18).
 *
 * Gêmea de `arvore-admin.ts`, e a diferença entre as duas é justamente o ponto:
 * o painel precisa enxergar tudo, inclusive o que está fora do lugar, porque o
 * trabalho dele é consertar. A biblioteca precisa do contrário — nível vazio
 * não vira título vazio, e o que não tem aula simplesmente não é desenhado.
 *
 * Este montador vivia dentro de `app/aulas/page.tsx`. Passou a morar aqui
 * porque a página de curso precisa da mesma árvore: reescrevê-la lá seria
 * manter duas versões da regra que decide onde cada aula aparece — e elas
 * divergiriam no primeiro ajuste.
 */

export interface RamoDoCurso<TAula> {
  id: string
  nome: string
  /** Profundidade: 1 tópico, 2 subtópico, 3 módulo, 4 submódulo. */
  nivel: number
  aulas: TAula[]
  filhos: Array<RamoDoCurso<TAula>>
}

interface ComOrdem {
  ordem?: number
}

export interface NosDoCurso {
  topicos: Array<{ _id: string; setorId: string; nome: string; ordem: number }>
  subtopicos: Array<{ _id: string; setorId: string; topicoId: string; nome: string; ordem: number }>
  modulos: Array<{
    _id: string
    setorId: string
    topicoId?: string
    subtopicoId?: string
    nome: string
    ordem: number
  }>
  submodulos: Array<{ _id: string; moduloId: string; nome: string; ordem: number }>
}

export interface AulaComVinculos extends ComOrdem {
  topicoId?: string
  subtopicoId?: string
  moduloId?: string
  submoduloId?: string
}

const porOrdem = <T extends ComOrdem>(a: T, b: T) => (a.ordem || 0) - (b.ordem || 0)

/**
 * Monta a árvore de um curso a partir das listas planas.
 *
 * `aulas` já deve vir filtrada (por busca, por filtro de progresso, pelo curso).
 * Deixar o filtro fora daqui é o que permite a mesma função servir à biblioteca
 * — onde a busca atravessa a hierarquia — e à página do curso, onde não há
 * filtro nenhum.
 */
export function montarRamos<T extends AulaComVinculos>(
  cursoId: string,
  aulas: T[],
  nos: NosDoCurso,
): Array<RamoDoCurso<T>> {
  const { topicos, subtopicos, modulos, submodulos } = nos

  /**
   * Aulas presas a um nível.
   *
   * `exigirVazios` é o que impede a mesma aula de aparecer duas vezes: uma aula
   * com `moduloId` e `submoduloId` pertence ao submódulo, e listá-la também no
   * módulo a mostraria em dois lugares da mesma tela.
   */
  const aulasDe = (
    chave: keyof AulaComVinculos,
    valor: string,
    exigirVazios: Array<keyof AulaComVinculos> = [],
  ) =>
    aulas
      .filter((a) => String(a[chave] || '') === valor && exigirVazios.every((c) => !a[c]))
      .sort(porOrdem)

  const ramoDoSubmodulo = (sm: NosDoCurso['submodulos'][number]): RamoDoCurso<T> => ({
    id: sm._id,
    nome: sm.nome,
    nivel: 4,
    aulas: aulasDe('submoduloId', sm._id),
    filhos: [],
  })

  const ramoDoModulo = (m: NosDoCurso['modulos'][number]): RamoDoCurso<T> => ({
    id: m._id,
    nome: m.nome,
    nivel: 3,
    aulas: aulasDe('moduloId', m._id, ['submoduloId']),
    filhos: submodulos.filter((sm) => sm.moduloId === m._id).sort(porOrdem).map(ramoDoSubmodulo),
  })

  const ramoDoSubtopico = (st: NosDoCurso['subtopicos'][number]): RamoDoCurso<T> => ({
    id: st._id,
    nome: st.nome,
    nivel: 2,
    aulas: aulasDe('subtopicoId', st._id, ['moduloId']),
    filhos: modulos.filter((m) => m.subtopicoId === st._id).sort(porOrdem).map(ramoDoModulo),
  })

  const ramoDoTopico = (t: NosDoCurso['topicos'][number]): RamoDoCurso<T> => ({
    id: t._id,
    nome: t.nome,
    nivel: 1,
    aulas: aulasDe('topicoId', t._id, ['subtopicoId', 'moduloId']),
    filhos: [
      ...subtopicos.filter((st) => st.topicoId === t._id).sort(porOrdem).map(ramoDoSubtopico),
      ...modulos
        .filter((m) => m.topicoId === t._id && !m.subtopicoId)
        .sort(porOrdem)
        .map(ramoDoModulo),
    ],
  })

  const soltas = aulas.filter(
    (a) => !a.topicoId && !a.subtopicoId && !a.moduloId && !a.submoduloId,
  )

  return [
    ...topicos.filter((t) => t.setorId === cursoId).sort(porOrdem).map(ramoDoTopico),
    // Módulos pendurados direto no curso, sem tópico — o caso simples, e o mais
    // comum em curso pequeno. A hierarquia é opcional inteira (§2).
    ...modulos
      .filter((m) => m.setorId === cursoId && !m.topicoId && !m.subtopicoId)
      .sort(porOrdem)
      .map(ramoDoModulo),
    // Aulas soltas no curso, sem nível nenhum. Ganham um ramo sintético em vez
    // de sumir: elas existem e alguém precisa conseguir assisti-las.
    ...(soltas.length > 0
      ? [{ id: '__soltas__', nome: 'Aulas do curso', nivel: 1, aulas: soltas, filhos: [] }]
      : []),
  ]
}

/** Um ramo só vale desenhar se ele (ou algum filho) tem aula. */
export function temConteudo<T>(ramo: RamoDoCurso<T>): boolean {
  return ramo.aulas.length > 0 || ramo.filhos.some(temConteudo)
}

export function contarAulas<T extends { progresso?: { concluida?: boolean } | null }>(
  ramo: RamoDoCurso<T>,
): { total: number; concluidas: number } {
  const soma = {
    total: ramo.aulas.length,
    concluidas: ramo.aulas.filter((a) => a.progresso?.concluida).length,
  }
  for (const filho of ramo.filhos) {
    const f = contarAulas(filho)
    soma.total += f.total
    soma.concluidas += f.concluidas
  }
  return soma
}

/** Todas as aulas do curso, em ordem de leitura — alimenta "próxima aula". */
export function achatarAulas<T>(ramos: Array<RamoDoCurso<T>>): T[] {
  const saida: T[] = []
  const descer = (lista: Array<RamoDoCurso<T>>) => {
    for (const ramo of lista) {
      saida.push(...ramo.aulas)
      descer(ramo.filhos)
    }
  }
  descer(ramos)
  return saida
}
