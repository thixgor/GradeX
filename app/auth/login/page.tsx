import LoginView from './login-view'

/**
 * A tela de entrar, estática — servida pela CDN, sem função.
 *
 * Era `force-dynamic` para ler `?redirect=` e `?mode=` no servidor e entregar
 * o formulário pronto no modo certo (com `useSearchParams()` o Next desistia
 * de renderizar a rota no servidor e o HTML era só o spinner). O preço era uma
 * função por visita e 72 KB de HTML cru saindo dela pelo Fast Origin Transfer:
 * 817 vezes num dia útil.
 *
 * Agora as duas coisas saem do servidor sem voltar ao spinner:
 *
 * - `?mode=register` é reescrito pelo middleware para `./criar-conta`, a mesma
 *   tela já no modo de criar conta — o endereço na barra não muda.
 * - `?redirect=` só importa depois do login, e é lido no navegador na hora de
 *   desviar (`destinoDepoisDoLogin`, em `login-view.tsx`).
 */
export default function LoginPage() {
  return <LoginView initialMode={null} />
}
