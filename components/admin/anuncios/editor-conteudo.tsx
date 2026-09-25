'use client'

/**
 * Campo do conteúdo do modal, com barra de formatação.
 *
 * Antes era um textarea de HTML cru: Enter não quebrava linha na tela e negrito
 * pedia `<strong>` digitado à mão. Agora os botões (e Ctrl+B / Ctrl+I / Ctrl+U /
 * Ctrl+K) escrevem a marcação simples de `lib/anuncio-formatacao.ts` em volta do
 * trecho selecionado, e a aba "Visualizar" mostra o resultado com o mesmo
 * render do modal público.
 *
 * As inserções passam por `execCommand('insertText')` quando o navegador deixa:
 * é o único jeito de o Ctrl+Z continuar desfazendo o que o botão fez.
 */

import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import {
  Bold,
  Eye,
  Heading,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  PenLine,
  Quote,
  Strikethrough,
  Type,
  Underline,
  type LucideIcon,
} from 'lucide-react'

import { Textarea } from '@/components/ui/textarea'
import { CONTEUDO_CLASSES, renderizarConteudoModal } from '@/components/anuncio-modal'
import { cn } from '@/lib/utils'

interface EditorConteudoProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

type Acao =
  | { tipo: 'envolver'; marca: string; fim?: string; exemplo: string }
  | { tipo: 'linha'; prefixo: string | ((indice: number) => string); exemplo: string }
  | { tipo: 'link' }
  | { tipo: 'divisoria' }

interface Botao {
  rotulo: string
  atalho?: string
  icone: LucideIcon
  acao: Acao
}

const GRUPOS: Botao[][] = [
  [
    { rotulo: 'Negrito', atalho: 'Ctrl+B', icone: Bold, acao: { tipo: 'envolver', marca: '**', exemplo: 'negrito' } },
    { rotulo: 'Itálico', atalho: 'Ctrl+I', icone: Italic, acao: { tipo: 'envolver', marca: '*', exemplo: 'itálico' } },
    { rotulo: 'Sublinhado', atalho: 'Ctrl+U', icone: Underline, acao: { tipo: 'envolver', marca: '++', exemplo: 'sublinhado' } },
    { rotulo: 'Riscado', icone: Strikethrough, acao: { tipo: 'envolver', marca: '~~', exemplo: 'riscado' } },
    { rotulo: 'Destaque', icone: Highlighter, acao: { tipo: 'envolver', marca: '==', exemplo: 'destaque' } },
  ],
  [
    { rotulo: 'Título', icone: Heading, acao: { tipo: 'linha', prefixo: '# ', exemplo: 'Título' } },
    { rotulo: 'Lista', icone: List, acao: { tipo: 'linha', prefixo: '- ', exemplo: 'Item' } },
    {
      rotulo: 'Lista numerada',
      icone: ListOrdered,
      acao: { tipo: 'linha', prefixo: (indice) => `${indice + 1}. `, exemplo: 'Item' },
    },
    { rotulo: 'Citação', icone: Quote, acao: { tipo: 'linha', prefixo: '> ', exemplo: 'Depoimento' } },
    { rotulo: 'Letra miúda', icone: Type, acao: { tipo: 'linha', prefixo: '-# ', exemplo: 'Condições' } },
  ],
  [
    { rotulo: 'Link', atalho: 'Ctrl+K', icone: Link2, acao: { tipo: 'link' } },
    { rotulo: 'Linha divisória', icone: Minus, acao: { tipo: 'divisoria' } },
  ],
]

const ATALHOS: Record<string, Acao> = {
  b: GRUPOS[0][0].acao,
  i: GRUPOS[0][1].acao,
  u: GRUPOS[0][2].acao,
  k: GRUPOS[2][0].acao,
}

/** Prefixos de linha reconhecidos — para trocar um pelo outro em vez de empilhar. */
const PREFIXO_DE_LINHA = /^(#{1,3}\s|-#\s|[-*+•]\s|\d{1,3}[.)]\s|>\s?)/

const COLA: Array<{ escreva: string; vira: string }> = [
  { escreva: '**negrito**', vira: 'negrito' },
  { escreva: '*itálico*', vira: 'itálico' },
  { escreva: '++sublinhado++', vira: 'sublinhado' },
  { escreva: '~~riscado~~', vira: 'riscado' },
  { escreva: '==destaque==', vira: 'marca-texto' },
  { escreva: '[texto](/materiais)', vira: 'link' },
  { escreva: '# Título', vira: 'título (### subtítulo)' },
  { escreva: '- item', vira: 'lista (1. numerada)' },
  { escreva: '> texto', vira: 'citação' },
  { escreva: '-# texto', vira: 'letra miúda' },
  { escreva: '---', vira: 'linha divisória' },
]

export function EditorConteudo({ id, value, onChange, placeholder }: EditorConteudoProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [aba, setAba] = useState<'escrever' | 'visualizar'>('escrever')

  const previa = useMemo(
    () => (aba === 'visualizar' ? renderizarConteudoModal(value) : ''),
    [aba, value],
  )

  /** Troca `[de, ate)` por `texto` e seleciona `[selInicio, selFim)` do novo valor. */
  function substituir(de: number, ate: number, texto: string, selInicio: number, selFim: number) {
    const campo = ref.current
    if (!campo) return

    campo.focus()
    campo.setSelectionRange(de, ate)

    let inserido = false
    try {
      inserido = document.execCommand('insertText', false, texto)
    } catch {
      inserido = false
    }
    if (!inserido || campo.value !== value.slice(0, de) + texto + value.slice(ate)) {
      onChange(value.slice(0, de) + texto + value.slice(ate))
    }

    requestAnimationFrame(() => {
      campo.focus()
      campo.setSelectionRange(selInicio, selFim)
    })
  }

  function aplicar(acao: Acao) {
    const campo = ref.current
    if (!campo) return

    const inicio = campo.selectionStart
    const fim = campo.selectionEnd
    const selecionado = value.slice(inicio, fim)

    if (acao.tipo === 'envolver') {
      const abre = acao.marca
      const fecha = acao.fim ?? acao.marca

      // Já envolvido? Clicar de novo desfaz.
      if (value.slice(inicio - abre.length, inicio) === abre && value.slice(fim, fim + fecha.length) === fecha) {
        substituir(inicio - abre.length, fim + fecha.length, selecionado, inicio - abre.length, fim - abre.length)
        return
      }

      // Seleção com espaço na borda (duplo clique costuma pegar) fica fora da marca:
      // `** texto**` não seria reconhecido como negrito.
      const miolo = selecionado.trim() || acao.exemplo
      const antes = selecionado.match(/^\s*/)?.[0] ?? ''
      const depois = selecionado.trim() ? (selecionado.match(/\s*$/)?.[0] ?? '') : ''
      const texto = `${antes}${abre}${miolo}${fecha}${depois}`
      const selInicio = inicio + antes.length + abre.length
      substituir(inicio, fim, texto, selInicio, selInicio + miolo.length)
      return
    }

    if (acao.tipo === 'linha') {
      const linhaInicio = value.lastIndexOf('\n', inicio - 1) + 1
      const quebraFinal = value.indexOf('\n', Math.max(fim - (fim > inicio && value[fim - 1] === '\n' ? 1 : 0), inicio))
      const linhaFim = quebraFinal === -1 ? value.length : quebraFinal
      const linhas = value.slice(linhaInicio, linhaFim).split('\n')

      const prefixoDe = (indice: number) =>
        typeof acao.prefixo === 'function' ? acao.prefixo(indice) : acao.prefixo
      const temEste = (linha: string, indice: number) =>
        typeof acao.prefixo === 'function' ? /^\d{1,3}[.)]\s/.test(linha) : linha.startsWith(prefixoDe(indice))

      const todasTem = linhas.every((linha, indice) => !linha.trim() || temEste(linha, indice))

      let contador = 0
      const novas = linhas.map((linha) => {
        if (!linha.trim()) return linha
        const semPrefixo = linha.replace(PREFIXO_DE_LINHA, '')
        if (todasTem) return semPrefixo
        return prefixoDe(contador++) + (semPrefixo || acao.exemplo)
      })

      // Linha vazia sem seleção: escreve o exemplo para mostrar o formato.
      if (linhas.length === 1 && !linhas[0].trim() && !todasTem) {
        novas[0] = prefixoDe(0) + acao.exemplo
        const texto = novas[0]
        substituir(linhaInicio, linhaFim, texto, linhaInicio + texto.length - acao.exemplo.length, linhaInicio + texto.length)
        return
      }

      const texto = novas.join('\n')
      substituir(linhaInicio, linhaFim, texto, linhaInicio, linhaInicio + texto.length)
      return
    }

    if (acao.tipo === 'link') {
      const pareceUrl = /^(https?:\/\/|www\.|\/)\S*$/i.test(selecionado.trim())
      if (pareceUrl) {
        const texto = `[texto do link](${selecionado.trim()})`
        substituir(inicio, fim, texto, inicio + 1, inicio + 1 + 'texto do link'.length)
      } else {
        const rotulo = selecionado.trim() || 'texto do link'
        const texto = `[${rotulo}](https://)`
        const urlInicio = inicio + rotulo.length + 3
        substituir(inicio, fim, texto, urlInicio, urlInicio + 'https://'.length)
      }
      return
    }

    // Divisória: sempre em linha própria, com linha em branco em volta.
    const antes = value.slice(0, inicio)
    const prefixo = !antes ? '' : antes.endsWith('\n\n') ? '' : antes.endsWith('\n') ? '\n' : '\n\n'
    const texto = `${prefixo}---\n\n`
    substituir(inicio, fim, texto, inicio + texto.length, inicio + texto.length)
  }

  function aoTeclar(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return
    const acao = ATALHOS[event.key.toLowerCase()]
    if (!acao) return
    event.preventDefault()
    aplicar(acao)
  }

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 px-1.5 py-1">
        <div role="tablist" className="mr-1 flex rounded-md bg-background/80 p-0.5">
          <AbaBotao ativo={aba === 'escrever'} onClick={() => setAba('escrever')} icone={PenLine} rotulo="Escrever" />
          <AbaBotao ativo={aba === 'visualizar'} onClick={() => setAba('visualizar')} icone={Eye} rotulo="Visualizar" />
        </div>

        {GRUPOS.map((grupo, indice) => (
          <div key={indice} className="flex items-center gap-0.5 border-l border-border/70 pl-1">
            {grupo.map((botao) => (
              <button
                key={botao.rotulo}
                type="button"
                title={botao.atalho ? `${botao.rotulo} (${botao.atalho})` : botao.rotulo}
                aria-label={botao.rotulo}
                disabled={aba !== 'escrever'}
                // Sem isso o clique tira o foco do campo e a seleção se perde.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => aplicar(botao.acao)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]"
              >
                <botao.icone className="h-4 w-4" />
              </button>
            ))}
          </div>
        ))}
      </div>

      {aba === 'escrever' ? (
        <Textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={aoTeclar}
          placeholder={placeholder}
          rows={9}
          className="min-h-[180px] resize-y rounded-none border-0 leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      ) : (
        <div className="max-h-[360px] min-h-[180px] overflow-y-auto bg-white px-4 py-3 dark:bg-[#07110d]">
          {value.trim() ? (
            <div className={CONTEUDO_CLASSES} dangerouslySetInnerHTML={{ __html: previa }} />
          ) : (
            <p className="text-sm text-muted-foreground">Nada escrito ainda.</p>
          )}
        </div>
      )}

      <details className="border-t bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none font-semibold">
          Enter quebra a linha; linha em branco separa parágrafos. Ver formatações
        </summary>
        <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
          {COLA.map((item) => (
            <div key={item.escreva} className="flex min-w-0 items-baseline gap-2">
              <dt>
                <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px] text-foreground">
                  {item.escreva}
                </code>
              </dt>
              <dd className="truncate">{item.vira}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2">
          URL solta vira link sozinha. HTML simples (p, strong, ul...) continua aceito; o resto é
          removido na exibição. Para mostrar um símbolo sem formatar, use barra: <code>\*</code>.
        </p>
      </details>
    </div>
  )
}

function AbaBotao({
  ativo,
  onClick,
  icone: Icone,
  rotulo,
}: {
  ativo: boolean
  onClick: () => void
  icone: LucideIcon
  rotulo: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativo}
      onClick={onClick}
      className={cn(
        'flex h-7 items-center gap-1 rounded px-2 text-xs font-semibold transition',
        ativo ? 'bg-[#468152] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icone className="h-3.5 w-3.5" />
      {rotulo}
    </button>
  )
}
