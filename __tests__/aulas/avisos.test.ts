import { describe, expect, it } from 'vitest'
import {
  filtroDoCurso,
  filtroGlobal,
  normalizarAviso,
  ordenarAvisos,
  TITULO_AVISO_MAX,
} from '@/lib/aulas/avisos'

describe('escopo dos filtros', () => {
  it('o filtro global exclui explicitamente os avisos de curso', () => {
    /*
     * A razão de existir deste módulo: a rota global fazia
     * `findOne({ ativo: true })` numa coleção que agora também guarda avisos de
     * curso. Sem esta exclusão, o recado da turma de Cardiologia apareceria
     * como anúncio da plataforma inteira, para todo mundo.
     */
    const filtro = filtroGlobal() as any
    expect(filtro.ativo).toBe(true)
    expect(filtro.$or).toEqual([{ setorId: { $exists: false } }, { setorId: null }])
  })

  it('o filtro de curso é preso a um setor', () => {
    expect(filtroDoCurso('s1')).toEqual({ ativo: true, setorId: 's1' })
  })

  it('os dois escopos nunca casam com o mesmo documento', () => {
    // Simulação do que o Mongo faria com cada documento.
    const global = { ativo: true }
    const doCurso = { ativo: true, setorId: 's1' }

    const casaGlobal = (d: any) => d.ativo === true && (d.setorId === undefined || d.setorId === null)
    const casaCurso = (d: any) => d.ativo === true && d.setorId === 's1'

    expect(casaGlobal(global)).toBe(true)
    expect(casaGlobal(doCurso)).toBe(false)
    expect(casaCurso(doCurso)).toBe(true)
    expect(casaCurso(global)).toBe(false)
  })
})

describe('normalizarAviso', () => {
  it('exige título e mensagem', () => {
    expect(normalizarAviso({ titulo: 'Só título' })).toBeNull()
    expect(normalizarAviso({ mensagem: 'Só mensagem' })).toBeNull()
    expect(normalizarAviso({ titulo: '  ', mensagem: '  ' })).toBeNull()
  })

  it('corta espaços e limita o tamanho', () => {
    const aviso = normalizarAviso({ titulo: '  Aula adiada  ', mensagem: '  Fica para sexta.  ' })
    expect(aviso).toEqual({
      titulo: 'Aula adiada',
      mensagem: 'Fica para sexta.',
      tipo: 'info',
      fixado: false,
    })
    expect(normalizarAviso({ titulo: 'x'.repeat(500), mensagem: 'ok' })?.titulo).toHaveLength(
      TITULO_AVISO_MAX,
    )
  })

  it('tipo inválido vira info em vez de recusar o aviso', () => {
    // Perder o recado inteiro por causa de um rótulo de cor seria
    // desproporcional — o conteúdo é o que importa.
    expect(normalizarAviso({ titulo: 't', mensagem: 'm', tipo: 'roxo' })?.tipo).toBe('info')
    expect(normalizarAviso({ titulo: 't', mensagem: 'm', tipo: 'warning' })?.tipo).toBe('warning')
  })
})

describe('ordenarAvisos', () => {
  const antigo = { titulo: 'antigo', criadoEm: '2026-01-01T00:00:00Z' }
  const novo = { titulo: 'novo', criadoEm: '2026-08-01T00:00:00Z' }
  const fixadoAntigo = { titulo: 'fixado', fixado: true, criadoEm: '2025-01-01T00:00:00Z' }

  it('fixado vem antes, mesmo sendo o mais velho', () => {
    // É exatamente para escapar da ordem cronológica que o fixado existe.
    const ordenados = ordenarAvisos([antigo, novo, fixadoAntigo])
    expect(ordenados.map((a) => a.titulo)).toEqual(['fixado', 'novo', 'antigo'])
  })

  it('sem fixado, o mais novo primeiro', () => {
    expect(ordenarAvisos([antigo, novo]).map((a) => a.titulo)).toEqual(['novo', 'antigo'])
  })

  it('não modifica o array recebido', () => {
    const original = [antigo, novo]
    ordenarAvisos(original)
    expect(original[0].titulo).toBe('antigo')
  })
})
