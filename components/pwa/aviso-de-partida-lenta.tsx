'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, WifiOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Aviso que aparece quando a abertura do app demora demais.
 *
 * Enquanto o `useBootstrap` não responde, o AppShell mostra o esqueleto — que
 * é a coisa certa nos dois primeiros segundos e a coisa errada no décimo. Um
 * molde cinza parado, sem uma palavra, é exatamente a tela que faz a pessoa
 * achar que travou (e que ela fecha o app antes de a resposta chegar). Aqui a
 * espera passa a falar: depois de alguns segundos dizemos que ainda estamos
 * carregando, se o aparelho estiver sem rede dizemos isso em vez de fingir que
 * está tudo bem, e existe um botão para tentar de novo sem precisar matar o
 * app e abrir de novo.
 *
 * Fica sobre o esqueleto, não no lugar dele: se a resposta chegar no meio do
 * caminho, o conteúdo real já está montado atrás e a troca é imediata.
 */

/** Antes disso, esperar é normal e um aviso só criaria ansiedade à toa. */
const MS_ATE_AVISAR = 5500
/** A partir daqui a espera deixou de ser "lenta" e virou "provavelmente travou". */
const MS_ATE_INSISTIR = 14000

export function AvisoDePartidaLenta({
  onRetry,
  retrying = false,
}: {
  onRetry: () => void
  retrying?: boolean
}) {
  const [fase, setFase] = useState<'oculto' | 'lento' | 'travado'>('oculto')
  const [semRede, setSemRede] = useState(false)

  useEffect(() => {
    const lento = setTimeout(() => setFase('lento'), MS_ATE_AVISAR)
    const travado = setTimeout(() => setFase('travado'), MS_ATE_INSISTIR)
    return () => {
      clearTimeout(lento)
      clearTimeout(travado)
    }
  }, [])

  useEffect(() => {
    const atualizar = () => setSemRede(typeof navigator !== 'undefined' && !navigator.onLine)
    atualizar()
    window.addEventListener('online', atualizar)
    window.addEventListener('offline', atualizar)
    return () => {
      window.removeEventListener('online', atualizar)
      window.removeEventListener('offline', atualizar)
    }
  }, [])

  if (fase === 'oculto') return null

  const titulo = semRede
    ? 'Sem conexão no momento'
    : fase === 'travado'
      ? 'Ainda tentando abrir'
      : 'Carregando seus dados'

  const texto = semRede
    ? 'O aparelho está sem internet. Assim que a rede voltar, é só tentar de novo — nada do seu progresso se perde.'
    : fase === 'travado'
      ? 'A conexão está bem lenta agora. Você pode tentar de novo sem fechar o app.'
      : 'Está demorando um pouco mais que o normal por causa da conexão. Já estamos nisso.'

  // `pwa-safe-bottom` usa `!important` para reservar a margem do indicador de
  // home do iPhone, então o respiro do card vem de `mb-4` (margem) — um
  // padding no mesmo elemento seria sobrescrito e o card encostaria na borda.
  return (
    <div
      role="status"
      aria-live="polite"
      className="pwa-safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4"
    >
      <div className="pointer-events-auto mb-4 w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div
            className={
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ' +
              (semRede ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary')
            }
            aria-hidden
          >
            {semRede ? (
              <WifiOff className="h-4 w-4" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold">{titulo}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{texto}</p>
          </div>
        </div>

        {/* O botão só entra na fase em que ele resolve alguma coisa: nos
            primeiros segundos, mandar recarregar é pedir para a pessoa
            atrapalhar uma requisição que já está a caminho. */}
        {(fase === 'travado' || semRede) && (
          <Button
            onClick={onRetry}
            disabled={retrying}
            size="sm"
            variant="outline"
            className="mt-3 w-full rounded-lg"
          >
            <RefreshCw className={'mr-2 h-4 w-4' + (retrying ? ' animate-spin' : '')} />
            {retrying ? 'Tentando...' : 'Tentar de novo'}
          </Button>
        )}
      </div>
    </div>
  )
}
