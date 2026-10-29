'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, LifeBuoy } from 'lucide-react'
import type { TicketCategory } from '@/lib/types'
import '@/components/checkout/checkout-vidro.css'
import './suporte.css'

// A folha (formulário, reCAPTCHA, desafio) só baixa quando alguém clica: o
// gatilho mora em todo checkout e no rodapé, e não pode pesar neles.
const FolhaDeSuporte = dynamic(() => import('./folha-de-suporte').then((m) => m.FolhaDeSuporte), {
  ssr: false,
})

/**
 * "Travou em algo? Abra um chamado" — a porta do suporte dentro dos checkouts.
 *
 * Antes o caminho de ajuda no meio de uma compra era sair dela para o
 * WhatsApp: a dúvida ia para um canal sem protocolo, sem histórico e sem o
 * contexto da compra. Agora é uma folha por cima do próprio checkout — o
 * formulário já sabe de que página veio e já vem com "Pagamento" marcado — e
 * a pessoa volta para a compra com um protocolo na mão.
 *
 * Com sessão, o chamado entra na conta (e segue no balão do app). Sem sessão,
 * é chamado de visitante, acompanhado por link no e-mail.
 */

export function AjudaNoCheckout({
  variante = 'linha',
  contexto,
  categoria = 'financeiro',
  titulo,
  rotulo,
  className = '',
}: {
  /** `linha`: cartão discreto com ícone; `link`: só o texto clicável. */
  variante?: 'linha' | 'link'
  /** Caminho da página; por padrão, a página atual. */
  contexto?: string
  categoria?: TicketCategory
  /** Assunto já preenchido (ex.: "Pagamento recusado"). */
  titulo?: string
  rotulo?: React.ReactNode
  className?: string
}) {
  const [aberta, setAberta] = useState(false)

  return (
    <>
      {variante === 'link' ? (
        <button type="button" onClick={() => setAberta(true)} className={`ck-link ${className}`}>
          {rotulo || 'Abrir um chamado'}
        </button>
      ) : (
        <button type="button" onClick={() => setAberta(true)} className={`ck-escopo sp-ajuda ${className}`}>
          <span className="sp-ajuda-icone" aria-hidden>
            <LifeBuoy className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            {rotulo || (
              <>
                Travou em alguma coisa? <strong>Abra um chamado</strong> — a gente responde por aqui e por e-mail.
              </>
            )}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      )}
      {aberta && (
        <FolhaDeSuporte
          onFechar={() => setAberta(false)}
          contexto={contexto}
          categoria={categoria}
          titulo={titulo}
        />
      )}
    </>
  )
}
