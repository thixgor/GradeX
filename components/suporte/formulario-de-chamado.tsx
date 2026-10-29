'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, Bug, CreditCard, KeyRound, Lightbulb, Loader2, MessageCircle, Send } from 'lucide-react'
import type { TicketCategory } from '@/lib/types'
import { TICKET_CATEGORIES, TICKET_MENSAGEM_MAX, TICKET_TITULO_MAX } from '@/lib/tickets'
import {
  VISITANTE_MENSAGEM_MAX,
  VISITANTE_NOME_MAX,
  validarChamadoDeVisitante,
} from '@/lib/tickets-visitante-regras'
import { guardarChamadoNoAparelho } from './chamados-no-aparelho'
import '@/components/checkout/checkout-vidro.css'
import './suporte.css'

/**
 * Abrir um chamado — com conta ou sem.
 *
 * - `conta`: vai para `/api/tickets` e a conversa segue no balão do app.
 * - `visitante`: vai para `/api/suporte/visitante`. Antes de enviar, o
 *   formulário pega um desafio do servidor (e espera os 3 s mínimos dele, se a
 *   pessoa for rápida demais), e roda o reCAPTCHA quando o site tem a chave.
 *   O campo-isca fica fora da tela. Nada disso aparece para quem digita.
 *
 * As regras de conteúdo são as MESMAS do servidor (`validarChamadoDeVisitante`),
 * então o erro aparece no campo certo antes de qualquer ida à rede.
 */

const ICONES: Record<TicketCategory, { icone: React.ReactNode; a: string; b: string }> = {
  financeiro: { icone: <CreditCard className="h-3.5 w-3.5" />, a: '#5aa66b', b: '#2f6b40' },
  acesso: { icone: <KeyRound className="h-3.5 w-3.5" />, a: '#5b9bff', b: '#2563eb' },
  conteudo: { icone: <BookOpen className="h-3.5 w-3.5" />, a: '#efa63a', b: '#c27508' },
  bug: { icone: <Bug className="h-3.5 w-3.5" />, a: '#f47272', b: '#cf3434' },
  sugestao: { icone: <Lightbulb className="h-3.5 w-3.5" />, a: '#ad86f7', b: '#7646d8' },
  outro: { icone: <MessageCircle className="h-3.5 w-3.5" />, a: '#9aa3ad', b: '#5f6873' },
}

export interface ChamadoCriado {
  ticketId: string
  protocolo: string
  /** Só no chamado de visitante: a chave do link de acompanhamento. */
  chave?: string
}

type Campo = 'nome' | 'email' | 'titulo' | 'mensagem' | 'categoria' | 'contexto'

declare global {
  interface Window {
    grecaptcha?: any
  }
}

const CHAVE_DO_SITE = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

function carregarRecaptcha() {
  if (!CHAVE_DO_SITE || typeof document === 'undefined') return
  if (document.querySelector('script[data-recaptcha-suporte]') || window.grecaptcha) return
  const s = document.createElement('script')
  s.src = `https://www.google.com/recaptcha/api.js?render=${CHAVE_DO_SITE}`
  s.async = true
  s.dataset.recaptchaSuporte = '1'
  document.head.appendChild(s)
}

async function tokenDoRecaptcha(): Promise<string | undefined> {
  if (!CHAVE_DO_SITE) return undefined
  const g = window.grecaptcha
  if (!g?.execute) return undefined
  return new Promise((resolve) => {
    g.ready(() => {
      g.execute(CHAVE_DO_SITE, { action: 'suporte_visitante' }).then(resolve, () => resolve(undefined))
    })
  })
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function FormularioDeChamado({
  modo,
  contexto,
  categoriaInicial = 'outro',
  tituloInicial = '',
  emailInicial = '',
  onCriado,
  autoFoco = true,
}: {
  modo: 'conta' | 'visitante'
  contexto?: string
  categoriaInicial?: TicketCategory
  tituloInicial?: string
  emailInicial?: string
  onCriado: (chamado: ChamadoCriado) => void
  autoFoco?: boolean
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState(emailInicial)
  const [titulo, setTitulo] = useState(tituloInicial)
  const [mensagem, setMensagem] = useState('')
  const [categoria, setCategoria] = useState<TicketCategory>(categoriaInicial)
  const [isca, setIsca] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<{ texto: string; campo?: Campo } | null>(null)
  const desafio = useRef<{ token: string; em: number } | null>(null)
  const primeiroCampo = useRef<HTMLInputElement>(null)

  const visitante = modo === 'visitante'
  const max = visitante ? VISITANTE_MENSAGEM_MAX : TICKET_MENSAGEM_MAX

  const buscarDesafio = useCallback(async () => {
    try {
      const res = await fetch('/api/suporte/visitante', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.desafio) desafio.current = { token: data.desafio, em: Date.now() }
    } catch {
      /* sem rede agora — o envio tenta de novo */
    }
  }, [])

  useEffect(() => {
    if (visitante) void buscarDesafio()
  }, [visitante, buscarDesafio])

  useEffect(() => {
    if (autoFoco) primeiroCampo.current?.focus({ preventScroll: true })
  }, [autoFoco])

  async function enviarComoVisitante(tentativa = 0): Promise<void> {
    const local = validarChamadoDeVisitante({ nome, email, titulo, mensagem, categoria, contexto })
    if (!local.ok) {
      setErro({ texto: local.erro, campo: local.campo })
      return
    }

    if (!desafio.current) await buscarDesafio()
    if (!desafio.current) {
      setErro({ texto: 'Sem conexão com o suporte agora. Confira sua internet e tente de novo.' })
      return
    }
    // O servidor recusa envio em menos de 3 s (gente digita; robô não). Quem
    // for rápido de verdade espera o restinho aqui, sem ver erro nenhum.
    const falta = 3_300 - (Date.now() - desafio.current.em)
    if (falta > 0) await esperar(falta)

    const res = await fetch('/api/suporte/visitante', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        email,
        titulo,
        mensagem,
        categoria,
        contexto,
        site: isca,
        desafio: desafio.current.token,
        recaptchaToken: await tokenDoRecaptcha(),
      }),
    })
    const data = await res.json().catch(() => ({}))
    desafio.current = null

    if (!res.ok) {
      if (data?.renovarDesafio && tentativa === 0) {
        await buscarDesafio()
        return enviarComoVisitante(1)
      }
      void buscarDesafio()
      setErro({ texto: data?.error || 'Não foi possível abrir o chamado. Tente de novo.', campo: data?.campo })
      return
    }

    if (data.ticketId && data.chave) {
      guardarChamadoNoAparelho({
        id: data.ticketId,
        chave: data.chave,
        protocolo: data.protocolo,
        titulo: titulo.trim(),
        em: Date.now(),
      })
    }
    onCriado({ ticketId: data.ticketId, protocolo: data.protocolo, chave: data.chave })
  }

  async function enviarComConta() {
    if (titulo.trim().length < 3) return setErro({ texto: 'Resuma o assunto em pelo menos 3 letras.', campo: 'titulo' })
    if (!mensagem.trim()) return setErro({ texto: 'Escreva a sua mensagem.', campo: 'mensagem' })
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titulo, message: mensagem, category: categoria, contexto }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErro({ texto: data?.error || 'Não foi possível abrir o chamado. Tente de novo.' })
      return
    }
    onCriado({ ticketId: data.ticketId, protocolo: data.protocolo })
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (enviando) return
    setErro(null)
    setEnviando(true)
    try {
      if (visitante) await enviarComoVisitante()
      else await enviarComConta()
    } catch {
      setErro({ texto: 'Falha de conexão. Confira sua internet e tente de novo.' })
    } finally {
      setEnviando(false)
    }
  }

  const invalido = (campo: Campo) => (erro?.campo === campo ? true : undefined)

  return (
    <form className="ck-escopo flex flex-col gap-4" onSubmit={enviar} onFocus={visitante ? carregarRecaptcha : undefined} noValidate>
      {visitante && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="sp-nome" className="ck-rotulo">Seu nome</label>
            <input
              ref={primeiroCampo}
              id="sp-nome"
              className="ck-campo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={VISITANTE_NOME_MAX}
              autoComplete="name"
              placeholder="Como podemos te chamar"
              aria-invalid={invalido('nome')}
            />
          </div>
          <div>
            <label htmlFor="sp-email" className="ck-rotulo">E-mail para a resposta</label>
            <input
              id="sp-email"
              type="email"
              inputMode="email"
              className="ck-campo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              autoComplete="email"
              placeholder="voce@email.com"
              aria-invalid={invalido('email')}
            />
          </div>
        </div>
      )}

      <fieldset>
        <legend className="ck-rotulo">Sobre o que é?</legend>
        <div className="sp-categorias" role="radiogroup">
          {TICKET_CATEGORIES.map((c) => {
            const ic = ICONES[c.value]
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={categoria === c.value}
                className="sp-categoria"
                onClick={() => setCategoria(c.value)}
              >
                <span className="sp-categoria-icone" style={{ '--chip-a': ic.a, '--chip-b': ic.b } as React.CSSProperties} aria-hidden>
                  {ic.icone}
                </span>
                {c.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="sp-titulo" className="ck-rotulo">Assunto</label>
        <input
          ref={visitante ? undefined : primeiroCampo}
          id="sp-titulo"
          className="ck-campo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={TICKET_TITULO_MAX}
          placeholder="Ex.: paguei o Pix e o acesso não liberou"
          aria-invalid={invalido('titulo')}
        />
      </div>

      <div>
        <label htmlFor="sp-mensagem" className="ck-rotulo">
          O que aconteceu?
          <small>{mensagem.length}/{max}</small>
        </label>
        <textarea
          id="sp-mensagem"
          className="ck-campo"
          style={{ height: 'auto', minHeight: 120, padding: '12px 15px', lineHeight: 1.45, resize: 'vertical' }}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          maxLength={max}
          rows={5}
          placeholder="Conte o passo a passo e, se tiver, o número do pedido. Detalhe acelera a resposta."
          aria-invalid={invalido('mensagem')}
        />
      </div>

      {visitante && (
        <div className="sp-isca" aria-hidden>
          <label htmlFor="sp-site">Deixe em branco</label>
          <input id="sp-site" tabIndex={-1} autoComplete="off" value={isca} onChange={(e) => setIsca(e.target.value)} />
        </div>
      )}

      {erro && (
        <p className="ck-erro ck-surge" role="alert">
          {erro.texto}
        </p>
      )}

      <button type="submit" className="ck-cta ck-cta-verde ck-cta-largo" disabled={enviando}>
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {enviando ? 'Enviando…' : 'Abrir chamado'}
      </button>

      <p className="-mt-1 text-center text-xs leading-relaxed" style={{ color: 'var(--ck-texto-3)' }}>
        {visitante
          ? 'A resposta chega no seu e-mail, com um link para continuar a conversa.'
          : 'A resposta chega no balão de suporte e no seu e-mail.'}
        {visitante && CHAVE_DO_SITE ? ' Protegido por reCAPTCHA.' : ''}
      </p>
    </form>
  )
}
