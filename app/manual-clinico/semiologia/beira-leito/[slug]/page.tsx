import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaSemiologia } from '@/components/semiologia/area'
import { VisorDeCenas } from '@/components/semiologia/visor'
import { TITULOS_DE_INSTRUMENTO } from '@/lib/semiologia/esquemas'
import { ROTAS } from '@/lib/semiologia/rotas'
import { VISTAS, vistaPorSlug } from '@/lib/semiologia/vistas'

export function generateStaticParams() {
  return VISTAS.map((vista) => ({ slug: vista.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const vista = vistaPorSlug(params.slug)
  if (!vista) return { title: 'Janela não encontrada | Manual de Semiologia' }
  return {
    title: `${vista.nome} - normal e alterado | Manual de Semiologia`,
    description: vista.paraQue,
  }
}

export default function VistaPage({ params }: { params: { slug: string } }) {
  const vista = vistaPorSlug(params.slug)
  if (!vista) notFound()

  return (
    <AreaSemiologia alvo={vista.nome}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          {/* O visor lê a cena de `?cena=`; em rota pré-renderizada isso exige
              fronteira de suspensão. */}
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/40" />}>
            <VisorDeCenas
              titulo={vista.nome}
              subtitulo={TITULOS_DE_INSTRUMENTO[vista.instrumento]}
              contexto={vista.paraQue}
              cenas={vista.cenas}
              estruturas={vista.estruturas}
              comoFazer={vista.comoFazer}
              qualidade={vista.qualidade}
              armadilhas={vista.armadilhas}
              ondeVerFoto={vista.ondeVerFoto}
              referencias={vista.referencias}
              voltarPara={ROTAS.beiraLeito}
              voltarRotulo="Imagem à beira do leito"
            />
          </Suspense>
        </div>
      </div>
    </AreaSemiologia>
  )
}
