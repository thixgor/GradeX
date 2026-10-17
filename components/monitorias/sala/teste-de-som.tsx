'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Ear, Headphones, Loader2, Mic, Volume2 } from 'lucide-react'
import { gravarTrecho, podeGravar, tocar, toqueDeTeste } from '@/lib/monitorias/sala/cliente/teste-de-som'
import { cn } from '@/lib/utils'

const GRAVACAO_MS = 4_000

/**
 * "Será que estão me ouvindo?" — três testes, todos locais:
 * gravar 4 s e ouvir de volta (seguro, sem microfonia), ouvir ao vivo (com
 * fone) e um toque para conferir o alto-falante.
 */
export function TesteDeSom({ trilha, micLigado, saidaId, tema = 'claro' }: { trilha: MediaStreamTrack | null; micLigado: boolean; saidaId: string | null; tema?: 'claro' | 'escuro' }) {
  const [fase, setFase] = useState<'parado' | 'gravando' | 'tocando'>('parado')
  const [aoVivo, setAoVivo] = useState(false)
  const [aviso, setAviso] = useState('')
  const parar = useRef<(() => void) | null>(null)
  const espelho = useRef<HTMLAudioElement>(null)
  const escuro = tema === 'escuro'
  const semMicrofone = !trilha || !micLigado

  // Ao vivo: o próprio microfone no alto-falante (só com fone, senão microfonia).
  useEffect(() => {
    const a = espelho.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null
    if (!a) return
    if (aoVivo && trilha && micLigado) {
      a.srcObject = new MediaStream([trilha])
      if (saidaId && a.setSinkId) void a.setSinkId(saidaId).catch(() => {})
      void a.play().catch(() => setAoVivo(false))
    } else {
      a.pause()
      a.srcObject = null
    }
  }, [aoVivo, trilha, micLigado, saidaId])
  useEffect(() => () => parar.current?.(), [])
  useEffect(() => {
    if (semMicrofone) setAoVivo(false)
  }, [semMicrofone])

  async function gravarEOuvir() {
    if (!trilha || fase !== 'parado') return
    setAviso('')
    setAoVivo(false)
    setFase('gravando')
    const blob = await gravarTrecho(trilha, GRAVACAO_MS)
    if (!blob) {
      setFase('parado')
      return setAviso('Este navegador não grava áudio. Use "Ouvir ao vivo" com fone.')
    }
    setFase('tocando')
    parar.current = await tocar(blob, saidaId, () => setFase('parado'))
  }

  const botao = cn(
    'inline-flex h-10 touch-manipulation items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium transition disabled:opacity-50',
    escuro ? 'bg-white/10 text-white hover:bg-white/15' : 'border border-border bg-background hover:bg-muted',
  )

  return (
    <div className={cn('rounded-2xl p-3.5', escuro ? 'bg-white/5' : 'border border-border bg-card')}>
      <p className={cn('mb-2 flex items-center gap-1.5 text-sm font-semibold', escuro ? 'text-white' : '')}>
        <Ear className="h-4 w-4 text-primary" aria-hidden /> Teste de som
      </p>
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
        {podeGravar() && (
          <button type="button" className={cn(botao, 'relative overflow-hidden')} disabled={semMicrofone || fase !== 'parado'} onClick={() => void gravarEOuvir()}>
            {fase === 'gravando' && (
              <motion.span
                className="absolute inset-y-0 left-0 bg-primary/25"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: GRAVACAO_MS / 1000, ease: 'linear' }}
                aria-hidden
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {fase === 'gravando' ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" aria-hidden /> Fale algo…
                </>
              ) : fase === 'tocando' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Tocando
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" aria-hidden /> Gravar e ouvir
                </>
              )}
            </span>
          </button>
        )}
        <button type="button" className={cn(botao, aoVivo && 'bg-primary text-primary-foreground hover:bg-primary/90')} aria-pressed={aoVivo} disabled={semMicrofone} onClick={() => setAoVivo((v) => !v)}>
          <Headphones className="h-4 w-4" aria-hidden /> {aoVivo ? 'Parar de ouvir' : 'Ouvir ao vivo'}
        </button>
        <button type="button" className={botao} onClick={() => void tocar(toqueDeTeste(), saidaId)}>
          <Volume2 className="h-4 w-4" aria-hidden /> Testar o som
        </button>
      </div>
      <p className={cn('mt-2 text-xs leading-relaxed', escuro ? 'text-white/55' : 'text-muted-foreground')} aria-live="polite">
        {aviso ||
          (semMicrofone
            ? 'Ligue o microfone para testar a sua voz.'
            : aoVivo
              ? 'Use fone de ouvido: sem fone, o som do alto-falante volta para o microfone (microfonia).'
              : '"Gravar e ouvir" grava 4 segundos e toca de volta: é como os outros vão te ouvir.')}
      </p>
      <audio ref={espelho} className="hidden" />
    </div>
  )
}
