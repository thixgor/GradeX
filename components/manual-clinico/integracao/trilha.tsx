'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { ETAPAS, MODULOS, ORDEM_DAS_ETAPAS } from '@/lib/manual-clinico/integracao/modulos'
import type { Conexao, EtapaDoEstudo, GrupoDeConexoes } from '@/lib/manual-clinico/integracao/tipos'
import { cn } from '@/lib/utils'

import { AdicionarAoEstudo } from './adicionar-ao-estudo'
import { IconeDoModulo } from './icone-do-modulo'

/**
 * A trilha do Estudo Integrado: as conexões arrumadas na ordem em que se
 * estuda — base normal, exame físico, laboratório, imagem, anatomia
 * patológica, clínica e conduta. Cada etapa diz a pergunta que responde, para
 * que a lista leia como roteiro, e não como "veja também".
 *
 * Usada no painel ao pé das fichas (compacta) e na página do tema (completa).
 */

export function SeloDoModulo({ modulo, className }: { modulo: Conexao['modulo']; className?: string }) {
  const info = MODULOS[modulo]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', info.cor, className)}>
      <IconeDoModulo modulo={modulo} className="h-3 w-3" />
      {info.nome}
    </span>
  )
}

function CartaoDeConexao({ conexao, compacto }: { conexao: Conexao; compacto: boolean }) {
  return (
    <li className="flex items-start gap-2 rounded-lg border border-border bg-background p-2.5 sm:p-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <SeloDoModulo modulo={conexao.modulo} />
          <span className="text-[11px] text-muted-foreground">{conexao.tipo}</span>
        </div>
        <Link
          href={conexao.href}
          className="group inline-flex items-start gap-1 text-sm font-semibold leading-snug text-foreground hover:text-primary"
        >
          <span>{conexao.titulo}</span>
          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100" aria-hidden />
        </Link>
        {!compacto && conexao.subtitulo ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{conexao.subtitulo}</p>
        ) : null}
        <p className="mt-1 text-[11px] font-medium text-muted-foreground">{conexao.rotuloDoMotivo}</p>
      </div>
      <AdicionarAoEstudo refs={[conexao.ref]} tituloSugerido={conexao.titulo} rotulo="Guardar" />
    </li>
  )
}

export function TrilhaDeConexoes({
  grupos,
  compacto = false,
}: {
  grupos: GrupoDeConexoes[]
  compacto?: boolean
}) {
  const porEtapa = new Map<EtapaDoEstudo, GrupoDeConexoes[]>()
  for (const g of grupos) porEtapa.set(g.etapa, [...(porEtapa.get(g.etapa) ?? []), g])

  return (
    <ol className="space-y-5">
      {ORDEM_DAS_ETAPAS.filter((e) => porEtapa.has(e)).map((etapa) => {
        const info = ETAPAS[etapa]
        const itens = (porEtapa.get(etapa) ?? []).flatMap((g) => g.itens)
        return (
          <li key={etapa} className="relative">
            <div className="mb-2 flex items-baseline gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {info.numero}
              </span>
              <div className="min-w-0">
                <h3 className="font-heading text-sm font-semibold tracking-tight sm:text-base">{info.titulo}</h3>
                {!compacto ? <p className="text-xs text-muted-foreground">{info.pergunta}</p> : null}
              </div>
            </div>
            <ul className={cn('grid gap-2', compacto ? 'sm:grid-cols-2' : 'md:grid-cols-2')}>
              {itens.map((c) => (
                <CartaoDeConexao key={c.ref} conexao={c} compacto={compacto} />
              ))}
            </ul>
          </li>
        )
      })}
    </ol>
  )
}
