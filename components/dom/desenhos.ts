'use client'

/**
 * Baixa os desenhos do Dom (gerados por `scripts/dom/preparar-mascotes.mjs`)
 * uma vez por aba e separa as partes (`<g data-parte="…">`).
 *
 * Os arquivos ficam em `/dom/v1/` com cache imutável na borda e no navegador
 * (ver `next.config.js`): o segundo acesso não sai da máquina do aluno. Não
 * vão no bundle de JavaScript de propósito — 190 KB de caminho SVG dentro de
 * um chunk seriam baixados e PARSEADOS como JS em toda página.
 */

export type NomeDoDesenho = 'dom' | 'dom-socrates' | 'domineaqui-ai'

export interface Desenho {
  viewBox: string
  partes: Record<string, string>
}

const VERSAO = 'v1'
const cache = new Map<NomeDoDesenho, Promise<Desenho>>()

function separar(svg: string): Desenho {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] || '0 0 100 100'
  const partes: Record<string, string> = {}
  const re = /<g data-parte="([a-z-]+)">([\s\S]*?)<\/g>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(svg))) partes[m[1]] = m[2]
  return { viewBox, partes }
}

export function carregarDesenho(nome: NomeDoDesenho): Promise<Desenho> {
  let p = cache.get(nome)
  if (!p) {
    p = fetch(`/dom/${VERSAO}/${nome}.svg`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(separar)
      .catch((e) => {
        cache.delete(nome) // a próxima montagem tenta de novo
        throw e
      })
    cache.set(nome, p)
  }
  return p
}

/** Já baixado? (para pular o esqueleto na segunda montagem). */
export function desenhoPronto(nome: NomeDoDesenho): boolean {
  return cache.has(nome)
}
