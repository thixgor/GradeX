'use client'

/**
 * Porta de entrada do Atlas de Anatomia.
 *
 * Este arquivo é deliberadamente magro. Ele resolve a rota (sistema e coleção
 * vivem na URL) e desenha a tela de escolha do sistema — que precisa apenas de
 * dez nomes, dez capas e três contagens, tudo já entregue pelo `/api/anatomia`
 * que o portão de acesso consultou antes de montar esta tela.
 *
 * O acervo das 418 pranchas, o visualizador e o texto das fichas moram em
 * `atlas-estudo`, importado sob demanda. Antes vinha tudo junto: abrir o Atlas
 * custava 172 KB comprimidos — as dez coleções inteiras e o dicionário de
 * estruturas — antes de aparecer a primeira imagem, mesmo para quem ia estudar
 * só o crânio. Agora a grade de sistemas aparece de imediato e o resto é
 * buscado por baixo, enquanto o aluno decide por onde entrar.
 */

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, Search, Target, X } from 'lucide-react'
import { prepararAcervo } from '@/lib/atlas-anatomia/acervo-cliente'
import { prepararMotorDeFichas } from '@/lib/atlas-anatomia/motor-fichas'
import type { AlvoDeAbertura } from '@/components/anatomia/atlas-estudo'
import type { ResumoAnatomia, SistemaResumo } from '@/lib/anatomia/tipos'

const AtlasEstudo = dynamic(() => import('@/components/anatomia/atlas-estudo'), {
  ssr: false,
  loading: () => (
    <div className="surface-page flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

/* ══════════════════════════ Escolha do sistema ══════════════════════════ */

function CartaoSistema({ sistema, onAbrir }: { sistema: SistemaResumo; onAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      // Passar o mouse (ou tocar) já é um sinal de intenção: o acervo daquele
      // sistema começa a vir antes do clique, e a área de estudo abre sem espera.
      onPointerEnter={() => prepararAcervo(sistema.slug)}
      onFocus={() => prepararAcervo(sistema.slug)}
      className="relevo relevo-toca group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[22px] border border-white/10 bg-slate-950 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Image
        src={sistema.capa}
        alt=""
        fill
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
        className="object-cover opacity-70 transition duration-700 group-hover:scale-110 group-hover:opacity-90"
      />
      {/* A capa do acervo traz o nome do sistema impresso em corpo grande; o
          escurecimento deixa a imagem falar e o rótulo do card ser lido. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/25" aria-hidden />
      <div className="relative p-3.5">
        <h3 className="font-heading text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl">
          {sistema.titulo}
        </h3>
        <p className="mt-1 text-[11px] font-medium text-white/60">
          {sistema.pranchas} prancha{sistema.pranchas !== 1 ? 's' : ''} ·{' '}
          {sistema.marcadores.toLocaleString('pt-BR')} estruturas
        </p>
        <span className="anatomia-vidro-escuro mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
          Explorar <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  )
}

function EscolhaDeSistema({
  catalogo,
  onEscolher,
}: {
  catalogo: ResumoAnatomia
  onEscolher: (sistema: SistemaResumo) => void
}) {
  const [filtro, setFiltro] = useState('')

  // O filtro é sobre dez nomes, não sobre o acervo — é instantâneo e serve para
  // quem já sabe o que quer chegar sem varrer a grade com os olhos.
  const sistemas = useMemo(() => {
    const termo = normalizar(filtro)
    if (!termo) return catalogo.sistemas
    return catalogo.sistemas.filter(sistema => normalizar(sistema.titulo).includes(termo))
  }, [catalogo.sistemas, filtro])

  return (
    <main className="surface-page anatomia-ambiente min-h-screen">
      <header className="relative isolate overflow-hidden border-b border-border bg-slate-950">
        <div className="absolute inset-0 grid grid-cols-5 opacity-25" aria-hidden>
          {catalogo.sistemas.slice(0, 5).map(sistema => (
            <div key={sistema.slug} className="relative">
              {/* Mesmo `sizes` dos cards abaixo de propósito: a faixa decorativa
                  passa a reaproveitar exatamente o arquivo que os cards já
                  pedem, em vez de gerar uma segunda variante de cada capa. */}
              <Image
                src={sistema.capa}
                alt=""
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/60" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-6 sm:pb-10 sm:pt-8">
          <Link
            href="/anatomia"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Domine Anatomia
          </Link>

          <p className="editorial-mark !text-amber-300">Atlas de Anatomia · acervo completo</p>
          <h1 className="mt-2.5 font-heading text-[2.25rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Escolha o sistema
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/65">
            {catalogo.totalPranchas} pranchas reais com {catalogo.totalMarcadores.toLocaleString('pt-BR')} estruturas
            marcadas. Toque num marcador e receba localização, função, vascularização, inervação e clínica.
          </p>

          {/* Busca e treino na mesma linha: os dois caminhos que não passam por
              percorrer a grade inteira. */}
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="anatomia-vidro-escuro relative flex h-11 min-w-0 flex-1 items-center rounded-2xl sm:max-w-sm">
              <Search className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-white/40" />
              <input
                value={filtro}
                onChange={evento => setFiltro(evento.target.value)}
                placeholder="Filtrar sistema…"
                aria-label="Filtrar sistema"
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-white outline-none placeholder:text-white/40"
              />
              {filtro && (
                <button
                  type="button"
                  onClick={() => setFiltro('')}
                  aria-label="Limpar filtro"
                  className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Link
              href="/anatomia/atlas-anatomia/quiz"
              className="anatomia-vidro-escuro inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white transition hover:bg-white/15"
            >
              <Target className="h-4 w-4 text-amber-300" /> Treinar identificação
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
        {sistemas.length === 0 ? (
          <p className="vidro relevo rounded-[22px] px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhum sistema com esse nome. Limpe o filtro para ver os {catalogo.totalSistemas}.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {sistemas.map(sistema => (
              <CartaoSistema key={sistema.slug} sistema={sistema} onAbrir={() => onEscolher(sistema)} />
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Acervo: Atlas Interativo de Anatomia Humana. Uso integral autorizado ao Domine Aqui em 12/08/2026. Os
          aprofundamentos de cada estrutura são conteúdo editorial do GradeX.
        </p>
      </section>
    </main>
  )
}

/* ══════════════════════════ Página ══════════════════════════ */

export default function AtlasExperiencia({ catalogo }: { catalogo: ResumoAnatomia }) {
  const router = useRouter()
  const parametros = useSearchParams()
  const sistemaSlug = parametros.get('sistema') || ''
  const slugColecao = parametros.get('colecao') || ''
  const sistemaValido = catalogo.sistemas.some(item => item.slug === sistemaSlug)

  /**
   * Onde a área de estudo deve abrir, quando a URL pede um lugar exato.
   *
   * É o que faz a busca por estrutura funcionar de uma coleção para outra: o
   * resultado escolhido vira `peca`/`estrutura` na barra de endereços, a tela
   * remonta na coleção certa e já abre com a ficha daquela estrutura. De
   * quebra, o endereço vira um link direto para a estrutura — que é o que
   * alguém copia quando quer mandar "olha essa aqui" para um colega.
   */
  const alvo = useMemo<AlvoDeAbertura | undefined>(() => {
    const bruto = parametros.get('peca')
    if (bruto === null) return undefined
    const peca = Number(bruto)
    if (!Number.isInteger(peca) || peca < 0) return undefined
    const brutoMarcador = parametros.get('estrutura')
    const marcador = Number(brutoMarcador)
    return {
      peca,
      marcador: brutoMarcador !== null && Number.isInteger(marcador) && marcador >= 0 ? marcador : null,
    }
  }, [parametros])

  // Sistema, coleção e posição vivem na URL. Além de tornar o link
  // compartilhável, é o que faz o botão voltar do navegador desfazer um passo
  // por vez — prancha → regiões → sistemas — em vez de sair da seção de uma vez.
  function navegar(proximoSistema: string | null, colecaoSlug?: string | null, destinoAlvo?: AlvoDeAbertura) {
    if (!proximoSistema) {
      router.push('/anatomia/atlas-anatomia')
      return
    }
    const busca = new URLSearchParams({ sistema: proximoSistema })
    if (colecaoSlug) busca.set('colecao', colecaoSlug)
    if (destinoAlvo) {
      busca.set('peca', String(destinoAlvo.peca))
      if (destinoAlvo.marcador != null) busca.set('estrutura', String(destinoAlvo.marcador))
    }
    router.push(`/anatomia/atlas-anatomia?${busca.toString()}`)
  }

  // Na tela de sistemas, a área de estudo e o texto das fichas são buscados no
  // tempo ocioso — depois da primeira pintura, sem disputar banda com ela.
  // Escolher um sistema leva alguns segundos; quando o clique vem, já chegaram.
  useEffect(() => {
    if (sistemaValido) return
    let cancelado = false
    const adiantar = () => {
      if (cancelado) return
      void import('@/components/anatomia/atlas-estudo').catch(() => {})
      void prepararMotorDeFichas().catch(() => {})
    }
    const temOcioso = typeof window.requestIdleCallback === 'function'
    const agendado = temOcioso ? window.requestIdleCallback(adiantar) : window.setTimeout(adiantar, 1200)
    return () => {
      cancelado = true
      if (temOcioso) window.cancelIdleCallback(agendado)
      else window.clearTimeout(agendado)
    }
  }, [sistemaValido])

  if (!sistemaValido) {
    return <EscolhaDeSistema catalogo={catalogo} onEscolher={proximo => navegar(proximo.slug)} />
  }

  return (
    <AtlasEstudo
      sistemaSlug={sistemaSlug}
      slugColecao={slugColecao}
      alvo={alvo}
      onAbrirColecao={(slug, destino) => navegar(sistemaSlug, slug, destino)}
      onVoltarParaRegioes={() => navegar(sistemaSlug)}
      onTrocarSistema={() => navegar(null)}
    />
  )
}
