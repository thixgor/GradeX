import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { AreaSemiologia } from '@/components/semiologia/area'
import { CatalogoDeImagem } from '@/components/semiologia/catalogo-imagem'
import { resumosDeVistas } from '@/lib/semiologia/catalogo'
import { ROTAS } from '@/lib/semiologia/rotas'

export const metadata: Metadata = {
  title: 'Imagem à beira do leito - otoscopia, fundo de olho | Manual de Semiologia',
  description:
    'Otoscopia, fundo de olho, orofaringe e rinoscopia: a cena normal com cada estrutura marcada e cada alteração ao lado dela, com a diferença para o normal escrita por extenso.',
}

export default function BeiraLeitoPage() {
  return (
    <AreaSemiologia alvo="Imagem à beira do leito">
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <header className="mb-8">
            <Link
              href={ROTAS.raiz}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
              Manual de Semiologia
            </Link>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Imagem à beira do leito</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              O que se vê pelo instrumento simples. Comece sempre pela cena normal: é ela que dá sentido a todas as
              outras, e é justamente ela que costuma faltar.
            </p>
          </header>
          <CatalogoDeImagem itens={resumosDeVistas()} tipo="vista" />
        </div>
      </div>
    </AreaSemiologia>
  )
}
