'use client'

import Script from 'next/script'
import { META_PIXEL_ID } from '@/lib/meta-pixel'

// Injeta o código-base do Meta Pixel e dispara o PageView inicial.
// Não renderiza nada quando o ID não está configurado — o rastreamento fica
// completamente desligado até NEXT_PUBLIC_META_PIXEL_ID ser definido.
export function MetaPixel() {
  if (!META_PIXEL_ID) return null
  return (
    <>
      {/* lazyOnload: o fbevents.js (~70KB + handshake TLS de terceiro) entrava
          exatamente quando o hero e as fontes disputavam a banda no mobile.
          Com lazyOnload ele carrega depois do `load`, que dispara para
          qualquer visitante real — o PageView continua sendo enviado.
          Se a atribuição do Meta cair, basta voltar para "afterInteractive". */}
      <Script id="meta-pixel" strategy="lazyOnload">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
        fbq('track', 'PageView');`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
