'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, FlaskConical } from 'lucide-react'

import { DiagnosticoDeArtefatos, LinhaDoProcessamento, OrdemImpossivel } from '@/components/histologia/laboratorio'
import { EstadoEditorial } from '@/components/histologia/marca'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import {
  rotaDosDadosDoCatalogo,
  type DadosDoLaboratorio,
  type DadosDoModuloDoLaboratorio,
} from '@/lib/histologia/paginas-do-catalogo-tipos'
import { BASE } from '@/lib/histologia/rotas'

/**
 * O laboratório virtual: a lista dos módulos e cada módulo. Os cascos são
 * estáticos; o conteúdo vem de `/api/manual-clinico/histologia/catalogo/laboratorio[/<módulo>]`,
 * depois do portão.
 */
export function Laboratorio({ comPatologia }: { comPatologia: boolean }) {
  return (
    <PortaoDaHistologia<DadosDoLaboratorio> url={rotaDosDadosDoCatalogo(['laboratorio'])}>
      {({ modulos }) => (
        <div className="surface-page min-h-screen">
          <NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />
          <div className="container mx-auto max-w-4xl px-4 py-6">
            <Link
              href={BASE}
              className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Manual da Histologia
            </Link>

            <header className="mb-6">
              <p className="editorial-mark mb-2">Laboratório virtual</p>
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Por que a lâmina tem essa cara
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Boa parte do que parece patologia é processamento. Estes módulos percorrem o caminho da peça até a
                lâmina, explicam o que cada etapa faz com o tecido e treinam a distinguir artefato de alteração
                verdadeira — que é a diferença entre um laudo certo e um errado.
              </p>
            </header>

            <ul className="space-y-3">
              {modulos.map((modulo) => (
                <li key={modulo.id}>
                  <Link
                    href={`${BASE}/laboratorio/${modulo.id}`}
                    className="group block rounded-xl border border-border bg-card p-4 transition-colors hover:border-rose-500/45"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2">
                        <FlaskConical className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-base font-bold leading-snug">{modulo.titulo}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden />
                            {modulo.minutos} min
                          </span>
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{modulo.resumo}</p>
                        <ul className="mt-2 space-y-0.5">
                          {modulo.objetivos.map((objetivo) => (
                            <li key={objetivo} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-500/60" />
                              {objetivo}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <ArrowRight
                        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              O conteúdo destes módulos foi escrito para o Manual da Histologia, com as fontes citadas em cada página.
              Como todo o restante do módulo, permanece pendente de revisão biomédica — escrever com fonte não é o mesmo
              que ter sido revisado.
            </p>
          </div>
        </div>
      )}
    </PortaoDaHistologia>
  )
}

export function ModuloDoLaboratorio({ modulo, comPatologia }: { modulo: string; comPatologia: boolean }) {
  return (
    <PortaoDaHistologia<DadosDoModuloDoLaboratorio> url={rotaDosDadosDoCatalogo(['laboratorio', modulo])}>
      {(dados) => <ConteudoDoModulo dados={dados} comPatologia={comPatologia} />}
    </PortaoDaHistologia>
  )
}

function ConteudoDoModulo({ dados, comPatologia }: { dados: DadosDoModuloDoLaboratorio; comPatologia: boolean }) {
  const { modulo } = dados
  useTituloDaAba(modulo.titulo)

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Link
          href={`${BASE}/laboratorio`}
          className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Laboratório virtual
        </Link>

        <header className="mb-5">
          <p className="editorial-mark mb-2">Laboratório virtual</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{modulo.titulo}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{modulo.resumo}</p>

          <div className="mt-3">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Ao terminar, você será capaz de
            </h2>
            <ul className="mt-1 space-y-0.5">
              {modulo.objetivos.map((objetivo) => (
                <li key={objetivo} className="flex items-start gap-1.5 text-xs">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-600" />
                  {objetivo}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            cerca de {modulo.minutos} minutos
          </p>
        </header>

        <section className="mb-6">{conteudoDoModulo(modulo.id, dados.coloracoes)}</section>

        <div className="mb-5">
          <EstadoEditorial revisao={{ estado: 'pendente-de-revisao', historico: [] }} />
        </div>

        <section aria-labelledby="referencias" className="border-t border-border pt-4">
          <h2 id="referencias" className="mb-2 text-sm font-bold">
            Referências
          </h2>
          <ul className="space-y-1.5">
            {modulo.referencias.map((referencia) => (
              <li key={referencia.citacao} className="text-xs leading-relaxed text-muted-foreground">
                {referencia.url ? (
                  <a href={referencia.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    {referencia.citacao}
                  </a>
                ) : (
                  referencia.citacao
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function conteudoDoModulo(id: string, coloracoes: DadosDoModuloDoLaboratorio['coloracoes']) {
  switch (id) {
    case 'da-coleta-a-lamina':
      return <LinhaDoProcessamento moduloId={id} />
    case 'ordem-impossivel':
      return <OrdemImpossivel moduloId={id} />
    case 'diagnostico-de-artefatos':
      return <DiagnosticoDeArtefatos moduloId={id} />
    case 'bancada-de-coloracoes':
      return <BancadaDeColoracoes coloracoes={coloracoes} />
    default:
      return null
  }
}

/**
 * Bancada de colorações.
 *
 * É conteúdo de leitura, não simulação. A tentação seria desenhar um "corte" e
 * tingi-lo ao clique de cada corante — mas uma cor escolhida por nós não é uma
 * reação histoquímica, e ver a "H&E" pintar um retângulo de rosa ensinaria que
 * o resultado depende do corante e não do tecido. Quem quiser ver o resultado
 * real abre uma lâmina de verdade no atlas, que é onde a coloração aparece
 * filtrada como critério de busca.
 */
function BancadaDeColoracoes({ coloracoes }: { coloracoes: DadosDoModuloDoLaboratorio['coloracoes'] }) {
  return (
    <div className="space-y-3">
      {coloracoes.map((coloracao) => (
        <article key={coloracao.id} className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-heading text-base font-semibold">{coloracao.nome}</h3>
          <dl className="mt-2 space-y-2 text-xs leading-relaxed">
            <div>
              <dt className="font-bold">Para que serve</dt>
              <dd className="mt-0.5 text-muted-foreground">{coloracao.finalidade}</dd>
            </div>
            <div>
              <dt className="font-bold">Afinidade química — por que funciona</dt>
              <dd className="mt-0.5 text-muted-foreground">{coloracao.afinidade}</dd>
            </div>
            <div>
              <dt className="font-bold text-rose-800 dark:text-rose-300">Resultado esperado</dt>
              <dd className="mt-0.5 text-muted-foreground">{coloracao.resultado}</dd>
            </div>
          </dl>
        </article>
      ))}

      <p className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
        Esta bancada descreve as técnicas; ela não simula a reação. Tingir um desenho de rosa não é histoquímica, e ver
        uma cor escolhida por nós ensinaria que o resultado depende do corante e não do tecido. Para ver o resultado
        real, abra no atlas uma lâmina corada pela técnica.
      </p>
    </div>
  )
}
