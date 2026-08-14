import {
  CASOS_RAIO_X,
  CASOS_POR_SLUG,
  GUIAS_CASOS_RAIO_X,
  type CasoRaioX,
  type CategoriaCasoRaioX,
  type ImagemCasoRaioX,
} from './casos-raio-x'
import {
  DETALHES_CASOS_RAIO_X,
  type AchadoMarcado,
  type EstruturaCaso,
} from './casos-raio-x-detalhes'
import { VINHETAS_CASOS_RAIO_X, type VinhetaClinica } from './casos-clinicos'

/**
 * Quiz de casos clínicos do Raio-X de tórax.
 *
 * O outro quiz do manual (`quiz-raio-x.ts`) pergunta o nome de uma estrutura
 * marcada: é anatomia. Este pergunta outra coisa — dado um paciente, o que a
 * radiografia dele mostra. A diferença não é de dificuldade, é de tarefa: aqui
 * o aluno recebe a consulta inteira antes do filme, e o filme sobe limpo.
 *
 * ## A ordem importa, e é ela que define o formato
 *
 * 1. **A consulta.** Identificação, queixa, história, antecedentes, sinais
 *    vitais, exame físico e a pergunta que motivou o pedido. Sem isso, o aluno
 *    treina reconhecer padrão de imagem — que é metade do trabalho, e a metade
 *    que menos se parece com o plantão.
 * 2. **O filme limpo.** A metade esquerda do sprite. Nenhuma seta, nenhum
 *    círculo: é o que chega no negatoscópio.
 * 3. **A resposta.** Quatro achados possíveis, todos plausíveis para *aquela*
 *    história.
 * 4. **O comentário e o filme marcado.** Só depois de responder aparecem a
 *    metade direita do sprite, as marcações comentadas uma a uma, o mecanismo,
 *    a dissecção das estruturas, as armadilhas, a conduta e o porquê de cada
 *    alternativa errada.
 *
 * ## De onde vem cada pedaço
 *
 * Nada aqui é conteúdo novo criado para o quiz, exceto a consulta e os
 * distratores — que moram em `casos-clinicos.ts`. O comentário é montado a
 * partir do que o atlas já tem: `casos-raio-x.ts` dá explicação, sinais e
 * armadilhas; `casos-raio-x-detalhes.ts` dá mecanismo, estruturas, marcações e
 * conduta; o guia da categoria dá o roteiro de leitura. Corrigir o dossiê de um
 * caso corrige a resposta comentada da questão dele.
 *
 * ## Por que é determinístico
 *
 * As páginas são estáticas e o runner também renderiza no servidor. Sorteio com
 * `Math.random` durante a montagem daria gabaritos diferentes no HTML e na
 * hidratação. A ordem das alternativas sai de um hash do identificador da
 * questão; o embaralhamento da rodada, esse sim aleatório, acontece no
 * navegador depois que o aluno aperta "começar".
 */

/* ────────────────────────────────── Tipos ────────────────────────────────── */

export interface AlternativaCasoClinico {
  id: string
  /** O achado, escrito como o aluno o marcaria num laudo. */
  nome: string
}

export interface DescarteCasoClinico {
  nome: string
  /** O que separa esta alternativa da certa — no filme, não no livro. */
  texto: string
}

export interface ComentarioCasoClinico {
  /** Frase de veredito: o achado por extenso. */
  veredito: string
  /** Como a história e a imagem se encaixam. */
  correlacao: string
  /** Por que a doença produziu esta imagem — a física e a fisiopatologia. */
  mecanismo?: string
  /** A leitura do filme, do acervo do atlas. */
  leitura: string
  sinais: string[]
  /** O que cada marcação do filme marcado está apontando. */
  marcacoes: AchadoMarcado[]
  estruturas: EstruturaCaso[]
  armadilhas: string[]
  /** O que a radiografia não resolve e qual é o passo seguinte. */
  conduta?: string
  /** A pergunta que organiza a leitura desta categoria. */
  perguntaGuia: string
  /** Roteiro sistemático da categoria — a ordem que evita a satisfação de busca. */
  roteiro: string[]
  descartes: DescarteCasoClinico[]
}

export interface QuestaoCasoClinico {
  id: string
  casoSlug: string
  categoria: CategoriaCasoRaioX
  categoriaTitulo: string
  /** Título do caso no atlas — só aparece depois da resposta. */
  titulo: string
  vinheta: VinhetaClinica
  /** O filme da questão: limpo à esquerda do sprite, marcado à direita. */
  imagem: ImagemCasoRaioX
  alternativas: AlternativaCasoClinico[]
  /** Índice da alternativa correta dentro de `alternativas`. */
  correta: number
  comentario: ComentarioCasoClinico
  /** Link para o caso aberto no atlas. */
  atalho: string
}

export type TipoQuizClinico = 'plantao' | 'categoria'

/** O que a tela de índice precisa saber — sem carregar as questões. */
export interface ResumoQuizClinico {
  slug: string
  tipo: TipoQuizClinico
  titulo: string
  subtitulo: string
  descricao: string
  /** Capa em sprite: o catálogo desenha a metade limpa. */
  capa: ImagemCasoRaioX
  total: number
  categoria?: CategoriaCasoRaioX
  /** A pergunta que organiza a leitura da categoria. */
  pergunta?: string
}

export interface QuizCasoClinico extends ResumoQuizClinico {
  questoes: QuestaoCasoClinico[]
}

/* ───────────────────────── Determinismo ───────────────────────── */

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
function embaralhar<T>(itens: T[], proximo: () => number): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(proximo() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/** Identificador estável e legível para usar como chave de lista. */
function identificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

/* ──────────────────────────── Montagem da questão ──────────────────────────── */

/**
 * Escolhe o filme da questão.
 *
 * A vinheta aponta a imagem que corresponde à história que ela conta — num caso
 * com três graus de cardiomegalia ou com cinco exames de uma série temporal,
 * isso não é detalhe. Se o índice indicado não existir ou não tiver marcações,
 * o fallback procura o primeiro filme que tenha, porque é o filme marcado que
 * a resposta comentada precisa mostrar.
 */
function filmeDaQuestao(caso: CasoRaioX, vinheta: VinhetaClinica): ImagemCasoRaioX {
  const marcacoes = DETALHES_CASOS_RAIO_X[caso.slug]?.marcacoes ?? {}
  const pedida = caso.imagens.find((imagem) => imagem.indice === (vinheta.imagem ?? 1))
  if (pedida && (marcacoes[pedida.indice]?.length ?? 0) > 0) return pedida

  const comMarcacao = caso.imagens.find((imagem) => (marcacoes[imagem.indice]?.length ?? 0) > 0)
  return comMarcacao ?? pedida ?? caso.imagens[0]
}

export function montarQuestaoClinica(caso: CasoRaioX): QuestaoCasoClinico | null {
  const vinheta = VINHETAS_CASOS_RAIO_X[caso.slug]
  if (!vinheta) return null

  const proximo = sorteador(semente(`clinico:${caso.slug}`))
  const detalhe = DETALHES_CASOS_RAIO_X[caso.slug]
  const guia = GUIAS_CASOS_RAIO_X[caso.categoria]
  const imagem = filmeDaQuestao(caso, vinheta)

  const alternativas = embaralhar<AlternativaCasoClinico>(
    [
      { id: `c-${identificar(vinheta.achado)}`, nome: vinheta.achado },
      ...vinheta.distratores.map((distrator) => ({
        id: `d-${identificar(distrator.nome)}`,
        nome: distrator.nome,
      })),
    ],
    proximo,
  )

  return {
    id: `clinico:${caso.slug}`,
    casoSlug: caso.slug,
    categoria: caso.categoria,
    categoriaTitulo: caso.categoriaTitulo,
    titulo: caso.titulo,
    vinheta,
    imagem,
    alternativas,
    correta: alternativas.findIndex((item) => item.nome === vinheta.achado),
    comentario: {
      // `achado` é o rótulo curto que disputa com os distratores; `veredito` é
      // o mesmo achado por extenso, e só aparece depois da resposta.
      veredito: vinheta.veredito ?? vinheta.achado,
      correlacao: vinheta.correlacao,
      mecanismo: detalhe?.mecanismo,
      leitura: caso.explicacao,
      sinais: caso.sinais,
      marcacoes: detalhe?.marcacoes[imagem.indice] ?? [],
      estruturas: detalhe?.estruturas ?? [],
      armadilhas: caso.armadilhas,
      conduta: detalhe?.conduta,
      perguntaGuia: guia.pergunta,
      roteiro: guia.roteiro,
      descartes: vinheta.distratores.map((distrator) => ({
        nome: distrator.nome,
        texto: distrator.porQue,
      })),
    },
    atalho: `/manual-clinico/radiologia/raio-x/casos/${caso.slug}`,
  }
}

/**
 * O banco inteiro, montado uma vez.
 *
 * São 72 casos com dossiê completo; remontá-los a cada página estática gerada —
 * e a cada vez que o índice pergunta apenas quantas questões um quiz tem —
 * seria trabalho repetido sem ganho.
 */
let cacheBanco: QuestaoCasoClinico[] | null = null
function banco(): QuestaoCasoClinico[] {
  cacheBanco ??= CASOS_RAIO_X.map(montarQuestaoClinica).filter(
    (questao): questao is QuestaoCasoClinico => questao !== null,
  )
  return cacheBanco
}

function questoesDaCategoria(categoria: CategoriaCasoRaioX): QuestaoCasoClinico[] {
  return banco().filter((questao) => questao.categoria === categoria)
}

/**
 * Plantão: rodízio entre os sete capítulos, uma questão de cada por passada.
 *
 * O cliente embaralha a rodada antes de cortá-la, então esta ordem não decide o
 * sorteio. Ela decide o gabarito e a leitura do banco: intercalado, qualquer
 * recorte que se olhe mostra a variedade real do acervo, em vez de onze casos
 * cardiovasculares seguidos.
 */
function questoesDoPlantao(): QuestaoCasoClinico[] {
  const filas = Object.keys(GUIAS_CASOS_RAIO_X).map((categoria) =>
    questoesDaCategoria(categoria as CategoriaCasoRaioX),
  )
  const intercaladas: QuestaoCasoClinico[] = []
  const maior = Math.max(0, ...filas.map((fila) => fila.length))
  for (let passada = 0; passada < maior; passada += 1) {
    for (const fila of filas) {
      if (passada < fila.length) intercaladas.push(fila[passada])
    }
  }
  return intercaladas
}

/* ──────────────────────────── Catálogo de quizzes ──────────────────────────── */

export const TOTAL_QUESTOES_CLINICAS = banco().length

/**
 * O catálogo antes do filtro.
 *
 * A anotação precisa ficar aqui, e não só na exportação: encaixado direto num
 * `.filter(...)`, o literal deixa de ser contextualmente tipado e `tipo` alarga
 * para `string`, que não satisfaz `TipoQuizClinico`.
 */
const CATALOGO: ResumoQuizClinico[] = [
  {
    slug: 'plantao',
    tipo: 'plantao',
    titulo: 'Plantão — todos os capítulos',
    subtitulo: 'Sete capítulos misturados',
    descricao:
      'Os casos chegam como chegam no plantão: sem aviso do capítulo. Você recebe a consulta inteira — queixa, história, antecedentes, sinais vitais e exame físico —, o filme sobe limpo e você diz o que está vendo. É o modo mais honesto de descobrir se você lê a radiografia ou se estava apenas reconhecendo o título da página.',
    capa: banco()[0]?.imagem,
    total: banco().length,
  },
  ...Object.values(GUIAS_CASOS_RAIO_X).map<ResumoQuizClinico>((guia) => {
    const questoes = questoesDaCategoria(guia.id)
    return {
      slug: guia.id,
      tipo: 'categoria',
      titulo: guia.titulo,
      subtitulo: `${questoes.length} ${questoes.length === 1 ? 'caso' : 'casos'}`,
      descricao: `${guia.resumo} Cada questão abre com a consulta que motivou o pedido e cobra o achado; a resposta traz o filme marcado, o mecanismo por trás da imagem e o roteiro de leitura do capítulo.`,
      capa: questoes[0]?.imagem,
      total: questoes.length,
      categoria: guia.id,
      pergunta: guia.pergunta,
    }
  }),
]

/**
 * Um capítulo sem caso escrito não vira cartão.
 *
 * `capa` sai de `questoes[0]?.imagem`: um capítulo vazio produziria um resumo
 * sem capa e um cartão quebrado no catálogo. O filtro é a rede de segurança
 * para quando o acervo crescer antes das consultas.
 */
export const QUIZZES_CLINICOS: ResumoQuizClinico[] = CATALOGO.filter(
  (quiz) => quiz.total > 0 && quiz.capa !== undefined,
)

export function getQuizCasoClinico(slug: string): QuizCasoClinico | undefined {
  const resumo = QUIZZES_CLINICOS.find((quiz) => quiz.slug === slug)
  if (!resumo) return undefined

  if (resumo.tipo === 'plantao') {
    return { ...resumo, questoes: questoesDoPlantao() }
  }
  return { ...resumo, questoes: questoesDaCategoria(resumo.categoria as CategoriaCasoRaioX) }
}

/** O quiz que cobre um caso — usado para o atalho dentro da página do caso. */
export function quizDoCaso(slug: string): ResumoQuizClinico | undefined {
  const caso = CASOS_POR_SLUG.get(slug)
  if (!caso) return undefined
  return QUIZZES_CLINICOS.find((quiz) => quiz.categoria === caso.categoria)
}

/** Quantos casos do acervo já têm consulta escrita. */
export function casoTemQuizClinico(slug: string): boolean {
  return VINHETAS_CASOS_RAIO_X[slug] !== undefined
}
