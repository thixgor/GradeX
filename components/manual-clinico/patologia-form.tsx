'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AREAS_SAUDE, SISTEMAS_FISIOLOGICOS, type AreaSaude, type SistemaFisiologico, type Farmaco } from '@/lib/types/manual-clinico'
import { Plus, Trash2, Save, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { RichTextArea } from './rich-text-area'

interface Props {
  initialData?: any
  editId?: string
}

const emptyFarmaco: Farmaco = {
  medicamento: '',
  classe: '',
  mecanismo_acao: '',
  dose_usual: '',
  efeitos_colaterais: [],
  contraindicacoes: []
}

export function PatologiaForm({ initialData, editId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [nome, setNome] = useState(initialData?.nome || '')
  const [sinonimos, setSinonimos] = useState<string>(initialData?.sinonimos?.join('; ') || '')
  const [areas, setAreas] = useState<AreaSaude[]>(initialData?.areas || [])
  const [sistema, setSistema] = useState<SistemaFisiologico | ''>(initialData?.sistema || '')
  const [cid10, setCid10] = useState(initialData?.cid10 || '')
  const [classificacao, setClassificacao] = useState(initialData?.classificacao || '')
  const [fisiopatologia, setFisiopatologia] = useState(initialData?.fisiopatologia || '')
  const [diagnosticoSemiologico, setDiagnosticoSemiologico] = useState(initialData?.diagnostico_semiologico || '')
  const [diagnosticosDiferenciais, setDiagnosticosDiferenciais] = useState(initialData?.diagnosticos_diferenciais || '')
  const [gravidade, setGravidade] = useState(initialData?.gravidade || '')
  const [tratamento, setTratamento] = useState(initialData?.tratamento || '')
  const [fluxograma, setFluxograma] = useState(initialData?.fluxograma_tratamento || '')
  const [observacoes, setObservacoes] = useState(initialData?.observacoes_clinicas || '')
  const [referencias, setReferencias] = useState(initialData?.referencias || '')
  const [imagensUrls, setImagensUrls] = useState<string>(initialData?.imagens_mecanismo?.join('\n') || '')
  const [legendas, setLegendas] = useState<string>(initialData?.legenda_imagens?.join('\n') || '')

  // Farmacologia
  const [primeiraLinha, setPrimeiraLinha] = useState<Farmaco[]>(initialData?.farmacologia?.primeira_linha || [])
  const [segundaLinha, setSegundaLinha] = useState<Farmaco[]>(initialData?.farmacologia?.segunda_linha || [])
  const [terceiraLinha, setTerceiraLinha] = useState<Farmaco[]>(initialData?.farmacologia?.terceira_linha || [])

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basico: true,
    classificacao: true,
    fisiopatologia: true,
    diagnostico: !!editId,
    tratamento: !!editId,
    farmacologia: !!editId,
    extras: !!editId,
  })

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleArea(area: AreaSaude) {
    setAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])
  }

  function updateFarmaco(linha: 'primeira' | 'segunda' | 'terceira', index: number, field: keyof Farmaco, value: any) {
    const setter = linha === 'primeira' ? setPrimeiraLinha : linha === 'segunda' ? setSegundaLinha : setTerceiraLinha
    setter(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
  }

  function addFarmaco(linha: 'primeira' | 'segunda' | 'terceira') {
    const setter = linha === 'primeira' ? setPrimeiraLinha : linha === 'segunda' ? setSegundaLinha : setTerceiraLinha
    setter(prev => [...prev, { ...emptyFarmaco }])
  }

  function removeFarmaco(linha: 'primeira' | 'segunda' | 'terceira', index: number) {
    const setter = linha === 'primeira' ? setPrimeiraLinha : linha === 'segunda' ? setSegundaLinha : setTerceiraLinha
    setter(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const data = {
        nome,
        sinonimos: sinonimos.split(/[;,]/).map(s => s.trim()).filter(Boolean),
        areas,
        sistema,
        cid10,
        classificacao,
        fisiopatologia,
        diagnostico_semiologico: diagnosticoSemiologico,
        diagnosticos_diferenciais: diagnosticosDiferenciais,
        gravidade,
        tratamento,
        farmacologia: {
          primeira_linha: primeiraLinha,
          segunda_linha: segundaLinha,
          terceira_linha: terceiraLinha,
        },
        fluxograma_tratamento: fluxograma,
        observacoes_clinicas: observacoes,
        referencias,
        imagens_mecanismo: imagensUrls.split('\n').map(s => s.trim()).filter(Boolean),
        legenda_imagens: legendas.split('\n').map(s => s.trim()).filter(Boolean),
      }

      const url = editId ? `/api/admin/manual-clinico/${editId}` : '/api/admin/manual-clinico'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Erro ao salvar')
        return
      }

      router.push('/admin/manual-clinico')
    } catch (err) {
      setError('Erro ao salvar patologia')
    } finally {
      setSaving(false)
    }
  }

  function SectionHeader({ id, title }: { id: string; title: string }) {
    return (
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
      >
        <h3 className="font-semibold text-lg">{title}</h3>
        {expandedSections[id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
    )
  }

  function FarmacoFields({ linha, label }: { linha: 'primeira' | 'segunda' | 'terceira'; label: string }) {
    const list = linha === 'primeira' ? primeiraLinha : linha === 'segunda' ? segundaLinha : terceiraLinha
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{label}</h4>
          <Button type="button" variant="outline" size="sm" onClick={() => addFarmaco(linha)}>
            <Plus className="h-3 w-3 mr-1" /> Adicionar fármaco
          </Button>
        </div>
        {list.map((farmaco, i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fármaco {i + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeFarmaco(linha, i)} className="text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Medicamento</Label>
                  <Input value={farmaco.medicamento} onChange={e => updateFarmaco(linha, i, 'medicamento', e.target.value)} placeholder="Nome do fármaco" />
                </div>
                <div>
                  <Label className="text-xs">Classe</Label>
                  <Input value={farmaco.classe} onChange={e => updateFarmaco(linha, i, 'classe', e.target.value)} placeholder="Classe farmacológica" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Mecanismo de Ação</Label>
                <textarea
                  value={farmaco.mecanismo_acao}
                  onChange={e => updateFarmaco(linha, i, 'mecanismo_acao', e.target.value)}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border bg-background text-sm resize-y"
                  placeholder="Mecanismo molecular/receptor"
                />
              </div>
              <div>
                <Label className="text-xs">Dose Usual</Label>
                <Input value={farmaco.dose_usual} onChange={e => updateFarmaco(linha, i, 'dose_usual', e.target.value)} placeholder="Dose e posologia" />
              </div>
              <div>
                <Label className="text-xs">Efeitos Colaterais (separados por ;)</Label>
                <Input
                  value={farmaco.efeitos_colaterais.join('; ')}
                  onChange={e => updateFarmaco(linha, i, 'efeitos_colaterais', e.target.value.split(/[;]/).map(s => s.trim()).filter(Boolean))}
                  placeholder="Cefaleia; Náusea; Tontura"
                />
              </div>
              <div>
                <Label className="text-xs">Contraindicações (separadas por ;)</Label>
                <Input
                  value={farmaco.contraindicacoes.join('; ')}
                  onChange={e => updateFarmaco(linha, i, 'contraindicacoes', e.target.value.split(/[;]/).map(s => s.trim()).filter(Boolean))}
                  placeholder="Gestantes; Insuficiência renal"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button type="button" variant="ghost" size="sm" className="mb-4" onClick={() => router.push('/admin/manual-clinico')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
      </Button>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Dados básicos */}
        <Card>
          <SectionHeader id="basico" title="Dados Básicos" />
          {expandedSections.basico && (
            <CardContent className="space-y-4 pt-0">
              <div>
                <Label>Nome da Patologia *</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Hipertensão Arterial Sistêmica" required />
              </div>
              <div>
                <Label>Sinônimos (separados por ;)</Label>
                <Input value={sinonimos} onChange={e => setSinonimos(e.target.value)} placeholder="HAS; hipertensão; pressão alta" />
              </div>
              <div>
                <Label>Áreas de Saúde *</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {AREAS_SAUDE.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        areas.includes(area)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Sistema Fisiológico *</Label>
                <select
                  value={sistema}
                  onChange={e => setSistema(e.target.value as SistemaFisiologico)}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm mt-1"
                  required
                >
                  <option value="">Selecionar sistema...</option>
                  {SISTEMAS_FISIOLOGICOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>CID-10</Label>
                <Input value={cid10} onChange={e => setCid10(e.target.value)} placeholder="Ex: I10" />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Classificação */}
        <Card>
          <SectionHeader id="classificacao" title="Classificação" />
          {expandedSections.classificacao && (
            <CardContent className="pt-0">
              <RichTextArea
                value={classificacao}
                onChange={setClassificacao}
                placeholder="Classificação clínica/etiológica..."
                minHeight="200px"
              />
            </CardContent>
          )}
        </Card>

        {/* Fisiopatologia */}
        <Card>
          <SectionHeader id="fisiopatologia" title="Fisiopatologia" />
          {expandedSections.fisiopatologia && (
            <CardContent className="pt-0">
              <RichTextArea
                value={fisiopatologia}
                onChange={setFisiopatologia}
                placeholder="Mecanismo fisiopatológico detalhado..."
                minHeight="250px"
              />
            </CardContent>
          )}
        </Card>

        {/* Diagnóstico */}
        <Card>
          <SectionHeader id="diagnostico" title="Diagnóstico" />
          {expandedSections.diagnostico && (
            <CardContent className="pt-0 space-y-4">
              <div>
                <Label>Diagnóstico Semiológico</Label>
                <RichTextArea
                  value={diagnosticoSemiologico}
                  onChange={setDiagnosticoSemiologico}
                  placeholder="Sinais, sintomas e exame físico..."
                  minHeight="200px"
                />
              </div>
              <div>
                <Label>Diagnósticos Diferenciais</Label>
                <RichTextArea
                  value={diagnosticosDiferenciais}
                  onChange={setDiagnosticosDiferenciais}
                  placeholder="Diagnósticos diferenciais com critérios..."
                  minHeight="160px"
                />
              </div>
              <div>
                <Label>Gravidade</Label>
                <RichTextArea
                  value={gravidade}
                  onChange={setGravidade}
                  placeholder="Escala de gravidade..."
                  minHeight="120px"
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tratamento */}
        <Card>
          <SectionHeader id="tratamento" title="Tratamento" />
          {expandedSections.tratamento && (
            <CardContent className="pt-0 space-y-4">
              <div>
                <Label>Tratamento</Label>
                <RichTextArea
                  value={tratamento}
                  onChange={setTratamento}
                  placeholder="Abordagem terapêutica não-farmacológica e farmacológica..."
                  minHeight="200px"
                />
              </div>
              <div>
                <Label>Fluxograma de Tratamento</Label>
                <textarea
                  value={fluxograma}
                  onChange={e => setFluxograma(e.target.value)}
                  className="w-full min-h-[200px] px-3 py-2 rounded-md border bg-background text-sm resize-y font-mono"
                  placeholder="Etapas do fluxo decisório..."
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Farmacologia */}
        <Card>
          <SectionHeader id="farmacologia" title="Farmacologia" />
          {expandedSections.farmacologia && (
            <CardContent className="pt-0 space-y-6">
              <FarmacoFields linha="primeira" label="1ª Linha" />
              <FarmacoFields linha="segunda" label="2ª Linha" />
              <FarmacoFields linha="terceira" label="3ª Linha (opcional)" />
            </CardContent>
          )}
        </Card>

        {/* Extras */}
        <Card>
          <SectionHeader id="extras" title="Campos Opcionais" />
          {expandedSections.extras && (
            <CardContent className="pt-0 space-y-4">
              <div>
                <Label>Observações Clínicas</Label>
                <RichTextArea
                  value={observacoes}
                  onChange={setObservacoes}
                  placeholder="Perlas clínicas, alertas..."
                  minHeight="120px"
                />
              </div>
              <div>
                <Label>Referências</Label>
                <textarea
                  value={referencias}
                  onChange={e => setReferencias(e.target.value)}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border bg-background text-sm resize-y"
                  placeholder="Referências bibliográficas..."
                />
              </div>
              <div>
                <Label>Imagens de Mecanismo de Ação (URLs, uma por linha)</Label>
                <textarea
                  value={imagensUrls}
                  onChange={e => setImagensUrls(e.target.value)}
                  className="w-full min-h-[60px] px-3 py-2 rounded-md border bg-background text-sm resize-y"
                  placeholder="/uploads/manual-clinico/imagem1.png&#10;/uploads/manual-clinico/imagem2.png"
                />
                {/* Preview das imagens */}
                {imagensUrls.trim() && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imagensUrls.split('\n').filter(Boolean).map((url, i) => (
                      <div key={i} className="w-20 h-20 border rounded overflow-hidden relative group">
                        <img src={url.trim()} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const urls = imagensUrls.split('\n').filter(Boolean)
                            urls.splice(i, 1)
                            setImagensUrls(urls.join('\n'))
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Legendas das Imagens (uma por linha, mesma ordem)</Label>
                <textarea
                  value={legendas}
                  onChange={e => setLegendas(e.target.value)}
                  className="w-full min-h-[60px] px-3 py-2 rounded-md border bg-background text-sm resize-y"
                  placeholder="Legenda da imagem 1&#10;Legenda da imagem 2"
                />
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Botão Salvar */}
      <div className="sticky bottom-0 bg-background border-t p-4 mt-6 -mx-4 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/manual-clinico')}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Criar Patologia'}
        </Button>
      </div>
    </form>
  )
}
