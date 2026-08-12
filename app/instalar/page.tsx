import type { Metadata } from 'next'
import { BackButton } from '@/components/back-button'
import { InstalarApp } from '@/components/pwa/instalar-app'
import { absoluteUrl } from '@/lib/seo'

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
 * Endereço fixo para mandar a quem pergunta "tem app?".
 *
 * A resposta agora é sim para os dois lados: no Android (Samsung Internet,
 * Chrome) a instalação é um toque no diálogo nativo do sistema; no iPhone é o
 * Compartilhar → Adicionar à Tela de Início. A página detecta o aparelho e já
 * abre no caminho certo, mas deixa todos visíveis — muita gente instala pelo
 * computador e precisa da instrução do celular do filho, do plantão, etc.
 */
export default function InstalarPage() {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        <div className="mt-4">
          <InstalarApp urlDaPagina={absoluteUrl('/instalar')} />
        </div>
      </div>
    </div>
  )
}
