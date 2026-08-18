/**
 * A organização do Banco de Questões: Módulo → Tópico → Subtópico.
 *
 * Antes havia um nível acima de tudo, "Período" ("SOI I", "HAM II"). Ele foi
 * removido do produto porque era a pior porta de entrada possível: pedia que a
 * pessoa soubesse o nome interno da grade da faculdade ANTES de ver uma única
 * questão, e um módulo só existia dentro de um período — então "Cardiologia"
 * podia estar em dois lugares sem que ninguém percebesse.
 *
 * O campo `periodoId` continua nos documentos antigos e nada foi apagado (a
 * transição é por leitura, não por script): ele simplesmente deixou de ser lido.
 * Módulo passou a ser o topo.
 *
 * Este arquivo não importa nada — é lido pelas telas e pelas rotas, que
 * precisam concordar sobre a mesma árvore.
 */

export interface NoDeHierarquia {
  _id: string
  nome: string
  /** Contagem do ramo inteiro, já somada. */
  totalQuestoes: number
}

export interface ModuloDaArvore extends NoDeHierarquia {
  /** Todos os tópicos do módulo, em lista plana. */
  topicos: TopicoDaArvore[]
  /** Os mesmos tópicos, quebrados nos segmentos do nome. Ver `montarRamos`. */
  ramos: RamoDaArvore[]
}

export interface TopicoDaArvore extends NoDeHierarquia {
  moduloId: string
  subtopicos: NoDeHierarquia[]
}

/**
 * Um segmento do caminho de um tópico.
 *
 * A importação das provas grava o caminho inteiro no NOME do tópico, unido por
 * " › " — "1º PERÍODO › HAM I". Isso é proposital: usar só o último segmento
 * faria "HAM I" do 1º período e "HAM I" do 2º se fundirem num tópico só (ver
 * lib/banco/importar-provas.ts).
 *
 * O preço é que a árvore mostrava uma linha por caminho completo, achatada:
 * doze linhas "1º PERÍODO › ..." seguidas de doze "2º PERÍODO › ...", todas
 * cortadas no meio pela largura da coluna, sem nada em comum visível entre as
 * do mesmo período. O nome mais longo — justamente o que diferencia uma linha
 * da outra — era o primeiro a ser cortado.
 *
 * `montarRamos` desfaz o achatamento na LEITURA: cada segmento vira um nível
 * que abre e fecha. O dado no banco não muda; o que muda é que "1º PERÍODO"
 * passa a ser uma pasta com os módulos dele dentro.
 */
export interface RamoDaArvore {
  /** O caminho até aqui, dentro do módulo — identidade estável para abrir/fechar. */
  chave: string
  /** Só o segmento, sem o caminho. */
  nome: string
  /** Soma do ramo inteiro: o tópico daqui (se houver) mais os sub-ramos. */
  totalQuestoes: number
  /** O tópico que termina exatamente neste segmento, quando existe. */
  topico?: TopicoDaArvore
  ramos: RamoDaArvore[]
}

/** O que a importação usa para unir os segmentos do caminho. */
export const SEPARADOR_DE_CAMINHO = ' › '

interface ModuloBruto {
  _id: string
  nome: string
  ordem?: number
  totalQuestoes?: number
}
interface TopicoBruto {
  _id: string
  moduloId: string
  nome: string
  ordem?: number
  totalQuestoes?: number
}
interface SubtopicoBruto {
  _id: string
  topicoId: string
  nome: string
  ordem?: number
  totalQuestoes?: number
}

/** Remove acentos e caixa. "Fibrilação Atrial" → "fibrilacao atrial". */
export function paraBusca(valor: string): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Código estável a partir do nome — usado para casar hierarquia na importação.
 *
 * Precisa ser idempotente: importar duas vezes o mesmo material não pode criar
 * "Cardiologia" e "cardiologia " como dois módulos diferentes.
 */
export function paraCodigo(valor: string): string {
  return paraBusca(valor)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Monta a árvore com as contagens somadas de baixo para cima.
 *
 * A contagem que aparece num módulo é a do ramo inteiro. Um módulo que mostra
 * "0 questões" porque só tem questões nos tópicos filhos é um módulo que
 * ninguém abre.
 */
export function montarArvore(
  modulos: ModuloBruto[],
  topicos: TopicoBruto[],
  subtopicos: SubtopicoBruto[],
): ModuloDaArvore[] {
  const subsPorTopico = new Map<string, NoDeHierarquia[]>()
  for (const s of subtopicos) {
    const lista = subsPorTopico.get(s.topicoId) || []
    lista.push({ _id: s._id, nome: s.nome, totalQuestoes: s.totalQuestoes || 0 })
    subsPorTopico.set(s.topicoId, lista)
  }

  const topicosPorModulo = new Map<string, TopicoDaArvore[]>()
  for (const t of topicos) {
    const filhos = ordenarPorNome(subsPorTopico.get(t._id) || [])
    const lista = topicosPorModulo.get(t.moduloId) || []
    lista.push({
      _id: t._id,
      moduloId: t.moduloId,
      nome: t.nome,
      // O total do tópico já vem contado direto do banco; os subtópicos são um
      // recorte DENTRO dele, não uma soma a mais — somar os dois contaria a
      // mesma questão duas vezes.
      totalQuestoes: t.totalQuestoes || 0,
      subtopicos: filhos,
    })
    topicosPorModulo.set(t.moduloId, lista)
  }

  return modulos
    .map((m) => {
      const filhos = ordenarPorNome(topicosPorModulo.get(m._id) || []) as TopicoDaArvore[]
      return {
        _id: m._id,
        nome: m.nome,
        totalQuestoes: m.totalQuestoes ?? filhos.reduce((s, t) => s + t.totalQuestoes, 0),
        topicos: filhos,
        ramos: montarRamos(filhos),
      }
    })
    .sort(compararNomes)
}

/**
 * Quebra os tópicos nos segmentos do nome e devolve os níveis aninhados.
 *
 * "1º PERÍODO › HAM I" e "1º PERÍODO › SOI I" viram um ramo "1º PERÍODO" com
 * dois filhos. Um tópico sem separador no nome (o caso de quem cadastrou a
 * hierarquia à mão) vira um ramo de um nível só, com o tópico nele — ou seja,
 * a árvore antiga continua saindo igual, sem nenhum caso especial.
 *
 * A contagem de um ramo intermediário é a soma do que está abaixo dele; a de um
 * ramo que também É um tópico soma o próprio total, porque as questões daquele
 * tópico não estão em nenhum dos filhos.
 */
export function montarRamos(topicos: TopicoDaArvore[]): RamoDaArvore[] {
  const raizes: RamoDaArvore[] = []
  const porChave = new Map<string, RamoDaArvore>()

  for (const topico of topicos) {
    const segmentos = separarCaminho(topico.nome)
    let nivel = raizes
    let chave = ''

    segmentos.forEach((nome, i) => {
      chave = chave ? `${chave}${SEPARADOR_DE_CAMINHO}${nome}` : nome
      let ramo = porChave.get(chave)
      if (!ramo) {
        ramo = { chave, nome, totalQuestoes: 0, ramos: [] }
        porChave.set(chave, ramo)
        nivel.push(ramo)
      }
      // Dois tópicos com o mesmo caminho não existem — o código do tópico é
      // único por módulo e sai do nome. Se acontecer, o primeiro fica: perder
      // um é melhor do que trocar de lugar a cada renderização.
      if (i === segmentos.length - 1 && !ramo.topico) ramo.topico = topico
      nivel = ramo.ramos
    })
  }

  somarRamos(raizes)
  return ordenarRamos(raizes)
}

/** "1º PERÍODO › HAM I" → ["1º PERÍODO", "HAM I"]. */
export function separarCaminho(nome: string): string[] {
  const partes = String(nome || '')
    .split('›')
    .map((p) => p.trim())
    .filter(Boolean)
  // Nome vazio ainda precisa render alguma coisa; some-lo faria o tópico
  // desaparecer da árvore sem que a contagem do módulo mudasse.
  return partes.length > 0 ? partes : [String(nome || '').trim() || 'Sem nome']
}

function somarRamos(ramos: RamoDaArvore[]): number {
  let soma = 0
  for (const ramo of ramos) {
    ramo.totalQuestoes = (ramo.topico?.totalQuestoes || 0) + somarRamos(ramo.ramos)
    soma += ramo.totalQuestoes
  }
  return soma
}

function ordenarRamos(ramos: RamoDaArvore[]): RamoDaArvore[] {
  for (const ramo of ramos) ramo.ramos = ordenarRamos(ramo.ramos)
  return ramos.sort(compararNomes)
}

/** Todos os ids de tópico dentro de um ramo — o ramo inteiro é selecionável. */
export function topicosDoRamo(ramo: RamoDaArvore): string[] {
  const ids = ramo.topico ? [ramo.topico._id] : []
  for (const filho of ramo.ramos) ids.push(...topicosDoRamo(filho))
  return ids
}

/**
 * Ordem alfabética com números lidos como números.
 *
 * Sem `numeric`, "10º PERÍODO" vem antes de "2º PERÍODO" — a grade da faculdade
 * apareceria fora de ordem justamente no nível que existe para dar ordem.
 */
function compararNomes(a: { nome: string }, b: { nome: string }): number {
  return a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true })
}

function ordenarPorNome<T extends { nome: string }>(lista: T[]): T[] {
  return [...lista].sort(compararNomes)
}

/**
 * Filtra a árvore por um termo, mantendo o caminho.
 *
 * Um tópico que casa aparece com o módulo dele em volta — arrancar o tópico do
 * contexto faria "Arritmias" aparecer sem dizer de qual módulo veio, e há
 * "Arritmias" em mais de um.
 */
export function filtrarArvore(arvore: ModuloDaArvore[], termo: string): ModuloDaArvore[] {
  const alvo = paraBusca(termo)
  if (alvo.length < 2) return arvore

  const casa = (nome: string) => paraBusca(nome).includes(alvo)

  return arvore
    .map((modulo) => {
      if (casa(modulo.nome)) return modulo
      const topicos = modulo.topicos
        .map((topico) => {
          if (casa(topico.nome)) return topico
          const subtopicos = topico.subtopicos.filter((s) => casa(s.nome))
          return subtopicos.length > 0 ? { ...topico, subtopicos } : null
        })
        .filter(Boolean) as TopicoDaArvore[]
      // Os ramos são remontados a partir dos tópicos que sobraram: manter os
      // ramos originais mostraria níveis vazios, com a contagem do que a busca
      // acabou de esconder.
      return topicos.length > 0 ? { ...modulo, topicos, ramos: montarRamos(topicos) } : null
    })
    .filter(Boolean) as ModuloDaArvore[]
}

/** Total de questões visíveis na árvore (já filtrada ou não). */
export function totalDaArvore(arvore: ModuloDaArvore[]): number {
  return arvore.reduce((soma, m) => soma + m.totalQuestoes, 0)
}

/** O caminho legível de uma questão, para mostrar no cartão dela. */
export function descreverCaminho(partes: {
  moduloNome?: string
  topicoNome?: string
  subtopicoNome?: string
}): string {
  return [partes.moduloNome, partes.topicoNome, partes.subtopicoNome]
    .filter((p) => !!p && String(p).trim().length > 0)
    .join(' › ')
}
