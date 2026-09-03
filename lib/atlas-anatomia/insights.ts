import type { AtlasMarker } from './estrutura'
import { classificar, classePorId, type ClasseEstrutural } from './classes'
import { resolverRegiao, type RegiaoAnatomica } from './regioes'
import { DICIONARIO } from './dicionario'
import type { EntradaDicionario } from './dicionario/tipos'

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
   * O gancho de memória da estrutura: mnemônico, imagem mental ou o raciocínio
   * que dispensa decorar. Só existe quando há ficha curada — inventar um gancho
   * a partir do texto de classe daria a mesma frase para cinquenta estruturas,
   * que é exatamente o oposto de lembrar.
   */
  memoria?: string
  /**
   * `true` quando vascularização, inervação e linfáticos vieram da região, e não
   * da estrutura — o que hoje só acontece em marcador sem ficha curada. A
   * interface rotula esses blocos como regionais para não induzir a erro.
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

/**
 * Índices montados uma única vez: normalizar 1.300 títulos a cada clique é
 * desperdício, e a busca acontece a cada marcador tocado e a cada distrator do
 * quiz.
 *
 * São dois índices porque são dois casamentos com prioridades diferentes. O
 * exato responde pelo título tal como o acervo escreveu; o por conteúdo só
 * entra depois, quando nenhuma ficha própria reivindicou aquele nome. Essa
 * ordem é o que impede a ficha do rim de responder por "Articulação
 * Carpometacarpal do Polegar (entre o osso trapézio e o primeiro metacarpo)",
 * ou a do osso ulna de explicar o nervo ulnar.
 */
const EXATOS = new Map<string, EntradaDicionario[]>()
const POR_CONTEUDO: Array<{ termo: string; entrada: EntradaDicionario }> = []

for (const entrada of DICIONARIO) {
  for (const termo of entrada.termos) {
    const chave = normalizar(termo)
    const lista = EXATOS.get(chave)
    if (lista) lista.push(entrada)
    else EXATOS.set(chave, [entrada])
  }
  for (const termo of entrada.contem || []) {
    POR_CONTEUDO.push({ termo: normalizar(termo), entrada })
  }
}

// Do mais longo para o mais curto: "arco anterior do atlas" deve vencer "atlas".
POR_CONTEUDO.sort((a, b) => b.termo.length - a.termo.length)

/**
 * Entre as fichas que respondem pelo mesmo título, vence a que declara o
 * sistema da prancha aberta; depois, a que não declara sistema nenhum (a ficha
 * geral). Só assim "Margem Superior" pode ser a borda da escápula na prancha do
 * cíngulo e a borda do coração na prancha do mediastino.
 */
function melhorEntrada(candidatas: EntradaDicionario[], sistema: string): EntradaDicionario {
  return (
    candidatas.find(entrada => entrada.sistemas?.includes(sistema)) ||
    candidatas.find(entrada => !entrada.sistemas) ||
    candidatas[0]
  )
}

function buscarEntrada(titulo: string, sistema: string): EntradaDicionario | undefined {
  const nome = normalizar(titulo)
  const exatas = EXATOS.get(nome)
  if (exatas) return melhorEntrada(exatas, sistema)

  const porConteudo = POR_CONTEUDO.filter(({ termo }) => nome.includes(termo))
  if (porConteudo.length === 0) return undefined
  return melhorEntrada(
    porConteudo.map(item => item.entrada),
    sistema,
  )
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
  const entrada = buscarEntrada(marker.title, contexto.sistema)
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

  // Ter ficha própria significa responder pela própria estrutura, inclusive no
  // que se cala. O texto da região só entra onde não há ficha nenhuma — é a rede
  // de segurança de um marcador novo, não um complemento.
  //
  // Misturar as duas camadas produzia erro grosseiro: numa prancha do coração o
  // acervo marca o lobo superior do pulmão direito, e a ficha dele exibia as
  // artérias coronárias como irrigação. O lobo pulmonar não vê uma coronária na
  // vida. O rótulo "da região" não salvava: o aluno lê o bloco, não o rótulo.
  const vascularizacao = entrada
    ? entrada.vascularizacao
    : classe.mostraVasos
      ? `${regiao.arterias} ${regiao.veias}`
      : undefined

  const inervacao = entrada ? entrada.inervacao : classe.mostraNervos ? regiao.nervos : undefined

  const linfaticos = entrada ? entrada.linfaticos : classe.mostraVasos ? regiao.linfaticos : undefined

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
    vasosRegionais: !entrada,
    linfaticos,
    relacoes: entrada?.relacoes,
    memoria: entrada?.memoria,
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
export function temAprofundamento(titulo: string, sistema = ''): boolean {
  return Boolean(buscarEntrada(titulo, sistema))
}
