import type { Metadata } from 'next'
import { publicIndexingRobots } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Ferramentas Clínicas — calculadoras e escores interativos | Manual Clínico',
  description:
    '201 calculadoras e escores clínicos interativos, com a conta aberta, interpretação do resultado, fundamento fisiológico, armadilhas de aplicação e referência bibliográfica. Gasometria, cardiologia, ventilação mecânica, nefrologia, sepse, neurologia, hepatologia, hematologia, endocrinologia, pediatria, obstetrícia, emergência, cirurgia, farmacologia e nutrição. Exclusivo para assinantes do Manual Clínico — veja o catálogo completo, ferramenta por ferramenta.',
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Ferramentas Clínicas — calculadoras e escores interativos',
    description:
      'Winter, ânion gap corrigido, delta-delta, driving pressure, CKD-EPI, SOFA, NIHSS, MELD, CHA₂DS₂-VASc, Holliday-Segar, conversão de opioides e mais 190 outras — cada uma com fórmula, interpretação e referência. Veja a lista completa do que há em cada área.',
  },
}

export default function FerramentasLayout({ children }: { children: React.ReactNode }) {
  return children
}
