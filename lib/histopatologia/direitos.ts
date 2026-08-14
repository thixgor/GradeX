import { histologiaHabilitada } from '../histologia/licenca'

import type { EscopoDeDireitos, EstadoDeDireitos, Fonte, FonteId } from './esquemas'

/** Registro de fontes e permissões de exibição remota da Histopatologia. */

export const FONTES: Record<FonteId, Fonte> = {
  unicamp: {
    id: 'unicamp',
    nome: 'Atlas de Anatomia Patológica da Unicamp',
    url: 'https://anatpat.unicamp.br/',
    creditoCurto: 'Atlas de Anatomia Patológica — FCM/Unicamp',
    atribuicaoCatalogada:
      'Atlas de Anatomia Patológica da Faculdade de Ciências Médicas da Unicamp; ' +
      'consulte os créditos da página original.',
    /**
     * Allowlist de hosts de mídia.
     *
     * O catálogo carrega, junto das lâminas, os selos e contadores de visita das
     * páginas de origem: `geoloc12.geovisite.ovh`, `mapmyvisitors.com`,
     * `img.shields.io`, `tools.applemediaservices.com`. São 20 URLs que não são
     * lâmina nenhuma, e várias delas são pixels de rastreamento de terceiros —
     * renderizá-las exporia o aluno a um serviço de analytics alheio. A
     * allowlist não é formalidade: é o filtro que impede isso.
     */
    dominiosDeMidia: ['anatpat.unicamp.br'],
    situacaoDeDireitos: 'direitos-aprovados',
    politicaInicial: 'Exibição remota autorizada, com crédito e vínculo para a fonte.',
  },
  'histopathology-atlas': {
    id: 'histopathology-atlas',
    nome: 'Histopathology Atlas',
    url: 'https://www.histopathologyatlas.com/',
    doi: '10.17605/OSF.IO/6W5K8',
    creditoCurto: 'Histopathology Atlas / patolojiAI',
    atribuicaoCatalogada:
      'Histopathology Atlas / patolojiAI — Serdar Balcı, Memorial Pathology e instituições ' +
      'colaboradoras, conforme a página original.',
    dominiosDeMidia: [
      'histopathologyatlas.com',
      'www.histopathologyatlas.com',
      'images.patolojiatlasi.com',
    ],
    situacaoDeDireitos: 'direitos-aprovados',
    politicaInicial: 'Exibição remota autorizada, com crédito e vínculo para a fonte.',
  },
  'pathology-outlines': {
    id: 'pathology-outlines',
    nome: 'Pathology Outlines',
    url: 'https://www.pathologyoutlines.com/',
    creditoCurto: 'Pathology Outlines',
    atribuicaoCatalogada:
      'PathologyOutlines.com, Inc. — consulta externa vinculada; nenhum texto, imagem ou banco de dados é reproduzido pelo Domine Aqui.',
    dominiosDeMidia: ['www.pathologyoutlines.com', 'pathologyoutlines.com'],
    situacaoDeDireitos: 'Somente consulta externa',
    politicaInicial:
      'A política permite hiperlinks, mas exige autorização específica para reprodução em outro site e proíbe extração automatizada.',
  },
  webpathology: {
    id: 'webpathology',
    nome: 'WebPathology',
    url: 'https://www.webpathology.com/',
    creditoCurto: 'WebPathology',
    atribuicaoCatalogada:
      'WebPathology, LLC / Dharam M. Ramnani, MD — páginas visuais consultadas por hiperlink em tela cheia.',
    dominiosDeMidia: ['www.webpathology.com', 'webpathology.com'],
    situacaoDeDireitos: 'Somente consulta externa',
    politicaInicial:
      'A fonte permite links, mas veda copiar, republicar, enquadrar ou exibir seus materiais sem autorização escrita.',
  },
  'webpath-utah': {
    id: 'webpath-utah',
    nome: 'WebPath — University of Utah',
    url: 'https://webpath.med.utah.edu/',
    creditoCurto: 'WebPath® — © 1994–2026 Edward C. Klatt, M.D. All rights reserved.',
    atribuicaoCatalogada:
      'WebPath® — © 1994–2026 Edward C. Klatt, M.D. All rights reserved.',
    dominiosDeMidia: ['webpath.med.utah.edu'],
    situacaoDeDireitos: 'Direitos aprovados para o Domine Aqui',
    politicaInicial:
      'Autorização escrita para exibir, hospedar por referência remota e incorporar imagens no Domine Aqui, com visualizador interno e ampliação.',
  },
}

export const LISTA_DE_FONTES: Fonte[] = [
  FONTES.unicamp,
  FONTES['histopathology-atlas'],
  FONTES['pathology-outlines'],
  FONTES.webpathology,
  FONTES['webpath-utah'],
]

/** Permissões e limitações registradas para todas as fontes catalogadas. */
export const ESCOPOS_DE_DIREITOS: EscopoDeDireitos[] = [
  {
    id: 'unicamp-fonte',
    fonteId: 'unicamp',
    escopo: 'fonte',
    alvo: 'unicamp',
    estado: 'autorizado-incorporacao',
    titular: 'Faculdade de Ciências Médicas da Universidade Estadual de Campinas',
    licenca: 'Autorização direta para exibição no Domine Aqui',
    comprovante: null,
    verificadoEm: '2026-08-09',
    responsavel: 'Equipe editorial do Domine Aqui',
    restricoes: [],
    observacao: 'Exibição remota autorizada pelo Atlas de Anatomia Patológica da FCM/Unicamp.',
  },
  {
    id: 'histopathology-atlas-fonte',
    fonteId: 'histopathology-atlas',
    escopo: 'fonte',
    alvo: 'histopathology-atlas',
    estado: 'autorizado-incorporacao',
    titular: 'Serdar Balcı / Histopathology Atlas — patolojiAI',
    licenca: 'Direitos de exibição aprovados para o Domine Aqui',
    comprovante: 'https://doi.org/10.17605/OSF.IO/6W5K8',
    verificadoEm: '2026-08-09',
    responsavel: 'Equipe editorial do Domine Aqui',
    restricoes: [],
    observacao: 'Exibição remota aprovada, mantendo crédito e vínculo para a fonte.',
  },
  {
    id: 'pathology-outlines-fonte',
    fonteId: 'pathology-outlines',
    escopo: 'fonte',
    alvo: 'pathology-outlines',
    estado: 'autorizado-link-remoto',
    titular: 'PathologyOutlines.com, Inc.',
    licenca: 'Hiperlinks permitidos; reprodução e processamento automatizado não autorizados',
    comprovante: 'https://www.pathologyoutlines.com/copyrightinfo.html',
    verificadoEm: '2026-08-10',
    responsavel: 'Equipe editorial do Domine Aqui',
    restricoes: [
      'Não copiar imagens ou texto.',
      'Não incorporar páginas ou mídias.',
      'Não realizar extração automatizada do conteúdo.',
    ],
    observacao: 'A integração limita-se ao vínculo para a página pública da fonte.',
  },
  {
    id: 'webpathology-fonte',
    fonteId: 'webpathology',
    escopo: 'fonte',
    alvo: 'webpathology',
    estado: 'autorizado-link-remoto',
    titular: 'Dharam M. Ramnani, MD / WebPathology, LLC',
    licenca: 'Hiperlinks permitidos com abertura em tela cheia',
    comprovante: 'https://www.webpathology.com/terms-of-use',
    verificadoEm: '2026-08-10',
    responsavel: 'Equipe editorial do Domine Aqui',
    restricoes: ['Não copiar, reproduzir, republicar, enquadrar ou incorporar os materiais.'],
    observacao: 'Cada referência abre a página original em nova aba, sem iframe ou hotlink.',
  },
  {
    id: 'webpath-utah-fonte',
    fonteId: 'webpath-utah',
    escopo: 'fonte',
    alvo: 'webpath-utah',
    estado: 'autorizado-incorporacao',
    titular: 'Edward C. Klatt, MD',
    licenca: 'Autorização escrita para exibição direta no Domine Aqui e seus subdomínios',
    comprovante: 'WebPath_Authorization_DomineAqui.pdf · WP-AUTH-DOMINEAQUI-2026-08-11 · SHA-256 D244CCEE9453347BF35310B45F5813C78A4CB9E98FCE122E6082FB17ACC35CC0',
    verificadoEm: '2026-08-11',
    responsavel: 'Equipe editorial do Domine Aqui',
    restricoes: [
      'Uso gratuito, pessoal, educacional e não comercial.',
      'Não modificar, redistribuir nem republicar os arquivos fora da exibição autorizada.',
      'Não sugerir endosso, patrocínio ou afiliação da WebPath com o Domine Aqui.',
      'Autorização válida até eventual revogação por escrito.',
    ],
    observacao: 'A autorização inclui incorporação, apresentação direta e visualizador interno com ampliação. Crédito recomendado mantido em cada imagem.',
  },
]

/* ═══════════════════════ Allowlist técnica ═══════════════════════ */

/**
 * A URL é utilizável como ponteiro remoto?
 *
 * Só `https:`. O plano é explícito (§14) e a razão é dupla: `http:` seria
 * bloqueado como conteúdo misto por qualquer navegador atual, e um redirecionamento
 * em texto claro é oportunidade de injeção de conteúdo alheio numa página que
 * afirma ter proveniência.
 */
export function urlRemotaValida(url: string | undefined | null): url is string {
  if (!url) return false
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * O host da URL está na allowlist da fonte?
 *
 * Implementado aqui, e não no resolvedor de mídia, porque o pipeline de
 * ingestão precisa da **mesma** regra: uma allowlist aplicada só na renderização
 * deixaria as URLs de rastreamento entrarem nos derivados e vazarem no primeiro
 * lugar que esquecesse de filtrar.
 */
export function hostPermitido(fonteId: FonteId, url: string | undefined | null): boolean {
  if (!urlRemotaValida(url)) return false
  const fonte = FONTES[fonteId]
  if (!fonte) return false
  try {
    return fonte.dominiosDeMidia.includes(new URL(url).host)
  } catch {
    return false
  }
}

/** Ordem de especificidade: o primeiro que casar, mais específico, vence. */
const PRECEDENCIA: EscopoDeDireitos['escopo'][] = [
  'arquivo',
  'pagina',
  'colecao',
  'dominio',
  'fonte',
]

export interface AlvoDeDireitos {
  fonteId: FonteId
  midiaId: string
  urlPaginaFonte: string
  urlImagem?: string
  urlVisualizador?: string
}

/** Um escopo casa com a mídia? Cada tipo de escopo tem sua regra de casamento. */
function casa(escopo: EscopoDeDireitos, alvo: AlvoDeDireitos): boolean {
  if (escopo.fonteId !== alvo.fonteId) return false
  switch (escopo.escopo) {
    case 'fonte':
      return escopo.alvo === alvo.fonteId
    case 'arquivo':
      return escopo.alvo === alvo.midiaId
    case 'pagina':
      return alvo.urlPaginaFonte === escopo.alvo
    case 'colecao':
      // Prefixo de URL da página-fonte: é assim que os atlas agrupam coleções.
      return alvo.urlPaginaFonte.startsWith(escopo.alvo)
    case 'dominio':
      return [alvo.urlImagem, alvo.urlVisualizador, alvo.urlPaginaFonte].some((u) => {
        if (!u) return false
        try {
          return new URL(u).host === escopo.alvo
        } catch {
          return false
        }
      })
    default:
      return false
  }
}

export interface DecisaoDeDireitos {
  estado: EstadoDeDireitos
  escopoId: string
  titular: string
  licenca: string | null
  restricoes: string[]
  verificadoEm: string
}

/**
 * Estado de direitos de uma mídia concreta.
 *
 * Sem escopo registrado, o resultado é `bloqueado` — não `pendente`. A
 * diferença importa: `pendente` significa "a fonte está catalogada e alguém
 * registrou que ainda não verificou"; a ausência total de registro significa que
 * a mídia veio de um lugar que ninguém sequer catalogou como fonte, e nesse caso
 * nem o link direto é justificável.
 */
export function resolverDireitos(
  alvo: AlvoDeDireitos,
  escopos: readonly EscopoDeDireitos[] = ESCOPOS_DE_DIREITOS,
): DecisaoDeDireitos {
  for (const tipo of PRECEDENCIA) {
    const achado = escopos.find((e) => e.escopo === tipo && casa(e, alvo))
    if (achado) {
      return {
        estado: achado.estado,
        escopoId: achado.id,
        titular: achado.titular,
        licenca: achado.licenca,
        restricoes: achado.restricoes,
        verificadoEm: achado.verificadoEm,
      }
    }
  }
  return {
    estado: 'bloqueado',
    escopoId: 'sem-registro',
    titular: 'Não identificado',
    licenca: null,
    restricoes: ['Nenhum escopo de direitos registrado para esta mídia.'],
    verificadoEm: '—',
  }
}

export function permiteIncorporacao(estado: EstadoDeDireitos): boolean {
  return estado === 'autorizado-incorporacao'
}

/** Link direto para a imagem/visualizador na origem. Incorporação inclui link. */
export function permiteLinkDireto(estado: EstadoDeDireitos): boolean {
  return estado === 'autorizado-link-remoto' || estado === 'autorizado-incorporacao'
}

export const ROTULO_DE_DIREITOS: Record<EstadoDeDireitos, string> = {
  pendente: 'Direitos em verificação',
  'autorizado-link-remoto': 'Autorizado apenas como link',
  'autorizado-incorporacao': 'Direitos aprovados',
  bloqueado: 'Exibição bloqueada',
}

export const EXPLICACAO_DE_DIREITOS: Record<EstadoDeDireitos, string> = {
  pendente:
    'A instituição de origem não declarou licença de reuso e ainda não há autorização ' +
    'registrada. Mostramos descrição, crédito e o caminho para a página original.',
  'autorizado-link-remoto':
    'Há base registrada para apontar para o arquivo na origem, mas não para exibi-lo dentro ' +
    'desta página.',
  'autorizado-incorporacao':
    'Há autorização registrada para exibir a imagem aqui. Ela continua sendo servida pelos ' +
    'servidores da instituição de origem, nunca copiada para o Domine Aqui.',
  bloqueado:
    'Exibição negada ou sem registro de fonte. Permanece apenas a referência bibliográfica.',
}

/* ═══════════════════════ Disponibilidade do módulo ═══════════════════════ */

/**
 * Flag de disponibilidade.
 *
 * Fora de produção o módulo abre sempre — é preciso poder revisar para sair do
 * estado pendente. Note que a flag governa a *rota*, não os direitos de mídia:
 * mesmo habilitado, o portão de `resolverDireitos` continua fechado.
 *
 * ## Por que a flag herda a da Histologia
 *
 * A primeira versão exigia `HISTOPATOLOGIA_HABILITADO=1` e mais nada. O efeito
 * em produção foi o pior possível e demorou a aparecer: a Histologia estava no
 * ar com `HISTOLOGIA_HABILITADO=1`, todo link para a Histopatologia continuava
 * visível na home do módulo — e **assinante que clicava levava 404**, porque
 * ninguém sabia que existia uma segunda variável para ligar uma subárea da
 * mesma seção. Não era o portão protegendo nada; era uma variável esquecida
 * derrubando conteúdo pago.
 *
 * A Histopatologia é uma *subárea* do Manual da Histologia: mora dentro da rota
 * dele, passa pelo layout dele e usa o mesmo portão de assinatura
 * (`exigirAcessoAHistologia`). Então o padrão passa a ser o único que não
 * surpreende: **a subárea acompanha o módulo que a contém**. Publicar a
 * Histologia publica a Histopatologia junto.
 *
 * O controle separado continua existindo, agora nos dois sentidos e sempre
 * explícito:
 *
 * - `HISTOPATOLOGIA_HABILITADO=0` fecha só a Histopatologia, com a Histologia
 *   no ar — é o botão de emergência se um problema de direitos aparecer só
 *   aqui;
 * - `HISTOPATOLOGIA_HABILITADO=1` abre a Histopatologia mesmo com a Histologia
 *   fechada, para revisão isolada.
 *
 * Sem valor declarado, herda. Um ambiente que não diz nada não deveria produzir
 * um 404 silencioso em conteúdo de assinante.
 */
export function histopatologiaHabilitada(): boolean {
  if (process.env.NODE_ENV !== 'production') return true

  const declarado = process.env.HISTOPATOLOGIA_HABILITADO
  if (declarado === '0') return false
  if (declarado === '1') return true

  return histologiaHabilitada()
}

/**
 * Indexação por buscadores.
 *
 * `PLANO_IMPLEMENTACAO.md` §17 é direto: páginas em revisão usam `noindex`, e
 * 2.917 páginas de inventário vazias não vão para o buscador. Só conteúdo
 * `publicado` é indexável, e só quando o módulo está habilitado.
 */
export function podeIndexar(estadoDeRevisao?: string): boolean {
  if (!histopatologiaHabilitada()) return false
  return estadoDeRevisao === 'publicado'
}

export const CREDITO_BASE =
  'O acervo combina imagens remotas autorizadas da FCM/Unicamp, do Histopathology Atlas e da WebPath com ' +
  'referências visuais externas do Pathology Outlines e WebPathology. ' +
  'Nenhuma imagem é copiada, armazenada ou reprocessada pelo Domine Aqui.'

/**
 * Declaração de alterações editoriais. Precisa ser específica — e precisa deixar
 * claro que o texto didático é do Domine Aqui, não das instituições-fonte.
 */
export const ALTERACOES_EDITORIAIS = [
  'Organização das entradas catalogadas por sistema, órgão e mecanismo patológico.',
  'Consolidação editorial de títulos, sinônimos e variantes em doenças canônicas, sem apagar o nome catalogado de origem.',
  'Redação em português brasileiro do conteúdo didático (definição, mecanismo, roteiro por aumento, diferenciais e autoavaliação), de autoria do Domine Aqui.',
  'Associação entre lâminas de histologia normal e alterações patológicas correspondentes.',
  'Acréscimo de metadados: identificadores estáveis, estado de revisão biomédica e estado de direitos por mídia.',
] as const

export const AVISO_EDUCACIONAL =
  'Conteúdo educacional de anatomia patológica. Não substitui laudo anatomopatológico, ' +
  'discussão multidisciplinar, protocolo institucional, avaliação clínica ou aconselhamento ' +
  'médico. Classificações, gradações e estadiamentos devem ser conferidos na edição vigente da ' +
  'referência citada.'

export const AVISO_DESCRICAO_NAO_REVISADA =
  'Descrição capturada da página de origem, sem revisão médica do Domine Aqui.'
