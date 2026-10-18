import 'server-only'

/**
 * Autoteste do Resumo por IA (Admin → Configurações → "Testar o Resumo por
 * IA"): percorre, contra o Google de verdade, o mesmo caminho de um trecho de
 * aula e diz em que etapa quebra.
 *
 *   1. envio direto do navegador ao Files API (o CORS que a sala usa);
 *   2. conferência do arquivo (nome, tamanho, estado ACTIVE, uri), como o processador;
 *   3. transcrição de um WAV, com o MESMO pedido da Interactions do processador;
 *   4. transcrição de um WebM/Opus gravado pelo Chromium (o formato da sala);
 *   5. limpeza: apaga os arquivos no Google e soma o custo ao mês.
 *
 * Nenhum áudio é de ninguém (tom de teste e uma gravação muda do navegador).
 */

import { randomBytes } from 'crypto'
import { abrirEnvioDeArquivo, apagarArquivo, chaveGeminiDoResumo, consultarArquivo, criarInteracao, enviarBytesDoArquivo, ErroGemini, type ArquivoGemini } from '@/lib/ia/gemini'
import { ErroMonitoria } from '../reservas'
import { registrarUso } from './adicional'
import { AMOSTRA_WEBM } from './amostras'
import { configDoResumo } from './config'
import { lerJson, validarTranscricao } from './esquema'
import { pedidoDeTranscricao, usoDaChamada } from './processador'
import { custoDaChamadaUsd, tabelaVigente } from './regras'
import type { ConfigResumo } from './tipos'
import { wavDeTeste } from './wav'

export type EtapaDoAutoteste = 'envio_navegador' | 'conferencia' | 'transcricao_wav' | 'transcricao_webm' | 'limpeza'

export interface ResultadoDaEtapa {
  etapa: EtapaDoAutoteste
  ok: boolean
  detalhe: string
}

export interface ResultadoDoAutoteste {
  modeloTranscricao: string
  etapas: ResultadoDaEtapa[]
  custoUsd: number
  /** O que fazer com o resultado, em uma frase. */
  conclusao: string
}

const BYTES_MAX_DO_NAVEGADOR = 256 * 1024
const NOME_DE_TESTE = /^teste-resumo-[a-f0-9]{12}$/
const TEMPO_DA_CHAMADA_MS = 45_000

function novoNome(): string {
  return `teste-resumo-${randomBytes(6).toString('hex')}`
}

function mensagem(e: unknown): string {
  if (e instanceof ErroGemini) return `${e.status ? `HTTP ${e.status}: ` : ''}${e.message}`
  return e instanceof Error ? e.message : 'erro inesperado'
}

/** Passo 1 (servidor): abre a sessão que o NAVEGADOR do admin vai usar, como na sala. */
export async function abrirEnvioDoAutoteste(origem: string, bytes: number): Promise<{ url: string; nome: string }> {
  if (!Number.isInteger(bytes) || bytes < 44 || bytes > BYTES_MAX_DO_NAVEGADOR) throw new ErroMonitoria(400, 'Tamanho do áudio de teste inválido.')
  const chave = await chaveGeminiDoResumo()
  if (!chave) throw new ErroMonitoria(409, 'Nenhuma chave padrão do Gemini configurada (Provas → API Gemini, ou GEMINI_API_KEY).')
  const nome = novoNome()
  try {
    return { url: await abrirEnvioDeArquivo(chave, { bytes, mime: 'audio/wav', nome, origem }), nome }
  } catch (e) {
    throw new ErroMonitoria(502, `O Google não abriu a sessão de envio: ${mensagem(e)}`)
  }
}

/** Sobe bytes pelo servidor (a amostra WebM, ou o WAV quando o navegador não conseguiu). */
async function subirPeloServidor(chave: string, bytes: Uint8Array, mime: string): Promise<{ nome: string; displayName: string; bytes: number }> {
  const displayName = novoNome()
  const url = await abrirEnvioDeArquivo(chave, { bytes: bytes.byteLength, mime, nome: displayName })
  const copia = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(copia).set(bytes)
  const arquivo = await enviarBytesDoArquivo(url, copia, 30_000)
  return { nome: arquivo.name, displayName, bytes: bytes.byteLength }
}

/** A mesma conferência do processador: é O arquivo, do tamanho certo, ACTIVE e com uri. */
async function conferir(chave: string, a: { nome: string; displayName: string; bytes: number }): Promise<ArquivoGemini> {
  let f = await consultarArquivo(chave, a.nome)
  if (!f) throw new Error('o Google não encontrou o arquivo enviado')
  if (f.displayName !== a.displayName) throw new Error(`nome no Google diferente do enviado ("${f.displayName ?? '—'}")`)
  if (Number(f.sizeBytes) !== a.bytes) throw new Error(`tamanho no Google (${f.sizeBytes ?? '—'}) diferente do enviado (${a.bytes})`)
  for (let i = 0; i < 6 && f.state === 'PROCESSING'; i++) {
    await new Promise((r) => setTimeout(r, 2_500))
    f = (await consultarArquivo(chave, a.nome)) || f
  }
  if (f.state !== 'ACTIVE') throw new Error(`arquivo em estado ${f.state ?? 'desconhecido'} no Google`)
  if (!f.uri) throw new Error('o Google não devolveu a uri do arquivo')
  return f
}

async function transcrever(chave: string, config: ConfigResumo, arquivo: ArquivoGemini, mime: string, duracaoMs: number): Promise<{ detalhe: string; usd: number }> {
  const pedido = pedidoDeTranscricao(config, { materia: 'Teste', conteudos: [], titulo: 'Autoteste do Resumo por IA', individual: false }, { papel: 'monitor', nome: 'Teste' }, { uri: arquivo.uri!, mime })
  const { texto, uso } = await criarInteracao(chave, pedido, TEMPO_DA_CHAMADA_MS)
  const tabela = tabelaVigente(config.precos, config.modeloTranscricao, new Date())
  const usd = tabela ? custoDaChamadaUsd(tabela, usoDaChamada(uso)) : 0
  const frases = validarTranscricao(lerJson(texto), duracaoMs)
  if (!frases) throw new Error('o modelo respondeu, mas fora do formato JSON esperado')
  return { detalhe: `o modelo respondeu no formato esperado (${frases.length} frase(s); o áudio de teste não tem fala)`, usd }
}

/**
 * Passos 2 a 5. `navegador` traz o que o navegador do admin conseguiu no passo 1
 * (o arquivo no Google, ou o erro do envio direto).
 */
export async function rodarAutoteste(navegador: { arquivo?: string; nome?: string; bytes?: number; erro?: string }): Promise<ResultadoDoAutoteste> {
  const [config, chave] = await Promise.all([configDoResumo(), chaveGeminiDoResumo()])
  const etapas: ResultadoDaEtapa[] = []
  const base = { modeloTranscricao: config.modeloTranscricao, custoUsd: 0 }
  if (!chave) {
    return { ...base, etapas, conclusao: 'Nenhuma chave padrão do Gemini configurada (Provas → API Gemini, ou GEMINI_API_KEY).' }
  }
  const apagar: string[] = []
  let custoUsd = 0

  // 1. Envio direto do navegador.
  const doNavegador =
    navegador.arquivo && /^files\/[a-z0-9-]{1,64}$/.test(navegador.arquivo) && navegador.nome && NOME_DE_TESTE.test(navegador.nome) && navegador.bytes
      ? { nome: navegador.arquivo, displayName: navegador.nome, bytes: navegador.bytes }
      : null
  etapas.push(
    doNavegador
      ? { etapa: 'envio_navegador', ok: true, detalhe: 'o navegador mandou o áudio direto ao Google (CORS funcionando)' }
      : { etapa: 'envio_navegador', ok: false, detalhe: (navegador.erro || 'o navegador não conseguiu mandar o áudio ao Google').slice(0, 300) },
  )

  // 2. Conferência (o WAV do navegador; sem ele, o servidor sobe o mesmo WAV para seguir o teste).
  let wav: ArquivoGemini | null = null
  try {
    const alvo = doNavegador || (await subirPeloServidor(chave, wavDeTeste(), 'audio/wav'))
    apagar.push(alvo.nome)
    wav = await conferir(chave, alvo)
    etapas.push({ etapa: 'conferencia', ok: true, detalhe: `arquivo confere no Google (${doNavegador ? 'enviado pelo navegador' : 'enviado pelo servidor'}, ACTIVE)` })
  } catch (e) {
    etapas.push({ etapa: 'conferencia', ok: false, detalhe: mensagem(e).slice(0, 300) })
  }

  // 3. Transcrição do WAV.
  if (wav) {
    try {
      const r = await transcrever(chave, config, wav, 'audio/wav', 1_000)
      custoUsd += r.usd
      etapas.push({ etapa: 'transcricao_wav', ok: true, detalhe: r.detalhe })
    } catch (e) {
      etapas.push({ etapa: 'transcricao_wav', ok: false, detalhe: mensagem(e).slice(0, 300) })
    }
  } else {
    etapas.push({ etapa: 'transcricao_wav', ok: false, detalhe: 'não rodou: o arquivo não chegou a conferir' })
  }

  // 4. Transcrição do WebM/Opus (o formato que a sala grava).
  try {
    const webm = await subirPeloServidor(chave, AMOSTRA_WEBM.bytes(), AMOSTRA_WEBM.mime)
    apagar.push(webm.nome)
    const f = await conferir(chave, webm)
    const r = await transcrever(chave, config, f, AMOSTRA_WEBM.mime, AMOSTRA_WEBM.duracaoMs)
    custoUsd += r.usd
    etapas.push({ etapa: 'transcricao_webm', ok: true, detalhe: r.detalhe })
  } catch (e) {
    etapas.push({ etapa: 'transcricao_webm', ok: false, detalhe: mensagem(e).slice(0, 300) })
  }

  // 5. Limpeza e custo.
  const apagados = await Promise.all(apagar.map((n) => apagarArquivo(chave, n)))
  if (custoUsd > 0) await registrarUso({ realUsd: custoUsd, chamadas: etapas.filter((x) => x.etapa.startsWith('transcricao') && x.ok).length })
  etapas.push({
    etapa: 'limpeza',
    ok: apagados.every(Boolean),
    detalhe: apagados.every(Boolean) ? `arquivos de teste apagados no Google (custo US$ ${custoUsd.toFixed(5)})` : 'algum arquivo de teste não foi apagado agora (o Google apaga sozinho em 48 h)',
  })

  return { ...base, etapas, custoUsd, conclusao: conclusaoDo(etapas) }
}

export function conclusaoDo(etapas: ResultadoDaEtapa[]): string {
  const ok = (e: EtapaDoAutoteste) => etapas.find((x) => x.etapa === e)?.ok === true
  const wav = ok('transcricao_wav')
  const webm = ok('transcricao_webm')
  if (ok('envio_navegador') && wav && webm) return 'Tudo certo: o caminho da sala funciona do navegador até a transcrição.'
  if (!wav && !webm) return 'A transcrição falha nos dois formatos: o problema é a chave, o modelo ou o pedido ao Gemini (veja o erro das etapas 3 e 4).'
  if (wav && !webm) return 'O Gemini aceita WAV mas recusa o WebM/Opus que a sala grava: o problema é o formato do áudio.'
  if (!wav && webm) return 'O WebM transcreve, mas o WAV não: veja o erro da etapa 3.'
  if (!ok('envio_navegador')) return 'A transcrição funciona, mas o navegador não alcança o Google (CORS/rede): a sala depende da reserva pelo Blob.'
  return 'Veja as etapas com erro.'
}
