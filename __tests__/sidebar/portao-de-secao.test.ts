import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { isSidebarSectionClosedFor } from '@/lib/sidebar-sections'

/**
 * O portão das seções que o admin pode desligar mudou do servidor para o
 * cliente (components/portao-de-secao.tsx), para que o casco das páginas seja
 * estático. A regra tem que continuar a mesma de antes: admin passa sempre, os
 * demais só no que estiver ligado.
 */
describe('isSidebarSectionClosedFor', () => {
  const aluno = { role: 'user' }
  const admin = { role: 'admin' }

  it('fecha para o aluno a seção desligada', () => {
    expect(isSidebarSectionClosedFor(aluno, { aulas: false }, 'aulas')).toBe(true)
  })

  it('deixa o aluno entrar na seção ligada ou não configurada', () => {
    expect(isSidebarSectionClosedFor(aluno, { aulas: true }, 'aulas')).toBe(false)
    expect(isSidebarSectionClosedFor(aluno, { forum: false }, 'aulas')).toBe(false)
    expect(isSidebarSectionClosedFor(aluno, null, 'aulas')).toBe(false)
  })

  it('nunca fecha para o admin', () => {
    expect(isSidebarSectionClosedFor(admin, { aulas: false }, 'aulas')).toBe(false)
  })

  it('não decide sem usuário: quem barra o visitante é o middleware', () => {
    expect(isSidebarSectionClosedFor(null, { aulas: false }, 'aulas')).toBe(false)
  })
})

/**
 * Ler o cookie no layout de uma seção torna dinâmica (ƒ) cada página abaixo
 * dele: 60–80 KB de HTML saindo da função a cada visita. Quem precisar de
 * sessão numa página dessas pede à API, no cliente.
 */
describe('layouts de seção', () => {
  const secoes = ['aulas', 'banco-questoes', 'provas', 'cronogramas', 'forum', 'games']

  it.each(secoes)('app/%s/layout.tsx não lê sessão no servidor', (secao) => {
    const fonte = readFileSync(path.join(__dirname, '../../app', secao, 'layout.tsx'), 'utf8')
    expect(fonte).not.toMatch(/sidebar-section-access|getSession|cookies\(|headers\(/)
    expect(fonte).toMatch(/<PortaoDeSecao secao=/)
  })
})
