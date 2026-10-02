'use client'

import Link from 'next/link'
import { useState } from 'react'
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

function CartaoDeConexao({
  conexao,
  compacto,
  className,
}: {
  conexao: Conexao
  compacto: boolean
  className?: string
}) {
  return (
    <li className={cn('flex items-start gap-2 rounded-lg border border-border bg-background p-2.5 sm:p-3', className)}>
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

/**
 * Quantos itens cada etapa mostra antes do "Ver todos". No painel ao pé da
 * ficha: três a partir do tablet (uma linha de grade no PC) e dois no celular,
 * onde cada cartão ocupa a largura inteira e a trilha passaria de dois mil
 * pixels de rolagem. Na trilha completa: seis — sem isso, os doze marcadores
 * renais soterram a imagem e a patologia, que é o que se veio estudar.
 */
const VISIVEIS_NO_PAINEL = 3
const VISIVEIS_NA_TRILHA = 6

function EtapaDaTrilha({
  etapa,
  itens,
  compacto,
}: {
  etapa: EtapaDoEstudo
  itens: Conexao[]
  compacto: boolean
}) {
  const [aberta, setAberta] = useState(false)
  const info = ETAPAS[etapa]
  const limite = compacto ? VISIVEIS_NO_PAINEL : VISIVEIS_NA_TRILHA
  // No painel, o celular já recolhe a partir do terceiro item.
  const recolhe = !aberta && itens.length > (compacto ? 2 : limite)
  const visiveis = recolhe ? itens.slice(0, limite) : itens

  return (
    <li
      id={compacto ? undefined : `etapa-${etapa}`}
      className={cn(
        'relative scroll-mt-32',
        // PC: o título da etapa numa coluna à esquerda, os cartões à direita.
        compacto && 'xl:grid xl:grid-cols-[10rem_minmax(0,1fr)] xl:gap-4',
      )}
    >
      <div className="mb-2 flex items-baseline gap-2 xl:mb-0 xl:pt-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {info.numero}
        </span>
        <div className="min-w-0">
          <h3 className="font-heading text-sm font-semibold tracking-tight sm:text-base">{info.titulo}</h3>
          {!compacto ? <p className="text-xs text-muted-foreground">{info.pergunta}</p> : null}
        </div>
      </div>
      <div>
        {/* Colunas pela largura do contêiner, não da tela: o mesmo painel
            cabe na ficha estreita da Semiologia e na larga da Radiologia —
            uma coluna no celular, duas no tablet, três no PC. */}
        <ul
          className={cn(
            'grid gap-2',
            compacto
              ? 'grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))]'
              : 'grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))]',
          )}
        >
          {visiveis.map((c, i) => (
            <CartaoDeConexao
              key={c.ref}
              conexao={c}
              compacto={compacto}
              className={compacto && recolhe && i >= 2 ? 'max-sm:hidden' : undefined}
            />
          ))}
        </ul>
        {recolhe ? (
          <button
            type="button"
            onClick={() => setAberta(true)}
            className={cn(
              'mt-2 inline-flex min-h-[40px] items-center rounded-md px-2 text-xs font-semibold text-primary hover:underline',
              // No tablet e no PC, três já cabem: o botão só aparece se sobrar.
              compacto && itens.length <= VISIVEIS_NO_PAINEL && 'sm:hidden',
            )}
          >
            Ver todos ({itens.length})
          </button>
        ) : null}
      </div>
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

  const presentes = ORDEM_DAS_ETAPAS.filter((e) => porEtapa.has(e))

  return (
    <div>
      {/* Na trilha completa, um sumário das etapas: no celular rola de lado;
          no PC fica preso logo abaixo do cabeçalho do app enquanto se desce. */}
      {!compacto && presentes.length > 1 ? (
        <nav
          aria-label="Etapas da trilha"
          className="sticky top-14 z-20 -mx-4 mb-4 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 sm:top-16 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <ul className="flex gap-1.5">
            {presentes.map((etapa) => (
              <li key={etapa} className="shrink-0">
                <a
                  href={`#etapa-${etapa}`}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <span className="text-primary">{ETAPAS[etapa].numero}</span>
                  {ETAPAS[etapa].titulo}
                  <span className="tabular-nums opacity-70">{(porEtapa.get(etapa) ?? []).reduce((n, g) => n + g.itens.length, 0)}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <ol className="space-y-5">
        {presentes.map((etapa) => (
          <EtapaDaTrilha
            key={etapa}
            etapa={etapa}
            itens={(porEtapa.get(etapa) ?? []).flatMap((g) => g.itens)}
            compacto={compacto}
          />
        ))}
      </ol>
    </div>
  )
}
