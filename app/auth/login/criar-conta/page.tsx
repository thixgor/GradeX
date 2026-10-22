import LoginView from '../login-view'

/**
 * `/auth/login?mode=register`, estático. Não é linkado direto: o middleware
 * reescreve o endereço com `?mode=register` para cá, e a barra continua
 * mostrando o original (ver `../page.tsx`).
 */
export default function CriarContaPage() {
  return <LoginView initialMode="register" />
}
