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
  X
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AREAS_SAUDE, SISTEMAS_FISIOLOGICOS, type AreaSaude } from '@/lib/types/manual-clinico'

const AREA_COLORS: Record<AreaSaude, string> = {
  'Medicina': 'bg-blue-500 text-white',
  'Psicologia': 'bg-purple-500 text-white',
  'Odontologia': 'bg-emerald-500 text-white',
  'Biomedicina': 'bg-orange-500 text-white',
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
