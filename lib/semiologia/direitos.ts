/**
 * Direitos, licenças e créditos do Manual de Semiologia.
 *
 * ## O que mudou, e por que isto existe
 *
 * O módulo nasceu sem uma única fotografia. Não por escolha estética: acervo de
 * otoscopia, fundo de olho e POCUS é quase todo proprietário, e o pouco que é
 * aberto vem sob Creative Commons **NonCommercial** — incompatível com um
 * produto pago. A saída foi desenhar tudo (ver `esquemas.ts`), e a interface
 * dizia, honestamente, que os acervos de terceiros eram só referência externa
 * cuja licença o aluno deveria conferir antes de reutilizar.
 *
 * Duas autorizações escritas mudaram exatamente essa frase. **The POCUS Atlas**
 * e o **Radiopaedia.org** concederam exceção expressa à cláusula NonCommercial
 * das respectivas licenças, em favor da DomineAqui e de seus domínios e
 * subdomínios, permitindo indexar, reorganizar, traduzir, aprofundar e
 * **disponibilizar de forma paga** os conteúdos — imagens incluídas.
 *
 * ## Por que os termos moram em código, e não num PDF numa pasta
 *
 * Três coisas que um PDF arquivado não faz:
 *
 * 1. **O crédito não pode depender de alguém lembrar.** As duas autorizações
 *    exigem atribuição clara e permanente. Se o texto do crédito vive aqui e o
 *    rodapé o lê daqui, é impossível publicar uma página do módulo sem ele.
 * 2. **O escopo é território, não intenção.** Ambas as licenças valem para a
 *    DomineAqui e seus domínios. `hostAutorizado` transforma isso em checagem
 *    executável, para nenhuma mídia entrar por um host que a autorização não
 *    cobre.
 * 3. **A fronteira precisa estar escrita onde se programa.** O que a exceção
 *    cobre — e o que ela não cobre — é a informação que evita o erro caro. Ela
 *    está em `restricoes`, ao lado do código que serve a imagem, e não a três
 *    cliques de distância num contrato.
 *
 * ## A fronteira, em uma frase
 *
 * A exceção é **nossa**, não do conteúdo. Para qualquer terceiro, POCUS Atlas
 * segue CC BY-NC 4.0 e Radiopaedia segue CC BY-NC-SA 3.0. Nada aqui autoriza
 * redistribuir esse material para fora da plataforma, nem o transforma em
 * conteúdo aberto por termos passado por ele.
 */

export type FonteLicenciadaId = 'pocus-atlas' | 'radiopaedia'

export interface FonteLicenciada {
  id: FonteLicenciadaId
  nome: string
  url: string
  titular: string
  /** Quem assina a autorização, do lado do licenciante. */
  signatarios: string[]
  /** A licença pública do acervo — a que vale para todo mundo que não é nós. */
  licencaBase: string
  /** O que a autorização acrescenta por cima dela. */
  excecao: string
  /**
   * O crédito exigido, no texto que a própria autorização sugere.
   *
   * Reproduzido literalmente de propósito: reescrever o crédito "para ficar
   * mais bonito" é a forma mais fácil de deixar de cumprir uma cláusula que foi
   * negociada palavra por palavra.
   */
  credito: string
  /** Versão curta, para selo e cabeçalho. */
  creditoCurto: string
  /** O que a autorização expressamente permite. */
  permissoes: string[]
  /** O que ela não cobre. */
  restricoes: string[]
  /** Hosts de onde a mídia desta fonte pode legitimamente vir. */
  dominiosDeMidia: string[]
  /** Procedência do documento que sustenta tudo isto. */
  comprovante: {
    arquivo: string
    versao?: string
    data: string
    sha256: string
  }
}

export const FONTES_LICENCIADAS: Record<FonteLicenciadaId, FonteLicenciada> = {
  'pocus-atlas': {
    id: 'pocus-atlas',
    nome: 'The POCUS Atlas',
    url: 'https://www.thepocusatlas.com',
    titular: 'The POCUS Atlas (Evidence Atlas App · The POCUS Atlas App)',
    signatarios: [
      'Dr. Michael Macias, MD — Fundador e Designer',
      'Dr. Matthew David Riscinti, MD — Co-fundador e Editor',
    ],
    licencaBase: 'Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)',
    excecao:
      'Exceção expressa à restrição NonCommercial, exclusivamente para a DomineAqui e seus domínios e subdomínios, permitindo a disponibilização paga do conteúdo.',
    credito:
      'Conteúdo baseado em / adaptado de The POCUS Atlas (thepocusatlas.com) — Fundadores: Dr. Michael Macias e Dr. Matthew David Riscinti. Licença CC BY-NC 4.0 com autorização específica para DomineAqui.',
    creditoCurto: 'The POCUS Atlas — Macias & Riscinti · CC BY-NC 4.0 com autorização para DomineAqui',
    permissoes: [
      'Indexar, organizar e estruturar o conteúdo de forma sistematizada em português brasileiro.',
      'Aprofundar, complementar e contextualizar os conteúdos educacionais originais.',
      'Disponibilizar o conteúdo, ou versões aprofundadas dele, de forma paga (assinatura, curso, acesso premium).',
      'Utilizar imagens, clipes de ultrassom, infográficos e textos do The POCUS Atlas, do Evidence Atlas e de projetos correlatos.',
    ],
    restricoes: [
      'A exceção vale apenas para a DomineAqui e seus domínios e subdomínios — para terceiros, permanece a CC BY-NC 4.0 integral.',
      'Qualquer aprofundamento deve preservar a precisão científica e não distorcer o material original.',
      'O crédito deve ser claro e permanente, sem ser excessivo ou intrusivo.',
      'Autorização não exclusiva e revogável por escrito em caso de descumprimento grave.',
    ],
    dominiosDeMidia: ['www.thepocusatlas.com', 'thepocusatlas.com', 'images.squarespace-cdn.com'],
    comprovante: {
      arquivo: 'Autorizacao_POCUS_Atlas_DomineAqui.pdf',
      data: '2026-09-13',
      sha256: 'dc87d7ca60c19d804b270a8d24de580e9968051784f9a2b57b696e3d019f8773',
    },
  },
  radiopaedia: {
    id: 'radiopaedia',
    nome: 'Radiopaedia.org',
    url: 'https://radiopaedia.org',
    titular: 'Radiopaedia Australia Pty Ltd (ACN 133 562 722) — © 2005–2026 Radiopaedia.org',
    signatarios: ['Dr. Frank Gaillard — Fundador e acionista majoritário'],
    licencaBase:
      'Creative Commons Attribution-NonCommercial-ShareAlike 3.0 (CC BY-NC-SA 3.0)',
    excecao:
      'Exceção expressa e específica em favor da DomineAqui e de seus domínios e subdomínios, permitindo a utilização comercial (disponibilização paga) e a reorganização/tradução dos conteúdos.',
    credito:
      'Conteúdo baseado em / adaptado de materiais do Radiopaedia.org — © Radiopaedia Australia Pty Ltd',
    creditoCurto: 'Radiopaedia.org — © Radiopaedia Australia Pty Ltd · autorização para DomineAqui',
    permissoes: [
      'Indexar e reorganizar o compêndio completo de forma estruturada em português brasileiro.',
      'Aprofundar, expandir e enriquecer os conteúdos originais.',
      'Traduzir integral ou parcialmente os materiais para o português brasileiro.',
      'Disponibilizar o conteúdo resultante de forma paga.',
      'Utilizar imagens, textos, casos e artigos do acervo no âmbito da plataforma.',
    ],
    restricoes: [
      'A exceção vale apenas para a DomineAqui e seus domínios e subdomínios — para terceiros, permanece a CC BY-NC-SA 3.0.',
      'O crédito deve ser claro, porém não repetitivo ou excessivo, em local visível e permanente da seção.',
      'Qualquer alteração substancial das condições de uso deve ser formalizada por escrito.',
      // Registrado por ser o ponto em aberto do documento, e não uma permissão
      // presumida: a exceção nomeia uso comercial e reorganização/tradução e
      // silencia sobre a cláusula ShareAlike. Enquanto o silêncio não virar
      // texto, o conservador é não tratar o derivado como aberto.
      'A exceção nomeia uso comercial e tradução; não há menção expressa à cláusula ShareAlike — o derivado não é publicado como conteúdo aberto.',
    ],
    dominiosDeMidia: ['radiopaedia.org', 'prod-images-static.radiopaedia.org', 'images.radiopaedia.org'],
    comprovante: {
      arquivo: 'Autorizacao_Radiopaedia_DomineAqui.pdf',
      versao: '4.2',
      data: '2026-08-14',
      sha256: 'ba02a1bf22566ecd307dfab82c445703a307f2348d4865f46b4f3ebff2328659',
    },
  },
}

export const LISTA_DE_FONTES: FonteLicenciada[] = [
  FONTES_LICENCIADAS['pocus-atlas'],
  FONTES_LICENCIADAS.radiopaedia,
]

/**
 * A frase que abre a página de créditos.
 *
 * Diz as duas coisas que o aluno precisa saber e que nenhuma das duas sozinha
 * responde: de onde vem a imagem que ele está vendo, e por que ela pode estar
 * num produto pago.
 */
export const CREDITO_BASE =
  'O Manual de Semiologia combina material próprio — todas as figuras esquemáticas são desenhadas por nós — com acervos de terceiros usados sob autorização escrita. Esta página registra a procedência de cada fonte, o que a autorização permite e o que ela não cobre.'

/** Aviso que acompanha qualquer mídia clínica real exibida no módulo. */
export const AVISO_EDUCACIONAL =
  'Imagens e clipes de casos reais têm finalidade exclusivamente educacional e não substituem avaliação clínica. A interpretação depende do contexto do paciente, da qualidade da aquisição e do exame completo.'

export function fonteLicenciada(id: FonteLicenciadaId): FonteLicenciada {
  return FONTES_LICENCIADAS[id]
}

/**
 * O host pode servir mídia desta fonte?
 *
 * Só HTTPS, e só host que a autorização cobre. A checagem vive aqui — junto dos
 * termos — e não no componente que desenha, porque quem ingere mídia precisa da
 * **mesma** regra: uma allowlist aplicada apenas na renderização deixa a URL
 * errada entrar no acervo e só falhar na frente do aluno.
 *
 * A comparação é por host exato ou por sufixo de domínio precedido de ponto:
 * `endsWith('radiopaedia.org')` sozinho aceitaria `naoradiopaedia.org`, que é
 * como allowlist vira convite.
 */
export function hostAutorizado(url: string, fonte: FonteLicenciada): boolean {
  let alvo: URL
  try {
    alvo = new URL(url)
  } catch {
    return false
  }
  if (alvo.protocol !== 'https:') return false
  const host = alvo.hostname.toLowerCase()
  return fonte.dominiosDeMidia.some(
    (permitido) => host === permitido.toLowerCase() || host.endsWith(`.${permitido.toLowerCase()}`),
  )
}

/** A URL é servível por alguma das fontes licenciadas? Devolve qual. */
export function fonteDaUrl(url: string): FonteLicenciada | null {
  return LISTA_DE_FONTES.find((fonte) => hostAutorizado(url, fonte)) ?? null
}
