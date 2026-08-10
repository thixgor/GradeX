import type { Sistema } from '../esquemas'

/**
 * Taxonomia de sistemas da Histopatologia.
 *
 * Duas coisas convivem aqui e não devem ser confundidas:
 *
 * - `id` e `nome` são **nossos**, estáveis, e são o que aparece na URL;
 * - `sistemasCatalogados` lista os valores literais do campo `sistemaCatalogado`
 *   do acervo, que foram gerados por classificação automatizada durante a
 *   coleta. Eles não são corrigidos no arquivo-fonte: o catálogo é imutável para
 *   a ingestão. A correção acontece por mapeamento, aqui, e a proveniência
 *   original continua legível na página de inventário.
 *
 * `nao-classificado` continua sendo o id técnico estável. Na interface ele é
 * apresentado como trabalho em organização editorial, sem transformar uma
 * limitação da coleta no nome de um capítulo para o aluno.
 */
export const SISTEMAS: Sistema[] = [
  {
    id: 'patologia-geral',
    nome: 'Patologia geral',
    sistemasCatalogados: ['Patologia geral'],
    descricao:
      'Processos que atravessam todos os órgãos: lesão e morte celular, inflamação, distúrbios ' +
      'hemodinâmicos, reparo e as bases da neoplasia. É o vocabulário que as demais páginas usam.',
  },
  {
    id: 'cardiovascular',
    nome: 'Cardiovascular',
    sistemasCatalogados: ['Cardiovascular'],
    descricao:
      'Coração, artérias, veias e microcirculação: aterosclerose, trombose, embolia, isquemia e ' +
      'as consequências morfológicas da perda de perfusão.',
    caminhoNormal: ['orgaos-e-sistemas', 'sistema-cardiovascular'],
  },
  {
    id: 'respiratorio',
    nome: 'Respiratório, cabeça e pescoço',
    sistemasCatalogados: ['Respiratório / cabeça e pescoço'],
    descricao:
      'Vias aéreas, parênquima pulmonar e pleura: inflamação aguda e crônica, doenças ' +
      'granulomatosas, pneumoconioses e neoplasias.',
    caminhoNormal: ['orgaos-e-sistemas', 'sistema-respiratorio'],
  },
  {
    id: 'gastrointestinal',
    nome: 'Gastrointestinal',
    sistemasCatalogados: ['Gastrointestinal'],
    descricao:
      'Do esôfago ao ânus: inflamação mucosa, infecção, sequência metaplasia–displasia–carcinoma ' +
      'e a leitura das camadas da parede.',
    caminhoNormal: ['orgaos-e-sistemas', 'sistema-digestorio'],
  },
  {
    id: 'hepatobiliopancreatico',
    nome: 'Hepatobiliopancreático',
    sistemasCatalogados: ['Hepatobiliopancreático'],
    descricao:
      'Fígado, vias biliares e pâncreas: acúmulos intracelulares, colestase, hepatite, fibrose ' +
      'progressiva e cirrose.',
    caminhoNormal: ['orgaos-e-sistemas', 'sistema-digestorio'],
  },
  {
    id: 'urinario-genital-masculino',
    nome: 'Urinário e genital masculino',
    sistemasCatalogados: ['Urinário e genital masculino'],
    descricao:
      'Rim, vias urinárias, próstata e testículo: glomerulopatias, nefropatias tubulointersticiais, ' +
      'hiperplasia e neoplasias.',
    caminhoNormal: ['orgaos-e-sistemas', 'sistema-urinario'],
  },
  {
    id: 'ginecologico-placenta',
    nome: 'Ginecológico e placenta',
    sistemasCatalogados: ['Ginecológico / placenta'],
    descricao:
      'Colo, corpo uterino, ovário, tuba e placenta: lesões precursoras, endometriopatias e ' +
      'patologia gestacional.',
    caminhoNormal: ['orgaos-e-sistemas', 'sistema-reprodutor'],
  },
  {
    id: 'mama',
    nome: 'Mama',
    sistemasCatalogados: ['Mama'],
    descricao:
      'Alterações fibrocísticas, lesões proliferativas com e sem atipia, carcinoma in situ e ' +
      'invasor.',
  },
  {
    id: 'endocrino',
    nome: 'Endócrino',
    sistemasCatalogados: ['Endócrino'],
    descricao:
      'Tireoide, paratireoides, suprarrenal, hipófise e ilhotas: hiperplasia, adenoma, tireoidites ' +
      'e carcinomas.',
    caminhoNormal: ['orgaos-e-sistemas', 'sistema-endocrino'],
  },
  {
    id: 'pele',
    nome: 'Pele',
    sistemasCatalogados: ['Pele'],
    descricao:
      'Padrões inflamatórios dermatológicos, lesões melanocíticas e neoplasias epiteliais ' +
      'cutâneas.',
    caminhoNormal: ['orgaos-e-sistemas', 'pele'],
  },
  {
    id: 'sistema-nervoso',
    nome: 'Sistema nervoso',
    sistemasCatalogados: ['Sistema nervoso'],
    descricao:
      'Encéfalo, medula, meninges e nervos: isquemia, infecção, doenças desmielinizantes, ' +
      'malformações do desenvolvimento cortical e neoplasias.',
    caminhoNormal: ['tecidos', 'tecido-nervoso'],
  },
  {
    id: 'hematolinfoide',
    nome: 'Hematolinfoide',
    sistemasCatalogados: ['Hematolinfoide'],
    descricao:
      'Linfonodo, baço, timo e medula óssea: hiperplasias reativas, linfomas e infiltrações.',
    caminhoNormal: ['orgaos-e-sistemas', 'sistema-linfoide'],
  },
  {
    id: 'ossos-partes-moles',
    nome: 'Ossos e partes moles',
    sistemasCatalogados: ['Ossos e partes moles'],
    descricao:
      'Osso, cartilagem, músculo esquelético e tecidos moles: lesões reparadoras, displasias e ' +
      'neoplasias mesenquimais.',
    caminhoNormal: ['tecidos', 'tecido-conjuntivo'],
  },
  {
    id: 'nao-classificado',
    nome: 'Em organização editorial',
    sistemasCatalogados: ['Não classificado'],
    descricao:
      'Coleções transversais e registros que ainda estão sendo distribuídos entre os sistemas. ' +
      'Todos permanecem pesquisáveis e abrem normalmente como capítulos visuais.',
  },
]

const POR_CATALOGADO = new Map<string, string>()
for (const sistema of SISTEMAS) {
  for (const catalogado of sistema.sistemasCatalogados) POR_CATALOGADO.set(catalogado, sistema.id)
}

/**
 * Traduz o `sistemaCatalogado` bruto para um `sistemaId`. Valor desconhecido cai
 * em `nao-classificado` em vez de criar um sistema fantasma — se o catálogo
 * ganhar uma categoria nova, o teste de cobertura acusa antes de a interface
 * inventar uma seção.
 */
export function sistemaIdDoCatalogado(sistemaCatalogado: string): string {
  return POR_CATALOGADO.get(sistemaCatalogado) ?? 'nao-classificado'
}

export function obterSistema(id: string): Sistema | undefined {
  return SISTEMAS.find((s) => s.id === id)
}
