'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import {
  Package, Truck, ClipboardList, Plus, Trash2, Pencil, X, ImagePlus, Loader2,
  ArrowLeft, Star, EyeOff, Save, MapPin,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SHOP_STATUS_LABELS } from '@/lib/shop'
import type { PhysicalProduct, ShopSettings, ShopOrder, ShopOrderStatus, DeliveryMethod, PickupPoint } from '@/lib/types'

type Tab = 'produtos' | 'entrega' | 'pedidos'

const REGION_KEYS = ['default', 'N', 'NE', 'CO', 'SE', 'S'] as const
const REGION_NAMES: Record<string, string> = {
  default: 'Padrão (fallback)', N: 'Norte', NE: 'Nordeste', CO: 'Centro-Oeste', SE: 'Sudeste', S: 'Sul',
}
const STATUS_OPTIONS: ShopOrderStatus[] = [
  'paid', 'in_production', 'ready', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded',
]

const emptyProduct = (): Partial<PhysicalProduct> => ({
  title: '', description: '', images: [], price: 0, linkMode: 'standalone',
  madeToOrder: false, trackStock: false, tags: [], isHidden: false, isFeatured: false, order: 0,
})

export default function AdminLojaPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('produtos')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setAuthorized(d?.user?.role === 'admin'))
      .catch(() => setAuthorized(false))
  }, [])

  if (authorized === null) {
    return <AppShell headerTitle="Loja"><div className="py-24 text-center text-sm text-muted-foreground">Carregando...</div></AppShell>
  }
  if (!authorized) {
    return (
      <AppShell headerTitle="Loja">
        <div className="py-24 text-center">
          <p className="text-sm text-muted-foreground">Acesso restrito a administradores.</p>
          <Button className="mt-4" onClick={() => router.push('/')}>Voltar</Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell headerTitle="Loja Física">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="mb-4 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Painel admin
        </Button>

        <div className="mb-6 flex gap-1 rounded-xl bg-muted/40 p-1 w-fit">
          {([
            { id: 'produtos', label: 'Produtos', icon: <Package className="h-4 w-4" /> },
            { id: 'entrega', label: 'Entrega & Frete', icon: <Truck className="h-4 w-4" /> },
            { id: 'pedidos', label: 'Pedidos', icon: <ClipboardList className="h-4 w-4" /> },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === t.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'produtos' && <ProdutosTab />}
        {tab === 'entrega' && <EntregaTab />}
        {tab === 'pedidos' && <PedidosTab />}
      </div>
    </AppShell>
  )
}

// ───────────────────────── Produtos ─────────────────────────

function ProdutosTab() {
  const [products, setProducts] = useState<PhysicalProduct[]>([])
  const [materials, setMaterials] = useState<{ _id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<PhysicalProduct> | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/loja/produtos?admin=1')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    fetch('/api/materiais')
      .then((r) => r.json())
      .then((d) => {
        const list = (d.materials || d || []) as any[]
        setMaterials(Array.isArray(list) ? list.map((m) => ({ _id: String(m._id), title: m.title })) : [])
      })
      .catch(() => {})
  }, [load])

  async function handleDelete(id: string) {
    if (!confirm('Excluir este produto?')) return
    await fetch(`/api/loja/produtos?id=${id}`, { method: 'DELETE' })
    load()
  }

  const brl = (n: number) => n.toFixed(2).replace('.', ',')

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Produtos ({products.length})</h2>
        <Button size="sm" className="gap-1.5" onClick={() => setEditing(emptyProduct())}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center text-sm text-muted-foreground">
          Nenhum produto ainda. Clique em “Novo produto”.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={String(p._id)} className="flex gap-3 rounded-2xl border border-border/50 bg-card/60 p-3">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted/50">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40"><Package className="h-6 w-6" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-1">
                  <p className="flex-1 truncate text-sm font-semibold">{p.title}</p>
                  {p.isHidden && <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  {p.isFeatured && <Star className="h-3.5 w-3.5 text-amber-500" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  R$ {brl(p.linkMode === 'addon' ? (p.addonSurcharge ?? p.price) : p.price)}
                  {p.linkMode === 'addon' ? ' · add-on' : p.linkMode === 'material' ? ' · material' : ' · avulso'}
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  {p.madeToOrder ? 'Sob encomenda' : 'Pronta entrega'}
                  {p.trackStock ? ` · estoque ${p.stock ?? 0}` : ''}
                </p>
                <div className="mt-1.5 flex gap-1">
                  <button onClick={() => setEditing(p)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(String(p._id))} className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ProductModal
          initial={editing}
          materials={materials}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}

function ProductModal({
  initial, materials, onClose, onSaved,
}: {
  initial: Partial<PhysicalProduct>
  materials: { _id: string; title: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<Partial<PhysicalProduct>>({ ...initial })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const set = (patch: Partial<PhysicalProduct>) => setForm((f) => ({ ...f, ...patch }))

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const pathname = `shop-products/${Date.now()}-${crypto.randomUUID()}.${(file.name.split('.').pop() || 'jpg').toLowerCase()}`
        const blob = await upload(pathname, file, {
          access: 'public',
          contentType: file.type,
          handleUploadUrl: '/api/loja/upload',
        })
        urls.push(blob.url)
      }
      set({ images: [...(form.images || []), ...urls] })
    } catch (e: any) {
      setError(e?.message || 'Falha ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(idx: number) {
    set({ images: (form.images || []).filter((_, i) => i !== idx) })
  }
  function moveImage(idx: number, dir: -1 | 1) {
    const imgs = [...(form.images || [])]
    const j = idx + dir
    if (j < 0 || j >= imgs.length) return
    ;[imgs[idx], imgs[j]] = [imgs[j], imgs[idx]]
    set({ images: imgs })
  }

  async function handleSave() {
    if (!form.title?.trim()) { setError('Informe o título'); return }
    setSaving(true)
    setError('')
    try {
      const method = form._id ? 'PUT' : 'POST'
      const res = await fetch('/api/loja/produtos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Falha ao salvar')
      }
      onSaved()
    } catch (e: any) {
      setError(e?.message || 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-border/50 bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{form._id ? 'Editar produto' : 'Novo produto'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Título</label>
            <Input value={form.title || ''} onChange={(e) => set({ title: e.target.value })} placeholder="Ex.: Apostila impressa de Anatomia" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Descrição</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Detalhes do produto"
            />
          </div>

          {/* Galeria */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Imagens (a 1ª é a capa)</label>
            <div className="flex flex-wrap gap-2">
              {(form.images || []).map((img, i) => (
                <div key={img + i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-0 top-0 bg-primary px-1 text-[9px] font-bold text-primary-foreground">CAPA</span>}
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => moveImage(i, -1)} className="rounded bg-white/20 p-1 text-white text-[10px]">←</button>
                    <button onClick={() => removeImage(i)} className="rounded bg-red-500/80 p-1 text-white"><Trash2 className="h-3 w-3" /></button>
                    <button onClick={() => moveImage(i, 1)} className="rounded bg-white/20 p-1 text-white text-[10px]">→</button>
                  </div>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border/60 text-muted-foreground hover:border-primary hover:text-primary">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-[10px]">{uploading ? 'Enviando' : 'Adicionar'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Preço (R$)</label>
              <Input type="number" step="0.01" value={form.price ?? 0} onChange={(e) => set({ price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Preço “de” (opcional)</label>
              <Input type="number" step="0.01" value={form.compareAtPrice ?? ''} onChange={(e) => set({ compareAtPrice: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
          </div>

          {/* Vínculo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Tipo de vínculo</label>
              <select
                value={form.linkMode || 'standalone'}
                onChange={(e) => set({ linkMode: e.target.value as any })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="standalone">Avulso (loja)</option>
                <option value="material">Material normal (catálogo)</option>
                <option value="addon">Add-on de um material</option>
              </select>
            </div>
            {(form.linkMode === 'addon' || form.linkMode === 'material') && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Material vinculado</label>
                <select
                  value={form.linkedMaterialId || ''}
                  onChange={(e) => set({ linkedMaterialId: e.target.value || undefined })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— selecionar —</option>
                  {materials.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
                </select>
              </div>
            )}
          </div>

          {form.linkMode === 'addon' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Acréscimo do add-on (+R$)</label>
              <Input type="number" step="0.01" value={form.addonSurcharge ?? 0} onChange={(e) => set({ addonSurcharge: Number(e.target.value) })} />
            </div>
          )}

          {/* Versões (opcional) */}
          <div className="rounded-xl border border-border/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Versões (opcional)</p>
                <p className="text-[11px] text-muted-foreground/70">Ex.: Capa dura / Capa mole. Preço e detalhes opcionais por versão.</p>
              </div>
              <Button
                type="button" size="sm" variant="outline" className="gap-1"
                onClick={() => set({ versions: [...((form.versions as any[]) || []), { id: `ver-${Date.now()}`, name: '' }] })}
              >
                <Plus className="h-3.5 w-3.5" /> Versão
              </Button>
            </div>
            <div className="space-y-2">
              {((form.versions as any[]) || []).map((v, i) => (
                <div key={v.id || i} className="rounded-lg border border-border/30 p-2">
                  <div className="flex items-center gap-2">
                    <Input
                      className="flex-1" placeholder="Nome da versão"
                      value={v.name || ''}
                      onChange={(e) => {
                        const list = [...((form.versions as any[]) || [])]
                        list[i] = { ...list[i], name: e.target.value }
                        set({ versions: list })
                      }}
                    />
                    <Input
                      className="w-28" type="number" step="0.01" placeholder="Preço"
                      value={v.price ?? ''}
                      onChange={(e) => {
                        const list = [...((form.versions as any[]) || [])]
                        list[i] = { ...list[i], price: e.target.value === '' ? undefined : Number(e.target.value) }
                        set({ versions: list })
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => set({ versions: ((form.versions as any[]) || []).filter((_, idx) => idx !== i) })}
                      className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Input
                    className="mt-2" placeholder="Detalhes desta versão (opcional)"
                    value={v.details || ''}
                    onChange={(e) => {
                      const list = [...((form.versions as any[]) || [])]
                      list[i] = { ...list[i], details: e.target.value }
                      set({ versions: list })
                    }}
                  />
                </div>
              ))}
              {(!form.versions || (form.versions as any[]).length === 0) && (
                <p className="text-[11px] text-muted-foreground/60">Sem versões — o produto usa o preço base.</p>
              )}
            </div>
          </div>

          {/* Produção / estoque */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.madeToOrder} onChange={(e) => set({ madeToOrder: e.target.checked })} />
              Sob encomenda
            </label>
            {form.madeToOrder && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Dias de produção</label>
                <Input type="number" value={form.productionDays ?? 0} onChange={(e) => set({ productionDays: Number(e.target.value) })} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.trackStock} onChange={(e) => set({ trackStock: e.target.checked })} />
              Controlar estoque
            </label>
            {form.trackStock && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Quantidade em estoque</label>
                <Input type="number" value={form.stock ?? 0} onChange={(e) => set({ stock: Number(e.target.value) })} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Tags (vírgula)</label>
              <Input
                value={(form.tags || []).join(', ')}
                onChange={(e) => set({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Ordem</label>
              <Input type="number" value={form.order ?? 0} onChange={(e) => set({ order: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Nº de páginas (opcional)</label>
            <Input
              type="number"
              min={0}
              className="w-40"
              value={form.pageCount ?? ''}
              onChange={(e) => set({ pageCount: e.target.value === '' ? undefined : Number(e.target.value) })}
              placeholder="Ex.: 120"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.isFeatured} onChange={(e) => set({ isFeatured: e.target.checked })} /> Destaque
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.isHidden} onChange={(e) => set({ isHidden: e.target.checked })} /> Oculto
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || uploading} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ───────────────────────── Entrega & Frete ─────────────────────────

function EntregaTab() {
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    fetch('/api/loja/settings').then((r) => r.json()).then((d) => setSettings(d.settings))
  }, [])

  if (!settings) return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>

  const update = (patch: Partial<ShopSettings>) => setSettings((s) => (s ? { ...s, ...patch } : s))

  function addMethod() {
    const m: DeliveryMethod = {
      id: `method-${Date.now()}`, name: 'Novo método', enabled: true,
      estimatedDaysMin: 3, estimatedDaysMax: 7, freightByRegion: { default: 0 },
    }
    update({ deliveryMethods: [...settings!.deliveryMethods, m] })
  }
  function updateMethod(i: number, patch: Partial<DeliveryMethod>) {
    const list = [...settings!.deliveryMethods]
    list[i] = { ...list[i], ...patch }
    update({ deliveryMethods: list })
  }
  function removeMethod(i: number) {
    update({ deliveryMethods: settings!.deliveryMethods.filter((_, idx) => idx !== i) })
  }
  function addPickup() {
    const p: PickupPoint = { id: `pickup-${Date.now()}`, name: 'Novo ponto', enabled: true }
    update({ pickupPoints: [...settings!.pickupPoints, p] })
  }
  function updatePickup(i: number, patch: Partial<PickupPoint>) {
    const list = [...settings!.pickupPoints]
    list[i] = { ...list[i], ...patch }
    update({ pickupPoints: list })
  }
  function removePickup(i: number) {
    update({ pickupPoints: settings!.pickupPoints.filter((_, idx) => idx !== i) })
  }

  async function handleSave() {
    setSaving(true)
    setSavedMsg('')
    try {
      const res = await fetch('/api/loja/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
      })
      if (res.ok) { setSavedMsg('Salvo!'); setTimeout(() => setSavedMsg(''), 2000) }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Métodos de entrega */}
      <section className="rounded-2xl border border-border/50 bg-card/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Métodos de entrega</h3>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={addMethod}><Plus className="h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="space-y-4">
          {settings.deliveryMethods.length === 0 && <p className="text-sm text-muted-foreground">Nenhum método. O cliente só poderá retirar.</p>}
          {settings.deliveryMethods.map((m, i) => (
            <div key={m.id} className="rounded-xl border border-border/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input className="w-48" value={m.name} onChange={(e) => updateMethod(i, { name: e.target.value })} placeholder="Nome" />
                <label className="flex items-center gap-1 text-xs">
                  Prazo
                  <Input className="w-16" type="number" value={m.estimatedDaysMin} onChange={(e) => updateMethod(i, { estimatedDaysMin: Number(e.target.value) })} />
                  a
                  <Input className="w-16" type="number" value={m.estimatedDaysMax} onChange={(e) => updateMethod(i, { estimatedDaysMax: Number(e.target.value) })} />
                  dias
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={m.enabled} onChange={(e) => updateMethod(i, { enabled: e.target.checked })} /> Ativo
                </label>
                <button onClick={() => removeMethod(i)} className="ml-auto rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Frete por região (R$)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {REGION_KEYS.map((rk) => (
                    <label key={rk} className="flex items-center gap-1.5 text-xs">
                      <span className="w-28 text-muted-foreground">{REGION_NAMES[rk]}</span>
                      <Input
                        type="number" step="0.01"
                        className="h-8"
                        value={m.freightByRegion?.[rk] ?? ''}
                        onChange={(e) => {
                          const fr = { ...(m.freightByRegion || {}) }
                          if (e.target.value === '') delete fr[rk]
                          else fr[rk] = Number(e.target.value)
                          updateMethod(i, { freightByRegion: fr })
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <Input
                className="mt-2"
                value={m.details || ''}
                onChange={(e) => updateMethod(i, { details: e.target.value })}
                placeholder="Detalhes (opcional)"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Pontos de retirada */}
      <section className="rounded-2xl border border-border/50 bg-card/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 font-bold"><MapPin className="h-4 w-4" /> Pontos de retirada</h3>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={addPickup}><Plus className="h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="space-y-3">
          {settings.pickupPoints.map((p, i) => (
            <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/40 p-3">
              <Input className="w-52" value={p.name} onChange={(e) => updatePickup(i, { name: e.target.value })} placeholder="Nome" />
              <Input className="flex-1" value={p.address || ''} onChange={(e) => updatePickup(i, { address: e.target.value })} placeholder="Endereço" />
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={p.enabled} onChange={(e) => updatePickup(i, { enabled: e.target.checked })} /> Ativo
              </label>
              <button onClick={() => removePickup(i)} className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </section>

      {/* Rodapé */}
      <section className="rounded-2xl border border-border/50 bg-card/60 p-4">
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Rodapé de entrega</label>
        <Input value={settings.sellerFooter} onChange={(e) => update({ sellerFooter: e.target.value })} />
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar configurações
        </Button>
        {savedMsg && <span className="text-sm font-medium text-emerald-500">{savedMsg}</span>}
      </div>
    </div>
  )
}

// ───────────────────────── Pedidos ─────────────────────────

function PedidosTab() {
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [open, setOpen] = useState<ShopOrder | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const q = statusFilter ? `&status=${statusFilter}` : ''
    fetch(`/api/loja/orders?all=1${q}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const brl = (n: number) => n.toFixed(2).replace('.', ',')

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-bold">Pedidos</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ml-auto h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{SHOP_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center text-sm text-muted-foreground">Nenhum pedido.</div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <button key={String(o._id)} onClick={() => setOpen(o)} className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/60 p-3 text-left hover:border-primary/40">
              <div className="flex-1">
                <p className="text-sm font-semibold">#{o.orderNumber} · {o.userName}</p>
                <p className="text-xs text-muted-foreground">
                  {o.items.length} {o.items.length === 1 ? 'item' : 'itens'} · {o.deliveryType === 'pickup' ? 'Retirada' : 'Entrega'} · {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{SHOP_STATUS_LABELS[o.status]}</span>
              <span className="text-sm font-bold">R$ {brl(o.total)}</span>
            </button>
          ))}
        </div>
      )}

      {open && <OrderModal order={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); load() }} />}
    </div>
  )
}

function toDateInput(d?: Date | string | null): string {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return dt.toISOString().slice(0, 10)
}

function OrderModal({ order, onClose, onSaved }: { order: ShopOrder; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState<ShopOrderStatus>(order.status)
  const [note, setNote] = useState('')
  const [tracking, setTracking] = useState(order.tracking || { code: '', url: '', carrier: '' })
  const [address, setAddress] = useState({ ...(order.shippingAddress || {} as any) })
  const [deliveryMethodName, setDeliveryMethodName] = useState(order.deliveryMethodName || '')
  const [pickupPointName, setPickupPointName] = useState(order.pickupPointName || '')
  const [estimatedDate, setEstimatedDate] = useState(toDateInput(order.estimatedDeliveryDate))
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [saving, setSaving] = useState(false)
  const brl = (n: number) => n.toFixed(2).replace('.', ',')

  async function handleSave() {
    setSaving(true)
    try {
      const payload: any = { status, note: note || undefined, tracking, notifyCustomer, estimatedDeliveryDate: estimatedDate || null }
      if (order.deliveryType === 'shipping') {
        payload.shippingAddress = address
        payload.deliveryMethodName = deliveryMethodName
      } else {
        payload.pickupPointName = pickupPointName
      }
      await fetch(`/api/loja/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const setAddr = (patch: any) => setAddress((a: any) => ({ ...a, ...patch }))
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-lg rounded-2xl border border-border/50 bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Pedido #{order.orderNumber}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-1 rounded-xl bg-muted/40 p-3 text-sm">
          <p className="font-medium">{order.userName} · {order.userEmail}</p>
          {order.items.map((it, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              {it.quantity}× {it.title}{it.versionName ? ` (${it.versionName})` : ''} — R$ {brl(it.unitPrice * it.quantity)}
            </p>
          ))}
          <p className="mt-1 text-xs">Subtotal R$ {brl(order.subtotal)} · Frete R$ {brl(order.freight)} · <strong>Total R$ {brl(order.total)}</strong></p>
        </div>

        {/* Informações de entrega — editáveis */}
        <div className="mt-3 space-y-2 rounded-xl border border-border/40 p-3">
          {order.deliveryType === 'pickup' ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground"><MapPin className="mr-1 inline h-3.5 w-3.5" /> Ponto de retirada</label>
              <Input value={pickupPointName} onChange={(e) => setPickupPointName(e.target.value)} placeholder="Ponto de retirada" />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground">Entrega no endereço</label>
              <Input value={deliveryMethodName} onChange={(e) => setDeliveryMethodName(e.target.value)} placeholder="Método de entrega" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={address.name || ''} onChange={(e) => setAddr({ name: e.target.value })} placeholder="Nome" />
                <Input value={address.phone || ''} onChange={(e) => setAddr({ phone: e.target.value })} placeholder="Telefone" />
                <Input value={address.cep || ''} onChange={(e) => setAddr({ cep: e.target.value })} placeholder="CEP" />
                <Input value={address.city || ''} onChange={(e) => setAddr({ city: e.target.value })} placeholder="Cidade" />
                <Input value={address.street || ''} onChange={(e) => setAddr({ street: e.target.value })} placeholder="Rua" />
                <Input value={address.number || ''} onChange={(e) => setAddr({ number: e.target.value })} placeholder="Número" />
                <Input value={address.district || ''} onChange={(e) => setAddr({ district: e.target.value })} placeholder="Bairro" />
                <Input value={address.complement || ''} onChange={(e) => setAddr({ complement: e.target.value })} placeholder="Complemento" />
                <Input value={address.uf || ''} onChange={(e) => setAddr({ uf: e.target.value })} placeholder="UF" maxLength={2} />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Previsão de entrega</label>
            <Input type="date" value={estimatedDate} onChange={(e) => setEstimatedDate(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Atualizar status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ShopOrderStatus)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{SHOP_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota / mensagem para o cliente (opcional)" />

          <div className="grid grid-cols-1 gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Rastreio (opcional)</p>
            <Input value={tracking.carrier || ''} onChange={(e) => setTracking({ ...tracking, carrier: e.target.value })} placeholder="Transportadora (ex.: Correios)" />
            <Input value={tracking.code || ''} onChange={(e) => setTracking({ ...tracking, code: e.target.value })} placeholder="Código de rastreio" />
            <Input value={tracking.url || ''} onChange={(e) => setTracking({ ...tracking, url: e.target.value })} placeholder="Link de rastreio (opcional)" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notifyCustomer} onChange={(e) => setNotifyCustomer(e.target.checked)} />
            Notificar cliente por e-mail
          </label>
          <p className="text-[11px] text-muted-foreground/70">Ao salvar, as alterações são registradas na timeline e {notifyCustomer ? 'enviadas ao e-mail do cliente' : 'NÃO serão enviadas por e-mail'}.</p>
        </div>

        {order.statusHistory?.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Histórico</p>
            <div className="space-y-1">
              {order.statusHistory.slice().reverse().map((h, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {new Date(h.at).toLocaleString('pt-BR')} — <strong>{SHOP_STATUS_LABELS[h.status]}</strong>{h.note ? `: ${h.note}` : ''}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
