import Link from 'next/link'
import { CoverImage } from '@/components/cover-image'
import { cn } from '@/lib/utils'
import { CabecalhoDaVitrine, enderecosDeConta } from './casco'

export interface FotoDoMosaico {
  src: string
  alt: string
}

/*
 * As dez células do mosaico, numa grade de 6×2 sem vão (3×2 no celular).
 * Quatro são fotos, o resto são campos chapados das cores da marca. A posição
 * de cada uma é fixa: o mosaico é uma composição, não uma lista.
 */
const CELULAS: Array<{ tipo: 'foto'; foto: number; classe: string } | { tipo: 'cor'; cor: string; classe: string }> = [
  { tipo: 'foto', foto: 0, classe: 'col-[1/3] row-[1] md:col-[1/3] md:row-[1]' },
  { tipo: 'cor', cor: '#468152', classe: 'col-[3] row-[1] md:col-[3] md:row-[1/3]' },
  { tipo: 'foto', foto: 1, classe: 'hidden md:block md:col-[4] md:row-[1]' },
  { tipo: 'cor', cor: '#e2a43e', classe: 'col-[3] row-[2] md:col-[5] md:row-[1]' },
  { tipo: 'cor', cor: '#153d1f', classe: 'hidden md:block md:col-[6] md:row-[1]' },
  { tipo: 'cor', cor: '#e9e4d8', classe: 'col-[1] row-[2] md:col-[1] md:row-[2]' },
  { tipo: 'foto', foto: 2, classe: 'col-[2] row-[2] md:col-[2] md:row-[2]' },
  { tipo: 'cor', cor: '#e2a43e', classe: 'hidden md:block md:col-[4] md:row-[2]' },
  { tipo: 'cor', cor: '#0b1f1a', classe: 'hidden md:block md:col-[5] md:row-[2]' },
  { tipo: 'foto', foto: 3, classe: 'hidden md:block md:col-[6] md:row-[2]' },
]

/**
 * O topo das vitrines: o mosaico de capas com o cabeçalho deitado na borda de
 * cima, e, abaixo dele, a frase de apoio à esquerda e o título começando a 42%
 * da largura. No celular o título vem primeiro, na margem.
 */
export function HeroiDaVitrine({
  destino,
  linhas,
  apoio,
  fotos,
  acaoPrincipal = 'Criar conta grátis',
}: {
  /** O endereço que a pessoa abriu — é para lá que o login a devolve. */
  destino: string
  /** O título, já quebrado em duas linhas (cada uma sobe da própria linha de base). */
  linhas: [string, string]
  apoio: string
  /** Quatro fotos; faltando, a célula vira cor. */
  fotos: FotoDoMosaico[]
  acaoPrincipal?: string
}) {
  const conta = enderecosDeConta(destino)

  return (
    <section aria-labelledby="vitrine-titulo" className="relative">
      <CabecalhoDaVitrine destino={destino} />

      <div className="grid h-[66vw] grid-cols-3 grid-rows-2 md:h-[52svh] md:min-h-[360px] md:grid-cols-6">
        {CELULAS.map((celula, i) => {
          if (celula.tipo === 'cor') {
            return <div key={i} aria-hidden className={celula.classe} style={{ background: celula.cor }} />
          }
          const foto = fotos[celula.foto]
          if (!foto) {
            return <div key={i} aria-hidden className={cn(celula.classe, 'bg-[#234f2c]')} />
          }
          return (
            <div key={i} className={cn('mosaico-foto relative overflow-hidden bg-[#234f2c]', celula.classe)}>
              <CoverImage
                src={foto.src}
                alt={foto.alt}
                priority={celula.foto < 2}
                sizes={celula.foto === 0 ? '(max-width: 768px) 66vw, 34vw' : '(max-width: 768px) 34vw, 17vw'}
              />
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-y-8 px-4 pb-20 pt-10 md:grid-cols-12 md:gap-x-6 md:px-8 md:pb-32 md:pt-[110px]">
        <h1
          id="vitrine-titulo"
          className="display linhas t-display md:col-start-6 md:col-end-13 md:row-start-1"
        >
          <span className="linha">
            <span data-linha style={{ ['--i' as string]: 0 }}>
              {linhas[0]}
            </span>
          </span>
          <span className="linha">
            <span data-linha style={{ ['--i' as string]: 1 }}>
              {linhas[1]}
            </span>
          </span>
        </h1>

        <div data-chegada className="md:col-start-1 md:col-end-6 md:row-start-1 md:self-end">
          <p className="max-w-[32ch] text-[18px] leading-[1.45] md:text-[20px]">{apoio}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={conta.criar} className="botao botao-ambar">
              {acaoPrincipal}
            </Link>
            <Link href={conta.entrar} className="elo text-[18px] font-semibold">
              Já tenho conta
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
