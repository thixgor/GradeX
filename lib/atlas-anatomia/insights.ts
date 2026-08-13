import type { AtlasMarker } from './estrutura'
import { classificar, classePorId, type ClasseEstrutural } from './classes'
import { resolverRegiao, type RegiaoAnatomica } from './regioes'
import { DICIONARIO, type EntradaDicionario } from './dicionario'

/**
 * Motor de conteúdo do Atlas de Anatomia.
 *
 * O acervo da UFJF entrega o nome e a coordenada de cada estrutura. A ficha que
 * o estudante lê é montada aqui, cruzando três camadas:
 *
 *  1. `classes.ts`   — o que a estrutura é (músculo, artéria, forame, víscera…),
 *                      deduzido da própria terminologia anatômica.
 *  2. `regioes.ts`   — onde ela está e quem irriga e inerva aquela região,
 *                      deduzido do caminho da coleção na árvore do acervo.
 *  3. `dicionario.ts`— o conteúdo específico das estruturas que mais importam,
 *                      escrito uma a uma.
 *
 * A ordem de precedência é sempre dicionário › região › classe, de modo que a
 * ficha nunca fica vazia e fica cada vez mais específica conforme a estrutura
 * for mais relevante.
 */

export interface MarkerInsight {
  /** Selo da classe estrutural ("Músculo esquelético", "Artéria"…). */
  classe: string
  /** Identificador da classe, para escolher ícone e cor na interface. */
  classeId: string
  /** Nome da região resolvida ("Antebraço", "Coração"…). */
  regiao: string
  /** Frase de identidade: o que é essa estrutura. */
  resumo: string
  localizacao: string
  /**
   * Topografia da região da prancha. Fica em campo próprio, e não misturada à
   * localização, porque nem toda estrutura marcada pertence à região: uma
   * prancha do coração mostra o lobo superior do pulmão direito, e afirmar que
   * ele "ocupa o mediastino médio" seria errado. Como contexto declarado, é
   * verdadeiro e ainda ajuda a situar a peça.
   */
  contextoRegional?: string
  funcao: string
  vascularizacao?: string
  inervacao?: string
  linfaticos?: string
  relacoes?: string
  clinica: string
  /**
   * `true` quando vascularização/inervação vieram da região, e não da estrutura.
   * A interface rotula esses blocos como regionais para não induzir a erro.
   */
  vasosRegionais: boolean
  /** Reparos anatômicos da região, úteis no exame físico. */
  reparos?: string
  /** Perguntas-chave que o estudante deve saber responder. */
  pontos: string[]
  /** Descrição original do acervo, quando o próprio atlas traz uma. */
  notaAcervo?: string
  /** `true` quando existe entrada curada específica para a estrutura. */
  aprofundado: boolean
}

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/** Índice montado uma única vez: normalizar 1.300 títulos a cada clique é desperdício. */
const ENTRADAS = DICIONARIO.map(entrada => ({
  entrada,
  termos: entrada.termos.map(normalizar),
}))

function buscarEntrada(titulo: string): EntradaDicionario | undefined {
  const nome = normalizar(titulo)
  for (const { entrada, termos } of ENTRADAS) {
    const casou = entrada.exato
      ? termos.some(termo => nome === termo)
      : termos.some(termo => nome === termo || nome.includes(termo))
    if (casou) return entrada
  }
  return undefined
}

/**
 * Junta as camadas numa frase só quando ambas acrescentam informação: a
 * topografia da região dá a moldura, e a classe explica onde a estrutura vive
 * dentro dela.
 */
function compor(especifico: string | undefined, ...alternativas: Array<string | undefined>): string {
  if (especifico) return especifico
  return alternativas.find(texto => texto && texto.trim().length > 0) || ''
}

export interface ContextoMarcador {
  /** Slug do sistema do acervo (`esqueletico`, `nervoso`, `circulatorio`…). */
  sistema: string
  /** Caminho da coleção na árvore (`['Membro Superior', 'Antebraço']`). */
  caminho?: string[]
  /** Título da prancha, usado como pista adicional de localização. */
  prancha?: string
}

export function getMarkerInsight(marker: AtlasMarker, contexto: ContextoMarcador): MarkerInsight {
  const entrada = buscarEntrada(marker.title)
  const classe: ClasseEstrutural = entrada?.classe
    ? classePorId(entrada.classe)
    : classificar(marker.title, contexto.sistema)
  const regiao: RegiaoAnatomica = resolverRegiao(contexto.sistema, contexto.caminho || [])

  // O acervo só traz descrição própria em parte dos marcadores (os vermelhos, na
  // convenção original). Quando existe e é substantiva, vale exibir como nota.
  const descricao = marker.description?.trim() || ''
  const notaAcervo = descricao.length >= 12 ? descricao : undefined

  const localizacao = entrada?.localizacao || classe.localizacao
  const contextoRegional = entrada?.localizacao ? undefined : regiao.topografia

  const vascularizacao = entrada?.vascularizacao
    ? entrada.vascularizacao
    : classe.mostraVasos
      ? `${regiao.arterias} ${regiao.veias}`
      : undefined

  const inervacao = entrada?.inervacao ? entrada.inervacao : classe.mostraNervos ? regiao.nervos : undefined

  return {
    classe: classe.rotulo,
    classeId: classe.id,
    regiao: regiao.nome,
    resumo: compor(entrada?.resumo, classe.resumo),
    localizacao,
    contextoRegional,
    funcao: compor(entrada?.funcao, classe.funcao),
    vascularizacao,
    inervacao,
    vasosRegionais: !entrada?.vascularizacao && !entrada?.inervacao,
    linfaticos: entrada?.linfaticos || (classe.mostraVasos ? regiao.linfaticos : undefined),
    relacoes: entrada?.relacoes,
    // Sem entrada curada, a correlação da região é mais específica que a da
    // classe — e o que vem primeiro é o que o aluno de fato lê.
    clinica: entrada?.clinica ? entrada.clinica : `${regiao.clinica || ''} ${classe.clinica}`.trim(),
    reparos: regiao.reparos,
    pontos: entrada?.pontos?.length ? entrada.pontos : classe.pontos,
    notaAcervo,
    aprofundado: Boolean(entrada),
  }
}

/** Quantos marcadores distintos do acervo têm ficha curada — usado em testes e na interface. */
export function temAprofundamento(titulo: string): boolean {
  return Boolean(buscarEntrada(titulo))
}
