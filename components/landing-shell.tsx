import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import LandingPage from '@/components/landing-page'

// Fontes da landing. Declaradas aqui (e não no layout raiz) para que só a
// landing baixe e faça preload desses arquivos — o resto do app segue com
// Newsreader / Source Sans / IBM Plex Mono. next/font auto-hospeda, então não
// há request pro Google nem CSS externo bloqueando a renderização.
//
// Sem `weight`: as três são fontes VARIÁVEIS. Declarando os pesos, o next/font
// baixa uma instância estática por peso — eram 9 arquivos entre as três. Sem
// declarar, baixa um único arquivo variável de cada, que cobre toda a faixa de
// peso usada no layout.
const daDisplay = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-da-display',
  display: 'swap',
})
const daBody = Inter({
  subsets: ['latin'],
  variable: '--font-da-body',
  display: 'swap',
})
const daMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-da-mono',
  display: 'swap',
})

/**
 * A landing com suas fontes. Vive num módulo próprio porque duas rotas a
 * servem: `/` (HTML estático, do cache de borda) e a prévia dinâmica usada
 * quando a landing está desligada no painel. As duas precisam das MESMAS
 * fontes — e `next/font` só pode ser chamado no escopo de módulo, então
 * compartilhar o componente é o que evita baixar dois conjuntos de arquivos.
 *
 * `initialIsLoggedIn` fica sempre falso: o HTML é o mesmo para todo mundo (é o
 * que permite servi-lo do CDN) e quem está logado é revelado no cliente, pelo
 * `/api/auth/me` que a landing já consultava em toda visita — o cookie de
 * sessão é SameSite=strict e não acompanha uma navegação vinda de fora.
 */
export function LandingShell() {
  return (
    <div className={`${daDisplay.variable} ${daBody.variable} ${daMono.variable}`}>
      <LandingPage />
    </div>
  )
}
