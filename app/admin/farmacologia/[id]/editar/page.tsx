'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Ban,
  Calculator,
  ExternalLink,
  CheckCircle,
} from 'lucide-react'
import {
  CLASSES_MEDICAMENTOS_NAMES,
  getSubclassesForClasse,
  TIPOS_FARMACO,
  type Contraindicacao,
  type DoseCheck,
} from '@/lib/types/farmacologia'

function numOrNull(s: string): number | null {
  const t = String(s).replace(',', '.').trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

const emptyDose = () => ({
  enabled: false,
  unidade: 'mg',
  via: '',
  mg_por_kg: null as number | null,
  dose_fixa: null as number | null,
  dose_min: null as number | null,
  dose_max: null as number | null,
  frequencia: '',
  ajuste_idoso_pct: null as number | null,
  fator_masculino: null as number | null,
  fator_feminino: null as number | null,
  observacao_calculo: '',
  checks: [] as DoseCheck[],
})

export default function EditarFarmacoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [form, setForm] = useState<any>(null)
  const [sinonimosText, setSinonimosText] = useState('')
  const [colateraisText, setColateraisText] = useState('')
  const [adversosText, setAdversosText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/farmacologia/${id}`)
        if (!res.ok) {
          router.push('/admin/farmacologia')
          return
        }
        const m = await res.json()
        setForm({
          ...m,
          calculo_dose: m.calculo_dose || emptyDose(),
          contraindicacoes: m.contraindicacoes || [],
        })
        setSinonimosText((m.sinonimos || []).join('; '))
        setColateraisText((m.efeitos_colaterais || []).join('\n'))
        setAdversosText((m.efeitos_adversos || []).join('\n'))
      } catch {
        router.push('/admin/farmacologia')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  const set = useCallback((k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v })), [])
  const setDose = useCallback((k: string, v: any) => setForm((f: any) => ({ ...f, calculo_dose: { ...f.calculo_dose, [k]: v } })), [])

  // ── Contraindicações ──
  const addCI = () => set('contraindicacoes', [...(form.contraindicacoes || []), { condicao: '', motivo: '' }])
  const updCI = (i: number, k: keyof Contraindicacao, v: string) =>
    set('contraindicacoes', form.contraindicacoes.map((c: Contraindicacao, idx: number) => idx === i ? { ...c, [k]: v } : c))
  const rmCI = (i: number) => set('contraindicacoes', form.contraindicacoes.filter((_: any, idx: number) => idx !== i))

  // ── Checks da calculadora ──
  const addCheck = () => setDose('checks', [...(form.calculo_dose.checks || []), { label: '', contraindica: false, motivo: '' }])
  const updCheck = (i: number, k: keyof DoseCheck, v: any) =>
    setDose('checks', form.calculo_dose.checks.map((c: DoseCheck, idx: number) => idx === i ? { ...c, [k]: v } : c))
  const rmCheck = (i: number) => setDose('checks', form.calculo_dose.checks.filter((_: any, idx: number) => idx !== i))

  async function handleSave() {
    setError('')
    if (!form.nome?.trim()) { setError('Nome é obrigatório.'); return }
    if (!form.classe_principal?.trim()) { setError('Classe principal é obrigatória.'); return }

    setSaving(true)
    try {
      const dose = { ...form.calculo_dose }
      dose.enabled = dose.mg_por_kg != null || dose.dose_fixa != null

      const payload = {
        ...form,
        sinonimos: sinonimosText.split(/[;,]/).map(s => s.trim()).filter(Boolean),
        efeitos_colaterais: colateraisText.split(/[\n;]/).map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean),
        efeitos_adversos: adversosText.split(/[\n;]/).map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean),
        contraindicacoes: (form.contraindicacoes || []).filter((c: Contraindicacao) => c.condicao.trim()),
        calculo_dose: { ...dose, checks: (dose.checks || []).filter((c: DoseCheck) => c.label.trim()) },
      }

      const res = await fetch(`/api/admin/farmacologia/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao salvar')
        return
      }
      setForm((f: any) => ({ ...f, slug: data.slug }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Erro ao salvar fármaco')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <AppShell headerTitle="Editar Fármaco">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppShell>
    )
  }

  const subclassesSugeridas = getSubclassesForClasse(form.classe_principal || '')
  const dose = form.calculo_dose

  return (
    <AppShell headerTitle="Editar Fármaco" headerSubtitle={form.nome}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/farmacologia')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            {form.slug && (
              <Button variant="outline" size="sm" onClick={() => window.open(`/manual-clinico/farmacologia/${form.slug}`, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" /> Ver ficha
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-600 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Alterações salvas com sucesso.
          </div>
        )}

        <div className="space-y-5">
          {/* Identificação */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" value={form.nome || ''} onChange={e => set('nome', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="sinonimos">Sinônimos / genéricos <span className="text-muted-foreground font-normal">(separados por ; )</span></Label>
                <Input id="sinonimos" value={sinonimosText} onChange={e => setSinonimosText(e.target.value)} className="mt-1" placeholder="Acetaminofeno; ..." />
              </div>
              <div>
                <Label htmlFor="nomes_comerciais">Nomes comerciais <span className="text-muted-foreground font-normal">(seção inicial independente)</span></Label>
                <Textarea id="nomes_comerciais" value={form.nomes_comerciais || ''} onChange={e => set('nomes_comerciais', e.target.value)} className="mt-1" placeholder="Tylenol®; Dôrico®; apresentações..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="classe">Classe principal *</Label>
                  <select
                    id="classe"
                    value={CLASSES_MEDICAMENTOS_NAMES.includes(form.classe_principal) ? form.classe_principal : '__custom__'}
                    onChange={e => set('classe_principal', e.target.value === '__custom__' ? form.classe_principal : e.target.value)}
                    className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm"
                  >
                    {CLASSES_MEDICAMENTOS_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                    {!CLASSES_MEDICAMENTOS_NAMES.includes(form.classe_principal) && (
                      <option value="__custom__">{form.classe_principal || '(personalizada)'}</option>
                    )}
                  </select>
                  {!CLASSES_MEDICAMENTOS_NAMES.includes(form.classe_principal) && (
                    <Input value={form.classe_principal || ''} onChange={e => set('classe_principal', e.target.value)} className="mt-2" placeholder="Classe personalizada" />
                  )}
                </div>
                <div>
                  <Label htmlFor="subclasse">Subclasse</Label>
                  <Input id="subclasse" list="subclasses-list" value={form.subclasse || ''} onChange={e => set('subclasse', e.target.value)} className="mt-1" placeholder="Subclasse..." />
                  <datalist id="subclasses-list">
                    {subclassesSugeridas.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de fármaco</Label>
                <select
                  id="tipo"
                  value={form.tipo_farmaco || ''}
                  onChange={e => set('tipo_farmaco', e.target.value)}
                  className="mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="">—</option>
                  {TIPOS_FARMACO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo clínico */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Conteúdo clínico</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { k: 'classificacao', label: 'Classificação', ph: 'Diga se é pró-fármaco, fármaco ativo etc.' },
                { k: 'principais_funcoes', label: 'Principais funções', ph: '' },
                { k: 'mecanismo_acao_compacto', label: 'Mecanismo de ação — compacto', ph: '1–3 frases' },
                { k: 'mecanismo_acao_detalhado', label: 'Mecanismo de ação — detalhado', ph: '' },
                { k: 'metabolismo', label: 'Metabolismo', ph: '' },
                { k: 'excrecao', label: 'Excreção', ph: '' },
              ].map(f => (
                <div key={f.k}>
                  <Label htmlFor={f.k}>{f.label}</Label>
                  <Textarea id={f.k} value={form[f.k] || ''} onChange={e => set(f.k, e.target.value)} className="mt-1" placeholder={f.ph} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Efeitos */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Efeitos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="colaterais">Efeitos colaterais <span className="text-muted-foreground font-normal">(um por linha)</span></Label>
                <Textarea id="colaterais" value={colateraisText} onChange={e => setColateraisText(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="adversos">Efeitos adversos <span className="text-muted-foreground font-normal">(um por linha)</span></Label>
                <Textarea id="adversos" value={adversosText} onChange={e => setAdversosText(e.target.value)} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Contraindicações */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2"><Ban className="h-4 w-4 text-red-500" /> Contraindicações</CardTitle>
              <Button variant="outline" size="sm" onClick={addCI}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(form.contraindicacoes || []).length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma contraindicação.</p>
              )}
              {(form.contraindicacoes || []).map((c: Contraindicacao, i: number) => (
                <div key={i} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input value={c.condicao} onChange={e => updCI(i, 'condicao', e.target.value)} placeholder="Condição" className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => rmCI(i)} className="text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Textarea value={c.motivo} onChange={e => updCI(i, 'motivo', e.target.value)} placeholder="Motivo (o porquê)" className="min-h-[60px]" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Interações */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Interações medicamentosas</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                value={form.interacoes_medicamentosas || ''}
                onChange={e => set('interacoes_medicamentosas', e.target.value)}
                className="min-h-[120px]"
                placeholder={'- Varfarina: potencializa anticoagulação → risco de sangramento.\n- Álcool: maior hepatotoxicidade.'}
              />
            </CardContent>
          </Card>

          {/* Posologia */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Posologia</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={form.posologia || ''} onChange={e => set('posologia', e.target.value)} className="min-h-[100px]" />
            </CardContent>
          </Card>

          {/* Calculadora de dose */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> Calculadora de dose</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">A calculadora só aparece na ficha quando há <strong>Dose por kg</strong> ou <strong>Dose fixa</strong>.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Unidade</Label>
                  <Input value={dose.unidade || ''} onChange={e => setDose('unidade', e.target.value)} className="mt-1" placeholder="mg" />
                </div>
                <div>
                  <Label>Via</Label>
                  <Input value={dose.via || ''} onChange={e => setDose('via', e.target.value)} className="mt-1" placeholder="VO" />
                </div>
                <div>
                  <Label>Frequência</Label>
                  <Input value={dose.frequencia || ''} onChange={e => setDose('frequencia', e.target.value)} className="mt-1" placeholder="6/6h" />
                </div>
                <div>
                  <Label>Dose por kg</Label>
                  <Input type="number" value={dose.mg_por_kg ?? ''} onChange={e => setDose('mg_por_kg', numOrNull(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label>Dose fixa</Label>
                  <Input type="number" value={dose.dose_fixa ?? ''} onChange={e => setDose('dose_fixa', numOrNull(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label>Ajuste idoso (%)</Label>
                  <Input type="number" value={dose.ajuste_idoso_pct ?? ''} onChange={e => setDose('ajuste_idoso_pct', numOrNull(e.target.value))} className="mt-1" placeholder="-25" />
                </div>
                <div>
                  <Label>Dose mínima</Label>
                  <Input type="number" value={dose.dose_min ?? ''} onChange={e => setDose('dose_min', numOrNull(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label>Dose máxima</Label>
                  <Input type="number" value={dose.dose_max ?? ''} onChange={e => setDose('dose_max', numOrNull(e.target.value))} className="mt-1" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Fator masculino</Label>
                  <Input type="number" value={dose.fator_masculino ?? ''} onChange={e => setDose('fator_masculino', numOrNull(e.target.value))} className="mt-1" placeholder="1" />
                </div>
                <div>
                  <Label>Fator feminino</Label>
                  <Input type="number" value={dose.fator_feminino ?? ''} onChange={e => setDose('fator_feminino', numOrNull(e.target.value))} className="mt-1" placeholder="1" />
                </div>
              </div>
              <div>
                <Label>Observação do cálculo</Label>
                <Textarea value={dose.observacao_calculo || ''} onChange={e => setDose('observacao_calculo', e.target.value)} className="mt-1 min-h-[60px]" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Condições (checks)</Label>
                  <Button variant="outline" size="sm" onClick={addCheck}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
                </div>
                <div className="space-y-2">
                  {(dose.checks || []).map((c: DoseCheck, i: number) => (
                    <div key={i} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input value={c.label} onChange={e => updCheck(i, 'label', e.target.value)} placeholder="Rótulo (ex.: Doença hepática)" className="flex-1" />
                        <Button variant="ghost" size="sm" onClick={() => rmCheck(i)} className="text-destructive shrink-0"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-sm">
                          <input type="checkbox" checked={!!c.contraindica} onChange={e => updCheck(i, 'contraindica', e.target.checked)} />
                          Contraindica
                        </label>
                        <Input value={c.motivo || ''} onChange={e => updCheck(i, 'motivo', e.target.value)} placeholder="Motivo (opcional)" className="flex-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demais seções */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Fluxograma, observações e referências</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fluxograma_uso">Fluxograma de uso <span className="text-muted-foreground font-normal">(uma etapa por linha)</span></Label>
                <Textarea id="fluxograma_uso" value={form.fluxograma_uso || ''} onChange={e => set('fluxograma_uso', e.target.value)} className="mt-1 min-h-[100px]" />
              </div>
              <div>
                <Label htmlFor="observacoes_clinicas">Observações clínicas</Label>
                <Textarea id="observacoes_clinicas" value={form.observacoes_clinicas || ''} onChange={e => set('observacoes_clinicas', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="referencias">Referências bibliográficas</Label>
                <Textarea id="referencias" value={form.referencias || ''} onChange={e => set('referencias', e.target.value)} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pb-8">
            <Button variant="outline" onClick={() => router.push('/admin/farmacologia')}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
