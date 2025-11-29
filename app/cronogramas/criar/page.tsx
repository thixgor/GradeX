'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { CustomCronogramaBuilder } from '@/components/custom-cronograma-builder'
import { ArrowLeft, ChevronRight, Info } from 'lucide-react'
import { TEMPLATES, ModelType, UserDifficulty, StudyTime, TopicItem, SubtopicItem, ModuleItem, MedicinaAFYAPeriodo } from '@/lib/cronograma-types'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { getMedicinaAFYATopicos } from '@/lib/medicina-afya-periodos-helper'

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
  const [gerando, setGerando] = useState(false)
  const [dataTermino, setDataTermino] = useState<string>('')

  // Inicializar tópicos com deep copy
  useEffect(() => {
    let topicosCopiados: TopicItem[] = []
    
    // Se for Medicina AFYA, usar a função helper para obter tópicos por período
    if (modelo === 'medicina-afya') {
      topicosCopiados = JSON.parse(JSON.stringify(getMedicinaAFYATopicos(periodo)))
    } else if (modelo === 'personalizado') {
      // Para cronograma personalizado, começar com array vazio
      topicosCopiados = []
    } else {
      topicosCopiados = JSON.parse(JSON.stringify(TEMPLATES[modelo].topicos))
    }
    
    setTopicos(topicosCopiados)
    setSelectedTopico(null)
    setSelectedSubtopico(null)
  }, [modelo, periodo])

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/cronogramas')}
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
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Step Indicator */}
        <div className="mb-8 flex justify-between items-center">
          {(['modelo', 'periodo', 'tempo', 'data', 'topicos', 'confirmacao'] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step === s
                    ? 'bg-primary text-white'
                    : i < (['modelo', 'periodo', 'tempo', 'data', 'topicos', 'confirmacao'] as const).indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 5 && <div className="w-12 h-1 bg-muted mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Modelo */}
        {step === 'modelo' && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha o Modelo</CardTitle>
              <CardDescription>
                Selecione qual modelo de cronograma você deseja criar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.values(TEMPLATES).map((template) => (
                <button
                  key={template.id}
                  onClick={() => setModelo(template.modelo)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    modelo === template.modelo
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <h3 className="font-semibold">{template.nome}</h3>
                  <p className="text-sm text-muted-foreground">{template.descricao}</p>
                </button>
              ))}
              <Button
                onClick={() => {
                  if (modelo === 'medicina-afya') {
                    setStep('periodo')
                  } else if (modelo === 'personalizado') {
                    setStep('topicos')
                  } else {
                    setStep('tempo')
                  }
                }}
                className="w-full mt-6"
              >
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Período (apenas para Medicina AFYA) */}
        {step === 'periodo' && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha seu Período</CardTitle>
              <CardDescription>
                Selecione qual período você está cursando (1º ao 5º)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriodo(p as MedicinaAFYAPeriodo)}
                    className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                      periodo === p
                        ? 'border-primary bg-primary text-white'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    {p}º
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => setStep('modelo')}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep(modelo === 'personalizado' ? 'topicos' : 'tempo')}
                  className="flex-1"
                >
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Tempo de Estudo */}
        {step === 'tempo' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tempo de Estudo por Dia</h2>
              <p className="text-muted-foreground">
                Configure quantas horas você pode estudar cada dia da semana (máximo 24h por dia)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left: Sliders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurar Horas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Right: Gráfico Setorial */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo Semanal</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4">
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
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (modelo === 'medicina-afya') {
                    setStep('periodo')
                  } else if (modelo === 'personalizado') {
                    setStep('topicos')
                  } else {
                    setStep('modelo')
                  }
                }}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setStep('data')}
                className="flex-1"
              >
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Data de Término */}
        {step === 'data' && (
          <Card>
            <CardHeader>
              <CardTitle>Quando você quer terminar?</CardTitle>
              <CardDescription>
                Escolha a data em que deseja terminar o cronograma. Quanto mais próximo, mais conteúdo por dia.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="data-termino">Data de Término</Label>
                <Input
                  id="data-termino"
                  type="date"
                  value={dataTermino}
                  onChange={(e) => setDataTermino(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {dataTermino && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Resumo:</p>
                  <p className="text-sm text-muted-foreground">
                    Você tem <strong>{Math.ceil((new Date(dataTermino).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias</strong> para completar o cronograma
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Com <strong>{Object.values(tempoEstudo).reduce((a, b) => a + b, 0)}h/semana</strong>, você terá aproximadamente <strong>{Math.ceil((Object.values(tempoEstudo).reduce((a, b) => a + b, 0) * Math.ceil((new Date(dataTermino).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7))))}h</strong> totais
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(modelo === 'personalizado' ? 'topicos' : 'tempo')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep('topicos')}
                  className="flex-1"
                  disabled={!dataTermino}
                >
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Seleção de Tópicos */}
        {step === 'topicos' && (
          <div className="space-y-6 w-full overflow-hidden">
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
            /* 3-Column Layout */
            <div className="grid grid-cols-3 gap-8 min-h-screen w-full overflow-hidden">
              {/* Column 1: Tópicos */}
              <Card className="flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Tópicos</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-3 pr-4">
                  {topicos.map((topico) => (
                    <div
                      key={topico.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedTopico === topico.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTopico(topico.id)}
                    >
                      <ToggleSwitch
                        checked={topico.incluido}
                        onChange={() => toggleTopico(topico.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 text-left min-w-0">
                        <div className={`font-semibold text-base leading-snug break-words ${
                          selectedTopico === topico.id ? 'text-primary' : ''
                        }`}>
                          {topico.nome}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2 whitespace-nowrap">
                          {topico.subtopicos.length} subtópicos
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Column 2: Subtópicos */}
              <Card className="flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Subtópicos</CardTitle>
                </CardHeader>
                <CardContent
                  className={`flex-1 overflow-y-auto space-y-3 pr-4 transition-all ${
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
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            selectedSubtopico === subtopico.id
                              ? 'border-primary bg-primary/5'
                              : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedSubtopico(subtopico.id)}
                        >
                          <ToggleSwitch
                            checked={subtopico.incluido}
                            onChange={() => toggleSubtopico(selectedTopico, subtopico.id)}
                            disabled={!!(selectedTopico && !topicos.find((t) => t.id === selectedTopico)?.incluido)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 text-left min-w-0">
                            <div className={`font-semibold text-base leading-snug break-words ${
                              selectedSubtopico === subtopico.id ? 'text-primary' : ''
                            }`}>
                              {subtopico.nome}
                            </div>
                            <div className="text-sm text-muted-foreground mt-2 whitespace-nowrap">
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
                </CardContent>
              </Card>

              {/* Column 3: Módulos */}
              <Card className="flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-xl font-bold">Módulos</CardTitle>
                    {selectedSubtopico && selectedTopico && topicos.find((t) => t.id === selectedTopico)?.incluido && (
                      <button
                        onClick={() => {
                          if (selectedTopico && selectedSubtopico) {
                            toggleTodosModulosSubtopico(selectedTopico, selectedSubtopico)
                          }
                        }}
                        className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                      >
                        Marcar Tudo
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent
                  className={`flex-1 overflow-y-auto space-y-3 pr-4 transition-all ${
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
                            className="p-4 rounded-lg border-2 border-muted bg-background hover:bg-muted/30 transition-colors space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold text-base flex-1 leading-snug break-words">{modulo.nome}</div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {temSubmodulos && (
                                  <div className="relative">
                                    <button
                                      onClick={() => setModuloInfoAberto(moduloInfoAberto === modulo.id ? null : modulo.id)}
                                      className="p-1 rounded hover:bg-muted transition-colors"
                                      title="Ver submódulos"
                                    >
                                      <Info className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                    </button>
                                    {moduloInfoAberto === modulo.id && (
                                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                        <div className="bg-background border border-muted rounded-lg shadow-lg p-6 w-96 max-h-96 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                          <div className="flex items-center justify-between mb-4">
                                            <div className="font-semibold text-lg text-primary">Submódulos: {modulo.nome}</div>
                                            <button
                                              onClick={() => setModuloInfoAberto(null)}
                                              className="p-1 hover:bg-muted rounded transition-colors"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                          <div className="space-y-2 overflow-y-auto flex-1">
                                            {(modulo as any).submodulos.map((submodulo: any) => (
                                              <div key={submodulo.id} className="text-sm p-3 rounded bg-muted/50 border border-muted/30 text-foreground hover:bg-muted transition-colors">
                                                <div className="flex items-start gap-2">
                                                  <span className="text-primary font-semibold mt-0.5">▸</span>
                                                  <span>{submodulo.nome}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <ToggleSwitch
                                  checked={modulo.incluido}
                                  onChange={() => {
                                    if (selectedTopico && selectedSubtopico) {
                                      toggleModulo(selectedTopico, selectedSubtopico, modulo.id)
                                    }
                                  }}
                                  disabled={!!(selectedTopico && !topicos.find((t) => t.id === selectedTopico)?.incluido) || !!(selectedSubtopico && !topicos.find((t) => t.id === selectedTopico)?.subtopicos.find((s) => s.id === selectedSubtopico)?.incluido)}
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
                                className="text-xs px-2 py-1 rounded border border-muted bg-background cursor-pointer"
                                disabled={!!(selectedTopico && !topicos.find((t) => t.id === selectedTopico)?.incluido) || !!(selectedSubtopico && !topicos.find((t) => t.id === selectedTopico)?.subtopicos.find((s) => s.id === selectedSubtopico)?.incluido)}
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
                </CardContent>
              </Card>
            </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(modelo === 'personalizado' ? 'modelo' : 'data')}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setStep('confirmacao')}
                className="flex-1"
                disabled={topicos.filter(t => t.incluido).length === 0}
              >
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Confirmação */}
        {step === 'confirmacao' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirmar Cronograma</CardTitle>
              <CardDescription>
                Revise as informações antes de gerar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título do Cronograma</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Cronograma ENEM 2024"
                />
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
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
                  className="flex-1"
                  disabled={gerando}
                >
                  Voltar
                </Button>
                <Button
                  onClick={gerarCronograma}
                  className="flex-1"
                  disabled={gerando}
                >
                  {gerando ? 'Gerando...' : 'Gerar Cronograma'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
