'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CopyLinkBtn, type Folder } from './shared'

/**
 * Cartão de pasta. Agora é um `<Link>` de verdade em vez de um
 * `div role="button"`: o clique do meio abre em nova aba, o Next faz prefetch
 * da rota e a semântica de teclado vem de graça (não precisa mais do
 * `onKeyDown` manual de Enter/Espaço).
 *
 * O `onClick` intercepta a navegação normal para usar o cache em memória da
 * página, que é instantâneo — o href continua correto para todo o resto.
 *
 * `onPrefetch` é opcional: em /materiais entrar numa pasta não custa mais rede
 * nenhuma (o acervo inteiro já está em memória), então não há o que aquecer.
 */
export const FolderCard = memo(function FolderCard({
  folder,
  copiedId,
  onNavigate,
  onPrefetch,
  onCopyLink,
}: {
  folder: Folder
  copiedId: string | null
  onNavigate: () => void
  onPrefetch?: () => void
  onCopyLink: () => void
}) {
  const accent = folder.color || '#468152'

  return (
    <div className="deck-card-rise group relative h-full">
      <Link
        href={`/materiais?folder=${folder._id}`}
        onClick={e => {
          // Deixa passar clique do meio / com modificador para o comportamento
          // nativo do navegador (nova aba, nova janela).
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
          e.preventDefault()
          onNavigate()
        }}
        onMouseEnter={onPrefetch}
        onPointerEnter={onPrefetch}
        onFocus={onPrefetch}
        className="ios-cartao ios-toque flex h-full items-center gap-3 rounded-[18px] p-2 sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-[22px]"
        style={{ touchAction: 'manipulation' }}
      >
        {folder.coverImage ? (
          <div className="ios-capa relative h-12 w-12 shrink-0 rounded-[12px] sm:h-20 sm:w-full sm:rounded-[16px]">
            <Image
              src={folder.coverImage}
              alt=""
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
          </div>
        ) : (
          // A cor da pasta como vidro tingido, não como bloco chapado.
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] text-[24px] sm:h-20 sm:w-full sm:rounded-[16px] sm:text-[34px]"
            style={{
              background: `radial-gradient(120% 120% at 25% 15%, ${accent}40, ${accent}14 70%)`,
              boxShadow: `inset 0 0 0 1px ${accent}22`,
            }}
          >
            <span className="drop-shadow-sm">{folder.icon || '📁'}</span>
          </div>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:items-start sm:px-1.5 sm:pb-1 sm:pt-2.5">
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-[15px] font-semibold tracking-[-0.015em]">{folder.name}</h4>
            {folder.description && (
              <p className="ios-rotulo-2 mt-0.5 line-clamp-1 text-[13px] leading-snug sm:line-clamp-2 sm:text-[12px]">{folder.description}</p>
            )}
          </div>
          {/* Espaço do botão de compartilhar, que fica fora da âncora (botão
              dentro de link é HTML inválido). */}
          <span className="h-[34px] w-[34px] shrink-0" aria-hidden />
        </div>
      </Link>

      <CopyLinkBtn
        id={folder._id}
        copiedId={copiedId}
        onClick={e => { e.preventDefault(); e.stopPropagation(); onCopyLink() }}
        className="absolute right-2.5 top-[calc(50%-17px)] bg-transparent opacity-60 hover:opacity-100 focus-visible:opacity-100 sm:bottom-3 sm:right-3 sm:top-auto"
      />
    </div>
  )
})
