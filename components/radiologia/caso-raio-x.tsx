'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Crosshair,
  Eye,
  Keyboard,
  Layers,
  ListChecks,
  Microscope,
  ScanSearch,
  Stethoscope,
  Target,
} from 'lucide-react'
import { CasoRaioXImagem } from '@/components/radiologia/caso-raio-x-imagem'
import type { CasoRaioX, GuiaCategoriaCasoRaioX } from '@/lib/radiologia/casos-raio-x'
import type { AchadoMarcado, DetalheCaso } from '@/lib/radiologia/casos-raio-x-detalhes'

export interface VizinhoCaso {
  slug: string
  titulo: string
  categoriaTitulo: string
}

const SECOES = [
  { id: 'panorama', rotulo: 'Panorama', icone: BookOpen },
  { id: 'filmes', rotulo: 'Filmes', icone: ScanSearch },
  { id: 'estruturas', rotulo: 'Estruturas', icone: Microscope },
  { id: 'roteiro', rotulo: 'Roteiro', icone: ListChecks },
  { id: 'conduta', rotulo: 'Conduta', icone: Stethoscope },
] as const

export function CasoRaioXPagina({
  caso,
  guia,
  detalhe,
  marcacoesPorImagem,
  anterior,
  proximo,
  posicao,
}: {
  caso: CasoRaioX
  guia: GuiaCategoriaCasoRaioX
  detalhe: DetalheCaso | null
  marcacoesPorImagem: Record<number, AchadoMarcado[]>
  anterior: VizinhoCaso | null
  proximo: VizinhoCaso | null
  posicao: { indice: number; total: number }
}) {
  const [ativa, setAtiva] = useState<string>('panorama')
  const [progresso, setProgresso] = useState(0)
  const conteudo = useRef<HTMLDivElement | null>(null)

  const secoes = useMemo(
    () => SECOES.filter((secao) => secao.id !== 'estruturas' || (detalhe?.estruturas.length ?? 0) > 0),
    [detalhe],
  )

  // Barra de progresso: a lâmina de luz do negatoscópio acompanhando a leitura.
  useEffect(() => {
    const aoRolar = () => {
      const alvo = conteudo.current
      if (!alvo) return
      const total = alvo.offsetTop + alvo.offsetHeight - window.innerHeight
      const atual = window.scrollY
      setProgresso(total > 0 ? Math.min(100, Math.max(0, (atual / total) * 100)) : 0)
    }
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRolar)
    return () => {
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('resize', aoRolar)
    }
  }, [])

  // Scrollspy do sumário.
  useEffect(() => {
    const alvos = secoes
      .map((secao) => document.getElementById(secao.id))
      .filter((no): no is HTMLElement => Boolean(no))
    if (!alvos.length) return
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas
          .filter((entrada) => entrada.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visivel) setAtiva(visivel.target.id)
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    )
    alvos.forEach((no) => observador.observe(no))
    return () => observador.disconnect()
  }, [secoes])

  const totalMarcacoes = Object.values(marcacoesPorImagem).reduce((n, lista) => n + lista.length, 0)

  return (
    <div className="rx surface-page min-h-screen">
      {/* ══════════════════ Cabeçalho ══════════════════ */}
      <header className="rx-painel rx-grade relative overflow-hidden border-b border-sky-400/15 text-white">
        <div className="rx-abaixo-flutuantes container relative mx-auto max-w-7xl px-4 pb-7 pt-4 sm:pb-8 sm:pt-5">
          <nav aria-label="Trilha de navegação" className="flex flex-wrap items-center gap-1.5 text-xs text-sky-100/50 sm:text-sm">
            <Link
              href="/manual-clinico/radiologia/raio-x/casos"
              className="-m-1 inline-flex items-center gap-1.5 rounded p-1 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Casos e alterações
            </Link>
            <span aria-hidden>›</span>
            <span className="truncate">{caso.categoriaTitulo}</span>
          </nav>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="editorial-mark !text-sky-300/80 [&::before]:bg-sky-300/60">
                Caso {posicao.indice} de {posicao.total} · {caso.categoriaTitulo}
              </p>
              <h1 className="mt-2 max-w-4xl font-heading text-2xl font-semibold tracking-tight sm:text-4xl sm:leading-[1.12]">
                {caso.titulo}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sky-100/60 sm:text-base">{caso.resumo}</p>
            </div>

            <dl className="grid grid-cols-3 gap-2 text-center lg:w-[300px]">
              <Metrica valor={caso.imagens.length} rotulo={caso.imagens.length === 1 ? 'radiografia' : 'radiografias'} />
              <Metrica valor={totalMarcacoes} rotulo="marcações" destaque />
              <Metrica valor={detalhe?.estruturas.length ?? 0} rotulo="estruturas" />
            </dl>
          </div>
        </div>
      </header>

      {/* ══════════════════ Sumário fixo ══════════════════ */}
      <nav
        aria-label="Seções do caso"
        data-rx-barra
        className="rx-fixo-topo sticky z-30 border-b border-border bg-background/95 backdrop-blur-md"
      >
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-sky-500/70 transition-[width] duration-150" style={{ width: `${progresso}%` }} />
        <div className="rx-rolagem container mx-auto flex max-w-7xl snap-x gap-1 overflow-x-auto px-4 py-2 [mask-image:linear-gradient(90deg,#000_calc(100%-24px),transparent)] sm:[mask-image:none]">
          {secoes.map((secao) => {
            const Icone = secao.icone
            const ativo = ativa === secao.id
            return (
              <a
                key={secao.id}
                href={`#${secao.id}`}
                aria-current={ativo ? 'true' : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  ativo
                    ? 'border-sky-500/60 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                    : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icone className="h-3.5 w-3.5" />
                {secao.rotulo}
              </a>
            )
          })}
        </div>
      </nav>

      <main ref={conteudo} className="container mx-auto max-w-7xl px-4 py-7 sm:py-10">
        {/* ══════════════════ Panorama ══════════════════ */}
        <section id="panorama" className="rx-ancora">
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <p className="editorial-mark">Entenda o padrão</p>
              <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight">
                O que a radiografia está mostrando
              </h2>
              <p className="mt-3 text-sm leading-7 text-foreground/80">{caso.explicacao}</p>

              {detalhe?.mecanismo && (
                <div className="mt-5 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4">
                  <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                    <Target className="h-3.5 w-3.5" /> Por que a imagem fica assim
                  </p>
                  <p className="mt-2 text-sm leading-7 text-foreground/75">{detalhe.mecanismo}</p>
                </div>
              )}
            </article>

            <div className="space-y-4">
              <article className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.04] p-5">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                  <ScanSearch className="h-4 w-4" />
                  <p className="font-clinical text-[10px] font-black uppercase tracking-widest">Pergunta de abertura</p>
                </div>
                <h2 className="mt-2 font-heading text-lg font-semibold leading-snug">{guia.pergunta}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Responda antes de revelar qualquer marcação. Descrever primeiro é o que treina o olho.
                </p>
              </article>

              {caso.sinais.length > 0 && (
                <Cartao titulo="Sinais que você precisa encontrar" icone={CheckCircle2}>
                  <ul className="space-y-2">
                    {caso.sinais.map((item) => (
                      <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Cartao>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════ Filmes ══════════════════ */}
        <section id="filmes" className="mt-10 rx-ancora sm:mt-12">
          <CabecalhoSecao
            marca="Negatoscópio"
            titulo={caso.imagens.length === 1 ? 'O filme deste caso' : `${caso.imagens.length} filmes para treinar`}
            descricao="Descreva a imagem limpa, ligue os marcadores para ver as alterações comentadas e use “Comparar” para conferir cada achado sobre o filme original."
          />

          <div className="mt-6 space-y-10">
            {caso.imagens.map((imagem, indice) => {
              const marcacoes = marcacoesPorImagem[imagem.indice] ?? []
              return (
                <article
                  key={imagem.id}
                  className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(290px,0.5fr)]"
                >
                  <CasoRaioXImagem imagem={imagem} marcacoes={marcacoes} prioridade={indice === 0} />

                  <div className="space-y-4 rx-lateral-fixa xl:sticky">
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <p className="font-clinical text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">
                        Exemplo {indice + 1} de {caso.imagens.length}
                      </p>
                      <h3 className="mt-1.5 font-heading text-lg font-semibold leading-snug">{imagem.titulo}</h3>

                      <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-3.5">
                        <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                          <Eye className="h-3.5 w-3.5" /> Método ativo
                        </p>
                        <ol className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
                          <li><strong className="text-foreground">1.</strong> Descreva a imagem limpa sem olhar o título.</li>
                          <li><strong className="text-foreground">2.</strong> Ligue <strong className="text-foreground">Marcadores</strong> e leia as alterações que aparecem no topo.</li>
                          <li><strong className="text-foreground">3.</strong> Use <strong className="text-foreground">Comparar</strong> e arraste o divisor sobre cada achado.</li>
                        </ol>
                      </div>

                      {marcacoes.length > 0 && (
                        <div className="mt-4 rounded-xl border border-border bg-muted/25 p-3.5">
                          <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            <Crosshair className="h-3.5 w-3.5" /> Neste filme
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {marcacoes.map((achado, i) => (
                              <li key={achado.titulo} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                                <span className="font-clinical text-[10px] font-black text-sky-600 dark:text-sky-400">{i + 1}</span>
                                <span className="text-foreground/75">{achado.titulo}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {caso.armadilhas.length > 0 && indice === 0 && (
                      <Cartao titulo="Armadilhas" icone={AlertTriangle} alerta>
                        <ul className="space-y-2">
                          {caso.armadilhas.map((item) => (
                            <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </Cartao>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* ══════════════════ Estruturas ══════════════════ */}
        {detalhe && detalhe.estruturas.length > 0 && (
          <section id="estruturas" className="mt-12 rx-ancora">
            <CabecalhoSecao
              marca="Anatomia aplicada"
              titulo="Cada estrutura, uma a uma"
              descricao="O que a estrutura é, como ela se comporta num filme normal, o que mudou neste caso e o erro clássico que ela provoca."
            />

            <div className="mt-6 space-y-4">
              {detalhe.estruturas.map((estrutura, indice) => (
                <article
                  key={estrutura.nome}
                  style={{ ['--rx-i' as string]: Math.min(indice, 8) }}
                  className="rx-entra overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="flex items-center gap-3 border-b border-border bg-muted/25 px-4 py-3 sm:px-5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sky-500/15 font-clinical text-[11px] font-black text-sky-600 dark:text-sky-400">
                      {indice + 1}
                    </span>
                    <h3 className="min-w-0 font-heading text-base font-semibold leading-tight sm:text-lg">{estrutura.nome}</h3>
                  </div>

                  <div className="grid gap-px bg-border sm:grid-cols-3">
                    <Campo rotulo="O que é" icone={Layers}>{estrutura.anatomia}</Campo>
                    <Campo rotulo="No filme normal" icone={CheckCircle2}>{estrutura.normal}</Campo>
                    <Campo rotulo="Neste caso" icone={Crosshair} destaque>{estrutura.neste}</Campo>
                  </div>

                  {estrutura.alerta && (
                    <p className="flex gap-2.5 border-t border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:px-5">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span><strong className="text-amber-700 dark:text-amber-300">Atenção.</strong> {estrutura.alerta}</span>
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════ Roteiro ══════════════════ */}
        <section id="roteiro" className="mt-12 rx-ancora">
          <CabecalhoSecao
            marca="Método"
            titulo={`Roteiro de ${guia.titulo.toLowerCase()}`}
            descricao="A ordem de leitura que evita que o achado óbvio encerre a busca."
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-border bg-card p-5">
              <ol className="space-y-3">
                {guia.roteiro.map((passo, i) => (
                  <li key={passo} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 font-clinical text-[10px] font-black text-white">
                      {i + 1}
                    </span>
                    {passo}
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
                <Keyboard className="h-4 w-4 text-sky-500" /> Controles do visualizador
              </h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {[
                  ['M', 'Liga e desliga os marcadores'],
                  ['C', 'Entra e sai da comparação'],
                  ['I', 'Inverte as densidades'],
                  ['+ / −', 'Aumenta ou reduz o zoom'],
                  ['0', 'Restaura tudo'],
                  ['Esc', 'Sai da tela cheia'],
                ].map(([tecla, acao]) => (
                  <div key={tecla} className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/20 p-2.5">
                    <kbd className="min-w-11 rounded border border-border bg-background px-2 py-1 text-center font-clinical text-[11px] font-black">
                      {tecla}
                    </kbd>
                    <span className="text-[11px] leading-snug text-muted-foreground">{acao}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                No celular e no tablet todos os comandos ficam visíveis e têm área de toque; nada depende de passar o
                mouse. Com zoom, arraste a imagem para navegar pelo filme.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════ Conduta ══════════════════ */}
        <section id="conduta" className="mt-12 rx-ancora">
          <CabecalhoSecao
            marca="Depois da imagem"
            titulo="O que a radiografia não resolve"
            descricao="Onde a radiografia para e qual é o próximo passo."
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {detalhe?.conduta && (
              <article className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.04] p-5">
                <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                  <Stethoscope className="h-3.5 w-3.5" /> Próximo passo
                </p>
                <p className="mt-2.5 text-sm leading-7 text-foreground/80">{detalhe.conduta}</p>
              </article>
            )}

            {caso.armadilhas.length > 0 && (
              <Cartao titulo="Armadilhas do caso" icone={AlertTriangle} alerta>
                <ul className="space-y-2">
                  {caso.armadilhas.map((item) => (
                    <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Cartao>
            )}
          </div>
        </section>

        {/* ══════════════════ Navegação ══════════════════ */}
        <nav aria-label="Navegação entre casos" className="mt-12 grid gap-3 sm:grid-cols-2">
          {anterior ? <Vizinho caso={anterior} direcao="anterior" /> : <span className="hidden sm:block" />}
          {proximo && <Vizinho caso={proximo} direcao="proximo" />}
        </nav>

        <div className="mt-4 flex justify-center">
          <Link
            href="/manual-clinico/radiologia/raio-x/casos"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:border-sky-500/50 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao acervo de casos
          </Link>
        </div>

        <p className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Escopo educacional.</strong> O conteúdo ensina interpretação radiográfica
          e não substitui avaliação clínica, laudo médico, protocolos locais ou conduta de emergência.
        </p>
      </main>
    </div>
  )
}

function Metrica({ valor, rotulo, destaque = false }: { valor: number; rotulo: string; destaque?: boolean }) {
  return (
    <div className={`rounded-xl border px-2 py-2.5 ${destaque ? 'border-sky-400/35 bg-sky-400/10' : 'border-sky-400/15 bg-white/[0.03]'}`}>
      <dt className="sr-only">{rotulo}</dt>
      <dd>
        <span className={`block font-clinical text-xl font-black tabular-nums ${destaque ? 'text-sky-200' : 'text-white/85'}`}>{valor}</span>
        <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wider text-sky-100/45">{rotulo}</span>
      </dd>
    </div>
  )
}

function CabecalhoSecao({ marca, titulo, descricao }: { marca: string; titulo: string; descricao: string }) {
  return (
    <div className="max-w-3xl">
      <p className="editorial-mark">{marca}</p>
      <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">{titulo}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{descricao}</p>
    </div>
  )
}

function Cartao({
  titulo,
  icone: Icone,
  alerta = false,
  children,
}: {
  titulo: string
  icone: typeof CheckCircle2
  alerta?: boolean
  children: React.ReactNode
}) {
  return (
    <article className={`rounded-2xl border p-5 ${alerta ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-border bg-card'}`}>
      <h3 className={`flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest ${alerta ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
        <Icone className="h-3.5 w-3.5" />
        {titulo}
      </h3>
      <div className="mt-3">{children}</div>
    </article>
  )
}

function Campo({
  rotulo,
  icone: Icone,
  destaque = false,
  children,
}: {
  rotulo: string
  icone: typeof Layers
  destaque?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`p-4 sm:p-5 ${destaque ? 'bg-sky-500/[0.04]' : 'bg-card'}`}>
      <p className={`flex items-center gap-1.5 font-clinical text-[9px] font-black uppercase tracking-widest ${destaque ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground/70'}`}>
        <Icone className="h-3 w-3" />
        {rotulo}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-foreground/75 sm:text-[13px] sm:leading-6">{children}</p>
    </div>
  )
}

function Vizinho({ caso, direcao }: { caso: VizinhoCaso; direcao: 'anterior' | 'proximo' }) {
  const proximo = direcao === 'proximo'
  return (
    <Link
      href={`/manual-clinico/radiologia/raio-x/casos/${caso.slug}`}
      className={`group rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-md ${proximo ? 'text-right' : ''}`}
    >
      <span className={`flex items-center gap-1.5 font-clinical text-[10px] font-black uppercase tracking-widest text-muted-foreground ${proximo ? 'justify-end' : ''}`}>
        {!proximo && <ArrowLeft className="h-3 w-3" />}
        {proximo ? 'Próximo caso' : 'Caso anterior'}
        {proximo && <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />}
      </span>
      <strong className="mt-1 block font-heading text-sm font-semibold leading-snug transition group-hover:text-sky-600 dark:group-hover:text-sky-400 sm:text-base">
        {caso.titulo}
      </strong>
      <span className="mt-0.5 block text-[11px] text-muted-foreground">{caso.categoriaTitulo}</span>
    </Link>
  )
}
