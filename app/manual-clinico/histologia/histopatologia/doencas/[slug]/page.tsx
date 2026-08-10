import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Autoavaliacao } from '@/components/histopatologia/autoavaliacao'
import { CadeiaFisiopatologica, EmPreparacao } from '@/components/histopatologia/cadeia-fisiopatologica'
import { GaleriaRemota } from '@/components/histopatologia/galeria-remota'
import { PainelDeRevisao } from '@/components/histopatologia/painel-revisao'
import { CartaoDeAchado, RoteiroMicroscopico } from '@/components/histopatologia/roteiro-microscopico'
import {
  ProvedorDeProfundidade,
  SecaoPorProfundidade,
} from '@/components/histopatologia/seletor-profundidade'
import {
  AncoraNormal,
  TabelaNormalPatologico,
} from '@/components/histopatologia/tabela-normal-patologico'
import { MARCA_DE_NATUREZA, MARCA_DE_REVISAO } from '@/components/histopatologia/tema'
import type { AplicacaoDeMecanismoResolvida } from '@/components/histopatologia/tipos'
import { LISTA_DE_FONTES } from '@/lib/histopatologia/direitos'
import { MIDIAS_PRINCIPAIS_MAXIMO, paraExibicao } from '@/lib/histopatologia/midia'
import {
  MECANISMOS_PUBLICADOS,
  SISTEMAS_COM_CONTAGEM,
  obterDoenca,
} from '@/lib/histopatologia/repositorio'
import {
  BASE,
  BASE_HISTOLOGIA,
  rotaDaDoenca,
  rotaDaEntradaCatalogada,
  rotaDoMecanismo,
  rotaDoSistema,
  rotaDosCreditos,
} from '@/lib/histopatologia/rotas'
import { jsonLdDeDoenca, jsonLdDeTrilha, metadadosDoModulo } from '@/lib/histopatologia/seo'
import { buildJsonLd } from '@/lib/seo'
import type { MidiaExibivel } from '@/lib/histopatologia/esquemas'

/**
 * Página canônica de doença.
 *
 * ## Sem `generateStaticParams` para o catálogo inteiro
 *
 * O plano é explícito (§5.4): não incluir todas as doenças em
 * `generateStaticParams`. Hoje são seis capítulos e pré-renderizá-los custaria
 * segundos — mas a lista cresce por acréscimo de arquivo editorial, e uma rota
 * que hoje é barata e amanhã tem trezentas entradas produz um build que ninguém
 * percebe estar degradando. A rota é renderizada sob demanda e revalidada por
 * ISR; a primeira visita paga, todas as outras leem do cache da borda.
 *
 * ## Uma página carrega só o seu fragmento
 *
 * `obterDoenca` resolve um único `import()` do mapa literal. Nenhum inventário
 * de sistema, nenhum índice de busca do servidor, nenhum fragmento de outra
 * doença entra nesta requisição.
 *
 * ## A ordem das seções não é arbitrária
 *
 * Ela segue a seção 5 do prompt, e cada posição tem razão pedagógica: a
 * histologia normal vem antes da alteração porque diferença exige referência; o
 * mecanismo geral vem antes do específico porque é o que transfere para outros
 * órgãos; o roteiro por aumento vem antes da galeria porque saber o que procurar
 * precede olhar.
 */

export const revalidate = 86400

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const fragmento = await obterDoenca(params.slug)
  if (!fragmento) return { title: 'Doença não encontrada — Histopatologia' }

  const { doenca } = fragmento
  return metadadosDoModulo({
    titulo: doenca.nome,
    descricao: doenca.conteudo.definicao,
    caminho: rotaDaDoenca(doenca.slug),
    estadoDeRevisao: doenca.revisao.estado,
  })
}

export default async function PaginaDaDoenca({ params }: Props) {
  const fragmento = await obterDoenca(params.slug)
  if (!fragmento) notFound()

  const { doenca, entradas, galeria } = fragmento
  const sistema = SISTEMAS_COM_CONTAGEM.find((s) => s.id === doenca.sistemaId)
  const revisao = MARCA_DE_REVISAO[doenca.revisao.estado]
  const natureza = MARCA_DE_NATUREZA[doenca.natureza] ?? MARCA_DE_NATUREZA.indefinida
  const c = doenca.conteudo

  /* Mecanismos resolvidos no servidor: o componente de cliente recebe o objeto
     pronto em vez de precisar de acesso ao repositório server-only. */
  const mecanismos: AplicacaoDeMecanismoResolvida[] = c.mecanismoPatologicoGeral
    .map((aplicacao) => {
      const mecanismo = MECANISMOS_PUBLICADOS.find((m) => m.id === aplicacao.mecanismoId)
      return mecanismo ? { ...mecanismo, aplicacao: aplicacao.aplicacao } : null
    })
    .filter((m): m is AplicacaoDeMecanismoResolvida => m !== null)

  /* Seleção editorial primeiro; o restante da galeria vem depois, agrupado. */
  const selecionadas = new Map(doenca.midiasPrincipais.map((m) => [m.midiaId, m]))
  const midiasExibiveis: MidiaExibivel[] = galeria
    .map((midia) => {
      const selecao = selecionadas.get(midia.id)
      return paraExibicao(midia, {
        aumento: selecao?.aumento,
        legendaEditorial: selecao?.legendaEditorial,
        alt: selecao?.alt,
      })
    })
    .filter((m): m is MidiaExibivel => m !== null)

  const principais = midiasExibiveis
    .filter((m) => selecionadas.has(m.id))
    .slice(0, MIDIAS_PRINCIPAIS_MAXIMO)
  const restantes = midiasExibiveis.filter((m) => !selecionadas.has(m.id))

  const trilha = [
    { titulo: 'Manual da Histologia', caminho: BASE_HISTOLOGIA },
    { titulo: 'Histopatologia', caminho: BASE },
    ...(sistema ? [{ titulo: sistema.nome, caminho: rotaDoSistema(sistema.id) }] : []),
    { titulo: doenca.nome, caminho: rotaDaDoenca(doenca.slug) },
  ]

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          {/* ── Breadcrumb ── */}
          <nav aria-label="Trilha de navegação" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {trilha.map((item, i) => (
                <li key={item.caminho} className="inline-flex items-center gap-1">
                  {i > 0 && <span aria-hidden>›</span>}
                  {i === trilha.length - 1 ? (
                    <span aria-current="page" className="font-semibold text-foreground">
                      {item.titulo}
                    </span>
                  ) : (
                    <Link href={item.caminho} className="transition-colors hover:text-foreground">
                      {item.titulo}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* ── 1. Identificação ── */}
          <header className="mb-5">
            <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className={`rounded-full border px-2 py-0.5 ${revisao.classe}`}>
                <span aria-hidden>{revisao.simbolo}</span> {revisao.rotulo}
              </span>
              <span className={`rounded-full border px-2 py-0.5 ${natureza.classe}`}>
                <span aria-hidden>{natureza.simbolo}</span> {natureza.rotulo}
              </span>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">{doenca.nome}</h1>
            {doenca.sinonimos.length > 0 && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Também chamada de {doenca.sinonimos.join('; ')}
                {doenca.sinonimosEmIngles.length > 0 && (
                  <> · em inglês: {doenca.sinonimosEmIngles.join('; ')}</>
                )}
              </p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              {sistema?.nome} · {doenca.orgaos.join(', ')}
            </p>
          </header>

          <PainelDeRevisao revisao={doenca.revisao} />

          <ProvedorDeProfundidade>
            <div className="mt-6 space-y-10">
              {/* ── 2. Objetivos ── */}
              {c.objetivos.length > 0 && (
                <Secao id="objetivos" titulo="Objetivos de aprendizagem">
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                    {c.objetivos.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </Secao>
              )}

              {/* ── 3. Definição ── */}
              <Secao id="definicao" titulo="Definição">
                <p className="text-sm leading-relaxed">{c.definicao}</p>
              </Secao>

              {/* ── 4. Histologia normal de referência ── */}
              <Secao
                id="normal"
                titulo="Antes de olhar a lâmina: a histologia normal"
                nota="Uma alteração só é alteração em relação a alguma coisa. Estabeleça a referência primeiro."
              >
                <AncoraNormal
                  referencias={c.histologiaNormalDeReferencia}
                  slugDaDoenca={doenca.slug}
                />
              </Secao>

              {/* ── 5. Etiologia e fatores de risco ── */}
              <SecaoPorProfundidade nivel="essencial">
                <Secao id="etiologia" titulo="Etiologia e fatores de risco">
                  {c.etiologias.length === 0 && c.fatoresDeRisco.length === 0 ? (
                    <EmPreparacao />
                  ) : (
                    <div className="space-y-4">
                      {c.etiologias.length > 0 && (
                        <ul className="space-y-2">
                          {c.etiologias.map((e) => (
                            <li key={e.agente} className="rounded-xl border border-border bg-card p-3.5">
                              <p className="text-sm font-bold">{e.agente}</p>
                              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {e.categoria}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {e.explicacao}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                      {c.fatoresDeRisco.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-bold">Fatores de risco</h3>
                          <ul className="space-y-1.5">
                            {c.fatoresDeRisco.map((f) => (
                              <li key={f.fator} className="text-xs leading-relaxed">
                                <span className="font-bold">{f.fator}</span>
                                {f.forca && (
                                  <span className="ml-1.5 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {f.forca}
                                  </span>
                                )}
                                <span className="text-muted-foreground"> — {f.porQue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Secao>
              </SecaoPorProfundidade>

              {/* ── 6 e 7. Mecanismo geral e cadeia específica ── */}
              <Secao
                id="mecanismo"
                titulo="Do gatilho à manifestação clínica"
                nota="Cada seta responde a uma pergunta: por que o próximo evento acontece?"
              >
                <CadeiaFisiopatologica
                  etapas={c.fisiopatologiaEspecifica}
                  mecanismos={mecanismos}
                />
              </Secao>

              {/* ── 8. Macroscopia ── */}
              {c.macroscopia.length > 0 && (
                <Secao id="macroscopia" titulo="Macroscopia">
                  <ul className="space-y-2">
                    {c.macroscopia.map((achado) => (
                      <li key={achado.achado}>
                        <CartaoDeAchado achado={achado} />
                      </li>
                    ))}
                  </ul>
                </Secao>
              )}

              {/* ── 9. Roteiro microscópico ── */}
              <Secao
                id="histopatologia"
                titulo="No microscópio, na ordem certa"
                nota="Panorâmica → arquitetura → compartimento → padrão celular → citologia → síntese."
              >
                {c.histopatologia ? (
                  <RoteiroMicroscopico roteiro={c.histopatologia} />
                ) : (
                  <EmPreparacao o="O roteiro por aumento" />
                )}
              </Secao>

              {/* ── 10. Galeria ── */}
              <Secao
                id="laminas"
                titulo="Lâminas de referência"
                nota="Catalogadas nos atlas de origem. Seleção editorial primeiro; o inventário completo de cada entrada fica a um clique."
              >
                {principais.length > 0 && (
                  <div className="mb-5">
                    <h3 className="mb-2 text-sm font-bold">Seleção editorial</h3>
                    <GaleriaRemota
                      midias={principais}
                      titulo={`Seleção editorial — ${doenca.nome}`}
                      comFiltros={false}
                    />
                  </div>
                )}

                {restantes.length > 0 ? (
                  <div>
                    <h3 className="mb-2 text-sm font-bold">
                      Demais referências catalogadas ({restantes.length.toLocaleString('pt-BR')})
                    </h3>
                    <GaleriaRemota midias={restantes} titulo={`Referências — ${doenca.nome}`} />
                  </div>
                ) : (
                  principais.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                      Nenhuma referência elegível foi consolidada nesta doença ainda. As entradas
                      catalogadas ligadas a ela estão listadas na seção de proveniência, ao final.
                    </p>
                  )
                )}
              </Secao>

              {/* ── 11. Exames complementares ── */}
              <SecaoPorProfundidade nivel="aprofundar">
                <Secao
                  id="complementares"
                  titulo="Colorações, imuno-histoquímica e molecular"
                  nota="Cada exame responde a uma pergunta. Resultado isolado não é diagnóstico."
                >
                  {[...c.coloracoesEspeciais, ...c.imunoHistoquimica, ...c.biologiaMolecular]
                    .length === 0 ? (
                    <EmPreparacao />
                  ) : (
                    <ul className="space-y-3">
                      {[...c.coloracoesEspeciais, ...c.imunoHistoquimica, ...c.biologiaMolecular].map(
                        (exame) => (
                          <li key={exame.nome} className="rounded-xl border border-border bg-card p-3.5">
                            <p className="text-sm font-bold">{exame.nome}</p>
                            <dl className="mt-1.5 space-y-1 text-xs leading-relaxed">
                              <div>
                                <dt className="inline font-bold">Responde: </dt>
                                <dd className="inline text-muted-foreground">{exame.pergunta}</dd>
                              </div>
                              <div>
                                <dt className="inline font-bold">Padrão esperado: </dt>
                                <dd className="inline text-muted-foreground">
                                  {exame.padraoEsperado}
                                </dd>
                              </div>
                              {exame.controles && (
                                <div>
                                  <dt className="inline font-bold">Controles: </dt>
                                  <dd className="inline text-muted-foreground">{exame.controles}</dd>
                                </div>
                              )}
                              <div>
                                <dt className="font-bold">Limitações:</dt>
                                <dd>
                                  <ul className="list-disc pl-5 text-muted-foreground">
                                    {exame.limitacoes.map((l) => (
                                      <li key={l}>{l}</li>
                                    ))}
                                  </ul>
                                </dd>
                              </div>
                              <div>
                                <dt className="inline font-bold">Muda o diferencial: </dt>
                                <dd className="inline text-muted-foreground">
                                  {exame.mudaODiferencial}
                                </dd>
                              </div>
                            </dl>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </Secao>
              </SecaoPorProfundidade>

              {/* ── 12. Correlação morfofuncional e clínica ── */}
              <Secao id="correlacao" titulo="Da morfologia ao sintoma">
                {c.correlacaoClinica.length === 0 ? (
                  <EmPreparacao />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[540px] border-collapse text-left text-xs">
                      <caption className="sr-only">
                        Correlação entre achado morfológico, consequência funcional e manifestação
                        clínica
                      </caption>
                      <thead>
                        <tr className="border-b border-border">
                          <th scope="col" className="px-3 py-2 font-bold">
                            Achado morfológico
                          </th>
                          <th scope="col" className="px-3 py-2 font-bold">
                            Consequência funcional
                          </th>
                          <th scope="col" className="px-3 py-2 font-bold">
                            Manifestação
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.correlacaoClinica.map((linha) => (
                          <tr
                            key={linha.achadoMorfologico}
                            className="border-b border-border/60 align-top"
                          >
                            <th scope="row" className="px-3 py-2.5 font-bold">
                              {linha.achadoMorfologico}
                            </th>
                            <td className="px-3 py-2.5 leading-relaxed text-muted-foreground">
                              {linha.consequenciaFuncional}
                            </td>
                            <td className="px-3 py-2.5 leading-relaxed">{linha.manifestacao}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {c.normalVersusPatologico.length > 0 && (
                  <div className="mt-5">
                    <h3 className="mb-2 text-sm font-bold">Normal × patológico, lado a lado</h3>
                    <TabelaNormalPatologico linhas={c.normalVersusPatologico} />
                  </div>
                )}
              </Secao>

              {/* ── 13. Diferenciais ── */}
              <SecaoPorProfundidade nivel="aprofundar">
                <Secao id="diferenciais" titulo="Diagnósticos diferenciais">
                  {c.diagnosticosDiferenciais.length === 0 ? (
                    <EmPreparacao />
                  ) : (
                    <ul className="space-y-2.5">
                      {c.diagnosticosDiferenciais.map((d) => (
                        <li key={d.nome} className="rounded-xl border border-border bg-card p-3.5">
                          <p className="text-sm font-bold">
                            {d.slug ? (
                              <Link href={rotaDaDoenca(d.slug)} className="underline">
                                {d.nome}
                              </Link>
                            ) : (
                              d.nome
                            )}
                          </p>
                          <dl className="mt-1.5 space-y-1 text-xs leading-relaxed">
                            <div>
                              <dt className="inline font-bold">Por que confunde: </dt>
                              <dd className="inline text-muted-foreground">{d.motivoDaConfusao}</dd>
                            </div>
                            <div>
                              <dt className="inline font-bold">Compartilham: </dt>
                              <dd className="inline text-muted-foreground">
                                {d.achadosCompartilhados.join('; ')}
                              </dd>
                            </div>
                            <div>
                              <dt className="inline font-bold">Discriminador: </dt>
                              <dd className="inline">{d.discriminador}</dd>
                            </div>
                            {d.exameQueResolve && (
                              <div>
                                <dt className="inline font-bold">Exame que resolve: </dt>
                                <dd className="inline text-muted-foreground">{d.exameQueResolve}</dd>
                              </div>
                            )}
                            {d.armadilhaDeAmostragem && (
                              <div>
                                <dt className="inline font-bold">Armadilha de amostragem: </dt>
                                <dd className="inline text-muted-foreground">
                                  {d.armadilhaDeAmostragem}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </li>
                      ))}
                    </ul>
                  )}
                </Secao>
              </SecaoPorProfundidade>

              {/* ── 14. Complicações e prognóstico ── */}
              {(c.complicacoes.length > 0 || c.prognostico) && (
                <SecaoPorProfundidade nivel="aprofundar">
                  <Secao id="complicacoes" titulo="Complicações e prognóstico">
                    <ul className="space-y-1.5 text-xs leading-relaxed">
                      {c.complicacoes.map((comp) => (
                        <li key={comp.complicacao}>
                          <span className="font-bold">{comp.complicacao}</span>
                          <span className="text-muted-foreground"> — {comp.mecanismo}</span>
                        </li>
                      ))}
                    </ul>
                    {c.prognostico && (
                      <p className="mt-3 text-sm leading-relaxed">{c.prognostico.texto}</p>
                    )}
                  </Secao>
                </SecaoPorProfundidade>
              )}

              {/* ── 15. Armadilhas ── */}
              {c.armadilhas.length > 0 && (
                <Secao id="armadilhas" titulo="Armadilhas">
                  <ul className="space-y-1.5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm leading-relaxed">
                    {c.armadilhas.map((a) => (
                      <li key={a} className="flex gap-2">
                        <span aria-hidden className="shrink-0 font-bold text-rose-700 dark:text-rose-400">
                          !
                        </span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </Secao>
              )}

              {/* ── 16. Resumo ── */}
              {c.resumoDeProva.length > 0 && (
                <Secao id="resumo" titulo="Resumo de alta retenção">
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                    {c.resumoDeProva.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </Secao>
              )}

              {/* ── 17. Autoavaliação ── */}
              {c.perguntasDeAutoavaliacao.length > 0 && (
                <Secao
                  id="autoavaliacao"
                  titulo="Autoavaliação"
                  nota="Responda antes de conferir. A devolutiva explica também por que as erradas estão erradas."
                >
                  <Autoavaliacao perguntas={c.perguntasDeAutoavaliacao} />
                </Secao>
              )}

              {/* ── 18. Referências, créditos e proveniência ── */}
              <Secao id="proveniencia" titulo="Referências, créditos e proveniência">
                {c.referencias.length > 0 && (
                  <div className="mb-5">
                    <h3 className="mb-2 text-sm font-bold">Referências bibliográficas</h3>
                    <ol className="list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
                      {c.referencias.map((r) => (
                        <li key={r.citacao}>
                          {r.citacao}
                          {r.url && (
                            <>
                              {' '}
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 underline"
                              >
                                acessar
                                <ExternalLink className="h-3 w-3" aria-hidden />
                              </a>
                            </>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="mb-2 text-sm font-bold">
                    Entradas catalogadas consolidadas nesta doença
                  </h3>
                  <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                    O nome exato encontrado na fonte é preservado. A consolidação é trabalho
                    editorial do GradeX e não é atribuída às instituições de origem.
                  </p>
                  <ul className="space-y-1.5">
                    {entradas.map((entrada) => (
                      <li key={entrada.id}>
                        <Link
                          href={rotaDaEntradaCatalogada(entrada.id)}
                          className="flex min-h-[44px] flex-col justify-center rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-teal-600/50"
                        >
                          <span className="text-xs font-semibold">{entrada.nomeCompleto}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {entrada.fonteId === 'unicamp'
                              ? 'FCM/Unicamp'
                              : 'Histopathology Atlas'}{' '}
                            · {entrada.midias.toLocaleString('pt-BR')} referências ·{' '}
                            {entrada.midiasElegiveis.toLocaleString('pt-BR')} elegíveis
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card p-3.5">
                  <h3 className="mb-1.5 text-sm font-bold">Crédito das fontes</h3>
                  <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    {LISTA_DE_FONTES.filter((f) => entradas.some((e) => e.fonteId === f.id)).map(
                      (fonte) => (
                        <li key={fonte.id}>
                          <span className="font-bold">{fonte.creditoCurto}</span> —{' '}
                          {fonte.atribuicaoCatalogada}{' '}
                          <a
                            href={fonte.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {fonte.url}
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                  <Link
                    href={rotaDosCreditos()}
                    className="mt-2.5 inline-flex min-h-[36px] items-center text-[11px] font-bold underline"
                  >
                    Registro completo de direitos e alterações editoriais
                  </Link>
                </div>
              </Secao>
            </div>
          </ProvedorDeProfundidade>

          {/* ── Rodapé de navegação ── */}
          <nav className="mt-12 flex flex-wrap gap-2 border-t border-border pt-6">
            <Link
              href={BASE}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-card px-3.5 text-sm font-bold transition-colors hover:border-teal-600/50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Histopatologia
            </Link>
            {doenca.mecanismoIds.map((id) => {
              const mecanismo = MECANISMOS_PUBLICADOS.find((m) => m.id === id)
              if (!mecanismo) return null
              return (
                <Link
                  key={id}
                  href={rotaDoMecanismo(id)}
                  className="inline-flex min-h-[44px] items-center rounded-md border border-border bg-card px-3.5 text-sm font-semibold transition-colors hover:border-violet-600/50"
                >
                  {mecanismo.nome}
                </Link>
              )
            })}
          </nav>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildJsonLd(jsonLdDeDoenca(doenca)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildJsonLd(jsonLdDeTrilha(trilha)) }}
        />
      </div>
    </AppShell>
  )
}

function Secao({
  id,
  titulo,
  nota,
  children,
}: {
  id: string
  titulo: string
  nota?: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-heading text-xl font-semibold tracking-tight">
        {titulo}
      </h2>
      {nota && <p className="mb-3 mt-1 text-xs leading-relaxed text-muted-foreground">{nota}</p>}
      <div className={nota ? '' : 'mt-3'}>{children}</div>
    </section>
  )
}
