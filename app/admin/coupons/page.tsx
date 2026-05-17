'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BadgePercent,
  Building2,
  CalendarClock,
  Check,
  Loader2,
  Package,
  Percent,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { INSTITUTION_UNITS } from '@/lib/institution-units'

type CouponScope = 'all' | 'materials' | 'flashcards' | 'specific'
type DiscountType = 'percentage' | 'fixed'
type ExpirationMode = 'none' | 'date' | 'duration'
type DurationUnit = 'hours' | 'days' | 'weeks' | 'months'
type ProductKind = 'material' | 'flashcard' | 'package'

type ProductRef = {
  itemType: 'material' | 'package'
  itemId: string
  title: string
  kind: ProductKind
}

type Coupon = {
  id: string
  code: string
  description: string
  discountType: DiscountType
  discountValue: number
  scope: CouponScope
  productRefs: ProductRef[]
  usageLimit: number | null
  perUserLimit: number | null
  minimumCartAmount: number | null
  firstPurchaseOnly: boolean
  allowedAfyaUnits: string[]
  usageCount: number
  expiresAt: string | null
  durationValue: number | null
  durationUnit: DurationUnit | null
  isActive: boolean
  createdAt: string | null
  stats: {
    approvedUses: number
    uniqueUsers: number
    revenueAttributed: number
    discountGiven: number
    lastUsedAt: string | null
  }
}

type ProductSearchResult = ProductRef & {
  typeLabel: string
  price: number
  pricing: 'free' | 'paid'
  isHidden: boolean
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const scopeLabels: Record<CouponScope, string> = {
  all: 'Todos os Materiais e Flashcards',
  materials: 'Todos os Materiais',
  flashcards: 'Todos os Flashcards',
  specific: 'Itens específicos',
}

const durationLabels: Record<DurationUnit, string> = {
  hours: 'Horas',
  days: 'Dias',
  weeks: 'Semanas',
  months: 'Meses',
}

function emptyForm() {
  return {
    code: '',
    description: '',
    discountType: 'percentage' as DiscountType,
    discountValue: 10,
    scope: 'all' as CouponScope,
    productRefs: [] as ProductRef[],
    usageLimit: '',
    perUserLimit: '',
    minimumCartAmount: '',
    firstPurchaseOnly: false,
    allowedAfyaUnits: [] as string[],
    expirationMode: 'none' as ExpirationMode,
    expiresAt: '',
    durationValue: 7,
    durationUnit: 'days' as DurationUnit,
    isActive: true,
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'Sem término'
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function couponLabel(coupon: Pick<Coupon, 'discountType' | 'discountValue'>) {
  if (coupon.discountType === 'percentage') return `${coupon.discountValue}%`
  return currency.format(coupon.discountValue)
}

function productTone(kind: ProductKind) {
  if (kind === 'flashcard') return 'border-violet-300/25 bg-violet-400/10 text-violet-700 dark:text-violet-200'
  if (kind === 'package') return 'border-amber-300/25 bg-amber-400/10 text-amber-700 dark:text-amber-200'
  return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200'
}

export default function AdminCouponsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([])
  const [productLoading, setProductLoading] = useState(false)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const query = productQuery.trim()
    if (form.scope !== 'specific' || query.length < 2) {
      setProductResults([])
      return
    }

    const timer = setTimeout(async () => {
      setProductLoading(true)
      try {
        const res = await fetch(`/api/admin/coupons/products?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) setProductResults(data.products || [])
      } finally {
        setProductLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [productQuery, form.scope])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const auth = await fetch('/api/auth/me')
      if (!auth.ok) {
        router.push('/auth/login')
        return
      }
      const authData = await auth.json()
      if (authData.user.role !== 'admin') {
        router.push('/')
        return
      }

      const res = await fetch('/api/admin/coupons', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar cupons')
      setCoupons(data.coupons || [])
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar cupons')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm())
    setProductQuery('')
    setProductResults([])
  }

  function editCoupon(coupon: Coupon) {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      scope: coupon.scope,
      productRefs: coupon.productRefs || [],
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      perUserLimit: coupon.perUserLimit ? String(coupon.perUserLimit) : '',
      minimumCartAmount: coupon.minimumCartAmount ? String(coupon.minimumCartAmount) : '',
      firstPurchaseOnly: coupon.firstPurchaseOnly === true,
      allowedAfyaUnits: coupon.allowedAfyaUnits || [],
      expirationMode: coupon.durationValue && coupon.durationUnit ? 'duration' : coupon.expiresAt ? 'date' : 'none',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : '',
      durationValue: coupon.durationValue || 7,
      durationUnit: coupon.durationUnit || 'days',
      isActive: coupon.isActive,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function addProduct(product: ProductSearchResult) {
    const exists = form.productRefs.some((ref) => ref.itemType === product.itemType && ref.itemId === product.itemId)
    if (exists) return
    setForm((current) => ({
      ...current,
      productRefs: [
        ...current.productRefs,
        {
          itemType: product.itemType,
          itemId: product.itemId,
          title: product.title,
          kind: product.kind,
        },
      ],
    }))
  }

  function removeProduct(product: ProductRef) {
    setForm((current) => ({
      ...current,
      productRefs: current.productRefs.filter((ref) => !(ref.itemType === product.itemType && ref.itemId === product.itemId)),
    }))
  }

  async function saveCoupon() {
    setSaving(true)
    setError('')
    try {
      const payload = {
        code: form.code,
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue || 0),
        scope: form.scope,
        productRefs: form.scope === 'specific' ? form.productRefs : [],
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
        minimumCartAmount: form.minimumCartAmount ? Number(form.minimumCartAmount) : null,
        firstPurchaseOnly: form.firstPurchaseOnly,
        allowedAfyaUnits: form.allowedAfyaUnits,
        expirationMode: form.expirationMode,
        expiresAt: form.expirationMode === 'date' ? form.expiresAt : undefined,
        durationValue: form.expirationMode === 'duration' ? Number(form.durationValue || 0) : undefined,
        durationUnit: form.expirationMode === 'duration' ? form.durationUnit : undefined,
        isActive: form.isActive,
      }
      const res = await fetch(editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar cupom')
      resetForm()
      await load()
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar cupom')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!confirm(`Excluir o cupom ${coupon.code}?`)) return
    setError('')
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error || 'Erro ao excluir cupom')
      return
    }
    await load()
    if (editingId === coupon.id) resetForm()
  }

  function toggleAfyaUnit(unit: string) {
    setForm((current) => ({
      ...current,
      allowedAfyaUnits: current.allowedAfyaUnits.includes(unit)
        ? current.allowedAfyaUnits.filter((item) => item !== unit)
        : [...current.allowedAfyaUnits, unit],
    }))
  }

  const totals = useMemo(() => coupons.reduce(
    (acc, coupon) => ({
      coupons: acc.coupons + 1,
      active: acc.active + (coupon.isActive ? 1 : 0),
      uses: acc.uses + coupon.stats.approvedUses,
      revenue: acc.revenue + coupon.stats.revenueAttributed,
    }),
    { coupons: 0, active: 0, uses: 0, revenue: 0 }
  ), [coupons])

  if (loading) {
    return <AppShell headerTitle="Cupons" headerSubtitle="Carregando"><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>
  }

  return (
    <AppShell headerTitle="Cupons" headerSubtitle="Descontos para materiais, flashcards e pacotes">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" className="w-fit gap-2" onClick={() => router.push('/admin')}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button variant="outline" className="w-fit gap-2" onClick={resetForm}>
            <Plus className="h-4 w-4" /> Novo cupom
          </Button>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={BadgePercent} label="Cupons" value={String(totals.coupons)} />
          <SummaryCard icon={Check} label="Ativos" value={String(totals.active)} />
          <SummaryCard icon={Percent} label="Usos aprovados" value={String(totals.uses)} />
          <SummaryCard icon={Tag} label="Receita atribuída" value={currency.format(totals.revenue)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BadgePercent className="h-5 w-5 text-primary" />
                {editingId ? 'Editar cupom' : 'Criar cupom'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <Field label="Código">
                  <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="EX: MED10" />
                </Field>
                <Field label="Status">
                  <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                    Ativo
                  </label>
                </Field>
              </div>

              <Field label="Descrição interna">
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Campanha, turma, origem..." />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tipo de desconto">
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as DiscountType }))}>
                    <option value="percentage">Percentual</option>
                    <option value="fixed">Valor fixo</option>
                  </select>
                </Field>
                <Field label={form.discountType === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}>
                  <Input type="number" min="0" max={form.discountType === 'percentage' ? 100 : undefined} step="0.01" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))} />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Limite total de uso">
                  <Input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="Sem limite" />
                </Field>
                <Field label="Limite por usuário">
                  <Input type="number" min="1" value={form.perUserLimit} onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))} placeholder="Sem limite" />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Valor mínimo do carrinho (R$)">
                  <Input type="number" min="0" step="0.01" value={form.minimumCartAmount} onChange={(e) => setForm((f) => ({ ...f, minimumCartAmount: e.target.value }))} placeholder="Sem mínimo" />
                </Field>
                <Field label="Término">
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.expirationMode} onChange={(e) => setForm((f) => ({ ...f, expirationMode: e.target.value as ExpirationMode }))}>
                    <option value="none">Sem término</option>
                    <option value="date">Data específica</option>
                    <option value="duration">Tempo desde criação</option>
                  </select>
                </Field>
              </div>

              <label className="flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm">
                <input type="checkbox" checked={form.firstPurchaseOnly} onChange={(e) => setForm((f) => ({ ...f, firstPurchaseOnly: e.target.checked }))} />
                Somente primeira compra
              </label>

              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label>Unidades permitidas</Label>
                    <p className="text-xs text-muted-foreground">
                      {form.allowedAfyaUnits.length === 0 ? 'Sem restrição por unidade' : `${form.allowedAfyaUnits.length} selecionada(s)`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, allowedAfyaUnits: [...INSTITUTION_UNITS] }))}>
                      Todas
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, allowedAfyaUnits: [] }))}>
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-background p-1">
                  {INSTITUTION_UNITS.map((unit) => (
                    <label key={unit} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-xs hover:bg-muted">
                      <input type="checkbox" className="mt-0.5" checked={form.allowedAfyaUnits.includes(unit)} onChange={() => toggleAfyaUnit(unit)} />
                      <span>{unit}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.expirationMode === 'date' ? (
                <Field label="Data-limite">
                  <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
                </Field>
              ) : null}

              {form.expirationMode === 'duration' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Duração">
                    <Input type="number" min="1" value={form.durationValue} onChange={(e) => setForm((f) => ({ ...f, durationValue: Number(e.target.value) }))} />
                  </Field>
                  <Field label="Unidade">
                    <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.durationUnit} onChange={(e) => setForm((f) => ({ ...f, durationUnit: e.target.value as DurationUnit }))}>
                      {Object.entries(durationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                </div>
              ) : null}

              <Field label="Onde o cupom vale">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as CouponScope }))}>
                  {Object.entries(scopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>

              {form.scope === 'specific' ? (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div>
                    <Label>Pesquisar materiais, flashcards ou pacotes</Label>
                    <div className="relative mt-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} className="pl-9" placeholder="Digite pelo menos 2 letras..." />
                      {productLoading ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
                    </div>
                  </div>

                  {productResults.length > 0 ? (
                    <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border bg-background p-1">
                      {productResults.map((product) => (
                        <button key={`${product.itemType}:${product.itemId}`} type="button" onClick={() => addProduct(product)} className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted">
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{product.title}</span>
                            <span className="text-xs text-muted-foreground">{product.typeLabel} · {product.pricing === 'paid' ? currency.format(product.price) : 'Grátis'}{product.isHidden ? ' · oculto' : ''}</span>
                          </span>
                          <Plus className="h-4 w-4 shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {form.productRefs.map((product) => (
                      <span key={`${product.itemType}:${product.itemId}`} className={`inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${productTone(product.kind)}`}>
                        <span className="truncate">{product.title}</span>
                        <button type="button" onClick={() => removeProduct(product)}><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                    {form.productRefs.length === 0 ? <span className="text-xs text-muted-foreground">Nenhum item selecionado.</span> : null}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2 pt-2">
                <Button className="flex-1 gap-2" onClick={saveCoupon} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
                {editingId ? <Button variant="outline" onClick={resetForm}>Cancelar</Button> : null}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {coupons.length === 0 ? (
              <Card className="rounded-lg">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum cupom criado ainda.
                </CardContent>
              </Card>
            ) : coupons.map((coupon) => (
              <Card key={coupon.id} className="rounded-lg">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-sm font-black text-primary">
                          <BadgePercent className="h-3.5 w-3.5" /> {coupon.code}
                        </span>
                        <span className="rounded-md border px-2 py-1 text-xs font-semibold">{couponLabel(coupon)} OFF</span>
                        <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${coupon.isActive ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200' : 'border-muted bg-muted text-muted-foreground'}`}>
                          {coupon.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">{scopeLabels[coupon.scope]}</span>
                      </div>

                      {coupon.description ? <p className="mt-2 text-sm text-muted-foreground">{coupon.description}</p> : null}

                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                        <Metric icon={CalendarClock} label="Término" value={formatDate(coupon.expiresAt)} />
                        <Metric icon={Tag} label="Uso" value={`${coupon.usageCount}${coupon.usageLimit ? `/${coupon.usageLimit}` : ''}`} />
                        <Metric icon={Percent} label="Pessoas" value={String(coupon.stats.uniqueUsers)} />
                        <Metric icon={Package} label="Receita" value={currency.format(coupon.stats.revenueAttributed)} />
                      </div>

                      <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                        <Metric icon={UserCheck} label="Por usuário" value={coupon.perUserLimit ? String(coupon.perUserLimit) : 'Sem limite'} />
                        <Metric icon={ShoppingCart} label="Mínimo" value={coupon.minimumCartAmount ? currency.format(coupon.minimumCartAmount) : 'Sem mínimo'} />
                        <Metric icon={Check} label="Primeira compra" value={coupon.firstPurchaseOnly ? 'Sim' : 'Não'} />
                        <Metric icon={Building2} label="Unidades" value={coupon.allowedAfyaUnits?.length ? String(coupon.allowedAfyaUnits.length) : 'Sem restrição'} />
                      </div>

                      {coupon.productRefs?.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {coupon.productRefs.slice(0, 8).map((product) => (
                            <span key={`${product.itemType}:${product.itemId}`} className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${productTone(product.kind)}`}>
                              {product.title}
                            </span>
                          ))}
                          {coupon.productRefs.length > 8 ? <span className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground">+{coupon.productRefs.length - 8}</span> : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2 lg:shrink-0">
                      <Button variant="outline" size="sm" onClick={() => editCoupon(coupon)}>Editar</Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteCoupon(coupon)} title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md border border-primary/20 bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-black">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 rounded-md border bg-muted/25 px-2 py-1">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate"><strong>{label}:</strong> {value}</span>
    </span>
  )
}
