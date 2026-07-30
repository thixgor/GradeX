'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  History,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
  BarChart3,
  BookOpen,
  Clock
} from 'lucide-react'
import { BancoPaginacao, BancoEstatisticasUsuario } from '@/lib/types/banco-questoes'

interface HistoricoItem {
  _id: string
  questaoId: string
  tipo: 'objetiva' | 'discursiva'
  alternativaSelecionada?: string
  correta?: boolean
  respostaUsuario?: string
  tempoGasto?: number
  createdAt: string
  questao?: {
    _id: string
    enunciado: string
    tipo: string
  }
  periodoNome?: string
}

export default function HistoricoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requiresPlus, setRequiresPlus] = useState(false)

  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [paginacao, setPaginacao] = useState<BancoPaginacao | null>(null)
  const [estatisticas, setEstatisticas] = useState<BancoEstatisticasUsuario | null>(null)

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroResultado, setFiltroResultado] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!requiresPlus) {
      loadHistorico()
    }
  }, [filtroTipo, filtroResultado])

  async function loadData() {
    try {
      // Carregar estatísticas
      const statsRes = await fetch('/api/banco/estatisticas')
      if (statsRes.status === 403) {
        const data = await statsRes.json()
        if (data.requiresPlus) {
          setRequiresPlus(true)
          setLoading(false)
          return
        }
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setEstatisticas(statsData.estatisticas)
      }

      await loadHistorico()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadHistorico(page = 1) {
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (filtroTipo) params.set('tipo', filtroTipo)
      if (filtroResultado === 'corretas') params.set('apenasCorretas', 'true')
      if (filtroResultado === 'erradas') params.set('apenasErradas', 'true')

      const res = await fetch(`/api/banco/historico?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setHistorico(data.historico)
        setPaginacao(data.paginacao)
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatTempo(segundos?: number) {
    if (!segundos) return '-'
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    if (minutos > 0) {
      return `${minutos}m ${segs}s`
    }
    return `${segs}s`
  }

  if (loading) {
    return (
      <AppShell headerTitle="Histórico">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (requiresPlus) {
    return (
      <AppShell headerTitle="Histórico">
        <div className="container max-w-2xl py-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Acesso Plus+</CardTitle>
              <CardDescription className="text-base">
                O histórico de resoluções é exclusivo para assinantes Plus+
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push('/buy')}
                className="w-full bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90"
                size="lg"
              >
                Assinar Plus+
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell headerTitle="Histórico de Resoluções">
      <div className="container py-6 space-y-6">
        {/* Cards de estatísticas */}
        {estatisticas && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Resolvidas</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.totalResolvidas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Acertos</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{estatisticas.totalAcertos}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Erros</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{estatisticas.totalErros}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.percentualAcerto}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-[150px]">
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="objetiva">Objetiva</SelectItem>
                    <SelectItem value="discursiva">Discursiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[150px]">
                <Select value={filtroResultado} onValueChange={setFiltroResultado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="corretas">Corretas</SelectItem>
                    <SelectItem value="erradas">Erradas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {historico.length === 0 ? (
              <div className="py-12 text-center">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma resolução encontrada</h3>
                <p className="text-muted-foreground">
                  Comece a resolver questões para ver seu histórico
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Questão</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.tipo === 'objetiva' ? 'default' : 'secondary'}>
                          {item.tipo === 'objetiva' ? 'OBJ' : 'DIS'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate text-sm">
                          {item.questao?.enunciado || 'Questão não encontrada'}
                        </p>
                        {item.periodoNome && (
                          <span className="text-xs text-muted-foreground">{item.periodoNome}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.tipo === 'objetiva' ? (
                          item.correta ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm">Correta</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Errada</span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-1 text-blue-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">Respondida</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTempo(item.tempoGasto)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/banco-questoes/${item.questaoId}`)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Paginação */}
            {paginacao && paginacao.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  disabled={paginacao.page <= 1}
                  onClick={() => loadHistorico(paginacao.page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {paginacao.page} de {paginacao.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={paginacao.page >= paginacao.totalPages}
                  onClick={() => loadHistorico(paginacao.page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
