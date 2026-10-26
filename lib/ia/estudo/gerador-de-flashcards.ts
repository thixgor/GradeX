import 'server-only'

/**
 * Gerador dos flashcards com IA.
 *
 * O prompt antigo pedia um "treinador agressivo" e devolvia texto que às vezes
 * vinha cercado de markdown, às vezes não — e sem teto de cartões para o Plus+
 * (`cardsPerDeck: Infinity`): um pedido de 500 cartões era uma resposta de 60
 * mil tokens que estourava o limite de saída e se perdia inteira.
 *
 * Agora: regras fixas em `systemInstruction` (prefixo reaproveitado pelo cache
 * implícito), saída em `responseSchema`, modelo rápido com raciocínio mínimo
 * (`modelosRapidos`), o deck em pedaços paralelos de até oito cartões, no
 * máximo `MAXIMO_DE_CARTOES` por deck e cartões repetidos descartados aqui.
 */

import { gerarConteudoGemini, modelosRapidos } from '@/lib/ia/gemini'
import { lerJson } from './gerador-de-provas'

export const MAXIMO_DE_CARTOES = 40

export type FocoDosCartoes = 'conceitos' | 'clinica' | 'mecanismos' | 'misto'

export const FOCOS_DOS_CARTOES: { id: FocoDosCartoes; rotulo: string; descricao: string }[] = [
  { id: 'misto', rotulo: 'Equilibrado', descricao: 'Um pouco de tudo' },
  { id: 'conceitos', rotulo: 'Conceitos', descricao: 'Definições e classificações' },
  { id: 'mecanismos', rotulo: 'Mecanismos', descricao: 'Por que e como acontece' },
  { id: 'clinica', rotulo: 'Aplicação', descricao: 'Casos e condutas' },
]

const FOCO_NO_PROMPT: Record<FocoDosCartoes, string> = {
  misto: 'misture conceitos, mecanismos e aplicação prática',
  conceitos: 'definições, classificações, critérios e valores de referência',
  mecanismos: 'fisiopatologia e mecanismos: o porquê e o como de cada fenômeno',
  clinica: 'aplicação: mini-casos, achados que decidem e condutas',
}

const INSTRUCAO = `Você é professor e especialista em memorização ativa (repetição espaçada). Cria flashcards em português do Brasil, corretos pela literatura atual.
Regras:
- frente: UMA pergunta objetiva e específica (até 25 palavras), que exige lembrar — nunca sim/não, nunca "fale sobre".
- verso: a resposta direta na primeira frase; depois 1–3 frases explicando o porquê, como para quem está aprendendo do zero (até 70 palavras no total).
- dica: uma pista que ativa o raciocínio sem entregar a resposta (até 15 palavras).
- objetivos: 1–2 metas curtas do que o cartão treina (até 6 palavras cada).
- Cada cartão cobre um ponto diferente; nada de duas perguntas sobre o mesmo fato.
- Dificuldade: fácil = fato central; médio = relação entre conceitos; difícil = detalhe decisivo, exceção, diferencial.
- Texto puro, sem markdown e sem emojis.`

const ESQUEMA = {
  type: 'OBJECT',
  properties: {
    cartoes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          frente: { type: 'STRING' },
          verso: { type: 'STRING' },
          dica: { type: 'STRING' },
          objetivos: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['frente', 'verso', 'dica'],
      },
    },
  },
  required: ['cartoes'],
}

export interface CartaoGerado {
  front: string
  back: string
  hint: string
  objectives: string[]
}

export interface PedidoDeFlashcards {
  tema: string
  titulo: string
  quantidade: number
  /** 0–1, ou `null` para misturar. */
  dificuldade: number | null
  foco: FocoDosCartoes
  observacoes?: string
}

const limpo = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : ''

const chave = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

export function lerCartoes(texto: string, quantidade: number): CartaoGerado[] {
  const lido = lerJson(texto)
  const brutos: any[] = Array.isArray(lido?.cartoes) ? lido.cartoes : Array.isArray(lido) ? lido : []
  const vistos = new Set<string>()
  const cartoes: CartaoGerado[] = []
  for (const b of brutos) {
    const front = limpo(b?.frente ?? b?.front, 300)
    const back = limpo(b?.verso ?? b?.back, 900)
    if (!front || !back) continue
    const k = chave(front)
    if (vistos.has(k)) continue
    vistos.add(k)
    const objetivos = (Array.isArray(b?.objetivos ?? b?.objectives) ? (b.objetivos ?? b.objectives) : [])
      .map((o: unknown) => limpo(o, 60))
      .filter(Boolean)
      .slice(0, 2)
    cartoes.push({ front, back, hint: limpo(b?.dica ?? b?.hint, 160), objectives: objetivos })
    if (cartoes.length >= quantidade) break
  }
  return cartoes
}

/** Cartões por chamada: cada pedaço sai em poucos segundos e todos correm juntos. */
const CARTOES_POR_PEDACO = 8

/** Ângulos dos pedaços paralelos: cada chamada cobre uma face do tema e não repete as outras. */
const ANGULOS = [
  'definições, classificações e critérios',
  'fisiopatologia e mecanismos',
  'achados, diagnóstico e diagnóstico diferencial',
  'tratamento, condutas e complicações',
  'números, valores de referência e exceções que caem em prova',
]

async function gerarPedaco(p: PedidoDeFlashcards, quantidade: number, angulo: string | null): Promise<CartaoGerado[]> {
  const nivel =
    p.dificuldade === null
      ? 'misture fácil, médio e difícil'
      : p.dificuldade < 0.4
        ? 'fácil'
        : p.dificuldade < 0.7
          ? 'médio'
          : 'difícil'
  const prompt = `Deck: ${p.titulo}
Tema: ${p.tema}${p.observacoes ? `\nOrientação do aluno: ${p.observacoes}` : ''}
Foco: ${FOCO_NO_PROMPT[p.foco]}${angulo ? `\nNesta parte, cubra só: ${angulo}.` : ''}
Dificuldade: ${nivel}
Gere exatamente ${quantidade} cartões.`

  const { texto, dados, modelo } = await gerarConteudoGemini({
    secao: 'flashcards',
    modelos: modelosRapidos(),
    corpo: {
      systemInstruction: { parts: [{ text: INSTRUCAO }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        // ~110 tokens por cartão + folga.
        maxOutputTokens: Math.max(1_536, 180 * quantidade),
        responseMimeType: 'application/json',
        responseSchema: ESQUEMA,
      },
    },
    raciocinio: 'minimo',
    timeoutMs: 20_000,
    prazoMs: 45_000,
  })
  const u = dados?.usageMetadata
  if (u) {
    console.info(
      `[ia/flashcards] ${quantidade} cartões ${modelo}: entrada ${u.promptTokenCount ?? '?'} (cache ${u.cachedContentTokenCount ?? 0}), saída ${u.candidatesTokenCount ?? '?'}, raciocínio ${u.thoughtsTokenCount ?? 0}`,
    )
  }
  return lerCartoes(texto, quantidade)
}

/**
 * O deck sai em pedaços de até oito cartões, todos ao mesmo tempo: quarenta
 * cartões numa chamada só eram ~6 mil tokens de saída em fila (e o teto da
 * função de 30 s, então, cortava o deck no meio). Com os pedaços paralelos, o
 * deck inteiro leva o tempo de um pedaço. Repetidos entre pedaços saem aqui.
 */
export async function gerarFlashcards(p: PedidoDeFlashcards): Promise<CartaoGerado[]> {
  const quantidade = Math.max(1, Math.min(MAXIMO_DE_CARTOES, Math.round(p.quantidade)))
  const pedacos = Math.ceil(quantidade / CARTOES_POR_PEDACO)
  const tamanhos = Array.from({ length: pedacos }, (_, i) =>
    Math.floor(quantidade / pedacos) + (i < quantidade % pedacos ? 1 : 0),
  )
  const resultados = await Promise.allSettled(
    tamanhos.map((n, i) => gerarPedaco(p, n, pedacos > 1 ? ANGULOS[i % ANGULOS.length] : null)),
  )
  const vistos = new Set<string>()
  const cartoes: CartaoGerado[] = []
  for (const r of resultados) {
    if (r.status !== 'fulfilled') continue
    for (const c of r.value) {
      const k = chave(c.front)
      if (vistos.has(k)) continue
      vistos.add(k)
      cartoes.push(c)
    }
  }
  if (cartoes.length === 0) {
    const falha = resultados.find((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (falha) throw falha.reason
    throw new Error('A IA não devolveu cartões válidos. Tente de novo.')
  }
  return cartoes.slice(0, quantidade)
}
