import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Contador } from './cena'

/* As seções das vitrines: vidro sobre a aurora. */

export interface Numero {
  ate: number
  prefixo?: string
  sufixo?: string
  rotulo: string
}

/**
 * O topo: à esquerda a pílula, o título (cada palavra sobe e desfoca para
 * nítida, as palavras-chave com o brilho correndo), a frase, as duas ações e
 * os números reais; à direita, a cena.
 */
export function Heroi({
  pilula,
  titulo,
  destaque = [],
  apoio,
  acoes,
  numeros = [],
  cena,
  tituloMenor = false,
}: {
  pilula: ReactNode
  titulo: string
  /** Palavras do título que levam o brilho. */
  destaque?: string[]
  apoio: ReactNode
  acoes: { principal: { href: string; rotulo: string }; secundaria: { href: string; rotulo: string } }
  numeros?: Numero[]
  cena: ReactNode
  /** Títulos longos (o nome de uma prova) descem de tamanho. */
  tituloMenor?: boolean
}) {
  const palavras = titulo.split(' ')
  return (
    <section aria-labelledby="vitrine-titulo" className="relative px-4 pb-16 pt-28 md:px-8 md:pt-36 lg:min-h-[100svh] lg:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <div data-chegada style={{ ['--i' as string]: -4 }}>
            {pilula}
          </div>
          <h1
            id="vitrine-titulo"
            className={cn(
              'titulo-display mt-6',
              tituloMenor ? 'text-[clamp(40px,4.6vw,66px)]' : 'text-[clamp(44px,5.6vw,80px)]',
            )}
          >
            {palavras.map((p, i) => (
              <span key={`${p}-${i}`}>
                <span data-palavra style={{ ['--i' as string]: i }} className={destaque.includes(p) ? 'texto-brilho' : undefined}>
                  {p}
                </span>
                {i < palavras.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>
          <div data-chegada style={{ ['--i' as string]: 0 }} className="mt-6 max-w-[46ch] text-[18px] text-[var(--papel-suave)] md:text-[19px]">
            {apoio}
          </div>
          <div data-chegada style={{ ['--i' as string]: 1 }} className="mt-9 flex flex-wrap items-center gap-3">
            <Link href={acoes.principal.href} className="botao botao-principal">
              {acoes.principal.rotulo}
              <span aria-hidden>→</span>
            </Link>
            <Link href={acoes.secundaria.href} className="botao botao-vidro">
              {acoes.secundaria.rotulo}
            </Link>
          </div>
          {numeros.length > 0 && (
            <dl data-chegada style={{ ['--i' as string]: 2 }} className="mt-10 flex flex-wrap gap-3">
              {numeros.map((n) => (
                <div key={n.rotulo} className="vidro rounded-2xl px-5 py-3">
                  <dt className="sr-only">{n.rotulo}</dt>
                  <dd className="text-[26px] font-bold leading-tight">
                    <Contador ate={n.ate} prefixo={n.prefixo} sufixo={n.sufixo} />
                  </dd>
                  <dd aria-hidden className="text-[13px] text-[var(--papel-fraco)]">
                    {n.rotulo}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div data-chegada style={{ ['--i' as string]: 1 }} className="lg:col-span-6">
          {cena}
        </div>
      </div>
    </section>
  )
}

/** A faixa que corre sozinha, com coisas reais do catálogo (pausa sob o mouse). */
export function FaixaInfinita({ rotulo, itens }: { rotulo: string; itens: ReactNode[] }) {
  if (itens.length === 0) return null
  // Duas cópias seguidas: a animação anda metade e recomeça sem emenda.
  const dobrado = [...itens, ...itens]
  return (
    <section aria-label={rotulo} className="py-6">
      <div className="faixa-moldura">
        <ul className="faixa">
          {dobrado.map((item, i) => (
            <li key={i} aria-hidden={i >= itens.length} className="vidro pilula !px-5 !py-3 !text-[15px] !text-[var(--papel)]">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Pílula, título e frase de uma seção. */
export function CabecalhoDeSecao({
  id,
  pilula,
  titulo,
  texto,
}: {
  id: string
  pilula: string
  titulo: ReactNode
  texto?: string
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p data-revelar className="vidro pilula">
        {pilula}
      </p>
      <h2 id={id} data-revelar style={{ ['--i' as string]: 1 }} className="titulo-secao mt-5 text-[clamp(36px,4.6vw,60px)]">
        {titulo}
      </h2>
      {texto && (
        <p data-revelar style={{ ['--i' as string]: 2 }} className="mx-auto mt-5 max-w-[56ch] text-[18px] text-[var(--papel-suave)]">
          {texto}
        </p>
      )}
    </div>
  )
}

/** Um cartão de vidro da grade: título, frase e a tela que prova o que diz. */
export function CartaoBento({
  titulo,
  texto,
  children,
  className,
  atraso = 0,
}: {
  titulo: string
  texto: string
  children: ReactNode
  className?: string
  atraso?: number
}) {
  return (
    <article
      data-revelar
      style={{ ['--i' as string]: atraso }}
      className={cn('vidro cartao-ergue flex flex-col rounded-[28px] p-5 md:p-7', className)}
    >
      <h3 className="titulo-secao text-[26px]">{titulo}</h3>
      <p className="mt-2 max-w-[48ch] text-[16px] text-[var(--papel-suave)]">{texto}</p>
      <div className="mt-6 flex-1">{children}</div>
    </article>
  )
}

/** Uma seção com cabeçalho centralizado e conteúdo embaixo. */
export function Secao({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn('px-4 py-20 md:px-8 md:py-28', className)}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  )
}

/**
 * O fechamento: um cartão de vidro com a borda de luz girando em volta, o
 * convite e as duas portas.
 */
export function ChamadaFinal({
  titulo,
  texto,
  criar,
  entrar,
  rotuloEntrar = 'Já tenho conta',
}: {
  titulo: ReactNode
  texto: string
  criar: string
  entrar: string
  rotuloEntrar?: string
}) {
  return (
    <section aria-labelledby="chamada-titulo" className="px-4 py-20 md:px-8 md:py-28">
      <div data-revelar className="borda-viva mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[30px] bg-[#0b1f1a]/90 px-6 py-14 text-center md:px-16 md:py-20">
          <div aria-hidden className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#468152]/35 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#e2a43e]/25 blur-3xl" />
          <h2 id="chamada-titulo" className="titulo-secao relative text-[clamp(36px,5vw,64px)]">
            {titulo}
          </h2>
          <p className="relative mx-auto mt-5 max-w-[48ch] text-[18px] text-[var(--papel-suave)]">{texto}</p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <Link href={criar} className="botao botao-principal">
              Criar conta grátis <span aria-hidden>→</span>
            </Link>
            <Link href={entrar} className="botao botao-vidro">
              {rotuloEntrar}
            </Link>
          </div>
          <p className="relative mt-6 text-[14px] text-[var(--papel-fraco)]">Nome, e-mail e uma senha. Leva um minuto.</p>
        </div>
      </div>
    </section>
  )
}
