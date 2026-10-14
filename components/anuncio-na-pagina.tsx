'use client'

/**
 * Anúncio NA página: imagem ou vídeo que entra no fluxo do conteúdo (topo ou
 * fim), em vez de flutuar sobre ele.
 *
 * ## Uma peça para cada tela
 *
 * O admin pode mandar duas mídias: a principal e uma "versão do celular" (por
 * exemplo, banner 4:1 no computador e 4:5 no telefone). A escolha acontece aqui,
 * no navegador, então só UM arquivo é baixado — e troca se a largura mudar
 * (girar o tablet).
 *
 * ## Tamanho em qualquer tela
 *
 * A caixa usa a proporção real do arquivo, e a largura é limitada para a
 * ALTURA caber na tela: um 16:9 ocupa a coluna inteira, um 9:16 encolhe e
 * centraliza em vez de virar um poste de 2.000 px no monitor. Nada é cortado.
 *
 * ## Vários anúncios para a mesma página
 *
 * Um por vez, sorteado a cada navegação: dois vídeos empilhados competem entre
 * si e com o conteúdo.
 */

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, ExternalLink, Megaphone } from 'lucide-react'

import { AnuncioModal } from '@/components/anuncio-modal'
import { AnuncioVideo } from '@/components/anuncio-video'
import { useAcaoDoAnuncio, type AnuncioClicavel } from '@/components/anuncio-acao'
import { toInternalPath } from '@/lib/anuncio-destinos'
import { shouldHideAdsOnRoute } from '@/lib/anuncio-exibicao'
import {
  anuncioCasaComPagina,
  type AnuncioMidia,
  type AnuncioPosicao,
} from '@/lib/anuncio-midia'
import { anunciosEmCache, carregarAnunciosPublicos } from '@/lib/anuncios-publicos'
import { cn } from '@/lib/utils'

interface AnuncioDaPagina extends AnuncioClicavel {
  _id: string
  ordem?: number
  titulo?: string
  ctaTexto?: string
  exibicao: 'pagina'
  midia: AnuncioMidia
  midiaCelular?: AnuncioMidia
  paginas: string[]
  posicao?: AnuncioPosicao
}

/** Altura máxima da peça: o anúncio nunca ocupa a tela inteira. */
const ALTURA_MAX = 'min(78vh, 720px)'
const CONSULTA_CELULAR = '(max-width: 767px)'

function midiaValida(m: unknown): m is AnuncioMidia {
  const midia = m as AnuncioMidia | undefined
  return (
    !!midia &&
    (midia.tipo === 'imagem' || midia.tipo === 'video') &&
    typeof midia.url === 'string' &&
    midia.largura > 0 &&
    midia.altura > 0
  )
}

function anunciosDaPagina(lista: unknown[] | null): AnuncioDaPagina[] {
  if (!lista) return []
  return lista
    .filter((item): item is AnuncioDaPagina => {
      const ad = item as Partial<AnuncioDaPagina>
      return (
        ad.exibicao === 'pagina' &&
        typeof ad._id === 'string' &&
        (ad.tipoAcao === 'link' || ad.tipoAcao === 'modal') &&
        Array.isArray(ad.paginas) &&
        midiaValida(ad.midia)
      )
    })
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
}

function useEhCelular(): boolean {
  const [celular, setCelular] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(CONSULTA_CELULAR).matches,
  )
  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_CELULAR)
    const atualizar = () => setCelular(consulta.matches)
    atualizar()
    consulta.addEventListener('change', atualizar)
    return () => consulta.removeEventListener('change', atualizar)
  }, [])
  return celular
}

interface AnuncioNaPaginaProps {
  /** Que anúncios este lugar mostra. `todas` = o lugar único das páginas sem AppShell. */
  posicao: AnuncioPosicao | 'todas'
  className?: string
}

export function AnuncioNaPagina({ posicao, className }: AnuncioNaPaginaProps) {
  const pathname = usePathname()
  // Navegar sorteia de novo: a `key` recria o miolo a cada página.
  return <Miolo key={pathname} pathname={pathname} posicao={posicao} className={className} />
}

function Miolo({
  pathname,
  posicao,
  className,
}: AnuncioNaPaginaProps & { pathname: string | null }) {
  const [lista, setLista] = useState<unknown[] | null>(anunciosEmCache)
  const [sorteio] = useState(() => Math.random())
  const celular = useEhCelular()
  const { abrir, modalProps } = useAcaoDoAnuncio()
  const oculto = shouldHideAdsOnRoute(pathname)

  useEffect(() => {
    if (oculto) return
    let cancelado = false
    carregarAnunciosPublicos()
      .then((nova) => {
        if (!cancelado) setLista(nova)
      })
      .catch(() => {
        // Sem anúncio a página segue igual; o banner flutuante já registra o erro.
      })
    return () => {
      cancelado = true
    }
  }, [oculto])

  const ad = useMemo(() => {
    if (oculto) return null
    const candidatos = anunciosDaPagina(lista).filter(
      (item) =>
        (posicao === 'todas' || (item.posicao ?? 'topo') === posicao) &&
        anuncioCasaComPagina(item.paginas, pathname),
    )
    if (candidatos.length === 0) return null
    return candidatos[Math.floor(sorteio * candidatos.length) % candidatos.length]
  }, [lista, oculto, pathname, posicao, sorteio])

  if (!ad) return null

  const midia = celular && midiaValida(ad.midiaCelular) ? ad.midiaCelular : ad.midia
  const proporcao = midia.largura / midia.altura
  const titulo = ad.titulo?.trim()
  const cta = ad.ctaTexto?.trim() || (ad.tipoAcao === 'link' ? 'Saiba mais' : 'Ver detalhes')
  const externo =
    ad.tipoAcao === 'link' && !!ad.linkUrl && !toInternalPath(ad.linkUrl, window.location.origin)
  const rotulo = titulo || ad.modalTitulo || 'Anúncio'
  const noTopo = posicao === 'topo'

  return (
    <aside
      aria-label="Publicidade"
      className={cn(
        'mx-auto w-full max-w-7xl px-3 print:hidden sm:px-4 lg:px-6',
        noTopo ? 'pt-3 sm:pt-4' : 'pb-6 pt-2',
        className,
      )}
    >
      <div
        className="mx-auto w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm motion-safe:animate-fade-in-up"
        style={{ maxWidth: `min(100%, calc(${ALTURA_MAX} * ${proporcao}))` }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={rotulo}
          onClick={() => abrir(ad)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              abrir(ad)
            }
          }}
          className="relative block w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          {midia.tipo === 'video' ? (
            <AnuncioVideo key={midia.url} midia={midia} rotulo={rotulo} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={midia.url}
              src={midia.url}
              alt={rotulo}
              width={midia.largura}
              height={midia.altura}
              // No topo a peça está à vista na primeira pintura; no fim, só
              // baixa quando a pessoa rolar até perto dela.
              loading={noTopo ? 'eager' : 'lazy'}
              decoding="async"
              className="block h-auto w-full"
              style={{ aspectRatio: `${midia.largura} / ${midia.altura}` }}
            />
          )}

          <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur sm:left-3 sm:top-3">
            <Megaphone className="h-3 w-3" />
            Publicidade
          </span>
        </div>

        {(titulo || ad.ctaTexto?.trim()) && (
          <div className="flex items-center gap-3 border-t border-border/60 px-3 py-2.5 sm:px-4">
            {titulo && (
              <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-foreground line-clamp-2 sm:text-base">
                {titulo}
              </p>
            )}
            <button
              type="button"
              onClick={() => abrir(ad)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm',
                !titulo && 'ml-auto',
              )}
            >
              {cta}
              {externo ? <ExternalLink className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>

      <AnuncioModal {...modalProps} />
    </aside>
  )
}
