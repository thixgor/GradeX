import type { Question } from '@/lib/types'

/**
 * Correção automática de discursiva curta por gabarito flexível.
 *
 * ## O problema
 *
 * Muita "discursiva" é, na prática, uma resposta de uma ou poucas palavras:
 * "Qual órgão bombeia o sangue?" → "coração". Mandar isso para a IA gasta uma
 * chamada por aluno para decidir o óbvio, e a correção manual obriga o admin a
 * ler cem vezes a mesma palavra. Comparar o texto exatamente também não serve:
 * o aluno escreve "Coracao", "coraçao", "coração.", ".coração", "o coração" ou
 * troca duas letras sem querer ("coracoa") — e sabe a resposta.
 *
 * ## O critério
 *
 * A comparação acontece em duas etapas:
 *
 * 1. **Normalização** — tudo que não muda o sentido sai da frente: maiúsculas,
 *    acentos e cedilha, pontuação e símbolos, espaços repetidos e o artigo no
 *    começo ("o coração" = "coração"). Depois disso, "Coração." e ".coracao"
 *    viram exatamente a mesma string: `coracao`.
 *
 * 2. **Tolerância a erro de digitação** — se ainda não bateu, conta-se quantas
 *    edições (inserir, apagar, trocar ou inverter duas letras vizinhas) separam
 *    a resposta do gabarito — a distância de Damerau-Levenshtein. A tolerância
 *    cresce com o tamanho da palavra: em "sal" nenhuma (senão "sol" passaria);
 *    em "coracao" uma ("coracoa" passa); em palavras longas, duas ou três.
 *
 * Cada resposta aceita (o gabarito e seus sinônimos) passa pelo mesmo
 * processo; basta bater com UMA delas.
 */

/** Quão permissiva é a etapa 2. */
export type RigorDoGabarito = 'exato' | 'normal' | 'flexivel'

export const RIGOR_PADRAO: RigorDoGabarito = 'normal'

export const DESCRICAO_DO_RIGOR: Record<RigorDoGabarito, string> = {
  exato: 'Ignora só maiúsculas, acentos, pontuação e artigos — nenhum erro de letra',
  normal: 'Também aceita erros de digitação leves (1 letra em palavras curtas, 2–3 nas longas)',
  flexivel: 'Aceita erros de digitação mais frequentes (cerca de 1 letra a cada 4)',
}

/** Artigos que não mudam a resposta quando aparecem no começo. */
const ARTIGOS_INICIAIS = new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas'])

/**
 * Leva o texto à sua forma comparável.
 *
 * "  O Coração!! " → "coracao"; "Ventrículo-Esquerdo." → "ventriculo esquerdo".
 */
export function normalizarResposta(texto: string): string {
  const palavras = (texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // acentos e cedilha: "ç" vira "c" + marca, a marca sai
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') // pontuação, hífen, aspas, emojis: tudo vira espaço
    .trim()
    .split(' ')
    .filter(Boolean)

  // "o coração" → "coração", mas só se sobrar alguma coisa: a resposta "a"
  // (uma alternativa, uma letra) continua sendo "a".
  if (palavras.length > 1 && ARTIGOS_INICIAIS.has(palavras[0])) palavras.shift()

  return palavras.join(' ')
}

/**
 * Distância de Damerau-Levenshtein (variante "optimal string alignment").
 *
 * Quantas operações de uma letra — inserir, apagar, substituir, ou inverter
 * duas vizinhas — transformam `a` em `b`. "coracoa" → "coracao" custa 1 (uma
 * inversão), e não 2 como na Levenshtein simples.
 */
export function distanciaDeEdicao(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  // d[i][j] = distância entre os i primeiros de `a` e os j primeiros de `b`.
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => {
    const linha = new Array<number>(b.length + 1).fill(0)
    linha[0] = i
    return linha
  })
  for (let j = 0; j <= b.length; j++) d[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // apagar
        d[i][j - 1] + 1, // inserir
        d[i - 1][j - 1] + custo, // substituir (ou manter)
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1) // inverter vizinhas
      }
    }
  }
  return d[a.length][b.length]
}

/** Quantos erros de letra uma resposta do tamanho `tamanho` pode ter. */
export function toleranciaPara(tamanho: number, rigor: RigorDoGabarito = RIGOR_PADRAO): number {
  if (rigor === 'exato') return 0
  if (rigor === 'flexivel') {
    if (tamanho <= 3) return 0
    return Math.max(1, Math.floor(tamanho / 4))
  }
  // normal
  if (tamanho <= 3) return 0
  if (tamanho <= 7) return 1
  if (tamanho <= 14) return 2
  return 3
}

export interface VereditoDoGabarito {
  aceita: boolean
  /** A resposta aceita (como o admin escreveu) com que a do aluno bateu. */
  respostaCorrespondente?: string
  /** Quantos erros de letra foram perdoados (0 = só normalização). */
  distancia?: number
}

/**
 * A resposta do aluno bate com alguma das respostas aceitas?
 *
 * Devolve a correspondência mais próxima, para o feedback poder dizer
 * "aceita como 'coração'".
 */
export function compararComGabarito(
  resposta: string,
  respostasAceitas: string[] | undefined,
  rigor: RigorDoGabarito = RIGOR_PADRAO,
): VereditoDoGabarito {
  const aluno = normalizarResposta(resposta)
  if (!aluno) return { aceita: false }

  let melhor: VereditoDoGabarito = { aceita: false }

  for (const aceita of respostasAceitas || []) {
    const gabarito = normalizarResposta(aceita)
    if (!gabarito) continue

    // Espaço também é erro humano: "ventriculo esquerdo" x "ventriculoesquerdo".
    const distancia = Math.min(
      distanciaDeEdicao(aluno, gabarito),
      distanciaDeEdicao(aluno.replace(/ /g, ''), gabarito.replace(/ /g, '')),
    )

    // A tolerância é medida pelo gabarito, não pela resposta: senão um texto
    // longo e errado ganharia mais folga só por ser longo.
    if (distancia <= toleranciaPara(gabarito.replace(/ /g, '').length, rigor)) {
      if (!melhor.aceita || distancia < (melhor.distancia ?? Infinity)) {
        melhor = { aceita: true, respostaCorrespondente: aceita.trim(), distancia }
      }
      if (distancia === 0) break
    }
  }

  return melhor
}

/** Limpa a lista digitada pelo admin: sem linhas vazias nem repetidas. */
export function limparRespostasAceitas(lista: unknown): string[] {
  if (!Array.isArray(lista)) return []
  const vistas = new Set<string>()
  const limpas: string[] = []
  for (const item of lista) {
    if (typeof item !== 'string') continue
    const texto = item.trim()
    const chave = normalizarResposta(texto)
    if (!chave || vistas.has(chave)) continue
    vistas.add(chave)
    limpas.push(texto)
  }
  return limpas
}

/** A questão tem gabarito flexível configurado? */
export function temGabaritoFlexivel(questao: Pick<Question, 'acceptedAnswers'>): boolean {
  return limparRespostasAceitas(questao.acceptedAnswers).length > 0
}

/** A correção pronta para gravar na submissão. */
export function corrigirPorGabarito(
  questao: Pick<Question, 'id' | 'acceptedAnswers' | 'acceptedAnswersRigor' | 'maxScore'>,
  resposta: string | undefined,
) {
  const maxScore = questao.maxScore || 10
  const aceitas = limparRespostasAceitas(questao.acceptedAnswers)
  const veredito = compararComGabarito(resposta || '', aceitas, questao.acceptedAnswersRigor)

  let feedback: string
  if (!resposta || !resposta.trim()) {
    feedback = 'Sem resposta.'
  } else if (veredito.aceita) {
    feedback =
      veredito.distancia && veredito.distancia > 0
        ? `✅ Resposta aceita como "${veredito.respostaCorrespondente}" (pequeno erro de digitação desconsiderado).`
        : `✅ Resposta correta ("${veredito.respostaCorrespondente}").`
  } else {
    feedback = `❌ Resposta não corresponde ao gabarito. Resposta(s) aceita(s): ${aceitas
      .map((a) => `"${a}"`)
      .join(', ')}.`
  }

  return {
    questionId: questao.id,
    score: veredito.aceita ? maxScore : 0,
    maxScore,
    feedback,
    method: 'answer-key' as const,
    correctedAt: new Date(),
  }
}
