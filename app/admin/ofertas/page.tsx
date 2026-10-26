'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  Gift,
  Loader2,
  Mail,
  Repeat,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/* ───────────────────────── tipos ───────────────────────── */

type Pessoa = { id: string; name: string; email: string }

type Produto = {
  itemType: 'material' | 'package'
  itemId: string
  title: string
  typeLabel: string
  price: number
  pricing: 'free' | 'paid'
  isHidden: boolean
}

type SituacaoDaOferta = 'cancelada' | 'comprada' | 'parcial' | 'aberta' | 'enviada'

type OfertaListada = {
  id: string
  userName: string
  userEmail: string
  titulo: string
  itens: { itemType: string; itemId: string; titulo: string }[]
  situacao: SituacaoDaOferta
  cupom: { codigo: string; estado: string; usosRestantes: number | null; usageCount: number; expiresAt: string | null } | null
  abertaEm: string | null
  emailEnviadoEm: string | null
  emailErro: string | null
  createdByName: string
  createdAt: string
}

type Compra = {
  _id: string
  itemType: string
  itemId: string
  itemTitle: string
  price: number
  purchasedAt?: string
  source?: string
}

type Relacao = 'mais_caro' | 'mais_barato' | 'mesmo_preco'
type Tratamento = 'cortesia' | 'diferenca_paga' | 'sem_reembolso' | 'reembolso_combinado'

type Simulacao = {
  de: { itemTitle: string }
  para: { itemTitle: string }
  comparacao: { precoAntigo: number; precoNovo: number; valorPago: number; diferenca: number; relacao: Relacao }
  tratamento: Tratamento | null
  fraseDoEmail: string
}

type TrocaListada = {
  _id: string
  userName: string
  userEmail: string
  de: { itemTitle: string }
  para: { itemTitle: string }
  comparacao: { diferenca: number; relacao: Relacao }
  tratamento: Tratamento | null
  emailEnviado: boolean
  emailErro?: string
  adminName: string
  criadoEm: string
}

/* ───────────────────────── apoio ───────────────────────── */

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function quando(valor?: string | null) {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// Espelha TRATAMENTOS_POR_RELACAO / ROTULO_DO_TRATAMENTO de lib/trocas-de-produto.
const TRATAMENTOS: Record<Relacao, { valor: Tratamento; rotulo: string }[]> = {
  mais_caro: [
    { valor: 'cortesia', rotulo: 'Sem custo para o aluno (upgrade de cortesia)' },
    { valor: 'diferenca_paga', rotulo: 'Diferença já paga ou combinada à parte' },
  ],
  mais_barato: [
    { valor: 'sem_reembolso', rotulo: 'Sem devolução da diferença' },
    { valor: 'reembolso_combinado', rotulo: 'Devolução da diferença combinada à parte' },
  ],
  mesmo_preco: [],
}

const SITUACAO: Record<SituacaoDaOferta, { rotulo: string; classe: string }> = {
  enviada: { rotulo: 'Enviada', classe: 'border-sky-300/30 bg-sky-400/10 text-sky-700 dark:text-sky-200' },
  aberta: { rotulo: 'Aberta', classe: 'border-amber-300/30 bg-amber-400/10 text-amber-700 dark:text-amber-200' },
  parcial: { rotulo: 'Comprou parte', classe: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200' },
  comprada: { rotulo: 'Comprada', classe: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200' },
  cancelada: { rotulo: 'Cancelada', classe: 'border-muted bg-muted text-muted-foreground' },
}

const ESTADO_DO_CUPOM: Record<string, string> = {
  ativo: 'ativo',
  esgotado: 'esgotado',
  expirado: 'vencido',
  inativo: 'desativado',
}

async function pedir<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init })
  const corpo = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(corpo.error || 'Algo deu errado.')
  return corpo as T
}

function useBusca<T>(termo: string, montarUrl: (q: string) => string, extrair: (corpo: any) => T[]) {
  const [resultados, setResultados] = useState<T[]>([])
  const [buscando, setBuscando] = useState(false)
  useEffect(() => {
    const q = termo.trim()
    if (q.length < 2) {
      setResultados([])
      return
    }
    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        setResultados(extrair(await pedir(montarUrl(q))))
      } catch {
        setResultados([])
      } finally {
        setBuscando(false)
      }
    }, 250)
    return () => clearTimeout(timer)
    // montarUrl/extrair são estáveis por chamada; só o termo dispara a busca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo])
  return { resultados, buscando }
}

/* ───────────────────────── página ───────────────────────── */

export default function AdminOfertasPage() {
  const router = useRouter()
  const [aba, setAba] = useState<'oferta' | 'troca'>('oferta')
  const [autorizado, setAutorizado] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (r) => {
        if (!r.ok) return router.push('/auth/login')
        const d = await r.json()
        if (d?.user?.role !== 'admin') return router.push('/')
        setAutorizado(true)
      })
      .catch(() => router.push('/auth/login'))
  }, [router])

  if (!autorizado) {
    return (
      <AppShell headerTitle="Ofertas e trocas" headerSubtitle="Carregando">
        <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppShell>
    )
  }

  return (
    <AppShell headerTitle="Ofertas e trocas" headerSubtitle="Carrinho exclusivo para uma pessoa e troca de produto">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Button variant="ghost" className="mb-4 w-fit gap-2" onClick={() => router.push('/admin')}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border p-1 sm:w-fit">
          <button
            type="button"
            onClick={() => setAba('oferta')}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${aba === 'oferta' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Gift className="h-4 w-4" /> Oferta exclusiva
          </button>
          <button
            type="button"
            onClick={() => setAba('troca')}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${aba === 'troca' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Repeat className="h-4 w-4" /> Trocar produto
          </button>
        </div>

        {aba === 'oferta' ? <AbaOferta /> : <AbaTroca />}
      </div>
    </AppShell>
  )
}

/* ───────────────────────── peças comuns ───────────────────────── */

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block">{rotulo}</Label>
      {children}
    </div>
  )
}

function Aviso({ tipo, children }: { tipo: 'erro' | 'ok'; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tipo === 'erro' ? 'border-destructive/20 bg-destructive/10 text-destructive' : 'border-emerald-300/30 bg-emerald-400/10 text-emerald-800 dark:text-emerald-200'}`}>
      {children}
    </div>
  )
}

function EscolherPessoa({ pessoa, onEscolher }: { pessoa: Pessoa | null; onEscolher: (p: Pessoa | null) => void }) {
  const [termo, setTermo] = useState('')
  const { resultados, buscando } = useBusca<Pessoa>(
    termo,
    (q) => `/api/admin/users/search?q=${encodeURIComponent(q)}`,
    (corpo) => (corpo.users || []).map((u: any) => ({ id: String(u.id || u._id), name: u.name || '', email: u.email || '' }))
  )

  if (pessoa) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{pessoa.name || 'Sem nome'}</p>
            <p className="truncate text-xs text-muted-foreground">{pessoa.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onEscolher(null)}>Trocar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={termo} onChange={(e) => setTermo(e.target.value)} className="pl-9" placeholder="Nome ou e-mail da pessoa..." />
        {buscando ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
      </div>
      {resultados.length > 0 ? (
        <div className="max-h-60 overflow-y-auto rounded-lg border">
          {resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onEscolher(p); setTermo('') }}
              className="flex w-full flex-col items-start border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted"
            >
              <span className="text-sm font-semibold">{p.name || 'Sem nome'}</span>
              <span className="text-xs text-muted-foreground">{p.email}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function BuscarProduto({ onEscolher, placeholder }: { onEscolher: (p: Produto) => void; placeholder: string }) {
  const [termo, setTermo] = useState('')
  const { resultados, buscando } = useBusca<Produto>(
    termo,
    (q) => `/api/admin/coupons/products?q=${encodeURIComponent(q)}`,
    // A oferta vira carrinho de materiais e a troca mexe em material_purchases:
    // nos dois, só material e pacote.
    (corpo) => (corpo.products || []).filter((p: any) => p.itemType === 'material' || p.itemType === 'package')
  )

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={termo} onChange={(e) => setTermo(e.target.value)} className="pl-9" placeholder={placeholder} />
        {buscando ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
      </div>
      {resultados.length > 0 ? (
        <div className="max-h-64 overflow-y-auto rounded-lg border">
          {resultados.map((p) => (
            <button
              key={`${p.itemType}:${p.itemId}`}
              type="button"
              onClick={() => { onEscolher(p); setTermo('') }}
              className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{p.title}</span>
                <span className="text-xs text-muted-foreground">
                  {p.typeLabel}{p.isHidden ? ' · oculto' : ''}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold">{p.pricing === 'paid' ? moeda.format(p.price) : 'Grátis'}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ───────────────────────── aba: oferta exclusiva ───────────────────────── */

type ModoCupom = 'nenhum' | 'novo' | 'existente'

function AbaOferta() {
  const [pessoa, setPessoa] = useState<Pessoa | null>(null)
  const [itens, setItens] = useState<Produto[]>([])
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [modoCupom, setModoCupom] = useState<ModoCupom>('novo')
  const [cupom, setCupom] = useState({
    codigo: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 15,
    usageLimit: '1',
    validade: 'duracao' as 'nenhuma' | 'duracao' | 'data',
    duracaoValor: 48,
    duracaoUnidade: 'hours' as 'hours' | 'days' | 'weeks' | 'months',
    data: '',
    stackWithTier: false,
  })
  const [codigoExistente, setCodigoExistente] = useState('')
  const [enviarEmail, setEnviarEmail] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState<{ link: string; couponCode: string | null; emailEnviado: boolean; emailErro: string | null; total: number; desconto: number } | null>(null)

  const [ofertas, setOfertas] = useState<OfertaListada[]>([])
  const [carregandoLista, setCarregandoLista] = useState(true)

  const carregar = useCallback(async () => {
    setCarregandoLista(true)
    try {
      const corpo = await pedir<{ ofertas: OfertaListada[] }>('/api/admin/ofertas')
      setOfertas(corpo.ofertas || [])
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregandoLista(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const subtotal = useMemo(() => itens.reduce((s, i) => s + (i.pricing === 'paid' ? i.price : 0), 0), [itens])
  const previaDesconto = useMemo(() => {
    if (modoCupom !== 'novo') return 0
    const valor = Number(cupom.discountValue || 0)
    if (cupom.discountType === 'percentage') return Math.min(subtotal, subtotal * (Math.min(100, valor) / 100))
    return Math.min(subtotal, valor)
  }, [cupom.discountType, cupom.discountValue, modoCupom, subtotal])

  function adicionar(p: Produto) {
    setItens((atual) => atual.some((i) => i.itemType === p.itemType && i.itemId === p.itemId) ? atual : [...atual, p])
  }

  function limpar() {
    setPessoa(null)
    setItens([])
    setTitulo('')
    setMensagem('')
    setCodigoExistente('')
    setCupom((c) => ({ ...c, codigo: '' }))
  }

  async function criar() {
    setErro('')
    setResultado(null)
    if (!pessoa) return setErro('Escolha a pessoa que vai receber a oferta.')
    if (itens.length === 0) return setErro('Adicione pelo menos um produto.')
    setSalvando(true)
    try {
      const corpoDoCupom = modoCupom === 'nenhum'
        ? { modo: 'nenhum' }
        : modoCupom === 'existente'
          ? { modo: 'existente', codigo: codigoExistente }
          : {
              modo: 'novo',
              codigo: cupom.codigo || undefined,
              discountType: cupom.discountType,
              discountValue: Number(cupom.discountValue || 0),
              usageLimit: cupom.usageLimit ? Number(cupom.usageLimit) : null,
              validade: cupom.validade,
              duracaoValor: cupom.validade === 'duracao' ? Number(cupom.duracaoValor || 0) : undefined,
              duracaoUnidade: cupom.validade === 'duracao' ? cupom.duracaoUnidade : undefined,
              data: cupom.validade === 'data' ? new Date(cupom.data).toISOString() : undefined,
              stackWithTier: cupom.stackWithTier,
            }
      const corpo = await pedir<any>('/api/admin/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pessoa.id,
          itens: itens.map((i) => ({ itemType: i.itemType, itemId: i.itemId })),
          titulo: titulo || undefined,
          mensagem: mensagem || undefined,
          cupom: corpoDoCupom,
          enviarEmail,
        }),
      })
      setResultado({
        link: corpo.link,
        couponCode: corpo.couponCode,
        emailEnviado: corpo.emailEnviado,
        emailErro: corpo.emailErro,
        total: corpo.vitrine?.total ?? 0,
        desconto: corpo.vitrine?.desconto ?? 0,
      })
      limpar()
      carregar()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  async function agir(oferta: OfertaListada, acao: 'cancelar' | 'reenviar') {
    if (acao === 'cancelar' && !confirm(`Cancelar a oferta de ${oferta.userName || oferta.userEmail}? O cupom criado por ela será desativado.`)) return
    setErro('')
    try {
      await pedir(`/api/admin/ofertas/${oferta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      })
      if (acao === 'reenviar') alert('E-mail reenviado.')
      carregar()
    } catch (e: any) {
      setErro(e.message)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" /> Montar oferta exclusiva
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Um carrinho só para esta pessoa, com cupom dela. Ela recebe por e-mail e no sino, abre a página da oferta e compra com o desconto já aplicado.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
          {resultado ? (
            <Aviso tipo="ok">
              <p className="font-semibold">Oferta criada{resultado.couponCode ? ` com o cupom ${resultado.couponCode}` : ''}.</p>
              <p className="mt-1">
                Total para a pessoa: {moeda.format(resultado.total)}
                {resultado.desconto > 0 ? ` (${moeda.format(resultado.desconto)} de desconto)` : ''}.
              </p>
              <p className="mt-1">
                {resultado.emailEnviado ? 'E-mail enviado.' : resultado.emailErro ? `E-mail não saiu: ${resultado.emailErro}.` : 'Sem e-mail (só no sino).'}
              </p>
              <button type="button" onClick={() => navigator.clipboard?.writeText(resultado.link)} className="mt-2 inline-flex items-center gap-1 font-semibold underline">
                <Copy className="h-3.5 w-3.5" /> Copiar link da oferta
              </button>
            </Aviso>
          ) : null}

          <Campo rotulo="Para quem">
            <EscolherPessoa pessoa={pessoa} onEscolher={setPessoa} />
          </Campo>

          <Campo rotulo="Produtos">
            <BuscarProduto onEscolher={adicionar} placeholder="Buscar material ou pacote..." />
          </Campo>
          {itens.length > 0 ? (
            <div className="space-y-2">
              {itens.map((i) => (
                <div key={`${i.itemType}:${i.itemId}`} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{i.title}</span>
                    <span className="text-xs text-muted-foreground">{i.typeLabel}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold">{i.pricing === 'paid' ? moeda.format(i.price) : 'Grátis'}</span>
                    <button type="button" onClick={() => setItens((a) => a.filter((x) => x !== i))} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Remover">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              ))}
              <p className="text-right text-sm text-muted-foreground">
                Catálogo: <strong className="text-foreground">{moeda.format(subtotal)}</strong>
                {previaDesconto > 0 ? <> · com cupom ≈ <strong className="text-emerald-600 dark:text-emerald-300">{moeda.format(subtotal - previaDesconto)}</strong></> : null}
              </p>
            </div>
          ) : null}

          <Campo rotulo="Título (opcional)">
            <Input value={titulo} maxLength={80} onChange={(e) => setTitulo(e.target.value)} placeholder="Uma oferta só para você" />
          </Campo>
          <Campo rotulo="Recado pessoal (opcional)">
            <Textarea value={mensagem} maxLength={600} onChange={(e) => setMensagem(e.target.value)} placeholder="Vi que você está estudando para a prova de cardio e separei isto para você..." />
          </Campo>

          <Campo rotulo="Cupom">
            <div className="grid grid-cols-3 gap-2">
              {([
                ['novo', 'Criar cupom só dela'],
                ['existente', 'Usar cupom existente'],
                ['nenhum', 'Sem cupom'],
              ] as [ModoCupom, string][]).map(([modo, rotulo]) => (
                <button
                  key={modo}
                  type="button"
                  onClick={() => setModoCupom(modo)}
                  className={`rounded-md border px-2 py-2 text-xs font-semibold transition ${modoCupom === modo ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </Campo>

          {modoCupom === 'novo' ? (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Tipo">
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={cupom.discountType} onChange={(e) => setCupom((c) => ({ ...c, discountType: e.target.value as any }))}>
                    <option value="percentage">Percentual</option>
                    <option value="fixed">Valor fixo</option>
                  </select>
                </Campo>
                <Campo rotulo={cupom.discountType === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}>
                  <Input type="number" min="0" step="0.01" value={cupom.discountValue} onChange={(e) => setCupom((c) => ({ ...c, discountValue: Number(e.target.value) }))} />
                </Campo>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Limite de usos">
                  <Input type="number" min="1" value={cupom.usageLimit} onChange={(e) => setCupom((c) => ({ ...c, usageLimit: e.target.value }))} placeholder="Sem limite" />
                </Campo>
                <Campo rotulo="Código (opcional)">
                  <Input value={cupom.codigo} onChange={(e) => setCupom((c) => ({ ...c, codigo: e.target.value.toUpperCase() }))} placeholder="Gerado sozinho" />
                </Campo>
              </div>
              <Campo rotulo="Validade">
                <div className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={cupom.validade} onChange={(e) => setCupom((c) => ({ ...c, validade: e.target.value as any }))}>
                    <option value="duracao">Por um tempo</option>
                    <option value="data">Até uma data</option>
                    <option value="nenhuma">Sem prazo</option>
                  </select>
                  {cupom.validade === 'duracao' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" min="1" value={cupom.duracaoValor} onChange={(e) => setCupom((c) => ({ ...c, duracaoValor: Number(e.target.value) }))} />
                      <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={cupom.duracaoUnidade} onChange={(e) => setCupom((c) => ({ ...c, duracaoUnidade: e.target.value as any }))}>
                        <option value="hours">Horas</option>
                        <option value="days">Dias</option>
                        <option value="weeks">Semanas</option>
                        <option value="months">Meses</option>
                      </select>
                    </div>
                  ) : cupom.validade === 'data' ? (
                    <Input type="datetime-local" value={cupom.data} onChange={(e) => setCupom((c) => ({ ...c, data: e.target.value }))} />
                  ) : null}
                </div>
              </Campo>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cupom.stackWithTier} onChange={(e) => setCupom((c) => ({ ...c, stackWithTier: e.target.checked }))} />
                Somar com o desconto de lote vigente
              </label>
              <p className="text-xs text-muted-foreground">
                O cupom vale só para esta conta e só para os produtos da oferta. Quando esgotar ou vencer, a página da oferta avisa e os itens seguem pelo preço normal.
              </p>
            </div>
          ) : modoCupom === 'existente' ? (
            <Campo rotulo="Código do cupom">
              <Input value={codigoExistente} onChange={(e) => setCodigoExistente(e.target.value.toUpperCase())} placeholder="EX: MED10" />
            </Campo>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enviarEmail} onChange={(e) => setEnviarEmail(e.target.checked)} />
            Enviar por e-mail (o aviso no sino vai sempre)
          </label>

          <Button className="w-full gap-2" onClick={criar} disabled={salvando}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Criar e enviar oferta
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase text-muted-foreground">Ofertas enviadas</h2>
        {carregandoLista ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : ofertas.length === 0 ? (
          <Card className="rounded-lg"><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma oferta ainda.</CardContent></Card>
        ) : ofertas.map((o) => (
          <Card key={o.id} className="rounded-lg">
            <CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{o.userName || o.userEmail}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.userEmail}</p>
                </div>
                <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${SITUACAO[o.situacao].classe}`}>{SITUACAO[o.situacao].rotulo}</span>
              </div>
              <ul className="space-y-0.5 text-sm">
                {o.itens.map((i) => <li key={`${i.itemType}:${i.itemId}`} className="truncate">• {i.titulo}</li>)}
              </ul>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {o.cupom ? (
                  <span>
                    Cupom <strong className="text-foreground">{o.cupom.codigo}</strong> · {ESTADO_DO_CUPOM[o.cupom.estado] || o.cupom.estado}
                    {typeof o.cupom.usosRestantes === 'number' ? ` · ${o.cupom.usosRestantes} uso(s) restante(s)` : ''}
                    {o.cupom.expiresAt ? ` · até ${quando(o.cupom.expiresAt)}` : ''}
                  </span>
                ) : <span>Sem cupom</span>}
                <span>Criada {quando(o.createdAt)} por {o.createdByName}</span>
                <span>{o.abertaEm ? `Aberta ${quando(o.abertaEm)}` : 'Ainda não aberta'}</span>
                {o.emailErro ? <span className="text-destructive">E-mail: {o.emailErro}</span> : o.emailEnviadoEm ? <span>E-mail {quando(o.emailEnviadoEm)}</span> : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/oferta/${o.id}`)}>
                  <Copy className="h-3.5 w-3.5" /> Link
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => window.open(`/oferta/${o.id}`, '_blank')}>
                  <Eye className="h-3.5 w-3.5" /> Prévia
                </Button>
                {o.situacao !== 'cancelada' ? (
                  <>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => agir(o, 'reenviar')}>
                      <Mail className="h-3.5 w-3.5" /> Reenviar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => agir(o, 'cancelar')}>
                      <Trash2 className="h-3.5 w-3.5" /> Cancelar
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── aba: troca de produto ───────────────────────── */

function AbaTroca() {
  const [pessoa, setPessoa] = useState<Pessoa | null>(null)
  const [compras, setCompras] = useState<Compra[]>([])
  const [carregandoCompras, setCarregandoCompras] = useState(false)
  const [compraId, setCompraId] = useState('')
  const [novo, setNovo] = useState<Produto | null>(null)
  const [tratamento, setTratamento] = useState<Tratamento | null>(null)
  const [observacao, setObservacao] = useState('')
  const [enviarEmail, setEnviarEmail] = useState(true)
  const [simulacao, setSimulacao] = useState<Simulacao | null>(null)
  const [simulando, setSimulando] = useState(false)
  const [trocando, setTrocando] = useState(false)
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState('')
  const [historico, setHistorico] = useState<TrocaListada[]>([])

  const carregarHistorico = useCallback(async () => {
    try {
      const corpo = await pedir<{ trocas: TrocaListada[] }>('/api/admin/trocas')
      setHistorico(corpo.trocas || [])
    } catch { /* o histórico é só apoio */ }
  }, [])

  useEffect(() => { carregarHistorico() }, [carregarHistorico])

  const carregarCompras = useCallback(async (p: Pessoa) => {
    setCarregandoCompras(true)
    setErro('')
    try {
      const corpo = await pedir<{ purchases: Compra[] }>(`/api/admin/users/${p.id}/purchases`)
      setCompras((corpo.purchases || []).filter((c) =>
        (c.itemType === 'material' || c.itemType === 'package') && c.source !== 'plus'
      ))
    } catch (e: any) {
      setErro(e.message)
      setCompras([])
    } finally {
      setCarregandoCompras(false)
    }
  }, [])

  useEffect(() => {
    setCompraId('')
    setSimulacao(null)
    if (pessoa) carregarCompras(pessoa)
    else setCompras([])
  }, [pessoa, carregarCompras])

  // Simula sempre que a escolha muda: o admin vê preço e frase antes de trocar.
  useEffect(() => {
    setSimulacao(null)
    if (!compraId || !novo) return
    let vivo = true
    setSimulando(true)
    setErro('')
    pedir<Simulacao>('/api/admin/trocas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseId: compraId, novoItemType: novo.itemType, novoItemId: novo.itemId, tratamento, simular: true }),
    })
      .then((s) => {
        if (!vivo) return
        setSimulacao(s)
        if (s.tratamento !== tratamento) setTratamento(s.tratamento)
      })
      .catch((e) => { if (vivo) setErro(e.message) })
      .finally(() => { if (vivo) setSimulando(false) })
    return () => { vivo = false }
  }, [compraId, novo, tratamento])

  async function trocar() {
    if (!simulacao || !novo || !pessoa) return
    const c = simulacao.comparacao
    const aviso = c.relacao === 'mais_caro'
      ? `ATENÇÃO: o novo produto é MAIS CARO (+${moeda.format(c.diferenca)}).`
      : c.relacao === 'mais_barato'
        ? `ATENÇÃO: o novo produto é MAIS BARATO (−${moeda.format(Math.abs(c.diferenca))}).`
        : 'Os dois produtos têm o mesmo preço.'
    if (!confirm(`${aviso}\n\nTrocar "${simulacao.de.itemTitle}" por "${simulacao.para.itemTitle}" para ${pessoa.name || pessoa.email}?\nO acesso ao produto antigo será encerrado.`)) return

    setTrocando(true)
    setErro('')
    setFeito('')
    try {
      const corpo = await pedir<any>('/api/admin/trocas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: compraId,
          novoItemType: novo.itemType,
          novoItemId: novo.itemId,
          tratamento,
          observacao: observacao || undefined,
          enviarEmail,
        }),
      })
      setFeito(
        `Troca feita: ${simulacao.de.itemTitle} → ${simulacao.para.itemTitle}. ` +
        (corpo.emailEnviado ? 'E-mail enviado.' : corpo.emailErro ? `E-mail não saiu: ${corpo.emailErro}.` : 'Sem e-mail.')
      )
      setNovo(null)
      setObservacao('')
      setTratamento(null)
      carregarCompras(pessoa)
      carregarHistorico()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setTrocando(false)
    }
  }

  const relacao = simulacao?.comparacao.relacao
  const opcoes = relacao ? TRATAMENTOS[relacao] : []

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Repeat className="h-5 w-5 text-primary" /> Trocar produto
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            A pessoa perde o acesso ao produto atual e ganha o novo, com o mesmo valor pago e o mesmo prazo (se for acesso por tempo). Ela é avisada por e-mail.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
          {feito ? <Aviso tipo="ok">{feito}</Aviso> : null}

          <Campo rotulo="Pessoa">
            <EscolherPessoa pessoa={pessoa} onEscolher={setPessoa} />
          </Campo>

          {pessoa ? (
            <Campo rotulo="Produto que ela tem">
              {carregandoCompras ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : compras.length === 0 ? (
                <p className="rounded-lg border px-3 py-3 text-sm text-muted-foreground">Nenhum material ou pacote comprado.</p>
              ) : (
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {compras.map((c) => (
                    <label key={c._id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 ${compraId === c._id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                      <span className="flex min-w-0 items-center gap-2">
                        <input type="radio" name="compra" checked={compraId === c._id} onChange={() => setCompraId(c._id)} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{c.itemTitle || 'Sem título'}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.itemType === 'package' ? 'Pacote' : 'Material'} · {quando(c.purchasedAt)}
                            {c.source === 'swap' ? ' · veio de troca' : c.source === 'manual' ? ' · concedido' : ''}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold">{moeda.format(Number(c.price || 0))}</span>
                    </label>
                  ))}
                </div>
              )}
            </Campo>
          ) : null}

          {compraId ? (
            <Campo rotulo="Trocar por">
              {novo ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{novo.title}</span>
                    <span className="text-xs text-muted-foreground">{novo.typeLabel}</span>
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setNovo(null)}>Trocar</Button>
                </div>
              ) : (
                <BuscarProduto onEscolher={(p) => { setTratamento(null); setNovo(p) }} placeholder="Buscar o produto novo..." />
              )}
            </Campo>
          ) : null}

          {simulando ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : simulacao ? (
            <ComparacaoCard simulacao={simulacao} />
          ) : null}

          {simulacao && opcoes.length > 0 ? (
            <Campo rotulo="Como fica a diferença">
              <div className="space-y-1">
                {opcoes.map((o) => (
                  <label key={o.valor} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="tratamento" checked={tratamento === o.valor} onChange={() => setTratamento(o.valor)} />
                    {o.rotulo}
                  </label>
                ))}
              </div>
            </Campo>
          ) : null}

          {simulacao ? (
            <>
              <Campo rotulo="Observação para a pessoa (opcional)">
                <Textarea value={observacao} maxLength={500} onChange={(e) => setObservacao(e.target.value)} placeholder="Conforme combinamos no atendimento..." />
              </Campo>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={enviarEmail} onChange={(e) => setEnviarEmail(e.target.checked)} />
                Avisar por e-mail que a troca foi feita
              </label>
              {enviarEmail ? (
                <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  No e-mail: “{simulacao.fraseDoEmail}”
                </p>
              ) : null}
              <Button className="w-full gap-2" onClick={trocar} disabled={trocando}>
                {trocando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
                Confirmar troca
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase text-muted-foreground">Trocas recentes</h2>
        {historico.length === 0 ? (
          <Card className="rounded-lg"><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhuma troca ainda.</CardContent></Card>
        ) : historico.map((t) => (
          <Card key={t._id} className="rounded-lg">
            <CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.userName || t.userEmail}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.userEmail}</p>
                </div>
                <BadgeDeRelacao relacao={t.comparacao.relacao} diferenca={t.comparacao.diferenca} />
              </div>
              <p className="flex flex-wrap items-center gap-1 text-sm">
                <span className="text-muted-foreground line-through">{t.de.itemTitle}</span>
                <ArrowRight className="h-3.5 w-3.5" />
                <span className="font-semibold">{t.para.itemTitle}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {quando(t.criadoEm)} por {t.adminName}
                {t.tratamento ? ` · ${TRATAMENTOS[t.comparacao.relacao].find((o) => o.valor === t.tratamento)?.rotulo}` : ''}
                {' · '}{t.emailEnviado ? 'e-mail enviado' : t.emailErro ? `e-mail não saiu (${t.emailErro})` : 'sem e-mail'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function BadgeDeRelacao({ relacao, diferenca }: { relacao: Relacao; diferenca: number }) {
  if (relacao === 'mais_caro') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-orange-400/40 bg-orange-500/10 px-2 py-1 text-xs font-bold text-orange-700 dark:text-orange-200">
        <ArrowUpRight className="h-3.5 w-3.5" /> Mais caro +{moeda.format(diferenca)}
      </span>
    )
  }
  if (relacao === 'mais_barato') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-sky-400/40 bg-sky-500/10 px-2 py-1 text-xs font-bold text-sky-700 dark:text-sky-200">
        <ArrowDownRight className="h-3.5 w-3.5" /> Mais barato −{moeda.format(Math.abs(diferenca))}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-200">
      <Check className="h-3.5 w-3.5" /> Mesmo preço
    </span>
  )
}

function ComparacaoCard({ simulacao }: { simulacao: Simulacao }) {
  const c = simulacao.comparacao
  const destaque = c.relacao === 'mais_caro'
    ? 'border-orange-400/50 bg-orange-500/5'
    : c.relacao === 'mais_barato'
      ? 'border-sky-400/50 bg-sky-500/5'
      : 'border-emerald-400/40 bg-emerald-500/5'
  return (
    <div className={`space-y-3 rounded-lg border-2 p-3 ${destaque}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase text-muted-foreground">Comparação de preço</span>
        <BadgeDeRelacao relacao={c.relacao} diferenca={c.diferenca} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm">
        <div className="min-w-0">
          <p className="truncate text-muted-foreground line-through">{simulacao.de.itemTitle}</p>
          <p className="font-bold">{moeda.format(c.precoAntigo)}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{simulacao.para.itemTitle}</p>
          <p className="font-bold">{moeda.format(c.precoNovo)}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Preços de catálogo de hoje. A pessoa pagou {moeda.format(c.valorPago)} na compra original
        {c.relacao === 'mais_caro' ? ' — a troca dá a ela um produto de valor maior.' : c.relacao === 'mais_barato' ? ' — ela recebe um produto de valor menor.' : '.'}
      </p>
    </div>
  )
}
