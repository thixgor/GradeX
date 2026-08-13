import { describe, expect, it } from 'vitest'

import { CATALOGO, filtrarPorAcesso } from '@/lib/busca-plataforma/catalogo'
import { criarBuscador } from '@/lib/busca-plataforma/motor'
import { SIDEBAR_SECTION_DEFINITIONS } from '@/lib/sidebar-sections'
import { SIDEBAR_ICON_COMPONENTS } from '@/components/sidebar-icon-map'

const TODOS = filtrarPorAcesso(CATALOGO, { isAdmin: true })

describe('integridade do catálogo', () => {
  it('não tem id repetido', () => {
    const ids = CATALOGO.map(item => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('não leva duas entradas para o mesmo destino', () => {
    const destinos = CATALOGO.map(item => item.href).filter(Boolean) as string[]
    const repetidos = destinos.filter((href, i) => destinos.indexOf(href) !== i)
    expect(repetidos).toEqual([])
  })

  it('todo item navega ou executa uma ação', () => {
    const orfaos = CATALOGO.filter(item => !item.href && !item.acao)
    expect(orfaos).toEqual([])
  })

  it('todo ícone existe no mapa da sidebar', () => {
    const desconhecidos = CATALOGO.filter(item => !SIDEBAR_ICON_COMPONENTS[item.icone])
    expect(desconhecidos.map(i => `${i.id} → ${i.icone}`)).toEqual([])
  })

  it('todo destino é um caminho interno', () => {
    const externos = CATALOGO.filter(item => item.href && !item.href.startsWith('/'))
    expect(externos).toEqual([])
  })

  it('cobre todas as seções do menu — inclusive as que forem criadas depois', () => {
    for (const secao of SIDEBAR_SECTION_DEFINITIONS) {
      expect(CATALOGO.some(item => item.id === `area:${secao.key}`)).toBe(true)
    }
  })
})

describe('filtro de acesso', () => {
  it('esconde o painel do admin de quem não é admin', () => {
    const comuns = filtrarPorAcesso(CATALOGO, { isAdmin: false })
    expect(comuns.some(item => item.grupo === 'admin')).toBe(false)
    expect(TODOS.some(item => item.grupo === 'admin')).toBe(true)
  })

  it('esconde a área desligada pelo admin e as páginas dentro dela', () => {
    const semForum = filtrarPorAcesso(CATALOGO, { isAdmin: false, secoes: { forum: false } })
    expect(semForum.some(item => item.href?.startsWith('/forum'))).toBe(false)
  })

  it('desligar o Manual Clínico leva junto histologia, radiologia e as calculadoras', () => {
    const sem = filtrarPorAcesso(CATALOGO, { isAdmin: false, secoes: { manualClinico: false } })
    expect(sem.some(item => item.href?.startsWith('/manual-clinico'))).toBe(false)
  })

  it('mantém tudo para o admin, mesmo com seções desligadas', () => {
    const admin = filtrarPorAcesso(CATALOGO, { isAdmin: true, secoes: { forum: false, manualClinico: false } })
    expect(admin.length).toBe(CATALOGO.length)
  })
})

describe('buscas que um aluno faria', () => {
  const buscador = criarBuscador(TODOS)
  const primeiro = (consulta: string) => buscador.buscar(consulta, { limite: 5 })[0]?.item

  it.each([
    ['prova', '/provas'],
    ['questoes', '/banco-questoes'],
    ['flashcard', '/flashcards'],
    ['cronograma', '/cronogramas'],
    ['forum', '/forum'],
    ['ecg', '/manual-clinico/eletrocardiograma'],
    ['histologia', '/manual-clinico/histologia'],
    ['raio x', '/manual-clinico/radiologia/raio-x'],
    ['rifa', '/rifas'],
    ['perfil', '/profile'],
    ['assinar', '/buy'],
  ])('“%s” leva a %s', (consulta, destino) => {
    expect(primeiro(consulta)?.href).toBe(destino)
  })

  it('encontra o que a pessoa quer pelo problema, não pelo nome do recurso', () => {
    expect(primeiro('travando')?.acao).toBe('modo-lite')
    expect(primeiro('dark mode')?.acao).toBe('alternar-tema')
  })

  it('não devolve o catálogo inteiro por causa de uma letra solta', () => {
    const fora = buscador
      .buscar('raio x', { limite: 20 })
      .filter(r => !/radiologia|raio/i.test(`${r.item.titulo} ${r.item.trilha ?? ''}`))
    expect(fora.map(r => r.item.titulo)).toEqual([])
  })

  it('sobrevive a erro de digitação no nome da área', () => {
    expect(primeiro('flascards')?.href).toBe('/flashcards')
    expect(primeiro('cronogramass')?.href).toBe('/cronogramas')
  })
})
