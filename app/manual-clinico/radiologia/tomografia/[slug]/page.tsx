import { notFound } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import { getSecaoDaSubsecao, getSubsecao, getVizinhas } from '@/lib/tomografia'
import { VistaDaSerie } from './vista'

/**
 * A resolução da série, no servidor.
 *
 * `lib/tomografia` importa os vinte arquivos de `conteudo/` no topo — 710 KB de
 * atlas, com as 272 fichas de estrutura, os roteiros e os quizzes das vinte
 * séries. Enquanto esta página era `'use client'` e chamava `getSubsecao(slug)`
 * ela mesma, esse import atravessava a fronteira: o navegador baixava o atlas
 * inteiro para exibir uma série. Medido no build, o chunk desta rota tinha
 * 761 KB e o First Load JS, 611 kB — o mais pesado do projeto.
 *
 * Aqui o barril fica onde ele já estava de todo jeito. `layout.tsx` o usa em
 * `generateStaticParams` e `generateMetadata`, e a rota é gerada no build
 * (`●` na saída do Next), então a série resolvida é prerenderizada: o que chega
 * ao navegador é a subseção pedida, e não o acervo para encontrá-la.
 *
 * As props são recortes deliberados. `SecaoTC` carrega `subsecoes:
 * SubsecaoTC[]` e `getVizinhas` devolve duas `SubsecaoTC` inteiras; passá-las
 * como estão devolveria pela serialização o que a mudança acabou de economizar.
 * A vista usa três campos disso, e é o que atravessa.
 */
export default function SerieTomografiaPage({ params }: { params: { slug: string } }) {
  const sub = getSubsecao(params.slug)
  if (!sub) notFound()

  const secao = getSecaoDaSubsecao(sub)
  const { anterior, proxima } = getVizinhas(sub.id)

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <VistaDaSerie
        sub={sub}
        secaoTitulo={secao?.titulo ?? null}
        anterior={anterior ? { id: anterior.id, titulo: anterior.titulo } : null}
        proxima={proxima ? { id: proxima.id, titulo: proxima.titulo } : null}
      />
    </AppShell>
  )
}
