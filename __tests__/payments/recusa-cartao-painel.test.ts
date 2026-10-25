import { describe, it, expect } from 'vitest'
import { montarPainelDeRecusas } from '@/lib/payments/recusa-cartao-painel'
import type { RegistroDeFalhaDeCartao } from '@/lib/payments/recusa-cartao-log'

const hora = (iso: string) => new Date(iso)

const recusa = (extra: Partial<RegistroDeFalhaDeCartao> = {}): RegistroDeFalhaDeCartao => ({
  etapa: 'resultado',
  origem: 'servidor',
  orderId: 'o1',
  userId: 'u1',
  nome: 'Maria',
  email: 'maria@exemplo.com',
  produto: 'Combo ME 1',
  valorBase: 290,
  valorCobrado: 297.5,
  status: 'rejected',
  statusDetail: 'cc_rejected_other_reason',
  tecnico: { paymentId: '1', paymentMethodId: 'master', bin: '515590', ultimos4: '4321', parcelas: 3, emissorId: '24' },
  createdAt: hora('2026-10-19T15:00:00Z'),
  ...extra,
})

const entrada = (registros: RegistroDeFalhaDeCartao[], extra: Record<string, unknown> = {}) => ({
  registros,
  tentativas: [],
  aprovacoes: [],
  eventos: [],
  aprovadasNoPeriodo: 0,
  recusadasNoPeriodo: registros.length,
  ...extra,
})

describe('montarPainelDeRecusas — recuperação', () => {
  it('o comprador pagou por Pix minutos depois: recuperada, com método e tempo', () => {
    const p = montarPainelDeRecusas(
      entrada([recusa()], {
        aprovacoes: [{ orderId: 'o2', userId: 'u1', paidAt: hora('2026-10-19T15:07:00Z'), paymentMethod: 'pix', valor: 290 }],
      })
    )
    expect(p.registros[0].recuperada).toEqual({ metodo: 'pix', minutos: 7, valor: 290, orderId: 'o2' })
    expect(p.resumo).toMatchObject({ recuperadas: 1, valorRecuperado: 297.5, valorPerdido: 0 })
  })

  it('acha o comprador pelo e-mail quando a compra foi sem conta', () => {
    const p = montarPainelDeRecusas(
      entrada([recusa({ userId: undefined })], {
        aprovacoes: [{ orderId: 'o2', email: 'MARIA@exemplo.com', paidAt: hora('2026-10-19T16:00:00Z'), paymentMethod: 'credit_card', valor: 290 }],
      })
    )
    expect(p.registros[0].recuperada?.orderId).toBe('o2')
  })

  it('pagamento ANTES da falha, de outro comprador ou depois de 24 h não conta', () => {
    const p = montarPainelDeRecusas(
      entrada([recusa()], {
        aprovacoes: [
          { orderId: 'antes', userId: 'u1', paidAt: hora('2026-10-19T14:00:00Z'), valor: 1 },
          { orderId: 'outro', userId: 'u9', paidAt: hora('2026-10-19T15:05:00Z'), valor: 1 },
          { orderId: 'tarde', userId: 'u1', paidAt: hora('2026-10-20T15:30:00Z'), valor: 1 },
          { orderId: 'o1', userId: 'u1', paidAt: hora('2026-10-19T15:10:00Z'), valor: 1 },
        ],
      })
    )
    expect(p.registros[0].recuperada).toBeNull()
    expect(p.resumo.valorPerdido).toBe(297.5)
  })

  it('várias aprovações depois: vale a primeira', () => {
    const p = montarPainelDeRecusas(
      entrada([recusa()], {
        aprovacoes: [
          { orderId: 'b', userId: 'u1', paidAt: hora('2026-10-19T18:00:00Z'), valor: 1 },
          { orderId: 'a', userId: 'u1', paidAt: hora('2026-10-19T15:20:00Z'), valor: 1 },
        ],
      })
    )
    expect(p.registros[0].recuperada?.orderId).toBe('a')
  })
})

describe('montarPainelDeRecusas — histórico do comprador', () => {
  it('conta as tentativas e recusas das 24 h anteriores (sem contar a própria)', () => {
    const p = montarPainelDeRecusas(
      entrada([recusa()], {
        tentativas: [
          { orderId: 'o1', userId: 'u1', createdAt: hora('2026-10-19T15:00:00Z'), status: 'rejected' },
          { orderId: 'p1', userId: 'u1', createdAt: hora('2026-10-19T14:50:00Z'), status: 'rejected' },
          { orderId: 'p2', userId: 'u1', createdAt: hora('2026-10-19T10:00:00Z'), status: 'approved' },
          { orderId: 'velha', userId: 'u1', createdAt: hora('2026-10-17T10:00:00Z'), status: 'rejected' },
          { orderId: 'outra', userId: 'u9', createdAt: hora('2026-10-19T14:55:00Z'), status: 'rejected' },
        ],
      })
    )
    expect(p.registros[0].historico).toMatchObject({ tentativasAnteriores24h: 2, recusasAnteriores24h: 1 })
    expect(p.registros[0].analise.sinais.some(s => s.texto.includes('3ª tentativa'))).toBe(true)
  })

  it('mesmo cartão (BIN + final) recusado antes: alerta', () => {
    const antes = recusa({ orderId: 'o0', createdAt: hora('2026-10-19T14:00:00Z') })
    const depois = recusa({ orderId: 'o1' })
    const p = montarPainelDeRecusas(entrada([depois, antes]))
    const doDepois = p.registros.find(r => r.orderId === 'o1')!
    const doAntes = p.registros.find(r => r.orderId === 'o0')!
    expect(doDepois.historico.mesmoCartaoRecusadoAntes).toBe(true)
    expect(doAntes.historico.mesmoCartaoRecusadoAntes).toBe(false)
  })

  it('cartão diferente do mesmo comprador não é "o mesmo cartão"', () => {
    const outro = recusa({ orderId: 'o0', createdAt: hora('2026-10-19T14:00:00Z'), tecnico: { bin: '411111', ultimos4: '1111' } })
    const p = montarPainelDeRecusas(entrada([recusa(), outro]))
    expect(p.registros.find(r => r.orderId === 'o1')!.historico.mesmoCartaoRecusadoAntes).toBe(false)
  })
})

describe('montarPainelDeRecusas — aparelho, navegador e totais', () => {
  it('o aparelho vem do evento order_created do pedido', () => {
    const p = montarPainelDeRecusas(
      entrada([recusa()], { eventos: [{ orderId: 'o1', ip: '189.1.2.3', userAgent: 'Mozilla/5.0 (iPhone) AppleWebKit Instagram 300' }] })
    )
    expect(p.registros[0].dispositivo).toBe('Celular · Navegador do Instagram')
    expect(p.registros[0].ip).toBe('189.1.2.3')
    expect(p.resumo.porDispositivo[0].rotulo).toBe('Celular · Navegador do Instagram')
  })

  it('falha vista só no navegador entra com a bandeira, o BIN e o aviso de origem', () => {
    const p = montarPainelDeRecusas(
      entrada(
        [
          {
            etapa: 'tokenizacao',
            origem: 'navegador',
            userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537',
            valorCobrado: 120,
            navegador: { origemDoFormulario: 'checkout', codigos: ['224'], bandeira: 'debvisa', bin: '411111', ultimos4: '1111', parcelas: 1, titularDiferente: true },
            createdAt: hora('2026-10-19T15:00:00Z'),
          },
        ],
        { recusadasNoPeriodo: 0 }
      )
    )
    const r = p.registros[0]
    expect(r.analise.rotulo).toBe('CVV incorreto')
    expect(r.analise.responsavel).toBe('dados')
    expect(r.analise.sinais.some(s => s.texto.includes('DÉBITO'))).toBe(true)
    expect(r.analise.sinais.some(s => s.texto.includes('OUTRA pessoa'))).toBe(true)
    expect(p.resumo.porBandeira[0].rotulo).toBe('Visa (débito)')
    expect(p.resumo.porBin[0].rotulo).toBe('BIN 411111')
    expect(p.resumo.valor).toBe(120)
  })

  it('taxa de recusa: recusados sobre os pagamentos com cartão que tiveram resultado', () => {
    const p = montarPainelDeRecusas(entrada([recusa()], { aprovadasNoPeriodo: 9, recusadasNoPeriodo: 1 }))
    expect(p.taxaDeRecusa).toEqual({ tentativas: 10, recusadas: 1, aprovadas: 9, percentual: 10 })
    expect(montarPainelDeRecusas(entrada([], { recusadasNoPeriodo: 0 })).taxaDeRecusa.percentual).toBeNull()
  })

  it('a lista respeita o limite, mas o resumo cobre todos os registros', () => {
    const muitos = Array.from({ length: 12 }, (_, i) => recusa({ orderId: `o${i}`, userId: `u${i}`, email: `u${i}@x.com`, createdAt: hora(`2026-10-19T15:${String(10 + i)}:00Z`) }))
    const p = montarPainelDeRecusas(entrada(muitos, { limiteDaLista: 5 }))
    expect(p.registros).toHaveLength(5)
    expect(p.resumo.total).toBe(12)
    // Do mais recente para o mais antigo.
    expect(p.registros[0].orderId).toBe('o11')
  })
})
