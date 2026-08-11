import type { Metadata } from 'next'
import { Caveat } from 'next/font/google'

/**
 * Letra manuscrita do caderno radiográfico.
 *
 * Carregada só nesta rota, como as fontes da landing: quem nunca abre o Manual
 * de Radiologia não paga por ela. `display: contents` põe a variável em
 * circulação sem criar uma caixa a mais no layout do atlas.
 */
const manuscrito = Caveat({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-manuscrito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Manual de Radiologia - Tomografia e Raio-X | Manual Clínico',
  description:
    'Atlas radiológico interativo em português: tomografia computadorizada por cortes e radiografias com demarcações anatômicas, roteiros de leitura, caderno de anotações e explicações aprofundadas.',
  openGraph: {
    title: 'Manual de Radiologia - DomineAqui',
    description: 'Tomografia computadorizada e Raio-X em um atlas clínico interativo e aprofundado.',
  },
}

export default function RadiologiaLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${manuscrito.variable} contents`}>{children}</div>
}
