import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { GLOSSARIO, estruturaPorId, todasAsAnotacoes } from '@/lib/histologia-zoom/estruturas'
import type { AnotacaoDaLamina, Marca } from '@/lib/histologia-zoom/estruturas/tipos'
import { laminaPorSlug } from '@/lib/histologia-zoom/repositorio'

const PASTA = path.resolve(__dirname, '../../data/histologia-zoom/anotacoes')
const fontes: AnotacaoDaLamina[] = readdirSync(PASTA)
  .filter((n) => n.endsWith('.json'))
  .map((n) => JSON.parse(readFileSync(path.join(PASTA, n), 'utf8')))

function pontosDa(m: Marca): Array<[number, number]> {
  if (m.tipo === 'seta') return [m.ponta]
  if (m.tipo === 'contorno') return m.pontos
  return [
    [m.centro[0] - m.raios[0], m.centro[1] - m.raios[1]],
    [m.centro[0] + m.raios[0], m.centro[1] + m.raios[1]],
  ]
}

describe('glossário de estruturas', () => {
  it('ids únicos', () => {
    expect(new Set(GLOSSARIO.map((e) => e.id)).size).toBe(GLOSSARIO.length)
  })

  it.each(GLOSSARIO.map((e) => [e.id, e] as const))('%s está completo', (_id, e) => {
    expect(e.resumo.length).toBeGreaterThan(20)
    expect(e.caracteristicas.length).toBeGreaterThan(0)
    expect(e.funcoes.length).toBeGreaterThan(0)
    expect(e.regeneracao.texto.length).toBeGreaterThan(10)
    expect(e.ondeEncontrar.length).toBeGreaterThan(0)
    expect(e.alteracoes.length).toBeGreaterThan(0)
  })
})

describe('marcações por lâmina', () => {
  it('o consolidado está em dia com os arquivos de marcação', () => {
    // Rode `node scripts/histologia-zoom/consolidar-anotacoes.mjs` se falhar.
    const consolidado = todasAsAnotacoes()
    expect(Object.keys(consolidado).sort()).toEqual(fontes.map((f) => f.slug).sort())
    for (const f of fontes) expect(consolidado[f.slug], f.slug).toEqual(f)
  })

  it.each(fontes.map((f) => [f.slug, f] as const))('%s: lâmina, verbetes e coordenadas válidos', (slug, a) => {
    const lamina = laminaPorSlug(slug)
    expect(lamina, 'slug inexistente').toBeDefined()
    const alturaViewport = lamina!.altura / lamina!.largura
    const ids = new Set<string>()
    expect(a.revisao.conferencias, 'marcação sem conferência sobre a imagem').toBeGreaterThanOrEqual(1)
    for (const e of a.estruturas) {
      expect(ids.has(e.id), `id repetido: ${e.id}`).toBe(false)
      ids.add(e.id)
      expect(estruturaPorId(e.estrutura), `verbete inexistente: ${e.estrutura}`).toBeDefined()
      expect(e.marcas.length, e.id).toBeGreaterThan(0)
      for (const m of e.marcas) {
        if (m.tipo === 'contorno') expect(m.pontos.length, e.id).toBeGreaterThanOrEqual(3)
        for (const [x, y] of pontosDa(m)) {
          expect(x, `${e.id} x`).toBeGreaterThanOrEqual(0)
          expect(x, `${e.id} x`).toBeLessThanOrEqual(1)
          expect(y, `${e.id} y`).toBeGreaterThanOrEqual(0)
          expect(y, `${e.id} y`).toBeLessThanOrEqual(alturaViewport)
        }
      }
      if (e.vista) {
        const [x0, y0, x1, y1] = e.vista
        expect(x1 > x0 && y1 > y0, `${e.id} vista`).toBe(true)
      }
    }
  })
})

describe('enquadramento das marcações', () => {
  const setas = {
    id: 'no',
    estrutura: 'no-de-ranvier',
    marcas: [
      { tipo: 'seta' as const, ponta: [0.2, 0.3] as [number, number], angulo: 0 },
      { tipo: 'seta' as const, ponta: [0.6, 0.1] as [number, number], angulo: 0 },
    ],
  }

  it('setas espalhadas são vistas uma a uma, centradas na ponta', async () => {
    const { paradasDaMarcacao, vistaDaMarcacao } = await import('@/lib/histologia-zoom/desenho-de-marcacoes')
    expect(paradasDaMarcacao(setas)).toBe(2)
    const [x0, y0, x1, y1] = vistaDaMarcacao(setas, 1)
    expect((x0 + x1) / 2).toBeCloseTo(0.6)
    expect((y0 + y1) / 2).toBeCloseTo(0.1)
    expect(vistaDaMarcacao(setas, 2)).toEqual(vistaDaMarcacao(setas, 0))
  })

  it('contornos e marcas únicas são enquadrados de uma vez', async () => {
    const { paradasDaMarcacao } = await import('@/lib/histologia-zoom/desenho-de-marcacoes')
    expect(paradasDaMarcacao({ ...setas, marcas: [setas.marcas[0]] })).toBe(1)
    expect(
      paradasDaMarcacao({ ...setas, marcas: [...setas.marcas, { tipo: 'elipse', centro: [0.5, 0.5], raios: [0.1, 0.1] }] }),
    ).toBe(1)
  })
})

describe('rótulo da marcação', () => {
  const medir = (t: string) => t.length * 7

  it('quebra textos longos sem que nenhuma linha passe da largura', async () => {
    const { quebrarEmLinhas } = await import('@/lib/histologia-zoom/desenho-de-marcacoes')
    const texto = 'Epitélio da cripta (estratificado pavimentoso, infiltrado por linfócitos)'
    const linhas = quebrarEmLinhas(texto, 200, medir)
    expect(linhas.length).toBeGreaterThan(1)
    for (const l of linhas) expect(medir(l)).toBeLessThanOrEqual(200)
    expect(linhas.join(' ')).toBe(texto)
  })

  it('parte uma palavra maior que a linha', async () => {
    const { quebrarEmLinhas } = await import('@/lib/histologia-zoom/desenho-de-marcacoes')
    for (const l of quebrarEmLinhas('a'.repeat(60), 100, medir)) expect(medir(l)).toBeLessThanOrEqual(100)
  })
})

describe('vista declarada', () => {
  it('mantém o aumento da vista e centraliza nas marcas', async () => {
    const { vistaDaMarcacao } = await import('@/lib/histologia-zoom/desenho-de-marcacoes')
    const m = {
      id: 'x',
      estrutura: 'coloide',
      marcas: [{ tipo: 'elipse' as const, centro: [0.415, 0.224] as [number, number], raios: [0.004, 0.004] as [number, number] }],
      vista: [0.4, 0.2, 0.43, 0.23] as [number, number, number, number],
    }
    const [x0, y0, x1, y1] = vistaDaMarcacao(m)
    expect(x1 - x0).toBeCloseTo(0.03)
    expect((y0 + y1) / 2).toBeCloseTo(0.224)
  })
})

describe('campo mínimo do enquadramento', () => {
  it('nunca amplia além da resolução do scan', async () => {
    const { vistaDaMarcacao, CAMPO_MINIMO_EM_PIXELS } = await import('@/lib/histologia-zoom/desenho-de-marcacoes')
    const m = { id: 'x', estrutura: 'coloide', marcas: [{ tipo: 'seta' as const, ponta: [0.5, 0.5] as [number, number], angulo: 0 }] }
    const [x0, , x1] = vistaDaMarcacao(m, 0, 3264)
    expect((x1 - x0) * 3264).toBeGreaterThanOrEqual(CAMPO_MINIMO_EM_PIXELS - 1)
    const [a0, , a1] = vistaDaMarcacao(m, 0, 200000)
    expect(a1 - a0).toBeLessThan(0.01)
  })
})
