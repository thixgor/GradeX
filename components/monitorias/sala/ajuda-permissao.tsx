'use client'

import { useMemo } from 'react'
import { Lock, RotateCw } from 'lucide-react'
import type { EstadoDoAparelho } from '@/lib/monitorias/sala/cliente/midia'

type Plataforma = 'ios' | 'android' | 'safari' | 'firefox' | 'chromium'

function detectar(): Plataforma {
  if (typeof navigator === 'undefined') return 'chromium'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return 'safari'
  return 'chromium'
}

const PASSOS: Record<Plataforma, string[]> = {
  chromium: ['Clique no cadeado ao lado do endereço do site.', 'Em "Câmera" e "Microfone", escolha "Permitir".', 'Toque em "Tentar de novo" abaixo.'],
  firefox: ['Clique no ícone de câmera riscada ao lado do endereço.', 'Remova o bloqueio de câmera e microfone.', 'Toque em "Tentar de novo" abaixo.'],
  safari: ['No menu Safari, abra "Ajustes para este site".', 'Em "Câmera" e "Microfone", escolha "Permitir".', 'Toque em "Tentar de novo" abaixo.'],
  ios: ['Toque em "aA" na barra de endereço e depois em "Ajustes do Site".', 'Permita "Câmera" e "Microfone".', 'Se não aparecer: Ajustes do iPhone, Safari, Câmera e Microfone, "Permitir".'],
  android: ['Toque no cadeado ao lado do endereço e depois em "Permissões".', 'Permita "Câmera" e "Microfone".', 'Toque em "Tentar de novo" abaixo.'],
}

/** O que fazer quando câmera ou microfone não abrem, em português e sem termo técnico. */
export function AjudaDeAparelho({ mic, cam }: { mic: EstadoDoAparelho; cam: EstadoDoAparelho }) {
  const plataforma = useMemo(detectar, [])
  if (mic === 'pagina' || cam === 'pagina') {
    return (
      <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200" role="alert">
        <p className="flex items-center gap-1.5 font-semibold">
          <RotateCw className="h-4 w-4" aria-hidden /> Recarregue a página para liberar {mic === 'pagina' && cam === 'pagina' ? 'a câmera e o microfone' : mic === 'pagina' ? 'o microfone' : 'a câmera'}
        </p>
        <p className="mt-1">Não é bloqueio seu: a página abriu sem a liberação. Toque em &quot;Recarregar a página&quot; abaixo.</p>
      </div>
    )
  }
  if (mic === 'negado' || cam === 'negado') {
    return (
      <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200" role="alert">
        <p className="flex items-center gap-1.5 font-semibold">
          <Lock className="h-4 w-4" aria-hidden /> {mic === 'negado' && cam === 'negado' ? 'Câmera e microfone bloqueados' : mic === 'negado' ? 'Microfone bloqueado' : 'Câmera bloqueada'}
        </p>
        <ol className="mt-1.5 list-decimal space-y-0.5 pl-5">
          {PASSOS[plataforma].map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        <p className="mt-1.5 text-xs opacity-90">Você também pode entrar sem eles e ligar depois.</p>
      </div>
    )
  }
  const emUso = mic === 'em_uso' || cam === 'em_uso'
  const falta = mic === 'indisponivel' || cam === 'indisponivel'
  if (!emUso && !falta && mic !== 'erro' && cam !== 'erro') return null
  return (
    <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200" role="alert">
      {emUso ? (
        <>
          <p className="font-semibold">{cam === 'em_uso' ? 'A câmera' : 'O microfone'} está ocupado</p>
          <p className="mt-0.5">Feche Meet, Zoom, WhatsApp ou outra aba que esteja usando e toque em &quot;Tentar de novo&quot;.</p>
        </>
      ) : falta ? (
        <>
          <p className="font-semibold">{mic === 'indisponivel' && cam === 'indisponivel' ? 'Nenhuma câmera ou microfone encontrado' : mic === 'indisponivel' ? 'Nenhum microfone encontrado' : 'Nenhuma câmera encontrada'}</p>
          <p className="mt-0.5">Conecte um aparelho ou entre assim mesmo: dá para participar só ouvindo ou só com áudio.</p>
        </>
      ) : (
        <p>Não foi possível abrir a câmera ou o microfone. Toque em &quot;Tentar de novo&quot;.</p>
      )}
    </div>
  )
}
