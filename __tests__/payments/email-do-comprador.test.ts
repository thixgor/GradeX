import { describe, expect, it } from 'vitest'
import { editDistance, emailDomainOf, suggestEmailFix } from '@/lib/email-check'

/**
 * O e-mail digitado na compra SEM LOGIN.
 *
 * Ali o endereço é o ÚNICO caminho até o que foi comprado: errar uma letra não
 * dá erro em lugar nenhum — o pagamento passa, a entrega sai para o vazio, e o
 * desfecho é reembolso e suporte.
 *
 * O risco desta checagem não é deixar passar um erro; é INVENTAR um. Sugerir
 * `@uol.com.br` para quem tem `@bol.com.br` (uma letra de distância, e igualmente
 * real) faria a pessoa corrigir um endereço que estava certo — o mesmo prejuízo
 * que a checagem existe para evitar, só que causado por nós. Metade dos casos
 * abaixo é sobre isso.
 */

describe('distância de edição', () => {
  it('conta troca de letras vizinhas como UM erro', () => {
    // Levenshtein comum daria 2, e `gmial.com` — o erro de digitação mais comum
    // que existe — ficaria longe demais de `gmail.com` para ser sugerido.
    expect(editDistance('gmial.com', 'gmail.com')).toBe(1)
    expect(editDistance('hotmial.com', 'hotmail.com')).toBe(1)
  })

  it('conta inserção, remoção e substituição', () => {
    expect(editDistance('gmaill.com', 'gmail.com')).toBe(1)
    expect(editDistance('gmai.com', 'gmail.com')).toBe(1)
    expect(editDistance('gnail.com', 'gmail.com')).toBe(1)
    expect(editDistance('gmail.com', 'gmail.com')).toBe(0)
  })
})

describe('sugestão de correção do e-mail', () => {
  it('pega os erros clássicos de digitação do domínio', () => {
    const casos: [string, string][] = [
      ['joao@gmial.com', 'joao@gmail.com'],
      ['joao@gnail.com', 'joao@gmail.com'],
      ['joao@gmai.com', 'joao@gmail.com'],
      ['joao@gmail.con', 'joao@gmail.com'],
      ['joao@gmail.co', 'joao@gmail.com'],
      ['joao@hotmial.com', 'joao@hotmail.com'],
      ['joao@hotmail.con', 'joao@hotmail.com'],
      ['joao@outlok.com', 'joao@outlook.com'],
      ['joao@yaho.com', 'joao@yahoo.com'],
      ['joao@icloud.co', 'joao@icloud.com'],
    ]
    for (const [digitado, esperado] of casos) {
      expect(suggestEmailFix(digitado), digitado).toBe(esperado)
    }
  })

  it('corta o sufixo sobrando que a distância de edição não pegaria', () => {
    // `@gmail.com.br` é um dos erros mais frequentes no Brasil e está a 3
    // edições de `gmail.com` — nenhum limite razoável de distância o alcança.
    expect(suggestEmailFix('joao@gmail.com.br')).toBe('joao@gmail.com')
    expect(suggestEmailFix('joao@icloud.com.br')).toBe('joao@icloud.com')
  })

  it('não mexe em quem digitou um provedor conhecido corretamente', () => {
    const corretos = [
      'joao@gmail.com',
      'joao@hotmail.com',
      'joao@hotmail.com.br',
      'joao@outlook.com.br',
      'joao@yahoo.com.br',
      'joao@icloud.com',
      'joao@proton.me',
    ]
    for (const email of corretos) {
      expect(suggestEmailFix(email), email).toBeNull()
    }
  })

  it('NÃO confunde provedores brasileiros parecidos entre si', () => {
    // bol e uol estão a uma letra um do outro e os dois são reais. Este é o
    // falso positivo mais caro possível: mandaria a pessoa trocar um endereço
    // que funciona por um que não é dela.
    expect(suggestEmailFix('joao@bol.com.br')).toBeNull()
    expect(suggestEmailFix('joao@uol.com.br')).toBeNull()
    expect(suggestEmailFix('joao@ig.com.br')).toBeNull()
    expect(suggestEmailFix('joao@oi.com.br')).toBeNull()
  })

  it('completa o .br que faltou, em vez de mandar o brasileiro para a AOL', () => {
    // `uol.com` está a UMA letra de `aol.com`. Sem uma regra própria para o .br
    // faltando, a distância de edição mandaria quem é do UOL para a AOL — o
    // palpite mais caro que esta função pode dar.
    expect(suggestEmailFix('joao@uol.com')).toBe('joao@uol.com.br')
    expect(suggestEmailFix('joao@bol.com')).toBe('joao@bol.com.br')
    expect(suggestEmailFix('joao@terra.com')).toBe('joao@terra.com.br')
    expect(suggestEmailFix('joao@ig.com')).toBe('joao@ig.com.br')
  })

  it('deixa em paz os provedores reais que ficam a uma letra do Gmail', () => {
    // mail.com e email.com existem. Fora da lista de conhecidos, os dois seriam
    // "corrigidos" para gmail.com — quebrando um endereço que funcionava.
    expect(suggestEmailFix('joao@mail.com')).toBeNull()
    expect(suggestEmailFix('joao@email.com')).toBeNull()
    expect(suggestEmailFix('joao@aol.com')).toBeNull()
  })

  it('não sugere nada para domínios próprios, que não se parecem com provedor', () => {
    const proprios = [
      'aluno@usp.br',
      'aluno@ufmg.br',
      'contato@domineaqui.com.br',
      'joao@afya.com.br',
      'maria@einstein.br',
      'jose@hospitalsiriolibanes.org.br',
    ]
    for (const email of proprios) {
      expect(suggestEmailFix(email), email).toBeNull()
    }
  })

  it('ignora entrada que ainda não é um e-mail', () => {
    expect(suggestEmailFix('')).toBeNull()
    expect(suggestEmailFix('joao')).toBeNull()
    expect(suggestEmailFix('joao@')).toBeNull()
    expect(suggestEmailFix('@gmial.com')).toBeNull()
  })

  it('normaliza maiúsculas e espaços, como o checkout faz', () => {
    expect(suggestEmailFix('  Joao@GMIAL.com ')).toBe('joao@gmail.com')
  })
})

describe('domínio do e-mail', () => {
  it('devolve o domínio em minúsculas, ou nada', () => {
    expect(emailDomainOf('Joao@Gmail.COM')).toBe('gmail.com')
    expect(emailDomainOf('joao+tag@sub.dominio.com.br')).toBe('sub.dominio.com.br')
    expect(emailDomainOf('sem-arroba')).toBeNull()
    expect(emailDomainOf('joao@')).toBeNull()
  })
})
