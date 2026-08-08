import { describe, expect, it } from 'vitest'

import { DOSSIES, dossieDaEstrutura } from '@/lib/histologia/dossies'
import { GLOSSARIO } from '@/lib/histologia/glossario'

describe('dossiês de estrutura', () => {
  it('a chave é sempre minúscula e sem espaços nas pontas', () => {
    for (const chave of Object.keys(DOSSIES)) {
      expect(chave).toBe(chave.trim().toLowerCase())
    }
  })

  /**
   * Dossiê e glossário são endereçados pela mesma chave. Uma entrada de dossiê
   * sem tradução correspondente apareceria com o rótulo em inglês e o
   * aprofundamento em português — incoerência que o aluno vê na hora.
   */
  it('toda estrutura com dossiê também está traduzida no glossário', () => {
    for (const chave of Object.keys(DOSSIES)) {
      expect(GLOSSARIO[chave], `sem tradução para "${chave}"`).toBeTruthy()
    }
  })

  it('nenhum dossiê é uma casca vazia', () => {
    for (const [chave, dossie] of Object.entries(DOSSIES)) {
      const campos = [
        dossie.funcao,
        dossie.origemEmbrionaria,
        dossie.comoReconhecer,
        dossie.armadilha,
        dossie.relacoesClinicas?.length ? 'x' : undefined,
      ].filter(Boolean)
      expect(campos.length, `dossiê vazio: ${chave}`).toBeGreaterThanOrEqual(2)
    }
  })

  it('correlação clínica sempre diz a situação e a consequência', () => {
    for (const [chave, dossie] of Object.entries(DOSSIES)) {
      for (const relacao of dossie.relacoesClinicas ?? []) {
        expect(relacao.situacao.length, chave).toBeGreaterThan(3)
        // Consequência curta vira rótulo, não explicação — e o pedido era
        // "o que acontece se X", que exige desenvolver o mecanismo.
        expect(relacao.consequencia.length, `${chave} / ${relacao.situacao}`).toBeGreaterThan(60)
      }
    }
  })

  /**
   * O módulo é educacional e não substitui avaliação clínica. As correlações
   * descrevem morfologia e mecanismo; prescrever conduta ou dose passaria de
   * ensinar histologia para aconselhar tratamento.
   */
  it('nenhuma correlação prescreve conduta', () => {
    const PROIBIDO = /\b(prescrev|administr|posologia|\d+\s?mg\b|dose de|tratar com|iniciar (com )?\w+ ?\d)/i
    for (const [chave, dossie] of Object.entries(DOSSIES)) {
      for (const relacao of dossie.relacoesClinicas ?? []) {
        expect(PROIBIDO.test(relacao.consequencia), `${chave} / ${relacao.situacao}`).toBe(false)
      }
    }
  })

  it('busca por rótulo é tolerante a caixa e espaços', () => {
    expect(dossieDaEstrutura('  Lamina Propria  ')).toBe(DOSSIES['lamina propria'])
    expect(dossieDaEstrutura('inexistente')).toBeNull()
  })
})

describe('panoramas de setor', () => {
  it('toda chave aponta para um setor real do currículo', async () => {
    const { RESUMOS } = await import('@/lib/histologia/resumos')
    const { readFileSync, readdirSync } = await import('node:fs')
    const pathMod = await import('node:path')
    const DIR = pathMod.resolve(__dirname, '../../data/histologia/paginas')

    const rotas = new Set<string>()
    for (const arquivo of readdirSync(DIR)) {
      const conteudo = JSON.parse(readFileSync(pathMod.join(DIR, arquivo), 'utf8'))
      Object.keys(conteudo).forEach((r) => rotas.add(r))
    }
    for (const chave of Object.keys(RESUMOS)) {
      expect(rotas.has(chave), `setor inexistente: ${chave}`).toBe(true)
    }
  })

  it('o panorama é denso o bastante para valer a leitura', async () => {
    const { RESUMOS } = await import('@/lib/histologia/resumos')
    for (const [chave, resumo] of Object.entries(RESUMOS)) {
      // Um "panorama" de duas frases não prepara ninguém para dezenas de
      // lâminas; o pedido era resumo detalhado, não legenda.
      expect(resumo.panorama.split(/\s+/).length, chave).toBeGreaterThan(80)
      expect(resumo.objetivos.length, chave).toBeGreaterThanOrEqual(2)
      expect(resumo.chamada.length, chave).toBeGreaterThan(15)
    }
  })

  it('a marcação de destaque está balanceada', async () => {
    const { RESUMOS } = await import('@/lib/histologia/resumos')
    for (const [chave, resumo] of Object.entries(RESUMOS)) {
      const marcas = (resumo.panorama.match(/\*\*/g) ?? []).length
      expect(marcas % 2, `destaque sem fechamento em ${chave}`).toBe(0)
    }
  })
})

describe('descrições aprofundadas de lâmina', () => {
  it('toda chave corresponde a um título real do acervo', async () => {
    const { DESCRICOES } = await import('@/lib/histologia/laminas')
    const { readFileSync, readdirSync } = await import('node:fs')
    const pathMod = await import('node:path')
    const DIR = pathMod.resolve(__dirname, '../../data/histologia/paginas')

    const titulos = new Set<string>()
    for (const arquivo of readdirSync(DIR)) {
      const conteudo: Record<string, { tituloOriginal: string }> = JSON.parse(
        readFileSync(pathMod.join(DIR, arquivo), 'utf8'),
      )
      for (const p of Object.values(conteudo)) titulos.add(p.tituloOriginal.toLowerCase())
    }
    for (const chave of Object.keys(DESCRICOES)) {
      expect(titulos.has(chave), `título inexistente: "${chave}"`).toBe(true)
    }
  })

  it('o panorama tem densidade suficiente para substituir o original', async () => {
    const { DESCRICOES } = await import('@/lib/histologia/laminas')
    for (const [chave, d] of Object.entries(DESCRICOES)) {
      // Uma descrição mais curta que a do acervo seria regressão, não melhoria.
      expect(d.panorama.split(/\s+/).length, chave).toBeGreaterThan(60)
      expect((d.panorama.match(/\*\*/g) ?? []).length % 2, `destaque aberto em ${chave}`).toBe(0)
      for (const passo of d.roteiro ?? []) expect(passo.length, chave).toBeGreaterThan(20)
    }
  })

  it('toda lâmina com descrição própria também tem o título traduzido', async () => {
    const { DESCRICOES } = await import('@/lib/histologia/laminas')
    const { traduzirTitulo } = await import('@/lib/histologia/titulos')
    for (const chave of Object.keys(DESCRICOES)) {
      expect(traduzirTitulo(chave), `sem título traduzido: "${chave}"`).toBeTruthy()
    }
  })
})
