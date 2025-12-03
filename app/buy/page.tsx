'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Check, Zap, Crown, Infinity, Sparkles, AlertCircle, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { PremiumLogo } from '@/components/premium-logo'
import { PlanConfig } from '@/lib/types'

interface Plan {
  id: string
  name: string
  period: string
  originalPrice: number
  price: number
  discount?: number
  discountLabel?: string
  description: string
  features: string[]
  highlighted?: boolean
  badge?: string
  icon: React.ReactNode
}

const defaultPlans: Plan[] = [
  {
    id: 'price_1SZEvMLawSqPVy6JDJk2SNcc',
    name: 'DomineAqui PREMIUM',
    period: 'Plano Mensal',
    originalPrice: 29.90,
    price: 24.90,
    description: 'Perfeito para começar',
    features: [
      '400 Questões Pessoais por dia',
      '500 Flashcards por dia',
      'Cronogramas ilimitados',
      'Forum de materiais e discussão premium',
      'Aulas ao vivo e vídeo-aulas pós-aula',
      'Acesso a grupo de WhatsApp'
    ],
    icon: <Zap className="h-6 w-6" />
  },
  {
    id: 'price_1SZEvMLawSqPVy6JWHUgauU6',
    name: 'DomineAqui PREMIUM',
    period: 'Plano Trimestral',
    originalPrice: 89.70,
    price: 69.90,
    discount: 6,
    discountLabel: 'Economize R$ 18 em 3 meses',
    description: 'Melhor para 3 meses',
    features: [
      '400 Questões Pessoais por dia',
      '500 Flashcards por dia',
      'Cronogramas ilimitados',
      'Forum de materiais e discussão premium',
      'Aulas ao vivo e vídeo-aulas pós-aula',
      'Acesso a grupo de WhatsApp'
    ],
    icon: <Crown className="h-6 w-6" />
  },
  {
    id: 'price_1SZEvMLawSqPVy6JzFkSv4OX',
    name: 'DomineAqui PREMIUM',
    period: 'Plano Semestral',
    originalPrice: 179.40,
    price: 109.90,
    discount: 38,
    discountLabel: 'Pague só R$ 18,32/mês – 6 meses por preço de 4',
    description: 'Melhor custo-benefício',
    features: [
      '400 Questões Pessoais por dia',
      '500 Flashcards por dia',
      'Cronogramas ilimitados',
      'Forum de materiais e discussão premium',
      'Aulas ao vivo e vídeo-aulas pós-aula',
      'Acesso a grupo de WhatsApp'
    ],
    highlighted: true,
    badge: 'MAIS POPULAR',
    icon: <Crown className="h-6 w-6 text-yellow-500" />
  },
  {
    id: 'price_1SZEvMLawSqPVy6JxOQ4JNxj',
    name: 'DomineAqui PREMIUM',
    period: 'Plano Anual',
    originalPrice: 358.80,
    price: 159.90,
    discount: 55,
    discountLabel: 'MELHOR VALOR: 12 meses por menos de R$ 13,33/mês - Pague 6 meses e leve 12',
    description: 'Melhor valor do ano',
    features: [
      '400 Questões Pessoais por dia',
      '500 Flashcards por dia',
      'Cronogramas ilimitados',
      'Forum de materiais e discussão premium',
      'Aulas ao vivo e vídeo-aulas pós-aula',
      'Acesso a grupo de WhatsApp'
    ],
    highlighted: true,
    badge: 'MELHOR VALOR',
    icon: <Crown className="h-6 w-6 text-yellow-500" />
  },
  {
    id: 'price_1SZEvMLawSqPVy6Jdbl8CArd',
    name: 'DomineAqui PREMIUM',
    period: 'Plano Vitalício',
    originalPrice: 1497.00,
    price: 529.00,
    discount: 65,
    discountLabel: 'OFERTA LIMITADA – SÓ ATÉ O FINAL DO 2º SEMESTRE DE 2026. Depois será retirado para sempre.',
    description: 'Acesso para sempre',
    features: [
      '400 Questões Pessoais por dia',
      '500 Flashcards por dia',
      'Cronogramas ilimitados',
      'Forum de materiais e discussão premium',
      'Aulas ao vivo e vídeo-aulas pós-aula',
      'Acesso a grupo de WhatsApp'
    ],
    highlighted: true,
    badge: 'OFERTA LIMITADA',
    icon: <Infinity className="h-6 w-6 text-purple-500" />
  }
]

interface Subscription {
  type: 'premium' | 'trial'
  planType?: string
  expiresAt: Date
  activatedAt?: Date
  price?: number
}

export default function BuyPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [userName, setUserName] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [successPlan, setSuccessPlan] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>(defaultPlans)

  useEffect(() => {
    checkSubscription()
    loadUserName()
    checkPaymentSuccess()
    loadPlans()
  }, [])

  async function loadPlans() {
    try {
      const res = await fetch('/api/admin/settings/planos')
      if (res.ok) {
        const data = await res.json()
        if (data.planos && data.planos.length > 0) {
          // Converter PlanConfig para Plan
          const convertedPlans = data.planos
            .filter((p: PlanConfig) => !p.oculto)
            .sort((a: PlanConfig, b: PlanConfig) => a.ordem - b.ordem)
            .map((p: PlanConfig) => ({
              id: p.tipo,
              name: p.nome,
              period: p.periodo,
              originalPrice: p.precoOriginal || p.preco,
              price: p.preco,
              description: p.descricao || '',
              features: p.beneficios || [],
              icon: <Zap className="h-6 w-6" />
            }))
          setPlans(convertedPlans)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      // Usar planos padrão em caso de erro
      setPlans(defaultPlans)
    }
  }

  async function checkSubscription() {
    try {
      console.log('Verificando assinatura...')
      // Verificar expiração de plano primeiro
      await fetch('/api/user/check-plan-expiration')
      
      const res = await fetch('/api/user/subscription-status')
      console.log('Response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Subscription data:', data)
        setHasActiveSubscription(data.hasActiveSubscription)
        if (data.subscription) {
          console.log('Setting subscription:', data.subscription)
          setSubscription(data.subscription)
        }
      } else {
        console.log('API error:', res.status)
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  async function loadUserName() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserName(data.user.name)
      }
    } catch (error) {
      console.error('Erro ao carregar nome do usuário:', error)
    }
  }

  async function checkPaymentSuccess() {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      const sessionId = params.get('session_id')
      const plan = localStorage.getItem('lastPurchasedPlan')
      
      if (sessionId) {
        try {
          console.log('Processando sucesso de pagamento com sessionId:', sessionId)
          // Chamar API para processar o sucesso do pagamento
          const res = await fetch('/api/stripe/process-success', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          })

          const data = await res.json()
          console.log('Resposta da API:', data)

          if (res.ok) {
            setPaymentSuccess(true)
            if (plan) {
              setSuccessPlan(plan)
              localStorage.removeItem('lastPurchasedPlan')
            }
            // Recarregar dados do usuário após 2 segundos
            setTimeout(() => {
              checkSubscription()
            }, 2000)
          } else {
            console.error('Erro ao processar pagamento:', data.error)
          }
        } catch (error) {
          console.error('Erro ao chamar API de sucesso:', error)
        }
      }
    }
  }

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
        return
      }

      const { url } = await response.json()
      if (url) {
        // Salvar o plano comprado para exibir na volta
        localStorage.setItem('lastPurchasedPlan', planId)
        window.location.href = url
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setSelectedPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Planos Premium</h1>
            <p className="text-sm text-muted-foreground">Escolha o plano perfeito para você</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <PremiumLogo />
          </div>
          <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            Seja o Foco. Seja a Referência.
            <Sparkles className="h-8 w-8 text-yellow-500" />
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            O Premium do DomineAqui é pra quem não quer só estudar — quer dominar.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            É pra quem leva o próprio futuro a sério e quer a melhor experiência de estudo possível.
          </p>
        </div>

        {/* Payment Success Alert */}
        {paymentSuccess && (
          <Card className="mb-12 border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 animate-in fade-in slide-in-from-top-2 duration-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Check className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5 animate-bounce" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-2">
                    🎉 Parabéns! Seu Pagamento foi Aprovado!
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 mb-3">
                    Você adquiriu o plano <strong>Premium {successPlan ? successPlan.charAt(0).toUpperCase() + successPlan.slice(1) : ''}</strong> com sucesso!
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Agora você tem acesso a todos os recursos Premium, incluindo <strong>20 provas pessoais por dia</strong>. O comprovante foi enviado pelo Stripe.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => router.push('/profile')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Ir para Meu Perfil
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setPaymentSuccess(false)}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Subscription Alert */}
        {!loadingSubscription && hasActiveSubscription && subscription && (
          <Card className="mb-12 border-2 border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-green-900 dark:text-green-100 mb-2">
                    Você já possui um plano vigente!
                  </h3>
                  <p className="text-green-800 dark:text-green-200 mb-4">
                    Sua assinatura {subscription.type === 'premium' ? 'Premium' : 'Trial'} ({subscription.planType}) está ativa até {new Date(subscription.expiresAt).toLocaleDateString('pt-BR')}.
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Para fazer <strong>upgrade</strong>, <strong>cancelar</strong> ou gerenciar sua assinatura, acesse a área do seu perfil ou entre em contato conosco no WhatsApp:
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => router.push('/profile')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Ir para Perfil
                      </Button>
                      <Button
                        onClick={() => {
                          const message = encodeURIComponent(
                            `Olá, sou o usuário **${userName}** do DomineAqui e quero fazer upgrade ou cancelar meu plano de assinatura vigente.`
                          )
                          window.open(`https://wa.me/5521997770936?text=${message}`, '_blank')
                        }}
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contatar via WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid - Only show if no active subscription */}
        {!loadingSubscription && !hasActiveSubscription && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {plans.slice(0, 3).map((plan, idx) => (
                <Card key={plan.id} className={`relative ${plan.highlighted ? 'border-2 border-yellow-500 shadow-lg' : ''}`}>
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-yellow-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <CardHeader className={plan.highlighted ? 'pt-8' : ''}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {plan.icon}
                        <div>
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <CardDescription>{plan.period}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-4xl font-bold ${plan.highlighted ? 'text-yellow-600' : ''}`}>
                          R$ {plan.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {plan.originalPrice.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{idx === 0 ? '/mês' : idx === 1 ? '/3 meses' : '/6 meses'}</p>
                      {plan.discountLabel && (
                        <p className="text-xs text-green-600 font-medium mt-2">{plan.discountLabel}</p>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIdx) => (
                        <li key={featureIdx} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${plan.highlighted ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={selectedPlan === plan.id}
                    >
                      {selectedPlan === plan.id ? 'Processando...' : 'Escolher Plano'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Annual and Lifetime Plans - Full Width */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              {plans.slice(3).map((plan) => (
                <Card key={plan.id} className={`relative border-2 ${plan.badge?.includes('MELHOR') ? 'border-purple-500' : 'border-red-500'} shadow-lg`}>
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className={`${plan.badge?.includes('MELHOR') ? 'bg-purple-500' : 'bg-red-500'} text-white px-4 py-1 rounded-full text-xs font-bold`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <CardHeader className="pt-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {plan.icon}
                        <div>
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <CardDescription>{plan.period}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-4xl font-bold ${plan.badge?.includes('MELHOR') ? 'text-purple-600' : 'text-red-600'}`}>
                          R$ {plan.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {plan.originalPrice.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.badge?.includes('VITALÍCIO') ? 'pagamento único' : '/ano'}</p>
                      {plan.discountLabel && (
                        <p className={`text-xs font-medium mt-2 ${plan.badge?.includes('MELHOR') ? 'text-green-600' : 'text-red-600'}`}>
                          {plan.discountLabel}
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIdx) => (
                        <li key={featureIdx} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${plan.badge?.includes('MELHOR') ? 'bg-purple-500 hover:bg-purple-600' : 'bg-red-500 hover:bg-red-600'}`}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={selectedPlan === plan.id}
                    >
                      {selectedPlan === plan.id ? 'Processando...' : 'Escolher Plano'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">Perguntas Frequentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Posso cancelar a qualquer momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sim, você pode cancelar sua assinatura a qualquer momento sem penalidades.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Qual é a forma de pagamento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Aceitamos cartão de crédito através da Stripe, a plataforma mais segura do mercado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Há período de teste?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sim, oferecemos 7 dias de teste gratuito para novos usuários.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">O plano vitalício é realmente vitalício?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sim, é um pagamento único com acesso permanente. Essa oferta é limitada até o final do 2º semestre de 2026.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
