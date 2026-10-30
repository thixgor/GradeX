import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { Formula, RE_EXPOENTE_SOLTO, RE_FORMULA } from './matematica'

/**
 * Markdown leve das respostas do Dom → elementos React. Só o que o prompt
 * permite: parágrafos, listas (`- ` e `1. `), **negrito**, *itálico* e
 * fórmulas (`$H^+/K^+$`, ver `matematica.tsx`). Nada
 * de HTML: o texto vira nó de texto do React, então nenhuma resposta (nem uma
 * que o modelo fosse convencido a escrever com `<script>`) executa na página.
 */

const MARCA = '\u0000'

/** Texto comum com as marcas das fórmulas de volta no lugar. */
function comFormulas(texto: string, formulas: string[], chave: string): ReactNode[] {
  if (!texto.includes(MARCA)) return [texto]
  return texto.split(new RegExp(`${MARCA}(\\d+)${MARCA}`)).map((parte, i) =>
    i % 2 ? <Formula key={`${chave}f${i}`} fonte={formulas[Number(parte)]} /> : parte,
  )
}

function inline(bruto: string, chave: string): ReactNode[] {
  // Fórmulas saem antes do negrito/itálico: `$CO_2$ e $H_2O$` não pode virar
  // itálico entre os dois "_". No lugar delas fica uma marca, devolvida no fim.
  const formulas: string[] = []
  const marcar = (fonte: string) => `${MARCA}${formulas.push(fonte) - 1}${MARCA}`
  const texto = bruto
    .replace(RE_FORMULA, (_t, parenteses?: string, antes?: string, cifrao?: string, ce?: string) =>
      parenteses !== undefined ? marcar(parenteses) : cifrao !== undefined ? (antes || '') + marcar(cifrao) : marcar(ce || ''),
    )
    .replace(RE_EXPOENTE_SOLTO, (_t, base: string, expoente: string) => base + marcar(`^${expoente}`))

  const saida: ReactNode[] = []
  const re = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_)/g
  let ultimo = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) saida.push(...comFormulas(texto.slice(ultimo, m.index), formulas, `${chave}-t${i}`))
    const trecho = m[0]
    const forte = trecho.startsWith('**') || trecho.startsWith('__')
    const miolo = comFormulas(trecho.slice(forte ? 2 : 1, forte ? -2 : -1), formulas, `${chave}-m${i}`)
    saida.push(forte ? <strong key={`${chave}-${i++}`}>{miolo}</strong> : <em key={`${chave}-${i++}`}>{miolo}</em>)
    ultimo = m.index + trecho.length
  }
  if (ultimo < texto.length) saida.push(...comFormulas(texto.slice(ultimo), formulas, `${chave}-t${i}`))
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
