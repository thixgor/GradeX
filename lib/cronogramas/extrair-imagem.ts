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
 * A escada de modelos.
 *
 * Ela envelhece sozinha: o `1.5-flash` sumiu do v1beta, e logo depois o
 * `2.0-flash` respondeu "no longer available, use models/gemini-3.6-flash".
 * Duas aposentadorias em poucos dias, cada uma custando uma rodada de deploy.
 *
 * Por isso a lista é configurável por ambiente (`GEMINI_MODELOS`, separados
 * por vírgula): quando o Google aposentar o próximo, dá para trocar sem
 * publicar código. O padrão abaixo vai do modelo atual para o anterior e
 * termina no apelido `flash-latest`, que o Google mantém sempre apontado para
 * a geração vigente — é a rede que impede a lista inteira de morrer junto.
 */
const MODELOS = (process.env.GEMINI_MODELOS || 'gemini-3.6-flash,gemini-2.5-flash,gemini-flash-latest')
  .split(',')
  .map(modelo => modelo.trim())
  .filter(Boolean)

/** Esperas entre tentativas na mesma dupla modelo/chave. */
const ESPERAS_MS = [1_500, 4_000]

/**
 * Fila cheia do lado deles: vale insistir, não trocar de modelo.
 *
 * "This model is currently experiencing high demand" chega como 429, 503 ou
 * até 500, dependendo do dia — então o texto conta tanto quanto o código.
 * Trocar de modelo aqui seria abrir mão da melhor transcrição por causa de uma
 * fila que costuma andar em segundos.
 */
function ehSobrecarga(status: number | undefined, mensagem: string): boolean {
  if (status === 429 || status === 503 || status === 500) return true
  return /high demand|overloaded|unavailable|try again later|temporar/i.test(mensagem)
}

/**
 * Quanto uma tentativa pode demorar.
 *
 * O tempo de leitura cresce com o TAMANHO da transcrição, não com o da imagem:
 * a tabela de N3 (8 linhas) sai em segundos, a de N2 com quinze linhas e eixo
 * leva bem mais. Noventa segundos cobrem a maior que a coordenação publica.
 */
const TIMEOUT_MS = 90_000

/**
 * Orçamento da requisição inteira, com folga para a função (300s) responder.
 *
 * O corte de 45s com orçamento de 55s produzia 504: a primeira tentativa ia
 * até 45s, o teste de prazo passava por pouco, a segunda começava e a função
 * era morta no meio dela. Agora o que decide não é "o prazo já passou?" e sim
 * "ainda cabe uma tentativa inteira?" — ver `tempoDisponivel`.
 */
const ORCAMENTO_MS = 240_000

/** Abaixo disso não vale começar: a tentativa não terminaria a tempo. */
const MINIMO_POR_TENTATIVA = 20_000

/**
 * Quanto uma tentativa pode durar agora, sem estourar o orçamento.
 * `null` quando não sobra tempo para tentar de novo.
 */
function tempoDisponivel(prazo: number): number | null {
  const restante = prazo - Date.now()
  if (restante < MINIMO_POR_TENTATIVA) return null
  return Math.min(TIMEOUT_MS, restante - 2_000)
}

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
- Chamada, nas provas com reaplicação: "1ª Chamada Regular", "2ª Chamada Regular + 1ª Chamada PROUNI/FIES e entrada tardia"

Regras:
1. HORÁRIO: o campo "horario" recebe SEMPRE a coluna de Brasília, copiada como está ("10h – 11h20"). As outras colunas de fuso vão juntas em "horarioOutrosFusos" ("Rondônia 09h–10h20; CZS–AC 08h–09h20"). Se só existir uma coluna de horário, ela é a de Brasília.
2. DATA: copie exatamente como aparece ("24/11", "03/11"). Não invente ano, não converta formato.
3. PERÍODO: copie a célula inteira como texto, sem expandir ("1º ao 8º Período" continua "1º ao 8º Período"). Se a linha valer para vários períodos listados, use um item por texto do array.
4. EIXO: quando existir coluna de eixo, preencha "eixo" ("SOI 1", "HAM 8"). Não transforme eixo em período.
5. CASO ESPECIAL: uma linha "Aluno Regular" e a linha "Aluno Caso Especial" logo abaixo são a MESMA prova. Devolva a linha regular com "denominacao": "Aluno Regular" e "horarioCasosEspeciais" preenchido com o horário de Brasília da linha de caso especial. Não devolva a linha de caso especial separada.
6. Uma linha do JSON para cada linha real da tabela. Um bloco que se repete para manhã e tarde são duas linhas.
7. Texto fora da tabela que valha para todas as linhas (duração, "N3 ESPECÍFICA – 1º AO 8º PERÍODO – MEDICINA") entra em "duracao"/"categoria"/"curso" das linhas correspondentes.
8. CURSO INTEIRO: prova aplicada a todos os períodos no mesmo dia (TPI, Teste de Progresso, prova integrada geral) costuma não ter coluna de período. Copie em "periodos" o que estiver escrito ("Todos os períodos") e mantenha a categoria ("TPI", "Teste de Progresso") em "categoria". Não invente uma lista de períodos.
9. CHAMADA: quando existir a coluna, copie-a em "chamada" — cada chamada é uma data diferente da MESMA prova, e cada linha do JSON é uma delas.
10. Se a imagem não for um calendário de avaliações, devolva {"linhas": []}.

Omita os campos que a tabela não traz — não devolva chave com string vazia. Cada campo a mais é tempo a mais de leitura.

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
          chamada: { type: 'STRING' },
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
  timeoutMs: number,
): Promise<LinhaExtraida[]> {
  const controlador = new AbortController()
  const alarme = setTimeout(() => controlador.abort(), timeoutMs)

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
      // Três passadas na mesma dupla modelo/chave: as extras existem para
      // sobrecarga temporária do modelo e para a chave que não aceita desligar
      // o raciocínio.
      for (let tentativa = 1; tentativa <= ESPERAS_MS.length + 1; tentativa++) {
        // Só começa a tentativa que CABE no que sobrou. Perguntar apenas se o
        // prazo já passou deixava começar uma tentativa de 45s faltando 10s de
        // orçamento — e a função morria no meio dela, devolvendo 504 sem
        // motivo nenhum na tela.
        const limite = tempoDisponivel(prazo)
        if (limite == null) {
          return { nome: arquivo.nome, linhas: [], erro: resumirErros(erros, true) }
        }

        try {
          return {
            nome: arquivo.nome,
            linhas: await chamarGemini(modelo, chave, arquivo, comRaciocinioDesligado, limite),
          }
        } catch (erro) {
          const mensagem = erro instanceof Error ? erro.message : String(erro)
          const status = (erro as { status?: number })?.status

          erros.push(`${modelo}: ${mensagem}`)
          console.error(`[cronogramas] ${modelo} falhou em "${arquivo.nome}":`, mensagem)

          // Sobrecarga é transitória: esperar e repetir no MESMO modelo rende
          // mais do que cair para um pior. As esperas crescem para não bater
          // de novo na mesma fila.
          if (ehSobrecarga(status, mensagem) && tentativa <= ESPERAS_MS.length) {
            await esperar(ESPERAS_MS[tentativa - 1])
            continue
          }

          // Chave que não conhece `thinkingConfig`: vale repetir com o campo
          // fora antes de trocar de modelo.
          if (comRaciocinioDesligado && /thinking/i.test(mensagem) && tentativa <= ESPERAS_MS.length) {
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
