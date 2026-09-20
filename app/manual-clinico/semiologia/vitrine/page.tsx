import type { Metadata } from 'next'
import { VitrineSozinha } from '@/components/semiologia/area'
import { absoluteUrl } from '@/lib/seo'
import { nomeDoAlvo } from '@/lib/semiologia/alvo'
import { RESUMO_DA_SEMIOLOGIA } from '@/lib/semiologia/resumo'
import { RAIZ } from '@/lib/semiologia/rotas'

const DESCRICAO_PADRAO =
  'Sinais do exame físico com mecanismo, manobra e desempenho diagnóstico; otoscopia, fundo de olho, orofaringe e rinoscopia; e as janelas do ultrassom à beira do leito. As figuras são geradas por parâmetro: você arrasta e vê o achado nascer no limiar clínico.'

/**
 * Título e canônico do endereço que a pessoa realmente abriu.
 *
 * A mesma página atende dezenas de endereços do sitemap por reescrita. Sem
 * isto, todos eles se anunciariam com o mesmo título — conteúdo duplicado
 * para o buscador e um resultado inútil para quem procurou "sinal de Murphy".
 * O canônico aponta para o endereço original, e não para `/vitrine`, porque é
 * ele que está na barra e é ele que o sitemap declara.
 */
export function generateMetadata({
  searchParams,
}: {
  searchParams?: { de?: string | string[] }
}): Metadata {
  const de = caminhoOriginal(searchParams?.de)
  const alvo = nomeDoAlvo(de)
  const titulo = alvo
    ? `${alvo} - Manual de Semiologia | Manual Clínico`
    : 'Manual de Semiologia - o exame físico, a beira do leito e o POCUS | Manual Clínico'

  return {
    title: titulo,
    description: alvo
      ? `${alvo} no Manual de Semiologia: definição operacional, manobra, mecanismo, o que muda na conduta e onde o achado engana. ${DESCRICAO_PADRAO}`
      : DESCRICAO_PADRAO,
    alternates: { canonical: absoluteUrl(de ?? RAIZ) },
    openGraph: {
      title: alvo ? `${alvo} — Manual de Semiologia` : 'Manual de Semiologia — DomineAqui',
      description: 'O exame físico, a imagem à beira do leito e o POCUS num atlas interativo.',
      url: absoluteUrl(de ?? RAIZ),
    },
  }
}

/** O `?de=` só vale se for mesmo um caminho do módulo — nunca URL de fora. */
function caminhoOriginal(bruto?: string | string[]): string | null {
  const valor = Array.isArray(bruto) ? bruto[0] : bruto
  if (!valor || !valor.startsWith(`${RAIZ}`)) return null
  // Barra dupla no começo vira "//host" no navegador: caminho, e só caminho.
  if (valor.startsWith('//')) return null
  return valor.split('?')[0]
}

// O preço vem do banco, e a página mostra o que estiver valendo agora.
export const dynamic = 'force-dynamic'

/**
 * A página que o visitante sem conta recebe no lugar do módulo.
 *
 * O middleware reescreve para cá qualquer endereço sob
 * `/manual-clinico/semiologia` quando não há sessão — o endereço na barra
 * continua o que a pessoa abriu, então o link compartilhado no grupo de estudo
 * mostra a landing em vez de despejar alguém num formulário de login, que era
 * o que acontecia antes.
 *
 * Reescrita, e não `redirect`, por dois motivos: preserva o endereço, e
 * garante que a página do sinal nunca chega a ser montada. Um portão só no
 * cliente esconderia a ficha da tela e a entregaria no payload.
 *
 * Tudo que a landing desenha é montado **aqui**, no servidor: os números do
 * acervo e o preço do plano. É uma página de vendas — piscar um molde e só
 * então preencher os números seria perder a primeira dobra justamente para
 * quem ainda não sabe o que é isto.
 */
export default async function VitrineSemiologiaPage({
  searchParams,
}: {
  searchParams?: { de?: string | string[] }
}) {
  const de = caminhoOriginal(searchParams?.de)
  const produto = await lerProduto()

  return (
    <VitrineSozinha
      alvo={nomeDoAlvo(de)}
      resumo={RESUMO_DA_SEMIOLOGIA}
      planos={produto.planos}
      precoAvulso={produto.precoAvulso}
      produtoAtivo={produto.ativo}
    />
  )
}

/**
 * O preço, quando o banco responde.
 *
 * Falha de leitura não derruba a landing: sem preço ela mostra o texto de
 * "acesso liberado para assinantes" e o botão continua levando ao checkout,
 * que é onde o número real seria confirmado de qualquer jeito. Uma página de
 * vendas que devolve 500 porque o preço não veio é pior do que uma sem preço.
 *
 * Os dois módulos entram por `import()` dentro do `try` de propósito:
 * `lib/mongodb` lança na própria carga quando falta `MONGODB_URI`, e um
 * `import` no topo põe esse erro fora do alcance de qualquer `catch` — a
 * página inteira morreria antes de rodar uma linha.
 */
async function lerProduto() {
  try {
    const [{ getDb }, { getManualClinicoConfig, serializeManualClinicoProduct }] = await Promise.all([
      import('@/lib/mongodb'),
      import('@/lib/manual-clinico-product'),
    ])
    const config = await getManualClinicoConfig(await getDb())
    const produto = serializeManualClinicoProduct(config)
    return {
      planos: produto.plans ?? [],
      precoAvulso: produto.currentPrice ?? 0,
      ativo: produto.isActive !== false,
    }
  } catch (erro) {
    console.error('Vitrine da Semiologia: preço indisponível', erro)
    return { planos: [], precoAvulso: 0, ativo: false }
  }
}
