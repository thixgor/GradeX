import type { Metadata } from 'next'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CatalogoCasosImagem } from '@/components/radiologia/catalogo-casos-imagem'
import { COLECAO_TC } from '@/lib/radiologia/casos-tc'
import { COLECAO_RX } from '@/lib/radiologia/casos-rx'
import { resumosDaColecao } from '@/lib/radiologia/casos-imagem-paginas'

export const metadata: Metadata = {
  title: 'Casos clínicos de Tomografia | Manual de Radiologia',
  description:
    'Casos clínicos de TC com pilhas reais de cortes, organizados por região e tema: role a série como no aparelho, leia a consulta completa, responda e percorra as setas do autor traduzidas e comentadas uma a uma, com a leitura do exame, as armadilhas e a conduta.',
}

export default function CasosTCPage() {
  return (
    <AreaRadiologia alvo="Casos clínicos de tomografia">
      <CatalogoCasosImagem
        titulo="Casos clínicos de TC"
        descricao="Pilhas reais de cortes, roladas como no aparelho, organizadas por região e tema. Cada caso começa pela consulta inteira; depois da resposta, cada seta do autor vira um apontamento comentado — o que é, por que a imagem fica assim, como reconhecer e onde engana."
        voltar={{ href: '/manual-clinico/radiologia/tomografia', rotulo: 'Atlas de tomografia' }}
        modalidade="tc"
        rotaCatalogo="/manual-clinico/radiologia/tomografia/casos"
        categorias={COLECAO_TC.categorias}
        temas={COLECAO_TC.temas}
        casos={resumosDaColecao(COLECAO_TC)}
        outraColecao={COLECAO_RX.casos.length ? { href: '/manual-clinico/radiologia/raio-x/casos-com-apontamentos', rotulo: 'Casos de Raio-X com apontamentos', total: COLECAO_RX.casos.length } : undefined}
      />
    </AreaRadiologia>
  )
}
