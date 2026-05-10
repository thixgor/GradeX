'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

export default function DoacaoPendentePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500/10 via-background to-yellow-500/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <Clock className="h-16 w-16 mx-auto text-amber-500" />
          <h1 className="text-2xl font-bold">Doação em processamento</h1>
          <p className="text-muted-foreground">
            Recebemos sua intenção de doação. Assim que o pagamento for confirmado pelo banco, ela será registrada automaticamente no ranking.
          </p>
          <Button asChild>
            <Link href="/">Voltar ao início</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
