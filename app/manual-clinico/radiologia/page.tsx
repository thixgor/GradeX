import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { HomeRadiologia } from '@/components/radiologia/home'
import {
  SECOES,
  TOTAL_CORTES,
  TOTAL_ESTRUTURAS,
  TOTAL_SUBSECOES,
  caminhoDoCorte,
} from '@/lib/tomografia'
import { ESTUDOS_RAIO_X, REGIOES_RAIO_X, TOTAL_ESTRUTURAS_RAIO_X } from '@/lib/radiologia/raio-x'
import { TOTAL_TERRITORIOS_PRANCHAS, resumosPranchas } from '@/lib/radiologia/pranchas'

/**
 * Home do Manual de Radiologia — montada no servidor.
 *
 * Os números e as capas vêm dos módulos de dado do atlas, que somam quase 1 MB
 * de fonte. Enquanto esta rota era um componente de cliente, esse megabyte
 * inteiro entrava no bundle do navegador só para imprimir meia dúzia de
 * contagens. Aqui ele fica do lado do servidor e o cliente recebe HTML.
 */
export default function RadiologiaPage() {
  const primeiraSerie = SECOES[0]?.subsecoes[0]
  const capaTc = primeiraSerie
    ? caminhoDoCorte(primeiraSerie, Math.max(1, Math.round(primeiraSerie.totalCortes / 2)))
    : ''

  // Uma capa por região: a tira de filme mostra a variedade real do acervo em
  // vez de repetir a mesma radiografia de tórax.
  const tira = REGIOES_RAIO_X.map((regiao) => ({
    src: regiao.capa,
    alt: `Radiografia de ${regiao.titulo.toLowerCase()}`,
  }))

  return (
    <AreaRadiologia>
      <HomeRadiologia
        totais={{
          incidencias: ESTUDOS_RAIO_X.length,
          series: TOTAL_SUBSECOES,
          cortes: TOTAL_CORTES,
          estruturas: TOTAL_ESTRUTURAS + TOTAL_ESTRUTURAS_RAIO_X,
        }}
        tira={tira}
        raioX={{
          href: '/manual-clinico/radiologia/raio-x',
          etiqueta: 'Raio-X',
          titulo: 'Atlas radiográfico guiado',
          descricao:
            'Escolha a região, abra a incidência e clique na estrutura para vê-la acender sobre o filme — com o nome em português e o termo anatômico original.',
          capa: REGIOES_RAIO_X[0]?.capa ?? '',
          metricas: [
            { valor: String(REGIOES_RAIO_X.length), rotulo: 'regiões' },
            { valor: String(ESTUDOS_RAIO_X.length), rotulo: 'incidências' },
            { valor: String(TOTAL_ESTRUTURAS_RAIO_X), rotulo: 'demarcações' },
          ],
          itens: [
            'Pranchas de lobos e segmentos pulmonares em PA e perfil, com filme limpo para autoavaliação',
            'Casos clínicos de tórax: a consulta inteira, o filme limpo e a resposta comentada',
            'Quizzes de identificação: a marcação acende e você nomeia, com resposta comentada',
            'Casos e alterações do tórax com filme limpo, marcações e comparação interativa',
            'Dossiê por estrutura: o que é, como identificar, o que avaliar e a armadilha',
            'Técnica, critérios de qualidade e roteiro de leitura de cada região',
            'Filme em negativo, revisão automática e busca em pt-BR ou no termo original',
          ],
          cta: 'Abrir o atlas de Raio-X',
        }}
        tomografia={{
          href: '/manual-clinico/radiologia/tomografia',
          etiqueta: 'Tomografia computadorizada',
          titulo: 'Atlas de TC por cortes',
          descricao:
            'Tórax, abdome e crânio em exames inteiros: role a pilha corte a corte como na estação de trabalho, troque a janela e salte direto para a estrutura.',
          capa: capaTc,
          metricas: [
            { valor: String(SECOES.length), rotulo: 'regiões' },
            { valor: String(TOTAL_SUBSECOES), rotulo: 'séries' },
            { valor: String(TOTAL_CORTES), rotulo: 'cortes' },
          ],
          itens: [
            'Sete janelas para comparar, mais brilho, contraste e inversão',
            'Densidade em unidades Hounsfield, janela ideal e alterações de cada estrutura',
            'Quiz de raciocínio e modo treino: você recebe o nome e procura o corte',
          ],
          cta: 'Abrir as tomografias',
        }}
        atalhosRaioX={REGIOES_RAIO_X.map((regiao) => ({
          href: `/manual-clinico/radiologia/raio-x?regiao=${regiao.id}`,
          titulo: regiao.titulo,
          detalhe: `${regiao.totalEstudos} inc · ${regiao.totalEstruturas} estr`,
        }))}
        // A fita de cores é o que identifica cada prancha de relance; o dossiê
        // dos territórios fica no servidor e só desce na página da figura.
        pranchas={resumosPranchas().map((prancha) => ({
          href: `/manual-clinico/radiologia/pranchas/${prancha.slug}`,
          figura: prancha.figura,
          titulo: prancha.titulo,
          incidencia: prancha.incidencia,
          capa: prancha.imagem,
          alt: prancha.altImagem,
          cores: prancha.amostras.map((amostra) => amostra.cor),
        }))}
        totalTerritoriosPranchas={TOTAL_TERRITORIOS_PRANCHAS}
        atalhosTomografia={SECOES.map((secao) => ({
          href: `/manual-clinico/radiologia/tomografia#secao-${secao.id}`,
          titulo: secao.titulo,
          detalhe: `${secao.subsecoes.length} séries · ${secao.subsecoes.reduce(
            (total, sub) => total + sub.totalCortes,
            0,
          )} cortes`,
        }))}
      />
    </AreaRadiologia>
  )
}
