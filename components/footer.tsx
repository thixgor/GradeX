import Link from 'next/link'
import { Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/equipe"
              className="hover:text-foreground transition-colors underline underline-offset-4"
            >
              Equipe
            </Link>
            <span className="hidden sm:inline">•</span>
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
          <div className="flex items-center justify-center gap-6 my-2">
            <a
              href="https://instagram.com/domineaqui.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-[#E4405F] transition-all hover:scale-110"
              title="Instagram"
            >
              <Instagram size={22} />
            </a>
            <a
              href="https://discord.gg/vdfHcvDdMw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-[#5865F2] transition-all hover:scale-110"
              title="Discord"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.29a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.29a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.874.89.076.076 0 0 0-.041.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} DomineAqui LTDA. Todos os direitos reservados.</p>
            <p className="font-semibold mt-1">Seja o Foco. Seja a Referência.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
