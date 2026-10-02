import type { Metadata } from 'next'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CatalogoCasosTC, type ResumoCasoTC } from '@/components/radiologia/catalogo-casos-tc'
import { CASOS_TC, GUIAS_CASOS_TC, ORDEM_CATEGORIAS_TC, urlDoCorteTC, vinhetaDoCasoTC } from '@/lib/radiologia/casos-tc'

export const metadata: Metadata = {
  title: 'Casos clínicos de Tomografia | Manual de Radiologia',
  description:
    'Casos clínicos de TC com pilhas reais de cortes: role a série como no aparelho, leia a consulta completa, responda e veja os apontamentos do autor traduzidos e comentados, a leitura do exame, as armadilhas e a conduta.',
}

/** Só o resumo de cada caso atravessa a rede; a consulta fica na página do caso. */
const RESUMOS: ResumoCasoTC[] = CASOS_TC.map((caso, i) => ({
  slug: caso.slug,
  numero: i + 1,
  titulo: caso.titulo,
  categoria: caso.categoria,
  queixa: vinhetaDoCasoTC(caso.slug)!.queixa,
  identificacao: vinhetaDoCasoTC(caso.slug)!.identificacao,
  cortes: caso.totalFatias,
  apontamentos: caso.apontamentos.length,
  capa: urlDoCorteTC(caso.slug, caso.corteInicial + 1),
}))

export default function CasosTCPage() {
  return (
    <AreaRadiologia alvo="Casos clínicos de tomografia">
      <CatalogoCasosTC casos={RESUMOS} categorias={ORDEM_CATEGORIAS_TC.map((id) => GUIAS_CASOS_TC[id])} />
    </AreaRadiologia>
  )
}
