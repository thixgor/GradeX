'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Zap, Crown, Infinity, Sparkles, AlertCircle, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
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
  const [showAlternativePayments, setShowAlternativePayments] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'Pix' | 'Dinheiro' | 'Boleto' | null>(null)
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
              highlighted: p.destaque,
              badge: p.badge,
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

  const alternativePlans = [
    { label: 'Premium Mensal', value: 'Mensal' },
    { label: 'Premium Trimestral', value: 'Trimestral' },
    { label: 'Premium Semestral', value: 'Semestral' },
    { label: 'Premium Anual', value: 'Anual' },
  ] as const

  const openWhatsAppForAlternativePayment = (method: 'Pix' | 'Dinheiro' | 'Boleto', planPeriod: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual') => {
    const displayName = (userName || '').trim() || 'Usuário'
    const message = encodeURIComponent(
      `Olá, sou *${displayName}* e quero adquirir o DomineAqui Premium Plano *${planPeriod}* através do método de pagamento *${method}*.`
    )
    window.open(`https://wa.me/5521997770936?text=${message}`, '_blank')
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
    <AppShell headerTitle="Planos Premium" headerSubtitle="Escolha o plano perfeito para você">
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <PremiumLogo size="xl" />
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
          <Card className="mb-12 border-2 border-[#468152] bg-[#468152]/10 dark:bg-[#468152]/20 animate-in fade-in slide-in-from-top-2 duration-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Check className="h-6 w-6 text-[#468152] flex-shrink-0 mt-0.5 animate-bounce" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-[#468152] dark:text-[#468152] mb-2">
                    🎉 Parabéns! Seu Pagamento foi Aprovado!
                  </h3>
                  <p className="text-[#468152]/90 mb-3">
                    Você adquiriu o plano <strong>Premium {successPlan ? successPlan.charAt(0).toUpperCase() + successPlan.slice(1) : ''}</strong> com sucesso!
                  </p>
                  <p className="text-sm text-[#468152]/80 mb-4">
                    Agora você tem acesso a todos os recursos Premium, incluindo <strong>20 provas pessoais por dia</strong>. O comprovante foi enviado pelo Stripe.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => router.push('/profile')}
                      className="bg-[#468152] hover:bg-[#468152]/90"
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
            <Card className="mb-10 border-2 border-amber-500/60 bg-amber-50/60 dark:bg-amber-950/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100 mb-2">
                      Pagamento via Pix, Dinheiro ou Boleto
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                      Se você quiser fazer pagamento no <strong>Pix</strong>, <strong>Dinheiro</strong> ou <strong>Boleto</strong>, você deve contactar a Administração da Domine Aqui.
                    </p>

                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant={showAlternativePayments ? 'outline' : 'default'}
                          className={showAlternativePayments ? '' : 'bg-amber-600 hover:bg-amber-700 text-white'}
                          onClick={() => {
                            setShowAlternativePayments((v) => !v)
                            if (showAlternativePayments) {
                              setSelectedPaymentMethod(null)
                            }
                          }}
                        >
                          {showAlternativePayments ? 'Fechar opções' : 'Selecionar opção'}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const displayName = (userName || '').trim() || 'Usuário'
                            const message = encodeURIComponent(
                              `Olá, sou *${displayName}* e gostaria de informações para adquirir o DomineAqui Premium via Pix, Dinheiro ou Boleto.`
                            )
                            window.open(`https://wa.me/5521997770936?text=${message}`, '_blank')
                          }}
                          className="border-amber-600 text-amber-700 hover:bg-amber-100/60 dark:hover:bg-amber-950"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Falar no WhatsApp
                        </Button>
                      </div>

                      {showAlternativePayments && (
                        <div className="rounded-lg border bg-background/60 p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-2">Selecione a opção</p>
                              <div className="flex gap-2 flex-wrap">
                                {(['Pix', 'Dinheiro', 'Boleto'] as const).map((method) => (
                                  <Button
                                    key={method}
                                    type="button"
                                    variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                                    className={selectedPaymentMethod === method ? 'bg-amber-600 hover:bg-amber-700' : ''}
                                    onClick={() => setSelectedPaymentMethod(method)}
                                  >
                                    {method}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {selectedPaymentMethod && (
                              <div>
                                <p className="text-sm font-medium mb-2">Selecione o Plano</p>
                                <div className="flex gap-2 flex-wrap">
                                  {alternativePlans.map((p) => (
                                    <Button
                                      key={p.value}
                                      type="button"
                                      variant="outline"
                                      onClick={() => openWhatsAppForAlternativePayment(selectedPaymentMethod, p.value)}
                                    >
                                      {p.label}
                                    </Button>
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">
                                  Ao selecionar, enviaremos uma mensagem automática para o WhatsApp da Administração.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12 items-start justify-center">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col h-full hover:shadow-xl transition-all duration-300 ${plan.highlighted
                    ? 'border-2 border-primary shadow-lg scale-105 z-10'
                    : 'border opacity-90 hover:opacity-100 hover:scale-[1.02]'
                    }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-full text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${plan.highlighted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <CardHeader className="p-5 pb-2 text-center">
                    <div className="mx-auto mb-3 p-2 bg-primary/5 rounded-full w-fit">
                      {plan.icon}
                    </div>
                    <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-xs uppercase tracking-wide font-medium">{plan.period}</CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 flex-1 flex flex-col">
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center gap-2 items-baseline">
                        <span className="text-3xl font-extrabold tracking-tight">
                          R$ {plan.price.toFixed(2)}
                        </span>
                        {(plan.originalPrice > plan.price) && (
                          <span className="text-sm text-muted-foreground line-through decoration-red-500/50">
                            R$ {plan.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {plan.discountLabel && (
                        <div className="mt-2 inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded-md font-medium">
                          {plan.discountLabel}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 flex-1">
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, featureIdx) => (
                          <li key={featureIdx} className="flex items-start gap-2.5 text-sm group">
                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-muted-foreground leading-tight group-hover:text-foreground transition-colors">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <Button
                        className={`w-full font-semibold transition-all ${plan.highlighted
                          ? 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg'
                          : 'variant-outline'
                          }`}
                        variant={plan.highlighted ? 'default' : 'outline'}
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={selectedPlan === plan.id}
                      >
                        {selectedPlan === plan.id ? 'Processando...' : 'Escolher Plano'}
                      </Button>
                      <p className="text-[10px] text-center text-muted-foreground mt-2">
                        {plan.id.includes('vitalicio') ? 'Pagamento único' : 'Renovação automática. Cancele quando quiser.'}
                      </p>
                    </div>
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
      </div>
    </AppShell>
  )
}
