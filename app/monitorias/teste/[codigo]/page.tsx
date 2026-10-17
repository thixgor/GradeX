'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FlaskConical, Loader2, LogIn, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarcaClara } from '@/components/monitorias/sala/marca'

/**
 * Convite da sala de teste do admin. Quem está logado ganha um assento grátis
 * e vai direto para a sala (navegação completa: a sala precisa carregar com a
 * permissão de microfone).
 */
export default function ConviteDaSalaDeTeste({ params }: { params: { codigo: string } }) {
  const reduzir = useReducedMotion()
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [precisaLogin, setPrecisaLogin] = useState(false)

  async function entrar() {
    setOcupado(true)
    setErro('')
    try {
      const res = await fetch(`/api/monitorias/teste/${encodeURIComponent(params.codigo)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const corpo = await res.json().catch(() => null)
      if (res.status === 401) return setPrecisaLogin(true)
      if (!res.ok) return setErro(corpo?.error || 'Não deu para entrar agora.')
      window.location.assign(`/monitorias/reservas/${corpo.reservaId}/sala`)
    } catch {
      setErro('Sem conexão. Tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background bg-[radial-gradient(50rem_26rem_at_50%_-10%,hsl(var(--primary)/0.12),transparent)] text-foreground">
      <header className="mx-auto flex w-full max-w-6xl justify-center px-4 py-5 sm:justify-start">
        <MarcaClara />
      </header>
      <main className="grid flex-1 place-items-center px-4 pb-12">
        <motion.div
          initial={reduzir ? false : { opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-xl shadow-black/5 sm:p-8"
        >
          <motion.span
            initial={reduzir ? false : { scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 }}
            className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <FlaskConical className="h-7 w-7" aria-hidden />
          </motion.span>
          <h1 className="mt-4 font-heading text-2xl font-semibold">Sala de teste</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Você foi convidado para testar a sala de aula da DomineAqui: vídeo, áudio, chat, compartilhar tela e anotações. Não é uma aula paga e não precisa de contrato.
          </p>
          {precisaLogin ? (
            <a href={`/auth/login?redirect=${encodeURIComponent(`/monitorias/teste/${params.codigo}`)}`} className="mt-6 block">
              <Button className="h-12 w-full rounded-xl text-base font-semibold">
                <LogIn className="mr-2 h-5 w-5" /> Entrar na conta para continuar
              </Button>
            </a>
          ) : (
            <Button className="mt-6 h-12 w-full rounded-xl text-base font-semibold" disabled={ocupado} onClick={() => void entrar()}>
              {ocupado ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Video className="mr-2 h-5 w-5" />} Entrar na sala de teste
            </Button>
          )}
          {erro && <p className="mt-3 text-sm text-rose-600">{erro}</p>}
          <p className="mt-4 text-xs text-muted-foreground">O navegador vai pedir câmera e microfone: clique em Permitir.</p>
        </motion.div>
      </main>
    </div>
  )
}
