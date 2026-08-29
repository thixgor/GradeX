import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * `reconciliarPagamentosPendentes` é a rede de segurança para pedidos presos
 * em pending/in_process quando o webhook do MP se perde. Ela precisa rodar
 * de DOIS lugares sem duplicar comportamento: a rota própria
 * (`/api/cron/payments-sweeper`) e "de carona" dentro do cron de assinaturas,
 * que é o único agendador que já roda sozinho sem depender de conta nova ou
 * serviço externo — ver o comentário em `lib/payments/sweep.ts`.
 *
 * Aqui testamos só a função extraída, com Mongo e Mercado Pago dublês: o que
 * importa é o CONTRATO (o que ela varre, quando para, o que conta como
 * reconciliado) — a chamada HTTP de verdade ao MP já é coberta noutro lugar.
 */

const getPaymentMock = vi.fn()
const applyPaymentResultMock = vi.fn()

vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ getPayment: getPaymentMock }),
}))

vi.mock('@/lib/payments/effects', () => ({
  applyPaymentResult: (...args: any[]) => applyPaymentResultMock(...args),
}))

function pedido(id: string, overrides: Partial<any> = {}) {
  return {
    _id: id,
    status: 'pending',
    providerPaymentId: `mp-${id}`,
    createdAt: new Date(),
    ...overrides,
  }
}

function dbCom(pedidos: any[]) {
  const find = vi.fn(() => ({
    sort: () => ({
      limit: (n: number) => ({
        toArray: async () => pedidos.slice(0, n),
      }),
    }),
  }))
  return { collection: () => ({ find }), _find: find } as any
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('reconciliarPagamentosPendentes', () => {
  it('reconsulta cada pedido no MP e conta quem virou approved', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')

    const db = dbCom([pedido('a'), pedido('b')])
    getPaymentMock.mockResolvedValue({ status: 'approved' })
    applyPaymentResultMock
      .mockResolvedValueOnce({ applied: true, order: { status: 'approved' } })
      .mockResolvedValueOnce({ applied: true, order: { status: 'approved' } })

    const stats = await reconciliarPagamentosPendentes(db)

    expect(stats).toEqual({ checked: 2, reconciled: 2, approved: 2, errors: 0 })
    expect(getPaymentMock).toHaveBeenCalledTimes(2)
  })

  it('status inalterado não conta como reconciliado', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')

    const db = dbCom([pedido('a')])
    getPaymentMock.mockResolvedValue({ status: 'pending' })
    applyPaymentResultMock.mockResolvedValue({ applied: false, order: { status: 'pending' } })

    const stats = await reconciliarPagamentosPendentes(db)

    expect(stats).toEqual({ checked: 1, reconciled: 0, approved: 0, errors: 0 })
  })

  it('um pedido que falha não derruba a varredura dos outros', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const db = dbCom([pedido('a'), pedido('b')])
    getPaymentMock.mockRejectedValueOnce(new Error('MP fora do ar')).mockResolvedValueOnce({ status: 'approved' })
    applyPaymentResultMock.mockResolvedValue({ applied: true, order: { status: 'approved' } })

    const stats = await reconciliarPagamentosPendentes(db)

    expect(stats).toEqual({ checked: 2, reconciled: 1, approved: 1, errors: 1 })
  })

  it('para de reconsultar quando o prazo estoura — não perde o pedido, adia', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')

    const db = dbCom([pedido('a'), pedido('b'), pedido('c')])
    getPaymentMock.mockResolvedValue({ status: 'approved' })
    applyPaymentResultMock.mockResolvedValue({ applied: true, order: { status: 'approved' } })

    // Prazo já vencido: nem o primeiro deveria ser tentado.
    const stats = await reconciliarPagamentosPendentes(db, { prazo: Date.now() - 1 })

    expect(stats).toEqual({ checked: 0, reconciled: 0, approved: 0, errors: 0 })
    expect(getPaymentMock).not.toHaveBeenCalled()
  })

  it('respeita o limite passado por quem chama "de carona"', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')

    const pedidos = Array.from({ length: 5 }, (_, i) => pedido(`p${i}`))
    const db = dbCom(pedidos)
    getPaymentMock.mockResolvedValue({ status: 'pending' })
    applyPaymentResultMock.mockResolvedValue({ applied: false, order: { status: 'pending' } })

    await reconciliarPagamentosPendentes(db, { limite: 2 })

    // A trava chega direto no `.limit()` da query — é o Mongo que já devolve
    // só os 2, não um corte depois de buscar tudo.
    expect(getPaymentMock).toHaveBeenCalledTimes(2)
  })
})
