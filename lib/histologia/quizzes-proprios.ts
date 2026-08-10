import type { Midia, Overlay, Pagina, Questao, Quiz } from './esquemas.ts'
import { chaveDeBusca, embaralharComSemente, semented } from './texto.ts'
import { dossieDaEstrutura } from './dossies.ts'

/**
 * Quizzes de identificação escritos pela edição, a partir das lâminas.
 *
 * ## Por que existem
 *
 * O acervo traz 19 quizzes, 388 questões, agrupados por grandes assuntos —
 * "Sistema Digestório" inteiro num quiz só. Mas o atlas tem 1.318 lâminas com
 * 7.371 estruturas marcadas, e cada marcação é, em si, uma questão de
 * identificação pronta: existe uma imagem, existe uma camada apontando um
 * ponto do corte, e existe o nome do que está ali. O que faltava era formular
 * a pergunta.
 *
 * Estes quizzes fazem isso por **tema** (o terceiro nível do currículo:
 * Retina, Corpúsculo renal, Meiose, Nervo periférico), a granularidade em que
 * alguém de fato estuda na véspera de uma prática.
 *
 * ## O que é nosso e o que é do acervo
 *
 * Do acervo: a fotomicrografia, a camada de marcação e o nome da estrutura.
 * Nosso: a formulação da pergunta, a escolha dos distratores e a devolutiva.
 * Nada aqui inventa fato histológico — quando a devolutiva explica alguma
 * coisa, o texto vem do dossiê escrito à mão (`dossies.ts`) ou da explicação
 * do próprio acervo, marcada como ainda em inglês. Onde não há nem um nem
 * outro, a devolutiva se limita a confirmar a resposta.
 *
 * ## A parte difícil: o distrator
 *
 * Numa questão de identificação, o que decide se ela é justa não é a resposta
 * certa — é a errada. "A camada aponta uma arteríola" com "Vaso sanguíneo"
 * entre as alternativas é uma questão sem resposta única, porque uma arteríola
 * *é* um vaso sanguíneo. O aluno que sabe mais erra mais, que é o pior defeito
 * possível numa avaliação.
 *
 * `saoAmbiguos` existe inteiramente para isso, e é deliberadamente
 * conservador: perde distratores bons para não deixar passar um distrator
 * defensável. Quando não sobram três limpos, a questão simplesmente não nasce.
 *
 * ## Determinismo
 *
 * Tudo é semeado pelo slug do tema. O mesmo acervo produz sempre exatamente os
 * mesmos quizzes — condição para os arquivos versionados serem reproduzíveis e
 * para a conciliação do pipeline significar alguma coisa.
 */

/* ────────────────────────── regras editoriais ────────────────────────── */

export const REGRAS = {
  /** Questões que um quiz de tema tenta ter. */
  questoesPorQuiz: 12,
  /** Abaixo disto o tema não vira quiz: não dá sessão de estudo. */
  minimoDeQuestoes: 6,
  alternativasPorQuestao: 4,
  /**
   * Vocabulário mínimo do tema. Com menos de oito estruturas distintas não há
   * de onde tirar distratores sem repetir as mesmas quatro opções em todas as
   * questões — e aí o quiz vira memorização da lista, não reconhecimento.
   */
  minimoDeRotulosNoTema: 8,
  minimoDeLaminasNoTema: 4,
  /** Duas questões por lâmina, no máximo, e só depois de esgotar as lâminas. */
  maximoDeQuestoesPorLamina: 2,
  /**
   * 70%, contra os 50% herdados do acervo. Identificar estrutura marcada é
   * reconhecimento assistido — a camada já diz onde olhar. Passar com metade
   * daria ao aluno uma confiança que a bancada desmentiria.
   */
  percentualAprovacao: 70,
} as const

const ENUNCIADO = 'Que estrutura está marcada nesta lâmina?'

/**
 * Textos alternativos das imagens da questão.
 *
 * O `alt` que as imagens carregam nas páginas do atlas **entrega a resposta** —
 * o da camada é literalmente "Camada de marcação destacando Pele em Eyelid".
 * Reaproveitá-lo aqui anularia o exercício para quem usa leitor de tela e o
 * entregaria de bandeja a quem abrisse o inspetor. Estes dois substituem
 * aqueles, e é `__tests__/histologia/quizzes-proprios.test.ts` que trava a
 * substituição.
 */
const ALT_DA_LAMINA =
  'Fotomicrografia da lâmina desta questão. A descrição detalhada revelaria a resposta.'
const ALT_DA_CAMADA =
  'Camada de marcação sobreposta à lâmina, apontando a estrutura que a questão pede.'

/* ────────────────────────── vocabulário ────────────────────────── */

/**
 * Camadas que existem, mas não nomeiam uma estrutura.
 *
 * Três famílias, todas legítimas no atlas e todas impossíveis de perguntar:
 *
 * - **sem nome** — trinta e poucas camadas chegam rotuladas como "Marcador 7",
 *   porque o acervo numerou a seta e nunca disse o que ela aponta;
 * - **anotação de diagrama** — "Plano de corte 2", "Sentido do fluxo biliar",
 *   "Dias 14 a 26" marcam eixos e etapas em esquemas, não estruturas no corte;
 * - **legenda de método** — "Coloração pela eosina", "Área mostrada na imagem
 *   seguinte", "Detalhe (maior aumento)" falam sobre a imagem, não sobre o
 *   tecido.
 *
 * Os padrões são presos ao início do rótulo de propósito: "Barra terminal" e
 * "Área cribosa" são estruturas de verdade e precisam continuar entrando.
 */
const ROTULOS_NAO_ESTRUTURAIS = [
  /^marcador \d+$/i,
  /^plano de corte/i,
  /^corte (longitudinal|transversal|oblíquo|tangencial)/i,
  /^(área|area|região|regiao) (ampliada|mostrada)/i,
  /^sentido do fluxo/i,
  /^dias? \d/i,
  /^coloração(\s|$)/i,
  /^localização d/i,
  /^detalhe(\s|\()/i,
  /^(fotomicrografia|aumento)$/i,
]

/**
 * Chave de comparação entre nomes de estrutura.
 *
 * Além de tirar acento e caixa, faz duas coisas que a chave de busca comum não
 * faz, e que aqui são decisivas:
 *
 * - **corta o parêntese explicativo**, para que "Retículo endoplasmático rugoso
 *   (RER)" e "Retículo endoplasmático rugoso" sejam o mesmo nome;
 * - **aproxima o plural do singular**, para que "Núcleo" e "Núcleos" — que o
 *   acervo usa como rótulos distintos em 146 camadas — não acabem como
 *   alternativas rivais na mesma questão.
 *
 * A singularização segue as quatro formas de plural que aparecem no
 * vocabulário do acervo, e só elas — não é um lematizador, é o suficiente para
 * "capilares"/"capilar", "feixes"/"feixe", "canais"/"canal" e
 * "regiões"/"região" caírem na mesma chave.
 */
export function chaveDeEstrutura(rotulo: string): string {
  const semParenteses = rotulo.replace(/\([^)]*\)/g, ' ')
  return chaveDeBusca(semParenteses).split(' ').filter(Boolean).map(singular).join(' ')
}

function singular(palavra: string): string {
  if (palavra.length <= 3 || !palavra.endsWith('s')) return palavra
  // "regiões" → "regiao"; o acento já caiu na chave de busca.
  if (palavra.endsWith('oes')) return `${palavra.slice(0, -3)}ao`
  // "canais" → "canal", "papéis" → "papel".
  const finalEmL = /(a|e|o|u)is$/.exec(palavra)
  if (finalEmL) return `${palavra.slice(0, -2)}l`
  // "capilares" → "capilar": só quando a consoante antes do "es" admite esse
  // plural. "feixes" tem "x" antes e é plural de "feixe", não de "feix".
  if (palavra.length > 4 && palavra.endsWith('es') && /[rzls]/.test(palavra[palavra.length - 3])) {
    return palavra.slice(0, -2)
  }
  return palavra.slice(0, -1)
}

/**
 * Categorias que engolem estruturas mais específicas.
 *
 * A regra de tokens (abaixo) já resolve o caso em que um nome contém o outro —
 * "Epitélio" contra "Epitélio simples cúbico". O que ela não vê é o
 * hiperônimo com nome próprio: uma arteríola é um vaso sanguíneo sem que as
 * palavras tenham nada em comum.
 *
 * A lista é editorial, mapeia **categoria → membros** e é assimétrica de
 * propósito: "Artéria" e "Veia" continuam sendo ótimos distratores uma da
 * outra; o que não pode é "Vaso sanguíneo" aparecer ao lado de qualquer uma
 * das duas. Faltando um par aqui, o defeito é uma questão com duas respostas
 * defensáveis — então, na dúvida, acrescente.
 */
const CATEGORIAS_QUE_ENGLOBAM: Record<string, string[]> = {
  'vaso': ['capilar', 'arteriola', 'venula', 'arteria', 'veia', 'sinusoide', 'vaso sanguineo'],
  'vaso sanguineo': ['capilar', 'arteriola', 'venula', 'arteria', 'veia', 'sinusoide', 'vaso'],
  'vaso linfatico': ['capilar linfatico'],
  'epitelio': ['endotelio', 'mesotelio', 'urotelio'],
  'tecido conjuntivo': ['lamina propria', 'estroma', 'derme', 'submucosa'],
  'mucosa': ['epitelio', 'lamina propria'],
  'matriz': ['fibra colagena', 'fibra elastica', 'substancia fundamental', 'matriz extracelular'],
  'matriz extracelular': ['fibra colagena', 'fibra elastica', 'substancia fundamental', 'matriz'],
  'leucocito': ['neutrofilo', 'eosinofilo', 'basofilo', 'linfocito', 'monocito', 'granulocito'],
  'granulocito': ['neutrofilo', 'eosinofilo', 'basofilo'],
  'tecido linfoide': ['nodulo linfoide', 'foliculo linfoide', 'linfocito'],
  'nervo': ['fibra nervosa', 'axonio'],
  'fibra nervosa': ['axonio'],
  'musculo liso': ['celula muscular lisa', 'fibra muscular lisa'],
  'musculo estriado esqueletico': ['fibra muscular esqueletica'],
  'glandula': ['acino', 'adenomero'],
  // "sistema de haver" não é erro de digitação: a singularização também corta
  // o "s" de Havers, e as chaves aqui têm de estar na forma que ela produz.
  'osso': ['osteona', 'sistema de haver'],
  'organela': ['mitocondria', 'lisossomo', 'complexo de golgi', 'reticulo endoplasmatico'],
}

/**
 * Nomes diferentes para a mesma coisa.
 *
 * O acervo rotula com a mão de vários autores: o mesmo processo do podócito é
 * "Podocyte primary process" numa lâmina e "Primary process" na seguinte, e o
 * plural e o parêntese — que a chave já resolve — não dão conta desses. Cada
 * grupo aqui declara nomes intercambiáveis; dois membros do mesmo grupo nunca
 * disputam a mesma questão.
 *
 * A lista sai de varredura do vocabulário, não de intuição: pares de rótulos do
 * mesmo tema com sobreposição alta de tokens, conferidos um a um.
 */
const SINONIMOS: string[][] = [
  ['feixe de colageno', 'feixe de fibra colagena'],
  ['prolongamento primario do podocito', 'processo primario'],
  ['bainha de mielina', 'lamela de mielina', 'mielina compacta'],
  ['medula ossea vermelha', 'tecido da medula ossea'],
  ['area cribosa', 'area crivosa'],
  ['membrana basal', 'lamina basal'],
]

const GRUPO_DE_SINONIMOS = new Map<string, number>()
SINONIMOS.forEach((grupo, indice) => {
  for (const nome of grupo) GRUPO_DE_SINONIMOS.set(nome, indice)
})

/**
 * Todas as chaves declaradas nas duas tabelas.
 *
 * Existe para o teste: uma entrada escrita fora da forma normalizada nunca
 * casa com nada e falha em silêncio — a tabela parece certa e não protege
 * questão nenhuma.
 */
export const CHAVES_DAS_TABELAS: string[] = [
  ...Object.entries(CATEGORIAS_QUE_ENGLOBAM).flatMap(([categoria, membros]) => [
    categoria,
    ...membros,
  ]),
  ...SINONIMOS.flat(),
]

/**
 * Os dois nomes podem coexistir como alternativas da mesma questão?
 *
 * Rejeita quando são o mesmo nome, quando um está contido no outro (todos os
 * tokens de um aparecem no outro), quando a tabela editorial declara que um
 * engloba o outro e quando os dois estão no mesmo grupo de sinônimos.
 */
export function saoAmbiguos(a: string, b: string): boolean {
  const chaveA = chaveDeEstrutura(a)
  const chaveB = chaveDeEstrutura(b)
  if (!chaveA || !chaveB) return true
  if (chaveA === chaveB) return true

  const tokensA = new Set(chaveA.split(' '))
  const tokensB = new Set(chaveB.split(' '))
  const contido = (menor: Set<string>, maior: Set<string>) =>
    [...menor].every((t) => maior.has(t))
  if (contido(tokensA, tokensB) || contido(tokensB, tokensA)) return true

  if (CATEGORIAS_QUE_ENGLOBAM[chaveA]?.includes(chaveB)) return true
  if (CATEGORIAS_QUE_ENGLOBAM[chaveB]?.includes(chaveA)) return true

  const grupoA = GRUPO_DE_SINONIMOS.get(chaveA)
  if (grupoA !== undefined && grupoA === GRUPO_DE_SINONIMOS.get(chaveB)) return true

  return false
}

/**
 * A camada serve de questão?
 *
 * Precisa nomear uma estrutura, estar em português e ter imagem própria. A
 * exigência de tradução não é estética: com a resposta certa em português e os
 * distratores em inglês, a língua entrega o gabarito sem que o aluno olhe para
 * a lâmina.
 */
function utilizavel(overlay: Overlay): boolean {
  if (overlay.classe !== 'estrutura') return false
  if (!overlay.traduzido) return false
  if (ROTULOS_NAO_ESTRUTURAIS.some((padrao) => padrao.test(overlay.rotulo))) return false
  if (chaveDeEstrutura(overlay.rotulo).length < 3) return false
  return Boolean(overlay.midia?.sha256)
}

/* ────────────────────────── agrupamento ────────────────────────── */

interface Tema {
  /** Caminho do nó do tema, ex.: `orgaos-e-sistemas/olho/retina`. */
  caminho: string[]
  titulo: string
  trilha: string
  setor: string
  laminas: Pagina[]
}

/**
 * O nó que agrupa esta lâmina.
 *
 * Nem todo setor tem três níveis — "Corantes" pendura as lâminas direto no
 * subsetor. `min(3, caminho - 1)` resolve os dois casos sem tabela de exceção:
 * o tema é sempre o nó imediatamente acima da lâmina, até o terceiro nível.
 */
export function caminhoDoTema(caminhoDaLamina: string[]): string[] | null {
  const nivel = Math.min(3, caminhoDaLamina.length - 1)
  if (nivel < 2) return null
  return caminhoDaLamina.slice(0, nivel)
}

/**
 * Slug do quiz de um tema.
 *
 * Nasce do caminho, não do título: "Visão Geral" é o nome de cinco temas
 * diferentes, e slugs desambiguados por sufixo (`visao-geral-3`) não dizem nada
 * a quem lê a URL. `laminas-tecido-nervoso-visao-geral` diz.
 *
 * O prefixo também garante que nenhum quiz próprio colida com os 19 do acervo,
 * que ocupam slugs simples como `osso` e `pele`.
 */
export function slugDoTema(caminhoDaLamina: string[]): string | null {
  const caminho = caminhoDoTema(caminhoDaLamina)
  if (!caminho) return null
  return `laminas-${caminho.slice(1).join('-')}`
}

/** Agrupa as lâminas por tema, preservando a ordem do catálogo. */
function agruparPorTema(paginas: Pagina[]): Map<string, Tema> {
  const temas = new Map<string, Tema>()

  for (const pagina of paginas) {
    if (pagina.tipo !== 'lamina' || !pagina.base) continue
    const caminho = caminhoDoTema(pagina.caminho)
    if (!caminho) continue
    const nivel = caminho.length
    const chave = caminho.join('/')

    let tema = temas.get(chave)
    if (!tema) {
      tema = {
        caminho,
        titulo: pagina.trilha[nivel - 1]?.titulo ?? caminho[caminho.length - 1],
        trilha: pagina.trilha
          .slice(0, nivel)
          .map((t) => t.titulo)
          .join(' › '),
        setor: pagina.caminho[0],
        laminas: [],
      }
      temas.set(chave, tema)
    }
    tema.laminas.push(pagina)
  }

  return temas
}

/* ────────────────────────── montagem das questões ────────────────────────── */

interface Candidata {
  pagina: Pagina
  overlay: Overlay
  temDossie: boolean
}

/** Copia a mídia trocando o texto alternativo por um que não entrega a resposta. */
function midiaAnonima(midia: Midia, alt: string): Midia {
  return { ...midia, alt }
}

function devolutivaCorreta(overlay: Overlay): {
  feedback: string
  feedbackOriginal?: string
  feedbackPendente?: boolean
} {
  const dossie = dossieDaEstrutura(overlay.rotuloOriginal)
  if (dossie?.comoReconhecer) {
    return { feedback: `Correto. ${dossie.comoReconhecer}` }
  }
  if (dossie?.funcao) {
    return { feedback: `Correto. ${dossie.funcao}` }
  }
  /*
   * Sem dossiê escrito, a explicação do acervo é o melhor que existe — e ela
   * está em inglês. Vai marcada como pendente, exatamente como no restante do
   * módulo: o aluno vê a tarja e sabe que aquele texto ainda não passou por
   * tradução revisada. O que não fazemos é traduzir na hora e apresentar o
   * resultado como se fosse revisado.
   */
  if (overlay.explicacaoOriginal) {
    return {
      feedback: `Correto. ${overlay.explicacaoOriginal}`,
      feedbackOriginal: overlay.explicacaoOriginal,
      feedbackPendente: true,
    }
  }
  return { feedback: 'Correto. É esta a estrutura que a camada do acervo marca nesta lâmina.' }
}

function devolutivaErrada(rotulo: string, naMesmaLamina: boolean): string {
  if (naMesmaLamina) {
    return (
      `Não é essa. ${rotulo} também está marcada nesta lâmina, em outra camada — ` +
      'vale abrir as duas no microscópio e comparar onde cada uma cai.'
    )
  }
  return 'Não é essa. A camada aponta outra estrutura desta lâmina.'
}

/**
 * Escolhe os distratores de uma questão.
 *
 * A ordem de preferência é pedagógica: primeiro estruturas marcadas **na
 * própria lâmina**, porque aí o acervo já afirmou que são coisas distintas e o
 * aluno tem de olhar para o ponto marcado em vez de eliminar pelo contexto;
 * depois o resto do vocabulário do tema.
 *
 * Devolve menos de três quando não há candidatos limpos — e a questão é
 * descartada por quem chamou.
 */
function escolherDistratores(
  candidata: Candidata,
  vocabularioDoTema: string[],
  semente: number,
): Array<{ rotulo: string; naMesmaLamina: boolean }> {
  const correta = candidata.overlay.rotulo

  const daLamina = candidata.pagina.overlays
    .filter((o) => utilizavel(o) && o.id !== candidata.overlay.id)
    .map((o) => o.rotulo)

  const chavesDaLamina = new Set(daLamina.map(chaveDeEstrutura))
  const doTema = vocabularioDoTema.filter((r) => !chavesDaLamina.has(chaveDeEstrutura(r)))

  const ordenados = [
    ...embaralharComSemente(unicos(daLamina), semente).map((rotulo) => ({
      rotulo,
      naMesmaLamina: true,
    })),
    ...embaralharComSemente(unicos(doTema), semente + 1).map((rotulo) => ({
      rotulo,
      naMesmaLamina: false,
    })),
  ]

  const escolhidos: Array<{ rotulo: string; naMesmaLamina: boolean }> = []
  for (const candidato of ordenados) {
    if (escolhidos.length === REGRAS.alternativasPorQuestao - 1) break
    if (saoAmbiguos(candidato.rotulo, correta)) continue
    if (escolhidos.some((e) => saoAmbiguos(e.rotulo, candidato.rotulo))) continue
    escolhidos.push(candidato)
  }
  return escolhidos
}

function unicos(rotulos: string[]): string[] {
  const vistos = new Set<string>()
  const saida: string[] = []
  for (const rotulo of rotulos) {
    const chave = chaveDeEstrutura(rotulo)
    if (vistos.has(chave)) continue
    vistos.add(chave)
    saida.push(rotulo)
  }
  return saida
}

function montarQuestao(
  candidata: Candidata,
  distratores: Array<{ rotulo: string; naMesmaLamina: boolean }>,
  numero: number,
  semente: number,
): Questao {
  const { overlay, pagina } = candidata

  const alternativas = embaralharComSemente(
    [
      { texto: overlay.rotulo, correta: true, ...devolutivaCorreta(overlay) },
      ...distratores.map((d) => ({
        texto: d.rotulo,
        correta: false,
        feedback: devolutivaErrada(d.rotulo, d.naMesmaLamina),
      })),
    ],
    semente,
  ).map((alternativa, i) => ({ id: `a${i + 1}`, ...alternativa }))

  return {
    id: `q${numero}`,
    numero,
    enunciado: ENUNCIADO,
    // Não há original: o enunciado nasceu em português. Repeti-lo aqui mantém
    // o contrato do schema sem inventar uma versão em inglês que não existe.
    enunciadoOriginal: ENUNCIADO,
    midia: midiaAnonima(pagina.base!, ALT_DA_LAMINA),
    camada: midiaAnonima(overlay.midia, ALT_DA_CAMADA),
    lamina: {
      rota: pagina.caminho.join('/'),
      titulo: pagina.titulo,
      estruturaId: overlay.id,
    },
    alternativas,
    multipla: false,
  }
}

/* ────────────────────────── geração ────────────────────────── */

export interface OpcoesDeGeracao {
  /** Data ISO de acesso ao acervo, herdada do pipeline. */
  acessadoEm: string
}

/**
 * Gera um quiz por tema do currículo que tenha lastro para sustentá-lo.
 *
 * O tema entra na fila de seleção com todas as suas camadas utilizáveis; a
 * seleção prioriza estruturas com dossiê escrito (são as que rendem devolutiva
 * de verdade) e espalha as questões pelo maior número possível de lâminas
 * antes de aceitar uma segunda questão da mesma imagem.
 */
export function gerarQuizzesProprios(paginas: Pagina[], opcoes: OpcoesDeGeracao): Quiz[] {
  const temas = [...agruparPorTema(paginas).entries()].sort(([a], [b]) => (a < b ? -1 : 1))
  const quizzes: Quiz[] = []
  const slugsUsados = new Set<string>()

  for (const [chave, tema] of temas) {
    const semente = semented(`quiz-proprio::${chave}`)

    const candidatas: Candidata[] = []
    for (const pagina of tema.laminas) {
      for (const overlay of pagina.overlays) {
        if (!utilizavel(overlay)) continue
        candidatas.push({
          pagina,
          overlay,
          temDossie: Boolean(dossieDaEstrutura(overlay.rotuloOriginal)),
        })
      }
    }

    const vocabulario = unicos(candidatas.map((c) => c.overlay.rotulo))
    if (vocabulario.length < REGRAS.minimoDeRotulosNoTema) continue
    if (tema.laminas.length < REGRAS.minimoDeLaminasNoTema) continue

    /*
     * Embaralha primeiro, ordena depois: `Array.prototype.sort` é estável, então
     * o embaralhamento define a ordem *dentro* de cada prioridade e a
     * prioridade decide entre elas. Ordenar direto pelo dossiê deixaria sempre
     * as mesmas estruturas famosas no topo de todo quiz.
     */
    const fila = embaralharComSemente(candidatas, semente).sort(
      (a, b) => Number(b.temDossie) - Number(a.temDossie),
    )

    const questoes: Questao[] = []
    const porLamina = new Map<string, number>()
    const rotulosUsados = new Set<string>()

    for (let limite = 1; limite <= REGRAS.maximoDeQuestoesPorLamina; limite++) {
      for (const candidata of fila) {
        if (questoes.length >= REGRAS.questoesPorQuiz) break
        const rota = candidata.pagina.caminho.join('/')
        if ((porLamina.get(rota) ?? 0) >= limite) continue
        const chaveDoRotulo = chaveDeEstrutura(candidata.overlay.rotulo)
        if (rotulosUsados.has(chaveDoRotulo)) continue

        const sementeDaQuestao = semente + questoes.length * 7919
        const distratores = escolherDistratores(candidata, vocabulario, sementeDaQuestao)
        if (distratores.length < REGRAS.alternativasPorQuestao - 1) continue

        questoes.push(
          montarQuestao(candidata, distratores, questoes.length + 1, sementeDaQuestao + 13),
        )
        porLamina.set(rota, (porLamina.get(rota) ?? 0) + 1)
        rotulosUsados.add(chaveDoRotulo)
      }
      if (questoes.length >= REGRAS.questoesPorQuiz) break
    }

    if (questoes.length < REGRAS.minimoDeQuestoes) continue

    const slug = `laminas-${tema.caminho.slice(1).join('-')}`
    if (slugsUsados.has(slug)) {
      // Falhar aqui é melhor que sobrescrever em silêncio: dois temas com o
      // mesmo caminho seriam um defeito do currículo, não deste gerador.
      throw new Error(`Slug de quiz próprio duplicado: ${slug}`)
    }
    slugsUsados.add(slug)

    quizzes.push({
      slug,
      titulo: tema.titulo,
      // Não existe título original: o quiz é nosso. Deixar vazio é o que a
      // interface lê para não anunciar uma origem que não há.
      tituloOriginal: '',
      idOrigem: 0,
      idH5p: '',
      autoria: 'proprio',
      questoes,
      proveniencia: {
        // As imagens e as marcações são do acervo; a URL aponta para ele. O
        // arquivo de origem é o gerador, porque é ele que audita estas
        // questões — não há arquivo do acervo que as contenha.
        urlOrigem: 'https://digitalhistology.org/',
        acessadoEm: opcoes.acessadoEm,
        idOrigem: 0,
        arquivoOrigem: 'lib/histologia/quizzes-proprios.ts',
        licenca: 'CC BY-NC-SA 4.0',
      },
      revisao: { estado: 'pendente-de-revisao', historico: [] },
      percentualAprovacao: REGRAS.percentualAprovacao,
    })
  }

  return quizzes
}

/** Resumo de um quiz próprio para o índice, com o contexto curricular. */
export interface ResumoDeQuizProprio {
  slug: string
  titulo: string
  trilha: string
  setor: string
  questoes: number
  comImagem: number
  laminas: number
}

export function resumirQuizzesProprios(
  quizzes: Quiz[],
  paginas: Pagina[],
): ResumoDeQuizProprio[] {
  const temas = agruparPorTema(paginas)
  const porSlug = new Map<string, Tema>()
  for (const [, tema] of temas) {
    const slug = slugDoTema([...tema.caminho, 'lamina'])
    if (slug) porSlug.set(slug, tema)
  }

  return quizzes.map((quiz) => {
    const tema = porSlug.get(quiz.slug)
    return {
      slug: quiz.slug,
      titulo: quiz.titulo,
      trilha: tema?.trilha ?? quiz.titulo,
      setor: tema?.setor ?? '',
      questoes: quiz.questoes.length,
      comImagem: quiz.questoes.filter((q) => q.midia).length,
      laminas: new Set(quiz.questoes.map((q) => q.lamina?.rota)).size,
    }
  })
}
