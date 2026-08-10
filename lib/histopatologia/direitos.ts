import type { EscopoDeDireitos, EstadoDeDireitos, Fonte, FonteId } from './esquemas'

/**
 * PORTÃO DE DIREITOS DA HISTOPATOLOGIA — leia antes de mexer.
 *
 * Este módulo é o **único** lugar onde se decide se uma mídia pode ser
 * incorporada, apenas linkada ou nem isso. Ele existe separado do portão de
 * licença da Histologia normal (`lib/histologia/licenca.ts`) por uma razão que
 * `CREDITOS_E_DIREITOS.md` deixa explícita: a licença CC BY-NC-SA do Digital
 * Histology **não vale** para a Unicamp nem para o Histopathology Atlas. São
 * acervos distintos, com titulares distintos e nenhuma licença declarada em
 * comum. Reaproveitar a decisão de um para o outro seria tratar gratuidade como
 * licença.
 *
 * ## Estado atual: pendente nas duas fontes
 *
 * Nenhuma autorização foi registrada. Consequência prática, e ela é literal:
 * `resolverDireitos` devolve `pendente`, `lib/histopatologia/midia.ts` remove as
 * URLs de imagem e de visualizador do DTO, e o componente de mídia não tem o que
 * colocar num `<img>`. O aluno vê descrição, crédito, modalidade, coloração e um
 * botão para a página de origem — que é exatamente o que a política inicial de
 * cada fonte autoriza.
 *
 * ## Como liberar uma coleção
 *
 * Acrescente um escopo a `ESCOPOS_DE_DIREITOS` com estado, titular, licença,
 * comprovante, data e responsável. O escopo mais específico vence o mais amplo,
 * então liberar uma coleção não exige liberar a fonte. Não altere o estado da
 * fonte inteira para destravar um caso particular.
 */

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
    situacaoDeDireitos: 'permissao-explicita-recomendada',
    politicaInicial:
      'Exibir crédito e link para a página-fonte; não incorporar a imagem até registrar ' +
      'autorização compatível.',
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
    situacaoDeDireitos: 'verificar-licenca-por-colecao',
    politicaInicial:
      'Exibir crédito e link para a página-fonte; incorporar mídia somente quando a licença ' +
      'da coleção estiver registrada.',
  },
}

export const LISTA_DE_FONTES: Fonte[] = [FONTES.unicamp, FONTES['histopathology-atlas']]

/**
 * Registro versionado de direitos.
 *
 * Cada entrada precisa de titular, licença, comprovante, data e responsável —
 * mesmo quando o estado é `pendente`, porque registrar *que ninguém verificou
 * ainda* é informação, e é ela que aparece na página de créditos.
 *
 * Escopos mais específicos (arquivo > página > coleção > domínio > fonte)
 * sobrescrevem os mais amplos em `resolverDireitos`.
 */
export const ESCOPOS_DE_DIREITOS: EscopoDeDireitos[] = [
  {
    id: 'unicamp-fonte',
    fonteId: 'unicamp',
    escopo: 'fonte',
    alvo: 'unicamp',
    estado: 'pendente',
    titular: 'Faculdade de Ciências Médicas da Universidade Estadual de Campinas',
    licenca: null,
    comprovante: null,
    verificadoEm: '2026-08-09',
    responsavel: 'Equipe editorial do GradeX',
    restricoes: [
      'Nenhuma licença de reuso foi localizada na página de origem.',
      'Acesso público ao site não equivale a autorização de incorporação.',
    ],
    observacao:
      'Aguarda contato formal com a FCM/Unicamp. Enquanto pendente, a interface mostra apenas ' +
      'descrição catalogada, crédito e link para a página original.',
  },
  {
    id: 'histopathology-atlas-fonte',
    fonteId: 'histopathology-atlas',
    escopo: 'fonte',
    alvo: 'histopathology-atlas',
    estado: 'pendente',
    titular: 'Serdar Balcı / Histopathology Atlas — patolojiAI',
    licenca: null,
    comprovante: 'https://doi.org/10.17605/OSF.IO/6W5K8',
    verificadoEm: '2026-08-09',
    responsavel: 'Equipe editorial do GradeX',
    restricoes: [
      'O DOI identifica o depósito do projeto; a licença de cada coleção ainda não foi conferida.',
      'Coleções distintas do atlas podem ter titulares institucionais distintos.',
    ],
    observacao:
      'A verificação precisa ser feita coleção a coleção. Um escopo `colecao` liberado aqui ' +
      'destrava apenas as mídias daquela coleção.',
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
  'autorizado-incorporacao': 'Incorporação autorizada',
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
    'servidores da instituição de origem, nunca copiada para o GradeX.',
  bloqueado:
    'Exibição negada ou sem registro de fonte. Permanece apenas a referência bibliográfica.',
}

/* ═══════════════════════ Disponibilidade do módulo ═══════════════════════ */

/**
 * Flag de disponibilidade.
 *
 * Fora de produção o módulo abre sempre — é preciso poder revisar para sair do
 * estado pendente. Em produção exige `HISTOPATOLOGIA_HABILITADO=1`, opt-in
 * explícito de quem opera. Note que a flag governa a *rota*, não os direitos de
 * mídia: mesmo habilitado, o portão de `resolverDireitos` continua fechado.
 */
export function histopatologiaHabilitada(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.HISTOPATOLOGIA_HABILITADO === '1'
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
  'Imagens e metadados catalogados a partir do Atlas de Anatomia Patológica da FCM/Unicamp e ' +
  'do Histopathology Atlas (patolojiAI). Nenhuma imagem é copiada, armazenada ou reprocessada ' +
  'pelo GradeX: quando exibidas, são servidas pelos servidores da instituição de origem.'

/**
 * Declaração de alterações editoriais. Precisa ser específica — e precisa deixar
 * claro que o texto didático é do GradeX, não das instituições-fonte.
 */
export const ALTERACOES_EDITORIAIS = [
  'Organização das entradas catalogadas por sistema, órgão e mecanismo patológico.',
  'Consolidação editorial de títulos, sinônimos e variantes em doenças canônicas, sem apagar o nome catalogado de origem.',
  'Redação em português brasileiro do conteúdo didático (definição, mecanismo, roteiro por aumento, diferenciais e autoavaliação), de autoria do GradeX.',
  'Associação entre lâminas de histologia normal e alterações patológicas correspondentes.',
  'Acréscimo de metadados: identificadores estáveis, estado de revisão biomédica e estado de direitos por mídia.',
] as const

export const AVISO_EDUCACIONAL =
  'Conteúdo educacional de anatomia patológica. Não substitui laudo anatomopatológico, ' +
  'discussão multidisciplinar, protocolo institucional, avaliação clínica ou aconselhamento ' +
  'médico. Classificações, gradações e estadiamentos devem ser conferidos na edição vigente da ' +
  'referência citada.'

export const AVISO_DESCRICAO_NAO_REVISADA =
  'Descrição capturada da página de origem, sem revisão médica do GradeX.'
