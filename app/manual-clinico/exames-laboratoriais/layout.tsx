import type { Metadata } from 'next'

/**
 * Superfície e metadados da central de Exames Laboratoriais.
 *
 * A classe `.lab` entra aqui, num lugar só: ela carrega os tokens de cor da
 * seção (a tinta verde-petróleo do laudo, o papel, o fio) e a textura de fundo.
 * Sem isso, cada página teria de lembrar de vestir o material — e uma delas
 * esqueceria.
 *
 * O portão de assinatura **não** fica neste layout, e a razão é a mesma
 * documentada no Manual da Histologia: no App Router, a árvore da página é prop
 * de um componente de cliente e é serializada no payload RSC mesmo quando o
 * layout escolhe não exibi-la. Quem verifica acesso é cada página, antes de
 * montar o conteúdo protegido.
 */
export const metadata: Metadata = {
  title: 'Exames Laboratoriais — DomineAqui Lab | Manual Clínico',
  description:
    'Central de interpretação laboratorial: cada marcador com fisiologia, mecanismos de aumento e redução, cadeias causais, diagnósticos diferenciais, padrões laboratoriais e Laboratório Virtual para praticar.',
  openGraph: {
    title: 'DomineAqui Lab — Exames Laboratoriais',
    description:
      'Interprete exames, compreenda alterações e conecte resultados à fisiologia e à clínica. Marcadores, padrões, comparações e exames gerados para praticar.',
  },
}

export default function LayoutDosExames({ children }: { children: React.ReactNode }) {
  return <div className="lab lab-superficie min-h-screen">{children}</div>
}
