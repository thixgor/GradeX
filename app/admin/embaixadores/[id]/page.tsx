'use client'

import { use, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  AtSign,
  BadgePercent,
  Banknote,
  CheckCircle2,
  Crown,
  Link2,
  Loader2,
  MousePointerClick,
  Pause,
  Pencil,
  Phone,
  Play,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  XOctagon,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { FundoDeVidro } from '@/components/vitrine/vidro-app'
import { SimuladorDeComissao } from '@/components/embaixadores/admin-formularios'
import {
  Abas,
  BotaoCopiar,
  Funil,
  GraficoSemanal,
  Kpi,
  Modal,
  ProdutosQueSairam,
  ResumoDasSemanas,
  SeloSaude,
  SeloStatus,
  SeloTipo,
  Vazio,
  formatarData,
  formatarInteiro,
  formatarReais,
  haQuanto,
  useAviso,
} from '@/components/embaixadores/ui'
import type { PainelDoEmbaixador } from '@/lib/embaixadores/servidor'
import { ROTULO_DA_CHAVE_PIX, ROTULO_DO_DESCONTO, deslocarMes, formatarChavePix, rotuloDoMes, validarIdDaTransacao, type StatusDoEmbaixador, type TipoDeEmbaixador } from '@/lib/embaixadores/regras'

interface Conta {
  accountType: string
  temPlus: boolean
  plusExpiraEm: string | null
}

type Aba = 'vendas' | 'indicados' | 'repasses'

async function pedir(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  const dados = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(dados.error || 'Algo deu errado.')
  return dados
}

export default function AdminEmbaixadorPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const { avisar, elemento: aviso } = useAviso()
  const [painel, setPainel] = useState<PainelDoEmbaixador | null>(null)
  const [conta, setConta] = useState<Conta | null>(null)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState<Aba>('vendas')
  const [editar, setEditar] = useState(false)
  const [repassar, setRepassar] = useState(false)
  const [confirmar, setConfirmar] = useState<null | { acao: 'encerrar' | 'remover-plus' }>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [recemCriado, setRecemCriado] = useState(false)

  // Lido no cliente, e não com useSearchParams: assim o casco estático não
  // precisa de um Suspense só para saber se acabou de nascer.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('novo') === '1') setRecemCriado(true)
  }, [])

  const carregar = useCallback(async () => {
    setErro('')
    try {
      const dados = await pedir(`/api/admin/embaixadores/${id}`, { cache: 'no-store' })
      setPainel(dados.painel)
      setConta(dados.conta)
    } catch (e: any) {
      setErro(e.message)
    }
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function acao(nome: string, fn: () => Promise<unknown>, sucesso: string) {
    setOcupado(nome)
    try {
      await fn()
      avisar(sucesso)
      await carregar()
    } catch (e: any) {
      avisar(e.message)
    } finally {
      setOcupado(null)
    }
  }

  const mudarStatus = (status: StatusDoEmbaixador, texto: string) =>
    acao(`status-${status}`, () => pedir(`/api/admin/embaixadores/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }), texto)

  const plus = (liberar: boolean) =>
    acao(
      'plus',
      () =>
        pedir(`/api/users/${painel!.embaixador.userId}`, {
          method: 'PATCH',
          body: JSON.stringify(
            liberar
              ? { action: 'update_tier', accountType: 'plus', premiumPlanType: 'vitalicio' }
              : { action: 'update_tier', accountType: 'gratuito' },
          ),
        }),
      liberar ? 'Plus+ liberado' : 'Plus+ removido',
    )

  const sincronizar = () =>
    acao(
      'sincronizar',
      async () => {
        const r = await pedir(`/api/admin/embaixadores/${id}/sincronizar`, { method: 'POST' })
        if (r.registradas || r.estornadas) avisar(`${r.registradas} vendas novas, ${r.estornadas} estornos`)
      },
      'Vendas conferidas',
    )

  if (erro && !painel) {
    return (
      <AppShell headerTitle="Embaixador">
        <FundoDeVidro className="min-h-[100svh]">
          <div className="emb mx-auto max-w-md px-4 py-24 text-center">
            <p className="text-[20px] font-extrabold">{erro}</p>
            <Link href="/admin/embaixadores" className="emb-botao emb-botao-vidro emb-foco mt-6">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
            </Link>
          </div>
        </FundoDeVidro>
      </AppShell>
    )
  }

  const e = painel?.embaixador
  const t = painel?.totais
  const remunerado = e?.tipo === 'remunerado'

  return (
    <AppShell headerTitle={e?.nome || 'Embaixador'} headerSubtitle="Programa de Embaixadores" vidro>
      <FundoDeVidro className="min-h-[100svh]">
        <div className="emb mx-auto w-full max-w-7xl px-4 pb-24 pt-6 md:px-8 md:pt-8">
          {aviso}
          <Link href="/admin/embaixadores" className="emb-botao emb-botao-vidro emb-foco !min-h-[38px] !px-3.5 !text-[14px]">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Embaixadores
          </Link>

          {!painel || !e || !t ? (
            <div className="mt-8 space-y-4" aria-busy="true">
              <div className="emb-esqueleto h-24 max-w-xl" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="emb-esqueleto h-28 rounded-[22px]" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {recemCriado && (
                <div role="status" className="emb-borda-viva emb-parada mt-6">
                  <div className="emb-vidro flex flex-col gap-4 p-5 md:flex-row md:items-center md:p-6">
                    <CheckCircle2 className="emb-verde h-8 w-8 shrink-0" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-extrabold">{e.nome.split(' ')[0]} agora é embaixador</p>
                      <p className="emb-suave text-[14px]">
                        Cupom <strong>{e.cupom.codigo}</strong> criado. Mande o link e, se ainda não tiver, libere o Plus+ de cortesia.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <BotaoCopiar texto={e.link} rotulo="Copiar link" aviso="Link copiado" avisar={avisar} />
                      {!conta?.temPlus && (
                        <button type="button" onClick={() => plus(true)} disabled={ocupado === 'plus'} className="emb-botao vidro-botao emb-foco">
                          {ocupado === 'plus' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Crown className="h-4 w-4" aria-hidden />}
                          Liberar Plus+
                        </button>
                      )}
                      <button type="button" onClick={() => setRecemCriado(false)} className="emb-botao emb-botao-vidro emb-foco">
                        Ok
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Cabeçalho ── */}
              <header className="mt-6 grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="flex items-center gap-4">
                    <div className="emb-vidro grid h-16 w-16 shrink-0 place-items-center rounded-[22px] text-[26px] font-extrabold">
                      {e.nome.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h1 className="emb-titulo truncate text-[clamp(28px,3.6vw,42px)]">{e.nome}</h1>
                      <p className="emb-suave truncate text-[14.5px]">{e.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <SeloStatus status={e.status} />
                    <SeloTipo tipo={e.tipo} comissao={e.comissaoPercent} />
                    <SeloSaude saude={painel.saude.saude} />
                    <span className="emb-selo" data-tom={conta?.temPlus ? 'verde' : undefined}>
                      <Crown className="h-3.5 w-3.5" aria-hidden /> {conta?.temPlus ? 'Plus+ ativo' : 'Sem Plus+'}
                    </span>
                    {t.compras > 0 && (
                      <span className="emb-selo">
                        #{painel.ranking.posicao} de {painel.ranking.de}
                      </span>
                    )}
                  </div>
                  <ul className="emb-suave mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[14px]">
                    {e.faculdade && <li>{[e.faculdade, e.periodo].filter(Boolean).join(' · ')}</li>}
                    {e.instagram && (
                      <li>
                        <a href={`https://instagram.com/${e.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
                          <AtSign className="h-3.5 w-3.5" aria-hidden />
                          {e.instagram}
                        </a>
                      </li>
                    )}
                    {e.telefone && (
                      <li className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" aria-hidden /> {e.telefone}
                      </li>
                    )}
                    <li>Desde {formatarData(e.criadoEm)}</li>
                    <li>Última venda {haQuanto(painel.saude.ultimaVendaEm)}</li>
                  </ul>
                  {e.observacoes && <p className="emb-lista mt-4 whitespace-pre-line rounded-2xl p-3.5 text-[14px]">{e.observacoes}</p>}
                </div>

                <div className="emb-vidro rounded-[26px] p-5 lg:col-span-5">
                  <div className="flex items-center justify-between">
                    <p className="emb-fraca text-[12px] font-bold uppercase tracking-[0.14em]">Cupom e link</p>
                    <span className="emb-selo" data-tom={e.cupom.ativo ? 'verde' : 'vermelho'}>
                      Cupom {e.cupom.ativo ? 'ativo' : 'desligado'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <p className="emb-numero text-[34px] tracking-[0.04em]">{e.cupom.codigo}</p>
                    <p className="emb-ambar text-[15px] font-extrabold">{e.cupom.desconto}% OFF</p>
                  </div>
                  <p className="emb-lista mt-3 truncate rounded-xl px-3 py-2 text-[13.5px] font-semibold">
                    <Link2 className="emb-fraca mr-1.5 inline h-4 w-4 align-[-3px]" aria-hidden />
                    {e.link.replace(/^https?:\/\//, '')}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <BotaoCopiar texto={e.cupom.codigo} rotulo="Cupom" aviso="Cupom copiado" avisar={avisar} />
                    <BotaoCopiar texto={e.link} rotulo="Link" aviso="Link copiado" avisar={avisar} />
                  </div>
                  <div className="emb-picote my-4" />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setEditar(true)} className="emb-botao emb-botao-vidro emb-foco !min-h-[38px] !px-3.5 !text-[13.5px]">
                      <Pencil className="h-4 w-4" aria-hidden /> Editar
                    </button>
                    <button type="button" onClick={sincronizar} disabled={!!ocupado} className="emb-botao emb-botao-vidro emb-foco !min-h-[38px] !px-3.5 !text-[13.5px]">
                      {ocupado === 'sincronizar' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
                      Conferir vendas
                    </button>
                    {e.status === 'ativo' ? (
                      <button type="button" onClick={() => mudarStatus('pausado', 'Pausado: cupom desligado')} disabled={!!ocupado} className="emb-botao emb-botao-vidro emb-foco !min-h-[38px] !px-3.5 !text-[13.5px]">
                        <Pause className="h-4 w-4" aria-hidden /> Pausar
                      </button>
                    ) : (
                      <button type="button" onClick={() => mudarStatus('ativo', 'Reativado: cupom ligado')} disabled={!!ocupado} className="emb-botao emb-botao-vidro emb-foco !min-h-[38px] !px-3.5 !text-[13.5px]">
                        <Play className="h-4 w-4" aria-hidden /> Reativar
                      </button>
                    )}
                    {e.status !== 'encerrado' && (
                      <button type="button" onClick={() => setConfirmar({ acao: 'encerrar' })} disabled={!!ocupado} className="emb-botao emb-botao-vidro emb-foco !min-h-[38px] !px-3.5 !text-[13.5px]" style={{ color: 'var(--emb-vermelho)' }}>
                        <XOctagon className="h-4 w-4" aria-hidden /> Encerrar
                      </button>
                    )}
                    {conta?.temPlus ? (
                      <button type="button" onClick={() => setConfirmar({ acao: 'remover-plus' })} disabled={!!ocupado} className="emb-botao emb-botao-vidro emb-foco !min-h-[38px] !px-3.5 !text-[13.5px]">
                        <Crown className="h-4 w-4" aria-hidden /> Remover Plus+
                      </button>
                    ) : (
                      <button type="button" onClick={() => plus(true)} disabled={!!ocupado} className="emb-botao vidro-botao emb-foco !min-h-[38px] !px-3.5 !text-[13.5px]">
                        {ocupado === 'plus' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Crown className="h-4 w-4" aria-hidden />}
                        Liberar Plus+
                      </button>
                    )}
                  </div>
                </div>
              </header>

              {/* ── Dinheiro (remunerado) ── */}
              {remunerado && (
                <section aria-labelledby="repasse-titulo" className="mt-8 grid gap-4 lg:grid-cols-12">
                  <div className="emb-borda-viva lg:col-span-5">
                    <div className="emb-vidro h-full p-6">
                      <div className="flex items-center gap-2">
                        <Wallet className="emb-verde h-5 w-5" aria-hidden />
                        <h2 id="repasse-titulo" className="text-[15px] font-bold">
                          Pagar neste ciclo
                        </h2>
                      </div>
                      <p className="emb-numero emb-dinheiro mt-3 text-[clamp(40px,5vw,54px)]">{formatarReais(Math.max(0, painel.repasse.liberado))}</p>
                      <p className="emb-suave mt-1 text-[13.5px]">
                        Comissões até {rotuloDoMes(painel.repasse.mesFechado)}
                        {painel.repasse.prazoDoLiberado
                          ? ` · PIX até ${formatarData(painel.repasse.prazoDoLiberado)}`
                          : painel.repasse.liberado > 0
                            ? ' · prazo do dia ' + painel.programa.diaDoRepasse + ' já passou'
                            : ''}
                      </p>
                      {painel.repasse.liberado < 0 && (
                        <p className="emb-suave mt-1 text-[13px]">
                          Um estorno depois do último repasse deixou {formatarReais(Math.abs(painel.repasse.liberado))} a descontar do próximo.
                        </p>
                      )}
                      <p className="emb-fraca mt-2 text-[13px]">
                        Acumulando em {rotuloDoMes(painel.repasse.mesAtual)}: <strong>{formatarReais(painel.repasse.acumulandoNoMes)}</strong> · entra no
                        repasse de {formatarData(painel.repasse.prazoDoMesAtual)}
                      </p>
                      <div className="emb-lista mt-5 rounded-2xl p-4">
                        {e.pix ? (
                          <>
                            <p className="emb-fraca text-[12px] font-bold uppercase tracking-wider">PIX · {ROTULO_DA_CHAVE_PIX[e.pix.tipo]}</p>
                            <p className="mt-1 break-all text-[17px] font-extrabold">{formatarChavePix(e.pix)}</p>
                            <p className="emb-suave text-[13px]">{e.pix.titular}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <BotaoCopiar texto={e.pix.chave} rotulo="Copiar chave" aviso="Chave PIX copiada" avisar={avisar} className="!min-h-[38px] !text-[13.5px]" />
                              {painel.repasse.liberado > 0 && (
                                <BotaoCopiar texto={painel.repasse.liberado.toFixed(2).replace('.', ',')} rotulo="Copiar valor" aviso="Valor copiado" avisar={avisar} className="!min-h-[38px] !text-[13.5px]" />
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="text-[14px]">
                            <strong>Sem chave PIX.</strong> <span className="emb-suave">O embaixador cadastra a chave no painel dele, em /embaixadores.</span>
                          </p>
                        )}
                      </div>
                      <button type="button" onClick={() => setRepassar(true)} className="emb-botao vidro-botao emb-foco mt-5 w-full">
                        <Banknote className="h-4 w-4" aria-hidden /> Registrar repasse feito
                      </button>
                    </div>
                  </div>
                  <div className="emb-painel rounded-[28px] p-6 lg:col-span-7">
                    <h2 className="text-[15px] font-bold">Para onde foi o dinheiro das vendas</h2>
                    <p className="emb-suave text-[13.5px]">Soma das vendas confirmadas, com a porcentagem gravada em cada uma.</p>
                    <dl className="mt-5 space-y-3 text-[14.5px]">
                      {[
                        ['Vendido (valor dos produtos)', t.receita, ''],
                        [`Sócio (${painel.programa.percentualSocio}% hoje)`, t.valorSocio || 0, 'emb-suave'],
                        ['Comissão do embaixador', t.comissaoTotal, 'emb-ambar'],
                        ['Fica com a DomineAqui', t.nossaParteLiquida || 0, 'emb-verde'],
                      ].map(([rotulo, valor, classe]) => (
                        <div key={rotulo as string} className="emb-linha flex items-center justify-between gap-3 pt-3 first:pt-0">
                          <dt>{rotulo}</dt>
                          <dd className={`text-[16px] font-extrabold ${classe}`}>{formatarReais(valor as number)}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-5">
                      <SimuladorDeComissao percentualSocio={painel.programa.percentualSocio ?? 30} comissaoPercent={e.comissaoPercent} />
                    </div>
                  </div>
                </section>
              )}

              {/* ── Números ── */}
              <section aria-label="Números" className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
                <Kpi indice={0} rotulo="Visitas ao link" valor={t.visitantes} icone={<MousePointerClick className="h-4 w-4" />} detalhe={`${formatarInteiro(t.cliques)} cliques`} />
                <Kpi indice={1} rotulo="Cadastros" valor={t.cadastros} icone={<UserPlus className="h-4 w-4" />} detalhe={`${String(t.conversaoCadastro).replace('.', ',')}% das visitas`} />
                <Kpi indice={2} rotulo="Compradores" valor={t.compradores} icone={<Users className="h-4 w-4" />} detalhe={`${String(t.conversaoCompra).replace('.', ',')}% dos indicados`} />
                <Kpi indice={3} rotulo="Compras" valor={t.compras} icone={<ShoppingBag className="h-4 w-4" />} detalhe={[`${formatarInteiro(t.comprasComBeneficio)} de bolsistas (ProUni/Fies)`, t.estornos ? `${t.estornos} estornos` : ''].filter(Boolean).join(' · ')} />
                <Kpi indice={4} rotulo="Vendido" valor={t.receita} formato="reais" destaque icone={<Receipt className="h-4 w-4" />} />
                <Kpi indice={5} rotulo="Ticket médio" valor={t.ticketMedio} formato="reais" icone={<BadgePercent className="h-4 w-4" />} />
              </section>

              <section aria-label="Desempenho" className="mt-8 grid gap-4 lg:grid-cols-12">
                <div className="emb-painel flex flex-col rounded-[28px] p-5 md:p-7 lg:col-span-8">
                  <h2 className="text-[20px] font-extrabold tracking-tight">Desempenho</h2>
                  <p className="emb-suave text-[14px]">Últimas 12 semanas</p>
                  <div className="mt-5">
                    <GraficoSemanal dados={painel.series} />
                  </div>
                  <div className="mt-auto pt-6">
                    <ResumoDasSemanas dados={painel.series} />
                  </div>
                </div>
                <div className="flex flex-col gap-4 lg:col-span-4">
                  <div className="emb-painel rounded-[28px] p-5 md:p-6">
                    <h3 className="text-[15px] font-bold">Do clique à compra</h3>
                    <div className="mt-4">
                      <Funil
                        etapas={[
                          { rotulo: 'Visitas', valor: t.visitantes },
                          { rotulo: 'Cadastros', valor: t.cadastros },
                          { rotulo: 'Indicados que compraram', valor: t.indicadosQueCompraram },
                        ]}
                      />
                    </div>
                  </div>
                  {painel.topProdutos.length > 0 && (
                    <div className="emb-painel rounded-[28px] p-5 md:p-6">
                      <h3 className="text-[15px] font-bold">Produtos que mais saíram</h3>
                      <div className="mt-4">
                        <ProdutosQueSairam produtos={painel.topProdutos} />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Listas ── */}
              <section aria-label="Histórico" className="mt-8">
                <Abas
                  rotulo="Histórico"
                  atual={aba}
                  aoTrocar={setAba}
                  abas={[
                    { id: 'vendas', rotulo: 'Quem comprou', contagem: painel.vendas.length },
                    { id: 'indicados', rotulo: 'Quem se cadastrou', contagem: t.cadastros },
                    { id: 'repasses', rotulo: 'Repasses', contagem: painel.repasses.length },
                  ]}
                />
                <div className="emb-lista mt-4 overflow-hidden rounded-[24px]">
                  {aba === 'vendas' &&
                    (painel.vendas.length === 0 ? (
                      <Vazio icone={<ShoppingBag className="emb-fraca h-6 w-6" />} titulo="Nenhuma venda" texto="Compras aprovadas com o cupom deste embaixador aparecem aqui — inclusive as de bolsista, em que o ProUni/Fies foi o desconto aplicado." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-[13.5px]">
                          <thead className="emb-fraca text-[12px] uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3 font-bold">Data</th>
                              <th className="px-4 py-3 font-bold">Comprador</th>
                              <th className="px-4 py-3 font-bold">Produto</th>
                              <th className="px-4 py-3 font-bold">Desconto</th>
                              <th className="px-4 py-3 text-right font-bold">Valor</th>
                              <th className="px-4 py-3 text-right font-bold">Sócio</th>
                              <th className="px-4 py-3 text-right font-bold">Comissão</th>
                            </tr>
                          </thead>
                          <tbody>
                            {painel.vendas.map((v) => (
                              <tr key={v.id} className="emb-linha" style={{ opacity: v.status === 'estornada' ? 0.55 : 1 }}>
                                <td className="whitespace-nowrap px-4 py-3">{formatarData(v.pagoEm)}</td>
                                <td className="max-w-[220px] px-4 py-3">
                                  <p className="truncate font-semibold">{v.comprador}</p>
                                  {v.compradorEmail && <p className="emb-fraca truncate text-[12px]">{v.compradorEmail}</p>}
                                </td>
                                <td className="max-w-[240px] truncate px-4 py-3">{v.produto}</td>
                                <td className="px-4 py-3">
                                  <span className="emb-selo" data-tom={v.desconto === 'cupom' ? undefined : 'ambar'}>
                                    {ROTULO_DO_DESCONTO[v.desconto]}
                                  </span>
                                  {v.status === 'estornada' && (
                                    <span className="emb-selo ml-1" data-tom="vermelho">
                                      Estornada
                                    </span>
                                  )}
                                </td>
                                <td className={`whitespace-nowrap px-4 py-3 text-right font-bold ${v.status === 'estornada' ? 'line-through' : ''}`}>{formatarReais(v.valor)}</td>
                                <td className="emb-suave whitespace-nowrap px-4 py-3 text-right">{formatarReais(v.valorSocio || 0)}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                  <span className="emb-ambar font-bold">{formatarReais(v.comissao)}</span>
                                  {v.comissaoPercent > 0 && <span className="emb-fraca block text-[11.5px]">{String(v.comissaoPercent).replace('.', ',')}%</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}

                  {aba === 'indicados' &&
                    (painel.indicados.length === 0 ? (
                      <Vazio icone={<UserPlus className="emb-fraca h-6 w-6" />} titulo="Nenhum cadastro pelo link" texto="Contas criadas por quem abriu o link deste embaixador (até 30 dias depois do clique, último link vence) aparecem aqui." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-[13.5px]">
                          <thead className="emb-fraca text-[12px] uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3 font-bold">Nome</th>
                              <th className="px-4 py-3 font-bold">E-mail</th>
                              <th className="px-4 py-3 font-bold">Cadastro</th>
                              <th className="px-4 py-3 font-bold">Comprou?</th>
                              <th className="px-4 py-3 text-right font-bold">Gastou</th>
                            </tr>
                          </thead>
                          <tbody>
                            {painel.indicados.map((i) => (
                              <tr key={i.id} className="emb-linha">
                                <td className="px-4 py-3 font-semibold">{i.nome}</td>
                                <td className="emb-suave px-4 py-3">{i.email}</td>
                                <td className="whitespace-nowrap px-4 py-3">{formatarData(i.criadoEm)}</td>
                                <td className="px-4 py-3">
                                  {i.comprou ? (
                                    <span className="emb-selo" data-tom="verde">
                                      Sim
                                    </span>
                                  ) : (
                                    <span className="emb-selo">Ainda não</span>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right font-bold">{i.totalGasto ? formatarReais(i.totalGasto) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}

                  {aba === 'repasses' &&
                    (painel.repasses.length === 0 ? (
                      <Vazio icone={<Banknote className="emb-fraca h-6 w-6" />} titulo="Nenhum repasse registrado" texto={remunerado ? 'Fez o PIX? Registre aqui para tirar o valor do saldo a repassar.' : 'Embaixador não-remunerado não recebe comissão.'} />
                    ) : (
                      <ul>
                        {painel.repasses.map((r) => (
                          <li key={r.id} className="emb-linha flex items-center gap-3 px-4 py-3.5 md:px-5">
                            <Banknote className="emb-verde h-5 w-5 shrink-0" aria-hidden />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">
                                {r.referencia ? `Comissões de ${rotuloDoMes(r.referencia)}` : 'Repasse'} · PIX em {formatarData(r.pagoEm)}
                              </p>
                              <p className="emb-fraca truncate text-[12.5px]">
                                {[r.idTransacao && `ID ${r.idTransacao}`, r.chavePix, r.observacao].filter(Boolean).join(' · ') || 'PIX'}
                              </p>
                            </div>
                            <p className="emb-verde shrink-0 text-[15px] font-extrabold">{formatarReais(r.valor)}</p>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Desfazer este repasse? O valor volta para "a repassar".')) {
                                  acao('desfazer', () => pedir(`/api/admin/embaixadores/${id}/repasses?repasseId=${r.id}`, { method: 'DELETE' }), 'Repasse desfeito')
                                }
                              }}
                              className="emb-botao emb-botao-vidro emb-foco !h-9 !min-h-0 !w-9 !p-0"
                              aria-label="Desfazer repasse"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ))}
                </div>
              </section>

              <EditarEmbaixador
                aberto={editar}
                aoFechar={() => setEditar(false)}
                painel={painel}
                aoSalvar={async () => {
                  setEditar(false)
                  avisar('Alterações salvas')
                  await carregar()
                }}
              />
              <RegistrarRepasse
                aberto={repassar}
                aoFechar={() => setRepassar(false)}
                id={id}
                sugestao={Math.max(0, painel.repasse.liberado)}
                mesSugerido={painel.repasse.mesFechado}
                aoSalvar={async () => {
                  setRepassar(false)
                  avisar('Repasse registrado')
                  await carregar()
                }}
              />
              <Modal
                aberto={!!confirmar}
                aoFechar={() => setConfirmar(null)}
                titulo={confirmar?.acao === 'encerrar' ? 'Encerrar a participação?' : 'Remover o Plus+?'}
                descricao={
                  confirmar?.acao === 'encerrar'
                    ? 'O cupom é desligado e o link para de contar. O histórico e o saldo a repassar continuam. O Plus+ não é removido sozinho.'
                    : 'A conta volta para o plano gratuito agora.'
                }
                largura="sm:max-w-md"
              >
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setConfirmar(null)} className="emb-botao emb-botao-vidro emb-foco">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const qual = confirmar?.acao
                      setConfirmar(null)
                      if (qual === 'encerrar') mudarStatus('encerrado', 'Participação encerrada')
                      else plus(false)
                    }}
                    className="emb-botao vidro-botao emb-foco"
                  >
                    Confirmar
                  </button>
                </div>
              </Modal>
            </>
          )}
        </div>
      </FundoDeVidro>
    </AppShell>
  )
}

function EditarEmbaixador({
  aberto,
  aoFechar,
  painel,
  aoSalvar,
}: {
  aberto: boolean
  aoFechar: () => void
  painel: PainelDoEmbaixador
  aoSalvar: () => void
}) {
  const e = painel.embaixador
  const [tipo, setTipo] = useState<TipoDeEmbaixador>(e.tipo)
  const [comissao, setComissao] = useState(e.comissaoPercent)
  const [desconto, setDesconto] = useState(e.cupom.desconto)
  const [faculdade, setFaculdade] = useState(e.faculdade)
  const [periodo, setPeriodo] = useState(e.periodo)
  const [instagram, setInstagram] = useState(e.instagram)
  const [telefone, setTelefone] = useState(e.telefone || '')
  const [observacoes, setObservacoes] = useState(e.observacoes || '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setTipo(e.tipo)
    setComissao(e.comissaoPercent)
    setDesconto(e.cupom.desconto)
    setFaculdade(e.faculdade)
    setPeriodo(e.periodo)
    setInstagram(e.instagram)
    setTelefone(e.telefone || '')
    setObservacoes(e.observacoes || '')
    setErro('')
  }, [aberto, e])

  async function salvar(ev: React.FormEvent) {
    ev.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      await pedir(`/api/admin/embaixadores/${e.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ tipo, comissaoPercent: tipo === 'remunerado' ? comissao : 0, descontoCupom: desconto, faculdade, periodo, instagram, telefone, observacoes }),
      })
      aoSalvar()
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const mudouComissao = tipo !== e.tipo || (tipo === 'remunerado' && comissao !== e.comissaoPercent)

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Editar embaixador" largura="sm:max-w-2xl">
      <form onSubmit={salvar} className="space-y-4">
        <div className="emb-segmento" role="group" aria-label="Tipo">
          <button type="button" aria-pressed={tipo === 'nao_remunerado'} onClick={() => setTipo('nao_remunerado')} className="emb-foco">
            Não-remunerado
          </button>
          <button type="button" aria-pressed={tipo === 'remunerado'} onClick={() => setTipo('remunerado')} className="emb-foco">
            Remunerado
          </button>
        </div>
        {tipo === 'remunerado' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="comissao-edicao" className="text-[13px] font-semibold">
                Comissão sobre a nossa parte
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={comissao}
                  onChange={(ev) => setComissao(Math.min(100, Math.max(0, Number(ev.target.value) || 0)))}
                  className="emb-campo !min-h-[36px] !w-20 !px-3 text-right !text-[14px] font-bold"
                  aria-label="Comissão em porcentagem"
                />
                <span className="font-bold">%</span>
              </div>
            </div>
            <input id="comissao-edicao" type="range" min={0} max={50} step={0.5} value={Math.min(50, comissao)} onChange={(ev) => setComissao(Number(ev.target.value))} className="emb-faixa" />
            <SimuladorDeComissao percentualSocio={painel.programa.percentualSocio ?? 30} comissaoPercent={comissao} />
          </div>
        )}
        {mudouComissao && (
          <p className="emb-lista rounded-xl p-3 text-[13px]">
            Vale para as vendas <strong>daqui em diante</strong>. As já registradas mantêm a porcentagem do dia em que aconteceram.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">Desconto do cupom (%)</span>
            <input type="number" min={1} max={100} className="emb-campo font-bold" value={desconto} onChange={(ev) => setDesconto(Math.min(100, Math.max(1, Number(ev.target.value) || 1)))} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">Telefone</span>
            <input className="emb-campo" value={telefone} onChange={(ev) => setTelefone(ev.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">Faculdade</span>
            <input className="emb-campo" value={faculdade} onChange={(ev) => setFaculdade(ev.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">Período</span>
            <input className="emb-campo" value={periodo} onChange={(ev) => setPeriodo(ev.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-semibold">Instagram</span>
            <input className="emb-campo" value={instagram} onChange={(ev) => setInstagram(ev.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-semibold">Observações internas</span>
            <textarea className="emb-campo" value={observacoes} onChange={(ev) => setObservacoes(ev.target.value)} />
          </label>
        </div>
        {erro && (
          <p role="alert" className="text-[14px] font-semibold" style={{ color: 'var(--emb-vermelho)' }}>
            {erro}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={aoFechar} className="emb-botao emb-botao-vidro emb-foco">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="emb-botao vidro-botao emb-foco">
            {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  )
}

function RegistrarRepasse({
  aberto,
  aoFechar,
  id,
  sugestao,
  mesSugerido,
  aoSalvar,
}: {
  aberto: boolean
  aoFechar: () => void
  id: string
  sugestao: number
  mesSugerido: string
  aoSalvar: () => void
}) {
  const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hoje())
  const [idTransacao, setIdTransacao] = useState('')
  const [referencia, setReferencia] = useState(mesSugerido)
  const [observacao, setObservacao] = useState('')
  // Os seis meses até o atual, para escolher a que comissões o PIX se refere.
  const meses = useMemo(() => Array.from({ length: 6 }, (_, i) => deslocarMes(mesSugerido, 1 - i)), [mesSugerido])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setValor(sugestao > 0 ? sugestao.toFixed(2).replace('.', ',') : '')
    setData(hoje())
    setIdTransacao('')
    setReferencia(mesSugerido)
    setObservacao('')
    setErro('')
  }, [aberto, sugestao, mesSugerido])

  async function salvar(ev: React.FormEvent) {
    ev.preventDefault()
    const numero = Number(valor.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(numero) || numero <= 0) return setErro('Informe o valor do PIX.')
    const comprovante = validarIdDaTransacao(idTransacao)
    if (!comprovante.ok) return setErro(comprovante.erro)
    setSalvando(true)
    setErro('')
    try {
      await pedir(`/api/admin/embaixadores/${id}/repasses`, {
        method: 'POST',
        body: JSON.stringify({ valor: numero, pagoEm: `${data}T12:00:00-03:00`, idTransacao: comprovante.id, referencia, observacao }),
      })
      aoSalvar()
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Registrar repasse"
      descricao="Lance aqui o PIX que você já fez. O valor sai do saldo, e o embaixador vê o ID da transação para conferir no extrato."
      largura="sm:max-w-md"
    >
      <form onSubmit={salvar} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Valor (R$)</span>
          <input className="emb-campo text-[20px] font-extrabold" inputMode="decimal" value={valor} onChange={(ev) => setValor(ev.target.value)} placeholder="0,00" autoFocus />
          {sugestao > 0 && <span className="emb-fraca mt-1 block text-[12px]">Liberado neste ciclo: {formatarReais(sugestao)}</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">ID da transação do PIX</span>
          <input
            className="emb-campo font-mono text-[14px] uppercase"
            value={idTransacao}
            onChange={(ev) => {
              setIdTransacao(ev.target.value)
              setErro('')
            }}
            placeholder="E00000000202611101530AbC123xYz9"
            maxLength={40}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="emb-fraca mt-1 block text-[12px]">
            No comprovante do banco aparece como “ID da transação” ou “E2E”: 32 caracteres, começando com E.
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Comissões de</span>
          <select className="emb-campo" value={referencia} onChange={(ev) => setReferencia(ev.target.value)}>
            {meses.map((m) => (
              <option key={m} value={m}>
                {rotuloDoMes(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Data do PIX</span>
          <input type="date" className="emb-campo" value={data} max={hoje()} onChange={(ev) => setData(ev.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Observação</span>
          <input className="emb-campo" value={observacao} onChange={(ev) => setObservacao(ev.target.value)} placeholder="Opcional" maxLength={300} />
        </label>
        {erro && (
          <p role="alert" className="text-[14px] font-semibold" style={{ color: 'var(--emb-vermelho)' }}>
            {erro}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={aoFechar} className="emb-botao emb-botao-vidro emb-foco">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="emb-botao vidro-botao emb-foco">
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Banknote className="h-4 w-4" aria-hidden />}
            Registrar
          </button>
        </div>
      </form>
    </Modal>
  )
}
