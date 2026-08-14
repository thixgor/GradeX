import type { Metadata } from 'next'
import { LandingShell } from '@/components/landing-shell'

/**
 * A landing servida "à força", sem passar pelo cache de borda nem pelo desvio
 * de quem já tem sessão.
 *
 * Só existe como alvo do rewrite que o middleware faz em `/?landing=true` — o
 * endereço na barra continua sendo `/?landing=true`. É por aqui que:
 *   • o aluno logado vê a landing pelo item da sidebar, em vez de ser mandado
 *     de volta pro /dashboard;
 *   • o admin confere a landing enquanto ela está DESLIGADA no painel (a rota
 *     `/` nesse estado desvia para o login).
 *
 * `noindex`: o conteúdo é o mesmo de `/`, e duas URLs com o mesmo conteúdo
 * dividiriam o sinal de busca da página que realmente vende.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: '/' },
}

export default function PreviaLandingPage() {
  return <LandingShell />
}
