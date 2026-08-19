/**
 * O que uma questão precisa ser para poder ser gravada.
 *
 * Criar e editar exigiam as mesmas coisas e checavam coisas diferentes: o POST
 * cobrava alternativa correta e resposta modelo; o PUT gravava o que viesse.
 * Dava para editar uma questão objetiva até ela ficar sem nenhuma alternativa
 * marcada — e ela continuava aparecendo para os alunos, só que sem gabarito.
 *
 * Pior: o PUT montava `new ObjectId(valor)` direto do corpo da requisição. Um
 * id ausente chegava como a string "undefined" (o formulário mandava
 * `String(questao.periodoId)` de uma questão sem período — o nível "Período"
 * saiu do produto, ver lib/banco/hierarquia.ts), o construtor lançava, e o
 * `catch` da rota devolvia 500 "Erro ao atualizar questão" para TODA questão
 * criada depois da mudança. É esse o erro que a edição dava.
 *
 * Aqui a validação é uma só, pura, e a única forma de um id virar ObjectId é
 * ter passado por `ehObjectId`. O arquivo não importa nada do servidor de
 * propósito: é testado direto (ver __tests__/banco/questao-admin.test.ts).
 */

import type {
  BancoAlternativa,
  BancoAlternativaLetra,
  BancoDificuldade,
  BancoQuestaoTipo,
} from '@/lib/types/banco-questoes'

/** As letras possíveis, na ordem. O índice na lista É a letra da alternativa. */
export const LETRAS: BancoAlternativaLetra[] = ['A', 'B', 'C', 'D', 'E']

export const MIN_ALTERNATIVAS = 2
export const MAX_ALTERNATIVAS = LETRAS.length

const DIFICULDADES: BancoDificuldade[] = ['facil', 'medio', 'dificil']
const TIPOS: BancoQuestaoTipo[] = ['objetiva', 'discursiva']

/** Antes disso não existe prova de faculdade; depois disso é dedo errado. */
const ANO_MINIMO = 1900

/**
 * A questão já limpa e coerente consigo mesma.
 *
 * Os ids são texto porque este módulo não conhece o driver do banco; quem grava
 * converte. `null` e não `undefined` nos opcionais: o `$set` do Mongo precisa
 * distinguir "apagar este campo" de "não mexer nele", e `undefined` some no
 * meio do caminho.
 */
export interface DadosDaQuestao {
  tipo: BancoQuestaoTipo
  moduloId: string
  topicoId: string
  subtopicoId: string | null
  enunciado: string
  explicacao: string | null
  imagemUrl: string | null
  alternativas: BancoAlternativa[] | null
  respostaModelo: string | null
  dificuldade: BancoDificuldade | null
  tags: string[]
  fonte: string | null
  ano: number | null
}

export type LeituraDaQuestao =
  | { ok: true; questao: DadosDaQuestao }
  | { ok: false; erro: string; campo?: keyof DadosDaQuestao }

/** Os 24 hexadecimais de um `_id` do Mongo — sem construir nada que possa lançar. */
export function ehObjectId(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[0-9a-fA-F]{24}$/.test(valor)
}

/**
 * Escapa um termo de busca para ir dentro de `$regex`.
 *
 * A busca do admin é o enunciado da questão, e enunciado de prova tem
 * parêntese: procurar por "(A)" montava `/(A)/` — um grupo de captura, não um
 * texto — e procurar por "IC (" montava uma expressão inválida, que derruba a
 * agregação inteira com 500. O usuário digita texto; o banco tem que receber
 * texto.
 */
export function escaparRegex(termo: string): string {
  return String(termo || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function textoOuNulo(valor: unknown): string | null {
  const t = texto(valor)
  return t.length > 0 ? t : null
}

/**
 * Renumera as letras a partir da posição.
 *
 * O editor deixava remover a alternativa B de A/B/C/D e ficava com A, C, D —
 * as letras viravam um buraco. E "adicionar" escolhia a letra pelo TAMANHO da
 * lista, então a próxima de A/C/D era `LETRAS[3]` = "D": duas alternativas D na
 * mesma questão, com a mesma `key` no React e o gabarito apontando para as
 * duas.
 */
export function normalizarAlternativas(
  alternativas: { letra?: string; texto?: string; correta?: boolean }[],
): BancoAlternativa[] {
  return alternativas.slice(0, MAX_ALTERNATIVAS).map((alt, i) => ({
    letra: LETRAS[i],
    texto: typeof alt?.texto === 'string' ? alt.texto.trim() : '',
    correta: alt?.correta === true,
  }))
}

/**
 * Uma imagem tem que ser buscável pelo navegador: endereço http(s) ou caminho
 * do próprio site. `javascript:` não é imagem — e o campo é colado à mão.
 */
function lerImagem(valor: unknown): string | null | undefined {
  const url = textoOuNulo(valor)
  if (url === null) return null
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) return undefined
  return url
}

function lerTags(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  const vistas = new Set<string>()
  for (const item of valor) {
    const t = texto(item)
    if (t.length > 0) vistas.add(t)
  }
  return Array.from(vistas)
}

/** O estado inicial de uma questão nova — o mesmo do formulário. */
export function questaoVazia(): DadosDaQuestao {
  return {
    tipo: 'objetiva',
    moduloId: '',
    topicoId: '',
    subtopicoId: null,
    enunciado: '',
    explicacao: null,
    imagemUrl: null,
    alternativas: normalizarAlternativas([{}, {}, {}, {}]),
    respostaModelo: null,
    dificuldade: null,
    tags: [],
    fonte: null,
    ano: null,
  }
}

/**
 * Lê o documento do banco no formato que a validação entende.
 *
 * É o que permite ao PUT aceitar um corpo parcial sem inventar regra nova: o
 * que não veio na requisição vem daqui, e a questão INTEIRA é validada.
 * Trocar o tipo de objetiva para discursiva, por exemplo, só é aprovado se a
 * resposta modelo existir depois da mistura — coisa que uma validação campo a
 * campo não tem como saber.
 */
export function questaoDoBanco(doc: Record<string, any>): DadosDaQuestao {
  const id = (valor: unknown) => (valor == null ? '' : String(valor))
  return {
    tipo: TIPOS.includes(doc?.tipo) ? doc.tipo : 'objetiva',
    moduloId: id(doc?.moduloId),
    topicoId: id(doc?.topicoId),
    // O campo no banco é `subtopicoid`, minúsculo no fim — erro de digitação
    // antigo, presente em todos os documentos. Renomear exigiria migração; o
    // nome errado fica confinado a esta linha e à gravação.
    subtopicoId: doc?.subtopicoid == null ? null : String(doc.subtopicoid),
    enunciado: texto(doc?.enunciado),
    explicacao: textoOuNulo(doc?.explicacao),
    imagemUrl: textoOuNulo(doc?.imagemUrl),
    alternativas: Array.isArray(doc?.alternativas) ? normalizarAlternativas(doc.alternativas) : null,
    respostaModelo: textoOuNulo(doc?.respostaModelo),
    dificuldade: DIFICULDADES.includes(doc?.dificuldade) ? doc.dificuldade : null,
    tags: lerTags(doc?.tags),
    fonte: textoOuNulo(doc?.fonte),
    ano: typeof doc?.ano === 'number' ? doc.ano : null,
  }
}

/**
 * Valida o corpo de uma requisição e devolve a questão pronta para gravar.
 *
 * `anterior` é o estado atual da questão numa edição: os campos ausentes do
 * corpo saem dele. Sem `anterior`, é uma criação e o corpo é tudo.
 */
export function lerQuestao(bruto: any, anterior?: DadosDaQuestao): LeituraDaQuestao {
  if (!bruto || typeof bruto !== 'object') {
    return { ok: false, erro: 'Requisição sem dados da questão' }
  }

  const base = anterior ?? questaoVazia()
  const veio = (campo: string) => Object.prototype.hasOwnProperty.call(bruto, campo)

  const tipo = veio('tipo') ? bruto.tipo : base.tipo
  if (!TIPOS.includes(tipo)) {
    return { ok: false, erro: 'Tipo inválido: use "objetiva" ou "discursiva"', campo: 'tipo' }
  }

  const moduloId = veio('moduloId') ? texto(bruto.moduloId) : base.moduloId
  if (!ehObjectId(moduloId)) {
    return { ok: false, erro: 'Escolha o módulo da questão', campo: 'moduloId' }
  }

  const topicoId = veio('topicoId') ? texto(bruto.topicoId) : base.topicoId
  if (!ehObjectId(topicoId)) {
    return { ok: false, erro: 'Escolha o tópico da questão', campo: 'topicoId' }
  }

  // Subtópico é opcional: string vazia significa "nenhum", e é assim que o
  // formulário desmarca o que já estava escolhido.
  let subtopicoId: string | null = base.subtopicoId
  if (veio('subtopicoId')) {
    const valor = texto(bruto.subtopicoId)
    if (valor.length === 0) subtopicoId = null
    else if (!ehObjectId(valor)) {
      return { ok: false, erro: 'Subtópico inválido', campo: 'subtopicoId' }
    } else subtopicoId = valor
  }

  const enunciado = veio('enunciado') ? texto(bruto.enunciado) : base.enunciado
  if (enunciado.length === 0) {
    return { ok: false, erro: 'O enunciado não pode ficar vazio', campo: 'enunciado' }
  }

  let imagemUrl: string | null = base.imagemUrl
  if (veio('imagemUrl')) {
    const lida = lerImagem(bruto.imagemUrl)
    if (lida === undefined) {
      return { ok: false, erro: 'A imagem precisa ser um endereço http(s) ou um caminho do site', campo: 'imagemUrl' }
    }
    imagemUrl = lida
  }

  let dificuldade: BancoDificuldade | null = base.dificuldade
  if (veio('dificuldade')) {
    const valor = texto(bruto.dificuldade)
    if (valor.length === 0) dificuldade = null
    else if (!DIFICULDADES.includes(valor as BancoDificuldade)) {
      return { ok: false, erro: 'Dificuldade inválida', campo: 'dificuldade' }
    } else dificuldade = valor as BancoDificuldade
  }

  let ano: number | null = base.ano
  if (veio('ano')) {
    if (bruto.ano === null || bruto.ano === '' || bruto.ano === undefined) ano = null
    else {
      const numero = Number(bruto.ano)
      if (!Number.isInteger(numero) || numero < ANO_MINIMO || numero > new Date().getFullYear() + 1) {
        return { ok: false, erro: 'Ano inválido', campo: 'ano' }
      }
      ano = numero
    }
  }

  // As duas metades que dependem do tipo. O que não pertence ao tipo escolhido
  // é apagado em vez de ficar guardado: uma questão que virou discursiva com as
  // alternativas antigas no documento volta a aparecer como objetiva em
  // qualquer tela que olhe para `alternativas` antes de olhar para `tipo`.
  let alternativas: BancoAlternativa[] | null = null
  let respostaModelo: string | null = null

  if (tipo === 'objetiva') {
    const cruas = veio('alternativas') ? bruto.alternativas : base.alternativas
    if (!Array.isArray(cruas)) {
      return { ok: false, erro: 'Questão objetiva precisa de alternativas', campo: 'alternativas' }
    }

    alternativas = normalizarAlternativas(cruas)

    if (alternativas.length < MIN_ALTERNATIVAS) {
      return {
        ok: false,
        erro: `Questão objetiva precisa de pelo menos ${MIN_ALTERNATIVAS} alternativas`,
        campo: 'alternativas',
      }
    }

    const vazia = alternativas.findIndex((alt) => alt.texto.length === 0)
    if (vazia >= 0) {
      return {
        ok: false,
        erro: `A alternativa ${LETRAS[vazia]} está sem texto`,
        campo: 'alternativas',
      }
    }

    const corretas = alternativas.filter((alt) => alt.correta).length
    if (corretas === 0) {
      return { ok: false, erro: 'Marque qual alternativa é a correta', campo: 'alternativas' }
    }
    if (corretas > 1) {
      return { ok: false, erro: 'Só uma alternativa pode ser a correta', campo: 'alternativas' }
    }
  } else {
    respostaModelo = veio('respostaModelo') ? textoOuNulo(bruto.respostaModelo) : base.respostaModelo
    if (!respostaModelo) {
      return {
        ok: false,
        erro: 'Questão discursiva precisa da resposta modelo',
        campo: 'respostaModelo',
      }
    }
  }

  return {
    ok: true,
    questao: {
      tipo,
      moduloId,
      topicoId,
      subtopicoId,
      enunciado,
      explicacao: veio('explicacao') ? textoOuNulo(bruto.explicacao) : base.explicacao,
      imagemUrl,
      alternativas,
      respostaModelo,
      dificuldade,
      tags: veio('tags') ? lerTags(bruto.tags) : base.tags,
      fonte: veio('fonte') ? textoOuNulo(bruto.fonte) : base.fonte,
      ano,
    },
  }
}
