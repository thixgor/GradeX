'use client'

import { Layers, ScanSearch } from 'lucide-react'

import { AcaoPrincipal, AcaoSecundaria, BannerDoCatalogo, SuperficieDoCatalogo } from '@/components/histologia/catalogo/banner'
import { CartoesDaFileira } from '@/components/histologia/catalogo/cartao'
import { FileiraDoCatalogo } from '@/components/histologia/catalogo/fileira'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { CREDITO_BASE } from '@/lib/histologia/licenca'
import { rotaDosDadosDoCatalogo, type DadosDaAreaNormal } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { RODAPE_DO_ACERVO } from '@/lib/histologia-zoom/fonte'
import { BASE_ZOOM } from '@/lib/histologia-zoom/rotas'

/**
 * Área **Histologia** — o tecido normal, inteiro, numa página.
 *
 * Antes, o normal estava espalhado em três lugares sem relação aparente: os
 * setores na home, o "Atlas" (busca) numa aba e a "Histologia com Zoom" em
 * outra. Aqui eles são uma área só, com duas formas de ver a lâmina:
 *
 * - **atlas por assunto** — fotomicrografias com as estruturas marcadas, na
 *   ordem do curso (os quatro setores do currículo, uma fileira cada);
 * - **lâminas inteiras com zoom** — o visualizador de lâmina inteira, uma
 *   fileira por sistema, com o selo Zoom em cada cartão.
 *
 * As listagens completas continuam onde estavam (landing de cada setor,
 * catálogo do zoom com busca) e são o "Ver tudo" de cada fileira — nenhum link
 * antigo deixou de funcionar.
 *
 * O casco é estático; as fileiras vêm de `/api/manual-clinico/histologia/catalogo/normal`,
 * depois do portão.
 */
export function AreaNormal({ comPatologia }: { comPatologia: boolean }) {
  return (
    <PortaoDaHistologia<DadosDaAreaNormal> url={rotaDosDadosDoCatalogo(['normal'])} superficie="catalogo">
      {(dados) => <Conteudo dados={dados} comPatologia={comPatologia} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados, comPatologia }: { dados: DadosDaAreaNormal; comPatologia: boolean }) {
  const { totais } = dados

  return (
    <SuperficieDoCatalogo navegacao={<NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />}>
      <BannerDoCatalogo
        compacto
        sobretitulo="Área · tecido normal"
        titulo="Histologia"
        texto="Células, tecidos e órgãos saudáveis. Escolha um assunto do curso ou abra uma lâmina inteira e navegue com zoom."
        imagem={dados.imagem}
        acoes={
          <>
            <AcaoPrincipal href="#assuntos">
              <Layers className="h-4 w-4" aria-hidden /> Atlas por assunto
            </AcaoPrincipal>
            <AcaoSecundaria href="#zoom">
              <ScanSearch className="h-4 w-4" aria-hidden /> Lâminas com zoom
            </AcaoSecundaria>
          </>
        }
      >
        {/* As duas formas de ver, ditas uma vez — os cartões repetem com o selo. */}
        <dl className="mt-6 grid max-w-2xl gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10 backdrop-blur-md">
            <dt className="flex items-center gap-1.5 font-bold text-white">
              <Layers className="h-3.5 w-3.5 text-[#E8763A]" aria-hidden /> Atlas por assunto
            </dt>
            <dd className="mt-1 leading-relaxed text-white/65">
              {totais.laminas.toLocaleString('pt-BR')} fotomicrografias com{' '}
              {totais.estruturas.toLocaleString('pt-BR')} estruturas para acender, uma a uma.
            </dd>
          </div>
          <div className="rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10 backdrop-blur-md">
            <dt className="flex items-center gap-1.5 font-bold text-white">
              <ScanSearch className="h-3.5 w-3.5 text-[#E8763A]" aria-hidden /> Lâminas com zoom
            </dt>
            <dd className="mt-1 leading-relaxed text-white/65">
              {totais.laminasComZoom} lâminas inteiras em {totais.sistemasComZoom} sistemas, com zoom contínuo até a
              objetiva de imersão.
            </dd>
          </div>
        </dl>
      </BannerDoCatalogo>

      <div className="mx-auto max-w-[1600px]">
        <FileiraDoCatalogo
          id="destaques"
          titulo="Em destaque"
          subtitulo="Lâminas inteiras escolhidas pela qualidade do scan."
          verTudo={{ href: BASE_ZOOM, rotulo: 'Todas com zoom' }}
        >
          <CartoesDaFileira itens={dados.destaques} mostrarArea={false} prioridade />
        </FileiraDoCatalogo>

        <div id="assuntos" className="scroll-mt-4">
          <h2 className="mt-12 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#E8763A] md:px-10">
            Atlas por assunto · na ordem do curso
          </h2>
          {dados.setores.map((setor, i) => (
            <FileiraDoCatalogo
              key={setor.slug}
              id={`setor-${setor.slug}`}
              titulo={`${i + 1}. ${setor.titulo}`}
              verTudo={{ href: setor.href }}
            >
              <CartoesDaFileira itens={setor.itens} mostrarArea={false} />
            </FileiraDoCatalogo>
          ))}
        </div>

        <div id="zoom" className="scroll-mt-4">
          <h2 className="mt-14 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#E8763A] md:px-10">
            Lâminas com zoom · por sistema
          </h2>
          {dados.sistemas.map((sistema) => (
            <FileiraDoCatalogo
              key={sistema.id}
              id={`zoom-${sistema.id}`}
              titulo={sistema.nome}
              subtitulo={`${sistema.total} ${sistema.total === 1 ? 'lâmina' : 'lâminas'}`}
              verTudo={{ href: sistema.href }}
            >
              <CartoesDaFileira itens={sistema.itens} mostrarArea={false} />
            </FileiraDoCatalogo>
          ))}
        </div>
      </div>

      <footer className="mx-auto mt-14 max-w-[1600px] space-y-2 border-t border-white/10 px-4 pt-6 text-xs leading-relaxed text-white/50 md:px-10">
        <p>{CREDITO_BASE}</p>
        <p>{RODAPE_DO_ACERVO}</p>
      </footer>
    </SuperficieDoCatalogo>
  )
}
