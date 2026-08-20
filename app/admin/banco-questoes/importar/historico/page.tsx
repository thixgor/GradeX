'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'
import { BanChecker } from '@/components/ban-checker'
import { ArrowLeft, History, Trash2, AlertTriangle, Loader2, Inbox } from 'lucide-react'
import { BancoImportacaoLote } from '@/lib/types/banco-questoes'

/**
 * Histórico de importações: uma linha por leva de arquivo TXT importado.
 *
 * A leva só existe enquanto tiver ao menos uma questão viva (ver a rota
 * GET) — por isso apagar uma leva a faz sumir desta lista, e não fica um
 * registro "apagado" para sempre.
 */
export default function HistoricoDeImportacoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [carregandoLotes, setCarregandoLotes] = useState(true)
  const [lotes, setLotes] = useState<BancoImportacaoLote[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [apagando, setApagando] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      if (data.user.role !== 'admin') {
        router.push('/')
        return
      }
    } catch (error) {
      router.push('/auth/login')
      return
    } finally {
      setLoading(false)
    }
    carregarLotes()
  }

  async function carregarLotes() {
    setCarregandoLotes(true)
    try {
      const res = await fetch('/api/admin/banco/importar/historico')
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Não foi possível carregar o histórico')
        return
      }
      setLotes(data.lotes || [])
    } catch (error) {
      setErro('Não foi possível carregar o histórico')
    } finally {
      setCarregandoLotes(false)
    }
  }

  async function apagarLote(loteId: string) {
    setApagando(loteId)
    setErro(null)
    try {
      const res = await fetch(`/api/admin/banco/importar/historico/${loteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Não foi possível apagar a leva')
        return
      }
      setLotes((atual) => atual.filter((l) => l.loteId !== loteId))
    } catch (error) {
      setErro('Não foi possível apagar a leva')
    } finally {
      setApagando(null)
      setConfirmando(null)
    }
  }

  if (loading) {
    return <LogoLoading message="Carregando..." size="lg" fullscreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <BanChecker />

      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin/banco-questoes/importar')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Histórico de Importações
                </h1>
                <p className="text-sm text-muted-foreground">
                  Cada leva é um arquivo TXT importado. Apagar uma leva remove só as questões dela.
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {erro && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {carregandoLotes ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Carregando histórico...
          </div>
        ) : lotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <p>Nenhuma leva de importação encontrada.</p>
              <p className="text-xs">
                Só aparecem aqui as importações feitas pela tela de importação em massa (TXT), depois
                desta funcionalidade ter entrado no ar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {lotes.map((lote) => (
              <Card key={lote.loteId}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {new Date(lote.criadoEm).toLocaleString('pt-BR')}
                      </CardTitle>
                      <CardDescription>
                        {lote.criadoPorNome ? `Importado por ${lote.criadoPorNome}` : 'Importado por admin'}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary">{lote.quantidade} questão(ões)</Badge>
                      {lote.objetivas > 0 && <Badge variant="outline">{lote.objetivas} objetiva(s)</Badge>}
                      {lote.discursivas > 0 && (
                        <Badge variant="outline">{lote.discursivas} discursiva(s)</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lote.modulos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lote.modulos.map((nome) => (
                        <Badge key={nome} variant="outline" className="font-normal">
                          {nome}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {confirmando === lote.loteId ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                      <span className="flex-1">
                        Apagar as {lote.quantidade} questões desta leva? As respostas dos alunos e o
                        lugar delas em listas somem junto. Não dá para desfazer.
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={apagando === lote.loteId}
                          onClick={() => void apagarLote(lote.loteId)}
                        >
                          {apagando === lote.loteId ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Confirmar exclusão
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={apagando === lote.loteId}
                          onClick={() => setConfirmando(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmando(lote.loteId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Apagar esta leva
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
