import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoAnimada } from './logo-animada'

/**
 * O casco das telas de entrar: aurora ao fundo, a logo 3D e o cartão de vidro.
 *
 * - `dividido` (entrar / criar conta): no computador, a marca e o argumento à
 *   esquerda e o cartão à direita; no celular, a logo em cima do cartão.
 * - `central` (senha, verificação): a logo compacta e o cartão, centralizados.
 *
 * Componente de servidor de propósito — o casco vai pronto no HTML estático e
 * só a logo e o botão de tema hidratam.
 */
export function AuthShell({
  layout = 'central',
  voltar = { href: '/', rotulo: 'Início' },
  aside,
  children,
}: {
  layout?: 'dividido' | 'central'
  voltar?: { href: string; rotulo: string }
  /** Texto ao lado da logo, só no layout dividido e só em tela grande. */
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="auth-root">
      <div className="auth-aurora" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>

      <header className="auth-topo">
        <Link href={voltar.href} className="pilula-vidro">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {voltar.rotulo}
        </Link>
        <ThemeToggle />
      </header>

      <main className="auth-palco" data-layout={layout}>
        <section className="auth-marca">
          <LogoAnimada tamanho={layout === 'dividido' ? 'heroi' : 'compacto'} />
          {aside && <div className="auth-marca-texto">{aside}</div>}
        </section>
        {children}
      </main>
    </div>
  )
}
