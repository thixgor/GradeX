'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Check, ChevronDown, Loader2, MailCheck, RotateCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Espera entre reenvios, igual em todo lugar: evita a pessoa martelar o botão. */
const ESPERA_REENVIO_S = 60
const CHAVE_RECOLHIDO = 'aviso-email-recolhido'

/*
 * Onde o aviso é desenhado. Nas páginas com o casco do app (menu lateral
 * flutuante), dentro da coluna de conteúdo — senão o menu cobre o começo do
 * cartão. Nas demais, no topo da página (instância do layout raiz).
 */
let cascos = 0
const ouvintes = new Set<() => void>()
function avisar() {
  ouvintes.forEach((f) => f())
}
function assinar(f: () => void) {
  ouvintes.add(f)
  return () => {
    ouvintes.delete(f)
  }
}
const haCasco = () => cascos > 0

/** Atalho para a caixa de entrada dos provedores mais comuns. */
function caixaDeEntrada(email: string): { nome: string; url: string } | null {
  const dominio = email.split('@')[1]?.toLowerCase() || ''
  if (/^(gmail|googlemail)\.com$/.test(dominio)) return { nome: 'Gmail', url: 'https://mail.google.com/mail/u/0/#search/DomineAqui' }
  if (/^(outlook|hotmail|live|msn)\.(com|com\.br)$/.test(dominio)) return { nome: 'Outlook', url: 'https://outlook.live.com/mail/0/' }
  if (/^yahoo\.(com|com\.br)$/.test(dominio)) return { nome: 'Yahoo', url: 'https://mail.yahoo.com/' }
  if (/^(icloud|me|mac)\.com$/.test(dominio)) return { nome: 'iCloud', url: 'https://www.icloud.com/mail' }
  return null
}

/**
 * Aviso de e-mail não verificado. Cartão de vidro com halo âmbar, não uma
 * faixa de alerta: o tom é "falta um passo", não "algo deu errado".
 * Recolhe para uma pastilha (lembrada na aba) para não brigar com o conteúdo.
 */
export function VerifyEmailBanner({ noCasco = false }: { noCasco?: boolean } = {}) {
  const pathname = usePathname()
  const reduzir = useReducedMotion()
  const cascoPresente = useSyncExternalStore(assinar, haCasco, () => false)
  const oculto = !pathname || pathname.startsWith('/auth') || pathname === '/' || (!noCasco && cascoPresente)

  useEffect(() => {
    if (!noCasco) return
    cascos++
    avisar()
    return () => {
      cascos--
      avisar()
    }
  }, [noCasco])

  const [usuario, setUsuario] = useState<{ email: string; emailVerified: boolean } | null>(null)
  const [recolhido, setRecolhido] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [espera, setEspera] = useState(0)
  const [erro, setErro] = useState('')

  // Uma leitura por montagem (não a cada navegação): /api/auth/me tem cache
  // privado curto e o estado só muda quando a pessoa clica no link do e-mail.
  useEffect(() => {
    if (oculto || usuario) return
    let vivo = true
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vivo && d?.user && setUsuario({ email: d.user.email, emailVerified: !!d.user.emailVerified }))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [oculto, usuario])

  useEffect(() => {
    try {
      setRecolhido(sessionStorage.getItem(CHAVE_RECOLHIDO) === '1')
    } catch {}
  }, [])

  // Contagem regressiva só enquanto houver espera.
  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  function recolher(valor: boolean) {
    setRecolhido(valor)
    try {
      if (valor) sessionStorage.setItem(CHAVE_RECOLHIDO, '1')
      else sessionStorage.removeItem(CHAVE_RECOLHIDO)
    } catch {}
  }

  async function reenviar() {
    if (enviando || espera > 0) return
    setEnviando(true)
    setErro('')
    try {
      const res = await fetch('/api/auth/verify/resend', { method: 'POST' })
      if (res.ok) {
        setEnviado(true)
        setEspera(ESPERA_REENVIO_S)
      } else {
        const data = await res.json().catch(() => ({}))
        setErro(data.error || 'Não foi possível enviar agora.')
      }
    } catch {
      setErro('Sem conexão. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  if (oculto || !usuario || usuario.emailVerified) return null

  const caixa = caixaDeEntrada(usuario.email)
  const mola = reduzir ? { duration: 0 } : { type: 'spring' as const, stiffness: 380, damping: 32 }

  return (
    <div className={cn('aviso-email-faixa', noCasco && 'aviso-email-faixa-casco')} role="region" aria-label="Verificação de e-mail">
      <AnimatePresence mode="wait" initial={false}>
        {recolhido ? (
          <motion.button
            key="pastilha"
            type="button"
            onClick={() => recolher(false)}
            initial={reduzir ? false : { opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduzir ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -6 }}
            transition={mola}
            className="aviso-email-pastilha vidro-ambar"
            aria-expanded={false}
          >
            <span className="aviso-email-ponto" aria-hidden />
            Confirme seu e-mail
            <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
          </motion.button>
        ) : (
          <motion.section
            key="cartao"
            initial={reduzir ? false : { opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduzir ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={mola}
            className="aviso-email vidro-ambar"
          >
            <div className="aviso-email-icone" aria-hidden>
              <AnimatePresence mode="wait" initial={false}>
                {enviado ? (
                  <motion.span key="ok" initial={reduzir ? false : { scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={mola}>
                    <Check className="h-5 w-5" strokeWidth={2.6} />
                  </motion.span>
                ) : (
                  <motion.span key="mail" initial={false}>
                    <MailCheck className="h-5 w-5" strokeWidth={2.2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="min-w-0 flex-1">
              <p className="aviso-email-titulo">{enviado ? 'Link a caminho' : 'Falta confirmar seu e-mail'}</p>
              <p className="aviso-email-texto" aria-live="polite">
                {enviado ? 'Enviamos um novo link para ' : 'Toque no link que enviamos para '}
                <span className="aviso-email-endereco">{usuario.email}</span>
                {enviado ? '. Olhe também o spam e as promoções.' : ' e libere a plataforma inteira.'}
              </p>
              {erro && <p className="mt-1 text-[13px] font-medium text-destructive">{erro}</p>}
            </div>

            <div className="aviso-email-acoes">
              {caixa && (
                <a href={caixa.url} target="_blank" rel="noopener noreferrer" className="aviso-email-botao aviso-email-botao-cheio">
                  Abrir {caixa.nome}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
              <button
                type="button"
                onClick={reenviar}
                disabled={enviando || espera > 0}
                className={cn('aviso-email-botao', caixa ? 'aviso-email-botao-claro' : 'aviso-email-botao-cheio')}
              >
                {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <RotateCw className="h-3.5 w-3.5" aria-hidden />}
                {espera > 0 ? `Reenviar em ${espera}s` : 'Reenviar link'}
              </button>
            </div>

            <button type="button" onClick={() => recolher(true)} className="aviso-email-fechar" aria-label="Recolher aviso">
              <X className="h-4 w-4" />
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
