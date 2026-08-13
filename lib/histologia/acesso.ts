import 'server-only'

import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
  type ManualClinicoPublicProduct,
} from '@/lib/manual-clinico-product'

import { histologiaEhPrivativa } from './licenca'

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
 * Então o portão é aplicado **na página**, que é o único lugar onde `redirect()`
 * interrompe a renderização antes de existir o que serializar:
 *
 * - a home do módulo chama `verificarAcessoAHistologia()` e devolve a vitrine no
 *   lugar do conteúdo, mantendo a landing na URL canônica da seção;
 * - toda outra página da árvore abre com `exigirAcessoAHistologia()`, que manda
 *   quem não assina para essa mesma home — e, portanto, para a vitrine.
 *
 * Uma linha por página é o preço de não vazar. O teste em
 * `__tests__/histologia/acervo.test.ts` falha se alguma página da árvore
 * esquecer a linha, que é o erro que essa forma de portão permite cometer.
 *
 * ## Quando o banco cai
 *
 * O portão fecha, mas a página não. Sem veredito não dá para presumir acesso —
 * isso entregaria o acervo a qualquer um durante um incidente. O que a falha
 * derruba é só o preço: `produto` volta `null` e a vitrine se vira sem ele,
 * mostrando o que a seção é em vez de um valor que não pôde ser lido.
 */
export interface AcessoAHistologia {
  /** Há sessão? Muda o texto da vitrine, não o veredito. */
  autenticado: boolean
  /** O conteúdo do módulo pode ser servido a esta requisição? */
  liberado: boolean
  /** Motivo do veredito, para log e para a vitrine dizer a coisa certa. */
  motivo: 'gratuito' | 'admin' | 'purchased' | 'included_plan' | 'locked' | 'guest' | 'indisponivel'
  /** Cargo que incluiu o acesso ('plus'), quando foi por aí que veio. */
  planoIncluso: string | null
  /** Produto e planos para a vitrine montar o preço. `null` se o banco falhou. */
  produto: ManualClinicoPublicProduct | null
}

export async function verificarAcessoAHistologia(): Promise<AcessoAHistologia> {
  if (!histologiaEhPrivativa()) {
    return { autenticado: false, liberado: true, motivo: 'gratuito', planoIncluso: null, produto: null }
  }

  try {
    const [db, sessao] = await Promise.all([getDb(), getSession()])
    const config = await getManualClinicoConfig(db)
    const estado = await getManualClinicoAccess(db, sessao, config)

    return {
      autenticado: !!sessao?.userId,
      // `free_pathology` é a cota de patologias avulsas do Manual Clínico e não
      // diz nada sobre a Histologia: quem chega por ela continua do lado de
      // fora. Só acesso pleno abre o módulo.
      liberado: estado.hasFullAccess,
      motivo: estado.hasFullAccess
        ? (estado.reason as AcessoAHistologia['motivo'])
        : sessao?.userId
          ? 'locked'
          : 'guest',
      planoIncluso: estado.includedPlan ?? null,
      produto: serializeManualClinicoProduct(config),
    }
  } catch (erro) {
    // eslint-disable-next-line no-console
    console.error('[histologia] falha ao verificar acesso:', erro)
    return { autenticado: false, liberado: false, motivo: 'indisponivel', planoIncluso: null, produto: null }
  }
}

/** Onde a vitrine mora: a home do módulo, que é a URL canônica da seção. */
export const ROTA_DA_VITRINE = '/manual-clinico/histologia'

/**
 * Portão das páginas internas do módulo.
 *
 * Chame na **primeira linha** da página, antes de tocar no repositório. Sem
 * acesso, `redirect()` lança e a renderização para ali — nada da lâmina chega a
 * existir, nem no HTML nem no payload RSC.
 *
 * Não devolve o veredito de propósito: página interna não tem o que fazer com
 * "está trancado" além de sair. Quem precisa do veredito para *desenhar* algo é
 * só a home, e ela chama `verificarAcessoAHistologia()` direto.
 */
export async function exigirAcessoAHistologia(): Promise<void> {
  if (!histologiaEhPrivativa()) return
  const acesso = await verificarAcessoAHistologia()
  if (!acesso.liberado) redirect(ROTA_DA_VITRINE)
}

/**
 * Mesmo veredito, no recorte que as rotas de dados precisam.
 *
 * As rotas do módulo (índice de busca, busca e gabarito) servem o acervo em
 * JSON. Sem elas fechadas junto, o portão da página seria um muro com a porta
 * dos fundos aberta: bastaria chamar `/api/manual-clinico/histologia/busca` para
 * varrer os 7.453 rótulos de estrutura sem assinar nada.
 *
 * Não carrega o produto — quem só precisa saber "pode ou não" não deveria pagar
 * a serialização do catálogo de planos a cada busca digitada.
 */
export async function histologiaLiberadaNaRequisicao(): Promise<boolean> {
  if (!histologiaEhPrivativa()) return true

  try {
    const [db, sessao] = await Promise.all([getDb(), getSession()])
    const estado = await getManualClinicoAccess(db, sessao)
    return estado.hasFullAccess
  } catch (erro) {
    // eslint-disable-next-line no-console
    console.error('[histologia] falha ao verificar acesso na rota:', erro)
    // Falha fecha. Um incidente de banco não pode virar liberação geral do
    // acervo — e a página já explica ao assinante que é temporário.
    return false
  }
}
