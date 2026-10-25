import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RecusasCartaoView } from '@/components/admin/recusas-cartao-panel'
import { montarPainelDeRecusas } from '@/lib/payments/recusa-cartao-painel'
import { extrairErroDaApi, montarRequisicaoDoCartao } from '@/lib/payments/recusa-cartao'
import type { RegistroDeFalhaDeCartao } from '@/lib/payments/recusa-cartao-log'

/**
 * A aba "Recusas de cartão" do Analytics, renderizada com dados de vários tipos
 * de falha. Só o carregamento (fetch) fica de fora: a tela recebe os dados.
 */

const requisicao = (extra = {}) =>
  montarRequisicaoDoCartao({ paymentMethodId: 'master', parcelas: 3, valor: 297.5, emissor: 24, deviceId: '', ambiente: 'producao', timeoutMs: 8000, idempotencyKey: 'idem-1', referencia: 'o1', ...extra })

const registros: RegistroDeFalhaDeCartao[] = [
  {
    etapa: 'resultado', origem: 'servidor', orderId: 'o1', userId: 'u1', nome: 'Maria da Silva', email: 'maria@exemplo.com',
    produto: 'Combo ME 1', valorBase: 290, valorCobrado: 297.5, status: 'rejected', statusDetail: 'cc_rejected_high_risk',
    tecnico: { paymentId: '987', paymentMethodId: 'master', paymentTypeId: 'credit_card', emissorId: '24', bin: '515590', ultimos4: '4321', parcelas: 3, valorTransacao: 297.5, modoReal: true },
    requisicao: requisicao(),
    createdAt: new Date('2026-10-19T15:00:00Z'),
  },
  {
    etapa: 'criacao', origem: 'servidor', orderId: 'o2', userId: 'u2', nome: 'João', email: 'joao@exemplo.com', produto: 'Plus+',
    valorCobrado: 396.76, erro: extrairErroDaApi({ message: 'Invalid card_token_id', status: 400, cause: [{ code: 2006, description: 'Card Token not found' }] }),
    requisicao: requisicao({ deviceId: 'dev' }), createdAt: new Date('2026-10-19T14:00:00Z'),
  },
  {
    etapa: 'tokenizacao', origem: 'navegador', userId: 'u3', nome: 'Ana', email: 'ana@exemplo.com',
    produto: '<script>alert("x")</script>', valorCobrado: 80, userAgent: 'Mozilla/5.0 (iPhone) AppleWebKit Instagram 300',
    navegador: { origemDoFormulario: 'checkout', codigos: ['224'], mensagem: 'invalid cvv', bandeira: 'visa', bin: '411111', ultimos4: '1111', parcelas: 1 },
    createdAt: new Date('2026-10-19T13:00:00Z'),
  },
  {
    etapa: 'resultado', origem: 'servidor', orderId: 'o4', userId: 'u4', nome: 'Pedro', email: 'pedro@exemplo.com', produto: 'APG SOI IV',
    valorCobrado: 50, status: 'rejected', statusDetail: 'provider_error', tecnico: {}, requisicao: requisicao({ deviceId: 'dev' }),
    createdAt: new Date('2026-10-19T12:00:00Z'),
  },
]

const painel = montarPainelDeRecusas({
  registros,
  tentativas: [],
  aprovacoes: [{ orderId: 'o9', userId: 'u1', paidAt: new Date('2026-10-19T15:08:00Z'), paymentMethod: 'pix', valor: 290 }],
  eventos: [{ orderId: 'o1', ip: '189.1.2.3', userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537' }],
  aprovadasNoPeriodo: 21,
  recusadasNoPeriodo: 4,
})
const dados: any = { ...painel, dias: 30, atualizadoEm: '2026-10-19T16:00:00Z' }

const html = (extra: Record<string, unknown> = {}, d = dados) =>
  renderToStaticMarkup(createElement(RecusasCartaoView, { dados: d, carregando: false, dias: 30, onDias: () => {}, onAtualizar: () => {}, ...extra }))

describe('aba "Recusas de cartão"', () => {
  it('mostra o diagnóstico, os totais e a taxa de recusa', () => {
    const h = html()
    expect(h).toContain('Recusas de cartão')
    expect(h).toContain('Diagnóstico do período')
    expect(h).toContain('4 foram recusados (16,0%)')
    expect(h).toContain('Falhas registradas')
    expect(h).toContain('Taxa de recusa')
    expect(h).toContain('16,0%')
    expect(h).toContain('Sem device ID')
    expect(h).toContain('Indício de causa nossa')
  })

  it('lista cada falha com motivo, responsável, recuperação e origem', () => {
    const h = html()
    expect(h).toContain('Antifraude do Mercado Pago (alto risco)')
    expect(h).toContain('Token do cartão inválido, vencido ou já usado')
    expect(h).toContain('CVV incorreto')
    expect(h).toContain('Mercado Pago não confirmou o pagamento')
    expect(h).toContain('Recuperada')
    expect(h).toContain('Não recuperada')
    expect(h).toContain('visto no navegador')
    expect(h).toContain('Investigar: pode ser nosso')
    expect(h).toContain('Maria da Silva')
    expect(h).toContain('515590••••4321')
  })

  it('as tabelas de resumo trazem motivo, bandeira, emissor, BIN, parcelas, horário e dispositivo', () => {
    const h = html()
    for (const titulo of ['Por motivo', 'Por responsável pela decisão', 'Por bandeira', 'Por emissor', 'Por BIN', 'Por parcelas', 'Por horário', 'Por dispositivo', 'Por etapa em que falhou']) {
      expect(h).toContain(titulo)
    }
    expect(h).toContain('Mastercard')
    expect(h).toContain('BIN 515590')
    expect(h).toContain('Madrugada (0h–6h)')
    expect(h).toContain('Celular · Navegador do Instagram')
  })

  it('registro aberto: análise, causas, sinais, ações e dados técnicos', () => {
    const id = dados.registros.find((r: any) => r.orderId === 'o1').id
    const h = html({ abertoInicial: id })
    expect(h).toContain('Análise')
    expect(h).toContain('Causas prováveis')
    expect(h).toContain('Device ID ausente')
    expect(h).toContain('Sinais desta tentativa')
    expect(h).toContain('O device ID NÃO foi enviado ao Mercado Pago nesta tentativa')
    expect(h).toContain('O que dizer ao comprador')
    expect(h).toContain('O que a equipe deve fazer')
    expect(h).toContain('Dados técnicos')
    expect(h).toContain('cc_rejected_high_risk')
    expect(h).toContain('O que enviamos ao Mercado Pago')
    expect(h).toContain('NÃO enviado')
    expect(h).toContain('Recuperada: o comprador pagou')
    expect(h).toContain('8 min depois')
    expect(h).toContain('Ver registro bruto (JSON)')
  })

  it('erro da API aberto: HTTP, mensagem e causas técnicas', () => {
    const id = dados.registros.find((r: any) => r.orderId === 'o2').id
    const h = html({ abertoInicial: id })
    expect(h).toContain('Erro da API')
    expect(h).toContain('Invalid card_token_id')
    expect(h).toContain('Card Token not found')
  })

  it('o que veio do navegador é marcado como indício e traz os códigos', () => {
    const id = dados.registros.find((r: any) => r.etapa === 'tokenizacao').id
    const h = html({ abertoInicial: id })
    expect(h).toContain('navegador do comprador (indício)')
    expect(h).toContain('O que o navegador viu')
    expect(h).toContain('224')
  })

  it('texto vindo do navegador sai ESCAPADO (nada de HTML ativo no painel do admin)', () => {
    const h = html()
    expect(h).not.toContain('<script>alert')
    expect(h).toContain('&lt;script&gt;')
  })

  it('sem registros: mostra o diagnóstico vazio e a lista vazia, sem quebrar', () => {
    const vazio: any = { ...montarPainelDeRecusas({ registros: [], tentativas: [], aprovacoes: [], eventos: [], aprovadasNoPeriodo: 0, recusadasNoPeriodo: 0 }), dias: 7, atualizadoEm: '2026-10-19T16:00:00Z' }
    const h = html({ dias: 7 }, vazio)
    expect(h).toContain('Nenhuma falha de cartão registrada no período.')
    expect(h).toContain('Nenhuma falha de cartão com esses filtros.')
    expect(h).toContain('Sem dados no período.')
  })
})
