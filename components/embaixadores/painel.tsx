'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgePercent,
  Banknote,
  CheckCircle2,
  Eye,
  Link2,
  MessageCircle,
  MousePointerClick,
  QrCode,
  Receipt,
  ShoppingBag,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import type { PainelDoEmbaixador } from '@/lib/embaixadores/servidor'
import type { ChavePix } from '@/lib/embaixadores/regras'
import { FormularioPix } from './formulario-pix'
import {
  Abas,
  BotaoCopiar,
  Funil,
  GraficoSemanal,
  Kpi,
  ProdutosQueSairam,
  ResumoDasSemanas,
  SeloSaude,
  SeloStatus,
  SeloTipo,
  Vazio,
  formatarData,
  formatarDataCurta,
  formatarInteiro,
  formatarReais,
  haQuanto,
  useAviso,
} from './ui'

/** Atalhos de link para páginas específicas (`/e/CODIGO?para=…`). */
const DESTINOS = [
  { para: '', rotulo: 'Seu convite' },
  { para: '/buy', rotulo: 'Plus+' },
  { para: '/manual-clinico', rotulo: 'Manual Clínico' },
  { para: '/banco-questoes', rotulo: 'Banco de Questões' },
  { para: '/materiais', rotulo: 'Materiais' },
  { para: '/flashcards', rotulo: 'Flashcards' },
]

const CHECKLIST = [
  'Sei a diferença entre material avulso, pacote e flashcard',
  'Sei o que entra no Manual Clínico, no Plus+ e no Quest+, e para quem indicar cada um',
  'Sei explicar a regra de ProUni e Fies e como enviar o documento',
  'Confiro o preço no site antes de falar qualquer valor',
  'Sei explicar o direito de 7 dias sem enrolar',
  'Não prometo nada que não confirmei com a equipe',
]

type Aba = 'vendas' | 'indicados' | 'repasses'

export function PainelDoEmbaixadorView({ painel: inicial }: { painel: PainelDoEmbaixador }) {
  const [painel, setPainel] = useState(inicial)
  const { avisar, elemento: aviso } = useAviso()
  const [destino, setDestino] = useState('')
  const [verQr, setVerQr] = useState(false)
  const [aba, setAba] = useState<Aba>('vendas')
  const e = painel.embaixador
  const t = painel.totais
  const remunerado = e.tipo === 'remunerado'
  const primeiroNome = e.nome.split(/\s+/)[0]

  const link = destino ? `${e.link}?para=${encodeURIComponent(destino)}` : e.link
  const mensagem = useMemo(
    () =>
      `Tô usando o DomineAqui pra estudar: Manual Clínico, Banco com +15 mil questões, flashcards e provas da faculdade num lugar só. ` +
      (e.cupom.ativo ? `Com o meu cupom ${e.cupom.codigo} você ganha ${e.cupom.desconto}% de desconto por cima do preço do momento. ` : '') +
      `Dá uma olhada: ${link}`,
    [e.cupom, link],
  )
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`

  function aoSalvarPix(pix: ChavePix & { atualizadoEm: string }) {
    setPainel((p) => ({ ...p, embaixador: { ...p.embaixador, pix } }))
  }

  const abas: Array<{ id: Aba; rotulo: string; contagem?: number }> = [
    { id: 'vendas', rotulo: 'Vendas', contagem: painel.vendas.length },
    { id: 'indicados', rotulo: 'Indicados', contagem: t.cadastros },
    ...(remunerado ? [{ id: 'repasses' as Aba, rotulo: 'Repasses', contagem: painel.repasses.length }] : []),
  ]

  return (
    <div className="emb mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pt-10">
      {aviso}

      {e.status !== 'ativo' && (
        <div role="status" className="emb-vidro vidro-sobe mb-6 flex items-start gap-3 rounded-2xl p-4">
          <AlertTriangle className="emb-ambar mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="text-[14.5px]">
            <p className="font-bold">{e.status === 'pausado' ? 'Sua participação está pausada' : 'Sua participação foi encerrada'}</p>
            <p className="emb-suave mt-0.5">
              O cupom e o link não estão contando novas vendas agora.
              {remunerado && t.aReceber > 0 ? ' A comissão que já é sua continua aqui e será repassada normalmente.' : ''} Fale com a
              equipe se tiver dúvida.
            </p>
          </div>
        </div>
      )}

      {/* ── Topo ── */}
      <section aria-labelledby="painel-titulo" className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="vidro-sobe lg:col-span-7" style={{ ['--i' as string]: 0 }}>
          <p className="vidro-pilula">
            <span className="vidro-ponto" /> Embaixador DomineAqui
          </p>
          <h1 id="painel-titulo" className="emb-titulo mt-5 text-[clamp(38px,5.2vw,64px)]">
            Olá, <span className="vidro-brilho">{primeiroNome}</span>
          </h1>
          <p className="emb-suave mt-4 max-w-[52ch] text-[17px]">
            {t.compras > 0
              ? `Seu código já fechou ${formatarInteiro(t.compras)} ${t.compras === 1 ? 'compra' : 'compras'} e trouxe ${formatarInteiro(t.cadastros)} ${t.cadastros === 1 ? 'cadastro' : 'cadastros'}. A última venda foi ${haQuanto(painel.saude.ultimaVendaEm)}.`
              : 'Seu link e seu cupom estão prontos. Cada compra feita com eles cai no seu nome sozinha, sem você precisar avisar ninguém.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <SeloStatus status={e.status} />
            <SeloTipo tipo={e.tipo} comissao={e.comissaoPercent} />
            <SeloSaude saude={painel.saude.saude} />
            {t.compras > 0 && (
              <span className="emb-selo">
                <Trophy className="h-3.5 w-3.5" aria-hidden /> #{painel.ranking.posicao} de {painel.ranking.de}
              </span>
            )}
          </div>
          {e.faculdade && <p className="emb-fraca mt-4 text-[14px]">{[e.faculdade, e.periodo].filter(Boolean).join(' · ')}</p>}
        </div>

        {/* O bilhete do cupom */}
        <div className="vidro-sobe lg:col-span-5" style={{ ['--i' as string]: 1 }}>
          <div className="emb-borda-viva">
            <div className="emb-vidro emb-bilhete p-5 md:p-6">
              <div className="flex items-center justify-between">
                <p className="emb-fraca text-[12px] font-bold uppercase tracking-[0.14em]">Seu cupom</p>
                <span className="emb-selo" data-tom={e.cupom.ativo ? 'verde' : 'vermelho'}>
                  {e.cupom.ativo ? 'Ativo' : 'Desligado'}
                </span>
              </div>
              <p className="emb-numero mt-3 break-all text-[clamp(34px,4.6vw,46px)] tracking-[0.04em]">{e.cupom.codigo}</p>
              <p className="emb-suave mt-1 text-[14.5px]">
                <strong className="emb-ambar">{e.cupom.desconto}% OFF</strong> por cima do preço do momento, em tudo da plataforma
              </p>
              <div className="mt-4">
                <BotaoCopiar texto={e.cupom.codigo} rotulo="Copiar cupom" aviso="Cupom copiado" avisar={avisar} principal className="w-full" />
              </div>
              <div className="emb-picote my-5" />
              <p className="emb-fraca text-[12px] font-bold uppercase tracking-[0.14em]">Seu link</p>
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Para onde o link leva">
                {DESTINOS.map((d) => (
                  <button
                    key={d.para || 'convite'}
                    type="button"
                    onClick={() => setDestino(d.para)}
                    aria-pressed={destino === d.para}
                    className="emb-selo emb-foco cursor-pointer"
                    data-tom={destino === d.para ? 'verde' : undefined}
                  >
                    {d.rotulo}
                  </button>
                ))}
              </div>
              <p className="emb-lista mt-3 truncate rounded-xl px-3 py-2.5 text-[14px] font-semibold" title={link}>
                <Link2 className="emb-fraca mr-1.5 inline h-4 w-4 align-[-3px]" aria-hidden />
                {link.replace(/^https?:\/\//, '')}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <BotaoCopiar texto={link} rotulo="Copiar" aviso="Link copiado" avisar={avisar} className="!px-3" />
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="emb-botao emb-botao-vidro emb-foco !px-3">
                  <MessageCircle className="h-4 w-4" aria-hidden /> Enviar
                </a>
                <button
                  type="button"
                  onClick={() => setVerQr((v) => !v)}
                  aria-expanded={verQr}
                  className="emb-botao emb-botao-vidro emb-foco !px-3"
                >
                  <QrCode className="h-4 w-4" aria-hidden /> QR
                </button>
              </div>
              {verQr && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="rounded-2xl bg-white p-3">
                    <QRCodeSVG value={link} size={168} level="M" />
                  </div>
                  <p className="emb-fraca text-center text-[12.5px]">Para o slide da aula, o mural ou a mesa do bandejão.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Comissão (remunerados) ── */}
      {remunerado && (
        <section aria-labelledby="comissao-titulo" className="mt-10 grid gap-4 lg:grid-cols-12">
          <div className="emb-vidro vidro-sobe rounded-[28px] p-6 md:p-7 lg:col-span-5" style={{ ['--i' as string]: 2 }}>
            <div className="flex items-center gap-2">
              <Wallet className="emb-verde h-5 w-5" aria-hidden />
              <h2 id="comissao-titulo" className="text-[15px] font-bold">
                A receber
              </h2>
            </div>
            <p className="emb-numero emb-dinheiro mt-4 text-[clamp(40px,5vw,56px)]">{formatarReais(Math.max(0, t.aReceber))}</p>
            {t.aReceber < 0 && (
              <p className="emb-suave mt-2 text-[13.5px]">
                Um estorno depois do último repasse deixou {formatarReais(Math.abs(t.aReceber))} a compensar no próximo.
              </p>
            )}
            <dl className="mt-5 grid grid-cols-2 gap-3 text-[14px]">
              <div className="emb-lista rounded-2xl p-3">
                <dt className="emb-fraca text-[12.5px] font-semibold">Comissão total</dt>
                <dd className="mt-1 text-[18px] font-extrabold">{formatarReais(t.comissaoTotal)}</dd>
              </div>
              <div className="emb-lista rounded-2xl p-3">
                <dt className="emb-fraca text-[12.5px] font-semibold">Já repassado</dt>
                <dd className="mt-1 text-[18px] font-extrabold">{formatarReais(t.repassado)}</dd>
              </div>
            </dl>
            <div className="emb-lista mt-4 rounded-2xl p-4 text-[13.5px]">
              <p>
                <strong>Sua comissão: {String(e.comissaoPercent).replace('.', ',')}%</strong> sobre a parte da DomineAqui em cada venda —
                na prática, <strong>{String(e.comissaoSobreProduto).replace('.', ',')}% do valor pago</strong>.
              </p>
              <p className="emb-suave mt-1.5">
                Numa compra de R$ 100,00, você recebe {formatarReais(e.comissaoSobreProduto)}. O repasse é feito pela equipe, por PIX, e
                aparece na aba Repasses.
              </p>
            </div>
          </div>

          <div className="emb-vidro vidro-sobe rounded-[28px] p-6 md:p-7 lg:col-span-7" style={{ ['--i' as string]: 3 }}>
            <div className="flex items-center gap-2">
              <Banknote className="emb-verde h-5 w-5" aria-hidden />
              <h2 className="text-[15px] font-bold">Chave PIX para receber</h2>
            </div>
            {!e.pix && (
              <p className="emb-suave mt-2 text-[14px]">
                Cadastre a chave onde você quer receber as comissões. Sem ela, a equipe não tem para onde mandar o repasse.
              </p>
            )}
            <div className="mt-5">
              <FormularioPix atual={e.pix} aoSalvar={aoSalvarPix} avisar={avisar} />
            </div>
          </div>
        </section>
      )}

      {/* ── Números ── */}
      <section aria-label="Seus números" className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi indice={0} rotulo="Visitas ao link" valor={t.visitantes} icone={<MousePointerClick className="h-4 w-4" />} detalhe={`${formatarInteiro(t.cliques)} cliques no total`} />
        <Kpi indice={1} rotulo="Cadastros" valor={t.cadastros} icone={<UserPlus className="h-4 w-4" />} detalhe={`${String(t.conversaoCadastro).replace('.', ',')}% das visitas`} />
        <Kpi indice={2} rotulo="Compradores" valor={t.compradores} icone={<Users className="h-4 w-4" />} detalhe={`${formatarInteiro(t.indicadosQueCompraram)} vieram do link`} />
        <Kpi indice={3} rotulo="Compras" valor={t.compras} icone={<ShoppingBag className="h-4 w-4" />} detalhe={`${formatarInteiro(t.comprasPorCupom)} com cupom · ${formatarInteiro(t.comprasPorLink)} pelo link`} />
        <Kpi indice={4} rotulo="Vendido com você" valor={t.receita} formato="reais" destaque icone={<Receipt className="h-4 w-4" />} detalhe="valor dos produtos" />
        <Kpi indice={5} rotulo="Ticket médio" valor={t.ticketMedio} formato="reais" icone={<BadgePercent className="h-4 w-4" />} />
      </section>

      {/* ── Desempenho ── */}
      <section aria-labelledby="desempenho-titulo" className="mt-10 grid gap-4 lg:grid-cols-12">
        <div className="emb-painel flex flex-col rounded-[28px] p-5 md:p-7 lg:col-span-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="desempenho-titulo" className="text-[20px] font-extrabold tracking-tight">
                Desempenho
              </h2>
              <p className="emb-suave text-[14px]">Últimas 12 semanas</p>
            </div>
            <p className="emb-fraca text-[13px]">
              Avaliação pelo cupom: parado há {painel.programa.diasParaCupomParado}+ dias acende o alerta
            </p>
          </div>
          <div className="mt-5">
            <GraficoSemanal dados={painel.series} />
          </div>
          <div className="mt-auto pt-6">
            <ResumoDasSemanas dados={painel.series} />
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-4">
          <div className="emb-painel rounded-[28px] p-5 md:p-6">
            <h3 className="text-[15px] font-bold">Do clique à compra</h3>
            <div className="mt-4">
              <Funil
                etapas={[
                  { rotulo: 'Visitas', valor: t.visitantes },
                  { rotulo: 'Cadastros', valor: t.cadastros },
                  { rotulo: 'Indicados que compraram', valor: t.indicadosQueCompraram },
                ]}
              />
            </div>
          </div>
          {painel.topProdutos.length > 0 && (
            <div className="emb-painel rounded-[28px] p-5 md:p-6">
              <h3 className="text-[15px] font-bold">O que mais sai com você</h3>
              <div className="mt-4">
                <ProdutosQueSairam produtos={painel.topProdutos} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Listas ── */}
      <section aria-label="Histórico" className="mt-10">
        <Abas abas={abas} atual={aba} aoTrocar={setAba} rotulo="Histórico" />
        <div className="emb-lista mt-4 overflow-hidden rounded-[24px]">
          {aba === 'vendas' &&
            (painel.vendas.length === 0 ? (
              <Vazio
                icone={<ShoppingBag className="emb-fraca h-6 w-6" />}
                titulo="Nenhuma venda ainda"
                texto="Mande o link no grupo da turma com o cupom. A primeira compra aparece aqui sozinha, minutos depois do pagamento."
              >
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="emb-botao vidro-botao emb-foco">
                  <MessageCircle className="h-4 w-4" aria-hidden /> Mandar no WhatsApp
                </a>
              </Vazio>
            ) : (
              <ul>
                {painel.vendas.map((v) => (
                  <li key={v.id} className="emb-linha flex items-center gap-3 px-4 py-3.5 md:px-5">
                    <div className="emb-lista grid h-10 w-10 shrink-0 place-items-center rounded-xl">
                      {v.origem === 'cupom' ? <BadgePercent className="h-[18px] w-[18px]" aria-hidden /> : <Link2 className="h-[18px] w-[18px]" aria-hidden />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold">{v.produto}</p>
                      <p className="emb-fraca truncate text-[12.5px]">
                        {v.comprador} · {formatarData(v.pagoEm)} · {v.origem === 'cupom' ? 'cupom' : 'link'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={v.status === 'estornada' ? 'emb-fraca text-[14px] line-through' : 'text-[14.5px] font-bold'}>
                        {formatarReais(v.valor)}
                      </p>
                      {remunerado && v.status === 'confirmada' && (
                        <p className="emb-verde text-[12.5px] font-semibold">+ {formatarReais(v.comissao)}</p>
                      )}
                      {v.status === 'estornada' && <p className="text-[12px] font-semibold" style={{ color: 'var(--emb-vermelho)' }}>estornada</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ))}

          {aba === 'indicados' &&
            (painel.indicados.length === 0 ? (
              <Vazio
                icone={<UserPlus className="emb-fraca h-6 w-6" />}
                titulo="Ninguém se cadastrou pelo link ainda"
                texto="Quem abre o seu link e cria a conta nos 60 dias seguintes entra aqui, com o seu nome."
              />
            ) : (
              <ul>
                {painel.indicados.map((i) => (
                  <li key={i.id} className="emb-linha flex items-center gap-3 px-4 py-3 md:px-5">
                    <div className="emb-lista grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold">
                      {i.nome.slice(0, 1).toUpperCase()}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">{i.nome}</p>
                    <span className="emb-fraca hidden text-[12.5px] sm:inline">desde {formatarDataCurta(i.criadoEm)}</span>
                    {i.comprou ? (
                      <span className="emb-selo" data-tom="verde">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Comprou
                      </span>
                    ) : (
                      <span className="emb-selo">
                        <Eye className="h-3.5 w-3.5" aria-hidden /> Conhecendo
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ))}

          {aba === 'repasses' &&
            (painel.repasses.length === 0 ? (
              <Vazio
                icone={<Banknote className="emb-fraca h-6 w-6" />}
                titulo="Nenhum repasse ainda"
                texto="Quando a equipe fizer o PIX da sua comissão, ele aparece aqui com a data e o valor."
              />
            ) : (
              <ul>
                {painel.repasses.map((r) => (
                  <li key={r.id} className="emb-linha flex items-center gap-3 px-4 py-3.5 md:px-5">
                    <div className="emb-lista grid h-10 w-10 shrink-0 place-items-center rounded-xl">
                      <Banknote className="emb-verde h-[18px] w-[18px]" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-semibold">PIX recebido</p>
                      <p className="emb-fraca truncate text-[12.5px]">
                        {formatarData(r.pagoEm)}
                        {r.observacao ? ` · ${r.observacao}` : ''}
                      </p>
                    </div>
                    <p className="emb-verde shrink-0 text-[15px] font-extrabold">{formatarReais(r.valor)}</p>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </section>

      {/* ── Kit ── */}
      <section aria-labelledby="kit-titulo" className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="emb-painel rounded-[28px] p-6 md:p-7">
          <h2 id="kit-titulo" className="text-[20px] font-extrabold tracking-tight">
            Mensagem pronta
          </h2>
          <p className="emb-suave mt-1 text-[14px]">Copie, ajuste do seu jeito e mande no grupo. O link já leva o seu código.</p>
          <p className="emb-lista mt-4 whitespace-pre-line rounded-2xl p-4 text-[14.5px] leading-relaxed">{mensagem}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <BotaoCopiar texto={mensagem} rotulo="Copiar mensagem" aviso="Mensagem copiada" avisar={avisar} />
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="emb-botao vidro-botao emb-foco">
              <MessageCircle className="h-4 w-4" aria-hidden /> Abrir no WhatsApp
            </a>
          </div>
        </div>
        <div className="emb-painel rounded-[28px] p-6 md:p-7">
          <h2 className="text-[20px] font-extrabold tracking-tight">Antes de cada conversa</h2>
          <ul className="mt-4 space-y-2.5">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-2.5 text-[14.5px]">
                <CheckCircle2 className="emb-verde mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="emb-suave mt-5 text-[13.5px]">
            Não invente benefício, não prometa desconto que não existe e confira o preço no site antes de falar qualquer valor.
          </p>
          <Link href="/buy" className="emb-botao emb-botao-vidro emb-foco mt-4">
            Ver planos e preços de hoje <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  )
}
