import { describe, expect, it } from 'vitest'

import acervo from '@/data/histologia-zoom/acervo-histoviewer.json'
import acervoDzi from '@/data/histologia-zoom/acervo-dzi.json'
import acervoImagens from '@/data/histologia-zoom/acervo-imagens.json'
import { COLORACOES, coloracaoDe, normalizarColoracao } from '@/lib/histologia-zoom/coloracoes'
import { CURADORIA } from '@/lib/histologia-zoom/curadoria'
import { LAMINAS, ORGAOS, TOTAIS, laminaPorSlug, orgaosDoSistema } from '@/lib/histologia-zoom/repositorio'
import { SISTEMAS } from '@/lib/histologia-zoom/sistemas'
import { TECIDOS } from '@/lib/histologia-zoom/tecidos'
import type { EspecimeColetado } from '@/lib/histologia-zoom/tipos'

const especimesHv = (acervo as { especimes: EspecimeColetado[] }).especimes
const especimesDzi = (acervoDzi as { especimes: EspecimeColetado[] }).especimes
const especimesImg = (acervoImagens as { especimes: EspecimeColetado[] }).especimes
const especimes = [...especimesHv, ...especimesDzi, ...especimesImg]

describe('acervo coletado', () => {
  it('toda pirâmide está em ordem crescente e tem grid suficiente para o conteúdo', () => {
    for (const e of especimes) {
      expect(e.niveis.length, e.root).toBeGreaterThan(0)
      for (let i = 1; i < e.niveis.length; i++) {
        expect(e.niveis[i].largura, e.root).toBeGreaterThan(e.niveis[i - 1].largura)
      }
      for (const n of e.niveis) {
        // O conteúdo nunca pode exceder o grid: o tile de borda é recortado, não esticado.
        expect(n.nx * n.tileL, `${e.root} ${n.magn}x`).toBeGreaterThanOrEqual(n.largura - 1)
        expect(n.ny * n.tileA, `${e.root} ${n.magn}x`).toBeGreaterThanOrEqual(n.altura - 1)
      }
    }
  })

  it('toda coloração do acervo tem tradução', () => {
    for (const e of especimes) {
      expect(COLORACOES[normalizarColoracao(e.coloracao)], e.coloracao).toBeDefined()
    }
  })
})

describe('acervo GTEx (DZI)', () => {
  it('toda lâmina DZI tem base absoluta, sobreposição e níveis coerentes', () => {
    for (const e of especimesDzi) {
      expect(e.formato).toBe('dzi')
      expect(e.base).toMatch(/^https:\/\/gtexportal\.org\/openslide\/gtexhip\/.+_files\/$/)
      expect(e.sobreposicao).toBe(1)
      const topo = e.niveis[e.niveis.length - 1]
      expect(topo.magn).toBe(20)
    }
  })

  it('todas as lâminas do GTEx são humanas', () => {
    for (const l of LAMINAS.filter((x) => x.fonte === 'gtex')) expect(l.origem.categoria, l.slug).toBe('humana')
  })
})

describe('fotomicrografias avulsas (Commons, HPA)', () => {
  const avulsas = LAMINAS.filter((l) => l.piramide.formato === 'imagem')

  it('todas entraram, com crédito completo exigido pela licença', () => {
    expect(avulsas).toHaveLength(especimesImg.length)
    for (const l of avulsas) {
      expect(['commons', 'hpa']).toContain(l.fonte)
      expect(l.credito?.autor, l.slug).toBeTruthy()
      expect(l.credito?.licenca, l.slug).toMatch(/^(CC0|CC BY(-SA)? \d\.\d|Public domain)/)
      expect(l.credito?.urlFonte, l.slug).toMatch(/^https:\/\//)
    }
  })

  it('cada nível é uma imagem inteira, do menor para o original', () => {
    for (const e of especimesImg) {
      expect(e.formato).toBe('imagem')
      for (const n of e.niveis) {
        expect([n.nx, n.ny]).toEqual([1, 1])
        expect(n.pasta).toMatch(/^https:\/\//)
      }
      for (let i = 1; i < e.niveis.length; i++) expect(e.niveis[i].largura).toBeGreaterThan(e.niveis[i - 1].largura)
    }
  })

  it('a espécie é a que o autor declarou — humana só quando escrita na legenda', () => {
    for (const e of especimesImg) {
      const l = avulsas.find((x) => x.piramide.niveis.at(-1)?.pasta === e.niveis.at(-1)?.pasta)!
      expect(l.origem.categoria, e.root).toBe(e.especieDeclarada === 'humana' ? 'humana' : 'nao-informada')
    }
  })

  it('as lâminas de lâmina inteira não trazem crédito por imagem', () => {
    for (const l of LAMINAS.filter((x) => x.piramide.formato !== 'imagem')) expect(l.credito, l.slug).toBeNull()
  })
})

describe('curadoria', () => {
  it('todo espécime coletado tem curadoria, e toda curadoria aponta para um espécime', () => {
    const roots = new Set(especimes.map((e) => e.root))
    for (const root of roots) expect(CURADORIA[root], root).toBeDefined()
    for (const root of Object.keys(CURADORIA)) expect(roots.has(root), root).toBe(true)
  })

  it('toda curadoria aponta para um órgão com ficha', () => {
    const ids = new Set(ORGAOS.map((o) => o.id))
    for (const [root, cur] of Object.entries(CURADORIA)) expect(ids.has(cur.orgao), root).toBe(true)
  })

  it('todo espécime vira lâmina publicada, com slug único', () => {
    expect(LAMINAS).toHaveLength(especimes.length)
    const slugs = new Set(LAMINAS.map((l) => l.slug))
    expect(slugs.size).toBe(LAMINAS.length)
    for (const l of LAMINAS) {
      expect(l.slug).toMatch(/^[a-z0-9-]+$/)
      expect(laminaPorSlug(l.slug)).toBe(l)
    }
  })

  it('slugs de referência continuam estáveis', () => {
    // URLs já compartilhadas (QR codes impressos, links em aula) dependem disso.
    expect(laminaPorSlug('medula-espinal-tionina')?.hv.id).toBeDefined()
    expect(laminaPorSlug('traqueia-he')).toBeDefined()
  })
})

describe('fichas', () => {
  it('os ids de órgão são únicos', () => {
    expect(new Set(ORGAOS.map((o) => o.id)).size).toBe(ORGAOS.length)
  })

  it.each(ORGAOS.map((o) => [o.id, o] as const))('%s: células e tecidos somam 100 %%', (_id, o) => {
    const { celulas, tecidos, semTecidos } = o.ficha
    if (celulas.length) expect(celulas.reduce((s, c) => s + c.pct, 0)).toBe(100)
    if (tecidos.length) expect(tecidos.reduce((s, t) => s + t.pct, 0)).toBe(100)
    else expect(semTecidos, 'tabela de tecidos vazia precisa de justificativa').toBeTruthy()
    for (const t of tecidos) {
      expect(TECIDOS[t.tipo], t.tipo).toBeDefined()
      expect(t.pct).toBeGreaterThan(0)
      expect(t.onde.length).toBeGreaterThan(0)
    }
    for (const c of celulas) expect(c.pct).toBeGreaterThan(0)
    if (!o.ficha.epitelios.length) expect(o.ficha.semEpitelio, 'sem epitélio precisa de explicação').toBeTruthy()
    expect(o.ficha.morfologia.length).toBeGreaterThan(0)
    expect(o.ficha.reconhecer.length).toBeGreaterThan(0)
  })

  it('todo sistema tem ao menos um órgão com lâmina', () => {
    for (const s of SISTEMAS) expect(orgaosDoSistema(s.id).length, s.id).toBeGreaterThan(0)
    expect(TOTAIS.sistemas).toBe(SISTEMAS.length)
  })

  it('o exemplo do pedido existe: Sistema Nervoso → Medula espinal', () => {
    expect(orgaosDoSistema('nervoso').map((o) => o.id)).toContain('medula-espinal')
  })
})

describe('colorações', () => {
  it('normaliza as grafias variantes do mesmo corante', () => {
    expect(coloracaoDe('May-Gruenwald-Giemsa').id).toBe(coloracaoDe('May-Giemsa-Grünwald').id)
    expect(coloracaoDe('Immunohistochemistry of insulin in β-cells').id).toBe('imuno-insulina')
  })
})
