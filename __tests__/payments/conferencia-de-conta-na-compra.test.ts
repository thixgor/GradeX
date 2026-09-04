import { describe, expect, it } from 'vitest'
import { ObjectId } from 'mongodb'
import { normalizeBirthDate, verifyAccountIdentity } from '@/lib/serial-keys'

/**
 * "Essa conta é minha mesmo?" — a conferência opcional da compra sem login.
 *
 * O checkout diz que existe conta com o e-mail digitado, e o comprador está
 * prestes a mandar o material para lá. Saber que a conta existe não diz de QUEM
 * ela é: quem quiser certeza informa CPF e data de nascimento e recebe o nome
 * cadastrado.
 *
 * O que estes testes protegem é o outro lado disso — que a rota não vire um
 * oráculo sobre contas alheias. A recusa tem de ser a MESMA em todos os
 * caminhos: e-mail sem conta, conta sem CPF, conta sem nascimento e dados
 * errados. Qualquer diferença entre eles conta ao visitante algo sobre uma
 * conta que talvez não seja dele.
 */

const CPF_DA_CONTA = '39053344705' // válido nos dígitos verificadores
const OUTRO_CPF = '11144477735'

function fakeDb(user: any) {
  return {
    collection: () => ({
      findOne: async (filter: any) => (user && user.email === filter.email ? user : null),
    }),
  } as any
}

function contaCompleta(overrides: any = {}) {
  return {
    _id: new ObjectId(),
    email: 'aluno@exemplo.com',
    name: 'Ana Souza',
    cpf: CPF_DA_CONTA,
    dateOfBirth: new Date('1998-04-12T00:00:00.000Z'),
    ...overrides,
  }
}

const DADOS_CERTOS = {
  email: 'aluno@exemplo.com',
  cpf: CPF_DA_CONTA,
  dateOfBirth: '1998-04-12',
}

describe('data de nascimento informada', () => {
  it('aceita o formato do campo de data e o brasileiro digitado à mão', () => {
    expect(normalizeBirthDate('1998-04-12')).toBe('1998-04-12')
    expect(normalizeBirthDate('12/04/1998')).toBe('1998-04-12')
  })

  it('recusa data impossível que o construtor "consertaria" sozinho', () => {
    // new Date('2001-02-31') vira 03/03 — aceitar isso deixaria a conferência
    // passar com uma data que a pessoa nunca cadastrou.
    expect(normalizeBirthDate('2001-02-31')).toBeNull()
    expect(normalizeBirthDate('31/02/2001')).toBeNull()
  })

  it('recusa vazio, lixo e ano fora de qualquer realidade', () => {
    expect(normalizeBirthDate('')).toBeNull()
    expect(normalizeBirthDate('ontem')).toBeNull()
    expect(normalizeBirthDate(null)).toBeNull()
    expect(normalizeBirthDate('1800-01-01')).toBeNull()
    expect(normalizeBirthDate('3999-01-01')).toBeNull()
  })
})

describe('conferência de identidade da conta', () => {
  it('devolve o nome quando CPF e nascimento batem', async () => {
    const result = await verifyAccountIdentity(fakeDb(contaCompleta()), DADOS_CERTOS)
    expect(result).toEqual({ verified: true, name: 'Ana Souza' })
  })

  it('aceita o CPF com pontuação, como a pessoa digita', async () => {
    const result = await verifyAccountIdentity(fakeDb(contaCompleta()), {
      ...DADOS_CERTOS,
      cpf: '390.533.447-05',
    })
    expect(result).toEqual({ verified: true, name: 'Ana Souza' })
  })

  it('cai de volta no nome civil quando a conta não tem nome de exibição', async () => {
    const db = fakeDb(contaCompleta({ name: '', fullName: 'Ana Carolina Souza' }))
    await expect(verifyAccountIdentity(db, DADOS_CERTOS)).resolves.toEqual({
      verified: true,
      name: 'Ana Carolina Souza',
    })
  })

  it('recusa CPF certo com nascimento errado, e vice-versa', async () => {
    const db = fakeDb(contaCompleta())
    await expect(verifyAccountIdentity(db, { ...DADOS_CERTOS, dateOfBirth: '1998-04-13' }))
      .resolves.toEqual({ verified: false })
    await expect(verifyAccountIdentity(db, { ...DADOS_CERTOS, cpf: OUTRO_CPF }))
      .resolves.toEqual({ verified: false })
  })

  it('conta SEM CPF cadastrado não pode ser conferida — nem com o nascimento certo', async () => {
    // Aceitar só um dos campos transformaria a rota num oráculo de "esse CPF
    // tem conta no site?" para qualquer CPF vazado por aí.
    const db = fakeDb(contaCompleta({ cpf: undefined }))
    await expect(verifyAccountIdentity(db, DADOS_CERTOS)).resolves.toEqual({ verified: false })
  })

  it('conta SEM data de nascimento cadastrada não pode ser conferida', async () => {
    const db = fakeDb(contaCompleta({ dateOfBirth: undefined }))
    await expect(verifyAccountIdentity(db, DADOS_CERTOS)).resolves.toEqual({ verified: false })
  })

  it('a recusa é idêntica em todos os caminhos — nada distingue os motivos', async () => {
    // Este é o teste que sustenta a promessa da rota: a resposta negativa não
    // pode revelar SE a conta existe, nem o que ela tem preenchido.
    const semConta = await verifyAccountIdentity(fakeDb(null), DADOS_CERTOS)
    const semCpf = await verifyAccountIdentity(fakeDb(contaCompleta({ cpf: undefined })), DADOS_CERTOS)
    const semNascimento = await verifyAccountIdentity(fakeDb(contaCompleta({ dateOfBirth: undefined })), DADOS_CERTOS)
    const naoBate = await verifyAccountIdentity(fakeDb(contaCompleta()), { ...DADOS_CERTOS, cpf: OUTRO_CPF })
    const entradaInvalida = await verifyAccountIdentity(fakeDb(contaCompleta()), {
      ...DADOS_CERTOS, dateOfBirth: 'ontem',
    })

    for (const resposta of [semConta, semCpf, semNascimento, naoBate, entradaInvalida]) {
      expect(resposta).toEqual({ verified: false })
      expect(Object.keys(resposta)).toEqual(['verified'])
    }
  })

  it('e-mail ou CPF malformados nem chegam a consultar o banco', async () => {
    const db = {
      collection: () => ({
        findOne: async () => { throw new Error('não deveria consultar') },
      }),
    } as any
    await expect(verifyAccountIdentity(db, { ...DADOS_CERTOS, email: 'nao-e-email' }))
      .resolves.toEqual({ verified: false })
    await expect(verifyAccountIdentity(db, { ...DADOS_CERTOS, cpf: '123' }))
      .resolves.toEqual({ verified: false })
  })
})
