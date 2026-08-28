/**
 * Transcrição da imagem do calendário de provas.
 *
 * Aqui mora a única parte não determinística do fluxo: pedir ao Gemini que
 * LEIA a tabela e devolva as linhas dela. Nada mais. Quem decide o que vira
 * avaliação — fuso, ano, períodos, duplicata — é `extracao.ts`, que é código
 * puro e testado.
 *
 * A fronteira é de propósito: modelo transcreve, código decide. Se um dia a
 * leitura sair torta, o conserto é num teste, não numa frase do prompt.
 *
 * Uma chamada por imagem, em paralelo: são tabelas independentes, e um PNG
 * ilegível no meio do lote não pode derrubar a leitura dos outros.
 */

import 'server-only'

import { getDb } from '@/lib/mongodb'
import { getAllAIKeys } from '@/lib/ai-keys'
import type { LinhaExtraida } from './extracao'

/**
 * O `gemini-2.5-flash` é o modelo que o resto da plataforma já usa e que a tela
 * de configurações testa; o `2.0-flash` é a queda suave para chave que ainda
 * não o alcança.
 *
 * O `1.5-flash` saiu da lista: a API responde "not found for API version
 * v1beta" para ele. Era um degrau morto que só gastava tempo do orçamento e,
 * pior, o erro DELE era o que aparecia na tela — escondendo o motivo real da
 * falha dos dois modelos que importam.
 */
const MODELOS = ['gemini-2.5-flash', 'gemini-2.0-flash']

/**
 * Quanto uma tentativa pode demorar.
 *
 * O `2.5-flash` é modelo *thinking*: numa tabela densa ele passa fácil de 20s
 * mesmo com o raciocínio desligado (o gerador de questões, que usa o mesmo
 * modelo, espera 45s). Cortar antes disso não protege ninguém — só transforma
 * leitura lenta em leitura perdida, que foi exatamente o que acontecia quando
 * cinco imagens dividiam uma requisição só.
 */
const TIMEOUT_MS = 45_000

/**
 * Orçamento da requisição inteira. Como o painel manda UMA imagem por
 * requisição, o orçamento é todo dela — e ainda sobra folga dentro dos 60s da
 * função para uma segunda tentativa curta.
 */
const ORCAMENTO_MS = 55_000

export interface ArquivoParaLer {
  nome: string
  /** MIME já validado pela rota (imagem ou PDF). */
  mime: string
  base64: string
}

export interface LeituraDeArquivo {
  nome: string
  linhas: LinhaExtraida[]
  /** Preenchido quando a leitura falhou; `linhas` vem vazio. */
  erro?: string
}

/**
 * O prompt.
 *
 * Ele descreve o documento real — a tabela que a coordenação publica — em vez
 * de pedir "extraia as provas". A diferença aparece nas três colunas de fuso:
 * sem dizer qual vale, o modelo escolhe sozinho e a metade dos horários entra
 * uma hora deslocada.
 *
 * O que ele NÃO faz: converter data, deduzir ano, expandir período, decidir
 * duplicata. Tudo isso é transcrição para campo cru e decisão do código.
 */
const INSTRUCOES = `Você lê CALENDÁRIOS DE AVALIAÇÕES de uma faculdade brasileira (Medicina, Psicologia, Biomedicina, Odontologia) publicados como imagem ou PDF: tabelas com as provas de um semestre.

Sua tarefa é TRANSCREVER a tabela, linha por linha, para JSON. Não interprete, não calcule, não converta: copie o que está escrito.

Colunas que costumam aparecer:
- Curso (Medicina, Psicologia…), Categoria (N1 Específica, N2, N3, Prova Integrada, Simulado)
- Data (quase sempre só dia/mês, ex.: "24/11"), Dia da Semana
- Denominação: "Aluno Regular" ou "Aluno Caso Especial" (a mesma prova com tempo estendido)
- VÁRIAS colunas de horário, uma por fuso: "Horário (Brasília)", "Horário (Unidades Rondônia)", "Horário (CZS–AC)"
- Período ("1º Período", "1º ao 8º Período", "Todos os períodos") OU Eixo ("SOI 1", "HAM 8", "MCM 3", "IESC 5", "CI 2")

Regras:
1. HORÁRIO: o campo "horario" recebe SEMPRE a coluna de Brasília, copiada como está ("10h – 11h20"). As outras colunas de fuso vão juntas em "horarioOutrosFusos" ("Rondônia 09h–10h20; CZS–AC 08h–09h20"). Se só existir uma coluna de horário, ela é a de Brasília.
2. DATA: copie exatamente como aparece ("24/11", "03/11"). Não invente ano, não converta formato.
3. PERÍODO: copie a célula inteira como texto, sem expandir ("1º ao 8º Período" continua "1º ao 8º Período"). Se a linha valer para vários períodos listados, use um item por texto do array.
4. EIXO: quando existir coluna de eixo, preencha "eixo" ("SOI 1", "HAM 8"). Não transforme eixo em período.
5. CASO ESPECIAL: uma linha "Aluno Regular" e a linha "Aluno Caso Especial" logo abaixo são a MESMA prova. Devolva a linha regular com "denominacao": "Aluno Regular" e "horarioCasosEspeciais" preenchido com o horário de Brasília da linha de caso especial. Não devolva a linha de caso especial separada.
6. Uma linha do JSON para cada linha real da tabela. Um bloco que se repete para manhã e tarde são duas linhas.
7. Texto fora da tabela que valha para todas as linhas (duração, "N3 ESPECÍFICA – 1º AO 8º PERÍODO – MEDICINA") entra em "duracao"/"categoria"/"curso" das linhas correspondentes.
8. CURSO INTEIRO: prova aplicada a todos os períodos no mesmo dia (TPI, Teste de Progresso, prova integrada geral) costuma não ter coluna de período. Copie em "periodos" o que estiver escrito ("Todos os períodos") e mantenha a categoria ("TPI", "Teste de Progresso") em "categoria". Não invente uma lista de períodos.
9. Se a imagem não for um calendário de avaliações, devolva {"linhas": []}.

Responda SOMENTE com o JSON.`

/** Esquema enxuto e todo em texto: o modelo transcreve, o código tipa. */
const ESQUEMA = {
  type: 'OBJECT',
  properties: {
    linhas: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          curso: { type: 'STRING' },
          categoria: { type: 'STRING' },
          titulo: { type: 'STRING' },
          data: { type: 'STRING' },
          diaDaSemana: { type: 'STRING' },
          turno: { type: 'STRING' },
          denominacao: { type: 'STRING' },
          horario: { type: 'STRING' },
          horarioCasosEspeciais: { type: 'STRING' },
          horarioOutrosFusos: { type: 'STRING' },
          eixo: { type: 'STRING' },
          periodos: { type: 'ARRAY', items: { type: 'STRING' } },
          local: { type: 'STRING' },
          duracao: { type: 'STRING' },
          observacao: { type: 'STRING' },
          tipo: { type: 'STRING' },
        },
      },
    },
  },
  required: ['linhas'],
} as const

/**
 * Todas as chaves do Gemini disponíveis, em ordem de preferência.
 *
 * Mesma escada do gerador de questões: a chave de seção configurada no painel,
 * a chave geral de `settings` e, por último, o ambiente. Tentar a próxima
 * quando uma falha é o que impede que uma cota estourada em outra área do site
 * derrube a importação do calendário.
 */
async function chavesDoGemini(): Promise<string[]> {
  const chaves: string[] = []

  const adicionar = (valor?: string | null) => {
    if (valor && !chaves.includes(valor)) chaves.push(valor)
  }

  try {
    const db = await getDb()
    const settings = await db.collection('settings').findOne({})
    adicionar(settings?.geminiApiKey)

    const doPainel = await getAllAIKeys()
    for (const chave of Object.values(doPainel ?? {})) adicionar(chave as string)
  } catch (erro) {
    console.error('[cronogramas] falha ao buscar chaves do Gemini:', erro)
  }

  adicionar(process.env.GEMINI_API_KEY)
  adicionar(process.env.GOOGLE_AI_API_KEY)

  return chaves
}

/** O JSON pode vir cercado de ``` mesmo com `responseMimeType` — não custa tolerar. */
function extrairJson(texto: string): any {
  const recorte = texto.match(/\{[\s\S]*\}/)
  if (!recorte) throw new Error('resposta sem JSON')
  return JSON.parse(recorte[0])
}

function normalizarLinhas(bruto: any): LinhaExtraida[] {
  const linhas = Array.isArray(bruto?.linhas) ? bruto.linhas : Array.isArray(bruto) ? bruto : []
  return linhas
    .filter((linha: unknown) => linha && typeof linha === 'object')
    .slice(0, 200) as LinhaExtraida[]
}

async function chamarGemini(
  modelo: string,
  chave: string,
  arquivo: ArquivoParaLer,
  desligarRaciocinio: boolean,
): Promise<LinhaExtraida[]> {
  const controlador = new AbortController()
  const alarme = setTimeout(() => controlador.abort(), TIMEOUT_MS)

  try {
    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': chave },
        signal: controlador.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: INSTRUCOES },
                { inline_data: { mime_type: arquivo.mime, data: arquivo.base64 } },
              ],
            },
          ],
          generationConfig: {
            // Transcrição não é lugar para criatividade.
            temperature: 0,
            topP: 0.95,
            // Uma tabela de quinze linhas transcrita passa dos 4k tokens; a
            // folga evita resposta cortada no meio, que voltaria como JSON
            // inválido em vez de erro claro.
            maxOutputTokens: 16384,
            responseMimeType: 'application/json',
            responseSchema: ESQUEMA,
            // Copiar uma tabela não precisa de raciocínio, e no 2.5 o
            // "pensar" antes de responder é o que fazia a leitura estourar o
            // tempo. Só o 2.5 aceita o campo; mandá-lo para os outros vira 400.
            ...(desligarRaciocinio && modelo.startsWith('gemini-2.5')
              ? { thinkingConfig: { thinkingBudget: 0 } }
              : {}),
          },
        }),
      },
    )

    if (!resposta.ok) {
      const detalhe = await resposta.json().catch(() => null)
      const falha = new Error(detalhe?.error?.message || `HTTP ${resposta.status}`)
      // O código vai junto: 429 e 503 são fila cheia do lado deles, e merecem
      // outra tentativa; 400 e 404 são definitivos e insistir só gasta o prazo.
      ;(falha as Error & { status?: number }).status = resposta.status
      throw falha
    }

    const dados = await resposta.json()
    const candidato = dados?.candidates?.[0]
    const texto = candidato?.content?.parts?.[0]?.text

    if (!texto) {
      // `finishReason` é o que separa "a imagem não é um calendário" de
      // "a resposta foi cortada no meio" (MAX_TOKENS) e de bloqueio por
      // política. Sem ele, toda falha vira o mesmo "resposta vazia" e a
      // próxima investigação começa do zero.
      const motivo = candidato?.finishReason || dados?.promptFeedback?.blockReason || 'sem conteúdo'
      throw new Error(`resposta vazia (${motivo})`)
    }

    return normalizarLinhas(extrairJson(texto))
  } finally {
    clearTimeout(alarme)
  }
}

/** Espera curta entre tentativas, para não bater na mesma fila cheia. */
function esperar(ms: number): Promise<void> {
  return new Promise(resolver => setTimeout(resolver, ms))
}

/** Junta os motivos das tentativas sem repetir o mesmo texto duas vezes. */
function resumirErros(erros: string[], semTempo: boolean): string {
  const unicos = [...new Set(erros)]
  const texto = unicos.join(' · ').slice(0, 400)

  if (!texto) return semTempo ? 'a leitura demorou demais' : 'não foi possível ler'
  return semTempo ? `${texto} — e o tempo acabou antes de outra tentativa` : texto
}

/**
 * Lê um arquivo, tentando cada modelo com cada chave até um responder.
 *
 * A ordem é modelo por fora e chave por dentro: quando a chave certa existe,
 * a falha quase sempre é do modelo (indisponível para aquela chave), e insistir
 * no melhor modelo com todas as chaves antes de cair para o mais fraco é o que
 * mantém a qualidade da transcrição.
 *
 * O que volta em caso de falha são TODOS os motivos, não o último. Guardar só o
 * último fazia a tela mostrar o erro do degrau mais fraco da escada — o que
 * menos explica a falha — e escondia o que o modelo principal tinha dito.
 */
async function lerArquivo(
  arquivo: ArquivoParaLer,
  chaves: string[],
  prazo: number,
): Promise<LeituraDeArquivo> {
  const erros: string[] = []
  let comRaciocinioDesligado = true

  for (const modelo of MODELOS) {
    for (const chave of chaves) {
      // Duas passadas na mesma dupla modelo/chave: a segunda existe para fila
      // cheia (429/503) e para a chave que não aceita desligar o raciocínio.
      for (let tentativa = 1; tentativa <= 2; tentativa++) {
        // A função tem tempo contado: insistir até o processo ser morto
        // devolveria 504 sem resposta nenhuma.
        if (Date.now() > prazo) {
          return { nome: arquivo.nome, linhas: [], erro: resumirErros(erros, true) }
        }

        try {
          return {
            nome: arquivo.nome,
            linhas: await chamarGemini(modelo, chave, arquivo, comRaciocinioDesligado),
          }
        } catch (erro) {
          const mensagem = erro instanceof Error ? erro.message : String(erro)
          const status = (erro as { status?: number })?.status

          erros.push(`${modelo}: ${mensagem}`)
          console.error(`[cronogramas] ${modelo} falhou em "${arquivo.nome}":`, mensagem)

          // Fila cheia do lado deles — cinco imagens seguidas na mesma chave
          // batem nisso — e uma espera curta costuma resolver.
          if ((status === 429 || status === 503) && tentativa === 1) {
            await esperar(1500)
            continue
          }

          // Chave que não conhece `thinkingConfig`: vale repetir com o campo
          // fora antes de trocar de modelo.
          if (comRaciocinioDesligado && /thinking/i.test(mensagem) && tentativa === 1) {
            comRaciocinioDesligado = false
            continue
          }

          break
        }
      }
    }
  }

  return { nome: arquivo.nome, linhas: [], erro: resumirErros(erros, false) }
}

export async function lerCalendarios(arquivos: ArquivoParaLer[]): Promise<LeituraDeArquivo[]> {
  const chaves = await chavesDoGemini()
  if (chaves.length === 0) {
    throw new Error('API Key do Gemini não configurada. Configure em Configurações > API Gemini.')
  }

  const prazo = Date.now() + ORCAMENTO_MS
  return Promise.all(arquivos.map(arquivo => lerArquivo(arquivo, chaves, prazo)))
}
