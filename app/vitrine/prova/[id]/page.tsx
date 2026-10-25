import type { Metadata } from 'next'
import Link from 'next/link'
import { CoverImage } from '@/components/cover-image'
import { CapaDaProva } from '@/components/exam/capa-da-prova'
import { CabecalhoDaVitrine, CascoDaVitrine, enderecosDeConta } from '@/components/vitrine/casco'
import { RodapeDaVitrine } from '@/components/vitrine/rodape'
import { normalizeCoverSrc } from '@/lib/cover-image-src'
import { absoluteUrl, privateNoIndexRobots } from '@/lib/seo'
import { provaPublica } from '@/lib/vitrines/dados'
import { AUSCULTA } from '@/lib/vitrines/fotos'

type Props = { params: Promise<{ id: string }> }

/*
 * Uma página por prova, gerada na primeira visita e servida do CDN dali em
 * diante; a cada 10 min no máximo ela é refeita, para a capa ou o nome trocados
 * pelo admin chegarem sem deploy.
 */
export function generateStaticParams() {
  return []
}
export const revalidate = 600

function duracaoPorExtenso(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`
}

/**
 * O link da prova colado no grupo da turma vira um cartão com a capa e o nome
 * — é a primeira coisa que alguém sem conta vê dela.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const prova = await provaPublica(id)
  const titulo = prova ? prova.titulo : 'Prova na DomineAqui'
  const descricao = 'Você quer fazer essa prova? Entre na sua conta, ou crie uma grátis, e comece.'
  const capa = prova?.capa ? normalizeCoverSrc(prova.capa) : null
  const imagem = capa ? (capa.startsWith('/') ? absoluteUrl(capa) : capa) : null

  return {
    title: titulo,
    description: descricao,
    // O endereço da prova muda de dono e de data; não é página de buscador.
    robots: privateNoIndexRobots,
    alternates: { canonical: `/exam/${id}` },
    openGraph: {
      title: `${titulo} | DomineAqui`,
      description: descricao,
      url: `/exam/${id}`,
      siteName: 'DomineAqui',
      type: 'website',
      locale: 'pt_BR',
      ...(imagem ? { images: [{ url: imagem, alt: `Capa da prova ${titulo}` }] } : {}),
    },
  }
}

/**
 * `/exam/[id]` para quem chega SEM conta.
 *
 * O middleware reescreve para cá; a barra continua mostrando o endereço da
 * prova. A pessoa vê a capa e o nome, e o convite: entrar, se já tem conta, ou
 * criar uma. Depois do login ela volta para a prova.
 *
 * Prova pessoal, oculta ou em grupo oculto não tem nome nem capa aqui (ver
 * `provaPublica`): a página fala de "uma prova" sem dizer qual, e não confirma
 * nem que ela existe. Quem decide o acesso continua sendo a API, depois do
 * login.
 */
export default async function VitrineDaProva({ params }: Props) {
  const { id } = await params
  const prova = await provaPublica(id)
  const conta = enderecosDeConta(`/exam/${id}`)

  const titulo = prova?.titulo ?? 'Uma prova espera por você'
  const longo = titulo.length > 42
  const fatos = [
    prova?.questoes ? `${prova.questoes} ${prova.questoes === 1 ? 'questão' : 'questões'}` : null,
    prova?.duracao ? duracaoPorExtenso(prova.duracao) : null,
    prova?.treino ? 'Prova de treino' : null,
  ].filter(Boolean) as string[]

  return (
    <CascoDaVitrine>
      <CabecalhoDaVitrine destino={`/exam/${id}`} sobreposto={false} />

      <section aria-labelledby="vitrine-titulo" className="bg-[#153d1f] text-[#f4f1ea]">
        <div className="grid min-h-[calc(100svh-56px)] grid-cols-1 content-center gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-12 lg:gap-x-10">
          <div className="deriva lg:col-span-8 lg:self-center">
            {prova?.capa ? (
              <CapaDaProva src={prova.capa} titulo={titulo} sizes="(max-width: 1024px) 100vw, 58vw" className="!aspect-[16/9]" />
            ) : (
              // Sem capa (ou sem prova que se possa mostrar), a ilustração da marca
              // no lugar — um painel vazio seria metade da tela sem nada.
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0b1f1a]">
                <CoverImage src={AUSCULTA.src} alt={AUSCULTA.alt} sizes="(max-width: 1024px) 100vw, 58vw" priority />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center lg:col-span-4">
            <h1
              id="vitrine-titulo"
              className={
                longo
                  ? 'display text-[34px] lg:text-[clamp(34px,3.2vw,48px)]'
                  : 'display text-[44px] lg:text-[clamp(44px,4.2vw,64px)]'
              }
            >
              {titulo}
            </h1>
            {fatos.length > 0 && (
              <p className="num mt-5 text-[18px] text-[#d6e2d8]">{fatos.join(' · ')}</p>
            )}

            <div data-chegada className="mt-10">
              <h2 className="display text-[28px] md:text-[34px]">Você quer fazer essa prova?</h2>
              <p className="mt-4 max-w-[40ch] text-[18px] leading-[1.5]">
                Entre na sua conta, se já tem uma. Se ainda não tem, crie a sua: é grátis, e depois de entrar você
                volta direto para esta prova.
              </p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                <Link href={conta.entrar} className="botao botao-ambar min-h-[60px]">
                  Entrar e fazer a prova
                </Link>
                <Link href={conta.criar} className="botao botao-papel min-h-[60px]">
                  Criar conta grátis
                </Link>
              </div>
              <p className="mt-6 text-[16px]">
                Quer conhecer antes?{' '}
                <Link href="/provas" className="elo font-semibold underline decoration-[#e2a43e]">
                  Veja como funcionam as provas
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <RodapeDaVitrine nota="Provas, banco de questões e materiais para quem estuda na faculdade." />
    </CascoDaVitrine>
  )
}
