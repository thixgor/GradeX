/**
 * Busca do Ensino (§15).
 *
 * O QUE UMA BUSCA BOA PRECISA FAZER AQUI
 *
 * Quem digita "insuficiência cardíaca" não quer 40 resultados achatados. Quer
 * ver, separados: a Trilha que ensina o assunto do zero, as aulas específicas,
 * o resumo de 6 minutos, o PDF e o deck de flashcards. São coisas com usos
 * diferentes — uma para aprender, outra para revisar antes da prova — e
 * misturá-las obriga o aluno a ler a lista inteira toda vez.
 *
 * Por isso o resultado sai AGRUPADO POR TIPO, e a ordenação acontece dentro de
 * cada grupo. Um único ranking global colocaria a Trilha em quinto lugar atrás
 * de quatro aulas dela mesma.
 *
 * O ranqueamento é intencionalmente simples e explicável: casamento no título
 * vale mais que na descrição, começo do título vale mais que meio, e igualdade
 * exata vale mais que tudo. Nada de relevância opaca — quando um resultado
 * aparece em primeiro, dá para dizer por quê.
 *
 * Módulo puro. Quem lê o banco é a rota; ela entrega os candidatos e recebe os
 * grupos prontos.
 */

/** Sem acento e sem caixa, para "atrio" achar "átrio". */
export function paraBusca(texto: string): string {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Abaixo de dois caracteres a busca devolve o acervo inteiro em ordem
 * arbitrária — pior que não buscar.
 */
export const TERMO_MINIMO = 2

export type TipoDeResultado =
  | 'trilha'
  | 'aula'
  | 'resumo'
  | 'pdf'
  | 'flashcards'
  | 'topico'

export interface Candidato {
  id: string
  tipo: TipoDeResultado
  titulo: string
  /** Texto secundário: descrição, localização, nome do tópico. */
  detalhe?: string
  /** Palavras extras que devem casar sem aparecer na tela (tags, sinônimos). */
  termos?: string[]
  href: string
  /** Metadados que a tela desenha (duração, número de aulas, cadeado). */
  extra?: Record<string, unknown>
}

export interface ResultadoPontuado extends Candidato {
  pontos: number
}

export interface GrupoDeResultados {
  tipo: TipoDeResultado
  rotulo: string
  itens: ResultadoPontuado[]
}

export const ROTULO_DO_TIPO: Record<TipoDeResultado, string> = {
  trilha: 'Trilhas',
  aula: 'Aulas',
  resumo: 'Aulas Resumo',
  pdf: 'PDFs',
  flashcards: 'Flashcards',
  topico: 'Tópicos',
}

/**
 * A ordem dos grupos na tela.
 *
 * Trilha primeiro por decisão de produto (§1): quem busca um assunto grande
 * quase sempre quer o caminho, não um vídeo solto no meio dele. Tópico vem por
 * último porque é navegação, não conteúdo.
 */
const ORDEM_DOS_GRUPOS: TipoDeResultado[] = [
  'trilha',
  'aula',
  'resumo',
  'pdf',
  'flashcards',
  'topico',
]

/**
 * Pontua um candidato contra o termo. `0` significa "não casou".
 *
 * A escala é grosseira de propósito: faixas largas e bem separadas fazem o
 * desempate cair no critério seguinte (ordem alfabética, data) em vez de em
 * frações de ponto que ninguém consegue prever.
 */
export function pontuar(candidato: Candidato, termo: string): number {
  const alvo = paraBusca(termo)
  if (alvo.length < TERMO_MINIMO) return 0

  const titulo = paraBusca(candidato.titulo)
  const detalhe = paraBusca(candidato.detalhe || '')
  const termos = (candidato.termos || []).map(paraBusca)

  if (titulo === alvo) return 100
  if (titulo.startsWith(alvo)) return 80
  if (termos.some((t) => t === alvo)) return 70

  // Palavra inteira dentro do título ("cardiaca" em "fisiopatologia cardiaca")
  // vale mais que pedaço de palavra ("card" em "cardiaca"): o primeiro é quase
  // sempre o que a pessoa quis dizer.
  const palavras = titulo.split(/\s+/)
  if (palavras.includes(alvo)) return 60
  if (titulo.includes(alvo)) return 45
  if (termos.some((t) => t.includes(alvo))) return 30
  if (detalhe.includes(alvo)) return 20

  // Última tentativa: todas as palavras do termo aparecem em algum lugar. É o
  // que faz "tratamento icfer" achar "Tratamento da ICFEr".
  const pedacos = alvo.split(/\s+/).filter((p) => p.length >= TERMO_MINIMO)
  if (pedacos.length > 1) {
    const tudo = `${titulo} ${detalhe} ${termos.join(' ')}`
    if (pedacos.every((p) => tudo.includes(p))) return 15
  }

  return 0
}

/**
 * Busca completa: pontua, descarta o que não casou e agrupa por tipo.
 *
 * `limitePorGrupo` existe porque a tela mostra os primeiros de cada grupo com
 * um "ver todos" — despejar 200 aulas numa página de busca é o mesmo que não
 * ter busca.
 */
export function buscar(
  candidatos: Candidato[],
  termo: string,
  opcoes: { limitePorGrupo?: number; tipos?: TipoDeResultado[] } = {},
): { grupos: GrupoDeResultados[]; total: number } {
  const limite = Math.max(1, opcoes.limitePorGrupo || 12)
  const permitidos = opcoes.tipos && opcoes.tipos.length > 0 ? new Set(opcoes.tipos) : null

  const porTipo = new Map<TipoDeResultado, ResultadoPontuado[]>()
  let total = 0

  for (const candidato of candidatos) {
    if (permitidos && !permitidos.has(candidato.tipo)) continue
    const pontos = pontuar(candidato, termo)
    if (pontos <= 0) continue
    const lista = porTipo.get(candidato.tipo) || []
    lista.push({ ...candidato, pontos })
    porTipo.set(candidato.tipo, lista)
    total += 1
  }

  const grupos: GrupoDeResultados[] = []
  for (const tipo of ORDEM_DOS_GRUPOS) {
    const itens = porTipo.get(tipo)
    if (!itens || itens.length === 0) continue
    itens.sort((a, b) => b.pontos - a.pontos || a.titulo.localeCompare(b.titulo, 'pt-BR'))
    grupos.push({ tipo, rotulo: ROTULO_DO_TIPO[tipo], itens: itens.slice(0, limite) })
  }

  return { grupos, total }
}

/**
 * Sugestões enquanto se digita — só títulos, sem agrupar.
 *
 * Separada de `buscar` porque o uso é outro: a caixa de sugestão precisa de
 * poucos itens e de resposta imediata, e agrupar seis resultados em quatro
 * caixinhas seria mais moldura do que conteúdo.
 */
export function sugerir(candidatos: Candidato[], termo: string, limite = 6): ResultadoPontuado[] {
  const pontuados: ResultadoPontuado[] = []
  for (const candidato of candidatos) {
    const pontos = pontuar(candidato, termo)
    if (pontos >= 20) pontuados.push({ ...candidato, pontos })
  }
  pontuados.sort((a, b) => b.pontos - a.pontos || a.titulo.localeCompare(b.titulo, 'pt-BR'))
  return pontuados.slice(0, limite)
}
