'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Barra fixa das Ferramentas Clínicas.
 *
 * Existe por causa de um defeito visível no celular: com `showHeader={false}`,
 * a casca do aplicativo desenha três botões **flutuantes** no topo (menu, modo
 * leve e tema). Eles ficam por cima de tudo, e o conteúdo rola por baixo — então
 * bastava rolar um pouco para o título da página, ou o nome da ferramenta,
 * aparecer cortado atrás do botão de menu.
 *
 * A barra resolve isso dando uma superfície opaca para os botões pousarem, em
 * vez de texto correndo atrás deles. E ganha uma segunda função: em vez de rolar
 * até o topo para voltar, a saída fica sempre à mão.
 *
 * Os recuos laterais são reservas para os botões da casca: 56px à esquerda
 * (menu, só no celular) e 152px à direita (modo leve + tema, em qualquer
 * tamanho). Sem eles o texto da barra nasceria embaixo dos botões — trocando um
 * problema de sobreposição por outro.
 */
export function BarraFerramentas({
  voltarHref,
  voltarLabel,
  titulo,
  subtitulo,
  className,
}: {
  voltarHref: string
  voltarLabel: string
  titulo?: string
  subtitulo?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85',
        className,
      )}
    >
      <div className="pwa-safe-top flex h-14 items-center gap-3 pl-14 pr-[9.5rem] lg:pl-4">
        <Link
          href={voltarHref}
          className="-m-1.5 inline-flex shrink-0 items-center gap-1.5 rounded-lg p-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {/* No celular a seta basta: o rótulo inteiro roubaria a largura do
              título, que é a informação que diz onde a pessoa está. */}
          <span className="hidden truncate sm:inline">{voltarLabel}</span>
        </Link>

        {titulo && (
          <div className="min-w-0 flex-1 border-l border-border pl-3">
            <p className="truncate text-sm font-semibold leading-tight">{titulo}</p>
            {subtitulo && (
              <p className="truncate text-[11px] leading-tight text-muted-foreground">{subtitulo}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
