'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Cloud,
  Fingerprint,
  FileDown,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ───────────────────────────────────────────────────
export type DownloadStepId = 'auth' | 'fetch' | 'watermark' | 'ready'

export interface PdfDownloadState {
  step: DownloadStepId | null
  status: 'idle' | 'running' | 'success' | 'error'
  error?: string
  errorStep?: DownloadStepId
}

export const INITIAL_DOWNLOAD_STATE: PdfDownloadState = {
  step: null,
  status: 'idle',
}

// ─── Step metadata ───────────────────────────────────────────
interface StepMeta {
  id: DownloadStepId
  label: string
  sub: string
  icon: React.ReactNode
}

const STEPS: StepMeta[] = [
  {
    id: 'auth',
    label: 'Verificando acesso',
    sub: 'Validando suas permissões',
    icon: <Shield className="h-3.5 w-3.5" />,
  },
  {
    id: 'fetch',
    label: 'Buscando documento',
    sub: 'Recuperando do armazenamento seguro',
    icon: <Cloud className="h-3.5 w-3.5" />,
  },
  {
    id: 'watermark',
    label: 'Personalizando PDF',
    sub: 'Aplicando marca d\'água exclusiva',
    icon: <Fingerprint className="h-3.5 w-3.5" />,
  },
  {
    id: 'ready',
    label: 'Iniciando download',
    sub: 'Gerando arquivo para você',
    icon: <FileDown className="h-3.5 w-3.5" />,
  },
]

const STEP_ORDER: DownloadStepId[] = ['auth', 'fetch', 'watermark', 'ready']

type StepStatus = 'pending' | 'active' | 'done' | 'error'

function resolveStepStatus(
  stepId: DownloadStepId,
  currentStep: DownloadStepId | null,
  overallStatus: PdfDownloadState['status'],
  errorStep?: DownloadStepId,
): StepStatus {
  if (!currentStep) return 'pending'
  const stepIdx = STEP_ORDER.indexOf(stepId)
  const currentIdx = STEP_ORDER.indexOf(currentStep)

  if (overallStatus === 'error' && stepId === errorStep) return 'error'
  if (overallStatus === 'error' && stepIdx > STEP_ORDER.indexOf(errorStep ?? 'auth')) return 'pending'
  if (overallStatus === 'success') return 'done'
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

function computeProgress(step: DownloadStepId | null, status: PdfDownloadState['status']): number {
  if (!step || status === 'idle') return 0
  if (status === 'success') return 100
  if (status === 'error') {
    const map: Record<DownloadStepId, number> = { auth: 10, fetch: 35, watermark: 65, ready: 88 }
    return map[step] ?? 0
  }
  const map: Record<DownloadStepId, number> = { auth: 15, fetch: 42, watermark: 76, ready: 92 }
  return map[step] ?? 0
}

// ─── Component ───────────────────────────────────────────────
interface PdfDownloadProgressProps {
  materialTitle: string
  state: PdfDownloadState
  onRetry: () => void
  onClose: () => void
}

export function PdfDownloadProgress({
  materialTitle,
  state,
  onRetry,
  onClose,
}: PdfDownloadProgressProps) {
  const { step, status, error, errorStep } = state
  const progress = computeProgress(step, status)
  const isActive = status !== 'idle'

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="pdf-download-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/55 backdrop-blur-[6px]"
          onClick={status === 'error' || status === 'success' ? onClose : undefined}
        >
          <motion.div
            key="pdf-download-card"
            initial={{ scale: 0.93, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/50 bg-background/97 shadow-2xl backdrop-blur-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Accent line top */}
            <div
              className={`absolute inset-x-0 top-0 h-[2px] transition-all duration-700 ${
                status === 'success'
                  ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
                  : status === 'error'
                  ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-primary to-transparent'
              }`}
            />

            {/* Header */}
            <div className="flex items-start gap-3 px-5 pt-5 pb-4">
              <div
                className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                  status === 'success'
                    ? 'bg-emerald-500/12 text-emerald-500'
                    : status === 'error'
                    ? 'bg-red-500/12 text-red-500'
                    : 'bg-primary/12 text-primary'
                }`}
              >
                {status === 'success' ? (
                  <Check className="h-5 w-5" />
                ) : status === 'error' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <FileDown className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  {status === 'success'
                    ? 'Download concluído'
                    : status === 'error'
                    ? 'Falha no download'
                    : 'Preparando download'}
                </p>
                <p className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
                  {materialTitle}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-border/40 mb-4" />

            {/* Steps list */}
            <div className="px-5 pb-4 space-y-3">
              {STEPS.map(s => {
                const ss = resolveStepStatus(s.id, step, status, errorStep)
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    {/* Circle indicator */}
                    <div
                      className={`h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        ss === 'done'
                          ? 'bg-emerald-500/13 text-emerald-500'
                          : ss === 'active'
                          ? 'bg-primary/13 text-primary'
                          : ss === 'error'
                          ? 'bg-red-500/13 text-red-500'
                          : 'bg-muted/40 text-muted-foreground/35'
                      }`}
                    >
                      {ss === 'done' && <Check className="h-3.5 w-3.5" />}
                      {ss === 'active' && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {ss === 'error' && <X className="h-3.5 w-3.5" />}
                      {ss === 'pending' && s.icon}
                    </div>

                    {/* Label */}
                    <div
                      className={`min-w-0 flex-1 transition-opacity duration-300 ${
                        ss === 'pending' ? 'opacity-35' : 'opacity-100'
                      }`}
                    >
                      <p
                        className={`text-sm font-medium leading-none ${
                          ss === 'error' ? 'text-red-500' : ''
                        }`}
                      >
                        {s.label}
                      </p>
                      {ss === 'active' && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-[11px] text-muted-foreground mt-0.5 overflow-hidden"
                        >
                          {s.sub}
                        </motion.p>
                      )}
                    </div>

                    {/* Right status */}
                    <div className="flex-shrink-0 text-[10px] font-medium">
                      {ss === 'done' && (
                        <span className="text-emerald-500">✓</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-3">
              <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-colors duration-500 ${
                    status === 'error'
                      ? 'bg-red-500'
                      : status === 'success'
                      ? 'bg-emerald-500'
                      : 'bg-primary'
                  }`}
                  initial={{ width: '4%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <p className="text-[10px] text-muted-foreground/70">
                  {status === 'error'
                    ? 'Interrompido'
                    : status === 'success'
                    ? 'Arquivo salvo'
                    : 'Processando…'}
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground">
                  {progress}%
                </p>
              </div>
            </div>

            {/* Error detail */}
            {status === 'error' && error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/6 px-3 py-2.5"
              >
                <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                  {error}
                </p>
              </motion.div>
            )}

            {/* Footer actions */}
            {(status === 'error' || status === 'success') && (
              <div className="flex gap-2 px-5 pb-5">
                {status === 'error' && (
                  <Button
                    onClick={onRetry}
                    size="sm"
                    className="flex-1 h-9 rounded-2xl bg-primary text-white font-semibold shadow-lg shadow-primary/20"
                  >
                    Tentar novamente
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  size="sm"
                  variant={status === 'error' ? 'outline' : undefined}
                  className={
                    status === 'success'
                      ? 'flex-1 h-9 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20'
                      : 'h-9 rounded-2xl'
                  }
                >
                  {status === 'success' ? 'Perfeito!' : 'Fechar'}
                </Button>
              </div>
            )}

            {/* Running hint */}
            {status === 'running' && (
              <p className="pb-4 text-center text-[10px] text-muted-foreground/50">
                Não feche esta janela durante o processamento
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
