import { Fragment } from 'react'

/**
 * Ênfase inline na prosa do módulo.
 *
 * Os textos de `lib/semiologia` marcam a palavra que carrega a decisão com
 * `**asteriscos**` — "o achado é a **parada** da inspiração", "edema **sem**
 * cacifo". É a única marcação que a prosa usa, e é deliberado: um Markdown
 * completo convidaria a formatar em vez de escrever. Este componente resolve
 * só esse par, e renderiza tudo o mais como texto puro.
 */
export function Enfase({ texto }: { texto: string }) {
  if (!texto.includes('**')) return <>{texto}</>
  const partes = texto.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {partes.map((parte, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {parte}
          </strong>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        ),
      )}
    </>
  )
}
