import type { Metadata } from 'next'
import { CATEGORIA_POR_ID, ehCategoria } from '@/lib/ferramentas-clinicas/categorias'

/**
 * Metadados da página de uma ferramenta.
 *
 * O título usa a área, e não o nome da ferramenta: descobrir o nome exigiria
 * importar o módulo de conteúdo daquela categoria aqui no servidor, e esses
 * módulos são justamente o que o carregamento por `import()` mantém fora do
 * pacote inicial. Trocar 400 KB de peso por um título de aba mais bonito seria
 * um péssimo negócio, ainda mais numa página que exige acesso para mostrar
 * qualquer conteúdo.
 */
export function generateMetadata({ params }: { params: { categoria: string } }): Metadata {
  if (!ehCategoria(params.categoria)) {
    return { title: 'Ferramentas Clínicas | Manual Clínico' }
  }
  const c = CATEGORIA_POR_ID[params.categoria]
  return {
    title: `${c.nome} — Ferramentas Clínicas | Manual Clínico`,
    description: `Calculadora interativa de ${c.nome.toLowerCase()}, com fórmula, interpretação, armadilhas e referência.`,
  }
}

export default function FerramentaLayout({ children }: { children: React.ReactNode }) {
  return children
}
