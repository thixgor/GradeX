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
      layout
      initial={reduzir ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: Math.min(indice, 12) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduzir ? undefined : { y: -4 }}
      className="group h-full"
    >
      <Link
        href={`/monitorias/anuncio/${anuncio.slug}`}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative h-24 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
          <span className="absolute left-4 top-3 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
            {anuncio.materia}
          </span>
          {anuncio.aulaGratis && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-amber-950 shadow">
              <Gift className="h-3 w-3" /> 1ª aula grátis
            </span>
          )}
          <div className="absolute -bottom-7 left-4">
            <Avatar nome={anuncio.tutor?.nome || '?'} url={anuncio.tutor?.fotoUrl} tamanho={56} className="ring-4 ring-card" />
          </div>
        </div>
        <div className="flex flex-1 flex-col px-4 pb-4 pt-9">
          <p className="text-xs font-medium text-muted-foreground">{anuncio.tutor?.nome}</p>
          <h3 className="mt-0.5 line-clamp-2 font-heading text-base font-semibold leading-snug text-foreground group-hover:text-primary">
            {anuncio.titulo}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {anuncio.conteudos.slice(0, 3).map((c) => (
              <span key={c} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                {c}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {anuncio.modos.direto ? (
              <span className="inline-flex items-center gap-1"><CalendarCheck className="h-3.5 w-3.5 text-primary" /> Agenda online</span>
            ) : (
              <span className="inline-flex items-center gap-1"><MessagesSquare className="h-3.5 w-3.5 text-primary" /> Combina no chat</span>
            )}
            {anuncio.grupo.ativo && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-primary" /> Grupo até {anuncio.grupo.maxAlunos}</span>}
            {anuncio.temVideo && <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5 text-primary" /> Vídeo</span>}
            {anuncio.temMateriais && <span className="inline-flex items-center gap-1"><BookOpenCheck className="h-3.5 w-3.5 text-primary" /> Materiais</span>}
          </div>
          <div className="mt-auto flex items-end justify-between pt-4">
            <div>
              {p.rotulo && <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{p.rotulo}</p>}
              <p className="font-heading text-xl font-bold text-foreground">
                {p.valor}
                <span className="text-xs font-medium text-muted-foreground">{p.sufixo}</span>
              </p>
              {anuncio.grupo.ativo && anuncio.grupo.menorValor ? (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">em grupo desde {formatarCentavos(anuncio.grupo.menorValor)}</p>
              ) : null}
            </div>
            <div className="text-right text-xs">
              {anuncio.stats.avaliacoes > 0 ? (
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {anuncio.stats.nota.toFixed(1)}
                  <span className="font-normal text-muted-foreground">({anuncio.stats.avaliacoes})</span>
                </span>
              ) : (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">Novo</span>
              )}
              {anuncio.stats.reservas > 0 && (
                <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  {anuncio.stats.reservas} aluno{anuncio.stats.reservas === 1 ? '' : 's'} já {anuncio.stats.reservas === 1 ? 'contratou' : 'contrataram'}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
