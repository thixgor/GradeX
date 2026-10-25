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

/** As portas públicas que toda vitrine oferece. */
export const LINKS_DA_VITRINE = [
  { href: '/provas', rotulo: 'Provas' },
  { href: '/banco-questoes', rotulo: 'Banco de questões' },
  { href: '/amostra', rotulo: 'Amostra grátis' },
] as const

/**
 * Revela cada `[data-revelar]` uma vez, quando entra na tela.
 *
 * Script em linha, no fim do casco, e não só um componente React: se a
 * hidratação atrasar ou falhar, a seção não pode ficar invisível esperando
 * por ela. (`Revelar` cobre a navegação dentro do app, em que o React não
 * executa o `<script>` da página nova.)
 */
const SCRIPT_DE_REVELAR = `(function(){var a=document.querySelectorAll('.vitrine [data-revelar]');if(!a.length)return;if(!('IntersectionObserver' in window)){a.forEach(function(e){e.classList.add('visivel')});return}var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visivel');o.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:0.12});a.forEach(function(e){o.observe(e)})})()`

/**
 * O casco de toda vitrine: a aurora atrás de tudo, a navegação de vidro
 * flutuando no topo, o conteúdo e o rodapé.
 */
export function CascoDaVitrine({ destino, children }: { destino: string; children: ReactNode }) {
  const conta = enderecosDeConta(destino)
  return (
    <>
      <script
        // Antes da primeira pintura: o estado inicial das animações só vale com
        // script, e sem esta linha o título piscaria visível e depois sumiria.
        dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('vitrine-js')" }}
      />
      <div className="vitrine overflow-x-clip">
        <div aria-hidden className="aurora">
          <span className="a1" />
          <span className="a2" />
          <span className="a3" />
        </div>

        <header className="fixed inset-x-0 top-3 z-50 px-3 md:top-5 md:px-6">
          <nav
            aria-label="Navegação"
            className="vidro-forte mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-full pl-4 pr-2 md:h-16 md:pl-6"
          >
            <Link href="/" aria-label="DomineAqui, página inicial" className="flex shrink-0 items-center gap-2.5">
              <img src="/img/logo_darkmode.svg" alt="" width={30} height={33} className="h-7 w-auto md:h-8" />
              <span className="hidden text-[17px] font-bold min-[400px]:inline">DomineAqui</span>
            </Link>
            <div className="mx-auto hidden items-center gap-1 lg:flex">
              {LINKS_DA_VITRINE.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={l.href === destino ? 'page' : undefined}
                  className="elo rounded-full px-4 py-2 text-[15px] font-semibold text-[var(--papel-suave)] aria-[current=page]:bg-white/10 aria-[current=page]:text-[var(--papel)]"
                >
                  {l.rotulo}
                </Link>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
              <Link href={conta.entrar} className="elo px-3 text-[15px] font-semibold">
                Entrar
              </Link>
              <Link href={conta.criar} className="botao botao-principal !min-h-[42px] !px-5 !text-[15px]">
                Criar conta
              </Link>
            </div>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="relative mt-10 px-4 pb-10 md:px-8">
          <div className="vidro mx-auto grid max-w-6xl gap-8 rounded-[28px] p-8 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:p-10">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/img/logo_darkmode.svg" alt="" width={30} height={33} className="h-8 w-auto" />
                <span className="text-[18px] font-bold">DomineAqui</span>
              </div>
              <p className="mt-3 max-w-[32ch] text-[15px] text-[var(--papel-fraco)]">
                Provas, banco de questões e materiais para quem estuda na faculdade.
              </p>
            </div>
            <ColunaDoRodape titulo="Sem conta">
              {LINKS_DA_VITRINE.map((l) => (
                <Link key={l.href} href={l.href} className="elo">
                  {l.rotulo}
                </Link>
              ))}
            </ColunaDoRodape>
            <ColunaDoRodape titulo="Conta">
              <Link href={conta.entrar} className="elo">
                Entrar
              </Link>
              <Link href={conta.criar} className="elo">
                Criar conta grátis
              </Link>
            </ColunaDoRodape>
            <ColunaDoRodape titulo="Contato">
              <a href="mailto:contato@domineaqui.com.br" className="elo break-all">
                contato@domineaqui.com.br
              </a>
              <Link href="/termos-de-servico" className="elo">
                Termos de serviço
              </Link>
              <Link href="/politica-de-privacidade" className="elo">
                Privacidade
              </Link>
            </ColunaDoRodape>
          </div>
          <p className="mx-auto mt-6 max-w-6xl text-center text-[13px] text-[var(--papel-fraco)]">
            © {new Date().getFullYear()} DomineAqui
          </p>
        </footer>

        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DE_REVELAR }} />
        <Revelar />
      </div>
    </>
  )
}

function ColunaDoRodape({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="text-[15px]">
      <p className="font-bold">{titulo}</p>
      <div className="mt-3 flex flex-col gap-2 text-[var(--papel-suave)]">{children}</div>
    </div>
  )
}
