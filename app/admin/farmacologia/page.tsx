'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Trash2,
  FileUp,
  Download,
  ArrowLeft,
  Pill,
  ExternalLink,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { CLASSES_MEDICAMENTOS_NAMES } from '@/lib/types/farmacologia'

export default function AdminFarmacologia() {
  const router = useRouter()
  const [medicamentos, setMedicamentos] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState('')
  const [classeFiltro, setClasseFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchMedicamentos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca) params.set('busca', busca)
      if (classeFiltro) params.set('classe', classeFiltro)
      params.set('limit', '500')
      const res = await fetch(`/api/admin/farmacologia?${params}`)
      const data = await res.json()
      setMedicamentos(data.medicamentos || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }, [busca, classeFiltro])

  useEffect(() => {
    const timer = setTimeout(() => fetchMedicamentos(), 300)
    return () => clearTimeout(timer)
  }, [fetchMedicamentos])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/farmacologia/${deleteId}`, { method: 'DELETE' })
      if (res.ok) fetchMedicamentos()
    } catch (error) {
      console.error('Erro ao excluir:', error)
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  async function handleExport() {
    try {
      const res = await fetch('/api/admin/farmacologia?limit=1000')
      const data = await res.json()
      const meds = data.medicamentos || []

      const txt = meds.map((m: any) => {
        let t = ''
        t += `##NOME: ${m.nome}\n`
        t += `##SINONIMOS: ${(m.sinonimos || []).join('; ')}\n`
        t += `##CLASSE: ${m.classe_principal}\n`
        t += `##SUBCLASSE: ${m.subclasse || ''}\n`
        if (m.tipo_farmaco) t += `##TIPO: ${m.tipo_farmaco}\n`
        t += `##CLASSIFICACAO: ${m.classificacao || ''}\n`
        t += `##PRINCIPAIS_FUNCOES: ${m.principais_funcoes || ''}\n`
        t += `##MECANISMO_COMPACTO: ${m.mecanismo_acao_compacto || ''}\n`
        t += `##MECANISMO_DETALHADO: ${m.mecanismo_acao_detalhado || ''}\n`
        t += `##METABOLISMO: ${m.metabolismo || ''}\n`
        t += `##EXCRECAO: ${m.excrecao || ''}\n`
        t += `##EFEITOS_COLATERAIS: ${(m.efeitos_colaterais || []).join('; ')}\n`
        t += `##EFEITOS_ADVERSOS: ${(m.efeitos_adversos || []).join('; ')}\n`
        const ci = (m.contraindicacoes || [])
          .map((c: any) => `Condição: ${c.condicao}\nMotivo: ${c.motivo || ''}`)
          .join('\n---\n')
        t += `##CONTRAINDICACOES: ${ci}\n`
        t += `##POSOLOGIA: ${m.posologia || ''}\n`
        const d = m.calculo_dose
        if (d && (d.mg_por_kg != null || d.dose_fixa != null)) {
          let dt = ''
          dt += `Unidade: ${d.unidade || 'mg'}\n`
          if (d.via) dt += `Via: ${d.via}\n`
          if (d.mg_por_kg != null) dt += `Dose por kg: ${d.mg_por_kg}\n`
          if (d.dose_fixa != null) dt += `Dose fixa: ${d.dose_fixa}\n`
          if (d.dose_min != null) dt += `Dose mínima: ${d.dose_min}\n`
          if (d.dose_max != null) dt += `Dose máxima: ${d.dose_max}\n`
          if (d.frequencia) dt += `Frequência: ${d.frequencia}\n`
          if (d.ajuste_idoso_pct != null) dt += `Ajuste idoso (%): ${d.ajuste_idoso_pct}\n`
          if (d.fator_masculino != null) dt += `Fator masculino: ${d.fator_masculino}\n`
          if (d.fator_feminino != null) dt += `Fator feminino: ${d.fator_feminino}\n`
          if (d.observacao_calculo) dt += `Observação: ${d.observacao_calculo}\n`
          for (const c of d.checks || []) {
            dt += `Check: ${c.label} | ${c.contraindica ? 'contraindica' : 'seguro'}${c.motivo ? ` | ${c.motivo}` : ''}\n`
          }
          t += `##CALCULO_DOSE: ${dt}`
        }
        t += `##FLUXOGRAMA_USO: ${m.fluxograma_uso || ''}\n`
        if (m.observacoes_clinicas) t += `##OBSERVACOES_CLINICAS: ${m.observacoes_clinicas}\n`
        if (m.referencias) t += `##REFERENCIAS: ${m.referencias}\n`
        return t
      }).join('\n---NOVO_FARMACO---\n\n')

      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `farmacologia-export-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao exportar:', error)
    }
  }

  // Agrupar por classe
  const grupos = medicamentos.reduce((acc: Record<string, any[]>, m) => {
    const key = m.classe_principal || 'Sem classe'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <AppShell headerTitle="Farmacologia" headerSubtitle="Gerenciar fármacos por classe">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push('/admin/manual-clinico')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Manual Clínico
        </Button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Pill className="h-6 w-6 text-primary" />
              Farmacologia
            </h2>
            <p className="text-sm text-muted-foreground">{total} fármacos cadastrados</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push('/admin/farmacologia/importar')}>
              <FileUp className="h-4 w-4 mr-2" />
              Importar Fármacos
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, sinônimo, classe..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={classeFiltro}
            onChange={e => setClasseFiltro(e.target.value)}
            className="px-3 py-2 rounded-md border bg-background text-sm"
            aria-label="Filtrar por classe"
          >
            <option value="">Todas as classes</option>
            {CLASSES_MEDICAMENTOS_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : medicamentos.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum fármaco cadastrado.</p>
            <Button className="mt-4" onClick={() => router.push('/admin/farmacologia/importar')}>
              <FileUp className="h-4 w-4 mr-2" /> Importar fármacos
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(grupos).sort().map(classe => (
              <div key={classe}>
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-2">
                  {classe} <span className="text-muted-foreground/60">({grupos[classe].length})</span>
                </h3>
                <div className="space-y-2">
                  {grupos[classe].map((m: any) => (
                    <Card key={m._id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{m.nome}</span>
                            {m.subclasse && <Badge variant="outline" className="text-xs">{m.subclasse}</Badge>}
                            {m.tipo_farmaco && <Badge variant="secondary" className="text-xs">{m.tipo_farmaco}</Badge>}
                          </div>
                          {m.sinonimos?.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{m.sinonimos.join(' · ')}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/manual-clinico/farmacologia/${m.slug}`)}
                            title="Ver ficha"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(m._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Fármaco</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este fármaco? Esta ação não pode ser desfeita.
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
