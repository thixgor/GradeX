import { beforeAll, describe, expect, it } from 'vitest'
import {
  VISITANTE_LINKS_MAX,
  contarLinks,
  ehEmailValido,
  ehIdDeTicket,
  ehTicketDeVisitante,
  limparInvisiveis,
  normalizarContexto,
  temRepeticaoAbsurda,
  validarChamadoDeVisitante,
  validarRespostaDeVisitante,
} from '@/lib/tickets-visitante-regras'
import {
  DESAFIO_IDADE_MAX_MS,
  DESAFIO_IDADE_MIN_MS,
  chaveConfere,
  chaveDoTicketDeVisitante,
  emitirDesafio,
  lerDesafio,
} from '@/lib/tickets-visitante'

/**
 * O chamado de suporte sem conta é a parte mais exposta do suporte: qualquer
 * um, sem login. Estes testes seguram as cercas que não dependem de banco —
 * o que é aceito como conteúdo, e o desafio e a chave que só o servidor sabe
 * assinar.
 */

const valido = {
  nome: 'Maria Souza',
  email: 'Maria@Exemplo.com.br',
  titulo: 'Pix não liberou o acesso',
  mensagem: 'Paguei o Pix há uma hora e o material ainda não apareceu.',
  categoria: 'financeiro',
  contexto: '/comprar?productType=material&productId=abc',
}

describe('validação do chamado de visitante', () => {
  it('aceita um chamado normal e normaliza o e-mail', () => {
    const r = validarChamadoDeVisitante(valido)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.chamado.email).toBe('maria@exemplo.com.br')
      expect(r.chamado.categoria).toBe('financeiro')
      expect(r.chamado.contexto).toBe('/comprar?productType=material&productId=abc')
    }
  })

  it('categoria desconhecida vira "outro", não erro', () => {
    const r = validarChamadoDeVisitante({ ...valido, categoria: '$where' })
    expect(r.ok && r.chamado.categoria).toBe('outro')
  })

  it('recusa e-mail inválido apontando o campo', () => {
    for (const email of ['', 'maria', 'maria@', 'a@b', 'a b@c.com', 'x@y.c', '<a@b.com>']) {
      const r = validarChamadoDeVisitante({ ...valido, email })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.campo).toBe('email')
    }
  })

  it('recusa link no campo de nome', () => {
    const r = validarChamadoDeVisitante({ ...valido, nome: 'Ganhe já https://spam.example' })
    expect(r.ok).toBe(false)
  })

  it(`recusa mais de ${VISITANTE_LINKS_MAX} links`, () => {
    const links = Array.from({ length: VISITANTE_LINKS_MAX + 1 }, (_, i) => `https://x${i}.com`).join(' ')
    const r = validarChamadoDeVisitante({ ...valido, mensagem: `Olha isso ${links}` })
    expect(r.ok).toBe(false)
  })

  it('recusa caracteres repetidos em massa', () => {
    expect(temRepeticaoAbsurda('a'.repeat(25))).toBe(true)
    expect(temRepeticaoAbsurda('kkkkkkkk socorro')).toBe(false)
    expect(validarChamadoDeVisitante({ ...valido, mensagem: `Ajuda ${'!'.repeat(40)}` }).ok).toBe(false)
  })

  it('tira caracteres invisíveis e de controle', () => {
    expect(limparInvisiveis('a​b‮c\u0007d\n')).toBe('abcd\n')
  })

  it('corta mensagem e título nos limites em vez de estourar', () => {
    const r = validarChamadoDeVisitante({ ...valido, titulo: 'T'.repeat(5000).replace(/T/g, 'Ta'), mensagem: 'ab '.repeat(5000) })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.chamado.titulo.length).toBeLessThanOrEqual(120)
      expect(r.chamado.mensagem.length).toBeLessThanOrEqual(2000)
    }
  })

  it('ignora tipos que não são texto (objeto no lugar de string)', () => {
    const r = validarChamadoDeVisitante({ ...valido, mensagem: { $ne: null } as unknown as string })
    expect(r.ok).toBe(false)
  })

  it('resposta curta passa; vazia e com spam de link não', () => {
    expect(validarRespostaDeVisitante('Obrigada!').ok).toBe(true)
    expect(validarRespostaDeVisitante('   ').ok).toBe(false)
    expect(validarRespostaDeVisitante('a https://1.co b https://2.co c https://3.co d https://4.co').ok).toBe(false)
  })
})

describe('contexto da página de origem', () => {
  it('aceita caminho interno', () => {
    expect(normalizarContexto('/buy/checkout?plan=plus_anual')).toBe('/buy/checkout?plan=plus_anual')
  })
  it('recusa URL externa, protocolo e caminho que vira outro domínio', () => {
    expect(normalizarContexto('https://evil.com')).toBeUndefined()
    expect(normalizarContexto('//evil.com/x')).toBeUndefined()
    expect(normalizarContexto('javascript:alert(1)')).toBeUndefined()
    expect(normalizarContexto('/x"><script>')).toBeUndefined()
  })
})

describe('utilidades', () => {
  it('reconhece ids e tickets de visitante', () => {
    expect(ehIdDeTicket('0123456789abcdef01234567')).toBe(true)
    expect(ehIdDeTicket('0123456789abcdef0123456')).toBe(false)
    expect(ehIdDeTicket({ $gt: '' })).toBe(false)
    expect(ehTicketDeVisitante({ userId: 'visitante:abc' })).toBe(true)
    expect(ehTicketDeVisitante({ userId: '0123456789abcdef01234567' })).toBe(false)
    expect(ehEmailValido('a@b.co')).toBe(true)
    expect(contarLinks('veja www.site.com e https://x.com')).toBe(2)
  })
})

describe('desafio e chave', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'segredo-de-teste-com-tamanho-suficiente'
  })

  it('o desafio só vale depois do tempo mínimo e antes de vencer', () => {
    const agora = Date.now()
    const token = emitirDesafio(agora)
    expect(lerDesafio(token, agora + 500)).toEqual({ ok: false, motivo: 'cedo' })
    const lido = lerDesafio(token, agora + DESAFIO_IDADE_MIN_MS + 1)
    expect(lido.ok).toBe(true)
    expect(lerDesafio(token, agora + DESAFIO_IDADE_MAX_MS + 1)).toEqual({ ok: false, motivo: 'vencido' })
  })

  it('desafio adulterado é recusado', () => {
    const agora = Date.now()
    const token = emitirDesafio(agora - 10_000)
    const [tempo, nonce, assinatura] = token.split('.')
    // Recuar o relógio para "envelhecer" um desafio fresco quebra a assinatura.
    const forjado = `${(agora - 3_600_000).toString(36)}.${nonce}.${assinatura}`
    expect(lerDesafio(forjado, agora)).toEqual({ ok: false, motivo: 'assinatura' })
    expect(lerDesafio(`${tempo}.${nonce}.${'A'.repeat(27)}`, agora).ok).toBe(false)
    expect(lerDesafio('lixo', agora).ok).toBe(false)
    expect(lerDesafio({ token } as unknown, agora).ok).toBe(false)
  })

  it('a chave confere só para o próprio ticket', () => {
    const id = '0123456789abcdef01234567'
    const chave = chaveDoTicketDeVisitante(id)
    expect(chave).toHaveLength(32)
    expect(chaveConfere(id, chave)).toBe(true)
    expect(chaveConfere('0123456789abcdef01234568', chave)).toBe(false)
    expect(chaveConfere(id, chave.slice(0, 31) + (chave.endsWith('A') ? 'B' : 'A'))).toBe(false)
    expect(chaveConfere(id, null)).toBe(false)
  })
})
