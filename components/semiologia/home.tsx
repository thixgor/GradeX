'use client'

import Link from 'next/link'
import { ArrowRight, Eye, GitCompareArrows, Stethoscope, Waves } from 'lucide-react'
import type { CatalogoSemiologia } from '@/lib/semiologia/catalogo'
import { ROTAS } from '@/lib/semiologia/rotas'
import { Capa } from './capa'
import { Enfase } from './enfase'

/**
 * A porta do módulo.
 *
 * As três alas têm pesos diferentes e a página diz isso no layout, em vez de
 * fingir que são iguais: os **sinais** ocupam a faixa larga porque é onde está
 * o volume de conteúdo e a queixa mais frequente ("não sei descrever o que
 * estou vendo"); beira-leito e ultrassom vêm em seguida, com a figura como
 * chamada — nestas duas, a imagem *é* o produto, e um card de texto venderia
 * mal o que existe do outro lado.
 */
export function HomeSemiologia({ catalogo }: { catalogo: CatalogoSemiologia }) {
  const { totais } = catalogo

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Manual Clínico</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Manual de Semiologia</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          O que você faz com a própria mão, antes de qualquer máquina — e o que se vê pelo otoscópio, pelo
          oftalmoscópio e pela sonda à beira do leito. Cada achado com o mecanismo escrito, o que muda na conduta e
          onde ele engana.
        </p>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {[
            [totais.sinais, 'sinais aprofundados'],
            [totais.cenas + totais.cenasUltrassom, 'cenas normal × alterado'],
            [totais.estruturas, 'estruturas marcadas'],
            [totais.comparadores, 'comparadores'],
          ].map(([valor, rotulo]) => (
            <div key={String(rotulo)}>
              <dt className="sr-only">{rotulo}</dt>
              <dd>
                <span className="text-2xl font-bold">{valor}</span>{' '}
                <span className="text-xs text-muted-foreground">{rotulo}</span>
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Ala 1 — sinais. */}
      <Secao
        icone={Stethoscope}
        titulo="Sinais do exame físico"
        descricao="Icterícia, edema, cianose, turgência jugular, baqueteamento, asterixe. Definição operacional, manobra com o detalhe que a faz funcionar, mecanismo, causas por grupo e o desempenho diagnóstico quando existe número publicado."
        href={ROTAS.sinais}
        cta={`Abrir os ${totais.sinais} sinais`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {destaques(catalogo.sinais).map((sinal) => (
            <Link key={sinal.slug} href={ROTAS.sinal(sinal.slug)} className="group space-y-2">
              <Capa
                real={sinal.capaReal}
                ilustracao={sinal.ilustracao}
                className="rounded-xl border border-border transition-colors group-hover:border-sky-500/50"
              />
              <p className="text-xs font-medium leading-tight transition-colors group-hover:text-sky-700 dark:group-hover:text-sky-400">
                {sinal.nome}
              </p>
            </Link>
          ))}
        </div>
      </Secao>

      {/* Ala 2 — beira-leito. */}
      <Secao
        icone={Eye}
        titulo="Imagem à beira do leito"
        descricao="Otoscopia, fundo de olho, orofaringe e rinoscopia. A cena normal com cada estrutura marcada, e cada alteração ao lado dela — com a diferença para o normal escrita por extenso, não subentendida."
        href={ROTAS.beiraLeito}
        cta={`Abrir as ${totais.vistas} janelas`}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {catalogo.vistas.map((vista) => (
            <Link
              key={vista.slug}
              href={ROTAS.vista(vista.slug)}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-sky-500/50"
            >
              <Capa real={vista.capaReal} ilustracao={vista.capa} />
              <div className="p-3">
                <p className="text-sm font-semibold">{vista.nome}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {vista.totalCenas} cenas · {vista.totalEstruturas} estruturas
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Secao>

      {/* Ala 3 — ultrassom. */}
      <Secao
        icone={Waves}
        titulo="Ultrassom à beira do leito"
        descricao="As janelas do POCUS, cada uma com a pergunta binária que responde. Linhas A e B, deslizamento pleural, bolsa de Morrison, veia cava e pericárdio — normal e alterado, com o que separa artefato de estrutura."
        href={ROTAS.ultrassom}
        cta={`Abrir as ${totais.janelas} janelas`}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {catalogo.janelas.map((janela) => (
            <Link
              key={janela.slug}
              href={ROTAS.janela(janela.slug)}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-sky-500/50"
            >
              <Capa real={janela.capaReal} ilustracao={janela.capa} />
              <div className="p-3">
                <p className="text-sm font-semibold leading-tight">{janela.nome}</p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{janela.pergunta}</p>
              </div>
            </Link>
          ))}
        </div>
      </Secao>

      {/* Comparadores. */}
      <Secao
        icone={GitCompareArrows}
        titulo="Comparadores"
        descricao="O mesmo achado, causa por causa. Não “o que é edema”, mas qual edema é qual — renal, hepático, cardíaco, venoso e linfático lado a lado, eixo por eixo, com a célula que decide destacada."
        href={ROTAS.comparadores}
        cta={`Abrir os ${totais.comparadores} comparadores`}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {catalogo.comparadores.map((comparador) => (
            <Link
              key={comparador.slug}
              href={ROTAS.comparador(comparador.slug)}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-sky-500/50"
            >
              <p className="text-sm font-semibold">{comparador.titulo}</p>
              <p className="mt-1.5 text-xs italic leading-relaxed text-muted-foreground">“{comparador.pergunta}”</p>
              <p className="mt-3 text-[11px] text-muted-foreground">
                {comparador.totalColunas} causas × {comparador.totalEixos} eixos
              </p>
            </Link>
          ))}
        </div>
      </Secao>
    </div>
  )
}

/**
 * Os quatro sinais da vitrine: os que têm fotografia primeiro. A home vende o
 * módulo pelo caso real, e um cartão desenhado ao lado de três fotografias
 * diria o contrário do que o módulo quer dizer.
 */
const VITRINE = ['ictericia', 'purpura', 'celulite-extensa', 'turgencia-jugular']

function destaques<T extends { slug: string; capaReal?: unknown }>(sinais: T[]): T[] {
  const porSlug = new Map(sinais.map((s) => [s.slug, s]))
  const escolhidos = VITRINE.map((slug) => porSlug.get(slug)).filter((s): s is T => Boolean(s?.capaReal))
  const restantes = sinais.filter((s) => !escolhidos.includes(s))
  const comFoto = restantes.filter((s) => s.capaReal)
  const semFoto = restantes.filter((s) => !s.capaReal)
  return [...escolhidos, ...comFoto, ...semFoto].slice(0, 4)
}

function Secao({
  icone: Icone,
  titulo,
  descricao,
  href,
  cta,
  children,
}: {
  icone: typeof Eye
  titulo: string
  descricao: string
  href: string
  cta: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icone className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
            {titulo}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground"><Enfase texto={descricao} /></p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-sky-500/50 hover:bg-muted"
        >
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {children}
    </section>
  )
}
