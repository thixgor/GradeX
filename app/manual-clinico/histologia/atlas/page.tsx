import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { BuscaDaHistologia } from '@/components/histologia/busca'
import { MapaCurricular } from '@/components/histologia/mapa-curricular'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { COLORACOES } from '@/lib/histologia/glossario'
import { CURRICULO, TOTAIS } from '@/lib/histologia/repositorio'
import { BASE, metadadosDoModulo, rotaDaPagina } from '@/lib/histologia/seo'

export const dynamic = 'force-dynamic'

export const metadata = metadadosDoModulo({
  titulo: 'Atlas pesquisável',
  descricao:
    `Busque entre ${TOTAIS.laminas} lâminas e ${TOTAIS.estruturas} estruturas por nome anatômico, ` +
    'tecido, órgão, sistema ou coloração. A busca funciona sem acento e cobre também os termos em inglês.',
  caminho: `${BASE}/atlas`,
})

export default async function PaginaDoAtlas() {
  await exigirAcessoAHistologia()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <Link
            href={BASE}
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Manual da Histologia
          </Link>

          <header className="mb-5">
            <p className="editorial-mark mb-2">Atlas</p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Encontre a estrutura
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {TOTAIS.estruturas.toLocaleString('pt-BR')} estruturas marcadas em{' '}
              {TOTAIS.laminas.toLocaleString('pt-BR')} lâminas. Digite sem acento se preferir — e o
              termo em inglês também encontra, porque o rótulo original é indexado junto do
              traduzido.
            </p>
          </header>

          <BuscaDaHistologia
            variante="pagina"
            filtrosVisiveis
            autoFoco
            placeholder="lâmina própria, osteon, cólon, H&E…"
            /* O acervo de patologia tem índice próprio: sem a ponte, buscar
               "apendicite" aqui devolve nada e o aluno conclui que não existe. */
            pontePatologica={histopatologiaHabilitada()}
          />

          <section aria-labelledby="por-coloracao" className="mt-10">
            <h2 id="por-coloracao" className="mb-3 font-heading text-lg font-semibold">
              Por coloração
            </h2>
            <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Só aparecem aqui as técnicas efetivamente presentes no acervo, detectadas no texto de
              origem de cada lâmina. Não listamos colorações que o material não sofreu.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {COLORACOES.map((coloracao) => (
                <li key={coloracao.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-bold">{coloracao.nome}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {coloracao.resultado}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="por-curriculo" className="mt-10">
            <h2 id="por-curriculo" className="mb-3 font-heading text-lg font-semibold">
              Por currículo
            </h2>
            <MapaCurricular setores={CURRICULO} />
          </section>

          <section aria-labelledby="atalhos" className="mt-10">
            <h2 id="atalhos" className="mb-3 font-heading text-lg font-semibold">
              Ir direto a um setor
            </h2>
            <ul className="flex flex-wrap gap-2">
              {CURRICULO.map((setor) => (
                <li key={setor.slug}>
                  <Link
                    href={rotaDaPagina(setor.caminho)}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold transition-colors hover:border-teal-500/50"
                  >
                    {setor.titulo}
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {setor.laminas}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
