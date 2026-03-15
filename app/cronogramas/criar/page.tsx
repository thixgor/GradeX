'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { CustomCronogramaBuilder } from '@/components/custom-cronograma-builder'
import { CustomCalendar } from '@/components/custom-calendar'
import { ArrowLeft, ChevronLeft, ChevronRight, Info, Sparkles } from 'lucide-react'
import { TEMPLATES, ModelType, UserDifficulty, StudyTime, TopicItem, SubtopicItem, ModuleItem, MedicinaAFYAPeriodo, PsicologiaAFYAPeriodo, BiomedicinaAFYAPeriodo, OdontologiaAFYAPeriodo } from '@/lib/cronograma-types'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { getMedicinaAFYATopicos } from '@/lib/medicina-afya-periodos-helper'
import { getPsicologiaAFYATopicos } from '@/lib/psicologia-afya-periodos-helper'
import { getBiomedicinaAFYATopicos } from '@/lib/biomedicina-afya-periodos-helper'
import { getOdontologiaAFYATopicos } from '@/lib/odontologia-afya-periodos-helper'
import { LogoLoading } from '@/components/logo-loading'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

type Step = 'modelo' | 'periodo' | 'tempo' | 'data' | 'topicos' | 'confirmacao'

export default function CriarCronogramaPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('modelo')
  
  // Form state
  const [titulo, setTitulo] = useState('')
  const [modelo, setModelo] = useState<ModelType>('enem')
  const [periodo, setPeriodo] = useState<MedicinaAFYAPeriodo>(1)
  const [periodoPsi, setPeriodoPsi] = useState<PsicologiaAFYAPeriodo>(1)
  const [periodoBio, setPeriodoBio] = useState<BiomedicinaAFYAPeriodo>(1)
  const [periodoOdo, setPeriodoOdo] = useState<OdontologiaAFYAPeriodo>(1)
  const [selectedTopico, setSelectedTopico] = useState<string | null>(null)
  const [selectedSubtopico, setSelectedSubtopico] = useState<string | null>(null)
  const [tempoEstudo, setTempoEstudo] = useState<StudyTime>({
    segunda: 2,
    terca: 2,
    quarta: 2,
    quinta: 2,
    sexta: 2,
    sabado: 3,
    domingo: 1
  })
  const [topicos, setTopicos] = useState<TopicItem[]>([])
  const [moduloInfoAberto, setModuloInfoAberto] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState('topicos' as 'topicos' | 'subtopicos' | 'modulos')
  const [gerando, setGerando] = useState(false)
  const [dataTermino, setDataTermino] = useState<string>('')

  // Inicializar tópicos com deep copy
  useEffect(() => {
    let topicosCopiados: TopicItem[] = []
    
    // Se for Medicina AFYA ou Psicologia AFYA, usar a função helper para obter tópicos por período
    if (modelo === 'medicina-afya') {
      topicosCopiados = JSON.parse(JSON.stringify(getMedicinaAFYATopicos(periodo)))
    } else if (modelo === 'psicologia-afya') {
      topicosCopiados = JSON.parse(JSON.stringify(getPsicologiaAFYATopicos(periodoPsi)))
    } else if (modelo === 'biomedicina-afya') {
      topicosCopiados = JSON.parse(JSON.stringify(getBiomedicinaAFYATopicos(periodoBio)))
    } else if (modelo === 'odontologia-afya') {
      topicosCopiados = JSON.parse(JSON.stringify(getOdontologiaAFYATopicos(periodoOdo)))
    } else if (modelo === 'personalizado') {
      // Para cronograma personalizado, começar com array vazio
      topicosCopiados = []
    } else {
      topicosCopiados = JSON.parse(JSON.stringify(TEMPLATES[modelo].topicos))
    }
    
    setTopicos(topicosCopiados)
    setSelectedTopico(null)
    setSelectedSubtopico(null)
  }, [modelo, periodo, periodoPsi, periodoBio, periodoOdo])

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
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function gerarCronograma() {
    if (!titulo.trim()) {
      alert('Por favor, insira um título para o cronograma')
      return
    }

    // Para cronograma personalizado, validar que tem tópicos com módulos selecionados
    if (modelo === 'personalizado') {
      const temModulosSelecionados = topicos.some(t =>
        t.subtopicos.some(s =>
          s.modulos.some(m => m.incluido)
        )
      )
      if (!temModulosSelecionados) {
        alert('Selecione pelo menos um módulo')
        return
      }
    }

    setGerando(true)
    try {
      // Coletar todos os módulos selecionados com suas informações
      const modulosSelecionados: any[] = []
      let totalHoras = 0

      topicos.forEach((topico) => {
        if (topico.incluido) {
          topico.subtopicos.forEach((subtopico) => {
            if (subtopico.incluido) {
              subtopico.modulos.forEach((modulo) => {
                if (modulo.incluido) {
                  modulosSelecionados.push({
                    topicoId: topico.id,
                    topicoNome: topico.nome,
                    subtopicId: subtopico.id,
                    subtopicNome: subtopico.nome,
                    moduloId: modulo.id,
                    moduloNome: modulo.nome,
                    horasEstimadas: modulo.horasEstimadas,
                    dificuldade: modulo.dificuldadeUsuario || 'medio'
                  })
                  totalHoras += modulo.horasEstimadas
                }
              })
            }
          })
        }
      })

      if (modulosSelecionados.length === 0) {
        alert('Selecione pelo menos um módulo')
        setGerando(false)
        return
      }

      // Gerar cronograma distribuindo módulos pelos dias até a data de término
      const cronogramaItems: any[] = []
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - dataInicio.getDay() + 1) // Próxima segunda
      
      // Para cronograma personalizado, usar 30 dias como padrão se não tiver data de término
      const dataTerminoFinal = modelo === 'personalizado' && !dataTermino
        ? new Date(dataInicio.getTime() + 30 * 24 * 60 * 60 * 1000)
        : new Date(dataTermino)
      
      const dataFim = new Date(dataTerminoFinal)
      dataFim.setHours(23, 59, 59, 999)

      let moduloIndex = 0
      let diaAtual = new Date(dataInicio)

      while (moduloIndex < modulosSelecionados.length && diaAtual <= dataFim) {
        const diaIndex = diaAtual.getDay() === 0 ? 6 : diaAtual.getDay() - 1 // Converter para índice 0-6 (segunda-domingo)
        const horasDisponivel = tempoEstudo[dias[diaIndex]]

        if (horasDisponivel > 0) {
          const atividades: any[] = []
          let horasUsadas = 0

          while (moduloIndex < modulosSelecionados.length && horasUsadas < horasDisponivel) {
            const modulo = modulosSelecionados[moduloIndex]
            const horasRestantes = horasDisponivel - horasUsadas
            const horasParaUsar = Math.min(modulo.horasEstimadas, horasRestantes)

            atividades.push({
              id: `${modulo.moduloId}-${diaAtual.toISOString().split('T')[0]}`,
              topico: modulo.topicoNome,
              subtopico: modulo.subtopicNome,
              modulo: modulo.moduloNome,
              dificuldadeUsuario: modulo.dificuldade,
              horas: horasParaUsar,
              descricao: `${modulo.moduloNome} - ${modulo.subtopicNome}`,
              concluido: false
            })

            horasUsadas += horasParaUsar
            modulo.horasEstimadas -= horasParaUsar

            if (modulo.horasEstimadas <= 0) {
              moduloIndex++
            }
          }

          if (atividades.length > 0) {
            cronogramaItems.push({
              dia: diasNomes[diaIndex],
              data: diaAtual.toISOString().split('T')[0],
              horasDisponivel,
              atividades
            })
          }
        }

        // Ir para o próximo dia
        diaAtual.setDate(diaAtual.getDate() + 1)
      }

      // Enviar para API
      const res = await fetch('/api/cronogramas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          modelo,
          tempoEstudo,
          config: {
            modelo,
            tempoEstudo,
            topicosInclusos: topicos.filter(t => t.incluido).map(t => t.id),
            subtopicosInclusos: topicos
              .flatMap(t => t.subtopicos.filter(s => s.incluido).map(s => s.id)),
            modulosInclusos: topicos
              .flatMap(t => t.subtopicos
                .flatMap(s => s.modulos.filter(m => m.incluido).map(m => m.id)))
          },
          cronograma: cronogramaItems,
          totalHoras
        })
      })

      if (res.ok) {
        alert('Cronograma gerado com sucesso!')
        router.push('/cronogramas')
      } else {
        const error = await res.json()
        if (error.requiresUpgrade) {
          router.push('/buy')
          return
        }
        alert(`Erro ao gerar cronograma: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao gerar cronograma:', error)
      alert('Erro ao gerar cronograma')
    } finally {
      setGerando(false)
    }
  }

  if (loading) {
    return <LogoLoading message="Carregando..." size="lg" fullscreen />
  }

  if (!user) {
    return null
  }

  const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'] as const
  const diasNomes = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

  // Funções para atualizar tópicos, subtópicos e módulos
  function toggleTopico(topicoId: string) {
    setTopicos(
      topicos.map((topico) =>
        topico.id === topicoId
          ? {
              ...topico,
              incluido: !topico.incluido,
              subtopicos: topico.subtopicos.map((subtopic) => ({
                ...subtopic,
                incluido: !topico.incluido,
                modulos: subtopic.modulos.map((modulo) => ({
                  ...modulo,
                  incluido: !topico.incluido
                }))
              }))
            }
          : topico
      )
    )
  }

  function toggleSubtopico(topicoId: string, subtopicId: string) {
    setTopicos(
      topicos.map((topico) =>
        topico.id === topicoId
          ? {
              ...topico,
              subtopicos: topico.subtopicos.map((subtopic) =>
                subtopic.id === subtopicId
                  ? {
                      ...subtopic,
                      incluido: !subtopic.incluido,
                      modulos: subtopic.modulos.map((modulo) => ({
                        ...modulo,
                        incluido: !subtopic.incluido
                      }))
                    }
                  : subtopic
              )
            }
          : topico
      )
    )
  }

  function toggleTodosModulosSubtopico(topicoId: string, subtopicId: string) {
    setTopicos(
      topicos.map((topico) =>
        topico.id === topicoId
          ? {
              ...topico,
              subtopicos: topico.subtopicos.map((subtopic) =>
                subtopic.id === subtopicId
                  ? {
                      ...subtopic,
                      modulos: subtopic.modulos.map((modulo) => ({
                        ...modulo,
                        incluido: !subtopic.modulos.every((m) => m.incluido)
                      }))
                    }
                  : subtopic
              )
            }
          : topico
      )
    )
  }

  function toggleModulo(topicoId: string, subtopicId: string, moduloId: string) {
    setTopicos(
      topicos.map((topico) =>
        topico.id === topicoId
          ? {
              ...topico,
              subtopicos: topico.subtopicos.map((subtopic) =>
                subtopic.id === subtopicId
                  ? {
                      ...subtopic,
                      modulos: subtopic.modulos.map((modulo) =>
                        modulo.id === moduloId
                          ? { ...modulo, incluido: !modulo.incluido }
                          : modulo
                      )
                    }
                  : subtopic
              )
            }
          : topico
      )
    )
  }

  function setModuloDificuldade(
    topicoId: string,
    subtopicId: string,
    moduloId: string,
    dificuldade: UserDifficulty
  ) {
    setTopicos(
      topicos.map((topico) =>
        topico.id === topicoId
          ? {
              ...topico,
              subtopicos: topico.subtopicos.map((subtopic) =>
                subtopic.id === subtopicId
                  ? {
                      ...subtopic,
                      modulos: subtopic.modulos.map((modulo) =>
                        modulo.id === moduloId
                          ? { ...modulo, dificuldadeUsuario: dificuldade }
                          : modulo
                      )
                    }
                  : subtopic
              )
            }
          : topico
      )
    )
  }

  const totalHoras = Object.values(tempoEstudo).reduce((a, b) => a + b, 0)

  // Find the currently open module for the submódulos modal
  const moduloAberto = (() => {
    if (!moduloInfoAberto) return null
    for (const topico of topicos) {
      for (const subtopico of topico.subtopicos) {
        const modulo = subtopico.modulos.find(m => m.id === moduloInfoAberto)
        if (modulo && (modulo as any).submodulos?.length > 0) {
          return { modulo, submodulos: (modulo as any).submodulos as { id: string; nome: string }[] }
        }
      }
    }
    return null
  })()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Ambient floating blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="auth-bg-blob w-[500px] h-[500px] bg-[#468152]/15 top-[-10%] left-[-10%]" />
        <div className="auth-bg-blob w-[400px] h-[400px] bg-[#E2A43E]/12 bottom-[-5%] right-[-5%]" style={{ animationDelay: '-4s' }} />
        <div className="auth-bg-blob w-[300px] h-[300px] bg-[#CE5929]/8 top-[40%] right-[20%]" style={{ animationDelay: '-8s' }} />
      </div>

      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/20 dark:border-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/cronogramas')}
                className="soul-light rounded-xl backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Criar Cronograma</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-between items-center"
        >
          {(['modelo', 'periodo', 'tempo', 'data', 'topicos', 'confirmacao'] as const).map((s, i) => {
            const currentIndex = (['modelo', 'periodo', 'tempo', 'data', 'topicos', 'confirmacao'] as const).indexOf(step)
            const isActive = step === s
            const isCompleted = i < currentIndex
            return (
              <div key={s} className="flex items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isActive ? 'rgb(var(--primary))' : isCompleted ? '#468152' : 'rgb(var(--muted))'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors shadow-md ${
                    isActive
                      ? 'bg-primary text-white shadow-primary/30'
                      : isCompleted
                      ? 'bg-[#468152] text-white shadow-[#468152]/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? '✓' : i + 1}
                </motion.div>
                {i < 5 && (
                  <div className={`w-12 h-1 mx-2 rounded-full transition-colors duration-500 ${
                    i < currentIndex ? 'bg-[#468152]' : 'bg-muted'
                  }`} />
                )}
              </div>
            )
          })}
        </motion.div>

        {/* Step 1: Modelo */}
        {step === 'modelo' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="glass-page-card rounded-2xl overflow-hidden">
              <div className="p-6 pb-3">
                <h2 className="text-2xl font-bold">Escolha o Modelo</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecione qual modelo de cronograma você deseja criar
                </p>
              </div>
              <div className="px-6 pb-6 space-y-3">
                {Object.values(TEMPLATES).map((template, index) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    onClick={() => setModelo(template.modelo)}
                    className={`w-full p-4 rounded-xl text-left transition-all soul-light ${
                      modelo === template.modelo
                        ? 'border-2 border-primary bg-primary/10 shadow-md shadow-primary/10'
                        : 'border-2 border-white/30 dark:border-white/10 backdrop-blur-sm bg-white/20 dark:bg-white/5 hover:border-primary/50 hover:bg-white/30 dark:hover:bg-white/10'
                    }`}
                  >
                    <h3 className="font-semibold">{template.nome}</h3>
                    <p className="text-sm text-muted-foreground">{template.descricao}</p>
                  </motion.button>
                ))}
                <Button
                  onClick={() => {
                    if (modelo === 'medicina-afya' || modelo === 'psicologia-afya' || modelo === 'biomedicina-afya' || modelo === 'odontologia-afya') {
                      setStep('periodo')
                    } else if (modelo === 'personalizado') {
                      setStep('topicos')
                    } else {
                      setStep('tempo')
                    }
                  }}
                  className="w-full mt-6 h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
                >
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Período (para Medicina AFYA e Psicologia AFYA) */}
        {step === 'periodo' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="glass-page-card rounded-2xl overflow-hidden">
              <div className="p-6 pb-3">
                <h2 className="text-2xl font-bold">Escolha seu Período</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {modelo === 'psicologia-afya' || modelo === 'odontologia-afya'
                    ? 'Selecione qual período você está cursando (1º ao 10º)'
                    : modelo === 'biomedicina-afya'
                    ? 'Selecione qual período você está cursando (1º ao 7º)'
                    : 'Selecione qual período você está cursando (1º ao 5º)'}
                </p>
              </div>
              <div className="px-6 pb-6 space-y-4">
                <div className={`grid grid-cols-5 gap-3`}>
                  {(modelo === 'psicologia-afya' || modelo === 'odontologia-afya' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : modelo === 'biomedicina-afya' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5]).map((p) => (
                    <motion.button
                      key={p}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (modelo === 'psicologia-afya') {
                          setPeriodoPsi(p as PsicologiaAFYAPeriodo)
                        } else if (modelo === 'biomedicina-afya') {
                          setPeriodoBio(p as BiomedicinaAFYAPeriodo)
                        } else if (modelo === 'odontologia-afya') {
                          setPeriodoOdo(p as OdontologiaAFYAPeriodo)
                        } else {
                          setPeriodo(p as MedicinaAFYAPeriodo)
                        }
                      }}
                      className={`p-4 rounded-xl font-semibold transition-all soul-light ${
                        (modelo === 'psicologia-afya' ? periodoPsi === p : modelo === 'biomedicina-afya' ? periodoBio === p : modelo === 'odontologia-afya' ? periodoOdo === p : periodo === p)
                          ? 'border-2 border-primary bg-primary text-white shadow-lg shadow-primary/20'
                          : 'border-2 border-white/30 dark:border-white/10 backdrop-blur-sm bg-white/20 dark:bg-white/5 hover:border-primary/50'
                      }`}
                    >
                      {p}º
                    </motion.button>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={() => setStep('modelo')}
                    variant="outline"
                    className="flex-1 rounded-xl soul-light h-11"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(modelo === 'personalizado' ? 'topicos' : 'tempo')}
                    className="flex-1 h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Tempo de Estudo */}
        {step === 'tempo' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2">Tempo de Estudo por Dia</h2>
              <p className="text-muted-foreground">
                Configure quantas horas você pode estudar cada dia da semana (máximo 24h por dia)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left: Sliders */}
              <div className="glass-page-card rounded-2xl overflow-hidden">
                <div className="p-6 pb-3">
                  <h3 className="text-lg font-bold">Configurar Horas</h3>
                </div>
                <div className="px-6 pb-6 space-y-4">
                  {dias.map((dia, i) => (
                    <div key={dia} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">{diasNomes[i]}</Label>
                        <span className="text-sm font-semibold text-primary">
                          {tempoEstudo[dia]}h
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={tempoEstudo[dia]}
                        onChange={(e) =>
                          setTempoEstudo({
                            ...tempoEstudo,
                            [dia]: parseInt(e.target.value)
                          })
                        }
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Gráfico Setorial */}
              <div className="glass-page-card rounded-2xl overflow-hidden">
                <div className="p-6 pb-3">
                  <h3 className="text-lg font-bold">Resumo Semanal</h3>
                </div>
                <div className="px-6 pb-6 flex flex-col items-center justify-center space-y-4">
                  {/* Pie Chart SVG */}
                  <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-lg">
                    {dias.map((dia, i) => {
                      const horas = tempoEstudo[dia]
                      const percentage = totalHoras > 0 ? (horas / totalHoras) * 100 : 0
                      const angle = (percentage / 100) * 360
                      const colors = [
                        '#3b82f6', // blue
                        '#ef4444', // red
                        '#10b981', // green
                        '#f59e0b', // amber
                        '#8b5cf6', // purple
                        '#ec4899', // pink
                        '#06b6d4'  // cyan
                      ]
                      
                      if (horas === 0) return null
                      
                      const startAngle = dias.slice(0, i).reduce((sum, d) => {
                        const h = tempoEstudo[d]
                        return sum + (totalHoras > 0 ? (h / totalHoras) * 360 : 0)
                      }, 0)
                      
                      const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180)
                      const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180)
                      const x2 = 100 + 80 * Math.cos(((startAngle + angle) - 90) * Math.PI / 180)
                      const y2 = 100 + 80 * Math.sin(((startAngle + angle) - 90) * Math.PI / 180)
                      
                      const largeArc = angle > 180 ? 1 : 0
                      
                      return (
                        <path
                          key={dia}
                          d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={colors[i]}
                          opacity="0.8"
                        />
                      )
                    })}
                    <circle cx="100" cy="100" r="50" fill="white" />
                    <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold" fill="#000">
                      {totalHoras}h
                    </text>
                    <text x="100" y="115" textAnchor="middle" className="text-sm" fill="#666">
                      por semana
                    </text>
                  </svg>

                  {/* Legenda */}
                  <div className="w-full grid grid-cols-2 gap-2 text-xs">
                    {dias.map((dia, i) => (
                      <div key={dia} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'][i]
                          }}
                        />
                        <span>{diasNomes[i]}: {tempoEstudo[dia]}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (modelo === 'medicina-afya' || modelo === 'psicologia-afya' || modelo === 'biomedicina-afya' || modelo === 'odontologia-afya') {
                    setStep('periodo')
                  } else if (modelo === 'personalizado') {
                    setStep('topicos')
                  } else {
                    setStep('modelo')
                  }
                }}
                className="flex-1 rounded-xl soul-light h-11"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setStep('data')}
                className="flex-1 h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
              >
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Data de Término */}
        {step === 'data' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="glass-page-card rounded-2xl overflow-hidden">
              <div className="p-6 pb-3">
                <h2 className="text-2xl font-bold">Quando você quer terminar?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha a data em que deseja terminar o cronograma. Quanto mais próximo, mais conteúdo por dia.
                </p>
              </div>
              <div className="px-6 pb-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="data-termino">Data de Término</Label>
                  <CustomCalendar
                    value={dataTermino}
                    onChange={setDataTermino}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder="Selecione a data de término"
                  />
                </div>

                {dataTermino && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 p-4 rounded-xl space-y-2"
                  >
                    <p className="text-sm font-medium">Resumo:</p>
                    <p className="text-sm text-muted-foreground">
                      Você tem <strong>{Math.ceil((new Date(dataTermino).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias</strong> para completar o cronograma
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Com <strong>{Object.values(tempoEstudo).reduce((a, b) => a + b, 0)}h/semana</strong>, você terá aproximadamente <strong>{Math.ceil((Object.values(tempoEstudo).reduce((a, b) => a + b, 0) * Math.ceil((new Date(dataTermino).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7))))}h</strong> totais
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(modelo === 'personalizado' ? 'topicos' : 'tempo')}
                    className="flex-1 rounded-xl soul-light h-11"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep('topicos')}
                    className="flex-1 h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
                    disabled={!dataTermino}
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Seleção de Tópicos */}
        {step === 'topicos' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 w-full overflow-hidden"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {modelo === 'personalizado' ? 'Criar Tópicos Personalizados' : 'Selecione Tópicos'}
              </h2>
              <p className="text-muted-foreground">
                {modelo === 'personalizado'
                  ? 'Crie seus próprios tópicos, subtópicos e módulos. Você pode adicionar quantos quiser e definir as horas estimadas para cada módulo.'
                  : 'Escolha quais tópicos, subtópicos e módulos incluir no cronograma. Defina a dificuldade do seu nível em cada um.'}
              </p>
            </div>

            {/* Custom Builder para Cronograma Personalizado */}
            {modelo === 'personalizado' ? (
              <CustomCronogramaBuilder topicos={topicos} onTopicosChange={setTopicos} />
            ) : (
            <div className="w-full space-y-6">
            {/* ===== MOBILE: Tabbed single-panel drill-down ===== */}
            <div className="lg:hidden w-full space-y-4">
              {/* Tab bar */}
              <div className="flex rounded-xl overflow-hidden border border-white/20 dark:border-white/10 glass-page-card">
                <button
                  onClick={() => setMobileTab('topicos')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    mobileTab === 'topicos'
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tópicos
                </button>
                <button
                  onClick={() => { if (selectedTopico) setMobileTab('subtopicos') }}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    mobileTab === 'subtopicos'
                      ? 'bg-primary text-white'
                      : selectedTopico ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/40 cursor-not-allowed'
                  }`}
                >
                  Subtópicos
                </button>
                <button
                  onClick={() => { if (selectedSubtopico) setMobileTab('modulos') }}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    mobileTab === 'modulos'
                      ? 'bg-primary text-white'
                      : selectedSubtopico ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/40 cursor-not-allowed'
                  }`}
                >
                  Módulos
                </button>
              </div>

              {/* Breadcrumb */}
              {mobileTab !== 'topicos' && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1 flex-wrap">
                  <button onClick={() => setMobileTab('topicos')} className="hover:text-primary transition-colors">Tópicos</button>
                  {selectedTopico && (
                    <>
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      <button
                        onClick={() => setMobileTab('subtopicos')}
                        className="hover:text-primary transition-colors truncate max-w-[150px]"
                      >
                        {topicos.find(t => t.id === selectedTopico)?.nome}
                      </button>
                    </>
                  )}
                  {mobileTab === 'modulos' && selectedSubtopico && (
                    <>
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      <span className="text-foreground truncate max-w-[150px]">
                        {topicos.find(t => t.id === selectedTopico)?.subtopicos.find(s => s.id === selectedSubtopico)?.nome}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Panel content */}
              <div className="glass-page-card rounded-2xl overflow-hidden">
                {/* Mobile: Tópicos */}
                {mobileTab === 'topicos' && (
                  <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto overscroll-contain">
                    {topicos.map((topico) => (
                      <div
                        key={topico.id}
                        className={`flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer soul-light ${
                          selectedTopico === topico.id
                            ? 'border-2 border-primary bg-primary/5 shadow-sm'
                            : 'border-2 border-white/30 dark:border-white/10 backdrop-blur-sm bg-white/20 dark:bg-white/5 hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedTopico(topico.id)
                          setMobileTab('subtopicos')
                        }}
                      >
                        <div className="flex-shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
                          <ToggleSwitch
                            checked={topico.incluido}
                            onChange={() => toggleTopico(topico.id)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-[15px] leading-relaxed break-words ${
                            selectedTopico === topico.id ? 'text-primary' : ''
                          }`}>
                            {topico.nome}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {topico.subtopicos.length} subtópicos
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground mt-1" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Mobile: Subtópicos */}
                {mobileTab === 'subtopicos' && (
                  <div>
                    <div className="p-3 border-b border-white/10 flex items-center gap-2">
                      <button onClick={() => setMobileTab('topicos')} className="p-1 rounded-lg hover:bg-muted transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-semibold text-sm truncate">
                        {topicos.find(t => t.id === selectedTopico)?.nome}
                      </span>
                    </div>
                    <div
                      className={`p-4 space-y-3 max-h-[50vh] overflow-y-auto overscroll-contain ${
                        selectedTopico && !topicos.find((t) => t.id === selectedTopico)?.incluido
                          ? 'blur-sm opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {selectedTopico && topicos
                        .find((t) => t.id === selectedTopico)
                        ?.subtopicos.map((subtopico) => (
                          <div
                            key={subtopico.id}
                            className={`flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer soul-light ${
                              selectedSubtopico === subtopico.id
                                ? 'border-2 border-primary bg-primary/5 shadow-sm'
                                : 'border-2 border-white/30 dark:border-white/10 backdrop-blur-sm bg-white/20 dark:bg-white/5 hover:border-primary/50'
                            }`}
                            onClick={() => {
                              setSelectedSubtopico(subtopico.id)
                              setMobileTab('modulos')
                            }}
                          >
                            <div className="flex-shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
                              <ToggleSwitch
                                checked={subtopico.incluido}
                                onChange={() => toggleSubtopico(selectedTopico, subtopico.id)}
                                disabled={!topicos.find((t) => t.id === selectedTopico)?.incluido}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-[15px] leading-relaxed break-words ${
                                selectedSubtopico === subtopico.id ? 'text-primary' : ''
                              }`}>
                                {subtopico.nome}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {subtopico.modulos.length} módulos
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground mt-1" />
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Mobile: Módulos */}
                {mobileTab === 'modulos' && (
                  <div>
                    <div className="p-3 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button onClick={() => setMobileTab('subtopicos')} className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-semibold text-sm truncate">
                          {topicos.find(t => t.id === selectedTopico)?.subtopicos.find(s => s.id === selectedSubtopico)?.nome}
                        </span>
                      </div>
                      {selectedSubtopico && selectedTopico && topicos.find((t) => t.id === selectedTopico)?.incluido && (
                        <button
                          onClick={() => {
                            if (selectedTopico && selectedSubtopico) {
                              toggleTodosModulosSubtopico(selectedTopico, selectedSubtopico)
                            }
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0 font-medium ml-2"
                        >
                          Marcar Tudo
                        </button>
                      )}
                    </div>
                    <div
                      className={`p-4 space-y-3 max-h-[50vh] overflow-y-auto overscroll-contain ${
                        selectedTopico && !topicos.find((t) => t.id === selectedTopico)?.incluido
                          ? 'blur-sm opacity-50 pointer-events-none'
                          : selectedSubtopico && !topicos.find((t) => t.id === selectedTopico)?.subtopicos.find((s) => s.id === selectedSubtopico)?.incluido
                          ? 'blur-sm opacity-50 pointer-events-none'
                          : ''
                      }`}
                    >
                      {selectedSubtopico && topicos
                        .find((t) => t.id === selectedTopico)
                        ?.subtopicos.find((s) => s.id === selectedSubtopico)
                        ?.modulos.map((modulo) => {
                          const temSubmodulos = (modulo as any).submodulos && (modulo as any).submodulos.length > 0
                          return (
                            <div
                              key={modulo.id}
                              className="p-4 rounded-xl border-2 border-white/30 dark:border-white/10 backdrop-blur-sm bg-white/20 dark:bg-white/5 transition-colors space-y-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-[15px] leading-relaxed break-words">{modulo.nome}</div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                                  {temSubmodulos && (
                                    <button
                                      onClick={() => setModuloInfoAberto(moduloInfoAberto === modulo.id ? null : modulo.id)}
                                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                      title="Ver submódulos"
                                    >
                                      <Info className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                  )}
                                  <ToggleSwitch
                                    checked={modulo.incluido}
                                    onChange={() => {
                                      if (selectedTopico && selectedSubtopico) {
                                        toggleModulo(selectedTopico, selectedSubtopico, modulo.id)
                                      }
                                    }}
                                    disabled={!topicos.find((t) => t.id === selectedTopico)?.incluido || !topicos.find((t) => t.id === selectedTopico)?.subtopicos.find((s) => s.id === selectedSubtopico)?.incluido}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{modulo.horasEstimadas}h</span>
                                <select
                                  value={modulo.dificuldadeUsuario || 'medio'}
                                  onChange={(e) => {
                                    if (selectedTopico && selectedSubtopico) {
                                      setModuloDificuldade(selectedTopico, selectedSubtopico, modulo.id, e.target.value as UserDifficulty)
                                    }
                                  }}
                                  className="text-xs px-2.5 py-1.5 rounded-lg border border-muted bg-background cursor-pointer"
                                  disabled={!topicos.find((t) => t.id === selectedTopico)?.incluido || !topicos.find((t) => t.id === selectedTopico)?.subtopicos.find((s) => s.id === selectedSubtopico)?.incluido}
                                >
                                  <option value="facil">Fácil</option>
                                  <option value="medio">Médio</option>
                                  <option value="dificil">Difícil</option>
                                </select>
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== DESKTOP: 3-Column Layout (lg+) ===== */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-5 w-full">
              {/* Column 1: Tópicos */}
              <div className="glass-page-card rounded-2xl flex flex-col overflow-hidden max-h-[65vh]">
                <div className="p-5 pb-3 border-b border-white/10">
                  <h3 className="text-lg font-bold">Tópicos</h3>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-2.5 overscroll-contain">
                  {topicos.map((topico) => (
                    <div
                      key={topico.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl transition-all cursor-pointer soul-light ${
                        selectedTopico === topico.id
                          ? 'border-2 border-primary bg-primary/5 shadow-sm'
                          : 'border-2 border-white/30 dark:border-white/10 backdrop-blur-sm bg-white/20 dark:bg-white/5 hover:border-primary/50 hover:bg-white/30 dark:hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedTopico(topico.id)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <ToggleSwitch
                          checked={topico.incluido}
                          onChange={() => toggleTopico(topico.id)}
                        />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className={`font-semibold text-[15px] leading-relaxed break-words ${
                          selectedTopico === topico.id ? 'text-primary' : ''
                        }`}>
                          {topico.nome}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1.5">
                          {topico.subtopicos.length} subtópicos
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Subtópicos */}
              <div className="glass-page-card rounded-2xl flex flex-col overflow-hidden max-h-[65vh]">
                <div className="p-5 pb-3 border-b border-white/10">
                  <h3 className="text-lg font-bold">Subtópicos</h3>
                </div>
                <div
                  className={`p-4 flex-1 overflow-y-auto space-y-2.5 overscroll-contain transition-all ${
                    selectedTopico && !topicos.find((t) => t.id === selectedTopico)?.incluido
                      ? 'blur-sm opacity-50 pointer-events-none'
                      : ''
                  }`}
                >
                  {selectedTopico ? (
                    topicos
                      .find((t) => t.id === selectedTopico)
                      ?.subtopicos.map((subtopico) => (
                        <div
                          key={subtopico.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl transition-all cursor-pointer soul-light ${
                            selectedSubtopico === subtopico.id
                              ? 'border-2 border-primary bg-primary/5 shadow-sm'
                              : 'border-2 border-white/30 dark:border-white/10 backdrop-blur-sm bg-white/20 dark:bg-white/5 hover:border-primary/50 hover:bg-white/30 dark:hover:bg-white/10'
                          }`}
                          onClick={() => setSelectedSubtopico(subtopico.id)}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <ToggleSwitch
                              checked={subtopico.incluido}
                              onChange={() => toggleSubtopico(selectedTopico, subtopico.id)}
                              disabled={!topicos.find((t) => t.id === selectedTopico)?.incluido}
                            />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className={`font-semibold text-[15px] leading-relaxed break-words ${
                              selectedSubtopico === subtopico.id ? 'text-primary' : ''
                            }`}>
                              {subtopico.nome}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1.5">
                              {subtopico.modulos.length} módulos
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Selecione um tópico
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Módulos */}
              <div className="glass-page-card rounded-2xl flex flex-col overflow-hidden max-h-[65vh]">
                <div className="p-5 pb-3 border-b border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold">Módulos</h3>
                    {selectedSubtopico && selectedTopico && topicos.find((t) => t.id === selectedTopico)?.incluido && (
                      <button
                        onClick={() => {
                          if (selectedTopico && selectedSubtopico) {
                            toggleTodosModulosSubtopico(selectedTopico, selectedSubtopico)
                          }
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0 font-medium"
                      >
                        Marcar Tudo
                      </button>
                    )}
                  </div>
                </div>
                <div
                  className={`p-4 flex-1 overflow-y-auto space-y-2.5 overscroll-contain transition-all ${
                    selectedTopico && !topicos.find((t) => t.id === selectedTopico)?.incluido
                      ? 'blur-sm opacity-50 pointer-events-none'
                      : selectedSubtopico && !topicos.find((t) => t.id === selectedTopico)?.subtopicos.find((s) => s.id === selectedSubtopico)?.incluido
                      ? 'blur-sm opacity-50 pointer-events-none'
                      : ''
                  }`}
                >
                  {selectedSubtopico ? (
                    topicos
                      .find((t) => t.id === selectedTopico)
                      ?.subtopicos.find((s) => s.id === selectedSubtopico)
                      ?.modulos.map((modulo) => {
                        const temSubmodulos = (modulo as any).submodulos && (modulo as any).submodulos.length > 0
                        return (
                          <div
                            key={modulo.id}
                            className="p-4 rounded-xl border-2 border-white/30 dark:border-white/10 backdrop-blur-sm bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 transition-colors space-y-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="font-semibold text-[15px] flex-1 leading-relaxed break-words min-w-0">{modulo.nome}</div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                                {temSubmodulos && (
                                  <div className="relative">
                                    <button
                                      onClick={() => setModuloInfoAberto(moduloInfoAberto === modulo.id ? null : modulo.id)}
                                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                      title="Ver submódulos"
                                    >
                                      <Info className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                    </button>
                                  </div>
                                )}
                                <ToggleSwitch
                                  checked={modulo.incluido}
                                  onChange={() => {
                                    if (selectedTopico && selectedSubtopico) {
                                      toggleModulo(selectedTopico, selectedSubtopico, modulo.id)
                                    }
                                  }}
                                  disabled={!topicos.find((t) => t.id === selectedTopico)?.incluido || !topicos.find((t) => t.id === selectedTopico)?.subtopicos.find((s) => s.id === selectedSubtopico)?.incluido}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {modulo.horasEstimadas}h
                              </span>
                              <select
                                value={modulo.dificuldadeUsuario || 'medio'}
                                onChange={(e) => {
                                  if (selectedTopico && selectedSubtopico) {
                                    setModuloDificuldade(
                                      selectedTopico,
                                      selectedSubtopico,
                                      modulo.id,
                                      e.target.value as UserDifficulty
                                    )
                                  }
                                }}
                                className="text-xs px-2.5 py-1.5 rounded-lg border border-muted bg-background cursor-pointer"
                                disabled={!topicos.find((t) => t.id === selectedTopico)?.incluido || !topicos.find((t) => t.id === selectedTopico)?.subtopicos.find((s) => s.id === selectedSubtopico)?.incluido}
                              >
                                <option value="facil">Fácil</option>
                                <option value="medio">Médio</option>
                                <option value="dificil">Difícil</option>
                              </select>
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Selecione um subtópico
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(modelo === 'personalizado' ? 'modelo' : 'data')}
                className="flex-1 rounded-xl soul-light h-11"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setStep('confirmacao')}
                className="flex-1 h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
                disabled={topicos.filter(t => t.incluido).length === 0}
              >
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 6: Confirmação */}
        {step === 'confirmacao' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="glass-page-card rounded-2xl overflow-hidden">
              <div className="p-6 pb-3">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-[#E2A43E]" />
                  Confirmar Cronograma
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Revise as informações antes de gerar
                </p>
              </div>
              <div className="px-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <Label>Título do Cronograma</Label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Cronograma ENEM 2024"
                    className="auth-glass-input rounded-xl h-11"
                  />
                </div>
                <div className="backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 p-4 rounded-xl space-y-2 text-sm">
                  <p><strong>Modelo:</strong> {TEMPLATES[modelo].nome}</p>
                  {modelo !== 'personalizado' && (
                    <>
                      <p><strong>Total de horas/semana:</strong> {Object.values(tempoEstudo).reduce((a, b) => a + b, 0)} horas</p>
                      <p><strong>Data de término:</strong> {new Date(dataTermino).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Dias disponíveis:</strong> {Math.ceil((new Date(dataTermino).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}</p>
                    </>
                  )}
                  {modelo === 'personalizado' && (
                    <>
                      <p><strong>Tópicos:</strong> {topicos.length}</p>
                      <p><strong>Subtópicos:</strong> {topicos.reduce((sum, t) => sum + t.subtopicos.length, 0)}</p>
                      <p><strong>Módulos:</strong> {topicos.reduce((sum, t) => sum + t.subtopicos.reduce((s, st) => s + st.modulos.length, 0), 0)}</p>
                      <p><strong>Horas totais:</strong> {topicos.reduce((sum, t) => sum + t.subtopicos.reduce((s, st) => s + st.modulos.reduce((m, mod) => m + (mod.incluido ? mod.horasEstimadas : 0), 0), 0), 0)}h</p>
                    </>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep('topicos')}
                    className="flex-1 rounded-xl soul-light h-11"
                    disabled={gerando}
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={gerarCronograma}
                    className="flex-1 h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
                    disabled={gerando}
                  >
                    {gerando ? 'Gerando...' : 'Gerar Cronograma'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Submódulos Modal - rendered via portal to avoid overflow clipping */}
      {moduloAberto && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          onClick={() => setModuloInfoAberto(null)}
        >
          <div
            className="glass-page-card rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-md max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-white/20 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="font-semibold text-base sm:text-lg text-primary leading-relaxed break-words min-w-0 flex-1">
                Submódulos: {moduloAberto.modulo.nome}
              </div>
              <button
                onClick={() => setModuloInfoAberto(null)}
                className="p-2 hover:bg-muted rounded-xl transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 overscroll-contain">
              {moduloAberto.submodulos.map((submodulo) => (
                <div key={submodulo.id} className="text-sm p-3.5 rounded-xl bg-muted/50 border border-muted/30 text-foreground">
                  <div className="flex items-start gap-2.5">
                    <span className="text-primary font-semibold mt-0.5 flex-shrink-0">▸</span>
                    <span className="break-words leading-relaxed">{submodulo.nome}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
