import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import acervo from '@/data/histologia-zoom/acervo-histoviewer.json'
import { FONTES_LICENCIADAS } from '@/lib/acervos-licenciados'
import { ORIGEM_POR_PECA } from '@/lib/histologia-zoom/especies'
import { CREDITO_CURTO } from '@/lib/histologia-zoom/fonte'
import { LAMINAS } from '@/lib/histologia-zoom/repositorio'
import type { EspecimeColetado } from '@/lib/histologia-zoom/tipos'

const especimes = (acervo as { especimes: EspecimeColetado[] }).especimes
const RAIZ = path.resolve(__dirname, '../..')

/** Espécies como a fonte as escreve (inglês e dinamarquês). */
const ANIMAL = /\b(monkey|abe|rat|rotte|mouse|rabbit|kanin|guinea pig|marsvin|dog|hund|cat|kat|pig|svin|bean)\b/i
const HUMANO = /\b(homo|human)\b/i

describe('transparência da espécie', () => {
  it('toda peça que a fonte declara como animal ou vegetal está marcada como tal', () => {
    for (const e of especimes) {
      const texto = `${e.nome} ${e.texto}`
      if (!ANIMAL.test(texto)) continue
      const origem = ORIGEM_POR_PECA[e.root]
      expect(origem, `${e.root}: "${texto}"`).toBeDefined()
      expect(['nao-humana', 'vegetal'], e.root).toContain(origem!.categoria)
    }
  })

  it('só é "humana" o que a fonte declara humano', () => {
    for (const [root, origem] of Object.entries(ORIGEM_POR_PECA)) {
      if (origem.categoria !== 'humana') continue
      const e = especimes.find((x) => x.root === root)!
      expect(HUMANO.test(`${e.nome} ${e.texto}`), root).toBe(true)
    }
  })

  it('toda peça não humana compara com o humano, dizendo o que muda e o que é igual', () => {
    for (const l of LAMINAS) {
      if (l.origem.categoria !== 'nao-humana' && l.origem.categoria !== 'vegetal') continue
      expect(l.origem.comparacao, l.slug).toBeDefined()
      expect(l.origem.comparacao!.resumo.length, l.slug).toBeGreaterThan(40)
      expect(l.origem.comparacao!.diferencas.length, l.slug).toBeGreaterThan(0)
      expect(l.origem.comparacao!.igual.length, l.slug).toBeGreaterThan(0)
    }
  })

  it('toda entrada do mapa de origem aponta para uma peça do acervo', () => {
    const roots = new Set(especimes.map((e) => e.root))
    for (const root of Object.keys(ORIGEM_POR_PECA)) expect(roots.has(root), root).toBe(true)
  })

  it('peça sem espécie declarada aparece como "não informada", nunca como humana', () => {
    for (const l of LAMINAS) {
      // O GTEx declara todo o acervo como de doadores humanos.
      if (l.fonte === 'gtex') continue
      // Imagens avulsas: espécie declarada na legenda (testada em catalogo.test.ts).
      if (l.piramide.formato === 'imagem') continue
      const root = l.piramide.base.split('/imgsets/')[1]
      if (!(root in ORIGEM_POR_PECA)) expect(l.origem.categoria, l.slug).toBe('nao-informada')
    }
  })
})

describe('apresentação como Microscopia Virtual — Domine Aqui', () => {
  it('a autorização está registrada com o documento que a sustenta', () => {
    const f = FONTES_LICENCIADAS.histoviewer
    expect(f.comprovante.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(f.comprovante.data).toBe('2026-09-26')
    expect(f.restricoes.join(' ').toLowerCase()).toContain('terceiros')
    expect(CREDITO_CURTO).toBe('Microscopia Virtual · Domine Aqui')
  })

  it('nenhum texto visível da interface cita o acervo de origem', () => {
    // Comentários podem (e devem) registrar a procedência; texto de tela não.
    const alvos = ['components/histologia-zoom', 'app/manual-clinico/histologia/zoom']
    const arquivos: string[] = []
    const varrer = (dir: string) => {
      for (const nome of readdirSync(dir)) {
        const completo = path.join(dir, nome)
        if (statSync(completo).isDirectory()) varrer(completo)
        else if (/\.tsx?$/.test(nome)) arquivos.push(completo)
      }
    }
    alvos.forEach((a) => varrer(path.join(RAIZ, a)))
    for (const arquivo of arquivos) {
      const linhas = readFileSync(arquivo, 'utf8').split('\n')
      linhas.forEach((linha, i) => {
        const t = linha.trim()
        if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*') || t.startsWith('{/*')) return
        expect(/HistoViewer|Aarhus/i.test(t), `${path.relative(RAIZ, arquivo)}:${i + 1}`).toBe(false)
      })
    }
  })
})
