'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Heart, Loader2, AlertCircle, ChevronLeft } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'

const PRESETS = [10, 25, 50, 100, 250]

export default function DoarPage() {
  const router = useRouter()
  const [step, setStep] = useState<'choose' | 'online' | 'manual'>('choose')
  const [amount, setAmount] = useState<number>(25)
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorAlias, setDonorAlias] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorMessage, setDonorMessage] = useState('')
  const [publicKey, setPublicKey] = useState('')

  useEffect(() => {
    fetch('/api/payments/public-key')
      .then(r => r.json())
      .then(d => setPublicKey(d.publicKey || ''))
      .catch(() => {})
  }, [])

  const finalAmount = customAmount ? Number(customAmount.replace(',', '.')) : amount

  if (step === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-500/10 via-background to-pink-500/10 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="text-center space-y-2">
            <Heart className="h-12 w-12 mx-auto text-rose-500" />
            <h1 className="text-3xl font-bold">Apoie o DomineAqui</h1>
            <p className="text-muted-foreground">
              Sua doação ajuda a manter a plataforma gratuita para milhares de estudantes.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Como você quer doar?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={() => setStep('online')}
                className="w-full p-4 border rounded-lg hover:bg-muted/50 text-left"
              >
                <div className="font-semibold">Pagar pela plataforma</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Cartão, Pix ou boleto. Você gera o pagamento aqui e a doação é registrada automaticamente após confirmação.
                </p>
              </button>

              <button
                onClick={() => setStep('manual')}
                className="w-full p-4 border rounded-lg hover:bg-muted/50 text-left"
              >
                <div className="font-semibold">Já paguei pelo app do banco</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Você fez o Pix direto pelo banco e quer registrar sua doação para aparecer no ranking. Um administrador irá revisar.
                </p>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'manual') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-500/10 via-background to-pink-500/10 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('choose')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Registrar doação feita pelo banco</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Para registrar uma doação que você já fez via app do banco, abra o site logado e use o formulário de doação.
                Vamos revisar e aprovar para aparecer no ranking.
              </p>
              <Button onClick={() => router.push('/manual-clinico?donate=manual')}>
                Ir para o formulário
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // step === 'online'
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-500/10 via-background to-pink-500/10 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setStep('choose')}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Doação online
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Valor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(v => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => { setAmount(v); setCustomAmount('') }}
                    className={`px-4 py-2 rounded-md border text-sm ${
                      !customAmount && amount === v ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
                    }`}
                  >
                    R$ {v}
                  </button>
                ))}
              </div>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Outro valor (R$)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              {finalAmount < 1 && customAmount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Mínimo R$ 1,00
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="donorName">Nome completo (opcional)</Label>
                <Input id="donorName" value={donorName} onChange={(e) => setDonorName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="donorAlias">Apelido (público)</Label>
                <Input id="donorAlias" value={donorAlias} onChange={(e) => setDonorAlias(e.target.value)} placeholder="Anônimo" />
              </div>
            </div>

            <div>
              <Label htmlFor="donorEmail">E-mail (recomendado)</Label>
              <Input id="donorEmail" type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="seu@email.com" />
            </div>

            <div>
              <Label htmlFor="donorMessage">Mensagem (opcional)</Label>
              <Textarea id="donorMessage" rows={2} value={donorMessage} onChange={(e) => setDonorMessage(e.target.value)} maxLength={500} />
            </div>

            {finalAmount >= 1 && publicKey && (
              <MercadoPagoCheckout
                publicKey={publicKey}
                amount={finalAmount}
                description={`Doação DomineAqui — ${donorAlias || donorName || 'Anônimo'}`}
                endpoint="/api/donations/checkout"
                extraBody={{
                  amount: finalAmount,
                  donationName: donorName || donorAlias || 'Anônimo',
                  donationAlias: donorAlias || donorName || 'Anônimo',
                  donationMessage: donorMessage || undefined,
                  donationEmail: donorEmail || undefined,
                }}
                payerNameHint={donorName}
                payerEmailHint={donorEmail}
                onApproved={() => {
                  setTimeout(() => router.push('/doar/sucesso'), 1500)
                }}
              />
            )}
            {!publicKey && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando integração...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
