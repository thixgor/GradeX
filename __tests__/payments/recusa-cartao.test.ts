import { describe, it, expect } from 'vitest'
import {
  analisarRecusa,
  descreverDispositivo,
  diagnosticoGeral,
  extrairDadosTecnicos,
  extrairErroDaApi,
  montarRequisicaoDoCartao,
  resumirRecusas,
  type RequisicaoDoCartao,
  type RecusaParaResumo,
} from '@/lib/payments/recusa-cartao'
import { MercadoPagoPaymentError } from '@/lib/payments/mercado-pago/errors'
import { detalhesDoErroDeToken } from '@/lib/payments/card-token-errors'

/** Um pagamento recusado como o Mercado Pago devolve (campos reais, valores de teste). */
const PAGAMENTO_RECUSADO = {
  id: 1234567890,
  status: 'rejected',
  status_detail: 'cc_rejected_high_risk',
  payment_method_id: 'master',
  payment_type_id: 'credit_card',
  issuer_id: '24',
  installments: 6,
  transaction_amount: 297.5,
  currency_id: 'BRL',
  captured: false,
  live_mode: true,
  binary_mode: false,
  date_created: '2026-10-19T14:02:11.000-04:00',
  card: {
    first_six_digits: '515590',
    last_four_digits: '4321',
    expiration_month: 8,
    expiration_year: 2029,
    cardholder: { name: 'MARIA DA SILVA', identification: { type: 'CPF', number: '05232939769' } },
  },
  payer: { identification: { type: 'CPF', number: '05232939769' }, email: 'maria@exemplo.com' },
  transaction_details: { total_paid_amount: 0, installment_amount: 0 },
  campo_novo_e_sensivel: 'não pode vazar',
}

const REQUISICAO: RequisicaoDoCartao = montarRequisicaoDoCartao({
  paymentMethodId: 'master',
  parcelas: 6,
  valor: 297.5,
  emissor: 24,
  deviceId: 'armor.' + 'a'.repeat(100),
  documentoTipo: 'CPF',
  ambiente: 'producao',
  timeoutMs: 8000,
  idempotencyKey: 'idem-1',
  referencia: 'ord1',
})

describe('extrairDadosTecnicos', () => {
  it('copia só os campos conhecidos e nunca o que é sensível', () => {
    const t = extrairDadosTecnicos(PAGAMENTO_RECUSADO)
    expect(t).toMatchObject({
      paymentId: '1234567890',
      status: 'rejected',
      statusDetail: 'cc_rejected_high_risk',
      paymentMethodId: 'master',
      paymentTypeId: 'credit_card',
      emissorId: '24',
      bin: '515590',
      ultimos4: '4321',
      parcelas: 6,
      valorTransacao: 297.5,
      modoReal: true,
      capturado: false,
      documentoDoPagadorTipo: 'CPF',
      documentoDoTitularTipo: 'CPF',
    })
    const guardado = JSON.stringify(t)
    // Nada de CPF, nome do titular, e-mail, validade ou campo desconhecido.
    expect(guardado).not.toContain('05232939769')
    expect(guardado).not.toContain('MARIA')
    expect(guardado).not.toContain('maria@exemplo.com')
    expect(guardado).not.toContain('não pode vazar')
    expect(guardado).not.toContain('2029')
  })

  it('descarta BIN e final fora do formato (nunca guarda um número de cartão inteiro)', () => {
    const t = extrairDadosTecnicos({ card: { first_six_digits: '5155901234567890', last_four_digits: '12' } })
    expect(t.bin).toBeUndefined()
    expect(t.ultimos4).toBeUndefined()
  })

  it('entrada inválida vira objeto vazio', () => {
    expect(extrairDadosTecnicos(null)).toEqual({})
    expect(extrairDadosTecnicos('x')).toEqual({})
  })
})

describe('montarRequisicaoDoCartao', () => {
  it('registra o que foi enviado, sem o device ID em si', () => {
    expect(REQUISICAO).toMatchObject({
      parcelas: 6,
      valorEnviado: 297.5,
      emissorEnviado: '24',
      deviceIdPresente: true,
      deviceIdTamanho: 106,
      titularDiferenteDoComprador: false,
      ambiente: 'producao',
    })
    expect(JSON.stringify(REQUISICAO)).not.toContain('armor.')
  })

  it('sem device ID e com titular diferente', () => {
    const r = montarRequisicaoDoCartao({ paymentMethodId: 'visa', valor: 10, deviceId: '  ', cardholderDocumentNumber: '52998224725', ambiente: 'sandbox', timeoutMs: 8000 })
    expect(r.deviceIdPresente).toBe(false)
    expect(r.titularDiferenteDoComprador).toBe(true)
    expect(r.emissorEnviado).toBeNull()
    expect(JSON.stringify(r)).not.toContain('52998224725')
  })
})

describe('extrairErroDaApi', () => {
  it('lê o erro técnico do SDK (corpo JSON da API)', () => {
    const e = extrairErroDaApi({ message: 'Invalid card_token_id', error: 'bad_request', status: 400, cause: [{ code: 2006, description: 'Card Token not found' }] })
    expect(e).toEqual({
      status: 400,
      codigo: 'bad_request',
      mensagem: 'Invalid card_token_id',
      causas: [{ codigo: '2006', descricao: 'Card Token not found' }],
    })
  })

  it('no erro já traduzido, lê o ORIGINAL — não a mensagem amigável', () => {
    const original = { message: 'Invalid users involved', status: 400, cause: [{ code: 2034, description: 'Invalid users involved' }] }
    const e = extrairErroDaApi(new MercadoPagoPaymentError('Não é possível pagar com o e-mail da conta que recebe o pagamento.', original))
    expect(e.mensagem).toBe('Invalid users involved')
    expect(e.status).toBe(400)
    expect(e.causas[0].codigo).toBe('2034')
  })

  it('lida com o que não é objeto', () => {
    expect(extrairErroDaApi(undefined).causas).toEqual([])
    expect(extrairErroDaApi('falhou').mensagem).toBe('falhou')
  })
})

describe('analisarRecusa — recusa devolvida pelo Mercado Pago', () => {
  const resultado = (statusDetail: string, extra = {}) =>
    analisarRecusa({ etapa: 'resultado', status: 'rejected', statusDetail, tecnico: extrairDadosTecnicos({ ...PAGAMENTO_RECUSADO, status_detail: statusDetail }), requisicao: REQUISICAO, ...extra })

  it.each([
    ['cc_rejected_other_reason', 'banco'],
    ['cc_rejected_call_for_authorize', 'banco'],
    ['cc_rejected_card_disabled', 'banco'],
    ['cc_rejected_card_error', 'rede'],
    ['cc_rejected_bad_filled_card_number', 'dados'],
    ['cc_rejected_bad_filled_date', 'dados'],
    ['cc_rejected_bad_filled_security_code', 'dados'],
    ['cc_rejected_bad_filled_other', 'dados'],
    ['cc_rejected_duplicated_payment', 'antifraude'],
    ['cc_rejected_high_risk', 'antifraude'],
    ['cc_rejected_fraud', 'antifraude'],
    ['cc_rejected_max_attempts', 'antifraude'],
    ['cc_rejected_blacklist', 'antifraude'],
    ['cc_rejected_insufficient_amount', 'limite'],
    ['cc_rejected_invalid_installments', 'limite'],
    ['cc_amount_rate_limit_exceeded', 'limite'],
    ['cc_rejected_card_type_not_allowed', 'banco'],
    ['cc_rejected_3ds_mandatory', 'banco'],
    ['cc_rejected_3ds_challenge', 'banco'],
    ['rejected_by_bank', 'banco'],
    ['rejected_insufficient_data', 'dados'],
    ['bank_error', 'rede'],
    ['provider_error', 'integracao'],
  ])('%s → responsável %s, com diagnóstico, causas e ações', (codigo, responsavel) => {
    const a = resultado(codigo)
    expect(a.responsavel).toBe(responsavel)
    expect(a.codigo).toBe(codigo)
    expect(a.diagnostico.length).toBeGreaterThan(30)
    expect(a.causas.length).toBeGreaterThan(0)
    expect(a.acaoComprador).toBeTruthy()
    expect(a.acaoEquipe).toBeTruthy()
    expect(a.responsavelRotulo).toBeTruthy()
  })

  it('código novo do Mercado Pago: análise genérica que mostra o código e diz onde catalogar', () => {
    const a = resultado('cc_rejected_algo_novo')
    expect(a.responsavel).toBe('desconhecido')
    expect(a.rotulo).toContain('cc_rejected_algo_novo')
    expect(a.acaoEquipe).toContain('POR_STATUS_DETAIL')
  })

  it('cancelado: análise própria, sem fingir que é recusa do banco', () => {
    const a = analisarRecusa({ etapa: 'resultado', status: 'cancelled', statusDetail: 'by_collector' })
    expect(a.rotulo).toBe('Pagamento cancelado')
  })

  it('parcelas e valores aparecem como sinal; limite + parcelado vira atenção', () => {
    const a = resultado('cc_rejected_insufficient_amount')
    const s = a.sinais.find(x => x.texto.includes('parcelada em 6x'))
    expect(s?.nivel).toBe('atencao')
    expect(s?.texto).toContain('R$ 297,50')
  })

  it('SEM device ID numa recusa do antifraude: alerta de causa nossa', () => {
    const semDevice = { ...REQUISICAO, deviceIdPresente: false, deviceIdTamanho: 0 }
    const a = resultado('cc_rejected_high_risk', { requisicao: semDevice })
    const s = a.sinais.find(x => x.texto.includes('device ID NÃO foi enviado'))
    expect(s?.nivel).toBe('alerta')
  })

  it('COM device ID: registra que foi enviado (descarta a hipótese)', () => {
    const a = resultado('cc_rejected_high_risk')
    expect(a.sinais.some(x => x.texto.includes('Device ID enviado'))).toBe(true)
    expect(a.sinais.some(x => x.texto.includes('NÃO foi enviado'))).toBe(false)
  })

  it('cartão de outra pessoa e emissor não enviado viram sinais', () => {
    const r = { ...REQUISICAO, titularDiferenteDoComprador: true, emissorEnviado: null }
    const a = resultado('cc_rejected_high_risk', { requisicao: r })
    expect(a.sinais.find(x => x.texto.includes('OUTRA pessoa'))?.nivel).toBe('alerta')
    expect(a.sinais.some(x => x.texto.includes('issuer_id'))).toBe(true)
  })

  it('débito é sinalizado', () => {
    const a = analisarRecusa({
      etapa: 'resultado',
      statusDetail: 'cc_rejected_other_reason',
      tecnico: { paymentMethodId: 'debmaster', paymentTypeId: 'debit_card' },
    })
    expect(a.sinais.some(x => x.texto.includes('DÉBITO'))).toBe(true)
  })

  it('histórico do comprador: tentativas repetidas e mesmo cartão', () => {
    const a = resultado('cc_rejected_other_reason', {
      historico: { tentativasAnteriores24h: 2, recusasAnteriores24h: 2, mesmoCartaoRecusadoAntes: true },
    })
    expect(a.sinais.find(x => x.texto.includes('3ª tentativa'))?.nivel).toBe('atencao')
    expect(a.sinais.find(x => x.texto.includes('MESMO cartão'))?.nivel).toBe('alerta')
  })

  it('modo de teste não passa por recusa real', () => {
    const a = resultado('cc_rejected_other_reason', { requisicao: { ...REQUISICAO, ambiente: 'sandbox' } })
    expect(a.sinais.some(x => x.texto.includes('TESTE'))).toBe(true)
  })

  it('provider_error é nosso; recusa do banco não', () => {
    expect(resultado('provider_error').nosso).toBe(true)
    expect(resultado('cc_rejected_other_reason').nosso).toBe(false)
    expect(resultado('cc_rejected_invalid_installments').nosso).toBe(true)
  })

  it('duplicado manda conferir se o primeiro foi aprovado (pode ter sido cobrado)', () => {
    expect(resultado('cc_rejected_duplicated_payment').acaoEquipe).toContain('CONFIRA')
  })
})

describe('analisarRecusa — erro da API na criação', () => {
  const criacao = (erro: unknown) => analisarRecusa({ etapa: 'criacao', erro: extrairErroDaApi(erro), requisicao: REQUISICAO })

  it('token vencido/usado (2006) não acusa o cartão: diz que é a tela aberta ou o reenvio', () => {
    const a = criacao({ status: 400, message: 'Invalid card_token_id', cause: [{ code: 2006, description: 'Card Token not found' }] })
    expect(a.codigo).toBe('2006')
    expect(a.rotulo).toContain('Token do cartão')
    expect(a.diagnostico).toContain('única vez')
  })

  it('CPF diferente do titular (2067) é dado do comprador', () => {
    expect(criacao({ cause: [{ code: 2067 }] }).responsavel).toBe('dados')
  })

  it('parcelas recusadas na criação (3029): investigar a consulta da tela', () => {
    const a = criacao({ cause: [{ code: 3029 }] })
    expect(a.nosso).toBe(true)
    expect(a.acaoEquipe).toContain('INVESTIGUE')
  })

  it('credencial recusada (401): urgente e nosso — nenhum cartão passa', () => {
    const a = criacao({ status: 401, message: 'Invalid credentials' })
    expect(a.responsavel).toBe('integracao')
    expect(a.nosso).toBe(true)
    expect(a.acaoEquipe).toContain('URGENTE')
  })

  it('5xx do Mercado Pago é rede, não culpa do cartão', () => {
    expect(criacao({ status: 503 }).responsavel).toBe('rede')
  })

  it('erro de validação desconhecido: genérico, com a mensagem dentro do diagnóstico', () => {
    const a = criacao({ status: 400, message: 'campo_x invalido', cause: [{ code: 9999, description: 'campo_x invalido' }] })
    expect(a.diagnostico).toContain('campo_x invalido')
    expect(a.nosso).toBe(true)
  })

  it('CC_VAL_433 na assinatura é recusa do banco na validação do cartão', () => {
    const a = analisarRecusa({ etapa: 'assinatura', erro: extrairErroDaApi({ message: 'CC_VAL_433 Credit card validation has failed' }) })
    expect(a.codigo).toBe('CC_VAL_433')
    expect(a.responsavel).toBe('banco')
  })
})

describe('analisarRecusa — o que o navegador viu', () => {
  it('códigos do mercadopago.js: número, validade, CVV, nome, CPF', () => {
    const rotulo = (codigos: string[]) => analisarRecusa({ etapa: 'tokenizacao', navegador: { codigos } }).rotulo
    expect(rotulo(['205'])).toContain('Número')
    expect(rotulo(['208'])).toContain('Validade')
    expect(rotulo(['224'])).toContain('CVV')
    expect(rotulo(['221'])).toContain('Nome')
    expect(rotulo(['322'])).toContain('CPF')
  })

  it('falha de rede no navegador não é culpa do cartão', () => {
    const a = analisarRecusa({ etapa: 'tokenizacao', navegador: { codigos: [], mensagem: 'Failed to fetch' } })
    expect(a.responsavel).toBe('rede')
  })

  it('o que o servidor devolveu ao envio: 409, 503, 429, 500, 400', () => {
    const r = (httpStatus: number) => analisarRecusa({ etapa: 'envio', navegador: { httpStatus, mensagem: 'x' } })
    expect(r(409).rotulo).toContain('pagamento anterior')
    expect(r(503).nosso).toBe(true)
    expect(r(429).responsavel).toBe('rede')
    expect(r(500).nosso).toBe(true)
    expect(r(400).responsavel).toBe('dados')
  })

  it('detalhesDoErroDeToken lê os códigos técnicos do SDK', () => {
    expect(detalhesDoErroDeToken([{ code: '205', description: 'invalid card number' }])).toEqual({ codigos: ['205'], mensagem: 'invalid card number' })
    expect(detalhesDoErroDeToken({ cause: [{ code: 'E301' }, { code: 'E302' }] }).codigos).toEqual(['E301', 'E302'])
    expect(detalhesDoErroDeToken(new Error('boom')).mensagem).toBe('boom')
  })
})

describe('descreverDispositivo', () => {
  it('celular, computador e navegadores embutidos', () => {
    expect(descreverDispositivo('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit Instagram 300.0')).toBe('Celular · Navegador do Instagram')
    expect(descreverDispositivo('Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537')).toBe('Celular · Chrome')
    expect(descreverDispositivo('Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537 Edg/120')).toBe('Computador · Edge')
    expect(descreverDispositivo(undefined)).toBe('Não informado')
  })
})

describe('resumirRecusas e diagnosticoGeral', () => {
  const rec = (codigo: string, extra: Partial<RecusaParaResumo> = {}): RecusaParaResumo => ({
    etapa: 'resultado',
    analise: analisarRecusa({ etapa: 'resultado', statusDetail: codigo, requisicao: REQUISICAO }),
    tecnico: { paymentMethodId: 'master', emissorId: '24', bin: '515590', parcelas: 1 },
    requisicao: REQUISICAO,
    valor: 100,
    criadoEm: '2026-10-19T15:00:00Z', // 12h em Brasília
    comprador: 'u:1',
    recuperada: false,
    dispositivo: 'Celular · Chrome',
    ...extra,
  })

  it('agrupa por motivo, responsável, bandeira, emissor, BIN e horário', () => {
    const r = resumirRecusas([
      rec('cc_rejected_other_reason'),
      rec('cc_rejected_other_reason', { comprador: 'u:2', recuperada: true }),
      rec('cc_rejected_high_risk', { comprador: 'u:3', criadoEm: '2026-10-19T04:00:00Z' }),
    ])
    expect(r.total).toBe(3)
    expect(r.compradores).toBe(3)
    expect(r.recuperadas).toBe(1)
    expect(r.valorPerdido).toBe(200)
    expect(r.valorRecuperado).toBe(100)
    expect(r.porMotivo[0]).toMatchObject({ chave: 'cc_rejected_other_reason', qtd: 2, recuperadas: 1 })
    expect(r.porResponsavel.map(l => [l.chave, l.qtd])).toEqual([['banco', 2], ['antifraude', 1]])
    expect(r.porBandeira[0]).toMatchObject({ rotulo: 'Mastercard', qtd: 3 })
    expect(r.porEmissor[0].qtd).toBe(3)
    expect(r.porBin[0].rotulo).toBe('BIN 515590')
    expect(r.porHorario.find(l => l.chave.startsWith('Madrugada'))?.qtd).toBe(1)
    expect(r.porHorario.find(l => l.chave.startsWith('Manhã'))?.qtd).toBe(0)
    expect(r.porHorario.find(l => l.chave.startsWith('Tarde'))?.qtd).toBe(2)
  })

  it('conta as tentativas sem device ID', () => {
    const sem = { ...REQUISICAO, deviceIdPresente: false }
    expect(resumirRecusas([rec('cc_rejected_high_risk', { requisicao: sem }), rec('cc_rejected_high_risk')]).semDeviceId).toBe(1)
  })

  it('o diagnóstico geral destaca o que é acionável', () => {
    const sem = { ...REQUISICAO, deviceIdPresente: false }
    const lista = [
      rec('cc_rejected_high_risk', { requisicao: sem }),
      rec('cc_rejected_other_reason', { comprador: 'u:2' }),
      rec('provider_error', { comprador: 'u:3' }),
    ]
    const texto = diagnosticoGeral(resumirRecusas(lista), { aprovadas: 17, recusadasNoPeriodo: 3 }).join('\n')
    expect(texto).toContain('3 foram recusados (15,0%)')
    expect(texto).toContain('SEM device ID')
    expect(texto).toContain('causa NOSSA')
    expect(texto).toContain('Nenhuma recusa foi recuperada')
  })

  it('concorda no singular (1 falha veio, 1 tentativa saiu, 1 foi recuperada)', () => {
    const sem = { ...REQUISICAO, deviceIdPresente: false }
    const texto = diagnosticoGeral(resumirRecusas([rec('cc_rejected_high_risk', { requisicao: sem, recuperada: true })])).join('\n')
    expect(texto).toContain('1 falha (100%) veio do antifraude')
    expect(texto).toContain('1 tentativa saiu SEM device ID')
    expect(texto).toContain('1 de 1 recusas (100%) foi recuperada')
  })

  it('sem falhas: uma frase só', () => {
    expect(diagnosticoGeral(resumirRecusas([]))).toEqual(['Nenhuma falha de cartão registrada no período.'])
  })
})
