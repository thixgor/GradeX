/**
 * PORTÃO JURÍDICO DO MANUAL DA HISTOLOGIA — leia antes de mexer.
 *
 * O acervo do Digital Histology (Virginia Commonwealth University) está sob
 * CC BY-NC-SA 4.0. A cláusula NãoComercial é, por padrão, incompatível com
 * paywall, assinatura, promoção de produto e CTA comercial contextual. O Domine Aqui
 * tem fluxo Plus+/assinatura. Logo, este módulo **não pode ir ao ar** enquanto
 * uma destas três rotas não estiver registrada em `AUTORIZACAO`:
 *
 *   1. o Manual da Histologia permanece integralmente gratuito, sem paywall,
 *      sem CTA comercial contextual e tecnicamente separado de benefícios
 *      pagos;
 *   2. existe autorização escrita dos titulares, arquivada no projeto; ou
 *   3. o responsável pelo produto assume, por decisão registrada aqui, o risco
 *      de restringir o módulo a assinantes enquanto a autorização escrita não
 *      chega (`'privativo-assinantes'`).
 *
 * Enquanto `AUTORIZACAO.decisao === 'pendente'`, a flag fica desligada em
 * produção e as rotas devolvem 404. Desenvolvimento e revisão continuam
 * liberados — é exatamente o que `LICENCA_E_PUBLICACAO.md` autoriza.
 *
 * ## Estado atual: privativo, com pendência jurídica declarada
 *
 * O módulo passou a ser privativo de assinantes do Manual Clínico e de contas
 * Plus+ em 2026-08-13, por decisão do responsável pelo produto. Isso **não**
 * resolve a cláusula NãoComercial: a pendência continua aberta e está declarada
 * em `PENDENCIA_NAO_COMERCIAL`, para que ninguém a descubra por acidente.
 *
 * O portão vive num só lugar — `lib/histologia/acesso.ts`, aplicado pelo layout
 * do módulo. Não espalhe checagem de acesso por página: quando a autorização
 * escrita chegar (ou a decisão voltar atrás), quem reverte precisa ter um único
 * arquivo para mexer.
 */

export type DecisaoDeLicenca =
  | 'pendente'
  | 'gratuito-sem-exploracao-comercial'
  | 'autorizacao-escrita-arquivada'
  | 'privativo-assinantes'

export interface RegistroDeAutorizacao {
  decisao: DecisaoDeLicenca
  /** Data ISO em que a decisão foi registrada. Vazio enquanto pendente. */
  registradoEm: string
  /** Quem registrou (pessoa responsável, não "o time"). */
  responsavel: string
  /** Caminho do documento arquivado, quando a rota for autorização escrita. */
  documento: string | null
  observacao: string
}

/**
 * ESTADO ATUAL: privativo de assinantes.
 *
 * Decisão registrada por throdrigf@gmail.com em 2026-08-13, substituindo a Rota
 * A de 2026-08-07: o Manual da Histologia passa a ser **privativo de assinantes
 * do Manual Clínico e de contas Plus+**. Quem não assina — inclusive visitante
 * sem login — recebe a landing de vendas na mesma URL, em vez do acervo.
 *
 * A decisão é do responsável pelo produto e está registrada como tal. O que ela
 * **não** faz é resolver a cláusula NãoComercial: ver `PENDENCIA_NAO_COMERCIAL`
 * e `docs/adr/0003-histologia-privativa-assinantes.md`.
 *
 * Isso libera a *publicação*, mas não a *disponibilidade*: em produção o
 * módulo ainda exige `HISTOLOGIA_HABILITADO=1` no ambiente.
 */
export const AUTORIZACAO: RegistroDeAutorizacao = {
  decisao: 'privativo-assinantes',
  registradoEm: '2026-08-13',
  responsavel: 'throdrigf@gmail.com',
  documento: null,
  observacao:
    'Módulo restrito a assinantes do Manual Clínico e contas Plus+ por decisão do responsável ' +
    'pelo produto, que assume o risco enquanto a autorização escrita dos titulares do acervo não ' +
    'é obtida e arquivada. O portão fica num único ponto (lib/histologia/acesso.ts, aplicado pelo ' +
    'layout do módulo) justamente para poder ser revertido num arquivo só. Seguem pendentes: ' +
    'autorização escrita da VCU, envio do acervo ao Vercel Blob (ver ' +
    'public/Manual-Histologia/IMPLEMENTACAO.md) e revisão biomédica do conteúdo, que continua ' +
    'marcado como pendente-de-revisao em toda página e quiz.',
}

/**
 * Pendência jurídica que a decisão de restringir **não** resolve.
 *
 * Fica exportada, e não escondida num comentário, porque o teste do módulo a
 * exige enquanto o acesso for pago e sem documento arquivado: é a diferença
 * entre um risco assumido com registro e um risco descoberto depois.
 */
export const PENDENCIA_NAO_COMERCIAL: string | null =
  AUTORIZACAO.decisao === 'privativo-assinantes' && !AUTORIZACAO.documento
    ? 'O acervo é CC BY-NC-SA 4.0 e o módulo está atrás de assinatura sem autorização escrita ' +
      'dos titulares arquivada. Risco assumido pelo responsável pelo produto em ' +
      `${AUTORIZACAO.registradoEm}. Para encerrar a pendência: obtenha a autorização, arquive-a ` +
      'no projeto e mude a decisão para "autorizacao-escrita-arquivada". Para reverter: volte a ' +
      'decisão para "gratuito-sem-exploracao-comercial" e libere o portão em lib/histologia/acesso.ts.'
    : null

/** A decisão registrada libera publicação em produção? */
export function licencaPermitePublicar(): boolean {
  return AUTORIZACAO.decisao !== 'pendente'
}

/**
 * O módulo é privativo neste estado de licença?
 *
 * É a única fonte da verdade sobre isso. `lib/histologia/acesso.ts` pergunta
 * aqui antes de consultar sessão e banco — assim, voltar o módulo a gratuito é
 * trocar a decisão registrada, e não caçar checagens espalhadas.
 */
export function histologiaEhPrivativa(): boolean {
  return AUTORIZACAO.decisao === 'privativo-assinantes'
}

/**
 * Flag de disponibilidade do módulo.
 *
 * Em produção exige *as duas* condições: decisão de licença registrada **e**
 * `HISTOLOGIA_HABILITADO=1`. Fora de produção o módulo abre para que a revisão
 * editorial e biomédica possa acontecer — que é o único jeito de sair do
 * estado pendente.
 */
export function histologiaHabilitada(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  if (!licencaPermitePublicar()) return false
  return process.env.HISTOLOGIA_HABILITADO === '1'
}

/**
 * Pendência jurídica, independente do ambiente.
 *
 * Separada de `motivoDoBloqueio` de propósito: em desenvolvimento o módulo abre
 * (é preciso revisar para sair da pendência), mas a pendência continua
 * existindo. Confundir "está aberto aqui" com "está liberado" é exatamente como
 * conteúdo NãoComercial acaba atrás de paywall.
 */
export function pendenciaDeLicenca(): string | null {
  if (licencaPermitePublicar()) return null
  return (
    'Portão de licença pendente: nenhuma decisão registrada em AUTORIZACAO. ' +
    'Veja lib/histologia/licenca.ts e docs/adr/0001-licenca-manual-histologia.md.'
  )
}

/**
 * Motivo pelo qual o módulo está fechado *neste ambiente*, para log de
 * servidor. Nunca exiba ao usuário final: em produção bloqueada a rota deve
 * responder 404 seco, sem anunciar que existe conteúdo escondido ali.
 */
export function motivoDoBloqueio(): string | null {
  if (histologiaHabilitada()) return null
  return (
    pendenciaDeLicenca() ??
    'Licença liberada, mas HISTOLOGIA_HABILITADO não está definido como "1" neste ambiente.'
  )
}

/** Este módulo pode ser indexado por buscadores? Só quando publicável. */
export function podeIndexar(): boolean {
  return histologiaHabilitada() && licencaPermitePublicar()
}

export const LICENCA = {
  identificador: 'CC BY-NC-SA 4.0',
  nome: 'Creative Commons Atribuição-NãoComercial-CompartilhaIgual 4.0 Internacional',
  url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-BR',
  urlCreditos: 'https://digitalhistology.org/credits/',
  titulares: [
    'Digital Histology',
    'Virginia Commonwealth University School of Medicine',
    'VCU ALT Lab',
  ],
} as const

/**
 * Crédito-base exigido por `LICENCA_E_PUBLICACAO.md`. Aparece no rodapé de toda
 * lâmina e na gaveta de créditos; os créditos específicos de cada imagem vêm
 * junto, do campo `creditos` da página.
 */
export const CREDITO_BASE =
  'Conteúdo visual adaptado de Digital Histology (Virginia Commonwealth University), ' +
  'CC BY-NC-SA 4.0; reorganização, interface e conteúdo complementar em português ' +
  'pelo Manual Clínico.'

/**
 * Declaração de alterações — obrigação da cláusula BY. Precisa ser específica:
 * "adaptamos" não cumpre a licença, listar o que foi feito cumpre.
 */
export const ALTERACOES_REALIZADAS = [
  'Reorganização do catálogo em currículo navegável, com rotas e hierarquia próprias.',
  'Tradução e revisão editorial para português brasileiro dos títulos, descrições e rótulos.',
  'Criação de interface nativa (microscópio virtual, atlas, laboratório e quizzes) sem reuso do HTML de origem.',
  'Acréscimo de metadados: identificadores estáveis, SHA-256, proveniência e estado editorial.',
  'Conversão dos quizzes H5P em componentes próprios, preservando enunciado, alternativas, gabarito e devolutiva.',
] as const

export const AVISO_EDUCACIONAL =
  'Material educacional de histologia. Não substitui laudo anatomopatológico, avaliação ' +
  'clínica, protocolo institucional ou orientação profissional.'
