import { describe, expect, it } from 'vitest'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { comModo, lerModo } from '@/lib/aulas/modo-visualizacao'

/**
 * "Visualizar como aluno" (§28) só vale se o privilégio cair no SERVIDOR.
 *
 * Se ele fosse apenas um filtro na tela, o admin veria um cadeado desenhado
 * enquanto a resposta continuaria trazendo o `videoEmbed` da aula paga — ou
 * seja, a conferência mentiria justamente sobre a coisa que ela existe para
 * conferir.
 */

/** Banco de mentira: devolve uma conta comum, sem compras nem turmas. */
function bancoFalso(usuario: Record<string, any> = {}) {
  return {
    collection(nome: string) {
      if (nome === 'users') {
        return { findOne: async () => ({ accountType: 'free', ...usuario }) }
      }
      return {
        find: () => ({ limit: () => ({ toArray: async () => [] }), toArray: async () => [] }),
      }
    },
  } as any
}

const sessaoDeAdmin = {
  userId: '507f1f77bcf86cd799439011',
  role: 'admin',
  secondaryRole: undefined,
}

describe('montarContextoDoUsuario com comoAluno', () => {
  it('mantém o privilégio quando o modo está desligado', async () => {
    const contexto = await montarContextoDoUsuario(bancoFalso(), sessaoDeAdmin)
    expect(contexto.isAdmin).toBe(true)
  })

  it('abandona o privilégio de admin quando comoAluno está ligado', async () => {
    const contexto = await montarContextoDoUsuario(bancoFalso(), sessaoDeAdmin, {
      comoAluno: true,
    })

    expect(contexto.isAdmin).toBe(false)
    expect(contexto.isMonitor).toBe(false)
    // E passa a valer a assinatura de verdade da conta — que aqui não existe.
    expect(contexto.ehPlus).toBe(false)
    expect(contexto.logado).toBe(true)
  })

  it('abandona também o privilégio de monitor', async () => {
    const contexto = await montarContextoDoUsuario(
      bancoFalso(),
      { userId: sessaoDeAdmin.userId, role: 'user', secondaryRole: 'monitor' },
      { comoAluno: true },
    )
    expect(contexto.isMonitor).toBe(false)
  })

  it('comoVisitante derruba até o login', async () => {
    const contexto = await montarContextoDoUsuario(bancoFalso(), sessaoDeAdmin, {
      comoVisitante: true,
    })
    expect(contexto.logado).toBe(false)
    expect(contexto.isAdmin).toBeUndefined()
  })

  it('respeita a assinatura real quando o admin de fato é Plus+', async () => {
    const contexto = await montarContextoDoUsuario(
      bancoFalso({ accountType: 'plus' }),
      sessaoDeAdmin,
      { comoAluno: true },
    )
    // Simular aluno não é fingir ser pobre: se a conta assina, ela vê o que
    // assinante vê.
    expect(contexto.ehPlus).toBe(true)
  })
})

describe('comModo', () => {
  it('preserva os parâmetros que já existiam', () => {
    // Concatenar "?comoAluno=1" na mão quebraria em /aulas?curso=abc.
    expect(comModo('/aulas?curso=abc', 'aluno')).toBe('/aulas?curso=abc&comoAluno=1')
  })

  it('remove o parâmetro ao voltar para admin', () => {
    expect(comModo('/aulas?curso=abc&comoAluno=1', 'admin')).toBe('/aulas?curso=abc')
  })

  it('não deixa um "?" solto quando não sobra nada', () => {
    expect(comModo('/aulas?comoAluno=1', 'admin')).toBe('/aulas')
  })

  it('não duplica o parâmetro ao reaplicar', () => {
    expect(comModo(comModo('/aulas/1', 'aluno'), 'visitante')).toBe('/aulas/1?comoAluno=visitante')
  })
})

describe('lerModo', () => {
  it('só reconhece os valores previstos', () => {
    expect(lerModo('1')).toBe('aluno')
    expect(lerModo('visitante')).toBe('visitante')
    expect(lerModo(null)).toBe('admin')
    // Valor inventado na URL não pode virar um modo qualquer.
    expect(lerModo('sim')).toBe('admin')
  })
})
