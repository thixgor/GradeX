import Link from 'next/link'
import { ArrowLeft, ArrowRight, Columns2, Microscope } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { IconeDoSistema } from '@/components/histologia-zoom/icone-do-sistema'
import { SinalDePatologia } from '@/components/histologia-zoom/sinal-de-patologia'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { SISTEMAS } from '@/lib/histologia-zoom/sistemas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { REFERENCIA_ABNT_LEEDS, RODAPE_LEEDS } from '@/lib/histopatologia-zoom/fonte'
import {
  TOTAIS_PATOZOOM,
  doencasPublicadas,
  laminasDaDoenca,
  resumirPatologica,
} from '@/lib/histopatologia-zoom/repositorio'
import { BASE_PATOZOOM, rotaDaDoencaZoom } from '@/lib/histopatologia-zoom/rotas'

export const dynamic = 'force-dynamic'

export const metadata = metadadosDoModulo({
  titulo: 'Histopatologia com Zoom',
  descricao:
    'Lâminas inteiras de doenças reais, com zoom profundo, achados histopatológicos marcados na própria lâmina e comparação lado a lado com o tecido normal.',
  caminho: BASE_PATOZOOM,
})

export default async function CatalogoDaPatologiaComZoom() {
  await exigirAcessoAHistologia()
  const doencas = doencasPublicadas()
  const sistemas = SISTEMAS.map((s) => ({ ...s, doencas: doencas.filter((d) => d.sistema === s.id) })).filter(
    (s) => s.doencas.length,
  )

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <Link
            href="/manual-clinico/histologia/histopatologia"
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Histopatologia
          </Link>

          <header className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="editorial-mark mb-2 text-rose-700 dark:text-rose-300">Histopatologia com Zoom</p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                A doença na lâmina inteira
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Casos reais, com diagnóstico confirmado, digitalizados em alta resolução. Em cada lâmina, os achados
                histopatológicos estão marcados onde realmente aparecem, e a lista da doença diz quais deles esta
                lâmina mostra — e quais não. Ao lado, o mesmo órgão normal, na mesma ampliação.
              </p>
              <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                <Numero valor={TOTAIS_PATOZOOM.doencas} rotulo={TOTAIS_PATOZOOM.doencas === 1 ? 'doença' : 'doenças'} />
                <Numero valor={TOTAIS_PATOZOOM.laminas} rotulo={TOTAIS_PATOZOOM.laminas === 1 ? 'lâmina' : 'lâminas'} />
                <Numero valor={TOTAIS_PATOZOOM.marcacoes} rotulo="marcações conferidas" />
              </dl>
            </div>
            <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3 lg:grid-cols-1">
              <Recurso
                icone={<SinalDePatologia className="h-4 w-4" />}
                texto="Achados patológicos com o sinal de patologia; estruturas normais em amarelo"
              />
              <Recurso
                icone={<Microscope className="h-4 w-4 text-rose-700 dark:text-rose-300" aria-hidden />}
                texto="Achados gerais e específicos da doença, com o que está presente nesta lâmina"
              />
              <Recurso
                icone={<Columns2 className="h-4 w-4 text-rose-700 dark:text-rose-300" aria-hidden />}
                texto="Comparação lado a lado com a lâmina normal, na mesma ampliação"
              />
            </ul>
          </header>

          <p className="mt-6 rounded-lg border border-rose-500/30 bg-rose-500/[0.05] px-3 py-2 text-xs leading-relaxed">
            <span className="font-semibold">Em construção, das mais comuns para as mais raras.</span> Cada lâmina é
            examinada em vários aumentos antes de receber marcações; as doenças entram por ordem de frequência e de
            importância no curso.
          </p>

          {sistemas.map((s) => (
            <section key={s.id} aria-labelledby={`sis-${s.id}`} className="mt-8">
              <h2 id={`sis-${s.id}`} className="mb-3 flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white"
                  style={{ backgroundColor: s.cor }}
                >
                  <IconeDoSistema nome={s.icone} className="h-4 w-4" />
                </span>
                {s.nome}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {s.doencas.map((d) => {
                  const laminas = laminasDaDoenca(d.id)
                  const capa = resumirPatologica(laminas[0])
                  return (
                    <li key={d.id}>
                      <Link
                        href={rotaDaDoencaZoom(d.id)}
                        className="group flex h-full gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 transition-colors hover:border-rose-500/40"
                      >
                        <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={capa.miniatura} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1 font-heading text-[15px] font-semibold leading-snug group-hover:text-rose-700 dark:group-hover:text-rose-300">
                            {d.nome}
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted-foreground">{d.resumo}</span>
                          <span className="mt-1.5 block text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                            {laminas.length} {laminas.length === 1 ? 'lâmina' : 'lâminas'} · {d.achados.length} achados na ficha
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

          <footer className="mt-10 space-y-1.5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            <p>{RODAPE_LEEDS}</p>
            <p>{REFERENCIA_ABNT_LEEDS}</p>
            <p>O texto é autoral do Domine Aqui e está em revisão por patologista.</p>
          </footer>
        </div>
      </div>
    </AppShell>
  )
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div>
      <dt className="sr-only">{rotulo}</dt>
      <dd className="font-heading text-2xl font-semibold tabular-nums">
        {valor}
        <span className="ml-1.5 text-sm font-normal text-muted-foreground">{rotulo}</span>
      </dd>
    </div>
  )
}

function Recurso({ icone, texto }: { icone: React.ReactNode; texto: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-card/70 px-3 py-2.5">
      <span className="shrink-0">{icone}</span>
      <span className="leading-snug">{texto}</span>
    </li>
  )
}
