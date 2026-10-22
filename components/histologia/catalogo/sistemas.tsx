'use client'

import { Microscope, Stethoscope } from 'lucide-react'

import { AcaoPrincipal, AcaoSecundaria, BannerDoCatalogo, SuperficieDoCatalogo } from '@/components/histologia/catalogo/banner'
import { CartaoDoCatalogo, CartoesDaFileira } from '@/components/histologia/catalogo/cartao'
import { FileiraDoCatalogo } from '@/components/histologia/catalogo/fileira'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { useTituloDaAba } from '@/components/histologia/pagina'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import {
  rotaDosDadosDoCatalogo,
  type DadosDoSistemaUnificado,
  type DadosDosSistemas,
} from '@/lib/histologia/paginas-do-catalogo-tipos'
import { rotaDoSistema as rotaDoSistemaComZoom } from '@/lib/histologia-zoom/rotas'
import { BASE_PATOZOOM } from '@/lib/histopatologia-zoom/rotas'

/**
 * Explorar por sistemas — o "gênero" do catálogo.
 *
 * Cada sistema abre uma página com o tecido normal e o doente juntos. É o
 * recorte de quem estuda por bloco do curso ("semana do digestório") e não por
 * tipo de material. Os cascos são estáticos; o conteúdo vem de
 * `/api/manual-clinico/histologia/catalogo/sistemas[/<sistema>]`, depois do portão.
 */
export function IndiceDosSistemas() {
  return (
    <PortaoDaHistologia<DadosDosSistemas> url={rotaDosDadosDoCatalogo(['sistemas'])} superficie="catalogo">
      {({ comPatologia, sistemas }) => (
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
      )}
    </PortaoDaHistologia>
  )
}

export function SistemaUnificado({ sistema }: { sistema: string }) {
  return (
    <PortaoDaHistologia<DadosDoSistemaUnificado> url={rotaDosDadosDoCatalogo(['sistemas', sistema])} superficie="catalogo">
      {(dados) => <ConteudoDoSistema dados={dados} />}
    </PortaoDaHistologia>
  )
}

function ConteudoDoSistema({ dados }: { dados: DadosDoSistemaUnificado }) {
  const { comPatologia, sistema, normais, assuntos, doencas, laminasDoentes, atlas } = dados
  useTituloDaAba(`${sistema.nome} — normal e patológico`)

  return (
    <SuperficieDoCatalogo navegacao={<NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />}>
      <BannerDoCatalogo
        compacto
        sobretitulo="Sistema"
        titulo={sistema.nome}
        texto={sistema.descricao}
        imagem={dados.imagem}
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
  )
}
