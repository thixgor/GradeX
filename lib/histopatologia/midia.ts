import type { MidiaCatalogada, MidiaExibivel, Modalidade } from './esquemas'
import { tituloEditorialDaEntrada } from './catalogacao'
import {
  AVISO_DESCRICAO_NAO_REVISADA,
  FONTES,
  hostPermitido,
  permiteIncorporacao,
  permiteLinkDireto,
  resolverDireitos,
} from './direitos'
import { resumir } from './texto'

/**
 * Resolução de mídia da Histopatologia.
 *
 * ## O que este módulo faz de diferente do da Histologia normal
 *
 * `lib/histologia/midia.ts` resolve bytes que o projeto controla: acervo em CDN
 * próprio, endereçado por SHA-256, passando pelo otimizador do Next quando
 * compensa. Aqui **nada disso existe e nada disso pode existir**. As regras da
 * documentação são literais: não baixar, não copiar, não converter, não fazer
 * proxy, não usar `next/image`, não requisitar do servidor. O que sobra é um
 * ponteiro remoto que o *navegador do aluno* busca diretamente da instituição de
 * origem — e só quando o portão de direitos permitir.
 *
 * ## Onde o portão fecha
 *
 * Fecha aqui, em `paraExibicao`, e não na interface. Se o estado de direitos não
 * autoriza, a URL simplesmente **não entra no DTO**. Um componente não pode
 * exibir o que não recebeu, e nenhuma tela nova precisa lembrar de checar. É a
 * diferença entre uma regra e uma convenção.
 */

/* ═══════════════════════ Elegibilidade ═══════════════════════ */

/** URLs desta mídia que sobrevivem a `https:` + allowlist da fonte. */
export function urlsElegiveis(midia: Pick<MidiaCatalogada, 'fonteId' | 'urlImagem' | 'urlVisualizador' | 'urlMiniatura'>) {
  return {
    imagem: hostPermitido(midia.fonteId, midia.urlImagem) ? midia.urlImagem : undefined,
    miniatura: hostPermitido(midia.fonteId, midia.urlMiniatura) ? midia.urlMiniatura : undefined,
    visualizador: hostPermitido(midia.fonteId, midia.urlVisualizador)
      ? midia.urlVisualizador
      : undefined,
  }
}

/**
 * A mídia tem ao menos um destino remoto utilizável?
 *
 * Vinte registros do catálogo apontam para selos de repositório, contadores de
 * visita e pixels de rastreamento capturados junto das lâminas. Eles continuam
 * contabilizados na conciliação — perdê-los em silêncio esconderia divergência —
 * mas não são exibíveis, e é isto que decide.
 */
export function midiaElegivel(midia: MidiaCatalogada): boolean {
  const urls = urlsElegiveis(midia)
  return Boolean(urls.imagem || urls.visualizador || urls.miniatura)
}

/* ═══════════════════════ Texto alternativo ═══════════════════════ */

const ROTULO_DE_MODALIDADE: Record<Modalidade, string> = {
  Histologia: 'Fotomicrografia histológica',
  'Imuno-histoquímica': 'Fotomicrografia de imuno-histoquímica',
  Macroscopia: 'Fotografia macroscópica de peça anatomopatológica',
  'Imagem anatomopatológica': 'Imagem anatomopatológica',
  'Lâmina virtual (WSI)': 'Lâmina virtual digitalizada',
}

/**
 * Texto alternativo editorial.
 *
 * Descreve **o tipo de imagem e sua proveniência**, nunca o diagnóstico. A razão
 * está no plano (§16): "texto alternativo não deve afirmar um diagnóstico além
 * do que a revisão da mídia sustenta". Como nenhuma mídia deste catálogo passou
 * por revisão, dizer "adenocarcinoma invasivo em H&E" no `alt` seria transformar
 * o título de uma página em laudo — e quem depende de leitor de tela receberia a
 * afirmação mais forte de todas, sem a tarja de pendência que o vidente vê.
 *
 * `legendaEditorial`, quando existe, foi escrita e revisada pela edição; aí sim
 * ela pode descrever o achado.
 */
export function altDaMidia(midia: MidiaCatalogada, legendaEditorial?: string): string {
  const tipo = ROTULO_DE_MODALIDADE[midia.modalidade] ?? 'Imagem catalogada'
  if (legendaEditorial) return `${tipo}: ${legendaEditorial}`
  const coloracao =
    midia.coloracao && midia.coloracao !== 'Não informado' ? `, ${midia.coloracao}` : ''
  return (
    `${tipo}${coloracao}, catalogada em ${FONTES[midia.fonteId].creditoCurto} sob o título ` +
    `“${resumir(midia.patologia, 80)}”. Conteúdo não revisado pelo Domine Aqui.`
  )
}

/* ═══════════════════════ DTO ═══════════════════════ */

export interface OpcoesDeExibicao {
  aumento?: MidiaExibivel['aumento']
  legendaEditorial?: string
  alt?: string
}

/**
 * Converte uma mídia catalogada no DTO que a interface recebe.
 *
 * Devolve `null` quando a mídia não tem destino elegível — a interface trata a
 * ausência explicitamente em vez de renderizar um cartão vazio.
 */
export function paraExibicao(
  midia: MidiaCatalogada,
  opcoes: OpcoesDeExibicao = {},
): MidiaExibivel | null {
  const urls = urlsElegiveis(midia)
  if (!urls.imagem && !urls.visualizador && !urls.miniatura) return null

  const decisao = resolverDireitos({
    fonteId: midia.fonteId,
    midiaId: midia.id,
    urlPaginaFonte: midia.urlPaginaFonte,
    urlImagem: urls.imagem,
    urlVisualizador: urls.visualizador,
  })

  // O ponto do módulo inteiro: sem autorização, a URL não atravessa esta linha.
  const podeApontar = permiteLinkDireto(decisao.estado)

  return {
    id: midia.id,
    fonteId: midia.fonteId,
    modalidade: midia.modalidade,
    coloracao: midia.coloracao,
    descricao: midia.descricao ? resumir(midia.descricao, 420) : '',
    descricaoRevisada: false,
    nomeCatalogado: tituloEditorialDaEntrada(midia.patologia, midia.descricao),
    urlPaginaFonte: midia.urlPaginaFonte,
    estadoDeDireitos: decisao.estado,
    urlImagem: podeApontar ? (urls.imagem ?? urls.miniatura) : undefined,
    urlVisualizador: podeApontar ? urls.visualizador : undefined,
    alt: opcoes.alt ?? altDaMidia(midia, opcoes.legendaEditorial),
    creditoCurto: FONTES[midia.fonteId].creditoCurto,
    aumento: opcoes.aumento,
    legendaEditorial: opcoes.legendaEditorial,
  }
}

/**
 * A mídia pode virar um elemento `<img>` nesta página?
 *
 * Exige as duas coisas: autorização de incorporação **e** uma URL de imagem
 * presente no DTO. As duas condições são redundantes de propósito — se um dia
 * alguém mexer no filtro de URL, esta função continua fechando o portão.
 */
export function podeIncorporar(midia: MidiaExibivel): boolean {
  return permiteIncorporacao(midia.estadoDeDireitos) && Boolean(midia.urlImagem)
}

/* ═══════════════════════ Agrupamento para galeria ═══════════════════════ */

export const ORDEM_DIDATICA_DE_MODALIDADE: Modalidade[] = [
  'Macroscopia',
  'Histologia',
  'Lâmina virtual (WSI)',
  'Imuno-histoquímica',
  'Imagem anatomopatológica',
]

/**
 * Ordem de exibição de uma galeria: macro e H&E antes de IHQ.
 *
 * O plano pede "priorizar H&E e arquitetura antes de IHQ" (§10.4), e a razão é
 * didática: o marcador só faz sentido depois de o aluno ter estabelecido a
 * arquitetura. Abrir a galeria por vimentina inverte o raciocínio.
 */
export function ordenarParaGaleria<T extends { modalidade: Modalidade; coloracao: string }>(
  midias: readonly T[],
): T[] {
  const peso = (m: T) => {
    const i = ORDEM_DIDATICA_DE_MODALIDADE.indexOf(m.modalidade)
    const base = i < 0 ? ORDEM_DIDATICA_DE_MODALIDADE.length : i
    // H&E antes das demais colorações dentro da mesma modalidade.
    const he = /^(he|h&e|hematoxilina)/i.test(m.coloracao) ? 0 : 1
    return base * 10 + he
  }
  return midias.slice().sort((a, b) => peso(a) - peso(b))
}

export function agruparPorModalidade<T extends { modalidade: Modalidade }>(
  midias: readonly T[],
): Array<{ modalidade: Modalidade; itens: T[] }> {
  const mapa = new Map<Modalidade, T[]>()
  for (const m of midias) {
    const lista = mapa.get(m.modalidade)
    if (lista) lista.push(m)
    else mapa.set(m.modalidade, [m])
  }
  return ORDEM_DIDATICA_DE_MODALIDADE.filter((m) => mapa.has(m)).map((modalidade) => ({
    modalidade,
    itens: mapa.get(modalidade)!,
  }))
}

/**
 * Teto de mídias renderizadas de uma vez.
 *
 * Uma entrada do catálogo chega a 5.369 referências. Mesmo sem incorporação —
 * onde o custo seria de rede — 5.369 cartões numa página é custo de DOM e de
 * leitura. A galeria pagina; este é o tamanho da página.
 */
export const MIDIAS_POR_PAGINA = 24

/** Teto de mídias principais que uma página de doença exibe sem paginar. */
export const MIDIAS_PRINCIPAIS_MAXIMO = 12

export const AVISO_MIDIA_REMOTA =
  'Imagem servida diretamente pelos servidores da instituição de origem. O Domine Aqui não ' +
  'armazena, converte nem redistribui o arquivo.'

export const AVISO_DESCRICAO = AVISO_DESCRICAO_NAO_REVISADA
