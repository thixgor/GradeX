import { AppShell } from '@/components/app-shell'
import { BannerDoCatalogo, SuperficieDoCatalogo } from '@/components/histologia/catalogo/banner'
import { CartaoDoCatalogo } from '@/components/histologia/catalogo/cartao'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { BASE_DOS_SISTEMAS, sistemasDoCatalogo } from '@/lib/histologia/catalogo'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * Explorar por sistemas — o "gênero" do catálogo.
 *
 * Cada sistema abre uma página com o tecido normal e o doente juntos. É o
 * recorte de quem estuda por bloco do curso ("semana do digestório") e não por
 * tipo de material.
 */

export const dynamic = 'force-dynamic'

export const metadata = metadadosDoModulo({
  titulo: 'Sistemas',
  descricao: 'Histologia normal e histopatologia de cada sistema do corpo, lado a lado, com lâminas de zoom interativo.',
  caminho: BASE_DOS_SISTEMAS,
})

export default async function IndiceDosSistemas() {
  await exigirAcessoAHistologia()
  const comPatologia = histopatologiaHabilitada()
  const sistemas = sistemasDoCatalogo().map((s) =>
    comPatologia ? s : { ...s, categoria: `${s.laminasNormais} lâminas normais` },
  )

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <SuperficieDoCatalogo navegacao={<NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />}>
        <BannerDoCatalogo
          compacto
          sobretitulo="Explorar"
          titulo="Sistemas"
          texto={
            comPatologia
              ? 'Escolha um sistema e veja, numa página só, o tecido saudável e as doenças que o atingem.'
              : 'Escolha um sistema e veja todas as lâminas dele numa página só.'
          }
        />
        <ul className="mx-auto grid max-w-[1600px] grid-cols-2 gap-x-3 gap-y-6 px-4 min-[560px]:grid-cols-3 md:grid-cols-4 md:gap-x-4 md:px-10 lg:grid-cols-5 xl:grid-cols-6">
          {sistemas.map((s, i) => (
            <li key={s.id}>
              <CartaoDoCatalogo item={s} formato="retrato" mostrarArea={false} prioridade={i < 6} />
            </li>
          ))}
        </ul>
      </SuperficieDoCatalogo>
    </AppShell>
  )
}
