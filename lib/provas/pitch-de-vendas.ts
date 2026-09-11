import { SIDEBAR_SECTION_DEFINITIONS } from '@/lib/sidebar-sections'
import { isPaidAccount, ROTA_ASSINATURA } from '@/lib/account-tier'
import type { Exam } from '@/lib/types'

/**
 * O pitch de vendas do fim da prova.
 *
 * ## O beco que ele fecha
 *
 * A plataforma aplica provas gratuitas. O aluno chega pelo link, responde
 * sessenta questões, vê a nota — e vai embora. Nesse instante ele é a pessoa
 * mais qualificada que vai passar pelo site no dia: acabou de gastar duas
 * horas estudando aqui, sabe do que precisa e ainda está com a tela aberta. E
 * a tela não dizia nada. Terminava em "Voltar para Início".
 *
 * Este módulo é o que a tela passa a dizer.
 *
 * ## A regra que manda em tudo: destino é SEÇÃO, não link
 *
 * Cada destino do pitch é uma **rota interna** (`/buy`, `/materiais`), e a
 * tela navega com o roteador do Next. Nunca `window.open`, nunca
 * `target="_blank"`.
 *
 * O motivo é o aplicativo. Boa parte dos alunos entra pelo app instalado
 * (PWA/WebView): lá, um link externo abre uma aba do navegador POR CIMA do
 * app — a pessoa perde a sessão de vista, volta no botão do sistema e às
 * vezes cai fora do aplicativo. Uma navegação interna troca a seção sem sair
 * do lugar, mantendo histórico, barra e sessão. `ehDestinoInterno` recusa
 * qualquer endereço que não seja uma rota deste site, e é por ela que passa
 * tudo que vem do banco.
 *
 * ## Por que existem MODELOS, e não um campo de texto
 *
 * O admin é professor, não copywriter. Pedir "escreva seu pitch" devolve, na
 * prática, "Assine o plano" — que é exatamente o anúncio que ninguém lê. Os
 * modelos daqui aplicam, cada um, UMA técnica de persuasão conhecida
 * (ver `MODELOS_DE_PITCH`), e cada um carrega a explicação do princípio para
 * quem escolhe entender o que está escolhendo.
 *
 * O campo livre continua existindo (`personalizado`): quem tem uma oferta
 * concreta — uma turma, um prazo real, um desconto — escreve a dela.
 *
 * ## A linha que não se cruza
 *
 * Nenhum modelo inventa número, prazo ou vaga. O texto sobre escassez fala do
 * que é verdade (a prova gratuita acabou; a conta continua aberta) e nunca de
 * um relógio que não existe. Prova social só aparece com o número real de
 * contas, e some quando esse número não chega. É decisão de produto, e é
 * também a conclusão do material que originou esta funcionalidade:
 * persuasão sem confiança é manipulação, e manipulação hoje só custa a marca.
 */

// ────────────────────────────────────────────────────────────────────────────
// Destinos
// ────────────────────────────────────────────────────────────────────────────

export interface DestinoDoPitch {
  /** Chave gravada no documento da prova. */
  chave: string
  rotulo: string
  /** Rota INTERNA. Ver `ehDestinoInterno`. */
  href: string
  /** Uma linha, mostrada no cartão do aluno e na lista do admin. */
  descricao: string
}

/**
 * Uma rota deste site, e não um endereço qualquer.
 *
 * Recusa `http(s)://`, `//host` (que o navegador lê como protocolo relativo e
 * leva para fora), `javascript:` e qualquer coisa que não comece com uma
 * barra. É a checagem que impede um valor gravado no banco de virar uma aba
 * nova — ou pior, um endereço de terceiro dentro de um botão nosso.
 */
export function ehDestinoInterno(href: unknown): href is string {
  return typeof href === 'string' && /^\/(?!\/)[^\s]*$/.test(href)
}

/**
 * O catálogo de destinos.
 *
 * A maior parte vem de `SIDEBAR_SECTION_DEFINITIONS` — as mesmas seções que o
 * aluno tem no menu, com o mesmo rótulo e a mesma rota. Copiar essa lista
 * aqui seria assinar a promessa de mantê-la em dia para sempre; derivá-la faz
 * uma seção nova aparecer no pitch no dia em que aparece no menu.
 *
 * Na frente entram os destinos comerciais, que não são seções do menu:
 * `Planos` é a página de assinatura (`ROTA_ASSINATURA`).
 */
export const DESTINOS_DO_PITCH: DestinoDoPitch[] = [
  {
    chave: 'planos',
    // "Planos", e não "Planos e assinatura": o rótulo é enumerado dentro de
    // frases ("fica em Planos e Materiais"), e um rótulo com "e" no meio vira
    // uma lista de quatro itens onde havia duas seções.
    rotulo: 'Planos',
    href: ROTA_ASSINATURA,
    descricao: 'A página de planos, com preço, o que entra em cada um e a garantia.',
  },
  ...SIDEBAR_SECTION_DEFINITIONS.map((secao) => ({
    chave: secao.key as string,
    rotulo: secao.label,
    href: secao.href,
    descricao: secao.description,
  })),
].filter((destino) => ehDestinoInterno(destino.href))

const DESTINO_POR_CHAVE = new Map(DESTINOS_DO_PITCH.map((destino) => [destino.chave, destino]))

/**
 * Quantos destinos cabem num pitch.
 *
 * Acima disso o cartão deixa de ser um convite e vira um menu — e um menu no
 * fim da prova é a mesma coisa que nenhum botão: a pessoa não escolhe, fecha.
 */
export const MAXIMO_DE_DESTINOS = 4

/** Traduz as chaves gravadas para destinos de verdade, na ordem escolhida. */
export function resolverDestinos(chaves: unknown): DestinoDoPitch[] {
  if (!Array.isArray(chaves)) return []
  const vistos = new Set<string>()
  const destinos: DestinoDoPitch[] = []

  for (const bruta of chaves) {
    const chave = typeof bruta === 'string' ? bruta.trim() : ''
    if (!chave || vistos.has(chave)) continue
    const destino = DESTINO_POR_CHAVE.get(chave)
    // Chave desconhecida é seção que deixou de existir (ou lixo): sai calada,
    // em vez de virar um botão que leva a um 404.
    if (!destino) continue
    vistos.add(chave)
    destinos.push(destino)
    if (destinos.length >= MAXIMO_DE_DESTINOS) break
  }

  return destinos
}

// ────────────────────────────────────────────────────────────────────────────
// O que fica gravado na prova
// ────────────────────────────────────────────────────────────────────────────

export type ChaveDeModeloDePitch =
  | 'prova-social'
  | 'autoridade'
  | 'emocional'
  | 'logica'
  | 'valores'
  | 'escassez-honesta'
  | 'personalizado'

export interface PitchPersonalizado {
  titulo: string
  /** Corpo livre. Linhas em branco separam parágrafos. */
  texto: string
  /** Rótulo do botão principal. Vazio = o padrão do cartão. */
  chamada: string
}

export interface PitchDeVendas {
  /** Nasce DESLIGADO. Uma prova que ninguém configurou não vende nada. */
  ativo: boolean
  modelo: ChaveDeModeloDePitch
  /** Chaves de `DESTINOS_DO_PITCH`, na ordem em que aparecem. */
  destinos: string[]
  personalizado: PitchPersonalizado
  email: {
    ativo: boolean
    /** Vazio = o assunto do modelo escolhido. */
    assunto: string
  }
  /**
   * Esconder de quem já paga.
   *
   * Ligado por padrão, e é a regra mais fácil de esquecer: vender o plano
   * para quem acabou de assiná-lo não é neutro, é dizer à pessoa que o
   * sistema não sabe quem ela é. Admin entra na mesma conta (ver
   * `isPaidAccount`), o que também mantém a tela limpa em prova de teste.
   */
  esconderDeAssinantes: boolean
}

export const PITCH_PADRAO: PitchDeVendas = {
  ativo: false,
  modelo: 'prova-social',
  destinos: [],
  personalizado: { titulo: '', texto: '', chamada: '' },
  email: { ativo: false, assunto: '' },
  esconderDeAssinantes: true,
}

const MODELOS_VALIDOS = new Set<ChaveDeModeloDePitch>([
  'prova-social',
  'autoridade',
  'emocional',
  'logica',
  'valores',
  'escassez-honesta',
  'personalizado',
])

/** Corta e limita um texto vindo do formulário. */
function texto(valor: unknown, limite: number): string {
  return typeof valor === 'string' ? valor.trim().slice(0, limite) : ''
}

export const LIMITE_DE_TITULO = 120
export const LIMITE_DE_TEXTO = 1500
export const LIMITE_DE_CHAMADA = 40
export const LIMITE_DE_ASSUNTO = 120

/**
 * O bloco como ele fica gravado.
 *
 * Booleano é `=== true`: um `"false"` em texto, que qualquer formulário mal
 * serializado produz, é verdadeiro em JavaScript e ligaria um pitch que
 * ninguém pediu. `esconderDeAssinantes` é a exceção — ele é `!== false`,
 * porque o padrão dele é LIGADO e um documento antigo (sem o campo) precisa
 * continuar protegido.
 */
export function normalizarPitch(valor: unknown): PitchDeVendas {
  const bruto = (valor || {}) as Record<string, any>
  const modelo: ChaveDeModeloDePitch = MODELOS_VALIDOS.has(bruto.modelo)
    ? bruto.modelo
    : PITCH_PADRAO.modelo

  return {
    ativo: bruto.ativo === true,
    modelo,
    destinos: resolverDestinos(bruto.destinos).map((destino) => destino.chave),
    personalizado: {
      titulo: texto(bruto.personalizado?.titulo, LIMITE_DE_TITULO),
      texto: texto(bruto.personalizado?.texto, LIMITE_DE_TEXTO),
      chamada: texto(bruto.personalizado?.chamada, LIMITE_DE_CHAMADA),
    },
    email: {
      ativo: bruto.email?.ativo === true,
      assunto: texto(bruto.email?.assunto, LIMITE_DE_ASSUNTO),
    },
    esconderDeAssinantes: bruto.esconderDeAssinantes !== false,
  }
}

/** Lê o bloco do documento da prova. Prova sem pitch devolve o padrão. */
export function pitchDaProva(prova: Partial<Exam> | null | undefined): PitchDeVendas {
  return normalizarPitch((prova as any)?.pitchDeVendas)
}

/**
 * Este pitch tem como aparecer?
 *
 * Ligado não basta: um pitch sem destino é um cartão com um botão que não vai
 * a lugar nenhum, e um modelo personalizado sem texto é um cartão vazio. Nos
 * dois casos a resposta certa é não mostrar nada — e é também o que o painel
 * do admin usa para avisar que falta terminar de configurar.
 */
export function pitchEstaCompleto(pitch: PitchDeVendas): boolean {
  if (!pitch.ativo) return false
  if (resolverDestinos(pitch.destinos).length === 0) return false
  if (pitch.modelo === 'personalizado') {
    return pitch.personalizado.titulo.length > 0 || pitch.personalizado.texto.length > 0
  }
  return true
}

export interface QuemEsta {
  /** `accountType` da conta — ver `lib/account-tier.ts`. */
  accountType?: string | null
  isAdmin?: boolean
}

/**
 * Esta pessoa vê o pitch desta prova?
 *
 * O treino também vê. Era tentador poupar quem refaz a prova de treino, mas é
 * justamente quem voltou por conta própria uma segunda vez — o pitch existe
 * para essa pessoa antes de qualquer outra.
 */
export function pitchVisivelPara(prova: Partial<Exam> | null | undefined, quem: QuemEsta): boolean {
  const pitch = pitchDaProva(prova)
  if (!pitchEstaCompleto(pitch)) return false
  // `isPaidAccount` responde `true` para admin também — está documentado no
  // campo `esconderDeAssinantes`, e é o que mantém a tela limpa em teste.
  if (pitch.esconderDeAssinantes && isPaidAccount(quem.accountType, quem.isAdmin)) return false
  return true
}

// ────────────────────────────────────────────────────────────────────────────
// Os modelos
// ────────────────────────────────────────────────────────────────────────────

/** Os dados reais que o texto pode usar. Nada aqui é inventado no caminho. */
export interface DadosDoPitch {
  primeiroNome: string
  tituloDaProva: string
  /**
   * Aproveitamento em pontos percentuais (0–100), ou `null` quando a nota
   * ainda não é do aluno — prova avaliativa em andamento segura a nota até o
   * término (ver `lib/provas/nota-da-prova.ts`), e o pitch não é a porta dos
   * fundos dela.
   */
  aproveitamento: number | null
  /**
   * Prova social: quantas contas existem, já arredondado ("1.200+"). Vazio
   * quando o número não veio — e aí a frase que dependia dele não é escrita.
   */
  estudantes: string
  destinos: DestinoDoPitch[]
}

export interface PitchMontado {
  modelo: ChaveDeModeloDePitch
  /** A pastilha acima do título. */
  selo: string
  titulo: string
  paragrafos: string[]
  /** Rótulo do botão do primeiro destino. */
  chamada: string
  destinos: DestinoDoPitch[]
  email: {
    assunto: string
    /** A prévia: o que o e-mail mostra antes do botão. */
    paragrafos: string[]
  }
}

export interface ModeloDePitch {
  chave: ChaveDeModeloDePitch
  nome: string
  /** A técnica, com o nome que ela tem na literatura. */
  tecnica: string
  /** Uma linha: o que o modelo faz. Aparece na lista do admin. */
  principio: string
  /** O porquê, para quem quer entender antes de escolher. */
  comoFunciona: string
  /** Quando ESTE é o modelo certo — e quando não é. */
  quandoUsar: string
  montar: (dados: DadosDoPitch) => Omit<PitchMontado, 'modelo' | 'destinos'>
}

/** "Materiais", "Materiais e Planos", "Materiais, Planos e Aulas". */
export function listarRotulos(destinos: DestinoDoPitch[]): string {
  const rotulos = destinos.map((destino) => destino.rotulo)
  if (rotulos.length === 0) return 'a plataforma'
  if (rotulos.length === 1) return rotulos[0]
  return `${rotulos.slice(0, -1).join(', ')} e ${rotulos[rotulos.length - 1]}`
}

const primeiroDestino = (dados: DadosDoPitch) => dados.destinos[0]?.rotulo || 'a plataforma'

/**
 * Os modelos, um por técnica.
 *
 * A ordem é a da conversa que costuma funcionar com quem acabou de estudar:
 * primeiro pertencimento (prova social), depois credibilidade (ethos),
 * emoção (pathos), razão (logos), valores e, por último, o tempo.
 */
export const MODELOS_DE_PITCH: ModeloDePitch[] = [
  {
    chave: 'prova-social',
    nome: 'Prova social',
    tecnica: 'Prova social (social proof)',
    principio: 'Mostra que outras pessoas parecidas com ela já estão do outro lado.',
    comoFunciona:
      'Diante de uma decisão incerta, a pessoa olha para o que gente parecida com ela fez. ' +
      'É por isso que depoimento real rende mais que lista de recursos: um fala de quem usa, ' +
      'o outro fala do produto. Aqui a prova social é o número verdadeiro de contas da ' +
      'plataforma — quando ele não está disponível, a frase simplesmente não é escrita.',
    quandoUsar:
      'Bom para prova aberta, com muita gente de fora chegando pela primeira vez. ' +
      'Fraco em turma pequena e fechada, onde "todo mundo" são trinta pessoas que se conhecem.',
    montar: (dados) => {
      const paragrafos = [
        `Você acabou de fazer **${dados.tituloDaProva}** inteira, de graça. Quem chega até o fim ` +
          `de uma prova raramente para nela — a parte que continua fica em ${listarRotulos(dados.destinos)}.`,
      ]
      if (dados.estudantes) {
        paragrafos.push(
          `Somos **${dados.estudantes} estudantes** estudando no mesmo lugar. Não é um número ` +
            `para impressionar: é a razão de existir prova corrigida, material revisado e gente ` +
            `respondendo dúvida no fórum às onze da noite.`,
        )
      }
      paragrafos.push(
        'Estudar junto não é detalhe de conforto. É o que separa quem revisa do que quem só ' +
          'relê — e você já provou hoje que está no primeiro grupo.',
      )
      return {
        selo: 'Você não está sozinho nisso',
        titulo: `${dados.primeiroNome}, veja para onde a turma vai depois desta prova`,
        paragrafos,
        chamada: `Ver ${primeiroDestino(dados)}`,
        email: {
          assunto: `${dados.primeiroNome}, você terminou a prova. E agora?`,
          paragrafos: [
            `Você fez **${dados.tituloDaProva}** até o fim — e isso é mais do que a maioria faz.`,
            dados.estudantes
              ? `Tem ${dados.estudantes} estudantes estudando aqui todo dia. O próximo passo deles costuma ser ${listarRotulos(dados.destinos)}.`
              : `O próximo passo de quem termina uma prova aqui costuma ser ${listarRotulos(dados.destinos)}.`,
          ],
        },
      }
    },
  },
  {
    chave: 'autoridade',
    nome: 'Autoridade',
    tecnica: 'Ethos — credibilidade',
    principio: 'Liga o que ela já aprovou (a prova) ao que você quer mostrar.',
    comoFunciona:
      'Ethos é o primeiro dos três pilares de Aristóteles: antes de acreditar na mensagem, ' +
      'a pessoa decide se acredita em quem fala. A prova que ela acabou de responder é a ' +
      'credencial mais forte que você tem neste instante — ela passou duas horas conferindo ' +
      'a qualidade do seu material sem que ninguém pedisse. O pitch só nomeia essa ponte.',
    quandoUsar:
      'Bom quando a prova é densa e bem feita — o argumento é o próprio trabalho. ' +
      'Evite em prova curta ou de brincadeira: a credencial não sustenta o peso.',
    montar: (dados) => ({
      selo: 'A mesma origem',
      titulo: 'A prova que você acabou de fazer não veio de lugar nenhum',
      paragrafos: [
        `Cada enunciado de **${dados.tituloDaProva}** foi escrito, revisado e comentado pela ` +
          `mesma equipe que mantém ${listarRotulos(dados.destinos)}. Você passou as últimas ` +
          `horas conferindo esse trabalho de perto.`,
        'Se o nível da prova serviu para você, o resto vem do mesmo lugar e do mesmo cuidado — ' +
          'com a diferença de que lá o conteúdo não acaba quando o cronômetro para.',
      ],
      chamada: `Conhecer ${primeiroDestino(dados)}`,
      email: {
        assunto: `${dados.primeiroNome}, de onde veio a prova que você fez`,
        paragrafos: [
          `As questões de **${dados.tituloDaProva}** saíram da mesma equipe que mantém ${listarRotulos(dados.destinos)}.`,
          'Se o nível serviu, o resto do material vem do mesmo lugar.',
        ],
      },
    }),
  },
  {
    chave: 'emocional',
    nome: 'Emocional',
    tecnica: 'Pathos — inversão do papel',
    principio: 'Devolve o protagonismo: quem escolheu foi ela, e isso é dito em voz alta.',
    comoFunciona:
      'A decisão é tomada na emoção e justificada na lógica depois. O movimento mais forte ' +
      'não é falar bonito do produto: é inverter quem escolhe quem. Uma campanha clássica ' +
      'deixou crianças escolherem seus padrinhos, em vez de padrinhos escolherem crianças — ' +
      'e o doador passou a se sentir escolhido. Aqui o aluno não é alvo de uma oferta: ele é ' +
      'alguém que, num dia qualquer, sentou e fez uma prova inteira porque quis.',
    quandoUsar:
      'Bom para prova voluntária, feita fora de obrigação. ' +
      'Não use em prova aplicada obrigatoriamente — a premissa seria falsa, e soa falso.',
    montar: (dados) => ({
      selo: 'Entre nós',
      titulo: `${dados.primeiroNome}, ninguém te obrigou a fazer isso hoje`,
      paragrafos: [
        `Não havia chamada, presença nem nota na faculdade em jogo. Você abriu ` +
          `**${dados.tituloDaProva}**, sentou e foi até o fim. Isso diz mais sobre você do que ` +
          `qualquer nota que apareça nesta tela.`,
        'A gente conhece esse cansaço: estudar no escuro, sem saber se o que você está revisando ' +
          'é o que vai cair, sem ninguém para dizer "essa parte aí, olha de novo".',
        `${listarRotulos(dados.destinos)} existe para isso — para você não ter que adivinhar ` +
          `sozinho o que estudar amanhã.`,
      ],
      chamada: 'Continuar de onde eu parei',
      email: {
        assunto: `${dados.primeiroNome}, sobre a prova que você fez sem ninguém mandar`,
        paragrafos: [
          `Você abriu **${dados.tituloDaProva}** por conta própria e foi até o fim.`,
          'Fica um convite para não continuar estudando no escuro depois dela.',
        ],
      },
    }),
  },
  {
    chave: 'logica',
    nome: 'Lógica',
    tecnica: 'Logos — benefício que resolve um problema',
    principio: 'Parte do resultado da prova e mostra, em número, o que falta fechar.',
    comoFunciona:
      'Logos é o pilar da razão: a mensagem faz sentido e resolve um problema que a pessoa ' +
      'reconhece ter. É o modelo menos "publicitário" dos seis, e o mais difícil de discordar, ' +
      'porque o problema não é afirmado pelo anúncio — é o número que ela acabou de ver.',
    quandoUsar:
      'Bom quando a nota sai na hora (prova de treino ou já encerrada). ' +
      'Com a nota presa até o término, o texto cai para uma versão sem número — ainda funciona, ' +
      'mas o modelo perde o melhor argumento.',
    montar: (dados) => {
      const temNota = typeof dados.aproveitamento === 'number'
      const acertos = temNota ? Math.round(dados.aproveitamento as number) : 0
      const faltou = Math.max(0, 100 - acertos)

      return {
        selo: 'O que o resultado diz',
        titulo: temNota
          ? `Você acertou ${acertos}%. Os ${faltou}% que faltaram têm nome.`
          : 'A prova acabou. O que fazer com ela é a parte que conta.',
        paragrafos: [
          temNota
            ? `Errar questão não é sentença, é diagnóstico. Cada uma das que passaram tem um ` +
              `assunto atrás dela, e assunto é coisa que se estuda — desde que alguém te diga qual.`
            : `Fazer a prova é metade. A outra metade é descobrir quais assuntos derrubaram ` +
              `você — e essa parte quase ninguém faz, porque dá trabalho sozinho.`,
          `É exatamente isso que ${listarRotulos(dados.destinos)} faz por você: transforma erro ` +
            `em lista de estudo, com o conteúdo já do lado.`,
        ],
        chamada: 'Atacar o que ficou faltando',
        email: {
          assunto: temNota
            ? `${dados.primeiroNome}, os ${faltou}% que faltaram em ${dados.tituloDaProva}`
            : `${dados.primeiroNome}, o que fazer com a prova que você acabou de fazer`,
          paragrafos: [
            temNota
              ? `Você fechou ${acertos}% em **${dados.tituloDaProva}**. O que interessa agora são os ${faltou}% restantes.`
              : `Você terminou **${dados.tituloDaProva}**. O próximo passo é descobrir quais assuntos derrubaram você.`,
            `${listarRotulos(dados.destinos)} transforma esses erros em lista de estudo.`,
          ],
        },
      }
    },
  },
  {
    chave: 'valores',
    nome: 'Valores compartilhados',
    tecnica: 'Shared values — do recurso ao propósito',
    principio: 'Diz no que a plataforma acredita, e por que esta prova foi de graça.',
    comoFunciona:
      'A publicidade saiu de "o que o produto tem" para "o que o produto faz por você" e ' +
      'chegou em "no que nós dois acreditamos". Quem compra quer saber com o que está se ' +
      'alinhando. Aqui o valor não é uma frase de efeito: a prova gratuita que ela acabou de ' +
      'fazer é a prova material do que está sendo dito — ações batendo com o discurso.',
    quandoUsar:
      'Bom quando a gratuidade é mesmo política da casa, e não isca. ' +
      'Se a próxima prova for paga sem aviso, este é o modelo que mais machuca a confiança.',
    montar: (dados) => ({
      selo: 'Por que esta prova foi de graça',
      titulo: 'Prova boa não pode ser privilégio de quem paga',
      paragrafos: [
        `**${dados.tituloDaProva}** foi aberta, inteira e sem pegadinha, porque a gente acha que ` +
          `treinar para uma prova não deveria depender de quem pode pagar por isso.`,
        `O que a assinatura sustenta é o resto: ${listarRotulos(dados.destinos)}, revisados, ` +
          `atualizados e mantidos por gente que faz isso o dia inteiro.`,
        'Se você entrar, é porque concorda com o caminho — não porque alguém te empurrou.',
      ],
      chamada: `Ver ${primeiroDestino(dados)}`,
      email: {
        assunto: `Por que ${dados.tituloDaProva} foi de graça`,
        paragrafos: [
          'A prova foi aberta de propósito: treinar não deveria depender de quem pode pagar.',
          `O que a assinatura sustenta é o resto — ${listarRotulos(dados.destinos)}.`,
        ],
      },
    }),
  },
  {
    chave: 'escassez-honesta',
    nome: 'Escassez honesta',
    tecnica: 'Escassez — sem relógio falso',
    principio: 'Usa o único limite que é verdade: a prova gratuita acabou.',
    comoFunciona:
      'Escassez move, e é o gatilho mais fácil de estragar. Contador falso e "só restam 3 vagas" ' +
      'inventados funcionam uma vez e queimam a marca depois — o público farejaria a ' +
      'inautenticidade. Este modelo não inventa prazo nenhum: o limite que ele nomeia é o que ' +
      'a pessoa acabou de viver — a prova gratuita terminou.',
    quandoUsar:
      'Bom logo depois de uma prova pontual, de data marcada. ' +
      'Tem um prazo ou desconto REAL? Escreva no pitch personalizado, com a data escrita. ' +
      'Nenhum modelo daqui inventa um por você.',
    montar: (dados) => ({
      selo: 'Enquanto ainda está aberto',
      titulo: 'A prova acabou. O que ela abriu, não.',
      paragrafos: [
        `**${dados.tituloDaProva}** teve hora para começar e para terminar, e acabou de fechar ` +
          `para você. É assim que prova funciona — e é por isso que ela não serve como plano de ` +
          `estudo.`,
        `${listarRotulos(dados.destinos)} não tem cronômetro. Fica aberto no dia em que a dúvida ` +
          `aparecer, que é quando material de estudo vale alguma coisa.`,
      ],
      chamada: `Abrir ${primeiroDestino(dados)}`,
      email: {
        assunto: `${dados.primeiroNome}, a prova fechou — o material não`,
        paragrafos: [
          `**${dados.tituloDaProva}** teve começo e fim. Plano de estudo não pode ter.`,
          `${listarRotulos(dados.destinos)} fica aberto para quando a dúvida aparecer.`,
        ],
      },
    }),
  },
  {
    chave: 'personalizado',
    nome: 'Escrito por você',
    tecnica: 'Texto livre',
    principio: 'Seu texto, do jeito que você escrever.',
    comoFunciona:
      'Os seis modelos acima cobrem o caso geral. Quem tem uma oferta concreta — uma turma ' +
      'abrindo, um prazo real, um desconto com data — escreve a dela aqui, e é a única forma ' +
      'honesta de anunciar um prazo, porque quem sabe que ele existe é você.',
    quandoUsar: 'Sempre que houver algo específico a dizer que nenhum modelo pronto saberia.',
    // Nunca chamado: `montarPitch` desvia para o texto do admin antes de
    // chegar aqui. Existe porque o modelo precisa caber na mesma lista que os
    // outros — é ela que a tela do admin percorre para montar as opções.
    montar: () => ({
      selo: '',
      titulo: '',
      paragrafos: [],
      chamada: '',
      email: { assunto: '', paragrafos: [] },
    }),
  },
]

export const MODELO_POR_CHAVE = new Map(MODELOS_DE_PITCH.map((modelo) => [modelo.chave, modelo]))

/** Quebra o texto livre do admin em parágrafos (linha em branco separa). */
export function paragrafosDoTextoLivre(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean)
}

export const CHAMADA_PADRAO = 'Quero ver'
export const SELO_PADRAO = 'Feito para você'

/**
 * O pitch pronto para a tela.
 *
 * Devolve `null` quando não há o que mostrar — é a mesma pergunta de
 * `pitchEstaCompleto`, respondida com o conteúdo junto, para a tela não ter
 * que perguntar duas vezes.
 */
export function montarPitch(
  pitch: PitchDeVendas,
  dados: Omit<DadosDoPitch, 'destinos'>,
): PitchMontado | null {
  if (!pitchEstaCompleto(pitch)) return null

  const destinos = resolverDestinos(pitch.destinos)
  const completos: DadosDoPitch = { ...dados, destinos }

  if (pitch.modelo === 'personalizado') {
    const paragrafos = paragrafosDoTextoLivre(pitch.personalizado.texto)
    const titulo = pitch.personalizado.titulo || paragrafos[0] || ''
    const corpo = pitch.personalizado.titulo ? paragrafos : paragrafos.slice(1)
    const chamada = pitch.personalizado.chamada || `${CHAMADA_PADRAO} ${primeiroDestino(completos)}`

    return {
      modelo: 'personalizado',
      selo: SELO_PADRAO,
      titulo,
      paragrafos: corpo,
      chamada,
      destinos,
      email: {
        assunto: pitch.email.assunto || titulo,
        // A prévia do e-mail é o começo do pitch, não ele inteiro: e-mail que
        // entrega tudo não tem por que ser clicado.
        paragrafos: corpo.slice(0, 2),
      },
    }
  }

  const modelo = MODELO_POR_CHAVE.get(pitch.modelo)
  if (!modelo) return null

  const montado = modelo.montar(completos)
  return {
    modelo: pitch.modelo,
    ...montado,
    destinos,
    email: {
      assunto: pitch.email.assunto || montado.email.assunto,
      paragrafos: montado.email.paragrafos,
    },
  }
}

/**
 * Arredonda a prova social para baixo, em centenas.
 *
 * "1.247 estudantes" tem cara de número inventado justamente por ser exato;
 * "1.200+" é verdade com folga e lê melhor. Abaixo de cem não arredonda nada —
 * e abaixo de vinte devolve vazio, porque prova social com número pequeno é
 * argumento contra você mesmo.
 */
export function arredondarProvaSocial(total: unknown): string {
  const numero = typeof total === 'number' && Number.isFinite(total) ? Math.floor(total) : 0
  if (numero < 20) return ''
  if (numero < 100) return String(numero)
  const centenas = Math.floor(numero / 100) * 100
  return `${centenas.toLocaleString('pt-BR')}+`
}

/** Resumo de uma linha para o cartão do admin. */
export function rotuloDoPitch(pitch: PitchDeVendas): string {
  if (!pitch.ativo) return 'Pitch desligado — a prova termina sem oferta.'
  const destinos = resolverDestinos(pitch.destinos)
  if (destinos.length === 0) return 'Pitch ligado, mas sem destino escolhido.'
  if (pitch.modelo === 'personalizado' && !pitchEstaCompleto(pitch)) {
    return 'Pitch ligado, mas o texto personalizado está vazio.'
  }
  const modelo = MODELO_POR_CHAVE.get(pitch.modelo)
  const email = pitch.email.ativo ? ' + e-mail' : ''
  return `${modelo?.nome || 'Pitch'}${email} → ${listarRotulos(destinos)}`
}

// ────────────────────────────────────────────────────────────────────────────
// Negrito
// ────────────────────────────────────────────────────────────────────────────

export interface PedacoDeTexto {
  texto: string
  forte: boolean
}

/**
 * Parte um parágrafo nos trechos entre `**`.
 *
 * Os modelos marcam com `**` o pedaço que carrega o argumento (o nome da
 * prova, o número da prova social, o percentual que faltou). Existe uma versão
 * disso para a tela, que precisa de `<strong>` em React, e uma para o e-mail,
 * que precisa de HTML escapado — e duas implementações da mesma marcação
 * acabariam discordando no primeiro asterisco solto. Aqui a divisão é uma só;
 * cada lado só decide como desenha os pedaços.
 *
 * Asterisco desemparelhado fica como texto, que é o comportamento menos
 * surpreendente para quem escreve um pitch personalizado e erra a contagem.
 */
export function partirEmNegrito(texto: string): PedacoDeTexto[] {
  const pedacos: PedacoDeTexto[] = []
  const partes = texto.split(/(\*\*[^*]+\*\*)/g)

  for (const parte of partes) {
    if (!parte) continue
    const forte = parte.startsWith('**') && parte.endsWith('**') && parte.length > 4
    pedacos.push({ texto: forte ? parte.slice(2, -2) : parte, forte })
  }

  return pedacos
}
