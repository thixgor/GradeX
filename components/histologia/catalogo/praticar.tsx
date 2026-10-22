'use client'

import { ListChecks, Target } from 'lucide-react'

import { AcaoPrincipal, AcaoSecundaria, BannerDoCatalogo, SuperficieDoCatalogo } from '@/components/histologia/catalogo/banner'
import { CartoesDaFileira } from '@/components/histologia/catalogo/cartao'
import { FileiraDoCatalogo } from '@/components/histologia/catalogo/fileira'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { PortaoDaHistologia } from '@/components/histologia/portao'
import { rotaDosDadosDoCatalogo, type DadosDePraticar } from '@/lib/histologia/paginas-do-catalogo-tipos'
import { BASE } from '@/lib/histologia/rotas'
import { BASE_ZOOM } from '@/lib/histologia-zoom/rotas'

/**
 * Praticar: os quizzes e o laboratório num lugar só. O casco é estático; as
 * fileiras vêm de `/api/manual-clinico/histologia/catalogo/praticar`, depois do
 * portão.
 */
export function Praticar({ comPatologia }: { comPatologia: boolean }) {
  return (
    <PortaoDaHistologia<DadosDePraticar> url={rotaDosDadosDoCatalogo(['praticar'])} superficie="catalogo">
      {(dados) => <Conteudo dados={dados} comPatologia={comPatologia} />}
    </PortaoDaHistologia>
  )
}

function Conteudo({ dados, comPatologia }: { dados: DadosDePraticar; comPatologia: boolean }) {
  const { quizComZoom, totais } = dados

  return (
    <SuperficieDoCatalogo navegacao={<NavegacaoDoModulo histopatologiaHabilitada={comPatologia} />}>
      <BannerDoCatalogo
        compacto
        sobretitulo="Treinar e fixar"
        titulo="Praticar"
        texto={`${totais.quizzes} quizzes com ${totais.questoes} questões sobre lâminas reais, em modo prática ou prova — e o laboratório que explica por que a lâmina tem aquela cara.`}
        imagem={quizComZoom.imagem}
        acoes={
          <>
            <AcaoPrincipal href={quizComZoom.href}>
              <Target className="h-4 w-4" aria-hidden /> Quiz com zoom
            </AcaoPrincipal>
            <AcaoSecundaria href={`${BASE}/quizzes`}>
              <ListChecks className="h-4 w-4" aria-hidden /> Todos os quizzes
            </AcaoSecundaria>
          </>
        }
      />

      <div className="mx-auto max-w-[1600px]">
        <FileiraDoCatalogo
          id="quiz-zoom"
          titulo="Quiz na lâmina inteira"
          subtitulo="A pergunta aponta a estrutura; você a encontra navegando com zoom."
          verTudo={{ href: `${BASE_ZOOM}/quiz`, rotulo: 'Começar' }}
        >
          <CartoesDaFileira itens={[quizComZoom]} mostrarArea={false} prioridade />
        </FileiraDoCatalogo>
        {dados.porTema.length > 0 && (
          <FileiraDoCatalogo
            id="por-tema"
            titulo="Quizzes por tema"
            subtitulo="Escritos a partir das lâminas de cada assunto do curso."
            verTudo={{ href: `${BASE}/quizzes` }}
          >
            <CartoesDaFileira itens={dados.porTema} mostrarArea={false} />
          </FileiraDoCatalogo>
        )}
        <FileiraDoCatalogo
          id="acervo"
          titulo="Quizzes do acervo"
          subtitulo="Os quizzes de identificação do acervo original."
          verTudo={{ href: `${BASE}/quizzes` }}
        >
          <CartoesDaFileira itens={dados.doAcervo} mostrarArea={false} />
        </FileiraDoCatalogo>
        <FileiraDoCatalogo
          id="laboratorio"
          titulo="Laboratório virtual"
          subtitulo="Quase todo erro de identificação é, na verdade, erro de leitura do processamento."
          verTudo={{ href: `${BASE}/laboratorio` }}
        >
          <CartoesDaFileira itens={dados.laboratorios} mostrarArea={false} />
        </FileiraDoCatalogo>
      </div>
    </SuperficieDoCatalogo>
  )
}
