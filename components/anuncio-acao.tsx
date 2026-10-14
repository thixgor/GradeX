'use client'

/**
 * O que acontece quando alguém clica num anúncio: abrir o destino ou o modal.
 *
 * O banner flutuante e o anúncio na página fazem exatamente a mesma coisa, então
 * a regra mora aqui uma vez só — em especial a de navegação interna: destino
 * DENTRO da plataforma navega com o router (abrir uma aba nova para ir de
 * `/dashboard` a `/materiais/x` custa o carregamento inteiro do app e, no PWA
 * instalado, ainda joga a pessoa para fora, no navegador). Só o que sai do
 * domínio ganha aba nova.
 */

import { useCallback, useMemo, useState, type ComponentProps, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'

import { AnuncioModal, renderizarConteudoModal, type AnuncioModalAd } from '@/components/anuncio-modal'
import { toInternalPath } from '@/lib/anuncio-destinos'

export interface AnuncioClicavel extends AnuncioModalAd {
  tipoAcao: 'link' | 'modal'
  linkUrl?: string
  linkNovaAba?: boolean
}

export function useAcaoDoAnuncio() {
  const router = useRouter()
  const [modalAberto, setModalAberto] = useState(false)
  const [selecionado, setSelecionado] = useState<AnuncioClicavel | null>(null)

  const html = useMemo(() => renderizarConteudoModal(selecionado?.modalConteudo), [selecionado?.modalConteudo])

  const abrirDestino = useCallback(
    (url?: string, novaAba?: boolean) => {
      if (!url) return

      const interno = toInternalPath(url, window.location.origin)
      if (interno) {
        router.push(interno)
        return
      }

      if (novaAba ?? true) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = url
      }
    },
    [router],
  )

  const abrir = useCallback(
    (ad: AnuncioClicavel) => {
      if (ad.tipoAcao === 'link' && ad.linkUrl) {
        abrirDestino(ad.linkUrl, ad.linkNovaAba)
        return
      }
      if (ad.tipoAcao === 'modal') {
        setSelecionado(ad)
        setModalAberto(true)
      }
    },
    [abrirDestino],
  )

  const onAcao = useCallback(() => {
    abrirDestino(selecionado?.modalBotaoLink)
    setModalAberto(false)
  }, [abrirDestino, selecionado?.modalBotaoLink])

  /** Link escrito no corpo do modal: mesmo tratamento do botão. */
  const onLinkNoTexto = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const anchor = (event.target as HTMLElement | null)?.closest('a')
      if (!anchor) return

      const interno = toInternalPath(anchor.getAttribute('href') || '', window.location.origin)
      if (!interno) return

      event.preventDefault()
      setModalAberto(false)
      router.push(interno)
    },
    [router],
  )

  const modalProps: ComponentProps<typeof AnuncioModal> = {
    ad: selecionado,
    html,
    open: modalAberto,
    onOpenChange: setModalAberto,
    onAcao,
    onLinkNoTexto,
  }

  return { abrir, modalAberto, modalProps }
}
