'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Check, VideoOff } from 'lucide-react'
import type { ControladorDaSala, EstadoDaSalaNaTela } from '@/lib/monitorias/sala/cliente/controlador'
import { EFEITOS_DE_VIDEO, EFEITOS_DE_VOZ, espelharPrevia } from '@/lib/monitorias/sala/cliente/efeitos'
import { cn } from '@/lib/utils'
import { VideoAoVivo } from './midia-ao-vivo'
import { TesteDeSom } from './teste-de-som'

/**
 * Efeitos de câmera e de voz: miniaturas para escolher, a prévia ao vivo e o
 * "ouça como fica". Tudo roda no aparelho; nada vai para o servidor.
 */
export function PainelDeEfeitos({ ctrl, estado, tema = 'claro', comPrevia = false }: { ctrl: ControladorDaSala; estado: EstadoDaSalaNaTela; tema?: 'claro' | 'escuro'; comPrevia?: boolean }) {
  const reduzir = useReducedMotion()
  const escuro = tema === 'escuro'
  const { efeitos, local } = estado
  const camLigada = local.cam === 'ligado'
  const micLigado = local.mic === 'ligado'
  const atualVideo = EFEITOS_DE_VIDEO.find((e) => e.id === efeitos.video)
  const atualVoz = EFEITOS_DE_VOZ.find((e) => e.id === efeitos.voz)
  const opcoesDeVideo = EFEITOS_DE_VIDEO.filter((e) => (e.id === 'desfoque' ? efeitos.desfoque || efeitos.video === 'desfoque' : e.id === 'nenhum' || efeitos.suportaVideo))
  const suave = escuro ? 'text-white/55' : 'text-muted-foreground'

  return (
    <div className="space-y-5">
      {comPrevia && (
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-900">
          {local.camera ? (
            <VideoAoVivo stream={local.camera} versao={local.versao} espelhar={espelharPrevia(efeitos.video)} rotulo="Prévia com efeito" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-white/60">
              <VideoOff className="h-6 w-6" aria-hidden /> Ligue a câmera para ver o efeito
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {atualVideo && atualVideo.id !== 'nenhum' && (
              <motion.span
                key={atualVideo.id}
                initial={reduzir ? false : { opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur"
              >
                {atualVideo.emoji} {atualVideo.rotulo}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}

      {efeitos.pesado && (
        <div className={cn('flex items-start gap-2 rounded-xl p-3 text-sm', escuro ? 'bg-amber-400/15 text-amber-100' : 'border border-amber-300/60 bg-amber-50 text-amber-900')} role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="font-semibold">Efeito pesado para este aparelho</p>
            <p className="mt-0.5 opacity-90">O seu vídeo está saindo travado. Desligar o efeito deixa a imagem fluida de novo.</p>
            <button type="button" onClick={() => ctrl.definirEfeitoDeVideo('nenhum')} className="mt-2 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300">
              Desligar efeito
            </button>
          </div>
        </div>
      )}

      <section aria-label="Efeitos de câmera">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className={cn('text-sm font-semibold', escuro && 'text-white')}>Câmera</h3>
          {!camLigada && <span className={cn('text-xs', suave)}>Vale quando a câmera ligar</span>}
        </div>
        <div className="grid grid-cols-3 gap-2 min-[420px]:grid-cols-4">
          {opcoesDeVideo.map((e, i) => {
            const ativo = efeitos.video === e.id
            return (
              <motion.button
                key={e.id}
                type="button"
                aria-pressed={ativo}
                onClick={() => ctrl.definirEfeitoDeVideo(e.id)}
                initial={reduzir ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.025 }}
                whileHover={reduzir ? undefined : { y: -2 }}
                whileTap={{ scale: 0.92 }}
                className={cn(
                  'group relative flex touch-manipulation flex-col items-center gap-1 rounded-xl p-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  ativo ? 'ring-2 ring-primary' : escuro ? 'hover:bg-white/5' : 'hover:bg-muted',
                )}
              >
                <span className={cn('flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-gradient-to-br text-2xl shadow-inner', e.cor)} aria-hidden>
                  <span className="transition-transform duration-200 group-hover:scale-110">{e.emoji}</span>
                </span>
                <span className={cn('line-clamp-1 text-[11px] font-medium leading-tight', escuro ? 'text-white/85' : '')}>{e.rotulo}</span>
                {ativo && (
                  <motion.span initial={reduzir ? false : { scale: 0 }} animate={{ scale: 1 }} className="absolute right-0.5 top-0.5 rounded-full bg-primary p-0.5 text-primary-foreground shadow" aria-hidden>
                    <Check className="h-3 w-3" />
                  </motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
        {!efeitos.suportaVideo && <p className={cn('mt-2 text-xs', suave)}>Este navegador não aplica filtros de câmera. No Chrome, Edge ou Safari atualizados eles aparecem aqui.</p>}
      </section>

      <section aria-label="Efeitos de voz">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className={cn('text-sm font-semibold', escuro && 'text-white')}>Voz</h3>
          {atualVoz && <span className={cn('text-xs', suave)}>{atualVoz.detalhe}</span>}
        </div>
        {efeitos.suportaVoz ? (
          <div className="flex flex-wrap gap-1.5">
            {EFEITOS_DE_VOZ.map((e) => {
              const ativo = efeitos.voz === e.id
              return (
                <motion.button
                  key={e.id}
                  type="button"
                  aria-pressed={ativo}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => ctrl.definirEfeitoDeVoz(e.id)}
                  className={cn(
                    'inline-flex h-9 touch-manipulation items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    ativo ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_hsl(var(--primary))]' : escuro ? 'bg-white/10 text-white hover:bg-white/15' : 'border border-border bg-background hover:bg-muted',
                  )}
                >
                  <span aria-hidden>{e.emoji}</span> {e.rotulo}
                </motion.button>
              )
            })}
          </div>
        ) : (
          <p className={cn('text-xs', suave)}>Este navegador não aplica efeitos de voz.</p>
        )}
        {efeitos.voz !== 'nenhum' && <p className={cn('mt-2 text-xs', suave)}>Todos na sala ouvem a sua voz com o efeito. Para falar normal, escolha &quot;Normal&quot;.</p>}
      </section>

      {efeitos.suportaVoz && <TesteDeSom trilha={local.audioComEfeito} micLigado={micLigado} saidaId={estado.prefs.saidaId} tema={tema} titulo="Ouça como fica" />}

      <p className={cn('text-xs leading-relaxed', suave)}>
        Os efeitos rodam no seu aparelho: nada é enviado para a DomineAqui. O filtro de câmera fica lembrado neste aparelho; o de voz vale até você fechar a aba.
      </p>
    </div>
  )
}
