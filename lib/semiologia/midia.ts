import { fonteLicenciada, hostAutorizado, type FonteLicenciada, type FonteLicenciadaId } from '../acervos-licenciados'

/**
 * Resolução de mídia clínica real do Manual de Semiologia.
 *
 * ## O papel que a fotografia passa a ter — e o que ela não substitui
 *
 * As figuras esquemáticas continuam sendo a espinha do módulo, e não um
 * substituto provisório à espera de foto. Elas ensinam o **padrão**: a mesma
 * geometria, o mesmo enquadramento, o mesmo código gerando duas otites que
 * diferem só no que importa. Nenhum acervo fotográfico faz isso, porque em
 * fotografia muda também o ângulo, a luz, o aparelho e o paciente — e o aluno
 * aprende o ruído junto com o sinal.
 *
 * O que a fotografia faz, e o desenho não, é ensinar **variação**: a otite que
 * não parece a do livro, a janela ruim entre costelas, o paciente obeso, o
 * ganho mal ajustado. As duas competências são distintas e as duas são
 * necessárias, então a interface mostra as duas lado a lado em vez de trocar
 * uma pela outra.
 *
 * ## As três estratégias
 *
 * Copiadas do Manual da Histologia (`lib/histologia/midia.ts`), que já enfrentou
 * este problema com 2,56 GiB de acervo, e pelas mesmas razões:
 *
 * - `espelho`: há CDN nosso configurado. É o modo robusto — endereçado por
 *   hash, servido do nosso domínio (que é o território que as autorizações
 *   cobrem) e imune a uma mudança de URL do lado da fonte.
 * - `origem`: a mídia vem do servidor da própria fonte. Sempre ativo fora de
 *   produção, para desenvolver e revisar sem espelhar nada; em produção exige
 *   opt-in explícito, porque a decisão tem consequência — o tráfego dos nossos
 *   alunos passa a bater no servidor de um terceiro que nos fez um favor, e uma
 *   mudança de URL do lado deles quebra a cena.
 * - `indisponivel`: produção sem espelho e sem opt-in. A interface mostra o
 *   esquema e diz que a foto não está disponível, em vez de um quadrado
 *   quebrado.
 *
 * ## Por que o acervo nasce vazio
 *
 * A autorização diz o que **podemos** usar; ela não nos entrega os arquivos. O
 * modelo, o resolvedor e a interface estão prontos e testados — o que falta é a
 * curadoria, que é trabalho humano: escolher o caso, conferir que ele mostra o
 * achado, escrever a legenda em português e registrar a URL de origem.
 *
 * Inventar aqui uma lista de URLs plausíveis de `radiopaedia.org` seria pior que
 * a lacuna: produziria imagens quebradas em produção e créditos apontando para
 * casos que talvez nem existam — exatamente o tipo de erro que uma autorização
 * de uso não perdoa.
 */

export interface MidiaClinica {
  /** Identificador estável dentro da cena. */
  id: string
  tipo: 'imagem' | 'clipe'
  fonte: FonteLicenciadaId
  /** URL no acervo de origem. Precisa passar por `hostAutorizado`. */
  urlOrigem: string
  /** Página do caso na fonte — o vínculo de proveniência, sempre visível. */
  urlDoCaso: string
  /** SHA-256 do arquivo, quando espelhado. É a chave no nosso CDN. */
  sha256?: string
  /** Extensão do arquivo espelhado (`jpg`, `png`, `mp4`…). */
  ext?: string
  /** O que esta mídia mostra, em português. Vira o texto alternativo. */
  legenda: string
  /** Autoria do caso, quando a fonte a identifica. */
  autoria?: string
}

export type EstrategiaDeMidia = 'espelho' | 'origem' | 'indisponivel'

function baseDoEspelho(): string | null {
  const base = process.env.NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE
  if (!base) return null
  return base.replace(/\/+$/, '')
}

function servirDaOrigem(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.NEXT_PUBLIC_SEMIOLOGIA_MIDIA_ORIGEM === '1'
}

export function estrategiaDeMidia(): EstrategiaDeMidia {
  if (baseDoEspelho()) return 'espelho'
  if (servirDaOrigem()) return 'origem'
  return 'indisponivel'
}

/** Caminho do objeto no espelho. Endereçado por hash, como na Histologia. */
export function caminhoNoEspelho(sha256: string, ext: string): string {
  return `semiologia/${sha256.slice(0, 2)}/${sha256}.${ext}`
}

/**
 * URL pública de uma mídia, ou `null` quando não há como servi-la.
 *
 * Devolver `null` em vez de uma string vazia é deliberado: `<img src="">`
 * dispara uma requisição para a própria página e desenha um ícone quebrado. A
 * interface trata o `null` explicitamente e mostra só o esquema.
 *
 * A allowlist é aplicada **aqui**, e não só na ingestão. Uma URL que escapou da
 * curadoria não deve chegar ao navegador do aluno só porque entrou no arquivo
 * de dado: a autorização cobre hosts nomeados, e servir de outro host é usar
 * material fora do que foi autorizado.
 */
export function urlDaMidia(midia: MidiaClinica): string | null {
  const fonte = fonteLicenciada(midia.fonte)
  if (!fonte) return null

  const base = baseDoEspelho()
  if (base && midia.sha256 && midia.ext) {
    return `${base}/${caminhoNoEspelho(midia.sha256, midia.ext)}`
  }

  if (!servirDaOrigem()) return null
  return hostAutorizado(midia.urlOrigem, fonte) ? midia.urlOrigem : null
}

/** A fonte de uma mídia, para montar o crédito ao lado dela. */
export function fonteDaMidia(midia: MidiaClinica): FonteLicenciada {
  return fonteLicenciada(midia.fonte)
}

/**
 * Mídias de uma cena que este ambiente consegue servir de fato.
 *
 * Filtrar no servidor evita o pior dos dois mundos: a interface reservar espaço
 * para uma galeria que vai chegar vazia, ou piscar o esqueleto de uma foto que
 * nunca vem.
 */
export function midiasServiveis(midias: MidiaClinica[] | undefined): MidiaClinica[] {
  if (!midias?.length) return []
  return midias.filter((midia) => urlDaMidia(midia) !== null)
}
