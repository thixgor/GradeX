'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

/**
 * Botão da página offline.
 *
 * É um link de verdade (`<a href="/">`), não um `<button>`, por um motivo
 * concreto: offline, o chunk de JS desta página pode não estar no cache e a
 * hidratação simplesmente não acontece. Um `<button>` viraria enfeite morto;
 * um link continua navegando (e, se ainda não houver rede, o service worker
 * devolve esta mesma tela — nada quebra).
 *
 * Com o JS vivo, ele ganha duas melhorias: recarrega no lugar de navegar e,
 * principalmente, escuta o evento `online` — quando o sinal volta, a página se
 * recarrega sozinha, em vez de esperar o usuário adivinhar que precisa tocar
 * em algo.
 */
export function BotaoTentarNovamente() {
  const [online, setOnline] = useState(true)
  const [hidratado, setHidratado] = useState(false)

  useEffect(() => {
    setHidratado(true)
    setOnline(navigator.onLine)
    const voltou = () => {
      setOnline(true)
      window.location.reload()
    }
    const caiu = () => setOnline(false)
    window.addEventListener('online', voltou)
    window.addEventListener('offline', caiu)
    return () => {
      window.removeEventListener('online', voltou)
      window.removeEventListener('offline', caiu)
    }
  }, [])

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault()
          window.location.reload()
        }}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition active:scale-95"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={2.6} />
        Tentar de novo
      </a>

      {hidratado && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {online ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              Conexão de volta — recarregando…
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              Sem conexão. Assim que voltar, a página abre sozinha.
            </>
          )}
        </p>
      )}
    </div>
  )
}
