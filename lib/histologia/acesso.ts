import 'server-only'

import type { TokenPayload } from '@/lib/auth'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
  type ManualClinicoAccessState,
  type ManualClinicoPublicProduct,
} from '@/lib/manual-clinico-product'

import { histologiaEhPrivativa } from './licenca'
import type { AcessoDaVitrine, ProdutoDaVitrine } from './vitrine-tipos'

/**
 * Portão de assinatura do Manual da Histologia — **o único**.
 *
 * O módulo é privativo de assinantes do Manual Clínico e de contas Plus+ desde
 * 2026-08-13 (ver `AUTORIZACAO` em `licenca.ts` e o ADR 0003). A regra de quem
 * entra vive inteira neste arquivo: quando a autorização escrita da VCU chegar,
 * ou se o módulo voltar a ser gratuito, `histologiaEhPrivativa()` passa a
 * devolver `false` e todo mundo é liberado sem que nenhuma página mude.
 *
 * ## Por que o portão não fica no layout
 *
 * A tentativa óbvia — o layout do módulo escolher entre `children` e a vitrine
 * — **não segura o conteúdo**. No App Router, a árvore da página é prop de um
 * componente de cliente (`LayoutRouter`), então ela é renderizada e serializada
 * no payload RSC mesmo quando o layout não a inclui na saída. O HTML visível
 * mostra a vitrine e o `<script>` logo abaixo carrega a lâmina inteira. Foi
 * medido, não deduzido.
 *
 * Então o portão é aplicado onde o conteúdo nasce — na **rota de dados**. Toda
 * página do módulo é um casco estático: não lê sessão nem carrega nada do
 * acervo, e sai do CDN. O conteúdo vem de uma rota em
 * `/api/manual-clinico/histologia/…`, que pergunta aqui
 * (`histologiaLiberadaNaRequisicao`, ou `verificarAcessoAHistologia` na home,
 * que precisa do motivo para a vitrine) e responde 404 a quem não assina; o
 * casco então leva à home, onde está a vitrine. Ver
 * `components/histologia/portao.tsx`.
 *
 * O visitante sem sessão nem chega ao casco: o middleware reescreve a home para
 * a vitrine estática e manda as páginas internas para a home, na borda — quem
 * não tem sessão certamente não assina. Isso só antecipa o "não"; nenhum "sim"
 * sai de lá.
 *
 * O teste em `__tests__/histologia/acervo.test.ts` falha se uma página ler a
 * sessão ou servir conteúdo sem o portão de cliente, ou se uma rota de dados do
 * módulo servir sem perguntar aqui — os erros que essa forma de portão permite
 * cometer.
 *
 * ## Por que o banco não fica no caminho crítico
 *
 * A primeira versão deste arquivo abria com
 * `Promise.all([getDb(), getSession()])` e envolvia tudo num `try` que, no
 * `catch`, fechava o portão. Isso mandava **assinante e admin para a landing**
 * em toda intermitência do Atlas — e no caso do admin sem nem precisar: o
 * veredito de admin sai do JWT, `getManualClinicoAccess` responde na primeira
 * linha, e mesmo assim a requisição esperava (e falhava com) uma conexão de
 * banco que ninguém ia usar. `serverSelectionTimeoutMS` é 5s, então bastava uma
 * eleição no Atlas ou uma lambda fria para o portão bater na cara de quem paga.
 *
 * A ordem agora é a ordem da certeza:
 *
 * 1. **sessão primeiro, sozinha.** `getSession()` já é à prova de intermitência
 *    por dentro — quando o banco falha ela devolve o payload do JWT em vez de
 *    deslogar (ver `lib/auth.ts`). Perguntar a ela antes do banco é o que faz o
 *    admin entrar sem depender do Atlas;
 * 2. **admin sai aqui**, sem tocar no banco;
 * 3. **veredito positivo recente**, do cache em memória;
 * 4. **banco**, com uma segunda tentativa — blip transitório costuma ser um só;
 * 5. **falha persistente**: vale o último veredito positivo conhecido, dentro da
 *    janela de tolerância. Sem nenhum, a landing — mas com o aviso de que não
 *    foi possível confirmar a assinatura, que já existe na vitrine.
 *
 * ## O cache, e por que ele só guarda "sim"
 *
 * Uma visita a uma lâmina custava zero consulta antes deste módulo virar
 * privativo; agora custa a página mais `/indice` mais `/busca`, cada uma com o
 * seu veredito. Vinte lâminas numa sessão de estudo viram dezenas de idas ao
 * Atlas para responder sempre a mesma coisa. O cache corta isso.
 *
 * Ele guarda **apenas liberações**, e por pouco tempo:
 *
 * - guardar "não" faria uma compra recém-aprovada demorar a valer, que é o pior
 *   momento possível para o produto errar;
 * - guardar "sim" por 60s espelha o TTL do cache de sessão em `lib/auth.ts`, que
 *   é a tolerância que este projeto já aceita para estado de conta.
 *
 * A janela de tolerância (`GRACA_MS`) só é consultada quando o banco falhou. Ela
 * não abre o módulo para ninguém novo: serve exatamente a quem foi verificado
 * como assinante minutos antes e teve o azar de recarregar durante o incidente.
 * Quem nunca passou pelo portão continua do lado de fora, mesmo logado — é o que
 * mantém a falha fechada para quem não pagou.
 */
export interface AcessoAHistologia {
  /** Há sessão? Muda o texto da vitrine, não o veredito. */
  autenticado: boolean
  /** O conteúdo do módulo pode ser servido a esta requisição? */
  liberado: boolean
  /** Motivo do veredito, para log e para a vitrine dizer a coisa certa. */
  motivo:
    | 'gratuito'
    | 'admin'
    | 'purchased'
    | 'included_plan'
    /** Liberado pelo último veredito positivo conhecido, com o banco fora. */
    | 'tolerancia'
    | 'locked'
    | 'guest'
    | 'indisponivel'
  /** Cargo que incluiu o acesso ('plus'), quando foi por aí que veio. */
  planoIncluso: string | null
  /** Produto e planos para a vitrine montar o preço. `null` se o banco falhou. */
  produto: ManualClinicoPublicProduct | null
}

/** Quanto tempo um "sim" vale sem reconsulta. Espelha o cache de sessão. */
const VEREDITO_TTL_MS = 60 * 1000

/** Por quanto tempo um "sim" antigo ainda vale **se o banco estiver fora**. */
const GRACA_MS = 30 * 60 * 1000

interface VereditoGuardado {
  motivo: 'purchased' | 'included_plan'
  planoIncluso: string | null
  guardadoEm: number
}

/**
 * Vive na instância da lambda, e é isso mesmo: não é fonte da verdade, é
 * memória curta. Instância fria simplesmente pergunta ao banco de novo.
 */
const vereditos = new Map<string, VereditoGuardado>()

function limparVereditos(agora: number) {
  if (vereditos.size < 500) return
  for (const [chave, item] of vereditos) {
    if (agora - item.guardadoEm > GRACA_MS) vereditos.delete(chave)
  }
}

function lerVeredito(userId: string, janelaMs: number): VereditoGuardado | null {
  const item = vereditos.get(userId)
  if (!item) return null
  if (Date.now() - item.guardadoEm > janelaMs) return null
  return item
}

function guardarVeredito(userId: string, estado: ManualClinicoAccessState) {
  if (estado.reason !== 'purchased' && estado.reason !== 'included_plan') return
  const agora = Date.now()
  limparVereditos(agora)
  vereditos.set(userId, {
    motivo: estado.reason,
    planoIncluso: estado.includedPlan ?? null,
    guardadoEm: agora,
  })
}

/** Sessão isolada do banco: falhar aqui é "não há sessão", não "erro fatal". */
async function sessaoDaRequisicao(): Promise<TokenPayload | null> {
  try {
    return await getSession()
  } catch (erro) {
    // eslint-disable-next-line no-console
    console.error('[histologia] falha ao ler a sessão:', erro)
    return null
  }
}

/**
 * Consulta o veredito no banco. Uma segunda tentativa porque a falha típica
 * aqui é `serverSelectionTimeoutMS` numa lambda fria ou numa eleição do Atlas —
 * some sozinha em milissegundos, e insistir uma vez custa menos do que mandar
 * um assinante para a página de vendas.
 */
async function consultarBanco(sessao: TokenPayload | null) {
  let ultimoErro: unknown
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const db = await getDb()
      const config = await getManualClinicoConfig(db)
      // 'histologia' é o módulo deste manual dentro das permissões do plano:
      // um plano pode incluir o Manual Clínico sem incluir a Histologia.
      const estado = await getManualClinicoAccess(db, sessao, config, 'histologia')
      return { estado, produto: serializeManualClinicoProduct(config) }
    } catch (erro) {
      ultimoErro = erro
    }
  }
  throw ultimoErro
}

export async function verificarAcessoAHistologia(): Promise<AcessoAHistologia> {
  if (!histologiaEhPrivativa()) {
    return { autenticado: false, liberado: true, motivo: 'gratuito', planoIncluso: null, produto: null }
  }

  const sessao = await sessaoDaRequisicao()
  const autenticado = !!sessao?.userId

  // Admin: o veredito está no próprio JWT. Nada de banco no caminho.
  if (sessao?.role === 'admin') {
    return { autenticado: true, liberado: true, motivo: 'admin', planoIncluso: null, produto: null }
  }

  // Veredito positivo recente: evita repetir a mesma consulta a cada lâmina,
  // a cada busca e a cada carregamento de índice.
  if (sessao?.userId) {
    const guardado = lerVeredito(sessao.userId, VEREDITO_TTL_MS)
    if (guardado) {
      return {
        autenticado: true,
        liberado: true,
        motivo: guardado.motivo,
        planoIncluso: guardado.planoIncluso,
        produto: null,
      }
    }
  }

  try {
    const { estado, produto } = await consultarBanco(sessao)
    if (sessao?.userId) guardarVeredito(sessao.userId, estado)

    return {
      autenticado,
      // `free_pathology` é a cota de patologias avulsas do Manual Clínico e não
      // diz nada sobre a Histologia: quem chega por ela continua do lado de
      // fora. Só acesso pleno abre o módulo.
      liberado: estado.hasFullAccess,
      motivo: estado.hasFullAccess
        ? (estado.reason as AcessoAHistologia['motivo'])
        : autenticado
          ? 'locked'
          : 'guest',
      planoIncluso: estado.includedPlan ?? null,
      produto,
    }
  } catch (erro) {
    // eslint-disable-next-line no-console
    console.error('[histologia] falha ao verificar acesso:', erro)

    // Tolerância: quem já foi confirmado assinante há pouco não perde o acesso
    // por causa de um incidente de banco. Quem nunca passou pelo portão não
    // entra por aqui — a falha continua fechada para quem não pagou.
    if (sessao?.userId) {
      const guardado = lerVeredito(sessao.userId, GRACA_MS)
      if (guardado) {
        return {
          autenticado: true,
          liberado: true,
          motivo: 'tolerancia',
          planoIncluso: guardado.planoIncluso,
          produto: null,
        }
      }
    }

    return { autenticado, liberado: false, motivo: 'indisponivel', planoIncluso: null, produto: null }
  }
}

/**
 * Mesmo veredito, no recorte que as rotas de dados precisam.
 *
 * As rotas do módulo (índice de busca, busca, gabarito e o conteúdo de cada
 * página em casco estático) servem o acervo em JSON. Sem elas fechadas junto,
 * o portão da página seria um muro com a porta
 * dos fundos aberta: bastaria chamar `/api/manual-clinico/histologia/busca` para
 * varrer os 7.453 rótulos de estrutura sem assinar nada.
 *
 * Passa pelo mesmo caminho da página — inclusive cache e tolerância — porque o
 * pior sintoma da versão anterior aparecia justamente aqui: a busca do assinante
 * respondendo 404 no meio do estudo, sem nada na tela explicando por quê.
 */
export async function histologiaLiberadaNaRequisicao(): Promise<boolean> {
  if (!histologiaEhPrivativa()) return true
  return (await verificarAcessoAHistologia()).liberado
}

/**
 * O veredito no recorte que a vitrine desenha: quem está do lado de fora, por
 * quê, e o preço. Quem recebe isto é a home (`/api/manual-clinico/histologia/inicio`)
 * quando o portão não abre.
 */
export function acessoDaVitrine(acesso: AcessoAHistologia): AcessoDaVitrine {
  return {
    autenticado: acesso.autenticado,
    motivo:
      acesso.motivo === 'indisponivel' ? 'indisponivel' : acesso.autenticado ? 'locked' : 'guest',
    produto: acesso.produto ? produtoDaVitrine(acesso.produto) : null,
  }
}

/**
 * Preço e planos do Manual Clínico para a vitrine de quem chega sem sessão.
 *
 * É o mesmo produto que `verificarAcessoAHistologia` devolve ao visitante, sem
 * passar pela sessão: o visitante é resolvido no middleware e recebe a vitrine
 * estática, que pede só isto. Igual para todo mundo — por isso pode ficar no
 * cache da borda (ver `/api/manual-clinico/histologia/oferta`).
 */
export async function ofertaDaHistologia(): Promise<ProdutoDaVitrine> {
  const db = await getDb()
  return produtoDaVitrine(serializeManualClinicoProduct(await getManualClinicoConfig(db)))
}

function produtoDaVitrine(produto: ManualClinicoPublicProduct): ProdutoDaVitrine {
  return {
    label: produto.label,
    ctaText: produto.ctaText,
    isActive: produto.isActive,
    currentPrice: produto.currentPrice,
    price: produto.price,
    hasActivePromotion: produto.hasActivePromotion,
    pricingEventId: produto.pricingEventId ?? null,
    plans: produto.plans.map((plano) => ({
      key: plano.key,
      label: plano.label,
      durationMonths: plano.durationMonths,
      price: plano.price,
      enabled: plano.enabled,
      pricingEventId: plano.pricingEventId,
    })),
  }
}
