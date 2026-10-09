import { SELETOR_DE_ESCRITA } from '@/lib/provas/anti-cola'

/**
 * Dissuasão contra o inspetor do navegador — as regras, sem DOM.
 *
 * ## O que isto é, e o que não é
 *
 * Tudo o que chega ao navegador pode ser lido. Quem desliga o JavaScript,
 * digita `view-source:` na barra, abre o DevTools pelo menu do navegador ou
 * passa o tráfego por um proxy vê o HTML e o JSON do mesmo jeito. Nenhuma linha
 * daqui muda isso, e prometer o contrário seria vender o que não existe.
 *
 * O que dá para fazer de dentro da página é **atrito**: o atalho de teclado não
 * abre o inspetor, o botão direito não oferece "Inspecionar" nem "Salvar
 * imagem", e quem abre o DevTools acoplado à janela vê a tela sumir. Isso tira
 * do caminho o curioso — que é a maior parte de quem tenta — e deixa registro
 * quando acontece numa prova monitorada.
 *
 * A proteção de verdade é o servidor não mandar o que a pessoa não pode ver:
 * `lib/provas/sanitizar-prova.ts` (gabarito), `lib/banco/acesso-servidor.ts`
 * (questão bloqueada), o leitor de PDF que entrega só as páginas liberadas. Ver
 * `docs/protecao-de-conteudo.md`.
 *
 * ## Por que puro
 *
 * As três decisões abaixo — que tecla barrar, que menu barrar, quando a janela
 * parece ter o DevTools aberto — são onde mora o risco de atrapalhar quem está
 * de boa-fé. Mantê-las sem DOM deixa cada caso testável em
 * `__tests__/protecao-inspecao.test.ts`.
 */

/** O mínimo de um `KeyboardEvent` que a decisão usa. */
export interface TeclaPressionada {
  key: string
  /** `KeyI`, `KeyU`… — no Mac, Option troca o `key` por `ˆ`, `∆`, `ç`. */
  code?: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

export type AtalhoBarrado = 'devtools' | 'codigo-fonte' | 'salvar' | 'imprimir'

/** A letra da tecla, imune ao Option do Mac e ao Caps Lock. */
function letraDa(evento: TeclaPressionada): string {
  if (evento.code && /^Key[A-Z]$/.test(evento.code)) return evento.code.slice(3).toLowerCase()
  return (evento.key || '').toLowerCase()
}

/**
 * Esta combinação abre o inspetor ou o código-fonte, salva ou imprime a página?
 *
 * - **F12**, em qualquer sistema.
 * - **Ctrl+Shift+I / J / C / K** (Windows e Linux; K é o console do Firefox).
 * - **Cmd+Option+I / J / C / U** (Mac; U é o código-fonte).
 * - **Ctrl/Cmd+U**: código-fonte.
 * - **Ctrl/Cmd+S**: salvar a página inteira, com o HTML já preenchido.
 * - **Ctrl/Cmd+P**: imprimir — o "Salvar como PDF" levava uma prova inteira, em
 *   dezoito páginas, num gesto. O atalho é só metade: o menu do navegador
 *   também imprime, e quem fecha essa porta é a folha `@media print` de
 *   `globals.css` (ver `data-sem-impressao`).
 *
 * Fora daqui, de propósito: copiar, colar e selecionar tudo. São decididos
 * prova a prova pelo escudo anti-cola (`components/exam/escudo-anti-cola.tsx`);
 * barrá-los no site inteiro tiraria do aluno o copiar de um enunciado de
 * treino para pesquisar.
 */
export function atalhoDeInspecao(evento: TeclaPressionada): AtalhoBarrado | null {
  if (evento.key === 'F12' || evento.code === 'F12') return 'devtools'

  const letra = letraDa(evento)
  const ctrl = evento.ctrlKey
  const cmd = evento.metaKey

  if (ctrl && evento.shiftKey && !cmd && ['i', 'j', 'c', 'k'].includes(letra)) return 'devtools'
  if (cmd && evento.altKey && ['i', 'j', 'c'].includes(letra)) return 'devtools'
  if (cmd && evento.altKey && letra === 'u') return 'codigo-fonte'

  if ((ctrl || cmd) && !evento.shiftKey && !evento.altKey) {
    if (letra === 'u') return 'codigo-fonte'
    if (letra === 's') return 'salvar'
    if (letra === 'p') return 'imprimir'
  }
  return null
}

export function avisoDoAtalho(qual: AtalhoBarrado): string {
  switch (qual) {
    case 'devtools':
      return 'As ferramentas de desenvolvedor estão desativadas neste site.'
    case 'codigo-fonte':
      return 'O código-fonte não está disponível neste site.'
    case 'salvar':
      return 'Salvar a página não está disponível neste site.'
    case 'imprimir':
      return 'A impressão não está disponível neste site.'
  }
}

/** Seletor dos alvos em que o menu nativo continua: links e campos de escrita. */
export const SELETOR_MENU_LIVRE = `a[href], ${SELETOR_DE_ESCRITA}`

export interface PedidoDeMenu {
  alvo: EventTarget | null
  /** `pointerType` do último `pointerdown`; `null` antes do primeiro. */
  ultimoPonteiro: string | null
  /** Alguém (um menu próprio do site) já cancelou este evento. */
  jaCancelado: boolean
}

/**
 * O menu nativo do botão direito deve ser barrado aqui?
 *
 * **Só com mouse.** No toque, `contextmenu` é o toque longo — o mesmo gesto com
 * que o navegador seleciona a palavra sob o dedo. Cancelá-lo cancela a seleção
 * junto, e o grifo do Manual e da prova deixa de funcionar no celular (ver
 * `components/manual-clinico/highlightable-rich-text.tsx`). Celular também não
 * abre DevTools, então não há o que proteger ali.
 *
 * **Link passa**: "abrir em nova aba" é navegação, não roubo. **Campo de
 * escrita passa**: colar e corrigir o próprio texto.
 *
 * **Menu próprio passa**: grifo, mapa mental e lista de provas desenham o
 * menu deles e já cancelaram o nativo; não há o que acrescentar.
 */
export function deveBloquearMenu({ alvo, ultimoPonteiro, jaCancelado }: PedidoDeMenu): boolean {
  if (jaCancelado) return false
  if (ultimoPonteiro === 'touch' || ultimoPonteiro === 'pen') return false
  const elemento = alvo as Element | null
  if (elemento && typeof elemento.closest === 'function' && elemento.closest(SELETOR_MENU_LIVRE)) {
    return false
  }
  return true
}

/** Medidas da janela, em pixels CSS (`window.*`). */
export interface MedidasDaJanela {
  outerWidth: number
  outerHeight: number
  innerWidth: number
  innerHeight: number
  devicePixelRatio: number
}

/**
 * O DevTools acoplado come pelo menos isto da área da página.
 *
 * Na altura o limiar é maior porque `outerHeight − innerHeight` já inclui a
 * barra de abas, a de endereço e a de favoritos (~110 px num Chrome comum), e
 * uma barra de aviso do navegador soma mais ~40.
 */
export const LIMIAR_LARGURA = 160
export const LIMIAR_ALTURA = 220
/** Encolher a página nesta medida, com a janela parada, é painel abrindo. */
export const LIMIAR_ENCOLHIMENTO = 160

/**
 * Leitura absoluta: a diferença entre a janela e a página denuncia um painel?
 *
 * Só vale com `devicePixelRatio` inteiro. O zoom da página muda o DPR e encolhe
 * `innerWidth` sem mexer em `outerWidth` — em 125%, uma janela de 1920 px tem
 * página de 1536, e a conta acusaria quem só aumentou a letra. DPR inteiro é
 * zoom de 100% (ou 200%, que é exatamente 2× e não deixa sobra).
 */
export function folgaDenunciaPainel(m: MedidasDaJanela): boolean {
  if (!m.outerWidth || !m.outerHeight) return false
  if (!Number.isInteger(m.devicePixelRatio)) return false
  return m.outerWidth - m.innerWidth > LIMIAR_LARGURA || m.outerHeight - m.innerHeight > LIMIAR_ALTURA
}

/** O que a detecção lembra entre uma leitura e a seguinte. */
export interface EstadoDaDeteccao {
  /** A janela (outer + DPR) a que `referencia` pertence. */
  janela: { outerWidth: number; outerHeight: number; devicePixelRatio: number } | null
  /** Maior página vista nessa janela com o painel fechado. */
  referencia: { innerWidth: number; innerHeight: number } | null
  aberto: boolean
}

export const ESTADO_INICIAL: EstadoDaDeteccao = { janela: null, referencia: null, aberto: false }

/**
 * Lê as medidas e decide se o DevTools parece aberto.
 *
 * ## A leitura principal: a página encolheu com a janela parada
 *
 * Abrir o DevTools acoplado não muda a janela (`outer*`) nem o zoom (DPR) — só
 * tira espaço da página (`inner*`). Redimensionar a janela muda o `outer`;
 * mudar o zoom muda o DPR. Então: mesma janela, mesmo zoom e página ≥160 px
 * menor do que a maior já vista nela é painel abrindo, e a conta não depende
 * do zoom em que a pessoa está.
 *
 * Quando a janela ou o zoom mudam, a referência recomeça (inclui entrar e sair
 * de tela cheia, que mexe no `outer`).
 *
 * ## A leitura de partida
 *
 * Quem carrega a página com o DevTools já aberto não tem "antes" para
 * comparar. Aí vale a folga absoluta, com a trava do DPR inteiro.
 *
 * ## O que escapa, e fica dito
 *
 * DevTools em janela separada não tira espaço de ninguém, e nenhuma medida o
 * vê. Painel lateral do navegador (favoritos, leitura) tira, e é confundido
 * com o DevTools — por isso o aviso na tela cita os dois.
 */
export function avaliarDevtools(estado: EstadoDaDeteccao, m: MedidasDaJanela): EstadoDaDeteccao {
  const mesmaJanela =
    !!estado.janela &&
    estado.janela.outerWidth === m.outerWidth &&
    estado.janela.outerHeight === m.outerHeight &&
    estado.janela.devicePixelRatio === m.devicePixelRatio

  const janela = {
    outerWidth: m.outerWidth,
    outerHeight: m.outerHeight,
    devicePixelRatio: m.devicePixelRatio,
  }
  const absoluto = folgaDenunciaPainel(m)

  let referencia = mesmaJanela ? estado.referencia : null
  let encolheu = false

  if (referencia) {
    encolheu =
      referencia.innerWidth - m.innerWidth >= LIMIAR_ENCOLHIMENTO ||
      referencia.innerHeight - m.innerHeight >= LIMIAR_ENCOLHIMENTO
  }

  const aberto = absoluto || encolheu

  // A referência é a página com o painel FECHADO. Enquanto ele parece aberto,
  // ela não anda — senão a página encolhida viraria o novo normal.
  if (!aberto) {
    referencia = referencia
      ? {
          innerWidth: Math.max(referencia.innerWidth, m.innerWidth),
          innerHeight: Math.max(referencia.innerHeight, m.innerHeight),
        }
      : { innerWidth: m.innerWidth, innerHeight: m.innerHeight }
  }

  return { janela, referencia, aberto }
}

/**
 * Marca que libera a impressão na página que a contém — o certificado, cujo
 * botão "Imprimir" é o próprio recurso. Ver a regra `@media print` em
 * `globals.css`.
 */
export const SELETOR_IMPRESSAO_LIVRE = '[data-permite-impressao]'

/** Nome do evento que a página da prova ouve para registrar no monitoramento. */
export const EVENTO_INSPECAO = 'domineaqui:inspecao'

export interface DetalheDoEventoDeInspecao {
  aberto: boolean
}
