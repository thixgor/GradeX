import { describe, it, expect, vi } from 'vitest'

import { minutosDesde, pagamentoEmCartaoJaAberto } from '@/lib/payments/duplicate-guard'

/**
 * Regressão do caso que deixou um comprador exposto a cobrança dupla: ele
 * tentou pagar no cartão, a tela ficou presa em "Em análise"
 * (`pending_review_manual` — antifraude do MP, não erro nosso), e ele tentou
 * de novo com outro cartão em outro aparelho. Sem trava nenhuma, cada
 * tentativa criava uma Order nova e um pagamento novo no Mercado Pago — se o
 * MP aprovasse mais de uma, ele seria cobrado mais de uma vez pela mesma
 * compra, por uma decisão que não é nossa.
 *
 * `pagamentoEmCartaoJaAberto` é o que a rota de checkout consulta antes de
 * criar uma Order nova em cartão. Aqui testamos só a FORMA da consulta —
 * `findOne` é substituído por um dublê que devolve o filtro recebido, sem
 * Mongo de verdade — porque é a forma do filtro que decide se a trava pega o
 * caso certo sem incomodar quem está comprando outra coisa.
 */

function dbComResultado(resultado: any, capturarFiltro?: (filtro: any) => void) {
  return {
    collection: () => ({
      findOne: async (filtro: any) => {
        capturarFiltro?.(filtro)
        return resultado
      },
    }),
  } as any
}

describe('pagamentoEmCartaoJaAberto', () => {
  it('sem usuário (checkout de convidado), não consulta nada', async () => {
    const db = { collection: vi.fn() } as any
    const resultado = await pagamentoEmCartaoJaAberto(db, undefined)
    expect(resultado).toBeNull()
    expect(db.collection).not.toHaveBeenCalled()
  })

  it('acha o pagamento em cartão pendente do mesmo usuário', async () => {
    const criadoEm = new Date(Date.now() - 5 * 60_000)
    const db = dbComResultado({
      _id: 'abc123',
      status: 'in_process',
      paymentMethod: 'credit_card',
      createdAt: criadoEm,
    })

    const aberto = await pagamentoEmCartaoJaAberto(db, 'user-1')

    expect(aberto).toEqual({
      orderId: 'abc123',
      status: 'in_process',
      paymentMethod: 'credit_card',
      createdAt: criadoEm,
    })
  })

  it('só compara com o MESMO usuário, status aberto e janela recente', async () => {
    let filtroRecebido: any = null
    const db = dbComResultado(null, filtro => {
      filtroRecebido = filtro
    })

    await pagamentoEmCartaoJaAberto(db, 'user-1')

    expect(filtroRecebido.userId).toBe('user-1')
    expect(filtroRecebido.status).toEqual({ $in: ['pending', 'in_process'] })
    expect(filtroRecebido.createdAt.$gte).toBeInstanceOf(Date)
    // Pix/boleto pendente não pode travar uma tentativa de cartão nova — só
    // outro cartão (ou uma order recém-criada, ainda sem paymentMethod
    // gravado) conta como risco de dupla captura.
    expect(filtroRecebido.$or).toEqual([
      { paymentMethod: 'credit_card' },
      { paymentMethod: 'debit_card' },
      { paymentMethod: { $exists: false } },
    ])
  })

  it('nenhum pedido em aberto — pode seguir com a criação normal', async () => {
    const db = dbComResultado(null)
    expect(await pagamentoEmCartaoJaAberto(db, 'user-1')).toBeNull()
  })
})

describe('minutosDesde', () => {
  it('arredonda para minutos completos, nunca negativo', () => {
    expect(minutosDesde(new Date(Date.now() - 90_000))).toBe(2)
    expect(minutosDesde(new Date(Date.now() + 60_000))).toBe(0)
  })
})
