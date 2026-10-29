'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { LogoAnimada } from '@/components/marca/logo-animada'
import { Compositor, Conversa, type MensagemDaConversa } from '@/components/suporte/conversa'
import { guardarChamadoNoAparelho } from '@/components/suporte/chamados-no-aparelho'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { VISITANTE_MENSAGEM_MAX } from '@/lib/tickets-visitante-regras'
import type { TicketStatus } from '@/lib/types'

interface Chamado {
  id: string
  protocolo: string
  titulo: string
  categoria: string
  status: TicketStatus
  statusRotulo: string
  naoLidas: number
  mensagens: MensagemDaConversa[]
}

/** Com o chamado aberto e a aba visível: a resposta aparece sozinha. */
const INTERVALO = 15_000

export function ChamadoDoVisitante({ id }: { id: string }) {
  const [chave, setChave] = useState<string | null>(null)
  const [chamado, setChamado] = useState<Chamado | null>(null)
  const [erro, setErro] = useState('')
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')
  const marcouLidas = useRef('')

  // A chave chega na URL do e-mail; sai dela assim que é lida (fica na
  // sessão da aba), para não ir parar em print, histórico ou link copiado.
  useEffect(() => {
    const daUrl = new URLSearchParams(window.location.search).get('chave')
    const guardada = sessionStorage.getItem(`chamado:${id}`)
    const valor = daUrl || guardada
    if (daUrl) {
      try {
        sessionStorage.setItem(`chamado:${id}`, daUrl)
      } catch {}
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (!valor) setErro('Este link está incompleto. Abra o chamado pelo botão do e-mail que enviamos.')
    setChave(valor)
  }, [id])

  const carregar = useCallback(async () => {
    if (!chave) return
    try {
      const res = await fetch(`/api/suporte/visitante/${id}`, { headers: { 'x-chave': chave }, cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status !== 429) setErro(data?.error || 'Não foi possível abrir o chamado.')
        return
      }
      setErro('')
      setChamado(data.chamado)
      guardarChamadoNoAparelho({
        id,
        chave,
        protocolo: data.chamado.protocolo,
        titulo: data.chamado.titulo,
        em: Date.now(),
      })
    } catch {
      /* sem rede: a próxima volta tenta de novo */
    }
  }, [id, chave])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useIntervaloVisivel(carregar, chamado && chamado.status !== 'closed' ? INTERVALO : null)

  const agir = useCallback(
    async (corpo: Record<string, unknown>) => {
      if (!chave) return null
      const res = await fetch(`/api/suporte/visitante/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-chave': chave },
        body: JSON.stringify(corpo),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAviso(data?.error || 'Não foi possível concluir agora.')
        return null
      }
      setAviso('')
      if (data.chamado) setChamado(data.chamado)
      return data
    },
    [id, chave],
  )

  // Marca as respostas do suporte como lidas — uma vez por conjunto novo.
  useEffect(() => {
    if (!chamado || chamado.naoLidas === 0) return
    const assinatura = `${chamado.mensagens.length}`
    if (marcouLidas.current === assinatura) return
    marcouLidas.current = assinatura
    void agir({ acao: 'lido' })
  }, [chamado, agir])

  async function enviar() {
    setEnviando(true)
    const ok = await agir({ acao: 'responder', texto })
    if (ok) setTexto('')
    setEnviando(false)
  }

  if (erro && !chamado) {
    return (
      <div className="ck-escopo ck-vidro-forte ck-entra mx-auto max-w-md p-7 text-center">
        <p className="ck-h1" style={{ fontSize: 24 }}>Chamado não encontrado</p>
        <p className="ck-sub">{erro}</p>
        <Link href="/suporte" className="ck-botao mt-5">Ir para a Central de Ajuda</Link>
      </div>
    )
  }

  if (!chamado) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <LogoAnimada tamanho="compacto" nome={false} modo="gerando" flutua={false} inclinacao="nenhuma" />
      </div>
    )
  }

  const encerrado = chamado.status === 'closed'

  return (
    <div className="ck-escopo mx-auto flex max-w-2xl flex-col gap-4">
      <div className="ck-entra flex items-center justify-between gap-3">
        <Link href="/suporte" className="ck-voltar">
          <ChevronLeft className="h-4 w-4" aria-hidden /> Central de Ajuda
        </Link>
        <span className="sp-status" data-status={chamado.status}>{chamado.statusRotulo}</span>
      </div>

      <section className="ck-vidro-forte ck-entra flex min-h-[60dvh] flex-col overflow-hidden" style={{ '--ordem': 1 } as React.CSSProperties}>
        <header className="sp-cabeca">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-lg font-semibold tracking-tight">{chamado.titulo}</h1>
            <p className="text-xs" style={{ color: 'var(--ck-texto-3)' }}>
              #{chamado.protocolo} · {chamado.categoria}
            </p>
          </div>
          {!encerrado && (
            <button
              type="button"
              className="ck-link-discreto shrink-0"
              onClick={() => {
                if (window.confirm('Encerrar este chamado? Você pode abrir outro quando quiser.')) void agir({ acao: 'encerrar' })
              }}
            >
              Encerrar
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Conversa mensagens={chamado.mensagens} />
        </div>

        {aviso && <p className="ck-erro mx-3 mb-2" role="alert">{aviso}</p>}

        {encerrado ? (
          <div className="flex flex-col items-center gap-3 border-t px-4 py-5 text-center" style={{ borderColor: 'var(--ck-sep)' }}>
            <p className="text-sm" style={{ color: 'var(--ck-texto-2)' }}>Este chamado foi encerrado. O histórico continua aqui.</p>
            <Link href="/suporte" className="ck-botao">Abrir outro chamado</Link>
          </div>
        ) : (
          <>
            {chamado.status === 'resolved' && (
              <p className="mx-3 mb-1 text-center text-xs" style={{ color: 'var(--ck-texto-2)' }}>
                O suporte marcou como resolvido. Ainda com dúvida? É só responder.
              </p>
            )}
            <Compositor valor={texto} onMudar={setTexto} onEnviar={enviar} enviando={enviando} max={VISITANTE_MENSAGEM_MAX} />
          </>
        )}
      </section>

      <p className="text-center text-xs" style={{ color: 'var(--ck-texto-3)' }}>
        Cada resposta do suporte também chega no seu e-mail. Não compartilhe o link deste chamado.
      </p>
    </div>
  )
}
