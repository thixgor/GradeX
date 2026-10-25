import Link from 'next/link'
import { CoverImage } from '@/components/cover-image'
import type { FotoDoMosaico } from './heroi'

/**
 * O fechamento: uma fileira de três peças, como se recortada de uma fileira
 * maior — a do meio, âmbar, com o convite; as das pontas saem pela borda da
 * tela (uma foto, um campo verde).
 */
export function ChamadaFinal({
  titulo,
  texto,
  criar,
  entrar,
  foto,
}: {
  titulo: string
  texto: string
  criar: string
  entrar: string
  foto?: FotoDoMosaico
}) {
  return (
    <section aria-labelledby="chamada-titulo" className="overflow-x-clip bg-[#0b1f1a] py-20 md:py-32">
      <div className="grid grid-cols-2 gap-2.5 px-4 md:grid-cols-12 md:gap-3 md:px-8">
        <div
          data-revelar
          className="col-span-2 grid min-h-[300px] content-center gap-6 bg-[#e2a43e] p-7 text-[#0b1f1a] md:col-start-3 md:col-end-11 md:row-start-1 md:min-h-[360px] md:p-10 lg:grid-cols-2 lg:gap-10"
        >
          <h2 id="chamada-titulo" className="display t-titulo">
            {titulo}
          </h2>
          <div className="lg:self-end">
            <p className="max-w-[40ch] text-[18px] leading-[1.5]">{texto}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href={criar} className="botao botao-tinta">
                Criar conta grátis
              </Link>
              <Link href={entrar} className="elo text-[18px] font-semibold">
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
        <div
          aria-hidden={!foto}
          className="mosaico-foto relative h-[120px] overflow-hidden bg-[#234f2c] md:col-start-1 md:col-end-3 md:row-start-1 md:-ml-8 md:h-auto [&_img]:object-[30%_50%]"
        >
          {foto && <CoverImage src={foto.src} alt={foto.alt} sizes="(max-width: 768px) 50vw, 17vw" />}
        </div>
        <div aria-hidden className="h-[120px] bg-[#468152] md:col-start-11 md:col-end-13 md:row-start-1 md:-mr-8 md:h-auto" />
      </div>
    </section>
  )
}
