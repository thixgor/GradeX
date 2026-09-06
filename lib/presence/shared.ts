/**
 * ═══════════════════════════════════════════════════════════════
 *  Presença — "quem está no site AGORA"
 * ───────────────────────────────────────────────────────────────
 *  Constantes compartilhadas entre o browser e o servidor. Vive num
 *  módulo próprio (mesmo motivo de `lib/tracking/shared.ts`) para que
 *  o bundle do browser não arraste nada que fale com o Mongo só para
 *  saber de quanto em quanto tempo bater o ponto.
 *
 *  A ideia central: o sinal de presença JÁ EXISTE e é de graça.
 *  Toda requisição autenticada passa por `getSession()`, que carimba
 *  `sessions.lastActiveAt` (no máximo 1x/min por token, graças ao
 *  cache de sessão). Ou seja: quem está clicando, respondendo prova,
 *  abrindo material ou navegando já se anuncia sozinho, sem UM
 *  request a mais.
 *
 *  O único buraco é o leitor parado: a pessoa está lendo uma página
 *  há 8 minutos, presente e acordada, mas sem gerar requisição
 *  nenhuma. Só ESSE caso paga um ping — e mesmo assim apenas quando
 *  a aba está visível, houve interação recente e nenhuma outra
 *  chamada de API cobriu a janela.
 * ═══════════════════════════════════════════════════════════════
 */

/** Rota do ping de presença. */
export const PRESENCE_ENDPOINT = '/api/presence'

/**
 * Janela do "online agora". Passou disso sem nenhum sinal, sai da conta.
 *
 * 5 min é o menor valor seguro: o carimbo de atividade natural
 * (`getSession`) é throttled em 1 min e o ping do leitor parado sai a
 * cada 2 min — sobra folga para um ping perdido sem ninguém piscar
 * na tela do admin.
 */
export const PRESENCE_WINDOW_MS = 5 * 60 * 1000

/**
 * Intervalo mínimo entre pings do MESMO browser (compartilhado entre
 * as abas via localStorage). Precisa ser confortavelmente menor que a
 * janela acima.
 */
export const PRESENCE_PING_INTERVAL_MS = 2 * 60 * 1000

/**
 * Carona: se o browser conversou com o nosso servidor há menos que isto,
 * `lastActiveAt` já foi carimbado por aquela requisição e o ping seria
 * puro desperdício.
 *
 * 90s cobre com folga o cache de sessão de 60s (é ele que decide se a
 * requisição carimba ou não).
 */
export const PRESENCE_PIGGYBACK_GRACE_MS = 90 * 1000

/**
 * Teto da carona: por mais que o browser esteja conversando com o
 * servidor, nunca passamos disto sem um ping de verdade.
 *
 * É o cinto de segurança contra o caso em que a conversa toda foi com
 * rotas públicas (que não passam por `getSession` e portanto não
 * carimbam nada). Tem que ser menor que a janela — senão a pessoa
 * sumiria da contagem estando na tela.
 */
export const PRESENCE_MAX_SKIP_MS = 3 * 60 * 1000

/**
 * De quanto em quanto tempo o timer acorda para DECIDIR se vale um ping.
 * O tick é local e gratuito; quase sempre ele decide não mandar nada.
 */
export const PRESENCE_TICK_MS = 30 * 1000

/**
 * Sem nenhuma interação humana (mouse, teclado, toque, rolagem) por
 * este tempo, a aba deixa de bater ponto mesmo estando visível.
 *
 * É o que separa "aluno lendo" de "aba esquecida aberta desde ontem" —
 * e é justamente o que tornava a contagem antiga mentirosa. 10 min é
 * generoso o bastante para quem está lendo um texto longo ou assistindo
 * uma aula sem encostar no aparelho.
 */
export const PRESENCE_IDLE_MS = 10 * 60 * 1000

/** Chave (localStorage) do último ping — compartilhada entre abas. */
export const PRESENCE_LAST_PING_KEY = 'gx:presence:lastPing'

/** Chave (sessionStorage) que desliga o ping para visitante deslogado. */
export const PRESENCE_ANON_KEY = 'gx:presence:anon'

/** Cabeçalho de resposta: 'ok' (carimbado) ou 'anon' (sem sessão). */
export const PRESENCE_HEADER = 'x-presence'
