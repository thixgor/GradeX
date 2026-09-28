import { describe, expect, it } from 'vitest'

import { estruturaPorId } from '@/lib/histologia-zoom/estruturas'
import { BANCO, corrigir, montarQuiz } from '@/lib/histologia-zoom/quiz/banco'
import { cifrar, decifrar } from '@/lib/histologia-zoom/quiz/cifra'
import { conflitam } from '@/lib/histologia-zoom/quiz/confusoes'
import { confere } from '@/lib/histologia-zoom/quiz/respostas'
import { LAMINAS } from '@/lib/histologia-zoom/repositorio'

describe('quiz de identificação — banco', () => {
  it('tem muitas questões dos dois tipos', () => {
    expect(BANCO.filter((d) => d.tipo === 'estrutura').length).toBeGreaterThan(500)
    expect(BANCO.filter((d) => d.tipo === 'orgao').length).toBeGreaterThan(150)
  })

  it('nada no que vai ao navegador revela lâmina, órgão ou resposta', async () => {
    const qs = await montarQuiz({ tipos: [], formato: 'misto', sistemas: [], quantidade: 80, semente: 7 })
    const proibidos = [
      ...LAMINAS.flatMap((l) => [l.slug, l.titulo]),
      'imgsets',
      'histoviewer',
      'gtexportal',
      'wikimedia',
      'proteinatlas',
    ].map((t) => t.toLowerCase())
    for (const q of qs) {
      const semOpcoes = JSON.stringify({ ...q, opcoes: null }).toLowerCase()
      for (const p of proibidos) if (p.length > 4) expect(semOpcoes.includes(p), `${p} vazou`).toBe(false)
    }
  })

  it('objetivas: 5 alternativas distintas, uma certa, nenhuma que também seria certa', async () => {
    const qs = await montarQuiz({ tipos: ['estrutura'], formato: 'objetiva', sistemas: [], quantidade: 200, semente: 3 })
    for (const q of qs) {
      const ids = q.opcoes!.map((o) => o.id)
      expect(new Set(ids).size).toBe(5)
      expect(new Set(q.opcoes!.map((o) => o.texto.toLowerCase())).size).toBe(5)
      const c = await corrigir(q.id, { opcao: ids[0] }, ids)
      expect(c).not.toBeNull()
      const certa = c!.opcaoCerta!
      expect(ids).toContain(certa)
      for (const d of ids) if (d !== certa) expect(conflitam(d, certa), `${d} x ${certa}`).toBe(false)
    }
  })

  it('a resposta comentada é aprofundada', async () => {
    const [q] = await montarQuiz({ tipos: ['estrutura'], formato: 'objetiva', sistemas: [], quantidade: 1, semente: 11 })
    const c = await corrigir(q.id, { opcao: q.opcoes![0].id }, q.opcoes!.map((o) => o.id))
    const titulos = c!.secoes.map((s) => s.titulo)
    expect(titulos.some((t) => t.startsWith('Por que não é'))).toBe(true)
    expect(titulos).toContain('Correlação clínica: alterações típicas')
    expect(c!.secoes.length).toBeGreaterThanOrEqual(7)
  })

  it('órgão: acerta escrevendo o nome, erra com outro', async () => {
    const [q] = await montarQuiz({ tipos: ['orgao'], formato: 'escrita', sistemas: ['cardiovascular'], quantidade: 1, semente: 5 })
    const gabarito = (await corrigir(q.id, { texto: 'xyz' }))!.respostaCerta
    expect((await corrigir(q.id, { texto: gabarito.toUpperCase() }))!.resultado).toBe('certo')
    expect((await corrigir(q.id, { texto: 'fígado' }))!.resultado).toBe('errado')
  })

  it('token adulterado é recusado', async () => {
    expect(await corrigir('abc', { texto: 'x' })).toBeNull()
    const t = await cifrar('olá')
    expect(await decifrar(t)).toBe('olá')
    expect(await decifrar(t.slice(0, -2) + 'AA')).toBeNull()
  })
})

describe('correção de resposta escrita', () => {
  it('tolera acento, artigo, frase e erro de digitação', () => {
    const e = estruturaPorId('celula-de-purkinje')!
    const aceitos = [e.nome, ...(e.sinonimos ?? [])]
    expect(confere('celula de purkinje', aceitos)).toBe(true)
    expect(confere('é a célula de purkinje', aceitos)).toBe(true)
    expect(confere('celula de purkinge', aceitos)).toBe(true)
    expect(confere('neurônio piramidal', aceitos)).toBe(false)
  })
})
