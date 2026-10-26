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
 *  - UMA chamada por questão, já com a resposta comentada, e várias questões
 *    ao mesmo tempo (a tela dispara cinco requisições em paralelo): a prova
 *    de dez sai em ~20 s, não em minutos. O lote de três numa chamada só
 *    passava dos 30 s que a função tinha e morria no meio;
 *  - as regras moram em `systemInstruction`, idênticas em toda chamada: é o
 *    prefixo que o cache implícito do Gemini reaproveita entre lotes (paga-se
 *    ~25% do preço pelos tokens em cache);
 *  - saída com `responseSchema`: JSON puro, sem markdown nem texto em volta,
 *    sem exemplo nenhum no prompt;
 *  - modelo rápido (`modelosRapidos`: 3.5 Flash-Lite → 3.8 Flash → 2.5
 *    Flash) com raciocínio mínimo — quem segura a qualidade é a auditoria
 *    (`auditoria-de-questoes.ts`), não tokens de pensamento;
 *  - só a questão que a auditoria reprova volta para a IA, numa chamada de
 *    reparo que leva apenas o comando e as alternativas.
 *
 * Cada chamada registra no log quantos tokens entraram, saíram e vieram do
 * cache, para dar para medir o custo real por prova.
 */

import { v4 as uuidv4 } from 'uuid'

import { gerarConteudoGemini, modelosRapidos } from '@/lib/ia/gemini'
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
    try {
      return recorte ? JSON.parse(recorte[0]) : null
    } catch {
      // JSON cortado (saída truncada): quem chama trata como "não veio".
      return null
    }
  }
}

function lerQuestao(bruta: any, vaga: VagaDaQuestao, alternativasPedidas: number): QuestaoGerada | null {
  if (!bruta || typeof bruta !== 'object') return null
  let alternativas: AlternativaGerada[] = (Array.isArray(bruta.alternativas) ? bruta.alternativas : []).slice(0, 6).map((a: any) => ({
    texto: semLetra(limpo(a?.texto, 600)),
    correta: a?.correta === true || a?.correta === 'true',
    comentario: limpo(a?.comentario, 900),
  }))
  // Alternativa a mais: sai uma distratora do fim, em vez de perder a questão.
  const esperadas = vaga.formato === 'assertion-reason' ? 5 : alternativasPedidas
  while (alternativas.length > esperadas) {
    const k = alternativas.map((a) => a.correta).lastIndexOf(false)
    if (k < 0) break
    alternativas.splice(k, 1)
  }
  if (vaga.formato === 'assertion-reason' && alternativas.length === 5) {
    // Texto canônico sempre: a IA às vezes "melhora" a redação e cria duas certas.
    alternativas = alternativas.map((a, i) => ({ ...a, texto: ALTERNATIVAS_ASSERCAO_RAZAO[i] }))
  }
  // Recurso que veio e desenha fica, mesmo sem ter sido pedido: o enunciado
  // provavelmente o cita, e jogar fora deixaria a questão sem o dado.
  const recurso = sanitizarRecurso(bruta.recurso)
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

/**
 * Uma chamada com tempo de quem está esperando na tela: tentativa curta (o
 * modelo rápido responde uma questão em ~5–10 s; se passou de `tentativaMs`,
 * algo travou e vale mais pular para o próximo modelo do que esperar) e prazo
 * total abaixo do teto da função (60 s em `vercel.json`).
 */
async function chamar(
  prompt: string,
  esquema: unknown,
  maxSaida: number,
  prazoMs: number,
  tentativaMs = 24_000,
  modelos: string[] = modelosRapidos(),
) {
  return gerarConteudoGemini({
    secao: 'personalExams',
    modelos,
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
    raciocinio: 'minimo',
    timeoutMs: Math.max(5_000, Math.min(prazoMs - 1_000, tentativaMs)),
    prazoMs,
  })
}

/**
 * Reescreve só as alternativas das questões que a auditoria reprovou. A
 * correção mantém a posição da correta (o índice de cada alternativa é o
 * mesmo), então o comentário e o gabarito continuam valendo.
 */
async function repararDistratoras(itens: { q: QuestaoGerada; alertas: Alerta[] }[], prazoMs: number): Promise<void> {
  // Reparo é melhoria: só entra se ainda couber na função com folga.
  if (itens.length === 0 || prazoMs < 14_000) return
  const blocos = itens.map(({ q, alertas }, indice) => {
    const recurso = q.recurso ? `\nRecurso: ${recursoEmTexto(q.recurso).slice(0, 500)}` : ''
    const alts = q.alternativas.map((a, i) => `  ${i}. [${a.correta ? 'CORRETA' : 'distratora'}] ${a.texto}`).join('\n')
    const problemas = Array.from(new Set(alertas.map((a) => INSTRUCAO_DO_ALERTA[a.codigo]))).join('; ')
    return `### Questão ${indice}\nEnunciado: ${q.enunciado.slice(0, 900)}${recurso}\nComando: ${q.comando}\nAlternativas:\n${alts}\nProblemas: ${problemas}`
  })
  const prompt = `Revise as alternativas das questões abaixo. Corrija os problemas apontados mantendo o conteúdo correto e o gabarito: devolva TODAS as alternativas de cada questão na MESMA ordem (a de índice da CORRETA continua correta; as distratoras continuam erradas, agora com erros conceituais plausíveis), cada uma com o comentário de por que está certa ou errada. Siga as regras da questão.\n\n${blocos.join('\n\n')}`
  try {
    const { texto, dados, modelo } = await chamar(prompt, ESQUEMA_REPARO, 1_500 * itens.length, prazoMs - 2_000, 14_000)
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
  /** Por que alguma vaga não virou questão — vai para o log e para a tela. */
  motivos: string[]
}

interface Rodada {
  aprovadas: { q: QuestaoGerada; alertas: Alerta[] }[]
  faltaram: VagaDaQuestao[]
  descartadas: number
  motivos: string[]
}

/** Uma chamada para um conjunto de vagas: lê, audita e separa o que presta. */
async function rodada(p: PedidoDeLote, vagas: VagaDaQuestao[], prazoMs: number, modelos: string[]): Promise<Rodada> {
  const saidaPorQuestao = 2_400
  const { texto, dados, modelo } = await chamar(
    promptDoLote({ ...p, vagas }),
    ESQUEMA_LOTE,
    saidaPorQuestao * vagas.length,
    prazoMs,
    Math.min(prazoMs, 24_000 + 8_000 * (vagas.length - 1)),
    modelos,
  )
  registrarUso(`${vagas.length} questão(ões)`, dados, modelo)
  const fim = dados?.candidates?.[0]?.finishReason
  const lido = lerJson(texto)
  const brutas: any[] = Array.isArray(lido?.questoes) ? lido.questoes : []
  const r: Rodada = { aprovadas: [], faltaram: [], descartadas: 0, motivos: [] }
  if (!brutas.length) r.motivos.push(`${modelo}: resposta sem questões${fim && fim !== 'STOP' ? ` (${fim})` : ''}`)
  vagas.forEach((vaga, i) => {
    const q = lerQuestao(brutas[i], vaga, p.alternativas)
    if (!q) {
      r.faltaram.push(vaga)
      return
    }
    const alertas = auditar(q, p.alternativas)
    if (precisaDescartar(alertas)) {
      r.descartadas++
      r.faltaram.push(vaga)
      r.motivos.push(`${modelo}: ${alertas.filter((a) => a.gravidade === 'estrutural').map((a) => `${a.codigo} (${a.detalhe})`).join(', ')}`)
      return
    }
    r.aprovadas.push({ q, alertas })
  })
  return r
}

/** A escada de modelos com o primeiro passando para o fim: a 2ª tentativa começa por outro. */
function girar(modelos: string[]): string[] {
  return modelos.length > 1 ? [...modelos.slice(1), modelos[0]] : modelos
}

export async function gerarLoteDeQuestoes(p: PedidoDeLote, prazoMs = 52_000): Promise<ResultadoDoLote> {
  const inicio = Date.now()
  const resta = () => prazoMs - (Date.now() - inicio)
  const modelos = modelosRapidos()
  const aprovadas: Rodada['aprovadas'] = []
  const motivos: string[] = []
  let pendentes = p.vagas
  let descartadas = 0
  let erro: unknown = null

  // Até duas rodadas dentro da mesma requisição: o que a primeira não
  // entregou (descartado, JSON cortado, modelo fora do ar) vai de novo,
  // começando por outro modelo — sem a tela precisar esperar e reenviar.
  for (let tentativa = 0; tentativa < 2 && pendentes.length && resta() > 18_000; tentativa++) {
    try {
      const r = await rodada(p, pendentes, resta() - 10_000, tentativa === 0 ? modelos : girar(modelos))
      aprovadas.push(...r.aprovadas)
      descartadas += r.descartadas
      motivos.push(...r.motivos)
      pendentes = r.faltaram
    } catch (e) {
      erro = e
      motivos.push(e instanceof Error ? e.message.slice(0, 200) : 'falha ao chamar a IA')
    }
  }
  if (aprovadas.length === 0 && erro) throw erro

  const paraReparar = aprovadas.filter((a) => precisaReparar(a.alertas))
  await repararDistratoras(paraReparar, resta())

  let alertasRestantes = 0
  const questoes: Question[] = []
  for (const { q } of aprovadas) {
    const alertas = auditar(q, p.alternativas)
    if (precisaDescartar(alertas)) {
      descartadas++
      pendentes = [...pendentes, q.vaga]
      continue
    }
    alertasRestantes += alertas.length
    questoes.push(montarQuestao(q))
  }
  if (motivos.length) console.warn('[ia/provas] vagas perdidas ou refeitas:', motivos.join(' | ').slice(0, 600))

  return { questoes, faltaram: pendentes, auditoria: { reparadas: paraReparar.length, descartadas, alertasRestantes }, motivos }
}
