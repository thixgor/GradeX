import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { APROFUNDAMENTOS, aprofundamentoDe } from '@/lib/histologia/aprofundamento'

const DIR = path.resolve(__dirname, '../../data/histologia/paginas')

interface PaginaMinima {
  tipo?: string
  caminho?: string[]
}

function laminas(): PaginaMinima[] {
  const saida: PaginaMinima[] = []
  for (const arquivo of readdirSync(DIR)) {
    if (arquivo.startsWith('_') || !arquivo.endsWith('.json')) continue
    const conteudo: Record<string, PaginaMinima> = JSON.parse(
      readFileSync(path.join(DIR, arquivo), 'utf8'),
    )
    for (const p of Object.values(conteudo)) {
      if (p?.tipo === 'lamina' && p.caminho) saida.push(p)
    }
  }
  return saida
}

describe('aprofundamento por setor', () => {
  it('toda lâmina do acervo resolve para um aprofundamento', () => {
    // O componente cai para a tarja de lacuna quando a busca devolve `null`.
    // Este teste é o que garante que a tarja não volte a aparecer: um setor
    // novo no currículo, sem aprofundamento escrito nem ancestral que o
    // cubra, falha aqui em vez de chegar ao aluno como campo vazio.
    const descobertas = laminas()
    expect(descobertas.length).toBeGreaterThan(1000)

    const semAprofundamento = new Set<string>()
    for (const p of descobertas) {
      if (!aprofundamentoDe(p.caminho!)) semAprofundamento.add(p.caminho!.slice(0, 2).join('/'))
    }
    expect(
      [...semAprofundamento],
      `setores sem aprofundamento: ${[...semAprofundamento].join(' | ')}`,
    ).toEqual([])
  })

  it('toda chave corresponde a um prefixo de caminho real do acervo', () => {
    // Chave escrita com typo — 'orgaos-e-sistemas/sistema-digestivo' em vez de
    // 'digestorio' — nunca casa e o setor cai silenciosamente no ancestral.
    const prefixos = new Set<string>()
    for (const p of laminas()) {
      for (let i = 1; i <= p.caminho!.length; i++) prefixos.add(p.caminho!.slice(0, i).join('/'))
    }
    const orfas = Object.keys(APROFUNDAMENTOS).filter((k) => !prefixos.has(k))
    expect(orfas, `chaves sem correspondência no acervo: ${orfas.join(' | ')}`).toEqual([])
  })

  it('nenhuma seção fica vazia', () => {
    for (const [chave, a] of Object.entries(APROFUNDAMENTOS)) {
      expect(a.histogenese.length, chave).toBeGreaterThan(200)
      expect(a.ultraestrutura.length, chave).toBeGreaterThan(200)
      expect(a.manutencao.length, chave).toBeGreaterThan(200)
      expect(a.diferenciais.length, chave).toBeGreaterThanOrEqual(2)
      expect(a.clinica.length, chave).toBeGreaterThanOrEqual(2)
      expect(a.retencao.length, chave).toBeGreaterThanOrEqual(4)
      for (const d of a.diferenciais) {
        expect(d.confundeCom.trim().length, chave).toBeGreaterThan(3)
        expect(d.comoSeparar.trim().length, chave).toBeGreaterThan(30)
      }
      for (const c of a.clinica) {
        expect(c.condicao.trim().length, chave).toBeGreaterThan(3)
        expect(c.correlacao.trim().length, chave).toBeGreaterThan(30)
      }
    }
  })

  it('o texto está em português', () => {
    // `\b` do JavaScript é ASCII: 'é' conta como fronteira e faz 'is' casar
    // dentro de 'anéis'. O lookaround Unicode evita esse falso positivo.
    const ingles = /(?<!\p{L})(the|and|of|with|that|which|are|is|from|these|this)(?!\p{L})/iu
    for (const [chave, a] of Object.entries(APROFUNDAMENTOS)) {
      const textos = [
        a.histogenese,
        a.ultraestrutura,
        a.manutencao,
        ...a.diferenciais.flatMap((d) => [d.confundeCom, d.comoSeparar]),
        ...a.clinica.flatMap((c) => [c.condicao, c.correlacao]),
        ...a.retencao,
      ]
      for (const t of textos) {
        expect(ingles.test(t), `${chave}: "${t.slice(0, 90)}"`).toBe(false)
      }
    }
  })

  it('a busca sobe a árvore do mais específico para o mais geral', () => {
    // Se o mais geral vencesse, escrever um aprofundamento fino para um
    // subsetor não teria efeito nenhum — a alavanca do módulo deixaria de
    // existir sem que nada quebrasse.
    const especifica = Object.keys(APROFUNDAMENTOS).find((k) => k.includes('/'))!
    const [raiz] = especifica.split('/')
    if (APROFUNDAMENTOS[raiz]) {
      expect(aprofundamentoDe(especifica.split('/'))).toBe(APROFUNDAMENTOS[especifica])
    }
    expect(aprofundamentoDe(['setor-inexistente', 'nada'])).toBeNull()
  })
})
