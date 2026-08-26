'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Instagram, Mail, MessageCircle, ArrowUpRight } from 'lucide-react'

// Canais de comunicação oficiais da plataforma
const WHATSAPP_URL =
  'https://wa.me/5524992230908?text=Ol%C3%A1%2C%20estou%20em%20contato%20com%20o%20WhatsApp%20da%20plataforma%20DomineAqui%21'
const INSTAGRAM_URL = 'https://instagram.com/domineaqui.br'
const DISCORD_URL = 'https://discord.gg/vdfHcvDdMw'
const CONTACT_EMAIL = 'contato@domineaqui.com.br'

// Rotas onde este rodapé de marketing DEVE aparecer.
//
// Isto é uma LISTA DE PERMISSÃO — antes era o contrário (uma lista de rotas
// bloqueadas), e o efeito colateral era que TODA rota nova nascia com o bloco
// gigante de canais de comunicação colado embaixo: prova finalizada, formulário
// enviado, loja, checkout, páginas de lead que já têm rodapé próprio... Em telas
// curtas esse bloco vira quase a página inteira, e quem termina uma prova cai
// direto nele em vez de ver o resultado. Agora o rodapé só aparece onde foi
// pensado para aparecer.
//
// Fora daqui ficam, de propósito:
//  - '/' e '/auth': landing e login já têm layout/rodapé próprios.
//  - '/lead/*': as páginas de lead trazem o próprio rodapé (era rodapé dobrado).
//  - Todo o app pós-login (AppShell com sidebar), provas, checkouts e afins.
//  - '/amostra': desde que a amostra passou a ser a MESMA tela de resolução do
//    banco (uma questão por vez, barra de progresso, barra de ação fixa no
//    rodapé), ela virou justamente o caso que o parágrafo acima descreve: um
//    bloco de canais de comunicação colado embaixo de quem está respondendo, e
//    depois embaixo do placar. O convite para criar a conta já é a última seção
//    da própria tela de resultado.
const FOOTER_EXACT_ROUTES = [
  '/equipe',
  '/termos-de-servico',
  '/politica-de-privacidade',
  '/comprar',
]
const FOOTER_PREFIX_ROUTES = ['/rifas']

function showsFooter(pathname: string | null): boolean {
  // fail-closed: sem pathname conhecido, não renderiza (evita flash no loading).
  if (!pathname) return false
  if (FOOTER_EXACT_ROUTES.includes(pathname)) return true
  return FOOTER_PREFIX_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function Footer() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Não renderiza durante SSR / primeiro paint. Nesses instantes o
  // usePathname() pode voltar null e o layout ainda está vazio — foi o que
  // fazia os canais de comunicação "piscarem" no centro da tela junto com o
  // loading. Só mostramos o rodapé depois que a página montou no cliente E
  // temos certeza de que é uma rota pública de conteúdo.
  if (!mounted || !showsFooter(pathname)) {
    return null
  }

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-card/40 backdrop-blur-xl">
      {/* Glows decorativos de fundo (efeito 3D / profundidade) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-[#468152]/20 blur-3xl" />
        <div className="absolute -top-16 right-1/4 h-56 w-56 rounded-full bg-[#CE5929]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-[#E2A43E]/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* ══════════════════════════════════════════
            CANAIS DE COMUNICAÇÃO — em evidência
        ══════════════════════════════════════════ */}
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/80 backdrop-blur-md">
            <MessageCircle size={14} className="text-[#468152]" />
            Fale com a gente
          </span>
          <h2 className="mt-4 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
            Nossos canais de comunicação
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Prefira o <span className="font-semibold text-foreground">WhatsApp</span> e o{' '}
            <span className="font-semibold text-foreground">Instagram</span> — são os nossos
            canais principais. Também estamos no Discord e respondemos por e-mail.
          </p>
        </div>

        {/* Cards 3D / glassmorphism dos canais principais */}
        <div className="mx-auto mt-8 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* WhatsApp — contato direto com a plataforma */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center gap-3 rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-[#25D366]/50 hover:shadow-2xl hover:shadow-[#25D366]/25"
          >
            <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-70" />
            <ArrowUpRight
              size={16}
              className="absolute right-4 top-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
            />
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-[#25D366]/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
            </span>
            <div>
              <p className="text-base font-bold text-foreground">WhatsApp</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MessageCircle size={12} /> Fale com a plataforma
              </p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-3 py-1 text-xs font-semibold text-[#128C7E] dark:text-[#25D366]">
              +55 24 99223-0908
            </span>
          </a>

          {/* Instagram */}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center gap-3 rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-[#E4405F]/50 hover:shadow-2xl hover:shadow-[#E4405F]/25"
          >
            <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-70" />
            <ArrowUpRight
              size={16}
              className="absolute right-4 top-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
            />
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#E4405F] to-[#FCAF45] text-white shadow-lg shadow-[#E4405F]/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[6deg]">
              <Instagram size={26} />
            </span>
            <div>
              <p className="text-base font-bold text-foreground">Instagram</p>
              <p className="mt-1 text-xs text-muted-foreground">Novidades e conteúdo</p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#E4405F]/15 px-3 py-1 text-xs font-semibold text-[#E4405F]">
              @domineaqui.br
            </span>
          </a>

          {/* Discord */}
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center gap-3 rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-[#5865F2]/50 hover:shadow-2xl hover:shadow-[#5865F2]/25"
          >
            <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-70" />
            <ArrowUpRight
              size={16}
              className="absolute right-4 top-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
            />
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5865F2] to-[#404EED] text-white shadow-lg shadow-[#5865F2]/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[6deg]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z" />
              </svg>
            </span>
            <div>
              <p className="text-base font-bold text-foreground">Discord</p>
              <p className="mt-1 text-xs text-muted-foreground">Comunidade e avisos</p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#5865F2]/15 px-3 py-1 text-xs font-semibold text-[#5865F2]">
              Entrar no servidor
            </span>
          </a>

          {/* E-mail de contato */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="group relative flex flex-col items-center gap-3 rounded-3xl border border-white/20 bg-white/10 p-6 text-center shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-[#468152]/50 hover:shadow-2xl hover:shadow-[#468152]/25"
          >
            <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-70" />
            <ArrowUpRight
              size={16}
              className="absolute right-4 top-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
            />
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#468152] to-[#CE5929] text-white shadow-lg shadow-[#468152]/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]">
              <Mail size={26} />
            </span>
            <div>
              <p className="text-base font-bold text-foreground">E-mail</p>
              <p className="mt-1 text-xs text-muted-foreground">Suporte e parcerias</p>
            </div>
            <span className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-[#468152]/15 px-3 py-1 text-xs font-semibold text-[#468152] dark:text-[#7bbf88]">
              {CONTACT_EMAIL}
            </span>
          </a>
        </div>

        {/* Divisória */}
        <div className="mx-auto my-10 h-px max-w-4xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* ══════════════════════════════════════════
            LINKS INSTITUCIONAIS + COPYRIGHT
        ══════════════════════════════════════════ */}
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/equipe"
              className="transition-colors hover:text-foreground underline underline-offset-4"
            >
              Equipe
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link
              href="/termos-de-servico"
              className="transition-colors hover:text-foreground underline underline-offset-4"
            >
              Termos de Serviço
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link
              href="/politica-de-privacidade"
              className="transition-colors hover:text-foreground underline underline-offset-4"
            >
              Política de Privacidade
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} DomineAqui LTDA. Todos os direitos reservados.</p>
            <p className="mt-1 font-semibold">Seja o Foco. Seja a Referência.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
