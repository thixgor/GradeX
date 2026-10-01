import { notFound } from 'next/navigation'
import { Microscope, Stethoscope } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { AcaoPrincipal, AcaoSecundaria, BannerDoCatalogo, SuperficieDoCatalogo } from '@/components/histologia/catalogo/banner'
import { CartoesDaFileira } from '@/components/histologia/catalogo/cartao'
import { FileiraDoCatalogo } from '@/components/histologia/catalogo/fileira'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import {
  BASE_DOS_SISTEMAS,
  assuntosDoSistema,
  doencasDoSistema,
  laminasNormaisDoSistema,
  laminasPatologicasComZoom,
  sistemasDePatologiaDe,
  type ItemDoCatalogo,
} from '@/lib/histologia/catalogo'
import { metadadosDoModulo } from '@/lib/histologia/seo'
import { rotaDoSistema as rotaDoSistemaComZoom } from '@/lib/histologia-zoom/rotas'
import { SISTEMAS } from '@/lib/histologia-zoom/sistemas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'
import { rotaDoSistema as rotaDoAtlasDoSistema } from '@/lib/histopatologia/rotas'
import { BASE_PATOZOOM } from '@/lib/histopatologia-zoom/rotas'

/**
 * Página de um sistema: o normal e o patológico do mesmo órgão, juntos.
 *
 * Antes, quem estudava "rim" tinha o rim normal na Histologia com Zoom, o
 * corpúsculo renal no atlas por assunto, a pielonefrite num capítulo e as
 * glomerulopatias na Histopatologia com Zoom — quatro catálogos, nenhum
 * apontando para os outros. Aqui as quatro fontes viram fileiras de uma página
 * só, na ordem em que se estuda: primeiro o normal, depois o que dá errado.
 */

export const dynamic = 'force-dynamic'

type Parametros = { params: { sistema: string } }

export async function generateMetadata({ params }: Parametros) {
  const sistema = SISTEMAS.find((s) => s.id === params.sistema)
  if (!sistema) return {}
  return metadadosDoModulo({
    titulo: `${sistema.nome} — normal e patológico`,
    descricao: sistema.descricao,
    caminho: `${BASE_DOS_SISTEMAS}/${sistema.id}`,
  })
}

export default async function PaginaDoSistema({ params }: Parametros) {
  await exigirAcessoAHistologia()
  const sistema = SISTEMAS.find((s) => s.id === params.sistema)
  if (!sistema) notFound()

  const comPatologia = histopatologiaHabilitada()
  const normais = laminasNormaisDoSistema(sistema.id)
  const assuntos = assuntosDoSistema(sistema.id)
  const doencas = comPatologia ? doencasDoSistema(sistema.id) : []
  const laminasDoentes = comPatologia ? laminasPatologicasComZoom(sistema.id) : []
  const atlas: ItemDoCatalogo[] = comPatologia
    ? sistemasDePatologiaDe(sistema.id)
        .filter((s) => s.entradas > 0)
        .map((s) => ({
          id: `atlas:${s.id}`,
          href: rotaDoAtlasDoSistema(s.id),
          titulo: s.nome,
          categoria: 'Histopatologia · Atlas visual',
          area: 'histopatologia' as const,
          imagem: null,
          zoom: false,
          detalhe: `${s.entradas.toLocaleString('pt-BR')} capítulos visuais · ${s.midias.toLocaleString('pt-BR')} imagens`,
          icone: 'Microscope',
          cor: sistema.cor,
        }))
    : []

  if (!normais.length && !assuntos.length && !doencas.length) notFound()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <SuperficieDoCatalogo navegacao={<NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />}>
        <BannerDoCatalogo
          compacto
          sobretitulo="Sistema"
          titulo={sistema.nome}
          texto={sistema.descricao}
          imagem={normais[0]?.imagem ?? doencas.find((d) => d.imagem)?.imagem}
          acoes={
            <>
              <AcaoPrincipal href="#normal">
                <Microscope className="h-4 w-4" aria-hidden /> Tecido normal
              </AcaoPrincipal>
              {doencas.length > 0 && (
                <AcaoSecundaria href="#doencas">
                  <Stethoscope className="h-4 w-4" aria-hidden /> Doenças ({doencas.length})
                </AcaoSecundaria>
              )}
            </>
          }
        />

        <div className="mx-auto max-w-[1600px]">
          <div id="normal" className="scroll-mt-4">
            {normais.length > 0 && (
              <FileiraDoCatalogo
                id="normais"
                titulo="Histologia · lâminas com zoom"
                subtitulo={`${normais.length} ${normais.length === 1 ? 'lâmina inteira' : 'lâminas inteiras'} do tecido saudável.`}
                verTudo={{ href: rotaDoSistemaComZoom(sistema.id), rotulo: 'Ver por órgão' }}
              >
                <CartoesDaFileira itens={normais} mostrarArea={false} prioridade />
              </FileiraDoCatalogo>
            )}
            {assuntos.length > 0 && (
              <FileiraDoCatalogo
                id="assuntos"
                titulo="Histologia · atlas por assunto"
                subtitulo="Fotomicrografias com as estruturas marcadas."
              >
                <CartoesDaFileira itens={assuntos} mostrarArea={false} />
              </FileiraDoCatalogo>
            )}
          </div>

          {comPatologia && (
            <div id="doencas" className="scroll-mt-4">
              {doencas.length > 0 && (
                <FileiraDoCatalogo
                  id="doencas-fileira"
                  titulo="Histopatologia · doenças"
                  subtitulo="O que dá errado neste sistema — capítulo e lâminas juntos."
                >
                  <CartoesDaFileira itens={doencas} mostrarArea={false} />
                </FileiraDoCatalogo>
              )}
              {laminasDoentes.length > 0 && (
                <FileiraDoCatalogo
                  id="laminas-doentes"
                  titulo="Histopatologia · lâminas com zoom"
                  subtitulo="Achados marcados na lâmina, com comparação ao normal."
                  verTudo={{ href: BASE_PATOZOOM }}
                >
                  <CartoesDaFileira itens={laminasDoentes} mostrarArea={false} />
                </FileiraDoCatalogo>
              )}
              {atlas.length > 0 && (
                <FileiraDoCatalogo id="atlas" titulo="Histopatologia · atlas visual">
                  <CartoesDaFileira itens={atlas} mostrarArea={false} />
                </FileiraDoCatalogo>
              )}
            </div>
          )}
        </div>
      </SuperficieDoCatalogo>
    </AppShell>
  )
}
