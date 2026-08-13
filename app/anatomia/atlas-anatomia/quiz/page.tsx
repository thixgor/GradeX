'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { PortaoAnatomia } from '@/components/anatomia/portao-anatomia'

/** O quiz sorteia questões do acervo — carrega só depois do veredito de acesso. */
const carregarQuiz = () => import('@/components/anatomia/quiz-atlas')

const QuizAtlas = dynamic(carregarQuiz, {
  ssr: false,
  loading: () => (
    <div className="surface-page flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

export default function QuizAtlasPage() {
  return (
    <PortaoAnatomia secao="atlas" precarregar={carregarQuiz}>
      {dados => (
        <Suspense fallback={<div className="surface-page min-h-screen" />}>
          <QuizAtlas catalogo={dados.catalogo} />
        </Suspense>
      )}
    </PortaoAnatomia>
  )
}
