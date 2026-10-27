'use client'

import { useEffect, useId, useRef } from 'react'
import { ShieldCheck } from 'lucide-react'

/**
 * Desafio do 3DS 2.0: o banco pediu que o comprador confirme a compra (app do
 * banco, SMS, senha). É o que o Mercado Pago devolve como `pending_challenge`
 * quando o pagamento vai com `three_d_secure_mode: "optional"` — em vez de
 * recusar a compra como `cc_rejected_high_risk`.
 *
 * Mecânica da documentação do MP: um iframe e um formulário POST para
 * `external_resource_url` com o `creq` escondido. Ao terminar, a página do
 * banco avisa por `postMessage` com `status: "COMPLETE"`; o resultado de
 * verdade vem da consulta do pagamento (o polling do checkout).
 */
export function DesafioTresDS({
  url,
  creq,
  onConcluido,
}: {
  url: string
  creq: string
  onConcluido: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const nome = `desafio-3ds-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const concluidoRef = useRef(onConcluido)
  concluidoRef.current = onConcluido

  useEffect(() => {
    try {
      formRef.current?.submit()
    } catch {
      /* o polling segue; sem o desafio, o MP cancela o pagamento no prazo */
    }
  }, [url, creq])

  useEffect(() => {
    // A mensagem só ANTECIPA a consulta do pagamento — não decide nada, por
    // isso não importa de que origem venha.
    const ouvir = (e: MessageEvent) => {
      let dado: any = e.data
      if (typeof dado === 'string') {
        try {
          dado = JSON.parse(dado)
        } catch {
          return
        }
      }
      if (dado && typeof dado === 'object' && String(dado.status || '').toUpperCase() === 'COMPLETE') {
        concluidoRef.current()
      }
    }
    window.addEventListener('message', ouvir)
    return () => window.removeEventListener('message', ouvir)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShieldCheck size={22} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Confirme a compra com o seu banco</h3>
      </div>
      <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
        Por segurança, o seu banco pediu uma confirmação desta compra. Siga as instruções abaixo (código por SMS, app do
        banco ou senha). Você tem cerca de 5 minutos — não feche esta página.
      </p>
      <iframe
        name={nome}
        title="Confirmação do banco"
        style={{
          width: '100%',
          height: '520px',
          border: '1px solid hsl(var(--border))',
          borderRadius: '12px',
          background: 'white',
        }}
      />
      <form ref={formRef} method="post" action={url} target={nome} style={{ display: 'none' }}>
        <input type="hidden" name="creq" value={creq} />
      </form>
    </div>
  )
}
