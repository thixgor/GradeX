/**
 * Carregamento sob demanda de pedaços do aplicativo ("chunks").
 *
 * O que este arquivo existe para matar: a frase "Loading chunk 9980 failed",
 * em inglês, no meio do leitor de PDF, num iPad. Ela aparece quando um
 * `import()` dinâmico — no nosso caso o pacote do pdf.js, que só é baixado
 * quando alguém abre um material — não consegue trazer o arquivo JavaScript
 * correspondente.
 *
 * São duas causas, e as duas se resolvem sozinhas se a gente deixar:
 *
 * 1. A REDE FALHOU numa requisição só. O Safari do iOS derruba requisições
 *    com facilidade quando o app volta do segundo plano, quando o Wi-Fi troca
 *    de ponto de acesso ou quando a memória aperta. O arquivo continua lá; a
 *    segunda tentativa passa. O webpack NÃO tenta de novo sozinho: ele guarda
 *    a falha e devolve o mesmo erro para sempre naquele carregamento.
 *
 * 2. SAIU UMA VERSÃO NOVA com a página aberta. Os arquivos têm o hash do
 *    conteúdo no nome; publicado um deploy novo, o nome que a página aberta
 *    conhece deixa de existir e a resposta é 404. Nenhuma tentativa vai
 *    consertar isso — o que conserta é recarregar a página, que busca o HTML
 *    novo e, com ele, os nomes novos. No iPad isso é MUITO mais comum do que
 *    no computador: o aplicativo instalado fica aberto por dias, e a aba
 *    congelada em segundo plano continua achando que a versão dela é a atual.
 *
 * Aqui mora só a LÓGICA das duas coisas: como reconhecer a falha, quanto
 * esperar entre as tentativas e quando recarregar é permitido (uma vez por
 * janela de tempo — recarregar em laço seria pior que o erro). Nada de DOM,
 * nada de React, nada de `window`: quem toca no navegador é quem chama.
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

/** Uma recarga automática por janela. Ver `deveRecarregarPorVersaoNova`. */
export const JANELA_DE_RECARGA_MS = 60_000

/**
 * Mensagem quando a recarga automática não está disponível (já houve uma há
 * pouco, ou não temos onde anotar que houve). Em português, dizendo o que
 * fazer — que é o oposto do "Loading chunk 9980 failed".
 */
export const MENSAGEM_DE_VERSAO_NOVA =
  'Saiu uma versão nova do DomineAqui enquanto esta página estava aberta. Recarregue a página para voltar a abrir o material.'

/** Mensagem enquanto a recarga automática acontece (some junto com a tela). */
export const MENSAGEM_RECARREGANDO =
  'Saiu uma versão nova do DomineAqui. Atualizando esta página…'

/** Mensagem de falha de rede que sobreviveu a todas as tentativas. */
export const MENSAGEM_DE_REDE =
  'Não foi possível baixar o leitor de PDF. Verifique a conexão e tente de novo.'

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

export interface JanelaDeRecarga {
  /** O que ficou anotado da última recarga automática (ms em texto), se houve. */
  marca?: string | null
  /** Agora, em milissegundos. */
  agora: number
  janelaMs?: number
}

/**
 * Pode recarregar a página por causa de versão nova?
 *
 * A trava é o ponto todo desta função. Recarregar conserta o caso 2 de forma
 * definitiva, mas se a falha tiver OUTRA causa — o arquivo realmente fora do
 * ar, um proxy corporativo mastigando a resposta — recarregar sem limite põe o
 * aparelho num laço de recargas, que é muito pior do que uma mensagem de erro.
 * Uma recarga por janela: se o erro voltar dentro dela, quem decide é a pessoa.
 */
export function deveRecarregarPorVersaoNova({
  marca,
  agora,
  janelaMs = JANELA_DE_RECARGA_MS,
}: JanelaDeRecarga): boolean {
  if (!marca) return true
  const anterior = Number(marca)
  if (!Number.isFinite(anterior)) return true
  // Marca no futuro (relógio do aparelho mexeu) conta como recente: no pior
  // caso a pessoa vê a mensagem em vez da recarga, que é o lado seguro.
  if (anterior > agora) return false
  return agora - anterior >= janelaMs
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
