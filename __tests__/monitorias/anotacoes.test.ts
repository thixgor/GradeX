import { describe, expect, it, vi } from 'vitest'
import { ANOTACOES_MAX, juntarAnotacoes } from '@/lib/monitorias/anotacoes'
import { montarPdfDasAnotacoes, paraWinAnsi } from '@/lib/monitorias/anotacoes-pdf'

describe('anotações: duas versões', () => {
  it('igual, contida ou vazia: fica a mais completa', () => {
    expect(juntarAnotacoes('abc', 'abc')).toBe('abc')
    expect(juntarAnotacoes('abc def', 'abc')).toBe('abc def')
    expect(juntarAnotacoes('abc', 'abc def')).toBe('abc def')
    expect(juntarAnotacoes('', 'remoto')).toBe('remoto')
    expect(juntarAnotacoes('local', '')).toBe('local')
  })

  it('divergentes: nada se perde, a local vem primeiro', () => {
    const r = juntarAnotacoes('do celular', 'do computador')
    expect(r.indexOf('do celular')).toBeLessThan(r.indexOf('do computador'))
    expect(r).toContain('[Do outro aparelho]')
  })

  it('respeita o limite', () => {
    expect(juntarAnotacoes('a'.repeat(ANOTACOES_MAX), 'b'.repeat(100)).length).toBeLessThanOrEqual(ANOTACOES_MAX)
  })
})

describe('PDF das anotações (no navegador)', () => {
  it('troca o que a Helvetica não desenha e mantém os acentos', () => {
    expect(paraWinAnsi('ação → reação ≥ 2 ✓ α H₂O x² 🫀')).toBe('ação -> reação >= 2 (ok) alfa H2O x2 ')
    expect(paraWinAnsi('“aspas” – travessão • item')).toBe('“aspas” – travessão • item')
  })

  it('monta o documento com ficha, páginas e rodapé', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false }))
    const texto = `# Ciclo\n- item\n1. passo\n[14:32] marcado\n\n${'Linha\n'.repeat(120)}`
    const doc = await montarPdfDasAnotacoes({
      texto,
      reserva: { id: '65f0c0ffee0000000000aaaa', curto: '00AAAA', titulo: 'Fisiologia', inicio: '2026-10-20T17:00:00Z', fim: '2026-10-20T18:00:00Z', monitor: 'Carla Mendes', autor: 'Bruno Lima', papel: 'aluno' },
    })
    expect(doc.getNumberOfPages()).toBeGreaterThan(1)
    const bruto = new TextDecoder('latin1').decode(doc.output('arraybuffer'))
    expect(bruto).toContain('Monitoria #00AAAA')
    vi.unstubAllGlobals()
  })

  it('sem anotações ainda: uma página com o aviso', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false }))
    const doc = await montarPdfDasAnotacoes({
      texto: '   ',
      reserva: { id: 'x', curto: 'X', titulo: 'T', inicio: null, fim: null, monitor: 'M', autor: 'A', papel: 'monitor' },
    })
    expect(doc.getNumberOfPages()).toBe(1)
    vi.unstubAllGlobals()
  })
})
