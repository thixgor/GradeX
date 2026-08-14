import type { Metadata, Viewport } from 'next'
import { Newsreader, Source_Sans_3, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import './globals-button-feedback.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Footer } from '@/components/footer'
import { ScrollToTop } from '@/components/scroll-to-top'
import { RouteProgress } from '@/components/route-progress'
import { ImageProtectionProvider } from '@/components/image-protection-provider'
import { VerifyEmailBanner } from '@/components/verify-email-banner'
import { AppChrome } from '@/components/app-chrome'
import { RegisterSW } from '@/components/pwa/register-sw'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { MobileFloatingDock } from '@/components/mobile-floating-dock'
import { MobileBackButton } from '@/components/mobile-back-button'
import { TactileFeedback } from '@/components/tactile-feedback'
import { FloatingDockProvider } from '@/context/FloatingDockContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { MetaPixel } from '@/components/meta-pixel'
import { LiteModeProvider } from '@/context/LiteModeContext'
import { LiteModePrompt } from '@/components/lite-mode-prompt'
import { LITE_BOOTSTRAP_SCRIPT } from '@/lib/lite-mode'
import { SCRIPT_CAPTURA_INSTALACAO } from '@/lib/pwa/instalacao'
import {
  TELAS_DE_PARTIDA,
  TELAS_DE_RESERVA,
  arquivoDaTelaDePartida,
  arquivoDaTelaDeReserva,
  mediaDaTelaDePartida,
  mediaDaTelaDeReserva,
} from '@/lib/pwa/splash'
import { UIPreferencesProvider } from '@/context/UIPreferencesContext'
import { MaterialCartProvider } from '@/context/MaterialCartContext'
import { ShopCartProvider } from '@/context/ShopCartContext'
import {
  CANONICAL_ORIGIN,
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  absoluteUrl,
  buildJsonLd,
  getSiteUrl,
  publicIndexingRobots,
} from '@/lib/seo'

// Editorial / textbook serif — medical journal feel (not Space Grotesk / Rowdies AI stack)
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  style: ['normal', 'italic'],
})
// Clinical readable sans — used in health products, highly legible
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})
// Mono for labels clínicos (CID, ECG leads, etc.)
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-clinical',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  title: {
    default: 'DomineAqui — Plataforma de Estudo Inteligente para Medicina',
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: CANONICAL_ORIGIN }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'education',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'DomineAqui',
    // 'black': o iOS RESERVA a barra de status (barra preta, texto branco) e o
    // conteúdo começa ABAIXO dela. Simples e à prova de bug — o header nunca
    // fica sob o relógio/Dynamic Island (ao contrário de 'black-translucent',
    // que jogava o conteúdo por baixo da barra).
    statusBarStyle: 'black',
  },
  alternates: {
    canonical: '/',
    languages: { 'pt-BR': '/' },
  },
  robots: publicIndexingRobots,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      // 96 px cobre a aba em telas 1×, 2× e 3×. Sem o `sizes` declarado, o
      // navegador tratava este arquivo como o candidato de maior qualidade e
      // baixava a arte de 512 px — 71 KB, em toda página, para desenhar um
      // ícone de 16 px. A mesma arte em 96 px pesa 5,5 KB.
      { url: '/favicon.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    // Este `<link rel="apple-touch-icon">` é o caminho principal. Mas quando o
    // iOS não consegue resolver o ícone por ele — a página que estava aberta na
    // hora do "Adicionar à Tela de Início" era um erro, uma versão em cache ou
    // a busca do arquivo falhou —, ele NÃO desiste com elegância: procura, por
    // convenção, `/apple-touch-icon-precomposed.png` e `/apple-touch-icon.png`
    // na raiz do site e, não achando, cria o ícone a partir de uma captura de
    // tela da página. É assim que o app aparece na tela de início sem a marca.
    // Os dois arquivos existem em `public/` justamente para essa rede de
    // segurança: são cópias de 180×180 do mesmo desenho.
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'DomineAqui — Plataforma de Estudo Inteligente para Medicina',
    description: 'Provas, flashcards, cronogramas, materiais e estudo guiado por dados e IA. Estude para residência com inteligência.',
    url: '/',
    siteName: SITE_NAME,
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'DomineAqui — Plataforma de Estudo Inteligente para Medicina',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DomineAqui — Plataforma de Estudo Inteligente para Medicina',
    description: 'Provas, flashcards, cronogramas, materiais e estudo guiado por IA.',
    images: [DEFAULT_OG_IMAGE],
    creator: '@domineaqui',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  other: {
    'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    // Equivalente Android do `apple-mobile-web-app-capable`: garante a abertura
    // em tela cheia no Chrome e no Samsung Internet quando o atalho é criado
    // pelo caminho antigo ("Adicionar à tela inicial"), sem passar pelo
    // instalador que lê o manifest.
    'mobile-web-app-capable': 'yes',
    // Cor da barra de tarefas/status no Samsung Internet em modo app.
    'msapplication-TileColor': '#0B1F1A',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 'auto': o iOS insere automaticamente as margens seguras (barra de status no
  // topo, indicador de home embaixo). Nenhum conteúdo fica sob o relógio/notch —
  // sem precisar de env(safe-area-inset-*) nem truques.
  viewportFit: 'auto',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F1EA' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1F1A' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteUrl = getSiteUrl()

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/logo.png'),
      width: 512,
      height: 512,
    },
    image: DEFAULT_OG_IMAGE,
    description: SITE_DESCRIPTION,
    sameAs: ['https://instagram.com/domineaqui.br'],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contato@domineaqui.com.br',
      contactType: 'customer service',
      availableLanguage: 'Portuguese',
    },
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'Domine Aqui',
    url: siteUrl,
    inLanguage: 'pt-BR',
    description: SITE_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/lead/{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${newsreader.variable} ${sourceSans.variable} ${plexMono.variable}`}
    >
      <head>
        {/* Cor de fundo na PRIMEIRA pintura.
            O `globals.css` é uma folha externa: até ela chegar, o navegador
            pinta o fundo padrão dele — branco no navegador comum, preto no app
            instalado em tema escuro. Dentro de um app em tela cheia esse
            piscar de tela vazia é o que assusta ("abriu preto"). Estas quatro
            linhas viajam no HTML, então valem antes de qualquer download.
            Os valores são os mesmos de `--background` (globals.css) em cada
            tema, então quando a folha chega não há troca de cor. */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html{background-color:#F5F1EB}' +
              '@media (prefers-color-scheme:dark){html{background-color:#0B130F}}' +
              'html.dark{background-color:#0B130F}' +
              'html.light{background-color:#F5F1EB}',
          }}
        />
        {/* Telas de partida do iPhone/iPad. Sem elas, o intervalo entre tocar
            no ícone e a primeira pintura é um retângulo preto — ver
            lib/pwa/splash.ts. O iOS casa a imagem por media query exata, então
            é uma tag por classe de aparelho.

            As duas de RESERVA vêm primeiro de propósito: elas casam com
            qualquer aparelho (filtram só a orientação), e vindo antes deixam as
            específicas prevalecerem onde existem. Aparelho fora da tabela — o
            iPhone que ainda não saiu — cai na reserva e abre com a marca em vez
            de abrir preto. */}
        {TELAS_DE_RESERVA.map((tela) => (
          <link
            key={arquivoDaTelaDeReserva(tela)}
            rel="apple-touch-startup-image"
            media={mediaDaTelaDeReserva(tela)}
            href={arquivoDaTelaDeReserva(tela)}
          />
        ))}
        {TELAS_DE_PARTIDA.map((tela) => (
          <link
            key={arquivoDaTelaDePartida(tela)}
            rel="apple-touch-startup-image"
            media={mediaDaTelaDePartida(tela)}
            href={arquivoDaTelaDePartida(tela)}
          />
        ))}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof Node!=='function'||!Node.prototype)return;var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(c&&c.parentNode!==this){return c}return r.apply(this,arguments)};var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this){return n}return i.apply(this,arguments)}})();`,
          }}
        />
        {/* Modo Lite resolvido antes da primeira pintura: aparelho fraco já
            recebe a versão leve, sem flash da versão pesada. */}
        <script dangerouslySetInnerHTML={{ __html: LITE_BOOTSTRAP_SCRIPT }} />
        {/* O Android dispara `beforeinstallprompt` logo depois do load, muitas
            vezes ANTES de o React hidratar. Este script segura o evento para o
            botão "Instalar" já existir na primeira visita — sem ele, o convite
            do Samsung/Chrome só apareceria depois de um recarregamento. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_CAPTURA_INSTALACAO }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildJsonLd(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildJsonLd(websiteJsonLd) }}
        />
      </head>
      <body className={`${sourceSans.className} gradient-overlay gradient-overlay-dark flex flex-col min-h-screen`}>
        <LiteModeProvider>
        <UIPreferencesProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          /* Color transitions handled by View Transitions / .theme-animating — not per-node all */
          disableTransitionOnChange
        >
          <MaterialCartProvider>
           <ShopCartProvider>
            <FloatingDockProvider>
             <ScrollToTop />
             <RouteProgress />
             <VerifyEmailBanner />
             <ImageProtectionProvider>
               <div className="flex-1 flex flex-col">
                 {children}
               </div>
               <Footer />
               <AppChrome />
               <MobileFloatingDock />
               <MobileBackButton />
               <RegisterSW />
               <InstallPrompt />
               <TactileFeedback />
               <LiteModePrompt />
             </ImageProtectionProvider>
            </FloatingDockProvider>
           </ShopCartProvider>
          </MaterialCartProvider>
          <Analytics />
          <SpeedInsights />
          <MetaPixel />
        </ThemeProvider>
        </UIPreferencesProvider>
        </LiteModeProvider>
      </body>
    </html>
  )
}
