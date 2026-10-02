import type { Metadata } from 'next'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CatalogoCasosImagem } from '@/components/radiologia/catalogo-casos-imagem'
import { COLECAO_RX } from '@/lib/radiologia/casos-rx'
import { COLECAO_TC } from '@/lib/radiologia/casos-tc'
import { resumosDaColecao } from '@/lib/radiologia/casos-imagem-paginas'

export const metadata: Metadata = {
  title: 'Casos clínicos de Raio-X com apontamentos | Manual de Radiologia',
  description:
    'Radiografias reais de tórax, abdome, pediatria e osso com as setas do autor traduzidas e comentadas uma a uma, organizadas por região e tema, com consulta completa, quiz, leitura do exame, armadilhas e conduta.',
}

export default function CasosRXApontadosPage() {
  return (
    <AreaRadiologia alvo="Casos clínicos de Raio-X com apontamentos">
      <CatalogoCasosImagem
        titulo="Casos de Raio-X com apontamentos"
        descricao="Radiografias reais com as setas do autor do caso, cada uma traduzida e comentada: o que é, por que a imagem fica assim, como reconhecer sem a seta e onde engana. Organizados por região e tema, cada caso começa pela consulta inteira."
        voltar={{ href: '/manual-clinico/radiologia/raio-x/casos', rotulo: 'Casos e alterações no Raio-X' }}
        modalidade="rx"
        rotaCatalogo="/manual-clinico/radiologia/raio-x/casos-com-apontamentos"
        categorias={COLECAO_RX.categorias}
        temas={COLECAO_RX.temas}
        casos={resumosDaColecao(COLECAO_RX)}
        outraColecao={{ href: '/manual-clinico/radiologia/tomografia/casos', rotulo: 'Casos clínicos de TC', total: COLECAO_TC.casos.length }}
      />
    </AreaRadiologia>
  )
}
