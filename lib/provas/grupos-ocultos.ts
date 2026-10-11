/**
 * Grupos e subgrupos ocultos em /provas.
 *
 * ## O que é ocultar um grupo
 *
 * O admin marca um grupo como oculto (`isHidden`) direto do catálogo, sem
 * passar pelo painel. A partir daí o grupo some para todo mundo que não é
 * admin — e com ele TUDO que mora dentro: os subgrupos e as provas de cada um.
 * O admin continua vendo o grupo no lugar de sempre, com o selo "Oculto", para
 * saber por que o aluno não o encontra e para poder reexibi-lo com um clique.
 *
 * ## Por que a ocultação desce pela árvore
 *
 * Esconder só o grupo e deixar os filhos à mostra não esconderia nada: um
 * subgrupo cujo pai sumiu vira órfão, e a tela o desenha como raiz (ver
 * `caminhoAte` em `arvore-grupos.ts`) — o conteúdo que o admin quis tirar do ar
 * reapareceria um nível acima. Por isso "este grupo está oculto?" é respondido
 * pelo CAMINHO até ele: basta um ancestral oculto.
 *
 * O campo fica gravado só no grupo que o admin marcou. Reexibir o pai devolve o
 * ramo inteiro de uma vez, e um subgrupo que o admin ocultou por conta própria
 * continua oculto — não há marcação em cascata para desfazer.
 *
 * ## Só grupos gerais
 *
 * Grupo pessoal já é de uma pessoa só; ocultá-lo "para todos menos o admin"
 * esconderia do próprio dono a pasta que ele criou. A regra vale para os
 * grupos gerais, que são os que o admin publica.
 *
 * ## Grupo só para alguns cargos
 *
 * Além de ocultar para todos, o admin pode restringir o grupo a cargos
 * (`allowedGroups`: "plus", "quest", um cargo criado em `/admin/cargos`,
 * "monitor"). Lista vazia é "todo mundo". Quem não tem um dos cargos não vê o
 * grupo — nem o selo, nem as provas, nem pelo endereço direto — exatamente como
 * se ele estivesse oculto. A restrição desce pela árvore pelo mesmo motivo da
 * ocultação: um subgrupo de um grupo "só Plus+" é "só Plus+" também. Um
 * subgrupo pode restringir MAIS que o pai (os dois filtros valem juntos), nunca
 * menos.
 *
 * O teste do cargo é o mesmo dos materiais (ver `lib/restricao-por-cargo.ts`),
 * com os aliases legados do Plus+ incluídos.
 *
 * Este arquivo só importa funções puras: é lido pela tela e pelas rotas.
 */

import { cargoPassa, type QuemPedeAcesso } from '@/lib/restricao-por-cargo'

export interface GrupoComOcultacao {
  _id: unknown
  parentGroupId?: unknown
  isHidden?: boolean
  type?: string
  /** Cargos que enxergam o grupo. Vazio ou ausente = todos. */
  allowedGroups?: string[] | null
}

/**
 * Quem está olhando, para a restrição por cargo.
 *
 * Ausente = só a ocultação conta. É o que o admin usa para desenhar os selos e
 * o que a rota usa quando nenhum grupo da árvore tem restrição de cargo.
 */
export type QuemVeOGrupo = QuemPedeAcesso

/** Os cargos que enxergam o grupo, já limpos. Vazio = todo mundo. */
export function cargosDoGrupo(grupo: Pick<GrupoComOcultacao, 'allowedGroups' | 'type'> | null | undefined): string[] {
  if (!grupo || grupo.type === 'personal' || !Array.isArray(grupo.allowedGroups)) return []
  return grupo.allowedGroups.map((g) => String(g)).filter(Boolean)
}

/** O grupo (ele mesmo, sem olhar os pais) é restrito a algum cargo? */
export function grupoRestritoACargos(grupo: GrupoComOcultacao | null | undefined): boolean {
  return cargosDoGrupo(grupo).length > 0
}

/** Alguma restrição de cargo na lista? Se não, ninguém precisa ler o cargo de ninguém. */
export function algumGrupoRestrito(grupos: GrupoComOcultacao[]): boolean {
  return grupos.some(grupoRestritoACargos)
}

/** O próprio grupo barra esta pessoa — por estar oculto ou por não ser do cargo dela? */
function grupoBarra(grupo: GrupoComOcultacao, quem: QuemVeOGrupo | undefined): boolean {
  if (grupoMarcadoComoOculto(grupo)) return true
  if (!quem) return false
  return !cargoPassa(cargosDoGrupo(grupo), quem)
}

/** Profundidade máxima percorrida. Um ciclo em dado antigo trava o laço, não a rota. */
const LIMITE_DE_PROFUNDIDADE = 30

/** O próprio grupo foi marcado como oculto? Só vale para grupo geral. */
export function grupoMarcadoComoOculto(grupo: GrupoComOcultacao | null | undefined): boolean {
  return !!grupo && grupo.isHidden === true && grupo.type !== 'personal'
}

/**
 * Os ids de todos os grupos que estão fora do ar: os marcados e os que moram
 * abaixo de um marcado, em qualquer profundidade.
 *
 * Com `quem`, fora do ar também quer dizer "restrito a cargos que esta pessoa
 * não tem" — no grupo ou em qualquer ancestral. Admin não passa por aqui: a
 * rota simplesmente não filtra.
 */
export function idsDeGruposOcultos(grupos: GrupoComOcultacao[], quem?: QuemVeOGrupo): Set<string> {
  return idsBarradosPor(grupos, (g) => grupoBarra(g, quem))
}

/**
 * Os ids dos grupos que PODEM estar fora do ar para alguém: ocultos, ou com
 * restrição de cargo no caminho. Serve para a rota decidir se precisa ler o
 * cargo de quem pergunta — prova fora deste conjunto é visível para qualquer
 * cargo, e a leitura é dispensada.
 */
export function idsDeGruposComAlgumaBarreira(grupos: GrupoComOcultacao[]): Set<string> {
  return idsBarradosPor(grupos, (g) => grupoMarcadoComoOculto(g) || grupoRestritoACargos(g))
}

function idsBarradosPor(
  grupos: GrupoComOcultacao[],
  barra: (grupo: GrupoComOcultacao) => boolean,
): Set<string> {
  const porId = new Map(grupos.map((g) => [String(g._id), g]))
  const memo = new Map<string, boolean>()

  function estaOculto(id: string): boolean {
    const conhecido = memo.get(id)
    if (conhecido !== undefined) return conhecido

    const caminho: string[] = []
    let atualId: string | null = id
    let resposta = false

    while (atualId && caminho.length < LIMITE_DE_PROFUNDIDADE) {
      const jaSabido = memo.get(atualId)
      if (jaSabido !== undefined) {
        resposta = jaSabido
        break
      }
      if (caminho.includes(atualId)) break // ciclo
      const grupo = porId.get(atualId)
      if (!grupo) break // pai apagado por fora: o grupo vale como raiz
      caminho.push(atualId)
      if (barra(grupo)) {
        resposta = true
        break
      }
      atualId = grupo.parentGroupId ? String(grupo.parentGroupId) : null
    }

    // Todo mundo no caminho percorrido tem a mesma resposta: ou um deles (ou um
    // ancestral acima deles) está oculto, ou nenhum está.
    for (const passo of caminho) memo.set(passo, resposta)
    return resposta
  }

  const ocultos = new Set<string>()
  for (const id of porId.keys()) if (estaOculto(id)) ocultos.add(id)
  return ocultos
}

/**
 * O grupo está oculto por causa de um ANCESTRAL, e não por marcação própria?
 *
 * É o que a tela precisa para o selo: "Oculto" num grupo que o admin marcou, e
 * "Oculto pelo grupo acima" num subgrupo que só está fora do ar porque o pai
 * está — reexibir esse subgrupo não adiantaria nada, e o selo diz onde clicar.
 */
export function ocultoPorHeranca(
  grupo: GrupoComOcultacao,
  ocultos: Set<string>,
): boolean {
  return ocultos.has(String(grupo._id)) && !grupoMarcadoComoOculto(grupo)
}
