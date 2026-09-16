import Image from 'next/image'
import type { CapaReal } from '@/lib/semiologia/catalogo'
import { otimizavel } from '@/lib/semiologia/midia'
import { Ilustracao } from './ilustracoes/registro'

/**
 * A imagem de um card: a fotografia real quando o acervo tem uma, o esquema
 * quando não tem.
 *
 * A ordem é a mesma do visor — o caso real é o que o aluno vai reconhecer na
 * clínica, e é ele que deve chamá-lo para dentro. O esquema fica como
 * substituto honesto onde a curadoria ainda não chegou, e a etiqueta no canto
 * diz qual dos dois está na tela, para que ninguém confunda desenho com
 * paciente.
 */
export function Capa({
  real,
  ilustracao,
  className = '',
}: {
  real?: CapaReal
  ilustracao?: { id: string; params?: Record<string, number | string | boolean>; alt: string }
  className?: string
}) {
  if (real) {
    return (
      <div className={`relative aspect-square w-full overflow-hidden bg-black ${className}`}>
        {real.tipo === 'clipe' ? (
          <video src={real.src} className="h-full w-full object-cover" muted playsInline preload="metadata" aria-label={real.legenda} />
        ) : (
          // Os originais têm 2 a 10 MB; o otimizador entrega a miniatura no
          // tamanho da coluna, em WebP. Sem isto o catálogo baixa dezenas de MB
          // para mostrar quadrados de 300 px.
          <Image
            src={real.src}
            alt={real.legenda}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            unoptimized={!otimizavel(real.src)}
          />
        )}
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/90 backdrop-blur-sm">
          {real.cena ? `Caso real · ${real.cena}` : 'Caso real'}
        </span>
      </div>
    )
  }
  if (ilustracao) {
    return (
      <div className="relative">
        <Ilustracao id={ilustracao.id} params={ilustracao.params} titulo={ilustracao.alt} className={className} />
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
          Esquema
        </span>
      </div>
    )
  }
  return <div className={`aspect-square w-full bg-muted/40 ${className}`} />
}
