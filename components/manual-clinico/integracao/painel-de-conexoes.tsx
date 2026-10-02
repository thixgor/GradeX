'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Loader2, Route, Sparkles } from 'lucide-react'

import type { RespostaConexoes } from '@/lib/manual-clinico/integracao/tipos'
import { cn } from '@/lib/utils'

import { AdicionarAoEstudo } from './adicionar-ao-estudo'
import { buscarConexoes, rotaDoTema } from './api'
import { TrilhaDeConexoes } from './trilha'

/**
 * O corpo do painel "Estude este tema em todos os manuais": busca as conexões
 * e desenha a trilha. Só é baixado quando a pessoa chega perto do fim da
 * ficha — quem carrega é `ConexoesDoManual`, que é leve.
 */
export default function PainelDeConexoes({
  refOrigem,
  titulo,
  className,
}: {
  refOrigem: string
  titulo: string
  className?: string
}) {
  const [dados, setDados] = useState<RespostaConexoes | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'oculto'>('carregando')

  useEffect(() => {
    let cancelado = false
    setEstado('carregando')
    buscarConexoes({ ref: refOrigem })
      .then((r) => {
        if (cancelado) return
        setDados(r)
        setEstado(r.total > 0 ? 'pronto' : 'oculto')
      })
      .catch(() => {
        if (!cancelado) setEstado('oculto')
      })
    return () => {
      cancelado = true
    }
  }, [refOrigem])

  if (estado === 'oculto') return null
  const todas = dados ? dados.grupos.flatMap((g) => g.itens.map((i) => i.ref)) : []
  const modulos = dados ? new Set(dados.grupos.map((g) => g.modulo)).size : 0

  return (
    <section
      aria-labelledby={`conexoes-${refOrigem}`}
      className={cn('mx-auto w-full max-w-6xl px-4 py-8', className)}
    >
      <div className="rounded-xl border border-primary/20 bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="editorial-mark mb-1 inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Estudo Integrado
            </p>
            <h2 id={`conexoes-${refOrigem}`} className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
              Estude este tema em todos os manuais
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {estado === 'pronto'
                ? `${todas.length} conexões em ${modulos} manuais, na ordem em que se estuda: do tecido normal à conduta.`
                : 'Procurando o mesmo assunto nos outros manuais…'}
            </p>
          </div>
          {estado === 'pronto' ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href={rotaDoTema({ ref: refOrigem })}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground"
              >
                <Route className="h-4 w-4" aria-hidden /> Abrir trilha completa
              </Link>
              <AdicionarAoEstudo
                refs={[refOrigem, ...todas]}
                tituloSugerido={titulo}
                rotulo="Guardar tudo"
                variante="botao"
              />
            </div>
          ) : null}
        </div>

        {estado === 'pronto' && dados ? (
          <TrilhaDeConexoes grupos={dados.grupos} compacto />
        ) : (
          <p className="inline-flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Montando as conexões…
          </p>
        )}
      </div>
    </section>
  )
}
