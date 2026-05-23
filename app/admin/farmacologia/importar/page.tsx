'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  FileUp,
  ClipboardPaste,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  FileText,
} from 'lucide-react'

interface PreviewItem {
  index: number
  nome: string
  data: any
  errors: { field: string; message: string }[]
  warnings: string[]
  valid: boolean
}

export default function ImportarFarmacologiaPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'file' | 'text'>('text')
  const [texto, setTexto] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<PreviewItem[] | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const content = await file.text()
    setTexto(content)
    setPreview(null)
    setResult(null)
  }

  async function handlePreview() {
    if (!texto.trim()) {
      setError('Cole ou carregue o conteúdo para importação.')
      return
    }
    setError('')
    setPreviewing(true)
    try {
      const res = await fetch('/api/admin/farmacologia/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, confirmar: false }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao processar')
        return
      }
      setPreview(data.medicamentos)
    } catch {
      setError('Erro ao processar importação')
    } finally {
      setPreviewing(false)
    }
  }

  async function handleConfirm() {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/farmacologia/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, confirmar: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao salvar')
        return
      }
      setResult(data)
      setPreview(null)
    } catch {
      setError('Erro ao salvar importação')
    } finally {
      setSaving(false)
    }
  }

  const validCount = preview?.filter(p => p.valid).length || 0
  const invalidCount = preview?.filter(p => !p.valid).length || 0

  return (
    <AppShell headerTitle="Importar Farmacologia" headerSubtitle="Importação de fármacos por TXT ou texto colado">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push('/admin/farmacologia')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {result && (
          <Card className="mb-6 border-green-500/30 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <h3 className="font-semibold text-lg">Importação Concluída</h3>
              </div>
              <p className="text-sm mb-2">
                <span className="font-semibold text-green-600">{result.totalSalvas}</span> fármacos salvos com sucesso.
                {result.totalErros > 0 && (
                  <span className="ml-2 text-yellow-600">{result.totalErros} com erros (não salvos).</span>
                )}
              </p>
              {result.salvas?.length > 0 && (
                <div className="space-y-1 mt-3">
                  {result.salvas.map((s: any, i: number) => (
                    <div key={i} className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{s.nome}</span>
                      <button
                        onClick={() => router.push(`/manual-clinico/farmacologia/${s.slug}`)}
                        className="text-primary text-xs underline"
                      >
                        Ver ficha
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button className="mt-4" onClick={() => { setResult(null); setTexto(''); setPreview(null) }}>
                Importar mais
              </Button>
            </CardContent>
          </Card>
        )}

        {!result && (
          <>
            <div className="flex gap-2 mb-4">
              <Button variant={mode === 'text' ? 'default' : 'outline'} size="sm" onClick={() => setMode('text')}>
                <ClipboardPaste className="h-4 w-4 mr-2" /> Colar Texto
              </Button>
              <Button variant={mode === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setMode('file')}>
                <FileUp className="h-4 w-4 mr-2" /> Upload de Arquivo
              </Button>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Formato: docs/IMPORTACAO_FARMACOLOGIA.md
              </span>
            </div>

            <Card className="mb-6">
              <CardContent className="p-4">
                {mode === 'file' && (
                  <div className="space-y-3">
                    <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                    >
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Clique para selecionar um arquivo .txt</p>
                    </button>
                    {texto && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <FileText className="h-4 w-4" /> Arquivo carregado ({texto.length} caracteres)
                      </p>
                    )}
                  </div>
                )}
                {mode === 'text' && (
                  <textarea
                    value={texto}
                    onChange={e => { setTexto(e.target.value); setPreview(null); setResult(null) }}
                    className="w-full min-h-[300px] px-3 py-2 rounded-md border bg-background text-sm resize-y font-mono"
                    placeholder={`Cole aqui o conteúdo formatado. Exemplo:\n\n##NOME: Paracetamol\n##SINONIMOS: Acetaminofeno; Tylenol\n##CLASSE: Analgésicos, Anti-inflamatórios e Antitérmicos\n##SUBCLASSE: Analgésicos não-opioides\n##TIPO: Fármaco ativo\n##CLASSIFICACAO: ...\n##PRINCIPAIS_FUNCOES: ...\n##MECANISMO_COMPACTO: ...\n\nPara múltiplos fármacos, use ---NOVO_FARMACO--- como separador.`}
                  />
                )}
              </CardContent>
            </Card>

            {!preview && (
              <Button onClick={handlePreview} disabled={previewing || !texto.trim()} className="mb-6">
                <Eye className="h-4 w-4 mr-2" />
                {previewing ? 'Processando...' : 'Pré-visualizar'}
              </Button>
            )}

            {preview && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">Pré-visualização</h3>
                    <Badge variant="success">{validCount} válidos</Badge>
                    {invalidCount > 0 && <Badge variant="destructive">{invalidCount} com erros</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
                      Editar texto
                    </Button>
                    {validCount > 0 && (
                      <Button size="sm" onClick={handleConfirm} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Salvando...' : `Importar ${validCount} fármaco${validCount > 1 ? 's' : ''}`}
                      </Button>
                    )}
                  </div>
                </div>

                {preview.map((item, i) => (
                  <Card key={i} className={`${item.valid ? 'border-green-500/30' : 'border-red-500/30'}`}>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.valid ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        <CardTitle className="text-base">{item.nome || `Fármaco ${i + 1}`}</CardTitle>
                        {item.data?.classe_principal && (
                          <Badge variant="outline" className="text-xs">{item.data.classe_principal}</Badge>
                        )}
                        {item.data?.subclasse && (
                          <Badge variant="secondary" className="text-xs">{item.data.subclasse}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      {item.errors.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {item.errors.map((err, j) => (
                            <p key={j} className="text-sm text-red-600 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              <span className="font-medium">{err.field}:</span> {err.message}
                            </p>
                          ))}
                        </div>
                      )}
                      {item.warnings.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {item.warnings.map((warn, j) => (
                            <p key={j} className="text-sm text-yellow-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> {warn}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground space-y-1">
                        {item.data?.tipo_farmaco && <p>Tipo: {item.data.tipo_farmaco}</p>}
                        {item.data?.mecanismo_acao_compacto && (
                          <p>Mecanismo: {item.data.mecanismo_acao_compacto.substring(0, 100)}...</p>
                        )}
                        {item.data?.contraindicacoes?.length > 0 && (
                          <p>Contraindicações: {item.data.contraindicacoes.map((c: any) => c.condicao).join(', ')}</p>
                        )}
                        {item.data?.calculo_dose?.enabled && (
                          <p className="text-emerald-600">Calculadora de dose configurada ✓</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
