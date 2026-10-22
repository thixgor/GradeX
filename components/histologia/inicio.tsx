'use client'

import { CatalogoDaHistologia } from '@/components/histologia/catalogo/inicio'
import { EsperaDaHistologia, FalhaAoCarregar, useConteudoDaHistologia } from '@/components/histologia/portao'
import { VitrineDaHistologia } from '@/components/histologia/vitrine'
import { ROTA_DO_INICIO, type RespostaDoInicio } from '@/lib/histologia/inicio-tipos'

/**
 * A home do Manual da Histologia para quem tem sessão: catálogo para quem
 * assina, vitrine para quem não assina — o veredito é da rota, no servidor.
 * O visitante sem sessão recebe a vitrine estática direto do middleware e não
 * passa por aqui.
 */
export function InicioDaHistologia() {
  const { estado, tentarDeNovo } = useConteudoDaHistologia<RespostaDoInicio>(ROTA_DO_INICIO)

  if (estado.fase === 'pronto') {
    const resposta = estado.dados
    return resposta.liberado ? (
      <CatalogoDaHistologia dados={resposta.catalogo} />
    ) : (
      <VitrineDaHistologia acesso={resposta.acesso} dados={resposta.vitrine} />
    )
  }
  // A home não tem para onde mandar um "não": o 404 dela é o do módulo
  // desligado, que o middleware já devolve antes de o casco existir.
  if (estado.fase !== 'carregando') return <FalhaAoCarregar superficie="catalogo" aoTentarDeNovo={tentarDeNovo} />
  return <EsperaDaHistologia superficie="catalogo" />
}
