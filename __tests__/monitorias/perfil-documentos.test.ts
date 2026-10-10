import { describe, expect, it } from 'vitest'
import { mesmoNomeCivil, normalizarNomeCivil, validarNomeCivil } from '@/lib/nome-civil'
import { comVolta, linkDoPerfil, requisitosDoMonitor, voltarValido } from '@/lib/monitorias/requisitos'

describe('nome civil (uma regra para perfil, CPF e monitorias)', () => {
  it('aceita nome e sobrenome com acento, hífen, apóstrofo e abreviação', () => {
    for (const nome of ['Ana Paula Souza', 'João D\'Ávila', 'Maria-Clara Lima', 'José R. Silva', '  Ana   Souza  ']) {
      expect(validarNomeCivil(nome), nome).toBeNull()
    }
  })
  it('recusa vazio, uma palavra só, números, símbolos e nome gigante', () => {
    expect(validarNomeCivil('')).toMatch(/Informe/)
    expect(validarNomeCivil('Ana')).toMatch(/sobrenome/)
    expect(validarNomeCivil('Ana P')).toMatch(/sobrenome/)
    expect(validarNomeCivil('Ana Souza 2')).toMatch(/letras/)
    expect(validarNomeCivil('Ana <script>')).toMatch(/letras/)
    expect(validarNomeCivil('Ana ' + 'a'.repeat(130))).toMatch(/longo/)
  })
  it('compara sem caixa, acento e espaços extras', () => {
    expect(normalizarNomeCivil('  Ana   Souza ')).toBe('Ana Souza')
    expect(mesmoNomeCivil('JOÃO DA SILVA', 'joao  da silva')).toBe(true)
    expect(mesmoNomeCivil('João da Silva', 'João Silva')).toBe(false)
  })
})

describe('pendências levam ao campo certo do /profile', () => {
  const base = { termosAceitos: true, exigirCpfReceita: false, agora: new Date('2026-10-10'), tutor: { avatar: 'osler', pix: {} as any, status: 'ativo' as const } }
  const item = (user: any, chave: string) => requisitosDoMonitor({ ...base, user }).find((i) => i.chave === chave)!

  it('nome completo: só o nome da conta (sem nome civil) continua pendente, com link direto ao campo', () => {
    const nome = item({ name: 'Ana Paula' }, 'nome')
    expect(nome.ok).toBe(false)
    expect(nome.acao!.href).toBe('/profile?tab=config&campo=fullName')
    expect(item({ fullName: 'Ana Paula Souza' }, 'nome').ok).toBe(true)
    expect(item({ fullName: 'Ana 123' }, 'nome').ok).toBe(false)
  })

  it('CPF e nascimento apontam para os campos deles; foto fala em retrato da galeria', () => {
    expect(item({}, 'cpf').acao!.href).toBe(linkDoPerfil('cpf'))
    expect(item({}, 'idade').acao!.href).toBe(linkDoPerfil('dateOfBirth'))
    const foto = item({}, 'foto')
    expect(foto.rotulo).toMatch(/galeria/i)
    expect(foto.rotulo).not.toMatch(/enviar|upload/i)
  })

  it('caminho de volta só para as Monitorias (sem redirecionamento aberto)', () => {
    expect(comVolta('/profile?tab=config&campo=cpf', '/monitorias/painel')).toBe('/profile?tab=config&campo=cpf&voltar=%2Fmonitorias%2Fpainel')
    expect(comVolta('/monitorias/painel/perfil', '/monitorias/painel')).toBe('/monitorias/painel/perfil')
    expect(voltarValido('/monitorias/anuncio/cardio-123')).toBe(true)
    for (const ruim of ['https://evil.com', '//evil.com', '/monitorias//evil.com', '/admin', 'javascript:alert(1)', '/monitorias/../admin', '', null]) {
      expect(voltarValido(ruim as any), String(ruim)).toBe(false)
    }
    expect(comVolta('/profile?tab=config', 'https://evil.com')).toBe('/profile?tab=config')
  })
})
