import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/termos-de-servico"
              className="hover:text-foreground transition-colors underline underline-offset-4"
            >
              Termos de Serviço
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link
              href="/politica-de-privacidade"
              className="hover:text-foreground transition-colors underline underline-offset-4"
            >
              Política de Privacidade
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>© 2025 DomineAqui LTDA. Todos os direitos reservados.</p>
            <p className="font-semibold mt-1">Seja o Foco. Seja a Referência.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
