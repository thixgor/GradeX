'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileUp,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BookOpen,
  X,
  Save,
  Crown,
  Users,
  Loader2
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AREAS_SAUDE, SISTEMAS_FISIOLOGICOS, type AreaSaude } from '@/lib/types/manual-clinico'

const AREA_COLORS: Record<AreaSaude, string> = {
  'Medicina': 'bg-blue-500 text-white',
  'Psicologia': 'bg-purple-500 text-white',
  'Odontologia': 'bg-emerald-500 text-white',
  'Biomedicina': 'bg-orange-500 text-white',
}

type ManualProductConfigForm = {
  label: string
  benefitText: string
  shortDescription: string
  ctaText: string
  coverImageUrl: string
  isActive: boolean
  price: number
  promotionalPrice: number | null
  promotionEndsAt: string
  allowCoupons: boolean
  lifetimeAccess: boolean
  freeAccessMode: 'quantity' | 'list'
  freeQuantity: number
  freePathologySlugs: string[]
}

function emptyProductConfig(): ManualProductConfigForm {
  return {
    label: 'Manual Clinico Premium',
    benefitText: 'Desbloqueie 220+ patologias aprofundadas',
    shortDescription: 'Diagnostico, tratamento, diferenciais, farmacologia e fluxogramas em um so lugar.',
    ctaText: 'Desbloquear Manual Clinico Premium',
    coverImageUrl: '',
    isActive: true,
    price: 49.9,
    promotionalPrice: 29.9,
    promotionEndsAt: '',
    allowCoupons: true,
    lifetimeAccess: true,
    freeAccessMode: 'quantity',
    freeQuantity: 5,
    freePathologySlugs: [],
  }
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}

export default function AdminManualClinico() {
  const router = useRouter()
  const [patologias, setPatologias] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [busca, setBusca] = useState('')
  const [areaFiltro, setAreaFiltro] = useState('')
  const [sistemaFiltro, setSistemaFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [productConfig, setProductConfig] = useState<ManualProductConfigForm>(emptyProductConfig)
  const [productStats, setProductStats] = useState({ pathologyCount: 0, freeCount: 0, lockedCount: 0, buyerCount: 0, currentPrice: 0 })
  const [productLoading, setProductLoading] = useState(true)
  const [productSaving, setProductSaving] = useState(false)
  const [productMessage, setProductMessage] = useState('')
  const [grantEmail, setGrantEmail] = useState('')
  const [grantLoading, setGrantLoading] = useState(false)

  const fetchPatologias = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca) params.set('busca', busca)
      if (areaFiltro) params.set('area', areaFiltro)
      if (sistemaFiltro) params.set('sistema', sistemaFiltro)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/admin/manual-clinico?${params}`)
      const data = await res.json()
      setPatologias(data.patologias || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 0)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }, [busca, areaFiltro, sistemaFiltro, page])

  const fetchProductConfig = useCallback(async () => {
    setProductLoading(true)
    try {
      const res = await fetch('/api/admin/manual-clinico/product', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar produto')
      const cfg = data.config
      setProductConfig({
        label: cfg.label || '',
        benefitText: cfg.benefitText || '',
        shortDescription: cfg.shortDescription || '',
        ctaText: cfg.ctaText || '',
        coverImageUrl: cfg.coverImageUrl || '',
        isActive: cfg.isActive !== false,
        price: Number(cfg.price || 0),
        promotionalPrice: cfg.promotionalPrice == null ? null : Number(cfg.promotionalPrice),
        promotionEndsAt: toDatetimeLocal(cfg.promotionEndsAt),
        allowCoupons: cfg.allowCoupons !== false,
        lifetimeAccess: cfg.lifetimeAccess !== false,
        freeAccessMode: cfg.freeAccessMode === 'list' ? 'list' : 'quantity',
        freeQuantity: Number(cfg.freeQuantity || 0),
        freePathologySlugs: Array.isArray(cfg.freePathologySlugs) ? cfg.freePathologySlugs : [],
      })
      setProductStats(data.stats || { pathologyCount: 0, freeCount: 0, lockedCount: 0, buyerCount: 0, currentPrice: 0 })
    } catch (error: any) {
      setProductMessage(error?.message || 'Erro ao carregar configuracao do produto')
    } finally {
      setProductLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProductConfig()
  }, [fetchProductConfig])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchPatologias()
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, areaFiltro, sistemaFiltro])

  useEffect(() => {
    fetchPatologias()
  }, [page])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/manual-clinico/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPatologias()
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  async function handleSaveProduct() {
    setProductSaving(true)
    setProductMessage('')
    try {
      const payload = {
        ...productConfig,
        promotionalPrice: productConfig.promotionalPrice === null || Number.isNaN(Number(productConfig.promotionalPrice))
          ? null
          : Number(productConfig.promotionalPrice),
        promotionEndsAt: productConfig.promotionEndsAt || null,
      }
      const res = await fetch('/api/admin/manual-clinico/product', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar produto')
      setProductMessage('Configuracao salva.')
      await fetchProductConfig()
      await fetchPatologias()
    } catch (error: any) {
      setProductMessage(error?.message || 'Erro ao salvar produto')
    } finally {
      setProductSaving(false)
    }
  }

  async function handleGrantAccess() {
    if (!grantEmail.trim()) return
    setGrantLoading(true)
    setProductMessage('')
    try {
      const res = await fetch('/api/admin/manual-clinico/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: grantEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao liberar acesso')
      setGrantEmail('')
      setProductMessage('Acesso liberado para o usuario.')
      await fetchProductConfig()
    } catch (error: any) {
      setProductMessage(error?.message || 'Erro ao liberar acesso')
    } finally {
      setGrantLoading(false)
    }
  }

  function toggleFreePathology(slug: string) {
    setProductConfig((current) => {
      const selected = new Set(current.freePathologySlugs)
      if (selected.has(slug)) selected.delete(slug)
      else selected.add(slug)
      return { ...current, freePathologySlugs: Array.from(selected) }
    })
  }

  async function handleExport() {
    try {
      const res = await fetch('/api/admin/manual-clinico?limit=1000')
      const data = await res.json()
      const patologias = data.patologias || []

      const txt = patologias.map((p: any) => {
        let text = ''
        text += `##NOME: ${p.nome}\n`
        text += `##SINÔNIMOS: ${(p.sinonimos || []).join('; ')}\n`
        text += `##ÁREAS: ${(p.areas || []).join('; ')}\n`
        text += `##SISTEMA: ${p.sistema}\n`
        text += `##CID10: ${p.cid10}\n`
        text += `##CLASSIFICAÇÃO: ${p.classificacao || ''}\n`
        text += `##FISIOPATOLOGIA: ${p.fisiopatologia || ''}\n`
        text += `##DIAGNOSTICO_SEMIOLOGICO: ${p.diagnostico_semiologico || ''}\n`
        text += `##DIAGNOSTICOS_DIFERENCIAIS: ${p.diagnosticos_diferenciais || ''}\n`
        text += `##GRAVIDADE: ${p.gravidade || ''}\n`
        text += `##TRATAMENTO: ${p.tratamento || ''}\n`

        // Farmacologia
        const formatFarmacos = (lista: any[]) =>
          (lista || []).map(f =>
            `Medicamento: ${f.medicamento}\nClasse: ${f.classe}\nMecanismo de Ação: ${f.mecanismo_acao}\nDose Usual: ${f.dose_usual}\nEfeitos Colaterais: ${(f.efeitos_colaterais || []).join('; ')}\nContraindicações: ${(f.contraindicacoes || []).join('; ')}`
          ).join('\n---\n')

        text += `##FARMACOLOGIA_PRIMEIRA_LINHA: ${formatFarmacos(p.farmacologia?.primeira_linha)}\n`
        text += `##FARMACOLOGIA_SEGUNDA_LINHA: ${formatFarmacos(p.farmacologia?.segunda_linha)}\n`
        if (p.farmacologia?.terceira_linha?.length > 0) {
          text += `##FARMACOLOGIA_TERCEIRA_LINHA: ${formatFarmacos(p.farmacologia?.terceira_linha)}\n`
        }

        text += `##FLUXOGRAMA_TRATAMENTO: ${p.fluxograma_tratamento || ''}\n`
        if (p.observacoes_clinicas) text += `##OBSERVACOES_CLINICAS: ${p.observacoes_clinicas}\n`
        if (p.referencias) text += `##REFERENCIAS: ${p.referencias}\n`
        if (p.imagens_mecanismo?.length > 0) text += `##IMAGENS_MECANISMO: ${p.imagens_mecanismo.join('; ')}\n`
        if (p.legenda_imagens?.length > 0) text += `##LEGENDA_IMAGENS: ${p.legenda_imagens.join('; ')}\n`

        return text
      }).join('\n---NOVA_PATOLOGIA---\n\n')

      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manual-clinico-export-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao exportar:', error)
    }
  }

  function isIncomplete(p: any) {
    return !p.classificacao || !p.fisiopatologia || !p.diagnostico_semiologico ||
      !p.tratamento || !p.cid10 || !p.farmacologia?.primeira_linha?.length
  }

  return (
    <AppShell headerTitle="Manual Clínico" headerSubtitle="Gerenciar patologias">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-6 overflow-hidden border-primary/15 bg-card/80 backdrop-blur">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold">
                  <Crown className="h-6 w-6 text-primary" />
                  Produto Freemium
                </h2>
                <p className="text-sm text-muted-foreground">Configure preco, promocao, paywall e patologias gratuitas.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <div className="rounded-xl border bg-muted/30 px-3 py-2">
                  <p className="text-lg font-black">{productStats.pathologyCount}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Patologias</p>
                </div>
                <div className="rounded-xl border bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300">
                  <p className="text-lg font-black">{productStats.freeCount}</p>
                  <p className="text-[10px] uppercase">Gratuitas</p>
                </div>
                <div className="rounded-xl border bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">
                  <p className="text-lg font-black">{productStats.lockedCount}</p>
                  <p className="text-[10px] uppercase">Premium</p>
                </div>
                <div className="rounded-xl border bg-primary/10 px-3 py-2 text-primary">
                  <p className="text-lg font-black">{productStats.buyerCount}</p>
                  <p className="text-[10px] uppercase">Compradores</p>
                </div>
              </div>
            </div>

            {productMessage && (
              <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                {productMessage}
              </div>
            )}

            {productLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando configuracao...
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium">
                      Label comercial
                      <Input className="mt-1" value={productConfig.label} onChange={e => setProductConfig(c => ({ ...c, label: e.target.value }))} />
                    </label>
                    <label className="text-sm font-medium">
                      CTA
                      <Input className="mt-1" value={productConfig.ctaText} onChange={e => setProductConfig(c => ({ ...c, ctaText: e.target.value }))} />
                    </label>
                  </div>

                  <label className="block text-sm font-medium">
                    Texto de beneficio
                    <Input className="mt-1" value={productConfig.benefitText} onChange={e => setProductConfig(c => ({ ...c, benefitText: e.target.value }))} />
                  </label>

                  <label className="block text-sm font-medium">
                    Descricao curta
                    <Input className="mt-1" value={productConfig.shortDescription} onChange={e => setProductConfig(c => ({ ...c, shortDescription: e.target.value }))} />
                  </label>

                  <label className="block text-sm font-medium">
                    URL da capa
                    <Input className="mt-1" value={productConfig.coverImageUrl} onChange={e => setProductConfig(c => ({ ...c, coverImageUrl: e.target.value }))} placeholder="https://..." />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-sm font-medium">
                      Preco base
                      <Input type="number" min="0" step="0.01" className="mt-1" value={productConfig.price} onChange={e => setProductConfig(c => ({ ...c, price: Number(e.target.value) }))} />
                    </label>
                    <label className="text-sm font-medium">
                      Preco promocional
                      <Input type="number" min="0" step="0.01" className="mt-1" value={productConfig.promotionalPrice ?? ''} onChange={e => setProductConfig(c => ({ ...c, promotionalPrice: e.target.value === '' ? null : Number(e.target.value) }))} placeholder="Opcional" />
                    </label>
                    <label className="text-sm font-medium">
                      Fim da promocao
                      <Input type="datetime-local" className="mt-1" value={productConfig.promotionEndsAt} onChange={e => setProductConfig(c => ({ ...c, promotionEndsAt: e.target.value }))} />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border bg-muted/25 p-4">
                    <p className="mb-3 text-sm font-bold">Regras do produto</p>
                    <div className="space-y-2 text-sm">
                      {[
                        ['Produto ativo', 'isActive'],
                        ['Permitir cupom', 'allowCoupons'],
                        ['Acesso vitalicio', 'lifetimeAccess'],
                      ].map(([label, key]) => (
                        <label key={key} className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2">
                          <span>{label}</span>
                          <input
                            type="checkbox"
                            checked={(productConfig as any)[key]}
                            onChange={e => setProductConfig(c => ({ ...c, [key]: e.target.checked } as ManualProductConfigForm))}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-muted/25 p-4">
                    <p className="mb-3 text-sm font-bold">Freemium</p>
                    <select
                      className="mb-3 h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={productConfig.freeAccessMode}
                      onChange={e => setProductConfig(c => ({ ...c, freeAccessMode: e.target.value as 'quantity' | 'list' }))}
                    >
                      <option value="quantity">Liberar primeiras N patologias</option>
                      <option value="list">Liberar lista selecionada</option>
                    </select>
                    {productConfig.freeAccessMode === 'quantity' ? (
                      <label className="text-sm font-medium">
                        Quantidade gratuita
                        <Input type="number" min="0" className="mt-1" value={productConfig.freeQuantity} onChange={e => setProductConfig(c => ({ ...c, freeQuantity: Number(e.target.value) }))} />
                      </label>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Selecione as patologias gratuitas diretamente na lista abaixo.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border bg-muted/25 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold">
                      <Users className="h-4 w-4" />
                      Liberar usuario manualmente
                    </p>
                    <div className="flex gap-2">
                      <Input value={grantEmail} onChange={e => setGrantEmail(e.target.value)} placeholder="email@dominio.com" />
                      <Button onClick={handleGrantAccess} disabled={grantLoading || !grantEmail.trim()}>
                        {grantLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Liberar'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Preco atual: <strong className="text-foreground">R$ {Number(productStats.currentPrice || 0).toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <Button onClick={handleSaveProduct} disabled={productSaving} className="gap-2">
                    {productSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar configuracao
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Patologias
            </h2>
            <p className="text-sm text-muted-foreground">{total} cadastradas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push('/admin/manual-clinico/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Patologia
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/manual-clinico/importar')}>
              <FileUp className="h-4 w-4 mr-2" />
              Importar TXT
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CID-10..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={areaFiltro}
            onChange={e => setAreaFiltro(e.target.value)}
            className="px-3 py-2 rounded-md border bg-background text-sm"
            aria-label="Filtrar por área"
          >
            <option value="">Todas as áreas</option>
            {AREAS_SAUDE.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={sistemaFiltro}
            onChange={e => setSistemaFiltro(e.target.value)}
            className="px-3 py-2 rounded-md border bg-background text-sm"
            aria-label="Filtrar por sistema"
          >
            <option value="">Todos os sistemas</option>
            {SISTEMAS_FISIOLOGICOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : patologias.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma patologia encontrada.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {patologias.map(p => (
                <Card key={p._id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{p.nome}</span>
                        {p.cid10 && <Badge variant="outline" className="text-xs font-mono">{p.cid10}</Badge>}
                        {isIncomplete(p) && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Incompleta
                          </span>
                        )}
                        {productConfig.freeAccessMode === 'list' && productConfig.freePathologySlugs.includes(p.slug) && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Gratuita</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {p.areas?.map((a: AreaSaude) => (
                          <span key={a} className={`text-[10px] px-1.5 py-0.5 rounded-full ${AREA_COLORS[a]}`}>
                            {a}
                          </span>
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{p.sistema}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {productConfig.freeAccessMode === 'list' && (
                        <label className="mr-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs">
                          <input
                            type="checkbox"
                            checked={productConfig.freePathologySlugs.includes(p.slug)}
                            onChange={() => toggleFreePathology(p.slug)}
                          />
                          Free
                        </label>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/manual-clinico/${p._id}/editar`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(p._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">{page} de {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Próxima <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Patologia</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta patologia? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
