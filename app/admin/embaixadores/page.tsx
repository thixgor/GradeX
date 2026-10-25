'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronRight,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShoppingBag,
  UserPlus,
  Users,
  Wallet,
  Receipt,
  Landmark,
  KeyRound,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { FundoDeVidro } from '@/components/vitrine/vidro-app'
import { ConfigDoProgramaModal, NovoEmbaixador } from '@/components/embaixadores/admin-formularios'
import {
  BotaoCopiar,
  Kpi,
  SeloSaude,
  SeloStatus,
  SeloTipo,
  Vazio,
  formatarInteiro,
  formatarReais,
  haQuanto,
  useAviso,
} from '@/components/embaixadores/ui'
import type { ConfigDoPrograma, SaudeDoCupom, StatusDoEmbaixador, TipoDeEmbaixador } from '@/lib/embaixadores/regras'

interface Linha {
  id: string
  nome: string
  email: string
  faculdade: string
  tipo: TipoDeEmbaixador
  status: StatusDoEmbaixador
  codigo: string
  link: string
  comissaoPercent: number
  comissaoSobreProduto: number
  temPix: boolean
  visitantes: number
  cadastros: number
  compras: number
  compradores: number
  receita: number
  comissaoTotal: number
  repassado: number
  aReceber: number
  ultimaVendaEm: string | null
  criadoEm: string
  saude: SaudeDoCupom
}

interface Totais {
  embaixadores: number
  ativos: number
  remunerados: number
  visitantes: number
  cadastros: number
  compras: number
  compradores: number
  receita: number
  comissaoTotal: number
  repassado: number
  aReceber: number
  valorSocio: number
  nossaParteLiquida: number
}

type Ordem = 'receita' | 'aReceber' | 'compras' | 'cadastros' | 'recentes'

const ORDENS: Array<{ id: Ordem; rotulo: string }> = [
  { id: 'receita', rotulo: 'Mais vendas (R$)' },
  { id: 'aReceber', rotulo: 'A repassar' },
  { id: 'compras', rotulo: 'Mais compras' },
  { id: 'cadastros', rotulo: 'Mais cadastros' },
  { id: 'recentes', rotulo: 'Entrada mais recente' },
]

export default function AdminEmbaixadoresPage() {
  const router = useRouter()
  const { avisar, elemento: aviso } = useAviso()
  const [dados, setDados] = useState<{ embaixadores: Linha[]; totais: Totais; config: ConfigDoPrograma } | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<'todos' | TipoDeEmbaixador>('todos')
  const [status, setStatus] = useState<'todos' | StatusDoEmbaixador>('ativo')
  const [ordem, setOrdem] = useState<Ordem>('receita')
  const [novo, setNovo] = useState(false)
  const [configAberta, setConfigAberta] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      const res = await fetch('/api/admin/embaixadores', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar')
      setDados(json)
    } catch (e: any) {
      setErro(e?.message || 'Erro ao carregar')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const lista = useMemo(() => {
    if (!dados) return []
    const termo = busca.trim().toLowerCase()
    const filtrada = dados.embaixadores.filter((e) => {
      if (tipo !== 'todos' && e.tipo !== tipo) return false
      if (status !== 'todos' && e.status !== status) return false
      if (!termo) return true
      return [e.nome, e.email, e.codigo, e.faculdade].some((c) => c.toLowerCase().includes(termo))
    })
    const chave: Record<Ordem, (e: Linha) => number> = {
      receita: (e) => e.receita,
      aReceber: (e) => e.aReceber,
      compras: (e) => e.compras,
      cadastros: (e) => e.cadastros,
      recentes: (e) => new Date(e.criadoEm).getTime(),
    }
    return [...filtrada].sort((a, b) => chave[ordem](b) - chave[ordem](a))
  }, [dados, busca, tipo, status, ordem])

  const contagemPorStatus = useMemo(() => {
    const c = { todos: 0, ativo: 0, pausado: 0, encerrado: 0 }
    for (const e of dados?.embaixadores || []) {
      c.todos++
      c[e.status]++
    }
    return c
  }, [dados])

  const t = dados?.totais

  return (
    <AppShell headerTitle="Embaixadores" headerSubtitle="Programa de Embaixadores" vidro>
      <FundoDeVidro className="min-h-[100svh]">
        <div className="emb mx-auto w-full max-w-7xl px-4 pb-24 pt-6 md:px-8 md:pt-8">
          {aviso}
          <button type="button" onClick={() => router.push('/admin')} className="emb-botao emb-botao-vidro emb-foco !min-h-[38px] !px-3.5 !text-[14px]">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Painel
          </button>

          <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="vidro-pilula">
                <Megaphone className="h-3.5 w-3.5" aria-hidden /> Programa de Embaixadores
              </p>
              <h1 className="emb-titulo mt-4 text-[clamp(34px,4.4vw,54px)]">
                Quem divulga, <span className="vidro-brilho">e quanto rende</span>
              </h1>
              <p className="emb-suave mt-2 max-w-[60ch] text-[15.5px]">
                Cadastros e compras vindos de cada link e cupom, comissões devidas aos remunerados e os repasses feitos por PIX. Nada é
                transferido sozinho: o sistema só mostra o que é devido.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setConfigAberta(true)} disabled={!dados} className="emb-botao emb-botao-vidro emb-foco">
                <Settings2 className="h-4 w-4" aria-hidden /> Configurar
              </button>
              <button type="button" onClick={() => setNovo(true)} disabled={!dados} className="emb-botao vidro-botao emb-foco">
                <Plus className="h-4 w-4" aria-hidden /> Novo embaixador
              </button>
            </div>
          </header>

          {erro && (
            <div role="alert" className="emb-vidro mt-6 flex items-center justify-between gap-3 rounded-2xl p-4">
              <p className="font-semibold">{erro}</p>
              <button type="button" onClick={carregar} className="emb-botao emb-botao-vidro emb-foco">
                <RefreshCw className="h-4 w-4" aria-hidden /> Tentar de novo
              </button>
            </div>
          )}

          {/* ── Números do programa ── */}
          <section aria-label="Números do programa" className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {t ? (
              <>
                <Kpi indice={0} rotulo="Embaixadores ativos" valor={t.ativos} icone={<Users className="h-4 w-4" />} detalhe={`${formatarInteiro(t.remunerados)} remunerados · ${formatarInteiro(t.embaixadores)} no total`} />
                <Kpi indice={1} rotulo="Cadastros pelos links" valor={t.cadastros} icone={<UserPlus className="h-4 w-4" />} detalhe={`${formatarInteiro(t.visitantes)} visitas aos links`} />
                <Kpi indice={2} rotulo="Compras" valor={t.compras} icone={<ShoppingBag className="h-4 w-4" />} detalhe={`${formatarInteiro(t.compradores)} compradores`} />
                <Kpi indice={3} rotulo="Vendido pelos embaixadores" valor={t.receita} formato="reais" destaque icone={<Receipt className="h-4 w-4" />} />
                <Kpi indice={4} rotulo="A repassar" valor={t.aReceber} formato="reais" destaque icone={<Wallet className="h-4 w-4" />} detalhe="soma dos saldos positivos" />
                <Kpi indice={5} rotulo="Já repassado" valor={t.repassado} formato="reais" icone={<KeyRound className="h-4 w-4" />} detalhe={`de ${formatarReais(t.comissaoTotal)} em comissões`} />
                <Kpi indice={6} rotulo="Parte do sócio" valor={t.valorSocio} formato="reais" icone={<Landmark className="h-4 w-4" />} detalhe={`${dados!.config.percentualSocio}% de cada venda`} />
                <Kpi indice={7} rotulo="Fica com a DomineAqui" valor={t.nossaParteLiquida} formato="reais" icone={<Receipt className="h-4 w-4" />} detalhe="depois do sócio e das comissões" />
              </>
            ) : (
              Array.from({ length: 8 }).map((_, i) => <div key={i} className="emb-esqueleto h-[118px] rounded-[22px]" />)
            )}
          </section>

          {/* ── Filtros ── */}
          <section aria-label="Filtros" className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="emb-fraca pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden />
              <input
                className="emb-campo !pl-10"
                placeholder="Nome, e-mail, código, faculdade"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar embaixador"
              />
            </div>
            <div className="emb-segmento" role="group" aria-label="Status">
              {(['ativo', 'pausado', 'encerrado', 'todos'] as const).map((s) => (
                <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className="emb-foco whitespace-nowrap">
                  {s === 'todos' ? 'Todos' : s === 'ativo' ? 'Ativos' : s === 'pausado' ? 'Pausados' : 'Encerrados'}
                  <span className="emb-fraca ml-1.5 text-[12px]">{contagemPorStatus[s]}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <select className="emb-campo !w-auto" value={tipo} onChange={(e) => setTipo(e.target.value as any)} aria-label="Tipo">
                <option value="todos">Todos os tipos</option>
                <option value="remunerado">Remunerados</option>
                <option value="nao_remunerado">Não-remunerados</option>
              </select>
              <select className="emb-campo !w-auto" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar">
                {ORDENS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* ── Lista ── */}
          <section aria-label="Embaixadores" className="mt-4">
            {carregando && !dados ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="emb-esqueleto h-24 rounded-[22px]" />
                ))}
              </div>
            ) : lista.length === 0 ? (
              <div className="emb-lista rounded-[24px]">
                <Vazio
                  icone={<Megaphone className="emb-fraca h-6 w-6" />}
                  titulo={dados?.embaixadores.length ? 'Ninguém com esses filtros' : 'Nenhum embaixador ainda'}
                  texto={
                    dados?.embaixadores.length
                      ? 'Troque o status ou limpe a busca.'
                      : 'Aprovou alguém pelo formulário? Crie o embaixador aqui: o cupom e o link nascem na hora.'
                  }
                >
                  {!dados?.embaixadores.length && (
                    <button type="button" onClick={() => setNovo(true)} className="emb-botao vidro-botao emb-foco">
                      <Plus className="h-4 w-4" aria-hidden /> Novo embaixador
                    </button>
                  )}
                </Vazio>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {lista.map((e) => (
                  <li key={e.id} className="emb-lista emb-ergue rounded-[22px]">
                    <div className="flex flex-col gap-4 p-4 md:p-5 lg:flex-row lg:items-center">
                      <Link href={`/admin/embaixadores/${e.id}`} className="emb-foco flex min-w-0 flex-1 items-center gap-3.5 rounded-xl">
                        <div className="emb-painel grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[18px] font-extrabold">
                          {e.nome.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[16px] font-bold">{e.nome}</p>
                          <p className="emb-fraca truncate text-[13px]">{[e.faculdade, e.email].filter(Boolean).join(' · ')}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <SeloStatus status={e.status} />
                            <SeloTipo tipo={e.tipo} comissao={e.comissaoPercent} />
                            {e.status === 'ativo' && <SeloSaude saude={e.saude} />}
                            {e.tipo === 'remunerado' && !e.temPix && (
                              <span className="emb-selo" data-tom="vermelho">
                                Sem PIX
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <dl className="grid grid-cols-4 gap-2 text-center lg:w-[440px]">
                        {[
                          ['Cadastros', formatarInteiro(e.cadastros)],
                          ['Compras', formatarInteiro(e.compras)],
                          ['Vendido', formatarReais(e.receita)],
                          [e.tipo === 'remunerado' ? 'A repassar' : 'Última venda', e.tipo === 'remunerado' ? formatarReais(e.aReceber) : haQuanto(e.ultimaVendaEm)],
                        ].map(([rotulo, valor], i) => (
                          <div key={rotulo} className="min-w-0">
                            <dt className="emb-fraca truncate text-[11.5px] font-semibold">{rotulo}</dt>
                            <dd className={`mt-0.5 truncate text-[14.5px] font-extrabold ${i === 3 && e.tipo === 'remunerado' && e.aReceber > 0 ? 'emb-ambar' : ''}`}>{valor}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="flex items-center gap-2 lg:w-auto">
                        <span className="emb-selo hidden !font-extrabold tracking-wider xl:inline-flex">{e.codigo}</span>
                        <BotaoCopiar texto={e.link} rotulo="Link" aviso="Link copiado" avisar={avisar} className="!min-h-[38px] !px-3 !text-[13px]" />
                        <Link href={`/admin/embaixadores/${e.id}`} className="emb-botao emb-botao-vidro emb-foco !min-h-[38px] !px-3" aria-label={`Abrir ${e.nome}`}>
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {dados && (
          <div className="emb">
            <NovoEmbaixador
              aberto={novo}
              aoFechar={() => setNovo(false)}
              config={dados.config}
              aoCriar={(id) => {
                setNovo(false)
                router.push(`/admin/embaixadores/${id}?novo=1`)
              }}
            />
            <ConfigDoProgramaModal
              aberto={configAberta}
              aoFechar={() => setConfigAberta(false)}
              config={dados.config}
              aoSalvar={(config) => {
                setConfigAberta(false)
                setDados((d) => (d ? { ...d, config } : d))
                avisar('Configuração salva')
                carregar()
              }}
            />
          </div>
        )}
      </FundoDeVidro>
    </AppShell>
  )
}
