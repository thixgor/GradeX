/**
 * A guarda do Dom: o que entra antes de qualquer token ser gasto, e o que sai
 * antes de chegar à tela.
 *
 * Funções puras (testadas em `__tests__/dom/guarda.test.ts`). Três camadas:
 *
 * 1. **Entrada** (`limparMensagem`): tira caractere invisível, controle,
 *    marcação e espaço repetido; corta no teto. Caractere de largura zero é o
 *    truque clássico para esconder instrução dentro de texto inocente.
 * 2. **Ataque** (`detectarAtaque`): padrões de injeção de prompt, extração do
 *    prompt de sistema, troca de persona, abuso de tokens (pedir textos
 *    gigantes, repetição, carga codificada) e uso do Dom como IA genérica
 *    (gerar código, fazer o trabalho de outra matéria). Pego aqui, a mensagem
 *    nem chega ao modelo — não custa nada — e vira incidente no painel.
 *    O modelo continua instruído a recusar o que escapar; a lista não precisa
 *    ser perfeita, precisa tirar o grosso do caminho barato.
 * 3. **Saída** (`saidaVazou`): o prompt de sistema leva um "canário" aleatório
 *    por requisição. Se o canário (ou trechos literais das regras) aparecer na
 *    resposta, o prompt vazou: a resposta é trocada por uma recusa e o
 *    incidente é registrado.
 */

import { MAX_CARACTERES_MENSAGEM } from './config'

export type TipoDeAtaque =
  | 'injecao-de-prompt'
  | 'extracao-de-prompt'
  | 'troca-de-persona'
  | 'abuso-de-tokens'
  | 'carga-codificada'
  | 'uso-indevido'

export interface Ataque {
  tipo: TipoDeAtaque
  /** 1 = suspeito (só registra), 2 = claro (registra e conta para suspensão). */
  gravidade: 1 | 2
  /** O pedaço que casou, curto, para o painel. */
  trecho: string
}

const INVISIVEIS = /[​-‏‪-‮⁠-⁤⁦-⁯﻿­]/g
// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

/** Normaliza para comparar: minúsculas, sem acento, sem pontuação repetida. */
export function chaveDeComparacao(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // "1gn0r3" → "ignore", mas "10000 palavras" continua número: só troca o
    // dígito colado em letra.
    .replace(/(?<=[a-z])[0@]|[0@](?=[a-z])/g, (c) => (c === '0' ? 'o' : 'a'))
    .replace(/(?<=[a-z])[1!|]|[1!|](?=[a-z])/g, 'i')
    .replace(/(?<=[a-z])3|3(?=[a-z])/g, 'e')
    .replace(/\s+/g, ' ')
}

export function limparMensagem(bruto: unknown, teto = MAX_CARACTERES_MENSAGEM): string {
  if (typeof bruto !== 'string') return ''
  return bruto
    .replace(INVISIVEIS, '')
    .replace(CONTROLE, '')
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, teto)
}

interface Regra {
  tipo: TipoDeAtaque
  gravidade: 1 | 2
  padrao: RegExp
}

/**
 * Padrões em português e inglês (quem tenta jailbreak copia receita da
 * internet, quase sempre em inglês). Rodam sobre `chaveDeComparacao`.
 */
const REGRAS: Regra[] = [
  // Ignorar/sobrescrever instruções
  { tipo: 'injecao-de-prompt', gravidade: 2, padrao: /\b(ignore|ignora|ignorar|esqueca|esquece|desconsidere|desconsidera|disregard|forget|override)\b.{0,40}\b(instruc|regra|prompt|orienta|diretriz|instruction|rule|previous|anterior|acima|above|system)/ },
  { tipo: 'injecao-de-prompt', gravidade: 2, padrao: /\b(novas? instruc|new instructions?|a partir de agora (voce|vc) (e|sera|vai)|from now on,? you (are|will))/ },
  { tipo: 'injecao-de-prompt', gravidade: 2, padrao: /(\[\/?(system|inst|sys)\]|<\|?(im_start|im_end|system|endoftext)\|?>|###\s*(system|instruction)|^\s*system\s*:)/m },
  // Extração do prompt / bastidores
  { tipo: 'extracao-de-prompt', gravidade: 2, padrao: /\b(mostre|mostra|revele|revela|repita|repete|imprima|print|reveal|show|repeat|output|diga|escreva|copie|cole|liste)\b.{0,40}\b(seu|suas|teu|tuas|your|the|o|as|os)?\s*(prompt|instruc\w*|regras internas|system message|mensagem de sistema|configurac\w* (interna|inicial)|initial instructions)/ },
  { tipo: 'extracao-de-prompt', gravidade: 2, padrao: /\b(qual|quais|what)\b.{0,20}\b(e|sao|is|are)\b.{0,15}\b(seu|suas|teu|your)\s*(prompt|instruc\w*|regras|system prompt)/ },
  { tipo: 'extracao-de-prompt', gravidade: 1, padrao: /\b(api[\s_-]?key|chave (da|de) api|token de acesso|variave(l|is) de ambiente|env var|process\.env|credencia(l|is))\b/ },
  // Troca de persona / modo sem regras
  { tipo: 'troca-de-persona', gravidade: 2, padrao: /\b(dan|do anything now|jailbreak|developer mode|modo desenvolvedor|modo (deus|sem (filtro|regras|limites|censura))|god mode|unfiltered|sem restric\w*|aim mode|evil (mode|bot))\b/ },
  { tipo: 'troca-de-persona', gravidade: 2, padrao: /\b(finja|finge|faca de conta|pretend|act as|aja como|atue como|roleplay|interprete|simule ser)\b.{0,40}\b(outra ia|outro assistente|chatgpt|gpt|claude|gemini|llama|uma ia sem|sem regras|hacker|ilimitad|livre de)/ },
  { tipo: 'troca-de-persona', gravidade: 1, padrao: /\b(voce nao e (mais )?o dom|you are no longer|deixe de ser|pare de ser o dom)\b/ },
  // Abuso de tokens
  { tipo: 'abuso-de-tokens', gravidade: 2, padrao: /\b(\d{4,}|mil|milhares de|thousands? of|\d+\s*k)\s*(palavras|paginas|linhas|caracteres|tokens|words|pages|lines)\b/ },
  { tipo: 'abuso-de-tokens', gravidade: 2, padrao: /\b(repita|repete|repeat|escreva|write)\b.{0,30}\b(\d{3,}|infinit\w*|para sempre|forever|sem parar|ate (acabar|o limite))/ },
  { tipo: 'abuso-de-tokens', gravidade: 1, padrao: /\b(livro inteiro|apostila (inteira|completa)|tcc (inteiro|completo)|monografia (inteira|completa)|whole book|entire book)\b/ },
  // Uso como IA genérica (fora do propósito)
  { tipo: 'uso-indevido', gravidade: 1, padrao: /\b(escreva|escreve|gere|gera|crie|cria|faca|faz|write|generate|create)\b.{0,30}\b(codigo|script|programa|funcao em|code|python|javascript|sql|html|css|java\b|c\+\+|php|regex|planilha com formula|macro)/ },
  { tipo: 'uso-indevido', gravidade: 1, padrao: /\b(redacao do enem|faca minha (prova|atividade|tarefa|redacao)|responda (minha|a) prova (pra|para) mim|cola (da|na) prova|resolver a prova (agora|ao vivo))\b/ },
]

/** Carga codificada: blocos longos de base64/hex/binário — esconder instrução de filtro. */
const CODIFICADO = /([A-Za-z0-9+/]{80,}={0,2})|((?:[0-9a-f]{2}\s?){60,})|((?:[01]{8}\s?){20,})/i

export function detectarAtaque(texto: string): Ataque | null {
  if (!texto) return null
  const bruto = texto.match(CODIFICADO)
  if (bruto) return { tipo: 'carga-codificada', gravidade: 2, trecho: bruto[0].slice(0, 60) }
  const chave = chaveDeComparacao(texto)
  // Tokens estruturais (`<|im_start|>`, `[INST]`) se perdem na troca de
  // "leetspeak" da chave; cada regra roda também no texto só em minúsculas.
  const minusculo = texto.toLowerCase()
  let suspeita: Ataque | null = null
  for (const r of REGRAS) {
    const m = chave.match(r.padrao) || minusculo.match(r.padrao)
    if (!m) continue
    const ataque: Ataque = { tipo: r.tipo, gravidade: r.gravidade, trecho: m[0].slice(0, 80) }
    if (r.gravidade === 2) return ataque
    suspeita ??= ataque
  }
  // Mesma palavra repetida dezenas de vezes: enchimento para estourar contexto.
  const palavras = chave.split(' ').filter((p) => p.length > 2)
  if (palavras.length >= 40) {
    const contagem = new Map<string, number>()
    for (const p of palavras) contagem.set(p, (contagem.get(p) || 0) + 1)
    const maior = Math.max(...contagem.values())
    if (maior / palavras.length > 0.35) return { tipo: 'abuso-de-tokens', gravidade: 2, trecho: `palavra repetida ${maior}x` }
  }
  return suspeita
}

/** Resposta curta e no personagem para cada tipo — sem explicar a regra que pegou. */
export function respostaParaAtaque(ataque: Ataque, primeiroNome: string): string {
  const nome = primeiroNome ? `, ${primeiroNome}` : ''
  switch (ataque.tipo) {
    case 'uso-indevido':
      return `Hmm, isso foge do que eu sei fazer${nome}. Eu sou o Dom, especialista em te ajudar a estudar saúde e a usar a DomineAqui. Que tal transformar isso numa dúvida de conteúdo? Aí eu vou fundo com você!`
    case 'abuso-de-tokens':
      return `Opa${nome}, texto gigante não ajuda ninguém a aprender — nem eu consigo explicar bem assim. Me pergunta por partes que eu te entrego cada uma bem mastigadinha.`
    default:
      return `Hehe, essa eu não posso${nome}. Minhas regras ficam guardadinhas comigo. Mas se for sobre estudo ou sobre a plataforma, eu sou todo seu! O que você quer aprender hoje?`
  }
}

/** Trechos literais do prompt de sistema que nunca deveriam aparecer numa resposta. */
const MARCAS_DO_PROMPT = ['regras inegociaveis', 'formato de saida', 'destinos possiveis', 'contexto do aluno (confidencial)']

export function saidaVazou(texto: string, canario: string): boolean {
  if (!texto) return false
  if (canario && texto.includes(canario)) return true
  const chave = chaveDeComparacao(texto)
  return MARCAS_DO_PROMPT.some((m) => chave.includes(m))
}

/** Teto de tamanho da resposta exibida (o modelo já é instruído; isto é o cinto). */
export function cortarResposta(texto: string, teto = 2400): string {
  const limpo = String(texto || '').replace(INVISIVEIS, '').trim()
  if (limpo.length <= teto) return limpo
  const corte = limpo.lastIndexOf('\n', teto)
  return limpo.slice(0, corte > teto * 0.6 ? corte : teto).trimEnd() + '…'
}
