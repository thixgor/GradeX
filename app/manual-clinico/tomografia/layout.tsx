import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Manual de Tomografia — Atlas interativo de TC | Manual Clínico',
  description:
    'Atlas tomográfico interativo com TC de tórax, abdome e crânio: role o scroll e percorra os cortes como no aparelho. Mais de 250 estruturas com morfologia, função, densidade em unidades Hounsfield, janela ideal, como identificar na imagem, importância clínica e o aspecto de cada alteração na TC. Com quiz, roteiro de leitura sistemática e modo treino.',
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Manual de Tomografia — atlas interativo de TC',
    description:
      'Percorra cortes reais de TC de tórax, abdome e crânio com scroll, troque a janela, salte para a estrutura e estude cada uma em profundidade.',
  },
}

export default function TomografiaLayout({ children }: { children: React.ReactNode }) {
  return children
}
