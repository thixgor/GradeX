import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaSemiologia } from '@/components/semiologia/area'
import { VisorDeCenas } from '@/components/semiologia/visor'
import { TITULOS_DE_TRANSDUTOR } from '@/lib/semiologia/esquemas'
import { ROTAS } from '@/lib/semiologia/rotas'
import { JANELAS_ULTRASSOM, janelaPorSlug } from '@/lib/semiologia/ultrassom'
import { comAcervo } from '@/lib/semiologia/acervo'

export function generateStaticParams() {
  return JANELAS_ULTRASSOM.map((janela) => ({ slug: janela.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const janela = janelaPorSlug(params.slug)
  if (!janela) return { title: 'Janela não encontrada | Manual de Semiologia' }
  return {
    title: `${janela.nome} - POCUS | Manual de Semiologia`,
    description: `${janela.pergunta} Posição, técnica, cena normal e alterada.`,
  }
}

export default function JanelaPage({ params }: { params: { slug: string } }) {
  const encontrada = janelaPorSlug(params.slug)
  if (!encontrada) notFound()

  const janela = comAcervo(encontrada)

  return (
    <AreaSemiologia alvo={janela.nome}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/40" />}>
            <VisorDeCenas
              titulo={janela.nome}
              subtitulo={`${janela.protocolo} · ${TITULOS_DE_TRANSDUTOR[janela.transdutor]} · ${janela.posicao}`}
              contexto={`${janela.pergunta} Profundidade: ${janela.profundidade}`}
              cenas={janela.cenas}
              estruturas={janela.estruturas}
              comoFazer={janela.comoFazer}
              qualidade={[]}
              armadilhas={janela.armadilhas}
              ondeVerFoto={janela.ondeVerFoto}
              referencias={janela.referencias}
              voltarPara={ROTAS.ultrassom}
              voltarRotulo="Ultrassom à beira do leito"
            />
          </Suspense>
        </div>
      </div>
    </AreaSemiologia>
  )
}
