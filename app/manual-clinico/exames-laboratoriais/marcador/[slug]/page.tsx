import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { Advertencia, AvisoDeContexto, AvisoDeReferencia, Etiqueta, Fluxo, TabelaComparativa } from '@/components/exames-laboratoriais/folha'
import { BotaoFavorito, Expansivel, Profundidade } from '@/components/exames-laboratoriais/interacoes'
import { GerarParaPraticar } from '@/components/exames-laboratoriais/laboratorio'
import { Campo, Lista, Secao, SecaoDeAlteracao } from '@/components/exames-laboratoriais/secoes'
import {
  MARCADORES,
  ROTULO_DO_GRUPO,
  alteracoesDoMarcador,
  comparacoesDoMarcador,
  doencasDoMarcador,
  examesDoMarcador,
  marcadorPorId,
  marcadoresPorIds,
  padroesDoMarcador,
} from '@/lib/exames-laboratoriais'
import type { Marcador } from '@/lib/exames-laboratoriais/tipos'

/**
 * A ficha de um marcador — a peça central da seção.
 *
 * A ordem das seções não é estética: é a ordem em que o raciocínio clínico
 * acontece. O que é → como funciona normalmente → o que o exame mede → valor de
 * referência → que achados o marcador nomeia → o que significa subir e por quê
 * → o que significa cair e por quê → causas → diferenciais → como diferenciar →
 * marcadores relacionados → padrões → como tende a normalizar → casos para
 * praticar.
 *
 * Os achados com nome próprio (hiponatremia, microcitose) têm página só deles,
 * em `/alteracao/[id]`: esta ficha explica o marcador nos dois sentidos, e quem
 * chegou com um laudo na mão tem apenas um deles.
 *
 * Tudo é renderizado no servidor. As únicas ilhas de cliente são o seletor de
 * profundidade, os blocos expansíveis, o botão de favorito e o gerador de
 * exames — cada um recebendo conteúdo pronto como `children`.
 */

export function generateStaticParams() {
  return MARCADORES.map((m) => ({ slug: m.id }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const m = marcadorPorId(params.slug)
  if (!m) return { title: 'Marcador não encontrado | DomineAqui Lab' }
  return {
    title: `${m.nome}${m.sigla ? ` (${m.sigla})` : ''} — o que é, por que sobe e por que cai | DomineAqui Lab`,
    description: m.resumo,
  }
}

export default function PaginaDoMarcador({ params }: { params: { slug: string } }) {
  const marcador = marcadorPorId(params.slug)
  if (!marcador) notFound()

  const relacionados = padroesDoMarcador(marcador.id)
  const doencas = doencasDoMarcador(marcador.id)
  const exames = examesDoMarcador(marcador.id)
  const comparacoes = comparacoesDoMarcador(marcador.id)
  const estudarTambem = marcadoresPorIds(marcador.estudarTambem ?? [])
  const alteracoes = alteracoesDoMarcador(marcador.id)
  const cenarios = Array.from(new Set(doencas.map((d) => d.cenario).filter((c): c is string => !!c)))

  return (
    <AreaDosExames alvo={marcador.nome}>
      <CabecalhoDaSecao
        titulo={marcador.nome}
        subtitulo={marcador.resumo}
        acoes={
          <BotaoFavorito
            item={{
              tipo: 'marcador',
              id: marcador.id,
              nome: marcador.nome,
              href: `/manual-clinico/exames-laboratoriais/marcador/${marcador.id}`,
            }}
          />
        }
      />

      <div className="container mx-auto max-w-4xl px-4 pb-16 pt-6">
        {/* ══════════ Cartão de resultado ══════════ */}
        <CartaoDoMarcador marcador={marcador} />

        {marcador.advertencia && (
          <div className="mt-4">
            <Advertencia>{marcador.advertencia}</Advertencia>
          </div>
        )}

        {/* ══════════ O que é ══════════ */}
        <Secao titulo="O que é?" rubrica="Definição">
          <Profundidade
            resumo={<p>{marcador.resumo}</p>}
            entenda={marcador.entenda ? <p>{marcador.entenda}</p> : undefined}
            aprofundar={
              marcador.aprofundar ? (
                <div className="space-y-3">
                  {marcador.aprofundar.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : undefined
            }
          />
        </Secao>

        {/* ══════════ Fisiologia ══════════ */}
        <Secao titulo="Fisiologia do marcador" rubrica="Como funciona quando está tudo bem">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="O que é" valor={marcador.fisiologia.oQueE} />
            <Campo rotulo="Onde é produzido" valor={marcador.fisiologia.origem} />
            {marcador.fisiologia.sintese && <Campo rotulo="Como é sintetizado" valor={marcador.fisiologia.sintese} />}
            {marcador.fisiologia.circulacao && <Campo rotulo="Como circula" valor={marcador.fisiologia.circulacao} />}
            <Campo rotulo="Qual é a função" valor={marcador.fisiologia.funcao} />
            {marcador.fisiologia.metabolismo && <Campo rotulo="Como é metabolizado" valor={marcador.fisiologia.metabolismo} />}
            {marcador.fisiologia.eliminacao && <Campo rotulo="Como é eliminado" valor={marcador.fisiologia.eliminacao} />}
            {marcador.fisiologia.meiaVida && <Campo rotulo="Meia-vida" valor={marcador.fisiologia.meiaVida} />}
          </div>

          {marcador.fisiologia.orgaosEnvolvidos && marcador.fisiologia.orgaosEnvolvidos.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Órgãos envolvidos</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {marcador.fisiologia.orgaosEnvolvidos.map((o) => (
                  <li key={o}>
                    <Etiqueta>{o}</Etiqueta>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {marcador.fisiologia.percurso && marcador.fisiologia.percurso.length > 0 && (
            <div className="mt-5 rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">O percurso</p>
              <div className="mt-2.5">
                <Fluxo etapas={marcador.fisiologia.percurso} compacto />
              </div>
            </div>
          )}
        </Secao>

        {/* ══════════ Alterações com nome próprio ══════════ */}
        {alteracoes.length > 0 && (
          <Secao titulo="Os achados que este marcador nomeia" rubrica="Alterações">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {alteracoes.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/manual-clinico/exames-laboratoriais/alteracao/${a.id}`}
                    prefetch={false}
                    className="lab-cartao lab-cartao-link block h-full p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold capitalize leading-snug">{a.termo}</p>
                      <span
                        className={`shrink-0 font-mono text-sm font-bold ${
                          a.direcao === 'alta' ? 'text-amber-700 dark:text-amber-400' : 'text-sky-700 dark:text-sky-400'
                        }`}
                      >
                        {a.direcao === 'alta' ? '↑' : '↓'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.descricao}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {/* ══════════ Aumento ══════════ */}
        <SecaoDeAlteracao titulo="Quando está aumentado ↑" alteracao={marcador.aumento} tom="alta" />

        {/* ══════════ Redução ══════════ */}
        {marcador.reducao && marcador.reducao.mecanismos.length > 0 && (
          <SecaoDeAlteracao titulo="Quando está diminuído ↓" alteracao={marcador.reducao} tom="baixa" />
        )}

        {/* ══════════ Diferenciais ══════════ */}
        {marcador.diferenciais && marcador.diferenciais.length > 0 && (
          <Secao titulo="Diagnósticos diferenciais" rubrica="O que mais explicaria este achado">
            <ul className="space-y-3">
              {marcador.diferenciais.map((d) => (
                <li key={d.hipotese} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-bold">{d.hipotese}</p>
                  <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    O que aponta para ela
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {d.pistas.map((p) => (
                      <li key={p}>
                        <Etiqueta>{p}</Etiqueta>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2.5 text-sm leading-relaxed">
                    <span className="font-semibold">Como confirmar: </span>
                    <span className="text-muted-foreground">{d.comoConfirmar}</span>
                  </p>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {/* ══════════ Comparações ══════════ */}
        {comparacoes.length > 0 && (
          <Secao titulo="Como diferenciar?" rubrica="Lado a lado">
            <div className="space-y-5">
              {comparacoes.map((c) => (
                <article key={c.id} id={c.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <h3 className="font-heading text-base font-semibold tracking-tight">{c.titulo}</h3>
                  {c.pergunta && <p className="mt-1 text-xs text-muted-foreground">{c.pergunta}</p>}
                  <div className="mt-3">
                    <TabelaComparativa hipoteses={c.hipoteses} linhas={c.linhas} />
                  </div>
                  <div className="mt-3 rounded-lg border border-border bg-muted/25 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">A leitura</p>
                    <p className="mt-1 text-sm leading-relaxed">{c.leitura}</p>
                  </div>
                  {c.limites && (
                    <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">O que essa tabela não resolve: </span>
                      {c.limites}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </Secao>
        )}

        {/* ══════════ Relacionados ══════════ */}
        {marcador.relacionados && marcador.relacionados.length > 0 && (
          <Secao titulo="Não interprete isoladamente" rubrica="Marcadores relacionados">
            <div className="space-y-4">
              {marcador.relacionados.map((r) => (
                <div key={r.titulo} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-bold">{r.titulo}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {marcadoresPorIds(r.ids).map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/manual-clinico/exames-laboratoriais/marcador/${m.id}`}
                          prefetch={false}
                          className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium transition hover:border-primary/40"
                        >
                          {m.sigla ?? m.nome}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{r.leitura}</p>
                </div>
              ))}
            </div>
          </Secao>
        )}

        {/* ══════════ Padrões ══════════ */}
        {relacionados.length > 0 && (
          <Secao titulo="Padrões laboratoriais" rubrica="Onde este marcador é peça">
            <ul className="grid gap-3 sm:grid-cols-2">
              {relacionados.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/manual-clinico/exames-laboratoriais/padroes#${p.id}`}
                    prefetch={false}
                    className="lab-cartao lab-cartao-link block h-full p-4"
                  >
                    <p className="text-sm font-bold leading-snug">{p.nome}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{p.assinatura}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {/* ══════════ Interferentes ══════════ */}
        {marcador.interferentes && (
          <Secao titulo="O que altera este resultado sem representar doença?" rubrica="Interferentes">
            <div className="space-y-2.5">
              {marcador.interferentes.preAnalitico && marcador.interferentes.preAnalitico.length > 0 && (
                <Expansivel titulo="Pré-analítico" detalhe="Jejum, horário, postura, garrote, coleta, hemólise, transporte" contagem={marcador.interferentes.preAnalitico.length}>
                  <Lista itens={marcador.interferentes.preAnalitico} />
                </Expansivel>
              )}
              {marcador.interferentes.fisiologico && marcador.interferentes.fisiologico.length > 0 && (
                <Expansivel titulo="Fisiológico" detalhe="Idade, sexo, gravidez, exercício, alimentação, hidratação, ritmo circadiano" contagem={marcador.interferentes.fisiologico.length}>
                  <Lista itens={marcador.interferentes.fisiologico} />
                </Expansivel>
              )}
              {marcador.interferentes.medicamentos && marcador.interferentes.medicamentos.length > 0 && (
                <Expansivel titulo="Medicamentos" detalhe="Fármacos com interferência de fato relevante" contagem={marcador.interferentes.medicamentos.length}>
                  <Lista itens={marcador.interferentes.medicamentos} />
                </Expansivel>
              )}
              {marcador.interferentes.metodo && marcador.interferentes.metodo.length > 0 && (
                <Expansivel titulo="Método laboratorial" detalhe="Por que o mesmo soro dá números diferentes em laboratórios diferentes" contagem={marcador.interferentes.metodo.length}>
                  <Lista itens={marcador.interferentes.metodo} />
                </Expansivel>
              )}
            </div>
          </Secao>
        )}

        {/* ══════════ Cinética ══════════ */}
        {marcador.cinetica && (
          <Secao titulo="Cinética" rubrica="Quando sobe, quando cai, o que a tendência informa">
            <div className="grid gap-3 sm:grid-cols-2">
              {marcador.cinetica.inicio && <Campo rotulo="Quando começa a subir" valor={marcador.cinetica.inicio} />}
              {marcador.cinetica.pico && <Campo rotulo="Pico" valor={marcador.cinetica.pico} />}
              {marcador.cinetica.normalizacao && <Campo rotulo="Tempo até normalizar" valor={marcador.cinetica.normalizacao} />}
              {marcador.cinetica.tendencia && <Campo rotulo="Por que a tendência importa" valor={marcador.cinetica.tendencia} />}
            </div>
          </Secao>
        )}

        {/* ══════════ Normalização ══════════ */}
        {marcador.normalizacao && marcador.normalizacao.length > 0 && (
          <Secao titulo="Como esse marcador pode voltar ao normal?" rubrica="Tratar a causa, não o número">
            <p className="mb-3 rounded-lg border border-primary/25 bg-primary/[0.04] px-4 py-3 text-sm leading-relaxed">
              O marcador normaliza quando a causa responsável pela alteração é corrigida. Não existe tratamento do
              número — existe tratamento do que o produziu.
            </p>
            <ul className="space-y-3">
              {marcador.normalizacao.map((n) => (
                <li key={n.cenario} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-bold">{n.cenario}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{n.caminho}</p>
                  {n.prazo && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Prazo esperado: </span>
                      {n.prazo}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {/* ══════════ Doenças e exames ══════════ */}
        {(doencas.length > 0 || exames.length > 0) && (
          <Secao titulo="Onde este marcador aparece" rubrica="Doenças e painéis">
            <div className="grid gap-4 sm:grid-cols-2">
              {doencas.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Doenças relacionadas</p>
                  <ul className="mt-2 space-y-1.5">
                    {doencas.map((d) => (
                      <li key={d.id}>
                        <Link
                          href={`/manual-clinico/exames-laboratoriais/doenca/${d.id}`}
                          prefetch={false}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {d.nome}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {exames.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Painéis que o contêm</p>
                  <ul className="mt-2 space-y-1.5">
                    {exames.map((e) => (
                      <li key={e.id}>
                        <Link
                          href={`/manual-clinico/exames-laboratoriais/exame/${e.id}`}
                          prefetch={false}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {e.nome}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Secao>
        )}

        {/* ══════════ Praticar ══════════ */}
        {cenarios.length > 0 && (
          <div className="mt-8">
            <GerarParaPraticar cenarios={cenarios} titulo="Casos para praticar" />
          </div>
        )}

        {/* ══════════ Estudar também ══════════ */}
        {estudarTambem.length > 0 && (
          <Secao titulo="Você também deveria estudar" rubrica="Conteúdo relacionado">
            <ul className="grid gap-2 sm:grid-cols-2">
              {estudarTambem.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/manual-clinico/exames-laboratoriais/marcador/${m.id}`}
                    prefetch={false}
                    className="lab-cartao lab-cartao-link block p-3.5"
                  >
                    <p className="text-sm font-bold">
                      {m.nome}
                      {m.sigla && <span className="ml-1.5 font-mono text-xs text-muted-foreground">{m.sigla}</span>}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{m.resumo}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        <div className="mt-8">
          <AvisoDeContexto />
        </div>
      </div>
    </AreaDosExames>
  )
}

/* ═══════════════════════════ Peças da ficha ═══════════════════════════ */

/** O cartão que abre a ficha, com a cara de um resultado de laboratório. */
function CartaoDoMarcador({ marcador }: { marcador: Marcador }) {
  return (
    <div className="lab-folha">
      <div className="lab-cabecalho">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="lab-marca">{ROTULO_DO_GRUPO[marcador.grupo]}</p>
          <p className="lab-meta">Material: {marcador.material}</p>
        </div>
        <h2 className="lab-titulo-folha">
          {marcador.nome}
          {marcador.sigla && <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">{marcador.sigla}</span>}
        </h2>
        {marcador.sinonimos && marcador.sinonimos.length > 0 && (
          <p className="lab-meta mt-1">Também chamado de: {marcador.sinonimos.slice(0, 4).join(' · ')}</p>
        )}
      </div>

      <div className="px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Valores de referência</p>
        <ul className="mt-2 divide-y divide-dashed divide-border">
          {marcador.referencias.map((r) => (
            <li key={r.rotulo} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2">
              <span className="text-sm font-medium">{r.rotulo}</span>
              <span className="font-mono text-sm font-bold tabular-nums">
                {r.texto ?? `${formatar(r.minimo)} – ${formatar(r.maximo)}`}
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{r.unidade}</span>
              </span>
              {r.observacao && <span className="w-full text-xs leading-relaxed text-muted-foreground">{r.observacao}</span>}
            </li>
          ))}
        </ul>

        {marcador.utilidade && marcador.utilidade.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Para que serve</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {marcador.utilidade.map((u) => (
                <li key={u}>
                  <Etiqueta tom="destaque">{ROTULO_DA_UTILIDADE[u]}</Etiqueta>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <AvisoDeReferencia />
        </div>
      </div>
    </div>
  )
}

const ROTULO_DA_UTILIDADE: Record<string, string> = {
  diagnostico: 'Diagnóstico',
  prognostico: 'Prognóstico',
  rastreamento: 'Rastreamento',
  acompanhamento: 'Acompanhamento',
  triagem: 'Triagem',
}

function formatar(n?: number): string {
  if (n == null) return '—'
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

