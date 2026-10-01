import { ListChecks, Target } from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { AcaoPrincipal, AcaoSecundaria, BannerDoCatalogo, SuperficieDoCatalogo } from '@/components/histologia/catalogo/banner'
import { CartoesDaFileira } from '@/components/histologia/catalogo/cartao'
import { FileiraDoCatalogo } from '@/components/histologia/catalogo/fileira'
import { NavegacaoDoModulo } from '@/components/histologia/navegacao'
import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { laboratoriosDoCatalogo, quizComZoom, quizzesDoCatalogo } from '@/lib/histologia/catalogo'
import { TOTAIS } from '@/lib/histologia/repositorio'
import { BASE, metadadosDoModulo } from '@/lib/histologia/seo'
import { BASE_ZOOM } from '@/lib/histologia-zoom/rotas'
import { histopatologiaHabilitada } from '@/lib/histopatologia/direitos'

/**
 * Praticar — tudo o que testa ou treina, num lugar só.
 *
 * Quizzes, quiz das lâminas com zoom e laboratório eram três abas e um botão
 * escondido no catálogo do zoom. São a mesma intenção ("quero treinar"), então
 * viram uma página com uma fileira por formato. As listagens completas
 * continuam nas rotas de sempre.
 */

export const dynamic = 'force-dynamic'

export const metadata = metadadosDoModulo({
  titulo: 'Praticar',
  descricao: 'Quizzes de identificação com fotomicrografias e lâminas inteiras, e o laboratório virtual de preparação e coloração.',
  caminho: `${BASE}/praticar`,
})

export default async function Praticar() {
  await exigirAcessoAHistologia()
  const { doAcervo, porTema } = quizzesDoCatalogo()
  const quizZoom = quizComZoom()

  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <SuperficieDoCatalogo navegacao={<NavegacaoDoModulo histopatologiaHabilitada={histopatologiaHabilitada()} />}>
        <BannerDoCatalogo
          compacto
          sobretitulo="Treinar e fixar"
          titulo="Praticar"
          texto={`${TOTAIS.quizzes} quizzes com ${TOTAIS.questoes} questões sobre lâminas reais, em modo prática ou prova — e o laboratório que explica por que a lâmina tem aquela cara.`}
          imagem={quizZoom.imagem}
          acoes={
            <>
              <AcaoPrincipal href={quizZoom.href}>
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
            <CartoesDaFileira itens={[quizZoom]} mostrarArea={false} prioridade />
          </FileiraDoCatalogo>
          {porTema.length > 0 && (
            <FileiraDoCatalogo
              id="por-tema"
              titulo="Quizzes por tema"
              subtitulo="Escritos a partir das lâminas de cada assunto do curso."
              verTudo={{ href: `${BASE}/quizzes` }}
            >
              <CartoesDaFileira itens={porTema} mostrarArea={false} />
            </FileiraDoCatalogo>
          )}
          <FileiraDoCatalogo
            id="acervo"
            titulo="Quizzes do acervo"
            subtitulo="Os quizzes de identificação do acervo original."
            verTudo={{ href: `${BASE}/quizzes` }}
          >
            <CartoesDaFileira itens={doAcervo} mostrarArea={false} />
          </FileiraDoCatalogo>
          <FileiraDoCatalogo
            id="laboratorio"
            titulo="Laboratório virtual"
            subtitulo="Quase todo erro de identificação é, na verdade, erro de leitura do processamento."
            verTudo={{ href: `${BASE}/laboratorio` }}
          >
            <CartoesDaFileira itens={laboratoriosDoCatalogo()} mostrarArea={false} />
          </FileiraDoCatalogo>
        </div>
      </SuperficieDoCatalogo>
    </AppShell>
  )
}
