/**
 * Resumo por IA — regras PURAS (sem banco, sem rede): configuração padrão,
 * tabela de preços com vigência, estimativa de custo, preço ao aluno, plano de
 * reembolso do adicional, cobertura da gravação e a linha do tempo da aula.
 * Tudo testável em `__tests__/monitorias/resumo-ia.test.ts`.
 */

import type { AdicionalResumo, ConfigResumo, FraseTranscrita, PrecoDeModelo, SegmentoDeAudio } from './tipos'

// ─── Configuração padrão ────────────────────────────────────────────────

/**
 * Preços oficiais (ai.google.dev/gemini-api/docs/pricing, conferidos em
 * 17/10/2026), em US$ por 1M de tokens, nível pago, camada Standard:
 *  - gemini-3.8-flash: preço introdutório até 31/12/2026 (0,75 entrada —
 *    áudio no mesmo valor — e 3,75 saída); a partir de 01/01/2027, 1,50 / 7,50.
 *  - gemini-2.5-flash (reserva): 0,30 texto, 1,00 áudio, 2,50 saída.
 * A saída inclui os tokens de raciocínio. O admin edita a tabela no painel.
 */
export const PRECOS_PADRAO: PrecoDeModelo[] = [
  { modelo: 'gemini-3.8-flash', desde: '2026-09-02', entradaTexto: 0.75, entradaAudio: 0.75, saida: 3.75 },
  { modelo: 'gemini-3.8-flash', desde: '2027-01-01', entradaTexto: 1.5, entradaAudio: 1.5, saida: 7.5 },
  { modelo: 'gemini-2.5-flash', desde: '2025-06-17', entradaTexto: 0.3, entradaAudio: 1.0, saida: 2.5 },
]

export const CONFIG_RESUMO_PADRAO: ConfigResumo = {
  vendaAtiva: false,
  nivelPagoConfirmado: false,
  modeloResumo: 'gemini-3.8-flash',
  modeloTranscricao: 'gemini-3.8-flash',
  precos: PRECOS_PADRAO,
  estimativa: {
    // A documentação de áudio do Gemini diz 32 tokens por segundo (a página
    // de preços cita 25): fica o maior, que nunca subestima.
    tokensPorSegundoAudio: 32,
    fracaoFalaMonitor: 0.6,
    fracaoFalaAluno: 0.25,
    // ~150 palavras por minuto de fala em português ≈ 220 tokens com as marcas de tempo.
    tokensTranscricaoPorMinutoDeFala: 220,
    tokensResumo: 9000,
    fatorRaciocinio: 0.5,
    tokensPromptPorSegmento: 1500,
    tokensPromptResumo: 3500,
  },
  margemSegurancaPct: 50,
  margemComercialPct: 100,
  lucroMinimoCentavos: 800,
  custosDiretosUsd: 0.02,
  precoMinimoCentavos: 490,
  precoMaximoCentavos: 2990,
  arredondar90: true,
  cambio: { fonte: 'ptax', acrescimoPct: 8, manualBrlPorUsd: 5.6 },
  limites: { duracaoMaxMin: 240, custoMaxPorAulaUsd: 1.5, orcamentoMensalUsd: 50, tentativasPorEtapa: 3 },
  retencaoTranscricaoDias: 7,
  foraDaComissaoDoSocio: false,
}

const MODELO = /^[a-z0-9][a-z0-9.\-]{2,63}$/
const DATA = /^\d{4}-\d{2}-\d{2}$/

function num(v: unknown, padrao: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : padrao
}

function inteiro(v: unknown, padrao: number, min: number, max: number): number {
  return Math.round(num(v, padrao, min, max))
}

function modelo(v: unknown, padrao: string): string {
  const m = typeof v === 'string' ? v.trim() : ''
  return MODELO.test(m) && !/^gemini-(1\.|2\.0-)/.test(m) ? m : padrao
}

/** Aceita qualquer coisa vinda do banco/painel e devolve uma config válida (campos ruins voltam ao padrão). */
export function normalizarConfigResumo(bruto: unknown): ConfigResumo {
  const b = (bruto && typeof bruto === 'object' ? bruto : {}) as Record<string, any>
  const p = CONFIG_RESUMO_PADRAO
  const precos = Array.isArray(b.precos)
    ? b.precos
        .map((x: any) => ({
          modelo: modelo(x?.modelo, ''),
          desde: typeof x?.desde === 'string' && DATA.test(x.desde) ? x.desde : '',
          entradaTexto: num(x?.entradaTexto, NaN, 0, 1000),
          entradaAudio: num(x?.entradaAudio, NaN, 0, 1000),
          saida: num(x?.saida, NaN, 0, 1000),
        }))
        .filter((x: PrecoDeModelo) => x.modelo && x.desde && [x.entradaTexto, x.entradaAudio, x.saida].every(Number.isFinite))
        .slice(0, 40)
    : []
  const e = b.estimativa || {}
  const minimo = inteiro(b.precoMinimoCentavos, p.precoMinimoCentavos, 100, 100_000)
  return {
    vendaAtiva: b.vendaAtiva === true,
    nivelPagoConfirmado: b.nivelPagoConfirmado === true,
    modeloResumo: modelo(b.modeloResumo, p.modeloResumo),
    modeloTranscricao: modelo(b.modeloTranscricao, p.modeloTranscricao),
    precos: precos.length ? precos : p.precos,
    estimativa: {
      tokensPorSegundoAudio: num(e.tokensPorSegundoAudio, p.estimativa.tokensPorSegundoAudio, 1, 200),
      fracaoFalaMonitor: num(e.fracaoFalaMonitor, p.estimativa.fracaoFalaMonitor, 0.05, 1),
      fracaoFalaAluno: num(e.fracaoFalaAluno, p.estimativa.fracaoFalaAluno, 0, 1),
      tokensTranscricaoPorMinutoDeFala: num(e.tokensTranscricaoPorMinutoDeFala, p.estimativa.tokensTranscricaoPorMinutoDeFala, 50, 2000),
      tokensResumo: inteiro(e.tokensResumo, p.estimativa.tokensResumo, 1000, 60_000),
      fatorRaciocinio: num(e.fatorRaciocinio, p.estimativa.fatorRaciocinio, 0, 5),
      tokensPromptPorSegmento: inteiro(e.tokensPromptPorSegmento, p.estimativa.tokensPromptPorSegmento, 0, 20_000),
      tokensPromptResumo: inteiro(e.tokensPromptResumo, p.estimativa.tokensPromptResumo, 0, 50_000),
    },
    margemSegurancaPct: num(b.margemSegurancaPct, p.margemSegurancaPct, 0, 500),
    margemComercialPct: num(b.margemComercialPct, p.margemComercialPct, 0, 1000),
    lucroMinimoCentavos: inteiro(b.lucroMinimoCentavos, p.lucroMinimoCentavos, 0, 100_000),
    custosDiretosUsd: num(b.custosDiretosUsd, p.custosDiretosUsd, 0, 10),
    precoMinimoCentavos: minimo,
    precoMaximoCentavos: Math.max(minimo, inteiro(b.precoMaximoCentavos, p.precoMaximoCentavos, 100, 100_000)),
    arredondar90: b.arredondar90 !== false,
    cambio: {
      fonte: b.cambio?.fonte === 'manual' ? 'manual' : 'ptax',
      acrescimoPct: num(b.cambio?.acrescimoPct, p.cambio.acrescimoPct, 0, 50),
      manualBrlPorUsd: num(b.cambio?.manualBrlPorUsd, p.cambio.manualBrlPorUsd, 1, 50),
    },
    limites: {
      duracaoMaxMin: inteiro(b.limites?.duracaoMaxMin, p.limites.duracaoMaxMin, 15, 570),
      custoMaxPorAulaUsd: num(b.limites?.custoMaxPorAulaUsd, p.limites.custoMaxPorAulaUsd, 0.05, 50),
      orcamentoMensalUsd: num(b.limites?.orcamentoMensalUsd, p.limites.orcamentoMensalUsd, 1, 100_000),
      tentativasPorEtapa: inteiro(b.limites?.tentativasPorEtapa, p.limites.tentativasPorEtapa, 1, 5),
    },
    retencaoTranscricaoDias: inteiro(b.retencaoTranscricaoDias, p.retencaoTranscricaoDias, 1, 30),
    foraDaComissaoDoSocio: b.foraDaComissaoDoSocio === true,
  }
}

/** A venda só liga com a confirmação do nível pago. */
export function vendaLiberada(config: ConfigResumo): boolean {
  return config.vendaAtiva && config.nivelPagoConfirmado
}

// ─── Preço ──────────────────────────────────────────────────────────────

/** "AAAA-MM-DD" do instante no horário de Brasília (a vigência é por dia). */
export function diaDaVigencia(data: Date): string {
  return new Date(data.getTime() - 3 * 3600_000).toISOString().slice(0, 10)
}

/** A linha da tabela vigente para o modelo no dia; null se o modelo não tem preço cadastrado. */
export function tabelaVigente(precos: PrecoDeModelo[], modeloUsado: string, data: Date): PrecoDeModelo | null {
  const dia = diaDaVigencia(data)
  const linhas = precos.filter((p) => p.modelo === modeloUsado && p.desde <= dia).sort((a, b) => (a.desde < b.desde ? 1 : -1))
  return linhas[0] || null
}

export interface EstimativaDeCusto {
  usd: number
  tokens: { audio: number; entradaTexto: number; saida: number }
  tabelaDesde: string
}

/**
 * Custo esperado de UMA aula (um resumo, dividido por quem comprou não: cada
 * comprador paga o preço cheio de uma aula individual). Áudio do monitor e —
 * só na individual — do aluno, pelas frações de fala; a transcrição; e o resumo.
 */
export function estimarCustoUsd(p: { duracaoMin: number; individual: boolean; config: ConfigResumo; data: Date }): EstimativaDeCusto | null {
  const { config } = p
  const e = config.estimativa
  const tTrans = tabelaVigente(config.precos, config.modeloTranscricao, p.data)
  const tRes = tabelaVigente(config.precos, config.modeloResumo, p.data)
  if (!tTrans || !tRes) return null
  const minutos = Math.max(1, p.duracaoMin)
  const falaMin = minutos * (e.fracaoFalaMonitor + (p.individual ? e.fracaoFalaAluno : 0))
  const audioTokens = falaMin * 60 * e.tokensPorSegundoAudio
  const segmentos = Math.ceil((minutos * e.fracaoFalaMonitor) / 10) + (p.individual ? Math.ceil((minutos * e.fracaoFalaAluno) / 10) : 0)
  const transcricaoSaida = falaMin * e.tokensTranscricaoPorMinutoDeFala
  const transcricaoEntradaTexto = segmentos * e.tokensPromptPorSegmento
  const resumoEntrada = transcricaoSaida + e.tokensPromptResumo
  const resumoSaida = e.tokensResumo
  const raciocinio = 1 + e.fatorRaciocinio
  const usd =
    (audioTokens * tTrans.entradaAudio + transcricaoEntradaTexto * tTrans.entradaTexto + transcricaoSaida * raciocinio * tTrans.saida) / 1e6 +
    (resumoEntrada * tRes.entradaTexto + resumoSaida * raciocinio * tRes.saida) / 1e6
  return {
    usd,
    tokens: {
      audio: Math.round(audioTokens),
      entradaTexto: Math.round(transcricaoEntradaTexto + resumoEntrada),
      saida: Math.round((transcricaoSaida + resumoSaida) * raciocinio),
    },
    tabelaDesde: tTrans.desde < tRes.desde ? tRes.desde : tTrans.desde,
  }
}

/** Arredonda para cima até o próximo ",90" (R$ 4,12 → 4,90; 4,90 → 4,90; 4,91 → 5,90). */
export function arredondarPara90(centavos: number): number {
  const reais = Math.floor(centavos / 100)
  const alvo = reais * 100 + 90
  return centavos <= alvo ? alvo : alvo + 100
}

export interface PrecoCalculado {
  precoCentavos: number
  custoUsd: number
  custoComMargemUsd: number
  brlPorUsdEfetivo: number
  tabelaDesde: string
  limitado: 'minimo' | 'maximo' | null
  /** Custo esperado (estimativa + custos diretos), em centavos. */
  custoCentavos: number
  /** Custo com a margem de segurança, em centavos: o pior caso que o preço cobre. */
  custoSeguroCentavos: number
  /** Preço − custo esperado: o que a plataforma deve ganhar nesta venda. */
  lucroCentavos: number
  /** Preço − custo com a margem: o lucro mesmo que a aula gaste o que a margem prevê. */
  lucroMinimoGarantidoCentavos: number
  /** Qual caminho formou o preço: lucro fixo ou margem comercial. */
  regra: 'lucro' | 'margem'
}

/** Câmbio que o Google Cloud de fato cobra: a cotação + IOF/spread do cartão. */
export function cambioEfetivo(brlPorUsd: number, config: ConfigResumo): number {
  return brlPorUsd * (1 + config.cambio.acrescimoPct / 100)
}

/** US$ em centavos de real pelo câmbio efetivo (já com IOF/spread). */
export function centavosDeUsd(usd: number, brlPorUsdEfetivo: number): number {
  return Math.round(usd * brlPorUsdEfetivo * 100)
}

/** Lucro de um período: vendas − reembolsos − gasto com o Gemini (em reais). */
export function lucroDoPeriodo(p: { vendasCentavos: number; reembolsosCentavos: number; gastoUsd: number; brlPorUsdEfetivo: number }): number {
  return p.vendasCentavos - p.reembolsosCentavos - centavosDeUsd(p.gastoUsd, p.brlPorUsdEfetivo)
}

/**
 * Preço ao aluno. (custo estimado + custos diretos) × margem de segurança, em
 * reais pelo câmbio com acréscimo (IOF/spread), é o custo seguro. O preço é o
 * MAIOR entre:
 *  - custo seguro + lucro fixo por resumo (`lucroMinimoCentavos`);
 *  - custo seguro × margem comercial.
 * Depois vêm o arredondamento para ",90", o mínimo e o máximo. Assim a
 * plataforma ganha o lucro fixo em toda venda e, quando o custo cresce, a
 * margem acompanha. A tabela usada é a vigente NA DATA DA AULA (é quando o
 * custo acontece). null = não dá para vender (modelo sem preço cadastrado).
 */
export function precoDoResumo(p: { duracaoMin: number; individual: boolean; config: ConfigResumo; brlPorUsd: number; dataDaAula: Date }): PrecoCalculado | null {
  const est = estimarCustoUsd({ duracaoMin: p.duracaoMin, individual: p.individual, config: p.config, data: p.dataDaAula })
  if (!est || !(p.brlPorUsd > 0)) return null
  const c = p.config
  const custoComMargemUsd = (est.usd + c.custosDiretosUsd) * (1 + c.margemSegurancaPct / 100)
  const brlPorUsdEfetivo = cambioEfetivo(p.brlPorUsd, c)
  const custoSeguro = custoComMargemUsd * brlPorUsdEfetivo * 100
  const porMargem = custoSeguro * (1 + c.margemComercialPct / 100)
  const porLucro = custoSeguro + c.lucroMinimoCentavos
  const regra: PrecoCalculado['regra'] = porLucro >= porMargem ? 'lucro' : 'margem'
  const bruto = Math.ceil(Math.max(porMargem, porLucro))
  let preco = c.arredondar90 ? arredondarPara90(bruto) : bruto
  let limitado: PrecoCalculado['limitado'] = null
  if (preco < c.precoMinimoCentavos) {
    preco = c.precoMinimoCentavos
    limitado = 'minimo'
  }
  if (preco > c.precoMaximoCentavos) {
    preco = c.precoMaximoCentavos
    limitado = 'maximo'
  }
  const custoCentavos = centavosDeUsd(est.usd + c.custosDiretosUsd, brlPorUsdEfetivo)
  const custoSeguroCentavos = Math.ceil(custoSeguro)
  return {
    precoCentavos: preco,
    custoUsd: est.usd,
    custoComMargemUsd,
    brlPorUsdEfetivo,
    tabelaDesde: est.tabelaDesde,
    limitado,
    custoCentavos,
    custoSeguroCentavos,
    lucroCentavos: preco - custoCentavos,
    lucroMinimoGarantidoCentavos: preco - custoSeguroCentavos,
    regra,
  }
}

/** Custo real de uma chamada, pelo `usage` da resposta e a tabela do dia. */
export function custoDaChamadaUsd(t: PrecoDeModelo, uso: { entradaTexto: number; entradaAudio: number; saida: number; raciocinio: number }): number {
  return (uso.entradaTexto * t.entradaTexto + uso.entradaAudio * t.entradaAudio + (uso.saida + uso.raciocinio) * t.saida) / 1e6
}

/** Parte da taxa do PIX que cabe ao adicional: proporcional à base (aula + material + resumo). */
export function taxaProporcional(taxaTotalCentavos: number, parteCentavos: number, baseCentavos: number): number {
  if (taxaTotalCentavos <= 0 || parteCentavos <= 0 || baseCentavos <= 0) return 0
  return Math.min(taxaTotalCentavos, Math.round((taxaTotalCentavos * parteCentavos) / baseCentavos))
}

// ─── Aceite do adicional ────────────────────────────────────────────────

/**
 * Aditivo do Resumo por IA. Versão própria: mudar este texto NÃO obriga
 * ninguém a aceitar de novo os termos gerais das monitorias.
 */
export const VERSAO_ADITIVO_RESUMO = '2026.10-r1'

/** O texto exato mostrado no checkout (o hash do aceite é calculado sobre ele). */
export function textoAditivoResumo(retencaoDias: number): string {
  return [
    'Resumo Inteligente por IA (adicional opcional, pago uma vez, valor fixo informado antes do pagamento).',
    'Durante a aula, a voz do monitor — e, na aula individual, também a sua — é gravada no próprio navegador e enviada para transcrição pelo Google (Gemini API), operador contratado pela DomineAqui. Em aula em grupo, só a voz do monitor é transcrita. O vídeo nunca é gravado.',
    `O áudio é apagado no Google logo após a transcrição (no máximo em 48 horas). A transcrição em texto fica guardada por até ${retencaoDias} dia(s), só para gerar o resumo, e não é mostrada a ninguém. O resumo fica disponível para você enquanto a reserva existir.`,
    'O monitor precisa autorizar a gravação da voz dele. Se ele não autorizar, se não houver áudio suficiente (menos de 30% da aula) ou se a geração falhar depois das novas tentativas, o valor do adicional (com a parte correspondente da taxa do PIX) é devolvido.',
    'Se a monitoria for reembolsada por inteiro antes da entrega do resumo, o adicional volta junto. Depois de entregue, o resumo é um serviço prestado e não é devolvido automaticamente por um reembolso posterior da aula — vale a política de cancelamento e a lei.',
    'O resumo é gerado por IA a partir da transcrição e pode conter erros: confira condutas e doses em fontes oficiais. O monitor não recebe parte deste valor.',
  ].join('\n')
}

// ─── Reembolso do adicional junto com o do assento ──────────────────────

/**
 * O que o reembolso INTEGRAL do assento faz com o adicional:
 *  - `incluir`: ainda não entregue → vai junto (o MP devolve tudo o que resta)
 *    e o adicional vira "reembolsado".
 *  - `excluir`: já entregue (serviço prestado), ou com reembolso próprio em
 *    andamento/feito → o valor do adicional e a parte dele na taxa ficam fora
 *    da devolução, que passa a ter valor explícito.
 * Reembolso parcial nunca mexe no adicional.
 */
export function planoDoAdicionalNoReembolso(adicional: Pick<AdicionalResumo, 'status' | 'teste'> | null, total: boolean): 'sem_adicional' | 'incluir' | 'excluir' {
  if (!adicional || adicional.teste || !total) return 'sem_adicional'
  return adicional.status === 'pago' ? 'incluir' : 'excluir'
}

/**
 * Valor a pedir ao Mercado Pago no reembolso integral que EXCLUI o adicional:
 * o que foi pago, menos o que já voltou em reembolsos parciais da aula, menos
 * o adicional e a parte dele na taxa (que ficam com a plataforma, ou já
 * voltaram pelo reembolso próprio do adicional).
 */
export function valorSemOAdicional(p: { pagoCentavos: number; jaDevolvidoAulaCentavos: number; adicionalCentavos: number }): number {
  return Math.max(0, p.pagoCentavos - p.jaDevolvidoAulaCentavos - p.adicionalCentavos)
}

// ─── Cobertura e linha do tempo ─────────────────────────────────────────

/** Converte um instante do áudio (ms, sem as pausas) para ms reais desde o começo do trecho. */
export function tempoReal(marcas: Array<[number, number]>, audioMs: number): number {
  let base: [number, number] = [0, 0]
  for (const m of marcas) {
    if (m[0] <= audioMs) base = m
    else break
  }
  return base[1] + (audioMs - base[0])
}

/**
 * Quanto da aula ficou gravado: a união dos intervalos reais dos trechos de
 * TODAS as vozes, recortada ao horário da aula. É o critério dos 30%.
 */
export function coberturaDaAula(segmentos: Array<Pick<SegmentoDeAudio, 'inicio' | 'duracaoRealMs' | 'status'>>, inicio: Date, fim: Date): { aulaMs: number; gravadoMs: number; pct: number } {
  const ini = inicio.getTime()
  const fimMs = fim.getTime()
  const aulaMs = Math.max(1, fimMs - ini)
  const intervalos = segmentos
    .filter((s) => s.status === 'transcrito')
    .map((s) => [Math.max(ini, s.inicio.getTime()), Math.min(fimMs, s.inicio.getTime() + s.duracaoRealMs)] as [number, number])
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0])
  let gravadoMs = 0
  let atual: [number, number] | null = null
  for (const it of intervalos) {
    if (!atual || it[0] > atual[1]) {
      if (atual) gravadoMs += atual[1] - atual[0]
      atual = [it[0], it[1]]
    } else atual[1] = Math.max(atual[1], it[1])
  }
  if (atual) gravadoMs += atual[1] - atual[0]
  return { aulaMs, gravadoMs, pct: Math.round((gravadoMs / aulaMs) * 1000) / 10 }
}

export const COBERTURA_MINIMA_PCT = 30

/**
 * Nenhum trecho ficou transcrito: por quê. `aluno` vai na devolução (aviso ao
 * comprador, sem jargão); `detalhe` fica na tarefa para o admin, com o erro
 * real do trecho mais recente (o do Gemini, o da conferência no Google ou o
 * do envio do navegador).
 */
export function motivoSemTranscricao(segs: Array<Pick<SegmentoDeAudio, 'status' | 'erro' | 'erroDireto' | 'updatedAt'>>): { aluno: string; detalhe: string } {
  if (!segs.length) return { aluno: 'Não houve áudio da aula para transcrever', detalhe: 'Não houve áudio da aula para transcrever' }
  const aluno = 'Não foi possível transcrever o áudio da aula'
  const maisRecente = (lista: typeof segs) => [...lista].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
  const falharam = segs.filter((s) => s.status === 'falhou')
  if (falharam.length) {
    const ultimo = maisRecente(falharam)
    return { aluno, detalhe: `Nenhum trecho foi transcrito (${falharam.length} de ${segs.length} falharam): ${ultimo.erro || 'erro sem detalhe'}` }
  }
  const presos = segs.filter((s) => s.status === 'enviando')
  if (presos.length) {
    const ultimo = maisRecente(presos)
    const motivo = ultimo.erro || (ultimo.erroDireto ? `envio direto: ${ultimo.erroDireto}` : '')
    return { aluno, detalhe: `O áudio não chegou ao Google: ${presos.length} trecho(s) presos no envio do navegador${motivo ? ` (${motivo})` : ''}` }
  }
  return { aluno, detalhe: `Nenhum trecho foi transcrito (${segs.length} trecho(s) recebidos)` }
}

export interface LinhaDaAula {
  /** ms desde o início da aula. */
  t: number
  papel: 'monitor' | 'aluno'
  nome: string
  texto: string
  incerto: boolean
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`
}

/**
 * Junta as frases de todas as vozes numa linha do tempo única, no minuto real
 * da aula. A fala é atribuída pelo trecho de onde veio (cada navegador grava só
 * o próprio microfone) — nunca por adivinhação do modelo.
 */
export function linhaDoTempo(
  segmentos: Array<Pick<SegmentoDeAudio, 'inicio' | 'marcas' | 'papel' | 'nome' | 'frases' | 'status'>>,
  inicioDaAula: Date,
): LinhaDaAula[] {
  const linhas: LinhaDaAula[] = []
  for (const s of segmentos) {
    if (s.status !== 'transcrito' || !s.frases) continue
    const base = s.inicio.getTime() - inicioDaAula.getTime()
    for (const f of s.frases as FraseTranscrita[]) {
      const texto = String(f.texto || '').trim()
      if (!texto) continue
      linhas.push({ t: base + tempoReal(s.marcas, f.t), papel: s.papel, nome: s.nome, texto, incerto: !!f.incerto })
    }
  }
  return linhas.sort((a, b) => a.t - b.t)
}

/** Intervalos sem gravação maiores que `minMs` dentro da aula (viram "lacunas" no prompt e no resumo). */
export function lacunasDaAula(segmentos: Array<Pick<SegmentoDeAudio, 'inicio' | 'duracaoRealMs' | 'status'>>, inicio: Date, fim: Date, minMs = 5 * 60_000): Array<[number, number]> {
  const ini = inicio.getTime()
  const intervalos = segmentos
    .filter((s) => s.status === 'transcrito')
    .map((s) => [s.inicio.getTime() - ini, s.inicio.getTime() - ini + s.duracaoRealMs] as [number, number])
    .sort((a, b) => a[0] - b[0])
  const buracos: Array<[number, number]> = []
  let cursor = 0
  for (const [a, b] of intervalos) {
    if (a - cursor >= minMs) buracos.push([cursor, a])
    cursor = Math.max(cursor, b)
  }
  const total = fim.getTime() - ini
  if (total - cursor >= minMs) buracos.push([cursor, total])
  return buracos
}

/** Texto da transcrição para o prompt: "[mm:ss] MONITOR (Carla): …" e as lacunas marcadas. */
export function transcricaoParaPrompt(linhas: LinhaDaAula[], lacunas: Array<[number, number]> = []): string {
  const eventos: Array<{ t: number; texto: string }> = [
    ...linhas.map((l) => ({ t: l.t, texto: `[${mmss(l.t)}] ${l.papel === 'monitor' ? 'MONITOR' : 'ALUNO'} (${l.nome}): ${l.texto}${l.incerto ? ' [trecho incerto]' : ''}` })),
    ...lacunas.map(([a, b]) => ({ t: a, texto: `[${mmss(a)}–${mmss(b)}] [LACUNA: sem áudio gravado neste intervalo]` })),
  ]
  return eventos
    .sort((a, b) => a.t - b.t)
    .map((e) => e.texto)
    .join('\n')
}

/** Tokens de um texto em português (estimativa conservadora: ~3,5 caracteres por token). */
export function tokensDoTexto(texto: string): number {
  return Math.ceil(texto.length / 3.5)
}

/**
 * Divide uma transcrição longa em janelas de ~`janelaMin` minutos com
 * sobreposição, para o map-reduce. Curta (abaixo do limite) = uma janela só.
 */
export function janelasDaTranscricao(linhas: LinhaDaAula[], p: { limiteTokens: number; janelaMin: number; sobreposicaoMin: number }): LinhaDaAula[][] {
  const texto = transcricaoParaPrompt(linhas)
  if (tokensDoTexto(texto) <= p.limiteTokens || linhas.length === 0) return [linhas]
  const janela = p.janelaMin * 60_000
  const sobre = p.sobreposicaoMin * 60_000
  const fim = linhas[linhas.length - 1].t
  const janelas: LinhaDaAula[][] = []
  for (let ini = 0; ini <= fim; ini += janela) {
    const pedaco = linhas.filter((l) => l.t >= ini - sobre && l.t < ini + janela)
    if (pedaco.length) janelas.push(pedaco)
  }
  return janelas
}

/**
 * Quem tem a voz transcrita: o monitor sempre; o aluno só na aula individual
 * (uma vaga) e se ele comprou. No grupo, só o monitor.
 */
export function vozTranscrita(p: { papel: 'monitor' | 'aluno'; individual: boolean; comprou: boolean }): boolean {
  if (p.papel === 'monitor') return true
  return p.individual && p.comprou
}

/** Bytes máximos de um trecho: 10 min de fala a 24 kb/s ≈ 1,8 MB; folga para o contêiner. */
export const BYTES_MAX_SEGMENTO = 4 * 1024 * 1024
/** Fala máxima por trecho (o gravador corta antes). */
export const AUDIO_MAX_SEGMENTO_MS = 10 * 60_000 + 30_000
