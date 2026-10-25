'use client'

/**
 * Aba "Recusas de cartão" do DomineAqui Analytics: o log de toda falha de cartão
 * (recusa do banco ou do antifraude, erro da API, erro do formulário) com a
 * análise do motivo e os dados técnicos de cada tentativa.
 *
 * Autossuficiente, como o painel de Serial Keys: busca os próprios dados de
 * /api/admin/analytics/recusas-cartao — só quando a aba é aberta.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Copy, Loader2, RefreshCw, Search, ShieldAlert, TrendingDown, Wrench, XCircle } from 'lucide-react'
import type { PainelDeRecusas, RegistroDoPainel } from '@/lib/payments/recusa-cartao-painel'
import { ROTULO_DO_RESPONSAVEL, type LinhaDoResumo } from '@/lib/payments/recusa-cartao'

type Dados = PainelDeRecusas & { dias: number; atualizadoEm: string }

const brl = (v: number) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (v: number) => `${v.toFixed(1).replace('.', ',')}%`
const quando = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

const PERIODOS: Array<[number, string]> = [[7, '7 dias'], [30, '30 dias'], [90, '90 dias'], [365, '12 meses']]

const RESPONSAVEIS: Array<[string, string]> = [
  ['', 'Todos os responsáveis'],
  ['banco', 'Banco emissor'],
  ['antifraude', 'Antifraude do Mercado Pago'],
  ['dados', 'Dados digitados'],
  ['limite', 'Limite ou parcelas'],
  ['integracao', 'Nossa integração'],
  ['rede', 'Rede ou processamento'],
  ['desconhecido', 'Não identificado'],
]

const COR_DO_RESPONSAVEL: Record<string, string> = {
  banco: 'border-sky-300/25 bg-sky-400/10 text-sky-100',
  antifraude: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
  dados: 'border-slate-300/25 bg-slate-400/10 text-slate-100',
  limite: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  integracao: 'border-violet-300/30 bg-violet-400/15 text-violet-100',
  rede: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
  desconhecido: 'border-white/15 bg-white/5 text-white/70',
}

const COR_DO_SINAL: Record<string, string> = {
  info: 'border-white/10 bg-white/[0.04] text-white/70',
  atencao: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  alerta: 'border-rose-300/30 bg-rose-400/10 text-rose-100',
}

const METODO: Record<string, string> = { pix: 'Pix', credit_card: 'cartão de crédito', debit_card: 'cartão de débito', boleto: 'boleto', unknown: 'outro meio' }

function Selo({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${className}`}>{children}</span>
}

function Cartao({ titulo, valor, dica, tom = 'emerald', icone: Icone }: { titulo: string; valor: string; dica?: string; tom?: 'emerald' | 'red' | 'amber' | 'blue'; icone: any }) {
  const tons = { emerald: 'text-emerald-300', red: 'text-rose-300', amber: 'text-amber-300', blue: 'text-sky-300' }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-white/45">{titulo}</span>
        <Icone size={16} className={tons[tom]} />
      </div>
      <div className="text-2xl font-black text-white">{valor}</div>
      {dica ? <div className="mt-1 text-xs text-white/40">{dica}</div> : null}
    </div>
  )
}

function TabelaResumo({ titulo, linhas, comResponsavel = false }: { titulo: string; linhas: LinhaDoResumo[]; comResponsavel?: boolean }) {
  const max = Math.max(...linhas.map(l => l.qtd), 1)
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="mb-3 text-sm font-bold text-white">{titulo}</h3>
      {linhas.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/40">Sem dados no período.</p>
      ) : (
        <div className="space-y-2.5">
          {linhas.slice(0, 12).map(l => (
            <div key={l.chave}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-white/80">
                  {l.rotulo}
                  {comResponsavel && l.responsavel ? <span className="ml-2 text-white/35">· {ROTULO_DO_RESPONSAVEL[l.responsavel]}</span> : null}
                </span>
                <span className="shrink-0 font-bold text-white">
                  {l.qtd} <span className="font-normal text-white/40">({pct(l.participacao)})</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-rose-500/80 to-amber-300/80" style={{ width: `${(l.qtd / max) * 100}%` }} />
              </div>
              {l.valor > 0 || l.recuperadas > 0 ? (
                <div className="mt-0.5 text-[11px] text-white/35">
                  {brl(l.valor)}
                  {l.recuperadas > 0 ? ` · ${l.recuperadas} recuperada${l.recuperadas > 1 ? 's' : ''}` : ''}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Par({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  if (valor === undefined || valor === null || valor === '') return null
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-1 text-xs">
      <span className="shrink-0 text-white/40">{rotulo}</span>
      <span className="min-w-0 break-all text-right font-mono text-white/80">{valor}</span>
    </div>
  )
}

const sim = (v?: boolean) => (v === undefined ? undefined : v ? 'sim' : 'não')

function Detalhe({ r }: { r: RegistroDoPainel }) {
  const t = r.tecnico
  const q = r.requisicao
  const n = r.navegador
  const a = r.analise
  const copiar = (texto?: string) => {
    if (texto) void navigator.clipboard?.writeText(texto).catch(() => {})
  }
  return (
    <div className="grid gap-5 border-t border-white/10 bg-black/20 p-4 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-300/80">Análise</h4>
          <p className="text-sm leading-relaxed text-white/85">{a.diagnostico}</p>
        </div>
        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-white/45">Causas prováveis</h4>
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-white/70">
            {a.causas.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
        {a.sinais.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-white/45">Sinais desta tentativa</h4>
            <div className="space-y-1.5">
              {a.sinais.map(s => (
                <div key={s.texto} className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${COR_DO_SINAL[s.nivel]}`}>{s.texto}</div>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/45">O que dizer ao comprador</h4>
            <p className="text-xs leading-relaxed text-white/75">{a.acaoComprador}</p>
          </div>
          <div className={`rounded-lg border p-3 ${a.nosso ? 'border-violet-300/30 bg-violet-400/10' : 'border-white/10 bg-white/[0.03]'}`}>
            <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/45">O que a equipe deve fazer</h4>
            <p className="text-xs leading-relaxed text-white/75">{a.acaoEquipe}</p>
          </div>
        </div>
        {r.historico.tentativasAnteriores24h > 0 && (
          <p className="text-xs text-white/50">
            Histórico do comprador: {r.historico.tentativasAnteriores24h} tentativa(s) com cartão nas 24 h anteriores, {r.historico.recusasAnteriores24h} recusada(s).
          </p>
        )}
        {r.recuperada ? (
          <p className="flex items-center gap-1.5 text-xs text-emerald-300">
            <CheckCircle2 size={14} /> Recuperada: o comprador pagou {brl(r.recuperada.valor)} por {METODO[r.recuperada.metodo] || r.recuperada.metodo} {r.recuperada.minutos} min depois.
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-rose-300">
            <XCircle size={14} /> Sem pagamento aprovado do mesmo comprador nas 24 h seguintes.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-300/80">Dados técnicos</h4>
          <div>
            <Par rotulo="Etapa" valor={r.etapaRotulo} />
            <Par rotulo="Origem do registro" valor={r.origem === 'navegador' ? 'navegador do comprador (indício)' : 'servidor'} />
            <Par rotulo="Código" valor={a.codigo} />
            <Par rotulo="Status" valor={r.status || t?.status} />
            <Par rotulo="status_detail" valor={r.statusDetail || t?.statusDetail} />
            <Par rotulo="Pedido" valor={r.orderId ? <button type="button" onClick={() => copiar(r.orderId)} className="inline-flex items-center gap-1 hover:text-white">{r.orderId}<Copy size={11} /></button> : undefined} />
            <Par rotulo="Pagamento (MP)" valor={t?.paymentId} />
            <Par rotulo="Bandeira (payment_method_id)" valor={t?.paymentMethodId || q?.paymentMethodId || n?.bandeira} />
            <Par rotulo="Tipo" valor={t?.paymentTypeId} />
            <Par rotulo="Emissor (issuer_id)" valor={t?.emissorId || q?.emissorEnviado || undefined} />
            <Par rotulo="BIN (6 primeiros)" valor={t?.bin || n?.bin} />
            <Par rotulo="Final do cartão" valor={t?.ultimos4 || n?.ultimos4} />
            <Par rotulo="Parcelas" valor={t?.parcelas ?? q?.parcelas ?? n?.parcelas} />
            <Par rotulo="Valor da transação" valor={t?.valorTransacao != null ? brl(t.valorTransacao) : undefined} />
            <Par rotulo="Total pago (c/ juros)" valor={t?.valorTotalPago ? brl(t.valorTotalPago) : undefined} />
            <Par rotulo="Valor base / cobrado" valor={r.valorCobrado != null ? `${r.valorBase != null ? brl(r.valorBase) : '—'} / ${brl(r.valorCobrado)}` : undefined} />
            <Par rotulo="Capturado" valor={sim(t?.capturado)} />
            <Par rotulo="Modo real (live)" valor={sim(t?.modoReal)} />
            <Par rotulo="Modo binário" valor={sim(t?.modoBinario)} />
            <Par rotulo="Código de autorização" valor={t?.codigoDeAutorizacao} />
            <Par rotulo="Processamento" valor={t?.processamento} />
            <Par rotulo="Documento do pagador" valor={t?.documentoDoPagadorTipo} />
            <Par rotulo="Criado no MP" valor={t?.criadoEm ? quando(t.criadoEm) : undefined} />
          </div>
        </div>

        {q && (
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-white/45">O que enviamos ao Mercado Pago</h4>
            <Par rotulo="Valor enviado" valor={brl(q.valorEnviado)} />
            <Par rotulo="Parcelas enviadas" valor={q.parcelas} />
            <Par rotulo="issuer_id enviado" valor={q.emissorEnviado || 'não enviado'} />
            <Par rotulo="Device ID" valor={q.deviceIdPresente ? `enviado (${q.deviceIdTamanho} caracteres)` : 'NÃO enviado'} />
            <Par rotulo="Cartão de outra pessoa" valor={sim(q.titularDiferenteDoComprador)} />
            <Par rotulo="Documento enviado" valor={q.documentoTipo || undefined} />
            <Par rotulo="Split de marketplace" valor={sim(q.splitAtivo)} />
            <Par rotulo="Token do marketplace" valor={sim(q.tokenDoMarketplace)} />
            <Par rotulo="Ambiente" valor={q.ambiente === 'producao' ? 'produção' : 'sandbox (teste)'} />
            <Par rotulo="Tempo limite" valor={`${q.timeoutMs / 1000} s por tentativa`} />
            <Par rotulo="Chave de idempotência" valor={q.idempotencyKey} />
          </div>
        )}

        {r.erro && (
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-white/45">Erro da API</h4>
            <Par rotulo="HTTP" valor={r.erro.status} />
            <Par rotulo="Tipo" valor={r.erro.codigo} />
            <Par rotulo="Mensagem" valor={r.erro.mensagem} />
            {r.erro.causas.map((c, i) => (
              <Par key={i} rotulo={`Causa ${c.codigo || i + 1}`} valor={c.descricao} />
            ))}
          </div>
        )}

        {n && (
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-white/45">O que o navegador viu</h4>
            <Par rotulo="Formulário" valor={n.origemDoFormulario} />
            <Par rotulo="Códigos" valor={n.codigos?.join(', ')} />
            <Par rotulo="Mensagem" valor={n.mensagem} />
            <Par rotulo="HTTP" valor={n.httpStatus} />
            <Par rotulo="Código do servidor" valor={n.codigoDoServidor} />
            <Par rotulo="Device ID presente" valor={sim(n.deviceIdPresente)} />
            <Par rotulo="Cartão de outra pessoa" valor={sim(n.titularDiferente)} />
            <Par rotulo="Rota" valor={n.endpoint} />
          </div>
        )}

        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-white/45">Contexto</h4>
          <Par rotulo="Dispositivo" valor={r.dispositivo} />
          <Par rotulo="IP" valor={r.ip} />
          <Par rotulo="Comprador (id)" valor={r.comprador.userId} />
          <Par rotulo="Tipo do pedido" valor={r.tipoDoPedido} />
        </div>

        <details className="rounded-lg border border-white/10 bg-black/30">
          <summary className="cursor-pointer px-3 py-2 text-xs text-white/50 hover:text-white/80">Ver registro bruto (JSON)</summary>
          <pre className="max-h-72 overflow-auto px-3 pb-3 text-[11px] leading-relaxed text-white/60">{JSON.stringify(r, null, 2)}</pre>
        </details>
      </div>
    </div>
  )
}

export function RecusasCartaoPanel() {
  const [dias, setDias] = useState(30)
  const [dados, setDados] = useState<Dados | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const res = await fetch(`/api/admin/analytics/recusas-cartao?dias=${dias}`, { cache: 'no-store' })
      const corpo = await res.json()
      if (!res.ok) throw new Error(corpo.error || 'Erro ao carregar as recusas')
      setDados(corpo)
    } catch (e: any) {
      setErro(e?.message || 'Erro ao carregar as recusas')
    } finally {
      setCarregando(false)
    }
  }, [dias])

  useEffect(() => {
    void carregar()
  }, [carregar])

  if (carregando && !dados) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-white/60">
        <Loader2 className="h-5 w-5 animate-spin" /> Carregando o log de recusas…
      </div>
    )
  }
  if (erro && !dados) {
    return (
      <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-5">
        <p className="font-bold text-white">Não foi possível carregar as recusas</p>
        <p className="mt-1 text-sm text-white/60">{erro}</p>
        <button type="button" onClick={carregar} className="mt-3 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/15">Tentar de novo</button>
      </div>
    )
  }
  if (!dados) return null

  return <RecusasCartaoView dados={dados} carregando={carregando} dias={dias} onDias={setDias} onAtualizar={carregar} />
}

/** A tela em si: só recebe os dados. Exportada para poder ser renderizada em teste. */
export function RecusasCartaoView({
  dados,
  carregando,
  dias,
  onDias,
  onAtualizar,
  abertoInicial = null,
}: {
  dados: Dados
  carregando: boolean
  dias: number
  onDias: (dias: number) => void
  onAtualizar: () => void
  abertoInicial?: string | null
}) {
  const [busca, setBusca] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [soNossas, setSoNossas] = useState(false)
  const [aberto, setAberto] = useState<string | null>(abertoInicial)

  const registros = useMemo(() => {
    if (!dados) return []
    const q = busca.trim().toLowerCase()
    return dados.registros.filter(r => {
      if (responsavel && r.analise.responsavel !== responsavel) return false
      if (soNossas && !r.analise.nosso) return false
      if (!q) return true
      const palheiro = [r.comprador.nome, r.comprador.email, r.produto, r.orderId, r.analise.rotulo, r.analise.codigo, r.tecnico?.bin, r.tecnico?.ultimos4, r.tecnico?.paymentId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return palheiro.includes(q)
    })
  }, [dados, busca, responsavel, soNossas])

  const { resumo, taxaDeRecusa } = dados

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Recusas de cartão</h2>
          <p className="text-xs text-white/45">
            Toda falha de cartão — do banco, do antifraude, da API ou do formulário — com a análise do motivo. Atualizado em {quando(dados.atualizadoEm)}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={dias} onChange={e => onDias(Number(e.target.value))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none">
            {PERIODOS.map(([v, l]) => <option key={v} value={v} className="bg-slate-900">{l}</option>)}
          </select>
          <button type="button" onClick={onAtualizar} disabled={carregando} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50">
            <RefreshCw size={14} className={carregando ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-300/20 bg-amber-400/[0.07] p-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-100">
          <ShieldAlert size={16} /> Diagnóstico do período
        </h3>
        <ul className="space-y-1.5 text-sm leading-relaxed text-white/80">
          {dados.diagnostico.map(f => <li key={f}>• {f}</li>)}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Cartao titulo="Falhas registradas" valor={String(resumo.total)} dica={`${resumo.compradores} comprador${resumo.compradores === 1 ? '' : 'es'}`} tom="red" icone={XCircle} />
        <Cartao
          titulo="Taxa de recusa"
          valor={taxaDeRecusa.percentual == null ? '—' : pct(taxaDeRecusa.percentual)}
          dica={`${taxaDeRecusa.recusadas} recusados de ${taxaDeRecusa.tentativas} pagamentos com cartão`}
          tom="amber"
          icone={TrendingDown}
        />
        <Cartao titulo="Recuperadas" valor={`${resumo.recuperadas} de ${resumo.total}`} dica={`${brl(resumo.valorRecuperado)} pagos depois`} icone={CheckCircle2} />
        <Cartao titulo="Venda que não entrou" valor={brl(resumo.valorPerdido)} dica="falhas sem pagamento depois" tom="red" icone={AlertTriangle} />
        <Cartao titulo="Indício de causa nossa" valor={String(resumo.nossas)} dica="integração, parcelas, credencial" tom="blue" icone={Wrench} />
        <Cartao titulo="Sem device ID" valor={String(resumo.semDeviceId)} dica="antifraude do MP penaliza" tom="amber" icone={ShieldAlert} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <TabelaResumo titulo="Por motivo" linhas={resumo.porMotivo} comResponsavel />
        <TabelaResumo titulo="Por responsável pela decisão" linhas={resumo.porResponsavel} />
        <TabelaResumo titulo="Por bandeira" linhas={resumo.porBandeira} />
        <TabelaResumo titulo="Por emissor (issuer_id)" linhas={resumo.porEmissor} />
        <TabelaResumo titulo="Por BIN (6 primeiros dígitos)" linhas={resumo.porBin} />
        <TabelaResumo titulo="Por parcelas" linhas={resumo.porParcelas} />
        <TabelaResumo titulo="Por horário (Brasília)" linhas={resumo.porHorario} />
        <TabelaResumo titulo="Por dispositivo" linhas={resumo.porDispositivo} />
        <TabelaResumo titulo="Por etapa em que falhou" linhas={resumo.porEtapa} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs text-white/45">Buscar (nome, e-mail, produto, pedido, motivo, BIN)</label>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3">
              <Search size={14} className="text-white/40" />
              <input value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-transparent py-2 text-sm text-white outline-none" placeholder="Digite para filtrar…" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/45">Responsável</label>
            <select value={responsavel} onChange={e => setResponsavel(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none">
              {RESPONSAVEIS.map(([v, l]) => <option key={v} value={v} className="bg-slate-900">{l}</option>)}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-white/70">
            <input type="checkbox" checked={soNossas} onChange={e => setSoNossas(e.target.checked)} /> Só com indício de causa nossa
          </label>
        </div>

        <p className="text-xs text-white/40">
          {registros.length} de {dados.registros.length} registros mostrados{dados.registros.length < resumo.total ? ` (a lista traz os ${dados.registros.length} mais recentes; os totais acima cobrem os ${resumo.total})` : ''}.
        </p>

        {registros.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.04] py-10 text-center text-sm text-white/45">Nenhuma falha de cartão com esses filtros.</p>
        ) : (
          <div className="space-y-2">
            {registros.map(r => {
              const expandido = aberto === r.id
              const bin = r.tecnico?.bin || r.navegador?.bin
              const final = r.tecnico?.ultimos4 || r.navegador?.ultimos4
              return (
                <div key={r.id} className={`overflow-hidden rounded-2xl border bg-white/[0.04] ${r.analise.nosso ? 'border-violet-300/30' : 'border-white/10'}`}>
                  <button type="button" onClick={() => setAberto(expandido ? null : r.id)} className="flex w-full items-start gap-3 p-4 text-left hover:bg-white/[0.03]">
                    <span className="mt-0.5 text-white/40">{expandido ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{r.analise.rotulo}</span>
                        <Selo className={COR_DO_RESPONSAVEL[r.analise.responsavel]}>{r.analise.responsavelRotulo}</Selo>
                        {r.analise.nosso && <Selo className="border-violet-300/40 bg-violet-400/20 text-violet-100">Investigar: pode ser nosso</Selo>}
                        {r.recuperada ? (
                          <Selo className="border-emerald-300/25 bg-emerald-400/10 text-emerald-100">Recuperada</Selo>
                        ) : (
                          <Selo className="border-rose-300/25 bg-rose-400/10 text-rose-100">Não recuperada</Selo>
                        )}
                        {r.origem === 'navegador' && <Selo className="border-white/15 bg-white/5 text-white/60">visto no navegador</Selo>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-white/55">
                        <span>{quando(r.criadoEm)}</span>
                        <span>{r.comprador.nome || r.comprador.email || 'Comprador não identificado'}</span>
                        {r.produto ? <span className="truncate">{r.produto}</span> : null}
                        <span className="font-semibold text-white/80">{r.valorCobrado != null ? brl(r.valorCobrado) : r.navegador?.valor != null ? brl(r.navegador.valor) : '—'}</span>
                        {bin || final ? <span className="font-mono">{bin ? `${bin}••` : ''}{final ? `••${final}` : ''}</span> : null}
                        <span>{r.dispositivo}</span>
                      </div>
                    </div>
                  </button>
                  {expandido && <Detalhe r={r} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
