import Link from 'next/link'
import type { ReactNode } from 'react'
import { Revelar } from './revelar'
import './vitrine.css'

/**
 * Entrar e criar conta já com a volta marcada: depois do login a pessoa cai
 * no endereço que abriu, e não no painel.
 */
export function enderecosDeConta(destino: string) {
  const volta = encodeURIComponent(destino)
  return {
    entrar: `/auth/login?redirect=${volta}`,
    criar: `/auth/login?mode=register&redirect=${volta}`,
  }
}

/**
 * Revela cada `[data-revelar]` uma vez, quando entra na tela. Sem ouvinte de
 * rolagem e sem repetição: o observador solta o elemento assim que ele
 * aparece.
 *
 * Script em linha, no fim do casco, e não um componente React: se a
 * hidratação atrasar ou falhar, a seção não pode ficar invisível esperando
 * por ela.
 */
const SCRIPT_DE_REVELAR = `(function(){var a=document.querySelectorAll('.vitrine [data-revelar]');if(!a.length)return;if(!('IntersectionObserver' in window)){a.forEach(function(e){e.classList.add('visivel')});return}var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visivel');o.unobserve(e.target)}})},{rootMargin:'0px 0px -10% 0px',threshold:0.1});a.forEach(function(e){o.observe(e)})})()`

/**
 * O casco de toda vitrine: o script de uma linha que liga o movimento (sem
 * ele, nada fica escondido), a raiz `.vitrine` com as cores da marca e o
 * observador que revela as seções ao rolar.
 */
export function CascoDaVitrine({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        // Antes da primeira pintura: o estado inicial das animações só vale com
        // script, e sem esta linha o título piscaria visível e depois sumiria.
        dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('vitrine-js')" }}
      />
      <div className="vitrine min-h-svh overflow-x-clip">
        {children}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DE_REVELAR }} />
        <Revelar />
      </div>
    </>
  )
}

/** As três portas públicas que toda vitrine oferece no cabeçalho. */
export const LINKS_DA_VITRINE = [
  { href: '/provas', rotulo: 'Provas' },
  { href: '/banco-questoes', rotulo: 'Banco de questões' },
  { href: '/amostra', rotulo: 'Amostra grátis' },
] as const

/**
 * O cabeçalho deitado sobre a borda de cima do mosaico: a marca num bloco de
 * tinta, uma aba âmbar com os links e a ação à direita. No celular, uma linha
 * só acima do mosaico.
 */
export function CabecalhoDaVitrine({ destino, sobreposto = true }: { destino: string; sobreposto?: boolean }) {
  const conta = enderecosDeConta(destino)
  return (
    <header
      className={
        sobreposto
          ? 'relative z-20 flex h-14 items-stretch bg-[#0b1f1a] md:absolute md:inset-x-0 md:top-0 md:bg-transparent'
          : 'relative z-20 flex h-14 items-stretch bg-[#0b1f1a]'
      }
    >
      <Link href="/" aria-label="DomineAqui, página inicial" className="flex shrink-0 items-center bg-[#0b1f1a] px-4 md:px-6">
        <img src="/img/logo_darkmode.svg" alt="" width={32} height={32} className="h-8 w-8" />
        <span className="ml-2.5 hidden text-[18px] font-semibold text-[#f4f1ea] min-[420px]:inline">DomineAqui</span>
      </Link>
      <nav
        aria-label="Seções públicas"
        className="hidden items-center gap-7 bg-[#e2a43e] px-6 text-[16px] font-semibold text-[#0b1f1a] lg:flex lg:w-[calc(42%-190px)] lg:min-w-fit"
      >
        {LINKS_DA_VITRINE.map((link) => (
          <Link key={link.href} href={link.href} className="elo whitespace-nowrap">
            {link.rotulo}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1 bg-[#0b1f1a] pl-2 pr-4 md:pl-4 md:pr-2">
        <Link href={conta.entrar} className="botao elo min-h-[44px] whitespace-nowrap px-3 text-[16px] text-[#f4f1ea] md:px-4">
          Entrar
        </Link>
        <Link href={conta.criar} className="botao botao-ambar min-h-[44px] whitespace-nowrap px-3 text-[16px] md:px-4">
          Criar conta
        </Link>
      </div>
    </header>
  )
}
