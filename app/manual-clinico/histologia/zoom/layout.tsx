import { HOST_DO_ACERVO } from '@/lib/histologia-zoom/fonte'

/**
 * Layout da Histologia com Zoom: só abre cedo a conexão com o servidor de
 * tiles. DNS + TLS saem do caminho crítico do primeiro tile — o elemento mais
 * pesado da tela e o que o aluno está esperando.
 *
 * `crossOrigin="anonymous"` tem de casar com o modo CORS com que o
 * visualizador pede os tiles; senão o navegador abre outra conexão.
 */
export default function LayoutDoZoom({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href={HOST_DO_ACERVO} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={HOST_DO_ACERVO} />
      {children}
    </>
  )
}
