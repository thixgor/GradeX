import { describe, expect, it } from 'vitest'
import {
  algumaTravaLigada,
  ehCampoDeEscrita,
  SELETOR_DE_ESCRITA,
  motivoDaTrava,
  normalizarTravas,
  rotuloDasTravas,
  travasDaProva,
  TRAVAS_PADRAO,
} from '@/lib/provas/anti-cola'

describe('normalizarTravas', () => {
  it('nasce tudo desligado: quem não pediu nada fica com a tela livre', () => {
    expect(normalizarTravas(undefined)).toEqual(TRAVAS_PADRAO)
    expect(normalizarTravas({})).toEqual({ copia: false, impressao: false, menu: false })
  })

  it('só o booleano true liga', () => {
    // "true" em texto vindo de um formulário mal serializado não pode virar
    // uma trava que ninguém marcou.
    expect(normalizarTravas({ copia: 'true', impressao: 1, menu: true })).toEqual({
      copia: false,
      impressao: false,
      menu: true,
    })
  })

  it('lê o bloco do documento da prova', () => {
    expect(travasDaProva({ antiCola: { copia: true } } as any)).toEqual({
      copia: true,
      impressao: false,
      menu: false,
    })
    expect(travasDaProva(null)).toEqual(TRAVAS_PADRAO)
  })
})

describe('algumaTravaLigada', () => {
  it('diz se há o que aplicar', () => {
    expect(algumaTravaLigada(TRAVAS_PADRAO)).toBe(false)
    expect(algumaTravaLigada({ copia: false, impressao: true, menu: false })).toBe(true)
  })
})

describe('ehCampoDeEscrita', () => {
  /*
   * O detalhe que separa uma trava de um defeito: o aluno precisa selecionar e
   * corrigir o PRÓPRIO texto na discursiva. Bloquear ali não protege prova
   * nenhuma e transforma a questão aberta num castigo.
   *
   * O que se testa aqui é a DECISÃO (quais elementos são lugar de escrever); o
   * casamento em si é do `closest` do navegador.
   */
  it('cobre os quatro lugares onde se escreve', () => {
    expect(SELETOR_DE_ESCRITA).toContain('input')
    expect(SELETOR_DE_ESCRITA).toContain('textarea')
    expect(SELETOR_DE_ESCRITA).toContain('[contenteditable="true"]')
    // A saída de emergência, para um trecho que precise ser copiável dentro
    // de uma prova travada.
    expect(SELETOR_DE_ESCRITA).toContain('[data-permite-copia]')
  })

  it('usa closest, para alcançar o que está dentro do campo', () => {
    // O clique costuma cair num `<span>` dentro do campo; comparar só o alvo
    // deixaria a trava valendo lá dentro.
    const dentroDeUmCampo = { closest: (sel: string) => (sel === SELETOR_DE_ESCRITA ? {} : null) }
    expect(ehCampoDeEscrita(dentroDeUmCampo as any)).toBe(true)
  })

  it('o enunciado não é campo de escrita', () => {
    const fora = { closest: () => null }
    expect(ehCampoDeEscrita(fora as any)).toBe(false)
  })

  it('não quebra com alvo ausente ou sem closest', () => {
    expect(ehCampoDeEscrita(null)).toBe(false)
    expect(ehCampoDeEscrita({} as any)).toBe(false)
  })
})

describe('mensagens', () => {
  it('explica a trava em vez de deixar a tecla morta', () => {
    // Tecla que não faz nada parece defeito, e defeito no meio da prova vira
    // "o site travou" — dito ao professor depois, sem como conferir.
    expect(motivoDaTrava('copia')).toContain('copiar')
    expect(motivoDaTrava('impressao')).toContain('impressão')
    expect(motivoDaTrava('menu')).toContain('botão direito')
  })

  it('resume para a tela do admin', () => {
    expect(rotuloDasTravas(TRAVAS_PADRAO)).toContain('Nenhuma trava')
    expect(rotuloDasTravas({ copia: true, impressao: false, menu: false })).toBe('Bloqueia cópia.')
    expect(rotuloDasTravas({ copia: true, impressao: true, menu: false })).toBe(
      'Bloqueia cópia e impressão.',
    )
    expect(rotuloDasTravas({ copia: true, impressao: true, menu: true })).toBe(
      'Bloqueia cópia, impressão e menu do botão direito.',
    )
  })
})
