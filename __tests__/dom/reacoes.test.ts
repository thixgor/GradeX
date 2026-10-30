import { describe, expect, it } from 'vitest'
import { momentoParaEvento } from '@/lib/dom/reacoes'
import { FALAS, textoDaFala, todasAsFalas } from '@/components/dom/falas'

describe('momentoParaEvento', () => {
  const r = (certa: boolean, antes: number) => momentoParaEvento({ tipo: 'resposta', certa }, { antes, agora: certa ? antes + 1 : 0 })?.momento ?? null
  it('foguinho em 3, 5 e a cada 10', () => {
    expect(r(true, 1)).toBeNull()
    expect(r(true, 2)).toBe('foguinho3')
    expect(r(true, 4)).toBe('foguinho5')
    expect(r(true, 9)).toBe('foguinho10')
    expect(r(true, 19)).toBe('foguinho10')
    expect(r(true, 6)).toBeNull()
  })
  it('consola quando apaga uma sequência boa, e só aí', () => {
    expect(r(false, 4)).toBe('apagouFoguinho')
    expect(r(false, 1)).toBeNull()
  })
  it('nota da prova', () => {
    const n = (p: number) => momentoParaEvento({ tipo: 'resultado', percentual: p }, { antes: 0, agora: 0 })?.momento
    expect(n(100)).toBe('gabaritou')
    expect(n(85)).toBe('notaAlta')
    expect(n(60)).toBe('notaMedia')
    expect(n(30)).toBe('notaBaixa')
  })
  it('marcos de dias seguidos', () => {
    const d = (dias: number) => momentoParaEvento({ tipo: 'sequenciaDias', dias }, { antes: 0, agora: 0 })?.momento ?? null
    expect(d(3)).toBe('sequencia3')
    expect(d(7)).toBe('sequencia7')
    expect(d(14)).toBe('sequencia7')
    expect(d(30)).toBe('sequencia30')
    expect(d(5)).toBeNull()
  })
})

describe('catálogo de falas', () => {
  it('ids únicos, todo momento com fala, nenhum nome de aluno no áudio', () => {
    const todas = todasAsFalas()
    expect(new Set(todas.map((f) => f.id)).size).toBe(todas.length)
    for (const lista of Object.values(FALAS)) expect(lista.length).toBeGreaterThan(0)
    for (const f of todas) {
      expect(f.voz).not.toMatch(/\{nome\}/)
      expect(f.id).toMatch(/^[a-z0-9-]+$/)
    }
    expect(todas.length).toBeGreaterThanOrEqual(250)
  })
  it('texto do balão sai sem as tags de entonação', () => {
    expect(textoDaFala({ id: 'x', voz: '[excited] Achei! [laughs] Olha.' })).toBe('Achei! Olha.')
  })
})
