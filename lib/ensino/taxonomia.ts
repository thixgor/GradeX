/**
 * A taxonomia do Ensino — Área → Módulo → Tópico → Subtópico.
 *
 * POR QUE UMA COLEÇÃO SÓ, E NÃO QUATRO
 *
 * O sistema antigo tinha uma coleção por nível (`aulas_setores`,
 * `aulas_topicos`, `aulas_subtopicos`, `aulas_modulos`, `aulas_submodulos`) e
 * cinco rotas quase idênticas para administrá-las. Cada nível novo custava uma
 * coleção, uma rota, um editor e mais um `if` em toda tela que desenhava a
 * árvore — e o nível intermediário opcional (§2) obrigava cada consumidor a
 * saber que módulo pode pendurar em tópico OU em subtópico OU direto no setor.
 *
 * Aqui existe um NÓ, com um campo `nivel` e um pai. A árvore inteira sai de uma
 * consulta, a profundidade é dado e não código, e acrescentar "Internato" ou um
 * quinto nível amanhã não move nenhuma tabela.
 *
 * O que este módulo NÃO faz: falar com o banco. Ele recebe a lista plana de nós
 * e devolve árvore, caminho e validação. É o que permite testar a regra do
 * "subtópico é opcional" sem subir Mongo.
 *
 * A hierarquia antiga continua existindo em paralelo e intocada — ver
 * `lib/ensino/compatibilidade.ts`.
 */

/* =================== NÍVEIS =================== */

/**
 * Os quatro níveis, em ordem de profundidade.
 *
 * O vocabulário é fechado de propósito (§32): "módulo" significa etapa
 * curricular (Ciclo Básico) e nada mais; "tópico" é área de conhecimento
 * (Sistema Cardiovascular); "subtópico" é agrupamento intermediário
 * (Fisiologia). Deixar a nomenclatura livre foi exatamente o que produziu, no
 * modelo antigo, um "módulo" que às vezes era disciplina e às vezes era aula
 * grande.
 */
export const NIVEIS = ['area', 'modulo', 'topico', 'subtopico'] as const

export type NivelDeEnsino = (typeof NIVEIS)[number]

/** Rótulos para a interface — um lugar só, para admin e aluno concordarem. */
export const ROTULO_DO_NIVEL: Record<NivelDeEnsino, string> = {
  area: 'Área',
  modulo: 'Módulo',
  topico: 'Tópico',
  subtopico: 'Subtópico',
}

export const EXEMPLO_DO_NIVEL: Record<NivelDeEnsino, string> = {
  area: 'Medicina',
  modulo: 'Ciclo Básico',
  topico: 'Sistema Cardiovascular',
  subtopico: 'Fisiologia',
}

/** Profundidade numérica: `area` = 0, `subtopico` = 3. */
export function profundidadeDoNivel(nivel: NivelDeEnsino): number {
  return NIVEIS.indexOf(nivel)
}

/** O nível que um filho de `nivel` deve ter. `null` no fim da hierarquia. */
export function nivelFilho(nivel: NivelDeEnsino): NivelDeEnsino | null {
  const proximo = NIVEIS[profundidadeDoNivel(nivel) + 1]
  return proximo || null
}

/** O nível que o pai de `nivel` deve ter. `null` para a raiz. */
export function nivelPai(nivel: NivelDeEnsino): NivelDeEnsino | null {
  const anterior = NIVEIS[profundidadeDoNivel(nivel) - 1]
  return anterior || null
}

export function ehNivelValido(valor: unknown): valor is NivelDeEnsino {
  return typeof valor === 'string' && (NIVEIS as readonly string[]).includes(valor)
}

/* =================== O NÓ =================== */

export interface NoDeEnsino {
  _id: string
  nivel: NivelDeEnsino
  /** `null` só para Área. */
  paiId: string | null
  nome: string
  slug: string
  descricao?: string
  /** Cor de acento (hex) usada nos cartões de navegação. Opcional. */
  cor?: string
  /**
   * A capa do nó — a imagem que representa "Ciclo Clínico" ou "Cardiologia".
   *
   * A navegação por assunto era uma lista de nomes em caixas iguais: nada
   * distinguia Cardiologia de Farmacologia além de sete letras a mais. Capa é o
   * que dá ao acervo a mesma leitura de relance que as Trilhas já tinham.
   *
   * É opcional em dois níveis. Sem `imagem`, o cartão usa `cor` (ou uma cor
   * derivada do slug) num gradiente com o nome em tipografia. E sem nada
   * cadastrado, `herdarCapas` empresta a capa de uma aula de dentro do próprio
   * nó — o acervo nasce ilustrado sem ninguém subir uma imagem sequer.
   */
  capa?: { imagem?: string; cor?: string } | null
  ordem: number
  oculto?: boolean
  criadoEm?: Date | string
  atualizadoEm?: Date | string
}

/** O nó com seus filhos e a contagem de aulas que penduram abaixo dele. */
export interface RamoDeEnsino extends NoDeEnsino {
  filhos: RamoDeEnsino[]
  /** Aulas presas exatamente neste nó. */
  aulas: number
  /** Aulas neste nó e em toda a descendência — é o número que a tela mostra. */
  aulasNaArvore: number
}

/* =================== SLUG =================== */

const SLUG_MAX = 72

/**
 * `"Sistema Cardiovascular"` → `"sistema-cardiovascular"`.
 *
 * O slug é o que aparece no endereço (`/aulas/explorar/sistema-cardiovascular`)
 * e o que o importador usa para reencontrar um nó já existente sem depender de
 * ObjectId — é ele que torna o arquivo de importação legível e reexecutável
 * (§30).
 */
export function gerarSlug(texto: string): string {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
}

/**
 * Slug livre dentro do conjunto `usados`.
 *
 * Sufixo numérico em vez de erro: dois subtópicos chamados "Fisiologia" em
 * tópicos diferentes são absolutamente normais, e recusar o segundo obrigaria o
 * admin a inventar nome feio ("Fisiologia 2 Cardio") só para satisfazer o
 * banco.
 */
export function slugUnico(texto: string, usados: Set<string> | string[]): string {
  const conjunto = usados instanceof Set ? usados : new Set(usados)
  const base = gerarSlug(texto) || 'no'
  if (!conjunto.has(base)) return base
  for (let i = 2; i < 500; i++) {
    const tentativa = `${base}-${i}`.slice(0, SLUG_MAX)
    if (!conjunto.has(tentativa)) return tentativa
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, SLUG_MAX)
}

/* =================== VALIDAÇÃO =================== */

export interface ProblemaNaTaxonomia {
  campo: 'nome' | 'nivel' | 'paiId'
  mensagem: string
}

/**
 * O nó é plantável onde ele diz que é?
 *
 * A regra é uma só e vale para os dois lados: Área não tem pai, e todo o resto
 * tem um pai exatamente um nível acima. Sem essa checagem no servidor, um
 * subtópico solto (sem tópico) viraria conteúdo invisível — ele não apareceria
 * em nenhuma navegação e ninguém entenderia por quê.
 */
export function validarNo(
  entrada: { nome?: string; nivel?: string; paiId?: string | null },
  pai: Pick<NoDeEnsino, 'nivel'> | null,
): ProblemaNaTaxonomia[] {
  const problemas: ProblemaNaTaxonomia[] = []

  if (!String(entrada.nome || '').trim()) {
    problemas.push({ campo: 'nome', mensagem: 'Dê um nome a este nível.' })
  }

  if (!ehNivelValido(entrada.nivel)) {
    problemas.push({ campo: 'nivel', mensagem: 'Nível inválido.' })
    return problemas
  }

  const esperado = nivelPai(entrada.nivel)

  if (!esperado) {
    if (entrada.paiId) {
      problemas.push({ campo: 'paiId', mensagem: 'Uma Área não fica dentro de nada.' })
    }
    return problemas
  }

  if (!entrada.paiId || !pai) {
    problemas.push({
      campo: 'paiId',
      mensagem: `Escolha ${esperado === 'area' ? 'a Área' : `o ${ROTULO_DO_NIVEL[esperado]}`} onde este ${ROTULO_DO_NIVEL[entrada.nivel]} entra.`,
    })
    return problemas
  }

  if (pai.nivel !== esperado) {
    problemas.push({
      campo: 'paiId',
      mensagem: `${ROTULO_DO_NIVEL[entrada.nivel]} só entra dentro de ${ROTULO_DO_NIVEL[esperado]}.`,
    })
  }

  return problemas
}

/* =================== ÁRVORE =================== */

const porOrdem = (a: NoDeEnsino, b: NoDeEnsino) =>
  (a.ordem || 0) - (b.ordem || 0) || a.nome.localeCompare(b.nome, 'pt-BR')

/**
 * Monta a árvore a partir da lista plana.
 *
 * `contagem` mapeia noId → número de aulas presas naquele nó exato. A soma
 * acumulada (`aulasNaArvore`) é calculada aqui, uma vez, e não na renderização:
 * fazer isso na tela significaria varrer a lista de aulas dentro de um `map`
 * de árvore, que é o caminho mais curto para uma navegação lenta com acervo
 * grande.
 *
 * Nó órfão (pai apagado) sobe para a raiz em vez de sumir — conteúdo que
 * desaparece da tela sem avisar é como um acervo se perde.
 */
export function montarArvore(
  nos: NoDeEnsino[],
  contagem: Map<string, number> = new Map(),
): RamoDeEnsino[] {
  const porId = new Map<string, RamoDeEnsino>()
  for (const no of nos) {
    porId.set(String(no._id), {
      ...no,
      _id: String(no._id),
      filhos: [],
      aulas: contagem.get(String(no._id)) || 0,
      aulasNaArvore: 0,
    })
  }

  const raizes: RamoDeEnsino[] = []
  for (const ramo of Array.from(porId.values())) {
    const pai = ramo.paiId ? porId.get(String(ramo.paiId)) : null
    if (pai && pai !== ramo) pai.filhos.push(ramo)
    else raizes.push(ramo)
  }

  const acumular = (ramo: RamoDeEnsino): number => {
    ramo.filhos.sort(porOrdem)
    ramo.aulasNaArvore = ramo.aulas + ramo.filhos.reduce((soma, f) => soma + acumular(f), 0)
    return ramo.aulasNaArvore
  }

  raizes.sort(porOrdem)
  for (const raiz of raizes) acumular(raiz)
  return raizes
}

/**
 * O caminho de volta até a Área — "Medicina › Ciclo Básico › Cardiovascular".
 *
 * É o que a aula usa para dizer de onde ela veio (§9) e o que a página de
 * exploração usa como migalha. Devolve da raiz para a folha.
 */
export function caminhoAte(nos: NoDeEnsino[], noId: string): NoDeEnsino[] {
  const porId = new Map(nos.map((n) => [String(n._id), n]))
  const caminho: NoDeEnsino[] = []
  let atual = porId.get(String(noId)) || null
  // O teto de 8 protege contra ciclo: um pai que aponta para um descendente
  // (possível com dado editado à mão) travaria a navegação inteira.
  for (let i = 0; atual && i < 8; i++) {
    caminho.unshift(atual)
    atual = atual.paiId ? porId.get(String(atual.paiId)) || null : null
  }
  return caminho
}

/** Todos os descendentes de um nó, incluindo ele. Alimenta filtros por ramo. */
export function idsDoRamo(nos: NoDeEnsino[], noId: string): string[] {
  const filhosPorPai = new Map<string, string[]>()
  for (const no of nos) {
    const pai = no.paiId ? String(no.paiId) : '__raiz__'
    const lista = filhosPorPai.get(pai) || []
    lista.push(String(no._id))
    filhosPorPai.set(pai, lista)
  }

  const saida: string[] = []
  const fila = [String(noId)]
  const vistos = new Set<string>()
  while (fila.length > 0) {
    const atual = fila.shift() as string
    if (vistos.has(atual)) continue
    vistos.add(atual)
    saida.push(atual)
    fila.push(...(filhosPorPai.get(atual) || []))
  }
  return saida
}

/**
 * Achata a árvore para um `<select>`, com recuo no rótulo.
 *
 * Um seletor de pai precisa mostrar hierarquia; sem o recuo, "Fisiologia"
 * aparece três vezes na lista sem nada que diga qual é qual.
 */
export function achatarParaSelecao(
  ramos: RamoDeEnsino[],
  profundidade = 0,
): Array<{ id: string; rotulo: string; nivel: NivelDeEnsino; profundidade: number }> {
  const saida: Array<{ id: string; rotulo: string; nivel: NivelDeEnsino; profundidade: number }> = []
  for (const ramo of ramos) {
    saida.push({
      id: ramo._id,
      rotulo: `${'— '.repeat(profundidade)}${ramo.nome}`,
      nivel: ramo.nivel,
      profundidade,
    })
    saida.push(...achatarParaSelecao(ramo.filhos, profundidade + 1))
  }
  return saida
}

/** Poda os ramos sem nenhuma aula abaixo — a navegação do aluno (§14). */
export function podarVazios(ramos: RamoDeEnsino[]): RamoDeEnsino[] {
  return ramos
    .filter((r) => r.aulasNaArvore > 0 && !r.oculto)
    .map((r) => ({ ...r, filhos: podarVazios(r.filhos) }))
}

/* =================== CAPAS =================== */

/**
 * A capa de um nó, saneada para gravação.
 *
 * Guarda só `imagem` e `cor`, e devolve `null` quando não sobra nenhuma das
 * duas — um `{}` gravado no lugar de nada faria `herdarCapas` achar que o nó
 * tem capa própria e parar de emprestar a das aulas, que é justamente o que dá
 * ilustração ao acervo sem trabalho de cadastro.
 */
export function normalizarCapa(bruta: unknown): { imagem?: string; cor?: string } | null {
  if (!bruta || typeof bruta !== 'object') return null
  const entrada = bruta as { imagem?: unknown; cor?: unknown }
  const imagem = typeof entrada.imagem === 'string' ? entrada.imagem.trim().slice(0, 600) : ''
  const cor = typeof entrada.cor === 'string' ? entrada.cor.trim().slice(0, 32) : ''
  if (!imagem && !cor) return null
  return { ...(imagem ? { imagem } : {}), ...(cor ? { cor } : {}) }
}

/**
 * A capa que cada nó empresta das próprias aulas.
 *
 * Recebe as aulas já projetadas (`{ _id, capa, ensino }`) e devolve, para cada
 * nó, a primeira capa COM IMAGEM encontrada nele. A ordem da lista decide o
 * desempate — as rotas mandam as aulas ordenadas por criação, então o nó tende
 * a herdar a capa da aula mais recente, que é a que tem mais chance de existir.
 *
 * A aula empresta a capa a TODOS os níveis que ela declara, não só ao mais
 * fundo: uma aula de "Fisiologia Cardíaca" ilustra o subtópico, mas também
 * serve de capa provisória para "Cardiologia" e para o "Ciclo Básico" enquanto
 * ninguém cadastrar a deles. É o oposto de `contarAulasPorNo`, que conta só no
 * nó mais específico de propósito — lá o número dobraria; aqui não há nada para
 * dobrar, e o nível de cima é justamente o que fica sem ilustração.
 */
export function capasPorNo(
  aulas: Array<{ capa?: { imagem?: string; cor?: string } | null; ensino?: any }>,
): Map<string, { imagem?: string; cor?: string }> {
  const saida = new Map<string, { imagem?: string; cor?: string }>()

  for (const aula of aulas) {
    const imagem = aula.capa?.imagem
    if (!imagem) continue
    const e = aula.ensino
    if (!e) continue

    for (const nivel of [e.areaId, e.moduloId, e.topicoId, e.subtopicoId]) {
      if (!nivel) continue
      const chave = String(nivel)
      if (!saida.has(chave)) saida.set(chave, { imagem, cor: aula.capa?.cor })
    }
  }

  return saida
}

/**
 * Preenche a capa de cada ramo, na ordem em que ela deve ser respeitada.
 *
 *   1. a capa cadastrada no próprio nó — curadoria explícita ganha de tudo;
 *   2. a capa emprestada de uma aula daquele nó (`capasPorNo`);
 *   3. a capa já resolvida de um filho — assim um Módulo recém-criado, ainda
 *      sem aulas diretas, mostra a ilustração do primeiro Tópico dentro dele
 *      em vez de um retângulo cinza.
 *
 * Trabalha de baixo para cima e devolve ramos NOVOS: a árvore que entra aqui
 * costuma vir de `montarArvore` e é reusada por outras respostas na mesma
 * requisição.
 */
export function herdarCapas(
  ramos: RamoDeEnsino[],
  emprestadas: Map<string, { imagem?: string; cor?: string }>,
): RamoDeEnsino[] {
  return ramos.map((ramo) => {
    const filhos = herdarCapas(ramo.filhos || [], emprestadas)

    const propria = ramo.capa?.imagem ? ramo.capa : null
    const doAcervo = emprestadas.get(String(ramo._id)) || null
    const doFilho = filhos.find((f) => f.capa?.imagem)?.capa || null

    // O último degrau nunca é `null`. Sem cor, quarenta assuntos cairiam no
    // mesmo cinza translúcido — que é o problema do retângulo vazio com outra
    // roupa. `corDoNo` garante um tom estável e distinto para cada um.
    const capa =
      propria ||
      doAcervo ||
      doFilho || { cor: ramo.capa?.cor || ramo.cor || corDoNo(ramo.slug || String(ramo._id)) }

    return { ...ramo, filhos, capa }
  })
}

/**
 * A cor de um nó quando ninguém escolheu uma.
 *
 * Um acervo sem capa nenhuma cairia em quarenta cartões do mesmo verde
 * translúcido — que é o mesmo problema do retângulo cinza, com outra cor. O
 * matiz sai do slug, então ele é ESTÁVEL: "cardiologia" recebe o mesmo tom
 * hoje e no ano que vem, em qualquer tela, e o aluno passa a reconhecer o
 * assunto pelo tom antes de ler o nome.
 *
 * A faixa é estreita de propósito (140°–210°: verdes, verde-azulados e teais,
 * mais o âmbar da marca em 38°). Matiz livre daria um arco-íris e a área
 * perderia a identidade — que é exatamente o que o pedido de "não deixar
 * infantil" quer evitar.
 */
export function corDoNo(slug: string): string {
  let soma = 0
  for (let i = 0; i < slug.length; i++) soma = (soma * 31 + slug.charCodeAt(i)) % 100000

  // Uma em cada quatro cai no âmbar da marca; as outras percorrem o verde.
  if (soma % 4 === 0) return `hsl(${38 + (soma % 10)} 62% 46%)`
  return `hsl(${140 + (soma % 70)} ${34 + (soma % 14)}% ${30 + (soma % 12)}%)`
}
