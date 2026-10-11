import { SEPARADOR_DE_CAMINHO } from './hierarquia'
import { cargoPassa, temRestricaoDeCargo, type QuemPedeAcesso } from '@/lib/restricao-por-cargo'

/**
 * Módulos e tópicos do Banco de Questões fora do ar para alguém.
 *
 * ## As duas marcações
 *
 * - `isHidden`: o admin tira o nó do Banco geral. Some para todo mundo que não
 *   é admin — a árvore, a contagem e as questões dele.
 * - `allowedGroups`: o nó só existe para os cargos marcados ("Plus+",
 *   "Quest+", um cargo de `/admin/cargos`, "monitor"). Para os outros, ele é
 *   tratado exatamente como oculto. Vazio = todos (ver
 *   `lib/restricao-por-cargo.ts`).
 *
 * ## Como a barreira desce
 *
 * Módulo é o "grupo" importado de /provas, e o tópico é o caminho dos
 * subgrupos dentro dele ("Período 1 › Módulo I"). Então:
 *
 *  - módulo barrado leva junto todos os tópicos, subtópicos e questões dele;
 *  - tópico barrado leva junto os tópicos que moram ABAIXO dele no caminho
 *    ("Período 1" barra "Período 1 › Módulo I"), pelo mesmo motivo de
 *    /provas: um subgrupo de um ramo "só Plus+" é "só Plus+" também.
 *
 * Um nível de baixo pode restringir MAIS que o de cima (os dois filtros valem
 * juntos), nunca menos.
 *
 * ## Por que o filtro é por id, e não por campo na questão
 *
 * A marcação mora no módulo/tópico, não em cada questão — marcar um módulo é
 * uma escrita só, sem reescrever milhares de questões. O preço é que as rotas
 * precisam traduzir "nós barrados" num `$nin` sobre `moduloId`/`topicoId`, e é
 * isso que `filtroDeBloqueio` (em `visibilidade-servidor.ts`) faz.
 *
 * Este arquivo é isomórfico: a tela do admin usa as mesmas regras para o selo.
 */

export interface NoComMarcacao {
  _id: unknown
  isHidden?: boolean
  allowedGroups?: string[] | null
}

export interface ModuloComMarcacao extends NoComMarcacao {}

export interface TopicoComMarcacao extends NoComMarcacao {
  moduloId: unknown
  nome: string
}

export interface NosBarrados {
  modulos: Set<string>
  topicos: Set<string>
}

export const NADA_BARRADO: NosBarrados = Object.freeze({
  modulos: new Set<string>(),
  topicos: new Set<string>(),
}) as NosBarrados

/** O nó tem alguma marcação (oculto ou restrito)? */
export function noMarcado(no: NoComMarcacao | null | undefined): boolean {
  return !!no && (no.isHidden === true || temRestricaoDeCargo(no.allowedGroups))
}

/** O próprio nó barra esta pessoa? `quem` ausente = admin, nada barra. */
function noBarra(no: NoComMarcacao, quem: QuemPedeAcesso | null): boolean {
  if (!quem) return false
  if (no.isHidden === true) return true
  return !cargoPassa(no.allowedGroups, quem)
}

/** "A › B" mora abaixo de "A"? Comparação sem caixa nem espaço nas pontas. */
function moraAbaixo(nome: string, ancestral: string): boolean {
  const n = nome.trim().toLowerCase()
  const a = ancestral.trim().toLowerCase()
  return n === a || n.startsWith(a + SEPARADOR_DE_CAMINHO.toLowerCase())
}

/**
 * Os módulos e tópicos que esta pessoa não pode ver.
 *
 * `quem` nulo é o admin: nada é barrado. `topicos` precisa ser a lista inteira
 * (não só os marcados), porque a barreira de um tópico desce para os tópicos
 * abaixo dele no caminho, e esses normalmente não têm marcação própria.
 */
export function nosBarradosPara(
  modulos: ModuloComMarcacao[],
  topicos: TopicoComMarcacao[],
  quem: QuemPedeAcesso | null,
): NosBarrados {
  if (!quem) return NADA_BARRADO

  const modulosBarrados = new Set<string>()
  for (const m of modulos) if (noBarra(m, quem)) modulosBarrados.add(String(m._id))

  // Tópicos que barram por conta própria, agrupados por módulo.
  const barreirasPorModulo = new Map<string, string[]>()
  for (const t of topicos) {
    if (!noBarra(t, quem)) continue
    const moduloId = String(t.moduloId)
    const lista = barreirasPorModulo.get(moduloId) || []
    lista.push(t.nome || '')
    barreirasPorModulo.set(moduloId, lista)
  }

  const topicosBarrados = new Set<string>()
  for (const t of topicos) {
    const moduloId = String(t.moduloId)
    if (modulosBarrados.has(moduloId)) {
      topicosBarrados.add(String(t._id))
      continue
    }
    const barreiras = barreirasPorModulo.get(moduloId)
    if (barreiras && barreiras.some((b) => moraAbaixo(t.nome || '', b))) {
      topicosBarrados.add(String(t._id))
    }
  }

  return { modulos: modulosBarrados, topicos: topicosBarrados }
}

/**
 * Para o selo do admin: o tópico está marcado por um tópico ACIMA dele no
 * caminho (e não por marcação própria)? Devolve o nome do tópico de cima.
 */
export function marcacaoHerdadaDoTopico(
  topico: TopicoComMarcacao,
  topicos: TopicoComMarcacao[],
): TopicoComMarcacao | null {
  for (const outro of topicos) {
    if (outro._id === topico._id || String(outro.moduloId) !== String(topico.moduloId)) continue
    if (!noMarcado(outro)) continue
    if (outro.nome.trim().toLowerCase() === topico.nome.trim().toLowerCase()) continue
    if (moraAbaixo(topico.nome, outro.nome)) return outro
  }
  return null
}

/** Algum nó barrado? Quando não, as rotas pulam o filtro inteiro. */
export function algoBarrado(barrados: NosBarrados): boolean {
  return barrados.modulos.size > 0 || barrados.topicos.size > 0
}

/** Esta questão mora num nó barrado? Para as rotas que já têm o documento. */
export function questaoBarrada(
  questao: { moduloId?: unknown; topicoId?: unknown } | null | undefined,
  barrados: NosBarrados,
): boolean {
  if (!questao) return false
  return (
    (questao.moduloId != null && barrados.modulos.has(String(questao.moduloId))) ||
    (questao.topicoId != null && barrados.topicos.has(String(questao.topicoId)))
  )
}
