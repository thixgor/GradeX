'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageOff,
  Maximize2,
  Microscope,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import type { MidiaExibivel } from '@/lib/histopatologia/esquemas'
import { AVISO_DESCRICAO, podeIncorporar } from '@/lib/histopatologia/midia'
import { EXPLICACAO_DE_DIREITOS } from '@/lib/histopatologia/direitos'
import { MARCA_DE_DIREITOS } from './tema'

/**
 * Cartão de mídia histopatológica remota.
 *
 * ## A regra central do módulo vive nestas linhas
 *
 * Este componente **nunca** monta um elemento `<img>` a menos que
 * `podeIncorporar` seja verdadeiro — o que exige, ao mesmo tempo, estado
 * `autorizado-incorporacao` e uma URL presente no DTO. Como
 * `lib/histopatologia/midia.ts` remove a URL quando o estado não a autoriza, as
 * duas condições são redundantes de propósito: mesmo que alguém quebre uma
 * delas no futuro, a outra continua fechando o portão.
 *
 * Quando a incorporação é autorizada, o `src` é a **URL remota da instituição de
 * origem**, tal como catalogada. Não passa por `next/image`, não passa por
 * `/_next/image`, não passa por proxy nosso e não é buscada pelo servidor: o
 * navegador do aluno pede o arquivo diretamente a quem o publicou. Isso não é
 * uma otimização pendente — é a política do módulo. Otimizar exigiria baixar, e
 * baixar é exatamente o que está proibido.
 *
 * ## Layout reservado
 *
 * A proporção é fixada por CSS (`aspect-[4/3]`) antes de qualquer carregamento.
 * As imagens remotas não declaram dimensões no catálogo, e sem reserva de espaço
 * cada lâmina que chegasse empurraria o texto abaixo dela — o pior tipo de
 * deslocamento, porque acontece enquanto a pessoa lê.
 *
 * ## Erro
 *
 * Erro de carregamento é recuperável e explícito: o cartão troca a imagem por um
 * aviso com o link para a origem. Os atlas são servidores institucionais únicos,
 * sem CDN; ficarem fora do ar é evento esperado, não exceção.
 */

export interface ImagemRemotaProps {
  midia: MidiaExibivel
  /** `cartao` na galeria; `principal` na figura de destaque da doença. */
  variante?: 'cartao' | 'principal'
  /** Abre a mídia no visualizador interno da galeria. */
  onAbrir?: () => void
  nomeOriginal?: string
  secao?: string
  pontosDeObservacao?: string[]
}

export function ImagemHistopatologicaRemota({
  midia,
  variante = 'cartao',
  onAbrir,
  nomeOriginal,
  secao,
  pontosDeObservacao,
}: ImagemRemotaProps) {
  const [falhou, setFalhou] = useState(false)
  const marca = MARCA_DE_DIREITOS[midia.estadoDeDireitos]
  const incorporar = podeIncorporar(midia) && !falhou

  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div
        className={`relative w-full shrink-0 bg-muted/60 ${
          variante === 'principal' ? 'aspect-[16/9]' : 'aspect-[4/3]'
        }`}
      >
        {incorporar ? (
          /*
           * `<img>` nativo, deliberadamente.
           *
           * eslint-disable abaixo é intencional e documentado: `next/image`
           * roteia por `/_next/image`, que **busca o arquivo no servidor**,
           * transcodifica e o serve do nosso edge. Isso seria cópia e
           * reprocessamento de mídia de terceiros — proibido pela política do
           * módulo, independentemente de estado de direitos.
           */
          <button
            type="button"
            onClick={onAbrir}
            disabled={!onAbrir}
            className="group relative h-full min-h-[44px] w-full cursor-zoom-in overflow-hidden disabled:cursor-default"
            aria-label={onAbrir ? `Abrir ${midia.nomeCatalogado} no Domine Aqui` : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={midia.urlImagem}
              alt={midia.alt}
              loading="lazy"
              decoding="async"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none"
              onError={() => setFalhou(true)}
            />
            {onAbrir && (
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-1 text-[10px] font-bold text-white">
                <Maximize2 className="h-3 w-3" aria-hidden />
                Ampliar aqui
              </span>
            )}
          </button>
        ) : (
          <SemImagem
            estado={midia.estadoDeDireitos}
            falhou={falhou}
            descricao={midia.legendaEditorial ?? midia.descricao}
          />
        )}
      </div>

      <figcaption className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-muted-foreground">
            {midia.modalidade}
          </span>
          {midia.coloracao && midia.coloracao !== 'Não informado' && (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-muted-foreground">
              {midia.coloracao}
            </span>
          )}
          <span className={`rounded-full border px-2 py-0.5 ${marca.classe}`}>
            <span aria-hidden>{marca.simbolo}</span> {marca.rotulo}
          </span>
        </div>

        {/* Nome catalogado: texto puro, nunca HTML. */}
        <p className="text-xs font-semibold leading-snug">{midia.nomeCatalogado}</p>

        {nomeOriginal && (
          <p className="text-[10px] leading-relaxed text-muted-foreground" lang="en">
            Título na fonte: {nomeOriginal}
          </p>
        )}

        {midia.legendaEditorial ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{midia.legendaEditorial}</p>
        ) : (
          midia.descricao && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {midia.descricao}
              <span className="mt-1 block text-[10px] italic">{AVISO_DESCRICAO}</span>
            </p>
          )
        )}

        {pontosDeObservacao && pontosDeObservacao.length > 0 && (
          <div className="rounded-lg bg-muted/45 p-3">
            <p className="text-[11px] font-bold">
              Ao ampliar, procure{secao ? ` em ${secao.toLocaleLowerCase('pt-BR')}` : ''}:
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
              {pontosDeObservacao.map((ponto) => (
                <li key={ponto}>{ponto}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {incorporar && onAbrir && (
            <button
              type="button"
              onClick={onAbrir}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-teal-700 px-2.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-800"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              Abrir no Domine Aqui
            </button>
          )}
          <a
            href={midia.urlPaginaFonte}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[36px] items-center gap-1.5 px-1.5 text-[11px] font-semibold text-muted-foreground underline transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Fonte e crédito
            <span className="sr-only"> de {midia.nomeCatalogado}</span>
          </a>
          {midia.urlVisualizador && (
            <a
              href={midia.urlVisualizador}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11px] font-bold transition-colors hover:border-violet-600/50"
            >
              <Microscope className="h-3.5 w-3.5" aria-hidden />
              Abrir lâmina virtual
              <span className="sr-only"> de {midia.nomeCatalogado}</span>
            </a>
          )}
        </div>

        {/*
          Crédito por item, na mesma unidade visual da mídia. A página geral de
          créditos é complementar e não substitui isto — é exigência explícita de
          CREDITOS_E_DIREITOS.md.
        */}
        <p className="border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">
          Crédito: {midia.creditoCurto}
          {incorporar && <> · exibição remota no Domine Aqui</>}
        </p>
      </figcaption>
    </figure>
  )
}

interface VisualizadorDeLaminaProps {
  midia: MidiaExibivel
  onFechar: () => void
  onAnterior?: () => void
  onProxima?: () => void
  posicao?: string
}

/** Visualizador em tela cheia: a lâmina permanece na plataforma durante o estudo. */
export function VisualizadorDeLamina({
  midia,
  onFechar,
  onAnterior,
  onProxima,
  posicao,
}: VisualizadorDeLaminaProps) {
  const [falhou, setFalhou] = useState(false)
  const [zoom, setZoom] = useState(1)
  const url = midia.urlImagem

  useEffect(() => {
    setFalhou(false)
    setZoom(1)
  }, [midia.id])

  useEffect(() => {
    const aoPressionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onFechar()
      if (evento.key === 'ArrowLeft') onAnterior?.()
      if (evento.key === 'ArrowRight') onProxima?.()
    }
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', aoPressionar)
    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', aoPressionar)
    }
  }, [onAnterior, onFechar, onProxima])

  if (!podeIncorporar(midia) || !url) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Visualizador — ${midia.nomeCatalogado}`}
    >
      <button
        type="button"
        onClick={onFechar}
        className="absolute inset-0 min-h-[44px] w-full cursor-default"
        aria-label="Fechar visualizador"
      />

      <div className="relative z-10 flex max-h-full w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-white/15 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-white sm:px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{midia.nomeCatalogado}</p>
            <p className="text-[11px] text-zinc-400">
              {midia.modalidade}
              {midia.coloracao && midia.coloracao !== 'Não informado'
                ? ` · ${midia.coloracao}`
                : ''}
              {posicao ? ` · ${posicao}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom((valor) => Math.max(1, valor - 0.5))}
              disabled={zoom <= 1}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md border border-white/20 bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-35"
              aria-label="Reduzir ampliação"
            >
              <ZoomOut className="h-4 w-4" aria-hidden />
            </button>
            <span className="min-w-[48px] text-center text-[11px] font-bold" aria-live="polite">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((valor) => Math.min(4, valor + 0.5))}
              disabled={zoom >= 4}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md border border-white/20 bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-35"
              aria-label="Aumentar ampliação"
            >
              <ZoomIn className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="hidden min-h-[40px] min-w-[40px] items-center justify-center rounded-md border border-white/20 bg-white/10 transition-colors hover:bg-white/20 sm:inline-flex"
              aria-label="Restaurar ampliação"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onFechar}
              autoFocus
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md border border-white/20 bg-white/10 transition-colors hover:bg-white/20"
              aria-label="Fechar visualizador"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-auto bg-black">
          {falhou ? (
            <div className="p-10 text-center text-sm text-zinc-300">
              Não foi possível carregar esta lâmina agora.
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <div className="flex min-h-[76vh] min-w-full items-center justify-center p-2">
              <img
                src={url}
                alt={midia.alt}
                decoding="async"
                referrerPolicy="strict-origin-when-cross-origin"
                className="h-auto object-contain"
                style={
                  zoom === 1
                    ? { maxHeight: '76vh', maxWidth: '100%', width: 'auto' }
                    : { maxWidth: 'none', width: `${zoom * 100}%` }
                }
                onError={() => setFalhou(true)}
              />
            </div>
          )}

          {onAnterior && (
            <button
              type="button"
              onClick={onAnterior}
              className="absolute left-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90"
              aria-label="Lâmina anterior"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
          )}
          {onProxima && (
            <button
              type="button"
              onClick={onProxima}
              className="absolute right-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90"
              aria-label="Próxima lâmina"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-2 text-[11px] text-zinc-400 sm:px-4">
          <span>Crédito: {midia.creditoCurto}</span>
          <a
            href={midia.urlPaginaFonte}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[36px] items-center gap-1.5 underline hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Consultar fonte
          </a>
        </footer>
      </div>
    </div>
  )
}

function SemImagem({
  estado,
  falhou,
  descricao,
}: {
  estado: MidiaExibivel['estadoDeDireitos']
  falhou: boolean
  descricao: string
}) {
  if (falhou) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
        role="status"
      >
        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
        <p className="text-xs font-semibold">A imagem não carregou</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          O servidor da coleção não respondeu. Tente novamente ou consulte o link de crédito.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
      <ImageOff className="h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {EXPLICACAO_DE_DIREITOS[estado]}
      </p>
      {descricao && (
        <p className="line-clamp-3 text-[11px] italic leading-relaxed text-muted-foreground">
          {descricao}
        </p>
      )}
    </div>
  )
}
