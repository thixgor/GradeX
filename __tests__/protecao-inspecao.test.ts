import { describe, expect, it } from 'vitest'
import {
  ESTADO_INICIAL,
  LIMIAR_ENCOLHIMENTO,
  SELETOR_MENU_LIVRE,
  atalhoDeInspecao,
  avaliarDevtools,
  deveBloquearMenu,
  folgaDenunciaPainel,
  type EstadoDaDeteccao,
  type MedidasDaJanela,
  type TeclaPressionada,
} from '@/lib/protecao-inspecao'

const tecla = (parcial: Partial<TeclaPressionada>): TeclaPressionada => ({
  key: '',
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...parcial,
})

describe('atalhoDeInspecao', () => {
  it('barra F12', () => {
    expect(atalhoDeInspecao(tecla({ key: 'F12', code: 'F12' }))).toBe('devtools')
  })

  it('barra Ctrl+Shift+I/J/C/K (Windows, Linux, console do Firefox)', () => {
    for (const letra of ['I', 'J', 'C', 'K']) {
      expect(
        atalhoDeInspecao(tecla({ key: letra, code: `Key${letra}`, ctrlKey: true, shiftKey: true })),
      ).toBe('devtools')
    }
  })

  it('barra Cmd+Option+I/J/C no Mac, mesmo com o Option trocando o caractere', () => {
    // No Mac, Option+I produz "ˆ" no `key`; só o `code` diz qual tecla foi.
    expect(atalhoDeInspecao(tecla({ key: 'ˆ', code: 'KeyI', metaKey: true, altKey: true }))).toBe('devtools')
    expect(atalhoDeInspecao(tecla({ key: '∆', code: 'KeyJ', metaKey: true, altKey: true }))).toBe('devtools')
    expect(atalhoDeInspecao(tecla({ key: 'ç', code: 'KeyC', metaKey: true, altKey: true }))).toBe('devtools')
  })

  it('barra o código-fonte: Ctrl+U e Cmd+Option+U', () => {
    expect(atalhoDeInspecao(tecla({ key: 'u', code: 'KeyU', ctrlKey: true }))).toBe('codigo-fonte')
    expect(atalhoDeInspecao(tecla({ key: '¨', code: 'KeyU', metaKey: true, altKey: true }))).toBe('codigo-fonte')
  })

  it('barra salvar a página: Ctrl+S e Cmd+S', () => {
    expect(atalhoDeInspecao(tecla({ key: 's', code: 'KeyS', ctrlKey: true }))).toBe('salvar')
    expect(atalhoDeInspecao(tecla({ key: 'S', code: 'KeyS', metaKey: true }))).toBe('salvar')
  })

  it('barra imprimir: Ctrl+P e Cmd+P (o "Salvar como PDF" levava a prova inteira)', () => {
    expect(atalhoDeInspecao(tecla({ key: 'p', code: 'KeyP', ctrlKey: true }))).toBe('imprimir')
    expect(atalhoDeInspecao(tecla({ key: 'p', code: 'KeyP', metaKey: true }))).toBe('imprimir')
  })

  it('não toca em copiar, colar, selecionar tudo — isso é decidido por prova', () => {
    for (const letra of ['c', 'v', 'a', 'x', 'z', 'f']) {
      const code = `Key${letra.toUpperCase()}`
      expect(atalhoDeInspecao(tecla({ key: letra, code, ctrlKey: true }))).toBeNull()
      expect(atalhoDeInspecao(tecla({ key: letra, code, metaKey: true }))).toBeNull()
    }
  })

  it('não confunde digitação comum com atalho', () => {
    expect(atalhoDeInspecao(tecla({ key: 'i', code: 'KeyI' }))).toBeNull()
    expect(atalhoDeInspecao(tecla({ key: 'I', code: 'KeyI', shiftKey: true }))).toBeNull()
    expect(atalhoDeInspecao(tecla({ key: 'F5', code: 'F5' }))).toBeNull()
  })
})

/** Um alvo falso: `closest` casa quando o seletor pedido contém `casa`. */
const alvo = (casa: string | null) => ({
  closest: (seletor: string) => (casa && seletor.includes(casa) ? {} : null),
})

describe('deveBloquearMenu', () => {
  it('barra o botão direito do mouse em texto e imagem', () => {
    expect(deveBloquearMenu({ alvo: alvo(null) as any, ultimoPonteiro: 'mouse', jaCancelado: false })).toBe(true)
  })

  it('barra também antes do primeiro clique (tecla de menu do teclado)', () => {
    expect(deveBloquearMenu({ alvo: alvo(null) as any, ultimoPonteiro: null, jaCancelado: false })).toBe(true)
  })

  it('não mexe no toque longo: ele é o gesto de selecionar texto no celular', () => {
    expect(deveBloquearMenu({ alvo: alvo(null) as any, ultimoPonteiro: 'touch', jaCancelado: false })).toBe(false)
    expect(deveBloquearMenu({ alvo: alvo(null) as any, ultimoPonteiro: 'pen', jaCancelado: false })).toBe(false)
  })

  it('libera links ("abrir em nova aba") e campos de escrita', () => {
    expect(SELETOR_MENU_LIVRE).toContain('a[href]')
    expect(SELETOR_MENU_LIVRE).toContain('textarea')
    expect(deveBloquearMenu({ alvo: alvo('a[href]') as any, ultimoPonteiro: 'mouse', jaCancelado: false })).toBe(false)
    expect(deveBloquearMenu({ alvo: alvo('textarea') as any, ultimoPonteiro: 'mouse', jaCancelado: false })).toBe(false)
  })

  it('não interfere quando um menu próprio do site já cuidou do evento', () => {
    expect(deveBloquearMenu({ alvo: alvo(null) as any, ultimoPonteiro: 'mouse', jaCancelado: true })).toBe(false)
  })

  it('aguenta alvo sem `closest` (o próprio document, um nó de texto)', () => {
    expect(deveBloquearMenu({ alvo: {} as any, ultimoPonteiro: 'mouse', jaCancelado: false })).toBe(true)
    expect(deveBloquearMenu({ alvo: null, ultimoPonteiro: 'mouse', jaCancelado: false })).toBe(true)
  })
})

const janela = (parcial: Partial<MedidasDaJanela>): MedidasDaJanela => ({
  outerWidth: 1920,
  outerHeight: 1040,
  innerWidth: 1920,
  innerHeight: 930,
  devicePixelRatio: 1,
  ...parcial,
})

const sequencia = (...medidas: MedidasDaJanela[]): EstadoDaDeteccao =>
  medidas.reduce(avaliarDevtools, ESTADO_INICIAL)

describe('folgaDenunciaPainel', () => {
  it('janela comum, sem painel: nada', () => {
    expect(folgaDenunciaPainel(janela({}))).toBe(false)
  })

  it('DevTools acoplado ao lado ou embaixo, em zoom 100%: acusa', () => {
    expect(folgaDenunciaPainel(janela({ innerWidth: 1300 }))).toBe(true)
    expect(folgaDenunciaPainel(janela({ innerHeight: 600 }))).toBe(true)
  })

  it('zoom de 125% sem painel não acusa — a página encolhe, mas é a letra maior', () => {
    expect(
      folgaDenunciaPainel(janela({ innerWidth: 1536, innerHeight: 744, devicePixelRatio: 1.25 })),
    ).toBe(false)
  })

  it('tela retina (DPR 2) sem painel: nada', () => {
    expect(folgaDenunciaPainel(janela({ devicePixelRatio: 2 }))).toBe(false)
  })

  it('medidas zeradas (aba em segundo plano em alguns navegadores): nada', () => {
    expect(folgaDenunciaPainel(janela({ outerWidth: 0, outerHeight: 0 }))).toBe(false)
  })
})

describe('avaliarDevtools', () => {
  it('abrir o DevTools com a janela parada acusa, mesmo com zoom de 125%', () => {
    const zoom = { devicePixelRatio: 1.25 }
    const antes = janela({ ...zoom, innerWidth: 1536, innerHeight: 744 })
    const depois = janela({ ...zoom, innerWidth: 1536 - LIMIAR_ENCOLHIMENTO - 40, innerHeight: 744 })
    expect(sequencia(antes).aberto).toBe(false)
    expect(sequencia(antes, depois).aberto).toBe(true)
  })

  it('fechar o DevTools volta ao normal', () => {
    const fechado = janela({})
    const aberto = janela({ innerWidth: 1300 })
    expect(sequencia(fechado, aberto, fechado).aberto).toBe(false)
  })

  it('mudar o zoom não acusa (o DPR muda junto com a página)', () => {
    const cem = janela({})
    const cento25 = janela({ innerWidth: 1536, innerHeight: 744, devicePixelRatio: 1.25 })
    expect(sequencia(cem, cento25).aberto).toBe(false)
  })

  it('redimensionar a janela não acusa (o outer muda junto)', () => {
    const grande = janela({})
    const pequena = janela({ outerWidth: 1000, innerWidth: 1000, outerHeight: 700, innerHeight: 590 })
    expect(sequencia(grande, pequena).aberto).toBe(false)
  })

  it('carregar a página com o DevTools já aberto acusa pela folga', () => {
    expect(sequencia(janela({ innerWidth: 1200 })).aberto).toBe(true)
  })

  it('barra pequena do navegador (downloads, aviso) não acusa', () => {
    expect(sequencia(janela({}), janela({ innerHeight: 880 })).aberto).toBe(false)
  })

  it('a página encolhida não vira o novo normal enquanto o painel está aberto', () => {
    const fechado = janela({})
    const aberto = janela({ innerWidth: 1300 })
    const estado = sequencia(fechado, aberto, aberto, aberto)
    expect(estado.aberto).toBe(true)
    expect(estado.referencia?.innerWidth).toBe(1920)
  })
})
