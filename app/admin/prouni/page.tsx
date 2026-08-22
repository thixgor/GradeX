'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  BadgePercent,
  Check,
  Eraser,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/**
 * Painel PROUNI/FIES.
 *
 * Duas abas porque são dois trabalhos diferentes com ritmos diferentes: montar
 * a campanha ("quanto este produto dá a bolsista") acontece uma vez; analisar
 * solicitação acontece todo dia. Juntar as duas numa tela só faria a fila de
 * análise — a parte que trava a vida de alguém esperando resposta — competir
 * espaço com um formulário de configuração que quase nunca muda.
 */

type Aba = 'descontos' | 'solicitacoes'

interface Produto {
  itemType: 'material' | 'package' | 'manual_clinico' | 'plus'
  itemId: string
  title: string
  typeLabel: string
  price: number
  isHidden?: boolean
  recurring?: boolean
  href?: string
}

interface Beneficio {
  id: string
  itemType: Produto['itemType']
  itemId: string
  itemTitle: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  discountLabel: string
  stackWithTier: boolean
  grantValidityDays: number | null
  instructions: string
  isActive: boolean
  product: Produto | null
  pendingCount: number
}

interface Solicitacao {
  id: string
  userName: string
  userEmail: string
  itemType: string
  itemId: string
  itemTitle: string
  programLabel: string
  applicant: {
    fullName: string
    cpf: string
    email: string
    phone: string
    dateOfBirth: string | null
    institution: string
    courseName: string
  }
  attachments: Array<{ id: string; filename: string; contentType: string; sizeBytes: number }>
  attachmentsPurgedAt: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewNotes: string
  reviewedByName: string
  reviewedAt: string | null
  grant: {
    discountLabel: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    stackWithTier: boolean
    usage: string
    expiresAt: string | null
  } | null
  createdAt: string | null
}

function formatarReais(valor: number) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`
}

function formatarCpf(digitos: string) {
  const n = String(digitos || '').replace(/\D/g, '')
  if (n.length !== 11) return digitos || '—'
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

export default function AdminProuniPage() {
  const router = useRouter()
  const [aba, setAba] = useState<Aba>('solicitacoes')

  return (
    <AppShell headerTitle="PROUNI / FIES" headerSubtitle="Descontos para bolsistas">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <button
          onClick={() => router.push('/admin')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </button>

        <div className="mb-5 flex gap-2">
          {([
            ['solicitacoes', 'Solicitações'],
            ['descontos', 'Descontos por produto'],
          ] as const).map(([chave, rotulo]) => (
            <button
              key={chave}
              onClick={() => setAba(chave)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                aba === chave
                  ? 'bg-sky-600 text-white'
                  : 'border border-border text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {aba === 'descontos' ? <AbaDescontos /> : <AbaSolicitacoes />}
      </div>
    </AppShell>
  )
}

/* =================== ABA: DESCONTOS POR PRODUTO =================== */

function AbaDescontos() {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Produto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [selecionado, setSelecionado] = useState<Produto | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 30,
    stackWithTier: false,
    grantValidityDays: '' as string,
    instructions: '',
    isActive: true,
  })

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/admin/prouni/beneficios', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Falha ao carregar')
      setBeneficios(json.benefits || [])
    } catch (e: any) {
      setErro(e?.message || 'Falha ao carregar')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    if (busca.trim().length < 2) {
      setResultados([])
      return
    }
    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await fetch(`/api/admin/prouni/produtos?q=${encodeURIComponent(busca.trim())}`, { cache: 'no-store' })
        const json = await res.json()
        setResultados(json.products || [])
      } catch {
        setResultados([])
      } finally {
        setBuscando(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busca])

  async function salvar() {
    if (!selecionado) return
    setErro('')
    setSalvando(true)
    try {
      const res = await fetch('/api/admin/prouni/beneficios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: selecionado.itemType,
          itemId: selecionado.itemId,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          stackWithTier: form.stackWithTier,
          grantValidityDays: form.grantValidityDays ? Number(form.grantValidityDays) : null,
          instructions: form.instructions,
          isActive: form.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Falha ao salvar')
      setSelecionado(null)
      setBusca('')
      await carregar()
    } catch (e: any) {
      setErro(e?.message || 'Falha ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function remover(id: string) {
    if (!confirm('Remover este desconto? Quem já foi aprovado mantém o benefício.')) return
    try {
      const res = await fetch(`/api/admin/prouni/beneficios?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Falha ao remover')
      }
      await carregar()
    } catch (e: any) {
      setErro(e?.message || 'Falha ao remover')
    }
  }

  function editar(beneficio: Beneficio) {
    setSelecionado({
      itemType: beneficio.itemType,
      itemId: beneficio.itemId,
      title: beneficio.itemTitle,
      typeLabel: beneficio.product?.typeLabel || '',
      price: beneficio.product?.price || 0,
    })
    setForm({
      discountType: beneficio.discountType,
      discountValue: beneficio.discountValue,
      stackWithTier: beneficio.stackWithTier,
      grantValidityDays: beneficio.grantValidityDays ? String(beneficio.grantValidityDays) : '',
      instructions: beneficio.instructions,
      isActive: beneficio.isActive,
    })
  }

  return (
    <div className="space-y-5">
      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            {selecionado ? 'Configurar desconto' : 'Adicionar desconto a um produto'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selecionado ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar material, pacote, flashcards, Manual Clínico ou plano…"
                  className="pl-9"
                />
              </div>
              {buscando && <p className="text-sm text-muted-foreground">Buscando…</p>}
              {resultados.length > 0 && (
                <ul className="divide-y divide-border/60 rounded-lg border border-border">
                  {resultados.map((produto) => (
                    <li key={`${produto.itemType}:${produto.itemId}`}>
                      <button
                        onClick={() => setSelecionado(produto)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50"
                      >
                        <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                          {produto.typeLabel}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{produto.title}</span>
                        <span className="shrink-0 text-sm text-muted-foreground">{formatarReais(produto.price)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{selecionado.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {selecionado.typeLabel} · {formatarReais(selecionado.price)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelecionado(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {selecionado.recurring && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Este plano é cobrado por assinatura recorrente. O benefício de uso único não
                  incide nessas cobranças — configure em planos de pagamento avulso.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tipo de desconto</Label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {([['percentage', '% percentual'], ['fixed', 'R$ fixo']] as const).map(([valor, rotulo]) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => setForm({ ...form, discountType: valor })}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                          form.discountType === valor
                            ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                            : 'border-border text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {rotulo}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="valor">
                    {form.discountType === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    min={0}
                    max={form.discountType === 'percentage' ? 100 : undefined}
                    step="0.01"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="validade">Validade do desconto aprovado (dias)</Label>
                  <Input
                    id="validade"
                    type="number"
                    min={1}
                    max={365}
                    placeholder="Sem prazo"
                    value={form.grantValidityDays}
                    onChange={(e) => setForm({ ...form, grantValidityDays: e.target.value })}
                  />
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.stackWithTier}
                      onChange={(e) => setForm({ ...form, stackWithTier: e.target.checked })}
                      className="h-4 w-4 accent-sky-600"
                    />
                    Somar com o desconto de lote
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="h-4 w-4 accent-sky-600"
                    />
                    Ativo
                  </label>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Sem &quot;somar com lote&quot;, vale o maior desconto entre lote, cupom e PROUNI/FIES —
                o bolsista nunca paga mais que os demais. Com a opção ligada, o PROUNI incide
                sobre o preço já com o lote.
              </p>

              <div>
                <Label htmlFor="instrucoes">Texto exibido na página exclusiva (opcional)</Label>
                <Textarea
                  id="instrucoes"
                  rows={3}
                  maxLength={600}
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="Ex.: envie o termo de concessão de bolsa atualizado (2026)."
                />
              </div>

              <Button onClick={salvar} disabled={salvando} className="w-full">
                {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Salvar desconto
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BadgePercent className="h-5 w-5" />
            Descontos configurados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : beneficios.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum produto oferece desconto PROUNI/FIES ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {beneficios.map((beneficio) => (
                <li key={beneficio.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {beneficio.product?.title || beneficio.itemTitle}
                      {!beneficio.product && (
                        <span className="ml-2 text-xs font-normal text-rose-600">produto removido</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {beneficio.product?.typeLabel || beneficio.itemType} · {beneficio.discountLabel}
                      {beneficio.stackWithTier && ' · soma com lote'}
                      {beneficio.grantValidityDays ? ` · vale ${beneficio.grantValidityDays} dias` : ''}
                      {beneficio.pendingCount > 0 && ` · ${beneficio.pendingCount} em análise`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      beneficio.isActive
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {beneficio.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => editar(beneficio)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remover(beneficio.id)}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* =================== ABA: SOLICITAÇÕES =================== */

function AbaSolicitacoes() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [busca, setBusca] = useState('')
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [contagens, setContagens] = useState({ pending: 0, approved: 0, rejected: 0, cancelled: 0 })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [limpando, setLimpando] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = new URLSearchParams({ status })
      if (busca.trim()) params.set('q', busca.trim())
      const res = await fetch(`/api/admin/prouni/solicitacoes?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Falha ao carregar')
      setSolicitacoes(json.requests || [])
      setContagens(json.counts || { pending: 0, approved: 0, rejected: 0, cancelled: 0 })
    } catch (e: any) {
      setErro(e?.message || 'Falha ao carregar')
    } finally {
      setCarregando(false)
    }
  }, [status, busca])

  useEffect(() => {
    const timer = setTimeout(carregar, busca ? 300 : 0)
    return () => clearTimeout(timer)
  }, [carregar, busca])

  async function limpezaEmLote() {
    if (!confirm('Apagar os arquivos de todas as solicitações já analisadas? O histórico das decisões é mantido.')) return
    setLimpando(true)
    try {
      const res = await fetch('/api/admin/prouni/limpeza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olderThanDays: 0, limit: 100 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Falha na limpeza')
      alert(`${json.files} arquivo(s) apagado(s) em ${json.requests} solicitação(ões).`)
      await carregar()
    } catch (e: any) {
      setErro(e?.message || 'Falha na limpeza')
    } finally {
      setLimpando(false)
    }
  }

  return (
    <div className="space-y-4">
      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {([
          ['pending', `Em análise (${contagens.pending})`],
          ['approved', `Aprovadas (${contagens.approved})`],
          ['rejected', `Recusadas (${contagens.rejected})`],
          ['all', 'Todas'],
        ] as const).map(([chave, rotulo]) => (
          <button
            key={chave}
            onClick={() => setStatus(chave)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              status === chave
                ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {rotulo}
          </button>
        ))}
        <div className="relative ml-auto min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, e-mail, CPF ou item"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">
          Comprovantes ficam em armazenamento privado. Depois da análise, apague-os para
          liberar espaço — o histórico da decisão permanece.
        </p>
        <Button variant="outline" size="sm" onClick={limpezaEmLote} disabled={limpando}>
          {limpando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eraser className="mr-2 h-4 w-4" />}
          Limpar analisadas
        </Button>
      </div>

      {carregando ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : solicitacoes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <GraduationCap className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma solicitação nesta lista.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {solicitacoes.map((solicitacao) => (
            <CartaoSolicitacao key={solicitacao.id} solicitacao={solicitacao} onMudou={carregar} />
          ))}
        </div>
      )}
    </div>
  )
}

function CartaoSolicitacao({ solicitacao, onMudou }: { solicitacao: Solicitacao; onMudou: () => void }) {
  const [notas, setNotas] = useState('')
  const [descontoTipo, setDescontoTipo] = useState<'percentage' | 'fixed' | ''>('')
  const [descontoValor, setDescontoValor] = useState('')
  const [apagarAnexos, setApagarAnexos] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  const pendente = solicitacao.status === 'pending'

  async function decidir(acao: 'approve' | 'reject' | 'revoke') {
    if (acao === 'reject' && !notas.trim()) {
      setErro('Escreva o motivo da recusa — ele é mostrado a quem pediu.')
      return
    }
    if (acao === 'revoke' && !confirm('Revogar o desconto aprovado desta pessoa?')) return
    setErro('')
    setProcessando(true)
    try {
      const res = await fetch(`/api/admin/prouni/solicitacoes/${solicitacao.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: acao,
          notes: notas.trim() || undefined,
          ...(acao === 'approve' && descontoTipo ? { discountType: descontoTipo } : {}),
          ...(acao === 'approve' && descontoValor ? { discountValue: Number(descontoValor) } : {}),
          purgeAttachments: apagarAnexos,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Falha ao analisar')
      onMudou()
    } catch (e: any) {
      setErro(e?.message || 'Falha ao analisar')
    } finally {
      setProcessando(false)
    }
  }

  async function apagarSomenteArquivos() {
    if (!confirm('Apagar os arquivos desta solicitação?')) return
    setProcessando(true)
    try {
      const res = await fetch(`/api/admin/prouni/solicitacoes/${solicitacao.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Falha ao apagar')
      }
      onMudou()
    } catch (e: any) {
      setErro(e?.message || 'Falha ao apagar')
    } finally {
      setProcessando(false)
    }
  }

  const cores: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    cancelled: 'bg-muted text-muted-foreground',
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {solicitacao.applicant.fullName || solicitacao.userName}
              <span className="ml-2 rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                {solicitacao.programLabel}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {solicitacao.itemTitle} · pedido em{' '}
              {solicitacao.createdAt ? new Date(solicitacao.createdAt).toLocaleString('pt-BR') : '—'}
            </p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cores[solicitacao.status]}`}>
            {solicitacao.status === 'pending' ? 'Em análise'
              : solicitacao.status === 'approved' ? 'Aprovada'
              : solicitacao.status === 'rejected' ? 'Recusada' : 'Cancelada'}
          </span>
        </div>

        <div className="grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
          <p><span className="font-medium text-foreground">CPF:</span> {formatarCpf(solicitacao.applicant.cpf)}</p>
          <p><span className="font-medium text-foreground">Nascimento:</span>{' '}
            {solicitacao.applicant.dateOfBirth
              ? new Date(solicitacao.applicant.dateOfBirth).toLocaleDateString('pt-BR')
              : '—'}
          </p>
          <p><span className="font-medium text-foreground">E-mail:</span> {solicitacao.applicant.email}</p>
          <p><span className="font-medium text-foreground">Telefone:</span> {solicitacao.applicant.phone}</p>
          <p><span className="font-medium text-foreground">Faculdade:</span> {solicitacao.applicant.institution}</p>
          <p><span className="font-medium text-foreground">Curso:</span> {solicitacao.applicant.courseName || '—'}</p>
          <p className="sm:col-span-2">
            <span className="font-medium text-foreground">Conta:</span> {solicitacao.userEmail}
          </p>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold">Comprovantes</p>
          {solicitacao.attachments.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {solicitacao.attachmentsPurgedAt
                ? `Arquivos apagados em ${new Date(solicitacao.attachmentsPurgedAt).toLocaleString('pt-BR')}.`
                : 'Sem arquivos.'}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {solicitacao.attachments.map((anexo) => (
                <li key={anexo.id}>
                  <a
                    href={`/api/admin/prouni/solicitacoes/${solicitacao.id}/anexo/${anexo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/50"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="max-w-[220px] truncate">{anexo.filename}</span>
                    <span className="text-muted-foreground">
                      {(anexo.sizeBytes / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {solicitacao.grant && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-xs">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              Desconto concedido: {solicitacao.grant.discountLabel}
            </span>
            {solicitacao.grant.stackWithTier && ' · soma com lote'}
            {' · '}
            {solicitacao.grant.usage === 'used' ? 'já utilizado'
              : solicitacao.grant.usage === 'reserved' ? 'reservado num pedido'
              : 'disponível'}
            {solicitacao.grant.expiresAt &&
              ` · vence em ${new Date(solicitacao.grant.expiresAt).toLocaleDateString('pt-BR')}`}
          </div>
        )}

        {!pendente && solicitacao.reviewNotes && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Observação:</span> {solicitacao.reviewNotes}
            {solicitacao.reviewedByName && ` — ${solicitacao.reviewedByName}`}
          </p>
        )}

        {erro && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{erro}</p>
        )}

        {pendente ? (
          <div className="space-y-2.5 border-t border-border/60 pt-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Tipo (opcional)</Label>
                <select
                  value={descontoTipo}
                  onChange={(e) => setDescontoTipo(e.target.value as any)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                >
                  <option value="">Usar o do produto</option>
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Valor (opcional)</Label>
                <Input
                  className="mt-1 h-9"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Padrão do produto"
                  value={descontoValor}
                  onChange={(e) => setDescontoValor(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={apagarAnexos}
                    onChange={(e) => setApagarAnexos(e.target.checked)}
                    className="h-4 w-4 accent-sky-600"
                  />
                  Apagar arquivos ao decidir
                </label>
              </div>
            </div>
            <Textarea
              rows={2}
              maxLength={600}
              placeholder="Observação (obrigatória na recusa — a pessoa lê este texto)"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={processando} onClick={() => decidir('approve')}>
                {processando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Aprovar desconto
              </Button>
              <Button size="sm" variant="outline" disabled={processando} onClick={() => decidir('reject')}>
                <X className="mr-2 h-4 w-4" />
                Recusar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {solicitacao.attachments.length > 0 && (
              <Button size="sm" variant="outline" disabled={processando} onClick={apagarSomenteArquivos}>
                <Eraser className="mr-2 h-4 w-4" />
                Apagar arquivos
              </Button>
            )}
            {solicitacao.status === 'approved' && solicitacao.grant?.usage === 'available' && (
              <Button size="sm" variant="outline" disabled={processando} onClick={() => decidir('revoke')}>
                <X className="mr-2 h-4 w-4" />
                Revogar desconto
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
