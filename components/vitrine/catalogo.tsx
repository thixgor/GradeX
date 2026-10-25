'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ModuloPublico } from '@/lib/vitrines/dados'
import { cn } from '@/lib/utils'

const numero = (n: number) => n.toLocaleString('pt-BR')

/**
 * O catálogo do Banco como a conta gratuita o vê: os módulos são abas
 * empilhadas à esquerda e os tópicos do módulo escolhido viram faixas, cada
 * uma com quantas questões tem. Os números são os do acervo no momento em que
 * a página foi gerada.
 */
export function CatalogoDoBanco({ modulos, criarConta }: { modulos: ModuloPublico[]; criarConta: string }) {
  const [ativo, setAtivo] = useState(0)
  if (modulos.length === 0) return null
  const modulo = modulos[ativo] ?? modulos[0]

  return (
    <section aria-labelledby="catalogo-titulo" className="bg-[#e2a43e] text-[#0b1f1a]">
      <div className="px-4 py-20 md:px-8 md:py-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="catalogo-titulo" data-revelar className="display t-titulo">
            <span className="block">O catálogo,</span>
            <span className="block">tópico por tópico</span>
          </h2>
          <Link href={criarConta} data-revelar className="botao botao-tinta w-full md:w-auto">
            Criar conta e abrir questões
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-[minmax(200px,260px)_1fr] md:gap-10">
          <div
            role="tablist"
            aria-label="Módulos"
            aria-orientation="vertical"
            className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0"
          >
            {modulos.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={i === ativo}
                aria-controls="catalogo-faixas"
                onClick={() => setAtivo(i)}
                className={cn(
                  'flex min-h-[64px] min-w-[180px] shrink-0 flex-col justify-center px-4 py-2 text-left transition-colors md:min-w-0',
                  i === ativo ? 'bg-[#0b1f1a] text-[#f4f1ea]' : 'bg-[#eebd6a] hover:bg-[#f2c87f]',
                )}
              >
                <span className="text-[16px] font-semibold leading-tight">{m.nome}</span>
                <span className="num mt-0.5 text-[16px]">{numero(m.total)} questões</span>
              </button>
            ))}
          </div>

          <ul id="catalogo-faixas" role="tabpanel" aria-label={`Tópicos de ${modulo.nome}`} className="flex flex-col gap-1">
            {modulo.topicos.map((t, i) => (
              <li
                key={t.id}
                className={cn(
                  'grid min-h-[76px] grid-cols-[72px_1fr] items-center gap-x-4 px-5 py-3 md:grid-cols-[96px_1fr]',
                  i % 2 === 0 ? 'bg-[#f0c57a]' : 'bg-[#f5d498]',
                )}
              >
                <span className="num text-[20px] font-semibold">{numero(t.total)}</span>
                <span>
                  <span className="block text-[18px] font-medium leading-snug">{t.nome}</span>
                  <span className="block text-[16px] text-[#3c4d47]">
                    {t.subtopicos > 0
                      ? `${t.subtopicos} ${t.subtopicos === 1 ? 'subtópico' : 'subtópicos'}`
                      : 'questões do tópico inteiro'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
