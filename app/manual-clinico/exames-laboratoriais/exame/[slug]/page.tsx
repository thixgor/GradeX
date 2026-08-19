import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { AvisoDeContexto, AvisoDeReferencia, BlocoDaFolha, CabecalhoDaFolha, LinhaResultado } from '@/components/exames-laboratoriais/folha'
import { BotaoFavorito } from '@/components/exames-laboratoriais/interacoes'
import { GerarParaPraticar } from '@/components/exames-laboratoriais/laboratorio'
import { EXAMES, EXAME_POR_ID, PADRAO_POR_ID, marcadoresPorIds } from '@/lib/exames-laboratoriais'

/**
 * A página de um exame completo.
 *
 * O desenho imita o objeto real — uma folha de laudo com os blocos na ordem em
 * que o laboratório os imprime — e acrescenta o que o papel não tem: cada linha
 * é um link, e antes dos valores vem o roteiro de leitura. É a diferença entre
 * mostrar um exame e ensinar a lê-lo.
 *
 * A folha aqui não traz valores: traz o nome do marcador, a faixa de referência
 * e a seta vazia. O valor entra no Laboratório Virtual, embutido no fim da
 * página, onde ele pode ser gerado quantas vezes a pessoa quiser.
 */

export function generateStaticParams() {
  return EXAMES.map((e) => ({ slug: e.id }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const e = EXAME_POR_ID.get(params.slug)
  if (!e) return { title: 'Exame não encontrado | DomineAqui Lab' }
  return {
    title: `${e.nome} — o que avalia e como interpretar | DomineAqui Lab`,
    description: e.oQueAvalia,
  }
}

export default function PaginaDoExame({ params }: { params: { slug: string } }) {
  const exame = EXAME_POR_ID.get(params.slug)
  if (!exame) notFound()

  const padroes = (exame.padroes ?? []).map((id) => PADRAO_POR_ID.get(id)).filter((p): p is NonNullable<typeof p> => !!p)

  return (
    <AreaDosExames alvo={exame.nome}>
      <CabecalhoDaSecao
        titulo={exame.nome}
        subtitulo={exame.oQueAvalia}
        acoes={
          <BotaoFavorito
            item={{ tipo: 'exame', id: exame.id, nome: exame.nome, href: `/manual-clinico/exames-laboratoriais/exame/${exame.id}` }}
          />
        }
      />

      <div className="container mx-auto max-w-4xl px-4 pb-16 pt-6">
        {/* ══════════ Roteiro de leitura ══════════ */}
        <section className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-5">
          <p className="lab-rubrica">Como interpretar</p>
          <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight">O roteiro, na ordem certa</h2>
          <ol className="mt-3 space-y-2">
            {exame.comoInterpretar.map((passo, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed">{passo}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ══════════ A folha ══════════ */}
        <div className="mt-6 lab-folha">
          <CabecalhoDaFolha titulo={exame.nome} material={exame.material} />
          {exame.blocos.map((bloco) => {
            const marcadores = marcadoresPorIds(bloco.marcadores)
            return (
              <BlocoDaFolha key={bloco.titulo} titulo={bloco.titulo} descricao={bloco.descricao}>
                {marcadores.map((m) => (
                  <LinhaResultado
                    key={m.id}
                    linha={{
                      id: m.id,
                      nome: m.nome + (m.sigla ? ` (${m.sigla})` : ''),
                      valor: '—',
                      unidade: m.unidade,
                      referencia: referenciaCurta(m.referencias),
                      direcao: 'normal',
                      nota: m.resumo,
                    }}
                  />
                ))}
              </BlocoDaFolha>
            )
          })}
          <div className="px-5 pb-4 pt-3">
            <AvisoDeReferencia />
          </div>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Toque em qualquer linha para abrir a ficha do marcador — o que é, por que sobe, por que cai, como diferenciar.
        </p>

        {/* ══════════ Preparo ══════════ */}
        {exame.preparo && exame.preparo.length > 0 && (
          <section className="mt-8">
            <p className="lab-rubrica">Antes da coleta</p>
            <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">Preparo e armadilhas</h2>
            <ul className="mt-3 space-y-1.5">
              {exame.preparo.map((p) => (
                <li key={p} className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm leading-relaxed">
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ══════════ Alterações comuns ══════════ */}
        {exame.alteracoesComuns && exame.alteracoesComuns.length > 0 && (
          <section className="mt-8">
            <p className="lab-rubrica">Na prática</p>
            <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">Alterações que mais aparecem</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {exame.alteracoesComuns.map((a) => (
                <li key={a.titulo} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-bold leading-snug">{a.titulo}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.descricao}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ══════════ Padrões ══════════ */}
        {padroes.length > 0 && (
          <section className="mt-8">
            <p className="lab-rubrica">Padrões</p>
            <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">O que este exame revela</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {padroes.map((p) => (
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
          </section>
        )}

        {/* ══════════ Praticar ══════════ */}
        {exame.cenarios && exame.cenarios.length > 0 && (
          <div className="mt-8">
            <GerarParaPraticar cenarios={exame.cenarios} titulo={`Gerar ${exame.nome.toLowerCase()} para praticar`} />
          </div>
        )}

        {/* ══════════ Outros painéis ══════════ */}
        <section className="mt-10">
          <p className="lab-rubrica">Continue</p>
          <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight">Outros painéis</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {EXAMES.filter((e) => e.id !== exame.id).map((e) => (
              <li key={e.id}>
                <Link
                  href={`/manual-clinico/exames-laboratoriais/exame/${e.id}`}
                  prefetch={false}
                  className="inline-flex rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium transition hover:border-primary/40"
                >
                  {e.nome}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8">
          <AvisoDeContexto />
        </div>
      </div>
    </AreaDosExames>
  )
}

type ReferenciaCurta = { rotulo: string; minimo?: number; maximo?: number; texto?: string; unidade: string }

const fmtNumero = (n?: number) => (n == null ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: 3 }))

function faixaEscrita(r: ReferenciaCurta): string {
  return r.texto ?? `${fmtNumero(r.minimo)} – ${fmtNumero(r.maximo)}`
}

/**
 * A referência do adulto, encurtada para caber na coluna da folha.
 *
 * Nas linhagens do leucograma o laudo real imprime duas colunas — a relativa e
 * a absoluta — e a folha faz o mesmo: quando o marcador declara uma faixa
 * percentual para o adulto, ela vem logo depois do intervalo absoluto. O
 * absoluto continua vindo primeiro porque é ele que interpreta; o percentual
 * está ali porque é o número que aparece impresso no hemograma.
 */
function referenciaCurta(referencias: ReferenciaCurta[]): string {
  const principal = referencias[0]
  if (!principal) return '—'

  const percentual = referencias.find((r) => r !== principal && r.unidade === '%' && /percentual/i.test(r.rotulo))
  const base = faixaEscrita(principal)
  return percentual ? `${base} · ${faixaEscrita(percentual)}%` : base
}
