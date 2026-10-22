'use client'

import { useSearchParams } from 'next/navigation'
import { preload } from 'react-dom'

import { DoencasRelacionadas } from '@/components/histopatologia/doencas-relacionadas'
import { Lamina } from '@/components/histologia/lamina'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { SecaoDoCurriculo } from '@/components/histologia/secao'
import { DadosEstruturados, useTituloDaAba } from '@/components/histologia/pagina'
import { rotaDosDadosDoCurriculo, type DadosDaPaginaDoCurriculo } from '@/lib/histologia/curriculo-tipos'

/**
 * Uma das 1.524 páginas do currículo — lâmina ou nó de índice.
 *
 * O casco (`app/manual-clinico/histologia/[...slug]/page.tsx`) é estático; o
 * conteúdo vem da rota de dados do currículo, depois do portão. O desenho é o
 * da página de servidor de antes, componente por componente.
 */
export function PaginaDoCurriculo({ caminho }: { caminho: string[] }) {
  return (
    <PortaoDaHistologia<DadosDaPaginaDoCurriculo> url={rotaDosDadosDoCurriculo(caminho)}>
      {(dados) => <ConteudoDoCurriculo dados={dados} />}
    </PortaoDaHistologia>
  )
}

function ConteudoDoCurriculo({ dados }: { dados: DadosDaPaginaDoCurriculo }) {
  useTituloDaAba(dados.titulo)
  /*
   * `?estrutura=<id>` vem da busca por estrutura: abre a lâmina com a camada
   * correta já ligada e o dossiê aberto. Não prometemos centralizar o campo no
   * marcador — o acervo não fornece a geometria dele, e fingir um enquadramento
   * levaria o aluno ao lugar errado com ar de precisão.
   */
  const estrutura = useSearchParams()?.get('estrutura') ?? undefined

  if (dados.tipo === 'secao') {
    return (
      <div className="surface-page min-h-screen">
        <NavegacaoDoModulo histopatologiaHabilitada={dados.comPatologia} />
        <SecaoDoCurriculo pagina={dados.pagina} filhos={dados.filhos} miniaturas={dados.miniaturas} resumo={dados.resumo} />
        <DoencasRelacionadas doencas={dados.relacionadas} />
        <DadosEstruturados dados={dados.jsonLd} />
      </div>
    )
  }

  /*
   * Pré-carregamento da lâmina.
   *
   * O microscópio é `ssr: false` — ele precisa de `ResizeObserver` e das
   * dimensões naturais da imagem, que só existem no navegador. Sem isto, a
   * busca da imagem só começava depois de o chunk do microscópio chegar e o
   * componente montar: uma corrente em série, e o aluno olhando para um
   * retângulo cinza. Pedida aqui, assim que os dados chegam, a imagem vem **em
   * paralelo** com o chunk, e a prévia já está no cache quando o microscópio
   * monta.
   */
  if (dados.prePrevia) preload(dados.prePrevia, { as: 'image', fetchPriority: 'high' })
  if (dados.preLamina) preload(dados.preLamina, { as: 'image' })

  return (
    <div className="surface-page min-h-screen">
      <NavegacaoDoModulo histopatologiaHabilitada={dados.comPatologia} visto={dados.visto} />
      <Lamina
        pagina={dados.pagina}
        descricaoPropria={dados.descricaoPropria}
        vizinhas={dados.vizinhas}
        bandeja={dados.bandeja}
        quizzes={dados.quizzes}
        estruturaInicial={
          // Só aceitamos o parâmetro se ele nomear uma camada que existe nesta
          // lâmina. Vindo da URL, é entrada não confiável.
          dados.pagina.overlays.some((o) => o.id === estrutura) ? estrutura : undefined
        }
      />
      <DoencasRelacionadas doencas={dados.relacionadas} />
      <DadosEstruturados dados={dados.jsonLd} />
    </div>
  )
}
