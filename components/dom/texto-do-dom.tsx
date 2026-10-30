import { Fragment, type CSSProperties, type ReactNode } from 'react'

/**
 * Markdown leve das respostas do Dom → elementos React. Só o que o prompt
 * permite: parágrafos, listas (`- ` e `1. `), **negrito** e *itálico*. Nada
 * de HTML: o texto vira nó de texto do React, então nenhuma resposta (nem uma
 * que o modelo fosse convencido a escrever com `<script>`) executa na página.
 */

function inline(texto: string, chave: string): ReactNode[] {
  const saida: ReactNode[] = []
  const re = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_)/g
  let ultimo = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) saida.push(texto.slice(ultimo, m.index))
    const bruto = m[0]
    const forte = bruto.startsWith('**') || bruto.startsWith('__')
    const miolo = bruto.slice(forte ? 2 : 1, forte ? -2 : -1)
    saida.push(forte ? <strong key={`${chave}-${i++}`}>{miolo}</strong> : <em key={`${chave}-${i++}`}>{miolo}</em>)
    ultimo = m.index + bruto.length
  }
  if (ultimo < texto.length) saida.push(texto.slice(ultimo))
  return saida
}

export function TextoDoDom({ texto, escalonar = false }: { texto: string; escalonar?: boolean }) {
  const blocos: ReactNode[] = []
  // Índice de cada parágrafo/item, para a revelação escalonada (`--k`).
  let ordem = 0
  const passo = () => (escalonar ? ({ ['--k' as string]: ordem++ } as CSSProperties) : undefined)
  const linhas = texto.replace(/\r/g, '').split('\n')
  let lista: { tipo: 'ul' | 'ol'; itens: string[] } | null = null
  let paragrafo: string[] = []

  const fecharParagrafo = () => {
    if (!paragrafo.length) return
    const k = `p${blocos.length}`
    blocos.push(
      <p key={k} style={passo()}>
        {paragrafo.map((l, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {inline(l, `${k}-${i}`)}
          </Fragment>
        ))}
      </p>,
    )
    paragrafo = []
  }
  const fecharLista = () => {
    if (!lista) return
    const k = `l${blocos.length}`
    const itens = lista.itens.map((it, i) => (
      <li key={i} style={passo()}>
        {inline(it, `${k}-${i}`)}
      </li>
    ))
    blocos.push(lista.tipo === 'ul' ? <ul key={k}>{itens}</ul> : <ol key={k}>{itens}</ol>)
    lista = null
  }

  for (const bruta of linhas) {
    const linha = bruta.trimEnd()
    const ul = linha.match(/^\s*[-*•]\s+(.*)$/)
    const ol = linha.match(/^\s*\d+[.)]\s+(.*)$/)
    if (ul || ol) {
      fecharParagrafo()
      const tipo = ul ? 'ul' : 'ol'
      if (lista && lista.tipo !== tipo) fecharLista()
      lista ??= { tipo, itens: [] }
      lista.itens.push((ul || ol)![1])
      continue
    }
    if (!linha.trim()) {
      fecharParagrafo()
      fecharLista()
      continue
    }
    fecharLista()
    paragrafo.push(linha.replace(/^#+\s*/, ''))
  }
  fecharParagrafo()
  fecharLista()
  return <>{blocos}</>
}
