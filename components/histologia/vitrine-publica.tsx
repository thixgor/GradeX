'use client'

import { useEffect, useState } from 'react'

import { VitrineDaHistologia } from '@/components/histologia/vitrine'
import { ROTA_DA_OFERTA, type DadosDaVitrine, type ProdutoDaVitrine } from '@/lib/histologia/vitrine-tipos'

/**
 * A vitrine de quem chega sem sessão — a página estática para onde o
 * middleware reescreve a home do módulo.
 *
 * Tudo o que ela mostra é igual para todo visitante e sai do CDN junto com o
 * HTML; só o preço mora no banco e chega depois, por `ROTA_DA_OFERTA`. Até ele
 * chegar (ou se não chegar), a vitrine fica sem o bloco de valor, que é o mesmo
 * estado de quando o banco está fora.
 */
export function VitrinePublica({ dados }: { dados: DadosDaVitrine }) {
  const [produto, setProduto] = useState<ProdutoDaVitrine | null>(null)

  useEffect(() => {
    let ativo = true
    fetch(ROTA_DA_OFERTA)
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((conteudo: { produto: ProdutoDaVitrine | null } | null) => {
        if (ativo && conteudo?.produto) setProduto(conteudo.produto)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])

  return <VitrineDaHistologia acesso={{ autenticado: false, motivo: 'guest', produto }} dados={dados} />
}
