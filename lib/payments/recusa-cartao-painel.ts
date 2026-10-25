/**
 * O painel "Recusas de cartão" do DomineAqui Analytics — a parte PURA que junta
 * cada falha registrada ao seu contexto: o histórico do comprador, o aparelho e
 * se ele pagou depois. As consultas ao banco ficam na rota
 * (`/api/admin/analytics/recusas-cartao`); aqui só entram listas.
 *
 * Recuperada = o MESMO comprador (mesma conta ou mesmo e-mail) teve um
 * pagamento aprovado nas 24 h seguintes à falha. Não prova que era o mesmo
 * produto: é o indício de que a venda não se perdeu.
 */

import {
  analisarRecusa,
  descreverDispositivo,
  diagnosticoGeral,
  resumirRecusas,
  ROTULO_DA_ETAPA,
  type AnaliseDaRecusa,
  type DadosDoNavegador,
  type DadosTecnicos,
  type ErroDaApi,
  type EtapaDaFalha,
  type HistoricoDoComprador,
  type RecusaParaResumo,
  type RequisicaoDoCartao,
  type ResumoDasRecusas,
} from './recusa-cartao'
import type { RegistroDeFalhaDeCartao } from './recusa-cartao-log'

const DIA_MS = 24 * 60 * 60 * 1000

export interface TentativaDeCartao {
  orderId: string
  userId?: string
  email?: string
  createdAt: Date | string
  status: string
}

export interface AprovacaoDoComprador {
  orderId: string
  userId?: string
  email?: string
  paidAt: Date | string
  paymentMethod?: string
  valor: number
}

export interface EventoDoPedido {
  orderId?: string
  ip?: string
  userAgent?: string
}

export interface EntradaDoPainel {
  registros: RegistroDeFalhaDeCartao[]
  tentativas: TentativaDeCartao[]
  aprovacoes: AprovacaoDoComprador[]
  eventos: EventoDoPedido[]
  /** Pagamentos com cartão que tiveram desfecho no período (para a taxa de recusa). */
  aprovadasNoPeriodo: number
  recusadasNoPeriodo: number
  /** Quantos registros devolver na lista (o resumo sempre cobre todos). */
  limiteDaLista?: number
}

export interface RegistroDoPainel {
  id: string
  criadoEm: string
  etapa: EtapaDaFalha
  etapaRotulo: string
  origem: 'servidor' | 'navegador'
  orderId?: string
  tipoDoPedido?: string
  comprador: { nome?: string; email?: string; userId?: string }
  produto?: string
  valorBase?: number
  valorCobrado?: number
  status?: string
  statusDetail?: string
  tecnico?: DadosTecnicos
  requisicao?: RequisicaoDoCartao
  erro?: ErroDaApi
  navegador?: DadosDoNavegador
  ip?: string
  dispositivo: string
  analise: AnaliseDaRecusa
  historico: HistoricoDoComprador
  recuperada: { metodo: string; minutos: number; valor: number; orderId: string } | null
}

export interface PainelDeRecusas {
  resumo: ResumoDasRecusas
  diagnostico: string[]
  taxaDeRecusa: { tentativas: number; recusadas: number; aprovadas: number; percentual: number | null }
  registros: RegistroDoPainel[]
}

const ms = (d: Date | string) => new Date(d).getTime()

function chavesDo(userId?: string, email?: string): string[] {
  const chaves: string[] = []
  if (userId) chaves.push(`u:${userId}`)
  const e = (email || '').toLowerCase().trim()
  if (e) chaves.push(`e:${e}`)
  return chaves
}

/** Pseudo-dados técnicos do que o navegador contou, para a análise e o resumo. */
function tecnicoDoNavegador(n?: DadosDoNavegador): DadosTecnicos | undefined {
  if (!n) return undefined
  const t: DadosTecnicos = {}
  if (n.bandeira) t.paymentMethodId = n.bandeira
  if (n.bin) t.bin = n.bin
  if (n.ultimos4) t.ultimos4 = n.ultimos4
  if (n.parcelas) t.parcelas = n.parcelas
  if (n.valor != null) t.valorTransacao = n.valor
  return Object.keys(t).length ? t : undefined
}

export function montarPainelDeRecusas(entrada: EntradaDoPainel): PainelDeRecusas {
  const registros = [...entrada.registros].sort((a, b) => ms(b.createdAt) - ms(a.createdAt))

  const porPedido = new Map<string, EventoDoPedido>()
  for (const ev of entrada.eventos) if (ev.orderId && !porPedido.has(ev.orderId)) porPedido.set(ev.orderId, ev)

  // Índices por comprador, para não varrer tudo a cada registro.
  const tentativasPor = new Map<string, TentativaDeCartao[]>()
  for (const t of entrada.tentativas) {
    for (const k of chavesDo(t.userId, t.email)) {
      if (!tentativasPor.has(k)) tentativasPor.set(k, [])
      tentativasPor.get(k)!.push(t)
    }
  }
  const aprovacoesPor = new Map<string, AprovacaoDoComprador[]>()
  for (const a of entrada.aprovacoes) {
    for (const k of chavesDo(a.userId, a.email)) {
      if (!aprovacoesPor.has(k)) aprovacoesPor.set(k, [])
      aprovacoesPor.get(k)!.push(a)
    }
  }
  const registrosPor = new Map<string, RegistroDeFalhaDeCartao[]>()
  for (const r of registros) {
    for (const k of chavesDo(r.userId, r.email)) {
      if (!registrosPor.has(k)) registrosPor.set(k, [])
      registrosPor.get(k)!.push(r)
    }
  }

  const montados: RegistroDoPainel[] = registros.map(r => {
    const chaves = chavesDo(r.userId, r.email)
    const quando = ms(r.createdAt)
    const tecnico = r.tecnico || tecnicoDoNavegador(r.navegador)

    // Histórico do comprador nas 24 h anteriores.
    const anteriores = new Map<string, TentativaDeCartao>()
    for (const k of chaves) {
      for (const t of tentativasPor.get(k) || []) {
        if (t.orderId === r.orderId) continue
        const quandoT = ms(t.createdAt)
        if (quandoT < quando && quando - quandoT <= DIA_MS) anteriores.set(t.orderId, t)
      }
    }
    const recusasAnteriores = [...anteriores.values()].filter(t => t.status === 'rejected' || t.status === 'cancelled').length
    const mesmoCartao = !!(
      tecnico?.bin &&
      tecnico.ultimos4 &&
      chaves.some(k =>
        (registrosPor.get(k) || []).some(o => {
          if (o === r || ms(o.createdAt) >= quando) return false
          const to = o.tecnico || tecnicoDoNavegador(o.navegador)
          return to?.bin === tecnico.bin && to?.ultimos4 === tecnico.ultimos4
        })
      )
    )
    const historico: HistoricoDoComprador = {
      tentativasAnteriores24h: anteriores.size,
      recusasAnteriores24h: recusasAnteriores,
      mesmoCartaoRecusadoAntes: mesmoCartao,
    }

    // Pagou depois?
    let recuperada: RegistroDoPainel['recuperada'] = null
    for (const k of chaves) {
      for (const a of aprovacoesPor.get(k) || []) {
        if (a.orderId === r.orderId) continue
        const quandoA = ms(a.paidAt)
        if (quandoA <= quando || quandoA - quando > DIA_MS) continue
        const minutos = Math.round((quandoA - quando) / 60_000)
        // A primeira aprovação depois da falha é a que "recuperou" a venda.
        if (!recuperada || minutos < recuperada.minutos) {
          recuperada = { metodo: a.paymentMethod || 'unknown', minutos, valor: a.valor, orderId: a.orderId }
        }
      }
    }

    const evento = r.orderId ? porPedido.get(r.orderId) : undefined
    const userAgent = r.userAgent || evento?.userAgent

    const analise = analisarRecusa({
      etapa: r.etapa,
      status: r.status,
      statusDetail: r.statusDetail,
      tecnico,
      requisicao: r.requisicao,
      erro: r.erro,
      navegador: r.navegador,
      historico,
    })

    return {
      id: String(r._id ?? `${r.etapa}-${r.orderId ?? ''}-${quando}`),
      criadoEm: new Date(r.createdAt).toISOString(),
      etapa: r.etapa,
      etapaRotulo: ROTULO_DA_ETAPA[r.etapa],
      origem: r.origem,
      orderId: r.orderId,
      tipoDoPedido: r.tipoDoPedido,
      comprador: { nome: r.nome, email: r.email, userId: r.userId },
      produto: r.produto,
      valorBase: r.valorBase,
      valorCobrado: r.valorCobrado,
      status: r.status,
      statusDetail: r.statusDetail,
      tecnico: r.tecnico,
      requisicao: r.requisicao,
      erro: r.erro,
      navegador: r.navegador,
      ip: r.ip || evento?.ip,
      dispositivo: descreverDispositivo(userAgent),
      analise,
      historico,
      recuperada,
    }
  })

  const paraResumo: RecusaParaResumo[] = montados.map(m => ({
    etapa: m.etapa,
    analise: m.analise,
    tecnico: m.tecnico || tecnicoDoNavegador(m.navegador),
    requisicao: m.requisicao,
    valor: m.valorCobrado ?? m.navegador?.valor ?? 0,
    criadoEm: m.criadoEm,
    comprador: chavesDo(m.comprador.userId, m.comprador.email)[0] || m.id,
    recuperada: !!m.recuperada,
    dispositivo: m.dispositivo,
  }))

  const resumo = resumirRecusas(paraResumo)
  const tentativas = entrada.aprovadasNoPeriodo + entrada.recusadasNoPeriodo

  return {
    resumo,
    diagnostico: diagnosticoGeral(resumo, {
      aprovadas: entrada.aprovadasNoPeriodo,
      recusadasNoPeriodo: entrada.recusadasNoPeriodo,
    }),
    taxaDeRecusa: {
      tentativas,
      recusadas: entrada.recusadasNoPeriodo,
      aprovadas: entrada.aprovadasNoPeriodo,
      percentual: tentativas > 0 ? (entrada.recusadasNoPeriodo / tentativas) * 100 : null,
    },
    registros: montados.slice(0, entrada.limiteDaLista ?? 300),
  }
}
