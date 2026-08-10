import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Columns2,
  Layers,
  Library,
  Microscope,
  ScrollText,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { BuscaDaHistopatologia } from '@/components/histopatologia/busca'
import { CartaoDeDoenca } from '@/components/histopatologia/cartao-doenca'
import {
  BASE_HISTOLOGIA,
  rotaDoAtlas,
  rotaDosCreditos,
  rotaDosMecanismos,
  rotaDoSistema,
} from '@/lib/histopatologia/rotas'
import {
  DOENCAS_RESUMIDAS,
  MECANISMOS_PUBLICADOS,
  SISTEMAS_COM_CONTAGEM,
  TOTAIS,
} from '@/lib/histopatologia/repositorio'

/**
 * Home da Histopatologia.
 *
 * Componente de servidor: tudo aqui é composição sobre índices leves. Uma única
 * ilha de cliente — a busca — porque só ela tem estado. Os números vêm do
 * relatório de conciliação do pipeline, e não de constantes escritas à mão:
 * contadores decorativos numa home de estudo são a primeira coisa que o aluno
 * descobre serem falsos.
 *
 * A home **não** carrega inventário. Os 738 KB do sistema "não classificado"
 * só são lidos quando alguém abre aquele sistema.
 */

export const revalidate = 86400

export default function HomeDaHistopatologia() {
  const comDoencas = SISTEMAS_COM_CONTAGEM.filter((s) => s.doencas > 0)
  const semDoencas = SISTEMAS_COM_CONTAGEM.filter((s) => s.doencas === 0)

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <header className="border-b border-border">
          <div className="container mx-auto max-w-6xl px-4 pb-8 pt-6">
            <Link
              href={BASE_HISTOLOGIA}
              className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Manual da Histologia
            </Link>

            <p className="editorial-mark mb-2">Manual da Histologia · Anatomia patológica</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Histopatologia
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
              Reconhecer doença na lâmina não é decorar adjetivos morfológicos — é entender qual
              agressão produziu aquela forma. Cada capítulo aqui percorre o caminho inteiro: como o
              tecido normal funciona, o que o agride, qual mecanismo entra em ação, o que aparece no
              microscópio e por que isso vira sintoma.
            </p>

            <div className="mt-6 max-w-2xl">
              <BuscaDaHistopatologia />
            </div>

            <ul className="mt-6 flex flex-wrap items-center gap-2.5 text-xs">
              <Indicador icone={<ScrollText className="h-3.5 w-3.5" aria-hidden />}>
                {TOTAIS.doencas} aprofundados ·{' '}
                {TOTAIS.entradasCatalogadas.toLocaleString('pt-BR')} capítulos visuais
              </Indicador>
              <Indicador icone={<Library className="h-3.5 w-3.5" aria-hidden />}>
                FCM/Unicamp + Histopathology Atlas
              </Indicador>
              <Indicador icone={<Layers className="h-3.5 w-3.5" aria-hidden />}>
                {TOTAIS.referenciasDeMidia.toLocaleString('pt-BR')} referências de lâmina
              </Indicador>
              <Indicador icone={<Microscope className="h-3.5 w-3.5" aria-hidden />}>
                {TOTAIS.mecanismos} mecanismos gerais
              </Indicador>
            </ul>
          </div>
        </header>

        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* ══════════ Modos de navegação ══════════ */}
          <section aria-labelledby="modos">
            <h2 id="modos" className="sr-only">
              Modos de navegação
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              <li>
                <Atalho
                  href={rotaDosMecanismos()}
                  titulo="Por mecanismo"
                  descricao="Granuloma, trombose, displasia, invasão. O mesmo processo em órgãos diferentes — é assim que o raciocínio se transfere."
                  icone={<Microscope className="h-5 w-5" aria-hidden />}
                />
              </li>
              <li>
                <Atalho
                  href={rotaDoAtlas()}
                  titulo="Atlas de lâminas"
                  descricao={`${TOTAIS.entradasCatalogadas.toLocaleString('pt-BR')} capítulos visuais organizados por sistema, com abertura e ampliação dentro do Domine Aqui.`}
                  icone={<Library className="h-5 w-5" aria-hidden />}
                />
              </li>
              <li>
                <Atalho
                  href={BASE_HISTOLOGIA}
                  titulo="Voltar ao normal"
                  descricao="A histologia normal é o pré-requisito, não o capítulo anterior. Cada doença aponta para a lâmina saudável correspondente."
                  icone={<Columns2 className="h-5 w-5" aria-hidden />}
                />
              </li>
            </ul>
          </section>

          {/* ══════════ Capítulos ══════════ */}
          <section aria-labelledby="capitulos" className="mt-12">
            <div className="mb-4">
              <p className="editorial-mark mb-2">Conteúdo escrito</p>
              <h2 id="capitulos" className="font-heading text-xl font-semibold tracking-tight">
                {TOTAIS.doencas} capítulos aprofundados
              </h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Conteúdo aprofundado com mecanismo, roteiro microscópico e correlação clínica. O
                atlas visual complementa estes capítulos com toda a coleção de lâminas.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DOENCAS_RESUMIDAS.map((doenca) => (
                <li key={doenca.slug}>
                  <CartaoDeDoenca doenca={doenca} />
                </li>
              ))}
            </ul>
          </section>

          {/* ══════════ Sistemas ══════════ */}
          <section aria-labelledby="sistemas" className="mt-12">
            <div className="mb-4">
              <p className="editorial-mark mb-2">Por sistema e órgão</p>
              <h2 id="sistemas" className="font-heading text-xl font-semibold tracking-tight">
                {TOTAIS.sistemas} sistemas
              </h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Entre por sistema para estudar os capítulos aprofundados e percorrer as coleções
                visuais já organizadas por doenças, controles, técnicas, imagens e casos.
              </p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[...comDoencas, ...semDoencas].map((sistema) => (
                <li key={sistema.id}>
                  <Link
                    href={rotaDoSistema(sistema.id)}
                    className="flex h-full min-h-[44px] flex-col rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-teal-600/50"
                  >
                    <span className="text-sm font-bold leading-snug">{sistema.nome}</span>
                    <span className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {sistema.descricao}
                    </span>
                    <span className="mt-2 text-[11px] text-muted-foreground">
                      {sistema.entradas.toLocaleString('pt-BR')} capítulos visuais ·{' '}
                      {sistema.midias.toLocaleString('pt-BR')} lâminas
                      {sistema.doencas > 0 && (
                        <span className="font-bold text-teal-700 dark:text-teal-400">
                          {' '}
                          · {sistema.doencas} {sistema.doencas === 1 ? 'capítulo' : 'capítulos'}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* ══════════ Mecanismos em destaque ══════════ */}
          <section aria-labelledby="mecanismos-destaque" className="mt-12">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="editorial-mark mb-2">Por mecanismo geral</p>
                <h2
                  id="mecanismos-destaque"
                  className="font-heading text-xl font-semibold tracking-tight"
                >
                  O vocabulário que atravessa os órgãos
                </h2>
              </div>
              <Link
                href={rotaDosMecanismos()}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border bg-card px-3.5 text-xs font-bold transition-colors hover:border-violet-600/50"
              >
                Ver os {TOTAIS.mecanismos} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2">
              {MECANISMOS_PUBLICADOS.slice(0, 10).map((mecanismo) => (
                <li key={mecanismo.id}>
                  <Link
                    href={`${rotaDosMecanismos()}/${mecanismo.id}`}
                    className="inline-flex min-h-[40px] items-center rounded-lg border border-border bg-card px-3.5 text-sm font-semibold transition-colors hover:border-violet-600/50"
                  >
                    {mecanismo.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <footer className="mt-14 border-t border-border pt-6">
            <Link
              href={rotaDosCreditos()}
              className="text-xs font-bold text-muted-foreground underline transition-colors hover:text-foreground"
            >
              Créditos e fontes das lâminas
            </Link>
          </footer>
        </div>
      </div>
    </AppShell>
  )
}

function Indicador({ icone, children }: { icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-bold text-muted-foreground">
      <span className="text-teal-700 dark:text-teal-400">{icone}</span>
      {children}
    </li>
  )
}

function Atalho({
  href,
  titulo,
  descricao,
  icone,
}: {
  href: string
  titulo: string
  descricao: string
  icone: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group flex h-full min-h-[44px] flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-teal-600/50"
    >
      <span className="mb-2 text-teal-700 dark:text-teal-400">{icone}</span>
      <span className="text-sm font-bold leading-snug">{titulo}</span>
      <span className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{descricao}</span>
      <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-400">
        Abrir
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  )
}
