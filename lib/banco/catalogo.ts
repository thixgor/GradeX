import { SEPARADOR_DE_CAMINHO, paraBusca } from '@/lib/banco/hierarquia'

/**
 * O catálogo do banco — módulos, tópicos e subtópicos — como a tela do admin
 * precisa dele.
 *
 * A tela de questões carregava a hierarquia em cascata: pedia os períodos,
 * esperava o clique, pedia os módulos daquele período, esperava, pedia os
 * tópicos… Quatro requisições encadeadas para preencher um formulário, e cada
 * uma só existia depois da anterior. Quando o nível "Período" saiu do produto
 * (ver hierarquia.ts), a cascata quebrou pelo topo: questão sem período nunca
 * chegava a pedir os módulos, e o formulário abria com todos os selects vazios.
 *
 * `/api/banco/hierarquia` devolve a árvore inteira numa chamada só. As funções
 * daqui são o que a tela faz com ela — todas puras, testadas em
 * __tests__/banco/catalogo.test.ts.
 */

export interface ItemDoCatalogo {
  _id: string
  nome: string
  totalQuestoes?: number
}

export interface TopicoDoCatalogo extends ItemDoCatalogo {
  moduloId: string
}

export interface SubtopicoDoCatalogo extends ItemDoCatalogo {
  topicoId: string
}

export interface Catalogo {
  modulos: ItemDoCatalogo[]
  topicos: TopicoDoCatalogo[]
  subtopicos: SubtopicoDoCatalogo[]
}

export const CATALOGO_VAZIO: Catalogo = { modulos: [], topicos: [], subtopicos: [] }

/** Um tópico com o módulo dele junto — é assim que ele aparece na busca. */
export interface AssuntoDoCatalogo {
  topicoId: string
  moduloId: string
  moduloNome: string
  topicoNome: string
  /** "Cardiologia › 1º PERÍODO › HAM I" — o que se lê na lista. */
  caminho: string
  totalQuestoes: number
}

function comparar(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { numeric: true })
}

/** Junta cada tópico ao módulo dele, em ordem de leitura. */
export function listarAssuntos(catalogo: Catalogo): AssuntoDoCatalogo[] {
  const nomeDoModulo = new Map(catalogo.modulos.map((m) => [m._id, m.nome]))

  return catalogo.topicos
    .map((topico) => {
      // Um tópico órfão (o módulo foi apagado por fora) continua existindo e
      // continua com questões dentro: escondê-lo da lista seria esconder as
      // questões dele do único lugar onde dá para consertá-las.
      const moduloNome = nomeDoModulo.get(topico.moduloId) || 'Sem módulo'
      return {
        topicoId: topico._id,
        moduloId: topico.moduloId,
        moduloNome,
        topicoNome: topico.nome,
        caminho: `${moduloNome}${SEPARADOR_DE_CAMINHO}${topico.nome}`,
        totalQuestoes: topico.totalQuestoes || 0,
      }
    })
    .sort((a, b) => comparar(a.moduloNome, b.moduloNome) || comparar(a.topicoNome, b.topicoNome))
}

/**
 * Filtra os assuntos por um termo, sem acento e sem caixa.
 *
 * A busca vale sobre o caminho inteiro ("Cardiologia › Arritmias"), então tanto
 * o nome do módulo quanto o do tópico encontram a linha — e "cardio arrit" não
 * encontra nada, porque são dois pedaços soltos; cada palavra é buscada por si.
 */
export function buscarAssuntos(assuntos: AssuntoDoCatalogo[], termo: string): AssuntoDoCatalogo[] {
  const palavras = paraBusca(termo).split(/\s+/).filter(Boolean)
  if (palavras.length === 0) return assuntos
  return assuntos.filter((assunto) => {
    const alvo = paraBusca(assunto.caminho)
    return palavras.every((palavra) => alvo.includes(palavra))
  })
}

/** Os subtópicos de um tópico, em ordem. Sem tópico escolhido, nenhum. */
export function subtopicosDoTopico(catalogo: Catalogo, topicoId: string): SubtopicoDoCatalogo[] {
  if (!topicoId) return []
  return catalogo.subtopicos
    .filter((s) => s.topicoId === topicoId)
    .sort((a, b) => comparar(a.nome, b.nome))
}

/** O caminho legível de uma questão: "Módulo › Tópico › Subtópico". */
export function caminhoDaQuestao(partes: {
  moduloNome?: string | null
  topicoNome?: string | null
  subtopicoNome?: string | null
}): string {
  return [partes.moduloNome, partes.topicoNome, partes.subtopicoNome]
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter((p) => p.length > 0)
    .join(SEPARADOR_DE_CAMINHO)
}

/** Os módulos em ordem de leitura, para o campo de criar tópico. */
export function modulosOrdenados(catalogo: Catalogo): ItemDoCatalogo[] {
  return [...catalogo.modulos].sort((a, b) => comparar(a.nome, b.nome))
}
