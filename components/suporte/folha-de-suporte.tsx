'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import type { TicketCategory } from '@/lib/types'
import { useAuthUser } from '@/hooks/use-auth-user'
import { FormularioDeChamado, type ChamadoCriado } from './formulario-de-chamado'
import { linkLocalDoChamado } from './chamados-no-aparelho'
import '@/components/checkout/checkout-vidro.css'
import './suporte.css'

/**
 * A folha do chamado: sobe do rodapé no celular, abre no centro no computador.
 * Com sessão o chamado entra na conta; sem sessão, é de visitante.
 */
export function FolhaDeSuporte({
  onFechar,
  contexto,
  categoria,
  titulo,
}: {
  onFechar: () => void
  contexto?: string
  categoria?: TicketCategory
  titulo?: string
}) {
  const { user, loading } = useAuthUser()
  const [criado, setCriado] = useState<ChamadoCriado | null>(null)
  const folha = useRef<HTMLDivElement>(null)
  const [pagina, setPagina] = useState<string | undefined>(contexto)

  useEffect(() => {
    if (!contexto) setPagina(`${window.location.pathname}${window.location.search}`.slice(0, 160))
  }, [contexto])

  // Esc fecha; a página de trás não rola com a folha aberta; o foco volta
  // para quem abriu ao fechar.
  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', tecla)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', tecla)
      antes?.focus?.()
    }
  }, [onFechar])

  const modo = user ? 'conta' : 'visitante'

  return createPortal(
    <>
      <div className="sp-fundo" onClick={onFechar} aria-hidden />
      <div
        ref={folha}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sp-folha-titulo"
        className="ck-escopo ck-vidro-forte sp-folha"
      >
        <div className="flex items-start gap-3 px-5 pb-3 pt-6 sm:pt-5">
          <div className="min-w-0 flex-1">
            <h2 id="sp-folha-titulo" className="ck-h1" style={{ fontSize: 24 }}>
              {criado ? 'Chamado aberto' : 'Como podemos ajudar?'}
            </h2>
            {!criado && (
              <p className="ck-sub" style={{ fontSize: 14, marginTop: 4 }}>
                {modo === 'conta'
                  ? 'O chamado entra na sua conta, com o protocolo e o histórico da conversa.'
                  : 'Sem precisar de conta. A resposta chega no seu e-mail.'}
              </p>
            )}
          </div>
          <button type="button" onClick={onFechar} className="sp-icone-botao" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
          {criado ? (
            <ChamadoConfirmado chamado={criado} modo={modo} onFechar={onFechar} />
          ) : loading ? (
            <div className="h-64" aria-hidden />
          ) : (
            <FormularioDeChamado
              modo={modo}
              contexto={pagina}
              categoriaInicial={categoria}
              tituloInicial={titulo}
              emailInicial={user?.email || ''}
              onCriado={setCriado}
            />
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}

function ChamadoConfirmado({
  chamado,
  modo,
  onFechar,
}: {
  chamado: ChamadoCriado
  modo: 'conta' | 'visitante'
  onFechar: () => void
}) {
  const abrirNoApp = () => {
    // O balão de suporte do app escuta este evento e abre direto na conversa.
    window.dispatchEvent(new CustomEvent('suporte:abrir', { detail: { ticketId: chamado.ticketId } }))
    onFechar()
  }
  const temBalao = typeof document !== 'undefined' && !!document.querySelector('[data-suporte-balao]')

  return (
    <div className="ck-surge flex flex-col items-center gap-4 py-4 text-center">
      <span
        className="grid h-16 w-16 place-items-center rounded-[22px] text-white"
        style={{ background: 'linear-gradient(180deg, #5aa66b, #2f6b40)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3), 0 12px 26px -12px rgba(46,97,64,.8)' }}
        aria-hidden
      >
        <Check className="h-8 w-8" strokeWidth={2.6} />
      </span>
      <div>
        <p className="text-sm" style={{ color: 'var(--ck-texto-2)' }}>Protocolo</p>
        <p className="font-heading text-3xl font-semibold tracking-tight">#{chamado.protocolo}</p>
      </div>
      <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--ck-texto-2)' }}>
        {modo === 'conta'
          ? 'A resposta aparece no balão de suporte e também no seu e-mail. Pode voltar para a compra tranquilo.'
          : 'Mandamos para o seu e-mail um link para acompanhar a conversa. Pode voltar para a compra tranquilo.'}
      </p>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        {modo === 'visitante' && chamado.chave ? (
          <Link href={linkLocalDoChamado({ id: chamado.ticketId, chave: chamado.chave })} className="ck-botao" target="_blank">
            Acompanhar o chamado
          </Link>
        ) : temBalao ? (
          <button type="button" onClick={abrirNoApp} className="ck-botao">
            Abrir a conversa
          </button>
        ) : (
          <Link href={`/dashboard?suporte=${chamado.ticketId}`} className="ck-botao">
            Abrir a conversa
          </Link>
        )}
        <button type="button" onClick={onFechar} className="ck-cta ck-cta-verde" style={{ height: 44 }}>
          Voltar para a compra
        </button>
      </div>
    </div>
  )
}
