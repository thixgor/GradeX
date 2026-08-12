/**
 * Conteúdo da instalação do app (PWA) — texto, benefícios e dúvidas.
 *
 * Por que existe: até aqui a mesma conversa ("instale o DomineAqui no seu
 * celular") era escrita em três lugares diferentes — a seção `#app` da landing,
 * a página `/instalar` e a faixa flutuante. Cada uma com o seu texto, e as três
 * divergindo: a landing dizia "no seu iPhone" e ensinava o Compartilhar do
 * Safari para quem estava num Galaxy, enquanto `/instalar` já sabia detectar o
 * Samsung Internet.
 *
 * Agora o texto mora aqui e a UI mora num componente só. Mudar uma frase muda
 * em todo lugar; não existe mais "a versão antiga do argumento" perdida numa
 * seção que ninguém lembra de atualizar.
 *
 * Este módulo é puro (sem React, sem `window`) para poder ser testado.
 */

import {
  ehAndroid,
  ehAparelhoSamsung,
  ehIos,
  instrucoesDe,
  type PlataformaInstalacao,
} from './instalacao'

/** Rota canônica da experiência de instalação. */
export const CAMINHO_INSTALACAO = '/instalar'

/**
 * Atalho divulgado por fora (Instagram, WhatsApp, aula): `/app` redireciona
 * para `/instalar` no `next.config.js`. É mais curto de ditar em voz alta do
 * que "barra instalar", e é o que o QR code carrega.
 */
export const CAMINHO_CURTO = '/app'

/** Como o endereço aparece escrito na tela (sem `https://`, que ninguém lê). */
export const ENDERECO_CURTO = 'domineaqui.com.br/app'

/**
 * O atalho absoluto, para o QR code e para o botão de copiar.
 *
 * Fica escrito aqui em vez de vir do `absoluteUrl` de `lib/seo` porque este
 * módulo é importado por componentes de cliente, e `lib/seo` arrasta o driver
 * do Mongo para o bundle do navegador. E, para um QR, o endereço de produção é
 * o certo mesmo em desenvolvimento: quem escaneia é um celular de verdade, que
 * não enxerga o `localhost` de quem está com a página aberta.
 */
export const URL_CURTA = `https://${ENDERECO_CURTO}`

/* =================== TÍTULO E CHAMADA =================== */

export const SELO = 'Grátis · sem app store'

/**
 * "no seu Samsung" vale mais que "no seu celular": a pessoa reconhece o
 * aparelho na frase e entende que a instrução é para ela. O modelo (`SM-…`)
 * aparece no user agent de qualquer navegador Android da Samsung.
 */
export function nomeDoAparelho(
  plataforma: PlataformaInstalacao,
  userAgent = '',
): string {
  if (ehAparelhoSamsung(userAgent)) return 'no seu Samsung'
  if (ehAndroid(plataforma)) return 'no seu Android'
  if (ehIos(plataforma)) return 'no seu iPhone'
  if (plataforma === 'desktop') return 'no seu computador'
  return 'no seu celular'
}

export function tituloPara(
  plataforma: PlataformaInstalacao,
  userAgent = '',
): string {
  return `O DomineAqui ${nomeDoAparelho(plataforma, userAgent)}`
}

export const CHAMADA =
  'Instale a plataforma como app: ícone na tela de início, abertura em tela cheia e atalhos para Provas, Questões, Flashcards e Cronograma no toque longo. Ocupa menos de 1 MB.'

/* =================== ABAS DO PASSO A PASSO =================== */

/**
 * As abas cobrem 99% de quem abre isto no Brasil. A ordem não é alfabética: o
 * Samsung Internet vem primeiro porque o Galaxy é o aparelho mais comum entre
 * os alunos e é o navegador que já vem aberto nele.
 */
export const ABAS: ReadonlyArray<{
  id: PlataformaInstalacao
  rotulo: string
  /** Chave do ícone; o desenho fica na UI, não no conteúdo. */
  icone: 'samsung' | 'chrome' | 'firefox' | 'apple' | 'monitor'
}> = [
  { id: 'android-samsung', rotulo: 'Samsung Internet', icone: 'samsung' },
  { id: 'android-chromium', rotulo: 'Chrome (Android)', icone: 'chrome' },
  { id: 'android-firefox', rotulo: 'Firefox (Android)', icone: 'firefox' },
  { id: 'ios-safari', rotulo: 'iPhone e iPad', icone: 'apple' },
  { id: 'desktop', rotulo: 'Computador', icone: 'monitor' },
]

/**
 * Qual aba abre por padrão, dado o aparelho detectado.
 *
 * `android-outro` e `ios-outro-navegador` não têm aba própria — seriam duas
 * abas que quase ninguém clica — então caem na aba equivalente mais útil. O
 * passo a passo em si continua sendo o específico da plataforma real, porque
 * quem decide isso é `instrucoesDe`, não a aba.
 */
export function abaInicial(plataforma: PlataformaInstalacao): PlataformaInstalacao {
  if (plataforma === 'android-outro') return 'android-chromium'
  if (plataforma === 'ios-outro-navegador') return 'ios-safari'
  if (ABAS.some((aba) => aba.id === plataforma)) return plataforma
  return 'android-samsung'
}

/**
 * A aba `id` corresponde ao aparelho de quem está lendo? Serve para marcar a
 * aba com "seu aparelho" — sem isso, a pessoa não sabe se a aba que abriu
 * sozinha é palpite ou detecção.
 */
export function ehAbaDoAparelho(
  id: PlataformaInstalacao,
  plataforma: PlataformaInstalacao,
): boolean {
  if (plataforma === 'desconhecida') return false
  return abaInicial(plataforma) === id
}

/** Rótulo do navegador detectado, para a frase "Detectamos: …". */
export function rotuloDetectado(plataforma: PlataformaInstalacao): string | null {
  if (plataforma === 'desconhecida') return null
  return instrucoesDe(plataforma).aparelho
}

/* =================== O QUE MUDA AO INSTALAR =================== */

export const BENEFICIOS: ReadonlyArray<{
  icone: 'casa' | 'tela' | 'atalho' | 'atualiza'
  titulo: string
  texto: string
}> = [
  {
    icone: 'casa',
    titulo: 'Ícone na tela de início',
    texto: 'Fica ao lado dos seus outros apps. Um toque e você está estudando.',
  },
  {
    icone: 'tela',
    titulo: 'Abre em tela cheia',
    texto: 'Sem barra de endereço roubando espaço da questão, do flashcard e do PDF.',
  },
  {
    icone: 'atalho',
    titulo: 'Atalhos no toque longo',
    texto: 'Provas, Questões, Flashcards e Cronograma direto do ícone.',
  },
  {
    icone: 'atualiza',
    titulo: 'Sempre na última versão',
    texto: 'Atualiza sozinho — nunca existe "versão velha" esperando download.',
  },
]

/* =================== DÚVIDAS =================== */

/**
 * As quatro perguntas que aparecem no suporte toda semana. Estão aqui, na
 * própria tela de instalação, porque é onde elas nascem.
 */
export const DUVIDAS: ReadonlyArray<{ pergunta: string; resposta: string }> = [
  {
    pergunta: 'Preciso baixar da Play Store ou da App Store?',
    resposta:
      'Não. O DomineAqui é instalado pelo próprio navegador, que coloca o ícone na sua tela de início. Não passa por loja de aplicativos nenhuma — e por isso também não tem espera de aprovação nem atualização para baixar.',
  },
  {
    pergunta: 'Ocupa muito espaço no celular?',
    resposta:
      'Menos de 1 MB. O que fica salvo é a casca do app; o conteúdo continua vindo da internet, exatamente como no site.',
  },
  {
    pergunta: 'Funciona sem internet?',
    resposta:
      'O app abre sem conexão e avisa que você está offline. Provas, questões, materiais e flashcards precisam de internet para carregar.',
  },
  {
    pergunta: 'E se eu trocar de celular?',
    resposta:
      'Instale de novo no aparelho novo e entre com a mesma conta. Seu histórico, suas provas e seu cronograma ficam na conta, não no aparelho.',
  },
]
