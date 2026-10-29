import './auth.css'

/**
 * Só existe para carregar `auth.css` nas rotas /auth — o vidro, a aurora e a
 * logo 3D não entram no CSS do resto do site. Não lê sessão nem cookie: as
 * telas continuam estáticas (ver CLAUDE.md, "Código que sai das funções").
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
