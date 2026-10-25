import type { Metadata } from 'next'
import { AcordeaoDeEtapas } from '@/components/vitrine/acordeao'
import { CascoDaVitrine, enderecosDeConta } from '@/components/vitrine/casco'
import { CatalogoDoBanco } from '@/components/vitrine/catalogo'
import { ChamadaFinal } from '@/components/vitrine/chamada'
import { HeroiDaVitrine } from '@/components/vitrine/heroi'
import { PlacaComAbas } from '@/components/vitrine/placa'
import { RodapeDaVitrine } from '@/components/vitrine/rodape'
import { ACERVO_SEM_NUMERO, rotuloDoAcervo } from '@/lib/banco/acervo-publico'
import { LIMITE_GRATUITO } from '@/lib/banco/gratuito'
import { DEFAULT_OG_IMAGE, absoluteUrl, publicIndexingRobots } from '@/lib/seo'
import { acervoDoBancoArredondado, catalogoPublicoDoBanco } from '@/lib/vitrines/dados'
import { AUSCULTA, CAPAS_DO_ATLAS } from '@/lib/vitrines/fotos'

const DESCRICAO =
  'Questões de prova da faculdade separadas por módulo, tópico e semestre, cada uma com a resposta comentada. Crie a conta grátis e escolha as questões que quer abrir.'

export const metadata: Metadata = {
  title: 'Banco de Questões',
  description: DESCRICAO,
  alternates: { canonical: '/banco-questoes' },
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Banco de Questões | DomineAqui',
    description: DESCRICAO,
    url: '/banco-questoes',
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: 'DomineAqui - Banco de Questões' }],
  },
}

/* Estática, regenerada a cada 6 h — o catálogo muda quando o admin importa. */
export const revalidate = 21600

/**
 * `/banco-questoes` para quem chega SEM conta — o middleware reescreve para
 * cá, e a barra continua mostrando `/banco-questoes`.
 *
 * O catálogo mostrado é exatamente o que a conta gratuita vê na tela do Banco
 * (módulos, tópicos e contagens, enunciado nenhum), sem os nós ocultos ou
 * restritos a cargo. Ver `catalogoPublicoDoBanco`.
 */
export default async function VitrineDoBanco() {
  const [acervo, modulos] = await Promise.all([acervoDoBancoArredondado(), catalogoPublicoDoBanco()])
  const conta = enderecosDeConta('/banco-questoes')
  const rotulo = rotuloDoAcervo(acervo)

  const apoio = `${rotulo ?? ACERVO_SEM_NUMERO} de prova da faculdade, separadas por módulo, tópico e semestre, cada uma com a resposta comentada.`
  const [nervoso, , respiratorio, esqueletico, digestorio, muscular, urinario] = CAPAS_DO_ATLAS

  return (
    <CascoDaVitrine>
      <HeroiDaVitrine
        destino="/banco-questoes"
        linhas={['Banco de', 'questões']}
        apoio={apoio}
        fotos={[AUSCULTA, nervoso, respiratorio, esqueletico]}
      />

      <PlacaComAbas
        acoes={conta}
        abas={[
          {
            rotulo: 'Recorte',
            titulo: 'Só o assunto da sua prova',
            texto:
              'Módulo, tópico, subtópico, semestre, dificuldade: o catálogo inteiro fica aberto, com quantas questões cada ramo tem antes do clique.',
            foto: digestorio,
          },
          {
            rotulo: 'Comentário',
            titulo: 'O porquê de cada resposta',
            texto:
              'Respondeu, conferiu. Cada questão traz a resposta comentada, para você saber por que errou e por que as outras alternativas não servem.',
            foto: muscular,
          },
          {
            rotulo: 'Grátis',
            titulo: `${LIMITE_GRATUITO} questões por sua conta`,
            texto: `Com a conta gratuita você escolhe ${LIMITE_GRATUITO} questões para abrir, com a resposta comentada, e elas ficam liberadas para sempre. Sem sorteio: você abre as do assunto que quer testar.`,
            foto: urinario,
          },
        ]}
      />

      <CatalogoDoBanco modulos={modulos} criarConta={conta.criar} />

      <AcordeaoDeEtapas
        titulo="Do recorte ao seu ponto fraco"
        introducao="O Banco foi feito para a semana da prova: escolher o assunto, responder, entender o erro e voltar onde ainda dói. Tudo o que você responde fica guardado."
        etapas={[
          {
            nome: 'Recorte',
            texto: 'Marque módulos, tópicos e semestres na árvore. As pastilhas do filtro ficam à vista enquanto você rola a lista.',
          },
          {
            nome: 'Resposta',
            texto: 'Responda e veja na hora se acertou, com o comentário da questão logo abaixo.',
          },
          {
            nome: 'Listas',
            texto: 'Monte listas com o recorte que quiser e refaça quando precisar, inclusive em sorteio.',
          },
          {
            nome: 'Histórico',
            texto: 'Cada resposta fica registrada, com a data e o acerto, para você revisar o que já fez.',
          },
          {
            nome: 'Desempenho',
            texto: 'O painel de desempenho mostra onde você mais erra, recorte por recorte, ao lado da lista de questões.',
          },
        ]}
      />

      <ChamadaFinal
        titulo="Abra as primeiras questões"
        texto={`Crie a conta grátis e escolha ${LIMITE_GRATUITO} questões para abrir, com a resposta comentada. Quer ver antes? A amostra tem 10 questões comentadas, sem conta.`}
        criar={conta.criar}
        entrar={conta.entrar}
        foto={AUSCULTA}
      />

      <RodapeDaVitrine nota="Provas, banco de questões e materiais para quem estuda na faculdade." />
    </CascoDaVitrine>
  )
}
