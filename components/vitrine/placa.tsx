'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CoverImage } from '@/components/cover-image'
import { cn } from '@/lib/utils'

export interface AbaDaPlaca {
  rotulo: string
  titulo: string
  texto: string
  foto?: { src: string; alt: string }
}

/**
 * Um capítulo verde-escuro dividido ao meio: à esquerda uma imagem quadrada,
 * à direita três abas, o título com a descrição e as duas ações embaixo.
 *
 * As abas trocam o texto E a imagem — é a parte da vitrine que a pessoa mexe
 * para ver os três tipos de coisa que existem do outro lado da conta.
 */
export function PlacaComAbas({
  abas,
  acoes,
}: {
  abas: AbaDaPlaca[]
  acoes: { criar: string; entrar: string }
}) {
  const [ativa, setAtiva] = useState(0)
  const aba = abas[ativa] ?? abas[0]

  return (
    <section aria-labelledby="placa-titulo" className="bg-[#153d1f] text-[#f4f1ea]">
      <div className="grid min-h-[88svh] grid-cols-1 gap-y-10 px-4 py-16 md:grid-cols-2 md:gap-x-10 md:px-8 md:py-24">
        <div data-revelar className="relative order-2 aspect-square w-full self-center overflow-hidden bg-[#234f2c] md:order-none">
          {abas.map((item, i) =>
            item.foto ? (
              <div
                key={item.rotulo}
                aria-hidden={i !== ativa}
                className={cn('absolute inset-0 transition-opacity duration-500', i === ativa ? 'opacity-100' : 'opacity-0')}
              >
                <CoverImage src={item.foto.src} alt={item.foto.alt} sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
            ) : null,
          )}
        </div>

        <div className="order-1 flex flex-col justify-between gap-12 md:order-none">
          <div role="tablist" aria-label="Tipos" className="flex flex-wrap gap-x-7 gap-y-2" data-revelar>
            {abas.map((item, i) => (
              <button
                key={item.rotulo}
                type="button"
                role="tab"
                id={`placa-aba-${i}`}
                aria-selected={i === ativa}
                aria-controls="placa-painel"
                onClick={() => setAtiva(i)}
                className={cn(
                  'min-h-[44px] text-[18px] font-semibold underline-offset-[0.35em] transition-colors',
                  i === ativa ? 'text-[#f4f1ea] underline decoration-[#e2a43e] decoration-2' : 'text-[#b9c9bc] hover:text-[#f4f1ea]',
                )}
              >
                {item.rotulo}
              </button>
            ))}
          </div>

          <div id="placa-painel" role="tabpanel" aria-labelledby={`placa-aba-${ativa}`} data-revelar style={{ ['--i' as string]: 1 }}>
            <h2 id="placa-titulo" className="display t-titulo">
              {aba.titulo}
            </h2>
            <p className="mt-8 max-w-[36ch] text-[18px] leading-[1.5]">{aba.texto}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" data-revelar style={{ ['--i' as string]: 2 }}>
            <Link href={acoes.criar} className="botao botao-papel min-h-[60px] md:min-h-[72px]">
              Criar conta grátis
            </Link>
            <Link href={acoes.entrar} className="botao min-h-[60px] bg-[#234f2c] text-[#f4f1ea] md:min-h-[72px]">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
