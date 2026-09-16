import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * As regras de insistência do convite de avaliação de fim de estudo.
 *
 * O convite aparece por cima do que a pessoa está fazendo. Errar para o lado do
 * excesso não custa uma avaliação a menos — custa a confiança na plataforma, e
 * quem toca em "não quero avaliar" não volta. Por isso cada trava aqui é
 * testada: cota diária, teto por material, adiamento ao recusar, silêncio
 * crescente e a saída definitiva.
 *
 * `lib/reviews-prompt.ts` guarda tudo no `localStorage` e enfileira no
 * `sessionStorage`. O ambiente de teste é Node, então os dois são montados à
 * mão antes do import — o módulo os lê em tempo de chamada, nunca no topo.
 */

function armazenamentoDeMentira() {
  const mapa = new Map<string, string>()
  return {
    getItem: (chave: string) => mapa.get(chave) ?? null,
    setItem: (chave: string, valor: string) => void mapa.set(chave, valor),
    removeItem: (chave: string) => void mapa.delete(chave),
    clear: () => mapa.clear(),
  }
}

const local = armazenamentoDeMentira()
const sessao = armazenamentoDeMentira()
const eventos: any[] = []

vi.stubGlobal('window', {
  localStorage: local,
  sessionStorage: sessao,
  dispatchEvent: (evento: any) => {
    eventos.push(evento)
    return true
  },
})
vi.stubGlobal('localStorage', local)
vi.stubGlobal('sessionStorage', sessao)

const {
  chaveDoAlvo,
  enfileirarConvite,
  lerConvitePendente,
  limparConvitePendente,
  podeConvidar,
  registrarEnvio,
  registrarExibicao,
  registrarInelegivel,
  registrarRecusa,
  registrarSilencioDefinitivo,
} = await import('@/lib/reviews-prompt')

const MATERIAL = 'material' as const
const ALVO = '65a1b2c3d4e5f60718293a4b'
const OUTRO_ALVO = '65a1b2c3d4e5f60718293a4c'

function conviteDe(targetId: string) {
  return {
    targetType: MATERIAL,
    targetId,
    titulo: 'Semiologia do Aparelho Cardiovascular',
    capa: null,
    origem: 'pdf' as const,
    href: `/materiais/${targetId}`,
    segundos: 120,
    criadoEm: Date.now(),
  }
}

describe('convite de avaliação — quem pode ser convidado', () => {
  beforeEach(() => {
    local.clear()
    sessao.clear()
    eventos.length = 0
    vi.useRealTimers()
  })

  it('convida quem nunca foi convidado', () => {
    expect(podeConvidar(MATERIAL, ALVO)).toBe(true)
  })

  it('cala por um dia inteiro depois de um convite — inclusive para outro material', () => {
    registrarExibicao(MATERIAL, ALVO)
    expect(podeConvidar(MATERIAL, ALVO)).toBe(false)
    // A cota é da pessoa, não do material: estudar cinco PDFs seguidos não pode
    // render cinco folhas de avaliação na mesma tarde.
    expect(podeConvidar(MATERIAL, OUTRO_ALVO)).toBe(false)
  })

  it('nunca oferece o mesmo material mais de duas vezes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T09:00:00Z'))
    registrarExibicao(MATERIAL, ALVO)

    // Um mês depois: a cota diária e o adiamento do alvo já passaram.
    vi.setSystemTime(new Date('2026-02-01T09:00:00Z'))
    expect(podeConvidar(MATERIAL, ALVO)).toBe(true)
    registrarExibicao(MATERIAL, ALVO)

    vi.setSystemTime(new Date('2026-04-01T09:00:00Z'))
    expect(podeConvidar(MATERIAL, ALVO)).toBe(false)
    // …mas outro material continua elegível: o teto é por item.
    expect(podeConvidar(MATERIAL, OUTRO_ALVO)).toBe(true)
    vi.useRealTimers()
  })

  it('adia o material por semanas quando a pessoa diz "agora não"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T09:00:00Z'))
    registrarRecusa(MATERIAL, ALVO)

    // Passada a cota diária, outro material volta; o recusado ainda não.
    vi.setSystemTime(new Date('2026-01-06T09:00:00Z'))
    expect(podeConvidar(MATERIAL, OUTRO_ALVO)).toBe(true)
    expect(podeConvidar(MATERIAL, ALVO)).toBe(false)

    vi.setSystemTime(new Date('2026-01-20T09:00:00Z'))
    expect(podeConvidar(MATERIAL, ALVO)).toBe(true)
    vi.useRealTimers()
  })

  it('some por dois meses depois da terceira recusa seguida', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T09:00:00Z'))
    registrarRecusa(MATERIAL, ALVO)
    registrarRecusa(MATERIAL, OUTRO_ALVO)
    registrarRecusa(MATERIAL, ALVO)

    vi.setSystemTime(new Date('2026-02-10T09:00:00Z'))
    expect(podeConvidar(MATERIAL, 'outro-id-qualquer')).toBe(false)

    vi.setSystemTime(new Date('2026-04-01T09:00:00Z'))
    expect(podeConvidar(MATERIAL, 'outro-id-qualquer')).toBe(true)
    vi.useRealTimers()
  })

  it('"não quero avaliar" vale por anos', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T09:00:00Z'))
    registrarSilencioDefinitivo()

    vi.setSystemTime(new Date('2029-01-01T09:00:00Z'))
    expect(podeConvidar(MATERIAL, ALVO)).toBe(false)
    expect(podeConvidar(MATERIAL, OUTRO_ALVO)).toBe(false)
    vi.useRealTimers()
  })

  it('não volta a pedir nota de um material já avaliado', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T09:00:00Z'))
    registrarEnvio(MATERIAL, ALVO)

    vi.setSystemTime(new Date('2027-01-01T09:00:00Z'))
    expect(podeConvidar(MATERIAL, ALVO)).toBe(false)
    expect(podeConvidar(MATERIAL, OUTRO_ALVO)).toBe(true)
    vi.useRealTimers()
  })

  it('tira da fila o que o servidor recusou (sem acesso, travado, já avaliado)', () => {
    registrarInelegivel(MATERIAL, ALVO)
    expect(podeConvidar(MATERIAL, ALVO)).toBe(false)
  })

  it('o envio zera o histórico de recusas', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T09:00:00Z'))
    registrarRecusa(MATERIAL, ALVO)
    registrarRecusa(MATERIAL, OUTRO_ALVO)
    registrarEnvio(MATERIAL, ALVO)

    // Com as recusas zeradas, uma nova recusa vale o silêncio curto (3 dias),
    // não o de dois meses que a terceira seguida traria.
    vi.setSystemTime(new Date('2026-01-10T09:00:00Z'))
    registrarRecusa(MATERIAL, OUTRO_ALVO)
    vi.setSystemTime(new Date('2026-01-20T09:00:00Z'))
    expect(podeConvidar(MATERIAL, 'terceiro-id')).toBe(true)
    vi.useRealTimers()
  })

  it('guarda armazenamento indisponível sem derrubar quem chamou', () => {
    const quebrado = {
      getItem: () => {
        throw new Error('acesso negado')
      },
      setItem: () => {
        throw new Error('cota estourada')
      },
      removeItem: () => {},
    }
    vi.stubGlobal('window', { localStorage: quebrado, sessionStorage: quebrado, dispatchEvent: () => true })

    // Navegação anônima com armazenamento bloqueado: o convite não lembra de
    // nada, mas nada aqui pode lançar no meio do render de quem o usa.
    expect(() => podeConvidar(MATERIAL, ALVO)).not.toThrow()
    expect(() => registrarRecusa(MATERIAL, ALVO)).not.toThrow()
    expect(lerConvitePendente()).toBeNull()

    vi.stubGlobal('window', { localStorage: local, sessionStorage: sessao, dispatchEvent: (e: any) => eventos.push(e) })
  })
})

describe('convite de avaliação — a fila entre duas telas', () => {
  beforeEach(() => {
    local.clear()
    sessao.clear()
    eventos.length = 0
    vi.useRealTimers()
  })

  it('enfileira e entrega o convite na tela seguinte', () => {
    enfileirarConvite(conviteDe(ALVO))
    const pendente = lerConvitePendente()
    expect(pendente?.targetId).toBe(ALVO)
    expect(pendente?.origem).toBe('pdf')
    expect(eventos).toHaveLength(1)
  })

  it('não enfileira nada quando as regras locais já dizem não', () => {
    registrarSilencioDefinitivo()
    enfileirarConvite(conviteDe(ALVO))
    expect(lerConvitePendente()).toBeNull()
    expect(eventos).toHaveLength(0)
  })

  it('descarta convite velho — meia hora depois ninguém lembra do material', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T09:00:00Z'))
    enfileirarConvite(conviteDe(ALVO))

    vi.setSystemTime(new Date('2026-01-01T09:20:00Z'))
    expect(lerConvitePendente()?.targetId).toBe(ALVO)

    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'))
    expect(lerConvitePendente()).toBeNull()
    vi.useRealTimers()
  })

  it('limpar a fila não deixa resto para a próxima navegação', () => {
    enfileirarConvite(conviteDe(ALVO))
    limparConvitePendente()
    expect(lerConvitePendente()).toBeNull()
  })

  it('a chave do alvo separa material de deck com o mesmo id', () => {
    expect(chaveDoAlvo('material', ALVO)).not.toBe(chaveDoAlvo('flashcard_deck', ALVO))
  })
})
