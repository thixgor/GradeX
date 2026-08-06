import { Fragment } from 'react'

/**
 * Renderiza o negrito em `**texto**` sem trazer uma biblioteca de markdown.
 *
 * O conteúdo clínico usa negrito com parcimônia e com intenção — marcar o ponto
 * de corte, o limite de segurança, a frase que muda a conduta. Suportar apenas
 * essa marca mantém o texto legível no código-fonte e impede que o conteúdo
 * derive para HTML arbitrário.
 */
export function TextoRico({ children, className }: { children: string; className?: string }) {
  const partes = children.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span className={className}>
      {partes.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} className="font-semibold text-foreground">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </span>
  )
}
