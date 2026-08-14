import ManualClinicoCheckoutView, { type PlanKey } from './checkout-view'

/**
 * O `?plan=` é resolvido aqui, no servidor, e entregue pronto à tela.
 *
 * Lê-lo com `useSearchParams()` dentro do componente fazia o Next desistir de
 * renderizar a rota no servidor: o checkout chegava ao navegador como um
 * spinner de tela cheia, e só virava página de compra depois que o JS baixasse
 * e montasse tudo. Agora a página vem montada, e o único carregando que resta
 * é o dos preços — que dependem mesmo de uma consulta.
 *
 * A rota é dinâmica porque o conteúdo depende da query; não haveria o que
 * guardar em cache de qualquer forma.
 */
export const dynamic = 'force-dynamic'

const PLANOS: PlanKey[] = ['semestral', 'anual', 'vitalicio']

function planoDaQuery(value: string | string[] | undefined): PlanKey | null {
  const bruto = Array.isArray(value) ? value[0] : value
  return PLANOS.includes(bruto as PlanKey) ? (bruto as PlanKey) : null
}

export default function ManualClinicoCheckoutPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  return <ManualClinicoCheckoutView planQuery={planoDaQuery(searchParams?.plan)} />
}
