'use client'

import { useState } from 'react'
import {
  Loader2, Save, Eye, Info, Gift, CalendarClock,
  Palette, Hash, X, Sparkles, Video, Plus, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/file-upload'
import { RAFFLE_TEMPLATES, RAFFLE_PRIZE_CATEGORIES, resolveTheme, slugify } from '@/lib/raffle-shared'
import { RafflePreview } from './raffle-preview'

export interface RaffleFormValues {
  name: string
  slug: string
  description: string
  pricePerNumber: number
  totalNumbers: number
  winnersCount: number
  coverImageUrl: string
  prizeName: string
  prizeDescription: string
  prizeCategory: string
  prizeImageUrl: string
  videos: { url: string; caption: string }[]
  template: string
  customDesign: {
    primaryColor?: string
    secondaryColor?: string
    cardStyle?: string
    gridStyle?: string
    background?: string
    highlightText?: string
  }
  visibility: string
  status: string
  rules: string
  allowManualDrawWhileOpen: boolean
  allowDrawUnsoldNumbers: boolean
  startsAt: string
  endsAt: string
}

export const emptyRaffleForm: RaffleFormValues = {
  name: '',
  slug: '',
  description: '',
  pricePerNumber: 5,
  totalNumbers: 100,
  winnersCount: 1,
  coverImageUrl: '',
  prizeName: '',
  prizeDescription: '',
  prizeCategory: '',
  prizeImageUrl: '',
  videos: [],
  template: 'premium-dark',
  customDesign: {},
  visibility: 'public',
  status: 'draft',
  rules: '',
  allowManualDrawWhileOpen: false,
  allowDrawUnsoldNumbers: false,
  startsAt: '',
  endsAt: '',
}

interface Props {
  initial: RaffleFormValues
  submitLabel: string
  onSubmit: (values: RaffleFormValues) => Promise<void>
}

export function AdminRaffleForm({ initial, submitLabel, onSubmit }: Props) {
  const [v, setV] = useState<RaffleFormValues>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [slugTouched, setSlugTouched] = useState(!!initial.slug)
  const [mobilePreview, setMobilePreview] = useState(false)

  const theme = resolveTheme(v.template as any, v.customDesign as any)

  function set<K extends keyof RaffleFormValues>(key: K, value: RaffleFormValues[K]) {
    setV(prev => ({ ...prev, [key]: value }))
  }
  function setDesign(key: string, value: string) {
    setV(prev => ({ ...prev, customDesign: { ...prev.customDesign, [key]: value } }))
  }

  async function handleSubmit() {
    setError('')
    if (v.name.trim().length < 2) return setError('Informe o nome da rifa.')
    if (v.prizeName.trim().length < 1) return setError('Informe o nome do prêmio.')
    if (v.pricePerNumber <= 0) return setError('O valor por número deve ser maior que zero.')
    if (v.totalNumbers < 2) return setError('A rifa precisa de pelo menos 2 números.')
    if (v.winnersCount < 1 || v.winnersCount > v.totalNumbers) return setError('Quantidade de ganhadores inválida.')
    setSaving(true)
    try {
      await onSubmit(v)
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]">
      {/* Coluna do formulário */}
      <div className="min-w-0 space-y-5">
        {/* Informações básicas */}
        <Section icon={<Info className="h-4 w-4" />} title="Informações da rifa" description="Nome, link e descrição que aparecem para o participante.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nome da rifa *</Label>
              <Input
                value={v.name}
                onChange={e => {
                  set('name', e.target.value)
                  if (!slugTouched) set('slug', slugify(e.target.value))
                }}
                placeholder="Ex.: Rifa do iPhone 15"
              />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input value={v.slug} onChange={e => { setSlugTouched(true); set('slug', slugify(e.target.value)) }} placeholder="rifa-do-iphone-15" />
              <p className="mt-1 text-[11px] text-muted-foreground truncate">/rifas/{v.slug || 'sua-rifa'}</p>
            </div>
            <CategorySelect value={v.prizeCategory} onChange={val => set('prizeCategory', val)} />
            <div className="sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={v.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Descreva a rifa, a causa ou o motivo..." />
            </div>
          </div>
        </Section>

        {/* Configuração de números */}
        <Section icon={<Hash className="h-4 w-4" />} title="Números e valores" description="Quanto custa cada número, quantos existem e quantos ganhadores.">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Valor por número (R$) *</Label>
              <Input type="number" min={0.5} step={0.5} value={v.pricePerNumber} onChange={e => set('pricePerNumber', Number(e.target.value))} />
            </div>
            <div>
              <Label>Total de números *</Label>
              <Input type="number" min={2} step={1} value={v.totalNumbers} onChange={e => set('totalNumbers', Math.floor(Number(e.target.value)))} />
            </div>
            <div>
              <Label>Qtd. de ganhadores *</Label>
              <Input type="number" min={1} step={1} value={v.winnersCount} onChange={e => set('winnersCount', Math.floor(Number(e.target.value)))} />
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Arrecadação máxima estimada: <span className="font-semibold text-foreground">{`R$ ${(v.pricePerNumber * v.totalNumbers || 0).toFixed(2).replace('.', ',')}`}</span> se todos os números forem vendidos.
          </div>
        </Section>

        {/* Prêmio */}
        <Section icon={<Gift className="h-4 w-4" />} title="Prêmio" description="O que o ganhador leva. Imagens deixam a rifa muito mais atraente.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nome do prêmio *</Label>
              <Input value={v.prizeName} onChange={e => set('prizeName', e.target.value)} placeholder="iPhone 15 Pro 256GB" />
            </div>
            <div className="sm:col-span-2">
              <Label>Descrição do prêmio</Label>
              <Textarea value={v.prizeDescription} onChange={e => set('prizeDescription', e.target.value)} rows={2} placeholder="Cor, modelo, garantia, forma de entrega..." />
            </div>
            <FileUpload label="Capa da rifa (opcional)" value={v.coverImageUrl} onChange={url => set('coverImageUrl', url)} supportPaste />
            <FileUpload label="Imagem do prêmio (opcional)" value={v.prizeImageUrl} onChange={url => set('prizeImageUrl', url)} supportPaste />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Tamanho ideal — Capa: <span className="font-medium text-foreground">1280×720px (16:9)</span>. Prêmio: <span className="font-medium text-foreground">800×800px (1:1)</span>. Use JPG/WebP até ~2MB.
          </p>
        </Section>

        {/* Vídeos de demonstração */}
        <Section icon={<Video className="h-4 w-4" />} title="Vídeos de demonstração" description="Mostre o prêmio em ação. Cole links do YouTube/Vimeo ou envie um arquivo. Cada vídeo pode ter uma legenda.">
          <VideosEditor videos={v.videos} onChange={vids => set('videos', vids)} />
        </Section>

        {/* Agendamento e visibilidade */}
        <Section icon={<CalendarClock className="h-4 w-4" />} title="Agendamento, visibilidade e status" description="Quando abre/fecha, quem vê e em que estado a rifa fica.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Início (opcional)</Label>
              <Input type="datetime-local" value={v.startsAt} onChange={e => set('startsAt', e.target.value)} />
            </div>
            <div>
              <Label>Encerramento (opcional)</Label>
              <Input type="datetime-local" value={v.endsAt} onChange={e => set('endsAt', e.target.value)} />
            </div>
            <div>
              <Label>Visibilidade</Label>
              <Select value={v.visibility} onChange={val => set('visibility', val)} options={[
                { value: 'public', label: 'Pública (aparece na listagem)' },
                { value: 'unlisted', label: 'Não listada (apenas por link)' },
                { value: 'private', label: 'Privada (somente admin)' },
              ]} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={v.status} onChange={val => set('status', val)} options={[
                { value: 'draft', label: 'Rascunho' },
                { value: 'scheduled', label: 'Agendada' },
                { value: 'open', label: 'Aberta' },
                { value: 'closed', label: 'Encerrada' },
                { value: 'drawing', label: 'Sorteando' },
                { value: 'finished', label: 'Finalizada' },
                { value: 'cancelled', label: 'Cancelada' },
              ]} />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Checkbox checked={v.allowManualDrawWhileOpen} onChange={c => set('allowManualDrawWhileOpen', c)} label="Permitir sorteio manual com a rifa ainda aberta" />
            <Checkbox checked={v.allowDrawUnsoldNumbers} onChange={c => set('allowDrawUnsoldNumbers', c)} label="Permitir sortear números não vendidos" />
          </div>
          <div className="mt-4">
            <Label>Regras / observações</Label>
            <Textarea value={v.rules} onChange={e => set('rules', e.target.value)} rows={3} placeholder="Regras adicionais exibidas ao participante..." />
          </div>
        </Section>

        {/* Template e personalização */}
        <Section icon={<Palette className="h-4 w-4" />} title="Design e template" description="Escolha um tema pronto e ajuste cores e estilos do grid.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RAFFLE_TEMPLATES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => set('template', t.id)}
                className="group rounded-xl p-1 text-left transition"
                style={{ border: v.template === t.id ? `2px solid ${t.primaryColor}` : '2px solid transparent', boxShadow: v.template === t.id ? `0 0 16px ${t.primaryColor}55` : 'none' }}
              >
                <div className="mb-1.5 flex h-16 items-center justify-center rounded-lg" style={{ background: t.background }}>
                  <span className="h-6 w-6 rounded-full" style={{ background: t.primaryColor }} />
                </div>
                <div className="text-center text-xs font-semibold">{t.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <ColorField label="Cor principal" value={v.customDesign.primaryColor || ''} onChange={val => setDesign('primaryColor', val)} placeholder={theme.primaryColor} />
            <ColorField label="Cor secundária" value={v.customDesign.secondaryColor || ''} onChange={val => setDesign('secondaryColor', val)} placeholder={theme.secondaryColor} />
            <div>
              <Label>Texto de destaque</Label>
              <Input value={v.customDesign.highlightText || ''} onChange={e => setDesign('highlightText', e.target.value)} placeholder="Últimos números!" />
            </div>
            <div>
              <Label>Estilo do card</Label>
              <Select value={v.customDesign.cardStyle || 'glass'} onChange={val => setDesign('cardStyle', val)} options={[
                { value: 'glass', label: 'Vidro' }, { value: 'solid', label: 'Sólido' }, { value: 'outline', label: 'Contorno' },
              ]} />
            </div>
            <div>
              <Label>Estilo do grid</Label>
              <Select value={v.customDesign.gridStyle || 'rounded'} onChange={val => setDesign('gridStyle', val)} options={[
                { value: 'rounded', label: 'Arredondado' }, { value: 'square', label: 'Quadrado' }, { value: 'pill', label: 'Pílula' },
              ]} />
            </div>
            <div>
              <Label>Background custom (CSS)</Label>
              <Input value={v.customDesign.background || ''} onChange={e => setDesign('background', e.target.value)} placeholder="linear-gradient(...)" />
            </div>
          </div>
        </Section>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}

        <div className="sticky bottom-0 flex justify-end gap-3 bg-background/80 py-3 backdrop-blur">
          <Button type="button" variant="outline" size="lg" className="xl:hidden" onClick={() => setMobilePreview(true)}>
            <Eye className="mr-2 h-4 w-4" /> Pré-visualizar
          </Button>
          <Button onClick={handleSubmit} disabled={saving} size="lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {submitLabel}
          </Button>
        </div>
      </div>

      {/* Coluna do preview (desktop) */}
      <div className="hidden xl:block">
        <div className="sticky top-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Pré-visualização ao vivo
          </div>
          <RafflePreview values={v} />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Grid e progresso são ilustrativos. A página real carrega os números vendidos em tempo real.
          </p>
        </div>
      </div>

      {/* Preview mobile (modal) */}
      {mobilePreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-3 backdrop-blur-sm xl:hidden" onClick={() => setMobilePreview(false)}>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-white"><Eye className="h-4 w-4" /> Pré-visualização</span>
              <button onClick={() => setMobilePreview(false)} className="rounded-full bg-white/10 p-1.5 text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto rounded-2xl">
              <RafflePreview values={v} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ icon, title, description, children }: { icon?: React.ReactNode; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        {icon && <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>}
        <div>
          <h3 className="text-base font-bold leading-tight">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

const CATEGORY_OTHER = '__other__'

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isPreset = !value || RAFFLE_PRIZE_CATEGORIES.includes(value)
  const [custom, setCustom] = useState(!isPreset)

  const selectValue = custom ? CATEGORY_OTHER : value

  return (
    <div>
      <Label>Categoria do prêmio</Label>
      <Select
        value={selectValue}
        onChange={val => {
          if (val === CATEGORY_OTHER) {
            setCustom(true)
            onChange('')
          } else {
            setCustom(false)
            onChange(val)
          }
        }}
        options={[
          { value: '', label: 'Sem categoria' },
          ...RAFFLE_PRIZE_CATEGORIES.map(c => ({ value: c, label: c })),
          { value: CATEGORY_OTHER, label: 'Outro (personalizar)…' },
        ]}
      />
      {custom && (
        <Input
          autoFocus
          className="mt-2"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Digite a categoria personalizada"
          maxLength={80}
        />
      )}
    </div>
  )
}

function VideosEditor({ videos, onChange }: { videos: { url: string; caption: string }[]; onChange: (v: { url: string; caption: string }[]) => void }) {
  function update(i: number, patch: Partial<{ url: string; caption: string }>) {
    onChange(videos.map((vid, idx) => (idx === i ? { ...vid, ...patch } : vid)))
  }
  function remove(i: number) {
    onChange(videos.filter((_, idx) => idx !== i))
  }
  function add() {
    if (videos.length >= 8) return
    onChange([...videos, { url: '', caption: '' }])
  }

  return (
    <div className="space-y-3">
      {videos.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Nenhum vídeo adicionado. Clique em “Adicionar vídeo” para incluir uma demonstração.
        </p>
      )}
      {videos.map((vid, i) => (
        <div key={i} className="rounded-xl border border-border bg-muted/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Vídeo {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </button>
          </div>
          <div className="space-y-2">
            <Input
              value={vid.url}
              onChange={e => update(i, { url: e.target.value })}
              placeholder="Link do YouTube, Vimeo ou .mp4 direto"
            />
            <Input
              value={vid.caption}
              onChange={e => update(i, { caption: e.target.value })}
              placeholder="Legenda (opcional) — ex.: Unboxing do prêmio"
              maxLength={160}
            />
          </div>
        </div>
      ))}
      {videos.length < 8 && (
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="mr-1.5 h-4 w-4" /> Adicionar vídeo
        </Button>
      )}
      <p className="text-[11px] text-muted-foreground">
        Recomendado: links do <span className="font-medium text-foreground">YouTube</span> ou <span className="font-medium text-foreground">Vimeo</span> (mais leve e rápido). Também aceita URL direta de arquivo <span className="font-medium text-foreground">.mp4</span>.
      </p>
    </div>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (c: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 rounded border-input" />
      {label}
    </label>
  )
}

function ColorField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value || placeholder} onChange={e => onChange(e.target.value)} className="h-10 w-12 rounded border border-input cursor-pointer bg-transparent" />
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </div>
  )
}
