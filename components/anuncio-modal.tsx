'use client'

/**
 * Modal do anúncio — a peça que abre quando o banner é do tipo "modal".
 *
 * Fica em arquivo próprio porque duas telas precisam dele: a exibição pública
 * (`components/platform-ads.tsx`) e a pré-visualização do admin. Antes só
 * existia dentro do componente público, e o admin publicava no escuro.
 *
 * ## O desenho no celular
 *
 * No telefone o modal é uma FOLHA presa ao rodapé, não uma caixa flutuando no
 * meio da tela. A caixa centralizada tinha três defeitos que juntos deixavam a
 * peça ruim de usar justamente onde ela mais aparece:
 *
 *  1. Altura em `vh` ignora a barra de endereço do navegador móvel, então o
 *     rodapé — onde mora o botão de ação — nascia fora da tela.
 *  2. A largura pedia `100vw - 24px` dentro de um contêiner que já tinha 16px
 *     de padding de cada lado: 8px a mais do que cabia, o que espremia o
 *     conteúdo e deixava a rolagem horizontal aparecer.
 *  3. O botão principal ficava no fim de um conteúdo rolável, longe do polegar.
 *
 * Agora: largura inteira, cantos arredondados só em cima, conteúdo rolando no
 * meio e o botão de ação fixo embaixo, respeitando a área segura do aparelho.
 * A partir de `sm` volta a ser a caixa centralizada de sempre.
 */

import { useCallback, type MouseEvent, type ReactNode } from 'react'
import { ArrowRight, ExternalLink, Megaphone, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toInternalPath } from '@/lib/anuncio-destinos'
import { formatarConteudoAnuncio } from '@/lib/anuncio-formatacao'

export interface AnuncioModalAd {
  imagemUrl?: string
  modalTitulo?: string
  modalConteudo?: string
  modalBotaoTexto?: string
  modalBotaoLink?: string
}

/** Tags que sobrevivem à exibição pública. O resto é desembrulhado ou removido. */
const ALLOWED_TAGS = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'DEL',
  'EM',
  'H3',
  'H4',
  'HR',
  'I',
  'LI',
  'MARK',
  'OL',
  'P',
  'S',
  'SMALL',
  'SPAN',
  'STRONG',
  'U',
  'UL',
])

/**
 * Limpa o HTML escrito no admin antes de injetá-lo.
 *
 * O conteúdo vem de um campo livre do painel: mesmo sendo admin quem escreve,
 * o texto passa pelo banco e volta para a tela de todo mundo — então é tratado
 * como dado, não como marcação confiável.
 */
export function sanitizeModalHtml(html: string) {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  doc
    .querySelectorAll('script, style, iframe, object, embed, form, input, button')
    .forEach((node) => node.remove())

  Array.from(doc.body.querySelectorAll('*')).forEach((element) => {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      return
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value

      if (name.startsWith('on') || name === 'style') {
        element.removeAttribute(attribute.name)
        return
      }

      if (element.tagName !== 'A' || !['href', 'target', 'rel'].includes(name)) {
        element.removeAttribute(attribute.name)
        return
      }

      if (name === 'href') {
        try {
          const url = new URL(value, window.location.origin)
          if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
            element.removeAttribute(attribute.name)
          }
        } catch {
          element.removeAttribute(attribute.name)
        }
      }
    })

    if (element.tagName === 'A') {
      // Link para o próprio site abre na mesma aba e é interceptado no clique
      // para virar navegação do app; só o que sai do domínio ganha aba nova.
      const interno = !!toInternalPath(element.getAttribute('href') || '', window.location.origin)

      if (interno) {
        element.setAttribute('target', '_self')
        element.removeAttribute('rel')
      } else {
        element.setAttribute('target', '_blank')
        element.setAttribute('rel', 'noopener noreferrer nofollow')
      }
    }
  })

  return doc.body.innerHTML
}

/**
 * Do texto do editor ao HTML exibido: formata (`**negrito**`, listas, quebras de
 * linha — ver `lib/anuncio-formatacao.ts`) e só então saneia. Exibição pública,
 * pré-visualização e editor usam esta mesma função, para nenhum deles mostrar
 * algo diferente do que o usuário vai ver.
 */
export function renderizarConteudoModal(texto: string | null | undefined) {
  return sanitizeModalHtml(formatarConteudoAnuncio(texto))
}

/** Classes de tipografia do conteúdo. Fora do JSX só para não virar um muro. */
export const CONTEUDO_CLASSES = cn(
  'min-w-0 max-w-none overflow-x-hidden break-words text-[15px] leading-relaxed text-slate-700 [overflow-wrap:anywhere] dark:text-slate-100 sm:text-base',
  '[&_*]:max-w-full',
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
  '[&_a]:break-words [&_a]:font-bold [&_a]:text-[#2f6f3f] [&_a]:underline [&_a]:underline-offset-2 [&_a]:[overflow-wrap:anywhere] dark:[&_a]:text-emerald-300',
  '[&_p]:mb-3 [&_p]:break-words [&_p]:leading-relaxed [&_p]:[overflow-wrap:anywhere]',
  '[&_strong]:font-black [&_strong]:text-[#2f6f3f] dark:[&_strong]:text-emerald-200',
  '[&_em]:text-slate-700 dark:[&_em]:text-slate-200',
  '[&_u]:underline-offset-2',
  '[&_del]:text-slate-500 dark:[&_del]:text-slate-400 [&_s]:text-slate-500 dark:[&_s]:text-slate-400',
  '[&_mark]:rounded [&_mark]:bg-[#E2A43E]/30 [&_mark]:px-1 [&_mark]:text-inherit dark:[&_mark]:bg-[#E2A43E]/25 dark:[&_mark]:text-amber-50',
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:rounded-xl [&_ul]:border [&_ul]:border-slate-200 [&_ul]:bg-slate-50 [&_ul]:py-3 [&_ul]:pl-7 [&_ul]:pr-4 dark:[&_ul]:border-emerald-300/12 dark:[&_ul]:bg-white/[0.04]',
  '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:rounded-xl [&_ol]:border [&_ol]:border-slate-200 [&_ol]:bg-slate-50 [&_ol]:py-3 [&_ol]:pl-7 [&_ol]:pr-4 dark:[&_ol]:border-emerald-300/12 dark:[&_ol]:bg-white/[0.04]',
  '[&_li]:my-0 [&_li]:text-slate-700 dark:[&_li]:text-slate-100',
  '[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-black [&_h3]:leading-tight [&_h3]:text-slate-950 dark:[&_h3]:text-white sm:[&_h3]:text-lg',
  '[&_h4]:mb-1 [&_h4]:mt-3 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-slate-950 dark:[&_h4]:text-white',
  '[&_blockquote]:my-3 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-[#468152]/50 [&_blockquote]:bg-[#468152]/5 [&_blockquote]:py-2.5 [&_blockquote]:pl-4 [&_blockquote]:pr-3 [&_blockquote]:italic dark:[&_blockquote]:bg-white/[0.04]',
  '[&_hr]:my-4 [&_hr]:border-slate-200 dark:[&_hr]:border-white/10',
  '[&_small]:text-[13px] [&_small]:text-slate-500 dark:[&_small]:text-slate-400',
)

interface AnuncioModalProps {
  ad: AnuncioModalAd | null
  /** Conteúdo já renderizado com `renderizarConteudoModal` (o chamador memoriza para não reprocessar a cada render). */
  html: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Clique no botão principal. */
  onAcao: () => void
  /** Clique em algum link dentro do texto — usado para navegar sem sair do app. */
  onLinkNoTexto?: (event: MouseEvent<HTMLDivElement>) => void
  /** Etiqueta do topo. A pré-visualização do admin troca por "Pré-visualização". */
  etiqueta?: ReactNode
}

export function AnuncioModal({
  ad,
  html,
  open,
  onOpenChange,
  onAcao,
  onLinkNoTexto,
  etiqueta,
}: AnuncioModalProps) {
  const fechar = useCallback(() => onOpenChange(false), [onOpenChange])

  const botaoTexto = ad?.modalBotaoTexto?.trim()
  const destinoExterno =
    !!ad?.modalBotaoLink &&
    typeof window !== 'undefined' &&
    !toInternalPath(ad.modalBotaoLink, window.location.origin)

  return (
    <Dialog open={open} onOpenChange={onOpenChange} variant="sheet">
      <DialogContent
        className={cn(
          'mx-0 flex w-full max-w-none flex-col overflow-hidden rounded-b-none rounded-t-2xl border-x-0 border-b-0 border-slate-200/80 bg-white p-0 text-slate-950 shadow-[0_-12px_60px_-20px_rgba(15,23,42,0.5)]',
          'max-h-[90vh] supports-[height:100dvh]:max-h-[88dvh]',
          'dark:border-emerald-300/15 dark:bg-[#07110d] dark:text-slate-50',
          'sm:mx-4 sm:w-full sm:max-w-2xl sm:rounded-2xl sm:border sm:shadow-[0_30px_100px_-32px_rgba(15,23,42,0.75)]',
        )}
      >
        {/* Cabeçalho ------------------------------------------------------ */}
        <div className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,rgba(70,129,82,0.12),rgba(255,255,255,0.88)_48%,rgba(226,164,62,0.18))] px-4 pb-3 pt-2 dark:border-emerald-300/12 dark:bg-[linear-gradient(135deg,rgba(70,129,82,0.30),rgba(7,17,13,0.98)_52%,rgba(226,164,62,0.16))] sm:px-5 sm:pb-4 sm:pt-5">
          <div aria-hidden className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-[#E2A43E]/18 blur-3xl dark:bg-[#E2A43E]/12" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[#468152]/16 blur-3xl dark:bg-[#468152]/24" />

          {/* Puxador: diz que a folha é arrastável e dá uma área de toque
              generosa para fechar sem mirar no "x". */}
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar anuncio"
            className="relative mx-auto mb-2 flex h-5 w-16 items-center justify-center sm:hidden"
          >
            <span className="h-1.5 w-11 rounded-full bg-slate-900/15 dark:bg-white/25" />
          </button>

          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar anuncio"
            className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-600 backdrop-blur transition hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152] dark:bg-black/30 dark:text-slate-300 dark:hover:bg-black/60 dark:hover:text-white sm:right-3 sm:top-3"
          >
            <X className="h-4 w-4" />
          </button>

          <DialogHeader className="relative min-w-0 p-0 pr-10">
            <div className="mb-1.5 inline-flex max-w-full items-center gap-1 rounded-full border border-[#468152]/25 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#468152] backdrop-blur-xl dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
              <Megaphone className="h-3 w-3" />
              {etiqueta ?? 'Anuncio da plataforma'}
            </div>
            <DialogTitle className="text-balance break-words text-[19px] font-black leading-tight text-slate-950 dark:text-white sm:text-2xl">
              {ad?.modalTitulo || 'Anuncio'}
            </DialogTitle>
            <DialogDescription className="mt-1 hidden break-words text-sm font-medium text-slate-600 dark:text-slate-300 sm:block">
              Uma oportunidade selecionada para estudantes da DomineAqui.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Conteúdo ------------------------------------------------------- */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-white px-4 py-4 dark:bg-[#07110d] sm:px-6 sm:py-5">
          {ad?.imagemUrl && (
            <div className="mb-4 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-inner dark:border-emerald-300/12 dark:bg-[#0d1b15]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.imagemUrl}
                alt={ad.modalTitulo || 'Anuncio'}
                className="mx-auto max-h-[26dvh] w-full max-w-full object-contain sm:max-h-[300px]"
              />
            </div>
          )}

          <div className={CONTEUDO_CLASSES} onClick={onLinkNoTexto} dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        {/* Rodapé --------------------------------------------------------- */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-emerald-300/12 dark:bg-[#09150f]/95 sm:px-6 sm:pb-4">
          {botaoTexto ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="ghost"
                onClick={fechar}
                className="h-11 w-full text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/[0.06] sm:h-10 sm:w-auto"
              >
                Fechar
              </Button>
              <Button
                onClick={onAcao}
                className="h-12 w-full min-w-0 rounded-xl bg-gradient-to-r from-[#468152] to-[#E2A43E] text-base font-black text-white shadow-lg shadow-[#468152]/25 transition hover:brightness-105 active:scale-[0.99] dark:from-emerald-600 dark:to-amber-500 sm:h-10 sm:w-auto sm:text-sm"
              >
                <span className="min-w-0 truncate">{botaoTexto}</span>
                {destinoExterno ? (
                  <ExternalLink className="ml-2 h-4 w-4 shrink-0" />
                ) : (
                  <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={fechar}
              className="h-12 w-full rounded-xl border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08] sm:ml-auto sm:h-10 sm:w-auto"
            >
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
