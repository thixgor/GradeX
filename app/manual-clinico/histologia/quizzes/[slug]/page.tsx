import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import { PaginaDoQuiz } from '@/components/histologia/pagina-do-quiz'
import { EsperaDaHistologia } from '@/components/histologia/portao'
import { listarSlugsDeQuiz } from '@/lib/histologia/repositorio'
import { BASE } from '@/lib/histologia/seo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { absoluteUrl } from '@/lib/seo'

/**
 * Um quiz de identificação — casco estático, gerado na primeira visita a cada
 * quiz (a lista dos 84 slugs no build só fazia o build visitar cada um).
 *
 * O quiz chega de `/api/manual-clinico/histologia/catalogo/quizzes/<slug>`,
 * depois do portão. `?modo=prova` é lido no navegador e repassado à rota, que
 * tira o gabarito no servidor — por isso o componente fica num `Suspense`: o
 * casco é o mesmo para os dois modos. Quiz inexistente continua em 404,
 * decidido aqui.
 */

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  return { alternates: { canonical: absoluteUrl(`${BASE}/quizzes/${slug}`) } }
}

export default async function CascoDoQuiz(props: Props) {
  const { slug } = await props.params
  if (!listarSlugsDeQuiz().includes(slug)) notFound()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Suspense fallback={<EsperaDaHistologia />}>
        <PaginaDoQuiz slug={slug} comPatologia={histopatologiaHabilitada()} />
      </Suspense>
    </AppShell>
  )
}
