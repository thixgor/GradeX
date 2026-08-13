import 'server-only'

import { MODULOS_DE_LABORATORIO } from './laboratorio'
import { LARGURA_LAMINA, LARGURA_PREVIA, urlDaMidia, urlOtimizada } from './midia'
import { CURRICULO, TOTAIS, obterFragmento, obterPagina } from './repositorio'
import { TOTAIS as TOTAIS_HISTOPATOLOGIA } from '@/lib/histopatologia/repositorio'
import type { NoCurriculo } from './esquemas'
import type {
  AmostraDaVitrine,
  CamadaDaAmostra,
  DadosDaVitrine,
  SetorDaVitrine,
} from './vitrine-tipos'

/**
 * Dados da landing de vendas do Manual da Histologia.
 *
 * ## A regra que orienta o que sai daqui
 *
 * A vitrine é vista por quem **não** assina. Então ela recebe números, títulos,
 * quatro capas de setor e **uma** lâmina — nunca o acervo. Uma entre 1.320 é
 * amostra; qualquer coisa além disso seria entregar o produto na porta.
 *
 * A amostra vai completa de propósito: a lâmina, os rótulos e as camadas de
 * marcação que se acendem sobre a imagem. É o argumento mais honesto que esta
 * página pode ter — em vez de descrever o microscópio, ela deixa usar. Quem
 * chega acende as estruturas dessa lâmina e decide sabendo o que compra.
 *
 * Montado no servidor porque é aqui que os fragmentos do currículo vivem: o
 * `import()` de um fragmento traz centenas de lâminas, e nada disso pode ir
 * parar no bundle de quem ainda está decidindo.
 */

/**
 * A lâmina da amostra, por ordem de preferência.
 *
 * A escolhida é o corte sagital do lábio: uma **fotomicrografia de verdade**,
 * não um esquema. Numa só imagem convivem pele com folículo piloso, zona do
 * vermelhão, mucosa oral, glândulas labiais e o orbicular da boca — seis
 * estruturas que o aluno acende uma a uma e vê a transição acontecer. Vale mais
 * numa landing do que qualquer adjetivo sobre "microscópio interativo", e evita
 * o erro de abrir a venda com um desenho: metade das "visões gerais" do acervo
 * é ilustração, e ilustração não prova que existe lâmina do outro lado.
 *
 * As seguintes são planos B, para o caso de uma reingestão mudar o caminho da
 * primeira. Uma landing sem amostra perde seu melhor argumento, e um caminho
 * literal quebrado é silencioso.
 */
const ROTAS_DE_AMOSTRA = [
  ['orgaos-e-sistemas', 'sistema-digestorio', 'oral-cavity', 'lip', 'lip-1'],
  ['tecidos', 'tecido-conjuntivo', 'bone', 'as-an-organ', 'as-an-organ-11a'],
  ['orgaos-e-sistemas', 'pele', 'visao-geral', 'skin-overview-1'],
  ['histologia-basica', 'preparacao-do-tecido', 'tissue-preparation-1'],
]

/** Quantas camadas de marcação a amostra entrega. Seis cabem na tela e bastam. */
const MAXIMO_DE_CAMADAS = 6

/** Abaixo disto a amostra não demonstra nada: uma seta sobre uma foto. */
const MINIMO_DE_CAMADAS = 3

export type {
  AmostraDaVitrine,
  CamadaDaAmostra,
  DadosDaVitrine,
  SetorDaVitrine,
} from './vitrine-tipos'

export async function montarVitrine(): Promise<DadosDaVitrine> {
  const [amostra, setores] = await Promise.all([montarAmostra(), montarSetores(CURRICULO)])

  return {
    amostra,
    setores,
    totais: {
      laminas: TOTAIS.laminas,
      estruturas: TOTAIS.estruturas,
      setores: TOTAIS.setores,
      subsetores: TOTAIS.subsetores,
      quizzes: TOTAIS.quizzes,
      questoes: TOTAIS.questoes,
      laboratorios: MODULOS_DE_LABORATORIO.length,
      doencas: TOTAIS_HISTOPATOLOGIA.doencas,
      capitulosVisuais: TOTAIS_HISTOPATOLOGIA.capitulosVisuais,
      sistemasPatologicos: TOTAIS_HISTOPATOLOGIA.sistemas,
    },
  }
}

async function montarAmostra(): Promise<AmostraDaVitrine | null> {
  for (const rota of ROTAS_DE_AMOSTRA) {
    const amostra = await amostraDaRota(rota)
    if (amostra) return amostra
  }
  return null
}

async function amostraDaRota(rota: string[]): Promise<AmostraDaVitrine | null> {
  const pagina = await obterPagina(rota)
  if (!pagina?.base) return null

  const url = urlOtimizada(urlDaMidia(pagina.base), LARGURA_LAMINA)
  if (!url) return null

  // Só `classe: 'estrutura'`. As camadas de crédito e navegação do acervo
  // ("Next image", "Area shown in next image") não são estrutura nenhuma, e
  // oferecê-las como se fossem ensinaria errado logo na amostra.
  const camadas: CamadaDaAmostra[] = []
  for (const overlay of pagina.overlays) {
    if (overlay.classe !== 'estrutura') continue
    if (camadas.length >= MAXIMO_DE_CAMADAS) break
    // Os overlays são PNG de ~19 KB e ficam na origem, sem otimizador — é a
    // mesma decisão que o microscópio toma, pelo mesmo motivo.
    const urlDaCamada = urlDaMidia(overlay.midia)
    if (!urlDaCamada) continue
    camadas.push({
      id: overlay.id,
      rotulo: overlay.rotulo,
      traduzido: overlay.traduzido,
      explicacao: overlay.explicacao ?? null,
      url: urlDaCamada,
    })
  }

  if (camadas.length < MINIMO_DE_CAMADAS) return null

  return {
    titulo: pagina.titulo,
    trilha: pagina.trilha.map((no) => no.titulo).join(' · '),
    url,
    alt: pagina.base.alt,
    coloracoes: pagina.coloracoes,
    camadas,
  }
}

/**
 * Capa de cada setor: a primeira lâmina com imagem do primeiro ramo que tem
 * lâminas — mesma regra da home do módulo, para a vitrine mostrar exatamente o
 * que o assinante encontra do outro lado.
 */
async function montarSetores(setores: NoCurriculo[]): Promise<SetorDaVitrine[]> {
  return Promise.all(
    setores.map(async (setor): Promise<SetorDaVitrine> => {
      const ramo = setor.filhos.find((filho) => filho.laminas > 0)
      const paginas = ramo ? await obterFragmento(ramo.caminho) : []
      const comImagem = paginas.find((pagina) => pagina.base)
      return {
        slug: setor.slug,
        titulo: setor.titulo,
        laminas: setor.laminas,
        estruturas: setor.estruturas,
        capa: comImagem?.base
          ? urlOtimizada(urlDaMidia(comImagem.base), LARGURA_PREVIA, 60)
          : null,
      }
    }),
  )
}
