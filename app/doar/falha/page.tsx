'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function DoacaoFalhaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500/10 via-background to-rose-500/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Não conseguimos processar sua doação</h1>
          <p className="text-muted-foreground">
            Algo deu errado durante o pagamento. Nenhum valor foi cobrado. Tente novamente ou escolha outro método.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link href="/doar">Tentar novamente</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Início</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
