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

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { prepararAcervo } from '@/lib/atlas-anatomia/acervo-cliente'
import { prepararMotorDeFichas } from '@/lib/atlas-anatomia/motor-fichas'
import type { ResumoAnatomia, SistemaResumo } from '@/lib/anatomia/tipos'

const AtlasEstudo = dynamic(() => import('@/components/anatomia/atlas-estudo'), {
  ssr: false,
  loading: () => (
    <div className="surface-page flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

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
      className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" aria-hidden />
      <div className="relative p-3.5 sm:p-4">
        <h3 className="font-heading text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl">
          {sistema.titulo}
        </h3>
        <p className="mt-1 text-[11px] font-medium text-white/60">
          {sistema.pranchas} prancha{sistema.pranchas !== 1 ? 's' : ''} · {sistema.colecoes} coleç
          {sistema.colecoes !== 1 ? 'ões' : 'ão'}
        </p>
        <span className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground/90">
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur transition group-hover:bg-white/25">
            Explorar <ArrowRight className="ml-0.5 inline h-3 w-3" />
          </span>
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
  const sistemas = catalogo.sistemas

  return (
    <main className="surface-page min-h-screen">
      <header className="relative overflow-hidden border-b border-border bg-slate-950">
        <div className="absolute inset-0 grid grid-cols-5 opacity-25" aria-hidden>
          {sistemas.slice(0, 5).map(sistema => (
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

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-7 sm:pb-14 sm:pt-9">
          <Link
            href="/anatomia"
            className="mb-7 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Domine Anatomia
          </Link>
          <div className="mb-3">
            <p className="editorial-mark !text-amber-300">Atlas de Anatomia · acervo completo</p>
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Escolha o sistema
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            {catalogo.totalPranchas} pranchas reais com {catalogo.totalMarcadores.toLocaleString('pt-BR')} estruturas
            marcadas. Toque em qualquer marcador e receba localização, função, vascularização, inervação e correlação
            clínica.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-white/70">
            {[
              `${catalogo.totalSistemas} sistemas`,
              `${catalogo.totalPranchas} pranchas`,
              `${catalogo.totalMarcadores.toLocaleString('pt-BR')} marcadores`,
            ].map(rotulo => (
              <span key={rotulo} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
                {rotulo}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {sistemas.map(sistema => (
            <CartaoSistema key={sistema.slug} sistema={sistema} onAbrir={() => onEscolher(sistema)} />
          ))}
        </div>
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

  // Sistema e coleção vivem na URL. Além de tornar o link compartilhável, é o
  // que faz o botão voltar do navegador desfazer um passo por vez —
  // prancha → regiões → sistemas — em vez de sair da seção de uma vez.
  function navegar(proximoSistema: string | null, colecaoSlug?: string | null) {
    if (!proximoSistema) {
      router.push('/anatomia/atlas-anatomia')
      return
    }
    const destino = colecaoSlug
      ? `/anatomia/atlas-anatomia?sistema=${proximoSistema}&colecao=${colecaoSlug}`
      : `/anatomia/atlas-anatomia?sistema=${proximoSistema}`
    router.push(destino)
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
      onAbrirColecao={slug => navegar(sistemaSlug, slug)}
      onVoltarParaRegioes={() => navegar(sistemaSlug)}
      onTrocarSistema={() => navegar(null)}
    />
  )
}
