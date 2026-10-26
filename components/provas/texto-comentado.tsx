import { Fragment, type ReactNode } from 'react'

/**
 * A resposta comentada como aula: linhas que são só `**Título**` viram
 * cabeçalho de seção, `**trecho**` no meio da frase vira negrito. É o mesmo
 * texto que o PDF desenha (`drawRichLine` entende o `**`), então tela e papel
 * dizem a mesma coisa do mesmo jeito.
 */

function inline(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*\n]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? <strong key={i}>{parte.slice(2, -2)}</strong> : <Fragment key={i}>{parte}</Fragment>,
  )
}

export function TextoComentado({ texto, className }: { texto: string; className?: string }) {
  const limpo = texto.replace(/\\nl/g, '\n').replace(/\\n/g, '\n')
  const blocos = limpo.split(/\n{2,}/)
  return (
    <div className={className}>
      {blocos.map((bloco, i) => {
        const linhas = bloco.split('\n')
        const titulo = /^\*\*[^*]+\*\*$/.test(linhas[0].trim()) ? linhas[0].trim().slice(2, -2) : null
        const corpo = titulo ? linhas.slice(1) : linhas
        return (
          <section key={i} className={i > 0 ? 'mt-4' : undefined}>
            {titulo ? <p className="mb-1 font-sans text-[12.5px] font-bold uppercase tracking-wide opacity-80">{titulo}</p> : null}
            {corpo.length ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{inline(corpo.join('\n'))}</p> : null}
          </section>
        )
      })}
    </div>
  )
}
