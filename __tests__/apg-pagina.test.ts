import { createRequire } from 'node:module'
import { afterEach, describe, expect, it } from 'vitest'
import { PERIODOS_APG, respostaApg } from '@/lib/apg-pagina'

const require = createRequire(import.meta.url)
// O mesmo código que o Next usa para decidir se uma reescrita com `has` casa.
const { matchHas } = require('next/dist/shared/lib/router/utils/prepare-destination')

/**
 * `/apg` era dinâmica: lia `?periodo=` a cada visita, e a borda guardava uma
 * cópia por URL completa, então todo `fbclid`/`utm_*` virava cache miss servido
 * por função. Agora as cinco versões saem prontas do build e a reescrita do
 * `next.config.js` escolhe entre elas. O que estes testes protegem é que cada
 * período continue com o seu <head> e que a reescrita não aceite nada além de
 * 1 a 4.
 */

async function html(periodo?: number) {
  return respostaApg(periodo).text()
}

function titulo(texto: string) {
  return texto.match(/<title>([^<]*)<\/title>/)?.[1]
}

describe('respostaApg', () => {
  it('serve a visão geral sem período', async () => {
    const texto = await html()
    expect(titulo(texto)).toBe('Cadernos de APG | DomineAqui')
    expect(texto).toContain('<link rel="canonical" href="https://domineaqui.com.br/apg">')
  })

  it.each([
    [1, 'SOI I'],
    [2, 'SOI II'],
    [3, 'SOI III'],
    [4, 'SOI IV'],
  ])('dá ao período %i o <head> dele', async (periodo, soi) => {
    const texto = await html(periodo)
    expect(titulo(texto)).toContain(`APGs de ${soi}:`)
    expect(texto).toContain(
      `<link rel="canonical" href="https://domineaqui.com.br/apg?periodo=${periodo}">`,
    )
  })

  it('cai na visão geral com período desconhecido', async () => {
    expect(titulo(await html(9))).toBe('Cadernos de APG | DomineAqui')
    expect(titulo(await html(Number.NaN))).toBe('Cadernos de APG | DomineAqui')
  })

  it('troca o <title> do bundler por um só <head>', async () => {
    const texto = await html(2)
    expect(texto).not.toContain('<title>Bundled Page</title>')
    expect(texto.match(/<title>/g)).toHaveLength(1)
  })

  it('manda a borda guardar e não o navegador', () => {
    const resposta = respostaApg(1)
    expect(resposta.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(resposta.headers.get('cache-control')).toBe(
      'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400',
    )
    expect(resposta.headers.get('set-cookie')).toBeNull()
  })

  it('pré-gera exatamente os períodos 1 a 4', () => {
    expect(PERIODOS_APG).toEqual(['1', '2', '3', '4'])
  })
})

describe('reescrita de /apg?periodo=N', () => {
  const baseOriginal = process.env.BLOB_PUBLIC_BASE_URL

  afterEach(() => {
    if (baseOriginal === undefined) delete process.env.BLOB_PUBLIC_BASE_URL
    else process.env.BLOB_PUBLIC_BASE_URL = baseOriginal
  })

  async function regras() {
    const config = require('../next.config.js')
    const { beforeFiles } = await config.rewrites()
    return beforeFiles as Array<{ source: string; destination: string; has?: unknown[] }>
  }

  async function regraApg() {
    const regra = (await regras()).find((r) => r.source === '/apg')
    expect(regra).toBeDefined()
    return regra!
  }

  function casa(has: unknown[], query: Record<string, string | string[]>) {
    return matchHas({ headers: {} }, query, has, [])
  }

  it('leva o período para o caminho da página pré-gerada', async () => {
    const regra = await regraApg()
    expect(regra.destination).toBe('/apg/periodo/:periodo')
    for (const periodo of PERIODOS_APG) {
      expect(casa(regra.has!, { periodo })).toEqual({ periodo })
    }
  })

  it('ignora parâmetros de rastreio', async () => {
    const regra = await regraApg()
    expect(
      casa(regra.has!, { periodo: '2', fbclid: 'IwAR0abc', utm_source: 'ig', utm_medium: 'social' }),
    ).toEqual({ periodo: '2' })
  })

  it.each(['12', '0', '5', 'abc', '', '1 ', '1/../../x', '1%2F'])(
    'não reescreve periodo=%j (fica na visão geral)',
    async (periodo) => {
      const regra = await regraApg()
      expect(casa(regra.has!, { periodo })).toBe(false)
    },
  )

  it('não reescreve sem periodo', async () => {
    const regra = await regraApg()
    expect(casa(regra.has!, { utm_source: 'ig' })).toBe(false)
  })

  it('mantém a reescrita do acervo só quando o Blob está configurado', async () => {
    delete process.env.BLOB_PUBLIC_BASE_URL
    expect((await regras()).some((r) => r.source === '/midia/:caminho*')).toBe(false)

    process.env.BLOB_PUBLIC_BASE_URL = 'https://exemplo.public.blob.vercel-storage.com/'
    const midia = (await regras()).find((r) => r.source === '/midia/:caminho*')
    expect(midia?.destination).toBe('https://exemplo.public.blob.vercel-storage.com/midia/:caminho*')
  })
})
