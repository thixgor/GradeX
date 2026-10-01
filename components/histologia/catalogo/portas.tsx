import Link from 'next/link'
import { ArrowRight, Microscope, ScanSearch, Stethoscope } from 'lucide-react'

/**
 * As duas portas do Manual: tecido normal e doença.
 *
 * É a resposta visual à pergunta "onde eu clico?". Duas áreas, duas portas —
 * e o zoom aparece dentro de cada uma como o que ele é: uma forma de ver a
 * lâmina, não uma terceira e quarta porta.
 */
export function PortasDasAreas({
  histologia,
  histopatologia,
}: {
  histologia: { href: string; imagem: string | null; laminas: number; comZoom: number; assuntos: number }
  histopatologia: { href: string; imagem: string | null; doencas: number; comZoom: number } | null
}) {
  return (
    <section aria-label="As duas áreas do Manual" className="mx-auto max-w-[1600px] px-4 md:px-10">
      <ul className={`grid gap-3 md:gap-4 ${histopatologia ? 'sm:grid-cols-2' : ''}`}>
        <li>
          <Porta
            href={histologia.href}
            imagem={histologia.imagem}
            icone={<Microscope className="h-5 w-5" aria-hidden />}
            sobretitulo="Tecido normal"
            titulo="Histologia"
            texto="Células, tecidos e órgãos saudáveis — do atlas por assunto às lâminas inteiras."
            numeros={[
              `${histologia.assuntos} assuntos`,
              `${histologia.laminas.toLocaleString('pt-BR')} fotomicrografias`,
              `${histologia.comZoom} lâminas com zoom`,
            ]}
            acento="from-emerald-500/30"
          />
        </li>
        {histopatologia && (
          <li>
            <Porta
              href={histopatologia.href}
              imagem={histopatologia.imagem}
              icone={<Stethoscope className="h-5 w-5" aria-hidden />}
              sobretitulo="Tecido doente"
              titulo="Histopatologia"
              texto="Doenças na lâmina: o achado, o mecanismo que o produziu e o normal ao lado."
              numeros={[`${histopatologia.doencas} doenças`, `${histopatologia.comZoom} lâminas com zoom`]}
              acento="from-rose-500/30"
            />
          </li>
        )}
      </ul>
    </section>
  )
}

function Porta({
  href,
  imagem,
  icone,
  sobretitulo,
  titulo,
  texto,
  numeros,
  acento,
}: {
  href: string
  imagem: string | null
  icone: React.ReactNode
  sobretitulo: string
  titulo: string
  texto: string
  numeros: string[]
  acento: string
}) {
  return (
    <Link
      href={href}
      className="group/porta relative isolate flex min-h-[200px] flex-col justify-end overflow-hidden rounded-2xl p-5 ring-1 ring-white/10 transition duration-300 hover:ring-[#E8763A]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8763A] sm:min-h-[240px] sm:p-6"
    >
      {imagem && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imagem}
          alt=""
          loading="eager"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover/porta:scale-105"
        />
      )}
      <span className={`absolute inset-0 -z-10 bg-gradient-to-br ${acento} via-[#0B1F1A]/80 to-[#071411]`} aria-hidden />

      <span className="mb-auto inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md">
        {icone}
      </span>
      <span className="mt-6 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#E8763A]">{sobretitulo}</span>
      <span className="mt-1 flex items-center gap-2 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {titulo}
        <ArrowRight
          className="h-6 w-6 text-[#E8763A] transition-transform duration-300 group-hover/porta:translate-x-1"
          aria-hidden
        />
      </span>
      <span className="mt-2 block max-w-md text-sm leading-relaxed text-white/75">{texto}</span>
      <span className="mt-3 flex flex-wrap gap-1.5">
        {numeros.map((n) => (
          <span
            key={n}
            className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white/85 ring-1 ring-white/10 backdrop-blur-sm"
          >
            {n.includes('zoom') && <ScanSearch className="h-3 w-3 text-[#E8763A]" aria-hidden />}
            {n}
          </span>
        ))}
      </span>
    </Link>
  )
}
