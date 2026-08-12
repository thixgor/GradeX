import type { MetadataRoute } from 'next'

// Web App Manifest — servido pelo Next em /manifest.webmanifest.
// É este arquivo que transforma o site em app instalável no Android (Chrome e
// Samsung Internet) e no iPhone: ícone próprio, abertura em tela cheia, splash
// screen com a cor da marca e atalhos no toque longo do ícone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DomineAqui — Estudo Inteligente para Medicina',
    short_name: 'DomineAqui',
    description:
      'Provas, flashcards, cronogramas, materiais e estudo guiado por IA. Estude para residência com inteligência.',
    lang: 'pt-BR',
    dir: 'ltr',
    id: '/',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    // O Android tenta cada modo na ordem até um funcionar. `standalone` é o
    // alvo; `minimal-ui` é a rede de segurança em navegadores que não o
    // suportam — sem isso eles caem direto no `browser`, com barra de endereço
    // aparecendo dentro do "app".
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#0B1F1A',
    theme_color: '#0B1F1A',
    categories: ['education', 'medical'],
    // Não existe app nativo na Play Store: dizemos isso explicitamente para o
    // Android não segurar o convite de instalação esperando um pacote.
    prefer_related_applications: false,
    related_applications: [],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // `maskable` é arte separada, com o desenho dentro da "safe zone" de 80%.
      // O One UI da Samsung recorta o ícone num squircle e o Pixel num círculo:
      // reaproveitar a arte quadrada aqui faria o recorte comer as bordas.
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      // Ícone temático do Android 13+ / One UI 5+: o launcher descarta as cores
      // e pinta a silhueta com a cor do papel de parede.
      {
        src: '/icon-mono-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'monochrome',
      },
    ],
    // Menu de toque longo no ícone (Android/One UI). Quatro é o teto prático
    // que os launchers exibem.
    shortcuts: [
      {
        name: 'Provas',
        short_name: 'Provas',
        description: 'Resolver provas e atividades avaliativas',
        url: '/provas',
        icons: [{ src: '/shortcuts/provas.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Banco de Questões',
        short_name: 'Questões',
        description: 'Treinar por assunto no banco de questões',
        url: '/banco-questoes',
        icons: [
          { src: '/shortcuts/banco-questoes.png', sizes: '96x96', type: 'image/png' },
        ],
      },
      {
        name: 'Flashcards',
        short_name: 'Flashcards',
        description: 'Revisar flashcards com repetição espaçada',
        url: '/flashcards',
        icons: [
          { src: '/shortcuts/flashcards.png', sizes: '96x96', type: 'image/png' },
        ],
      },
      {
        name: 'Cronogramas',
        short_name: 'Cronograma',
        description: 'Ver o cronograma de estudos de hoje',
        url: '/cronogramas',
        icons: [
          { src: '/shortcuts/cronogramas.png', sizes: '96x96', type: 'image/png' },
        ],
      },
    ],
  }
}
