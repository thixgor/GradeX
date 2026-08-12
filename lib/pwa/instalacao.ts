/**
 * Instalação do DomineAqui como app (PWA) — a parte que não depende de React.
 *
 * O problema que este arquivo resolve: cada plataforma instala de um jeito, e
 * quem estava de fora era justamente o Android — o iPhone tinha instrução na
 * tela e o Samsung não tinha nada. Só que "Android" também não é um caso só:
 *
 *  • Chrome / Edge / Opera / Samsung Internet 8+ disparam `beforeinstallprompt`
 *    e conseguem instalar com UM toque, pelo diálogo nativo do sistema.
 *  • Samsung Internet antigo e Firefox Android NÃO disparam o evento; ali o
 *    único caminho é ensinar o menu do navegador — e cada um tem o seu.
 *  • iPhone não tem evento nenhum: é Compartilhar → Adicionar à Tela de Início.
 *
 * A detecção fica aqui, isolada e sem `window`, para poder ser testada com
 * user agents reais (ver `__tests__/pwa/instalacao.test.ts`).
 */

export type PlataformaInstalacao =
  | 'ios-safari'
  | 'ios-outro-navegador'
  | 'android-chromium'
  | 'android-samsung'
  | 'android-firefox'
  | 'android-outro'
  | 'desktop'
  | 'desconhecida'

export interface SinaisDoAparelho {
  userAgent: string
  /** `navigator.platform` — usado para pegar iPad, que se declara "MacIntel". */
  platform?: string
  /** `navigator.maxTouchPoints` — o iPad se distingue do Mac por isto. */
  maxTouchPoints?: number
}

const RE_SAMSUNG = /SamsungBrowser\/(\d+)/i
// Chromium com suporte a `beforeinstallprompt` no Android.
const RE_CHROMIUM_ANDROID = /Chrome\/|EdgA\/|OPR\/|HuaweiBrowser|MiuiBrowser/i
const RE_FIREFOX = /Firefox\/|FxiOS/i
// Navegadores de iOS que NÃO são o Safari (o fluxo de instalação muda).
const RE_IOS_OUTRO = /CriOS|FxiOS|EdgiOS|OPiOS|Mercury/i

/** Versão do Samsung Internet a partir da qual o diálogo nativo funciona. */
export const SAMSUNG_MINIMO_PROMPT_NATIVO = 8

export function detectarPlataforma(sinais: SinaisDoAparelho): PlataformaInstalacao {
  const ua = sinais.userAgent || ''
  if (!ua) return 'desconhecida'

  // iPad no iOS 13+ se apresenta como "Macintosh"; o que o entrega é o toque.
  const ehIpadModerno =
    /Macintosh/.test(ua) &&
    (sinais.platform === 'MacIntel' || /Mac/.test(sinais.platform || '')) &&
    (sinais.maxTouchPoints || 0) > 1

  if (/iPhone|iPod|iPad/.test(ua) || ehIpadModerno) {
    return RE_IOS_OUTRO.test(ua) ? 'ios-outro-navegador' : 'ios-safari'
  }

  if (/Android/i.test(ua)) {
    if (RE_SAMSUNG.test(ua)) return 'android-samsung'
    if (RE_FIREFOX.test(ua)) return 'android-firefox'
    if (RE_CHROMIUM_ANDROID.test(ua)) return 'android-chromium'
    return 'android-outro'
  }

  // Sem sinal de celular: desktop. Chrome/Edge instalam pela barra de endereço,
  // então continua valendo mostrar o botão quando o evento aparecer.
  if (/Windows|Macintosh|Linux|CrOS/i.test(ua)) return 'desktop'

  return 'desconhecida'
}

export function ehAndroid(plataforma: PlataformaInstalacao): boolean {
  return plataforma.startsWith('android-')
}

export function ehIos(plataforma: PlataformaInstalacao): boolean {
  return plataforma.startsWith('ios-')
}

/**
 * A plataforma tem chance real de disparar `beforeinstallprompt`?
 *
 * Serve só para decidir o que MOSTRAR enquanto o evento não chegou (botão de
 * um toque x passo a passo). Quando o evento chega, o botão nativo vence
 * sempre — inclusive em navegador que esta função classificou como sem
 * suporte, porque a verdade é o evento, não o user agent.
 */
export function esperaPromptNativo(
  plataforma: PlataformaInstalacao,
  userAgent = '',
): boolean {
  if (plataforma === 'android-chromium' || plataforma === 'desktop') return true
  if (plataforma === 'android-samsung') {
    const versao = Number(RE_SAMSUNG.exec(userAgent)?.[1] ?? 0)
    return versao >= SAMSUNG_MINIMO_PROMPT_NATIVO
  }
  return false
}

/**
 * O aparelho é um Galaxy? Todo Android da Samsung carrega o código do modelo
 * no user agent (`SM-G991B`, `SM-A546E`…) — e a Samsung também usa `GT-` e
 * `SGH-` em linhas antigas. Serve só para o texto do convite falar a língua de
 * quem lê ("no seu Samsung" em vez de "no seu Android").
 */
export function ehAparelhoSamsung(userAgent: string): boolean {
  if (!/Android/i.test(userAgent)) return false
  return /\b(SM-[A-Z0-9]{4,}|GT-[A-Z0-9]{4,}|SGH-[A-Z0-9]{3,}|SamsungBrowser)/i.test(
    userAgent,
  )
}

export interface Instrucoes {
  /** Nome do aparelho/navegador, do jeito que a pessoa reconhece. */
  aparelho: string
  passos: string[]
  /** Quando o navegador atual é um beco sem saída, para onde mandar. */
  alternativa?: string
}

/**
 * Passo a passo por navegador. Os rótulos são os que aparecem na tela em
 * português — trocar por descrição genérica ("abra o menu e procure instalar")
 * é o que faz esse tipo de aviso não funcionar.
 */
export function instrucoesDe(plataforma: PlataformaInstalacao): Instrucoes {
  switch (plataforma) {
    case 'android-samsung':
      return {
        aparelho: 'Samsung Internet',
        passos: [
          'Toque no menu ☰ na barra de baixo do navegador.',
          'Escolha "Adicionar página a".',
          'Toque em "Tela inicial" e confirme em "Adicionar".',
        ],
      }
    case 'android-chromium':
    case 'android-outro':
      return {
        aparelho: 'Chrome no Android',
        passos: [
          'Toque no menu ⋮ no canto superior direito.',
          'Escolha "Instalar app" (ou "Adicionar à tela inicial").',
          'Confirme em "Instalar".',
        ],
      }
    case 'android-firefox':
      return {
        aparelho: 'Firefox no Android',
        passos: [
          'Toque no menu ⋮ no canto inferior direito.',
          'Escolha "Instalar".',
          'Confirme em "Adicionar".',
        ],
      }
    case 'ios-safari':
      return {
        aparelho: 'iPhone e iPad',
        passos: [
          'Toque no ícone Compartilhar, na barra do Safari.',
          'Role a lista e escolha "Adicionar à Tela de Início".',
          'Confirme em "Adicionar".',
        ],
      }
    case 'ios-outro-navegador':
      return {
        aparelho: 'iPhone e iPad',
        passos: [
          'Abra domineaqui.com.br no Safari.',
          'Toque no ícone Compartilhar, na barra do navegador.',
          'Escolha "Adicionar à Tela de Início".',
        ],
        alternativa:
          'No iPhone, só o Safari instala apps na tela de início — Chrome e Firefox não têm essa opção.',
      }
    case 'desktop':
      return {
        aparelho: 'Computador',
        passos: [
          'Clique no ícone de instalar, no fim da barra de endereço.',
          'Ou abra o menu ⋮ do navegador e escolha "Instalar DomineAqui".',
          'Confirme em "Instalar".',
        ],
      }
    default:
      return {
        aparelho: 'Seu aparelho',
        passos: [
          'Abra o menu do navegador.',
          'Procure por "Instalar app" ou "Adicionar à tela inicial".',
          'Confirme para colocar o ícone na sua tela.',
        ],
      }
  }
}

/** O site já está rodando como app instalado (sem barra de navegador)? */
export function estaEmModoApp(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean })
    .standalone
  return (
    iosStandalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.matchMedia?.('(display-mode: fullscreen)').matches === true ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches === true ||
    document.referrer.startsWith('android-app://')
  )
}

/**
 * Nome global onde o `beforeinstallprompt` fica guardado.
 *
 * Existe porque o evento é disparado logo depois do load — muitas vezes ANTES
 * de o React hidratar. Um `addEventListener` dentro de `useEffect` chega
 * atrasado e perde o evento: é exatamente por isso que tanto site mostra
 * "instalar" só depois de um F5. O script de bootstrap abaixo roda no <head>,
 * segura o evento e avisa quem se inscrever depois.
 */
export const CHAVE_GLOBAL_INSTALACAO = '__gxInstalacao'

export interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface EstadoGlobalInstalacao {
  evento: EventoInstalacao | null
  instalado: boolean
  inscritos: Array<() => void>
}

/**
 * Script inline para o <head>. Precisa ser pequeno, síncrono e sem
 * dependência de bundle — ele corre contra o `beforeinstallprompt`.
 */
export const SCRIPT_CAPTURA_INSTALACAO = `(function(){
var k=${JSON.stringify(CHAVE_GLOBAL_INSTALACAO)};
var s=window[k]||{evento:null,instalado:false,inscritos:[]};
window[k]=s;
function avisa(){for(var i=0;i<s.inscritos.length;i++){try{s.inscritos[i]()}catch(e){}}}
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();s.evento=e;avisa()});
window.addEventListener('appinstalled',function(){s.evento=null;s.instalado=true;avisa()});
})();`

/** Chave do localStorage que guarda quando a pessoa dispensou o convite. */
export const CHAVE_DISPENSA = 'gx-instalar-dispensado-em'
/** Dias de silêncio depois de um "agora não". */
export const DIAS_DE_SILENCIO = 21

export function foiDispensadoRecentemente(
  agora = Date.now(),
  ler: (chave: string) => string | null = (chave) => {
    try {
      return localStorage.getItem(chave)
    } catch {
      return null
    }
  },
): boolean {
  const bruto = ler(CHAVE_DISPENSA)
  if (!bruto) return false
  const quando = Number(bruto)
  if (!Number.isFinite(quando)) return false
  return agora - quando < DIAS_DE_SILENCIO * 24 * 60 * 60 * 1000
}
