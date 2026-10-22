'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Caderno } from '@/components/histologia/caderno'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { rotaDosDadosDoCatalogo, type DadosDoCaderno } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { BASE } from '@/lib/histologia/rotas'

/**
 * Caderno e meus dados. Nada aqui vem do servidor — o progresso vive no
 * navegador —, mas a página continua privativa: o portão pergunta à rota do
 * catálogo se o acesso está liberado antes de montar.
 */
export function PaginaDoCaderno({ comPatologia }: { comPatologia: boolean }) {
  return (
    <PortaoDaHistologia<DadosDoCaderno> url={rotaDosDadosDoCatalogo(['caderno'])}>
      {() => (
        <div className="surface-page min-h-screen">
          <NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />
          <div className="container mx-auto max-w-3xl px-4 py-6">
            <Link
              href={BASE}
              className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Manual da Histologia
            </Link>

            <header className="mb-6">
              <p className="editorial-mark mb-2">Seu progresso</p>
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Caderno e meus dados</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                O progresso deste módulo não vive num servidor: fica no armazenamento local deste navegador, mesmo
                estando sua conta conectada. Você pode levar tudo embora num arquivo ou apagar de vez, aqui mesmo.
              </p>
            </header>

            <Caderno />
          </div>
        </div>
      )}
    </PortaoDaHistologia>
  )
}
