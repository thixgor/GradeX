'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Download, CheckCircle2 } from 'lucide-react'
import { CronogramaGerado, AtividadeCronograma } from '@/lib/cronograma-types'

interface User {
  id: string
  email: string
  name: string
}

export default function CronogramaDetalhePage() {
  const router = useRouter()
  const params = useParams()
  const cronogramaId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [cronograma, setCronograma] = useState<CronogramaGerado | null>(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [atividades, setAtividades] = useState<AtividadeCronograma[]>([])

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
      loadCronograma()
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadCronograma() {
    try {
      const res = await fetch(`/api/cronogramas/${cronogramaId}`)
      if (res.ok) {
        const data = await res.json()
        const cronogramaData = data.cronograma || data
        setCronograma(cronogramaData)
        // Flatten todas as atividades
        const todasAtividades: AtividadeCronograma[] = []
        const cronogramaItems = cronogramaData.cronograma || []
        cronogramaItems.forEach((item: any) => {
          todasAtividades.push(...(item.atividades || []))
        })
        setAtividades(todasAtividades)
      } else {
        console.error('Erro ao carregar cronograma:', res.status)
      }
    } catch (error) {
      console.error('Erro ao carregar cronograma:', error)
    }
  }

  async function toggleAtividadeConcluida(atividadeId: string) {
    // Encontrar o estado atual ANTES de atualizar
    const atividadeAtual = atividades.find(a => a.id === atividadeId)
    const novoEstado = !atividadeAtual?.concluido
    
    // Atualizar estado local IMEDIATAMENTE para refletir visualmente
    const atividadeAtualizada = atividades.map(a =>
      a.id === atividadeId ? { ...a, concluido: novoEstado } : a
    )
    setAtividades(atividadeAtualizada)

    // Atualizar no servidor
    try {
      await fetch(`/api/cronogramas/${cronogramaId}/atividades/${atividadeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluido: novoEstado })
      })
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error)
      // Reverter estado se falhar
      setAtividades(atividades)
    }
  }

  async function marcarComoConcluido() {
    try {
      const res = await fetch(`/api/cronogramas/${cronogramaId}/concluir`, {
        method: 'PATCH'
      })
      if (res.ok) {
        alert('Cronograma marcado como concluído!')
        loadCronograma()
      }
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error)
    }
  }

  async function downloadPDF() {
    if (!cronograma) return

    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) {
      alert('Por favor, desabilite o bloqueador de pop-ups')
      return
    }

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

            ${cronograma.cronograma.map((dia, index) => {
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

  async function downloadImagem() {
    if (!cronograma) return

    try {
      const element = document.getElementById('cronograma-pdf')
      if (!element) return

      // Usar html2canvas se disponível, senão usar screenshot
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      script.onload = async () => {
        const canvas = await (window as any).html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false
        })
        
        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/png')
        link.download = `cronograma-${cronograma.titulo}.png`
        link.click()
      }
      document.head.appendChild(script)
    } catch (error) {
      alert('Erro ao gerar imagem. Tente novamente.')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!cronograma) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg mb-4">Cronograma não encontrado</p>
            <Button onClick={() => router.push('/cronogramas')}>
              Voltar para Cronogramas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalAtividades = atividades.length
  const atividadesConcluidas = atividades.filter(a => a.concluido).length
  const percentualConclusao = totalAtividades > 0 ? Math.round((atividadesConcluidas / totalAtividades) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/cronogramas')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{cronograma.titulo}</h1>
                <p className="text-sm text-muted-foreground">
                  {new Date(cronograma.dataCriacao).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progresso */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progresso do Cronograma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Conclusão</span>
                  <span className="text-sm font-bold text-primary">{percentualConclusao}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#468152] to-[#E2A43E] h-full transition-all duration-300"
                    style={{ width: `${percentualConclusao}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {atividadesConcluidas} de {totalAtividades} atividades concluídas
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={downloadPDF}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button
                  onClick={downloadImagem}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Imagem
                </Button>
                {percentualConclusao === 100 && (
                  <Button
                    onClick={marcarComoConcluido}
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como Concluído
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cronograma por Dia */}
        <div className="space-y-6" id="cronograma-pdf">
          <div className="mb-8 print:mb-4">
            <h2 className="text-2xl font-bold mb-2">{cronograma.titulo}</h2>
            <p className="text-muted-foreground">
              Modelo: {cronograma.modelo.toUpperCase()} • Total de horas: {cronograma.totalHoras}h
            </p>
          </div>

          {cronograma.cronograma.map((dia, index) => (
            <Card key={index} className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle className="text-lg">
                  {dia.dia} - {dia.data}
                </CardTitle>
                <CardDescription>
                  {dia.horasDisponivel}h disponível
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dia.atividades.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma atividade agendada</p>
                ) : (
                  <div className="space-y-3">
                    {dia.atividades.map((atividade) => (
                      <div
                        key={atividade.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                          atividade.concluido
                            ? 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700'
                            : 'bg-background border-muted hover:border-primary/50 hover:bg-muted/30'
                        }`}
                        onClick={() => toggleAtividadeConcluida(atividade.id)}
                      >
                        <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          atividade.concluido
                            ? 'bg-green-500 border-green-600'
                            : 'border-muted-foreground hover:border-primary'
                        }`}>
                          {atividade.concluido && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <p className={`font-medium transition-all ${
                                atividade.concluido 
                                  ? 'line-through text-green-700 dark:text-green-300' 
                                  : 'text-foreground'
                              }`}>
                                {atividade.modulo}
                              </p>
                              <p className={`text-xs transition-all ${
                                atividade.concluido
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-muted-foreground'
                              }`}>
                                {atividade.topico} • {atividade.subtopico}
                              </p>
                            </div>
                            <span className={`text-sm font-semibold whitespace-nowrap px-2 py-1 rounded transition-all ${
                              atividade.concluido
                                ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'text-primary'
                            }`}>
                              {atividade.horas}h
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full transition-all ${
                              atividade.dificuldadeUsuario === 'facil'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : atividade.dificuldadeUsuario === 'medio'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {atividade.dificuldadeUsuario === 'facil' ? 'Fácil' : atividade.dificuldadeUsuario === 'medio' ? 'Médio' : 'Difícil'}
                            </span>
                            {atividade.concluido && (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200 font-semibold">
                                ✓ Concluído
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
