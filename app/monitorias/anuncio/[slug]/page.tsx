'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft, BookOpenCheck, CalendarCheck, ChevronDown, ExternalLink, Gift, Loader2, MessageCircleQuestion,
  MessagesSquare, ShieldCheck, Star, Users, X, HeartHandshake, Link2, Undo2, FileSignature, Wallet,
} from 'lucide-react'
import { PageScaffold } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Aparecer, Avatar, CaixaErro, Esqueleto, ErroApi, api } from '@/components/monitorias/base'
import { GaleriaVideos } from '@/components/monitorias/galeria-videos'
import { LinkExternoSeguro } from '@/components/monitorias/link-externo-seguro'
import { Agendador, irParaLogin } from '@/components/monitorias/agendador'
import { DialogoPedido } from '@/components/monitorias/dialogo-pedido'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { economiaGrupoPercent } from '@/lib/monitorias/precos'
import { formatarDuracao, NOMES_DIAS_CURTOS } from '@/lib/monitorias/agenda'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'
import type { ConteudoAnuncio, JanelaSemanal } from '@/lib/monitorias/tipos'

interface Dados {
  anuncio: ConteudoAnuncio & {
    id: string
    slug: string
    modos: { direto: ConteudoAnuncio['modos']['direto'] | null; negociacao: boolean; aCombinar: boolean }
    stats: { reservas: number; nota: number; avaliacoes: number; perguntas: number }
  }
  tutor: { id: string; donoChave: string; nome: string; titulo: string; bio: string; historia: string; fotoUrl: string | null; stats: { aulasDadas: number; nota: number; avaliacoes: number }; membroDesde: string }
  disponibilidade: JanelaSemanal[]
  perguntas: Pergunta[]
  avaliacoes: Array<{ nome: string; foto?: string | null; nota: number; comentario: string; em: string }>
  outros: Array<{ slug: string; titulo: string; materia: string; preco: ConteudoAnuncio['preco'] }>
}

interface Pergunta {
  id: string
  autorNome: string
  texto: string
  resposta: { texto: string; em: string } | null
  createdAt: string
}

type Folha = null | { tipo: 'agendar'; gratis: boolean } | { tipo: 'pedido'; modo: 'negociacao' | 'a_combinar'; gratis: boolean }

export default function PaginaAnuncio({ params }: { params: { slug: string } }) {
  const reduzir = useReducedMotion()
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState('')
  const [folha, setFolha] = useState<Folha>(null)
  const [faqAberto, setFaqAberto] = useState<number | null>(0)
  const [eu, setEu] = useState<string | null>(null)

  useEffect(() => {
    api<Dados>(`/api/monitorias/publico/anuncios/${params.slug}`)
      .then(setDados)
      .catch((e) => setErro(e.message))
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEu(d?.user?._id || d?._id || null))
      .catch(() => {})
  }, [params.slug])

  // Agenda online: quantos horários livres há nesta semana (o CDN segura 15 s,
  // então isto custa quase nada). Vira o "restam N horários" do card de preço.
  const [livres, setLivres] = useState<{ semana: number; proximo: { dia: string; hora: string; inicio: string } | null } | null>(null)
  const temDireto = !!dados?.anuncio.modos.direto
  useEffect(() => {
    if (!temDireto) return
    api<{ horarios: Array<{ inicio: string; dia: string; hora: string }> }>(`/api/monitorias/publico/anuncios/${params.slug}/horarios`)
      .then((r) => {
        const limite = Date.now() + 7 * 86_400_000
        setLivres({ semana: r.horarios.filter((h) => new Date(h.inicio).getTime() <= limite).length, proximo: r.horarios[0] || null })
      })
      .catch(() => {})
  }, [temDireto, params.slug])

  // O anúncio traz só o resumo (SHA-256) do dono; calculamos o nosso e comparamos.
  const [euChave, setEuChave] = useState<string | null>(null)
  useEffect(() => {
    if (!eu || typeof crypto === 'undefined' || !crypto.subtle) return
    crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(`monitorias:dono:${eu}`))
      .then((buf) => setEuChave(Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')))
      .catch(() => {})
  }, [eu])

  useEffect(() => {
    document.body.style.overflow = folha ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [folha])

  if (erro) {
    return (
      <PageScaffold>
        <div className="mx-auto max-w-md py-20 text-center">
          <h1 className="font-heading text-xl font-semibold">Anúncio indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">{erro}</p>
          <Link href="/monitorias"><Button className="mt-5">Ver outras monitorias</Button></Link>
        </div>
      </PageScaffold>
    )
  }
  if (!dados) {
    return (
      <PageScaffold>
        <Esqueleto className="h-56 rounded-3xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <Esqueleto className="h-96" />
          <Esqueleto className="h-80" />
        </div>
      </PageScaffold>
    )
  }

  const { anuncio: a, tutor } = dados
  const souDono = !!euChave && euChave === tutor.donoChave
  const sufixo = a.preco.modo === 'hora' ? '/hora' : '/aula'
  const soCombinar = a.modos.aCombinar && !a.modos.direto && !a.modos.negociacao

  const acoes = (
    <div className="space-y-2.5">
      {a.modos.direto && (
        <Button className="h-12 w-full rounded-xl text-base font-semibold shadow-md" onClick={() => setFolha({ tipo: 'agendar', gratis: false })} disabled={souDono}>
          <CalendarCheck className="mr-2 h-5 w-5" /> Agendar e pagar agora
        </Button>
      )}
      {(a.modos.negociacao || a.modos.aCombinar) && (
        <Button
          variant={a.modos.direto ? 'outline' : 'default'}
          className="h-12 w-full rounded-xl text-base font-semibold"
          onClick={() => setFolha({ tipo: 'pedido', modo: a.modos.negociacao ? 'negociacao' : 'a_combinar', gratis: false })}
          disabled={souDono}
        >
          {a.modos.negociacao ? <HeartHandshake className="mr-2 h-5 w-5" /> : <MessagesSquare className="mr-2 h-5 w-5" />}
          {a.modos.negociacao ? 'Negociar no chat' : 'Combinar dia e valor'}
        </Button>
      )}
      {a.aulaGratis.ativa && (
        <Button
          variant="outline"
          className="h-11 w-full rounded-xl border-primary/40 font-semibold text-primary hover:bg-primary/5"
          onClick={() =>
            setFolha(a.modos.direto ? { tipo: 'agendar', gratis: true } : { tipo: 'pedido', modo: a.modos.negociacao ? 'negociacao' : 'a_combinar', gratis: true })
          }
          disabled={souDono}
        >
          <Gift className="mr-2 h-4 w-4" /> Aula experimental grátis ({formatarDuracao(a.aulaGratis.duracaoMin)})
        </Button>
      )}
      {souDono && <p className="text-center text-xs text-muted-foreground">Este é o seu anúncio. É assim que os alunos o veem.</p>}
    </div>
  )

  return (
    <PageScaffold wide>
      <Link href="/monitorias" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Monitorias
      </Link>

      {/* Herói */}
      <motion.section initial={reduzir ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-3xl">
        <p className="text-sm font-medium text-primary">{a.materia}</p>
        <h1 className="mt-2 font-heading text-[2rem] font-semibold leading-[1.1] sm:text-[2.6rem]">{a.titulo}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <Avatar nome={tutor.nome} url={tutor.fotoUrl} tamanho={48} />
            <div>
              <p className="font-semibold leading-tight">{tutor.nome}</p>
              {tutor.titulo && <p className="text-sm text-muted-foreground">{tutor.titulo}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {tutor.stats.avaliacoes > 0 ? (
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="font-semibold text-foreground">{tutor.stats.nota.toFixed(1)}</span> ({tutor.stats.avaliacoes} {tutor.stats.avaliacoes === 1 ? 'avaliação' : 'avaliações'})</span>
            ) : (
              <span>Monitor novo</span>
            )}
            <span>{tutor.stats.aulasDadas} {tutor.stats.aulasDadas === 1 ? 'aula dada' : 'aulas dadas'}</span>
            {a.grupo.ativo && <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" strokeWidth={1.75} /> grupos de até {a.grupo.maxAlunos}</span>}
          </div>
        </div>
      </motion.section>

      <div className="mt-10 grid gap-10 pb-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-0">
        <div className="min-w-0 space-y-12">
          {a.videos.length > 0 && (
            <Aparecer>
              <h2 className="mb-4 font-heading text-xl font-semibold">Veja como é a aula</h2>
              <GaleriaVideos videos={a.videos} />
            </Aparecer>
          )}

          <Aparecer atraso={0.05}>
            <h2 className="font-heading text-xl font-semibold">Sobre a monitoria</h2>
            <p className="mt-3 max-w-[68ch] whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{a.descricao}</p>
            <h3 className="mt-6 text-sm font-semibold">O que dá para estudar</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {a.conteudos.map((c) => (
                <span key={c} className="rounded-lg bg-muted px-3 py-1.5 text-sm">{c}</span>
              ))}
            </div>
          </Aparecer>

          {(tutor.bio || tutor.historia) && (
            <Aparecer atraso={0.1} className="rounded-2xl bg-muted/40 p-6">
              <div className="flex items-center gap-3">
                <Avatar nome={tutor.nome} url={tutor.fotoUrl} tamanho={44} />
                <div>
                  <h2 className="font-heading text-xl font-semibold">Quem é {tutor.nome.split(' ')[0]}</h2>
                  <p className="text-xs text-muted-foreground">Monitor desde {formatarEmBrasilia(tutor.membroDesde, { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              {tutor.bio && <p className="mt-4 max-w-[68ch] text-[15px] leading-relaxed">{tutor.bio}</p>}
              {tutor.historia && <p className="mt-3 max-w-[68ch] whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{tutor.historia}</p>}
            </Aparecer>
          )}

          {(a.materiais.length > 0 || a.temMateriais) && (
            <Aparecer atraso={0.12}>
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold"><BookOpenCheck className="h-5 w-5 text-primary" strokeWidth={1.75} /> Materiais de apoio</h2>
              {a.materiais.length ? (
                <ul className="mt-3 space-y-2">
                  {a.materiais.map((m) => (
                    <li key={m.url}>
                      <LinkExternoSeguro url={m.url} dominio={m.dominio}>
                        <span className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm transition hover:border-primary/40">
                          <Link2 className="h-4 w-4 shrink-0 text-primary" />
                          <span className="font-medium">{m.titulo}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{m.dominio}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      </LinkExternoSeguro>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Este monitor tem materiais complementares que compartilha com os alunos durante a monitoria.</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Materiais por link são de responsabilidade de quem os indicou. A plataforma não hospeda nem se responsabiliza pelo conteúdo externo.
              </p>
            </Aparecer>
          )}

          {a.faq.length > 0 && (
            <Aparecer atraso={0.14}>
              <h2 className="font-heading text-xl font-semibold">Perguntas frequentes</h2>
              <div className="mt-3 divide-y divide-border">
                {a.faq.map((f, i) => (
                  <div key={i}>
                    <button type="button" aria-expanded={faqAberto === i} onClick={() => setFaqAberto(faqAberto === i ? null : i)} className="flex w-full items-center justify-between gap-3 py-4 text-left font-medium">
                      {f.pergunta}
                      <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', faqAberto === i && 'rotate-180')} />
                    </button>
                    <AnimatePresence initial={false}>
                      {faqAberto === i && (
                        <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="max-w-[68ch] overflow-hidden whitespace-pre-line pb-4 text-[15px] leading-relaxed text-muted-foreground">
                          {f.resposta}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </Aparecer>
          )}

          {dados.avaliacoes.length > 0 && (
            <Aparecer atraso={0.15}>
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> {a.stats.nota.toFixed(1)}
                <span className="text-base font-normal text-muted-foreground">({a.stats.avaliacoes} {a.stats.avaliacoes === 1 ? 'avaliação' : 'avaliações'})</span>
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {dados.avaliacoes.map((av, i) => (
                  <li key={i} className="rounded-2xl border border-border bg-card p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar nome={av.nome} url={av.foto} tamanho={32} />
                        <span className="truncate font-semibold">{av.nome}</span>
                      </span>
                      <span className="flex">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={cn('h-3.5 w-3.5', k < av.nota ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />)}</span>
                    </div>
                    {av.comentario && <p className="mt-1 text-muted-foreground">{av.comentario}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">Aluno verificado, {formatarEmBrasilia(av.em, { month: 'short', year: 'numeric' })}</p>
                  </li>
                ))}
              </ul>
            </Aparecer>
          )}

          <Perguntas anuncioId={a.id} slug={a.slug} iniciais={dados.perguntas} souDono={souDono} />
        </div>

        {/* Coluna de contratação */}
        <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-20 lg:self-start">
          <Aparecer className="rounded-2xl border border-border bg-card p-6 shadow-[0_18px_44px_-24px_hsl(var(--primary)/0.35)]">
            {soCombinar && <p className="text-xs text-muted-foreground">Valor a combinar, a partir de</p>}
            <p className="font-heading text-[2rem] font-semibold tabular-nums">
              {formatarCentavos(a.preco.valorCentavos)}
              <span className="text-sm font-medium text-muted-foreground">{sufixo}</span>
            </p>
            {a.preco.modo === 'aula' && <p className="text-xs text-muted-foreground">Aula de {formatarDuracao(a.preco.duracaoPadraoMin)}</p>}
            {a.modos.direto && (
              <p className="mt-1 text-xs text-muted-foreground">
                Agendamento online de {formatarDuracao(a.modos.direto.duracaoMinMin)} a {formatarDuracao(a.modos.direto.duracaoMaxMin)}
              </p>
            )}
            {a.grupo.ativo && a.grupo.faixas.length > 0 && (
              <div className="mt-4 rounded-xl bg-muted/50 p-3.5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Users className="h-4 w-4 text-primary" strokeWidth={1.75} /> Em grupo sai mais barato</p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="text-muted-foreground"><td>1 aluno</td><td className="text-right font-semibold text-foreground">{formatarCentavos(a.preco.valorCentavos)}{sufixo}</td></tr>
                    {a.grupo.faixas.map((f) => (
                      <tr key={f.minAlunos}>
                        <td className="pt-1 text-muted-foreground">{f.minAlunos}+ alunos</td>
                        <td className="pt-1 text-right font-semibold tabular-nums text-foreground">
                          {formatarCentavos(f.valorPorPessoaCentavos)}{sufixo} cada
                          {economiaGrupoPercent(a, f.minAlunos) > 0 && (
                            <span className="ml-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">-{economiaGrupoPercent(a, f.minAlunos)}%</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {livres && livres.proximo && (
              <div className={cn('mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-sm', livres.semana <= 6 ? 'bg-amber-500/10' : 'bg-primary/[0.06]')}>
                <CalendarCheck className={cn('mt-0.5 h-4 w-4 shrink-0', livres.semana <= 6 ? 'text-amber-600 dark:text-amber-400' : 'text-primary')} strokeWidth={1.75} />
                <span>
                  <strong>
                    {livres.semana === 0
                      ? 'Agenda desta semana lotada'
                      : livres.semana <= 6
                        ? `Só ${livres.semana} horário${livres.semana === 1 ? '' : 's'} livre${livres.semana === 1 ? '' : 's'} nos próximos 7 dias`
                        : 'Agenda aberta: escolha e pague em 2 minutos'}
                  </strong>
                  <span className="block text-xs text-muted-foreground">
                    Próximo: {formatarEmBrasilia(livres.proximo.inicio, { weekday: 'long', day: '2-digit', month: 'short' })} às {livres.proximo.hora} (Brasília)
                  </span>
                </span>
              </div>
            )}
            <div className="mt-5">{acoes}</div>
            <Depoimento avaliacoes={dados.avaliacoes} />
            <GarantiaDomineAqui />
          </Aparecer>

          {dados.disponibilidade.length > 0 && (
            <Aparecer atraso={0.05} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">Horários de aula</h3>
              <p className="text-xs text-muted-foreground">horário de Brasília</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {dados.disponibilidade.map((j, i) => (
                  <li key={i} className="flex justify-between"><span className="font-medium">{NOMES_DIAS_CURTOS[j.dia]}</span><span className="tabular-nums text-muted-foreground">{j.inicio}-{j.fim}</span></li>
                ))}
              </ul>
            </Aparecer>
          )}

          {dados.outros.length > 0 && (
            <Aparecer atraso={0.08} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">Outras monitorias de {tutor.nome.split(' ')[0]}</h3>
              <ul className="mt-2 space-y-2">
                {dados.outros.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/monitorias/anuncio/${o.slug}`} className="block rounded-xl border border-border px-3.5 py-2.5 text-sm transition hover:border-primary/40">
                      <span className="font-medium">{o.titulo}</span>
                      <span className="block text-xs text-muted-foreground">{o.materia}, {formatarCentavos(o.preco.valorCentavos)}{o.preco.modo === 'hora' ? '/h' : '/aula'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Aparecer>
          )}
        </aside>
      </div>

      {/* Celular: preço e ação principal sempre à mão */}
      {!souDono && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <p className="font-heading text-xl font-semibold tabular-nums">
              {formatarCentavos(a.preco.valorCentavos)}
              <span className="text-sm font-normal text-muted-foreground">{sufixo}</span>
            </p>
            <Button
              className="h-11 rounded-xl px-5"
              onClick={() =>
                setFolha(a.modos.direto ? { tipo: 'agendar', gratis: false } : { tipo: 'pedido', modo: a.modos.negociacao ? 'negociacao' : 'a_combinar', gratis: false })
              }
            >
              {a.modos.direto ? 'Agendar' : 'Pedir monitoria'}
            </Button>
          </div>
        </div>
      )}

      {/* Folha de contratação */}
      <AnimatePresence>
        {folha && (
          <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFolha(null)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar nome={tutor.nome} url={tutor.fotoUrl} tamanho={40} />
                  <div>
                    <p className="text-sm font-semibold leading-tight">{folha.tipo === 'agendar' ? (folha.gratis ? 'Aula grátis' : 'Agendar monitoria') : 'Pedir monitoria'}</p>
                    <p className="text-xs text-muted-foreground">{a.titulo}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFolha(null)} aria-label="Fechar"><X className="h-5 w-5" /></Button>
              </div>
              {folha.tipo === 'agendar' ? (
                <Agendador anuncioId={a.id} slug={a.slug} anuncio={a} gratis={folha.gratis} />
              ) : (
                <DialogoPedido anuncioId={a.id} modo={folha.modo} conteudos={a.conteudos} maxVagas={a.grupo.ativo ? a.grupo.maxAlunos : 1} gratis={folha.gratis} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageScaffold>
  )
}

function Perguntas({ anuncioId, slug, iniciais, souDono }: { anuncioId: string; slug: string; iniciais: Pergunta[]; souDono: boolean }) {
  const [perguntas, setPerguntas] = useState(iniciais)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [respondendo, setRespondendo] = useState<string | null>(null)
  const [resposta, setResposta] = useState('')
  const [mais, setMais] = useState(iniciais.length >= 20)

  const carregarMais = useCallback(async () => {
    const ultima = perguntas[perguntas.length - 1]
    if (!ultima) return
    const r = await api<{ perguntas: Pergunta[] }>(`/api/monitorias/publico/anuncios/${slug}/perguntas?antes=${encodeURIComponent(ultima.createdAt)}`)
    setPerguntas((p) => [...p, ...r.perguntas])
    setMais(r.perguntas.length >= 20)
  }, [perguntas, slug])

  async function perguntar() {
    setEnviando(true)
    setErro('')
    try {
      const nova = await api<Pergunta>(`/api/monitorias/anuncios/${anuncioId}/perguntas`, { method: 'POST', json: { texto } })
      setPerguntas((p) => [nova, ...p])
      setTexto('')
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) return irParaLogin()
      setErro(e instanceof Error ? e.message : 'Erro.')
    } finally {
      setEnviando(false)
    }
  }

  async function responder(id: string) {
    try {
      const r = await api<{ resposta: Pergunta['resposta'] }>(`/api/monitorias/perguntas/${id}`, { method: 'POST', json: { acao: 'responder', texto: resposta } })
      setPerguntas((p) => p.map((x) => (x.id === id ? { ...x, resposta: r.resposta } : x)))
      setRespondendo(null)
      setResposta('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro.')
    }
  }

  async function acao(id: string, acao: 'ocultar' | 'denunciar') {
    try {
      await api(`/api/monitorias/perguntas/${id}`, { method: 'POST', json: { acao } })
      if (acao === 'ocultar') setPerguntas((p) => p.filter((x) => x.id !== id))
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) return irParaLogin()
    }
  }

  return (
    <Aparecer atraso={0.16} id="perguntas">
      <h2 className="flex items-center gap-2 font-heading text-xl font-semibold"><MessageCircleQuestion className="h-5 w-5 text-primary" strokeWidth={1.75} /> Perguntas ao monitor</h2>
      {!souDono && (
        <div className="mt-3 space-y-2">
          <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} maxLength={1000} placeholder="Tem alguma dúvida antes de contratar? Pergunte aqui. A pergunta fica pública." />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Telefone e e-mail são ocultados automaticamente.</p>
            <Button size="sm" onClick={perguntar} disabled={enviando || texto.trim().length < 5}>{enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Perguntar'}</Button>
          </div>
        </div>
      )}
      {erro && <CaixaErro mensagem={erro} className="mt-3" />}
      <ul className="mt-4 space-y-3">
        <AnimatePresence initial={false}>
          {perguntas.map((p) => (
            <motion.li key={p.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm"><span className="font-semibold">{p.autorNome}:</span> {p.texto}</p>
              {p.resposta ? (
                <p className="mt-2 border-l-2 border-primary pl-3 text-sm text-foreground/85"><span className="font-semibold text-primary">Monitor:</span> {p.resposta.texto}</p>
              ) : souDono ? (
                respondendo === p.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea value={resposta} onChange={(e) => setResposta(e.target.value)} rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => responder(p.id)} disabled={resposta.trim().length < 2}>Responder</Button>
                      <Button size="sm" variant="ghost" onClick={() => setRespondendo(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-3 text-xs">
                    <button type="button" className="font-semibold text-primary" onClick={() => setRespondendo(p.id)}>Responder</button>
                    <button type="button" className="text-muted-foreground" onClick={() => acao(p.id, 'ocultar')}>Ocultar</button>
                  </div>
                )
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Aguardando resposta do monitor</p>
              )}
              {!souDono && (
                <button type="button" onClick={() => acao(p.id, 'denunciar')} className="mt-1 text-[11px] text-muted-foreground hover:text-rose-600">Denunciar</button>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
        {perguntas.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma pergunta ainda.</li>}
      </ul>
      {mais && <Button variant="outline" size="sm" className="mt-3" onClick={carregarMais}>Ver mais perguntas</Button>}
    </Aparecer>
  )
}

/** O melhor comentário (5★ ou o mais bem avaliado) perto do botão — prova social na hora da decisão. */
function Depoimento({ avaliacoes }: { avaliacoes: Dados['avaliacoes'] }) {
  const melhor = [...avaliacoes].filter((a) => a.comentario.trim().length >= 12).sort((x, y) => y.nota - x.nota)[0]
  if (!melhor || melhor.nota < 4) return null
  return (
    <figure className="mt-5 border-l-2 border-primary/40 pl-3.5 text-sm">
      <blockquote className="line-clamp-3 text-foreground/90">“{melhor.comentario}”</blockquote>
      <figcaption className="mt-1.5 flex items-center gap-1 text-muted-foreground">
        <span className="flex">{Array.from({ length: melhor.nota }).map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}</span>
        <Avatar nome={melhor.nome} url={melhor.foto} tamanho={20} className="ml-1" />
        {melhor.nome}, aluno verificado
      </figcaption>
    </figure>
  )
}

const ITENS_GARANTIA = [
  { icone: Wallet, texto: 'O monitor só recebe 48h depois da aula' },
  { icone: Undo2, texto: '7 dias para desistir (antes da aula) com 100% de volta' },
  { icone: ShieldCheck, texto: 'Monitor faltou ou cancelou? Reembolso integral' },
  { icone: FileSignature, texto: 'Contrato assinado e comprovante em PDF' },
]

function GarantiaDomineAqui() {
  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.75} /> Garantia DomineAqui</p>
      <ul className="mt-2.5 space-y-2">
        {ITENS_GARANTIA.map((g) => (
          <li key={g.texto} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <g.icone className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" strokeWidth={1.75} /> {g.texto}
          </li>
        ))}
      </ul>
    </div>
  )
}
