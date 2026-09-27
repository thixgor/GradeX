/**
 * Tipos da Histologia com Zoom.
 *
 * Módulo sem dependências: é importado tanto pelas páginas de servidor quanto
 * pelo visualizador no navegador, e nada aqui pode arrastar o repositório (ou o
 * JSON inteiro do acervo) para o bundle do cliente.
 */

import type { CategoriaDeOrigem, OrigemDaPeca } from './especies'

/** Um nível da pirâmide de tiles, exatamente como o servidor de origem o serve. */
export interface NivelDaPiramide {
  /** Ampliação nominal do nível (0,125 a 100) — é o rótulo da pasta, não uma medida óptica. */
  magn: number
  /** Prefixo do arquivo do tile dentro da pasta do espécime, ex.: `40x/tile_`. */
  pasta: string
  /** Área com conteúdo, em pixels deste nível. O grid de tiles pode ser maior (padding preto). */
  largura: number
  altura: number
  tileL: number
  tileA: number
  nx: number
  ny: number
  /** Nível existente no servidor mas ausente do XML de origem; dimensões derivadas por escala. */
  inferido?: boolean
}

/** De onde vem a lâmina. */
export type FonteDaLamina = 'histoviewer' | 'gtex' | 'commons' | 'hpa'

/** Crédito exigido por licenças abertas (Commons, HPA): autor, licença e origem. */
export interface CreditoDaImagem {
  autor: string
  licenca: string
  urlLicenca: string | null
  urlFonte: string
  acervo: string
}

/**
 * Espécime como a coleta o grava em `data/histologia-zoom/acervo-histoviewer.json`
 * (HistoViewer) ou `acervo-dzi.json` (GTEx, Deep Zoom).
 */
export interface EspecimeColetado {
  /** Ausente nos registros do HistoViewer (fonte original do formato). */
  fonte?: FonteDaLamina
  /**
   * `dzi`: tiles em `<base><nível>/<x>_<y>.<extensao>`, com sobreposição.
   * `imagem`: fotomicrografia avulsa; cada nível é uma imagem inteira cuja URL
   * absoluta está em `pasta`.
   */
  formato?: 'histoviewer' | 'dzi' | 'imagem'
  /** Espécie declarada pelo autor da imagem avulsa. */
  especieDeclarada?: 'humana' | 'nao-informada' | string
  credito?: CreditoDaImagem
  extensao?: string
  sobreposicao?: number
  /** URL-base absoluta dos tiles (DZI). No HistoViewer é derivada de `root`. */
  base?: string
  doador?: { idade: string | null; sexo: string | null }
  hvId: number
  caixa: string
  caixas: string[]
  curso: string
  nr: string
  nome: string
  texto: string
  coloracao: string
  objetiva: string
  aberturaNumerica: number | null
  root: string
  miniatura: string
  miniaturaL: number
  miniaturaA: number
  niveis: NivelDaPiramide[]
}

/**
 * O que o visualizador precisa para abrir uma lâmina — e nada além disso.
 * Serializável: atravessa a fronteira servidor → cliente como prop.
 */
export interface PiramideDaLamina {
  /** URL-base do espécime, com barra no fim. */
  base: string
  formato?: 'histoviewer' | 'dzi' | 'imagem'
  /** Extensão dos tiles DZI (jpeg, png). */
  extensao?: string
  /** Pixels de sobreposição entre tiles (DZI). */
  sobreposicao?: number
  miniatura: { url: string; largura: number; altura: number }
  niveis: NivelDaPiramide[]
}

// ─── Tecidos ────────────────────────────────────────────────────────────────

export type GrupoDeTecido =
  | 'epitelial'
  | 'conjuntivo-propriamente-dito'
  | 'conjuntivo-especializado'
  | 'muscular'
  | 'nervoso'
  | 'dentario'

export type TipoDeTecido =
  | 'epitelial-revestimento'
  | 'epitelial-glandular-exocrino'
  | 'epitelial-glandular-endocrino'
  | 'conjuntivo-frouxo'
  | 'conjuntivo-denso-nao-modelado'
  | 'conjuntivo-denso-modelado'
  | 'conjuntivo-reticular'
  | 'conjuntivo-elastico'
  | 'conjuntivo-mucoso'
  | 'adiposo-unilocular'
  | 'adiposo-multilocular'
  | 'cartilagem-hialina'
  | 'cartilagem-elastica'
  | 'fibrocartilagem'
  | 'osso-compacto'
  | 'osso-esponjoso'
  | 'osso-primario'
  | 'sangue'
  | 'hematopoetico'
  | 'linfoide'
  | 'muscular-liso'
  | 'muscular-esqueletico'
  | 'muscular-cardiaco'
  | 'nervoso-snc'
  | 'nervoso-snp'
  | 'dentario-mineralizado'
  | 'dentario-odontogenico'

export interface ParticipacaoDeTecido {
  tipo: TipoDeTecido
  /** Fração estimada da área do corte, em %. As participações de uma ficha somam 100. */
  pct: number
  /** Onde, no corte, esse tecido aparece. */
  onde: string
}

export interface ParticipacaoDeCelula {
  nome: string
  /** Fração estimada da população celular visível, em %. As células de uma ficha somam 100. */
  pct: number
  /** Como reconhecer / o que ela faz ali. */
  nota: string
}

export interface EpitelioDaFicha {
  /** Classificação completa, ex.: "Estratificado pavimentoso queratinizado". */
  tipo: string
  onde: string
}

/**
 * Características gerais de um órgão ou preparação.
 *
 * Números são **estimativas didáticas** de área de corte e de população
 * celular, arredondadas a 5 %, para orientar o olhar — não medidas
 * morfométricas. A interface diz isso ao lado de toda tabela.
 */
export interface FichaDeCaracteristicas {
  /** Uma frase que diga o que é e para que serve. */
  resumo: string
  /** O tecido que define o órgão ao microscópio (não necessariamente o mais abundante). */
  tecidoPrincipal: string
  /** `[]` quando o corte não tem epitélio — e `semEpitelio` explica por quê. */
  epitelios: EpitelioDaFicha[]
  semEpitelio?: string
  /** Características morfológicas gerais, da menor para a maior ampliação. */
  morfologia: string[]
  celulas: ParticipacaoDeCelula[]
  tecidos: ParticipacaoDeTecido[]
  /** Por que a tabela de tecidos está vazia (preparação não tecidual ou vegetal). */
  semTecidos?: string
  /** Critérios de reconhecimento rápido na prova prática. */
  reconhecer: string[]
  /** Com o que costuma ser confundido, e como separar. */
  diferencial?: string[]
}

export type SistemaId =
  | 'celula'
  | 'tecidos-fundamentais'
  | 'sangue'
  | 'esqueletico'
  | 'muscular'
  | 'nervoso'
  | 'cardiovascular'
  | 'linfoide'
  | 'tegumentar'
  | 'respiratorio'
  | 'cavidade-oral'
  | 'digestorio'
  | 'glandulas-digestivas'
  | 'urinario'
  | 'endocrino'
  | 'reprodutor-masculino'
  | 'reprodutor-feminino'
  | 'embriologia'
  | 'sentidos'

export interface Orgao {
  id: string
  nome: string
  sistema: SistemaId
  /** Termos alternativos, em português, latim e inglês, para a busca. */
  sinonimos: string[]
  ficha: FichaDeCaracteristicas
}

/** Lâmina publicada: espécime do acervo + curadoria em português. */
export interface LaminaZoom {
  slug: string
  orgao: string
  sistema: SistemaId
  fonte: FonteDaLamina
  /** Crédito por imagem, quando a licença exige (Commons, HPA). */
  credito: CreditoDaImagem | null
  titulo: string
  /** Complemento curto que distingue esta lâmina das irmãs do mesmo órgão. */
  subtitulo: string | null
  coloracao: string
  /** Id curto e estável da coloração (entra no slug). */
  coloracaoId: string
  /** Nome da espécie para exibição ("Macaco (primata não humano)", "Não informada"). */
  especie: string
  /** Origem declarada e, para peças não humanas, a comparação com o humano. */
  origem: OrigemDaPeca
  objetiva: string
  /** Maior ampliação do scan (topo da pirâmide). */
  ampliacaoMaxima: number
  /** Observação específica desta preparação (técnica, região, estado). */
  nota: string | null
  /** Rótulo original em inglês/dinamarquês, preservado para crédito e busca. */
  rotuloOriginal: string
  hv: { caixa: string; id: number; nr: string }
  piramide: PiramideDaLamina
  largura: number
  altura: number
}

/** Versão leve da lâmina, para catálogo e busca no cliente. */
export interface LaminaResumida {
  slug: string
  orgao: string
  orgaoNome: string
  sistema: SistemaId
  titulo: string
  subtitulo: string | null
  coloracao: string
  especie: string
  categoriaDeOrigem: CategoriaDeOrigem
  ampliacaoMaxima: number
  miniatura: string
  miniaturaL: number
  miniaturaA: number
  /**
   * Lâminas DZI: miniatura montada com até 2×2 tiles de um nível ~500 px — o
   * tile único do DZI tem só ~150 px e ficaria borrado no cartão.
   */
  mosaico?: { largura: number; altura: number; tiles: Array<{ url: string; x: number; y: number; l: number; a: number }> }
}
