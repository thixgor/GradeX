import { describe, expect, it } from 'vitest'
import {
  excecoesDaProva,
  normalizarExcecoes,
  pessoaEhConvidada,
  provaApareceNoCatalogo,
  provaExisteParaPessoa,
  ramoDeConvidadoParaMongo,
  MAXIMO_DE_CONVIDADOS,
} from '@/lib/provas/visibilidade-da-prova'

const ALUNO = 'aluno-1'
const CONVIDADO = 'convidado-1'
const AUTOR = 'autor-1'

function prova(campos: Record<string, any> = {}) {
  return { createdBy: AUTOR, isHidden: false, ...campos } as any
}

const comoAluno = { userId: ALUNO, isAdmin: false, periodo: 3 }
const comoAdmin = { userId: 'admin-1', isAdmin: true, periodo: null }

describe('normalizarExcecoes', () => {
  it('ausente significa o comportamento de sempre: admins veem', () => {
    // Migração silenciosa que escondesse as provas ocultas do admin seria lida
    // como "as provas sumiram".
    expect(normalizarExcecoes(undefined)).toEqual({ admins: true, usuarios: [] })
    expect(normalizarExcecoes({})).toEqual({ admins: true, usuarios: [] })
    expect(normalizarExcecoes({ admins: false })).toEqual({ admins: false, usuarios: [] })
  })

  it('limpa a lista de convidados', () => {
    const { usuarios } = normalizarExcecoes({
      usuarios: ['a', 'a', '  ', '', 'b', null, 42],
    } as any)
    expect(usuarios).toEqual(['a', 'b', '42'])
  })

  it('tem teto: exceção com centenas de nomes é turma, e turma é `audience`', () => {
    const muitos = Array.from({ length: MAXIMO_DE_CONVIDADOS + 50 }, (_, i) => `u${i}`)
    expect(normalizarExcecoes({ usuarios: muitos }).usuarios).toHaveLength(MAXIMO_DE_CONVIDADOS)
  })
})

describe('provaExisteParaPessoa', () => {
  it('prova comum existe para o aluno', () => {
    expect(provaExisteParaPessoa(prova(), comoAluno)).toBe(true)
  })

  it('prova oculta não existe para quem não foi convidado', () => {
    expect(provaExisteParaPessoa(prova({ isHidden: true }), comoAluno)).toBe(false)
  })

  it('prova oculta existe para o convidado', () => {
    const oculta = prova({ isHidden: true, hiddenExcept: { usuarios: [CONVIDADO] } })
    expect(provaExisteParaPessoa(oculta, { ...comoAluno, userId: CONVIDADO })).toBe(true)
    expect(provaExisteParaPessoa(oculta, comoAluno)).toBe(false)
  })

  it('o convite passa por cima do público: foi chamado por nome', () => {
    // Convidar alguém de fora do período alvo não pode ser convidar ninguém.
    const oculta = prova({
      isHidden: true,
      audience: { modo: 'periodos', periodos: [8] },
      hiddenExcept: { usuarios: [CONVIDADO] },
    })
    expect(provaExisteParaPessoa(oculta, { userId: CONVIDADO, isAdmin: false, periodo: 1 })).toBe(true)
  })

  it('o autor nunca se tranca fora da própria prova', () => {
    const oculta = prova({ isHidden: true, audience: { modo: 'periodos', periodos: [8] } })
    expect(provaExisteParaPessoa(oculta, { userId: AUTOR, isAdmin: false, periodo: 1 })).toBe(true)
  })

  it('o admin alcança a prova oculta mesmo com a exceção dele desligada', () => {
    // Desligar "admins" é sobre a vitrine, não sobre o poder de administrar:
    // bloquear aqui trancaria o admin fora da tela de edição da própria prova.
    const oculta = prova({ isHidden: true, hiddenExcept: { admins: false } })
    expect(provaExisteParaPessoa(oculta, comoAdmin)).toBe(true)
  })

  it('prova pessoal é do dono, e o admin alcança para dar suporte', () => {
    const pessoal = prova({ isPersonalExam: true })
    expect(provaExisteParaPessoa(pessoal, comoAluno)).toBe(false)
    expect(provaExisteParaPessoa(pessoal, { ...comoAluno, userId: AUTOR })).toBe(true)
    expect(provaExisteParaPessoa(pessoal, comoAdmin)).toBe(true)
  })

  it('prova aplicada a outro período não existe para quem está fora', () => {
    const restrita = prova({ audience: { modo: 'periodos', periodos: [8] } })
    expect(provaExisteParaPessoa(restrita, comoAluno)).toBe(false)
    expect(provaExisteParaPessoa(restrita, { ...comoAluno, periodo: 8 })).toBe(true)
  })

  it('sem prova, não existe', () => {
    expect(provaExisteParaPessoa(null, comoAluno)).toBe(false)
  })
})

describe('provaApareceNoCatalogo', () => {
  it('difere de "existe" só no caso do admin com a exceção desligada', () => {
    const oculta = prova({ isHidden: true, hiddenExcept: { admins: false } })
    expect(provaExisteParaPessoa(oculta, comoAdmin)).toBe(true)
    expect(provaApareceNoCatalogo(oculta, comoAdmin)).toBe(false)
  })

  it('com a exceção ligada (o padrão), o admin continua vendo', () => {
    expect(provaApareceNoCatalogo(prova({ isHidden: true }), comoAdmin)).toBe(true)
  })

  it('o convidado vê a prova oculta no catálogo', () => {
    const oculta = prova({ isHidden: true, hiddenExcept: { usuarios: [CONVIDADO] } })
    expect(provaApareceNoCatalogo(oculta, { ...comoAluno, userId: CONVIDADO })).toBe(true)
  })

  it('quem não pode ver a prova também não a vê no catálogo', () => {
    expect(provaApareceNoCatalogo(prova({ isHidden: true }), comoAluno)).toBe(false)
  })
})

describe('pessoaEhConvidada', () => {
  it('só vale em prova oculta', () => {
    // Numa prova visível a lista não significa nada — e tratá-la como
    // permissão faria uma prova restrita por período abrir para os nomes que
    // sobraram de quando ela esteve oculta.
    const visivel = prova({ isHidden: false, hiddenExcept: { usuarios: [CONVIDADO] } })
    expect(pessoaEhConvidada(visivel, CONVIDADO)).toBe(false)

    const oculta = prova({ isHidden: true, hiddenExcept: { usuarios: [CONVIDADO] } })
    expect(pessoaEhConvidada(oculta, CONVIDADO)).toBe(true)
    expect(pessoaEhConvidada(oculta, null)).toBe(false)
  })
})

describe('ramoDeConvidadoParaMongo', () => {
  it('aponta para a lista de convidados do documento', () => {
    expect(ramoDeConvidadoParaMongo(CONVIDADO)).toEqual({
      'hiddenExcept.usuarios': CONVIDADO,
    })
  })
})

describe('excecoesDaProva', () => {
  it('lê o bloco do documento já normalizado', () => {
    expect(excecoesDaProva(prova({ hiddenExcept: { admins: false, usuarios: ['x'] } })))
      .toEqual({ admins: false, usuarios: ['x'] })
    expect(excecoesDaProva(prova())).toEqual({ admins: true, usuarios: [] })
  })
})
