'use client'

import { Maximize2 } from 'lucide-react'
import {
  type ImagemDeQuestao,
  type LayoutDeImagens,
  distribuirEmLinhas,
  tamanhoDaImagem,
} from '@/lib/questoes/imagens'
import { cn } from '@/lib/utils'

/**
 * As imagens de uma questão, desenhadas do mesmo jeito em toda a plataforma.
 *
 * ## O que ele garante que seis cópias não garantiam
 *
 * A prova (nos dois modos de navegação), a prévia do admin, o Banco de Questões,
 * a lista do Banco e a amostra pública desenhavam cada uma o seu `<img>`. Eram
 * seis regras de tamanho diferentes para a mesma imagem — e nenhuma delas
 * respeitava tamanho configurado, porque não havia como configurar.
 *
 * ## O tamanho e as telas
 *
 * O tamanho é uma porcentagem da largura do bloco (ver `lib/questoes/imagens.ts`),
 * e ela só vale **a partir do `sm`**. No celular toda imagem ocupa a largura
 * inteira e as linhas se desfazem: 35% de uma tela de 360px é uma miniatura
 * ilegível, e "uma do lado da outra" em duas colunas de 170px é pior ainda do
 * que empilhar. Do tablet para cima o layout escolhido vale como escrito.
 *
 * A altura tem um teto (`max-h-[70vh]`) para que uma imagem muito alta não
 * empurre o enunciado inteiro para fora da tela — o toque para ampliar existe
 * exatamente para esse caso.
 */
export function ImagensDaQuestao({
  imagens,
  layout = 'empilhado',
  onAmpliar,
  className,
  alt = 'Imagem da questão',
  compacto = false,
}: {
  imagens: ImagemDeQuestao[]
  layout?: LayoutDeImagens
  /** Ausente = a imagem não amplia (prévia pequena, cartão de listagem). */
  onAmpliar?: (url: string) => void
  className?: string
  alt?: string
  /** Sem a dica de "ampliar" e com respiro menor — para cartões e prévias. */
  compacto?: boolean
}) {
  if (!imagens || imagens.length === 0) return null

  const linhas = distribuirEmLinhas(imagens, layout)

  return (
    <div className={cn('space-y-3', className)}>
      {linhas.map((linha, indiceDaLinha) => (
        <div
          key={indiceDaLinha}
          className={cn(
            'flex flex-col gap-3',
            layout === 'lado-a-lado' && 'sm:flex-row sm:flex-wrap sm:items-start',
          )}
        >
          {linha.map((imagem, indice) => {
            const largura = `${tamanhoDaImagem(imagem)}%`
            return (
              <figure
                key={`${imagem.url}-${indice}`}
                className="w-full min-w-0 sm:w-[var(--largura-da-imagem)]"
                style={{ ['--largura-da-imagem' as string]: largura }}
              >
                <div
                  className={cn(
                    'group relative select-none overflow-hidden rounded-xl border border-border/70 bg-muted/20',
                    onAmpliar && 'cursor-pointer sm:cursor-zoom-in',
                  )}
                  style={{ touchAction: 'manipulation' }}
                  onClick={onAmpliar ? () => onAmpliar(imagem.url) : undefined}
                  role={onAmpliar ? 'button' : undefined}
                  tabIndex={onAmpliar ? 0 : undefined}
                  onKeyDown={
                    onAmpliar
                      ? (evento) => {
                          if (evento.key === 'Enter' || evento.key === ' ') {
                            evento.preventDefault()
                            onAmpliar(imagem.url)
                          }
                        }
                      : undefined
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagem.url}
                    alt={linha.length > 1 || linhas.length > 1 ? `${alt} ${indice + 1}` : alt}
                    loading="lazy"
                    draggable={false}
                    className={cn(
                      'pointer-events-none mx-auto h-auto w-full object-contain transition-all',
                      compacto ? 'max-h-48' : 'max-h-[70vh]',
                      onAmpliar && 'group-hover:brightness-95',
                    )}
                  />
                  {onAmpliar && !compacto ? (
                    <>
                      <div className="absolute inset-0 hidden items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                        <span className="flex items-center gap-1.5 rounded-lg bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                          <Maximize2 className="h-3.5 w-3.5" />
                          Clique para ampliar
                        </span>
                      </div>
                      <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur-sm sm:hidden">
                        <Maximize2 className="h-3 w-3" />
                        Ampliar
                      </span>
                    </>
                  ) : null}
                </div>
                {imagem.fonte ? (
                  <figcaption className="mt-1 text-[11px] italic text-muted-foreground">
                    Fonte: {imagem.fonte}
                  </figcaption>
                ) : null}
              </figure>
            )
          })}
        </div>
      ))}
    </div>
  )
}
