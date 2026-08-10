import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

import {
  esquemaEntradaCatalogada,
  esquemaMidiaCatalogada,
} from '@/lib/histopatologia/esquemas'
import { FONTES, hostPermitido, urlRemotaValida } from '@/lib/histopatologia/direitos'

/**
 * Integridade do catálogo-fonte.
 *
 * Este arquivo é o guardião do dado que ninguém deveria editar. Ele repete, em
 * Vitest, a verificação de `public/patologia/scripts/validar-catalogo.mjs` e vai
 * além em três pontos que importam para o produto: valida cada registro contra
 * os schemas Zod do módulo, confere a allowlist de domínios e prova que o
 * catálogo não contém byte de imagem nenhum.
 *
 * É o teste mais lento da suíte (descompacta 92 MB de JSON). Ele existe porque a
 * alternativa — confiar que o catálogo não mudou — é exatamente o tipo de
 * suposição que produz um atlas inteiro de links quebrados sem nenhum erro de
 * build.
 */

const RAIZ = path.resolve(__dirname, '../..')
const CATALOGO = path.join(RAIZ, 'public/patologia/catalogo')

const ler = (relativo: string) => JSON.parse(readFileSync(path.join(CATALOGO, relativo), 'utf8'))

const manifesto = ler('manifesto.json')
const fontesDoCatalogo = ler('fontes.json')
const patologias = ler('patologias.json')
const falhas = ler('falhas-de-coleta.json')

describe('manifesto e índice', () => {
  it('declara os totais anunciados na documentação do pacote', () => {
    expect(manifesto.totais.patologias).toBe(2917)
    expect(manifesto.totais.midias).toBe(202593)
    expect(manifesto.arquivos.fragmentosDeMidia).toHaveLength(18)
    expect(manifesto.totais.falhasDeColeta).toBe(288)
  })

  it('o índice de patologias bate com o manifesto', () => {
    expect(patologias).toHaveLength(manifesto.totais.patologias)
    expect(falhas).toHaveLength(manifesto.totais.falhasDeColeta)
  })

  it('toda entrada catalogada passa pelo schema do módulo', () => {
    for (const entrada of patologias) {
      const resultado = esquemaEntradaCatalogada.safeParse(entrada)
      expect(resultado.success, `${entrada.id}: ${resultado.error?.issues[0]?.message}`).toBe(true)
    }
  })

  it('não há id de entrada duplicado', () => {
    const ids = new Set(patologias.map((p: { id: string }) => p.id))
    expect(ids.size).toBe(patologias.length)
  })

  it('toda entrada aponta para uma fonte registrada no portão de direitos', () => {
    for (const entrada of patologias) {
      expect(FONTES[entrada.fonteId as keyof typeof FONTES], entrada.id).toBeDefined()
    }
    for (const fonte of fontesDoCatalogo) {
      expect(FONTES[fonte.id as keyof typeof FONTES]).toBeDefined()
    }
  })
})

describe('fragmentos de mídia', () => {
  /**
   * Uma passada única sobre os 18 fragmentos, com todas as verificações
   * acumuladas. Descompactar dezoito vezes — uma por asserção — multiplicaria
   * por seis o tempo da suíte inteira para verificar o mesmo dado.
   */
  const idsDePatologia = new Set(patologias.map((p: { id: string }) => p.id))
  const fragmentosDeclarados = new Map<string, Set<string>>(
    patologias.map((p: { id: string; fragmentosDeMidia: string[] }) => [
      p.id,
      new Set(p.fragmentosDeMidia),
    ]),
  )

  const problemas = {
    hash: [] as string[],
    contagem: [] as string[],
    schema: [] as string[],
    patologiaInexistente: [] as string[],
    fragmentoNaoDeclarado: [] as string[],
    protocolo: [] as string[],
    semDestino: [] as string[],
  }
  const porPatologia = new Map<string, number>()
  const hostsForaDaAllowlist = new Map<string, number>()
  let total = 0

  for (const parte of manifesto.arquivos.fragmentosDeMidia) {
    const compactado = readFileSync(path.join(CATALOGO, parte.arquivo))
    const sha = createHash('sha256').update(compactado).digest('hex')
    if (sha !== parte.sha256) problemas.hash.push(parte.arquivo)

    const registros = JSON.parse(gunzipSync(compactado).toString('utf8'))
    if (registros.length !== parte.registros) problemas.contagem.push(parte.arquivo)

    for (const bruta of registros) {
      total += 1
      const resultado = esquemaMidiaCatalogada.safeParse(bruta)
      if (!resultado.success) {
        problemas.schema.push(`${bruta?.id}: ${resultado.error.issues[0]?.message}`)
        continue
      }
      const midia = resultado.data

      if (!idsDePatologia.has(midia.patologiaId)) {
        problemas.patologiaInexistente.push(midia.id)
        continue
      }
      if (!fragmentosDeclarados.get(midia.patologiaId)?.has(parte.arquivo)) {
        problemas.fragmentoNaoDeclarado.push(`${midia.patologiaId} → ${parte.arquivo}`)
      }
      porPatologia.set(midia.patologiaId, (porPatologia.get(midia.patologiaId) ?? 0) + 1)

      const urls = [midia.urlImagem, midia.urlMiniatura, midia.urlVisualizador].filter(Boolean)
      if (urls.length === 0) problemas.semDestino.push(midia.id)
      for (const url of urls) {
        if (!urlRemotaValida(url)) problemas.protocolo.push(`${midia.id}: ${url}`)
        else if (!hostPermitido(midia.fonteId, url)) {
          const host = new URL(url!).host
          hostsForaDaAllowlist.set(host, (hostsForaDaAllowlist.get(host) ?? 0) + 1)
        }
      }
    }
  }

  it('todo fragmento confere o SHA-256 do manifesto', () => {
    expect(problemas.hash).toEqual([])
  })

  it('toda contagem de registros confere com o manifesto', () => {
    expect(problemas.contagem).toEqual([])
  })

  it('toda mídia passa pelo schema do módulo', () => {
    expect(problemas.schema.slice(0, 5)).toEqual([])
  })

  it('as 202.593 referências continuam vinculadas a uma das 2.917 entradas', () => {
    expect(total).toBe(202593)
    expect(problemas.patologiaInexistente).toEqual([])
    const somaPorEntrada = [...porPatologia.values()].reduce((n, v) => n + v, 0)
    expect(somaPorEntrada).toBe(total)
  })

  it('o índice de cada entrada declara os fragmentos onde as mídias realmente estão', () => {
    expect(problemas.fragmentoNaoDeclarado).toEqual([])
  })

  it('cada entrada tem exatamente a quantidade de mídias que declara', () => {
    const divergentes = patologias
      .filter(
        (p: { id: string; quantidadeMidias: number }) =>
          (porPatologia.get(p.id) ?? 0) !== p.quantidadeMidias,
      )
      .map((p: { id: string }) => p.id)
    expect(divergentes).toEqual([])
  })

  it('nenhuma URL usa protocolo diferente de https', () => {
    expect(problemas.protocolo).toEqual([])
  })

  it('toda mídia tem ao menos um destino remoto declarado', () => {
    expect(problemas.semDestino).toEqual([])
  })

  /**
   * A allowlist não é uma formalidade: o catálogo carrega, junto das lâminas,
   * selos de repositório e pixels de rastreamento capturados das páginas de
   * origem. Este teste trava o número — se ele mudar, alguém precisa olhar o que
   * entrou, e não ajustar a expectativa.
   */
  it('as URLs fora da allowlist são exatamente as conhecidas, e nenhuma é lâmina', () => {
    const hosts = [...hostsForaDaAllowlist.keys()].sort()
    expect(hosts).toEqual([
      'bjr.birjournals.org',
      'books.apple.com',
      'geoloc12.geovisite.ovh',
      'github.com',
      'img.shields.io',
      'leanpub.com',
      'live.staticflickr.com',
      'mapmyvisitors.com',
      'play.google.com',
      'tools.applemediaservices.com',
      'www.flickr.com',
      'www.fcm.unicamp.br',
      'www.geovisites.com',
      'www.google.com',
      'www.instagram.com',
      'www.rosaicollection.org',
      'www.unicamp.br',
      'www.virtualpathology.leeds.ac.uk',
      'www.youtube.com',
      'zenodo.org',
    ].sort())
    const total = [...hostsForaDaAllowlist.values()].reduce((n, v) => n + v, 0)
    expect(total).toBe(71)
  })
})

describe('o catálogo não contém imagem', () => {
  it('todo fragmento é JSON de texto, não binário de imagem', () => {
    for (const parte of manifesto.arquivos.fragmentosDeMidia) {
      const conteudo = gunzipSync(readFileSync(path.join(CATALOGO, parte.arquivo))).toString('utf8')
      expect(conteudo.trimStart().startsWith('['), parte.arquivo).toBe(true)
      // Assinaturas de arquivo de imagem em base64 embutida.
      expect(/data:image\/(jpe?g|png|gif|webp)/i.test(conteudo), parte.arquivo).toBe(false)
    }
  })

  it('o manifesto declara explicitamente que nenhuma imagem foi baixada', () => {
    expect(manifesto.metodo).toContain('nenhuma imagem')
  })
})
