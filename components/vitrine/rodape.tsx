import Link from 'next/link'

const EMAIL = 'contato@domineaqui.com.br'

/**
 * O rodapé é o contato, em tamanho de título: o e-mail, quebrado antes do @
 * em duas linhas, é o link. Em cima, as notas curtas; embaixo, uma linha de
 * links.
 */
export function RodapeDaVitrine({ nota }: { nota: string }) {
  const ano = new Date().getFullYear()
  return (
    <footer aria-labelledby="rodape-titulo" className="flex min-h-[70svh] flex-col bg-[#e2a43e] px-4 pb-8 pt-10 text-[#0b1f1a] md:px-8">
      <div className="flex items-start justify-between gap-6">
        <div className="grid max-w-[60ch] gap-1 text-[16px] md:grid-cols-2 md:gap-x-10">
          <p className="font-semibold">DomineAqui</p>
          <p>{nota}</p>
        </div>
        <a href="#vitrine-titulo" className="elo shrink-0 text-[16px] font-semibold">
          Voltar ao topo
        </a>
      </div>

      <div className="mt-auto pt-24">
        <h2 id="rodape-titulo" className="text-[16px] font-semibold">
          Dúvidas antes de criar a conta? Escreva para a gente.
        </h2>
        <a
          href={`mailto:${EMAIL}`}
          className="display elo mt-4 block text-[10.5vw] md:text-[clamp(50px,8.3vw,128px)]"
        >
          <span className="block">contato@</span>
          <span className="block">domineaqui.com.br</span>
        </a>
      </div>

      <div className="mt-12 flex flex-col gap-2 text-[16px] md:flex-row md:items-center md:justify-between">
        <nav aria-label="Documentos" className="flex gap-6">
          <Link href="/termos-de-servico" className="elo">
            Termos de serviço
          </Link>
          <Link href="/politica-de-privacidade" className="elo">
            Privacidade
          </Link>
        </nav>
        <p>Capas das provas e do atlas: acervo da plataforma</p>
        <p>Brasil, {ano}</p>
      </div>
    </footer>
  )
}
