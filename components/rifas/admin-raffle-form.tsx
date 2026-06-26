'use client'

import { useState } from 'react'
import { Loader2, Save, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/file-upload'
import { RAFFLE_TEMPLATES, resolveTheme, slugify } from '@/lib/raffle-shared'

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
    <div className="space-y-6">
      {/* Informações básicas */}
      <Section title="Informações da rifa">
        <div className="grid sm:grid-cols-2 gap-4">
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
          </div>
          <div>
            <Label>Categoria do prêmio</Label>
            <Input value={v.prizeCategory} onChange={e => set('prizeCategory', e.target.value)} placeholder="Eletrônicos, Viagem..." />
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea value={v.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Descreva a rifa..." />
          </div>
        </div>
      </Section>

      {/* Configuração de números */}
      <Section title="Números e valores">
        <div className="grid sm:grid-cols-3 gap-4">
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
      </Section>

      {/* Prêmio */}
      <Section title="Prêmio">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Nome do prêmio *</Label>
            <Input value={v.prizeName} onChange={e => set('prizeName', e.target.value)} placeholder="iPhone 15 Pro 256GB" />
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição do prêmio</Label>
            <Textarea value={v.prizeDescription} onChange={e => set('prizeDescription', e.target.value)} rows={2} />
          </div>
          <FileUpload label="Capa da rifa (opcional)" value={v.coverImageUrl} onChange={url => set('coverImageUrl', url)} supportPaste />
          <FileUpload label="Imagem do prêmio (opcional)" value={v.prizeImageUrl} onChange={url => set('prizeImageUrl', url)} supportPaste />
        </div>
      </Section>

      {/* Agendamento e visibilidade */}
      <Section title="Agendamento, visibilidade e status">
        <div className="grid sm:grid-cols-2 gap-4">
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
        <div className="flex flex-col gap-2 mt-4">
          <Checkbox checked={v.allowManualDrawWhileOpen} onChange={c => set('allowManualDrawWhileOpen', c)} label="Permitir sorteio manual com a rifa ainda aberta" />
          <Checkbox checked={v.allowDrawUnsoldNumbers} onChange={c => set('allowDrawUnsoldNumbers', c)} label="Permitir sortear números não vendidos" />
        </div>
        <div className="mt-4">
          <Label>Regras / observações</Label>
          <Textarea value={v.rules} onChange={e => set('rules', e.target.value)} rows={3} placeholder="Regras adicionais exibidas ao participante..." />
        </div>
      </Section>

      {/* Template e personalização */}
      <Section title="Design e template">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RAFFLE_TEMPLATES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => set('template', t.id)}
              className="rounded-xl p-1 transition"
              style={{ border: v.template === t.id ? `2px solid ${t.primaryColor}` : '2px solid transparent', boxShadow: v.template === t.id ? `0 0 16px ${t.primaryColor}55` : 'none' }}
            >
              <div className="h-16 rounded-lg mb-1.5 flex items-center justify-center" style={{ background: t.background }}>
                <span className="w-6 h-6 rounded-full" style={{ background: t.primaryColor }} />
              </div>
              <div className="text-xs font-semibold text-center">{t.label}</div>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-5">
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

        {/* Preview */}
        <div className="mt-5 rounded-xl p-4 flex items-center gap-2 text-sm" style={{ background: theme.background, color: theme.light ? '#111' : '#fff', border: `1px solid ${theme.primaryColor}44` }}>
          <Eye size={16} style={{ color: theme.primaryColor }} />
          Pré-visualização do tema — <span className="font-bold" style={{ color: theme.primaryColor }}>{v.name || 'Sua rifa'}</span>
        </div>
      </Section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-3 sticky bottom-0 py-3 bg-background/80 backdrop-blur">
        <Button onClick={handleSubmit} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-base font-bold mb-4">{title}</h3>
      {children}
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
