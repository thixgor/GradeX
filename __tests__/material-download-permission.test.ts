import { describe, expect, it } from 'vitest'

import {
  materialAllowsDownload,
  normalizeDownloadOverride,
  pdfDownloadDeniedMessage,
  readDownloadOverride,
  resolvePdfDownloadPermission,
  resolvePdfDownloadPermissionFrom,
} from '@/lib/material-download-permission'

/**
 * A liberação individual existe para não depender do e-mail com o PDF anexado:
 * material grande estoura o limite da caixa de quem recebe, então o download
 * fica desligado para todos e o admin libera nominalmente quem pediu.
 *
 * O que estes testes protegem é o padrão: sem liberação explícita, ninguém
 * baixa um material bloqueado. Inverter isso vazaria o acervo inteiro.
 */

const BLOQUEADO = { pdfDownloadEnabled: false }
const LIBERADO = { pdfDownloadEnabled: true }

describe('resolvePdfDownloadPermission', () => {
  it('não libera quem não foi liberado, num material bloqueado', () => {
    expect(resolvePdfDownloadPermission(BLOQUEADO, { status: 'completed' })).toEqual({
      allowed: false,
      source: 'material',
    })
  })

  it('não libera nem quando não há registro de acesso nenhum', () => {
    expect(resolvePdfDownloadPermission(BLOQUEADO, null).allowed).toBe(false)
    expect(resolvePdfDownloadPermission(BLOQUEADO, undefined).allowed).toBe(false)
  })

  it('libera a pessoa autorizada, mesmo com o material bloqueado', () => {
    expect(resolvePdfDownloadPermission(BLOQUEADO, { pdfDownloadAllowed: true })).toEqual({
      allowed: true,
      source: 'individual',
    })
  })

  it('bloqueia uma pessoa específica sem tirar o download de todas', () => {
    expect(resolvePdfDownloadPermission(LIBERADO, { pdfDownloadAllowed: false })).toEqual({
      allowed: false,
      source: 'individual',
    })
  })

  it('mantém o comportamento antigo: material sem a flag continua liberado', () => {
    // Materiais criados antes do controle não têm `pdfDownloadEnabled`.
    expect(resolvePdfDownloadPermission({}, null).allowed).toBe(true)
    expect(materialAllowsDownload({})).toBe(true)
  })

  it('ignora lixo gravado no campo em vez de tratá-lo como liberação', () => {
    // Um `'true'` em texto (ou qualquer outra coisa) não pode virar permissão.
    for (const lixo of ['true', 1, {}, 'sim', null]) {
      expect(resolvePdfDownloadPermission(BLOQUEADO, { pdfDownloadAllowed: lixo }).allowed).toBe(false)
    }
  })
})

describe('readDownloadOverride', () => {
  it('só reconhece booleano; o resto herda o material', () => {
    expect(readDownloadOverride({ pdfDownloadAllowed: true })).toBe(true)
    expect(readDownloadOverride({ pdfDownloadAllowed: false })).toBe(false)
    expect(readDownloadOverride({ pdfDownloadAllowed: 'true' })).toBe(null)
    expect(readDownloadOverride({})).toBe(null)
    expect(readDownloadOverride(null)).toBe(null)
  })
})

describe('normalizeDownloadOverride', () => {
  it('aceita as três decisões do painel e descarta o resto', () => {
    expect(normalizeDownloadOverride(true)).toBe(true)
    expect(normalizeDownloadOverride('true')).toBe(true)
    expect(normalizeDownloadOverride('allow')).toBe(true)
    expect(normalizeDownloadOverride(false)).toBe(false)
    expect(normalizeDownloadOverride('block')).toBe(false)
    // Qualquer outra coisa devolve a decisão ao padrão do material.
    expect(normalizeDownloadOverride(null)).toBe(null)
    expect(normalizeDownloadOverride('talvez')).toBe(null)
    expect(normalizeDownloadOverride(undefined)).toBe(null)
  })
})

describe('resolvePdfDownloadPermissionFrom', () => {
  it('decide igual à versão que recebe os documentos', () => {
    expect(resolvePdfDownloadPermissionFrom(false, null).allowed).toBe(false)
    expect(resolvePdfDownloadPermissionFrom(false, true).allowed).toBe(true)
    expect(resolvePdfDownloadPermissionFrom(true, false).allowed).toBe(false)
    expect(resolvePdfDownloadPermissionFrom(undefined, null).allowed).toBe(true)
  })
})

describe('pdfDownloadDeniedMessage', () => {
  it('separa "bloqueado para todos" de "bloqueado para você"', () => {
    const individual = pdfDownloadDeniedMessage({ allowed: false, source: 'individual' })
    const material = pdfDownloadDeniedMessage({ allowed: false, source: 'material' })
    expect(individual).toMatch(/sua conta/i)
    expect(material).not.toMatch(/sua conta/i)
  })
})
