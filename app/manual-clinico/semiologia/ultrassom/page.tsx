import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { AreaSemiologia } from '@/components/semiologia/area'
import { CatalogoDeImagem } from '@/components/semiologia/catalogo-imagem'
import { resumosDeJanelas } from '@/lib/semiologia/catalogo'
import { ROTAS } from '@/lib/semiologia/rotas'

export const metadata: Metadata = {
  title: 'Ultrassom à beira do leito (POCUS) | Manual de Semiologia',
  description:
    'Linhas A e B, deslizamento pleural, bolsa de Morrison, veia cava inferior e pericárdio: cada janela com a pergunta binária que responde, normal e alterada.',
}

export default function UltrassomPage() {
  return (
    <AreaSemiologia alvo="Ultrassom à beira do leito">
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
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Ultrassom à beira do leito</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Aqui não se interpreta o exame que outra pessoa adquiriu: você é quem encosta a sonda, com a pergunta já
              formulada. Por isso cada janela começa declarando a pergunta binária que responde.
            </p>
          </header>
          <CatalogoDeImagem itens={resumosDeJanelas()} tipo="janela" />
        </div>
      </div>
    </AreaSemiologia>
  )
}
