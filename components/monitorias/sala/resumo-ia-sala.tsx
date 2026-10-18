'use client'

/**
 * Resumo por IA dentro da sala:
 *  - no saguão, o monitor AUTORIZA (ou não) a transcrição da própria voz — sem
 *    decidir não entra; quem comprou vê o que vai acontecer com a voz dele;
 *  - durante a aula, o selo para todo mundo ("transcrevendo a voz de quem
 *    autorizou") e, para quem é gravado, o botão de pausar a própria voz.
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, Loader2, Pause, Play, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, CaixaErro } from '@/components/monitorias/base'
import type { EstadoDoGravador } from '@/lib/monitorias/sala/cliente/gravador'
import type { EstadoDoResumoNaSala } from '@/lib/monitorias/resumo/tipos'
import { cn } from '@/lib/utils'

/** Texto honesto sobre gravação, para o rodapé do saguão. */
export function textoDePrivacidade(resumo: EstadoDoResumoNaSala | null | undefined): string {
  if (!resumo?.ativo) return 'A aula não é gravada pela DomineAqui. Câmera e microfone só ficam ligados enquanto esta tela estiver aberta.'
  return resumo.individual
    ? 'O vídeo não é gravado. Nesta aula, o Resumo por IA transcreve a voz do monitor (se ele autorizar) e a do aluno que contratou; o áudio é apagado logo depois da transcrição.'
    : 'O vídeo não é gravado. Nesta aula, o Resumo por IA transcreve só a voz do monitor (se ele autorizar); o áudio é apagado logo depois da transcrição.'
}

/** Sem decidir, o monitor não entra (a decisão é dele e fica registrada). */
export function precisaAutorizar(resumo: EstadoDoResumoNaSala | null | undefined): boolean {
  return !!resumo?.ativo && resumo.papel === 'monitor' && resumo.consentimento === 'pendente'
}

export function AutorizacaoDoResumo({ reservaId, resumo, onDecidido }: { reservaId: string; resumo: EstadoDoResumoNaSala; onDecidido: (r: EstadoDoResumoNaSala | null) => void }) {
  const [enviando, setEnviando] = useState<'sim' | 'nao' | null>(null)
  const [erro, setErro] = useState('')

  async function decidir(aceito: boolean) {
    if (!aceito && !window.confirm('Recusar a transcrição? O aluno recebe de volta o valor do Resumo por IA e esta aula fica sem resumo. A decisão não pode ser desfeita.')) return
    setEnviando(aceito ? 'sim' : 'nao')
    setErro('')
    try {
      const r = await api<{ resumo: EstadoDoResumoNaSala | null }>(`/api/monitorias/reservas/${reservaId}/resumo/consentimento`, { method: 'POST', json: { aceito } })
      onDecidido(r.resumo)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para registrar agora.')
    } finally {
      setEnviando(null)
    }
  }

  if (resumo.papel === 'monitor' && resumo.consentimento === 'pendente') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/[0.10] to-card p-4 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Brain className="h-4 w-4 text-primary" aria-hidden /> O aluno contratou o Resumo por IA
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Para gerar o resumo, a <strong className="text-foreground">sua voz</strong> é gravada no seu navegador e enviada para transcrição pelo Google (Gemini).{' '}
          {resumo.individual ? 'A voz do aluno também.' : 'Em aula em grupo, só a sua voz é transcrita.'} O vídeo nunca é gravado, o áudio é apagado logo após a transcrição e o texto
          fica guardado só até o resumo sair. Você pode pausar a sua voz durante a aula. O valor do resumo é da plataforma e não muda o seu repasse.
        </p>
        {erro && <CaixaErro mensagem={erro} className="mt-2" />}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => void decidir(true)} disabled={!!enviando}>
            {enviando === 'sim' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Autorizo a transcrição
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => void decidir(false)} disabled={!!enviando}>
            {enviando === 'nao' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Não autorizo
          </Button>
        </div>
      </motion.div>
    )
  }
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
      <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span>
        {resumo.gravar
          ? resumo.papel === 'monitor'
            ? 'Resumo por IA: você autorizou. A sua voz será transcrita (dá para pausar lá dentro).'
            : 'Resumo por IA: a sua voz e a do monitor serão transcritas para o seu resumo (dá para pausar a sua lá dentro).'
          : resumo.papel === 'monitor'
            ? 'Resumo por IA: você não autorizou a transcrição nesta aula.'
            : 'Esta aula tem Resumo por IA: só a voz do monitor é transcrita. A sua não é gravada.'}
      </span>
    </div>
  )
}

/** O selo durante a aula. Quem é gravado pode pausar a própria voz. */
export function SeloDoResumo({ resumo, gravacao, onPausar, className }: { resumo: EstadoDoResumoNaSala | null; gravacao: EstadoDoGravador | null; onPausar: (sim: boolean) => void; className?: string }) {
  if (!resumo?.ativo) return null
  const gravando = !!gravacao && resumo.gravar
  const pausado = !!gravacao?.pausado
  const texto = gravando
    ? pausado
      ? 'Sua voz está pausada no resumo'
      : 'Resumo por IA: transcrevendo sua voz'
    : resumo.individual
      ? 'Resumo por IA: transcrevendo quem autorizou'
      : 'Resumo por IA: transcrevendo o monitor'
  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 py-1 pl-2.5 pr-1 text-[11px] font-medium text-white backdrop-blur-md', className)} role="status">
      <span className="relative flex h-2 w-2" aria-hidden>
        <AnimatePresence>
          {gravacao?.falando && !pausado && <motion.span initial={{ scale: 1, opacity: 0.7 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 1.2, repeat: Infinity }} className="absolute inset-0 rounded-full bg-rose-400" />}
        </AnimatePresence>
        <span className={cn('relative h-2 w-2 rounded-full', pausado ? 'bg-white/50' : 'bg-rose-500')} />
      </span>
      <Brain className="h-3.5 w-3.5 opacity-80" aria-hidden />
      <span className="max-w-[46vw] truncate">{texto}</span>
      {gravacao?.pendentes ? <span className="rounded-full bg-white/15 px-1.5 text-[10px]">{gravacao.pendentes} na fila</span> : null}
      {gravando ? (
        <button
          type="button"
          onClick={() => onPausar(!pausado)}
          className="ml-0.5 inline-flex h-6 items-center gap-1 rounded-full bg-white/15 px-2 text-[11px] font-semibold hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-pressed={pausado}
        >
          {pausado ? <Play className="h-3 w-3" aria-hidden /> : <Pause className="h-3 w-3" aria-hidden />}
          {pausado ? 'Retomar' : 'Pausar'}
        </button>
      ) : (
        <span className="w-1" />
      )}
    </div>
  )
}
