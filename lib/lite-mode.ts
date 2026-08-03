/**
 * Modo Lite — núcleo compartilhado.
 *
 * O Modo Lite existe para quem abre a plataforma num celular antigo ou num
 * notebook fraco: ele corta o que é caro de desenhar (blur, sombras, gradientes,
 * animações, fontes web) e o que é caro de baixar/executar (anúncios rotativos,
 * prefetch agressivo, molduras animadas da sidebar).
 *
 * Três estados de preferência:
 *  - `auto` (padrão): a própria plataforma decide, olhando memória, núcleos de
 *    CPU e qualidade da conexão. É o que faz o aparelho fraco receber a versão
 *    leve sem o usuário precisar descobrir nada.
 *  - `on`  : sempre leve, independente do aparelho.
 *  - `off` : sempre completo, independente do aparelho.
 *
 * A preferência mora em localStorage e é aplicada ANTES da primeira pintura
 * (script inline no <head>), então não existe "flash" da versão pesada.
 */

export type LitePreference = 'auto' | 'on' | 'off'

export const LITE_STORAGE_KEY = 'lite-mode'
export const LITE_PROMPT_DISMISS_KEY = 'lite-mode-prompt-dismissed-at'
export const LITE_AUTO_NOTICE_KEY = 'lite-mode-auto-notice-seen'
export const LITE_CHANGE_EVENT = 'domineaqui:lite-mode-change'

/** Quanto tempo o convite "ativar Modo Lite?" fica escondido após um "agora não". */
export const LITE_PROMPT_SNOOZE_MS = 1000 * 60 * 60 * 24 * 7 // 7 dias

/** A partir deste score o aparelho é considerado fraco e o `auto` liga sozinho. */
export const LITE_AUTO_SCORE = 3
/** A partir deste score vale sugerir o Modo Lite (sem ligar por conta própria). */
export const LITE_SUGGEST_SCORE = 2

export interface DeviceCapability {
  /** Soma dos sinais de "aparelho/conexão fracos". Quanto maior, mais fraco. */
  score: number
  /** Ligar o Modo Lite automaticamente neste aparelho? */
  shouldAutoEnable: boolean
  /** Vale ao menos sugerir o Modo Lite? */
  shouldSuggest: boolean
  /** Motivos legíveis, exibidos no Perfil ("2 GB de memória", "conexão 3G"…). */
  reasons: string[]
  memory: number | null
  cores: number | null
  effectiveType: string | null
  saveData: boolean
  reducedMotion: boolean
}

const UNKNOWN_DEVICE: DeviceCapability = {
  score: 0,
  shouldAutoEnable: false,
  shouldSuggest: false,
  reasons: [],
  memory: null,
  cores: null,
  effectiveType: null,
  saveData: false,
  reducedMotion: false,
}

/**
 * Lê os sinais de capacidade do aparelho.
 *
 * IMPORTANTE: a pontuação aqui precisa continuar espelhando a do
 * `LITE_BOOTSTRAP_SCRIPT` (abaixo) — um decide no React, o outro decide antes
 * da primeira pintura, e os dois têm que chegar na mesma conclusão, senão a
 * página troca de aparência depois de carregada.
 */
export function detectDeviceCapability(): DeviceCapability {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return UNKNOWN_DEVICE
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean; effectiveType?: string }
    mozConnection?: { saveData?: boolean; effectiveType?: string }
    webkitConnection?: { saveData?: boolean; effectiveType?: string }
  }

  const connection = nav.connection || nav.mozConnection || nav.webkitConnection
  const memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null
  const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null
  const effectiveType = connection?.effectiveType || null
  const saveData = !!connection?.saveData
  const reducedMotion =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const reasons: string[] = []
  let score = 0

  if (memory !== null) {
    if (memory <= 2) {
      score += 2
      reasons.push(`${memory} GB de memória`)
    } else if (memory <= 4) {
      score += 1
      reasons.push(`${memory} GB de memória`)
    }
  }

  if (cores !== null) {
    if (cores <= 2) {
      score += 2
      reasons.push(`${cores} núcleo${cores === 1 ? '' : 's'} de CPU`)
    } else if (cores <= 4) {
      score += 1
      reasons.push(`${cores} núcleos de CPU`)
    }
  }

  if (saveData) {
    score += 3
    reasons.push('economia de dados ligada')
  }

  if (effectiveType === '2g' || effectiveType === 'slow-2g') {
    score += 3
    reasons.push('conexão muito lenta')
  } else if (effectiveType === '3g') {
    score += 1
    reasons.push('conexão 3G')
  }

  if (reducedMotion) {
    score += 1
    reasons.push('preferência do sistema por menos animações')
  }

  return {
    score,
    shouldAutoEnable: score >= LITE_AUTO_SCORE,
    shouldSuggest: score >= LITE_SUGGEST_SCORE,
    reasons,
    memory,
    cores,
    effectiveType,
    saveData,
    reducedMotion,
  }
}

/** Normaliza o valor guardado, aceitando o formato antigo (`'true'`/`'false'`). */
export function parseLitePreference(raw: string | null | undefined): LitePreference {
  if (raw === 'on' || raw === 'off' || raw === 'auto') return raw
  if (raw === 'true') return 'on'
  if (raw === 'false') return 'off'
  return 'auto'
}

export function readStoredLitePreference(): LitePreference {
  if (typeof window === 'undefined') return 'auto'
  try {
    return parseLitePreference(localStorage.getItem(LITE_STORAGE_KEY))
  } catch {
    return 'auto'
  }
}

/** Aplica (ou remove) o Modo Lite no <html>. Fonte única da verdade visual. */
export function applyLiteModeToDocument(enabled: boolean, preference: LitePreference) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('lite-mode', enabled)
  root.setAttribute('data-lite-mode', enabled ? 'on' : 'off')
  root.setAttribute('data-lite-pref', preference)
}

/** O Modo Lite está ativo agora? Para código fora do React (listeners globais). */
export function isLiteModeActive(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('lite-mode')
}

export const LITE_PREFERENCE_LABELS: Record<LitePreference, string> = {
  auto: 'Automático',
  on: 'Sempre ativo',
  off: 'Desativado',
}

export const LITE_PREFERENCE_DESCRIPTIONS: Record<LitePreference, string> = {
  auto: 'Liga sozinho quando o aparelho ou a internet estão fracos.',
  on: 'A plataforma fica leve em qualquer aparelho.',
  off: 'Visual completo, com todos os efeitos e animações.',
}

/**
 * Script inline injetado no <head>. Roda antes da primeira pintura para que o
 * aparelho fraco já receba a tela leve — sem flash e sem esperar o React.
 *
 * Mantenha a pontuação idêntica à de `detectDeviceCapability()`.
 */
export const LITE_BOOTSTRAP_SCRIPT = `(function(){try{
var d=document.documentElement,r=null;
try{r=localStorage.getItem('${LITE_STORAGE_KEY}')}catch(e){}
var p=(r==='on'||r==='off'||r==='auto')?r:(r==='true'?'on':(r==='false'?'off':'auto'));
var on=p==='on';
if(p==='auto'){
var n=navigator,c=n.connection||n.mozConnection||n.webkitConnection,s=0,m=n.deviceMemory,k=n.hardwareConcurrency,t=c&&c.effectiveType;
if(typeof m==='number'){s+=m<=2?2:(m<=4?1:0)}
if(typeof k==='number'){s+=k<=2?2:(k<=4?1:0)}
if(c&&c.saveData){s+=3}
if(t==='2g'||t==='slow-2g'){s+=3}else if(t==='3g'){s+=1}
if(n.userAgent&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){s+=1}
on=s>=${LITE_AUTO_SCORE};
}
d.classList.toggle('lite-mode',on);
d.setAttribute('data-lite-mode',on?'on':'off');
d.setAttribute('data-lite-pref',p);
}catch(e){}})();`
