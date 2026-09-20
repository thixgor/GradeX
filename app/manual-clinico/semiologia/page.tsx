import { AreaSemiologia } from '@/components/semiologia/area'
import { HomeSemiologia } from '@/components/semiologia/home'
import { montarCatalogo } from '@/lib/semiologia/catalogo'

/**
 * Home do Manual de Semiologia — montada no servidor.
 *
 * `montarCatalogo()` roda aqui e não no cliente pelo mesmo motivo da home da
 * Radiologia: os módulos de conteúdo somam centenas de KB de fonte, e a home
 * só precisa de nomes e contagens. O que desce é HTML.
 */
export default function SemiologiaPage() {
  return (
    <AreaSemiologia busca={false}>
      <div className="surface-page min-h-screen">
        {/* A home é a única rota do módulo sem a barra de busca no topo — lá a
            busca é o hero. Sem a barra, nada empurra o conteúdo para baixo dos
            botões flutuantes do AppShell, e o H1 nascia debaixo do menu no
            celular. `abaixo-dos-flutuantes` é o mesmo recuo que a barra faz. */}
        <div className="abaixo-dos-flutuantes container mx-auto max-w-6xl px-4 py-10">
          <HomeSemiologia catalogo={montarCatalogo()} />
        </div>
      </div>
    </AreaSemiologia>
  )
}
