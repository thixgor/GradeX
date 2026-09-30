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
 * Este arquivo não importa nada: é lido pela tela e pelas rotas.
 */

export interface GrupoComOcultacao {
  _id: unknown
  parentGroupId?: unknown
  isHidden?: boolean
  type?: string
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
 */
export function idsDeGruposOcultos(grupos: GrupoComOcultacao[]): Set<string> {
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
      if (grupoMarcadoComoOculto(grupo)) {
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
