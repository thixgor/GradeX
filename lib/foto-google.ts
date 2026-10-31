/**
 * Foto do Google como retrato padrão de quem entrou com o Google.
 *
 * A imagem não passa pelo nosso servidor nem pelo Blob: o navegador baixa direto
 * do CDN do Google (`*.googleusercontent.com`), no tamanho exato pedido pelo
 * sufixo `=s<px>-c`. Guardamos só a URL (já vem no ID token do login).
 *
 * Ordem de prioridade do retrato: o escolhido na galeria vence; sem ele, a foto
 * do Google; sem nenhum, as iniciais.
 */

import { avatarPorId } from '@/lib/monitorias/avatares'

const HOST_DO_GOOGLE = /^[a-z0-9-]+\.googleusercontent\.com$/i

/** Só aceita URL https do CDN de fotos do Google. Qualquer outra coisa → null. */
export function fotoDoGoogleValida(url: unknown): string | null {
  if (typeof url !== 'string' || url.length > 1000) return null
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' || !HOST_DO_GOOGLE.test(u.hostname)) return null
    return u.toString()
  } catch {
    return null
  }
}

/**
 * Pede ao Google a foto já no tamanho exibido (×2 para telas retina), recortada
 * em quadrado. `…=s96-c` → `…=s168-c`; URL sem sufixo ganha um.
 */
export function fotoDoGoogleNoTamanho(url: string | null | undefined, px: number): string | null {
  const valida = fotoDoGoogleValida(url)
  if (!valida) return null
  const lado = Math.min(512, Math.max(32, Math.round(px * 2)))
  const u = new URL(valida)
  if (u.searchParams.has('sz')) {
    u.searchParams.set('sz', String(lado))
    return u.toString()
  }
  if (/=[a-z0-9-]+$/i.test(u.pathname)) {
    u.pathname = u.pathname.replace(/=[a-z0-9-]+$/i, `=s${lado}-c`)
  } else {
    u.pathname = `${u.pathname}=s${lado}-c`
  }
  return u.toString()
}

/** URL do retrato a mostrar: galeria > Google > nenhum (iniciais). */
export function urlDoRetrato(
  avatar: string | null | undefined,
  fotoGoogle: string | null | undefined,
  px: number,
): string | null {
  return avatarPorId(avatar)?.url || fotoDoGoogleNoTamanho(fotoGoogle, px)
}
