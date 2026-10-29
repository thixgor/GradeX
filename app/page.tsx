import { redirect } from 'next/navigation'
import { LandingShell } from '@/components/landing-shell'
import { precoDoPlus, type PrecoDoPlus } from '@/lib/landing/preco-do-plus'
import type { PlanConfig } from '@/lib/types'

// A landing é HTML ESTÁTICO, regenerado no máximo a cada hora — e na hora,
// via `revalidatePath('/')`, quando o admin mexe em `landing_settings`.
//
// Uma hora, e não os 5 minutos de antes. O único dado de servidor aqui é
// `landingPageEnabled`, e mudá-lo já invalida a página na hora. Com 5 minutos,
// o prazo não trazia nada novo: só regenerava ~210 KB de HTML (mais o payload
// RSC) até 288 vezes por dia, e cada regeneração é uma função, uma escrita de
// ISR e uma nova leitura da borda. O que ele ainda cobre é o caso em que uma
// regeneração pega o banco fora do ar e cai no padrão (landing ligada). Uma
// hora mantém esse desvio curto.
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
export const revalidate = 3600

interface LandingSettings {
  landingPageEnabled?: boolean
}

interface DadosDaLanding {
  landingPageEnabled: boolean
  /** Preço do Plus+ para o cartão do plano; `null` = cartão sem número. */
  precoPlus: PrecoDoPlus | null
}

const DEFAULTS: DadosDaLanding = {
  landingPageEnabled: true,
  precoPlus: null,
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

/**
 * As duas leituras da landing, em paralelo: o interruptor da página e o
 * catálogo de planos (para o preço do Plus+ no cartão). Entram no mesmo HTML
 * estático de uma hora — o preço não custa uma consulta por visita; quem salva
 * os planos no painel invalida `/` (app/api/admin/settings/planos).
 */
async function loadLandingSettings(): Promise<DadosDaLanding> {
  try {
    const { getDb } = await import('@/lib/mongodb')
    const db = await withTimeout(getDb(), 2500)
    const [settings, admin] = await withTimeout(
      Promise.all([
        db
          .collection<LandingSettings>('landing_settings')
          .findOne({}, { projection: { landingPageEnabled: 1 } }),
        db
          .collection<{ planos?: PlanConfig[] }>('admin_settings')
          .findOne({}, { projection: { planos: 1 } }),
      ]),
      2500
    )

    return {
      landingPageEnabled: settings ? settings.landingPageEnabled !== false : true,
      precoPlus: precoDoPlus(admin?.planos),
    }
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

  return <LandingShell precoPlus={settings.precoPlus} />
}
