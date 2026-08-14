import { redirect } from 'next/navigation'
import { LandingShell } from '@/components/landing-shell'

// A landing é HTML ESTÁTICO, regenerado no máximo a cada 5 minutos — e na
// hora, via `revalidatePath('/')`, quando o admin mexe em `landing_settings`.
//
// Antes era `force-dynamic`: toda visita — inclusive a de quem chegou de um
// anúncio e nunca fez login — acordava uma função serverless, esperava
// `getSession()` (cookies + possível ida ao Atlas, com timeout de 2,5 s) e só
// então começava a montar as 2.400 linhas de JSX. Nada disso dependia do
// visitante: o HTML é idêntico para todo mundo deslogado. Agora ele sai do
// cache de borda, com TTFB de CDN e sem cold start — que é justamente o
// "carregando" que aparecia ANTES da landing aparecer.
//
// As duas decisões que dependiam do request saíram daqui:
//   • sessão válida → /dashboard: virou desvio no middleware (Edge, só JWT,
//     sem banco), antes de qualquer byte de HTML;
//   • ?landing=true (ver a landing mesmo logado, ou com ela desligada): o
//     middleware reescreve para /previa-landing, que é dinâmica. Ler
//     `searchParams` aqui tornaria esta rota dinâmica de novo.
export const revalidate = 300

interface LandingSettings {
  landingPageEnabled?: boolean
}

const DEFAULTS: Required<LandingSettings> = {
  landingPageEnabled: true,
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      }
    )
  })
}

async function loadLandingSettings(): Promise<Required<LandingSettings>> {
  try {
    const { getDb } = await import('@/lib/mongodb')
    const db = await withTimeout(getDb(), 2500)
    const settings = await withTimeout(
      db
        .collection<LandingSettings>('landing_settings')
        .findOne({}, { projection: { landingPageEnabled: 1 } }),
      2500
    )

    return settings
      ? { landingPageEnabled: settings.landingPageEnabled !== false }
      : DEFAULTS
  } catch {
    // Falha de rede/timeout (inclusive durante o build, sem acesso ao Atlas):
    // a landing continua no ar. Desligá-la por causa de uma intermitência do
    // banco seria o pior resultado possível para uma página de vendas.
    return DEFAULTS
  }
}

export default async function HomePage() {
  const settings = await loadLandingSettings()

  if (!settings.landingPageEnabled) {
    redirect('/auth/login')
  }

  return <LandingShell />
}
