'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { ProgressRing } from '@/components/progress-ring'
import { LimitWarning } from '@/components/limit-warning'
import { Plus, Calendar, Download, Edit2, Trash2, Sparkles, Clock, BookOpen, Target } from 'lucide-react'
import { CronogramaGerado } from '@/lib/cronograma-types'
import { AccountType } from '@/lib/types'
import { getCronogramasLimit } from '@/lib/tier-limits'

function CronogramasContent() {
  const router = useRouter()
  const { user, isAdmin, accountType: contextAccountType } = useAppShell()

  const [loading, setLoading] = useState(true)
  const [cronogramas, setCronogramas] = useState<CronogramaGerado[]>([])
  const accountType = contextAccountType as AccountType
  const userRole = isAdmin ? 'admin' : 'user'

  useEffect(() => {
    loadCronogramas()
  }, [])

  async function loadCronogramas() {
    try {
      const res = await fetch('/api/cronogramas')
      if (res.ok) {
        const data = await res.json()
        const cronogramasData = data.cronogramas || []
        const cronogramasFormatados = cronogramasData.map((c: any) => ({
          ...c,
          _id: typeof c._id === 'string' ? c._id : c._id?.toString()
        }))
        setCronogramas(cronogramasFormatados)
      } else {
        console.error('Erro ao carregar cronogramas:', res.status)
      }
    } catch (error) {
      console.error('Erro ao carregar cronogramas:', error)
    } finally {
      setLoading(false)
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
            .atividade { background: white; border-left: 4px solid #468152; padding: 12px; margin-bottom: 10px; border-radius: 4px; font-size: 13px; }
            .atividade-titulo { font-weight: 600; color: #333; margin-bottom: 4px; }
            .atividade-subtitulo { font-size: 12px; color: #666; margin-bottom: 6px; }
            .atividade-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
            .horas { background: #468152; color: white; padding: 2px 8px; border-radius: 3px; font-weight: 600; }
            .dificuldade { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; }
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

  const tierLimitExceeded = userRole !== 'admin' && accountType === 'gratuito' && cronogramas.length >= getCronogramasLimit(accountType)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 relative overflow-hidden">
      {/* Ambient floating blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="auth-bg-blob w-[500px] h-[500px] bg-[#468152]/12 top-[-10%] left-[-10%]" />
        <div className="auth-bg-blob w-[400px] h-[400px] bg-[#E2A43E]/10 bottom-[-5%] right-[-5%]" style={{ animationDelay: '-4s' }} />
        <div className="auth-bg-blob w-[300px] h-[300px] bg-[#CE5929]/6 top-[40%] right-[20%]" style={{ animationDelay: '-8s' }} />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#468152]/10 border border-[#468152]/20 text-sm font-medium text-[#468152] dark:text-[#E2A43E]"
          >
            <Sparkles className="h-4 w-4" />
            Cronograma Inteligente
          </motion.div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold">
            Cronograma Comum Todo Mundo Tem.
          </h2>
          <p className="font-heading text-2xl md:text-3xl bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent font-bold">
            O Nosso é Feito Sob Medida Pra Te Arrancar da Mediocridade.
          </p>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Crie um cronograma personalizado baseado em suas dificuldades, disponibilidade de tempo e objetivos específicos.
          </p>
        </motion.div>

        {/* Stats Row (when cronogramas exist) */}
        {cronogramas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className="glass-page-card rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-[#468152]" />
                <span className="text-xs font-medium text-muted-foreground">Cronogramas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{cronogramas.length}</p>
            </div>
            <div className="glass-page-card rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-[#E2A43E]" />
                <span className="text-xs font-medium text-muted-foreground">Horas Totais</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {cronogramas.reduce((sum, c) => sum + (c.totalHoras || 0), 0)}h
              </p>
            </div>
            <div className="glass-page-card rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="h-4 w-4 text-[#CE5929]" />
                <span className="text-xs font-medium text-muted-foreground">Progresso Médio</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {cronogramas.length > 0
                  ? Math.round(cronogramas.reduce((sum, c) => sum + calculateProgress(c), 0) / cronogramas.length)
                  : 0}%
              </p>
            </div>
          </motion.div>
        )}

        {/* Limit Warning for Free Users */}
        {user && userRole !== 'admin' && accountType === 'gratuito' && (
          <LimitWarning
            current={cronogramas.length}
            max={getCronogramasLimit(accountType)}
            itemName="Cronogramas"
          />
        )}

        {/* CTA Button - Grande e destacado */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col items-center mb-10"
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Button
              onClick={() => router.push('/cronogramas/criar')}
              size="lg"
              disabled={tierLimitExceeded}
              className="h-14 px-8 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white shadow-xl shadow-[#468152]/20 soul-light soul-light-brand btn-brand-glow border-0"
            >
              <Plus className="mr-2 h-5 w-5" />
              Criar Novo Cronograma
            </Button>
          </motion.div>
          {tierLimitExceeded && (
            <p className="text-sm text-red-600 mt-3 font-medium">Limite de {getCronogramasLimit(accountType)} cronogramas atingido</p>
          )}
        </motion.div>

        {/* Cronogramas List */}
        {cronogramas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="auth-glass-card text-center py-16 px-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
              className="h-20 w-20 rounded-full bg-[#468152]/10 flex items-center justify-center mx-auto mb-6"
            >
              <Calendar className="h-10 w-10 text-[#468152]" />
            </motion.div>
            <h3 className="text-xl font-bold mb-2 text-foreground">Nenhum cronograma criado ainda</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Comece criando seu primeiro cronograma personalizado e organize seus estudos de forma inteligente.
            </p>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                onClick={() => router.push('/cronogramas/criar')}
                className="h-12 px-6 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
              >
                <Plus className="mr-2 h-5 w-5" />
                Criar Primeiro Cronograma
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="grid gap-5">
            {cronogramas.map((cronograma, index) => {
              const totalHoras = cronograma.totalHoras || 0
              const dataCriacao = new Date(cronograma.dataCriacao)
              const progress = calculateProgress(cronograma)

              return (
                <motion.div
                  key={cronograma._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.07 }}
                >
                  <div className="glass-page-card rounded-2xl soul-light hover-lift overflow-hidden">
                    {/* Progress bar at top */}
                    <div className="h-1 bg-muted/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#468152] to-[#E2A43E] rounded-full"
                      />
                    </div>

                    <div className="p-5">
                      {/* Card Header */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                              {cronograma.titulo}
                              {(cronograma as any).concluido && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#468152]/10 text-[#468152] text-xs font-semibold border border-[#468152]/20">
                                  ✓ Concluído
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Modelo: {cronograma.modelo.toUpperCase()} • {totalHoras}h total
                            </p>
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
                      </div>

                      {/* Card Content */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="backdrop-blur-sm bg-white/10 dark:bg-white/5 rounded-xl p-3 border border-white/20 dark:border-white/5">
                            <p className="text-muted-foreground text-xs">Período</p>
                            <p className="font-semibold text-foreground">
                              {cronograma.config?.modelo === 'medicina-afya'
                                ? `Período ${cronograma.config?.tempoEstudo ? Object.keys(cronograma.config).length : '?'}`
                                : 'Geral'
                              }
                            </p>
                          </div>
                          <div className="backdrop-blur-sm bg-white/10 dark:bg-white/5 rounded-xl p-3 border border-white/20 dark:border-white/5">
                            <p className="text-muted-foreground text-xs">Dias de Estudo</p>
                            <p className="font-semibold text-foreground">
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
                            className="soul-light rounded-xl"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadPDFDiretamente(cronograma)}
                            className="soul-light rounded-xl backdrop-blur-sm bg-white/20 dark:bg-white/5 border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteCronograma(cronograma._id!)}
                            className="soul-light rounded-xl"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Main page component - wraps content in AppShell
export default function CronogramasPage() {
  return (
    <AppShell headerTitle="Cronogramas" headerSubtitle="Organize seus estudos">
      <CronogramasContent />
    </AppShell>
  )
}
