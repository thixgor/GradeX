import Link from 'next/link'
import { Check, ChevronLeft } from 'lucide-react'
import './checkout-vidro.css'

/**
 * O fundo e a cabeça de toda tela de pagamento.
 *
 * Todos os checkouts (plano, assinatura, material, loja, Manual Clínico,
 * compra sem login, upgrade) passam a morar no mesmo mundo: a aurora com as
 * cores da marca atrás e vidro por cima — o mesmo das telas de entrar e da
 * landing. Quem chega da página de vendas não sente que trocou de site na
 * hora de pagar, que é exatamente onde a desconfiança aparece.
 *
 * Só apresentação: nenhum destes componentes busca, guarda ou decide nada.
 */
export function MundoDoCheckout({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ck-mundo ${className}`}>
      <div className="ck-aurora" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      {children}
    </div>
  )
}

export type PassoDoCheckout = 'escolha' | 'dados' | 'pagamento' | 'acesso'

const ROTULOS: Record<PassoDoCheckout, string> = {
  escolha: 'Escolha',
  dados: 'Seus dados',
  pagamento: 'Pagamento',
  acesso: 'Acesso liberado',
}

/**
 * Onde a pessoa está e quanto falta — três ou quatro pontos, nunca um passo
 * escondido depois do "último".
 */
export function TrilhaDoCheckout({
  passos = ['escolha', 'pagamento', 'acesso'],
  atual,
  className = '',
}: {
  passos?: PassoDoCheckout[]
  atual: PassoDoCheckout
  className?: string
}) {
  const indice = passos.indexOf(atual)
  return (
    <ol className={`ck-trilha ${className}`} aria-label="Etapas da compra">
      {passos.map((passo, i) => {
        const estado = i < indice ? 'feito' : i === indice ? 'agora' : 'depois'
        return (
          <li key={passo} data-estado={estado} aria-current={estado === 'agora' ? 'step' : undefined}>
            <span className="ck-trilha-ponto" aria-hidden>
              {estado === 'feito' ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </span>
            <span className={estado === 'agora' ? '' : 'hidden sm:inline'}>{ROTULOS[passo]}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** Voltar (pílula de vidro), trilha e título — a mesma cabeça em todo checkout. */
export function CabecaDoCheckout({
  titulo,
  subtitulo,
  voltar,
  trilha,
  className = '',
}: {
  titulo: React.ReactNode
  subtitulo?: React.ReactNode
  voltar?: { rotulo: string; href?: string; onClick?: () => void }
  trilha?: React.ReactNode
  className?: string
}) {
  return (
    <header className={`ck-entra ${className}`}>
      {(voltar || trilha) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {voltar ? (
            voltar.href ? (
              <Link href={voltar.href} className="ck-voltar">
                <ChevronLeft className="h-4 w-4" aria-hidden /> {voltar.rotulo}
              </Link>
            ) : (
              <button type="button" onClick={voltar.onClick} className="ck-voltar">
                <ChevronLeft className="h-4 w-4" aria-hidden /> {voltar.rotulo}
              </button>
            )
          ) : (
            <span />
          )}
          {trilha}
        </div>
      )}
      <h1 className="ck-h1">{titulo}</h1>
      {subtitulo && <p className="ck-sub">{subtitulo}</p>}
    </header>
  )
}
