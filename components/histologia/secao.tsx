import Link from 'next/link'
import { ChevronRight, FolderTree, Microscope } from 'lucide-react'

import type { NoCurriculo, Pagina } from '@/lib/histologia/esquemas'
import { BASE, rotaDaPagina } from '@/lib/histologia/rotas'
import { type ResumoDeSetor, resumoDoSetor } from '@/lib/histologia/resumos'
import { destacarTermos } from './destaque'
import { setorDe, tema } from './tema'

/**
 * Landing de um nó de índice do currículo.
 *
 * 204 das 1.524 páginas do acervo não têm imagem nem marcador: são os nós de
 * navegação ("Tecidos", "Tecidos › Epitélio"). Renderizá-las como lâmina vazia
 * produziria 204 páginas quebradas; renderizá-las como índice dá ao aluno o
 * mapa daquele ramo, que é para o que elas sempre serviram.
 *
 * Componente de servidor: é só composição, não tem interação. Mandar isso para
 * o cliente custaria bundle sem devolver nada.
 */
export function SecaoDoCurriculo({
  pagina,
  filhos,
  miniaturas,
}: {
  pagina: Pagina
  filhos: NoCurriculo[]
  miniaturas: Record<string, string>
}) {
  const cor = tema(setorDe(pagina.caminho).cor)
  const resumo = resumoDoSetor(pagina.caminho)
  const laminas = filhos.filter((f) => f.tipo === 'lamina')
  const subsecoes = filhos.filter((f) => f.tipo !== 'lamina')

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <nav aria-label="Trilha de navegação" className="mb-4">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          <li>
            <Link href={BASE} className="rounded hover:text-foreground hover:underline">
              Manual da Histologia
            </Link>
          </li>
          {pagina.trilha.map((passo, i) => (
            <li key={passo.slug} className="flex items-center gap-1.5">
              <span aria-hidden>›</span>
              {i === pagina.trilha.length - 1 ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {passo.titulo}
                </span>
              ) : (
                <Link href={rotaDaPagina(passo.slug)} className="rounded hover:text-foreground hover:underline">
                  {passo.titulo}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header className="mb-6">
        <p className="editorial-mark mb-2">Índice do currículo</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {pagina.titulo}
        </h1>
        {setorDe(pagina.caminho).resumo && pagina.caminho.length === 1 && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {setorDe(pagina.caminho).resumo}
          </p>
        )}
        <p className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${cor.borda} ${cor.fundo} ${cor.texto}`}>
            <Microscope className="h-3.5 w-3.5" aria-hidden />
            {contarLaminas(filhos)} lâminas neste ramo
          </span>
          {subsecoes.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-muted-foreground">
              <FolderTree className="h-3.5 w-3.5" aria-hidden />
              {subsecoes.length} subseç{subsecoes.length === 1 ? 'ão' : 'ões'}
            </span>
          )}
        </p>
      </header>

      {resumo && <PanoramaDoSetor resumo={resumo} />}

      {subsecoes.length > 0 && (
        <section aria-labelledby="subsecoes" className="mb-8">
          <h2 id="subsecoes" className="mb-3 font-heading text-lg font-semibold">
            Assuntos
          </h2>
          <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {subsecoes.map((filho) => (
              <li key={filho.caminho.join('/')}>
                <Link
                  href={rotaDaPagina(filho.caminho)}
                  className={`group flex min-h-[44px] items-center justify-between gap-2 histologia-cartao p-3 transition-colors ${cor.hover}`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-snug">{filho.titulo}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {filho.laminas} lâmina{filho.laminas === 1 ? '' : 's'} · {filho.estruturas}{' '}
                      estruturas
                    </span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {laminas.length > 0 && (
        <section aria-labelledby="laminas">
          <h2 id="laminas" className="mb-3 font-heading text-lg font-semibold">
            Lâminas
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {laminas.map((filho) => {
              const rota = filho.caminho.join('/')
              const miniatura = miniaturas[rota]
              return (
                <li key={rota}>
                  <Link
                    href={rotaDaPagina(filho.caminho)}
                    className={`group block overflow-hidden histologia-cartao transition-colors ${cor.hover}`}
                  >
                    <span className="block aspect-[4/3] overflow-hidden bg-[#0d1210]">
                      {miniatura ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={miniatura}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                          className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center">
                          <Microscope className="h-6 w-6 text-white/20" aria-hidden />
                        </span>
                      )}
                    </span>
                    <span className="block p-2.5">
                      <span className="block text-xs font-semibold leading-snug">{filho.titulo}</span>
                      {filho.estruturas > 0 && (
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          {filho.estruturas} estrutura{filho.estruturas === 1 ? '' : 's'}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {filhos.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Este ramo do currículo ainda não tem conteúdo associado no acervo.
        </p>
      )}
    </div>
  )
}

function contarLaminas(filhos: NoCurriculo[]): number {
  return filhos.reduce((n, f) => n + f.laminas, 0)
}

/**
 * Panorama do setor: o "mapa antes do território".
 *
 * Denso em termos de propósito — cada palavra técnica aqui reaparece marcada
 * nas lâminas do setor, e reconhecê-la antes de ver a imagem é o que separa
 * olhar de identificar. Vem de `lib/histologia/resumos.ts`, é conteúdo próprio
 * e, como todo o resto, ainda aguarda revisão biomédica.
 */
function PanoramaDoSetor({ resumo }: { resumo: ResumoDeSetor }) {
  return (
    <section className="histologia-cartao mb-8 overflow-hidden">
      <div className="border-b border-border bg-muted/25 px-4 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Panorama do setor
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-snug">{resumo.chamada}</p>
      </div>

      <div className="space-y-4 p-4">
        <p className="histologia-prosa text-sm leading-relaxed">
          {destacarTermos(resumo.panorama)}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Ao fim deste setor você deve conseguir
            </p>
            <ul className="space-y-1">
              {resumo.objetivos.map((objetivo) => (
                <li key={objetivo} className="flex gap-1.5 text-xs leading-relaxed">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                  {objetivo}
                </li>
              ))}
            </ul>
          </div>

          {resumo.chavesDeIdentificacao && resumo.chavesDeIdentificacao.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Chaves rápidas de identificação
              </p>
              <dl className="space-y-1.5">
                {resumo.chavesDeIdentificacao.map((chave) => (
                  <div key={chave.estrutura} className="border-l-2 border-current/25 pl-2">
                    <dt className="text-xs font-semibold">{chave.estrutura}</dt>
                    <dd className="text-xs leading-relaxed text-muted-foreground">{chave.pista}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

