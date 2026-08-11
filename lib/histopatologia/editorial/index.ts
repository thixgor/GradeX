import type { DoencaCanonicaEntrada } from '../esquemas'

import { adenocarcinomaColorretal } from './doencas/adenocarcinoma-colorretal.ts'
import { apendiciteAguda } from './doencas/apendicite-aguda.ts'
import { broncopneumonia } from './doencas/broncopneumonia.ts'
import { carcinomaEscamosoDoColoUterino } from './doencas/carcinoma-escamoso-do-colo-uterino.ts'
import { carcinomaHepatocelular } from './doencas/carcinoma-hepatocelular.ts'
import { carcinomaPapiliferoDaTireoide } from './doencas/carcinoma-papilifero-da-tireoide.ts'
import { coliteIsquemica } from './doencas/colite-isquemica.ts'
import { corioamnioniteAguda } from './doencas/corioamnionite-aguda.ts'
import { doencaCeliaca } from './doencas/doenca-celiaca.ts'
import { doencaDeCrohn } from './doencas/doenca-de-crohn.ts'
import { esofagiteEosinofilica } from './doencas/esofagite-eosinofilica.ts'
import { esteatoseHepatica } from './doencas/esteatose-hepatica.ts'
import { giardiase } from './doencas/giardiase.ts'
import { glioblastoma } from './doencas/glioblastoma.ts'
import { hiperplasiaNodularDaProstata } from './doencas/hiperplasia-nodular-da-prostata.ts'
import { linfomaDeHodgkin } from './doencas/linfoma-de-hodgkin.ts'
import { melanomaCutaneo } from './doencas/melanoma-cutaneo.ts'
import { meningiomaGrau1 } from './doencas/meningioma-grau-1.ts'
import { osteomieliteCronica } from './doencas/osteomielite-cronica.ts'
import { osteossarcoma } from './doencas/osteossarcoma.ts'
import { pericarditeFibrinosa } from './doencas/pericardite-fibrinosa.ts'
import { pielonefriteCronica } from './doencas/pielonefrite-cronica.ts'
import { poliarteriteNodosa } from './doencas/poliarterite-nodosa.ts'
import { seminoma } from './doencas/seminoma.ts'
import { tromboseVenosa } from './doencas/trombose-venosa.ts'
import { tuberculosePulmonar } from './doencas/tuberculose-pulmonar.ts'

/**
 * Mapa editorial de consolidação — a camada que transforma inventário em conteúdo.
 *
 * ## Por que ele existe
 *
 * O catálogo tem 2.917 entradas. Entre elas há doenças, mas há também variantes,
 * técnicas de coloração ("tricrômico de Masson", 2.507 mídias), recortes
 * anatômicos, casos individuais e até itens de navegação da página de origem
 * ("this page in english", 2.269 mídias). Promover essas entradas a doenças
 * canônicas automaticamente produziria 2.917 capítulos científicos falsos.
 *
 * Este arquivo é o único caminho pelo qual uma entrada catalogada vira doença. O
 * que ele permite fazer, deliberadamente:
 *
 * - **juntar sinônimos e grafias** — várias entradas no mesmo `catalogoIds`;
 * - **corrigir a classificação** — `sistemaId` próprio, sem tocar no dado de origem;
 * - **marcar item como técnica ou caso** — simplesmente não referenciá-lo;
 * - **agregar fontes diferentes** — Unicamp e Histopathology Atlas na mesma doença;
 * - **escolher a mídia principal e sua ordem didática** — `midiasPrincipais`;
 * - **bloquear uma mídia específica** — `midiasBloqueadas`, com motivo obrigatório;
 * - **registrar referências e estado de revisão** — `conteudo.referencias` e `revisao`.
 *
 * ## O que ele deliberadamente não faz
 *
 * Não tenta promover automaticamente todo o catálogo. O núcleo inicial de seis
 * doenças foi ampliado para vinte e seis capítulos aprofundados, cobrindo também
 * enteropatias, doenças pulmonares e vasculares, infecção óssea e neoplasias
 * endócrina, cutânea, óssea, meníngea e germinativa.
 * A curadoria do restante é incremental:
 * acrescentar uma doença é acrescentar um arquivo aqui e rodar o pipeline.
 *
 * ## Versionamento
 *
 * `VERSAO_DO_MAPA` é gravada no relatório do pipeline. Ela muda sempre que a
 * consolidação muda de forma que altere as rotas ou o vínculo entre doença e
 * entradas catalogadas — é o que permite auditar por que um derivado mudou.
 */
export const VERSAO_DO_MAPA = 5

export const DOENCAS: DoencaCanonicaEntrada[] = [
  apendiciteAguda,
  doencaCeliaca,
  doencaDeCrohn,
  coliteIsquemica,
  giardiase,
  esofagiteEosinofilica,
  broncopneumonia,
  tuberculosePulmonar,
  tromboseVenosa,
  poliarteriteNodosa,
  pericarditeFibrinosa,
  esteatoseHepatica,
  pielonefriteCronica,
  hiperplasiaNodularDaProstata,
  seminoma,
  adenocarcinomaColorretal,
  carcinomaHepatocelular,
  carcinomaPapiliferoDaTireoide,
  melanomaCutaneo,
  osteossarcoma,
  osteomieliteCronica,
  glioblastoma,
  meningiomaGrau1,
  linfomaDeHodgkin,
  carcinomaEscamosoDoColoUterino,
  corioamnioniteAguda,
]

/**
 * Entradas catalogadas que a edição examinou e **decidiu não** promover a doença.
 *
 * Registrar a decisão importa tanto quanto registrar a promoção: sem isto, quem
 * revisar o catálogo depois não distingue "ainda não olhamos" de "olhamos e
 * concluímos que não é uma entidade nosológica". As entradas continuam
 * inteiramente visíveis e pesquisáveis no atlas de inventário.
 */
export const ENTRADAS_NAO_NOSOLOGICAS: Array<{ catalogoId: string; motivo: string }> = [
  {
    catalogoId: 'unicamp-this-page-in-english-a9b7176e2e',
    motivo: 'Item de navegação da página de origem, não é entidade nosológica.',
  },
  {
    catalogoId: 'unicamp-esta-pagina-versao-original-53ea39154b',
    motivo: 'Item de navegação da página de origem, não é entidade nosológica.',
  },
  {
    catalogoId: 'unicamp-imunohistoquimica-4220fa51a3',
    motivo: 'Técnica laboratorial usada como agrupador de páginas, não é doença.',
  },
  {
    catalogoId: 'unicamp-tricromico-de-masson-bc59ce6ccb',
    motivo: 'Coloração especial usada como agrupador de páginas, não é doença.',
  },
  {
    catalogoId: 'unicamp-vimentina-9934107897',
    motivo: 'Marcador imuno-histoquímico usado como agrupador, não é doença.',
  },
  {
    catalogoId: 'unicamp-ressonancia-magnetica-79c1ba76ff',
    motivo: 'Modalidade de imagem usada como agrupador, não é doença.',
  },
  {
    catalogoId: 'unicamp-lamina-deste-assunto-714f9c33ed',
    motivo: 'Rótulo de navegação entre páginas do atlas de origem.',
  },
  {
    catalogoId: 'unicamp-neuroimagem-1fc33baace',
    motivo: 'Agrupador temático amplo (5.369 mídias), não corresponde a uma entidade.',
  },
  {
    catalogoId: 'unicamp-neuropatologia-cc7fdcf258',
    motivo: 'Agrupador temático amplo (5.295 mídias), não corresponde a uma entidade.',
  },
  {
    catalogoId: 'unicamp-neuropathology-case-studies-65bafd7c53',
    motivo: 'Coletânea de casos, não é entidade nosológica única.',
  },
]

/** Índice reverso: qual doença consolidou determinada entrada catalogada. */
export function doencaDaEntrada(catalogoId: string): DoencaCanonicaEntrada | undefined {
  return DOENCAS.find((d) => d.catalogoIds?.includes(catalogoId))
}

/**
 * Vínculos normal → patológico, derivados e não digitados duas vezes.
 *
 * O plano pede ligação bidirecional (§12). O sentido doença → normal já está em
 * `conteudo.histologiaNormalDeReferencia`; derivar daí o sentido inverso é o que
 * garante que os dois nunca discordem. Um segundo mapa, mantido à mão, ficaria
 * desatualizado na primeira doença nova — e a página de histologia normal
 * passaria a listar doenças que não a citam.
 */
export function vinculosPorRotaNormal(): Map<string, Array<{ slug: string; nome: string }>> {
  const mapa = new Map<string, Array<{ slug: string; nome: string }>>()
  for (const doenca of DOENCAS) {
    for (const ref of doenca.conteudo.histologiaNormalDeReferencia ?? []) {
      const chave = ref.caminhoNormal.join('/')
      const lista = mapa.get(chave) ?? []
      if (!lista.some((d) => d.slug === doenca.slug)) {
        lista.push({ slug: doenca.slug, nome: doenca.nome })
      }
      mapa.set(chave, lista)
    }
  }
  return mapa
}
