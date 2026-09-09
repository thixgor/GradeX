/**
 * Carregamento sob demanda de pedaços do aplicativo ("chunks").
 *
 * O que este arquivo existe para matar: a frase "Loading chunk 9980 failed",
 * em inglês, no meio do leitor de PDF, num iPad. Ela aparece quando um
 * `import()` dinâmico — no nosso caso o pacote do pdf.js, que só é baixado
 * quando alguém abre um material — não consegue trazer o arquivo JavaScript
 * correspondente. Sem o pdf.js não há uma página sequer para mostrar.
 *
 * A primeira versão disto apostou numa causa só: "saiu um deploy novo, o
 * arquivo com hash no nome deixou de existir, recarregar resolve". O aparelho
 * do usuário desmentiu a aposta — recarregou sozinho, e a segunda tentativa
 * falhou igual. Então a causa é outra, e é uma destas:
 *
 * 1. A REDE FALHOU numa requisição só. O Safari do iOS derruba requisições
 *    com facilidade quando o app volta do segundo plano, quando o Wi-Fi troca
 *    de ponto de acesso ou quando a memória aperta. O arquivo continua lá; a
 *    segunda tentativa passa. O webpack NÃO tenta de novo sozinho: ele guarda
 *    a falha e devolve o mesmo erro para sempre naquele carregamento.
 *
 * 2. A CÓPIA LOCAL DAQUELE ARQUIVO ESTÁ RUIM. `/_next/static/` é servido com
 *    `immutable` e um ano de validade — o navegador nunca mais pergunta ao
 *    servidor. Se o que ficou guardado for uma resposta pela metade, aquele
 *    endereço está queimado NAQUELE APARELHO, para sempre. Recarregar a página
 *    não limpa: recarga revalida o documento, não os arquivos que ele pede. É
 *    a explicação que casa com o sintoma "só num iPad, e a recarga não mudou
 *    nada".
 *
 * 3. O ARQUIVO REALMENTE NÃO EXISTE MAIS no servidor, porque a página aberta é
 *    de um deploy anterior. Continua sendo possível — só não é o caso aqui.
 *
 * A resposta às três é a mesma, e não é recarregar: é ter um SEGUNDO ENDEREÇO
 * para o mesmo pacote, sem hash no nome e sem cache imortal, em
 * `lib/pdfjs-do-publico.ts`. Este módulo cuida da parte de decidir: reconhecer
 * a falha e quanto esperar antes de tentar de novo.
 *
 * Lógica pura de propósito: nada de DOM, nada de React, nada de `window` —
 * quem toca no navegador é quem chama.
 */

/** Quantas vezes um `import()` é tentado antes de desistir. */
export const TENTATIVAS_DE_IMPORTACAO = 3

/**
 * Espera mínima entre uma tentativa e a próxima, em milissegundos.
 *
 * Curta de propósito: alguém está olhando para uma roda girando. Somadas, as
 * três tentativas custam menos de dois segundos.
 */
export const ATRASO_BASE_MS = 500

/**
 * Mensagem de quando o aparelho está sem rede.
 *
 * Vem antes de qualquer outra hipótese: sem conexão, nada mais precisa ser
 * explicado, e é o próprio aparelho quem sabe disso (`navigator.onLine`).
 */
export const MENSAGEM_DE_REDE =
  'Sem conexão para baixar o leitor de PDF. Assim que a internet voltar, toque em "Tentar novamente".'

/**
 * Mensagem de quando NENHUM dos dois endereços do pdf.js respondeu.
 *
 * Ela diz o que fazer, em ordem do que mais resolve. Nada de "versão nova":
 * chegado aqui, a cópia estável de `public/` também falhou, e essa não some
 * quando sai um deploy. O que sobra é o aparelho ou a rede — fechar o app por
 * completo derruba a aba congelada e o cache do processo; trocar de rede
 * contorna Wi-Fi de faculdade e hospital, que é onde isto costuma acontecer.
 */
export const MENSAGEM_LEITOR_INDISPONIVEL =
  'Não foi possível baixar o leitor de PDF neste aparelho. Feche o aplicativo por completo e abra de novo; se continuar, troque de rede (Wi-Fi ou dados móveis).'

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * O erro é "não consegui trazer um pedaço do aplicativo"?
 *
 * Os sintomas variam com o empacotador e com o navegador, e é por isso que a
 * lista é grande: o webpack fala em "Loading chunk X failed", o carregamento
 * nativo de módulos do Safari fala em "Importing a module script failed", e
 * quando um 404 devolve a página de erro em HTML o que estoura é um erro de
 * sintaxe no primeiro `<` do documento.
 */
export function ehFalhaDeCarregamentoDeModulo(erro: unknown): boolean {
  if (!erro) return false
  const alvo = erro as { name?: unknown; message?: unknown }
  const texto = normalizar(
    `${typeof alvo.name === 'string' ? alvo.name : ''} ${typeof alvo.message === 'string' ? alvo.message : ''}`,
  )
  if (!texto.trim()) return false

  return (
    texto.includes('chunkloaderror') ||
    texto.includes('loading chunk') ||
    texto.includes('loading css chunk') ||
    texto.includes('dynamically imported module') ||
    texto.includes('importing a module script failed') ||
    texto.includes('error loading script') ||
    texto.includes("unexpected token '<'") ||
    texto.includes('unexpected token <')
  )
}

/**
 * Quanto esperar antes da tentativa de número `tentativa` (1 = a segunda).
 *
 * Cresce (500ms, 1s, 2s…) porque o motivo mais comum de uma requisição falhar
 * no celular é a rede estar trocando de mãos — Wi-Fi para dados móveis, um
 * ponto de acesso para outro — e isso leva um instante para assentar.
 */
export function atrasoDaTentativa(tentativa: number, base = ATRASO_BASE_MS): number {
  if (tentativa <= 0) return 0
  return Math.min(base * 2 ** (tentativa - 1), 4000)
}

export interface OpcoesDeImportacao {
  tentativas?: number
  /** Injetável para o teste não gastar tempo real. */
  esperar?: (ms: number) => Promise<void>
  /** Injetável pelo mesmo motivo. */
  atraso?: (tentativa: number) => number
}

const esperarPadrao = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * Roda um `import()` com nova tentativa quando ele falha por carregamento.
 *
 * Só falhas de carregamento são repetidas. Se o módulo baixou e lançou por
 * conta própria (um erro de código dentro dele), repetir daria o mesmo erro
 * três vezes e atrasaria a mensagem — esse sobe na hora.
 */
export async function importarComRetentativa<T>(
  importar: () => Promise<T>,
  opcoes: OpcoesDeImportacao = {},
): Promise<T> {
  const tentativas = Math.max(1, opcoes.tentativas ?? TENTATIVAS_DE_IMPORTACAO)
  const esperar = opcoes.esperar ?? esperarPadrao
  const atraso = opcoes.atraso ?? atrasoDaTentativa

  let ultimoErro: unknown
  for (let tentativa = 0; tentativa < tentativas; tentativa += 1) {
    try {
      return await importar()
    } catch (erro) {
      ultimoErro = erro
      if (!ehFalhaDeCarregamentoDeModulo(erro)) throw erro
      if (tentativa === tentativas - 1) break
      await esperar(atraso(tentativa + 1))
    }
  }
  throw ultimoErro
}
