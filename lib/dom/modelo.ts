import 'server-only'

/**
 * A chamada à IA do Dom: Gemini em primeiro plano, AI Gateway da Vercel em
 * segundo.
 *
 * - **Gemini** (`lib/ia/gemini.ts`, as mesmas chaves do painel): Flash-Lite
 *   primeiro — o modelo mais novo com o menor custo por token e raciocínio
 *   mínimo, o que importa no nível gratuito. A escada é trocável por
 *   `DOM_MODELOS` sem deploy. Uma tentativa por modelo, com teto de tempo
 *   curto: o aluno está olhando o Dom pensar.
 * - **Busca do Google** (`google_search`): só quando a rota pediu (pergunta
 *   de conteúdo de saúde, com cota). Se o modelo recusar ferramenta junto com
 *   JSON, a mesma chamada sai de novo sem a ferramenta.
 * - **AI Gateway** (`AI_GATEWAY_API_KEY`, endpoint compatível com OpenAI):
 *   entra quando o Gemini está no teto do dia/minuto ou falhou em todos os
 *   modelos. `DOM_GATEWAY_MODELOS` define a escada.
 *
 * Nenhum texto do aluno nem chave vai para log.
 */

import { ErroGemini, gerarConteudoGemini, MODELO_FLASH_PADRAO } from '@/lib/ia/gemini'
import type { Db } from 'mongodb'
import { reservarMotor, type Motor } from './limites'
import { ESQUEMA_DA_RESPOSTA } from './prompt'

export interface TurnoDoModelo {
  papel: 'aluno' | 'dom'
  texto: string
}

export interface ResultadoDoModelo {
  json: Record<string, unknown>
  /** Resposta crua do Gemini (para as citações da busca). */
  dados: any
  motor: Motor
  modelo: string
  entrada: number
  saida: number
}

export class DomIndisponivel extends Error {}

function lista(env: string | undefined, padrao: string[]): string[] {
  const doAmbiente = String(env || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  return Array.from(new Set(doAmbiente.length ? doAmbiente : padrao)).slice(0, 3)
}

export function modelosDoDom(): string[] {
  return lista(process.env.DOM_MODELOS, ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', MODELO_FLASH_PADRAO])
}

export function modelosDoGateway(): string[] {
  return lista(process.env.DOM_GATEWAY_MODELOS, ['google/gemini-3.5-flash-lite', 'google/gemini-2.5-flash-lite', 'openai/gpt-5-nano'])
}

/** Raciocínio do tamanho da tarefa: o socrático pensa um pouco; o resto, o mínimo. */
function pensamento(modelo: string, profundo: boolean): Record<string, unknown> {
  if (/flash-lite/.test(modelo)) return { thinkingLevel: profundo ? 'low' : 'minimal' }
  if (/^gemini-2\.5/.test(modelo)) return { thinkingBudget: profundo ? 512 : 0 }
  return { thinkingLevel: 'low' }
}

/** JSON da resposta, tolerante a cerca de código e texto em volta. */
export function lerJson(texto: string): Record<string, unknown> | null {
  if (!texto) return null
  const inicio = texto.indexOf('{')
  const fim = texto.lastIndexOf('}')
  if (inicio < 0 || fim <= inicio) return null
  try {
    const v = JSON.parse(texto.slice(inicio, fim + 1))
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null
  } catch {
    return null
  }
}

async function viaGemini(p: {
  sistema: string
  turnos: TurnoDoModelo[]
  buscar: boolean
  profundo: boolean
  fim: number
}): Promise<ResultadoDoModelo | null> {
  const contents = p.turnos.map((t) => ({ role: t.papel === 'dom' ? 'model' : 'user', parts: [{ text: t.texto }] }))
  for (const modelo of modelosDoDom()) {
    for (const comBusca of p.buscar ? [true, false] : [false]) {
      const resta = p.fim - Date.now()
      if (resta < 4_000) return null
      try {
        const { texto, dados } = await gerarConteudoGemini({
          modelos: [modelo],
          timeoutMs: Math.min(14_000, resta),
          prazoMs: resta,
          corpo: {
            systemInstruction: { parts: [{ text: p.sistema }] },
            contents,
            ...(comBusca ? { tools: [{ google_search: {} }] } : {}),
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: ESQUEMA_DA_RESPOSTA,
              maxOutputTokens: p.profundo ? 1400 : 1000,
              thinkingConfig: pensamento(modelo, p.profundo),
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
          },
        })
        const json = lerJson(texto)
        if (!json) continue
        const uso = dados?.usageMetadata || {}
        return {
          json,
          dados,
          motor: 'gemini',
          modelo,
          entrada: Number(uso.promptTokenCount) || 0,
          saida: (Number(uso.candidatesTokenCount) || 0) + (Number(uso.thoughtsTokenCount) || 0),
        }
      } catch (erro) {
        const status = erro instanceof ErroGemini ? erro.status : undefined
        // 400 com a ferramenta ligada: tenta o mesmo modelo sem ela.
        if (comBusca && status === 400) continue
        console.warn(`[dom] gemini ${modelo}${comBusca ? ' +busca' : ''}: ${erro instanceof Error ? erro.message.slice(0, 160) : 'erro'}`)
        break
      }
    }
  }
  return null
}

async function viaGateway(p: { sistema: string; turnos: TurnoDoModelo[]; profundo: boolean; fim: number }): Promise<ResultadoDoModelo | null> {
  const chave = (process.env.AI_GATEWAY_API_KEY || '').trim()
  if (!chave) return null
  const base = (process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1').replace(/\/+$/, '')
  const messages = [
    {
      role: 'system',
      content: `${p.sistema}\n\nResponda APENAS com um objeto JSON válido neste esquema: ${JSON.stringify(ESQUEMA_DA_RESPOSTA)}`,
    },
    ...p.turnos.map((t) => ({ role: t.papel === 'dom' ? 'assistant' : 'user', content: t.texto })),
  ]
  for (const modelo of modelosDoGateway()) {
    const resta = p.fim - Date.now()
    if (resta < 3_000) return null
    try {
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelo,
          messages,
          max_tokens: p.profundo ? 1400 : 1000,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(Math.min(12_000, resta)),
        cache: 'no-store',
      })
      const dados = await r.json().catch(() => null)
      if (!r.ok) {
        console.warn(`[dom] gateway ${modelo}: HTTP ${r.status} ${String(dados?.error?.message || '').slice(0, 120)}`)
        continue
      }
      const json = lerJson(String(dados?.choices?.[0]?.message?.content || ''))
      if (!json) continue
      return {
        json,
        dados: null,
        motor: 'gateway',
        modelo,
        entrada: Number(dados?.usage?.prompt_tokens) || 0,
        saida: Number(dados?.usage?.completion_tokens) || 0,
      }
    } catch (erro) {
      console.warn(`[dom] gateway ${modelo}: ${erro instanceof Error ? erro.name : 'erro'}`)
    }
  }
  return null
}

export async function perguntarAoModelo(
  db: Db,
  p: { sistema: string; turnos: TurnoDoModelo[]; buscar: boolean; profundo: boolean },
): Promise<ResultadoDoModelo> {
  // A função tem 30 s (vercel.json). O Gemini pode usar até ~17 s; o que
  // sobrar é do Gateway. Flash-Lite costuma responder em 2–5 s.
  const inicio = Date.now()
  if (await reservarMotor(db, 'gemini')) {
    const r = await viaGemini({ ...p, fim: inicio + 17_000 })
    if (r) return r
  }
  if (await reservarMotor(db, 'gateway')) {
    const r = await viaGateway({ ...p, fim: inicio + 27_000 })
    if (r) return r
  }
  throw new DomIndisponivel('nenhum motor respondeu')
}
