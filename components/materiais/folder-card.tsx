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
  onPrefetch: () => void
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
        className="surface-lift block h-full overflow-hidden rounded-xl border border-border bg-card p-3 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:p-4"
        style={{ touchAction: 'manipulation' }}
      >
        {folder.coverImage ? (
          <div className="relative mb-3 h-16 w-full overflow-hidden rounded-md">
            <Image
              src={folder.coverImage}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
          </div>
        ) : (
          <div
            className="mb-3 flex h-16 w-full items-center justify-center rounded-md text-3xl"
            style={{ backgroundColor: `${accent}1f` }}
          >
            {folder.icon || '📁'}
          </div>
        )}
        <h4 className="truncate font-heading text-sm font-semibold tracking-[-0.01em] text-foreground">{folder.name}</h4>
        {folder.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed tracking-[0.005em] text-muted-foreground">{folder.description}</p>
        )}
        {/* Espaço reservado para o botão de compartilhar, que fica fora da
            âncora (botão dentro de link é HTML inválido). */}
        <div className="h-7" aria-hidden />
      </Link>

      <CopyLinkBtn
        id={folder._id}
        copiedId={copiedId}
        onClick={e => { e.preventDefault(); e.stopPropagation(); onCopyLink() }}
        className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4"
      />
    </div>
  )
})
