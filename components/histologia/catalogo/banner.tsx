import Link from 'next/link'

/**
 * Banner de abertura das páginas do catálogo.
 *
 * Uma lâmina real ocupa o fundo; o véu da esquerda garante contraste para o
 * texto em qualquer imagem. Uma frase, duas ações no máximo — o banner diz
 * onde o aluno está e qual é o primeiro clique, não explica o módulo.
 */
export function BannerDoCatalogo({
  sobretitulo,
  titulo,
  texto,
  imagem,
  creditoDaImagem,
  acoes,
  children,
  compacto = false,
}: {
  sobretitulo: React.ReactNode
  titulo: React.ReactNode
  texto?: React.ReactNode
  imagem?: string | null
  creditoDaImagem?: string
  acoes?: React.ReactNode
  children?: React.ReactNode
  compacto?: boolean
}) {
  return (
    <header className="relative isolate overflow-hidden">
      {imagem && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imagem}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-70 md:left-auto md:w-[68%]"
        />
      )}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#071411] via-[#071411]/90 to-[#071411]/20 md:via-[#071411]/75"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[#071411] to-transparent" aria-hidden />

      <div
        className={`mx-auto max-w-[1600px] px-4 md:px-10 ${compacto ? 'pb-8 pt-8 md:pb-10 md:pt-12' : 'pb-10 pt-10 md:pb-16 md:pt-20'}`}
      >
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#E8763A]">{sobretitulo}</p>
        <h1
          className={`max-w-2xl font-heading font-semibold tracking-tight text-white ${
            compacto ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl lg:text-6xl'
          }`}
        >
          {titulo}
        </h1>
        {texto && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75 sm:text-base">{texto}</p>}
        {acoes && <div className="mt-6 flex flex-wrap gap-3">{acoes}</div>}
        {children}
        {creditoDaImagem && imagem && (
          <p className="mt-6 text-[10px] text-white/40 md:absolute md:bottom-4 md:right-10 md:mt-0">{creditoDaImagem}</p>
        )}
      </div>
    </header>
  )
}

/** Ação principal do banner: laranja da marca, alvo de 44 px. */
export function AcaoPrincipal({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-[#E8763A] px-6 text-sm font-bold text-[#0B1F1A] shadow-lg shadow-[#E8763A]/20 transition-colors hover:bg-[#f08a52]"
    >
      {children}
    </Link>
  )
}

/** Ação secundária: vidro sobre a lâmina. */
export function AcaoSecundaria({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-white/10 px-6 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/20"
    >
      {children}
    </Link>
  )
}

/** Envoltório das páginas do catálogo: tema escuro da marca e a barra do módulo. */
export function SuperficieDoCatalogo({
  navegacao,
  children,
}: {
  navegacao: React.ReactNode
  children: React.ReactNode
}) {
  return (
    // `dark` aqui força os tokens escuros só nesta subárvore: o catálogo é
    // sempre escuro, as páginas de estudo seguem o tema do aluno.
    <div className="dark catalogo-histo">
      {navegacao}
      <main className="pb-16">{children}</main>
    </div>
  )
}
