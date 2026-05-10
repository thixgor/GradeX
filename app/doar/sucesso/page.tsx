'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Heart } from 'lucide-react'

export default function DoacaoSucessoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-500/10 via-background to-pink-500/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
          <h1 className="text-2xl font-bold">Obrigado pela sua doação!</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-1">
            <Heart className="h-4 w-4 text-rose-500" /> Seu apoio mantém o DomineAqui no ar.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link href="/">Voltar ao início</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/doar">Doar novamente</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
