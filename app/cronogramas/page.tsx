'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { ProgressRing } from '@/components/progress-ring'
import { ArrowLeft, Plus, Calendar, Download, Edit2, Trash2 } from 'lucide-react'
import { CronogramaGerado } from '@/lib/cronograma-types'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export default function CronogramasPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [cronogramas, setCronogramas] = useState<CronogramaGerado[]>([])

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
      setUser(data.user)
      loadCronogramas()
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadCronogramas() {
    try {
      const res = await fetch('/api/cronogramas')
      if (res.ok) {
        const data = await res.json()
        const cronogramas = data.cronogramas || []
        // Garantir que _id é string
        const cronogramasFormatados = cronogramas.map((c: any) => ({
          ...c,
          _id: typeof c._id === 'string' ? c._id : c._id?.toString()
        }))
        setCronogramas(cronogramasFormatados)
      } else {
        console.error('Erro ao carregar cronogramas:', res.status)
      }
    } catch (error) {
      console.error('Erro ao carregar cronogramas:', error)
    }
  }

  async function deleteCronograma(id: string) {
    if (!confirm('Tem certeza que deseja deletar este cronograma?')) return

    try {
      const res = await fetch(`/api/cronogramas/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCronogramas(cronogramas.filter(c => c._id !== id))
      }
    } catch (error) {
      console.error('Erro ao deletar cronograma:', error)
    }
  }

  function calculateProgress(cronograma: CronogramaGerado): number {
    if (!cronograma.cronograma || cronograma.cronograma.length === 0) {
      return 0
    }

    let totalAtividades = 0
    let atividadesCompletas = 0

    cronograma.cronograma.forEach((dia) => {
      if (dia.atividades && dia.atividades.length > 0) {
        dia.atividades.forEach((atividade) => {
          totalAtividades++
          if (atividade.concluido) {
            atividadesCompletas++
          }
        })
      }
    })

    if (totalAtividades === 0) {
      return 0
    }

    return Math.round((atividadesCompletas / totalAtividades) * 100)
  }

  function downloadPDFDiretamente(cronograma: any) {
    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) {
      alert('Por favor, desabilite o bloqueador de pop-ups')
      return
    }

    const atividades: any[] = []
    cronograma.cronograma?.forEach((item: any) => {
      atividades.push(...(item.atividades || []))
    })

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${cronograma.titulo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              background: #f5f5f5;
              padding: 40px 20px;
            }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #468152; padding-bottom: 20px; }
            .header h1 { color: #333; font-size: 28px; margin-bottom: 10px; }
            .header p { color: #666; font-size: 14px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-box { background: linear-gradient(135deg, #468152 0%, #5a9a63 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-box .label { font-size: 12px; opacity: 0.9; margin-bottom: 5px; }
            .stat-box .value { font-size: 24px; font-weight: bold; }
            .semana { margin-bottom: 30px; page-break-inside: avoid; }
            .semana-title { background: #468152; color: white; padding: 12px 15px; border-radius: 4px; margin-bottom: 15px; font-weight: 600; }
            .dias-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .dia { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; }
            .dia-header { background: #e8f5e9; padding: 10px 12px; border-radius: 4px; margin-bottom: 12px; font-weight: 600; color: #2e7d32; font-size: 13px; }
            .atividade { 
              background: white; 
              border-left: 4px solid #468152; 
              padding: 12px; 
              margin-bottom: 10px; 
              border-radius: 4px;
              font-size: 13px;
            }
            .atividade-titulo { font-weight: 600; color: #333; margin-bottom: 4px; }
            .atividade-subtitulo { font-size: 12px; color: #666; margin-bottom: 6px; }
            .atividade-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
            .horas { background: #468152; color: white; padding: 2px 8px; border-radius: 3px; font-weight: 600; }
            .dificuldade { 
              display: inline-block; 
              padding: 3px 8px; 
              border-radius: 3px; 
              font-size: 11px; 
              font-weight: 600;
            }
            .facil { background: #d4edda; color: #155724; }
            .medio { background: #fff3cd; color: #856404; }
            .dificil { background: #f8d7da; color: #721c24; }
            .vazio { color: #999; font-style: italic; font-size: 12px; padding: 10px; text-align: center; }
            @media print {
              body { padding: 0; background: white; }
              .container { box-shadow: none; padding: 20px; }
              .dias-grid { grid-template-columns: repeat(2, 1fr); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${cronograma.titulo}</h1>
              <p>Modelo: ${cronograma.modelo.toUpperCase()} • Total: ${cronograma.totalHoras}h</p>
            </div>
            
            <div class="stats">
              <div class="stat-box">
                <div class="label">Total de Horas</div>
                <div class="value">${cronograma.totalHoras}h</div>
              </div>
              <div class="stat-box">
                <div class="label">Semanas</div>
                <div class="value">${Math.ceil(cronograma.cronograma.length / 7)}</div>
              </div>
              <div class="stat-box">
                <div class="label">Atividades</div>
                <div class="value">${atividades.length}</div>
              </div>
            </div>

            ${cronograma.cronograma.map((dia: any, index: number) => {
              const semanaNum = Math.floor(index / 7) + 1
              const diaNumSemana = index % 7
              
              if (diaNumSemana === 0) {
                return `
                  <div class="semana">
                    <div class="semana-title">Semana ${semanaNum}</div>
                    <div class="dias-grid">
                      ${gerarDiaHTML(dia)}
                ` + (index + 1 < cronograma.cronograma.length && Math.floor((index + 1) / 7) !== semanaNum ? '</div></div>' : '')
              } else if (diaNumSemana === 6 || index === cronograma.cronograma.length - 1) {
                return `
                      ${gerarDiaHTML(dia)}
                    </div>
                  </div>
                `
              } else {
                return `${gerarDiaHTML(dia)}`
              }
            }).join('')}
          </div>
        </body>
      </html>
    `

    function gerarDiaHTML(dia: any) {
      return `
        <div class="dia">
          <div class="dia-header">${dia.dia} - ${dia.data}</div>
          ${dia.atividades.length === 0 
            ? '<div class="vazio">Sem atividades</div>'
            : dia.atividades.map((ativ: any) => `
              <div class="atividade">
                <div class="atividade-titulo">${ativ.modulo}</div>
                <div class="atividade-subtitulo">${ativ.topico} • ${ativ.subtopico}</div>
                <div class="atividade-footer">
                  <span class="horas">${ativ.horas}h</span>
                  <span class="dificuldade ${ativ.dificuldadeUsuario}">${ativ.dificuldadeUsuario === 'facil' ? 'Fácil' : ativ.dificuldadeUsuario === 'medio' ? 'Médio' : 'Difícil'}</span>
                </div>
              </div>
            `).join('')
          }
        </div>
      `
    }

    printWindow.document.write(html)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b w-full">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4 min-h-[56px] sm:min-h-[64px]">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 truncate">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                <span className="hidden sm:inline">Cronogramas Personalizados</span>
                <span className="sm:hidden">Cronogramas</span>
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-12 text-center space-y-4">
          <h2 className="font-heading text-4xl md:text-5xl font-bold">
            Cronograma Comum Todo Mundo Tem.
          </h2>
          <p className="font-heading text-2xl md:text-3xl bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">
            O Nosso é Feito Sob Medida Pra Te Arrancar da Mediocridade.
          </p>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Crie um cronograma personalizado baseado em suas dificuldades, disponibilidade de tempo e objetivos específicos.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mb-12">
          <Button
            onClick={() => router.push('/cronogramas/criar')}
            size="lg"
            className="bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Criar Novo Cronograma
          </Button>
        </div>

        {/* Cronogramas List */}
        {cronogramas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cronograma criado ainda</h3>
              <p className="text-muted-foreground mb-6">
                Comece criando seu primeiro cronograma personalizado
              </p>
              <Button
                onClick={() => router.push('/cronogramas/criar')}
                variant="outline"
              >
                Criar Cronograma
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {cronogramas.map((cronograma) => {
              const totalHoras = cronograma.totalHoras || 0
              const dataCriacao = new Date(cronograma.dataCriacao)
              const progress = calculateProgress(cronograma)
              
              return (
                <Card key={cronograma._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {cronograma.titulo}
                          {(cronograma as any).concluido && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-semibold">
                              ✓ Concluído
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Modelo: {cronograma.modelo.toUpperCase()} • {totalHoras}h total
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-6">
                        <ProgressRing 
                          percentage={progress}
                          size={80}
                          strokeWidth={3}
                          label="Progresso"
                        />
                        <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                          <div>{dataCriacao.toLocaleDateString('pt-BR')}</div>
                          <div className="text-xs">{dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Período</p>
                          <p className="font-semibold">
                            {cronograma.config?.modelo === 'medicina-afya' 
                              ? `Período ${cronograma.config?.tempoEstudo ? Object.keys(cronograma.config).length : '?'}`
                              : 'Geral'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dias de Estudo</p>
                          <p className="font-semibold">
                            {cronograma.tempoEstudo 
                              ? Object.values(cronograma.tempoEstudo).filter(h => h > 0).length
                              : 0
                            } dias/semana
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => router.push(`/cronogramas/${cronograma._id}`)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPDFDiretamente(cronograma)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteCronograma(cronograma._id!)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
