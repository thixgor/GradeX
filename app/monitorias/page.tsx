'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Search, ShieldCheck, FileSignature, Receipt, Sparkles, GraduationCap, Gift, Users, CalendarCheck, ArrowRight, LayoutDashboard, SlidersHorizontal, Star, MousePointerClick, MessagesSquare, BadgeCheck } from 'lucide-react'
import { PageScaffold } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { CartaoAnuncio, type CardAnuncio } from '@/components/monitorias/cartao-anuncio'
import { Esqueleto, api } from '@/components/monitorias/base'
import { SimuladorGanhos } from '@/components/monitorias/simulador-ganhos'
import { cn } from '@/lib/utils'

interface RespostaVitrine {
  itens: CardAnuncio[]
  total: number
  pagina: number
  paginas: number
  materias: string[]
  numeros?: { monitores: number; aulas: number; avaliacoes: number; nota: number } | null
}

const PASSOS = [
  { icone: MousePointerClick, titulo: 'Escolha seu monitor', texto: 'Veja vídeo, história, avaliações e tire dúvidas antes de decidir.' },
  { icone: MessagesSquare, titulo: 'Agende ou combine', texto: 'Pegue um horário livre na agenda ou negocie dia, duração e valor no chat.' },
  { icone: BadgeCheck, titulo: 'Aprenda com garantia', texto: 'Contrato assinado, PIX protegido e o monitor só recebe depois da aula.' },
]

const FILTROS = [
  { chave: 'gratis', rotulo: 'Aula grátis', icone: Gift },
  { chave: 'grupo', rotulo: 'Em grupo', icone: Users },
  { chave: 'direto', rotulo: 'Agenda online', icone: CalendarCheck },
] as const

const GARANTIAS = [
  { icone: ShieldCheck, titulo: 'Pagamento protegido', texto: 'O monitor só recebe 48h depois da aula. Desistiu em 7 dias ou ele faltou? 100% de volta.' },
  { icone: FileSignature, titulo: 'Contrato assinado', texto: 'Tudo combinado vira contrato com assinatura eletrônica e PDF.' },
  { icone: Receipt, titulo: 'Comprovante formal', texto: 'PIX automático pelo Mercado Pago e comprovante na hora.' },
]

export default function VitrineMonitorias() {
  const reduzir = useReducedMotion()
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [materia, setMateria] = useState('')
  const [filtros, setFiltros] = useState<Record<string, boolean>>({})
  const [ordem, setOrdem] = useState('recentes')
  const [pagina, setPagina] = useState(1)
  const [dados, setDados] = useState<RespostaVitrine | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [numeros, setNumeros] = useState<RespostaVitrine['numeros']>(null)

  // Busca com pequena espera: não dispara uma requisição por tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAplicada(busca.trim())
      setPagina(1)
    }, 350)
    return () => clearTimeout(t)
  }, [busca])

  const url = useMemo(() => {
    const p = new URLSearchParams()
    if (buscaAplicada) p.set('q', buscaAplicada)
    if (materia) p.set('materia', materia)
    for (const [k, v] of Object.entries(filtros)) if (v) p.set(k, '1')
    if (ordem !== 'recentes') p.set('ordem', ordem)
    if (pagina > 1) p.set('pagina', String(pagina))
    return `/api/monitorias/publico/vitrine?${p.toString()}`
  }, [buscaAplicada, materia, filtros, ordem, pagina])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const r = await api<RespostaVitrine>(url)
      setDados(r)
      if (r.numeros) setNumeros(r.numeros)
    } catch {
      setDados({ itens: [], total: 0, pagina: 1, paginas: 0, materias: [] })
    } finally {
      setCarregando(false)
    }
  }, [url])

  useEffect(() => {
    carregar()
  }, [carregar])

  return (
    <PageScaffold wide>
      {/* Herói */}
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
        <motion.div initial={reduzir ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Monitorias
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold leading-tight sm:text-5xl">
            Aprenda com quem já <span className="text-amber-300">dominou</span> a matéria.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
            Aquela matéria que travou seu semestre fica clara em uma hora com quem já passou por ela. Aulas particulares ou em grupo (mais baratas), na agenda ou combinadas no chat — com PIX protegido.
          </p>
          {numeros && (numeros.monitores >= 3 || numeros.aulas >= 10) && (
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {numeros.monitores >= 3 && <span><strong className="font-heading text-2xl">{numeros.monitores}</strong> <span className="text-white/75">monitores</span></span>}
              {numeros.aulas >= 10 && <span><strong className="font-heading text-2xl">{numeros.aulas}</strong> <span className="text-white/75">aulas dadas</span></span>}
              {numeros.avaliacoes >= 5 && (
                <span className="inline-flex items-center gap-1"><Star className="h-5 w-5 fill-amber-300 text-amber-300" /><strong className="font-heading text-2xl">{numeros.nota.toFixed(1)}</strong> <span className="text-white/75">de nota média</span></span>
              )}
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-900/50" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Fisiologia, ECG, farmacologia..."
                className="h-12 w-full rounded-xl border-0 bg-white pl-10 pr-4 text-sm text-emerald-950 shadow-lg outline-none ring-amber-300 placeholder:text-emerald-900/40 focus:ring-2"
                aria-label="Buscar monitoria"
              />
            </div>
            <Link href="/monitorias/painel">
              <Button size="lg" className="h-12 w-full rounded-xl bg-amber-400 font-semibold text-amber-950 hover:bg-amber-300 sm:w-auto">
                <GraduationCap className="mr-2 h-4 w-4" /> Quero ser monitor
              </Button>
            </Link>
          </div>
        </motion.div>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          {GARANTIAS.map((g, i) => (
            <motion.div
              key={g.titulo}
              initial={reduzir ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="rounded-2xl bg-white/10 p-4 backdrop-blur"
            >
              <g.icone className="h-5 w-5 text-amber-300" />
              <p className="mt-2 text-sm font-semibold">{g.titulo}</p>
              <p className="mt-0.5 text-xs text-white/75">{g.texto}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Como funciona — some quando a pessoa já está buscando */}
      {!buscaAplicada && !materia && pagina === 1 && (
        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          {PASSOS.map((p, i) => (
            <motion.div
              key={p.titulo}
              initial={reduzir ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-2xl border border-border bg-card p-4"
            >
              <span className="absolute right-4 top-3 font-heading text-3xl font-bold text-primary/15">{i + 1}</span>
              <p.icone className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">{p.titulo}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{p.texto}</p>
            </motion.div>
          ))}
        </section>
      )}

      {/* Atalhos */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link href="/monitorias/minhas" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" /> Minhas monitorias
          </Link>
          <Link href="/monitorias/painel" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40">
            <LayoutDashboard className="h-3.5 w-3.5 text-primary" /> Painel do monitor
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={ordem}
            onChange={(e) => {
              setOrdem(e.target.value)
              setPagina(1)
            }}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
            aria-label="Ordenar"
          >
            <option value="recentes">Mais recentes</option>
            <option value="nota">Melhor avaliados</option>
            <option value="preco">Menor preço</option>
          </select>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => {
            setMateria('')
            setPagina(1)
          }}
          className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition', !materia ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40')}
        >
          Todas
        </button>
        {dados?.materias.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMateria(m === materia ? '' : m)
              setPagina(1)
            }}
            className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition', m === materia ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40')}
          >
            {m}
          </button>
        ))}
        <span className="mx-1 w-px shrink-0 bg-border" />
        {FILTROS.map((f) => (
          <button
            key={f.chave}
            type="button"
            onClick={() => {
              setFiltros((x) => ({ ...x, [f.chave]: !x[f.chave] }))
              setPagina(1)
            }}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              filtros[f.chave] ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300' : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <f.icone className="h-3.5 w-3.5" /> {f.rotulo}
          </button>
        ))}
      </div>

      {/* Grade */}
      {carregando && !dados ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Esqueleto key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : dados && dados.itens.length ? (
        <>
          <p className="mb-3 text-xs text-muted-foreground">{dados.total} monitoria{dados.total === 1 ? '' : 's'} encontrada{dados.total === 1 ? '' : 's'}</p>
          <motion.div layout className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', carregando && 'opacity-60')}>
            <AnimatePresence>
              {dados.itens.map((a, i) => (
                <CartaoAnuncio key={a.id} anuncio={a} indice={i} />
              ))}
            </AnimatePresence>
          </motion.div>
          {dados.paginas > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                {pagina} de {dados.paginas}
              </span>
              <Button variant="outline" size="sm" disabled={pagina >= dados.paginas} onClick={() => setPagina((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          )}
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 font-heading text-lg font-semibold">Nenhuma monitoria por aqui ainda</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {buscaAplicada || materia || Object.values(filtros).some(Boolean)
              ? 'Tente outra busca ou tire alguns filtros.'
              : 'Seja a primeira pessoa a ensinar o que você domina — e ganhe por isso.'}
          </p>
          <Link href="/monitorias/painel">
            <Button className="mt-5">
              Anunciar minha monitoria <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      )}

      <SimuladorGanhos className="mt-12" />
    </PageScaffold>
  )
}
