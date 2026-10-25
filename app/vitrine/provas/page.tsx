import type { Metadata } from 'next'
import { AcordeaoDeEtapas } from '@/components/vitrine/acordeao'
import { CascoDaVitrine, enderecosDeConta } from '@/components/vitrine/casco'
import { ChamadaFinal } from '@/components/vitrine/chamada'
import { HeroiDaVitrine } from '@/components/vitrine/heroi'
import { PlacaComAbas } from '@/components/vitrine/placa'
import { RodapeDaVitrine } from '@/components/vitrine/rodape'
import { DEFAULT_OG_IMAGE, absoluteUrl, publicIndexingRobots } from '@/lib/seo'
import { capasDeProvasPublicas, provasGeraisArredondado } from '@/lib/vitrines/dados'
import { AUSCULTA, completarComAtlas } from '@/lib/vitrines/fotos'

const DESCRICAO =
  'Provas antigas da faculdade, simulados com a turma e provas montadas por IA, com cronômetro, gabarito comentado e a sua nota no fim. Crie a conta grátis.'

export const metadata: Metadata = {
  title: 'Provas',
  description: DESCRICAO,
  alternates: { canonical: '/provas' },
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Provas | DomineAqui',
    description: DESCRICAO,
    url: '/provas',
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: 'DomineAqui - Provas' }],
  },
}

/*
 * Estática, regenerada a cada 6 h: as capas e a contagem mudam quando o admin
 * publica prova, não de minuto em minuto. Ver lib/vitrines/dados.ts.
 */
export const revalidate = 21600

/**
 * `/provas` para quem chega SEM conta.
 *
 * Ninguém abre este endereço: o middleware reescreve `/provas` para cá quando
 * não há sessão, e a barra continua mostrando `/provas`. Antes o visitante
 * caía direto no formulário de login, sem ver o que havia do outro lado.
 *
 * O mosaico do topo são as capas das provas gerais mais recentes — a mesma
 * capa que qualquer pessoa logada vê no catálogo. Faltando capas, completam as
 * do Atlas de Anatomia.
 */
export default async function VitrineDasProvas() {
  const [capas, totalDeProvas] = await Promise.all([capasDeProvasPublicas(6), provasGeraisArredondado()])
  const conta = enderecosDeConta('/provas')

  const dasProvas = capas.map((c) => ({ src: c.capa, alt: `Capa da prova ${c.titulo}` }))
  // A célula larga do mosaico pede imagem larga: sem capa de prova, a ausculta.
  const mosaico = completarComAtlas(dasProvas.length > 0 ? dasProvas : [AUSCULTA], 4)
  const placa = completarComAtlas(dasProvas.slice(4).concat(dasProvas.slice(0, 4)).slice(0, 3), 3, 2)

  const apoio = totalDeProvas
    ? `Mais de ${totalDeProvas.toLocaleString('pt-BR')} provas: antigas da faculdade, simulados com a turma e provas montadas por IA, com cronômetro e gabarito comentado.`
    : 'Provas antigas da faculdade, simulados com a turma e provas montadas por IA, com cronômetro, gabarito comentado e a sua nota no fim.'

  return (
    <CascoDaVitrine>
      <HeroiDaVitrine destino="/provas" linhas={['Provas da', 'sua faculdade']} apoio={apoio} fotos={mosaico} />

      <PlacaComAbas
        acoes={conta}
        abas={[
          {
            rotulo: 'Provas antigas',
            titulo: 'O que já caiu, no formato real',
            texto:
              'As provas dos semestres anteriores, organizadas por curso, período e grupo. Você treina com o tempo, o número de questões e o jeito de cobrar da prova de verdade.',
            foto: placa[0],
          },
          {
            rotulo: 'Simulados',
            titulo: 'A turma inteira, no mesmo horário',
            texto:
              'Provas gerais com data marcada: os portões abrem antes, todo mundo começa junto e, quando a prova termina, sai o gabarito e a distribuição das notas da turma.',
            foto: placa[1],
          },
          {
            rotulo: 'Provas pessoais',
            titulo: 'Uma prova só sua, quando quiser',
            texto:
              'Escolha o assunto e a IA monta uma prova para você treinar sozinho, sem data marcada. Ela fica guardada na sua conta, na sua lista de provas.',
            foto: placa[2],
          },
        ]}
      />

      <AcordeaoDeEtapas
        titulo="Do relógio à nota"
        introducao="Toda prova passa pelas mesmas etapas, do portão que abre ao gabarito comentado. E nada se perde no caminho: se a internet cair no meio, as respostas já estão salvas e você continua de onde parou."
        etapas={[
          {
            nome: 'Sala de espera',
            texto:
              'Os portões abrem antes do início. Você entra, confere os dados e espera a largada pelo relógio do servidor, que é o mesmo para a turma toda.',
          },
          {
            nome: 'No tempo',
            texto:
              'Cronômetro na tela, uma questão por página ou todas em rolagem, e as respostas gravadas sozinhas enquanto você responde.',
          },
          {
            nome: 'Entrega',
            texto:
              'Um toque entrega a prova. A nota das objetivas aparece na hora; as discursivas entram quando forem corrigidas.',
          },
          {
            nome: 'Gabarito',
            texto:
              'Quando a prova termina, o gabarito sai com o comentário de cada questão, para você entender o erro e não só contá-lo.',
          },
          {
            nome: 'Desempenho',
            texto:
              'Sua nota ao lado da distribuição da turma e, quando a prova mostra a classificação, a sua posição nela.',
          },
        ]}
      />

      <ChamadaFinal
        titulo="Comece pela próxima prova"
        texto="Crie a conta grátis e abra as provas liberadas para o seu curso e período. Se você já tem conta, entre e volte direto para esta página."
        criar={conta.criar}
        entrar={conta.entrar}
        foto={AUSCULTA}
      />

      <RodapeDaVitrine nota="Provas, banco de questões e materiais para quem estuda na faculdade." />
    </CascoDaVitrine>
  )
}
