import type { Metadata } from 'next'
import { BackButton } from '@/components/back-button'
import { InstalarApp } from '@/components/pwa/instalar-app'

export const metadata: Metadata = {
  title: 'Instalar o app',
  description:
    'Instale o DomineAqui como app no seu Samsung, Android ou iPhone: ícone na tela de início, tela cheia e atalhos. Grátis e sem app store.',
  alternates: { canonical: '/instalar' },
  openGraph: {
    title: 'Instale o app do DomineAqui',
    description:
      'Ícone na tela de início, abertura em tela cheia e atalhos para Provas, Questões, Flashcards e Cronograma. Funciona em Samsung, Android e iPhone.',
    url: '/instalar',
  },
}

/**
 * Endereço fixo para mandar a quem pergunta "tem app?" — e o destino do atalho
 * curto `/app`, divulgado por fora (ver o redirect no `next.config.js`).
 *
 * A tela em si é a mesma que a landing mostra na seção `#app`: um componente
 * só, `InstalarApp`. Antes eram duas implementações, e a da landing só sabia
 * falar de iPhone — quem chegava de um Galaxy pela home lia a instrução errada.
 */
export default function InstalarPage() {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        <div className="mt-6 pb-12">
          <InstalarApp aparencia="app" />
        </div>
      </div>
    </div>
  )
}
