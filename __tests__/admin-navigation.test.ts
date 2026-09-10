import { describe, expect, it } from 'vitest'
import {
  ADMIN_GROUPS,
  ADMIN_SECTIONS,
  buscarAtalhosAdmin,
  buscarSecoesAdmin,
  normalizarTermo,
  secaoPorRota,
  secoesPorHrefs,
} from '@/lib/admin-navigation'

describe('mapa do painel administrativo', () => {
  it('não repete destino nem aponta para grupo inexistente', () => {
    const hrefs = ADMIN_SECTIONS.map((secao) => secao.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)

    const grupos = new Set(ADMIN_GROUPS.map((grupo) => grupo.key))
    for (const secao of ADMIN_SECTIONS) {
      expect(grupos.has(secao.group)).toBe(true)
    }
  })

  it('cobre as seções que ficavam de fora da home antiga', () => {
    const hrefs = new Set(ADMIN_SECTIONS.map((secao) => secao.href))
    for (const href of [
      '/admin/tickets',
      '/admin/farmacologia',
      '/admin/forum-topics',
      '/admin/proctoring',
      '/admin/equipe',
      '/admin/flashcards/themes',
      '/admin/study-playlists',
    ]) {
      expect(hrefs.has(href)).toBe(true)
    }
  })
})

describe('busca do painel', () => {
  it('ignora acento e caixa', () => {
    expect(normalizarTermo('Música')).toBe('musica')
    const achadas = buscarSecoesAdmin('musica')
    expect(achadas[0]?.href).toBe('/admin/study-playlists')
  })

  it('acha por sinônimo que a pessoa realmente digita', () => {
    expect(buscarSecoesAdmin('suporte')[0]?.href).toBe('/admin/tickets')
    expect(buscarSecoesAdmin('remedio')[0]?.href).toBe('/admin/farmacologia')
  })

  it('prioriza casamento no título sobre casamento na descrição', () => {
    expect(buscarSecoesAdmin('provas')[0]?.href).toBe('/admin/exams')
  })

  it('exige todos os termos, em qualquer ordem', () => {
    const achadas = buscarSecoesAdmin('questoes banco')
    expect(achadas.map((secao) => secao.href)).toContain('/admin/banco-questoes')
    expect(buscarSecoesAdmin('xyz inexistente')).toHaveLength(0)
  })

  it('devolve tudo quando o termo está vazio', () => {
    expect(buscarSecoesAdmin('   ')).toHaveLength(ADMIN_SECTIONS.length)
  })

  it('encontra atalhos internos das seções', () => {
    const achados = buscarAtalhosAdmin('nova prova')
    expect(achados[0]?.atalho.href).toBe('/admin/exams/create')
  })
})

describe('rota → seção', () => {
  it('credita a sub-rota à seção dona dela', () => {
    expect(secaoPorRota('/admin/banco-questoes/questoes')?.href).toBe('/admin/banco-questoes')
    expect(secaoPorRota('/admin/exams/123/edit')?.href).toBe('/admin/exams')
  })

  it('prefere o prefixo mais longo', () => {
    expect(secaoPorRota('/admin/flashcards/manual/pastas')?.href).toBe('/admin/flashcards/manual')
  })

  it('devolve indefinido em rota sem seção (ex.: a trava de acesso)', () => {
    expect(secaoPorRota('/admin/verificacao')).toBeUndefined()
    expect(secaoPorRota('/admin')).toBeUndefined()
  })
})

describe('listas guardadas', () => {
  it('ignora href que não existe mais', () => {
    const secoes = secoesPorHrefs(['/admin/tickets', '/admin/rota-que-sumiu'])
    expect(secoes).toHaveLength(1)
    expect(secoes[0].href).toBe('/admin/tickets')
  })
})
