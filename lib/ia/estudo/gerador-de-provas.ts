import 'server-only'

/**
 * Gerador das provas com IA (provas pessoais).
 *
 * ## Onde ia o dinheiro antes
 *
 * `lib/question-generator.ts` fazia DUAS chamadas por questão — uma para a
 * questão, outra para o feedback comentado — e cada uma levava um prompt de
 * ~1.500 tokens com quatro exemplos de JSON inteiros, metade deles do formato
 * que nem estava sendo pedido. Uma prova de 20 questões eram 40 chamadas, 60 mil
 * tokens de entrada repetida, mais as novas tentativas de cada falha.
 *
 * Agora:
 *  - UMA chamada por lote de até três questões, já com a resposta comentada;
 *  - as regras moram em `systemInstruction`, idênticas em toda chamada: é o
 *    prefixo que o cache implícito do Gemini reaproveita entre lotes (paga-se
 *    ~25% do preço pelos tokens em cache);
 *  - saída com `responseSchema`: JSON puro, sem markdown nem texto em volta,
 *    sem exemplo nenhum no prompt;
 *  - raciocínio no nível baixo — quem segura a qualidade é a auditoria
 *    (`auditoria-de-questoes.ts`), não tokens de pensamento;
 *  - só a questão que a auditoria reprova volta para a IA, numa chamada de
 *    reparo que leva apenas o comando e as alternativas.
 *
 * Cada chamada registra no log quantos tokens entraram, saíram e vieram do
 * cache, para dar para medir o custo real por prova.
 */

import { v4 as uuidv4 } from 'uuid'

import { gerarConteudoGemini } from '@/lib/ia/gemini'
import type { Alternative, Question } from '@/lib/types'

import {
  auditarQuestao,
  INSTRUCAO_DO_ALERTA,
  normalizarComando,
  ordemComCorretaEm,
  precisaDescartar,
  precisaReparar,
  type Alerta,
  type FormatoDeQuestao,
} from './auditoria-de-questoes'
import type { VagaDaQuestao } from './plano-da-prova'
import { recursoEmTexto, sanitizarRecurso, type RecursoVisual } from './recursos-visuais'

/** As cinco alternativas fixas da asserção-razão, na ordem canônica das bancas. */
export const ALTERNATIVAS_ASSERCAO_RAZAO = [
  'As asserções I e II são verdadeiras, e a II é uma justificativa correta da I.',
  'As asserções I e II são verdadeiras, mas a II não é uma justificativa correta da I.',
  'A asserção I é verdadeira, e a II é falsa.',
  'A asserção I é falsa, e a II é verdadeira.',
  'As asserções I e II são falsas.',
]

const ROTULO_FORMATO: Record<FormatoDeQuestao, string> = {
  standard: 'standard',
  'multiple-affirmative': 'multiple-affirmative',
  'assertion-reason': 'assertion-reason',
  comparison: 'comparison',
}

const ROTULO_NIVEL = { facil: 'fácil', medio: 'médio', dificil: 'difícil' } as const

export const INSTRUCAO_DO_SISTEMA = `Você é elaborador sênior de bancas (residência médica, vestibular, concursos da saúde) e professor. Escreve questões de múltipla escolha inéditas, corretas e didáticas, em português do Brasil.

REGRAS DA QUESTÃO
1. Enunciado, recurso, comando e alternativas formam uma unidade: o comando pergunta exatamente o que o enunciado permite responder; toda alternativa responde ao comando com a mesma estrutura gramatical; não falta dado necessário nem sobra dado sem propósito.
2. Exatamente uma alternativa correta, inquestionável pela literatura atual. Se o comando for negativo (INCORRETA, EXCETO), "correta": true marca a afirmação falsa, e a palavra vem em caixa alta no comando.
3. Distratoras inteligentes: cada uma é um erro conceitual real que um aluno que estudou pela metade cometeria (confundir mecanismos parecidos, trocar valores de referência, inverter causa e efeito, aplicar a conduta certa no contexto errado). Nunca banais, absurdas ou óbvias: o aluno precisa pensar para eliminá-las.
4. A forma não pode entregar a resposta:
   - todas as alternativas com tamanho parecido (±20%); a correta NÃO é a mais longa;
   - mesma estrutura em todas: se uma tem parênteses, travessão ou explicação, as outras também; de preferência nenhuma;
   - sem termos absolutos nas distratoras (sempre, nunca, apenas, somente, exclusivamente, unicamente, totalmente, necessariamente, jamais, advérbios absolutos em -mente);
   - sem "todas/nenhuma das anteriores", sem citar outras alternativas, sem repetir na correta as palavras-chave do enunciado.
5. Não escreva letras nas alternativas: a ordem é sorteada depois. Pelo mesmo motivo, nunca cite letras (A, B, C…) nos comentários nem na explicação: cite o conteúdo.
6. Recurso visual, quando pedido, é necessário para responder (o enunciado o cita: "a tabela a seguir…") e traz dados verossímeis e coerentes. Sem recurso pedido, tipo "nenhum".
   tabela: cabecalho (2–5 colunas) e linhas (2–8). grafico: forma "barras" ou "linha", rotulos do eixo X (3–8), series (1–3) com valores numéricos, eixoY com unidade. esquema: forma "fluxo" ou "ciclo", etapas (3–6) curtas. citacao: texto (trecho verossímil de diretriz, consenso ou autor clássico) e autor.
7. Formatos:
   standard: alternativas independentes.
   multiple-affirmative: o enunciado termina com as afirmativas I, II, III e IV, uma por linha ("I. …"); as alternativas são combinações ("I e III, apenas"); varie qual combinação é a correta.
   assertion-reason: o enunciado traz "I. <asserção>" PORQUE "II. <razão>"; devolva as 5 alternativas clássicas nesta ordem: ambas verdadeiras e a II justifica a I; ambas verdadeiras e a II não justifica; I verdadeira e II falsa; I falsa e II verdadeira; ambas falsas.
   comparison: duas situações, estruturas ou condutas lado a lado; as alternativas são relações entre elas.
8. Estilo contextualizada: caso ou cenário realista de 4–7 linhas com dados concretos (idade, achados, valores). Estilo direta: 1–3 linhas.
9. Nível fácil: conceito central. Médio: aplicação que integra dois conceitos. Difícil: raciocínio em etapas, dado decisivo sutil, diagnóstico diferencial fino.
10. fonte: referência verossímil curta ("Adaptado de: Guyton & Hall, Tratado de Fisiologia Médica, 14. ed."), sem inventar DOI ou página.

RESPOSTA COMENTADA — é uma aula para quem errou, começando do zero:
- fundamento: o conceito-base explicado do zero, para quem nunca viu o tema (3–6 frases: definição, mecanismo, por que importa).
- raciocinio: o caminho de resolução passo a passo, citando os dados do enunciado e do recurso que decidem a questão.
- conclusao: por que a resposta certa é certa.
- pegadinha: a confusão mais comum neste tema e como não cair nela.
- paraFixar: 1–3 frases para memorizar (regra, mnemônico, número-chave).
- comentario de cada alternativa: por que está certa ou errada, nomeando o erro conceitual específico (1–3 frases). Nunca "está errada porque não é a correta".
Texto corrido, sem markdown e sem emojis.`

/** Formato achatado (o `responseSchema` não aceita união): o tipo diz quais campos valem. */
const ESQUEMA_RECURSO = {
  type: 'OBJECT',
  properties: {
    tipo: { type: 'STRING', enum: ['nenhum', 'tabela', 'grafico', 'esquema', 'citacao'] },
    titulo: { type: 'STRING' },
    cabecalho: { type: 'ARRAY', items: { type: 'STRING' } },
    linhas: { type: 'ARRAY', items: { type: 'ARRAY', items: { type: 'STRING' } } },
    forma: { type: 'STRING' },
    rotulos: { type: 'ARRAY', items: { type: 'STRING' } },
    series: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { nome: { type: 'STRING' }, valores: { type: 'ARRAY', items: { type: 'NUMBER' } } },
      },
    },
    eixoY: { type: 'STRING' },
    etapas: { type: 'ARRAY', items: { type: 'STRING' } },
    texto: { type: 'STRING' },
    autor: { type: 'STRING' },
  },
  required: ['tipo'],
}

const ESQUEMA_ALTERNATIVA = {
  type: 'OBJECT',
  properties: {
    texto: { type: 'STRING' },
    correta: { type: 'BOOLEAN' },
    comentario: { type: 'STRING' },
  },
  required: ['texto', 'correta', 'comentario'],
}

const ESQUEMA_LOTE = {
  type: 'OBJECT',
  properties: {
    questoes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          foco: { type: 'STRING' },
          enunciado: { type: 'STRING' },
          recurso: ESQUEMA_RECURSO,
          fonte: { type: 'STRING' },
          comando: { type: 'STRING' },
          alternativas: { type: 'ARRAY', items: ESQUEMA_ALTERNATIVA },
          fundamento: { type: 'STRING' },
          raciocinio: { type: 'STRING' },
          conclusao: { type: 'STRING' },
          pegadinha: { type: 'STRING' },
          paraFixar: { type: 'STRING' },
        },
        required: ['foco', 'enunciado', 'recurso', 'comando', 'alternativas', 'fundamento', 'raciocinio', 'conclusao', 'paraFixar'],
      },
    },
  },
  required: ['questoes'],
}

const ESQUEMA_REPARO = {
  type: 'OBJECT',
  properties: {
    reparos: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          indice: { type: 'INTEGER' },
          alternativas: {
            type: 'ARRAY',
            items: { type: 'OBJECT', properties: { texto: { type: 'STRING' }, comentario: { type: 'STRING' } }, required: ['texto', 'comentario'] },
          },
        },
        required: ['indice', 'alternativas'],
      },
    },
  },
  required: ['reparos'],
}

// ── Leitura ────────────────────────────────────────────────────────────────

interface AlternativaGerada {
  texto: string
  correta: boolean
  comentario: string
}

interface QuestaoGerada {
  vaga: VagaDaQuestao
  foco: string
  enunciado: string
  recurso: RecursoVisual | null
  fonte: string
  comando: string
  alternativas: AlternativaGerada[]
  fundamento: string
  raciocinio: string
  conclusao: string
  pegadinha: string
  paraFixar: string
}

const limpo = (v: unknown, max: number) =>
  typeof v === 'string'
    ? v
        .replace(/\r/g, '')
        .replace(/\*\*/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, max)
    : ''

/** Tira "A) ", "b. " e afins do começo — a letra é nossa, não da IA. */
const semLetra = (t: string) => t.replace(/^\s*(\(?[A-Ea-e][).:\-–]\s+)/, '').trim()

export function lerJson(texto: string): any {
  const t = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(t)
  } catch {
    const recorte = t.match(/\{[\s\S]*\}/)
    return recorte ? JSON.parse(recorte[0]) : null
  }
}

function lerQuestao(bruta: any, vaga: VagaDaQuestao): QuestaoGerada | null {
  if (!bruta || typeof bruta !== 'object') return null
  let alternativas: AlternativaGerada[] = (Array.isArray(bruta.alternativas) ? bruta.alternativas : []).slice(0, 6).map((a: any) => ({
    texto: semLetra(limpo(a?.texto, 600)),
    correta: a?.correta === true,
    comentario: limpo(a?.comentario, 900),
  }))
  if (vaga.formato === 'assertion-reason' && alternativas.length === 5) {
    // Texto canônico sempre: a IA às vezes "melhora" a redação e cria duas certas.
    alternativas = alternativas.map((a, i) => ({ ...a, texto: ALTERNATIVAS_ASSERCAO_RAZAO[i] }))
  }
  const recurso = vaga.recurso ? sanitizarRecurso(bruta.recurso) : null
  return {
    vaga,
    foco: limpo(bruta.foco, 120),
    enunciado: limpo(bruta.enunciado, 3000),
    recurso,
    fonte: limpo(bruta.fonte, 220),
    comando: normalizarComando(limpo(bruta.comando, 400)),
    alternativas,
    fundamento: limpo(bruta.fundamento, 2500),
    raciocinio: limpo(bruta.raciocinio, 2500),
    conclusao: limpo(bruta.conclusao, 1200),
    pegadinha: limpo(bruta.pegadinha, 900),
    paraFixar: limpo(bruta.paraFixar, 700),
  }
}

function auditar(q: QuestaoGerada, alternativas: number): Alerta[] {
  const esperadas = q.vaga.formato === 'assertion-reason' ? 5 : alternativas
  const alertas = auditarQuestao(
    { formato: q.vaga.formato, enunciado: q.enunciado, comando: q.comando, alternativas: q.alternativas, temRecurso: !!q.recurso },
    esperadas,
  )
  if (!q.enunciado || !q.comando || !q.fundamento) {
    alertas.push({ codigo: 'formato-incoerente', gravidade: 'estrutural', detalhe: 'campo obrigatório vazio' })
  }
  return alertas
}

// ── Montagem da questão final ──────────────────────────────────────────────

/** A resposta comentada como aula, em seções — o PDF põe `**…**` em negrito e a tela vira título. */
export function montarExplicacao(q: Pick<QuestaoGerada, 'fundamento' | 'raciocinio' | 'conclusao' | 'pegadinha' | 'paraFixar'>): string {
  return [
    ['Do zero: o que você precisa saber', q.fundamento],
    ['Como resolver, passo a passo', q.raciocinio],
    ['Por que esta é a resposta', q.conclusao],
    ['Pegadinha', q.pegadinha],
    ['Para fixar', q.paraFixar],
  ]
    .filter(([, texto]) => texto)
    .map(([titulo, texto]) => `**${titulo}**\n${texto}`)
    .join('\n\n')
}

export function montarQuestao(q: QuestaoGerada, aleatorio: () => number = Math.random): Question {
  const ordem =
    q.vaga.formato === 'assertion-reason'
      ? q.alternativas.map((_, i) => i)
      : ordemComCorretaEm(q.alternativas, q.vaga.posicaoCorreta, aleatorio)
  const alternatives: Alternative[] = ordem.map((indice, posicao) => ({
    id: uuidv4(),
    letter: String.fromCharCode(65 + posicao),
    text: q.alternativas[indice].texto,
    isCorrect: q.alternativas[indice].correta,
  }))
  const explanations: Record<string, string> = {}
  ordem.forEach((indice, posicao) => {
    const comentario = q.alternativas[indice].comentario
    if (comentario) explanations[String.fromCharCode(65 + posicao)] = comentario
  })
  const correta = alternatives.find((a) => a.isCorrect)!
  return {
    id: uuidv4(),
    number: 0,
    type: 'multiple-choice',
    statement: q.enunciado,
    statementSource: q.fonte || undefined,
    supportMaterial: q.recurso || undefined,
    command: q.comando,
    alternatives,
    alternativeType: q.vaga.formato,
    explanation: montarExplicacao(q),
    commentedFeedback: { correctAlternative: correta.letter, explanations },
    aiInfo: { tema: q.vaga.tema, foco: q.foco, nivel: q.vaga.nivel },
  }
}

// ── Chamadas ───────────────────────────────────────────────────────────────

function registrarUso(rotulo: string, dados: any, modelo: string) {
  const u = dados?.usageMetadata
  if (!u) return
  console.info(
    `[ia/provas] ${rotulo} ${modelo}: entrada ${u.promptTokenCount ?? '?'} (cache ${u.cachedContentTokenCount ?? 0}), saída ${u.candidatesTokenCount ?? '?'}, raciocínio ${u.thoughtsTokenCount ?? 0}`,
  )
}

export interface PedidoDeLote {
  vagas: VagaDaQuestao[]
  alternativas: number
  contexto: string
  /** Focos já usados na prova — a IA não repete. */
  evitar: string[]
}

function promptDoLote(p: PedidoDeLote): string {
  const linhas = p.vagas.map(
    (v, i) =>
      `${i + 1}) tema: ${v.tema} | formato: ${ROTULO_FORMATO[v.formato]} | estilo: ${v.estilo} | nível: ${ROTULO_NIVEL[v.nivel]} | recurso: ${v.recurso ?? 'nenhum'}`,
  )
  const evitar = p.evitar.length ? `\nNão repita estes focos, já usados na prova: ${p.evitar.slice(-30).join('; ')}.` : ''
  return `Banca/contexto: ${p.contexto}
Alternativas por questão: ${p.alternativas} (asserção-razão sempre 5).
Gere ${p.vagas.length} questão(ões), nesta ordem:
${linhas.join('\n')}${evitar}`
}

async function chamar(prompt: string, esquema: unknown, maxSaida: number, prazoMs: number) {
  return gerarConteudoGemini({
    secao: 'personalExams',
    corpo: {
      systemInstruction: { parts: [{ text: INSTRUCAO_DO_SISTEMA }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxSaida,
        responseMimeType: 'application/json',
        responseSchema: esquema,
      },
    },
    raciocinio: 'baixo',
    timeoutMs: Math.min(prazoMs - 2_000, 75_000),
    prazoMs,
  })
}

/**
 * Reescreve só as alternativas das questões que a auditoria reprovou. A
 * correção mantém a posição da correta (o índice de cada alternativa é o
 * mesmo), então o comentário e o gabarito continuam valendo.
 */
async function repararDistratoras(itens: { q: QuestaoGerada; alertas: Alerta[] }[], prazoMs: number): Promise<void> {
  if (itens.length === 0 || prazoMs < 12_000) return
  const blocos = itens.map(({ q, alertas }, indice) => {
    const recurso = q.recurso ? `\nRecurso: ${recursoEmTexto(q.recurso).slice(0, 500)}` : ''
    const alts = q.alternativas.map((a, i) => `  ${i}. [${a.correta ? 'CORRETA' : 'distratora'}] ${a.texto}`).join('\n')
    const problemas = Array.from(new Set(alertas.map((a) => INSTRUCAO_DO_ALERTA[a.codigo]))).join('; ')
    return `### Questão ${indice}\nEnunciado: ${q.enunciado.slice(0, 900)}${recurso}\nComando: ${q.comando}\nAlternativas:\n${alts}\nProblemas: ${problemas}`
  })
  const prompt = `Revise as alternativas das questões abaixo. Corrija os problemas apontados mantendo o conteúdo correto e o gabarito: devolva TODAS as alternativas de cada questão na MESMA ordem (a de índice da CORRETA continua correta; as distratoras continuam erradas, agora com erros conceituais plausíveis), cada uma com o comentário de por que está certa ou errada. Siga as regras da questão.\n\n${blocos.join('\n\n')}`
  try {
    const { texto, dados, modelo } = await chamar(prompt, ESQUEMA_REPARO, 4096, prazoMs)
    registrarUso(`reparo de ${itens.length}`, dados, modelo)
    const lido = lerJson(texto)
    for (const reparo of Array.isArray(lido?.reparos) ? lido.reparos : []) {
      const item = itens[Number(reparo?.indice)]
      if (!item || !Array.isArray(reparo.alternativas) || reparo.alternativas.length !== item.q.alternativas.length) continue
      item.q.alternativas = item.q.alternativas.map((a, i) => ({
        correta: a.correta,
        texto: semLetra(limpo(reparo.alternativas[i]?.texto, 600)) || a.texto,
        comentario: limpo(reparo.alternativas[i]?.comentario, 900) || a.comentario,
      }))
    }
  } catch (erro) {
    // O reparo é melhoria, não condição: a questão original segue.
    console.warn('[ia/provas] reparo indisponível:', erro instanceof Error ? erro.message.slice(0, 160) : 'erro')
  }
}

export interface ResultadoDoLote {
  questoes: Question[]
  /** Vagas que não viraram questão (descartadas pela auditoria ou não devolvidas). */
  faltaram: VagaDaQuestao[]
  auditoria: { reparadas: number; descartadas: number; alertasRestantes: number }
}

export async function gerarLoteDeQuestoes(p: PedidoDeLote, prazoMs = 85_000): Promise<ResultadoDoLote> {
  const inicio = Date.now()
  const saidaPorQuestao = 1_900
  const { texto, dados, modelo } = await chamar(promptDoLote(p), ESQUEMA_LOTE, Math.max(4_096, saidaPorQuestao * p.vagas.length), prazoMs)
  registrarUso(`lote de ${p.vagas.length}`, dados, modelo)

  const lido = lerJson(texto)
  const brutas: any[] = Array.isArray(lido?.questoes) ? lido.questoes : []
  const geradas = p.vagas.map((vaga, i) => lerQuestao(brutas[i], vaga))

  const aprovadas: { q: QuestaoGerada; alertas: Alerta[] }[] = []
  const faltaram: VagaDaQuestao[] = []
  let descartadas = 0
  geradas.forEach((q, i) => {
    if (!q) {
      faltaram.push(p.vagas[i])
      return
    }
    const alertas = auditar(q, p.alternativas)
    if (precisaDescartar(alertas)) {
      descartadas++
      faltaram.push(p.vagas[i])
      return
    }
    aprovadas.push({ q, alertas })
  })

  const paraReparar = aprovadas.filter((a) => precisaReparar(a.alertas))
  await repararDistratoras(paraReparar, prazoMs - (Date.now() - inicio))

  let alertasRestantes = 0
  const questoes: Question[] = []
  for (const { q } of aprovadas) {
    const alertas = auditar(q, p.alternativas)
    if (precisaDescartar(alertas)) {
      descartadas++
      faltaram.push(q.vaga)
      continue
    }
    alertasRestantes += alertas.length
    questoes.push(montarQuestao(q))
  }

  return { questoes, faltaram, auditoria: { reparadas: paraReparar.length, descartadas, alertasRestantes } }
}
