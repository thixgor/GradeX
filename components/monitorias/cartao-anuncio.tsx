'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck, Gift, PlayCircle, Star, Users, BookOpenCheck, MessagesSquare } from 'lucide-react'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { Avatar } from './base'

export interface CardAnuncio {
  id: string
  slug: string
  titulo: string
  materia: string
  conteudos: string[]
  preco: { modo: 'aula' | 'hora'; valorCentavos: number }
  grupo: { ativo: boolean; maxAlunos: number; menorValor: number | null }
  aulaGratis: boolean
  modos: { direto: unknown; negociacao: boolean; aCombinar: boolean }
  temVideo: boolean
  temMateriais: boolean
  stats: { reservas: number; nota: number; avaliacoes: number }
  tutor: { nome: string; fotoUrl: string | null; titulo: string } | null
}

export function precoTexto(a: Pick<CardAnuncio, 'preco' | 'modos'>) {
  const valor = formatarCentavos(a.preco.valorCentavos)
  const sufixo = a.preco.modo === 'hora' ? '/h' : '/aula'
  if (a.modos.aCombinar && !a.modos.direto && !a.modos.negociacao) return { rotulo: 'a partir de', valor, sufixo }
  return { rotulo: '', valor, sufixo }
}

export function CartaoAnuncio({ anuncio, indice = 0 }: { anuncio: CardAnuncio; indice?: number }) {
  const reduzir = useReducedMotion()
  const p = precoTexto(anuncio)
  return (
    <motion.div
      initial={reduzir ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(indice, 10) * 0.035, ease: [0.16, 1, 0.3, 1] }}
      className="group h-full"
    >
      <Link
        href={`/monitorias/anuncio/${anuncio.slug}`}
        className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_14px_36px_-18px_hsl(var(--primary)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0"
      >
        <div className="flex items-center gap-3">
          <Avatar nome={anuncio.tutor?.nome || '?'} url={anuncio.tutor?.fotoUrl} tamanho={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{anuncio.tutor?.nome}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {anuncio.stats.avaliacoes > 0 ? (
                <>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{anuncio.stats.nota.toFixed(1)}</span>
                  <span>({anuncio.stats.avaliacoes})</span>
                </>
              ) : (
                <span>Novo na plataforma</span>
              )}
            </p>
          </div>
          {anuncio.aulaGratis && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
              <Gift className="h-3 w-3" /> 1ª grátis
            </span>
          )}
        </div>

        <p className="mt-4 text-xs font-medium text-muted-foreground">{anuncio.materia}</p>
        <h3 className="mt-1 line-clamp-2 font-heading text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">{anuncio.titulo}</h3>
        {anuncio.conteudos.length > 0 && (
          <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{anuncio.conteudos.slice(0, 4).join(', ')}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          {anuncio.modos.direto ? (
            <span className="inline-flex items-center gap-1"><CalendarCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Agenda online</span>
          ) : (
            <span className="inline-flex items-center gap-1"><MessagesSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> Combina no chat</span>
          )}
          {anuncio.grupo.ativo && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" strokeWidth={1.75} /> Grupo até {anuncio.grupo.maxAlunos}</span>}
          {anuncio.temVideo && <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" strokeWidth={1.75} /> Vídeo</span>}
          {anuncio.temMateriais && <span className="inline-flex items-center gap-1"><BookOpenCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Materiais</span>}
        </div>

        <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="font-heading text-xl font-semibold tabular-nums text-foreground">
              {p.rotulo && <span className="mr-1 text-xs font-normal text-muted-foreground">{p.rotulo}</span>}
              {p.valor}
              <span className="text-sm font-normal text-muted-foreground">{p.sufixo}</span>
            </p>
            {anuncio.grupo.ativo && anuncio.grupo.menorValor ? (
              <p className="text-xs text-muted-foreground">ou {formatarCentavos(anuncio.grupo.menorValor)} em grupo</p>
            ) : null}
          </div>
          {anuncio.stats.reservas > 0 && (
            <p className="text-right text-xs text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{anuncio.stats.reservas}</span> {anuncio.stats.reservas === 1 ? 'aula vendida' : 'aulas vendidas'}
            </p>
          )}
        </div>
        </div>
      </Link>
    </motion.div>
  )
}
