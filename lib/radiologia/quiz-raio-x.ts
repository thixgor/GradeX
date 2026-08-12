import { NOTAS_ESTRUTURAS, notaDeFallback } from './estruturas'
import {
  ESTUDOS_RAIO_X,
  GUIAS_RAIO_X,
  REGIOES_RAIO_X,
  estudosDaRegiao,
  notaEstrutura,
  type EstruturaRaioX,
  type EstudoRaioX,
  type RegiaoRaioX,
} from './raio-x'
import { confusaoEntre, paresConfundiveis } from './quiz-confusoes'

/**
 * Banco de questões de identificação do Atlas de Raio-X.
 *
 * O atlas ensina no sentido fácil: você clica no nome e a estrutura acende. O
 * quiz inverte isso — a marcação já está acesa e o nome é o que falta. É a
 * única forma de saber se o aluno reconhece a estrutura ou se estava apenas
 * lendo a lista ao lado do filme.
 *
 * ## De onde vem cada pedaço da questão
 *
 * Nada aqui é conteúdo novo inventado para o quiz: o enunciado usa a própria
 * demarcação do atlas (`estrutura.sobreposicao`), as alternativas são outras
 * estruturas reais do acervo e a resposta comentada é montada a partir do
 * dossiê de `estruturas.ts`, do guia da região (`GUIAS_RAIO_X`) e da tabela de
 * confusões curadas (`quiz-confusoes.ts`). Corrigir um dossiê corrige o
 * comentário de todas as questões que dependem dele.
 *
 * ## Por que é determinístico
 *
 * As páginas são estáticas e o runner é um componente de cliente que também
 * renderiza no servidor. Sorteio com `Math.random` no meio da montagem daria
 * gabaritos diferentes no HTML e na hidratação. Aqui tudo — escolha de
 * distratores, ordem das alternativas, enunciado — sai de um hash do
 * identificador da questão. O embaralhamento do *round*, esse sim aleatório,
 * acontece no navegador, depois que o aluno aperta "começar".
 */

/* ────────────────────────────────── Tipos ────────────────────────────────── */

export interface AlternativaRaioX {
  /** Único dentro da questão; usado como chave de lista. */
  id: string
  nome: string
  original: string
}

/** Por que a alternativa errada era tentadora — e o que a separa da certa. */
export interface DescarteRaioX {
  nome: string
  texto: string
  /** `true` quando o texto veio da tabela curada de confusões. */
  curado: boolean
}

export interface ComentarioRaioX {
  /** Frase de veredito: o nome e o termo original. */
  gabarito: string
  oQueE: string
  comoIdentificar: string
  porQueImporta: string
  armadilha?: string
  /** Número de referência da região quando ele fala desta estrutura. */
  medida?: { rotulo: string; valor: string; nota: string }
  /** Pérola de alto rendimento da região, escolhida pela aderência ao tema. */
  perola: string
  descartes: DescarteRaioX[]
}

export interface QuestaoRaioX {
  id: string
  enunciado: string
  /** Contexto que o aluno precisa para responder: sem a incidência não há leitura. */
  contexto: {
    estudoId: string
    titulo: string
    incidencia: string
    regiao: RegiaoRaioX
    regiaoTitulo: string
    camada: string
  }
  imagem: string
  sobreposicao: string
  alternativas: AlternativaRaioX[]
  /** Índice da alternativa correta dentro de `alternativas`. */
  correta: number
  comentario: ComentarioRaioX
  /** Link para a mesma demarcação aberta no atlas. */
  atalho: string
}

export type TipoQuizRaioX = 'geral' | 'regiao' | 'estudo'

/** O que a tela de índice precisa saber — sem carregar as questões. */
export interface ResumoQuizRaioX {
  slug: string
  tipo: TipoQuizRaioX
  titulo: string
  subtitulo: string
  descricao: string
  capa: string
  total: number
  regiao?: RegiaoRaioX
  regiaoTitulo?: string
  incidencia?: string
}

export interface QuizRaioX extends ResumoQuizRaioX {
  questoes: QuestaoRaioX[]
}

/* ───────────────────────── Determinismo e normalização ───────────────────────── */

/** FNV-1a de 32 bits: barato, estável entre execuções e sem dependência. */
function semente(texto: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Gerador linear congruente — sequência reprodutível a partir da semente. */
function sorteador(valor: number): () => number {
  let estado = valor || 1
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0
    return estado / 0x100000000
  }
}

/** Fisher-Yates com sorteador injetado: mesma semente, mesma ordem. */
export function embaralhar<T>(itens: T[], proximo: () => number): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(proximo() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Chave que ignora número gramatical.
 *
 * "Escápula" e "Escápulas" são a mesma peça vista em contextos diferentes — no
 * perfil do tórax aparece uma, na PA aparecem as duas. Oferecer as duas formas
 * como alternativas seria uma pegadinha de português, não de radiologia.
 */
function chaveEstrutural(nome: string): string {
  return normalizar(nome)
    .split(' ')
    .map((palavra) =>
      palavra
        .replace(/(oes|aes)$/, 'ao')
        .replace(/([^aeiou])es$/, '$1')
        .replace(/s$/, ''),
    )
    .join(' ')
}

const IRRELEVANTES = new Set([
  'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas', 'com', 'para',
  'entre', 'sobre', 'the', 'of', 'ou',
])

function palavrasChave(texto: string): string[] {
  return normalizar(texto)
    .split(' ')
    .filter((palavra) => palavra.length >= 4 && !IRRELEVANTES.has(palavra))
    .map((palavra) => palavra.replace(/s$/, ''))
}

/** Primeira frase de um parágrafo — usada nos descartes automáticos. */
function primeiraFrase(texto: string): string {
  const corte = texto.search(/\.\s/)
  return corte === -1 ? texto : `${texto.slice(0, corte)}.`
}

/* ─────────────────────── Índice global de estruturas ─────────────────────── */

interface CandidataRaioX {
  nome: string
  original: string
  estudos: Set<string>
  regioes: Set<RegiaoRaioX>
}

const TITULO_DA_REGIAO = new Map<RegiaoRaioX, string>(
  REGIOES_RAIO_X.map((regiao) => [regiao.id, regiao.titulo]),
)

/**
 * Cada nome do acervo aparece uma única vez, com a lista de onde ele ocorre.
 *
 * "Corpos vertebrais" existe em cinco incidências e "Patela" em quatro. Sem
 * essa consolidação, um distrator poderia ser sorteado repetido — a mesma
 * estrutura oferecida duas vezes na mesma questão, com nomes idênticos.
 */
const CANDIDATAS = (() => {
  const mapa = new Map<string, CandidataRaioX>()
  for (const estudo of ESTUDOS_RAIO_X) {
    for (const estrutura of estudo.estruturas) {
      const chave = chaveEstrutural(estrutura.nome)
      const atual = mapa.get(chave)
      if (atual) {
        atual.estudos.add(estudo.id)
        atual.regioes.add(estudo.regiao)
        continue
      }
      mapa.set(chave, {
        nome: estrutura.nome,
        original: estrutura.original,
        estudos: new Set([estudo.id]),
        regioes: new Set([estudo.regiao]),
      })
    }
  }
  return mapa
})()

/* ──────────────────────────── Montagem da questão ──────────────────────────── */

const ENUNCIADOS = [
  'Qual estrutura está demarcada neste filme?',
  'A marcação sobre a radiografia corresponde a qual estrutura?',
  'Identifique a estrutura destacada nesta incidência.',
  'Sem consultar a legenda: que estrutura a demarcação acende?',
  'O que está pintado sobre este filme?',
]

const QUANTAS_ALTERNATIVAS = 4

/**
 * Escolhe os três distratores.
 *
 * A ordem de preferência é didática, não estética:
 *
 * 1. **Par curado de confusão.** Se a tabela diz que se confunde tubérculo
 *    maior com menor, o quiz oferece exatamente esse par — e o comentário
 *    devolve o discriminador escrito à mão.
 * 2. **Outra estrutura do mesmo filme.** O aluno tem de discriminar dentro da
 *    imagem que está vendo, e não eliminar por região.
 * 3. **Mesma região, outra incidência.** Mantém a plausibilidade quando o
 *    exame tem poucas demarcações.
 * 4. **Qualquer outra.** Só como preenchimento, para nunca faltar alternativa.
 */
function escolherDistratores(
  estudo: EstudoRaioX,
  correta: EstruturaRaioX,
  proximo: () => number,
): CandidataRaioX[] {
  const chaveCorreta = chaveEstrutural(correta.nome)
  const curados = new Set(paresConfundiveis(correta.nome).map(chaveEstrutural))
  const noFilme = new Set(estudo.estruturas.map((item) => chaveEstrutural(item.nome)))

  const pontuadas: { peso: number; ordem: number; candidata: CandidataRaioX }[] = []
  for (const [chave, candidata] of CANDIDATAS) {
    if (chave === chaveCorreta) continue
    let peso = 3
    if (curados.has(chave)) peso = 0
    else if (noFilme.has(chave)) peso = 1
    else if (candidata.regioes.has(estudo.regiao)) peso = 2
    pontuadas.push({ peso, ordem: proximo(), candidata })
  }

  pontuadas.sort((a, b) => a.peso - b.peso || a.ordem - b.ordem)
  return pontuadas.slice(0, QUANTAS_ALTERNATIVAS - 1).map((item) => item.candidata)
}

/** Número de referência da região que fala justamente desta estrutura. */
function medidaRelacionada(regiao: RegiaoRaioX, nome: string) {
  const termos = palavrasChave(nome)
  if (termos.length === 0) return undefined
  return GUIAS_RAIO_X[regiao].medidas.find((medida) => {
    const alvo = palavrasChave(`${medida.rotulo} ${medida.nota}`)
    return termos.some((termo) => alvo.includes(termo))
  })
}

/** Pérola da região — a que menciona a estrutura, ou uma estável por sorteio. */
function perolaRelacionada(regiao: RegiaoRaioX, nome: string, proximo: () => number): string {
  const perolas = GUIAS_RAIO_X[regiao].perolas
  const termos = palavrasChave(nome)
  const aderente = perolas.find((perola) => {
    const alvo = palavrasChave(perola)
    return termos.some((termo) => alvo.includes(termo))
  })
  return aderente ?? perolas[Math.floor(proximo() * perolas.length)] ?? perolas[0]
}

function montarDescarte(correta: string, errada: CandidataRaioX): DescarteRaioX {
  const curado = confusaoEntre(correta, errada.nome)
  if (curado) return { nome: errada.nome, texto: curado, curado: true }

  // Sem par curado, o dossiê da própria alternativa já responde "o que ela é e
  // onde ela estaria" — que é exatamente o que falta para descartá-la.
  const nota =
    NOTAS_ESTRUTURAS[errada.nome] ??
    notaDeFallback(errada.nome, TITULO_DA_REGIAO.get([...errada.regioes][0]) ?? 'a região')
  const ondeEsta = primeiraFrase(nota.identificar)
  return {
    nome: errada.nome,
    texto: `${nota.resumo} No filme: ${ondeEsta.charAt(0).toLowerCase()}${ondeEsta.slice(1)}`,
    curado: false,
  }
}

export function montarQuestao(estudo: EstudoRaioX, estrutura: EstruturaRaioX): QuestaoRaioX {
  const id = `${estudo.id}:${estrutura.slug}`
  const proximo = sorteador(semente(id))
  const nota = notaEstrutura(estudo, estrutura)

  const distratores = escolherDistratores(estudo, estrutura, proximo)
  const alternativas: AlternativaRaioX[] = embaralhar(
    [
      { id: estrutura.slug, nome: estrutura.nome, original: estrutura.original },
      ...distratores.map((candidata) => ({
        id: `d-${chaveEstrutural(candidata.nome).replace(/ /g, '-')}`,
        nome: candidata.nome,
        original: candidata.original,
      })),
    ],
    proximo,
  )

  return {
    id,
    enunciado: ENUNCIADOS[semente(`e:${id}`) % ENUNCIADOS.length],
    contexto: {
      estudoId: estudo.id,
      titulo: estudo.titulo,
      incidencia: estudo.incidencia,
      regiao: estudo.regiao,
      regiaoTitulo: estudo.regiaoTitulo,
      camada: estudo.camada,
    },
    imagem: estudo.imagem,
    sobreposicao: estrutura.sobreposicao,
    alternativas,
    correta: alternativas.findIndex((item) => item.nome === estrutura.nome),
    comentario: {
      gabarito: `${estrutura.nome} — no original, ${estrutura.original}.`,
      oQueE: nota.resumo,
      comoIdentificar: nota.identificar,
      porQueImporta: nota.clinica,
      armadilha: nota.alerta,
      medida: medidaRelacionada(estudo.regiao, estrutura.nome),
      perola: perolaRelacionada(estudo.regiao, estrutura.nome, proximo),
      descartes: distratores.map((candidata) => montarDescarte(estrutura.nome, candidata)),
    },
    atalho: `/manual-clinico/radiologia/raio-x/${estudo.id}?estrutura=${estrutura.slug}`,
  }
}

export function questoesDoEstudo(estudo: EstudoRaioX): QuestaoRaioX[] {
  return estudo.estruturas.map((estrutura) => montarQuestao(estudo, estrutura))
}

/* ──────────────────────────── Catálogo de quizzes ──────────────────────────── */

/** Teto do simulado geral: o suficiente para varrer o atlas sem inchar a página. */
const TETO_GERAL = 60

/**
 * Simulado geral: uma volta pelo atlas inteiro, equilibrada por região.
 *
 * A montagem é em rodízio — uma questão de cada incidência por passada — em vez
 * de "as 60 primeiras". Sem isso, tórax e mão, que têm mais demarcações,
 * comeriam a prova inteira e o aluno terminaria sem ver pelve nem coluna.
 * Nomes repetidos (patela aparece em quatro incidências) entram uma vez só.
 */
function montarQuestoesGerais(): QuestaoRaioX[] {
  const filas = ESTUDOS_RAIO_X.map((estudo) =>
    embaralhar(questoesDoEstudo(estudo), sorteador(semente(`geral:${estudo.id}`))),
  )
  const escolhidas: QuestaoRaioX[] = []
  const nomesUsados = new Set<string>()

  for (let passada = 0; escolhidas.length < TETO_GERAL; passada += 1) {
    let sobrou = false
    for (const fila of filas) {
      if (passada >= fila.length) continue
      sobrou = true
      const questao = fila[passada]
      const nome = chaveEstrutural(questao.alternativas[questao.correta].nome)
      if (nomesUsados.has(nome)) continue
      nomesUsados.add(nome)
      escolhidas.push(questao)
      if (escolhidas.length >= TETO_GERAL) break
    }
    if (!sobrou) break
  }

  return escolhidas
}

/**
 * O simulado geral é montado uma vez e reaproveitado.
 *
 * Ele percorre as 221 demarcações do acervo para escolher 60 — trabalho que
 * não precisa acontecer de novo a cada página estática gerada, nem quando o
 * índice pergunta apenas quantas questões o simulado tem.
 */
let cacheGeral: QuestaoRaioX[] | null = null
function questoesGerais(): QuestaoRaioX[] {
  cacheGeral ??= montarQuestoesGerais()
  return cacheGeral
}

/** Regiões com mais de uma incidência: só nelas o quiz de região acrescenta algo. */
const REGIOES_COM_QUIZ = REGIOES_RAIO_X.filter((regiao) => regiao.totalEstudos > 1)

export const QUIZZES_RAIO_X: ResumoQuizRaioX[] = [
  {
    slug: 'geral',
    tipo: 'geral',
    titulo: 'Simulado geral do atlas',
    subtitulo: 'Todas as regiões',
    descricao:
      'Uma volta pelo acervo inteiro, com rodízio entre as 28 incidências: tórax, abdome, crânio, coluna, ombro, cotovelo, mão, pelve e membro inferior na mesma prova. É o modo mais honesto de descobrir qual região você ainda não reconhece sem a legenda ao lado.',
    capa: ESTUDOS_RAIO_X[0].imagem,
    total: questoesGerais().length,
  },
  ...REGIOES_COM_QUIZ.map<ResumoQuizRaioX>((regiao) => ({
    slug: regiao.id,
    tipo: 'regiao',
    titulo: regiao.titulo,
    subtitulo: `${regiao.totalEstudos} incidências`,
    descricao: `${regiao.resumo} Reúne as demarcações de todas as incidências de ${regiao.titulo.toLowerCase()} em uma prova só, misturando frontal, perfil e oblíquas.`,
    capa: regiao.capa,
    total: regiao.totalEstruturas,
    regiao: regiao.id,
    regiaoTitulo: regiao.titulo,
  })),
  ...ESTUDOS_RAIO_X.map<ResumoQuizRaioX>((estudo) => ({
    slug: estudo.id,
    tipo: 'estudo',
    titulo: estudo.titulo,
    subtitulo: `${estudo.regiaoTitulo} · ${estudo.incidencia}`,
    descricao: estudo.resumo,
    capa: estudo.imagem,
    total: estudo.estruturas.length,
    regiao: estudo.regiao,
    regiaoTitulo: estudo.regiaoTitulo,
    incidencia: estudo.incidencia,
  })),
]

export const TOTAL_QUESTOES_RAIO_X = ESTUDOS_RAIO_X.reduce(
  (total, estudo) => total + estudo.estruturas.length,
  0,
)

export function getQuizRaioX(slug: string): QuizRaioX | undefined {
  const resumo = QUIZZES_RAIO_X.find((quiz) => quiz.slug === slug)
  if (!resumo) return undefined

  if (resumo.tipo === 'geral') {
    return { ...resumo, questoes: questoesGerais() }
  }
  if (resumo.tipo === 'regiao') {
    const questoes = estudosDaRegiao(resumo.regiao as RegiaoRaioX).flatMap(questoesDoEstudo)
    return { ...resumo, questoes }
  }
  const estudo = ESTUDOS_RAIO_X.find((item) => item.id === slug)
  if (!estudo) return undefined
  return { ...resumo, questoes: questoesDoEstudo(estudo) }
}

/** Os quizzes que citam um estudo — usado para o atalho dentro do visualizador. */
export function quizDoEstudo(estudoId: string): ResumoQuizRaioX | undefined {
  return QUIZZES_RAIO_X.find((quiz) => quiz.tipo === 'estudo' && quiz.slug === estudoId)
}
