'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowRight, CalendarCheck, FileCheck2, Gift, GraduationCap, Coins, RotateCcw, Search, ShieldCheck, Users, Wallet } from 'lucide-react'
import { PageScaffold } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { CartaoAnuncio, type CardAnuncio } from '@/components/monitorias/cartao-anuncio'
import { Esqueleto, Vazio, api } from '@/components/monitorias/base'
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

type Publico = 'aprender' | 'ensinar'

const FILTROS = [
  { chave: 'gratis', rotulo: 'Aula grátis', icone: Gift },
  { chave: 'grupo', rotulo: 'Em grupo', icone: Users },
  { chave: 'direto', rotulo: 'Agenda online', icone: CalendarCheck },
] as const

const COMO_FUNCIONA = [
  { titulo: 'Escolha', texto: 'Veja o vídeo, a história e as avaliações. Pergunte antes de contratar.' },
  { titulo: 'Agende', texto: 'Pegue um horário livre na agenda ou combine dia e valor no chat.' },
  { titulo: 'Aprenda', texto: 'Contrato assinado e PIX protegido. O monitor só recebe depois da aula.' },
]

const PARA_MONITOR = [
  { icone: Coins, titulo: 'Você define o preço', texto: 'Por hora ou por aula, com desconto para grupos. Anunciar é grátis.' },
  { icone: CalendarCheck, titulo: 'Sua agenda, suas regras', texto: 'Marque os horários livres. O aluno agenda e paga sozinho.' },
  { icone: Wallet, titulo: 'Recebe sem cobrar ninguém', texto: 'PIX na sua conta 48h depois da aula. Contrato e comprovante automáticos.' },
]

export default function VitrineMonitorias() {
  const reduzir = useReducedMotion()
  const [publico, setPublico] = useState<Publico>('aprender')
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [materia, setMateria] = useState('')
  const [filtros, setFiltros] = useState<Record<string, boolean>>({})
  const [ordem, setOrdem] = useState('recentes')
  const [pagina, setPagina] = useState(1)
  const [dados, setDados] = useState<RespostaVitrine | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [numeros, setNumeros] = useState<RespostaVitrine['numeros']>(null)
  const [destaques, setDestaques] = useState<CardAnuncio[]>([])

  // Lembra a escolha (aprender/ensinar) entre visitas. Só conveniência.
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('monitorias-publico')
      if (salvo === 'ensinar' || salvo === 'aprender') setPublico(salvo)
    } catch {}
  }, [])
  function escolher(p: Publico) {
    setPublico(p)
    try {
      localStorage.setItem('monitorias-publico', p)
    } catch {}
  }

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
      // Os destaques do herói são os mais bem avaliados da primeira carga.
      setDestaques((d) => (d.length ? d : [...r.itens].sort((a, b) => b.stats.nota * 10 + b.stats.reservas - (a.stats.nota * 10 + a.stats.reservas)).slice(0, 2)))
    } catch {
      setDados({ itens: [], total: 0, pagina: 1, paginas: 0, materias: [] })
    } finally {
      setCarregando(false)
    }
  }, [url])

  useEffect(() => {
    carregar()
  }, [carregar])

  const filtrando = !!(buscaAplicada || materia || Object.values(filtros).some(Boolean))

  function irParaLista() {
    document.getElementById('lista-monitorias')?.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <PageScaffold wide>
      {/* ── Herói: uma chave para os dois públicos ─────────────────────── */}
      <section className="grid items-center gap-10 pb-12 pt-2 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14 lg:pb-16 lg:pt-6">
        <div>
          <div className="inline-flex rounded-xl bg-muted/70 p-1" role="tablist" aria-label="O que você procura">
            {(['aprender', 'ensinar'] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={publico === p}
                onClick={() => escolher(p)}
                className={cn('relative rounded-lg px-4 py-1.5 text-sm font-medium transition-colors', publico === p ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {publico === p && <motion.span layoutId="publico-heroi" className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="relative">{p === 'aprender' ? 'Quero aprender' : 'Quero ensinar'}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={publico}
              initial={reduzir ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduzir ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {publico === 'aprender' ? (
                <>
                  <h1 className="mt-6 font-heading text-[2.4rem] font-semibold leading-[1.05] text-foreground sm:text-5xl lg:text-[3.4rem]">
                    Aulas com quem já passou pela mesma prova.
                  </h1>
                  <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground">
                    Particular ou em grupo, com monitores da comunidade. Pagamento por PIX com devolução garantida.
                  </p>
                  <form
                    className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.25)] focus-within:border-primary/50"
                    onSubmit={(e) => {
                      e.preventDefault()
                      setBuscaAplicada(busca.trim())
                      irParaLista()
                    }}
                  >
                    <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <label htmlFor="busca-monitoria" className="sr-only">Buscar matéria ou assunto</label>
                    <input
                      id="busca-monitoria"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Matéria ou assunto, ex.: ECG"
                      className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
                    />
                    <Button type="submit" className="h-11 rounded-xl px-5">Buscar</Button>
                  </form>
                </>
              ) : (
                <>
                  <h1 className="mt-6 font-heading text-[2.4rem] font-semibold leading-[1.05] text-foreground sm:text-5xl lg:text-[3.4rem]">
                    Ganhe dinheiro ensinando o que você domina.
                  </h1>
                  <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground">
                    Você define preço e horários. A plataforma cuida do pagamento, do contrato e da agenda.
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link href="/monitorias/painel">
                      <Button className="h-12 rounded-xl px-6 text-base">
                        Começar a ensinar <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <a href="#para-monitores" className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
                      Como funciona para o monitor
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Visual do herói: componentes reais, não figuras (no celular, só no modo ensinar) */}
        <div className={cn('relative', publico === 'aprender' && 'hidden lg:block')}>
          <AnimatePresence mode="wait" initial={false}>
            {publico === 'aprender' ? (
              <motion.div
                key="destaques"
                initial={reduzir ? false : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduzir ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="grid gap-4 xl:grid-cols-2"
              >
                {destaques.length
                  ? destaques.map((a, i) => (
                      <div key={a.id} className={cn(i === 1 && 'xl:mt-10')}>
                        <CartaoAnuncio anuncio={a} indice={i} />
                      </div>
                    ))
                  : [0, 1].map((i) => <Esqueleto key={i} className={cn('h-72', i === 1 && 'xl:mt-10')} />)}
              </motion.div>
            ) : (
              <motion.div
                key="simulador"
                initial={reduzir ? false : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduzir ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <SimuladorGanhos compacto />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Garantia em uma linha ────────────────────────────────────────── */}
      <section className="mb-14 grid gap-4 border-y border-border py-5 sm:grid-cols-3" aria-label="Garantias">
        {[
          { icone: ShieldCheck, texto: 'O monitor só recebe 48h depois da aula' },
          { icone: RotateCcw, texto: 'Desistiu em até 7 dias? 100% de volta' },
          { icone: FileCheck2, texto: 'Contrato assinado e comprovante em PDF' },
        ].map((g) => (
          <p key={g.texto} className="flex items-center gap-3 text-sm text-foreground">
            <g.icone className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} /> {g.texto}
          </p>
        ))}
      </section>

      {publico === 'ensinar' && <ParaMonitores comSimulador={false} />}

      {/* ── Lista ───────────────────────────────────────────────────────── */}
      <section id="lista-monitorias" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold">{publico === 'ensinar' ? 'Quem já ensina por aqui' : 'Monitorias disponíveis'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {dados ? `${dados.total} ${dados.total === 1 ? 'monitoria' : 'monitorias'}` : 'Carregando'}
              {numeros && numeros.avaliacoes >= 5 ? `, nota média ${numeros.nota.toFixed(1)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {publico === 'ensinar' && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" aria-label="Buscar monitoria" className="h-9 w-44 rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary/50" />
              </div>
            )}
            <label htmlFor="ordem-vitrine" className="sr-only">Ordenar</label>
            <select
              id="ordem-vitrine"
              value={ordem}
              onChange={(e) => {
                setOrdem(e.target.value)
                setPagina(1)
              }}
              className="h-9 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/50"
            >
              <option value="recentes">Mais recentes</option>
              <option value="nota">Melhor avaliadas</option>
              <option value="preco">Menor preço</option>
            </select>
          </div>
        </div>

        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip ativo={!materia} onClick={() => { setMateria(''); setPagina(1) }}>Todas</Chip>
          {dados?.materias.map((m) => (
            <Chip key={m} ativo={m === materia} onClick={() => { setMateria(m === materia ? '' : m); setPagina(1) }}>{m}</Chip>
          ))}
          <span className="mx-1 w-px shrink-0 self-stretch bg-border" aria-hidden />
          {FILTROS.map((f) => (
            <Chip key={f.chave} ativo={!!filtros[f.chave]} onClick={() => { setFiltros((x) => ({ ...x, [f.chave]: !x[f.chave] })); setPagina(1) }}>
              <f.icone className="h-3.5 w-3.5" strokeWidth={1.75} /> {f.rotulo}
            </Chip>
          ))}
        </div>

        {carregando && !dados ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => <Esqueleto key={i} className="h-72" />)}
          </div>
        ) : dados && dados.itens.length ? (
          <>
            <div className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4', carregando && 'opacity-60 transition-opacity')}>
              <AnimatePresence>
                {dados.itens.map((a, i) => <CartaoAnuncio key={a.id} anuncio={a} indice={i} />)}
              </AnimatePresence>
            </div>
            {dados.paginas > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="outline" className="rounded-xl" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</Button>
                <span className="text-sm tabular-nums text-muted-foreground">{pagina} de {dados.paginas}</span>
                <Button variant="outline" className="rounded-xl" disabled={pagina >= dados.paginas} onClick={() => setPagina((p) => p + 1)}>Próxima</Button>
              </div>
            )}
          </>
        ) : (
          <Vazio
            icone={<GraduationCap className="h-5 w-5" />}
            titulo={filtrando ? 'Nada com esses filtros' : 'Ainda não há monitorias por aqui'}
            texto={filtrando ? 'Tente outra palavra ou tire algum filtro.' : 'Que tal ser a primeira pessoa a ensinar o que você domina?'}
            acao={
              filtrando ? (
                <Button variant="outline" className="rounded-xl" onClick={() => { setBusca(''); setMateria(''); setFiltros({}) }}>Limpar filtros</Button>
              ) : (
                <Link href="/monitorias/painel"><Button className="rounded-xl">Anunciar minha monitoria</Button></Link>
              )
            }
          />
        )}
      </section>

      {/* ── Como funciona (aluno): linha do tempo ──────────────────────── */}
      {!filtrando && publico === 'aprender' && (
        <section className="mt-20">
          <h2 className="font-heading text-2xl font-semibold">Como funciona para o aluno</h2>
          <ol className="relative mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            <span className="absolute left-[15px] top-4 hidden h-px w-[calc(100%-30px)] bg-border sm:block" aria-hidden />
            {COMO_FUNCIONA.map((p, i) => (
              <li key={p.titulo} className="relative flex gap-4 sm:block">
                <span className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-sm font-semibold text-primary-foreground">{i + 1}</span>
                <div className="sm:mt-4">
                  <p className="font-heading text-lg font-semibold">{p.titulo}</p>
                  <p className="mt-1 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {publico === 'aprender' && <ParaMonitores comSimulador />}
    </PageScaffold>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        ativo ? 'bg-foreground text-background' : 'bg-card text-foreground ring-1 ring-border hover:ring-primary/40',
      )}
    >
      {children}
    </button>
  )
}

const PASSOS_MONITOR = [
  { titulo: 'Crie o anúncio', texto: 'Título, conteúdos, um vídeo curto e o preço. Passamos por uma revisão rápida.' },
  { titulo: 'Abra a agenda', texto: 'Pinte seus horários livres. Quem quiser combinar fala com você no chat.' },
  { titulo: 'Dê a aula e receba', texto: 'O aluno paga antes. O valor cai por PIX 48h depois da aula.' },
]

function ParaMonitores({ comSimulador }: { comSimulador: boolean }) {
  return (
    <section id="para-monitores" className={cn('scroll-mt-24 rounded-3xl bg-primary/10 p-6 sm:p-10 dark:bg-primary/[0.12]', comSimulador ? 'mt-20' : 'mb-16')}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <h2 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">
            {comSimulador ? 'Domina uma matéria? Isso vale dinheiro.' : 'Tudo o que você precisa para dar aula'}
          </h2>
          <p className="mt-3 max-w-[44ch] text-base leading-relaxed text-muted-foreground">Monte seu anúncio em 5 minutos. A gente cuida do resto.</p>
          <ul className="mt-8 space-y-5">
            {PARA_MONITOR.map((b) => (
              <li key={b.titulo} className="flex gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <b.icone className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-semibold">{b.titulo}</p>
                  <p className="mt-0.5 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">{b.texto}</p>
                </div>
              </li>
            ))}
          </ul>
          {comSimulador && (
            <Link href="/monitorias/painel">
              <Button className="mt-8 h-12 rounded-xl px-6 text-base">Começar a ensinar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          )}
        </div>
        {comSimulador ? (
          <SimuladorGanhos semBotao />
        ) : (
          <ol className="space-y-3">
            {PASSOS_MONITOR.map((p, i) => (
              <li key={p.titulo} className="flex gap-4 rounded-2xl bg-card p-5 shadow-sm">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-sm font-semibold text-primary-foreground">{i + 1}</span>
                <div>
                  <p className="font-heading text-lg font-semibold">{p.titulo}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
