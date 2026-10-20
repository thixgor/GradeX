import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaSemiologia } from '@/components/semiologia/area'
import { FichaDeSinal } from '@/components/semiologia/ficha-sinal'
import { comAcervoSinal } from '@/lib/semiologia/acervo'
import { sinalPorSlug } from '@/lib/semiologia/sinais'
import { ConexoesDoManual } from '@/components/manual-clinico/integracao/conexoes-do-manual'

// Gerada na primeira visita e guardada até o próximo deploy, e não no build:
// ver "Páginas sob demanda" em next.config.js.
export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const sinal = sinalPorSlug(params.slug)
  if (!sinal) return { title: 'Sinal não encontrado | Manual de Semiologia' }
  return {
    title: `${sinal.nome} - exame físico | Manual de Semiologia`,
    description: sinal.resumo,
  }
}

export default async function SinalPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const encontrado = sinalPorSlug(params.slug)
  if (!encontrado) notFound()
  const sinal = comAcervoSinal(encontrado)

  return (
    <AreaSemiologia alvo={sinal.nome}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <FichaDeSinal sinal={sinal} />
          <ConexoesDoManual refOrigem={`sinal:${sinal.slug}`} titulo={sinal.nome} className="px-0 pb-0" />
        </div>
      </div>
    </AreaSemiologia>
  )
}
