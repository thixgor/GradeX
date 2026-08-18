/**
 * Tradutor de erros do DomineAqui.
 *
 * O que este arquivo existe para matar: a frase "Application error: a
 * client-side exception has occurred (see the browser console for more
 * information)". Ela é o texto que o Next imprime quando NÃO existe uma
 * fronteira de erro na rota — e é péssima por três motivos. Primeiro, não diz
 * nada: quem lê não descobre se o problema é o celular, a internet ou o nosso
 * servidor. Segundo, manda "abrir o console do navegador", coisa que ninguém
 * fora de programação vai fazer (e que no app instalado nem existe). Terceiro,
 * é em inglês, numa plataforma inteiramente em português.
 *
 * Aqui a gente pega o pouco que o navegador entrega — nome do erro, mensagem,
 * `digest`, código HTTP, se há rede — e transforma numa CAUSA em linguagem de
 * gente, com o que fazer a respeito. É lógica pura de propósito: nada de React
 * nem de `window`, para poder rodar no servidor, no cliente e no teste.
 *
 * Os sinais do ambiente (conexão, aparelho, app instalado) entram por
 * parâmetro — quem lê o `navigator` é o componente, não este módulo.
 */

export type CategoriaDeErro =
  | 'sem-conexao'
  | 'rede-instavel'
  | 'versao-nova'
  | 'sessao-expirada'
  | 'sem-permissao'
  | 'nao-encontrado'
  | 'muitas-tentativas'
  | 'servidor'
  | 'armazenamento'
  | 'memoria'
  | 'interferencia'
  | 'desconhecido'

/** Ícone da tela. O nome é resolvido para um componente em `components/erro`. */
export type IconeDeErro =
  | 'sem-sinal'
  | 'antena'
  | 'atualizar'
  | 'cadeado'
  | 'bloqueado'
  | 'bussola'
  | 'ampulheta'
  | 'servidor'
  | 'disco'
  | 'chip'
  | 'quebra-cabeca'
  | 'alerta'

export interface EntradaDeDiagnostico {
  /** `error.message`. Em produção o React costuma encurtar — tudo bem. */
  mensagem?: string | null
  /** `error.name`. Sobrevive à minificação (`ChunkLoadError`, `TypeError`). */
  nome?: string | null
  /** `error.digest`: o identificador que o Next gera no servidor. */
  digest?: string | null
  /** Código HTTP, quando a tela nasceu de uma resposta (404, 500, 429…). */
  status?: number | null
  /** `navigator.onLine` no momento do erro. `undefined` = não sabemos. */
  online?: boolean
}

export interface Diagnostico {
  categoria: CategoriaDeErro
  icone: IconeDeErro
  /** Título da tela, em português e sem jargão. */
  titulo: string
  /** Uma ou duas frases explicando o que aconteceu. */
  resumo: string
  /** O "fator associado": a causa provável, em três ou quatro palavras. */
  fator: string
  /** O que a pessoa pode fazer, em ordem de quem resolve mais. */
  passos: string[]
  /** Se apertar "Tentar de novo" tem chance real de resolver. */
  tentarNovamenteResolve: boolean
  /** Se o caminho é recarregar a página inteira (e não só remontar a rota). */
  recarregarResolve: boolean
  gravidade: 'aviso' | 'erro'
}

/** Tira acento e caixa alta para as buscas por trecho não dependerem disso. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function contem(agulha: string, palheiro: string): boolean {
  return palheiro.includes(agulha)
}

/**
 * Descobre a categoria a partir do pouco que sobra de um erro em produção.
 *
 * A ordem importa. Estar sem rede explica qualquer outro sintoma, então vem
 * primeiro; o código HTTP é a evidência mais confiável depois disso; e só no
 * fim entramos no texto do erro, que é a fonte mais frágil (o React minifica
 * mensagens de componente em produção).
 */
export function classificarErro(entrada: EntradaDeDiagnostico): CategoriaDeErro {
  if (entrada.online === false) return 'sem-conexao'

  const status = entrada.status ?? undefined
  if (typeof status === 'number') {
    if (status === 401) return 'sessao-expirada'
    if (status === 403) return 'sem-permissao'
    if (status === 404 || status === 410) return 'nao-encontrado'
    if (status === 408 || status === 504) return 'rede-instavel'
    if (status === 429) return 'muitas-tentativas'
    if (status >= 500) return 'servidor'
  }

  const texto = normalizar(`${entrada.nome ?? ''} ${entrada.mensagem ?? ''}`)
  if (!texto.trim()) return 'desconhecido'

  // Deploy novo no ar com a aba antiga aberta: os arquivos que a página pede
  // têm hash no nome e o hash mudou. É o erro de cliente mais comum de todos
  // e o único em que "recarregar" resolve 100% das vezes.
  if (
    contem('chunkloaderror', texto) ||
    contem('loading chunk', texto) ||
    contem('loading css chunk', texto) ||
    contem('dynamically imported module', texto) ||
    contem('importing a module script failed', texto) ||
    contem('unexpected token \'<\'', texto) ||
    contem('unexpected token <', texto)
  ) {
    return 'versao-nova'
  }

  // Extensão do navegador, tradutor automático de página ou leitor de tela
  // mexendo no DOM antes do React terminar. Aparece como erro de hidratação.
  if (
    contem('hydrat', texto) ||
    contem('minified react error #418', texto) ||
    contem('minified react error #421', texto) ||
    contem('minified react error #423', texto) ||
    contem('minified react error #425', texto) ||
    contem('text content does not match', texto) ||
    contem('removechild', texto) ||
    contem('insertbefore', texto) ||
    contem('not a child of this node', texto)
  ) {
    return 'interferencia'
  }

  if (
    contem('quotaexceeded', texto) ||
    contem('exceeded the quota', texto) ||
    contem('storage is full', texto) ||
    contem('no space left', texto)
  ) {
    return 'armazenamento'
  }

  if (
    contem('out of memory', texto) ||
    contem('maximum call stack', texto) ||
    contem('allocation failed', texto) ||
    contem('rangeerror: array buffer allocation', texto)
  ) {
    return 'memoria'
  }

  // Vem ANTES do bloco de rede porque estes nomes são marcadores de
  // infraestrutura nossa, não do aparelho de quem lê: "MongoServerError:
  // connection timed out" tem a palavra "timed out", mas quem estourou o
  // tempo foi o nosso banco — culpar a internet do usuário seria mandá-lo
  // trocar de Wi-Fi para consertar um problema que não é dele.
  if (
    contem('mongo', texto) ||
    contem('econnrefused', texto) ||
    contem('enotfound', texto) ||
    contem('etimedout', texto) ||
    contem('internal server error', texto) ||
    contem('server components render', texto) ||
    contem('database', texto) ||
    contem('bad gateway', texto)
  ) {
    return 'servidor'
  }

  if (
    contem('failed to fetch', texto) ||
    contem('networkerror', texto) ||
    contem('network request failed', texto) ||
    contem('load failed', texto) ||
    contem('err_network', texto) ||
    contem('err_internet_disconnected', texto) ||
    contem('err_connection', texto) ||
    contem('aborterror', texto) ||
    contem('the operation was aborted', texto) ||
    contem('timeout', texto) ||
    contem('timed out', texto)
  ) {
    return 'rede-instavel'
  }

  if (
    contem('unauthorized', texto) ||
    contem('nao autorizado', texto) ||
    contem('jwt expired', texto) ||
    contem('token expirado', texto) ||
    contem('sessao expirada', texto) ||
    contem('invalid token', texto)
  ) {
    return 'sessao-expirada'
  }

  if (
    contem('forbidden', texto) ||
    contem('acesso negado', texto) ||
    contem('sem permissao', texto) ||
    contem('permission denied', texto)
  ) {
    return 'sem-permissao'
  }

  if (
    contem('rate limit', texto) ||
    contem('too many requests', texto) ||
    contem('muitas tentativas', texto)
  ) {
    return 'muitas-tentativas'
  }

  if (
    contem('not found', texto) ||
    contem('nao encontrad', texto) ||
    contem('does not exist', texto)
  ) {
    return 'nao-encontrado'
  }

  return 'desconhecido'
}

const CONTEUDO: Record<CategoriaDeErro, Omit<Diagnostico, 'categoria'>> = {
  'sem-conexao': {
    icone: 'sem-sinal',
    titulo: 'Você está sem internet',
    resumo:
      'Seu aparelho perdeu a conexão, então esta tela não conseguiu carregar. Não é problema da sua conta nem do DomineAqui — e nada do seu progresso se perde.',
    fator: 'Aparelho sem conexão',
    passos: [
      'Confira o Wi-Fi ou os dados móveis. Se estiver em modo avião, desligue.',
      'Em plantão, metrô ou elevador, o sinal costuma voltar sozinho em alguns segundos.',
      'Assim que a conexão voltar, esta página se recarrega automaticamente.',
    ],
    tentarNovamenteResolve: true,
    recarregarResolve: true,
    gravidade: 'aviso',
  },
  'rede-instavel': {
    icone: 'antena',
    titulo: 'A conexão falhou no meio do caminho',
    resumo:
      'Você está conectado, mas o pedido não chegou até o fim — sinal fraco, rede pública com login pendente ou o servidor demorando mais que o normal para responder.',
    fator: 'Conexão instável ou lenta',
    passos: [
      'Tente de novo: em rede oscilante, a segunda tentativa quase sempre passa.',
      'Se estiver em Wi-Fi público (faculdade, hospital, café), confirme se ele já pediu o login da rede.',
      'Trocar de Wi-Fi para dados móveis (ou o contrário) resolve na maioria dos casos.',
    ],
    tentarNovamenteResolve: true,
    recarregarResolve: true,
    gravidade: 'aviso',
  },
  'versao-nova': {
    icone: 'atualizar',
    titulo: 'Saiu uma versão nova enquanto você estava aqui',
    resumo:
      'Atualizamos o DomineAqui com a sua aba já aberta. A página estava pedindo arquivos da versão anterior, que não existem mais. É o erro mais inofensivo da lista.',
    fator: 'Página aberta na versão anterior',
    passos: [
      'Recarregue a página — isso resolve por completo.',
      'Se voltar a aparecer, feche a aba e abra o DomineAqui de novo.',
      'No app instalado, fechar e reabrir o app tem o mesmo efeito.',
    ],
    tentarNovamenteResolve: false,
    recarregarResolve: true,
    gravidade: 'aviso',
  },
  'sessao-expirada': {
    icone: 'cadeado',
    titulo: 'Sua sessão expirou',
    resumo:
      'Por segurança, o acesso expira depois de um tempo sem uso ou quando a conta é aberta em outro aparelho. Basta entrar de novo — seus dados continuam intactos.',
    fator: 'Login vencido ou encerrado',
    passos: [
      'Entre na sua conta novamente.',
      'Se você acabou de entrar em outro celular ou computador, esta sessão pode ter sido encerrada por isso.',
    ],
    tentarNovamenteResolve: false,
    recarregarResolve: false,
    gravidade: 'aviso',
  },
  'sem-permissao': {
    icone: 'bloqueado',
    titulo: 'Este conteúdo não está liberado para a sua conta',
    resumo:
      'A página existe, mas o seu plano ou perfil atual não dá acesso a ela. Nada quebrou — é uma trava de permissão.',
    fator: 'Acesso não incluso no seu plano',
    passos: [
      'Confira em qual conta você está logado.',
      'Se o conteúdo faz parte de um plano superior, veja os planos disponíveis.',
      'Se você deveria ter acesso, fale com o suporte com o código de erro abaixo.',
    ],
    tentarNovamenteResolve: false,
    recarregarResolve: false,
    gravidade: 'aviso',
  },
  'nao-encontrado': {
    icone: 'bussola',
    titulo: 'Esta página não existe (ou saiu do ar)',
    resumo:
      'O endereço aberto não corresponde a nenhuma página do DomineAqui. Pode ser um link antigo, um conteúdo que mudou de lugar ou um erro de digitação.',
    fator: 'Endereço inválido ou desatualizado',
    passos: [
      'Confira se o endereço foi copiado por inteiro.',
      'Use a busca para achar o material, a prova ou o card que você procurava.',
      'Se você chegou aqui por um link nosso, avise o suporte — é bug do link.',
    ],
    tentarNovamenteResolve: false,
    recarregarResolve: false,
    gravidade: 'aviso',
  },
  'muitas-tentativas': {
    icone: 'ampulheta',
    titulo: 'Muitas tentativas em pouco tempo',
    resumo:
      'Nosso limite de segurança pausou os pedidos vindos deste aparelho por alguns instantes. É temporário e não afeta sua conta.',
    fator: 'Limite de requisições atingido',
    passos: [
      'Espere de 30 a 60 segundos antes de tentar de novo.',
      'Evite recarregar a página várias vezes seguidas — isso reinicia a contagem.',
    ],
    tentarNovamenteResolve: true,
    recarregarResolve: false,
    gravidade: 'aviso',
  },
  servidor: {
    icone: 'servidor',
    titulo: 'A falha foi do nosso lado',
    resumo:
      'O seu aparelho e a sua internet estão bem: quem não conseguiu responder foi o nosso servidor. A equipe já recebeu o registro deste erro.',
    fator: 'Instabilidade no servidor',
    passos: [
      'Tente de novo em alguns instantes — boa parte dessas falhas é passageira.',
      'Se persistir, mande o código de erro abaixo para o suporte: ele aponta direto o que falhou.',
    ],
    tentarNovamenteResolve: true,
    recarregarResolve: true,
    gravidade: 'erro',
  },
  armazenamento: {
    icone: 'disco',
    titulo: 'O armazenamento do navegador está cheio',
    resumo:
      'O DomineAqui guarda no seu aparelho coisas como progresso de leitura e materiais para acesso offline. Não sobrou espaço para gravar, e isso derrubou a tela.',
    fator: 'Espaço local esgotado',
    passos: [
      'Libere espaço no aparelho ou limpe os dados de sites que você não usa.',
      'No modo anônimo, o espaço é bem menor — abra o DomineAqui numa janela normal.',
      'Se você baixou muitos materiais para offline, apague os que já estudou.',
    ],
    tentarNovamenteResolve: false,
    recarregarResolve: true,
    gravidade: 'erro',
  },
  memoria: {
    icone: 'chip',
    titulo: 'O navegador ficou sem memória',
    resumo:
      'A página pesou mais do que o aparelho conseguiu segurar — costuma acontecer com PDFs grandes, muitas abas abertas ao mesmo tempo ou celulares mais simples.',
    fator: 'Memória do aparelho esgotada',
    passos: [
      'Feche as outras abas e os apps em segundo plano, depois tente de novo.',
      'Ligue o Modo Lite do DomineAqui: ele reduz animações e efeitos pesados.',
      'Em PDFs muito grandes, abrir por partes evita o estouro.',
    ],
    tentarNovamenteResolve: true,
    recarregarResolve: true,
    gravidade: 'erro',
  },
  interferencia: {
    icone: 'quebra-cabeca',
    titulo: 'Algo alterou a página antes dela abrir',
    resumo:
      'Uma extensão do navegador, um bloqueador de anúncios ou o tradutor automático mexeu no conteúdo enquanto a página montava, e ela não conseguiu se completar.',
    fator: 'Extensão ou tradutor do navegador',
    passos: [
      'Desligue o tradutor automático nesta página (o DomineAqui já é em português).',
      'Teste numa janela anônima: lá as extensões ficam desativadas por padrão.',
      'Se funcionar no anônimo, o culpado é uma extensão — normalmente bloqueador de anúncios ou antivírus de navegador.',
    ],
    tentarNovamenteResolve: true,
    recarregarResolve: true,
    gravidade: 'aviso',
  },
  desconhecido: {
    icone: 'alerta',
    titulo: 'Algo deu errado ao abrir esta tela',
    resumo:
      'Não foi possível identificar a causa exata — mas o registro do erro já foi gerado, e os detalhes técnicos ficam logo abaixo para o suporte.',
    fator: 'Falha inesperada na aplicação',
    passos: [
      'Tente de novo: boa parte dessas falhas não se repete.',
      'Se repetir, recarregue a página inteira.',
      'Se ainda assim continuar, copie os detalhes e mande para o suporte.',
    ],
    tentarNovamenteResolve: true,
    recarregarResolve: true,
    gravidade: 'erro',
  },
}

/** Texto pronto de uma categoria, para telas que já sabem a causa (o 404). */
export function diagnosticoDe(categoria: CategoriaDeErro): Diagnostico {
  return { categoria, ...CONTEUDO[categoria] }
}

/** Junta a classificação com o texto que a tela mostra. */
export function diagnosticar(entrada: EntradaDeDiagnostico): Diagnostico {
  const categoria = classificarErro(entrada)
  return { categoria, ...CONTEUDO[categoria] }
}

/**
 * Código curto para a pessoa ditar ao suporte.
 *
 * O `digest` do Next é um número longo e o erro de cliente às vezes nem tem um.
 * Este código é derivado do que houver (digest, nome, mensagem) de forma
 * determinística: o mesmo erro gera sempre o mesmo código, então dois usuários
 * relatando "DA-7F3K-2B" estão relatando a mesma falha.
 */
export function gerarCodigoDeErro(entrada: EntradaDeDiagnostico): string {
  const semente =
    `${entrada.digest ?? ''}|${entrada.nome ?? ''}|${entrada.mensagem ?? ''}|${entrada.status ?? ''}`.trim()
  if (!semente || semente === '|||') return 'DA-0000-00'

  // djb2: pequeno, estável entre servidor e cliente, e sem dependência.
  let hash = 5381
  for (let i = 0; i < semente.length; i += 1) {
    hash = ((hash << 5) + hash + semente.charCodeAt(i)) >>> 0
  }
  const base = hash.toString(36).toUpperCase().padStart(7, '0')
  return `DA-${base.slice(0, 4)}-${base.slice(4, 6)}`
}

/**
 * Traduz `navigator.connection.effectiveType` para algo que se leia.
 *
 * O valor bruto ('slow-2g', '4g') não diz nada a quem não é da área, e é
 * justamente o sinal mais útil quando o erro é de rede.
 */
export function descreverConexao(
  tipo: string | null | undefined,
  online: boolean,
): string {
  if (!online) return 'Sem conexão'
  switch (tipo) {
    case 'slow-2g':
      return 'Muito lenta (2G)'
    case '2g':
      return 'Lenta (2G)'
    case '3g':
      return 'Moderada (3G)'
    case '4g':
      return 'Boa (4G ou melhor)'
    default:
      return 'Conectado'
  }
}

/** Nome do navegador/aparelho a partir do user agent, só para o painel. */
export function descreverAparelho(userAgent: string | null | undefined): string {
  const ua = userAgent ?? ''
  if (!ua) return 'Navegador não identificado'

  const sistema = /iPhone|iPad|iPod/i.test(ua)
    ? 'iPhone/iPad'
    : /Android/i.test(ua)
      ? 'Android'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS X/i.test(ua)
          ? 'Mac'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Sistema desconhecido'

  // A ordem é obrigatória: Edge, Opera e Samsung Internet carregam "Chrome" no
  // user agent, e o Chrome carrega "Safari". Do mais específico ao mais geral.
  const navegador = /Edg\//i.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/i.test(ua)
      ? 'Opera'
      : /SamsungBrowser/i.test(ua)
        ? 'Samsung Internet'
        : /FxiOS|Firefox/i.test(ua)
          ? 'Firefox'
          : /CriOS|Chrome/i.test(ua)
            ? 'Chrome'
            : /Safari/i.test(ua)
              ? 'Safari'
              : 'Navegador desconhecido'

  return `${navegador} · ${sistema}`
}
