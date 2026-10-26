import 'server-only'

/**
 * Gemini — o único lugar do servidor que sabe chave, modelo e endpoint.
 *
 * Antes eram seis cópias de `fetch` com modelos fixos (dois deles já
 * desligados pelo Google: `gemini-2.0-flash` em 01/06/2026 e o `1.5-flash`
 * antes) e três jeitos de achar a chave. Agora:
 *
 * - **Chaves** (`chavesGemini`): a da seção (`landing_settings.aiKeys.*`) →
 *   a padrão (`settings.geminiApiKey`) → as outras do painel → `GEMINI_API_KEY`
 *   → `GOOGLE_AI_API_KEY`. Guardadas cifradas (`cripto-config.ts`); cache de
 *   60 s por instância, descartado quando o admin salva.
 * - **Modelos** (`modelosGemini`): os escolhidos no painel → `GEMINI_MODELOS`
 *   → `gemini-3.8-flash` (Flash estável mais novo, GA em 02/09/2026) com
 *   `gemini-2.5-flash` de reserva e, por último, o apelido
 *   `gemini-flash-latest` (a rede que a leitura de cronogramas já usava para a
 *   escada não morrer inteira numa aposentadoria). No máximo três. Modelos
 *   desligados são descartados mesmo que alguém os configure.
 * - **generateContent** (`gerarConteudoGemini`): as ferramentas que já
 *   existiam continuam no endpoint `models/{m}:generateContent` — a
 *   documentação o chama de "legacy", mas ele segue suportado, e trocar de API
 *   sem necessidade arriscaria quebrar o que funciona. O helper aplica o que a
 *   documentação do 3.8 pede: tira `temperature`/`topP`/`topK` (ignorados nos
 *   3.6+), usa `thinkingLevel` (o 3.8 aceita low/medium/high; `minimal` é
 *   erro) e, no 2.5, `thinkingBudget`.
 * - **Interactions** (`criarInteracao`): a API recomendada, usada pelo Resumo
 *   por IA das monitorias, sempre com `store: false` (nada fica guardado no
 *   Google). Os nomes dos campos são os das tipagens do SDK oficial
 *   `@google/genai` (`import type`), mas a chamada é um `fetch` ao REST: o
 *   SDK inteiro (google-auth-library, protobufjs) não entra no bundle da função.
 *
 * Nunca registra chave nem conteúdo em log.
 */

import type { Interactions } from '@google/genai'
import { getDb } from '@/lib/mongodb'
import { invalidarCacheDeServidor, memoizarPorTempo } from '@/lib/cache-de-servidor'
import { decifrarSegredoDeConfig } from './cripto-config'

export const MODELO_FLASH_PADRAO = 'gemini-3.8-flash'
export const MODELO_FLASH_RESERVA = 'gemini-2.5-flash'
const MODELO_FLASH_APELIDO = 'gemini-flash-latest'

/** Modelos que o Google já desligou (chamar = 404). */
export function modeloDesligado(modelo: string): boolean {
  return /^gemini-(1\.|2\.0-)/.test(modelo) || /^gemini-pro(-vision)?$/.test(modelo)
}

/** Base da API (trocável por env nos testes, para um servidor falso local). */
export function baseDaApiGemini(): string {
  return (process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '')
}

export type SecaoDeChave = 'generalExams' | 'personalExams' | 'flashcards'

interface ConfigDeIA {
  chaves: { secoes: Record<SecaoDeChave, string>; padrao: string; ambiente: string[] }
  modelos: string[]
}

const CACHE = 'ia:gemini-config'
const SECOES: SecaoDeChave[] = ['generalExams', 'personalExams', 'flashcards']

/** Chamado por quem grava chave ou modelo (rotas de configurações). */
export function invalidarConfigDeIA(): void {
  invalidarCacheDeServidor(CACHE)
}

function montarConfig(landing: any, settings: any): ConfigDeIA {
  const secoes = Object.fromEntries(SECOES.map((s) => [s, decifrarSegredoDeConfig(landing?.aiKeys?.[s])])) as Record<SecaoDeChave, string>
  const doPainel = [landing?.iaModelos?.principal, landing?.iaModelos?.reserva]
  const doAmbiente = String(process.env.GEMINI_MODELOS || '').split(',')
  const modelos = Array.from(
    new Set(
      [...doPainel, ...doAmbiente, MODELO_FLASH_PADRAO, MODELO_FLASH_RESERVA, MODELO_FLASH_APELIDO]
        .map((m) => String(m || '').trim())
        .filter((m) => m && !modeloDesligado(m)),
    ),
  ).slice(0, 3)
  return {
    chaves: {
      secoes,
      padrao: decifrarSegredoDeConfig(settings?.geminiApiKey),
      ambiente: [process.env.GEMINI_API_KEY, process.env.GOOGLE_AI_API_KEY].map((x) => (x || '').trim()).filter(Boolean),
    },
    modelos,
  }
}

async function lerConfig(): Promise<ConfigDeIA> {
  try {
    return await memoizarPorTempo(CACHE, 60_000, async () => {
      const db = await getDb()
      const [landing, settings] = await Promise.all([
        db.collection('landing_settings').findOne({}, { projection: { aiKeys: 1, iaModelos: 1 } }),
        db.collection('settings').findOne({}, { projection: { geminiApiKey: 1 } }),
      ])
      return montarConfig(landing, settings)
    })
  } catch (erro) {
    // Banco fora do ar: as chaves e modelos do ambiente ainda servem, como
    // antes da unificação. Não fica em cache — a próxima chamada tenta o banco.
    console.error('[ia] configurações do painel indisponíveis; usando só o ambiente:', erro instanceof Error ? erro.message : 'erro')
    return montarConfig(null, null)
  }
}

/** Todas as chaves utilizáveis, na ordem de preferência para a seção. */
export async function chavesGemini(secao?: SecaoDeChave): Promise<string[]> {
  const { chaves } = await lerConfig()
  const lista = [secao ? chaves.secoes[secao] : '', chaves.padrao, ...SECOES.map((s) => chaves.secoes[s]), ...chaves.ambiente]
  return Array.from(new Set(lista.filter(Boolean)))
}

/**
 * A chave do Resumo por IA: só a padrão (`settings.geminiApiKey`) ou a
 * `GEMINI_API_KEY` — nunca as das seções. É a chave que o admin confirma ser
 * de projeto com faturamento (no nível gratuito o Google pode usar o conteúdo
 * para melhorar produtos; no pago, não). Sem reserva de propósito.
 */
export async function chaveGeminiDoResumo(): Promise<string> {
  const { chaves } = await lerConfig()
  return chaves.padrao || (process.env.GEMINI_API_KEY || '').trim()
}

export async function modelosGemini(): Promise<string[]> {
  return (await lerConfig()).modelos
}

export type NivelDeRaciocinio = 'minimo' | 'baixo' | 'medio' | 'alto'

/**
 * Modelos para o que precisa sair RÁPIDO (provas e flashcards com IA): o aluno
 * está olhando a tela. O 3.5 Flash-Lite é o mais rápido da família (~350
 * tokens/s, raciocínio `minimal` por padrão); o 3.8 Flash entra de reserva e o
 * 2.5 Flash por último. `GEMINI_MODELOS_RAPIDOS` (vírgulas) troca a escada sem
 * deploy de código. Não segue o modelo do painel de propósito: o painel pode
 * apontar um modelo grande, ótimo para o Resumo da monitoria e lento demais
 * para uma prova gerada ao vivo.
 */
export function modelosRapidos(): string[] {
  const doAmbiente = String(process.env.GEMINI_MODELOS_RAPIDOS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  const base = doAmbiente.length ? doAmbiente : ['gemini-3.5-flash-lite', MODELO_FLASH_PADRAO, MODELO_FLASH_RESERVA]
  return Array.from(new Set(base)).filter((m) => !modeloDesligado(m)).slice(0, 3)
}

/** Só a linha Flash-Lite aceita `thinkingLevel: minimal`; nos outros 3.x é erro. */
function aceitaRaciocinioMinimo(modelo: string): boolean {
  return /flash-lite/.test(modelo)
}

function geracao3(modelo: string): boolean {
  return /^gemini-([3-9]|\d{2,})/.test(modelo) || modelo === 'gemini-flash-latest'
}

/**
 * Ajusta o `generationConfig` ao modelo, como manda a documentação: nos 3.x
 * sai a amostragem (ignorada desde o 3.6 e desaconselhada) e entra
 * `thinkingLevel`; no 2.5 entra `thinkingBudget` (0 desliga o raciocínio).
 * O teto de saída ganha folga porque o raciocínio conta nele — tokens só são
 * cobrados quando gerados, então a folga não custa nada.
 */
export function configDeGeracao(modelo: string, base: Record<string, unknown> = {}, raciocinio: NivelDeRaciocinio = 'baixo'): Record<string, unknown> {
  const config: Record<string, unknown> = { ...base }
  if ('thinkingConfig' in base) return config
  if (geracao3(modelo)) {
    delete config.temperature
    delete config.topP
    delete config.topK
    delete config.candidateCount
    config.thinkingConfig = {
      thinkingLevel:
        raciocinio === 'alto'
          ? 'high'
          : raciocinio === 'medio'
            ? 'medium'
            : raciocinio === 'minimo' && aceitaRaciocinioMinimo(modelo)
              ? 'minimal'
              : 'low',
    }
  } else if (modelo.startsWith('gemini-2.5')) {
    config.thinkingConfig = { thinkingBudget: raciocinio === 'baixo' || raciocinio === 'minimo' ? 0 : -1 }
  }
  const teto = Number(config.maxOutputTokens) || 0
  if (teto && teto < 8192 && 'thinkingConfig' in config) config.maxOutputTokens = 8192
  return config
}

export class ErroGemini extends Error {
  constructor(
    message: string,
    readonly status: number | undefined,
    /** Vale tentar de novo mais tarde (fila cheia, 5xx, tempo esgotado). */
    readonly temporario: boolean,
  ) {
    super(message)
  }
}

function classificar(status: number | undefined, mensagem: string): 'chave' | 'modelo' | 'temporario' | 'definitivo' {
  if (status === 401 || status === 403 || /api key not valid|api_key_invalid|permission denied/i.test(mensagem)) return 'chave'
  if (status === 404 || /not found|no longer available|is not supported|unsupported model/i.test(mensagem)) return 'modelo'
  if (status === undefined || status === 408 || status === 429 || status >= 500 || /high demand|overloaded|unavailable|try again later|deadline/i.test(mensagem)) return 'temporario'
  return 'definitivo'
}

async function postar(url: string, chave: string, corpo: unknown, timeoutMs: number): Promise<{ status: number; dados: any }> {
  const controlador = new AbortController()
  const alarme = setTimeout(() => controlador.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
      body: JSON.stringify(corpo),
      signal: controlador.signal,
      cache: 'no-store',
    })
    const dados = await r.json().catch(() => null)
    return { status: r.status, dados }
  } catch (e) {
    const tempo = (e as Error)?.name === 'AbortError'
    throw new ErroGemini(tempo ? 'tempo esgotado' : 'falha de rede', undefined, true)
  } finally {
    clearTimeout(alarme)
  }
}

/** Texto da resposta do generateContent, sem as partes de raciocínio. */
export function textoDoGenerateContent(dados: any): string {
  const partes: any[] = dados?.candidates?.[0]?.content?.parts || []
  return partes
    .filter((p) => typeof p?.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
}

/**
 * Chama `generateContent` tentando modelo por fora e chave por dentro (a
 * falha com a chave certa quase sempre é do modelo). Uma tentativa por par,
 * sem esperas: quem precisa insistir mais (ex.: cronogramas) tem o próprio laço.
 */
export async function gerarConteudoGemini(p: {
  corpo: { contents: unknown; generationConfig?: Record<string, unknown>; [k: string]: unknown }
  secao?: SecaoDeChave
  chaves?: string[]
  modelos?: string[]
  raciocinio?: NivelDeRaciocinio
  /** Por tentativa. */
  timeoutMs?: number
  /** Para todas as tentativas juntas. */
  prazoMs?: number
}): Promise<{ texto: string; modelo: string; dados: any }> {
  const chaves = p.chaves?.length ? p.chaves : await chavesGemini(p.secao)
  if (!chaves.length) throw new ErroGemini('API Key do Gemini não configurada. Configure em Configurações > API Gemini', undefined, false)
  const modelos = (p.modelos?.length ? p.modelos : await modelosGemini()).filter((m) => !modeloDesligado(m))
  const timeoutMs = p.timeoutMs ?? 60_000
  const fim = Date.now() + (p.prazoMs ?? timeoutMs * 2)
  const erros: string[] = []
  const chavesRecusadas = new Set<string>()
  let ultimo: ErroGemini | null = null
  for (const modelo of modelos) {
    for (const chave of chaves) {
      if (chavesRecusadas.has(chave)) continue
      const resta = fim - Date.now()
      if (resta < 2_000) break
      try {
        const { status, dados } = await postar(
          `${baseDaApiGemini()}/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,
          chave,
          { ...p.corpo, generationConfig: configDeGeracao(modelo, p.corpo.generationConfig, p.raciocinio) },
          Math.min(timeoutMs, resta),
        )
        if (status >= 200 && status < 300) {
          const texto = textoDoGenerateContent(dados)
          if (texto) return { texto, modelo, dados }
          const motivo = dados?.candidates?.[0]?.finishReason || dados?.promptFeedback?.blockReason || 'sem conteúdo'
          ultimo = new ErroGemini(`resposta vazia (${motivo})`, status, motivo === 'MAX_TOKENS')
          erros.push(`${modelo}: ${ultimo.message}`)
          break
        }
        const mensagem = String(dados?.error?.message || `HTTP ${status}`).slice(0, 300)
        const tipo = classificar(status, mensagem)
        ultimo = new ErroGemini(mensagem, status, tipo === 'temporario')
        erros.push(`${modelo}: ${mensagem}`)
        if (tipo === 'chave') chavesRecusadas.add(chave)
        if (tipo === 'modelo' || tipo === 'definitivo') break
      } catch (e) {
        ultimo = e instanceof ErroGemini ? e : new ErroGemini('falha ao chamar o Gemini', undefined, true)
        erros.push(`${modelo}: ${ultimo.message}`)
      }
    }
  }
  const unicos = Array.from(new Set(erros)).join(' · ').slice(0, 500)
  throw new ErroGemini(unicos || 'Falha ao chamar o Gemini', ultimo?.status, ultimo?.temporario ?? true)
}

// ─── Interactions API (recurso novo) ────────────────────────────────────

export type CriarInteracao = Interactions.InteractionCreateParams.CreateModelInteractionParamsNonStreaming
export type Interacao = Interactions.Interaction
export type UsoDaInteracao = NonNullable<Interacao['usage']>

/** Texto final da interação (o que o SDK chama de `output_text`). */
export function textoDaInteracao(i: Pick<Interacao, 'steps'>): string {
  const passos = i.steps || []
  let inicio = 0
  for (let k = passos.length - 1; k >= 0; k--) {
    if (passos[k].type === 'user_input') {
      inicio = k + 1
      break
    }
  }
  return passos
    .slice(inicio)
    .flatMap((s) => (s.type === 'model_output' && Array.isArray(s.content) ? s.content : []))
    .map((c) => (c.type === 'text' ? c.text || '' : ''))
    .join('')
}

/**
 * `POST /v1beta/interactions`, uma tentativa só (quem decide repetir é o
 * processador, com espera e teto de tentativas). `store` é sempre `false`.
 */
export async function criarInteracao(chave: string, corpo: CriarInteracao, timeoutMs: number): Promise<{ texto: string; uso: UsoDaInteracao; interacao: Interacao }> {
  const pedido: CriarInteracao = { ...corpo, store: false, stream: false }
  const { status, dados } = await postar(`${baseDaApiGemini()}/v1beta/interactions`, chave, pedido, timeoutMs)
  if (status < 200 || status >= 300) {
    const mensagem = String(dados?.error?.message || `HTTP ${status}`).slice(0, 300)
    throw new ErroGemini(mensagem, status, classificar(status, mensagem) === 'temporario')
  }
  const interacao = dados as Interacao
  if (interacao?.status && interacao.status !== 'completed') {
    const motivo = interacao.errors?.[0]?.message || interacao.status
    throw new ErroGemini(`interação ${interacao.status}: ${String(motivo).slice(0, 200)}`, status, interacao.status !== 'budget_exceeded')
  }
  return { texto: textoDaInteracao(interacao), uso: interacao.usage || {}, interacao }
}

// ─── Files API (áudio da monitoria) ─────────────────────────────────────

export interface ArquivoGemini {
  name: string
  displayName?: string
  uri?: string
  mimeType?: string
  sizeBytes?: string
  state?: 'STATE_UNSPECIFIED' | 'PROCESSING' | 'ACTIVE' | 'FAILED'
  expirationTime?: string
}

/**
 * Abre uma sessão de upload *resumable* e devolve a URL de envio. O navegador
 * manda os bytes direto para ela (`X-Goog-Upload-Command: upload, finalize`),
 * sem passar pela função. A URL é a credencial da sessão — vale só para este
 * arquivo, deste tamanho, e não carrega a chave.
 */
export async function abrirEnvioDeArquivo(chave: string, p: { bytes: number; mime: string; nome: string; origem?: string }): Promise<string> {
  const controlador = new AbortController()
  const alarme = setTimeout(() => controlador.abort(), 15_000)
  try {
    const r = await fetch(`${baseDaApiGemini()}/upload/v1beta/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': chave,
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(p.bytes),
        'X-Goog-Upload-Header-Content-Type': p.mime,
        // Sessão aberta no servidor e usada no navegador: o Origin vai junto
        // para a resposta do upload trazer os cabeçalhos de CORS.
        ...(p.origem ? { Origin: p.origem } : {}),
      },
      body: JSON.stringify({ file: { display_name: p.nome } }),
      signal: controlador.signal,
      cache: 'no-store',
    })
    const url = r.headers.get('x-goog-upload-url')
    if (!r.ok || !url) {
      const dados = await r.json().catch(() => null)
      const mensagem = String(dados?.error?.message || `HTTP ${r.status}`).slice(0, 300)
      throw new ErroGemini(mensagem, r.status, classificar(r.status, mensagem) === 'temporario')
    }
    return url
  } catch (e) {
    if (e instanceof ErroGemini) throw e
    throw new ErroGemini((e as Error)?.name === 'AbortError' ? 'tempo esgotado' : 'falha de rede', undefined, true)
  } finally {
    clearTimeout(alarme)
  }
}

/** Envia bytes que estão no servidor (reserva via Blob) pela mesma sessão resumable. */
export async function enviarBytesDoArquivo(urlDeEnvio: string, bytes: ArrayBuffer, timeoutMs = 60_000): Promise<ArquivoGemini> {
  const controlador = new AbortController()
  const alarme = setTimeout(() => controlador.abort(), timeoutMs)
  try {
    const r = await fetch(urlDeEnvio, {
      method: 'POST',
      headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' },
      body: bytes,
      signal: controlador.signal,
      cache: 'no-store',
    })
    const dados = await r.json().catch(() => null)
    if (!r.ok || !dados?.file?.name) throw new ErroGemini(String(dados?.error?.message || `HTTP ${r.status}`).slice(0, 300), r.status, r.status >= 500 || r.status === 429)
    return dados.file as ArquivoGemini
  } catch (e) {
    if (e instanceof ErroGemini) throw e
    throw new ErroGemini('falha ao enviar o arquivo', undefined, true)
  } finally {
    clearTimeout(alarme)
  }
}

function nomeDeArquivoValido(nome: string): boolean {
  return /^files\/[a-z0-9-]{1,64}$/.test(nome)
}

export async function consultarArquivo(chave: string, nome: string): Promise<ArquivoGemini | null> {
  if (!nomeDeArquivoValido(nome)) return null
  const controlador = new AbortController()
  const alarme = setTimeout(() => controlador.abort(), 15_000)
  try {
    const r = await fetch(`${baseDaApiGemini()}/v1beta/${nome}`, { headers: { 'x-goog-api-key': chave }, signal: controlador.signal, cache: 'no-store' })
    if (r.status === 404 || r.status === 403) return null
    if (!r.ok) throw new ErroGemini(`HTTP ${r.status}`, r.status, true)
    return (await r.json()) as ArquivoGemini
  } catch (e) {
    if (e instanceof ErroGemini) throw e
    throw new ErroGemini('falha de rede', undefined, true)
  } finally {
    clearTimeout(alarme)
  }
}

/** Apaga o áudio no Google assim que a transcrição sai (senão ficaria 48 h). Falha calada: vence sozinho. */
export async function apagarArquivo(chave: string, nome: string): Promise<boolean> {
  if (!nomeDeArquivoValido(nome)) return false
  try {
    const r = await fetch(`${baseDaApiGemini()}/v1beta/${nome}`, { method: 'DELETE', headers: { 'x-goog-api-key': chave }, cache: 'no-store', signal: AbortSignal.timeout(10_000) })
    return r.ok || r.status === 404
  } catch {
    return false
  }
}
