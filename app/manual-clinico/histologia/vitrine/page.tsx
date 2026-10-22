import { preload } from 'react-dom'

import { AppShell } from '@/components/app-shell'
import { VitrinePublica } from '@/components/histologia/vitrine-publica'
import { montarVitrine } from '@/lib/histologia/vitrine'
import { ROTA_DA_OFERTA } from '@/lib/histologia/vitrine-tipos'

/**
 * Landing de vendas do Manual da Histologia para quem chega **sem sessão** —
 * estática, servida do CDN.
 *
 * Ninguém precisa abrir este endereço: o middleware reescreve a home do módulo
 * (`/manual-clinico/histologia`) para cá quando não há sessão válida, e a barra
 * continua mostrando a home. O canônico, herdado do layout, também é a home —
 * é ela que o buscador indexa.
 *
 * O que está aqui é exatamente o que a vitrine sempre mostrou ao visitante
 * (`montarVitrine`: números, quatro capas de setor e uma lâmina de amostra);
 * nada do acervo. Montada no build, uma vez. O preço chega depois, pela rota
 * de oferta — ver `components/histologia/vitrine-publica.tsx`.
 */
export default async function VitrineEstaticaDaHistologia() {
  preload(ROTA_DA_OFERTA, { as: 'fetch', crossOrigin: 'anonymous' })
  const dados = await montarVitrine()

  return (
    // `guestNotice` desligado: o aviso flutuante do shell fala de catálogo e
    // download, fora de contexto aqui, e cobre a barra de compra no celular.
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <VitrinePublica dados={dados} />
    </AppShell>
  )
}
