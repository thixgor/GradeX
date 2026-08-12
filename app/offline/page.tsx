import type { Metadata } from 'next'
import { CloudOff } from 'lucide-react'
import { BotaoTentarNovamente } from '@/components/pwa/botao-tentar-novamente'

export const metadata: Metadata = {
  title: 'Sem conexão',
  description: 'Você está sem internet no momento.',
  robots: { index: false, follow: false },
}

/**
 * Tela servida pelo service worker quando a navegação falha por falta de rede.
 *
 * Ela existe por causa do app instalado: no navegador, a tela de erro padrão é
 * esperada; dentro de um app aberto em tela cheia, o dinossauro do Chrome
 * parece o DomineAqui ter quebrado. O service worker guarda uma cópia desta
 * página no install (ver public/sw.js) — por isso ela precisa ser estática e
 * não depender de nenhuma chamada de API.
 */
export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
        {/* `<img>` cru de propósito: o otimizador de imagem do Next serviria a
            partir de /_next/image, uma URL que o service worker não tem como
            ter no cache. Este caminho literal é justamente o que ele guarda
            junto com a página. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 rounded-2xl opacity-40"
        />
        <CloudOff
          className="absolute h-9 w-9 text-foreground"
          strokeWidth={2}
          aria-hidden
        />
      </div>

      <h1 className="text-2xl font-bold sm:text-3xl">Você está sem internet</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        O DomineAqui precisa de conexão para carregar suas provas, flashcards e
        materiais. Nada do seu progresso se perde — está tudo salvo na sua conta.
      </p>

      <BotaoTentarNovamente />

      <p className="mt-10 max-w-sm text-xs leading-relaxed text-muted-foreground">
        Dica: no metrô, no ônibus ou em plantão sem sinal, baixe os PDFs dos seus
        materiais antes de sair — eles abrem sem internet.
      </p>
    </div>
  )
}
