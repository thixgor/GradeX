import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { AvisoDeContexto, AvisoDeReferencia, Etiqueta } from '@/components/exames-laboratoriais/folha'
import { BotaoFavorito } from '@/components/exames-laboratoriais/interacoes'
import { GerarParaPraticar } from '@/components/exames-laboratoriais/laboratorio'
import { CorpoDaAlteracao, Secao, corDaDirecao } from '@/components/exames-laboratoriais/secoes'
import {
  ALTERACOES,
  ROTULO_DO_GRUPO,
  SISTEMA_POR_ID,
  alteracaoPorId,
  alteracoesDoMarcador,
  blocoDaAlteracao,
  doencasDaAlteracao,
  marcadorPorId,
  padroesDaAlteracao,
} from '@/lib/exames-laboratoriais'
import type { FaixaReferencia } from '@/lib/exames-laboratoriais/tipos'

/**
 * A página de uma alteração laboratorial.
 *
 * Quem digita "hiponatremia" não está pedindo a ficha do sódio: está com um
 * laudo na mão em que o sódio veio baixo. A ficha do marcador explica o sódio
 * inteiro — por que sobe *e* por que cai —, e mandar essa pessoa para lá é
 * entregar o dobro do conteúdo com metade da resposta.
 *
 * Por isso esta página abre pelo lado que interessa: o bloco da ficha que
 * corresponde à direção do achado, as doenças cujo padrão esperado move o
 * marcador para aquele lado, os padrões em que ele aparece assim — e, no fim, o
 * caminho para a ficha completa, para quem quiser o marcador inteiro.
 */

export function generateStaticParams() {
  return ALTERACOES.map((a) => ({ slug: a.id }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = alteracaoPorId(params.slug)
  if (!a) return { title: 'Alteração não encontrada | DomineAqui Lab' }
  const nome = capitalizar(a.termo)
  return {
    title: `${nome} — o que é, por que acontece e o que investigar | DomineAqui Lab`,
    description: `${a.descricao}. O mecanismo por trás do achado, as causas por frequência, as doenças que o produzem e como diferenciá-las.`,
  }
}

export default function PaginaDaAlteracao({ params }: { params: { slug: string } }) {
  const alteracao = alteracaoPorId(params.slug)
  if (!alteracao) notFound()

  const marcador = marcadorPorId(alteracao.marcador)
  if (!marcador) notFound()

  const bloco = blocoDaAlteracao(alteracao)
  const doencas = doencasDaAlteracao(alteracao)
  const padroes = padroesDaAlteracao(alteracao)
  const oposta = alteracoesDoMarcador(alteracao.marcador).find((a) => a.id !== alteracao.id && a.direcao !== alteracao.direcao)
  const irmas = ALTERACOES.filter(
    (a) => a.id !== alteracao.id && a.id !== oposta?.id && marcadorPorId(a.marcador)?.grupo === marcador.grupo,
  ).slice(0, 10)
  const cenarios = Array.from(new Set(doencas.map((d) => d.cenario).filter((c): c is string => !!c)))

  const nome = capitalizar(alteracao.termo)
  const seta = alteracao.direcao === 'alta' ? '↑' : '↓'
  const fichaDoMarcador = `/manual-clinico/exames-laboratoriais/marcador/${marcador.id}`

  return (
    <AreaDosExames alvo={nome}>
      <CabecalhoDaSecao
        titulo={nome}
        subtitulo={`${alteracao.descricao} — ${marcador.nome}${marcador.sigla ? ` (${marcador.sigla})` : ''} ${seta}.`}
        voltar="/manual-clinico/exames-laboratoriais/alteracoes"
        rotuloVoltar="Voltar às alterações"
        acoes={
          <BotaoFavorito
            item={{
              tipo: 'alteracao',
              id: alteracao.id,
              nome,
              href: `/manual-clinico/exames-laboratoriais/alteracao/${alteracao.id}`,
            }}
          />
        }
      />

      <div className="container mx-auto max-w-4xl px-4 pb-16 pt-6">
        {alteracao.sinonimos && alteracao.sinonimos.length > 0 && (
          <p className="text-xs text-muted-foreground">Também chamada de: {alteracao.sinonimos.map(capitalizar).join(' · ')}</p>
        )}

        {/* ══════════ O achado ══════════ */}
        <div className="mt-3 lab-folha">
          <div className="lab-cabecalho">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="lab-marca">{ROTULO_DO_GRUPO[marcador.grupo]}</p>
              <p className="lab-meta">Material: {marcador.material}</p>
            </div>
            <h2 className="lab-titulo-folha">
              <Link href={fichaDoMarcador} prefetch={false} className="hover:text-primary hover:underline">
                {marcador.nome}
              </Link>
              <span className={`ml-2 font-mono text-base font-bold ${corDaDirecao(seta)}`}>{seta}</span>
            </h2>
            <p className="lab-meta mt-1">{marcador.resumo}</p>
          </div>

          <div className="px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">O achado</p>
            <p className="mt-1 text-sm leading-relaxed">{alteracao.descricao}.</p>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Valores de referência do marcador
            </p>
            <ul className="mt-2 divide-y divide-dashed divide-border">
              {marcador.referencias.map((r) => (
                <li key={r.rotulo} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2">
                  <span className="text-sm font-medium">{r.rotulo}</span>
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {faixaEscrita(r)}
                    <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{r.unidade}</span>
                  </span>
                  {r.observacao && <span className="w-full text-xs leading-relaxed text-muted-foreground">{r.observacao}</span>}
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <AvisoDeReferencia />
            </div>
          </div>
        </div>

        {/* ══════════ Por que acontece ══════════ */}
        {bloco ? (
          <Secao
            titulo={`Por que ${marcador.sigla ?? marcador.nome} ${alteracao.direcao === 'alta' ? 'sobe' : 'cai'}`}
            rubrica="O mecanismo"
          >
            <CorpoDaAlteracao alteracao={bloco} tom={alteracao.direcao} />
          </Secao>
        ) : (
          <Secao titulo="O mecanismo" rubrica="Onde ler">
            <p className="rounded-lg border border-border bg-muted/25 px-4 py-3 text-sm leading-relaxed">
              O mecanismo deste achado está escrito na ficha completa de{' '}
              <Link href={fichaDoMarcador} prefetch={false} className="font-semibold text-primary hover:underline">
                {marcador.nome}
              </Link>
              .
            </p>
          </Secao>
        )}

        {/* ══════════ Doenças ══════════ */}
        {doencas.length > 0 && (
          <Secao titulo="Doenças que produzem este achado" rubrica="Onde ele aparece">
            <ul className="space-y-2">
              {doencas.map((d) => {
                const achado = d.esperado.find((e) => e.id === alteracao.marcador)
                return (
                  <li key={d.id}>
                    <Link
                      href={`/manual-clinico/exames-laboratoriais/doenca/${d.id}`}
                      prefetch={false}
                      className="lab-cartao lab-cartao-link block p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <p className="text-sm font-bold leading-snug">{d.nome}</p>
                        {achado && (
                          <span className={`font-mono text-sm font-bold ${corDaDirecao(achado.direcao)}`}>{achado.direcao}</span>
                        )}
                      </div>
                      {achado && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{achado.porque}</p>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Secao>
        )}

        {/* ══════════ Padrões ══════════ */}
        {padroes.length > 0 && (
          <Secao titulo="Padrões em que este achado é peça" rubrica="Não leia isolado">
            <ul className="grid gap-3 sm:grid-cols-2">
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
          </Secao>
        )}

        {/* ══════════ Praticar ══════════ */}
        {cenarios.length > 0 && (
          <div className="mt-8">
            <GerarParaPraticar cenarios={cenarios} titulo={`Gerar um exame com ${alteracao.termo}`} />
          </div>
        )}

        {/* ══════════ O outro lado e a ficha ══════════ */}
        <Secao titulo="Continue por aqui" rubrica="O marcador inteiro">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={fichaDoMarcador} prefetch={false} className="lab-cartao lab-cartao-link block h-full p-4">
              <p className="lab-rubrica">Ficha completa</p>
              <p className="mt-1 text-sm font-bold leading-snug">
                {marcador.nome}
                {marcador.sigla && <span className="ml-1.5 font-mono text-xs text-muted-foreground">{marcador.sigla}</span>}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Fisiologia, interferentes, cinética, diferenciais e como o marcador tende a normalizar.
              </p>
            </Link>
            {oposta && (
              <Link
                href={`/manual-clinico/exames-laboratoriais/alteracao/${oposta.id}`}
                prefetch={false}
                className="lab-cartao lab-cartao-link block h-full p-4"
              >
                <p className="lab-rubrica">O outro lado</p>
                <p className="mt-1 text-sm font-bold capitalize leading-snug">
                  {oposta.termo}
                  <span className={`ml-1.5 font-mono ${corDaDirecao(oposta.direcao === 'alta' ? '↑' : '↓')}`}>
                    {oposta.direcao === 'alta' ? '↑' : '↓'}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{oposta.descricao}</p>
              </Link>
            )}
          </div>

          {irmas.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Outras alterações de {ROTULO_DO_GRUPO[marcador.grupo].toLowerCase()}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {irmas.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/manual-clinico/exames-laboratoriais/alteracao/${a.id}`}
                      prefetch={false}
                      className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium capitalize transition hover:border-primary/40"
                    >
                      {a.termo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {marcador.sistemas.map((s) => (
              <Etiqueta key={s}>{SISTEMA_POR_ID.get(s)?.nome ?? s}</Etiqueta>
            ))}
          </div>
        </Secao>

        <div className="mt-8">
          <AvisoDeContexto />
        </div>
      </div>
    </AreaDosExames>
  )
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const fmtNumero = (n?: number) => (n == null ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: 3 }))

function faixaEscrita(r: FaixaReferencia): string {
  return r.texto ?? `${fmtNumero(r.minimo)} – ${fmtNumero(r.maximo)}`
}
