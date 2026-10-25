'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BadgeCheck, Check, Link2, X } from 'lucide-react'
import { PARAMETRO_DO_LINK, codigoValido, escopoDoDestino, normalizarCodigo } from '@/lib/embaixadores/regras'
import { copiarTexto } from './copiar'

/**
 * As duas pontas do link de produto do embaixador, flutuando sobre qualquer
 * página do site:
 *
 * - **Para quem chegou pelo link** (`?emb=CODIGO` numa página de produto): o
 *   selo "Indicação de Maria · cupom MARIA10 vai aplicado no pagamento". É o
 *   que transforma a URL vinculada em promessa visível — a pessoa sabe que o
 *   desconto está garantido antes de clicar em comprar.
 * - **Para o próprio embaixador**, logado, em qualquer página que faça sentido
 *   divulgar (materiais, planos, Manual Clínico, provas, a página inicial…):
 *   o botão "Meu link desta página". Ele divulga o que está vendo sem voltar
 *   ao painel para montar link nenhum.
 *
 * Leve de propósito: nada de banco nem de sessão. O convite vem de
 * /api/embaixadores/convite (cache do CDN) e "sou embaixador" é a marca que o
 * painel deixa no aparelho (`MARCA_DO_EMBAIXADOR`).
 */

export const MARCA_DO_EMBAIXADOR = 'da-embaixador'
const DISPENSADOS = 'da-emb-selo-dispensado'

interface Convite {
  primeiroNome: string
  cupom: { codigo: string; rotulo: string } | null
}

function lerMarca(): { codigo: string; link: string; validoAte: number } | null {
  try {
    const marca = JSON.parse(window.localStorage.getItem(MARCA_DO_EMBAIXADOR) || 'null')
    if (!marca?.codigo || !marca?.link || Number(marca.validoAte) < Date.now()) return null
    return marca
  } catch {
    return null
  }
}

/**
 * Páginas onde o botão não aparece: o próprio painel e o admin, as telas de
 * conta e as que só existem para quem já está dentro de uma tarefa (uma prova
 * em andamento, a sala da monitoria).
 */
const SEM_BOTAO = /^\/(admin|embaixadores|auth|convite|e|profile|offline|compra|exam)(\/|$)|^\/monitorias\/reservas\/[^/]+\/sala/

function podeDivulgar(caminho: string): boolean {
  return !SEM_BOTAO.test(caminho)
}

export function SeloDoLink() {
  const pathname = usePathname()
  const [convite, setConvite] = useState<(Convite & { codigo: string }) | null>(null)
  const [meuLink, setMeuLink] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [deProduto, setDeProduto] = useState(false)

  useEffect(() => {
    setConvite(null)
    setMeuLink(null)
    const busca = new URLSearchParams(window.location.search)
    const escopo = escopoDoDestino(window.location.pathname + window.location.search)
    const emb = normalizarCodigo(busca.get(PARAMETRO_DO_LINK) || '')
    const marca = lerMarca()

    // O embaixador logado, em qualquer página que faça sentido divulgar: o
    // link dele para ela. Em página de produto, quem abrir já encontra o
    // cupom aplicado; nas outras, o link vale como convite.
    if (marca && (!emb || emb === marca.codigo) && podeDivulgar(window.location.pathname)) {
      busca.delete(PARAMETRO_DO_LINK)
      const caminho = window.location.pathname + (busca.toString() ? `?${busca.toString()}` : '')
      // Início (logado ou não) vira o convite: o painel de quem está logado não
      // é página para mandar a ninguém.
      setMeuLink(caminho === '/' || caminho === '/dashboard' ? marca.link : `${marca.link}?para=${encodeURIComponent(caminho)}`)
      setDeProduto(!!escopo)
      return
    }

    // O selo do visitante é só para link de produto.
    if (!escopo || !codigoValido(emb)) return
    try {
      if (window.sessionStorage.getItem(DISPENSADOS) === emb) return
    } catch {
      // sem storage: mostra mesmo assim
    }
    let vivo = true
    fetch(`/api/embaixadores/convite?codigo=${encodeURIComponent(emb)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((dados) => {
        if (vivo && dados?.convite?.cupom) setConvite({ ...dados.convite, codigo: emb })
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [pathname])

  if (convite?.cupom) {
    return (
      <div
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 md:bottom-6"
      >
        <div className="pointer-events-auto flex max-w-[min(560px,100%)] items-center gap-3 rounded-2xl border border-emerald-600/25 bg-white/80 py-2.5 pl-3.5 pr-2 text-[13.5px] text-[#0b1f1a] shadow-[0_18px_50px_-18px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-500 dark:border-emerald-300/20 dark:bg-[#0b1f1a]/80 dark:text-[#eef4ef]">
          <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
          <p className="min-w-0 leading-snug">
            <strong>Indicação de {convite.primeiroNome}</strong> · cupom{' '}
            <strong className="tracking-wide">{convite.cupom.codigo}</strong> ({convite.cupom.rotulo}) vai aplicado no pagamento
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                window.sessionStorage.setItem(DISPENSADOS, convite.codigo)
              } catch {
                // ignorado
              }
              setConvite(null)
            }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full opacity-60 transition hover:opacity-100"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  if (meuLink) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[60] flex justify-center md:bottom-6">
        <button
          type="button"
          onClick={async () => {
            if (await copiarTexto(meuLink)) {
              setCopiado(true)
              window.setTimeout(() => setCopiado(false), 1800)
            }
          }}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#f2c063] via-[#e2a43e] to-[#d48a2a] px-4 py-2.5 text-[13.5px] font-bold text-[#0b1f1a] shadow-[0_14px_36px_-12px_rgba(226,164,62,0.7)] transition active:scale-95"
          title={
            deProduto
              ? 'O link desta página com o seu cupom: quem abrir já compra com ele aplicado'
              : 'O link desta página com o seu código: conta o cadastro e sugere o seu cupom no pagamento'
          }
        >
          {copiado ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
          {copiado ? 'Link copiado' : 'Meu link desta página'}
        </button>
      </div>
    )
  }

  return null
}
