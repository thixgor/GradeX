import 'server-only'

/**
 * Segredos guardados nas configurações do admin (chaves de API de IA).
 *
 * Por que cifrar: um dump do banco não deve entregar as chaves do Gemini —
 * com elas qualquer um gasta no projeto pago da DomineAqui. AES-256-GCM, como
 * a chave PIX dos monitores (`lib/monitorias/cripto.ts`): qualquer byte mexido
 * faz a decifragem falhar em vez de devolver lixo.
 *
 * A chave vem de `CONFIG_SECRET` (32 bytes em base64) e, na falta dela, de
 * `MONITORIAS_PIX_SECRET` — o site já tem essa. Sem nenhuma das duas o valor é
 * gravado como veio (o comportamento antigo), para não travar o painel.
 *
 * Formato gravado: `enc:v1:<iv>.<etiqueta>.<corpo>` (base64url). Valor sem o
 * prefixo é texto puro antigo: é lido normalmente e cifrado no próximo salvar.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const PREFIXO = 'enc:v1:'
/** O que o painel mostra no lugar da chave (o PUT ignora valores assim). */
export const MASCARA = '••••'

function segredo(): Buffer | null {
  for (const bruto of [process.env.CONFIG_SECRET, process.env.MONITORIAS_PIX_SECRET]) {
    if (!bruto) continue
    const chave = Buffer.from(bruto, 'base64')
    if (chave.length === 32) return chave
  }
  return null
}

export function cifraDeConfigDisponivel(): boolean {
  return segredo() !== null
}

export function estaCifrado(valor: unknown): boolean {
  return typeof valor === 'string' && valor.startsWith(PREFIXO)
}

/** Cifra para gravar. Vazio continua vazio; já cifrado não é cifrado de novo. */
export function cifrarSegredoDeConfig(texto: string): string {
  const limpo = String(texto || '').trim()
  if (!limpo || estaCifrado(limpo)) return limpo
  const chave = segredo()
  if (!chave) return limpo
  const iv = randomBytes(12)
  const cifra = createCipheriv('aes-256-gcm', chave, iv)
  const corpo = Buffer.concat([cifra.update(limpo, 'utf8'), cifra.final()])
  return PREFIXO + [iv, cifra.getAuthTag(), corpo].map((b) => b.toString('base64url')).join('.')
}

/**
 * Decifra o que veio do banco. Texto puro antigo volta como está. Pacote que
 * não decifra (segredo trocado, byte mexido) vira '' — a chave conta como
 * ausente e o painel mostra "não configurada", sem derrubar a requisição.
 */
export function decifrarSegredoDeConfig(valor: unknown): string {
  if (typeof valor !== 'string' || !valor) return ''
  if (!estaCifrado(valor)) return valor.trim()
  const chave = segredo()
  if (!chave) return ''
  try {
    const [iv, etiqueta, corpo] = valor.slice(PREFIXO.length).split('.').map((p) => Buffer.from(p, 'base64url'))
    if (!iv || !etiqueta || !corpo || iv.length !== 12 || etiqueta.length !== 16) return ''
    const decifra = createDecipheriv('aes-256-gcm', chave, iv)
    decifra.setAuthTag(etiqueta)
    return Buffer.concat([decifra.update(corpo), decifra.final()]).toString('utf8')
  } catch {
    return ''
  }
}

/** "••••1a2b" para o painel; '' quando não há chave. Nunca devolve o segredo. */
export function mascararSegredo(valorGuardado: unknown): string {
  const texto = decifrarSegredoDeConfig(valorGuardado)
  if (!texto) return ''
  return MASCARA + (texto.length >= 12 ? texto.slice(-4) : '')
}

/** O painel devolveu a máscara (o admin não mexeu no campo): manter o que está gravado. */
export function ehMascara(valor: unknown): boolean {
  return typeof valor === 'string' && valor.startsWith(MASCARA)
}

/**
 * Valor a gravar a partir do que o admin mandou: máscara ou campo ausente
 * mantêm a chave atual (e cifram a antiga que ainda estava em texto puro);
 * texto novo é cifrado; string vazia apaga a chave.
 */
export function proximoSegredo(enviado: unknown, atual: unknown): string {
  if (enviado === undefined || enviado === null || ehMascara(enviado)) return typeof atual === 'string' ? cifrarSegredoDeConfig(atual) : ''
  return cifrarSegredoDeConfig(String(enviado))
}
