/**
 * A árvore do curso como o administrador precisa vê-la (§3, §4).
 *
 * A tela de aluno pode se dar ao luxo de esconder o que está fora do lugar: ela
 * desenha só o que tem conteúdo e ignora o resto. O painel não pode. Se um
 * módulo ficou apontando para um tópico apagado, o admin PRECISA enxergar o
 * módulo — senão ele some da tela, continua no banco e ninguém nunca conserta.
 *
 * Por isso este montador tem duas regras que o da biblioteca não tem:
 *
 *  1. **nada é descartado.** O que não acha pai vai para um ramo de órfãos, com
 *     nome e ação de mover;
 *  2. **o pai é o mais fundo que existir.** A hierarquia é opcional (§2): uma
 *     aula pode pendurar direto no curso, ou no módulo, ou no submódulo. Ela
 *     aparece embaixo do vínculo mais específico que ainda exista.
 *
 * É lógica pura, sem React e sem banco, para poder ser exercitada com árvores
 * torcidas de propósito — que é justamente onde um painel de administração
 * costuma quebrar.
 */

export type TipoDeNo = 'setor' | 'topico' | 'subtopico' | 'modulo' | 'submodulo' | 'aula'

export type CampoDePai = 'setorId' | 'topicoId' | 'subtopicoId' | 'moduloId' | 'submoduloId'

/** Rótulos no singular, para os textos da tela. */
export const ROTULO_DO_TIPO: Record<TipoDeNo, string> = {
  setor: 'Curso',
  topico: 'Tópico',
  subtopico: 'Subtópico',
  modulo: 'Módulo',
  submodulo: 'Submódulo',
  aula: 'Aula',
}

/**
 * Que tipo pode nascer dentro de qual.
 *
 * A ordem importa: é ela que monta o menu de "adicionar" e define qual é a
 * sugestão padrão (o primeiro da lista).
 */
export const FILHOS_PERMITIDOS: Record<TipoDeNo, TipoDeNo[]> = {
  setor: ['topico', 'modulo', 'aula'],
  topico: ['subtopico', 'modulo', 'aula'],
  subtopico: ['modulo', 'aula'],
  modulo: ['submodulo', 'aula'],
  submodulo: ['aula'],
  aula: [],
}

export interface DocumentoDeNo {
  _id: string
  nome?: string
  titulo?: string
  descricao?: string
  ordem?: number
  oculta?: boolean
  setorId?: string
  topicoId?: string
  subtopicoId?: string
  moduloId?: string
  submoduloId?: string
  [chave: string]: any
}

export interface NoDaArvore {
  id: string
  tipo: TipoDeNo
  nome: string
  ordem: number
  oculta: boolean
  /** Vínculos declarados no documento, já normalizados para string. */
  pai: Partial<Record<CampoDePai, string>>
  filhos: NoDaArvore[]
  /** Documento original — a tela precisa dele para badges e edição. */
  dados: DocumentoDeNo
  /** Aulas neste nó e em toda a descendência. Alimenta o contador do cabeçalho. */
  totalAulas: number
}

export interface EntradaDaArvore {
  setores?: DocumentoDeNo[]
  topicos?: DocumentoDeNo[]
  subtopicos?: DocumentoDeNo[]
  modulos?: DocumentoDeNo[]
  submodulos?: DocumentoDeNo[]
  aulas?: DocumentoDeNo[]
}

/** Id sintético do ramo que recolhe o que perdeu o pai. */
export const ID_ORFAOS = '__orfaos__'

/**
 * Onde cada tipo procura o pai, do vínculo mais específico ao mais raso.
 *
 * Ler de trás para frente é o que faz a hierarquia opcional funcionar: uma aula
 * com `moduloId` e `setorId` mora no módulo; a mesma aula com só `setorId` mora
 * direto no curso.
 */
const CAMINHO_DO_PAI: Record<TipoDeNo, CampoDePai[]> = {
  setor: [],
  topico: ['setorId'],
  subtopico: ['topicoId', 'setorId'],
  modulo: ['subtopicoId', 'topicoId', 'setorId'],
  submodulo: ['moduloId'],
  aula: ['submoduloId', 'moduloId', 'subtopicoId', 'topicoId', 'setorId'],
}

/** Que tipo mora em cada campo de vínculo. */
const TIPO_DO_CAMPO: Record<CampoDePai, TipoDeNo> = {
  setorId: 'setor',
  topicoId: 'topico',
  subtopicoId: 'subtopico',
  moduloId: 'modulo',
  submoduloId: 'submodulo',
}

function texto(valor: unknown): string {
  return valor === null || valor === undefined ? '' : String(valor)
}

function criarNo(doc: DocumentoDeNo, tipo: TipoDeNo): NoDaArvore {
  const pai: Partial<Record<CampoDePai, string>> = {}
  for (const campo of ['setorId', 'topicoId', 'subtopicoId', 'moduloId', 'submoduloId'] as CampoDePai[]) {
    const valor = texto(doc[campo])
    if (valor) pai[campo] = valor
  }

  return {
    id: texto(doc._id),
    tipo,
    nome: texto(doc.nome || doc.titulo) || 'Sem nome',
    ordem: Number.isFinite(Number(doc.ordem)) ? Number(doc.ordem) : 0,
    oculta: doc.oculta === true,
    pai,
    filhos: [],
    dados: doc,
    totalAulas: 0,
  }
}

/**
 * Ordena irmãos: agrupadores antes de aulas, depois pela ordem, depois pelo nome.
 *
 * Agrupador vem primeiro pelo mesmo motivo que pasta vem antes de arquivo em
 * qualquer gerenciador: sem isso, um módulo com `ordem: 0` e uma aula com
 * `ordem: 0` se intercalam, e a lista alterna entre coisas que abrem e coisas
 * que não abrem.
 *
 * O desempate por nome não é cosmético — sem ele, itens todos com `ordem: 0`
 * (o padrão de quem nunca arrastou nada) apareceriam numa sequência que muda a
 * cada carregamento, e o admin perderia o item de vista entre dois F5.
 */
function ordenar(nos: NoDaArvore[]): NoDaArvore[] {
  return nos.sort(
    (a, b) =>
      Number(a.tipo === 'aula') - Number(b.tipo === 'aula') ||
      a.ordem - b.ordem ||
      a.nome.localeCompare(b.nome, 'pt-BR'),
  )
}

export function montarArvore(entrada: EntradaDaArvore): {
  raizes: NoDaArvore[]
  orfaos: NoDaArvore[]
  porId: Map<string, NoDaArvore>
} {
  const porId = new Map<string, NoDaArvore>()

  const listas: Array<[TipoDeNo, DocumentoDeNo[]]> = [
    ['setor', entrada.setores || []],
    ['topico', entrada.topicos || []],
    ['subtopico', entrada.subtopicos || []],
    ['modulo', entrada.modulos || []],
    ['submodulo', entrada.submodulos || []],
    ['aula', entrada.aulas || []],
  ]

  for (const [tipo, docs] of listas) {
    for (const doc of docs) {
      const no = criarNo(doc, tipo)
      if (no.id) porId.set(no.id, no)
    }
  }

  const raizes: NoDaArvore[] = []
  const orfaos: NoDaArvore[] = []

  for (const no of porId.values()) {
    if (no.tipo === 'setor') {
      raizes.push(no)
      continue
    }

    // Do vínculo mais específico ao mais raso: o primeiro que existir de fato
    // vira o pai. Um `moduloId` apontando para módulo apagado é ignorado, e a
    // aula desce um degrau em vez de sumir.
    let acolhido = false
    for (const campo of CAMINHO_DO_PAI[no.tipo]) {
      const idDoPai = no.pai[campo]
      if (!idDoPai) continue
      const candidato = porId.get(idDoPai)
      if (!candidato || candidato.tipo !== TIPO_DO_CAMPO[campo]) continue
      candidato.filhos.push(no)
      acolhido = true
      break
    }

    if (!acolhido) orfaos.push(no)
  }

  for (const no of porId.values()) ordenar(no.filhos)
  ordenar(raizes)
  ordenar(orfaos)

  for (const raiz of raizes) contarAulas(raiz)
  for (const orfao of orfaos) contarAulas(orfao)

  return { raizes, orfaos, porId }
}

/** Soma as aulas do nó e de toda a descendência, gravando em cada nível. */
export function contarAulas(no: NoDaArvore): number {
  let total = no.tipo === 'aula' ? 1 : 0
  for (const filho of no.filhos) total += contarAulas(filho)
  no.totalAulas = total
  return total
}

/** Percorre a árvore de cima para baixo. */
export function percorrer(nos: NoDaArvore[], visitar: (no: NoDaArvore, profundidade: number) => void) {
  function descer(lista: NoDaArvore[], profundidade: number) {
    for (const no of lista) {
      visitar(no, profundidade)
      descer(no.filhos, profundidade + 1)
    }
  }
  descer(nos, 0)
}

/** Todas as aulas abaixo de um nó — o que a seleção em massa precisa saber. */
export function aulasAbaixo(no: NoDaArvore): NoDaArvore[] {
  const encontradas: NoDaArvore[] = []
  percorrer([no], (atual) => {
    if (atual.tipo === 'aula') encontradas.push(atual)
  })
  return encontradas
}

/**
 * Reordena irmãos e devolve os movimentos que o servidor precisa gravar.
 *
 * Devolve a lista INTEIRA de irmãos renumerada, não só o item que se moveu.
 * Mandar só o item mexido deixaria a numeração cheia de empates (todo mundo em
 * `ordem: 0`, que é como as coleções antigas nasceram) e a próxima leitura
 * cairia no desempate por nome — a ordem "voltaria sozinha" depois do F5.
 */
export function reordenar(
  irmaos: NoDaArvore[],
  de: number,
  para: number,
): Array<{ tipo: TipoDeNo; id: string; ordem: number }> {
  const lista = [...irmaos]
  if (de < 0 || de >= lista.length) return []

  const destino = Math.max(0, Math.min(lista.length - 1, para))
  const [movido] = lista.splice(de, 1)
  lista.splice(destino, 0, movido)

  return lista.map((no, indice) => ({ tipo: no.tipo, id: no.id, ordem: indice }))
}

/**
 * Movimentos para transferir um nó para outro pai.
 *
 * O nó recebe os vínculos do destino e perde os que o destino não tem — é o que
 * impede uma aula movida de um submódulo para o curso de continuar carregando o
 * `moduloId` antigo e reaparecer no módulo de onde saiu.
 */
export function moverPara(
  no: NoDaArvore,
  destino: NoDaArvore | null,
  ordem: number,
): { tipo: TipoDeNo; id: string; ordem: number; pai: Record<string, string | null> } | null {
  if (!destino) {
    // Solto na raiz: só faz sentido para nós que sabem viver sem pai.
    if (no.tipo !== 'setor') return null
    return { tipo: no.tipo, id: no.id, ordem, pai: {} }
  }

  if (!FILHOS_PERMITIDOS[destino.tipo].includes(no.tipo)) return null
  if (ehDescendente(no, destino.id)) return null

  const campos: CampoDePai[] = ['setorId', 'topicoId', 'subtopicoId', 'moduloId', 'submoduloId']
  const vinculosDoDestino = { ...destino.pai, [campoDoTipo(destino.tipo)]: destino.id }

  const pai: Record<string, string | null> = {}
  for (const campo of campos) {
    if (!CAMINHO_DO_PAI[no.tipo].includes(campo) && campo !== campoDoTipo(destino.tipo)) {
      continue
    }
    pai[campo] = (vinculosDoDestino as any)[campo] || null
  }

  return { tipo: no.tipo, id: no.id, ordem, pai }
}

function campoDoTipo(tipo: TipoDeNo): CampoDePai {
  const mapa: Record<Exclude<TipoDeNo, 'aula'>, CampoDePai> = {
    setor: 'setorId',
    topico: 'topicoId',
    subtopico: 'subtopicoId',
    modulo: 'moduloId',
    submodulo: 'submoduloId',
  }
  return mapa[tipo as Exclude<TipoDeNo, 'aula'>]
}

/**
 * O destino está dentro do próprio nó?
 *
 * Sem esta checagem, arrastar um curso para dentro de um módulo dele mesmo
 * criaria um ciclo: a árvore some da tela e os dois nós ficam inalcançáveis no
 * banco, cada um se declarando filho do outro.
 */
export function ehDescendente(no: NoDaArvore, idProcurado: string): boolean {
  if (no.id === idProcurado) return true
  return no.filhos.some((filho) => ehDescendente(filho, idProcurado))
}

/** Normaliza para busca: sem acento e sem caixa, para "cardio" achar "Cardío". */
export function paraBusca(valor: string): string {
  // O intervalo vai escrito como escape (\u0300-\u036f, os diacríticos
  // combinantes que o NFD separa) e não como os caracteres literais: literais
  // são invisíveis no editor e sobrevivem mal a cópia entre ferramentas.
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Filtra a árvore por texto, mantendo o caminho até o que casou.
 *
 * Devolver só os nós que batem quebraria a navegação: a aula apareceria solta,
 * sem o curso e o módulo em volta, e o admin não saberia de onde ela veio nem
 * conseguiria arrastá-la para lugar nenhum.
 */
export function filtrarArvore(nos: NoDaArvore[], termo: string): NoDaArvore[] {
  const alvo = paraBusca(termo).trim()
  if (alvo.length < 2) return nos

  function filtrar(no: NoDaArvore): NoDaArvore | null {
    const filhos = no.filhos.map(filtrar).filter(Boolean) as NoDaArvore[]
    const casou = paraBusca(no.nome).includes(alvo)
    if (!casou && filhos.length === 0) return null
    // Quando o próprio nó casa, a descendência inteira vem junto: quem procurou
    // por um módulo quer ver as aulas dele, não um módulo vazio.
    return { ...no, filhos: casou ? no.filhos : filhos }
  }

  return nos.map(filtrar).filter(Boolean) as NoDaArvore[]
}
