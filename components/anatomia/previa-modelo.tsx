'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, RotateCw } from 'lucide-react'
import { embedUrl } from '@/lib/anatomia-3d/modelos'

/**
 * Capa dos cards de Anatomia 3D.
 *
 * Antes, toda capa era o mesmo ícone sobre um gradiente: cem cards com a mesma
 * cara, e a peça só aparecia depois de abrir o modelo. Agora a capa mostra a
 * miniatura oficial do próprio modelo (buscada pela rota `/api/anatomia/previas`)
 * e, no desktop, o modelo começa a girar de verdade quando o ponteiro para
 * sobre o card — um embed leve, montado só no card sob o cursor e desmontado ao
 * sair.
 *
 * O gradiente continua existindo como fundo e como plano B: se a miniatura não
 * vier, o card não fica quebrado, fica como era antes.
 */

export interface PreviaModeloProps {
  titulo: string
  sketchfabId: string | null
  miniatura?: string
  /** Classes do gradiente da categoria, usadas como fundo e como fallback. */
  gradiente: string
  corIcone: string
  fundoIcone: string
  /** Ícone da categoria, exibido quando não há miniatura. */
  icone: React.ComponentType<{ className?: string }>
  /** Ativa o embed ao vivo no hover (apenas em ponteiro fino). */
  giroAoPassar?: boolean
  prioridade?: boolean
}

export function PreviaModelo({
  titulo,
  sketchfabId,
  miniatura,
  gradiente,
  corIcone,
  fundoIcone,
  icone: Icone,
  giroAoPassar = true,
  prioridade,
}: PreviaModeloProps) {
  const [aoVivo, setAoVivo] = useState(false)
  const [falhou, setFalhou] = useState(false)
  const temporizador = useRef<number | null>(null)

  useEffect(() => () => { if (temporizador.current) window.clearTimeout(temporizador.current) }, [])

  function entrou() {
    if (!giroAoPassar || !sketchfabId) return
    // Só em quem tem mouse: no toque, "hover" é o próprio clique, e carregar um
    // embed a cada toque atrapalharia a navegação.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    temporizador.current = window.setTimeout(() => setAoVivo(true), 420)
  }

  function saiu() {
    if (temporizador.current) window.clearTimeout(temporizador.current)
    setAoVivo(false)
  }

  const embed = embedUrl(sketchfabId)
  const temMiniatura = Boolean(miniatura) && !falhou

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950"
      onMouseEnter={entrou}
      onMouseLeave={saiu}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradiente}`} aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:16px_16px]"
        aria-hidden
      />

      {temMiniatura ? (
        // eslint-disable-next-line @next/next/no-img-element -- a miniatura vem da CDN do Sketchfab, fora dos domínios configurados no next/image
        <img
          src={miniatura}
          alt={`Prévia do modelo 3D: ${titulo}`}
          loading={prioridade ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFalhou(true)}
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
            aoVivo ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`rounded-2xl border border-white/10 ${fundoIcone} p-5 backdrop-blur-sm transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110`}
          >
            {sketchfabId ? <Icone className={`h-10 w-10 ${corIcone}`} /> : <Box className="h-10 w-10 text-white/40" />}
          </div>
        </div>
      )}

      {aoVivo && embed && (
        <iframe
          title={`Prévia 3D de ${titulo}`}
          src={`${embed}?autostart=1&autospin=0.4&ui_infos=0&ui_controls=0&ui_watermark=0&ui_stop=0&ui_hint=0&transparent=1&dnt=1`}
          allow="autoplay; xr-spatial-tracking"
          className="pointer-events-none absolute inset-0 h-full w-full"
          loading="lazy"
        />
      )}

      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/90 backdrop-blur">
        <RotateCw className={`h-3 w-3 ${aoVivo ? 'animate-spin' : ''}`} /> 3D
      </span>
    </div>
  )
}

/**
 * Carrega o mapa `uid → miniatura` uma vez por página. Falha em silêncio: sem
 * miniatura o card volta ao gradiente, e nada quebra.
 */
export function useMiniaturas(uids: Array<string | null>) {
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({})
  const chave = uids.filter(Boolean).join(',')

  useEffect(() => {
    if (!chave) return
    let ativo = true
    const controlador = new AbortController()

    // Acima de algumas dezenas de modelos a lista de uids estouraria a URL — e a
    // rota já sabe devolver o catálogo inteiro quando não recebe filtro.
    const lista = chave.split(',')
    const alvo = lista.length > 40 ? '/api/anatomia/previas' : `/api/anatomia/previas?uids=${encodeURIComponent(chave)}`

    fetch(alvo, { signal: controlador.signal })
      .then(resposta => (resposta.ok ? resposta.json() : null))
      .then(dados => {
        if (ativo && dados?.miniaturas) setMiniaturas(dados.miniaturas)
      })
      .catch(() => undefined)

    return () => {
      ativo = false
      controlador.abort()
    }
  }, [chave])

  return miniaturas
}
