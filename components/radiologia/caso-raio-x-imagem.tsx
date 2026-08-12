'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import { Columns2, Eye, EyeOff, Maximize2, Minimize2, Minus, Plus, RotateCcw } from 'lucide-react'
import type { ImagemCasoRaioX } from '@/lib/radiologia/casos-raio-x'

type Modo = 'limpa' | 'marcada' | 'comparar'

export function CasoRaioXImagem({ imagem, prioridade = false }: { imagem: ImagemCasoRaioX; prioridade?: boolean }) {
  const [modo, setModo] = useState<Modo>('limpa')
  const [zoom, setZoom] = useState(1)
  const [divisao, setDivisao] = useState(50)
  const [ampliada, setAmpliada] = useState(false)
  const tituloId = useId()

  const alterarZoom = useCallback((delta: number) => {
    setZoom((atual) => Math.min(3, Math.max(1, Number((atual + delta).toFixed(1)))))
  }, [])

  const resetar = useCallback(() => {
    setZoom(1)
    setDivisao(50)
  }, [])

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return
      if (evento.key.toLowerCase() === 'm') setModo((atual) => (atual === 'marcada' ? 'limpa' : 'marcada'))
      else if (evento.key === '+' || evento.key === '=') alterarZoom(0.25)
      else if (evento.key === '-') alterarZoom(-0.25)
      else if (evento.key === '0') resetar()
      else if (evento.key === 'Escape') setAmpliada(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [alterarZoom, resetar])

  useEffect(() => {
    if (!ampliada) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = anterior }
  }, [ampliada])

  const painel = (
    <section
      aria-labelledby={tituloId}
      className={`overflow-hidden border border-white/10 bg-neutral-950 text-white shadow-2xl ${
        ampliada ? 'flex h-full w-full flex-col rounded-none' : 'rounded-2xl'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
        <div className="min-w-0">
          <p className="font-clinical text-[9px] font-bold uppercase tracking-[0.18em] text-sky-300/70">
            Imagem {String(imagem.indice).padStart(2, '0')}
          </p>
          <h2 id={tituloId} className="truncate text-xs font-bold text-white/90 sm:text-sm">{imagem.titulo}</h2>
        </div>
        <div className="flex items-center gap-1" aria-label="Controles de ampliação">
          <Botao ariaLabel="Diminuir zoom" onClick={() => alterarZoom(-0.25)} disabled={zoom <= 1}><Minus /></Botao>
          <span className="w-11 text-center font-clinical text-[10px] text-white/55">{Math.round(zoom * 100)}%</span>
          <Botao ariaLabel="Aumentar zoom" onClick={() => alterarZoom(0.25)} disabled={zoom >= 3}><Plus /></Botao>
          <Botao ariaLabel="Restaurar visualização" onClick={resetar}><RotateCcw /></Botao>
          <Botao ariaLabel={ampliada ? 'Sair da tela ampliada' : 'Abrir tela ampliada'} onClick={() => setAmpliada((v) => !v)}>
            {ampliada ? <Minimize2 /> : <Maximize2 />}
          </Botao>
        </div>
      </div>

      <div className={`rx-rolagem relative overflow-auto bg-black ${ampliada ? 'min-h-0 flex-1' : 'max-h-[76vh]'}`}>
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            aspectRatio: `${imagem.largura} / ${imagem.altura}`,
            width: `${zoom * 100}%`,
            minWidth: zoom > 1 ? `${zoom * 100}%` : '100%',
          }}
          role="img"
          aria-label={`${imagem.titulo}. Visualização ${modo === 'limpa' ? 'sem marcações' : modo === 'marcada' ? 'com marcações' : 'comparativa'}.`}
        >
          <Camada imagem={imagem} marcada={modo === 'marcada'} prioridade={prioridade} />
          {modo === 'comparar' && (
            <div className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${divisao}%` }}>
              <Camada imagem={imagem} marcada largura={`${10000 / divisao}%`} />
              <span aria-hidden className="absolute inset-y-0 right-0 w-0.5 bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,.95)]" />
            </div>
          )}
          <span aria-hidden className="absolute left-2 top-2 rounded bg-black/65 px-2 py-1 font-clinical text-[9px] font-black uppercase tracking-widest text-white/75 backdrop-blur">
            {modo === 'limpa' ? 'Sem marcações' : modo === 'marcada' ? 'Com marcações' : 'Marcada | Limpa'}
          </span>
        </div>
      </div>

      {modo === 'comparar' && (
        <div className="border-t border-white/10 px-4 py-2.5">
          <label className="flex items-center gap-3 text-[11px] text-white/65">
            <span className="shrink-0">Marcada</span>
            <input
              type="range"
              min="8"
              max="92"
              value={divisao}
              onChange={(evento) => setDivisao(Number(evento.target.value))}
              className="h-8 min-w-0 flex-1 accent-sky-400"
              aria-label="Divisão entre imagem marcada e limpa"
            />
            <span className="shrink-0">Limpa</span>
          </label>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 border-t border-white/10 p-2" role="group" aria-label="Modo da imagem">
        <ModoBotao ativo={modo === 'limpa'} onClick={() => setModo('limpa')} icone={<EyeOff />} titulo="Sem marcações" />
        <ModoBotao ativo={modo === 'marcada'} onClick={() => setModo('marcada')} icone={<Eye />} titulo="Com marcações" />
        <ModoBotao ativo={modo === 'comparar'} onClick={() => setModo('comparar')} icone={<Columns2 />} titulo="Comparar" />
      </div>
      <p className="sr-only" aria-live="polite">Modo atual: {modo}. Zoom: {Math.round(zoom * 100)}%.</p>
    </section>
  )

  return ampliada ? <div className="fixed inset-0 z-[100] bg-black">{painel}</div> : painel
}

function Camada({ imagem, marcada, largura = '100%', prioridade = false }: { imagem: ImagemCasoRaioX; marcada: boolean; largura?: string; prioridade?: boolean }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-black bg-no-repeat"
      style={{
        width: largura,
        backgroundImage: `url("${imagem.sprite}")`,
        backgroundSize: '200% 100%',
        backgroundPosition: marcada ? '100% 0' : '0 0',
        imageRendering: 'auto',
        // Faz o navegador priorizar apenas a primeira imagem sem alterar o sprite.
        contentVisibility: prioridade ? 'visible' : 'auto',
      }}
    />
  )
}

function Botao({ ariaLabel, onClick, disabled = false, children }: { ariaLabel: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={ariaLabel} title={ariaLabel} onClick={onClick} disabled={disabled} className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25 [&_svg]:h-3.5 [&_svg]:w-3.5">
      {children}
    </button>
  )
}

function ModoBotao({ ativo, onClick, icone, titulo }: { ativo: boolean; onClick: () => void; icone: React.ReactNode; titulo: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-bold transition sm:text-xs [&_svg]:h-3.5 [&_svg]:w-3.5 ${
        ativo ? 'bg-sky-400/20 text-sky-200 ring-1 ring-sky-300/35' : 'text-white/50 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icone}{titulo}
    </button>
  )
}

/** Miniatura sem interação usada no catálogo; exibe somente o filme limpo. */
export function MiniaturaCasoRaioX({ imagem, className = '' }: { imagem: ImagemCasoRaioX; className?: string }) {
  return (
    <span
      role="img"
      aria-label={imagem.titulo}
      className={`block bg-black bg-no-repeat ${className}`}
      style={{ backgroundImage: `url("${imagem.sprite}")`, backgroundSize: '200% 100%', backgroundPosition: '0 0' }}
    />
  )
}
