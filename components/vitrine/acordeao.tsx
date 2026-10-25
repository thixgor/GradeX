'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface Etapa {
  nome: string
  texto: string
}

/* Do mais escuro ao mais claro: a ordem das etapas é dita pela cor. */
const FUNDOS = ['#153d1f', '#234f2c', '#33633d', '#6b9873', '#9fbea3']
const TINTAS = ['#f4f1ea', '#f4f1ea', '#f4f1ea', '#0b1f1a', '#0b1f1a']

/**
 * Como funciona, contado como um acordeão deitado: a etapa aberta ocupa a
 * maior parte da faixa e as outras viram tiras com o nome em pé. No celular
 * as tiras empilham, e a aberta cresce até caber o texto.
 */
export function AcordeaoDeEtapas({
  titulo,
  introducao,
  etapas,
}: {
  titulo: string
  introducao: string
  etapas: Etapa[]
}) {
  const [aberta, setAberta] = useState(0)

  return (
    <section aria-labelledby="etapas-titulo" className="bg-[var(--papel)] text-[var(--tinta)]">
      <div className="px-4 py-20 md:px-8 md:py-32">
        <div className="grid grid-cols-1 gap-y-6 md:grid-cols-12 md:gap-x-6">
          <h2
            id="etapas-titulo"
            data-revelar
            className="display t-titulo md:col-span-5"
          >
            {titulo}
          </h2>
          <p data-revelar style={{ ['--i' as string]: 1 }} className="max-w-[46ch] text-[18px] leading-[1.55] md:col-start-7 md:col-end-12">
            {introducao}
          </p>
        </div>

        <div data-revelar style={{ ['--i' as string]: 2 }} className="mt-14 flex flex-col md:mt-16 md:h-[520px] md:flex-row">
          {etapas.map((etapa, i) => {
            const estaAberta = i === aberta
            return (
              <div
                key={etapa.nome}
                className={cn(
                  'etapa relative overflow-hidden',
                  estaAberta ? 'md:basis-[58%] md:grow-0' : 'md:basis-0 md:grow',
                )}
                style={{ background: FUNDOS[i % FUNDOS.length], color: TINTAS[i % TINTAS.length] }}
              >
                <button
                  type="button"
                  aria-expanded={estaAberta}
                  aria-controls={`etapa-${i}`}
                  onClick={() => setAberta(i)}
                  className={cn(
                    'flex w-full items-center px-5 text-left font-semibold',
                    'h-16 text-[18px]',
                    // Fechada, no desktop, a tira inteira é o botão e o nome sobe em pé.
                    estaAberta
                      ? 'md:h-auto md:pt-7 md:font-medium'
                      : 'md:absolute md:inset-0 md:h-full md:items-end md:pb-6',
                  )}
                >
                  <span
                    className={cn(
                      estaAberta ? 'etapa-nome-aberto' : 'md:[writing-mode:vertical-rl] md:rotate-180 md:text-[20px] md:whitespace-nowrap',
                    )}
                  >
                    {etapa.nome}
                  </span>
                </button>
                <div
                  id={`etapa-${i}`}
                  hidden={!estaAberta}
                  className="px-5 pb-7 md:absolute md:bottom-0 md:left-0 md:pb-8"
                >
                  <p className="max-w-[36ch] text-[18px] leading-[1.5]">{etapa.texto}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
