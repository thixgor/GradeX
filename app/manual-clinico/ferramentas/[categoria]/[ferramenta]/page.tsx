'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell, useAppShell } from '@/components/app-shell'
import { ArrowRight, Loader2, Search } from 'lucide-react'
import {
  CATEGORIA_POR_ID,
  carregarModulo,
  carregarTodas,
  ehCategoria,
  ferramentasDaCategoria,
  porId,
  type CategoriaId,
  type Ferramenta,
} from '@/lib/ferramentas-clinicas'
import { ICONES, ICONE_PADRAO, tema } from '@/components/ferramentas-clinicas/tema'
import { PainelFerramenta } from '@/components/ferramentas-clinicas/painel'
import { BarraFerramentas } from '@/components/ferramentas-clinicas/barra-superior'
import { useFavoritos } from '@/components/ferramentas-clinicas/use-favoritos'
import { useAcessoFerramentas } from '@/components/ferramentas-clinicas/use-acesso'
import { VitrineFerramentas } from '@/components/ferramentas-clinicas/vitrine'

/**
 * Uma ferramenta, uma página.
 *
 * Antes, todo caminho até uma calculadora terminava no mesmo lugar: a lista
 * inteira da área, com a ferramenta escolhida aberta no meio dela e uma rolagem
 * automática tentando levar a pessoa até lá. Buscar "Centor" e cair numa página
 * com 21 ferramentas de infectologia — para então procurar o Centor ali dentro —
 * é procurar duas vezes pela mesma coisa. E a rolagem automática só piorava:
 * quando ela erra por algumas centenas de pixels, a pessoa não sabe se está
 * acima ou abaixo do que pediu.
 *
 * Aqui o resultado da busca abre exatamente o que foi buscado, sozinho na tela e
 * já calculando. A lista da área continua existindo para quem quer navegar por
 * assunto — mas deixou de ser pedágio para quem já sabe o que quer.
 *
 * O deslocamento lateral continua barato: as ferramentas vizinhas ficam num
 * trilho no rodapé, então trocar de escore é um toque, sem voltar para lista
 * nenhuma.
 */
export default function FerramentaPage() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const params = useParams<{ categoria: string; ferramenta: string }>()
  const router = useRouter()

  const categoriaId = (params?.categoria ?? '') as CategoriaId
  const ferramentaId = String(params?.ferramenta ?? '')
  const valida = ehCategoria(categoriaId)
  const categoria = valida ? CATEGORIA_POR_ID[categoriaId] : null

  const [daArea, setDaArea] = useState<Ferramenta[] | null>(null)
  const [catalogoCompleto, setCatalogoCompleto] = useState(false)
  const [erro, setErro] = useState(false)
  const { alternar: alternarFavorito, ehFavorito, sincronizar } = useFavoritos()
  const { loading: carregandoShell } = useAppShell()
  const { dados, carregado } = useAcessoFerramentas()

  const prontoAcesso = carregado && !carregandoShell
  const temAcesso = dados?.access?.hasFullAccess === true

  /**
   * Carrega só o módulo desta área primeiro.
   *
   * A ferramenta pedida quase sempre mora aqui, e um chunk chega muito antes dos
   * quinze. Os demais entram depois, em segundo plano, para montar o trilho de
   * vizinhas e cobrir o caso da ferramenta emprestada de outra área — mas nunca
   * atrasando o que a pessoa veio ver.
   */
  useEffect(() => {
    if (!valida || !temAcesso) return
    let ativo = true

    carregarModulo(categoriaId)
      .then((lista) => {
        if (!ativo) return
        // Primeira pintura com o que já chegou.
        setDaArea(ferramentasDaCategoria(lista, categoriaId))
        // Depois o catálogo completo, que acrescenta as ferramentas
        // emprestadas de outras áreas — inclusive, no pior caso, a própria
        // ferramenta pedida.
        return carregarTodas()
      })
      .then((todas) => {
        if (!ativo || !todas) return
        setDaArea(ferramentasDaCategoria(todas, categoriaId))
        setCatalogoCompleto(true)
      })
      .catch(() => ativo && setErro(true))

    return () => {
      ativo = false
    }
  }, [categoriaId, ferramentaId, valida, temAcesso])

  useEffect(() => {
    if (daArea) sincronizar(daArea)
  }, [daArea, sincronizar])

  useEffect(() => {
    setCatalogoCompleto(false)
  }, [categoriaId])

  const ferramenta = useMemo(
    () => (daArea ? porId(daArea, ferramentaId) : undefined),
    [daArea, ferramentaId],
  )

  /**
   * Vizinhas da mesma área, sem repetir a que está aberta.
   *
   * Só depois do catálogo completo. A lista chega em duas etapas — primeiro
   * esta área, depois as emprestadas de outras — e o trilho tem rolagem com
   * encaixe (`snap-mandatory`): quando os cartões mudam de posição, o navegador
   * ACOMPANHA o cartão em que estava encaixado. Na prática o trilho nascia
   * rolado uns 1500px, com o primeiro cartão fora da tela. Ele fica no rodapé,
   * então esperar o catálogo não atrasa nada que a pessoa esteja olhando.
   */
  const vizinhas = useMemo(
    () =>
      catalogoCompleto ? (daArea ?? []).filter((f) => f.id !== ferramentaId).slice(0, 12) : [],
    [catalogoCompleto, daArea, ferramentaId],
  )

  if (!valida || !categoria) return null

  if (!prontoAcesso) {
    return (
      <div className="surface-page flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!temAcesso) {
    return (
      <div className="surface-page min-h-screen">
        <BarraFerramentas voltarHref="/manual-clinico" voltarLabel="Voltar ao Manual Clínico" />
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <VitrineFerramentas
            onCheckout={() => router.push('/manual-clinico/checkout')}
            isAuthenticated={dados?.isAuthenticated ?? false}
            planos={dados?.product?.plans ?? []}
            precoAvulso={dados?.product?.currentPrice ?? dados?.product?.price ?? 0}
            produtoAtivo={dados?.product?.isActive ?? false}
            resumo={dados?.resumo}
            areaAlvo={categoria.nome}
          />
        </div>
      </div>
    )
  }

  const t = tema(categoria.cor)
  const Icone = ICONES[categoria.icone] || ICONE_PADRAO
  const areaDaFerramenta = ferramenta ? CATEGORIA_POR_ID[ferramenta.categorias[0]] : null

  return (
    <div className="surface-page min-h-screen">
      <BarraFerramentas
        voltarHref={`/manual-clinico/ferramentas/${categoriaId}`}
        voltarLabel={categoria.nome}
        titulo={ferramenta?.nome}
        // A sigla quando existe; senão, a área de origem só quando ela é OUTRA
        // — repetir "Infectologia" logo abaixo do "← Infectologia" não informa
        // nada. Ferramenta emprestada, aí sim, precisa dizer de onde veio.
        subtitulo={
          ferramenta?.sigla ||
          (areaDaFerramenta && areaDaFerramenta.id !== categoriaId ? areaDaFerramenta.nome : undefined)
        }
      />

      <div className="container mx-auto max-w-5xl px-4 py-5 sm:py-7">
        {/* Migalha: diz onde a ferramenta mora sem ocupar uma faixa inteira. */}
        <nav className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-muted-foreground">
          <Link href="/manual-clinico/ferramentas" className="transition-colors hover:text-foreground">
            Ferramentas Clínicas
          </Link>
          <span aria-hidden>/</span>
          <Link
            href={`/manual-clinico/ferramentas/${categoriaId}`}
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Icone className={`h-3.5 w-3.5 ${t.text}`} />
            {categoria.nome}
          </Link>
        </nav>

        {erro ? (
          <Ausente
            titulo="Não foi possível carregar esta ferramenta"
            texto="Recarregue a página. Se persistir, abra a área e procure por ela na lista."
            categoriaId={categoriaId}
            categoriaNome={categoria.nome}
          />
        ) : !daArea ? (
          <div className="space-y-3">
            <div className="h-28 animate-pulse rounded-xl bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : !ferramenta ? (
          <Ausente
            titulo="Ferramenta não encontrada"
            texto="Ela pode ter mudado de endereço. A lista da área traz todas as calculadoras deste assunto."
            categoriaId={categoriaId}
            categoriaNome={categoria.nome}
          />
        ) : (
          <PainelFerramenta
            key={ferramenta.id}
            ferramenta={ferramenta}
            cor={areaDaFerramenta?.cor ?? categoria.cor}
            aberto
            fixo
            onToggle={() => {}}
            favorito={ehFavorito(ferramenta.id)}
            onFavoritar={() => alternarFavorito(ferramenta)}
          />
        )}

        {/* ── Trilho de vizinhas ────────────────────────────────────────── */}
        {vizinhas.length > 0 && (
          <section className="mt-10">
            <p className="editorial-mark mb-1.5">Também em {categoria.nome.toLowerCase()}</p>
            <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
              Trocar de ferramenta sem voltar para a lista.
            </p>

            {/*
              Trilho que desliza no celular e vira grade no desktop. Uma lista
              vertical de doze cartões empurraria a ferramenta aberta para fora
              da tela — o oposto do que esta página existe para fazer.
            */}
            {/*
              `overflow-anchor: none` não é enfeite. A lista é pintada duas
              vezes — primeiro as ferramentas desta área, depois o catálogo
              inteiro com as emprestadas — e a ancoragem de rolagem do Chrome,
              tentando manter o que estava à vista, empurrava o trilho para o
              meio: ele nascia com 1493px de rolagem e o primeiro cartão ficava
              cortado fora da tela.
            */}
            <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2 [overflow-anchor:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {vizinhas.map((f) => {
                const area = CATEGORIA_POR_ID[f.categorias[0]]
                const tv = tema(area?.cor ?? categoria.cor)
                return (
                  <Link
                    key={f.id}
                    href={`/manual-clinico/ferramentas/${categoriaId}/${f.id}`}
                    prefetch={false}
                    className={`group flex w-[74vw] flex-none snap-start flex-col rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40 sm:w-auto ${tv.hoverBorder}`}
                  >
                    <div className="flex items-baseline gap-x-2">
                      <p className="min-w-0 flex-1 text-[13.5px] font-semibold leading-snug transition-colors group-hover:text-primary">
                        {f.nome}
                      </p>
                      {f.sigla && (
                        <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${tv.bg} ${tv.text}`}>
                          {f.sigla}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">{f.resumo}</p>
                  </Link>
                )
              })}
            </div>

            <Link
              href={`/manual-clinico/ferramentas/${categoriaId}`}
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-colors hover:brightness-110"
            >
              Ver as {categoria.total} de {categoria.nome.toLowerCase()}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        )}

        <p className="mt-10 border-t border-border pt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Material educacional. Escores descrevem probabilidades em populações e não substituem julgamento
          clínico, protocolo institucional nem a bula do medicamento.
        </p>
      </div>
    </div>
  )
}

/** Estado de falha com saída: nunca uma página morta. */
function Ausente({
  titulo,
  texto,
  categoriaId,
  categoriaNome,
}: {
  titulo: string
  texto: string
  categoriaId: string
  categoriaNome: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
        <Search className="h-7 w-7 text-muted-foreground/30" />
      </div>
      <p className="text-sm font-semibold">{titulo}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{texto}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link
          href={`/manual-clinico/ferramentas/${categoriaId}`}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-bold text-primary-foreground"
        >
          Abrir {categoriaNome}
        </Link>
        <Link
          href="/manual-clinico/ferramentas"
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-[13px] font-semibold"
        >
          Buscar em todas
        </Link>
      </div>
    </div>
  )
}
