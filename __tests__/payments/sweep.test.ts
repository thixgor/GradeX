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

const findByRefMock = vi.fn()

vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ getPayment: getPaymentMock, findPaymentByExternalReference: findByRefMock }),
}))

const concluirEfeitosMock = vi.fn()

vi.mock('@/lib/payments/effects', () => ({
  applyPaymentResult: (...args: any[]) => applyPaymentResultMock(...args),
  concluirEfeitosInterrompidos: (...args: any[]) => concluirEfeitosMock(...args),
  EFEITOS_INTERROMPIDOS_APOS_MS: 10 * 60_000,
  filtroDeEfeitosInterrompidos: () => ({ status: 'approved', effectsCompletedAt: { $exists: false } }),
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
  // Respeita os filtros que distinguem as consultas da varredura: com id do MP
  // (reconsulta), "aguardando confirmação" sem id (busca por ref), pendente sem
  // id nenhum (função caiu antes da resposta) e aprovado com a liberação parada.
  const find = vi.fn((q: any = {}) => {
    let lista: any[]
    if (q.status === 'approved') {
      lista = pedidos.filter(p => p.status === 'approved' && p.effectsStartedAt && !p.effectsCompletedAt)
    } else if (typeof q.statusDetail === 'string') {
      lista = pedidos.filter(p => p.statusDetail === q.statusDetail && !p.providerPaymentId)
    } else if (q.statusDetail?.$nin) {
      lista = pedidos.filter(
        p =>
          p.status === 'pending' &&
          !p.providerPaymentId &&
          !q.statusDetail.$nin.includes(p.statusDetail) &&
          p.createdAt >= q.createdAt.$gte &&
          p.createdAt <= q.createdAt.$lte &&
          (!p.buscaPorReferenciaEm || p.buscaPorReferenciaEm < q.$or[1].buscaPorReferenciaEm.$lt)
      )
    } else {
      lista = pedidos.filter(p => p.providerPaymentId && p.status !== 'approved')
    }
    const cursor: any = {
      project: () => cursor,
      sort: () => cursor,
      limit: (n: number) => ({ toArray: async () => lista.slice(0, n) }),
    }
    return cursor
  })
  const updateOne = vi.fn(async () => ({ matchedCount: 1 }))
  return { collection: () => ({ find, updateOne }), _find: find, _updateOne: updateOne } as any
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

  it('pedido sem confirmação do MP: acha pelo id da order e aplica', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')
    const db = dbCom([pedido('u', { providerPaymentId: undefined, statusDetail: 'provider_unconfirmed' })])
    findByRefMock.mockResolvedValue({ providerOrderId: 'mp-u', status: 'approved' })
    applyPaymentResultMock.mockResolvedValue({ applied: true, order: { status: 'approved' } })

    const stats = await reconciliarPagamentosPendentes(db)

    expect(findByRefMock).toHaveBeenCalledWith('u')
    expect(stats).toEqual({ checked: 1, reconciled: 1, approved: 1, errors: 0 })
  })

  it('pedido sem confirmação que não aparece no MP vira recusa depois da janela', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')
    const antigo = new Date(Date.now() - 10 * 60_000)
    const db = dbCom([pedido('v', { providerPaymentId: undefined, statusDetail: 'provider_unconfirmed', createdAt: antigo, updatedAt: antigo })])
    findByRefMock.mockResolvedValue(null)
    applyPaymentResultMock.mockResolvedValue({ applied: true, order: { status: 'rejected' } })

    const stats = await reconciliarPagamentosPendentes(db)

    expect(applyPaymentResultMock.mock.calls[0][1]).toMatchObject({ status: 'rejected', statusDetail: 'provider_error' })
    expect(stats.reconciled).toBe(1)
  })

  it('pedido pendente SEM id de pagamento (a função caiu antes da resposta do MP): acha pela referência e aprova', async () => {
    // O caso do carrinho: o pedido foi gravado, o MP aprovou o cartão, e a
    // função esgotou o prazo antes de gravar a resposta. Sem id do pagamento
    // e sem "aguardando confirmação", nenhuma consulta o alcançava.
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')
    const ha20min = new Date(Date.now() - 20 * 60_000)
    const db = dbCom([pedido('c', { providerPaymentId: undefined, createdAt: ha20min })])
    findByRefMock.mockResolvedValue({ providerOrderId: 'mp-c', status: 'approved' })
    applyPaymentResultMock.mockResolvedValue({ applied: true, order: { status: 'approved' } })

    const stats = await reconciliarPagamentosPendentes(db)

    expect(findByRefMock).toHaveBeenCalledWith('c')
    expect(applyPaymentResultMock).toHaveBeenCalledWith('c', expect.objectContaining({ status: 'approved' }))
    expect(stats).toMatchObject({ approved: 1, reconciled: 1, foundByReference: 1 })
    // Carimba a busca: não reconsulta o mesmo pedido a cada execução.
    expect(db._updateOne).toHaveBeenCalledWith({ _id: 'c' }, { $set: { buscaPorReferenciaEm: expect.any(Date) } })
  })

  it('pedido sem id recém-criado fica de fora (o checkout ainda pode estar respondendo)', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')
    const db = dbCom([pedido('n', { providerPaymentId: undefined, createdAt: new Date() })])

    await reconciliarPagamentosPendentes(db)

    expect(findByRefMock).not.toHaveBeenCalled()
  })

  it('pedido sem id que não existe no MP continua pendente — nada é recusado no escuro', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')
    const db = dbCom([pedido('x', { providerPaymentId: undefined, createdAt: new Date(Date.now() - 20 * 60_000) })])
    findByRefMock.mockResolvedValue(null)

    const stats = await reconciliarPagamentosPendentes(db)

    expect(applyPaymentResultMock).not.toHaveBeenCalled()
    expect(stats.reconciled).toBe(0)
  })

  it('aprovado com a liberação parada no meio: termina os efeitos', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')
    const db = dbCom([
      pedido('e', { status: 'approved', effectsStartedAt: new Date(Date.now() - 30 * 60_000), type: 'material' }),
    ])
    concluirEfeitosMock.mockResolvedValue('concluidos')

    const stats = await reconciliarPagamentosPendentes(db)

    expect(concluirEfeitosMock).toHaveBeenCalledWith('e')
    expect(stats.effectsResumed).toBe(1)
  })

  it('registra a execução para o painel do Analytics', async () => {
    const { reconciliarPagamentosPendentes } = await import('@/lib/payments/sweep')
    const db = dbCom([])

    await reconciliarPagamentosPendentes(db, { origem: 'admin' })

    expect(db._updateOne).toHaveBeenCalledWith(
      { _id: 'ultima' },
      { $set: expect.objectContaining({ origem: 'admin', stats: expect.any(Object) }) },
      { upsert: true }
    )
  })
})
