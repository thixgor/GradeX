/**
 * Tipos do Estudo Integrado — a camada que liga os manuais entre si.
 *
 * Sem dependências: é lido pelo servidor (índice, motor, rotas) e pelo cliente
 * (painel de conexões, páginas de estudo), então não pode puxar dado nenhum.
 */

/** De qual manual o item vem. Histopatologia aparece à parte da Histologia
 *  normal porque, para quem estuda, são perguntas diferentes: "como é" e "o
 *  que deu errado". */
export type ModuloIntegrado =
  | 'histologia'
  | 'semiologia'
  | 'exames'
  | 'radiologia'
  | 'histopatologia'
  | 'manual'
  | 'eletrocardiograma'
  | 'farmacologia'
  | 'ferramentas'

/**
 * A ordem didática de um estudo — do tecido normal à conduta. É ela que
 * transforma uma pilha de links num roteiro: primeiro como o órgão é, depois
 * como se examina, o que o laboratório e a imagem mostram, o que o patologista
 * vê, como a doença se apresenta e, por fim, o que se faz.
 */
export type EtapaDoEstudo =
  | 'base'
  | 'exame-fisico'
  | 'laboratorio'
  | 'imagem'
  | 'patologia'
  | 'clinica'
  | 'conduta'

/**
 * Natureza do processo. Duas doenças do mesmo órgão e da mesma natureza são
 * "irmãs" — é o que leva do carcinoma renal de células claras aos outros
 * tumores do rim.
 */
export type Natureza =
  | 'neoplasia'
  | 'inflamatoria'
  | 'vascular'
  | 'traumatica'
  | 'congenita'
  | 'obstrutiva'
  | 'cistica'
  | 'degenerativa'

/** Um item de qualquer manual, no formato comum que o motor compara. */
export interface ItemDoManual {
  /** Endereço estável: `<tipo>:<id>` — `tc:carcinoma-de-celulas-renais`. */
  ref: string
  modulo: ModuloIntegrado
  /** Rótulo do tipo, para o selo: "Caso de TC", "Sinal", "Lâmina". */
  tipo: string
  titulo: string
  subtitulo?: string
  href: string
  etapa: EtapaDoEstudo
  orgaos: string[]
  naturezas: Natureza[]
  /** Radicais das palavras do título — o que define "o assunto". */
  termos: string[]
  /**
   * Radicais que só aparecem nos sinônimos. Contam para casar, mas não para o
   * tamanho do nome: um item com oito sinônimos em inglês não pode parecer
   * "menos parecido" com outro só porque fala mais línguas.
   */
  termosExtras?: string[]
  /**
   * Item de referência do órgão (a lâmina normal do rim, a janela de US dos
   * rins): não é uma doença, então casa por órgão sozinho.
   */
  referencia?: boolean
  /** Ligações diretas já escritas no acervo (ex.: sinal → patologia). */
  ligados?: string[]
}

/** Por que um item apareceu como conexão. */
export type MotivoDaConexao =
  | 'mesma-doenca'
  | 'relacionado'
  | 'tratamento'
  | 'ligacao-direta'
  | 'mesmo-orgao-e-processo'
  | 'doenca-do-orgao'
  | 'referencia-do-orgao'

export interface Conexao {
  ref: string
  modulo: ModuloIntegrado
  tipo: string
  titulo: string
  subtitulo?: string
  href: string
  etapa: EtapaDoEstudo
  motivo: MotivoDaConexao
  /** Frase pronta para o selo: "Mesma doença", "Outras neoplasias do rim". */
  rotuloDoMotivo: string
  pontos: number
}

export interface GrupoDeConexoes {
  etapa: EtapaDoEstudo
  modulo: ModuloIntegrado
  itens: Conexao[]
}

/** Resposta de `/api/manual-clinico/conexoes`. */
export interface RespostaConexoes {
  origem: {
    ref?: string
    titulo: string
    /** Presentes quando a origem é um item do acervo. */
    href?: string
    modulo?: ModuloIntegrado
    tipo?: string
    orgaos: string[]
    naturezas: Natureza[]
    /** Órgão e processo já em português, para a tela não carregar o vocabulário. */
    leitura?: string[]
  } | null
  grupos: GrupoDeConexoes[]
  total: number
}

/* ───────────────────────────── Meu Estudo ───────────────────────────── */

export interface ItemDoEstudo {
  ref: string
  feito: boolean
  nota?: string
  adicionadoEm: string
  /** Resolvidos pelo servidor a partir do índice; ausentes se o item sumiu do acervo. */
  titulo?: string
  tipo?: string
  modulo?: ModuloIntegrado
  etapa?: EtapaDoEstudo
  href?: string
}

export interface EstudoResumo {
  id: string
  titulo: string
  total: number
  feitos: number
  atualizadoEm: string
}

export interface EstudoCompleto extends EstudoResumo {
  itens: ItemDoEstudo[]
  criadoEm: string
}
